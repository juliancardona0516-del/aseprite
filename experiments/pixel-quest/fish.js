// =====================================================================
// The Big Catch — 20 s. The hero fishes, the blond archer sleeps, a giant fish attacks, they beat it.
// Daytime, a river by a forest. Sound effects only (no music). Reuses journey.js.
// =====================================================================
const FS_DUR = 20, WY = GROUND + 26, FB = GROUND + 4;               // water line, feet on the bank / dock
// ---------------------------------------------------------------- PLAN AS DATA
const FS = {
  tug: 5.0, emerge: 6.5, wake: 7.0, lunge: 10.0, arrows: [11.2, 11.6, 12.0], arrowFly: .25, draw: 12.5, leap: 13.2, slash: 14.2, land: 14.9, splash: 15.6, float: 16.2, win: 16.6, yawn: 17.2, sleep: 17.8,
  views: [
    { from: 0, size: 'wide' }, { from: 3, size: 'close', x: 22, y: 236, pan: 3 }, { from: 5, size: 'wide' },
    { from: 8.5, size: 'close', x: 104, y: 222, pan: 4 }, { from: 10, size: 'wide' }, { from: 12.5, size: 'close', x: 56, y: 226, pan: 3 },
    { from: 13.2, size: 'wide' }, { from: 16.5, size: 'close', x: 24, y: 236, pan: 4 }, { from: 18.3, size: 'wide' },
  ],
  shakes: [[6.5, .7, 5], [14.2, .4, 5], [15.6, .7, 6]],
  hero: { sit: 140, back: 112, ready: 118, end: 126 }, archer: { lie: 52, stand: 62 }, fish: { x: 206, y: WY - 54, ang: 1.0 },
};
const fishHead = (cx, cy, a) => [cx - Math.cos(a) * 52, cy - Math.sin(a) * 52];

// ---------------------------------------------------------------- the fish: one big sprite, three faces
const FL = {};
function mkFish(mode) {                                              // 'shut' | 'open' | 'dead'; faces left
  const L = layer(152, 96), cx = 80, cy = 48, rx = 58, ry = 34;
  for (let x = 132; x < 151; x++) { const p = (x - 132) / 18, hh = 6 + p * 26; for (let y = -hh; y <= hh; y++) { if (p > .6 && Math.abs(y) < (p - .6) * 22) continue; lp(L, x, cy + y, Math.abs(y) % 5 < 1 ? 32 : 31); } }   // tail
  for (let x = 52; x < 118; x++) { const top = cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)), hh = 9 + ((x - 52) % 11 < 6 ? ((x - 52) % 11) * 1.6 : (11 - (x - 52) % 11) * 1.6); for (let y = 0; y < hh; y++) lp(L, x, top - y + 2, (x - 52) % 11 === 0 ? 32 : 31); }   // dorsal fin
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if ((x / rx) ** 2 + (y / ry) ** 2 > 1) continue;
    const X = cx + x, Y = cy + y, ny = y / ry;
    let c = ny > .42 ? ramp([8, 7, 6], .5 + (ny - .42) * .9 - x / rx * .15, X, Y) : ramp([34, 33, 33, 36], .55 - ny * .7 - x / rx * .12, X, Y);
    if (ny <= .42 && ((X + ((Y >> 3) & 1) * 4) % 8 === 0) && Y % 8 < 5) c = 34;
    lp(L, X, Y, c);
  }
  for (let y = -16; y <= 20; y++) lp(L, 74 - Math.round(Math.sqrt(Math.max(0, 1 - (y / 22) ** 2)) * 7), cy + y, 34);                       // gill
  for (let j = 0; j < 14; j++) for (let i = 0; i <= j; i++) lp(L, 86 + i, cy + 12 + j - (i >> 1), i === j || i === 0 ? 32 : 31);            // pectoral fin
  if (mode === 'open') {
    for (let x = 20; x < 66; x++) { const hh = (66 - x) * .62; for (let y = -hh; y <= hh; y++) lp(L, x, cy + 8 + y, x > 54 ? 20 : 32); }
    for (let x = 24; x < 62; x += 7) { const hh = (66 - x) * .62; for (let k = 0; k < 6; k++) for (let i = 0; i < 6 - k; i++) { lp(L, x + i, cy + 8 - hh + k, 6); lp(L, x + i, cy + 8 + hh - k, 6); } }
    for (let x = 34; x < 54; x++) for (let y = -2; y <= 3; y++) lp(L, x, cy + 12 + y, 36);                                               // tongue
  } else { for (let x = 23; x < 60; x++) lp(L, x, cy + 10 + Math.round((x - 23) * -.06), 30); for (let x = 26; x < 54; x += 6) { lp(L, x, cy + 11, 6); lp(L, x + 1, cy + 11, 6); lp(L, x, cy + 12, 6); } }
  const ex = 50, ey = cy - 14;
  for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 81) lp(L, ex + x, ey + y, 6);
  if (mode === 'dead') { for (let k = -5; k <= 5; k++) { lp(L, ex + k, ey + k, 30); lp(L, ex + k + 1, ey + k, 30); lp(L, ex + k, ey - k, 30); lp(L, ex + k + 1, ey - k, 30); } }
  else { for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 17) lp(L, ex - 2 + x, ey + 1 + y, 30); lp(L, ex - 4, ey - 1, 6); lp(L, ex - 3, ey - 1, 6); for (let k = 0; k < 16; k++) { lp(L, ex - 10 + k, ey - 13 + Math.round(k * .45), 30); lp(L, ex - 10 + k, ey - 12 + Math.round(k * .45), 30); } }
  return outline(L, 30);
}
function buildFish() {
  FL.shut = mkFish('shut'); FL.open = mkFish('open'); FL.dead = mkFish('dead');
  // far bank: a forest line across the river
  let L = layer(PW, PH), r = Pixel.mulberry32(41);
  for (let i = 0; i < 26; i++) { const x = r() * PW, h = 60 + r() * 60; lr(L, Math.round(x), WY - 4 - Math.round(h), 3, Math.round(h), 21); blob(L, x + 1, WY - 8 - h, 14 + r() * 10, 400 + i, RAMP.leafDark, { bias: -.05 }); }
  haze(L, 26, .3);
  for (let i = 0; i < 20; i++) { const x = i * 14 + r() * 8, h = 30 + r() * 34; lr(L, Math.round(x), WY - 4 - Math.round(h), 3, Math.round(h), 21); lr(L, Math.round(x), WY - 4 - Math.round(h), 1, Math.round(h), 22); blob(L, x + 1, WY - 8 - h, 12 + r() * 8, 440 + i, RAMP.leaf, { spark: true }); blob(L, x - 7, WY - 2 - h, 8 + r() * 5, 470 + i, RAMP.leaf, { spark: true }); }
  for (let x = 0; x < PW; x++) for (let y = WY - 6; y < WY; y++) L.d[y * PW + x] = ramp([15, 16, 17], .5 + (hash(x, y, 4) - .5) * .6, x, y);
  FL.far = L;
  // near bank on the left, with a big tree
  L = layer(PW, PH); r = Pixel.mulberry32(42);
  for (let y = GROUND; y < PH; y++) { const lim = 114 + Math.sin(y * .21) * 3 - Math.max(0, y - WY) * .12; for (let x = 0; x < lim; x++) { const d = y - GROUND; L.d[y * PW + x] = d < 6 ? ramp([16, 17, 18], .55 + (hash(x, y, 5) - .5) * .7 + (d < 2 ? .25 : 0), x, y) : ramp([20, 21, 22], .5 + (vnoise(x * .2, y * .3, 6) - .5) * .7 - (lim - x < 3 ? .3 : 0), x, y); } }
  for (let x = 0; x < 112; x += 3) { lp(L, x, GROUND - 1, 18); if (r() > .5) lp(L, x + 1, GROUND - 2, 17); }
  for (let i = 0; i < 12; i++) { const x = r() * 104, c = [36, 35, 6][i % 3]; lp(L, x, GROUND - 2, c); lp(L, x, GROUND - 1, 16); }
  trunk(L, 26, 150, GROUND + 3, 9, 14, 43);
  for (let i = 0; i < 46; i++) { const a = r() * TAU, d = Math.sqrt(r()); blob(L, 30 + Math.cos(a) * 62 * d, 140 + Math.sin(a) * 70 * d, 12 + r() * 12, 500 + i, RAMP.leaf, { spark: true }); }
  blob(L, 92, GROUND - 4, 9, 44, RAMP.leaf, { flat: .4, spark: true }); blob(L, 6, GROUND - 5, 10, 45, RAMP.leaf, { flat: .4, spark: true });
  FL.bank = L;
  // dock
  L = layer(PW, PH);
  for (const x of [118, 148]) { lr(L, x, GROUND + 6, 4, WY - GROUND + 14, 22); lr(L, x, GROUND + 6, 1, WY - GROUND + 14, 21); }
  lr(L, 94, GROUND + 2, 62, 5, 23); lr(L, 94, GROUND + 2, 62, 1, 24); lr(L, 94, GROUND + 6, 62, 1, 21); for (let x = 102; x < 156; x += 10) lr(L, x, GROUND + 3, 1, 3, 22);
  FL.dock = outline(L, 20);
  L = layer(PW, 70); r = Pixel.mulberry32(46);                       // reeds in the foreground
  for (let i = 0; i < 34; i++) { const x = i < 20 ? r() * 90 : 190 + r() * 80, h = 26 + r() * 36, lean = (r() - .5) * .25; for (let s = 0; s < h; s++) { lp(L, x + s * lean, 69 - s, s % 4 ? 16 : 17); if (s > h - 9 && i % 3 === 0) { lp(L, x + s * lean + 1, 69 - s, 22); lp(L, x + s * lean - 1, 69 - s, 21); } } }
  FL.reeds = L;
}

// ---------------------------------------------------------------- helpers
function blitRot(L, cx, cy, ang, o = {}) {
  const px = scr.px, pvx = L.w / 2, pvy = L.h / 2, ca = Math.cos(-ang), sa = Math.sin(-ang), rad = Math.ceil(Math.hypot(L.w, L.h) / 2) + 1;
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= PW || Y >= PH || (o.clipY !== undefined && Y >= o.clipY)) continue;
    let u = Math.floor(dx * ca - dy * sa + pvx), v = Math.floor(dx * sa + dy * ca + pvy);
    if (o.flipY) v = L.h - 1 - v;
    if (u < 0 || v < 0 || u >= L.w || v >= L.h) continue;
    const c = L.d[v * L.w + u]; if (c !== 255) px[Y * PW + X] = o.flash ? 42 : c;
  }
}
function water(t) {
  const px = scr.px;
  for (let y = WY; y < PH; y++) { const d = (y - WY) / (PH - WY); for (let x = 0; x < PW; x++) {
    let c = ramp([1, 2, 2, 3], 1 - d * 1.15, x, y);
    if (d < .5 && bay(x, y) > .35 + d * 1.3 && vnoise(x * .07, y * .6 - t * .4, 2) > .5) c = 26;                 // the forest, reflected
    const n = vnoise(x * .06 + t * .5, y * .35 - t * .25, 3); if (n > .7 && (y + Math.floor(n * 20)) % 5 === 0) c = 4;
    if (hash(x >> 1, y >> 1, Math.floor(t * 5)) > .996) c = 6;
    if (y - WY < 2) c = (Math.sin(x * .3 + t * 3) > -.3) ? (y === WY ? 6 : 5) : 3;
    px[y * PW + x] = c;
  } }
}
function splash(x, t0, t, power = 1, seed = 1) {
  const lt = t - t0; if (lt < 0 || lt > 1.4) return; const r = Pixel.mulberry32(seed * 91);
  for (let i = 0; i < 40 * power; i++) { const a = -Math.PI / 2 + (r() - .5) * 2.2, sp = (90 + r() * 170) * Math.sqrt(power), px_ = x + Math.cos(a) * sp * lt, py = WY + Math.sin(a) * sp * lt + 330 * lt * lt; if (py > WY + 2) continue; scr.rect(px_, py, i % 3 ? 2 : 3, 2, i % 4 ? 27 : 6); }
  if (lt < .35) { const h = (1 - lt / .35) * 60 * power, w = 14 * power + lt * 60; scr.dither(.8); scr.elli(x - w, WY - h, w * 2, h + 6, 6); scr.dither(); }
  for (let k = 0; k < 3; k++) { const p = lt / 1.4 - k * .15; if (p > 0 && p < 1) { scr.dither(1 - p); scr.ellib(x - (20 + p * 90 * power), WY + 2 + k * 3, (20 + p * 90 * power) * 2, 6 + k * 2, 6); scr.dither(); } }
}
function fmark(x, y, ch, t0, t, c = 40, dur = 1.1) { const lt = t - t0; if (lt < 0 || lt > dur) return; scr.text(x, y + Math.round(Math.max(0, 1 - lt * 6) * 6), ch, c, { scale: 2, align: 'center', outline: 30 }); }
function zzz(x, y, t) { for (let k = 0; k < 3; k++) { const p = ((t * .5 + k / 3) % 1); scr.dither(1 - p * .8); scr.text(x + p * 16 + Math.sin(p * 6) * 2, y - p * 30, 'Z', 6, { scale: p > .5 ? 2 : 1, outline: 11 }); scr.dither(); } }

// ---------------------------------------------------------------- the fish, by time
function fishState(t) {
  const F = FS.fish;
  if (t < FS.emerge) return null;
  if (t < FS.slash) {
    const up = Math.min(1, (t - FS.emerge) / .8), e = 1 - Math.pow(1 - up, 3) + Math.sin(up * Math.PI) * .12;
    let x = F.x, y = lerp(WY + 70, F.y, e) + Math.sin(t * 3) * 3, a = lerp(1.45, F.ang, e) + Math.sin(t * 2.2) * .04, open = cyc(t * 5, 2) === 0 || (t > 8.5 && t < 10);
    if (t >= FS.lunge && t < FS.lunge + 1) { const p = (t - FS.lunge) / 1, k = Math.sin(Math.min(1, p / .55) * Math.PI / 2) * (p < .55 ? 1 : 1 - (p - .55) / .45); x -= 26 * k; y += 22 * k; a -= .6 * k; open = p < .5; }
    let flash = false;
    for (const s of FS.arrows) { const lt = t - s - FS.arrowFly; if (lt >= 0 && lt < .3) { x += 7 * (1 - lt / .3); a += .08 * (1 - lt / .3); flash = flash || lt < .07; open = true; } }
    if (t > 8.5 && t < 10) open = cyc(t * 6, 3) !== 0;
    return { x, y, a, spr: open ? FL.open : FL.shut, flash, clipY: WY + 1 };
  }
  if (t < FS.splash) { const p = (t - FS.slash) / (FS.splash - FS.slash); return { x: F.x + 34 * p, y: F.y - 260 * p + 330 * p * p, a: F.ang + p * TAU * 1.25, spr: FL.dead, flash: t - FS.slash < .1, clipY: WY + 1 }; }
  if (t < FS.float) return null;
  const e = seg(t, FS.float, FS.float + .5);
  return { x: 204, y: WY + 22 - e * 26 + Math.sin(t * 2.2) * 2, a: Math.sin(t * 1.3) * .05, spr: FL.dead, flipY: true, clipY: WY + 8 };
}

// ---------------------------------------------------------------- scene
function sceneRiver(t) {
  sky();
  scr.dither(.5).circ(206, 70, 30, 6).dither(); scr.circ(206, 70, 22, 40).circ(206, 70, 17, 42);
  for (let i = 0; i < 4; i++) { const x = ((i * 110 + t * (3 + i)) % 380) - 60, y = 60 + i * 44; scr.elli(x, y, 60 + i * 10, 12, 6); scr.elli(x + 14, y - 7, 34, 12, 6); scr.elli(x + 4, y + 4, 60 + i * 10, 7, 7); }
  blitX(LY.hills, 40, 34); blit(FL.far, 0, 0);
  if (t < FS.emerge || t > FS.float) birds(t % 12, -20, 150, 3, 20);
  water(t);
  // the shadow under the water, then the fish
  if (t >= FS.tug - .4 && t < FS.emerge) { const g = seg(t, FS.tug - .4, FS.emerge); scr.dither(.35 + g * .4); scr.elli(196 - 20 - g * 46, WY + 16 - g * 4, (20 + g * 46) * 2, 14 + g * 22, 0); scr.dither(); for (let k = 0; k < 8; k++) { const p = ((t * 1.6 + k / 8) % 1); scr.circb(170 + k * 7 + Math.sin(k) * 6, WY + 30 - p * 30, 1 + (k % 2), 5); } }
  const f = fishState(t);
  if (f) blitRot(f.spr, f.x, f.y, f.a, f);
  if (t >= FS.float) { scr.dither(.7); scr.elli(204 - 74, WY - 1, 148, 6, 6); scr.dither(); }
  splash(196, FS.emerge, t, 1.3, 1); splash(170, FS.lunge + .5, t, .6, 2); splash(236, FS.splash, t, 1.8, 3);
  blit(FL.bank, 0, 0);
  // the archer: asleep, awake, shooting, asleep again
  const A = FS.archer, asleep = t < FS.wake || t >= FS.sleep;
  if (asleep) { const br = cyc(t * .9, 2); blitRot(SPR.archer.stand, A.lie, GROUND - 8 - br, -Math.PI / 2); zzz(A.lie - 20, GROUND - 26, t + (t >= FS.sleep ? 0 : 0)); }
  else {
    const hop = t < FS.wake + .35 ? -Math.round(Math.sin((t - FS.wake) / .35 * Math.PI) * 9) : 0, ax = A.stand - (t >= FS.lunge && t < FS.lunge + .6 ? Math.round(Math.sin((t - FS.lunge) / .6 * Math.PI) * 6) : 0);
    shadow(ax, FB, 8); blit(SPR.archer.stand, ax - SX, FB - SFY + hop);
    fmark(ax + 2, FB - 70, '!', FS.wake, t);
    if (t >= FS.arrows[0] - .3 && t < FS.arrows[2] + .4) {                                       // the bow, drawn
      const pull = FS.arrows.some(s => t >= s - .25 && t < s) ? 4 : 0, bx = ax + 13, by = FB - 24;
      for (let a = -1.1; a <= 1.1; a += .1) scr.pset(bx + Math.cos(a) * 9 - 5, by + Math.sin(a) * 12, 22);
      scr.line(bx - 1, by - 11, bx - 1 - pull, by, 7).line(bx - 1 - pull, by, bx - 1, by + 11, 7); if (pull) scr.line(bx - pull, by, bx + 8, by - 1, 24).pset(bx + 9, by - 1, 6);
    }
    if (t >= FS.yawn && t < FS.sleep) fmark(ax + 4, FB - 68, '~', FS.yawn, t, 6, .6);
  }
  // the hero
  const Hx = FS.hero; let hx, hy = FB, hs = SPR.hero.stand;
  if (t < FS.emerge) { hx = Hx.sit; hy = FB + 6; }
  else if (t < FS.emerge + .5) { const p = (t - FS.emerge) / .5; hx = lerp(Hx.sit, Hx.back, p); hy = FB - Math.sin(p * Math.PI) * 14; }
  else if (t < FS.draw) { hx = Hx.back + (t < 8.5 ? cyc(t * 14, 2) : 0) - (t >= FS.lunge && t < FS.lunge + .6 ? Math.round(Math.sin((t - FS.lunge) / .6 * Math.PI) * 8) : 0); }
  else if (t < FS.leap) { hx = Hx.ready; hs = SPR.hero.cheer; }
  else if (t < FS.slash) { const p = (t - FS.leap) / (FS.slash - FS.leap); hx = lerp(Hx.ready, 160, p); hy = FB - Math.sin(p * Math.PI / 2) * 84; hs = SPR.hero.cheer; }
  else if (t < FS.land) { const p = (t - FS.slash) / (FS.land - FS.slash); hx = lerp(160, Hx.end, p); hy = FB - 84 * (1 - p * p); hs = SPR.hero.cheer; }
  else { hx = Hx.end; hs = t >= FS.win ? SPR.hero.cheer : SPR.hero.stand; }
  hx = Math.round(hx); hy = Math.round(hy);
  if (hy >= FB) shadow(hx, FB, 8);
  blit(hs, hx - SX, hy - SFY);
  blit(FL.dock, 0, 0);
  if (t < FS.emerge) {                                                                           // rod, line, float
    const tug = t >= FS.tug, tw = tug ? Math.round(Math.sin(t * 30) * 2) : 0, tipx = hx + 36, tipy = hy - 54 + (tug ? 12 + tw : 0), bx = 190, by = WY + (tug ? 5 : Math.round(Math.sin(t * 2.4) * 1.2));
    scr.line(hx + 7, hy - 24, tipx, tipy, 22).line(hx + 7, hy - 23, tipx - 8, tipy + 6, 21);
    if (tug) scr.line(tipx, tipy, bx, by, 7); else for (let s = 0; s <= 20; s++) { const p = s / 20; scr.pset(lerp(tipx, bx, p), lerp(tipy, by, p) + Math.sin(p * Math.PI) * 10, 7); }
    if (!tug) scr.rect(bx - 1, by - 3, 3, 2, 31).rect(bx - 1, by - 1, 3, 2, 6);
    for (let k = 0; k < 2; k++) { const p = ((t * (tug ? 2 : .6) + k / 2) % 1); scr.dither(1 - p); scr.ellib(bx - 3 - p * 12, WY + 1, 6 + p * 24, 3 + p * 3, 6); scr.dither(); }
    fmark(hx + 2, hy - 66, '!', FS.tug, t);
  }
  fmark(hx + 2, hy - 72, '!', FS.emerge + .1, t, 31);
  if (t >= FS.win) { const k = cyc((t - FS.win) * 10, 6), gx = hx + 7, gy = hy - 46; if (k < 3) { scr.pset(gx, gy, 42); for (let d = 1; d <= 3 - k; d++) scr.pset(gx + d, gy, 42).pset(gx - d, gy, 42).pset(gx, gy + d, 42).pset(gx, gy - d, 42); } }
  // arrows and the slash
  for (const s of FS.arrows) { const p = (t - s) / FS.arrowFly; if (p < 0) continue; const [tx, ty] = fishHead(FS.fish.x, FS.fish.y, FS.fish.ang), x0 = FS.archer.stand + 20, y0 = FB - 25;
    if (p < 1) { const x = lerp(x0, tx + 12, p), y = lerp(y0, ty + 6, p) - Math.sin(p * Math.PI) * 10, dx = (tx - x0), dy = (ty - y0), n = Math.hypot(dx, dy); scr.line(x - dx / n * 9, y - dy / n * 9, x, y, 24).pset(x, y, 6).pset(x - dx / n * 9, y - dy / n * 9, 31); }
    else if (p < 2.2) { const q = (p - 1) / 1.2; for (let k = 0; k < 8; k++) { const a = k * TAU / 8; scr.pset(tx + 12 + Math.cos(a) * q * 14, ty + 6 + Math.sin(a) * q * 14, q < .5 ? 42 : 40); } } }
  if (t >= FS.slash && t < FS.slash + .3) { const q = (t - FS.slash) / .3, [tx, ty] = fishHead(FS.fish.x, FS.fish.y, FS.fish.ang); for (let a = -2.4 + q * 1.2; a < -.2 + q * 1.6; a += .03) for (let w = 0; w < 4 - q * 3; w++) scr.pset(tx + 4 + Math.cos(a) * (34 + w), ty + 4 + Math.sin(a) * (34 + w), w < 2 ? 42 : 5); for (let k = 0; k < 10; k++) { const a = k * TAU / 10; scr.line(tx + Math.cos(a) * q * 20, ty + Math.sin(a) * q * 20, tx + Math.cos(a) * q * 34, ty + Math.sin(a) * q * 34, 40); } }
  blit(FL.reeds, Math.round(Math.sin(t * 1.1) * 1), PH - 70);
}

// ---------------------------------------------------------------- frame
function fsDraw(t, ctx) {
  scr.reset(); sceneRiver(t);
  for (const ft of [FS.emerge, FS.slash]) if (t >= ft && t < ft + 2 / 30) { const px = scr.px; for (let k = 0; k < px.length; k++) if (bay(k % PW, (k / PW) | 0) > .45) px[k] = 42; }
  const c = scr.render({ palette: PALETTE }), i = FS.views.findLastIndex(v => t >= v.from), v = FS.views[i];
  let dx = 0, dy = 0; for (const [t0, dur, amp] of FS.shakes) if (t >= t0 && t < t0 + dur) { const s = 1 - (t - t0) / dur; dx = Math.round(Math.sin(t * 95) * amp * s) * 4; dy = Math.round(Math.cos(t * 71) * amp * .7 * s) * 4; }
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#14307a'; ctx.fillRect(0, 0, W, H);
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, dx, dy, W, H);
  else { const end = FS.views[i + 1] ? FS.views[i + 1].from : FS_DUR, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, dx, dy, W, H); }
}

// ---------------------------------------------------------------- sound effects only
function fsAudio(ac, out, t0 = 0) {
  const at = x => t0 + x, r = Pixel.mulberry32(17);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.03, dur * .2))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'square', vib = 0) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = vib; lg.gain.value = f0 * .12; l.connect(lg).connect(o.frequency); l.start(at(t)); l.stop(at(t + dur)); } g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .02)); g.gain.setValueAtTime(gain, at(t + dur * .6)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  // river, all the way through
  { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .6; g.gain.value = .022; s.connect(f).connect(g).connect(out); s.start(at(0)); s.stop(at(FS_DUR)); }
  const chirp = t => { tone(t, .07, 2600, 3600, .05, 'square'); tone(t + .1, .06, 3000, 3900, .04, 'square'); };
  [.6, 1.4, 2.6, 3.4, 4.3, 17.0, 18.6, 19.4].forEach(chirp);
  const snore = t => { tone(t, .7, 95, 70, .10, 'sawtooth', 22); tone(t + .9, .5, 420, 300, .03, 'sine'); };
  [.3, 2.3, 4.2, 18.6].forEach(snore);
  Chip.sfx.blip(ac, at(1.9), out, { gain: .12 });                                                                   // the float
  [5.0, 5.4, 5.8, 6.15].forEach((t, i) => Chip.sfx.select(ac, at(t), out, { gain: .22, pitch: 1 - i * .1 }));        // the bite
  noise(5.0, 1.5, 60, 160, .30, 'lowpass');                                                                         // rumble under the water
  noise(FS.emerge, .9, 3000, 500, .40); Chip.sfx.explode(ac, at(FS.emerge), out, { gain: .55 });                    // it breaks the surface
  Chip.sfx.blip(ac, at(FS.wake), out, { gain: .25, pitch: 1.6 }); Chip.sfx.jump(ac, at(FS.wake), out, { gain: .2 });
  [8.6, 9.3, 12.75].forEach(t => { tone(t, .55, 120, 62, .22, 'sawtooth', 28); noise(t, .55, 400, 150, .10, 'lowpass'); });   // roars
  Chip.sfx.jump(ac, at(FS.lunge), out, { gain: .22, pitch: .5 }); Chip.sfx.hit(ac, at(FS.lunge + .5), out, { gain: .4, pitch: .7 }); noise(FS.lunge + .5, .4, 2500, 600, .2);
  FS.arrows.forEach((t, i) => { noise(t, .2, 4200, 900, .16, 'bandpass', 3); tone(t - .02, .05, 500, 900, .08, 'triangle'); Chip.sfx.hit(ac, at(t + FS.arrowFly), out, { gain: .34, seed: i + 1 }); });
  tone(FS.draw, .22, 2400, 5200, .07, 'triangle'); tone(FS.draw + .05, .3, 4800, 5000, .03, 'sine');               // the sword
  Chip.sfx.jump(ac, at(FS.leap), out, { gain: .3 });
  noise(FS.slash - .06, .16, 6000, 1200, .28, 'bandpass', 2); Chip.sfx.hit(ac, at(FS.slash), out, { gain: .5 }); Chip.sfx.explode(ac, at(FS.slash + .02), out, { gain: .35, pitch: 1.3 });
  Chip.sfx.fall(ac, at(FS.slash + .25), out, { gain: .22 }); Chip.sfx.land(ac, at(FS.land), out, { gain: .25 });
  noise(FS.splash, 1.2, 3500, 350, .45); Chip.sfx.explode(ac, at(FS.splash), out, { gain: .4, pitch: .7 });         // the big splash
  noise(FS.float, .5, 1500, 500, .10);
  Chip.sfx.powerup(ac, at(FS.win), out, { gain: .3 }); Chip.sfx.coin(ac, at(FS.win + .55), out, { gain: .2 });
  tone(FS.yawn, .55, 520, 260, .07, 'triangle', 5);
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * FS_DUR), sr);
  fsAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
