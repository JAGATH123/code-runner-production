'use client';

import { Lightbulb } from 'lucide-react';
import { useState } from 'react';

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

export default function CheatSheetTemplateDebug({
  title,
  subtitle,
  boxes,
  templateVersion = 'v1'
}: CheatSheetTemplateProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [topOffset, setTopOffset] = useState(14); // Top offset percentage
  const [headerTop, setHeaderTop] = useState(2); // Header top percentage
  const [contentHeight, setContentHeight] = useState(72); // Content height percentage
  const [sidePadding, setSidePadding] = useState(12); // Side padding (in Tailwind units)

  const sortedBoxes = [...boxes].sort((a, b) => a.number - b.number);

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Debug Controls */}
      <div className="absolute -top-32 left-0 right-0 z-50 bg-gray-900 p-4 rounded-lg shadow-lg">
        <h3 className="text-white font-bold mb-3">🔧 Debug Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-white text-xs block mb-1">Header Top: {headerTop}%</label>
            <input
              type="range"
              min="0"
              max="10"
              value={headerTop}
              onChange={(e) => setHeaderTop(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-white text-xs block mb-1">Content Top: {topOffset}%</label>
            <input
              type="range"
              min="10"
              max="25"
              value={topOffset}
              onChange={(e) => setTopOffset(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-white text-xs block mb-1">Content Height: {contentHeight}%</label>
            <input
              type="range"
              min="60"
              max="85"
              value={contentHeight}
              onChange={(e) => setContentHeight(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-white text-xs block mb-1">Side Padding: {sidePadding}</label>
            <input
              type="range"
              min="4"
              max="20"
              value={sidePadding}
              onChange={(e) => setSidePadding(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <div className="text-white text-xs mt-2">
            Copy values: top-[{topOffset}%] h-[{contentHeight}%] px-{sidePadding}
          </div>
        </div>
      </div>

      {/* Template Background Image */}
      <img
        src={CDN_ARTBOARD}
        alt="Cheat Sheet Template Background"
        className="w-full h-auto"
        style={{ display: 'block' }}
      />

      {/* Debug Grid Overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Horizontal Lines */}
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(percent => (
            <div
              key={`h-${percent}`}
              className="absolute left-0 right-0"
              style={{
                top: `${percent}%`,
                borderTop: '1px dashed rgba(255, 0, 0, 0.5)'
              }}
            >
              <span className="text-red-500 text-xs bg-black px-1">{percent}%</span>
            </div>
          ))}
          {/* Vertical Lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <div
              key={`v-${percent}`}
              className="absolute top-0 bottom-0"
              style={{
                left: `${percent}%`,
                borderLeft: '1px dashed rgba(0, 255, 0, 0.5)'
              }}
            >
              <span className="text-green-500 text-xs bg-black px-1">{percent}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Content Overlay Container */}
      <div className="absolute inset-0">
        {/* Header Section */}
        <div
          className="absolute left-0 right-0 h-[10%] flex flex-col items-center justify-center px-8"
          style={{ top: `${headerTop}%` }}
        >
          <h1
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center"
            style={{
              color: '#FFFFFF',
              textShadow: '0 0 10px rgba(0, 191, 255, 0.5)',
              fontFamily: 'var(--font-space), monospace'
            }}
          >
            {title}
          </h1>
          <h2
            className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-center mt-1"
            style={{
              color: '#FFD700',
              fontFamily: 'var(--font-space), monospace'
            }}
          >
            {subtitle}
          </h2>
        </div>

        {/* Main Content Grid */}
        <div
          className="absolute left-0 right-0 grid grid-cols-2 gap-x-2"
          style={{
            top: `${topOffset}%`,
            height: `${contentHeight}%`,
            paddingLeft: `${sidePadding * 0.25}rem`,
            paddingRight: `${sidePadding * 0.25}rem`
          }}
        >
          {/* Left Column - Concept Boxes */}
          <div className="flex flex-col justify-between">
            {sortedBoxes.map((box) => (
              <div
                key={box.number}
                className="relative p-2 sm:p-3 md:p-4"
                style={{
                  height: `${100 / 5}%`,
                }}
              >
                {/* Box Number Badge */}
                <div
                  className="absolute -left-1 sm:-left-2 top-1 sm:top-2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg"
                  style={{
                    background: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)',
                    border: '2px solid #00BFFF',
                    boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)',
                  }}
                >
                  {box.number}
                </div>

                {/* Box Content */}
                <div className="ml-6 sm:ml-8 md:ml-10">
                  <h3
                    className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1"
                    style={{
                      color: '#FFD700',
                      fontFamily: 'var(--font-space), monospace',
                    }}
                  >
                    {box.title}
                  </h3>
                  <p
                    className="text-[0.5rem] sm:text-xs md:text-sm leading-tight mb-1 sm:mb-2"
                    style={{
                      color: '#E0E0E0',
                      fontFamily: 'var(--font-mono), monospace',
                    }}
                  >
                    {box.description}
                  </p>
                  <pre
                    className="text-[0.45rem] sm:text-[0.55rem] md:text-xs p-1 sm:p-2 rounded overflow-x-auto"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      color: '#00FF00',
                      fontFamily: 'monospace',
                      border: '1px solid rgba(0, 191, 255, 0.3)',
                    }}
                  >
                    <code>{box.code_example}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Tip Boxes */}
          <div className="flex flex-col justify-between">
            {sortedBoxes.map((box) => (
              <div
                key={`tip-${box.number}`}
                className="relative p-2 sm:p-3 md:p-4 flex flex-col justify-center"
                style={{
                  height: `${100 / 5}%`,
                }}
              >
                <div className="flex items-start mb-1 sm:mb-2">
                  <Lightbulb
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 flex-shrink-0"
                    style={{
                      color: '#FFD700',
                      filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))',
                    }}
                  />
                  <div className="flex-1">
                    <h4
                      className="text-xs sm:text-sm md:text-base font-bold mb-1"
                      style={{
                        color: '#FFD700',
                        fontFamily: 'var(--font-space), monospace',
                      }}
                    >
                      Tip
                    </h4>
                    <p
                      className="text-[0.5rem] sm:text-xs md:text-sm leading-tight"
                      style={{
                        color: '#E0E0E0',
                        fontFamily: 'var(--font-mono), monospace',
                      }}
                    >
                      {box.tip}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
