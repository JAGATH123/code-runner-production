'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useAudioManager } from '@/hooks/useAudio';

export function AudioControl() {
  const { playButtonClick, toggleBackgroundMusic, isBackgroundMusicEnabled } = useAudioManager();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => {
          playButtonClick();
          toggleBackgroundMusic();
        }}
        className="group relative p-3 rounded-full bg-card/80 backdrop-blur-sm border border-primary/30 hover:border-neon-cyan/50 hover:bg-primary/10 transition-all duration-300 glow-border hover:shadow-lg hover:shadow-neon-cyan/20"
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-neon-cyan/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Icon */}
        <div className="relative">
          {isBackgroundMusicEnabled ? (
            <Volume2 className="w-5 h-5 text-neon-cyan animate-pulse" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-space bg-card/90 border border-primary/20 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <span className={isBackgroundMusicEnabled ? 'text-neon-cyan' : 'text-muted-foreground'}>
            AUDIO {isBackgroundMusicEnabled ? 'ON' : 'OFF'}
          </span>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-primary/20"></div>
        </div>
      </button>
    </div>
  );
}