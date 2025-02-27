
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { redirectUrl } = await req.json()
    const clientId = Deno.env.get('SNAPCHAT_CLIENT_ID')

    if (!clientId) {
      throw new Error('Missing Snapchat client ID')
    }

    console.log("Initiating Snapchat OAuth with redirect URL:", redirectUrl);

    // Construct the Snapchat OAuth URL
    const scope = 'snapchat-marketing-api'
    const authUrl = `https://accounts.snapchat.com/login/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `response_type=code&` +
      `scope=${scope}`

    console.log("Generated Snapchat OAuth URL:", authUrl);

    return new Response(
      JSON.stringify({ authUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Snapchat OAuth init error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
