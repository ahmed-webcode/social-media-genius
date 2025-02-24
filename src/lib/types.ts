
export interface ScheduledPost {
  id: string;
  prompt: string;
  scheduledFor: Date;
  status: 'pending' | 'generating' | 'ready' | 'posted' | 'failed';
  videoUrl?: string;
}

export interface GenerateVideoResponse {
  videoUrl: string;
  status: 'success' | 'error';
  message?: string;
}
