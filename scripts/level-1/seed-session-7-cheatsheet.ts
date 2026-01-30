/**
 * Seed script for Session 7 Cheat Sheet
 * Title: Python Lists – Quick Cheatsheet
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-7-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession7CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 7,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Python Lists – Quick Cheatsheet',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Creating and Accessing List Elements',
          description: 'Use square brackets [] to make a list and access its items by position.',
          code_example: 'fruits = ["apple", "banana", "cherry"]\\nprint(fruits[0])\\nprint(fruits[2])',
          tip: 'List positions start at 0, so fruits[0] gives the first item.',
        },
        {
          number: 2,
          title: 'Adding Items to a List',
          description: 'Use .append() to add a new item to the end of the list.',
          code_example: 'numbers = [1, 2, 3]\\nnumbers.append(4)\\nprint(numbers)',
          tip: 'Each time you use .append(), the new item goes to the end of the list.',
        },
        {
          number: 3,
          title: 'Removing Items from a List',
          description: 'Use .remove() to delete an item by its value.',
          code_example: 'animals = ["cat", "dog", "rabbit"]\\nanimals.remove("dog")\\nprint(animals)',
          tip: 'If the item doesn\'t exist, .remove() will cause an error.',
        },
        {
          number: 4,
          title: 'Sorting and Reversing a List',
          description: 'Use .sort() to arrange items and .reverse() to flip them.',
          code_example: 'scores = [88, 72, 93, 65]\\nscores.sort()\\nprint("Sorted:", scores)\\nscores.reverse()\\nprint("Reversed:", scores)',
          tip: '.sort() changes the list order permanently; .reverse() flips its direction.',
        },
        {
          number: 5,
          title: 'Finding Length and Checking Membership',
          description: 'Use len() to count items and in to check if something exists.',
          code_example: 'devices = ["laptop", "tablet", "phone"]\\nprint(len(devices))\\nprint("phone" in devices)\\nprint("camera" in devices)',
          tip: 'len() gives the total number of elements; "item" in list returns True or False.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 7...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 7 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 7 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 7 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 7 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/7/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/7/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession7CheatSheet();
