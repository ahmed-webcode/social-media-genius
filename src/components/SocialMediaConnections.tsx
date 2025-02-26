
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Youtube, Instagram, SnapchatGhost, Music } from "lucide-react";

interface SocialAccount {
  platform: string;
  account_name: string | null;
  connected: boolean;
}

const PLATFORMS = [
  { name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { name: 'TikTok', icon: Music, color: 'text-black' },
  { name: 'Snapchat', icon: SnapchatGhost, color: 'text-yellow-400' },
];

const SocialMediaConnections = () => {
  const { data: accounts, refetch } = useQuery({
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
    toast.info(`Connecting to ${platform}...`);
    // TODO: Implement OAuth flow for each platform
    // This will be implemented once you provide the OAuth credentials for each platform
  };

  const handleDisconnect = async (platform: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('social_media_accounts')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;

      toast.success(`Disconnected from ${platform}`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to enable automatic posting
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default SocialMediaConnections;
