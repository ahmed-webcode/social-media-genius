
import MetricsCard from "@/components/MetricsCard";
import VideoGenerator from "@/components/VideoGenerator";
import TrendingTopics from "@/components/TrendingTopics";

const Index = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="space-y-2 animate-fadeIn">
        <h1 className="text-4xl font-bold tracking-tight">Social Media Manager</h1>
        <p className="text-muted-foreground">Generate and manage your social media content</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard
          title="Total Views"
          value="124.5K"
          description="+12% from last month"
        />
        <MetricsCard
          title="Engagement Rate"
          value="4.3%"
          description="Based on likes and comments"
        />
        <MetricsCard
          title="Scheduled Posts"
          value="8"
          description="Next 7 days"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <VideoGenerator />
        <TrendingTopics />
      </div>
    </div>
  );
};

export default Index;
