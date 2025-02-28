
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { prompt, platform, generateShorts } = await req.json();
    
    console.log(`Generating video for prompt: "${prompt}" on ${platform}`);
    console.log(`Generate shorts: ${generateShorts}`);

    // Get authorization header to identify the user
    const authHeader = req.headers.get('authorization')?.split(' ')[1];
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) {
      throw new Error('Authentication failed');
    }
    
    console.log(`Authenticated as user: ${user.id}`);

    // Check if the user has connected their Snapchat account if platform is Snapchat
    if (platform === 'Snapchat') {
      const { data: accounts, error: accountsError } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'Snapchat')
        .maybeSingle();
      
      if (accountsError) {
        throw new Error(`Failed to check Snapchat account: ${accountsError.message}`);
      }
      
      if (!accounts) {
        throw new Error('Snapchat account not connected. Please connect your Snapchat account first.');
      }
      
      console.log('Snapchat account found, access token available');
    }

    // In a real implementation, this would:
    // 1. Use OpenAI/other AI to generate a video script based on prompt
    // 2. Use a video generation API to create the video
    // 3. If generateShorts is true, create a shorter version
    // 4. Upload to appropriate platforms via their APIs

    // For now, we're creating a simulation of video generation
    // by returning mock URLs after a short delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate unique timestamps for the videos
    const timestamp = Date.now();
    const videoId = timestamp.toString();
    const videoUrl = `https://example.com/videos/${platform.toLowerCase()}-${videoId}.mp4`;
    const shortsUrl = generateShorts ? `https://example.com/shorts/${platform.toLowerCase()}-${videoId}.mp4` : null;

    console.log(`Video generation completed.`);
    console.log(`Video URL: ${videoUrl}`);
    if (shortsUrl) {
      console.log(`Shorts URL: ${shortsUrl}`);
    }

    // If platform is Snapchat, we'd use the Snapchat API to post the video
    // This is a simulated implementation
    if (platform === 'Snapchat') {
      console.log('Simulating Snapchat posting process...');
      // In a real implementation, we would:
      // 1. Get the Snapchat access token from the database
      // 2. Use the Snapchat API to upload and schedule the post
      // 3. Store the Snapchat post ID for tracking
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        videoUrl,
        shortsUrl,
        message: 'Video generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-video function:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
