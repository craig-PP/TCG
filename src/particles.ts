import { Particle, MergeEvent } from './types';

const MAX_PARTICLES = 2000;

export class ParticleSystem {
  particles: Particle[] = [];

  spawnMergeExplosion(event: MergeEvent): void {
    const count = Math.min(60, Math.floor(10 + Math.sqrt(event.mass) * 3));
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        // Recycle oldest
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 8) * Math.pow(event.mass, 0.15);
      const life = 0.4 + Math.random() * 0.8;
      // Vary colors: mix of the body color with hot white/yellow
      const t = Math.random();
      const color: [number, number, number] = [
        event.color[0] * (1 - t) + 1.0 * t,
        event.color[1] * (1 - t) + 0.9 * t,
        event.color[2] * (1 - t) + 0.4 * t,
      ];
      this.particles.push({
        x: event.x + (Math.random() - 0.5) * 4,
        y: event.y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color,
        size: 0.5 + Math.random() * 2,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Decelerate
      p.vx *= 0.97;
      p.vy *= 0.97;
    }
  }
}
