// This script mimics EXACTLY what the API route does
import dotenv from 'dotenv';
import path from 'path';

// Load env EXACTLY like the API does
const envLocalPath = path.resolve(__dirname, '.env.local');
console.log('Loading .env.local from:', envLocalPath);
const result = dotenv.config({ path: envLocalPath });
if (result.error) {
  console.log('⚠️  Failed to load .env.local:', result.error.message);
  process.exit(1);
} else {
  console.log('✅ Loaded .env.local');
}
dotenv.config();

console.log('MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 70) + '...\n');

// Import Models EXACTLY like the API does
import { Models, connectToDatabase } from '@code-runner/shared';

async function testQuery() {
  try {
    // Connect using the shared connection function
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    const age_group = '11-14';

    // EXACT same query as the API route (levels.routes.ts line 27)
    const allProblems = await Models.Problem.find({ age_group }).lean();
    console.log(`[DEBUG] Found ${allProblems.length} total problems for age group ${age_group}`);

    // Group by level_number manually (EXACT same logic as API)
    const levelMap = new Map();
    allProblems.forEach((problem: any) => {
      if (!levelMap.has(problem.level_number)) {
        levelMap.set(problem.level_number, {
          _id: problem.level_number,
          level_number: problem.level_number,
          age_group: problem.age_group,
          problems: [],
        });
      }
      levelMap.get(problem.level_number).problems.push(problem);
    });

    const levels = Array.from(levelMap.values()).sort((a, b) => a.level_number - b.level_number);

    // Show Level 1 details
    const level1 = levels.find(l => l.level_number === 1);
    if (level1) {
      console.log(`[DEBUG] Level 1 aggregation returned ${level1.problems.length} problems`);
      const uniqueSessions = [...new Set(level1.problems.map((p: any) => p.session_id))] as number[];
      console.log(`[DEBUG] Unique session IDs in problems:`, uniqueSessions.sort((a, b) => a - b));
    }

    // Show all levels distribution
    console.log('\nLevel distribution:');
    levels.forEach(level => {
      console.log(`  Level ${level.level_number}: ${level.problems.length} problems`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testQuery();
