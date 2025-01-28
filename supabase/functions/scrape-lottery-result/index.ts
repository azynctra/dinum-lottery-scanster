import FirecrawlApp from 'npm:@mendable/firecrawl-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Received URL to scrape:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    console.log('Initializing Firecrawl with API key');
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    console.log('Starting crawl for URL:', url);
    const crawlResponse = await firecrawl.crawlUrl(url, {
      limit: 1,
      format: 'html',
      cssSelector: '.QRR'
    });

    console.log('Crawl response:', crawlResponse);

    if (!crawlResponse.success) {
      throw new Error('Failed to crawl URL: ' + (crawlResponse.error || 'Unknown error'));
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: crawlResponse.data[0]?.content || ''
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in scrape-lottery-result function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});