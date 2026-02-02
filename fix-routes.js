#!/usr/bin/env node
/**
 * Fix routes-manifest.json - Add missing properties
 * This fixes the "routesManifest.X is not iterable" errors
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'apps/web/.next/routes-manifest.json');

console.log('🔧 Fixing routes-manifest.json...');

if (!fs.existsSync(manifestPath)) {
  console.error('❌ Error: routes-manifest.json not found at', manifestPath);
  process.exit(1);
}

try {
  // Read the manifest
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  let fixed = false;

  // Add all missing properties that Next.js expects
  const requiredProperties = {
    dataRoutes: [],
    dynamicRoutes: [],
    staticRoutes: []
  };

  for (const [prop, defaultValue] of Object.entries(requiredProperties)) {
    if (!manifest[prop]) {
      console.log(`  ➕ Adding missing ${prop} property...`);
      manifest[prop] = defaultValue;
      fixed = true;
    }
  }

  if (fixed) {
    // Write back
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Fixed routes-manifest.json');
  } else {
    console.log('✅ routes-manifest.json already valid');
  }

  // Verify the fix
  const verified = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const allValid = Object.keys(requiredProperties).every(prop => 
    Array.isArray(verified[prop])
  );

  if (allValid) {
    console.log('✅ Verification passed - all required properties present');
  } else {
    console.error('❌ Verification failed');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error fixing manifest:', error.message);
  process.exit(1);
}
