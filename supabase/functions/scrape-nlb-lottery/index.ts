import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'npm:cheerio';

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

    // Validate that it's an NLB lottery URL
    if (!url.includes('r.nlb.lk')) {
      throw new Error('Invalid NLB lottery URL');
    }

    console.log('Fetching lottery results from URL:', url);
    const response = await fetch(url);
    const html = await response.text();

    // Load HTML content into cheerio
    const $ = cheerio.load(html);

    // Extract lottery information
    const lotteryName = $('.lottery-name').text().trim() || $('h1').first().text().trim();
    const drawDate = $('.draw-date').text().trim() || $('h2').first().text().trim();
    
    // Extract winning numbers
    const winningNumbers: string[] = [];
    $('.winning-numbers li, .numbers li').each((_, elem) => {
      winningNumbers.push($(elem).text().trim());
    });

    // Extract prizes if available
    const prizes: { category: string; amount: string }[] = [];
    $('.prizes tr').each((_, elem) => {
      const category = $(elem).find('td').first().text().trim();
      const amount = $(elem).find('td').last().text().trim();
      if (category && amount) {
        prizes.push({ category, amount });
      }
    });

    // Format the result in markdown
    let markdown = `## ${lotteryName}\n\n`;
    markdown += `**Draw Date:** ${drawDate}\n\n`;
    markdown += `### Winning Numbers\n\n`;
    winningNumbers.forEach((num, index) => {
      markdown += `${index + 1}. ${num}\n`;
    });

    if (prizes.length > 0) {
      markdown += `\n### Prizes\n\n`;
      prizes.forEach(prize => {
        markdown += `- **${prize.category}:** ${prize.amount}\n`;
      });
    }

    // Store the result in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Storing lottery result in database');
    const { error: insertError } = await supabase
      .from('lottery_results')
      .insert({
        url: url,
        content: markdown
      });

    if (insertError) {
      console.error('Error storing lottery result:', insertError);
      throw new Error('Failed to store lottery result');
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: markdown
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in scrape-nlb-lottery function:', error);
    
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