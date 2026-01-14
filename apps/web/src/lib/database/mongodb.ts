import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB connection string - you'll need to replace this with your MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-runner';
const MONGODB_DB = process.env.MONGODB_DB || 'code-runner';

// Debug logging to verify which database we're connecting to
console.log('🔍 [MongoDB Config] MONGODB_URI:', MONGODB_URI?.substring(0, 30) + '...');
console.log('🔍 [MongoDB Config] MONGODB_DB:', MONGODB_DB);

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

let cachedConnection: MongoConnection | null = null;

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      // Connection pool settings for high performance
      maxPoolSize: 20,          // Max 20 connections
      minPoolSize: 5,           // Keep 5 connections always
      maxIdleTimeMS: 30000,     // Close connections after 30s idle
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,

      // Reliability settings
      retryWrites: true,
      retryReads: true,
    });

    await client.connect();

    const db = client.db(MONGODB_DB);

    // Create indexes for better performance
    await createIndexes(db);

    cachedConnection = {
      client,
      db,
    };

    console.log('Connected to MongoDB with optimized settings');
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function createIndexes(db: Db): Promise<void> {
  try {
    console.log('Creating database indexes...');

    // Index for problems collection
    await db.collection('problems').createIndexes([
      { key: { problem_id: 1 }, unique: true },
      { key: { session_id: 1 } },
      { key: { age_group: 1, level_number: 1 } },
      { key: { age_group: 1, level_number: 1, session_id: 1 } }
    ]);

    // Index for test cases
    await db.collection('test_cases').createIndexes([
      { key: { problem_id: 1 } },
      { key: { problem_id: 1, is_hidden: 1 } }
    ]);

    // Index for sessions
    await db.collection('sessions').createIndexes([
      { key: { session_id: 1 }, unique: true },
      { key: { level_id: 1 } }
    ]);

    // Index for levels
    await db.collection('levels').createIndexes([
      { key: { level_id: 1 }, unique: true },
      { key: { age_group: 1 } },
      { key: { age_group: 1, level_number: 1 } }
    ]);

    // Index for user progress
    await db.collection('user_progress').createIndexes([
      { key: { user_id: 1, age_group: 1 }, unique: true },
      { key: { user_id: 1 } }
    ]);

    console.log('Database indexes created successfully');
  } catch (error) {
    // Indexes might already exist, which is fine
    console.log('Database indexes already exist or creation skipped');
  }
}

export async function getCollection<T = any>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

// Collection names
export const COLLECTIONS = {
  PROBLEMS: 'problems',
  SESSIONS: 'sessions', 
  LEVELS: 'levels',
  USER_PROGRESS: 'user_progress',
  TEST_CASES: 'test_cases'
};