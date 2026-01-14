'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useAnimations() {
  const isLoadedRef = useRef(false);

  // Mark animations as loaded after initial delay
  useEffect(() => {
    const timer = setTimeout(() => {
      isLoadedRef.current = true;
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Create matrix rain effect (CSS-based)
  const createMatrixRain = useCallback((container: HTMLElement) => {
    if (!container) return;

    const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

    // Clear existing rain
    container.innerHTML = '';

    for (let i = 0; i < 30; i++) {
      const drop = document.createElement('div');
      drop.textContent = characters[Math.floor(Math.random() * characters.length)];
      drop.className = 'absolute text-neon-cyan opacity-30 font-mono text-xs pointer-events-none z-0';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.top = '-20px';
      drop.style.fontSize = Math.random() * 10 + 8 + 'px';
      drop.style.animation = `matrix-rain ${Math.random() * 5000 + 3000}ms linear ${Math.random() * 2000}ms infinite`;

      container.appendChild(drop);
    }

    // Add CSS animation if not already present
    if (!document.getElementById('matrix-rain-style')) {
      const style = document.createElement('style');
      style.id = 'matrix-rain-style';
      style.textContent = `
        @keyframes matrix-rain {
          0% {
            transform: translateY(0);
            opacity: 0.3;
          }
          50% {
            opacity: 0.1;
          }
          75% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(${window.innerHeight + 100}px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Create floating particles (CSS-based)
  const createFloatingParticles = useCallback((container: HTMLElement) => {
    if (!container) return;

    // Clear existing particles
    container.innerHTML = '';

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full pointer-events-none';

      const size = Math.random() * 4 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';

      const colors = ['bg-neon-cyan', 'bg-neon-purple', 'bg-neon-green', 'bg-plasma-pink'];
      particle.classList.add(colors[Math.floor(Math.random() * colors.length)]);
      particle.style.opacity = '0.6';
      particle.style.boxShadow = `0 0 ${size * 2}px currentColor`;
      particle.style.animation = `float-particle ${Math.random() * 8000 + 10000}ms ease-in-out ${Math.random() * 2000}ms infinite alternate`;

      container.appendChild(particle);
    }

    // Add CSS animation if not already present
    if (!document.getElementById('float-particle-style')) {
      const style = document.createElement('style');
      style.id = 'float-particle-style';
      style.textContent = `
        @keyframes float-particle {
          0% {
            transform: translate(0, 0) scale(0.5) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(1.5) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0.8) rotate(360deg);
            opacity: 0.4;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Animate hero section entrance (CSS-based)
  const animateHeroEntrance = useCallback(() => {
    const elements = [
      { selector: '.hero-badge', delay: 300 },
      { selector: '.main-title', delay: 600 },
      { selector: '.hero-subtitle', delay: 1000 },
      { selector: '.hero-description', delay: 1200 }
    ];

    elements.forEach(({ selector, delay }) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        // Set initial state
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px) scale(0.9)';

        setTimeout(() => {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0) scale(1)';
          element.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, delay);
      }
    });
  }, []);

  // Animate cards entrance (CSS-based)
  const animateCardsEntrance = useCallback(() => {
    const cards = document.querySelectorAll('.mission-card');
    cards.forEach((card, index) => {
      const element = card as HTMLElement;
      // Set initial state
      element.style.opacity = '0';
      element.style.transform = 'translateY(80px) scale(0.9)';

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) scale(1)';
        element.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }, index * 200 + 1500);
    });
  }, []);

  // Card hover animation (CSS-based)
  const animateCardHover = useCallback((element: HTMLElement, isEntering: boolean) => {
    if (isEntering) {
      element.style.transform = 'scale(1.03) translateY(-5px)';
      element.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
      element.style.transform = 'scale(1) translateY(0)';
      element.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
  }, []);

  // Add subtle glitch effect to title (CSS-based)
  const addGlitchEffect = useCallback(() => {
    setTimeout(() => {
      const element = document.querySelector('.main-title') as HTMLElement;
      if (element) {
        element.style.animation = 'glitch-shake 0.1s infinite alternate';
        setTimeout(() => {
          element.style.animation = '';
          setTimeout(() => addGlitchEffect(), Math.random() * 5000 + 3000);
        }, 200);
      }
    }, 5000);

    // Add CSS animation if not already present
    if (!document.getElementById('glitch-shake-style')) {
      const style = document.createElement('style');
      style.id = 'glitch-shake-style';
      style.textContent = `
        @keyframes glitch-shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return {
    isLoaded: isLoadedRef.current,
    createMatrixRain,
    createFloatingParticles,
    animateHeroEntrance,
    animateCardsEntrance,
    animateCardHover,
    addGlitchEffect
  };
}
