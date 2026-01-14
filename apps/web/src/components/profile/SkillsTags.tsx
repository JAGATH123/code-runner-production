'use client';

import { Badge } from '@/components/ui/badge';
import {
  Code2,
  Brain,
  Database,
  Lightbulb,
  Star,
  TrendingUp,
  Hash,
  Layers,
  Target
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Skill } from '@/lib/types';

const mockSkills: Skill[] = [
  {
    name: 'Python',
    level: 8,
    problemCount: 45,
    category: 'LANGUAGE'
  },
  {
    name: 'JavaScript',
    level: 7,
    problemCount: 32,
    category: 'LANGUAGE'
  },
  {
    name: 'Arrays',
    level: 9,
    problemCount: 38,
    category: 'DATA_STRUCTURE'
  },
  {
    name: 'Dynamic Programming',
    level: 6,
    problemCount: 18,
    category: 'ALGORITHM'
  },
  {
    name: 'Binary Search',
    level: 7,
    problemCount: 24,
    category: 'ALGORITHM'
  },
  {
    name: 'Linked Lists',
    level: 8,
    problemCount: 22,
    category: 'DATA_STRUCTURE'
  },
  {
    name: 'Trees',
    level: 7,
    problemCount: 31,
    category: 'DATA_STRUCTURE'
  },
  {
    name: 'Graphs',
    level: 5,
    problemCount: 15,
    category: 'DATA_STRUCTURE'
  },
  {
    name: 'Recursion',
    level: 8,
    problemCount: 26,
    category: 'CONCEPT'
  },
  {
    name: 'Two Pointers',
    level: 9,
    problemCount: 28,
    category: 'CONCEPT'
  },
  {
    name: 'C++',
    level: 6,
    problemCount: 19,
    category: 'LANGUAGE'
  },
  {
    name: 'Sorting',
    level: 9,
    problemCount: 21,
    category: 'ALGORITHM'
  }
];

export function SkillsTags() {
  const [skills] = useState<Skill[]>(mockSkills.sort((a, b) => b.level - a.level));
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getCategoryIcon = (category: Skill['category'], className: string = "w-8 h-8") => {
    const iconProps = { className };
    switch (category) {
      case 'LANGUAGE': return <Code2 {...iconProps} />;
      case 'ALGORITHM': return <Brain {...iconProps} />;
      case 'DATA_STRUCTURE': return <Database {...iconProps} />;
      case 'CONCEPT': return <Lightbulb {...iconProps} />;
      default: return <Hash {...iconProps} />;
    }
  };

  const getCategoryColor = (category: Skill['category']) => {
    switch (category) {
      case 'LANGUAGE': return 'text-blue-600 border-blue-300 bg-blue-50';
      case 'ALGORITHM': return 'text-purple-600 border-purple-300 bg-purple-50';
      case 'DATA_STRUCTURE': return 'text-green-600 border-green-300 bg-green-50';
      case 'CONCEPT': return 'text-pink-600 border-pink-300 bg-pink-50';
      default: return 'text-gray-700 border-gray-300 bg-gray-50';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'text-pink-600 bg-pink-50 border-pink-300';
    if (level >= 7) return 'text-green-600 bg-green-50 border-green-300';
    if (level >= 5) return 'text-blue-600 bg-blue-50 border-blue-300';
    return 'text-yellow-600 bg-yellow-50 border-yellow-300';
  };

  const getLevelIconColor = (level: number) => {
    if (level >= 9) return 'text-pink-600';
    if (level >= 7) return 'text-green-600';
    if (level >= 5) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getLevelGlow = (level: number) => {
    if (level >= 9) return 'hover:shadow-md hover:border-pink-400';
    if (level >= 7) return 'hover:shadow-md hover:border-green-400';
    if (level >= 5) return 'hover:shadow-md hover:border-blue-400';
    return 'hover:shadow-md hover:border-yellow-400';
  };

  const getLevelText = (level: number) => {
    if (level >= 9) return 'Expert';
    if (level >= 7) return 'Advanced';
    if (level >= 5) return 'Proficient';
    return 'Learning';
  };

  const totalProblems = skills.reduce((sum, skill) => sum + skill.problemCount, 0);
  const avgLevel = skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length;

  const categoryStats = skills.reduce((acc, skill) => {
    acc[skill.category] = (acc[skill.category] || 0) + 1;
    return acc;
  }, {} as Record<Skill['category'], number>);

  return (
    <div className="w-full relative">
      <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Skills</h3>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
            <div className="text-xl md:text-2xl font-bold text-green-600">{skills.length}</div>
            <div className="text-[10px] md:text-xs text-green-700 mt-1">Skills</div>
          </div>
          <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{totalProblems}</div>
            <div className="text-[10px] md:text-xs text-blue-700 mt-1">Problems</div>
          </div>
          <div className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
            <div className="text-xl md:text-2xl font-bold text-purple-600">{avgLevel.toFixed(1)}</div>
            <div className="text-[10px] md:text-xs text-purple-700 mt-1">Avg Level</div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className={`relative p-3 md:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                getLevelColor(skill.level)
              } ${getLevelGlow(skill.level)} ${
                selectedSkill?.name === skill.name ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
              }`}
              onClick={() => setSelectedSkill(
                selectedSkill?.name === skill.name ? null : skill
              )}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                {/* Category Icon */}
                <div className="relative">
                  {getCategoryIcon(skill.category, `w-8 h-8 ${getLevelIconColor(skill.level)}`)}
                </div>

                {/* Skill Name */}
                <div className="w-full">
                  <div className="text-xs md:text-sm font-semibold text-gray-900 mb-1">
                    {skill.name}
                  </div>

                  {/* Level Badge */}
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className={`w-3 h-3 ${getLevelIconColor(skill.level)}`} />
                    <span className={`text-xs font-bold ${getLevelIconColor(skill.level)}`}>
                      {skill.level}/10
                    </span>
                  </div>

                  {/* Category Badge */}
                  <Badge className={`text-[10px] ${getCategoryColor(skill.category)}`}>
                    {skill.category}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Skill Details Popup */}
        {selectedSkill && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className={`relative rounded-lg border p-3 md:p-4 ${getLevelColor(selectedSkill.level)}`}>
              <div className="flex items-start gap-3 mb-3">
                {getCategoryIcon(selectedSkill.category, `w-8 h-8 ${getLevelIconColor(selectedSkill.level)}`)}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{selectedSkill.name}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    {getLevelText(selectedSkill.level)} level skill with {selectedSkill.problemCount} problems solved
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedSkill.level >= 9 ? 'bg-pink-600' :
                      selectedSkill.level >= 7 ? 'bg-green-600' :
                      selectedSkill.level >= 5 ? 'bg-blue-600' :
                      'bg-yellow-600'
                    }`}
                    style={{ width: `${Math.min(selectedSkill.level * 10, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>Level {selectedSkill.level}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {selectedSkill.level < 10 ? `${10 - selectedSkill.level} to max` : 'Maxed'}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] md:text-xs">
                <div className="flex items-center gap-2">
                  <Badge className={`${getCategoryColor(selectedSkill.category)}`}>
                    {selectedSkill.category}
                  </Badge>
                  <Badge className={`${getLevelColor(selectedSkill.level)}`}>
                    {getLevelText(selectedSkill.level)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Target className="w-3 h-3" />
                  <span>{selectedSkill.problemCount} problems</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
