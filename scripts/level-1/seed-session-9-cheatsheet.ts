/**
 * Seed script for Session 9 Cheat Sheet
 * Title: Loops in Python (For Loop)
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-9-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession9CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 9,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Loops in Python (For Loop)',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Basic For Loop',
          description: 'Iterate through each item in a list directly using the for loop.',
          code_example: 'fruits = ["apple", "banana", "cherry"]\\nfor item in fruits:\\n    print(item)',
          tip: 'Use for variable in list: to access each item directly — no need for index.',
        },
        {
          number: 2,
          title: 'For Loop with range()',
          description: 'Use range() to generate a sequence of numbers to loop through.',
          code_example: 'for i in range(1, 6):\\n    print(i)',
          tip: 'range(a, b) starts at a and goes up to b-1, not including b.',
        },
        {
          number: 3,
          title: 'For Loop with Conditional Logic',
          description: 'Combine for loops with if-else statements to make decisions during iteration.',
          code_example: 'for n in range(1, 6):\\n    if n % 2 == 0:\\n        print(n, "is even")\\n    else:\\n        print(n, "is odd")',
          tip: 'Use % (modulo) to check divisibility or compare values inside loops.',
        },
        {
          number: 4,
          title: 'Nested For Loop',
          description: 'Place one for loop inside another to iterate through multiple sequences.',
          code_example: 'for x in [1, 2]:\\n    for y in [1, 2, 3]:\\n        print(x, y)',
          tip: 'The inner loop runs completely for each iteration of the outer loop.',
        },
        {
          number: 5,
          title: 'For Loop with Strings',
          description: 'Loop through each character in a string just like looping through a list.',
          code_example: 'for ch in "Mars":\\n    print(ch)',
          tip: 'Strings are sequences — loops can process each character like a list.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 9...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 9 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 9 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 9 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 9 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/9/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/9/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession9CheatSheet();
