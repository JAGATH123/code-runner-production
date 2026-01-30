/**
 * Seed script for Session 6 Cheat Sheet
 * Title: Advanced Decision Making with Nested If-Else
 * Level: 1 | Age Group: 11-14
 *
 * Run with: npx tsx scripts/seed-session-6-cheatsheet.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase, Models } from '@code-runner/shared';

// Load environment variables from apps/api/.env.local
const envLocalPath = path.resolve(__dirname, '../apps/api/.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config();

async function insertSession6CheatSheet() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const cheatSheetData = {
      session_id: 6,
      age_group: '11-14' as const,
      level_number: 1,
      title: 'Advanced Decision Making with Nested If-Else',
      subtitle: 'QUICK REFERENCE',
      boxes: [
        {
          number: 1,
          title: 'Simple Nested If',
          description: 'Use nested if statements to check conditions inside other conditions for more precise control.',
          code_example: 'fuel_level = int(input("Enter fuel level: "))\\nif fuel_level > 50:\\n    if fuel_level > 75:\\n        if fuel_level > 90:\\n            print("Fuel tank full!")\\n        else:\\n            print("Fuel level high")\\n    else:\\n        print("Fuel level moderate")',
          tip: 'Add one more inner check for overloading.',
        },
        {
          number: 2,
          title: 'Nested If-Else',
          description: 'Combine nested if with else blocks to handle multiple outcomes at each level.',
          code_example: 'oxygen_level = int(input("Enter oxygen level: "))\\nif oxygen_level >= 60:\\n    if oxygen_level >= 80:\\n        print("Oxygen optimal!")\\n    else:\\n        print("Oxygen acceptable")\\nelse:\\n    print("Oxygen critically low!")',
          tip: 'Insert an extra elif 40 <= oxygen_level < 60: for reserve tanks.',
        },
        {
          number: 3,
          title: 'Multiple Conditions in Inner If',
          description: 'Use logical operators inside nested if statements to check multiple conditions at once.',
          code_example: 'fuel_level = int(input("Enter fuel level: "))\\nengine_ready = True\\nbattery_level = int(input("Enter battery level: "))\\nif fuel_level > 60:\\n    if engine_ready and battery_level > 50:\\n        print("All systems go!")\\n    else:\\n        print("Check engine or battery")',
          tip: 'Combine checks with logical and to confirm all systems ready.',
        },
        {
          number: 4,
          title: 'Deeply Nested If-Else Chain',
          description: 'Chain multiple nested if-else statements for complex multi-step decision making.',
          code_example: 'fuel = int(input("Fuel: "))\\noxygen = int(input("Oxygen: "))\\nengine = True\\nweather_clear = True\\nif fuel > 60:\\n    if oxygen > 75:\\n        if engine:\\n            if weather_clear:\\n                print("Launch approved!")\\n            else:\\n                print("Weather hold")\\n        else:\\n            print("Engine failure")\\n    else:\\n        print("Low oxygen")\\nelse:\\n    print("Insufficient fuel")',
          tip: 'Add weather condition at final layer with specific fail messages.',
        },
        {
          number: 5,
          title: 'Nested If-Else with External Flags',
          description: 'Use flag variables to track readiness and make final decisions based on all checks.',
          code_example: 'fuel = 80\\noxygen = 90\\nengine = True\\nweather = True\\ncrew_ready = True\\nlaunch_ready = False\\nif fuel > 60:\\n    if oxygen > 70:\\n        if engine and weather and crew_ready:\\n            launch_ready = True\\n            print("Launch ready!")\\nif launch_ready:\\n    print("Initiating countdown...")\\nelse:\\n    print("Launch aborted")',
          tip: 'Add crew_ready check before final approval and use master switch at the end.',
        },
      ],
      template_version: 'v1',
    };

    console.log('\n📝 Inserting cheat sheet for Session 6...');

    // Check if cheat sheet already exists
    const existing = await Models.CheatSheet.findOne({ session_id: 6 });

    if (existing) {
      console.log('⚠️  Cheat sheet for Session 6 already exists. Updating...');
      await Models.CheatSheet.updateOne(
        { session_id: 6 },
        { $set: cheatSheetData }
      );
      console.log('✅ Updated existing cheat sheet');
    } else {
      const newCheatSheet = new Models.CheatSheet(cheatSheetData);
      await newCheatSheet.save();
      console.log('✅ Successfully inserted new cheat sheet');
    }

    // Fetch and display the saved cheat sheet
    const saved = await Models.CheatSheet.findOne({ session_id: 6 });
    console.log('\n📊 Saved Cheat Sheet:');
    console.log(JSON.stringify(saved, null, 2));

    console.log('\n✨ Done! You can now view it at:');
    console.log('   http://localhost:3000/sessions/6/cheat-sheet');
    console.log('   http://192.168.1.106:3000/sessions/6/cheat-sheet');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
insertSession6CheatSheet();
