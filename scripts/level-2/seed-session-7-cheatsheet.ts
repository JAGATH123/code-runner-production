/**
 * Seed script for Level 2 - Session 7 Cheat Sheet
 * Title: User-Defined Functions
 * Level: 2 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/level-2/seed-session-7-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession7CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 18,
      age_group: '11-14' as const,
      level_number: 2,
      title: 'User-Defined Functions',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Creating & Calling a Simple Function',
          description: 'Define a function without parameters and call it.',
          code_example: 'def welcome():\\n    print("Welcome to the Space Station!")\\n\\nwelcome()',
          tip: 'Use def to create a function, then call it by name with parentheses.',
        },
        {
          number: 2,
          title: 'Function With One Parameter',
          description: 'Send a value into the function and use it inside the print.',
          code_example: 'def introduce(person):\\n    print("Nice to meet you,", person)\\n\\nintroduce("Alex")',
          tip: 'Parameters let you pass different values each time you call the function.',
        },
        {
          number: 3,
          title: 'Returning a Value',
          description: 'Use return to send back the calculated answer.',
          code_example: 'def multiply(a, b):\\n    return a * b\\n\\nresult = multiply(3, 4)\\nprint(result)',
          tip: 'return sends a value back to where the function was called.',
        },
        {
          number: 4,
          title: 'Function With Multiple Parameters',
          description: 'Give two inputs and combine them in a sentence.',
          code_example: 'def favorite_fruit(fruit, color):\\n    print("My favorite fruit is a", color, fruit)\\n\\nfavorite_fruit("apple", "red")',
          tip: 'Separate multiple parameters with commas in both definition and call.',
        },
        {
          number: 5,
          title: 'Function Without Return',
          description: 'Use a function that only prints something and doesn\'t return anything.',
          code_example: 'def inspire():\\n    print("Never give up, astronaut!")\\n\\ninspire()',
          tip: 'Functions without return are useful for displaying messages or performing actions.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Level 2 - Session 7...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 18 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 18 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 18 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 18 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/18/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/18/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession7CheatSheet();
