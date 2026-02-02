import axios from 'axios';

async function testUnescape() {
  try {
    // Problem 1000 has \n in test cases (we checked earlier)
    const response = await axios.get('http://localhost:4000/problems/1000/test-cases');

    if (response.data.length > 0) {
      const testCase = response.data[0];

      console.log('Test Case for Problem 1000:');
      console.log('='.repeat(80));
      console.log('\nInput (should have actual newlines, not \\n):');
      console.log(testCase.input);
      console.log('\nExpected Output (should have actual newlines, not \\n):');
      console.log(testCase.expected_output);
      console.log('\n' + '='.repeat(80));

      // Check if it has actual newlines
      const hasActualNewlines = testCase.input.includes('\n') && !testCase.input.includes('\\n');
      console.log('\n✅ Test Result:', hasActualNewlines ? 'PASS - Has actual newlines' : 'FAIL - Still has literal \\n');
    } else {
      console.log('No test cases found for problem 1000');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testUnescape();
