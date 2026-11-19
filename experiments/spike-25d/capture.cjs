// Renders the spike's 12 s timeline frame by frame and, if ffmpeg is installed, encodes an MP4.
// three.js is always served locally (never from the CDN), so the export does not depend on the network:
//   THREE_JS=/path/three.module.min.js  if set, else .cache/three-0.160.0 (fetched once with `npm pack three@0.160.0`).
// Needs Node and Playwright with a Chromium; neither is a dependency of this repo.
//   node capture.cjs [--out preview.mp4] [--frames out/frames] [--fps 30] [--query "camMode=d8"]
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { execSync, spawnSync } = require('child_process');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const outMp4 = arg('out', path.join(__dirname, 'out', 'preview.mp4')), framesDir = arg('frames', path.join(__dirname, 'out', 'frames')), fps = +arg('fps', 30), query = arg('query', '');
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
function localThree() {
  if (process.env.THREE_JS) return process.env.THREE_JS;
  const dir = path.join(__dirname, '.cache', 'three-0.160.0'), file = path.join(dir, 'package', 'build', 'three.module.min.js');
  if (!fs.existsSync(file)) {
    fs.mkdirSync(dir, { recursive: true });
    const tgz = execSync('npm pack three@0.160.0 --silent', { cwd: dir, encoding: 'utf8' }).trim().split('\n').pop();
    execSync(`tar xzf "${tgz}"`, { cwd: dir }); fs.rmSync(path.join(dir, tgz));
  }
  return file;
}
(async () => {
  const three = fs.readFileSync(localThree());
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 1950 } });
  await p.route(CDN, r => r.fulfill({ body: three, contentType: 'text/javascript' }));
  p.on('pageerror', e => console.error('page error:', e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html') + '?render&' + query);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const { DURATION } = await p.evaluate(() => window.__meta), n = Math.round(fps * DURATION);
  fs.rmSync(framesDir, { recursive: true, force: true }); fs.mkdirSync(framesDir, { recursive: true });
  for (let i = 0; i < n; i++) {
    const data = await p.evaluate(t => { window.__draw(t); return document.getElementById('out').toDataURL('image/png'); }, i / fps);
    fs.writeFileSync(path.join(framesDir, String(i).padStart(4, '0') + '.png'), Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close(); console.log(`${n} frames -> ${framesDir}`);
  const ff = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(fps), '-i', path.join(framesDir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-movflags', '+faststart', outMp4], { stdio: 'inherit' });
  console.log(ff.status === 0 ? `video -> ${outMp4}` : 'ffmpeg not available: frames only');
})();
