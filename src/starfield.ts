// Pre-generated background starfield with multiple depth layers for parallax
export interface Star {
  x: number;
  y: number;
  brightness: number;
  size: number;
  layer: number; // 0=far, 1=mid, 2=near
  twinklePhase: number;
  twinkleSpeed: number;
  color: [number, number, number];
}

const STAR_COLORS: [number, number, number][] = [
  [0.8, 0.85, 1.0],   // Blue-white
  [1.0, 1.0, 1.0],    // White
  [1.0, 0.95, 0.85],  // Warm white
  [1.0, 0.85, 0.7],   // Yellow
  [1.0, 0.7, 0.6],    // Orange
];

export function generateStarfield(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const layer = i < count * 0.6 ? 0 : i < count * 0.85 ? 1 : 2;
    const colorIdx = Math.floor(Math.random() * STAR_COLORS.length);
    stars.push({
      x: (Math.random() - 0.5) * 20000,
      y: (Math.random() - 0.5) * 20000,
      brightness: 0.2 + Math.random() * 0.8,
      size: layer === 0 ? 0.5 + Math.random() * 0.5 : layer === 1 ? 0.8 + Math.random() * 0.7 : 1.0 + Math.random() * 1.0,
      layer,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 2,
      color: STAR_COLORS[colorIdx],
    });
  }
  return stars;
}
