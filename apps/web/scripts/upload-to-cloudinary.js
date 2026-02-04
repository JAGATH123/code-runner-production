const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dwqzqxeuk',
  api_key: '832957294683644',
  api_secret: 'mi4Im0bSEmsJZiL9ZFMJeI2gduU'
});

const PUBLIC_DIR = path.join(__dirname, '../public');

// Assets to upload with their Cloudinary folder paths
const UPLOAD_CONFIG = {
  // Character images (HIGH PRIORITY - 26.8MB)
  characters: {
    localPath: 'assets/characters',
    cloudinaryFolder: 'code-runner/characters',
    files: ['Astro.png', 'Leo.png', 'Kenji_2.png', 'nila (2).png']
  },

  // UI assets (HIGH PRIORITY - 42MB)
  ui: {
    localPath: 'assets/ui',
    cloudinaryFolder: 'code-runner/ui',
    files: ['background.png', 'ENV-2.png', 'transperent.png', 'LOF_SVG.svg', 'technological-exploration-settlement.jpg']
  },

  // Cheatsheet frames
  cheatsheetFrames: {
    localPath: 'assets/cheatsheets/Frame/full-frame',
    cloudinaryFolder: 'code-runner/cheatsheets/Frame/full-frame',
    files: ['top-frame-2.png', 'bottom frame.png', 'Frame_rod.png', 'Frame_rod_right.png', 'full frame.png', 'top frame.png']
  },

  cheatsheetSmallFrame: {
    localPath: 'assets/cheatsheets/Frame/small-frame',
    cloudinaryFolder: 'code-runner/cheatsheets/Frame/small-frame',
    files: ['Number Label.png']
  },

  // Cheatsheet character assets
  cheatsheetAstra: {
    localPath: 'assets/cheatsheets/Assets_Astra',
    cloudinaryFolder: 'code-runner/cheatsheets/Assets_Astra',
    files: ['top-frame.png', 'bottom frame.png', 'frame_rod.png', 'full_frame.png', 'Number-Label.png']
  },

  cheatsheetKenji: {
    localPath: 'assets/cheatsheets/Assets_Kenji',
    cloudinaryFolder: 'code-runner/cheatsheets/Assets_Kenji',
    files: ['top-frame.png', 'bottom frame.png', 'frame_rod.png', 'full_frame.png', 'Number-Label.png']
  },

  cheatsheetLeo: {
    localPath: 'assets/cheatsheets/Assets_Leo',
    cloudinaryFolder: 'code-runner/cheatsheets/Assets_Leo',
    files: ['top-frame.png', 'bottom frame.png', 'frame_rod.png', 'full_frame.png', 'Number-Label.png']
  },

  // Other cheatsheet assets
  cheatsheetOther: {
    localPath: 'assets/cheatsheets',
    cloudinaryFolder: 'code-runner/cheatsheets',
    files: ['artboard-1.png', 'galaxy-bg.jpg', 'hint.png']
  },

  // Backdrop images
  backdrop1114: {
    localPath: 'images/11-14/backdrop',
    cloudinaryFolder: 'code-runner/backdrops/11-14',
    files: ['technological-exploration-settlement.jpg']
  },

  backdrop1518: {
    localPath: 'images/15-18/backdrop',
    cloudinaryFolder: 'code-runner/backdrops/15-18',
    files: ['15-18 bg 1.png', '15-18 bg 2.png']
  },

  // Flowcharts
  flowcharts: {
    localPath: 'assets/flowcharts/11-14/level-1/sessions/session-1',
    cloudinaryFolder: 'code-runner/flowcharts/11-14/level-1/sessions/session-1',
    files: ['flow 1.png']
  },

  // Educational images
  educationalImages: {
    localPath: 'images',
    cloudinaryFolder: 'code-runner/images',
    files: ['comparison operator.jpg', 'elif.png', 'if statement.png', 'if-else statement.png', 'nested elif.png']
  },

  // Cheat sheet images
  cheatSheetImages: {
    localPath: 'images/11-14/level-1/sessions/session-1/cheat-sheet',
    cloudinaryFolder: 'code-runner/images/11-14/level-1/sessions/session-1/cheat-sheet',
    files: ['cheet sheet 3.png']
  },

  // Audio files
  audio: {
    localPath: 'audio',
    cloudinaryFolder: 'code-runner/audio',
    files: [
      'music-highq.ogg',
      'scott-buckley-passage-of-time.mp3',
      'lesion-x-a-journey-through-the-universe-1.mp3',
      'Deploy_Click.ogg',
      'card_sound.ogg',
      'beeps.ogg',
      'beeps2.ogg',
      'beeps3.ogg',
      'project-text.ogg',
      'enter-project.ogg',
      'leave-project.ogg',
      'ui-short.ogg',
      'stdout.wav',
      'granted.wav',
      'theme.wav',
      'storyline-video.mp3'
    ]
  }
};

// Track uploaded files for URL mapping
const uploadedFiles = {};

async function uploadFile(localPath, cloudinaryFolder, fileName) {
  const filePath = path.join(PUBLIC_DIR, localPath, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return null;
  }

  const fileExt = path.extname(fileName).toLowerCase();
  const publicId = `${cloudinaryFolder}/${path.basename(fileName, fileExt)}`;

  // Determine resource type
  let resourceType = 'image';
  if (['.mp3', '.ogg', '.wav'].includes(fileExt)) {
    resourceType = 'video'; // Cloudinary treats audio as video
  } else if (['.svg'].includes(fileExt)) {
    resourceType = 'image';
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      resource_type: resourceType,
      overwrite: true,
      // Keep original quality and dimensions
      transformation: []
    });

    console.log(`  ✅ Uploaded: ${fileName} -> ${result.secure_url}`);

    // Store mapping
    const originalPath = `/${localPath}/${fileName}`;
    uploadedFiles[originalPath] = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: resourceType
    };

    return result;
  } catch (error) {
    console.error(`  ❌ Failed to upload ${fileName}:`, error.message);
    return null;
  }
}

async function uploadCategory(name, config) {
  console.log(`\n📁 Uploading ${name}...`);
  console.log(`   Local: ${config.localPath}`);
  console.log(`   Cloud: ${config.cloudinaryFolder}`);

  for (const file of config.files) {
    await uploadFile(config.localPath, config.cloudinaryFolder, file);
  }
}

async function main() {
  console.log('🚀 Starting Cloudinary Upload\n');
  console.log('Cloud Name: dwqzqxeuk');
  console.log('='.repeat(50));

  // Upload all categories
  for (const [name, config] of Object.entries(UPLOAD_CONFIG)) {
    await uploadCategory(name, config);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Upload Summary');
  console.log('='.repeat(50));
  console.log(`Total files uploaded: ${Object.keys(uploadedFiles).length}`);

  // Save URL mapping to a JSON file
  const mappingPath = path.join(__dirname, 'cloudinary-urls.json');
  fs.writeFileSync(mappingPath, JSON.stringify(uploadedFiles, null, 2));
  console.log(`\n📝 URL mapping saved to: ${mappingPath}`);

  // Generate helper file
  generateHelperFile();

  console.log('\n✅ Upload complete!');
}

function generateHelperFile() {
  const helperContent = `// Auto-generated Cloudinary URL helper
// Generated at: ${new Date().toISOString()}

export const CLOUDINARY_BASE = 'https://res.cloudinary.com/dwqzqxeuk';

// Image optimization params
export const IMG_OPTS = 'f_auto,q_auto';

// Get optimized image URL
export function getCloudinaryImage(path: string, options?: { width?: number; height?: number }) {
  const basePath = path.startsWith('/') ? path.slice(1) : path;
  let transform = IMG_OPTS;

  if (options?.width) transform += \`,w_\${options.width}\`;
  if (options?.height) transform += \`,h_\${options.height}\`;

  return \`\${CLOUDINARY_BASE}/image/upload/\${transform}/code-runner/\${basePath}\`;
}

// Get audio/video URL
export function getCloudinaryAudio(path: string) {
  const basePath = path.startsWith('/') ? path.slice(1) : path;
  return \`\${CLOUDINARY_BASE}/video/upload/code-runner/\${basePath}\`;
}

// URL mappings
export const CLOUDINARY_URLS = ${JSON.stringify(uploadedFiles, null, 2)};
`;

  const helperPath = path.join(__dirname, '../src/lib/cloudinary.ts');
  fs.writeFileSync(helperPath, helperContent);
  console.log(`\n📝 Helper file saved to: ${helperPath}`);
}

main().catch(console.error);
