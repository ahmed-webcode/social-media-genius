
import { useCallback, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Play } from "lucide-react";
import { toast } from "sonner";
import type { ScheduledPost } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate a real video preview with animated scenes based on metadata
  const generateRealVideo = useCallback(async (post: ScheduledPost) => {
    try {
      // Show loading toast
      const generatingToast = toast.loading(`Creating ${post.platform} video preview...`);
      
      // Create a temporary canvas for video frames if it doesn't exist
      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = post.platform === 'YouTube' ? 1280 : 720;
        canvas.height = post.platform === 'YouTube' ? 720 : 1280;
        canvasRef.current = canvas;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not create canvas context");
      
      // Determine video dimensions and orientation based on platform
      const isPortrait = post.platform === 'TikTok' || post.platform === 'Instagram';
      canvas.width = isPortrait ? 720 : 1280;
      canvas.height = isPortrait ? 1280 : 720;
      
      // Set platform-specific colors and styles
      let brandColors = {
        primary: '#FF0000',
        secondary: '#282828',
        text: '#FFFFFF'
      };
      
      if (post.platform === 'TikTok') {
        brandColors = {
          primary: '#00f2ea',
          secondary: '#ff0050',
          text: '#FFFFFF'
        };
      } else if (post.platform === 'Instagram') {
        brandColors = {
          primary: '#833AB4',
          secondary: '#FD1D1D',
          text: '#FFFFFF'
        };
      } else if (post.platform === 'Snapchat') {
        brandColors = {
          primary: '#FFFC00',
          secondary: '#000000',
          text: '#000000'
        };
      }
      
      // Set font sizes based on canvas dimensions
      const titleFontSize = Math.floor(canvas.width * 0.05);
      const textFontSize = Math.floor(canvas.width * 0.035);
      const smallTextFontSize = Math.floor(canvas.width * 0.025);
      
      // Get metadata (when available) or generate scene content
      const metadata = post.metadata || {
        title: post.prompt,
        scenes: Array(5).fill(0).map((_, i) => ({
          sceneId: i + 1,
          duration: 3,
          script: i === 0 ? `Intro: ${post.prompt}` : i === 4 ? `Thanks for watching!` : `Key point #${i} about ${post.prompt}`,
          visualDescription: `Scene ${i + 1} for ${post.prompt}`,
          transition: 'fade'
        })),
        totalDuration: 15,
        style: post.platform.toLowerCase()
      };
      
      // Create a MediaStream from canvas
      const stream = canvas.captureStream(30); // 30fps
      const recorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      return new Promise<string>((resolve, reject) => {
        recorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(videoBlob);
          toast.dismiss(generatingToast);
          toast.success(`${post.platform} video preview ready!`);
          resolve(videoUrl);
        };
        
        // Start recording
        recorder.start();
        
        // Animation frames counter and timing
        let frameCount = 0;
        const fps = 30;
        const totalFrames = metadata.totalDuration * fps;
        let currentScene = 0;
        let sceneStartFrame = 0;
        let sceneDuration = metadata.scenes[0].duration * fps;
        
        // Create animation frames
        const animate = () => {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Calculate current position in animation
          const currentSceneObj = metadata.scenes[currentScene];
          const sceneProgress = (frameCount - sceneStartFrame) / sceneDuration;
          
          // Check if we need to move to next scene
          if (frameCount - sceneStartFrame >= sceneDuration && currentScene < metadata.scenes.length - 1) {
            currentScene++;
            sceneStartFrame = frameCount;
            sceneDuration = metadata.scenes[currentScene].duration * fps;
          }
          
          // Draw background based on platform and scene
          drawSceneBackground(ctx, canvas, currentScene, sceneProgress, brandColors);
          
          // Draw platform logo 
          drawPlatformLogo(ctx, canvas, post.platform, brandColors);
          
          // Draw current scene content
          drawSceneContent(ctx, canvas, currentSceneObj, sceneProgress, {
            titleFont: `bold ${titleFontSize}px Arial`,
            textFont: `${textFontSize}px Arial`,
            smallTextFont: `${smallTextFontSize}px Arial`,
            colors: brandColors
          });
          
          // Add progress indicator
          drawProgressBar(ctx, canvas, frameCount / totalFrames, brandColors);
          
          // Continue animation or stop recording
          frameCount++;
          if (frameCount < totalFrames) {
            requestAnimationFrame(animate);
          } else {
            recorder.stop();
          }
        };
        
        // Start animation
        animate();
      });
    } catch (error: any) {
      console.error("Video generation error:", error);
      toast.error(`Failed to generate video: ${error.message}`);
      return null;
    }
  }, []);
  
  // Draw background for a scene
  const drawSceneBackground = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    sceneIndex: number,
    progress: number,
    colors: {primary: string, secondary: string, text: string}
  ) => {
    // Create different backgrounds for different scenes
    switch (sceneIndex % 4) {
      case 0: // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
        
      case 1: // Animated particles background
        ctx.fillStyle = colors.secondary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw animated particles
        for (let i = 0; i < 50; i++) {
          const x = Math.sin(progress * 2 + i) * canvas.width/4 + canvas.width/2;
          const y = Math.cos(progress * 3 + i) * canvas.height/4 + canvas.height/2;
          const size = 5 + Math.sin(progress * 5 + i) * 5;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = colors.primary + '80'; // Add transparency
          ctx.fill();
        }
        break;
        
      case 2: // Geometric pattern
        ctx.fillStyle = colors.secondary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw geometric shapes
        const shapeCount = 12;
        for (let i = 0; i < shapeCount; i++) {
          const x = (i % 4) * (canvas.width / 4);
          const y = Math.floor(i / 4) * (canvas.height / 3);
          const width = canvas.width / 4;
          const height = canvas.height / 3;
          
          ctx.beginPath();
          if (i % 3 === 0) {
            // Draw rectangle
            ctx.rect(x, y, width, height);
          } else if (i % 3 === 1) {
            // Draw circle
            ctx.arc(x + width/2, y + height/2, Math.min(width, height) / 2, 0, Math.PI * 2);
          } else {
            // Draw triangle
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + width, y + height);
            ctx.closePath();
          }
          
          // Animate fill color
          const hue = (i * 30 + progress * 100) % 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.4)`;
          ctx.fill();
        }
        break;
        
      case 3: // Radial gradient with pulsing effect
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const minDimension = Math.min(canvas.width, canvas.height);
        const pulseSize = 0.5 + Math.sin(progress * Math.PI * 2) * 0.2;
        
        const radialGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, minDimension * pulseSize
        );
        
        radialGradient.addColorStop(0, colors.primary);
        radialGradient.addColorStop(0.7, colors.secondary);
        radialGradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = radialGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
    }
  };
  
  // Draw platform logo
  const drawPlatformLogo = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    platform: string,
    colors: {primary: string, secondary: string, text: string}
  ) => {
    const padding = canvas.width * 0.02;
    const logoSize = canvas.width * 0.05;
    
    ctx.save();
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${logoSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    if (platform === 'YouTube') {
      // YouTube play button
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(padding, padding, logoSize * 1.6, logoSize);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(padding + logoSize * 0.6, padding + logoSize * 0.3);
      ctx.lineTo(padding + logoSize * 0.6, padding + logoSize * 0.7);
      ctx.lineTo(padding + logoSize * 1.1, padding + logoSize * 0.5);
      ctx.closePath();
      ctx.fill();
    } else if (platform === 'TikTok') {
      // TikTok logo (simplified)
      ctx.fillStyle = '#000000';
      ctx.fillText("TikTok", padding, padding);
      
      // Note overlay
      ctx.fillStyle = '#00f2ea';
      ctx.fillRect(padding + logoSize * 0.8, padding, logoSize * 0.3, logoSize * 0.3);
      
      ctx.fillStyle = '#ff0050';
      ctx.fillRect(padding + logoSize * 1.2, padding, logoSize * 0.3, logoSize * 0.3);
    } else if (platform === 'Instagram') {
      // Instagram camera icon (simplified)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(padding, padding, logoSize, logoSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(padding + logoSize/2, padding + logoSize/2, logoSize/3, 0, Math.PI * 2);
      ctx.stroke();
      
      // Camera flash
      ctx.beginPath();
      ctx.arc(padding + logoSize * 0.8, padding + logoSize * 0.2, logoSize/10, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    } else if (platform === 'Snapchat') {
      // Snapchat ghost (simplified)
      ctx.fillStyle = '#FFFC00';
      ctx.beginPath();
      
      // Ghost body
      ctx.ellipse(
        padding + logoSize/2,
        padding + logoSize/2,
        logoSize/2, 
        logoSize/2, 
        0, 0, Math.PI * 2
      );
      ctx.fill();
      
      // Ghost face
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(
        padding + logoSize/3,
        padding + logoSize/2,
        logoSize/6, 
        logoSize/6, 
        0, 0, Math.PI * 2
      );
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(
        padding + logoSize*2/3,
        padding + logoSize/2,
        logoSize/6, 
        logoSize/6, 
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  // Draw scene content
  const drawSceneContent = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    sceneObj: any,
    progress: number,
    styles: {
      titleFont: string,
      textFont: string,
      smallTextFont: string,
      colors: {primary: string, secondary: string, text: string}
    }
  ) => {
    const { titleFont, textFont, smallTextFont, colors } = styles;
    
    // Apply different animation based on scene position
    const animationOffset = Math.sin(progress * Math.PI) * 20;
    
    ctx.save();
    
    // Draw title with entrance animation
    ctx.font = titleFont;
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const titleY = canvas.height * 0.2 + (progress < 0.3 ? (0.3 - progress) * 100 : 0);
    
    // Apply text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw title with word-by-word animation
    const titleWords = sceneObj.script.split(' ');
    let titleX = canvas.width / 2 - (titleWords.length - 1) * 15;
    
    titleWords.forEach((word: string, i: number) => {
      const wordDelay = i * 0.1;
      const wordProgress = Math.min(1, Math.max(0, (progress - wordDelay) * 5));
      
      if (wordProgress > 0) {
        ctx.globalAlpha = wordProgress;
        ctx.fillText(word, titleX, titleY + Math.sin(progress * 5 + i) * 5);
      }
      
      titleX += ctx.measureText(word + ' ').width;
    });
    
    ctx.globalAlpha = 1;
    
    // Draw scene description with fade in animation
    if (progress > 0.3) {
      const descriptionAlpha = Math.min(1, (progress - 0.3) * 3);
      ctx.globalAlpha = descriptionAlpha;
      
      ctx.font = textFont;
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      
      // Wrap text to fit canvas
      const maxWidth = canvas.width * 0.8;
      const visualDesc = sceneObj.visualDescription || `Scene ${sceneObj.sceneId}`;
      const wrappedText = wrapText(ctx, visualDesc, maxWidth);
      
      let lineY = canvas.height * 0.5;
      wrappedText.forEach((line: string) => {
        ctx.fillText(line, canvas.width / 2, lineY + animationOffset);
        lineY += parseInt(textFont) * 1.2;
      });
    }
    
    // Draw call to action for last scene
    if (sceneObj.sceneId === 5 || sceneObj.script.includes("Thanks")) {
      const ctaAlpha = Math.min(1, progress * 2);
      ctx.globalAlpha = ctaAlpha;
      
      ctx.font = titleFont;
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      
      const ctaY = canvas.height * 0.7;
      ctx.fillText("Like & Follow!", canvas.width / 2, ctaY - animationOffset);
    }
    
    // Draw scene number indicator
    ctx.font = smallTextFont;
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = 0.7;
    
    ctx.fillText(
      `Scene ${sceneObj.sceneId}`,
      canvas.width - 20,
      canvas.height - 20
    );
    
    ctx.restore();
  };
  
  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  };
  
  // Draw progress bar
  const drawProgressBar = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    progress: number,
    colors: {primary: string, secondary: string, text: string}
  ) => {
    const barHeight = 6;
    const barY = canvas.height - barHeight * 2;
    const barWidth = canvas.width - 40;
    
    // Background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(20, barY, barWidth, barHeight);
    
    // Progress indicator
    ctx.fillStyle = colors.primary;
    ctx.fillRect(20, barY, barWidth * progress, barHeight);
    
    // Animated dot on progress bar
    const dotSize = 10;
    const dotX = 20 + barWidth * progress;
    
    ctx.beginPath();
    ctx.arc(dotX, barY + barHeight / 2, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  };

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
  }, [generateRealVideo]);

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
  }, [generateRealVideo]);

  useEffect(() => {
    // Clean up video URLs on unmount
    return () => {
      if (previewVideo.url) {
        URL.revokeObjectURL(previewVideo.url);
      }
    };
  }, [previewVideo.url]);

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
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handlePreviewVideo(post)}
                title="Preview Video"
                className="h-8 w-8 p-0"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleDownloadVideo(post)}
                title="Download Video"
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Preview Dialog */}
      <Dialog
        open={previewVideo.open}
        onOpenChange={(open) => setPreviewVideo(prev => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewVideo.title}</DialogTitle>
          </DialogHeader>
          {previewVideo.url && (
            <div className="relative aspect-video">
              <video 
                src={previewVideo.url} 
                controls 
                autoPlay 
                className={`w-full h-full ${previewVideo.platform === 'YouTube' ? 'aspect-video' : 'aspect-[9/16] mx-auto'}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduledVideosList;
