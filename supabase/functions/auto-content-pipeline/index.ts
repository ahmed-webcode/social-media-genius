
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

      // Generate optimized content
      const videoPrompt = await createViralVideoPrompt(topic);
      const videoUrl = await generateVideo(videoPrompt);
      const hashtags = await generateViralHashtags(topic);
      const schedule = determineOptimalPostTime();

      results.push({
        topic,
        videoUrl,
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
        content: `Create a viral video concept for: ${topic}. Include elements known to drive engagement like:
          - Eye-catching opening scenes
          - Emotional hooks
          - Strong visual storytelling
          - Call-to-action elements`
      }],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
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

async function generateVideo(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    }),
  });

  const data = await response.json();
  return data.data?.[0]?.url || '';
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
        content: `Generate 10 trending and viral-optimized hashtags for: ${topic}. Include:
          - Trending hashtags
          - Niche-specific tags
          - High-volume tags
          - Engagement-focused tags`
      }],
    }),
  });

  const data = await response.json();
  const hashtagString = data.choices[0].message.content;
  return hashtagString.split(',').map(tag => tag.trim());
}

function determineOptimalPostTime() {
  const now = new Date();
  // Targeting peak engagement hours (12pm-8pm in major time zones)
  const peakHours = [12, 13, 14, 15, 16, 17, 18, 19, 20];
  const randomPeakHour = peakHours[Math.floor(Math.random() * peakHours.length)];
  now.setHours(randomPeakHour);
  return now.toISOString();
}
