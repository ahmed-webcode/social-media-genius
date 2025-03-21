
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

  try {
    // Get request body
    const requestData = await req.json()
    const { platform, prompt, useModel } = requestData

    if (!platform) {
      throw new Error('Platform is required')
    }

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log(`Generating video for platform: ${platform}`)
    console.log(`With prompt: ${prompt}`)
    console.log(`Using model ID: ${useModel || 'none'}`)

    // Get API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key is not configured')
      throw new Error('OpenAI API key is not configured')
    }

    // Get Supabase connection info
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let styleFeatures = null
    let videoModel = null

    // If a model ID is provided, fetch the model to use its style features
    if (useModel) {
      console.log(`Fetching model ${useModel} from database...`)
      const { data: modelData, error: modelError } = await supabase
        .from('video_models')
        .select('*')
        .eq('id', useModel)
        .maybeSingle()

      if (modelError) {
        console.error(`Error fetching model: ${modelError.message}`)
        throw new Error(`Error fetching model: ${modelError.message}`)
      }

      if (modelData) {
        videoModel = modelData
        styleFeatures = modelData.style_features
        console.log('Successfully fetched model style features')
      }
    }

    // If no model or no style features, generate content with AI
    if (!styleFeatures) {
      console.log('No model specified or no style features in model, generating content with AI...')
      
      // Create a detailed prompt for OpenAI to generate video content and style
      const aiPrompt = `
      Generate a detailed video content plan for a ${platform} video with the prompt: "${prompt}".
      
      Create a JSON object with:
      1. "title": A catchy title for the video
      2. "description": A brief description of the video content
      3. "styleFeatures": An object containing:
         - visualStyle: The visual aesthetic (cinematic, bold, sleek, high-contrast)
         - colorGrading: Color treatment style
         - cameraMovements: Array of 4-6 camera techniques 
         - transitions: Array of 4-6 transition types
         - pacing: Editing rhythm (fast, dynamic, slow)
         - textOverlays: Boolean indicating if text should be displayed
         - audioFeatures: Object with musicType (string), soundEffects (boolean), voiceOver (boolean)
         - narrativeStyle: How the story is told
         - composition: Framing approach
         - lighting: Lighting technique
         - editingStyle: Post-production approach
         - customFont: Suggested font family
         - textAnimations: Array of 2-4 text animation styles
         - colorPalette: Array of 4-6 hex color codes that match the video's aesthetic
      4. "scenes": Array of scene objects, each with:
         - id: Unique scene identifier
         - duration: Scene duration in seconds (2-6)
         - text: The main text/script for the scene
         - visualDescription: Brief description of what should be shown

      For ${platform} specifically, follow these guidelines:
      ${platform === 'YouTube' ? '- Aspect ratio: 16:9 widescreen\n- Duration: 30-60 seconds total\n- Style: Professional with clear titles' : ''}
      ${platform === 'TikTok' ? '- Aspect ratio: 9:16 vertical\n- Duration: 15-30 seconds total\n- Style: Fast-paced with bold text' : ''}
      ${platform === 'Instagram' ? '- Aspect ratio: 9:16 vertical\n- Duration: 15-30 seconds total\n- Style: Visually appealing with high contrast' : ''}
      ${platform === 'Snapchat' ? '- Aspect ratio: 9:16 vertical\n- Duration: 10-20 seconds total\n- Style: Casual, energetic with bright colors' : ''}
      
      Format your response ONLY as a valid JSON object.
      `

      // Call OpenAI API to generate video content plan
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional video production assistant who creates detailed content plans for social media videos. Respond with JSON only.' 
            },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      
      try {
        // Extract JSON from the response
        const content = data.choices[0].message.content
        let jsonData
        
        try {
          jsonData = JSON.parse(content)
        } catch (e) {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (jsonMatch && jsonMatch[1]) {
            jsonData = JSON.parse(jsonMatch[1])
          } else {
            throw new Error('Could not extract JSON from OpenAI response')
          }
        }
        
        // Use the generated style features
        styleFeatures = jsonData.styleFeatures
        
        // Save the content plan to return
        const contentPlan = {
          title: jsonData.title,
          description: jsonData.description,
          scenes: jsonData.scenes,
          styleFeatures: jsonData.styleFeatures
        }
        
        console.log('Successfully generated content plan with AI')
        
        // Return the generated content and metadata
        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Video content generated successfully',
            contentPlan,
            styleFeatures,
            source: 'ai-generated',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (e) {
        console.error('Failed to parse AI video content:', e)
        throw new Error(`Failed to parse AI video content: ${e.message}`)
      }
    } else {
      // Return model-based style features
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Video style features fetched from model',
          styleFeatures,
          modelDetails: videoModel,
          source: 'model-based',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error: any) {
    console.error(`Error generating video: ${error.message}`)
    console.error(error.stack)

    return new Response(
      JSON.stringify({
        status: 'error',
        message: `Failed to generate video: ${error.message}`,
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
