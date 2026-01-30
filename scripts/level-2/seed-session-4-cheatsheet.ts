/**
 * Seed script for Level 2 - Session 4 Cheat Sheet
 * Title: Advanced Dictionary Operations and Dictionary Methods
 * Level: 2 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/level-2/seed-session-4-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession4CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 15,
      age_group: '11-14' as const,
      level_number: 2,
      title: 'Advanced Dictionary Operations and Dictionary Methods',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Accessing & Updating with .get() and []',
          description: 'Use .get() to safely access values without errors; use [] when you\'re sure the key exists.',
          code_example: 'info = {"name": "Apollo", "mission": "Moon"}\\nprint(info.get("name"))            # Safe\\nprint(info.get("status", "Unknown"))  # With default',
          tip: 'Use .get() when you\'re unsure if the key exists — it prevents crashes.',
        },
        {
          number: 2,
          title: 'Looping with .items(), .keys(), .values()',
          description: 'Loop through dictionary parts depending on what you need.',
          code_example: 'spacecraft = {"Apollo": "USA", "Soyuz": "Russia"}\\nfor name, country in spacecraft.items():\\n    print(name, ":", country)',
          tip: '.items() -> key + value | .keys() -> keys only | .values() -> values only. Choose based on your output requirement.',
        },
        {
          number: 3,
          title: 'Using .update() and .setdefault()',
          description: 'Use .update() to overwrite/add; use .setdefault() to add only if missing.',
          code_example: 'mission = {"name": "Mars 2024"}\\nmission.update({"duration": "6 months"})\\nmission.setdefault("launchpad", "LC-39A")\\nprint(mission)',
          tip: 'Use .setdefault() when you want to ensure a key exists without overwriting existing data.',
        },
        {
          number: 4,
          title: 'Removing Items with .pop() and del',
          description: 'Remove items safely or directly.',
          code_example: 'data = {"signal": "strong", "battery": 85, "temp": 22}\\nremoved = data.pop("signal")   # Safe remove, returns value\\nprint("Removed:", removed)\\ndel data["battery"]  # Direct delete\\nprint(data)',
          tip: 'Use .pop() when you want to get the removed value; use del for simple deletion.',
        },
        {
          number: 5,
          title: 'Nested Dictionaries',
          description: 'Store dictionaries inside dictionaries for structured data.',
          code_example: 'rockets = {\\n    "Falcon 9": {"height": 70, "stages": 2},\\n    "Saturn V": {"height": 111, "stages": 3}\\n}\\nprint(rockets["Falcon 9"]["height"])',
          tip: 'Use nested dictionaries to model complex objects, like rockets, missions, or rover data.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Level 2 - Session 4...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 15 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 15 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 15 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 15 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/15/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/15/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession4CheatSheet();
