
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ShortsOptionProps = {
  generateShorts: boolean;
  onToggle: (value: boolean) => void;
};

const ShortsOption = ({ generateShorts, onToggle }: ShortsOptionProps) => {
  return (
    <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
      <Checkbox
        id="generateShorts"
        checked={generateShorts}
        onCheckedChange={(checked) => onToggle(!!checked)}
      />
      <div className="flex flex-col">
        <Label htmlFor="generateShorts" className="text-base">Generate Shorts Version</Label>
        <span className="text-xs text-muted-foreground">
          Creates a shorter 8-18 second version optimized for short-form content
        </span>
      </div>
    </div>
  );
};

export default ShortsOption;
