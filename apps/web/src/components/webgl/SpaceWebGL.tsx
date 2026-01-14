'use client';

import { useEffect, useRef } from 'react';

export function SpaceWebGL() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: any;
    camera: any;
    renderer: any;
    stars: any;
    nebula: any;
    grid: any;
    wormhole: any;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const initThreeJS = async () => {
      const THREE = await import('three');

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a0a, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Create starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 15000;
    const starsPositions = new Float32Array(starsCount * 3);
    const starsColors = new Float32Array(starsCount * 3);
    const starsSizes = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      
      // Random positions in a large sphere
      const radius = Math.random() * 1500 + 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      starsPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starsPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starsPositions[i3 + 2] = radius * Math.cos(phi);

      // Star colors (white, blue, red, yellow)
      const colorType = Math.random();
      if (colorType < 0.6) {
        // White stars
        starsColors[i3] = 1;
        starsColors[i3 + 1] = 1;
        starsColors[i3 + 2] = 1;
      } else if (colorType < 0.8) {
        // Blue stars
        starsColors[i3] = 0.7;
        starsColors[i3 + 1] = 0.8;
        starsColors[i3 + 2] = 1;
      } else if (colorType < 0.95) {
        // Red/orange stars
        starsColors[i3] = 1;
        starsColors[i3 + 1] = 0.6;
        starsColors[i3 + 2] = 0.3;
      } else {
        // Bright cyan/special stars
        starsColors[i3] = 0;
        starsColors[i3 + 1] = 1;
        starsColors[i3 + 2] = 1;
      }

      starsSizes[i] = Math.random() * 3 + 0.5;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(starsSizes, 1));

    const starsMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexColors: true,
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5, 0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
          alpha *= 0.8;
          
          // Add twinkle effect
          float twinkle = sin(gl_FragCoord.x * 0.01 + gl_FragCoord.y * 0.01) * 0.3 + 0.7;
          alpha *= twinkle;
          
          gl_FragColor = vec4(vColor * 1.2, alpha);
        }
      `
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create nebula/dust clouds
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaCount = 3000;
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    const nebulaColors = new Float32Array(nebulaCount * 3);
    const nebulaSizes = new Float32Array(nebulaCount);

    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      
      // Clustered positions for nebula effect
      const cluster = Math.floor(Math.random() * 5);
      const clusterOffset = {
        x: (cluster - 2) * 400,
        y: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 800
      };
      
      nebulaPositions[i3] = (Math.random() - 0.5) * 300 + clusterOffset.x;
      nebulaPositions[i3 + 1] = (Math.random() - 0.5) * 300 + clusterOffset.y;
      nebulaPositions[i3 + 2] = (Math.random() - 0.5) * 300 + clusterOffset.z;

      // Nebula colors (cyan, purple, pink)
      const colorType = Math.random();
      if (colorType < 0.4) {
        // Cyan
        nebulaColors[i3] = 0;
        nebulaColors[i3 + 1] = 0.8;
        nebulaColors[i3 + 2] = 1;
      } else if (colorType < 0.8) {
        // Purple
        nebulaColors[i3] = 0.6;
        nebulaColors[i3 + 1] = 0.2;
        nebulaColors[i3 + 2] = 1;
      } else {
        // Pink
        nebulaColors[i3] = 1;
        nebulaColors[i3 + 1] = 0.3;
        nebulaColors[i3 + 2] = 0.8;
      }

      nebulaSizes[i] = Math.random() * 15 + 5;
    }

    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));
    nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(nebulaSizes, 1));

    const nebulaMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5, 0.5));
          float alpha = 1.0 - smoothstep(0.1, 0.5, distanceToCenter);
          alpha *= 0.3;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    });

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    // Camera setup
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    let time = 0;
    let currentAnimationId: number;

    const animate = () => {
      currentAnimationId = requestAnimationFrame(animate);
      time += 0.005;

      // Smooth camera movement
      camera.position.x = Math.sin(time * 0.2) * 50;
      camera.position.y = Math.cos(time * 0.15) * 30;
      camera.position.z = 100 + Math.sin(time * 0.1) * 20;
      camera.lookAt(
        Math.sin(time * 0.1) * 10,
        Math.cos(time * 0.1) * 10,
        0
      );

      // Rotate star field slowly
      stars.rotation.y = time * 0.02;
      stars.rotation.x = time * 0.01;

      // Nebula movement
      nebula.rotation.y = time * -0.015;
      nebula.rotation.z = time * 0.01;

      renderer.render(scene, camera);
      
      // Safely update the ref if it exists
      if (sceneRef.current) {
        sceneRef.current.animationId = currentAnimationId;
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      stars,
      nebula,
      animationId: currentAnimationId
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentAnimationId) {
        cancelAnimationFrame(currentAnimationId);
      }
      if (sceneRef.current) {
        if (mountRef.current && sceneRef.current.renderer.domElement) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        sceneRef.current.scene.clear();
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 z-0"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)' }}
    />
  );
}