/**
 * Seed script for Session 4 Cheat Sheet
 * Title: Understanding Operators in Python
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-4-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession4CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 4,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Understanding Operators in Python',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Arithmetic Operators',
          description: 'Perform mathematical calculations like addition, subtraction, multiplication, and division.',
          code_example: 'fuel_used = 150\\nfuel_remaining = 350\\ntotal_fuel = fuel_used + fuel_remaining\\nprint("Total fuel:", total_fuel)',
          tip: 'Arithmetic operators help calculate values like fuel, distance, and speed in real missions.',
        },
        {
          number: 2,
          title: 'Assignment Operators',
          description: 'Store and update variable values efficiently during program execution.',
          code_example: 'mission_days = 5\\nmission_days += 2\\nprint("Updated mission duration:", mission_days)',
          tip: 'Use assignment shortcuts like += or -= to make your code cleaner and faster.',
        },
        {
          number: 3,
          title: 'Logical Operators',
          description: 'Make decisions by checking multiple conditions at once.',
          code_example: 'systems_ready = True\\nfuel_level = 80\\nmission_go = systems_ready and fuel_level > 50\\nprint("Mission Ready?", mission_go)',
          tip: 'Logical operators let your code "think" — combining conditions like real mission checks.',
        },
        {
          number: 4,
          title: 'Comparison Operators',
          description: 'Compare values to check relationships like greater than, less than, or equal to.',
          code_example: 'temperature = -50\\nsafe_temp = temperature > -60\\nprint("Temperature safe?", safe_temp)',
          tip: 'Comparison operators return True or False, helping you make decisions in your code.',
        },
        {
          number: 5,
          title: 'Combining All Operators',
          description: 'Integrate arithmetic, assignment, and logical operators for complete control.',
          code_example: 'days_remaining = 10\\ndays_remaining -= 1\\nfood_packs = 25\\nenough_food = food_packs >= days_remaining\\nprint("Food sufficient for mission?", enough_food)',
          tip: 'Combining all operators makes your program act like a real control system — calculating, updating, and deciding!',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 4...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 4 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 4 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 4 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 4 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/4/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/4/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession4CheatSheet();
