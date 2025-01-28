import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Scraping URL:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    // Make request to Firecrawl API
    const response = await fetch('https://api.firecrawl.co/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        selectors: ['.QRR'],
        wait: 2000 // Wait for dynamic content to load
      }),
    });

    const data = await response.json();
    console.log('Firecrawl response:', data);

    if (!data.success) {
      throw new Error('Failed to scrape content');
    }

    const content = data.results[0]?.content;

    // Store result in database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabaseClient
      .from('lottery_results')
      .insert([{ url, content }]);

    if (insertError) {
      console.error('Error inserting result:', insertError);
      throw new Error('Failed to store result');
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-lottery-result function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});