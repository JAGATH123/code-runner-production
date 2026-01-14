'use client';

import type { Session, Level } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ProblemList } from './ProblemList';
import { Cpu, Activity, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';


interface SessionListProps {
  sessions: Session[];
  level: Level
}

export function SessionList({ sessions, level }: SessionListProps) {
  const [openSession, setOpenSession] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if there's a hash in the URL
    const hash = window.location.hash;
    if (hash) {
      // Handle both session hashes and code-convergence hash
      if (hash === '#code-convergence') {
        // Open Code Convergence accordion and scroll to show it fully
        setOpenSession('code-convergence');
        // Scroll to show Code Convergence section in full view at the top
        setTimeout(() => {
          const element = document.getElementById('code-convergence');
          if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        }, 0);
      } else {
        const sessionId = hash.replace('#session-', '');
        setOpenSession(`session-${sessionId}`);

        // Only scroll for regular session hashes, not code-convergence
        setTimeout(() => {
          const element = document.getElementById(hash.substring(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, []);

  // Filter out sessions 11 and 12
  const filteredSessions = sessions.filter(session =>
    session.session_number !== 11 && session.session_number !== 12
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="w-full space-y-6">
        {filteredSessions.map((session, index) => (
          <div key={session.session_id} id={`session-${session.session_id}`} className="relative">
            {/* SVG Filter Definition */}
            <svg className="absolute" style={{ width: 0, height: 0 }}>
              <defs>
                <filter
                  id={`session-turbulent-displace-${index}`}
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

            {/* Electric Border Container */}
            <div
              className="relative p-0.5 rounded-2xl"
              style={{
                background: 'linear-gradient(-30deg, rgba(0, 255, 255, 0.4), transparent, rgba(0, 255, 255, 0.4)), linear-gradient(to bottom, rgba(10, 14, 23, 1), rgba(10, 14, 23, 1))'
              }}
            >
              {/* Inner Container */}
              <div className="relative">
                {/* Border Outer */}
                <div
                  className="border-2 rounded-2xl pr-1 pb-1"
                  style={{ borderColor: 'rgba(0, 255, 255, 0.5)' }}
                >
                  {/* Main Card */}
                  <div
                    className="w-full rounded-2xl border-2 -mt-1 -ml-1 relative overflow-hidden"
                    style={{
                      borderColor: '#00ffff',
                      background: 'rgba(10, 14, 23, 0.95)'
                    }}
                  >
                    <Accordion type="single" collapsible value={openSession} onValueChange={setOpenSession}>
                      <AccordionItem value={`session-${session.session_id}`} className="border-0">
                        <AccordionTrigger className="text-xl hover:no-underline py-6 px-6 hover:bg-cyan-500/5 transition-colors [&[data-state=open]>div>svg]:rotate-180">
                          <div className="flex items-center gap-6 w-full">
                            <div className="relative flex-shrink-0">
                              <span
                                className="flex items-center justify-center h-14 w-14 rounded-full border-2 font-space font-bold text-xl"
                                style={{
                                  background: 'rgba(0, 255, 255, 0.2)',
                                  borderColor: 'rgba(0, 255, 255, 0.5)',
                                  color: '#00ffff'
                                }}
                              >
                                {session.session_number}
                              </span>
                              <div className="absolute -inset-1 bg-cyan-500/10 rounded-full blur animate-pulse"></div>
                            </div>
                            <div className="text-left flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Cpu className="h-4 w-4 text-neon-cyan flex-shrink-0" />
                                <span className="text-xs font-space text-neon-cyan uppercase tracking-wide font-bold">TRAINING PROTOCOL</span>
                              </div>
                              <h3 className="font-space font-bold text-xl" style={{ color: '#f3ede9' }}>
                                {session.title.replace(/^Session \d+:\s*/, '')}
                              </h3>
                            </div>
                            <div
                              className="flex items-center gap-2 px-3 py-1 rounded border-2 font-space font-semibold text-xs flex-shrink-0 mr-6"
                              style={{
                                background: 'linear-gradient(135deg, rgba(10, 14, 23, 0.95), rgba(0, 50, 40, 0.9))',
                                borderColor: '#00ff88',
                                color: '#00ff88',
                                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
                              }}
                            >
                              <Activity className="w-3 h-3 text-neon-green animate-pulse" />
                              <span>{session.problems.length} TASKS</span>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent>
                          <div className="px-6 pb-6">
                            <div className="pl-8 border-l-2 border-cyan-500/30 ml-7 space-y-6">
                              {/* Introduction Section - Always shown for all sessions */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'rgb(0, 191, 255)' }}></div>
                                  <span className="text-xs font-space uppercase tracking-wide font-bold" style={{ color: 'rgb(0, 191, 255)' }}>PREP ZONE</span>
                                </div>
                                <Link
                                  href={`/sessions/${session.session_id}/introduction`}
                                  className="block"
                                >
                                  <Card
                                    className="hover:shadow-lg transition-all duration-300 group flex items-center border-2 relative overflow-hidden"
                                    style={{
                                      background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.95), rgba(0, 25, 40, 0.9))',
                                      borderColor: 'rgba(0, 191, 255, 0.5)',
                                      boxShadow: '0 0 15px rgba(0, 191, 255, 0.2)'
                                    }}
                                  >
                                    {/* Cyan Indicator */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>

                                    <CardHeader className="flex-grow py-4">
                                      <CardTitle className="text-lg font-space transition-colors" style={{ color: 'rgb(243, 237, 233)' }}>
                                        Arena: Warm-Up
                                      </CardTitle>
                                    </CardHeader>
                                  </Card>
                                </Link>
                              </div>

                              {/* Execution Tasks Section */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs font-space text-neon-cyan uppercase tracking-wide font-bold">EXECUTION TASKS</span>
                                </div>
                                <ProblemList problems={session.problems} />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                {/* Glow Layers */}
                <div
                  className="absolute inset-0 w-full h-full border-2 rounded-2xl pointer-events-none"
                  style={{
                    borderColor: 'rgba(0, 255, 255, 0.6)',
                    filter: `blur(1px) url(#session-turbulent-displace-${index})`
                  }}
                ></div>
                <div
                  className="absolute inset-0 w-full h-full border-2 rounded-2xl pointer-events-none"
                  style={{
                    borderColor: '#00ffff',
                    filter: `blur(4px) url(#session-turbulent-displace-${index})`
                  }}
                ></div>
              </div>

              {/* Overlay Effects */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl opacity-100 scale-110 pointer-events-none"
                style={{
                  mixBlendMode: 'overlay',
                  filter: 'blur(16px)',
                  background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                }}
              ></div>
              <div
                className="absolute inset-0 w-full h-full rounded-2xl opacity-50 scale-110 pointer-events-none"
                style={{
                  mixBlendMode: 'overlay',
                  filter: 'blur(16px)',
                  background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                }}
              ></div>

              {/* Background Glow */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl -z-10 scale-110 opacity-30"
                style={{
                  filter: 'blur(32px)',
                  background: 'linear-gradient(-30deg, #00ffff, transparent, #00ffff)'
                }}
              ></div>
            </div>
          </div>
        ))}

        {/* Code Convergence Section */}
        <div id="code-convergence" className="relative">
          {/* SVG Filter Definition */}
          <svg className="absolute" style={{ width: 0, height: 0 }}>
            <defs>
              <filter
                id="code-convergence-turbulent-displace"
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

          {/* Electric Border Container */}
          <div
            className="relative p-0.5 rounded-2xl"
            style={{
              background: 'linear-gradient(-30deg, rgba(0, 212, 255, 0.4), transparent, rgba(0, 212, 255, 0.4)), linear-gradient(to bottom, rgba(10, 14, 23, 1), rgba(10, 14, 23, 1))'
            }}
          >
            {/* Inner Container */}
            <div className="relative">
              {/* Border Outer */}
              <div
                className="border-2 rounded-2xl pr-1 pb-1"
                style={{ borderColor: 'rgba(0, 212, 255, 0.5)' }}
              >
                {/* Main Card */}
                <div
                  className="w-full rounded-2xl border-2 -mt-1 -ml-1 relative overflow-hidden"
                  style={{
                    borderColor: '#00d4ff',
                    background: 'rgba(10, 14, 23, 0.95)'
                  }}
                >
                  <Accordion type="single" collapsible value={openSession} onValueChange={(value) => {
                    setOpenSession(value);
                    // Scroll to Code Convergence when accordion is opened
                    if (value === 'code-convergence') {
                      setTimeout(() => {
                        const element = document.getElementById('code-convergence');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }}>
                    <AccordionItem value="code-convergence" className="border-0">
                      <AccordionTrigger className="text-xl hover:no-underline py-6 px-6 hover:bg-cyan-500/5 transition-colors [&[data-state=open]>div>svg]:rotate-180">
                        <div className="flex items-center gap-6 w-full">
                          <div className="relative flex-shrink-0">
                            <span
                              className="flex items-center justify-center h-14 w-14 rounded-full border-2 font-space font-bold text-xl"
                              style={{
                                background: 'rgba(0, 212, 255, 0.2)',
                                borderColor: 'rgba(0, 212, 255, 0.5)',
                                color: '#00d4ff'
                              }}
                            >
                              <Zap className="h-7 w-7" />
                            </span>
                            <div className="absolute -inset-1 bg-cyan-500/10 rounded-full blur animate-pulse"></div>
                          </div>
                          <div className="text-left flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Cpu className="h-4 w-4" style={{ color: '#00d4ff' }} />
                              <span className="text-xs font-space uppercase tracking-wide font-bold" style={{ color: '#00d4ff' }}>FINAL CHALLENGE</span>
                            </div>
                            <h3 className="font-space font-bold text-xl" style={{ color: '#f3ede9' }}>Code Convergence</h3>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="px-6 pb-6">
                          <div className="pl-8 border-l-2 border-cyan-500/30 ml-7 space-y-6">
                            {/* Introduction Section - Arena Warm-Up */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'rgb(0, 191, 255)' }}></div>
                                <span className="text-xs font-space uppercase tracking-wide font-bold" style={{ color: 'rgb(0, 191, 255)' }}>PREP ZONE</span>
                              </div>
                              <Link href={`/code-convergence/${level.age_group}/${level.level_number}/introduction`} className="block">
                                <Card
                                  className="hover:shadow-lg transition-all duration-300 group flex items-center border-2 relative overflow-hidden cursor-pointer"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.95), rgba(0, 25, 40, 0.9))',
                                    borderColor: 'rgba(0, 191, 255, 0.5)',
                                    boxShadow: '0 0 15px rgba(0, 191, 255, 0.2)'
                                  }}
                                >
                                  {/* Cyan Indicator */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>

                                  <CardHeader className="flex-grow py-4">
                                    <CardTitle className="text-lg font-space transition-colors" style={{ color: 'rgb(243, 237, 233)' }}>
                                      Arena: Warm-Up
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                              </Link>
                            </div>

                            {/* Final Task Section */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-space text-neon-cyan uppercase tracking-wide font-bold">FINAL TASK</span>
                              </div>

                              <Link href={`/code-convergence/${level.age_group}/${level.level_number}/ultimate-challenge`} className="block">
                                <Card
                                  className="hover:shadow-lg transition-all duration-300 group flex items-center border-2 relative overflow-hidden cursor-pointer"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.95), rgba(0, 25, 40, 0.9))',
                                    borderColor: 'rgba(0, 191, 255, 0.5)',
                                    boxShadow: '0 0 15px rgba(0, 191, 255, 0.2)'
                                  }}
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                                  <CardHeader className="flex-grow py-4">
                                    <CardTitle className="text-lg font-space transition-colors" style={{ color: 'rgb(243, 237, 233)' }}>
                                      {level.level_number === 1 ? 'The Ultimate Challenge' : level.level_number === 2 ? 'Project ORBITRON' : level.level_number === 3 ? 'Project COSMIC LINK' : 'Project GALACTIC COMMAND'}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              {/* Glow Layers */}
              <div
                className="absolute inset-0 w-full h-full border-2 rounded-2xl pointer-events-none"
                style={{
                  borderColor: 'rgba(0, 212, 255, 0.6)',
                  filter: 'blur(1px) url(#code-convergence-turbulent-displace)'
                }}
              ></div>
              <div
                className="absolute inset-0 w-full h-full border-2 rounded-2xl pointer-events-none"
                style={{
                  borderColor: '#00d4ff',
                  filter: 'blur(4px) url(#code-convergence-turbulent-displace)'
                }}
              ></div>
            </div>

            {/* Overlay Effects */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl opacity-100 scale-110 pointer-events-none"
              style={{
                mixBlendMode: 'overlay',
                filter: 'blur(16px)',
                background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
              }}
            ></div>
            <div
              className="absolute inset-0 w-full h-full rounded-2xl opacity-50 scale-110 pointer-events-none"
              style={{
                mixBlendMode: 'overlay',
                filter: 'blur(16px)',
                background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
              }}
            ></div>

            {/* Background Glow */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl -z-10 scale-110 opacity-30"
              style={{
                filter: 'blur(32px)',
                background: 'linear-gradient(-30deg, #00d4ff, transparent, #00d4ff)'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
