import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Load env like the API does
const envLocalPath = path.resolve(__dirname, '.env.local');
console.log('Loading .env.local from:', envLocalPath);
const result = dotenv.config({ path: envLocalPath });
if (result.error) {
  console.log('⚠️  Failed to load .env.local:', result.error.message);
  process.exit(1);
} else {
  console.log('✅ Loaded .env.local');
}

async function checkDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI!;
    console.log('\nMONGODB_URI:', MONGODB_URI);

    // Parse the URI to get the database name
    const url = new URL(MONGODB_URI);
    const dbName = url.pathname.substring(1).split('?')[0];
    console.log('Database name from URI:', dbName);

    // Connect
    await mongoose.connect(MONGODB_URI);
    console.log('\n✅ Connected to MongoDB');

    // Get the actual database name being used
    const connection = mongoose.connection;
    console.log('Actual database name:', connection.db.databaseName);

    // List all collections
    const collections = await connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach((coll: any) => {
      console.log(`  - ${coll.name}`);
    });

    // Count problems
    const problemsCount = await connection.db.collection('problems').countDocuments({ age_group: '11-14' });
    console.log(`\nTotal problems for age group "11-14": ${problemsCount}`);

    const level1Count = await connection.db.collection('problems').countDocuments({
      age_group: '11-14',
      level_number: 1
    });
    console.log(`Level 1 problems: ${level1Count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

checkDatabase();
