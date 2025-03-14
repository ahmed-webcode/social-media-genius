
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VideoPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
  platform: string;
};

const VideoPreviewDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  url, 
  platform 
}: VideoPreviewDialogProps) => {
  if (!url) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video">
          <video 
            src={url} 
            controls 
            autoPlay 
            className={`w-full h-full ${platform === 'YouTube' ? 'aspect-video' : 'aspect-[9/16] mx-auto'}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPreviewDialog;
