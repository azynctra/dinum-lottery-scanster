
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

interface SpecialCaseNumbers {
  type: string;
  numbers: string[];
  hasLetter?: boolean;
}

interface DrawResult {
  drawNumber: string;
  drawDate: string;
  format: 'new' | 'old' | 'special';
  mainNumbers: LotteryNumbers;
  specialCases: SpecialCaseNumbers[];
}

function parseNumberFormat(numbers: string[], hasLetter: boolean): 'four' | 'five' | 'six' | 'six_with_letter' {
  if (hasLetter) return 'six_with_letter';
  switch (numbers.length) {
    case 4: return 'four';
    case 5: return 'five';
    case 6: return 'six';
    default: throw new Error(`Unexpected number of values: ${numbers.length}`);
  }
}

function parseMarkdownTable(markdown: string): DrawResult[] {
  const results: DrawResult[] = [];
  const lines = markdown.split('\n');
  
  const tableStartIndex = lines.findIndex(line => line.includes('| Draw/Date |'));
  if (tableStartIndex === -1) return results;
  
  const dataLines = lines.slice(tableStartIndex + 2);
  
  for (const line of dataLines) {
    if (!line.trim() || !line.startsWith('|')) continue;
    
    const [drawDateCell, resultsCell] = line.split('|').slice(1, 3).map(cell => cell.trim());
    if (!drawDateCell || !resultsCell) continue;
    
    const drawMatch = drawDateCell.match(/\*\*(\d+)\*\*/);
    const dateMatch = drawDateCell.match(/<br>(.*)/);
    if (!drawMatch || !dateMatch) continue;
    
    const drawNumber = drawMatch[1];
    const drawDate = dateMatch[1];
    
    const numberLines = resultsCell.split('<br>');
    if (numberLines.length < 6) continue;
    
    // Parse main numbers
    const letter = numberLines[0].split('. ')[1];
    const superNumber = numberLines[1].split('. ')[1];
    const numbers = numberLines.slice(2, 6).map(line => line.split('. ')[1]);

    // Parse special cases
    const specialCases: SpecialCaseNumbers[] = [];
    let currentSpecialCase: SpecialCaseNumbers | null = null;

    for (let i = 6; i < numberLines.length; i++) {
      const line = numberLines[i].trim();
      
      // Check if this is a header for a new special case
      if (line.includes('Lucky Number') || line.includes('Double Chance No')) {
        // If we were collecting numbers for a previous special case, save it
        if (currentSpecialCase && currentSpecialCase.numbers.length > 0) {
          specialCases.push(currentSpecialCase);
        }
        
        // Start a new special case
        currentSpecialCase = {
          type: line,
          numbers: [],
          hasLetter: false
        };
        continue;
      }

      // If we're collecting numbers and this line has a number
      if (currentSpecialCase && line.includes('. ')) {
        const value = line.split('. ')[1];
        if (/^[A-Za-z]$/.test(value)) {
          currentSpecialCase.hasLetter = true;
        } else {
          currentSpecialCase.numbers.push(value);
        }
      }
    }

    // Don't forget to add the last special case if we have one
    if (currentSpecialCase && currentSpecialCase.numbers.length > 0) {
      specialCases.push(currentSpecialCase);
    }
    
    results.push({
      drawNumber,
      drawDate,
      format: specialCases.length > 0 ? 'special' : 'new',
      mainNumbers: {
        letter,
        superNumber,
        numbers
      },
      specialCases
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

    if (mainError) throw mainError;
    console.log('Stored main result:', mainResult);

    // Handle special cases
    for (const specialCase of result.specialCases) {
      console.log(`Processing special case: ${specialCase.type}`);
      
      // Call the database function to handle the special type
      const numberFormat = parseNumberFormat(specialCase.numbers, specialCase.hasLetter || false);
      
      const { data: specialTypeResult, error: specialTypeError } = await supabaseClient
        .rpc('handle_special_type', {
          p_type_name: specialCase.type,
          p_number_format: numberFormat
        });
        
      if (specialTypeError) {
        console.error('Error handling special type:', specialTypeError);
        continue;
      }
      
      const tableName = specialTypeResult;
      console.log(`Using table: ${tableName} for special case`);

      // Insert the special case numbers
      const specialCaseData: any = {
        draw_id: result.drawNumber
      };

      if (specialCase.hasLetter) {
        specialCaseData.letter = specialCase.numbers[0];
        specialCase.numbers.slice(1).forEach((num, idx) => {
          specialCaseData[`number${idx + 1}`] = num;
        });
      } else {
        specialCase.numbers.forEach((num, idx) => {
          specialCaseData[`number${idx + 1}`] = num;
        });
      }

      const { error: insertError } = await supabaseClient
        .from(tableName)
        .upsert(specialCaseData);

      if (insertError) {
        console.error(`Error inserting into ${tableName}:`, insertError);
      }
    }

    console.log(`Successfully stored all results for draw ${result.drawNumber}`);
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
