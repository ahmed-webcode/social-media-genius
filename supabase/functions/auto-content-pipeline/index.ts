
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // First, get trained model style to influence content generation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the most recent training log to use its style features
    const { data: trainingLogs, error: trainingError } = await supabase
      .from('training_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (trainingError) {
      console.error('Error fetching training logs:', trainingError);
    }
    
    // Extract style features from training data if available
    // Use a default set of style features if no training data is available
    let styleFeatures = null;
    if (trainingLogs && trainingLogs.length > 0 && trainingLogs[0]?.metadata?.styleFeatures) {
      styleFeatures = trainingLogs[0].metadata.styleFeatures;
      console.log('Using style features from training:', styleFeatures);
    } else {
      // Default style features when no training data is available
      styleFeatures = {
        visualStyle: "high-contrast",
        colorGrading: "vibrant",
        cameraMovements: ["pan", "zoom", "tilt", "tracking"],
        transitions: ["fade", "whip-pan", "slide", "zoom"],
        pacing: "fast",
        audioFeatures: {
          musicType: "upbeat"
        },
        composition: "dynamic",
        lighting: "dramatic"
      };
      console.log('Using default style features:', styleFeatures);
    }
    
    // Generate 3 viral topics with enhanced quality using the trained style
    const topics = await generateViralTopics(styleFeatures);
    const results = [];

    for (const topic of topics) {
      // Validate topic safety
      if (await isToxic(topic)) {
        console.log(`Topic "${topic}" failed safety check, skipping...`);
        continue;
      }

      // Generate enhanced content structure influenced by the trained model
      const videoPrompt = await createViralVideoPrompt(topic, styleFeatures);
      const videoContent = await generateVideoContent(topic, videoPrompt, styleFeatures);
      const hashtags = await generateViralHashtags(topic);
      const schedule = determineOptimalPostTime();

      results.push({
        topic,
        videoPrompt,
        videoContent,
        hashtags,
        scheduledFor: schedule,
      });
    }

    return new Response(JSON.stringify({
      status: 'success',
      data: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      willRetry: true,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateViralTopics(styleFeatures) {
  const styleContext = styleFeatures ? 
    `Consider these style features for video creation: ${JSON.stringify(styleFeatures)}` : 
    '';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: `You are a viral content expert. Generate 3 highly engaging topic ideas that:
          - Have proven viral potential
          - Appeal to broad audiences
          - Trigger emotional responses
          - Are timely and relevant
          - Have shareable value
          - Would work well with visual styles like: high-contrast, cinematic, fast-paced
          ${styleContext}
          Return only the topics as a comma-separated list.`
      }],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.split(',').map(topic => topic.trim());
}

async function createViralVideoPrompt(topic, styleFeatures) {
  // Create a style guide based on the trained model
  let styleGuide = '';
  
  if (styleFeatures) {
    styleGuide = `
      Use these specific style elements in your video concept:
      - Visual style: ${styleFeatures.visualStyle}
      - Color grading: ${styleFeatures.colorGrading}
      - Camera movements: ${styleFeatures.cameraMovements.join(', ')}
      - Transitions: ${styleFeatures.transitions.join(', ')}
      - Pacing: ${styleFeatures.pacing}
      - Music style: ${styleFeatures.audioFeatures?.musicType || 'upbeat'}
      - Composition: ${styleFeatures.composition || 'dynamic'}
      - Lighting: ${styleFeatures.lighting || 'dramatic'}
    `;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'Create a detailed video prompt that will generate viral-worthy visuals with specific visual elements and cinematic quality.'
      }, {
        role: 'user',
        content: `Create a viral video concept for: ${topic}. Include:
          - A powerful hook that captures attention in the first 3 seconds
          - A clear narrative structure with 5-7 scenes (10-30 seconds total)
          - Eye-catching visual elements and transitions
          - Emotional triggers (surprise, curiosity, humor, or inspiration)
          - Call-to-action elements that encourage engagement
          - Cinematic quality with high-contrast visuals
          ${styleGuide}
          Make it platform-agnostic so it works across YouTube, TikTok, Instagram, etc.`
      }],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateVideoContent(topic, videoPrompt, styleFeatures) {
  // Create explicit style directions based on training
  let styleDirections = '';
  
  if (styleFeatures) {
    const transitions = styleFeatures.transitions.join('", "');
    const cameraMovements = styleFeatures.cameraMovements.join('", "');
    
    styleDirections = `
    Style Guidelines (MUST FOLLOW):
    - Visual Style: "${styleFeatures.visualStyle}" 
    - Color Grading: "${styleFeatures.colorGrading}"
    - Transitions: Use ONLY these specific transitions: "${transitions}"
    - Camera Movements: Use ONLY these specific camera movements: "${cameraMovements}"
    - Pacing: "${styleFeatures.pacing}" pacing is essential
    - Audio: Use "${styleFeatures.audioFeatures?.musicType || 'upbeat'}" music style
    - Composition: "${styleFeatures.composition || 'dynamic'}" composition
    - Lighting: "${styleFeatures.lighting || 'dramatic'}" lighting
    `;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'Generate a cinematic, professional storyboard that will result in viral videos with strong visual appeal and high production value.'
      }, {
        role: 'user',
        content: `Create a detailed storyboard for a 10-30 second viral video about: "${topic}"
        
        Based on this video prompt: "${videoPrompt}"
        
        ${styleDirections}
        
        Structure the response as a JSON object with:
        1. An array of 5-7 scenes, each containing:
           - sceneId (number)
           - duration (in seconds, between 2-6 seconds)
           - script (exact text that would be spoken/shown)
           - visualDescription (detailed visual description including camera angles, movements, and exact specifications)
           - transition (exactly which transition to use from the approved list)
           - visualStyle (specific visual style elements to apply)
           - audioElements (specific audio elements including music, SFX, etc.)
        2. totalDuration (sum of all scene durations)
        3. musicTrack (detailed description of background music style)
        4. voiceoverTone (energetic, calm, authoritative, etc.)
        5. visualStyle (detailed description of the visual style)
        6. colorGrading (exact color grading to use)
        7. textOverlays (details of any on-screen text)
        
        The scenes should follow a clear narrative structure with a hook, main points, and call to action.
        This is a CRITICAL PRODUCTION DOCUMENT, so be extremely detailed and specific.`
      }],
    }),
  });

  const data = await response.json();
  let videoContent;
  
  try {
    // Try to parse as JSON first
    videoContent = JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
    // Fall back to structured format
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = data.choices[0].message.content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        videoContent = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not extract JSON');
      }
    } catch (e2) {
      console.error('Failed to extract JSON from markdown:', e2);
      // Last resort: create a basic structure
      videoContent = createFallbackVideoContent(topic, styleFeatures);
    }
  }
  
  return videoContent;
}

function createFallbackVideoContent(topic, styleFeatures) {
  const fallbackTransitions = styleFeatures?.transitions || ["fade", "slide", "whip-pan"];
  const fallbackCameraMovements = styleFeatures?.cameraMovements || ["pan", "zoom", "tracking"];
  
  return {
    scenes: [
      {
        sceneId: 1,
        duration: 3,
        script: `Introducing: ${topic}`,
        visualDescription: `Opening title screen for ${topic} with ${fallbackCameraMovements[0]} camera movement`,
        transition: fallbackTransitions[0],
        visualStyle: styleFeatures?.visualStyle || "high-contrast",
        audioElements: "Upbeat intro music with subtle whoosh sound effect"
      },
      {
        sceneId: 2,
        duration: 5,
        script: `Here's what you need to know about ${topic}`,
        visualDescription: `Main content display for ${topic} with ${fallbackCameraMovements[1]} camera movement`,
        transition: fallbackTransitions[1],
        visualStyle: styleFeatures?.visualStyle || "cinematic",
        audioElements: "Continuing background music with voice narration"
      },
      {
        sceneId: 3,
        duration: 3,
        script: `Subscribe for more!`,
        visualDescription: `Call to action screen with ${fallbackCameraMovements[2]} camera movement`,
        transition: fallbackTransitions[2],
        visualStyle: styleFeatures?.visualStyle || "vibrant",
        audioElements: "Music crescendo with notification sound effect"
      }
    ],
    totalDuration: 11,
    musicTrack: styleFeatures?.audioFeatures?.musicType || "upbeat",
    voiceoverTone: "energetic",
    visualStyle: styleFeatures?.visualStyle || "modern",
    colorGrading: styleFeatures?.colorGrading || "vibrant",
    textOverlays: "Bold, sans-serif font with animated entrance"
  };
}

async function isToxic(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });

    const data = await response.json();
    return data.results[0]?.flagged || false;
  } catch (error) {
    console.error('Moderation check failed:', error);
    return false;
  }
}

async function generateViralHashtags(topic) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'Generate viral-optimized hashtags that maximize reach and engagement.'
      }, {
        role: 'user',
        content: `Generate 10-15 trending and viral-optimized hashtags for: ${topic}. Include:
          - High-volume trending hashtags
          - Niche-specific tags for targeted reach
          - Engagement-focused tags that encourage interaction
          - Content-category tags for better discoverability
          - 1-2 branded or unique hashtags
          
          Format them as a JSON array of strings.`
      }],
    }),
  });

  const data = await response.json();
  
  try {
    // Try to parse as JSON first
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    // Try to extract JSON if it's wrapped in markdown code blocks
    try {
      const jsonMatch = data.choices[0].message.content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
    } catch (e2) {
      console.error('Failed to extract JSON from markdown:', e2);
    }
    
    // If parsing fails, extract hashtags from the text
    const hashtagString = data.choices[0].message.content;
    return hashtagString.match(/#[a-zA-Z0-9_]+/g) || 
           hashtagString.split(/,|\n/).map(tag => tag.trim());
  }
}

function determineOptimalPostTime() {
  // More sophisticated posting time logic based on platform research
  const now = new Date();
  
  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = now.getDay();
  
  // Different optimal hours based on day of week
  // Research shows engagement peaks at different times
  let optimalHours;
  
  if (dayOfWeek === 0) {
    // Sunday - typically late morning to afternoon
    optimalHours = [11, 12, 13, 14, 15];
  } else if (dayOfWeek === 6) {
    // Saturday - typically midday hours
    optimalHours = [12, 13, 14, 15, 16];
  } else if (dayOfWeek === 5) {
    // Friday - afternoon and early evening
    optimalHours = [14, 15, 16, 17, 18, 19];
  } else {
    // Weekdays - typically early morning, lunch break, or evening
    optimalHours = [7, 8, 12, 13, 17, 18, 19, 20];
  }
  
  // Select a random optimal hour
  const randomOptimalHour = optimalHours[Math.floor(Math.random() * optimalHours.length)];
  
  // Set the time to the optimal hour with a random minute
  now.setHours(randomOptimalHour);
  now.setMinutes(Math.floor(Math.random() * 60));
  now.setSeconds(0);
  now.setMilliseconds(0);
  
  // Ensure the time is in the future
  if (now.getTime() < Date.now()) {
    // If the time is in the past, schedule for tomorrow
    now.setDate(now.getDate() + 1);
  }
  
  return now.toISOString();
}
