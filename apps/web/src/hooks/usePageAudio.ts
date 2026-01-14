'use client';

import { useEffect, useRef } from 'react';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { usePathname, useRouter } from 'next/navigation';

export type PageAudioType = 'background' | 'mission' | 'profile';

interface UsePageAudioOptions {
  audioType: PageAudioType;
  enabled?: boolean;
  delay?: number;
}

export function usePageAudio({ audioType, enabled = true, delay = 50 }: UsePageAudioOptions) {
  const { forcePlayBackgroundMusic, forcePlayMissionMusic, forcePlayProfileMusic } = useGlobalAudio();
  const pathname = usePathname();
  const router = useRouter();
  const hasInitialized = useRef(false);
  const currentPath = useRef(pathname);
  const isPlaying = useRef(false);

  useEffect(() => {
    // Update current path
    currentPath.current = pathname;

    if (!enabled) return;

    const playPageAudio = async () => {
      // Prevent duplicate calls
      if (isPlaying.current) {
        console.log(`${audioType} music already being initialized`);
        return;
      }

      isPlaying.current = true;

      try {
        console.log(`Attempting to play ${audioType} music for page: ${pathname}`);

        switch (audioType) {
          case 'background':
            await forcePlayBackgroundMusic();
            break;
          case 'mission':
            await forcePlayMissionMusic();
            break;
          case 'profile':
            await forcePlayProfileMusic();
            break;
        }

        hasInitialized.current = true;
        isPlaying.current = false;
      } catch (error) {
        isPlaying.current = false;
        // Don't log the error - it's expected for autoplay policy
        console.log(`Waiting for user interaction to play ${audioType} music`);
        
        // Set up user interaction handlers for fallback
        const handleUserInteraction = async () => {
          // Only trigger if we're still on the same page and not already playing
          if (currentPath.current === pathname && !isPlaying.current) {
            isPlaying.current = true;
            try {
              switch (audioType) {
                case 'background':
                  await forcePlayBackgroundMusic();
                  break;
                case 'mission':
                  await forcePlayMissionMusic();
                  break;
                case 'profile':
                  await forcePlayProfileMusic();
                  break;
              }
              hasInitialized.current = true;
            } catch (e) {
              console.warn(`Failed to play ${audioType} music on user interaction:`, e);
            } finally {
              isPlaying.current = false;
            }
          }
          
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
        };

        document.addEventListener('click', handleUserInteraction, { once: true });
        document.addEventListener('keydown', handleUserInteraction, { once: true });
        document.addEventListener('touchstart', handleUserInteraction, { once: true });

        // Cleanup function for user interaction handlers
        return () => {
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
        };
      }
    };

    // Use requestAnimationFrame for better timing and immediate response
    let animationId: number;
    let timeoutId: NodeJS.Timeout;
    
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        animationId = requestAnimationFrame(playPageAudio);
      }, delay);
    } else {
      animationId = requestAnimationFrame(playPageAudio);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
      isPlaying.current = false;
    };
  }, [audioType, enabled, delay, pathname, forcePlayBackgroundMusic, forcePlayMissionMusic, forcePlayProfileMusic]);

  return { hasInitialized: hasInitialized.current };
}