
'use client';

import { Header } from '@/components/layout/Header';
import { LevelList } from '@/components/lists/LevelList';
import type { Level } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Terminal, Zap, Target, Activity } from 'lucide-react';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { usePageAudio } from '@/hooks/usePageAudio';
import { useAnimations } from '@/hooks/useAnimations';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

const CDN_SETTLEMENT_BG = 'https://res.cloudinary.com/dwqzqxeuk/image/upload/f_auto,q_auto/code-runner/ui/technological-exploration-settlement.jpg';

interface LevelPageProps {
    params: {
        age_group: string;
    };
}

export default function LevelPage({ params }: LevelPageProps) {
    const [levelsData, setLevelsData] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [ageGroup, setAgeGroup] = useState<string>('');
    const { } = useGlobalAudio();

    // Use the new page audio hook for smooth transitions
    usePageAudio({ audioType: 'background' });

    const {
        animateHeroEntrance,
        animateCardsEntrance,
        addGlitchEffect,
        isLoaded
    } = useAnimations();

    useEffect(() => {
        async function loadData() {
            try {
                const resolvedParams = await params;
                const { age_group } = resolvedParams;
                setAgeGroup(age_group);

                // Use API client to fetch from backend API service
                console.log('[Levels Page] Fetching levels for age group:', age_group);
                const data = await api.levels.getByAgeGroup(age_group as '11-14' | '15-18');
                console.log('[Levels Page] Received data:', {
                    isArray: Array.isArray(data),
                    length: Array.isArray(data) ? data.length : 'not an array',
                    type: typeof data,
                    firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null
                });
                setLevelsData(data);
            } catch (error) {
                console.error('Error loading levels:', error);
                notFound();
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [params]);

    // Initialize animations and background when loaded - No Three.js
    useEffect(() => {
        if (isLoaded && !loading) {
            const timer = setTimeout(() => {
                animateHeroEntrance();
                animateCardsEntrance();
                addGlitchEffect();
                // Initialize CSS-only floating particles
                initFloatingParticles();
            }, 500);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [isLoaded, loading]);

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

            // Cyan/green colors for training theme
            const cyanValue = Math.floor(Math.random() * 100) + 155;
            const opacity = Math.random() * 0.5 + 0.2;
            particle.style.backgroundColor = `rgba(0, ${cyanValue}, ${cyanValue}, ${opacity})`;

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

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <p className="font-mono text-cyan-400 text-sm animate-pulse">
                        {`// Loading ${ageGroup} mission data...`}
                    </p>
                </div>
            </div>
        );
    }

    const formattedAgeGroup = ageGroup.replace('-', '–');

    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0a0e17', color: '#f3ede9' }}>
            {/* Space Background Image */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `url("${CDN_SETTLEMENT_BG}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            ></div>

            {/* Grid Overlay - Same as Home Page */}
            <div
                className="fixed inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(0, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0, 255, 255, 0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    pointerEvents: 'none',
                    zIndex: 1
                }}
            ></div>

            {/* Floating Particles Container - CSS animations only */}
            <div id="floating-particles" className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}></div>

            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
                {/* Navigation Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm font-mono mb-8 text-neon-cyan">
                    <Link href="/home" className="hover:text-primary transition-colors flex items-center gap-1">
                        <Terminal className="h-3 w-3" />
                        <span>HOME_BASE</span>
                    </Link>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-neon-green">TRAINING_PROTOCOLS</span>
                </nav>

                {/* Mission Header */}
                <div className="text-center mb-12 space-y-6">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="relative">
                            <Target className="h-12 w-12 text-neon-green" />
                            <div className="absolute -inset-2 bg-neon-green/20 rounded-full blur animate-pulse"></div>
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl md:text-4xl font-space font-bold text-primary glow-text">
                                OPERATIVE TRAINING
                            </h1>
                            <p className="text-lg font-mono text-neon-cyan opacity-80">
                                Ages {formattedAgeGroup} | Advanced Protocols
                            </p>
                        </div>
                    </div>

                    {/* Mission Briefing */}
                    <div className="max-w-3xl mx-auto relative">
                        {/* SVG Filter for Electric Border */}
                        <svg className="absolute" style={{ width: 0, height: 0 }}>
                            <defs>
                                <filter
                                    id="briefing-turbulent-displace"
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

                        {/* Electric Border Container */}
                        <div
                            className="relative p-0.5 rounded-2xl"
                            style={{
                                background: 'linear-gradient(-30deg, rgba(0, 255, 255, 0.4), transparent, rgba(0, 255, 255, 0.4)), linear-gradient(to bottom, rgba(10, 14, 23, 1), rgba(10, 14, 23, 1))'
                            }}
                        >
                            {/* Inner Container */}
                            <div className="relative">
                                {/* Border Outer */}
                                <div
                                    className="border-2 rounded-2xl pr-1 pb-1"
                                    style={{ borderColor: 'rgba(0, 255, 255, 0.5)' }}
                                >
                                    {/* Main Briefing Card */}
                                    <div
                                        className="w-full rounded-2xl border-2 -mt-1 -ml-1 relative overflow-hidden p-6"
                                        style={{
                                            borderColor: '#00ffff',
                                            background: 'rgba(10, 14, 23, 0.95)'
                                        }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Zap className="h-5 w-5 text-neon-cyan" />
                                            <span className="font-space text-sm text-neon-cyan font-bold">MISSION BRIEFING</span>
                                        </div>
                                        <p className="text-lg font-medium" style={{ color: '#f3ede9', opacity: 0.8 }}>
                                            Select your training module to begin advanced neural programming protocols.
                                            Each mission is designed to enhance your computational abilities.
                                        </p>
                                    </div>
                                </div>

                                {/* Glow Layers */}
                                <div
                                    className="absolute inset-0 w-full h-full border-2 rounded-2xl"
                                    style={{
                                        borderColor: 'rgba(0, 255, 255, 0.6)',
                                        filter: 'blur(1px) url(#briefing-turbulent-displace)'
                                    }}
                                ></div>
                                <div
                                    className="absolute inset-0 w-full h-full border-2 rounded-2xl"
                                    style={{
                                        borderColor: '#00ffff',
                                        filter: 'blur(4px) url(#briefing-turbulent-displace)'
                                    }}
                                ></div>
                            </div>

                            {/* Overlay Effects */}
                            <div
                                className="absolute inset-0 w-full h-full rounded-2xl opacity-100 scale-110"
                                style={{
                                    mixBlendMode: 'overlay',
                                    filter: 'blur(16px)',
                                    background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                                }}
                            ></div>
                            <div
                                className="absolute inset-0 w-full h-full rounded-2xl opacity-50 scale-110"
                                style={{
                                    mixBlendMode: 'overlay',
                                    filter: 'blur(16px)',
                                    background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
                                }}
                            ></div>

                            {/* Background Glow */}
                            <div
                                className="absolute inset-0 w-full h-full rounded-2xl -z-10 scale-110 opacity-30"
                                style={{
                                    filter: 'blur(32px)',
                                    background: 'linear-gradient(-30deg, #00ffff, transparent, #00ffff)'
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="flex items-center justify-center gap-4">
                        {/* Modules Count Badge */}
                        <div
                            className="flex items-center gap-2 px-3 py-1 rounded border-2 font-space font-semibold text-xs"
                            style={{
                                background: 'linear-gradient(135deg, rgba(10, 14, 23, 0.95), rgba(0, 50, 40, 0.9))',
                                borderColor: 'rgb(0, 255, 136)',
                                color: 'rgb(0, 255, 136)',
                                boxShadow: 'rgba(0, 255, 136, 0.3) 0px 0px 20px'
                            }}
                        >
                            <Activity className="w-3 h-3 text-neon-green animate-pulse" />
                            <span>{levelsData.length} MODULES</span>
                        </div>
                    </div>
                </div>

                <LevelList levels={levelsData} />
            </main>

            <footer className="text-center p-6 text-muted-foreground text-sm font-mono relative z-10 border-t border-neon-cyan/20 bg-space-gray/20 backdrop-blur-sm">
                <p>NEURAL NETWORK v2.847.x | Training Protocol Active</p>
            </footer>

            {/* Audio Control - Fixed Bottom Left */}
        </div>
    );
}
