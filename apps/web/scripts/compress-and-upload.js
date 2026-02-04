const sharp = require('sharp');
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
const TEMP_DIR = path.join(__dirname, '../temp-compressed');

// Large files that need compression (>10MB)
const LARGE_FILES = [
  {
    localPath: 'assets/ui/background.png',
    cloudinaryFolder: 'code-runner/ui',
    outputName: 'background'
  },
  {
    localPath: 'assets/ui/technological-exploration-settlement.jpg',
    cloudinaryFolder: 'code-runner/ui',
    outputName: 'technological-exploration-settlement'
  }
];

async function compressImage(inputPath, outputPath, options = {}) {
  const ext = path.extname(inputPath).toLowerCase();
  const stats = fs.statSync(inputPath);
  console.log(`  Original size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  let sharpInstance = sharp(inputPath);

  // Get image metadata
  const metadata = await sharpInstance.metadata();
  console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);

  // For PNG files, convert to WebP for better compression
  if (ext === '.png') {
    await sharpInstance
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath.replace('.png', '.webp'));

    const newStats = fs.statSync(outputPath.replace('.png', '.webp'));
    console.log(`  Compressed size (WebP): ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);
    return outputPath.replace('.png', '.webp');
  }

  // For JPG files, compress with lower quality but keep dimensions
  if (ext === '.jpg' || ext === '.jpeg') {
    await sharpInstance
      .jpeg({ quality: 75, mozjpeg: true })
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    console.log(`  Compressed size (JPG): ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);
    return outputPath;
  }

  return inputPath;
}

async function uploadToCloudinary(filePath, cloudinaryFolder, publicId) {
  const fileExt = path.extname(filePath).toLowerCase();

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: `${cloudinaryFolder}/${publicId}`,
      resource_type: 'image',
      overwrite: true
    });

    console.log(`  Uploaded: ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error(`  Upload failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Compressing and uploading large files to Cloudinary\n');
  console.log('='.repeat(60));

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const results = {};

  for (const file of LARGE_FILES) {
    const inputPath = path.join(PUBLIC_DIR, file.localPath);

    if (!fs.existsSync(inputPath)) {
      console.log(`\nFile not found: ${inputPath}`);
      continue;
    }

    console.log(`\nProcessing: ${file.localPath}`);

    const ext = path.extname(file.localPath);
    const tempOutputPath = path.join(TEMP_DIR, `${file.outputName}${ext}`);

    // Compress the image
    const compressedPath = await compressImage(inputPath, tempOutputPath);

    // Check if file is now under 10MB
    const compressedStats = fs.statSync(compressedPath);
    if (compressedStats.size > 10 * 1024 * 1024) {
      console.log(`  Still too large (${(compressedStats.size / 1024 / 1024).toFixed(2)} MB), trying higher compression...`);

      // Try more aggressive compression
      const ext2 = path.extname(compressedPath);
      if (ext2 === '.webp') {
        await sharp(inputPath)
          .webp({ quality: 60, effort: 6 })
          .toFile(compressedPath);
      } else {
        await sharp(inputPath)
          .jpeg({ quality: 50, mozjpeg: true })
          .toFile(compressedPath);
      }

      const newStats = fs.statSync(compressedPath);
      console.log(`  New compressed size: ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    // Upload to Cloudinary
    const outputName = path.basename(compressedPath, path.extname(compressedPath));
    const uploadResult = await uploadToCloudinary(compressedPath, file.cloudinaryFolder, outputName);

    if (uploadResult) {
      results[file.localPath] = {
        originalPath: `/${file.localPath}`,
        cloudinaryUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
      };
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Upload Results:');
  console.log(JSON.stringify(results, null, 2));

  // Cleanup temp directory
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log('\nTemp files cleaned up.');
  console.log('Done!');
}

main().catch(console.error);
