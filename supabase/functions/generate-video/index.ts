
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, platform, generateShorts } = await req.json();
    
    console.log(`Generating video for prompt: "${prompt}" on ${platform}`);
    console.log(`Generate shorts: ${generateShorts}`);

    // Get authorization header to identify the user
    const authHeader = req.headers.get('authorization')?.split(' ')[1];
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) {
      throw new Error('Authentication failed');
    }
    
    console.log(`Authenticated as user: ${user.id}`);

    // Check if the user has connected their Snapchat account if platform is Snapchat
    if (platform === 'Snapchat') {
      const { data: accounts, error: accountsError } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'Snapchat')
        .maybeSingle();
      
      if (accountsError) {
        throw new Error(`Failed to check Snapchat account: ${accountsError.message}`);
      }
      
      if (!accounts) {
        throw new Error('Snapchat account not connected. Please connect your Snapchat account first.');
      }
      
      console.log('Snapchat account found, access token available');
    }

    // In a real implementation, we would use AI to generate a video
    // For now, we're creating a more realistic simulation with better video URLs

    // Generate content for the different platforms
    const videoContent = generateVideoContent(prompt, platform);
    
    // Simulate processing time for video generation (2-4 seconds)
    const processingTime = 2000 + Math.floor(Math.random() * 2000);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate unique IDs for videos
    const timestamp = Date.now();
    const videoId = `${timestamp}_${Math.floor(Math.random() * 10000)}`;
    
    // Create more realistic video URLs with real content descriptors in the path
    const platformCode = platform.toLowerCase().substring(0, 3);
    const promptSlug = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    
    // Duration between 10-30 seconds
    const mainDuration = Math.floor(Math.random() * 20) + 10; // 10-30 seconds
    const shortsDuration = Math.floor(Math.random() * 10) + 8; // 8-18 seconds
    
    // Resolution based on platform
    let resolution = "1080p";
    if (platform === 'TikTok' || platform === 'Instagram') {
      resolution = "portrait-1080p";
    } else if (platform === 'YouTube') {
      resolution = "landscape-1080p";
    }
    
    // More realistic video URL with content description
    const videoUrl = `https://api.videoplatform.example/${platformCode}/content/${resolution}/${promptSlug}/${videoId}.mp4?duration=${mainDuration}`;
    
    // Shorts URL if requested
    const shortsUrl = generateShorts 
      ? `https://api.videoplatform.example/${platformCode}/shorts/${resolution}/${promptSlug}/${videoId}_short.mp4?duration=${shortsDuration}` 
      : null;

    // Detailed content metadata
    const videoMetadata = {
      title: generateVideoTitle(prompt, platform),
      description: generateVideoDescription(prompt, platform),
      tags: generateHashtags(prompt, platform),
      thumbnailUrl: `https://api.videoplatform.example/thumbnails/${platformCode}_${videoId}.jpg`,
      duration: mainDuration,
      shortsDuration: shortsUrl ? shortsDuration : null,
      resolution: resolution,
      codec: "h264",
      format: "mp4",
      content: videoContent
    };

    console.log(`Video generation completed.`);
    console.log(`Video URL: ${videoUrl}`);
    if (shortsUrl) {
      console.log(`Shorts URL: ${shortsUrl}`);
    }

    // If platform is Snapchat, we'd use the Snapchat API to post the video
    // This is a simulated implementation
    if (platform === 'Snapchat') {
      console.log('Simulating Snapchat posting process...');
      // In a real implementation, we would use the Snapchat API
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        videoUrl,
        shortsUrl,
        metadata: videoMetadata,
        message: 'Video generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-video function:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to generate video content based on prompt and platform
function generateVideoContent(prompt: string, platform: string) {
  const scenes = [];
  
  // Generate 5-8 scenes for the video
  const numScenes = Math.floor(Math.random() * 4) + 5;
  
  for (let i = 0; i < numScenes; i++) {
    const scene = {
      sceneId: i + 1,
      duration: Math.floor(Math.random() * 5) + 2, // 2-7 seconds per scene
      script: generateSceneScript(prompt, i, numScenes),
      visualDescription: generateVisualDescription(prompt, i, platform),
      audioTrack: i === 0 ? "intro_upbeat" : i === numScenes - 1 ? "outro_motivational" : "background_smooth",
      transition: i < numScenes - 1 ? ["fade", "wipe", "slide", "zoom"][Math.floor(Math.random() * 4)] : "fade"
    };
    scenes.push(scene);
  }
  
  return {
    scenes,
    totalDuration: scenes.reduce((total, scene) => total + scene.duration, 0),
    musicTrack: getMusicTrackForPlatform(platform),
    style: getStyleForPlatform(platform),
    callToAction: platform === "YouTube" ? "Subscribe for more content!" : "Follow for more!"
  };
}

// Helper function to generate a scene script
function generateSceneScript(prompt: string, sceneIndex: number, totalScenes: number) {
  const promptWords = prompt.split(" ");
  const keywords = promptWords.filter(word => word.length > 3).slice(0, 3);
  
  if (sceneIndex === 0) {
    return `Introducing: ${prompt}`;
  } else if (sceneIndex === totalScenes - 1) {
    return `That's all about ${prompt}! Thanks for watching!`;
  } else {
    const points = [
      `The key benefit of ${keywords[0] || prompt} is amazing results.`,
      `You won't believe how ${keywords[1] || 'effective'} this can be!`,
      `Here's why ${keywords[0] || prompt} is trending right now.`,
      `Let me show you how ${keywords[1] || 'this works'} in real life.`,
      `The secret to mastering ${keywords[2] || prompt} is consistency.`
    ];
    return points[sceneIndex % points.length];
  }
}

// Helper function to generate visual descriptions
function generateVisualDescription(prompt: string, sceneIndex: number, platform: string) {
  const visualStyles = [
    `Close-up shot of ${prompt} with vibrant colors`,
    `Person demonstrating ${prompt} with clear gestures`,
    `Split-screen comparison showing before and after ${prompt}`,
    `Animation explaining the concept of ${prompt}`,
    `Expert talking directly to camera about ${prompt}`,
    `Screen recording showing ${prompt} in action`,
    `Outdoor shot displaying real-world application of ${prompt}`
  ];
  
  return visualStyles[sceneIndex % visualStyles.length];
}

// Helper function to get platform-specific music tracks
function getMusicTrackForPlatform(platform: string) {
  const tracks = {
    "YouTube": "educational_upbeat",
    "TikTok": "viral_energetic",
    "Instagram": "modern_lifestyle",
    "Snapchat": "young_trendy"
  };
  
  return tracks[platform] || "standard_background";
}

// Helper function to get platform-specific style
function getStyleForPlatform(platform: string) {
  const styles = {
    "YouTube": "professional_tutorial",
    "TikTok": "fast_paced_entertaining",
    "Instagram": "visually_appealing_lifestyle",
    "Snapchat": "casual_authentic"
  };
  
  return styles[platform] || "standard";
}

// Helper function to generate video titles
function generateVideoTitle(prompt: string, platform: string) {
  const titleTemplates = [
    `${prompt} - Everything You Need To Know`,
    `How ${prompt} Is Changing Everything`,
    `The Ultimate Guide to ${prompt}`,
    `${prompt} in Under 60 Seconds`,
    `Why Everyone Is Talking About ${prompt}`
  ];
  
  const randomIndex = Math.floor(Math.random() * titleTemplates.length);
  return titleTemplates[randomIndex];
}

// Helper function to generate video descriptions
function generateVideoDescription(prompt: string, platform: string) {
  const descriptionTemplates = [
    `In this video, we explore everything about ${prompt} and how it can transform your experience.`,
    `Discover the secrets behind ${prompt} that experts don't want you to know!`,
    `A comprehensive look at ${prompt} with tips and tricks for beginners and experts alike.`,
    `${prompt} explained in simple terms with real-world examples and applications.`,
    `Join us as we dive deep into ${prompt} and reveal the strategies that actually work.`
  ];
  
  const randomIndex = Math.floor(Math.random() * descriptionTemplates.length);
  return descriptionTemplates[randomIndex];
}

// Helper function to generate hashtags
function generateHashtags(prompt: string, platform: string) {
  const baseHashtags = ["viral", "trending", "content", "creator"];
  const promptWords = prompt.toLowerCase().split(" ").filter(word => word.length > 3);
  
  // Add platform-specific hashtags
  const platformTags = {
    "YouTube": ["youtuber", "subscribe", "youtubechannel"],
    "TikTok": ["fyp", "foryoupage", "tiktoktrend"],
    "Instagram": ["insta", "instagramreels", "instadaily"],
    "Snapchat": ["snapchat", "snapchatter", "snapcode"]
  };
  
  // Combine all hashtags and take a random selection
  const allTags = [...baseHashtags, ...promptWords, ...(platformTags[platform] || [])];
  const shuffled = allTags.sort(() => 0.5 - Math.random());
  
  // Return 5-8 hashtags
  return shuffled.slice(0, Math.floor(Math.random() * 4) + 5).map(tag => `#${tag}`);
}
