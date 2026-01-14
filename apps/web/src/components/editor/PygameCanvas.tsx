'use client';

import { useEffect, useRef } from 'react';

interface PygameCanvasProps {
  bundle: {
    html: string;
    wasm: string;
    data: string;
    js: string;
  };
  onConsoleOutput?: (message: string) => void;
}

export function PygameCanvas({ bundle, onConsoleOutput }: PygameCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for print messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'pygame-console' && onConsoleOutput) {
        const msg = e.data.message.replace(/\x1b\[[0-9;]*m/g, '').trim();

        // Filter system messages
        const systemKeywords = ['Pygbag', 'Loading', '__call__', 'coroutine',
                               'object at 0x', '.call', 'fire_event', 'patch_'];
        const isSystemMsg = systemKeywords.some(kw => msg.includes(kw));

        // Filter short/numeric messages
        const isGarbage = msg.length <= 2 || /^\d+$/.test(msg);

        if (msg && !isSystemMsg && !isGarbage) {
          onConsoleOutput(msg);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onConsoleOutput]);

  useEffect(() => {
    if (!iframeRef.current) return;

    try {
      console.log('[PygameCanvas] Received bundle:', {
        hasHtml: !!bundle.html,
        hasWasm: !!bundle.wasm,
        htmlLength: bundle.html?.length || 0,
        wasmLength: bundle.wasm?.length || 0
      });
      console.log('[PygameCanvas] Decoding and injecting Pygame bundle (0.9.2 format)');

      // Decode base64 encoded files
      const decodedHTML = atob(bundle.html);
      const apkBinary = Uint8Array.from(atob(bundle.wasm), c => c.charCodeAt(0));

      console.log('[PygameCanvas] Decoded HTML length:', decodedHTML.length);
      console.log('[PygameCanvas] APK binary length:', apkBinary.length);

      // Create a separate blob URL for the APK file
      const apkBlob = new Blob([apkBinary], { type: 'application/octet-stream' });
      const apkUrl = URL.createObjectURL(apkBlob);
      console.log('[PygameCanvas] APK Blob URL created:', apkUrl);

      // Replace game.apk reference with the blob URL
      let modifiedHTML = decodedHTML
        .replace(/["']game\.apk["']/g, `"${apkUrl}"`);

      // Create blob URL for the HTML
      const htmlBlob = new Blob([modifiedHTML], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);

      iframeRef.current.src = htmlUrl;

      console.log('[PygameCanvas] HTML Blob URL created:', htmlUrl);
      console.log('[PygameCanvas] Pygame bundle loaded with console capture');

      // Cleanup blob URLs when component unmounts
      return () => {
        URL.revokeObjectURL(htmlUrl);
        URL.revokeObjectURL(apkUrl);
      };
    } catch (error) {
      console.error('[PygameCanvas] Failed to load Pygame bundle:', error);
    }
  }, [bundle]);

  return (
    <div className="relative w-full bg-black rounded-lg border border-neon-purple/30">
      <iframe
        ref={iframeRef}
        className="w-full h-[500px]"
        sandbox="allow-scripts allow-same-origin allow-modals"
        allow="cross-origin-isolated"
        title="Pygame Interactive Canvas"
        onLoad={() => console.log('[PygameCanvas] Iframe loaded')}
        onError={(e) => console.error('[PygameCanvas] Iframe error:', e)}
      />
    </div>
  );
}
