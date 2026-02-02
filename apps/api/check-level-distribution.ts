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

async function checkLevelDistribution() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const ageGroup = '11-14';

    // Get all problems for this age group
    const allProblems = await Problem.find({ age_group: ageGroup }).lean();
    console.log(`Total problems for age group "${ageGroup}": ${allProblems.length}\n`);

    // Group by level_number
    const levelDistribution = new Map<number, number>();
    const problemsWithoutLevel: any[] = [];

    allProblems.forEach((problem: any) => {
      if (problem.level_number === null || problem.level_number === undefined) {
        problemsWithoutLevel.push({
          problem_id: problem.problem_id,
          title: problem.title,
          session_id: problem.session_id,
        });
      } else {
        const count = levelDistribution.get(problem.level_number) || 0;
        levelDistribution.set(problem.level_number, count + 1);
      }
    });

    // Display distribution
    console.log('Problem distribution by level_number:');
    console.log('=====================================');
    const sortedLevels = Array.from(levelDistribution.entries()).sort((a, b) => a[0] - b[0]);
    sortedLevels.forEach(([levelNum, count]) => {
      console.log(`Level ${levelNum}: ${count} problems`);
    });

    if (problemsWithoutLevel.length > 0) {
      console.log(`\n⚠️  Problems without level_number: ${problemsWithoutLevel.length}`);
      console.log('First 5 examples:');
      problemsWithoutLevel.slice(0, 5).forEach((p) => {
        console.log(`  - Problem ${p.problem_id}: ${p.title} (session_id: ${p.session_id})`);
      });
    }

    // Check Level 1 problems in detail
    console.log('\n\nLevel 1 Detailed Analysis:');
    console.log('==========================');
    const level1Problems = allProblems.filter((p: any) => p.level_number === 1);

    // Group by session_id
    const sessionDistribution = new Map<number, number>();
    level1Problems.forEach((p: any) => {
      const count = sessionDistribution.get(p.session_id) || 0;
      sessionDistribution.set(p.session_id, count + 1);
    });

    console.log(`Total Level 1 problems: ${level1Problems.length}`);
    console.log(`Unique sessions: ${sessionDistribution.size}`);
    console.log('\nProblems per session:');
    const sortedSessions = Array.from(sessionDistribution.entries()).sort((a, b) => a[0] - b[0]);
    sortedSessions.forEach(([sessionId, count]) => {
      console.log(`  Session ${sessionId}: ${count} problems`);
    });

    // Check if any problems have unexpected level_number values
    console.log('\n\nAll unique level_number values found:');
    const uniqueLevels = Array.from(levelDistribution.keys()).sort((a, b) => a - b);
    console.log(uniqueLevels);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkLevelDistribution();
