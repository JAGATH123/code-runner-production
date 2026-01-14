'use client';

import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface BackgroundContextType {
  triggerGridPulse: (intensity?: number) => void;
  setStarIntensity: (intensity: number) => void;
  addTemporaryGlow: (x: number, y: number, intensity: number) => void;
}

const BackgroundContext = createContext<BackgroundContextType | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const backgroundRef = useRef<BackgroundContextType>({
    triggerGridPulse: () => {},
    setStarIntensity: () => {},
    addTemporaryGlow: () => {},
  });

  return (
    <BackgroundContext.Provider value={backgroundRef.current}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    return {
      triggerGridPulse: () => {},
      setStarIntensity: () => {},
      addTemporaryGlow: () => {},
    };
  }
  return context;
}