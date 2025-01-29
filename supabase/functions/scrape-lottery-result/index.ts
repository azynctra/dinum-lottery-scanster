import FirecrawlApp from 'npm:@mendable/firecrawl-js';
import { marked } from 'npm:marked';

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
      limit: 1
    });

    console.log('Crawl response:', crawlResponse);

    if (!crawlResponse.success) {
      throw new Error('Failed to crawl URL: ' + (crawlResponse.error || 'Unknown error'));
    }

    // Extract the markdown content from the crawl response
    const markdownContent = crawlResponse.data?.[0]?.markdown;
    
    if (!markdownContent) {
      console.error('Full crawl response:', JSON.stringify(crawlResponse, null, 2));
      throw new Error('No content found in crawl response');
    }

    // Convert markdown to HTML
    const htmlContent = marked(markdownContent);

    return new Response(
      JSON.stringify({
        success: true,
        content: htmlContent
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