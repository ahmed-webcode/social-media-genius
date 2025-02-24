
export interface ScheduledPost {
  id: string;
  prompt: string;
  scheduledFor: Date;
  status: 'pending' | 'generating' | 'ready' | 'posted' | 'failed';
  videoUrl?: string;
  platform: 'YouTube' | 'TikTok';
  hashtags: string[];
  performance?: {
    views: number;
    shares: number;
    engagement: number;
  };
}

export interface GenerateVideoResponse {
  videoUrl: string;
  status: 'success' | 'error';
  message?: string;
}

export interface TrendingTopic {
  topic: string;
  score: number;
  velocity: number;
  novelty: number;
  platform: string;
}
