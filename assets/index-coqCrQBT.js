var Dt=Object.defineProperty;var wt=(e,r,t)=>r in e?Dt(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var A=(e,r,t)=>wt(e,typeof r!="symbol"?r+"":r,t);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function t(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(s){if(s.ep)return;s.ep=!0;const n=t(s);fetch(s.href,n)}})();const Lt=`#version 300 es
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
  float glow1 = exp(-dist * 5.0) * 0.35;

  // Soft atmosphere
  float glow2 = exp(-dist * 2.5) * 0.18;

  // Warm corona for massive bodies
  float corona = exp(-dist * 1.5) * massScale * 0.1;

  // Subtle ray pattern for large bodies
  float angle = atan(v_uv.y, v_uv.x);
  float rays = (sin(angle * 6.0 + u_time) * 0.5 + 0.5) * exp(-dist * 2.0) * massScale * 0.06;

  float alpha = core + glow1 + glow2 + corona + rays;

  // Smooth edge fade to eliminate visible quad boundary
  float edgeFade = 1.0 - smoothstep(0.85, 1.35, dist);
  alpha *= edgeFade;
  if (alpha < 0.002) discard;

  // Color shifts: core slightly brighter, edges show body color
  vec3 coreColor = mix(v_color, vec3(1.0), 0.2) * (core + glow1);
  vec3 glowColor = v_color * 1.2 * glow2;
  vec3 coronaColor = v_color * 0.8 * corona;
  vec3 rayColor = v_color * 1.2 * rays;

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
}`,Q=`#version 300 es
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
}`;function ct(e,r,t){const a=e.createShader(r);if(e.shaderSource(a,t),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS))throw console.error("Shader compile error:",e.getShaderInfoLog(a)),e.deleteShader(a),new Error("Shader compilation failed");return a}function T(e,r,t){const a=ct(e,e.VERTEX_SHADER,r),s=ct(e,e.FRAGMENT_SHADER,t),n=e.createProgram();if(e.attachShader(n,a),e.attachShader(n,s),e.linkProgram(n),!e.getProgramParameter(n,e.LINK_STATUS))throw console.error("Program link error:",e.getProgramInfoLog(n)),new Error("Program linking failed");return n}function J(e,r,t){const a=e.createFramebuffer(),s=e.createTexture();return e.bindTexture(e.TEXTURE_2D,s),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,r,t,0,e.RGBA,e.FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,a),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{fbo:a,texture:s,width:r,height:t}}class Zt{constructor(r){A(this,"gl");A(this,"canvas");A(this,"width",0);A(this,"height",0);A(this,"time",0);A(this,"bodyProgram");A(this,"trailProgram");A(this,"bloomExtractProgram");A(this,"blurProgram");A(this,"compositeProgram");A(this,"vectorProgram");A(this,"gridProgram");A(this,"pointProgram");A(this,"starProgram");A(this,"ringProgram");A(this,"quadVBO");A(this,"bodyInstanceVBO");A(this,"bodyVAO");A(this,"trailVBO");A(this,"trailVAO");A(this,"screenVBO");A(this,"screenVAO");A(this,"vectorVBO");A(this,"vectorVAO");A(this,"gridVBO");A(this,"gridVAO");A(this,"pointVBO");A(this,"pointVAO");A(this,"starVBO");A(this,"starVAO");A(this,"ringVAO");A(this,"sceneFB");A(this,"bloomFB1");A(this,"bloomFB2");A(this,"instanceData");A(this,"trailData");A(this,"vectorData");A(this,"gridData");A(this,"pointData");A(this,"starData");this.canvas=r;const t=r.getContext("webgl2",{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t)throw new Error("WebGL2 not supported");t.getExtension("EXT_color_buffer_float"),this.gl=t,this.bodyProgram=T(t,Lt,Vt),this.trailProgram=T(t,Tt,Ot),this.bloomExtractProgram=T(t,Q,It),this.blurProgram=T(t,Q,St),this.compositeProgram=T(t,Q,Yt),this.vectorProgram=T(t,kt,Nt),this.gridProgram=T(t,Wt,qt),this.pointProgram=T(t,Xt,Ct),this.starProgram=T(t,Ut,zt),this.ringProgram=T(t,Gt,Ht);const a=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.quadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.bufferData(t.ARRAY_BUFFER,a,t.STATIC_DRAW),this.bodyInstanceVBO=t.createBuffer(),this.instanceData=new Float32Array(1e4*7),this.bodyVAO=t.createVertexArray(),t.bindVertexArray(this.bodyVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.bodyInstanceVBO),t.bufferData(t.ARRAY_BUFFER,this.instanceData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,2,t.FLOAT,!1,28,0),t.vertexAttribDivisor(1,1),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,8),t.vertexAttribDivisor(2,1),t.enableVertexAttribArray(3),t.vertexAttribPointer(3,3,t.FLOAT,!1,28,12),t.vertexAttribDivisor(3,1),t.enableVertexAttribArray(4),t.vertexAttribPointer(4,1,t.FLOAT,!1,28,24),t.vertexAttribDivisor(4,1),t.bindVertexArray(null),this.trailData=new Float32Array(2e5*6),this.trailVBO=t.createBuffer(),this.trailVAO=t.createVertexArray(),t.bindVertexArray(this.trailVAO),t.bindBuffer(t.ARRAY_BUFFER,this.trailVBO),t.bufferData(t.ARRAY_BUFFER,this.trailData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,24,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,24,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,3,t.FLOAT,!1,24,12),t.bindVertexArray(null);const s=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.screenVBO=t.createBuffer(),this.screenVAO=t.createVertexArray(),t.bindVertexArray(this.screenVAO),t.bindBuffer(t.ARRAY_BUFFER,this.screenVBO),t.bufferData(t.ARRAY_BUFFER,s,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.vectorData=new Float32Array(1e4*10),this.vectorVBO=t.createBuffer(),this.vectorVAO=t.createVertexArray(),t.bindVertexArray(this.vectorVAO),t.bindBuffer(t.ARRAY_BUFFER,this.vectorVBO),t.bufferData(t.ARRAY_BUFFER,this.vectorData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,20,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,20,8),t.bindVertexArray(null),this.gridData=new Float32Array(4e3),this.gridVBO=t.createBuffer(),this.gridVAO=t.createVertexArray(),t.bindVertexArray(this.gridVAO),t.bindBuffer(t.ARRAY_BUFFER,this.gridVBO),t.bufferData(t.ARRAY_BUFFER,this.gridData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.pointData=new Float32Array(2e3*7),this.pointVBO=t.createBuffer(),this.pointVAO=t.createVertexArray(),t.bindVertexArray(this.pointVAO),t.bindBuffer(t.ARRAY_BUFFER,this.pointVBO),t.bufferData(t.ARRAY_BUFFER,this.pointData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.starData=new Float32Array(3e3*7),this.starVBO=t.createBuffer(),this.starVAO=t.createVertexArray(),t.bindVertexArray(this.starVAO),t.bindBuffer(t.ARRAY_BUFFER,this.starVBO),t.bufferData(t.ARRAY_BUFFER,this.starData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.ringVAO=t.createVertexArray(),t.bindVertexArray(this.ringVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE),this.resize()}resize(){const r=Math.min(window.devicePixelRatio||1,2),t=Math.floor(this.canvas.clientWidth*r),a=Math.floor(this.canvas.clientHeight*r);if(t===this.width&&a===this.height)return;this.width=t,this.height=a,this.canvas.width=t,this.canvas.height=a;const s=this.gl;this.sceneFB=J(s,t,a),this.bloomFB1=J(s,Math.floor(t/2),Math.floor(a/2)),this.bloomFB2=J(s,Math.floor(t/2),Math.floor(a/2))}render(r,t,a,s,n,l,i){const o=this.gl;this.resize(),this.time+=i;const c=this.width,f=this.height,h=c/2,m=f/2,g=t.x+t.shakeX,_=t.y+t.shakeY;o.bindFramebuffer(o.FRAMEBUFFER,this.sceneFB.fbo),o.viewport(0,0,c,f),o.clearColor(0,0,.015,1),o.clear(o.COLOR_BUFFER_BIT),this.drawStarfield(n,t,h,m),this.drawGrid(g,_,t.zoom,h,m),a.showTrails&&this.drawTrails(r,g,_,t.zoom,a,h,m),a.showVectors&&this.drawVectors(r,g,_,t.zoom,h,m),s.length>0&&this.drawParticles(s,g,_,t.zoom,h,m),this.drawBodies(r,g,_,t.zoom,h,m),l&&l.alive&&this.drawSelectionRing(l,g,_,t.zoom,h,m),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB1.fbo),o.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT),o.blendFunc(o.ONE,o.ZERO),o.useProgram(this.bloomExtractProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.sceneFB.texture),o.uniform1i(o.getUniformLocation(this.bloomExtractProgram,"u_texture"),0),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.useProgram(this.blurProgram),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB2.fbo),o.viewport(0,0,this.bloomFB2.width,this.bloomFB2.height),o.clear(o.COLOR_BUFFER_BIT),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.bloomFB1.texture),o.uniform1i(o.getUniformLocation(this.blurProgram,"u_texture"),0),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_direction"),1,0),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB2.width,this.bloomFB2.height),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB1.fbo),o.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),o.clear(o.COLOR_BUFFER_BIT),o.bindTexture(o.TEXTURE_2D,this.bloomFB2.texture),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_direction"),0,1),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB1.width,this.bloomFB1.height),o.drawArrays(o.TRIANGLES,0,6),o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,c,f),o.clearColor(0,0,0,1),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(this.compositeProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.sceneFB.texture),o.uniform1i(o.getUniformLocation(this.compositeProgram,"u_scene"),0),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,this.bloomFB1.texture),o.uniform1i(o.getUniformLocation(this.compositeProgram,"u_bloom"),1),o.uniform1f(o.getUniformLocation(this.compositeProgram,"u_bloomIntensity"),a.bloomIntensity),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.blendFunc(o.SRC_ALPHA,o.ONE)}drawStarfield(r,t,a,s){const n=this.gl;n.blendFunc(n.SRC_ALPHA,n.ONE);let l=0;const i=this.starData.length/7,o=[.02,.05,.1];for(const c of r){if(l>=i)break;const f=o[c.layer],h=(c.x-t.x*f)*t.zoom,m=(c.y-t.y*f)*t.zoom,g=100,_=(h+a+g)%(a*2+g*2)-a-g,b=(m+s+g)%(s*2+g*2)-s-g;if(Math.abs(_)>a+10||Math.abs(b)>s+10)continue;const p=.7+.3*Math.sin(this.time*c.twinkleSpeed+c.twinklePhase),y=c.brightness*p,x=l*7;this.starData[x]=_,this.starData[x+1]=b,this.starData[x+2]=c.color[0]*y,this.starData[x+3]=c.color[1]*y,this.starData[x+4]=c.color[2]*y,this.starData[x+5]=y*.6,this.starData[x+6]=c.size,l++}l!==0&&(n.useProgram(this.starProgram),n.uniform2f(n.getUniformLocation(this.starProgram,"u_resolution"),a,s),n.bindVertexArray(this.starVAO),n.bindBuffer(n.ARRAY_BUFFER,this.starVBO),n.bufferSubData(n.ARRAY_BUFFER,0,this.starData.subarray(0,l*7)),n.drawArrays(n.POINTS,0,l))}drawGrid(r,t,a,s,n){const l=this.gl;l.blendFunc(l.SRC_ALPHA,l.ONE);const o=this.width/a/10,c=Math.pow(10,Math.floor(Math.log10(o))),f=o/c;let h;f<2?h=c:f<5?h=2*c:h=5*c;const m=r-s/a,g=r+s/a,_=t-n/a,b=t+n/a;let p=0;const y=this.gridData.length/2,x=Math.floor(m/h)*h;for(let R=x;R<=g&&p<y-2;R+=h)this.gridData[p*2]=R,this.gridData[p*2+1]=_,p++,this.gridData[p*2]=R,this.gridData[p*2+1]=b,p++;const E=Math.floor(_/h)*h;for(let R=E;R<=b&&p<y-2;R+=h)this.gridData[p*2]=m,this.gridData[p*2+1]=R,p++,this.gridData[p*2]=g,this.gridData[p*2+1]=R,p++;p!==0&&(l.useProgram(this.gridProgram),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_resolution"),s,n),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_camera"),r,t),l.uniform1f(l.getUniformLocation(this.gridProgram,"u_zoom"),a),l.bindVertexArray(this.gridVAO),l.bindBuffer(l.ARRAY_BUFFER,this.gridVBO),l.bufferSubData(l.ARRAY_BUFFER,0,this.gridData.subarray(0,p*2)),l.drawArrays(l.LINES,0,p))}drawBodies(r,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let o=0;for(const c of r){if(!c.alive)continue;if(o*7>=this.instanceData.length)break;const f=o*7;this.instanceData[f]=c.x,this.instanceData[f+1]=c.y,this.instanceData[f+2]=c.radius,this.instanceData[f+3]=c.color[0],this.instanceData[f+4]=c.color[1],this.instanceData[f+5]=c.color[2],this.instanceData[f+6]=c.mass,o++}o!==0&&(i.useProgram(this.bodyProgram),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_zoom"),s),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_time"),this.time),i.bindVertexArray(this.bodyVAO),i.bindBuffer(i.ARRAY_BUFFER,this.bodyInstanceVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.instanceData.subarray(0,o*7)),i.drawArraysInstanced(i.TRIANGLES,0,6,o))}drawTrails(r,t,a,s,n,l,i){const o=this.gl;o.blendFunc(o.SRC_ALPHA,o.ONE);let c=0;const f=this.trailData.length/6,h=Math.min(n.trailLength,200);for(const m of r)if(!(!m.alive||h<2))for(let g=0;g<h-1&&c<f-2;g++){const _=(m.trailIndex-h+g+m.trailLength)%m.trailLength,b=(m.trailIndex-h+g+1+m.trailLength)%m.trailLength,p=m.trail[_*2],y=m.trail[_*2+1],x=m.trail[b*2],E=m.trail[b*2+1];if(p===0&&y===0||x===0&&E===0)continue;const R=g/h,nt=(g+1)/h,Pt=R*R,Bt=nt*nt,S=c*6;this.trailData[S]=p,this.trailData[S+1]=y,this.trailData[S+2]=Pt,this.trailData[S+3]=m.color[0],this.trailData[S+4]=m.color[1],this.trailData[S+5]=m.color[2],c++;const Y=c*6;this.trailData[Y]=x,this.trailData[Y+1]=E,this.trailData[Y+2]=Bt,this.trailData[Y+3]=m.color[0],this.trailData[Y+4]=m.color[1],this.trailData[Y+5]=m.color[2],c++}c!==0&&(o.useProgram(this.trailProgram),o.uniform2f(o.getUniformLocation(this.trailProgram,"u_resolution"),l,i),o.uniform2f(o.getUniformLocation(this.trailProgram,"u_camera"),t,a),o.uniform1f(o.getUniformLocation(this.trailProgram,"u_zoom"),s),o.bindVertexArray(this.trailVAO),o.bindBuffer(o.ARRAY_BUFFER,this.trailVBO),o.bufferSubData(o.ARRAY_BUFFER,0,this.trailData.subarray(0,c*6)),o.drawArrays(o.LINES,0,c))}drawVectors(r,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA);let o=0;const c=this.vectorData.length/5,f=3/s;for(const h of r){if(!h.alive||o>=c-2)continue;const m=Math.sqrt(h.vx*h.vx+h.vy*h.vy);if(m<.01)continue;const g=h.x+h.vx*f,_=h.y+h.vy*f,b=Math.min(1,m/50),p=o*5;this.vectorData[p]=h.x,this.vectorData[p+1]=h.y,this.vectorData[p+2]=b,this.vectorData[p+3]=.5*(1-b),this.vectorData[p+4]=1-b,o++;const y=o*5;this.vectorData[y]=g,this.vectorData[y+1]=_,this.vectorData[y+2]=b,this.vectorData[y+3]=.5*(1-b),this.vectorData[y+4]=1-b,o++}o!==0&&(i.useProgram(this.vectorProgram),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.vectorProgram,"u_zoom"),s),i.bindVertexArray(this.vectorVAO),i.bindBuffer(i.ARRAY_BUFFER,this.vectorVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.vectorData.subarray(0,o*5)),i.drawArrays(i.LINES,0,o))}drawParticles(r,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let o=0;const c=this.pointData.length/7;for(const f of r){if(o>=c)break;const h=f.life/f.maxLife,m=o*7;this.pointData[m]=f.x,this.pointData[m+1]=f.y,this.pointData[m+2]=f.color[0],this.pointData[m+3]=f.color[1],this.pointData[m+4]=f.color[2],this.pointData[m+5]=h*h,this.pointData[m+6]=f.size*(.5+h*.5),o++}o!==0&&(i.useProgram(this.pointProgram),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.pointProgram,"u_zoom"),s),i.bindVertexArray(this.pointVAO),i.bindBuffer(i.ARRAY_BUFFER,this.pointVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.pointData.subarray(0,o*7)),i.drawArrays(i.POINTS,0,o))}drawSelectionRing(r,t,a,s,n,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE),i.useProgram(this.ringProgram),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_resolution"),n,l),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_camera"),t,a),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_zoom"),s),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_center"),r.x,r.y),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_radius"),r.radius*4),i.uniform3f(i.getUniformLocation(this.ringProgram,"u_color"),r.color[0],r.color[1],r.color[2]),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_time"),this.time),i.bindVertexArray(this.ringVAO),i.drawArrays(i.TRIANGLES,0,6)}}const lt=.7;function C(e,r,t){return{cx:e,cy:r,size:t,totalMass:0,comX:0,comY:0,body:null,nw:null,ne:null,sw:null,se:null,isLeaf:!0}}function gt(e,r){if(e.totalMass===0&&e.body===null){e.body=r,e.totalMass=r.mass,e.comX=r.x,e.comY=r.y;return}if(e.size<.5){const a=e.totalMass+r.mass;e.comX=(e.comX*e.totalMass+r.x*r.mass)/a,e.comY=(e.comY*e.totalMass+r.y*r.mass)/a,e.totalMass=a;return}if(e.isLeaf&&e.body!==null){const a=e.body;e.body=null,e.isLeaf=!1;const s=e.size/2;e.nw=C(e.cx-s/2,e.cy-s/2,s),e.ne=C(e.cx+s/2,e.cy-s/2,s),e.sw=C(e.cx-s/2,e.cy+s/2,s),e.se=C(e.cx+s/2,e.cy+s/2,s),ut(e,a)}const t=e.totalMass+r.mass;e.comX=(e.comX*e.totalMass+r.x*r.mass)/t,e.comY=(e.comY*e.totalMass+r.y*r.mass)/t,e.totalMass=t,ut(e,r)}function ut(e,r){const t=r.x<e.cx,s=r.y<e.cy?t?e.nw:e.ne:t?e.sw:e.se;gt(s,r)}function U(e,r,t,a,s,n){if(e.totalMass===0)return;const l=e.comX-r.x,i=e.comY-r.y,o=l*l+i*i+t;if(e.isLeaf||e.size*e.size/o<lt*lt){if(e.body===r)return;const c=Math.sqrt(o),f=a*e.totalMass/o;s.v+=f*l/c,n.v+=f*i/c;return}e.nw&&U(e.nw,r,t,a,s,n),e.ne&&U(e.ne,r,t,a,s,n),e.sw&&U(e.sw,r,t,a,s,n),e.se&&U(e.se,r,t,a,s,n)}function $t(e){let r=1/0,t=1/0,a=-1/0,s=-1/0;for(const c of e)c.alive&&(c.x<r&&(r=c.x),c.y<t&&(t=c.y),c.x>a&&(a=c.x),c.y>s&&(s=c.y));const n=Math.max(a-r,s-t,100)*1.1,l=(r+a)/2,i=(t+s)/2,o=C(l,i,n);for(const c of e)c.alive&&gt(o,c);return o}function yt(e,r,t,a){const s=e.filter(c=>c.alive);if(s.length===0)return;const n=t*r.timeScale;if(n===0)return;const l=r.gravity*500,i=r.softening*r.softening,o=$t(s);for(const c of s){const f={v:0},h={v:0};U(o,c,i,l,f,h),c.vx+=f.v*n,c.vy+=h.v*n,c.vx*=r.damping,c.vy*=r.damping,c.x+=c.vx*n,c.y+=c.vy*n}if(r.mergeOnCollision)for(let c=0;c<s.length;c++){const f=s[c];if(f.alive)for(let h=c+1;h<s.length;h++){const m=s[h];if(!m.alive)continue;const g=f.x-m.x,_=f.y-m.y,b=g*g+_*_,p=f.radius+m.radius;if(b<p*p){const[y,x]=f.mass>=m.mass?[f,m]:[m,f],E=y.mass+x.mass;y.vx=(y.vx*y.mass+x.vx*x.mass)/E,y.vy=(y.vy*y.mass+x.vy*x.mass)/E,y.x=(y.x*y.mass+x.x*x.mass)/E,y.y=(y.y*y.mass+x.y*x.mass)/E,y.mass=E,y.radius=pt(E);const R=x.mass/E;y.color=[y.color[0]*(1-R)+x.color[0]*R,y.color[1]*(1-R)+x.color[1]*R,y.color[2]*(1-R)+x.color[2]*R],x.alive=!1,a&&a.push({x:y.x,y:y.y,mass:E,color:[...y.color]})}}}for(const c of s){if(!c.alive)continue;c.age+=n;const f=c.trailIndex*2;c.trail[f]=c.x,c.trail[f+1]=c.y,c.trailIndex=(c.trailIndex+1)%c.trailLength}}function pt(e){return Math.max(1.5,Math.pow(e,.35)*2)}let jt=0;function M(e,r,t,a,s,n,l=200){const i=n??st(s);return{x:e,y:r,vx:t,vy:a,mass:s,radius:pt(s),color:i,trail:new Float32Array(l*2),trailIndex:0,trailLength:l,id:jt++,alive:!0,age:0}}function st(e){const r=Math.min(1,Math.log10(e+1)/4);return r<.2?[.6,.7,1]:r<.4?[.9,.9,1]:r<.6?[1,.95,.7]:r<.8?[1,.7,.3]:[1,.4,.2]}function w(e,r,t,a,s,n){const l=e-t,i=r-a,o=Math.sqrt(l*l+i*i);if(o<1)return{vx:0,vy:0};const c=Math.sqrt(n*s/o),f=-i/o,h=l/o;return{vx:f*c,vy:h*c}}const B=500;function At(e){switch(e){case"solar-system":return mt();case"binary-stars":return Kt();case"galaxy":return Qt();case"collision":return Jt();case"asteroid-belt":return te();case"figure-eight":return ee();case"random":return oe();case"lagrange":return re();default:return mt()}}function mt(){const e=[];e.push(M(0,0,0,0,5e3,[1,.82,.3]));function a(m,g,_,b,p){const y=m.x+Math.cos(p)*g,x=m.y+Math.sin(p)*g,E=w(y,x,m.x,m.y,m.mass,B);e.push(M(y,x,m.vx+E.vx,m.vy+E.vy,_,b))}const s=[{au:.387,mass:.4,color:[.55,.55,.55]},{au:.723,mass:1.2,color:[.85,.75,.45]},{au:1,mass:1.5,color:[.15,.45,1]},{au:1.524,mass:.6,color:[.9,.3,.1]},{au:5.203,mass:18,color:[.8,.65,.4]},{au:9.537,mass:10,color:[.82,.72,.45]},{au:19.19,mass:4,color:[.45,.78,.88]},{au:30.07,mass:4.5,color:[.2,.3,.85]}],n=[0,.8,2.1,3.5,1.2,4.1,5.5,.5];for(let m=0;m<s.length;m++){const g=s[m],_=g.au*150,b=n[m],p=Math.cos(b)*_,y=Math.sin(b)*_,{vx:x,vy:E}=w(p,y,0,0,5e3,B);e.push(M(p,y,x,E,g.mass,g.color))}const l=e[3],i=e[4],o=e[5],c=e[6],f=e[7],h=e[8];return a(l,5,.12,[.75,.75,.75],.4),a(i,3,.02,[.5,.45,.4],0),a(i,5,.01,[.5,.45,.4],2.5),a(o,12,.15,[.9,.8,.3],0),a(o,18,.1,[.8,.78,.7],1.5),a(o,25,.18,[.55,.5,.45],3),a(o,38,.12,[.4,.35,.3],4.5),a(c,18,.15,[.75,.6,.25],.8),a(c,8,.03,[.9,.93,1],3.2),a(f,12,.06,[.6,.65,.7],1),a(f,18,.05,[.5,.48,.47],3.8),a(h,14,.08,[.6,.68,.75],2),{bodies:e,config:{gravity:1,timeScale:1,softening:8,trailLength:150,mergeOnCollision:!1},camera:{x:0,y:0,zoom:.4,targetZoom:.4,targetX:0,targetY:0}}}function Kt(){const e=[],a=Math.sqrt(B*2e3/400);e.push(M(-100,0,0,a,2e3,[.5,.7,1])),e.push(M(100,0,0,-a,2e3,[1,.6,.3]));for(let s=0;s<5;s++){const n=300+s*80,l=Math.random()*Math.PI*2,i=Math.cos(l)*n,o=Math.sin(l)*n,{vx:c,vy:f}=w(i,o,0,0,2e3*2,B),h=Math.random(),m=[.5+h*.5,.6,1-h*.5];e.push(M(i,o,c,f,3+Math.random()*10,m))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.6,targetZoom:.6,targetX:0,targetY:0}}}function Qt(){const e=[];e.push(M(0,0,0,0,2e4,[1,.95,.8]));const t=600;for(let a=0;a<t;a++){const s=a%2,l=a/t*4*Math.PI+s*Math.PI,i=40+a/t*600,o=i*.15,c=l+(Math.random()-.5)*.5,f=Math.cos(c)*i+(Math.random()-.5)*o,h=Math.sin(c)*i+(Math.random()-.5)*o,{vx:m,vy:g}=w(f,h,0,0,2e4,B),_=.5+Math.random()*3,b=Math.random();let p;b<.3?p=[.6,.7,1]:b<.6?p=[1,.95,.85]:b<.85?p=[1,.8,.5]:p=[1,.5,.3],e.push(M(f,h,m,g,_,p))}return{bodies:e,config:{gravity:1,timeScale:1.5,softening:15},camera:{x:0,y:0,zoom:.4,targetZoom:.4,targetX:0,targetY:0}}}function Jt(){const e=[];e.push(M(-300,-100,8,3,1e4,[.5,.7,1]));for(let t=0;t<250;t++){const a=Math.random()*Math.PI*2,s=30+Math.random()*250,n=-300+Math.cos(a)*s,l=-100+Math.sin(a)*s,{vx:i,vy:o}=w(n,l,-300,-100,1e4,B),c=[.4+Math.random()*.3,.6+Math.random()*.2,1];e.push(M(n,l,i+8,o+3,.5+Math.random()*2,c))}e.push(M(300,100,-8,-3,1e4,[1,.6,.3]));for(let t=0;t<250;t++){const a=Math.random()*Math.PI*2,s=30+Math.random()*250,n=300+Math.cos(a)*s,l=100+Math.sin(a)*s,{vx:i,vy:o}=w(n,l,300,100,1e4,B),c=[1,.5+Math.random()*.3,.2+Math.random()*.3];e.push(M(n,l,i-8,o-3,.5+Math.random()*2,c))}return{bodies:e,config:{gravity:1,timeScale:1,softening:20},camera:{x:0,y:0,zoom:.35,targetZoom:.35,targetX:0,targetY:0}}}function te(){const e=[];e.push(M(0,0,0,0,8e3,[1,.9,.5]));for(let n=0;n<3;n++){const l=80+n*60,i=Math.random()*Math.PI*2,o=Math.cos(i)*l,c=Math.sin(i)*l,{vx:f,vy:h}=w(o,c,0,0,8e3,B),m=[[.7,.7,.7],[.3,.5,1],[1,.4,.2]];e.push(M(o,c,f,h,10+Math.random()*20,m[n]))}for(let n=0;n<300;n++){const l=280+Math.random()*60,i=Math.random()*Math.PI*2,o=Math.cos(i)*l,c=Math.sin(i)*l,{vx:f,vy:h}=w(o,c,0,0,8e3,B),m=1+(Math.random()-.5)*.03,g=.4+Math.random()*.3,_=[g,g*.9,g*.8];e.push(M(o,c,f*m,h*m,.1+Math.random()*.5,_))}const t=500,{vx:a,vy:s}=w(t,0,0,0,8e3,B);return e.push(M(t,0,a,s,150,[.9,.75,.4])),{bodies:e,config:{gravity:1,timeScale:1,softening:8},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function ee(){const e=[];return e.push(M(-.97000436*150,.24308753*150,.466203685*40,.43236573*40,500,[1,.4,.4])),e.push(M(.97000436*150,-.24308753*150,.466203685*40,.43236573*40,500,[.4,1,.4])),e.push(M(0,0,-.933240737*40,-.86473146*40,500,[.4,.4,1])),{bodies:e,config:{gravity:1,timeScale:.5,softening:5,mergeOnCollision:!1},camera:{x:0,y:0,zoom:1,targetZoom:1,targetX:0,targetY:0}}}function oe(){const e=[],r=50+Math.floor(Math.random()*100);for(let t=0;t<r;t++){const a=Math.random()*Math.PI*2,s=50+Math.random()*400,n=Math.cos(a)*s,l=Math.sin(a)*s,i=Math.random()*15,o=a+Math.PI/2+(Math.random()-.5)*.5,c=Math.cos(o)*i,f=Math.sin(o)*i,h=1+Math.random()*Math.random()*500;e.push(M(n,l,c,f,h))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function re(){const e=[];e.push(M(0,0,0,0,5e3,[1,.95,.6]));const{vx:s,vy:n}=w(200,0,0,0,5e3,B);e.push(M(200,0,s,n,50,[.3,.6,1]));const l=Math.PI/3,i=Math.cos(-l)*200,o=Math.sin(-l)*200;for(let m=0;m<15;m++){const g=i+(Math.random()-.5)*30,_=o+(Math.random()-.5)*30,b=w(g,_,0,0,5e3,B);e.push(M(g,_,b.vx,b.vy,.5,[.5,1,.5]))}const c=-Math.PI/3,f=Math.cos(-c)*200,h=Math.sin(-c)*200;for(let m=0;m<15;m++){const g=f+(Math.random()-.5)*30,_=h+(Math.random()-.5)*30,b=w(g,_,0,0,5e3,B);e.push(M(g,_,b.vx,b.vy,.5,[1,.5,.5]))}return{bodies:e,config:{gravity:1,timeScale:1,softening:5},camera:{x:0,y:0,zoom:.8,targetZoom:.8,targetX:0,targetY:0}}}const ae=2e3;class se{constructor(){A(this,"particles",[])}spawnMergeExplosion(r){const t=Math.min(60,Math.floor(10+Math.sqrt(r.mass)*3));for(let a=0;a<t;a++){this.particles.length>=ae&&this.particles.shift();const s=Math.random()*Math.PI*2,n=(2+Math.random()*8)*Math.pow(r.mass,.15),l=.4+Math.random()*.8,i=Math.random(),o=[r.color[0]*(1-i)+1*i,r.color[1]*(1-i)+.9*i,r.color[2]*(1-i)+.4*i];this.particles.push({x:r.x+(Math.random()-.5)*4,y:r.y+(Math.random()-.5)*4,vx:Math.cos(s)*n,vy:Math.sin(s)*n,life:l,maxLife:l,color:o,size:.5+Math.random()*2})}}update(r){for(let t=this.particles.length-1;t>=0;t--){const a=this.particles[t];if(a.life-=r,a.life<=0){this.particles.splice(t,1);continue}a.x+=a.vx*r,a.y+=a.vy*r,a.vx*=.97,a.vy*=.97}}}const ht=[[.8,.85,1],[1,1,1],[1,.95,.85],[1,.85,.7],[1,.7,.6]];function ie(e){const r=[];for(let t=0;t<e;t++){const a=t<e*.6?0:t<e*.85?1:2,s=Math.floor(Math.random()*ht.length);r.push({x:(Math.random()-.5)*2e4,y:(Math.random()-.5)*2e4,brightness:.2+Math.random()*.8,size:a===0?.5+Math.random()*.5:a===1?.8+Math.random()*.7:1+Math.random()*1,layer:a,twinklePhase:Math.random()*Math.PI*2,twinkleSpeed:.5+Math.random()*2,color:ht[s]})}return r}let P=[],F=null;const d={x:0,y:0,zoom:.7,targetX:0,targetY:0,targetZoom:.7,shakeX:0,shakeY:0,shakeIntensity:0},v={gravity:1,timeScale:1,softening:10,damping:1,trailLength:80,bloomIntensity:.7,showTrails:!0,showVectors:!1,paused:!1,followHeaviest:!1,collisions:!1,mergeOnCollision:!1},V=document.getElementById("cosmos"),ne=new Zt(V),tt=new se,ce=ie(1500),le=document.getElementById("fps-display"),ue=document.getElementById("body-count"),k=document.getElementById("hint"),_t=document.getElementById("side-panel"),D=document.getElementById("creation-indicator"),ft=document.getElementById("body-info"),me=document.getElementById("info-dot"),he=document.getElementById("info-mass"),fe=document.getElementById("info-speed"),de=document.getElementById("info-pos"),ve=document.getElementById("info-radius"),ot=document.getElementById("btn-menu"),z=document.getElementById("btn-play"),ge=document.getElementById("btn-step"),q=document.getElementById("btn-trails"),rt=document.getElementById("btn-vectors"),ye=document.getElementById("btn-center"),N=document.getElementById("btn-follow"),pe=document.getElementById("btn-clear"),G=document.getElementById("gravity-slider"),H=document.getElementById("time-slider"),Z=document.getElementById("softening-slider"),$=document.getElementById("damping-slider"),j=document.getElementById("trail-slider"),K=document.getElementById("bloom-slider"),Ae=document.getElementById("gravity-value"),_e=document.getElementById("time-value"),be=document.getElementById("softening-value"),xe=document.getElementById("damping-value"),Me=document.getElementById("trail-value"),Re=document.getElementById("bloom-value");let O=!1;function I(){Ae.textContent=parseFloat(G.value).toFixed(2),_e.textContent=parseFloat(H.value).toFixed(2),be.textContent=Z.value,xe.textContent=parseFloat($.value).toFixed(3),Me.textContent=j.value,Re.textContent=parseFloat(K.value).toFixed(2)}function bt(){G.value=String(v.gravity),H.value=String(v.timeScale),Z.value=String(v.softening),$.value=String(v.damping),j.value=String(v.trailLength),K.value=String(v.bloomIntensity),I()}function X(e){return Math.abs(e)>=1e4?e.toExponential(1):Math.abs(e)>=100?e.toFixed(0):Math.abs(e)>=1?e.toFixed(1):e.toFixed(2)}function Ee(){if(!F||!F.alive){F=null,ft.classList.remove("visible");return}ft.classList.add("visible");const e=F,r=Math.sqrt(e.vx*e.vx+e.vy*e.vy);me.style.background=`rgb(${Math.round(e.color[0]*255)},${Math.round(e.color[1]*255)},${Math.round(e.color[2]*255)})`,he.textContent=X(e.mass),fe.textContent=X(r),de.textContent=`${X(e.x)}, ${X(e.y)}`,ve.textContent=X(e.radius)}G.addEventListener("input",()=>{v.gravity=parseFloat(G.value),I()});H.addEventListener("input",()=>{v.timeScale=parseFloat(H.value),I()});Z.addEventListener("input",()=>{v.softening=parseFloat(Z.value),I()});$.addEventListener("input",()=>{v.damping=parseFloat($.value),I()});j.addEventListener("input",()=>{v.trailLength=parseInt(j.value),I()});K.addEventListener("input",()=>{v.bloomIntensity=parseFloat(K.value),I()});ot.addEventListener("click",()=>{O=!O,_t.classList.toggle("visible",O),ot.classList.toggle("active",O)});z.addEventListener("click",()=>{v.paused=!v.paused,z.textContent=v.paused?"▶":"⏸",z.classList.toggle("active",v.paused)});ge.addEventListener("click",()=>{v.paused&&yt(P,v,1/60)});q.addEventListener("click",()=>{v.showTrails=!v.showTrails,q.classList.toggle("active",v.showTrails)});q.classList.add("active");rt.addEventListener("click",()=>{v.showVectors=!v.showVectors,rt.classList.toggle("active",v.showVectors)});ye.addEventListener("click",()=>{v.followHeaviest=!1,N.classList.remove("active"),F=null,d.targetX=0,d.targetY=0});N.addEventListener("click",()=>{v.followHeaviest=!v.followHeaviest,N.classList.toggle("active",v.followHeaviest)});pe.addEventListener("click",()=>{P=[],F=null});document.querySelectorAll(".preset-btn").forEach(e=>{e.addEventListener("click",()=>{const r=e.dataset.preset,t=At(r);P=t.bodies,F=null,t.config&&(Object.assign(v,t.config),t.config.mergeOnCollision===void 0&&(v.mergeOnCollision=!1),bt()),t.camera&&Object.assign(d,{...t.camera,shakeX:0,shakeY:0,shakeIntensity:0})})});const u={type:"none",startX:0,startY:0,startWorldX:0,startWorldY:0,currentX:0,currentY:0,movedDistance:0};function xt(e,r){const t=Math.min(window.devicePixelRatio||1,2);return{x:(e*t-V.width/2)/d.zoom+d.x,y:(r*t-V.height/2)/d.zoom+d.y}}function it(e,r){let t=null,a=1/0;const s=15/d.zoom;for(const n of P){if(!n.alive)continue;const l=n.x-e,i=n.y-r,o=Math.sqrt(l*l+i*i),c=Math.max(n.radius*3,s);o<c&&o<a&&(t=n,a=o)}return t}V.addEventListener("mousedown",e=>{if(e.preventDefault(),e.button===2||e.button===1||e.ctrlKey||e.metaKey)u.type="pan",u.startX=e.clientX,u.startY=e.clientY,u.startWorldX=d.targetX,u.startWorldY=d.targetY;else{u.type="create",u.startX=e.clientX,u.startY=e.clientY;const r=xt(e.clientX,e.clientY);u.startWorldX=r.x,u.startWorldY=r.y,u.currentX=e.clientX,u.currentY=e.clientY,u.movedDistance=0,D.style.display="block"}});V.addEventListener("mousemove",e=>{if(u.type==="pan"){const r=Math.min(window.devicePixelRatio||1,2),t=(e.clientX-u.startX)*r/d.zoom,a=(e.clientY-u.startY)*r/d.zoom;d.targetX=u.startWorldX-t,d.targetY=u.startWorldY-a,v.followHeaviest=!1,N.classList.remove("active")}else if(u.type==="create"){u.currentX=e.clientX,u.currentY=e.clientY;const r=u.currentX-u.startX,t=u.currentY-u.startY;u.movedDistance=Math.sqrt(r*r+t*t),Et(r,t)}});V.addEventListener("mouseup",()=>{if(u.type==="create"){const e=u.currentX-u.startX,r=u.currentY-u.startY,t=Math.sqrt(e*e+r*r);if(t<5)F=it(u.startWorldX,u.startWorldY);else{const a=Math.max(1,t*2),s=Math.min(window.devicePixelRatio||1,2),n=.3/d.zoom*s;P.push(M(u.startWorldX,u.startWorldY,-e*n,-r*n,a,st(a))),k.style.opacity="0"}D.style.display="none",D.querySelector(".arrow").style.display="none"}u.type="none"});V.addEventListener("wheel",e=>{e.preventDefault(),d.targetZoom=Math.max(.01,Math.min(20,d.targetZoom*(e.deltaY>0?.9:1.1)))},{passive:!1});V.addEventListener("contextmenu",e=>e.preventDefault());let Mt=0,Rt=0,L=null;V.addEventListener("touchstart",e=>{if(e.preventDefault(),e.touches.length===1){u.type="create",u.startX=e.touches[0].clientX,u.startY=e.touches[0].clientY;const r=xt(u.startX,u.startY);u.startWorldX=r.x,u.startWorldY=r.y,u.currentX=u.startX,u.currentY=u.startY,u.movedDistance=0,L=window.setTimeout(()=>{if(u.movedDistance<10){const t=it(u.startWorldX,u.startWorldY);t&&(F=t,u.type="none",D.style.display="none")}L=null},300),D.style.display="block"}else if(e.touches.length===2){L&&(clearTimeout(L),L=null),u.type="pan";const r=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY;Mt=Math.sqrt(r*r+t*t),Rt=d.targetZoom,u.startX=(e.touches[0].clientX+e.touches[1].clientX)/2,u.startY=(e.touches[0].clientY+e.touches[1].clientY)/2,u.startWorldX=d.targetX,u.startWorldY=d.targetY,D.style.display="none"}},{passive:!1});V.addEventListener("touchmove",e=>{if(e.preventDefault(),e.touches.length===1&&u.type==="create"){u.currentX=e.touches[0].clientX,u.currentY=e.touches[0].clientY;const r=u.currentX-u.startX,t=u.currentY-u.startY;u.movedDistance=Math.sqrt(r*r+t*t),u.movedDistance>10&&L&&(clearTimeout(L),L=null),Et(r,t)}else if(e.touches.length===2&&u.type==="pan"){const r=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY,a=Math.sqrt(r*r+t*t);d.targetZoom=Math.max(.01,Math.min(20,Rt*(a/Mt)));const s=(e.touches[0].clientX+e.touches[1].clientX)/2,n=(e.touches[0].clientY+e.touches[1].clientY)/2,l=Math.min(window.devicePixelRatio||1,2);d.targetX=u.startWorldX-(s-u.startX)*l/d.zoom,d.targetY=u.startWorldY-(n-u.startY)*l/d.zoom}},{passive:!1});V.addEventListener("touchend",e=>{if(L&&(clearTimeout(L),L=null),u.type==="create"&&e.touches.length===0){const r=u.currentX-u.startX,t=u.currentY-u.startY,a=Math.sqrt(r*r+t*t);if(a<10)F=it(u.startWorldX,u.startWorldY);else{const s=Math.max(1,a*2),n=Math.min(window.devicePixelRatio||1,2),l=.3/d.zoom*n;P.push(M(u.startWorldX,u.startWorldY,-r*l,-t*l,s,st(s))),k.style.opacity="0"}D.style.display="none"}e.touches.length===0&&(u.type="none")});function Et(e,r){const t=Math.sqrt(e*e+r*r),a=Math.max(1,t*2),s=Math.max(20,Math.min(60,Math.pow(a,.35)*8));D.style.left=`${u.startX}px`,D.style.top=`${u.startY}px`;const n=D.querySelector(".ring");n.style.width=`${s}px`,n.style.height=`${s}px`;const l=D.querySelector(".mass-label");if(l.textContent=t>5?`m=${X(a)}`:"",t>5){const i=D.querySelector(".arrow");i.style.width=`${t}px`,i.style.transform=`rotate(${Math.atan2(r,e)}rad)`,i.style.display="block"}}document.addEventListener("keydown",e=>{switch(e.key){case" ":e.preventDefault(),v.paused=!v.paused,z.textContent=v.paused?"▶":"⏸",z.classList.toggle("active",v.paused);break;case"t":v.showTrails=!v.showTrails,q.classList.toggle("active",v.showTrails);break;case"v":v.showVectors=!v.showVectors,rt.classList.toggle("active",v.showVectors);break;case"c":d.targetX=0,d.targetY=0;break;case"f":v.followHeaviest=!v.followHeaviest,N.classList.toggle("active",v.followHeaviest);break;case"Escape":F=null;break;case"Backspace":case"Delete":P=[],F=null;break;case"Tab":e.preventDefault(),O=!O,_t.classList.toggle("visible",O),ot.classList.toggle("active",O);break}});let dt=0,et=0,W=0,vt=60;function Ft(e){requestAnimationFrame(Ft);const r=Math.min((e-dt)/1e3,.05);dt=e,et++,W+=r,W>=.5&&(vt=Math.round(et/W),W=0,et=0);const t=1-Math.pow(.001,r);if(d.x+=(d.targetX-d.x)*t,d.y+=(d.targetY-d.y)*t,d.zoom+=(d.targetZoom-d.zoom)*t,d.shakeIntensity>.01?(d.shakeX=(Math.random()-.5)*d.shakeIntensity,d.shakeY=(Math.random()-.5)*d.shakeIntensity,d.shakeIntensity*=Math.pow(.02,r)):(d.shakeX=0,d.shakeY=0,d.shakeIntensity=0),v.followHeaviest){let a=null,s=0;for(const n of P)n.alive&&n.mass>s&&(s=n.mass,a=n);a&&(d.targetX=a.x,d.targetY=a.y)}if(!v.paused){const a=[],s=Math.max(1,Math.ceil(v.timeScale)),n=r/s;for(let l=0;l<s;l++)yt(P,v,n,a);for(const l of a)tt.spawnMergeExplosion(l),d.shakeIntensity=Math.min(15,d.shakeIntensity+Math.sqrt(l.mass)*.3)}tt.update(r),P=P.filter(a=>a.alive),F&&!F.alive&&(F=null),ne.render(P,d,v,tt.particles,ce,F,r),le.textContent=`${vt} FPS`,ue.textContent=`${P.length} bod${P.length===1?"y":"ies"}`,Ee()}const Fe=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);Fe&&(k.textContent="Tap & drag to create — Pinch to zoom — Two fingers to pan");const at=At("solar-system");P=at.bodies;at.camera&&Object.assign(d,{...at.camera,shakeX:0,shakeY:0,shakeIntensity:0});bt();requestAnimationFrame(Ft);setTimeout(()=>{k.style.opacity!=="0"&&(k.style.opacity="0")},6e3);
