'use client';

import type { Level } from '@/lib/types';
import Link from 'next/link';
import { ArrowRight, Lock, Zap, Target, CheckCircle, Play } from 'lucide-react';
import { useProgress } from '@/lib/utilities/progress';
import { useState, useEffect } from 'react';
import { useGlobalAudio } from '@/contexts/AudioContext';

interface LevelListProps {
  levels: Level[];
}

export function LevelList({ levels }: LevelListProps) {
  const progress = useProgress();
  const [mounted, setMounted] = useState(false);
  const { playProjectTextSound, playCardHover } = useGlobalAudio();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder while client-side hydration happens
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {levels.map((level) => (
          <div key={level.level_id} className="h-96 bg-space-gray/20 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  const getStatusInfo = (level: Level) => {
    const isCompleted = progress.isLevelCompleted(level.age_group, level.level_number);
    const isUnlocked = progress.isLevelUnlocked(level.age_group, level.level_number);

    if (isCompleted) {
      return {
        status: 'completed',
        statusIcon: <CheckCircle className="w-4 h-4 text-neon-green" />,
        statusText: 'COMPLETE',
        statusColor: 'text-neon-green',
        badgeClass: 'bg-neon-green/20 text-neon-green border-neon-green/40',
        buttonText: 'REVIEW',
        buttonIcon: <Target className="mr-2 h-4 w-4" />,
        glowColor: '#00ff88'
      };
    }

    if (isUnlocked) {
      return {
        status: 'unlocked',
        statusIcon: <Play className="w-4 h-4 text-neon-cyan animate-pulse" />,
        statusText: 'READY',
        statusColor: 'text-neon-cyan',
        badgeClass: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40',
        buttonText: 'INITIALIZE',
        buttonIcon: <Zap className="mr-2 h-4 w-4" />,
        glowColor: '#00ffff'
      };
    }

    return {
      status: 'locked',
      statusIcon: <Lock className="w-4 h-4 text-muted-foreground" />,
      statusText: 'LOCKED',
      statusColor: 'text-muted-foreground',
      badgeClass: 'bg-muted/20 text-muted-foreground border-muted/40',
      buttonText: 'LOCKED',
      buttonIcon: null,
      glowColor: '#666666'
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {levels.map((level, index) => {
        const statusInfo = getStatusInfo(level);
        const isLocked = statusInfo.status === 'locked';
        const isCompleted = statusInfo.status === 'completed';

        return (
          <div
            key={level.level_id}
            className="relative transition-all duration-500 hover:scale-105"
            onMouseEnter={() => !isLocked && playCardHover()}
          >
            {/* SVG Filter Definition */}
            <svg className="absolute" style={{ width: 0, height: 0 }}>
              <defs>
                <filter
                  id={`turbulent-displace-${index}`}
                  colorInterpolationFilters="sRGB"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feTurbulence
                    type="turbulence"
                    baseFrequency="0.02"
                    numOctaves="10"
                    result="noise1"
                    seed="1"
                  />
                  <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                    <animate
                      attributeName="dy"
                      values="700; 0"
                      dur="6s"
                      repeatCount="indefinite"
                      calcMode="linear"
                    />
                  </feOffset>
                  <feTurbulence
                    type="turbulence"
                    baseFrequency="0.02"
                    numOctaves="10"
                    result="noise2"
                    seed="1"
                  />
                  <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                    <animate
                      attributeName="dy"
                      values="0; -700"
                      dur="6s"
                      repeatCount="indefinite"
                      calcMode="linear"
                    />
                  </feOffset>
                  <feComposite in="offsetNoise1" in2="offsetNoise2" result="combinedNoise" />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="combinedNoise"
                    scale="15"
                    xChannelSelector="R"
                    yChannelSelector="B"
                  />
                </filter>
              </defs>
            </svg>

            {/* Card Container with Electric Border */}
            <div
              className="relative p-0.5 rounded-3xl"
              style={{
                background: `linear-gradient(-30deg, ${isLocked ? 'rgba(100, 100, 100, 0.4)' : isCompleted ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 255, 0.4)'}, transparent, ${isLocked ? 'rgba(100, 100, 100, 0.4)' : isCompleted ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 255, 0.4)'}), linear-gradient(to bottom, rgba(10, 14, 23, 1), rgba(10, 14, 23, 1))`
              }}
            >
              {/* Inner Container */}
              <div className="relative">
                {/* Border Outer */}
                <div
                  className="border-2 rounded-3xl pr-1 pb-1"
                  style={{ borderColor: isLocked ? 'rgba(100, 100, 100, 0.5)' : isCompleted ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 255, 255, 0.5)' }}
                >
                  {/* Main Card */}
                  <div
                    className="w-full h-96 rounded-3xl border-2 -mt-1 -ml-1 relative overflow-hidden"
                    style={{
                      borderColor: isLocked ? '#666666' : isCompleted ? '#00ff88' : '#00ffff',
                      background: 'rgba(10, 14, 23, 0.95)'
                    }}
                  >
                    {/* Content Container */}
                    <div className="absolute inset-0 w-full h-full flex flex-col">
                      {/* Content Top */}
                      <div className="flex flex-col p-6 pb-4 h-full">
                        {/* Mission Number and Status Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className="flex items-center gap-2 px-3 py-1 rounded-lg"
                            style={{
                              background: isLocked ? 'rgba(100, 100, 100, 0.2)' : isCompleted ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 255, 255, 0.2)',
                              border: `1px solid ${isLocked ? 'rgba(100, 100, 100, 0.3)' : isCompleted ? 'rgba(0, 255, 136, 0.3)' : 'rgba(0, 255, 255, 0.3)'}`
                            }}
                          >
                            <Target className="w-4 h-4" style={{ color: isLocked ? '#666666' : isCompleted ? '#00ff88' : '#00ffff' }} />
                            <span className="text-xs font-space font-bold" style={{ color: isLocked ? '#666666' : isCompleted ? '#00ff88' : '#00ffff' }}>
                              MISSION {level.level_number}
                            </span>
                          </div>
                          <div
                            className="px-2 py-1 rounded-full text-xs font-space font-bold flex items-center gap-1"
                            style={{
                              background: 'radial-gradient(47.2% 50% at 50.39% 88.37%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: isLocked ? '#666666' : isCompleted ? '#00ff88' : '#00ffff'
                            }}
                          >
                            {statusInfo.statusIcon}
                            <span>{statusInfo.statusText}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-space font-bold mb-3" style={{ color: '#f3ede9' }}>
                          {level.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm leading-relaxed mb-4" style={{ color: '#f3ede9', opacity: isLocked ? 0.5 : 0.7 }}>
                          {level.description}
                        </p>

                        {/* Divider */}
                        <hr
                          className="mt-auto mb-4 border-none h-px opacity-20"
                          style={{
                            background: 'currentColor',
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)',
                            maskImage: 'linear-gradient(to right, transparent, black, transparent)'
                          }}
                        />

                        {/* Protocol Status */}
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-4 h-4" style={{ color: isLocked ? '#666666' : isCompleted ? '#00ff88' : '#00ffff' }} />
                          <span className="text-xs font-space font-semibold" style={{ color: isLocked ? '#666666' : isCompleted ? '#00ff88' : '#00ffff' }}>
                            {statusInfo.status === 'completed' ? 'MISSION COMPLETE' : 'NEURAL PROTOCOL'}
                          </span>
                        </div>
                      </div>

                      {/* Content Bottom */}
                      <div className="flex flex-col p-6 pt-0">
                        {isLocked ? (
                          <div className="flex flex-col gap-2">
                            <div
                              className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-space font-semibold text-sm cursor-not-allowed"
                              style={{
                                background: 'rgba(100, 100, 100, 0.2)',
                                border: '1px solid rgba(100, 100, 100, 0.3)',
                                color: '#666666'
                              }}
                            >
                              <Lock className="w-4 h-4" />
                              <span>LOCKED</span>
                            </div>
                            <p className="text-xs text-center font-mono" style={{ color: '#666666', opacity: 0.7 }}>
                              Complete Mission {level.level_number - 1} first
                            </p>
                          </div>
                        ) : (
                          <Link
                            href={`/levels/${level.age_group}/${level.level_number}`}
                            onClick={() => playProjectTextSound()}
                            className="w-full"
                          >
                            <div
                              className="w-full py-3 px-4 rounded-lg flex items-center justify-between font-space font-semibold text-sm transition-all hover:scale-105"
                              style={{
                                background: isCompleted ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 255, 255, 0.2)',
                                border: `1px solid ${isCompleted ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 255, 0.4)'}`,
                                color: isCompleted ? '#00ff88' : '#00ffff'
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {statusInfo.buttonIcon}
                                <span>{statusInfo.buttonText}</span>
                              </div>
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glow Layers - Only if not locked */}
                {!isLocked && (
                  <>
                    <div
                      className="absolute inset-0 w-full h-full border-2 rounded-3xl pointer-events-none"
                      style={{
                        borderColor: isCompleted ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 255, 255, 0.6)',
                        filter: `blur(1px) url(#turbulent-displace-${index})`
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 w-full h-full border-2 rounded-3xl pointer-events-none"
                      style={{
                        borderColor: isCompleted ? '#00ff88' : '#00ffff',
                        filter: `blur(4px) url(#turbulent-displace-${index})`
                      }}
                    ></div>
                  </>
                )}
              </div>

              {/* Overlay Effects - Only if not locked */}
              {!isLocked && (
                <>
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl opacity-100 scale-110 pointer-events-none"
                    style={{
                      mixBlendMode: 'overlay',
                      filter: 'blur(16px)',
                      background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl opacity-50 scale-110 pointer-events-none"
                    style={{
                      mixBlendMode: 'overlay',
                      filter: 'blur(16px)',
                      background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                    }}
                  ></div>
                </>
              )}

              {/* Background Glow - Only if not locked */}
              {!isLocked && (
                <div
                  className="absolute inset-0 w-full h-full rounded-3xl -z-10 scale-110 opacity-30"
                  style={{
                    filter: 'blur(32px)',
                    background: `linear-gradient(-30deg, ${statusInfo.glowColor}, transparent, ${statusInfo.glowColor})`
                  }}
                ></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
