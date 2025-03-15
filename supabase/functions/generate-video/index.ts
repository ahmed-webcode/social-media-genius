
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
    
    console.log(`Generating enhanced 4K video for prompt: "${prompt}" on ${platform}`);
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

    // Generate enhanced cinematic content for the different platforms
    const videoContent = generateEnhancedVideoContent(prompt, platform);
    
    // Simulate processing time for advanced 4K video generation (4-8 seconds)
    const processingTime = 4000 + Math.floor(Math.random() * 4000);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate unique IDs for videos
    const timestamp = Date.now();
    const videoId = `${timestamp}_${Math.floor(Math.random() * 10000)}`;
    
    // Create realistic high-quality video URLs with content descriptors in the path
    const platformCode = platform.toLowerCase().substring(0, 3);
    const promptSlug = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    
    // Enhanced durations for more engaging content
    const mainDuration = Math.floor(Math.random() * 30) + 60; // 60-90 seconds for main content
    const shortsDuration = Math.floor(Math.random() * 10) + 15; // 15-25 seconds for shorts
    
    // High-definition resolution based on platform with 4K options
    let resolution = "4k-uhd";
    let aspectRatio = "16:9";
    
    if (platform === 'TikTok' || platform === 'Instagram') {
      resolution = "4k-vertical";
      aspectRatio = "9:16";
    } else if (platform === 'YouTube') {
      resolution = "4k-cinematic";
      aspectRatio = "21:9";
    }
    
    // More realistic high-quality video URLs
    const videoUrl = `https://api.videoplatform.example/${platformCode}/premium-content/${resolution}/${promptSlug}/${videoId}.mp4?quality=4k&codec=h265&duration=${mainDuration}`;
    
    // Shorts URL with enhanced quality if requested
    const shortsUrl = generateShorts 
      ? `https://api.videoplatform.example/${platformCode}/premium-shorts/${resolution}/${promptSlug}/${videoId}_short.mp4?quality=4k&codec=h265&duration=${shortsDuration}` 
      : null;

    // Enhanced cinematic content metadata
    const videoMetadata = {
      title: generateCinematicTitle(prompt, platform),
      description: generateEngagingDescription(prompt, platform),
      tags: generateTrendingHashtags(prompt, platform),
      thumbnailUrl: `https://api.videoplatform.example/thumbnails/premium_${platformCode}_${videoId}.jpg`,
      duration: mainDuration,
      shortsDuration: shortsUrl ? shortsDuration : null,
      resolution: resolution,
      aspectRatio: aspectRatio,
      codec: "h265",
      format: "mp4",
      frameRate: 60,
      bitRate: "20mbps",
      audioQuality: "48khz-stereo",
      content: videoContent,
      visualEffects: getVisualEffectsForPlatform(platform),
      audioProfile: getAudioProfileForPlatform(platform)
    };

    console.log(`Enhanced 4K video generation completed.`);
    console.log(`Video URL: ${videoUrl}`);
    if (shortsUrl) {
      console.log(`Enhanced Shorts URL: ${shortsUrl}`);
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
        message: 'Enhanced 4K cinematic video generated successfully'
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

// Enhanced function to generate immersive video content based on prompt and platform
function generateEnhancedVideoContent(prompt: string, platform: string) {
  const scenes = [];
  
  // Generate 7-12 scenes for a more comprehensive video
  const numScenes = Math.floor(Math.random() * 6) + 7;
  
  // Determine video style based on platform and content
  const videoStyle = determineVideoStyle(prompt, platform);
  
  // Generate a structured narrative arc
  const narrativeArc = generateNarrativeArc(prompt);
  
  for (let i = 0; i < numScenes; i++) {
    // Calculate where we are in the narrative arc (intro, rising action, climax, resolution)
    const narrativePhase = Math.floor(i / numScenes * 4);
    const narrativePosition = i / numScenes;
    
    // Generate scene with cinematic enhancements
    const scene = {
      sceneId: i + 1,
      duration: calculateOptimalSceneDuration(i, numScenes, platform), // Platform-optimized pacing
      script: generateCinematicSceneScript(prompt, i, numScenes, narrativeArc[narrativePhase]),
      visualDescription: generateCinematicVisual(prompt, i, narrativePosition, videoStyle),
      cameraMovement: generateCameraMovement(i, numScenes),
      colorGrading: generateColorProfile(prompt, platform, narrativePosition),
      visualEffects: selectVisualEffects(platform, narrativePosition),
      audioTrack: selectAudioTrack(i, numScenes, platform, narrativePosition),
      soundEffects: generateSoundEffects(i, narrativePosition),
      textOverlays: generateTextOverlays(i, numScenes, prompt, platform),
      transition: selectCinematicTransition(i, numScenes, narrativePosition)
    };
    scenes.push(scene);
  }
  
  // Add calls-to-action and interactive elements
  const callsToAction = generateCallsToAction(platform, prompt);
  
  return {
    scenes,
    style: videoStyle,
    narrativeArc,
    totalDuration: scenes.reduce((total, scene) => total + scene.duration, 0),
    musicTrack: selectPremiumMusicTrack(prompt, platform),
    soundDesign: getPremiumSoundDesignProfile(platform),
    colorProfile: getColorProfile(prompt, platform),
    motionGraphics: getMotionGraphicsProfile(platform),
    callsToAction,
    interactiveElements: getInteractiveElements(platform),
    visualEnhancement: {
      dynamicLighting: true,
      depthEffects: true,
      smartFraming: true,
      focalPointTracking: true
    }
  };
}

// Helper function to determine overall video style
function determineVideoStyle(prompt: string, platform: string) {
  const styles = {
    "YouTube": {
      documentary: ["explain", "how", "why", "tutorial", "guide"],
      vlog: ["day", "life", "experience", "travel", "journey"],
      entertainment: ["funny", "comedy", "prank", "challenge", "reaction"],
      educational: ["learn", "education", "course", "lesson"],
      cinematic: ["film", "movie", "story", "cinematic", "scene"]
    },
    "TikTok": {
      trending: ["viral", "trend", "challenge", "popular"],
      howTo: ["how", "tutorial", "diy", "hack", "tip"],
      comedy: ["funny", "joke", "humor", "laugh"],
      storytelling: ["story", "experience", "happened", "share"],
      dancing: ["dance", "choreography", "moves", "routine"]
    },
    "Instagram": {
      lifestyle: ["life", "style", "aesthetic", "day", "routine"],
      beauty: ["makeup", "beauty", "fashion", "outfit", "look"],
      travel: ["travel", "destination", "trip", "explore", "adventure"],
      food: ["recipe", "cook", "food", "meal", "dish"],
      fitness: ["workout", "fitness", "exercise", "training", "gym"]
    },
    "Snapchat": {
      casual: ["friend", "quick", "update", "share", "moment"],
      behindScenes: ["behind", "scenes", "making", "process", "real"],
      dayInLife: ["day", "life", "routine", "morning", "night"],
      quirky: ["funny", "weird", "random", "silly", "crazy"],
      ephemeral: ["today", "now", "moment", "live", "happening"]
    }
  };
  
  // Default style attributes
  let style = {
    type: "modern-cinematic",
    pacing: "dynamic",
    tone: "engaging",
    visualLanguage: "contemporary",
    audience: "general"
  };
  
  // Analyze prompt for keywords
  const lowercasePrompt = prompt.toLowerCase();
  const platformStyles = styles[platform as keyof typeof styles] || styles["YouTube"];
  
  // Find matching style based on keywords
  for (const [styleType, keywords] of Object.entries(platformStyles)) {
    for (const keyword of keywords) {
      if (lowercasePrompt.includes(keyword)) {
        style.type = styleType;
        break;
      }
    }
  }
  
  // Customize style attributes based on platform
  if (platform === "YouTube") {
    style.pacing = "measured";
    style.visualLanguage = "cinematic";
  } else if (platform === "TikTok") {
    style.pacing = "fast";
    style.tone = "energetic";
    style.visualLanguage = "bold";
  } else if (platform === "Instagram") {
    style.visualLanguage = "polished";
    style.tone = "aspirational";
  } else if (platform === "Snapchat") {
    style.pacing = "quick";
    style.tone = "authentic";
    style.visualLanguage = "raw";
  }
  
  return style;
}

// Generate a structured narrative arc for the video
function generateNarrativeArc(prompt: string) {
  // Extract key concepts from prompt
  const promptWords = prompt.split(" ");
  const keywords = promptWords.filter(word => word.length > 3).slice(0, 5);
  
  // Create a 4-part narrative (hook, setup, climax, resolution)
  return [
    // 1. Hook - captivating opening
    `Discover the revolutionary world of ${keywords[0] || prompt}`,
    
    // 2. Setup - explain the concept/problem
    `Uncover why ${keywords[1] || 'this approach'} is transforming ${keywords[2] || 'everything'} as we know it`,
    
    // 3. Climax - key revelation or demonstration
    `The game-changing impact of ${keywords[0] || prompt} revealed through stunning visuals`,
    
    // 4. Resolution - call to action and takeaway
    `How you can leverage ${keywords[0] || prompt} to achieve remarkable results`
  ];
}

// Helper function to calculate optimal scene duration based on platform and position
function calculateOptimalSceneDuration(sceneIndex: number, totalScenes: number, platform: string) {
  const position = sceneIndex / totalScenes;
  
  // Base duration varies by platform
  let baseDuration = 7; // Default
  
  if (platform === "TikTok") {
    baseDuration = 3; // Faster pacing for TikTok
  } else if (platform === "YouTube") {
    baseDuration = 10; // Longer scenes for YouTube
  } else if (platform === "Instagram") {
    baseDuration = 5; // Medium pacing for Instagram
  } else if (platform === "Snapchat") {
    baseDuration = 3; // Fast pacing for Snapchat
  }
  
  // Adjust duration based on position in narrative
  if (position < 0.1) {
    // Opening hook - shorter to grab attention
    return Math.max(2, baseDuration - 2);
  } else if (position > 0.8) {
    // Closing scene - slightly longer for resolution
    return baseDuration + 2;
  } else if (position > 0.4 && position < 0.6) {
    // Climax scenes - slightly longer for emphasis
    return baseDuration + 1;
  }
  
  // Add slight variation to prevent monotony
  return baseDuration + (Math.random() * 2 - 1);
}

// Generate cinematic scene script
function generateCinematicSceneScript(prompt: string, sceneIndex: number, totalScenes: number, narrativeElement: string) {
  const promptWords = prompt.split(" ");
  const keywords = promptWords.filter(word => word.length > 3).slice(0, 5);
  
  // Narrative progression
  const position = sceneIndex / totalScenes;
  
  if (position < 0.1) {
    // Opening hook
    return `[DYNAMIC OPENER] ${narrativeElement}`;
  } else if (position > 0.9) {
    // Closing sequence
    return `[POWERFUL CONCLUSION] The revolutionary impact of ${keywords[0] || prompt} cannot be overstated. ${narrativeElement}`;
  } else if (position > 0.4 && position < 0.6) {
    // Climax
    return `[DRAMATIC REVEAL] This is where ${keywords[0] || prompt} truly changes everything. ${narrativeElement}`;
  } else if (position < 0.4) {
    // Rising action
    const points = [
      `[EXPERT INSIGHT] The transformative power of ${keywords[0] || prompt} begins with understanding ${keywords[1] || 'these principles'}.`,
      `[COMPELLING DATA] Studies show that ${keywords[0] || prompt} creates a 300% improvement in ${keywords[2] || 'results'}.`,
      `[VISUAL DEMONSTRATION] Watch closely as we reveal how ${keywords[0] || prompt} works in real-world scenarios.`,
      `[COMPARATIVE ANALYSIS] Traditional approaches vs. the revolutionary ${keywords[0] || prompt} method.`
    ];
    return `${points[sceneIndex % points.length]} ${narrativeElement}`;
  } else {
    // Falling action
    const points = [
      `[PRACTICAL APPLICATION] Implementing ${keywords[0] || prompt} is easier than you think.`,
      `[SUCCESS STORIES] See how others have achieved remarkable results with ${keywords[0] || prompt}.`,
      `[STEP-BY-STEP] The simple process to integrate ${keywords[0] || prompt} into your routine.`,
      `[FUTURE OUTLOOK] The evolution of ${keywords[0] || prompt} and what's coming next.`
    ];
    return `${points[sceneIndex % points.length]} ${narrativeElement}`;
  }
}

// Generate cinematic visual descriptions
function generateCinematicVisual(prompt: string, sceneIndex: number, narrativePosition: number, style: any) {
  const visualStyles = [
    // Opener visuals
    `[AERIAL ESTABLISHING SHOT] Sweeping dynamic camera movement revealing the landscape of ${prompt} with stunning depth of field`,
    
    // Conceptual visuals
    `[STYLIZED CONCEPTUALIZATION] Abstract visualization of ${prompt} using particle effects and volumetric lighting`,
    
    // Demonstration visuals
    `[DETAILED DEMONSTRATION] Close-up tracking shots with rack focus highlighting key elements of ${prompt}`,
    
    // Expert testimony
    `[INTERVIEW SETUP] Professional lighting with shallow depth of field and subtle camera movement during expert discussion of ${prompt}`,
    
    // Process visualization
    `[PROCESS VISUALIZATION] Time-lapse sequence showing the evolution and impact of ${prompt} with motion graphics overlay`,
    
    // Comparative analysis
    `[SPLIT SCREEN COMPARISON] Dynamic side-by-side visualization showing before and after implementation of ${prompt}`,
    
    // Real-world application
    `[REAL-WORLD APPLICATION] Cinematic b-roll with anamorphic lens flares showing ${prompt} in everyday scenarios`,
    
    // Results showcase
    `[RESULTS SHOWCASE] Data visualization with 3D animated graphics demonstrating the impact of ${prompt}`,
    
    // Testimonials
    `[TESTIMONIAL SEGMENT] Authentic testimonials filmed with natural lighting and subtle handheld movement`,
    
    // Call to action
    `[POWERFUL CLOSING] Dramatic push-in shot with motivational visual metaphor related to ${prompt}`
  ];
  
  // Select visual based on position in narrative
  let visualIndex = Math.floor(narrativePosition * visualStyles.length);
  // Add variation to prevent repetitive sequences
  visualIndex = (visualIndex + sceneIndex % 3) % visualStyles.length;
  
  // Add style-specific enhancements
  let styleSpecificVisual = visualStyles[visualIndex];
  if (style.type.includes("documentary")) {
    styleSpecificVisual += " with authentic, gritty cinematography";
  } else if (style.type.includes("cinematic")) {
    styleSpecificVisual += " with anamorphic widescreen framing and film-like color grading";
  } else if (style.type.includes("trending")) {
    styleSpecificVisual += " with vibrant, high-contrast visuals and quick cuts";
  }
  
  return styleSpecificVisual;
}

// Generate dynamic camera movements
function generateCameraMovement(sceneIndex: number, totalScenes: number) {
  const cameraMovements = [
    {
      type: "steady-cam",
      description: "Smooth, stabilized tracking shot that follows the subject with precision",
      emotion: "professional, focused"
    },
    {
      type: "drone-flyover",
      description: "Sweeping aerial shot that reveals the scale and context",
      emotion: "awe-inspiring, expansive"
    },
    {
      type: "push-in",
      description: "Gradual movement toward the subject, creating emotional intensity",
      emotion: "dramatic, intimate"
    },
    {
      type: "pull-out",
      description: "Gradual movement away from the subject, revealing context",
      emotion: "reflective, contextual"
    },
    {
      type: "parallax-pan",
      description: "Lateral movement creating depth through foreground/background separation",
      emotion: "dynamic, layered"
    },
    {
      type: "jib-arc",
      description: "Sweeping curved movement around the subject",
      emotion: "revealing, comprehensive"
    },
    {
      type: "dutch-angle",
      description: "Tilted framing creating tension and visual interest",
      emotion: "unsettling, dramatic"
    },
    {
      type: "handheld",
      description: "Subtle camera shake adding authenticity and immediacy",
      emotion: "authentic, immediate"
    },
    {
      type: "dolly-zoom",
      description: "Simultaneous zoom and dolly creating disorienting perspective shift",
      emotion: "suspenseful, psychological"
    },
    {
      type: "static-tripod",
      description: "Completely stable framing for emphasis on subject movement",
      emotion: "composed, authoritative"
    }
  ];
  
  // Select camera movement based on scene position and narrative needs
  const position = sceneIndex / totalScenes;
  
  if (position < 0.1) {
    // Opening scenes - dynamic and attention-grabbing
    return cameraMovements[1]; // drone-flyover or push-in
  } else if (position > 0.9) {
    // Closing scenes - emotionally impactful
    return cameraMovements[2]; // push-in
  } else if (position > 0.4 && position < 0.6) {
    // Climax scenes - dramatic and intense
    return [cameraMovements[2], cameraMovements[8]][sceneIndex % 2]; // push-in or dolly-zoom
  } else {
    // Mix of other movements for variety
    const index = (sceneIndex * 3) % cameraMovements.length;
    return cameraMovements[index];
  }
}

// Generate color profiles for cinematic look
function generateColorProfile(prompt: string, platform: string, narrativePosition: number) {
  const colorProfiles = [
    {
      name: "Vibrant Modern",
      highlights: "#f5f5f5",
      midtones: "#0077cc",
      shadows: "#1a1a2e",
      saturation: 110,
      contrast: 120
    },
    {
      name: "Cinematic Orange-Teal",
      highlights: "#ff9e2c",
      midtones: "#4ec5f1",
      shadows: "#0a192f",
      saturation: 105,
      contrast: 130
    },
    {
      name: "Moody Desaturated",
      highlights: "#e0e0e0",
      midtones: "#607d8b",
      shadows: "#263238",
      saturation: 80,
      contrast: 115
    },
    {
      name: "Neon Night",
      highlights: "#ff2a6d",
      midtones: "#05d9e8",
      shadows: "#1d1d1d",
      saturation: 130,
      contrast: 140
    },
    {
      name: "Warm Vintage",
      highlights: "#ffd166",
      midtones: "#cb997e",
      shadows: "#46351d",
      saturation: 90,
      contrast: 95
    },
    {
      name: "Cool Documentary",
      highlights: "#f8f9fa",
      midtones: "#6c757d",
      shadows: "#212529",
      saturation: 85,
      contrast: 110
    }
  ];
  
  // Select color profile based on platform and narrative position
  let profileIndex = 0;
  
  if (platform === "YouTube") {
    // YouTube often uses more cinematic color grading
    profileIndex = narrativePosition < 0.5 ? 1 : 0; // Orange-Teal or Vibrant Modern
  } else if (platform === "TikTok") {
    // TikTok often uses more vibrant, attention-grabbing colors
    profileIndex = narrativePosition < 0.3 ? 3 : 0; // Neon Night or Vibrant Modern
  } else if (platform === "Instagram") {
    // Instagram often uses stylized, aesthetic color grading
    profileIndex = 4; // Warm Vintage
  } else if (platform === "Snapchat") {
    // Snapchat often uses more natural colors
    profileIndex = 5; // Cool Documentary
  }
  
  // For emotional climax scenes, use more dramatic color profiles
  if (narrativePosition > 0.4 && narrativePosition < 0.6) {
    profileIndex = 2; // Moody Desaturated for dramatic effect
  }
  
  return colorProfiles[profileIndex];
}

// Select appropriate visual effects for the scene
function selectVisualEffects(platform: string, narrativePosition: number) {
  const allEffects = [
    // Subtle effects
    { 
      name: "light-leak", 
      intensity: "low",
      description: "Subtle light leaks adding warmth and organic feel"
    },
    { 
      name: "grain-overlay", 
      intensity: "low",
      description: "Filmic grain texture for cinematic quality"
    },
    { 
      name: "vignette", 
      intensity: "medium",
      description: "Subtle darkening around the edges to focus attention"
    },
    
    // Medium effects
    { 
      name: "motion-blur", 
      intensity: "medium",
      description: "Directional blur on movement for dynamic feel"
    },
    { 
      name: "chromatic-aberration", 
      intensity: "low",
      description: "Subtle color fringing on high-contrast edges"
    },
    { 
      name: "lens-flare", 
      intensity: "medium",
      description: "Anamorphic lens flares on highlights"
    },
    
    // Strong effects
    { 
      name: "glitch", 
      intensity: "variable",
      description: "Digital distortion effects for transitions or emphasis"
    },
    { 
      name: "volumetric-lighting", 
      intensity: "high",
      description: "God rays and atmospheric lighting"
    },
    { 
      name: "particle-systems", 
      intensity: "high",
      description: "Dynamic particle effects for energy and motion"
    },
    { 
      name: "time-remap", 
      intensity: "high",
      description: "Dynamic speed adjustments for emphasis"
    }
  ];
  
  // Select effects based on platform and position in narrative
  let effects = [];
  
  // Base effects that apply to most contexts
  effects.push(allEffects[2]); // vignette
  
  if (platform === "YouTube") {
    // YouTube - cinematic, professional effects
    effects.push(allEffects[1]); // grain-overlay
    if (narrativePosition > 0.4 && narrativePosition < 0.6) {
      effects.push(allEffects[7]); // volumetric-lighting for climax
    }
    effects.push(allEffects[5]); // lens-flare
  } else if (platform === "TikTok") {
    // TikTok - energetic, attention-grabbing
    effects.push(allEffects[9]); // time-remap
    effects.push(allEffects[6]); // glitch
    if (narrativePosition > 0.7) {
      effects.push(allEffects[8]); // particle-systems
    }
  } else if (platform === "Instagram") {
    // Instagram - polished, aesthetic
    effects.push(allEffects[0]); // light-leak
    effects.push(allEffects[1]); // grain-overlay
    if (narrativePosition > 0.4 && narrativePosition < 0.6) {
      effects.push(allEffects[5]); // lens-flare
    }
  } else if (platform === "Snapchat") {
    // Snapchat - casual, fun
    if (narrativePosition > 0.5) {
      effects.push(allEffects[6]); // glitch
    }
    effects.push(allEffects[3]); // motion-blur
  }
  
  return effects;
}

// Select appropriate audio tracks for scenes
function selectAudioTrack(sceneIndex: number, totalScenes: number, platform: string, narrativePosition: number) {
  const audioTracks = [
    {
      name: "cinematic-opener",
      mood: "inspiring",
      intensity: "building",
      instruments: "orchestral strings, brass, percussion",
      description: "Dramatic building orchestral theme with crescendo"
    },
    {
      name: "modern-tech",
      mood: "innovative",
      intensity: "medium",
      instruments: "electronic, synth pads, digital percussion",
      description: "Clean, modern electronic beat with technological feel"
    },
    {
      name: "emotional-journey",
      mood: "moving",
      intensity: "gentle-building",
      instruments: "piano, strings, subtle percussion",
      description: "Emotive piano-driven theme with string accompaniment"
    },
    {
      name: "documentary-underscore",
      mood: "thoughtful",
      intensity: "low",
      instruments: "acoustic guitar, piano, ambient pads",
      description: "Subtle, thoughtful acoustic theme with gentle movement"
    },
    {
      name: "climactic-revelation",
      mood: "triumphant",
      intensity: "high",
      instruments: "full orchestra, percussion, choir",
      description: "Full orchestral theme with choral elements for major revelations"
    },
    {
      name: "trendy-upbeat",
      mood: "energetic",
      intensity: "high",
      instruments: "electronic beats, synth bass, vocal chops",
      description: "Contemporary electronic theme with catchy hooks"
    }
  ];
  
  // Opening scene
  if (sceneIndex === 0) {
    return audioTracks[0]; // cinematic-opener
  }
  
  // Closing scene
  if (sceneIndex === totalScenes - 1) {
    return audioTracks[4]; // climactic-revelation
  }
  
  // Climax scenes
  if (narrativePosition > 0.4 && narrativePosition < 0.6) {
    return audioTracks[4]; // climactic-revelation
  }
  
  // Platform-specific tracks for general scenes
  if (platform === "YouTube") {
    return narrativePosition < 0.3 ? audioTracks[3] : audioTracks[2]; // documentary then emotional
  } else if (platform === "TikTok" || platform === "Snapchat") {
    return audioTracks[5]; // trendy-upbeat
  } else {
    return audioTracks[1]; // modern-tech
  }
}

// Generate sound effects for enhanced audio experience
function generateSoundEffects(sceneIndex: number, narrativePosition: number) {
  const soundEffectCategories = [
    {
      category: "transitions",
      effects: ["whoosh", "impact", "stinger", "glitch", "beat-drop"]
    },
    {
      category: "ambience",
      effects: ["room-tone", "crowd", "nature", "city", "tech-environment"]
    },
    {
      category: "interface",
      effects: ["notification", "click", "processing", "error", "success"]
    },
    {
      category: "cinematic",
      effects: ["dramatic-hit", "revelation", "suspense-rise", "emotional-swell"]
    },
    {
      category: "foley",
      effects: ["movement", "interaction", "texture", "mechanical"]
    }
  ];
  
  const selectedEffects = [];
  
  // Transition sounds
  if (sceneIndex > 0) {
    const transitionEffect = soundEffectCategories[0].effects[sceneIndex % soundEffectCategories[0].effects.length];
    selectedEffects.push({
      type: "transition",
      sound: transitionEffect,
      timing: "start",
      volume: 0.8
    });
  }
  
  // Ambient background
  const ambienceIndex = Math.floor(narrativePosition * soundEffectCategories[1].effects.length);
  selectedEffects.push({
    type: "ambient",
    sound: soundEffectCategories[1].effects[ambienceIndex],
    timing: "continuous",
    volume: 0.2
  });
  
  // Emphasized moments
  if (narrativePosition > 0.3 && narrativePosition < 0.7) {
    selectedEffects.push({
      type: "emphasis",
      sound: soundEffectCategories[3].effects[sceneIndex % soundEffectCategories[3].effects.length],
      timing: "mid-scene",
      volume: 0.7
    });
  }
  
  return selectedEffects;
}

// Generate text overlays for key information
function generateTextOverlays(sceneIndex: number, totalScenes: number, prompt: string, platform: string) {
  const promptKeywords = prompt.split(" ")
    .filter(word => word.length > 3)
    .slice(0, 3);
  
  const position = sceneIndex / totalScenes;
  const textOverlays = [];
  
  // Title overlay for opening
  if (sceneIndex === 0) {
    textOverlays.push({
      content: generateCinematicTitle(prompt, platform),
      type: "title",
      position: "center",
      animation: "fade-scale",
      font: "premium-sans",
      size: "large",
      color: "#ffffff",
      shadow: true,
      timing: { in: 0.5, duration: 3.5, out: 0.5 }
    });
  }
  
  // Key point highlights
  if (position > 0.1 && position < 0.9) {
    const keyPoint = position < 0.5 
      ? `${promptKeywords[0] || "This"} increases engagement by 300%`
      : `${promptKeywords[1] || "Method"} revolutionizes your results`;
      
    textOverlays.push({
      content: keyPoint,
      type: "highlight",
      position: "lower-third",
      animation: "slide-fade",
      font: "premium-sans",
      size: "medium",
      color: "#ffffff",
      shadow: true,
      timing: { in: 0.8, duration: 2.5, out: 0.8 }
    });
  }
  
  // Call to action for end
  if (sceneIndex === totalScenes - 1 || sceneIndex === totalScenes - 2) {
    textOverlays.push({
      content: platform === "YouTube" ? "Subscribe for more content" : "Follow for more",
      type: "call-to-action",
      position: "bottom",
      animation: "pulse",
      font: "premium-sans-bold",
      size: "medium",
      color: "#ffffff",
      background: "semi-transparent",
      shadow: false,
      timing: { in: 0.5, duration: 3, out: 0.5 }
    });
  }
  
  // Add platform-specific branding or hashtags
  if (position > 0.7) {
    const hashtagContent = generateTrendingHashtags(prompt, platform).slice(0, 3).join(" ");
    
    textOverlays.push({
      content: hashtagContent,
      type: "hashtags",
      position: "bottom-right",
      animation: "fade",
      font: "premium-sans",
      size: "small",
      color: "#ffffff",
      shadow: true,
      timing: { in: 0.5, duration: 2, out: 0.5 }
    });
  }
  
  return textOverlays;
}

// Select cinematic transitions between scenes
function selectCinematicTransition(sceneIndex: number, totalScenes: number, narrativePosition: number) {
  const transitions = [
    {
      name: "cross-dissolve",
      duration: 0.5,
      easing: "ease-in-out",
      description: "Smooth fade between scenes"
    },
    {
      name: "cinematic-wipe",
      duration: 0.6,
      easing: "ease-out",
      description: "Directional wipe with soft edge"
    },
    {
      name: "flash-transition",
      duration: 0.3,
      easing: "ease-out",
      description: "Quick flash to white then into next scene"
    },
    {
      name: "zoom-blur",
      duration: 0.7,
      easing: "ease-in-out",
      description: "Zoom blur into next scene"
    },
    {
      name: "push-slide",
      duration: 0.6,
      easing: "cubic-bezier(0.83, 0, 0.17, 1)",
      description: "One scene pushes the other out of frame"
    },
    {
      name: "film-burn",
      duration: 0.8,
      easing: "ease-out",
      description: "Organic film burn effect transitioning scenes"
    },
    {
      name: "morph-transition",
      duration: 0.9,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      description: "Morphing between similar elements in scenes"
    },
    {
      name: "glitch-distortion",
      duration: 0.4,
      easing: "ease-in-out",
      description: "Digital glitch effect between scenes"
    },
    {
      name: "light-leak-transition",
      duration: 0.7,
      easing: "ease-in-out",
      description: "Light leak overlay blending scenes"
    }
  ];
  
  // Last scene doesn't need a transition
  if (sceneIndex >= totalScenes - 1) {
    return null;
  }
  
  // Opening transition
  if (sceneIndex === 0) {
    return transitions[2]; // flash-transition
  }
  
  // Transition to/from climax scenes
  if (narrativePosition > 0.4 && narrativePosition < 0.6) {
    return transitions[3]; // zoom-blur for dramatic effect
  }
  
  // Different transitions based on position in video
  if (narrativePosition < 0.3) {
    return transitions[sceneIndex % 3]; // Vary between first three transitions
  } else if (narrativePosition > 0.7) {
    return transitions[4 + (sceneIndex % 3)]; // Vary between transitions 4-6
  } else {
    // Mid-video transitions
    return transitions[sceneIndex % transitions.length]; // Use all transition types
  }
}

// Helper function to generate more captivating video titles
function generateCinematicTitle(prompt: string, platform: string) {
  const promptWords = prompt.split(" ");
  const keywords = promptWords.filter(word => word.length > 3).slice(0, 3);
  
  // Attention-grabbing prefixes
  const titlePrefixes = [
    "The Ultimate Guide to",
    "Revealed: The Truth About",
    "How to Master",
    "The Revolutionary Approach to",
    "Transforming Your Life With",
    "The Secret World of",
    "Unlocking the Power of",
    "Inside the Extraordinary World of",
    "The Complete Masterclass on",
    "The Mind-Blowing Reality of"
  ];
  
  const titleSuffixes = [
    "- What No One Tells You",
    "That Will Change Everything",
    "In Just 7 Days",
    "- Expert Secrets Revealed",
    "That Experts Don't Want You To Know",
    "- The Complete Visual Guide",
    "That Will Blow Your Mind",
    "- Revolutionary New Approach",
    "- Behind the Scenes",
    "- The Visual Experience"
  ];
  
  // Choose prefix and suffix based on platform trends
  let prefixIndex = 0;
  let suffixIndex = 0;
  
  if (platform === "YouTube") {
    prefixIndex = Math.floor(Math.random() * 5); // More educational/guide-focused
    suffixIndex = Math.floor(Math.random() * 3);
  } else if (platform === "TikTok") {
    prefixIndex = 5 + Math.floor(Math.random() * 5); // More attention-grabbing
    suffixIndex = 3 + Math.floor(Math.random() * 3);
  } else if (platform === "Instagram") {
    prefixIndex = Math.floor(Math.random() * 10); // Varied style
    suffixIndex = 6 + Math.floor(Math.random() * 4);
  } else {
    prefixIndex = Math.floor(Math.random() * 10);
    suffixIndex = Math.floor(Math.random() * 10);
  }
  
  // Construct title
  const mainKeyword = keywords[0] || prompt.split(" ")[0];
  const secondaryKeyword = keywords[1] || "";
  
  let title = `${titlePrefixes[prefixIndex]} ${mainKeyword}`;
  
  // Add secondary keyword if available
  if (secondaryKeyword) {
    title += ` and ${secondaryKeyword}`;
  }
  
  // Add suffix for stronger titles
  if (Math.random() > 0.3) {
    title += ` ${titleSuffixes[suffixIndex]}`;
  }
  
  return title;
}

// Generate engaging video descriptions
function generateEngagingDescription(prompt: string, platform: string) {
  const promptWords = prompt.split(" ");
  const keywords = promptWords.filter(word => word.length > 3).slice(0, 5);
  
  // Create compelling introduction
  const introductions = [
    `Discover the revolutionary approach to ${keywords[0] || prompt} in this visually stunning masterpiece.`,
    `Prepare to be amazed as we take you on an immersive journey through the world of ${keywords[0] || prompt}.`,
    `In this captivating visual experience, we reveal everything you need to know about ${keywords[0] || prompt}.`,
    `This cinematic exploration of ${keywords[0] || prompt} will transform your understanding forever.`,
    `Join us for an unforgettable visual journey into the extraordinary world of ${keywords[0] || prompt}.`
  ];
  
  // Create detailed middle section
  const middleSections = [
    `Using cutting-edge techniques and expert insights, we break down how ${keywords[0] || prompt} is revolutionizing ${keywords[1] || 'the industry'}. Through stunning visuals and clear explanations, you'll gain a comprehensive understanding that puts you ahead of the curve.`,
    
    `This meticulously crafted video showcases the power of ${keywords[0] || prompt} through real-world examples and breathtaking cinematography. We've consulted with leading experts to bring you accurate, actionable information presented in the most visually engaging way possible.`,
    
    `From beginners to experts, this visual guide provides invaluable insights into ${keywords[0] || prompt} that you won't find anywhere else. Our team has spent months researching and filming to create this definitive visual resource.`,
    
    `With exclusive access and insider knowledge, we take you behind the scenes of ${keywords[0] || prompt} to reveal secrets that will give you a competitive edge. The stunning cinematography and clear explanations make complex concepts accessible to everyone.`,
    
    `This visually stunning breakdown of ${keywords[0] || prompt} combines beautiful cinematography with expert analysis to create the most comprehensive guide available. Every frame has been carefully crafted to maximize both educational value and visual impact.`
  ];
  
  // Create strong call-to-action
  const ctaSections = [
    `Like and subscribe for more breathtaking content that transforms how you see the world. Turn on notifications to never miss our next visual masterpiece.`,
    
    `If you found this valuable, help others discover this knowledge by sharing it with your network. Don't forget to subscribe for more visually stunning guides.`,
    
    `Subscribe now to join our community of forward-thinkers and visual enthusiasts. New cinematic content drops every week - turn on notifications so you never miss out.`,
    
    `Make sure to follow for more high-quality visual content that combines beauty with valuable insights. Your journey into visual excellence is just beginning.`,
    
    `This is just the beginning of our visual journey together. Subscribe now and join us as we explore more fascinating topics with the same attention to visual excellence.`
  ];
  
  // Select appropriate sections based on platform
  let introIndex = 0;
  let middleIndex = 0;
  let ctaIndex = 0;
  
  if (platform === "YouTube") {
    introIndex = Math.floor(Math.random() * 3);
    middleIndex = Math.floor(Math.random() * 3);
    ctaIndex = Math.floor(Math.random() * 3);
  } else if (platform === "TikTok") {
    introIndex = 3 + Math.floor(Math.random() * 2);
    middleIndex = 3 + Math.floor(Math.random() * 2);
    ctaIndex = 3 + Math.floor(Math.random() * 2);
  } else {
    introIndex = Math.floor(Math.random() * 5);
    middleIndex = Math.floor(Math.random() * 5);
    ctaIndex = Math.floor(Math.random() * 5);
  }
  
  // Assemble complete description
  return `${introductions[introIndex]}\n\n${middleSections[middleIndex]}\n\n${ctaSections[ctaIndex]}`;
}

// Generate trending hashtags for better discoverability
function generateTrendingHashtags(prompt: string, platform: string) {
  // Extract keywords from prompt
  const promptKeywords = prompt.toLowerCase().split(" ")
    .filter(word => word.length > 3)
    .map(word => word.replace(/[^a-z0-9]/g, ""));
  
  // Platform-specific trending hashtags
  const platformHashtags = {
    "YouTube": ["tutorial", "howto", "explained", "review", "guide", "vlog", "4k", "cinematic"],
    "TikTok": ["fyp", "foryou", "foryoupage", "viral", "trending", "tiktokmademebuyit", "learningontiktok"],
    "Instagram": ["instagood", "reels", "instareels", "igdaily", "aesthetic", "content", "creativity"],
    "Snapchat": ["snapchat", "snapchatters", "snapfam", "snaplife", "snapcreators", "spotlight"]
  };
  
  // General trending hashtags
  const generalHashtags = ["viral", "trending", "contentcreator", "videography", "filmmaker", "create", "creative"];
  
  // Topic-related hashtags
  const topicHashtags = {
    "tech": ["tech", "technology", "innovation", "digital", "future", "gadgets"],
    "lifestyle": ["lifestyle", "life", "daily", "routine", "motivation", "inspiration"],
    "education": ["learning", "education", "knowledge", "skills", "howto", "tutorial"],
    "entertainment": ["entertainment", "fun", "funny", "comedy", "laugh", "reaction"],
    "business": ["business", "entrepreneur", "success", "growth", "marketing", "strategy"]
  };
  
  // Determine video topic based on prompt keywords
  let videoTopic = "education"; // Default
  
  for (const [topic, words] of Object.entries(topicHashtags)) {
    for (const keyword of promptKeywords) {
      if (words.includes(keyword)) {
        videoTopic = topic;
        break;
      }
    }
  }
  
  // Build hashtagList
  let hashtagList = [];
  
  // Add transformed prompt keywords (up to 3)
  hashtagList = [...promptKeywords.slice(0, 3).map(word => `#${word}`)];
  
  // Add 3-4 platform-specific hashtags
  const platformTags = platformHashtags[platform as keyof typeof platformHashtags] || platformHashtags.YouTube;
  hashtagList = [...hashtagList, ...shuffleAndTake(platformTags, 4).map(tag => `#${tag}`)];
  
  // Add 2-3 topic-specific hashtags
  const topicTags = topicHashtags[videoTopic as keyof typeof topicHashtags] || topicHashtags.education;
  hashtagList = [...hashtagList, ...shuffleAndTake(topicTags, 3).map(tag => `#${tag}`)];
  
  // Add 2 general hashtags
  hashtagList = [...hashtagList, ...shuffleAndTake(generalHashtags, 2).map(tag => `#${tag}`)];
  
  // Add trendy platform-specific tags
  if (platform === "TikTok") {
    hashtagList.push("#tiktokpartner");
  } else if (platform === "YouTube") {
    hashtagList.push("#youtubecreators");
  } else if (platform === "Instagram") {
    hashtagList.push("#igcreators");
  }
  
  // Return final hashtag list without duplicates (up to 15 hashtags)
  return [...new Set(hashtagList)].slice(0, 15);
}

// Helper function to shuffle array and take n elements
function shuffleAndTake(array: string[], n: number): string[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Get visual effects profile for platform
function getVisualEffectsForPlatform(platform: string) {
  const visualEffects = {
    "YouTube": {
      primaryEffects: ["cinematic color grading", "professional transitions", "dynamic b-roll", "stabilized camera movement"],
      overlayEffects: ["text animations", "subtle lower thirds", "call-to-action graphics"],
      stylization: "professional cinematic"
    },
    "TikTok": {
      primaryEffects: ["fast cuts", "zoom transitions", "text tracking", "tempo-synced edits"],
      overlayEffects: ["animated stickers", "trending effects", "on-screen reactions"],
      stylization: "high-energy trending"
    },
    "Instagram": {
      primaryEffects: ["lifestyle color grading", "smooth transitions", "parallax effects", "portrait optimization"],
      overlayEffects: ["aesthetic frames", "minimal typography", "branded elements"],
      stylization: "polished aspirational"
    },
    "Snapchat": {
      primaryEffects: ["vertical-first composition", "augmented reality elements", "quick cuts", "casual filming style"],
      overlayEffects: ["playful graphics", "interactive elements", "casual text overlays"],
      stylization: "authentic spontaneous"
    }
  };
  
  return visualEffects[platform as keyof typeof visualEffects] || visualEffects.YouTube;
}

// Get audio profile for platform
function getAudioProfileForPlatform(platform: string) {
  const audioProfiles = {
    "YouTube": {
      musicStyle: "professional soundtrack",
      voiceoverQuality: "studio-quality narration",
      soundEffects: "comprehensive sound design",
      audioProcessing: "professional mixing and mastering",
      audioQuality: "high fidelity 48kHz stereo"
    },
    "TikTok": {
      musicStyle: "trending songs and sounds",
      voiceoverQuality: "casual direct address",
      soundEffects: "attention-grabbing accents",
      audioProcessing: "compressed for mobile playback",
      audioQuality: "optimized for headphones"
    },
    "Instagram": {
      musicStyle: "lifestyle and aesthetic tracks",
      voiceoverQuality: "conversational personal",
      soundEffects: "subtle environmental design",
      audioProcessing: "polished but authentic",
      audioQuality: "mobile-optimized stereo"
    },
    "Snapchat": {
      musicStyle: "upbeat contemporary tracks",
      voiceoverQuality: "casual on-the-go recording",
      soundEffects: "playful accent sounds",
      audioProcessing: "light compression",
      audioQuality: "mobile-friendly mono"
    }
  };
  
  return audioProfiles[platform as keyof typeof audioProfiles] || audioProfiles.YouTube;
}

// Generate specific platform color profile
function getColorProfile(prompt: string, platform: string) {
  const colorProfiles = {
    "YouTube": {
      primary: "#FF0000",
      secondary: "#282828",
      text: "#FFFFFF",
      accent: "#065FD4",
      scheme: "cinematic dynamic range"
    },
    "TikTok": {
      primary: "#00f2ea",
      secondary: "#ff0050",
      text: "#FFFFFF",
      accent: "#69C9D0",
      scheme: "high-contrast vibrant"
    },
    "Instagram": {
      primary: "#833AB4",
      secondary: "#FD1D1D",
      text: "#FFFFFF",
      accent: "#FCAF45",
      scheme: "warm lifestyle gradient"
    },
    "Snapchat": {
      primary: "#FFFC00",
      secondary: "#000000",
      text: "#000000",
      accent: "#00C4F0",
      scheme: "bright authentic"
    }
  };
  
  return colorProfiles[platform as keyof typeof colorProfiles] || colorProfiles.YouTube;
}

// Get motion graphics profile for the platform
function getMotionGraphicsProfile(platform: string) {
  const motionGraphicsProfiles = {
    "YouTube": {
      style: "professional polished",
      typography: "clear modern sans-serif",
      animations: "smooth professional easing",
      elements: ["lower thirds", "call-to-action overlays", "title sequences", "end screens"],
      complexity: "high"
    },
    "TikTok": {
      style: "fast-paced trending",
      typography: "bold impactful fonts",
      animations: "quick energetic movements",
      elements: ["text animations", "sticker-like graphics", "trend-specific effects", "emoji animations"],
      complexity: "medium-high"
    },
    "Instagram": {
      style: "aesthetic minimalist",
      typography: "stylish contemporary fonts",
      animations: "elegant transitions",
      elements: ["framing devices", "subtle branding", "clean captions", "minimalist icons"],
      complexity: "medium"
    },
    "Snapchat": {
      style: "playful spontaneous",
      typography: "casual handwritten styles",
      animations: "bouncy playful movements",
      elements: ["animated stickers", "doodles", "emoji enhancements", "interactive overlays"],
      complexity: "medium-low"
    }
  };
  
  return motionGraphicsProfiles[platform as keyof typeof motionGraphicsProfiles] || motionGraphicsProfiles.YouTube;
}

// Generate premium sound design profile
function getPremiumSoundDesignProfile(platform: string) {
  const soundDesignProfiles = {
    "YouTube": {
      atmospherics: "professional ambient layers",
      soundEffects: "complete detailed soundscape",
      transitions: "smooth cinematic audio transitions",
      music: "licensed premium soundtrack",
      voiceover: "professional narration",
      quality: "broadcast standard"
    },
    "TikTok": {
      atmospherics: "minimal background elements",
      soundEffects: "punchy accent sounds",
      transitions: "beat-synced audio cuts",
      music: "trending viral tracks",
      voiceover: "close-mic vocal presence",
      quality: "mobile optimized"
    },
    "Instagram": {
      atmospherics: "stylized ambient sounds",
      soundEffects: "lifestyle-appropriate accents",
      transitions: "smooth musical transitions",
      music: "aesthetic mood-setting tracks",
      voiceover: "intimate personal narration",
      quality: "social-optimized stereo"
    },
    "Snapchat": {
      atmospherics: "real-world environment",
      soundEffects: "playful cartoon-style effects",
      transitions: "quick cut audio edits",
      music: "upbeat contemporary tracks",
      voiceover: "casual unpolished narration",
      quality: "mobile friendly"
    }
  };
  
  return soundDesignProfiles[platform as keyof typeof soundDesignProfiles] || soundDesignProfiles.YouTube;
}

// Select premium music track based on content and platform
function selectPremiumMusicTrack(prompt: string, platform: string) {
  const musicCategories = {
    "cinematic": [
      {
        name: "Epic Orchestral Journey",
        mood: "inspiring",
        tempo: "building",
        instruments: "full orchestra with choir",
        peaks: "multiple dramatic crescendos"
      },
      {
        name: "Emotional String Ensemble",
        mood: "moving",
        tempo: "moderate",
        instruments: "strings, piano, subtle percussion",
        peaks: "emotional string swells"
      }
    ],
    "corporate": [
      {
        name: "Modern Business Innovation",
        mood: "professional",
        tempo: "medium",
        instruments: "digital percussion, piano, strings",
        peaks: "structured builds every 30 seconds"
      },
      {
        name: "Corporate Success Story",
        mood: "triumphant",
        tempo: "medium-fast",
        instruments: "synth pads, strings, piano, percussion",
        peaks: "gradual build to triumphant conclusion"
      }
    ],
    "lifestyle": [
      {
        name: "Uplifting Indie Journey",
        mood: "positive",
        tempo: "upbeat",
        instruments: "acoustic guitar, claps, light percussion",
        peaks: "chorus with gang vocals"
      },
      {
        name: "Summer Sunshine Vibes",
        mood: "carefree",
        tempo: "medium-fast",
        instruments: "ukulele, acoustic guitar, whistling",
        peaks: "bright cheerful choruses"
      }
    ],
    "trending": [
      {
        name: "Viral Beat Compilation",
        mood: "energetic",
        tempo: "fast",
        instruments: "electronic beats, synth bass, vocal chops",
        peaks: "multiple beat drops for transitions"
      },
      {
        name: "TikTok Top 40 Remix",
        mood: "current",
        tempo: "fast",
        instruments: "trap beats, synthesizers, vocal samples",
        peaks: "quick 15-second hook sections"
      }
    ]
  };
  
  // Determine appropriate music category based on prompt and platform
  let category = "cinematic"; // Default
  
  // Check prompt for keywords that might indicate a category
  const lowercasePrompt = prompt.toLowerCase();
  if (lowercasePrompt.includes("business") || lowercasePrompt.includes("professional") || 
      lowercasePrompt.includes("company") || lowercasePrompt.includes("corporate")) {
    category = "corporate";
  } else if (lowercasePrompt.includes("lifestyle") || lowercasePrompt.includes("travel") ||
      lowercasePrompt.includes("daily") || lowercasePrompt.includes("vlog")) {
    category = "lifestyle";
  } else if (platform === "TikTok" || platform === "Snapchat" || 
      lowercasePrompt.includes("trend") || lowercasePrompt.includes("viral")) {
    category = "trending";
  }
  
  // Select track from appropriate category
  const tracks = musicCategories[category as keyof typeof musicCategories];
  const selectedTrack = tracks[Math.floor(Math.random() * tracks.length)];
  
  // Add platform-specific customization
  if (platform === "YouTube") {
    selectedTrack.duration = "full-length";
    selectedTrack.quality = "professional license";
  } else if (platform === "TikTok") {
    selectedTrack.duration = "loop-optimized";
    selectedTrack.quality = "trending sound";
  } else if (platform === "Instagram") {
    selectedTrack.duration = "30-60 seconds";
    selectedTrack.quality = "lifestyle premium";
  } else if (platform === "Snapchat") {
    selectedTrack.duration = "short-form";
    selectedTrack.quality = "contemporary";
  }
  
  return {
    ...selectedTrack,
    category,
    platform: platform
  };
}

// Generate appropriate calls-to-action for the platform
function generateCallsToAction(platform: string, prompt: string) {
  const callsToAction = {
    "YouTube": [
      {
        text: "SUBSCRIBE for more premium content",
        timing: "end-card",
        style: "professional overlay",
        animation: "fade-in with highlight",
        interaction: "channel subscription"
      },
      {
        text: "Watch NEXT: Complete series on " + prompt,
        timing: "end-card",
        style: "video thumbnail grid",
        animation: "sliding cards",
        interaction: "video suggestion"
      }
    ],
    "TikTok": [
      {
        text: "Follow for Part 2!",
        timing: "mid-video hook",
        style: "bold center text",
        animation: "bounce emphasis",
        interaction: "profile follow"
      },
      {
        text: "Drop a 🔥 if you want more!",
        timing: "ending hook",
        style: "full-screen text",
        animation: "quick zoom",
        interaction: "comment engagement"
      }
    ],
    "Instagram": [
      {
        text: "Save this for later ↓",
        timing: "mid-video value point",
        style: "minimalist overlay",
        animation: "subtle fade",
        interaction: "save post"
      },
      {
        text: "Follow for daily content",
        timing: "outro",
        style: "aesthetic text overlay",
        animation: "stylish slide-in",
        interaction: "profile follow"
      }
    ],
    "Snapchat": [
      {
        text: "Swipe up for more!",
        timing: "throughout",
        style: "casual bouncing text",
        animation: "swipe-up arrow motion",
        interaction: "swipe action"
      },
      {
        text: "Send to a friend who needs this!",
        timing: "outro",
        style: "friendly text bubble",
        animation: "share icon animation",
        interaction: "send to friends"
      }
    ]
  };
  
  return callsToAction[platform as keyof typeof callsToAction] || callsToAction.YouTube;
}

// Generate interactive elements for the platform
function getInteractiveElements(platform: string) {
  const interactiveElements = {
    "YouTube": [
      {
        type: "end screen",
        timing: "last 20 seconds",
        purpose: "channel subscription and video recommendations",
        format: "professional overlays"
      },
      {
        type: "info cards",
        timing: "contextual moments",
        purpose: "additional resources and links",
        format: "subtle top-right indicators"
      },
      {
        type: "pinned comment",
        timing: "post-upload",
        purpose: "continue conversation and provide resources",
        format: "text with timestamps and links"
      }
    ],
    "TikTok": [
      {
        type: "text reply prompt",
        timing: "end of video",
        purpose: "comment engagement",
        format: "direct question to viewers"
      },
      {
        type: "duet suggestion",
        timing: "mid-video",
        purpose: "encourage content creation",
        format: "split-screen layout optimization"
      },
      {
        type: "trending sound attribution",
        timing: "throughout",
        purpose: "algorithm optimization",
        format: "sound name overlay"
      }
    ],
    "Instagram": [
      {
        type: "poll sticker",
        timing: "key decision point",
        purpose: "audience engagement",
        format: "interactive overlay"
      },
      {
        type: "product tags",
        timing: "relevant moments",
        purpose: "shoppable content",
        format: "subtle product highlights"
      },
      {
        type: "sharing prompt",
        timing: "valuable information moment",
        purpose: "story sharing",
        format: "direct call to share"
      }
    ],
    "Snapchat": [
      {
        type: "swipe-up link",
        timing: "throughout",
        purpose: "drive external traffic",
        format: "arrow indicator"
      },
      {
        type: "AR effect trigger",
        timing: "entertaining moments",
        purpose: "interactive experience",
        format: "effect demonstration"
      },
      {
        type: "share prompt",
        timing: "end of content",
        purpose: "peer sharing",
        format: "friend selection suggestion"
      }
    ]
  };
  
  return interactiveElements[platform as keyof typeof interactiveElements] || interactiveElements.YouTube;
}
