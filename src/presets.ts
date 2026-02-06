import { Body, SimConfig, Camera } from './types';
import { createBody, computeOrbitalVelocity } from './physics';

const G = 500; // Must match physics.ts

export interface PresetResult {
  bodies: Body[];
  config?: Partial<SimConfig>;
  camera?: Partial<Camera>;
}

export function loadPreset(name: string): PresetResult {
  switch (name) {
    case 'solar-system': return solarSystem();
    case 'binary-stars': return binaryStars();
    case 'galaxy': return galaxy();
    case 'collision': return galaxyCollision();
    case 'asteroid-belt': return asteroidBelt();
    case 'figure-eight': return figureEight();
    case 'random': return randomSystem();
    case 'lagrange': return lagrangePoints();
    default: return solarSystem();
  }
}

function solarSystem(): PresetResult {
  const bodies: Body[] = [];
  const sunMass = 5000;

  // Sun
  bodies.push(createBody(0, 0, 0, 0, sunMass, [1.0, 0.82, 0.3]));

  // Planets with accurate distance ratios (1 AU = 150 world units)
  // Masses exaggerated for visibility but preserve ordering
  const AU = 150;
  const planets: Array<{ au: number; mass: number; color: [number, number, number] }> = [
    { au: 0.387, mass: 0.8,  color: [0.6, 0.6, 0.6] },   // Mercury — gray
    { au: 0.723, mass: 3,    color: [0.9, 0.8, 0.55] },   // Venus — pale yellow
    { au: 1.0,   mass: 3,    color: [0.2, 0.5, 1.0] },    // Earth — blue
    { au: 1.524, mass: 1.5,  color: [0.85, 0.35, 0.15] }, // Mars — red-orange
    { au: 5.203, mass: 120,  color: [0.85, 0.7, 0.45] },  // Jupiter — tan
    { au: 9.537, mass: 70,   color: [0.85, 0.75, 0.5] },  // Saturn — golden
    { au: 19.19, mass: 20,   color: [0.5, 0.8, 0.9] },    // Uranus — ice blue
    { au: 30.07, mass: 22,   color: [0.25, 0.35, 0.85] }, // Neptune — deep blue
  ];

  // Spread planets at different starting angles for visual interest
  const startAngles = [0, 0.8, 2.1, 3.5, 1.2, 4.1, 5.5, 0.5];

  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const dist = p.au * AU;
    const angle = startAngles[i];
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const { vx, vy } = computeOrbitalVelocity(x, y, 0, 0, sunMass, G);
    bodies.push(createBody(x, y, vx, vy, p.mass, p.color));
  }

  // Earth's moon
  const earthIdx = 3; // Earth is index 3 (0=sun, 1=merc, 2=venus, 3=earth)
  const earth = bodies[earthIdx];
  const moonDist = 8;
  const moonAngle = startAngles[2] + 0.1; // Slightly offset from Earth
  const moonX = earth.x + Math.cos(moonAngle) * moonDist;
  const moonY = earth.y + Math.sin(moonAngle) * moonDist;
  const moonOrbVel = computeOrbitalVelocity(moonX, moonY, earth.x, earth.y, 3, G);
  bodies.push(createBody(
    moonX, moonY,
    earth.vx + moonOrbVel.vx,
    earth.vy + moonOrbVel.vy,
    0.15, [0.75, 0.75, 0.75],
  ));

  return {
    bodies,
    config: { gravity: 1, timeScale: 1, softening: 3, trailLength: 150, mergeOnCollision: false },
    camera: { x: 0, y: 0, zoom: 0.4, targetZoom: 0.4, targetX: 0, targetY: 0 },
  };
}

function binaryStars(): PresetResult {
  const bodies: Body[] = [];
  const sep = 100;
  const mass = 2000;
  const speed = Math.sqrt(G * mass / (4 * sep));

  bodies.push(createBody(-sep, 0, 0, speed, mass, [0.5, 0.7, 1.0]));
  bodies.push(createBody(sep, 0, 0, -speed, mass, [1.0, 0.6, 0.3]));

  // Planets orbiting the binary center
  for (let i = 0; i < 5; i++) {
    const dist = 300 + i * 80;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const { vx, vy } = computeOrbitalVelocity(x, y, 0, 0, mass * 2, G);
    const t = Math.random();
    const color: [number, number, number] = [0.5 + t * 0.5, 0.6, 1.0 - t * 0.5];
    bodies.push(createBody(x, y, vx, vy, 3 + Math.random() * 10, color));
  }

  return {
    bodies,
    config: { gravity: 1, timeScale: 1 },
    camera: { x: 0, y: 0, zoom: 0.6, targetZoom: 0.6, targetX: 0, targetY: 0 },
  };
}

function galaxy(): PresetResult {
  const bodies: Body[] = [];
  const centerMass = 20000;

  // Supermassive center
  bodies.push(createBody(0, 0, 0, 0, centerMass, [1.0, 0.95, 0.8]));

  // Spiral arms
  const numStars = 600;
  for (let i = 0; i < numStars; i++) {
    const arm = i % 2;
    const t = (i / numStars) * 4 * Math.PI;
    const baseAngle = t + arm * Math.PI;
    const dist = 40 + (i / numStars) * 600;
    const spread = dist * 0.15;

    const angle = baseAngle + (Math.random() - 0.5) * 0.5;
    const x = Math.cos(angle) * dist + (Math.random() - 0.5) * spread;
    const y = Math.sin(angle) * dist + (Math.random() - 0.5) * spread;

    const { vx, vy } = computeOrbitalVelocity(x, y, 0, 0, centerMass, G);
    const mass = 0.5 + Math.random() * 3;

    // Color variation: blue young stars in arms, red old stars scattered
    const temp = Math.random();
    let color: [number, number, number];
    if (temp < 0.3) color = [0.6, 0.7, 1.0];
    else if (temp < 0.6) color = [1.0, 0.95, 0.85];
    else if (temp < 0.85) color = [1.0, 0.8, 0.5];
    else color = [1.0, 0.5, 0.3];

    bodies.push(createBody(x, y, vx, vy, mass, color));
  }

  return {
    bodies,
    config: { gravity: 1, timeScale: 1.5, softening: 15 },
    camera: { x: 0, y: 0, zoom: 0.4, targetZoom: 0.4, targetX: 0, targetY: 0 },
  };
}

function galaxyCollision(): PresetResult {
  const bodies: Body[] = [];
  const centerMass = 10000;

  // Galaxy 1
  bodies.push(createBody(-300, -100, 8, 3, centerMass, [0.5, 0.7, 1.0]));
  for (let i = 0; i < 250; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 250;
    const x = -300 + Math.cos(angle) * dist;
    const y = -100 + Math.sin(angle) * dist;
    const { vx, vy } = computeOrbitalVelocity(x, y, -300, -100, centerMass, G);
    const color: [number, number, number] = [0.4 + Math.random() * 0.3, 0.6 + Math.random() * 0.2, 1.0];
    bodies.push(createBody(x, y, vx + 8, vy + 3, 0.5 + Math.random() * 2, color));
  }

  // Galaxy 2
  bodies.push(createBody(300, 100, -8, -3, centerMass, [1.0, 0.6, 0.3]));
  for (let i = 0; i < 250; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 250;
    const x = 300 + Math.cos(angle) * dist;
    const y = 100 + Math.sin(angle) * dist;
    const { vx, vy } = computeOrbitalVelocity(x, y, 300, 100, centerMass, G);
    const color: [number, number, number] = [1.0, 0.5 + Math.random() * 0.3, 0.2 + Math.random() * 0.3];
    bodies.push(createBody(x, y, vx - 8, vy - 3, 0.5 + Math.random() * 2, color));
  }

  return {
    bodies,
    config: { gravity: 1, timeScale: 1, softening: 20 },
    camera: { x: 0, y: 0, zoom: 0.35, targetZoom: 0.35, targetX: 0, targetY: 0 },
  };
}

function asteroidBelt(): PresetResult {
  const bodies: Body[] = [];
  const sunMass = 8000;

  bodies.push(createBody(0, 0, 0, 0, sunMass, [1.0, 0.9, 0.5]));

  // Inner planets
  for (let i = 0; i < 3; i++) {
    const dist = 80 + i * 60;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const { vx, vy } = computeOrbitalVelocity(x, y, 0, 0, sunMass, G);
    const colors: [number, number, number][] = [
      [0.7, 0.7, 0.7],
      [0.3, 0.5, 1.0],
      [1.0, 0.4, 0.2],
    ];
    bodies.push(createBody(x, y, vx, vy, 10 + Math.random() * 20, colors[i]));
  }

  // Asteroid belt
  for (let i = 0; i < 300; i++) {
    const dist = 280 + Math.random() * 60;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const { vx, vy } = computeOrbitalVelocity(x, y, 0, 0, sunMass, G);

    // Add slight randomness to velocity
    const jitter = 1 + (Math.random() - 0.5) * 0.03;
    const gray = 0.4 + Math.random() * 0.3;
    const color: [number, number, number] = [gray, gray * 0.9, gray * 0.8];
    bodies.push(createBody(x, y, vx * jitter, vy * jitter, 0.1 + Math.random() * 0.5, color));
  }

  // Outer gas giant
  const giantDist = 500;
  const { vx: gvx, vy: gvy } = computeOrbitalVelocity(giantDist, 0, 0, 0, sunMass, G);
  bodies.push(createBody(giantDist, 0, gvx, gvy, 150, [0.9, 0.75, 0.4]));

  return {
    bodies,
    config: { gravity: 1, timeScale: 1, softening: 8 },
    camera: { x: 0, y: 0, zoom: 0.5, targetZoom: 0.5, targetX: 0, targetY: 0 },
  };
}

function figureEight(): PresetResult {
  // The famous figure-eight three-body solution (Chenciner & Montgomery, 2000)
  const bodies: Body[] = [];
  const mass = 500;
  const scale = 150;
  const vScale = 40;

  // Initial conditions for the figure-eight solution
  bodies.push(createBody(
    -0.97000436 * scale, 0.24308753 * scale,
    0.4662036850 * vScale, 0.4323657300 * vScale,
    mass, [1.0, 0.4, 0.4],
  ));

  bodies.push(createBody(
    0.97000436 * scale, -0.24308753 * scale,
    0.4662036850 * vScale, 0.4323657300 * vScale,
    mass, [0.4, 1.0, 0.4],
  ));

  bodies.push(createBody(
    0, 0,
    -0.933240737 * vScale, -0.864731460 * vScale,
    mass, [0.4, 0.4, 1.0],
  ));

  return {
    bodies,
    config: { gravity: 1, timeScale: 0.5, softening: 5, mergeOnCollision: false },
    camera: { x: 0, y: 0, zoom: 1.0, targetZoom: 1.0, targetX: 0, targetY: 0 },
  };
}

function randomSystem(): PresetResult {
  const bodies: Body[] = [];
  const numBodies = 50 + Math.floor(Math.random() * 100);

  for (let i = 0; i < numBodies; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 400;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;

    const speed = Math.random() * 15;
    const vAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const vx = Math.cos(vAngle) * speed;
    const vy = Math.sin(vAngle) * speed;

    const mass = 1 + Math.random() * Math.random() * 500;

    bodies.push(createBody(x, y, vx, vy, mass));
  }

  return {
    bodies,
    config: { gravity: 1, timeScale: 1 },
    camera: { x: 0, y: 0, zoom: 0.5, targetZoom: 0.5, targetX: 0, targetY: 0 },
  };
}

function lagrangePoints(): PresetResult {
  const bodies: Body[] = [];
  const sunMass = 5000;
  const planetMass = 50;
  const dist = 200;

  // Sun
  bodies.push(createBody(0, 0, 0, 0, sunMass, [1.0, 0.95, 0.6]));

  // Planet
  const { vx, vy } = computeOrbitalVelocity(dist, 0, 0, 0, sunMass, G);
  bodies.push(createBody(dist, 0, vx, vy, planetMass, [0.3, 0.6, 1.0]));

  // L4 (leading Trojan) - 60 degrees ahead of planet
  const l4Angle = Math.PI / 3;
  const l4x = Math.cos(-l4Angle) * dist;
  const l4y = Math.sin(-l4Angle) * dist;
  const l4v = computeOrbitalVelocity(l4x, l4y, 0, 0, sunMass, G);

  // Cluster of asteroids at L4
  for (let i = 0; i < 15; i++) {
    const jx = l4x + (Math.random() - 0.5) * 30;
    const jy = l4y + (Math.random() - 0.5) * 30;
    const jv = computeOrbitalVelocity(jx, jy, 0, 0, sunMass, G);
    bodies.push(createBody(jx, jy, jv.vx, jv.vy, 0.5, [0.5, 1.0, 0.5]));
  }

  // L5 (trailing Trojan) - 60 degrees behind planet
  const l5Angle = -Math.PI / 3;
  const l5x = Math.cos(-l5Angle) * dist;
  const l5y = Math.sin(-l5Angle) * dist;

  // Cluster of asteroids at L5
  for (let i = 0; i < 15; i++) {
    const jx = l5x + (Math.random() - 0.5) * 30;
    const jy = l5y + (Math.random() - 0.5) * 30;
    const jv = computeOrbitalVelocity(jx, jy, 0, 0, sunMass, G);
    bodies.push(createBody(jx, jy, jv.vx, jv.vy, 0.5, [1.0, 0.5, 0.5]));
  }

  return {
    bodies,
    config: { gravity: 1, timeScale: 1, softening: 5 },
    camera: { x: 0, y: 0, zoom: 0.8, targetZoom: 0.8, targetX: 0, targetY: 0 },
  };
}
