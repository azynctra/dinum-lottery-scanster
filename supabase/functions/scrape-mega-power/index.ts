import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

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
    formats: ['markdown'],
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
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
    console.log('Firecrawl response headers:', Object.fromEntries(response.headers.entries()));

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting to scrape Mega Power results...');
    
    const response = await makeFirecrawlRequest();
    const responseText = await response.text();
    console.log('Raw Firecrawl response:', responseText);

    let crawlResponse;
    try {
      crawlResponse = JSON.parse(responseText);
      console.log('Parsed Firecrawl response:', JSON.stringify(crawlResponse, null, 2));
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid JSON response from Firecrawl API');
    }

    if (!crawlResponse.success) {
      console.error('Crawl failed:', crawlResponse.error || 'Unknown error');
      throw new Error('Failed to crawl URL: ' + (crawlResponse.error || 'Unknown error'));
    }

    // Extract HTML content from the correct path in the response
    const html = crawlResponse.data?.html;
    if (!html) {
      console.error('Full crawl response:', JSON.stringify(crawlResponse, null, 2));
      throw new Error('No HTML content found in crawl response');
    }

    console.log('Successfully retrieved HTML. Loading with Cheerio...');
    const $ = cheerio.load(html);
    
    // Log the full HTML for debugging
    console.log('Full HTML content:', html);
    
    // Log all table elements for debugging
    console.log('Found tables on page:', $('table').length);
    
    // Try multiple selector patterns
    const tables = $('.table-responsive table, table.table');
    console.log('Found tables with broader selector:', tables.length);
    
    const results: DrawResult[] = [];

    tables.each((tableIndex, table) => {
      console.log(`Processing table ${tableIndex + 1}`);
      
      $(table).find('tr').each((rowIndex, row) => {
        try {
          const $row = $(row);
          const cells = $row.find('td');
          
          console.log(`Row ${rowIndex + 1} has ${cells.length} cells`);
          if (cells.length < 4) {
            console.log(`Skipping row ${rowIndex + 1} - insufficient cells`);
            return;
          }

          // Log the content of each cell
          cells.each((i, cell) => {
            console.log(`Cell ${i + 1} content:`, $(cell).text().trim());
          });

          const drawInfo = cells.eq(0).text().trim();
          console.log('Draw info:', drawInfo);

          // Extract draw number and date
          const drawMatch = drawInfo.match(/(\d+)/);
          const dateMatch = drawInfo.match(/(\d{2}\/\d{2}\/\d{4})/);

          if (!drawMatch || !dateMatch) {
            console.log('Could not extract draw number or date from:', drawInfo);
            return;
          }

          const drawNumber = drawMatch[1];
          const dateParts = dateMatch[1].split('/');
          const drawDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

          const mainNumbers: LotteryNumbers = {
            letter: cells.eq(1).text().trim(),
            superNumber: cells.eq(2).text().trim(),
            numbers: [
              cells.eq(3).text().trim(),
              cells.eq(4).text().trim(),
              cells.eq(5).text().trim(),
              cells.eq(6).text().trim(),
            ].filter(Boolean)
          };

          console.log('Extracted result:', {
            drawNumber,
            drawDate,
            mainNumbers
          });

          results.push({
            drawNumber,
            drawDate,
            format: 'new',
            mainNumbers,
          });
        } catch (error) {
          console.error('Error processing row:', error);
        }
      });
    });

    console.log(`Found ${results.length} results to process`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store results in database
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
