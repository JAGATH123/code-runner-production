/**
 * Seed script for Level 2 - Session 3 Cheat Sheet
 * Title: Python Dictionaries
 * Level: 2 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/level-2/seed-session-3-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession3CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 14,
      age_group: '11-14' as const,
      level_number: 2,
      title: 'Python Dictionaries',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Creating and Accessing a Dictionary',
          description: 'Use {} to store data in key-value pairs and access values using dictionary[key].',
          code_example: 'astronauts = {"Alice": "Commander", "Bob": "Pilot", "Eve": "Engineer"}\\nprint(astronauts["Alice"])',
          tip: 'Accessing a non-existing key causes an error — always check or use .get().',
        },
        {
          number: 2,
          title: 'Adding and Updating Entries',
          description: 'Assigning a value to a key adds or updates an entry.',
          code_example: 'astronauts = {"Alice": "Commander", "Eve": "Engineer"}\\nastronauts["Diana"] = "Navigator"   # Add\\nastronauts["Eve"] = "Chief Engineer"   # Update\\nprint(astronauts)',
          tip: 'Reassigning an existing key overwrites the old value automatically.',
        },
        {
          number: 3,
          title: 'Removing Entries',
          description: 'pop(key) removes a specific item; popitem() removes the latest added one.',
          code_example: 'astronauts = {"Alice": "Commander", "Bob": "Pilot", "Eve": "Engineer"}\\nremoved = astronauts.pop("Bob")\\nprint("Removed:", removed)\\nastronauts.popitem()\\nprint(astronauts)',
          tip: 'pop() returns the removed value — useful for logs or confirmations.',
        },
        {
          number: 4,
          title: 'Iterating Over Dictionaries',
          description: 'Use .items(), .keys(), and .values() to loop through a dictionary.',
          code_example: 'astronauts = {"Alice": "Commander", "Bob": "Pilot"}\\nfor name, role in astronauts.items():\\n    print(name, ":", role)',
          tip: 'Choose based on what you need — keys only, values only, or both.',
        },
        {
          number: 5,
          title: 'Checking Keys and Using get()',
          description: 'Use in to verify keys and .get() to avoid errors when accessing missing keys.',
          code_example: 'astronauts = {"Alice": "Commander", "Bob": "Pilot"}\\nif "Alice" in astronauts:\\n    print("Alice is in the crew!")\\nrole = astronauts.get("Tom", "Not on mission")\\nprint(role)',
          tip: '.get() prevents crashes and lets you set a custom safe default message.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Level 2 - Session 3...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 14 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 14 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 14 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 14 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/14/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/14/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession3CheatSheet();
