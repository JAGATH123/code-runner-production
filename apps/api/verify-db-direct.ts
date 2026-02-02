// This script uses the EXACT same imports and connection as the API
import dotenv from 'dotenv';
import path from 'path';

// Load env EXACTLY like the API does
const envLocalPath = path.resolve(__dirname, '../.env.local');
console.log('Loading .env.local from:', envLocalPath);
const result = dotenv.config({ path: envLocalPath });
if (result.error) {
  console.log('⚠️  Failed to load .env.local:', result.error.message);
} else {
  console.log('✅ Loaded .env.local');
}
dotenv.config();

// Import the Models from shared package, just like the API does
import { Models, connectToDatabase } from '@code-runner/shared';

async function verify() {
  try {
    console.log('\n📡 MongoDB URI:', process.env.MONGODB_URI?.substring(0, 50) + '...\n');

    // Connect using the shared connection function
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Query using Models.Problem, exactly like the API does
    const allProblems = await Models.Problem.find({ age_group: '11-14' }).lean();
    console.log(`Total problems for age group "11-14": ${allProblems.length}`);

    // Group by level
    const levelDistribution = new Map<number, number>();
    allProblems.forEach((problem: any) => {
      const count = levelDistribution.get(problem.level_number) || 0;
      levelDistribution.set(problem.level_number, count + 1);
    });

    console.log('\nProblem distribution by level_number:');
    const sortedLevels = Array.from(levelDistribution.entries()).sort((a, b) => a[0] - b[0]);
    sortedLevels.forEach(([levelNum, count]) => {
      console.log(`  Level ${levelNum}: ${count} problems`);
    });

    // Check Level 1 sessions
    const level1Problems = allProblems.filter((p: any) => p.level_number === 1);
    const sessionIds = new Set(level1Problems.map((p: any) => p.session_id));
    const sortedSessionIds = Array.from(sessionIds).sort((a, b) => a - b);
    console.log(`\nLevel 1 sessions: ${sortedSessionIds.join(', ')}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

verify();
