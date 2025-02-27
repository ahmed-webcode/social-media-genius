
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirectUri } = await req.json()
    const clientId = Deno.env.get('SNAPCHAT_CLIENT_ID')
    const clientSecret = Deno.env.get('SNAPCHAT_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    console.log("Completing Snapchat OAuth with code:", code.substring(0, 5) + "...");

    // Exchange the code for an access token
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
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Token exchange error:", tokenData);
      throw new Error(tokenData.error_description || 'Failed to get access token')
    }

    console.log("Successfully obtained access token");

    // Get user info
    const userResponse = await fetch('https://adsapi.snapchat.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log("Retrieved user data:", JSON.stringify(userData).substring(0, 100) + "...");

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the user ID from the authorization header
    const authHeader = req.headers.get('authorization')?.split(' ')[1]
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    console.log("Authenticated as user:", user.id);

    // Store the tokens in the database
    const { error: dbError } = await supabase
      .from('social_media_accounts')
      .upsert({
        user_id: user.id,
        platform: 'Snapchat',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        account_name: userData.me.display_name || 'Snapchat User',
        account_id: userData.me.id,
      })

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError
    }

    console.log("Successfully stored account data in database");

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Complete OAuth error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
