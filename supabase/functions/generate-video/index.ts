
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  console.log("Generate video function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
      console.log(`Request received with prompt: ${requestBody.prompt?.substring(0, 30)}...`);
    } catch (error) {
      console.error("Failed to parse request JSON:", error);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Invalid JSON in request body',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { prompt, platform, generateShorts } = requestBody;
    
    if (!prompt) {
      console.error("Missing required parameter: prompt");
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Prompt is required',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!platform) {
      console.error("Missing required parameter: platform");
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Platform is required',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Generating video for platform: ${platform}, prompt: ${prompt.substring(0, 50)}...`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate content data for the frontend to use
    const videoData = await generateContent(prompt, platform);
    
    // Generate metadata (title, description, tags)
    const metadata = await generateVideoMetadata(prompt, platform);
    
    // Create response with video data
    const response = {
      status: 'success',
      videoUrl: videoData.videoUrl,
      shortsUrl: generateShorts ? videoData.shortsUrl : null,
      metadata: {
        ...metadata,
        content: videoData.content
      }
    };
    
    console.log(`Successfully generated ${platform} video content plan`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error generating video:`, error);
    let errorMessage = error.message || 'Unknown error';
    
    return new Response(JSON.stringify({
      status: 'error',
      message: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateContent(prompt, platform) {
  console.log(`Generating content for ${platform} with prompt: ${prompt.substring(0, 50)}...`);
  
  try {
    // Instead of calling external API, generate content locally
    const aspect = platform === 'YouTube' ? '16:9' : '9:16';
    const duration = platform === 'YouTube' ? 60 : 30;
    
    // Create scene structure
    const scenes = createScenes(prompt, platform, duration);
    
    // Create content structure
    const content = {
      scenes: scenes,
      totalDuration: duration,
      musicTrack: 'Generated audio',
      style: `${platform} style`,
      editingPace: 'Dynamic',
      callToAction: 'Like and Subscribe!'
    };
    
    // Create placeholder URLs - actual video generation will happen in the frontend
    const videoId = Date.now().toString();
    const videoUrl = `client-side-generation://${platform.toLowerCase()}/${videoId}`;
    const shortsUrl = platform === 'YouTube' ? `client-side-generation://shorts/${videoId}` : null;
    
    return {
      videoUrl,
      shortsUrl,
      content
    };
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

function createScenes(prompt, platform, totalDuration) {
  // Number of scenes based on duration
  const sceneCount = Math.max(3, Math.floor(totalDuration / 10));
  
  // Generate scenes
  const scenes = [];
  
  // Intro scene
  scenes.push({
    sceneId: 1,
    duration: Math.floor(totalDuration / sceneCount),
    script: `Introduction to: ${prompt}`,
    visualDescription: `Opening scene about ${prompt}`,
    transition: 'fade',
    cameraMovement: 'zoom-in',
    textOverlay: 'Title',
    soundDesign: 'Intro music'
  });
  
  // Middle scenes
  for (let i = 2; i < sceneCount; i++) {
    scenes.push({
      sceneId: i,
      duration: Math.floor(totalDuration / sceneCount),
      script: `Key point ${i-1} about ${prompt}`,
      visualDescription: `Detail ${i-1} about ${prompt}`,
      transition: i % 2 === 0 ? 'slide' : 'fade',
      cameraMovement: i % 2 === 0 ? 'pan-right' : 'pan-left',
      textOverlay: `Point ${i-1}`,
      soundDesign: 'Background music'
    });
  }
  
  // Outro scene
  scenes.push({
    sceneId: sceneCount,
    duration: Math.floor(totalDuration / sceneCount),
    script: `Conclusion about ${prompt}`,
    visualDescription: `Ending scene with call to action`,
    transition: 'fade',
    cameraMovement: 'zoom-out',
    textOverlay: 'Subscribe',
    soundDesign: 'Outro music'
  });
  
  return scenes;
}

async function generateVideoMetadata(prompt, platform) {
  // Extract keywords from prompt for tags
  const keywords = prompt.split(' ')
    .filter(word => word.length > 3)
    .map(word => word.toLowerCase())
    .slice(0, 5);
  
  // Add platform-specific tags
  const platformTags = {
    'YouTube': ['guide', 'review', '4k', 'tutorial'],
    'TikTok': ['fyp', 'foryoupage', 'viral', 'trending'],
    'Instagram': ['reels', 'instareels', 'instagram', 'igdaily'],
    'Snapchat': ['snapchat', 'snapcreator', 'snapchatcreator']
  };
  
  // Combine keyword tags with platform tags
  const allTags = [
    ...keywords.map(k => `#${k}`),
    ...(platformTags[platform] || []).map(t => `#${t}`)
  ];
  
  return {
    title: `${platform} Video: ${prompt}`,
    description: `This ${platform} video was created about: ${prompt}`,
    tags: allTags,
    thumbnailDescription: 'Generated thumbnail',
    category: 'Entertainment',
    audioTrack: 'Generated audio',
    duration: platform === 'YouTube' ? 60 : 30,
    resolution: platform === 'YouTube' ? '1920x1080' : '1080x1920'
  };
}
