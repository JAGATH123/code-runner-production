export interface UserProgress {
  completedProblems: Set<string>;
  completedLevels: { [ageGroup: string]: Set<number> };
  currentLevel: { [ageGroup: string]: number };
}

export interface LevelProgress {
  ageGroup: string;
  levelNumber: number;
  completed: boolean;
  unlocked: boolean;
}

class ProgressManager {
  private static instance: ProgressManager;
  private progress: UserProgress;

  private constructor() {
    this.progress = this.loadProgress();
  }

  static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  private loadProgress(): UserProgress {
    if (typeof window === 'undefined') {
      return this.getDefaultProgress();
    }

    try {
      const saved = localStorage.getItem('coderunner_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          completedProblems: new Set(parsed.completedProblems || []),
          completedLevels: {
            '11-14': new Set(parsed.completedLevels?.['11-14'] || []),
            '15-18': new Set(parsed.completedLevels?.['15-18'] || [])
          },
          currentLevel: {
            '11-14': parsed.currentLevel?.['11-14'] || 1,
            '15-18': parsed.currentLevel?.['15-18'] || 1
          }
        };
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }

    return this.getDefaultProgress();
  }

  private getDefaultProgress(): UserProgress {
    return {
      completedProblems: new Set(),
      completedLevels: {
        '11-14': new Set(),
        '15-18': new Set()
      },
      currentLevel: {
        '11-14': 1,
        '15-18': 1
      }
    };
  }

  private saveProgress(): void {
    if (typeof window === 'undefined') return;

    try {
      const toSave = {
        completedProblems: Array.from(this.progress.completedProblems),
        completedLevels: {
          '11-14': Array.from(this.progress.completedLevels['11-14']),
          '15-18': Array.from(this.progress.completedLevels['15-18'])
        },
        currentLevel: this.progress.currentLevel
      };
      localStorage.setItem('coderunner_progress', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  markProblemComplete(problemId: string): void {
    this.progress.completedProblems.add(problemId);
    this.saveProgress();
  }

  markLevelComplete(ageGroup: string, levelNumber: number): void {
    this.progress.completedLevels[ageGroup].add(levelNumber);
    
    // Unlock next level
    const nextLevel = levelNumber + 1;
    if (nextLevel > this.progress.currentLevel[ageGroup]) {
      this.progress.currentLevel[ageGroup] = nextLevel;
    }
    
    this.saveProgress();
  }

  isProblemCompleted(problemId: string): boolean {
    return this.progress.completedProblems.has(problemId);
  }

  isLevelCompleted(ageGroup: string, levelNumber: number): boolean {
    return this.progress.completedLevels[ageGroup].has(levelNumber);
  }

  isLevelUnlocked(ageGroup: string, levelNumber: number): boolean {
    // Level 1 is always unlocked
    if (levelNumber === 1) return true;

    // TEMPORARY: Unlock all levels for age group 11-14 for development (Level 2)
    if (ageGroup === '11-14') return true;

    // Level is unlocked if the previous level is completed
    return this.isLevelCompleted(ageGroup, levelNumber - 1);
  }

  getCurrentLevel(ageGroup: string): number {
    return this.progress.currentLevel[ageGroup];
  }

  getLevelProgress(ageGroup: string, levelNumber: number): LevelProgress {
    return {
      ageGroup,
      levelNumber,
      completed: this.isLevelCompleted(ageGroup, levelNumber),
      unlocked: this.isLevelUnlocked(ageGroup, levelNumber)
    };
  }

  getChapterProgress(ageGroup: string): { completed: number; total: number; percentage: number } {
    const totalLevels = this.getTotalLevelsForAgeGroup(ageGroup);
    const completedLevels = this.progress.completedLevels[ageGroup].size;
    
    return {
      completed: completedLevels,
      total: totalLevels,
      percentage: totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0
    };
  }

  private getTotalLevelsForAgeGroup(ageGroup: string): number {
    // This should be updated based on your actual level structure
    // For now, assuming 10 levels per age group
    return 10;
  }

  getOverallProgress(): { completed: number; total: number; percentage: number } {
    const ageGroups = ['11-14', '15-18'];
    let totalCompleted = 0;
    let totalLevels = 0;

    ageGroups.forEach(ageGroup => {
      const progress = this.getChapterProgress(ageGroup);
      totalCompleted += progress.completed;
      totalLevels += progress.total;
    });

    return {
      completed: totalCompleted,
      total: totalLevels,
      percentage: totalLevels > 0 ? Math.round((totalCompleted / totalLevels) * 100) : 0
    };
  }

  resetProgress(): void {
    this.progress = this.getDefaultProgress();
    this.saveProgress();
  }

  // Get all levels for an age group with their status
  getAllLevelsForAgeGroup(ageGroup: string): LevelProgress[] {
    const totalLevels = this.getTotalLevelsForAgeGroup(ageGroup);
    const levels: LevelProgress[] = [];

    for (let i = 1; i <= totalLevels; i++) {
      levels.push(this.getLevelProgress(ageGroup, i));
    }

    return levels;
  }
}

// Export singleton instance
export const progressManager = ProgressManager.getInstance();

// Helper hooks for React components
export function useProgress() {
  return {
    markProblemComplete: (problemId: string) => progressManager.markProblemComplete(problemId),
    markLevelComplete: (ageGroup: string, levelNumber: number) => progressManager.markLevelComplete(ageGroup, levelNumber),
    isProblemCompleted: (problemId: string) => progressManager.isProblemCompleted(problemId),
    isLevelCompleted: (ageGroup: string, levelNumber: number) => progressManager.isLevelCompleted(ageGroup, levelNumber),
    isLevelUnlocked: (ageGroup: string, levelNumber: number) => progressManager.isLevelUnlocked(ageGroup, levelNumber),
    getLevelProgress: (ageGroup: string, levelNumber: number) => progressManager.getLevelProgress(ageGroup, levelNumber),
    getChapterProgress: (ageGroup: string) => progressManager.getChapterProgress(ageGroup),
    getOverallProgress: () => progressManager.getOverallProgress(),
    getAllLevelsForAgeGroup: (ageGroup: string) => progressManager.getAllLevelsForAgeGroup(ageGroup),
    resetProgress: () => progressManager.resetProgress()
  };
}