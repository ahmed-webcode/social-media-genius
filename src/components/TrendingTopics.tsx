
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface Trend {
  topic: string;
  score: number;
}

const TrendingTopics = () => {
  const { data: trends, isLoading } = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      // In a real implementation, this would fetch from a trends API
      const mockTrends: Trend[] = [
        { topic: "AI Technology", score: 98 },
        { topic: "Remote Work", score: 85 },
        { topic: "Digital Wellness", score: 76 },
        { topic: "Sustainable Tech", score: 72 },
      ];
      return mockTrends;
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  const handleUseTrend = (trend: Trend) => {
    // In a real implementation, this would pre-fill the video generator
    console.log(`Using trend: ${trend.topic}`);
  };

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <CardTitle>Trending Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p>Loading trends...</p>
          ) : (
            trends?.map((trend) => (
              <div
                key={trend.topic}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="animate-float">
                    {trend.score}
                  </Badge>
                  <span>{trend.topic}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUseTrend(trend)}
                >
                  Use
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingTopics;
