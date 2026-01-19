'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Agent = 'jett' | 'omen' | 'yoru' | 'phoenix' | null;

interface AgentStats {
  offense: number;
  defense: number;
  utility: number;
}

const agentStats: Record<string, AgentStats> = {
  JETT: { offense: 90, defense: 40, utility: 60 },
  OMEN: { offense: 50, defense: 70, utility: 85 },
  YORU: { offense: 85, defense: 45, utility: 70 },
  PHOENIX: { offense: 80, defense: 55, utility: 65 }
};

// Python Mission Quotes
const PYTHON_QUOTES = [
  // Core Python Mission Quotes
  "The universe doesn't speak magic. It speaks Python.",
  "Every mission begins with Python.",
  "Stars are distant. Python brings them closer.",

  // Learning Python Quotes
  "Python turns curiosity into control.",
  "When systems fail, Python explains why.",
  "Python is not code. It's clarity.",

  // Skill & Progress Quotes
  "Each line of Python pushes you closer to orbit.",
  "Python rewards precision.",
  "In space, guesswork fails. Python succeeds.",
  "Python is how explorers think.",

  // Error & Debug Quotes
  "Python errors are signals, not setbacks.",
  "Python doesn't break. It teaches.",
  "Fix the Python. Stabilize the mission.",

  // Level-Up & Completion Quotes
  "Mission complete. Python executed successfully.",
  "New clearance unlocked through Python.",
  "Python systems online.",
  "You didn't run Python. You mastered it.",

  // End-Screen Quotes
  "Exploration begins with Python.",
  "Python turned imagination into reality.",
  "Welcome to the Python frontier."
];

// 200 dynamic news feed messages
const NEWS_MESSAGES = [
  '<span class="text-cyan-400">PRIORITY TRANSMISSION:</span> SERVERS STABLE ACROSS ALL REGIONS',
  'DOUBLE XP WEEKEND ACTIVE',
  'NEW OPERATION "FROSTBITE" ARRIVES IN 03:14:27',
  '<span class="text-red-500">WARNING:</span> HIGH LATENCY DETECTED ON NODE-09',
  'WELCOME TO PROJECT NOVA',
  '<span class="text-green-500">SUCCESS:</span> SECURITY PATCH 10.7.4 DEPLOYED',
  'RANKED SEASON 3 BEGINS IN 2 DAYS',
  '<span class="text-cyan-400">ALERT:</span> MAINTENANCE SCHEDULED FOR 02:00 UTC',
  'NEW OPERATOR SKINS AVAILABLE IN STORE',
  '<span class="text-yellow-500">BONUS:</span> WEEKLY CHALLENGES REFRESHED',
  'GLOBAL TOURNAMENT REGISTRATIONS NOW OPEN',
  '<span class="text-red-500">CRITICAL:</span> DDOS ATTACK MITIGATED ON EU-WEST',
  'LEADERBOARD UPDATED - CHECK YOUR RANK',
  'NEW MAP "NEXUS CORE" RELEASING TOMORROW',
  '<span class="text-cyan-400">INFO:</span> SERVER CAPACITY INCREASED BY 40%',
  'AGENT BALANCING UPDATE LIVE',
  'COMMUNITY EVENT: WEEKEND SHOWDOWN STARTS FRIDAY',
  '<span class="text-green-500">ONLINE:</span> 147,832 OPERATORS ACTIVE',
  'ANTI-CHEAT SYSTEM UPDATED TO v3.2',
  '<span class="text-red-500">WARNING:</span> UNAUTHORIZED ACCESS ATTEMPT BLOCKED',
  'NEW VOICE LINES ADDED FOR ALL AGENTS',
  'PERFORMANCE OPTIMIZATION PATCH DEPLOYED',
  '<span class="text-cyan-400">BROADCAST:</span> DEVELOPER Q&A SESSION AT 18:00',
  'SEASON BATTLE PASS NOW AVAILABLE',
  'CROSSPLAY BETA TESTING PHASE 2',
  '<span class="text-yellow-500">ACHIEVEMENT:</span> PLAYER "SHADOW_99" REACHED RANK 1',
  'NETWORK INFRASTRUCTURE UPGRADED',
  'NEW LORE CHAPTER UNLOCKED',
  '<span class="text-green-500">STABLE:</span> ALL GAME MODES OPERATIONAL',
  'SPECIAL OPS MISSION PACK RELEASED',
  '<span class="text-red-500">ALERT:</span> SUSPICIOUS ACTIVITY ON ASIA-SOUTH',
  'WEEKLY ROTATION: NEW OPERATORS AVAILABLE',
  'ESPORTS CHAMPIONSHIP FINALS THIS WEEKEND',
  '<span class="text-cyan-400">UPDATE:</span> CLIENT VERSION 10.7.8 AVAILABLE',
  'AGENT CUSTOMIZATION 2.0 NOW LIVE',
  'TEAM DEATHMATCH MODE TEMPORARILY DISABLED',
  '<span class="text-yellow-500">BONUS:</span> LOGIN STREAK REWARDS DOUBLED',
  'SERVER MIGRATION COMPLETED SUCCESSFULLY',
  'NEW PREMIUM TIER UNLOCKED',
  '<span class="text-green-500">OPERATIONAL:</span> MATCHMAKING QUEUE TIMES REDUCED',
  'HALLOWEEN EVENT STARTING OCTOBER 25',
  '<span class="text-red-500">WARNING:</span> PACKET LOSS ON NODE-14',
  'SPECTATOR MODE IMPROVEMENTS LIVE',
  'CLAN SYSTEM UPDATE DEPLOYED',
  '<span class="text-cyan-400">NEWS:</span> UPCOMING AGENT REVEAL NEXT WEEK',
  'TRAINING MODE ENHANCED WITH NEW FEATURES',
  'REGIONAL QUALIFIERS BEGIN TOMORROW',
  '<span class="text-yellow-500">REWARD:</span> FREE LOOT BOX FOR ALL PLAYERS',
  'GAME ENGINE OPTIMIZATION COMPLETE',
  'NEW SOUNDTRACK TRACKS ADDED',
  '<span class="text-green-500">ACTIVE:</span> PRIME TIME BONUS XP NOW LIVE',
  'BUG FIXES: 47 ISSUES RESOLVED',
  '<span class="text-red-500">CRITICAL:</span> EMERGENCY MAINTENANCE IN 30 MINUTES',
  'WEAPON BALANCING HOTFIX APPLIED',
  'DISCORD INTEGRATION NOW AVAILABLE',
  '<span class="text-cyan-400">ANNOUNCEMENT:</span> NEW GAME MODE COMING SOON',
  'PLAYER REPORT SYSTEM IMPROVED',
  'GRAPHICS SETTINGS EXPANDED',
  '<span class="text-yellow-500">SPECIAL:</span> FOUNDER PACK OWNERS GET EXCLUSIVE BADGE',
  'REPLAY SYSTEM BETA TESTING',
  'VOICE CHAT QUALITY IMPROVED',
  '<span class="text-green-500">SUCCESS:</span> 1 MILLION ACTIVE PLAYERS MILESTONE',
  'MAP ROTATION SCHEDULE UPDATED',
  '<span class="text-red-500">WARNING:</span> CHEATER DETECTED AND BANNED',
  'CUSTOM GAME LOBBIES NOW SUPPORT 32 PLAYERS',
  'ACCESSIBILITY FEATURES ADDED',
  '<span class="text-cyan-400">PATCH NOTES:</span> VIEW FULL CHANGELOG ON WEBSITE',
  'FRIEND LIST CAPACITY INCREASED TO 500',
  'TOURNAMENT PRIZE POOL INCREASED',
  '<span class="text-yellow-500">BONUS:</span> TRIPLE XP FOR SUPPORT ROLES',
  'HITBOX ACCURACY IMPROVEMENTS',
  'REGIONAL SERVERS EXPANDED',
  '<span class="text-green-500">ONLINE:</span> PEAK CONCURRENT PLAYERS: 234,891',
  'AGENT MASTERY SYSTEM REVAMPED',
  '<span class="text-red-500">ALERT:</span> LOGIN ATTEMPT FROM UNKNOWN LOCATION',
  'MOBILE COMPANION APP UPDATED',
  'LORE EVENT: CHAPTER 5 BEGINS',
  '<span class="text-cyan-400">INFO:</span> API ACCESS FOR DEVELOPERS ENABLED',
  'RANKED REWARDS DISTRIBUTION COMPLETE',
  'PATCH 10.8 PREVIEW AVAILABLE',
  '<span class="text-yellow-500">EVENT:</span> WINTER WONDERLAND STARTS DEC 20',
  'STREAMER MODE FUNCTIONALITY ADDED',
  'KILL CAM FEATURE IMPROVED',
  '<span class="text-green-500">STABLE:</span> PING TIMES OPTIMIZED GLOBALLY',
  'NEW OPERATOR CLASS: TACTICIAN',
  '<span class="text-red-500">WARNING:</span> FIREWALL BREACH ATTEMPT NEUTRALIZED',
  'COMMUNITY SKIN DESIGN CONTEST WINNERS ANNOUNCED',
  'PROFILE CUSTOMIZATION OPTIONS EXPANDED',
  '<span class="text-cyan-400">BROADCAST:</span> LIVE DEV STREAM IN 1 HOUR',
  'WEEKLY CHALLENGES: 15 NEW OBJECTIVES',
  // AI & Tech Industry News
  '<span class="text-cyan-400">AI NEWS:</span> NVIDIA RTX 5090 GPU ANNOUNCED WITH 24GB VRAM',
  '<span class="text-green-500">BREAKTHROUGH:</span> GPT-5 ACHIEVES 99% ACCURACY ON CODING TASKS',
  'PYTORCH 2.5 RELEASED WITH MAJOR PERFORMANCE IMPROVEMENTS',
  '<span class="text-yellow-500">TRENDING:</span> DEEPMIND SOLVES PROTEIN FOLDING CHALLENGE',
  '<span class="text-cyan-400">TECH:</span> TENSORFLOW 3.0 BETA NOW AVAILABLE',
  'OPENAI RELEASES NEW MULTIMODAL AI MODEL',
  '<span class="text-green-500">SUCCESS:</span> META LLAMA 4 OPEN-SOURCE MODEL LAUNCHED',
  '<span class="text-red-500">ALERT:</span> CRITICAL VULNERABILITY IN OPENCV PATCHED',
  'NVIDIA H100 GPUS NOW AVAILABLE FOR CLOUD COMPUTING',
  '<span class="text-cyan-400">RESEARCH:</span> NEW TRANSFORMER ARCHITECTURE 40% FASTER',
  'GOOGLE GEMINI 2.0 BEATS BENCHMARKS ACROSS THE BOARD',
  '<span class="text-yellow-500">MILESTONE:</span> AI AGENT PASSES SOFTWARE ENGINEER INTERVIEW',
  'ANTHROPIC CLAUDE 4 SUPPORTS 500K TOKEN CONTEXT WINDOW',
  '<span class="text-green-500">LAUNCH:</span> HUGGING FACE ADDS 100K NEW ML MODELS',
  'STABILITY AI RELEASES STABLE DIFFUSION XL 2.0',
  '<span class="text-cyan-400">UPDATE:</span> JUPYTER NOTEBOOK 8.0 WITH AI AUTOCOMPLETE',
  '<span class="text-red-500">WARNING:</span> AI MODEL TRAINING COSTS UP 200%',
  'MICROSOFT COPILOT INTEGRATION IN VS CODE ENHANCED',
  '<span class="text-yellow-500">ACHIEVEMENT:</span> AI DISCOVERS NEW ANTIBIOTICS',
  'KAGGLE ANNOUNCES $1M PRIZE FOR AI COMPETITION',
  '<span class="text-green-500">ONLINE:</span> GITHUB COPILOT NOW SUPPORTS 25 LANGUAGES',
  'NVIDIA CUDA 13.0 TOOLKIT RELEASED',
  '<span class="text-cyan-400">ANNOUNCEMENT:</span> AWS LAUNCHES NEW AI CHIP TRAINIUM2',
  '<span class="text-red-500">CRITICAL:</span> MEMORY LEAK IN SCIKIT-LEARN FIXED',
  'APPLE SILICON M4 CHIP WITH NEURAL ENGINE REVEALED',
  '<span class="text-yellow-500">BREAKTHROUGH:</span> QUANTUM ML ALGORITHM 1000X FASTER',
  'DOCKER ADDS NATIVE GPU SUPPORT FOR ML WORKLOADS',
  '<span class="text-green-500">SUCCESS:</span> COMPUTER VISION MODEL BEATS HUMAN ACCURACY',
  'OPENCV 5.0 WITH DEEP LEARNING MODULE RELEASED',
  '<span class="text-cyan-400">NEWS:</span> TESLA AI DAY REVEALS DOJO SUPERCOMPUTER SPECS',
  '<span class="text-red-500">ALERT:</span> BACKDOOR FOUND IN POPULAR ML LIBRARY',
  'RUST-BASED ML FRAMEWORK POLARS GAINS TRACTION',
  '<span class="text-yellow-500">TRENDING:</span> AI WRITES ENTIRE CODEBASE IN MINUTES',
  'DATABRICKS ACQUIRES AI STARTUP FOR $1.3 BILLION',
  '<span class="text-green-500">OPERATIONAL:</span> COLAB PRO+ NOW OFFERS A100 GPUS',
  'WEIGHTS & BIASES ADDS REAL-TIME MODEL MONITORING',
  '<span class="text-cyan-400">RESEARCH:</span> MIT DEVELOPS ENERGY-EFFICIENT AI CHIP',
  '<span class="text-red-500">WARNING:</span> ADVERSARIAL ATTACKS ON CV MODELS INCREASE',
  'KUBERNETES 1.30 OPTIMIZED FOR ML WORKLOADS',
  '<span class="text-yellow-500">INNOVATION:</span> BRAIN-COMPUTER INTERFACE READS CODE INTENT',
  'NVIDIA ANNOUNCES DGX H200 SUPERCOMPUTER SYSTEM',
  '<span class="text-green-500">LAUNCH:</span> LANGCHAIN 2.0 FRAMEWORK FOR LLM APPS',
  'INTEL GAUDI3 AI ACCELERATOR CHALLENGES NVIDIA',
  '<span class="text-cyan-400">UPDATE:</span> PANDAS 3.0 WITH GPU ACCELERATION',
  '<span class="text-red-500">SECURITY:</span> AI JAILBREAK VULNERABILITIES DISCOVERED',
  'SALESFORCE RELEASES CODEGEN 3.0 FOR DEVELOPERS',
  '<span class="text-yellow-500">MILESTONE:</span> 100 TRILLION PARAMETER MODEL TRAINED',
  'RAY 3.0 DISTRIBUTED COMPUTING FRAMEWORK RELEASED',
  '<span class="text-green-500">ACTIVE:</span> AUTOGPT AGENTS NOW WRITE PRODUCTION CODE',
  'NVIDIA JETSON ORIN NANO FOR EDGE AI AVAILABLE',
  '<span class="text-cyan-400">ANNOUNCEMENT:</span> GOOGLE RELEASES PALM 3 API',
  '<span class="text-red-500">CRITICAL:</span> DATA POISONING ATTACK DETECTED',
  'AMD MI300X GPU TARGETS AI TRAINING WORKLOADS',
  '<span class="text-yellow-500">ACHIEVEMENT:</span> AI SOLVES MATH OLYMPIAD PROBLEMS',
  'VECTOR DATABASE PINECONE RAISES $100M SERIES B',
];

export default function LoginPage() {
  const router = useRouter();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [eggClicks, setEggClicks] = useState(0);
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newsFeed, setNewsFeed] = useState('');
  const [pythonQuote, setPythonQuote] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Preload all images with minimum delay to ensure background is visible
    const imageUrls = [
      '/assets/ui/ENV-2.png',
      '/assets/ui/transperent.png',
      '/assets/characters/nila (2).png',
      '/assets/characters/Astro.png',
      '/assets/characters/Kenji_2.png',
      '/assets/characters/Leo.png'
    ];

    let loadedCount = 0;
    const totalImages = imageUrls.length;
    const startTime = Date.now();
    const minDelay = 50; // Minimum 50ms to show background only

    const checkAndSetLoaded = () => {
      if (loadedCount === totalImages) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          setImagesLoaded(true);
        }, remaining);
      }
    };

    imageUrls.forEach((url) => {
      const img = new window.Image();
      img.onload = () => {
        loadedCount++;
        checkAndSetLoaded();
      };
      img.onerror = () => {
        loadedCount++;
        checkAndSetLoaded();
      };
      img.src = url;
    });
  }, []);

  useEffect(() => {
    // Generate random news feed on mount - each user sees different messages
    const shuffled = [...NEWS_MESSAGES].sort(() => Math.random() - 0.5);
    const selectedMessages = shuffled.slice(0, 10); // Pick 10 random messages
    const feedText = selectedMessages.map(msg => `// ${msg}`).join(' // ');
    setNewsFeed(feedText);
  }, []);

  useEffect(() => {
    // Set initial random quote
    const randomQuote = PYTHON_QUOTES[Math.floor(Math.random() * PYTHON_QUOTES.length)];
    setPythonQuote(randomQuote);

    // Change quote every 8 seconds
    const quoteInterval = setInterval(() => {
      const newQuote = PYTHON_QUOTES[Math.floor(Math.random() * PYTHON_QUOTES.length)];
      setPythonQuote(newQuote);
    }, 8000);

    return () => clearInterval(quoteInterval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSelectionMode(true);
    document.body.classList.add('selection-mode');
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleLockIn = () => {
    if (!selectedAgent) return;

    // Store selected agent
    localStorage.setItem('selectedAgent', selectedAgent);
    localStorage.setItem('isAuthenticated', 'true');

    // Redirect to boot screen
    setTimeout(() => {
      router.push('/boot');
    }, 100);
  };

  const triggerEasterEgg = () => {
    const newClicks = eggClicks + 1;
    setEggClicks(newClicks);
    if (newClicks === 3) {
      setShowDevConsole(true);
      setTimeout(() => {
        setShowDevConsole(false);
        setEggClicks(0);
      }, 5000);
    }
  };

  return (
    <>
      <div id="app-root" className="w-full h-full overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden bg-slate-200">
          <Image
            src="/assets/ui/ENV-2.png"
            alt="Background"
            fill
            className="object-cover opacity-150"
            priority
            sizes="100vw"
            style={{ objectPosition: 'center' }}
          />
          <div className="noise-grain" />
          <div className="scanlines absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-white/20" />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(30, 41, 59, 0.2) 100%)'
            }}
          />
        </div>

        {/* UI Layout */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between">
          {/* Top Bar */}
          <div
            className="h-14 w-full flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 relative"
            style={{
              opacity: imagesLoaded ? 1 : 0,
              visibility: imagesLoaded ? 'visible' : 'hidden',
              transition: 'opacity 0.15s ease, visibility 0.15s ease',
              transitionDelay: imagesLoaded ? '0s' : '0s'
            }}
          >
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse opacity-60" />

            {/* Left: Logo */}
            <div className="flex items-center gap-4">
              <h1 className="font-header text-xl tracking-[0.2em] font-bold text-slate-800 uppercase">
                Project: <span className="text-blue-600">Nova</span>
              </h1>
            </div>

            {/* Left: Python Mission Quote Badge */}
            <div className="hidden md:flex items-center justify-center flex-1 ml-8">
              <div className="learning-badge-container">
                <div className="learning-badge">
                  <div className="learning-badge-corner top-left"></div>
                  <div className="learning-badge-corner top-right"></div>
                  <div className="learning-badge-corner bottom-left"></div>
                  <div className="learning-badge-corner bottom-right"></div>
                  <div className="learning-badge-content">
                    <span className="font-header text-sm tracking-[0.15em] font-bold text-slate-700 uppercase leading-relaxed quote-text">
                      {pythonQuote}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Time */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-cyan-600 flex items-center justify-end gap-1">
                    ENCRYPTION: ACTIVE
                  </div>
                  <div className="font-tech text-lg font-bold text-slate-700 flex items-center gap-[2px]">
                    {currentTime.split(':').map((part, i) => (
                      <span key={i}>
                        {part}
                        {i < 2 && <span className="animate-pulse">:</span>}
                      </span>
                    ))}
                    <span className="text-cyan-600 ml-1">ZULU</span>
                  </div>
                </div>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-cyan-50 transition-all duration-300 sound-button"
              >
                <div className="absolute inset-0 rounded-full border-2 border-blue-400 sound-ring" />
                <div className="relative z-10">
                  {soundEnabled ? (
                    <svg className="w-4 h-4 text-slate-700 group-hover:text-cyan-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 010 7.778.75.75 0 001.06 1.06 7 7 0 000-9.899z"/>
                      <path d="M13.829 7.172a.75.75 0 00-1.061 1.06 2.5 2.5 0 010 3.536.75.75 0 001.06 1.06 4 4 0 000-5.656z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75z"/>
                      <path d="M12.22 5.22a.75.75 0 011.06 0l2 2 2-2a.75.75 0 111.06 1.06l-2 2 2 2a.75.75 0 11-1.06 1.06l-2-2-2 2a.75.75 0 01-1.06-1.06l2-2-2-2a.75.75 0 010-1.06z"/>
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Dev Console (Easter Egg) */}
          {showDevConsole && (
            <div className="dev-console">
              <div className="font-mono text-green-500 text-xs">
                <div className="mb-2 border-b border-green-500/30 pb-1 font-bold">
                  /// DEV_CONSOLE // BETA ACCESS ///
                </div>
                <div className="opacity-70">&gt; SYSTEM_CHECK... OK</div>
                <div className="opacity-70">
                  &gt; UNLOCK_ALL... <span className="text-red-500">ACCESS DENIED</span>
                </div>
                <div className="opacity-70">
                  &gt; GOD_MODE... <span className="text-red-500">ACCESS DENIED</span>
                </div>
                <div className="opacity-70">
                  &gt; NOCLIP... <span className="text-red-500">ACCESS DENIED</span>
                </div>
                <div className="mt-2 text-green-400 animate-pulse">_</div>
              </div>
            </div>
          )}

          {/* Main Split */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <div
              className={`${isSelectionMode ? 'w-0 opacity-0 overflow-hidden' : 'w-[30%]'} h-full relative z-10 transition-all duration-800 overflow-hidden`}
              style={{ clipPath: 'inset(0)', contain: 'layout paint' }}
            >
              <div
                className={`sidebar-panel w-full h-full flex flex-col px-12 py-10 ${imagesLoaded ? 'sidebar-slide-in' : 'sidebar-hidden'}`}
              >
                <div
                  className="sidebar-content"
                  style={{
                    opacity: imagesLoaded ? 1 : 0,
                    visibility: imagesLoaded ? 'visible' : 'hidden'
                  }}
                >
                  {/* Header */}
                  <div className="mb-20">
                    <div className="mb-20 ">
                      <Image
                        src="/assets/ui/transperent.png"
                        alt="Logo"
                        width={120}
                        height={120}
                        className="h-30 w-auto object-contain logo-burn"
                        unoptimized
                        priority
                      />
                    </div>

                    {/* Operation Title */}
                    <div className="border-l-4 border-blue-600 pl-4">
                      <div className="font-header text-5xl leading-[0.85] text-slate-900 uppercase glitch-hover cursor-default">
                        CODE<br />
                        <span className="text-blue-600">OPS</span>
                      </div>
                      {/* <div className="mt-2 text-[10px] font-mono text-cyan-600 tracking-[0.25em]">
                        SECURE TERMINAL ACCESS V10.7
                      </div> */}
                    </div>
                  </div>

                  {/* Login Form */}
                  <form className="w-full space-y-4" onSubmit={handleLogin}>
                    <div className="mb-3 font-mono text-cyan-600 text-xs tracking-widest border-b border-cyan-500/30 pb-2">
                      // LOGIN_TERMINAL
                    </div>

                    {/* Username */}
                    <div className="group">
                      <label className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <span>Identification</span>
                        <span className="w-1/2 h-[1px] bg-slate-500 self-center" />
                      </label>
                      <div className="relative">
                        <input
                          className="input-cli pl-3 text-sm py-2"
                          type="text"
                          defaultValue="SPECTRE_01"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="group">
                      <label className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <span>Access Key</span>
                        <span className="w-1/2 h-[1px] bg-slate-500 self-center" />
                      </label>
                      <div className="relative">
                        <input
                          className="input-cli pl-3 text-sm py-2"
                          type="password"
                          defaultValue="password123"
                        />
                      </div>
                    </div>

                    {/* Button */}
                    <button className="btn-skew w-full h-11 mt-4 group relative overflow-hidden" type="submit">
                      <span className="font-mono text-base uppercase tracking-widest text-slate-800 font-bold flex items-center justify-center gap-2">
                        Initiate_Session
                      </span>
                    </button>
                  </form>

                  {/* Developed By Section */}
                  <div className="mt-auto pt-20 border-t border-slate-300/40">
                    <div className="flex flex-col items-center gap-0">
                      <span className="text-base font-mono uppercase tracking-[0.15em] font-bold">Developed by</span>
                      <div className="w-full flex justify-center -mt-8">
                        <Image
                          src="/assets/ui/LOF_SVG.svg"
                          alt="LOF Logo"
                          width={140}
                          height={140}
                          className="h-28 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Background Card or Character Cards */}
            {!isSelectionMode ? (
              <div
                className="flex-1 h-full relative z-20"
                style={{
                  opacity: imagesLoaded ? 1 : 0,
                  visibility: imagesLoaded ? 'visible' : 'hidden',
                  transition: 'opacity 0.3s ease',
                  transitionDelay: imagesLoaded ? '0.2s' : '0s'
                }}
              >
                <div className="w-full h-full relative overflow-hidden">
                  <Image
                    src="/assets/ui/background.png"
                    alt="Background Card"
                    fill
                    className="object-cover"
                    priority
                    sizes="70vw"
                  />
                </div>
              </div>
            ) : (
              <div
                className="flex-1 h-full flex bg-black/50 z-20"
                style={{
                  opacity: imagesLoaded ? 1 : 0,
                  visibility: imagesLoaded ? 'visible' : 'hidden',
                  transform: imagesLoaded ? 'scale(1)' : 'scale(0.95)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDelay: imagesLoaded ? '0s' : '0s'
                }}
              >
                {/* Nila */}
                <div
                  className={`squad-card ${selectedAgent === 'jett' ? 'selected' : ''}`}
                  onClick={isSelectionMode ? () => handleAgentSelect('jett') : undefined}
                >
                  <Image
                    src="/assets/characters/nila (2).png"
                    alt="Nila"
                    fill
                    className="opacity-90 object-cover object-top"
                    priority
                    sizes="25vw"
                  />
                  <div className="card-info-overlay">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400 font-bold tracking-widest text-xs">TECH WIZARD</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-wide mb-2 text-white uppercase">Nila</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">GLITCH HUNTER</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">SENSOR SIGHT</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">AIR CODING</span>
                    </div>
                    <div className="card-stats-expanded">
                      <p className="text-xs text-gray-400 leading-relaxed mb-3 border-l-2 border-blue-400/50 pl-2">
                        Elite Tech Wizard who bends code into reality.
                      </p>
                      <div className="space-y-1.5">
                        <StatBar label="OFF" value={90} color="green" />
                        <StatBar label="DEF" value={40} color="green" />
                        <StatBar label="UTL" value={60} color="green" />
                      </div>
                    </div>
                  </div>
                  <SelectionIndicator />
                </div>

                {/* Astra */}
                <div
                  className={`squad-card ${selectedAgent === 'omen' ? 'selected' : ''}`}
                  onClick={isSelectionMode ? () => handleAgentSelect('omen') : undefined}
                >
                  <Image
                    src="/assets/characters/Astro.png"
                    alt="Astra"
                    fill
                    className="opacity-90 object-cover object-top"
                    priority
                    sizes="25vw"
                  />
                  <div className="card-info-overlay">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-cyan-400 font-bold tracking-widest text-xs">AI AGENT</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-wide mb-2 text-white uppercase">ASTRA</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">MOBILITY</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">MEMORY SYNC</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">PROJECTION MODE</span>
                    </div>
                    <div className="card-stats-expanded">
                      <p className="text-xs text-gray-400 leading-relaxed mb-3 border-l-2 border-purple-400/50 pl-2">
                        Empathetic AI guide who teaches, protects, and empowers the team.
                      </p>
                      <div className="space-y-1.5">
                        <StatBar label="OFF" value={50} color="cyan" />
                        <StatBar label="DEF" value={70} color="cyan" />
                        <StatBar label="UTL" value={85} color="cyan" />
                      </div>
                    </div>
                  </div>
                  <SelectionIndicator />
                </div>

                {/* Kenji */}
                <div
                  className={`squad-card ${selectedAgent === 'yoru' ? 'selected' : ''}`}
                  onClick={isSelectionMode ? () => handleAgentSelect('yoru') : undefined}
                >
                  <Image
                    src="/assets/characters/Kenji_2.png"
                    alt="Kenji"
                    fill
                    className="opacity-90 object-cover object-top"
                    priority
                    sizes="25vw"
                  />
                  <div className="card-info-overlay">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-400 font-bold tracking-widest text-xs">JUNIOR ENGINEER</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-wide mb-2 text-white uppercase">Kenji</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">RAPID FAB</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">SCHEMATIC SCAN</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">OVERCLOCK</span>
                    </div>
                    <div className="card-stats-expanded">
                      <p className="text-xs text-gray-400 leading-relaxed mb-3 border-l-2 border-cyan-400/50 pl-2">
                        Genius junior engineer who turns scrap into solutions in seconds.
                      </p>
                      <div className="space-y-1.5">
                        <StatBar label="OFF" value={85} color="orange" />
                        <StatBar label="DEF" value={45} color="orange" />
                        <StatBar label="UTL" value={70} color="orange" />
                      </div>
                    </div>
                  </div>
                  <SelectionIndicator />
                </div>

                {/* Leo */}
                <div
                  className={`squad-card ${selectedAgent === 'phoenix' ? 'selected' : ''}`}
                  onClick={isSelectionMode ? () => handleAgentSelect('phoenix') : undefined}
                >
                  <Image
                    src="/assets/characters/Leo.png"
                    alt="Leo"
                    fill
                    className="opacity-90 object-cover object-top"
                    priority
                    sizes="25vw"
                  />
                  <div className="card-info-overlay">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-400 font-bold tracking-widest text-xs">MISSION CAPTAIN</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-wide mb-2 text-white uppercase">Leo</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">LOGIC LOCK</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">HOLO FIREWALL</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-white/20 rounded bg-white/5 text-gray-300 font-mono">ROOT VOICE</span>
                    </div>
                    <div className="card-stats-expanded">
                      <p className="text-xs text-gray-400 leading-relaxed mb-3 border-l-2 border-orange-400/50 pl-2">
                       Calm Mission Captain who controls chaos with logic and command.
                      </p>
                      <div className="space-y-1.5">
                        <StatBar label="OFF" value={80} color="purple" />
                        <StatBar label="DEF" value={55} color="purple" />
                        <StatBar label="UTL" value={65} color="purple" />
                      </div>
                    </div>
                  </div>
                  <SelectionIndicator />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar - Selection */}
          {isSelectionMode && (
            <div
              className="bottom-bar-selection"
              style={{
                opacity: imagesLoaded ? 1 : 0,
                visibility: imagesLoaded ? 'visible' : 'hidden',
                transform: imagesLoaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.2s ease',
                transitionDelay: imagesLoaded ? '0.3s' : '0s'
              }}
            >
              <div className="w-1/3 px-6 flex items-center border-r border-slate-300 h-full bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">CLICK TO SELECT</span>
                </div>
              </div>

              <div className="w-1/3 flex items-center justify-center h-full px-4 relative bg-white">
                <div className="absolute inset-0 bg-blue-100 skew-x-[-8deg] opacity-30 mx-8" />
                <button
                  className={`btn-skew h-9 w-full max-w-sm ${!selectedAgent ? 'opacity-40' : 'btn-enabled'}`}
                  disabled={!selectedAgent}
                  onClick={handleLockIn}
                >
                  <span className="font-header text-base uppercase tracking-widest flex items-center justify-center gap-2 text-slate-800">
                    Lock In Agent
                  </span>
                </button>
              </div>

              <div className="w-1/3 px-6 flex items-center justify-end h-full bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Shadowburn Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Ticker */}
          {!isSelectionMode && (
            <div
              className="h-12 w-full bg-slate-900 border-t border-slate-700 flex items-center z-50"
              style={{
                opacity: imagesLoaded ? 1 : 0,
                visibility: imagesLoaded ? 'visible' : 'hidden',
                transform: imagesLoaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.2s ease',
                transitionDelay: imagesLoaded ? '0.3s' : '0s'
              }}
            >
              <div className="flex items-center gap-3 px-6 h-full border-r border-slate-700 bg-slate-800">
                <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
                <div className="font-mono text-[10px] text-slate-400">NEWS FEED: ORBITAL_CHANNEL</div>
              </div>

              <div className="flex-1 overflow-hidden relative flex items-center bg-slate-950">
                <div
                  className="ticker font-mono text-xs text-slate-400"
                  dangerouslySetInnerHTML={{ __html: newsFeed }}
                />
              </div>

              <div className="px-6 flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>MATCHMAKING: <span className="text-slate-300">IDLE</span></span>
                <span>VOICE_COMMS: <span className="text-green-500">SECURE</span></span>
                <span>ANTI-CHEAT: <span className="text-blue-500">ONLINE</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Rajdhani:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap');

        :root {
          --ease-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        body {
          font-family: 'Rajdhani', sans-serif;
          overflow: hidden;
          height: 100vh;
          width: 100vw;
          margin: 0;
          padding: 0;
        }

        .font-header { font-family: 'Oswald', sans-serif; }
        .font-tech { font-family: 'Rajdhani', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        .scanlines {
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.02));
          background-size: 100% 4px;
          pointer-events: none;
        }

        .noise-grain {
          display: none;
        }
        @keyframes sidebar-slide-in {
          0% {
            transform: translateX(-100%);
            opacity: 0;
            visibility: visible;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
            visibility: visible;
          }
        }

        .sidebar-panel {
          background: rgba(255, 255, 255, 0.92);
          border-right: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 6px 0 30px rgba(0, 0, 0, 0.08);
          width: 100%;
        }

        .sidebar-hidden {
          opacity: 0 !important;
          visibility: hidden !important;
          transform: translateX(-100%) !important;
          pointer-events: none !important;
        }

        .sidebar-hidden .sidebar-content {
          display: none !important;
        }

        .sidebar-slide-in {
          animation: sidebar-slide-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .sidebar-slide-in .sidebar-content {
          display: flex !important;
          flex-direction: column !important;
        }

        .sidebar-panel > * {
          width: 100%;
        }

        .sidebar-panel .sidebar-content {
          width: 100%;
        }

        .logo-burn {
          filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.8))
            drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))
            drop-shadow(0 0 30px rgba(96, 165, 250, 0.4));
          animation: burn-glow 2s ease-in-out infinite;
        }

        @keyframes burn-glow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.8))
              drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))
              drop-shadow(0 0 30px rgba(96, 165, 250, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(37, 99, 235, 1))
              drop-shadow(0 0 40px rgba(59, 130, 246, 0.8))
              drop-shadow(0 0 60px rgba(96, 165, 250, 0.6));
          }
        }

        .input-cli {
          background: transparent;
          border: none;
          border-bottom: 2px solid #94a3b8;
          color: #1e293b;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.1rem;
          width: 100%;
          padding: 0.5rem 0;
          transition: all 0.3s var(--ease-quart);
        }

        .input-cli:focus {
          outline: none;
          border-bottom-color: #3b82f6;
          border-bottom-width: 3px;
          box-shadow: 0 4px 10px -5px rgba(59, 130, 246, 0.2);
        }

        .btn-skew {
          transform: skewX(-12deg);
          transition: all 0.1s ease-out;
          background: white;
          border: 1px solid #bfdbfe;
          color: #0f172a;
        }

        .btn-skew > span {
          transform: skewX(12deg);
          display: block;
        }

        .btn-skew:hover:not(:disabled) {
          background: #06b6d4;
          border-color: #06b6d4;
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.3);
        }

        .btn-skew.btn-enabled {
          background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
          border: 2px solid #3b82f6 !important;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.6) !important;
          animation: pulse-glow 2s ease-in-out infinite !important;
        }

        .btn-skew.btn-enabled > span {
          color: white !important;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
          50% { box-shadow: 0 0 50px rgba(59, 130, 246, 0.9); }
        }

        .squad-card {
          position: relative;
          flex: 1;
          height: 100%;
          overflow: hidden;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.4s var(--ease-quart);
          cursor: pointer;
        }

        .squad-card:first-child {
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        body.selection-mode .squad-card:first-child {
          margin-left: 0 !important;
          clip-path: none !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        body.selection-mode .squad-card:first-child img {
          transform: none !important;
          width: 100% !important;
        }

        .squad-card:hover {
          flex: 1.5;
          border-left: 1px solid #3b82f6;
        }

        .squad-card:first-child:hover {
          border-left: none !important;
        }

        .card-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1.5rem;
          z-index: 20;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.95), transparent);
          transition: all 0.4s ease;
          pointer-events: none;
        }

        body.selection-mode .squad-card:hover .card-info-overlay {
          bottom: 60px;
          padding: 2rem 1.5rem;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.98) 60%, rgba(0, 0, 0, 0.7), transparent);
        }

        body.selection-mode .squad-card.selected .card-info-overlay {
          bottom: 60px;
          padding: 2rem 1.5rem;
        }

        .card-stats-expanded {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, opacity 0.3s ease, margin-top 0.4s ease;
        }

        body.selection-mode .squad-card:hover .card-stats-expanded {
          max-height: 200px;
          opacity: 1;
          margin-top: 0.5rem;
        }

        body.selection-mode .squad-card.selected .card-stats-expanded {
          max-height: 200px;
          opacity: 1;
          margin-top: 0.5rem;
        }

        .selection-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 2px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 40px rgba(255, 255, 255, 0.4), inset 0 0 40px rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 100;
          overflow: hidden;
        }

        .selection-indicator::before {
          content: "";
          position: absolute;
          top: -100%;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% { top: -100%; }
          100% { top: 100%; }
        }

        .squad-card.selected .selection-indicator {
          opacity: 1;
        }

        .bottom-bar-selection {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50px;
          background: #ffffff;
          border-top: 2px solid #e2e8f0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: row;
          align-items: center;
          z-index: 1000;
        }

        .ticker {
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .dev-console {
          position: absolute;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10b981;
          backdrop-filter: blur(10px);
          padding: 1rem;
          z-index: 60;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .sound-button {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }

        .sound-button:hover {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }

        .sound-ring {
          animation: ring-shine 3s linear infinite;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5),
                      inset 0 0 10px rgba(59, 130, 246, 0.3);
        }

        @keyframes ring-shine {
          0% {
            border-color: #3b82f6;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5),
                        inset 0 0 10px rgba(59, 130, 246, 0.3);
          }
          50% {
            border-color: #60a5fa;
            box-shadow: 0 0 20px rgba(96, 165, 250, 0.8),
                        inset 0 0 15px rgba(96, 165, 250, 0.5);
          }
          100% {
            border-color: #3b82f6;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5),
                        inset 0 0 10px rgba(59, 130, 246, 0.3);
          }
        }

        .metallic-text {
          background: linear-gradient(90deg,
            #475569 0%,
            #64748b 20%,
            #94a3b8 35%,
            #cbd5e1 45%,
            #f1f5f9 50%,
            #cbd5e1 55%,
            #94a3b8 65%,
            #64748b 80%,
            #475569 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: metallic-shine 4s linear infinite;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))
                  drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
          position: relative;
        }

        @keyframes metallic-shine {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 300% center;
          }
        }

        .learning-badge-container {
          position: relative;
          padding: 2px;
          max-width: 600px;
          width: 100%;
        }

        .learning-badge {
          position: relative;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.05));
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 6px 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2),
                      inset 0 0 20px rgba(59, 130, 246, 0.1);
        }

        .learning-badge-content {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 20px;
        }

        .quote-text {
          transition: opacity 0.5s ease-in-out;
          animation: quote-fade 8s infinite;
        }

        @keyframes quote-fade {
          0%, 90% {
            opacity: 1;
          }
          95%, 100% {
            opacity: 0.3;
          }
        }

        .learning-badge-corner {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 2px solid #3b82f6;
        }

        .learning-badge-corner.top-left {
          top: -1px;
          left: -1px;
          border-right: none;
          border-bottom: none;
        }

        .learning-badge-corner.top-right {
          top: -1px;
          right: -1px;
          border-left: none;
          border-bottom: none;
        }

        .learning-badge-corner.bottom-left {
          bottom: -1px;
          left: -1px;
          border-right: none;
          border-top: none;
        }

        .learning-badge-corner.bottom-right {
          bottom: -1px;
          right: -1px;
          border-left: none;
          border-top: none;
        }

        .learning-badge {
          animation: badge-glow 3s ease-in-out infinite;
        }

        @keyframes badge-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.2),
                        inset 0 0 20px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.4),
                        inset 0 0 30px rgba(59, 130, 246, 0.2);
          }
        }
      `}</style>
    </>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    cyan: 'bg-cyan-400',
    orange: 'bg-orange-400',
    green: 'bg-green-400'
  };

  return (
    <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest">
      <span className="w-8 text-gray-400">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-sm overflow-hidden">
        <div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses]} shadow-[0_0_10px_currentColor]`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SelectionIndicator() {
  return (
    <div className="selection-indicator">
      <div className="text-6xl">✓</div>
      <div className="text-sm font-mono tracking-widest mt-2">AGENT LOCKED</div>
    </div>
  );
}
