
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, platform, generateShorts } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    console.log(`Generating video for platform: ${platform}, prompt: ${prompt.substring(0, 50)}...`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Step 1: Generate detailed video content structure and storyboard
    const videoContent = await generateEnhancedVideoContent(prompt, platform);
    
    // Step 2: Generate visual direction and style guide
    const visualStyle = await generateVisualStyleGuide(prompt, platform, videoContent);
    
    // Step 3: Generate video metadata (title, description, tags)
    const metadata = await generateVideoMetadata(prompt, platform, videoContent);
    
    // Step 4: Mock URLs for the generated videos (in a real scenario, these would be actual video URLs)
    const videoUrl = await mockVideoGeneration(prompt, platform, 'main', videoContent);
    let shortsUrl = null;
    
    if (generateShorts) {
      shortsUrl = await mockVideoGeneration(prompt, platform, 'shorts', videoContent);
    }
    
    // Create a complete response package
    const response = {
      status: 'success',
      videoUrl,
      shortsUrl,
      metadata: {
        ...metadata,
        content: videoContent
      }
    };
    
    console.log(`Successfully generated ${platform} video content`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error generating video:`, error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateEnhancedVideoContent(prompt, platform) {
  console.log(`Generating enhanced video content for ${platform}`);
  
  // Create platform-specific formatting
  const platformGuide = getPlatformGuide(platform);
  
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
        content: `You are an expert video director specializing in highly viral ${platform} content. You create detailed, professional storyboards and shot lists that result in millions of views.`
      }, {
        role: 'user',
        content: `Create a detailed, production-ready storyboard for this video concept: "${prompt}"
        
        ${platformGuide}
        
        Structure your response as a JSON object with:
        1. scenes: Array of 5-7 scenes, each containing:
           - sceneId (number)
           - duration (in seconds)
           - script (exact spoken/text content)
           - visualDescription (detailed shot description)
           - transition (specific transition effect)
           - cameraMovement (specific camera technique)
           - textOverlay (text that appears on screen)
           - soundDesign (specific audio elements)
        2. totalDuration (sum of all scene durations)
        3. musicTrack (specific music style description)
        4. style (visual aesthetic description)
        5. editingPace (description of editing rhythm)
        6. callToAction (specific viewer prompt at the end)
        
        The video should follow a proven viral structure:
        - Start with a scroll-stopping hook (2-3 seconds)
        - Deliver key points with visual impact (10-15 seconds)
        - End with strong call-to-action (3-5 seconds)
        
        Be extremely specific about visual elements, text animations, and transitions.`
      }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }),
  });

  const data = await response.json();
  
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error('Failed to parse video content JSON:', e);
    return createFallbackContent(prompt, platform);
  }
}

function getPlatformGuide(platform) {
  switch (platform) {
    case 'YouTube':
      return `Optimize for YouTube Shorts:
        - Vertical 9:16 aspect ratio
        - 15-60 seconds duration
        - Strong hook in first 3 seconds
        - Fast-paced editing with clear text overlays
        - End with subscribe prompt and related video suggestion
        - Use high-contrast visuals and dynamic transitions
        - Include trending audio and sound effects`;
        
    case 'TikTok':
      return `Optimize for TikTok:
        - Vertical 9:16 aspect ratio
        - 15-30 seconds optimal duration
        - Hook viewers in first 1-2 seconds
        - Use trending sounds, effects, and transitions
        - Incorporate text overlays with TikTok-native fonts
        - End with clear call-to-action for comments/follows
        - Include trending hashtags in content`;
        
    case 'Instagram':
      return `Optimize for Instagram Reels:
        - Vertical 9:16 aspect ratio
        - 15-30 seconds optimal duration
        - Visually appealing, high-quality aesthetic
        - Clean text overlays with Instagram-friendly fonts
        - Smooth transitions and filters
        - Include on-trend music and effects
        - End with engagement prompt for saves/shares`;
        
    case 'Snapchat':
      return `Optimize for Snapchat Spotlight:
        - Vertical 9:16 aspect ratio
        - 10-60 seconds duration
        - Fast-paced content with quick cuts
        - Bold text overlays with Snapchat visual style
        - Incorporate creative lens effects and filters
        - Use trending sounds and effects
        - Simple, direct messaging`;
        
    default:
      return `Optimize for social media:
        - Vertical 9:16 aspect ratio
        - 15-30 seconds optimal duration
        - Hook viewers in first 2-3 seconds
        - Clear text overlays with modern fonts
        - Dynamic transitions and effects
        - End with strong call-to-action`;
  }
}

function createFallbackContent(prompt, platform) {
  // Create a simplified but complete fallback content structure
  return {
    scenes: [
      {
        sceneId: 1,
        duration: 3,
        script: `Introducing: ${prompt}`,
        visualDescription: `Opening title with attention-grabbing visual of main subject`,
        transition: "fade",
        cameraMovement: "zoom in",
        textOverlay: "YOU WON'T BELIEVE THIS",
        soundDesign: "Dramatic intro sound with bass drop"
      },
      {
        sceneId: 2,
        duration: 5,
        script: `Here's what you need to know about ${prompt}`,
        visualDescription: `Medium shot revealing key information with graphics overlay`,
        transition: "slide left",
        cameraMovement: "pan right",
        textOverlay: "SHOCKING FACTS",
        soundDesign: "Background music builds with transition effect"
      },
      {
        sceneId: 3,
        duration: 4,
        script: `The most important aspect is...`,
        visualDescription: `Close-up shot of key detail with highlighted focus`,
        transition: "whip pan",
        cameraMovement: "tracking shot",
        textOverlay: "CRUCIAL DETAIL",
        soundDesign: "Rising tension with notification sound"
      },
      {
        sceneId: 4,
        duration: 3,
        script: `Now you know why this matters!`,
        visualDescription: `Revealing final key point with animated graphics`,
        transition: "zoom",
        cameraMovement: "pull back",
        textOverlay: "MIND = BLOWN",
        soundDesign: "Impact sound with music crescendo"
      },
      {
        sceneId: 5,
        duration: 3,
        script: `Follow for more amazing content!`,
        visualDescription: `Outro with subscribe button animation and creator handle`,
        transition: "fade",
        cameraMovement: "static",
        textOverlay: "FOLLOW NOW",
        soundDesign: "Upbeat outro with bell notification sound"
      }
    ],
    totalDuration: 18,
    musicTrack: "Trending upbeat electronic with rhythmic beats",
    style: "High-contrast visuals with modern color grading",
    editingPace: "Fast-paced with dynamic cuts and transitions",
    callToAction: "Follow, like and comment for more content like this!"
  };
}

async function generateVisualStyleGuide(prompt, platform, videoContent) {
  console.log(`Generating visual style guide for ${platform}`);
  
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
        content: `You are an expert video editor and colorist specializing in viral ${platform} content.`
      }, {
        role: 'user',
        content: `Create a detailed visual style guide for this video: "${prompt}"
        
        Based on this storyboard: ${JSON.stringify(videoContent)}
        
        Provide specific details about:
        1. Color palette and grading (specific LUT suggestions)
        2. Text animations and typography (fonts, sizes, animations)
        3. Visual effects and filters
        4. Transition specifics (timing, style, easing)
        5. Composition guidelines (rule of thirds, leading lines, etc.)
        
        Make this guide technically precise for a video editor to implement.`
      }],
      temperature: 0.6,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateVideoMetadata(prompt, platform, videoContent) {
  console.log(`Generating metadata for ${platform}`);
  
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
        content: `You are an expert in ${platform} optimization and content metadata.`
      }, {
        role: 'user',
        content: `Create optimized metadata for this ${platform} video: "${prompt}"
        
        Based on this storyboard: ${JSON.stringify(videoContent)}
        
        Return a JSON object with:
        1. title (attention-grabbing, optimized for CTR)
        2. description (compelling with keywords)
        3. tags (array of relevant hashtags and keywords)
        4. thumbnailDescription (detailed description of an optimal thumbnail)
        5. category (content category)
        6. audioTrack (suggested track name/style)
        7. duration (in seconds, matches the storyboard)
        8. resolution (recommended resolution for this platform)
        9. captionSuggestions (key timestamps and caption text)`
      }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }),
  });

  const data = await response.json();
  
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error('Failed to parse metadata JSON:', e);
    
    // Return fallback metadata
    return {
      title: `Amazing ${prompt} You Need to See`,
      description: `Check out this incredible video about ${prompt}. Follow for more amazing content!`,
      tags: ["trending", "viral", prompt.replace(/\s+/g, ''), "amazing", "mustwatch"],
      thumbnailDescription: `Eye-catching image of ${prompt} with bold text overlay`,
      category: "Entertainment",
      audioTrack: "Trending upbeat track",
      duration: videoContent.totalDuration || 18,
      resolution: platform === "YouTube" ? "1080x1920" : "1080x1920",
      captionSuggestions: "Add captions highlighting key points for accessibility"
    };
  }
}

async function mockVideoGeneration(prompt, platform, type, videoContent) {
  // In a real implementation, this would call an actual video generation API
  // For now, we're creating mockup URLs based on the parameters
  
  console.log(`Mocking ${type} video generation for ${platform}`);
  
  // Create a unique ID based on the prompt and timestamp
  const uniqueId = btoa(`${prompt}-${Date.now()}`).substring(0, 12);
  
  // Create platform-specific "fake" video URLs that look realistic
  switch (platform) {
    case 'YouTube':
      return type === 'shorts' 
        ? `https://youtube.com/shorts/${uniqueId}` 
        : `https://youtu.be/${uniqueId}`;
      
    case 'TikTok':
      return `https://tiktok.com/@creator/video/${uniqueId}`;
      
    case 'Instagram':
      return `https://instagram.com/reel/${uniqueId}`;
      
    case 'Snapchat':
      return `https://snapchat.com/spotlight/${uniqueId}`;
      
    default:
      return `https://video-platform.com/${type}/${uniqueId}`;
  }
}
