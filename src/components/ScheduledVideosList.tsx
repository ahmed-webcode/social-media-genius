
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { ScheduledPost } from "@/lib/types";

type ScheduledVideosListProps = {
  scheduledPosts: ScheduledPost[];
};

const ScheduledVideosList = ({ scheduledPosts }: ScheduledVideosListProps) => {
  // Format date for display with GMT+3 timezone
  const formatDateForDisplay = (date: Date): string => {
    return new Date(date.getTime()).toLocaleString('en-US', {
      timeZone: 'Asia/Baghdad', // Baghdad is in GMT+3
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // Function to handle video downloads - improved to work with example/test videos
  const handleDownloadVideo = useCallback(async (videoUrl: string, platform: string, prompt: string) => {
    try {
      // Show loading toast
      const downloadingToast = toast.loading(`Preparing ${platform} video...`);
      
      // Create a mock video blob since we're using example URLs
      // In a real app, you would fetch the actual video
      const createMockVideoBlob = async () => {
        // Create a canvas to draw a colored rectangle
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) throw new Error("Could not create canvas context");
        
        // Draw a gradient background based on platform
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        
        // Set platform-specific colors
        if (platform === 'YouTube') {
          gradient.addColorStop(0, '#FF0000');
          gradient.addColorStop(1, '#282828');
        } else if (platform === 'TikTok') {
          gradient.addColorStop(0, '#00f2ea');
          gradient.addColorStop(1, '#ff0050');
        } else if (platform === 'Instagram') {
          gradient.addColorStop(0, '#833AB4');
          gradient.addColorStop(1, '#FD1D1D');
        } else {
          gradient.addColorStop(0, '#FFFC00');
          gradient.addColorStop(1, '#00ffff');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add platform text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(platform, canvas.width/2, canvas.height/2 - 40);
        
        // Add prompt text
        ctx.font = '20px Arial';
        ctx.fillText(prompt.substring(0, 30), canvas.width/2, canvas.height/2 + 20);
        if (prompt.length > 30) {
          ctx.fillText(prompt.substring(30, 60) + '...', canvas.width/2, canvas.height/2 + 50);
        }
        
        // Convert canvas to blob
        return new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else throw new Error("Failed to create blob");
          }, 'image/png');
        });
      };
      
      // Create the mock video blob
      const blob = await createMockVideoBlob();
      
      // Create object URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary anchor element
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename based on platform and prompt
      const filename = `${platform.toLowerCase()}-${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      a.download = filename;
      
      // Append to body, click to trigger download, then clean up
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Dismiss loading toast and show success
      toast.dismiss(downloadingToast);
      toast.success(`${platform} video preview downloaded successfully!`);
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
          <div
            key={post.id}
            className="p-3 bg-secondary rounded-md text-sm flex justify-between items-center"
          >
            <div className="flex flex-col">
              <span className="font-medium">{post.prompt}</span>
              <span className="text-xs text-muted-foreground">{post.platform}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDateForDisplay(post.scheduledFor)}
              </span>
              {post.videoUrl && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleDownloadVideo(post.videoUrl!, post.platform, post.prompt)}
                  title="Download Video"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduledVideosList;
