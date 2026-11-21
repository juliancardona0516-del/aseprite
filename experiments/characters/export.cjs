// Export every Pixel Quest character on its own: transparent PNG at native size, an enlarged copy (nearest-neighbour),
// one sheet per character with all its poses, and a line-up of the whole cast.
//   node experiments/characters/export.cjs
// The sprites are taken from the scene pages themselves (no copy of the drawing code): the 2D pages expose them as
// globals, the 2.5D pages through window.__cast(). three.js is served locally, like capture.cjs.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'png');
const THREE = process.env.THREE_JS || path.join(ROOT, 'spike-25d', '.cache', 'three-0.160.0', 'package', 'build', 'three.module.min.js');

// what to take from each page; every entry is evaluated inside that page and returns { pose: sprite }
const CAST = [
  { slug: '01-heroe-pelo-rojo', name: 'Héroe de pelo rojo', page: 'pixel-quest/journey.html', main: 'de-pie',
    get: `({ stand: SPR.hero.stand, cheer: SPR.hero.cheer, ...Object.fromEntries(SPR.hero.walk.map((s, i) => ['walk' + i, s])) })` },
  { slug: '02-mago', name: 'Mago', page: 'pixel-quest/tavern.html', main: 'de-pie',
    get: `({ stand: SPR.mage.stand, ...Object.fromEntries(SPR.mage.walk.map((s, i) => ['walk' + i, s])), 'tunica-estrellada': TV.mage })` },
  { slug: '03-arquero-rubio', name: 'Arquero rubio', page: 'pixel-quest/journey.html', main: 'de-pie',
    get: `({ stand: SPR.archer.stand, ...Object.fromEntries(SPR.archer.walk.map((s, i) => ['walk' + i, s])) })`,
    extra: { page: 'spike-25d/aurora.html', get: `(c => ({ 'sentado-espalda': c.archer.sit, 'mirando-arriba': c.archer.look, 'senalando': c.archer.point, 'sentado-espalda-HD': c.archerHD.sit, 'mirando-arriba-HD': c.archerHD.look, 'senalando-HD': c.archerHD.point }))(window.__cast())` } },
  { slug: '04-caballero', name: 'Caballero', page: 'pixel-quest/journey.html', main: 'de-pie',
    get: `({ stand: SPR.knight.stand, ...Object.fromEntries(SPR.knight.walk.map((s, i) => ['walk' + i, s])) })` },
  { slug: '05-aventurera-pelo-rosa', name: 'Aventurera de pelo rosa', page: 'pixel-quest/dance.html', main: 'de-pie',
    get: `({ stand: SPR.healer.stand, ...Object.fromEntries(SPR.healer.walk.map((s, i) => ['walk' + i, s])), ...Object.fromEntries(['dU', 'dF', 'dP'].flatMap(p => DSPR[p].map((s, i) => [{ dU: 'baile-brazos-arriba', dF: 'baile-frente', dP: 'baile-pirueta' }[p] + '-' + (i + 1), s]))) })` },
  { slug: '06-ronin', name: 'Rōnin', page: 'spike-25d/wakayama.html', main: 'frente',
    get: `(c => { const o = {}; for (const [k, v] of Object.entries(c.ronin)) { if (Array.isArray(v)) v.forEach((s, i) => o[k + i] = s); else o[k] = v; } for (const [k, v] of Object.entries(c.roninHD)) { if (Array.isArray(v)) v.forEach((s, i) => o[k + i + '-HD'] = s); else o[k + '-HD'] = v; } return o; })(window.__cast())` },
  { slug: '07-dragon', name: 'Dragón', page: 'spike-25d/wakayama.html', main: 'rugido', get: `({ rugido: window.__cast().dragon })` },
  { slug: '08-demonio', name: 'El villano (demonio rojo)', page: 'spike-25d/throne.html', main: 'sentado',
    get: `(c => ({ sentado: c.demon.sit, 'mirada': c.demon.glare, rugido: c.demon.roar, 'sentado-HD': c.demonHD.sit, 'mirada-HD': c.demonHD.glare, 'rugido-HD': c.demonHD.roar }))(window.__cast())` },
  { slug: '09-orco-azul', name: 'Orco azul', page: 'spike-25d/throne.html', main: 'corre-garrote-1',
    get: `(c => { const o = {}, W = ['garrote', 'lanza', 'antorcha']; for (let w = 0; w < 3; w++) { o['de-pie-' + W[w]] = c.orc['stand' + w]; o['grito-' + W[w] + '-1'] = c.orc['cheer0' + w]; o['grito-' + W[w] + '-2'] = c.orc['cheer1' + w]; o['corre-' + W[w] + '-1'] = c.orc['run0' + w]; o['corre-' + W[w] + '-2'] = c.orc['run1' + w]; } return o; })(window.__cast())` },
  { slug: '10-pez-gigante', name: 'Pez gigante', page: 'pixel-quest/fish.html', main: 'boca-cerrada',
    get: `({ 'boca-cerrada': FL.shut, 'boca-abierta': FL.open, 'derrotado': FL.dead })` },
  { slug: '11-tortuga-gigante', name: 'Tortuga gigante', page: 'pixel-quest/turtle.html', main: 'despierta',
    get: `({ dormida: __shot(() => { blit(TL2.body, 0, 0); turtleHead(0, 0, 0); }), despierta: __shot(() => { blit(TL2.body, 0, 0); turtleHead(0, 0, 1); }), 'boca-abierta': __shot(() => { blit(TL2.body, 0, 0); turtleHead(0, 1, 1); }) })` },
  { slug: '12-mascota', name: 'Mascota (recuerdo del mago)', page: 'pixel-quest/moon.html', main: 'normal',
    get: `({ normal: mkPet(false), aplastada: mkPet(true) })` },
];

// runs inside the page: turns any sprite into a cropped PNG (native) and an enlarged one
const HELPERS = `
window.__shot = draw => {             // a figure drawn straight onto the 2D screen: draw it on two backgrounds, keep what didn't change
  const grab = bg => { scr.cls(bg); draw(); return Uint8Array.from(scr.px); };
  const a = grab(0), b = grab(6), d = new Uint8Array(a.length).fill(255);
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) d[i] = a[i];
  return { w: scr.w ?? PW, h: scr.h ?? PH, d };
};
window.__png = (s, maxSide) => {
  let src;
  if (s.c) src = s.c;                  // a Pix (2.5D pages): already an RGBA canvas
  else {                               // an indexed layer (2D pages): map through the base palette
    src = document.createElement('canvas'); src.width = s.w; src.height = s.h;
    const x = src.getContext('2d'), img = x.createImageData(s.w, s.h);
    for (let i = 0; i < s.d.length; i++) { const v = s.d[i]; if (v === 255) continue; const n = parseInt(PALETTE[v].slice(1), 16); img.data.set([n >> 16, (n >> 8) & 255, n & 255, 255], i * 4); }
    x.putImageData(img, 0, 0);
  }
  const px = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
  let x0 = src.width, y0 = src.height, x1 = -1, y1 = -1;
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) if (px[(y * src.width + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const pad = 2, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2, k = Math.max(1, Math.min(8, Math.floor(maxSide / Math.max(w, h))));
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
  const big = document.createElement('canvas'); big.width = w * k; big.height = h * k; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, w * k, h * k);
  return { w, h, k, native: c.toDataURL('image/png'), big: big.toDataURL('image/png') };
};`;

// pose names in Spanish (the scene code uses English keys)
const ES = { stand: 'de-pie', cheer: 'festejo', walk: 'camina-', standB: 'espalda-con-hatillo', ready: 'en-guardia', windup: 'preparando-golpe', strike: 'golpe',
  follow: 'remate', front: 'frente', frontB: 'frente-con-hatillo', frontNod: 'frente-saludo', frontWalk: 'frente-camina-' };
const es = pose => { const m = pose.match(/^([a-zA-Z]+?)(\d*)(-HD)?$/); if (!m || !(m[1] in ES)) return pose; const b = ES[m[1]], n = m[2] ? String(+m[2] + 1) : ''; return (b.endsWith('-') ? b + n : b + (n ? '-' + n : '')) + (m[3] || ''); };
const save = (file, url) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 1950 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js', r => r.fulfill({ body: fs.readFileSync(THREE), contentType: 'text/javascript' }));
  const open = async page => { await p.goto('file://' + path.join(ROOT, page) + '?render'); await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 }); await p.evaluate(HELPERS); };
  const summary = [];
  for (const C of CAST) {
    const dir = path.join(OUT, C.slug); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const poses = [];
    for (const part of [C, C.extra].filter(Boolean)) {
      await open(part.page);
      const got = await p.evaluate(expr => { const o = eval(expr), r = {}; for (const [k, v] of Object.entries(o)) r[k] = window.__png(v, 1024); return r; }, part.get);
      for (const [pose0, r] of Object.entries(got)) { const pose = es(pose0); save(path.join(dir, `${pose}.png`), r.native); save(path.join(dir, `${pose}-x${r.k}.png`), r.big); poses.push({ pose, ...r }); }
    }
    summary.push({ ...C, poses });
    console.log(`${C.slug}: ${poses.length} poses (${poses.map(q => q.pose).join(', ')})`);
  }
  // sheets: one per character (every pose, same scale, on a neutral dark ground) and the cast line-up (main pose of each, same scale)
  await p.goto('about:blank');
  const sheets = await p.evaluate(async list => {
    const load = u => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = u; });
    const sheet = async (items, k, gap, bg) => {
      const imgs = await Promise.all(items.map(it => load(it.native)));
      const W = imgs.reduce((a, im) => a + im.width * k + gap, gap), H = Math.max(...imgs.map(im => im.height)) * k + gap * 2;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, W, H); x.imageSmoothingEnabled = false;
      let cx = gap; for (const im of imgs) { x.drawImage(im, cx, H - gap - im.height * k, im.width * k, im.height * k); cx += im.width * k + gap; }
      return c.toDataURL('image/png');
    };
    const out = {};
    for (const C of list) { const small = C.poses.filter(q => !q.pose.endsWith('-HD')), maxH = Math.max(...small.map(q => q.h)), k = Math.max(1, Math.min(6, Math.floor(480 / maxH))); out[C.slug] = await sheet(small, k, 16, '#2a2433'); }
    out.__elenco = await sheet(list.filter(C => !['07-dragon', '11-tortuga-gigante', '10-pez-gigante'].includes(C.slug)).map(C => C.poses.find(q => q.pose === C.main)), 4, 24, '#2a2433');
    out.__criaturas = await sheet(list.filter(C => ['07-dragon', '11-tortuga-gigante', '10-pez-gigante'].includes(C.slug)).map(C => C.poses.find(q => q.pose === C.main)), 2, 24, '#2a2433');
    return out;
  }, summary);
  for (const [k, url] of Object.entries(sheets)) save(k.startsWith('__') ? path.join(OUT, (k === '__elenco' ? 'elenco' : 'criaturas') + '.png') : path.join(OUT, k, 'ficha.png'), url);
  console.log('errors:', errs.length ? errs.join(' || ') : 'none');
  await b.close();
})();
