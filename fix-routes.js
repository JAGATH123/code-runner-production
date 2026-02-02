#!/usr/bin/env node
// Fix routes-manifest.json - add missing dataRoutes property

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'apps/web/.next/routes-manifest.json');

console.log('Checking routes-manifest.json...');

if (!fs.existsSync(manifestPath)) {
  console.error('Error: routes-manifest.json not found at:', manifestPath);
  process.exit(1);
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Check if dataRoutes is missing
  if (!manifest.dataRoutes) {
    console.log('Adding missing dataRoutes property...');
    manifest.dataRoutes = [];

    // Write back the fixed manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✓ Fixed routes-manifest.json');
  } else {
    console.log('✓ routes-manifest.json already has dataRoutes');
  }

  // Verify the fix
  const verified = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('Verified dataRoutes exists:', Array.isArray(verified.dataRoutes));

} catch (error) {
  console.error('Error processing routes-manifest.json:', error.message);
  process.exit(1);
}
