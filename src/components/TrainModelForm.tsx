
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";

const TrainModelForm = () => {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<string>("YouTube");
  const [videoType, setVideoType] = useState<string>("tutorial");
  const [sampleCount, setSampleCount] = useState<number>(5);

  const handleTrain = async () => {
    setLoading(true);
    const trainingToast = toast.loading("Training AI model...");

    try {
      // Prepare mock training data (in a real app, this would be actual data)
      const trainingData = Array(sampleCount).fill(null).map((_, i) => ({
        id: `sample-${i}`,
        prompt: `Sample video about ${videoType} for ${platform}`,
        features: ["hd", "vibrant", platform.toLowerCase()],
      }));

      // Call the edge function to train the model
      const { data, error } = await supabase.functions.invoke("train-video-model", {
        body: {
          trainingData,
          videoType,
          platform,
        },
      });

      if (error) throw new Error(error.message);

      toast.dismiss(trainingToast);
      toast.success(`AI model trained successfully for ${platform} ${videoType} videos!`);
      
      console.log("Training response:", data);
    } catch (error: any) {
      console.error("Training error:", error);
      toast.dismiss(trainingToast);
      toast.error(`Failed to train AI model: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Train Video Model
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YouTube">YouTube</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Snapchat">Snapchat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoType">Video Type</Label>
          <Select value={videoType} onValueChange={setVideoType}>
            <SelectTrigger>
              <SelectValue placeholder="Select video type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutorial">Tutorial</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="vlog">Vlog</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sampleCount">Sample Count</Label>
          <Input
            id="sampleCount"
            type="number"
            min={1}
            max={20}
            value={sampleCount}
            onChange={(e) => setSampleCount(parseInt(e.target.value) || 5)}
          />
          <p className="text-xs text-muted-foreground">
            Number of samples to use for training (1-20)
          </p>
        </div>

        <Button
          onClick={handleTrain}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Training..." : "Train AI Model"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrainModelForm;
