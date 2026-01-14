'use client';

import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Star,
  Crown,
  Shield,
  Award,
  Target,
  Zap,
  Clock,
  Code,
  TrendingUp,
  Flame,
  Medal
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Achievement } from '@/lib/types';

const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Blood',
    description: 'Solved your first problem',
    icon: 'target',
    unlockedAt: new Date('2024-01-15'),
    rarity: 'COMMON',
    category: 'MILESTONE'
  },
  {
    id: '2',
    name: 'Speed Runner',
    description: 'Solved a problem in under 5 minutes',
    icon: 'zap',
    unlockedAt: new Date('2024-02-01'),
    rarity: 'RARE',
    category: 'SPEED'
  },
  {
    id: '3',
    name: 'Streak Master',
    description: 'Maintained a 30-day coding streak',
    icon: 'flame',
    unlockedAt: new Date('2024-02-14'),
    rarity: 'EPIC',
    category: 'STREAK'
  },
  {
    id: '4',
    name: 'Problem Crusher',
    description: 'Solved 100 problems',
    icon: 'trophy',
    unlockedAt: new Date('2024-03-10'),
    rarity: 'EPIC',
    category: 'MILESTONE'
  },
  {
    id: '5',
    name: 'Hard Mode',
    description: 'Solved 10 Hard problems',
    icon: 'crown',
    unlockedAt: new Date('2024-03-25'),
    rarity: 'LEGENDARY',
    category: 'SOLVING'
  },
  {
    id: '6',
    name: 'Night Owl',
    description: 'Solved problems at 3 AM',
    icon: 'clock',
    unlockedAt: new Date('2024-04-01'),
    rarity: 'RARE',
    category: 'MASTERY'
  }
];

export function Achievements() {
  const [achievements] = useState<Achievement[]>(mockAchievements);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getAchievementIcon = (icon: string, rarity: Achievement['rarity']) => {
    const iconProps = {
      className: `w-8 h-8 ${getRarityIconColor(rarity)}`
    };

    switch (icon) {
      case 'target': return <Target {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'flame': return <Flame {...iconProps} />;
      case 'trophy': return <Trophy {...iconProps} />;
      case 'crown': return <Crown {...iconProps} />;
      case 'clock': return <Clock {...iconProps} />;
      case 'code': return <Code {...iconProps} />;
      case 'medal': return <Medal {...iconProps} />;
      case 'shield': return <Shield {...iconProps} />;
      case 'star': return <Star {...iconProps} />;
      default: return <Award {...iconProps} />;
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'COMMON': return 'text-gray-600 border-gray-300 bg-gray-50';
      case 'RARE': return 'text-blue-600 border-blue-300 bg-blue-50';
      case 'EPIC': return 'text-purple-600 border-purple-300 bg-purple-50';
      case 'LEGENDARY': return 'text-pink-600 border-pink-300 bg-pink-50';
      default: return 'text-gray-700 border-gray-300 bg-gray-50';
    }
  };

  const getRarityIconColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'COMMON': return 'text-gray-600';
      case 'RARE': return 'text-blue-600';
      case 'EPIC': return 'text-purple-600';
      case 'LEGENDARY': return 'text-pink-600';
      default: return 'text-gray-700';
    }
  };

  const getRarityGlow = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'COMMON': return 'hover:shadow-md hover:border-gray-400';
      case 'RARE': return 'hover:shadow-md hover:border-blue-400';
      case 'EPIC': return 'hover:shadow-md hover:border-purple-400';
      case 'LEGENDARY': return 'hover:shadow-lg hover:border-pink-400';
      default: return 'hover:shadow-md';
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'SOLVING': return <Code className="w-3 h-3" />;
      case 'STREAK': return <Flame className="w-3 h-3" />;
      case 'SPEED': return <Zap className="w-3 h-3" />;
      case 'MASTERY': return <Star className="w-3 h-3" />;
      case 'MILESTONE': return <TrendingUp className="w-3 h-3" />;
      default: return <Award className="w-3 h-3" />;
    }
  };

  const totalPoints = achievements.reduce((sum, achievement) => {
    switch (achievement.rarity) {
      case 'COMMON': return sum + 10;
      case 'RARE': return sum + 25;
      case 'EPIC': return sum + 50;
      case 'LEGENDARY': return sum + 100;
      default: return sum;
    }
  }, 0);

  const rarityCount = achievements.reduce((acc, achievement) => {
    acc[achievement.rarity] = (acc[achievement.rarity] || 0) + 1;
    return acc;
  }, {} as Record<Achievement['rarity'], number>);

  return (
    <div className="w-full relative">
      <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Achievements</h3>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200">
            <div className="text-xl md:text-2xl font-bold text-yellow-600">{achievements.length}</div>
            <div className="text-[10px] md:text-xs text-yellow-700 mt-1">Unlocked</div>
          </div>
          <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
            <div className="text-xl md:text-2xl font-bold text-purple-600">{totalPoints}</div>
            <div className="text-[10px] md:text-xs text-purple-700 mt-1">Points</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-3 md:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                getRarityColor(achievement.rarity)
              } ${getRarityGlow(achievement.rarity)} ${
                selectedAchievement?.id === achievement.id ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
              }`}
              onClick={() => setSelectedAchievement(
                selectedAchievement?.id === achievement.id ? null : achievement
              )}
            >
              <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                <div className="relative">
                  {getAchievementIcon(achievement.icon, achievement.rarity)}
                </div>

                <div className="w-full">
                  <div className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2">
                    {achievement.name}
                  </div>

                  <div className="flex items-center justify-center gap-1 mb-1 md:mb-2">
                    <Badge className={`text-[10px] md:text-xs ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-[10px] md:text-xs text-gray-600">
                    {getCategoryIcon(achievement.category)}
                    <span>{achievement.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedAchievement && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className={`relative rounded-lg border p-3 md:p-4 ${getRarityColor(selectedAchievement.rarity)}`}>
              <div className="flex items-start gap-3 mb-3">
                {getAchievementIcon(selectedAchievement.icon, selectedAchievement.rarity)}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{selectedAchievement.name}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">{selectedAchievement.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] md:text-xs">
                <div className="flex items-center gap-2">
                  <Badge className={`${getRarityColor(selectedAchievement.rarity)}`}>
                    {selectedAchievement.rarity}
                  </Badge>
                  <div className="flex items-center gap-1 text-gray-600">
                    {getCategoryIcon(selectedAchievement.category)}
                    <span>{selectedAchievement.category}</span>
                  </div>
                </div>
                <span className="text-gray-600">
                  {selectedAchievement.unlockedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
