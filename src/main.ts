import { Body, Camera, SimConfig, MergeEvent } from './types';
import { Renderer } from './renderer';
import { stepSimulation, createBody, massToColor } from './physics';
import { loadPreset } from './presets';
import { ParticleSystem } from './particles';
import { generateStarfield, Star } from './starfield';

// ============================================================
// State
// ============================================================

let bodies: Body[] = [];
let selectedBody: Body | null = null;

const camera: Camera = {
  x: 0, y: 0, zoom: 0.7,
  targetX: 0, targetY: 0, targetZoom: 0.7,
  shakeX: 0, shakeY: 0, shakeIntensity: 0,
};

const config: SimConfig = {
  gravity: 1,
  timeScale: 1,
  softening: 10,
  damping: 1.0,
  trailLength: 80,
  bloomIntensity: 0.7,
  showTrails: true,
  showVectors: false,
  paused: false,
  followHeaviest: false,
  collisions: false,
  mergeOnCollision: false,
};

const canvas = document.getElementById('cosmos') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const particleSystem = new ParticleSystem();
const stars: Star[] = generateStarfield(1500);

// ============================================================
// UI
// ============================================================

const fpsDisplay = document.getElementById('fps-display')!;
const bodyCount = document.getElementById('body-count')!;
const hint = document.getElementById('hint')!;
const sidePanel = document.getElementById('side-panel')!;
const creationIndicator = document.getElementById('creation-indicator')!;
const bodyInfo = document.getElementById('body-info')!;
const infoDot = document.getElementById('info-dot')!;
const infoMass = document.getElementById('info-mass')!;
const infoSpeed = document.getElementById('info-speed')!;
const infoPos = document.getElementById('info-pos')!;
const infoRadius = document.getElementById('info-radius')!;

const btnMenu = document.getElementById('btn-menu')!;
const btnPlay = document.getElementById('btn-play')!;
const btnStep = document.getElementById('btn-step')!;
const btnTrails = document.getElementById('btn-trails')!;
const btnVectors = document.getElementById('btn-vectors')!;
const btnCenter = document.getElementById('btn-center')!;
const btnFollow = document.getElementById('btn-follow')!;
const btnClear = document.getElementById('btn-clear')!;

const gravitySlider = document.getElementById('gravity-slider') as HTMLInputElement;
const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
const softeningSlider = document.getElementById('softening-slider') as HTMLInputElement;
const dampingSlider = document.getElementById('damping-slider') as HTMLInputElement;
const trailSlider = document.getElementById('trail-slider') as HTMLInputElement;
const bloomSlider = document.getElementById('bloom-slider') as HTMLInputElement;

const gravityValue = document.getElementById('gravity-value')!;
const timeValue = document.getElementById('time-value')!;
const softeningValue = document.getElementById('softening-value')!;
const dampingValue = document.getElementById('damping-value')!;
const trailValue = document.getElementById('trail-value')!;
const bloomValue = document.getElementById('bloom-value')!;

let panelVisible = false;

function updateSliderDisplays(): void {
  gravityValue.textContent = parseFloat(gravitySlider.value).toFixed(2);
  timeValue.textContent = parseFloat(timeSlider.value).toFixed(2);
  softeningValue.textContent = softeningSlider.value;
  dampingValue.textContent = parseFloat(dampingSlider.value).toFixed(3);
  trailValue.textContent = trailSlider.value;
  bloomValue.textContent = parseFloat(bloomSlider.value).toFixed(2);
}

function syncSlidersFromConfig(): void {
  gravitySlider.value = String(config.gravity);
  timeSlider.value = String(config.timeScale);
  softeningSlider.value = String(config.softening);
  dampingSlider.value = String(config.damping);
  trailSlider.value = String(config.trailLength);
  bloomSlider.value = String(config.bloomIntensity);
  updateSliderDisplays();
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 10000) return n.toExponential(1);
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 1) return n.toFixed(1);
  return n.toFixed(2);
}

function updateBodyInfo(): void {
  if (!selectedBody || !selectedBody.alive) {
    selectedBody = null;
    bodyInfo.classList.remove('visible');
    return;
  }
  bodyInfo.classList.add('visible');
  const b = selectedBody;
  const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  infoDot.style.background = `rgb(${Math.round(b.color[0]*255)},${Math.round(b.color[1]*255)},${Math.round(b.color[2]*255)})`;
  infoMass.textContent = formatNum(b.mass);
  infoSpeed.textContent = formatNum(speed);
  infoPos.textContent = `${formatNum(b.x)}, ${formatNum(b.y)}`;
  infoRadius.textContent = formatNum(b.radius);
}

// Slider bindings
gravitySlider.addEventListener('input', () => { config.gravity = parseFloat(gravitySlider.value); updateSliderDisplays(); });
timeSlider.addEventListener('input', () => { config.timeScale = parseFloat(timeSlider.value); updateSliderDisplays(); });
softeningSlider.addEventListener('input', () => { config.softening = parseFloat(softeningSlider.value); updateSliderDisplays(); });
dampingSlider.addEventListener('input', () => { config.damping = parseFloat(dampingSlider.value); updateSliderDisplays(); });
trailSlider.addEventListener('input', () => { config.trailLength = parseInt(trailSlider.value); updateSliderDisplays(); });
bloomSlider.addEventListener('input', () => { config.bloomIntensity = parseFloat(bloomSlider.value); updateSliderDisplays(); });

// Button bindings
btnMenu.addEventListener('click', () => {
  panelVisible = !panelVisible;
  sidePanel.classList.toggle('visible', panelVisible);
  btnMenu.classList.toggle('active', panelVisible);
});

btnPlay.addEventListener('click', () => {
  config.paused = !config.paused;
  btnPlay.textContent = config.paused ? '▶' : '⏸';
  btnPlay.classList.toggle('active', config.paused);
});

btnStep.addEventListener('click', () => {
  if (config.paused) stepSimulation(bodies, config, 1 / 60);
});

btnTrails.addEventListener('click', () => {
  config.showTrails = !config.showTrails;
  btnTrails.classList.toggle('active', config.showTrails);
});
btnTrails.classList.add('active');

btnVectors.addEventListener('click', () => {
  config.showVectors = !config.showVectors;
  btnVectors.classList.toggle('active', config.showVectors);
});

btnCenter.addEventListener('click', () => {
  config.followHeaviest = false;
  btnFollow.classList.remove('active');
  selectedBody = null;
  camera.targetX = 0;
  camera.targetY = 0;
});

btnFollow.addEventListener('click', () => {
  config.followHeaviest = !config.followHeaviest;
  btnFollow.classList.toggle('active', config.followHeaviest);
});

btnClear.addEventListener('click', () => {
  bodies = [];
  selectedBody = null;
});

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = (btn as HTMLElement).dataset.preset!;
    const result = loadPreset(preset);
    bodies = result.bodies;
    selectedBody = null;
    if (result.config) {
      Object.assign(config, result.config);
      if (result.config.mergeOnCollision === undefined) config.mergeOnCollision = false;
      syncSlidersFromConfig();
    }
    if (result.camera) {
      Object.assign(camera, { ...result.camera, shakeX: 0, shakeY: 0, shakeIntensity: 0 });
    }
  });
});

// ============================================================
// Interaction
// ============================================================

interface DragState {
  type: 'none' | 'create' | 'pan';
  startX: number;
  startY: number;
  startWorldX: number;
  startWorldY: number;
  currentX: number;
  currentY: number;
  movedDistance: number;
}

const drag: DragState = {
  type: 'none', startX: 0, startY: 0,
  startWorldX: 0, startWorldY: 0,
  currentX: 0, currentY: 0, movedDistance: 0,
};

function screenToWorld(sx: number, sy: number): { x: number; y: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    x: (sx * dpr - canvas.width / 2) / camera.zoom + camera.x,
    y: (sy * dpr - canvas.height / 2) / camera.zoom + camera.y,
  };
}

function findBodyAt(wx: number, wy: number): Body | null {
  let closest: Body | null = null;
  let closestDist = Infinity;
  const hitRadius = 15 / camera.zoom; // Generous hit area
  for (const b of bodies) {
    if (!b.alive) continue;
    const dx = b.x - wx;
    const dy = b.y - wy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const threshold = Math.max(b.radius * 3, hitRadius);
    if (dist < threshold && dist < closestDist) {
      closest = b;
      closestDist = dist;
    }
  }
  return closest;
}

// Mouse
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  if (e.button === 2 || e.button === 1 || e.ctrlKey || e.metaKey) {
    drag.type = 'pan';
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.startWorldX = camera.targetX;
    drag.startWorldY = camera.targetY;
  } else {
    drag.type = 'create';
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    const world = screenToWorld(e.clientX, e.clientY);
    drag.startWorldX = world.x;
    drag.startWorldY = world.y;
    drag.currentX = e.clientX;
    drag.currentY = e.clientY;
    drag.movedDistance = 0;
    creationIndicator.style.display = 'block';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (drag.type === 'pan') {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dx = (e.clientX - drag.startX) * dpr / camera.zoom;
    const dy = (e.clientY - drag.startY) * dpr / camera.zoom;
    camera.targetX = drag.startWorldX - dx;
    camera.targetY = drag.startWorldY - dy;
    config.followHeaviest = false;
    btnFollow.classList.remove('active');
  } else if (drag.type === 'create') {
    drag.currentX = e.clientX;
    drag.currentY = e.clientY;
    const dx = drag.currentX - drag.startX;
    const dy = drag.currentY - drag.startY;
    drag.movedDistance = Math.sqrt(dx * dx + dy * dy);
    updateCreationIndicator(dx, dy);
  }
});

canvas.addEventListener('mouseup', () => {
  if (drag.type === 'create') {
    const dx = drag.currentX - drag.startX;
    const dy = drag.currentY - drag.startY;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);

    if (pixelDist < 5) {
      // Click — try to select a body
      const hit = findBodyAt(drag.startWorldX, drag.startWorldY);
      selectedBody = hit;
    } else {
      const mass = Math.max(1, pixelDist * 2);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const velocityScale = 0.3 / camera.zoom * dpr;
      bodies.push(createBody(drag.startWorldX, drag.startWorldY, -dx * velocityScale, -dy * velocityScale, mass, massToColor(mass)));
      hint.style.opacity = '0';
    }
    creationIndicator.style.display = 'none';
    (creationIndicator.querySelector('.arrow') as HTMLElement).style.display = 'none';
  }
  drag.type = 'none';
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.targetZoom = Math.max(0.01, Math.min(20, camera.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1)));
}, { passive: false });

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch
let touchStartDist = 0;
let touchStartZoom = 0;
let touchTimer: number | null = null;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    drag.type = 'create';
    drag.startX = e.touches[0].clientX;
    drag.startY = e.touches[0].clientY;
    const world = screenToWorld(drag.startX, drag.startY);
    drag.startWorldX = world.x;
    drag.startWorldY = world.y;
    drag.currentX = drag.startX;
    drag.currentY = drag.startY;
    drag.movedDistance = 0;

    // Long press to select (300ms)
    touchTimer = window.setTimeout(() => {
      if (drag.movedDistance < 10) {
        const hit = findBodyAt(drag.startWorldX, drag.startWorldY);
        if (hit) {
          selectedBody = hit;
          drag.type = 'none';
          creationIndicator.style.display = 'none';
        }
      }
      touchTimer = null;
    }, 300);

    creationIndicator.style.display = 'block';
  } else if (e.touches.length === 2) {
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    drag.type = 'pan';
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    touchStartDist = Math.sqrt(dx * dx + dy * dy);
    touchStartZoom = camera.targetZoom;
    drag.startX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    drag.startY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    drag.startWorldX = camera.targetX;
    drag.startWorldY = camera.targetY;
    creationIndicator.style.display = 'none';
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && drag.type === 'create') {
    drag.currentX = e.touches[0].clientX;
    drag.currentY = e.touches[0].clientY;
    const dx = drag.currentX - drag.startX;
    const dy = drag.currentY - drag.startY;
    drag.movedDistance = Math.sqrt(dx * dx + dy * dy);
    if (drag.movedDistance > 10 && touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    updateCreationIndicator(dx, dy);
  } else if (e.touches.length === 2 && drag.type === 'pan') {
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    camera.targetZoom = Math.max(0.01, Math.min(20, touchStartZoom * (dist / touchStartDist)));
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    camera.targetX = drag.startWorldX - (midX - drag.startX) * dpr / camera.zoom;
    camera.targetY = drag.startWorldY - (midY - drag.startY) * dpr / camera.zoom;
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
  if (drag.type === 'create' && e.touches.length === 0) {
    const dx = drag.currentX - drag.startX;
    const dy = drag.currentY - drag.startY;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);

    if (pixelDist < 10) {
      // Tap — select body or deselect
      const hit = findBodyAt(drag.startWorldX, drag.startWorldY);
      selectedBody = hit;
    } else {
      const mass = Math.max(1, pixelDist * 2);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const velocityScale = 0.3 / camera.zoom * dpr;
      bodies.push(createBody(drag.startWorldX, drag.startWorldY, -dx * velocityScale, -dy * velocityScale, mass, massToColor(mass)));
      hint.style.opacity = '0';
    }
    creationIndicator.style.display = 'none';
  }
  if (e.touches.length === 0) drag.type = 'none';
});

function updateCreationIndicator(dx: number, dy: number): void {
  const dist = Math.sqrt(dx * dx + dy * dy);
  const mass = Math.max(1, dist * 2);
  const size = Math.max(20, Math.min(60, Math.pow(mass, 0.35) * 8));

  creationIndicator.style.left = `${drag.startX}px`;
  creationIndicator.style.top = `${drag.startY}px`;

  const ring = creationIndicator.querySelector('.ring') as HTMLElement;
  ring.style.width = `${size}px`;
  ring.style.height = `${size}px`;

  const massLabel = creationIndicator.querySelector('.mass-label') as HTMLElement;
  massLabel.textContent = dist > 5 ? `m=${formatNum(mass)}` : '';

  if (dist > 5) {
    const arrow = creationIndicator.querySelector('.arrow') as HTMLElement;
    arrow.style.width = `${dist}px`;
    arrow.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    arrow.style.display = 'block';
  }
}

// Keyboard
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case ' ':
      e.preventDefault();
      config.paused = !config.paused;
      btnPlay.textContent = config.paused ? '▶' : '⏸';
      btnPlay.classList.toggle('active', config.paused);
      break;
    case 't': config.showTrails = !config.showTrails; btnTrails.classList.toggle('active', config.showTrails); break;
    case 'v': config.showVectors = !config.showVectors; btnVectors.classList.toggle('active', config.showVectors); break;
    case 'c': camera.targetX = 0; camera.targetY = 0; break;
    case 'f': config.followHeaviest = !config.followHeaviest; btnFollow.classList.toggle('active', config.followHeaviest); break;
    case 'Escape': selectedBody = null; break;
    case 'Backspace': case 'Delete': bodies = []; selectedBody = null; break;
    case 'Tab':
      e.preventDefault();
      panelVisible = !panelVisible;
      sidePanel.classList.toggle('visible', panelVisible);
      btnMenu.classList.toggle('active', panelVisible);
      break;
  }
});

// ============================================================
// Main Loop
// ============================================================

let lastTime = 0;
let frameCount = 0;
let fpsTimer = 0;
let displayFps = 60;

function loop(time: number): void {
  requestAnimationFrame(loop);

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // FPS
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    displayFps = Math.round(frameCount / fpsTimer);
    fpsTimer = 0;
    frameCount = 0;
  }

  // Smooth camera
  const lerpSpeed = 1 - Math.pow(0.001, dt);
  camera.x += (camera.targetX - camera.x) * lerpSpeed;
  camera.y += (camera.targetY - camera.y) * lerpSpeed;
  camera.zoom += (camera.targetZoom - camera.zoom) * lerpSpeed;

  // Camera shake decay
  if (camera.shakeIntensity > 0.01) {
    camera.shakeX = (Math.random() - 0.5) * camera.shakeIntensity;
    camera.shakeY = (Math.random() - 0.5) * camera.shakeIntensity;
    camera.shakeIntensity *= Math.pow(0.02, dt);
  } else {
    camera.shakeX = 0;
    camera.shakeY = 0;
    camera.shakeIntensity = 0;
  }

  // Follow heaviest
  if (config.followHeaviest) {
    let heaviest: Body | null = null;
    let maxMass = 0;
    for (const b of bodies) {
      if (b.alive && b.mass > maxMass) { maxMass = b.mass; heaviest = b; }
    }
    if (heaviest) { camera.targetX = heaviest.x; camera.targetY = heaviest.y; }
  }

  // Physics with merge event tracking
  if (!config.paused) {
    const mergeEvents: MergeEvent[] = [];
    const steps = Math.max(1, Math.ceil(config.timeScale));
    const subDt = dt / steps;
    for (let i = 0; i < steps; i++) {
      stepSimulation(bodies, config, subDt, mergeEvents);
    }

    // Spawn explosion particles and camera shake for merges
    for (const evt of mergeEvents) {
      particleSystem.spawnMergeExplosion(evt);
      camera.shakeIntensity = Math.min(15, camera.shakeIntensity + Math.sqrt(evt.mass) * 0.3);
    }
  }

  // Update particles
  particleSystem.update(dt);

  // Clean dead bodies
  bodies = bodies.filter(b => b.alive);

  // If selected body died, deselect
  if (selectedBody && !selectedBody.alive) selectedBody = null;

  // Render
  renderer.render(bodies, camera, config, particleSystem.particles, stars, selectedBody, dt);

  // Update UI
  fpsDisplay.textContent = `${displayFps} FPS`;
  bodyCount.textContent = `${bodies.length} bod${bodies.length === 1 ? 'y' : 'ies'}`;
  updateBodyInfo();
}

// ============================================================
// Init
// ============================================================

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
  hint.textContent = 'Tap & drag to create — Pinch to zoom — Two fingers to pan';
}

const initial = loadPreset('solar-system');
bodies = initial.bodies;
if (initial.config) Object.assign(config, initial.config);
if (initial.camera) Object.assign(camera, { ...initial.camera, shakeX: 0, shakeY: 0, shakeIntensity: 0 });
syncSlidersFromConfig();
requestAnimationFrame(loop);

setTimeout(() => { if (hint.style.opacity !== '0') hint.style.opacity = '0'; }, 6000);
