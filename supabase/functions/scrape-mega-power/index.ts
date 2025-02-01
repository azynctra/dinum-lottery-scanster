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

interface LakshapathiNumbers {
  numbers: string[];
}

interface MillionaireNumbers {
  numbers: string[];
}

interface FiveHundredKNumbers {
  numbers: string[];
}

interface DrawResult {
  drawNumber: string;
  drawDate: string;
  format: 'new' | 'old' | 'special';
  mainNumbers: LotteryNumbers;
  lakshapathiNumbers?: LakshapathiNumbers;
  millionaireNumbers?: MillionaireNumbers;
  fiveHundredKNumbers?: FiveHundredKNumbers;
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
        waitForSelector: '.lottery-results-container' // Wait for this selector to be present
      }
    });

    if (!crawlResponse.success) {
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
    
    // Try different selectors that might contain the results
    const resultContainers = $('.lottery-results-container, .result-container, .lottery-result');
    console.log('Found result containers:', resultContainers.length);
    
    // Log the HTML structure of each container
    resultContainers.each((i, container) => {
      console.log(`Container ${i} HTML:`, $(container).html());
    });

    const results: DrawResult[] = [];

    // Process each result container
    resultContainers.each((_, container) => {
      try {
        const $container = $(container);
        
        // Log the structure we're trying to parse
        console.log('Processing container:', $container.html());
        
        // Extract draw number and date - try multiple possible selectors
        const drawInfo = $container.find('.draw-info, .draw-details, .draw-number').text().trim();
        console.log('Draw info found:', drawInfo);
        
        const drawMatch = drawInfo.match(/Draw No:?\s*(\d+)/i) || drawInfo.match(/(\d+)/);
        const dateMatch = drawInfo.match(/Draw Date:?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                         drawInfo.match(/(\d{2}\/\d{2}\/\d{4})/);
        
        console.log('Draw matches:', { drawMatch, dateMatch });

        if (!drawMatch || !dateMatch) {
          console.log('Could not find draw number or date in:', drawInfo);
          return;
        }

        const drawNumber = drawMatch[1];
        const dateParts = dateMatch[1].split('/');
        const drawDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        
        console.log(`Processing draw ${drawNumber} from ${drawDate}`);

        // Extract main numbers with detailed logging
        const mainNumbers: LotteryNumbers = {
          letter: '',
          superNumber: '',
          numbers: []
        };

        // Try multiple possible selectors for lottery numbers
        const numberElements = $container.find('.lottery-number, .number, .result-number');
        console.log('Found number elements:', numberElements.length);
        
        numberElements.each((i, el) => {
          const value = $(el).text().trim();
          console.log(`Number element ${i}:`, value);
          if (i === 0) mainNumbers.letter = value;
          else if (i === 1) mainNumbers.superNumber = value;
          else mainNumbers.numbers.push(value);
        });

        console.log('Extracted main numbers:', mainNumbers);

        let format: 'new' | 'old' | 'special' = 'new';
        const result: DrawResult = {
          drawNumber,
          drawDate,
          format,
          mainNumbers,
        };

        // Check for additional prize numbers
        const bonusSection = $container.find('.bonus-numbers');
        
        if (bonusSection.length) {
          format = 'special';
          
          // Extract Lakshapathi numbers
          const lakshapathiDiv = bonusSection.find('.lakshapathi');
          if (lakshapathiDiv.length) {
            const lakshapathiNumbers: string[] = [];
            lakshapathiDiv.find('.number').each((_, el) => {
              lakshapathiNumbers.push($(el).text().trim());
            });
            result.lakshapathiNumbers = { numbers: lakshapathiNumbers };
          }

          // Extract Millionaire numbers
          const millionaireDiv = bonusSection.find('.millionaire');
          if (millionaireDiv.length) {
            const millionaireNumbers: string[] = [];
            millionaireDiv.find('.number').each((_, el) => {
              millionaireNumbers.push($(el).text().trim());
            });
            result.millionaireNumbers = { numbers: millionaireNumbers };
          }

          // Extract 500K numbers
          const fiveHundredKDiv = bonusSection.find('.five-hundred-k');
          if (fiveHundredKDiv.length) {
            const fiveHundredKNumbers: string[] = [];
            fiveHundredKDiv.find('.number').each((_, el) => {
              fiveHundredKNumbers.push($(el).text().trim());
            });
            result.fiveHundredKNumbers = { numbers: fiveHundredKNumbers };
          }
        }

        results.push(result);
        console.log(`Successfully processed draw ${drawNumber}`);
      } catch (error) {
        console.error('Error processing container:', error);
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
        
        // Insert main result
        const { data: mainResult, error: mainError } = await supabaseClient
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
          })
          .select()
          .single();

        if (mainError) {
          console.error('Error storing main result:', mainError);
          throw mainError;
        }

        console.log(`Stored main result for draw ${result.drawNumber}`);

        // Insert Lakshapathi numbers if present
        if (result.lakshapathiNumbers) {
          const { error: lakshapathiError } = await supabaseClient
            .from('mega_power_lakshapathi')
            .upsert({
              draw_id: mainResult.id,
              number1: result.lakshapathiNumbers.numbers[0],
              number2: result.lakshapathiNumbers.numbers[1],
              number3: result.lakshapathiNumbers.numbers[2],
              number4: result.lakshapathiNumbers.numbers[3],
              number5: result.lakshapathiNumbers.numbers[4],
              number6: result.lakshapathiNumbers.numbers[5]
            }, {
              onConflict: 'draw_id'
            });

          if (lakshapathiError) {
            console.error('Error storing lakshapathi numbers:', lakshapathiError);
          }
        }

        // Insert Millionaire numbers if present
        if (result.millionaireNumbers) {
          const { error: millionaireError } = await supabaseClient
            .from('mega_power_millionaire')
            .upsert({
              draw_id: mainResult.id,
              number1: result.millionaireNumbers.numbers[0],
              number2: result.millionaireNumbers.numbers[1],
              number3: result.millionaireNumbers.numbers[2],
              number4: result.millionaireNumbers.numbers[3],
              number5: result.millionaireNumbers.numbers[4],
              number6: result.millionaireNumbers.numbers[5]
            }, {
              onConflict: 'draw_id'
            });

          if (millionaireError) {
            console.error('Error storing millionaire numbers:', millionaireError);
          }
        }

        // Insert 500k numbers if present
        if (result.fiveHundredKNumbers) {
          const { error: fiveHundredKError } = await supabaseClient
            .from('mega_power_500k')
            .upsert({
              draw_id: mainResult.id,
              number1: result.fiveHundredKNumbers.numbers[0],
              number2: result.fiveHundredKNumbers.numbers[1],
              number3: result.fiveHundredKNumbers.numbers[2],
              number4: result.fiveHundredKNumbers.numbers[3],
              number5: result.fiveHundredKNumbers.numbers[4],
              number6: result.fiveHundredKNumbers.numbers[5]
            }, {
              onConflict: 'draw_id'
            });

          if (fiveHundredKError) {
            console.error('Error storing 500k numbers:', fiveHundredKError);
          }
        }
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
