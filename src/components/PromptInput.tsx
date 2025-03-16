
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type PromptInputProps = {
  prompt: string;
  onChange: (value: string) => void;
};

const PromptInput = ({ prompt, onChange }: PromptInputProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const examples = [
    "Create a tutorial showing 5 mind-blowing AI tools that boost productivity for remote workers with dramatic visual transitions.",
    "Make a cinematic travel vlog of exploring hidden beaches with drone shots and vibrant color grading.",
    "Show a high-energy product review of the latest tech gadget with dynamic camera movements and bold text overlays.",
    "Design a fast-paced cooking tutorial for a 5-minute meal with creative transitions and upbeat music."
  ];

  const handleSelectExample = (example: string) => {
    onChange(example);
    setShowExamples(false);
    toast.success("Example prompt selected!");
  };

  const handleGenerateAIPrompt = async () => {
    setIsGenerating(true);
    
    try {
      // Get the latest training from Supabase to inform AI generation
      const { data: trainingLogs } = await supabase
        .from('training_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const styleFeatures = trainingLogs?.[0]?.metadata?.styleFeatures;
      
      // Call the auto-content-pipeline function
      const { data, error } = await supabase.functions.invoke("auto-content-pipeline");
      
      if (error) throw new Error(error.message);
      
      if (data && data.data && data.data.length > 0) {
        // Take the first generated topic's videoPrompt
        const generatedPrompt = data.data[0].videoPrompt;
        onChange(generatedPrompt);
        toast.success("AI generated a creative prompt for you!");
      } else {
        throw new Error("No content generated");
      }
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      toast.error(`Failed to generate prompt: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label htmlFor="prompt" className="text-lg font-medium">Write Your Video Concept</Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => setShowExamples(!showExamples)}
          >
            Examples
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateAIPrompt}
            disabled={isGenerating}
            className="flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating ? "Generating..." : "Generate Idea"}
          </Button>
        </div>
      </div>
      
      {showExamples && (
        <div className="grid grid-cols-1 gap-2 mb-2">
          {examples.map((example, index) => (
            <div 
              key={index}
              className="bg-secondary/50 p-2 rounded-md text-sm cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => handleSelectExample(example)}
            >
              {example}
            </div>
          ))}
        </div>
      )}
      
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
