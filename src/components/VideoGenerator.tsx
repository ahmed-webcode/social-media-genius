
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { ScheduledPost } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

const VideoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });

  const { data: scheduledPosts, refetch } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      
      // Transform the database response to match our ScheduledPost type
      return (data || []).map(post => ({
        id: post.id,
        prompt: post.prompt,
        scheduledFor: new Date(post.scheduled_for),
        status: post.status,
        videoUrl: post.video_url,
        platform: post.platform,
        hashtags: post.hashtags,
        performance: post.performance
      })) as ScheduledPost[];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: { prompt }
      });

      if (error || data?.status === 'error') {
        throw new Error(data?.message || error.message);
      }

      // Save the scheduled post
      const { error: insertError } = await supabase
        .from('scheduled_posts')
        .insert({
          prompt,
          scheduled_for: scheduledTime.toISOString(),
          status: 'pending',
          platform: 'TikTok',
          hashtags: [],
          video_url: data.videoUrl
        });

      if (insertError) throw insertError;

      toast.success("Video scheduled successfully!");
      setPrompt("");
      refetch();
    } catch (error: any) {
      toast.error("Failed to generate video: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <CardTitle>Generate Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            placeholder="Enter your video concept..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledTime">Schedule Time</Label>
          <Input
            id="scheduledTime"
            type="datetime-local"
            value={scheduledTime.toISOString().slice(0, 16)}
            onChange={(e) => setScheduledTime(new Date(e.target.value))}
          />
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt}
          className="w-full transition-all duration-300"
        >
          {loading ? "Scheduling..." : "Schedule Video"}
        </Button>

        {scheduledPosts && scheduledPosts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Scheduled Posts</h3>
            <div className="space-y-2">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-2 bg-secondary rounded-md text-sm flex justify-between items-center"
                >
                  <span>{post.prompt}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.scheduledFor).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoGenerator;
