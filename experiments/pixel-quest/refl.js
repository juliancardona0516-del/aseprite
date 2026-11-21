// =====================================================================
// The Reflection — 22.5 s. The red-haired hero sits by a waterfall; his reflection shows who he could become:
// taller, in shining blue armour, with an emerald sword. Ends as a book page. Sound effects only (no music).
// Reuses journey.js.
// =====================================================================
const RF_DUR = 22.5, POOL = GROUND + 10, FALL = { x0: 104, x1: 262, top: 70 }, RFEET = GROUND + 2;
// ---------------------------------------------------------------- PLAN AS DATA
const RF = {
  hero: { x: 62 }, refl: { x: 180, feet: POOL - 6, scale: 2 },
  think: 3.3, shimmer: 6.0, change: [6.5, 7.8], notice: 7.9, rise: 11.7, raise: 13.3, book: 15.2, dissolve: .9,
  views: [
    { from: 0, size: 'wide' }, { from: 3, size: 'close', x: 6, y: 236, pan: 3 }, { from: 5.5, size: 'wide' },
    { from: 8.5, size: 'close', x: 112, y: 200, pan: 3 }, { from: 11.5, size: 'close', x: 6, y: 232, pan: 3 }, { from: 13, size: 'wide' },
  ],
  lines: [{ s: '<<FIJARSE METAS', c: 20 }, { s: 'ES EL SECRETO', c: 20 }, { s: 'PARA UN FUTURO', c: 20 }, { s: 'GRANDIOSO>>', c: 31 }],
  author: '- TONY ROBBINS -', lineStart: 16.1, lineEvery: .7,
};

// ---------------------------------------------------------------- the future self
KINDS.heroF = {
  leg: 10, tor: 12, wide: true, body: 2, bodyShade: 1, belt: 35, legC: 2, legShade: 1, boot: 13, bootShade: 12, sleeve: 3, eye: 1,
  back(g) { const { R, X, torY, tor, sway } = g; R(X - 10, torY + 1, 6, tor + 7, 6); R(X - 10, torY + 1, 2, tor + 7, 7); R(X - 10 - sway, torY + tor + 8, 6, 2, 7); },
  hair(g) { KINDS.hero.hair(g); },
  front(g) {
    const { P, R, X, torY, pose } = g;
    R(X - 1, torY + 5, 3, 1, 35); R(X, torY + 4, 1, 3, 35); R(X - 4, torY + 2, 2, 8, 3); R(X - 4, torY + 2, 2, 1, 4);                 // crest and a highlight on the plate
    R(X - 7, torY - 1, 6, 4, 3); R(X - 7, torY - 1, 6, 1, 4); R(X - 7, torY + 2, 6, 1, 1); R(X + 2, torY - 1, 5, 4, 3); R(X + 2, torY - 1, 5, 1, 4);   // pauldrons
    if (pose === 'cheer') {
      R(X + 3, torY - 1, 3, 3, 3); R(X + 5, torY - 4, 3, 4, 3); R(X + 7, torY - 7, 3, 4, 3); R(X + 7, torY - 9, 3, 2, 13);
      R(X + 5, torY - 11, 7, 1, 35); P(X + 8, torY - 10, 21); R(X + 7, torY - 29, 3, 18, 17); R(X + 8, torY - 28, 1, 16, 19); P(X + 8, torY - 30, 18); P(X + 8, torY - 11, 38);
    } else { R(X + 4, torY + 8, 7, 1, 35); R(X + 7, torY + 5, 1, 3, 21); R(X + 6, torY + 9, 3, 13, 17); R(X + 7, torY + 9, 1, 13, 19); P(X + 7, torY + 22, 18); R(X + 6, torY + 6, 3, 2, 13); P(X + 7, torY + 8, 38); }
  },
};
const RL = {};
function buildRefl() {
  RL.future = { stand: mkTraveler('heroF', 0, 'stand'), cheer: mkTraveler('heroF', 0, 'cheer') };
  const L = layer(PW, PH), r = Pixel.mulberry32(81);
  const lip = x => Math.round(FALL.top + (vnoise(x * .05, 0, 82) - .5) * 26 + (x > FALL.x0 && x < FALL.x1 ? 4 : 0));
  // the cliff
  for (let x = 0; x < PW; x++) {
    const t0 = lip(x), wet = x > FALL.x0 - 6 && x < FALL.x1 + 6;
    for (let y = t0; y < PH; y++) { const shelf = Math.floor((y + vnoise(x * .08, 1, 83) * 14) / 20); let v = .3 + vnoise(x * .12, shelf * 3.1, 83) * .55 - (y - t0) / 900; if (((y + Math.round(vnoise(x * .08, 1, 83) * 14)) % 20) === 0) v -= .3; L.d[y * PW + x] = ramp(wet ? [11, 11, 10, 12] : RAMP.rockNear, v, x, y); }
  }
  // trees and bushes along the top, vines and ferns on the wall
  for (let i = 0; i < 26; i++) { const x = r() * PW; if (x > FALL.x0 + 8 && x < FALL.x1 - 8) continue; blob(L, x, lip(x) - 4 - r() * 14, 10 + r() * 12, 800 + i, RAMP.leaf, { spark: true }); }
  for (let i = 0; i < 9; i++) { const x = r() * PW; if (x > FALL.x0 - 4 && x < FALL.x1 + 4) continue; const tb = lip(x) - 6, h = 24 + r() * 28; lr(L, Math.round(x), Math.round(tb - h), 3, Math.round(h), 21); blob(L, x + 1, tb - h - 4, 12 + r() * 8, 840 + i, RAMP.leaf, { spark: true }); }
  for (let i = 0; i < 22; i++) { const x = r() * (FALL.x0 - 8), len = 30 + r() * 110, y0 = lip(x) + 4; for (let y = 0; y < len; y++) { lp(L, x + Math.sin(y * .08 + i) * 2, y0 + y, y % 5 ? 15 : 16); if (y % 9 === 0) { lp(L, x + Math.sin(y * .08 + i) * 2 + 1, y0 + y, 17); lp(L, x + Math.sin(y * .08 + i) * 2 - 1, y0 + y + 1, 17); } } }
  for (let i = 0; i < 12; i++) blob(L, r() * (FALL.x0 - 10), 150 + r() * 210, 4 + r() * 6, 860 + i, RAMP.leaf, { flat: .4, spark: true });
  for (let y = FALL.top + 6; y < POOL; y++) { for (const [x, c] of [[FALL.x0 - 1, 11], [FALL.x0 - 2, 10], [FALL.x1 + 1, 11], [FALL.x1 + 2, 10]]) lp(L, x + Math.round(Math.sin(y * .1) * 1.2), y, c); }
  // the bank where he sits
  for (let y = GROUND - 2; y < PH; y++) { const lim = 100 + Math.sin(y * .2) * 3 - Math.max(0, y - POOL) * .1; for (let x = 0; x < lim; x++) { const d = y - (GROUND - 2); L.d[y * PW + x] = d < 6 ? ramp([16, 17, 18], .55 + (hash(x, y, 5) - .5) * .7 + (d < 2 ? .25 : 0), x, y) : ramp([20, 21, 22], .5 + (vnoise(x * .2, y * .3, 6) - .5) * .7 - (lim - x < 3 ? .3 : 0), x, y); } }
  for (let x = 0; x < 98; x += 3) { lp(L, x, GROUND - 3, 18); if (r() > .5) lp(L, x + 1, GROUND - 4, 17); }
  for (let i = 0; i < 10; i++) { const x = r() * 92, c = [36, 35, 6][i % 3]; lp(L, x, GROUND - 4, c); lp(L, x, GROUND - 3, 16); }
  RL.bg = L;
  let R1 = layer(44, 30); blob(R1, 22, 20, 15, 87, RAMP.rockNear, { flat: .5 }); for (let i = 0; i < 6; i++) blob(R1, 5 + i * 7, 25, 3, 88 + i, RAMP.leaf, { flat: .4 }); RL.rock = R1;
  R1 = layer(PW, 60); const r2 = Pixel.mulberry32(89);
  for (let i = 0; i < 7; i++) { const x = 110 + r2() * 150; blob(R1, x, 44 + r2() * 12, 6 + r2() * 8, 890 + i, RAMP.rockNear, { flat: .5 }); }
  for (let i = 0; i < 26; i++) { const x = i < 12 ? r2() * 80 : 200 + r2() * 70, h = 20 + r2() * 30, lean = (r2() - .5) * .25; for (let s = 0; s < h; s++) lp(R1, x + s * lean, 59 - s, s % 4 ? 16 : 17); }
  RL.front = R1;
}

// ---------------------------------------------------------------- water
function fallNoise(x, y, t) { return vnoise(x * .45, (y - t * 150) * .035, 5); }
function waterfall(t, calm) {
  const px = scr.px, R = RF.refl;
  for (let y = FALL.top; y < POOL; y++) for (let x = FALL.x0; x <= FALL.x1; x++) {
    if (y < FALL.top + 8 + Math.round(Math.sin(x * .4) * 2)) continue;
    const n = fallNoise(x, y, t), mirror = calm * Math.max(0, 1 - (((x - R.x) / 62) ** 2 + ((y - (R.feet - 60)) / 96) ** 2));       // a calmer sheet where the reflection lives
    const k = n - mirror * .22;
    px[y * PW + x] = k > .74 ? 6 : k > .6 ? 5 : k > .44 ? 4 : mirror > .25 && bay(x, y) < mirror * .7 ? 2 : 3;
  }
  for (let x = FALL.x0 - 2; x <= FALL.x1 + 2; x++) { const y = FALL.top + 6 + Math.round(Math.sin(x * .4) * 2); scr.rect(x, y, 1, 3, cyc(x * .3 + t * 6, 3) ? 6 : 5); }
}
function pool(t) {
  const px = scr.px;
  for (let y = POOL; y < PH; y++) { const d = (y - POOL) / (PH - POOL); for (let x = 0; x < PW; x++) { if (RL.bg.d[y * PW + x] !== 255 && x < 100 - Math.max(0, y - POOL) * .1 + Math.sin(y * .2) * 3) continue; let c = ramp([1, 2, 3, 3], 1 - d * 1.1, x, y); const n = vnoise(x * .06 + t * .6, y * .35 - t * .3, 3); if (n > .68 && (y + Math.floor(n * 20)) % 5 === 0) c = 4; if (hash(x >> 1, y >> 1, Math.floor(t * 5)) > .996) c = 6; if (y - POOL < 2) c = 6; px[y * PW + x] = c; } }
}
function mist(t) { for (let k = 0; k < 9; k++) { const p = ((t * .35 + k / 9) % 1), x = FALL.x0 + 6 + (k * 53 % (FALL.x1 - FALL.x0 - 12)), y = POOL - 2 - p * 34, w = 22 + p * 26; scr.dither((1 - p) * .7); scr.elli(x - w / 2, y - 6, w, 12 + p * 6, k % 2 ? 6 : 7); scr.dither(); } const r = Pixel.mulberry32(91); for (let i = 0; i < 30; i++) { const per = .7 + r() * .9, p = ((t + r() * per) % per) / per, x = FALL.x0 + r() * (FALL.x1 - FALL.x0) + (r() - .5) * 30 * p, y = POOL - p * (20 + r() * 40) + 60 * p * p; scr.pset(x, y, i % 3 ? 6 : 27); } }
// a sprite mirrored into the water sheet: scaled, rippling, dithered, with an optional glint
function reflect(S, cx, feetY, sc, t, alpha, o = {}) {
  if (alpha <= 0) return; const px = scr.px, x0 = Math.round(cx - (SW - 1 - SX) * sc), y0 = Math.round(feetY - SFY * sc);
  for (let dy = 0; dy < S.h * sc; dy++) { const Y = y0 + dy; if (Y < 0 || Y >= PH) continue; const wob = Math.round(Math.sin(Y * .11 + t * 3.2) * 1.6 + Math.sin(Y * .37 - t * 5) * .7);
    for (let dx = 0; dx < S.w * sc; dx++) { const X = x0 + dx + wob; if (X < FALL.x0 || X > FALL.x1) continue; let c = S.d[Math.floor(dy / sc) * S.w + (S.w - 1 - Math.floor(dx / sc))]; if (c === 255) continue; if (alpha < 1 && B8(X, Y) >= alpha) continue; if (o.glint !== undefined && c !== 30 && Math.abs(dx + dy * .6 - o.glint) < 5) c = 42; px[Y * PW + X] = c; } }
}
function fheart() {}
function rmark(x, y, ch, t0, t, c = 40, dur = 1.2) { const lt = t - t0; if (lt < 0 || lt > dur) return; scr.text(x, y + Math.round(Math.max(0, 1 - lt * 6) * 6), ch, c, { scale: 2, align: 'center', outline: 30 }); }

// ---------------------------------------------------------------- scene
function sceneFall(t) {
  const px = scr.px, R = RF.refl;
  sky();
  for (let k = 0; k < 4; k++) { scr.dither(.14 + .05 * Math.sin(t * 1.1 + k)); scr.tri(-10 + k * 46, 0, 26 + k * 46, 0, 150 + k * 60, FALL.top + 40, 5); scr.dither(); }
  for (let i = 0; i < 3; i++) { const x = ((i * 120 + t * (3 + i)) % 380) - 60, y = 16 + i * 14; scr.elli(x, y, 56, 10, 6); scr.elli(x + 12, y - 5, 30, 10, 6); }
  birds(t, -30, 40, 3, 16);
  blit(RL.bg, 0, 0);
  const ch = seg(t, RF.change[0], RF.change[1]), glow = seg(t, RF.shimmer, RF.change[1]);
  waterfall(t, .6 + glow * .4);
  // aura behind the future self, then the reflection, then water falling over it
  if (ch > 0) { const pulse = .5 + .5 * Math.sin(t * 3), burst = t >= RF.raise ? seg(t, RF.raise, RF.raise + .3) * (1 - seg(t, RF.raise + .3, RF.raise + 1.2)) : 0; scr.dither((.14 + pulse * .08 + burst * .4) * ch); scr.elli(R.x - 44 - burst * 14, R.feet - 128 - burst * 14, 88 + burst * 28, 136 + burst * 20, 38); scr.dither((.2 + pulse * .08) * ch).elli(R.x - 30, R.feet - 112, 60, 110, 27).dither(); }
  const raised = t >= RF.raise; if (ch > 0) { scr.dither((.22 + .12 * Math.sin(t * 5)) * ch).circ(R.x - (raised ? 16 : 14), R.feet - (raised ? 84 : 16), raised ? 15 : 11, 19).dither(); }
  const sweep = ch >= 1 ? ((t - RF.change[1]) % 2.2) / 2.2 * 260 - 20 : undefined;
  reflect(SPR.hero.stand, R.x, R.feet - 6, 2, t, .5 * (1 - ch));
  reflect(raised ? RL.future.cheer : RL.future.stand, R.x, R.feet, R.scale, t, ch * .92, { glint: sweep });
  for (let y = R.feet - 120; y < POOL; y++) for (let x = R.x - 56; x <= R.x + 56; x++) { if (x < FALL.x0 || x > FALL.x1) continue; const n = fallNoise(x, y, t); if (n > .8) px[y * PW + x] = 6; else if (n > .74 && bay(x, y) > .5) px[y * PW + x] = 5; }
  if (ch > 0) {
    const r = Pixel.mulberry32(92); for (let i = 0; i < 18; i++) { const per = 1.2 + r() * 1.2, p = ((t + r() * per) % per) / per, x = R.x - 48 + r() * 96, y = R.feet - 10 - p * 120, k = cyc(t * 6 + i, 3); if (k && ch > .5) { scr.pset(x, y, i % 2 ? 42 : 38); if (k === 1) scr.pset(x + 1, y, 42).pset(x - 1, y, 42).pset(x, y + 1, 42).pset(x, y - 1, 42); } }
  }
  if (t >= RF.shimmer && t < RF.change[1] + .3) for (let k = 0; k < 3; k++) { const lt = t - RF.shimmer - k * .35; if (lt > 0 && lt < 1) { scr.dither(1 - lt); scr.ellib(R.x - lt * 70, R.feet - 60 - lt * 90, lt * 140, lt * 180, 42); scr.dither(); } }
  scr.clip(222, POOL - 70, 48, 70); for (let k = 0; k < 5; k++) { scr.dither(.3); scr.ellib(214 - k * 2, POOL - 52 + k * 2, 80 + k * 4, 110, [31, 39, 40, 17, 3][k]); scr.dither(); } scr.clip();   // a faint rainbow in the spray
  pool(t); mist(t);
  // the hero: seated on his rock, then up on his feet, then sword high
  const hx = RF.hero.x, up = seg(t, RF.rise, RF.rise + .35), hop = t >= RF.rise && t < RF.rise + .35 ? Math.round(Math.sin(up * Math.PI) * 8) : 0, jolt = t >= RF.notice && t < RF.notice + .3 ? Math.round(Math.sin((t - RF.notice) / .3 * Math.PI) * 3) : 0;
  const hy = RFEET + 5 - Math.round(up * 15) - hop - jolt, spr = t >= RF.raise ? SPR.hero.cheer : SPR.hero.stand;
  shadow(hx, RFEET, 9);
  if (up < 1) { blit(spr, hx - SX, hy - SFY); blit(RL.rock, hx - 22, RFEET - 18); } else { blit(RL.rock, hx - 22, RFEET - 18); blit(spr, hx - SX, hy - SFY); }
  if (t >= RF.think && t < RF.shimmer) { const n = 1 + cyc((t - RF.think) * 2.5, 3); scr.text(hx + 2, hy - 64, '.'.repeat(n), 6, { scale: 2, align: 'center', outline: 30 }); }
  rmark(hx + 2, hy - 70, '!', RF.notice, t);
  if (t >= RF.raise) { const k = cyc((t - RF.raise) * 10, 6), gx = hx + 7, gy = hy - 46; if (k < 3) { scr.pset(gx, gy, 42); for (let d = 1; d <= 3 - k; d++) scr.pset(gx + d, gy, 42).pset(gx - d, gy, 42).pset(gx, gy + d, 42).pset(gx, gy - d, 42); } }
  const r3 = Pixel.mulberry32(93); for (let i = 0; i < 12; i++) { const per = 4 + r3() * 4, p = ((t + r3() * per) % per) / per, x = r3() * 100 + Math.sin(p * 9 + i) * 10 + p * 16, y = 90 + p * (GROUND - 80), k = cyc(t * 5 + i, 3); scr.pset(x, y, 18); scr.pset(x + (k ? 1 : 0), y + (k === 2 ? 1 : 0), 17); }
  blit(RL.front, 0, PH - 60);
}

// ---------------------------------------------------------------- the book
const RI = { x: 45, y: 46, w: 180, h: 200, sx: 34, sy: RFEET - 184 }, riBuf = new Uint8Array(180 * 200);
function sceneBookR(t) {
  sceneFall(t);
  for (let y = 0; y < RI.h; y++) riBuf.set(scr.px.subarray((RI.sy + y) * PW + RI.sx, (RI.sy + y) * PW + RI.sx + RI.w), y * RI.w);
  scr.reset();
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) scr.px[y * PW + x] = (x % 64 === 0 || y % 16 === 0) ? 20 : 21;
  scr.rect(10, 16, 250, 452, 20).rect(12, 18, 246, 448, 32).rect(14, 20, 242, 444, 31).rect(14, 20, 242, 2, 36).rect(18, 24, 234, 436, 32);
  for (const [cx, cy] of [[16, 22], [246, 22], [16, 456], [246, 456]]) scr.rect(cx, cy, 8, 6, 35).rect(cx + 2, cy + 2, 4, 2, 41);
  for (let i = 0; i < 8; i++) scr.rect(22 + i, 28 + i, 222, 426, i % 2 ? 23 : 24);
  scr.rect(22, 28, 218, 422, 41);
  for (let y = 28; y < 450; y++) for (let x = 22; x < 240; x++) { const e = Math.min(x - 22, 239 - x, y - 28, 449 - y); if ((e < 10 && bay(x, y) > e / 10) || hash(x >> 1, y >> 1, 4) > .985) scr.px[y * PW + x] = 24; }
  scr.rect(RI.x - 4, RI.y - 4, RI.w + 8, RI.h + 8, 21).rect(RI.x - 3, RI.y - 3, RI.w + 6, RI.h + 6, 35).rect(RI.x - 1, RI.y - 1, RI.w + 2, RI.h + 2, 20);
  for (let y = 0; y < RI.h; y++) scr.px.set(riBuf.subarray(y * RI.w, (y + 1) * RI.w), (RI.y + y) * PW + RI.x);
  for (const [cx, cy] of [[RI.x - 5, RI.y - 5], [RI.x + RI.w - 1, RI.y - 5], [RI.x - 5, RI.y + RI.h - 1], [RI.x + RI.w - 1, RI.y + RI.h - 1]]) scr.rect(cx, cy, 6, 6, 35).rect(cx + 2, cy + 2, 2, 2, 31);
  let y = 268;
  RF.lines.forEach((ln, i) => {
    const a = seg(t, RF.lineStart + i * RF.lineEvery, RF.lineStart + i * RF.lineEvery + .5), n = Math.ceil(ln.s.length * a);
    if (a > 0) { const w = Pixel.textWidth(ln.s, 3), x0 = Math.round(131 - w / 2); scr.text(x0, y, ln.s.slice(0, n), ln.c, { scale: 3 }); if (a < 1) scr.rect(x0 + Pixel.textWidth(ln.s.slice(0, n), 3) + 2, y, 2, 15, 31); }
    y += 24;
  });
  const ta = RF.lineStart + 4 * RF.lineEvery + .3, aa = seg(t, ta, ta + .5);
  if (aa > 0) { scr.dither(aa); scr.text(131, 376, RF.author, 22, { scale: 2, align: 'center' }); scr.dither(); }
  if (aa >= 1) { const k = cyc(t * 3, 2), sx = 131, sy = 406; scr.rect(sx - 1, sy - 7 - k, 3, 15 + k * 2, 35).rect(sx - 7 - k, sy - 1, 15 + k * 2, 3, 35).rect(sx - 3, sy - 3, 7, 7, 40).rect(sx - 1, sy - 1, 3, 3, 42); scr.rect(64, 406, 44, 1, 21).rect(154, 406, 44, 1, 21); }
  scr.text(131, 436, '- 148 -', 22, { align: 'center' });
  for (let j = 0; j < 96; j++) { const x = 229 + Math.round(Math.sin(j * .07 + t * 1.5) * (j / 60)); scr.rect(x, 22 + j, 8, 1, j % 9 === 8 ? 32 : 31); scr.pset(x + 7, 22 + j, 32); }
  scr.tri(229, 118, 237, 118, 233, 112, 41);
}

// ---------------------------------------------------------------- frame
const rfA = new Uint8Array(PW * PH);
function rfDraw(t, ctx) {
  scr.reset();
  const d0 = RF.book - RF.dissolve / 2, d1 = RF.book + RF.dissolve / 2;
  if (t < d0) sceneFall(t); else if (t >= d1) sceneBookR(t);
  else { sceneFall(t); rfA.set(scr.px); sceneBookR(t); const p = (t - d0) / RF.dissolve, px = scr.px; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (p <= B8(x >> 1, y >> 1)) px[y * PW + x] = rfA[y * PW + x]; }
  if (t >= RF.change[1] - .05 && t < RF.change[1] + 2 / 30) { const px = scr.px; for (let k = 0; k < px.length; k++) if (bay(k % PW, (k / PW) | 0) > .6) px[k] = 42; }
  const c = scr.render({ palette: PALETTE }), wideBook = t >= d0, i = RF.views.findLastIndex(v => t >= v.from), v = wideBook ? { size: 'wide' } : RF.views[i];
  ctx.imageSmoothingEnabled = false;
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, 0, 0, W, H);
  else { const end = RF.views[i + 1] ? RF.views[i + 1].from : RF.book, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, 0, 0, W, H); }
}

// ---------------------------------------------------------------- sound effects only
function rfAudio(ac, out, t0 = 0) {
  const at = x => t0 + x, r = Pixel.mulberry32(37);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.05, dur * .3))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'square', vib = 0) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = vib; lg.gain.value = f0 * .04; l.connect(lg).connect(o.frequency); l.start(at(t)); l.stop(at(t + dur)); } g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .02)); g.gain.setValueAtTime(gain, at(t + dur * .5)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  // the waterfall: a low roar and a higher hiss, fading out as the book comes in
  for (const [fq, q, gain, type] of [[380, .5, .06, 'lowpass'], [2600, .7, .022, 'bandpass']]) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.frequency.value = fq; f.Q.value = q; g.gain.setValueAtTime(gain, at(0)); g.gain.setValueAtTime(gain, at(RF.book - .4)); g.gain.linearRampToValueAtTime(gain * .25, at(RF.book + .6)); s.connect(f).connect(g).connect(out); s.start(at(0), r()); s.stop(at(RF_DUR)); }
  const chirp = t => { tone(t, .07, 2600, 3600, .04, 'square'); tone(t + .1, .06, 3000, 3900, .035, 'square'); };
  [.7, 1.9, 4.4, 12.2].forEach(chirp);
  noise(RF.think, .7, 900, 350, .05, 'lowpass');                                                                    // a sigh
  const shimmer = (t, g = .05) => [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(t + i * .08, .3, f, f, g, 'triangle'));
  shimmer(RF.shimmer); shimmer(RF.change[0] + .3, .06);
  tone(RF.change[0], RF.change[1] - RF.change[0] + .2, 90, 220, .12, 'triangle', 9); noise(RF.change[0], 1.3, 500, 4000, .06);   // power rising
  Chip.sfx.powerup(ac, at(RF.change[1]), out, { gain: .26 }); Chip.sfx.blip(ac, at(RF.notice), out, { gain: .2, pitch: 1.6 });
  for (let t = RF.change[1] + .4; t < RF.book; t += 2.2) { tone(t, .1, 3200, 5200, .04, 'triangle'); tone(t + .12, .18, 5000, 5200, .025, 'sine'); }   // the glint on the armour
  tone(RF.change[1] + .1, RF.book - RF.change[1] - .3, 110, 110, .028, 'triangle', 5);                              // the emerald's hum
  Chip.sfx.jump(ac, at(RF.rise), out, { gain: .22 }); Chip.sfx.land(ac, at(RF.rise + .35), out, { gain: .18 });
  tone(RF.raise, .25, 2400, 5200, .08, 'triangle'); tone(RF.raise + .06, .35, 4800, 5000, .035, 'sine'); Chip.sfx.powerup(ac, at(RF.raise + .1), out, { gain: .2, pitch: 1.25 }); shimmer(RF.raise + .35, .05);
  noise(RF.book - .3, .45, 3500, 900, .12); Chip.sfx.select(ac, at(RF.book + .15), out, { gain: .12 });
  RF.lines.forEach((ln, i) => { for (let k = 0; k < ln.s.length; k += 2) tone(RF.lineStart + i * RF.lineEvery + k * (.5 / ln.s.length), .025, 1500 + (k % 3) * 120, 1300, .03, 'square'); });
  shimmer(RF.lineStart + 4 * RF.lineEvery + .8, .045);
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * RF_DUR), sr);
  rfAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
