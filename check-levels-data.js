// Quick script to check if 11-14 age group data exists in MongoDB
require('dotenv').config({ path: './apps/api/.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');
console.log('URI:', MONGODB_URI?.substring(0, 50) + '...');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    // Get the Problem collection
    const Problem = mongoose.connection.collection('problems');

    // Check total count
    const totalCount = await Problem.countDocuments();
    console.log(`Total problems in database: ${totalCount}`);

    // Check 11-14 count
    const count11_14 = await Problem.countDocuments({ age_group: '11-14' });
    console.log(`Problems for age_group "11-14": ${count11_14}`);

    // Check 15-18 count
    const count15_18 = await Problem.countDocuments({ age_group: '15-18' });
    console.log(`Problems for age_group "15-18": ${count15_18}\n`);

    // Get unique age groups
    const ageGroups = await Problem.distinct('age_group');
    console.log('Unique age_group values in database:', ageGroups);

    // Sample a few problems to check structure
    console.log('\nSample problem from 11-14:');
    const sample = await Problem.findOne({ age_group: '11-14' });
    if (sample) {
      console.log({
        problem_id: sample.problem_id,
        title: sample.title,
        age_group: sample.age_group,
        level_number: sample.level_number,
        session_id: sample.session_id,
      });
    } else {
      console.log('❌ No problems found for 11-14!');

      // Check what age groups exist
      console.log('\nChecking all problems...');
      const allProblems = await Problem.find({}).limit(5).toArray();
      console.log('First 5 problems:', allProblems.map(p => ({
        problem_id: p.problem_id,
        age_group: p.age_group,
        level_number: p.level_number,
      })));
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
