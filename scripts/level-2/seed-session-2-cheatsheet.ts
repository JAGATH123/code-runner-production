/**
 * Seed script for Level 2 - Session 2 Cheat Sheet
 * Title: Basic While Loop
 * Level: 2 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/level-2/seed-session-2-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession2CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 13,
      age_group: '11-14' as const,
      level_number: 2,
      title: 'Basic While Loop',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Basic While Loop',
          description: 'Run a block of code as long as the condition is true.',
          code_example: 'count = 1\\nwhile count <= 5:\\n    print("Counting:", count)\\n    count += 1',
          tip: 'Always update the variable inside the loop to avoid infinite loops.',
        },
        {
          number: 2,
          title: 'While Loop with Input',
          description: 'Keep asking for input until a condition is satisfied.',
          code_example: 'password = ""\\nwhile password != "sky123":\\n    password = input("Enter the secret password: ")\\nprint("Access granted!")',
          tip: 'Use while loops for repeated input checks until the user enters the correct value.',
        },
        {
          number: 3,
          title: 'Using Break in a While Loop',
          description: 'Use break to exit an infinite loop based on a specific input.',
          code_example: 'while True:\\n    number = int(input("Enter a number (0 to stop): "))\\n    if number == 0:\\n        break\\n    print("You entered:", number)',
          tip: 'while True: creates a loop that never ends unless break is triggered.',
        },
        {
          number: 4,
          title: 'While Loop with Counters and Conditions',
          description: 'Limit user attempts using a counter variable.',
          code_example: 'attempts = 0\\nwhile attempts < 3:\\n    code = input("Enter the launch code: ")\\n    if code == "Apollo":\\n        print("Launch code accepted!")\\n        break\\n    else:\\n        print("Wrong code. Try again.")\\n        attempts += 1',
          tip: 'Use counters (attempts += 1) to restrict the number of retries for security or logic control.',
        },
        {
          number: 5,
          title: 'While Loop with Else Block',
          description: 'else runs only if the while loop ends naturally (not by break).',
          code_example: 'fuel = 5\\nwhile fuel > 0:\\n    print("Fuel remaining:", fuel)\\n    fuel -= 1\\nelse:\\n    print("Out of fuel! Prepare for landing.")',
          tip: 'The else block works like a "mission complete" message when the loop finishes normally.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Level 2 - Session 2...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 13 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 13 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 13 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 13 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/13/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/13/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession2CheatSheet();
