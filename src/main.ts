import { Body, Camera, SimConfig, MergeEvent } from './types';
import { Renderer } from './renderer';
import { stepSimulation } from './physics';
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
  timeScale: 0.5,
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
// Speed levels
// ============================================================

const speedLevels = [0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32];
let speedIndex = 2; // starts at 0.5x

function updateSpeedDisplay(): void {
  const speed = speedLevels[speedIndex];
  speedDisplay.textContent = speed < 1 ? `${speed}x` : `${speed}x`;
  config.timeScale = speed;
  timeSlider.value = String(Math.min(5, speed));
  updateSliderDisplays();
}

// ============================================================
// UI
// ============================================================

const fpsDisplay = document.getElementById('fps-display')!;
const bodyCount = document.getElementById('body-count')!;
const hint = document.getElementById('hint')!;
const sidePanel = document.getElementById('side-panel')!;
const bodyInfo = document.getElementById('body-info')!;
const infoDot = document.getElementById('info-dot')!;
const infoMass = document.getElementById('info-mass')!;
const infoSpeed = document.getElementById('info-speed')!;
const infoPos = document.getElementById('info-pos')!;
const infoRadius = document.getElementById('info-radius')!;

const btnMenu = document.getElementById('btn-menu')!;
const btnPlay = document.getElementById('btn-play')!;
const btnTrails = document.getElementById('btn-trails')!;
const btnCenter = document.getElementById('btn-center')!;
const btnFollow = document.getElementById('btn-follow')!;
const btnSlow = document.getElementById('btn-slow')!;
const btnFast = document.getElementById('btn-fast')!;
const speedDisplay = document.getElementById('speed-display')!;

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
  // Sync speed index to match config.timeScale
  const closest = speedLevels.reduce((prev, curr, idx) =>
    Math.abs(curr - config.timeScale) < Math.abs(speedLevels[prev] - config.timeScale) ? idx : prev, 0);
  speedIndex = closest;
  speedDisplay.textContent = `${speedLevels[speedIndex]}x`;
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

btnTrails.addEventListener('click', () => {
  config.showTrails = !config.showTrails;
  btnTrails.classList.toggle('active', config.showTrails);
});
btnTrails.classList.add('active');

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

btnSlow.addEventListener('click', () => {
  if (speedIndex > 0) speedIndex--;
  updateSpeedDisplay();
});

btnFast.addEventListener('click', () => {
  if (speedIndex < speedLevels.length - 1) speedIndex++;
  updateSpeedDisplay();
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
// Interaction — pan, select, zoom only (no body creation)
// ============================================================

interface DragState {
  type: 'none' | 'pan';
  startX: number;
  startY: number;
  startWorldX: number;
  startWorldY: number;
  movedDistance: number;
}

const drag: DragState = {
  type: 'none', startX: 0, startY: 0,
  startWorldX: 0, startWorldY: 0, movedDistance: 0,
};

function screenToWorld(sx: number, sy: number): { x: number; y: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    x: (sx * dpr - canvas.width / 2) / camera.zoom + camera.x,
    y: -(sy * dpr - canvas.height / 2) / camera.zoom + camera.y,
  };
}

function findBodyAt(wx: number, wy: number): Body | null {
  let closest: Body | null = null;
  let closestDist = Infinity;
  const hitRadius = 15 / camera.zoom;
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
  drag.type = 'pan';
  drag.startX = e.clientX;
  drag.startY = e.clientY;
  drag.startWorldX = camera.targetX;
  drag.startWorldY = camera.targetY;
  drag.movedDistance = 0;
});

canvas.addEventListener('mousemove', (e) => {
  if (drag.type === 'pan') {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dx = (e.clientX - drag.startX) * dpr / camera.zoom;
    const dy = (e.clientY - drag.startY) * dpr / camera.zoom;
    drag.movedDistance = Math.sqrt((e.clientX - drag.startX) ** 2 + (e.clientY - drag.startY) ** 2);
    camera.targetX = drag.startWorldX - dx;
    camera.targetY = drag.startWorldY + dy;
    if (drag.movedDistance > 5) {
      config.followHeaviest = false;
      btnFollow.classList.remove('active');
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (drag.type === 'pan' && drag.movedDistance < 5) {
    // Short click — select body
    const world = screenToWorld(e.clientX, e.clientY);
    selectedBody = findBodyAt(world.x, world.y);
  }
  drag.type = 'none';
});

// Zoom — more responsive, deeper range
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.85 : 1.18;
  camera.targetZoom = Math.max(0.005, Math.min(200, camera.targetZoom * factor));
}, { passive: false });

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch — single finger = pan/select, two fingers = pinch zoom + pan
let touchStartDist = 0;
let touchStartZoom = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    drag.type = 'pan';
    drag.startX = e.touches[0].clientX;
    drag.startY = e.touches[0].clientY;
    drag.startWorldX = camera.targetX;
    drag.startWorldY = camera.targetY;
    drag.movedDistance = 0;
  } else if (e.touches.length === 2) {
    drag.type = 'pan';
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    touchStartDist = Math.sqrt(dx * dx + dy * dy);
    touchStartZoom = camera.targetZoom;
    drag.startX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    drag.startY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    drag.startWorldX = camera.targetX;
    drag.startWorldY = camera.targetY;
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && drag.type === 'pan') {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dx = (e.touches[0].clientX - drag.startX) * dpr / camera.zoom;
    const dy = (e.touches[0].clientY - drag.startY) * dpr / camera.zoom;
    drag.movedDistance = Math.sqrt((e.touches[0].clientX - drag.startX) ** 2 + (e.touches[0].clientY - drag.startY) ** 2);
    camera.targetX = drag.startWorldX - dx;
    camera.targetY = drag.startWorldY + dy;
    if (drag.movedDistance > 10) {
      config.followHeaviest = false;
      btnFollow.classList.remove('active');
    }
  } else if (e.touches.length === 2) {
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    camera.targetZoom = Math.max(0.005, Math.min(200, touchStartZoom * (dist / touchStartDist)));
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    camera.targetX = drag.startWorldX - (midX - drag.startX) * dpr / camera.zoom;
    camera.targetY = drag.startWorldY + (midY - drag.startY) * dpr / camera.zoom;
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  if (drag.type === 'pan' && e.touches.length === 0 && drag.movedDistance < 10) {
    // Tap — select body
    const world = screenToWorld(drag.startX, drag.startY);
    selectedBody = findBodyAt(world.x, world.y);
  }
  if (e.touches.length === 0) drag.type = 'none';
});

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
    case 'c': camera.targetX = 0; camera.targetY = 0; break;
    case 'f': config.followHeaviest = !config.followHeaviest; btnFollow.classList.toggle('active', config.followHeaviest); break;
    case 'Escape': selectedBody = null; break;
    case 'ArrowUp': case ']':
      if (speedIndex < speedLevels.length - 1) speedIndex++;
      updateSpeedDisplay();
      break;
    case 'ArrowDown': case '[':
      if (speedIndex > 0) speedIndex--;
      updateSpeedDisplay();
      break;
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

  // Smooth camera — snappy response
  const lerpSpeed = 1 - Math.pow(0.00001, dt);
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
  hint.textContent = 'Pinch to zoom — Drag to pan — Tap a planet to select';
}

const initial = loadPreset('solar-system');
bodies = initial.bodies;
if (initial.config) Object.assign(config, initial.config);
if (initial.camera) Object.assign(camera, { ...initial.camera, shakeX: 0, shakeY: 0, shakeIntensity: 0 });
syncSlidersFromConfig();
requestAnimationFrame(loop);

setTimeout(() => { if (hint.style.opacity !== '0') hint.style.opacity = '0'; }, 6000);
