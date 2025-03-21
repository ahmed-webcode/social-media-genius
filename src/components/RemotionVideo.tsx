
import { useState, useEffect } from 'react';
import { Player, PlayerRef } from 'remotion/player';
import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  Sequence, 
  Audio, 
  Img, 
  interpolate, 
  spring, 
  measureSpring
} from 'remotion';

// Define video composition types
interface VideoScene {
  id: string;
  duration: number;
  text: string;
  styleOverrides?: any;
}

interface VideoStyle {
  visualStyle: string;
  colorGrading: string;
  cameraMovements: string[];
  transitions: string[];
  textOverlays: boolean;
  audioFeatures: {
    musicType: string;
    soundEffects: boolean;
    voiceOver: boolean;
  };
  pacing: string;
  narrativeStyle: string;
  composition: string;
  lighting: string;
  editingStyle: string;
  customFont?: string;
  textAnimations?: string[];
  colorPalette?: string[];
}

interface RemotionVideoProps {
  platform: string;
  prompt: string;
  videoStyle: VideoStyle;
  scenes?: VideoScene[];
  width?: number;
  height?: number;
}

// Main component for Remotion video
const RemotionVideo = ({ 
  platform, 
  prompt, 
  videoStyle, 
  scenes = [],
  width = 1280,
  height = 720 
}: RemotionVideoProps) => {
  const [playerRef, setPlayerRef] = useState<PlayerRef | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-generate scenes if none provided
  const [generatedScenes, setGeneratedScenes] = useState<VideoScene[]>([]);
  
  useEffect(() => {
    if (scenes.length === 0) {
      // Auto-generate 3-5 scenes based on the prompt
      const sceneCount = Math.floor(Math.random() * 3) + 3; // 3-5 scenes
      const generatedScenes: VideoScene[] = [];
      
      // Create intro scene
      generatedScenes.push({
        id: 'intro',
        duration: 3,
        text: prompt,
      });
      
      // Create middle scenes
      for (let i = 1; i < sceneCount - 1; i++) {
        generatedScenes.push({
          id: `scene-${i}`,
          duration: 4,
          text: `Key point ${i} about "${prompt}"`,
        });
      }
      
      // Create outro scene
      generatedScenes.push({
        id: 'outro',
        duration: 3,
        text: 'Thanks for watching!',
      });
      
      setGeneratedScenes(generatedScenes);
    } else {
      setGeneratedScenes(scenes);
    }
  }, [prompt, scenes]);

  const scenesToUse = scenes.length > 0 ? scenes : generatedScenes;
  const totalDuration = scenesToUse.reduce((acc, scene) => acc + scene.duration, 0) * 30; // Convert to frames (30fps)

  // Define video dimensions based on platform
  const isVertical = platform === 'TikTok' || platform === 'Instagram';
  const videoWidth = isVertical ? 720 : width;
  const videoHeight = isVertical ? 1280 : height;

  // Set primary and secondary colors based on platform or palette
  let primaryColor = '#FF0000';
  let secondaryColor = '#000000';
  
  if (videoStyle.colorPalette && videoStyle.colorPalette.length >= 2) {
    [primaryColor, secondaryColor] = videoStyle.colorPalette;
  } else {
    switch (platform) {
      case 'TikTok':
        primaryColor = '#00f2ea';
        secondaryColor = '#ff0050';
        break;
      case 'Instagram':
        primaryColor = '#833AB4'; 
        secondaryColor = '#FD1D1D';
        break;
      case 'Snapchat':
        primaryColor = '#FFFC00';
        secondaryColor = '#000000';
        break;
      default: // YouTube
        primaryColor = '#FF0000';
        secondaryColor = '#282828';
        break;
    }
  }

  return (
    <div className="w-full">
      <Player
        ref={(ref) => setPlayerRef(ref)}
        component={VideoComposition}
        inputProps={{
          platform,
          prompt,
          videoStyle,
          scenesToUse,
          primaryColor,
          secondaryColor,
          isVertical
        }}
        durationInFrames={totalDuration}
        fps={30}
        compositionWidth={videoWidth}
        compositionHeight={videoHeight}
        style={{
          width: '100%',
          aspectRatio: isVertical ? '9/16' : '16/9',
        }}
        controls
        autoPlay
        loop
      />
    </div>
  );
};

const VideoComposition = ({
  platform,
  prompt,
  videoStyle,
  scenesToUse,
  primaryColor,
  secondaryColor,
  isVertical
}: {
  platform: string;
  prompt: string;
  videoStyle: VideoStyle;
  scenesToUse: VideoScene[];
  primaryColor: string;
  secondaryColor: string;
  isVertical: boolean;
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  
  // Calculate current scene index
  let currentSceneStartFrame = 0;
  let currentSceneIndex = 0;
  let currentSceneProgress = 0;
  
  for (let i = 0; i < scenesToUse.length; i++) {
    const sceneDuration = scenesToUse[i].duration * fps;
    if (frame < currentSceneStartFrame + sceneDuration) {
      currentSceneIndex = i;
      currentSceneProgress = (frame - currentSceneStartFrame) / sceneDuration;
      break;
    }
    currentSceneStartFrame += sceneDuration;
  }

  const currentScene = scenesToUse[currentSceneIndex];
  
  return (
    <AbsoluteFill style={{ backgroundColor: secondaryColor }}>
      {/* Background based on visual style */}
      <BackgroundLayer 
        visualStyle={videoStyle.visualStyle}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        frame={frame}
        colorPalette={videoStyle.colorPalette}
      />
      
      {/* Scene content with animations */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <SceneContent 
          scene={currentScene}
          progress={currentSceneProgress}
          videoStyle={videoStyle}
          platform={platform}
          textColor={videoStyle.colorPalette ? videoStyle.colorPalette[videoStyle.colorPalette.length - 1] : '#FFFFFF'}
          isVertical={isVertical}
        />
      </Sequence>
      
      {/* Platform branding */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <PlatformBranding 
          platform={platform} 
          frame={frame}
          primaryColor={primaryColor}
        />
      </Sequence>
      
      {/* Progress bar */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <ProgressBar 
          progress={frame / durationInFrames}
          primaryColor={primaryColor}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Background styles based on visual style
const BackgroundLayer = ({
  visualStyle,
  primaryColor,
  secondaryColor,
  frame,
  colorPalette
}: {
  visualStyle: string;
  primaryColor: string;
  secondaryColor: string;
  frame: number;
  colorPalette?: string[];
}) => {
  const { width, height } = useVideoConfig();
  
  // Default to provided colors
  let bgColors = [primaryColor, secondaryColor];
  
  // Use color palette if available
  if (colorPalette && colorPalette.length >= 2) {
    bgColors = colorPalette.slice(0, 2);
  }
  
  // Different background styles based on visualStyle
  switch (visualStyle.toLowerCase()) {
    case 'cinematic':
      return (
        <AbsoluteFill
          style={{
            background: `linear-gradient(45deg, ${bgColors[0]}88, ${bgColors[1]}88)`,
          }}
        >
          {/* Floating particles for cinematic background */}
          {Array.from({ length: 20 }).map((_, i) => {
            const size = 10 + Math.sin(frame / 50 + i) * 5;
            const x = Math.sin(frame / 100 + i * 10) * width/3 + width/2;
            const y = Math.cos(frame / 120 + i * 10) * height/3 + height/2;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  backgroundColor: i % 2 === 0 ? bgColors[0] : bgColors[1],
                  opacity: 0.3,
                  left: x,
                  top: y,
                }}
              />
            );
          })}
        </AbsoluteFill>
      );
      
    case 'bold':
      return (
        <AbsoluteFill
          style={{
            background: bgColors[1],
            overflow: 'hidden',
          }}
        >
          {/* Bold geometric patterns */}
          {Array.from({ length: 10 }).map((_, i) => {
            const size = width * 0.2 * (1 + Math.sin(frame / 150 + i) * 0.2);
            const rotation = frame / 200 + i * 36;
            const x = Math.sin(i * 0.5) * width - size/2;
            const y = Math.cos(i * 0.5) * height - size/2;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  backgroundColor: bgColors[0],
                  opacity: 0.15,
                  left: x,
                  top: y,
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            );
          })}
        </AbsoluteFill>
      );
      
    case 'sleek':
      return (
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${bgColors[1]}, ${bgColors[0]}66)`,
          }}
        >
          {/* Sleek lines */}
          {Array.from({ length: 8 }).map((_, i) => {
            const y = (height / 8) * i + Math.sin(frame / 60 + i) * 10;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: 1,
                  backgroundColor: bgColors[0],
                  opacity: 0.2,
                  top: y,
                }}
              />
            );
          })}
        </AbsoluteFill>
      );
      
    case 'high-contrast':
    default:
      return (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${50 + Math.sin(frame / 100) * 20}% ${50 + Math.cos(frame / 100) * 20}%, ${bgColors[0]}88, ${bgColors[1]})`,
          }}
        />
      );
  }
};

// Scene content with animations
const SceneContent = ({
  scene,
  progress,
  videoStyle,
  platform,
  textColor,
  isVertical
}: {
  scene: VideoScene;
  progress: number;
  videoStyle: VideoStyle;
  platform: string;
  textColor: string;
  isVertical: boolean;
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Calculate animations based on progress
  const titleOpacity = spring({
    frame: frame,
    fps: 30,
    config: {
      damping: 10,
      mass: 0.5,
    }
  });
  
  const titleY = interpolate(
    titleOpacity,
    [0, 1],
    [height * 0.2 - 50, height * 0.2]
  );
  
  // Content Y position adjusted for vertical/horizontal orientation
  const contentY = isVertical ? height * 0.4 : height * 0.5;
  
  // Choose font based on video style or default
  const fontFamily = videoStyle.customFont || 'Arial, sans-serif';
  
  // Choose text animation based on style
  const textAnimations = videoStyle.textAnimations || ['fade-in', 'slide-from-bottom'];
  const animationType = textAnimations[scene.id.charCodeAt(0) % textAnimations.length];
  
  // Calculate text animation based on type
  let textTransform = '';
  let textOpacity = 1;
  
  if (progress < 0.3) {
    // Entrance animation
    const entranceProgress = progress / 0.3;
    
    switch (animationType) {
      case 'slide-from-bottom':
        textTransform = `translateY(${(1 - entranceProgress) * 50}px)`;
        textOpacity = entranceProgress;
        break;
        
      case 'scale-in':
        textTransform = `scale(${0.5 + entranceProgress * 0.5})`;
        textOpacity = entranceProgress;
        break;
        
      case 'slide-from-side':
        textTransform = `translateX(${(1 - entranceProgress) * (scene.id.charCodeAt(0) % 2 === 0 ? -100 : 100)}px)`;
        textOpacity = entranceProgress;
        break;
        
      default: // fade-in
        textOpacity = entranceProgress;
        break;
    }
  }
  
  return (
    <AbsoluteFill>
      {/* Title with animation */}
      <div
        style={{
          position: 'absolute',
          top: titleY,
          width: '100%',
          textAlign: 'center',
          fontFamily,
          fontSize: isVertical ? width * 0.08 : width * 0.04,
          fontWeight: 'bold',
          color: textColor,
          opacity: titleOpacity,
          padding: '0 40px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        {scene.text.split(' ').map((word, i) => {
          const delay = i * 5;
          const wordSpring = spring({
            frame: frame - delay,
            fps: 30,
            config: {
              damping: 10,
              mass: 0.5,
            }
          });
          
          const wordY = Math.sin(frame / 10 + i) * 3;
          
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: wordSpring,
                transform: `translateY(${wordY}px)`,
                margin: '0 4px',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
      
      {/* Scene content with selected animation */}
      <div
        style={{
          position: 'absolute',
          top: contentY,
          width: '100%',
          textAlign: 'center',
          fontFamily,
          fontSize: isVertical ? width * 0.05 : width * 0.03,
          color: textColor,
          opacity: textOpacity,
          transform: textTransform,
          transition: 'transform 0.5s, opacity 0.5s',
          padding: '0 60px',
        }}
      >
        {scene.id === 'intro' && (
          <div>
            Presenting a video about
            <br />
            <strong style={{ fontSize: '120%' }}>{platform} content</strong>
          </div>
        )}
        
        {scene.id !== 'intro' && scene.id !== 'outro' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              {scene.text}
            </div>
            
            {/* Visual features based on platform */}
            {platform === 'YouTube' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                {/* YouTube-style indicator */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'red',
                    borderRadius: '50%',
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '8px 0 8px 16px',
                      borderColor: 'transparent transparent transparent white',
                      margin: '4px 0 0 6px',
                    }}
                  ></div>
                </div>
                <span>Subscribe for more content!</span>
              </div>
            )}
            
            {platform === 'TikTok' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                {/* TikTok-style follower indicator */}
                <div
                  style={{
                    padding: '5px 15px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: '20px',
                  }}
                >
                  Follow for more
                </div>
              </div>
            )}
          </div>
        )}
        
        {scene.id === 'outro' && (
          <div
            style={{
              fontSize: '130%',
              fontWeight: 'bold',
            }}
          >
            Like and Follow!
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Platform branding
const PlatformBranding = ({
  platform,
  frame,
  primaryColor
}: {
  platform: string;
  frame: number;
  primaryColor: string;
}) => {
  const { width, height } = useVideoConfig();
  const padding = width * 0.02;
  const logoSize = width * 0.05;
  
  // Platform logos
  const renderLogo = () => {
    switch (platform) {
      case 'YouTube':
        return (
          <div
            style={{
              position: 'absolute',
              top: padding,
              left: padding,
              width: logoSize * 1.6,
              height: logoSize,
              backgroundColor: '#FF0000',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: `${logoSize * 0.3}px 0 ${logoSize * 0.3}px ${logoSize * 0.5}px`,
                borderColor: 'transparent transparent transparent white',
              }}
            />
          </div>
        );
        
      case 'TikTok':
        return (
          <div
            style={{
              position: 'absolute',
              top: padding,
              left: padding,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: logoSize * 0.3,
                height: logoSize * 0.3,
                backgroundColor: '#00f2ea',
              }}
            />
            <div
              style={{
                width: logoSize * 0.3,
                height: logoSize * 0.3,
                backgroundColor: '#ff0050',
              }}
            />
            <span
              style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: logoSize * 0.7,
              }}
            >
              TikTok
            </span>
          </div>
        );
        
      case 'Instagram':
        return (
          <div
            style={{
              position: 'absolute',
              top: padding,
              left: padding,
              width: logoSize,
              height: logoSize,
              border: '2px solid white',
              borderRadius: '25%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: logoSize * 0.6,
                height: logoSize * 0.6,
                border: '2px solid white',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: logoSize * 0.2,
                right: logoSize * 0.2,
                width: logoSize * 0.15,
                height: logoSize * 0.15,
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
            />
          </div>
        );
        
      case 'Snapchat':
        return (
          <div
            style={{
              position: 'absolute',
              top: padding,
              left: padding,
              width: logoSize,
              height: logoSize,
              backgroundColor: '#FFFC00',
              borderRadius: '15%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: '25%',
                width: logoSize * 0.2,
                height: logoSize * 0.2,
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '30%',
                right: '25%',
                width: logoSize * 0.2,
                height: logoSize * 0.2,
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div>
      {renderLogo()}
    </div>
  );
};

// Progress bar
const ProgressBar = ({
  progress,
  primaryColor
}: {
  progress: number;
  primaryColor: string;
}) => {
  const { width, height } = useVideoConfig();
  const barHeight = 6;
  const barY = height - barHeight * 2;
  const barWidth = width - 40;
  
  return (
    <div>
      {/* Background bar */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: barY,
          width: barWidth,
          height: barHeight,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        }}
      />
      
      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: barY,
          width: barWidth * progress,
          height: barHeight,
          backgroundColor: primaryColor,
        }}
      />
      
      {/* Animated dot on progress bar */}
      <div
        style={{
          position: 'absolute',
          left: 20 + barWidth * progress - 5,
          top: barY + barHeight / 2 - 5,
          width: 10,
          height: 10,
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export default RemotionVideo;
