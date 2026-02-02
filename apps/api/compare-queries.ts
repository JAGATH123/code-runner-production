import dotenv from 'dotenv';
import path from 'path';

// Load env like the API does
const envLocalPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envLocalPath });

import { Models, connectToDatabase } from '@code-runner/shared';
import mongoose from 'mongoose';

async function compare() {
  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    const age_group = '11-14';

    // Method 1: Using Models.Problem (the shared package's Mongoose model)
    console.log('Method 1: Using Models.Problem.find()');
    const modelProblems = await Models.Problem.find({ age_group }).lean();
    console.log(`  Found ${modelProblems.length} problems`);

    if (modelProblems.length > 0) {
      const sampleIds = modelProblems.slice(0, 5).map((p: any) => p.problem_id);
      console.log(`  Sample problem IDs: ${sampleIds.join(', ')}`);
    }

    // Method 2: Using raw MongoDB collection query
    console.log('\nMethod 2: Using raw mongoose.connection.db.collection()');
    const rawProblems = await mongoose.connection.db.collection('problems').find({ age_group }).toArray();
    console.log(`  Found ${rawProblems.length} problems`);

    if (rawProblems.length > 0) {
      const sampleIds = rawProblems.slice(0, 5).map((p: any) => p.problem_id);
      console.log(`  Sample problem IDs: ${sampleIds.join(', ')}`);
    }

    // Method 3: Count documents
    console.log('\nMethod 3: Using countDocuments()');
    const count1 = await Models.Problem.countDocuments({ age_group });
    const count2 = await mongoose.connection.db.collection('problems').countDocuments({ age_group });
    console.log(`  Models.Problem.countDocuments(): ${count1}`);
    console.log(`  collection.countDocuments(): ${count2}`);

    // Check database and collection names
    console.log('\nConnection details:');
    console.log(`  Database: ${mongoose.connection.db.databaseName}`);
    console.log(`  Model collection: ${Models.Problem.collection.name}`);
    console.log(`  Model database: ${Models.Problem.db.databaseName}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

compare();
