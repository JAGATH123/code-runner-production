/**
 * Seed script for Session 2 Cheat Sheet
 * Title: Understanding Variables, Data Types
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-2-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession2CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 2,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Python Variables & Data Types',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Creating Variables',
          description: 'Use = to store values in variables.',
          code_example: 'planet_name = "Mars"\\ntemperature = -63',
          tip: 'Variables are like containers that store data for later use.',
        },
        {
          number: 2,
          title: 'Data Types in Action',
          description: 'Python decides the type automatically.',
          code_example: 'mission_days = 30 # int\\noxygen_level = 98.6 # float\\nrover_name = "Explorer-1" # string\\nmission_active = True # boolean',
          tip: 'Use integers for whole numbers, floats for decimals, and booleans for True/False.',
        },
        {
          number: 3,
          title: 'Checking Data Types',
          description: 'Use type() to see what kind of data a variable holds.',
          code_example: 'gravity = 9.8\\nprint(type(gravity))',
          tip: 'Helps you debug and understand your variables better.',
        },
        {
          number: 4,
          title: 'Changing Values & Types',
          description: 'Variables can change as your code runs.',
          code_example: 'sample = "rock"\\nprint(sample)\\nsample = 42\\nprint(sample)',
          tip: 'Python allows you to reuse variable names with new values, but track changes carefully.',
        },
        {
          number: 5,
          title: 'Getting Input from Users',
          description: 'Let users enter values using input().',
          code_example: 'astronaut_name = input("Enter your name: ")\\nprint("Welcome, Commander", astronaut_name)',
          tip: 'input() always returns text—use int() or float() to convert when needed.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 2...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 2 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 2 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 2 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 2 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/2/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/2/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession2CheatSheet();
