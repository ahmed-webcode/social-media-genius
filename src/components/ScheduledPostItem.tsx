
import { Button } from "@/components/ui/button";
import { Download, Play } from "lucide-react";
import type { ScheduledPost } from "@/lib/types";
import { formatDateForDisplay } from "@/utils/videoUtils";

type ScheduledPostItemProps = {
  post: ScheduledPost;
  onPreview: (post: ScheduledPost) => void;
  onDownload: (post: ScheduledPost) => void;
};

const ScheduledPostItem = ({ post, onPreview, onDownload }: ScheduledPostItemProps) => {
  return (
    <div
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
          onClick={() => onPreview(post)}
          title="Preview Video"
          className="h-8 w-8 p-0"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onDownload(post)}
          title="Download Video"
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ScheduledPostItem;
