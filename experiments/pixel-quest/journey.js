// =====================================================================
// The Journey — 9:16 pixel film. 270x480 internal, x4 -> 1080x1920, 20 s.
// Five travelers cross a fantasy world: meadow, forest, mountain, bridge, camp, castle.
// =====================================================================
const W = 1080, H = 1920, FPS = 30, DURATION = 20;
const PW = 270, PH = 480, GROUND = 396, FEET = GROUND + 14;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const inOutSine = p => -(Math.cos(Math.PI * p) - 1) / 2;
const cyc = (x, n) => ((Math.floor(x) % n) + n) % n;
const TAU = Math.PI * 2;

// =====================================================================
// PLAN AS DATA
// =====================================================================
const PALETTE = [
  '#14307a', '#1c45b0', '#2a62e0', '#4d8cf2', '#86b8f8', '#c2e0fc',   // 0-5  sky, deep -> pale
  '#ffffff', '#e4eeff', '#b6c4f0', '#8592d6', '#5c62ae', '#3a3c7a',   // 6-11 white -> rock darkest
  '#9a9ccc', '#cfd0ea',                                               // 12-13 rock mid, light
  '#0e2a33', '#18503c', '#24773c', '#3f9e3a', '#78c63e', '#c4ec5c',   // 14-19 leaves
  '#2b1e33', '#4f3a40', '#7a5845', '#a8805a', '#d2b07a',              // 20-24 bark / earth
  '#1a3a52', '#2c6a62', '#9fd4ff',                                    // 25-27 pine dark, pine mid, water
  '#ffd9b3', '#e0a078', '#1a1228',                                    // 28-30 skin, skin shade, outline
  '#e0483a', '#8f2438', '#8a4fd0', '#4a2380', '#f4c542',              // 31-35 red, dark red, purple, dark purple, gold
  '#ff8fc0', '#c9508a', '#6ff2ff', '#ff9a3a', '#ffe46a',              // 36-40 pink, dark pink, cyan*, orange*, fire yellow*
  '#f7e08a', '#ffffff',                                               // 41-42 blonde, star white*
];
const EMISSIVE = new Set([38, 39, 40, 42]);                           // * never tinted by time of day
const SKIES = {                                                       // indexes 0-5 per time of day
  dusk:  ['#3a2a6a', '#7a3a7a', '#c4506a', '#f0805a', '#f8b46a', '#ffe0a0'],
  night: ['#060a20', '#0a1130', '#101940', '#172354', '#202e68', '#2e3e84'],
  dawn:  ['#2a3a8a', '#5a5ab0', '#b070b0', '#f09a90', '#f8c8a0', '#ffe8c8'],
};
const TINT = { dusk: [1.06, .80, .74], night: [.46, .50, .82], dawn: [1.03, .93, .96] };
const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4;                     // .625 s, 2.5 s; 8 bars = 20 s
const SHOTS = [
  { id: 'meadow',   start: 0,          end: 6 * BEAT,  light: 'day',   walk: true },
  { id: 'forest',   start: 6 * BEAT,   end: 10 * BEAT, light: 'day',   walk: true },
  { id: 'mountain', start: 10 * BEAT,  end: 14 * BEAT, light: 'day',   walk: true },
  { id: 'bridge',   start: 14 * BEAT,  end: 18 * BEAT, light: 'dusk',  walk: true },
  { id: 'camp',     start: 18 * BEAT,  end: 23 * BEAT, light: 'night', walk: false },
  { id: 'castle',   start: 23 * BEAT,  end: DURATION,  light: 'dawn',  walk: true },
];
const SH = Object.fromEntries(SHOTS.map(s => [s.id, s]));
const TRANSITIONS = [
  { at: 6 * BEAT,  dur: .5, type: 'wipe' },     // further down the road
  { at: 10 * BEAT, dur: .5, type: 'wipe' },
  { at: 14 * BEAT, dur: .5, type: 'wipe' },
  { at: 18 * BEAT, dur: .7, type: 'dissolve' }, // time passes
  { at: 23 * BEAT, dur: .8, type: 'dissolve' },
];
const VIEWS = [
  { from: 0, size: 'wide' }, { from: 4 * BEAT, size: 'close', x: 49, y: 240 }, { from: 8 * BEAT, size: 'wide' }, { from: 12 * BEAT, size: 'close', x: 49, y: 240 },
  { from: 16 * BEAT, size: 'wide' }, { from: 21 * BEAT, size: 'close', x: 77, y: 240, pan: 3 }, { from: 23 * BEAT, size: 'wide' }, { from: 26 * BEAT, size: 'close', x: 49, y: 236, pan: 4 }, { from: 28 * BEAT, size: 'wide' },
];
const LIGHT_KEYS = [[0, 'day'], [8.5, 'day'], [9.2, 'dusk'], [10.9, 'dusk'], [11.6, 'night'], [14.0, 'night'], [14.9, 'dawn'], [16.6, 'dawn'], [18.6, 'day'], [20, 'day']];
const PARTY = [                                                       // left to right; x on screen
  { kind: 'knight', x: 62 }, { kind: 'healer', x: 90 }, { kind: 'mage', x: 116 }, { kind: 'archer', x: 144 }, { kind: 'hero', x: 170 },
];
const WALK_SPEED = 40, STOP = { from: 16.0, to: 16.8 }, CHEER = 17.0; // px/s; the party halts before the castle
const scrollX = t => t < STOP.from ? WALK_SPEED * t : WALK_SPEED * (STOP.from + (Math.min(t, STOP.to) - STOP.from) - (Math.min(t, STOP.to) - STOP.from) ** 2 / (2 * (STOP.to - STOP.from)));

// =====================================================================
// Raster helpers on index layers (255 = transparent)
// =====================================================================
const layer = (w, h) => ({ w, h, d: new Uint8Array(w * h).fill(255) });
const lp = (L, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= L.w || y >= L.h) return; L.d[y * L.w + x] = c; };
const lr = (L, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) lp(L, x + i, y + j, c); };
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const bay = (x, y) => B4[(y & 3) * 4 + (x & 3)];
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const pnoise = (x, w, s, f = 3) => .5 + .3 * Math.sin(x / w * TAU * f + s) + .2 * Math.sin(x / w * TAU * (f * 2 + 1) + s * 2.3);   // periodic in w
const ramp = (R, v, x, y) => R[clamp(Math.floor(v * R.length + bay(x, y) - .5), 0, R.length - 1)];
const RAMP = {
  leaf: [14, 15, 16, 17, 18, 19], leafDark: [14, 14, 15, 16, 17], bark: [20, 21, 22, 23, 24], cloud: [9, 8, 7, 6, 6],
  rockNear: [11, 10, 12, 13], rockFar: [10, 9, 12, 13], stone: [11, 10, 12, 13, 6], pine: [14, 25, 26, 16], snow: [9, 8, 7, 6, 6],
  road: [21, 22, 23, 24], shade: [11, 11, 10, 10],
};
function blob(L, cx, cy, r, seed, R, o = {}) {
  const ri = Math.ceil(r * 1.2) + 1, grain = o.grain ?? .35, tex = o.tex ?? .5;
  for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
    if (o.flat !== undefined && dy > o.flat * r) continue;
    const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const rr = r * (.82 + .32 * vnoise(Math.cos(a) * 1.6 + seed * 3.7, Math.sin(a) * 1.6, seed));
    if (d > rr) continue;
    const X = Math.round(cx + dx), Y = Math.round(cy + dy);
    let v = .5 + .48 * ((-dx * .55 - dy * .85) / rr) + (vnoise(X * grain, Y * grain, seed + 9) - .5) * tex + (o.bias || 0);
    if (d > rr - 1.3) v -= .3;
    let c = ramp(R, v, X, Y);
    if (o.spark && v > .62 && hash(X, Y, seed) > .93) c = R[R.length - 1];
    lp(L, X, Y, c);
  }
}
function barkPx(L, X, Y, u, seed, bias = 0, R = RAMP.bark) {
  const n = vnoise(X * .55 + vnoise(Y * .04, 0, seed) * 5, Y * .07, seed);
  let v = .62 - .42 * u + (n - .5) * .7 + bias; if (Math.abs(u) > .9) v -= .45;
  lp(L, X, Y, ramp(R, v, X, Y));
}
function trunk(L, cx, y0, y1, w0, w1, seed, R, bias = 0) {
  for (let y = y0; y <= y1; y++) {
    const p = (y - y0) / (y1 - y0), w = lerp(w0, w1, p ** 2.2) + (vnoise(y * .05, 3, seed) - .5) * w0 * .3, sh = (vnoise(y * .02, 5, seed) - .5) * w0 * .4;
    for (let x = -w; x <= w; x++) barkPx(L, Math.round(cx + sh + x), y, x / w, seed, bias, R);
  }
}
function spire(L, x, base, h, w, seed, R, o = {}) {
  const peak = base - h;
  for (let y = peak; y <= base; y++) {
    const p = (y - peak) / h, hw = w * p * (.75 + .5 * vnoise(y * .08, 1, seed)) + 1, off = (vnoise(y * .05, 2, seed) - .5) * w * .5 * p;
    for (let dx = -hw; dx <= hw; dx++) {
      const X = Math.round(x + off + dx), u = dx / hw;
      let v = .55 - .5 * u + (vnoise(X * .3, y * .12, seed) - .5) * .5; if (Math.abs(u) > .9) v -= .3;
      const snow = o.snow && p < o.snow + (vnoise(X * .15, 7, seed) - .5) * .16;
      lp(L, X, y, ramp(snow ? RAMP.snow : R, snow ? v + .25 : v, X, y));
    }
  }
}
function pine(L, x, base, h, seed, R = RAMP.pine) {
  for (let y = 0; y < h; y++) {
    const p = y / h, hw = (p * h * .42) * (1 - ((y % 4) / 10)) + .5;
    for (let dx = -hw; dx <= hw; dx++) { const X = Math.round(x + dx), Y = Math.round(base - h + y); lp(L, X, Y, ramp(R, .6 - .55 * (dx / hw) - p * .25, X, Y)); }
  }
  lp(L, x, base + 1, 21); lp(L, x, base, 21);
}
function cloudBank(L, x0, x1, y, h, seed, flat = .35) {
  const r = Pixel.mulberry32(seed);
  for (let x = x0; x < x1; x += 7 + r() * 9) blob(L, x, y - r() * h * .4, h * (.45 + r() * .55), seed + x, RAMP.cloud, { flat, grain: .25, tex: .35 });
}
function haze(L, c, a) { for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (L.d[y * L.w + x] !== 255 && bay(x, y) < a) L.d[y * L.w + x] = c; }
function outline(L, c) {
  const o = new Uint8Array(L.d);
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    if (L.d[y * L.w + x] !== 255) continue;
    if ((x > 0 && L.d[y * L.w + x - 1] !== 255) || (x < L.w - 1 && L.d[y * L.w + x + 1] !== 255) || (y > 0 && L.d[(y - 1) * L.w + x] !== 255) || (y < L.h - 1 && L.d[(y + 1) * L.w + x] !== 255)) o[y * L.w + x] = c;
  }
  return { w: L.w, h: L.h, d: o };
}

// =====================================================================
// The five travelers: built from parts, one sprite per pose and walk frame
// =====================================================================
const SW = 46, SHH = 56, SX = 22, SFY = 53;                          // sprite box, feet anchor
const wave = (i, frame, a = 1) => Math.round(Math.sin(i * .8 + frame * 1.57) * a);
const KINDS = {
  hero: {
    leg: 8, tor: 10, body: 2, bodyShade: 1, belt: 35, legC: 22, legShade: 21, boot: 21, bootShade: 20, sleeve: 1, eye: 1,
    back(g) {
      const { P, X, torY, hipY, up, frame, pose } = g;
      for (let i = 0; i < 9; i++) { P(X - 6 - i, torY + wave(i, frame) + (i > 4 ? 1 : 0), 6); P(X - 6 - i, torY + 1 + wave(i, frame) + (i > 4 ? 1 : 0), 7); }      // scarf tail
      if (pose !== 'cheer') for (let i = 0; i < 11; i++) {                                                                                             // sword on his back
        const x = X - 10 + i, y = hipY + up - i; if (i < 7) { P(x, y, 13); P(x + 1, y, 12); } else if (i === 7) { P(x - 1, y - 1, 35); P(x, y, 35); P(x + 1, y + 1, 35); } else P(x, y, 21);
      }
    },
    hair(g) {
      const { P, R, X, hy } = g;
      R(X - 5, hy - 1, 10, 3, 31); R(X - 5, hy + 2, 9, 1, 31); P(X + 4, hy + 2, 31); P(X, hy + 3, 31); P(X + 4, hy + 3, 31);
      R(X - 6, hy + 1, 3, 7, 31); R(X - 6, hy + 3, 1, 5, 32); R(X - 5, hy + 1, 4, 1, 32);
      [[-4, -2], [-3, -2], [-3, -3], [0, -2], [1, -2], [1, -3], [3, -2], [-7, 2], [-8, 1], [-7, 5], [-2, -2]].forEach(([a, b]) => P(X + a, hy + b, 31)); P(X - 8, hy + 6, 32);
    },
    front(g) {
      const { P, R, X, torY, pose } = g; R(X - 4, torY, 9, 2, 6); R(X - 4, torY + 1, 3, 1, 7);
      if (pose === 'cheer') {
        R(X + 2, torY, 3, 3, 2); R(X + 4, torY - 3, 3, 4, 2); R(X + 6, torY - 6, 3, 4, 2); R(X + 6, torY - 8, 3, 2, 28);
        P(X + 7, torY - 9, 21); R(X + 5, torY - 10, 5, 1, 35); R(X + 6, torY - 24, 3, 14, 13); R(X + 7, torY - 23, 1, 12, 6); P(X + 7, torY - 25, 13);
      }
    },
  },
  mage: {
    leg: 8, tor: 10, robe: true, body: 33, bodyShade: 34, trim: 35, belt: 35, boot: 21, sleeve: 33, eye: 34, customArm: true,
    back(g) { const { R, X, hy, tor, sway } = g; R(X - 7, hy + 3, 3, tor + 5, 13); R(X - 7, hy + 3, 1, tor + 5, 12); R(X - 7 - sway, hy + 8 + tor, 3, 3, 13); },
    hair(g) { const { P, R, X, hy } = g; R(X - 5, hy + 1, 10, 2, 13); R(X - 5, hy + 3, 7, 1, 13); P(X + 4, hy + 3, 13); },
    front(g) {
      const { P, R, X, hy, torY, sway } = g, FYs = SFY;
      R(X - 8, hy + 1, 17, 1, 34); R(X - 7, hy, 15, 1, 33);                                                   // hat brim
      for (let k = 0; k < 11; k++) { const w = Math.max(2, 11 - k), xs = X - 5 + Math.floor(k * .3) - (k > 6 ? (k - 6) * 2 : 0); R(xs, hy - 1 - k, w, 1, k === 0 ? 35 : (k % 4 === 2 ? 34 : 33)); }
      const sx = X + 9;                                                                                       // staff with the orb
      R(sx, hy - 3, 1, FYs - hy + 2, 22); R(sx - 1, hy - 8, 3, 3, 38); P(sx, hy - 7, 6);
      P(sx - 2, hy - 5, 35); P(sx + 2, hy - 5, 35); P(sx - 1, hy - 4, 35); P(sx + 1, hy - 4, 35); P(sx, hy - 4, 35);
      R(X + 1, torY + 2, 7, 3, 33); R(X + 1, torY + 4, 7, 1, 34); R(X + 8, torY + 2, 2, 3, 28);
    },
  },
  archer: {
    leg: 9, tor: 10, body: 17, bodyShade: 16, belt: 22, legC: 21, legShade: 20, boot: 22, bootShade: 21, sleeve: 16, eye: 16,
    back(g) {
      const { P, R, X, torY, tor, sway } = g;
      R(X - 7, torY + 1, 4, tor + 4, 16); R(X - 7, torY + 1, 1, tor + 4, 15); R(X - 7 - sway, torY + tor + 5, 4, 2, 16);                                   // cloak
      for (let a = -1.25; a <= 1.25; a += .08) P(X - 9 - Math.round(4 * Math.cos(a)), torY + 5 + Math.round(12 * Math.sin(a)), 22);                      // bow
      for (let y = -11; y <= 11; y++) P(X - 10, torY + 5 + y, 7);
      R(X - 6, torY - 3, 3, 5, 22); P(X - 7, torY - 5, 6); P(X - 5, torY - 5, 31); P(X - 6, torY - 4, 24);
    },
    hair(g) {
      const { P, R, X, hy, frame } = g;
      R(X - 5, hy - 1, 10, 3, 41); R(X - 5, hy + 2, 10, 1, 41); P(X + 3, hy + 3, 41); P(X - 1, hy + 3, 41); R(X - 6, hy + 1, 2, 5, 41); R(X - 5, hy - 1, 5, 1, 35);
      for (let i = 0; i < 13; i++) { const x = X - 7 - Math.min(i, 5) + wave(i, frame, .8); P(x, hy + 3 + i, 41); P(x - 1, hy + 3 + i, i % 3 ? 41 : 35); if (i < 9) P(x + 1, hy + 3 + i, 41); }
    },
    front(g) { const { P, X, hy } = g; P(X - 5, hy + 6, 28); P(X - 6, hy + 5, 28); P(X - 7, hy + 4, 28); P(X - 8, hy + 3, 29); },                         // elf ear
  },
  knight: {
    leg: 10, tor: 12, wide: true, helm: true, noArm: true, body: 12, bodyShade: 10, belt: 35, legC: 12, legShade: 10, boot: 10, bootShade: 11, sleeve: 13,
    back(g) { const { R, X, torY, tor, sway } = g; R(X - 9, torY + 1, 5, tor + 6, 32); R(X - 8, torY + 1, 2, tor + 4, 31); R(X - 9 - sway, torY + tor + 7, 5, 2, 32); },
    hair(g) {
      const { P, R, X, hy, frame } = g;
      R(X - 5, hy + 1, 11, 9, 12); R(X - 4, hy, 9, 11, 12); R(X - 4, hy + 1, 3, 8, 13); R(X + 3, hy + 2, 2, 8, 10);
      R(X, hy + 5, 6, 1, 30); P(X + 2, hy + 7, 30); P(X + 4, hy + 7, 30); R(X - 4, hy - 1, 9, 1, 13); R(X - 4, hy + 10, 9, 1, 10);
      for (let i = 0; i < 10; i++) { const y = hy - 2 - Math.min(i, 3) + Math.max(0, i - 5) + wave(i, frame, .7); P(X + 1 - i, y, 31); P(X + 1 - i, y + 1, i > 6 ? 32 : 31); if (i > 1 && i < 8) P(X + 1 - i, y - 1, 31); }
    },
    front(g) {
      const { P, R, X, torY } = g;
      for (let j = 0; j < 14; j++) { const w = j < 8 ? 9 : Math.max(1, 9 - (j - 7) * 2), x0 = X + 1 + Math.floor((9 - w) / 2); R(x0, torY + 1 + j, w, 1, 2); P(x0, torY + 1 + j, 13); P(x0 + w - 1, torY + 1 + j, 13); }
      R(X + 1, torY + 1, 9, 1, 13); R(X + 5, torY + 3, 1, 9, 35); R(X + 3, torY + 6, 5, 1, 35);
    },
  },
  healer: {
    leg: 6, tor: 8, robe: true, body: 6, bodyShade: 7, trim: 35, belt: 35, boot: 37, sleeve: 7, eye: 37,
    back(g) {
      const { P, R, X, hy, sway } = g;
      for (let i = 0; i < 14; i++) { const w = i < 3 ? 3 : i < 10 ? 5 : 3; R(X - 9 - (i > 2 ? 1 : 0) - (i > 8 ? sway : 0), hy + 2 + i, w, 1, i % 3 === 2 ? 37 : 36); }
      P(X - 6, hy + 2, 35); P(X - 7, hy + 1, 35); P(X - 8, hy + 2, 35);
    },
    hair(g) { const { P, R, X, hy } = g; R(X - 5, hy - 1, 10, 3, 36); R(X - 5, hy + 2, 10, 1, 36); P(X + 4, hy + 3, 36); P(X - 1, hy + 3, 36); R(X - 5, hy + 3, 2, 6, 36); R(X - 5, hy - 1, 4, 1, 37); },
    front(g) { const { P, X, torY } = g; P(X, torY + 2, 35); P(X, torY + 3, 38); },
  },
};
function mkTraveler(kind, frame, pose) {
  const C = layer(SW, SHH), X = SX, FY = SFY, K = KINDS[kind];
  const P = (x, y, c) => lp(C, x, y, c), R = (x, y, w, h, c) => lr(C, x, y, w, h, c);
  const walking = pose === 'walk' || pose[0] === 'd', up = walking && (frame === 0 || frame === 2) ? -1 : 0;
  const spread = walking ? [0, 3, 0, -3][frame] : 0, sway = walking ? [0, 1, 0, -1][frame] : 0;
  const legH = K.leg, torW = K.wide ? 11 : 9, hw = torW >> 1, hipY = FY - legH, torY = hipY - K.tor + up, hy = torY - 11;
  const g = { C, P, R, X, FY, hipY, torY, hy, frame, sway, spread, up, pose, tor: K.tor };
  K.back(g);
  if (!K.robe) {
    const leg = (dx, c, cb) => { const k = Math.ceil(legH / 2), y1 = hipY + up + k; R(X - 1 + Math.round(dx / 2), hipY + up, 3, k, c); R(X - 1 + dx, y1, 3, FY - 2 - y1, c); R(X - 1 + dx, FY - 2, 4, 2, cb); };
    leg(-spread, K.legShade, K.bootShade); leg(spread, K.legC, K.boot);
  } else {
    for (let j = 0; j < legH - 1; j++) { const w = torW + 1 + (j >> 1), sh = j > legH / 2 ? sway : 0; R(X - (w >> 1) - sh, hipY + up + j, w, 1, j >= legH - 2 - up ? K.trim : K.body); P(X + (w >> 1) - sh, hipY + up + j, K.bodyShade); }
    R(X - 3 - (spread > 0 ? 1 : 0), FY - 1 - (spread < 0 ? 1 : 0), 3, 1, K.boot); R(X + 1 + (spread > 0 ? 1 : 0), FY - 1 - (spread > 0 ? 1 : 0), 3, 1, K.boot);
  }
  R(X - hw, torY, torW, K.tor, K.body); R(X + hw - 1, torY, 2, K.tor, K.bodyShade); R(X - hw, hipY + up - 2, torW, 1, K.belt);
  if (!K.helm) {
    R(X - 5, hy + 1, 11, 9, 28); R(X - 4, hy, 9, 11, 28); R(X - 3, hy + 10, 6, 1, 29);
    P(X + 2, hy + 4, 30); P(X + 3, hy + 4, 30); P(X + 2, hy + 5, K.eye); P(X + 3, hy + 5, 6); P(X + 2, hy + 6, K.eye); P(X + 3, hy + 6, K.eye);
    P(X, hy + 8, 36); P(X + 1, hy + 8, 36); P(X + 4, hy + 8, 29);
  }
  K.hair(g);
  if (!K.noArm && !K.customArm && pose !== 'cheer' && pose[0] !== 'd') { const ax = X - 1 - sway * 2; R(ax, torY + 1, 3, K.tor - 3, K.sleeve); R(ax - 1, torY + 2, 1, K.tor - 4, K.bodyShade); R(ax, torY + K.tor - 2, 3, 2, 28); }
  K.front(g);
  return outline(C, 30);
}
const SPR = {};
function buildParty() {
  for (const k of Object.keys(KINDS)) SPR[k] = { walk: [0, 1, 2, 3].map(f => mkTraveler(k, f, 'walk')), stand: mkTraveler(k, 0, 'stand') };
  SPR.hero.cheer = mkTraveler('hero', 0, 'cheer');
}

// =====================================================================
// Scenery layers, built once
// =====================================================================
const LY = {};
let SKYG;
function buildSky() { SKYG = new Uint8Array(PW * PH); for (let y = 0; y < PH; y++) { const v = Math.pow(Math.min(1, y / GROUND), .9) * 5.2; for (let x = 0; x < PW; x++) SKYG[y * PW + x] = Math.min(5, Math.floor(v + bay(x, y))); } }
function groundLayer(kind, seed) {
  const L = layer(540, PH - GROUND), r = Pixel.mulberry32(seed);
  const top = { meadow: [16, 17, 18], forest: [14, 15, 16], snow: [8, 7, 6], camp: [15, 16, 17] }[kind];
  const road = { meadow: [22, 23, 24], forest: [20, 21, 22], snow: [9, 8, 7], camp: [21, 22, 23] }[kind];
  for (let y = 0; y < L.h; y++) for (let x = 0; x < 540; x++) {
    const n = .5 + .5 * Math.sin(x / 540 * TAU * 7 + y * .3) * .4 + (hash(x, y, seed) - .5) * .5;
    if (y >= 6 && y < 26) L.d[y * 540 + x] = ramp(road, .25 + n * .55 + (y < 9 ? -.2 : 0), x, y);
    else L.d[y * 540 + x] = ramp(top, n * .8 + (y < 6 ? .3 : -y / 300), x, y);
  }
  for (let i = 0; i < 70; i++) { const x = r() * 540, y = 8 + r() * 16; lp(L, x, y, road[0]); if (r() > .6) lp(L, x + 1, y, kind === 'snow' ? 12 : 12); }
  for (let i = 0; i < 90; i++) {
    const x = r() * 540, y = r() > .25 ? 30 + r() * 50 : r() * 4;
    if (kind === 'meadow') { const c = [36, 35, 6, 31][Math.floor(r() * 4)]; lp(L, x, y, c); lp(L, x, y + 1, 16); if (r() > .5) { lp(L, x - 1, y, c); lp(L, x + 1, y, c); lp(L, x, y - 1, c); lp(L, x, y, 35); } }
    else if (kind === 'forest') { if (r() > .6) { lr(L, Math.round(x), Math.round(y), 5, 2, 31); lp(L, x + 1, y, 6); lp(L, x + 3, y + 1, 6); lr(L, Math.round(x) + 2, Math.round(y) + 2, 1, 2, 7); } else blob(L, x, y, 3, seed + i, RAMP.leaf, { flat: .2 }); }
    else if (kind === 'snow') { if (r() > .7) blob(L, x, y, 3 + r() * 3, seed + i, RAMP.rockNear, { flat: .3 }); }
    else { lp(L, x, y, 18); lp(L, x, y - 1, 17); }
  }
  return L;
}
function house(L, x, base, w, h, seed) {
  const r = Pixel.mulberry32(seed);
  lr(L, x, base - h, w, h, 7); lr(L, x + w - 4, base - h, 4, h, 13);
  for (let i = 0; i <= w; i += Math.round(w / 3)) lr(L, Math.min(x + i, x + w - 1), base - h, 1, h, 21);
  lr(L, x, base - h, w, 1, 21); lr(L, x, base - Math.round(h / 2), w, 1, 21); lr(L, x, base - 1, w, 1, 21);
  for (let i = 0; i < Math.round(w / 3); i++) lp(L, x + i, base - Math.round(h / 2) + Math.round(i * (h / 2) / (w / 3)), 21);
  lr(L, x + Math.round(w * .42), base - 11, 7, 11, 22); lr(L, x + Math.round(w * .42), base - 11, 1, 11, 21); lp(L, x + Math.round(w * .42) + 5, base - 6, 35);
  lr(L, x + 4, base - h + 5, 6, 6, 40); lr(L, x + 6, base - h + 5, 1, 6, 21); lr(L, x + 4, base - h + 7, 6, 1, 21);
  const rh = Math.round(w * .55);
  for (let j = 0; j <= rh; j++) { const hw = Math.round((w / 2 + 4) * (j / rh)); for (let i = -hw; i <= hw; i++) { const X = x + Math.round(w / 2) + i, Y = base - h - rh + j; lp(L, X, Y, (j % 4 === 3 || i > hw * .35) ? 32 : 31); } }
  lr(L, x + w - 9, base - h - rh + 2, 4, 9, 12); lr(L, x + w - 10, base - h - rh + 1, 6, 2, 10);
}
function buildMeadow() {
  // far: the Sky Tree on the horizon + pale peaks
  let L = layer(540, PH);
  [[60, 150, 40], [130, 110, 34], [470, 170, 44], [520, 120, 36]].forEach(([x, h, w], i) => spire(L, x, GROUND, h, w, 50 + i, RAMP.rockFar));
  const tx = 300, tb = GROUND;
  trunk(L, tx, tb - 150, tb, 5, 13, 61); trunk(L, tx, tb - 250, tb - 150, 4, 6, 62);
  const mini = (cx, cy, rx, ry, n, s) => { const r = Pixel.mulberry32(s), pts = []; for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()); pts.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 6 + r() * 8, s + i]); } pts.sort((a, b) => a[1] - b[1]).forEach(p => blob(L, p[0], p[1], p[2], p[3], RAMP.leaf, { spark: true })); };
  mini(tx, tb - 150, 70, 24, 36, 63); mini(tx, tb - 262, 62, 40, 50, 64);
  [[tx - 50, tb - 250, tb - 160], [tx + 44, tb - 262, tb - 150], [tx - 56, tb - 140, tb - 20], [tx + 58, tb - 136, tb - 26]].forEach(([x, y0, y1]) => { lr(L, x, y0, 3, y1 - y0, 7); lr(L, x + 1, y0, 1, y1 - y0, 6); lr(L, x, y0, 1, y1 - y0, 27); });
  cloudBank(L, tx - 60, tx + 70, tb - 200, 9, 65, .3); cloudBank(L, tx - 90, tx + 90, tb - 80, 10, 66, .3);
  haze(L, 4, .34); LY.meadowFar = L;
  // mid: rolling hills with trees
  LY.hills = hills(71); LY.hills2 = hills(171);
  // near: village
  L = layer(810, PH);
  house(L, 60, GROUND + 4, 44, 30, 81); house(L, 150, GROUND + 4, 56, 38, 82); house(L, 420, GROUND + 4, 48, 32, 83); house(L, 690, GROUND + 4, 50, 30, 84);
  for (let x = 220; x < 400; x += 9) { lr(L, x, GROUND - 6, 2, 10, 23); lp(L, x, GROUND - 7, 24); } lr(L, 220, GROUND - 4, 180, 1, 24); lr(L, 220, GROUND, 180, 1, 22);
  for (let y = 0; y < 70; y++) { const hw = 6 + y * .1; for (let x = -hw; x <= hw; x++) lp(L, 560 + x, GROUND - 66 + y, ramp(RAMP.stone, .75 - x / hw * .4 - (y % 8 === 0 ? .2 : 0), 560 + Math.round(x), y)); }
  for (let j = 0; j < 8; j++) for (let i = -8 + j; i <= 8 - j; i++) lp(L, 560 + i, GROUND - 67 - j, i > 2 ? 32 : 31);
  [[20, 12], [330, 14], [620, 11], [770, 13]].forEach(([x, rr], i) => { lr(L, x, GROUND - 16, 3, 20, 22); blob(L, x + 1, GROUND - 24, rr, 90 + i, RAMP.leaf, { spark: true }); blob(L, x - 5, GROUND - 16, rr * .7, 95 + i, RAMP.leaf, { spark: true }); });
  LY.village = L;
  LY.gMeadow = groundLayer('meadow', 5);
  // foreground grass and a signpost
  L = layer(810, 64); const r = Pixel.mulberry32(9);
  for (let x = 0; x < 810; x += 5 + r() * 9) blob(L, x, 58 - r() * 6, 5 + r() * 6, 100 + x, RAMP.leaf, { flat: .6, spark: true });
  for (let i = 0; i < 40; i++) { const x = r() * 810, y = 30 + r() * 20, c = [36, 35, 6][i % 3]; lr(L, Math.round(x), Math.round(y), 1, 30, 16); lr(L, Math.round(x) - 1, Math.round(y) - 1, 3, 3, c); lp(L, x, y, 35); }
  lr(L, 500, 8, 3, 56, 22); lr(L, 492, 12, 22, 8, 23); lr(L, 492, 12, 22, 1, 24); lr(L, 492, 19, 22, 1, 21); for (let i = 0; i < 4; i++) lp(L, 514 + i, 16 - Math.abs(i - 0) + 0, 23);
  LY.fgMeadow = L;
}
function hills(seed) {
  const L = layer(540, PH), r = Pixel.mulberry32(seed);
  for (let x = 0; x < 540; x++) {
    const top = Math.round(338 + (pnoise(x, 540, seed, 2) - .5) * 54);
    for (let y = top; y < GROUND + 8; y++) L.d[y * 540 + x] = ramp([15, 16, 17, 18], .85 - (y - top) / 60 + (vnoise(x * .2, y * .2, seed) - .5) * .4, x, y);
  }
  for (let i = 0; i < 16; i++) { const x = r() * 540, top = Math.round(338 + (pnoise(x, 540, seed, 2) - .5) * 54); lr(L, Math.round(x), top - 6, 2, 8, 21); blob(L, x + 1, top - 12, 6 + r() * 6, seed + i, RAMP.leaf, { spark: true }); }
  return L;
}
function buildForest() {
  let L = layer(540, PH), r = Pixel.mulberry32(21);
  for (let i = 0; i < 16; i++) { const x = i * 34 + r() * 14, w = 3 + r() * 5; for (let y = 0; y < GROUND + 6; y++) for (let dx = -w; dx <= w; dx++) lp(L, x + dx, y, dx < -w * .3 ? 26 : 25); }
  LY.forestFar = L;
  L = layer(810, PH); r = Pixel.mulberry32(22);
  [[70, 15], [300, 19], [520, 14], [720, 17]].forEach(([x, w], i) => {
    trunk(L, x, 30, GROUND + 8, w, w + 9, 30 + i, RAMP.bark, -.08);
    for (let k = 0; k < 3; k++) { const dir = k % 2 ? 1 : -1; for (let s = 0; s < 22; s++) blob(L, x + dir * (w + s * 1.4), GROUND + 6 - s * .25, 4 - s * .12, 300 + i * 9 + k, RAMP.bark, { tex: .3, bias: -.1 }); }
    for (let k = 0; k < 6; k++) blob(L, x + (r() - .5) * w * 2.4, 180 + r() * 190, 3 + r() * 3, 320 + i * 7 + k, RAMP.leaf, { tex: .3 });            // moss
  });
  for (let i = 0; i < 150; i++) blob(L, r() * 810, r() * r() * 150, 10 + r() * 16, 400 + i, RAMP.leafDark, { bias: -.02, spark: false });
  for (let i = 0; i < 26; i++) { const x = r() * 810, len = 40 + r() * 120; for (let y = 60; y < 60 + len; y++) { lp(L, x + Math.sin(y * .08 + i) * 2, y + 40, y % 5 ? 15 : 16); if (y % 9 === 0) lp(L, x + Math.sin(y * .08 + i) * 2 + 1, y + 40, 17); } }
  LY.forestMid = L;
  LY.gForest = groundLayer('forest', 6);
  L = layer(810, PH); r = Pixel.mulberry32(23);
  for (let x = 0; x < 810; x += 8 + r() * 14) for (let k = 0; k < 5; k++) { const a = -1.9 + k * .45; for (let s = 0; s < 22; s++) lp(L, x + Math.cos(a) * s, PH - 4 - Math.abs(Math.sin(a)) * s * 1.6 + s * s * .02, s % 3 ? 15 : 16); }
  LY.fgForest = L;
}
function buildMountain() {
  let L = layer(540, PH);
  [[70, 290, 80], [215, 340, 90], [360, 260, 76], [480, 310, 84]].forEach(([x, h, w], i) => spire(L, x, GROUND + 10, h, w, 500 + i, RAMP.rockFar, { snow: .34 }));
  LY.peaks = L;
  L = layer(540, 60); cloudBank(L, -10, 550, 44, 16, 510, .5); LY.mtnCloud = L;
  L = layer(540, PH); const r = Pixel.mulberry32(52);
  for (let x = 0; x < 540; x++) {
    const top = Math.round(330 + (pnoise(x, 540, 4, 4) - .5) * 60 + (hash(x >> 2, 3, 5) - .5) * 8);
    for (let y = top; y < GROUND + 8; y++) L.d[y * 540 + x] = y < top + 3 + hash(x, 1, 2) * 3 ? (y === top ? 6 : 7) : ramp(RAMP.rockNear, .7 - (y - top) / 70 + (vnoise(x * .2, y * .1, 53) - .5) * .5, x, y);
  }
  for (let i = 0; i < 12; i++) { const x = r() * 540, top = Math.round(330 + (pnoise(x, 540, 4, 4) - .5) * 60); pine(L, x, top + 2, 16 + r() * 18, 520 + i); }
  LY.ridge = L;
  LY.gSnow = groundLayer('snow', 7);
  L = layer(810, 90); const r2 = Pixel.mulberry32(54);
  for (let i = 0; i < 9; i++) { const x = 40 + i * 90 + r2() * 30, rr = 12 + r2() * 14; blob(L, x, 78, rr, 540 + i, RAMP.rockNear, { flat: .7 }); blob(L, x - 2, 78 - rr * .7, rr * .6, 560 + i, RAMP.snow, { flat: .1, bias: .2 }); }
  LY.fgSnow = L;
}
function buildBridge() {
  let L = layer(540, PH);
  [[40, 200, 70], [150, 150, 60], [300, 230, 80], [430, 170, 66], [520, 140, 50]].forEach(([x, h, w], i) => spire(L, x, GROUND + 30, h, w, 600 + i, [11, 10, 10, 9]));
  LY.duskFar = L;
  L = layer(810, PH); const r = Pixel.mulberry32(61);
  const wall = (x0, x1, seed) => { for (let x = x0; x <= x1; x++) { const edge = Math.min(x - x0, x1 - x), top = Math.round(210 + (vnoise(x * .05, 0, seed) - .5) * 50 - Math.min(40, edge) * .6 + 24); for (let y = top; y < PH; y++) { const shelf = Math.floor((y + vnoise(x * .08, 1, seed) * 14) / 20); L.d[y * 810 + x] = ramp(RAMP.rockNear, .28 + vnoise(x * .12, shelf * 3.1, seed) * .6 - (y - top) / 500 - (edge < 4 ? .3 : 0), x, y); } if (x % 3 === 0) blob(L, x, top, 4 + r() * 4, seed + x, RAMP.leaf, { flat: .3, spark: true }); } for (let i = 0; i < 6; i++) { const x = x0 + 10 + r() * (x1 - x0 - 20); pine(L, x, Math.round(210 + (vnoise(x * .05, 0, seed) - .5) * 50 - 12), 20 + r() * 20, seed + i); } };
  wall(0, 250, 62); wall(560, 809, 63); LY.chasm = L;
  L = layer(540, 50); cloudBank(L, -10, 550, 40, 18, 64, .6); LY.mist = L;
  // bridge: back rail, deck with arches, front rail
  const back = layer(540, PH), front = layer(540, PH);
  for (let x = 0; x < 540; x++) {
    const sx = x % 90, deckTop = GROUND + 2;
    for (let y = deckTop; y < deckTop + 24; y++) back.d[y * 540 + x] = ramp(RAMP.stone, .62 + (hash(x >> 3, y >> 2, 65) - .5) * .3 - ((x % 16 === 0 || y % 8 === 0) ? .22 : 0) - (y - deckTop) / 90, x, y);
    const arch = sx < 12 ? PH : deckTop + 30 + Math.round(34 * (1 - Math.sqrt(Math.max(0, 1 - ((sx - 51) / 40) ** 2))));
    for (let y = deckTop + 24; y < Math.min(PH, sx < 12 ? PH : arch); y++) front.d[y * 540 + x] = ramp(RAMP.stone, .42 + (hash(x >> 3, y >> 2, 66) - .5) * .3 - ((x % 16 === 0 || y % 8 === 0) ? .2 : 0) - (sx < 12 ? (sx / 12) * .2 : .1), x, y);
    back.d[(GROUND - 12) * 540 + x] = 13; back.d[(GROUND - 11) * 540 + x] = 12; back.d[(GROUND - 10) * 540 + x] = 10;
    if (x % 30 < 4) for (let y = GROUND - 14; y < deckTop; y++) back.d[y * 540 + x] = x % 30 === 0 ? 13 : x % 30 === 3 ? 10 : 12;
    front.d[(deckTop + 16) * 540 + x] = 13; front.d[(deckTop + 17) * 540 + x] = 12; front.d[(deckTop + 18) * 540 + x] = 10;
    if ((x + 15) % 30 < 4) for (let y = deckTop + 14; y < deckTop + 26; y++) front.d[y * 540 + x] = (x + 15) % 30 === 0 ? 13 : (x + 15) % 30 === 3 ? 10 : 12;
  }
  for (const x of [60, 330]) { lr(back, x, GROUND - 44, 2, 32, 20); lr(back, x - 3, GROUND - 52, 8, 8, 40); lr(back, x - 4, GROUND - 53, 10, 1, 20); lr(back, x - 3, GROUND - 44, 8, 1, 20); lr(back, x - 1, GROUND - 50, 4, 4, 42); }
  LY.bridgeBack = back; LY.bridgeFront = front;
}
function buildCamp() {
  let L = layer(PW, PH); const r = Pixel.mulberry32(71);
  for (let x = 0; x < PW; x++) { const top = Math.round(330 + (vnoise(x * .03, 0, 72) - .5) * 40); for (let y = top; y < GROUND + 8; y++) L.d[y * PW + x] = ramp([14, 14, 25], .4 + hash(x, y, 3) * .3, x, y); }
  for (let i = 0; i < 26; i++) { const x = r() * PW; pine(L, x, 345 + r() * 40, 50 + r() * 110, 700 + i, [14, 14, 25, 26]); }
  LY.campFar = L;
  LY.gCamp = groundLayer('camp', 8);
  L = layer(PW, PH);
  for (let y = 0; y < 22; y++) for (let x = -70; x <= 70; x++) if ((x / 70) ** 2 + ((y - 10) / 11) ** 2 < 1) lp(L, 135 + x, GROUND + 4 + y, ramp([21, 22, 23], .4 + hash(x, y, 9) * .5, x, y));   // clearing
  for (let j = 0; j < 46; j++) { const hw = Math.round(j * .62); for (let i = -hw; i <= hw; i++) lp(L, 30 + i, GROUND - 40 + j, i > hw * .3 ? 22 : (i > -2 && i < 3 && j > 18 ? 20 : (j % 9 === 0 ? 23 : 24))); }  // tent
  lr(L, 30, GROUND - 46, 1, 8, 21); lp(L, 31, GROUND - 46, 31); lp(L, 32, GROUND - 45, 31); lp(L, 31, GROUND - 45, 31);
  LY.campSet = L;
  L = layer(PW, PH);
  const log = (x0, x1) => { for (let y = 0; y < 9; y++) for (let x = x0; x <= x1; x++) { const e = Math.min(x - x0, x1 - x); if (e + Math.min(y, 8 - y) < 2) continue; lp(L, x, FEET - 8 + y, ramp(RAMP.bark, .8 - y / 9 + (hash(x >> 2, 1, 4) - .5) * .25, x, y)); } lr(L, x1 - 3, FEET - 6, 3, 5, 24); lp(L, x1 - 2, FEET - 4, 22); };
  log(66, 120); log(150, 216); LY.campLogs = L;
}
function buildCastle() {
  const L = layer(540, PH), r = Pixel.mulberry32(81), cx = 300;
  for (let x = 0; x < 540; x++) { const d = (x - cx) / 190, top = Math.round(GROUND + 6 - 86 * Math.max(0, 1 - d * d) - (vnoise(x * .06, 0, 82) - .5) * 8); for (let y = top; y < GROUND + 8; y++) L.d[y * 540 + x] = ramp([15, 16, 17, 18], .8 - (y - top) / 70 + (vnoise(x * .2, y * .2, 83) - .5) * .4, x, y); }
  const stone = (x, y, w, h, s) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let v = .78 - (i / w) * .45 + (hash((x + i) >> 2, (y + j) >> 2, s) - .5) * .25; if ((y + j) % 6 === 0) v -= .12; lp(L, x + i, y + j, ramp(RAMP.stone, v, x + i, y + j)); } };
  const tower = (x, base, w, h, roof, s) => {
    stone(x, base - h, w, h, s); for (let i = 0; i < w; i += 4) lr(L, x + i, base - h - 3, 2, 3, 13);
    const rh = Math.round(w * 1.3); for (let j = 0; j < rh; j++) { const hw = Math.round((w / 2 + 2) * (j / rh)); for (let i = -hw; i <= hw; i++) lp(L, x + (w >> 1) + i, base - h - 3 - rh + j, i > hw * .2 ? roof[1] : roof[0]); }
    lr(L, x + (w >> 1), base - h - 3 - rh - 10, 1, 10, 20);
    lr(L, x + (w >> 1) - 1, base - h + 8, 3, 6, 11); if (h > 60) lr(L, x + (w >> 1) - 1, base - h + 30, 3, 6, 11);
    return [x + (w >> 1), base - h - 3 - rh - 10];
  };
  const base = GROUND - 74; LY.flags = [];
  stone(cx - 84, base - 26, 168, 30, 84); for (let i = 0; i < 168; i += 6) lr(L, cx - 84 + i, base - 30, 3, 4, 13);
  LY.flags.push(tower(cx - 92, base + 4, 18, 56, [2, 1], 85), tower(cx + 74, base + 4, 18, 56, [2, 1], 86));
  LY.flags.push(tower(cx - 46, base - 20, 16, 62, [31, 32], 87), tower(cx + 30, base - 20, 16, 70, [31, 32], 88));
  LY.flags.push(tower(cx - 16, base - 24, 30, 104, [2, 1], 89));
  for (let j = 0; j < 20; j++) for (let i = -7; i <= 7; i++) if (j > 6 || i * i + (j - 7) ** 2 < 50) lp(L, cx + i, base - 16 + j, i === 0 ? 21 : 11);       // gate
  for (let i = 0; i < 16; i++) { const x = cx - 150 + r() * 300, d = (x - cx) / 190, y = Math.round(GROUND + 6 - 86 * Math.max(0, 1 - d * d)) + 6 + r() * 18; lr(L, Math.round(x), Math.round(y), 9, 6, 7); for (let j = 0; j < 5; j++) lr(L, Math.round(x) - 1 + j, Math.round(y) - 5 + j, 11 - j * 2, 1, r() > .5 ? 31 : 32); }
  for (let s = 0; s < 90; s++) { const p = s / 90, x = lerp(cx, cx - 150 + Math.sin(p * 5) * 26, p * p), d = (x - cx) / 190, y = lerp(base + 6, GROUND + 6, p); lr(L, Math.round(x - 1 - p * 3), Math.round(y), Math.round(3 + p * 7), 1, s % 2 ? 24 : 23); }
  haze(L, 5, .2); LY.castle = L;
  const m = layer(20, 22); for (let j = 0; j < 20; j++) for (let i = 0; i < 12; i++) if (j > 4 || (i - 5.5) ** 2 + (j - 5) ** 2 < 34) lp(m, 4 + i, 2 + j, i > 8 ? 10 : j % 7 === 6 ? 12 : 13); lr(m, 8, 8, 4, 1, 11); lr(m, 9, 11, 2, 5, 11); LY.milestone = outline(m, 11);
}

// =====================================================================
// Frame helpers
// =====================================================================
const scr = Pixel.screen({ w: PW, h: PH, palette: PALETTE });
function blit(L, sx, sy, flip = false) {
  const px = scr.px; sx = Math.round(sx); sy = Math.round(sy);
  const y0 = Math.max(0, sy), y1 = Math.min(PH, sy + L.h), x0 = Math.max(0, sx), x1 = Math.min(PW, sx + L.w);
  for (let y = y0; y < y1; y++) { const row = (y - sy) * L.w, o = y * PW; for (let x = x0; x < x1; x++) { const v = L.d[row + (flip ? L.w - 1 - (x - sx) : x - sx)]; if (v !== 255) px[o + x] = v; } }
}
function blitX(L, scroll, y) { const o = -(((Math.round(scroll) % L.w) + L.w) % L.w); for (let x = o; x < PW; x += L.w) blit(L, x, y); }
const sky = () => scr.px.set(SKYG);
function shadow(x, y, w) { scr.dither(.5); scr.elli(x - w, y - 2, w * 2, 4, 14); scr.dither(); }
function party(t, shot) {
  const stopped = t >= STOP.to - .05 && shot.id === 'castle';
  PARTY.forEach((m, i) => {
    const S = SPR[m.kind]; shadow(m.x, FEET, 8);
    let spr = stopped ? S.stand : S.walk[cyc(t * 8 + i * 1.3, 4)], dy = 0;
    if (stopped) { dy = cyc(t * 2 + i * .7, 2) === 0 && m.kind !== 'knight' ? 0 : 0; if (m.kind === 'hero' && t >= CHEER) spr = S.cheer; }
    blit(spr, m.x - SX, FEET - SFY + dy);
    extras(m, t, m.x, FEET, false);
  });
  if (stopped && t >= CHEER) { const k = cyc((t - CHEER) * 10, 6), x = PARTY[4].x + 7, y = FEET - 46; if (k < 3) { scr.pset(x, y, 42); for (let d = 1; d <= 3 - k; d++) scr.pset(x + d, y, 42).pset(x - d, y, 42).pset(x, y + d, 42).pset(x, y - d, 42); } }
}
function extras(m, t, x, y, flip) {
  const dir = flip ? -1 : 1;
  if (m.kind === 'healer') { const fx = Math.round(x - dir * 15), fy = Math.round(y - 44 + Math.sin(t * 4) * 3), wf = cyc(t * 10, 2); scr.circ(fx, fy, 2, 40).pset(fx, fy, 42).pset(fx - 3, fy - (wf ? 2 : 0), 6).pset(fx - 4, fy - (wf ? 3 : 1), 6).pset(fx + 3, fy - (wf ? 2 : 0), 6).pset(fx + 4, fy - (wf ? 3 : 1), 6); }
  if (m.kind === 'mage' && cyc(t * 6, 3) === 0) { const ox = x + dir * 9, oy = y - 38; scr.pset(ox - 2, oy, 42).pset(ox + 2, oy, 42).pset(ox, oy - 2, 42).pset(ox, oy + 2, 42); }
}
function waterfallAt(x0, w, y0, y1, t) {
  const px = scr.px;
  for (let y = Math.max(0, y0); y < Math.min(PH, y1); y++) for (let i = 0; i < w; i++) {
    const x = x0 + i; if (x < 0 || x >= PW) continue;
    const n = vnoise(i * .7 + 3, (y - t * 130) * .05, 11);
    px[y * PW + x] = i === 0 || i === w - 1 ? 4 : n > .66 ? 6 : n > .45 ? 7 : n > .3 ? 27 : 5;
  }
}
function birds(t, x0, y0, n, speed) { for (let i = 0; i < n; i++) { const x = Math.round(x0 + t * speed + i * 9 + Math.sin(i * 3) * 4), y = Math.round(y0 + Math.sin(i * 2.1) * 8 + Math.sin(t * 2 + i) * 2), f = cyc(t * 7 + i, 2); scr.pset(x - 2, y + (f ? 0 : 1), 11).pset(x - 1, y + (f ? 1 : 0), 11).pset(x, y + (f ? 0 : 1), 11).pset(x + 1, y + (f ? 1 : 0), 11).pset(x + 2, y + (f ? 0 : 1), 11); } }
function windmillBlades(cx, cy, t) {
  if (cx < -50 || cx > PW + 50) return; const A = t * 1.1;
  for (let k = 0; k < 4; k++) { const a = A + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); for (let r = 3; r <= 30; r += .5) for (let w = -3; w <= 3; w++) { const X = Math.round(cx + ca * r - sa * w), Y = Math.round(cy + sa * r + ca * w), edge = Math.abs(w) === 3 || r > 29.4; if (edge || w === 0 || Math.round(r) % 5 === 0) scr.pset(X, Y, edge ? 20 : 21); else if (bay(X, Y) > .5) scr.pset(X, Y, 24); } }
  scr.circ(cx, cy, 2, 20);
}

// =====================================================================
// Scenes
// =====================================================================
const SCENES = {
  meadow(t, s) {
    const sc = scrollX(t) - scrollX(s.start);
    sky(); blitX(LY.meadowFar, 170 + sc * .08, 0); blitX(LY.hills, sc * .3, 0); blitX(LY.village, 20 + sc * .65, 0);
    windmillBlades(560 - Math.round(20 + sc * .65), GROUND - 66, t);
    blitX(LY.gMeadow, sc, GROUND); party(t, s); blitX(LY.fgMeadow, sc * 1.5, PH - 64);
    const ta = seg(t, .25, 1.1) * (1 - seg(t, 3.1, 3.7));
    if (ta > 0) { scr.dither(ta); scr.text(135, 70, 'THE JOURNEY', 6, { scale: 4, align: 'center', outline: 11 }); scr.dither(); }
  },
  forest(t, s) {
    const sc = scrollX(t) - scrollX(s.start), px = scr.px;
    for (let y = 0; y < PH; y++) { const v = y / PH * 2.6; for (let x = 0; x < PW; x++) px[y * PW + x] = [14, 25, 26][Math.min(2, Math.floor(v + bay(x, y) - .2))]; }
    blitX(LY.forestFar, sc * .25, 0);
    for (let k = 0; k < 3; k++) { const a = .16 + .1 * Math.sin(t * 1.4 + k * 2), x0 = 30 + k * 86 + Math.round(Math.sin(t * .5 + k) * 6); scr.dither(a); scr.tri(x0, 0, x0 + 34, 0, x0 + 150, GROUND + 10, 19); scr.tri(x0, 0, x0 + 150, GROUND + 10, x0 + 100, GROUND + 10, 19); scr.dither(); }
    blitX(LY.forestMid, 40 + sc * .6, 0); blitX(LY.gForest, sc, GROUND);
    const r = Pixel.mulberry32(5);
    for (let i = 0; i < 18; i++) { const x = r() * PW + Math.sin(t * (.6 + r()) + i) * 14, y = 150 + r() * 250 + Math.cos(t * (.5 + r()) + i * 2) * 10; if (cyc(t * 3 + i * .7, 3) !== 0) { scr.pset(x, y, 40); if (cyc(t * 3 + i * .7, 3) === 1) scr.pset(x + 1, y, 19).pset(x - 1, y, 19).pset(x, y + 1, 19).pset(x, y - 1, 19); } }
    party(t, s); blitX(LY.fgForest, sc * 1.7, 0);
  },
  mountain(t, s) {
    const sc = scrollX(t) - scrollX(s.start);
    sky(); blitX(LY.peaks, 30 + sc * .1, 0); blitX(LY.mtnCloud, -t * 5, 250); blitX(LY.ridge, sc * .4, 0); blitX(LY.gSnow, sc, GROUND);
    party(t, s); blitX(LY.fgSnow, sc * 1.5, PH - 86);
    const r = Pixel.mulberry32(8);
    for (let i = 0; i < 90; i++) { const sp = 60 + r() * 80, x = ((r() * PW - t * sp - sc) % PW + PW) % PW, y = ((r() * PH + t * sp * .45) % PH + PH) % PH, big = r() > .75; scr.pset(x, y, 6); if (big) scr.pset(x + 1, y, 7).pset(x, y + 1, 7); }
  },
  bridge(t, s) {
    const sc = scrollX(t) - scrollX(s.start), sx = 178, sy = 300;
    sky();
    scr.dither(.5).circ(sx, sy, 52, 39).dither(); scr.circ(sx, sy, 44, 39).circ(sx, sy, 39, 40).dither(.5).circ(sx, sy, 28, 42).dither();
    for (let i = 0; i < 5; i++) { const y = 236 + i * 26, x = ((i * 97 - t * (3 + i)) % 340 + 340) % 340 - 60; scr.dither(.7).elli(x, y, 70 + i * 12, 4, i % 2 ? 9 : 8).dither(); }
    birds(t, 40, 262, 6, 16);
    blitX(LY.duskFar, sc * .08, 0); blitX(LY.chasm, 40 + sc * .3, 0);
    const wx = 150 - Math.round(40 + sc * .3); waterfallAt(wx, 22, 236, PH, t);
    blitX(LY.mist, sc * .5 + t * 6, PH - 46); blitX(LY.bridgeBack, sc, 0);
    party(t, s); blitX(LY.bridgeFront, sc, 0);
  },
  camp(t, s) {
    const lt = t - s.start, px = scr.px;
    sky();
    const r = Pixel.mulberry32(12);
    for (let i = 0; i < 90; i++) { const x = Math.floor(r() * PW), y = Math.floor(r() * 330), tw = cyc(t * 2.5 + r() * 9, 5); if (tw === 0) continue; scr.pset(x, y, 42); if (r() > .82 && tw > 2) scr.pset(x + 1, y, 8).pset(x - 1, y, 8).pset(x, y + 1, 8).pset(x, y - 1, 8); }
    scr.circ(212, 96, 22, 42).circ(204, 90, 4, 5).circ(218, 104, 6, 5).circ(222, 88, 3, 5).dither(.4).circ(212, 96, 27, 5).dither();
    const ss = seg(lt, 1.2, 1.7); if (ss > 0 && ss < 1) for (let k = 0; k < 16; k++) { scr.dither(1 - k / 16); scr.pset(40 + ss * 150 - k * 2, 60 + ss * 60 - k * .8, 42); scr.dither(); }
    blit(LY.campFar, 0, 0); blit(LY.gCamp, 0, GROUND); blit(LY.gCamp, 540 - PW > 0 ? 0 : 0, GROUND); blit(LY.campSet, 0, 0);
    const fl = .5 + .5 * Math.sin(t * 11) * Math.sin(t * 7.3);
    scr.dither(.28 + fl * .1).elli(135 - 62, FEET - 16, 124, 30, 39).dither(); scr.dither(.3).elli(135 - 34, FEET - 10, 68, 18, 40).dither();
    const seats = [['knight', 88, false], ['healer', 110, false], ['mage', 160, true], ['archer', 181, true], ['hero', 202, true]];
    seats.forEach(([k, x, flip], i) => { const bob = cyc(t * 1.6 + i * .37, 2); blit(SPR[k].stand, x - (flip ? SW - 1 - SX : SX), FEET - SFY - 5 + (bob ? 1 : 0), flip); extras({ kind: k }, t, x, FEET - 5, flip); });
    blit(LY.campLogs, 0, 0);
    // fire: logs, flames from noise, sparks
    scr.rect(123, FEET - 4, 24, 4, 21).rect(126, FEET - 6, 18, 3, 22).pset(124, FEET - 5, 20).pset(146, FEET - 5, 20);
    for (let x = -11; x <= 11; x++) { const h = (1 - Math.abs(x) / 12) * (32 + 18 * vnoise(x * .35 + 40, t * 7, 3)) + 3; for (let y = 0; y < h; y++) { const p = y / h, c = p < .28 ? 42 : p < .55 ? 40 : p < .8 ? 39 : 31; if (p > .7 && bay(x + 200, y + Math.floor(t * 20)) > .6) continue; scr.pset(135 + x + Math.round(Math.sin(y * .3 + t * 9) * (p * 2)), FEET - 6 - y, c); } }
    const r2 = Pixel.mulberry32(13);
    for (let i = 0; i < 14; i++) { const per = 1.2 + r2() * 1.4, p = ((t + r2() * per) % per) / per, x = 135 + (r2() - .5) * 16 + Math.sin(p * 7 + i) * 6 * p, y = FEET - 26 - p * 90; if (p < .9) scr.pset(x, y, p < .5 ? 40 : 39); }
  },
  castle(t, s) {
    const sc = scrollX(t) - scrollX(s.start), lt = t - s.start, px = scr.px;
    sky();
    const sy = Math.round(lerp(372, 292, inOutSine(seg(lt, 0, 5)))), sx = 132;
    for (let y = 0; y < GROUND; y++) for (let x = 0; x < PW; x++) { const o = y * PW + x, c = px[o]; if (c > 4) continue; const a = Math.atan2(y - sy, x - sx), d = Math.hypot(x - sx, y - sy), k = (Math.sin(a * 14 + t * .5) * .5 + .5) ** 2 * (1 - d / 330) * .8; if (k > bay(x, y) + .12) px[o] = c + 1; }
    scr.dither(.5).circ(sx, sy, 40, 40).dither(); scr.circ(sx, sy, 32, 40).circ(sx, sy, 24, 42);
    const fx = 110 + sc * .12; blitX(LY.castle, fx, 0);
    LY.flags.forEach(([x, y], i) => { const X = (((x - Math.round(fx)) % 540) + 540) % 540; for (let k = 1; k <= 9; k++) { const wy = Math.round(Math.sin(k * .8 - t * 6 + i) * 1.2); scr.pset(X + k, y + wy, i === 4 ? 35 : 31).pset(X + k, y + 1 + wy, i === 4 ? 35 : 31).pset(X + k, y + 2 + wy, i === 4 ? 39 : 32); if (k < 7) scr.pset(X + k, y + 3 + wy, i === 4 ? 39 : 32); } });
    birds(t, -40, 150, 4, 22);
    blitX(LY.hills2, 60 + sc * .35, 26); blitX(LY.gMeadow, 200 + sc, GROUND);
    blit(LY.milestone, 222 - Math.round(sc * 1) + 76, FEET - 30);
    party(t, s); blitX(LY.fgMeadow, 300 + sc * 1.5, PH - 64);
    const a1 = seg(t, 17.55, 17.9), a2 = seg(t, 18.1, 18.5);
    if (a1 > 0) { scr.dither(a1); scr.text(135, 40, 'FIVE TRAVELERS', 6, { scale: 3, align: 'center', outline: 11 }); scr.dither(); }
    if (a2 > 0) { scr.dither(a2); scr.text(135, 64, 'ONE ROAD', 40, { scale: 5, align: 'center', outline: 11 }); scr.dither(); }
  },
};

// =====================================================================
// Time of day: one palette, re-tinted in steps
// =====================================================================
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const PALS = { day: PALETTE.map(hex2) };
for (const k of ['dusk', 'night', 'dawn']) PALS[k] = PALETTE.map((h, i) => i < 6 ? hex2(SKIES[k][i]) : EMISSIVE.has(i) ? hex2(h) : hex2(h).map((v, j) => v * TINT[k][j]));
const palCache = new Map();
function paletteAt(t) {
  let i = 0; while (i < LIGHT_KEYS.length - 2 && t >= LIGHT_KEYS[i + 1][0]) i++;
  const [t0, a] = LIGHT_KEYS[i], [t1, b] = LIGHT_KEYS[i + 1], k = Math.round(seg(t, t0, t1) * 8) / 8, key = `${a}|${b}|${k}`;   // 8 banded steps
  if (!palCache.has(key)) palCache.set(key, PALS[a].map((c, n) => toHex(c.map((v, j) => lerp(v, PALS[b][n][j], k)))));
  return palCache.get(key);
}

// =====================================================================
// Frame
// =====================================================================
const bufA = new Uint8Array(PW * PH), bufB = new Uint8Array(PW * PH);
const B8 = (() => { const m = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21]; return (x, y) => (m[(y & 7) * 8 + (x & 7)] + .5) / 64; })();
function renderShot(shot, t) { scr.reset(); SCENES[shot.id](t, shot); }
function draw(t, ctx) {
  const tr = TRANSITIONS.find(x => t >= x.at - x.dur / 2 && t < x.at + x.dur / 2);
  if (!tr) renderShot(SHOTS.find(s => t >= s.start && t < s.end) || SHOTS[SHOTS.length - 1], t);
  else {
    const i = SHOTS.findIndex(s => s.start === tr.at), p = (t - (tr.at - tr.dur / 2)) / tr.dur;
    renderShot(SHOTS[i - 1], t); bufA.set(scr.px); renderShot(SHOTS[i], t); bufB.set(scr.px);
    const px = scr.px;
    if (tr.type === 'wipe') { const e = lerp(PW + 50, -50, inOutSine(p)); for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) px[y * PW + x] = x > e + (B8(x >> 1, y >> 1) - .5) * 90 ? bufB[y * PW + x] : bufA[y * PW + x]; }
    else for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) px[y * PW + x] = p > B8(x >> 1, y >> 1) ? bufB[y * PW + x] : bufA[y * PW + x];
  }
  const c = scr.render({ palette: paletteAt(t) }), i = VIEWS.findLastIndex(v => t >= v.from), v = VIEWS[i];
  ctx.imageSmoothingEnabled = false;
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, 0, 0, W, H);
  else { const end = VIEWS[i + 1] ? VIEWS[i + 1].from : DURATION, pr = v.pan ?? 8, pan = Math.round(lerp(-pr, pr, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, 0, 0, W, H); }
}

// =====================================================================
// Score: chiptune, 96 BPM, 8 bars
// =====================================================================
const K = '@0 @ENV1 @GLI1 O2 C16', HT = '@3 @ENV3 @GLI0 O7 C16', SN = '@3 @ENV2 @GLI0 O5 C16', _ = 'R16';
const DB = [K, _, HT, _, SN, _, HT, _, K, K, HT, _, SN, _, HT, HT], drumBar = DB.join(' ');
const PREFIX = `T${BPM} @ENV1 { 115, 16, 0 } @ENV2 { 90, 20, 0 } @ENV3 { 55, 6, 0 } @ENV4 { 127, 60, 85 } @ENV5 { 110, 10, 30 } @VIB1 { 24, 12, 25 } @GLI1 { 2400, 10 } @ENV0 @VIB0 @GLI0`;
const TRACKS = [
  { gain: .36, mml: 'O2 L8 Q75 @0 [C>C<]4 [<G>G]4 [<A>A]4 [<F>F]4 | L2 Q95 D D | <G1> | L8 Q75 [C>C<]4 [<F>F]2 <G8>G8 C4' },                       // bass
  { gain: .25, mml: '@1 O5 L8 Q88 @ENV4 @VIB1 E4 G8 >C8< G4 E8 G8 | D4 G8 B8 >D4< B8 G8 | C4 E8 A8 >C4< A8 E8 | F4 A8 >C8 F4 E8 C8< | V70 D4 F8 A8 F2 | G2 R4 V100 B8 >D8 | E4 C8 E8 G4 E8 C8 | F4 E8 D8 C2<' },   // lead
  { gain: .18, pan: -.3, mml: '@2 O4 L16 V80 Q90 @ENV5 [CEG>C<]4 [<GB>DG]4 [<A>CEA]4 [<FA>CF]4 | L8 V60 [DFA>D<]2 | [<GB>DG]2 | L16 V85 [CEG>C<]4 [<FA>CF]2 <GB>DG CEG>C<' },                              // arp
  { gain: .28, pan: .3, mml: `L16 Q100 [ ${drumBar} ]4 ${DB.slice(0, 8).join(' ')} R2 | R2 R4 ${SN} ${SN} ${SN} ${SN} | [ ${drumBar} ]2` },                                                                       // drums: out for the camp, a pickup back in
];
function master(ac) { const m = ac.createGain(), c = ac.createDynamicsCompressor(); m.gain.value = .95; c.threshold.value = -16; c.ratio.value = 3; m.connect(c).connect(ac.destination); return m; }
function crackle(ac, out) {                                         // campfire: seeded noise ticks during the camp
  const r = Pixel.mulberry32(77), b = ac.createBuffer(1, ac.sampleRate * .05, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * (1 - i / d.length) ** 2;
  for (let t = SH.camp.start + .2; t < SH.camp.end - .2; t += .07 + r() * .25) { const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = 1800 + r() * 3000; g.gain.value = .05 + r() * .09; s.playbackRate.value = .7 + r() * .8; s.connect(f).connect(g).connect(out); s.start(t); }
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * DURATION), sr), m = master(oac);
  Chip.play(oac, 0, m, TRACKS, { prefix: PREFIX }); crackle(oac, m);
  return encodeWavBase64(await oac.startRendering());
};
function encodeWavBase64(ab) {
  const ch = ab.numberOfChannels, sr = ab.sampleRate, n = ab.length, buf = new ArrayBuffer(44 + n * ch * 2), v = new DataView(buf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => ab.getChannelData(c)); let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2; }
  const bytes = new Uint8Array(buf); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function buildAll() { buildSky(); buildParty(); buildMeadow(); buildForest(); buildMountain(); buildBridge(); buildCamp(); buildCastle(); }
