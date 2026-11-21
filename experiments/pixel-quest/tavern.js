// =====================================================================
// Tavern & Pixel Lyrics — 35 s. The mage (blue robe, stars) and the knight (visor up) in a tavern;
// lyric words pop in pixel type; the knight walks to the stage. Ambience + SFX only (no music).
// Reuses journey.js.
// =====================================================================
const TV_BPM = 74, BEATS = 60 / TV_BPM, bt = b => b * BEATS, TV_DUR = 40 * BEATS, FLOOR = GROUND, STG = { x0: 116, x1: 204, h: 10 };
// ---------------------------------------------------------------- PLAN AS DATA
const TVP = {
  bpm: TV_BPM,                                                       // every time below is in beats of the song
  intro: { s: 'Spanish is easy, right?', from: 0, to: 4 },          // mage
  // mage asks, knight answers: [question, answer, mini-animation, start beat, beats before the answer]
  pairs: [
    ['How do you say tomorrow in Spanish?', 'Mañana.', 'spark', 4, 3],
    ['Morning?', 'Mañana.', 'sun', 8, 1], ['Spider?', 'Araña.', 'spider', 10, 1], ['Scratches?', 'Araña.', 'scratch', 12, 1], ['Skill?', 'Maña.', 'star', 14, 1],
    ['Spiderweb?', 'Telaraña.', 'web', 16, 1], ['Strange?', 'Extraña.', 'odd', 18, 1], ['Spain?', 'España.', 'flag', 20, 1], ['Mountain?', 'Montaña.', 'peak', 22, 1],
  ],
  pairEnd: [8, 10, 12, 14, 16, 18, 20, 22, 24],
  tryThis: { s: 'Try this:', from: 24, to: 26 },                    // mage
  sentence: { lines: ['Tomorrow morning,', 'the strange spider', 'from Spain skillfully', 'scratches the', 'spiderweb on', 'the mountain.'], from: 26, to: 32 },
  verse: [                                                           // knight, on the stage: 2 beats a line
    { rows: ['Mañana por la mañana,'], from: 32 }, { rows: ['la extraña araña', 'de España'], from: 34 },
    { rows: ['araña con maña'], from: 36 }, { rows: ['la telaraña', 'de la montaña.'], from: 38 },
  ],
  sips: { mage: [], knight: [] }, sipLen: 1.9,
  lean: bt(4), stand: bt(26), push: bt(26.6), walk: bt(27.4), arrive: bt(31), turn: bt(31.3), ready: bt(31.6), notes: bt(31),
  mage: { x: 30 }, knight: { x: 96, stage: 160 }, table: { x0: 44, x1: 80 },
  views: [
    { from: 0, size: 'wide' }, { from: bt(2), size: 'close', x: 2, y: 236, pan: 2 }, { from: bt(12), size: 'wide' }, { from: bt(16), size: 'close', x: 2, y: 236, pan: 2 },
    { from: bt(20), size: 'wide' }, { from: bt(34), size: 'close', x: 92, y: 226, pan: 2 }, { from: bt(36), size: 'wide' },
  ],
};
const CUES = TVP.pairs.map(([q, a, fx, qb, gap], i) => ({ q, a, fx, qb, ab: qb + gap, eb: TVP.pairEnd[i] }));
const tvView = t => TVP.views[TVP.views.findLastIndex(v => t >= v.from)];

// ---------------------------------------------------------------- a 5x7 pixel font with lower case, ñ and ¡ (9 rows: 2 for descenders)
const PF = {
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'], M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  a: ['', '', '.###.', '....#', '.####', '#...#', '.####'], e: ['', '', '.###.', '#...#', '#####', '#....', '.###.'],
  g: ['', '', '.####', '#...#', '#...#', '#...#', '.####', '....#', '.###.'], h: ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '#...#'],
  i: ['..#..', '', '.##..', '..#..', '..#..', '..#..', '.###.'], m: ['', '', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  n: ['', '', '#.##.', '##..#', '#...#', '#...#', '#...#'], 'ñ': ['.##.#', '#.##.', '', '#.##.', '##..#', '#...#', '#...#', '#...#'],
  o: ['', '', '.###.', '#...#', '#...#', '#...#', '.###.'], p: ['', '', '####.', '#...#', '#...#', '#...#', '####.', '#....', '#....'],
  r: ['', '', '#.##.', '##..#', '#....', '#....', '#....'], s: ['', '', '.####', '#....', '.###.', '....#', '####.'],
  t: ['.#...', '.#...', '####.', '.#...', '.#...', '.#..#', '..##.'], y: ['', '', '#...#', '#...#', '#...#', '#...#', '.####', '....#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], b: ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '####.'],
  c: ['', '', '.###.', '#...#', '#....', '#...#', '.###.'], d: ['....#', '....#', '.##.#', '#..##', '#...#', '#...#', '.####'],
  f: ['..##.', '.#..#', '.#...', '###..', '.#...', '.#...', '.#...'], k: ['#....', '#....', '#..#.', '#.#..', '##...', '#.#..', '#..#.'],
  l: ['.##..', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], u: ['', '', '#...#', '#...#', '#...#', '#..##', '.##.#'],
  w: ['', '', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'], x: ['', '', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '.': ['', '', '', '', '', '.##..', '.##..'], ':': ['', '', '.##..', '.##..', '', '.##..', '.##..'],
  ',': ['', '', '', '', '', '..#..', '..#..', '.#...'], '?': ['.###.', '#...#', '....#', '...#.', '..#..', '', '..#..'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '', '..#..'], '¡': ['', '', '..#..', '', '..#..', '..#..', '..#..', '..#..', '..#..'], ' ': [],
};
const PFOFF = { 'ñ': -1 };                                         // the tilde sits one row above the x-height, with a gap
const ptextW = (str, sc) => [...str].length * 6 * sc - sc;
// two-tone solid letters, thick black border, solid drop shadow. o: scale, n (typed chars), align, top/bottom colours
function ptext(x, y, str, o = {}) {
  const sc = o.scale || 1, chars = [...str], n = o.n ?? chars.length, top = o.top ?? 40, bot = o.bot ?? 35, oc = 30, th = Math.max(1, Math.round(sc * .75));
  const x0 = Math.round(o.align === 'center' ? x - ptextW(str, sc) / 2 : x);
  const pass = (dx, dy, col) => { for (let i = 0; i < n; i++) { const g = PF[chars[i]]; if (!g) continue; for (let r = 0; r < g.length; r++) { const row = g[r]; for (let b = 0; b < row.length; b++) if (row[b] === '#') scr.rect(x0 + i * 6 * sc + b * sc + dx, y + (r + (PFOFF[chars[i]] || 0)) * sc + dy, sc, sc, col ?? (r + (PFOFF[chars[i]] || 0) < 4 ? top : bot)); } } };
  for (let dy = -th; dy <= th + sc; dy++) for (let dx = -th; dx <= th; dx++) if (dx || dy) pass(dx, dy, oc);
  pass(0, 0);
  return { x0, w: ptextW(str, sc) };
}

// ---------------------------------------------------------------- the cast: blue mage with stars, knight with the visor up
const TV = {};
KINDS.knightUp = Object.assign({}, KINDS.knight, {
  hair(g) {
    const { P, R, X, hy, frame } = g;
    R(X - 5, hy + 1, 11, 9, 12); R(X - 4, hy, 9, 11, 12); R(X - 4, hy + 1, 3, 8, 13); R(X - 4, hy - 1, 9, 1, 13); R(X - 4, hy + 10, 9, 1, 10);
    R(X - 1, hy + 3, 6, 6, 28); R(X - 1, hy + 8, 5, 1, 29);                                                    // the face
    P(X + 2, hy + 4, 30); P(X + 3, hy + 4, 30); P(X + 2, hy + 5, 21); P(X + 3, hy + 5, 6); P(X + 2, hy + 6, 21); P(X + 3, hy + 6, 21); P(X, hy + 7, 36); P(X + 4, hy + 8, 29);
    R(X - 2, hy + 1, 9, 2, 13); R(X + 5, hy, 3, 2, 12); P(X + 7, hy + 2, 10); R(X - 2, hy + 3, 1, 6, 10);     // the raised visor
    for (let i = 0; i < 10; i++) { const y = hy - 2 - Math.min(i, 3) + Math.max(0, i - 5) + wave(i, frame, .7); P(X + 1 - i, y, 31); P(X + 1 - i, y + 1, i > 6 ? 32 : 31); if (i > 1 && i < 8) P(X + 1 - i, y - 1, 31); }
  },
  front(g) { KINDS.knight.front(g); const { R, X, torY, pose } = g; if (pose === 'ready') { R(X + 2, torY - 7, 3, 9, 13); R(X + 2, torY - 7, 1, 9, 12); R(X + 1, torY - 11, 5, 4, 12); R(X + 2, torY - 10, 3, 2, 13); } },
});
function starMage(L) {
  const o = { w: L.w, h: L.h, d: L.d.map(v => v === 33 ? 2 : v === 34 ? 1 : v) };
  for (const [x, y, big] of [[19, 38], [24, 41, 1], [20, 46], [25, 49], [22, 51], [21, 19], [17, 44]]) { if (o.d[y * o.w + x] !== 2 && o.d[y * o.w + x] !== 1) continue; o.d[y * o.w + x] = 40; if (big) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (y + dy) * o.w + x + dx; if (o.d[k] === 2 || o.d[k] === 1) o.d[k] = 35; } }
  return o;
}
function tflame(cx, by, hw, hh, t, seed) {
  for (let x = -hw; x <= hw; x++) { const h = (1 - Math.abs(x) / (hw + 1)) * hh * (.6 + .7 * vnoise(x * .3 + seed * 7, t * 7, seed)) + 2; for (let y = 0; y < h; y++) { const p = y / h, c = p < .25 ? 42 : p < .5 ? 40 : p < .78 ? 39 : 31; if (p > .7 && bay(x + seed * 3, y + Math.floor(t * 20)) > .6) continue; scr.pset(cx + x + Math.round(Math.sin(y * .3 + t * 9 + seed) * (p * 2)), by - y, c); } }
}
function buildTavern() {
  TV.mage = starMage(SPR.mage.stand);
  TV.knight = { stand: mkTraveler('knightUp', 0, 'stand'), walk: [0, 1, 2, 3].map(f => mkTraveler('knightUp', f, 'walk')), ready: mkTraveler('knightUp', 0, 'ready') };
  const L = layer(PW, PH), P = (x, y, c) => lp(L, x, y, c), R = (x, y, w, h, c) => lr(L, x, y, w, h, c);
  const warm = (x, y) => Math.max(0, 1 - Math.hypot(x - 240, y - 380) / 170) * .35 + Math.max(0, 1 - Math.hypot(x - 160, y - 210) / 120) * .28 + Math.max(0, 1 - Math.hypot(x - 62, y - 380) / 80) * .2;
  // wall: vertical planks, darker towards the rafters
  for (let y = 0; y < FLOOR; y++) for (let x = 0; x < PW; x++) L.d[y * PW + x] = x % 14 === 0 ? 20 : ramp([20, 21, 22, 23, 24], .12 + (y / FLOOR) * .3 + warm(x, y) + (hash(x >> 1, y >> 3, 3) - .5) * .16, x, y);
  for (let y = 0; y < 58; y++) for (let x = 0; x < PW; x++) L.d[y * PW + x] = ((x + y * 2) % 46 < 5 || (x - y * 2 + 400) % 46 < 5) ? 21 : 20;         // rafters
  for (const by of [58, 176]) { R(0, by, PW, 9, 21); R(0, by, PW, 1, 22); R(0, by + 8, PW, 1, 20); for (let x = 20; x < PW; x += 50) { P(x, by + 4, 20); P(x + 1, by + 4, 20); } }
  for (const [wx, wy] of [[26, 92], [196, 92]]) { R(wx - 3, wy - 3, 40, 50, 21); for (let y = 0; y < 44; y++) for (let x = 0; x < 34; x++) P(wx + x, wy + y, ramp([0, 1, 2], y / 60, x, y)); R(wx + 16, wy, 2, 44, 21); R(wx, wy + 21, 34, 2, 21); if (wx > 100) { for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 26) P(wx + 25 + x, wy + 11 + y, 7); } P(wx + 6, wy + 8, 42); P(wx + 11, wy + 30, 42); }
  R(0, 150, PW, 4, 22); R(0, 150, PW, 1, 23); for (let x = 6; x < PW; x += 10) { R(x, 154, 3, 22, 22); R(x, 154, 1, 22, 23); P(x + 1, 164, 21); }                 // balcony rail
  for (const px of [0, 104, 206, 264]) { R(px, 66, 6, FLOOR - 66, 21); R(px, 66, 1, FLOOR - 66, 22); R(px + 5, 66, 1, FLOOR - 66, 20); }
  // shelves, bottles and kegs on the left wall
  for (const [sy, items] of [[250, [[16, 10], [31, 12], [2, 9], [35, 11], [16, 12], [33, 10]]], [296, [[23, 14], [31, 9], [16, 11], [23, 14], [2, 10]]]]) {
    R(12, sy, 86, 3, 22); R(12, sy, 86, 1, 24); R(12, sy + 3, 86, 1, 20);
    items.forEach(([c, h], i) => { const x = 18 + i * 14; if (c === 23) { R(x - 2, sy - 12, 11, 12, 22); R(x - 2, sy - 9, 11, 1, 20); R(x - 2, sy - 4, 11, 1, 20); R(x - 1, sy - 12, 9, 1, 24); } else { R(x, sy - h, 5, h, c); R(x + 1, sy - h - 3, 3, 3, c); P(x + 1, sy - h + 2, 6); R(x + 1, sy - h - 4, 3, 1, 24); } });
  }
  // curtain and crest behind the stage
  for (let y = 194; y < 340; y++) for (let x = 118; x < 202; x++) { const fold = Math.sin((x - 118) * .42) * .5 + .5; P(x, y, y > 332 ? 35 : (fold > .72 ? 31 : fold < .2 ? 20 : 32)); }
  R(114, 190, 92, 5, 22); R(114, 190, 92, 1, 24); for (let x = 118; x < 202; x += 6) P(x + 2, 340, 35);
  for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) if (x * x + y * y <= 122) P(160 + x, 250 + y, x * x + y * y > 86 ? 35 : 21);
  for (let k = -6; k <= 6; k++) { P(160 + k, 250, 40); P(160, 250 + k, 40); if (Math.abs(k) < 4) { P(160 + k, 250 + k, 35); P(160 + k, 250 - k, 35); } }
  // fireplace on the right
  for (let y = FLOOR - 78; y < FLOOR + 3; y++) for (let x = 214; x < 266; x++) P(x, y, ramp(RAMP.stone, .5 + (hash((x + (((y >> 3) & 1) * 5)) / 10 | 0, y >> 3, 9) - .5) * .5 - ((y % 8 === 0 || (x + (((y >> 3) & 1) * 5)) % 10 === 0) ? .3 : 0), x, y));
  for (let y = 184; y < FLOOR - 78; y++) for (let x = 222; x < 258; x++) P(x, y, ramp(RAMP.stone, .38 + (hash((x + (((y >> 3) & 1) * 5)) / 10 | 0, y >> 3, 9) - .5) * .4 - ((y % 8 === 0) ? .25 : 0), x, y));
  for (let y = FLOOR - 36; y < FLOOR + 3; y++) for (let x = 226; x < 254; x++) if (y > FLOOR - 28 || (x - 240) ** 2 + (y - (FLOOR - 28)) ** 2 < 196) P(x, y, 30);
  R(209, FLOOR - 44, 60, 5, 23); R(209, FLOOR - 44, 60, 1, 24); R(209, FLOOR - 39, 60, 1, 20);
  R(218, FLOOR - 52, 3, 8, 6); R(258, FLOOR - 50, 3, 6, 6); R(236, FLOOR - 53, 6, 9, 16); R(237, FLOOR - 56, 4, 3, 16); P(238, FLOOR - 50, 6);
  R(230, FLOOR - 4, 20, 4, 21); R(233, FLOOR - 6, 14, 3, 22);
  // chandelier
  for (const cx of [146, 174]) R(cx, 185, 1, 16, 20); for (let x = -18; x <= 18; x++) { const y = Math.round(Math.sqrt(Math.max(0, 1 - (x / 18) ** 2)) * 5); P(160 + x, 204 + y, 20); P(160 + x, 205 + y, 21); }
  for (const cx of [144, 154, 166, 176]) R(cx, 199 + (cx === 154 || cx === 166 ? 4 : 0), 2, 5, 6);
  // floor, rug, stage
  for (let y = FLOOR; y < PH; y++) for (let x = 0; x < PW; x++) { const row = (y - FLOOR) >> 3; L.d[y * PW + x] = ((y - FLOOR) % 8 === 0 || (x + row * 23) % 46 === 0) ? 20 : ramp([20, 21, 22, 23], .3 + warm(x, y - 30) * 1.1 - (y - FLOOR) / 300 + (hash(x >> 2, row, 5) - .5) * .25, x, y); }
  for (let y = 0; y < 13; y++) for (let x = 0; x < 100; x++) { const e = Math.min(x, 99 - x, y, 12 - y); if (e < 1 && (x + y) % 2) continue; P(14 + x, FEET - 3 + y, e < 2 ? 35 : ((x >> 2) + (y >> 2)) % 2 ? 32 : 31); }
  R(STG.x0 - 8, FEET - 5, 8, 9, 22); R(STG.x0 - 8, FEET - 6, 8, 2, 24); R(STG.x0, FEET - STG.h, STG.x1 - STG.x0, STG.h + 4, 22);
  R(STG.x0 - 1, FEET - STG.h - 2, STG.x1 - STG.x0 + 2, 3, 24); R(STG.x0 - 1, FEET - STG.h + 1, STG.x1 - STG.x0 + 2, 1, 23); R(STG.x0, FEET + 3, STG.x1 - STG.x0, 1, 20);
  for (let x = STG.x0 + 12; x < STG.x1; x += 16) { R(x, FEET - STG.h + 2, 1, STG.h + 1, 21); P(x + 3, FEET - 5, 20); }
  TV.bg = L;
}

// ---------------------------------------------------------------- props
function mug(x, y) { scr.rect(x, y, 6, 7, 23).rect(x, y + 2, 6, 1, 21).rect(x, y + 5, 6, 1, 21).rect(x, y - 1, 6, 2, 6).pset(x + 6, y + 2, 22).pset(x + 7, y + 3, 22).pset(x + 6, y + 4, 22).rect(x - 1, y, 1, 7, 30).rect(x + 6, y, 1, 2, 30).rect(x, y + 7, 6, 1, 30); }
function note(x, y, c) { x = Math.round(x); y = Math.round(y); scr.rect(x - 1, y - 9, 5, 12, 30); scr.rect(x - 3, y - 1, 5, 5, 30); scr.rect(x + 2, y - 8, 1, 9, c).rect(x - 2, y, 4, 3, c).rect(x - 1, y - 1, 3, 1, c).rect(x + 3, y - 8, 1, 2, c).rect(x + 4, y - 7, 1, 2, c); }
function bubble(x, y, w, h, tx) { scr.rect(x + 1, y - 1, w - 2, h + 2, 30).rect(x - 1, y + 1, w + 2, h - 2, 30).rect(x, y, w, h, 6).rect(x + 1, y + h - 2, w - 2, 1, 7); for (let k = 0; k < 6; k++) { scr.rect(tx - 1 + k, y + h + k, 8 - k * 2 > 0 ? 8 - k * 2 + 2 : 0, 1, 30); if (6 - k * 2 > 0) scr.rect(tx + k, y + h + k - 1, 6 - k * 2 + 1, 1, 6); } }
function sipPhase(t, list) { for (const s of list) { const p = (t - s) / TVP.sipLen; if (p >= 0 && p < 1) return p < .22 ? p / .22 : p < .72 ? 1 : 1 - (p - .72) / .28; } return 0; }

// ---------------------------------------------------------------- lyric helpers
function wrapTxt(s, max) { const rows = []; let cur = ''; for (const w of s.split(' ')) { if (cur && [...(cur + ' ' + w)].length > max) { rows.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) rows.push(cur); return rows; }
function revealRows(rows, nw) { let left = nw; return rows.map(r => { const ws = r.split(' '), take = clamp(left, 0, ws.length); left -= ws.length; return ws.slice(0, take).join(' '); }); }
const popIn = (lt, amp) => Math.round(Math.max(0, Math.abs(Math.cos(lt * 9)) * (1 - lt * 2.6)) * amp);
function wordFx(fx, m, y, u, lt) {                                    // a little animation that goes with each answer
  const R_ = m.x0 + m.w + 3 * u, L_ = m.x0 - 3 * u;
  if (fx === 'spark') for (let k = 0; k < 4; k++) { const q = ((lt * 1.6 + k / 4) % 1), sx = m.x0 + (k * 37 % m.w), sy = y - 6 * u + (k % 2) * 16 * u, rr = Math.round((1 - Math.abs(q * 2 - 1)) * 4 * u); scr.rect(sx - rr, sy, rr * 2 + 1, u, 42).rect(sx, sy - rr, u, rr * 2 + 1, 42); }
  if (fx === 'sun') { const cx = L_ - 5 * u, cy = y + 4 * u; scr.circ(cx, cy, 4 * u + 1, 30).circ(cx, cy, 4 * u, 40).circ(cx, cy, 2 * u, 42); for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + lt * 1.5; scr.rect(cx + Math.cos(a) * 7 * u, cy + Math.sin(a) * 7 * u, u, u, 40); } }
  if (fx === 'spider') { const drop = Math.round(Math.min(1, lt * 1.6) * 14 * u + Math.sin(lt * 4) * 2 * u), sy = y - 8 * u + drop, lg = cyc(lt * 8, 2), dx = R_ + 2 * u; scr.rect(dx + u, y - 8 * u, 1, drop, 7); scr.rect(dx - u, sy, 3 * u, 2 * u, 30).rect(dx, sy + 2 * u, u, u, 30).rect(dx - u, sy, u, u, 31).rect(dx + u, sy, u, u, 31); for (const s of [-1, 1]) scr.rect(dx + s * 2 * u, sy + (lg ? 0 : u), u, u, 30).rect(dx + s * 3 * u, sy + (lg ? u : 0) - u, u, u, 30).rect(dx + s * 2 * u, sy + 2 * u - (lg ? u : 0), u, u, 30); }
  if (fx === 'scratch') for (let k = 0; k < 3; k++) for (let st = 0; st < Math.min(9, lt * 40 - k * 2); st++) { scr.rect(R_ + k * 3 * u + 4 * u - st * u * .5 - 1, y - 2 * u + st * u * 1.2 - 1, u + 2, u + 2, 30); scr.rect(R_ + k * 3 * u + 4 * u - st * u * .5, y - 2 * u + st * u * 1.2, u, u, k === 1 ? 31 : 6); }
  if (fx === 'star') { const cx = R_ + 5 * u, cy = y + 3 * u, g = 3 + cyc(lt * 6, 2); scr.rect(cx - g * u - 1, cy - 1, (g * 2 + 1) * u + 2, u + 2, 30).rect(cx - 1, cy - g * u - 1, u + 2, (g * 2 + 1) * u + 2, 30); scr.rect(cx - g * u, cy, (g * 2 + 1) * u, u, 40).rect(cx, cy - g * u, u, (g * 2 + 1) * u, 40).rect(cx - u, cy - u, 3 * u, 3 * u, 40).rect(cx, cy, u, u, 42); }
  if (fx === 'web') { const cx = R_ + 6 * u, cy = y + 3 * u, g = Math.min(1, lt * 3); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; scr.line(cx, cy, cx + Math.cos(a) * 7 * u * g, cy + Math.sin(a) * 7 * u * g, 7); } scr.circb(cx, cy, Math.round(3 * u * g), 7).circb(cx, cy, Math.round(6 * u * g), 7); }
  if (fx === 'odd') ptext(R_ + Math.round(Math.sin(lt * 9) * u), y - 2 * u, '?', { scale: Math.max(1, u), top: 36, bot: 37 });
  if (fx === 'flag') { const px0 = R_ + 2 * u; scr.rect(px0 - 1, y - 2 * u - 1, u + 2, 12 * u + 2, 30).rect(px0, y - 2 * u, u, 12 * u, 24); for (let i = 0; i < 8; i++) { const wy = Math.round(Math.sin(i * .9 - lt * 7) * u * .6); scr.rect(px0 + u + i * u, y - 2 * u + wy - 1, u, 6 * u + 2, 30); scr.rect(px0 + u + i * u, y - 2 * u + wy, u, Math.round(1.5 * u), 31).rect(px0 + u + i * u, y - 2 * u + wy + Math.round(1.5 * u), u, 3 * u, 40).rect(px0 + u + i * u, y - 2 * u + wy + Math.round(4.5 * u), u, Math.round(1.5 * u), 31); } }
  if (fx === 'peak') { const px0 = L_ - 12 * u, py = y + 7 * u; for (let j = 0; j < 9; j++) scr.rect(px0 + (8 - j) * u - u, py - (8 - j) * u, (j * 2 + 1) * u + 2 * u, u, 30); for (let j = 0; j < 8; j++) scr.rect(px0 + (8 - j) * u, py - (7 - j) * u, (j * 2 + 1) * u, u, j < 3 ? 6 : j % 2 ? 12 : 10); }
}

// ---------------------------------------------------------------- scene
function sceneTavern(t) {
  blit(TV.bg, 0, 0);
  const view = tvView(t), close = view.size === 'close', fl = .5 + .5 * Math.sin(t * 11) * Math.sin(t * 7.3), beat = (t % BEATS) / BEATS;
  // light: fire, chandelier, spotlight
  tflame(240, FLOOR - 4, 9, 26, t, 3);
  scr.dither(.2 + fl * .08).elli(168, FLOOR - 4, 110, 44, 39).dither(); scr.dither(.14 + fl * .05).elli(204, FLOOR - 40, 70, 60, 40).dither();
  for (const [cx, cy] of [[145, 198], [155, 202], [167, 202], [177, 198]]) { const f = cyc(t * 9 + cx, 3); scr.rect(cx, cy - 3 - (f === 0 ? 1 : 0), 1, 3, 40).pset(cx, cy - 1, 42).pset(cx, cy - 5 + (f ? 1 : 0), 39); }
  scr.dither(.12 + fl * .04).circ(160, 204, 40, 40).dither();
  const r = Pixel.mulberry32(61); for (let i = 0; i < 9; i++) { const per = 1.2 + r() * 1.4, p = ((t + r() * per) % per) / per; if (p < .85) scr.pset(240 + (r() - .5) * 14 + Math.sin(p * 7 + i) * 4, FLOOR - 30 - p * 40, p < .5 ? 40 : 39); }
  const spot = seg(t, TVP.arrive - .3, TVP.arrive + .5);
  if (spot > 0) { scr.dither(.16 * spot); scr.tri(160, 190, STG.x0 + 6, FEET - STG.h, STG.x1 - 6, FEET - STG.h, 40); scr.dither(.3 * spot).elli(STG.x0 + 8, FEET - STG.h - 4, STG.x1 - STG.x0 - 16, 8, 40).dither(); }
  // the mage, seated, with his mug
  const mx = TVP.mage.x, sipM = sipPhase(t, TVP.sips.mage), nodding = t >= TVP.lean, nod = nodding && beat < .22 ? 1 : 0, cheers = t >= TVP.ready + .3 ? 1 : 0;
  shadow(mx, FEET, 9); blit(TV.mage, mx - SX - (sipM > .5 ? 1 : 0), FEET - SFY - 5 + nod);
  scr.rect(mx - 8, FEET - 9, 18, 3, 23).rect(mx - 8, FEET - 9, 18, 1, 24).rect(mx - 6, FEET - 6, 2, 8, 22).rect(mx + 6, FEET - 6, 2, 8, 22);                 // his stool
  // the table (it slides when the knight shoves it)
  const push = seg(t, TVP.push, TVP.push + .25), tdx = -Math.round(9 * (1 - (1 - push) ** 2)), T0 = TVP.table.x0 + tdx, T1 = TVP.table.x1 + tdx, ty = FEET - 21;
  // the knight
  const K = TVP.knight; let kx = K.x, ky = FEET, ks = TV.knight.stand, kflip = true, sitting = true;
  const sipK = sipPhase(t, TVP.sips.knight), lean = seg(t, TVP.lean, TVP.lean + .5);
  if (t < TVP.stand) { kx = K.x - Math.round(lean * 4); ky = FEET + 5 + Math.round(lean) - (CUES.some(c => t / BEATS >= c.ab && t / BEATS < c.ab + .3) ? 2 : 0); }
  else if (t < TVP.walk) { sitting = false; const p = seg(t, TVP.stand, TVP.stand + .4); ky = FEET + 5 - Math.round(p * 5) - Math.round(Math.sin(p * Math.PI) * 6); kx = K.x - 4 + Math.round(p * 4) - Math.round(Math.sin(seg(t, TVP.push, TVP.push + .45) * Math.PI) * 6); }
  else if (t < TVP.arrive) { sitting = false; kflip = false; const p = (t - TVP.walk) / (TVP.arrive - TVP.walk); kx = Math.round(lerp(K.x, K.stage, p)); ky = kx < STG.x0 - 8 ? FEET : kx < STG.x0 ? FEET - 5 : FEET - STG.h; ks = TV.knight.walk[cyc(t * 9, 4)]; }
  else { sitting = false; kx = K.stage; kflip = t >= TVP.turn; const rd = t >= TVP.ready; ks = rd ? TV.knight.ready : TV.knight.stand; ky = FEET - STG.h - (rd && t < TVP.ready + .35 ? Math.round(Math.sin((t - TVP.ready) / .35 * Math.PI) * 7) : rd && beat < .2 ? 1 : 0); }
  if (sitting) scr.rect(K.x - 9, FEET - 9, 18, 3, 23).rect(K.x - 9, FEET - 9, 18, 1, 24).rect(K.x - 7, FEET - 6, 2, 8, 22).rect(K.x + 5, FEET - 6, 2, 8, 22);
  else scr.rect(K.x + 4, FEET - 9, 18, 3, 23).rect(K.x + 4, FEET - 9, 18, 1, 24).rect(K.x + 6, FEET - 6, 2, 8, 22).rect(K.x + 18, FEET - 6, 2, 8, 22);   // stool, kicked back
  shadow(kx, sitting ? FEET : ky, 9);
  blit(ks, kx - (kflip ? SW - 1 - SX : SX), ky - SFY, kflip);
  // table on top of their knees, then what sits on it
  scr.rect(T0 + 15, ty + 4, 6, 17, 22).rect(T0 + 15, ty + 4, 1, 17, 21).rect(T0 + 9, FEET - 1, 18, 3, 21).rect(T0 - 1, ty - 1, T1 - T0 + 2, 6, 30).rect(T0, ty, T1 - T0, 4, 23).rect(T0, ty, T1 - T0, 1, 24).rect(T0, ty + 3, T1 - T0, 1, 22);
  const cf = cyc(t * 8, 3); scr.rect(T0 + 17, ty - 7, 2, 7, 6).rect(T0 + 17, ty - 10 - (cf === 0 ? 1 : 0), 2, 3, 40).pset(T0 + 17, ty - 8, 42).pset(T0 + 18, ty - 12 + (cf ? 1 : 0), 39);
  scr.dither(.2 + fl * .06).circ(T0 + 18, ty - 8, 13, 40).dither();
  if (lean > 0 && t < TVP.stand) scr.rect(T1 - 4 - Math.round(lean * 10), ty - 3, Math.round(lean * 12) + 2, 3, 13).rect(T1 - 4 - Math.round(lean * 10), ty - 1, Math.round(lean * 12) + 2, 1, 10).rect(T1 - 6 - Math.round(lean * 10), ty - 3, 3, 3, 12);   // forearms on the table
  const mmx = lerp(T0 + 4, mx + 10, sipM), mmy = lerp(ty - 7, FEET - 36, sipM) - (cheers ? 16 + (beat < .2 ? 2 : 0) : 0);
  mug(Math.round(cheers ? mx + 12 : mmx), Math.round(cheers ? FEET - 30 - 16 - (beat < .2 ? 2 : 0) : mmy));
  if (!(lean > 0 && t < TVP.stand) || true) { const kmx = lerp(T1 - 12, K.x - 16, sipK), kmy = lerp(ty - 7, FEET - 34, sipK); mug(Math.round(kmx), Math.round(kmy)); }
  if (t >= TVP.push + .1 && t < TVP.push + 1.3) ptext(mx + 4, FEET - 76, '?', { scale: 2, align: 'center', top: 6, bot: 7 });
  // ---- pixel lyrics: the mage asks in white, the knight answers in gold ----
  const b = t / BEATS;
  const mageSay = (s, typed = 1) => {
    const n = Math.ceil([...s].length * typed);
    if (close) { const rows = wrapTxt(s, 17), w = Math.max(...rows.map(rw => ptextW(rw, 1))) + 14, h = rows.length * 12 + 6, bx = 6, by = FEET - 58 - h; bubble(bx, by, w, h, mx + 2); let left = n; rows.forEach((rw, i) => { ptext(bx + w / 2, by + 4 + i * 12, rw, { scale: 1, align: 'center', top: 2, bot: 1, n: clamp(left, 0, [...rw].length) }); left -= [...rw].length + 1; }); }
    else { const rows = wrapTxt(s, 21); let left = n; rows.forEach((rw, i) => { ptext(135, 66 + i * 24, rw, { scale: 2, align: 'center', top: 6, bot: 7, n: clamp(left, 0, [...rw].length) }); left -= [...rw].length + 1; }); }
  };
  const knightSay = (s, fx, lt) => { const sc = close ? 2 : 4, u = sc / 2, y = (close ? 262 : 128) - popIn(lt, 12 * u), m = ptext(close ? 66 : 128, y, s, { scale: sc, align: 'center' }); wordFx(fx, m, y, u, lt); };
  const I = TVP.intro; if (b >= I.from && b < I.to) mageSay(I.s, seg(b, I.from, I.from + 1.2));
  for (const c of CUES) { if (b < c.qb || b >= c.eb) continue; mageSay(c.q, seg(b, c.qb, c.qb + Math.min(.6, (c.ab - c.qb) * .6))); if (b >= c.ab) knightSay(c.a, c.fx, t - bt(c.ab)); }
  const T = TVP.tryThis; if (b >= T.from && b < T.to) { if (close) mageSay(T.s); else ptext(135, 96 - popIn(t - bt(T.from), 16), T.s, { scale: 3, align: 'center', top: 6, bot: 7 }); }
  const S = TVP.sentence; if (b >= S.from && b < S.to) { const words = S.lines.join(' ').split(' ').length, nw = Math.min(words, 1 + Math.floor(seg(b, S.from, S.to - .7) * words)); revealRows(S.lines, nw).forEach((rw, i) => { if (rw) ptext(Math.round(135 - ptextW(S.lines[i], 2) / 2), 62 + i * 24, rw, { scale: 2, top: 6, bot: 7 }); }); }
  if (t >= TVP.notes) for (let k = 0; k < 5; k++) { const per = 2.4, q = (((t - TVP.notes) / per + k / 5) % 1), nx = K.stage - 44 + k * 22 + Math.sin(q * 6 + k) * 6, ny = FEET - 60 - q * 110; scr.dither(q > .7 ? 1 - (q - .7) / .3 : 1); note(nx, ny, [40, 38, 36, 6, 40][k]); scr.dither(); }
  for (const v of TVP.verse) {
    if (b < v.from || b >= v.from + 2) continue;
    const words = v.rows.join(' ').split(' ').length, nw = Math.min(words, 1 + Math.floor(seg(b, v.from, v.from + 1.5) * words)), big = Math.max(...v.rows.map(rw => [...rw].length)) <= 14;
    const sc = close ? 1 : big ? 3 : 2, cx = close ? 160 : 135, y0 = close ? 248 : 84, pulse = (b % 1) < .2 ? sc : 0;
    revealRows(v.rows, nw).forEach((rw, i) => { if (rw) ptext(Math.round(cx - ptextW(v.rows[i], sc) / 2), y0 + i * 12 * sc - pulse, rw, { scale: sc }); });
  }
  for (let y = 0; y < 46; y++) { const a = (1 - y / 46) * .6; for (let x = 0; x < PW; x++) if (bay(x, y) < a) scr.px[y * PW + x] = 30; }                               // dark up in the rafters
}

// ---------------------------------------------------------------- frame
function tvDraw(t, ctx) {
  scr.reset(); sceneTavern(t);
  const c = scr.render({ palette: PALETTE }), i = TVP.views.findLastIndex(v => t >= v.from), v = TVP.views[i];
  const sh = t >= TVP.push + .2 && t < TVP.push + .5 ? 1 - (t - TVP.push - .2) / .3 : 0, dx = Math.round(Math.sin(t * 95) * 3 * sh) * 4;
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#1a1228'; ctx.fillRect(0, 0, W, H);
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, dx, 0, W, H);
  else { const end = TVP.views[i + 1] ? TVP.views[i + 1].from : TV_DUR, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, dx, 0, W, H); }
}

// ---------------------------------------------------------------- ambience and sound effects (no music)
function tvAudio(ac, out, t0 = 0) {                                   // room and foley only: nothing on the words, they belong to the song
  const at = x => t0 + x, r = Pixel.mulberry32(29);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.03, dur * .3))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'square') => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .01)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain(); s.buffer = nb; s.loop = true; f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = .03; l.frequency.value = .7; lg.gain.value = .012; l.connect(lg).connect(g.gain); s.connect(f).connect(g).connect(out); s.start(at(0)); l.start(at(0)); s.stop(at(TV_DUR)); l.stop(at(TV_DUR)); }
  for (let t = .1; t < TV_DUR - .1; t += .06 + r() * .28) noise(t, .04, 1500 + r() * 3000, 900, .03 + r() * .05, 'bandpass', 3);
  const sip = t => { tone(t + .45, .09, 240, 160, .07, 'sine'); tone(t + .75, .09, 220, 150, .07, 'sine'); tone(t + 1.05, .09, 230, 150, .06, 'sine'); noise(t + TVP.sipLen - .05, .06, 500, 250, .12, 'lowpass'); };
  [...TVP.sips.mage, ...TVP.sips.knight].forEach(sip);
  noise(TVP.lean, .25, 900, 400, .06); noise(TVP.lean + .35, .07, 500, 260, .12, 'lowpass');
  noise(TVP.stand, .35, 700, 300, .14); Chip.sfx.jump(ac, at(TVP.stand + .05), out, { gain: .16, pitch: .8 });
  noise(TVP.push, .3, 500, 200, .2, 'lowpass'); Chip.sfx.hit(ac, at(TVP.push + .22), out, { gain: .3, pitch: .6 });
  for (let k = 0, t = TVP.walk + .1; t < TVP.arrive; t += .235, k++) { noise(t, .05, 2600, 1400, .09, 'bandpass', 4); tone(t, .05, k % 2 ? 150 : 180, 90, .08, 'triangle'); }
  Chip.sfx.land(ac, at(TVP.walk + (TVP.arrive - TVP.walk) * .34), out, { gain: .16 });
  Chip.sfx.jump(ac, at(TVP.ready), out, { gain: .2 }); Chip.sfx.land(ac, at(TVP.ready + .35), out, { gain: .2 });
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * TV_DUR), sr);
  tvAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
