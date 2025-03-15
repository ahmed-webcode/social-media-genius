
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Plus, Trash } from "lucide-react";
import { Textarea } from "./ui/textarea";

const TrainModelForm = () => {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<string>("YouTube");
  const [videoType, setVideoType] = useState<string>("tutorial");
  const [sampleCount, setSampleCount] = useState<number>(5);
  const [referenceVideos, setReferenceVideos] = useState<string[]>([
    "https://youtube.com/shorts/74J0uiZk29k",
    "https://youtube.com/shorts/Tc4SW2M07As"
  ]);
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");

  const handleAddReferenceVideo = () => {
    if (!newVideoUrl) return;
    
    // Basic validation for YouTube URL
    if (!newVideoUrl.includes("youtube.com") && !newVideoUrl.includes("youtu.be")) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }
    
    setReferenceVideos([...referenceVideos, newVideoUrl]);
    setNewVideoUrl("");
  };

  const handleRemoveReferenceVideo = (index: number) => {
    const updatedVideos = [...referenceVideos];
    updatedVideos.splice(index, 1);
    setReferenceVideos(updatedVideos);
  };

  const extractVideoId = (url: string): string => {
    // Extract video ID from YouTube URL
    const regExp = /^.*(youtu.be\/|v\/|shorts\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "";
  };

  const handleTrain = async () => {
    setLoading(true);
    const trainingToast = toast.loading("Training AI model...");

    try {
      // Get the video IDs from the reference videos
      const videoIds = referenceVideos.map(url => extractVideoId(url));
      
      // Prepare training data including video references
      const trainingData = Array(sampleCount).fill(null).map((_, i) => ({
        id: `sample-${i}`,
        prompt: `Sample video about ${videoType} for ${platform}`,
        features: ["hd", "vibrant", platform.toLowerCase()],
        referenceVideoId: videoIds[i % videoIds.length] || null,
      }));

      // Call the edge function to train the model
      const { data, error } = await supabase.functions.invoke("train-video-model", {
        body: {
          trainingData,
          videoType,
          platform,
          referenceVideos: videoIds.filter(id => id), // Filter out empty IDs
        },
      });

      if (error) throw new Error(error.message);

      toast.dismiss(trainingToast);
      toast.success(`AI model trained successfully for ${platform} ${videoType} videos with ${videoIds.length} reference videos!`);
      
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
          <Label>Reference Videos</Label>
          <div className="border rounded-md p-3 bg-secondary/30 space-y-2">
            {referenceVideos.map((video, index) => (
              <div key={index} className="flex items-center justify-between gap-2 bg-background rounded-md p-2">
                <div className="text-sm truncate flex-1">{video}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveReferenceVideo(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2 mt-2">
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="Add YouTube video URL"
                className="text-sm"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddReferenceVideo}
                className="whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Add YouTube video URLs as references for the AI to learn from
            </p>
          </div>
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
