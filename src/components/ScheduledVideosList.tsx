
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ScheduledPost } from "@/lib/types";
import ScheduledPostItem from "./ScheduledPostItem";
import VideoPreviewDialog from "./VideoPreviewDialog";
import { generateRealVideo } from "@/utils/videoUtils";

type ScheduledVideosListProps = {
  scheduledPosts: ScheduledPost[];
};

const ScheduledVideosList = ({ scheduledPosts }: ScheduledVideosListProps) => {
  const [previewVideo, setPreviewVideo] = useState<{
    url: string;
    title: string;
    open: boolean;
    platform: string;
  }>({
    url: "",
    title: "",
    open: false,
    platform: "",
  });

  // Function to handle video generation and preview
  const handlePreviewVideo = useCallback(async (post: ScheduledPost) => {
    // Generate the video and get its URL
    const videoUrl = await generateRealVideo(post);
    
    if (videoUrl) {
      setPreviewVideo({
        url: videoUrl,
        title: post.prompt,
        platform: post.platform,
        open: true
      });
    }
  }, []);

  // Function to handle video downloads
  const handleDownloadVideo = useCallback(async (post: ScheduledPost) => {
    try {
      // Show loading toast
      const downloadingToast = toast.loading(`Preparing ${post.platform} video for download...`);
      
      // Generate the video first
      const videoUrl = await generateRealVideo(post);
      
      if (!videoUrl) {
        toast.dismiss(downloadingToast);
        toast.error("Failed to generate video for download");
        return;
      }
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = videoUrl;
      
      // Generate filename
      const safePrompt = post.prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `${post.platform.toLowerCase()}-${safePrompt}.webm`;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(videoUrl);
        document.body.removeChild(a);
      }, 100);
      
      // Dismiss loading toast and show success
      toast.dismiss(downloadingToast);
      toast.success(`${post.platform} video downloaded successfully!`);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(`Failed to download video: ${error.message}`);
    }
  }, []);

  if (!scheduledPosts || scheduledPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-2">Scheduled Posts</h3>
      <div className="space-y-2">
        {scheduledPosts.map((post) => (
          <ScheduledPostItem
            key={post.id}
            post={post}
            onPreview={handlePreviewVideo}
            onDownload={handleDownloadVideo}
          />
        ))}
      </div>

      {/* Video Preview Dialog */}
      <VideoPreviewDialog
        open={previewVideo.open}
        onOpenChange={(open) => setPreviewVideo(prev => ({ ...prev, open }))}
        title={previewVideo.title}
        url={previewVideo.url}
        platform={previewVideo.platform}
      />
    </div>
  );
};

export default ScheduledVideosList;
