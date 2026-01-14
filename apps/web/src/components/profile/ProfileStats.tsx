'use client';

import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Trophy,
  TrendingUp,
  Zap,
  Star,
  Shield,
  Crown,
  Check
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/types';

// Mock data - in real app, this would come from your database/API
const mockUserProfile: UserProfile = {
  id: '1',
  username: 'CodeRunner_Neo',
  email: 'neo@matrix.com',
  avatar: '/avatars/neo.jpg',
  joinDate: new Date('2024-01-15'),
  lastActive: new Date(),
  rank: 'ADVANCED',
  level: 42,
  experience: 15420,
  streak: {
    current: 15,
    longest: 28,
    lastSubmissionDate: new Date()
  },
  stats: {
    totalSolved: 51,
    easySolved: 40,
    mediumSolved: 11,
    hardSolved: 0,
    totalSubmissions: 342,
    acceptanceRate: 54.7
  },
  contestRating: 1847,
  achievements: [],
  skills: [],
  recentActivity: [],
  submissionCalendar: []
};

export function ProfileStats() {
  const [profile] = useState<UserProfile>(mockUserProfile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'NOVICE': return <Shield className="w-4 h-4" />;
      case 'ADVANCED': return <Star className="w-4 h-4" />;
      case 'EXPERT': return <Trophy className="w-4 h-4" />;
      case 'MASTER': return <Crown className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  // Calculate totals for the circular chart
  const totalEasy = 918;
  const totalMedium = 1974;
  const totalHard = 895;
  const totalProblems = totalEasy + totalMedium + totalHard;

  // Calculate percentages for the circular progress
  const easyPercentage = (profile.stats.easySolved / totalEasy) * 100;
  const mediumPercentage = (profile.stats.mediumSolved / totalMedium) * 100;
  const hardPercentage = (profile.stats.hardSolved / totalHard) * 100;

  // SVG circle properties
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 8;

  // Calculate stroke dash offsets for each segment
  const easyOffset = circumference - (easyPercentage / 100) * circumference;
  const mediumOffset = circumference - (mediumPercentage / 100) * circumference;
  const hardOffset = circumference - (hardPercentage / 100) * circumference;

  return (
    <div className="w-full h-full relative">
      <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Statistics</h2>
          <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-200 shadow-sm whitespace-nowrap">
            <div className="flex items-center gap-1">
              {getRankIcon(profile.rank)}
              {profile.rank}
            </div>
          </Badge>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Circular Progress Chart with Difficulty Breakdown */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {/* Circular Progress Chart */}
          <div className="relative flex items-center justify-center">
            <svg width="200" height="200" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
              />

              {/* Hard progress (red) - innermost */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#fca5a5"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={hardOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{ transformOrigin: '50% 50%' }}
              />

              {/* Medium progress (amber) - middle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={mediumOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{ transformOrigin: '50% 50%' }}
              />

              {/* Easy progress (green) - outermost */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#4ade80"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={easyOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{ transformOrigin: '50% 50%' }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-gray-900">{profile.stats.totalSolved}</div>
              <div className="text-sm text-gray-500">/{totalProblems}</div>
              <div className="flex items-center gap-1 mt-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">Solved</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">0 Attempting</div>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="flex flex-col gap-3">
            {/* Easy */}
            <div className="flex items-center gap-3">
              <div className="w-24 text-right">
                <span className="text-sm font-medium text-green-600">Easy</span>
              </div>
              <div className="text-sm font-bold text-gray-900 min-w-[60px]">
                {profile.stats.easySolved}/{totalEasy}
              </div>
            </div>

            {/* Medium */}
            <div className="flex items-center gap-3">
              <div className="w-24 text-right">
                <span className="text-sm font-medium text-amber-600">Med.</span>
              </div>
              <div className="text-sm font-bold text-gray-900 min-w-[60px]">
                {profile.stats.mediumSolved}/{totalMedium}
              </div>
            </div>

            {/* Hard */}
            <div className="flex items-center gap-3">
              <div className="w-24 text-right">
                <span className="text-sm font-medium text-red-600">Hard</span>
              </div>
              <div className="text-sm font-bold text-gray-900 min-w-[60px]">
                {profile.stats.hardSolved}/{totalHard}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Streak</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{profile.streak.current}</div>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Acceptance</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{profile.stats.acceptanceRate}%</div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Other Stats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Contest Rating
            </span>
            <span className="text-sm font-semibold text-gray-900">{profile.contestRating}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Member Since
            </span>
            <span className="text-sm text-gray-600">
              {profile.joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
