import { Body, SimConfig } from './types';

// Barnes-Hut quadtree node
interface QuadNode {
  cx: number;
  cy: number;
  totalMass: number;
  comX: number;
  comY: number;
  size: number;
  body: Body | null;
  nw: QuadNode | null;
  ne: QuadNode | null;
  sw: QuadNode | null;
  se: QuadNode | null;
  isLeaf: boolean;
}

const THETA = 0.7; // Barnes-Hut opening angle

function createNode(cx: number, cy: number, size: number): QuadNode {
  return {
    cx, cy, size,
    totalMass: 0,
    comX: 0, comY: 0,
    body: null,
    nw: null, ne: null, sw: null, se: null,
    isLeaf: true,
  };
}

function insertBody(node: QuadNode, body: Body): void {
  if (node.totalMass === 0 && node.body === null) {
    node.body = body;
    node.totalMass = body.mass;
    node.comX = body.x;
    node.comY = body.y;
    return;
  }

  if (node.size < 0.5) {
    // Too small, just merge
    const totalMass = node.totalMass + body.mass;
    node.comX = (node.comX * node.totalMass + body.x * body.mass) / totalMass;
    node.comY = (node.comY * node.totalMass + body.y * body.mass) / totalMass;
    node.totalMass = totalMass;
    return;
  }

  if (node.isLeaf && node.body !== null) {
    // Subdivide
    const existing = node.body;
    node.body = null;
    node.isLeaf = false;
    const hs = node.size / 2;
    node.nw = createNode(node.cx - hs / 2, node.cy - hs / 2, hs);
    node.ne = createNode(node.cx + hs / 2, node.cy - hs / 2, hs);
    node.sw = createNode(node.cx - hs / 2, node.cy + hs / 2, hs);
    node.se = createNode(node.cx + hs / 2, node.cy + hs / 2, hs);
    insertIntoChild(node, existing);
  }

  // Update center of mass
  const totalMass = node.totalMass + body.mass;
  node.comX = (node.comX * node.totalMass + body.x * body.mass) / totalMass;
  node.comY = (node.comY * node.totalMass + body.y * body.mass) / totalMass;
  node.totalMass = totalMass;

  insertIntoChild(node, body);
}

function insertIntoChild(node: QuadNode, body: Body): void {
  const west = body.x < node.cx;
  const north = body.y < node.cy;
  const child = north
    ? (west ? node.nw! : node.ne!)
    : (west ? node.sw! : node.se!);
  insertBody(child, body);
}

function computeForce(
  node: QuadNode,
  body: Body,
  softening2: number,
  G: number,
  ax: { v: number },
  ay: { v: number },
): void {
  if (node.totalMass === 0) return;

  const dx = node.comX - body.x;
  const dy = node.comY - body.y;
  const dist2 = dx * dx + dy * dy + softening2;

  if (node.isLeaf || (node.size * node.size / dist2 < THETA * THETA)) {
    if (node.body === body) return;
    const dist = Math.sqrt(dist2);
    const force = G * node.totalMass / dist2;
    ax.v += force * dx / dist;
    ay.v += force * dy / dist;
    return;
  }

  if (node.nw) computeForce(node.nw, body, softening2, G, ax, ay);
  if (node.ne) computeForce(node.ne, body, softening2, G, ax, ay);
  if (node.sw) computeForce(node.sw, body, softening2, G, ax, ay);
  if (node.se) computeForce(node.se, body, softening2, G, ax, ay);
}

export function buildTree(bodies: Body[]): QuadNode {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of bodies) {
    if (!b.alive) continue;
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x > maxX) maxX = b.x;
    if (b.y > maxY) maxY = b.y;
  }

  const size = Math.max(maxX - minX, maxY - minY, 100) * 1.1;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const root = createNode(cx, cy, size);

  for (const b of bodies) {
    if (!b.alive) continue;
    insertBody(root, b);
  }

  return root;
}

export function stepSimulation(bodies: Body[], config: SimConfig, dt: number): void {
  const liveBodies = bodies.filter(b => b.alive);
  if (liveBodies.length === 0) return;

  const actualDt = dt * config.timeScale;
  if (actualDt === 0) return;

  const G = config.gravity * 500;
  const softening2 = config.softening * config.softening;

  // Build Barnes-Hut tree
  const tree = buildTree(liveBodies);

  // Compute accelerations and integrate (Velocity Verlet)
  for (const body of liveBodies) {
    const ax = { v: 0 };
    const ay = { v: 0 };
    computeForce(tree, body, softening2, G, ax, ay);

    body.vx += ax.v * actualDt;
    body.vy += ay.v * actualDt;

    // Apply damping
    body.vx *= config.damping;
    body.vy *= config.damping;

    body.x += body.vx * actualDt;
    body.y += body.vy * actualDt;
  }

  // Handle collisions (merge bodies)
  if (config.mergeOnCollision) {
    for (let i = 0; i < liveBodies.length; i++) {
      const a = liveBodies[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < liveBodies.length; j++) {
        const b = liveBodies[j];
        if (!b.alive) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        const minDist = a.radius + b.radius;

        if (dist2 < minDist * minDist) {
          // Merge into the heavier body
          const [heavy, light] = a.mass >= b.mass ? [a, b] : [b, a];
          const totalMass = heavy.mass + light.mass;

          // Conservation of momentum
          heavy.vx = (heavy.vx * heavy.mass + light.vx * light.mass) / totalMass;
          heavy.vy = (heavy.vy * heavy.mass + light.vy * light.mass) / totalMass;

          // Weighted position
          heavy.x = (heavy.x * heavy.mass + light.x * light.mass) / totalMass;
          heavy.y = (heavy.y * heavy.mass + light.y * light.mass) / totalMass;

          heavy.mass = totalMass;
          heavy.radius = massToRadius(totalMass);

          // Blend colors
          const ratio = light.mass / totalMass;
          heavy.color = [
            heavy.color[0] * (1 - ratio) + light.color[0] * ratio,
            heavy.color[1] * (1 - ratio) + light.color[1] * ratio,
            heavy.color[2] * (1 - ratio) + light.color[2] * ratio,
          ];

          light.alive = false;
        }
      }
    }
  }

  // Record trails
  for (const body of liveBodies) {
    if (!body.alive) continue;
    const idx = body.trailIndex * 2;
    body.trail[idx] = body.x;
    body.trail[idx + 1] = body.y;
    body.trailIndex = (body.trailIndex + 1) % body.trailLength;
  }
}

export function massToRadius(mass: number): number {
  return Math.max(1.5, Math.pow(mass, 0.35) * 2);
}

let nextId = 0;

export function createBody(
  x: number, y: number,
  vx: number, vy: number,
  mass: number,
  color?: [number, number, number],
  trailCapacity = 200,
): Body {
  const c = color ?? massToColor(mass);
  return {
    x, y, vx, vy,
    mass,
    radius: massToRadius(mass),
    color: c,
    trail: new Float32Array(trailCapacity * 2),
    trailIndex: 0,
    trailLength: trailCapacity,
    id: nextId++,
    alive: true,
  };
}

export function massToColor(mass: number): [number, number, number] {
  // Star color temperature mapping
  const t = Math.min(1, Math.log10(mass + 1) / 4);
  if (t < 0.2) return [0.6, 0.7, 1.0];       // Blue-white (small)
  if (t < 0.4) return [0.9, 0.9, 1.0];        // White
  if (t < 0.6) return [1.0, 0.95, 0.7];       // Yellow-white
  if (t < 0.8) return [1.0, 0.7, 0.3];        // Orange
  return [1.0, 0.4, 0.2];                      // Red (massive)
}

export function computeOrbitalVelocity(
  x: number, y: number,
  centerX: number, centerY: number,
  centerMass: number,
  G: number,
): { vx: number; vy: number } {
  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return { vx: 0, vy: 0 };

  const speed = Math.sqrt(G * centerMass / dist);
  // Perpendicular velocity (counter-clockwise)
  const nx = -dy / dist;
  const ny = dx / dist;
  return { vx: nx * speed, vy: ny * speed };
}
