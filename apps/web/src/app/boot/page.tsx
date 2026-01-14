'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const bootLog = `Welcome to eDEX-UI!
vm_page_bootstrap: 987323 free pages and 53061 wired pages
kext submap [0xffffff7f8072e000 - 0xffffff8000000000], kernel text [0xffffff8000200000 - 0xffffff800072e000]
zone leak detection enabled
standard timeslicing quantum is 10000 us
mig_table_max_displ = 72
TSC Deadline Timer supported and enabled
eDEXACPICPU: ProcessorId=1 LocalApicId=0 Enabled
eDEXACPICPU: ProcessorId=2 LocalApicId=2 Enabled
eDEXACPICPU: ProcessorId=3 LocalApicId=1 Enabled
eDEXACPICPU: ProcessorId=4 LocalApicId=3 Enabled
eDEXACPICPU: ProcessorId=5 LocalApicId=255 Disabled
eDEXACPICPU: ProcessorId=6 LocalApicId=255 Disabled
eDEXACPICPU: ProcessorId=7 LocalApicId=255 Disabled
eDEXACPICPU: ProcessorId=8 LocalApicId=255 Disabled
calling mpo_policy_init for TMSafetyNet
Security policy loaded: Safety net for Rollback (TMSafetyNet)
calling mpo_policy_init for Sandbox
Security policy loaded: Seatbelt sandbox policy (Sandbox)
calling mpo_policy_init for Quarantine
Security policy loaded: Quarantine policy (Quarantine)
Copyright (c) 1982, 1986, 1989, 1991, 1993, 2015
The Regents of the University of Adelaide. All rights reserved.

HN_ Framework successfully initialized
using 16384 buffer headers and 10240 cluster IO buffer headers
IOAPIC: Version 0x20 Vectors 64:87
ACPI: System State [S0 S3 S4 S5] (S3)
PFM64 0xf10000000, 0xf0000000
[ PCI configuration begin ]
eDEXIntelCPUPowerManagement: Turbo Ratios 0046
eDEXIntelCPUPowerManagement: (built 13:08:12 Jun 18 2011) initialization complete
console relocated to 0xf10000000
PCI configuration changed (bridge=16 device=4 cardbus=0)
[ PCI configuration end, bridges 12 devices 16 ]
mbinit: done [64 MB total pool size, (42/21) split]
Pthread support ABORTS when sync kernel primitives misused
com.eDEX.eDEXFSCompressionTypeZlib kmod start
com.eDEX.eDEXTrololoBootScreen kmod start
com.eDEX.eDEXFSCompressionTypeZlib load succeeded
com.eDEX.eDEXFSCompressionTypeDataless load succeeded

eDEXIntelCPUPowerManagementClient: ready
BTCOEXIST off
wl0: Broadcom BCM4331 802.11 Wireless Controller
5.100.98.75

FireWire (OHCI) Lucent ID 5901 built-in now active, GUID c82a14fffee4a086; max speed s800.
rooting via boot-uuid from /chosen: F5670083-AC74-33D3-8361-AC1977EE4AA2
Waiting on <dict ID="0"><key>IOProviderClass</key><string ID="1">
IOResources</string><key>IOResourceMatch</key><string ID="2">boot-uuid-media</string></dict>
Got boot device = IOService:/eDEXACPIPlatformExpert/PCI0@0/eDEXACPIPCI/SATA@1F,2/
eDEXIntelPchSeriesAHCI/PRT0@0/IOAHCIDevice@0/eDEXAHCIDiskDriver/SarahI@sTheBestDriverIOAHCIBlockStorageDevice/IOBlockStorageDriver/
eDEX SSD TS128C Media/IOGUIDPartitionScheme/Customer@2
BSD root: disk0s2, major 14, minor 2
Kernel is LP64
IOThunderboltSwitch::i2cWriteDWord - status = 0xe00002ed
IOThunderboltSwitch::i2cWriteDWord - status = 0x00000000
IOThunderboltSwitch::i2cWriteDWord - status = 0xe00002ed
IOThunderboltSwitch::i2cWriteDWord - status = 0xe00002ed
eDEXUSBMultitouchDriver::checkStatus - received Status Packet, Payload 2: device was reinitialized
MottIsAScrub::checkstatus - true, Mott::Scrub
[IOBluetoothHCIController::setConfigState] calling registerService
AirPort_Brcm4331: Ethernet address e4:ce:8f:46:18:d2
IO80211Controller::dataLinkLayerAttachComplete():  adding eDEXEFINVRAM notification
IO80211Interface::efiNVRAMPublished():
Created virtif 0xffffff800c32ee00 p2p0
BCM5701Enet: Ethernet address c8:2a:14:57:a4:7a
Previous Shutdown Cause: 3
NTFS driver 3.8 [Flags: R/W].
NTFS volume name BOOTCAMP, version 3.1.
DSMOS has arrived
en1: 802.11d country code set to 'US'.
en1: Supported channels 1 2 3 4 5 6 7 8 9 10 11 36 40 44 48 52 56 60 64 100 104 108 112 116 120 124 128 132 136 140 149 153 157 161 165
m_thebest
MacAuthEvent en1   Auth result for: 00:60:64:1e:e9:e4  MAC AUTH succeeded
MacAuthEvent en1   Auth result for: 00:60:64:1e:e9:e4 Unsolicited  Auth
wlEvent: en1 en1 Link UP
AirPort: Link Up on en1
en1: BSSID changed to 00:60:64:1e:e9:e4
virtual bool IOHIDEventSystemUserClient::initWithTask(task*, void*, UInt32):
Client task not privileged to open IOHIDSystem for mapping memory (e00002c1)


Boot Complete`.split('\n');

export default function BootPage() {
  const router = useRouter();
  const [bootContent, setBootContent] = useState('');
  const [showTitle, setShowTitle] = useState(false);
  const [titleClass, setTitleClass] = useState('');
  const lineIndexRef = useRef(0);
  const audioRef = useRef<{
    stdout: HTMLAudioElement | null;
    granted: HTMLAudioElement | null;
    theme: HTMLAudioElement | null;
  }>({ stdout: null, granted: null, theme: null });

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Initialize audio
    audioRef.current = {
      stdout: new Audio('/login-assets/audio/stdout.wav'),
      granted: new Audio('/login-assets/audio/granted.wav'),
      theme: new Audio('/login-assets/audio/theme.wav'),
    };

    if (audioRef.current.stdout) audioRef.current.stdout.volume = 0.5;
    if (audioRef.current.granted) audioRef.current.granted.volume = 0.7;
    if (audioRef.current.theme) audioRef.current.theme.volume = 0.6;

    // Start boot sequence
    displayLine();

    return () => {
      // Cleanup audio
      if (audioRef.current) {
        Object.values(audioRef.current).forEach(audio => {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
        });
      }
    };
  }, [router]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const displayLine = () => {
    const i = lineIndexRef.current;

    if (i >= bootLog.length) {
      setTimeout(displayTitleScreen, 300);
      return;
    }

    const line = bootLog[i];

    // Play audio
    if (line === 'Boot Complete') {
      audioRef.current?.granted?.play().catch(() => {});
    } else {
      audioRef.current?.stdout?.play().catch(() => {});
    }

    // Add line to boot content
    setBootContent(prev => {
      let content = prev;
      if (i === 2) {
        content += `eDEX-UI Kernel version 2.2.8 boot at ${Date().toString()}; root:xnu-1699.22.73~1/RELEASE_X86_64<br/>`;
      }
      content += line + '<br/>';
      return content;
    });

    lineIndexRef.current++;

    // Timing logic - Balanced speed
    let nextDelay = 35;
    if (i === 2 || i === 4) nextDelay = 600;
    else if (i > 4 && i < 25) nextDelay = 40;
    else if (i === 25) nextDelay = 500;
    else if (i === 42) nextDelay = 400;
    else if (i > 42 && i < 82) nextDelay = 35;
    else if (i === 83) {
      // Easter egg for Linux users
      if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Linux')) {
        setBootContent(prev => prev + 'btw i use arch<br/>');
      }
      nextDelay = 35;
    }
    else if (i >= bootLog.length - 2) nextDelay = 400;
    else nextDelay = Math.pow(1 - i / 1000, 3) * 35;

    setTimeout(displayLine, nextDelay);
  };

  const displayTitleScreen = async () => {
    audioRef.current?.theme?.play().catch(() => {});

    await delay(400);
    setBootContent('');
    setShowTitle(true);

    await delay(200);
    setTitleClass('solid-bg');

    await delay(100);
    setTitleClass('solid-bg border-fill');

    await delay(300);
    setTitleClass('solid-bg border-outline');

    await delay(100);
    setTitleClass('glitch');

    await delay(500);
    setTitleClass('final');

    await delay(1000);

    // Boot complete - redirect to home
    router.push('/home');
  };

  // Click to skip
  const handleClick = () => {
    lineIndexRef.current = bootLog.length;
  };

  return (
    <div onClick={handleClick} className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image - ENV from Login Page */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-assets/images/ENV-2.png"
          alt="Background"
          fill
          className="object-cover blur-0 "
          style={{ opacity: 1 }}
          priority
          quality={100}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&display=swap');

        :root {
          --color_r: 0;
          --color_g: 255;
          --color_b: 255;
          --font_main: 'Orbitron', 'Share Tech Mono', monospace;
        }

        body {
          margin: 0;
          padding: 0;
          background: #000;
          color: rgb(var(--color_r), var(--color_g), var(--color_b));
          font-family: 'Share Tech Mono', monospace;
          overflow: hidden;
        }

        body.solidBackground {
          background: linear-gradient(135deg, #001122 0%, #000000 100%);
        }

        section#boot_screen {
          position: fixed;
          top: 0vh;
          left: 0vh;
          width: 100%;
          height: 100%;
          padding: 2vh;
          margin: 0vh;
          overflow: hidden;
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.5vh;
          text-align: left;
          display: flex;
          align-items: flex-end;
          justify-content: flex-start;
          white-space: pre-wrap;
          line-height: 1.5;
          z-index: 10;
          letter-spacing: 0.05em;
        }

        section#boot_screen.center {
          align-items: center;
          justify-content: center;
        }

        section#boot_screen h1 {
          font-family: var(--font_main);
          font-size: 10vh;
          text-align: center;
          border-bottom: 0.46vh solid rgb(var(--color_r), var(--color_g), var(--color_b));
          padding-top: 2vh;
          padding-right: 2vh;
          padding-left: 1.5vh;
          background-color: transparent;
          opacity: 0;
          animation-name: fadeInTitle;
          animation-duration: 300ms;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
          animation-iteration-count: 1;
        }

        section#boot_screen h1.glitch {
          border: none;
          color: transparent;
        }

        @keyframes fadeInTitle {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        section#boot_screen h1::before {
          content: "eDEX-UI";
          display: block;
          transform: translateY(100%) translateX(-2%);
          clip-path: polygon(100% 0%, 100% 40%, 0% 40%, 0% 0%);
          color: rgba(var(--color_r), var(--color_g), var(--color_b), 0.8);
          animation-name: derezzer_top;
          animation-duration: 50ms;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-direction: alternate-reverse;
          animation-play-state: paused;
          height: 0px;
          opacity: 0;
        }

        section#boot_screen h1.glitch::before {
          height: auto;
          opacity: 1;
          animation-play-state: running;
        }

        @keyframes derezzer_top {
          from {transform: translateY(100%) translateX(-1%);}
          to {transform: translateY(100%) translateX(-5%);}
        }

        section#boot_screen h1::after {
          content: "eDEX-UI";
          display: block;
          transform: translateY(-100%) translateX(2%);
          clip-path: polygon(100% 40%, 100% 100%, 0% 100%, 0% 40%);
          color: rgba(var(--color_r), var(--color_g), var(--color_b), 0.9);
          animation-name: derezzer_bottom;
          animation-duration: 50ms;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-direction: alternate-reverse;
          animation-play-state: paused;
          height: 0px;
          opacity: 0;
        }

        section#boot_screen h1.glitch::after {
          height: auto;
          opacity: 1;
          animation-play-state: running;
        }

        @keyframes derezzer_bottom {
          from {transform: translateY(-100%) translateX(1%);}
          to {transform: translateY(-100%) translateX(3%);}
        }

        /* Skip instruction */
        .skip-text {
          position: fixed;
          bottom: 2vh;
          right: 2vh;
          color: rgba(var(--color_r), var(--color_g), var(--color_b), 0.5);
          font-size: 1.3vh;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.1em;
          z-index: 9999;
        }
      `}</style>

      <section
        id="boot_screen"
        className={showTitle ? 'center' : ''}
        style={showTitle && titleClass === 'solid-bg' ? { background: 'linear-gradient(135deg, #001122 0%, #000000 100%)' } : {}}
      >
        {!showTitle && (
          <div dangerouslySetInnerHTML={{ __html: bootContent }} />
        )}
        {showTitle && (
          <h1
            className={titleClass}
            style={
              titleClass === 'solid-bg border-fill'
                ? { backgroundColor: 'rgb(0, 255, 255)', borderBottom: '5px solid rgb(0, 255, 255)' }
                : titleClass === 'solid-bg border-outline'
                ? { border: '5px solid rgb(0, 255, 255)' }
                : titleClass === 'final'
                ? { border: '5px solid rgb(0, 255, 255)' }
                : {}
            }
          >
            eDEX-UI
          </h1>
        )}
      </section>

      <div className="skip-text">Click anywhere to skip</div>
    </div>
  );
}
