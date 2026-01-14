// Optimized data service with caching
import { OptimizedDatabaseService } from './db-service-optimized';
import type { Problem, Level, TestCase, Session } from './types';

export class DataService {
  // Use optimized database service with caching for better performance
  static async getAllLevels(): Promise<Level[]> {
    // For now, get all age groups - you may want to cache this list
    const ageGroups = ['beginner', 'intermediate', 'advanced']; // Add your age groups here
    const allLevels: Level[] = [];

    for (const ageGroup of ageGroups) {
      const levels = await OptimizedDatabaseService.getLevelsByAgeGroup(ageGroup);
      allLevels.push(...levels);
    }

    return allLevels;
  }

  static async getLevelsByAgeGroup(ageGroup: string): Promise<Level[]> {
    return await OptimizedDatabaseService.getLevelsByAgeGroup(ageGroup);
  }

  static async getLevelByAgeGroupAndNumber(ageGroup: string, levelNumber: number): Promise<Level | null> {
    return await OptimizedDatabaseService.getLevelByAgeGroupAndNumber(ageGroup, levelNumber);
  }

  static async getProblemById(problemId: number): Promise<Problem | null> {
    return await OptimizedDatabaseService.getProblemById(problemId);
  }

  static async getProblemsBySession(sessionId: number): Promise<Problem[]> {
    return await OptimizedDatabaseService.getProblemsBySession(sessionId);
  }

  static async getTestCasesForProblem(problemId: number): Promise<TestCase[]> {
    return await OptimizedDatabaseService.getTestCasesForProblem(problemId);
  }

  static async getVisibleTestCasesForProblem(problemId: number): Promise<TestCase[]> {
    return await OptimizedDatabaseService.getVisibleTestCasesForProblem(problemId);
  }

  static async getSessionById(sessionId: number): Promise<Session | null> {
    return await OptimizedDatabaseService.getSessionById(sessionId);
  }

  static async getUserProgress(userId: string, ageGroup: string) {
    return await OptimizedDatabaseService.getUserProgress(userId, ageGroup);
  }

  static async updateUserProgress(progress: any) {
    return await OptimizedDatabaseService.updateUserProgress(progress);
  }

  // Cache management methods
  static async invalidateCache(type: 'problem' | 'level' | 'session' | 'progress', id?: string | number) {
    return await OptimizedDatabaseService.invalidateCache(type, id);
  }

  static getCacheStats() {
    return OptimizedDatabaseService.getCacheStats();
  }

  // Utility to check if MongoDB is available and connected
  static async isMongoDBAvailable(): Promise<boolean> {
    try {
      await OptimizedDatabaseService.getAllProblems();
      return true;
    } catch (error) {
      console.error('MongoDB availability check failed:', error);
      return false;
    }
  }

  // Get data source information
  static getDataSourceInfo(): { source: 'mongodb'; available: boolean; cacheStats: any } {
    return {
      source: 'mongodb',
      available: true,
      cacheStats: OptimizedDatabaseService.getCacheStats()
    };
  }
}