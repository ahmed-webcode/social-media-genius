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
    // Create the Supabase client
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
      // Enhanced default style features for better video quality
      styleFeatures = {
        visualStyle: "cinematic",
        colorGrading: "vibrant",
        cameraMovements: ["dolly", "pan", "zoom", "tilt", "tracking", "drone"],
        transitions: ["fade", "whip-pan", "slide", "zoom", "glitch", "flash"],
        pacing: "dynamic",
        audioFeatures: {
          musicType: "upbeat",
          voiceoverStyle: "energetic",
          soundEffects: ["whoosh", "impact", "transition"]
        },
        composition: "rule-of-thirds",
        lighting: "dramatic",
        textOverlays: {
          font: "modern-sans",
          animation: "dynamic",
          position: "centered"
        },
        effectsFilters: ["grain", "vignette", "bloom"]
      };
      console.log('Using enhanced default style features:', styleFeatures);
    }
    
    // Generate viral content using the new model approach
    const results = await generateEnhancedContent(styleFeatures);

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

async function generateEnhancedContent(styleFeatures) {
  // First, generate fresh trendy topics using the GPT-4o model
  const topics = await generateTrendingTopics(styleFeatures);
  const results = [];

  for (const topic of topics) {
    // Enhanced content generation with more specific directives
    if (await isToxic(topic)) {
      console.log(`Topic "${topic}" failed safety check, skipping...`);
      continue;
    }

    // Generate a comprehensive video concept that follows the style features
    const videoPrompt = await createVideoPrompt(topic, styleFeatures);
    
    // Generate detailed storyboard and visuals using the new enhanced model
    const videoContent = await generateStoryboard(topic, videoPrompt, styleFeatures);
    
    // Generate optimized hashtags for maximum reach
    const hashtags = await generateOptimizedHashtags(topic);
    
    // Determine optimal posting schedule based on platform algorithms
    const schedule = determineOptimalPostTime();

    results.push({
      topic,
      videoPrompt,
      videoContent,
      hashtags,
      scheduledFor: schedule,
    });
  }

  return results;
}

async function generateTrendingTopics(styleFeatures) {
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
        content: `You are a cutting-edge content strategist for viral short-form videos. Generate 3 unique topic ideas that:
          - Have strong viral potential based on current trends
          - Appeal to broad audiences aged 18-34
          - Trigger emotional responses like awe, surprise, or curiosity
          - Are timely and tap into current cultural moments
          - Have strong visual storytelling potential
          - Would work exceptionally well with these visual styles: ${styleContext}
          Return only the topics as a comma-separated list.`
      }],
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.split(',').map(topic => topic.trim());
}

async function createVideoPrompt(topic, styleFeatures) {
  // Create a detailed style guide based on the trained model
  let styleGuide = '';
  
  if (styleFeatures) {
    const cameraMovements = Array.isArray(styleFeatures.cameraMovements) 
      ? styleFeatures.cameraMovements.join(', ') 
      : 'dynamic movements';
      
    const transitions = Array.isArray(styleFeatures.transitions) 
      ? styleFeatures.transitions.join(', ') 
      : 'smooth transitions';
    
    styleGuide = `
      Use these specific style elements in your video concept:
      - Visual style: ${styleFeatures.visualStyle || 'cinematic'}
      - Color grading: ${styleFeatures.colorGrading || 'vibrant'}
      - Camera movements: ${cameraMovements}
      - Transitions: ${transitions}
      - Pacing: ${styleFeatures.pacing || 'dynamic'}
      - Music style: ${styleFeatures.audioFeatures?.musicType || 'upbeat'}
      - Composition: ${styleFeatures.composition || 'rule-of-thirds'}
      - Lighting: ${styleFeatures.lighting || 'dramatic'}
      - Text overlays: ${styleFeatures.textOverlays?.font || 'modern sans-serif fonts with dynamic animations'}
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
        content: 'You are a professional video director specializing in viral short-form content. Create a detailed video concept with precise visual directions.'
      }, {
        role: 'user',
        content: `Create an exceptionally detailed video concept for: ${topic}. Include:
          - A scroll-stopping hook that captures attention in the first 2 seconds
          - A clear, concise narrative structure with 5-7 distinct scenes (15-30 seconds total)
          - Specific visual directions for each scene (camera angles, movements, subject positioning)
          - Precise emotional triggers (surprise, curiosity, awe, or inspiration)
          - Call-to-action elements that drive high engagement
          - Highly cinematic visual quality with specific visual effects
          ${styleGuide}
          Make it optimized for algorithms across YouTube Shorts, TikTok, Instagram Reels, etc.
          Be EXTREMELY specific about visual elements, scene transitions, and text overlays.`
      }],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateStoryboard(topic, videoPrompt, styleFeatures) {
  // Create explicit style directions based on training
  const transitions = Array.isArray(styleFeatures.transitions) 
    ? styleFeatures.transitions.join('", "') 
    : 'fade, whip-pan, slide';
    
  const cameraMovements = Array.isArray(styleFeatures.cameraMovements) 
    ? styleFeatures.cameraMovements.join('", "') 
    : 'pan, zoom, tracking';
  
  const styleDirections = `
  Style Guidelines (MUST FOLLOW):
  - Visual Style: "${styleFeatures.visualStyle || 'cinematic'}" 
  - Color Grading: "${styleFeatures.colorGrading || 'vibrant'}"
  - Transitions: Use ONLY these specific transitions: "${transitions}"
  - Camera Movements: Use ONLY these specific camera movements: "${cameraMovements}"
  - Pacing: "${styleFeatures.pacing || 'dynamic'}" pacing is essential
  - Audio: Use "${styleFeatures.audioFeatures?.musicType || 'upbeat'}" music style
  - Composition: "${styleFeatures.composition || 'rule-of-thirds'}" composition
  - Lighting: "${styleFeatures.lighting || 'dramatic'}" lighting
  - Text Animation: Use "${styleFeatures.textOverlays?.animation || 'dynamic'}" text animations
  `;

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
        content: 'You are an expert video producer and director who creates professional storyboards and shot lists for viral short-form videos.'
      }, {
        role: 'user',
        content: `Create a detailed shot-by-shot storyboard for a 15-30 second viral video about: "${topic}"
        
        Based on this video prompt: "${videoPrompt}"
        
        ${styleDirections}
        
        Structure the response as a JSON object with:
        1. An array of 5-7 scenes, each containing:
           - sceneId (number)
           - duration (in seconds, between 2-6 seconds)
           - script (exact text that would be spoken/shown)
           - visualDescription (detailed visual description including camera angles, movements, specific shot types, and composition)
           - transition (specific transition to use from the approved list)
           - visualStyle (specific visual style elements to apply to this scene)
           - audioElements (specific audio elements including music, sound effects, voiceover style)
           - textOverlays (specific text that appears on screen, with font, size, position, animation)
        2. totalDuration (sum of all scene durations)
        3. musicTrack (detailed description of background music style)
        4. voiceoverTone (energetic, calm, authoritative, etc.)
        5. visualStyle (detailed description of the overall visual style)
        6. colorGrading (specific color grading to use)
        7. editingStyle (specific editing technique and pacing)
        
        The scenes must follow a clear 3-act structure: hook, main content, call to action.
        This is a PRODUCTION-READY DOCUMENT that will be used to create the actual video, so be extremely precise and technical in your descriptions.`
      }],
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();
  let videoContent;
  
  try {
    videoContent = JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
    const fallbackContent = createFallbackStoryboard(topic, styleFeatures);
    console.log('Using fallback storyboard:', fallbackContent);
    return fallbackContent;
  }
  
  return videoContent;
}

function createFallbackStoryboard(topic, styleFeatures) {
  const fallbackTransitions = styleFeatures?.transitions || ["fade", "slide", "whip-pan"];
  const fallbackCameraMovements = styleFeatures?.cameraMovements || ["pan", "zoom", "tracking"];
  
  return {
    scenes: [
      {
        sceneId: 1,
        duration: 3,
        script: `Mind-blowing: ${topic}`,
        visualDescription: `Dramatic opening shot of ${topic} with ${Array.isArray(fallbackCameraMovements) ? fallbackCameraMovements[0] : 'pan'} camera movement`,
        transition: Array.isArray(fallbackTransitions) ? fallbackTransitions[0] : 'fade',
        visualStyle: styleFeatures?.visualStyle || "cinematic",
        audioElements: "Dramatic intro music with bass drop",
        textOverlays: {
          text: `WAIT UNTIL YOU SEE THIS`,
          font: "Impact",
          position: "center",
          animation: "pop-in"
        }
      },
      {
        sceneId: 2,
        duration: 5,
        script: `Here's what most people don't know about ${topic}`,
        visualDescription: `Medium close-up revealing key information about ${topic} with ${Array.isArray(fallbackCameraMovements) ? fallbackCameraMovements[1] : 'zoom'} camera movement`,
        transition: Array.isArray(fallbackTransitions) ? fallbackTransitions[1] : 'slide',
        visualStyle: styleFeatures?.visualStyle || "high-contrast",
        audioElements: "Upbeat background music with subtle whoosh sound effect",
        textOverlays: {
          text: `SHOCKING TRUTH`,
          font: "Montserrat Bold",
          position: "bottom",
          animation: "slide-up"
        }
      },
      {
        sceneId: 3,
        duration: 4,
        script: `The key insight about ${topic} that changes everything`,
        visualDescription: `Revealing shot with dramatic lighting showcasing the main point with ${Array.isArray(fallbackCameraMovements) ? fallbackCameraMovements[2] : 'tracking'} movement`,
        transition: Array.isArray(fallbackTransitions) ? fallbackTransitions[2] : 'whip-pan',
        visualStyle: styleFeatures?.visualStyle || "vibrant",
        audioElements: "Rising tension music with impact sound",
        textOverlays: {
          text: `GAME CHANGER`,
          font: "Bebas Neue",
          position: "center",
          animation: "zoom-in"
        }
      },
      {
        sceneId: 4,
        duration: 3,
        script: `This is why you need to know this now`,
        visualDescription: `Final revealing shot with dramatic conclusion`,
        transition: "fade",
        visualStyle: "dramatic",
        audioElements: "Music crescendo with notification sound effect",
        textOverlays: {
          text: `DON'T MISS THIS`,
          font: "Oswald",
          position: "full-screen",
          animation: "flash"
        }
      },
      {
        sceneId: 5,
        duration: 3,
        script: `Follow for more mind-blowing content!`,
        visualDescription: `Call to action with animated subscribe button and social handles`,
        transition: "zoom",
        visualStyle: "bright",
        audioElements: "Upbeat outro with bell sound",
        textOverlays: {
          text: `FOLLOW NOW`,
          font: "Anton",
          position: "bottom",
          animation: "bounce"
        }
      }
    ],
    totalDuration: 18,
    musicTrack: styleFeatures?.audioFeatures?.musicType || "high-energy electronic",
    voiceoverTone: "excited and energetic",
    visualStyle: styleFeatures?.visualStyle || "modern cinematic with high contrast",
    colorGrading: styleFeatures?.colorGrading || "vibrant with teal and orange highlights",
    editingStyle: "fast-paced with dynamic transitions"
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

async function generateOptimizedHashtags(topic) {
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
        content: 'You are an expert in social media optimization and trend analysis.'
      }, {
        role: 'user',
        content: `Generate 12-15 highly optimized hashtags for: ${topic}. Include:
          - 3-4 trending viral hashtags with massive reach
          - 3-4 niche-specific hashtags for targeted algorithm performance
          - 2-3 challenge-related hashtags that encourage participation
          - 2-3 branded or unique hashtags that could trend
          - 1-2 community hashtags for better discoverability
          
          Return them as a simple JSON array of strings without explanations.`
      }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();
  
  try {
    const parsedContent = JSON.parse(data.choices[0].message.content);
    return Array.isArray(parsedContent) ? parsedContent : extractHashtagsFromObject(parsedContent);
  } catch (e) {
    console.error('Failed to parse hashtags JSON:', e);
    // Extract hashtags from text as fallback
    const hashtagString = data.choices[0].message.content;
    return hashtagString.match(/#[a-zA-Z0-9_]+/g) || 
           hashtagString.split(/,|\n/).map(tag => tag.trim());
  }
}

function extractHashtagsFromObject(obj) {
  // If the response is an object with hashtags property, extract it
  if (obj.hashtags && Array.isArray(obj.hashtags)) {
    return obj.hashtags;
  }
  
  // Otherwise, try to find the first array in the object
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      return obj[key];
    }
  }
  
  // Last resort fallback
  return ['#viral', '#trending', '#content', '#fyp', '#foryou'];
}

function determineOptimalPostTime() {
  // Enhanced posting time logic based on platform algorithms and engagement research
  const now = new Date();
  
  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = now.getDay();
  
  // Platform-optimized posting times based on latest algorithm research
  let optimalHours;
  
  if (dayOfWeek === 0) {
    // Sunday - highest engagement in afternoon
    optimalHours = [12, 13, 14, 15, 16];
  } else if (dayOfWeek === 6) {
    // Saturday - midday and early evening peaks
    optimalHours = [11, 12, 13, 17, 18, 19];
  } else if (dayOfWeek === 5) {
    // Friday - lunch break and post-work hours
    optimalHours = [12, 13, 17, 18, 19, 20];
  } else if (dayOfWeek === 1) {
    // Monday - early morning and late evening
    optimalHours = [7, 8, 20, 21, 22];
  } else {
    // Tuesday-Thursday - morning, lunch break, and evening
    optimalHours = [7, 8, 12, 13, 18, 19, 20];
  }
  
  // Select a random optimal hour weighted towards better performing times
  const randomOptimalHour = optimalHours[Math.floor(Math.random() * optimalHours.length)];
  
  // Set the time to the optimal hour with a strategic minute timing
  // (avoiding exact hour marks which have more competition)
  now.setHours(randomOptimalHour);
  now.setMinutes(Math.floor(Math.random() * 45) + 5); // 5-50 minutes past the hour
  now.setSeconds(0);
  now.setMilliseconds(0);
  
  // Ensure the time is in the future
  if (now.getTime() < Date.now()) {
    // If the time is in the past, schedule for tomorrow at the same time
    now.setDate(now.getDate() + 1);
  }
  
  return now.toISOString();
}
