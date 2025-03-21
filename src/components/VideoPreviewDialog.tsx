
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface VideoPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string | null;
  title: string;
}

const VideoPreviewDialog = ({ 
  open, 
  onOpenChange, 
  videoUrl, 
  title 
}: VideoPreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden rounded-md">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No video available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPreviewDialog;
