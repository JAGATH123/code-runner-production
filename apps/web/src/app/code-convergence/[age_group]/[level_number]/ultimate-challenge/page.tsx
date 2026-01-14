'use client';

import { Header } from '@/components/layout/Header';
import { CompilerUI } from '@/components/editor/CompilerUI';
import type { Problem } from '@/lib/types';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api-client';

interface UltimateChallengePageProps {
  params: {
    age_group: string;
    level_number: string;
  };
}

// Map level numbers to problem IDs/endpoints
const levelProblemMap: Record<string, string> = {
  '1': '999',
  '2': '1000',
  '3': '181',
  '4': '242'
};

// Map level numbers to loading text
const levelLoadingText: Record<string, string> = {
  '1': '// Loading ultimate challenge...',
  '2': '// Loading Project ORBITRON...',
  '3': '// Loading Project COSMIC LINK...',
  '4': '// Loading Project GALACTIC COMMAND...'
};

export default function UltimateChallengePage({ params }: UltimateChallengePageProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ age_group: string; level_number: string } | null>(null);
  const { forcePlayMissionMusic } = useGlobalAudio();

  useEffect(() => {
    async function loadData() {
      try {
        const resolved = await params;
        setResolvedParams(resolved);

        // Validate params
        if (!['11-14', '15-18'].includes(resolved.age_group)) {
          notFound();
        }

        const levelNum = parseInt(resolved.level_number);
        if (isNaN(levelNum) || levelNum < 1 || levelNum > 4) {
          notFound();
        }

        const problemId = levelProblemMap[resolved.level_number];
        if (!problemId) {
          notFound();
        }

        // Fetch Code Convergence Ultimate Challenge from backend API
        console.log('[Ultimate Challenge] Fetching problem:', problemId);
        const data = await api.problems.getById(parseInt(problemId)) as Problem;
        console.log('[Ultimate Challenge] Received problem:', {
          problem_id: data.problem_id,
          title: data.title,
        });
        setProblem(data);

        // Store age group in localStorage for theme persistence
        localStorage.setItem('currentAgeGroup', resolved.age_group);

        // Force switch to scott-buckley music for the ultimate challenge
        await forcePlayMissionMusic();

      } catch (error) {
        console.error('Error loading problem:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, forcePlayMissionMusic]);

  if (loading || !resolvedParams) {
    return (
      <MemoryLoadingScreen
        isVisible={true}
        text={resolvedParams ? (levelLoadingText[resolvedParams.level_number] || '// Loading challenge...') : '// Loading challenge...'}
        duration={2000}
      />
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Problem Not Found</h1>
          <p className="text-muted-foreground">Unable to load the Code Convergence challenge.</p>
        </div>
      </div>
    );
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
    </div>
  );
}
