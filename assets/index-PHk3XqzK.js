var Dt=Object.defineProperty;var wt=(e,o,t)=>o in e?Dt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var g=(e,o,t)=>wt(e,typeof o!="symbol"?o+"":o,t);(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function t(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(s){if(s.ep)return;s.ep=!0;const n=t(s);fetch(s.href,n)}})();const Lt=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_center;
layout(location = 2) in float a_radius;
layout(location = 3) in vec3 a_color;
layout(location = 4) in float a_mass;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;
uniform float u_time;

out vec2 v_uv;
out vec3 v_color;
out float v_mass;

void main() {
  vec2 worldPos = a_center + a_position * a_radius * 3.5;
  vec2 screenPos = (worldPos - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_uv = a_position;
  v_color = a_color;
  v_mass = a_mass;
}`,Vt=`#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_color;
in float v_mass;
uniform float u_time;

out vec4 fragColor;

void main() {
  float dist = length(v_uv);

  float massScale = clamp(log(v_mass + 1.0) / 6.0, 0.0, 1.0);

  // Animated core pulse for massive bodies
  float pulse = 1.0 + sin(u_time * 2.0 + v_mass * 0.1) * 0.05 * massScale;

  // Hard core
  float core = 1.0 - smoothstep(0.0, 0.28 * pulse, dist);

  // Chromatic inner glow
  float glow1 = exp(-dist * 3.5) * 0.8;

  // Soft atmosphere
  float glow2 = exp(-dist * 1.2) * 0.4;

  // Hot corona for massive bodies
  float corona = exp(-dist * 0.6) * massScale * 0.25;

  // Subtle ray pattern for large bodies
  float angle = atan(v_uv.y, v_uv.x);
  float rays = (sin(angle * 6.0 + u_time) * 0.5 + 0.5) * exp(-dist * 1.5) * massScale * 0.08;

  float alpha = core + glow1 + glow2 + corona + rays;

  // Color shifts: core is brighter/whiter, edges pick up body color
  vec3 coreColor = mix(v_color, vec3(1.0), 0.4) * (core + glow1);
  vec3 glowColor = v_color * 1.3 * glow2;
  vec3 coronaColor = vec3(1.0, 0.8, 0.5) * corona;
  vec3 rayColor = v_color * 1.5 * rays;

  vec3 color = coreColor + glowColor + coronaColor + rayColor;

  fragColor = vec4(color, alpha);
}`,Tt=`#version 300 es
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
}`,Ot=`#version 300 es
precision highp float;

in float v_alpha;
in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color * 0.7, v_alpha * 0.5);
}`,J=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,It=`#version 300 es
precision highp float;

uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, v_uv);
  float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  if (brightness > 0.25) {
    fragColor = color * smoothstep(0.25, 0.8, brightness);
  } else {
    fragColor = vec4(0.0);
  }
}`,St=`#version 300 es
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
}`,Yt=`#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_bloomIntensity;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 scene = texture(u_scene, v_uv);
  vec4 bloom = texture(u_bloom, v_uv);
  vec3 color = scene.rgb + bloom.rgb * u_bloomIntensity * 1.5;

  // ACES-ish tone mapping
  color = color * (2.51 * color + 0.03) / (color * (2.43 * color + 0.59) + 0.14);

  // Vignette
  vec2 vigUv = v_uv * 2.0 - 1.0;
  float vig = 1.0 - dot(vigUv, vigUv) * 0.2;
  color *= vig;

  fragColor = vec4(color, 1.0);
}`,Xt=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec4 a_color;
layout(location = 2) in float a_size;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

out vec4 v_color;

void main() {
  vec2 screenPos = (a_position - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  gl_PointSize = max(1.0, a_size * u_zoom);
  v_color = a_color;
}`,Ct=`#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  float dist = length(gl_PointCoord - 0.5) * 2.0;
  float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
  fragColor = vec4(v_color.rgb, v_color.a * alpha);
}`,Ut=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec4 a_color;
layout(location = 2) in float a_size;

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
  vec2 clipPos = a_position / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  gl_PointSize = a_size;
  v_color = a_color;
}`,zt=`#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  float dist = length(gl_PointCoord - 0.5) * 2.0;
  float alpha = exp(-dist * dist * 3.0);
  fragColor = vec4(v_color.rgb, v_color.a * alpha);
}`,kt=`#version 300 es
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
}`,Nt=`#version 300 es
precision highp float;

in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 0.6);
}`,Wt=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

void main() {
  vec2 screenPos = (a_position - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}`,qt=`#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 0.03);
}`,Gt=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;
uniform vec2 u_center;
uniform float u_radius;

out vec2 v_uv;

void main() {
  vec2 worldPos = u_center + a_position * u_radius;
  vec2 screenPos = (worldPos - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_uv = a_position;
}`,Ht=`#version 300 es
precision highp float;

in vec2 v_uv;
uniform vec3 u_color;
uniform float u_time;

out vec4 fragColor;

void main() {
  float dist = length(v_uv);
  float ring = smoothstep(0.85, 0.9, dist) * (1.0 - smoothstep(0.95, 1.0, dist));
  float pulse = 0.6 + sin(u_time * 3.0) * 0.15;
  float dashes = step(0.5, fract(atan(v_uv.y, v_uv.x) * 3.0 / 3.14159 + u_time * 0.5));
  fragColor = vec4(u_color, ring * pulse * (0.6 + dashes * 0.4));
}`;function ct(e,o,t){const a=e.createShader(o);if(e.shaderSource(a,t),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS))throw console.error("Shader compile error:",e.getShaderInfoLog(a)),e.deleteShader(a),new Error("Shader compilation failed");return a}function T(e,o,t){const a=ct(e,e.VERTEX_SHADER,o),s=ct(e,e.FRAGMENT_SHADER,t),n=e.createProgram();if(e.attachShader(n,a),e.attachShader(n,s),e.linkProgram(n),!e.getProgramParameter(n,e.LINK_STATUS))throw console.error("Program link error:",e.getProgramInfoLog(n)),new Error("Program linking failed");return n}function Q(e,o,t){const a=e.createFramebuffer(),s=e.createTexture();return e.bindTexture(e.TEXTURE_2D,s),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,o,t,0,e.RGBA,e.FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,a),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{fbo:a,texture:s,width:o,height:t}}class Zt{constructor(o){g(this,"gl");g(this,"canvas");g(this,"width",0);g(this,"height",0);g(this,"time",0);g(this,"bodyProgram");g(this,"trailProgram");g(this,"bloomExtractProgram");g(this,"blurProgram");g(this,"compositeProgram");g(this,"vectorProgram");g(this,"gridProgram");g(this,"pointProgram");g(this,"starProgram");g(this,"ringProgram");g(this,"quadVBO");g(this,"bodyInstanceVBO");g(this,"bodyVAO");g(this,"trailVBO");g(this,"trailVAO");g(this,"screenVBO");g(this,"screenVAO");g(this,"vectorVBO");g(this,"vectorVAO");g(this,"gridVBO");g(this,"gridVAO");g(this,"pointVBO");g(this,"pointVAO");g(this,"starVBO");g(this,"starVAO");g(this,"ringVAO");g(this,"sceneFB");g(this,"bloomFB1");g(this,"bloomFB2");g(this,"instanceData");g(this,"trailData");g(this,"vectorData");g(this,"gridData");g(this,"pointData");g(this,"starData");this.canvas=o;const t=o.getContext("webgl2",{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t)throw new Error("WebGL2 not supported");t.getExtension("EXT_color_buffer_float"),this.gl=t,this.bodyProgram=T(t,Lt,Vt),this.trailProgram=T(t,Tt,Ot),this.bloomExtractProgram=T(t,J,It),this.blurProgram=T(t,J,St),this.compositeProgram=T(t,J,Yt),this.vectorProgram=T(t,kt,Nt),this.gridProgram=T(t,Wt,qt),this.pointProgram=T(t,Xt,Ct),this.starProgram=T(t,Ut,zt),this.ringProgram=T(t,Gt,Ht);const a=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.quadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.bufferData(t.ARRAY_BUFFER,a,t.STATIC_DRAW),this.bodyInstanceVBO=t.createBuffer(),this.instanceData=new Float32Array(1e4*7),this.bodyVAO=t.createVertexArray(),t.bindVertexArray(this.bodyVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.bodyInstanceVBO),t.bufferData(t.ARRAY_BUFFER,this.instanceData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,2,t.FLOAT,!1,28,0),t.vertexAttribDivisor(1,1),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,8),t.vertexAttribDivisor(2,1),t.enableVertexAttribArray(3),t.vertexAttribPointer(3,3,t.FLOAT,!1,28,12),t.vertexAttribDivisor(3,1),t.enableVertexAttribArray(4),t.vertexAttribPointer(4,1,t.FLOAT,!1,28,24),t.vertexAttribDivisor(4,1),t.bindVertexArray(null),this.trailData=new Float32Array(2e5*6),this.trailVBO=t.createBuffer(),this.trailVAO=t.createVertexArray(),t.bindVertexArray(this.trailVAO),t.bindBuffer(t.ARRAY_BUFFER,this.trailVBO),t.bufferData(t.ARRAY_BUFFER,this.trailData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,24,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,24,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,3,t.FLOAT,!1,24,12),t.bindVertexArray(null);const s=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.screenVBO=t.createBuffer(),this.screenVAO=t.createVertexArray(),t.bindVertexArray(this.screenVAO),t.bindBuffer(t.ARRAY_BUFFER,this.screenVBO),t.bufferData(t.ARRAY_BUFFER,s,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.vectorData=new Float32Array(1e4*10),this.vectorVBO=t.createBuffer(),this.vectorVAO=t.createVertexArray(),t.bindVertexArray(this.vectorVAO),t.bindBuffer(t.ARRAY_BUFFER,this.vectorVBO),t.bufferData(t.ARRAY_BUFFER,this.vectorData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,20,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,20,8),t.bindVertexArray(null),this.gridData=new Float32Array(4e3),this.gridVBO=t.createBuffer(),this.gridVAO=t.createVertexArray(),t.bindVertexArray(this.gridVAO),t.bindBuffer(t.ARRAY_BUFFER,this.gridVBO),t.bufferData(t.ARRAY_BUFFER,this.gridData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.pointData=new Float32Array(2e3*7),this.pointVBO=t.createBuffer(),this.pointVAO=t.createVertexArray(),t.bindVertexArray(this.pointVAO),t.bindBuffer(t.ARRAY_BUFFER,this.pointVBO),t.bufferData(t.ARRAY_BUFFER,this.pointData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.starData=new Float32Array(3e3*7),this.starVBO=t.createBuffer(),this.starVAO=t.createVertexArray(),t.bindVertexArray(this.starVAO),t.bindBuffer(t.ARRAY_BUFFER,this.starVBO),t.bufferData(t.ARRAY_BUFFER,this.starData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.ringVAO=t.createVertexArray(),t.bindVertexArray(this.ringVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE),this.resize()}resize(){const o=Math.min(window.devicePixelRatio||1,2),t=Math.floor(this.canvas.clientWidth*o),a=Math.floor(this.canvas.clientHeight*o);if(t===this.width&&a===this.height)return;this.width=t,this.height=a,this.canvas.width=t,this.canvas.height=a;const s=this.gl;this.sceneFB=Q(s,t,a),this.bloomFB1=Q(s,Math.floor(t/2),Math.floor(a/2)),this.bloomFB2=Q(s,Math.floor(t/2),Math.floor(a/2))}render(o,t,a,s,n,l,i){const r=this.gl;this.resize(),this.time+=i;const c=this.width,f=this.height,m=c/2,h=f/2,y=t.x+t.shakeX,_=t.y+t.shakeY;r.bindFramebuffer(r.FRAMEBUFFER,this.sceneFB.fbo),r.viewport(0,0,c,f),r.clearColor(0,0,.015,1),r.clear(r.COLOR_BUFFER_BIT),this.drawStarfield(n,t,m,h),this.drawGrid(y,_,t.zoom,m,h),a.showTrails&&this.drawTrails(o,y,_,t.zoom,a,m,h),a.showVectors&&this.drawVectors(o,y,_,t.zoom,m,h),s.length>0&&this.drawParticles(s,y,_,t.zoom,m,h),this.drawBodies(o,y,_,t.zoom,m,h),l&&l.alive&&this.drawSelectionRing(l,y,_,t.zoom,m,h),r.bindFramebuffer(r.FRAMEBUFFER,this.bloomFB1.fbo),r.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),r.clearColor(0,0,0,0),r.clear(r.COLOR_BUFFER_BIT),r.blendFunc(r.ONE,r.ZERO),r.useProgram(this.bloomExtractProgram),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.sceneFB.texture),r.uniform1i(r.getUniformLocation(this.bloomExtractProgram,"u_texture"),0),r.bindVertexArray(this.screenVAO),r.drawArrays(r.TRIANGLES,0,6),r.useProgram(this.blurProgram),r.bindFramebuffer(r.FRAMEBUFFER,this.bloomFB2.fbo),r.viewport(0,0,this.bloomFB2.width,this.bloomFB2.height),r.clear(r.COLOR_BUFFER_BIT),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.bloomFB1.texture),r.uniform1i(r.getUniformLocation(this.blurProgram,"u_texture"),0),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_direction"),1,0),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB2.width,this.bloomFB2.height),r.bindVertexArray(this.screenVAO),r.drawArrays(r.TRIANGLES,0,6),r.bindFramebuffer(r.FRAMEBUFFER,this.bloomFB1.fbo),r.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),r.clear(r.COLOR_BUFFER_BIT),r.bindTexture(r.TEXTURE_2D,this.bloomFB2.texture),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_direction"),0,1),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB1.width,this.bloomFB1.height),r.drawArrays(r.TRIANGLES,0,6),r.bindFramebuffer(r.FRAMEBUFFER,null),r.viewport(0,0,c,f),r.clearColor(0,0,0,1),r.clear(r.COLOR_BUFFER_BIT),r.useProgram(this.compositeProgram),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.sceneFB.texture),r.uniform1i(r.getUniformLocation(this.compositeProgram,"u_scene"),0),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,this.bloomFB1.texture),r.uniform1i(r.getUniformLocation(this.compositeProgram,"u_bloom"),1),r.uniform1f(r.getUniformLocation(this.compositeProgram,"u_bloomIntensity"),a.bloomIntensity),r.bindVertexArray(this.screenVAO),r.drawArrays(r.TRIANGLES,0,6),r.blendFunc(r.SRC_ALPHA,r.ONE)}drawStarfield(o,t,a,s){const n=this.gl;n.blendFunc(n.SRC_ALPHA,n.ONE);let l=0;const i=this.starData.length/7,r=[.02,.05,.1];for(const c of o){if(l>=i)break;const f=r[c.layer],m=(c.x-t.x*f)*t.zoom,h=(c.y-t.y*f)*t.zoom,y=100,_=(m+a+y)%(a*2+y*2)-a-y,b=(h+s+y)%(s*2+y*2)-s-y;if(Math.abs(_)>a+10||Math.abs(b)>s+10)continue;const A=.7+.3*Math.sin(this.time*c.twinkleSpeed+c.twinklePhase),p=c.brightness*A,x=l*7;this.starData[x]=_,this.starData[x+1]=b,this.starData[x+2]=c.color[0]*p,this.starData[x+3]=c.color[1]*p,this.starData[x+4]=c.color[2]*p,this.starData[x+5]=p*.6,this.starData[x+6]=c.size,l++}l!==0&&(n.useProgram(this.starProgram),n.uniform2f(n.getUniformLocation(this.starProgram,"u_resolution"),a,s),n.bindVertexArray(this.starVAO),n.bindBuffer(n.ARRAY_BUFFER,this.starVBO),n.bufferSubData(n.ARRAY_BUFFER,0,this.starData.subarray(0,l*7)),n.drawArrays(n.POINTS,0,l))}drawGrid(o,t,a,s,n){const l=this.gl;l.blendFunc(l.SRC_ALPHA,l.ONE);const r=this.width/a/10,c=Math.pow(10,Math.floor(Math.log10(r))),f=r/c;let m;f<2?m=c:f<5?m=2*c:m=5*c;const h=o-s/a,y=o+s/a,_=t-n/a,b=t+n/a;let A=0;const p=this.gridData.length/2,x=Math.floor(h/m)*m;for(let R=x;R<=y&&A<p-2;R+=m)this.gridData[A*2]=R,this.gridData[A*2+1]=_,A++,this.gridData[A*2]=R,this.gridData[A*2+1]=b,A++;const B=Math.floor(_/m)*m;for(let R=B;R<=b&&A<p-2;R+=m)this.gridData[A*2]=h,this.gridData[A*2+1]=R,A++,this.gridData[A*2]=y,this.gridData[A*2+1]=R,A++;A!==0&&(l.useProgram(this.gridProgram),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_resolution"),s,n),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_camera"),o,t),l.uniform1f(l.getUniformLocation(this.gridProgram,"u_zoom"),a),l.bindVertexArray(this.gridVAO),l.bindBuffer(l.ARRAY_BUFFER,this.gridVBO),l.bufferSubData(l.ARRAY_BUFFER,0,this.gridData.subarray(0,A*2)),l.drawArrays(l.LINES,0,A))}drawBodies(o,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let r=0;for(const c of o){if(!c.alive)continue;if(r*7>=this.instanceData.length)break;const f=r*7;this.instanceData[f]=c.x,this.instanceData[f+1]=c.y,this.instanceData[f+2]=c.radius,this.instanceData[f+3]=c.color[0],this.instanceData[f+4]=c.color[1],this.instanceData[f+5]=c.color[2],this.instanceData[f+6]=c.mass,r++}r!==0&&(i.useProgram(this.bodyProgram),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_zoom"),s),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_time"),this.time),i.bindVertexArray(this.bodyVAO),i.bindBuffer(i.ARRAY_BUFFER,this.bodyInstanceVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.instanceData.subarray(0,r*7)),i.drawArraysInstanced(i.TRIANGLES,0,6,r))}drawTrails(o,t,a,s,n,l,i){const r=this.gl;r.blendFunc(r.SRC_ALPHA,r.ONE);let c=0;const f=this.trailData.length/6,m=Math.min(n.trailLength,200);for(const h of o)if(!(!h.alive||m<2))for(let y=0;y<m-1&&c<f-2;y++){const _=(h.trailIndex-m+y+h.trailLength)%h.trailLength,b=(h.trailIndex-m+y+1+h.trailLength)%h.trailLength,A=h.trail[_*2],p=h.trail[_*2+1],x=h.trail[b*2],B=h.trail[b*2+1];if(A===0&&p===0||x===0&&B===0)continue;const R=y/m,nt=(y+1)/m,Ft=R*R,Bt=nt*nt,S=c*6;this.trailData[S]=A,this.trailData[S+1]=p,this.trailData[S+2]=Ft,this.trailData[S+3]=h.color[0],this.trailData[S+4]=h.color[1],this.trailData[S+5]=h.color[2],c++;const Y=c*6;this.trailData[Y]=x,this.trailData[Y+1]=B,this.trailData[Y+2]=Bt,this.trailData[Y+3]=h.color[0],this.trailData[Y+4]=h.color[1],this.trailData[Y+5]=h.color[2],c++}c!==0&&(r.useProgram(this.trailProgram),r.uniform2f(r.getUniformLocation(this.trailProgram,"u_resolution"),l,i),r.uniform2f(r.getUniformLocation(this.trailProgram,"u_camera"),t,a),r.uniform1f(r.getUniformLocation(this.trailProgram,"u_zoom"),s),r.bindVertexArray(this.trailVAO),r.bindBuffer(r.ARRAY_BUFFER,this.trailVBO),r.bufferSubData(r.ARRAY_BUFFER,0,this.trailData.subarray(0,c*6)),r.drawArrays(r.LINES,0,c))}drawVectors(o,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA);let r=0;const c=this.vectorData.length/5,f=3/s;for(const m of o){if(!m.alive||r>=c-2)continue;const h=Math.sqrt(m.vx*m.vx+m.vy*m.vy);if(h<.01)continue;const y=m.x+m.vx*f,_=m.y+m.vy*f,b=Math.min(1,h/50),A=r*5;this.vectorData[A]=m.x,this.vectorData[A+1]=m.y,this.vectorData[A+2]=b,this.vectorData[A+3]=.5*(1-b),this.vectorData[A+4]=1-b,r++;const p=r*5;this.vectorData[p]=y,this.vectorData[p+1]=_,this.vectorData[p+2]=b,this.vectorData[p+3]=.5*(1-b),this.vectorData[p+4]=1-b,r++}r!==0&&(i.useProgram(this.vectorProgram),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.vectorProgram,"u_zoom"),s),i.bindVertexArray(this.vectorVAO),i.bindBuffer(i.ARRAY_BUFFER,this.vectorVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.vectorData.subarray(0,r*5)),i.drawArrays(i.LINES,0,r))}drawParticles(o,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let r=0;const c=this.pointData.length/7;for(const f of o){if(r>=c)break;const m=f.life/f.maxLife,h=r*7;this.pointData[h]=f.x,this.pointData[h+1]=f.y,this.pointData[h+2]=f.color[0],this.pointData[h+3]=f.color[1],this.pointData[h+4]=f.color[2],this.pointData[h+5]=m*m,this.pointData[h+6]=f.size*(.5+m*.5),r++}r!==0&&(i.useProgram(this.pointProgram),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.pointProgram,"u_zoom"),s),i.bindVertexArray(this.pointVAO),i.bindBuffer(i.ARRAY_BUFFER,this.pointVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.pointData.subarray(0,r*7)),i.drawArrays(i.POINTS,0,r))}drawSelectionRing(o,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE),i.useProgram(this.ringProgram),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_zoom"),s),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_center"),o.x,o.y),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_radius"),o.radius*4),i.uniform3f(i.getUniformLocation(this.ringProgram,"u_color"),o.color[0],o.color[1],o.color[2]),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_time"),this.time),i.bindVertexArray(this.ringVAO),i.drawArrays(i.TRIANGLES,0,6)}}const lt=.7;function C(e,o,t){return{cx:e,cy:o,size:t,totalMass:0,comX:0,comY:0,body:null,nw:null,ne:null,sw:null,se:null,isLeaf:!0}}function gt(e,o){if(e.totalMass===0&&e.body===null){e.body=o,e.totalMass=o.mass,e.comX=o.x,e.comY=o.y;return}if(e.size<.5){const a=e.totalMass+o.mass;e.comX=(e.comX*e.totalMass+o.x*o.mass)/a,e.comY=(e.comY*e.totalMass+o.y*o.mass)/a,e.totalMass=a;return}if(e.isLeaf&&e.body!==null){const a=e.body;e.body=null,e.isLeaf=!1;const s=e.size/2;e.nw=C(e.cx-s/2,e.cy-s/2,s),e.ne=C(e.cx+s/2,e.cy-s/2,s),e.sw=C(e.cx-s/2,e.cy+s/2,s),e.se=C(e.cx+s/2,e.cy+s/2,s),ut(e,a)}const t=e.totalMass+o.mass;e.comX=(e.comX*e.totalMass+o.x*o.mass)/t,e.comY=(e.comY*e.totalMass+o.y*o.mass)/t,e.totalMass=t,ut(e,o)}function ut(e,o){const t=o.x<e.cx,s=o.y<e.cy?t?e.nw:e.ne:t?e.sw:e.se;gt(s,o)}function U(e,o,t,a,s,n){if(e.totalMass===0)return;const l=e.comX-o.x,i=e.comY-o.y,r=l*l+i*i+t;if(e.isLeaf||e.size*e.size/r<lt*lt){if(e.body===o)return;const c=Math.sqrt(r),f=a*e.totalMass/r;s.v+=f*l/c,n.v+=f*i/c;return}e.nw&&U(e.nw,o,t,a,s,n),e.ne&&U(e.ne,o,t,a,s,n),e.sw&&U(e.sw,o,t,a,s,n),e.se&&U(e.se,o,t,a,s,n)}function $t(e){let o=1/0,t=1/0,a=-1/0,s=-1/0;for(const c of e)c.alive&&(c.x<o&&(o=c.x),c.y<t&&(t=c.y),c.x>a&&(a=c.x),c.y>s&&(s=c.y));const n=Math.max(a-o,s-t,100)*1.1,l=(o+a)/2,i=(t+s)/2,r=C(l,i,n);for(const c of e)c.alive&&gt(r,c);return r}function yt(e,o,t,a){const s=e.filter(c=>c.alive);if(s.length===0)return;const n=t*o.timeScale;if(n===0)return;const l=o.gravity*500,i=o.softening*o.softening,r=$t(s);for(const c of s){const f={v:0},m={v:0};U(r,c,i,l,f,m),c.vx+=f.v*n,c.vy+=m.v*n,c.vx*=o.damping,c.vy*=o.damping,c.x+=c.vx*n,c.y+=c.vy*n}if(o.mergeOnCollision)for(let c=0;c<s.length;c++){const f=s[c];if(f.alive)for(let m=c+1;m<s.length;m++){const h=s[m];if(!h.alive)continue;const y=f.x-h.x,_=f.y-h.y,b=y*y+_*_,A=f.radius+h.radius;if(b<A*A){const[p,x]=f.mass>=h.mass?[f,h]:[h,f],B=p.mass+x.mass;p.vx=(p.vx*p.mass+x.vx*x.mass)/B,p.vy=(p.vy*p.mass+x.vy*x.mass)/B,p.x=(p.x*p.mass+x.x*x.mass)/B,p.y=(p.y*p.mass+x.y*x.mass)/B,p.mass=B,p.radius=pt(B);const R=x.mass/B;p.color=[p.color[0]*(1-R)+x.color[0]*R,p.color[1]*(1-R)+x.color[1]*R,p.color[2]*(1-R)+x.color[2]*R],x.alive=!1,a&&a.push({x:p.x,y:p.y,mass:B,color:[...p.color]})}}}for(const c of s){if(!c.alive)continue;c.age+=n;const f=c.trailIndex*2;c.trail[f]=c.x,c.trail[f+1]=c.y,c.trailIndex=(c.trailIndex+1)%c.trailLength}}function pt(e){return Math.max(1.5,Math.pow(e,.35)*2)}let jt=0;function M(e,o,t,a,s,n,l=200){const i=n??st(s);return{x:e,y:o,vx:t,vy:a,mass:s,radius:pt(s),color:i,trail:new Float32Array(l*2),trailIndex:0,trailLength:l,id:jt++,alive:!0,age:0}}function st(e){const o=Math.min(1,Math.log10(e+1)/4);return o<.2?[.6,.7,1]:o<.4?[.9,.9,1]:o<.6?[1,.95,.7]:o<.8?[1,.7,.3]:[1,.4,.2]}function D(e,o,t,a,s,n){const l=e-t,i=o-a,r=Math.sqrt(l*l+i*i);if(r<1)return{vx:0,vy:0};const c=Math.sqrt(n*s/r),f=-i/r,m=l/r;return{vx:f*c,vy:m*c}}const F=500;function At(e){switch(e){case"solar-system":return mt();case"binary-stars":return Kt();case"galaxy":return Jt();case"collision":return Qt();case"asteroid-belt":return te();case"figure-eight":return ee();case"random":return oe();case"lagrange":return re();default:return mt()}}function mt(){const e=[];e.push(M(0,0,0,0,5e3,[1,.95,.6]));const o=[{dist:80,mass:2,color:[.7,.7,.7],name:"Mercury"},{dist:130,mass:5,color:[1,.85,.5],name:"Venus"},{dist:180,mass:6,color:[.3,.6,1],name:"Earth"},{dist:250,mass:4,color:[1,.4,.2],name:"Mars"},{dist:400,mass:100,color:[1,.8,.5],name:"Jupiter"},{dist:550,mass:60,color:[.9,.8,.5],name:"Saturn"},{dist:700,mass:30,color:[.5,.8,.9],name:"Uranus"},{dist:850,mass:28,color:[.3,.4,.9],name:"Neptune"}];for(const l of o){const{vx:i,vy:r}=D(l.dist,0,0,0,5e3,F);e.push(M(l.dist,0,i,r,l.mass,l.color))}const t=180,a=15,s=D(t,0,0,0,5e3,F),n=D(t+a,0,t,0,6,F);return e.push(M(t+a,0,s.vx+n.vx,s.vy+n.vy,.3,[.8,.8,.8])),{bodies:e,config:{gravity:1,timeScale:1,softening:5},camera:{x:0,y:0,zoom:.7,targetZoom:.7,targetX:0,targetY:0}}}function Kt(){const e=[],a=Math.sqrt(F*2e3/400);e.push(M(-100,0,0,a,2e3,[.5,.7,1])),e.push(M(100,0,0,-a,2e3,[1,.6,.3]));for(let s=0;s<5;s++){const n=300+s*80,l=Math.random()*Math.PI*2,i=Math.cos(l)*n,r=Math.sin(l)*n,{vx:c,vy:f}=D(i,r,0,0,2e3*2,F),m=Math.random(),h=[.5+m*.5,.6,1-m*.5];e.push(M(i,r,c,f,3+Math.random()*10,h))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.6,targetZoom:.6,targetX:0,targetY:0}}}function Jt(){const e=[];e.push(M(0,0,0,0,2e4,[1,.95,.8]));const t=600;for(let a=0;a<t;a++){const s=a%2,l=a/t*4*Math.PI+s*Math.PI,i=40+a/t*600,r=i*.15,c=l+(Math.random()-.5)*.5,f=Math.cos(c)*i+(Math.random()-.5)*r,m=Math.sin(c)*i+(Math.random()-.5)*r,{vx:h,vy:y}=D(f,m,0,0,2e4,F),_=.5+Math.random()*3,b=Math.random();let A;b<.3?A=[.6,.7,1]:b<.6?A=[1,.95,.85]:b<.85?A=[1,.8,.5]:A=[1,.5,.3],e.push(M(f,m,h,y,_,A))}return{bodies:e,config:{gravity:1,timeScale:1.5,softening:15},camera:{x:0,y:0,zoom:.4,targetZoom:.4,targetX:0,targetY:0}}}function Qt(){const e=[];e.push(M(-300,-100,8,3,1e4,[.5,.7,1]));for(let t=0;t<250;t++){const a=Math.random()*Math.PI*2,s=30+Math.random()*250,n=-300+Math.cos(a)*s,l=-100+Math.sin(a)*s,{vx:i,vy:r}=D(n,l,-300,-100,1e4,F),c=[.4+Math.random()*.3,.6+Math.random()*.2,1];e.push(M(n,l,i+8,r+3,.5+Math.random()*2,c))}e.push(M(300,100,-8,-3,1e4,[1,.6,.3]));for(let t=0;t<250;t++){const a=Math.random()*Math.PI*2,s=30+Math.random()*250,n=300+Math.cos(a)*s,l=100+Math.sin(a)*s,{vx:i,vy:r}=D(n,l,300,100,1e4,F),c=[1,.5+Math.random()*.3,.2+Math.random()*.3];e.push(M(n,l,i-8,r-3,.5+Math.random()*2,c))}return{bodies:e,config:{gravity:1,timeScale:1,softening:20},camera:{x:0,y:0,zoom:.35,targetZoom:.35,targetX:0,targetY:0}}}function te(){const e=[];e.push(M(0,0,0,0,8e3,[1,.9,.5]));for(let n=0;n<3;n++){const l=80+n*60,i=Math.random()*Math.PI*2,r=Math.cos(i)*l,c=Math.sin(i)*l,{vx:f,vy:m}=D(r,c,0,0,8e3,F),h=[[.7,.7,.7],[.3,.5,1],[1,.4,.2]];e.push(M(r,c,f,m,10+Math.random()*20,h[n]))}for(let n=0;n<300;n++){const l=280+Math.random()*60,i=Math.random()*Math.PI*2,r=Math.cos(i)*l,c=Math.sin(i)*l,{vx:f,vy:m}=D(r,c,0,0,8e3,F),h=1+(Math.random()-.5)*.03,y=.4+Math.random()*.3,_=[y,y*.9,y*.8];e.push(M(r,c,f*h,m*h,.1+Math.random()*.5,_))}const t=500,{vx:a,vy:s}=D(t,0,0,0,8e3,F);return e.push(M(t,0,a,s,150,[.9,.75,.4])),{bodies:e,config:{gravity:1,timeScale:1,softening:8},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function ee(){const e=[];return e.push(M(-.97000436*150,.24308753*150,.466203685*40,.43236573*40,500,[1,.4,.4])),e.push(M(.97000436*150,-.24308753*150,.466203685*40,.43236573*40,500,[.4,1,.4])),e.push(M(0,0,-.933240737*40,-.86473146*40,500,[.4,.4,1])),{bodies:e,config:{gravity:1,timeScale:.5,softening:5,mergeOnCollision:!1},camera:{x:0,y:0,zoom:1,targetZoom:1,targetX:0,targetY:0}}}function oe(){const e=[],o=50+Math.floor(Math.random()*100);for(let t=0;t<o;t++){const a=Math.random()*Math.PI*2,s=50+Math.random()*400,n=Math.cos(a)*s,l=Math.sin(a)*s,i=Math.random()*15,r=a+Math.PI/2+(Math.random()-.5)*.5,c=Math.cos(r)*i,f=Math.sin(r)*i,m=1+Math.random()*Math.random()*500;e.push(M(n,l,c,f,m))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function re(){const e=[];e.push(M(0,0,0,0,5e3,[1,.95,.6]));const{vx:s,vy:n}=D(200,0,0,0,5e3,F);e.push(M(200,0,s,n,50,[.3,.6,1]));const l=Math.PI/3,i=Math.cos(-l)*200,r=Math.sin(-l)*200;for(let h=0;h<15;h++){const y=i+(Math.random()-.5)*30,_=r+(Math.random()-.5)*30,b=D(y,_,0,0,5e3,F);e.push(M(y,_,b.vx,b.vy,.5,[.5,1,.5]))}const c=-Math.PI/3,f=Math.cos(-c)*200,m=Math.sin(-c)*200;for(let h=0;h<15;h++){const y=f+(Math.random()-.5)*30,_=m+(Math.random()-.5)*30,b=D(y,_,0,0,5e3,F);e.push(M(y,_,b.vx,b.vy,.5,[1,.5,.5]))}return{bodies:e,config:{gravity:1,timeScale:1,softening:5},camera:{x:0,y:0,zoom:.8,targetZoom:.8,targetX:0,targetY:0}}}const ae=2e3;class se{constructor(){g(this,"particles",[])}spawnMergeExplosion(o){const t=Math.min(60,Math.floor(10+Math.sqrt(o.mass)*3));for(let a=0;a<t;a++){this.particles.length>=ae&&this.particles.shift();const s=Math.random()*Math.PI*2,n=(2+Math.random()*8)*Math.pow(o.mass,.15),l=.4+Math.random()*.8,i=Math.random(),r=[o.color[0]*(1-i)+1*i,o.color[1]*(1-i)+.9*i,o.color[2]*(1-i)+.4*i];this.particles.push({x:o.x+(Math.random()-.5)*4,y:o.y+(Math.random()-.5)*4,vx:Math.cos(s)*n,vy:Math.sin(s)*n,life:l,maxLife:l,color:r,size:.5+Math.random()*2})}}update(o){for(let t=this.particles.length-1;t>=0;t--){const a=this.particles[t];if(a.life-=o,a.life<=0){this.particles.splice(t,1);continue}a.x+=a.vx*o,a.y+=a.vy*o,a.vx*=.97,a.vy*=.97}}}const ht=[[.8,.85,1],[1,1,1],[1,.95,.85],[1,.85,.7],[1,.7,.6]];function ie(e){const o=[];for(let t=0;t<e;t++){const a=t<e*.6?0:t<e*.85?1:2,s=Math.floor(Math.random()*ht.length);o.push({x:(Math.random()-.5)*2e4,y:(Math.random()-.5)*2e4,brightness:.2+Math.random()*.8,size:a===0?.5+Math.random()*.5:a===1?.8+Math.random()*.7:1+Math.random()*1,layer:a,twinklePhase:Math.random()*Math.PI*2,twinkleSpeed:.5+Math.random()*2,color:ht[s]})}return o}let P=[],E=null;const d={x:0,y:0,zoom:.7,targetX:0,targetY:0,targetZoom:.7,shakeX:0,shakeY:0,shakeIntensity:0},v={gravity:1,timeScale:1,softening:10,damping:1,trailLength:80,bloomIntensity:.7,showTrails:!0,showVectors:!1,paused:!1,followHeaviest:!1,collisions:!0,mergeOnCollision:!0},V=document.getElementById("cosmos"),ne=new Zt(V),tt=new se,ce=ie(1500),le=document.getElementById("fps-display"),ue=document.getElementById("body-count"),k=document.getElementById("hint"),_t=document.getElementById("side-panel"),w=document.getElementById("creation-indicator"),ft=document.getElementById("body-info"),me=document.getElementById("info-dot"),he=document.getElementById("info-mass"),fe=document.getElementById("info-speed"),de=document.getElementById("info-pos"),ve=document.getElementById("info-radius"),ot=document.getElementById("btn-menu"),z=document.getElementById("btn-play"),ge=document.getElementById("btn-step"),q=document.getElementById("btn-trails"),rt=document.getElementById("btn-vectors"),ye=document.getElementById("btn-center"),N=document.getElementById("btn-follow"),pe=document.getElementById("btn-clear"),G=document.getElementById("gravity-slider"),H=document.getElementById("time-slider"),Z=document.getElementById("softening-slider"),$=document.getElementById("damping-slider"),j=document.getElementById("trail-slider"),K=document.getElementById("bloom-slider"),Ae=document.getElementById("gravity-value"),_e=document.getElementById("time-value"),be=document.getElementById("softening-value"),xe=document.getElementById("damping-value"),Me=document.getElementById("trail-value"),Re=document.getElementById("bloom-value");let O=!1;function I(){Ae.textContent=parseFloat(G.value).toFixed(2),_e.textContent=parseFloat(H.value).toFixed(2),be.textContent=Z.value,xe.textContent=parseFloat($.value).toFixed(3),Me.textContent=j.value,Re.textContent=parseFloat(K.value).toFixed(2)}function bt(){G.value=String(v.gravity),H.value=String(v.timeScale),Z.value=String(v.softening),$.value=String(v.damping),j.value=String(v.trailLength),K.value=String(v.bloomIntensity),I()}function X(e){return Math.abs(e)>=1e4?e.toExponential(1):Math.abs(e)>=100?e.toFixed(0):Math.abs(e)>=1?e.toFixed(1):e.toFixed(2)}function Ee(){if(!E||!E.alive){E=null,ft.classList.remove("visible");return}ft.classList.add("visible");const e=E,o=Math.sqrt(e.vx*e.vx+e.vy*e.vy);me.style.background=`rgb(${Math.round(e.color[0]*255)},${Math.round(e.color[1]*255)},${Math.round(e.color[2]*255)})`,he.textContent=X(e.mass),fe.textContent=X(o),de.textContent=`${X(e.x)}, ${X(e.y)}`,ve.textContent=X(e.radius)}G.addEventListener("input",()=>{v.gravity=parseFloat(G.value),I()});H.addEventListener("input",()=>{v.timeScale=parseFloat(H.value),I()});Z.addEventListener("input",()=>{v.softening=parseFloat(Z.value),I()});$.addEventListener("input",()=>{v.damping=parseFloat($.value),I()});j.addEventListener("input",()=>{v.trailLength=parseInt(j.value),I()});K.addEventListener("input",()=>{v.bloomIntensity=parseFloat(K.value),I()});ot.addEventListener("click",()=>{O=!O,_t.classList.toggle("visible",O),ot.classList.toggle("active",O)});z.addEventListener("click",()=>{v.paused=!v.paused,z.textContent=v.paused?"▶":"⏸",z.classList.toggle("active",v.paused)});ge.addEventListener("click",()=>{v.paused&&yt(P,v,1/60)});q.addEventListener("click",()=>{v.showTrails=!v.showTrails,q.classList.toggle("active",v.showTrails)});q.classList.add("active");rt.addEventListener("click",()=>{v.showVectors=!v.showVectors,rt.classList.toggle("active",v.showVectors)});ye.addEventListener("click",()=>{v.followHeaviest=!1,N.classList.remove("active"),E=null,d.targetX=0,d.targetY=0});N.addEventListener("click",()=>{v.followHeaviest=!v.followHeaviest,N.classList.toggle("active",v.followHeaviest)});pe.addEventListener("click",()=>{P=[],E=null});document.querySelectorAll(".preset-btn").forEach(e=>{e.addEventListener("click",()=>{const o=e.dataset.preset,t=At(o);P=t.bodies,E=null,t.config&&(Object.assign(v,t.config),t.config.mergeOnCollision===void 0&&(v.mergeOnCollision=!0),bt()),t.camera&&Object.assign(d,{...t.camera,shakeX:0,shakeY:0,shakeIntensity:0})})});const u={type:"none",startX:0,startY:0,startWorldX:0,startWorldY:0,currentX:0,currentY:0,movedDistance:0};function xt(e,o){const t=Math.min(window.devicePixelRatio||1,2);return{x:(e*t-V.width/2)/d.zoom+d.x,y:(o*t-V.height/2)/d.zoom+d.y}}function it(e,o){let t=null,a=1/0;const s=15/d.zoom;for(const n of P){if(!n.alive)continue;const l=n.x-e,i=n.y-o,r=Math.sqrt(l*l+i*i),c=Math.max(n.radius*3,s);r<c&&r<a&&(t=n,a=r)}return t}V.addEventListener("mousedown",e=>{if(e.preventDefault(),e.button===2||e.button===1||e.ctrlKey||e.metaKey)u.type="pan",u.startX=e.clientX,u.startY=e.clientY,u.startWorldX=d.targetX,u.startWorldY=d.targetY;else{u.type="create",u.startX=e.clientX,u.startY=e.clientY;const o=xt(e.clientX,e.clientY);u.startWorldX=o.x,u.startWorldY=o.y,u.currentX=e.clientX,u.currentY=e.clientY,u.movedDistance=0,w.style.display="block"}});V.addEventListener("mousemove",e=>{if(u.type==="pan"){const o=Math.min(window.devicePixelRatio||1,2),t=(e.clientX-u.startX)*o/d.zoom,a=(e.clientY-u.startY)*o/d.zoom;d.targetX=u.startWorldX-t,d.targetY=u.startWorldY-a,v.followHeaviest=!1,N.classList.remove("active")}else if(u.type==="create"){u.currentX=e.clientX,u.currentY=e.clientY;const o=u.currentX-u.startX,t=u.currentY-u.startY;u.movedDistance=Math.sqrt(o*o+t*t),Et(o,t)}});V.addEventListener("mouseup",()=>{if(u.type==="create"){const e=u.currentX-u.startX,o=u.currentY-u.startY,t=Math.sqrt(e*e+o*o);if(t<5)E=it(u.startWorldX,u.startWorldY);else{const a=Math.max(1,t*2),s=Math.min(window.devicePixelRatio||1,2),n=.3/d.zoom*s;P.push(M(u.startWorldX,u.startWorldY,-e*n,-o*n,a,st(a))),k.style.opacity="0"}w.style.display="none",w.querySelector(".arrow").style.display="none"}u.type="none"});V.addEventListener("wheel",e=>{e.preventDefault(),d.targetZoom=Math.max(.01,Math.min(20,d.targetZoom*(e.deltaY>0?.9:1.1)))},{passive:!1});V.addEventListener("contextmenu",e=>e.preventDefault());let Mt=0,Rt=0,L=null;V.addEventListener("touchstart",e=>{if(e.preventDefault(),e.touches.length===1){u.type="create",u.startX=e.touches[0].clientX,u.startY=e.touches[0].clientY;const o=xt(u.startX,u.startY);u.startWorldX=o.x,u.startWorldY=o.y,u.currentX=u.startX,u.currentY=u.startY,u.movedDistance=0,L=window.setTimeout(()=>{if(u.movedDistance<10){const t=it(u.startWorldX,u.startWorldY);t&&(E=t,u.type="none",w.style.display="none")}L=null},300),w.style.display="block"}else if(e.touches.length===2){L&&(clearTimeout(L),L=null),u.type="pan";const o=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY;Mt=Math.sqrt(o*o+t*t),Rt=d.targetZoom,u.startX=(e.touches[0].clientX+e.touches[1].clientX)/2,u.startY=(e.touches[0].clientY+e.touches[1].clientY)/2,u.startWorldX=d.targetX,u.startWorldY=d.targetY,w.style.display="none"}},{passive:!1});V.addEventListener("touchmove",e=>{if(e.preventDefault(),e.touches.length===1&&u.type==="create"){u.currentX=e.touches[0].clientX,u.currentY=e.touches[0].clientY;const o=u.currentX-u.startX,t=u.currentY-u.startY;u.movedDistance=Math.sqrt(o*o+t*t),u.movedDistance>10&&L&&(clearTimeout(L),L=null),Et(o,t)}else if(e.touches.length===2&&u.type==="pan"){const o=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY,a=Math.sqrt(o*o+t*t);d.targetZoom=Math.max(.01,Math.min(20,Rt*(a/Mt)));const s=(e.touches[0].clientX+e.touches[1].clientX)/2,n=(e.touches[0].clientY+e.touches[1].clientY)/2,l=Math.min(window.devicePixelRatio||1,2);d.targetX=u.startWorldX-(s-u.startX)*l/d.zoom,d.targetY=u.startWorldY-(n-u.startY)*l/d.zoom}},{passive:!1});V.addEventListener("touchend",e=>{if(L&&(clearTimeout(L),L=null),u.type==="create"&&e.touches.length===0){const o=u.currentX-u.startX,t=u.currentY-u.startY,a=Math.sqrt(o*o+t*t);if(a<10)E=it(u.startWorldX,u.startWorldY);else{const s=Math.max(1,a*2),n=Math.min(window.devicePixelRatio||1,2),l=.3/d.zoom*n;P.push(M(u.startWorldX,u.startWorldY,-o*l,-t*l,s,st(s))),k.style.opacity="0"}w.style.display="none"}e.touches.length===0&&(u.type="none")});function Et(e,o){const t=Math.sqrt(e*e+o*o),a=Math.max(1,t*2),s=Math.max(20,Math.min(60,Math.pow(a,.35)*8));w.style.left=`${u.startX}px`,w.style.top=`${u.startY}px`;const n=w.querySelector(".ring");n.style.width=`${s}px`,n.style.height=`${s}px`;const l=w.querySelector(".mass-label");if(l.textContent=t>5?`m=${X(a)}`:"",t>5){const i=w.querySelector(".arrow");i.style.width=`${t}px`,i.style.transform=`rotate(${Math.atan2(o,e)}rad)`,i.style.display="block"}}document.addEventListener("keydown",e=>{switch(e.key){case" ":e.preventDefault(),v.paused=!v.paused,z.textContent=v.paused?"▶":"⏸",z.classList.toggle("active",v.paused);break;case"t":v.showTrails=!v.showTrails,q.classList.toggle("active",v.showTrails);break;case"v":v.showVectors=!v.showVectors,rt.classList.toggle("active",v.showVectors);break;case"c":d.targetX=0,d.targetY=0;break;case"f":v.followHeaviest=!v.followHeaviest,N.classList.toggle("active",v.followHeaviest);break;case"Escape":E=null;break;case"Backspace":case"Delete":P=[],E=null;break;case"Tab":e.preventDefault(),O=!O,_t.classList.toggle("visible",O),ot.classList.toggle("active",O);break}});let dt=0,et=0,W=0,vt=60;function Pt(e){requestAnimationFrame(Pt);const o=Math.min((e-dt)/1e3,.05);dt=e,et++,W+=o,W>=.5&&(vt=Math.round(et/W),W=0,et=0);const t=1-Math.pow(.001,o);if(d.x+=(d.targetX-d.x)*t,d.y+=(d.targetY-d.y)*t,d.zoom+=(d.targetZoom-d.zoom)*t,d.shakeIntensity>.01?(d.shakeX=(Math.random()-.5)*d.shakeIntensity,d.shakeY=(Math.random()-.5)*d.shakeIntensity,d.shakeIntensity*=Math.pow(.02,o)):(d.shakeX=0,d.shakeY=0,d.shakeIntensity=0),v.followHeaviest){let a=null,s=0;for(const n of P)n.alive&&n.mass>s&&(s=n.mass,a=n);a&&(d.targetX=a.x,d.targetY=a.y)}if(!v.paused){const a=[],s=Math.max(1,Math.ceil(v.timeScale)),n=o/s;for(let l=0;l<s;l++)yt(P,v,n,a);for(const l of a)tt.spawnMergeExplosion(l),d.shakeIntensity=Math.min(15,d.shakeIntensity+Math.sqrt(l.mass)*.3)}tt.update(o),P=P.filter(a=>a.alive),E&&!E.alive&&(E=null),ne.render(P,d,v,tt.particles,ce,E,o),le.textContent=`${vt} FPS`,ue.textContent=`${P.length} bod${P.length===1?"y":"ies"}`,Ee()}const Pe=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);Pe&&(k.textContent="Tap & drag to create — Pinch to zoom — Two fingers to pan");const at=At("solar-system");P=at.bodies;at.camera&&Object.assign(d,{...at.camera,shakeX:0,shakeY:0,shakeIntensity:0});bt();requestAnimationFrame(Pt);setTimeout(()=>{k.style.opacity!=="0"&&(k.style.opacity="0")},6e3);
