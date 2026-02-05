'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { isLowEndDevice } from '@/lib/utilities/deviceDetection';

const CDN_BACKGROUND = 'https://res.cloudinary.com/dwqzqxeuk/image/upload/f_auto,q_auto/code-runner/ui/background.webp';

// Dynamically import WebGL components to prevent SSR and reduce bundle size
const SpaceWebGL = dynamic(() => import('./SpaceWebGL').then(mod => ({ default: mod.SpaceWebGL })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="animate-pulse text-purple-400 text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        Loading...
      </div>
    </div>
  )
});

const FuturisticWebGL = dynamic(() => import('./FuturisticWebGL').then(mod => ({ default: mod.FuturisticWebGL })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      <div className="animate-pulse text-cyan-400 text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        Loading...
      </div>
    </div>
  )
});

export function WebGLWrapper({ variant = 'space' }: { variant?: 'space' | 'futuristic' }) {
  const [shouldRender3D, setShouldRender3D] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Disable 3D on low-end devices
    if (isLowEndDevice()) {
      setShouldRender3D(false);
    }
  }, []);

  // Fallback static background for low-end devices
  if (!isClient || !shouldRender3D) {
    return (
      <div className={`fixed inset-0 ${
        variant === 'space' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900'
      }`}>
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${CDN_BACKGROUND}')` }}></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-slate-900">
        <div className="animate-pulse text-white text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          Loading 3D...
        </div>
      </div>
    }>
      {variant === 'space' ? <SpaceWebGL /> : <FuturisticWebGL />}
    </Suspense>
  );
}
