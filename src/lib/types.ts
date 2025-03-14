
export interface ScheduledPost {
  id: string;
  prompt: string;
  scheduledFor: Date;
  status: 'pending' | 'generating' | 'ready' | 'posted' | 'failed';
  videoUrl?: string;
  shortsUrl?: string;
  platform: 'YouTube' | 'TikTok' | 'Instagram' | 'Snapchat';
  hashtags: string[];
  performance?: {
    views: number;
    shares: number;
    engagement: number;
  };
  metadata?: {
    title: string;
    description: string;
    tags: string[];
    thumbnailUrl: string;
    duration: number;
    shortsDuration?: number | null;
    resolution: string;
    content: {
      scenes: Array<{
        sceneId: number;
        duration: number;
        script: string;
        visualDescription: string;
        audioTrack?: string;
        transition: string;
      }>;
      totalDuration: number;
      musicTrack: string;
      style: string;
      callToAction: string;
    };
  };
}

export interface GenerateVideoResponse {
  videoUrl: string;
  shortsUrl?: string;
  status: 'success' | 'error';
  message?: string;
  metadata?: any;
}

export interface TrendingTopic {
  topic: string;
  score: number;
  velocity: number;
  novelty: number;
  platform: string;
}
