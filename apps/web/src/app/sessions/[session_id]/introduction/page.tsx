'use client';

import { Header } from '@/components/layout/Header';
import type { Session } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Zap, BookOpen, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dwqzqxeuk';

interface IntroductionPageProps {
  params: {
    session_id: string;
  };
}

// Flowchart data structure for each session - using Cloudinary CDN
const sessionFlowcharts: Record<string, { images: string[]; title: string; description: string }> = {
  '1': {
    images: [`${CLOUDINARY_BASE}/image/upload/f_auto,q_auto/code-runner/flowcharts/11-14/level-1/sessions/session-1/flow%201.png`],
    title: 'Variables in Output',
    description: 'Learn how to use the print() function to display text and values. Understanding how input transforms into output is the foundation of programming.'
  },
  // Add more sessions as needed
};

export default function IntroductionPage({ params }: IntroductionPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { forcePlayBackgroundMusic } = useGlobalAudio();

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params;
        const { session_id } = resolvedParams;

        const response = await fetch(`/api/sessions/${session_id}`);
        if (!response.ok) {
          notFound();
        }

        const data = await response.json();
        setSession(data.session);

        await forcePlayBackgroundMusic();

      } catch (error) {
        console.error('Error loading session:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, forcePlayBackgroundMusic]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="font-mono text-cyan-400 text-sm animate-pulse">
            // Initializing training module...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    notFound();
  }

  const flowchartData = sessionFlowcharts[session.session_id] || {
    images: [],
    title: session.title,
    description: 'Explore the concepts in this training module.'
  };

  const currentImage = flowchartData.images[currentImageIndex];
  const hasMultipleImages = flowchartData.images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % flowchartData.images.length);
    setImageLoaded(false);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + flowchartData.images.length) % flowchartData.images.length);
    setImageLoaded(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,191,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,191,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.3) 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,150,255,0.3) 0%, transparent 70%)' }}></div>
      </div>

      <Header />

      <main className="flex-grow relative z-10 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link href={`/levels/11-14/${session.level_id}#session-${session.session_id}`}>
              <Button
                variant="ghost"
                className="group hover:bg-cyan-500/10 font-space font-semibold uppercase tracking-wide text-sm transition-all duration-300"
                style={{ color: 'rgb(0, 191, 255)' }}
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Sessions
              </Button>
            </Link>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
              style={{ borderColor: 'rgba(0, 191, 255, 0.3)', backgroundColor: 'rgba(0, 191, 255, 0.05)' }}>
              <Zap className="h-4 w-4 animate-pulse" style={{ color: 'rgb(0, 191, 255)' }} />
              <span className="text-sm font-space font-semibold" style={{ color: 'rgb(0, 191, 255)' }}>
                SESSION {session.session_id}
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Panel - Session Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Title Card */}
              <div className="rounded-2xl p-6 border-2 relative overflow-hidden"
                style={{
                  borderColor: 'rgba(0, 191, 255, 0.3)',
                  background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.05) 0%, rgba(255,255,255,0.9) 100%)'
                }}>
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-20"
                  style={{
                    background: 'linear-gradient(135deg, transparent 50%, rgba(0, 191, 255, 0.3) 50%)'
                  }}></div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 191, 255, 0.1)' }}>
                    <BookOpen className="h-6 w-6" style={{ color: 'rgb(0, 191, 255)' }} />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(0, 191, 255, 0.8)' }}>
                    Training Module
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-space font-bold mb-3" style={{ color: '#1a1a2e' }}>
                  {flowchartData.title}
                </h1>

                <p className="text-sm leading-relaxed" style={{ color: '#4a4a6a' }}>
                  {flowchartData.description}
                </p>
              </div>

              {/* Objectives Card */}
              <div className="rounded-2xl p-6 border"
                style={{
                  borderColor: 'rgba(0, 191, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }}>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5" style={{ color: 'rgb(0, 191, 255)' }} />
                  <span className="text-sm font-space font-bold uppercase tracking-wide" style={{ color: 'rgb(0, 191, 255)' }}>
                    Learning Objectives
                  </span>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgb(0, 191, 255)' }}></div>
                    <span className="text-sm" style={{ color: '#4a4a6a' }}>Understand the print() function</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgb(0, 191, 255)' }}></div>
                    <span className="text-sm" style={{ color: '#4a4a6a' }}>Learn how code produces output</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgb(0, 191, 255)' }}></div>
                    <span className="text-sm" style={{ color: '#4a4a6a' }}>Practice writing your first Python program</span>
                  </li>
                </ul>
              </div>

              {/* Continue Button - Desktop */}
              <div className="hidden lg:block">
                <Link href={`/problems/${session.problems[0]?.problem_id}`} className="block">
                  <Button
                    className="w-full group text-white font-space font-bold px-8 py-6 text-base rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    style={{
                      backgroundColor: 'rgb(0, 191, 255)',
                      boxShadow: '0 4px 20px rgba(0, 191, 255, 0.3)'
                    }}
                  >
                    <span>Start Training</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Panel - Flowchart Display */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden relative">
                {/* Image Container */}
                <div className="relative flex items-center justify-center">
                  {/* Loading State */}
                  {!imageLoaded && currentImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(0, 191, 255, 0.2)', borderTopColor: 'rgb(0, 191, 255)' }}></div>
                    </div>
                  )}

                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={flowchartData.title}
                      className={`w-full h-auto object-contain rounded-xl transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center mb-4"
                        style={{ borderColor: 'rgba(0, 191, 255, 0.3)' }}>
                        <BookOpen className="h-12 w-12" style={{ color: 'rgba(0, 191, 255, 0.5)' }} />
                      </div>
                      <p className="text-lg font-space" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Concept visualization coming soon
                      </p>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-300 hover:scale-110"
                        style={{
                          backgroundColor: 'rgba(0, 191, 255, 0.2)',
                          border: '1px solid rgba(0, 191, 255, 0.4)'
                        }}
                      >
                        <ChevronLeft className="h-6 w-6" style={{ color: 'rgb(0, 191, 255)' }} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-300 hover:scale-110"
                        style={{
                          backgroundColor: 'rgba(0, 191, 255, 0.2)',
                          border: '1px solid rgba(0, 191, 255, 0.4)'
                        }}
                      >
                        <ChevronRight className="h-6 w-6" style={{ color: 'rgb(0, 191, 255)' }} />
                      </button>
                    </>
                  )}
                </div>

                {/* Image Indicators */}
                {hasMultipleImages && (
                  <div className="flex justify-center gap-2 pb-4">
                    {flowchartData.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setCurrentImageIndex(idx); setImageLoaded(false); }}
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: idx === currentImageIndex ? 'rgb(0, 191, 255)' : 'rgba(0, 191, 255, 0.3)',
                          transform: idx === currentImageIndex ? 'scale(1.5)' : 'scale(1)'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tip Section */}
              <div className="mt-6 rounded-xl p-4 border flex items-start gap-4"
                style={{
                  borderColor: 'rgba(0, 191, 255, 0.2)',
                  backgroundColor: 'rgba(0, 191, 255, 0.05)'
                }}>
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(0, 191, 255, 0.1)' }}>
                  <Zap className="h-5 w-5" style={{ color: 'rgb(0, 191, 255)' }} />
                </div>
                <div>
                  <p className="text-sm font-space font-semibold mb-1" style={{ color: 'rgb(0, 191, 255)' }}>
                    Pro Tip
                  </p>
                  <p className="text-sm" style={{ color: '#4a4a6a' }}>
                    Study the flowchart carefully before starting the tasks. Understanding the concept visually will help you write better code!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button - Mobile */}
          <div className="lg:hidden mt-8 pb-8">
            <Link href={`/problems/${session.problems[0]?.problem_id}`} className="block">
              <Button
                className="w-full group text-white font-space font-bold px-8 py-6 text-base rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: 'rgb(0, 191, 255)',
                  boxShadow: '0 4px 20px rgba(0, 191, 255, 0.3)'
                }}
              >
                <span>Start Training</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
