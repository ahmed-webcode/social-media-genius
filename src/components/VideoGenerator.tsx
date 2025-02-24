
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { ScheduledPost } from "@/lib/types";

const VideoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });

  const { data: scheduledPosts } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      // In a real implementation, this would fetch from your database
      const mockPosts: ScheduledPost[] = [
        {
          id: '1',
          prompt: 'Trending tech news recap',
          scheduledFor: new Date(),
          status: 'pending'
        }
      ];
      return mockPosts;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      // In a real implementation, save the scheduled post to your database
      toast.success("Video scheduled successfully!");
      setPrompt("");
    } catch (error) {
      toast.error("Failed to generate video: " + error.message);
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
        <div className="space-y-2">
          <Label htmlFor="scheduledTime">Schedule Time</Label>
          <Input
            id="scheduledTime"
            type="datetime-local"
            value={scheduledTime.toISOString().slice(0, 16)}
            onChange={(e) => setScheduledTime(new Date(e.target.value))}
          />
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt}
          className="w-full transition-all duration-300"
        >
          {loading ? "Scheduling..." : "Schedule Video"}
        </Button>

        {scheduledPosts && scheduledPosts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Scheduled Posts</h3>
            <div className="space-y-2">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-2 bg-secondary rounded-md text-sm flex justify-between items-center"
                >
                  <span>{post.prompt}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.scheduledFor).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoGenerator;
