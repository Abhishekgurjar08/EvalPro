const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

function findMongod() {
  const baseDir = 'C:\\Program Files\\MongoDB\\Server';
  if (fs.existsSync(baseDir)) {
    const versions = fs.readdirSync(baseDir);
    for (const v of versions) {
      const candidate = path.join(baseDir, v, 'bin', 'mongod.exe');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

const mongodPath = findMongod();
console.log('Mongod executable path:', mongodPath);

if (mongodPath) {
  // Ensure data dir exists
  const dataDir = 'C:\\data\\db';
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
      console.log('Could not create C:\\data\\db:', e.message);
    }
  }
  
  // Try starting mongod as a detached background process if not already running
  console.log('Starting mongod process...');
  const proc = spawn(mongodPath, ['--dbpath', fs.existsSync(dataDir) ? dataDir : '.'], {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();
  console.log('Spawned mongod with PID:', proc.pid);
} else {
  // Try net start MongoDB
  try {
    execSync('net start MongoDB', { stdio: 'inherit' });
  } catch (err) {
    console.log('net start MongoDB failed:', err.message);
  }
}
