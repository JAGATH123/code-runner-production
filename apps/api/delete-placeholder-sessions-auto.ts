import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - use the API's .env.local
const envLocalPath = path.resolve(__dirname, '.env.local');
console.log('Loading .env.local from:', envLocalPath);
const result = dotenv.config({ path: envLocalPath });
if (result.error) {
  console.log('⚠️  Failed to load .env.local:', result.error.message);
  process.exit(1);
} else {
  console.log('✅ Loaded .env.local');
  console.log('MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 60) + '...\n');
}

// Simple Problem schema for querying
const problemSchema = new mongoose.Schema({}, { strict: false, collection: 'problems' });
const Problem = mongoose.model('Problem', problemSchema);

async function deletePlaceholderSessions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const ageGroup = '11-14';

    // Find all placeholder problems (sessions 49-96 in Level 1)
    const placeholderProblems = await Problem.find({
      age_group: ageGroup,
      level_number: 1,
      session_id: { $gte: 49, $lte: 96 },
    }).lean();

    console.log(`Found ${placeholderProblems.length} placeholder problems to delete`);
    console.log(`Session IDs: 49-96 (all in Level 1, age group ${ageGroup})\n`);

    // Show sample of what will be deleted
    console.log('Sample of problems that will be deleted:');
    console.log('='.repeat(80));
    placeholderProblems.slice(0, 5).forEach((p: any) => {
      console.log(`  - Problem ${p.problem_id}: ${p.title} (Session ${p.session_id})`);
    });
    console.log('  ... and', placeholderProblems.length - 5, 'more problems\n');

    // Show what Level 1 will look like after deletion
    const level1RemainingProblems = await Problem.find({
      age_group: ageGroup,
      level_number: 1,
      session_id: { $lt: 49 },
    }).lean();

    console.log('After deletion, Level 1 will have:');
    console.log(`  - ${level1RemainingProblems.length} problems`);

    const sessionIds = new Set(level1RemainingProblems.map((p: any) => p.session_id));
    const sortedSessionIds = Array.from(sessionIds).sort((a, b) => a - b);
    console.log(`  - Sessions: ${sortedSessionIds.join(', ')}\n`);

    // Proceed with deletion
    const result = await Problem.deleteMany({
      age_group: ageGroup,
      level_number: 1,
      session_id: { $gte: 49, $lte: 96 },
    });

    console.log(`\n✅ Deleted ${result.deletedCount} placeholder problems`);
    console.log('Level 1 now has the correct number of problems!');

    // Verify final state
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION - Final Level Distribution:');
    console.log('='.repeat(80));

    for (let levelNum = 1; levelNum <= 4; levelNum++) {
      const levelProblems = await Problem.find({
        age_group: ageGroup,
        level_number: levelNum,
      }).lean();

      const uniqueSessions = new Set(levelProblems.map((p: any) => p.session_id));
      console.log(`Level ${levelNum}: ${levelProblems.length} problems, ${uniqueSessions.size} sessions`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

deletePlaceholderSessions();
