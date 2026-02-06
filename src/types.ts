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
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
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

export interface Preset {
  name: string;
  bodies: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    color?: [number, number, number];
  }>;
  config?: Partial<SimConfig>;
  camera?: Partial<Camera>;
}
