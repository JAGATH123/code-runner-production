'use client';

import { Header } from '@/components/layout/Header';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useEffect, useState } from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

interface CodeConvergenceIntroductionProps {
  params: {
    age_group: string;
    level_number: string;
  };
}

// Level configurations
const levelConfigs: Record<string, {
  title: string;
  description: string;
  subtitle: string;
  concepts: string[];
  missionStatement: string;
  task: {
    number: string;
    taskName: string;
    instructions: string[];
  };
  ultimateChallengePath: string;
}> = {
  '1': {
    title: 'Code Convergence',
    subtitle: 'Welcome to Code Convergence - The Ultimate Challenge!',
    description: 'This is where all your knowledge from every session comes together. Create a complete application that uses all the concepts you\'ve learned to simulate a space mission log.',
    concepts: [
      'Variables and data types',
      'Input and output operations',
      'Conditional statements (if/else)',
      'Loops (for loop)',
      'Lists',
      'Functions',
      'String manipulation'
    ],
    missionStatement: 'Your mission is to create a comprehensive Python program that demonstrates mastery of all these concepts.',
    task: {
      number: '1',
      taskName: 'Space Mission Log',
      instructions: [
        'Ask the astronaut\'s name and mission title',
        'Check if the energy level (input as a number) is > 60',
        'If yes, print "Mission Start Approved." Else, print "Hold Launch."',
        'Use a loop to count down from 5',
        'Store mission tools in a list and print the second tool',
        'Define a function launch_message() to print "Mission Started Successfully!" and call it at the end'
      ]
    },
    ultimateChallengePath: '/code-convergence/[age_group]/[level_number]/ultimate-challenge'
  },
  '2': {
    title: 'Project ORBITRON - Code Convergence',
    subtitle: 'Welcome to Project ORBITRON - The Ultimate Integration Challenge!',
    description: 'The storm peaks around NOVA-12. Systems are failing, signals are fragmenting, and the spacecraft is drifting off course. ORBITRON, the unified command matrix, must come online NOW. This is where all your Python knowledge converges into one powerful system.',
    concepts: [
      'Functions with multiple parameters and return values',
      'Data structure conversions (list, set)',
      'String manipulation (split, strip, map)',
      'Built-in functions (input, int, max, len)',
      'List indexing and operations',
      'Type conversions and data processing',
      'Integration of all Level 2 concepts'
    ],
    missionStatement: 'Your mission: Build the ORBITRON Mission Control Dashboard that processes real-time spacecraft telemetry and decodes the distress signal from VORAX-9.',
    task: {
      number: '1',
      taskName: 'ORBITRON Mission Control Dashboard',
      instructions: [
        'Accept mission name as input',
        'Collect fuel level readings as space-separated integers and convert to a list using split() and map()',
        'Gather signal codes as space-separated strings and store as a unique set',
        'Input mission events as comma-separated values, split by comma, and strip whitespace from each',
        'Create a function mission_dashboard() that takes 4 parameters: mission_name, fuel_levels, signals, events',
        'Inside the function: find maximum fuel using max(), count signals using len(), get the last event with indexing',
        'Return a formatted summary message combining all data',
        'Call the function with collected inputs and print the return value'
      ]
    },
    ultimateChallengePath: '/compiler/1000'
  },
  '3': {
    title: 'Project COSMIC LINK',
    subtitle: 'Welcome to Project COSMIC LINK - The Ultimate OOP Challenge!',
    description: 'Deep Space Command has intercepted VORAX-9 distress signals, and the COSMIC LINK HUB has been sealed until you can build a system to classify these streams. This is where all your Level 3 knowledge converges into one powerful AI signal processing system.',
    concepts: [
      'Classes and object-oriented programming',
      'Encapsulation with private attributes',
      'Magic methods (__init__, __str__)',
      'Lists and loops',
      'Conditional logic and classification',
      'Functions with *args and **kwargs',
      'Input/output operations'
    ],
    missionStatement: 'Your mission: Build an intelligent signal processor that detects, decodes, classifies, and responds to mysterious cosmic transmissions.',
    task: {
      number: '1',
      taskName: 'COSMIC LINK Signal Processor',
      instructions: [
        'Create a Signal class with __init__(source, strength, message) and __str__() magic method',
        'Create a SignalClassifier class with private __type attribute and getter/setter methods',
        'Read 3 signal inputs (source, strength, message) and store them in a list',
        'Classify each signal: strength > 70 = Friendly, else Unknown',
        'Separate signals into friendly and unknown lists',
        'Create send_alert(*signals) function to generate alerts for friendly signals',
        'Print a comprehensive summary with total signals, friendly count, and unknown count',
        'Display final status: "COSMIC LINK LIVE – STREAMS CLASSIFIED"'
      ]
    },
    ultimateChallengePath: '/code-convergence/[age_group]/[level_number]/ultimate-challenge'
  },
  '4': {
    title: 'Project GALACTIC COMMAND',
    subtitle: 'Welcome to Project GALACTIC COMMAND - The Ultimate Integration Challenge!',
    description: 'The Nova Network is failing, and only a fully integrated AI spacecraft controller can restore it. GALACTIC COMMAND is where all Level 4 concepts converge: OOP, file handling, exception handling, and Pygame visualization. This is the ultimate test of your Python mastery.',
    concepts: [
      'Object-Oriented Programming with classes and methods',
      'File I/O operations and logging systems',
      'Custom exception handling and error recovery',
      'Pygame window creation and real-time updates',
      'System integration and modular design',
      'State management and monitoring',
      'Complete end-to-end application development'
    ],
    missionStatement: 'Your mission: Build the Galactic Command System - a fully integrated spacecraft AI controller that coordinates all subsystems and restores the Nova Network.',
    task: {
      number: '1',
      taskName: 'GALACTIC COMMAND Integration System',
      instructions: [
        'Create a GalacticCommand class with methods for mission control (start_mission, navigate, abort, status_report)',
        'Implement a MissionLogger class that writes timestamped actions to "mission_log.txt" using file append mode',
        'Define a custom EmergencyAbortError exception and handle it with try-except blocks',
        'Build a Pygame window (400x300) that displays live status updates from the command system',
        'Initialize all subsystems: command core, mission logger, exception handler, and dashboard',
        'Demonstrate full integration: start mission, navigate to destinations, handle errors, log all actions',
        'Display system status messages and ensure clean shutdown of all components',
        'Output a complete mission transcript showing all operations performed'
      ]
    },
    ultimateChallengePath: '/code-convergence/[age_group]/[level_number]/ultimate-challenge'
  }
};

export default function CodeConvergenceIntroduction({ params }: CodeConvergenceIntroductionProps) {
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ age_group: string; level_number: string } | null>(null);
  const { forcePlayBackgroundMusic } = useGlobalAudio();

  useEffect(() => {
    async function loadData() {
      try {
        const resolved = await params;
        setResolvedParams(resolved);

        // Validate params
        if (!['11-14', '15-18'].includes(resolved.age_group)) {
          notFound();
        }

        const levelNum = parseInt(resolved.level_number);
        if (isNaN(levelNum) || levelNum < 1 || levelNum > 4) {
          notFound();
        }

        await forcePlayBackgroundMusic();
      } catch (error) {
        console.error('Error loading audio:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, forcePlayBackgroundMusic]);

  if (loading || !resolvedParams) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="font-mono text-purple-400 text-sm animate-pulse">
            // Loading Code Convergence...
          </p>
        </div>
      </div>
    );
  }

  const { age_group, level_number } = resolvedParams;
  const config = levelConfigs[level_number];

  if (!config) {
    notFound();
  }

  const ultimateChallengePath = config.ultimateChallengePath
    .replace('[age_group]', age_group)
    .replace('[level_number]', level_number);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,191,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,191,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <Header />
      <main className="flex-grow relative z-10 overflow-auto p-6 md:p-8">
        <div className="max-w-screen-xl mx-auto">
          {/* Back Button */}
          <Link href={`/levels/${age_group}/${level_number}#code-convergence`}>
            <Button variant="ghost" className="mb-6 hover:bg-blue-500/10 font-space font-semibold uppercase tracking-wide text-sm" style={{ color: 'rgb(0, 191, 255)' }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Activity className="h-7 w-7" style={{ color: 'rgb(0, 191, 255)' }} />
                <div className="absolute -inset-1 rounded-full blur animate-pulse" style={{ backgroundColor: 'rgba(0, 191, 255, 0.2)' }}></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-space font-bold" style={{ color: 'rgb(0, 191, 255)' }}>ARENA: WARM-UP</h1>
            </div>
            <h2 className="text-lg font-space font-bold ml-10" style={{ color: '#000000' }}>{config.title}</h2>

            {/* Challenge Description */}
            <div className="ml-10 mt-4 p-4 rounded-lg border-2" style={{ borderColor: 'rgba(0, 191, 255, 0.3)', backgroundColor: 'rgba(0, 191, 255, 0.05)' }}>
              <p className="text-base font-space font-bold mb-3" style={{ color: '#000000' }}>
                {config.subtitle}
              </p>
              <p className="text-sm md:text-base leading-relaxed mb-3" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
                {config.description}
              </p>
              <div className="space-y-1">
                <p className="text-sm font-space font-semibold" style={{ color: 'rgb(0, 191, 255)' }}>
                  You'll need to {level_number === '1' ? 'apply' : 'master'}:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
                  {config.concepts.map((concept, idx) => (
                    <li key={idx}>{concept}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm md:text-base font-space font-semibold mt-3" style={{ color: '#000000' }}>
                {config.missionStatement}
              </p>
            </div>
          </div>

          {/* Introduction Content - Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className="bg-card rounded-lg p-5 shadow-lg border-2 hover:shadow-xl transition-shadow duration-300"
              style={{ borderColor: 'rgba(0, 191, 255, 0.3)' }}
            >
              {/* Concept Number Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono" style={{ backgroundColor: 'rgba(0, 191, 255, 0.2)', color: 'rgb(0, 191, 255)' }}>
                  {config.task.number}
                </div>
                <span className="text-base font-mono uppercase tracking-wide font-semibold" style={{ color: 'rgb(0, 191, 255)' }}>{config.task.taskName}</span>
              </div>

              {/* Instructions */}
              <div className="mb-4 bg-slate-900/50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4" style={{ color: 'rgb(0, 191, 255)' }} />
                    <span className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'rgba(0, 191, 255, 0.8)' }}>Instructions:</span>
                  </div>
                  <ol className="space-y-2 list-decimal list-inside">
                    {config.task.instructions.map((instruction, idx) => (
                      <li key={idx} className="text-sm md:text-base text-foreground/90 leading-relaxed pl-2" style={{ color: 'rgb(243, 237, 233)' }}>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation to Ultimate Challenge */}
          <div className="mt-10 text-center pb-8">
            <Link href={ultimateChallengePath}>
              <Button className="text-white font-space font-semibold px-10 py-3 text-base hover:opacity-80 transition-opacity" style={{ backgroundColor: 'rgb(0, 191, 255)' }}>
                Continue to {level_number === '1' ? 'Ultimate Challenge' : level_number === '2' ? 'Project ORBITRON' : level_number === '3' ? 'Project COSMIC LINK' : 'Project GALACTIC COMMAND'}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
