const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fix the routes manifest before starting Next.js
const manifestPath = path.join(__dirname, 'apps/web/.next/routes-manifest.json');

console.log('🔧 Checking routes-manifest.json...');

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  if (!manifest.dataRoutes) {
    console.log('⚠️  Adding missing dataRoutes property...');
    manifest.dataRoutes = [];
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    console.log('✅ Fixed routes-manifest.json');
  } else {
    console.log('✅ routes-manifest.json is valid');
  }
} else {
  console.error('❌ routes-manifest.json not found!');
  process.exit(1);
}

// Now start Next.js
console.log('🚀 Starting Next.js...');
const nextStart = spawn('npm', ['run', 'start:prod', '--workspace=@code-runner/web'], {
  stdio: 'inherit',
  shell: true
});

nextStart.on('exit', (code) => {
  process.exit(code);
});
