// ============================================================================
// PAL PAL — 16:9 ILLUSTRATED TRITONE LYRIC VIDEO ENGINE (V2 — Sculpted Anatomy)
// Visual Style: Stippled Charcoal & Plaster Illustration (Reference Homage)
// Palette: Deep & Vibrant Orange + Golden Yellow Tint in Between + Baby Pink
// Aspect Ratio: 16:9 (1920 x 1080) @ 30fps
// ============================================================================
(function () {
  const W = 1920, H = 1080;
  const RW = 960, RH = 540;

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash2(x, y, s) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function vnoise(x, y, s) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s);
    const c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  function fbm(x, y, s, oct) {
    let v = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < oct; i++) {
      v += amp * vnoise(x * freq, y * freq, s + i * 31);
      freq *= 2.03;
      amp *= 0.5;
    }
    return v;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // ============================================================================
  // 1024-ENTRY TRITONE COLOUR LUT:
  // Deep Burnt Orange -> Vibrant Orange -> Golden Yellow Tint -> Lush Baby Pink
  // ============================================================================
  const LUT_SIZE = 1024;
  const TRITONE_LUT = new Uint32Array(LUT_SIZE);
  const INV_LUT = new Uint16Array(256);

  const STOPS = [
    { pos: 0.00, r: 24,  g: 6,   b: 5   }, // Deep espresso-burnt orange silhouette core
    { pos: 0.13, r: 95,  g: 22,  b: 10  }, // Dark burnt sienna shadow
    { pos: 0.28, r: 204, g: 58,  b: 18  }, // Rich deep orange
    { pos: 0.42, r: 250, g: 102, b: 30  }, // Vibrant sunset orange
    { pos: 0.54, r: 255, g: 182, b: 56  }, // Warm golden amber
    { pos: 0.64, r: 255, g: 220, b: 98  }, // Luminous yellow tint in between!
    { pos: 0.75, r: 254, g: 162, b: 190 }, // Rich baby pink
    { pos: 0.88, r: 255, g: 192, b: 214 }, // Soft pastel baby pink
    { pos: 1.00, r: 255, g: 234, b: 242 }  // Pale baby-pink blush highlight
  ];

  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    let s0 = STOPS[0], s1 = STOPS[STOPS.length - 1];
    for (let j = 0; j < STOPS.length - 1; j++) {
      if (t >= STOPS[j].pos && t <= STOPS[j + 1].pos) {
        s0 = STOPS[j];
        s1 = STOPS[j + 1];
        break;
      }
    }
    const u = smoothstep(s0.pos, s1.pos, t);
    const r = Math.round(lerp(s0.r, s1.r, u));
    const g = Math.round(lerp(s0.g, s1.g, u));
    const b = Math.round(lerp(s0.b, s1.b, u));
    TRITONE_LUT[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }

  for (let i = 0; i < 256; i++) {
    const norm = i / 255;
    const contrast = smoothstep(0.27, 0.62, norm);
    const inv = 1.0 - contrast;
    const tex = (1.0 - norm) * 0.12 + inv * 0.88;
    INV_LUT[i] = Math.round(clamp(tex, 0.02, 0.98) * (LUT_SIZE - 1));
  }

  // ============================================================================
  // PRE-BAKED TEXTURE BUFFERS
  // ============================================================================
  let plasterTex = null;
  let wallpaperTex = null;
  let foliageTex = null;
  let grainBanks = [];

  function initTextures() {
    if (plasterTex) return;

    plasterTex = new Float32Array(RW * RH);
    for (let y = 0; y < RH; y++) {
      for (let x = 0; x < RW; x++) {
        const n1 = fbm(x * 0.012, y * 0.012, 101, 4);
        const n2 = fbm(x * 0.045, y * 0.045, 202, 3);
        const n3 = vnoise(x * 0.18, y * 0.18, 303);
        const pit = hash2(x, y, 404) > 0.78 ? -0.12 : 0.04;
        plasterTex[y * RW + x] = clamp(n1 * 0.55 + n2 * 0.30 + n3 * 0.15 + pit, 0, 1);
      }
    }

    wallpaperTex = new Float32Array(RW * RH);
    for (let y = 0; y < RH; y++) {
      for (let x = 0; x < RW; x++) {
        const gx = Math.sin(x * 0.14) * Math.cos(y * 0.11);
        const floral = Math.sin((x + y) * 0.07) * Math.sin((x - y) * 0.07);
        const mott = fbm(x * 0.02, y * 0.02, 505, 3);
        const grain = (hash2(x, y, 606) - 0.5) * 0.18;
        wallpaperTex[y * RW + x] = clamp(0.48 + gx * 0.12 + floral * 0.08 + (mott - 0.5) * 0.35 + grain, 0, 1);
      }
    }

    foliageTex = new Float32Array(RW * RH);
    for (let y = 0; y < RH; y++) {
      const ny = y / RH;
      if (ny > 0.46) continue;
      for (let x = 0; x < RW; x++) {
        const nx = x / RW;
        const reach = 0.24 * Math.pow(1 - nx * 0.65, 1.3) + 0.09 * Math.sin(nx * 11) + 0.06 * Math.cos(nx * 23);
        const leafN = fbm(x * 0.055, y * 0.055, 707, 4);
        const stipple = hash2(x, y, 808);
        const d = (reach + (leafN - 0.45) * 0.22) - ny;
        if (d > 0) {
          foliageTex[y * RW + x] = clamp(d * 9.5 + (stipple - 0.35) * 0.6, 0, 1);
        }
      }
    }

    for (let b = 0; b < 4; b++) {
      const bank = new Int16Array(RW * RH);
      const seed = 900 + b * 111;
      for (let y = 0; y < RH; y++) {
        for (let x = 0; x < RW; x++) {
          const r1 = hash2(x, y, seed);
          const r2 = hash2(x >> 1, y >> 1, seed + 50);
          let g = (r1 - 0.5) * 32 + (r2 - 0.5) * 22;
          if (r1 > 0.94) g += 24;
          if (r1 < 0.06) g -= 26;
          bank[y * RW + x] = g | 0;
        }
      }
      grainBanks.push(bank);
    }
  }

  const lumCanvas = document.createElement('canvas');
  lumCanvas.width = RW; lumCanvas.height = RH;
  const lumCtx = lumCanvas.getContext('2d', { willReadFrequently: true });

  const prevLumCanvas = document.createElement('canvas');
  prevLumCanvas.width = RW; prevLumCanvas.height = RH;
  const prevLumCtx = prevLumCanvas.getContext('2d', { willReadFrequently: true });

  const lowOutCanvas = document.createElement('canvas');
  lowOutCanvas.width = RW; lowOutCanvas.height = RH;
  const lowOutCtx = lowOutCanvas.getContext('2d');
  const lowOutImg = lowOutCtx.createImageData(RW, RH);
  const lowOutU32 = new Uint32Array(lowOutImg.data.buffer);

  function gray(v, a = 1) {
    const c = clamp(Math.round(v), 0, 255);
    return a < 1 ? `rgba(${c},${c},${c},${a})` : `rgb(${c},${c},${c})`;
  }

  // ============================================================================
  // ANATOMICALLY SCULPTED HUMAN SILHOUETTE RIGS (Male & Female Profiles)
  // ============================================================================
  // Draws a realistic, expressive male silhouette in profile (origin at head top-center)
  function drawSculptedMale(g, x, y, scale, flip, opts = {}) {
    g.save();
    g.translate(x, y);
    g.scale(flip ? -scale : scale, scale);

    const col = opts.col || gray(10);
    const armAngle = opts.armAngle !== undefined ? opts.armAngle : 0.35;
    const stride = opts.stride || 0;
    const headTilt = opts.headTilt || 0;

    // 1. Sculpted Head, Hair & Facial Profile
    g.save();
    g.rotate(headTilt);
    g.fillStyle = col;
    g.beginPath();
    // Crown & tousled front hairlocks
    g.moveTo(-22, 6);
    g.bezierCurveTo(-26, -12, -14, -26, 6, -26);
    g.bezierCurveTo(22, -26, 32, -16, 30, -4); // Front hair wave
    g.lineTo(24, -1); // Forehead
    g.lineTo(28, 7);  // Nose bridge & tip
    g.lineTo(23, 10); // Philtrum
    g.lineTo(25, 13); // Upper lip
    g.lineTo(23, 16); // Lower lip
    g.lineTo(24, 21); // Chin
    g.quadraticCurveTo(14, 25, 6, 22); // Jawline
    g.lineTo(8, 36);  // Throat front
    g.lineTo(-12, 38); // Nape
    g.quadraticCurveTo(-24, 24, -22, 6);
    g.closePath();
    g.fill();
    g.restore();

    // 2. Tailored Jacket / Overcoat Torso with natural shoulder & chest taper
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(-14, 34); // Collar back
    g.lineTo(10, 34);  // Collar front
    g.quadraticCurveTo(26, 42, 28, 62); // Chest curve
    g.lineTo(24, 152); // Coat front hem
    g.lineTo(-24, 156); // Coat back hem
    g.quadraticCurveTo(-28, 95, -24, 48); // Upper back curve
    g.closePath();
    g.fill();

    // 3. Articulated Legs with natural thigh, knee, calf, and shoe profile
    const drawLeg = (hipX, hipAngle, kneeAngle) => {
      g.save();
      g.translate(hipX, 148);
      g.rotate(hipAngle);
      g.fillStyle = col;
      // Thigh
      g.beginPath();
      g.moveTo(-13, 0); g.lineTo(13, 0);
      g.lineTo(10, 68); g.lineTo(-10, 68);
      g.closePath();
      g.fill();
      // Calf & Shoe
      g.translate(0, 64);
      g.rotate(kneeAngle);
      g.beginPath();
      g.moveTo(-10, 0); g.lineTo(10, 0);
      g.lineTo(8, 66);
      g.lineTo(24, 72); // Shoe toe
      g.lineTo(24, 77);
      g.lineTo(-10, 77); // Heel
      g.closePath();
      g.fill();
      g.restore();
    };

    if (!opts.seated) {
      drawLeg(-4, -stride * 0.35, Math.max(0, stride * 0.25));
      drawLeg(4, stride * 0.35, Math.max(0.05, -stride * 0.2));
    } else {
      // Seated legs (thigh horizontal-ish, calf vertical)
      drawLeg(4, -1.35, 1.35);
      drawLeg(-2, -1.25, 1.28);
    }

    // 4. Sculpted Arm, Forearm & Hand
    if (opts.reachArm) {
      g.save();
      g.translate(8, 52);
      g.rotate(-0.55 - armAngle * 0.3);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-9, 0); g.lineTo(9, 0);
      g.lineTo(7, 52); g.lineTo(-7, 52);
      g.closePath();
      g.fill();
      g.translate(0, 48);
      g.rotate(-0.35);
      g.beginPath();
      g.moveTo(-7, 0); g.lineTo(7, 0);
      g.lineTo(5, 48);
      g.lineTo(9, 58); // Hand & fingers
      g.lineTo(2, 62);
      g.lineTo(-5, 48);
      g.closePath();
      g.fill();
      g.restore();
    } else {
      // Relaxed side arm
      g.save();
      g.translate(2, 52);
      g.rotate(0.12);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-9, 0); g.lineTo(9, 0);
      g.lineTo(12, 88); g.lineTo(-4, 88);
      g.closePath();
      g.fill();
      g.restore();
    }

    // Optional sunlit rim highlight along face & chest
    if (opts.rimLum) {
      g.strokeStyle = gray(opts.rimLum);
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(24, -2);
      g.lineTo(28, 7);
      g.lineTo(24, 21);
      g.moveTo(14, 38);
      g.quadraticCurveTo(27, 58, 24, 148);
      g.stroke();
    }

    g.restore();
  }

  // Draws a realistic, graceful female silhouette in profile (origin at head top-center)
  function drawSculptedFemale(g, x, y, scale, flip, opts = {}) {
    g.save();
    g.translate(x, y);
    g.scale(flip ? -scale : scale, scale);

    const col = opts.col || gray(10);
    const armAngle = opts.armAngle !== undefined ? opts.armAngle : 0.35;

    // 1. Sculpted Female Head, Hair Bun, Loose Tendrils & Delicate Profile
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(-18, 6);
    g.bezierCurveTo(-22, -10, -10, -22, 6, -22);
    g.bezierCurveTo(18, -22, 24, -12, 22, -2); // Forehead
    g.lineTo(26, 6);  // Delicate nose tip
    g.lineTo(21, 9);  // Upper lip
    g.lineTo(22, 12); // Lower lip
    g.lineTo(20, 18); // Chin
    g.quadraticCurveTo(10, 21, 4, 18); // Jawline
    g.lineTo(5, 34);  // Slender neck front
    g.lineTo(-9, 35); // Neck back
    g.quadraticCurveTo(-18, 22, -18, 6);
    g.closePath();
    g.fill();

    // Soft low hair bun at back of head
    g.beginPath();
    g.ellipse(-21, 8, 9, 11, -0.2, 0, Math.PI * 2);
    g.fill();

    // 2. Graceful Bodice & Flowing Long Skirt / Dress
    g.beginPath();
    g.moveTo(-11, 33);
    g.lineTo(8, 33);
    g.quadraticCurveTo(21, 46, 18, 66); // Bust & waist taper
    g.lineTo(13, 88); // Waist
    g.bezierCurveTo(26, 135, 38, 195, 44, 248); // Flowing skirt front
    g.lineTo(-34, 250); // Skirt back hem
    g.bezierCurveTo(-28, 190, -18, 130, -14, 88);
    g.quadraticCurveTo(-18, 58, -11, 33);
    g.closePath();
    g.fill();

    // Feet / ankles peeking below skirt
    g.fillRect(-12, 246, 7, 18);
    g.fillRect(8, 246, 7, 18);

    // 3. Slender Reaching or Relaxed Arm
    if (opts.reachArm) {
      g.save();
      g.translate(6, 46);
      g.rotate(-0.58 - armAngle * 0.25);
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-6, 0); g.lineTo(6, 0);
      g.lineTo(5, 46); g.lineTo(-5, 46);
      g.closePath();
      g.fill();
      g.translate(0, 44);
      g.rotate(-0.38);
      g.beginPath();
      g.moveTo(-5, 0); g.lineTo(5, 0);
      g.lineTo(4, 44);
      g.lineTo(8, 54); // Graceful hand
      g.lineTo(1, 56);
      g.lineTo(-4, 44);
      g.closePath();
      g.fill();

      // Optional glowing bangles on wrist
      if (opts.singhaar) {
        g.strokeStyle = gray(252);
        g.lineWidth = 2.4;
        g.beginPath();
        g.moveTo(-5, 34); g.lineTo(5, 34);
        g.moveTo(-5, 39); g.lineTo(5, 39);
        g.stroke();
      }
      g.restore();
    }

    // Optional Solah Singhaar jewelry & flowing Dupatta veil
    if (opts.singhaar) {
      // Glowing Maang Tikka on forehead & Jhumka Earring
      g.fillStyle = gray(254);
      g.beginPath();
      g.arc(22, -3, 3.2, 0, Math.PI * 2); // Maang tikka
      g.arc(2, 16, 4.8, 0, Math.PI * 2);  // Jhumka dome
      g.fill();
      g.fillRect(-3, 21, 10, 3.5); // Jhumka drops

      // Translucent flowing Dupatta scarf drifting behind/across
      g.fillStyle = gray(48, 0.55);
      g.beginPath();
      g.moveTo(-8, 12);
      g.bezierCurveTo(-55, 38, -95, 78, -125, 112);
      g.bezierCurveTo(-75, 138, -25, 108, 12, 68);
      g.closePath();
      g.fill();
    }

    g.restore();
  }

  // ============================================================================
  // SCENE 1A ("Pal-pal jeena muhaal" — Reference Image Frame 1 Homage)
  // ============================================================================
  function drawSeatedManAtWindow(g, t) {
    const breathe = Math.sin(t * 2.2) * 2.0;

    // 1. Interior Wall with Bright Baby-Pink & Yellow-Tinted Glow near the window
    g.fillStyle = gray(170);
    g.fillRect(0, 0, RW, RH);

    const wallGrad = g.createRadialGradient(220, 175, 20, 240, 250, 440);
    wallGrad.addColorStop(0, gray(248, 0.92)); // Baby pink highlight on upper left wall!
    wallGrad.addColorStop(0.5, gray(185, 0.7)); // Golden yellow transition
    wallGrad.addColorStop(1, gray(42, 0.92));   // Deep orange corners
    g.fillStyle = wallGrad;
    g.fillRect(0, 0, RW, RH);

    // Lower wainscot wall molding
    g.fillStyle = gray(24);
    g.fillRect(0, 392, RW, 148);
    g.fillStyle = gray(72);
    g.fillRect(0, 388, RW, 5);

    // 2. Large 3-Pane Window on Right (x: 295..895, y: 12..392)
    g.fillStyle = gray(14);
    g.fillRect(290, 8, 610, 386);
    g.strokeStyle = gray(78);
    g.lineWidth = 2.5;
    g.strokeRect(296, 14, 598, 374);

    const panes = [
      { x: 308, w: 184 },
      { x: 504, w: 184 },
      { x: 700, w: 184 }
    ];
    panes.forEach((p, idx) => {
      g.save();
      g.beginPath();
      g.rect(p.x, 22, p.w, 354);
      g.clip();

      // Bright Baby-Pink -> Golden-Yellow -> Deep Orange window sky gradient
      const skyG = g.createLinearGradient(p.x, 22, p.x + p.w * 0.8, 376);
      skyG.addColorStop(0, gray(236 - idx * 14));   // Baby Pink upper pane glow
      skyG.addColorStop(0.48, gray(172 - idx * 10)); // Golden Yellow mid pane
      skyG.addColorStop(1, gray(52));                // Deep Orange lower pane
      g.fillStyle = skyG;
      g.fillRect(p.x, 22, p.w, 354);

      // Volumetric Diagonal Shafts of Baby Pink Light cutting through the rain
      g.save();
      g.translate(p.x + p.w * 0.5, 180);
      g.rotate(-0.46);
      const beamG = g.createLinearGradient(-110, -180, 110, 180);
      beamG.addColorStop(0, gray(250, 0.0));
      beamG.addColorStop(0.32, gray(252, 0.65));
      beamG.addColorStop(0.62, gray(225, 0.32));
      beamG.addColorStop(1, gray(180, 0.0));
      g.fillStyle = beamG;
      g.fillRect(-150, -240, 300, 480);
      g.restore();

      // Blurry distant foliage/roof silhouettes outside the lower window panes
      g.save();
      g.filter = 'blur(5px)';
      g.fillStyle = gray(18, 0.82);
      g.beginPath();
      g.arc(p.x + 48, 338, 62, 0, Math.PI * 2);
      g.arc(p.x + 138, 352, 76, 0, Math.PI * 2);
      g.fill();
      g.restore();

      // Falling rain streaks inside each pane
      const rng = mulberry32(1000 + idx * 77);
      g.strokeStyle = gray(248, 0.78);
      g.lineWidth = 1.6;
      for (let r = 0; r < 62; r++) {
        const rx0 = p.x + rng() * p.w;
        const speed = 260 + rng() * 180;
        const len = 20 + rng() * 36;
        const ry = ((rng() * 420 + t * speed) % 410) - 20;
        const slant = -4.5 - rng() * 3;
        g.beginPath();
        g.moveTo(rx0, ry);
        g.lineTo(rx0 + slant, ry + len);
        g.stroke();
      }
      g.restore();
    });

    // 3. Curved Wooden Bistro Chairs (Left & Right foreground, matching reference image)
    g.strokeStyle = gray(12);
    g.lineWidth = 14;
    g.beginPath(); g.arc(52, 472, 88, -Math.PI * 0.85, 0.15); g.stroke();
    g.lineWidth = 7;
    g.beginPath(); g.arc(52, 482, 66, -Math.PI * 0.8, 0.1); g.stroke();

    g.strokeStyle = gray(12);
    g.lineWidth = 15;
    g.beginPath(); g.arc(755, 495, 96, -Math.PI * 0.92, -0.05); g.stroke();
    g.strokeStyle = gray(85);
    g.lineWidth = 2.2;
    g.beginPath(); g.arc(755, 492, 99, -Math.PI * 0.82, -0.22); g.stroke();

    // 4. Sculpted Young Man Seated by the Window (positioned at x=282, y=252 so "m" & "u" of "muhaal" slice right across his cheek/hair like the reference!)
    g.save();
    g.translate(282, 254 + breathe);

    // Relaxed shoulders & dark turtleneck sweater
    g.fillStyle = gray(10);
    g.beginPath();
    g.moveTo(-148, 290);
    g.bezierCurveTo(-142, 132, -96, 88, -36, 66);
    g.lineTo(36, 72);
    g.bezierCurveTo(88, 96, 108, 162, 132, 290);
    g.closePath();
    g.fill();

    // Soft window rim-light fold on his right sleeve/chest
    g.save();
    g.filter = 'blur(3px)';
    g.fillStyle = gray(74);
    g.beginPath();
    g.moveTo(12, 110);
    g.quadraticCurveTo(40, 150, 26, 218);
    g.quadraticCurveTo(4, 206, 2, 148);
    g.closePath();
    g.fill();
    g.restore();

    // Turtleneck collar
    g.fillStyle = gray(14);
    g.beginPath();
    g.moveTo(-32, 70); g.lineTo(28, 76); g.lineTo(22, 38); g.lineTo(-26, 36);
    g.closePath();
    g.fill();

    // Natural curved neck with soft shadow & sunlit throat edge
    g.fillStyle = gray(34);
    g.beginPath();
    g.moveTo(-22, 4); g.lineTo(20, 8); g.lineTo(22, 42); g.lineTo(-26, 40);
    g.closePath();
    g.fill();
    g.save();
    g.filter = 'blur(2px)';
    g.fillStyle = gray(195);
    g.beginPath();
    g.moveTo(8, 8); g.lineTo(20, 8); g.lineTo(22, 40); g.lineTo(10, 40);
    g.closePath();
    g.fill();
    g.restore();

    // Sculpted Face in 3/4 profile facing right toward the window (softly lit cheek plane + dark shadow side)
    g.fillStyle = gray(218);
    g.beginPath();
    g.moveTo(14, -52); // Forehead
    g.lineTo(38, -38); // Brow ridge
    g.lineTo(35, -28); // Eye bridge
    g.lineTo(46, -12); // Nose tip
    g.lineTo(37, -6);  // Philtrum
    g.lineTo(40, -1);  // Upper lip
    g.lineTo(38, 6);   // Lower lip
    g.lineTo(33, 19);  // Chin
    g.quadraticCurveTo(8, 24, -12, 8); // Jawline to ear
    g.lineTo(-14, -42);
    g.closePath();
    g.fill();

    // Softly blended charcoal cheek shadow leaving a luminous rim along his brow, nose, cheek & jaw
    g.save();
    g.filter = 'blur(4px)';
    g.fillStyle = gray(46);
    g.beginPath();
    g.moveTo(-16, -38);
    g.quadraticCurveTo(18, -32, 24, -8);
    g.quadraticCurveTo(18, 15, -12, 12);
    g.closePath();
    g.fill();
    g.restore();

    // Expressive dark eye & brow looking toward the rain window
    g.fillStyle = gray(12);
    g.beginPath();
    g.moveTo(18, -32); g.quadraticCurveTo(28, -36, 36, -31); g.lineTo(35, -28); g.closePath();
    g.fill();
    g.beginPath();
    g.ellipse(26, -24, 6.5, 3.6, 0.1, 0, Math.PI * 2);
    g.fill();

    // Proportional tousled dark hair with layered locks (matching the indie illustration reference!)
    g.fillStyle = gray(9);
    g.beginPath();
    g.moveTo(-32, 12); // Nape
    g.bezierCurveTo(-46, -12, -48, -52, -28, -76); // Back of skull
    g.bezierCurveTo(-8, -96, 26, -98, 52, -78);    // Crown & top sweep
    g.lineTo(62, -66); // Tousled front lock 1
    g.quadraticCurveTo(50, -52, 38, -48);
    g.lineTo(46, -42); // Tousled front lock 2
    g.quadraticCurveTo(28, -38, 12, -38);
    g.quadraticCurveTo(-2, -34, -8, -16); // Temple & sideburn
    g.lineTo(-14, -4);
    g.quadraticCurveTo(-20, 4, -26, 16);
    g.closePath();
    g.fill();

    // Sculpted ear & rim highlight
    g.fillStyle = gray(145);
    g.beginPath();
    g.ellipse(-13, -10, 5.5, 10, -0.12, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = gray(28);
    g.beginPath();
    g.ellipse(-13, -10, 2.8, 5.5, -0.12, 0, Math.PI * 2);
    g.fill();

    g.restore();

    // 5. Ceramic Coffee Cup & Saucer on foreground table (x: 235, y: 498)
    g.fillStyle = gray(235);
    g.beginPath();
    g.moveTo(212, 496); g.lineTo(262, 496);
    g.lineTo(256, 538); g.lineTo(218, 538);
    g.closePath();
    g.fill();
    g.fillStyle = gray(38);
    g.beginPath();
    g.moveTo(217, 502); g.lineTo(257, 502);
    g.lineTo(252, 534); g.lineTo(222, 534);
    g.closePath();
    g.fill();
  }

  // ============================================================================
  // SCENE 1B ("mera tere bina" — Reference Image Frame 2 Homage with Sculpted Anatomy)
  // ============================================================================
  function drawPlasterWallShadows(g, t) {
    // Lush Baby-Pink center plaster wall -> Golden Yellow tint -> Deep Orange corners
    const bgG = g.createRadialGradient(475, 275, 45, 480, 275, 540);
    bgG.addColorStop(0, gray(248));   // Bright Baby Pink wall center
    bgG.addColorStop(0.52, gray(192)); // Warm Golden Yellow tint ring
    bgG.addColorStop(1, gray(68));    // Deep Orange outer vignette
    g.fillStyle = bgG;
    g.fillRect(0, 0, RW, RH);

    const step = Math.sin(t * 2.2) * 3.5;

    // 1. Central Giant Cast Shadows on the Wall (Soft-edged charcoal shadows holding a rose)
    g.save();
    g.filter = 'blur(4.5px)';
    drawSculptedMale(g, 392 + step * 0.5, 132, 1.42, false, {
      col: gray(20, 0.88),
      reachArm: true,
      armAngle: 0.25,
      stride: 0.42
    });
    drawSculptedFemale(g, 565 - step * 0.5, 148, 1.38, true, {
      col: gray(20, 0.88),
      reachArm: true,
      armAngle: 0.25
    });

    // Long-stemmed Rose held between their shadow hands at (478, 282)
    g.strokeStyle = gray(14, 0.92);
    g.lineWidth = 3.2;
    g.beginPath();
    g.moveTo(478, 244);
    g.quadraticCurveTo(481, 285, 475, 326);
    g.stroke();
    // Rose blossom & two small leaves
    g.fillStyle = gray(10, 0.95);
    g.beginPath();
    g.arc(478, 240, 9.5, 0, Math.PI * 2);
    g.ellipse(471, 272, 6, 3, -0.5, 0, Math.PI * 2);
    g.ellipse(485, 282, 6, 3, 0.5, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // 2. Small Crisp Solitary Real Figures at Far Left & Far Right (Sculpted Anatomy!)
    drawSculptedMale(g, 88, 245, 1.05, false, {
      col: gray(8),
      reachArm: false,
      stride: 0.12
    });
    drawSculptedFemale(g, 884, 258, 1.02, false, {
      col: gray(8),
      reachArm: false
    });
  }

  // SCENE 0 (Intro 0.00 - 1.70s): Rain on Windowpane with Baby Pink & Yellow Bokeh
  function drawIntroRainWindow(g, t) {
    const bgG = g.createLinearGradient(0, 0, RW, RH);
    bgG.addColorStop(0, gray(242));   // Baby pink upper left
    bgG.addColorStop(0.5, gray(172)); // Golden yellow center
    bgG.addColorStop(1, gray(38));    // Deep orange lower right
    g.fillStyle = bgG;
    g.fillRect(0, 0, RW, RH);

    const rng = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      const bx = rng() * RW, by = rng() * RH;
      const br = 32 + rng() * 72;
      const bG = g.createRadialGradient(bx, by, 2, bx, by, br);
      bG.addColorStop(0, gray(252, 0.65));
      bG.addColorStop(1, gray(160, 0));
      g.fillStyle = bG;
      g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    }

    g.fillStyle = gray(12);
    g.fillRect(468, 0, 22, RH);
    g.fillRect(0, 258, RW, 20);

    g.strokeStyle = gray(250, 0.78);
    g.lineWidth = 1.8;
    for (let i = 0; i < 115; i++) {
      const rx = rng() * RW;
      const ry = ((rng() * RH + t * (320 + rng() * 200)) % (RH + 60)) - 30;
      g.beginPath();
      g.moveTo(rx, ry);
      g.lineTo(rx - 8, ry + 34);
      g.stroke();
    }
  }

  // SCENE 2 (6.36 - 8.52s — "Yeh saaray nashay bekaar"):
  // Sculpted Man Leaning at Table + Bottles & Glasses Casting Long Shadows
  function drawTableGlassesScene(g, t) {
    const wallG = g.createLinearGradient(0, 0, RW, RH);
    wallG.addColorStop(0, gray(246));   // Baby pink upper left wall
    wallG.addColorStop(0.52, gray(185)); // Golden yellow mid wall
    wallG.addColorStop(1, gray(48));
    g.fillStyle = wallG;
    g.fillRect(0, 0, RW, RH);

    // Venetian window light bars
    g.fillStyle = gray(252, 0.42);
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      const y0 = 24 + i * 56;
      g.moveTo(160, y0);
      g.lineTo(960, y0 + 140);
      g.lineTo(960, y0 + 170);
      g.lineTo(160, y0 + 30);
      g.closePath();
      g.fill();
    }

    // Dark tabletop
    g.fillStyle = gray(14);
    g.beginPath();
    g.moveTo(0, 368); g.lineTo(RW, 338); g.lineTo(RW, RH); g.lineTo(0, RH);
    g.closePath();
    g.fill();

    // Sculpted Young Man seated on left leaning his head on his hand (x=315, y=145)
    const sigh = Math.sin(t * 2.0) * 2.5;
    drawSculptedMale(g, 315, 148 + sigh, 1.38, false, {
      col: gray(10),
      seated: true,
      reachArm: true,
      armAngle: 0.85,
      headTilt: 0.28,
      rimLum: 238
    });

    // Sculpted Bottle & Wine/Martini Glasses on right-center casting shadows across center word
    const items = [
      { x: 548, y: 352, w: 42, h: 168 },
      { x: 632, y: 350, w: 40, h: 102 },
      { x: 708, y: 348, w: 40, h: 90 }
    ];
    items.forEach((it, i) => {
      g.save();
      g.filter = 'blur(3px)';
      g.fillStyle = gray(22, 0.82);
      g.beginPath();
      g.moveTo(it.x - 16, it.y);
      g.lineTo(it.x - 58 - i * 12, it.y - it.h * 1.48);
      g.lineTo(it.x + it.w - 24, it.y - it.h * 1.48);
      g.lineTo(it.x + it.w + 8, it.y);
      g.closePath();
      g.fill();
      g.restore();

      g.fillStyle = gray(12);
      g.fillRect(it.x, it.y - it.h, it.w, it.h);
      g.fillStyle = gray(245, 0.88);
      g.fillRect(it.x + 6, it.y - it.h + 12, 7, it.h - 20);

      const cG = g.createRadialGradient(it.x + 20, it.y + 42, 4, it.x + 20, it.y + 42, 56);
      cG.addColorStop(0, gray(248, 0.8));
      cG.addColorStop(1, gray(20, 0));
      g.fillStyle = cG;
      g.beginPath(); g.ellipse(it.x + 20, it.y + 42, 56, 18, -0.2, 0, Math.PI * 2); g.fill();
    });
  }

  // SCENE 3 (8.60 - 10.74s — "teri aankhon ke siwa"):
  // Full-Bleed Atmospheric Close-Up of Her Eyes in Stippled Sunlight & Shadow
  function drawEyesCloseUp(g, t) {
    // Full-frame warm skin luminance (Baby Pink center -> Golden Yellow mid -> Orange edges)
    const skinG = g.createRadialGradient(480, 265, 60, 480, 265, 580);
    skinG.addColorStop(0, gray(242));
    skinG.addColorStop(0.55, gray(185));
    skinG.addColorStop(1, gray(62));
    g.fillStyle = skinG;
    g.fillRect(0, 0, RW, RH);

    // Soft diagonal slatted window shadow bands across her face
    g.save();
    g.filter = 'blur(4px)';
    g.fillStyle = gray(38, 0.42);
    for (let i = -2; i < 9; i++) {
      g.beginPath();
      const x0 = i * 155 + Math.sin(t * 1.4 + i) * 10;
      g.moveTo(x0, 0);
      g.lineTo(x0 + 68, 0);
      g.lineTo(x0 - 115, RH);
      g.lineTo(x0 - 183, RH);
      g.closePath();
      g.fill();
    }
    g.restore();

    const blink = (t > 9.66 && t < 9.86) ? 0.14 : 1.0;
    const gazeX = Math.sin(t * 1.4) * 6;

    [
      { cx: 295, cy: 268, dir: -1 },
      { cx: 665, cy: 268, dir: 1 }
    ].forEach((eye) => {
      g.save();
      g.translate(eye.cx, eye.cy);

      // Soft brow bone shadow
      g.save();
      g.filter = 'blur(8px)';
      g.fillStyle = gray(55, 0.55);
      g.beginPath();
      g.ellipse(0, -18, 125, 58, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();

      // Sculpted arched eyebrow
      g.fillStyle = gray(12);
      g.beginPath();
      g.moveTo(-125 * eye.dir, -56);
      g.quadraticCurveTo(-18 * eye.dir, -104, 108 * eye.dir, -62);
      g.quadraticCurveTo(8 * eye.dir, -80, -125 * eye.dir, -42);
      g.closePath();
      g.fill();

      // Upper eyelid crease line
      g.strokeStyle = gray(24, 0.7);
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-108, -18);
      g.quadraticCurveTo(0, -82, 108, -22);
      g.stroke();

      g.scale(1, blink);

      // Sclera
      g.fillStyle = gray(250);
      g.beginPath();
      g.moveTo(-112, 2);
      g.quadraticCurveTo(0, -70, 112, -2);
      g.quadraticCurveTo(0, 66, -112, 2);
      g.closePath();
      g.fill();

      // Detailed Iris & Pupil
      g.save();
      g.clip();
      const ix = gazeX;
      g.fillStyle = gray(16);
      g.beginPath(); g.arc(ix, 0, 50, 0, Math.PI * 2); g.fill();
      g.fillStyle = gray(155);
      g.beginPath(); g.arc(ix, 0, 38, 0, Math.PI * 2); g.fill();
      g.strokeStyle = gray(26);
      g.lineWidth = 1.5;
      for (let a = 0; a < 28; a++) {
        const ang = (a / 28) * Math.PI * 2;
        g.beginPath();
        g.moveTo(ix + Math.cos(ang) * 16, Math.sin(ang) * 16);
        g.lineTo(ix + Math.cos(ang) * 46, Math.sin(ang) * 46);
        g.stroke();
      }
      g.fillStyle = gray(6);
      g.beginPath(); g.arc(ix, 0, 19, 0, Math.PI * 2); g.fill();
      g.fillStyle = gray(255);
      g.fillRect(ix - 25, -24, 17, 14);
      g.fillRect(ix + 12, 8, 9, 9);
      g.restore();

      // Winged kajal eyeliner & individual curved eyelashes
      g.strokeStyle = gray(8);
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(-118, 4);
      g.quadraticCurveTo(0, -74, 122, -6);
      g.stroke();

      g.lineWidth = 3.5;
      g.beginPath();
      g.moveTo(-108, 4);
      g.quadraticCurveTo(0, 68, 108, 0);
      g.stroke();

      g.restore();
    });

    // Subtle bindi & soft nose bridge shading
    g.fillStyle = gray(12);
    g.beginPath(); g.arc(480, 188, 9.5, 0, Math.PI * 2); g.fill();
    g.save();
    g.filter = 'blur(6px)';
    g.fillStyle = gray(68, 0.55);
    g.beginPath();
    g.moveTo(456, 205);
    g.quadraticCurveTo(442, 325, 434, 445);
    g.lineTo(474, 445);
    g.closePath();
    g.fill();
    g.restore();

    // Flowing dark hair tendrils framing far left & right edges
    g.fillStyle = gray(10);
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(135, 0);
    g.bezierCurveTo(65, 180, 95, 360, 115, RH);
    g.lineTo(0, RH);
    g.fill();
    g.beginPath();
    g.moveTo(RW, 0); g.lineTo(825, 0);
    g.bezierCurveTo(895, 180, 865, 360, 845, RH);
    g.lineTo(RW, RH);
    g.fill();
  }

  // SCENE 4 (10.84 - 13.04s — "Ghar nahi jaata, mein bahar"):
  // Sculpted Man Walking Out Into a Towering Baby-Pink & Yellow Streetlamp Cone
  function drawStreetlampWalk(g, t) {
    g.fillStyle = gray(16);
    g.fillRect(0, 0, RW, RH);

    // Left house facade & doorway
    g.fillStyle = gray(38);
    g.fillRect(30, 40, 230, 390);
    g.fillStyle = gray(10);
    g.fillRect(72, 95, 145, 335);
    g.fillStyle = gray(225);
    g.fillRect(72, 95, 18, 335);

    // Towering Streetlamp Cone of Light (Baby Pink top -> Golden Yellow mid -> Orange base)
    const coneG = g.createLinearGradient(560, 48, 560, RH);
    coneG.addColorStop(0, gray(254));
    coneG.addColorStop(0.52, gray(212));
    coneG.addColorStop(1, gray(138));
    g.fillStyle = coneG;
    g.beginPath();
    g.moveTo(545, 52);
    g.lineTo(890, RH);
    g.lineTo(210, RH);
    g.closePath();
    g.fill();

    // Streetlamp post & glowing lantern
    g.fillStyle = gray(10);
    g.fillRect(585, 45, 14, RH - 45);
    g.beginPath(); g.arc(562, 52, 26, Math.PI, 0); g.fill();
    g.fillStyle = gray(255);
    g.beginPath(); g.ellipse(552, 56, 22, 11, -0.15, 0, Math.PI * 2); g.fill();

    // Wet cobblestone pavement reflections
    g.fillStyle = gray(26, 0.78);
    g.fillRect(0, 430, RW, 110);
    for (let r = 0; r < 14; r++) {
      g.fillStyle = gray(236, 0.52 - r * 0.03);
      g.fillRect(340 - r * 8, 438 + r * 7, 360 + r * 14, 3);
    }

    // Sculpted Young Man walking through the streetlamp cone (x: 425 -> 525)
    const dt = clamp(t - 10.84, 0, 2.3);
    const wx = 425 + dt * 44;
    const stride = Math.sin(t * 6.0);
    drawSculptedMale(g, wx, 152, 1.26, false, {
      col: gray(10),
      stride: stride * 0.55,
      reachArm: false,
      rimLum: 245
    });

    // Rain streaks
    const rng = mulberry32(404);
    g.strokeStyle = gray(248, 0.68);
    g.lineWidth = 1.5;
    for (let i = 0; i < 85; i++) {
      const rx = 200 + rng() * 680;
      const ry = ((rng() * RH + t * 380) % RH);
      g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 6, ry + 26); g.stroke();
    }
  }

  // SCENE 5 (13.12 - 15.22s — "Rehta tera intezaar"):
  // Sculpted Man Seated on Bench While Her Cast Shadow Lingers Beside Him
  function drawWaitingBenchScene(g, t) {
    const wallG = g.createRadialGradient(480, 250, 35, 480, 260, 520);
    wallG.addColorStop(0, gray(248));
    wallG.addColorStop(0.55, gray(188));
    wallG.addColorStop(1, gray(64));
    g.fillStyle = wallG;
    g.fillRect(0, 0, RW, RH);

    // Wrought-iron bench
    g.fillStyle = gray(22);
    g.fillRect(220, 258, 520, 14);
    g.fillRect(220, 284, 520, 14);
    g.fillRect(220, 310, 520, 14);
    g.fillRect(205, 345, 550, 18);
    g.fillRect(235, 250, 14, 195);
    g.fillRect(710, 250, 14, 195);
    g.fillRect(473, 255, 12, 185);

    // Ghostly Cast Shadow of Her on the right side of the bench
    g.save();
    g.filter = 'blur(4.5px)';
    drawSculptedFemale(g, 592, 152, 1.18, true, {
      col: gray(30, 0.72),
      reachArm: false
    });
    g.restore();

    // Sculpted Young Man seated on left-center of bench
    drawSculptedMale(g, 368, 156, 1.24, false, {
      col: gray(10),
      seated: true,
      headTilt: 0.14,
      rimLum: 242
    });

    // Drifting leaves
    const rng = mulberry32(505);
    g.fillStyle = gray(14);
    for (let i = 0; i < 16; i++) {
      const lx = ((rng() * RW + t * (45 + rng() * 35)) % RW);
      const ly = ((rng() * RH + t * (55 + rng() * 40)) % RH);
      g.save();
      g.translate(lx, ly);
      g.rotate(t * 2 + i);
      g.beginPath(); g.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }

  // SCENE 6 (15.32 - 17.52s — "Mere khuwabon main aa naa"):
  // Giant Glowing Baby-Pink & Yellow Full Moon Over Rippling Water & Sculpted Dream Couple
  function drawDreamMoonScene(g, t) {
    g.fillStyle = gray(16);
    g.fillRect(0, 0, RW, RH);

    const moonG = g.createRadialGradient(480, 245, 30, 480, 245, 255);
    moonG.addColorStop(0, gray(254));
    moonG.addColorStop(0.68, gray(232));
    moonG.addColorStop(0.82, gray(155));
    moonG.addColorStop(1, gray(16));
    g.fillStyle = moonG;
    g.beginPath(); g.arc(480, 245, 255, 0, Math.PI * 2); g.fill();

    // Soft dream clouds drifting across moon
    g.save();
    g.filter = 'blur(5px)';
    g.fillStyle = gray(32, 0.62);
    const drift = (t - 15.32) * 26;
    g.beginPath();
    g.ellipse(340 + drift, 192, 165, 24, 0, 0, Math.PI * 2);
    g.ellipse(620 - drift, 312, 180, 28, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // Shimmering water horizon
    g.fillStyle = gray(12);
    g.fillRect(0, 395, RW, 145);
    for (let r = 0; r < 18; r++) {
      const rw = 265 - r * 9 + Math.sin(t * 4 + r) * 18;
      g.fillStyle = gray(244 - r * 6);
      g.fillRect(480 - rw * 0.5, 402 + r * 7.5, rw, 3.5);
    }

    const reach = clamp((t - 15.32) * 18, 0, 34);
    drawSculptedMale(g, 372 + reach * 0.5, 162, 1.24, false, {
      col: gray(8),
      reachArm: true,
      armAngle: 0.45,
      stride: 0.22
    });
    drawSculptedFemale(g, 588 - reach * 0.5, 168, 1.22, true, {
      col: gray(8),
      reachArm: true,
      armAngle: 0.45,
      singhaar: true
    });
  }

  // SCENE 7 (17.60 - 20.00s — "kar ke solah singhaar"):
  // Ornate Sunlit Archway, Hanging Garlands & Adorned Sculpted Couple Meeting
  function drawSolahSinghaarScene(g, t) {
    const sunG = g.createRadialGradient(480, 265, 40, 480, 265, 520);
    sunG.addColorStop(0, gray(252));
    sunG.addColorStop(0.56, gray(198));
    sunG.addColorStop(1, gray(45));
    g.fillStyle = sunG;
    g.fillRect(0, 0, RW, RH);

    // Ornate archway framing left, top & right
    g.fillStyle = gray(12);
    g.beginPath();
    g.rect(0, 0, RW, RH);
    g.moveTo(175, RH);
    g.lineTo(175, 220);
    g.quadraticCurveTo(175, 42, 480, 32);
    g.quadraticCurveTo(785, 42, 785, 220);
    g.lineTo(785, RH);
    g.closePath();
    g.fill('evenodd');

    // Hanging marigold/jasmine garland strings
    const sway = Math.sin(t * 2.5) * 6;
    for (let s = 0; s < 7; s++) {
      const gx = 235 + s * 82 + sway * (s % 2 === 0 ? 1 : -1);
      const gh = 115 + (s % 2) * 38;
      g.strokeStyle = gray(18);
      g.lineWidth = 4.5;
      g.beginPath(); g.moveTo(gx, 36); g.lineTo(gx, 36 + gh); g.stroke();
      g.fillStyle = gray(248);
      for (let b = 0; b < gh; b += 16) {
        g.beginPath(); g.arc(gx, 42 + b, 4.5, 0, Math.PI * 2); g.fill();
      }
    }

    const closeIn = clamp((t - 17.60) * 18, 0, 30);
    drawSculptedMale(g, 378 + closeIn, 154, 1.38, false, {
      col: gray(10),
      reachArm: true,
      armAngle: 0.25,
      stride: 0.2,
      rimLum: 245
    });
    drawSculptedFemale(g, 582 - closeIn, 166, 1.35, true, {
      col: gray(10),
      reachArm: true,
      armAngle: 0.25,
      singhaar: true
    });
  }

  function getSceneIndex(t) {
    if (t < 1.70) return 0;
    if (t < 4.68) return 1;
    if (t < 6.30) return 2;
    if (t < 8.54) return 3;
    if (t < 10.78) return 4;
    if (t < 13.06) return 5;
    if (t < 15.26) return 6;
    if (t < 17.54) return 7;
    return 8;
  }

  function renderLuminanceScene(g, sceneIdx, t) {
    g.save();
    g.clearRect(0, 0, RW, RH);
    if (sceneIdx === 0) drawIntroRainWindow(g, t);
    else if (sceneIdx === 1) drawSeatedManAtWindow(g, t);
    else if (sceneIdx === 2) drawPlasterWallShadows(g, t);
    else if (sceneIdx === 3) drawTableGlassesScene(g, t);
    else if (sceneIdx === 4) drawEyesCloseUp(g, t);
    else if (sceneIdx === 5) drawStreetlampWalk(g, t);
    else if (sceneIdx === 6) drawWaitingBenchScene(g, t);
    else if (sceneIdx === 7) drawDreamMoonScene(g, t);
    else drawSolahSinghaarScene(g, t);
    g.restore();
  }

  const TRANSITIONS = [1.70, 4.68, 6.30, 8.54, 10.78, 13.06, 15.26, 17.54];
  const BEAT_FLASHES = [1.70, 3.80, 5.48, 7.64, 9.04, 11.48, 13.12, 16.92, 18.14, 18.88];

  window.renderTritoneFrame = function (mainCtx, t, activeWordInfo) {
    initTextures();

    const sIdx = getSceneIndex(t);

    let transProg = -1;
    let prevIdx = sIdx;
    for (let i = 0; i < TRANSITIONS.length; i++) {
      const dt = t - TRANSITIONS[i];
      if (Math.abs(dt) < 0.18) {
        transProg = (dt + 0.18) / 0.36;
        prevIdx = i;
        break;
      }
    }

    renderLuminanceScene(lumCtx, sIdx, t);
    const curData = lumCtx.getImageData(0, 0, RW, RH).data;

    let prevData = null;
    if (transProg >= 0 && prevIdx !== sIdx) {
      renderLuminanceScene(prevLumCtx, prevIdx, t);
      prevData = prevLumCtx.getImageData(0, 0, RW, RH).data;
    }

    lumCtx.clearRect(0, 0, RW, RH);
    if (activeWordInfo && activeWordInfo.word) {
      const el = clamp(t - activeWordInfo.start, 0, 1);
      const punch = el < 0.09 ? lerp(0.92, 1.02, el / 0.09) : el < 0.18 ? lerp(1.02, 1.0, (el - 0.09) / 0.09) : 1.0;
      lumCtx.save();
      lumCtx.translate(RW * 0.5, RH * 0.5);
      lumCtx.scale(punch, punch);
      lumCtx.font = '800 106px "Poppins", sans-serif';
      lumCtx.textAlign = 'center';
      lumCtx.textBaseline = 'middle';
      if ('letterSpacing' in lumCtx) lumCtx.letterSpacing = '-4.5px';
      lumCtx.fillStyle = '#ffffff';
      lumCtx.fillText(activeWordInfo.word, 0, 4);
      lumCtx.restore();
    }
    const wordMaskData = lumCtx.getImageData(0, 0, RW, RH).data;

    let flashBoost = 0;
    for (let i = 0; i < BEAT_FLASHES.length; i++) {
      const d = t - BEAT_FLASHES[i];
      if (d >= 0 && d < 0.14) {
        flashBoost = Math.round((1 - d / 0.14) * 52);
        break;
      }
    }

    const grainBank = grainBanks[Math.floor(t * 15) % grainBanks.length];
    const useWall = (sIdx === 1);
    const usePlaster = (sIdx !== 1);
    const useFoliage = (sIdx === 2 || sIdx === 6);

    let blockSize = 1;
    if (transProg >= 0) {
      const bell = Math.sin(transProg * Math.PI);
      blockSize = Math.max(1, Math.round(bell * 22));
    }

    for (let y = 0; y < RH; y++) {
      const by = blockSize > 1 ? Math.min(RH - 1, Math.floor(y / blockSize) * blockSize + (blockSize >> 1)) : y;
      const rowOff = y * RW;
      const bRowOff = by * RW;

      for (let x = 0; x < RW; x++) {
        const bx = blockSize > 1 ? Math.min(RW - 1, Math.floor(x / blockSize) * blockSize + (blockSize >> 1)) : x;
        const idx = rowOff + x;
        const bIdx = bRowOff + bx;
        const p4 = bIdx << 2;

        let baseLum = curData[p4];

        if (prevData && transProg >= 0) {
          const cellHash = hash2((x / Math.max(1, blockSize)) | 0, (y / Math.max(1, blockSize)) | 0, 777);
          if (cellHash > transProg) {
            baseLum = prevData[p4];
          }
        }

        if (baseLum > 28) {
          const weight = smoothstep(28, 95, baseLum);
          if (useWall && x < 295) {
            const wt = (wallpaperTex[bIdx] - 0.5) * 76 * weight;
            baseLum += wt;
          } else if (usePlaster) {
            const pt = (plasterTex[bIdx] - 0.5) * 84 * weight;
            baseLum += pt;
          }
        }

        if (useFoliage && y < 245) {
          const fol = foliageTex[bIdx];
          if (fol > 0.05) {
            baseLum = lerp(baseLum, 10, clamp(fol * 1.15, 0, 1));
          }
        }

        let lum = clamp(Math.round(baseLum + grainBank[idx] + flashBoost), 0, 255);

        const wAlpha = wordMaskData[idx << 2];
        let lutIdx = (lum << 2) | (lum >> 6);
        if (wAlpha > 0) {
          const invLutIdx = INV_LUT[lum];
          if (wAlpha >= 245) {
            lutIdx = invLutIdx;
          } else {
            lutIdx = Math.round(lerp(lutIdx, invLutIdx, wAlpha / 255));
          }
        }

        lowOutU32[idx] = TRITONE_LUT[clamp(lutIdx, 0, LUT_SIZE - 1)];
      }
    }

    lowOutCtx.putImageData(lowOutImg, 0, 0);

    mainCtx.save();
    mainCtx.imageSmoothingEnabled = true;
    mainCtx.imageSmoothingQuality = 'high';
    mainCtx.drawImage(lowOutCanvas, 0, 0, W, H);
    mainCtx.restore();
  };
})();
