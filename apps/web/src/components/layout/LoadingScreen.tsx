'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 3000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simple progress animation without external dependencies
    const startTime = Date.now();
    const targetDuration = duration * 0.8;
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / targetDuration) * 100, 100);
      setProgress(Math.round(progressPercent));
      
      if (progressPercent < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsComplete(true);
        setTimeout(onComplete, 500);
      }
    };
    
    requestAnimationFrame(updateProgress);
  }, [duration, onComplete]);

  return (
    <div className={`fixed inset-0 bg-background z-50 flex items-center justify-center transition-opacity duration-500 ${isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Binary rain background */}
      <div className="binary-rain-container absolute inset-0"></div>
      
      {/* Main loading content */}
      <div className="text-center space-y-8 relative z-10">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-space font-black neon-text">
            CODE RUNNER
          </h1>
          <div className="text-lg font-space" style={{ color: '#ff4e42' }}>
            INITIALIZING NEURAL MATRIX
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-80 mx-auto space-y-4">
          <div className="h-2 bg-card border border-primary/30 rounded-full overflow-hidden glow-border">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(to right, #ff4e42, #ff6b42, #ff8442)',
                boxShadow: '0 0 10px #ff4e42'
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-mono text-muted-foreground">
              LOADING SYSTEMS...
            </span>
            <span className="text-sm font-mono" style={{ color: '#ff4e42' }}>
              {progress}%
            </span>
          </div>
        </div>
        
        {/* Loading dots animation */}
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="loading-dot w-3 h-3 rounded-full"
              style={{ backgroundColor: '#ff4e42' }}
            />
          ))}
        </div>
        
        {/* System status messages */}
        <div className="space-y-2 text-sm font-mono text-muted-foreground">
          <div className={`transition-opacity duration-300 ${progress > 20 ? 'opacity-100' : 'opacity-0'}`}>
            ✓ Quantum processors initialized
          </div>
          <div className={`transition-opacity duration-300 ${progress > 40 ? 'opacity-100' : 'opacity-0'}`}>
            ✓ Neural pathways synchronized  
          </div>
          <div className={`transition-opacity duration-300 ${progress > 60 ? 'opacity-100' : 'opacity-0'}`}>
            ✓ AI compiler modules loaded
          </div>
          <div className={`transition-opacity duration-300 ${progress > 80 ? 'opacity-100' : 'opacity-0'}`}>
            ✓ Security protocols activated
          </div>
          <div className={`transition-opacity duration-300 ${progress > 95 ? 'opacity-100' : 'opacity-0'}`} style={{ color: progress > 95 ? '#ff4e42' : 'inherit' }}>
            ✓ System ready for deployment
          </div>
        </div>
      </div>
    </div>
  );
}