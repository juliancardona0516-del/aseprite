// =====================================================================
// Memories in the Moon — 24 s. The mage alone at night; his younger years play inside the moon; it ends as a book page.
// Sound effects only (no music). Reuses journey.js.
// =====================================================================
const MN_DUR = 24;
// ---------------------------------------------------------------- PLAN AS DATA
const MOON = { x: 135, y: 140, R: 64 }, MGL = 38;                    // moon; ground line of a memory, below its centre
const MN = {
  mage: { x: 118 },
  memories: [                                                        // each one plays inside the moon
    { id: 'magic',     from: 3.3,  to: 6.2,  cap: 'MAGIA' },
    { id: 'love',      from: 6.2,  to: 9.0,  cap: 'AMOR' },
    { id: 'pet',       from: 9.0,  to: 11.8, cap: 'AMISTAD' },
    { id: 'adventure', from: 11.8, to: 14.6, cap: 'AVENTURA' },
  ],
  tear: 15.1, book: 16.4, dissolve: .9,
  views: [
    { from: 0, size: 'wide' }, { from: 6.2, size: 'close', x: 68, y: 44, pan: 0 }, { from: 11.8, size: 'wide' },
    { from: 14.6, size: 'close', x: 52, y: 240, pan: 3 }, { from: 16.4 - .45, size: 'wide' },
  ],
  lines: [{ s: '"RECORDAR', c: 20 }, { s: 'ES VOLVER A PASAR', c: 20 }, { s: 'POR EL CORAZ^ON"', c: 31 }],
  author: '- EDUARDO GALEANO -', lineStart: 17.3, lineEvery: .75,
};
const B8f = (x, y) => B8(x, y);

// ---------------------------------------------------------------- text with a hand-drawn acute accent: ^ before the letter
function atext(x, y, str, c, o = {}) {
  const acc = []; let s = ''; for (const ch of str) { if (ch === '^') acc.push(s.length); else s += ch; }
  const sc = o.scale || 1, n = o.n ?? s.length, w = Pixel.textWidth(s, sc), x0 = Math.round(o.align === 'center' ? x - w / 2 : x);
  scr.text(x0, y, s.slice(0, n), c, { scale: sc, outline: o.outline });
  for (const i of acc) if (i < n) { const ax = x0 + i * 4 * sc; if (o.outline !== undefined) scr.rect(ax + sc - 1, y - 3 * sc - 1, 2 * sc + 2, 2 * sc + 1, o.outline); scr.rect(ax + 2 * sc, y - 3 * sc, sc, sc, c).rect(ax + sc, y - 2 * sc, sc, sc, c); }
  return { x0, w, len: s.length };
}

// ---------------------------------------------------------------- younger selves, the girl, the pet
const ML = {}, MS = {};
KINDS.kid = {
  leg: 6, tor: 8, customArm: true, body: 33, bodyShade: 34, belt: 35, legC: 21, legShade: 20, boot: 20, bootShade: 20, sleeve: 34, eye: 34,
  back() {},
  hair(g) { const { P, R, X, hy } = g; R(X - 5, hy - 1, 10, 3, 22); R(X - 6, hy + 1, 2, 5, 22); R(X - 5, hy + 2, 9, 1, 22); P(X + 4, hy + 3, 22); R(X - 5, hy - 1, 4, 1, 21); P(X - 2, hy - 2, 22); P(X + 1, hy - 2, 22); },
  front(g) {
    const { P, R, X, torY, pose } = g;
    if (pose === 'cast') { R(X + 2, torY, 3, 3, 34); R(X + 4, torY - 3, 3, 4, 34); R(X + 5, torY - 5, 2, 2, 28); for (let i = 0; i < 5; i++) P(X + 6 + i, torY - 6 - Math.round(i * 1.6), 23); }
    else { R(X - 1, torY + 1, 3, 5, 34); R(X - 1, torY + 5, 3, 2, 28); for (let i = 0; i < 6; i++) P(X + 2 + i, torY + 6 + (i >> 1), 23); }
  },
};
KINDS.girl = {
  leg: 7, tor: 9, robe: true, body: 41, bodyShade: 35, trim: 6, belt: 36, boot: 22, sleeve: 41, eye: 2,
  back(g) { const { R, X, hy, sway } = g; R(X - 8, hy + 2, 4, 16, 27); R(X - 8, hy + 2, 1, 16, 3); R(X - 8 - sway, hy + 17, 4, 3, 27); },
  hair(g) { const { P, R, X, hy } = g; R(X - 5, hy - 1, 10, 3, 27); R(X - 5, hy + 2, 10, 1, 27); P(X + 4, hy + 3, 27); P(X - 1, hy + 3, 27); R(X - 5, hy - 1, 4, 1, 3); P(X - 4, hy, 36); P(X - 5, hy + 1, 36); P(X - 3, hy + 1, 36); P(X - 4, hy + 2, 36); P(X - 4, hy + 1, 40); },
  front() {},
};
const recolor = (L, m) => ({ w: L.w, h: L.h, d: L.d.map(v => m[v] ?? v) });
function mkPet(squash) {
  const L = layer(18, 16), cy = squash ? 10 : 9, ry = squash ? 3 : 4;
  for (let y = -ry; y <= ry; y++) for (let x = -5; x <= 5; x++) if ((x / 5.3) ** 2 + (y / (ry + .3)) ** 2 <= 1) lp(L, 8 + x, cy + y, y > 1 ? 6 : 38);
  for (let k = 0; k < 4; k++) { for (let i = 0; i <= k; i++) { lp(L, 4 + i - (k >> 1), cy - ry - 3 + k, i === 1 && k > 1 ? 36 : 38); lp(L, 11 + i - (k >> 1), cy - ry - 3 + k, i === 1 && k > 1 ? 36 : 38); } }
  lp(L, 6, cy - 1, 30); lp(L, 10, cy - 1, 30); lp(L, 8, cy, 36);
  lr(L, 13, cy - 2, 2, 3, 40); lp(L, 15, cy - 3, 40); lp(L, 15, cy - 4, 42); lp(L, 14, cy - 3, 42);
  return outline(L, 30);
}
function buildMoon() {
  MS.kid = { stand: mkTraveler('kid', 0, 'stand'), cast: mkTraveler('kid', 0, 'cast') };
  const young = L => recolor(L, { 13: 22, 12: 21 });
  MS.young = { stand: young(SPR.mage.stand), walk: SPR.mage.walk.map(young) };
  MS.pack = MS.young.walk.map(L => { const c = { w: L.w, h: L.h, d: new Uint8Array(L.d) }; lr(c, 9, 33, 6, 9, 23); lr(c, 9, 33, 6, 1, 24); lr(c, 9, 37, 6, 1, 22); lr(c, 10, 30, 4, 3, 31); return outline(c, 30); });
  MS.girl = { stand: mkTraveler('girl', 0, 'stand'), walk: [0, 1, 2, 3].map(f => mkTraveler('girl', f, 'walk')) };
  MS.pet = [mkPet(false), mkPet(true)];
  // tall pines that frame the moon
  let L = layer(PW, PH); const r = Pixel.mulberry32(51);
  [[8, 250], [34, 200], [60, 150], [212, 160], [238, 215], [264, 260], [-8, 180], [282, 190]].forEach(([x, h], i) => pine(L, x, GROUND + 8, h, 600 + i, [14, 14, 25, 26]));
  ML.pines = L;
  // memory 1: a study
  L = layer(160, 160); const gl = 80 + MGL;
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) L.d[y * 160 + x] = y < gl ? (x % 16 === 0 ? 22 : ramp([22, 23, 23, 24], .55 + (hash(x >> 2, y >> 3, 3) - .5) * .4, x, y)) : (y === gl ? 20 : (x + (y >> 2) * 9) % 22 === 0 ? 20 : 21);
  lr(L, 98, 34, 40, 38, 21); for (let y = 0; y < 34; y++) for (let x = 0; x < 36; x++) lp(L, 100 + x, 36 + y, ramp([3, 4, 5], y / 34, x, y)); lr(L, 117, 36, 2, 34, 21); lr(L, 100, 52, 36, 2, 21); lr(L, 122, 40, 9, 9, 40);
  lr(L, 22, 40, 44, gl - 40, 21); for (let s = 0; s < 4; s++) { const sy = 44 + s * 19; lr(L, 25, sy, 38, 15, 20); for (let b = 0, x = 26; x < 60; b++) { const w = 3 + ((b * 7 + s * 3) % 3), h = 10 + ((b * 5 + s) % 5); lr(L, x, sy + 15 - h, w, h, [31, 2, 16, 35, 33, 37, 12][(b + s * 2) % 7]); lp(L, x, sy + 15 - h + 2, 6); x += w + 1; } }
  lr(L, 92, gl - 22, 46, 4, 23); lr(L, 92, gl - 22, 46, 1, 24); lr(L, 95, gl - 18, 3, 18, 22); lr(L, 132, gl - 18, 3, 18, 22);
  lr(L, 126, gl - 30, 3, 8, 6); lp(L, 127, gl - 32, 40); lp(L, 127, gl - 33, 39);
  ML.room = L;
  // memory 2: a cherry tree
  L = layer(160, 160);
  trunk(L, 36, 60, gl + 2, 5, 8, 71); const r2 = Pixel.mulberry32(72);
  for (let i = 0; i < 30; i++) { const a = r2() * TAU, d = Math.sqrt(r2()); blob(L, 40 + Math.cos(a) * 44 * d, 52 + Math.sin(a) * 30 * d, 9 + r2() * 9, 720 + i, [37, 37, 36, 36, 6], { tex: .4 }); }
  ML.cherry = L;
}
function heartM(x, y, s, c = 31) { ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') scr.rect(x + (i - 3) * s, y + j * s, s, s, c); })); scr.rect(x - 2 * s, y + s, s, s, 36); }
function bands(cols, cx, cy, R, gy) { const px = scr.px; for (let y = cy - R; y <= cy + R; y++) { if (y < 0 || y >= PH) continue; const v = (y - (cy - R)) / (gy - (cy - R)) * (cols.length - 1); for (let x = cx - R; x <= cx + R; x++) px[y * PW + x] = cols[clamp(Math.floor(v + bay(x, y) - .5 + .5), 0, cols.length - 1)]; } }
function grassM(cx, cy, R, gy, cols = [16, 17, 18]) { const px = scr.px; for (let y = gy; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) px[y * PW + x] = ramp(cols, .6 - (y - gy) / 40 + (hash(x, y, 7) - .5) * .5, x, y); }
const put = (S, x, y, flip) => blit(S, Math.round(x) - (flip ? SW - 1 - SX : SX), Math.round(y) - SFY, !!flip);

// ---------------------------------------------------------------- the four memories (drawn full colour, then masked into the moon)
const MEM = {
  magic(lt, t, cx, cy, R) {
    const gy = cy + MGL; blit(ML.room, cx - 80, cy - 80);
    const cast = lt > 1.1, hop = cast && lt < 1.5 ? -Math.round(Math.sin((lt - 1.1) / .4 * Math.PI) * 6) : 0, kx = cx - 8;
    const by = gy - 27 - (cast ? Math.round(Math.min(1, (lt - 1.1) * 2) * 12 + Math.sin(t * 4) * 2) : 0);            // the book lifts off the desk
    scr.rect(cx + 24, by, 12, 4, 31).rect(cx + 25, by + 1, 10, 2, 6); if (cast) { scr.dither(.5).circ(cx + 30, by + 2, 9, 38).dither(); }
    shadow(kx, gy, 7); put(cast ? MS.kid.cast : MS.kid.stand, kx, gy + hop);
    if (cast) { const tx = kx + 10, ty = gy - 27 + hop, g = Math.min(1, (lt - 1.1) * 2.5); scr.dither(.5).circ(tx, ty, 4 + g * 6, 38).dither(); scr.circ(tx, ty, 2, 42);
      for (let k = 0; k < 10; k++) { const a = k * TAU / 10 + t * 3, rr = g * (10 + (k % 3) * 6); scr.pset(tx + Math.cos(a) * rr, ty + Math.sin(a) * rr, k % 2 ? 42 : 40); if (k % 3 === 0) scr.pset(tx + Math.cos(a) * rr + 1, ty + Math.sin(a) * rr, 38); }
      if (lt < 2.1) scr.text(kx + 2, gy - 52, '!', 40, { scale: 2, align: 'center', outline: 30 }); }
  },
  love(lt, t, cx, cy, R) {
    const gy = cy + MGL; bands([33, 36, 36, 39, 40], cx, cy, R, gy);
    scr.circ(cx + 26, gy - 6, 20, 40).circ(cx + 26, gy - 6, 15, 42);
    grassM(cx, cy, R, gy); blit(ML.cherry, cx - 80, cy - 80);
    const p = inOutSine(seg(lt, .2, 1.3)), mx = lerp(cx - 34, cx - 13, p), gx = lerp(cx + 44, cx + 15, p), walking = p < 1;
    shadow(mx, gy, 8); shadow(gx, gy, 7);
    put(walking ? MS.young.walk[cyc(t * 8, 4)] : MS.young.stand, mx, gy); put(walking ? MS.girl.walk[cyc(t * 8 + 2, 4)] : MS.girl.stand, gx, gy, true);
    if (lt > 1.4) { const q = lt - 1.4; heartM(cx + 1, gy - 56 - Math.round(q * 9), q < .12 ? 1 : 2); for (let k = 0; k < 3; k++) { const pp = ((q * .7 + k / 3) % 1); scr.dither(1 - pp); heartM(cx + 1 + Math.sin(k * 2 + pp * 5) * 18, gy - 40 - pp * 40, 1, 36); scr.dither(); } }
    const r = Pixel.mulberry32(73); for (let i = 0; i < 22; i++) { const per = 2.5 + r() * 2, pp = ((t + r() * per) % per) / per, x = cx - 70 + r() * 150 + Math.sin(pp * 8 + i) * 8 + pp * 14, y = cy - 60 + pp * 110; scr.pset(x, y, 36); if (i % 2) scr.pset(x + 1, y, 6); }
  },
  pet(lt, t, cx, cy, R) {
    const gy = cy + MGL; bands([2, 3, 4, 5], cx, cy, R, gy);
    for (let i = 0; i < 3; i++) { const x = cx - 60 + ((i * 60 + t * 6) % 150), y = cy - 44 + i * 16; scr.elli(x, y, 34, 8, 6); scr.elli(x + 8, y - 4, 18, 8, 6); }
    grassM(cx, cy, R, gy, [16, 17, 18, 19]);
    const r = Pixel.mulberry32(74); for (let i = 0; i < 14; i++) { const x = cx - 60 + r() * 120, y = gy + 4 + r() * 20, c = [36, 35, 6][i % 3]; scr.pset(x, y, c).pset(x, y + 1, 16); }
    const mx = cx - 10; shadow(mx, gy, 8); put(MS.young.stand, mx, gy);
    const onHat = lt > 2.05, a = lt * 3.4;
    let px_ = cx + 16 + Math.cos(a) * 28, py = gy - 3 - Math.abs(Math.sin(lt * 7)) * 12;
    if (onHat) { const q = seg(lt, 2.05, 2.35); px_ = lerp(px_, mx - 2, q); py = lerp(py, gy - 52, q) - Math.sin(q * Math.PI) * 14; }
    for (let k = 1; k < 7; k++) { const aa = (lt - k * .05) * 3.4; if (!onHat) { scr.dither(1 - k / 7); scr.pset(cx + 16 + Math.cos(aa) * 28, gy - 6 - Math.abs(Math.sin((lt - k * .05) * 7)) * 12, k % 2 ? 38 : 42); scr.dither(); } }
    blit(MS.pet[cyc(t * 8, 2)], Math.round(px_) - 9, Math.round(py) - 14, Math.cos(a) < 0 && !onHat);
    if (lt > 1.0) for (let k = 0; k < 2; k++) { const pp = (((lt - 1) * .8 + k / 2) % 1); scr.dither(1 - pp); heartM(mx + 4 + k * 22, gy - 58 - pp * 22, 1, k ? 36 : 31); scr.dither(); }
  },
  adventure(lt, t, cx, cy, R) {
    const gy = cy + MGL, sc = lt * 34; bands([3, 4, 36, 41, 41], cx, cy, R, gy);
    scr.circ(cx - 30, gy - 8, 22, 40).circ(cx - 30, gy - 8, 16, 42);
    for (let i = 0; i < 2; i++) { const x = cx - 50 + ((i * 80 - t * 5) % 150 + 150) % 150, y = cy - 40 + i * 20; scr.elli(x, y, 32, 7, 6); }
    birds(t, cx - 60 + lt * 14, cy - 30, 3, 0);
    blitX(LY.hills, sc * .3, gy - 14 - GROUND + 26); blitX(LY.gMeadow, sc, gy - 14);
    const mx = cx - 4; shadow(mx, gy, 8); put(MS.pack[cyc(t * 8, 4)], mx, gy);
    blit(MS.pet[cyc(t * 6, 2)], mx - 34, gy - 40 + Math.round(Math.sin(t * 5) * 3));
    for (let k = 1; k < 5; k++) { scr.dither(1 - k / 5); scr.pset(mx - 30 - k * 4, gy - 30 + Math.sin((t - k * .06) * 5) * 3, k % 2 ? 38 : 42); scr.dither(); }
  },
};

// ---------------------------------------------------------------- the night scene
const memBuf = new Uint8Array(PW * PH);
function sceneNight(t, M = MOON, memories = true) {
  const px = scr.px, mem = memories && MN.memories.find(m => t >= m.from && t < m.to);
  let alpha = 0;
  if (mem) { scr.reset(); MEM[mem.id](t - mem.from, t, M.x, M.y, M.R); memBuf.set(px); alpha = seg(t, mem.from, mem.from + .4) * (1 - seg(t, mem.to - .3, mem.to)); scr.reset(); }
  for (let y = 0; y < PH; y++) { const v = y / PH * 2.4; for (let x = 0; x < PW; x++) px[y * PW + x] = v + bay(x, y) > 1.5 ? 1 : 0; }
  const r = Pixel.mulberry32(52);
  for (let i = 0; i < 80; i++) { const x = Math.floor(r() * PW), y = Math.floor(r() * 330), tw = cyc(t * 2.5 + r() * 9, 5); if (!tw) continue; scr.pset(x, y, 42); if (r() > .85 && tw > 2) scr.pset(x + 1, y, 8).pset(x - 1, y, 8).pset(x, y + 1, 8).pset(x, y - 1, 8); }
  const ss = seg(t, 1.6, 2.1); if (ss > 0 && ss < 1) for (let k = 0; k < 14; k++) { scr.dither(1 - k / 14); scr.pset(30 + ss * 90 - k * 2, 40 + ss * 40 - k * .9, 42); scr.dither(); }
  // the moon, plain; then the memory through it
  scr.dither(.3 + .06 * Math.sin(t * 1.5)).circ(M.x, M.y, M.R + 12, 1).dither(); scr.dither(.5).circ(M.x, M.y, M.R + 5, 26).dither();
  scr.circ(M.x, M.y, M.R, 7).circ(M.x, M.y, M.R - 3, 42);
  for (const [dx, dy, rr] of [[-.34, -.3, .16], [.3, .22, .2], [.4, -.36, .09], [-.2, .42, .12], [-.52, .1, .07]]) { scr.circ(M.x + dx * M.R, M.y + dy * M.R, rr * M.R, 7); scr.dither(.5).circ(M.x + dx * M.R + 1, M.y + dy * M.R + 1, rr * M.R * .7, 13).dither(); }
  if (mem) {
    for (let y = M.y - M.R; y <= M.y + M.R; y++) for (let x = M.x - M.R; x <= M.x + M.R; x++) { const d = Math.hypot(x - M.x, y - M.y); if (d > M.R - 2) continue; const a = alpha * (d > M.R - 9 ? (M.R - 2 - d) / 7 : 1); if (a > B8f(x, y)) px[y * PW + x] = memBuf[y * PW + x]; }
    for (let k = 0; k < 2; k++) { const lt = t - mem.from - k * .12; if (lt > 0 && lt < .6) { scr.dither(1 - lt / .6); scr.circb(M.x, M.y, M.R * (.3 + lt), 42); scr.dither(); } }
  }
  if (memories) for (const m of MN.memories) { const lt = t - m.from; if (lt > -.05 && lt < .7) for (let k = 0; k < 12; k++) { const a = k * TAU / 12 + lt * 2; scr.pset(M.x + Math.cos(a) * (M.R + 4 + lt * 16), M.y + Math.sin(a) * (M.R + 4 + lt * 16), k % 2 ? 42 : 38); } }
  // forest and the mage
  blit(LY.campFar, 0, memories ? 6 : 78); blit(ML.pines, 0, 0); blit(LY.gCamp, 0, GROUND);
  const mx = MN.mage.x, ox = mx + 9, oy = FEET - 43, pulse = .5 + .5 * Math.sin(t * 2.4);
  scr.dither(.22 + pulse * .08).elli(mx - 50, FEET - 8, 110, 22, 26).dither();
  shadow(mx, FEET, 8); blit(SPR.mage.stand, mx - SX, FEET - SFY);
  scr.dither(.3 + pulse * .15).circ(ox, oy, 11 + Math.round(pulse * 3), 38).dither(); scr.circ(ox, oy, 2, 42);
  if (cyc(t * 5, 3) === 0) scr.pset(ox - 4, oy, 42).pset(ox + 4, oy, 42).pset(ox, oy - 4, 42).pset(ox, oy + 4, 42);
  if (t >= MN.tear && t < MN.book + 1) { const lt = t - MN.tear; if (lt < .9) { scr.pset(mx + 4, FEET - 34 + Math.round(lt * lt * 30), 38); scr.pset(mx + 4, FEET - 35 + Math.round(lt * lt * 30), 6); } if (lt > .3 && lt < 1.6) { scr.dither(lt > 1.2 ? 1 - (lt - 1.2) / .4 : 1); heartM(mx - 8, FEET - 66 - Math.round(lt * 8), 1); scr.dither(); } }
  const r3 = Pixel.mulberry32(53);
  for (let i = 0; i < 16; i++) { const x = r3() * PW + Math.sin(t * (.5 + r3()) + i) * 12, y = 260 + r3() * 170 + Math.cos(t * (.4 + r3()) + i * 2) * 9, k = cyc(t * 3 + i * .7, 3); if (k) { scr.pset(x, y, 40); if (k === 1) scr.pset(x + 1, y, 19).pset(x - 1, y, 19).pset(x, y + 1, 19).pset(x, y - 1, 19); } }
  // caption under the moon: big in the wide shot, small in the close one (same size on screen)
  if (mem && alpha > .4) { const close = MN.views[MN.views.findLastIndex(v => t >= v.from)].size === 'close'; atext(M.x, M.y + M.R + (close ? 12 : 18), mem.cap, 6, { scale: close ? 2 : 4, align: 'center', outline: 30 }); }
}

// ---------------------------------------------------------------- the book
const MI = { x: 45, y: 46, w: 180, h: 200, sx: 45, sy: FEET - 190 }, miBuf = new Uint8Array(180 * 200);
function sceneBookM(t) {
  sceneNight(t, { x: 142, y: FEET - 138, R: 40 }, false);
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
  let y = 276;
  MN.lines.forEach((ln, i) => {
    const a = seg(t, MN.lineStart + i * MN.lineEvery, MN.lineStart + i * MN.lineEvery + .5), len = ln.s.replace(/\^/g, '').length, n = Math.ceil(len * a);
    if (a > 0) { const m = atext(131, y, ln.s, ln.c, { scale: 3, align: 'center', n }); if (a < 1) scr.rect(m.x0 + Pixel.textWidth('X'.repeat(n), 3) + 2, y, 2, 15, 31); }
    y += 26;
  });
  const aa = seg(t, MN.lineStart + 3 * MN.lineEvery + .3, MN.lineStart + 3 * MN.lineEvery + .8);
  if (aa > 0) { scr.dither(aa); scr.text(131, 366, MN.author, 22, { scale: 2, align: 'center' }); scr.dither(); }
  if (aa >= 1) { const beat = (t % 1) < .2 ? 3 : 2; heartM(131, 398 - (beat - 2) * 2, beat); scr.rect(70, 404, 40, 1, 21).rect(152, 404, 40, 1, 21); }
  scr.text(131, 436, '- 112 -', 22, { align: 'center' });
  for (let j = 0; j < 96; j++) { const x = 229 + Math.round(Math.sin(j * .07 + t * 1.5) * (j / 60)); scr.rect(x, 22 + j, 8, 1, j % 9 === 8 ? 32 : 31); scr.pset(x + 7, 22 + j, 32); }
  scr.tri(229, 118, 237, 118, 233, 112, 41);
}

// ---------------------------------------------------------------- frame
const mnA = new Uint8Array(PW * PH);
function mnDraw(t, ctx) {
  scr.reset();
  const d0 = MN.book - MN.dissolve / 2, d1 = MN.book + MN.dissolve / 2;
  if (t < d0) sceneNight(t);
  else if (t >= d1) sceneBookM(t);
  else { sceneNight(t); mnA.set(scr.px); sceneBookM(t); const p = (t - d0) / MN.dissolve, px = scr.px; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (p <= B8(x >> 1, y >> 1)) px[y * PW + x] = mnA[y * PW + x]; }
  const c = scr.render({ palette: PALETTE }), i = MN.views.findLastIndex(v => t >= v.from), v = MN.views[i];
  ctx.imageSmoothingEnabled = false;
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, 0, 0, W, H);
  else { const end = MN.views[i + 1].from, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, 0, 0, W, H); }
}

// ---------------------------------------------------------------- sound effects only
function mnAudio(ac, out, t0 = 0) {
  const at = x => t0 + x, r = Pixel.mulberry32(23);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.05, dur * .3))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'square', vib = 0) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = vib; lg.gain.value = f0 * .05; l.connect(lg).connect(o.frequency); l.start(at(t)); l.stop(at(t + dur)); } g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .02)); g.gain.setValueAtTime(gain, at(t + dur * .5)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  // night: wind, crickets, an owl
  { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain(); s.buffer = nb; s.loop = true; f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = .7; g.gain.value = .018; l.frequency.value = .2; lg.gain.value = .008; l.connect(lg).connect(g.gain); s.connect(f).connect(g).connect(out); s.start(at(0)); l.start(at(0)); s.stop(at(MN.book + .3)); l.stop(at(MN.book + .3)); }
  for (let t = .2; t < MN.book; t += .62 + r() * .2) { if (r() > .25) for (let k = 0; k < 3; k++) tone(t + k * .055, .035, 4300, 4300, .012 + r() * .008, 'square'); }
  const owl = t => { tone(t, .22, 330, 300, .06, 'sine', 6); tone(t + .32, .45, 300, 270, .07, 'sine', 6); };
  [1.0, 14.9].forEach(owl);
  noise(1.6, .5, 5000, 2500, .03);                                                                            // shooting star
  const shimmer = t => [1047, 1319, 1568, 2093].forEach((f, i) => tone(t + i * .07, .28, f, f, .05, 'triangle'));
  MN.memories.forEach(m => shimmer(m.from)); shimmer(14.6);
  const M = Object.fromEntries(MN.memories.map(m => [m.id, m.from]));
  Chip.sfx.powerup(ac, at(M.magic + 1.1), out, { gain: .22 }); [0, .12, .26].forEach(d => tone(M.magic + 1.25 + d, .1, 2600 + d * 4000, 3400 + d * 4000, .04, 'triangle'));
  [.3, .6, .9, 1.2].forEach(d => noise(M.love + d, .05, 700, 500, .05, 'lowpass')); Chip.sfx.coin(ac, at(M.love + 1.4), out, { gain: .16 }); tone(M.love + 1.75, .4, 1568, 1568, .04, 'triangle');
  [.2, .65, 1.1, 1.55].forEach((d, i) => { tone(M.pet + d, .07, 1800 + i * 150, 2600 + i * 150, .06, 'square'); tone(M.pet + d + .09, .06, 2400 + i * 150, 3000 + i * 150, .05, 'square'); });
  Chip.sfx.jump(ac, at(M.pet + 2.05), out, { gain: .14, pitch: 1.5 }); Chip.sfx.coin(ac, at(M.pet + 2.35), out, { gain: .12, seed: 3 });
  for (let d = .1; d < 2.6; d += .25) noise(M.adventure + d, .05, 900, 500, .05, 'lowpass');
  [.5, 1.6].forEach(d => { tone(M.adventure + d, .07, 2600, 3600, .04, 'square'); tone(M.adventure + d + .1, .06, 3000, 3900, .035, 'square'); });
  tone(MN.tear + .85, .09, 1900, 900, .07, 'sine'); Chip.sfx.coin(ac, at(MN.tear + .3), out, { gain: .08, seed: 5 });
  noise(MN.book - .3, .45, 3500, 900, .12); Chip.sfx.select(ac, at(MN.book + .15), out, { gain: .12 });       // the page
  MN.lines.forEach((ln, i) => { const n = ln.s.replace(/\^/g, '').length; for (let k = 0; k < n; k += 2) tone(MN.lineStart + i * MN.lineEvery + k * (.5 / n), .025, 1500 + (k % 3) * 120, 1300, .03, 'square'); });
  shimmer(MN.lineStart + 3 * MN.lineEvery + .8);
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * MN_DUR), sr);
  mnAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
