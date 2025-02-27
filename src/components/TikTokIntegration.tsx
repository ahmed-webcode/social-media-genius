
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TikTokIntegration = () => {
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveApiKey = async () => {
    if (!accessToken.trim()) {
      toast.error("Please enter a valid TikTok API key");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Here you would normally save the token securely in your database
      // This is a simplified example - in production, store this in Supabase
      const { error } = await supabase
        .from('social_media_accounts')
        .upsert({
          user_id: user.id,
          platform: 'TikTok',
          access_token: accessToken,
          account_name: 'TikTok Account', // You would get this from TikTok API
        });

      if (error) throw error;

      toast.success("TikTok API key saved successfully");
      setAccessToken("");
    } catch (error: any) {
      toast.error(`Failed to save TikTok API key: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWithTikTok = async () => {
    try {
      // Call the Supabase Edge Function to handle TikTok OAuth (you'll need to create this)
      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth', {
        body: {
          redirectUrl: window.location.origin + '/auth/callback/tiktok'
        }
      });

      if (error) throw error;
      if (data?.authUrl) {
        // Redirect to TikTok's OAuth page
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast.error(`Failed to connect to TikTok: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>TikTok Integration</CardTitle>
        <CardDescription>
          Connect your TikTok account or add your TikTok API credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tiktok-api-key">TikTok API Access Token</Label>
          <Input
            id="tiktok-api-key"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Enter your TikTok API access token"
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            This token will be stored securely and used to interact with TikTok on your behalf.
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={handleSaveApiKey} 
            disabled={loading || !accessToken.trim()}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save API Key"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleConnectWithTikTok}
            className="flex-1"
          >
            Connect with TikTok
          </Button>
        </div>
        
        <div className="rounded-md bg-muted p-4">
          <h3 className="font-medium mb-2">How to get your TikTok API key</h3>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Go to the <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok Developer Portal</a></li>
            <li>Create or select your project</li>
            <li>Navigate to the "Apps" section</li>
            <li>Create a new app or select an existing one</li>
            <li>Go to "Tools → API Access → Access Token"</li>
            <li>Generate and copy your access token</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default TikTokIntegration;
