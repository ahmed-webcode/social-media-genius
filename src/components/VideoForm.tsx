
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// GMT+3 timezone offset in milliseconds
const GMT_PLUS_3_OFFSET = 3 * 60 * 60 * 1000;

const PLATFORMS = {
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  SNAPCHAT: 'Snapchat'
} as const;

type VideoFormProps = {
  connectedPlatforms: string[];
  onSuccess: () => void;
};

const VideoForm = ({ connectedPlatforms, onSuccess }: VideoFormProps) => {
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

  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for unconnected platforms that were selected
      const unconnectedPlatforms = selectedPlatforms.filter(
        platform => platform === 'Snapchat' && !connectedPlatforms.includes(platform)
      );
      
      if (unconnectedPlatforms.length > 0) {
        // Show warning for unconnected platforms
        toast.warning(`Some selected platforms are not connected: ${unconnectedPlatforms.join(', ')}. Please connect them first.`);
        throw new Error("Please connect all selected platforms first");
      }

      // Show initial toast
      const generatingToast = toast.loading("Generating videos...");

      // Generate videos for each selected platform
      const generatedVideos = await Promise.all(
        selectedPlatforms.map(async (platform) => {
          // Call the generate-video function for each platform
          const { data, error } = await supabase.functions.invoke('generate-video', {
            body: { 
              prompt,
              platform,
              generateShorts
            }
          });

          if (error || data?.status === 'error') {
            throw new Error(`Failed to generate video for ${platform}: ${data?.message || error.message}`);
          }

          return {
            platform,
            videoUrl: data.videoUrl,
            shortsUrl: data.shortsUrl
          };
        })
      );

      // Dismiss the generating toast
      toast.dismiss(generatingToast);
      
      // Convert scheduled time to ISO string with proper timezone adjustment
      const adjustedScheduledTime = new Date(scheduledTime.getTime());
      
      // Create posts for each platform
      const posts = generatedVideos.map(video => ({
        prompt,
        scheduled_for: adjustedScheduledTime.toISOString(),
        status: 'pending',
        platform: video.platform,
        hashtags: [],
        video_url: video.videoUrl,
        user_id: user.id
      }));

      // Show scheduling toast
      const schedulingToast = toast.loading("Scheduling posts...");

      // Save all scheduled posts
      const { error: insertError } = await supabase
        .from('scheduled_posts')
        .insert(posts);

      if (insertError) throw insertError;

      // Dismiss scheduling toast and show success
      toast.dismiss(schedulingToast);
      toast.success(`Successfully scheduled ${posts.length} videos!`);
      
      // Reset form
      setPrompt("");
      onSuccess();
    } catch (error: any) {
      console.error("Video generation error:", error);
      toast.error("Failed to generate videos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
          {Object.values(PLATFORMS).map((platform) => {
            const isConnected = platform !== 'Snapchat' || connectedPlatforms.includes(platform);
            return (
              <div 
                key={platform} 
                className={`flex items-center space-x-2 p-2 border rounded-md hover:bg-secondary/50 transition-colors ${!isConnected ? 'border-orange-400' : ''}`}
              >
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
                <div className="flex flex-col">
                  <Label htmlFor={platform} className="text-base">{platform}</Label>
                  {!isConnected && (
                    <span className="text-xs text-orange-500">Not connected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!connectedPlatforms.includes('Snapchat') && (
          <p className="text-xs text-orange-500 mt-1">
            To post to Snapchat, please connect your account in the "Connected Accounts" section first.
          </p>
        )}
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
    </div>
  );
};

export default VideoForm;
