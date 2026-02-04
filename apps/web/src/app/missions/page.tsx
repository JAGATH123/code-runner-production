'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  Satellite,
  Radio,
  Cpu,
  Lock,
  CheckCircle,
  Play,
  Star,
  Target,
  Zap,
  ArrowRight,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useProgress } from '@/lib/utilities/progress';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { usePageAudio } from '@/hooks/usePageAudio';

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  detailedDescription: string;
  icon: any;
  status: 'completed' | 'current' | 'locked';
  glowColor: string;
  progress: number;
  skills: string[];
  challenge: string;
  href: string;
}

export default function MissionsPage() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const progress = useProgress();
  const { playProjectTextSound } = useGlobalAudio();

  // Use the new page audio hook for smooth transitions
  usePageAudio({ audioType: 'mission' });

  useEffect(() => {
    setMounted(true);
    // Initialize CSS background effect - No Three.js
    createCSSFallbackBackground();

    return () => {
      // Cleanup CSS background on unmount
      const existing = document.getElementById('retro-flight-bg');
      if (existing) existing.remove();
    };
  }, []);

  // CSS-only animated background - No Three.js required
  const createCSSFallbackBackground = () => {
    // Remove existing background
    const existing = document.getElementById('retro-flight-bg');
    if (existing) existing.remove();

    // Create container
    const container = document.createElement('div');
    container.id = 'retro-flight-bg';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      overflow: hidden;
      background: radial-gradient(ellipse at center, #1a0033 0%, #0a001a 70%, #000000 100%);
    `;

    // Create wireframe grid lines
    for (let i = 0; i < 20; i++) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, #9f40ff 50%, transparent 100%);
        bottom: ${-100 + i * 20}px;
        opacity: ${0.3 + (i * 0.03)};
        transform: perspective(500px) rotateX(85deg) translateZ(${i * 20}px);
        animation: moveGrid 3s linear infinite;
        animation-delay: ${i * 0.1}s;
      `;
      container.appendChild(line);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes moveGrid {
        0% { transform: perspective(500px) rotateX(85deg) translateZ(0px) translateY(0px); }
        100% { transform: perspective(500px) rotateX(85deg) translateZ(-1000px) translateY(800px); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
  };

  const getChapterStatus = (chapterNumber: number, ageGroup: string = '11-14') => {
    if (!mounted) return { status: 'locked', progress: 0 };

    const chapterProgress = progress.getChapterProgress(ageGroup);
    const isCompleted = progress.isLevelCompleted(ageGroup, chapterNumber);
    const isUnlocked = progress.isLevelUnlocked(ageGroup, chapterNumber);

    if (isCompleted) {
      return { status: 'completed' as const, progress: 100 };
    } else if (isUnlocked) {
      const partialProgress = Math.min(50 + Math.random() * 30, 90);
      return { status: 'current' as const, progress: Math.round(partialProgress) };
    } else {
      return { status: 'locked' as const, progress: 0 };
    }
  };

  const chapters: Chapter[] = [
    {
      id: 1,
      title: "The Launch",
      subtitle: "Igniting the Spark",
      description: "Master the basics of Python communication with machines",
      detailedDescription: "In this opening chapter, you embark on your journey by mastering the very basics of Python. You learn to communicate with machines—displaying messages, capturing user input, and handling simple data types. These foundational skills are like the ignition system of your spacecraft, providing the initial power to launch your mission.",
      icon: Rocket,
      status: getChapterStatus(1).status,
      glowColor: 'neon-green',
      progress: getChapterStatus(1).progress,
      skills: ['Print statements', 'Input handling', 'Variables', 'Basic data types', 'String operations'],
      challenge: "Build a basic communication interface that establishes contact with the spacecraft's core computer",
      href: '/levels/11-14/1'
    },
    {
      id: 2,
      title: "Orbital Operations",
      subtitle: "Building the Control Systems",
      description: "Manage complex systems and data flows in space",
      detailedDescription: "Now safely in orbit, you face the task of managing complex systems and data flows. In this chapter, you delve into loops, lists, dictionaries, and other data structures. You learn how to organize and process the multitude of signals and sensor data coming from your spacecraft. This phase of training is critical for maintaining life support, navigation, and other vital systems while in orbit.",
      icon: Satellite,
      status: getChapterStatus(2).status,
      glowColor: 'neon-cyan',
      progress: getChapterStatus(2).progress,
      skills: ['Loops (for, while)', 'Lists and arrays', 'Dictionaries', 'Data processing', 'Control structures'],
      challenge: "Construct a control dashboard—a real-time display system that monitors the spacecraft's status",
      href: '/levels/11-14/2'
    },
    {
      id: 3,
      title: "Deep Space Communications",
      subtitle: "Mastering Functions and Modules",
      description: "Develop tools for processing interstellar data",
      detailedDescription: "Venturing into the deep reaches of space, communication becomes both more challenging and more essential. In this chapter, you develop your skills in writing reusable code by mastering functions, lambda expressions, and modules. You build tools that automate the processing of complex interstellar data—skills that are crucial for decoding alien signals and establishing reliable long-distance communication.",
      icon: Radio,
      status: getChapterStatus(3).status,
      glowColor: 'neon-purple',
      progress: getChapterStatus(3).progress,
      skills: ['Functions', 'Lambda expressions', 'Modules', 'Code reusability', 'Signal processing'],
      challenge: "Create a sophisticated command center that can process and interpret cosmic signals",
      href: '/levels/11-14/3'
    },
    {
      id: 4,
      title: "The Final Frontier",
      subtitle: "Commanding the Cosmos",
      description: "Design comprehensive systems for space command",
      detailedDescription: "In the climactic final chapter, you face the most advanced challenges. Here, you dive into object-oriented programming, file handling, and robust error management. These advanced skills allow you to design and build comprehensive systems that mirror the complexity of a fully operational spacecraft. Your training culminates in the development of the 'Galactic Command System'—a fully integrated application.",
      icon: Cpu,
      status: getChapterStatus(4).status,
      glowColor: 'neon-orange',
      progress: getChapterStatus(4).progress,
      skills: ['Object-oriented programming', 'File handling', 'Error management', 'System integration', 'Advanced algorithms'],
      challenge: "Develop the Galactic Command System—a fully integrated spacecraft management application",
      href: '/levels/11-14/4'
    }
  ];

  const getStatusIcon = (status: Chapter['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-neon-green" />;
      case 'current':
        return <Play className="w-5 h-5 text-neon-cyan animate-pulse" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Chapter['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-neon-green/20 text-neon-green border-neon-green/40">COMPLETED</Badge>;
      case 'current':
        return <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 animate-pulse">ACTIVE MISSION</Badge>;
      case 'locked':
        return <Badge className="bg-muted/20 text-muted-foreground border-muted/40">CLASSIFIED</Badge>;
    }
  };

  const getOverallProgress = () => {
    if (!mounted) return 0;

    const progress11_14 = progress.getChapterProgress('11-14');
    const progress15_18 = progress.getChapterProgress('15-18');

    const totalCompleted = progress11_14.completed + progress15_18.completed;
    const totalLevels = progress11_14.total + progress15_18.total;

    return totalLevels > 0 ? Math.round((totalCompleted / totalLevels) * 100) : 0;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* CSS-animated background created by createCSSFallbackBackground */}

      {/* Semi-transparent overlay for content readability */}
      <div className="fixed inset-0 bg-black/20 pointer-events-none"></div>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 mb-6 glow-border">
            <Globe className="w-4 h-4 text-neon-cyan animate-spin" />
            <span className="text-sm font-space text-neon-cyan">GALACTIC CODE INITIATIVE</span>
            <Globe className="w-4 h-4 text-neon-cyan animate-spin" />
          </div>

          <h1 className="text-4xl md:text-6xl font-space font-black tracking-tight mb-4 neon-text">
            GALACTIC CODE QUEST
          </h1>
          <div className="text-lg md:text-xl font-space text-neon-purple mb-4 glow-text">
            Journey Through the Stars
          </div>
          <p className="text-base text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-6">
            In the not-too-distant future, Earth has embraced the cosmos, launching the "Galactic Code Initiative"—a
            mission that calls upon young coding cadets to harness the power of Python to explore, manage, and
            protect the vast expanse of space.
          </p>

          {/* Overall Progress */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-space text-muted-foreground">MISSION PROGRESS</span>
              <span className="text-sm font-mono text-neon-cyan">{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2 bg-space-gray/50" />
          </div>
        </div>

        {/* Chapter Timeline */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {chapters.map((chapter, index) => {
              const IconComponent = chapter.icon;
              const isClickable = chapter.status !== 'locked';

              return (
                <div key={chapter.id} className="relative">
                  {index < chapters.length - 1 && (
                    <div className="hidden xl:block absolute top-16 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/40 to-transparent"></div>
                  )}

                  <Card
                    className={`h-full hologram transition-all duration-500 cursor-pointer ${
                      chapter.status === 'locked'
                        ? 'opacity-60'
                        : 'hover:glow-border hover:scale-105'
                    }`}
                    onClick={() => isClickable && setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
                  >
                    <CardHeader className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-${chapter.glowColor}/10 border border-${chapter.glowColor}/30`}>
                          <IconComponent className={`w-6 h-6 text-${chapter.glowColor}`} />
                        </div>
                        {getStatusIcon(chapter.status)}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">CHAPTER {chapter.id}</span>
                        {getStatusBadge(chapter.status)}
                      </div>

                      <CardTitle className="text-lg font-space font-bold text-primary mb-1">
                        {chapter.title}
                      </CardTitle>
                      <div className={`text-sm font-space text-${chapter.glowColor} mb-3 opacity-90`}>
                        {chapter.subtitle}
                      </div>
                      <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                        {chapter.description}
                      </CardDescription>

                      {chapter.status !== 'locked' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-muted-foreground">PROGRESS</span>
                            <span className="text-xs font-mono text-neon-cyan">{chapter.progress}%</span>
                          </div>
                          <Progress value={chapter.progress} className="h-1" />
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Detailed Chapter View */}
          {selectedChapter && (
            <Card
              className="hologram glow-border animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {(() => {
                const chapter = chapters.find(c => c.id === selectedChapter)!;
                const IconComponent = chapter.icon;
                return (
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6 mb-6">
                      <div className={`p-4 rounded-xl bg-${chapter.glowColor}/10 border border-${chapter.glowColor}/30 shrink-0`}>
                        <IconComponent className={`w-8 h-8 text-${chapter.glowColor}`} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-space font-bold text-primary">
                            Chapter {chapter.id}: {chapter.title}
                          </h3>
                          {getStatusBadge(chapter.status)}
                        </div>
                        <div className={`text-lg font-space text-${chapter.glowColor} mb-4`}>
                          {chapter.subtitle}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {chapter.detailedDescription}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-neon-cyan" />
                          <span className="font-space text-sm text-neon-cyan">CORE SKILLS</span>
                        </div>
                        <div className="space-y-2">
                          {chapter.skills.map((skill, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                              <span className="text-muted-foreground">{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-neon-purple" />
                          <span className="font-space text-sm text-neon-purple">FINAL CHALLENGE</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {chapter.challenge}
                        </p>
                      </div>
                    </div>

                    {chapter.status !== 'locked' && (
                      <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-neon-green" />
                          <span className="text-sm font-space text-neon-green">
                            {chapter.status === 'completed' ? 'MISSION ACCOMPLISHED' : 'READY FOR DEPLOYMENT'}
                          </span>
                        </div>

                        <Link href={chapter.href}>
                          <button
                            onClick={() => playProjectTextSound()}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-${chapter.glowColor}/20 border border-${chapter.glowColor}/50 text-${chapter.glowColor} font-space text-sm hover:bg-${chapter.glowColor}/30 transition-all`}
                          >
                            <span>{chapter.status === 'completed' ? 'REVIEW' : 'DEPLOY'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                );
              })()}
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-6 border-t border-purple-400/20 bg-purple-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-mono" style={{ color: '#f3ede9' }}>GALACTIC CODE INITIATIVE:</span>
          <span style={{ color: '#9f40ff' }}>OPERATIONAL</span>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#9f40ff' }}></div>
        </div>
      </footer>
    </div>
  );
}