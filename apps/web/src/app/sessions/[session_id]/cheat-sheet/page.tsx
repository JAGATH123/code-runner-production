'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';
import CheatSheetTemplate, { CheatSheetCharacter } from '@/components/cheatsheet/CheatSheetTemplate';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { BookOpen, ArrowLeft, Download, AlertCircle, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { downloadCheatsheet } from '@/lib/downloadCheatsheet';

interface CheatSheetBox {
  number: number;
  title: string;
  description: string;
  code_example: string;
  tip: string;
}

interface CheatSheetData {
  _id: string;
  session_id: number;
  age_group: '11-14' | '15-18';
  level_number: number;
  title: string;
  subtitle: string;
  boxes: CheatSheetBox[];
  template_version: string;
}

interface CheatSheetPageProps {
  params: {
    session_id: string;
  };
}

const CHARACTERS: { id: CheatSheetCharacter; name: string; color: string }[] = [
  { id: 'default', name: 'Default', color: '#6B7280' },
  { id: 'Astra', name: 'Astra', color: '#8B5CF6' },
  { id: 'Kenji', name: 'Kenji', color: '#EF4444' },
  { id: 'Leo', name: 'Leo', color: '#F59E0B' },
];

export default function CheatSheetPage({ params }: CheatSheetPageProps) {
  const [cheatSheet, setCheatSheet] = useState<CheatSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CheatSheetCharacter>('default');
  const { forcePlayBackgroundMusic } = useGlobalAudio();

  const handleDownload = async () => {
    if (!cheatSheet) return;

    try {
      await downloadCheatsheet(cheatSheet.session_id);
    } catch (err) {
      console.error('Error downloading cheat sheet:', err);
      alert('Failed to download cheat sheet. Please try again.');
    }
  };

  useEffect(() => {
    async function loadCheatSheet() {
      try {
        const resolvedParams = await params;
        const { session_id } = resolvedParams;

        console.log(`[CheatSheet Page] Loading cheat sheet for session ${session_id}`);

        // Fetch cheat sheet data from API
        const response = await fetch(`/api/cheatsheets/${session_id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`No cheat sheet found for session ${session_id}`);
          }
          throw new Error('Failed to load cheat sheet');
        }

        const data: CheatSheetData = await response.json();
        console.log('[CheatSheet Page] Loaded:', data.title);

        setCheatSheet(data);

        // Play background music
        await forcePlayBackgroundMusic();

      } catch (err: any) {
        console.error('[CheatSheet Page] Error:', err);
        setError(err.message || 'Failed to load cheat sheet');
      } finally {
        setLoading(false);
      }
    }

    loadCheatSheet();
  }, [params, forcePlayBackgroundMusic]);

  // Loading state
  if (loading) {
    return (
      <MemoryLoadingScreen
        isVisible={loading}
        text="// Loading cheat sheet..."
        duration={2000}
      />
    );
  }

  // Error state
  if (error || !cheatSheet) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertCircle
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: 'rgb(239, 68, 68)' }}
            />
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(239, 68, 68)' }}>
              Error Loading Cheat Sheet
            </h1>
            <p className="text-gray-400 mb-6">
              {error || 'Cheat sheet not found for this session'}
            </p>
            <Link href="/levels/11-14/1">
              <Button
                variant="outline"
                className="font-space"
                style={{ borderColor: 'rgb(0, 191, 255)', color: 'rgb(0, 191, 255)' }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Levels
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-x-auto">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cheat-sheet-printable,
          #cheat-sheet-printable * {
            visibility: visible;
          }
          #cheat-sheet-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0;
            size: landscape;
          }
        }
      `}</style>

      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10 z-0 print:hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,191,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,191,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-grow relative z-10 overflow-x-auto p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="w-full mx-auto">
          {/* Back Button */}
          <Link href={`/levels/${cheatSheet.age_group}/${cheatSheet.level_number}`} className="print:hidden">
            <Button
              variant="ghost"
              className="mb-6 hover:bg-blue-500/10 font-space font-semibold uppercase tracking-wide text-sm"
              style={{ color: 'rgb(0, 191, 255)' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Level {cheatSheet.level_number}
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8 text-center print:hidden">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="relative">
                <BookOpen className="h-7 w-7 md:h-8 md:w-8" style={{ color: 'rgb(0, 191, 255)' }} />
                <div
                  className="absolute -inset-1 rounded-full blur animate-pulse"
                  style={{ backgroundColor: 'rgba(0, 191, 255, 0.2)' }}
                ></div>
              </div>
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-space font-bold"
                style={{ color: 'rgb(0, 191, 255)' }}
              >
                CHEAT SHEET
              </h1>
            </div>
            <h2
              className="text-base sm:text-lg md:text-xl font-space font-bold"
              style={{ color: '#00BFFF' }}
            >
              Session {cheatSheet.session_id}
            </h2>
            <p className="text-sm md:text-base text-gray-400 mt-2">
              Age Group: {cheatSheet.age_group} | Level {cheatSheet.level_number}
            </p>
          </div>

          {/* Character Selector */}
          <div className="mb-6 print:hidden">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-gray-400 font-space text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Character Theme:
              </span>
              {CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char.id)}
                  className={`
                    px-4 py-2 rounded-lg font-space font-semibold text-sm
                    transition-all duration-200 border-2
                    ${selectedCharacter === char.id
                      ? 'text-white shadow-lg scale-105'
                      : 'text-gray-300 border-gray-600 hover:border-gray-400 bg-transparent'
                    }
                  `}
                  style={{
                    borderColor: selectedCharacter === char.id ? char.color : undefined,
                    backgroundColor: selectedCharacter === char.id ? char.color : undefined,
                    boxShadow: selectedCharacter === char.id ? `0 0 20px ${char.color}50` : undefined,
                  }}
                >
                  {char.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cheat Sheet Template with Dynamic Content */}
          <div id="cheat-sheet-printable" className="mb-8 overflow-x-auto">
            <CheatSheetTemplate
              title={cheatSheet.title}
              subtitle={cheatSheet.subtitle}
              boxes={cheatSheet.boxes}
              templateVersion={cheatSheet.template_version}
              character={selectedCharacter}
            />
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 pb-8 print:hidden">
            <Button
              variant="outline"
              className="font-space"
              onClick={handleDownload}
              style={{ borderColor: 'rgb(0, 191, 255)', color: 'rgb(0, 191, 255)' }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Cheat Sheet
            </Button>

            <Link href={`/levels/${cheatSheet.age_group}/${cheatSheet.level_number}`}>
              <Button
                className="text-white font-space font-semibold px-8 py-2 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'rgb(0, 191, 255)' }}
              >
                Continue Learning
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
