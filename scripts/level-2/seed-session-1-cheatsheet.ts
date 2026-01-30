/**
 * Seed script for Level 2 - Session 1 Cheat Sheet
 * Title: Nested Loops
 * Level: 2 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/level-2/seed-session-1-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession1CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 12,
      age_group: '11-14' as const,
      level_number: 2,
      title: 'Nested Loops',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Simple Nested Loop',
          description: 'Outer loop runs missions; inner loop runs checkpoints for each mission.',
          code_example: 'for mission in range(1, 3):\\n    for checkpoint in range(1, 4):\\n        print("Mission", mission, "-> Checkpoint", checkpoint)',
          tip: 'Inner loop completes fully before the outer loop moves to the next item — perfect for mission-step tracking.',
        },
        {
          number: 2,
          title: 'Nested Loop with Conditional Logic',
          description: 'Add logic inside loops to trigger messages at specific points.',
          code_example: 'for orbit in range(1, 3):\\n    for sensor in range(1, 4):\\n        if sensor == 2:\\n            print("Sensor aligned for data capture")',
          tip: 'Use if inside nested loops to handle specific inner-level conditions or events.',
        },
        {
          number: 3,
          title: 'Nested Loops with Variable Steps',
          description: 'Combine nested loops with step control to create dynamic tests.',
          code_example: 'for engine in range(1, 3):\\n    for thrust in range(10, 0, -5):\\n        if thrust == 5:\\n            print("Warning: Thrust imbalance detected!")',
          tip: 'Modify the range(start, stop, step) to test systems with increasing or decreasing values.',
        },
        {
          number: 4,
          title: 'Multiple Layers of Nesting',
          description: 'Use three loops to represent multi-level systems (station → module → sensor).',
          code_example: 'for station in range(1, 3):\\n    for module in range(1, 3):\\n        for sensor in range(1, 3):\\n            if sensor == 2:\\n                print("Sensor check complete")',
          tip: 'Each additional loop adds one more system level — great for hierarchy-based operations.',
        },
        {
          number: 5,
          title: 'Nested Loops with Conditional Logic & Variable Bounds',
          description: 'Deeply nested loops with variable ranges and multiple conditions.',
          code_example: 'for satellite in range(1, 3):\\n    for channel in range(1, 4):\\n        for signal_strength in range(100, 69, -10):\\n            if signal_strength <= 80:\\n                print("WARNING: Weak Signal Detected!")\\n            elif signal_strength <= 60:\\n                print("CRITICAL: Maintain Alignment!")',
          tip: 'Combine nested loops with elif chains to handle multiple threshold-based alerts.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Level 2 - Session 1...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 12 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 12 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 12 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 12 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/12/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/12/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession1CheatSheet();
