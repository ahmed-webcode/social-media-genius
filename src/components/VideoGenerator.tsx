
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { ScheduledPost } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const PLATFORMS = {
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  SNAPCHAT: 'Snapchat'
} as const;

// GMT+3 timezone offset in milliseconds
const GMT_PLUS_3_OFFSET = 3 * 60 * 60 * 1000;

const VideoGenerator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(() => {
    // Set initial time to GMT+3 (current time + 1 hour)
    const date = new Date();
    date.setTime(date.getTime() + GMT_PLUS_3_OFFSET);
    date.setHours(date.getHours() + 1);
    return date;
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['YouTube']);
  const [generateShorts, setGenerateShorts] = useState(true);

  const { data: scheduledPosts, refetch } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

      // Convert scheduled time to ISO string with proper timezone adjustment
      const adjustedScheduledTime = new Date(scheduledTime.getTime());
      
      // Create posts for each selected platform
      const posts = selectedPlatforms.map(platform => ({
        prompt,
        scheduled_for: adjustedScheduledTime.toISOString(),
        status: 'pending',
        platform,
        hashtags: [],
        video_url: platform === 'YouTube' ? youtubeData.videoUrl : youtubeData.shortsUrl,
        user_id: user.id
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Format date for display with GMT+3 timezone
  const formatDateForDisplay = (date: Date): string => {
    return new Date(date.getTime()).toLocaleString('en-US', {
      timeZone: 'Asia/Baghdad', // Baghdad is in GMT+3
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl">Generate Video</span>
          <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-lg font-medium">Write Your Video Concept</Label>
          <Input
            id="prompt"
            placeholder="Enter an amazing video idea (e.g., '5 mind-blowing AI tools that will change your life')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-20 px-4 py-2 text-lg"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-lg font-medium">Select Platforms</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.values(PLATFORMS).map((platform) => (
              <div key={platform} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-secondary/50 transition-colors">
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
                <Label htmlFor={platform} className="text-base">{platform}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-secondary/50 transition-colors">
          <Checkbox
            id="generateShorts"
            checked={generateShorts}
            onCheckedChange={(checked) => setGenerateShorts(!!checked)}
          />
          <Label htmlFor="generateShorts" className="text-base">Generate Shorts Version</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledTime" className="text-lg font-medium">Schedule Time (GMT+3)</Label>
          <Input
            id="scheduledTime"
            type="datetime-local"
            value={scheduledTime.toISOString().slice(0, 16)}
            onChange={(e) => setScheduledTime(new Date(e.target.value))}
            className="text-base"
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt || selectedPlatforms.length === 0}
          className="w-full py-6 text-lg font-semibold transition-all duration-300 hover:scale-[1.02]"
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
                    {formatDateForDisplay(post.scheduledFor)}
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
