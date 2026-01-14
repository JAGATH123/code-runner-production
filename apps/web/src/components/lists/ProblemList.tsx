'use client';

import type { Problem } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Zap, Target, Lock } from 'lucide-react';
import { useGlobalAudio } from '@/contexts/AudioContext';

interface ProblemListProps {
  problems: Problem[];
}

const difficultyVariant: { [key in Problem['difficulty']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Intro: 'outline',
  Easy: 'default',
  Medium: 'secondary',
  Hard: 'destructive',
};

const difficultyColor: { [key in Problem['difficulty']]: string } = {
  Intro: 'text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600/40 bg-blue-50 dark:bg-blue-950/20',
  Easy: 'text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/20',
  Medium: 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/20',
  Hard: 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-600/40 bg-rose-50 dark:bg-rose-950/20',
};

export function ProblemList({ problems }: ProblemListProps) {
  const { playProjectTextSound } = useGlobalAudio();

  return (
    <div className="space-y-3">
        {problems.map((problem, index) => {
            // Check if this is the final task (6th task, index 5)
            const isFinalTask = index === 5;
            const taskColor = isFinalTask ? '#00bfff' : '#00bfff'; // Same cyan color for all tasks
            const taskBorderColor = 'rgba(0, 191, 255, 0.5)';
            const taskShadowColor = 'rgba(0, 191, 255, 0.2)';
            const taskGradient = 'bg-gradient-to-b from-blue-400 to-blue-600';

            return (
                <div key={problem.problem_id}>
                    {/* Add CHEAT SHEET section before the final task */}
                    {isFinalTask && (
                        <>
                            <div className="flex items-center gap-2 mt-6 mb-4">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-space text-neon-cyan uppercase tracking-wide font-extrabold">CHEAT SHEET</span>
                            </div>

                            {/* Cheat Sheet Container */}
                            <Link
                                href={`/sessions/${problem.session_id}/cheat-sheet`}
                                className="block"
                                onClick={() => playProjectTextSound()}
                            >
                                <Card
                                    className="mb-6 hover:shadow-lg transition-all duration-300 border-2 relative overflow-hidden cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.95), rgba(0, 25, 40, 0.9))',
                                        borderColor: 'rgba(0, 191, 255, 0.5)',
                                        boxShadow: '0 0 15px rgba(0, 191, 255, 0.2)'
                                    }}
                                >
                                    {/* Cyan Indicator */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>

                                    <div className="py-6 px-6">
                                        <div className="text-lg font-space font-semibold tracking-tight transition-colors" style={{ color: 'rgb(243, 237, 233)' }}>
                                            Quick Reference Guide
                                        </div>
                                    </div>
                                </Card>
                            </Link>

                            {/* FINAL TASK section header */}
                            <div className="flex items-center gap-2 mt-6 mb-4">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-space text-neon-cyan uppercase tracking-wide font-extrabold">FINAL TASK</span>
                            </div>
                        </>
                    )}

                    <Link
                        href={`/problems/${problem.problem_id}`}
                        className="block"
                        onClick={() => playProjectTextSound()}
                    >
                        <Card
                            className="hover:shadow-lg transition-all duration-300 group flex items-center border-2 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.95), rgba(0, 25, 40, 0.9))',
                                borderColor: taskBorderColor,
                                boxShadow: `0 0 15px ${taskShadowColor}`
                            }}
                        >
                            {/* Task Number Indicator */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${taskGradient}`}></div>

                            <CardHeader className="flex-grow py-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="h-4 w-4" style={{ color: taskColor }} />
                                    <span className="text-xs font-space uppercase tracking-wide font-bold" style={{ color: taskColor }}>
                                        {isFinalTask ? 'FINAL TASK' : `TASK ${index + 1}`}
                                    </span>
                                    {!isFinalTask && (
                                        <>
                                            <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(0, 191, 255, 0.6)' }}></div>
                                            <Badge
                                                className={`font-mono text-xs ${difficultyColor[problem.difficulty]} font-semibold`}
                                            >
                                                {problem.difficulty.toUpperCase()}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                                <CardTitle className="text-lg font-space transition-colors" style={{ color: '#f3ede9' }}>
                                   {problem.title}
                                </CardTitle>
                            </CardHeader>

                            <CardFooter className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: taskColor }}></div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="font-space font-semibold hover:bg-blue-500/10"
                                        style={{ color: taskColor }}
                                    >
                                        <Zap className="h-4 w-4 mr-1" />
                                        EXECUTE
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </Link>
                </div>
            );
        })}
    </div>
  );
}
