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

interface SpecialNumbers {
  millionaire?: string[];
  fiveHundredK?: string[];
  lakshapathi?: string[];
}

interface DrawResult {
  drawNumber: string;
  drawDate: string;
  format: 'new' | 'old' | 'special';
  mainNumbers: LotteryNumbers;
  specialNumbers?: SpecialNumbers;
}

function parseMarkdownTable(markdown: string): DrawResult[] {
  const results: DrawResult[] = [];
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
    
    // Main numbers
    const letter = numberLines[0].split('. ')[1];
    const superNumber = numberLines[1].split('. ')[1];
    const numbers = numberLines.slice(2, 6).map(line => line.split('. ')[1]);

    // Special numbers
    const specialNumbers: SpecialNumbers = {};
    
    // Find Millionaire numbers
    const millionaireIndex = numberLines.findIndex(line => line.includes('Millionaire Lucky Number'));
    if (millionaireIndex !== -1) {
      specialNumbers.millionaire = numberLines
        .slice(millionaireIndex + 1, millionaireIndex + 7)
        .map(line => line.split('. ')[1]);
    }

    // Find 500,000 numbers
    const fiveHundredKIndex = numberLines.findIndex(line => line.includes('500,000/= Lucky Number'));
    if (fiveHundredKIndex !== -1) {
      specialNumbers.fiveHundredK = numberLines
        .slice(fiveHundredKIndex + 1, fiveHundredKIndex + 7)
        .map(line => line.split('. ')[1]);
    }

    // Find Lakshapathi numbers
    const lakshapathiIndex = numberLines.findIndex(line => line.includes('Lakshapathi Double Chance No'));
    if (lakshapathiIndex !== -1) {
      const remainingLines = numberLines.slice(lakshapathiIndex + 1);
      const lakshapathiNumbers = [];
      for (const line of remainingLines) {
        if (line.includes('Lucky Number')) break;
        if (!line.includes('. ')) break;
        lakshapathiNumbers.push(line.split('. ')[1]);
      }
      specialNumbers.lakshapathi = lakshapathiNumbers;
    }
    
    results.push({
      drawNumber,
      drawDate,
      format: Object.keys(specialNumbers).length > 0 ? 'special' : 'new',
      mainNumbers: {
        letter,
        superNumber,
        numbers
      },
      specialNumbers
    });
  }
  
  return results;
}

async function storeResults(supabaseClient: any, result: DrawResult) {
  console.log(`Processing draw ${result.drawNumber}`);
  
  try {
    // Store main results
    const { data: mainResult, error: mainError } = await supabaseClient
      .from('mega_power_results')
      .upsert({
        id: result.drawNumber, // Use draw number as primary key
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
        onConflict: 'id'
      })
      .select()
      .single();

    if (mainError) throw mainError;

    // If there are special numbers, store them
    if (result.specialNumbers) {
      const drawId = result.drawNumber; // Use draw number as the reference

      if (result.specialNumbers.millionaire) {
        console.log('Storing millionaire numbers for draw:', drawId);
        const { error: millionaireError } = await supabaseClient
          .from('mega_power_millionaire')
          .upsert({
            id: drawId,
            draw_id: mainResult.id,
            number1: result.specialNumbers.millionaire[0],
            number2: result.specialNumbers.millionaire[1],
            number3: result.specialNumbers.millionaire[2],
            number4: result.specialNumbers.millionaire[3],
            number5: result.specialNumbers.millionaire[4],
            number6: result.specialNumbers.millionaire[5]
          }, {
            onConflict: 'id'
          });

        if (millionaireError) console.error('Error storing millionaire numbers:', millionaireError);
      }

      if (result.specialNumbers.fiveHundredK) {
        console.log('Storing 500k numbers for draw:', drawId);
        const { error: fiveHundredKError } = await supabaseClient
          .from('mega_power_500k')
          .upsert({
            id: drawId,
            draw_id: mainResult.id,
            number1: result.specialNumbers.fiveHundredK[0],
            number2: result.specialNumbers.fiveHundredK[1],
            number3: result.specialNumbers.fiveHundredK[2],
            number4: result.specialNumbers.fiveHundredK[3],
            number5: result.specialNumbers.fiveHundredK[4],
            number6: result.specialNumbers.fiveHundredK[5]
          }, {
            onConflict: 'id'
          });

        if (fiveHundredKError) console.error('Error storing 500k numbers:', fiveHundredKError);
      }

      if (result.specialNumbers.lakshapathi) {
        console.log('Storing lakshapathi numbers for draw:', drawId);
        const { error: lakshapathiError } = await supabaseClient
          .from('mega_power_lakshapathi')
          .upsert({
            id: drawId,
            draw_id: mainResult.id,
            number1: result.specialNumbers.lakshapathi[0],
            number2: result.specialNumbers.lakshapathi[1],
            number3: result.specialNumbers.lakshapathi[2],
            number4: result.specialNumbers.lakshapathi[3],
            number5: result.specialNumbers.lakshapathi[4],
            number6: result.specialNumbers.lakshapathi[5] || null
          }, {
            onConflict: 'id'
          });

        if (lakshapathiError) console.error('Error storing lakshapathi numbers:', lakshapathiError);
      }
    }

    console.log(`Successfully stored result for draw ${result.drawNumber}`);
  } catch (error) {
    console.error(`Error processing draw ${result.drawNumber}:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting to scrape Mega Power results...');
    
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    const requestOptions = {
      url: 'https://www.nlb.lk/results/mega-power',
      formats: ['markdown']
    };

    console.log('Making request to Firecrawl API');
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify(requestOptions)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Firecrawl response:', JSON.stringify(responseData, null, 2));

    if (!responseData.success || !responseData.data?.markdown) {
      throw new Error('No markdown content found in crawl response');
    }

    const results = parseMarkdownTable(responseData.data.markdown);
    console.log(`Parsed ${results.length} results from markdown`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const result of results) {
      await storeResults(supabaseClient, result);
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