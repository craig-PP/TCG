import { Body, Camera, SimConfig } from './types';

const VERT_BODY = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_center;
layout(location = 2) in float a_radius;
layout(location = 3) in vec3 a_color;
layout(location = 4) in float a_mass;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

out vec2 v_uv;
out vec3 v_color;
out float v_mass;

void main() {
  vec2 worldPos = a_center + a_position * a_radius * 3.0;
  vec2 screenPos = (worldPos - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_uv = a_position;
  v_color = a_color;
  v_mass = a_mass;
}`;

const FRAG_BODY = `#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_color;
in float v_mass;

out vec4 fragColor;

void main() {
  float dist = length(v_uv);

  // Core (solid)
  float core = 1.0 - smoothstep(0.0, 0.33, dist);

  // Inner glow
  float glow1 = exp(-dist * 3.0) * 0.7;

  // Outer glow (atmosphere)
  float glow2 = exp(-dist * 1.5) * 0.3;

  // Corona for massive bodies
  float massScale = clamp(log(v_mass + 1.0) / 6.0, 0.0, 1.0);
  float corona = exp(-dist * 0.8) * massScale * 0.15;

  float alpha = core + glow1 + glow2 + corona;
  vec3 color = v_color * (core + glow1) + v_color * 1.3 * glow2 + vec3(1.0, 0.8, 0.5) * corona;

  fragColor = vec4(color, alpha);
}`;

const VERT_TRAIL = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in float a_alpha;
layout(location = 2) in vec3 a_color;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

out float v_alpha;
out vec3 v_color;

void main() {
  vec2 screenPos = (a_position - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_alpha = a_alpha;
  v_color = a_color;
}`;

const FRAG_TRAIL = `#version 300 es
precision highp float;

in float v_alpha;
in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color * 0.6, v_alpha * 0.4);
}`;

const VERT_SCREEN = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG_BLOOM_EXTRACT = `#version 300 es
precision highp float;

uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, v_uv);
  float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  if (brightness > 0.3) {
    fragColor = color;
  } else {
    fragColor = vec4(0.0);
  }
}`;

const FRAG_BLUR = `#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_direction;
uniform vec2 u_resolution;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texelSize = u_direction / u_resolution;
  vec4 result = vec4(0.0);

  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

  result += texture(u_texture, v_uv) * weights[0];
  for (int i = 1; i < 5; i++) {
    vec2 offset = texelSize * float(i) * 2.0;
    result += texture(u_texture, v_uv + offset) * weights[i];
    result += texture(u_texture, v_uv - offset) * weights[i];
  }

  fragColor = result;
}`;

const FRAG_COMPOSITE = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_bloomIntensity;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 scene = texture(u_scene, v_uv);
  vec4 bloom = texture(u_bloom, v_uv);
  vec3 color = scene.rgb + bloom.rgb * u_bloomIntensity;

  // Subtle tone mapping
  color = color / (color + 0.5);

  // Very subtle vignette
  vec2 vigUv = v_uv * 2.0 - 1.0;
  float vig = 1.0 - dot(vigUv, vigUv) * 0.15;
  color *= vig;

  fragColor = vec4(color, 1.0);
}`;

const VERT_VECTOR = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec3 a_color;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

out vec3 v_color;

void main() {
  vec2 screenPos = (a_position - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_color = a_color;
}`;

const FRAG_VECTOR = `#version 300 es
precision highp float;

in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 0.6);
}`;

const VERT_GRID = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

void main() {
  vec2 screenPos = (a_position - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}`;

const FRAG_GRID = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 0.03);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    console.error('Source:', source);
    gl.deleteShader(shader);
    throw new Error('Shader compilation failed');
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    throw new Error('Program linking failed');
  }
  return program;
}

interface Framebuffer {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

function createFramebuffer(gl: WebGL2RenderingContext, width: number, height: number): Framebuffer {
  const fbo = gl.createFramebuffer()!;
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, texture, width, height };
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private width = 0;
  private height = 0;

  // Programs
  private bodyProgram: WebGLProgram;
  private trailProgram: WebGLProgram;
  private bloomExtractProgram: WebGLProgram;
  private blurProgram: WebGLProgram;
  private compositeProgram: WebGLProgram;
  private vectorProgram: WebGLProgram;
  private gridProgram: WebGLProgram;

  // Buffers
  private quadVBO: WebGLBuffer;
  private bodyInstanceVBO: WebGLBuffer;
  private bodyVAO: WebGLVertexArrayObject;
  private trailVBO: WebGLBuffer;
  private trailVAO: WebGLVertexArrayObject;
  private screenVBO: WebGLBuffer;
  private screenVAO: WebGLVertexArrayObject;
  private vectorVBO: WebGLBuffer;
  private vectorVAO: WebGLVertexArrayObject;
  private gridVBO: WebGLBuffer;
  private gridVAO: WebGLVertexArrayObject;

  // Framebuffers
  private sceneFB!: Framebuffer;
  private bloomFB1!: Framebuffer;
  private bloomFB2!: Framebuffer;

  // Pre-allocated typed arrays
  private instanceData: Float32Array;
  private trailData: Float32Array;
  private vectorData: Float32Array;
  private gridData: Float32Array;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    })!;

    if (!gl) throw new Error('WebGL2 not supported');

    // Enable float textures
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) console.warn('EXT_color_buffer_float not available, bloom may not work');

    this.gl = gl;

    // Compile all shader programs
    this.bodyProgram = createProgram(gl, VERT_BODY, FRAG_BODY);
    this.trailProgram = createProgram(gl, VERT_TRAIL, FRAG_TRAIL);
    this.bloomExtractProgram = createProgram(gl, VERT_SCREEN, FRAG_BLOOM_EXTRACT);
    this.blurProgram = createProgram(gl, VERT_SCREEN, FRAG_BLUR);
    this.compositeProgram = createProgram(gl, VERT_SCREEN, FRAG_COMPOSITE);
    this.vectorProgram = createProgram(gl, VERT_VECTOR, FRAG_VECTOR);
    this.gridProgram = createProgram(gl, VERT_GRID, FRAG_GRID);

    // Create quad geometry for instanced body rendering
    const quadVerts = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);
    this.quadVBO = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // Instance data buffer
    this.bodyInstanceVBO = gl.createBuffer()!;
    this.instanceData = new Float32Array(10000 * 7); // x, y, radius, r, g, b, mass

    // Body VAO
    this.bodyVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.bodyVAO);

    // Quad vertices (position)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Instance data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bodyInstanceVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, gl.DYNAMIC_DRAW);

    // a_center (location 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 0);
    gl.vertexAttribDivisor(1, 1);

    // a_radius (location 2)
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 8);
    gl.vertexAttribDivisor(2, 1);

    // a_color (location 3)
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 28, 12);
    gl.vertexAttribDivisor(3, 1);

    // a_mass (location 4)
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 28, 24);
    gl.vertexAttribDivisor(4, 1);

    gl.bindVertexArray(null);

    // Trail VAO
    this.trailData = new Float32Array(200000 * 6); // x, y, alpha, r, g, b
    this.trailVBO = gl.createBuffer()!;
    this.trailVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.trailVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.trailData, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 12);
    gl.bindVertexArray(null);

    // Screen-space quad for post-processing
    const screenQuad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.screenVBO = gl.createBuffer()!;
    this.screenVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.screenVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenVBO);
    gl.bufferData(gl.ARRAY_BUFFER, screenQuad, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // Vector VAO
    this.vectorData = new Float32Array(10000 * 10); // 2 verts * (x, y, r, g, b)
    this.vectorVBO = gl.createBuffer()!;
    this.vectorVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.vectorVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vectorVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.vectorData, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
    gl.bindVertexArray(null);

    // Grid VAO
    this.gridData = new Float32Array(4000); // up to 1000 lines * 2 verts * 2 coords
    this.gridVBO = gl.createBuffer()!;
    this.gridVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.gridVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.gridData, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // Initial setup
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);

    if (w === this.width && h === this.height) return;

    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;

    const gl = this.gl;
    this.sceneFB = createFramebuffer(gl, w, h);
    this.bloomFB1 = createFramebuffer(gl, Math.floor(w / 2), Math.floor(h / 2));
    this.bloomFB2 = createFramebuffer(gl, Math.floor(w / 2), Math.floor(h / 2));
  }

  render(bodies: Body[], camera: Camera, config: SimConfig): void {
    const gl = this.gl;
    this.resize();

    const w = this.width;
    const h = this.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // -------- PASS 1: Render scene to FBO --------
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFB.fbo);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.0, 0.0, 0.02, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw grid
    this.drawGrid(camera, halfW, halfH);

    // Draw trails
    if (config.showTrails) {
      this.drawTrails(bodies, camera, config, halfW, halfH);
    }

    // Draw velocity vectors
    if (config.showVectors) {
      this.drawVectors(bodies, camera, halfW, halfH);
    }

    // Draw bodies
    this.drawBodies(bodies, camera, halfW, halfH);

    // -------- PASS 2: Bloom extract --------
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFB1.fbo);
    gl.viewport(0, 0, this.bloomFB1.width, this.bloomFB1.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ZERO);

    gl.useProgram(this.bloomExtractProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFB.texture);
    gl.uniform1i(gl.getUniformLocation(this.bloomExtractProgram, 'u_texture'), 0);

    gl.bindVertexArray(this.screenVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // -------- PASS 3 & 4: Two-pass Gaussian blur --------
    // Horizontal blur
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFB2.fbo);
    gl.viewport(0, 0, this.bloomFB2.width, this.bloomFB2.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.blurProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomFB1.texture);
    gl.uniform1i(gl.getUniformLocation(this.blurProgram, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_direction'), 1.0, 0.0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_resolution'),
      this.bloomFB2.width, this.bloomFB2.height);

    gl.bindVertexArray(this.screenVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Vertical blur
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFB1.fbo);
    gl.viewport(0, 0, this.bloomFB1.width, this.bloomFB1.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, this.bloomFB2.texture);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_direction'), 0.0, 1.0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_resolution'),
      this.bloomFB1.width, this.bloomFB1.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // -------- PASS 5: Composite --------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.compositeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFB.texture);
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'u_scene'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomFB1.texture);
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'u_bloom'), 1);

    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'u_bloomIntensity'), config.bloomIntensity);

    gl.bindVertexArray(this.screenVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Reset blend mode
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  }

  private drawGrid(camera: Camera, halfW: number, halfH: number): void {
    const gl = this.gl;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // Determine grid spacing based on zoom
    const viewWidth = this.width / camera.zoom;
    const rawSpacing = viewWidth / 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawSpacing)));
    const normalized = rawSpacing / magnitude;
    let spacing: number;
    if (normalized < 2) spacing = magnitude;
    else if (normalized < 5) spacing = 2 * magnitude;
    else spacing = 5 * magnitude;

    const left = camera.x - halfW / camera.zoom;
    const right = camera.x + halfW / camera.zoom;
    const top = camera.y - halfH / camera.zoom;
    const bottom = camera.y + halfH / camera.zoom;

    let vertCount = 0;
    const maxVerts = this.gridData.length / 2;

    // Vertical lines
    const startX = Math.floor(left / spacing) * spacing;
    for (let x = startX; x <= right && vertCount < maxVerts - 2; x += spacing) {
      this.gridData[vertCount * 2] = x;
      this.gridData[vertCount * 2 + 1] = top;
      vertCount++;
      this.gridData[vertCount * 2] = x;
      this.gridData[vertCount * 2 + 1] = bottom;
      vertCount++;
    }

    // Horizontal lines
    const startY = Math.floor(top / spacing) * spacing;
    for (let y = startY; y <= bottom && vertCount < maxVerts - 2; y += spacing) {
      this.gridData[vertCount * 2] = left;
      this.gridData[vertCount * 2 + 1] = y;
      vertCount++;
      this.gridData[vertCount * 2] = right;
      this.gridData[vertCount * 2 + 1] = y;
      vertCount++;
    }

    if (vertCount === 0) return;

    gl.useProgram(this.gridProgram);
    gl.uniform2f(gl.getUniformLocation(this.gridProgram, 'u_resolution'), halfW, halfH);
    gl.uniform2f(gl.getUniformLocation(this.gridProgram, 'u_camera'), camera.x, camera.y);
    gl.uniform1f(gl.getUniformLocation(this.gridProgram, 'u_zoom'), camera.zoom);

    gl.bindVertexArray(this.gridVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.gridData.subarray(0, vertCount * 2));
    gl.drawArrays(gl.LINES, 0, vertCount);
  }

  private drawBodies(bodies: Body[], camera: Camera, halfW: number, halfH: number): void {
    const gl = this.gl;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    let count = 0;
    for (const body of bodies) {
      if (!body.alive) continue;
      if (count * 7 >= this.instanceData.length) break;

      const i = count * 7;
      this.instanceData[i] = body.x;
      this.instanceData[i + 1] = body.y;
      this.instanceData[i + 2] = body.radius;
      this.instanceData[i + 3] = body.color[0];
      this.instanceData[i + 4] = body.color[1];
      this.instanceData[i + 5] = body.color[2];
      this.instanceData[i + 6] = body.mass;
      count++;
    }

    if (count === 0) return;

    gl.useProgram(this.bodyProgram);
    gl.uniform2f(gl.getUniformLocation(this.bodyProgram, 'u_resolution'), halfW, halfH);
    gl.uniform2f(gl.getUniformLocation(this.bodyProgram, 'u_camera'), camera.x, camera.y);
    gl.uniform1f(gl.getUniformLocation(this.bodyProgram, 'u_zoom'), camera.zoom);

    gl.bindVertexArray(this.bodyVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bodyInstanceVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData.subarray(0, count * 7));

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
  }

  private drawTrails(bodies: Body[], camera: Camera, config: SimConfig, halfW: number, halfH: number): void {
    const gl = this.gl;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    let vertCount = 0;
    const maxVerts = this.trailData.length / 6;
    const trailLen = Math.min(config.trailLength, 200);

    for (const body of bodies) {
      if (!body.alive || trailLen < 2) continue;

      for (let i = 0; i < trailLen - 1 && vertCount < maxVerts - 2; i++) {
        const idx0 = ((body.trailIndex - trailLen + i + body.trailLength) % body.trailLength);
        const idx1 = ((body.trailIndex - trailLen + i + 1 + body.trailLength) % body.trailLength);

        const x0 = body.trail[idx0 * 2];
        const y0 = body.trail[idx0 * 2 + 1];
        const x1 = body.trail[idx1 * 2];
        const y1 = body.trail[idx1 * 2 + 1];

        if (x0 === 0 && y0 === 0) continue;
        if (x1 === 0 && y1 === 0) continue;

        const alpha0 = i / trailLen;
        const alpha1 = (i + 1) / trailLen;

        const j = vertCount * 6;
        this.trailData[j] = x0;
        this.trailData[j + 1] = y0;
        this.trailData[j + 2] = alpha0;
        this.trailData[j + 3] = body.color[0];
        this.trailData[j + 4] = body.color[1];
        this.trailData[j + 5] = body.color[2];
        vertCount++;

        const k = vertCount * 6;
        this.trailData[k] = x1;
        this.trailData[k + 1] = y1;
        this.trailData[k + 2] = alpha1;
        this.trailData[k + 3] = body.color[0];
        this.trailData[k + 4] = body.color[1];
        this.trailData[k + 5] = body.color[2];
        vertCount++;
      }
    }

    if (vertCount === 0) return;

    gl.useProgram(this.trailProgram);
    gl.uniform2f(gl.getUniformLocation(this.trailProgram, 'u_resolution'), halfW, halfH);
    gl.uniform2f(gl.getUniformLocation(this.trailProgram, 'u_camera'), camera.x, camera.y);
    gl.uniform1f(gl.getUniformLocation(this.trailProgram, 'u_zoom'), camera.zoom);

    gl.bindVertexArray(this.trailVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.trailData.subarray(0, vertCount * 6));
    gl.drawArrays(gl.LINES, 0, vertCount);
  }

  private drawVectors(bodies: Body[], camera: Camera, halfW: number, halfH: number): void {
    const gl = this.gl;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let vertCount = 0;
    const maxVerts = this.vectorData.length / 5;
    const scale = 3.0 / camera.zoom;

    for (const body of bodies) {
      if (!body.alive || vertCount >= maxVerts - 2) continue;

      const speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
      if (speed < 0.01) continue;

      const endX = body.x + body.vx * scale;
      const endY = body.y + body.vy * scale;

      // Color from blue (slow) to red (fast)
      const t = Math.min(1, speed / 50);
      const r = t;
      const g = 0.5 * (1 - t);
      const b = 1 - t;

      const i = vertCount * 5;
      this.vectorData[i] = body.x;
      this.vectorData[i + 1] = body.y;
      this.vectorData[i + 2] = r;
      this.vectorData[i + 3] = g;
      this.vectorData[i + 4] = b;
      vertCount++;

      const j = vertCount * 5;
      this.vectorData[j] = endX;
      this.vectorData[j + 1] = endY;
      this.vectorData[j + 2] = r;
      this.vectorData[j + 3] = g;
      this.vectorData[j + 4] = b;
      vertCount++;
    }

    if (vertCount === 0) return;

    gl.useProgram(this.vectorProgram);
    gl.uniform2f(gl.getUniformLocation(this.vectorProgram, 'u_resolution'), halfW, halfH);
    gl.uniform2f(gl.getUniformLocation(this.vectorProgram, 'u_camera'), camera.x, camera.y);
    gl.uniform1f(gl.getUniformLocation(this.vectorProgram, 'u_zoom'), camera.zoom);

    gl.bindVertexArray(this.vectorVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vectorVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vectorData.subarray(0, vertCount * 5));
    gl.drawArrays(gl.LINES, 0, vertCount);
  }
}
