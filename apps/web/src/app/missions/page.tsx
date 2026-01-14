'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  Satellite,
  Radio,
  Cpu,
  Lock,
  CheckCircle,
  Play,
  Star,
  Target,
  Zap,
  ArrowRight,
  Globe,
  Trophy,
  Crosshair
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useProgress } from '@/lib/utilities/progress';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { usePageAudio } from '@/hooks/usePageAudio';

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  detailedDescription: string;
  icon: any;
  status: 'completed' | 'current' | 'locked';
  glowColor: string;
  progress: number;
  skills: string[];
  challenge: string;
  href: string;
}

export default function MissionsPage() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameDisabled, setGameDisabled] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementShown, setAchievementShown] = useState(false);
  const gameRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progress = useProgress();
  const { playProjectTextSound } = useGlobalAudio();

  // Use the new page audio hook for smooth transitions
  usePageAudio({ audioType: 'mission' });

  useEffect(() => {
    setMounted(true);
    initializeRetroFlightGame();

    return () => {
      if (gameRef.current?.cleanup) {
        gameRef.current.cleanup();
      }
    };
  }, []);

  // Check for achievement
  useEffect(() => {
    if (gameScore >= 50 && !achievementShown) {
      setShowAchievement(true);
      setAchievementShown(true);
      setTimeout(() => setShowAchievement(false), 5000);
    }
  }, [gameScore, achievementShown]);

  // Fixed WebGL implementation with proper Three.js loading
  const initializeRetroFlightGame = async () => {
    try {
      // Dynamic import of Three.js
      const THREE = await import('three');
      setupRetroFlightScene(THREE);
    } catch (error) {
      console.error('Failed to load Three.js:', error);
      // Fallback to CSS-only background
      createCSSFallbackBackground();
    }
  };

  // CSS fallback background when Three.js fails to load
  const createCSSFallbackBackground = () => {
    // Remove existing background
    const existing = document.getElementById('retro-flight-bg');
    if (existing) existing.remove();

    // Create container
    const container = document.createElement('div');
    container.id = 'retro-flight-bg';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      overflow: hidden;
      background: radial-gradient(ellipse at center, #1a0033 0%, #0a001a 70%, #000000 100%);
    `;

    // Create wireframe grid lines
    for (let i = 0; i < 20; i++) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, #9f40ff 50%, transparent 100%);
        bottom: ${-100 + i * 20}px;
        opacity: ${0.3 + (i * 0.03)};
        transform: perspective(500px) rotateX(85deg) translateZ(${i * 20}px);
        animation: moveGrid 3s linear infinite;
        animation-delay: ${i * 0.1}s;
      `;
      container.appendChild(line);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes moveGrid {
        0% { transform: perspective(500px) rotateX(85deg) translateZ(0px) translateY(0px); }
        100% { transform: perspective(500px) rotateX(85deg) translateZ(-1000px) translateY(800px); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
  };

  const setupRetroFlightScene = (THREE: any) => {
    try {

      // Remove existing canvas
      const existing = document.getElementById('retroFlightCanvas');
      if (existing) {
        existing.remove();
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.id = 'retroFlightCanvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.zIndex = '-1';
      canvas.style.pointerEvents = 'none';
      document.body.appendChild(canvas);

      // Purple color theme
      const purpleColor = 0x9f40ff;
      const commonColor = new THREE.Color(purpleColor);

      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.sortObjects = true;

      camera.position.set(0, 0, 300);
      camera.lookAt(scene.position);

      // Enhanced SimplexNoise replacement
      const createNoise = () => {
        const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
        const p = new Array(512);
        for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];

        const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
        const lerp = (t: number, a: number, b: number) => a + t * (b - a);
        const grad = (hash: number, x: number, y: number) => {
          const h = hash & 15;
          const u = h < 8 ? x : y;
          const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
          return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        };

        return {
          noise2D: (x: number, y: number) => {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            x -= Math.floor(x);
            y -= Math.floor(y);
            const u = fade(x);
            const v = fade(y);
            const A = p[X] + Y;
            const B = p[X + 1] + Y;
            return lerp(v, lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
                           lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1)));
          }
        };
      };

      const noise = createNoise();

      // Helper functions
      const addEase = (pos: any, to: any, ease: number) => {
        pos.x += (to.x - pos.x) / ease;
        pos.y += (to.y - pos.y) / ease;
        pos.z += (to.z - pos.z) / ease;
      };

      // Game objects
      const gameObjects = {
        mouse: { x: 0, y: 0 },
        shootingStars: [] as any[],
        shots: [] as any[]
      };

      // Main lighting
      const light = new THREE.PointLight(purpleColor, 4, 1000);
      light.position.set(0, 200, -500);
      scene.add(light);

      // Create wireframe ground with noise
      const createWireframeGround = () => {
        const groundGeometry = new THREE.PlaneGeometry(4000, 2000, 128, 64);
        const groundMaterial = new THREE.MeshLambertMaterial({
          color: purpleColor,
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2 + 0.5;
        ground.position.set(0, -300, -1000);

        // Add noise to ground with safety checks
        const positions = groundGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const z = positions[i + 2];
          if (!isNaN(x) && !isNaN(z)) {
            const noiseValue = noise.noise2D(x * 0.003, z * 0.003);
            if (!isNaN(noiseValue)) {
              positions[i + 1] = noiseValue * 30;
            } else {
              positions[i + 1] = 0; // Fallback if noise returns NaN
            }
          }
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeBoundingSphere();
        scene.add(ground);

        return {
          mesh: ground,
          geometry: groundGeometry,
          cycle: 0,
          update: () => {
            const positions = groundGeometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              const x = positions[i];
              const z = positions[i + 2];
              positions[i + 1] = noise.noise2D(x * 0.003, (z * 0.003) + gameObjects.cycle) * 30;
            }
            groundGeometry.attributes.position.needsUpdate = true;
            gameObjects.cycle += 0.01;
          }
        };
      };

      // Create star field
      const createStarField = () => {
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 400; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 8000;
          starVertices.push(
            Math.cos(angle) * radius,
            (Math.sin(angle) * radius) / 10 + 1200,
            Math.random() * -8000 - 1000
          );
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

        const starMaterial = new THREE.PointsMaterial({
          color: purpleColor,
          size: 64,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.8
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        return {
          mesh: stars,
          rotation: { y: 0, z: 0 },
          update: () => {
            stars.rotation.y += 0.001;
            stars.rotation.z += 0.001;
            // Parallax effect based on mouse
            stars.position.x = -gameObjects.mouse.x * 0.005;
          }
        };
      };

      // Create mountains
      const createMountains = () => {
        const mountainLayers = [];
        for (let layer = 0; layer < 3; layer++) {
          const mountainGeometry = new THREE.PlaneGeometry(10000, 1000, 128, 32);
          const mountainMaterial = new THREE.MeshPhongMaterial({
            color: purpleColor,
            transparent: true,
            opacity: 0.3 - layer * 0.1,
            side: THREE.BackSide
          });

          const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
          mountain.position.set(0, -500, -3500 - layer * 1000);
          mountain.rotation.x = (Math.PI / 2) + 1.35;

          // Add noise to mountains with safety checks
          const positions = mountainGeometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            if (!isNaN(x) && !isNaN(y)) {
              const noiseValue = noise.noise2D(x * 0.001, y * 0.001);
              if (!isNaN(noiseValue)) {
                positions[i + 2] = noiseValue * 500;
              } else {
                positions[i + 2] = 0; // Fallback if noise returns NaN
              }
            }
          }
          mountainGeometry.attributes.position.needsUpdate = true;
          mountainGeometry.computeBoundingSphere();

          scene.add(mountain);
          mountainLayers.push({
            mesh: mountain,
            geometry: mountainGeometry,
            cycle: 0,
            layer
          });
        }

        return {
          layers: mountainLayers,
          update: () => {
            mountainLayers.forEach(mountain => {
              const positions = mountain.geometry.attributes.position.array;
              for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                positions[i + 2] = noise.noise2D((x * 0.001), (y * 0.001) + mountain.cycle) * 500;
              }
              mountain.geometry.attributes.position.needsUpdate = true;
              mountain.cycle -= 0.0005;
              mountain.mesh.position.x = -gameObjects.mouse.x * 0.02;
            });
          }
        };
      };

      // Create spaceship
      const createSpaceship = () => {
        const shipGroup = new THREE.Group();

        const shipBody = new THREE.Mesh(
          new THREE.ConeGeometry(3, 15, 6),
          new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true })
        );
        shipBody.position.set(0, 0, 300);
        shipBody.rotation.x = Math.PI / 2;

        const cockpit = new THREE.Mesh(
          new THREE.SphereGeometry(2, 8, 8),
          new THREE.MeshPhongMaterial({ color: purpleColor, transparent: true, opacity: 0.7 })
        );
        cockpit.position.set(0, 1.5, 295);

        shipGroup.add(shipBody);
        shipGroup.add(cockpit);
        shipGroup.position.set(0, 0, -40);

        scene.add(shipGroup);

        const ship = {
          group: shipGroup,
          targetPos: { x: 0, y: 0, z: -40 },
          targetRot: { x: 0, y: 0, z: 0 },
          update: function() {
            this.targetPos.x = gameObjects.mouse.x * 0.05;
            this.targetPos.y = -gameObjects.mouse.y * 0.04 - 4;
            this.targetRot.z = gameObjects.mouse.x * 0.0004;

            addEase(shipGroup.position, this.targetPos, 12);
            addEase(shipGroup.rotation, this.targetRot, 12);
          }
        };

        return ship;
      };

      // Create game objects
      const wireframeGround = createWireframeGround();
      const starField = createStarField();
      const mountains = createMountains();
      const spaceship = createSpaceship();

      // Event handlers
      const handleMouseMove = (e: MouseEvent) => {
        if (!gameDisabled) {
          gameObjects.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          gameObjects.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
          gameObjects.mouse.x *= window.innerWidth / 2;
          gameObjects.mouse.y *= window.innerHeight / 2;
        }
      };

      const handleClick = () => {
        if (!gameDisabled) {
          // Create shot
          const shotGeometry = new THREE.CylinderGeometry(0.3, 0, 20, 10);
          const shotMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            transparent: true
          });

          const shot = new THREE.Mesh(shotGeometry, shotMaterial);
          shot.position.copy(spaceship.group.position);
          shot.position.z += 290;
          shot.rotation.set(Math.PI / 2, 0, 0);

          scene.add(shot);
          gameObjects.shots.push(shot);
          setGameScore(prev => prev + 1);
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (!gameDisabled) {
          let z = spaceship.targetPos.z;
          let d = z + (e.deltaY * 0.1);
          d = Math.max(-130, Math.min(-30, d));
          spaceship.targetPos.z = d;
        }
      };

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      // Add event listeners
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);
      window.addEventListener('wheel', handleWheel);
      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);

        // Create random shooting stars
        if (Math.random() > 0.99) {
          const starGeometry = new THREE.CylinderGeometry(0, 2, 120, 10);
          const starMaterial = new THREE.MeshBasicMaterial({
            color: purpleColor,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            transparent: true
          });

          const shootingStar = new THREE.Mesh(starGeometry, starMaterial);
          shootingStar.position.set(
            (Math.random() - 0.5) * 2000,
            300,
            200
          );
          shootingStar.rotation.set(Math.PI / 2, 0, 0);

          scene.add(shootingStar);
          gameObjects.shootingStars.push(shootingStar);
        }

        // Update shooting stars
        gameObjects.shootingStars.forEach((star, index) => {
          star.position.z -= 20;
          if (star.position.z < -3000) {
            scene.remove(star);
            gameObjects.shootingStars.splice(index, 1);
          }
        });

        // Update shots
        gameObjects.shots.forEach((shot, index) => {
          shot.position.z -= 12;
          if (shot.position.z < -300) {
            scene.remove(shot);
            gameObjects.shots.splice(index, 1);
          }
        });

        // Update all objects
        wireframeGround.update();
        starField.update();
        mountains.update();
        spaceship.update();

        renderer.render(scene, camera);
      };

      animate();

      // Store cleanup
      gameRef.current = {
        cleanup: () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('click', handleClick);
          window.removeEventListener('wheel', handleWheel);
          window.removeEventListener('resize', handleResize);
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }
      };

    } catch (error) {
      console.error('Error initializing retro flight game:', error);
      // Use CSS fallback on error
      createCSSFallbackBackground();
    }
  };

  const handleCardInteraction = (isHovering: boolean) => {
    setGameDisabled(isHovering);
  };

  const getChapterStatus = (chapterNumber: number, ageGroup: string = '11-14') => {
    if (!mounted) return { status: 'locked', progress: 0 };

    const chapterProgress = progress.getChapterProgress(ageGroup);
    const isCompleted = progress.isLevelCompleted(ageGroup, chapterNumber);
    const isUnlocked = progress.isLevelUnlocked(ageGroup, chapterNumber);

    if (isCompleted) {
      return { status: 'completed' as const, progress: 100 };
    } else if (isUnlocked) {
      const partialProgress = Math.min(50 + Math.random() * 30, 90);
      return { status: 'current' as const, progress: Math.round(partialProgress) };
    } else {
      return { status: 'locked' as const, progress: 0 };
    }
  };

  const chapters: Chapter[] = [
    {
      id: 1,
      title: "The Launch",
      subtitle: "Igniting the Spark",
      description: "Master the basics of Python communication with machines",
      detailedDescription: "In this opening chapter, you embark on your journey by mastering the very basics of Python. You learn to communicate with machines—displaying messages, capturing user input, and handling simple data types. These foundational skills are like the ignition system of your spacecraft, providing the initial power to launch your mission.",
      icon: Rocket,
      status: getChapterStatus(1).status,
      glowColor: 'neon-green',
      progress: getChapterStatus(1).progress,
      skills: ['Print statements', 'Input handling', 'Variables', 'Basic data types', 'String operations'],
      challenge: "Build a basic communication interface that establishes contact with the spacecraft's core computer",
      href: '/levels/11-14/1'
    },
    {
      id: 2,
      title: "Orbital Operations",
      subtitle: "Building the Control Systems",
      description: "Manage complex systems and data flows in space",
      detailedDescription: "Now safely in orbit, you face the task of managing complex systems and data flows. In this chapter, you delve into loops, lists, dictionaries, and other data structures. You learn how to organize and process the multitude of signals and sensor data coming from your spacecraft. This phase of training is critical for maintaining life support, navigation, and other vital systems while in orbit.",
      icon: Satellite,
      status: getChapterStatus(2).status,
      glowColor: 'neon-cyan',
      progress: getChapterStatus(2).progress,
      skills: ['Loops (for, while)', 'Lists and arrays', 'Dictionaries', 'Data processing', 'Control structures'],
      challenge: "Construct a control dashboard—a real-time display system that monitors the spacecraft's status",
      href: '/levels/11-14/2'
    },
    {
      id: 3,
      title: "Deep Space Communications",
      subtitle: "Mastering Functions and Modules",
      description: "Develop tools for processing interstellar data",
      detailedDescription: "Venturing into the deep reaches of space, communication becomes both more challenging and more essential. In this chapter, you develop your skills in writing reusable code by mastering functions, lambda expressions, and modules. You build tools that automate the processing of complex interstellar data—skills that are crucial for decoding alien signals and establishing reliable long-distance communication.",
      icon: Radio,
      status: getChapterStatus(3).status,
      glowColor: 'neon-purple',
      progress: getChapterStatus(3).progress,
      skills: ['Functions', 'Lambda expressions', 'Modules', 'Code reusability', 'Signal processing'],
      challenge: "Create a sophisticated command center that can process and interpret cosmic signals",
      href: '/levels/11-14/3'
    },
    {
      id: 4,
      title: "The Final Frontier",
      subtitle: "Commanding the Cosmos",
      description: "Design comprehensive systems for space command",
      detailedDescription: "In the climactic final chapter, you face the most advanced challenges. Here, you dive into object-oriented programming, file handling, and robust error management. These advanced skills allow you to design and build comprehensive systems that mirror the complexity of a fully operational spacecraft. Your training culminates in the development of the 'Galactic Command System'—a fully integrated application.",
      icon: Cpu,
      status: getChapterStatus(4).status,
      glowColor: 'neon-orange',
      progress: getChapterStatus(4).progress,
      skills: ['Object-oriented programming', 'File handling', 'Error management', 'System integration', 'Advanced algorithms'],
      challenge: "Develop the Galactic Command System—a fully integrated spacecraft management application",
      href: '/levels/11-14/4'
    }
  ];

  const getStatusIcon = (status: Chapter['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-neon-green" />;
      case 'current':
        return <Play className="w-5 h-5 text-neon-cyan animate-pulse" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Chapter['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-neon-green/20 text-neon-green border-neon-green/40">COMPLETED</Badge>;
      case 'current':
        return <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 animate-pulse">ACTIVE MISSION</Badge>;
      case 'locked':
        return <Badge className="bg-muted/20 text-muted-foreground border-muted/40">CLASSIFIED</Badge>;
    }
  };

  const getOverallProgress = () => {
    if (!mounted) return 0;

    const progress11_14 = progress.getChapterProgress('11-14');
    const progress15_18 = progress.getChapterProgress('15-18');

    const totalCompleted = progress11_14.completed + progress15_18.completed;
    const totalLevels = progress11_14.total + progress15_18.total;

    return totalLevels > 0 ? Math.round((totalCompleted / totalLevels) * 100) : 0;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background canvas will be created by initializeRetroFlightGame */}

      {/* Score Display */}
      <div className="fixed top-20 right-4 z-50">
        <div className="bg-purple-900/90 border border-purple-400/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Crosshair className="w-6 h-6 text-purple-400 animate-pulse" />
            <div>
              <div className="text-xs font-mono text-purple-300 uppercase">Pilot Score</div>
              <div className="text-2xl font-space font-bold text-purple-400">{gameScore}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-300">
            Click to fire • Mouse to steer • Scroll to accelerate
          </div>
        </div>
      </div>

      {/* Achievement Popup */}
      {showAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-xl border-2 border-purple-400 animate-bounce">
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-3xl font-space font-bold mb-2">EXCELLENT PILOT!</h2>
              <p className="text-lg">You've reached {gameScore} hits!</p>
              <p className="text-sm opacity-80 mt-2">You're ready for any galactic mission!</p>
            </div>
          </div>
        </div>
      )}

      {/* Semi-transparent overlay for content readability */}
      <div className="fixed inset-0 bg-black/20 pointer-events-none"></div>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 mb-6 glow-border">
            <Globe className="w-4 h-4 text-neon-cyan animate-spin" />
            <span className="text-sm font-space text-neon-cyan">GALACTIC CODE INITIATIVE</span>
            <Globe className="w-4 h-4 text-neon-cyan animate-spin" />
          </div>

          <h1 className="text-4xl md:text-6xl font-space font-black tracking-tight mb-4 neon-text">
            GALACTIC CODE QUEST
          </h1>
          <div className="text-lg md:text-xl font-space text-neon-purple mb-4 glow-text">
            Journey Through the Stars
          </div>
          <p className="text-base text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-6">
            In the not-too-distant future, Earth has embraced the cosmos, launching the "Galactic Code Initiative"—a
            mission that calls upon young coding cadets to harness the power of Python to explore, manage, and
            protect the vast expanse of space.
          </p>

          {/* Overall Progress */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-space text-muted-foreground">MISSION PROGRESS</span>
              <span className="text-sm font-mono text-neon-cyan">{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2 bg-space-gray/50" />
          </div>
        </div>

        {/* Chapter Timeline */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {chapters.map((chapter, index) => {
              const IconComponent = chapter.icon;
              const isClickable = chapter.status !== 'locked';

              return (
                <div key={chapter.id} className="relative">
                  {index < chapters.length - 1 && (
                    <div className="hidden xl:block absolute top-16 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/40 to-transparent"></div>
                  )}

                  <Card
                    className={`h-full hologram transition-all duration-500 cursor-pointer ${
                      chapter.status === 'locked'
                        ? 'opacity-60'
                        : 'hover:glow-border hover:scale-105'
                    }`}
                    onClick={() => isClickable && setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
                    onMouseEnter={() => handleCardInteraction(true)}
                    onMouseLeave={() => handleCardInteraction(false)}
                  >
                    <CardHeader className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-${chapter.glowColor}/10 border border-${chapter.glowColor}/30`}>
                          <IconComponent className={`w-6 h-6 text-${chapter.glowColor}`} />
                        </div>
                        {getStatusIcon(chapter.status)}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">CHAPTER {chapter.id}</span>
                        {getStatusBadge(chapter.status)}
                      </div>

                      <CardTitle className="text-lg font-space font-bold text-primary mb-1">
                        {chapter.title}
                      </CardTitle>
                      <div className={`text-sm font-space text-${chapter.glowColor} mb-3 opacity-90`}>
                        {chapter.subtitle}
                      </div>
                      <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                        {chapter.description}
                      </CardDescription>

                      {chapter.status !== 'locked' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-muted-foreground">PROGRESS</span>
                            <span className="text-xs font-mono text-neon-cyan">{chapter.progress}%</span>
                          </div>
                          <Progress value={chapter.progress} className="h-1" />
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Detailed Chapter View */}
          {selectedChapter && (
            <Card
              className="hologram glow-border animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
              onMouseEnter={() => handleCardInteraction(true)}
              onMouseLeave={() => handleCardInteraction(false)}
            >
              {(() => {
                const chapter = chapters.find(c => c.id === selectedChapter)!;
                const IconComponent = chapter.icon;
                return (
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6 mb-6">
                      <div className={`p-4 rounded-xl bg-${chapter.glowColor}/10 border border-${chapter.glowColor}/30 shrink-0`}>
                        <IconComponent className={`w-8 h-8 text-${chapter.glowColor}`} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-space font-bold text-primary">
                            Chapter {chapter.id}: {chapter.title}
                          </h3>
                          {getStatusBadge(chapter.status)}
                        </div>
                        <div className={`text-lg font-space text-${chapter.glowColor} mb-4`}>
                          {chapter.subtitle}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {chapter.detailedDescription}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-neon-cyan" />
                          <span className="font-space text-sm text-neon-cyan">CORE SKILLS</span>
                        </div>
                        <div className="space-y-2">
                          {chapter.skills.map((skill, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                              <span className="text-muted-foreground">{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-neon-purple" />
                          <span className="font-space text-sm text-neon-purple">FINAL CHALLENGE</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {chapter.challenge}
                        </p>
                      </div>
                    </div>

                    {chapter.status !== 'locked' && (
                      <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-neon-green" />
                          <span className="text-sm font-space text-neon-green">
                            {chapter.status === 'completed' ? 'MISSION ACCOMPLISHED' : 'READY FOR DEPLOYMENT'}
                          </span>
                        </div>

                        <Link href={chapter.href}>
                          <button
                            onClick={() => playProjectTextSound()}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-${chapter.glowColor}/20 border border-${chapter.glowColor}/50 text-${chapter.glowColor} font-space text-sm hover:bg-${chapter.glowColor}/30 transition-all`}
                          >
                            <span>{chapter.status === 'completed' ? 'REVIEW' : 'DEPLOY'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                );
              })()}
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-6 border-t border-purple-400/20 bg-purple-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-mono" style={{ color: '#f3ede9' }}>GALACTIC CODE INITIATIVE:</span>
          <span style={{ color: '#9f40ff' }}>OPERATIONAL</span>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#9f40ff' }}></div>
        </div>
      </footer>
    </div>
  );
}