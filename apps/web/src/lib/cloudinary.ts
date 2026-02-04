// Auto-generated Cloudinary URL helper
// Generated at: 2026-02-04T11:56:28.855Z

export const CLOUDINARY_BASE = 'https://res.cloudinary.com/dwqzqxeuk';

// Image optimization params
export const IMG_OPTS = 'f_auto,q_auto';

// Get optimized image URL
export function getCloudinaryImage(path: string, options?: { width?: number; height?: number }) {
  const basePath = path.startsWith('/') ? path.slice(1) : path;
  let transform = IMG_OPTS;

  if (options?.width) transform += `,w_${options.width}`;
  if (options?.height) transform += `,h_${options.height}`;

  return `${CLOUDINARY_BASE}/image/upload/${transform}/code-runner/${basePath}`;
}

// Get audio/video URL
export function getCloudinaryAudio(path: string) {
  const basePath = path.startsWith('/') ? path.slice(1) : path;
  return `${CLOUDINARY_BASE}/video/upload/code-runner/${basePath}`;
}

// URL mappings
export const CLOUDINARY_URLS = {
  "/assets/characters/Astro.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206105/code-runner/characters/Astro.png",
    "publicId": "code-runner/characters/Astro",
    "resourceType": "image"
  },
  "/assets/characters/Leo.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206108/code-runner/characters/Leo.png",
    "publicId": "code-runner/characters/Leo",
    "resourceType": "image"
  },
  "/assets/characters/Kenji_2.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206111/code-runner/characters/Kenji_2.png",
    "publicId": "code-runner/characters/Kenji_2",
    "resourceType": "image"
  },
  "/assets/characters/nila (2).png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206112/code-runner/characters/nila%20%282%29.png",
    "publicId": "code-runner/characters/nila (2)",
    "resourceType": "image"
  },
  "/assets/ui/ENV-2.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206121/code-runner/ui/ENV-2.png",
    "publicId": "code-runner/ui/ENV-2",
    "resourceType": "image"
  },
  "/assets/ui/transperent.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206123/code-runner/ui/transperent.png",
    "publicId": "code-runner/ui/transperent",
    "resourceType": "image"
  },
  "/assets/ui/LOF_SVG.svg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206124/code-runner/ui/LOF_SVG.svg",
    "publicId": "code-runner/ui/LOF_SVG",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Frame/full-frame/top-frame-2.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206131/code-runner/cheatsheets/Frame/full-frame/top-frame-2.png",
    "publicId": "code-runner/cheatsheets/Frame/full-frame/top-frame-2",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Frame/full-frame/bottom frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206132/code-runner/cheatsheets/Frame/full-frame/bottom%20frame.png",
    "publicId": "code-runner/cheatsheets/Frame/full-frame/bottom frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Frame/full-frame/Frame_rod.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206133/code-runner/cheatsheets/Frame/full-frame/Frame_rod.png",
    "publicId": "code-runner/cheatsheets/Frame/full-frame/Frame_rod",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Frame/full-frame/Frame_rod_right.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206134/code-runner/cheatsheets/Frame/full-frame/Frame_rod_right.png",
    "publicId": "code-runner/cheatsheets/Frame/full-frame/Frame_rod_right",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Frame/full-frame/full frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206136/code-runner/cheatsheets/Frame/full-frame/full%20frame.png",
    "publicId": "code-runner/cheatsheets/Frame/full-frame/full frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Frame/full-frame/top frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206137/code-runner/cheatsheets/Frame/full-frame/top%20frame.png",
    "publicId": "code-runner/cheatsheets/Frame/full-frame/top frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Frame/small-frame/Number Label.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206138/code-runner/cheatsheets/Frame/small-frame/Number%20Label.png",
    "publicId": "code-runner/cheatsheets/Frame/small-frame/Number Label",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Astra/top-frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206139/code-runner/cheatsheets/Assets_Astra/top-frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Astra/top-frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Astra/bottom frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206140/code-runner/cheatsheets/Assets_Astra/bottom%20frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Astra/bottom frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Astra/frame_rod.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206141/code-runner/cheatsheets/Assets_Astra/frame_rod.png",
    "publicId": "code-runner/cheatsheets/Assets_Astra/frame_rod",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Astra/full_frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206142/code-runner/cheatsheets/Assets_Astra/full_frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Astra/full_frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Astra/Number-Label.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206143/code-runner/cheatsheets/Assets_Astra/Number-Label.png",
    "publicId": "code-runner/cheatsheets/Assets_Astra/Number-Label",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Kenji/top-frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206144/code-runner/cheatsheets/Assets_Kenji/top-frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Kenji/top-frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Kenji/bottom frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206145/code-runner/cheatsheets/Assets_Kenji/bottom%20frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Kenji/bottom frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Kenji/frame_rod.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206146/code-runner/cheatsheets/Assets_Kenji/frame_rod.png",
    "publicId": "code-runner/cheatsheets/Assets_Kenji/frame_rod",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Kenji/full_frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206148/code-runner/cheatsheets/Assets_Kenji/full_frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Kenji/full_frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Kenji/Number-Label.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206149/code-runner/cheatsheets/Assets_Kenji/Number-Label.png",
    "publicId": "code-runner/cheatsheets/Assets_Kenji/Number-Label",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Leo/top-frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206150/code-runner/cheatsheets/Assets_Leo/top-frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Leo/top-frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Leo/bottom frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206151/code-runner/cheatsheets/Assets_Leo/bottom%20frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Leo/bottom frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Leo/frame_rod.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206152/code-runner/cheatsheets/Assets_Leo/frame_rod.png",
    "publicId": "code-runner/cheatsheets/Assets_Leo/frame_rod",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Leo/full_frame.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206153/code-runner/cheatsheets/Assets_Leo/full_frame.png",
    "publicId": "code-runner/cheatsheets/Assets_Leo/full_frame",
    "resourceType": "image"
  },
  "/assets/cheatsheets/Assets_Leo/Number-Label.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206154/code-runner/cheatsheets/Assets_Leo/Number-Label.png",
    "publicId": "code-runner/cheatsheets/Assets_Leo/Number-Label",
    "resourceType": "image"
  },
  "/assets/cheatsheets/artboard-1.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206155/code-runner/cheatsheets/artboard-1.png",
    "publicId": "code-runner/cheatsheets/artboard-1",
    "resourceType": "image"
  },
  "/assets/cheatsheets/galaxy-bg.jpg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206156/code-runner/cheatsheets/galaxy-bg.jpg",
    "publicId": "code-runner/cheatsheets/galaxy-bg",
    "resourceType": "image"
  },
  "/assets/cheatsheets/hint.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206157/code-runner/cheatsheets/hint.png",
    "publicId": "code-runner/cheatsheets/hint",
    "resourceType": "image"
  },
  "/assets/flowcharts/11-14/level-1/sessions/session-1/flow 1.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206163/code-runner/flowcharts/11-14/level-1/sessions/session-1/flow%201.png",
    "publicId": "code-runner/flowcharts/11-14/level-1/sessions/session-1/flow 1",
    "resourceType": "image"
  },
  "/images/comparison operator.jpg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206164/code-runner/images/comparison%20operator.jpg",
    "publicId": "code-runner/images/comparison operator",
    "resourceType": "image"
  },
  "/images/elif.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206166/code-runner/images/elif.png",
    "publicId": "code-runner/images/elif",
    "resourceType": "image"
  },
  "/images/if statement.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206167/code-runner/images/if%20statement.png",
    "publicId": "code-runner/images/if statement",
    "resourceType": "image"
  },
  "/images/if-else statement.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206167/code-runner/images/if-else%20statement.png",
    "publicId": "code-runner/images/if-else statement",
    "resourceType": "image"
  },
  "/images/nested elif.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206168/code-runner/images/nested%20elif.png",
    "publicId": "code-runner/images/nested elif",
    "resourceType": "image"
  },
  "/images/11-14/level-1/sessions/session-1/cheat-sheet/cheet sheet 3.png": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/image/upload/v1770206169/code-runner/images/11-14/level-1/sessions/session-1/cheat-sheet/cheet%20sheet%203.png",
    "publicId": "code-runner/images/11-14/level-1/sessions/session-1/cheat-sheet/cheet sheet 3",
    "resourceType": "image"
  },
  "/audio/music-highq.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206171/code-runner/audio/music-highq.ogg",
    "publicId": "code-runner/audio/music-highq",
    "resourceType": "video"
  },
  "/audio/scott-buckley-passage-of-time.mp3": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206172/code-runner/audio/scott-buckley-passage-of-time.mp3",
    "publicId": "code-runner/audio/scott-buckley-passage-of-time",
    "resourceType": "video"
  },
  "/audio/lesion-x-a-journey-through-the-universe-1.mp3": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206173/code-runner/audio/lesion-x-a-journey-through-the-universe-1.mp3",
    "publicId": "code-runner/audio/lesion-x-a-journey-through-the-universe-1",
    "resourceType": "video"
  },
  "/audio/Deploy_Click.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206175/code-runner/audio/Deploy_Click.ogg",
    "publicId": "code-runner/audio/Deploy_Click",
    "resourceType": "video"
  },
  "/audio/card_sound.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206176/code-runner/audio/card_sound.ogg",
    "publicId": "code-runner/audio/card_sound",
    "resourceType": "video"
  },
  "/audio/beeps.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206177/code-runner/audio/beeps.ogg",
    "publicId": "code-runner/audio/beeps",
    "resourceType": "video"
  },
  "/audio/beeps2.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206178/code-runner/audio/beeps2.ogg",
    "publicId": "code-runner/audio/beeps2",
    "resourceType": "video"
  },
  "/audio/beeps3.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206179/code-runner/audio/beeps3.ogg",
    "publicId": "code-runner/audio/beeps3",
    "resourceType": "video"
  },
  "/audio/project-text.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206180/code-runner/audio/project-text.ogg",
    "publicId": "code-runner/audio/project-text",
    "resourceType": "video"
  },
  "/audio/enter-project.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206181/code-runner/audio/enter-project.ogg",
    "publicId": "code-runner/audio/enter-project",
    "resourceType": "video"
  },
  "/audio/leave-project.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206182/code-runner/audio/leave-project.ogg",
    "publicId": "code-runner/audio/leave-project",
    "resourceType": "video"
  },
  "/audio/ui-short.ogg": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206183/code-runner/audio/ui-short.ogg",
    "publicId": "code-runner/audio/ui-short",
    "resourceType": "video"
  },
  "/audio/stdout.wav": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206184/code-runner/audio/stdout.wav",
    "publicId": "code-runner/audio/stdout",
    "resourceType": "video"
  },
  "/audio/granted.wav": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206185/code-runner/audio/granted.wav",
    "publicId": "code-runner/audio/granted",
    "resourceType": "video"
  },
  "/audio/theme.wav": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206186/code-runner/audio/theme.wav",
    "publicId": "code-runner/audio/theme",
    "resourceType": "video"
  },
  "/audio/storyline-video.mp3": {
    "url": "https://res.cloudinary.com/dwqzqxeuk/video/upload/v1770206187/code-runner/audio/storyline-video.mp3",
    "publicId": "code-runner/audio/storyline-video",
    "resourceType": "video"
  }
};
