import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LotteryNumbers {
  letter: string;
  superNumber: string;
  numbers: string[];
}

interface DrawResult {
  drawNumber: string;
  drawDate: string;
  format: 'new' | 'old' | 'special';
  mainNumbers: LotteryNumbers;
}

async function makeFirecrawlRequest(retryCount = 0): Promise<Response> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  const requestOptions = {
    url: 'https://www.nlb.lk/results/mega-power',
    formats: ['markdown']
  };

  try {
    console.log(`Making Firecrawl request (attempt ${retryCount + 1}):`, JSON.stringify(requestOptions, null, 2));
    
    if (retryCount > 0) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify(requestOptions)
    });

    console.log('Firecrawl response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      if (retryCount < 3) {
        console.log(`Attempt ${retryCount + 1} failed, retrying...`);
        return makeFirecrawlRequest(retryCount + 1);
      }
      
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    return response;
  } catch (error) {
    console.error(`Request attempt ${retryCount + 1} failed:`, error);
    if (retryCount < 3) {
      return makeFirecrawlRequest(retryCount + 1);
    }
    throw error;
  }
}

function parseMarkdownTable(markdown: string): DrawResult[] {
  const results: DrawResult[] = [];
  
  // Split the markdown into lines
  const lines = markdown.split('\n');
  
  // Find the table start (after headers)
  const tableStartIndex = lines.findIndex(line => line.includes('| Draw/Date |'));
  if (tableStartIndex === -1) return results;
  
  // Skip the header and separator lines
  const dataLines = lines.slice(tableStartIndex + 2);
  
  for (const line of dataLines) {
    if (!line.trim() || !line.startsWith('|')) continue;
    
    const [drawDateCell, resultsCell] = line.split('|').slice(1, 3).map(cell => cell.trim());
    if (!drawDateCell || !resultsCell) continue;
    
    // Parse draw number and date
    const drawMatch = drawDateCell.match(/\*\*(\d+)\*\*/);
    const dateMatch = drawDateCell.match(/<br>(.*)/);
    if (!drawMatch || !dateMatch) continue;
    
    const drawNumber = drawMatch[1];
    const drawDate = dateMatch[1];
    
    // Parse lottery numbers
    const numberLines = resultsCell.split('<br>');
    if (numberLines.length < 6) continue;
    
    const letter = numberLines[0].split('. ')[1];
    const superNumber = numberLines[1].split('. ')[1];
    const numbers = numberLines.slice(2, 6).map(line => line.split('. ')[1]);
    
    results.push({
      drawNumber,
      drawDate,
      format: 'new',
      mainNumbers: {
        letter,
        superNumber,
        numbers
      }
    });
  }
  
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting to scrape Mega Power results...');
    
    const response = await makeFirecrawlRequest();
    const responseData = await response.json();
    console.log('Firecrawl response:', JSON.stringify(responseData, null, 2));

    if (!responseData.success || !responseData.data?.markdown) {
      console.error('Invalid response format or missing markdown content');
      throw new Error('Failed to get markdown content from Firecrawl API');
    }

    const results = parseMarkdownTable(responseData.data.markdown);
    console.log(`Parsed ${results.length} results from markdown`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const result of results) {
      try {
        console.log(`Storing result for draw ${result.drawNumber}`);
        
        const { error: mainError } = await supabaseClient
          .from('mega_power_results')
          .upsert({
            draw_number: result.drawNumber,
            draw_date: result.drawDate,
            letter: result.mainNumbers.letter,
            super_number: result.mainNumbers.superNumber,
            number1: result.mainNumbers.numbers[0],
            number2: result.mainNumbers.numbers[1],
            number3: result.mainNumbers.numbers[2],
            number4: result.mainNumbers.numbers[3],
            format: result.format
          }, {
            onConflict: 'draw_number'
          });

        if (mainError) {
          console.error('Error storing main result:', mainError);
          throw mainError;
        }

        console.log(`Successfully stored result for draw ${result.drawNumber}`);
      } catch (error) {
        console.error(`Error processing draw ${result.drawNumber}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully scraped ${results.length} results` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});