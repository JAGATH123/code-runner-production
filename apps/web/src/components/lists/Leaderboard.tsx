'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar?: string;
  rank: 'NOVICE' | 'ADVANCED' | 'EXPERT' | 'MASTER';
  totalSolved: number;
  level: number;
  contestRating: number;
}

// Mock leaderboard data - trial version with 6 users
const mockLeaderboardData: LeaderboardUser[] = [
  {
    id: '1',
    username: 'CodeMaster_X',
    avatar: 'https://placehold.co/32x32',
    rank: 'MASTER',
    totalSolved: 287,
    level: 42,
    contestRating: 2150
  },
  {
    id: '2',
    username: 'AlgoNinja',
    avatar: 'https://placehold.co/32x32',
    rank: 'EXPERT',
    totalSolved: 245,
    level: 38,
    contestRating: 1980
  },
  {
    id: '3',
    username: 'PyQueen',
    avatar: 'https://placehold.co/32x32',
    rank: 'EXPERT',
    totalSolved: 198,
    level: 34,
    contestRating: 1875
  },
  {
    id: '4',
    username: 'DataWizard',
    avatar: 'https://placehold.co/32x32',
    rank: 'ADVANCED',
    totalSolved: 156,
    level: 28,
    contestRating: 1650
  },
  {
    id: '5',
    username: 'LogicBot',
    avatar: 'https://placehold.co/32x32',
    rank: 'ADVANCED',
    totalSolved: 134,
    level: 25,
    contestRating: 1520
  },
  {
    id: '6',
    username: 'You',
    avatar: 'https://placehold.co/32x32',
    rank: 'ADVANCED',
    totalSolved: 89,
    level: 22,
    contestRating: 1420
  }
];

const getRankColor = (rank: string) => {
  switch (rank) {
    case 'MASTER': return '#ff6b35';
    case 'EXPERT': return '#9f40ff';
    case 'ADVANCED': return '#40ffff';
    case 'NOVICE': return '#40ff80';
    default: return '#a0b3c4';
  }
};

const getRankIcon = (position: number) => {
  switch (position) {
    case 1: return <Trophy className="w-4 h-4" style={{ color: '#ffd700' }} />;
    case 2: return <Medal className="w-4 h-4" style={{ color: '#c0c0c0' }} />;
    case 3: return <Medal className="w-4 h-4" style={{ color: '#cd7f32' }} />;
    default: return <span className="text-xs font-mono text-muted-foreground">#{position}</span>;
  }
};

export function Leaderboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  useEffect(() => {
    // In a real app, fetch leaderboard data from API
    setLeaderboardData(mockLeaderboardData);
  }, []);

  const currentUserRank = 6; // Mock current user rank
  const currentUser = leaderboardData.find(user => user.username === 'You');
  const displayUsers = showFullLeaderboard ? leaderboardData : leaderboardData.slice(0, 5);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 px-3 py-1 h-8 rounded bg-slate-800/50 border border-orange-500/30 hover:border-orange-400/50 transition-colors"
        >
          <TrendingUp className="w-3 h-3" style={{ color: '#ff6b35' }} />
          <span className="text-xs font-mono" style={{ color: '#ff6b35' }}>
            RANK #{currentUserRank}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-slate-900/95 border border-orange-500/30 backdrop-blur-xl"
        align="center"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" style={{ color: '#ffd700' }} />
              <h3 className="font-space font-bold text-sm" style={{ color: '#ff6b35' }}>
                {showFullLeaderboard ? 'FULL LEADERBOARD' : 'TOP RANKINGS'}
              </h3>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20">
              <Users className="w-3 h-3" style={{ color: '#ff6b35' }} />
              <span className="text-xs font-mono" style={{ color: '#ff6b35' }}>
                {leaderboardData.length} USERS
              </span>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {displayUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center space-x-3 p-2 rounded bg-slate-800/30 border border-slate-700/50 hover:border-orange-500/30 transition-colors"
              >
                <div className="flex items-center justify-center w-6">
                  {getRankIcon(index + 1)}
                </div>
                
                <Avatar className="h-6 w-6 border border-slate-600">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-slate-700 text-xs">
                    {user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">
                      {user.username}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span
                        className="text-xs font-mono px-1 rounded"
                        style={{ 
                          color: getRankColor(user.rank),
                          backgroundColor: `${getRankColor(user.rank)}20`
                        }}
                      >
                        {user.rank}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{user.totalSolved} solved</span>
                    <span>Lv.{user.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="flex justify-center space-x-2">
              {!showFullLeaderboard ? (
                <Link href="/rank">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-mono hover:bg-orange-500/10"
                    style={{ color: '#ff6b35' }}
                    onClick={() => setIsOpen(false)}
                  >
                    VIEW FULL LEADERBOARD
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-mono hover:bg-orange-500/10"
                  style={{ color: '#ff6b35' }}
                  onClick={() => setShowFullLeaderboard(false)}
                >
                  SHOW TOP 5
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-mono hover:bg-slate-600/10"
                style={{ color: '#a0b3c4' }}
                onClick={() => setIsOpen(false)}
              >
                CLOSE
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}