/**
 * Seed script for Session 3 Cheat Sheet
 * Title: Input Function and Type Conversions
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-3-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession3CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 3,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Python Input & Type Conversion',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Getting User Input',
          description: 'Use input() to collect information from the user.',
          code_example: 'name = input("Enter your name: ")\\nprint("Hello,", name)',
          tip: 'Everything you type through input() is stored as text (a string).',
        },
        {
          number: 2,
          title: 'Converting to Numbers',
          description: 'Convert user input to integers using int() when you need to do math.',
          code_example: 'age = int(input("Enter your age: "))\\nprint("Next year, you will be", age + 1)',
          tip: 'int() changes text into a whole number.',
        },
        {
          number: 3,
          title: 'Working with Decimals',
          description: 'Use float() to handle decimal numbers like distance or fuel levels.',
          code_example: 'distance = float(input("Enter distance in km: "))\\nprint("Distance in meters is", distance * 1000)',
          tip: 'float() allows calculations with decimals for more accuracy.',
        },
        {
          number: 4,
          title: 'Combining Input and Conversion',
          description: 'You can collect and convert in a single step to simplify your code.',
          code_example: 'days = int(input("Enter number of mission days: "))\\ntotal_hours = days * 24\\nprint("Mission Duration:", total_hours, "hours")',
          tip: 'Placing int() directly around input() saves an extra line.',
        },
        {
          number: 5,
          title: 'Multiple Inputs for Calculations',
          description: 'Gather more than one input and use them together in a formula.',
          code_example: 'astronauts = int(input("Enter number of astronauts: "))\\nmeals_per_day = int(input("Enter meals per day: "))\\nprint("Total meals for 7 days:", astronauts * meals_per_day * 7)',
          tip: 'Combine several converted inputs for multi-step calculations.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 3...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 3 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 3 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 3 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 3 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/3/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/3/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession3CheatSheet();
