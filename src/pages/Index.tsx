
import MetricsCard from "@/components/MetricsCard";
import VideoGenerator from "@/components/VideoGenerator";
import TrendingTopics from "@/components/TrendingTopics";
import AutomationDashboard from "@/components/AutomationDashboard";
import SocialMediaConnections from "@/components/SocialMediaConnections";
import TrainModelForm from "@/components/TrainModelForm";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      // In a real implementation, this would fetch from your analytics API
      return {
        views: "124.5K",
        engagement: "4.3%",
        scheduled: "8"
      };
    },
    refetchInterval: 60000 // Refetch every minute
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto p-6 space-y-8">
        <header className="space-y-2 animate-fadeIn">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Automated content generation and posting</p>
        </header>

        {/* Social Media Connections */}
        <div className="mb-8">
          <SocialMediaConnections />
        </div>

        {/* Video Generator */}
        <div className="mb-8">
          <VideoGenerator />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricsCard
            title="Total Views"
            value={metrics?.views ?? "..."}
            description="+12% from last month"
          />
          <MetricsCard
            title="Engagement Rate"
            value={metrics?.engagement ?? "..."}
            description="Based on likes and comments"
          />
          <MetricsCard
            title="Scheduled Posts"
            value={metrics?.scheduled ?? "..."}
            description="Next 7 days"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <AutomationDashboard />
          <TrendingTopics />
          <TrainModelForm />
        </div>
      </div>
    </div>
  );
};

export default Index;
