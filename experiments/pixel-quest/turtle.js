// =====================================================================
// The Turtle — 21 s. The five feast round a fire in a cave; the cave shakes; they are inside a giant
// dull-gold, bearded turtle with a forest and a Japanese village on its shell; it opens its mouth and they fall out.
// Sound effects only (no music). Reuses journey.js.
// =====================================================================
const TT_DUR = 21, TG = 446, TT_CUT_WIDE = 8.3;                                          // ground line outside
// ---------------------------------------------------------------- PLAN AS DATA
const TT = {
  rumble: 6.2, cut: 8.6, dissolve: .6, wake: 9.4, shake: [9.6, 10.3], open: 11.9, openDur: .6, release: 12.5, releaseEvery: .28,
  close: 16.0, blink: 16.9, sitUp: 17.6,
  shell: { cx: 96, cy: 384, rx: 124, ry: 130 }, head: { x: 212, y: 398 },
  views: [
    { from: 0, size: 'medium', x: 45, y: 150 }, { from: 2.5, size: 'close', x: 50, y: 236, pan: 3 }, { from: 4.3, size: 'close', x: 120, y: 236, pan: 3 }, { from: 6.0, size: 'medium', x: 45, y: 150 },
    { from: TT_CUT_WIDE, size: 'wide' }, { from: 11.4, size: 'close', x: 130, y: 240, pan: 2 }, { from: 14.4, size: 'wide' }, { from: 17.6, size: 'close', x: 135, y: 240, pan: 0 },
  ],
  shakes: [[6.2, 2.4, 2], [9.6, .7, 3]],
  seats: [['knight', 88, false], ['healer', 110, false], ['mage', 160, true], ['archer', 181, true], ['hero', 202, true]],
  laughs: [[1.2, 'hero'], [2.0, 'healer'], [3.4, 'archer'], [4.6, 'knight'], [5.3, 'hero'], [5.6, 'mage']],
  fall: [['hero', 0, -60], ['archer', 9, -46], ['healer', 18, -70], ['mage', 27, -52], ['knight', 36, -40]],   // kind, vx, vy
  gravity: 420,
};
const DG = [21, 23, 24, 24, 35], SHELL = [20, 21, 22, 23];           // dull-gold skin; the shell plates
const shellTop = x => { const S = TT.shell, u = (x - S.cx) / S.rx; return Math.abs(u) >= 1 ? S.cy : S.cy - S.ry * Math.sqrt(1 - u * u); };

// ---------------------------------------------------------------- half-size travelers for the outside shots
const HALF = {};
function halfSprite(L) { const w = L.w >> 1, h = L.h >> 1, o = layer(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const cs = [L.d[(2 * y) * L.w + 2 * x], L.d[(2 * y) * L.w + 2 * x + 1], L.d[(2 * y + 1) * L.w + 2 * x], L.d[(2 * y + 1) * L.w + 2 * x + 1]].filter(c => c !== 255); if (cs.length) o.d[y * w + x] = cs.find(c => c !== 30) ?? cs[0]; } return outline(o, 30); }
function blitRotS(L, cx, cy, ang, flip = false) {
  const px = scr.px, ca = Math.cos(-ang), sa = Math.sin(-ang), rad = Math.ceil(Math.hypot(L.w, L.h) / 2) + 1; cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= PW || Y >= PH) continue; let u = Math.floor(dx * ca - dy * sa + L.w / 2), v = Math.floor(dx * sa + dy * ca + L.h / 2); if (flip) u = L.w - 1 - u; if (u < 0 || v < 0 || u >= L.w || v >= L.h) continue; const c = L.d[v * L.w + u]; if (c !== 255) px[Y * PW + X] = c; }
}

// ---------------------------------------------------------------- set pieces
const TL2 = {};
function roofJ(L, cx, y, w, c1, c2) {                                // a Japanese roof: wide, curved, ends turned up
  for (let j = 0; j < 5; j++) { const hw = w / 2 + 3 - j * 1.2; for (let i = -hw; i <= hw; i++) { const lift = Math.max(0, Math.abs(i) - (hw - 4)) * .8; lp(L, cx + i, y + j - Math.round(lift) + (j === 0 ? 0 : 0), j === 0 ? c2 : c1); } }
}
function buildTurtle() {
  for (const k of ['hero', 'archer', 'healer', 'mage', 'knight']) HALF[k] = { stand: halfSprite(SPR[k].stand), walk: SPR[k].walk.map(halfSprite) };
  // ---- the cave (the turtle's mouth, though they don't know it)
  let L = layer(PW, PH);
  const warm = (x, y) => Math.max(0, 1 - Math.hypot(x - 135, y - (FEET - 20)) / 190);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const rib = Math.sin(y * .05 + Math.sin(x * .02) * 2) > .82 ? -.18 : 0;
    L.d[y * PW + x] = ramp([30, 20, 21, 32, 22], .08 + warm(x, y) * .9 + rib + (vnoise(x * .08, y * .05, 3) - .5) * .35, x, y);
  }
  for (let i = 0; i < 9; i++) { const x = 8 + i * 32 + (i % 2) * 6, len = 26 + (i % 3) * 14, w = 9 + (i % 2) * 3, top = 150; for (let yy = 0; yy < top; yy++) for (let dx = -w - 4; dx <= w + 4; dx++) if (yy > top - 6) lp(L, x + dx, yy, ramp([30, 20, 21], .3 + warm(x, yy) * .5, x + dx, yy)); for (let y0 = 0; y0 < len; y0++) { const y = top + y0; const hw = Math.max(1, w * (1 - y0 / len)); for (let dx = -hw; dx <= hw; dx++) lp(L, x + dx, y, ramp([10, 12, 13, 7], .4 - dx / hw * .3 + warm(x, y) * .6, x + dx, y)); } }   // "stalactites"
  for (let i = 0; i < 6; i++) { const x = 20 + i * 48, h = 10 + (i % 2) * 6; for (let y = 0; y < h; y++) { const hw = Math.max(1, 6 * (y / h)); for (let dx = -hw; dx <= hw; dx++) lp(L, x + dx, FEET + 30 - h + y, ramp([10, 12, 13], .35 - dx / hw * .3, x + dx, y)); } }
  for (let y = FEET - 8; y < PH; y++) for (let x = 0; x < PW; x++) L.d[y * PW + x] = ramp([20, 32, 37, 37], .25 + warm(x, y) * .8 + (hash(x >> 2, y >> 2, 5) - .5) * .3 - (y - FEET) / 300, x, y);   // a soft, pinkish floor
  TL2.cave = L;
  // ---- outside: the forest
  L = layer(PW, PH); const r = Pixel.mulberry32(141);
  for (let i = 0; i < 30; i++) { const x = r() * PW, h = 26 + r() * 40; lr(L, Math.round(x), Math.round(TG - h), 3, Math.round(h), 21); blob(L, x + 1, TG - h - 8, 15 + r() * 12, 1400 + i, RAMP.leafDark, { bias: -.05 }); blob(L, x - 9, TG - h + 2, 10 + r() * 6, 1440 + i, RAMP.leafDark, { bias: -.08 }); }
  haze(L, 26, .25); TL2.forest = L;
  // ---- the turtle body: legs, belly, shell, the village on top
  L = layer(PW, PH); const S = TT.shell;
  const skin = (x, y, lit, sd) => { const sc = ((x + ((y >> 2) & 1) * 3) % 6 === 0 || y % 4 === 0) ? -.12 : 0; lp(L, x, y, ramp(DG, lit + sc + (hash(x >> 1, y >> 1, sd) - .5) * .2, x, y)); };
  for (const [lx, lw] of [[6, 40], [134, 44]]) for (let y = S.cy + 4; y < TG; y++) for (let x = lx; x < lx + lw; x++) { const e = Math.min(x - lx, lx + lw - 1 - x); if (e < 1) { lp(L, x, y, 30); continue; } skin(x, y, .62 - (x - lx) / lw * .45 - (y - S.cy) / 400, 7); if (y > TG - 7 && (x - lx) % 10 < 6) lp(L, x, y, (x - lx) % 10 < 2 ? 12 : 13); }
  for (let y = S.cy; y < S.cy + 46; y++) for (let x = 0; x < 196; x++) { const d = ((x - 96) / 100) ** 2 + ((y - S.cy) / 46) ** 2; if (d > 1) continue; skin(x, y, .5 - (y - S.cy) / 80, 8); }
  for (let y = S.cy - 6; y < S.cy + 30; y++) for (let x = 168; x < 214; x++) { const cy = lerp(S.cy + 8, TT.head.y + 2, (x - 168) / 46), hh = lerp(26, 16, (x - 168) / 46); if (Math.abs(y - cy) > hh) continue; skin(x, y, .55 - (y - cy) / hh * .35, 9); if ((x - 168) % 9 === 0 && Math.abs(y - cy) < hh - 2) lp(L, x, y, 22); }   // neck
  for (let y = S.cy - S.ry; y <= S.cy + 2; y++) for (let x = S.cx - S.rx; x <= S.cx + S.rx; x++) {
    if (((x - S.cx) / S.rx) ** 2 + ((y - S.cy) / S.ry) ** 2 > 1) continue; const top = shellTop(x);
    const hx = Math.floor((x + 400) / 26), hy = Math.floor((y + ((hx & 1) ? 13 : 0)) / 22), edge = ((x + 400) % 26 < 2) || ((y + ((hx & 1) ? 13 : 0)) % 22 < 2);
    lp(L, x, y, y < top + 9 ? ramp([15, 16, 17, 18], .7 - (y - top) / 14, x, y) : edge ? 20 : ramp(SHELL, .95 - (y - top) / 200 - (x - S.cx) / S.rx * .2 + (hash(hx, hy, 3) - .5) * .25, x, y));
  }
  for (let x = S.cx - S.rx - 6; x <= S.cx + S.rx + 6; x++) for (let y = S.cy - 2; y < S.cy + 10; y++) lp(L, x, y + Math.round(Math.sin(x * .3) * 1.2), y < S.cy + 1 ? 35 : (x % 12 < 2 ? 21 : 23));   // the rim, scalloped
  // on the shell: trees, cherry blossoms, houses, a torii and a pagoda
  const onTop = x => Math.round(shellTop(x)) + 4;
  for (let i = 0; i < 40; i++) { const x = S.cx - S.rx + 6 + r() * (2 * S.rx - 12); blob(L, x, onTop(x) - 4 - r() * 6, 5 + r() * 6, 1500 + i, RAMP.leaf, { spark: true }); }
  for (const x of [8, 118, 182]) { lr(L, x, onTop(x) - 16, 2, 16, 21); blob(L, x + 1, onTop(x) - 22, 11, 1550 + x, [37, 37, 36, 36, 6], { tex: .4 }); blob(L, x - 7, onTop(x) - 16, 7, 1560 + x, [37, 36, 36, 6], { tex: .4 }); }
  const house = (x, w, h) => { const b = onTop(x + (w >> 1)) + 1; lr(L, x, b - h, w, h, 7); lr(L, x, b - h, 1, h, 21); lr(L, x + w - 1, b - h, 1, h, 21); lr(L, x + (w >> 1) - 2, b - 6, 4, 6, 21); lr(L, x + 2, b - h + 2, 3, 3, 40); roofJ(L, x + (w >> 1), b - h - 4, w, 11, 10); lp(L, x + w + 1, b - h - 1, 31); lp(L, x + w + 1, b - h, 40); };
  house(22, 16, 9); house(40, 14, 8); house(132, 16, 9); house(150, 14, 8); house(164, 12, 7);
  { const px = 76, base = onTop(px) + 2; [30, 25, 20, 15, 11].forEach((w, k) => { const y = base - 10 - k * 11; lr(L, px - (w >> 1) + 2, y, w - 4, 7, 7); lr(L, px - 1, y + 2, 2, 4, 21); roofJ(L, px, y - 4, w, 31, 32); }); lr(L, px, base - 74, 1, 12, 35); for (let k = 0; k < 4; k++) lp(L, px + (k % 2 ? 1 : -1), base - 72 + k * 3, 35); }   // pagoda
  { const tx = 112, b = onTop(tx) + 1; lr(L, tx - 9, b - 18, 2, 18, 31); lr(L, tx + 7, b - 18, 2, 18, 31); lr(L, tx - 11, b - 14, 22, 2, 31); for (let i = -14; i <= 14; i++) { lp(L, tx + i, b - 20 - (Math.abs(i) > 10 ? 1 : 0), 30); lp(L, tx + i, b - 19 - (Math.abs(i) > 10 ? 1 : 0), 31); } }   // torii
  for (let k = 0; k < 6; k++) { const x = 98 + k * 3; lr(L, x, onTop(x) - 1, 3, 1, 13); }
  TL2.body = L;
  // ---- ground in front
  L = layer(PW, PH - TG + 2);
  for (let y = 0; y < L.h; y++) for (let x = 0; x < PW; x++) L.d[y * PW + x] = ramp([15, 16, 17, 18], .6 + (hash(x, y, 9) - .5) * .6 - y / 60 + (y < 2 ? .3 : 0), x, y);
  for (let i = 0; i < 30; i++) { const x = r() * PW, y = 4 + r() * 28, c = [36, 35, 6][i % 3]; lp(L, x, y, c); lp(L, x, y + 1, 16); }
  TL2.ground = L;
}

// ---------------------------------------------------------------- the head: drawn every frame (eye, jaw, beard move)
function turtleHead(t, open, eye) {
  const { x: HX, y: HY } = TT.head, jaw = Math.round(open * 22);
  const skinP = (x, y, lit) => { const sc = ((x + ((y >> 2) & 1) * 3) % 6 === 0 || y % 4 === 0) ? -.1 : 0; scr.pset(x, y, ramp(DG, lit + sc, x, y)); };
  // mouth cavity (glowing: their fire is in there)
  if (jaw > 1) { for (let y = HY + 6; y < HY + 6 + jaw + 4; y++) for (let x = HX - 4; x < HX + 34; x++) { const p = (x - (HX - 4)) / 38; if (y > HY + 6 + jaw * (1 - p * .2) + 4) continue; scr.pset(x, y, x < HX + 8 && bay(x, y) < .5 + .2 * Math.sin(t * 9) ? 39 : (bay(x, y) < .2 ? 32 : 30)); } }
  // upper head
  for (let y = HY - 26; y <= HY + 6; y++) for (let x = HX - 26; x <= HX + 36; x++) { const d = ((x - HX) / 34) ** 2 + ((y - HY) / 26) ** 2; if (d > 1) continue; skinP(x, y, .5 - (y - HY) / 60 - (x - HX) / 140); if (d > .9) scr.pset(x, y, 21); }
  for (let x = HX - 26; x <= HX + 36; x++) scr.pset(x, HY + 6, 20);
  scr.pset(HX + 30, HY - 6, 20).pset(HX + 31, HY - 6, 20);                                                                      // nostril
  // jaw, hinged at the back
  for (let y = 0; y < 14; y++) for (let x = HX - 22; x <= HX + 32; x++) { const p = clamp((x - (HX - 22)) / 54), yy = HY + 7 + y + Math.round(jaw * p); const d = ((x - HX - 4) / 30) ** 2 + (y / 14) ** 2; if (d > 1) continue; skinP(x, yy, .38 - y / 30); if (d > .85) scr.pset(x, yy, 21); if (y === 0) scr.pset(x, yy, 20); }
  // beard, hanging from the jaw
  for (let s = 0; s < 14; s++) { const bx = HX - 2 + s * 2.6, p = clamp((bx - (HX - 22)) / 54), by = HY + 18 + Math.round(jaw * p), len = 18 + Math.sin(s * 1.7) * 6 + (s > 4 && s < 10 ? 16 : 0); for (let k = 0; k < len; k++) { const sw = Math.sin(t * 2 + s * .5 + k * .12) * k * .08; scr.pset(bx + sw - k * .12, by + k, k > len - 3 ? 12 : (s % 3 ? 6 : 7)); } }
  // eye and a bushy white brow
  const ex = HX + 14, ey = HY - 10;
  scr.circ(ex, ey, 7, 21);
  if (eye > .15) { const h = Math.round(6 * eye); scr.elli(ex - 6, ey - h, 13, h * 2 + 1, 6); scr.circ(ex + 1, ey, Math.min(3, h), 30); if (h > 2) scr.pset(ex, ey - 1, 6); }
  else scr.rect(ex - 6, ey, 13, 1, 20);
  for (let i = 0; i < 16; i++) scr.pset(ex - 8 + i, ey - 8 - Math.round(Math.sin(i / 15 * Math.PI) * 3) - (i % 3 === 0 ? 1 : 0), i % 2 ? 6 : 7).pset(ex - 8 + i, ey - 7 - Math.round(Math.sin(i / 15 * Math.PI) * 3), 7);
}

// ---------------------------------------------------------------- the fall
function fallState(i, t) {
  const [kind, vx, vy] = TT.fall[i], t0 = TT.release + i * TT.releaseEvery, lt = t - t0;
  if (lt < 0) return null;
  const x0 = TT.head.x + 34, y0 = TT.head.y + 12, g = TT.gravity, land = TG - 4 - (i % 2) * 2;
  const T = (-vy + Math.sqrt(vy * vy + 2 * g * (land - y0))) / g;
  if (lt < T) return { kind, x: x0 + vx * lt, y: y0 + vy * lt + .5 * g * lt * lt, ang: lt * (7 + i), air: true };
  const st = lt - T, bounce = st < .25 ? Math.sin(st / .25 * Math.PI) * 5 : 0;
  return { kind, x: x0 + vx * T, y: land - bounce, ang: (i % 2 ? 1 : -1) * Math.PI / 2, air: false, landed: t0 + T };
}

// ---------------------------------------------------------------- scenes
function fireAt(cx, fy, t, big = 1) {
  for (let x = -11; x <= 11; x++) { const h = ((1 - Math.abs(x) / 12) * (30 + 16 * vnoise(x * .35 + 40, t * 7, 3)) + 3) * big; for (let y = 0; y < h; y++) { const p = y / h, c = p < .28 ? 42 : p < .55 ? 40 : p < .8 ? 39 : 31; if (p > .7 && bay(x + 200, y + Math.floor(t * 20)) > .6) continue; scr.pset(cx + x + Math.round(Math.sin(y * .3 + t * 9) * (p * 2)), fy - y, c); } }
}
function sceneCave(t) {
  blit(TL2.cave, 0, 0);
  const fl = .5 + .5 * Math.sin(t * 11) * Math.sin(t * 7.3), rum = seg(t, TT.rumble, TT.rumble + .6);
  scr.dither(.12 + fl * .06).elli(135 - 90, FEET - 80, 180, 96, 39).dither(); scr.dither(.22).elli(135 - 36, FEET - 12, 72, 18, 40).dither();
  // the feast: seated, eating, laughing; up on their feet once it shakes
  TT.seats.forEach(([k, x, flip], i) => {
    const up = rum > 0, hop = up && t < TT.rumble + .4 + i * .05 ? Math.round(Math.sin(Math.min(1, (t - TT.rumble - i * .05) / .35) * Math.PI) * 6) : 0;
    const laugh = TT.laughs.some(([lt, who]) => who === k && t >= lt && t < lt + .9), bob = laugh ? cyc(t * 10, 2) : cyc(t * 1.6 + i * .37, 2);
    const y = up ? FEET - SFY - hop : FEET - SFY - 5 + bob;
    blit(SPR[k].stand, x - (flip ? SW - 1 - SX : SX), y, flip); extras({ kind: k }, t, x, up ? FEET - hop : FEET - 5, flip);
    if (!up) { const bite = ((t * .55 + i * .23) % 1) < .18, hx = x + (flip ? -9 : 9), hy = FEET - 30 - (bite ? 6 : 0); scr.rect(hx - 2, hy, 5, 4, 22).rect(hx - 1, hy + 1, 3, 2, 23).rect(hx, hy + 4, 1, 3, 6).pset(hx - 1, hy + 6, 6).pset(hx + 1, hy + 6, 6); }   // a drumstick
    if (laugh) { const lt = t - TT.laughs.find(([lt, who]) => who === k && t >= lt && t < lt + .9)[0]; scr.text(x + (flip ? -2 : 2), FEET - 66 - Math.round(lt * 8), 'HA', 40, { scale: 2, align: 'center', outline: 30 }); }
    if (up && t < TT.cut) scr.text(x + 2, FEET - 64 - hop, '!', 31, { scale: 2, align: 'center', outline: 30 });
  });
  blit(LY.campLogs, 0, 0);
  // fire with a spit of meat over it
  scr.rect(123, FEET - 4, 24, 4, 21).rect(126, FEET - 6, 18, 3, 22);
  fireAt(135 + (rum ? Math.round(Math.sin(t * 30) * 2) : 0), FEET - 6, t, 1 - rum * .25);
  scr.rect(112, FEET - 38, 2, 34, 21).rect(156, FEET - 38, 2, 34, 21).rect(108, FEET - 40, 54, 2, 22);
  for (let k = 0; k < 3; k++) { const mx = 120 + k * 12 + Math.round(Math.sin(t * 2 + k) * 0), my = FEET - 39; scr.elli(mx - 4, my - 3, 9, 8, k === 1 ? 31 : 22).pset(mx - 1, my - 1, 24).pset(mx, my - 2, 24); }
  const r = Pixel.mulberry32(13); for (let i = 0; i < 12; i++) { const per = 1.2 + r() * 1.4, p = ((t + r() * per) % per) / per, x = 135 + (r() - .5) * 16 + Math.sin(p * 7 + i) * 6 * p, y = FEET - 30 - p * 90; if (p < .9) scr.pset(x, y, p < .5 ? 40 : 39); }
  // the rumble: dust and pebbles from the "ceiling", the "stalactites" shiver
  if (rum > 0) { const r2 = Pixel.mulberry32(17); for (let i = 0; i < 50; i++) { const per = .7 + r2() * .8, p = ((t - TT.rumble + r2() * per) % per) / per, x = r2() * PW, y = 170 + p * (FEET - 170); scr.pset(x, y, i % 4 ? 12 : 13); if (i % 7 === 0) scr.rect(x, y, 2, 2, 10); } }
}
function sceneOutside(t) {
  const lt = t - TT.cut;
  sky();
  for (let i = 0; i < 3; i++) { const x = ((i * 120 + t * (3 + i)) % 380) - 60, y = 30 + i * 22; scr.elli(x, y, 56, 10, 6); scr.elli(x + 12, y - 5, 30, 10, 6); }
  blitX(LY.peaks, 30, 40); blitX(LY.hills, 40, 70); blit(TL2.forest, 0, 0);
  // the turtle: body shudders when it wakes
  const sh = t >= TT.shake[0] && t < TT.shake[1] ? Math.round(Math.sin(t * 40) * 2) : 0, lift = Math.round(seg(t, TT.wake, TT.wake + .6) * -4);
  blit(TL2.body, sh, lift);
  if (t >= TT.wake) { const r = Pixel.mulberry32(151); for (let i = 0; i < 12; i++) { const p = seg(t, TT.wake + .2 + r() * .3, TT.wake + 2 + r() * .5), x = 10 + r() * 180 + p * (30 + r() * 60), y = 170 + r() * 60 - p * 140 + Math.sin(p * 20 + i) * 3; if (p > 0 && p < 1) { const f = cyc(t * 8 + i, 2); scr.pset(x - 2, y + (f ? 0 : 1), 11).pset(x - 1, y + (f ? 1 : 0), 11).pset(x, y + (f ? 0 : 1), 11).pset(x + 1, y + (f ? 1 : 0), 11).pset(x + 2, y + (f ? 0 : 1), 11); } } }   // birds take off from the shell
  const lan = .5 + .5 * Math.sin(t * 3); for (const [x, y] of [[18, onTopL(18)], [154, onTopL(154)]]) { scr.dither(.3 + lan * .2).circ(x, y + lift, 3, 40).dither(); }
  // the head: asleep, waking, mouth opening, then closing; a blink at the end
  const eye = t < TT.wake ? 0 : t < TT.wake + .35 ? seg(t, TT.wake, TT.wake + .35) : (t >= TT.blink && t < TT.blink + .18 ? 0 : 1);
  const open = t < TT.open ? 0 : t < TT.close ? inOutSine(seg(t, TT.open, TT.open + TT.openDur)) : 1 - inOutSine(seg(t, TT.close, TT.close + .5));
  turtleHead(t, open, eye);
  if (t >= TT.wake && t < TT.wake + 1.2) scr.text(TT.head.x + 16, TT.head.y - 46, '!', 40, { scale: 2, align: 'center', outline: 30 });
  if (t < TT.wake) for (let k = 0; k < 3; k++) { const p = ((t * .5 + k / 3) % 1); scr.dither(1 - p * .8); scr.text(TT.head.x + 30 + p * 14, TT.head.y - 34 - p * 26, 'Z', 6, { scale: p > .5 ? 2 : 1, outline: 11 }); scr.dither(); }
  blit(TL2.ground, 0, TG - 2);
  // they tumble out
  const states = TT.fall.map((_, i) => fallState(i, t)).filter(Boolean);
  for (const s of states) {
    const H = HALF[s.kind];
    if (s.air) { blitRotS(H.stand, s.x, s.y - 10, s.ang); if (cyc(t * 6 + s.x, 3) === 0) scr.text(s.x + 10, s.y - 30, '!', 31, { scale: 1, outline: 30 }); }
    else if (t < TT.sitUp) { shadow(s.x, TG - 2, 6); blitRotS(H.stand, s.x, s.y - 5, s.ang); }
    else { shadow(s.x, TG - 2, 6); blit(H.stand, Math.round(s.x) - (SX >> 1), TG - (SFY >> 1) - 1); }
    if (!s.air && t - s.landed < .4) { const q = (t - s.landed) / .4; scr.dither(1 - q); scr.elli(s.x - 6 - q * 10, TG - 6 - q * 4, 12 + q * 20, 6 + q * 3, 12); scr.dither(); }
    if (!s.air) { const hx = s.x + (t < TT.sitUp ? (s.ang > 0 ? -8 : 8) : 0), hy = t < TT.sitUp ? s.y - 6 : TG - 28; for (let k = 0; k < 3; k++) { const a = t * 6 + k * TAU / 3; scr.pset(hx + Math.cos(a) * 6, hy - 4 + Math.sin(a) * 2, k % 2 ? 40 : 42); } }
  }
  if (t >= TT.sitUp + .4) { const hs = states.find(s => s.kind === 'hero'); if (hs) scr.text(hs.x + 1, TG - 40, '?', 6, { scale: 1, outline: 30 }); }
  const r3 = Pixel.mulberry32(153); for (let i = 0; i < 10; i++) { const per = 4 + r3() * 4, p = ((t + r3() * per) % per) / per, x = r3() * PW + Math.sin(p * 9 + i) * 10, y = 160 + p * 260; scr.pset(x, y, i % 2 ? 36 : 18); }
  for (let x = 0; x < PW; x += 1) { const b = (x * 37) % 11; if (b < 3) scr.pset(x, TG - 3 - b, 17); }
}
const onTopL = x => Math.round(shellTop(x)) - 10;

// ---------------------------------------------------------------- frame
const ttA = new Uint8Array(PW * PH);
function ttDraw(t, ctx) {
  scr.reset();
  const d0 = TT.cut - TT.dissolve / 2, d1 = TT.cut + TT.dissolve / 2;
  if (t < d0) sceneCave(t); else if (t >= d1) sceneOutside(t);
  else { sceneCave(t); ttA.set(scr.px); scr.reset(); sceneOutside(t); const p = (t - d0) / TT.dissolve, px = scr.px; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (p <= B8(x >> 1, y >> 1)) px[y * PW + x] = ttA[y * PW + x]; }
  const c = scr.render({ palette: PALETTE }), i = TT.views.findLastIndex(v => t >= v.from), v = TT.views[i];
  let dx = 0, dy = 0; for (const [t0, dur, amp] of TT.shakes) if (t >= t0 && t < t0 + dur) { const s = t0 === TT.rumble ? .5 + .5 * seg(t, t0, t0 + dur) : 1 - (t - t0) / dur; dx = Math.round(Math.sin(t * 95) * amp * s) * 4; dy = Math.round(Math.cos(t * 71) * amp * .7 * s) * 4; }
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#1a1228'; ctx.fillRect(0, 0, W, H);
  if (v.size === 'wide') ctx.drawImage(c, 0, 0, PW, PH, dx, dy, W, H);
  else if (v.size === 'medium') ctx.drawImage(c, v.x, v.y, 180, 320, dx, dy, W, H);
  else { const end = TT.views[i + 1] ? TT.views[i + 1].from : TT_DUR, pan = Math.round(lerp(-v.pan, v.pan, inOutSine(seg(t, v.from, end)))); ctx.drawImage(c, clamp(v.x + pan, 0, PW - 135), v.y, 135, 240, dx, dy, W, H); }
}

// ---------------------------------------------------------------- sound effects only
function ttAudio(ac, out, t0 = 0) {
  const at = x => t0 + x, r = Pixel.mulberry32(47);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.05, dur * .3))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'square', vib = 0) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = vib; lg.gain.value = f0 * .1; l.connect(lg).connect(o.frequency); l.start(at(t)); l.stop(at(t + dur)); } g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .02)); g.gain.setValueAtTime(gain, at(t + dur * .5)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  // in the cave: fire, crackle, chewing, laughter
  { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = 'lowpass'; f.frequency.value = 420; g.gain.setValueAtTime(.035, at(0)); g.gain.setValueAtTime(.035, at(TT.cut - .3)); g.gain.linearRampToValueAtTime(.0001, at(TT.cut + .2)); s.connect(f).connect(g).connect(out); s.start(at(0)); s.stop(at(TT.cut + .3)); }
  for (let t = .1; t < TT.cut; t += .07 + r() * .25) noise(t, .04, 1600 + r() * 3000, 900, .03 + r() * .05, 'bandpass', 3);
  for (let t = .4; t < TT.rumble; t += .5 + r() * .5) for (let k = 0; k < 2; k++) noise(t + k * .12, .05, 700, 400, .05, 'lowpass');
  TT.laughs.forEach(([t], i) => { const base = 520 + (i % 3) * 90; for (let k = 0; k < 3; k++) tone(t + k * .14, .1, base * (1 - k * .06), base * .9 * (1 - k * .06), .05, 'square'); });
  [1.6, 3.9].forEach(t => { tone(t, .06, 1800, 1800, .03, 'triangle'); tone(t + .07, .1, 2400, 2400, .025, 'triangle'); });   // mugs clink
  // the rumble
  tone(TT.rumble, TT.cut - TT.rumble + .4, 48, 36, .22, 'sawtooth'); noise(TT.rumble, TT.cut - TT.rumble + .3, 160, 90, .3, 'lowpass');
  for (let t = TT.rumble + .2; t < TT.cut; t += .18 + r() * .3) Chip.sfx.land(ac, at(t), out, { gain: .06 + r() * .05, pitch: .8 + r() * .8 });
  TT.seats.forEach((_, i) => Chip.sfx.blip(ac, at(TT.rumble + .05 + i * .05), out, { gain: .1, pitch: 1.5 + i * .1 }));
  // outside: forest, a waking giant
  { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = .6; g.gain.setValueAtTime(.0001, at(TT.cut)); g.gain.linearRampToValueAtTime(.018, at(TT.cut + .5)); s.connect(f).connect(g).connect(out); s.start(at(TT.cut)); s.stop(at(TT_DUR)); }
  const chirp = t => { tone(t, .07, 2600, 3600, .04, 'square'); tone(t + .1, .06, 3000, 3900, .035, 'square'); };
  [8.9, 18.2, 19.6].forEach(chirp);
  for (let k = 0; k < 3; k++) tone(.1 + TT.cut + k * 1.1 - .1, .5, 70, 60, .05, 'sine');                                                                    // slow snore-breaths
  tone(TT.wake, 1.0, 62, 80, .2, 'sawtooth', 4); noise(TT.wake, .8, 300, 150, .12, 'lowpass');                                                                // the groan
  for (let k = 0; k < 10; k++) noise(TT.wake + .25 + k * .07, .05, 2200, 1500, .04, 'bandpass', 2);                                                            // wings
  noise(TT.shake[0], .7, 200, 80, .2, 'lowpass');
  tone(TT.open, TT.openDur + .2, 90, 55, .2, 'sawtooth', 6); noise(TT.open, .8, 600, 200, .1, 'lowpass');                                                     // jaw creaks open
  TT.fall.forEach((_, i) => { const t = TT.release + i * TT.releaseEvery; tone(t, .7, 900 - i * 60, 300 - i * 20, .07, 'square'); const s = fallState(i, t + 3); if (s) { Chip.sfx.hit(ac, at(s.landed), out, { gain: .3, pitch: .7 + i * .06, seed: i + 1 }); noise(s.landed, .25, 400, 150, .12, 'lowpass'); } });
  tone(TT.close, .4, 70, 90, .15, 'sawtooth'); Chip.sfx.hit(ac, at(TT.close + .45), out, { gain: .2, pitch: .5 });                                            // jaw shuts
  for (let k = 0; k < 6; k++) tone(15.6 + k * .32, .1, 2300 + (k % 2) * 400, 2600 + (k % 2) * 400, .025, 'triangle');                                          // dizzy tweets
  Chip.sfx.blip(ac, at(TT.blink), out, { gain: .1, pitch: .6 });
  Chip.sfx.select(ac, at(TT.sitUp + .4), out, { gain: .12 });
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * TT_DUR), sr);
  ttAudio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
