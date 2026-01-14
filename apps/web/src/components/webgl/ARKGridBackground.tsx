'use client';

import { useEffect, useRef } from 'react';

interface ARKGridBackgroundProps {
  className?: string;
  gridSize?: number;
  blinkIntensity?: number;
  blinkSpeed?: number;
  starDensity?: number;
}

export function ARKGridBackground({ 
  className = '',
  gridSize = 8,          // Reduced grid size for denser pattern
  blinkIntensity = 0.9,  // Significantly more intense blink for a dramatic effect
  blinkSpeed = 0.35,     // slow blink
  starDensity = 0.0003   // fewer subtle stars
}: ARKGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridInstanceRef = useRef<ARKGrid | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const arkGrid = new ARKGrid(canvasRef.current, {
      gridSize,
      blinkIntensity,
      blinkSpeed,
      starDensity
    });
    
    gridInstanceRef.current = arkGrid;
    arkGrid.start();

    return () => {
      arkGrid.dispose();
    };
  }, [gridSize, blinkIntensity, blinkSpeed, starDensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`ark-grid-background ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, #0F1B26 0%, #0F1B26 100%)'
      }}
    />
  );
}

class ARKGrid {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number = 0;

  private config: {
    gridSize: number;
    blinkIntensity: number;
    blinkSpeed: number;
    starDensity: number;
  };

  private gridCols: number = 0;
  private gridRows: number = 0;
  private gridSquares: GridSquare[] = [];
  private stars: Star[] = [];

  private lastTime: number = 0;
  private deltaTime: number = 0;

  // --- MODIFIED: Changed gridBlink to a cyan color ---
  private colors = {
    gridBase: 'hsla(0, 0%, 100%, 1.00)',      // dark navy
    gridVariant1: 'rgba(28, 36, 52, 0.55)',   // subtle variant
    gridVariant2: 'rgba(18, 26, 40, 0.55)',   // darker navy
    gridBlink: 'rgba(12, 80, 80, 0.7)',      // <-- CHANGED TO CYAN
    starColor: 'rgba(180, 200, 255, 0.2)',    // faint stars
    starBright: 'rgba(255, 255, 255, 0.35)'   // rare bright star
  };

  constructor(canvas: HTMLCanvasElement, config: ARKGridBackgroundProps) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.config = {
      gridSize: config.gridSize || 8,
      blinkIntensity: config.blinkIntensity || 0.9,
      blinkSpeed: config.blinkSpeed || 0.35,
      starDensity: config.starDensity || 0.0003
    };

    this.setupCanvas();
    this.generateGrid();
    this.generateStars();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private generateGrid(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.gridCols = Math.ceil(rect.width / this.config.gridSize) ;
    this.gridRows = Math.ceil(rect.height / this.config.gridSize) ;

    this.gridSquares = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        this.gridSquares.push(
          new GridSquare(
            col * this.config.gridSize,
            row * this.config.gridSize,
            this.config.gridSize,
            this.config.blinkSpeed
          )
        );
      }
    }
  }

  private generateStars(): void {
    const rect = this.canvas.getBoundingClientRect();
    const starCount = Math.floor(rect.width * rect.height * this.config.starDensity);

    this.stars = [];
    for (let i = 0; i < starCount; i++) {
      this.stars.push(
        new Star(
          Math.random() * rect.width,
          Math.random() * rect.height,
          Math.random() * 1.2 + 0.3
        )
      );
    }
  }

  private setupEventListeners(): void {
    const resizeHandler = () => {
      this.setupCanvas();
      this.generateGrid();
      this.generateStars();
    };
    window.addEventListener('resize', resizeHandler);
    (this as any).resizeHandler = resizeHandler;
  }

  public start(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  private animate = (currentTime: number = performance.now()): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(this.deltaTime);
    this.render();
  };

  private update(deltaTime: number): void {
    for (const square of this.gridSquares) square.update(deltaTime);
    for (const star of this.stars) star.update(deltaTime);
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderStars();
    this.renderGrid();
  }

  private renderStars(): void {
    this.ctx.globalCompositeOperation = 'screen';
    for (const star of this.stars) {
      const opacity = star.opacity * star.twinkle;
      if (opacity > 0.05) {
        this.ctx.fillStyle = star.isBright
          ? this.colors.starBright.replace(/[\d.]+\)$/, `${opacity})`)
          : this.colors.starColor.replace(/[\d.]+\)$/, `${opacity})`);
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private renderGrid(): void {
    const squaresByColor = new Map<string, GridSquare[]>();
    for (const square of this.gridSquares) {
      const color = square.getCurrentColor(this.colors, this.config.blinkIntensity);
      if (!squaresByColor.has(color)) squaresByColor.set(color, []);
      squaresByColor.get(color)!.push(square);
    }
    for (const [color, squares] of squaresByColor.entries()) {
      this.ctx.fillStyle = color;
      for (const square of squares) {
        // Drawing with size - 1 creates the 1px border effect.
        this.ctx.fillRect(square.x, square.y, square.size - 1, square.size - 1);
      }
    }
  }

  public dispose(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if ((this as any).resizeHandler) window.removeEventListener('resize', (this as any).resizeHandler);
    this.gridSquares.length = 0;
    this.stars.length = 0;
  }
}

class GridSquare {
  public x: number;
  public y: number;
  public size: number;

  private blinkTimer: number;
  private blinkDuration: number;
  private blinkCooldown: number;
  private isBlinking: boolean = false;
  private blinkIntensity: number = 0;
  private baseOpacity: number;
  private colorVariant: number;

  constructor(x: number, y: number, size: number, blinkSpeed: number) {
    this.x = x;
    this.y = y;
    this.size = size;

    this.blinkTimer = Math.random() * 8000;
    this.blinkDuration = (Math.random() * 1200 + 600) / blinkSpeed;
    this.blinkCooldown = Math.random() * 6000 + 2000;

    this.baseOpacity = Math.random() * 0.2 + 0.12;
    this.colorVariant = Math.floor(Math.random() * 3);
  }

  public update(deltaTime: number): void {
    this.blinkTimer += deltaTime;
    if (!this.isBlinking) {
      if (this.blinkTimer > this.blinkCooldown) {
        this.isBlinking = true;
        this.blinkTimer = 0;
      }
    } else {
      const progress = Math.min(this.blinkTimer / this.blinkDuration, 1);
      if (progress < 1) {
        this.blinkIntensity = Math.sin(progress * Math.PI);
      } else {
        this.isBlinking = false;
        this.blinkIntensity = 0;
        this.blinkTimer = 0;
        this.blinkCooldown = Math.random() * 6000 + 2000;
      }
    }
  }

  public getCurrentColor(colors: any, maxBlinkIntensity: number): string {
    let baseColor: string;
    switch (this.colorVariant) {
      case 0: baseColor = colors.gridBase; break;
      case 1: baseColor = colors.gridVariant1; break;
      default: baseColor = colors.gridVariant2; break;
    }

    if (this.isBlinking && this.blinkIntensity > 0.1) {
      const blinkStrength = this.blinkIntensity * maxBlinkIntensity;
      const opacity = this.baseOpacity + blinkStrength * 0.6;
      return colors.gridBlink.replace(/[\d.]+\)$/, `${opacity})`);
    }

    return baseColor.replace(/[\d.]+\)$/, `${this.baseOpacity})`);
  }
}

class Star {
  public x: number;
  public y: number;
  public size: number;
  public opacity: number;
  public twinkle: number = 1;
  public isBright: boolean;

  private twinkleTimer: number = 0;
  private twinkleSpeed: number;

  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.isBright = Math.random() < 0.1;
    this.twinkleSpeed = Math.random() * 0.003 + 0.001;
    this.twinkleTimer = Math.random() * 1000;
  }

  public update(deltaTime: number): void {
    this.twinkleTimer += deltaTime;
    this.twinkle = 0.7 + Math.sin(this.twinkleTimer * this.twinkleSpeed) * 0.3;
    if (this.isBright && Math.random() < 0.0003) {
      this.twinkle = Math.min(this.twinkle + 0.4, 1.0);
    }
  }
}
