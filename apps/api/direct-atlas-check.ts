import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Load env
const envLocalPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envLocalPath });

const MONGODB_URI = process.env.MONGODB_URI!;
console.log('Using MONGODB_URI:', MONGODB_URI.substring(0, 70) + '...\n');

async function directCheck() {
  try {
    // Create a completely fresh connection (not using shared package)
    const freshConnection = await mongoose.createConnection(MONGODB_URI).asPromise();
    console.log('✅ Fresh connection to:', freshConnection.db.databaseName);

    // Query directly without using any models
    const problemsCollection = freshConnection.db.collection('problems');

    const totalCount = await problemsCollection.countDocuments({ age_group: '11-14' });
    console.log(`Total problems for "11-14": ${totalCount}`);

    const level1Count = await problemsCollection.countDocuments({
      age_group: '11-14',
      level_number: 1
    });
    console.log(`Level 1 problems: ${level1Count}`);

    // Check for sessions 49-96
    const placeholderCount = await problemsCollection.countDocuments({
      age_group: '11-14',
      level_number: 1,
      session_id: { $gte: 49 }
    });
    console.log(`Problems in sessions >= 49: ${placeholderCount}`);

    // Get actual session IDs in Level 1
    const level1Problems = await problemsCollection.find({
      age_group: '11-14',
      level_number: 1
    }, { projection: { session_id: 1 } }).toArray();

    const sessionIds = [...new Set(level1Problems.map(p => p.session_id))].sort((a: any, b: any) => a - b);
    console.log(`Level 1 session IDs: ${sessionIds.join(', ')}`);

    await freshConnection.close();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('Error:', error);
  }
}

directCheck();
