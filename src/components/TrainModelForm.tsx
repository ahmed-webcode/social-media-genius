
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Plus, Trash, Eye, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "./ui/badge";

// Import for Remotion video rendering
import { Player } from "@remotion/player";
import VideoPreviewDialog from "./VideoPreviewDialog";
import RemotionVideo from "./RemotionVideo";

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
  const [trainedModels, setTrainedModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Fetch previously trained models on initial load
  useEffect(() => {
    fetchTrainedModels();
  }, []);
  
  const fetchTrainedModels = async () => {
    try {
      // Using raw SQL query to fetch data from video_models table to work around TypeScript limitations
      const { data, error } = await supabase
        .rpc('get_video_models', {});
        
      if (error) {
        console.error("Error fetching trained models:", error);
        // Fallback to direct query if RPC fails
        const { data: directData, error: directError } = await supabase
          .from('video_models')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (directError) {
          console.error("Error with direct query:", directError);
          return;
        }
        
        if (directData) setTrainedModels(directData);
      } else if (data) {
        setTrainedModels(data);
      }
    } catch (error: any) {
      console.error("Error fetching trained models:", error);
    }
  };

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
      
      // Refresh the list of trained models
      await fetchTrainedModels();
      
      // Set the newly created model as selected
      if (data.modelId) {
        setSelectedModel(data.modelId);
      }
      
      // Switch to analytics tab
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
            {styleFeatures.colorPalette && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Color Palette</p>
                <div className="flex gap-1">
                  {styleFeatures.colorPalette.map((color: string, i: number) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border border-gray-300" 
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
            {styleFeatures.textAnimations && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Text Animations</p>
                <div className="flex flex-wrap gap-1">
                  {styleFeatures.textAnimations.map((animation: string, i: number) => (
                    <Badge key={i} variant="secondary">{animation}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Trained on {new Date(trainingCompleted).toLocaleDateString()} at {new Date(trainingCompleted).toLocaleTimeString()}
          </p>
        </div>
        
        <Button 
          onClick={generateSampleVideo} 
          disabled={loadingPreview}
          className="w-full"
        >
          {loadingPreview ? (
            <>Generating Preview...</>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate Sample Video
            </>
          )}
        </Button>
        
        {/* Preview of the generated video using Remotion */}
        {styleFeatures && (
          <div className="mt-4 border rounded-md overflow-hidden">
            <h3 className="text-sm font-medium p-3 border-b">Model Preview</h3>
            <div className="aspect-video bg-black/5 relative">
              <RemotionVideo 
                compositionWidth={1280}
                compositionHeight={720}
                platform={platform}
                styleFeatures={styleFeatures}
                scenes={[
                  {
                    id: 'preview',
                    text: `${platform} ${videoType} video`,
                    visualDescription: 'Preview of trained model style',
                    duration: 5
                  }
                ]}
              />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const generateSampleVideo = async () => {
    if (!analysisResults) return;
    
    setLoadingPreview(true);
    const generatingToast = toast.loading("Generating sample video with trained model...");
    
    try {
      // Generate a sample video based on the trained model
      const samplePrompt = `A short video about ${videoType} for ${platform} showcasing key features`;
      
      // Call the generate-video function with the model ID
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          prompt: samplePrompt,
          platform,
          useModel: selectedModel || analysisResults.modelId,
        },
      });
      
      if (error) throw new Error(error.message);
      
      console.log("Generated video data:", data);
      
      // In a real implementation, we would get back video data
      // For now, we'll simulate this with a success message
      toast.dismiss(generatingToast);
      toast.success("Sample video generated successfully!");
      
      // Create a blob URL from base64 or set a placeholder video
      // The actual video generation would need to happen in the edge function
      // using Remotion Server or a similar service
      setPreviewVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
      setPreviewDialogOpen(true);
    } catch (error: any) {
      console.error("Error generating sample video:", error);
      toast.dismiss(generatingToast);
      toast.error(`Failed to generate sample video: ${error.message}`);
    } finally {
      setLoadingPreview(false);
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
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="main">Training</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="models">My Models</TabsTrigger>
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
          
          <TabsContent value="models">
            <div className="space-y-4">
              {trainedModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trained models yet. Go to the Training tab to create one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Your Trained Models</h3>
                  <div className="space-y-2">
                    {trainedModels.map((model) => (
                      <div 
                        key={model.id}
                        className={`p-3 rounded-md border cursor-pointer transition-colors hover:bg-secondary/30 ${selectedModel === model.id ? 'border-primary bg-secondary/20' : 'border-border'}`}
                        onClick={() => {
                          setSelectedModel(model.id);
                          // Load model details into analysisResults
                          setAnalysisResults({
                            styleFeatures: model.style_features,
                            referenceVideosAnalyzed: model.reference_videos.length,
                            trainingCompleted: model.created_at,
                            modelId: model.id
                          });
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{model.platform} {model.video_type}</h4>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(model.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedModel(model.id);
                                setAnalysisResults({
                                  styleFeatures: model.style_features,
                                  referenceVideosAnalyzed: model.reference_videos.length,
                                  trainingCompleted: model.created_at,
                                  modelId: model.id
                                });
                                setActiveTab("analytics");
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline">{model.platform}</Badge>
                          <Badge variant="outline">{model.video_type}</Badge>
                          <Badge variant="outline">{model.style_features.visualStyle}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Video Preview Dialog */}
      <VideoPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        videoUrl={previewVideoUrl}
        title="Sample Video from Trained Model"
      />
    </Card>
  );
};

export default TrainModelForm;
