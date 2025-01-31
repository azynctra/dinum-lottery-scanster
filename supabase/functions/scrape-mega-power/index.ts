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
    console.log('Starting to scrape Mega Power results...');
    
    // Fetch the lottery results page
    const response = await fetch('https://www.nlb.lk/results/mega-power');
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('Successfully fetched HTML content');
    
    const $ = cheerio.load(html);
    const results: DrawResult[] = [];

    // Process each result row
    $('tr').each((_, row) => {
      try {
        const $row = $(row);
        const drawNumberEl = $row.find('td:first-child b');
        
        if (!drawNumberEl.length) {
          return; // Skip rows without draw numbers
        }

        const drawNumber = drawNumberEl.text().trim();
        console.log(`Processing draw number: ${drawNumber}`);
        
        const drawDateText = $row.find('td:first-child').contents().filter(function() {
          return this.nodeType === 3;
        }).text().trim();
        
        if (!drawDateText) {
          console.log(`No date found for draw ${drawNumber}`);
          return;
        }
        
        const drawDate = new Date(drawDateText).toISOString().split('T')[0];
        console.log(`Draw date parsed: ${drawDate}`);

        // Extract main lottery numbers
        const mainNumbers: LotteryNumbers = {
          letter: '',
          superNumber: '',
          numbers: [],
        };

        const $mainOl = $row.find('ol.B').first();
        $mainOl.find('li').each((i, el) => {
          const value = $(el).text().trim();
          if (i === 0) mainNumbers.letter = value;
          else if (i === 1) mainNumbers.superNumber = value;
          else mainNumbers.numbers.push(value);
        });

        let format: 'new' | 'old' | 'special' = 'new';
        const result: DrawResult = {
          drawNumber,
          drawDate,
          format,
          mainNumbers,
        };

        // Check for Lakshapathi numbers
        const $lakshapathiSpan = $row.find('span:contains("Lakshapathi Double Chance No")');
        if ($lakshapathiSpan.length) {
          format = 'old';
          const lakshapathiNumbers: string[] = [];
          $lakshapathiSpan.next('ol.B').find('li').each((_, el) => {
            lakshapathiNumbers.push($(el).text().trim());
          });
          result.lakshapathiNumbers = { numbers: lakshapathiNumbers };
        }

        // Check for Millionaire numbers
        const $millionaireSpan = $row.find('span:contains("Millionaire Lucky Number")');
        if ($millionaireSpan.length) {
          format = 'special';
          const millionaireNumbers: string[] = [];
          $millionaireSpan.next('ol.B').find('li').each((_, el) => {
            millionaireNumbers.push($(el).text().trim());
          });
          result.millionaireNumbers = { numbers: millionaireNumbers };
        }

        // Check for 500k numbers
        const $fiveHundredKSpan = $row.find('span:contains("500,000/= Lucky Number")');
        if ($fiveHundredKSpan.length) {
          format = 'special';
          const fiveHundredKNumbers: string[] = [];
          $fiveHundredKSpan.next('ol.B').find('li').each((_, el) => {
            fiveHundredKNumbers.push($(el).text().trim());
          });
          result.fiveHundredKNumbers = { numbers: fiveHundredKNumbers };
        }

        result.format = format;
        results.push(result);
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