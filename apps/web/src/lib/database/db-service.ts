import { getCollection, COLLECTIONS } from './mongodb';
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

export class DatabaseService {
  // Problems
  static async getAllProblems(): Promise<Problem[]> {
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblems = await collection.find({}).sort({ problem_id: 1 }).toArray();
    return dbProblems.map(dbProblemToProblem);
  }

  static async getProblemById(problemId: number): Promise<Problem | null> {
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblem = await collection.findOne({ problem_id: problemId });
    return dbProblem ? dbProblemToProblem(dbProblem) : null;
  }

  static async getProblemsBySession(sessionId: number): Promise<Problem[]> {
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblems = await collection.find({ session_id: sessionId }).sort({ problem_id: 1 }).toArray();
    return dbProblems.map(dbProblemToProblem);
  }

  static async getProblemsByLevel(ageGroup: string, levelNumber: number): Promise<Problem[]> {
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    const dbProblems = await collection.find({ 
      age_group: ageGroup, 
      level_number: levelNumber 
    }).sort({ session_id: 1, problem_id: 1 }).toArray();
    return dbProblems.map(dbProblemToProblem);
  }

  // Test Cases
  static async getTestCasesForProblem(problemId: number): Promise<TestCase[]> {
    const collection = await getCollection<DBTestCase>(COLLECTIONS.TEST_CASES);
    const dbTestCases = await collection.find({ problem_id: problemId }).sort({ test_case_id: 1 }).toArray();
    return dbTestCases.map(dbTestCaseToTestCase);
  }

  static async getVisibleTestCasesForProblem(problemId: number): Promise<TestCase[]> {
    const collection = await getCollection<DBTestCase>(COLLECTIONS.TEST_CASES);
    const dbTestCases = await collection.find({ 
      problem_id: problemId, 
      is_hidden: false 
    }).sort({ test_case_id: 1 }).toArray();
    return dbTestCases.map(dbTestCaseToTestCase);
  }

  // Sessions
  static async getSessionById(sessionId: number): Promise<Session | null> {
    const collection = await getCollection<DBSession>(COLLECTIONS.SESSIONS);
    const dbSession = await collection.findOne({ session_id: sessionId });
    
    if (!dbSession) return null;

    // Get problems for this session
    const problems = await this.getProblemsBySession(sessionId);

    return {
      session_id: dbSession.session_id,
      level_id: dbSession.level_id,
      session_number: dbSession.session_number,
      title: dbSession.title,
      description: dbSession.description,
      problems: problems
    };
  }

  static async getSessionsByLevel(levelId: number): Promise<Session[]> {
    const collection = await getCollection<DBSession>(COLLECTIONS.SESSIONS);
    const dbSessions = await collection.find({ level_id: levelId }).sort({ session_number: 1 }).toArray();
    
    const sessions: Session[] = [];
    for (const dbSession of dbSessions) {
      const problems = await this.getProblemsBySession(dbSession.session_id);
      sessions.push({
        session_id: dbSession.session_id,
        level_id: dbSession.level_id,
        session_number: dbSession.session_number,
        title: dbSession.title,
        description: dbSession.description,
        problems: problems
      });
    }
    
    return sessions;
  }

  // Levels
  static async getAllLevels(): Promise<Level[]> {
    const collection = await getCollection<DBLevel>(COLLECTIONS.LEVELS);
    const dbLevels = await collection.find({}).sort({ level_number: 1 }).toArray();
    
    const levels: Level[] = [];
    for (const dbLevel of dbLevels) {
      const sessions = await this.getSessionsByLevel(dbLevel.level_id);
      levels.push({
        level_id: dbLevel.level_id,
        level_number: dbLevel.level_number,
        title: dbLevel.title,
        age_group: dbLevel.age_group,
        description: dbLevel.description,
        sessions: sessions
      });
    }
    
    return levels;
  }

  static async getLevelsByAgeGroup(ageGroup: string): Promise<Level[]> {
    const collection = await getCollection<DBLevel>(COLLECTIONS.LEVELS);
    const dbLevels = await collection.find({ age_group: ageGroup }).sort({ level_number: 1 }).toArray();
    
    const levels: Level[] = [];
    for (const dbLevel of dbLevels) {
      const sessions = await this.getSessionsByLevel(dbLevel.level_id);
      levels.push({
        level_id: dbLevel.level_id,
        level_number: dbLevel.level_number,
        title: dbLevel.title,
        age_group: dbLevel.age_group,
        description: dbLevel.description,
        sessions: sessions
      });
    }
    
    return levels;
  }

  static async getLevelByAgeGroupAndNumber(ageGroup: string, levelNumber: number): Promise<Level | null> {
    const collection = await getCollection<DBLevel>(COLLECTIONS.LEVELS);
    const dbLevel = await collection.findOne({ age_group: ageGroup, level_number: levelNumber });
    
    if (!dbLevel) return null;

    const sessions = await this.getSessionsByLevel(dbLevel.level_id);
    return {
      level_id: dbLevel.level_id,
      level_number: dbLevel.level_number,
      title: dbLevel.title,
      age_group: dbLevel.age_group,
      description: dbLevel.description,
      sessions: sessions
    };
  }

  // User Progress
  static async getUserProgress(userId: string, ageGroup: string): Promise<DBUserProgress | null> {
    const collection = await getCollection<DBUserProgress>(COLLECTIONS.USER_PROGRESS);
    return await collection.findOne({ user_id: userId, age_group: ageGroup });
  }

  static async updateUserProgress(progress: DBUserProgress): Promise<void> {
    const collection = await getCollection<DBUserProgress>(COLLECTIONS.USER_PROGRESS);
    await collection.replaceOne(
      { user_id: progress.user_id, age_group: progress.age_group },
      { ...progress, updated_at: new Date() },
      { upsert: true }
    );
  }

  // Bulk insert operations for migration
  static async insertProblems(problems: DBProblem[]): Promise<void> {
    const collection = await getCollection<DBProblem>(COLLECTIONS.PROBLEMS);
    await collection.insertMany(problems);
  }

  static async insertTestCases(testCases: DBTestCase[]): Promise<void> {
    const collection = await getCollection<DBTestCase>(COLLECTIONS.TEST_CASES);
    await collection.insertMany(testCases);
  }

  static async insertSessions(sessions: DBSession[]): Promise<void> {
    const collection = await getCollection<DBSession>(COLLECTIONS.SESSIONS);
    await collection.insertMany(sessions);
  }

  static async insertLevels(levels: DBLevel[]): Promise<void> {
    const collection = await getCollection<DBLevel>(COLLECTIONS.LEVELS);
    await collection.insertMany(levels);
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
  }
}