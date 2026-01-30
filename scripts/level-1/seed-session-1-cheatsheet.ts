/**
 * Seed script for Session 1 Cheat Sheet
 * Title: Understanding Output & Displaying Messages in Python
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-1-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSampleCheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Sample cheat sheet data based on the image you provided
    const sampleCheatSheet = {
      session_id: 1,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Understanding Output & Displaying Messages in Python',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Simple Message',
          description: 'Use print() to make your program talk.',
          code_example: `print("Mission Control: All systems are go!")`,
          tip: 'Always put your text inside quotation marks',
        },
        {
          number: 2,
          title: 'Showing Numbers',
          description: 'You can print both words and numbers together.',
          code_example: `print("The space station is", 400, "km above Earth.")`,
          tip: 'Use commas to join words and numbers. \\nPython adds spaces automatically.',
        },
        {
          number: 3,
          title: 'Displaying Calculations',
          description: 'Let Python solve math for you.',
          code_example: `print("Total mission hours:", 7 * 24)`,
          tip: 'You can use +, -, *, or / inside print() to calculate values.',
        },
        {
          number: 4,
          title: 'Using Variables',
          description: 'Store values in variables and show them in your message.',
          code_example: 'astronaut = "Scientist Mira"\\nmission = "Mars Base Alpha"\\nprint(astronaut, "is analyzing samples on", mission)',
          tip: 'Variables make your program flexible and easier to update.',
        },
        {
          number: 5,
          title: 'f-Strings for Clean Output',
          description: 'Make your print statements neater using f-strings.',
          code_example: 'planet = "Neptune"\\ndistance = 4.5\\nprint(f"The distance to {planet} is {distance} billion km.")',
          tip: 'Write f before the quotes and use {} to place variables inside text.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 1...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 1 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 1 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 1 },
        { $set: sampleCheatSheet }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(sampleCheatSheet);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 1 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/1/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/1/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSampleCheatSheet();
