/**
 * Seed script for Session 5 Cheat Sheet
 * Title: Understanding if, if-else Statements and Comparison Operators
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-5-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession5CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 5,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Python Conditionals & Comparison',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Simple If Statement',
          description: 'Use if to check a condition and run code only when it\'s true.',
          code_example: 'temperature = int(input("Enter the temperature in °C: "))\\nif temperature > 30:\\n    print("It\'s a hot day!")',
          tip: 'The code inside if runs only when the condition is True.',
        },
        {
          number: 2,
          title: 'If-Else Statement',
          description: 'Use if-else when there are two possible outcomes.',
          code_example: 'speed = int(input("Enter the speed (km/h): "))\\nif speed > 60:\\n    print("You\'re going too fast!")\\nelse:\\n    print("You\'re within the speed limit.")',
          tip: 'The else block runs when the if condition is False.',
        },
        {
          number: 3,
          title: 'Comparison Operators',
          description: 'Use these symbols to compare values in your conditions.',
          code_example: 'a = 10\\nb = 20\\nif a != b:\\n    print("The numbers are different!")',
          tip: 'Quick Reference:\\n== Equal, != Not equal, > Greater, < Less, >= Greater or equal, <= Less or equal',
        },
        {
          number: 4,
          title: 'Multiple Conditions (elif)',
          description: 'Use elif for checking more than two possibilities.',
          code_example: 'marks = int(input("Enter your marks: "))\\nif marks >= 90:\\n    print("Grade: A")\\nelif marks >= 75:\\n    print("Grade: B")\\nelse:\\n    print("Grade: C")',
          tip: 'Python checks each condition in order until one is true, then skips the rest.',
        },
        {
          number: 5,
          title: 'Combining Conditions',
          description: 'Use and/or to check multiple conditions at once.',
          code_example: 'age = int(input("Enter your age: "))\\nhas_ticket = True\\nif age >= 18 and has_ticket:\\n    print("Access granted!")\\nelse:\\n    print("Access denied.")',
          tip: 'Use and when all conditions must be true, or when at least one must be true.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 5...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 5 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 5 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 5 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 5 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/5/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/5/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession5CheatSheet();
