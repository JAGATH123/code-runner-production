import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envLocalPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

// Simple Problem schema for querying
const problemSchema = new mongoose.Schema({}, { strict: false, collection: 'problems' });
const Problem = mongoose.model('Problem', problemSchema);

async function checkSession49() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Get a sample from session 49
    const session49Problems = await Problem.find({
      age_group: '11-14',
      session_id: 49,
    }).limit(5).lean();

    console.log('Sample problems from Session 49:');
    console.log('='.repeat(80));
    session49Problems.forEach((p: any) => {
      console.log(`\nProblem ID: ${p.problem_id}`);
      console.log(`Title: ${p.title}`);
      console.log(`Level Number: ${p.level_number}`);
      console.log(`Session ID: ${p.session_id}`);
      console.log(`Age Group: ${p.age_group}`);
      console.log(`Session Title: ${p.session_title || 'N/A'}`);
      console.log(`Description: ${p.description?.substring(0, 100)}...`);
    });

    // Also check a sample from session 1 for comparison
    console.log('\n\n' + '='.repeat(80));
    console.log('For comparison, Session 1:');
    console.log('='.repeat(80));

    const session1Problems = await Problem.find({
      age_group: '11-14',
      session_id: 1,
    }).limit(3).lean();

    session1Problems.forEach((p: any) => {
      console.log(`\nProblem ID: ${p.problem_id}`);
      console.log(`Title: ${p.title}`);
      console.log(`Level Number: ${p.level_number}`);
      console.log(`Session ID: ${p.session_id}`);
      console.log(`Session Title: ${p.session_title || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n\n✅ Disconnected from MongoDB');
  }
}

checkSession49();
