
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VideoForm from "./VideoForm";
import ScheduledVideosList from "./ScheduledVideosList";
import type { ScheduledPost } from "@/lib/types";

const VideoGenerator = () => {
  const navigate = useNavigate();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  // Check which social media platforms are connected
  useEffect(() => {
    const checkConnectedPlatforms = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('social_media_accounts')
          .select('platform')
          .eq('user_id', user.id);

        if (error) throw error;
        
        setConnectedPlatforms(data.map(account => account.platform));
      } catch (error) {
        console.error("Failed to check connected platforms:", error);
      }
    };

    checkConnectedPlatforms();
  }, []);

  const { data: scheduledPosts, refetch } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(post => ({
        id: post.id,
        prompt: post.prompt,
        scheduledFor: new Date(post.scheduled_for),
        status: post.status,
        videoUrl: post.video_url,
        shortsUrl: post.shorts_url,
        platform: post.platform,
        hashtags: post.hashtags || [],
        metadata: post.metadata || {},
        performance: post.performance
      })) as ScheduledPost[];
    },
    refetchInterval: 30000
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl">Generate Video</span>
          <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <VideoForm 
          connectedPlatforms={connectedPlatforms} 
          onSuccess={refetch}
        />
        
        {scheduledPosts && <ScheduledVideosList scheduledPosts={scheduledPosts} />}
      </CardContent>
    </Card>
  );
};

export default VideoGenerator;
