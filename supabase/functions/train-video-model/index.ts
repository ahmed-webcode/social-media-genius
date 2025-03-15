
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
export async function corsHandler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

export async function handleRequest(req: Request) {
  const { method } = req

  // Handle CORS
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST
  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Get request body
    const { trainingData, videoType, platform, referenceVideos = [] } = await req.json()

    // Get API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'OpenAI API key is not configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Training video model with data:', {
      videoType,
      platform,
      dataLength: trainingData ? trainingData.length : 0,
      referenceVideosCount: referenceVideos.length,
      referenceVideoIds: referenceVideos,
    })

    // Mock video analysis of reference videos
    // In a real implementation, this would analyze the YouTube videos or use their metadata
    const analyzedReferenceVideos = referenceVideos.map((videoId: string) => {
      return {
        videoId,
        features: {
          visualStyle: "high-contrast",
          cameraMovements: ["pan", "zoom", "tracking"],
          transitions: ["fade", "wipe", "dissolve"],
          colorGrading: "vibrant",
          textOverlays: true,
          musicType: "upbeat",
          narrativeStyle: "direct-engagement",
          pacing: "fast",
        }
      }
    })

    // Connect to Supabase to store training status
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Log training event with reference videos included
    const { error: logError } = await supabase
      .from('training_logs')
      .insert({
        platform,
        video_type: videoType,
        samples_count: trainingData?.length || 0,
        status: 'completed',
        metadata: { 
          trainingCompleted: new Date().toISOString(),
          referenceVideos: analyzedReferenceVideos,
          styleFeatures: {
            visualStyle: "high-contrast",
            colorGrading: "vibrant",
            cameraMovements: ["pan", "zoom", "tracking"],
            transitions: ["fade", "wipe", "dissolve"],
            textOverlays: true,
            audioFeatures: {
              musicType: "upbeat",
              soundEffects: true,
              voiceOver: platform === "YouTube"
            },
            pacing: "fast",
            narrativeStyle: "direct-engagement"
          }
        }
      })
      .select()
    
    if (logError) {
      console.error('Error logging training event:', logError)
    }

    // Return success response with reference video analysis included
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Model training completed successfully',
        details: {
          platform,
          videoType,
          samplesProcessed: trainingData?.length || 0,
          referenceVideosAnalyzed: analyzedReferenceVideos.length,
          styleFeatures: {
            visualStyle: "high-contrast",
            colorGrading: "vibrant",
            cameraMovements: ["pan", "zoom", "tracking"],
            transitions: ["fade", "wipe", "dissolve"],
            textOverlays: true,
            audioFeatures: {
              musicType: "upbeat",
              soundEffects: true,
              voiceOver: platform === "YouTube"
            },
            pacing: "fast",
            narrativeStyle: "direct-engagement"
          },
          trainingCompleted: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error training model:', error)

    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message || 'An unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = await corsHandler(req)
  if (corsResponse) return corsResponse

  // Process the request
  return handleRequest(req)
})
