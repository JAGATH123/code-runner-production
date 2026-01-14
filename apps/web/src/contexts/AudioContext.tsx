'use client';

import { createContext, useContext, useCallback, useRef, useEffect, useState, ReactNode } from 'react';

interface AudioConfig {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

interface GlobalAudioState {
  backgroundMusic: HTMLAudioElement | null;
  missionMusic: HTMLAudioElement | null;
  profileMusic: HTMLAudioElement | null;
  buttonClick: HTMLAudioElement | null;
  cardHover: HTMLAudioElement | null;
  beepsSound: HTMLAudioElement | null;
  projectTextSound: HTMLAudioElement | null;
  isBackgroundMusicEnabled: boolean;
  isSoundEffectsEnabled: boolean;
  isBackgroundMusicPlaying: boolean;
  isMissionMusicPlaying: boolean;
  isProfileMusicPlaying: boolean;
}

interface AudioContextType extends GlobalAudioState {
  playBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  playMissionMusic: () => void;
  pauseMissionMusic: () => void;
  stopMissionMusic: () => void;
  playProfileMusic: () => void;
  pauseProfileMusic: () => void;
  stopProfileMusic: () => void;
  playButtonClick: () => void;
  playCardHover: () => void;
  playBeepsSound: () => void;
  playProjectTextSound: () => void;
  toggleBackgroundMusic: () => void;
  toggleSoundEffects: () => void;
  forcePlayBackgroundMusic: () => void;
  forcePlayMissionMusic: () => void;
  forcePlayProfileMusic: () => void;
  getCurrentMusicType: () => string | null;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Global audio storage to persist across page changes
let globalAudioState: GlobalAudioState = {
  backgroundMusic: null,
  missionMusic: null,
  profileMusic: null,
  buttonClick: null,
  cardHover: null,
  beepsSound: null,
  projectTextSound: null,
  isBackgroundMusicEnabled: true,
  isSoundEffectsEnabled: true,
  isBackgroundMusicPlaying: false,
  isMissionMusicPlaying: false,
  isProfileMusicPlaying: false,
};

// Keep track of current music type to prevent conflicts
let currentMusicType: 'background' | 'mission' | 'profile' | null = null;

// Track if music was already started to prevent restarts
let musicStartedFor: 'background' | 'mission' | 'profile' | null = null;

// Add timeout for music switching
let musicSwitchTimeout: NodeJS.Timeout | null = null;

// Function to stop all music with immediate effect
const stopAllMusic = () => {
  // Clear any pending music switches
  if (musicSwitchTimeout) {
    clearTimeout(musicSwitchTimeout);
    musicSwitchTimeout = null;
  }
  
  if (globalAudioState.backgroundMusic && !globalAudioState.backgroundMusic.paused) {
    globalAudioState.backgroundMusic.pause();
    globalAudioState.isBackgroundMusicPlaying = false;
  }
  if (globalAudioState.missionMusic && !globalAudioState.missionMusic.paused) {
    globalAudioState.missionMusic.pause();
    globalAudioState.isMissionMusicPlaying = false;
  }
  if (globalAudioState.profileMusic && !globalAudioState.profileMusic.paused) {
    globalAudioState.profileMusic.pause();
    globalAudioState.isProfileMusicPlaying = false;
  }
  currentMusicType = null;
  musicStartedFor = null;
};

// Improved music switching with immediate response
const switchMusicTo = async (type: 'background' | 'mission' | 'profile') => {
  // Clear any pending switches
  if (musicSwitchTimeout) {
    clearTimeout(musicSwitchTimeout);
    musicSwitchTimeout = null;
  }
  
  // If the same music is already playing, don't restart it
  if (currentMusicType === type && musicStartedFor === type) {
    console.log(`${type} music already playing, skipping restart`);
    return;
  }
  
  // Immediately stop all music
  stopAllMusic();
  
  // Set state immediately to prevent race conditions
  currentMusicType = type;
  musicStartedFor = type;
  
  // Get the audio element
  let audioElement: HTMLAudioElement | null = null;
  switch (type) {
    case 'background':
      audioElement = globalAudioState.backgroundMusic;
      break;
    case 'mission':
      audioElement = globalAudioState.missionMusic;
      break;
    case 'profile':
      audioElement = globalAudioState.profileMusic;
      break;
  }
  
  if (audioElement && globalAudioState.isBackgroundMusicEnabled) {
    try {
      // Ensure audio is ready
      if (audioElement.readyState < 2) { // HAVE_CURRENT_DATA
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            audioElement!.removeEventListener('canplay', onCanPlay);
            audioElement!.removeEventListener('error', onError);
            resolve(undefined);
          };
          const onError = () => {
            audioElement!.removeEventListener('canplay', onCanPlay);
            audioElement!.removeEventListener('error', onError);
            reject(new Error('Audio failed to load'));
          };
          audioElement!.addEventListener('canplay', onCanPlay);
          audioElement!.addEventListener('error', onError);
          
          // Trigger loading if not already loading
          if (audioElement!.readyState === 0) {
            audioElement!.load();
          }
        });
      }
      
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`${type} music started successfully`);
          })
          .catch(() => {
            // Silently catch autoplay errors - don't log or throw
            // The error will be handled by the calling code
          });
        await playPromise;
      }
    } catch (error) {
      // Silently catch all autoplay errors
      currentMusicType = null;
      musicStartedFor = null;
      throw error;
    }
  }
};

// Initialize audio objects only once
const initializeAudioObjects = () => {
  if (typeof window === 'undefined') return;

  if (!globalAudioState.backgroundMusic) {
    const bgMusic = new Audio('/audio/music-highq.ogg');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    bgMusic.preload = 'auto';
    
    bgMusic.addEventListener('play', () => {
      globalAudioState.isBackgroundMusicPlaying = true;
    });
    
    bgMusic.addEventListener('pause', () => {
      globalAudioState.isBackgroundMusicPlaying = false;
    });
    
    bgMusic.addEventListener('ended', () => {
      globalAudioState.isBackgroundMusicPlaying = false;
    });
    
    globalAudioState.backgroundMusic = bgMusic;
  }

  if (!globalAudioState.missionMusic) {
    const missionMusic = new Audio('/audio/scott-buckley-passage-of-time.mp3');
    missionMusic.loop = true;
    missionMusic.volume = 0.4;
    missionMusic.preload = 'auto';
    
    missionMusic.addEventListener('play', () => {
      globalAudioState.isMissionMusicPlaying = true;
    });
    
    missionMusic.addEventListener('pause', () => {
      globalAudioState.isMissionMusicPlaying = false;
    });
    
    missionMusic.addEventListener('ended', () => {
      globalAudioState.isMissionMusicPlaying = false;
    });
    
    globalAudioState.missionMusic = missionMusic;
  }

  if (!globalAudioState.profileMusic) {
    const profileMusic = new Audio('/audio/lesion-x-a-journey-through-the-universe-1.mp3');
    profileMusic.loop = true;
    profileMusic.volume = 0.4;
    profileMusic.preload = 'auto';
    
    profileMusic.addEventListener('play', () => {
      globalAudioState.isProfileMusicPlaying = true;
    });
    
    profileMusic.addEventListener('pause', () => {
      globalAudioState.isProfileMusicPlaying = false;
    });
    
    profileMusic.addEventListener('ended', () => {
      globalAudioState.isProfileMusicPlaying = false;
    });
    
    globalAudioState.profileMusic = profileMusic;
  }

  if (!globalAudioState.buttonClick) {
    const buttonClickAudio = new Audio('/audio/Deploy_Click.ogg');
    buttonClickAudio.volume = 0.6;
    buttonClickAudio.preload = 'auto';
    globalAudioState.buttonClick = buttonClickAudio;
  }

  if (!globalAudioState.cardHover) {
    const cardHoverAudio = new Audio('/audio/card_sound.ogg');
    cardHoverAudio.volume = 0.4;
    cardHoverAudio.preload = 'auto';
    globalAudioState.cardHover = cardHoverAudio;
  }

  if (!globalAudioState.beepsSound) {
    const beepsAudio = new Audio('/audio/beeps2.ogg');
    beepsAudio.volume = 0.5;
    beepsAudio.preload = 'auto';
    globalAudioState.beepsSound = beepsAudio;
  }

  if (!globalAudioState.projectTextSound) {
    const projectTextAudio = new Audio('/audio/project-text.ogg');
    projectTextAudio.volume = 0.7;
    projectTextAudio.preload = 'auto';
    globalAudioState.projectTextSound = projectTextAudio;
  }
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GlobalAudioState>(() => {
    // Load state from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audioSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        globalAudioState = { ...globalAudioState, ...parsed };
      }
    }
    return globalAudioState;
  });

  useEffect(() => {
    initializeAudioObjects();
    setState({ ...globalAudioState });
    
    // Handle page visibility changes to prevent audio conflicts
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is now hidden, pause all audio to prevent conflicts
        stopAllMusic();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const settingsToSave = {
        isBackgroundMusicEnabled: state.isBackgroundMusicEnabled,
        isSoundEffectsEnabled: state.isSoundEffectsEnabled,
      };
      localStorage.setItem('audioSettings', JSON.stringify(settingsToSave));
    }
  }, [state.isBackgroundMusicEnabled, state.isSoundEffectsEnabled]);

  const playBackgroundMusic = useCallback(async () => {
    if (!globalAudioState.isBackgroundMusicEnabled) return;
    await switchMusicTo('background');
  }, []);

  const pauseBackgroundMusic = useCallback(() => {
    if (globalAudioState.backgroundMusic && !globalAudioState.backgroundMusic.paused) {
      globalAudioState.backgroundMusic.pause();
    }
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    if (globalAudioState.backgroundMusic) {
      globalAudioState.backgroundMusic.pause();
      // Don't reset currentTime to preserve position
    }
  }, []);

  const playButtonClick = useCallback(() => {
    // Check BOTH music enabled AND sound effects enabled
    if (globalAudioState.buttonClick && 
        globalAudioState.isSoundEffectsEnabled && 
        globalAudioState.isBackgroundMusicEnabled) {
      // Reset sound effect to beginning for immediate playback
      globalAudioState.buttonClick.currentTime = 0;
      const playPromise = globalAudioState.buttonClick.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently ignore autoplay errors for sound effects
        });
      }
    }
  }, []);

  const playCardHover = useCallback(() => {
    // Check BOTH music enabled AND sound effects enabled
    if (globalAudioState.cardHover && 
        globalAudioState.isSoundEffectsEnabled && 
        globalAudioState.isBackgroundMusicEnabled) {
      // Reset sound effect to beginning for immediate playback
      globalAudioState.cardHover.currentTime = 0;
      const playPromise = globalAudioState.cardHover.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently ignore autoplay errors for sound effects
        });
      }
    }
  }, []);

  const playMissionMusic = useCallback(async () => {
    if (!globalAudioState.isBackgroundMusicEnabled) {
      console.log('Mission music blocked - audio disabled');
      return;
    }
    await switchMusicTo('mission');
  }, []);

  const pauseMissionMusic = useCallback(() => {
    if (globalAudioState.missionMusic && !globalAudioState.missionMusic.paused) {
      globalAudioState.missionMusic.pause();
    }
  }, []);

  const stopMissionMusic = useCallback(() => {
    if (globalAudioState.missionMusic) {
      globalAudioState.missionMusic.pause();
      // Don't reset currentTime to preserve position
    }
  }, []);

  const playProfileMusic = useCallback(async () => {
    if (!globalAudioState.isBackgroundMusicEnabled) return;
    await switchMusicTo('profile');
  }, []);

  const pauseProfileMusic = useCallback(() => {
    if (globalAudioState.profileMusic && !globalAudioState.profileMusic.paused) {
      globalAudioState.profileMusic.pause();
    }
  }, []);

  const stopProfileMusic = useCallback(() => {
    if (globalAudioState.profileMusic) {
      globalAudioState.profileMusic.pause();
      // Don't reset currentTime to preserve position
    }
  }, []);

  const playBeepsSound = useCallback(() => {
    // Check BOTH music enabled AND sound effects enabled
    if (globalAudioState.beepsSound && 
        globalAudioState.isSoundEffectsEnabled && 
        globalAudioState.isBackgroundMusicEnabled) {
      // Reset sound effect to beginning for immediate playback
      globalAudioState.beepsSound.currentTime = 0;
      const playPromise = globalAudioState.beepsSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently ignore autoplay errors for sound effects
        });
      }
    }
  }, []);

  const playProjectTextSound = useCallback(() => {
    // Check BOTH music enabled AND sound effects enabled
    if (globalAudioState.projectTextSound && 
        globalAudioState.isSoundEffectsEnabled && 
        globalAudioState.isBackgroundMusicEnabled) {
      // Reset sound effect to beginning for immediate playback
      globalAudioState.projectTextSound.currentTime = 0;
      const playPromise = globalAudioState.projectTextSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently ignore autoplay errors for sound effects
        });
      }
    }
  }, []);

  const toggleBackgroundMusic = useCallback(() => {
    const newState = !globalAudioState.isBackgroundMusicEnabled;
    globalAudioState.isBackgroundMusicEnabled = newState;
    
    if (newState) {
      // When enabled, start the background music
      playBackgroundMusic();
    } else {
      // When disabled, stop ALL music
      stopAllMusic();
    }
    
    setState({ ...globalAudioState });
  }, [playBackgroundMusic]);

  const toggleSoundEffects = useCallback(() => {
    globalAudioState.isSoundEffectsEnabled = !globalAudioState.isSoundEffectsEnabled;
    setState({ ...globalAudioState });
  }, []);

  // Force play functions that ignore current state and always switch music
  const forcePlayBackgroundMusic = useCallback(async () => {
    if (!globalAudioState.isBackgroundMusicEnabled) return;
    
    console.log('Force playing background music');
    // Reset state to force restart
    currentMusicType = null;
    musicStartedFor = null;
    await switchMusicTo('background');
  }, []);

  const forcePlayMissionMusic = useCallback(async () => {
    if (!globalAudioState.isBackgroundMusicEnabled) return;
    
    console.log('Force playing mission music');
    // Reset state to force restart
    currentMusicType = null;
    musicStartedFor = null;
    await switchMusicTo('mission');
  }, []);

  const forcePlayProfileMusic = useCallback(async () => {
    if (!globalAudioState.isBackgroundMusicEnabled) return;
    
    console.log('Force playing profile music');
    // Reset state to force restart
    currentMusicType = null;
    musicStartedFor = null;
    await switchMusicTo('profile');
  }, []);

  const getCurrentMusicType = useCallback(() => {
    return currentMusicType;
  }, []);


  const value: AudioContextType = {
    ...state,
    playBackgroundMusic,
    pauseBackgroundMusic,
    stopBackgroundMusic,
    playMissionMusic,
    pauseMissionMusic,
    stopMissionMusic,
    playProfileMusic,
    pauseProfileMusic,
    stopProfileMusic,
    playButtonClick,
    playCardHover,
    playBeepsSound,
    playProjectTextSound,
    toggleBackgroundMusic,
    toggleSoundEffects,
    forcePlayBackgroundMusic,
    forcePlayMissionMusic,
    forcePlayProfileMusic,
    getCurrentMusicType,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useGlobalAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useGlobalAudio must be used within an AudioProvider');
  }
  return context;
}