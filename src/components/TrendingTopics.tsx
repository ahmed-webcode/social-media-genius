
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockTrends = [
  { topic: "AI Technology", score: 98 },
  { topic: "Remote Work", score: 85 },
  { topic: "Digital Wellness", score: 76 },
  { topic: "Sustainable Tech", score: 72 },
];

const TrendingTopics = () => {
  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <CardTitle>Trending Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTrends.map((trend) => (
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingTopics;
