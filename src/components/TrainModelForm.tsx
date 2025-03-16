
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Plus, Trash, Eye } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "./ui/badge";

const TrainModelForm = () => {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<string>("YouTube");
  const [videoType, setVideoType] = useState<string>("tutorial");
  const [sampleCount, setSampleCount] = useState<number>(5);
  const [referenceVideos, setReferenceVideos] = useState<string[]>([
    "https://youtube.com/shorts/74J0uiZk29k",
    "https://youtube.com/shorts/Tc4SW2M07As",
    "https://youtube.com/shorts/IhC7N6T_gTg"
  ]);
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("main");

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

  const renderThumbnail = (videoId: string) => {
    if (!videoId) return null;
    return (
      <div className="relative w-full h-24 overflow-hidden rounded-md mb-2">
        <img 
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
          alt="Video thumbnail" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <a 
            href={`https://youtube.com/shorts/${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white flex items-center gap-1 text-sm bg-black/50 px-2 py-1 rounded-md"
          >
            <Eye size={14} /> View
          </a>
        </div>
      </div>
    );
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
      
      // Set analysis results and switch to analytics tab
      setAnalysisResults(data.details);
      setActiveTab("analytics");
      
    } catch (error: any) {
      console.error("Training error:", error);
      toast.dismiss(trainingToast);
      toast.error(`Failed to train AI model: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalyticsContent = () => {
    if (!analysisResults) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Train the model to see analytics</p>
        </div>
      );
    }

    const { styleFeatures, referenceVideosAnalyzed, trainingCompleted } = analysisResults;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Training Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary/40 p-3 rounded-md">
              <p className="text-xs text-muted-foreground">Videos Analyzed</p>
              <p className="text-xl font-semibold">{referenceVideosAnalyzed}</p>
            </div>
            <div className="bg-secondary/40 p-3 rounded-md">
              <p className="text-xs text-muted-foreground">Visual Style</p>
              <p className="text-xl font-semibold">{styleFeatures.visualStyle}</p>
            </div>
            <div className="bg-secondary/40 p-3 rounded-md">
              <p className="text-xs text-muted-foreground">Pacing</p>
              <p className="text-xl font-semibold">{styleFeatures.pacing}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Style Features</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Camera Movements</p>
              <div className="flex flex-wrap gap-1">
                {styleFeatures.cameraMovements.map((movement: string, i: number) => (
                  <Badge key={i} variant="secondary">{movement}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Transitions</p>
              <div className="flex flex-wrap gap-1">
                {styleFeatures.transitions.map((transition: string, i: number) => (
                  <Badge key={i} variant="secondary">{transition}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Audio Features</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Music: {styleFeatures.audioFeatures.musicType}</Badge>
                {styleFeatures.audioFeatures.soundEffects && 
                  <Badge variant="secondary">Sound Effects</Badge>
                }
                {styleFeatures.audioFeatures.voiceOver && 
                  <Badge variant="secondary">Voice Over</Badge>
                }
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Trained on {new Date(trainingCompleted).toLocaleDateString()} at {new Date(trainingCompleted).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Train Video Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Training</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="main" className="space-y-4">
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
              <div className="border rounded-md p-3 bg-secondary/30 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {referenceVideos.map((video, index) => (
                    <div key={index} className="bg-background rounded-md p-2 flex flex-col">
                      {renderThumbnail(extractVideoId(video))}
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs truncate flex-1 font-mono">{extractVideoId(video)}</div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveReferenceVideo(index)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-3">
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
          </TabsContent>
          
          <TabsContent value="analytics">
            {renderAnalyticsContent()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrainModelForm;
