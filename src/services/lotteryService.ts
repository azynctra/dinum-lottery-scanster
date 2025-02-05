
import { supabase } from "@/integrations/supabase/client";

interface MegaPowerTicket {
  drawId: string;
  letter: string;
  numbers: string[];
}

export const parseMegaPowerTicket = (qrText: string): MegaPowerTicket | null => {
  // Match pattern: Mega Power {drawId} {letter} {numbers...} {date} {serialNumber} {url}
  // Example: Mega Power 2060 G 10 53 74 75 79 2025/01/10 083020600366707 https://r.nlb.lk/083020600366707G1053747579
  const match = qrText.match(/Mega Power (\d+) ([A-Z]) (\d+) (\d+) (\d+) (\d+) (\d+)/);
  if (!match) return null;

  const [_, drawId, letter, ...numbers] = match;
  return {
    drawId,
    letter,
    numbers
  };
};

export const fetchMegaPowerResult = async (drawId: string) => {
  console.log('Fetching result for draw:', drawId);
  
  // Get main results
  const { data: mainResult, error: mainError } = await supabase
    .from('mega_power_results')
    .select('*')
    .eq('draw_number', drawId)
    .maybeSingle();

  if (mainError) throw new Error('Failed to fetch lottery result');
  if (!mainResult) throw new Error('No result found for this draw');

  // Get special cases
  const { data: specialTypesData } = await supabase
    .from('mega_power_special_types')
    .select('table_name');

  const specialResults: Record<string, any> = {};

  if (specialTypesData) {
    for (const { table_name } of specialTypesData) {
      const { data } = await supabase
        .from(table_name as 'mega_power_500k' | 'mega_power_lakshapathi' | 'mega_power_millionaire')
        .select('*')
        .eq('draw_id', drawId);
      
      if (data && data.length > 0) {
        specialResults[table_name] = data[0];
      }
    }
  }

  return {
    mainResult,
    specialResults
  };
};

export const compareMegaPowerTicket = (ticket: MegaPowerTicket, result: any) => {
  const matches = {
    letter: ticket.letter === result.mainResult.letter,
    numbers: ticket.numbers.every((num, index) => {
      // Match against the corresponding number fields
      if (index === 0) return num === result.mainResult.super_number;
      const resultNum = result.mainResult[`number${index}`];
      return num === resultNum;
    }),
    matchingSpecials: [] as string[]
  };

  // Check special results
  Object.entries(result.specialResults).forEach(([tableName, specialResult]) => {
    let isMatch = true;
    const numbers = ticket.numbers;
    
    for (let i = 0; i < numbers.length; i++) {
      if (specialResult[`number${i + 1}`] !== numbers[i]) {
        isMatch = false;
        break;
      }
    }
    
    if (isMatch) {
      matches.matchingSpecials.push(tableName);
    }
  });

  return matches;
};

export const scrapeLotteryResult = async (url: string) => {
  console.log('Scraping lottery result for URL:', url);
  
  const response = await supabase.functions.invoke('scrape-lottery-result', {
    body: { url }
  });

  console.log('Scraping response:', response);

  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch lottery result');
  }

  if (!response.data?.success || !response.data?.content) {
    throw new Error(response.data?.error || 'Failed to fetch lottery result');
  }

  return response.data.content;
};
