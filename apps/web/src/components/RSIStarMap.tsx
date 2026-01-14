'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

interface RSIStarMapProps {
  className?: string;
}

export function RSIStarMap({ className = '' }: RSIStarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StarMapScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const starMap = new StarMapScene(containerRef.current);
    sceneRef.current = starMap;

    return () => {
      starMap.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 z-0 ${className}`}
      style={{ background: 'radial-gradient(ellipse at center, #0c1445 0%, #000000 100%)' }}
    />
  );
}

/**
 * Main StarMap Scene Class
 * Handles Three.js scene setup, rendering, and interactions
 */
class StarMapScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  
  // Star system components
  private starField: THREE.Points;
  private nebulaField: THREE.Points;
  private brightStars: THREE.Points;
  
  // Controls and animation
  private mouse = new THREE.Vector2();
  private targetRotation = new THREE.Euler();
  private currentRotation = new THREE.Euler();
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private isMouseDown = false;
  private mouseStart = new THREE.Vector2();
  private cameraDistance = 100;
  private targetDistance = 100;
  
  // Performance tracking
  private lastTime = 0;
  private frameCount = 0;
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    this.initScene();
    this.createStarField();
    this.createNebulaField();
    this.createBrightStars();
    this.setupPostProcessing();
    this.setupControls();
    this.setupEventListeners();
    this.animate();
  }

  /**
   * Initialize Three.js scene, camera, and renderer
   */
  private initScene(): void {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0001);

    // Camera setup with wide field of view for immersive experience
    this.camera = new THREE.PerspectiveCamera(
      75, 
      this.container.clientWidth / this.container.clientHeight, 
      0.1, 
      10000
    );
    this.camera.position.set(0, 0, 100);

    // Renderer setup with optimal settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: window.devicePixelRatio === 1, // Conditional antialiasing for performance
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Create main star field with varying sizes, colors, and distances
   */
  private createStarField(): void {
    const starCount = 15000; // Optimized count for performance
    const geometry = new THREE.BufferGeometry();
    
    // Create star positions in spherical distribution
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const distances = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Create spherical distribution with bias toward galactic plane
      const radius = THREE.MathUtils.randFloat(50, 2000);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1) * 0.6 + Math.PI / 2; // Bias toward equator
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi) * THREE.MathUtils.randFloat(0.1, 1.0);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Star color based on temperature (blue-white-yellow-red sequence)
      const temp = Math.random();
      if (temp < 0.1) {
        // Blue giants (rare)
        colors[i3] = 0.6;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 1.0;
      } else if (temp < 0.3) {
        // Blue-white
        colors[i3] = 0.8;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 1.0;
      } else if (temp < 0.7) {
        // White-yellow (like our sun)
        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 0.9;
      } else {
        // Red giants
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.6;
        colors[i3 + 2] = 0.4;
      }
      
      // Size based on distance and stellar type
      const distanceFactor = Math.max(0.1, 1.0 - (radius / 2000));
      sizes[i] = THREE.MathUtils.randFloat(0.5, 3.0) * distanceFactor;
      distances[i] = radius;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('distance', new THREE.BufferAttribute(distances, 1));
    
    // Custom star shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() }
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    });
    
    this.starField = new THREE.Points(geometry, material);
    this.scene.add(this.starField);
  }

  /**
   * Create nebula/gas cloud effects using procedural noise
   */
  private createNebulaField(): void {
    const nebulaCount = 3000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(nebulaCount * 3);
    const colors = new Float32Array(nebulaCount * 3);
    const sizes = new Float32Array(nebulaCount);
    const opacity = new Float32Array(nebulaCount);
    
    // Create multiple nebula clusters
    const clusterCount = 5;
    for (let cluster = 0; cluster < clusterCount; cluster++) {
      const clusterCenter = new THREE.Vector3(
        THREE.MathUtils.randFloat(-800, 800),
        THREE.MathUtils.randFloat(-200, 200),
        THREE.MathUtils.randFloat(-800, 800)
      );
      
      const particlesPerCluster = Math.floor(nebulaCount / clusterCount);
      for (let i = 0; i < particlesPerCluster; i++) {
        const idx = cluster * particlesPerCluster + i;
        const i3 = idx * 3;
        
        // Position around cluster center with falloff
        const radius = THREE.MathUtils.randFloat(50, 300);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = clusterCenter.x + radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = clusterCenter.y + radius * Math.cos(phi) * 0.3; // Flatter distribution
        positions[i3 + 2] = clusterCenter.z + radius * Math.sin(phi) * Math.sin(theta);
        
        // Nebula colors - pinks, purples, blues
        const colorVariant = Math.random();
        if (colorVariant < 0.33) {
          // Magenta/Pink
          colors[i3] = THREE.MathUtils.randFloat(0.8, 1.0);
          colors[i3 + 1] = THREE.MathUtils.randFloat(0.2, 0.6);
          colors[i3 + 2] = THREE.MathUtils.randFloat(0.8, 1.0);
        } else if (colorVariant < 0.66) {
          // Blue
          colors[i3] = THREE.MathUtils.randFloat(0.2, 0.6);
          colors[i3 + 1] = THREE.MathUtils.randFloat(0.4, 0.8);
          colors[i3 + 2] = THREE.MathUtils.randFloat(0.8, 1.0);
        } else {
          // Purple
          colors[i3] = THREE.MathUtils.randFloat(0.6, 1.0);
          colors[i3 + 1] = THREE.MathUtils.randFloat(0.2, 0.5);
          colors[i3 + 2] = THREE.MathUtils.randFloat(0.8, 1.0);
        }
        
        sizes[idx] = THREE.MathUtils.randFloat(10, 80);
        opacity[idx] = THREE.MathUtils.randFloat(0.1, 0.4);
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacity, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() }
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    });
    
    this.nebulaField = new THREE.Points(geometry, material);
    this.scene.add(this.nebulaField);
  }

  /**
   * Create bright foreground stars for bloom effect
   */
  private createBrightStars(): void {
    const brightCount = 500;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(brightCount * 3);
    const colors = new Float32Array(brightCount * 3);
    const sizes = new Float32Array(brightCount);
    
    for (let i = 0; i < brightCount; i++) {
      const i3 = i * 3;
      
      // Closer, brighter stars
      const radius = THREE.MathUtils.randFloat(100, 1500);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1) * 0.5 + Math.PI / 2;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi) * THREE.MathUtils.randFloat(0.2, 1.0);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Bright white/blue colors for bloom
      colors[i3] = THREE.MathUtils.randFloat(0.8, 1.0);
      colors[i3 + 1] = THREE.MathUtils.randFloat(0.9, 1.0);
      colors[i3 + 2] = 1.0;
      
      sizes[i] = THREE.MathUtils.randFloat(2.0, 6.0);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() }
      },
      vertexShader: brightStarVertexShader,
      fragmentShader: brightStarFragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    });
    
    this.brightStars = new THREE.Points(geometry, material);
    this.scene.add(this.brightStars);
  }

  /**
   * Setup post-processing pipeline with bloom effect
   */
  private setupPostProcessing(): void {
    this.composer = new EffectComposer(this.renderer);
    
    // Main render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom pass for glowing effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      1.0,  // Bloom strength
      0.8,  // Bloom radius  
      0.1   // Bloom threshold
    );
    this.composer.addPass(bloomPass);
  }

  /**
   * Setup smooth camera controls
   */
  private setupControls(): void {
    // Initial camera setup
    this.camera.position.set(0, 20, 100);
    this.camera.lookAt(0, 0, 0);
    this.currentRotation.copy(this.camera.rotation);
    this.targetRotation.copy(this.camera.rotation);
  }

  /**
   * Setup mouse and keyboard event listeners
   */
  private setupEventListeners(): void {
    // Mouse controls for camera rotation
    this.container.addEventListener('mousedown', (event) => {
      this.isMouseDown = true;
      this.mouseStart.set(event.clientX, event.clientY);
      this.container.style.cursor = 'grabbing';
    });

    this.container.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / this.container.clientWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / this.container.clientHeight) * 2 + 1;
      
      if (this.isMouseDown) {
        const deltaX = event.clientX - this.mouseStart.x;
        const deltaY = event.clientY - this.mouseStart.y;
        
        this.targetRotation.y += deltaX * 0.01;
        this.targetRotation.x += deltaY * 0.01;
        
        // Clamp vertical rotation
        this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
        
        this.mouseStart.set(event.clientX, event.clientY);
      }
    });

    this.container.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.container.style.cursor = 'grab';
    });

    this.container.addEventListener('mouseleave', () => {
      this.isMouseDown = false;
      this.container.style.cursor = 'default';
    });

    // Zoom controls
    this.container.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = event.deltaY * 0.1;
      this.targetDistance = Math.max(20, Math.min(500, this.targetDistance + delta));
    }, { passive: false });

    // Resize handling
    window.addEventListener('resize', () => this.onWindowResize());

    // Set initial cursor
    this.container.style.cursor = 'grab';
  }

  /**
   * Handle window resize with responsive canvas
   */
  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    
    // Update shader uniforms for pixel ratio changes
    const pixelRatio = this.renderer.getPixelRatio();
    if (this.starField.material instanceof THREE.ShaderMaterial) {
      this.starField.material.uniforms.pixelRatio.value = pixelRatio;
    }
    if (this.nebulaField.material instanceof THREE.ShaderMaterial) {
      this.nebulaField.material.uniforms.pixelRatio.value = pixelRatio;
    }
    if (this.brightStars.material instanceof THREE.ShaderMaterial) {
      this.brightStars.material.uniforms.pixelRatio.value = pixelRatio;
    }
  }

  /**
   * Main animation loop with smooth interpolation and performance monitoring
   */
  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    const currentTime = performance.now() * 0.001;
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Smooth camera interpolation
    const lerpFactor = Math.min(deltaTime * 3, 1); // Smooth easing
    
    this.currentRotation.x = THREE.MathUtils.lerp(this.currentRotation.x, this.targetRotation.x, lerpFactor);
    this.currentRotation.y = THREE.MathUtils.lerp(this.currentRotation.y, this.targetRotation.y, lerpFactor);
    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.targetDistance, lerpFactor);
    
    // Update camera position
    this.camera.position.x = Math.cos(this.currentRotation.y) * Math.cos(this.currentRotation.x) * this.cameraDistance;
    this.camera.position.y = Math.sin(this.currentRotation.x) * this.cameraDistance;
    this.camera.position.z = Math.sin(this.currentRotation.y) * Math.cos(this.currentRotation.x) * this.cameraDistance;
    this.camera.lookAt(this.cameraTarget);
    
    // Update shader uniforms
    if (this.starField.material instanceof THREE.ShaderMaterial) {
      this.starField.material.uniforms.time.value = currentTime;
    }
    if (this.nebulaField.material instanceof THREE.ShaderMaterial) {
      this.nebulaField.material.uniforms.time.value = currentTime * 0.5; // Slower animation for nebula
    }
    if (this.brightStars.material instanceof THREE.ShaderMaterial) {
      this.brightStars.material.uniforms.time.value = currentTime;
    }
    
    // Gentle rotation of star fields for dynamic movement
    this.starField.rotation.y += 0.0001;
    this.nebulaField.rotation.y += 0.00005;
    this.brightStars.rotation.y += 0.00015;
    
    // Render with post-processing
    this.composer.render();
    
    // Performance monitoring (log every 60 frames)
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      const fps = Math.round(1 / deltaTime);
      if (fps < 30) {
        console.warn(`StarMap performance: ${fps} FPS`);
      }
    }
  };

  /**
   * Clean up resources when component unmounts
   */
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    // Dispose geometries and materials
    if (this.starField) {
      this.starField.geometry.dispose();
      if (this.starField.material instanceof THREE.ShaderMaterial) {
        this.starField.material.dispose();
      }
    }
    
    if (this.nebulaField) {
      this.nebulaField.geometry.dispose();
      if (this.nebulaField.material instanceof THREE.ShaderMaterial) {
        this.nebulaField.material.dispose();
      }
    }
    
    if (this.brightStars) {
      this.brightStars.geometry.dispose();
      if (this.brightStars.material instanceof THREE.ShaderMaterial) {
        this.brightStars.material.dispose();
      }
    }
    
    // Dispose renderer and remove from DOM
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    
    // Dispose composer
    this.composer.dispose();
  }
}

// GLSL Shaders

/**
 * Vertex shader for main star field
 * Handles star positioning, size calculation, and distance-based effects
 */
const starVertexShader = `
  attribute float size;
  attribute float distance;
  
  uniform float time;
  uniform float pixelRatio;
  
  varying vec3 vColor;
  varying float vDistance;
  varying float vSize;
  
  void main() {
    vColor = color;
    vDistance = distance;
    
    // Apply subtle star twinkling based on position and time
    float twinkle = sin(time * 2.0 + position.x * 0.01 + position.z * 0.01) * 0.3 + 0.7;
    vSize = size * twinkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation with distance
    float sizeAttenuation = 300.0 / length(mvPosition.xyz);
    gl_PointSize = vSize * sizeAttenuation * pixelRatio;
  }
`;

/**
 * Fragment shader for main star field
 * Creates circular stars with distance-based intensity
 */
const starFragmentShader = `
  varying vec3 vColor;
  varying float vDistance;
  varying float vSize;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Create soft circular gradient
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = alpha * alpha; // Squared for sharper falloff
    
    // Distance-based brightness
    float brightness = 1.0 / (1.0 + vDistance * 0.0005);
    
    gl_FragColor = vec4(vColor * brightness, alpha);
  }
`;

/**
 * Vertex shader for nebula particles
 * Handles larger, softer particles with procedural movement
 */
const nebulaVertexShader = `
  attribute float size;
  attribute float opacity;
  
  uniform float time;
  uniform float pixelRatio;
  
  varying vec3 vColor;
  varying float vOpacity;
  varying vec2 vUv;
  
  // Simplex noise function for procedural movement
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                                   
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vColor = color;
    vOpacity = opacity;
    
    // Add procedural movement using noise
    vec3 noisePos = position * 0.001 + vec3(time * 0.1, 0.0, time * 0.05);
    float noise = snoise(noisePos) * 50.0;
    
    vec3 animatedPosition = position + vec3(
      sin(time * 0.2 + position.y * 0.01) * noise * 0.1,
      cos(time * 0.1 + position.x * 0.01) * noise * 0.05,
      sin(time * 0.15 + position.z * 0.01) * noise * 0.1
    );
    
    vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Larger size for nebula particles
    float sizeAttenuation = 1000.0 / length(mvPosition.xyz);
    gl_PointSize = size * sizeAttenuation * pixelRatio * 0.5;
    
    vUv = gl_PointCoord;
  }
`;

/**
 * Fragment shader for nebula particles
 * Creates soft, cloudy appearance with noise-based density variation
 */
const nebulaFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying vec2 vUv;
  
  // Simple noise function for cloud texture
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Create cloudy texture using multiple octaves of noise
    vec2 noiseUv = vUv * 8.0;
    float n = noise(noiseUv) * 0.5 + 
              noise(noiseUv * 2.0) * 0.25 + 
              noise(noiseUv * 4.0) * 0.125;
    
    // Soft circular gradient with noise variation
    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vOpacity * n;
    alpha = smoothstep(0.0, 1.0, alpha);
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/**
 * Vertex shader for bright foreground stars
 * Similar to main stars but optimized for bloom effect
 */
const brightStarVertexShader = `
  attribute float size;
  
  uniform float time;
  uniform float pixelRatio;
  
  varying vec3 vColor;
  varying float vIntensity;
  
  void main() {
    vColor = color;
    
    // More pronounced twinkling for bright stars
    float twinkle = sin(time * 3.0 + position.x * 0.02 + position.z * 0.02) * 0.5 + 0.5;
    vIntensity = twinkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float sizeAttenuation = 400.0 / length(mvPosition.xyz);
    gl_PointSize = size * sizeAttenuation * pixelRatio * (0.8 + twinkle * 0.4);
  }
`;

/**
 * Fragment shader for bright stars
 * High intensity output optimized for bloom pass
 */
const brightStarFragmentShader = `
  varying vec3 vColor;
  varying float vIntensity;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Sharp center with soft falloff for bloom
    float alpha = 1.0 - smoothstep(0.0, 0.3, dist);
    float intensity = alpha * vIntensity * 2.0; // Higher intensity for bloom
    
    // Add cross pattern for stellar diffraction spikes
    float cross = max(
      1.0 - abs(center.x) * 8.0,
      1.0 - abs(center.y) * 8.0
    ) * 0.3;
    
    intensity += cross * alpha;
    
    gl_FragColor = vec4(vColor * intensity, alpha);
  }
`;