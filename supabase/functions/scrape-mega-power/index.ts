import FirecrawlApp from 'npm:@mendable/firecrawl-js';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting to scrape Mega Power results using Firecrawl...');
    
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    console.log('Initializing Firecrawl with API key');
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    console.log('Starting crawl for NLB Mega Power URL');
    const crawlResponse = await firecrawl.crawlUrl('https://www.nlb.lk/results/mega-power', {
      limit: 1,
      scrapeOptions: {
        formats: ['html'],
      }
    });

    if (!crawlResponse.success) {
      console.error('Crawl response error:', crawlResponse);
      throw new Error('Failed to crawl URL: ' + (crawlResponse.error || 'Unknown error'));
    }

    const html = crawlResponse.data?.[0]?.html;
    if (!html) {
      console.error('Full crawl response:', JSON.stringify(crawlResponse, null, 2));
      throw new Error('No HTML content found in crawl response');
    }

    console.log('Successfully retrieved HTML content, parsing results...');
    const $ = cheerio.load(html);
    
    // Log the full HTML for debugging
    console.log('Full HTML content:', html);
    
    // Find the results table - be more specific with the selector
    const resultTable = $('.result-table, .table-responsive table, table');
    console.log('Found result table:', resultTable.length > 0);
    
    if (resultTable.length === 0) {
      console.log('Available tables on the page:');
      $('table').each((i, table) => {
        console.log(`Table ${i + 1} classes:`, $(table).attr('class'));
        console.log(`Table ${i + 1} HTML:`, $(table).html());
      });
    }
    
    const results: DrawResult[] = [];

    // Process each row in the table
    resultTable.find('tr').each((index, row) => {
      try {
        const $row = $(row);
        console.log(`Processing row ${index}:`, $row.html());
        
        const cells = $row.find('td');
        if (cells.length < 7) {
          console.log(`Skipping row ${index} - insufficient cells:`, cells.length);
          return;
        }
        
        // Extract and log each cell's content
        cells.each((i, cell) => {
          console.log(`Cell ${i} content:`, $(cell).text().trim());
        });
        
        const drawInfo = cells.eq(0).text().trim();
        console.log('Draw info:', drawInfo);
        
        const drawMatch = drawInfo.match(/(\d+)/);
        const dateMatch = drawInfo.match(/(\d{2}\/\d{2}\/\d{4})/);
        
        if (!drawMatch || !dateMatch) {
          console.log('Could not extract draw number or date from:', drawInfo);
          return;
        }

        const drawNumber = drawMatch[1];
        const dateParts = dateMatch[1].split('/');
        const drawDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        
        console.log(`Found draw ${drawNumber} from ${drawDate}`);

        const mainNumbers: LotteryNumbers = {
          letter: cells.eq(1).text().trim(),
          superNumber: cells.eq(2).text().trim(),
          numbers: [
            cells.eq(3).text().trim(),
            cells.eq(4).text().trim(),
            cells.eq(5).text().trim(),
            cells.eq(6).text().trim(),
          ]
        };

        console.log('Extracted numbers:', mainNumbers);

        results.push({
          drawNumber,
          drawDate,
          format: 'new',
          mainNumbers,
        });
        
        console.log(`Successfully processed draw ${drawNumber}`);
      } catch (error) {
        console.error('Error processing row:', error);
      }
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
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});