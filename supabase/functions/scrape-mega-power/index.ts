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
    formats: ['html']
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

    const html = crawlResponse.data?.html;
    if (!html) {
      console.error('Full crawl response:', JSON.stringify(crawlResponse, null, 2));
      throw new Error('No HTML content found in crawl response');
    }

    console.log('Successfully retrieved HTML. Loading with Cheerio...');
    const $ = cheerio.load(html);
    
    const results: DrawResult[] = [];
    
    $('table.tbl tbody tr').each((_, row) => {
      try {
        const $row = $(row);
        const drawInfo = $row.find('td:first-child').text().trim();
        const drawMatch = drawInfo.match(/(\d+)/);
        const dateMatch = drawInfo.match(/(\w+)\s+(\w+)\s+(\d+),\s+(\d+)/);
        
        if (!drawMatch || !dateMatch) {
          console.log('Could not extract draw number or date from:', drawInfo);
          return;
        }

        const drawNumber = drawMatch[1];
        const [_, dayOfWeek, month, day, year] = dateMatch;
        const drawDate = `${year}-${getMonthNumber(month)}-${day.padStart(2, '0')}`;

        const $numbers = $row.find('ol.B li');
        if ($numbers.length < 6) {
          console.log(`Skipping row for draw ${drawNumber} - insufficient number elements`);
          return;
        }

        const mainNumbers: LotteryNumbers = {
          letter: $numbers.eq(0).text().trim(),
          superNumber: $numbers.eq(1).text().trim(),
          numbers: [
            $numbers.eq(2).text().trim(),
            $numbers.eq(3).text().trim(),
            $numbers.eq(4).text().trim(),
            $numbers.eq(5).text().trim(),
          ]
        };

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

    console.log(`Found ${results.length} results to process`);

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

function getMonthNumber(month: string): string {
  const months: { [key: string]: string } = {
    'January': '01',
    'February': '02',
    'March': '03',
    'April': '04',
    'May': '05',
    'June': '06',
    'July': '07',
    'August': '08',
    'September': '09',
    'October': '10',
    'November': '11',
    'December': '12'
  };
  return months[month] || '01';
}