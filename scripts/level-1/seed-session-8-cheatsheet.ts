/**
 * Seed script for Session 8 Cheat Sheet
 * Title: Advanced List Operations & List Methods
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-8-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession8CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 8,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Advanced List Operations & List Methods',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Inserting Items (.insert())',
          description: 'Add an item at a specific position by using the index.',
          code_example: 'planets = ["Mercury", "Earth", "Mars"]\\nplanets.insert(1, "Venus")\\nprint(planets)',
          tip: '.insert(index, item) adds the item at the given index. Result: [\'Mercury\', \'Venus\', \'Earth\', \'Mars\']',
        },
        {
          number: 2,
          title: 'Popping Items (.pop())',
          description: 'Remove and return an item by index (defaults to the last item). Useful for stack operations.',
          code_example: 'tools = ["wrench", "hammer", "screwdriver"]\\nremoved = tools.pop()\\nprint("Removed:", removed)\\nprint("Remaining:", tools)',
          tip: '.pop() removes and returns the last item. removed is "screwdriver".',
        },
        {
          number: 3,
          title: 'Copying Lists (.copy())',
          description: 'Use .copy() to create a new, independent copy of an existing list.',
          code_example: 'original = [10, 20, 30]\\nduplicate = original.copy()\\nduplicate.append(40)\\nprint("Original:", original)\\nprint("Duplicate:", duplicate)',
          tip: 'Changes to the copy (e.g., appending a value) don\'t affect the original list.',
        },
        {
          number: 4,
          title: 'List Slicing (list[start:end])',
          description: 'Access a portion (sublist) of the list using a start:end range.',
          code_example: 'letters = ["a", "b", "c", "d", "e"]\\nprint(letters[1:4])\\nprint(letters[:3])\\nprint(letters[2:])',
          tip: 'list[start:end] returns a sublist from the start index up to, but not including, the end index.',
        },
        {
          number: 5,
          title: 'List Comprehension & Aggregates',
          description: 'Create a new list with a single-line expression. Use min(), max(), and sum() for numerical analysis.',
          code_example: 'squares = [x**2 for x in range(1, 6)]\\nprint("Squares:", squares)\\nprint("Max:", max(squares))\\nprint("Sum:", sum(squares))',
          tip: 'The list comprehension creates [1, 4, 9, 16, 25]. max() finds the highest value in the list.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 8...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 8 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 8 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 8 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 8 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/8/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/8/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession8CheatSheet();
