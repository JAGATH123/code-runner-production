/**
 * Seed script for Session 10 Cheat Sheet
 * Title: Range Function
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-10-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession10CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 10,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Range Function',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Basic Range Loop',
          description: 'Use range(n) to loop a specific number of times starting from 0.',
          code_example: 'for i in range(5):\\n    print("Mission Check", i)',
          tip: 'range(n) starts from 0 by default. Use range(1, 6) to start from 1 and stop before 6.',
        },
        {
          number: 2,
          title: 'Range with Start and Stop',
          description: 'Specify both start and stop values to control where the loop begins and ends.',
          code_example: 'for level in range(2, 7):\\n    print("Scanning Deck", level)\\nprint("Scan complete!")',
          tip: 'Code after the loop (no indentation) runs once, not in every iteration.',
        },
        {
          number: 3,
          title: 'Using Step in Range',
          description: 'Add a step value to count up or down by a specific amount.',
          code_example: 'for temp in range(100, 60, -10):\\n    print("Cooling system:", temp)',
          tip: 'range(start, stop, step) — step can be positive (count up) or negative (count down).',
        },
        {
          number: 4,
          title: 'Range with Conditional Logic',
          description: 'Combine range loops with if statements to add decision-making.',
          code_example: 'for battery in range(100, 49, -10):\\n    if battery < 70:\\n        print("Warning: Low Battery!", battery)\\n    else:\\n        print("Battery OK:", battery)',
          tip: 'Combine multiple conditions using if, elif, and else for better control.',
        },
        {
          number: 5,
          title: 'Nested Loops with Range',
          description: 'Use nested range loops for multi-level iterations like grids or stages.',
          code_example: 'for stage in range(1, 4):\\n    for system in range(1, 3):\\n        print("Stage", stage, "-> System", system)',
          tip: 'Inner loops complete fully for each outer loop cycle — perfect for grids or multi-level checks.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 10...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 10 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 10 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 10 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 10 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/10/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/10/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession10CheatSheet();
