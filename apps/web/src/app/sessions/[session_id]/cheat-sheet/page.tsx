'use client';

import { Header } from '@/components/layout/Header';
import type { Session } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';
import { BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCheatSheetPath } from '@/lib/utilities/imagePaths';

interface CheatSheetPageProps {
  params: {
    session_id: string;
  };
}

export default function CheatSheetPage({ params }: CheatSheetPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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
      <MemoryLoadingScreen
        isVisible={loading}
        text="// Loading cheat sheet..."
        duration={2000}
      />
    );
  }

  if (!session) {
    notFound();
  }

  // Single cheat sheet concept template
  const cheatSheetConcept = {
    number: '1',
    title: 'Quick Reference',
    content: 'Key concepts and syntax for this session.'
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,191,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,191,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <Header />
      <main className="flex-grow relative z-10 overflow-auto p-6 md:p-8">
        <div className="max-w-screen-xl mx-auto">
          {/* Back Button */}
          <Link href={`/levels/11-14/${session.level_id}#session-${session.session_id}`}>
            <Button variant="ghost" className="mb-6 hover:bg-blue-500/10 font-space font-semibold uppercase tracking-wide text-sm" style={{ color: 'rgb(0, 191, 255)' }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <BookOpen className="h-7 w-7" style={{ color: 'rgb(0, 191, 255)' }} />
                <div className="absolute -inset-1 rounded-full blur animate-pulse" style={{ backgroundColor: 'rgba(0, 191, 255, 0.2)' }}></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-space font-bold" style={{ color: 'rgb(0, 191, 255)' }}>CHEAT SHEET</h1>
            </div>
            <h2 className="text-lg font-space font-bold ml-10" style={{ color: '#000000' }}>{session.title}</h2>
          </div>

          {/* Cheat Sheet Content - Portrait Display */}
          <div className="max-w-2xl mx-auto">
            {/* Cheat Sheet Image - Direct Display */}
            <div className="flex justify-center">
              <img
                src={getCheatSheetPath(
                  session.age_group as '11-14' | '15-18',
                  session.level_number || 1,
                  session.session_id,
                  session.session_id === 1 ? 'cheet sheet 3.png' : 'cheat-sheet.png'
                )}
                alt="Cheat Sheet Reference"
                className="w-full h-auto max-w-md rounded-lg shadow-2xl"
                style={{ maxHeight: '80vh' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  console.error('Failed to load cheat sheet image');
                }}
              />
            </div>
          </div>

          {/* Navigation to Final Task */}
          <div className="mt-10 text-center pb-8">
            <Link href={`/problems/${session.problems[5]?.problem_id}`}>
              <Button className="text-white font-space font-semibold px-10 py-3 text-base hover:opacity-80 transition-opacity" style={{ backgroundColor: 'rgb(0, 191, 255)' }}>
                Continue to Final Task
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
