// Optional: render the spike's 12 s timeline frame by frame to PNGs (the first step towards a video exporter).
// Needs Node and Playwright with a Chromium (not a dependency of this repo).
//   node capture.cjs out/frames [fps=30] [query="shadowMode=planar"]
//   ffmpeg -framerate 30 -i out/frames/%04d.png -c:v libx264 -pix_fmt yuv420p preview.mp4
// Offline: set THREE_JS=/path/to/three.module.min.js (three@0.160.0) to serve it in place of the CDN.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const [outDir = 'out/frames', fps = '30', query = 'shadowMode=planar'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 1950 } });
  if (process.env.THREE_JS) await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js', r => r.fulfill({ body: fs.readFileSync(process.env.THREE_JS), contentType: 'text/javascript' }));
  p.on('pageerror', e => console.error('page error:', e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html') + '?render&' + query);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const { DURATION } = await p.evaluate(() => window.__meta), n = Math.round(+fps * DURATION);
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < n; i++) {
    const data = await p.evaluate(t => { window.__draw(t); return document.getElementById('out').toDataURL('image/png'); }, i / +fps);
    fs.writeFileSync(path.join(outDir, String(i).padStart(4, '0') + '.png'), Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close(); console.log(`${n} frames -> ${outDir}`);
})();
