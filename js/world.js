// World builder: greenhouse, grow racks, props, lighting, sky.
import * as THREE from 'three';

/* ── canvas texture helpers ─────────────────────────────── */
function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function concreteTexture() {
  const t = canvasTex(256, (g, s) => {
    g.fillStyle = '#8f9894'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.09})`;
      g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 3;
    g.strokeRect(1, 1, s - 2, s - 2);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7, 4.4);
  return t;
}

function stripeTexture() {
  return canvasTex(256, (g, s) => {
    const cols = ['#e11d48', '#f8fafc'];
    const w = s / 8;
    for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % 2]; g.fillRect(i * w, 0, w, s); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, s - 26, s, 26);
  });
}

function signTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0d3b2e'; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = '#4ade80'; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
  g.fillStyle = '#d9f99d'; g.font = '800 118px "Baloo 2", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('🌱 VERDIA FARMS', 512, 122);
  g.fillStyle = '#4ade80'; g.font = '700 40px "Baloo 2", sans-serif';
  g.fillText('H I D R O P O N Í A', 512, 205);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function screenTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#03150c'; g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#4ade80'; g.font = '700 28px monospace';
  g.fillText('▮ VerdiaOS v2.1', 24, 46);
  g.font = '20px monospace'; g.fillStyle = '#22c55e';
  ['> hydroponics.link ... OK', '> nutrient pumps  .... OK', '> contract board  .... 3 new', '> pH equilibrium  .... stable', '> awaiting input_'].forEach((l, i) => g.fillText(l, 24, 96 + i * 40));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function wrenchTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#facc15'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
  g.font = '72px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('🔧', 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ── plant mesh factory ─────────────────────────────────── */
export function makePlantMesh(cropId, cropDef, growth) {
  const g = new THREE.Group();
  const stage = growth < 15 ? 0 : growth < 50 ? 1 : 2;
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.72, metalness: 0.02 });
  const foliage = mat(cropDef.color), foliageDark = mat(cropDef.dark);

  if (stage === 0) {
    const stem = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), foliageDark);
    stem.position.y = 0.1; g.add(stem);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.12, 4), foliage);
    leaf.position.set(0.05, 0.12, 0.02); leaf.rotation.z = -0.5; g.add(leaf);
  } else {
    const s = stage === 1 ? 0.62 : 1;
    if (cropDef.shape === 'leafy') {
      const tiers = [0.16, 0.34, 0.52];
      tiers.forEach((h, i) => {
        const r = (0.21 - i * 0.055) * s;
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(r, 0.17 * s + 0.05, 8), i % 2 ? foliage : foliageDark);
        leaf.position.y = h * s; g.add(leaf);
      });
    } else {
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.235 * s, 0), foliage);
      bush.scale.y = 0.82; bush.position.y = 0.2 * s + 0.06; g.add(bush);
      const bush2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 * s, 0), foliageDark);
      bush2.position.set(0.13 * s, 0.32 * s + 0.06, 0.07 * s); g.add(bush2);
      if (cropDef.shape === 'fruit' && stage === 2) {
        const fruitMat = mat(cropDef.fruit);
        const fruitGeo = new THREE.SphereGeometry(0.052, 8, 8);
        [[-0.15, 0.16, 0.12], [0.17, 0.24, -0.06], [0.02, 0.13, -0.16], [-0.05, 0.36, 0.1]].forEach(p => {
          const f = new THREE.Mesh(fruitGeo, fruitMat);
          f.position.set(p[0] * s, p[1] * s + 0.05, p[2] * s); g.add(f);
        });
      }
    }
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}


function addProxy(group, w, h, d, y) {
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  proxy.position.y = y;
  group.add(proxy);
}

/* ══════════ MAIN BUILD ═══════════════════════════════════ */
export function buildWorld(scene) {
  scene.background = new THREE.Color(0xa8d8e8);
  scene.fog = new THREE.Fog(0xa8d8e8, 55, 150);

  /* lights */
  const hemi = new THREE.HemisphereLight(0xcfeaff, 0x39543c, 1.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
  sun.position.set(20, 30, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
  sun.shadow.camera.far = 80; sun.shadow.bias = -0.0004;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(fill);

  const colliders = [];
  const interactables = [];
  const addCollider = (x, z, hw, hd) => colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
  const M = (geo, mat, x, y, z, cast = true, recv = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv;
    scene.add(m); return m;
  };

  /* ── outside ground ── */
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x3e7d46 });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(340, 340), grassMat);
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; grass.receiveShadow = true; scene.add(grass);
  // gravel path from door
  const path = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 26), new THREE.MeshLambertMaterial({ color: 0xb8b0a0 }));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.005, 22); path.receiveShadow = true; scene.add(path);

  /* trees (deterministic pseudo-random) */
  let seed = 1234;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5b3a21 });
  const leafMats = [0x2f6b33, 0x3a7d3e, 0x27592c].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2, r = 24 + rand() * 60;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 5 && z > 8) continue; // keep path clear
    const h = 2.2 + rand() * 2.4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, h * 0.4, 6), trunkMat);
    trunk.position.set(x, h * 0.2, z); trunk.castShadow = true; scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.2 + rand() * 0.9, h, 7), leafMats[i % 3]);
    crown.position.set(x, h * 0.4 + h * 0.42, z); crown.castShadow = true; scene.add(crown);
  }

  /* sun + clouds */
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff7c4, fog: false }));
  sunBall.position.set(60, 70, -80); scene.add(sunBall);
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.55, transparent: true, opacity: 0.92 });
  [[-30, 26, -60], [25, 30, -45], [0, 33, -90], [55, 27, -20]].forEach(p => {
    const cl = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 2.2, 8, 8), cloudMat);
      s.position.set(i * 2.6 - 4, Math.random() * 0.8, Math.random() * 1.5); s.scale.y = 0.55; cl.add(s);
    }
    cl.position.set(p[0], p[1], p[2]); scene.add(cl);
  });

  /* ── greenhouse shell ── */
  const W = 30.4, D = 18.4, wallH = 2.95, rise = 1.65;
  const floor = M(new THREE.BoxGeometry(W, 0.24, D), new THREE.MeshLambertMaterial({ map: concreteTexture() }), 0, -0.12, 0, false, true);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1d5b3c, roughness: 0.45, metalness: 0.35 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0xd8f4f8, transparent: true, opacity: 0.17, side: THREE.DoubleSide, depthWrite: false });
  const glassMatRoof = glassMat.clone(); glassMatRoof.opacity = 0.13;

  // curb walls
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x0f3527, roughness: 0.6 });
  [[0, D / 2 - 0.1, W, 0.22], [0, -D / 2 + 0.1, W, 0.22]].forEach(([x, z, w, d]) => M(new THREE.BoxGeometry(w, 0.4, d), curbMat, x, 0.2, z));
  [[W / 2 - 0.1, 0], [-W / 2 + 0.1, 0]].forEach(([x, z]) => M(new THREE.BoxGeometry(0.22, 0.4, D), curbMat, x, 0.2, z));

  // side walls (translucent) + posts
  const mkWall = (w, h, x, y, z, rotY) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
    m.position.set(x, y, z); m.rotation.y = rotY; m.receiveShadow = true; scene.add(m);
  };
  mkWall(D, wallH - 0.4, W / 2, (wallH + 0.4) / 2, 0, -Math.PI / 2);
  mkWall(D, wallH - 0.4, -W / 2, (wallH + 0.4) / 2, 0, Math.PI / 2);
  mkWall(W, wallH - 0.4, 0, (wallH + 0.4) / 2, -D / 2, 0);
  mkWall(W, wallH - 0.4, 0, (wallH + 0.4) / 2, D / 2, Math.PI);
  // posts along walls
  for (let x = -W / 2 + 0.6; x <= W / 2 - 0.5; x += 3.8) {
    M(new THREE.BoxGeometry(0.2, wallH, 0.2), frameMat, x, wallH / 2, D / 2 - 0.06);
    M(new THREE.BoxGeometry(0.2, wallH, 0.2), frameMat, x, wallH / 2, -D / 2 + 0.06);
  }
  for (let z = -D / 2 + 1.2; z <= D / 2 - 1; z += 3.8) {
    M(new THREE.BoxGeometry(0.2, wallH, 0.2), frameMat, W / 2 - 0.06, wallH / 2, z);
    M(new THREE.BoxGeometry(0.2, wallH, 0.2), frameMat, -W / 2 + 0.06, wallH / 2, z);
  }
  // horizontal beams
  M(new THREE.BoxGeometry(W, 0.18, 0.18), frameMat, 0, wallH, D / 2 - 0.06);
  M(new THREE.BoxGeometry(W, 0.18, 0.18), frameMat, 0, wallH, -D / 2 + 0.06);
  M(new THREE.BoxGeometry(0.18, 0.18, D), frameMat, W / 2 - 0.06, wallH, 0);
  M(new THREE.BoxGeometry(0.18, 0.18, D), frameMat, -W / 2 + 0.06, wallH, 0);

  // roof (gable)
  const slope = Math.atan2(rise, D / 2);
  const slopeLen = Math.hypot(rise, D / 2) + 0.3;
  [[1, -1], [-1, 1]].forEach(([s]) => {
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(W, slopeLen), glassMatRoof);
    roof.position.set(0, wallH + rise / 2 + 0.02, s * (D / 4));
    roof.rotation.x = s > 0 ? Math.PI / 2 + slope : Math.PI / 2 - slope;
    scene.add(roof);
  });
  // ridge beam & rafters
  M(new THREE.BoxGeometry(W, 0.16, 0.22), frameMat, 0, wallH + rise, 0);
  for (let x = -W / 2 + 0.6; x <= W / 2 - 0.5; x += 3.8) {
    const rafterGeo = new THREE.BoxGeometry(0.1, 0.1, slopeLen);
    const r1 = new THREE.Mesh(rafterGeo, frameMat);
    r1.position.set(x, wallH + rise / 2, D / 4); r1.rotation.x = slope; scene.add(r1);
    const r2 = new THREE.Mesh(rafterGeo, frameMat);
    r2.position.set(x, wallH + rise / 2, -D / 4); r2.rotation.x = -slope; scene.add(r2);
  }
  // gable end triangles
  const triShape = new THREE.Shape();
  triShape.moveTo(-D / 2, 0); triShape.lineTo(D / 2, 0); triShape.lineTo(0, rise); triShape.closePath();
  const triGeo = new THREE.ShapeGeometry(triShape);
  [[W / 2 - 0.02, -Math.PI / 2], [-W / 2 + 0.02, Math.PI / 2]].forEach(([x, rotY]) => {
    const tri = new THREE.Mesh(triGeo, glassMat);
    tri.rotation.y = rotY; tri.rotation.z = 0;
    tri.position.set(x, wallH, 0); tri.rotation.order = 'YXZ'; tri.rotation.x = 0;
    // ShapeGeometry lies in XY plane; rotate to face ±x
    tri.rotation.set(0, rotY, 0);
    scene.add(tri);
  });

  // door (front, decorative) + sign
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x0a2b1e, roughness: 0.5, metalness: 0.3 });
  M(new THREE.BoxGeometry(3.1, 2.5, 0.14), doorMat, 0, 1.25, D / 2 + 0.02, false);
  M(new THREE.BoxGeometry(3.5, 0.24, 0.2), frameMat, 0, 2.6, D / 2);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshBasicMaterial({ map: signTexture(), transparent: false }));
  sign.position.set(0, 3.6, D / 2 + 0.12); scene.add(sign);

  // wall colliders (keep player inside)
  colliders.push({ minX: -W / 2 - 1, maxX: W / 2 + 1, minZ: D / 2 - 0.35, maxZ: D / 2 + 2 });
  colliders.push({ minX: -W / 2 - 1, maxX: W / 2 + 1, minZ: -D / 2 - 2, maxZ: -D / 2 + 0.35 });
  colliders.push({ minX: W / 2 - 0.35, maxX: W / 2 + 2, minZ: -D / 2, maxZ: D / 2 });
  colliders.push({ minX: -W / 2 - 2, maxX: -W / 2 + 0.35, minZ: -D / 2, maxZ: D / 2 });
  // door block
  colliders.push({ minX: -1.75, maxX: 1.75, minZ: D / 2 - 0.4, maxZ: D / 2 + 1 });

  /* ── water tank ── */
  const tankGroup = new THREE.Group();
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x1d6fb8, roughness: 0.35, metalness: 0.55 });
  const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 2.35, 18), tankMat);
  tankBody.position.y = 1.18; tankBody.castShadow = true; tankGroup.add(tankBody);
  const tankLid = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.18, 18), new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.3, metalness: 0.7 }));
  tankLid.position.y = 2.42; tankGroup.add(tankLid);
  const tankRing = new THREE.Mesh(new THREE.TorusGeometry(1.09, 0.055, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }));
  tankRing.rotation.x = Math.PI / 2; tankRing.position.y = 1.5; tankGroup.add(tankRing);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 8), frameMat);
  pipe.position.set(-1.0, 0.8, 0); pipe.rotation.z = 0.6; tankGroup.add(pipe);
  tankGroup.position.set(11.4, 0, -6.3);
  addProxy(tankGroup, 2.6, 2.6, 2.6, 1.3);
  tankGroup.userData = { type: 'tank' };
  scene.add(tankGroup); interactables.push(tankGroup);
  addCollider(11.4, -6.3, 1.25, 1.25);

  /* ── nutrient mixing station ── */
  const mixer = new THREE.Group();
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.4, metalness: 0.6 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 1.15), tableMat);
  table.position.y = 0.95; table.castShadow = true; mixer.add(table);
  [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), tableMat);
    leg.position.set(x, 0.47, z); mixer.add(leg);
  });
  const drumCols = [0xe07b28, 0xe8ecef, 0x8b5cf6];
  drumCols.forEach((c, i) => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.72, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.4 }));
    drum.position.set(-0.72 + i * 0.72, 1.38, 0); drum.castShadow = true; mixer.add(drum);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.07, 12), tableMat);
    cap.position.set(-0.72 + i * 0.72, 1.77, 0); mixer.add(cap);
  });
  mixer.position.set(11.4, 0, -2.3);
  addProxy(mixer, 2.9, 2.2, 1.6, 1.0);
  mixer.userData = { type: 'mixer' };
  scene.add(mixer); interactables.push(mixer);
  addCollider(11.4, -2.3, 1.35, 0.75);

  /* ── office desk + computer ── */
  const office = new THREE.Group();
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.6 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 1.0), deskMat);
  desk.position.y = 0.78; desk.castShadow = true; office.add(desk);
  [[-1.0, -0.38], [1.0, -0.38], [-1.0, 0.38], [1.0, 0.38]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.12), deskMat);
    leg.position.set(x, 0.39, z); office.add(leg);
  });
  const screenTex = screenTexture();
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x03150c, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 1.15, map: screenTex });
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.06), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 }));
  monitor.position.set(0, 1.32, -0.28); monitor.rotation.x = -0.08; office.add(monitor);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.62), screenMat);
  screen.position.set(0, 1.32, -0.245); screen.rotation.x = -0.08; office.add(screen);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.36, 8), new THREE.MeshStandardMaterial({ color: 0x111827 }));
  stand.position.set(0, 0.98, -0.28); office.add(stand);
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.035, 0.24), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
  keyboard.position.set(0, 0.855, 0.16); office.add(keyboard);
  office.position.set(-11.6, 0, 5.6);
  office.rotation.y = Math.PI / 2 + 0.35;
  addProxy(office, 2.6, 2.0, 1.6, 1.1);
  office.userData = { type: 'computer' };
  scene.add(office); interactables.push(office);
  addCollider(-11.6, 5.6, 0.75, 1.25);

  /* ── market stall ── */
  const stall = new THREE.Group();
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x7c4a1e, roughness: 0.65 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.05, 1.25), counterMat);
  counter.position.y = 0.53; counter.castShadow = true; stall.add(counter);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.09, 1.4), new THREE.MeshStandardMaterial({ color: 0xa9713a, roughness: 0.5 }));
  counterTop.position.y = 1.1; stall.add(counterTop);
  // awning
  const awnTex = stripeTexture();
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.6), new THREE.MeshLambertMaterial({ map: awnTex, side: THREE.DoubleSide }));
  awn.position.set(0, 2.35, 0.35); awn.rotation.x = -0.32; stall.add(awn);
  [[-1.8], [1.8]].forEach(([x]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8), frameMat);
    pole.position.set(x, 1.15, 0.95); stall.add(pole);
  });
  // crates with produce
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 });
  const produceCols = [0xef4444, 0xf97316, 0x4ade80];
  [[-1.1, 0xef4444], [0, 0xf97316], [1.1, 0x4ade80]].forEach(([x, c]) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.7), crateMat);
    crate.position.set(x, 1.3, 0.05); stall.add(crate);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
      p.position.set(x - 0.2 + (i % 3) * 0.2, 1.5, 0.05 - Math.floor(i / 3) * 0.2);
      stall.add(p);
    }
  });
  stall.position.set(11.3, 0, 5.5);
  stall.rotation.y = -Math.PI / 2 - 0.15;
  addProxy(stall, 3.8, 2.6, 1.8, 1.3);
  stall.userData = { type: 'stall' };
  scene.add(stall); interactables.push(stall);
  addCollider(11.3, 5.5, 0.95, 1.9);

  /* ── crate stack decor + shelf ── */
  const crateStackMat = new THREE.MeshStandardMaterial({ color: 0x77512a, roughness: 0.85 });
  [[5.3, -6.9], [5.3, -6.1], [6.2, -6.5]].forEach(([x, z], i) => {
    M(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateStackMat, x, 0.4 + (i === 2 ? 0.8 : 0), z);
  });
  addCollider(5.5, -6.5, 1.3, 0.9);

  /* ══════════ GROW RACKS ══════════ */
  const rackPositions = [
    // Row A (back, unlocked from start)
    { x: -10.5, z: -3.6, rotY: 0 }, { x: -6.5, z: -3.6, rotY: 0 }, { x: -2.5, z: -3.6, rotY: 0 }, { x: 1.5, z: -3.6, rotY: 0 },
    // Row B (front-back, racks2)
    { x: -10.5, z: 3.6, rotY: Math.PI }, { x: -6.5, z: 3.6, rotY: Math.PI },
    // Row C (final two, racks4)
    { x: -2.5, z: 3.6, rotY: Math.PI }, { x: 1.5, z: 3.6, rotY: Math.PI },
  ];

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2f6b4c, roughness: 0.42, metalness: 0.35 });
  const channelMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.05 });
  const wrenchTex = wrenchTexture();
  const racks = [];

  rackPositions.forEach((pos, index) => {
    const g = new THREE.Group();
    // posts
    [[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.15, 0.1), metalMat);
      p.position.set(x, 1.075, z); p.castShadow = true; g.add(p);
    });
    // shelves + channels + LEDs
    const ledMats = [];
    [0.62, 1.5].forEach((shelfY) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.07, 1.2), metalMat);
      shelf.position.y = shelfY; shelf.castShadow = true; shelf.receiveShadow = true; g.add(shelf);
      [-0.3, 0.3].forEach(zOff => {
        const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 2.2, 10, 1, false, 0, Math.PI), channelMat);
        ch.rotation.z = Math.PI / 2; ch.rotation.x = Math.PI;
        ch.position.set(0, shelfY + 0.1, zOff); ch.castShadow = true; g.add(ch);
      });
      const ledMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfff7ae, emissiveIntensity: 2.1 });
      ledMats.push(ledMat);
      const led = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.055, 0.2), ledMat);
      led.position.y = shelfY + 0.78; g.add(led);
    });
    // top cap bar
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.09, 0.14), metalMat);
    cap.position.y = 2.16; g.add(cap);

    // aphids (pest indicator)
    const aphids = new THREE.Group();
    const aphidMat = new THREE.MeshBasicMaterial({ color: 0x1c0a00 });
    for (let i = 0; i < 14; i++) {
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), aphidMat);
      a.position.set(-1 + Math.random() * 2, 0.75 + Math.random() * 1.35, -0.35 + Math.random() * 0.7);
      aphids.add(a);
    }
    aphids.visible = false; g.add(aphids);

    // broken wrench sprite
    const wrenchMat = new THREE.SpriteMaterial({ map: wrenchTex, depthTest: false });
    const wrench = new THREE.Sprite(wrenchMat);
    wrench.scale.set(0.55, 0.55, 1); wrench.position.set(0, 2.45, 0); wrench.visible = false; g.add(wrench);

    // invisible hit proxy so the raycaster always finds the rack
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2.4, 1.5),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    proxy.position.y = 1.15;
    g.add(proxy);

    const plantsG = new THREE.Group(); g.add(plantsG);

    g.position.set(pos.x, 0, pos.z);
    g.rotation.y = pos.rotY;
    g.userData = { type: 'rack', rackIndex: index };
    g.traverse(o => { if (o.isMesh) o.userData.rackIndex = index; });
    scene.add(g);
    interactables.push(g);
    addCollider(pos.x, pos.z, 1.3, 0.85);

    // local slot offsets (2 shelves × 2 channels × 2 plants)
    const slots = [];
    [0.62, 1.5].forEach(shelfY => [-0.3, 0.3].forEach(zOff => [-0.72, 0.05, 0.78].forEach(xOff => {
      if (xOff === 0.05) return; // 2 plants per channel keeps count sane
      slots.push(new THREE.Vector3(xOff, shelfY + 0.16, zOff));
    })));

    racks.push({
      index, group: g, ledMats, aphids, wrench, plantsG, slots,
      unlocked: index < 4,
      data: { crop: null, growth: 0, water: 80, nutr: 60, ph: 6.5, health: 100, pests: false, broken: false },
      stageCache: -1, cropCache: null,
    });
    if (index >= 4) g.visible = false;
  });

  /* ── daylight controller ── */
  const daySky = { top: new THREE.Color(0x87c5e8), dawn: new THREE.Color(0xffc98a), dusk: new THREE.Color(0xff9e6e), fog: new THREE.Color() };
  function updateDaylight(t) {
    // t: 0 = 06:00, 1 = 22:00
    const elev = Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1));
    sun.intensity = 0.6 + 2.1 * elev;
    hemi.intensity = 0.55 + 0.55 * elev;
    const az = Math.PI * (0.15 + t * 0.7);
    sun.position.set(Math.cos(az) * 34, 12 + elev * 26, Math.sin(az) * 18 - 6);
    let sky;
    if (t < 0.12) sky = daySky.dawn.clone().lerp(daySky.top, t / 0.12);
    else if (t > 0.88) sky = daySky.top.clone().lerp(daySky.dusk, (t - 0.88) / 0.12);
    else sky = daySky.top.clone();
    scene.background = sky;
    if (scene.fog) scene.fog.color.copy(sky);
    sunBall.position.set(Math.cos(az) * 90, 8 + elev * 80, -80);
  }

  return { racks, interactables, colliders, sun, hemi, updateDaylight, screenMat, mixerPos: new THREE.Vector3(11.4, 1.2, -2.3), tankPos: new THREE.Vector3(11.4, 1.2, -6.3) };
}
