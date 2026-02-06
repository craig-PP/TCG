export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: [number, number, number];
  trail: Float32Array;
  trailIndex: number;
  trailLength: number;
  id: number;
  alive: boolean;
  age: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: [number, number, number];
  size: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  shakeX: number;
  shakeY: number;
  shakeIntensity: number;
}

export interface SimConfig {
  gravity: number;
  timeScale: number;
  softening: number;
  damping: number;
  trailLength: number;
  bloomIntensity: number;
  showTrails: boolean;
  showVectors: boolean;
  paused: boolean;
  followHeaviest: boolean;
  collisions: boolean;
  mergeOnCollision: boolean;
}

export interface MergeEvent {
  x: number;
  y: number;
  mass: number;
  color: [number, number, number];
}
