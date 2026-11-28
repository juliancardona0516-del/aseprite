// =====================================================================
// El reino, 2.ª parte — 22.5 s, 9:16. The duel goes on: several sword clashes; on the last one, locked blade to blade,
// the rōnin's pendant flares and projects a vision: the princess, a hostage of the Red Ogre in his black castle.
// They stop fighting ("no fuiste tú" / "¡vamos por ella!"), the party gathers, "CONTINUARÁ...".
// Sound effects only. Loads journey.js, pendant.js and kingdom.js (street, characters, bubbles, sparks).
// =====================================================================
const K2_DUR = 22.5;
// ---------------------------------------------------------------- PLAN AS DATA
const K2 = {
  hero: 184, ronin: 238,                                             // where they stand between blows
  clashes: [1.2, 2.0, 2.7, 3.5, 4.3, 5.0], lock: [5.6, 6.6], burst: 6.6,
  holo: [6.9, 13.6], help: [8.8, 10.6], laugh: 10.9, glitches: [8.1, 9.7, 11.6, 12.9],
  react: 6.9, stop: 7.6,
  say: [{ who: 'hero', s: 'NO FUISTE T^U...', at: 14.0, to: 15.6 }, { who: 'ronin', s: '¡VAMOS POR ELLA!', at: 15.8, to: 17.3 }],
  gather: [17.6, 19.2], freeze: 19.4, text: 19.8, end: 22.5,
  win: { x: 140, y: 236, w: 126, h: 110 },                           // the vision, above the two of them
  views: [{ from: 0, k: 2, x: 135, y: 230 }, { from: 17.5, k: 1 }],
};
const bump = (t, c, w = .18) => Math.exp(-(((t - c) / w) ** 2));
function duelAt(t) {                                                 // where the hero and the rōnin are, and how
  if (t < K2.lock[0]) { let h = 0, r = 0; K2.clashes.forEach((c, i) => { const b = bump(t, c); if (i % 2) { r += b * 20; h += b * 8; } else { h += b * 20; r += b * 8; } });
    return { hx: K2.hero + h, rx: K2.ronin - r, fight: t >= .8 }; }
  if (t < K2.burst) return { hx: 201 + Math.round(Math.sin(t * 40)), rx: 221 - Math.round(Math.sin(t * 37)), fight: true };
  const back = seg(t, K2.burst, K2.burst + .35);
  if (t < K2.gather[0]) return { hx: lerp(201, 188, back), rx: lerp(221, 236, back), fight: t < K2.stop };
  const g = inOutSine(seg(t, ...K2.gather)); return { hx: lerp(188, 196, g), rx: lerp(236, 222, g), fight: false, side: true };
}

// ---------------------------------------------------------------- the vision: the ogre and the princess as a cyan hologram
const HOLO = [0, 1, 3, 38, 42];                                      // dark -> bright
let OGRE = null, PRH = null;
function holoFromRGBA(data, w, h) {
  const L = layer(w, h);
  for (let i = 0; i < w * h; i++) { if (data[i * 4 + 3] < 128) continue; const lum = (.3 * data[i * 4] + .59 * data[i * 4 + 1] + .11 * data[i * 4 + 2]) / 255; L.d[i] = HOLO[Math.min(4, Math.floor(Math.pow(lum, .55) * 5.4))]; }
  return L;
}
function holoFromLayer(S) { const L = layer(S.w, S.h); for (let i = 0; i < S.d.length; i++) { const v = S.d[i]; if (v === 255) continue; const [r, g, b] = hex2(PALETTE[v]), lum = (.3 * r + .59 * g + .11 * b) / 255; L.d[i] = HOLO[Math.min(4, Math.floor(Math.pow(lum, .55) * 5.4))]; } return L; }
function buildKingdom2() {
  return new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    OGRE = holoFromRGBA(x.getImageData(0, 0, im.width, im.height).data, im.width, im.height); PRH = holoFromLayer(KGS.pr.fearN); res(); }; im.src = KG2_ASSETS.ogreRoar; });
}
function drawVision(t) {
  const W0 = K2.win, a = Math.min(seg(t, K2.holo[0], K2.holo[0] + .7), 1 - seg(t, K2.holo[1] - .7, K2.holo[1])); if (a <= 0) return;
  const V = layer(W0.w, W0.h);
  // the black castle: towers and spires in outline, lit windows
  for (const [x, w, h] of [[8, 18, 70], [32, 26, 92], [94, 22, 78], [114, 12, 56]]) { const y0 = W0.h - h; for (let y = y0; y < W0.h; y++) { lp(V, x, y, 1); lp(V, x + w - 1, y, 1); } for (let k = 0; k < 9; k++) { lp(V, x + w / 2 - (k * w / 18), y0 - 9 + k, 1); lp(V, x + w / 2 + (k * w / 18), y0 - 9 + k, 1); } for (let wy = y0 + 10; wy < W0.h - 10; wy += 16) lr(V, x + w / 2 - 1, wy, 2, 3, 3); }
  for (let x = 0; x < W0.w; x++) lp(V, x, W0.h - 1, 3);
  // the ogre, axe up, roaring; the princess caught by his outstretched hand
  const ox = 58, oy = W0.h - OGRE.h - 2; for (let y = 0; y < OGRE.h; y++) for (let x = 0; x < OGRE.w; x++) { const v = OGRE.d[y * OGRE.w + x]; if (v !== 255) lp(V, ox + x, oy + y, v); }
  const px = ox - 16, py = oy + 34 + Math.round(Math.sin(t * 6)); for (let y = 0; y < PRH.h; y++) for (let x = 0; x < PRH.w; x++) { const v = PRH.d[y * PRH.w + x]; if (v !== 255) lp(V, px + x, py + y, v); }
  // onto the screen: flicker, scanlines, glitches, a frame
  const glitch = K2.glitches.some(g => t >= g && t < g + .18), roll = Math.floor(t * 24);
  for (let y = 0; y < W0.h; y++) {
    const dx = glitch && hash(y >> 2, roll, 71) > .7 ? Math.round((hash(y, roll, 72) - .5) * 10) : 0, scan = (y + roll) % 3 === 0;
    for (let x = 0; x < W0.w; x++) { let v = V.d[y * W0.w + x]; const X = W0.x + x + dx, Y = W0.y + y;
      if (v === 255) { if (B8(X, Y) < a * .62) scr.pset(X, Y, (y + roll) % 3 === 0 ? 1 : 0); continue; }
      if (scan) v = v === 42 ? 38 : v === 38 ? 3 : 0; if (B8(X >> 0, Y) < a * (.75 + .25 * Math.sin(t * 31))) scr.pset(X, Y, v); }
  }
  for (const [cx, cy, sx, sy] of [[W0.x, W0.y, 1, 1], [W0.x + W0.w - 1, W0.y, -1, 1], [W0.x, W0.y + W0.h - 1, 1, -1], [W0.x + W0.w - 1, W0.y + W0.h - 1, -1, -1]]) { scr.rect(Math.min(cx, cx + sx * 8), cy, 9, 1, 38); scr.rect(cx, Math.min(cy, cy + sy * 8), 1, 9, 38); }
  if (t >= K2.help[0] && t < K2.help[1] && a > .8) say(W0.x + px + 14, W0.y + py - 12, '¡AYUDA!', 42, { scale: 1, align: 'center', outline: 0 });
  if (t >= K2.laugh && t < K2.laugh + 1.4 && a > .8) say(W0.x + ox + 30, W0.y + oy - 10, 'JO JO JO', 38, { scale: 1, align: 'center', outline: 0 });
}
function drawBeam(t, gx, gy) {                                       // the cone of light from the pendant up to the vision
  const W0 = K2.win, a = Math.min(seg(t, K2.burst, K2.holo[0] + .3), 1 - seg(t, K2.holo[1] - .7, K2.holo[1])); if (a <= 0) return;
  const top = W0.y + W0.h; for (let y = top; y < gy; y++) { const p = (y - top) / (gy - top), x0 = lerp(W0.x + 8, gx, p), x1 = lerp(W0.x + W0.w - 8, gx, p); for (let x = Math.round(x0); x <= x1; x++) if (B8(x, y) < a * (.18 + .1 * Math.sin(t * 9 + y * .3))) scr.pset(x, y, (x + y) & 1 ? 38 : 5); }
}

// ---------------------------------------------------------------- the street, the duel
function sceneDuel(t) {
  const px = scr.px; for (let y = 0; y < PH; y++) { const v = y / 300 * 3.2; for (let x = 0; x < PW; x++) px[y * PW + x] = [4, 5, 7, 7][Math.min(3, Math.floor(v + bay(x, y) * .8))]; }
  blit(KGL.street, 0, 0);
  for (const [x, s] of [[18, 1], [86, 2], [154, 3]]) { smokeUp(x, 300, t, s, .45); fireOn(x, 304, 9, t, s, .45); }
  // the rest of the party: first watching from the left, then gathering round
  const g = inOutSine(seg(t, ...K2.gather));
  KG.party.forEach(([k, x0], i) => { if (k === 'hero') return; const x = x0 + g * 62, walking = t >= K2.gather[0] && t < K2.gather[1]; shadow(x, STF, 8); blit(walking ? SPR[k].walk[cyc(t * 9 + i, 4)] : SPR[k].stand, x - SX, STF - SFY); if (t >= K2.react && t < K2.react + 1.2) bang(x + 2, STF - 52, 31); });
  // the two of them
  const D = duelAt(t), H = D.fight ? SPR.hero.cheer : (t >= K2.gather[0] && t < K2.gather[1] ? SPR.hero.walk[cyc(t * 8, 4)] : SPR.hero.stand);
  shadow(D.hx, STF, 8); blit(H, D.hx - SX, STF - SFY);
  const RS = D.fight ? KGS.rs.guard : (t >= K2.gather[0] && t < K2.gather[1] ? KGS.rs.run[cyc(t * 8, 4)] : KGS.rs.stand), flip = !D.side;
  shadow(D.rx, STF, 8); blit(RS, D.rx - (flip ? RW - 1 - RX : RX), STF - RF, flip);
  const gx = D.rx + (flip ? -2 : 2), gy = STF - 24, charge = seg(t, K2.lock[0], K2.burst);   // the pendant: it charges while the blades are locked
  glow(gx, gy, t >= K2.burst ? 4 : 3 + charge * 6, t >= K2.burst ? .7 : .45 + charge * .5); gemSmall(gx, gy);
  if (charge > 0 && charge < 1) for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + t * 5, r = 14 - charge * 10; scr.pset(gx + Math.cos(a) * r, gy + Math.sin(a) * r, 42); }
  // blows
  const cx = Math.round((D.hx + D.rx) / 2) + 2;
  K2.clashes.forEach(c => spark(cx, STF - 36, c, t));
  if (t >= K2.lock[0] && t < K2.burst) { spark(cx, STF - 36, K2.lock[0] + ((t - K2.lock[0]) % .25), t); }
  drawBeam(t, gx, gy); drawVision(t);
  if (t >= K2.react && t < K2.react + 1.1) { bang(D.hx + 2, STF - 56, 31); bang(D.rx, STF - 66, 31); }
  if (t >= K2.stop && t < K2.stop + 1.4) bang(D.hx + 2, STF - 56, 35, '!?');
  K2.say.forEach(b => { if (t >= b.at && t < b.to) { const n = Math.ceil(ACCENTS(b.s).length * seg(t, b.at, b.at + .5)); bubbleN(b.who === 'hero' ? D.hx + 4 : D.rx - 2, STF - 58, b.s, n); } });
}

// ---------------------------------------------------------------- frame
function k2Draw(t, ctx) {
  scr.reset();
  sceneDuel(t >= K2.freeze ? K2.freeze - .001 : t);
  if (t >= K2.freeze) { const px = scr.px, d = .6 * seg(t, K2.freeze, K2.freeze + .5); for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (B8(x >> 1, y >> 1) < d) px[y * PW + x] = 30; }
  for (const c of [...K2.clashes, K2.burst]) { const lt = t - c, len = c === K2.burst ? .25 : .08; if (lt >= 0 && lt < len) { const px = scr.px, k = .5 - lt / len * .5 + (c === K2.burst ? .4 : 0); for (let i = 0; i < px.length; i++) if (B8(i % PW >> 1, (i / PW | 0) >> 1) < k) px[i] = 42; } }
  if (t < .5) { const px = scr.px, p = t / .5; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (B8(x >> 1, y >> 1) > p) px[y * PW + x] = 30; }
  const c = scr.render({ palette: PALETTE }), v = K2.views[K2.views.findLastIndex(q => t >= q.from)];
  ctx.imageSmoothingEnabled = false;
  if (v.k === 1) ctx.drawImage(c, 0, 0, PW, PH, 0, 0, W, H);
  else { const cw = PW / v.k, ch = PH / v.k, shake = [...K2.clashes, K2.burst].some(q => t >= q && t < q + .2) ? Math.round(Math.sin(t * 90) * 2) : 0; ctx.drawImage(c, clamp(v.x + shake, 0, PW - cw), clamp(v.y, 0, PH - ch), cw, ch, 0, 0, W, H); }
  if (t >= K2.text) {                                                // "CONTINUARÁ..." over the frozen frame, at full size
    scr.reset(); const px = scr.px; px.fill(255);
    say(PW / 2, 220, 'CONTINUAR^A...', 35, { scale: 4, align: 'center', outline: 30, n: Math.ceil(13 * seg(t, K2.text, K2.text + 1.2)) });
    if (t >= K2.text + 1.6) { scr.dither(seg(t, K2.text + 1.6, K2.text + 2.1)); say(PW / 2, 262, 'PIXEL QUEST ADVENTURE', 6, { scale: 1, align: 'center' }); scr.dither(); }
    const o = scr.render({ palette: PALETTE }), oc = document.createElement('canvas'); oc.width = PW; oc.height = PH; const ox = oc.getContext('2d'); ox.drawImage(o, 0, 0);
    const id = ox.getImageData(0, 0, PW, PH); for (let k = 0; k < PW * PH; k++) if (px[k] === 255) id.data[k * 4 + 3] = 0; ox.putImageData(id, 0, 0);
    ctx.drawImage(oc, 0, 0, PW, PH, 0, 0, W, H);
  }
}

// ---------------------------------------------------------------- sound effects only
function k2Audio(ac, out, t0 = 0) {
  { const g = ac.createGain(); g.gain.value = 2.6; g.connect(out); out = g; }
  const at = x => t0 + x, r = Pixel.mulberry32(43);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
  const noise = (t, dur, f0, f1, gain, type = 'bandpass', q = 1) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + Math.min(.03, dur * .3))); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); s.connect(f).connect(g).connect(out); s.start(at(t), r() * 1.5); s.stop(at(t + dur + .05)); };
  const tone = (t, dur, f0, f1, gain, type = 'square') => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, at(t)); o.frequency.exponentialRampToValueAtTime(f1, at(t + dur)); g.gain.setValueAtTime(.0001, at(t)); g.gain.linearRampToValueAtTime(gain, at(t + .01)); g.gain.exponentialRampToValueAtTime(.0005, at(t + dur)); o.connect(g).connect(out); o.start(at(t)); o.stop(at(t + dur + .05)); };
  const bed = (a, b, f, q, g, type = 'bandpass') => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), v = ac.createGain(); s.buffer = nb; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; v.gain.setValueAtTime(.0001, at(a)); v.gain.linearRampToValueAtTime(g, at(a + .3)); v.gain.setValueAtTime(g, at(b - .4)); v.gain.linearRampToValueAtTime(.0001, at(b)); s.connect(fl).connect(v).connect(out); s.start(at(a)); s.stop(at(b)); };
  const clang = t => { [2300, 3100, 4200, 5300].forEach((f, i) => tone(t, .5 - i * .08, f, f * .98, .04 / (i + 1), 'triangle')); noise(t, .15, 7000, 3000, .12, 'highpass', .8); tone(t, .12, 160, 80, .08, 'triangle'); };
  bed(0, K2.freeze, 1600, .5, .015); bed(0, K2.freeze, 420, .7, .02);                                        // fire and wind
  for (const c of K2.clashes) { noise(c - .2, .2, 1500, 5000, .04, 'bandpass', 2); clang(c); }
  bed(K2.lock[0], K2.burst, 3500, 4, .05); for (let t = K2.lock[0]; t < K2.burst; t += .25) clang(t);          // locked: the blades grind
  { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(330, at(K2.lock[0])); o.frequency.exponentialRampToValueAtTime(1320, at(K2.burst)); g.gain.setValueAtTime(.0001, at(K2.lock[0])); g.gain.linearRampToValueAtTime(.05, at(K2.burst)); g.gain.linearRampToValueAtTime(.0001, at(K2.burst + .05)); o.connect(g).connect(out); o.start(at(K2.lock[0])); o.stop(at(K2.burst + .1)); }   // the pendant charges
  noise(K2.burst, .9, 6000, 400, .14, 'bandpass', .7); [1319, 1760, 2349, 3136, 3951].forEach((f, i) => tone(K2.burst + i * .06, .9, f, f, .035, 'triangle'));   // it bursts
  { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 110; g.gain.setValueAtTime(.0001, at(K2.holo[0])); g.gain.linearRampToValueAtTime(.012, at(K2.holo[0] + .6)); g.gain.setValueAtTime(.012, at(K2.holo[1] - .6)); g.gain.linearRampToValueAtTime(.0001, at(K2.holo[1])); o.connect(g).connect(out); o.start(at(K2.holo[0])); o.stop(at(K2.holo[1])); }   // the vision hums
  K2.glitches.forEach(g => { for (let k = 0; k < 4; k++) tone(g + k * .04, .03, 400 + r() * 1600, 300, .03, 'square'); });
  tone(K2.react, .12, 1200, 1200, .05); tone(K2.react + .15, .15, 1600, 1600, .05);                          // "!"
  tone(K2.help[0], .5, 900, 1700, .05, 'sine'); tone(K2.help[0] + .1, .4, 1300, 2000, .035, 'sine');        // her cry, far away
  for (let k = 0; k < 3; k++) tone(K2.laugh + k * .25, .2, 90, 65, .08, 'sawtooth');                       // the ogre laughs
  noise(K2.holo[1] - .6, .6, 3000, 200, .05); tone(K2.holo[1] - .5, .5, 800, 120, .04, 'triangle');          // the vision collapses
  tone(K2.stop, .12, 600, 900, .05); tone(K2.stop + .14, .2, 900, 600, .05);
  noise(K2.stop + .5, .3, 5000, 1500, .05, 'highpass'); noise(K2.stop + .7, .3, 4500, 1300, .05, 'highpass');   // the swords are sheathed
  K2.say.forEach(b => { const n = ACCENTS(b.s).length; for (let k = 0; k < n; k += 2) tone(b.at + k * (.5 / n), .03, b.who === 'hero' ? 900 : 600, b.who === 'hero' ? 800 : 520, .035, 'square'); });
  for (let t = K2.gather[0]; t < K2.gather[1]; t += .12) noise(t, .04, 600, 250, .03, 'lowpass');
  tone(K2.freeze + .05, 1.2, 55, 40, .2, 'sine'); noise(K2.freeze, .8, 300, 60, .1, 'lowpass');
  for (let k = 0; k < 13; k++) tone(K2.text + k * (1.2 / 13), .03, 1500 + (k % 3) * 120, 1300, .03, 'square');
  [523, 659, 784, 1047].forEach((f, i) => tone(K2.text + 1.4 + i * .1, .6, f, f, .035, 'triangle'));
}
window.__renderAudio = async () => {
  const sr = 48000, oac = new OfflineAudioContext(2, Math.ceil(sr * K2_DUR), sr);
  k2Audio(oac, master(oac));
  return encodeWavBase64(await oac.startRendering());
};
