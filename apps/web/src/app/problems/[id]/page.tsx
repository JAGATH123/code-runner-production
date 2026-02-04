'use client';

import { Header } from '@/components/layout/Header';
import { CompilerUI } from '@/components/editor/CompilerUI';
import type { Problem } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface ProblemPageProps {
  params: {
    id: string;
  };
}

export default function ProblemPage({ params }: ProblemPageProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const { forcePlayMissionMusic, forcePlayBackgroundMusic, getCurrentMusicType } = useGlobalAudio();

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        const problemId = parseInt(id);

        if (isNaN(problemId)) {
          notFound();
        }

        // Use API client to fetch from backend API service
        console.log('[Problem Page] Fetching problem:', problemId);
        const data = await api.problems.getById(problemId);
        console.log('[Problem Page] Received problem:', {
          problem_id: data.problem_id,
          title: data.title,
          has_case_code: !!data.case_code,
          case_code_preview: data.case_code?.substring(0, 50)
        });
        setProblem(data);

        // Store age group in localStorage for theme persistence
        if (data.age_group) {
          localStorage.setItem('currentAgeGroup', data.age_group);
        }

        // Check if this is a special mission that should use scott-buckley music
        const problemTitle = data.title?.toLowerCase() || '';
        const isGalacticMission = problemTitle.includes('galactic') || problemTitle.includes('code quest');
        const requiredMusicType = isGalacticMission ? 'mission' : 'background';
        const currentMusicType = getCurrentMusicType();

        // Only change music if we need to switch to a different type
        if (currentMusicType !== requiredMusicType) {
          if (isGalacticMission) {
            // Force switch to scott-buckley music for special missions
            await forcePlayMissionMusic();
          } else {
            // Force switch to base background music for regular problems
            await forcePlayBackgroundMusic();
          }
        }

      } catch (error) {
        console.error('[Problem Page] Error loading problem:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, forcePlayMissionMusic, forcePlayBackgroundMusic, getCurrentMusicType]);

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
            // Loading problem data...
          </p>
        </div>
      </div>
    );
  }

  if (!problem) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <Header />
      <main className="flex-grow relative z-10 overflow-hidden">
        <CompilerUI problem={problem} />
      </main>

      {/* Audio Control - Fixed Bottom Left */}
    </div>
  );
}
