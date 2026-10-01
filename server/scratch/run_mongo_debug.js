const { execSync } = require('child_process');

try {
  const out = execSync('net start MongoDB', { encoding: 'utf8' });
  console.log('net start output:', out);
} catch (e) {
  console.log('net start error:', e.stdout || e.message);
}
