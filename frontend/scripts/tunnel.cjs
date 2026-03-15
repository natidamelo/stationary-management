/**
 * Start an HTTPS tunnel to localhost:5173 so you can open the app on your phone.
 * Camera scanning requires HTTPS on mobile.
 *
 * One-time setup:
 *   1. Sign up (free): https://dashboard.ngrok.com/signup
 *   2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
 *   3. Set it (PowerShell): $env:NGROK_AUTHTOKEN="your_token_here"
 *      Or CMD: set NGROK_AUTHTOKEN=your_token_here
 *
 * Then:
 *   1. Start frontend: npm run dev:lan
 *   2. In another terminal: npm run tunnel
 *   3. Open the HTTPS URL shown on your phone (e.g. https://xxxx.ngrok-free.app/reception)
 */
const { spawn } = require('child_process');
const path = require('path');

const PORT = 5173;
const root = path.join(__dirname, '..');

// npx ngrok http 5173 — uses the ngrok bin from node_modules (works on Windows and Mac/Linux)
const child = spawn('npx', ['ngrok', 'http', String(PORT)], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
  env: { ...process.env, NGROK_AUTHTOKEN: process.env.NGROK_AUTHTOKEN || '' },
});

child.on('error', (err) => {
  console.error('Failed to start ngrok:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error('');
    console.error('If you see "authtoken" or "4018":');
    console.error('  1. Sign up: https://dashboard.ngrok.com/signup');
    console.error('  2. Copy your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken');
    console.error('  3. In PowerShell run: $env:NGROK_AUTHTOKEN="your_token"');
    console.error('  4. Run again: npm run tunnel');
  }
  process.exit(code || 0);
});
