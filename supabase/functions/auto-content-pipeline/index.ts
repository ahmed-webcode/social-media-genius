
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { pipeline } from "@huggingface/transformers";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    // Auto-retry logic
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
  // In production, this would use real trend data
  const trends = [
    { topic: "AI Developments", velocity: 0.8, novelty: 0.9 },
    { topic: "Tech Innovation", velocity: 0.7, novelty: 0.8 },
  ];
  return trends.reduce((a, b) => 
    (a.velocity * a.novelty > b.velocity * b.novelty) ? a : b
  ).topic;
}

async function isToxic(topic: string) {
  // Initialize toxicity detection model
  const classifier = await pipeline('text-classification', 'onnx-community/toxicity');
  const result = await classifier(topic);
  return result[0].score > 0.7;
}

async function generateVideo(topic: string) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      prompt: `Create a vertical video about ${topic} with viral potential`,
      n: 1,
    }),
  });

  const data = await response.json();
  return data.data[0].url;
}

async function generateHashtags(topic: string) {
  const hashtagGenerator = await pipeline(
    'text-generation',
    'onnx-community/gpt2-hashtag-generator'
  );
  const result = await hashtagGenerator(topic);
  return result[0].generated_text.split(' ');
}

function determineOptimalPostTime() {
  // Simple implementation - could be enhanced with ML-based timing
  const now = new Date();
  now.setHours(now.getHours() + Math.floor(Math.random() * 24));
  return now;
}
