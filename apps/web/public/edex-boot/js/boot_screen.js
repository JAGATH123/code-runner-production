// eDEX-UI Boot Screen - Standalone Version
// Extracted from original eDEX-UI project

// Audio Manager - Simplified version
class AudioManager {
    constructor() {
        this.stdout = new Audio('audio/stdout.wav');
        this.granted = new Audio('audio/granted.wav');
        this.theme = new Audio('audio/theme.wav');

        // Set volume
        this.stdout.volume = 0.5;
        this.granted.volume = 0.7;
        this.theme.volume = 0.6;
    }
}

// Theme configuration
window.theme = {
    r: 0,
    g: 255,
    b: 255
};

// Audio manager
window.audioManager = new AudioManager();

// Helper function for delays
window._delay = ms => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
};

// Boot log data
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

let i = 0;

// Startup boot log
function displayLine() {
    let bootScreen = document.getElementById("boot_screen");

    if (typeof bootLog[i] === "undefined") {
        setTimeout(displayTitleScreen, 300);
        return;
    }

    if (bootLog[i] === "Boot Complete") {
        window.audioManager.granted.play().catch(() => {}); // Ignore audio errors
    } else {
        window.audioManager.stdout.play().catch(() => {}); // Ignore audio errors
    }

    bootScreen.innerHTML += bootLog[i] + "<br/>";
    i++;

    switch(true) {
        case i === 2:
            bootScreen.innerHTML += `eDEX-UI Kernel version 2.2.8 boot at ${Date().toString()}; root:xnu-1699.22.73~1/RELEASE_X86_64<br/>`;
        case i === 4:
            setTimeout(displayLine, 500);
            break;
        case i > 4 && i < 25:
            setTimeout(displayLine, 30);
            break;
        case i === 25:
            setTimeout(displayLine, 400);
            break;
        case i === 42:
            setTimeout(displayLine, 300);
            break;
        case i > 42 && i < 82:
            setTimeout(displayLine, 25);
            break;
        case i === 83:
            // Easter egg for Arch users
            if (navigator.userAgent.includes("Linux")) {
                bootScreen.innerHTML += "btw i use arch<br/>";
            }
            setTimeout(displayLine, 25);
            break;
        case i >= bootLog.length-2 && i < bootLog.length:
            setTimeout(displayLine, 300);
            break;
        default:
            setTimeout(displayLine, Math.pow(1 - (i/1000), 3)*25);
    }
}

// Show "logo" and background grid
async function displayTitleScreen() {
    let bootScreen = document.getElementById("boot_screen");
    if (bootScreen === null) {
        bootScreen = document.createElement("section");
        bootScreen.setAttribute("id", "boot_screen");
        bootScreen.setAttribute("style", "z-index: 9999999");
        document.body.appendChild(bootScreen);
    }
    bootScreen.innerHTML = "";
    window.audioManager.theme.play().catch(() => {}); // Ignore audio errors

    await _delay(400);

    document.body.setAttribute("class", "");
    bootScreen.setAttribute("class", "center");
    bootScreen.innerHTML = "<h1>eDEX-UI</h1>";
    let title = document.querySelector("section > h1");

    await _delay(200);

    document.body.setAttribute("class", "solidBackground");

    await _delay(100);

    title.setAttribute("style", `background-color: rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});border-bottom: 5px solid rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});`);

    await _delay(300);

    title.setAttribute("style", `border: 5px solid rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});`);

    await _delay(100);

    title.setAttribute("style", "");
    title.setAttribute("class", "glitch");

    await _delay(500);

    document.body.setAttribute("class", "");
    title.setAttribute("class", "");
    title.setAttribute("style", `border: 5px solid rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});`);

    await _delay(1000);

    // Boot sequence complete - you can add your own callback here
    console.log("Boot sequence complete!");

    // Optional: Remove boot screen after completion
    // bootScreen.remove();
}

// Start the boot sequence
document.addEventListener('DOMContentLoaded', function() {
    displayLine();
});

// Optional: Click to skip intro
document.addEventListener('click', function() {
    i = bootLog.length; // Skip to end
});