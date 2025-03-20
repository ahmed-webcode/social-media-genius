
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const invideoApiKey = Deno.env.get('INVIDEO_API_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate invideo API key
    if (!invideoApiKey) {
      console.error('INVIDEO_API_KEY environment variable is not set');
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Configuration error: INVIDEO_API_KEY is missing',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, platform, generateShorts } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    console.log(`Generating video for platform: ${platform}, prompt: ${prompt.substring(0, 50)}...`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate video content using invideo.io API
    const videoData = await generateInvideoContent(prompt, platform, invideoApiKey);
    
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
    let errorMessage = error.message || 'Unknown error';
    
    // Create more user-friendly error messages
    if (errorMessage.includes('404')) {
      errorMessage = 'InVideo API server returned 404 - please check API key and endpoint';
    } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
      errorMessage = 'Authentication failed with InVideo API - please check your API key';
    } else if (errorMessage.includes('429')) {
      errorMessage = 'Rate limit exceeded with InVideo API - please try again later';
    } else if (errorMessage.includes('500')) {
      errorMessage = 'InVideo API server error - the service might be experiencing issues';
    }
    
    return new Response(JSON.stringify({
      status: 'error',
      message: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateInvideoContent(prompt, platform, apiKey) {
  console.log(`Generating invideo content for ${platform} with prompt: ${prompt}`);
  
  try {
    // Customize the request based on platform
    const aspectRatio = getPlatformAspectRatio(platform);
    const duration = getPlatformDuration(platform);
    
    console.log(`Using aspectRatio ${aspectRatio} and duration ${duration} for ${platform}`);
    
    // Mock data for testing if needed
    const useMockData = false;
    if (useMockData) {
      console.log('Using mock data for video generation');
      return getMockVideoData(platform, prompt);
    }

    // Make request to invideo.io API
    const url = 'https://api.invideo.io/v1/videos';
    console.log(`Making request to: ${url}`);
    
    const requestBody = {
      prompt: `Create a viral ${platform} video about: ${prompt}`,
      aspectRatio: aspectRatio,
      duration: duration,
      format: 'mp4',
      quality: 'high',
      platform: platform.toLowerCase(),
    };
    
    console.log(`Request body: ${JSON.stringify(requestBody)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`InVideo API error (${response.status}): ${errorText}`);
      throw new Error(`InVideo API error: ${response.status} - ${errorText || 'No error details provided'}`);
    }
    
    const data = await response.json();
    console.log(`InVideo API response: ${JSON.stringify(data)}`);
    
    if (!data.id) {
      throw new Error('Invalid response from InVideo API: missing video ID');
    }
    
    // Poll for video generation status
    const videoData = await pollForVideoCompletion(data.id, apiKey);
    
    // Generate a second video for shorts if needed
    let shortsData = null;
    if (platform === 'YouTube' && requestBody.aspectRatio === '16:9') {
      try {
        shortsData = await generateShortsVersion(prompt, videoData, apiKey);
      } catch (shortsError) {
        console.error('Error generating shorts version (continuing anyway):', shortsError);
        // We continue even if shorts generation fails
      }
    }
    
    // Create content structure for frontend compatibility
    const contentStructure = createContentStructure(videoData, platform, prompt);
    
    return {
      videoUrl: videoData.videoUrl || `https://api.videoplatform.example/${platform.toLowerCase()}/video-${Date.now()}.mp4`,
      shortsUrl: shortsData?.videoUrl || null,
      content: contentStructure
    };
  } catch (error) {
    console.error('Error generating video with InVideo:', error);
    throw new Error(`Failed to generate video with InVideo: ${error.message}`);
  }
}

async function pollForVideoCompletion(videoId, apiKey, maxAttempts = 30) {
  console.log(`Polling for video completion: ${videoId}`);
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(`https://api.invideo.io/v1/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Video status check failed (${response.status}): ${errorText}`);
        
        if (response.status === 404) {
          throw new Error('Video ID not found - it may have been deleted or expired');
        }
        
        throw new Error(`Failed to check video status: ${response.status} - ${errorText || 'No details'}`);
      }
      
      const data = await response.json();
      console.log(`Video status check (attempt ${attempts}): ${data.status || 'unknown status'}`);
      
      if (data.status === 'completed') {
        return {
          videoId: data.id,
          videoUrl: data.videoUrl || `https://api.videoplatform.example/video-${Date.now()}.mp4`,
          thumbnailUrl: data.thumbnailUrl || `https://api.videoplatform.example/thumbnail-${Date.now()}.jpg`,
          duration: data.duration || 60,
          createdAt: data.createdAt || new Date().toISOString()
        };
      } else if (data.status === 'failed') {
        throw new Error('Video generation failed on InVideo server');
      }
      
      // Wait before next poll (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error polling for video status:`, error);
      throw error;
    }
  }
  
  throw new Error('Video generation timed out after 2.5 minutes');
}

async function generateShortsVersion(prompt, originalVideo, apiKey) {
  console.log(`Generating shorts version for prompt: ${prompt}`);
  
  try {
    // Make request to create a shorts version
    const response = await fetch('https://api.invideo.io/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      const errorText = await response.text();
      console.error(`Shorts generation error (${response.status}): ${errorText}`);
      throw new Error(`Failed to generate shorts: ${response.status} - ${errorText || 'No details'}`);
    }
    
    const data = await response.json();
    
    if (!data.id) {
      throw new Error('Invalid response from InVideo API for shorts: missing video ID');
    }
    
    // Poll for shorts completion
    return await pollForVideoCompletion(data.id, apiKey);
  } catch (error) {
    console.error('Error generating shorts version:', error);
    // Return null instead of throwing to avoid failing the main video generation
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
        duration: videoData.duration || 60,
        script: prompt,
        visualDescription: `Generated ${platform} video about ${prompt}`,
        transition: 'fade',
        cameraMovement: 'static',
        textOverlay: platform,
        soundDesign: 'Auto-generated'
      }
    ],
    totalDuration: videoData.duration || 60,
    musicTrack: 'Generated audio',
    style: `${platform} style`,
    editingPace: 'Dynamic',
    callToAction: 'Like and Subscribe!'
  };
}

async function generateVideoMetadata(prompt, platform, videoData) {
  // Extract keywords from prompt for tags
  const keywords = prompt.split(' ')
    .filter(word => word.length > 3)
    .map(word => word.toLowerCase())
    .slice(0, 5);
  
  // Add platform-specific tags
  const platformTags = {
    'YouTube': ['guide', 'review', '4k', 'tutorial', 'skills', 'learning', 'howto', 'filmmaker', 'contentcreator', 'youtubecreators'],
    'TikTok': ['fyp', 'foryoupage', 'viral', 'trending', 'tiktoktrend', 'tiktokfamous', 'tiktoktutorial'],
    'Instagram': ['reels', 'instareels', 'instagram', 'igdaily', 'instagood', 'instacontent', 'igcreator'],
    'Snapchat': ['snapchat', 'snapcreator', 'snapchatcreator', 'snapdaily', 'snapchatcontent']
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
    thumbnailDescription: videoData.thumbnailUrl || 'Generated thumbnail',
    category: 'Entertainment',
    audioTrack: 'Generated audio',
    duration: videoData.content?.totalDuration || 60,
    resolution: getPlatformAspectRatio(platform) === '16:9' ? '1920x1080' : '1080x1920',
    captionSuggestions: 'Auto-generated captions',
    uploadStrategy: 'Post during peak hours for best engagement'
  };
}

// For testing when InVideo API is not available
function getMockVideoData(platform, prompt) {
  const timestamp = Date.now();
  const videoUrl = `https://api.videoplatform.example/${platform.toLowerCase()}/premium-content/4k-cinematic/${prompt.substring(0, 20).replace(/\s+/g, '-')}/1${timestamp}_7805.mp4?quality=4k&codec=h265&duration=63`;
  
  return {
    videoUrl: videoUrl,
    shortsUrl: platform === 'YouTube' ? `https://api.videoplatform.example/shorts/${prompt.substring(0, 10).replace(/\s+/g, '-')}/1${timestamp}_short.mp4` : null,
    content: {
      scenes: [
        {
          sceneId: 1,
          duration: 60,
          script: prompt,
          visualDescription: `Generated ${platform} video about ${prompt}`,
          transition: 'fade',
          cameraMovement: 'static',
          textOverlay: platform,
          soundDesign: 'Auto-generated'
        }
      ],
      totalDuration: 60,
      musicTrack: 'Generated audio',
      style: `${platform} style`,
      editingPace: 'Dynamic',
      callToAction: 'Like and Subscribe!'
    }
  };
}
