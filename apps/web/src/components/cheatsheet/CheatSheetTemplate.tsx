'use client';

export interface CheatSheetBox {
  number: number;
  title: string;
  description: string;
  code_example: string;
  tip: string;
}

export type CheatSheetCharacter = 'default' | 'Astra' | 'Kenji' | 'Leo';

interface CheatSheetTemplateProps {
  title: string;
  subtitle: string;
  boxes: CheatSheetBox[];
  templateVersion?: string;
  character?: CheatSheetCharacter;
}

// Asset paths for each character
const getAssetPaths = (character: CheatSheetCharacter) => {
  if (character === 'default') {
    return {
      topFrame: '/assets/cheatsheets/Frame/full-frame/top-frame-2.png',
      bottomFrame: '/assets/cheatsheets/Frame/full-frame/bottom frame.png',
      leftRod: '/assets/cheatsheets/Frame/full-frame/Frame_rod.png',
      rightRod: '/assets/cheatsheets/Frame/full-frame/Frame_rod_right.png',
      numberLabel: '/assets/cheatsheets/Frame/small-frame/Number Label.png',
    };
  }

  // Character-specific assets
  const folder = `Assets_${character}`;
  return {
    topFrame: `/assets/cheatsheets/${folder}/top-frame.png`,
    bottomFrame: `/assets/cheatsheets/${folder}/bottom frame.png`,
    leftRod: `/assets/cheatsheets/${folder}/frame_rod.png`,
    rightRod: `/assets/cheatsheets/${folder}/frame_rod.png`, // Same rod for both sides
    numberLabel: `/assets/cheatsheets/${folder}/Number-Label.png`,
  };
};

// Character-specific color styles
const getCharacterStyles = (character: CheatSheetCharacter) => {
  switch (character) {
    case 'Kenji':
      return {
        frameGradient: 'linear-gradient(20deg, #feb04a, #e21b26 18%, #fcb151 32%, #f41c08 55%, #fa8114 72%, #ef2d09)',
        insetGradient: 'linear-gradient(145deg, #072c89, #072c8e 45%, #0a1219)',
      };
    case 'Leo':
      return {
        frameGradient: 'linear-gradient(20deg, #c2a4ff, #b488f4 18%, #c398f2 32%, #6048c7 55%, #caa0ff 72%, #d3b7fe)',
        insetGradient: 'linear-gradient(145deg, #6224d3, #370a89 45%, #0a1219)',
      };
    case 'Astra':
      return {
        frameGradient: 'linear-gradient(20deg, #d7fdfd, #a7fafc 18%, #fff 32%, #195bb0 55%, #40d9fe 72%, #a4f5fe)',
        insetGradient: 'linear-gradient(145deg, #205b9e, #1e437b 45%, #0c1627)',
      };
    default:
      return {
        frameGradient: 'linear-gradient(20deg, #f7fcff, #9aa7b1 18%, #ffffff 32%, #6e7b84 55%, #e2eaf0 72%, #7f8c95)',
        insetGradient: 'linear-gradient(145deg, #0f1f2c, #0b141c 45%, #0a1219)',
      };
  }
};

export default function CheatSheetTemplate({
  title,
  subtitle,
  boxes,
  templateVersion: _templateVersion = 'v1',
  character = 'default'
}: CheatSheetTemplateProps) {
  // Sort boxes by number to ensure correct order
  const sortedBoxes = [...boxes].sort((a, b) => a.number - b.number);

  // Get asset paths based on character
  const assets = getAssetPaths(character);

  // Get character-specific color styles
  const characterStyles = getCharacterStyles(character);

  const TEMPLATE_WIDTH = 1080; // Match original design width
  const DISPLAY_SCALE = 1.0; // Full size display

  return (
    <div
      className="flex justify-center items-start w-full overflow-x-auto"
      style={{
        '--frame-gradient': characterStyles.frameGradient,
        '--inset-gradient': characterStyles.insetGradient,
      } as React.CSSProperties}
    >
      {/* Wrapper for scaled container */}
      <div
        style={{
          width: `${TEMPLATE_WIDTH}px`,
          transform: `scale(${DISPLAY_SCALE})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Fixed-width container, auto-adjusting height based on content */}
        <div
          className="relative mx-auto cheat-sheet-main"
          style={{
            width: `${TEMPLATE_WIDTH}px`,
            minHeight: '100vh',
            backgroundImage: 'url(/assets/cheatsheets/galaxy-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '10px',
            padding: '60px',
            paddingBottom: '180px', // Extra padding at bottom for frame
            overflow: 'hidden',
          }}
        >
          {/* Frame Borders */}
          <div className="absolute" style={{ inset: '20px', pointerEvents: 'none' }}>
            {/* Top Frame */}
            <div className="absolute left-0 w-full z-[99]">
              <img
                src={assets.topFrame}
                alt=""
                className="w-full block"
              />
              <div className="absolute text-center" style={{ top: '35%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%' }}>
                <h1 className="text-white font-bold font-space m-0"
                    style={{
                      fontSize: '26px',
                      fontWeight: '700',
                      textShadow: '0 1px 0 rgba(255,255,255,0.35), 0 2px 3px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.35), 0 0 14px rgba(0,0,0,0.25)',
                      marginBottom: '5px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                  {title}
                </h1>
                <h6 className="font-space m-0"
                    style={{
                      color: 'yellow',
                      fontSize: '14px',
                      fontWeight: '600',
                      textShadow: '0 1px 0 rgba(0,0,0,0.35), 0 2px 3px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.35), 0 0 14px rgba(0,0,0,0.25)',
                      whiteSpace: 'nowrap'
                    }}>
                  {subtitle}
                </h6>
              </div>
            </div>

            {/* Bottom Frame */}
            <div className="absolute left-0 w-full z-[99]" style={{bottom:"-10px"}}>
              <img
                src={assets.bottomFrame}
                alt=""
                className="w-full block"
              />
            </div>

            {/* Left Frame */}
            <div className="absolute bottom-0 left-0" style={{top:"20px",left:"0px"}}>
              <img
                src={assets.leftRod}
                alt=""
                style={{ width: '30px', height: '100%', display: 'block' }}
              />
            </div>

            {/* Right Frame */}
            <div className="absolute bottom-0" style={{top:"20px",right:"0px"}}>
              <img
                src={assets.rightRod}
                alt=""
                style={{ width: '30px', height: '100%', display: 'block', transform: 'scaleX(-1)' }}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="relative z-[1]" style={{ top: '120px' }}>
            {sortedBoxes.map((box) => (
              <div key={box.number} className="flex gap-[10px] mb-[20px] items-stretch">
                {/* Code/Message Box - Left (63% width) */}
                <div className="flex" style={{ width: '63%', paddingLeft: '10px' }}>
                  <div className="hud-frame-wrapper">
                    <div className="hud-frame">
                      <div className="hud-mid">
                        <div className="hud-inset">
                          <h1>{box.title}</h1>
                          <p className="subtitle" dangerouslySetInnerHTML={{ __html: box.description }} />
                          <code>{box.code_example.replace(/\\n/g, '\n')}</code>
                        </div>
                      </div>
                      {/* Number Label */}
                      <div className="number-label">
                        <img src={assets.numberLabel} alt="" />
                        <div className="number">
                          <h1>{box.number}</h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip Box - Right (35% width) */}
                <div className="flex" style={{ width: '35%' }}>
                  <div className="hud-frame-wrapper">
                    <div className="hud-frame">
                      <div className="hud-mid">
                        <div className="hud-inset tip-box">
                          <h1>Tip</h1>
                          <div className="flex flex-col gap-[10px]">
                            {box.tip.replace(/\\n/g, '\n').split('\n').map((line, lineIndex) => (
                              <div key={lineIndex} className="flex items-start gap-[10px]">
                                <span className="flex-shrink-0 font-space" style={{ color: '#FFD700', fontSize: '18px', lineHeight: '1.3', marginTop: '2px' }}>•</span>
                                <p className="subtitle m-0" style={{ fontSize: '16px', lineHeight: '1.5' }}>{line}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Hint Icon */}
                      <div className="hint-icon">
                        <img src="/assets/cheatsheets/hint.png" alt="" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <style jsx>{`
            .hud-frame-wrapper {
              width: 100%;
              display: flex;
            }

            .hud-frame,
            .hud-mid,
            .hud-inset {
              clip-path: polygon(
                16px 0,
                calc(100% - 16px) 0,
                100% 16px,
                100% calc(100% - 16px),
                calc(100% - 16px) 100%,
                16px 100%,
                0 calc(100% - 16px),
                0 16px
              );
              -webkit-mask-image: -webkit-radial-gradient(white, black);
            }

            .hud-frame {
              width: 100%;
              padding: 4px;
              background: var(--frame-gradient);
              border-radius: 4px;
              position: relative;
              height: 100%;
              display: flex;
              flex-direction: column;
            }

            .hud-frame .number-label {
              position: absolute;
              z-index: 999999;
              top: -3px;
              left: -3px;
            }

            .hud-frame .number-label .number {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }

            .hud-frame .number-label .number h1 {
              color: #f6e7b0;
              font-size: 32px;
              margin: 0;
              font-weight: 700;
              text-shadow:
                0 1px 0 rgba(255, 255, 255, 0.35),
                0 2px 3px rgba(0, 0, 0, 0.85),
                0 0 6px rgba(255, 220, 120, 0.35),
                0 0 14px rgba(255, 200, 80, 0.25);
            }

            .hud-frame .number-label img {
              width: 80px;
            }

            .hud-mid {
              padding: 2px;
              border: 1px solid #000;
              background: linear-gradient(
                135deg,
                #cfd8df,
                #8c98a2 30%,
                #e9eff4 50%,
                #7a8690 70%,
                #c0c9d0
              );
              box-shadow:
                inset 0 1px 2px rgb(0 0 0),
                inset 0 -3px 5px rgba(0, 0, 0, 0.6);
              border-radius: 2px;
              flex: 1;
              display: flex;
              flex-direction: column;
            }

            .hud-inset {
              padding: 15px 25px 20px 85px;
              background: var(--inset-gradient);
              box-shadow:
                inset 0 0 0 2px rgba(255, 255, 255, 0.12),
                inset 0 0 18px rgba(0, 0, 0, 0.9),
                inset 0 -12px 22px rgba(0, 0, 0, 0.9);
              border-radius: 1px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              flex: 1;
              min-height: 100px;
            }

            .hud-inset.tip-box {
              padding: 20px 25px 20px 90px;
            }

            .hud-inset h1 {
              margin: 0 0 8px;
              font-size: 20px;
              font-weight: 600;
              color: #f6e7b0;
              text-shadow:
                0 1px 0 rgba(255, 255, 255, 0.35),
                0 2px 3px rgba(0, 0, 0, 0.85),
                0 0 6px rgba(255, 220, 120, 0.35),
                0 0 14px rgba(255, 200, 80, 0.25);
              letter-spacing: 0.5px;
              font-family: var(--font-space), monospace;
            }

            .subtitle {
              margin: 0px;
              font-size: 15px;
              color: #fff;
              font-family: var(--font-space), monospace;
              line-height: 1.5;
            }

            .hud-inset code {
              font-family: Consolas, monospace;
              font-size: 13px;
              color: #20ff20;
              margin-top: 12px;
              white-space: pre-wrap;
              word-break: break-word;
              display: block;
              line-height: 1.6;
            }

            .hint-icon {
              position: absolute;
              top: 50%;
              left: 15px;
              transform: translate(0%, -50%);
            }

            .hint-icon img {
              width: 65px;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
