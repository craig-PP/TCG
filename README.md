# Cosmos — Interactive N-Body Gravitational Simulator

A real-time gravitational N-body simulator rendered with WebGL2, featuring bloom post-processing, interactive body creation, and preset celestial scenarios.

## Features

- **Barnes-Hut Algorithm** — O(n log n) gravity calculations enabling thousands of bodies at 60fps
- **WebGL2 Rendering** — Instanced drawing, HDR framebuffers, and multi-pass bloom/glow effects
- **Interactive Creation** — Click and drag to spawn bodies with custom mass and velocity
- **8 Preset Scenarios** — Solar system, binary stars, spiral galaxy, galaxy collision, asteroid belt, figure-eight three-body, Lagrange points, and random chaos
- **Real-time Controls** — Adjust gravity, time scale, softening, damping, trails, and bloom
- **Camera** — Scroll to zoom, right-drag to pan, auto-follow heaviest body
- **Touch Support** — Full pinch-to-zoom and drag interaction on mobile
- **Keyboard Shortcuts** — Space (pause), T (trails), V (vectors), C (center), F (follow), Tab (panel)

## Tech Stack

- TypeScript + Vite
- WebGL2 with GLSL 300 ES shaders
- Barnes-Hut quadtree for N-body gravity
- Multi-pass bloom post-processing pipeline (extract, blur, composite)
- Instanced rendering for bodies, line rendering for trails

## Getting Started

```bash
npm install
npm run dev
```

## Architecture

```
src/
  main.ts       — App entry, UI bindings, input handling, main loop
  physics.ts    — Barnes-Hut tree, N-body simulation, collision merging
  renderer.ts   — WebGL2 renderer, shaders, bloom pipeline
  presets.ts    — Preset scenario configurations
  types.ts      — TypeScript interfaces
```
