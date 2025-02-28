
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Youtube, Instagram, Ghost, Music } from "lucide-react";

interface SocialAccount {
  platform: string;
  account_name: string | null;
  connected: boolean;
}

const PLATFORMS = [
  { name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { name: 'TikTok', icon: Music, color: 'text-black' },
  { name: 'Snapchat', icon: Ghost, color: 'text-yellow-400' },
];

const SocialMediaConnections = () => {
  const { data: accounts, refetch, isLoading } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const connectedPlatforms = new Set(data.map(account => account.platform));
      
      return PLATFORMS.map(platform => ({
        platform: platform.name,
        connected: connectedPlatforms.has(platform.name),
        account_name: data.find(a => a.platform === platform.name)?.account_name || null
      }));
    }
  });

  const handleConnect = async (platform: string) => {
    if (platform === 'Snapchat') {
      try {
        // Show loading state
        const loadingToast = toast.loading("Connecting to Snapchat...");
        
        // Call the Supabase Edge Function to handle Snapchat OAuth
        const { data, error } = await supabase.functions.invoke('init-snapchat-oauth', {
          body: {
            redirectUrl: window.location.origin + '/auth/callback/snapchat'
          }
        });

        toast.dismiss(loadingToast);

        if (error) {
          console.error("Snapchat init error:", error);
          throw new Error(`Failed to initialize Snapchat connection: ${error.message}`);
        }
        
        if (!data?.authUrl) {
          console.error("No auth URL returned:", data);
          throw new Error("Failed to get authorization URL from Snapchat");
        }

        console.log("Redirecting to Snapchat auth URL:", data.authUrl);
        
        // Redirect to Snapchat's OAuth page
        window.location.href = data.authUrl;
      } catch (error: any) {
        toast.error(`Failed to connect to Snapchat: ${error.message}`);
        console.error("Snapchat connection error:", error);
      }
    } else {
      toast.info(`Connecting to ${platform}...`);
      toast("This platform integration is coming soon!");
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      const disconnectToast = toast.loading(`Disconnecting from ${platform}...`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('social_media_accounts')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      toast.dismiss(disconnectToast);

      if (error) throw error;

      toast.success(`Disconnected from ${platform}`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to disconnect: ${error.message}`);
      console.error("Disconnection error:", error);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (window.location.pathname === '/auth/callback/snapchat') {
        const code = new URLSearchParams(window.location.search).get('code');
        const error = new URLSearchParams(window.location.search).get('error');
        
        if (error) {
          toast.error(`Snapchat authentication failed: ${error}`);
          window.history.replaceState({}, '', '/');
          return;
        }
        
        if (!code) {
          toast.error('No authentication code received from Snapchat');
          window.history.replaceState({}, '', '/');
          return;
        }

        try {
          const processingToast = toast.loading("Completing Snapchat connection...");
          
          console.log("Completing Snapchat OAuth with code:", code.substring(0, 5) + "...");
          
          const { data, error } = await supabase.functions.invoke('complete-snapchat-oauth', {
            body: { 
              code,
              redirectUri: window.location.origin + '/auth/callback/snapchat'
            }
          });

          toast.dismiss(processingToast);

          if (error) {
            console.error("Complete OAuth function error:", error);
            throw new Error(`Failed to complete Snapchat connection: ${error.message}`);
          }

          if (!data?.success) {
            console.error("OAuth completion failed:", data);
            throw new Error(data?.message || 'Failed to complete Snapchat connection');
          }

          await refetch();
          toast.success('Successfully connected to Snapchat!');
          
          // Remove the code from the URL
          window.history.replaceState({}, '', '/');
        } catch (error: any) {
          toast.error(`Failed to complete Snapchat connection: ${error.message}`);
          console.error("Snapchat OAuth completion error:", error);
          window.history.replaceState({}, '', '/');
        }
      }
    };

    handleOAuthCallback();
  }, [refetch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to enable automatic posting
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground">Loading your connected accounts...</div>
        ) : (
          <div className="grid gap-4">
            {accounts?.map(({ platform, connected, account_name }) => {
              const platformConfig = PLATFORMS.find(p => p.name === platform);
              if (!platformConfig) return null;
              const Icon = platformConfig.icon;

              return (
                <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${platformConfig.color}`} />
                    <div>
                      <h3 className="font-medium">{platform}</h3>
                      {connected && account_name && (
                        <p className="text-sm text-muted-foreground">{account_name}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={connected ? "destructive" : "default"}
                    onClick={() => connected ? handleDisconnect(platform) : handleConnect(platform)}
                  >
                    {connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaConnections;
