// =====================================================================
// The Bamboo Dance — 20 s. The knight watches the pink-haired healer dance; it ends as a page of an adventure book.
// Reuses the palette, helpers and travelers of journey.js.
// =====================================================================
const DN_DUR = 20, DN_BPM = 90, DB_ = 60 / DN_BPM;                  // beat = .667 s
// ---------------------------------------------------------------- PLAN AS DATA
const DN = {
  book: 18 * DB_,                                                    // 12.0 s
  dissolve: .9,
  views: [
    { from: 0, size: 'wide' }, { from: 4 * DB_, size: 'close', x: 68, y: 236, pan: 5 }, { from: 8 * DB_, size: 'close', x: 6, y: 236, pan: 4 },
    { from: 10 * DB_, size: 'wide' }, { from: 16 * DB_, size: 'close', x: 40, y: 236, pan: 3 }, { from: 18 * DB_ - .45, size: 'wide' },
  ],
  knight: { x: 70 }, center: 138,
  hearts: [8.4 * DB_, 16.6 * DB_],
  lines: [                                                           // the book, one line every .75 s
    { s: 'MIL MISIONES,', scale: 3 }, { s: 'UNA AVENTURA,', scale: 3 }, { s: 'MUCHOS TESOROS,', scale: 3 },
    { s: 'PERO NADA', scale: 3 }, { s: 'SE COMPARA A LA', scale: 3 }, { s: 'VERDADERA', scale: 3 }, { s: 'ESENCIA DE AMAR', scale: 3, c: 31 },
  ],
  lineStart: 18 * DB_ + .7, lineEvery: .6,
  // choreography, one entry per beat, looping: pose, facing left?, hop height, spin?
  steps: [['dF', 0, 0], ['dU', 0, 4], ['dF', 1, 0], ['dU', 1, 4], ['dU', 0, 2, 1], ['dU', 0, 2, 1], ['dP', 1, 0], ['dU', 0, 8]],
};
const LANTERNS = [[58, 236], [214, 214], [176, 168], [26, 150]];

// ---------------------------------------------------------------- dance poses for the healer
const healerFront0 = KINDS.healer.front;
KINDS.healer.front = g => {
  healerFront0(g); const { R, X, torY, pose } = g;
  if (pose === 'dU') { R(X + 4, torY, 3, 3, 7); R(X + 6, torY - 4, 3, 5, 7); R(X + 7, torY - 7, 3, 3, 28); R(X - 6, torY, 3, 3, 7); R(X - 8, torY - 4, 3, 5, 7); R(X - 9, torY - 7, 3, 3, 28); }
  if (pose === 'dF') { R(X + 3, torY + 2, 7, 3, 7); R(X + 10, torY + 2, 2, 3, 28); R(X - 7, torY + 3, 4, 3, 7); R(X - 9, torY + 4, 2, 2, 28); }
  if (pose === 'dP') { R(X + 1, torY + 3, 4, 3, 7); R(X + 4, torY + 2, 2, 2, 28); }
};
const DSPR = {}, DL = {};
function buildDance() {
  for (const p of ['dU', 'dF', 'dP']) DSPR[p] = [0, 1, 2, 3].map(f => mkTraveler('healer', f, p));
  // bamboo: far, mid, near
  const stalk = (L, x, w, R, seed, top = 0) => {
    const r = Pixel.mulberry32(seed), lean = (r() - .5) * .05, seglen = 16 + r() * 10;
    for (let y = top; y < GROUND + 10; y++) { const cx = x + (GROUND - y) * lean, node = Math.floor(y / seglen) !== Math.floor((y + 1.5) / seglen); for (let i = 0; i < w; i++) lp(L, cx + i, y, node ? R[0] : R[Math.min(R.length - 1, 1 + Math.floor((1 - i / w) * (R.length - 1.01)))]); if (node && w > 4) { lp(L, cx - 1, y, R[1]); lp(L, cx + w, y, R[1]); } }
    if (w > 3) for (let k = 0; k < 9; k++) { const y = top + 20 + r() * 220, cx = x + (GROUND - y) * lean, dir = r() > .5 ? 1 : -1, len = 8 + r() * 12; for (let j = 0; j < 3; j++) { const a = (-.5 + j * .5) * dir - .2; for (let s = 2; s < len; s++) { lp(L, cx + (dir > 0 ? w : 0) + Math.cos(a) * s * dir, y + Math.sin(Math.abs(a)) * s * (j - 1) * .8 + s * .25, R[Math.min(R.length - 1, 1 + (s > len * .5 ? 1 : 2))]); } } }
  };
  let L = layer(540, PH), r = Pixel.mulberry32(5);
  for (let x = 4; x < 540; x += 7 + r() * 9) stalk(L, x, 2 + (r() > .6 ? 1 : 0), [14, 25, 25, 26], 100 + x);
  DL.far = L;
  L = layer(540, PH); r = Pixel.mulberry32(6);
  for (let x = 10; x < 540; x += 24 + r() * 26) stalk(L, x, 5 + Math.floor(r() * 3), [14, 15, 16, 17], 200 + x);
  DL.mid = L;
  L = layer(PW, PH);
  [[-4, 13], [18, 10], [238, 12], [258, 14], [42, 7], [222, 8]].forEach(([x, w], i) => stalk(L, x, w, [14, 16, 17, 18, 19], 300 + i));
  r = Pixel.mulberry32(7); for (let i = 0; i < 46; i++) { const side = r() > .5, x = side ? 190 + r() * 90 : r() * 80, y = r() * 90; for (let s = 0; s < 14; s++) { lp(L, x + s * (side ? -1 : 1) * .8, y + s * .7, s < 10 ? 17 : 18); lp(L, x + s * (side ? -1 : 1) * .8, y + s * .7 + 1, 16); } }
  DL.near = L;
  // ground: dark moss with a stone circle for the dance
  L = layer(PW, PH - GROUND); r = Pixel.mulberry32(8);
  for (let y = 0; y < L.h; y++) for (let x = 0; x < PW; x++) L.d[y * PW + x] = ramp([14, 15, 16], .35 + (hash(x, y, 9) - .5) * .5 + (y < 5 ? .3 : 0) - y / 400, x, y);
  for (let y = -15; y <= 15; y++) for (let x = -64; x <= 64; x++) { const d = (x / 64) ** 2 + (y / 15) ** 2; if (d > 1) continue; const ring = Math.abs(d - .55) < .05 || d > .9; lp(L, DN.center + x, 15 + y, ring ? 10 : ramp([10, 12, 13], .55 + (hash((x + 80) >> 3, (y + 20) >> 2, 3) - .5) * .5 - y / 60, x + 80, y + 20)); }
  for (let i = 0; i < 60; i++) { const x = r() * PW, y = r() * L.h; lp(L, x, y, 17); lp(L, x + 1, y, 16); }
  DL.ground = L;
  L = layer(40, 26); blob(L, 20, 16, 13, 77, RAMP.rockNear, { flat: .55 }); for (let i = 0; i < 6; i++) blob(L, 6 + i * 6, 20, 3, 80 + i, RAMP.leaf, { flat: .4 }); DL.rock = L;
}

// ---------------------------------------------------------------- pieces
function heart(x, y, s, c = 31) { const H = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']; H.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') scr.rect(x + (i - 3) * s, y + j * s, s, s, c); })); scr.rect(x - 2 * s, y + s, s, s, 36); }
function dancer(t) {
  const b = Math.floor(t / DB_), f = (t / DB_) - b, hold = t >= DN.book - .9 && t < DN.book + .6, st = hold ? ['dF', 1, 0] : DN.steps[b % 8];
  let [pose, left, hop, spin] = st;
  if (spin) left = cyc(t * 9, 2);
  const x = Math.round(DN.center + 10 * Math.sin(TAU * t / (4 * DB_)) * (hold ? 0 : 1)), y = FEET + 2 - Math.round(Math.sin(Math.min(1, f * 1.6) * Math.PI) * hop);
  shadow(x, FEET + 2, 9 - Math.round((FEET + 2 - y) / 3));
  const spr = DSPR[pose][cyc(t * 8, 4)];
  blit(spr, x - (left ? SW - 1 - SX : SX), y - SFY, !!left);
  // her spirit circles her and leaves a trail
  for (let k = 9; k >= 0; k--) { const tt = t - k * .045, fx = x + Math.cos(tt * 4.2) * 24, fy = y - 30 + Math.sin(tt * 4.2) * 9 + Math.sin(tt * 2) * 6; if (k) { scr.dither(1 - k / 10); scr.pset(fx, fy, k < 4 ? 40 : 36); scr.dither(); } else { scr.circ(fx, fy, 2, 40).pset(fx, fy, 42).pset(fx - 3, fy - 1, 6).pset(fx + 3, fy - 1, 6); } }
  if (spin) for (let k = 0; k < 8; k++) { const a = t * 6 + k * TAU / 8, rr = 16 + 6 * Math.sin(t * 9 + k); scr.pset(x + Math.cos(a) * rr, y - 22 + Math.sin(a) * rr * .45, k % 2 ? 42 : 36); }
  return x;
}
function sceneBamboo(t) {
  const px = scr.px, sway = Math.sin(t * .35) * 6;
  for (let y = 0; y < PH; y++) { const v = y / PH * 2.3; for (let x = 0; x < PW; x++) px[y * PW + x] = [14, 25, 26][Math.min(2, Math.floor(v + bay(x, y) - .25))]; }
  scr.dither(.45).circ(150, 92, 44, 26).dither(); scr.circ(150, 92, 34, 7).circ(150, 92, 31, 42).circ(141, 84, 5, 7).circ(158, 100, 7, 7).circ(162, 82, 3, 7);
  blitX(DL.far, 30 + sway * .3, 0);
  for (let k = 0; k < 2; k++) { scr.dither(.13 + .05 * Math.sin(t * 1.2 + k * 2)); scr.tri(150 - 20 + k * 22, 110, 150 + 4 + k * 22, 110, DN.center + 70 - k * 30, GROUND + 26, 5); scr.tri(150 - 20 + k * 22, 110, DN.center + 70 - k * 30, GROUND + 26, DN.center - 30 - k * 30, GROUND + 26, 5); scr.dither(); }
  blitX(DL.mid, 60 + sway * .6, 0);
  LANTERNS.forEach(([lx, ly], i) => { const sx = Math.round(lx + Math.sin(t * 1.3 + i * 2) * 2 - sway * .6); scr.line(sx, ly - 30, sx, ly - 7, 20); scr.dither(.3 + .08 * Math.sin(t * 9 + i)).circ(sx, ly, 15, 39).dither(); scr.elli(sx - 5, ly - 7, 11, 14, 39); scr.elli(sx - 3, ly - 5, 7, 10, 40); scr.rect(sx - 3, ly - 8, 7, 2, 20).rect(sx - 3, ly + 6, 7, 2, 20).rect(sx, ly + 8, 1, 4, 31); });
  blit(DL.ground, 0, GROUND);
  // the knight, seated on a rock, nodding on the beat
  const kx = DN.knight.x, f = (t / DB_) % 1, nod = f < .18 ? 1 : 0;
  shadow(kx, FEET + 2, 10); blit(SPR.knight.stand, kx - SX, FEET - SFY - 4 + nod); blit(DL.rock, kx - 22, FEET - 18);
  for (const h0 of DN.hearts) { const lt = t - h0; if (lt > 0 && lt < 1.5) { const s = lt < .15 ? 1 : 2; scr.dither(lt > 1.1 ? 1 - (lt - 1.1) / .4 : 1); heart(kx + 4 + Math.round(Math.sin(lt * 5) * 2), FEET - 74 - Math.round(lt * 14), s); scr.dither(); } }
  dancer(t);
  const r = Pixel.mulberry32(21);
  for (let i = 0; i < 22; i++) { const x = r() * PW + Math.sin(t * (.5 + r()) + i) * 12, y = 120 + r() * 300 + Math.cos(t * (.4 + r()) + i * 2) * 9, k = cyc(t * 3 + i * .7, 3); if (k) { scr.pset(x, y, 40); if (k === 1) scr.pset(x + 1, y, 19).pset(x - 1, y, 19).pset(x, y + 1, 19).pset(x, y - 1, 19); } }
  for (let i = 0; i < 26; i++) { const per = 4 + r() * 4, p = ((t + r() * per) % per) / per, x = r() * PW + Math.sin(p * 9 + i) * 12 + p * 20, y = p * (GROUND + 30) - 10, k = cyc(t * 5 + i, 3); scr.pset(x, y, 18); scr.pset(x + (k ? 1 : 0), y + (k === 2 ? 1 : 0), 17); if (!k) scr.pset(x + 2, y, 18); }
  blit(DL.near, Math.round(-sway * 1.2), 0);
}
const ILLU = { x: 45, y: 52, w: 180, h: 146, sx: 44, sy: FEET - 128 };   // illustration box on the page, and where it looks in the scene
const illuBuf = new Uint8Array(ILLU.w * ILLU.h);
function sceneBook(t) {
  const lt = t - DN.book;
  sceneBamboo(t);                                                    // the scene lives on as the illustration
  for (let y = 0; y < ILLU.h; y++) illuBuf.set(scr.px.subarray((ILLU.sy + y) * PW + ILLU.sx, (ILLU.sy + y) * PW + ILLU.sx + ILLU.w), y * ILLU.w);
  scr.reset();
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) scr.px[y * PW + x] = ((y >> 4) + ((x + (y >> 4) * 37) >> 6)) % 2 ? 21 : (x % 64 === 0 ? 20 : 21);   // table
  scr.rect(10, 16, 250, 452, 20).rect(12, 18, 246, 448, 32).rect(14, 20, 242, 444, 31).rect(14, 20, 242, 2, 36).rect(18, 24, 234, 436, 32);
  for (const [cx, cy] of [[16, 22], [246, 22], [16, 456], [246, 456]]) scr.rect(cx, cy, 8, 6, 35).rect(cx + 2, cy + 2, 4, 2, 41);
  for (let i = 0; i < 8; i++) { scr.rect(22 + i, 28 + i, 222, 426, i % 2 ? 23 : 24); }                               // the stack of pages
  scr.rect(22, 28, 218, 422, 41);
  for (let y = 28; y < 450; y++) for (let x = 22; x < 240; x++) { const e = Math.min(x - 22, 239 - x, y - 28, 449 - y); if ((e < 10 && bay(x, y) > e / 10) || hash(x >> 1, y >> 1, 4) > .985) scr.px[y * PW + x] = 24; }
  // illustration, framed
  scr.rect(ILLU.x - 4, ILLU.y - 4, ILLU.w + 8, ILLU.h + 8, 21).rect(ILLU.x - 3, ILLU.y - 3, ILLU.w + 6, ILLU.h + 6, 35).rect(ILLU.x - 1, ILLU.y - 1, ILLU.w + 2, ILLU.h + 2, 20);
  for (let y = 0; y < ILLU.h; y++) scr.px.set(illuBuf.subarray(y * ILLU.w, (y + 1) * ILLU.w), (ILLU.y + y) * PW + ILLU.x);
  for (const [cx, cy] of [[ILLU.x - 5, ILLU.y - 5], [ILLU.x + ILLU.w - 1, ILLU.y - 5], [ILLU.x - 5, ILLU.y + ILLU.h - 1], [ILLU.x + ILLU.w - 1, ILLU.y + ILLU.h - 1]]) scr.rect(cx, cy, 6, 6, 35).rect(cx + 2, cy + 2, 2, 2, 31);
  // the words, written line by line
  let y = 214;
  DN.lines.forEach((ln, i) => {
    const a = seg(t, DN.lineStart + i * DN.lineEvery, DN.lineStart + i * DN.lineEvery + .45), n = Math.ceil(ln.s.length * a);
    if (i === 6) y += 4;
    if (a > 0) { const w = Pixel.textWidth(ln.s, ln.scale); scr.text(Math.round(131 - w / 2), y, ln.s.slice(0, n), ln.c ?? 20, { scale: ln.scale }); if (a < 1) scr.rect(Math.round(131 - w / 2) + Pixel.textWidth(ln.s.slice(0, n), ln.scale) + 2, y, 2, 5 * ln.scale, 31); }
    y += 22;
  });
  const hs = seg(t, DN.lineStart + 7 * DN.lineEvery, DN.lineStart + 7 * DN.lineEvery + .3);
  if (hs > 0) { const beat = ((t / DB_) % 1) < .2 ? 4 : 3; heart(131, 392 - (beat - 3) * 2, beat); scr.rect(64, 402, 44, 1, 21).rect(154, 402, 44, 1, 21).rect(106, 401, 3, 3, 35).rect(153, 401, 3, 3, 35); }
  scr.text(131, 432, '- 77 -', 22, { align: 'center' });
  // ribbon bookmark and dust in the light
  for (let j = 0; j < 96; j++) { const x = 229 + Math.round(Math.sin(j * .07 + t * 1.5) * (j / 60)); scr.rect(x, 22 + j, 8, 1, j % 9 === 8 ? 32 : 31); scr.pset(x + 7, 22 + j, 32); }
  scr.tri(229, 118, 237, 118, 233, 112, 41);
  const r = Pixel.mulberry32(31); for (let i = 0; i < 14; i++) { const per = 3 + r() * 3, p = ((t + r() * per) % per) / per; if (cyc(t * 4 + i, 3)) scr.pset(30 + r() * 200 + Math.sin(p * 6 + i) * 6, 440 - p * 400, 40); }
}

// ---------------------------------------------------------------- frame
const dnA = new Uint8Array(PW * PH);
function dnDraw(t, ctx) {
  scr.reset();
  const d0 = DN.book - DN.dissolve / 2, d1 = DN.book + DN.dissolve / 2;
  if (t < d0) sceneBamboo(t);
  else if (t >= d1) sceneBook(t);
  else { sceneBamboo(t); dnA.set(scr.px); sceneBook(t); const p = (t - d0) / DN.dissolve, px = scr.px; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (p <= B8(x >> 1, y >> 1)) px[y * PW + x] = dnA[y * PW + x]; }
  const c = scr.render({ palette: PALETTE }), i = DN.views.findLastIndex(v => t >= v.from), v = DN.views[i];
  ctx.imageSmoothingEnabled = false;
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, 0, 0, W, H);
  else { const end = DN.views[i + 1].from, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, 0, 0, W, H); }
}

// ---------------------------------------------------------------- score: a soft music-box waltz of a tune, no drums
const DNP = `T${DN_BPM} @ENV3 { 45, 6, 0 } @ENV4 { 127, 70, 70 } @ENV5 { 100, 14, 35 } @VIB1 { 30, 14, 20 } @ENV0 @VIB0`;
const DN_TRACKS = [
  { gain: .32, mml: 'O2 L2 Q92 @0 F>C< | A>E< | B->F< | C G | D A | <B->F | C G | F2' },
  { gain: .26, mml: '@0 O5 L8 Q92 @ENV4 @VIB1 A4 >C4< A8 G8 F4 | E4 A4 >C8< B8 A4 | D4 F4 B-8 A8 G4 | E4 G4 >C4< G4 | F4. E8 D2 | D4 F4 B-2 | >C4< B-4 A4 G4 | F2' },
  { gain: .15, pan: -.25, mml: '@2 O4 L8 V70 Q85 @ENV5 FA>C<A FA>C<A | A>CEC< A>CEC< | <B->DFD <B->DFD | CEGE CEGE | DFAF DFAF | <B->DFD <B->DFD | CEGE CEGE | FA>C<A' },
  { gain: .12, pan: .3, mml: '@3 @ENV3 O7 L8 Q100 [R8 C8]30' },
];
function dnAudio(ac, out, t0 = 0) {
  Chip.play(ac, t0, out, DN_TRACKS, { prefix: DNP });
  DN.hearts.forEach((h, i) => Chip.sfx.coin(ac, t0 + h, out, { gain: .16, seed: i + 1 }));
  Chip.sfx.powerup(ac, t0 + DN.book - .1, out, { gain: .14 });
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * DN_DUR), sr);
  dnAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
