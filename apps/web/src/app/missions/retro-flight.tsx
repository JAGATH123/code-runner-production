'use client';

import { useEffect, useRef } from 'react';

export default function RetroFlightBackground() {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Create CSS-only retroflight background
    const createCSSBackground = () => {
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

      // Create vertical grid lines
      for (let i = 0; i < 40; i++) {
        const vLine = document.createElement('div');
        vLine.style.cssText = `
          position: absolute;
          width: 2px;
          height: 200%;
          background: linear-gradient(0deg, transparent 0%, #9f40ff 30%, #9f40ff 70%, transparent 100%);
          left: ${(i - 20) * 5}%;
          bottom: -50%;
          opacity: ${0.2 + Math.abs(20 - i) * 0.01};
          transform: perspective(500px) rotateX(85deg);
          animation: moveVerticalGrid 3s linear infinite;
        `;
        container.appendChild(vLine);
      }

      // Create stars
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.style.cssText = `
          position: absolute;
          width: 2px;
          height: 2px;
          background: #ffffff;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 50}%;
          opacity: ${0.3 + Math.random() * 0.7};
          animation: twinkle ${1 + Math.random() * 3}s infinite;
        `;
        container.appendChild(star);
      }

      // Add CSS animations
      const style = document.createElement('style');
      style.textContent = `
        @keyframes moveGrid {
          0% { transform: perspective(500px) rotateX(85deg) translateZ(0px) translateY(0px); }
          100% { transform: perspective(500px) rotateX(85deg) translateZ(-1000px) translateY(800px); }
        }

        @keyframes moveVerticalGrid {
          0% { transform: perspective(500px) rotateX(85deg) translateZ(0px); }
          100% { transform: perspective(500px) rotateX(85deg) translateZ(-1000px); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes retroPulse {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(container);
    };

    createCSSBackground();

    return () => {
      const bg = document.getElementById('retro-flight-bg');
      if (bg) bg.remove();
    };
  }, []);

  return null;
}