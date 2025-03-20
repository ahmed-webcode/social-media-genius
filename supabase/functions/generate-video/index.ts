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
    
    console.log(`Generating video plan for platform: ${platform}, prompt: ${prompt.substring(0, 50)}...`);
    
    // Generate visual content plan
    const videoData = await generateContentPlan(prompt, platform);
    
    // Generate metadata
    const metadata = await generateMetadata(prompt, platform);
    
    // Return the video plan and metadata
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
    const errorMessage = error.message || 'Unknown error';
    
    return new Response(JSON.stringify({
      status: 'error',
      message: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to generate a detailed content plan for client-side rendering
async function generateContentPlan(prompt, platform) {
  console.log(`Generating content plan for ${platform} with prompt: ${prompt.substring(0, 50)}...`);
  
  try {
    // Set aspect ratio and duration based on platform
    const isPortrait = platform === 'TikTok' || platform === 'Instagram' || platform === 'Snapchat';
    const totalDuration = platform === 'YouTube' ? 60 : 30;
    
    // Create more detailed scene structure with better visuals
    const scenes = createEnhancedScenes(prompt, platform, totalDuration);
    
    // Generate styling based on platform
    const style = generatePlatformStyle(platform);
    
    // Create enhanced content structure with animations and effects
    const content = {
      scenes: scenes,
      totalDuration: totalDuration,
      style: style,
      effects: generateEffects(platform),
      transitions: generateTransitions(),
      captions: generateCaptions(prompt),
      animations: generateAnimations(platform),
      audioTrack: {
        type: 'dynamicBackground',
        tempo: platform === 'TikTok' ? 'fast' : 'moderate',
        mood: determineAudioMood(prompt)
      },
      callToAction: generateCallToAction(platform)
    };
    
    // Generate unique IDs for the client-side renderer
    const videoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const videoUrl = `client-render://${platform.toLowerCase()}/${videoId}`;
    const shortsUrl = isPortrait ? null : `client-render://shorts/${videoId}`;
    
    return {
      videoUrl,
      shortsUrl,
      content
    };
  } catch (error) {
    console.error('Error generating content plan:', error);
    throw new Error(`Failed to generate content plan: ${error.message}`);
  }
}

// Generate platform-specific styling
function generatePlatformStyle(platform) {
  const baseStyles = {
    fontFamily: '"Inter", sans-serif',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    transitions: 'smooth',
    captionStyle: 'dynamic'
  };
  
  switch(platform) {
    case 'YouTube':
      return {
        ...baseStyles,
        colorScheme: {
          primary: '#FF0000',
          secondary: '#282828',
          text: '#FFFFFF',
          accent: '#065FD4'
        },
        thumbnailStyle: 'high-contrast',
        textStyle: 'professional',
        effectsIntensity: 'moderate'
      };
    case 'TikTok':
      return {
        ...baseStyles,
        colorScheme: {
          primary: '#00f2ea',
          secondary: '#ff0050',
          text: '#FFFFFF',
          accent: '#25F4EE'
        },
        thumbnailStyle: 'vibrant',
        textStyle: 'bold',
        effectsIntensity: 'high',
        pacing: 'fast',
        animations: 'frequent'
      };
    case 'Instagram':
      return {
        ...baseStyles,
        colorScheme: {
          primary: '#405DE6',
          secondary: '#5851DB',
          gradientColors: ['#833AB4', '#FD1D1D', '#F77737', '#FCAF45', '#FFDC80'],
          text: '#FFFFFF'
        },
        thumbnailStyle: 'aesthetic',
        textStyle: 'clean',
        effectsIntensity: 'moderate',
        filters: 'enhanced'
      };
    case 'Snapchat':
      return {
        ...baseStyles,
        colorScheme: {
          primary: '#FFFC00',
          secondary: '#000000',
          text: '#FFFFFF'
        },
        thumbnailStyle: 'fun',
        textStyle: 'playful',
        effectsIntensity: 'very-high',
        filters: 'augmented',
        overlays: 'animated'
      };
    default:
      return baseStyles;
  }
}

// Generate visual effects based on the platform
function generateEffects(platform) {
  const commonEffects = ['fade', 'zoom', 'blur', 'glow'];
  
  const platformSpecificEffects = {
    'YouTube': ['cinematic', 'depth-of-field', 'color-grading', 'lens-flare'],
    'TikTok': ['glitch', 'bounce', 'rgb-split', 'pixelate', 'shake'],
    'Instagram': ['film-grain', 'light-leak', 'vignette', 'duotone'],
    'Snapchat': ['face-filters', 'ar-effects', 'stickers', 'text-animations']
  };
  
  return {
    common: commonEffects,
    platformSpecific: platformSpecificEffects[platform] || [],
    intensity: platform === 'Snapchat' || platform === 'TikTok' ? 'high' : 'medium'
  };
}

// Generate scene transitions
function generateTransitions() {
  return [
    'fade',
    'wipe',
    'slide',
    'zoom',
    'glitch',
    'whip',
    'spin',
    'flash',
    'blur',
    'pixelate'
  ];
}

// Generate caption styles
function generateCaptions(prompt) {
  const keywords = prompt.split(' ')
    .filter(word => word.length > 4)
    .slice(0, 5);
  
  return {
    style: 'dynamic',
    highlight: keywords,
    animation: 'typewriter',
    position: 'adaptive',
    timing: 'automatic'
  };
}

// Generate animation profiles
function generateAnimations(platform) {
  const baseAnimations = {
    text: ['fade', 'slide', 'scale', 'typewriter'],
    elements: ['bounce', 'float', 'pulse', 'wiggle'],
    transitions: ['smooth', 'bounce', 'elastic']
  };
  
  switch(platform) {
    case 'TikTok':
      return {
        ...baseAnimations,
        intensity: 'high',
        frequency: 'high',
        special: ['beat-sync', 'stickers', 'text-reveal']
      };
    case 'Snapchat':
      return {
        ...baseAnimations,
        intensity: 'very-high',
        frequency: 'very-high',
        special: ['ar-effects', 'face-tracking', 'interactive']
      };
    default:
      return {
        ...baseAnimations,
        intensity: 'medium',
        frequency: 'medium',
        special: ['smooth-transitions', 'subtle-movement']
      };
  }
}

// Determine audio mood based on prompt
function determineAudioMood(prompt) {
  const moodKeywords = {
    upbeat: ['exciting', 'fun', 'happy', 'energetic', 'upbeat', 'positive'],
    dramatic: ['dramatic', 'intense', 'epic', 'powerful', 'emotional'],
    relaxed: ['calm', 'relaxed', 'peaceful', 'gentle', 'soft', 'ambient'],
    mysterious: ['mysterious', 'suspense', 'dark', 'eerie', 'curious'],
    inspiring: ['inspiring', 'motivational', 'uplifting', 'hopeful']
  };
  
  // Default mood
  let detectedMood = 'upbeat';
  let highestCount = 0;
  
  // Count occurrences of mood keywords in prompt
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    const count = keywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    if (count > highestCount) {
      highestCount = count;
      detectedMood = mood;
    }
  }
  
  return detectedMood;
}

// Generate call to action based on platform
function generateCallToAction(platform) {
  switch(platform) {
    case 'YouTube':
      return {
        text: 'Like, Subscribe & Hit the Bell',
        timing: 'end',
        animation: 'slide-up',
        emphasis: 'high'
      };
    case 'TikTok':
      return {
        text: 'Follow for more & drop a comment',
        timing: 'throughout',
        animation: 'bounce',
        emphasis: 'very-high'
      };
    case 'Instagram':
      return {
        text: 'Double tap & Save for later',
        timing: 'end',
        animation: 'fade',
        emphasis: 'medium'
      };
    case 'Snapchat':
      return {
        text: 'Swipe up & Add me',
        timing: 'end',
        animation: 'pulse',
        emphasis: 'high'
      };
    default:
      return {
        text: 'Follow for more content',
        timing: 'end',
        animation: 'fade',
        emphasis: 'medium'
      };
  }
}

// Create enhanced scenes with more details for better visualization
function createEnhancedScenes(prompt, platform, totalDuration) {
  // Number of scenes based on platform and duration
  const isShortForm = platform !== 'YouTube';
  const sceneCount = isShortForm ? 5 : 7;
  const scenes = [];
  
  // Extract key topics from prompt
  const topics = extractTopics(prompt);
  
  // Intro scene
  scenes.push({
    sceneId: 1,
    duration: Math.ceil(totalDuration / sceneCount),
    script: `Introduction to: ${prompt}`,
    visualDescription: `Opening scene with ${isShortForm ? 'dynamic text reveal' : 'cinematic establishing shot'} introducing the topic: ${prompt}`,
    visualElements: [{
      type: 'text',
      content: extractTitle(prompt),
      animation: 'reveal',
      position: 'center',
      style: 'headline'
    }, {
      type: 'background',
      style: isShortForm ? 'gradient-animation' : 'cinematic-blur',
      animation: 'zoom-in'
    }],
    cameraMovement: 'slow-zoom-in',
    transition: {
      type: 'fade',
      duration: 0.8
    },
    soundDesign: {
      type: 'introduction',
      elements: ['soft-beginning', 'building-rhythm']
    }
  });
  
  // Middle scenes - one for each topic
  const availableTopics = [...topics];
  for (let i = 2; i <= sceneCount - 1; i++) {
    const topic = availableTopics.length > 0 ? 
      availableTopics.shift() : 
      `Point ${i-1} about ${prompt}`;
    
    scenes.push({
      sceneId: i,
      duration: Math.ceil(totalDuration / sceneCount),
      script: `Key point ${i-1}: ${topic}`,
      visualDescription: `Detailed explanation of ${topic} with ${isShortForm ? 'bold graphics' : 'supporting visuals'}`,
      visualElements: [{
        type: 'text',
        content: topic,
        animation: i % 2 === 0 ? 'slide-left' : 'slide-right',
        position: 'top',
        style: 'subheading'
      }, {
        type: 'graphic',
        style: isShortForm ? 'animated-icon' : 'infographic',
        animation: 'fade-in'
      }, {
        type: 'background',
        style: i % 2 === 0 ? 'particle-effect' : 'geometric-pattern',
        animation: 'subtle-movement'
      }],
      cameraMovement: i % 2 === 0 ? 'pan-right' : 'pan-left',
      transition: {
        type: i % 2 === 0 ? 'slide' : 'zoom',
        duration: 0.6
      },
      soundDesign: {
        type: 'background',
        elements: ['subtle-beats', 'atmosphere']
      }
    });
  }
  
  // Outro scene
  scenes.push({
    sceneId: sceneCount,
    duration: Math.ceil(totalDuration / sceneCount),
    script: `Conclusion about ${prompt}`,
    visualDescription: `Final scene with call to action and ${isShortForm ? 'energetic finale' : 'thoughtful conclusion'}`,
    visualElements: [{
      type: 'text',
      content: generateCallToAction(platform).text,
      animation: 'scale-up',
      position: 'center',
      style: 'cta'
    }, {
      type: 'background',
      style: 'brand-colors',
      animation: 'pulse'
    }, {
      type: 'icon',
      content: ['like', 'subscribe', 'follow'],
      animation: 'bounce',
      position: 'bottom'
    }],
    cameraMovement: 'zoom-out',
    transition: {
      type: 'fade',
      duration: 1.0
    },
    soundDesign: {
      type: 'conclusion',
      elements: ['final-beat', 'outro-flourish']
    }
  });
  
  return scenes;
}

// Extract topics from prompt
function extractTopics(prompt) {
  // Simple implementation - split by commas or periods
  let topics = prompt.split(/[,.;]/)
    .map(t => t.trim())
    .filter(t => t.length > 10 && t.length < 60);
  
  // Fallback if we don't have enough topics
  if (topics.length < 3) {
    const words = prompt.split(' ');
    const chunkSize = Math.ceil(words.length / 4);
    
    topics = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.length > 0) topics.push(chunk);
    }
  }
  
  return topics.slice(0, 5); // Limit to 5 topics max
}

// Extract a good title from the prompt
function extractTitle(prompt) {
  // Use the first sentence if it's not too long
  const firstSentence = prompt.split(/[.!?]/)[0].trim();
  
  if (firstSentence.length <= 50) {
    return firstSentence;
  }
  
  // Otherwise use the first N words
  const words = prompt.split(' ');
  return words.slice(0, 7).join(' ') + (words.length > 7 ? '...' : '');
}

// Generate video metadata
async function generateMetadata(prompt, platform) {
  // Extract keywords from prompt
  const keywords = prompt.split(' ')
    .filter(word => word.length > 3)
    .map(word => word.toLowerCase())
    .slice(0, 8);
  
  // Add platform-specific tags
  const platformTags = {
    'YouTube': ['creator', 'content', 'video', 'youtube'],
    'TikTok': ['fyp', 'foryou', 'viral', 'trending', 'tiktok'],
    'Instagram': ['reels', 'instagram', 'igdaily', 'content'],
    'Snapchat': ['snapchat', 'snap', 'content', 'creator']
  };
  
  // Combine keyword tags with platform tags
  const allTags = [
    ...keywords.map(k => `#${k}`),
    ...(platformTags[platform] || []).map(t => `#${t}`)
  ];
  
  // Generate a better title
  const title = platform === 'YouTube' 
    ? `${extractTitle(prompt)} | Amazing ${platform} Video` 
    : extractTitle(prompt);
  
  return {
    title: title,
    description: `This ${platform} video explores: ${prompt} - Created with advanced AI video generation`,
    tags: allTags,
    thumbnailDescription: `Dynamic thumbnail for "${extractTitle(prompt)}"`,
    category: determineCategoryFromPrompt(prompt),
    audioTrack: 'Dynamic Audio',
    duration: platform === 'YouTube' ? 60 : 30,
    resolution: platform === 'YouTube' ? '1920x1080' : '1080x1920',
    style: {
      visualTone: determineVisualTone(prompt),
      captionStyle: platform === 'TikTok' ? 'bold-animated' : 'clean-minimal',
      colorScheme: generatePlatformStyle(platform).colorScheme
    }
  };
}

// Determine category from prompt
function determineCategoryFromPrompt(prompt) {
  const categoryKeywords = {
    'Education': ['learn', 'how to', 'tutorial', 'guide', 'explain', 'educational'],
    'Entertainment': ['fun', 'funny', 'amazing', 'cool', 'awesome', 'entertainment'],
    'Gaming': ['game', 'gaming', 'play', 'player', 'playthrough', 'stream'],
    'Music': ['music', 'song', 'artist', 'band', 'concert', 'track'],
    'Sports': ['sport', 'athlete', 'team', 'game', 'match', 'championship'],
    'Technology': ['tech', 'technology', 'device', 'gadget', 'review', 'unbox'],
    'Travel': ['travel', 'destination', 'journey', 'explore', 'adventure'],
    'Fashion': ['fashion', 'style', 'outfit', 'clothing', 'trend'],
    'Food': ['food', 'recipe', 'cook', 'dish', 'delicious', 'meal'],
    'Fitness': ['fitness', 'workout', 'exercise', 'gym', 'training', 'health']
  };
  
  // Default category
  let category = 'Entertainment';
  let highestCount = 0;
  
  const promptLower = prompt.toLowerCase();
  
  // Find category with most keyword matches in prompt
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const count = keywords.filter(keyword => promptLower.includes(keyword)).length;
    if (count > highestCount) {
      highestCount = count;
      category = cat;
    }
  }
  
  return category;
}

// Determine visual tone from prompt
function determineVisualTone(prompt) {
  const toneKeywords = {
    'energetic': ['exciting', 'fun', 'dynamic', 'energetic', 'fast'],
    'professional': ['professional', 'business', 'formal', 'corporate'],
    'casual': ['casual', 'relaxed', 'friendly', 'approachable'],
    'dramatic': ['dramatic', 'intense', 'serious', 'emotional'],
    'minimalist': ['minimal', 'clean', 'simple', 'elegant'],
    'vibrant': ['vibrant', 'colorful', 'bright', 'bold', 'vivid']
  };
  
  // Default tone
  let tone = 'energetic';
  let highestCount = 0;
  
  const promptLower = prompt.toLowerCase();
  
  // Find tone with most keyword matches in prompt
  for (const [t, keywords] of Object.entries(toneKeywords)) {
    const count = keywords.filter(keyword => promptLower.includes(keyword)).length;
    if (count > highestCount) {
      highestCount = count;
      tone = t;
    }
  }
  
  return tone;
}
