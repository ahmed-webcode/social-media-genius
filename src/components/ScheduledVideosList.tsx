
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ScheduledPost } from "@/lib/types";
import ScheduledPostItem from "./ScheduledPostItem";
import VideoPreviewDialog from "./VideoPreviewDialog";
import { generateRealVideo } from "@/utils/videoUtils";

type ScheduledVideosListProps = {
  scheduledPosts: ScheduledPost[];
  onPostDeleted?: () => void;
};

const ScheduledVideosList = ({ scheduledPosts, onPostDeleted }: ScheduledVideosListProps) => {
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
    try {
      // Show loading toast
      const generatingToast = toast.loading(`Generating ${post.platform} video preview...`);
      
      // Generate the video and get its URL
      const videoUrl = await generateRealVideo(post);
      
      toast.dismiss(generatingToast);
      
      if (videoUrl) {
        setPreviewVideo({
          url: videoUrl,
          title: post.prompt,
          platform: post.platform,
          open: true
        });
      } else {
        throw new Error("Failed to generate video preview");
      }
    } catch (error: any) {
      console.error("Error generating video preview:", error);
      toast.error(`Failed to generate preview: ${error.message}`);
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

  // Function to handle post deletion
  const handleDeletePost = useCallback(async (post: ScheduledPost) => {
    try {
      const deletingToast = toast.loading(`Deleting ${post.platform} post...`);
      
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', post.id);
      
      if (error) throw error;
      
      toast.dismiss(deletingToast);
      toast.success(`Post deleted successfully`);
      
      // Call the onPostDeleted callback to refresh the list
      if (onPostDeleted) onPostDeleted();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete post: ${error.message}`);
    }
  }, [onPostDeleted]);

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
            onDelete={handleDeletePost}
          />
        ))}
      </div>

      {/* Video Preview Dialog */}
      <VideoPreviewDialog
        open={previewVideo.open}
        onOpenChange={(open) => setPreviewVideo(prev => ({ ...prev, open }))}
        title={previewVideo.title}
        videoUrl={previewVideo.url}
        platform={previewVideo.platform}
      />
    </div>
  );
};

export default ScheduledVideosList;
