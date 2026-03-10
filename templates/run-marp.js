const { execFileSync, spawn } = require('child_process');
const os = require('os');

function isWsl() {
  return process.platform === 'linux' && os.release().toLowerCase().includes('microsoft');
}

function resolveBrowserPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'where' : 'which';
  const candidates = isWindows
    ? ['chrome', 'msedge', 'firefox', 'chromium']
    : ['chromium-browser', 'google-chrome', 'chromium', 'firefox', 'msedge'];

  for (const candidate of candidates) {
    try {
      const output = execFileSync(command, [candidate], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const firstLine = output.split(/\r?\n/).find(Boolean);
      if (firstLine) return firstLine.trim();
    } catch (_) {}
  }

  return null;
}

const mode = process.argv[2];
if (!['build', 'watch'].includes(mode)) {
  console.error('Usage: node run-marp.js <build|watch>');
  process.exit(1);
}

const env = { ...process.env };
const browserPath = resolveBrowserPath();
if (browserPath) env.CHROME_PATH = browserPath;

// WSL file watching is unreliable without polling. Native Windows does not need this by default.
if (mode === 'watch' && isWsl() && !env.CHOKIDAR_USEPOLLING) {
  env.CHOKIDAR_USEPOLLING = '1';
}

const marpBin = process.platform === 'win32' ? 'marp.cmd' : 'marp';
const args = [
  '--allow-local-files',
  '--browser-timeout',
  '120',
  '--theme-set',
  '../css/dr-iissi.css',
  '--engine',
  '../scripts/marp-engine.js',
];

if (mode === 'watch') args.push('--watch');

args.push('--pdf', 'templates.md');

const child = spawn(marpBin, args, {
  stdio: 'inherit',
  env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
