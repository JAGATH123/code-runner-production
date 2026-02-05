'use client';

import { useState, useRef } from 'react';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dwqzqxeuk';
const CDN_ARTBOARD = `${CLOUDINARY_BASE}/image/upload/f_auto,q_auto/code-runner/cheatsheets/artboard-1.png`;

export interface CheatSheetBox {
  number: number;
  title: string;
  description: string;
  code_example: string;
  tip: string;
}

interface CheatSheetTemplateProps {
  title: string;
  subtitle: string;
  boxes: CheatSheetBox[];
  templateVersion?: string;
}

interface BoxPosition {
  left: number;      // Pixels from left
  top: number;       // Pixels from top
  width: number;     // Width in pixels
  height: number;    // Height in pixels
  fontSize: number;  // Font size in pixels
}

// Template dimensions - FIXED SIZE
const TEMPLATE_WIDTH = 1920;
const TEMPLATE_HEIGHT = 2350;
const DISPLAY_SCALE = 0.6; // Scale down to 60% for better viewing (1152 × 1410)

export default function CheatSheetTemplateInteractive({
  title,
  subtitle,
  boxes,
  templateVersion = 'v1'
}: CheatSheetTemplateProps) {
  const sortedBoxes = [...boxes].sort((a, b) => a.number - b.number);

  // State for each element's position and size - ALL IN PIXELS
  const [titlePos, setTitlePos] = useState<BoxPosition>({
    left: 960,  // Center
    top: 50,
    width: 1600,
    height: 80,
    fontSize: 48
  });

  const [subtitlePos, setSubtitlePos] = useState<BoxPosition>({
    left: 960,  // Center
    top: 120,
    width: 1600,
    height: 50,
    fontSize: 24
  });

  const [leftBoxes, setLeftBoxes] = useState<BoxPosition[]>([
    { left: 50, top: 250, width: 800, height: 250, fontSize: 20 },
    { left: 50, top: 550, width: 800, height: 250, fontSize: 20 },
    { left: 50, top: 850, width: 800, height: 250, fontSize: 20 },
    { left: 50, top: 1150, width: 800, height: 250, fontSize: 20 },
    { left: 50, top: 1450, width: 800, height: 250, fontSize: 20 }
  ]);

  const [rightBoxes, setRightBoxes] = useState<BoxPosition[]>([
    { left: 1070, top: 250, width: 800, height: 250, fontSize: 20 },
    { left: 1070, top: 550, width: 800, height: 250, fontSize: 20 },
    { left: 1070, top: 850, width: 800, height: 250, fontSize: 20 },
    { left: 1070, top: 1150, width: 800, height: 250, fontSize: 20 },
    { left: 1070, top: 1450, width: 800, height: 250, fontSize: 20 }
  ]);

  const [dragging, setDragging] = useState<{ type: string; index: number } | null>(null);
  const [resizing, setResizing] = useState<{ type: string; index: number } | null>(null);
  const [currentPixels, setCurrentPixels] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, type: string, index: number) => {
    e.preventDefault();
    if (e.shiftKey) {
      setResizing({ type, index });
    } else {
      setDragging({ type, index });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Calculate pixel position within the 1920×2350 canvas
    // Account for the display scale
    const pixelX = Math.round((e.clientX - rect.left) / DISPLAY_SCALE);
    const pixelY = Math.round((e.clientY - rect.top) / DISPLAY_SCALE);

    setCurrentPixels({ x: pixelX, y: pixelY });

    if (dragging) {
      if (dragging.type === 'title') {
        setTitlePos(prev => ({ ...prev, left: pixelX, top: pixelY }));
      } else if (dragging.type === 'subtitle') {
        setSubtitlePos(prev => ({ ...prev, left: pixelX, top: pixelY }));
      } else if (dragging.type === 'left') {
        setLeftBoxes(prev => prev.map((box, i) =>
          i === dragging.index ? { ...box, left: pixelX, top: pixelY } : box
        ));
      } else if (dragging.type === 'right') {
        setRightBoxes(prev => prev.map((box, i) =>
          i === dragging.index ? { ...box, left: pixelX, top: pixelY } : box
        ));
      }
    }

    if (resizing) {
      const deltaPixels = Math.round(e.movementX / DISPLAY_SCALE);
      if (resizing.type === 'title') {
        setTitlePos(prev => ({ ...prev, width: Math.max(100, Math.min(TEMPLATE_WIDTH, prev.width + deltaPixels)) }));
      } else if (resizing.type === 'subtitle') {
        setSubtitlePos(prev => ({ ...prev, width: Math.max(100, Math.min(TEMPLATE_WIDTH, prev.width + deltaPixels)) }));
      } else if (resizing.type === 'left') {
        setLeftBoxes(prev => prev.map((box, i) =>
          i === resizing.index ? { ...box, width: Math.max(100, Math.min(1000, box.width + deltaPixels)) } : box
        ));
      } else if (resizing.type === 'right') {
        setRightBoxes(prev => prev.map((box, i) =>
          i === resizing.index ? { ...box, width: Math.max(100, Math.min(1000, box.width + deltaPixels)) } : box
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const exportPositions = () => {
    const config = {
      width: TEMPLATE_WIDTH,
      height: TEMPLATE_HEIGHT,
      header: {
        title: titlePos,
        subtitle: subtitlePos
      },
      boxes: {
        code: leftBoxes,
        tip: rightBoxes
      }
    };

    console.log('📋 ===============================================');
    console.log('✅ COPY THIS TO CheatSheetTemplate.tsx CONFIG:');
    console.log('📋 ===============================================');
    console.log(JSON.stringify(config, null, 2));
    console.log('📋 ===============================================');

    alert('✅ Configuration exported to console!\n\nPress F12 → Console tab to copy.\n\nPaste into CheatSheetTemplate.tsx CONFIG object.');
  };

  const changeFontSize = (type: string, index: number, delta: number) => {
    if (type === 'title') {
      setTitlePos(prev => ({ ...prev, fontSize: Math.max(12, Math.min(96, prev.fontSize + delta)) }));
    } else if (type === 'subtitle') {
      setSubtitlePos(prev => ({ ...prev, fontSize: Math.max(8, Math.min(48, prev.fontSize + delta)) }));
    } else if (type === 'left') {
      setLeftBoxes(prev => prev.map((box, i) =>
        i === index ? { ...box, fontSize: Math.max(8, Math.min(32, box.fontSize + delta)) } : box
      ));
    } else if (type === 'right') {
      setRightBoxes(prev => prev.map((box, i) =>
        i === index ? { ...box, fontSize: Math.max(8, Math.min(32, box.fontSize + delta)) } : box
      ));
    }
  };

  const changeWidth = (type: string, index: number, delta: number) => {
    if (type === 'title') {
      setTitlePos(prev => ({ ...prev, width: Math.max(200, Math.min(TEMPLATE_WIDTH, prev.width + delta)) }));
    } else if (type === 'subtitle') {
      setSubtitlePos(prev => ({ ...prev, width: Math.max(200, Math.min(TEMPLATE_WIDTH, prev.width + delta)) }));
    } else if (type === 'left') {
      setLeftBoxes(prev => prev.map((box, i) =>
        i === index ? { ...box, width: Math.max(200, Math.min(1200, box.width + delta)) } : box
      ));
    } else if (type === 'right') {
      setRightBoxes(prev => prev.map((box, i) =>
        i === index ? { ...box, width: Math.max(200, Math.min(1200, box.width + delta)) } : box
      ));
    }
  };

  const changeHeight = (type: string, index: number, delta: number) => {
    if (type === 'title') {
      setTitlePos(prev => ({ ...prev, height: Math.max(50, Math.min(300, prev.height + delta)) }));
    } else if (type === 'subtitle') {
      setSubtitlePos(prev => ({ ...prev, height: Math.max(30, Math.min(200, prev.height + delta)) }));
    } else if (type === 'left') {
      setLeftBoxes(prev => prev.map((box, i) =>
        i === index ? { ...box, height: Math.max(100, Math.min(600, box.height + delta)) } : box
      ));
    } else if (type === 'right') {
      setRightBoxes(prev => prev.map((box, i) =>
        i === index ? { ...box, height: Math.max(100, Math.min(600, box.height + delta)) } : box
      ));
    }
  };

  // Convert pixel positions to percentages for display
  const toPercent = (pixels: number, dimension: 'width' | 'height') => {
    const total = dimension === 'width' ? TEMPLATE_WIDTH : TEMPLATE_HEIGHT;
    return (pixels / total) * 100;
  };

  return (
    <div className="relative w-full min-w-max">
      {/* Controls */}
      <div className="mb-4 p-4 bg-gray-900 rounded-lg sticky top-0 z-50 max-w-full">
        <h3 className="text-white font-bold mb-2 text-xl">🎨 Layout Container Editor</h3>
        <div className="text-white text-sm space-y-1 mb-3">
          <p className="text-cyan-300 font-bold">📐 Template Size: {TEMPLATE_WIDTH} × {TEMPLATE_HEIGHT} pixels (scaled to {Math.round(DISPLAY_SCALE * 100)}% for viewing)</p>
          <p className="text-yellow-300 font-bold">📍 Current Position: X: {currentPixels.x}px, Y: {currentPixels.y}px</p>
          <p className="text-green-300 font-bold">🎯 Goal: Position & size the COLORED BOXES to match template areas</p>
        </div>
        <div className="text-white text-sm space-y-1 mb-3">
          <p>• <strong>Drag boxes</strong> to position them over template areas</p>
          <p>• <strong>⬅️ ➡️ buttons</strong> adjust container width</p>
          <p>• <strong>⬆️ ⬇️ buttons</strong> adjust container height</p>
          <p>• <strong>Text is just for reference</strong> - focus on box boundaries</p>
          <p>• <strong>Hover</strong> to see exact box dimensions</p>
        </div>
        <button
          onClick={exportPositions}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-600 shadow-lg"
        >
          📋 Export Pixel Positions to Console
        </button>
      </div>

      {/* Wrapper for scaled container */}
      <div
        className="mx-auto"
        style={{
          width: `${TEMPLATE_WIDTH * DISPLAY_SCALE}px`,
          height: `${TEMPLATE_HEIGHT * DISPLAY_SCALE}px`,
        }}
      >
        {/* Template Container - Fixed 1920×2350 - Scaled for viewing */}
        <div
          ref={containerRef}
          className="relative bg-black"
          style={{
            width: `${TEMPLATE_WIDTH}px`,
            height: `${TEMPLATE_HEIGHT}px`,
            transform: `scale(${DISPLAY_SCALE})`,
            transformOrigin: 'top left',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
        {/* Background Image */}
        <img
          src={CDN_ARTBOARD}
          alt="Template"
          className="select-none pointer-events-none"
          draggable={false}
          style={{
            width: `${TEMPLATE_WIDTH}px`,
            height: `${TEMPLATE_HEIGHT}px`,
            display: 'block'
          }}
        />

        {/* Title - Draggable */}
        <div
          className="absolute cursor-move hover:ring-4 hover:ring-yellow-400 transition-all"
          style={{
            left: `${toPercent(titlePos.left, 'width')}%`,
            top: `${toPercent(titlePos.top, 'height')}%`,
            width: `${toPercent(titlePos.width, 'width')}%`,
            height: `${toPercent(titlePos.height, 'height')}%`,
            transform: 'translateX(-50%)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'title', 0)}
        >
          <div className="relative group h-full flex items-center justify-center overflow-hidden">
            <div className="absolute -top-6 left-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
              Title: {titlePos.left}px, {titlePos.top}px | W:{titlePos.width}px H:{titlePos.height}px | Font:{titlePos.fontSize}px
            </div>
            <h1
              className="font-bold text-center select-none"
              style={{
                color: '#FFFFFF',
                textShadow: '0 0 10px rgba(0, 191, 255, 0.5)',
                fontSize: `${titlePos.fontSize}px`,
                fontFamily: 'var(--font-space), monospace'
              }}
            >
              {title}
            </h1>
            <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); changeFontSize('title', 0, -2); }} className="w-8 h-8 bg-red-500 text-white rounded font-bold text-xs" title="Smaller font">-</button>
              <button onClick={(e) => { e.stopPropagation(); changeFontSize('title', 0, 2); }} className="w-8 h-8 bg-green-500 text-white rounded font-bold text-xs" title="Larger font">+</button>
            </div>
            <div className="absolute -left-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); changeWidth('title', 0, -50); }} className="w-8 h-8 bg-orange-500 text-white rounded font-bold text-xs" title="Narrower">⬅️</button>
              <button onClick={(e) => { e.stopPropagation(); changeWidth('title', 0, 50); }} className="w-8 h-8 bg-blue-500 text-white rounded font-bold text-xs" title="Wider">➡️</button>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); changeHeight('title', 0, -20); }} className="w-8 h-8 bg-purple-500 text-white rounded font-bold text-xs" title="Shorter">⬆️</button>
              <button onClick={(e) => { e.stopPropagation(); changeHeight('title', 0, 20); }} className="w-8 h-8 bg-pink-500 text-white rounded font-bold text-xs" title="Taller">⬇️</button>
            </div>
          </div>
        </div>

        {/* Subtitle - Draggable */}
        <div
          className="absolute cursor-move hover:ring-4 hover:ring-yellow-400 transition-all"
          style={{
            left: `${toPercent(subtitlePos.left, 'width')}%`,
            top: `${toPercent(subtitlePos.top, 'height')}%`,
            width: `${toPercent(subtitlePos.width, 'width')}%`,
            height: `${toPercent(subtitlePos.height, 'height')}%`,
            transform: 'translateX(-50%)',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            backgroundColor: 'rgba(255, 215, 0, 0.05)',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'subtitle', 0)}
        >
          <div className="relative group h-full flex items-center justify-center overflow-hidden">
            <div className="absolute -top-6 left-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
              Subtitle: {subtitlePos.left}px, {subtitlePos.top}px | W:{subtitlePos.width}px H:{subtitlePos.height}px | Font:{subtitlePos.fontSize}px
            </div>
            <h2
              className="font-bold text-center select-none"
              style={{
                color: '#FFD700',
                fontSize: `${subtitlePos.fontSize}px`,
                fontFamily: 'var(--font-space), monospace'
              }}
            >
              {subtitle}
            </h2>
            <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); changeFontSize('subtitle', 0, -2); }} className="w-8 h-8 bg-red-500 text-white rounded font-bold text-xs" title="Smaller font">-</button>
              <button onClick={(e) => { e.stopPropagation(); changeFontSize('subtitle', 0, 2); }} className="w-8 h-8 bg-green-500 text-white rounded font-bold text-xs" title="Larger font">+</button>
            </div>
            <div className="absolute -left-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); changeWidth('subtitle', 0, -50); }} className="w-8 h-8 bg-orange-500 text-white rounded font-bold text-xs" title="Narrower">⬅️</button>
              <button onClick={(e) => { e.stopPropagation(); changeWidth('subtitle', 0, 50); }} className="w-8 h-8 bg-blue-500 text-white rounded font-bold text-xs" title="Wider">➡️</button>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); changeHeight('subtitle', 0, -20); }} className="w-8 h-8 bg-purple-500 text-white rounded font-bold text-xs" title="Shorter">⬆️</button>
              <button onClick={(e) => { e.stopPropagation(); changeHeight('subtitle', 0, 20); }} className="w-8 h-8 bg-pink-500 text-white rounded font-bold text-xs" title="Taller">⬇️</button>
            </div>
          </div>
        </div>

        {/* Left Column Boxes (Code) - Draggable */}
        {sortedBoxes.map((box, index) => {
          const pos = leftBoxes[index];
          return (
            <div
              key={`left-${box.number}`}
              className="absolute cursor-move hover:ring-4 hover:ring-cyan-400 transition-all"
              style={{
                left: `${toPercent(pos.left, 'width')}%`,
                top: `${toPercent(pos.top, 'height')}%`,
                width: `${toPercent(pos.width, 'width')}%`,
                height: `${toPercent(pos.height, 'height')}%`,
                border: '2px solid rgba(0, 255, 255, 0.5)',
                backgroundColor: 'rgba(0, 255, 255, 0.05)',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'left', index)}
            >
              <div className="relative group p-2 h-full overflow-hidden">
                <div className="absolute -top-6 left-0 bg-cyan-500 text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  Box {box.number}: {pos.left}px, {pos.top}px | W:{pos.width}px H:{pos.height}px | Font:{pos.fontSize}px
                </div>

                <h3
                  className="font-bold mb-1 select-none"
                  style={{
                    color: '#FFD700',
                    fontSize: `${pos.fontSize}px`,
                    fontFamily: 'var(--font-space), monospace',
                  }}
                >
                  {box.title}
                </h3>
                <p
                  className="leading-tight mb-1 select-none"
                  style={{
                    color: '#E0E0E0',
                    fontSize: `${pos.fontSize * 0.75}px`,
                    fontFamily: 'var(--font-mono), monospace',
                  }}
                >
                  {box.description}
                </p>
                <pre
                  className="p-1 rounded overflow-x-auto select-none"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: '#00FF00',
                    fontSize: `${pos.fontSize * 0.65}px`,
                    fontFamily: 'monospace',
                    border: '1px solid rgba(0, 191, 255, 0.3)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <code>{box.code_example.replace(/\\n/g, '\n')}</code>
                </pre>

                <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); changeFontSize('left', index, -1); }} className="w-8 h-8 bg-red-500 text-white rounded font-bold text-xs" title="Smaller font">-</button>
                  <button onClick={(e) => { e.stopPropagation(); changeFontSize('left', index, 1); }} className="w-8 h-8 bg-green-500 text-white rounded font-bold text-xs" title="Larger font">+</button>
                </div>
                <div className="absolute -left-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); changeWidth('left', index, -50); }} className="w-8 h-8 bg-orange-500 text-white rounded font-bold text-xs" title="Narrower">⬅️</button>
                  <button onClick={(e) => { e.stopPropagation(); changeWidth('left', index, 50); }} className="w-8 h-8 bg-blue-500 text-white rounded font-bold text-xs" title="Wider">➡️</button>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); changeHeight('left', index, -30); }} className="w-8 h-8 bg-purple-500 text-white rounded font-bold text-xs" title="Shorter">⬆️</button>
                  <button onClick={(e) => { e.stopPropagation(); changeHeight('left', index, 30); }} className="w-8 h-8 bg-pink-500 text-white rounded font-bold text-xs" title="Taller">⬇️</button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Right Column Tips - Draggable */}
        {sortedBoxes.map((box, index) => {
          const pos = rightBoxes[index];
          return (
            <div
              key={`right-${box.number}`}
              className="absolute cursor-move hover:ring-4 hover:ring-yellow-400 transition-all"
              style={{
                left: `${toPercent(pos.left, 'width')}%`,
                top: `${toPercent(pos.top, 'height')}%`,
                width: `${toPercent(pos.width, 'width')}%`,
                height: `${toPercent(pos.height, 'height')}%`,
                border: '2px solid rgba(255, 215, 0, 0.5)',
                backgroundColor: 'rgba(255, 215, 0, 0.05)',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'right', index)}
            >
              <div className="relative group p-2 h-full overflow-hidden">
                <div className="absolute -top-6 left-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  Tip {box.number}: {pos.left}px, {pos.top}px | W:{pos.width}px H:{pos.height}px | Font:{pos.fontSize}px
                </div>

                <h4
                  className="font-bold mb-1 select-none"
                  style={{
                    color: '#FFD700',
                    fontSize: `${pos.fontSize}px`,
                    fontFamily: 'var(--font-space), monospace',
                  }}
                >
                  Tip
                </h4>
                <p
                  className="leading-tight select-none"
                  style={{
                    color: '#E0E0E0',
                    fontSize: `${pos.fontSize * 0.75}px`,
                    fontFamily: 'var(--font-mono), monospace',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {box.tip.replace(/\\n/g, '\n')}
                </p>

                <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); changeFontSize('right', index, -1); }} className="w-8 h-8 bg-red-500 text-white rounded font-bold text-xs" title="Smaller font">-</button>
                  <button onClick={(e) => { e.stopPropagation(); changeFontSize('right', index, 1); }} className="w-8 h-8 bg-green-500 text-white rounded font-bold text-xs" title="Larger font">+</button>
                </div>
                <div className="absolute -left-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); changeWidth('right', index, -50); }} className="w-8 h-8 bg-orange-500 text-white rounded font-bold text-xs" title="Narrower">⬅️</button>
                  <button onClick={(e) => { e.stopPropagation(); changeWidth('right', index, 50); }} className="w-8 h-8 bg-blue-500 text-white rounded font-bold text-xs" title="Wider">➡️</button>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); changeHeight('right', index, -30); }} className="w-8 h-8 bg-purple-500 text-white rounded font-bold text-xs" title="Shorter">⬆️</button>
                  <button onClick={(e) => { e.stopPropagation(); changeHeight('right', index, 30); }} className="w-8 h-8 bg-pink-500 text-white rounded font-bold text-xs" title="Taller">⬇️</button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
