'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { ArrowRight, Zap, Rocket, Code2, Star } from 'lucide-react';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useAnimations } from '@/hooks/useAnimations';
import { usePageAudio } from '@/hooks/usePageAudio';
import { useEffect, useRef, useState } from 'react';
import MemoryLoadingScreen from '@/components/layout/MemoryLoadingScreen';

function AgeSelectionPageContent() {
  const router = useRouter();
  const { 
    playCardHover, 
    playButtonClick,
    playBeepsSound,
    playProjectTextSound
  } = useGlobalAudio();
  
  
  // Use the new page audio hook for smooth transitions
  usePageAudio({ audioType: 'background' });

  const {
    createFloatingParticles,
    animateHeroEntrance,
    animateCardsEntrance,
    animateCardHover,
    addGlitchEffect,
    isLoaded
  } = useAnimations();

  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    cardType: 'novice' | 'advanced' | null;
  }>({
    isLoading: false,
    cardType: null
  });

  // Initialize animations and background when loaded
  useEffect(() => {
    if (isLoaded) {
      let cleanup: (() => void) | undefined;

      const timer = setTimeout(async () => {
        // Start entrance animations
        animateHeroEntrance();
        animateCardsEntrance();
        addGlitchEffect();
        cleanup = await initializeBackgroundEffects();
      }, 500);

      return () => {
        clearTimeout(timer);
        if (cleanup) cleanup();
      };
    }
  }, [isLoaded]);

  // Initialize Three.js background effects
  const initializeBackgroundEffects = async () => {
    try {
      // Dynamically import Three.js
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      // Initialize floating particles
      initFloatingParticles();

      // Initialize Three.js scene
      const container = document.getElementById('three-container');
      if (!container) return;

      // Clear any existing canvas
      container.innerHTML = '';

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0a0e17, 0.05);

      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 10;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.enableZoom = false;

      // Create animated anomaly object
      const anomalyObject = new THREE.Group();
      const radius = 2;
      const geometry = new THREE.IcosahedronGeometry(radius, 2);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0xff4e42) }
        },
        vertexShader: `
          uniform float time;
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec3 pos = position;
            float noise = sin(position.x * 2.0 + time) * 0.1;
            pos += normal * noise;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          varying vec3 vNormal;
          void main() {
            float fresnel = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
            float pulse = 0.8 + 0.2 * sin(time * 2.0);
            vec3 finalColor = color * fresnel * pulse;
            gl_FragColor = vec4(finalColor, fresnel * 0.7);
          }
        `,
        wireframe: true,
        transparent: true
      });

      const mesh = new THREE.Mesh(geometry, material);
      anomalyObject.add(mesh);
      scene.add(anomalyObject);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0xff4e42, 1, 10);
      pointLight1.position.set(2, 2, 2);
      scene.add(pointLight1);

      // Animation loop
      const clock = new THREE.Clock();
      let animationFrameId: number;
      const animate = () => {
        const time = clock.getElapsedTime();

        controls.update();
        material.uniforms.time.value = time;
        anomalyObject.rotation.y += 0.005;
        anomalyObject.rotation.z += 0.002;

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Return cleanup function
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        if (container && renderer.domElement) {
          container.removeChild(renderer.domElement);
        }
      };

    } catch (error) {
      console.error('Error initializing background effects:', error);
      return undefined;
    }
  };

  // Initialize floating particles
  const initFloatingParticles = () => {
    const container = document.getElementById('floating-particles');
    if (!container) return;

    const numParticles = 800;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    container.innerHTML = '';
    const particles: any[] = [];

    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '1.5px';
      particle.style.height = '1.5px';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';

      const redValue = Math.floor(Math.random() * 100) + 155;
      const greenValue = Math.floor(Math.random() * 100) + 78;
      const blueValue = Math.floor(Math.random() * 100) + 66;
      const opacity = Math.random() * 0.5 + 0.2;
      particle.style.backgroundColor = `rgba(${redValue}, ${greenValue}, ${blueValue}, ${opacity})`;

      const x = Math.random() * windowWidth;
      const y = Math.random() * windowHeight;
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';

      const particleObj = {
        element: particle,
        x: x,
        y: y,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        size: 1.5
      };

      particles.push(particleObj);
      container.appendChild(particle);
    }

    // Animate particles
    let time = 0;
    const animateParticles = () => {
      time += 0.01;
      particles.forEach((particle) => {
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;

        if (particle.x < 0) particle.x = windowWidth;
        if (particle.x > windowWidth) particle.x = 0;
        if (particle.y < 0) particle.y = windowHeight;
        if (particle.y > windowHeight) particle.y = 0;

        particle.element.style.left = particle.x + 'px';
        particle.element.style.top = particle.y + 'px';
      });
      requestAnimationFrame(animateParticles);
    };
    requestAnimationFrame(animateParticles);
  };

  const handleCardHover = (e: React.MouseEvent<HTMLAnchorElement>, isEntering: boolean) => {
    playCardHover();
    if (isLoaded) {
      animateCardHover(e.currentTarget as HTMLElement, isEntering);
    }
    
  };

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, cardType: 'novice' | 'advanced') => {
    e.preventDefault();
    playProjectTextSound(); // Play deploy click sound for training protocols

    // Show loading state
    setLoadingState({
      isLoading: true,
      cardType
    });

    // Simulate loading data, then navigate
    setTimeout(() => {
      router.push(href);
    }, 1500); // 1.5 seconds of loading
  };

  const ageGroups = [
    {
      title: 'NOVICE OPERATIVE',
      subtitle: 'Ages 11-14',
      description: 'Initialize your neural pathways with fundamental Python protocols. Master basic algorithms and data structures.',
      href: '/levels/11-14',
      icon: Code2,
      glowColor: 'neon-cyan',
      level: 'LEVEL 01',
      cardType: 'novice' as const,
    },
    {
      title: 'ADVANCED AGENT',
      subtitle: 'Ages 15-18',
      description: 'Execute complex programming missions. Deploy advanced concepts and architect sophisticated systems.',
      href: '/levels/15-18',
      icon: Rocket,
      glowColor: 'neon-purple',
      level: 'LEVEL 02',
      cardType: 'advanced' as const,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden" style={{ backgroundColor: '#12100f', color: '#f3ede9' }}>
      {/* Space Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("https://assets.codepen.io/7558/space-bg-002.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      {/* Grid Overlay */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 240, 230, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 240, 230, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 1
        }}
      ></div>

      {/* Three.js Container */}
      <div id="three-container" className="fixed inset-0" style={{ zIndex: 2 }}></div>

      {/* Floating Particles Container */}
      <div id="floating-particles" className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }}></div>
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center my-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/20 border border-red-400/30 mb-6">
            <Star className="w-4 h-4 animate-pulse" style={{ color: '#ff4e42' }} />
            <span className="text-sm font-space" style={{ color: '#ff4e42' }}>INITIATE PROTOCOL</span>
            <Star className="w-4 h-4 animate-pulse" style={{ color: '#ff4e42' }} />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-space font-black tracking-tight mb-4 glitch-text" style={{ color: '#f3ede9' }}>
            CODE RUNNER
          </h1>
          <div className="text-lg md:text-xl font-space mb-4" style={{ color: '#ff4e42' }}>
            Advanced Programming Interface
          </div>
          <p className="text-base max-w-4xl mx-auto leading-relaxed mb-6" style={{ color: '#f3ede9', opacity: 0.8 }}>
            Welcome to the advanced training facility. Select your operational clearance level to access
            the Python programming matrix and unlock your coding potential.
          </p>
        </div>

        {/* Mission Selection Cards */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {ageGroups.map((group, index) => {
            const IconComponent = group.icon;
            return (
              <Link
                href={group.href}
                key={group.title}
                className="block group"
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
                onClick={(e) => handleCardClick(e, group.href, group.cardType)}
              >
                {/* Electric Border Card Container */}
                <div className="relative transition-all duration-500 hover:scale-105">
                  {/* SVG Filter Definition */}
                  <svg className="absolute" style={{ width: 0, height: 0 }}>
                    <defs>
                      <filter
                        id={`turbulent-displace-${index}`}
                        colorInterpolationFilters="sRGB"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feTurbulence
                          type="turbulence"
                          baseFrequency="0.02"
                          numOctaves="10"
                          result="noise1"
                          seed="1"
                        />
                        <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                          <animate
                            attributeName="dy"
                            values="700; 0"
                            dur="6s"
                            repeatCount="indefinite"
                            calcMode="linear"
                          />
                        </feOffset>
                        <feTurbulence
                          type="turbulence"
                          baseFrequency="0.02"
                          numOctaves="10"
                          result="noise2"
                          seed="1"
                        />
                        <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                          <animate
                            attributeName="dy"
                            values="0; -700"
                            dur="6s"
                            repeatCount="indefinite"
                            calcMode="linear"
                          />
                        </feOffset>
                        <feComposite in="offsetNoise1" in2="offsetNoise2" result="combinedNoise" />
                        <feDisplacementMap
                          in="SourceGraphic"
                          in2="combinedNoise"
                          scale="15"
                          xChannelSelector="R"
                          yChannelSelector="B"
                        />
                      </filter>
                    </defs>
                  </svg>

                  {/* Card Container with Electric Border */}
                  <div
                    className="relative p-0.5 rounded-3xl"
                    style={{
                      background: `linear-gradient(-30deg, rgba(255, 78, 66, 0.4), transparent, rgba(255, 78, 66, 0.4)), linear-gradient(to bottom, rgba(18, 16, 15, 1), rgba(18, 16, 15, 1))`
                    }}
                  >
                    {/* Inner Container */}
                    <div className="relative">
                      {/* Border Outer */}
                      <div
                        className="border-2 rounded-3xl pr-1 pb-1"
                        style={{ borderColor: 'rgba(255, 78, 66, 0.5)' }}
                      >
                        {/* Main Card */}
                        <div
                          className="w-full h-96 rounded-3xl border-2 -mt-1 -ml-1 relative overflow-hidden"
                          style={{
                            borderColor: '#ff4e42',
                            background: 'rgba(18, 16, 15, 0.95)'
                          }}
                        >
                          {/* Content Container */}
                          <div className="absolute inset-0 w-full h-full flex flex-col">
                            {/* Content Top */}
                            <div className="flex flex-col p-8 pb-4 h-full">
                              {/* Icon and Level Badge */}
                              <div className="flex items-center justify-between mb-6">
                                <div className="p-3 rounded-lg bg-red-900/20 border border-red-400/30">
                                  <IconComponent className="w-8 h-8" style={{ color: '#ff4e42' }} />
                                </div>
                                <div
                                  className="px-3 py-1 rounded-full text-xs font-space font-bold"
                                  style={{
                                    background: 'radial-gradient(47.2% 50% at 50.39% 88.37%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#ff4e42'
                                  }}
                                >
                                  {group.level}
                                </div>
                              </div>

                              {/* Title */}
                              <h3 className="text-2xl font-space font-bold mb-2" style={{ color: '#f3ede9' }}>
                                {group.title}
                              </h3>

                              {/* Subtitle */}
                              <div className="text-sm font-space mb-4" style={{ color: '#ff4e42', opacity: 0.9 }}>
                                {group.subtitle}
                              </div>

                              {/* Description */}
                              <p className="text-base leading-relaxed mb-6" style={{ color: '#f3ede9', opacity: 0.7 }}>
                                {group.description}
                              </p>

                              {/* Divider */}
                              <hr
                                className="mt-auto mb-4 border-none h-px opacity-20"
                                style={{
                                  background: 'currentColor',
                                  WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)',
                                  maskImage: 'linear-gradient(to right, transparent, black, transparent)'
                                }}
                              />
                            </div>

                            {/* Content Bottom */}
                            <div className="flex flex-col p-8 pt-4">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4" style={{ color: '#ff4e42' }} />
                                  <span className="text-sm font-space font-semibold" style={{ color: '#f3ede9' }}>READY FOR DEPLOYMENT</span>
                                </div>
                                <div className="flex items-center gap-2 font-space font-semibold" style={{ color: '#ff4e42' }}>
                                  <span>DEPLOY</span>
                                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Glow Layers */}
                      <div
                        className="absolute inset-0 w-full h-full border-2 rounded-3xl"
                        style={{
                          borderColor: 'rgba(255, 78, 66, 0.6)',
                          filter: `blur(1px) url(#turbulent-displace-${index})`
                        }}
                      ></div>
                      <div
                        className="absolute inset-0 w-full h-full border-2 rounded-3xl"
                        style={{
                          borderColor: '#ff4e42',
                          filter: `blur(4px) url(#turbulent-displace-${index})`
                        }}
                      ></div>
                    </div>

                    {/* Overlay Effects */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-3xl opacity-100 scale-110"
                      style={{
                        mixBlendMode: 'overlay',
                        filter: 'blur(16px)',
                        background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 w-full h-full rounded-3xl opacity-50 scale-110"
                      style={{
                        mixBlendMode: 'overlay',
                        filter: 'blur(16px)',
                        background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                      }}
                    ></div>

                    {/* Background Glow */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-3xl -z-10 scale-110 opacity-30"
                      style={{
                        filter: 'blur(32px)',
                        background: 'linear-gradient(-30deg, #ff4e42, transparent, #ff4e42)'
                      }}
                    ></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-6 border-t border-red-400/20 bg-red-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="font-mono" style={{ color: '#f3ede9' }}>GALACTIC CODE INITIATIVE:</span>
          <span style={{ color: '#ff4e42' }}>OPERATIONAL</span>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ff4e42' }}></div>
        </div>
      </footer>

      {/* Memory Loading Screen */}
      <MemoryLoadingScreen
        isVisible={loadingState.isLoading}
        text={`// Initializing ${loadingState.cardType?.toUpperCase()} protocol...`}
        onComplete={() => {
          // This will be handled by the handleCardClick timeout
        }}
        duration={1500}
      />


    </div>
  );
}

export default function AgeSelectionPage() {
  return <AgeSelectionPageContent />;
}