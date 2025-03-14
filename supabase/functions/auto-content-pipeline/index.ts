
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate 3 viral topics for multiple daily posts
    const topics = await generateViralTopics();
    const results = [];

    for (const topic of topics) {
      // Validate topic safety
      if (await isToxic(topic)) {
        console.log(`Topic "${topic}" failed safety check, skipping...`);
        continue;
      }

      // Generate enhanced content structure
      const videoPrompt = await createViralVideoPrompt(topic);
      const videoContent = await generateVideoContent(topic, videoPrompt);
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

async function generateViralTopics() {
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
          Return only the topics as a comma-separated list.`
      }],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.split(',').map(topic => topic.trim());
}

async function createViralVideoPrompt(topic: string) {
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
        content: 'Create a detailed video prompt that will generate viral-worthy visuals.'
      }, {
        role: 'user',
        content: `Create a viral video concept for: ${topic}. Include:
          - A powerful hook that captures attention in the first 3 seconds
          - A clear narrative structure with 5-7 scenes (10-30 seconds total)
          - Eye-catching visual elements and transitions
          - Emotional triggers (surprise, curiosity, humor, or inspiration)
          - Call-to-action elements that encourage engagement
          Make it platform-agnostic so it works across YouTube, TikTok, Instagram, etc.`
      }],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateVideoContent(topic: string, videoPrompt: string) {
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
        content: 'Generate a structured video content plan with detailed scenes.'
      }, {
        role: 'user',
        content: `Create a detailed storyboard for a 10-30 second viral video about: "${topic}"
        
        Based on this video prompt: "${videoPrompt}"
        
        Structure the response as a JSON object with:
        1. An array of 5-7 scenes, each containing:
           - sceneId (number)
           - duration (in seconds, between 2-6 seconds)
           - script (exact text that would be spoken/shown)
           - visualDescription (what's shown visually)
           - transition (how it transitions to the next scene)
        2. totalDuration (sum of all scene durations)
        3. musicTrack (suggested background music style)
        4. voiceoverTone (energetic, calm, authoritative, etc.)
        5. visualStyle (minimalist, colorful, dramatic, etc.)
        
        The scenes should follow a clear narrative structure with a hook, main points, and call to action.`
      }],
    }),
  });

  const data = await response.json();
  let videoContent;
  
  try {
    // Try to parse as JSON first
    videoContent = JSON.parse(data.choices[0].message.content);
  } catch (e) {
    // If parsing fails, use the text as-is
    videoContent = {
      scenes: [
        {
          sceneId: 1,
          duration: 3,
          script: `Introducing: ${topic}`,
          visualDescription: `Opening title screen for ${topic}`,
          transition: "fade"
        },
        {
          sceneId: 2,
          duration: 5,
          script: `Here's what you need to know about ${topic}`,
          visualDescription: `Main content display for ${topic}`,
          transition: "slide"
        },
        {
          sceneId: 3,
          duration: 3,
          script: `Subscribe for more!`,
          visualDescription: `Call to action screen`,
          transition: "fade"
        }
      ],
      totalDuration: 11,
      musicTrack: "upbeat",
      voiceoverTone: "energetic",
      visualStyle: "modern"
    };
  }
  
  return videoContent;
}

async function isToxic(text: string) {
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

async function generateViralHashtags(topic: string) {
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
