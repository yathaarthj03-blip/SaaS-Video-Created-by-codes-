// 60s Spy Title Sequence Cut-Paper & 2D Silhouette Character Engine (1080x1920, 9:16)
// Four flat opaque inks, cached local-space scissor-cut edges, cut gaps, paper shadows,
// merged character silhouettes with joint slits on twos (12 fps), and paper fiber texture.

(function () {
  const W = 1080, H = 1920;
  const R = Math;

  // Four flat opaque inks + darker shadow-paper variants (no gradients)
  const C = {
    ink: '#1b1714',
    paper: '#efe4c9',
    red: '#d23a22',
    mus: '#e2a52a',
    redD: '#9a2a18',
    musD: '#b07e1c',
    paperD: '#d4c5a2',
    inkL: '#322b25'
  };

  function hash(n) {
    const x = R.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - R.floor(x);
  }
  function vnoise(x) {
    const i = R.floor(x), f = x - i;
    const u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  }

  let gMain = null;
  let g = null;
  const S = { bg: C.ink, gap: 2.8, shadow: true, shAlpha: 0.34, inLayer: false, slits: [] };

  function curScale(ctx = g) {
    const m = ctx.getTransform();
    return R.sqrt(R.abs(m.a * m.d - m.b * m.c)) || 1;
  }

  function clear(col) {
    S.bg = col;
    const m = g.getTransform();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = col;
    g.fillRect(0, 0, W, H);
    g.setTransform(m);
  }

  const cache = new Map();
  function rough(pts, seed = 1, amp = 1.6, step = 9, closed = true) {
    const n = pts.length, out = [];
    let s = 0;
    const E = closed ? n : n - 1;
    for (let i = 0; i < E; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = R.hypot(dx, dy) || 1e-6;
      const nx = -dy / L, ny = dx / L;
      const k = R.max(1, R.round(L / step));
      for (let j = 0; j < k; j++) {
        const u = j / k, ss = s + u * L;
        const w = j === 0 ? 0.25 : 1;
        let o = (vnoise(ss / (step * 2.3) + seed * 17.13) * 2 - 1) * amp * w;
        o += (vnoise(ss / (step * 0.55) + seed * 5.7) * 2 - 1) * amp * 0.35 * w;
        if (hash(R.floor(ss / (step * 3)) + seed * 91.7) > 0.962 && j > 0) o -= amp * 1.65;
        out.push([a[0] + dx * u + nx * o, a[1] + dy * u + ny * o]);
      }
      s += L;
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }

  function roughC(key, fn, seed = 1, amp = 1.6, step = 9) {
    let r = cache.get(key);
    if (!r) { r = rough(fn(), seed, amp, step); cache.set(key, r); }
    return r;
  }

  function pathPoly(ctx, pts) {
    if (!pts || !pts.length) return;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function piece(polys, col, opt = {}, ctx = g) {
    if (!Array.isArray(polys[0][0])) polys = [polys];
    const sc = curScale(ctx);
    ctx.beginPath();
    for (const p of polys) pathPoly(ctx, p);
    if (S.inLayer && !opt.force) {
      ctx.fillStyle = col;
      ctx.fill('evenodd');
      return;
    }
    const gap = opt.gap ?? S.gap;
    if (gap > 0 && opt.gapCol !== null) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = (gap * 2) / sc;
      ctx.strokeStyle = opt.gapCol || S.bg;
      ctx.stroke();
    }
    if (opt.shadow ?? S.shadow) {
      ctx.save();
      ctx.shadowColor = `rgba(18,10,4,${opt.shA ?? S.shAlpha})`;
      ctx.shadowBlur = opt.shB ?? 5;
      ctx.shadowOffsetX = opt.shX ?? 3.5;
      ctx.shadowOffsetY = opt.shY ?? 4.5;
      ctx.fillStyle = col;
      ctx.fill('evenodd');
      ctx.restore();
    } else {
      ctx.fillStyle = col;
      ctx.fill('evenodd');
    }
  }

  function rectP(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function circP(cx, cy, r, n = 0, a0 = 0) {
    n = n || R.max(20, R.round(r * 0.8));
    const o = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * R.PI * 2;
      o.push([cx + R.cos(a) * r, cy + R.sin(a) * r]);
    }
    return o;
  }
  function ellP(cx, cy, rx, ry, n = 36, rot = 0) {
    const o = [], c = R.cos(rot), s = R.sin(rot);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * R.PI * 2, x = R.cos(a) * rx, y = R.sin(a) * ry;
      o.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return o;
  }
  function smooth(pts, it = 2, closed = true) {
    for (let k = 0; k < it; k++) {
      const o = [], n = pts.length, E = closed ? n : n - 1;
      if (!closed) o.push(pts[0]);
      for (let i = 0; i < E; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      if (!closed) o.push(pts[n - 1]);
      pts = o;
    }
    return pts;
  }

  // Offscreen Silhouette Layer:
  // 1) All body pieces merge seamlessly on LC.
  // 2) LT builds the solid outer 8-direction outline BEFORE joint slits are cut,
  //    so internal joint slits never get double-outlined like a mannequin!
  // 3) Deferred joint slits are cut cleanly into LC, then LC is composited over LT.
  let LC = null, LT = null;
  function silhouette(fn, opt = {}) {
    if (S.inLayer) return fn();
    if (!LC) {
      LC = document.createElement('canvas'); LC.width = W; LC.height = H;
      LT = document.createElement('canvas'); LT.width = W; LT.height = H;
    }
    const L = LC.getContext('2d'), T2 = LT.getContext('2d'), main = g;
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.clearRect(0, 0, W, H);
    L.setTransform(main.getTransform());
    g = L; S.inLayer = true; S.slits = [];
    try { fn(); } finally { g = main; S.inLayer = false; }

    const r = opt.outline ?? 3.0;
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    if (r > 0) {
      T2.setTransform(1, 0, 0, 1, 0, 0);
      T2.globalCompositeOperation = 'source-over';
      T2.clearRect(0, 0, W, H);
      T2.drawImage(LC, 0, 0);
      T2.globalCompositeOperation = 'source-in';
      T2.fillStyle = opt.outlineCol || S.bg;
      T2.fillRect(0, 0, W, H);
      T2.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * R.PI * 2;
        main.drawImage(LT, R.cos(a) * r, R.sin(a) * r);
      }
    }
    // Now cut the crisp thin joint slits into LC so they show the ground outline cleanly
    for (const s of S.slits) {
      L.save();
      L.setTransform(s.m);
      L.translate(s.x, s.y);
      L.rotate(s.ang);
      L.globalCompositeOperation = 'destination-out';
      L.fillStyle = '#000';
      L.fillRect(-s.len / 2, -s.w / 2 / s.sc, s.len, s.w / s.sc);
      L.restore();
    }
    if (opt.shadow ?? true) {
      main.shadowColor = `rgba(18,10,4,${opt.shA ?? 0.36})`;
      main.shadowBlur = 6;
      main.shadowOffsetX = 4;
      main.shadowOffsetY = 5;
    }
    main.globalAlpha = opt.alpha ?? 1;
    main.drawImage(LC, 0, 0);
    main.restore();
  }

  function slit(x, y, ang, len, w = 1.9) {
    if (S.inLayer) {
      S.slits.push({ m: g.getTransform(), x, y, ang, len, w, sc: curScale() });
      return;
    }
    const sc = curScale();
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    g.fillRect(-len / 2, -w / 2 / sc, len, w / sc);
    g.restore();
  }

  // Paper Texture
  let tex = null, speck = null;
  function makeTex() {
    tex = document.createElement('canvas'); tex.width = W; tex.height = H;
    const t = tex.getContext('2d'), im = t.createImageData(W, H), d = im.data;
    let sd = 196401;
    const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    const lw = (W >> 3) + 2, lh = (H >> 3) + 2;
    const low = new Float32Array(lw * lh);
    for (let i = 0; i < low.length; i++) low[i] = rnd();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const gx = x / 8, gy = y / 8, ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy;
        const l = (low[iy * lw + ix] * (1 - fx) + low[iy * lw + ix + 1] * fx) * (1 - fy) +
                  (low[(iy + 1) * lw + ix] * (1 - fx) + low[(iy + 1) * lw + ix + 1] * fx) * fy;
        const v = 255 - (l * 15 + rnd() * 11);
        const i4 = (y * W + x) * 4;
        d[i4] = v; d[i4 + 1] = v - 1; d[i4 + 2] = v - 4; d[i4 + 3] = 255;
      }
    }
    t.putImageData(im, 0, 0);
    t.globalAlpha = 0.065; t.strokeStyle = '#6b5a40'; t.lineWidth = 1;
    for (let i = 0; i < 2400; i++) {
      const x = rnd() * W, y = rnd() * H, a = rnd() * 6.28, l = 6 + rnd() * 22;
      t.beginPath(); t.moveTo(x, y);
      t.quadraticCurveTo(x + R.cos(a + 0.6) * l * 0.5, y + R.sin(a + 0.6) * l * 0.5, x + R.cos(a) * l, y + R.sin(a) * l);
      t.stroke();
    }
    speck = document.createElement('canvas'); speck.width = W; speck.height = H;
    const s2 = speck.getContext('2d');
    s2.fillStyle = '#000'; s2.fillRect(0, 0, W, H);
    for (let i = 0; i < 7500; i++) {
      const x = rnd() * W, y = rnd() * H, r = rnd() < 0.9 ? 0.6 + rnd() * 0.9 : 1.5 + rnd() * 1.4;
      s2.fillStyle = `rgba(125,112,92,${0.24 + rnd() * 0.45})`;
      s2.beginPath(); s2.arc(x, y, r, 0, 7); s2.fill();
    }
    for (let y = 0; y < H; y += 3) {
      const a = vnoise(y / 37) * 0.045;
      s2.fillStyle = `rgba(90,80,64,${a})`;
      s2.fillRect(0, y, W, 3);
    }
  }

  function paperFinish(amt = 1) {
    if (!tex) makeTex();
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = amt; g.globalCompositeOperation = 'multiply'; g.drawImage(tex, 0, 0);
    g.globalAlpha = 0.52 * amt; g.globalCompositeOperation = 'screen'; g.drawImage(speck, 0, 0);
    g.restore();
  }

  // ============================================================================
  // 2D CUT-PAPER CHARACTER RIGS (Animated on Twos — 12 fps)
  // ============================================================================
  function limbP(len, w0, w1, cap0 = 0.5, cap1 = 0.5) {
    const a = w0 / 2, b = w1 / 2;
    return smooth([[-a, -a * cap0], [0, -a * cap0 * 1.6], [a, -a * cap0], [b * 1.05, len * 0.55], [b, len], [0, len + b * cap1 * 1.4], [-b, len], [-a * 1.05, len * 0.45]], 1);
  }
  function P(key, fn, seed, amp = 1.3, step = 9) { return roughC(key, fn, seed, amp, step); }
  function part(poly, col, tx, ty, rot, opt) { g.save(); g.translate(tx, ty); g.rotate(rot); piece(poly, col, opt); g.restore(); }

  const AG = { hipY: -282, torso: 168, thigh: 136, shin: 132, uarm: 112, farm: 96, shoulder: [2, -150] };
  const agJacket = () => [[-40, 46], [-30, -8], [-32, -96], [-30, -148], [-16, -170], [10, -178], [25, -170], [22, -152], [42, -128], [44, -92], [30, -26], [38, 22], [34, 40], [6, 36], [-12, 28], [-26, 50]];
  const agHead = () => [[-12, 6], [-13, -12], [-22, -24], [-31, -46], [-26, -70], [-6, -82], [16, -78], [27, -64], [30, -52], [27, -47], [31, -43], [44, -33], [44, -30], [31, -28], [33, -23], [29, -20], [32, -16], [26, -7], [15, -2], [10, 6]];
  const agBrim = () => [[-42, -63], [-22, -69], [14, -73], [44, -74], [55, -69], [48, -64], [18, -63], [-10, -61], [-34, -58]];
  const agCrown = () => smooth([[-27, -70], [-25, -93], [-15, -104], [-2, -98], [9, -104], [22, -99], [29, -72]], 1);
  const agFoot = () => [[-13, -8], [-15, 9], [44, 11], [56, 7], [44, -3], [16, -9]];
  const agHand = () => [[-7, -3], [8, -3], [8, 16], [2, 36], [-5, 21]];
  const agCollar = () => [[16, -170], [27, -164], [22, -150]];

  function ribbonPoly(fly, ph, len = 104, w0 = 8) {
    let x = 0, y = 0; const n = 10, L = [], Rr = [];
    const base = 0.15 + fly * 1.35;
    for (let i = 0; i <= n; i++) {
      const u = i / n, w = i === n ? 0.6 : (w0 - 2.2 * u) * (1 + 0.14 * R.sin(ph * 1.3 + u * 7));
      const a = base + R.sin(ph + u * 5.5) * (0.14 + R.abs(fly) * 0.48) * u;
      const dx = -R.sin(a), dy = R.cos(a);
      if (i > 0) { x += dx * len / n; y += dy * len / n; }
      L.push([x + dy * w, y - dx * w]); Rr.push([x - dy * w, y + dx * w]);
    }
    return { body: L.concat(Rr.reverse()), knot: [[-6, -4], [6, -4], [5, 8], [-5, 8]] };
  }

  const AGENT_POSE = {
    stand: { lean: 0, bob: 0, head: 0, thF: 0.04, knF: 0.02, ftF: 0, thB: -0.04, knB: 0.02, ftB: 0, shF: 0.05, elF: 0.12, shB: -0.04, elB: 0.1, tie: 0.15, tph: 0 },
    reach: { lean: 0.16, bob: 0, head: -0.32, thF: 0.42, knF: 0.75, ftF: 0.15, thB: -0.35, knB: 0.6, ftB: 0.3, shF: 1.75, elF: 0.25, shB: 0.3, elB: 0.8, tie: 0.85, tph: 2.2, eye: 'open' },
    sweep: { lean: 0.22, bob: 8, head: -0.1, thF: 0.55, knF: 0.3, ftF: -0.1, thB: -0.4, knB: 0.6, ftB: 0.2, shF: 1.45, elF: 0.25, shB: -0.7, elB: 0.5, tie: 0.9, tph: 3.1, eye: 'open' },
    gazeUp: { lean: -0.08, bob: 0, head: -0.42, thF: 0.18, knF: 0.1, ftF: 0, thB: -0.15, knB: 0.25, ftB: 0, shF: 0.35, elF: 1.1, shB: -0.2, elB: 0.3, tie: 0.25, tph: 1.4, eye: 'open' }
  };

  function walkPose(p, o = {}) {
    const f = p * R.PI * 2;
    const leg = (q) => {
      const s = R.sin(q);
      return [0.04 + 0.46 * s, 0.1 + 0.75 * R.pow(R.max(0, R.sin(q + 1.7)), 2), -0.05 + 0.32 * R.max(0, R.sin(q + 2.4))];
    };
    const [thF, knF, ftF] = leg(f), [thB, knB, ftB] = leg(f + R.PI);
    return {
      lean: o.lean ?? 0.08, bob: -7 * R.abs(R.cos(f)) + 3, head: o.head ?? 0,
      thF, knF, ftF, thB, knB, ftB,
      shF: (o.shF ?? 0.08) - 0.48 * R.sin(f), elF: o.elF ?? 0.4,
      shB: 0.08 + 0.48 * R.sin(f), elB: 0.38,
      tie: o.tie ?? 0.45, tph: f * 1.2, eye: o.eye
    };
  }

  function runPose(p, o = {}) {
    const f = p * R.PI * 2;
    const leg = (q) => {
      const s = R.sin(q);
      return [0.18 + 0.78 * s, 0.12 + 1.45 * R.pow(R.max(0, R.sin(q + 2.1)), 1.4) + 0.15 * R.max(0, -s), -0.05 + 0.65 * R.max(0, R.sin(q + 2.6))];
    };
    const [thF, knF, ftF] = leg(f), [thB, knB, ftB] = leg(f + R.PI);
    return {
      lean: o.lean ?? 0.28, bob: -14 * R.abs(R.cos(f)) + 6, head: -0.14,
      thF, knF, ftF, thB, knB, ftB,
      shF: 0.1 - 0.72 * R.sin(f), elF: 1.65 + 0.2 * R.sin(f),
      shB: 0.1 + 0.72 * R.sin(f), elB: 1.65 - 0.2 * R.sin(f),
      tie: o.tie ?? 0.82, tph: f * 1.4, eye: o.eye
    };
  }

  function agentSide(x, y, s, pose, opt = {}) {
    return silhouette(() => {
      const p = { ...AGENT_POSE.stand, ...pose };
      g.save();
      g.translate(x, y);
      g.scale(s * (opt.flip ? -1 : 1), s);
      const ink = opt.col || C.ink;
      const tieCol = opt.tieCol || C.red;
      const hip = [0, AG.hipY + p.bob], leanR = p.lean;
      const T = (px, py) => [hip[0] + px * R.cos(leanR) - py * R.sin(leanR), hip[1] + px * R.sin(leanR) + py * R.cos(leanR)];
      const sh = T(AG.shoulder[0], AG.shoulder[1]), neck = T(12, -170);

      const legAt = (th, kn, ft, key) => {
        const knee = [hip[0] + R.sin(th) * AG.thigh, hip[1] + R.cos(th) * AG.thigh], sa = th - kn;
        const ank = [knee[0] + R.sin(sa) * AG.shin, knee[1] + R.cos(sa) * AG.shin];
        part(P('agThigh', () => limbP(AG.thigh, 32, 21), 11), ink, hip[0], hip[1], -th);
        part(P('agShin', () => limbP(AG.shin, 21, 14), 12), ink, knee[0], knee[1], -sa);
        part(P('agFoot', agFoot, 13), ink, ank[0], ank[1], -sa + ft);
        slit(knee[0], knee[1], -sa, 24);
        if (key === 'F') slit(hip[0] + R.sin(th) * 44, hip[1] + R.cos(th) * 44, -th, 32);
      };
      const armAt = (shA, el, front) => {
        const elb = [sh[0] + R.sin(shA) * AG.uarm, sh[1] + R.cos(shA) * AG.uarm], fa = shA + el;
        const wr = [elb[0] + R.sin(fa) * AG.farm, elb[1] + R.cos(fa) * AG.farm];
        part(P('agUarm', () => limbP(AG.uarm, 26, 19), 21), ink, sh[0], sh[1], -shA);
        part(P('agFarm', () => limbP(AG.farm, 19, 15), 22), ink, elb[0], elb[1], -fa);
        part(P('agHand', agHand, 24), ink, wr[0] + R.sin(fa) * 4, wr[1] + R.cos(fa) * 4, -fa);
        if (front) {
          part(P('agCuff', () => [[-8, -2], [8, -2], [8, 3], [-8, 3]], 23, 0.5), C.paper, wr[0], wr[1], -fa);
          slit(sh[0] + R.sin(shA) * 10, sh[1] + R.cos(shA) * 10, -shA, 26);
        }
        slit(elb[0], elb[1], -fa, 22);
        return wr;
      };

      armAt(p.shB, p.elB, false);
      legAt(p.thB, p.knB, p.ftB, 'B');
      g.save(); g.translate(hip[0], hip[1]); g.rotate(leanR);
      piece(P('agJacket', agJacket, 31), ink);
      piece(P('agCollar', agCollar, 32, 0.5), C.paper, { gap: 0, shadow: false });
      g.restore();

      g.save(); g.translate(neck[0], neck[1]); g.rotate(p.head + leanR * 0.4);
      if (p.headFlip) g.scale(-1, 1);
      piece(P('agHead', agHead, 41, 1.0, 7), ink);
      if (p.eye || opt.eye) {
        piece([[15, -53], [26, -55], [25, -49], [15, -48]], C.paper, { gap: 0, shadow: false });
      }
      piece(P('agBrim', agBrim, 42, 0.9, 7), ink);
      piece(P('agCrown', agCrown, 43, 1.0, 7), ink);
      slit(1, -71.5, -0.035, 54, 2.2);
      g.restore();

      legAt(p.thF, p.knF, p.ftF, 'F');
      const ta = T(27, -160);
      g.save(); g.translate(ta[0], ta[1]); g.rotate(leanR * (1 - p.tie * 0.6));
      const tp = ribbonPoly(p.tie, p.tph, 102, 7.5);
      piece(rough(tp.body, 51, 0.6, 6), tieCol);
      piece(tp.knot, tieCol);
      g.restore();

      const wr = armAt(p.shF, p.elF, true);
      if (opt.briefcase) {
        g.save(); g.translate(wr[0], wr[1] + 18);
        piece(P('bcase', () => rectP(-36, 0, 72, 52), 55, 1.2, 8), opt.briefcase);
        slit(0, 0, 0, 28, 2.0);
        g.restore();
      }
      if (opt.sax) {
        g.save(); g.translate(neck[0] + 32, neck[1] + 18);
        piece(P('sax', () => [[-8, -22], [4, -22], [28, 38], [52, 18], [58, 42], [20, 62], [-4, 12]], 56, 1.2, 7), C.mus);
        g.restore();
      }
      g.restore();
    }, opt.sil);
  }

  // THE MYSTERY WOMAN
  const ladyDress = (flare = 0.25) => smooth([
    [-22, -168], [18, -168], [28, -124], [18, -72],
    [48 + flare * 36, 48], [6, 56], [-42 - flare * 42, 46],
    [-18, -72], [-26, -124]
  ], 1);
  const ladyHead = () => smooth([
    [-10, 6], [-14, -18], [-32, -46], [-38, -86], [-18, -112],
    [12, -106], [26, -82], [28, -56], [38, -42], [29, -34],
    [31, -22], [22, -10], [10, 6]
  ], 1);
  const ladyFoot = () => [[-10, -6], [-14, 10], [-8, 10], [-4, -1], [28, 9], [38, 5], [22, -6]];

  function ladySide(x, y, s, pose = {}, opt = {}) {
    return silhouette(() => {
      const p = { ...AGENT_POSE.stand, ...pose };
      g.save();
      g.translate(x, y);
      g.scale(s * (opt.flip ? -1 : 1), s);
      const ink = opt.col || C.ink;
      const scarfCol = opt.scarfCol || C.mus;
      const jewelCol = opt.jewelCol || C.paper;
      const hip = [0, -270 + (p.bob || 0)], leanR = p.lean || 0;
      const T = (px, py) => [hip[0] + px * R.cos(leanR) - py * R.sin(leanR), hip[1] + px * R.sin(leanR) + py * R.cos(leanR)];
      const sh = T(2, -148), neck = T(8, -166);

      const legAt = (th, kn, ft) => {
        const knee = [hip[0] + R.sin(th) * 130, hip[1] + R.cos(th) * 130], sa = th - kn;
        const ank = [knee[0] + R.sin(sa) * 128, knee[1] + R.cos(sa) * 128];
        part(P('ldThigh', () => limbP(130, 26, 17), 211), ink, hip[0], hip[1], -th);
        part(P('ldShin', () => limbP(128, 17, 11), 212), ink, knee[0], knee[1], -sa);
        part(P('ldFoot', ladyFoot, 213), ink, ank[0], ank[1], -sa + ft);
        slit(knee[0], knee[1], -sa, 22);
      };
      const armAt = (shA, el, front) => {
        const elb = [sh[0] + R.sin(shA) * 102, sh[1] + R.cos(shA) * 102], fa = shA + el;
        const wr = [elb[0] + R.sin(fa) * 92, elb[1] + R.cos(fa) * 92];
        part(P('ldUarm', () => limbP(102, 20, 15), 221), ink, sh[0], sh[1], -shA);
        part(P('ldFarm', () => limbP(92, 15, 11), 222), ink, elb[0], elb[1], -fa);
        part(P('ldHand', agHand, 224), ink, wr[0] + R.sin(fa) * 3, wr[1] + R.cos(fa) * 3, -fa);
        if (opt.singhaar) {
          part(P('bangle1', () => [[-9, -6], [9, -6], [9, -1], [-9, -1]], 225, 0.4), jewelCol, wr[0], wr[1], -fa);
          part(P('bangle2', () => [[-9, 2], [9, 2], [9, 7], [-9, 7]], 226, 0.4), scarfCol, wr[0], wr[1], -fa);
        }
        if (front) slit(sh[0] + R.sin(shA) * 9, sh[1] + R.cos(shA) * 9, -shA, 22);
        slit(elb[0], elb[1], -fa, 18);
      };

      armAt(p.shB, p.elB, false);
      legAt(p.thB, p.knB, p.ftB);
      legAt(p.thF, p.knF, p.ftF);

      const scPos = T(-4, -158);
      g.save(); g.translate(scPos[0], scPos[1]);
      const sp = ribbonPoly(p.tie ?? 0.75, p.tph ?? 1.5, 148, 13);
      piece(rough(sp.body, 251, 0.8, 7), scarfCol);
      g.restore();

      g.save(); g.translate(hip[0], hip[1]); g.rotate(leanR);
      piece(P('ldDress', () => ladyDress(0.25), 231), ink);
      slit(0, -72, 0.05, 40, 2.0);
      if (opt.singhaar) {
        piece(P('ldNecklace', () => [[-14, -162], [18, -162], [12, -148], [-8, -148]], 233, 0.5), jewelCol);
      }
      g.restore();

      g.save(); g.translate(neck[0], neck[1]); g.rotate((p.head || 0) + leanR * 0.4);
      if (p.headFlip) g.scale(-1, 1);
      piece(P('ldHead', ladyHead, 241, 0.9, 7), ink);
      piece([[12, -56], [26, -60], [23, -52], [12, -51]], C.paper);
      slit(-8, -76, -0.35, 34, 2.0);
      if (opt.singhaar) {
        piece(P('ldEarring', () => circP(-2, -32, 8, 12), 245, 0.4), jewelCol);
        piece(P('ldEarringDrop', () => [[-10, -24], [6, -24], [10, -12], [-14, -12]], 246, 0.4), scarfCol);
        piece(P('ldTikka', () => circP(24, -74, 5.5, 10), 247, 0.3), scarfCol);
      }
      g.restore();

      armAt(p.shF, p.elF, true);
      g.restore();
    }, opt.sil);
  }

  // Stylized 60s Cut-Paper Cat Silhouette (for nocturnal rooftop / street scenes)
  function catSilhouette(x, y, s, tailPh, outlineCol) {
    return silhouette(() => {
      g.save(); g.translate(x, y); g.scale(s, s);
      piece(P('catBody', () => smooth([[-28, 0], [-22, -48], [-8, -72], [14, -68], [22, -38], [26, 0]], 1), 301), C.ink);
      piece(P('catHead', () => [[-18, -68], [-22, -96], [-8, -82], [6, -82], [18, -96], [16, -66], [0, -58]], 302), C.ink);
      piece([[-12, -76], [-4, -74], [-8, -70]], C.mus);
      piece([[10, -76], [2, -74], [6, -70]], C.mus);
      // Waving tail
      const tx = 24 + R.sin(tailPh) * 18;
      piece(rough([[20, -8], [38, -28], [tx + 18, -68], [tx + 8, -72], [28, -32], [14, -4]], 303, 0.8, 6), C.ink);
      g.restore();
    }, { outlineCol });
  }

  // ============================================================================
  // ARCHITECTURAL CREDIT BLOCKS & HERO CUT-PAPER WORD PLAQUES
  // ============================================================================
  function drawCutBanner(text, cx, cy, w, h, plateCol, textCol, seed, rotDeg = -2.0) {
    g.save();
    g.translate(cx, cy);
    g.rotate((rotDeg * R.PI) / 180);
    const poly = roughC('ban_' + seed + '_' + w + '_' + h, () => rectP(-w / 2, -h / 2, w, h), seed, 2.2, 12);
    piece(poly, plateCol, { gap: 3.2, shadow: true });
    g.font = `800 ${R.round(h * 0.54)}px "Poppins", sans-serif`;
    g.fillStyle = textCol;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '3px';
    g.fillText(text, 0, 2);
    g.restore();
  }

  function drawWordBackingAt(t, words) {
    for (let i = 0; i < words.length; i++) {
      const [id, st, dur, txt] = words[i];
      if (t >= st && t <= st + dur) {
        const p = (t - st) / dur;
        const inP = R.min(1, p / R.min(0.25, 0.08 / dur));
        const outP = p > 0.82 ? R.max(0, (1 - p) / 0.18) : 1;
        const sc = (1.18 - 0.18 * inP) * (0.94 + 0.06 * outP);
        const charW = txt.length <= 3 ? 126 : (txt.length <= 5 ? 110 : (txt.length <= 7 ? 94 : 82));
        const pw = R.min(940, R.max(370, txt.length * charW + 86));
        const ph = txt.length <= 3 ? 236 : (txt.length <= 5 ? 214 : 190);
        const tilt = ((i % 2 === 0 ? -1 : 1) * (1.2 + (i % 3) * 0.6) * R.PI) / 180;
        const accentCol = (i % 2 === 0) ? C.red : C.mus;

        g.save();
        g.translate(540, 960);
        g.scale(sc, sc);
        g.rotate(tilt);
        const backPoly = roughC('wback2_' + i, () => rectP(-pw / 2 - 14, -ph / 2 + 12, pw + 28, ph + 10), 700 + i, 2.4, 11);
        piece(backPoly, accentCol, { gap: 3.0, shadow: true });
        const mainPoly = roughC('wback1_' + i, () => rectP(-pw / 2, -ph / 2, pw, ph), 800 + i, 2.2, 10);
        piece(mainPoly, C.ink, { gap: 3.2, shadow: true });
        const barPoly = roughC('wbar_' + i, () => rectP(-pw / 2 + 22, ph / 2 - 20, pw - 44, 9), 900 + i, 1.0, 8);
        piece(barPoly, accentCol, { gap: 0, shadow: false });
        g.restore();
        break;
      }
    }
  }

  // ============================================================================
  // 8 SCENE RENDERERS WITH MEANINGFUL & BACKGROUND 2D SILHOUETTE CHARACTERS
  // (Upper stage: y=210..810 | Center word plaque: y=840..1080 | Lower stage: y=1120..1860)
  // ============================================================================
  function drawScene(sceneIdx, t) {
    const t12 = R.floor(t * 12) / 12;

    if (sceneIdx === 0) {
      // INTRO (0.00 - 1.70s): Nocturnal Spy Street & Searchlight (Ground: Ink Black)
      clear(C.ink);
      piece(roughC('s0_beam', () => [[-80, 120], [1160, 480], [1160, 1520], [-80, 1080]], 10, 2.5, 14), C.mus);
      piece(roughC('s0_red', () => [[-60, 1380], [1140, 1220], [1140, 1960], [-60, 1960]], 11, 2.2, 14), C.red);
      drawCutBanner('A CUT-PAPER LYRIC SEQUENCE', 540, 130, 840, 68, C.paper, C.ink, 12, -1.8);

      // Upper stage: Mystery Woman on diagonal ledge + Rooftop Cat silhouette
      ladySide(780, 740, 0.72, { ...AGENT_POSE.stand, tie: 0.85, tph: t12 * 4, headFlip: true }, { col: C.ink, scarfCol: C.red, sil: { outlineCol: C.mus } });
      catSilhouette(240, 480, 1.15, t12 * 4, C.mus);

      // Lower stage: Agent striding across street beam on twos
      const wx = 240 + (t12 / 1.7) * 500;
      agentSide(wx, 1680, 0.90, walkPose(t12 * 1.6, { tie: 0.65, eye: 'open' }), { col: C.ink, tieCol: C.red, sil: { outlineCol: C.paper } });
    }
    else if (sceneIdx === 1) {
      // LINE 1 (1.70 - 6.26s): "Pal-pal jeena muhaal mera tere bina" (Ground: Paper Cream)
      clear(C.paper);
      piece(roughC('s1_bg1', () => rectP(-40, 190, 1160, 440), 20, 2.4, 14), C.paperD, { gap: 0, shadow: false });
      piece(roughC('s1_bg2', () => [[-40, 1420], [1120, 1280], [1120, 1950], [-40, 1950]], 21, 2.4, 14), C.ink);
      drawCutBanner('PAL-PAL JEENA MUHAAL MERA TERE BINA', 540, 120, 940, 66, C.ink, C.paper, 26, -1.2);

      // Background Commuter Courier with briefcase hurrying past upper left colonnade
      const bgX = 140 + ((t12 - 1.7) * 85) % 360;
      agentSide(bgX, 610, 0.52, walkPose(t12 * 1.8, { tie: 0.5 }), { col: C.ink, tieCol: C.mus, briefcase: C.red, sil: { outlineCol: C.paperD } });

      // Giant Scissor-Cut Clock Face at Upper Stage
      g.save(); g.translate(540, 485);
      piece(roughC('s1_clk', () => circP(0, 0, 250, 36), 22, 2.2, 10), C.mus);
      piece(roughC('s1_clkIn', () => circP(0, 0, 204, 32), 23, 1.8, 10), C.paper);
      for (let k = 0; k < 12; k++) {
        g.save(); g.rotate((k / 12) * R.PI * 2);
        piece(roughC('s1_tick' + k, () => rectP(-6, -190, 12, 30), 30 + k, 1.0, 8), C.ink, { gap: 0, shadow: false });
        g.restore();
      }
      g.save(); g.rotate(t12 * 1.4 - 0.8);
      piece(roughC('s1_h1', () => [[-11, 28], [11, 28], [5, -172], [-5, -172]], 24, 1.4, 8), C.red);
      g.restore();
      g.save(); g.rotate(t12 * 0.35 + 1.2);
      piece(roughC('s1_h2', () => [[-13, 22], [13, 22], [7, -120], [-7, -120]], 25, 1.4, 8), C.ink);
      g.restore();
      g.restore();

      // Mystery Woman on upper right clock ledge (y=720, well above center plaque)
      ladySide(835 - (t12 - 1.7) * 20, 725, 0.74, walkPose(t12 * 1.1, { tie: 0.9, eye: 'open' }), {
        flip: true, col: C.ink, scarfCol: C.red, sil: { outlineCol: C.paper }
      });

      // Lower Stage: Agent running & reaching (y=1740 -> head at ~1280, well below center plaque!)
      const agX = 220 + ((t12 - 1.7) / 4.5) * 520;
      const agPose = (t > 3.4 && t < 4.7) ? AGENT_POSE.reach : runPose(t12 * 1.5, { eye: 'open' });
      agentSide(agX, 1750 - ((t12 - 1.7) / 4.5) * 60, 0.88, agPose, {
        col: C.ink, tieCol: C.red, sil: { outlineCol: C.paper }
      });
    }
    else if (sceneIdx === 2) {
      // LINE 2 (6.36 - 8.52s): "Yeh saaray nashay bekaar" (Ground: Mustard Gold)
      clear(C.mus);
      piece(roughC('s2_wall', () => [[-40, 180], [1120, 310], [1120, 760], [-40, 620]], 40, 2.4, 14), C.musD, { gap: 0, shadow: false });
      piece(roughC('s2_bar', () => [[-60, 1440], [1140, 1310], [1140, 1960], [-60, 1960]], 41, 2.4, 14), C.ink);
      drawCutBanner('YEH SAARAY NASHAY BEKAAR', 540, 125, 860, 68, C.red, C.paper, 42, 1.5);

      // Background Jazz Saxophonist playing in the upper-left corner of the lounge!
      agentSide(155, 735, 0.62, { ...AGENT_POSE.stand, lean: -0.12, head: -0.2, shF: 0.8, elF: 1.1 }, {
        col: C.ink, tieCol: C.red, sax: true, sil: { outlineCol: C.paper }
      });

      // Tumbling Scissor-Cut Martini Glasses across Upper Stage
      const dt = R.max(0, t12 - 6.36);
      const glasses = [
        { x0: 360, y0: 470, vx: -35, vy: -30, vr: -1.8, col: C.paper },
        { x0: 590, y0: 420, vx: 30,  vy: -45, vr: 2.2,  col: C.red },
        { x0: 840, y0: 490, vx: 55,  vy: -25, vr: 1.5,  col: C.paper }
      ];
      glasses.forEach((gl, idx) => {
        g.save();
        g.translate(gl.x0 + dt * gl.vx, gl.y0 + dt * gl.vy + dt * dt * 36);
        g.rotate(dt * gl.vr + (idx - 1) * 0.35);
        piece(roughC('s2_gl' + idx, () => [[-85, -80], [85, -80], [7, 10], [7, 85], [46, 95], [-46, 95], [-7, 85], [-7, 10]], 45 + idx, 1.6, 8), gl.col);
        piece(roughC('s2_ol' + idx, () => circP(16, -42, 16, 14), 50 + idx, 1.0, 6), idx === 1 ? C.mus : C.red, { gap: 2 });
        g.restore();
      });

      // Lower Stage (y=1740, well below center word plaque!): Agent sweeping drinks away + Mystery Woman
      agentSide(300 + dt * 55, 1740, 0.88, AGENT_POSE.sweep, { col: C.ink, tieCol: C.red, sil: { outlineCol: C.paper } });
      ladySide(820, 1720, 0.84, { ...AGENT_POSE.stand, headFlip: true, tie: 0.75, tph: t12 * 3 }, {
        flip: true, col: C.ink, scarfCol: C.paper, sil: { outlineCol: C.red }
      });
    }
    else if (sceneIdx === 3) {
      // LINE 3 (8.60 - 10.74s): "teri aankhon ke siwa" (Ground: Signal Red)
      clear(C.red);
      piece(roughC('s3_band', () => [[-60, 260], [1140, 440], [1140, 1520], [-60, 1340]], 60, 2.5, 14), C.redD, { gap: 0, shadow: false });
      drawCutBanner('TERI AANKHON KE SIWA', 540, 125, 820, 68, C.ink, C.paper, 61, -1.5);

      // Giant Cut-Paper Eye at Upper Stage (y = 500)
      const blink = (t > 9.68 && t < 9.82) ? 0.25 : 1.0;
      g.save(); g.translate(540, 500); g.scale(1, blink);
      const eyeOuter = roughC('s3_eyeO', () => smooth([[-420, 0], [-205, -205], [0, -240], [205, -205], [420, 0], [205, 205], [0, 240], [-205, 205]], 2), 62, 2.2, 10);
      piece(eyeOuter, C.paper);
      piece(roughC('s3_iris', () => circP((t12 - 9.6) * 28, 0, 160, 28), 63, 1.8, 9), C.ink);
      piece(roughC('s3_pupil', () => circP((t12 - 9.6) * 36, 0, 74, 22), 64, 1.4, 8), C.mus);
      piece(roughC('s3_glint', () => rectP(-90, -90, 44, 44), 65, 1.0, 6), C.paper, { gap: 0, shadow: false });
      g.restore();

      // Lower Stage (y=1740): Agent transfixed, gazing at the Mystery Woman
      agentSide(270, 1740, 0.88, AGENT_POSE.gazeUp, { col: C.ink, tieCol: C.mus, sil: { outlineCol: C.paper } });
      ladySide(790, 1730, 0.88, { ...AGENT_POSE.stand, tie: 0.85, tph: t12 * 3.5 }, {
        flip: true, col: C.ink, scarfCol: C.mus, singhaar: true, sil: { outlineCol: C.paper }
      });
    }
    else if (sceneIdx === 4) {
      // LINE 4 (10.84 - 13.04s): "Ghar nahi jaata, mein bahar" (Ground: Ink Black)
      clear(C.ink);
      piece(roughC('s4_house', () => rectP(70, 290, 330, 480), 70, 2.0, 10), C.inkL);
      piece(roughC('s4_door', () => rectP(125, 345, 210, 405), 71, 1.8, 10), C.red);
      piece(roughC('s4_cone', () => [[780, 250], [1120, 1880], [260, 1880]], 72, 2.4, 14), C.mus);
      piece(roughC('s4_post', () => [[765, 220], [800, 220], [920, 1880], [885, 1880]], 73, 1.4, 10), C.ink);
      piece(roughC('s4_lamp', () => ellP(745, 235, 65, 26, 20, -0.2), 74, 1.2, 8), C.paper);
      drawCutBanner('GHAR NAHI JAATA · MEIN BAHAR', 540, 122, 900, 68, C.paper, C.ink, 75, -1.4);

      // Perched Cat silhouette on the house roof + background watcher
      catSilhouette(330, 290, 0.95, t12 * 3.5, C.paper);

      // Lower Stage (y=1750): Agent walking out of doorway into streetlamp cone
      const dt = R.max(0, t12 - 10.84);
      const ax = 260 + (dt / 2.2) * 440;
      agentSide(ax, 1750, 0.90, walkPose(t12 * 1.75, { lean: 0.14, tie: 0.65, eye: 'open' }), {
        col: C.ink, tieCol: C.red, sil: { outlineCol: C.paper }
      });
    }
    else if (sceneIdx === 5) {
      // LINE 5 (13.12 - 15.22s): "Rehta tera intezaar" (Ground: Paper Cream)
      clear(C.paper);
      piece(roughC('s5_diag', () => [[-40, 680], [1120, 240], [1120, 1950], [-40, 1950]], 80, 2.5, 14), C.ink);
      drawCutBanner('REHTA TERA INTEZAAR', 540, 122, 800, 68, C.red, C.paper, 81, 1.5);

      // Upper Window with Red Venetian Blinds & Mystery Woman silhouette inside
      piece(roughC('s5_win', () => rectP(540, 240, 410, 480), 82, 2.0, 10), C.mus);
      ladySide(745, 705, 0.72, { ...AGENT_POSE.stand, tie: 0.5, tph: t12 * 2 }, {
        flip: true, col: C.ink, scarfCol: C.red, sil: { outlineCol: C.paper }
      });
      for (let b = 0; b < 6; b++) {
        piece(roughC('s5_bl' + b, () => rectP(530, 250 + b * 46, 430, 19), 83 + b, 1.0, 8), C.red, { gap: 1.5 });
      }

      // Lower Stage: Agent waiting by station clock + background passerby with briefcase
      piece(roughC('s5_pil', () => rectP(140, 1220, 42, 660), 90, 1.4, 10), C.mus);
      piece(roughC('s5_pclk', () => circP(161, 1200, 70, 22), 91, 1.4, 8), C.paper);
      piece(roughC('s5_pclkIn', () => circP(161, 1200, 50, 18), 92, 1.2, 8), C.red);
      agentSide(380, 1760, 0.90, AGENT_POSE.gazeUp, { col: C.ink, tieCol: C.red, sil: { outlineCol: C.paper } });
      const pbx = 880 - ((t12 - 13.1) * 95);
      agentSide(pbx, 1690, 0.56, walkPose(t12 * 1.4, { tie: 0.4 }), { flip: true, col: C.inkL, tieCol: C.mus, briefcase: C.paperD, sil: { outlineCol: C.paper } });
    }
    else if (sceneIdx === 6) {
      // LINE 6 (15.32 - 17.52s): "Mere khuwabon main aa naa" (Ground: Ink Black — Surreal Dream Staircase)
      clear(C.ink);
      piece(roughC('s6_moon', () => circP(280, 440, 200, 32), 100, 2.0, 10), C.mus);
      piece(roughC('s6_moonCut', () => circP(352, 402, 156, 28), 101, 1.8, 10), C.ink, { gap: 0, shadow: false });

      for (let st = 0; st < 7; st++) {
        const sx = 220 + st * 105, sy = 730 - st * 52;
        piece(roughC('s6_st' + st, () => rectP(sx, sy, 145, 32), 102 + st, 1.4, 8), st % 2 === 0 ? C.paper : C.red);
        const sx2 = 140 + st * 110, sy2 = 1380 + st * 52;
        piece(roughC('s6_stb' + st, () => rectP(sx2, sy2, 155, 32), 110 + st, 1.4, 8), st % 2 === 0 ? C.mus : C.paper);
      }
      drawCutBanner('MERE KHUWABON MAIN AA NAA', 540, 122, 880, 68, C.red, C.paper, 118, -1.6);

      // Upper Stage: Mystery Woman descending dream staircase (y=580..700)
      const dt = R.max(0, t12 - 15.32);
      const lx = 780 - (dt / 2.2) * 190, ly = 570 + (dt / 2.2) * 120;
      ladySide(lx, ly, 0.78, walkPose(t12 * 1.4, { tie: 1.0, eye: 'open' }), {
        flip: true, col: C.ink, scarfCol: C.mus, singhaar: true, sil: { outlineCol: C.paper }
      });

      // Lower Stage: Agent reaching upward (y=1760 -> well below center word plaque!)
      agentSide(330 + (dt / 2.2) * 140, 1760, 0.88, AGENT_POSE.reach, {
        col: C.ink, tieCol: C.red, sil: { outlineCol: C.paper }
      });
    }
    else {
      // LINE 7 (17.60 - 20.00s): "kar ke solah singhaar" (Ground: Signal Red — Giant Gold Sun Circle Climax!)
      const tf = R.min(t12, 19.50);
      clear(C.red);
      for (let r = 0; r < 10; r++) {
        g.save(); g.translate(540, 960); g.rotate((r / 10) * R.PI * 2 + tf * 0.12);
        piece(roughC('s7_ray' + r, () => [[0, 0], [-95, -1200], [95, -1200]], 120 + r, 2.0, 14), C.redD, { gap: 0, shadow: false });
        g.restore();
      }

      piece(roughC('s7_sun', () => circP(540, 515, 290, 40), 131, 2.4, 10), C.mus);
      piece(roughC('s7_sun2', () => circP(540, 1500, 295, 40), 132, 2.4, 10), C.mus);
      for (let d = 0; d < 16; d++) {
        const a = (d / 16) * R.PI * 2 + tf * 0.3;
        const dx = 540 + R.cos(a) * 328, dy = 515 + R.sin(a) * 328;
        piece(roughC('s7_gem' + d, () => [[dx, dy - 15], [dx + 15, dy], [dx, dy + 15], [dx - 15, dy]], 140 + d, 0.9, 6), d % 2 === 0 ? C.paper : C.ink, { gap: 1.5 });
      }

      drawCutBanner('KAR KE SOLAH SINGHAAR', 540, 120, 840, 68, C.ink, C.paper, 160, 0);

      // Upper Circle: Mystery Woman in full Solah Singhaar adornment
      ladySide(560, 725, 0.84, { ...AGENT_POSE.stand, tie: 0.95, tph: tf * 3.5 }, {
        flip: true, col: C.ink, scarfCol: C.red, jewelCol: C.paper, singhaar: true, sil: { outlineCol: C.paper }
      });

      // Lower Circle: Agent & Mystery Woman meeting face-to-face
      const meet = R.min(1, R.max(0, (tf - 17.6) / 1.6));
      agentSide(335 + meet * 90, 1720, 0.88, walkPose(tf * 1.4, { tie: 0.55, eye: 'open' }), {
        col: C.ink, tieCol: C.red, sil: { outlineCol: C.paper }
      });
      ladySide(745 - meet * 90, 1720, 0.86, walkPose(tf * 1.4, { tie: 0.75, eye: 'open' }), {
        flip: true, col: C.ink, scarfCol: C.red, jewelCol: C.paper, singhaar: true, sil: { outlineCol: C.paper }
      });
    }
  }

  // Diagonal Strip-Shatter Transitions
  const transitions = [
    { t: 1.58, dur: 0.20, colA: C.red, colB: C.mus },
    { t: 6.20, dur: 0.22, colA: C.ink, colB: C.mus },
    { t: 8.46, dur: 0.20, colA: C.red, colB: C.ink },
    { t: 10.68, dur: 0.24, colA: C.ink, colB: C.mus },
    { t: 12.98, dur: 0.20, colA: C.paper, colB: C.red },
    { t: 15.16, dur: 0.22, colA: C.ink, colB: C.mus },
    { t: 17.46, dur: 0.20, colA: C.red, colB: C.mus }
  ];

  function drawShatterTransition(t) {
    for (let i = 0; i < transitions.length; i++) {
      const tr = transitions[i];
      if (t >= tr.t && t <= tr.t + tr.dur) {
        const p = (t - tr.t) / tr.dur;
        const env = R.sin(p * R.PI);
        g.save();
        g.translate(540, 960);
        g.rotate((30 * R.PI) / 180);
        const numStrips = 10;
        const stripW = 1600 / numStrips;
        for (let s = 0; s < numStrips; s++) {
          const dir = s % 2 === 0 ? 1 : -1;
          const slide = (1 - env) * dir * 1350;
          const x0 = -800 + s * stripW;
          const poly = roughC('shat_' + i + '_' + s, () => rectP(x0, -1300, stripW - 4, 2600), 600 + i * 20 + s, 2.2, 14);
          g.save();
          g.translate(0, slide);
          piece(poly, s % 2 === 0 ? tr.colA : tr.colB, { gap: 3.0, shadow: true });
          g.restore();
        }
        g.restore();
      }
    }
  }

  function getSceneIndex(t) {
    if (t < 1.68) return 0;
    if (t < 6.31) return 1;
    if (t < 8.56) return 2;
    if (t < 10.80) return 3;
    if (t < 13.08) return 4;
    if (t < 15.27) return 5;
    if (t < 17.56) return 6;
    return 7;
  }

  window.SpyEngine = {
    init(canvasEl) {
      gMain = canvasEl.getContext('2d');
      g = gMain;
    },
    renderAt(t, words) {
      if (!gMain) return;
      g = gMain;
      const scIdx = getSceneIndex(t);
      drawScene(scIdx, t);
      drawWordBackingAt(t, words);
      drawShatterTransition(t);
      paperFinish(1.0);
    }
  };
})();
