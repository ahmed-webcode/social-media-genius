
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Generate video content using invideo.io API
    const videoData = await generateInvideoContent(prompt, platform);
    
    // Generate video metadata (title, description, tags)
    const metadata = await generateVideoMetadata(prompt, platform, videoData);
    
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

async function generateInvideoContent(prompt, platform) {
  console.log(`Generating invideo content for ${platform} with prompt: ${prompt}`);
  
  try {
    // Customize the request based on platform
    const aspectRatio = getPlatformAspectRatio(platform);
    const duration = getPlatformDuration(platform);
    
    // Make request to invideo.io API
    const response = await fetch('https://api.invideo.io/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('INVIDEO_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Create a viral ${platform} video about: ${prompt}`,
        aspectRatio: aspectRatio,
        duration: duration,
        format: 'mp4',
        quality: 'high',
        platform: platform.toLowerCase(),
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`InVideo API error: ${response.status} - ${errorText}`);
      throw new Error(`InVideo API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`InVideo API response:`, data);
    
    if (!data.id) {
      throw new Error('Invalid response from InVideo API');
    }
    
    // Poll for video generation status
    const videoData = await pollForVideoCompletion(data.id);
    
    // Generate a second video for shorts if needed
    let shortsData = null;
    if (platform === 'YouTube') {
      shortsData = await generateShortsVersion(prompt, videoData);
    }
    
    // Create content structure for frontend compatibility
    const contentStructure = createContentStructure(videoData, platform, prompt);
    
    return {
      videoUrl: videoData.videoUrl,
      shortsUrl: shortsData ? shortsData.videoUrl : null,
      content: contentStructure
    };
  } catch (error) {
    console.error('Error generating video with InVideo:', error);
    throw new Error(`Failed to generate video with InVideo: ${error.message}`);
  }
}

async function pollForVideoCompletion(videoId, maxAttempts = 30) {
  console.log(`Polling for video completion: ${videoId}`);
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(`https://api.invideo.io/v1/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('INVIDEO_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check video status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Video status check (attempt ${attempts}):`, data.status);
      
      if (data.status === 'completed') {
        return {
          videoId: data.id,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          duration: data.duration,
          createdAt: data.createdAt
        };
      } else if (data.status === 'failed') {
        throw new Error('Video generation failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error polling for video status:`, error);
      throw error;
    }
  }
  
  throw new Error('Video generation timed out');
}

async function generateShortsVersion(prompt, originalVideo) {
  console.log(`Generating shorts version for prompt: ${prompt}`);
  
  try {
    // Make request to create a shorts version
    const response = await fetch('https://api.invideo.io/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('INVIDEO_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Create a short 30-second TikTok-style video about: ${prompt}`,
        aspectRatio: '9:16',
        duration: 30,
        format: 'mp4',
        quality: 'high',
        platform: 'tiktok',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate shorts: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Poll for shorts completion
    return await pollForVideoCompletion(data.id);
  } catch (error) {
    console.error('Error generating shorts version:', error);
    return null;
  }
}

function getPlatformAspectRatio(platform) {
  switch (platform) {
    case 'YouTube':
      return '16:9';
    case 'TikTok':
    case 'Instagram':
    case 'Snapchat':
      return '9:16';
    default:
      return '16:9';
  }
}

function getPlatformDuration(platform) {
  switch (platform) {
    case 'YouTube':
      return 60;
    case 'TikTok':
      return 30;
    case 'Instagram':
      return 60;
    case 'Snapchat':
      return 30;
    default:
      return 60;
  }
}

function createContentStructure(videoData, platform, prompt) {
  // Create a compatible content structure for frontend
  return {
    scenes: [
      {
        sceneId: 1,
        duration: videoData.duration,
        script: prompt,
        visualDescription: `Generated ${platform} video about ${prompt}`,
        transition: 'fade',
        cameraMovement: 'static',
        textOverlay: platform,
        soundDesign: 'Auto-generated'
      }
    ],
    totalDuration: videoData.duration,
    musicTrack: 'Generated audio',
    style: `${platform} style`,
    editingPace: 'Dynamic',
    callToAction: 'Like and Subscribe!'
  };
}

async function generateVideoMetadata(prompt, platform, videoData) {
  return {
    title: `${platform} Video: ${prompt}`,
    description: `This ${platform} video was created about: ${prompt}`,
    tags: [platform.toLowerCase(), 'video', 'content', ...prompt.split(' ').map(word => word.toLowerCase())],
    thumbnailDescription: videoData.thumbnailUrl || 'Generated thumbnail',
    category: 'Entertainment',
    audioTrack: 'Generated audio',
    duration: videoData.content.totalDuration,
    resolution: getPlatformAspectRatio(platform) === '16:9' ? '1920x1080' : '1080x1920',
    captionSuggestions: 'Auto-generated captions',
    uploadStrategy: 'Post during peak hours for best engagement'
  };
}
