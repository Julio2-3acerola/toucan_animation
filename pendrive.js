// Pendrive do Toucan em 3D, no formato do pendrive de capa deslizante usado na bancada,
// um pouco mais comprido que o original (68 x 21 x 10,2 mm; escala 1 unidade = 20 mm).
// Corpo preto com furo de chaveiro, placa em flecha com o olho do tucano e o nome "toucan", nervuras diagonais; conector USB 3.0.
// A capa deslizante é o bico do tucano: laranja, dorso amarelo e ponta preta.
// Clicar no pendrive: o bico avança e fecha sobre o conector; clicar de novo: recua e mostra a ponta.
// Ao abrir a página o bico começa fechado e recua sozinho uma vez. Arrastar gira a cena.
import * as THREE from 'three';

const canvas = document.getElementById('pendrive');
const stage = canvas.parentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.NoToneMapping;   // laranja e amarelo da marca sem desbotar
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
{
  // estúdio cinza com faixas de luz: o plástico ganha reflexos alongados nas facetas
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x3c4247);
  const strip = (w, h, x, y, z, ry, v) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry; studio.add(m);
  };
  strip(10, 2, 0, 6, -6, 0, 5);
  strip(2, 8, 7, 1, 2, -Math.PI / 2, 2.5);
  strip(8, 1.2, -6, 3, 4, Math.PI / 2, 1.5);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.3, 1.3) }));
  top.position.y = 9; top.rotation.x = Math.PI / 2; studio.add(top);
  scene.environment = pmrem.fromScene(studio, 0.03).texture;
}

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
camera.position.set(0.3, 1.6, 7.4);

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(3, 5, 4);
const rim = new THREE.DirectionalLight(0x9fe3bd, 1.2);   // contraluz esverdeada, da mata do fundo
rim.position.set(-4, 2, -5);
scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x0f1a14, 0.35));

// ---------- cores dos tokens do style.css ----------
const css = getComputedStyle(document.documentElement);
const token = (name, fallback) => new THREE.Color((css.getPropertyValue(name) || '').trim() || fallback);
const C = {
  head: token('--model-head', '#121514'), beak: token('--model-beak', '#ff8a00'), ridge: token('--model-ridge', '#ffd400'),
  tip: token('--model-tip', '#1a1a1a'), port: token('--model-port', '#1f6fd6'), name: token('--model-beak', '#ff8a00'),
  eye: token('--model-eye', '#ffffff'),
};

// ---------- materiais ----------
const bodyMat = new THREE.MeshPhysicalMaterial({ color: C.head, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.6 });
const plateMat = new THREE.MeshPhysicalMaterial({ color: C.head, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 });
const steel = new THREE.MeshStandardMaterial({ color: 0xdfe3e7, metalness: 1, roughness: 0.34 });
const portMat = new THREE.MeshStandardMaterial({ color: C.port, roughness: 0.45 });
const dark = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.7 });

// Medidas (1 unidade = 20 mm). x = comprimento, y = largura, z = espessura.
const L = 68 / 20, W = 21 / 20, T = 10.2 / 20;   // original: 60,7 mm de comprimento
const BACK = -L / 2;                       // traseira (furo de chaveiro)
const PLUG_LEN = 12 / 20;
const BODY_FRONT = L / 2 - 0.12 - PLUG_LEN;  // frente do corpo, onde nasce o conector (a ponta fica 2,4 mm dentro da capa)
const BW = W - 0.05, BT = T - 0.06;        // corpo um pouco menor que a capa que o abraça
const PLUG = { len: PLUG_LEN, w: 12 / 20, t: 4.5 / 20 };

const pendrive = new THREE.Group();
const flight = new THREE.Group();   // FlightGroup: posição, escala e giro globais
scene.add(flight);
flight.add(pendrive);        // PendriveRoot: inclinação, flutuação e mouse

// ---------- corpo preto com furo de chaveiro ----------
{
  const x0 = BACK, x1 = BODY_FRONT, y = BW / 2, ch = 0.12;   // cantos traseiros chanfrados
  const s = new THREE.Shape();
  s.moveTo(x0 + ch, -y);
  s.lineTo(x1, -y);
  s.lineTo(x1, y);
  s.lineTo(x0 + ch, y);
  s.lineTo(x0, y - ch);
  s.lineTo(x0, -y + ch);
  s.lineTo(x0 + ch, -y);
  const hole = new THREE.Path();   // janela retangular do chaveiro
  hole.moveTo(x0 + 0.1, -0.22); hole.lineTo(x0 + 0.1, 0.22); hole.lineTo(x0 + 0.24, 0.22); hole.lineTo(x0 + 0.24, -0.22); hole.lineTo(x0 + 0.1, -0.22);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: BT - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
  geo.translate(0, 0, -(BT - 0.04) / 2);
  pendrive.add(new THREE.Mesh(geo, bodyMat));
}

// placa em flecha (faceta brilhante) com o nome, nas duas faces; aponta para o conector
const PLATE_BACK = BACK + 0.3, PLATE_TIP = BACK + 0.98;   // fica visível com a capa aberta, como o "128GB"
const plateShape = new THREE.Shape();
plateShape.moveTo(PLATE_BACK, -BW / 2 + 0.06);
plateShape.lineTo(PLATE_TIP - 0.24, -BW / 2 + 0.06);
plateShape.lineTo(PLATE_TIP, 0.02);
plateShape.lineTo(PLATE_TIP - 0.24, BW / 2 - 0.06);
plateShape.lineTo(PLATE_BACK, BW / 2 - 0.06);
plateShape.lineTo(PLATE_BACK, -BW / 2 + 0.06);
const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 2 });

function nameDecal() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const draw = () => {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#' + C.name.getHexString();
    ctx.font = '800 96px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('toucan', 10, 68);
  };
  draw();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.135),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.userData.redraw = () => { draw(); tex.needsUpdate = true; };
  return m;
}
const names = [];
for (const side of [1, -1]) {
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.z = side > 0 ? BT / 2 - 0.004 : -BT / 2 - 0.016;
  pendrive.add(plate);
  const n = nameDecal();
  n.position.set(PLATE_BACK + 0.29, -0.15, side * (BT / 2 + 0.03));
  if (side < 0) n.rotation.y = Math.PI;
  pendrive.add(n);
  names.push(n);
  // nervuras diagonais entre a placa e a capa
  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.025, BW * 0.62, 0.014), plateMat);
    rib.position.set(PLATE_TIP + 0.08 + i * 0.09, 0, side * (BT / 2 + 0.004));
    rib.rotation.z = -0.55;
    pendrive.add(rib);
  }
  // olho do tucano acima do nome: olho branco, pupila preta e um brilho
  const eye = new THREE.Group();
  const eyeMat = (color) => new THREE.MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: -3 });   // sem sombra: branco de verdade
  const ring = new THREE.Mesh(new THREE.CircleGeometry(0.15, 48), eyeMat(C.eye));
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.07, 32), eyeMat(0x000000));
  pupil.position.set(0.02, 0, 0.001);   // olhando para o bico
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.02, 16), eyeMat(0xffffff));
  glint.position.set(0.04, 0.025, 0.002);
  eye.add(ring, pupil, glint);
  eye.position.set(PLATE_BACK + 0.22, 0.18, side * (BT / 2 + 0.031));
  if (side < 0) eye.rotation.y = Math.PI;
  pendrive.add(eye);
}
document.fonts?.ready.then(() => names.forEach((n) => n.userData.redraw()));

// ---------- conector USB 3.0 ----------
const plug = new THREE.Group();
plug.position.x = BODY_FRONT;
{
  const t = 0.01;
  const top = new THREE.Mesh(new THREE.BoxGeometry(PLUG.len, PLUG.w, t), steel);
  top.position.set(PLUG.len / 2, 0, PLUG.t / 2 - t / 2);
  const bottom = top.clone(); bottom.position.z = -PLUG.t / 2 + t / 2;
  const sA = new THREE.Mesh(new THREE.BoxGeometry(PLUG.len, t, PLUG.t), steel);
  sA.position.set(PLUG.len / 2, PLUG.w / 2 - t / 2, 0);
  const sB = sA.clone(); sB.position.y = -PLUG.w / 2 + t / 2;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.02, PLUG.w - 2 * t, PLUG.t - 2 * t), dark);
  back.position.x = 0.01;
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(PLUG.len - 0.05, PLUG.w - 2 * t - 0.004, 0.08), portMat);
  tongue.position.set((PLUG.len - 0.05) / 2 + 0.02, 0, -0.04);
  plug.add(top, bottom, sA, sB, back, tongue);
  for (const x of [0.17, 0.38]) for (const y of [0.13, -0.13]) for (const z of [1, -1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.004), portMat);
    win.position.set(x, y, z * (PLUG.t / 2 + 0.001));
    plug.add(win);
  }
}
pendrive.add(plug);

// ---------- capa deslizante = bico do tucano ----------
// Vista de cima: traseira em V (encaixa na flecha da placa), frente afinando e curvando para baixo até a ponta.
const CAP_LEN = 1.55;   // cerca de 31 mm
const capShape = new THREE.Shape();
const y = W / 2;
capShape.moveTo(0.16, 0);                                   // fundo do V da traseira
capShape.lineTo(0, y);
capShape.lineTo(CAP_LEN - 0.42, y);
capShape.bezierCurveTo(CAP_LEN - 0.06, y, CAP_LEN, 0.3, CAP_LEN, -0.1);   // dorso curvo descendo até a ponta
capShape.bezierCurveTo(CAP_LEN, -0.36, CAP_LEN - 0.14, -y, CAP_LEN - 0.36, -y);
capShape.lineTo(0, -y);
capShape.lineTo(0.16, 0);
const capGeo = new THREE.ExtrudeGeometry(capShape, { depth: T - 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 5, curveSegments: 40 });
capGeo.translate(0, 0, -(T - 0.06) / 2);

// Pintura pela posição no próprio bico: dorso amarelo, lateral laranja, ponta preta.
const beakMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 0.5 });
beakMat.onBeforeCompile = (sh) => {
  sh.uniforms.cY = { value: C.ridge }; sh.uniforms.cO = { value: C.beak }; sh.uniforms.cT = { value: C.tip };
  sh.uniforms.capLen = { value: CAP_LEN };
  sh.vertexShader = 'varying vec3 vBeak;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBeak = position;');
  sh.fragmentShader = 'varying vec3 vBeak; uniform vec3 cY; uniform vec3 cO; uniform vec3 cT; uniform float capLen;\n' + sh.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
     float ridge = smoothstep(-0.015, 0.015, vBeak.y - (0.2 - vBeak.x * 0.1));
     float tip = smoothstep(-0.015, 0.015, vBeak.x - (capLen - 0.2));
     vec3 band = mix(mix(cO, cY, ridge), cT, tip);
     diffuseColor.rgb = band;
     totalEmissiveRadiance += band * 0.3 * (1.0 - tip);   // bico vivo mesmo na sombra`);
};
const cap = new THREE.Mesh(capGeo, beakMat);
pendrive.add(cap);

// Fechado: a capa cobre o conector e a ponta fica no fim dos 60,7 mm. Aberto: recua até a frente do corpo.
const CAP_CLOSED = L / 2 - CAP_LEN, CAP_OPEN = BODY_FRONT - CAP_LEN;

// sombra suave
{
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.15;
  
}



// ---------- cena global: movimento guiado pela rolagem ----------
const rad = (d) => d * Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lerpAngle = (a, b, t) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;   // menor caminho
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
scene.add(new THREE.DirectionalLight(0xffd9a0, 1.3).translateX(5).translateY(-1).translateZ(-4));

// x/y em unidades de viewport (-1..1); yaw em graus; cap: 1 = capa recolhida (aberto), 0 = fechado
const KD = [
  { x: .52, y: 0,    s: 1.10, yaw: 35,  pitch: 8,  roll: -5, cap: 1 },
  { x: -.44, y: -.14, s: 1.02, yaw: 52,  pitch: 10, roll: 6,  cap: .5 }, // Seção 01 — Entrada (centralizado à esquerda)
  { x: .40, y: -.12, s: 1.15, yaw: 150, pitch: -8, roll: -8, cap: 1 },
  { x: -.38, y: .04, s: .95,  yaw: 210, pitch: 10, roll: 5,  cap: 0 },
  { x: .36, y: .08,  s: .90,  yaw: 300, pitch: 6,  roll: -5, cap: .6 },
  { x: 0,   y: -.08, s: 1.10, yaw: 395, pitch: 5,  roll: 0,  cap: 1 },
];
const KM = [
  { x: .05, y: .50, s: .80, yaw: 35,  pitch: 8,  roll: -5, cap: 1 },
  { x: -.12, y: .52, s: .72, yaw: 60, pitch: 12, roll: 8,  cap: .5 },
  { x: .12, y: .52, s: .78, yaw: 150, pitch: -8, roll: -8, cap: 1 },
  { x: -.12, y: .52, s: .72, yaw: 210, pitch: 10, roll: 5, cap: 0 },
  { x: .12, y: .52, s: .72, yaw: 300, pitch: 6,  roll: -5, cap: .6 },
  { x: 0,   y: .22, s: .85, yaw: 395, pitch: 5,  roll: 0,  cap: 1 },
];
const mobile = () => innerWidth < 760;
const secs = [...document.querySelectorAll('main .cine')];
let tops = [];
const measure = () => { tops = secs.map((s) => s.getBoundingClientRect().top + scrollY); };
measure();
addEventListener('resize', measure); addEventListener('load', measure);
new ResizeObserver(measure).observe(document.body);

function targetAt() {   // posição real das seções; segura em cada uma e voa entre elas (sobe e desce)
  const K = mobile() ? KM : KD, n = secs.length, y = scrollY;
  let i = 0;
  while (i < n - 1 && tops[i + 1] <= y) i++;
  if (i >= n - 1) return { ...K[n - 1], moving: 0, i: n - 1 };
  const f = clamp((y - tops[i]) / ((tops[i + 1] - tops[i]) || 1), 0, 1);
  const t = ease(clamp((f - .12) / .76, 0, 1)), a = K[i], b = K[i + 1], sn = Math.sin(t * Math.PI);
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) - sn * .18, s: lerp(a.s, b.s, t) * (1 + sn * .10),
    yaw: lerpAngle(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t), roll: lerp(a.roll, b.roll, t),
    cap: lerp(a.cap, b.cap, t), moving: sn, i,
  };
}

// ---------- capa: controle manual que convive com os keyframes ----------
const capBtn = document.getElementById('capbtn');
let manual = null, lastI = 0, capCur = 0, capGoal = 0;
capBtn?.addEventListener('click', () => { manual = capGoal > .5 ? 0 : 1; });
const placeCap = (k) => { cap.position.x = THREE.MathUtils.lerp(CAP_CLOSED, CAP_OPEN, ease(clamp(k, 0, 1))); };
placeCap(0);

// ---------- mouse, introdução e laço ----------
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -((e.clientY / innerHeight) * 2 - 1); }, { passive: true });
let introAt = calm ? -1e9 : null;
const loaderEl = document.getElementById('loader');
const go = () => {
  if (introAt === null) introAt = performance.now();
  loaderEl?.classList.add('done'); document.body.classList.add('loaded');
};
(document.fonts?.ready || Promise.resolve()).then(() => setTimeout(go, calm ? 0 : 1800));
setTimeout(go, 2600);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.position.set(0, .9, 10); camera.lookAt(0, 0, 0);   // origem no centro da tela: x/y dos keyframes passam a valer de fato
  camera.aspect = innerWidth / innerHeight; camera.fov = 30; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const cur = { ...(mobile() ? KM : KD)[0] };
let lastY = scrollY, vel = 0, last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000) || 0.016; last = now;
  const t = now / 1000;
  const intro = introAt === null ? 0 : clamp((now - introAt) / 2600, 0, 1);
  const endY = tops[tops.length - 1] || 1e9;
  const op = clamp(intro * 4, 0, 1) * (1 - clamp((scrollY - endY) / (innerHeight * .7), 0, 1));
  canvas.style.opacity = op;
  const hidden = op < .01;
  canvas.style.visibility = hidden ? 'hidden' : 'visible';
  if (capBtn) capBtn.style.visibility = hidden ? 'hidden' : 'visible';
  if (hidden) return;

  const tg = targetAt();
  if (tg.i !== lastI) { lastI = tg.i; manual = null; }   // a mudança de seção devolve o comando aos keyframes
  const k = calm ? 1 : 1 - Math.exp(-dt * 3.2), ky = calm ? 1 : 1 - Math.exp(-dt * 2.6);
  cur.x += (tg.x - cur.x) * k; cur.y += (tg.y - cur.y) * k; cur.s += (tg.s - cur.s) * k;
  cur.pitch += (tg.pitch - cur.pitch) * k; cur.roll += (tg.roll - cur.roll) * k;
  cur.yaw = lerpAngle(cur.yaw, tg.yaw, ky);

  capGoal = intro < .55 ? 0 : (manual !== null ? manual : tg.cap);
  capCur += (capGoal - capCur) * (calm ? 1 : 1 - Math.exp(-dt * 4));
  placeCap(capCur);
  const lbl = capGoal > .5 ? 'Fechar capa' : 'Abrir capa';
  if (capBtn && capBtn.dataset.l !== lbl) { capBtn.textContent = lbl; capBtn.dataset.l = lbl; }

  vel += ((scrollY - lastY) / Math.max(dt, .001) / innerHeight - vel) * (1 - Math.exp(-dt * 6)); lastY = scrollY;
  const km = 1 - Math.exp(-dt * 2);
  mouse.sx += (mouse.x - mouse.sx) * km; mouse.sy += (mouse.y - mouse.sy) * km;
  const m = calm ? 0 : 1;

  const halfH = Math.tan(rad(camera.fov / 2)) * camera.position.z, halfW = halfH * camera.aspect;
  const fit = mobile() ? Math.min(halfW * 2 * .66, halfH * 2 * .36) : Math.min(halfH * 2 * .66, halfW * 2 * .46);
  const scaleIn = calm ? 1 : ease(clamp(intro / .45, 0, 1));
  const yawIn = calm ? 0 : (1 - ease(intro)) * -200;
  flight.position.set(
    cur.x * halfW + m * (Math.sin(t * 1.3) * .04 + mouse.sx * .12),
    (cur.y + (mobile() ? 0 : .3)) * halfH + m * (Math.sin(t * 2.1) * .045 * halfH * .5 + Math.sin(t * 3.7) * .015 * halfH * .5 + mouse.sy * .08),
    m * Math.sin(t * .9) * .15);
  flight.scale.setScalar(Math.max(.001, fit / L * cur.s * scaleIn));
  flight.rotation.y = rad(cur.yaw + yawIn + m * mouse.sx * 12);
  pendrive.rotation.set(
    rad(cur.roll + m * Math.sin(t * 1.7) * 3 + clamp(vel * 10, -14, 14) * .5),
    0,
    rad(cur.pitch - clamp(vel * 14, -14, 14) + m * (Math.sin(t * 2.1 + 1) * 2 + mouse.sy * 6)));
  renderer.render(scene, camera);
});

// ---------- efeitos de DOM ----------
const sections = [...document.querySelectorAll('main > section')];
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: .2 });
sections.forEach((s) => io.observe(s));
const par = [...document.querySelectorAll('[data-speed]')];
function dom() {
  const vh = innerHeight;
  for (const el of par) {
    const p = -el.closest('section').getBoundingClientRect().top / vh;
    el.style.transform = `translate3d(0,${(calm ? 0 : p * (+el.dataset.speed) * vh).toFixed(1)}px,0) rotate(${(calm ? 0 : p * (+el.dataset.rot || 0)).toFixed(2)}deg)`;
  }
  const probe = vh * .06;
  const s = sections.find((e) => { const r = e.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
  document.body.classList.toggle('on-light', !!s && s.dataset.theme === 'light');
  document.body.classList.toggle('in-entrada', !!s && s.id === 'entrada');
}
addEventListener('scroll', dom, { passive: true }); addEventListener('resize', dom); dom();
