
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
  
  try {
    // Using GPT-4o with improved prompting for better video content generation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // Upgraded to gpt-4o from gpt-4o
        messages: [{
          role: 'system',
          content: `You are an expert video creator specializing in creating viral content for ${platform} with millions of views. 
          You understand the algorithm and audience preferences of ${platform} deeply. 
          You create detailed, production-ready storyboards with exact timing, transitions, and shot lists.
          Your videos are known for their high engagement and shareable quality.`
        }, {
          role: 'user',
          content: `Create a detailed, production-ready storyboard for a viral ${platform} video with this concept: "${prompt}"
          
          ${platformGuide}
          
          Structure your response as a JSON object with:
          1. scenes: Array of 5-7 scenes, each containing:
             - sceneId (number)
             - duration (in seconds, be precise about timing)
             - script (exact spoken/text content, make it engaging and conversational)
             - visualDescription (detailed shot description including framing, lighting, and subject positioning)
             - transition (specific transition effect that would work well on ${platform})
             - cameraMovement (specific camera technique to keep viewers engaged)
             - textOverlay (exact text that appears on screen with style notes)
             - soundDesign (specific audio elements including music style, sound effects, and audio transitions)
          2. totalDuration (sum of all scene durations in seconds)
          3. musicTrack (detailed description of music style, tempo, and mood)
          4. style (visual aesthetic description tailored to ${platform}'s trending styles)
          5. editingPace (description of editing rhythm and pacing strategies for maximum retention)
          6. callToAction (specific engaging viewer prompt that generates high comment rates)
          
          The video should follow this proven viral structure for ${platform}:
          - Start with a strong pattern-interrupt hook in the first 2 seconds
          - Create curiosity gap in first 5 seconds
          - Deliver key value points with clear visual support
          - Use pace changes to maintain attention
          - End with strong personalized call-to-action
          
          Be extremely specific and detailed about visual elements, text animations, and transitions to ensure the video can be produced exactly as described.
          Focus on making this suitable for the target platform's algorithm and audience preferences.`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    // Enhanced error handling and validation
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid or missing content in OpenAI response:', JSON.stringify(data));
      return createFallbackContent(prompt, platform);
    }
    
    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      
      // Validate the essential structure of the response
      if (!parsedContent.scenes || !Array.isArray(parsedContent.scenes) || parsedContent.scenes.length === 0) {
        console.error('Missing scenes array in parsed content:', parsedContent);
        return createFallbackContent(prompt, platform);
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error('Failed to parse video content JSON:', parseError);
      console.error('Raw content that failed to parse:', data.choices[0].message.content);
      return createFallbackContent(prompt, platform);
    }
  } catch (error) {
    console.error('Error generating video content:', error);
    return createFallbackContent(prompt, platform);
  }
}

function getPlatformGuide(platform) {
  switch (platform) {
    case 'YouTube':
      return `Optimize for YouTube Shorts:
        - Vertical 9:16 aspect ratio
        - 15-60 seconds duration, but aim for 30 seconds for optimal retention
        - Strong hook in first 3 seconds that stops scrolling
        - Fast-paced editing with clear text overlays that enhance not duplicate speech
        - Include midpoint twist or reveal to boost completion rates
        - End with specific subscribe prompt and clear next video teaser
        - Use high-contrast visuals and dynamic transitions
        - Include trending audio and sound effects
        - Incorporate current YouTube trends in storytelling approach`;
        
    case 'TikTok':
      return `Optimize for TikTok:
        - Vertical 9:16 aspect ratio
        - 15-27 seconds optimal duration for maximum reach
        - Hook viewers in first 1-2 seconds with pattern interrupt
        - Use trending sounds, effects, and transitions from current TikTok meta
        - Incorporate text overlays with TikTok-native fonts and animated effects
        - Include two pace changes within video to boost watch time
        - End with question-based call-to-action for comments
        - Include 3-5 trending hashtags in content and description
        - Use quick zoom transitions and text animations that match current TikTok style`;
        
    case 'Instagram':
      return `Optimize for Instagram Reels:
        - Vertical 9:16 aspect ratio
        - 15-30 seconds optimal duration for algorithmic preference
        - Visually appealing, high-quality aesthetic with Instagram's preferred color grading
        - Clean text overlays with Instagram-friendly fonts and minimal animations
        - Smooth transitions and subtle filters that match current Instagram aesthetic
        - Include on-trend music and effects from Instagram's library
        - End with dual call-to-action for saves AND shares (Instagram's key metrics)
        - Incorporate carousel-style multi-point content structure
        - Use content hooks that work well for Instagram's audience demographic`;
        
    case 'Snapchat':
      return `Optimize for Snapchat Spotlight:
        - Vertical 9:16 aspect ratio
        - 10-60 seconds duration with 15 second optimal point
        - Super fast-paced content with quick cuts (every 1-2 seconds)
        - Bold text overlays with Snapchat visual style and animated elements
        - Incorporate creative lens effects and AR filters specific to Snapchat
        - Use trending sounds and effects from Snapchat's ecosystem
        - Simple, direct messaging with Gen Z friendly language
        - High-energy transitions between all scenes
        - Include Snapchat-specific UI elements and native features`;
        
    default:
      return `Optimize for social media:
        - Vertical 9:16 aspect ratio for mobile-first consumption
        - 15-30 seconds optimal duration for cross-platform performance
        - Hook viewers in first 2-3 seconds with unexpected visual or statement
        - Clear text overlays with modern fonts and subtle animations
        - Dynamic transitions and effects that enhance content not distract
        - End with strong call-to-action encouraging specific engagement
        - Balance pacing with 2-3 tempo changes throughout`;
  }
}

function createFallbackContent(prompt, platform) {
  // Create a improved fallback content structure with platform-specific customization
  console.log(`Creating fallback content for ${platform} with prompt: ${prompt}`);
  
  // Custom fallback scenes based on platform
  let scenes = [];
  let totalDuration = 0;
  let style = "";
  let musicTrack = "";
  let editingPace = "";
  let callToAction = "";
  
  // Customize fallback content based on platform
  switch (platform) {
    case 'YouTube':
      scenes = [
        {
          sceneId: 1,
          duration: 3,
          script: `You won't believe what's happening with ${prompt}!`,
          visualDescription: `Close-up shot with surprised expression, bright lighting`,
          transition: "quick zoom",
          cameraMovement: "push in",
          textOverlay: "WAIT FOR IT...",
          soundDesign: "Bass drop with notification sound"
        },
        {
          sceneId: 2,
          duration: 5,
          script: `Here are 3 things you NEED to know about ${prompt}`,
          visualDescription: `Medium shot with animated bullet points appearing beside speaker`,
          transition: "slide left",
          cameraMovement: "slight pan right",
          textOverlay: "3 THINGS YOU NEED TO KNOW",
          soundDesign: "Light percussion with typing sound effects"
        },
        {
          sceneId: 3,
          duration: 7,
          script: `First, most people don't realize that ${prompt} actually can change everything about how you...`,
          visualDescription: `Split screen showing before/after comparison with highlighted area`,
          transition: "swipe up",
          cameraMovement: "tracking shot",
          textOverlay: "#1: GAME CHANGER",
          soundDesign: "Rising tension with pop sound effect"
        },
        {
          sceneId: 4,
          duration: 7,
          script: `Second, experts have recently discovered this mind-blowing fact about ${prompt}...`,
          visualDescription: `Reaction shot with data visualization appearing over footage`,
          transition: "flash transition",
          cameraMovement: "pull back reveal",
          textOverlay: "#2: EXPERTS SHOCKED",
          soundDesign: "Dramatic chord with whisper effect"
        },
        {
          sceneId: 5,
          duration: 5,
          script: `And finally, here's what you can do right now with ${prompt}`,
          visualDescription: `Close-up of hands demonstrating action with bright key light`,
          transition: "spin transition",
          cameraMovement: "overhead to eye level",
          textOverlay: "#3: DO THIS NOW",
          soundDesign: "Upbeat rhythm with success chime"
        },
        {
          sceneId: 6,
          duration: 3,
          script: `Hit subscribe for more amazing ${prompt} content!`,
          visualDescription: `Direct address to camera with animated subscribe button`,
          transition: "fade out",
          cameraMovement: "static",
          textOverlay: "SUBSCRIBE NOW!",
          soundDesign: "Signature outro with bell notification sound"
        }
      ];
      totalDuration = 30;
      style = "High-contrast YouTube Shorts style with bright colors and bold text animations";
      musicTrack = "Trending upbeat electronic track with rhythmic beats and tension build-up";
      editingPace = "Fast-paced with dynamic cuts every 1-2 seconds, zooms on key points";
      callToAction = "Comment 'YES' if you want a full tutorial on this!";
      break;
    
    case 'TikTok':
      scenes = [
        {
          sceneId: 1,
          duration: 2,
          script: `Wait - you're using ${prompt} wrong!`,
          visualDescription: `Extreme close-up of shocked face with TikTok-style color filter`,
          transition: "TikTok zoom blur",
          cameraMovement: "quick snap zoom",
          textOverlay: "USING IT WRONG ❌",
          soundDesign: "Viral TikTok sound with bass drop"
        },
        {
          sceneId: 2,
          duration: 4,
          script: `I found a hack for ${prompt} that no one talks about`,
          visualDescription: `POV shot showing hands with exaggerated movements`,
          transition: "TikTok page flip",
          cameraMovement: "handheld follow",
          textOverlay: "SECRET HACK 🤫",
          soundDesign: "Trending TikTok sound with percussion"
        },
        {
          sceneId: 3,
          duration: 7,
          script: `Here's exactly how to do it in 3 steps...`,
          visualDescription: `Step-by-step demonstration with TikTok-style zooms on key actions`,
          transition: "quick cuts",
          cameraMovement: "jump cut sequence",
          textOverlay: "STEP 1: [action] ✅",
          soundDesign: "Finger snap transitions with voice shifting effect"
        },
        {
          sceneId: 4,
          duration: 6,
          script: `This works because most people never realized that ${prompt} actually...`,
          visualDescription: `Reaction shot with on-screen text animations popping in`,
          transition: "TikTok stutter cut",
          cameraMovement: "zoom bounce",
          textOverlay: "MIND = BLOWN 🤯",
          soundDesign: "TikTok viral sound effect with voice distortion"
        },
        {
          sceneId: 5,
          duration: 3,
          script: `Try this NOW and thank me later`,
          visualDescription: `Direct-to-camera with pointing gesture and TikTok filter effect`,
          transition: "TikTok bounce out",
          cameraMovement: "push in dramatic",
          textOverlay: "THANK ME LATER ⬇️",
          soundDesign: "TikTok trending outro sound with voice effect"
        }
      ];
      totalDuration = 22;
      style = "High-energy TikTok style with saturated colors, quick zooms, and trendy filters";
      musicTrack = "Viral TikTok sound with recognizable hook and beat drop";
      editingPace = "Ultra fast with cuts every 1-2 seconds, multiple text animations, and speed ramping";
      callToAction = "Drop a '🔥' if this hack worked for you!";
      break;
      
    case 'Instagram':
      scenes = [
        {
          sceneId: 1,
          duration: 3,
          script: `This ${prompt} technique changed everything...`,
          visualDescription: `Aesthetic medium shot with Instagram-style color grading and soft lighting`,
          transition: "smooth slide",
          cameraMovement: "gentle push in",
          textOverlay: "life-changing technique ✨",
          soundDesign: "Soft cinematic intro with Instagram-friendly beat"
        },
        {
          sceneId: 2,
          duration: 6,
          script: `I discovered this after trying everything else with ${prompt}`,
          visualDescription: `B-roll sequence with Instagram-style color grading showing process`,
          transition: "elegant fade through",
          cameraMovement: "smooth tracking shot",
          textOverlay: "tried everything else first...",
          soundDesign: "Light atmospheric music with subtle transition sound"
        },
        {
          sceneId: 3,
          duration: 8,
          script: `Here's exactly what made the difference with ${prompt}...`,
          visualDescription: `Stylized demonstration with Instagram-friendly lighting and composition`,
          transition: "organic wipe",
          cameraMovement: "parallax pan",
          textOverlay: "the key difference:",
          soundDesign: "Building momentum with subtle percussion"
        },
        {
          sceneId: 4,
          duration: 7,
          script: `When you apply it this way, you'll immediately notice...`,
          visualDescription: `Close-up of details with Instagram aesthetic and soft focus elements`,
          transition: "elegant dissolve",
          cameraMovement: "reveal pull back",
          textOverlay: "immediate results ✓",
          soundDesign: "Satisfying completion sound with atmospheric elements"
        },
        {
          sceneId: 5,
          duration: 4,
          script: `Save this for later and follow for more ${prompt} tips`,
          visualDescription: `Aesthetic final shot with Instagram-style framing and warm tones`,
          transition: "soft fade",
          cameraMovement: "gentle pull out",
          textOverlay: "save ↓ follow ↓ share ↓",
          soundDesign: "Instagram-friendly outro beat with subtle chime"
        }
      ];
      totalDuration = 28;
      style = "Polished Instagram aesthetic with warm tones, soft lighting, and clean compositions";
      musicTrack = "Trending Instagram Reels music with calm beat and atmospheric elements";
      editingPace = "Moderately paced with smooth transitions and elegant text animations";
      callToAction = "Save this post for when you need it! 💫";
      break;
      
    case 'Snapchat':
      scenes = [
        {
          sceneId: 1,
          duration: 2,
          script: `OMG you need to see this ${prompt} hack!`,
          visualDescription: `Extreme close-up with Snapchat lens effect and bright colors`,
          transition: "snap cut",
          cameraMovement: "snap zoom",
          textOverlay: "INSANE HACK!!",
          soundDesign: "Snapchat notification sound with trap beat"
        },
        {
          sceneId: 2,
          duration: 3,
          script: `No one is talking about this ${prompt} secret`,
          visualDescription: `POV shot with Snapchat AR filter and exaggerated expression`,
          transition: "swipe effect",
          cameraMovement: "shakycam reveal",
          textOverlay: "MAJOR SECRET 🤐",
          soundDesign: "Gen Z vocal sample with distortion effect"
        },
        {
          sceneId: 3,
          duration: 5,
          script: `Watch what happens when I do this...`,
          visualDescription: `Fast demonstration with Snapchat-style color effects and AR elements`,
          transition: "instant cut",
          cameraMovement: "erratic movement",
          textOverlay: "WATCH THIS!!",
          soundDesign: "Trap beat drop with voice distortion"
        },
        {
          sceneId: 4,
          duration: 4,
          script: `That's literally insane right?? ${prompt} will never be the same`,
          visualDescription: `Reaction shot with exaggerated expression and Snapchat lens`,
          transition: "quick flash",
          cameraMovement: "whip pan",
          textOverlay: "MIND BLOWN 🤯🤯🤯",
          soundDesign: "Bass impact with voice effect"
        },
        {
          sceneId: 5,
          duration: 2,
          script: `Swipe up to learn more crazy hacks!`,
          visualDescription: `Direct address with Snapchat arrow graphic and lens filter`,
          transition: "snap out",
          cameraMovement: "forward push",
          textOverlay: "SWIPE UP NOW ⬆️⬆️⬆️",
          soundDesign: "Snapchat-style ending alert with vocal tag"
        }
      ];
      totalDuration = 16;
      style = "High-energy Snapchat style with bright colors, AR filters, and Gen Z aesthetic";
      musicTrack = "Viral trap beat with voice samples and bass drops";
      editingPace = "Extremely fast cuts with erratic movements and constant visual stimulation";
      callToAction = "Screenshot this or you'll regret it later!!";
      break;
      
    default:
      scenes = [
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
      ];
      totalDuration = 18;
      style = "High-contrast visuals with modern color grading";
      musicTrack = "Trending upbeat electronic with rhythmic beats";
      editingPace = "Fast-paced with dynamic cuts and transitions";
      callToAction = "Follow, like and comment for more content like this!";
  }
  
  return {
    scenes,
    totalDuration,
    musicTrack,
    style,
    editingPace,
    callToAction
  };
}

async function generateVisualStyleGuide(prompt, platform, videoContent) {
  console.log(`Generating visual style guide for ${platform}`);
  
  try {
    // Using GPT-4o with enhanced prompt for more detailed style guide
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
          content: `You are a professional video editor and cinematographer specializing in creating viral content for ${platform}. 
          You have deep knowledge of color grading, visual effects, and editing techniques that perform exceptionally well on ${platform}'s algorithm.
          Your style guides are known for their technical precision and actionable specificity.`
        }, {
          role: 'user',
          content: `Create a detailed, technical visual style guide for this ${platform} video with the concept: "${prompt}"
          
          Based on this storyboard: ${JSON.stringify(videoContent)}
          
          Provide extremely specific details about:
          
          1. Color palette and grading:
             - Exact LUT suggestions (name specific popular LUTs)
             - RGB values for primary and secondary colors
             - Contrast, saturation, and temperature settings
             - Platform-specific color optimization techniques
          
          2. Text animations and typography:
             - Font families and weights that perform well on ${platform}
             - Exact animation timings (in seconds)
             - Entry/exit animations with easing specifications
             - Size ratios for different text elements
             - Color and stroke settings for maximum readability
          
          3. Visual effects and filters:
             - Specific effects that are trending on ${platform}
             - Exact settings for blur, grain, glow, etc.
             - Masking and keying techniques
             - Recommended plugins or preset names
          
          4. Transition specifics:
             - Exact duration for each transition type (in frames)
             - Easing curves and motion blur settings
             - Audio sync points for transitions
             - Platform-specific transition techniques
          
          5. Composition guidelines:
             - Specific framing techniques (rule of thirds placements)
             - Safe zones for text to avoid platform UI elements
             - Leading lines and visual hierarchy instructions
             - Depth of field and focusing techniques
          
          Make this guide technically precise for an experienced video editor to implement,
          with exact settings and values that will optimize the video for ${platform}'s algorithm and audience.`
        }],
        temperature: 0.6,
      }),
    });

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('No valid style guide returned from OpenAI:', data);
      return createFallbackStyleGuide(platform);
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating visual style guide:', error);
    return createFallbackStyleGuide(platform);
  }
}

function createFallbackStyleGuide(platform) {
  switch (platform) {
    case 'YouTube':
      return "YouTube Style Guide: High-contrast color grading with vibrant highlights and deep shadows. Use YouTube Sans font for text overlays with bold weight and high contrast drop shadows. Implement smooth transitions lasting 12-15 frames with ease-in-out. Maintain safe margins of 10% from all edges to avoid interface elements. Use punchy sound effects synchronized with visual cuts.";
    
    case 'TikTok':
      return "TikTok Style Guide: High saturation color grade with TikTok's signature blue/pink split toning. Text should use TikTok's default font family with bouncy entrance animations lasting 0.5 seconds. Quick cuts every 1-2 seconds with minimal transition effects. Maintain center focus composition with room for text at top and bottom. Use trending TikTok soundtracks with synced visual effects.";
    
    case 'Instagram':
      return "Instagram Style Guide: Warm, desaturated color grade with lifted blacks for that Instagram aesthetic. Clean sans-serif fonts with subtle entrance animations and generous padding. Smooth transitions between scenes lasting 15-20 frames. Ensure composition allows for key elements to remain visible when interface elements appear. Use subtle film grain overlay for authentic feel.";
    
    case 'Snapchat':
      return "Snapchat Style Guide: Bright, high-contrast color grade with Snapchat's signature filters. Bold, playful typography with quick bounce animations. Ultra-fast cuts with minimal transition effects. Vertical composition that accounts for Snapchat's unique interface elements. Heavy use of Snapchat's native AR effects and sounds for authentic platform feel.";
    
    default:
      return "Default Visual Style: Modern color grading with balanced contrast and slightly increased vibrance. Clean, legible typography with subtle entrance animations. Smooth transitions between scenes with appropriate pacing for content type. Rule of thirds composition with clear visual hierarchy. Professional sound design with synchronized audio cues for transitions.";
  }
}

async function generateVideoMetadata(prompt, platform, videoContent) {
  console.log(`Generating metadata for ${platform}`);
  
  try {
    // Using GPT-4o with enhanced prompt for more effective metadata
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
          content: `You are an expert ${platform} content strategist who specializes in optimizing video metadata for maximum reach and engagement.
          You deeply understand the ${platform} algorithm and create titles, descriptions, and tags that consistently help videos go viral.
          Your thumbnails concepts are known for their high CTR.`
        }, {
          role: 'user',
          content: `Create algorithm-optimized metadata for this ${platform} video: "${prompt}"
          
          Based on this storyboard: ${JSON.stringify(videoContent)}
          
          Return a JSON object with:
          
          1. title (attention-grabbing, optimized for CTR, under 60 characters, using high-performing title patterns for ${platform})
          
          2. description (compelling with researched keywords, include:
             - Hook in first sentence
             - Value proposition
             - Key timestamps if relevant
             - Call to action
             - Relevant keywords naturally incorporated)
          
          3. tags (array of 10-20 relevant hashtags and keywords, including:
             - 3-5 trending hashtags on ${platform} right now
             - 3-5 niche-specific hashtags
             - 5-10 searchable keywords related to the content
             - Include proper # symbol for hashtags based on ${platform} format)
          
          4. thumbnailDescription (detailed description for a high-CTR thumbnail, including:
             - Subject positioning
             - Text overlay suggestions (maximum 3-4 words)
             - Color scheme
             - Facial expression if featuring people
             - Visual elements that create curiosity or emotion)
          
          5. category (most appropriate content category for ${platform})
          
          6. audioTrack (suggested specific track name/style with rationale)
          
          7. duration (in seconds, matches the storyboard, optimized for ${platform} algorithm)
          
          8. resolution (recommended resolution for this ${platform})
          
          9. captionSuggestions (key timestamps and caption text that enhances accessibility and engagement)
          
          10. uploadStrategy (best time to post in GMT, frequency for follow-up content, and recommended content grouping)
          
          Make all elements extremely specific to ${platform}'s current algorithm preferences and cultural trends.`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('No valid metadata returned from OpenAI:', data);
      return createFallbackMetadata(prompt, videoContent, platform);
    }
    
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse metadata JSON:', e);
      console.error('Raw content that failed to parse:', data.choices[0].message.content);
      return createFallbackMetadata(prompt, videoContent, platform);
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
    return createFallbackMetadata(prompt, videoContent, platform);
  }
}

function createFallbackMetadata(prompt, videoContent, platform) {
  // Enhanced fallback metadata with platform-specific customization
  const duration = videoContent.totalDuration || 18;
  const baseTitle = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
  
  // Platform-specific metadata customization
  switch (platform) {
    case 'YouTube':
      return {
        title: `I Tried ${baseTitle} For 24 Hours... SHOCKING RESULTS!`,
        description: `You won't believe what happened when I tried ${prompt}! This changed everything I thought about it.\n\nIn this video, I show you the exact process and results. Make sure to watch until the end for the biggest surprise!\n\n📱 Follow for more amazing content:\nInstagram: @creator\nTikTok: @creator\n\n#youtube #shorts #viral`,
        tags: ["#shorts", "#viral", "#youtube", "#howto", "#tutorial", prompt.replace(/\s+/g, ''), "#trending", "#amazing", "#mustwatch"],
        thumbnailDescription: `Close-up shocked reaction face with text "IT WORKED!" in bold yellow font against red background with arrow pointing to ${prompt} visual`,
        category: "How-to & Style",
        audioTrack: "Trending upbeat track with dramatic sections for reveals",
        duration: duration,
        resolution: "1080x1920 vertical format for Shorts",
        captionSuggestions: "Use auto-generated captions with manual review, emphasize key terms with all-caps",
        uploadStrategy: "Post at 3PM GMT on Sunday for maximum reach, follow up with a 'Part 2' within 48 hours if engagement is high"
      };
      
    case 'TikTok':
      return {
        title: `This ${baseTitle} hack is ILLEGAL😱 #fyp`,
        description: `I can't believe this actually worked! #${prompt.replace(/\s+/g, '')} #tiktokhack #viral #fyp #foryou #foryoupage`,
        tags: ["#fyp", "#foryou", "#foryoupage", "#viral", "#tiktokhack", "#trending", `#${prompt.replace(/\s+/g, '')}`, "#learnontiktok", "#didyouknow"],
        thumbnailDescription: `POV shot with surprised expression, text "WAIT FOR IT" at top in TikTok-style font, vibrant colored overlay`,
        category: "Life Hacks",
        audioTrack: "Current TikTok viral sound with recognizable hook - check For You page for latest trend",
        duration: duration,
        resolution: "1080x1920 vertical with TikTok-safe zones",
        captionSuggestions: "Add manual captions with emoji enhancements for key points, use trending TikTok phrases",
        uploadStrategy: "Post between 9-11PM GMT for night scrollers, create 2-3 follow-up videos answering top comments"
      };
      
    case 'Instagram':
      return {
        title: `Life-changing ${baseTitle} technique ✨ Save this!`,
        description: `I discovered this game-changing approach to ${prompt} and had to share it with you all! 💫\n\nSave this post for when you need it!\n\nDouble tap if this was helpful and tag someone who needs to see this!\n\n#instagram #reels #instadaily #${prompt.replace(/\s+/g, '')}`,
        tags: ["#reels", "#instagram", "#instadaily", "#inspo", "#trending", "#viral", `#${prompt.replace(/\s+/g, '')}`, "#share", "#trending", "#aesthetic"],
        thumbnailDescription: `Aesthetically pleasing composition with soft colors, minimalist layout, subtle text overlay saying "game changer" in elegant font`,
        category: "Lifestyle",
        audioTrack: "Calm acoustic or trending Reels music that's currently featuring in the Explore page",
        duration: duration,
        resolution: "1080x1920 vertical format with Instagram UI consideration",
        captionSuggestions: "Clean, minimal captions with elegant typography, focus on readability with contrasting text box backgrounds",
        uploadStrategy: "Post around 12PM GMT when Instagram browsing peaks, create a carousel post version with more details within 24 hours"
      };
      
    case 'Snapchat':
      return {
        title: `OMG THIS ${baseTitle.toUpperCase()} HACK WORKS!!`,
        description: `YOU HAVE TO TRY THIS RIGHT NOW!! 🔥🔥 #snapchat #spotlight #${prompt.replace(/\s+/g, '')}`,
        tags: ["#spotlight", "#snapchat", "#viral", "#trending", `#${prompt.replace(/\s+/g, '')}`, "#omg", "#needtoknow", "#hack", "#secret"],
        thumbnailDescription: `Extreme close-up reaction face with Snapchat filter, text "SECRET HACK!!" in large bold font with multiple emojis and arrows`,
        category: "Entertainment",
        audioTrack: "High-energy trap beat with voice samples popular on Snapchat Spotlight",
        duration: duration,
        resolution: "1080x1920 vertical format with Snapchat UI safe zones",
        captionSuggestions: "Large, bold captions with emoji enhancements, place at center screen for maximum impact",
        uploadStrategy: "Post between 3-5PM GMT to catch after-school audience, create 3-part series for maximum algorithm boost"
      };
      
    default:
      return {
        title: `Amazing ${baseTitle} You Need to See`,
        description: `Check out this incredible video about ${prompt}. Follow for more amazing content!`,
        tags: ["#trending", "#viral", prompt.replace(/\s+/g, ''), "#amazing", "#mustwatch"],
        thumbnailDescription: `Eye-catching image of ${prompt} with bold text overlay saying "MUST SEE" in contrasting colors`,
        category: "Entertainment",
        audioTrack: "Trending upbeat track",
        duration: duration,
        resolution: "1080x1920",
        captionSuggestions: "Add captions highlighting key points for accessibility and engagement",
        uploadStrategy: "Post during peak hours (7-9PM local time) when engagement is highest"
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
