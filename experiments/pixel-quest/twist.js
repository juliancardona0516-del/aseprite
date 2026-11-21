// =====================================================================
// A Quiet Evening — 18 s scene with a twist. Reuses the world and the five travelers of journey.js.
// =====================================================================
const TW_DUR = 18;
// ---------------------------------------------------------------- PLAN AS DATA
const TW = {
  twist: 7.2, spark: 6.0, runners: 8.8, mob: 10.0, flee: 11.2, chase: 12.0, card: 16.4,
  views: [                                                          // wide = 270x480 at x4, close = 135x240 window at x8
    { from: 0, size: 'wide' }, { from: 2.4, size: 'close', x: 22, y: 172, pan: 6 }, { from: 4.8, size: 'wide' }, { from: 9.2, size: 'close', x: 128, y: 232, pan: 4 }, { from: 10.0, size: 'wide' },
    { from: 13.2, size: 'close', x: 36, y: 240, pan: 6 }, { from: 15.2, size: 'wide' },
  ],
  light: [[0, 'dusk'], [7.2, 'dusk'], [8.3, 'fire'], [18, 'fire']],
  houses: [{ x: 126, w: 40, h: 28 }, { x: 172, w: 50, h: 36 }, { x: 226, w: 44, h: 30 }],
  duo: { knight: 70, mage: 102 },                                   // on the knoll
  runOrder: ['hero', 'archer', 'healer'],                           // out of the village, .3 s apart
  chaseX: { hero: 56, archer: 84, healer: 110, mage: 138, knight: 168 },
};
SKIES.fire = ['#12081c', '#2a0f2a', '#4a1830', '#7a2430', '#b03a2a', '#e0602a'];
TINT.fire = [.80, .52, .54];
PALS.fire = PALETTE.map((h, i) => i < 6 ? hex2(SKIES.fire[i]) : EMISSIVE.has(i) ? hex2(h) : hex2(h).map((v, j) => v * TINT.fire[j]));
const twPalCache = new Map();
function twPalette(t) {
  let i = 0; while (i < TW.light.length - 2 && t >= TW.light[i + 1][0]) i++;
  const [t0, a] = TW.light[i], [t1, b] = TW.light[i + 1], k = Math.round(seg(t, t0, t1) * 8) / 8, key = `${a}|${b}|${k}`;
  if (!twPalCache.has(key)) twPalCache.set(key, PALS[a].map((c, n) => toHex(c.map((v, j) => lerp(v, PALS[b][n][j], k)))));
  return twPalCache.get(key);
}
const knollTop = x => GROUND - 30 + ((x - 86) / 90) ** 2 * 36;

// ---------------------------------------------------------------- villagers: three kinds, torches and pitchforks
const vilHair = c => g => { const { P, R, X, hy } = g; R(X - 5, hy - 1, 10, 3, c); R(X - 6, hy + 1, 2, 5, c); R(X - 5, hy + 2, 9, 1, c); P(X + 1, hy + 3, 30); P(X + 4, hy + 9, 30); };
const vilArm = fork => g => {
  const { P, R, X, torY } = g, s = g.sleeve;
  R(X + 2, torY, 3, 3, s); R(X + 4, torY - 3, 3, 4, s); R(X + 5, torY - 5, 2, 2, 28);
  if (fork) { R(X + 6, torY - 20, 1, 27, 23); R(X + 4, torY - 21, 5, 1, 13); for (const dx of [4, 6, 8]) { P(X + dx, torY - 22, 13); P(X + dx, torY - 23, 13); P(X + dx, torY - 24, 6); } }
  else R(X + 6, torY - 14, 1, 10, 22);
};
const mkVil = (body, shade, hair, fork, extra) => ({
  leg: 8, tor: 10, customArm: true, body, bodyShade: shade, belt: 21, legC: 21, legShade: 20, boot: 20, bootShade: 20, sleeve: shade, eye: 21,
  back() {}, hair(g) { vilHair(hair)(g); extra && extra(g); }, front(g) { g.sleeve = shade; vilArm(fork)(g); },
});
KINDS.vilA = mkVil(23, 22, 21, false, g => { g.R(g.X, g.hy + 8, 5, 3, 21); });                                              // bearded, torch
KINDS.vilB = mkVil(17, 16, 41, true, g => { g.R(g.X - 8, g.hy, 17, 1, 41); g.R(g.X - 5, g.hy - 2, 10, 2, 41); g.R(g.X - 5, g.hy - 1, 10, 1, 35); });   // straw hat, pitchfork
KINDS.vilC = mkVil(32, 20, 12, false, g => { g.R(g.X - 4, g.hy - 1, 8, 1, 28); });                                          // grey and balding, torch
const VIL = ['vilA', 'vilB', 'vilC'];

// ---------------------------------------------------------------- set pieces
const TL = {};
function buildTwist() {
  for (const k of VIL) SPR[k] = { walk: [0, 1, 2, 3].map(f => mkTraveler(k, f, 'walk')) };
  // village: chapel tower behind three houses, trees, fence
  let L = layer(PW, PH); const base = GROUND + 4;
  for (let y = 0; y < 78; y++) for (let x = 0; x < 16; x++) lp(L, 208 + x, base - 78 + y, ramp(RAMP.stone, .75 - x / 16 * .45 - (y % 7 === 0 ? .15 : 0), x, y));
  for (let j = 0; j < 20; j++) { const hw = Math.round(10 * j / 20); for (let i = -hw; i <= hw; i++) lp(L, 216 + i, base - 98 + j, i > hw * .2 ? 32 : 31); }
  lr(L, 216, base - 106, 1, 8, 20); lr(L, 214, base - 103, 5, 1, 20); lr(L, 214, base - 70, 4, 7, 11); lp(L, 215, base - 66, 35); lp(L, 216, base - 66, 35);
  TW.houses.forEach((h, i) => { house(L, h.x, base, h.w, h.h, 300 + i); h.rh = Math.round(h.w * .55); h.ax = h.x + (h.w >> 1); h.ay = base - h.h - h.rh; });
  [[118, 10], [166, 8], [262, 11]].forEach(([x, rr], i) => { lr(L, x, base - 14, 3, 16, 22); blob(L, x + 1, base - 22, rr, 310 + i, RAMP.leaf, { spark: true }); });
  for (let x = 120; x < 270; x += 9) { lr(L, x, GROUND + 2, 2, 8, 23); } lr(L, 120, GROUND + 4, 150, 1, 24);
  TL.village = L;
  // the knoll where the knight and the mage stand
  L = layer(PW, PH); const r = Pixel.mulberry32(33);
  for (let x = 0; x < 178; x++) { const top = Math.round(knollTop(x)); for (let y = top; y < GROUND + 8; y++) L.d[y * PW + x] = ramp([15, 16, 17, 18], .85 - (y - top) / 46 + (vnoise(x * .2, y * .2, 34) - .5) * .4, x, y); if (x % 4 === 0) { lp(L, x, top - 1, 18); if (r() > .5) lp(L, x + 1, top - 2, 17); } }
  for (let i = 0; i < 16; i++) { const x = r() * 160, y = knollTop(x) + 4 + r() * 22, c = [36, 35, 6][i % 3]; lp(L, x, y, c); lp(L, x, y + 1, 16); }
  lr(L, 14, Math.round(knollTop(14)) - 26, 4, 30, 22); lr(L, 14, Math.round(knollTop(14)) - 26, 1, 30, 21);
  blob(L, 16, knollTop(14) - 36, 16, 35, RAMP.leaf, { spark: true }); blob(L, 4, knollTop(14) - 26, 11, 36, RAMP.leaf, { spark: true }); blob(L, 28, knollTop(14) - 28, 10, 37, RAMP.leaf, { spark: true });
  TL.knoll = L;
}

// ---------------------------------------------------------------- effects
function flame(cx, by, hw, hh, t, seed) {
  for (let x = -hw; x <= hw; x++) {
    const h = (1 - Math.abs(x) / (hw + 1)) * hh * (.6 + .7 * vnoise(x * .3 + seed * 7, t * 7, seed)) + 2;
    for (let y = 0; y < h; y++) { const p = y / h, c = p < .25 ? 42 : p < .5 ? 40 : p < .78 ? 39 : 31; if (p > .7 && bay(x + seed * 3, y + Math.floor(t * 20)) > .6) continue; scr.pset(cx + x + Math.round(Math.sin(y * .3 + t * 9 + seed) * (p * 2)), by - y, c); }
  }
}
function smoke(cx, by, t, grow, seed) {
  for (let k = 0; k < 14; k++) { const p = ((t * .3 + k / 14 + seed * .13) % 1), x = cx + Math.sin(p * 5 + k * 1.7 + seed) * (5 + p * 10) + p * 26, y = by - p * 210 * grow, rr = 5 + p * 12 * grow; scr.dither(Math.min(1, (1 - p) * 1.5) * grow); scr.circ(x, y, rr, 11); scr.dither(Math.min(1, (1 - p) * 1.2) * grow * .7); scr.circ(x - 2, y - 2, rr * .6, 10); scr.dither(); }
}
function villageFx(t, ox, far = false) {
  const base = GROUND + 4;
  TW.houses.forEach((h, i) => {
    if (t < TW.twist) { const cx = ox + h.x + h.w - 7, cy = h.ay + 2; for (let k = 0; k < 3; k++) { const p = (t * .25 + k / 3 + i * .2) % 1; scr.dither((1 - p) * .5); scr.circ(cx + p * 10, cy - p * 36, 2 + p * 4, 8); scr.dither(); } }   // chimney smoke
    const g = seg(t, TW.twist + i * .3, TW.twist + 1.4 + i * .3);
    if (i === 1 && t >= TW.spark && t < TW.twist) { const s = seg(t, TW.spark, TW.twist); flame(ox + h.ax + 6, h.ay + 8, 1 + Math.round(s * 3), 4 + s * 10, t, 5); }
    if (g <= 0) return;
    smoke(ox + h.ax, h.ay, t, g, i);
    flame(ox + h.ax, h.ay + 6, Math.round((h.w / 2 + 2) * g), (30 + i * 6) * g, t, 10 + i);
    flame(ox + h.x + 6, base - h.h + 12, 3, 12 * g, t, 20 + i); flame(ox + h.x + h.w - 8, base - h.h + 4, 4, 16 * g, t, 30 + i);
  });
  const g = seg(t, TW.twist + .9, TW.twist + 2.2);
  if (g > 0) { flame(ox + 216, base - 96, Math.round(6 * g), 26 * g, t, 40); smoke(ox + 216, base - 100, t, g, 7); }
  if (t >= TW.twist && !far) {
    const gl = seg(t, TW.twist, TW.twist + 1.2), fl = .5 + .5 * Math.sin(t * 13) * Math.sin(t * 7.1);
    scr.dither((.22 + fl * .08) * gl).elli(ox + 96, GROUND - 6, 190, 40, 39).dither();
    const r = Pixel.mulberry32(55);
    for (let i = 0; i < 26; i++) { const per = 1.1 + r() * 1.5, p = ((t + r() * per) % per) / per, x = ox + 120 + r() * 150 + Math.sin(p * 6 + i) * 8, y = GROUND - 40 - p * 200; scr.pset(x, y, p < .5 ? 40 : 39); }
  }
}
function mark(x, y, ch, t0, t, c = 40) { const lt = t - t0; if (lt < 0 || lt > 1.3) return; const pop = Math.round(Math.max(0, 1 - lt * 6) * 6); scr.text(x, y + pop - (lt > 1.1 ? 2 : 0), ch, c, { scale: 2, align: 'center', outline: 30 }); }
function runner(kind, x, y, t, i, o = {}) {
  const S = SPR[kind], spr = S.walk[cyc(t * 13 + i * 1.7, 4)];
  shadow(x, y, 8); blit(spr, x - (SW - 1 - SX), y - SFY, true);
  if (!VIL.includes(kind)) extras({ kind }, t, x, y, true);
  if (o.torch) flame(x - 6, y - 34, 2, 8, t, 60 + i);
  if (o.sweat) for (let k = 0; k < 2; k++) { const p = (t * 2.2 + k * .5 + i * .3) % 1; scr.pset(x + 8 + p * 9, y - 44 + k * 5 - Math.sin(p * 3) * 4, 27); scr.pset(x + 9 + p * 9, y - 44 + k * 5 - Math.sin(p * 3) * 4, 6); }
  if (o.burning) flame(x + 13, y - 17, 2, 9, t, 70);
}
function mob(t, x0, y, n) { for (let i = n - 1; i >= 0; i--) { const k = VIL[i % 3]; runner(k, x0 + i * 15, y - (i % 2) * 4, t, i + 5, { torch: k !== 'vilB' }); if (cyc(t * 3 + i, 4) === 0) scr.text(x0 + i * 15, y - 62 - (i % 2) * 4, '!', 31, { scale: 2, align: 'center', outline: 30 }); } }

// ---------------------------------------------------------------- scenes
function sceneHill(t) {
  sky();
  const sy = Math.round(lerp(312, 336, seg(t, 0, 12)));
  scr.dither(.5).circ(196, sy, 54, 39).dither(); scr.circ(196, sy, 46, 39).circ(196, sy, 41, 40).dither(.5).circ(196, sy, 30, 42).dither();
  for (let i = 0; i < 5; i++) { const y = 214 + i * 30, x = ((i * 97 - t * (2 + i)) % 340 + 340) % 340 - 60; scr.dither(.7).elli(x, y, 70 + i * 12, 4, i % 2 ? 9 : 8).dither(); }
  if (t < TW.twist) birds(t, 20, 250, 5, 12);
  blitX(LY.duskFar, 40, 0); blitX(LY.hills, 90, 0);
  blit(TL.village, 0, 0); villageFx(t, 0);
  blitX(LY.gMeadow, 0, GROUND); blit(TL.knoll, 0, 0);
  // the duo
  const fl = seg(t, TW.flee, TW.flee + .12);
  for (const [k, x0, d] of [['knight', TW.duo.knight, 0], ['mage', TW.duo.mage, .12]]) {
    if (t < TW.flee + d) {
      const hop = t >= TW.twist + .25 && t < TW.twist + .55 ? -Math.round(Math.sin((t - TW.twist - .25) / .3 * Math.PI) * 5) : 0, y = Math.round(knollTop(x0)) + 3;
      shadow(x0, y, 8); blit(SPR[k].stand, x0 - SX, y - SFY + hop); extras({ kind: k }, t, x0, y + hop, false);
      mark(x0 + 2, y - 66 - (k === 'knight' ? 4 : 8), '!', TW.twist + .3, t);
      if (k === 'mage') mark(x0 + 2, y - 74, '?', TW.mob + .2, t, 6); else mark(x0 + 2, y - 70, '!', TW.mob + .5, t);
    } else { const x = x0 - (t - TW.flee - d) * 115, y = Math.round(knollTop(Math.max(0, x))) + 3; runner(k, x, y, t, k === 'knight' ? 0 : 1, { sweat: true }); }
  }
  // the other three burst out of the village, then the mob
  TW.runOrder.forEach((k, i) => { const lt = t - TW.runners - i * .3; if (lt > 0) runner(k, 280 - lt * 100, FEET, t, i + 2, { sweat: true, burning: k === 'hero' }); });
  if (t >= TW.mob) mob(t, 290 - (t - TW.mob) * 82, FEET + 2, 7);
  blitX(LY.fgMeadow, 0, PH - 64);
  const ta = seg(t, .3, 1.0) * (1 - seg(t, 2.0, 2.4));
  if (ta > 0) { scr.dither(ta); scr.text(135, 60, 'A QUIET EVENING', 6, { scale: 3, align: 'center', outline: 11 }); scr.dither(); }
}
function sceneChase(t) {
  const lt = t - TW.chase, sc = lt * 110;
  sky();
  scr.dither(.5).circ(60, 352, 50, 39).dither(); scr.circ(60, 352, 42, 39).circ(60, 352, 37, 40);
  blitX(LY.duskFar, -sc * .05, 0);
  const vx = Math.round(40 + lt * 16); blit(TL.village, vx, 6); villageFx(t, vx, true);
  scr.dither(.3).elli(vx + 60, GROUND - 120, 230, 120, 39).dither();
  blitX(LY.hills, -sc * .3, 14); blitX(LY.gMeadow, -sc, GROUND);
  mob(t, 206 - Math.round(seg(lt, 2.6, 4.4) * 14), FEET + 2, 6);
  ['knight', 'mage', 'healer', 'archer', 'hero'].forEach((k, i) => runner(k, TW.chaseX[k], FEET, t, i, { sweat: true, burning: k === 'hero' }));
  mark(TW.chaseX.healer, FEET - 62, '!', TW.chase + 1.5, t); mark(TW.chaseX.knight, FEET - 74, '!', TW.chase + 2.3, t); mark(TW.chaseX.mage, FEET - 74, '?', TW.chase + .4, t, 6);
  blitX(LY.fgMeadow, -sc * 1.5, PH - 64);
}
function sceneCard(t) {
  const lt = t - TW.card;
  scr.cls(30);
  if (lt > .15) scr.text(135, 190, 'NOT OUR FAULT.', 6, { scale: 4, align: 'center' });
  if (lt > .75) { scr.dither(seg(lt, .75, 1.0)); scr.text(135, 226, '...PROBABLY.', 40, { scale: 3, align: 'center' }); scr.dither(); }
  runner('hero', 300 - lt * 150, 300, t, 0, { burning: true, sweat: true }); runner('vilB', 352 - lt * 150, 300, t, 3); runner('vilA', 374 - lt * 150, 302, t, 4, { torch: true });
}

// ---------------------------------------------------------------- frame
function twDraw(t, ctx) {
  scr.reset();
  if (t >= TW.card) sceneCard(t); else if (t >= TW.chase) sceneChase(t); else sceneHill(t);
  if (t >= TW.twist && t < TW.twist + 2 / 30) scr.px.fill(42); else if (t >= TW.twist + 2 / 30 && t < TW.twist + 4 / 30) { const px = scr.px; for (let k = 0; k < px.length; k++) if (bay(k % PW, (k / PW) | 0) > .4) px[k] = 40; }
  const c = scr.render({ palette: twPalette(t) }), i = TW.views.findLastIndex(v => t >= v.from), v = TW.views[i];
  const s = t >= TW.twist ? Math.max(0, 1 - (t - TW.twist) / .7) : 0, dx = Math.round(Math.sin(t * 95) * 4 * s) * 4, dy = Math.round(Math.cos(t * 71) * 3 * s) * 4;
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#1a1228'; ctx.fillRect(0, 0, W, H);
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, dx, dy, W, H);
  else { const end = TW.views[i + 1] ? TW.views[i + 1].from : TW_DUR, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, 0, 0, W, H); }
}

// ---------------------------------------------------------------- score: calm at 100 BPM, then the chase at 150
const TWP = 'T100 @ENV1 { 115, 16, 0 } @ENV2 { 90, 20, 0 } @ENV3 { 55, 6, 0 } @ENV4 { 127, 60, 85 } @ENV5 { 110, 10, 30 } @VIB1 { 24, 12, 25 } @GLI1 { 2400, 10 } @ENV0 @VIB0 @GLI0';
const TW_TRACKS = [
  { gain: .36, mml: 'O2 L1 Q95 @0 F | C | D | T150 L8 Q70 [D>D<]4 | [D>D<]4 | [<B->B-]4 | [<A>A]4 | [D>D<]4 | [<B->B-]2 <A8>A8 D4 | R2.' },
  { gain: .24, mml: '@1 O5 L4 Q92 V70 @ENV4 @VIB1 A2 >C4< A4 | G2 E4 G4 | F2. R4 | T150 V100 L16 Q85 @VIB0 [DFAF]2 [>D<AFA]2 | [DFAF]2 [>D<AFA]2 | [<B->DFD]2 [B-FDF]2 | [<A>C+EC+]2 [AEC+E]2 | [DFAF]2 [>D<AFA]2 | [<B->DFD]2 <A>C+EC+ D4 | L4 Q98 V85 <F E E->' },
  { gain: .18, pan: -.3, mml: '@2 O4 L8 V60 Q90 @ENV5 [FA>C<A]2 | [EG>C<G]2 | DFAF D2 | T150 V75 [R8>D8<]4 | [R8>D8<]4 | [R8F8]4 | [R8E8]4 | [R8>D8<]4 | [R8F8]2 R8E8 R4 | R2.' },
  { gain: .30, pan: .3, mml: `L16 Q100 R1 R1 R1 T150 [ ${drumBar} ]5 ${DB.slice(0, 12).join(' ')} ${K} R16 R8 | R2.` },
];
function twAudio(ac, out, t0 = 0) {
  Chip.play(ac, t0, out, TW_TRACKS, { prefix: TWP });
  Chip.sfx.explode(ac, t0 + TW.twist, out, { gain: .7 }); Chip.sfx.hit(ac, t0 + TW.card, out, { gain: .5 });
  const r = Pixel.mulberry32(91), b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 700;       // fire roar
  g.gain.setValueAtTime(0, t0 + TW.twist); g.gain.linearRampToValueAtTime(.09, t0 + TW.twist + .4); g.gain.setValueAtTime(.09, t0 + TW.chase); g.gain.linearRampToValueAtTime(.03, t0 + TW.card); g.gain.linearRampToValueAtTime(0, t0 + TW.card + .2);
  s.connect(f).connect(g).connect(out); s.start(t0 + TW.twist); s.stop(t0 + TW.card + .3);
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * TW_DUR), sr);
  twAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
