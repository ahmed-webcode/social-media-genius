
import React, { useEffect, useRef } from 'react';
import { Player } from '@remotion/player';

interface RemotionVideoProps {
  compositionWidth: number;
  compositionHeight: number;
  durationInFrames?: number;
  fps?: number;
  style?: React.CSSProperties;
  controls?: boolean;
  platform: string;
  styleFeatures: any;
  scenes?: any[];
}

interface SceneProps {
  text: string;
  visualDescription: string;
  duration: number;
  style: any;
  platform: string;
}

// Main scene component
const Scene: React.FC<SceneProps> = ({ text, visualDescription, style, platform }) => {
  const fontFamily = style?.customFont || 'Arial, sans-serif';
  const colorPalette = style?.colorPalette || ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'];
  const mainColor = colorPalette[0];
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        color: '#fff',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Visual background based on platform */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(45deg, ${colorPalette[0]}22, ${colorPalette[1]}22)`,
          zIndex: 0,
        }}
      />
      
      {/* Platform-specific UI elements */}
      {platform === 'TikTok' && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            padding: '5px 10px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '5px',
            fontSize: '14px',
          }}
        >
          @username
        </div>
      )}
      
      {/* Main content */}
      <div
        style={{
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '80%',
        }}
      >
        <h1
          style={{
            fontFamily,
            fontSize: platform === 'YouTube' ? '2.5rem' : '2rem',
            marginBottom: '1rem',
            color: mainColor,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          {text}
        </h1>
        <p
          style={{
            fontFamily,
            fontSize: '1.2rem',
            opacity: 0.9,
          }}
        >
          {visualDescription}
        </p>
      </div>
    </div>
  );
};

const RemotionVideo: React.FC<RemotionVideoProps> = ({
  compositionWidth = 1280,
  compositionHeight = 720,
  durationInFrames = 300,
  fps = 30,
  style,
  controls = true,
  platform,
  styleFeatures,
  scenes = [],
}) => {
  
  // Determine aspect ratio based on platform
  useEffect(() => {
    if (platform === 'TikTok' || platform === 'Instagram' || platform === 'Snapchat') {
      // 9:16 vertical
      compositionWidth = 720;
      compositionHeight = 1280;
    } else {
      // 16:9 horizontal (YouTube)
      compositionWidth = 1280;
      compositionHeight = 720;
    }
  }, [platform]);
  
  // Default scene if none provided
  const defaultScenes = [
    {
      id: 'scene1',
      text: `${platform} Video`,
      visualDescription: `Generated with trained AI model`,
      duration: 5
    }
  ];
  
  const scenesToRender = scenes.length > 0 ? scenes : defaultScenes;

  return (
    <Player
      component={() => <Scene 
        text={scenesToRender[0].text} 
        visualDescription={scenesToRender[0].visualDescription} 
        duration={scenesToRender[0].duration} 
        style={styleFeatures} 
        platform={platform} 
      />}
      durationInFrames={durationInFrames}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      fps={fps}
      style={{ width: '100%', height: 'auto', ...style }}
      controls={controls}
    />
  );
};

export default RemotionVideo;
