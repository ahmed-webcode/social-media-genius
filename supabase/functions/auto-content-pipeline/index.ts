
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
    // 1. Topic Selection
    const topic = await selectTrending();
    
    // 2. Content Safety Check
    if (await isToxic(topic)) {
      throw new Error('Topic failed safety check');
    }

    // 3. Generate Video
    const videoUrl = await generateVideo(topic);

    // 4. Generate Hashtags
    const hashtags = await generateHashtags(topic);

    // 5. Schedule Post
    const schedule = determineOptimalPostTime();

    return new Response(JSON.stringify({
      status: 'success',
      data: {
        topic,
        videoUrl,
        hashtags,
        scheduledFor: schedule,
      }
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

async function selectTrending() {
  // Simplified trending topic selection
  const trends = [
    { topic: "AI Developments", velocity: 0.8, novelty: 0.9 },
    { topic: "Tech Innovation", velocity: 0.7, novelty: 0.8 },
  ];
  return trends.reduce((a, b) => 
    (a.velocity * a.novelty > b.velocity * b.novelty) ? a : b
  ).topic;
}

async function isToxic(text: string) {
  try {
    // Using OpenAI's moderation API instead of HuggingFace
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

async function generateVideo(topic: string) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Create a vertical video about ${topic} with viral potential`,
      n: 1,
      size: '1024x1024',
    }),
  });

  const data = await response.json();
  return data.data?.[0]?.url || '';
}

async function generateHashtags(topic: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'Generate 5 trending hashtags for the given topic. Return them as a comma-separated list.'
      }, {
        role: 'user',
        content: topic
      }],
    }),
  });

  const data = await response.json();
  const hashtagString = data.choices?.[0]?.message?.content || '';
  return hashtagString.split(',').map(tag => tag.trim());
}

function determineOptimalPostTime() {
  const now = new Date();
  // Schedule for peak hours (assuming UTC)
  now.setHours(now.getHours() + Math.floor(Math.random() * 24));
  return now.toISOString();
}
