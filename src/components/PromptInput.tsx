
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type PromptInputProps = {
  prompt: string;
  onChange: (value: string) => void;
};

const PromptInput = ({ prompt, onChange }: PromptInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt" className="text-lg font-medium">Write Your Video Concept</Label>
      <Textarea
        id="prompt"
        placeholder="Enter a detailed video idea (e.g., 'Create a tutorial showing 5 mind-blowing AI tools that will boost productivity for remote workers. Include demos of each tool and explain their key benefits.')"
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        className="h-32 px-4 py-2 text-lg resize-none"
      />
      <p className="text-xs text-muted-foreground">
        For best results, be specific and detailed in your prompt (10-150 characters). Include what you want to show, key points, and the desired emotional tone.
      </p>
    </div>
  );
};

export default PromptInput;
