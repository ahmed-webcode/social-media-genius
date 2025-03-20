
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PromptInput from "./PromptInput";
import PlatformSelector from "./PlatformSelector";
import ShortsOption from "./ShortsOption";
import ScheduleInput from "./ScheduleInput";

// GMT+3 timezone offset in milliseconds
const GMT_PLUS_3_OFFSET = 3 * 60 * 60 * 1000;

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
    if (prompt.length < 10) {
      toast.warning("Please enter a more detailed prompt for better results");
      return;
    }
    
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
      const generatingToast = toast.loading("Generating high-quality videos with invideo.io...");

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
            shortsUrl: data.shortsUrl,
            metadata: data.metadata
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
        hashtags: video.metadata?.tags || [],
        video_url: video.videoUrl,
        shorts_url: video.shortsUrl,
        metadata: video.metadata,
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
      toast.success(`Successfully scheduled ${posts.length} videos with invideo.io!`);
      
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
      <PromptInput 
        prompt={prompt}
        onChange={setPrompt}
      />
      
      <PlatformSelector
        connectedPlatforms={connectedPlatforms}
        selectedPlatforms={selectedPlatforms}
        onPlatformChange={setSelectedPlatforms}
      />

      <ShortsOption
        generateShorts={generateShorts}
        onToggle={setGenerateShorts}
      />

      <ScheduleInput
        scheduledTime={scheduledTime}
        onChange={setScheduledTime}
      />

      <Button 
        onClick={handleGenerate} 
        disabled={loading || !prompt || selectedPlatforms.length === 0}
        className="w-full py-6 text-lg font-semibold transition-all duration-300 hover:scale-[1.02]"
      >
        {loading ? "Generating Videos with invideo.io..." : "Generate & Schedule Videos"}
      </Button>
    </div>
  );
};

export default VideoForm;
