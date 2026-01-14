'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function FuturisticWebGL() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Enhanced Particle System with Advanced Shaders
    const particleCount = 8000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Create layered depth distribution
      const layer = Math.random();
      let spread = 0;
      if (layer < 0.3) spread = 200;
      else if (layer < 0.6) spread = 400;
      else spread = 600;
      
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * spread;

      // Cyberpunk color palette
      const colorType = Math.random();
      if (colorType < 0.25) {
        colors[i3] = 0.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0; // Cyan
      } else if (colorType < 0.5) {
        colors[i3] = 0.6; colors[i3 + 1] = 0.0; colors[i3 + 2] = 1.0; // Purple
      } else if (colorType < 0.75) {
        colors[i3] = 1.0; colors[i3 + 1] = 0.0; colors[i3 + 2] = 0.6; // Pink
      } else {
        colors[i3] = 0.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 0.4; // Green
      }

      sizes[i] = Math.random() * 3 + 0.5;
      
      // Add movement vectors
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Advanced Particle Shader
    const particleShader = new THREE.ShaderMaterial({
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        time: { value: 0.0 },
        pixelRatio: { value: renderer.getPixelRatio() }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float time;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Add wave motion
          pos.x += sin(time * 0.5 + position.y * 0.01) * 2.0;
          pos.y += cos(time * 0.3 + position.x * 0.01) * 2.0;
          pos.z += sin(time * 0.7 + position.x * 0.005 + position.y * 0.005) * 3.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          // Distance-based alpha
          float dist = length(mvPosition.xyz);
          vAlpha = 1.0 - smoothstep(50.0, 300.0, dist);
          
          // Pulsing effect
          float pulse = sin(time * 3.0 + dist * 0.01) * 0.3 + 0.7;
          vAlpha *= pulse;
          
          gl_PointSize = size * (300.0 / -mvPosition.z) * pixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float time;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Soft circular gradient
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= vAlpha;
          
          // Add glow effect
          float glow = 1.0 - smoothstep(0.0, 0.8, dist);
          glow *= 0.3;
          
          // Subtle flicker
          float flicker = sin(time * 10.0 + gl_FragCoord.x * 0.01) * 0.05 + 0.95;
          
          vec3 finalColor = vColor * (1.0 + glow) * flicker * 2.0;
          gl_FragColor = vec4(finalColor, alpha * 0.8);
        }
      `
    });

    const particles = new THREE.Points(particlesGeometry, particleShader);
    scene.add(particles);

    // Geometric Grid Lines
    const gridGeometry = new THREE.BufferGeometry();
    const gridSize = 300;
    const divisions = 20;
    const gridPositions = [];
    
    // Create grid lines
    for (let i = -divisions; i <= divisions; i++) {
      const pos = (i / divisions) * gridSize;
      
      // Horizontal lines
      gridPositions.push(-gridSize, pos, -200);
      gridPositions.push(gridSize, pos, -200);
      
      // Vertical lines  
      gridPositions.push(pos, -gridSize, -200);
      gridPositions.push(pos, gridSize, -200);
    }

    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));

    const gridShader = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0.0 },
        opacity: { value: 0.15 }
      },
      vertexShader: `
        varying vec3 vPosition;
        uniform float time;
        
        void main() {
          vPosition = position;
          vec3 pos = position;
          
          // Add subtle wave animation
          pos.z += sin(pos.x * 0.01 + time) * 5.0;
          pos.z += cos(pos.y * 0.01 + time * 0.7) * 3.0;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        uniform float time;
        uniform float opacity;
        
        void main() {
          float dist = length(vPosition.xy);
          float fade = 1.0 - smoothstep(200.0, 300.0, dist);
          
          // Scanning effect
          float scan = sin(vPosition.y * 0.01 + time * 2.0) * 0.5 + 0.5;
          
          vec3 color = vec3(0.0, 1.0, 1.0); // Cyan
          gl_FragColor = vec4(color, opacity * fade * scan);
        }
      `
    });

    const grid = new THREE.LineSegments(gridGeometry, gridShader);
    scene.add(grid);

    // Central Energy Core
    const coreGeometry = new THREE.SphereGeometry(30, 32, 32);
    const coreShader = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          
          // Add subtle morphing
          float morph = sin(time * 2.0) * 0.1 + 1.0;
          pos *= morph;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;
        
        void main() {
          vec3 viewDirection = normalize(vPosition);
          float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
          
          // Energy ripples
          float ripple = sin(length(vPosition) * 0.1 - time * 5.0) * 0.5 + 0.5;
          
          // Color cycling
          vec3 color1 = vec3(0.0, 1.0, 1.0); // Cyan
          vec3 color2 = vec3(0.6, 0.0, 1.0); // Purple
          vec3 color3 = vec3(1.0, 0.0, 0.6); // Pink
          
          float cycle = sin(time * 0.5) * 0.5 + 0.5;
          vec3 color = mix(mix(color1, color2, cycle), color3, ripple);
          
          float alpha = fresnel * 0.4 + ripple * 0.2;
          
          gl_FragColor = vec4(color * 2.0, alpha);
        }
      `
    });

    const core = new THREE.Mesh(coreGeometry, coreShader);
    core.position.set(0, 0, -150);
    scene.add(core);

    // Data Flow Lines
    const flowGeometry = new THREE.BufferGeometry();
    const flowPoints = [];
    const flowColors = [];
    const numFlows = 100;

    for (let i = 0; i < numFlows; i++) {
      const angle = (i / numFlows) * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      
      for (let j = 0; j < 20; j++) {
        const t = j / 19;
        const x = Math.cos(angle) * radius * (1 - t * 0.5);
        const y = Math.sin(angle) * radius * (1 - t * 0.5);
        const z = -100 - t * 200;
        
        flowPoints.push(x, y, z);
        
        // Color based on flow index
        const hue = (i / numFlows + t * 0.3) % 1;
        if (hue < 0.33) {
          flowColors.push(0, 1, 1); // Cyan
        } else if (hue < 0.66) {
          flowColors.push(0.6, 0, 1); // Purple
        } else {
          flowColors.push(1, 0, 0.6); // Pink
        }
      }
    }

    flowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(flowPoints, 3));
    flowGeometry.setAttribute('color', new THREE.Float32BufferAttribute(flowColors, 3));

    const flowShader = new THREE.ShaderMaterial({
      transparent: true,
      vertexColors: true,
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Flow animation
          float flow = sin(pos.z * 0.02 + time * 3.0) * 10.0;
          pos.x += flow * 0.1;
          pos.y += flow * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor * 1.5, 0.6);
        }
      `
    });

    const flows = new THREE.LineSegments(flowGeometry, flowShader);
    scene.add(flows);

    // Camera positioning
    camera.position.set(0, 50, 200);
    camera.lookAt(0, 0, -100);

    let time = 0;
    let currentAnimationId: number;

    const animate = () => {
      currentAnimationId = requestAnimationFrame(animate);
      time += 0.016;

      // Update all shader uniforms
      particleShader.uniforms.time.value = time;
      gridShader.uniforms.time.value = time;
      coreShader.uniforms.time.value = time;
      flowShader.uniforms.time.value = time;

      // Smooth camera movement
      const radius = 250;
      const speed = 0.05;
      camera.position.x = Math.sin(time * speed) * radius * 0.3;
      camera.position.y = 50 + Math.cos(time * speed * 0.7) * 30;
      camera.position.z = 200 + Math.sin(time * speed * 0.5) * 50;
      
      // Dynamic look-at
      const lookX = Math.sin(time * 0.02) * 20;
      const lookY = Math.cos(time * 0.03) * 15;
      camera.lookAt(lookX, lookY, -100);

      // Rotate elements
      particles.rotation.y = time * 0.01;
      core.rotation.x = time * 0.2;
      core.rotation.y = time * 0.15;
      flows.rotation.z = time * 0.02;

      // Update particle positions for flow effect
      const positionArray = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Flowing movement
        positionArray[i3] += velocities[i3];
        positionArray[i3 + 1] += velocities[i3 + 1];
        positionArray[i3 + 2] += velocities[i3 + 2];
        
        // Boundary wrapping
        if (Math.abs(positionArray[i3]) > 300) velocities[i3] *= -1;
        if (Math.abs(positionArray[i3 + 1]) > 300) velocities[i3 + 1] *= -1;
        if (Math.abs(positionArray[i3 + 2]) > 300) velocities[i3 + 2] *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      
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
      particleShader.uniforms.pixelRatio.value = renderer.getPixelRatio();
    };

    window.addEventListener('resize', handleResize);

    sceneRef.current = {
      scene,
      camera,
      renderer,
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
      style={{ 
        background: 'radial-gradient(ellipse at center, #001122 0%, #000811 50%, #000305 100%)' 
      }}
    />
  );
}