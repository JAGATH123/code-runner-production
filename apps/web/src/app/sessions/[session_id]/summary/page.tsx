'use client';

import { Header } from '@/components/layout/Header';
import type { Session, Problem } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';
import { Trophy, CheckCircle, ArrowRight, Star, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProgress } from '@/lib/utilities/progress';

interface SessionSummaryProps {
  params: {
    session_id: string;
  };
}

export default function SessionSummaryPage({ params }: SessionSummaryProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { forcePlayBackgroundMusic, playBeepsSound } = useGlobalAudio();
  const progress = useProgress();

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
        await playBeepsSound();

      } catch (error) {
        console.error('Error loading session:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, forcePlayBackgroundMusic, playBeepsSound]);

  if (loading || !session) {
    return (
      <MemoryLoadingScreen
        isVisible={true}
        text="// Loading session summary..."
        duration={2000}
      />
    );
  }

  const completedProblems = session.problems.filter(p =>
    progress.isProblemCompleted(p.problem_id.toString())
  );
  const completionPercentage = (completedProblems.length / session.problems.length) * 100;
  const allProblemsCompleted = completedProblems.length === session.problems.length;

  const nextSessionId = session.session_id + 1;
  const hasNextSession = nextSessionId <= 80; // Adjust based on total sessions

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon-green/20 mb-4">
            {allProblemsCompleted ? (
              <Trophy className="w-10 h-10 text-neon-green" />
            ) : (
              <Target className="w-10 h-10 text-primary" />
            )}
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-neon-green to-primary bg-clip-text text-transparent">
            {allProblemsCompleted ? 'Session Complete!' : 'Session In Progress'}
          </h1>

          <p className="text-xl text-muted-foreground">
            {session.title}
          </p>
        </div>

        {/* Progress Card */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-neon-green" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Problems Completed</span>
                <span className="font-mono font-bold text-neon-green">
                  {completedProblems.length} / {session.problems.length}
                </span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </div>

            {allProblemsCompleted && (
              <div className="flex items-center gap-2 text-neon-green bg-neon-green/10 p-3 rounded-lg border border-neon-green/20">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">All problems in this session completed!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problems Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Session Problems</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {session.problems.map((problem) => {
              const isCompleted = progress.isProblemCompleted(problem.problem_id.toString());

              return (
                <Card
                  key={problem.problem_id}
                  className={`border transition-all ${
                    isCompleted
                      ? 'border-neon-green/50 bg-neon-green/5'
                      : 'border-primary/20 bg-card/50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {problem.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Problem #{problem.problem_id}
                        </p>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {problem.difficulty}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            Back to Session
          </Button>

          {hasNextSession && (
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-neon-green hover:bg-neon-green/90 text-black"
            >
              <Link href={`/sessions/${nextSessionId}/introduction`}>
                Next Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}

          {!hasNextSession && allProblemsCompleted && (
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-primary"
            >
              <Link href={`/code-convergence/${session.age_group}/${session.level_number}/introduction`}>
                Code Convergence
                <Star className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
