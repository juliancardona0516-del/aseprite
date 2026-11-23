// =====================================================================
// El reino (Continuará…) — 29 s, 9:16. A Japanese mountain castle (after the user's reference painting) is attacked by
// blue orcs; the five adventurers drive them off; their chief snatches the princess in the pink kimono, rips off her
// glowing blue pendant and carries her away. The rōnin arrives running, too late; the red-haired hero sees the same
// pendant on his chest, thinks he took her, and they cross swords. "CONTINUARÁ...".
// Sound effects only. Loads journey.js (party, palette, screen) and pendant.js (rōnin, text with accents, gem).
// =====================================================================
const KG_DUR = 31;
// ---------------------------------------------------------------- PLAN AS DATA
const KG = {
  vista: [0, 3.5],                                                   // the castle on its mountain, the town burning at its foot
  arrive: [3.6, 5.3],                                                // the party runs in from the left
  party: [['healer', 34], ['mage', 56], ['archer', 80], ['knight', 104], ['hero', 128]],
  orcs: [                                                            // x, weapon, who hits it and when (they all face left, towards the party)
    { x: 150, w: 0, by: 'knight', at: 6.9 }, { x: 168, w: 1, by: 'mage', at: 6.3 }, { x: 186, w: 2, by: 'archer', at: 5.95 },
    { x: 204, w: 0, by: 'hero', at: 7.6 }, { x: 222, w: 1, flee: 8.1 },
  ],
  cheer: [8.6, 11.0], princess: { x: 244 },
  chief: { peek: 11.3, grab: 12.4, rip: 12.9, carry: 13.5, gone: 16.8, laugh: 16.2 },
  resist: { arrow: 14.25, orb: 14.75, hero: [14.9, 15.15], knight: [15.5, 15.75], volley: 16.4 },   // they all attack; his force field throws everything back
  ronin: { run: [17.0, 18.2], from: 300, x: 232, dots: 18.5, glint: 19.0 },
  heroSees: 19.4, approach: [19.6, 20.4], thought: [20.4, 22.2],
  say: [{ who: 'hero', s: '¡DEVU^ELVELA!', at: 22.3, to: 23.7 }, { who: 'ronin', s: '¡NO FUI YO!', at: 23.8, to: 25.0 }],
  dash: 25.0, clashes: [25.3, 26.1, 26.8], freeze: 27.3, text: 27.7, end: 31,
  views: [
    { from: 0, k: 1 },
    { from: 11.2, k: 2, x: 135, y: 230 },                            // the gate, close: the chief takes her
    { from: 13.6, k: 1 },                                           // wide again: the whole party fights back
    { from: 14.6, k: 2, x: 135, y: 230 },                            // close on the field: the hero and the knight bounce off it
    { from: 16.0, k: 1 },
    { from: 20.4, k: 2, x: 135, y: 230 },                            // the hero and the rōnin, close
  ],
};
const STF = FEET;                                                     // the street

// ---------------------------------------------------------------- text: ^ before a letter puts an acute accent on it; ¡ and ¿ are drawn as turned ! and ?
function say(x, y, str, c, o = {}) {
  const acc = [], inv = []; let s = '';
  for (const ch of str) { if (ch === '^') { acc.push(s.length); continue; } if (ch === '¡' || ch === '¿') { inv.push([s.length, ch]); s += ' '; continue; } s += ch; }
  const sc = o.scale || 1, n = o.n ?? s.length, w = Pixel.textWidth(s, sc), x0 = Math.round(o.align === 'center' ? x - w / 2 : x);
  if (o.outline !== undefined) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) scr.text(x0 + dx, y + dy, s.slice(0, n), o.outline, { scale: sc });
  scr.text(x0, y, s.slice(0, n), c, { scale: sc });
  for (const i of acc) if (i < n && s[i] !== ' ') { const ax = x0 + i * 4 * sc; scr.rect(ax + 2 * sc, y - 3 * sc, sc, sc, c).rect(ax + sc, y - 2 * sc, sc, sc, c); }
  for (const [i, ch] of inv) if (i < n) { const ax = x0 + i * 4 * sc;
    if (ch === '¡') scr.rect(ax + sc, y, sc, sc, c).rect(ax + sc, y + 2 * sc, sc, 3 * sc, c);
    else scr.rect(ax + sc, y, sc, sc, c).rect(ax + sc, y + 2 * sc, sc, sc, c).rect(ax, y + 3 * sc, sc, sc, c).rect(ax + sc, y + 4 * sc, 2 * sc, sc, c); }
  return { x0, w };
}
const ACCENTS = s => s.replace(/\^/g, '');
function bubble(x, y, str, sc = 1) {                                 // a speech bubble whose tail points down at (x, y)
  const s = ACCENTS(str), w = Pixel.textWidth(s.replace(/[¡¿]/g, ' '), sc) + 8, h = 5 * sc + 9, bx = Math.round(clamp(x - w / 2, 2, PW - w - 2)), by = y - h - 5;
  scr.rect(bx - 1, by - 1, w + 2, h + 2, 30).rect(bx, by, w, h, 6); scr.tri(x - 3, by + h, x + 3, by + h, x, by + h + 5, 6); scr.line(x - 3, by + h, x, by + h + 5, 30); scr.line(x + 3, by + h, x, by + h + 5, 30);
  say(bx + w / 2, by + 5, str, 30, { scale: sc, align: 'center' });
}
function bang(x, y, c = 31, s = '!') { say(x, y, s, c, { scale: 2, align: 'center', outline: 30 }); }

// ---------------------------------------------------------------- sprites
// ---- blue orcs, side view facing right (their own letters: blues from the sky ramp, leather, a red eye)
const OCI = { o: 30, c: 3, A: 1, a: 0, C: 4, w: 22, W: 23, k: 20, n: 12, N: 13, z: 6, h: 31, r: 31, R: 32, O: 39, f: 40, F: 41, y: 24 };
class PixO extends PixL { p(x, y, c) { lp(this.L, x, y, typeof c === 'string' ? OCI[c] : c); } }
const OW = 22, OH = 26, OX = 10, OF = 25;
function orcS(pose, w, frame = 0) {                                  // 'idle' (club up/down by frame) | 'run' (frames 0-3) | 'carry' (arms up to the shoulder)
  const P = new PixO(OW, OH), X = OX, F = OF, run = pose === 'run' || pose === 'carry', ph = run ? [0, 1, 0, -1][frame] : 0, bob = run && frame % 2 ? -1 : 0;
  P.line(X - 2, F - 7 + bob, X - 2 - ph * 3, F - 1, 'a', 2); P.line(X + 1, F - 7 + bob, X + 1 + ph * 3, F - 1, 'A', 2); P.r(X - 3 - ph * 3, F, 3, 1, 'w'); P.r(X + 1 + ph * 3, F, 3, 1, 'w');
  P.r(X - 4, F - 10 + bob, 9, 3, 'w'); P.p(X - 3, F - 7 + bob, 'w'); P.p(X + 2, F - 7 + bob, 'w');
  P.r(X - 5, F - 18 + bob, 10, 8, 'c'); P.r(X - 5, F - 18 + bob, 3, 8, 'A'); P.r(X - 6, F - 17 + bob, 2, 5, 'A'); P.line(X - 4, F - 18 + bob, X + 3, F - 11 + bob, 'w'); P.r(X - 6, F - 19 + bob, 4, 2, 'n');
  P.r(X, F - 24 + bob, 7, 6, 'c'); P.r(X + 6, F - 21 + bob, 2, 3, 'c'); P.r(X - 1, F - 23 + bob, 2, 4, 'A'); P.p(X - 2, F - 22 + bob, 'c'); P.p(X - 3, F - 23 + bob, 'c');
  P.r(X + 3, F - 23 + bob, 4, 1, 'A'); P.p(X + 5, F - 22 + bob, 'h'); P.p(X + 7, F - 19 + bob, 'z'); P.p(X + 7, F - 20 + bob, 'z'); P.r(X + 4, F - 19 + bob, 3, 1, 'a'); P.r(X + 1, F - 25 + bob, 2, 1, 'k');
  if (w === 3) { P.r(X, F - 24 + bob, 7, 1, 'r'); P.r(X - 3, F - 24 + bob, 3, 1, 'r'); P.p(X - 4, F - 23 + bob, 'R'); P.p(X - 5, F - 22 + bob, 'r'); }   // the chief's red band
  const weapon = (hx, hy, ang) => { const dx = Math.sin(ang), dy = -Math.cos(ang); P.line(hx, hy, hx + dx * 9, hy + dy * 9, 'W'); const ex = hx + dx * 9, ey = hy + dy * 9;
    if (w === 0) { P.r(ex - 1, ey - 1, 3, 3, 'w'); P.p(ex, ey - 2, 'n'); } else if (w === 1) { P.p(ex, ey, 'n'); P.p(ex + dx, ey + dy, 'N'); P.p(ex + dx * 2, ey + dy * 2, 'N'); } else if (w === 2) { P.r(ex - 1, ey - 2, 3, 3, 'O'); P.p(ex, ey - 3, 'f'); P.p(ex, ey - 1, 'F'); } };
  if (pose === 'carry') { P.line(X + 1, F - 17 + bob, X + 4, F - 23 + bob, 'c', 2); P.line(X - 3, F - 17 + bob, X - 1, F - 23 + bob, 'A', 2); }
  else if (pose === 'run') { P.line(X + 1, F - 15 + bob, X + 5 - ph * 2, F - 11 + bob, 'c', 2); if (w < 3) weapon(X + 5 - ph * 2, F - 11 + bob, 1.1); }
  else { const up = frame % 2 === 0; P.line(X + 2, F - 16, X + 6, up ? F - 20 : F - 13, 'c', 2); if (w < 3) weapon(X + 6, up ? F - 20 : F - 13, up ? .2 : .9); }
  return P.done();
}
function blitRotS(L, cx, cy, ang, flip = false) {                   // a sprite drawn rotated about its centre (as in turtle.js)
  const px = scr.px, ca = Math.cos(-ang), sa = Math.sin(-ang), rad = Math.ceil(Math.hypot(L.w, L.h) / 2) + 1; cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= PW || Y >= PH) continue; let u = Math.floor(dx * ca - dy * sa + L.w / 2), v = Math.floor(dx * sa + dy * ca + L.h / 2); if (flip) u = L.w - 1 - u; if (u < 0 || v < 0 || u >= L.w || v >= L.h) continue; const c = L.d[v * L.w + u]; if (c !== 255) px[Y * PW + X] = c; }
}
// ---- the orc chief: much bigger and heavier than his warriors; red head band, spiked shoulder plate, bare hands (to grab)
const CW = 36, CH = 44, CX = 16, CF = 43;
function chiefS(pose, frame = 0) {                                  // 'idle' (arm reaching, frames 0-1) | 'run' (frames 0-3) | 'carry' (both arms up to the shoulder)
  const P = new PixO(CW, CH), X = CX, F = CF, run = pose !== 'idle', ph = run ? [0, 1, 0, -1][frame] : 0, bob = run && frame % 2 ? -1 : 0, G = F + bob;
  P.line(X - 4, G - 13, X - 4 - ph * 4, F - 1, 'a', 4); P.line(X + 3, G - 13, X + 3 + ph * 4, F - 1, 'A', 4); P.r(X - 7 - ph * 4, F, 6, 1, 'w'); P.r(X + 2 + ph * 4, F, 6, 1, 'w');
  P.r(X - 8, G - 17, 17, 6, 'w'); P.r(X - 8, G - 17, 17, 1, 'k'); for (let x = X - 6; x < X + 8; x += 4) P.p(x, G - 17, 'n');
  P.r(X - 10, G - 31, 20, 15, 'c'); P.r(X - 10, G - 31, 6, 15, 'A'); P.r(X - 12, G - 29, 3, 10, 'A'); P.r(X + 2, G - 25, 7, 7, 'C'); P.line(X - 8, G - 31, X + 6, G - 18, 'w', 2);
  P.r(X - 13, G - 33, 9, 5, 'n'); P.r(X - 13, G - 33, 9, 1, 'N'); for (let k = 0; k < 3; k++) { P.p(X - 12 + k * 3, G - 34, 'N'); P.p(X - 12 + k * 3, G - 35, 'n'); }
  P.r(X + 1, G - 41, 12, 11, 'c'); P.r(X + 9, G - 34, 5, 4, 'c'); P.r(X + 1, G - 41, 3, 11, 'A'); P.line(X + 1, G - 38, X - 3, G - 42, 'c', 2);
  P.r(X + 5, G - 38, 8, 1, 'A'); P.r(X + 9, G - 37, 2, 1, 'h'); P.r(X + 6, G - 32, 7, 1, 'a'); P.r(X + 12, G - 33, 1, 3, 'z'); P.r(X + 9, G - 33, 1, 2, 'z');
  P.r(X + 1, G - 40, 12, 2, 'r'); P.line(X, G - 39, X - 6, G - 35, 'r', 2); P.p(X - 7, G - 34, 'R'); P.r(X + 4, G - 43, 4, 2, 'k');
  if (pose === 'carry') { P.line(X + 4, G - 28, X + 9, G - 38, 'c', 4); P.line(X - 6, G - 28, X - 3, G - 38, 'A', 3); }
  else if (pose === 'run') { P.line(X + 4, G - 27, X + 9 - ph * 3, G - 19, 'c', 4); P.r(X + 8 - ph * 3, G - 20, 4, 4, 'c'); }
  else { const r0 = frame ? 0 : 3; P.line(X + 4, G - 27, X + 15, G - 23 - r0, 'c', 4); P.r(X + 14, G - 25 - r0, 4, 4, 'c'); P.p(X + 18, G - 24 - r0, 'c'); P.p(X + 18, G - 22 - r0, 'c'); }
  return P.done();
}
const whiteOf = L => ({ w: L.w, h: L.h, d: L.d.map(v => v === 255 ? 255 : v === 30 ? 30 : 6) });
// ---- the princess: pink kimono with white flowers, red obi, black hime-cut hair, a small gold tiara, the glowing blue pendant
const QW = 28, QH = 42, QX = 14, QF = 41;
function princess(pose, pend = true) {                               // 'stand' | 'fear' (hands up, eyes wide)
  const P = new PixL(QW, QH), X = QX, F = QF, fear = pose === 'fear';
  P.r(X - 6, F - 32, 13, 22, 'k'); P.r(X - 7, F - 26, 15, 12, 'k');                                    // long hair behind
  for (let j = 0; j < 22; j++) { const y = F - 21 + j, hw = Math.round(4 + j * .2); P.r(X - hw, y, hw * 2 + 1, 1, 'p'); P.r(X + hw - 1, y, 2, 1, 'P'); }
  P.r(X - 8, F, 17, 1, 'P'); [[X - 3, F - 6], [X + 3, F - 3], [X - 6, F - 2], [X + 4, F - 11], [X - 2, F - 13], [X + 6, F - 1]].forEach(([x, y]) => { P.p(x, y, 'e'); P.p(x - 1, y, 'e'); P.p(x + 1, y, 'e'); P.p(x, y - 1, 'e'); P.p(x, y + 1, 'e'); P.p(x, y, 'F'); });
  P.r(X - 5, F - 17, 11, 3, 'r'); P.r(X - 5, F - 17, 11, 1, 'f'); P.r(X - 1, F - 16, 3, 2, 'R');
  P.line(X - 3, F - 22, X, F - 18, 'e'); P.line(X + 3, F - 22, X, F - 18, 'e'); P.r(X - 1, F - 22, 3, 2, 'c');
  if (!fear) { P.r(X - 9, F - 20, 4, 13, 'p'); P.r(X + 6, F - 20, 4, 13, 'P'); P.r(X - 2, F - 13, 5, 2, 'c'); }
  else { P.line(X - 6, F - 20, X - 7, F - 27, 'p', 3); P.line(X + 6, F - 20, X + 7, F - 27, 'P', 3); P.r(X - 8, F - 30, 2, 2, 'c'); P.r(X + 7, F - 30, 2, 2, 'c'); }
  P.r(X - 3, F - 30, 7, 8, 'c'); P.r(X + 2, F - 30, 2, 8, 'd');
  P.r(X - 5, F - 33, 11, 3, 'k'); P.r(X - 4, F - 30, 9, 1, 'k'); P.r(X - 5, F - 30, 2, 9, 'k'); P.r(X + 4, F - 30, 2, 9, 'k'); P.p(X - 3, F - 34, 'b'); P.r(X - 2, F - 35, 5, 1, 'f'); P.p(X, F - 36, 'f'); P.p(X, F - 35, 'p');
  P.p(X + 5, F - 33, 'f'); P.p(X + 6, F - 34, 'p');
  if (fear) { P.r(X - 2, F - 28, 1, 2, 'o'); P.r(X + 2, F - 28, 1, 2, 'o'); P.r(X, F - 25, 1, 2, 'R'); } else { P.p(X - 2, F - 27, 'o'); P.p(X + 2, F - 27, 'o'); P.p(X, F - 24, 'r'); }
  P.p(X - 2, F - 25, 'p'); P.p(X + 2, F - 25, 'p');
  if (pend) { P.line(X - 2, F - 22, X, F - 20, 'R'); P.line(X + 2, F - 22, X, F - 20, 'R'); P.p(X, F - 20, 'x'); P.p(X - 1, F - 19, 'x'); P.p(X + 1, F - 19, 'C'); P.p(X, F - 18, 'x'); P.p(X, F - 19, 'z'); }
  return P.done();
}
// ---- the rōnin from the side, facing right: running (4 frames), standing, on guard with the red sword out
function roninSide(pose, frame = 0) {
  const P = new PixL(RW, RH), X = RX, F = RF, run = pose === 'run', ph = run ? [0, 1, 0, -1][frame] : 0, bob = run && frame % 2 ? -1 : 0, G = F + bob;
  P.line(X - 1, G - 9, X - 1 - ph * 3, F - 1, 'k', 3); P.line(X + 1, G - 9, X + 1 + ph * 3, F - 1, 'b', 3); P.r(X - 2 - ph * 3, F, 3, 1, 'Y'); P.r(X + ph * 3, F, 3, 1, 'Y');
  for (let j = 0; j < 18; j++) { const y = G - 27 + j, hw = Math.round(3 + j * .15); P.r(X - hw, y, hw * 2 + 1, 1, 'e'); P.r(X - hw, y, 1, 1, 'T'); }
  P.r(X - 4, G - 19, 9, 2, 'R'); P.r(X - 4, G - 19, 9, 1, 'f'); P.p(X - 2, G - 24, 'f'); P.p(X + 1, G - 14, 'f'); P.p(X - 1, G - 12, 'f');
  P.r(X - 3, G - 32, 7, 7, 'c'); P.r(X - 3, G - 32, 3, 7, 'a'); P.r(X - 4, G - 31, 1, 5, 'A'); P.p(X - 5, G - 29, 'a'); P.r(X - 2, G - 32, 6, 1, 'a'); P.p(X + 3, G - 31, 'a');
  P.r(X + 2, G - 29, 1, 2, 'o'); P.p(X + 2, G - 29, 'N'); P.p(X + 3, G - 26, 'd'); P.p(X + 3, G - 25, 'w');
  kasa(P, X, G);
  if (pose === 'guard') {                                            // both hands on the hilt, the blade forward and up
    P.line(X - 1, G - 25, X + 5, G - 20, 'e', 3); P.r(X + 5, G - 21, 3, 2, 'c'); P.r(X + 7, G - 22, 2, 4, 'f'); P.line(X + 9, G - 21, X + 20, G - 30, 'r', 2); P.line(X + 9, G - 22, X + 20, G - 31, 'e');
    P.line(X - 4, G - 19, X - 9, G - 12, 'R', 2);
  } else {
    const sw = run ? -ph * 3 : 0; P.line(X, G - 25, X + 3 + sw, G - 17, 'e', 3); P.r(X + 3 + sw, G - 17, 2, 2, 'c');
    P.line(X - 3, G - 19, X - 11, G - 12, 'R', 2); P.line(X - 3, G - 20, X - 11, G - 13, 'r'); P.r(X - 2, G - 21, 3, 2, 'f');
  }
  return P.done();
}

// ---------------------------------------------------------------- set pieces
const KGS = {}, KGL = {};
function tenshu(L, cx, base, tiers, tw) {                            // a castle keep: white walls, dark curved roofs, gold fish on the top
  for (let k = 0; k < tiers; k++) { const w = tw - k * (tw / (tiers + 1)), y = base - 10 - k * 11; lr(L, cx - w / 2 + 3, y + 3, w - 6, 9, 6); lr(L, cx + w / 2 - 6, y + 3, 3, 9, 13); for (let x = cx - w / 2 + 6; x < cx + w / 2 - 5; x += 5) lr(L, x, y + 6, 2, 3, 11); roofJ(L, cx, y, w, 20, 21); }
  const ty = base - 10 - tiers * 11; lr(L, cx - 1, ty - 3, 3, 4, 21); lp(L, cx - 4, ty - 2, 35); lp(L, cx + 4, ty - 2, 35); lp(L, cx - 4, ty - 3, 35); lp(L, cx + 4, ty - 3, 35);
}
function stoneWall(L, x0, x1, y, h) { for (let yy = y; yy < y + h; yy++) { const inset = Math.round((yy - y) * -.25); for (let x = x0 + inset; x < x1 - inset; x++) lp(L, x, yy, (x * 3 + (yy >> 2) * 7) % 11 === 0 || yy % 4 === 0 ? 11 : ramp([12, 13], .5 + (hash(x >> 1, yy >> 1, 9) - .5) * .5, x, yy)); } }
function buildKingdom() {
  // ---- the vista (after the reference painting): a lake, far grey hills, the castle mountain, the town at its foot
  let L = layer(PW, PH);
  for (let x = 0; x < PW; x++) { const t1 = 170 + pnoise(x, PW, .7, 2) * 30; for (let y = Math.round(t1); y < 250; y++) lp(L, x, y, bay(x, y) < .5 ? 12 : 13); }
  for (let y = 236; y < PH; y++) for (let x = 0; x < PW; x++) lp(L, x, y, (y + (x >> 3)) % 9 === 0 ? 5 : 27);
  for (let x = 0; x < PW; x++) { const top = 130 + Math.abs(x - 150) * 1.35 + (vnoise(x * .06, 0, 11) - .5) * 26; for (let y = Math.max(0, Math.round(top)); y < 410; y++) lp(L, x, y, ramp([15, 16, 17, 18], .78 - (y - top) / 260 - (x - 150) / 420 + (vnoise(x * .08, y * .08, 12) - .5) * .5, x, y)); }
  const r = Pixel.mulberry32(13); for (let i = 0; i < 46; i++) { const a = r(), x = 40 + a * 230, y = 160 + Math.abs(x - 150) * 1.2 + r() * 180; if (y < 400) blob(L, x, y, 5 + r() * 6, 130 + i, [14, 14, 15, 16], { tex: .5 }); }
  for (let x = 0; x < PW; x++) for (let y = 380; y < PH; y++) if (y > 384 + Math.sin(x * .04) * 6) lp(L, x, y, ramp([16, 17, 18], .6 + (hash(x, y, 14) - .5) * .4, x, y));
  stoneWall(L, 118, 182, 132, 12); stoneWall(L, 106, 170, 196, 10); stoneWall(L, 160, 230, 236, 10);
  for (const [x, y, w] of [[118, 196, 30], [150, 196, 26], [178, 236, 34], [208, 236, 28]]) { lr(L, x - w / 2 + 3, y - 6, w - 6, 6, 6); roofJ(L, x, y - 11, w, 20, 21); }
  tenshu(L, 150, 132, 5, 46);
  for (let i = 0; i < 14; i++) { const x = 12 + i * 19 + (i % 2) * 6, y = 418 + (i % 3) * 14; lr(L, x - 8, y + 3, 16, 8, 7); roofJ(L, x, y, 20, 11, 10); }
  KGL.vista = L;
  // ---- the street at the castle gate: the mountain and keep behind, a row of houses, the gate on the right
  L = layer(PW, PH);
  for (let x = 0; x < PW; x++) { const top = 70 + Math.abs(x - 190) * 1.1 + (vnoise(x * .06, 0, 21) - .5) * 20; for (let y = Math.max(0, Math.round(top)); y < 330; y++) lp(L, x, y, ramp([15, 16, 17], .7 - (y - top) / 220 + (vnoise(x * .08, y * .08, 22) - .5) * .5, x, y)); }
  const r2 = Pixel.mulberry32(23); for (let i = 0; i < 26; i++) { const x = r2() * PW, y = 110 + Math.abs(x - 190) * 1.05 + r2() * 120; if (y < 320) blob(L, x, y, 5 + r2() * 6, 230 + i, [14, 14, 15, 16], { tex: .5 }); }
  stoneWall(L, 150, 230, 94, 10); tenshu(L, 190, 94, 5, 48);
  for (let i = 0; i < 6; i++) { const x = 18 + i * 34, y = 300; lr(L, x - 15, y + 4, 30, 34, 7); lr(L, x - 15, y + 4, 30, 2, 13); for (let k = -12; k < 14; k += 8) lr(L, x + k, y + 8, 1, 30, 22); lr(L, x - 5, y + 20, 10, 18, 22); roofJ(L, x, y, 36, 11, 10); }
  for (let y = 338; y < PH; y++) for (let x = 0; x < PW; x++) L.d[y * PW + x] = y === 338 ? 21 : ramp([21, 22, 23, 23], .55 + (y - 338) / 400 + (hash(x >> 1, y >> 1, 24) - .5) * .4, x, y);
  // the gate: stone base, dark wooden doors (open), a tiled roof; three steps where the princess stands
  stoneWall(L, 214, 274, 340, 20); lr(L, 226, 300, 48, 40, 22); lr(L, 232, 304, 36, 36, 20); lr(L, 226, 300, 48, 2, 23); for (let x = 228; x < 274; x += 9) lr(L, x, 302, 1, 38, 21);
  roofJ(L, 250, 290, 58, 11, 10); lr(L, 230, 294, 40, 2, 35);
  for (let k = 0; k < 3; k++) lr(L, 222 + k * 4, STF - 4 + k * 2 - 4, 52 - k * 4, 2, k % 2 ? 12 : 13);
  for (const lx of [16, 140]) { lr(L, lx - 2, STF - 18, 4, 18, 12); lr(L, lx - 6, STF - 26, 12, 8, 13); lr(L, lx - 3, STF - 24, 6, 4, 40); lr(L, lx - 8, STF - 30, 16, 4, 11); }   // stone lanterns
  KGL.street = L;
  KGS.orc = [0, 1, 2, 3].map(w => ({ idle: [orcS('idle', w, 0), orcS('idle', w, 1)], run: [0, 1, 2, 3].map(f => orcS('run', w, f)) }));
  KGS.orcW = KGS.orc.map(o => whiteOf(o.idle[0]));
  KGS.chief = { idle: [chiefS('idle', 0), chiefS('idle', 1)], run: [0, 1, 2, 3].map(f => chiefS('run', f)), carry: [0, 1, 2, 3].map(f => chiefS('carry', f)) };
  KGS.pr = { stand: princess('stand'), fear: princess('fear'), fearN: princess('fear', false) };
  { const L = KGS.pr.stand, o = layer(L.w >> 1, L.h >> 1); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const cs = [L.d[2 * y * L.w + 2 * x], L.d[2 * y * L.w + 2 * x + 1], L.d[(2 * y + 1) * L.w + 2 * x], L.d[(2 * y + 1) * L.w + 2 * x + 1]].filter(c => c !== 255); if (cs.length) o.d[y * o.w + x] = cs.find(c => c !== 30) ?? cs[0]; } KGS.prHalf = outline(o, 30); }   // her portrait for the hero's thought
  KGS.rs = { run: [0, 1, 2, 3].map(f => roninSide('run', f)), stand: roninSide('stand'), guard: roninSide('guard') };
}

// ---------------------------------------------------------------- pieces
function fireOn(x, y, w, t, seed, k = 1) {                           // a roof on fire
  for (let i = -w; i <= w; i++) { const h = (1 - Math.abs(i) / (w + 1)) * 16 * k * (.5 + .8 * vnoise(i * .3 + seed * 7, t * 7, seed)) + 2;
    for (let j = 0; j < h; j++) { const p = j / h; if (p > .7 && bay(i + seed, j + Math.floor(t * 20)) > .6) continue; scr.pset(x + i + Math.round(Math.sin(j * .3 + t * 9 + seed) * p * 2), y - j, p < .25 ? 42 : p < .5 ? 40 : p < .8 ? 39 : 31); } }
}
function smokeUp(x, y, t, seed, k = 1) { for (let i = 0; i < 10; i++) { const p = ((t * .25 + i / 10 + seed * .13) % 1), sx = x + Math.sin(p * 5 + i + seed) * (4 + p * 8) + p * 18, sy = y - p * 160 * k, rr = 4 + p * 10; scr.dither(Math.min(1, (1 - p) * 1.4) * .7); scr.circ(sx, sy, rr, p < .3 ? 10 : 9); scr.dither(); } }
function spark(x, y, t0, t) { const lt = t - t0; if (lt < 0 || lt > .45) return; const q = lt / .45; for (let k = 0; k < 10; k++) { const a = k * TAU / 10 + 1, rr = 3 + q * 16; scr.pset(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8, k % 2 ? 40 : 42); } if (lt < .1) scr.circ(x, y, 5, 42); }
function orcAt(i, t) {                                               // position, pose and spin of orc i
  const o = KG.orcs[i];
  if (o.flee && t >= o.flee) return { x: o.x + (t - o.flee) * 90, y: STF, run: true, flip: false };
  if (o.at && t >= o.at) { const lt = t - o.at; return { x: o.x + lt * 110, y: STF - 150 * lt + 320 * lt * lt, ang: lt * 11, hit: lt < .14 }; }
  return { x: o.x, y: STF, flip: true };
}
let CHF = null;                                                      // where the chief (and his force field) is this frame
const RS = KG.resist, HITS = [RS.arrow, RS.orb, RS.hero[1], RS.knight[1], RS.volley];
function shield(cx, cy, t) {                                         // a purple dome of orc magic: hex lattice, a bright rim, ripples where it is struck
  cx = Math.round(cx); cy = Math.round(cy);
  const px = scr.px, rx = 28, ry = 34, flash = HITS.some(h => t >= h && t < h + .2), on = seg(t, KG.chief.carry, KG.chief.carry + .4), pulse = .5 + .5 * Math.sin(t * 7);
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2; if (d > 1) continue; const X = cx + x, Y = cy + y; if (X < 0 || X >= PW || Y < 0 || Y >= PH) continue;
    if (d > .74) { if (B8(X, Y) < on * (flash ? 1 : .85)) px[Y * PW + X] = flash ? 42 : d > .9 ? 38 : (d > .82 ? 33 : 34); }
    else if (((X + ((Y / 6) | 0) * 3) % 6 === 0 || Y % 6 === 0) && B8(X, Y) < on * (flash ? .9 : .45 + pulse * .2)) px[Y * PW + X] = flash ? 38 : 33;
    else if (B8(X, Y) < on * .1) px[Y * PW + X] = 33;
  }
  for (const h of HITS) { const lt = t - h; if (lt >= 0 && lt < .5) { scr.dither(1 - lt * 2); scr.ellib(cx - rx + 4 - lt * 20, cy - ry + 4 - lt * 20, (rx - 4 + lt * 20) * 2, (ry - 4 + lt * 20) * 2, 42); scr.dither(); } }
}
function strike(t, [a, hit], x0, to, back) {                         // a run at the field, the bounce off it, the walk back; returns null when not striking
  if (t < a || t > hit + 1.3) return null;
  if (t < hit) return { x: lerp(x0, to, inOutSine(seg(t, a, hit))), hop: 0 };
  if (t < hit + .45) { const q = seg(t, hit, hit + .45); return { x: lerp(to, back, q), hop: Math.sin(q * Math.PI) * 16, ang: q }; }
  return { x: lerp(back, x0, inOutSine(seg(t, hit + .45, hit + 1.3))), hop: 0 };
}
function partyAt(k, x0, t) {                                         // where each adventurer stands; the hero and the knight dash in to strike
  const arrive = seg(t, ...KG.arrive), x = lerp(x0 - 150, x0, arrive);
  const dash = (a, b, to) => { const p = Math.min(seg(t, a, a + .25), 1 - seg(t, b, b + .3)); return lerp(x, to, inOutSine(p)); };
  if (k === 'knight') { const s = strike(t, RS.knight, x0, 216, x0 + 34); if (s) return s.x; return dash(6.6, 7.0, 134); }
  if (k === 'hero') { const s = strike(t, RS.hero, x0, 212, x0 + 26); if (s) return s.x; if (t >= KG.dash) return 168 + 34 * inOutSine(seg(t, KG.dash, KG.dash + .3)) - 6 * Math.abs(Math.sin((t - KG.dash) * 4.2)); if (t >= KG.approach[0]) return lerp(x0, 168, inOutSine(seg(t, ...KG.approach))); return dash(7.3, 7.7, 190); }
  return x;
}

// ---------------------------------------------------------------- the vista
function sceneVista(t) {
  const px = scr.px; for (let y = 0; y < PH; y++) { const v = y / 240 * 3.2; for (let x = 0; x < PW; x++) px[y * PW + x] = [4, 5, 7, 7][Math.min(3, Math.floor(v + bay(x, y) * .8))]; }
  for (const [cx, cy, w] of [[50 + t * 3, 60, 70], [190 + t * 2, 96, 80]]) { scr.dither(.5).elli(cx - w / 2, cy, w, 10, 6).dither(); }
  blit(KGL.vista, 0, 0);
  for (const [x, y, s] of [[40, 420, 1], [98, 432, 2], [170, 418, 3], [226, 430, 4]]) { smokeUp(x, y, t, s, .8); fireOn(x, y + 2, 5, t, s, .6); }
  const r = Pixel.mulberry32(17); for (let i = 0; i < 22; i++) { const x = (r() * PW + t * (r() > .5 ? 10 : -10)) % PW, y = 440 + r() * 30, f = cyc(t * 8 + i, 2); scr.pset(x, y + f, 3).pset(x, y - 1 + f, 3).pset(x + 1, y - 1 + f, 1); }   // the horde, tiny
}

// ---------------------------------------------------------------- the street: battle, the kidnapping, the rōnin, the duel
function sceneStreet(t) {
  const px = scr.px; for (let y = 0; y < PH; y++) { const v = y / 300 * 3.2; for (let x = 0; x < PW; x++) px[y * PW + x] = [4, 5, 7, 7][Math.min(3, Math.floor(v + bay(x, y) * .8))]; }
  blit(KGL.street, 0, 0);
  const burn = 1 - seg(t, 9.5, 13) * .55;
  for (const [x, s] of [[18, 1], [86, 2], [154, 3]]) { smokeUp(x, 300, t, s, burn); fireOn(x, 304, 9, t, s, burn); }
  const P = KG.princess, C = KG.chief, frozen = t >= KG.freeze;
  // the princess (and, later, the chief who takes her)
  if (t < C.grab) { const fear = t < KG.cheer[0] || t >= C.peek + .8; blit(fear ? KGS.pr.fear : KGS.pr.stand, P.x - QX, STF - 6 - QF); if (!fear || t < KG.cheer[0]) { glow(P.x, STF - 25, 3, .5); } }
  if (t >= C.peek && t < C.gone) {
    let cx, pose, pr = null;
    if (t < C.grab) { cx = lerp(300, P.x + 17, inOutSine(seg(t, C.peek, C.grab))); pose = KGS.chief.run[cyc(t * 7, 4)]; }
    else if (t < C.carry) { cx = P.x + 17; pose = KGS.chief.idle[t < C.rip ? 1 : 0]; pr = t < C.rip ? 'fear' : 'fearN'; }
    else { cx = P.x + 10 - (t - C.carry) * 6; pose = KGS.chief.carry[cyc(t * 8, 4)]; }
    const up = t >= C.carry ? Math.round(seg(t, C.carry, C.gone) * 34) : 0, save = t >= C.carry ? Uint8Array.from(scr.px) : null;   // up the steps and into the dark gate
    if (pr) blit(KGS.pr[pr], P.x - QX - 4, STF - 8 - QF);
    blit(pose, cx - (CW - 1 - CX), STF - 6 - CF - up, true);
    if (t >= C.carry) blitRotS(KGS.pr.fearN, cx + 1, STF - 50 - up, -1.45);
    CHF = t >= C.carry ? { x: cx, y: STF - 34 - up } : null; if (CHF) shield(CHF.x, CHF.y, t);
    if (t >= C.laugh && t < C.gone - .2) bang(Math.min(cx, PW - 46), STF - 86 - up, 33, '¡JA JA JA!');
    if (save) { const a = 1 - seg(t, C.gone - .7, C.gone), px = scr.px; for (let y = STF - 110; y < STF; y++) for (let x = cx - 36; x < cx + 36; x++) { const i = y * PW + x; if (x >= 0 && x < PW && B8(x >> 1, y >> 1) > a) px[i] = save[i]; } }
    if (t >= C.grab && t < C.rip + .1) bang(P.x - 2, STF - 64, 31);
    if (t >= C.rip && t < C.carry + .6) { const gx = cx + (t < C.carry ? -18 : -7), gy = t < C.carry ? STF - 36 - seg(t, C.rip, C.rip + .3) * 6 : STF - 50 - up; glow(gx, gy, 5, .8); gemSmall(gx, gy); if (cyc(t * 6, 2)) scr.pset(gx - 4, gy - 3, 42).pset(gx + 4, gy + 3, 42); }
  }
  // the orcs
  KG.orcs.forEach((o, i) => { const s = orcAt(i, t); if (s.x > PW + 30 || s.y > PH + 30) return;
    if (s.ang !== undefined) blitRotS(s.hit ? KGS.orcW[o.w] : KGS.orc[o.w].idle[0], s.x, s.y - 12, -s.ang, true);
    else { const S = s.run ? KGS.orc[o.w].run[cyc(t * 9 + i, 4)] : KGS.orc[o.w].idle[cyc(t * 3 + i * .7, 2)]; shadow(s.x, STF, 6); blit(S, s.x - (s.flip ? OW - 1 - OX : OX), STF - OF, s.flip); } });
  // the party
  const pos = {};
  KG.party.forEach(([k, x0], i) => {
    const x = partyAt(k, x0, t); pos[k] = x;
    const walking = t >= KG.arrive[0] && t < KG.arrive[1], S = SPR[k];
    let spr = walking ? S.walk[cyc(t * 9 + i, 4)] : S.stand, y = STF;
    if (t >= KG.cheer[0] && t < KG.cheer[1]) { y -= cyc(t * 3 + i * .5, 2); if (k === 'hero') spr = S.cheer; }
    if (k === 'hero' && t >= KG.dash) spr = S.cheer;
    if (k === 'hero' && t >= KG.approach[0] && t < KG.approach[1]) spr = S.walk[cyc(t * 8, 4)];
    const st = k === 'hero' ? strike(t, RS.hero, x0, 212, x0 + 26) : k === 'knight' ? strike(t, RS.knight, x0, 216, x0 + 34) : null;
    if (st) { y -= Math.round(st.hop); if (k === 'hero' && !st.ang) spr = S.cheer; }
    shadow(x, STF, 8); blit(spr, x - SX, y - SFY);
  });
  // the counter-attack on the chief: arrows and magic, each one thrown back by the field
  if (CHF) {
    const ex = CHF.x - 28, ey = CHF.y;
    const arrow = (t0, dy) => { const p = seg(t, t0 - .35, t0); if (p > 0 && p < 1) { const x = lerp(pos.archer + 8, ex, p), y = STF - 26 + (ey - STF + 26) * p + dy; scr.line(x - 6, y, x, y, 23).pset(x + 1, y, 13).pset(x - 7, y - 1, 31); }
      const lt = t - t0; if (lt >= 0 && lt < .6) { const x = ex - lt * 40, y = ey + dy - 30 * lt + 120 * lt * lt; scr.line(x, y, x + 5, y + 3, 23).pset(x - 1, y - 1, 13); } };
    arrow(RS.arrow, 0); arrow(RS.volley, -6); arrow(RS.volley + .08, 6);
    const orb = t0 => { const p = seg(t, t0 - .4, t0); if (p > 0 && p < 1) { const x = lerp(pos.mage + 10, ex, p), y = lerp(STF - 44, ey, p) - Math.sin(p * Math.PI) * 20; scr.dither(.5).circ(x, y, 6, 38).dither(); scr.circ(x, y, 3, 5).pset(x, y, 42); }
      const lt = t - t0; if (lt >= 0 && lt < .5) { for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k - 4.5) * .3, rr = 4 + lt * 40; scr.pset(ex + Math.cos(a + Math.PI / 2) * rr * .6 - lt * 20, ey + Math.sin(a + Math.PI / 2) * rr, k % 2 ? 38 : 42); } } };
    orb(RS.orb); orb(RS.volley + .15);
    for (const h of [RS.hero[1], RS.knight[1]]) spark(ex - 2, ey + 6, h, t);
  }
  // their blows
  { const a = KG.orcs[2], p = seg(t, a.at - .35, a.at); if (p > 0 && p < 1) { const x = lerp(pos.archer + 8, a.x, p), y = STF - 26; scr.line(x - 6, y, x, y, 23).pset(x + 1, y, 13).pset(x - 7, y - 1, 31).pset(x - 7, y + 1, 31); } spark(a.x, STF - 16, a.at, t); }
  { const a = KG.orcs[1], p = seg(t, a.at - .35, a.at); if (p > 0 && p < 1) { const x = lerp(pos.mage + 10, a.x, p), y = STF - 44 + p * 24; scr.dither(.5).circ(x, y, 6, 38).dither(); scr.circ(x, y, 3, 5).pset(x, y, 42); } const lt = t - a.at; if (lt > 0 && lt < .5) { scr.dither(1 - lt * 2); scr.circb(a.x, STF - 16, 4 + lt * 30, 38); scr.dither(); } }
  { const a = KG.orcs[0]; spark(a.x - 6, STF - 18, a.at, t); }
  { const a = KG.orcs[3], lt = t - a.at + .1; if (lt > 0 && lt < .25) { for (let k = 0; k < 14; k++) { const ang = -1.4 + k * .2 + lt * 4; scr.pset(a.x - 4 + Math.cos(ang) * 16, STF - 20 + Math.sin(ang) * 16, k % 3 ? 42 : 7); } } spark(a.x, STF - 18, a.at, t); }
  if (t >= 8.2 && t < 9.6) { const lt = t - 8.2; for (let k = 0; k < 8; k++) { const x = 30 + k * 14 + Math.sin(lt * 3 + k) * 4, y = STF - 40 - lt * 30 - (k % 3) * 8; scr.dither(1 - lt / 1.4); heartP(x, y, 1, 36); scr.dither(); } }
  if (t >= KG.cheer[0] + .2 && t < KG.cheer[0] + 1.4) bang(pos.hero + 2, STF - 60, 35, '¡VICTORIA!');
  if (t >= C.grab + .1 && t < C.grab + 1.4) for (const k of ['knight', 'hero', 'archer']) bang(pos[k] + 2, STF - 56, 31);
  // the rōnin
  const R = KG.ronin;
  if (t >= R.run[0]) {
    const running = t < R.run[1], x = running ? lerp(R.from, R.x, seg(t, ...R.run)) : R.x;
    const S = t >= KG.dash ? KGS.rs.guard : running ? KGS.rs.run[cyc(t * 10, 4)] : KGS.rs.stand;
    shadow(x, STF, 8); blit(S, x - (RW - 1 - RX), STF - RF, true);
    const gx = x - 2, gy = STF - 24; glow(gx, gy, t >= R.glint && t < R.glint + 1 ? 5 : 3, t >= R.glint ? .8 : .45); gemSmall(gx, gy);
    if (t >= R.dots && t < R.dots + 1.2) say(x, STF - 66, '...'.slice(0, 1 + cyc((t - R.dots) * 4, 3)), 30, { scale: 2, align: 'center', outline: 6 });
    if (t >= R.glint && t < R.glint + .5) for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + t * 4; scr.pset(gx + Math.cos(a) * 8, gy + Math.sin(a) * 8, 42); }
  }
  if (t >= KG.heroSees && t < KG.thought[0]) bang(pos.hero + 2, STF - 56, 31, '!?');
  if (t >= KG.thought[0] && t < KG.thought[1]) {                    // the hero's thought: her pendant... on his chest
    const hx = pos.hero, by = STF - 104; for (const [dx, dy, r0] of [[4, 52, 2], [8, 44, 3]]) scr.circ(hx + dx, by + dy, r0 + 1, 30).circ(hx + dx, by + dy, r0, 6);
    scr.elli(hx - 18, by - 2, 56, 40, 30); scr.elli(hx - 17, by - 1, 54, 38, 6);
    const p = seg(t, KG.thought[0], KG.thought[0] + .6), cx = hx + 10, cy = by + 18;
    blit(KGS.prHalf, hx - 14, by + 8);
    const gx = hx + 24, gy = cy; scr.dither(.5).circ(gx, gy, 9, 38).dither(); for (let y = -7; y <= 7; y++) { const w = Math.round(5 * (1 - Math.abs(y) / 7)); scr.rect(gx - w, gy + y, w * 2 + 1, 1, y < 0 ? 4 : 2); } scr.pset(gx - 1, gy - 3, 42);
    if (t >= KG.thought[0] + 1) bang(gx + 12, by - 4, 31, '!');
  }
  KG.say.forEach(b => { if (t >= b.at && t < b.to) { const n = Math.ceil(ACCENTS(b.s).length * seg(t, b.at, b.at + .45)); const x = b.who === 'hero' ? pos.hero + 4 : R.x - 2; const str = b.s; bubbleN(x, STF - 58, str, n); } });
  KG.clashes.forEach(c => spark(Math.round((pos.hero + R.x) / 2) + 4, STF - 34, c, t));
  if (frozen) for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (B8(x >> 1, y >> 1) < .55 * seg(t, KG.freeze, KG.freeze + .5)) px[y * PW + x] = 30;
}
function bubbleN(x, y, str, n) {                                     // a speech bubble whose text types itself
  const s = ACCENTS(str), sc = 1, w = Pixel.textWidth(s, sc) + 8, h = 5 * sc + 9, bx = Math.round(clamp(x - w / 2, 2, PW - w - 2)), by = y - h - 5;
  scr.rect(bx - 1, by - 1, w + 2, h + 2, 30).rect(bx, by, w, h, 6); scr.tri(x - 3, by + h, x + 3, by + h, x, by + h + 5, 6); scr.line(x - 3, by + h, x, by + h + 5, 30); scr.line(x + 3, by + h, x, by + h + 5, 30);
  say(bx + 4, by + 5, str, 30, { scale: sc, n });
}

// ---------------------------------------------------------------- frame
function kgDraw(t, ctx) {
  scr.reset();
  const tt = t >= KG.freeze ? KG.freeze + Math.min(t - KG.freeze, .5) : t;   // the duel freezes; only the dim keeps going
  if (t < KG.vista[1]) sceneVista(t); else sceneStreet(t >= KG.freeze ? KG.freeze - .001 + 0 * tt : t);
  if (t >= KG.freeze) { const px = scr.px, d = .6 * seg(t, KG.freeze, KG.freeze + .5); for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (B8(x >> 1, y >> 1) < d) px[y * PW + x] = 30; }
  // cut flashes: vista -> street, and a quick white flash on each clash
  for (const c of [KG.vista[1], ...KG.clashes]) { const lt = t - c; if (lt >= 0 && lt < .08) { const px = scr.px; for (let i = 0; i < px.length; i++) if (B8(i % PW >> 1, (i / PW | 0) >> 1) < .5 - lt * 6) px[i] = 42; } }
  if (t < .4) { const px = scr.px, p = t / .4; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (B8(x >> 1, y >> 1) > p) px[y * PW + x] = 30; }
  const c = scr.render({ palette: PALETTE }), i = KG.views.findLastIndex(v => t >= v.from), v = KG.views[i];
  ctx.imageSmoothingEnabled = false;
  // the closing words are drawn at full size over the frozen frame
  if (v.k === 1) ctx.drawImage(c, 0, 0, PW, PH, 0, 0, W, H);
  else { const cw = PW / v.k, ch = PH / v.k, shake = KG.clashes.some(cl => t >= cl && t < cl + .2) ? Math.round(Math.sin(t * 90) * 2) : 0; ctx.drawImage(c, clamp(v.x + shake, 0, PW - cw), clamp(v.y, 0, PH - ch), cw, ch, 0, 0, W, H); }
  if (t >= KG.text) {
    scr.reset(); const px = scr.px; px.fill(255);
    const n = Math.ceil(13 * seg(t, KG.text, KG.text + 1.2));
    say(PW / 2, 220, 'CONTINUAR^A...', 35, { scale: 4, align: 'center', outline: 30, n });
    if (t >= KG.text + 1.6) { const a = seg(t, KG.text + 1.6, KG.text + 2.1); scr.dither(a); say(PW / 2, 262, 'PIXEL QUEST ADVENTURE', 6, { scale: 1, align: 'center' }); scr.dither(); }
    const o = scr.render({ palette: PALETTE }), oc = document.createElement('canvas'); oc.width = PW; oc.height = PH; const ox = oc.getContext('2d'); ox.drawImage(o, 0, 0);
    const id = ox.getImageData(0, 0, PW, PH); for (let k = 0; k < PW * PH; k++) if (px[k] === 255) id.data[k * 4 + 3] = 0; ox.putImageData(id, 0, 0);
    ctx.drawImage(oc, 0, 0, PW, PH, 0, 0, W, H);
  }
}

// ---------------------------------------------------------------- sound effects only
function kgAudio(ac, out, t0 = 0) {
  { const g = ac.createGain(); g.gain.value = 2.6; g.connect(out); out = g; }
  const at = x => t0 + x, r = Pixel.mulberry32(37);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.03, dur * .3))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'square') => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .01)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  const bed = (a, b, f, q, g) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), v = ac.createGain(); s.buffer = nb; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; v.gain.setValueAtTime(.0001, at(a)); v.gain.linearRampToValueAtTime(g, at(a + .4)); v.gain.setValueAtTime(g, at(b - .5)); v.gain.linearRampToValueAtTime(.0001, at(b)); s.connect(fl).connect(v).connect(out); s.start(at(a)); s.stop(at(b)); };
  const grunt = (t, p = 1) => { tone(t, .22, 140 * p, 90 * p, .05, 'sawtooth'); noise(t, .2, 700 * p, 400 * p, .03, 'bandpass', 3); };
  const clang = t => { [2300, 3100, 4200, 5300].forEach((f, i) => tone(t, .5 - i * .08, f, f * .98, .04 / (i + 1), 'triangle')); noise(t, .15, 7000, 3000, .12, 'highpass', .8); tone(t, .12, 160, 80, .08, 'triangle'); };
  // fire and wind under everything; distant cries in the vista
  bed(0, KG.freeze, 1600, .5, .02); bed(0, KG.freeze, 400, .7, .025);
  for (let t = .3; t < KG.cheer[0]; t += .12 + r() * .25) noise(t, .03, 2500 + r() * 2000, 1400, .02 + r() * .02, 'bandpass', 4);
  for (let t = .6; t < 3.4; t += .5 + r() * .4) grunt(t, .7 + r() * .4);
  noise(KG.vista[1] - .15, .3, 2000, 6000, .06);                                                   // cut
  for (let t = KG.arrive[0]; t < KG.arrive[1]; t += .09) noise(t, .04, 600, 250, .04, 'lowpass');   // running feet
  for (let t = 3.8; t < 5.8; t += .45) grunt(t + r() * .1, .8 + r() * .5);
  noise(KG.orcs[2].at - .35, .35, 5000, 1500, .05); Chip.sfx.hit(ac, at(KG.orcs[2].at), out, { gain: .2 });                         // arrow
  Chip.sfx.laser(ac, at(KG.orcs[1].at - .35), out, { gain: .16, pitch: .6 }); noise(KG.orcs[1].at, .4, 1200, 300, .1, 'lowpass');  // magic
  Chip.sfx.hit(ac, at(KG.orcs[0].at), out, { gain: .25, pitch: .7 }); tone(KG.orcs[0].at, .15, 220, 90, .08, 'triangle');          // shield bash
  noise(KG.orcs[3].at - .12, .14, 3000, 8000, .08, 'highpass'); Chip.sfx.hit(ac, at(KG.orcs[3].at), out, { gain: .22 });           // slash
  KG.orcs.forEach(o => { if (o.at) { grunt(o.at + .05, 1.3); Chip.sfx.fall(ac, at(o.at + .1), out, { gain: .1 }); } });
  for (let t = KG.orcs[4].flee; t < KG.orcs[4].flee + 1.2; t += .14) noise(t, .04, 600, 250, .03, 'lowpass');
  Chip.sfx.powerup(ac, at(KG.cheer[0]), out, { gain: .2 }); [1047, 1319, 1568].forEach((f, i) => tone(8.25 + i * .12, .3, f, f, .03, 'triangle'));   // victory, the healer's hearts
  for (let t = KG.chief.peek; t < KG.chief.grab; t += .18) noise(t, .03, 500, 250, .025, 'lowpass');
  tone(KG.chief.grab, .5, 900, 1700, .06, 'sine'); tone(KG.chief.grab + .1, .4, 1300, 2000, .04, 'sine');                         // her cry
  [2637, 3520, 1760].forEach((f, i) => tone(KG.chief.rip + i * .06, .35, f, f * .7, .05, 'triangle'));                              // the pendant torn off
  for (let k = 0; k < 4; k++) tone(KG.chief.laugh + k * .2, .16, 110, 80, .07, 'sawtooth');                                          // the chief laughs
  { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = 220; g.gain.setValueAtTime(.0001, at(KG.chief.carry)); g.gain.linearRampToValueAtTime(.025, at(KG.chief.carry + .3)); g.gain.setValueAtTime(.025, at(KG.chief.gone - .5)); g.gain.linearRampToValueAtTime(.0001, at(KG.chief.gone)); o.connect(g).connect(out); o.start(at(KG.chief.carry)); o.stop(at(KG.chief.gone)); }   // the field's hum
  HITS.forEach(h => { tone(h, .35, 1800, 500, .06, 'triangle'); noise(h, .25, 4000, 1200, .07, 'bandpass', 2); });                      // each blow bounces off
  noise(RS.arrow - .35, .35, 5000, 1500, .05); noise(RS.volley - .35, .35, 5000, 1500, .05);
  Chip.sfx.laser(ac, at(RS.orb - .4), out, { gain: .14, pitch: .6 }); Chip.sfx.laser(ac, at(RS.volley - .25), out, { gain: .12, pitch: .7 });
  for (const [a, h] of [RS.hero, RS.knight]) { for (let t = a; t < h; t += .08) noise(t, .04, 600, 250, .04, 'lowpass'); Chip.sfx.hit(ac, at(h), out, { gain: .2, pitch: .6 }); Chip.sfx.fall(ac, at(h + .05), out, { gain: .08 }); }
  for (let t = KG.chief.carry; t < KG.chief.gone; t += .13) noise(t, .04, 600, 250, .035, 'lowpass');
  tone(KG.chief.grab + .1, .15, 1200, 1200, .05, 'square'); tone(KG.chief.grab + .25, .15, 1600, 1600, .05, 'square');             // "!"
  for (let t = KG.ronin.run[0]; t < KG.ronin.run[1]; t += .1) noise(t, .04, 700, 300, .04, 'lowpass');
  noise(KG.ronin.run[1], .3, 900, 200, .05, 'lowpass');                                                                              // he skids to a stop
  [0, .3, .6].forEach(d => tone(KG.ronin.dots + d, .06, 700, 700, .03, 'square'));
  [2093, 2637, 3136].forEach((f, i) => tone(KG.ronin.glint + i * .07, .5, f, f, .035, 'triangle'));
  tone(KG.heroSees, .12, 600, 900, .06, 'square'); tone(KG.heroSees + .14, .2, 900, 600, .06, 'square');
  Chip.sfx.select(ac, at(KG.thought[0]), out, { gain: .12 }); tone(KG.thought[0] + 1, .3, 300, 150, .08, 'sawtooth');
  KG.say.forEach(b => { const n = ACCENTS(b.s).length; for (let k = 0; k < n; k += 2) tone(b.at + k * (.45 / n), .03, b.who === 'hero' ? 900 : 600, b.who === 'hero' ? 800 : 520, .035, 'square'); });
  noise(KG.dash - .1, .3, 1500, 5000, .06, 'bandpass', 2);
  KG.clashes.forEach(clang);
  tone(KG.freeze + .05, 1.2, 55, 40, .2, 'sine'); noise(KG.freeze, .8, 300, 60, .1, 'lowpass');                                     // the freeze
  for (let k = 0; k < 13; k += 1) tone(KG.text + k * (1.2 / 13), .03, 1500 + (k % 3) * 120, 1300, .03, 'square');
  [523, 659, 784, 1047].forEach((f, i) => tone(KG.text + 1.4 + i * .1, .6, f, f, .035, 'triangle'));
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * KG_DUR), sr);
  kgAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
