
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const VideoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call OpenAI's API
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Video generated successfully!");
    } catch (error) {
      toast.error("Failed to generate video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <CardTitle>Generate Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            placeholder="Enter your video concept..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt}
          className="w-full transition-all duration-300"
        >
          {loading ? "Generating..." : "Generate Video"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default VideoGenerator;
