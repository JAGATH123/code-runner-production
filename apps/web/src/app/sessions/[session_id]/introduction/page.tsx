'use client';

import { Header } from '@/components/layout/Header';
import type { Session } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';
import { Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface IntroductionPageProps {
  params: {
    session_id: string;
  };
}

export default function IntroductionPage({ params }: IntroductionPageProps) {
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
        text="// Loading introduction..."
        duration={2000}
      />
    );
  }

  if (!session) {
    notFound();
  }

  // Default placeholder content if session doesn't have introduction_content
  const defaultPlaceholders = [
    { imageName: 'placeholder1.png', description: 'Concept 1 explanation', taskName: 'Concept 1' },
    { imageName: 'placeholder2.png', description: 'Concept 2 explanation', taskName: 'Concept 2' },
    { imageName: 'placeholder3.png', description: 'Concept 3 explanation', taskName: 'Concept 3' },
    { imageName: 'placeholder4.png', description: 'Concept 4 explanation', taskName: 'Concept 4' },
    { imageName: 'placeholder5.png', description: 'Concept 5 explanation', taskName: 'Concept 5' }
  ];

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
                <Activity className="h-7 w-7" style={{ color: 'rgb(0, 191, 255)' }} />
                <div className="absolute -inset-1 rounded-full blur animate-pulse" style={{ backgroundColor: 'rgba(0, 191, 255, 0.2)' }}></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-space font-bold" style={{ color: 'rgb(0, 191, 255)' }}>ARENA: WARM-UP</h1>
            </div>
            <h2 className="text-lg font-space font-bold ml-10" style={{ color: '#000000' }}>{session.title}</h2>
          </div>

          {/* Introduction Content - Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(session.introduction_content
              ? session.introduction_content.split('\n').reduce((acc: any[], line, index) => {
                  // Check if line contains image reference
                  const imageMatch = line.match(/^(?:🖼️\s*)?(\d+)\.\s*(.+\.(?:png|jpg|jpeg|gif|webp))/i);
                  if (imageMatch) {
                    const imageName = imageMatch[2].trim();
                    const imageNumber = imageMatch[1];
                    // Extract task name from filename (remove extension and format)
                    const taskName = imageName
                      .replace(/\.(png|jpg|jpeg|gif|webp)$/i, '')
                      .split(/[_-]/)
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    acc.push({
                      type: 'image',
                      imageName,
                      imageNumber,
                      taskName,
                      index,
                      description: null
                    });
                  }
                  // Check if line starts with arrow (description)
                  else if (line.trim().startsWith('➡️')) {
                    const description = line.replace('➡️', '').trim();
                    if (acc.length > 0 && acc[acc.length - 1].type === 'image') {
                      acc[acc.length - 1].description = description;
                    }
                  }
                  return acc;
                }, [])
              : defaultPlaceholders.map((item, index) => ({
                  type: 'image',
                  imageName: item.imageName,
                  imageNumber: String(index + 1),
                  taskName: item.taskName,
                  description: item.description,
                  index
                }))
            ).map((item, idx) => (
              <div
                key={idx}
                className="bg-card rounded-lg p-5 shadow-lg border-2 hover:shadow-xl transition-shadow duration-300"
                style={{ borderColor: 'rgba(0, 191, 255, 0.3)' }}
              >
                {/* Image Number Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono" style={{ backgroundColor: 'rgba(0, 191, 255, 0.2)', color: 'rgb(0, 191, 255)' }}>
                    {item.imageNumber}
                  </div>
                  <span className="text-base font-mono uppercase tracking-wide font-semibold" style={{ color: 'rgb(0, 191, 255)' }}>{item.taskName}</span>
                </div>

                {/* Image - Only show if not a placeholder */}
                {!item.imageName.startsWith('placeholder') && (
                  <div className="mb-4 bg-slate-900/50 rounded-lg p-3">
                    <img
                      src={`/images/${item.imageName}`}
                      alt={item.imageName}
                      className="w-full h-auto max-h-64 object-contain rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Placeholder Box - Show only for placeholders */}
                {item.imageName.startsWith('placeholder') && (
                  <div className="mb-4 bg-slate-900/50 rounded-lg p-3 flex items-center justify-center" style={{ minHeight: '200px' }}>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'rgba(0, 191, 255, 0.3)' }}>
                        <Activity className="h-8 w-8" style={{ color: 'rgba(0, 191, 255, 0.5)' }} />
                      </div>
                      <p className="text-sm font-mono" style={{ color: 'rgba(0, 191, 255, 0.6)' }}>Flowchart Coming Soon</p>
                    </div>
                  </div>
                )}

                {/* Explanation Label and Description - Only show for non-placeholder descriptions */}
                {item.description && !item.description.includes('Concept') && !item.description.includes('explanation') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'rgba(0, 191, 255, 0.8)' }}>Explanation:</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0, 191, 255, 0.2)' }}></div>
                    </div>
                    <p className="text-sm md:text-base text-foreground/90 leading-relaxed pl-3 border-l-2" style={{ borderColor: 'rgba(0, 191, 255, 0.4)' }}>
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation to Tasks */}
          <div className="mt-10 text-center pb-8">
            <Link href={`/problems/${session.problems[0]?.problem_id}`}>
              <Button className="text-white font-space font-semibold px-10 py-3 text-base hover:opacity-80 transition-opacity" style={{ backgroundColor: 'rgb(0, 191, 255)' }}>
                Continue to Task 1
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
