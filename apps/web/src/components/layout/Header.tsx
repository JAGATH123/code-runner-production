
'use client';

import Link from 'next/link';
import { Terminal, Cpu, Activity, Zap, User, Power } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { Leaderboard } from '@/components/lists/Leaderboard';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const { playProjectTextSound } = useGlobalAudio();
  const pathname = usePathname();
  const [currentAgeGroup, setCurrentAgeGroup] = useState<string | null>(null);

  // Check if we're on 11-14 age group pages or if age group is stored
  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return;

    // Check pathname first
    if (pathname.includes('/11-14') || pathname === '/missions' || pathname.includes('/introduction') || pathname.includes('/code-convergence') || pathname.includes('/cheat-sheet') || pathname.includes('/profile')) {
      // Apply blue theme for 11-14 age group pages, missions page, introduction pages, code convergence, cheat sheet, and profile page
      setCurrentAgeGroup('11-14');
      localStorage.setItem('currentAgeGroup', '11-14');
    } else if (pathname === '/home' || pathname === '/' || pathname === '/compiler') {
      // Clear age group for main pages - they should use default red theme
      setCurrentAgeGroup(null);
      localStorage.removeItem('currentAgeGroup');
    } else if (pathname.includes('/problems/')) {
      // For problem pages, check localStorage
      const stored = localStorage.getItem('currentAgeGroup');
      setCurrentAgeGroup(stored);
    } else {
      // For other pages, clear the age group
      setCurrentAgeGroup(null);
      localStorage.removeItem('currentAgeGroup');
    }
  }, [pathname]);

  // Apply blue theme for all 11-14 age group pages (training protocol, mission detail, and problem pages)
  const isEarthTheme = currentAgeGroup === '11-14';
  // Apply black text on problem pages, introduction pages, code convergence pages, and cheat sheet pages with earth theme
  const useBlackText = isEarthTheme && (pathname?.includes('/problems/') || pathname?.includes('/introduction') || pathname?.includes('/code-convergence') || pathname?.includes('/cheat-sheet'));
  
  return (
    <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl ${
      isEarthTheme
        ? 'border-blue-400/20 bg-blue-900/20'
        : 'border-red-400/20 bg-red-900/20'
    }`}>
      {/* HUD Frame */}
      <div className={`absolute inset-0 ${
        isEarthTheme
          ? 'bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5'
          : 'bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5'
      }`}></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2" style={{
        borderColor: isEarthTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 78, 66, 0.4)'
      }}></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2" style={{
        borderColor: isEarthTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 78, 66, 0.4)'
      }}></div>
      
      <div className="container flex h-16 max-w-screen-2xl items-center relative z-10">
        {/* Logo Section */}
        <div className="flex items-center space-x-4">
          <Link href="/home" className="flex items-center space-x-3 group">
            <div className="relative">
              <Terminal className="h-7 w-7 group-hover:animate-pulse" style={{
                color: isEarthTheme ? '#3b82f6' : '#ff4e42'
              }} />
              <div className={`absolute -inset-1 rounded blur opacity-0 group-hover:opacity-100 transition-opacity ${
                isEarthTheme ? 'bg-blue-500/20' : 'bg-red-500/20'
              }`}></div>
            </div>
            <div className="flex flex-col">
              <span className="font-space font-bold text-lg group-hover:glow-text transition-all" style={{ color: useBlackText ? '#000000' : '#f3ede9' }}>
                CODE RUNNER
              </span>
              <span className="font-mono text-xs opacity-80" style={{
                color: isEarthTheme ? '#3b82f6' : '#ff4e42'
              }}>
                v2.847.x
              </span>
            </div>
          </Link>
          
          {/* Status Indicators */}
          <div className="hidden md:flex items-center space-x-4 ml-8">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded backdrop-blur-sm ${
              isEarthTheme
                ? 'bg-blue-900/20 border border-blue-400/40'
                : 'bg-red-900/20 border border-red-400/40'
            }`}>
              <Activity className="w-3 h-3 animate-pulse" style={{
                color: isEarthTheme ? '#3b82f6' : '#ff4e42'
              }} />
              <span className="text-xs font-mono font-semibold" style={{ color: useBlackText ? '#000000' : '#f3ede9' }}>ACTIVE</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded backdrop-blur-sm ${
              isEarthTheme
                ? 'bg-cyan-900/20 border border-cyan-400/40'
                : 'bg-orange-900/20 border border-orange-400/40'
            }`}>
              <Cpu className="w-3 h-3" style={{
                color: isEarthTheme ? '#3b82f6' : '#ff4e42'
              }} />
              <span className="text-xs font-mono font-semibold" style={{ color: useBlackText ? '#000000' : '#f3ede9' }}>CPU: 23%</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded backdrop-blur-sm ${
              isEarthTheme
                ? 'bg-blue-900/20 border border-blue-400/40'
                : 'bg-red-900/20 border border-red-400/40'
            }`}>
              <Zap className="w-3 h-3 animate-pulse" style={{
                color: isEarthTheme ? '#3b82f6' : '#ff4e42'
              }} />
              <span className="text-xs font-mono font-semibold" style={{ color: useBlackText ? '#000000' : '#f3ede9' }}>NEURAL</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex items-center space-x-6 mx-8">
          <Link
            href="/missions"
            className="relative group px-4 py-2 text-sm font-space font-medium transition-all duration-300"
            style={{ color: useBlackText ? '#000000' : '#f3ede9' }}
            onMouseEnter={(e) => e.currentTarget.style.color = isEarthTheme ? '#3b82f6' : '#ff4e42'}
            onMouseLeave={(e) => e.currentTarget.style.color = useBlackText ? '#000000' : '#f3ede9'}
            onClick={() => playProjectTextSound()}
          >
            <span className="relative z-10">MISSIONS</span>
            <div className={`absolute inset-0 border rounded opacity-0 group-hover:opacity-100 transition-opacity ${
              isEarthTheme
                ? 'bg-blue-500/10 border-blue-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}></div>
          </Link>
          <Link
            href="/compiler"
            className="relative group px-4 py-2 text-sm font-space font-medium transition-all duration-300"
            style={{ color: useBlackText ? '#000000' : '#f3ede9' }}
            onMouseEnter={(e) => e.currentTarget.style.color = isEarthTheme ? '#3b82f6' : '#ff4e42'}
            onMouseLeave={(e) => e.currentTarget.style.color = useBlackText ? '#000000' : '#f3ede9'}
            onClick={() => playProjectTextSound()}
          >
            <span className="relative z-10">COMPILER</span>
            <div className={`absolute inset-0 border rounded opacity-0 group-hover:opacity-100 transition-opacity ${
              isEarthTheme
                ? 'bg-blue-500/10 border-blue-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}></div>
          </Link>
        </nav>
        
        {/* User Section */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Power Status */}
          <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded backdrop-blur-sm ${
            isEarthTheme
              ? 'bg-blue-900/20 border border-blue-400/40'
              : 'bg-red-900/20 border border-red-400/40'
          }`}>
            <Power className="w-3 h-3 animate-pulse" style={{
              color: isEarthTheme ? '#3b82f6' : '#ff4e42'
            }} />
            <span className="text-xs font-mono font-semibold" style={{ color: useBlackText ? '#000000' : '#f3ede9' }}>ONLINE</span>
          </div>
          
          {/* Leaderboard */}
          <div className="hidden md:block">
            <Leaderboard />
          </div>
          
          {/* User Avatar */}
          <Link
            href="/profile"
            className="relative group"
            onClick={() => playProjectTextSound()}
          >
            <Avatar className={`h-10 w-10 border-2 transition-colors cursor-pointer ${
              isEarthTheme
                ? 'border-blue-500/40 group-hover:border-blue-400'
                : 'border-red-500/40 group-hover:border-red-400'
            }`}>
              <AvatarImage data-ai-hint="cyberpunk user avatar" src="https://placehold.co/100x100" alt="User" />
              <AvatarFallback className="bg-slate-800 font-space" style={{
                color: isEarthTheme ? '#3b82f6' : '#ff4e42'
              }}>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -inset-1 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity ${
              isEarthTheme ? 'bg-blue-500/20' : 'bg-red-500/20'
            }`}></div>
          </Link>
          
          {/* System Menu Indicator - Hexagon Sound Visualizer */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Hexagon 1 */}
            <div
              className="w-3 h-3 animate-pulse"
              style={{
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                mixBlendMode: 'overlay'
              }}
            ></div>
            {/* Hexagon 2 */}
            <div
              className="w-4 h-4 animate-pulse"
              style={{
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                mixBlendMode: 'overlay',
                animationDelay: '0.5s'
              }}
            ></div>
            {/* Hexagon 3 */}
            <div
              className="w-2 h-2 animate-pulse"
              style={{
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                mixBlendMode: 'overlay',
                animationDelay: '1s'
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Scanning Line Effect */}
      <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent to-transparent opacity-60 animate-pulse w-full ${
        isEarthTheme ? 'via-blue-400' : 'via-red-400'
      }`}></div>
    </header>
  );
}
