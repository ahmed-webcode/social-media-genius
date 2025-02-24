
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { ScheduledPost } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PLATFORMS = {
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  SNAPCHAT: 'Snapchat'
} as const;

const VideoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['YouTube']);
  const [generateShorts, setGenerateShorts] = useState(true);

  const { data: scheduledPosts, refetch } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      
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
    refetchInterval: 30000
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Generate the main YouTube video
      const { data: youtubeData, error: youtubeError } = await supabase.functions.invoke('generate-video', {
        body: { 
          prompt,
          platform: 'YouTube',
          generateShorts: generateShorts
        }
      });

      if (youtubeError || youtubeData?.status === 'error') {
        throw new Error(youtubeData?.message || youtubeError.message);
      }

      // Create posts for each selected platform
      const posts = selectedPlatforms.map(platform => ({
        prompt,
        scheduled_for: scheduledTime.toISOString(),
        status: 'pending',
        platform,
        hashtags: [],
        video_url: platform === 'YouTube' ? youtubeData.videoUrl : youtubeData.shortsUrl
      }));

      // Save all scheduled posts
      const { error: insertError } = await supabase
        .from('scheduled_posts')
        .insert(posts);

      if (insertError) throw insertError;

      toast.success("Videos scheduled successfully!");
      setPrompt("");
      refetch();
    } catch (error: any) {
      toast.error("Failed to generate videos: " + error.message);
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
          <Label htmlFor="prompt">Video Concept</Label>
          <Input
            id="prompt"
            placeholder="Enter your video concept..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Platforms</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.values(PLATFORMS).map((platform) => (
              <div key={platform} className="flex items-center space-x-2">
                <Checkbox
                  id={platform}
                  checked={selectedPlatforms.includes(platform)}
                  onCheckedChange={(checked) => {
                    setSelectedPlatforms(prev => 
                      checked 
                        ? [...prev, platform]
                        : prev.filter(p => p !== platform)
                    );
                  }}
                />
                <Label htmlFor={platform}>{platform}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="generateShorts"
            checked={generateShorts}
            onCheckedChange={(checked) => setGenerateShorts(!!checked)}
          />
          <Label htmlFor="generateShorts">Generate Shorts Version</Label>
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
          disabled={loading || !prompt || selectedPlatforms.length === 0}
          className="w-full transition-all duration-300"
        >
          {loading ? "Generating..." : "Generate & Schedule Videos"}
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
                  <div className="flex flex-col">
                    <span>{post.prompt}</span>
                    <span className="text-xs text-muted-foreground">{post.platform}</span>
                  </div>
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
