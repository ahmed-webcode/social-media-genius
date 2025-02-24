
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { ScheduledPost } from "@/lib/types";

const AutomationDashboard = () => {
  const { data: scheduledPosts, refetch } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      // In production, this would fetch from your database
      const mockPosts: ScheduledPost[] = [
        {
          id: '1',
          prompt: 'Latest AI trends',
          scheduledFor: new Date(),
          status: 'pending',
          platform: 'TikTok',
          hashtags: ['#AI', '#Tech', '#Trending']
        }
      ];
      return mockPosts;
    },
    refetchInterval: 30000
  });

  useEffect(() => {
    // Auto-recovery system
    const checkFailedPosts = async () => {
      const failed = scheduledPosts?.filter(post => post.status === 'failed');
      if (failed?.length) {
        toast.error(`Retrying ${failed.length} failed posts...`);
        // In production, this would trigger retry logic
      }
    };

    checkFailedPosts();
  }, [scheduledPosts]);

  const startAutomation = async () => {
    try {
      const response = await fetch('/api/auto-content-pipeline', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to start automation');
      
      toast.success("Automation started successfully!");
    } catch (error) {
      toast.error("Failed to start automation. Retrying...");
      // Auto-retry after 5 minutes
      setTimeout(startAutomation, 300000);
    }
  };

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <CardTitle>Automation Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span>System Status</span>
          <span className="text-green-500">Active</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Posts Scheduled</span>
          <span>{scheduledPosts?.length ?? 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Next Post</span>
          <span>
            {scheduledPosts?.[0]?.scheduledFor.toLocaleString() ?? 'No posts scheduled'}
          </span>
        </div>
        <Button 
          onClick={startAutomation}
          className="w-full"
        >
          Start Automation
        </Button>
      </CardContent>
    </Card>
  );
};

export default AutomationDashboard;
