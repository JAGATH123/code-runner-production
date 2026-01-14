'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Trophy, TrendingUp, Users, Medal, Star, Crown, Zap, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar?: string;
  rank: 'NOVICE' | 'ADVANCED' | 'EXPERT' | 'MASTER';
  totalSolved: number;
  level: number;
  contestRating: number;
  experience: number;
  streak: number;
  country?: string;
}

// Extended mock leaderboard data
const mockLeaderboardData: LeaderboardUser[] = [
  {
    id: '1',
    username: 'CodeMaster_X',
    avatar: 'https://placehold.co/64x64',
    rank: 'MASTER',
    totalSolved: 287,
    level: 42,
    contestRating: 2150,
    experience: 45000,
    streak: 28,
    country: 'US'
  },
  {
    id: '2',
    username: 'AlgoNinja',
    avatar: 'https://placehold.co/64x64',
    rank: 'EXPERT',
    totalSolved: 245,
    level: 38,
    contestRating: 1980,
    experience: 38000,
    streak: 22,
    country: 'JP'
  },
  {
    id: '3',
    username: 'PyQueen',
    avatar: 'https://placehold.co/64x64',
    rank: 'EXPERT',
    totalSolved: 198,
    level: 34,
    contestRating: 1875,
    experience: 32000,
    streak: 15,
    country: 'DE'
  },
  {
    id: '4',
    username: 'DataWizard',
    avatar: 'https://placehold.co/64x64',
    rank: 'ADVANCED',
    totalSolved: 156,
    level: 28,
    contestRating: 1650,
    experience: 25000,
    streak: 12,
    country: 'CA'
  },
  {
    id: '5',
    username: 'LogicBot',
    avatar: 'https://placehold.co/64x64',
    rank: 'ADVANCED',
    totalSolved: 134,
    level: 25,
    contestRating: 1520,
    experience: 22000,
    streak: 8,
    country: 'UK'
  },
  {
    id: '6',
    username: 'You',
    avatar: 'https://placehold.co/64x64',
    rank: 'ADVANCED',
    totalSolved: 89,
    level: 22,
    contestRating: 1420,
    experience: 18000,
    streak: 5,
    country: 'IN'
  },
  {
    id: '7',
    username: 'ByteMaster',
    avatar: 'https://placehold.co/64x64',
    rank: 'ADVANCED',
    totalSolved: 78,
    level: 20,
    contestRating: 1380,
    experience: 16000,
    streak: 3,
    country: 'AU'
  },
  {
    id: '8',
    username: 'CodeNinja42',
    avatar: 'https://placehold.co/64x64',
    rank: 'NOVICE',
    totalSolved: 65,
    level: 18,
    contestRating: 1250,
    experience: 14000,
    streak: 7,
    country: 'FR'
  },
  {
    id: '9',
    username: 'AlgorithmPro',
    avatar: 'https://placehold.co/64x64',
    rank: 'NOVICE',
    totalSolved: 52,
    level: 16,
    contestRating: 1180,
    experience: 12000,
    streak: 4,
    country: 'BR'
  },
  {
    id: '10',
    username: 'DebugKing',
    avatar: 'https://placehold.co/64x64',
    rank: 'NOVICE',
    totalSolved: 41,
    level: 14,
    contestRating: 1050,
    experience: 10000,
    streak: 2,
    country: 'IT'
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
    case 1: return <Crown className="w-6 h-6" style={{ color: '#ffd700' }} />;
    case 2: return <Trophy className="w-6 h-6" style={{ color: '#c0c0c0' }} />;
    case 3: return <Medal className="w-6 h-6" style={{ color: '#cd7f32' }} />;
    default: return <span className="text-lg font-mono font-bold text-muted-foreground">#{position}</span>;
  }
};

export default function RankPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    setLeaderboardData(mockLeaderboardData);
  }, []);

  const currentUser = leaderboardData.find(user => user.username === 'You');
  const currentUserRank = leaderboardData.findIndex(user => user.username === 'You') + 1;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255, 107, 53, 0.3) 1px, transparent 0)
          `,
          backgroundSize: '50px 50px',
          animation: 'pulse 6s ease-in-out infinite'
        }}></div>
      </div>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-orange-500/30 mb-6 glow-border">
            <Trophy className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-sm font-space text-orange-400">RANKING SYSTEM</span>
            <Trophy className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-6xl font-space font-black tracking-tight mb-4 neon-text">
            GALACTIC LEADERBOARD
          </h1>
          <div className="text-lg md:text-xl font-space text-orange-400 mb-4 glow-text">
            Elite Programmers Across the Universe
          </div>
        </div>

        {/* Current User Stats */}
        {currentUser && (
          <Card className="mb-8 hologram border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-400 font-space">
                <Star className="w-6 h-6" />
                YOUR CURRENT STANDING
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-orange-400/40">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                    <AvatarFallback className="bg-orange-900/20 text-orange-400 text-xl font-bold">
                      {currentUser.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-space font-bold text-foreground">{currentUser.username}</h3>
                    <Badge
                      className="mt-1"
                      style={{
                        backgroundColor: `${getRankColor(currentUser.rank)}20`,
                        color: getRankColor(currentUser.rank),
                        border: `1px solid ${getRankColor(currentUser.rank)}40`
                      }}
                    >
                      {currentUser.rank}
                    </Badge>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-space font-bold text-orange-400">#{currentUserRank}</div>
                  <div className="text-sm text-muted-foreground">Global Rank</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-space font-bold text-cyan-400">{currentUser.totalSolved}</div>
                  <div className="text-sm text-muted-foreground">Problems Solved</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-space font-bold text-purple-400">{currentUser.contestRating}</div>
                  <div className="text-sm text-muted-foreground">Contest Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="global" className="font-space">GLOBAL RANKINGS</TabsTrigger>
            <TabsTrigger value="weekly" className="font-space">WEEKLY CHAMPIONS</TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            <Card className="hologram border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-400 font-space">
                  <Users className="w-6 h-6" />
                  GLOBAL LEADERBOARD
                  <Badge variant="outline" className="ml-auto">
                    {leaderboardData.length} Total Users
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboardData.map((user, index) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${
                        user.username === 'You'
                          ? 'bg-orange-900/20 border-orange-400/40 glow-border-orange'
                          : 'bg-card/30 border-muted hover:border-orange-400/30'
                      }`}
                    >
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(index + 1)}
                      </div>

                      <Avatar className="h-12 w-12 border-2 border-muted">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback className="bg-muted text-lg font-bold">
                          {user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-space font-bold text-foreground truncate">
                            {user.username}
                            {user.username === 'You' && (
                              <span className="ml-2 text-orange-400">(You)</span>
                            )}
                          </h3>
                          <Badge
                            style={{
                              backgroundColor: `${getRankColor(user.rank)}20`,
                              color: getRankColor(user.rank),
                              border: `1px solid ${getRankColor(user.rank)}40`
                            }}
                          >
                            {user.rank}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span className="text-muted-foreground">Solved:</span>
                            <span className="text-cyan-400 font-mono">{user.totalSolved}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            <span className="text-muted-foreground">Level:</span>
                            <span className="text-purple-400 font-mono">{user.level}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-orange-400" />
                            <span className="text-muted-foreground">Rating:</span>
                            <span className="text-orange-400 font-mono">{user.contestRating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4 text-green-400" />
                            <span className="text-muted-foreground">Streak:</span>
                            <span className="text-green-400 font-mono">{user.streak}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card className="hologram border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-400 font-space">
                  <Star className="w-6 h-6" />
                  WEEKLY CHAMPIONS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-xl font-space font-bold text-orange-400 mb-2">
                    WEEKLY LEADERBOARD
                  </h3>
                  <p className="text-muted-foreground">
                    Weekly rankings will be available soon. Train hard, Commander!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-6 border-t border-primary/20 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <span className="font-mono">GALACTIC RANKING SYSTEM:</span>
          <span className="text-orange-400">OPERATIONAL</span>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
}