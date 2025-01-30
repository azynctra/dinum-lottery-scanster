import { supabase } from "@/integrations/supabase/client";

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