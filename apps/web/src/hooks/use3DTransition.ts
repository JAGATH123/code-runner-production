import { useRef, useCallback } from 'react';
import { TornadoPortalTransition, PortalConfig } from '../lib/three/TornadoPortalTransition';

export function use3DTransition() {
  const portalTransitionRef = useRef<TornadoPortalTransition | null>(null);

  const createPortalTransition = useCallback(async (href: string, cardType: 'novice' | 'advanced', playBeepsSound?: () => void) => {
    try {
      // Clean up existing transition
      if (portalTransitionRef.current) {
        portalTransitionRef.current.cleanup();
      }

      // Create new tornado portal transition
      const portalTransition = new TornadoPortalTransition();
      portalTransitionRef.current = portalTransition;

      const config: PortalConfig = {
        targetColor: cardType === 'novice' ? 0x00ffff : 0xff00ff,
        secondaryColor: cardType === 'novice' ? 0x0066cc : 0x9933ff,
        href,
        cardType,
        playBeepsSound
      };

      // Initialize the tornado portal system
      await portalTransition.initialize(config);

      // Start the tornado transition
      await portalTransition.startTransition(config);

    } catch (error) {
      console.error('Tornado portal transition error:', error);
      
      // Fallback navigation
      setTimeout(() => {
        window.location.href = href;
      }, 500);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (portalTransitionRef.current) {
      portalTransitionRef.current.cleanup();
      portalTransitionRef.current = null;
    }
  }, []);

  return {
    initializeScene: () => {}, // Not needed for tornado portal system
    triggerTransition: createPortalTransition,
    cleanup
  };
}