// =====================================================================
// El colgante — 28 s, 9:16. The rōnin, at night under a cherry tree, closes his eyes and remembers: a boy in a Kyoto
// courtyard full of cherry blossoms, his mother in a beautiful kimono singing to him, the blue rhombus pendant she
// gave him. Back to the present: the pendant glows in his hand. It ends as a book page with García Márquez's words.
// Sound effects only (no music). Reuses journey.js (palette, layers, screen) and the book of moon.js.
// =====================================================================
const PD_DUR = 28;
// ---------------------------------------------------------------- PLAN AS DATA
const ENG = 410, GRV = 452, NOWF = 432;                              // engawa (veranda) top, courtyard ground, the hill in the present
const PD = {
  mom: { x: 214 }, kidSit: { x: 186 }, ronin: { x: 150 },
  nod: 1.8, toMem: 3.4, fromMem: 13.0, flash: 1.0,                   // white "dream" dissolves, centred on these times
  run: [3.6, 6.3], toMom: [6.3, 7.5], song: 4.8,                     // memory: he chases a petal, she starts singing, he runs to her
  close: [8.2, 12.6], stroke: [8.6, 10.0], give: [10.0, 10.9], gift: 10.9,
  hold: 14.0, insert: [15.6, 19.2], tear: 17.4, book: 20.8, dissolve: .9,
  views: [
    { from: 0, k: 1 }, { from: 1.1, k: 2, x: 83, y: 240, pan: 2 },     // closer: he closes his eyes
    { from: 3.4, k: 1 },
    { from: 8.2, k: 2, x: 135, y: 240, pan: 2 },                    // the veranda, close: mother and son
    { from: 12.6, k: 1 },
    { from: 13.0, k: 3, x: 105, y: 300, pan: 1 },                   // the rōnin, closer still (x3)
    { from: 15.6, k: 1 },                                           // the insert: the pendant in his hand
  ],
  lines: [
    { s: '"RECORDAR ES F^ACIL PARA', c: 20, sc: 2 }, { s: 'EL QUE TIENE MEMORIA,', c: 20, sc: 2 },
    { s: 'OLVIDAR ES DIF^ICIL', c: 20, sc: 2 }, { s: 'PARA EL QUE TIENE', c: 20, sc: 2 }, { s: 'CORAZ^ON."', c: 31, sc: 3 },
  ],
  author: 'GABRIEL GARC^IA M^ARQUEZ', lineStart: 21.7, lineEvery: .75,
};

// ---------------------------------------------------------------- palettes: the present uses the plain palette (dark indexes for night);
// the memory is a warm spring morning: pastel sky, every colour pulled a little towards cream; glowing colours untouched
const PAL_MEM = PALETTE.map((h, i) => EMISSIVE.has(i) ? h : toHex(hex2(h).map((v, j) => lerp(v, [255, 232, 204][j], .2))));
const MEM_SKY = [27, 5, 7, 6];                                       // the memory's sky is drawn with these (0-5 stay free for the boy's blue hair)

// ---------------------------------------------------------------- text with a hand-drawn acute accent: ^ before the letter (as in moon.js)
function atext(x, y, str, c, o = {}) {
  const acc = []; let s = ''; for (const ch of str) { if (ch === '^') acc.push(s.length); else s += ch; }
  const sc = o.scale || 1, n = o.n ?? s.length, w = Pixel.textWidth(s, sc), x0 = Math.round(o.align === 'center' ? x - w / 2 : x);
  scr.text(x0, y, s.slice(0, n), c, { scale: sc, outline: o.outline });
  for (const i of acc) if (i < n) { const ax = x0 + i * 4 * sc; scr.rect(ax + 2 * sc, y - 3 * sc, sc, sc, c).rect(ax + sc, y - 2 * sc, sc, sc, c); }
  return { x0, w, len: s.length };
}
function heartP(x, y, s, c = 31) { ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') scr.rect(x + (i - 3) * s, y + j * s, s, s, c); })); }

// ---------------------------------------------------------------- sprites: letter colours (as in the 2.5D scenes) mapped onto the journey palette
const CI = { o: 30, k: 20, b: 21, w: 22, W: 23, Y: 24, g: 15, G: 16, l: 17, L: 18, y: 19, s: 10, S: 12, T: 13, e: 6, r: 31, R: 32, a: 2, A: 1, B: 4, C: 5, N: 0,
  c: 28, d: 29, f: 35, F: 41, t: 25, u: 26, m: 27, p: 36, P: 37, q: 33, Q: 34, x: 38, z: 42 };
class PixL {
  constructor(w, h) { this.w = w; this.h = h; this.L = layer(w, h); }
  p(x, y, c) { lp(this.L, x, y, typeof c === 'string' ? CI[c] : c); }
  r(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c); }
  line(x0, y0, x1, y1, c, th = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) + 1; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); this.r(Math.round(x - (th - 1) / 2), Math.round(y - (th - 1) / 2), th, th, c); } }
  disc(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .6) this.p(cx + x, cy + y, c); }
  done() { return outline(this.L, 30); }
}
const pattern = (P, x0, y0, rows) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') P.p(x0 + i, y0 + j, ch); }));

// ---- the rōnin today: the same design as in wakayama.html (straw kasa, blue hair, white robe with gold clouds, red obi, red sword)
const RW = 34, RH = 52, RX = 17, RF = 50;
function kasa(P, X, F) { for (let k = 0; k < 7; k++) { const hw = Math.round(1 + k * 1.75), y = F - 39 + k; for (let i = -hw; i <= hw; i++) P.p(X + i, y, (i + 40) % 4 === 0 ? 'W' : i < 0 ? 'Y' : 'W'); } P.r(X - 12, F - 33, 25, 1, 'w'); }
function ronin(pose) {                                               // 'front' | 'nod' (eyes closed) | 'hold' (the pendant at his chest, looking down at it)
  const P = new PixL(RW, RH), X = RX, F = RF, hold = pose === 'hold', closed = pose !== 'front';
  P.r(X - 4, F - 9, 3, 8, 'k'); P.r(X + 1, F - 9, 3, 8, 'k'); P.r(X - 4, F - 1, 3, 1, 'Y'); P.r(X + 1, F - 1, 3, 1, 'Y'); P.p(X - 3, F - 7, 'b'); P.p(X + 2, F - 7, 'b');
  for (let j = 0; j < 19; j++) { const hw = Math.round(4 + j * .18), y = F - 27 + j; P.r(X - hw, y, hw * 2 + 1, 1, 'e'); P.r(X + hw - 1, y, 2, 1, 'T'); }
  P.r(X - 7, F - 9, 15, 1, 'f');
  pattern(P, X - 6, F - 15, ['.ff..', 'f..ff', '.fff.']); pattern(P, X + 2, F - 14, ['ff.', '..f']); pattern(P, X - 5, F - 25, ['.f', 'ff']);
  P.line(X + 3, F - 27, X - 1, F - 20, 'T'); P.line(X - 3, F - 27, X, F - 23, 'T'); P.r(X - 1, F - 27, 3, 2, 'c'); P.p(X, F - 25, 'R');
  P.r(X - 5, F - 19, 11, 2, 'R'); P.r(X - 5, F - 19, 11, 1, 'f');
  if (!hold) { P.r(X - 9, F - 26, 4, 10, 'e'); P.r(X - 9, F - 17, 4, 1, 'T'); P.r(X + 6, F - 26, 4, 10, 'e'); P.r(X + 6, F - 17, 4, 1, 'T'); P.r(X + 8, F - 26, 2, 10, 'T'); P.r(X + 7, F - 16, 2, 2, 'c'); P.r(X - 8, F - 16, 2, 2, 'c'); }
  else {                                                             // both forearms come in to the chest; the hands cup the pendant
    P.r(X - 9, F - 26, 4, 7, 'e'); P.line(X - 7, F - 20, X - 3, F - 22, 'e', 3); P.r(X + 6, F - 26, 4, 7, 'e'); P.r(X + 8, F - 26, 2, 7, 'T'); P.line(X + 7, F - 20, X + 3, F - 22, 'T', 3);
    P.r(X - 2, F - 23, 5, 2, 'c'); P.r(X - 2, F - 22, 5, 1, 'd');
  }
  // face (eyes closed or looking down), fringe, side locks, chin cord
  P.r(X - 3, F - 32, 7, 7, 'c'); P.r(X + 2, F - 32, 2, 7, 'd'); P.r(X - 2, F - 26, 5, 1, 'd'); P.r(X - 1, F - 25, 3, 1, 'd');
  P.r(X - 4, F - 32, 9, 1, 'a'); P.r(X - 4, F - 31, 2, 1, 'a'); P.p(X - 1, F - 31, 'a'); P.p(X + 1, F - 31, 'a'); P.r(X + 3, F - 31, 2, 1, 'A'); P.p(X - 3, F - 32, 'B');
  P.r(X - 4, F - 30, 1, 4, 'a'); P.r(X + 4, F - 30, 1, 4, 'A');
  if (closed) { P.r(X - 2, F - 28, 2, 1, 'd'); P.r(X + 1, F - 28, 2, 1, 'd'); } else { P.r(X - 2, F - 29, 1, 2, 'o'); P.r(X + 2, F - 29, 1, 2, 'o'); P.p(X - 2, F - 29, 'N'); P.p(X + 2, F - 29, 'N'); }
  P.p(X, F - 26, hold ? 'R' : 'd');
  P.p(X - 4, F - 26, 'w'); P.p(X + 4, F - 26, 'w'); P.p(X - 3, F - 25, 'w'); P.p(X + 3, F - 25, 'w');
  kasa(P, X, F);
  P.line(X + 6, F - 19, X + 11, F - 24, 'r', 2); P.r(X + 5, F - 20, 3, 2, 'f');
  return P.done();
}

// ---- the boy: big blue hair, the same white robe with gold dots and red obi, short dark hakama
const KW = 24, KH = 30, KX = 12, KF = 29;
function kidHead(P, X, y, o) {                                       // y = top of the face
  if (o.side) {                                                      // profile, facing right
    P.r(X - 3, y, 8, 8, 'c'); P.r(X + 4, y + 2, 1, 4, 'c'); P.r(X - 3, y + 6, 4, 2, 'd');
    P.r(X - 5, y - 3, 10, 4, 'a'); P.r(X - 5, y + 1, 4, 5, 'a'); P.r(X - 6, y - 2, 1, 6, 'A'); P.p(X - 7, y - 1, 'a'); P.p(X - 7, y + 3, 'A'); P.p(X + 5, y - 1, 'a'); P.r(X - 4, y - 3, 3, 1, 'B');
    P.p(X + 3, y + 3, 'o'); P.p(X + 3, y + 5, 'p'); P.p(X + 4, y + 6, 'd'); P.p(X - 1, y + 3, 'd');
    return;
  }
  P.r(X - 4, y, 9, 8, 'c'); P.r(X + 3, y, 2, 8, 'd'); P.r(X - 3, y + 8, 7, 1, 'd');
  P.r(X - 5, y - 3, 11, 4, 'a'); P.r(X - 5, y + 1, 2, 4, 'a'); P.r(X + 4, y + 1, 2, 4, 'A'); P.p(X - 6, y - 2, 'a'); P.p(X + 6, y - 2, 'A'); P.p(X - 2, y + 1, 'a'); P.p(X + 1, y + 1, 'a'); P.r(X - 4, y - 3, 3, 1, 'B'); P.p(X, y - 4, 'a'); P.p(X - 3, y - 4, 'a');
  const ey = y + 3 - (o.up ? 1 : 0);
  P.r(X - 2, ey, 1, 2, 'o'); P.r(X + 2, ey, 1, 2, 'o'); P.p(X - 2, ey, 'N'); P.p(X + 2, ey, 'N'); P.p(X - 3, y + 5, 'p'); P.p(X + 3, y + 5, 'p');
  if (o.smile) { P.p(X - 1, y + 6, 'R'); P.p(X, y + 7, 'R'); P.p(X + 1, y + 6, 'R'); } else P.p(X, y + 6, 'd');
}
function kid(pose, frame = 0, pend = false) {                         // 'run' (side, frames 0-3) | 'stand' | 'sit' | 'sitUp' (looking up at her, smiling)
  const P = new PixL(KW, KH), X = KX, F = KF;
  if (pose === 'run') {
    const ph = [0, 1, 0, -1][frame], bob = frame % 2 ? -1 : 0;
    P.line(X - 1, F - 6 + bob, X - 1 - ph * 3, F - 1, 'k', 2); P.line(X + 1, F - 6 + bob, X + 1 + ph * 3, F - 1, 'k', 2); P.p(X - 1 - ph * 3, F, 'Y'); P.p(X + 2 + ph * 3, F, 'Y');
    P.r(X - 3, F - 14 + bob, 7, 9, 'e'); P.r(X + 2, F - 14 + bob, 2, 9, 'T'); P.r(X - 3, F - 9 + bob, 7, 1, 'r'); P.p(X - 2, F - 12 + bob, 'f'); P.p(X + 1, F - 7 + bob, 'f');
    P.line(X, F - 12 + bob, X + 3 - ph * 3, F - 8 + bob, 'e', 2); P.p(X + 4 - ph * 3, F - 7 + bob, 'c');
    kidHead(P, X, F - 22 + bob, { side: true });
    return P.done();
  }
  const sit = pose !== 'stand', base = sit ? F - 5 : F;              // sitting on the veranda's edge: the legs hang over it
  if (sit) { P.r(X - 3, F - 6, 3, 5, 'k'); P.r(X + 1, F - 6, 3, 5, 'k'); P.r(X - 3, F - 1, 3, 1, 'Y'); P.r(X + 1, F - 1, 3, 1, 'Y'); P.r(X - 5, F - 8, 11, 3, 'k'); }
  else { P.r(X - 3, F - 5, 2, 5, 'k'); P.r(X + 1, F - 5, 2, 5, 'k'); P.r(X - 3, F, 3, 1, 'Y'); P.r(X + 1, F, 3, 1, 'Y'); }
  const by = sit ? F - 17 : F - 14;
  P.r(X - 4, by, 9, 9, 'e'); P.r(X + 3, by, 2, 9, 'T'); P.r(X - 4, by + 5, 9, 1, 'r'); P.p(X - 3, by + 2, 'f'); P.p(X + 2, by + 7, 'f'); P.line(X - 2, by, X, by + 3, 'T'); P.line(X + 2, by, X, by + 3, 'T');
  P.r(X - 6, by + 1, 2, 6, 'e'); P.r(X + 5, by + 1, 2, 6, 'T'); P.p(X - 6, by + 7, 'c'); P.p(X + 6, by + 7, 'c');
  if (pend) { P.line(X - 2, by, X, by + 2, 'R'); P.line(X + 2, by, X, by + 2, 'R'); P.p(X, by + 2, 'x'); P.p(X - 1, by + 3, 'x'); P.p(X + 1, by + 3, 'C'); P.p(X, by + 4, 'x'); P.p(X, by + 3, 'z'); }
  kidHead(P, X, by - 9, { up: pose === 'sitUp', smile: pose === 'sitUp' || pend });
  return P.done();
}

// ---- the mother: kneeling (seiza) on the veranda, a deep red furisode with cherry flowers, gold obi, black hair up with a kanzashi
const MW = 46, MH = 48, MX = 26, MF = 47;
function mother(pose, frame = 0) {                                    // 'sit' | 'sing' (frames: mouth shut/open) | 'stroke' (hand on the boy's head, 2 frames) | 'give' (the pendant in her hands)
  const P = new PixL(MW, MH), X = MX, F = MF, sing = pose === 'sing' || pose === 'stroke', open = sing && frame % 2 === 1;
  const flower = (x, y, c = 'p') => { P.p(x, y, 'F'); P.p(x - 1, y, c); P.p(x + 1, y, c); P.p(x, y - 1, c); P.p(x, y + 1, c); };
  for (let j = 0; j < 16; j++) { const y = F - 15 + j, hw = Math.round(8 + j * .7); P.r(X - hw, y, hw * 2 + 1, 1, 'r'); P.r(X + hw - 2, y, 3, 1, 'R'); }   // the kimono spread around her knees
  P.r(X - 18, F, 37, 1, 'R'); P.r(X - 14, F - 1, 29, 1, 'p');
  for (let j = 0; j < 12; j++) { const y = F - 27 + j, hw = Math.round(4 + j * .25); P.r(X - hw, y, hw * 2 + 1, 1, 'r'); P.r(X + hw - 1, y, 2, 1, 'R'); }
  P.r(X - 7, F - 18, 15, 5, 'f'); P.r(X - 7, F - 18, 15, 1, 'F'); P.r(X - 7, F - 14, 15, 1, 'Y'); P.r(X - 7, F - 16, 15, 1, 'R'); P.r(X - 1, F - 17, 3, 3, 'R'); P.p(X, F - 16, 'p');   // obi, obijime, its knot
  P.line(X - 3, F - 27, X, F - 21, 'e'); P.line(X + 3, F - 27, X, F - 21, 'e'); P.line(X - 2, F - 27, X, F - 23, 'p'); P.r(X - 1, F - 27, 3, 2, 'c');
  [[X - 10, F - 6], [X + 7, F - 9], [X - 3, F - 3], [X + 12, F - 3], [X - 15, F - 2], [X + 3, F - 6], [X - 4, F - 24], [X + 3, F - 22]].forEach(([x, y]) => flower(x, y));
  [[X - 8, F - 10], [X + 10, F - 7], [X, F - 9]].forEach(([x, y]) => flower(x, y, 'e'));
  const sleeve = (x0, y0, w, h, c = 'r') => { P.r(x0, y0, w, h, c); P.r(x0, y0 + h - 1, w, 1, 'R'); flower(x0 + 2, y0 + h - 4); };
  // arms
  if (pose === 'stroke') {                                           // her right hand (our left) rests on the boy's head, moving a little
    const hx = X - 23 + (frame ? 1 : 0), hy = F - 25;
    sleeve(X + 5, F - 26, 5, 15); sleeve(X - 13, F - 24, 6, 11); P.line(X - 5, F - 25, hx + 4, hy + 1, 'r', 3); P.line(X - 6, F - 23, hx + 5, hy + 2, 'R');
    P.r(hx, hy, 5, 2, 'c'); P.p(hx + 1, hy + 2, 'c'); P.p(hx + 3, hy + 2, 'c'); P.r(X - 3, F - 13, 7, 2, 'c');
  } else if (pose === 'give') {                                      // both hands forward to the left, the pendant hanging from them
    sleeve(X - 12, F - 22, 6, 12); sleeve(X + 5, F - 26, 5, 15);
    P.line(X - 5, F - 24, X - 12, F - 21, 'r', 4); P.r(X - 15, F - 22, 4, 2, 'c'); P.r(X - 12, F - 23, 3, 2, 'c');
    P.line(X - 13, F - 21, X - 13, F - 18, 'R'); P.p(X - 13, F - 18, 'x'); P.p(X - 14, F - 17, 'x'); P.p(X - 12, F - 17, 'C'); P.p(X - 13, F - 16, 'x'); P.p(X - 13, F - 17, 'z');
  } else { sleeve(X - 10, F - 26, 5, 15); sleeve(X + 5, F - 26, 5, 15); P.r(X - 3, F - 13, 7, 2, 'c'); P.r(X - 3, F - 12, 7, 1, 'd'); }
  // head: face, hair up in a bun, kanzashi with a flower and dangling beads
  P.r(X - 3, F - 36, 7, 8, 'c'); P.r(X + 2, F - 36, 2, 8, 'd'); P.r(X - 2, F - 28, 5, 1, 'd');
  P.r(X - 4, F - 38, 9, 3, 'k'); P.r(X - 4, F - 35, 1, 6, 'k'); P.r(X + 4, F - 35, 1, 6, 'k'); P.p(X - 1, F - 35, 'k'); P.p(X + 1, F - 35, 'k'); P.r(X - 5, F - 37, 1, 4, 'k'); P.r(X + 5, F - 37, 1, 4, 'k');
  P.disc(X + 1, F - 42, 3, 'k'); P.p(X, F - 43, 'b'); P.p(X - 2, F - 38, 'b');
  P.line(X + 3, F - 43, X + 9, F - 46, 'f'); flower(X + 9, F - 46); P.p(X + 9, F - 44, 'F'); P.p(X + 9, F - 43, 'p'); P.p(X + 10, F - 42, 'F'); P.p(X - 4, F - 40, 'p'); P.p(X - 5, F - 39, 'F');
  if (sing) { P.r(X - 2, F - 33, 2, 1, 'd'); P.r(X + 1, F - 33, 2, 1, 'd'); P.p(X - 3, F - 34, 'd'); P.p(X + 3, F - 34, 'd'); }      // eyes closed, as she sings
  else { P.r(X - 2, F - 34, 1, 2, 'o'); P.r(X + 2, F - 34, 1, 2, 'o'); P.p(X - 2, F - 34, 'k'); P.p(X + 2, F - 34, 'k'); }
  P.p(X - 2, F - 31, 'p'); P.p(X + 2, F - 31, 'p');
  if (open) { P.r(X, F - 31, 1, 2, 'R'); P.p(X - 1, F - 30, 'r'); P.p(X + 1, F - 30, 'r'); } else { P.p(X - 1, F - 30, 'r'); P.p(X, F - 30, 'r'); P.p(X + 1, F - 30, 'r'); }
  return P.done();
}

// ---------------------------------------------------------------- set pieces, built once
const PDS = {}, PDL = {};
function roofJ(L, cx, y, w, c1, c2) {                                // a Japanese roof: wide, curved, ends turned up (as in turtle.js)
  for (let j = 0; j < 5; j++) { const hw = w / 2 + 3 - j * 1.2; for (let i = -hw; i <= hw; i++) { const lift = Math.max(0, Math.abs(i) - (hw - 4)) * .8; lp(L, cx + i, y + j - Math.round(lift), j === 0 ? c2 : c1); } }
}
function cherry(L, cx, base, h, spread, seed, R = [37, 37, 36, 36, 6, 42], n = 26) {
  trunk(L, cx, base - h, base, Math.max(3, h / 40), Math.max(7, h / 16), seed); const r = Pixel.mulberry32(seed);
  for (let k = 0; k < 3; k++) { const a = -1.2 + k * 1.2, bx = cx + Math.sin(a) * spread * .5, by = base - h * .82; for (let i = 0; i < 12; i++) lp(L, lerp(cx, bx, i / 12), lerp(base - h * .55, by, i / 12), 21); }
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()); blob(L, cx + Math.cos(a) * spread * d, base - h + Math.sin(a) * spread * .55 * d, Math.max(9, spread * .14) + r() * Math.max(9, spread * .12), seed * 10 + i, R, { tex: .45 }); }
}
function buildPendant() {
  PDS.ronin = { front: ronin('front'), nod: ronin('nod'), hold: ronin('hold') };
  PDS.kid = { run: [0, 1, 2, 3].map(f => kid('run', f)), stand: kid('stand'), sit: kid('sit'), sitUp: kid('sitUp'), sitP: kid('sitUp', 0, true) };
  PDS.mom = { sit: mother('sit'), sing: [mother('sing', 0), mother('sing', 1)], stroke: [mother('stroke', 0), mother('stroke', 1)], give: mother('give') };
  // ---- the memory: Kyoto in spring
  let L = layer(PW, PH);                                             // far hills (Higashiyama) in two hazy bands
  for (let x = 0; x < PW; x++) { const t1 = 178 + pnoise(x, PW, 1.3, 2) * 40, t2 = 214 + pnoise(x, PW, 4.1, 3) * 30; for (let y = Math.round(t1); y < PH; y++) lp(L, x, y, y < t2 ? (bay(x, y) < .5 ? 9 : 12) : 26); }
  PDL.hills = L;
  L = layer(PW, PH);                                                 // the town: rows of tiled roofs, a five-storey pagoda, cherry trees in between
  for (let i = 0; i < 9; i++) cherry(L, 18 + i * 31 + (i % 2) * 9, 262, 26, 16, 300 + i);
  const pg = 62, pb = 300;
  for (let k = 0; k < 5; k++) { const y = pb - 18 - k * 22, w = 46 - k * 6; lr(L, pg - (w >> 1) + 6, y + 4, w - 12, 14, 22); lr(L, pg - (w >> 1) + 6, y + 6, w - 12, 2, 7); for (let x = pg - (w >> 1) + 9; x < pg + (w >> 1) - 6; x += 4) lr(L, x, y + 9, 2, 7, 21); roofJ(L, pg, y, w, 20, 21); }
  lr(L, pg, pb - 18 - 4 * 22 - 22, 1, 20, 35); for (let k = 0; k < 6; k++) lr(L, pg - 2, pb - 128 - k * 3, 5, 1, 35); lp(L, pg, pb - 130, 40);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) {
    const x = 10 + i * 36 + row * 14 + (row === 1 ? -8 : 0), y = 272 + row * 14, w = 30; if (row === 0 && Math.abs(x - pg) < 30) continue;
    lr(L, x - 12, y + 3, 24, 12, 7); lr(L, x - 12, y + 3, 24, 1, 13); for (let k = -10; k < 12; k += 6) lr(L, x + k, y + 6, 1, 9, 22); roofJ(L, x, y, w, 11, 10);
  }
  PDL.town = L;
  L = layer(PW, PH);                                                 // the courtyard: low wall with a tiled cap, gravel, stepping stones, stone lantern, big cherry trees
  for (let x = 0; x < PW; x++) { lr(L, x, 318, 1, 22, ramp([23, 24, 24], .5 + (hash(x >> 2, 1, 5) - .5) * .4, x, 318)); lp(L, x, 340, 22); }
  roofJ(L, 70, 312, 150, 11, 10); roofJ(L, 210, 312, 150, 11, 10);
  for (let y = 341; y < PH; y++) for (let x = 0; x < PW; x++) { const arc = Math.round(Math.hypot((x - 110) * .8, (y - 470) * 1.6)); L.d[y * PW + x] = arc % 5 === 0 ? 12 : ramp([12, 13, 7], .55 + (hash(x, y, 6) - .5) * .5, x, y); }
  for (const [x, y, w] of [[60, 470, 26], [104, 452, 22], [146, 440, 20], [40, 428, 14]]) for (let j = -5; j <= 5; j++) for (let i = -w / 2; i <= w / 2; i++) if ((i / (w / 2)) ** 2 + (j / 5) ** 2 <= 1) lp(L, x + i, y + j, j < -2 ? 13 : j > 2 ? 11 : 12);
  { const lx = 132, ly = 398; lr(L, lx - 3, ly - 18, 6, 18, 12); lr(L, lx - 8, ly - 4, 16, 4, 12); lr(L, lx - 7, ly - 28, 14, 10, 13); lr(L, lx - 4, ly - 25, 8, 5, 40); lr(L, lx - 11, ly - 32, 22, 4, 11); lr(L, lx - 2, ly - 36, 4, 4, 12); lr(L, lx - 8, ly, 16, 2, 11); }
  cherry(L, 22, 420, 150, 70, 41); cherry(L, 246, 330, 60, 34, 42); cherry(L, 112, 340, 70, 40, 43);
  PDL.yard = L;
  L = layer(PW, PH);                                                 // the house: roof overhang, shoji, the veranda where she kneels
  for (let y = 300; y < ENG; y++) for (let x = 170; x < PW; x++) L.d[y * PW + x] = (x - 170) % 18 === 0 || (y - 300) % 12 === 0 ? 22 : (x - 170) % 18 < 2 || (y - 300) % 12 < 1 ? 23 : 7;
  lr(L, 170, 300, 2, ENG - 300, 21); lr(L, 230, 300, 3, ENG - 300, 21);
  for (let j = 0; j < 22; j++) lr(L, 160 - Math.round(j * .4), 278 + j, PW, 1, j < 3 ? 10 : j % 4 === 3 ? 11 : 20);
  for (let x = 160; x < PW; x += 5) lr(L, x, 296, 3, 4, 11);
  lr(L, 162, ENG - 2, PW, 7, 24); lr(L, 162, ENG - 2, PW, 1, 6); for (let x = 166; x < PW; x += 14) lr(L, x, ENG - 1, 1, 6, 23);
  lr(L, 162, ENG + 5, PW, 9, 22); lr(L, 162, ENG + 13, PW, 1, 21); for (const x of [168, 228]) lr(L, x, ENG + 5, 4, GRV - ENG - 5, 21); lr(L, 160, GRV - 6, 12, 6, 12);
  PDL.house = L;
  // ---- the present: night on a hill, a lone cherry tree
  L = layer(PW, PH);
  for (let x = 0; x < PW; x++) { const t1 = 330 + pnoise(x, PW, 2.2, 2) * 46, t2 = 380 + pnoise(x, PW, 5.4, 3) * 26; for (let y = Math.round(t1); y < PH; y++) lp(L, x, y, y < t2 ? 11 : 25); }
  PDL.nowHills = L;
  L = layer(PW, PH);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const top = NOWF - 12 + Math.round(Math.sin(x * .02) * 6 + (x - 150) ** 2 / 2600); if (y >= top) L.d[y * PW + x] = ramp([14, 14, 15, 16], .7 - (y - top) / 60 + (hash(x, y, 8) - .5) * .4, x, y); }
  cherry(L, 46, NOWF - 4, 160, 96, 61, [34, 37, 37, 36, 36, 6], 44);
  PDL.nowTree = L;
}

// ---------------------------------------------------------------- pieces
function petals(t, n, seed, wind = 1, region = [0, 0, PW, PH]) {     // falling cherry petals: 2 px, flipping between pink and white
  const r = Pixel.mulberry32(seed), [x0, y0, w, h] = region;
  for (let i = 0; i < n; i++) {
    const sp = 18 + r() * 22, ph = r(), x = x0 + ((r() * w + t * sp * wind * 1.3 + Math.sin(t * 1.7 + i) * 8) % w + w) % w, y = y0 + ((r() * h + t * sp + ph * h) % h);
    const f = cyc(t * 6 + i, 3); scr.pset(x, y, f === 2 ? 6 : 36); if (f === 0) scr.pset(x + 1, y, 37); else if (f === 1) scr.pset(x, y + 1, 36);
  }
}
function note(x, y, c = 42) { scr.rect(x, y + 3, 2, 2, c).rect(x + 1, y - 1, 1, 4, c).rect(x + 2, y - 1, 2, 1, c); }
function glow(x, y, r, a) { scr.dither(a * .55).circ(x, y, r, 38).dither(); scr.dither(a * .8).circ(x, y, r * .45, 5).dither(); }
function gemSmall(x, y) { scr.pset(x, y - 2, 4).pset(x - 1, y - 1, 38).pset(x, y - 1, 42).pset(x + 1, y - 1, 3).pset(x - 1, y, 38).pset(x, y, 38).pset(x + 1, y, 2).pset(x, y + 1, 2); }

// ---------------------------------------------------------------- the memory: the courtyard in spring
function kidAt(t) {                                                   // where the boy is, and how, in the wide shot
  if (t < PD.run[0]) return { x: 40, pose: 'stand', flip: false };
  if (t < PD.run[1]) { const p = seg(t, ...PD.run), x = 40 + p * 96 + Math.sin(p * TAU * 1.5) * 10; return { x, pose: 'run', frame: cyc(t * 10, 4), flip: Math.cos(p * TAU * 1.5) < -.6 }; }
  if (t < PD.toMom[1]) { const p = seg(t, ...PD.toMom); return { x: lerp(136, 166, p), pose: 'run', frame: cyc(t * 10, 4), flip: false }; }
  return { x: 166, pose: 'stand', flip: false };
}
function sceneMem(t) {
  const px = scr.px;
  for (let y = 0; y < PH; y++) { const v = y / 300 * 3.6; for (let x = 0; x < PW; x++) px[y * PW + x] = MEM_SKY[Math.min(3, Math.floor(v + bay(x, y) * .9))]; }
  for (const [cx, cy, w] of [[60 + t * 2, 70, 70], [200 + t * 1.5, 120, 90], [130 + t, 40, 50]]) { scr.dither(.6).elli(cx - w / 2, cy, w, 12, 6).dither(); scr.elli(cx - w / 4, cy - 5, w / 2, 10, 6); }
  blit(PDL.hills, 0, 0); blit(PDL.town, 0, 0); blit(PDL.yard, 0, 0); blit(PDL.house, 0, 0);
  // the mother on the veranda: sitting, then singing, then (close shot) stroking his hair and giving him the pendant
  const singing = t >= PD.song, mpose = t >= PD.gift + .5 ? 'sit' : t >= PD.give[0] ? 'give' : t >= PD.stroke[0] && t < PD.stroke[1] ? 'stroke' : singing ? 'sing' : 'sit';
  const mf = cyc(t * 2.4, 2), M = mpose === 'sit' ? PDS.mom.sit : mpose === 'give' ? PDS.mom.give : PDS.mom[mpose][mf];
  blit(M, PD.mom.x - MX, ENG - MF);
  // the boy: running in the courtyard in the wide shot; by the close shot he sits beside her
  if (t < PD.close[0]) { const k = kidAt(t), S = k.pose === 'run' ? PDS.kid.run[k.frame] : PDS.kid.stand; shadow(k.x, GRV, 6); blit(S, k.x - (k.flip ? KW - 1 - KX : KX), GRV - KF, k.flip); }
  else { const gave = t >= PD.gift, S = gave ? PDS.kid.sitP : t >= PD.give[0] || t < PD.close[0] + 1 ? PDS.kid.sitUp : PDS.kid.sit; blit(S, PD.kidSit.x - KX, ENG + 5 - KF);
    if (gave) { const lt = t - PD.gift, kx = PD.kidSit.x, ky = ENG - 9; glow(kx, ky, 3 + Math.sin(t * 4) * .8, lt < .6 ? .9 : .5); if (lt < .9) for (let k = 0; k < 10; k++) { const a = k * TAU / 10 + lt * 3, rr = 8 + lt * 22; scr.dither(1 - lt / .9).pset(kx + Math.cos(a) * rr, ky + Math.sin(a) * rr, 42).dither(); } } }
  if (t < PD.close[0]) { const p = seg(t, PD.run[0] - .3, PD.run[1]); if (p > 0 && p < 1) { const x = 52 + p * 104 + Math.sin(p * 9) * 8, y = 360 + Math.sin(p * 7) * 14 + p * 40; scr.rect(x, y, 2, 2, 36).pset(x + 2, y, 6); } }   // the petal he chases
  if (singing) for (let k = 0; k < 6; k++) { const lt = ((t - PD.song) * .5 + k / 6) % 1, x = PD.mom.x + 6 + lt * 26 + Math.sin(lt * 7 + k) * 5, y = ENG - 40 - lt * 70; if (t - PD.song > k * .3 && lt < .95) { scr.dither(1 - lt * .9); note(x, y, k % 2 ? 42 : 36); scr.dither(); } }
  petals(t, 70, 81, 1);
  // memory vignette: dithered warm edge
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const e = Math.min(x, PW - 1 - x, y * .6, (PH - 1 - y) * .6); if (e < 14 && B8(x, y) > e / 14) px[y * PW + x] = 6; }
}

// ---------------------------------------------------------------- the present: night, the hill, the cherry tree, the rōnin
function sceneNow(t) {
  const px = scr.px;
  for (let y = 0; y < PH; y++) { const v = y / PH * 2.6; for (let x = 0; x < PW; x++) px[y * PW + x] = v + bay(x, y) > 1.7 ? 1 : 0; }
  const r = Pixel.mulberry32(92); for (let i = 0; i < 70; i++) { const x = Math.floor(r() * PW), y = Math.floor(r() * 300), tw = cyc(t * 2.2 + r() * 9, 5); if (tw) scr.pset(x, y, tw > 3 ? 42 : 8); }
  const mx = 208, my = 112; scr.dither(.3).circ(mx, my, 44, 1).dither(); scr.dither(.5).circ(mx, my, 34, 26).dither(); scr.circ(mx, my, 27, 7).circ(mx, my, 24, 42);
  for (const [dx, dy, rr] of [[-8, -6, 5], [7, 6, 6], [9, -10, 3], [-5, 11, 4]]) scr.dither(.5).circ(mx + dx, my + dy, rr, 13).dither();
  blit(PDL.nowHills, 0, 0); blit(PDL.nowTree, 0, 0);
  const x = PD.ronin.x, pose = t < PD.nod ? 'front' : t < PD.hold ? 'nod' : 'hold';
  shadow(x, NOWF, 9); blit(PDS.ronin[pose], x - RX, NOWF - RF);
  if (pose === 'hold') { const a = seg(t, PD.hold, PD.hold + .6), gy = NOWF - 22; glow(x, gy + 1, (4 + Math.sin(t * 3)) * a, a * .7); gemSmall(x, gy); scr.dither(.5 * a).elli(x - 30, NOWF - 4, 60, 8, 26).dither(); if (cyc(t * 4, 3) === 0) scr.pset(x - 4, gy - 3, 42).pset(x + 4, gy + 2, 42); }
  petals(t, 46, 93, 1.4, [0, 120, PW, 360]);
  for (let x2 = 0; x2 < PW; x2++) { const b = (x2 * 37) % 13; if (b < 3) scr.pset(x2, NOWF - 6 - b + Math.round(Math.sin(x2 * .02) * 6 + (x2 - 150) ** 2 / 2600), 16); }   // grass tips
}

// ---------------------------------------------------------------- the insert: the pendant in his palm
function sceneInsert(t) {
  const px = scr.px, lt = t - PD.insert[0];
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) px[y * PW + x] = (y / PH) + bay(x, y) * .5 > .75 ? 1 : 0;
  petals(t, 34, 95, .8);
  // the sleeve (white robe, gold cloud) and his closed hand coming in from the upper left, holding the cord
  for (let y = 0; y < 150; y++) { const x1 = 70 - y * .55; for (let x = 0; x < x1 + 40 - y * .2; x++) if (x < x1 + 30) px[y * PW + x] = x > x1 + 26 ? 13 : 6; }
  scr.rect(20, 40, 10, 3, 35).rect(26, 37, 8, 3, 35).rect(14, 70, 8, 2, 35);
  const fx = 104, fy = 112; scr.elli(fx - 30, fy - 22, 60, 46, 29); scr.elli(fx - 28, fy - 24, 54, 40, 28);
  for (let k = 0; k < 4; k++) { scr.elli(fx - 22 + k * 12, fy + 6, 14, 16, 29); scr.elli(fx - 21 + k * 12, fy + 6, 12, 13, 28); scr.rect(fx - 18 + k * 12, fy + 10, 6, 1, 29); }
  scr.elli(fx + 18, fy - 14, 22, 14, 29); scr.elli(fx + 19, fy - 14, 19, 11, 28);
  const sway = Math.sin(t * 1.6) * 6, gx = Math.round(140 + sway), gy = 262, hw = 32, hh = 46, pulse = .5 + .5 * Math.sin(t * 3.2);
  for (let k = 0; k <= 30; k++) { const p = k / 30, cx = lerp(fx + 10, gx, p) + Math.sin(p * Math.PI) * 4, cy = lerp(fy + 16, gy - hh - 4, p); scr.pset(cx, cy, 31).pset(cx + 1, cy, 32); }
  scr.rect(gx - 3, gy - hh - 6, 7, 5, 35).rect(gx - 2, gy - hh - 5, 5, 3, 41);
  scr.dither(.22 + pulse * .12).circ(gx, gy, 70 + pulse * 6, 38).dither(); scr.dither(.3).circ(gx, gy, 52, 5).dither();
  for (let y = -hh; y <= hh; y++) { const w = Math.round(hw * (1 - Math.abs(y) / hh)); for (let x = -w; x <= w; x++) {
    const inner = Math.abs(x) / hw + Math.abs(y) / hh < .42, c = inner ? (y < 0 ? 5 : 4) : x < 0 ? (y < 0 ? 4 : 2) : (y < 0 ? 3 : 1);
    px[(gy + y) * PW + gx + x] = Math.abs(Math.abs(x) - w) < 1 ? 0 : c; } }
  scr.line(gx - hw + 4, gy, gx + hw - 4, gy, 2); scr.line(gx, gy - hh + 4, gx, gy + hh - 4, 3);
  scr.tri(gx - 14, gy - 22, gx - 6, gy - 30, gx - 8, gy - 16, 42); scr.rect(gx - 4, gy - 8, 3, 3, 42);
  // inside it, the memory: petals drifting through the stone
  for (let i = 0; i < 6; i++) { const p = ((lt * .25 + i / 6) % 1), x = gx - 16 + p * 32 + Math.sin(p * 9 + i) * 6, y = gy - 24 + i * 9; if (Math.abs(x - gx) / hw + Math.abs(y - gy) / hh < .8) { scr.dither(.7).rect(x, y, 2, 2, 36).dither(); } }
  for (let k = 0; k < 4; k++) { const a = t * 1.2 + k * TAU / 4, sx = gx + Math.cos(a) * 54, sy = gy + Math.sin(a) * 66, s = cyc(t * 6 + k, 3) + 1; scr.rect(sx - s, sy, s * 2 + 1, 1, 42).rect(sx, sy - s, 1, s * 2 + 1, 42); }
  // a tear falls onto the stone
  const tl = t - PD.tear; if (tl > 0 && tl < .55) { const y = -10 + tl * tl * 900; scr.rect(gx + 10, y, 3, 5, 5).pset(gx + 11, y - 1, 42).pset(gx + 11, y + 1, 42); }
  if (tl >= .55 && tl < 1.3) { const q = (tl - .55) / .75; scr.dither(1 - q); scr.circb(gx + 11, gy - 18, 4 + q * 30, 42); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; scr.pset(gx + 11 + Math.cos(a) * (6 + q * 18), gy - 18 + Math.sin(a) * (6 + q * 18) - q * 6, 5); } scr.dither(); }
}

// ---------------------------------------------------------------- the book (as in moon.js): the present becomes the page's illustration
const MI = { x: 45, y: 46, w: 180, h: 186, sx: 60, sy: NOWF - 176 }, miBuf = new Uint8Array(180 * 186);
function sceneBookP(t) {
  sceneNow(Math.max(t, PD.hold + 1));
  for (let y = 0; y < MI.h; y++) miBuf.set(scr.px.subarray((MI.sy + y) * PW + MI.sx, (MI.sy + y) * PW + MI.sx + MI.w), y * MI.w);
  scr.reset();
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) scr.px[y * PW + x] = (x % 64 === 0 || y % 16 === 0) ? 20 : 21;
  scr.rect(10, 16, 250, 452, 20).rect(12, 18, 246, 448, 32).rect(14, 20, 242, 444, 31).rect(14, 20, 242, 2, 36).rect(18, 24, 234, 436, 32);
  for (const [cx, cy] of [[16, 22], [246, 22], [16, 456], [246, 456]]) scr.rect(cx, cy, 8, 6, 35).rect(cx + 2, cy + 2, 4, 2, 41);
  for (let i = 0; i < 8; i++) scr.rect(22 + i, 28 + i, 222, 426, i % 2 ? 23 : 24);
  scr.rect(22, 28, 218, 422, 41);
  for (let y = 28; y < 450; y++) for (let x = 22; x < 240; x++) { const e = Math.min(x - 22, 239 - x, y - 28, 449 - y); if ((e < 10 && bay(x, y) > e / 10) || hash(x >> 1, y >> 1, 4) > .985) scr.px[y * PW + x] = 24; }
  scr.rect(MI.x - 4, MI.y - 4, MI.w + 8, MI.h + 8, 21).rect(MI.x - 3, MI.y - 3, MI.w + 6, MI.h + 6, 35).rect(MI.x - 1, MI.y - 1, MI.w + 2, MI.h + 2, 20);
  for (let y = 0; y < MI.h; y++) scr.px.set(miBuf.subarray(y * MI.w, (y + 1) * MI.w), (MI.y + y) * PW + MI.x);
  for (const [cx, cy] of [[MI.x - 5, MI.y - 5], [MI.x + MI.w - 1, MI.y - 5], [MI.x - 5, MI.y + MI.h - 1], [MI.x + MI.w - 1, MI.y + MI.h - 1]]) scr.rect(cx, cy, 6, 6, 35).rect(cx + 2, cy + 2, 2, 2, 31);
  let y = 256;
  PD.lines.forEach((ln, i) => {
    const a = seg(t, PD.lineStart + i * PD.lineEvery, PD.lineStart + i * PD.lineEvery + .55), len = ln.s.replace(/\^/g, '').length, n = Math.ceil(len * a);
    if (i === PD.lines.length - 1) y += 4;
    if (a > 0) { const m = atext(131, y, ln.s, ln.c, { scale: ln.sc, align: 'center', n }); if (a < 1) scr.rect(m.x0 + Pixel.textWidth('X'.repeat(n), ln.sc) + 2, y, 2, 5 * ln.sc, 31); }
    y += ln.sc * 5 + 9;
  });
  const ta = PD.lineStart + PD.lines.length * PD.lineEvery + .3, aa = seg(t, ta, ta + .5);
  if (aa > 0) { scr.dither(aa); atext(131, 382, '- ' + PD.author + ' -', 22, { scale: 1, align: 'center' }); scr.dither(); }
  if (aa >= 1) { const beat = (t % 1) < .2 ? 3 : 2; heartP(131, 398 - (beat - 2) * 2, beat); scr.rect(70, 404, 40, 1, 21).rect(152, 404, 40, 1, 21); gemSmall(64, 404); gemSmall(198, 404); }
  scr.text(131, 436, '- 27 -', 22, { align: 'center' });
  for (let j = 0; j < 96; j++) { const x = 229 + Math.round(Math.sin(j * .07 + t * 1.5) * (j / 60)); scr.rect(x, 22 + j, 8, 1, j % 9 === 8 ? 2 : 3); scr.pset(x + 7, 22 + j, 1); }   // a blue ribbon this time
  scr.tri(229, 118, 237, 118, 233, 112, 4);
  const r = Pixel.mulberry32(97); for (let i = 0; i < 10; i++) { const per = 4 + r() * 3, p = ((t + r() * per) % per) / per, x = 30 + r() * 200 + Math.sin(p * 6 + i) * 8, y2 = 30 + p * 420; scr.pset(x, y2, 36).pset(x + 1, y2, 37); }   // a few petals over the page
}

// ---------------------------------------------------------------- frame
const pdA = new Uint8Array(PW * PH);
const inMem = t => t >= PD.toMem && t < PD.fromMem;
function sceneAt(t) { if (inMem(t)) sceneMem(t); else if (t >= PD.insert[0] && t < PD.insert[1]) sceneInsert(t); else sceneNow(t); }
function pdDraw(t, ctx) {
  scr.reset();
  const d0 = PD.book - PD.dissolve / 2, d1 = PD.book + PD.dissolve / 2;
  if (t < d0) sceneAt(t);
  else if (t >= d1) sceneBookP(t);
  else { sceneAt(t); pdA.set(scr.px); sceneBookP(t); const p = (t - d0) / PD.dissolve, px = scr.px; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (p <= B8(x >> 1, y >> 1)) px[y * PW + x] = pdA[y * PW + x]; }
  // into and out of the memory: a white dream dissolve with petals swirling (index 42 looks the same in both palettes)
  for (const c of [PD.toMem, PD.fromMem]) { const p = 1 - Math.abs(t - c) / (PD.flash / 2); if (p > 0) { const px = scr.px; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (B8(x >> 1, y >> 1) < p) px[y * PW + x] = 42; for (let k = 0; k < 40; k++) { const a = k * 2.4 + t * 3, rr = 20 + (k * 37) % 180 * p; scr.pset(PW / 2 + Math.cos(a) * rr, PH / 2 + Math.sin(a) * rr * 1.4, k % 2 ? 36 : 37); } } }
  if (t < .5) { const p = t / .5, px = scr.px; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (B8(x >> 1, y >> 1) > p) px[y * PW + x] = 30; }
  const c = scr.render({ palette: inMem(t) && t < PD.book ? PAL_MEM : PALETTE }), i = PD.views.findLastIndex(v => t >= v.from), v = PD.views[i];
  ctx.imageSmoothingEnabled = false;
  if (t >= d0 || v.k === 1) ctx.drawImage(c, 0, 0, PW, PH, 0, 0, W, H);
  else { const cw = PW / v.k, ch = PH / v.k, end = PD.views[i + 1] ? PD.views[i + 1].from : PD_DUR, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - cw), clamp(v.y, 0, PH - ch), cw, ch, 0, 0, W, H); }
}

// ---------------------------------------------------------------- sound effects only (no music, no singing voice: her song is shown with notes)
function pdAudio(ac, out, t0 = 0) {
  { const g = ac.createGain(); g.gain.value = 3.2; g.connect(out); out = g; }                // the effects are soft by design; lift them as a whole
  const at = x => t0 + x, r = Pixel.mulberry32(29);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.05, dur * .3))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'sine') => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .01)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  const bed = (t0b, t1b, f, q, g) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), v = ac.createGain(); s.buffer = nb; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; v.gain.setValueAtTime(.0001, at(t0b)); v.gain.linearRampToValueAtTime(g, at(t0b + .4)); v.gain.setValueAtTime(g, at(t1b - .4)); v.gain.linearRampToValueAtTime(.0001, at(t1b)); s.connect(fl).connect(v).connect(out); s.start(at(t0b)); s.stop(at(t1b)); };
  // the present: night wind and crickets
  for (const [a, b] of [[0, PD.toMem + .3], [PD.fromMem - .3, PD.book]]) { bed(a, b, 480, .7, .03); for (let t = a + .2; t < b - .2; t += .6 + r() * .2) if (r() > .3) for (let k = 0; k < 3; k++) tone(t + k * .055, .035, 4300, 4300, .01, 'square'); }
  // the memory: a spring breeze, birds, a wind chime (furin) on the veranda
  bed(PD.toMem - .2, PD.fromMem + .2, 900, .6, .018);
  for (let t = PD.toMem + .5; t < PD.fromMem - .5; t += .9 + r() * 1.4) { const f = 2600 + r() * 900; tone(t, .07, f, f * 1.3, .025, 'triangle'); tone(t + .1, .06, f * 1.1, f * 1.4, .02, 'triangle'); }
  for (let t = PD.toMem + .8; t < PD.fromMem - .4; t += 1.6 + r() * 1.2) { const f = [2093, 2349, 2637][Math.floor(r() * 3)]; tone(t, 1.4, f, f, .03, 'sine'); tone(t, 1.0, f * 2.76, f * 2.76, .008, 'sine'); }
  for (let t = PD.run[0]; t < PD.toMom[1]; t += .16) noise(t, .04, 1800, 900, .025, 'bandpass', 2);   // small running steps on gravel
  // dream dissolves
  for (const c of [PD.toMem, PD.fromMem]) { noise(c - .5, 1.0, 400, 3000, .05, 'bandpass', .8); [1568, 1976, 2349, 3136].forEach((f, i) => tone(c - .2 + i * .09, .9, f, f, .025, 'triangle')); }
  // the gift: a soft shimmer; the pendant in the present glows with the same sound
  [1319, 1760, 2093, 2637, 3520].forEach((f, i) => tone(PD.gift + i * .06, .6, f, f, .035, 'triangle'));
  [1319, 1760, 2093, 2637].forEach((f, i) => tone(PD.hold + i * .08, .7, f, f, .03, 'triangle'));
  noise(PD.insert[0] - .1, .4, 2000, 6000, .03); [2637, 3136, 3951].forEach((f, i) => tone(PD.insert[0] + .2 + i * .12, 1.2, f, f, .018, 'sine'));
  tone(PD.tear + .55, .09, 1900, 900, .07, 'sine'); tone(PD.tear + .6, .8, 2637, 2637, .025, 'sine');   // the tear on the stone
  noise(PD.book - .3, .45, 3500, 900, .12); Chip.sfx.select(ac, at(PD.book + .15), out, { gain: .12 });   // the page
  PD.lines.forEach((ln, i) => { const n = ln.s.replace(/\^/g, '').length; for (let k = 0; k < n; k += 2) tone(PD.lineStart + i * PD.lineEvery + k * (.55 / n), .025, 1500 + (k % 3) * 120, 1300, .03, 'square'); });
  const ta = PD.lineStart + PD.lines.length * PD.lineEvery + .8; [1047, 1319, 1568, 2093].forEach((f, i) => tone(ta + i * .07, .4, f, f, .04, 'triangle'));
  for (let t = ta + .2; t < PD_DUR - .3; t += 1) { tone(t, .12, 70, 50, .07); tone(t + .18, .1, 65, 48, .05); }   // the heartbeat
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * PD_DUR), sr);
  pdAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
