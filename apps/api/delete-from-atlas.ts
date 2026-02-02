import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Load env
const envLocalPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envLocalPath });

// Get MongoDB URI and verify it's Atlas (not localhost)
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI || MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1')) {
  console.error('❌ ERROR: MONGODB_URI is not set or points to localhost!');
  console.error('   This script must connect to MongoDB Atlas.');
  process.exit(1);
}

console.log('✅ MONGODB_URI loaded:', MONGODB_URI.substring(0, 70) + '...');

// Connect directly with the URI (bypass shared package)
async function deleteFromAtlas() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('Database:', mongoose.connection.db.databaseName);

    const age_group = '11-14';

    // Count BEFORE deletion
    const beforeCount = await mongoose.connection.db.collection('problems').countDocuments({
      age_group,
      level_number: 1
    });
    console.log(`\nBEFORE: Level 1 has ${beforeCount} problems`);

    const placeholderCount = await mongoose.connection.db.collection('problems').countDocuments({
      age_group,
      level_number: 1,
      session_id: { $gte: 49, $lte: 96 }
    });
    console.log(`Placeholder problems (sessions 49-96): ${placeholderCount}`);

    if (placeholderCount === 0) {
      console.log('\n✅ No placeholder problems found. Data is already correct!');
    } else {
      // Delete placeholder problems
      const result = await mongoose.connection.db.collection('problems').deleteMany({
        age_group,
        level_number: 1,
        session_id: { $gte: 49, $lte: 96 }
      });

      console.log(`\n✅ Deleted ${result.deletedCount} placeholder problems`);

      // Count AFTER deletion
      const afterCount = await mongoose.connection.db.collection('problems').countDocuments({
        age_group,
        level_number: 1
      });
      console.log(`AFTER: Level 1 has ${afterCount} problems`);
    }

    // Verify all levels
    console.log('\n' + '='.repeat(60));
    console.log('FINAL VERIFICATION:');
    console.log('='.repeat(60));

    for (let levelNum = 1; levelNum <= 4; levelNum++) {
      const count = await mongoose.connection.db.collection('problems').countDocuments({
        age_group,
        level_number: levelNum
      });
      console.log(`Level ${levelNum}: ${count} problems`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

deleteFromAtlas();
