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

async function checkAllLevels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const ageGroup = '11-14';

    // Get all problems for this age group
    const allProblems = await Problem.find({ age_group: ageGroup }).lean();
    console.log(`Total problems for age group "${ageGroup}": ${allProblems.length}\n`);

    // Check each level
    for (let levelNum = 1; levelNum <= 4; levelNum++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`LEVEL ${levelNum} ANALYSIS`);
      console.log('='.repeat(60));

      const levelProblems = allProblems.filter((p: any) => p.level_number === levelNum);

      // Group by session_id
      const sessionDistribution = new Map<number, number>();
      levelProblems.forEach((p: any) => {
        const count = sessionDistribution.get(p.session_id) || 0;
        sessionDistribution.set(p.session_id, count + 1);
      });

      console.log(`Total problems: ${levelProblems.length}`);
      console.log(`Unique sessions: ${sessionDistribution.size}`);

      // Get session ID range
      const sessionIds = Array.from(sessionDistribution.keys()).sort((a, b) => a - b);
      if (sessionIds.length > 0) {
        console.log(`Session ID range: ${sessionIds[0]} - ${sessionIds[sessionIds.length - 1]}`);
        console.log(`Session IDs: ${sessionIds.join(', ')}`);
      }

      console.log('\nProblems per session:');
      const sortedSessions = Array.from(sessionDistribution.entries()).sort((a, b) => a[0] - b[0]);
      sortedSessions.forEach(([sessionId, count]) => {
        console.log(`  Session ${sessionId}: ${count} problems`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n\n✅ Disconnected from MongoDB');
  }
}

checkAllLevels();
