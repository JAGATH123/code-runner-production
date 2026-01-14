import type { Level, Session, Problem, TestCase } from './types';

// Problems - each problem is a distinct coding challenge
export const allProblems: Problem[] = [
  // Level 1, Session 1 (Ages 11-14) - Understanding Output & Displaying Messages in Python
  { 
    problem_id: 1, 
    session_id: 1, 
    title: 'Case 1: Simple Output Message', 
    description: `Use print() to display a message to the screen. Write a program that displays: "Mission Control: All systems are go!"

Example 1:
Output: "Mission Control: All systems are go!"
Explanation: The print() function displays the exact message enclosed in quotes.

Example 2:
Output: "Welcome to the Python Space Program!"
Explanation: Any text inside quotes will be displayed exactly as written.

Example 3:
Output: "Houston, we have liftoff!"
Explanation: The print() function is the basic way to communicate with users by displaying messages on screen.`,
    difficulty: 'Intro', 
    example_code: 'print("Welcome to the Python Space Program!")', 
    sample_input: '', 
    sample_output: 'Mission Control: All systems are go!',
    age_group: '11-14',
    level_number: 1
  },
  { 
    problem_id: 2, 
    session_id: 1, 
    title: 'Case 2: Output with Numbers', 
    description: `You can show numbers like mission time, rocket speed, or distances using print(). Display: "The space station is 400 km above Earth."

Example 1:
Output: "The space station is 400 km above Earth."
Explanation: Numbers can be included directly in text messages.

Example 2:
Output: "Rocket speed is 27500 km/h"
Explanation: When using commas in print(), Python adds spaces between elements automatically.

Example 3:
Output: "Mission duration: 180 days"
Explanation: You can combine text and numbers to display meaningful space mission data.`,
    difficulty: 'Intro', 
    example_code: 'print("Rocket speed is", 27500, "km/h")', 
    sample_input: '', 
    sample_output: 'The space station is 400 km above Earth.',
    age_group: '11-14',
    level_number: 1
  },
  { 
    problem_id: 3, 
    session_id: 1, 
    title: 'Case 3: Output with Calculations', 
    description: `Let Python do math and display the results directly. Show this message using a calculation: "Total mission hours:", 7 * 24

Example 1:
Output: "Total mission hours: 168"
Explanation: Python calculates 7 × 24 = 168 and displays the result.

Example 2:
Output: "Escape velocity is 11200.0 m/s"
Explanation: 11.2 × 1000 = 11200.0, Python performs the calculation automatically.

Example 3:
Output: "Fuel consumption: 50 units per day"
Explanation: You can use calculations inside print() to show computed values like 100 / 2.`,
    difficulty: 'Intro', 
    example_code: 'print("Escape velocity is", 11.2 * 1000, "m/s")', 
    sample_input: '', 
    sample_output: 'Total mission hours: 168',
    age_group: '11-14',
    level_number: 1
  },
  { 
    problem_id: 4, 
    session_id: 1, 
    title: 'Case 4: Using Variables in Output', 
    description: `Store values in variables and print them for dynamic output. Create a program that stores and prints: "Scientist Mira is analyzing samples on Mars Base Alpha."

Example 1:
Output: "Scientist Mira is analyzing samples on Mars Base Alpha."
Explanation: Variables store text that can be used in print statements.

Example 2:
Output: "Commander Ray is leading the Lunar Orbiter 1"
Explanation: Multiple variables can be combined in one print statement using commas.

Example 3:
Output: "Dr. Chen is working on Europa Research"
Explanation: Variables make programs flexible - you can change the stored values and the output changes accordingly.`,
    difficulty: 'Intro', 
    example_code: 'astronaut = "Commander Ray"\nmission = "Lunar Orbiter 1"\nprint(astronaut, "is leading the", mission)', 
    sample_input: '', 
    sample_output: 'Scientist Mira is analyzing samples on Mars Base Alpha.',
    age_group: '11-14',
    level_number: 1
  },
  { 
    problem_id: 5, 
    session_id: 1, 
    title: 'Case 5: Fancy Output using f-strings', 
    description: `Use f-strings to create neat and readable output using variables. Use an f-string to display: "The distance to Neptune is 4.5 billion km."

Example 1:
Output: "The distance to Neptune is 4.5 billion km."
Explanation: f-strings use {variable_name} inside quotes to insert variable values cleanly.

Example 2:
Output: "Jupiter has 79 known moons."
Explanation: f"{planet} has {moons} known moons." - the f before quotes makes it an f-string.

Example 3:
Output: "Mars rover traveled 15 km today."
Explanation: f-strings are the modern, readable way to combine text and variables, much cleaner than using commas.`,
    difficulty: 'Intro', 
    example_code: 'planet = "Jupiter"\nmoons = 79\nprint(f"{planet} has {moons} known moons.")', 
    sample_input: '', 
    sample_output: 'The distance to Neptune is 4.5 billion km.',
    age_group: '11-14',
    level_number: 1
  },

];

// Generate placeholder problems for all sessions
let problemIdCounter = allProblems.length + 1;
// 4 levels for 11-14, 4 levels for 15-18 = 8 levels total
// 8 levels * 12 sessions/level = 96 sessions total
// Level 1, Session 2 (Ages 11-14) - Variables and Data Types
allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 2,
    title: 'Case 1: Creating and Assigning Variables',
    description: `Create a variable called rover_speed and assign it the value 15.5. Print the value.

Example 1:
Output: "15.5"
Explanation: Variables store values that can be used later. rover_speed = 15.5 stores the number.

Example 2:
Output: "Mars\n-63"
Explanation: planet_name = "Mars" stores text, temperature = -63 stores a number.

Example 3:
Output: "Commander Nova"
Explanation: astronaut_name = "Commander Nova" - variables can hold any type of data for later use.`,
    difficulty: 'Intro',
    example_code: 'planet_name = "Mars"\ntemperature = -63\nprint(planet_name)\nprint(temperature)',
    sample_input: '',
    sample_output: '15.5',
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 2,
    title: 'Case 2: Data Types in Action',
    description: `Write a Python program with: an integer variable for number of astronauts, a float for fuel level, a string for spacecraft name, and a boolean for mission status. Print each variable.

Example 1:
Output: "4\n85.5\nOrion\nTrue"
Explanation: Integer (4), Float (85.5), String ("Orion"), Boolean (True) - four different data types.

Example 2:
Output: "30\n98.6\nExplorer-1\nTrue"
Explanation: mission_days=30 (int), oxygen_level=98.6 (float), rover_name="Explorer-1" (str), mission_active=True (bool).

Example 3:
Output: "7\n42.8\nVoyager\nFalse"
Explanation: Python automatically recognizes different data types based on how you write the values.`,
    difficulty: 'Intro',
    example_code: 'mission_days = 30\noxygen_level = 98.6\nrover_name = "Explorer-1"\nmission_active = True\nprint(mission_days)\nprint(oxygen_level)\nprint(rover_name)\nprint(mission_active)',
    sample_input: '',
    sample_output: '4\n85.5\nOrion\nTrue',
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 2,
    title: 'Case 3: Checking Data Types',
    description: `Create 3 variables with different types. Use type() to print each type.

Example 1:
Output: "<class 'int'>\n<class 'float'>\n<class 'str'>"
Explanation: type() function tells you what kind of data type each variable contains.

Example 2:
Output: "<class 'float'>"
Explanation: gravity = 9.8, type(gravity) shows it's a float (decimal number).

Example 3:
Output: "<class 'bool'>\n<class 'str'>\n<class 'int'>"
Explanation: Python has built-in functions like type() to help you understand your data.`,
    difficulty: 'Intro',
    example_code: 'gravity = 9.8\nprint(type(gravity))',
    sample_input: '',
    sample_output: "<class 'int'>\n<class 'float'>\n<class 'str'>",
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 2,
    title: 'Case 4: Changing Values and Types',
    description: `Create a variable with a string, print it, then reassign a number and print it again.

Example 1:
Output: "sample data\n100"
Explanation: Variables can change both their value and type during program execution.

Example 2:
Output: "rock\n42"
Explanation: sample="rock" (string), then sample=42 (integer) - same variable, different types.

Example 3:
Output: "Mars\n3.7"
Explanation: Python allows variables to be reassigned to completely different data types dynamically.`,
    difficulty: 'Intro',
    example_code: 'sample = "rock"\nprint(sample)\nsample = 42\nprint(sample)',
    sample_input: '',
    sample_output: 'sample data\n100',
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 2,
    title: 'Case 5: Getting Input from the User',
    description: `Ask the user for: the name of their spaceship, the amount of fuel remaining (in percentage), and whether the mission is active (True/False).

Example 1:
Input: "Starship", "75", "True"
Output: "Starship\n75\nTrue"
Explanation: input() function captures what the user types and stores it in variables.

Example 2:
Input: "Enterprise", "90", "False"
Output: "Enterprise\n90\nFalse"
Explanation: Each input() call waits for user to type something and press Enter.

Example 3:
Input: "Voyager", "60", "True"
Output: "Voyager\n60\nTrue"
Explanation: All input() results are strings initially - they need conversion for math operations.`,
    difficulty: 'Intro',
    example_code: 'astronaut_name = input("Enter your name: ")\nmission_time = input("Enter mission time in days: ")\nprint("Welcome, Commander", astronaut_name)\nprint("Mission duration is", mission_time, "days")',
    sample_input: 'Starship\n75\nTrue',
    sample_output: 'Starship\n75\nTrue',
    age_group: '11-14',
    level_number: 1
});

// Level 1, Session 3 (Ages 11-14) - Input Function and Type Conversions
allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 3,
    title: 'Case 1: Getting Simple Input',
    description: `Use the input() function to ask the user for their astronaut name and print a welcome message.

Example 1:
Input: "Commander Nova"
Output: "Welcome aboard, Captain Commander Nova"
Explanation: The input() function captures the user's input as a string and we display it in a welcome message.

Example 2:
Input: "Zara"
Output: "Welcome aboard, Captain Zara"
Explanation: Any name entered will be displayed in the welcome format.

Example 3:
Input: "Alex Storm"
Output: "Welcome aboard, Captain Alex Storm"
Explanation: The input() function handles names with spaces correctly.`,
    difficulty: 'Intro',
    example_code: 'pilot_name = input("Enter pilot name: ")\nprint("Welcome aboard, Captain", pilot_name)',
    sample_input: 'Commander Nova',
    sample_output: 'Welcome aboard, Captain Commander Nova',
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 3,
    title: 'Case 2: Converting Input to Numbers using int()',
    description: `Ask the user for the number of crew members and calculate double that number for emergency supplies.

Example 1:
Input: "5"
Output: "Emergency supplies needed: 10"
Explanation: 5 crew members need 5 × 2 = 10 emergency supply units.

Example 2:
Input: "3"
Output: "Emergency supplies needed: 6"
Explanation: 3 crew members need 3 × 2 = 6 emergency supply units.

Example 3:
Input: "8"
Output: "Emergency supplies needed: 16"
Explanation: The int() function converts the string input to integer, then we multiply by 2.`,
    difficulty: 'Intro',
    example_code: 'crew_count = input("Number of crew members: ")\ncrew_number = int(crew_count)\nemergency_supplies = crew_number * 2\nprint("Emergency supplies needed:", emergency_supplies)',
    sample_input: '5',
    sample_output: 'Emergency supplies needed: 10',
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 3,
    title: 'Case 3: Working with Decimals using float()',
    description: `Ask the user for the fuel level (as a decimal) and calculate remaining fuel percentage.

Example 1:
Input: "0.75"
Output: "Fuel remaining: 75.0 %"
Explanation: 0.75 as decimal = 75% fuel remaining.

Example 2:
Input: "0.25"
Output: "Fuel remaining: 25.0 %"
Explanation: 0.25 × 100 = 25.0% fuel remaining.

Example 3:
Input: "0.9"
Output: "Fuel remaining: 90.0 %"
Explanation: The float() function converts string to decimal number, then multiply by 100 for percentage.`,
    difficulty: 'Intro',
    example_code: 'fuel_input = input("Current fuel level (0.0 to 1.0): ")\nfuel_level = float(fuel_input)\nfuel_percentage = fuel_level * 100\nprint("Fuel remaining:", fuel_percentage, "%")',
    sample_input: '0.75',
    sample_output: 'Fuel remaining: 75.0 %',
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 3,
    title: 'Case 4: Mixed Input and Conversion',
    description: `Create a program that asks for mission name (string), duration in days (integer), and success probability (float). Display all information.

Example 1:
Input: "Mars Explorer", "180", "0.92"
Output: "Mission: Mars Explorer\nDuration: 180 days\nSuccess probability: 92.0 %"
Explanation: String stays as string, "180" converts to integer 180, "0.92" converts to float and becomes 92.0%.

Example 2:
Input: "Luna Base", "30", "0.85"
Output: "Mission: Luna Base\nDuration: 30 days\nSuccess probability: 85.0 %"
Explanation: Mixed data types are handled correctly with appropriate conversions.

Example 3:
Input: "Saturn Ring Study", "365", "0.78"
Output: "Mission: Saturn Ring Study\nDuration: 365 days\nSuccess probability: 78.0 %"
Explanation: Demonstrates handling string with spaces, integer conversion, and float conversion in one program.`,
    difficulty: 'Intro',
    example_code: 'mission = input("Mission name: ")\ndays_str = input("Duration in days: ")\nprob_str = input("Success probability (0.0-1.0): ")\ndays = int(days_str)\nprob = float(prob_str)\nprint("Mission:", mission)\nprint("Duration:", days, "days")\nprint("Success probability:", prob * 100, "%")',
    sample_input: 'Mars Explorer\n180\n0.92',
    sample_output: 'Mission: Mars Explorer\nDuration: 180 days\nSuccess probability: 92.0 %',
    age_group: '11-14',
    level_number: 1
});

allProblems.push({
    problem_id: problemIdCounter++,
    session_id: 3,
    title: 'Final Task: Mission Control Calculator',
    description: `Create a space mission calculator that takes astronaut name, rocket speed (km/h), and travel time (hours). Calculate and display the distance traveled.

Example 1:
Input: "Zara", "25000", "2.5"
Output: "Commander Zara traveled 62500.0 km"
Explanation: Distance = Speed × Time = 25000 × 2.5 = 62500.0 km

Example 2:
Input: "Nova", "30000", "1.5"
Output: "Commander Nova traveled 45000.0 km"
Explanation: 30000 km/h × 1.5 hours = 45000.0 km traveled

Example 3:
Input: "Alex Storm", "15000", "4.0"
Output: "Commander Alex Storm traveled 60000.0 km"
Explanation: This demonstrates using all three input types: string (name), int (speed), float (time) to calculate distance using the formula Distance = Speed × Time.`,
    difficulty: 'Intro',
    example_code: 'name = input("Astronaut name: ")\nspeed_str = input("Rocket speed (km/h): ")\ntime_str = input("Travel time (hours): ")\nspeed = int(speed_str)\ntime = float(time_str)\ndistance = speed * time\nprint("Commander", name, "traveled", distance, "km")',
    sample_input: 'Zara\n25000\n2.5',
    sample_output: 'Commander Zara traveled 62500.0 km',
    age_group: '11-14',
    level_number: 1
});

for (let i = 4; i <= 96; i++) { // Start from session 4 up to 96
    for (let j = 1; j <= 5; j++) {
        allProblems.push({
            problem_id: problemIdCounter,
            session_id: i,
            title: `Placeholder Problem ${j} for Session ${i}`,
            description: `This is a placeholder description.`,
            difficulty: 'Easy',
            example_code: `print("Placeholder for session ${i}, problem ${j}")`,
            sample_input: '',
            sample_output: `Placeholder for session ${i}, problem ${j}`,
        });
        problemIdCounter++;
    }
}


// Sessions - each session is a collection of 5 problems
export const allSessions: Session[] = [];
const numLevelsTotal = 8;
const sessionsPerLevel = 12;

for (let i = 1; i <= numLevelsTotal * sessionsPerLevel; i++) {
    const levelId = Math.ceil(i / sessionsPerLevel);
    const sessionNumber = ((i - 1) % sessionsPerLevel) + 1;
    
    // Custom title and description for Level 1, Session 1 & 2 (Ages 11-14)
    let title, description;
    if (i === 1) { // First session (Level 1, Session 1 for 11-14)
        title = "Understanding Output & Displaying Messages in Python";
        description = "Learn how to use the print() function to display messages, numbers, and calculations. Master basic output techniques that are essential for all Python programs.";
    } else if (i === 2) { // Second session (Level 1, Session 2 for 11-14)
        title = "Variables and Data Types";
        description = "Discover how to store and manipulate data using variables. Learn about different data types including integers, floats, strings, and booleans, and how to get input from users.";
    } else if (i === 3) { // Third session (Level 1, Session 3 for 11-14)
        title = "Input Function and Type Conversions";
        description = "Master the art of collecting data from users and converting between different data types. Learn to use input(), int(), float(), and mixed conversions for building interactive space mission programs.";
    } else {
        title = `Session ${sessionNumber}`;
        description = `An introduction to core concepts, part ${sessionNumber}.`;
    }
    
    allSessions.push({
        session_id: i,
        level_id: levelId,
        session_number: sessionNumber,
        title: title,
        description: description,
        problems: allProblems.filter(p => p.session_id === i)
    });
}

// Levels - each level contains 12 sessions
export const levels: Level[] = [
  // Ages 11-14
  {
    level_id: 1,
    level_number: 1,
    title: 'Foundations',
    age_group: '11-14',
    description: 'Intro to Python, variables, input/output, basic ops, conditionals, loops, lists, functions.',
    sessions: allSessions.filter(s => s.level_id === 1)
  },
  {
    level_id: 2,
    level_number: 2,
    title: 'Structure & Data',
    age_group: '11-14',
    description: 'Deep dive into strings, dictionaries, tuples, sets, and nested loops.',
    sessions: allSessions.filter(s => s.level_id === 2)
  },
  {
    level_id: 3,
    level_number: 3,
    title: 'Problem Solving',
    age_group: '11-14',
    description: 'Introduction to algorithms, complexity, and more function patterns.',
    sessions: allSessions.filter(s => s.level_id === 3)
  },
  {
    level_id: 4,
    level_number: 4,
    title: 'Readiness',
    age_group: '11-14',
    description: 'Deeper algorithms, recursion, and clean code practices.',
    sessions: allSessions.filter(s => s.level_id === 4)
  },
  // Ages 15-18
  {
    level_id: 5,
    level_number: 1,
    title: 'Problem Solving',
    age_group: '15-18',
    description: 'Algorithms, complexity, and advanced function patterns.',
    sessions: allSessions.filter(s => s.level_id === 5)
  },
  {
    level_id: 6,
    level_number: 2,
    title: 'Readiness',
    age_group: '15-18',
    description: 'Advanced algorithms, recursion, and clean code best practices.',
    sessions: allSessions.filter(s => s.level_id === 6)
  },
    {
    level_id: 7,
    level_number: 3,
    title: 'Advanced Data Structures',
    age_group: '15-18',
    description: 'Exploring complex data structures and their applications.',
    sessions: allSessions.filter(s => s.level_id === 7)
  },
  {
    level_id: 8,
    level_number: 4,
    title: 'Specialized Topics',
    age_group: '15-18',
    description: 'Diving into specialized areas of computer science and Python.',
    sessions: allSessions.filter(s => s.level_id === 8)
  }
];


// Test Cases
export const testCases: {[key: number]: TestCase[]} = {};

// Custom test cases for Level 1, Session 1 problems
testCases[1] = [
    { input: "", expected_output: "Mission Control: All systems are go!" }
];

testCases[2] = [
    { input: "", expected_output: "The space station is 400 km above Earth." }
];

testCases[3] = [
    { input: "", expected_output: "Total mission hours: 168" }
];

testCases[4] = [
    { input: "", expected_output: "Scientist Mira is analyzing samples on Mars Base Alpha." }
];

testCases[5] = [
    { input: "", expected_output: "The distance to Neptune is 4.5 billion km." }
];

// Custom test cases for Level 1, Session 2 problems (Variables and Data Types)
testCases[6] = [
    { input: "", expected_output: "15.5" }
];

testCases[7] = [
    { input: "", expected_output: "4\n85.5\nOrion\nTrue" }
];

testCases[8] = [
    { input: "", expected_output: "<class 'int'>\n<class 'float'>\n<class 'str'>" }
];

testCases[9] = [
    { input: "", expected_output: "sample data\n100" }
];

testCases[10] = [
    { input: "Starship\n75\nTrue", expected_output: "Starship\n75\nTrue" }
];

// Custom test cases for Level 1, Session 3 problems (Input Function and Type Conversions)
testCases[11] = [
    { input: "Commander Nova", expected_output: "Welcome aboard, Captain Commander Nova" }
];

testCases[12] = [
    { input: "5", expected_output: "Emergency supplies needed: 10" }
];

testCases[13] = [
    { input: "0.75", expected_output: "Fuel remaining: 75.0 %" }
];

testCases[14] = [
    { input: "Mars Explorer\n180\n0.92", expected_output: "Mission: Mars Explorer\nDuration: 180 days\nSuccess probability: 92.0 %" }
];

testCases[15] = [
    { input: "Zara\n25000\n2.5", expected_output: "Commander Zara traveled 62500.0 km" }
];

// Generate default test cases for other problems
allProblems.forEach(problem => {
    if (!testCases[problem.problem_id]) {
        testCases[problem.problem_id] = [
            { input: problem.sample_input, expected_output: problem.sample_output },
            { input: "test1", expected_output: "output1" },
            { input: "test2", expected_output: "output2" },
            { input: "test3", expected_output: "output3" },
            { input: "test4", expected_output: "output4" },
        ];
    }
});
