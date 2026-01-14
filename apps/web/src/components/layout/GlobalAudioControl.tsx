'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function GlobalAudioControl() {
  const { toggleBackgroundMusic, isBackgroundMusicEnabled, playButtonClick } = useGlobalAudio();
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Get theme colors based on current page
  const getThemeColors = () => {
    if (pathname === '/login') {
      return {
        primary: '#00ff00', // Green
        primaryRgba: '0, 255, 0',
        background: 'rgba(0, 100, 0, 0.2)',
        border: 'rgba(0, 255, 0, 0.3)',
        glow: 'rgba(0, 255, 0, 0.3)'
      };
    } else if (pathname === '/boot') {
      return {
        primary: '#ff4e42', // Orange/Red for boot (same as home)
        primaryRgba: '255, 78, 66',
        background: 'rgba(139, 69, 19, 0.2)',
        border: 'rgba(255, 78, 66, 0.3)',
        glow: 'rgba(255, 78, 66, 0.3)'
      };
    } else if (pathname?.includes('/compiler')) {
      return {
        primary: '#40ffff', // Cyan
        primaryRgba: '64, 255, 255',
        background: 'rgba(0, 139, 139, 0.2)',
        border: 'rgba(64, 255, 255, 0.3)',
        glow: 'rgba(64, 255, 255, 0.3)'
      };
    } else if (pathname?.includes('/missions')) {
      return {
        primary: '#9f40ff', // Purple
        primaryRgba: '159, 64, 255',
        background: 'rgba(75, 0, 130, 0.2)',
        border: 'rgba(159, 64, 255, 0.3)',
        glow: 'rgba(159, 64, 255, 0.3)'
      };
    } else if (pathname?.includes('/levels')) {
      return {
        primary: '#40ff80', // Light Green for levels
        primaryRgba: '64, 255, 128',
        background: 'rgba(0, 120, 60, 0.2)',
        border: 'rgba(64, 255, 128, 0.3)',
        glow: 'rgba(64, 255, 128, 0.3)'
      };
    } else if (pathname?.includes('/problems')) {
      return {
        primary: '#ff8040', // Orange for problems
        primaryRgba: '255, 128, 64',
        background: 'rgba(139, 69, 19, 0.2)',
        border: 'rgba(255, 128, 64, 0.3)',
        glow: 'rgba(255, 128, 64, 0.3)'
      };
    } else if (pathname?.includes('/profile') || pathname?.includes('/rank')) {
      return {
        primary: '#ffd700', // Gold for profile/rank
        primaryRgba: '255, 215, 0',
        background: 'rgba(139, 117, 0, 0.2)',
        border: 'rgba(255, 215, 0, 0.3)',
        glow: 'rgba(255, 215, 0, 0.3)'
      };
    } else {
      // Default theme (home page and root)
      return {
        primary: '#ff4e42', // Orange/Red
        primaryRgba: '255, 78, 66',
        background: 'rgba(139, 69, 19, 0.2)',
        border: 'rgba(255, 78, 66, 0.3)',
        glow: 'rgba(255, 78, 66, 0.3)'
      };
    }
  };

  const themeColors = getThemeColors();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => {
          // Only play click sound if audio is currently enabled
          if (isBackgroundMusicEnabled) {
            playButtonClick();
          }
          toggleBackgroundMusic();
        }}
        className="group relative p-3 backdrop-blur-sm transition-all duration-300"
        style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
          backgroundColor: themeColors.background,
          border: `2px solid ${themeColors.border}`,
          boxShadow: `0 0 10px ${themeColors.glow}`,
        }}
      >
        {/* Hexagon Glow effect */}
        <div
          className="absolute -inset-2 blur opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            backgroundColor: themeColors.glow,
            boxShadow: `0 0 20px ${themeColors.glow}, inset 0 0 10px ${themeColors.glow}`
          }}
        ></div>

        {/* Additional outer glow for more intensity */}
        <div
          className="absolute -inset-3 blur-md opacity-30 group-hover:opacity-50 transition-opacity"
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            backgroundColor: themeColors.glow
          }}
        ></div>

        {/* Icon */}
        <div className="relative">
          {!isMounted ? (
            // Default state during SSR to match initial server render
            <Volume2 className="w-5 h-5 animate-pulse" style={{ color: themeColors.primary }} />
          ) : isBackgroundMusicEnabled ? (
            <Volume2 className="w-5 h-5 animate-pulse" style={{ color: themeColors.primary }} />
          ) : (
            <VolumeX className="w-5 h-5 transition-colors" style={{ color: themeColors.primary, opacity: 0.6 }} />
          )}
        </div>

        {/* Tooltip */}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs font-space rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          style={{
            backgroundColor: themeColors.background,
            border: `1px solid ${themeColors.border}`,
            boxShadow: `0 0 5px ${themeColors.glow}`
          }}
        >
          <span style={{ color: themeColors.primary }}>
            AUDIO {!isMounted || isBackgroundMusicEnabled ? 'ON' : 'OFF'}
          </span>
          <div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent"
            style={{ borderBottomColor: themeColors.border }}
          ></div>
        </div>
      </button>
    </div>
  );
}