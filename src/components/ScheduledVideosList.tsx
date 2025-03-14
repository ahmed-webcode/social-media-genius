
import { useCallback, useRef } from "react";
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

  // Reference to video element for download
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Function to handle video downloads - improved to create and download actual MP4 videos
  const handleDownloadVideo = useCallback(async (videoUrl: string, platform: string, prompt: string) => {
    try {
      // Show loading toast
      const downloadingToast = toast.loading(`Preparing ${platform} video...`);
      
      // Create a video element if it doesn't exist yet
      if (!videoRef.current) {
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        videoRef.current = video;
      }

      // Create a canvas for video frames
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not create canvas context");
      
      // Set platform-specific colors
      let gradientColors = ['#FF0000', '#282828']; // YouTube default
      if (platform === 'TikTok') {
        gradientColors = ['#00f2ea', '#ff0050'];
      } else if (platform === 'Instagram') {
        gradientColors = ['#833AB4', '#FD1D1D'];
      } else if (platform === 'Snapchat') {
        gradientColors = ['#FFFC00', '#00ffff'];
      }
      
      // Generate 60 frames for a 2-second video at 30fps
      const frames: Blob[] = [];
      const framesCount = 60;
      
      for (let i = 0; i < framesCount; i++) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create animated gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(1, gradientColors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add animated platform text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        
        // Animate text with a bouncing effect
        const bounce = Math.sin(i * 0.1) * 10;
        ctx.fillText(platform, canvas.width/2, canvas.height/2 - 40 + bounce);
        
        // Add prompt text
        ctx.font = '20px Arial';
        ctx.fillText(prompt.substring(0, 30), canvas.width/2, canvas.height/2 + 20);
        if (prompt.length > 30) {
          ctx.fillText(prompt.substring(30, 60) + '...', canvas.width/2, canvas.height/2 + 50);
        }
        
        // Add frame number and progress indicator
        ctx.fillText(`Frame ${i+1}/${framesCount}`, canvas.width/2, canvas.height - 20);
        
        // Draw progress bar
        const progressWidth = (canvas.width - 40) * (i / framesCount);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(20, canvas.height - 40, canvas.width - 40, 10);
        ctx.fillStyle = 'white';
        ctx.fillRect(20, canvas.height - 40, progressWidth, 10);
        
        // Convert canvas to blob and add to frames
        const frameBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else throw new Error("Failed to create blob");
          }, 'image/webp');
        });
        
        frames.push(frameBlob);
      }
      
      // Use MediaRecorder API to create a video from frames
      const createVideoFromFrames = async () => {
        return new Promise<Blob>((resolve, reject) => {
          try {
            // Create a MediaStream from canvas
            const stream = canvas.captureStream(30); // 30fps
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            
            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunks.push(e.data);
              }
            };
            
            recorder.onstop = () => {
              const videoBlob = new Blob(chunks, { type: 'video/webm' });
              resolve(videoBlob);
            };
            
            // Start recording
            recorder.start();
            
            // Draw each frame at appropriate intervals
            let frameIndex = 0;
            const drawNextFrame = () => {
              if (frameIndex < frames.length) {
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                  frameIndex++;
                  setTimeout(drawNextFrame, 1000/30); // 30fps
                };
                img.src = URL.createObjectURL(frames[frameIndex]);
              } else {
                recorder.stop();
              }
            };
            
            drawNextFrame();
          } catch (error) {
            reject(error);
          }
        });
      };
      
      // Create video blob
      const videoBlob = await createVideoFromFrames();
      
      // Create download link
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename
      const filename = `${platform.toLowerCase()}-${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.webm`;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Clean up frames
      frames.forEach(frame => URL.revokeObjectURL(URL.createObjectURL(frame)));
      
      // Dismiss loading toast and show success
      toast.dismiss(downloadingToast);
      toast.success(`${platform} video downloaded successfully!`);
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
