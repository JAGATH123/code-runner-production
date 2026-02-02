import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Load env
const envLocalPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envLocalPath });

async function checkTestCaseData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Get a sample test case that might have \n
    const testCase = await mongoose.connection.db.collection('test_cases').findOne({
      input: { $regex: '\\\\n' }  // Find test cases with literal \n
    });

    if (testCase) {
      console.log('Found test case with \\n:');
      console.log('='.repeat(80));
      console.log('Test Case ID:', testCase.test_case_id);
      console.log('Problem ID:', testCase.problem_id);
      console.log('\nInput (raw):');
      console.log(JSON.stringify(testCase.input));
      console.log('\nInput (displayed):');
      console.log(testCase.input);
      console.log('\nExpected Output (raw):');
      console.log(JSON.stringify(testCase.expected_output));
      console.log('\nExpected Output (displayed):');
      console.log(testCase.expected_output);
    } else {
      console.log('No test cases found with literal \\n');

      // Just get a sample test case
      const sample = await mongoose.connection.db.collection('test_cases').findOne();
      if (sample) {
        console.log('Sample test case:');
        console.log('='.repeat(80));
        console.log('Test Case ID:', sample.test_case_id);
        console.log('Problem ID:', sample.problem_id);
        console.log('\nInput (raw):', JSON.stringify(sample.input));
        console.log('Input (displayed):', sample.input);
        console.log('\nExpected Output (raw):', JSON.stringify(sample.expected_output));
        console.log('Expected Output (displayed):', sample.expected_output);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTestCaseData();
