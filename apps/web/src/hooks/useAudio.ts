'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

interface AudioConfig {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

export interface UseAudioReturn {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
  isLoaded: boolean;
}

export function useAudio(src: string, config: AudioConfig = {}): UseAudioReturn {
  const {
    volume = 0.5,
    loop = false,
    preload = true
  } = config;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = loop;
    audio.preload = preload ? 'auto' : 'none';

    const handleCanPlay = () => setIsLoaded(true);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [src, volume, loop, preload]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Audio play failed:', error);
        });
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  return {
    play,
    pause,
    stop,
    setVolume,
    isPlaying,
    isLoaded
  };
}

export function useAudioManager() {
  const backgroundMusic = useAudio('/audio/music-highq.ogg', {
    loop: true,
    volume: 0.3,
    preload: true
  });

  const buttonClick = useAudio('/audio/Deploy_Click.ogg', {
    volume: 0.6,
    preload: true
  });

  const cardHover = useAudio('/audio/card_sound.ogg', {
    volume: 0.4,
    preload: true
  });

  const [isBackgroundMusicEnabled, setIsBackgroundMusicEnabled] = useState(false);
  const [isSoundEffectsEnabled, setIsSoundEffectsEnabled] = useState(true);

  const playBackgroundMusic = useCallback(() => {
    if (isBackgroundMusicEnabled && !backgroundMusic.isPlaying) {
      backgroundMusic.play();
    }
  }, [isBackgroundMusicEnabled, backgroundMusic]);

  const stopBackgroundMusic = useCallback(() => {
    backgroundMusic.stop();
  }, [backgroundMusic]);

  const playButtonClick = useCallback(() => {
    if (isSoundEffectsEnabled) {
      buttonClick.play();
    }
  }, [isSoundEffectsEnabled, buttonClick]);

  const playCardHover = useCallback(() => {
    if (isSoundEffectsEnabled) {
      cardHover.play();
    }
  }, [isSoundEffectsEnabled, cardHover]);

  const toggleBackgroundMusic = useCallback(() => {
    const newState = !isBackgroundMusicEnabled;
    setIsBackgroundMusicEnabled(newState);
    
    if (newState) {
      backgroundMusic.play();
    } else {
      backgroundMusic.stop();
    }
  }, [isBackgroundMusicEnabled, backgroundMusic]);

  const toggleSoundEffects = useCallback(() => {
    setIsSoundEffectsEnabled(!isSoundEffectsEnabled);
  }, [isSoundEffectsEnabled]);

  return {
    playBackgroundMusic,
    stopBackgroundMusic,
    playButtonClick,
    playCardHover,
    toggleBackgroundMusic,
    toggleSoundEffects,
    isBackgroundMusicEnabled,
    isSoundEffectsEnabled,
    backgroundMusic,
    buttonClick,
    cardHover
  };
}