
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type PlatformSelectorProps = {
  connectedPlatforms: string[];
  selectedPlatforms: string[];
  onPlatformChange: (platforms: string[]) => void;
};

const PLATFORMS = {
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  SNAPCHAT: 'Snapchat'
} as const;

const PlatformSelector = ({ 
  connectedPlatforms, 
  selectedPlatforms, 
  onPlatformChange 
}: PlatformSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-lg font-medium">Select Platforms</Label>
      <div className="grid grid-cols-2 gap-4">
        {Object.values(PLATFORMS).map((platform) => {
          const isConnected = platform !== 'Snapchat' || connectedPlatforms.includes(platform);
          return (
            <div 
              key={platform} 
              className={`flex items-center space-x-2 p-3 border rounded-md hover:bg-secondary/50 transition-colors ${!isConnected ? 'border-orange-400' : ''}`}
            >
              <Checkbox
                id={platform}
                checked={selectedPlatforms.includes(platform)}
                onCheckedChange={(checked) => {
                  onPlatformChange(
                    checked 
                      ? [...selectedPlatforms, platform]
                      : selectedPlatforms.filter(p => p !== platform)
                  );
                }}
              />
              <div className="flex flex-col">
                <Label htmlFor={platform} className="text-base">{platform}</Label>
                {!isConnected && (
                  <span className="text-xs text-orange-500">Not connected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!connectedPlatforms.includes('Snapchat') && (
        <p className="text-xs text-orange-500 mt-1">
          To post to Snapchat, please connect your account in the "Connected Accounts" section first.
        </p>
      )}
    </div>
  );
};

export default PlatformSelector;
