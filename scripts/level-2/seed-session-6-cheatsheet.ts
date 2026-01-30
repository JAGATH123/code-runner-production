/**
 * Seed script for Level 2 - Session 6 Cheat Sheet
 * Title: Set Operations & Data Analysis
 * Level: 2 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/level-2/seed-session-6-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession6CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 17,
      age_group: '11-14' as const,
      level_number: 2,
      title: 'Set Operations & Data Analysis',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Creating Sets & Adding Items',
          description: 'Make a set and use .add() to insert new unique items.',
          code_example: 'satellites = {"Hubble", "Voyager"}\\nsatellites.add("Galileo")\\nsatellites.add("Cassini")\\nprint(satellites)',
          tip: 'Sets automatically remove duplicates — each item appears only once.',
        },
        {
          number: 2,
          title: 'Removing Items',
          description: 'Use .remove() for deletion and .discard() when you want to avoid errors.',
          code_example: 'missions = {"Apollo", "Gemini", "Artemis"}\\nmissions.remove("Gemini")\\nmissions.discard("Artemis")\\nprint(missions)',
          tip: '.remove() raises an error if item is missing; .discard() does not.',
        },
        {
          number: 3,
          title: 'Union & Intersection',
          description: 'Use .union() to combine sets and .intersection() to find common names.',
          code_example: 'team1 = {"Alex", "Mira"}\\nteam2 = {"Mira", "John"}\\nprint(team1.union(team2))\\nprint(team1.intersection(team2))',
          tip: '.union() merges all unique items; .intersection() returns only shared items.',
        },
        {
          number: 4,
          title: 'Difference & Symmetric Difference',
          description: 'Use .difference() for items only in the first set, .symmetric_difference() for items not shared.',
          code_example: 'planetsA = {"Earth", "Mars", "Jupiter"}\\nplanetsB = {"Mars", "Saturn"}\\nprint(planetsA.difference(planetsB))\\nprint(planetsA.symmetric_difference(planetsB))',
          tip: '.difference() = A minus B; .symmetric_difference() = items in A or B but not both.',
        },
        {
          number: 5,
          title: 'Membership & Looping',
          description: 'Check availability with in, then loop to print each element in the set.',
          code_example: 'resources = {"Water", "Oxygen", "Food"}\\nprint("Fuel" in resources)\\nfor item in resources:\\n    print(item)',
          tip: 'Use "in" to check if an item exists before processing.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Level 2 - Session 6...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 17 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 17 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 17 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 17 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/17/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/17/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession6CheatSheet();
