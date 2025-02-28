
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
    const { code, redirectUri } = await req.json();
    
    console.log("Processing Snapchat OAuth callback");
    console.log("Code received: " + code.substring(0, 5) + "...");
    console.log("Redirect URI: " + redirectUri);
    
    const clientId = Deno.env.get('SNAPCHAT_CLIENT_ID');
    const clientSecret = Deno.env.get('SNAPCHAT_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Exchange the code for an access token
    console.log("Exchanging code for access token...");
    
    const tokenResponse = await fetch('https://accounts.snapchat.com/login/oauth2/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange error response:", errorText);
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("Access token obtained successfully");
    
    if (!tokenData.access_token) {
      console.error("Token data:", tokenData);
      throw new Error('No access token returned');
    }

    // Get user info from Snapchat
    console.log("Getting user info from Snapchat...");
    
    const userResponse = await fetch('https://adsapi.snapchat.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("User info error response:", errorText);
      throw new Error(`Failed to get user info: ${userResponse.status} ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    console.log("Successfully retrieved Snapchat user data");
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user ID from the authorization header
    const authHeader = req.headers.get('authorization')?.split(' ')[1];
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error('Authentication failed');
    }

    console.log("Authenticated as user:", user.id);
    
    // Extract account details
    const accountName = userData.me?.display_name || 'Snapchat User';
    const accountId = userData.me?.id || 'unknown';
    
    console.log("Storing Snapchat account info in database");
    console.log("Account name:", accountName);
    console.log("Account ID:", accountId);

    // Store the tokens in the database
    const { error: dbError } = await supabase
      .from('social_media_accounts')
      .upsert({
        user_id: user.id,
        platform: 'Snapchat',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        account_name: accountName,
        account_id: accountId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to store account info: ${dbError.message}`);
    }

    console.log("Successfully connected Snapchat account");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Successfully connected Snapchat account"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Complete OAuth error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
