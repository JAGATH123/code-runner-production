'use client';

import { useEffect, useRef } from 'react';

interface MemoryLoadingScreenProps {
  isVisible: boolean;
  text?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function MemoryLoadingScreen({
  isVisible,
  text = "// Scanning your memories...",
  onComplete,
  duration = 3000
}: MemoryLoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    let THREE: any;
    let scene: any;
    let camera: any;
    let renderer: any;
    let composer: any;
    let cubeGroup: any;
    let ring0: any, ring1: any, ring2: any;
    let cylinder: any;

    const initializeScene = async () => {
      try {
        // Dynamically import Three.js modules
        const [
          ThreeModule,
          { EffectComposer },
          { RenderPass },
          { GlitchPass },
          { UnrealBloomPass },
          { ShaderPass },
          { CopyShader }
        ] = await Promise.all([
          import('three'),
          import('three/examples/jsm/postprocessing/EffectComposer.js'),
          import('three/examples/jsm/postprocessing/RenderPass.js'),
          import('three/examples/jsm/postprocessing/GlitchPass.js'),
          import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
          import('three/examples/jsm/postprocessing/ShaderPass.js'),
          import('three/examples/jsm/shaders/CopyShader.js')
        ]);

        THREE = ThreeModule;

        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1);

        if (containerRef.current) {
          containerRef.current.appendChild(renderer.domElement);
        }

        // Effect composer setup
        composer = new EffectComposer(renderer);

        // Window resize handler
        const onWindowResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          composer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onWindowResize, false);

        // Create cube group
        cubeGroup = new THREE.Group();
        scene.add(cubeGroup);

        // Ring creation function
        const makeRing = (radius: number, parent: any) => {
          const geometry = new THREE.CylinderGeometry(radius, radius, 0.1, 64);
          const edges = new THREE.EdgesGeometry(geometry);
          const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x11ee77 }));
          parent.add(line);
          return line;
        };

        // Create rings
        ring0 = makeRing(3, scene);
        ring1 = makeRing(3.3, ring0);
        ring2 = makeRing(3.6, ring1);

        // Create central octahedron
        const octaGeometry = new THREE.OctahedronGeometry(2, 3);
        const octaMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, opacity: 0.8, transparent: true });
        const octaMesh = new THREE.Mesh(octaGeometry, octaMaterial);
        cubeGroup.add(octaMesh);

        const octaEdges = new THREE.EdgesGeometry(octaGeometry);
        const octaLine = new THREE.LineSegments(octaEdges, new THREE.LineBasicMaterial({ color: 0x1188dd }));
        octaLine.scale.set(1.1, 1.1, 1.1);
        cubeGroup.add(octaLine);

        // Create cylinder
        const cylinderGeometry = new THREE.CylinderGeometry(8, 8, 1000, 3);
        const cylinderEdges = new THREE.EdgesGeometry(cylinderGeometry);
        cylinder = new THREE.LineSegments(cylinderEdges, new THREE.LineBasicMaterial({ color: 0x444444 }));
        cylinder.rotation.set(Math.PI / 2, 0, 0);
        scene.add(cylinder);

        // Add lighting
        const light = new THREE.DirectionalLight(0xFFFFFF, 1);
        scene.add(light);
        camera.position.z = 8;

        // Post-processing passes
        const renderScene = new RenderPass(scene, camera);
        const glitchPass = new GlitchPass();
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 3, 1, 0.4);
        const finalPass = new ShaderPass(CopyShader);
        finalPass.renderToScreen = true;

        composer.addPass(renderScene);
        composer.addPass(glitchPass);
        composer.addPass(bloomPass);
        composer.addPass(finalPass);

        // Animation loop
        const animate = () => {
          if (!isVisible) return;

          cubeGroup.rotation.x += 0.01;
          cubeGroup.rotation.y += 0.03;
          ring0.rotation.x += 0.011;
          ring0.rotation.y += 0.032;
          ring1.rotation.z += 0.013;
          ring1.rotation.y += 0.034;
          ring2.rotation.x += 0.015;
          ring2.rotation.y += 0.036;
          cylinder.rotation.y += 0.002;
          cylinder.rotation.x -= 0.001;
          cylinder.rotation.z += 0.003;

          composer.render();
          animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Store references
        sceneRef.current = scene;
        rendererRef.current = renderer;

        // Auto-complete after duration
        if (duration && onComplete) {
          setTimeout(() => {
            onComplete();
          }, duration);
        }

      } catch (error) {
        console.error('Error initializing Three.js scene:', error);
        // Fallback to simple loading if Three.js fails
        if (onComplete) {
          setTimeout(onComplete, duration || 3000);
        }
      }
    };

    initializeScene();

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      window.removeEventListener('resize', () => {});
    };
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Three.js Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#000' }}
      />

      {/* Loading Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1
          className="text-white font-mono uppercase tracking-widest text-xs text-center z-10"
          style={{
            fontFamily: "'VT323', monospace",
            position: 'absolute',
            top: '70vh',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            letterSpacing: '0.3em',
            fontWeight: 'normal'
          }}
        >
          {text}
        </h1>
      </div>

      {/* VT323 Font Preload */}
      <link
        href="https://fonts.googleapis.com/css?family=VT323&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}