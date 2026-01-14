import { getCollection, COLLECTIONS } from './mongodb';
import { cache, createCacheKey } from '../utilities/cache';
import {
  DBProblem,
  DBTestCase,
  DBSession,
  DBLevel,
  DBUserProgress,
  Problem,
  TestCase,
  Session,
  Level,
  dbProblemToProblem,
  dbTestCaseToTestCase
} from './db-types';

export class OptimizedDatabaseService {
  // Problems with caching
  static async getAllProblems(): Promise<Problem[]> {
    const cacheKey = createCacheKey('problems', 'all');

    // Try cache first
    const cached = await cache.get<Problem[]>(cacheKey);
    if (cached) {
      console.log('Cache hit: getAllProblems');
      return cached;
    }

    // Get from database
    console.log('Cache miss: getAllProblems - fetching from DB');
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblems = await collection.find({}).sort({ problem_id: 1 }).toArray();
    const problems = dbProblems.map(dbProblemToProblem);

    // Cache for 30 seconds in development (was 3600)
    await cache.set(cacheKey, problems, 30);

    return problems;
  }

  static async getProblemById(problemId: number): Promise<Problem | null> {
    const cacheKey = createCacheKey('problem', problemId);

    // CACHE DISABLED - always fetch from DB
    // const cached = await cache.get<Problem>(cacheKey);
    // if (cached) {
    //   console.log(`Cache hit: getProblemById(${problemId})`);
    //   return cached;
    // }

    console.log(`[DIRECT] Problem ${problemId} - fresh MongoDB fetch`);
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblem = await collection.findOne({ problem_id: problemId });

    if (!dbProblem) return null;

    const problem = dbProblemToProblem(dbProblem);
    // NO CACHE - always fetch fresh from DB
    // await cache.set(cacheKey, problem, 0);

    return problem;
  }

  static async getProblemsBySession(sessionId: number): Promise<Problem[]> {
    const cacheKey = createCacheKey('problems', 'session', sessionId);

    const cached = await cache.get<Problem[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getProblemsBySession(${sessionId})`);
      return cached;
    }

    console.log(`Cache miss: getProblemsBySession(${sessionId}) - fetching from DB`);
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblems = await collection.find({ session_id: sessionId }).sort({ problem_id: 1 }).toArray();
    const problems = dbProblems.map(dbProblemToProblem);

    // Cache for 30 seconds in development (was 7200)
    await cache.set(cacheKey, problems, 30);

    return problems;
  }

  static async getProblemsByLevel(ageGroup: string, levelNumber: number): Promise<Problem[]> {
    const cacheKey = createCacheKey('problems', 'level', ageGroup, levelNumber);

    const cached = await cache.get<Problem[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getProblemsByLevel(${ageGroup}, ${levelNumber})`);
      return cached;
    }

    console.log(`Cache miss: getProblemsByLevel(${ageGroup}, ${levelNumber}) - fetching from DB`);
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblems = await collection.find({
      age_group: ageGroup,
      level_number: levelNumber
    }).sort({ session_id: 1, problem_id: 1 }).toArray();
    const problems = dbProblems.map(dbProblemToProblem);

    // Cache for 30 seconds in development (was 7200)
    await cache.set(cacheKey, problems, 30);

    return problems;
  }

  // Test Cases with caching
  static async getTestCasesForProblem(problemId: number): Promise<TestCase[]> {
    const cacheKey = createCacheKey('testcases', problemId);

    const cached = await cache.get<TestCase[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getTestCasesForProblem(${problemId})`);
      return cached;
    }

    console.log(`Cache miss: getTestCasesForProblem(${problemId}) - fetching from DB`);
    const collection = await getCollection<DBTestCase>(COLLECTIONS.TEST_CASES);
    const dbTestCases = await collection.find({ problem_id: problemId }).sort({ test_case_id: 1 }).toArray();
    const testCases = dbTestCases.map(dbTestCaseToTestCase);

    // Cache for 30 minutes
    await cache.set(cacheKey, testCases, 1800);

    return testCases;
  }

  static async getVisibleTestCasesForProblem(problemId: number): Promise<TestCase[]> {
    const cacheKey = createCacheKey('testcases', 'visible', problemId);

    const cached = await cache.get<TestCase[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getVisibleTestCasesForProblem(${problemId})`);
      return cached;
    }

    console.log(`Cache miss: getVisibleTestCasesForProblem(${problemId}) - fetching from DB`);
    const collection = await getCollection<DBTestCase>(COLLECTIONS.TEST_CASES);
    const dbTestCases = await collection.find({
      problem_id: problemId,
      is_hidden: false
    }).sort({ test_case_id: 1 }).toArray();
    const testCases = dbTestCases.map(dbTestCaseToTestCase);

    // Cache for 30 minutes
    await cache.set(cacheKey, testCases, 1800);

    return testCases;
  }

  // Optimized: Single aggregation query instead of multiple queries
  static async getLevelByAgeGroupAndNumber(ageGroup: string, levelNumber: number): Promise<Level | null> {
    const cacheKey = createCacheKey('level', ageGroup, levelNumber);

    const cached = await cache.get<Level>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getLevelByAgeGroupAndNumber(${ageGroup}, ${levelNumber})`);
      return cached;
    }

    console.log(`Cache miss: getLevelByAgeGroupAndNumber(${ageGroup}, ${levelNumber}) - fetching from DB`);

    // Single aggregation query instead of multiple queries - much faster!
    const collection = await getCollection<DBLevel>(COLLECTIONS.LEVELS);
    const pipeline = [
      { $match: { age_group: ageGroup, level_number: levelNumber } },
      {
        $lookup: {
          from: 'sessions',
          localField: 'level_id',
          foreignField: 'level_id',
          as: 'sessions',
          pipeline: [
            { $sort: { session_number: 1 } },
            {
              $lookup: {
                from: 'problems',
                localField: 'session_id',
                foreignField: 'session_id',
                as: 'problems',
                pipeline: [{ $sort: { problem_id: 1 } }]
              }
            }
          ]
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();

    if (result.length === 0) return null;

    const dbLevel = result[0];
    const level: Level = {
      level_id: dbLevel.level_id,
      level_number: dbLevel.level_number,
      title: dbLevel.title,
      age_group: dbLevel.age_group,
      description: dbLevel.description,
      sessions: dbLevel.sessions.map((session: any) => {
        const problems = session.problems.map(dbProblemToProblem);
        return {
          session_id: session.session_id,
          introduction_content: session.introduction_content,
          level_id: session.level_id,
          session_number: session.session_number,
          title: problems[0]?.session_title || session.title, // Prioritize session_title from first problem
          description: session.description,
          problems: problems,
          age_group: problems[0]?.age_group, // Get from first problem
          level_number: problems[0]?.level_number // Get from first problem
        };
      })
    };

    // Cache for 4 hours (levels change very rarely)
    await cache.set(cacheKey, level, 14400);

    return level;
  }

  // Optimized levels by age group
  static async getLevelsByAgeGroup(ageGroup: string): Promise<Level[]> {
    const cacheKey = createCacheKey('levels', ageGroup);

    const cached = await cache.get<Level[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getLevelsByAgeGroup(${ageGroup})`);
      return cached;
    }

    console.log(`Cache miss: getLevelsByAgeGroup(${ageGroup}) - fetching from DB`);

    // Optimized aggregation query
    const collection = await getCollection<DBLevel>(COLLECTIONS.LEVELS);
    const pipeline = [
      { $match: { age_group: ageGroup } },
      { $sort: { level_number: 1 } },
      {
        $lookup: {
          from: 'sessions',
          localField: 'level_id',
          foreignField: 'level_id',
          as: 'sessions',
          pipeline: [
            { $sort: { session_number: 1 } },
            {
              $lookup: {
                from: 'problems',
                localField: 'session_id',
                foreignField: 'session_id',
                as: 'problems',
                pipeline: [{ $sort: { problem_id: 1 } }]
              }
            }
          ]
        }
      }
    ];

    const dbLevels = await collection.aggregate(pipeline).toArray();

    const levels: Level[] = dbLevels.map((dbLevel: any) => ({
      level_id: dbLevel.level_id,
      level_number: dbLevel.level_number,
      title: dbLevel.title,
      age_group: dbLevel.age_group,
      description: dbLevel.description,
      sessions: dbLevel.sessions.map((session: any) => {
        const problems = session.problems.map(dbProblemToProblem);
        return {
          session_id: session.session_id,
          introduction_content: session.introduction_content,
          level_id: session.level_id,
          session_number: session.session_number,
          title: problems[0]?.session_title || session.title, // Prioritize session_title from first problem
          description: session.description,
          problems: problems,
          age_group: problems[0]?.age_group, // Get from first problem
          level_number: problems[0]?.level_number // Get from first problem
        };
      })
    }));

    // Cache for 4 hours
    await cache.set(cacheKey, levels, 14400);

    return levels;
  }

  // Sessions
  static async getSessionById(sessionId: number): Promise<Session | null> {
    const cacheKey = createCacheKey('session', sessionId);

    const cached = await cache.get<Session>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getSessionById(${sessionId})`);
      return cached;
    }

    console.log(`Cache miss: getSessionById(${sessionId}) - fetching from DB`);
    const collection = await getCollection<DBSession>(COLLECTIONS.SESSIONS);
    const dbSession = await collection.findOne({ session_id: sessionId });

    if (!dbSession) return null;

    // Get problems for this session
    const problems = await this.getProblemsBySession(sessionId);

    const session: Session = {
      session_id: dbSession.session_id,
      level_id: dbSession.level_id,
      session_number: dbSession.session_number,
      title: problems[0]?.session_title || dbSession.title, // Prioritize session_title from first problem
      description: dbSession.description,
      introduction_content: dbSession.introduction_content,
      problems: problems,
      age_group: problems[0]?.age_group, // Get from first problem
      level_number: problems[0]?.level_number // Get from first problem
    };

    // Cache for 2 hours
    await cache.set(cacheKey, session, 7200);

    return session;
  }

  // User Progress
  static async getUserProgress(userId: string, ageGroup: string): Promise<DBUserProgress | null> {
    const cacheKey = createCacheKey('progress', userId, ageGroup);

    const cached = await cache.get<DBUserProgress>(cacheKey);
    if (cached) {
      console.log(`Cache hit: getUserProgress(${userId}, ${ageGroup})`);
      return cached;
    }

    console.log(`Cache miss: getUserProgress(${userId}, ${ageGroup}) - fetching from DB`);
    const collection = await getCollection<DBUserProgress>(COLLECTIONS.USER_PROGRESS);
    const progress = await collection.findOne({ user_id: userId, age_group: ageGroup });

    if (progress) {
      // Cache for 15 minutes (user progress changes frequently)
      await cache.set(cacheKey, progress, 900);
    }

    return progress;
  }

  static async updateUserProgress(progress: DBUserProgress): Promise<void> {
    const collection = await getCollection<DBUserProgress>(COLLECTIONS.USER_PROGRESS);
    await collection.replaceOne(
      { user_id: progress.user_id, age_group: progress.age_group },
      { ...progress, updated_at: new Date() },
      { upsert: true }
    );

    // Invalidate cache
    const cacheKey = createCacheKey('progress', progress.user_id, progress.age_group);
    await cache.del(cacheKey);
  }

  // Cache invalidation when data changes
  static async invalidateCache(type: 'problem' | 'level' | 'session' | 'progress', id?: string | number): Promise<void> {
    console.log(`Invalidating cache for type: ${type}, id: ${id}`);

    switch (type) {
      case 'problem':
        await cache.invalidatePattern('problem:*');
        await cache.invalidatePattern('problems:*');
        await cache.invalidatePattern('testcases:*');
        break;
      case 'level':
        await cache.invalidatePattern('level:*');
        await cache.invalidatePattern('levels:*');
        break;
      case 'session':
        await cache.invalidatePattern('session:*');
        await cache.invalidatePattern('problems:session:*');
        await cache.invalidatePattern('level:*'); // Sessions affect levels
        break;
      case 'progress':
        if (id) {
          await cache.invalidatePattern(`progress:${id}:*`);
        } else {
          await cache.invalidatePattern('progress:*');
        }
        break;
    }
  }

  // Get cache statistics
  static getCacheStats() {
    return cache.getStats();
  }

  // Bulk insert operations for migration (no caching needed)
  static async insertProblems(problems: DBProblem[]): Promise<void> {
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    await collection.insertMany(problems);
    // Invalidate all problem caches
    await this.invalidateCache('problem');
  }

  static async insertTestCases(testCases: DBTestCase[]): Promise<void> {
    const collection = await getCollection<DBTestCase>(COLLECTIONS.TEST_CASES);
    await collection.insertMany(testCases);
    // Invalidate test case caches
    await cache.invalidatePattern('testcases:*');
  }

  static async insertSessions(sessions: DBSession[]): Promise<void> {
    const collection = await getCollection<DBSession>(COLLECTIONS.SESSIONS);
    await collection.insertMany(sessions);
    await this.invalidateCache('session');
  }

  static async insertLevels(levels: DBLevel[]): Promise<void> {
    const collection = await getCollection<DBLevel>(COLLECTIONS.LEVELS);
    await collection.insertMany(levels);
    await this.invalidateCache('level');
  }

  // Clear collections (for re-migration)
  static async clearAllData(): Promise<void> {
    const problemsCollection = await getCollection(COLLECTIONS.PROBLEMS);
    const testCasesCollection = await getCollection(COLLECTIONS.TEST_CASES);
    const sessionsCollection = await getCollection(COLLECTIONS.SESSIONS);
    const levelsCollection = await getCollection(COLLECTIONS.LEVELS);

    await Promise.all([
      problemsCollection.deleteMany({}),
      testCasesCollection.deleteMany({}),
      sessionsCollection.deleteMany({}),
      levelsCollection.deleteMany({})
    ]);

    // Clear all caches
    await cache.invalidatePattern('*');
  }
}