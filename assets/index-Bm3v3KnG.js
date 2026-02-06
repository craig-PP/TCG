var Dt=Object.defineProperty;var wt=(e,o,t)=>o in e?Dt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var A=(e,o,t)=>wt(e,typeof o!="symbol"?o+"":o,t);(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const c of a)if(c.type==="childList")for(const l of c.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function t(a){const c={};return a.integrity&&(c.integrity=a.integrity),a.referrerPolicy&&(c.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?c.credentials="include":a.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function s(a){if(a.ep)return;a.ep=!0;const c=t(a);fetch(a.href,c)}})();const Lt=`#version 300 es
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
}`,J=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,St=`#version 300 es
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
}`,It=`#version 300 es
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
}`;function ct(e,o,t){const s=e.createShader(o);if(e.shaderSource(s,t),e.compileShader(s),!e.getShaderParameter(s,e.COMPILE_STATUS))throw console.error("Shader compile error:",e.getShaderInfoLog(s)),e.deleteShader(s),new Error("Shader compilation failed");return s}function T(e,o,t){const s=ct(e,e.VERTEX_SHADER,o),a=ct(e,e.FRAGMENT_SHADER,t),c=e.createProgram();if(e.attachShader(c,s),e.attachShader(c,a),e.linkProgram(c),!e.getProgramParameter(c,e.LINK_STATUS))throw console.error("Program link error:",e.getProgramInfoLog(c)),new Error("Program linking failed");return c}function tt(e,o,t){const s=e.createFramebuffer(),a=e.createTexture();return e.bindTexture(e.TEXTURE_2D,a),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,o,t,0,e.RGBA,e.FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{fbo:s,texture:a,width:o,height:t}}class Zt{constructor(o){A(this,"gl");A(this,"canvas");A(this,"width",0);A(this,"height",0);A(this,"time",0);A(this,"bodyProgram");A(this,"trailProgram");A(this,"bloomExtractProgram");A(this,"blurProgram");A(this,"compositeProgram");A(this,"vectorProgram");A(this,"gridProgram");A(this,"pointProgram");A(this,"starProgram");A(this,"ringProgram");A(this,"quadVBO");A(this,"bodyInstanceVBO");A(this,"bodyVAO");A(this,"trailVBO");A(this,"trailVAO");A(this,"screenVBO");A(this,"screenVAO");A(this,"vectorVBO");A(this,"vectorVAO");A(this,"gridVBO");A(this,"gridVAO");A(this,"pointVBO");A(this,"pointVAO");A(this,"starVBO");A(this,"starVAO");A(this,"ringVAO");A(this,"sceneFB");A(this,"bloomFB1");A(this,"bloomFB2");A(this,"instanceData");A(this,"trailData");A(this,"vectorData");A(this,"gridData");A(this,"pointData");A(this,"starData");this.canvas=o;const t=o.getContext("webgl2",{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t)throw new Error("WebGL2 not supported");t.getExtension("EXT_color_buffer_float"),this.gl=t,this.bodyProgram=T(t,Lt,Vt),this.trailProgram=T(t,Tt,Ot),this.bloomExtractProgram=T(t,J,St),this.blurProgram=T(t,J,It),this.compositeProgram=T(t,J,Yt),this.vectorProgram=T(t,kt,Nt),this.gridProgram=T(t,Wt,qt),this.pointProgram=T(t,Xt,Ct),this.starProgram=T(t,Ut,zt),this.ringProgram=T(t,Gt,Ht);const s=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.quadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.bufferData(t.ARRAY_BUFFER,s,t.STATIC_DRAW),this.bodyInstanceVBO=t.createBuffer(),this.instanceData=new Float32Array(1e4*7),this.bodyVAO=t.createVertexArray(),t.bindVertexArray(this.bodyVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.bodyInstanceVBO),t.bufferData(t.ARRAY_BUFFER,this.instanceData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,2,t.FLOAT,!1,28,0),t.vertexAttribDivisor(1,1),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,8),t.vertexAttribDivisor(2,1),t.enableVertexAttribArray(3),t.vertexAttribPointer(3,3,t.FLOAT,!1,28,12),t.vertexAttribDivisor(3,1),t.enableVertexAttribArray(4),t.vertexAttribPointer(4,1,t.FLOAT,!1,28,24),t.vertexAttribDivisor(4,1),t.bindVertexArray(null),this.trailData=new Float32Array(2e5*6),this.trailVBO=t.createBuffer(),this.trailVAO=t.createVertexArray(),t.bindVertexArray(this.trailVAO),t.bindBuffer(t.ARRAY_BUFFER,this.trailVBO),t.bufferData(t.ARRAY_BUFFER,this.trailData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,24,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,24,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,3,t.FLOAT,!1,24,12),t.bindVertexArray(null);const a=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.screenVBO=t.createBuffer(),this.screenVAO=t.createVertexArray(),t.bindVertexArray(this.screenVAO),t.bindBuffer(t.ARRAY_BUFFER,this.screenVBO),t.bufferData(t.ARRAY_BUFFER,a,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.vectorData=new Float32Array(1e4*10),this.vectorVBO=t.createBuffer(),this.vectorVAO=t.createVertexArray(),t.bindVertexArray(this.vectorVAO),t.bindBuffer(t.ARRAY_BUFFER,this.vectorVBO),t.bufferData(t.ARRAY_BUFFER,this.vectorData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,20,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,20,8),t.bindVertexArray(null),this.gridData=new Float32Array(4e3),this.gridVBO=t.createBuffer(),this.gridVAO=t.createVertexArray(),t.bindVertexArray(this.gridVAO),t.bindBuffer(t.ARRAY_BUFFER,this.gridVBO),t.bufferData(t.ARRAY_BUFFER,this.gridData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.pointData=new Float32Array(2e3*7),this.pointVBO=t.createBuffer(),this.pointVAO=t.createVertexArray(),t.bindVertexArray(this.pointVAO),t.bindBuffer(t.ARRAY_BUFFER,this.pointVBO),t.bufferData(t.ARRAY_BUFFER,this.pointData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.starData=new Float32Array(3e3*7),this.starVBO=t.createBuffer(),this.starVAO=t.createVertexArray(),t.bindVertexArray(this.starVAO),t.bindBuffer(t.ARRAY_BUFFER,this.starVBO),t.bufferData(t.ARRAY_BUFFER,this.starData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.ringVAO=t.createVertexArray(),t.bindVertexArray(this.ringVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE),this.resize()}resize(){const o=Math.min(window.devicePixelRatio||1,2),t=Math.floor(this.canvas.clientWidth*o),s=Math.floor(this.canvas.clientHeight*o);if(t===this.width&&s===this.height)return;this.width=t,this.height=s,this.canvas.width=t,this.canvas.height=s;const a=this.gl;this.sceneFB=tt(a,t,s),this.bloomFB1=tt(a,Math.floor(t/2),Math.floor(s/2)),this.bloomFB2=tt(a,Math.floor(t/2),Math.floor(s/2))}render(o,t,s,a,c,l,i){const r=this.gl;this.resize(),this.time+=i;const n=this.width,f=this.height,m=n/2,h=f/2,d=t.x+t.shakeX,_=t.y+t.shakeY;r.bindFramebuffer(r.FRAMEBUFFER,this.sceneFB.fbo),r.viewport(0,0,n,f),r.clearColor(0,0,.015,1),r.clear(r.COLOR_BUFFER_BIT),this.drawStarfield(c,t,m,h),this.drawGrid(d,_,t.zoom,m,h),s.showTrails&&this.drawTrails(o,d,_,t.zoom,s,m,h),s.showVectors&&this.drawVectors(o,d,_,t.zoom,m,h),a.length>0&&this.drawParticles(a,d,_,t.zoom,m,h),this.drawBodies(o,d,_,t.zoom,m,h),l&&l.alive&&this.drawSelectionRing(l,d,_,t.zoom,m,h),r.bindFramebuffer(r.FRAMEBUFFER,this.bloomFB1.fbo),r.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),r.clearColor(0,0,0,0),r.clear(r.COLOR_BUFFER_BIT),r.blendFunc(r.ONE,r.ZERO),r.useProgram(this.bloomExtractProgram),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.sceneFB.texture),r.uniform1i(r.getUniformLocation(this.bloomExtractProgram,"u_texture"),0),r.bindVertexArray(this.screenVAO),r.drawArrays(r.TRIANGLES,0,6),r.useProgram(this.blurProgram),r.bindFramebuffer(r.FRAMEBUFFER,this.bloomFB2.fbo),r.viewport(0,0,this.bloomFB2.width,this.bloomFB2.height),r.clear(r.COLOR_BUFFER_BIT),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.bloomFB1.texture),r.uniform1i(r.getUniformLocation(this.blurProgram,"u_texture"),0),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_direction"),1,0),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB2.width,this.bloomFB2.height),r.bindVertexArray(this.screenVAO),r.drawArrays(r.TRIANGLES,0,6),r.bindFramebuffer(r.FRAMEBUFFER,this.bloomFB1.fbo),r.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),r.clear(r.COLOR_BUFFER_BIT),r.bindTexture(r.TEXTURE_2D,this.bloomFB2.texture),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_direction"),0,1),r.uniform2f(r.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB1.width,this.bloomFB1.height),r.drawArrays(r.TRIANGLES,0,6),r.bindFramebuffer(r.FRAMEBUFFER,null),r.viewport(0,0,n,f),r.clearColor(0,0,0,1),r.clear(r.COLOR_BUFFER_BIT),r.useProgram(this.compositeProgram),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.sceneFB.texture),r.uniform1i(r.getUniformLocation(this.compositeProgram,"u_scene"),0),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,this.bloomFB1.texture),r.uniform1i(r.getUniformLocation(this.compositeProgram,"u_bloom"),1),r.uniform1f(r.getUniformLocation(this.compositeProgram,"u_bloomIntensity"),s.bloomIntensity),r.bindVertexArray(this.screenVAO),r.drawArrays(r.TRIANGLES,0,6),r.blendFunc(r.SRC_ALPHA,r.ONE)}drawStarfield(o,t,s,a){const c=this.gl;c.blendFunc(c.SRC_ALPHA,c.ONE);let l=0;const i=this.starData.length/7,r=[.02,.05,.1];for(const n of o){if(l>=i)break;const f=r[n.layer],m=(n.x-t.x*f)*t.zoom,h=(n.y-t.y*f)*t.zoom,d=100,_=(m+s+d)%(s*2+d*2)-s-d,x=(h+a+d)%(a*2+d*2)-a-d;if(Math.abs(_)>s+10||Math.abs(x)>a+10)continue;const p=.7+.3*Math.sin(this.time*n.twinkleSpeed+n.twinklePhase),y=n.brightness*p,b=l*7;this.starData[b]=_,this.starData[b+1]=x,this.starData[b+2]=n.color[0]*y,this.starData[b+3]=n.color[1]*y,this.starData[b+4]=n.color[2]*y,this.starData[b+5]=y*.6,this.starData[b+6]=n.size,l++}l!==0&&(c.useProgram(this.starProgram),c.uniform2f(c.getUniformLocation(this.starProgram,"u_resolution"),s,a),c.bindVertexArray(this.starVAO),c.bindBuffer(c.ARRAY_BUFFER,this.starVBO),c.bufferSubData(c.ARRAY_BUFFER,0,this.starData.subarray(0,l*7)),c.drawArrays(c.POINTS,0,l))}drawGrid(o,t,s,a,c){const l=this.gl;l.blendFunc(l.SRC_ALPHA,l.ONE);const r=this.width/s/10,n=Math.pow(10,Math.floor(Math.log10(r))),f=r/n;let m;f<2?m=n:f<5?m=2*n:m=5*n;const h=o-a/s,d=o+a/s,_=t-c/s,x=t+c/s;let p=0;const y=this.gridData.length/2,b=Math.floor(h/m)*m;for(let R=b;R<=d&&p<y-2;R+=m)this.gridData[p*2]=R,this.gridData[p*2+1]=_,p++,this.gridData[p*2]=R,this.gridData[p*2+1]=x,p++;const E=Math.floor(_/m)*m;for(let R=E;R<=x&&p<y-2;R+=m)this.gridData[p*2]=h,this.gridData[p*2+1]=R,p++,this.gridData[p*2]=d,this.gridData[p*2+1]=R,p++;p!==0&&(l.useProgram(this.gridProgram),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_resolution"),a,c),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_camera"),o,t),l.uniform1f(l.getUniformLocation(this.gridProgram,"u_zoom"),s),l.bindVertexArray(this.gridVAO),l.bindBuffer(l.ARRAY_BUFFER,this.gridVBO),l.bufferSubData(l.ARRAY_BUFFER,0,this.gridData.subarray(0,p*2)),l.drawArrays(l.LINES,0,p))}drawBodies(o,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let r=0;for(const n of o){if(!n.alive)continue;if(r*7>=this.instanceData.length)break;const f=r*7;this.instanceData[f]=n.x,this.instanceData[f+1]=n.y,this.instanceData[f+2]=n.radius,this.instanceData[f+3]=n.color[0],this.instanceData[f+4]=n.color[1],this.instanceData[f+5]=n.color[2],this.instanceData[f+6]=n.mass,r++}r!==0&&(i.useProgram(this.bodyProgram),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_zoom"),a),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_time"),this.time),i.bindVertexArray(this.bodyVAO),i.bindBuffer(i.ARRAY_BUFFER,this.bodyInstanceVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.instanceData.subarray(0,r*7)),i.drawArraysInstanced(i.TRIANGLES,0,6,r))}drawTrails(o,t,s,a,c,l,i){const r=this.gl;r.blendFunc(r.SRC_ALPHA,r.ONE);let n=0;const f=this.trailData.length/6,m=Math.min(c.trailLength,200);for(const h of o)if(!(!h.alive||m<2))for(let d=0;d<m-1&&n<f-2;d++){const _=(h.trailIndex-m+d+h.trailLength)%h.trailLength,x=(h.trailIndex-m+d+1+h.trailLength)%h.trailLength,p=h.trail[_*2],y=h.trail[_*2+1],b=h.trail[x*2],E=h.trail[x*2+1];if(p===0&&y===0||b===0&&E===0)continue;const R=d/m,nt=(d+1)/m,Pt=R*R,Bt=nt*nt,I=n*6;this.trailData[I]=p,this.trailData[I+1]=y,this.trailData[I+2]=Pt,this.trailData[I+3]=h.color[0],this.trailData[I+4]=h.color[1],this.trailData[I+5]=h.color[2],n++;const Y=n*6;this.trailData[Y]=b,this.trailData[Y+1]=E,this.trailData[Y+2]=Bt,this.trailData[Y+3]=h.color[0],this.trailData[Y+4]=h.color[1],this.trailData[Y+5]=h.color[2],n++}n!==0&&(r.useProgram(this.trailProgram),r.uniform2f(r.getUniformLocation(this.trailProgram,"u_resolution"),l,i),r.uniform2f(r.getUniformLocation(this.trailProgram,"u_camera"),t,s),r.uniform1f(r.getUniformLocation(this.trailProgram,"u_zoom"),a),r.bindVertexArray(this.trailVAO),r.bindBuffer(r.ARRAY_BUFFER,this.trailVBO),r.bufferSubData(r.ARRAY_BUFFER,0,this.trailData.subarray(0,n*6)),r.drawArrays(r.LINES,0,n))}drawVectors(o,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA);let r=0;const n=this.vectorData.length/5,f=3/a;for(const m of o){if(!m.alive||r>=n-2)continue;const h=Math.sqrt(m.vx*m.vx+m.vy*m.vy);if(h<.01)continue;const d=m.x+m.vx*f,_=m.y+m.vy*f,x=Math.min(1,h/50),p=r*5;this.vectorData[p]=m.x,this.vectorData[p+1]=m.y,this.vectorData[p+2]=x,this.vectorData[p+3]=.5*(1-x),this.vectorData[p+4]=1-x,r++;const y=r*5;this.vectorData[y]=d,this.vectorData[y+1]=_,this.vectorData[y+2]=x,this.vectorData[y+3]=.5*(1-x),this.vectorData[y+4]=1-x,r++}r!==0&&(i.useProgram(this.vectorProgram),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.vectorProgram,"u_zoom"),a),i.bindVertexArray(this.vectorVAO),i.bindBuffer(i.ARRAY_BUFFER,this.vectorVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.vectorData.subarray(0,r*5)),i.drawArrays(i.LINES,0,r))}drawParticles(o,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let r=0;const n=this.pointData.length/7;for(const f of o){if(r>=n)break;const m=f.life/f.maxLife,h=r*7;this.pointData[h]=f.x,this.pointData[h+1]=f.y,this.pointData[h+2]=f.color[0],this.pointData[h+3]=f.color[1],this.pointData[h+4]=f.color[2],this.pointData[h+5]=m*m,this.pointData[h+6]=f.size*(.5+m*.5),r++}r!==0&&(i.useProgram(this.pointProgram),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.pointProgram,"u_zoom"),a),i.bindVertexArray(this.pointVAO),i.bindBuffer(i.ARRAY_BUFFER,this.pointVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.pointData.subarray(0,r*7)),i.drawArrays(i.POINTS,0,r))}drawSelectionRing(o,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE),i.useProgram(this.ringProgram),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_zoom"),a),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_center"),o.x,o.y),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_radius"),o.radius*4),i.uniform3f(i.getUniformLocation(this.ringProgram,"u_color"),o.color[0],o.color[1],o.color[2]),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_time"),this.time),i.bindVertexArray(this.ringVAO),i.drawArrays(i.TRIANGLES,0,6)}}const lt=.7;function C(e,o,t){return{cx:e,cy:o,size:t,totalMass:0,comX:0,comY:0,body:null,nw:null,ne:null,sw:null,se:null,isLeaf:!0}}function gt(e,o){if(e.totalMass===0&&e.body===null){e.body=o,e.totalMass=o.mass,e.comX=o.x,e.comY=o.y;return}if(e.size<.5){const s=e.totalMass+o.mass;e.comX=(e.comX*e.totalMass+o.x*o.mass)/s,e.comY=(e.comY*e.totalMass+o.y*o.mass)/s,e.totalMass=s;return}if(e.isLeaf&&e.body!==null){const s=e.body;e.body=null,e.isLeaf=!1;const a=e.size/2;e.nw=C(e.cx-a/2,e.cy-a/2,a),e.ne=C(e.cx+a/2,e.cy-a/2,a),e.sw=C(e.cx-a/2,e.cy+a/2,a),e.se=C(e.cx+a/2,e.cy+a/2,a),ut(e,s)}const t=e.totalMass+o.mass;e.comX=(e.comX*e.totalMass+o.x*o.mass)/t,e.comY=(e.comY*e.totalMass+o.y*o.mass)/t,e.totalMass=t,ut(e,o)}function ut(e,o){const t=o.x<e.cx,a=o.y<e.cy?t?e.nw:e.ne:t?e.sw:e.se;gt(a,o)}function U(e,o,t,s,a,c){if(e.totalMass===0)return;const l=e.comX-o.x,i=e.comY-o.y,r=l*l+i*i+t;if(e.isLeaf||e.size*e.size/r<lt*lt){if(e.body===o)return;const n=Math.sqrt(r),f=s*e.totalMass/r;a.v+=f*l/n,c.v+=f*i/n;return}e.nw&&U(e.nw,o,t,s,a,c),e.ne&&U(e.ne,o,t,s,a,c),e.sw&&U(e.sw,o,t,s,a,c),e.se&&U(e.se,o,t,s,a,c)}function jt(e){let o=1/0,t=1/0,s=-1/0,a=-1/0;for(const n of e)n.alive&&(n.x<o&&(o=n.x),n.y<t&&(t=n.y),n.x>s&&(s=n.x),n.y>a&&(a=n.y));const c=Math.max(s-o,a-t,100)*1.1,l=(o+s)/2,i=(t+a)/2,r=C(l,i,c);for(const n of e)n.alive&&gt(r,n);return r}function yt(e,o,t,s){const a=e.filter(n=>n.alive);if(a.length===0)return;const c=t*o.timeScale;if(c===0)return;const l=o.gravity*500,i=o.softening*o.softening,r=jt(a);for(const n of a){const f={v:0},m={v:0};U(r,n,i,l,f,m),n.vx+=f.v*c,n.vy+=m.v*c,n.vx*=o.damping,n.vy*=o.damping,n.x+=n.vx*c,n.y+=n.vy*c}if(o.mergeOnCollision)for(let n=0;n<a.length;n++){const f=a[n];if(f.alive)for(let m=n+1;m<a.length;m++){const h=a[m];if(!h.alive)continue;const d=f.x-h.x,_=f.y-h.y,x=d*d+_*_,p=f.radius+h.radius;if(x<p*p){const[y,b]=f.mass>=h.mass?[f,h]:[h,f],E=y.mass+b.mass;y.vx=(y.vx*y.mass+b.vx*b.mass)/E,y.vy=(y.vy*y.mass+b.vy*b.mass)/E,y.x=(y.x*y.mass+b.x*b.mass)/E,y.y=(y.y*y.mass+b.y*b.mass)/E,y.mass=E,y.radius=pt(E);const R=b.mass/E;y.color=[y.color[0]*(1-R)+b.color[0]*R,y.color[1]*(1-R)+b.color[1]*R,y.color[2]*(1-R)+b.color[2]*R],b.alive=!1,s&&s.push({x:y.x,y:y.y,mass:E,color:[...y.color]})}}}for(const n of a){if(!n.alive)continue;n.age+=c;const f=n.trailIndex*2;n.trail[f]=n.x,n.trail[f+1]=n.y,n.trailIndex=(n.trailIndex+1)%n.trailLength}}function pt(e){return Math.max(1.5,Math.pow(e,.35)*2)}let $t=0;function M(e,o,t,s,a,c,l=200){const i=c??st(a);return{x:e,y:o,vx:t,vy:s,mass:a,radius:pt(a),color:i,trail:new Float32Array(l*2),trailIndex:0,trailLength:l,id:$t++,alive:!0,age:0}}function st(e){const o=Math.min(1,Math.log10(e+1)/4);return o<.2?[.6,.7,1]:o<.4?[.9,.9,1]:o<.6?[1,.95,.7]:o<.8?[1,.7,.3]:[1,.4,.2]}function w(e,o,t,s,a,c,l=0){const i=e-t,r=o-s,n=Math.sqrt(i*i+r*r);if(n<1)return{vx:0,vy:0};const f=n*n+l*l,m=n*Math.sqrt(c*a)/Math.pow(f,.75),h=-r/n,d=i/n;return{vx:h*m,vy:d*m}}const B=500;function At(e){switch(e){case"solar-system":return mt();case"binary-stars":return Kt();case"galaxy":return Qt();case"collision":return Jt();case"asteroid-belt":return te();case"figure-eight":return ee();case"random":return oe();case"lagrange":return re();default:return mt()}}function mt(){const e=[];e.push(M(0,0,0,0,5e3,[1,.82,.3]));function a(d,_,x,p,y){const b=d.x+Math.cos(y)*_,E=d.y+Math.sin(y)*_,R=w(b,E,d.x,d.y,d.mass,B,2);e.push(M(b,E,d.vx+R.vx,d.vy+R.vy,x,p))}const c=[{au:.387,mass:.4,color:[.55,.55,.55]},{au:.723,mass:1.2,color:[.85,.75,.45]},{au:1,mass:1.5,color:[.15,.45,1]},{au:1.524,mass:.6,color:[.9,.3,.1]},{au:5.203,mass:18,color:[.8,.65,.4]},{au:9.537,mass:10,color:[.82,.72,.45]},{au:19.19,mass:4,color:[.45,.78,.88]},{au:30.07,mass:4.5,color:[.2,.3,.85]}],l=[0,.8,2.1,3.5,1.2,4.1,5.5,.5];for(let d=0;d<c.length;d++){const _=c[d],x=_.au*150,p=l[d],y=Math.cos(p)*x,b=Math.sin(p)*x,{vx:E,vy:R}=w(y,b,0,0,5e3,B,2);e.push(M(y,b,E,R,_.mass,_.color))}const i=e[3],r=e[4],n=e[5],f=e[6],m=e[7],h=e[8];return a(i,5,.12,[.75,.75,.75],.4),a(r,3,.02,[.5,.45,.4],0),a(r,5,.01,[.5,.45,.4],2.5),a(n,12,.15,[.9,.8,.3],0),a(n,18,.1,[.8,.78,.7],1.5),a(n,25,.18,[.55,.5,.45],3),a(n,38,.12,[.4,.35,.3],4.5),a(f,18,.15,[.75,.6,.25],.8),a(f,8,.03,[.9,.93,1],3.2),a(m,12,.06,[.6,.65,.7],1),a(m,18,.05,[.5,.48,.47],3.8),a(h,14,.08,[.6,.68,.75],2),{bodies:e,config:{gravity:1,timeScale:1,softening:2,trailLength:150,mergeOnCollision:!1},camera:{x:0,y:0,zoom:.4,targetZoom:.4,targetX:0,targetY:0}}}function Kt(){const e=[],s=Math.sqrt(B*2e3/400);e.push(M(-100,0,0,s,2e3,[.5,.7,1])),e.push(M(100,0,0,-s,2e3,[1,.6,.3]));for(let a=0;a<5;a++){const c=300+a*80,l=Math.random()*Math.PI*2,i=Math.cos(l)*c,r=Math.sin(l)*c,{vx:n,vy:f}=w(i,r,0,0,2e3*2,B),m=Math.random(),h=[.5+m*.5,.6,1-m*.5];e.push(M(i,r,n,f,3+Math.random()*10,h))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.6,targetZoom:.6,targetX:0,targetY:0}}}function Qt(){const e=[];e.push(M(0,0,0,0,2e4,[1,.95,.8]));const t=600;for(let s=0;s<t;s++){const a=s%2,l=s/t*4*Math.PI+a*Math.PI,i=40+s/t*600,r=i*.15,n=l+(Math.random()-.5)*.5,f=Math.cos(n)*i+(Math.random()-.5)*r,m=Math.sin(n)*i+(Math.random()-.5)*r,{vx:h,vy:d}=w(f,m,0,0,2e4,B),_=.5+Math.random()*3,x=Math.random();let p;x<.3?p=[.6,.7,1]:x<.6?p=[1,.95,.85]:x<.85?p=[1,.8,.5]:p=[1,.5,.3],e.push(M(f,m,h,d,_,p))}return{bodies:e,config:{gravity:1,timeScale:1.5,softening:15},camera:{x:0,y:0,zoom:.4,targetZoom:.4,targetX:0,targetY:0}}}function Jt(){const e=[];e.push(M(-300,-100,8,3,1e4,[.5,.7,1]));for(let t=0;t<250;t++){const s=Math.random()*Math.PI*2,a=30+Math.random()*250,c=-300+Math.cos(s)*a,l=-100+Math.sin(s)*a,{vx:i,vy:r}=w(c,l,-300,-100,1e4,B),n=[.4+Math.random()*.3,.6+Math.random()*.2,1];e.push(M(c,l,i+8,r+3,.5+Math.random()*2,n))}e.push(M(300,100,-8,-3,1e4,[1,.6,.3]));for(let t=0;t<250;t++){const s=Math.random()*Math.PI*2,a=30+Math.random()*250,c=300+Math.cos(s)*a,l=100+Math.sin(s)*a,{vx:i,vy:r}=w(c,l,300,100,1e4,B),n=[1,.5+Math.random()*.3,.2+Math.random()*.3];e.push(M(c,l,i-8,r-3,.5+Math.random()*2,n))}return{bodies:e,config:{gravity:1,timeScale:1,softening:20},camera:{x:0,y:0,zoom:.35,targetZoom:.35,targetX:0,targetY:0}}}function te(){const e=[];e.push(M(0,0,0,0,8e3,[1,.9,.5]));for(let c=0;c<3;c++){const l=80+c*60,i=Math.random()*Math.PI*2,r=Math.cos(i)*l,n=Math.sin(i)*l,{vx:f,vy:m}=w(r,n,0,0,8e3,B),h=[[.7,.7,.7],[.3,.5,1],[1,.4,.2]];e.push(M(r,n,f,m,10+Math.random()*20,h[c]))}for(let c=0;c<300;c++){const l=280+Math.random()*60,i=Math.random()*Math.PI*2,r=Math.cos(i)*l,n=Math.sin(i)*l,{vx:f,vy:m}=w(r,n,0,0,8e3,B),h=1+(Math.random()-.5)*.03,d=.4+Math.random()*.3,_=[d,d*.9,d*.8];e.push(M(r,n,f*h,m*h,.1+Math.random()*.5,_))}const t=500,{vx:s,vy:a}=w(t,0,0,0,8e3,B);return e.push(M(t,0,s,a,150,[.9,.75,.4])),{bodies:e,config:{gravity:1,timeScale:1,softening:8},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function ee(){const e=[];return e.push(M(-.97000436*150,.24308753*150,.466203685*40,.43236573*40,500,[1,.4,.4])),e.push(M(.97000436*150,-.24308753*150,.466203685*40,.43236573*40,500,[.4,1,.4])),e.push(M(0,0,-.933240737*40,-.86473146*40,500,[.4,.4,1])),{bodies:e,config:{gravity:1,timeScale:.5,softening:5,mergeOnCollision:!1},camera:{x:0,y:0,zoom:1,targetZoom:1,targetX:0,targetY:0}}}function oe(){const e=[],o=50+Math.floor(Math.random()*100);for(let t=0;t<o;t++){const s=Math.random()*Math.PI*2,a=50+Math.random()*400,c=Math.cos(s)*a,l=Math.sin(s)*a,i=Math.random()*15,r=s+Math.PI/2+(Math.random()-.5)*.5,n=Math.cos(r)*i,f=Math.sin(r)*i,m=1+Math.random()*Math.random()*500;e.push(M(c,l,n,f,m))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function re(){const e=[];e.push(M(0,0,0,0,5e3,[1,.95,.6]));const{vx:a,vy:c}=w(200,0,0,0,5e3,B);e.push(M(200,0,a,c,50,[.3,.6,1]));const l=Math.PI/3,i=Math.cos(-l)*200,r=Math.sin(-l)*200;for(let h=0;h<15;h++){const d=i+(Math.random()-.5)*30,_=r+(Math.random()-.5)*30,x=w(d,_,0,0,5e3,B);e.push(M(d,_,x.vx,x.vy,.5,[.5,1,.5]))}const n=-Math.PI/3,f=Math.cos(-n)*200,m=Math.sin(-n)*200;for(let h=0;h<15;h++){const d=f+(Math.random()-.5)*30,_=m+(Math.random()-.5)*30,x=w(d,_,0,0,5e3,B);e.push(M(d,_,x.vx,x.vy,.5,[1,.5,.5]))}return{bodies:e,config:{gravity:1,timeScale:1,softening:5},camera:{x:0,y:0,zoom:.8,targetZoom:.8,targetX:0,targetY:0}}}const ae=2e3;class se{constructor(){A(this,"particles",[])}spawnMergeExplosion(o){const t=Math.min(60,Math.floor(10+Math.sqrt(o.mass)*3));for(let s=0;s<t;s++){this.particles.length>=ae&&this.particles.shift();const a=Math.random()*Math.PI*2,c=(2+Math.random()*8)*Math.pow(o.mass,.15),l=.4+Math.random()*.8,i=Math.random(),r=[o.color[0]*(1-i)+1*i,o.color[1]*(1-i)+.9*i,o.color[2]*(1-i)+.4*i];this.particles.push({x:o.x+(Math.random()-.5)*4,y:o.y+(Math.random()-.5)*4,vx:Math.cos(a)*c,vy:Math.sin(a)*c,life:l,maxLife:l,color:r,size:.5+Math.random()*2})}}update(o){for(let t=this.particles.length-1;t>=0;t--){const s=this.particles[t];if(s.life-=o,s.life<=0){this.particles.splice(t,1);continue}s.x+=s.vx*o,s.y+=s.vy*o,s.vx*=.97,s.vy*=.97}}}const ht=[[.8,.85,1],[1,1,1],[1,.95,.85],[1,.85,.7],[1,.7,.6]];function ie(e){const o=[];for(let t=0;t<e;t++){const s=t<e*.6?0:t<e*.85?1:2,a=Math.floor(Math.random()*ht.length);o.push({x:(Math.random()-.5)*2e4,y:(Math.random()-.5)*2e4,brightness:.2+Math.random()*.8,size:s===0?.5+Math.random()*.5:s===1?.8+Math.random()*.7:1+Math.random()*1,layer:s,twinklePhase:Math.random()*Math.PI*2,twinkleSpeed:.5+Math.random()*2,color:ht[a]})}return o}let P=[],F=null;const v={x:0,y:0,zoom:.7,targetX:0,targetY:0,targetZoom:.7,shakeX:0,shakeY:0,shakeIntensity:0},g={gravity:1,timeScale:1,softening:10,damping:1,trailLength:80,bloomIntensity:.7,showTrails:!0,showVectors:!1,paused:!1,followHeaviest:!1,collisions:!1,mergeOnCollision:!1},V=document.getElementById("cosmos"),ne=new Zt(V),et=new se,ce=ie(1500),le=document.getElementById("fps-display"),ue=document.getElementById("body-count"),k=document.getElementById("hint"),_t=document.getElementById("side-panel"),D=document.getElementById("creation-indicator"),ft=document.getElementById("body-info"),me=document.getElementById("info-dot"),he=document.getElementById("info-mass"),fe=document.getElementById("info-speed"),de=document.getElementById("info-pos"),ve=document.getElementById("info-radius"),rt=document.getElementById("btn-menu"),z=document.getElementById("btn-play"),ge=document.getElementById("btn-step"),G=document.getElementById("btn-trails"),at=document.getElementById("btn-vectors"),ye=document.getElementById("btn-center"),N=document.getElementById("btn-follow"),pe=document.getElementById("btn-clear"),H=document.getElementById("gravity-slider"),Z=document.getElementById("time-slider"),j=document.getElementById("softening-slider"),$=document.getElementById("damping-slider"),K=document.getElementById("trail-slider"),Q=document.getElementById("bloom-slider"),Ae=document.getElementById("gravity-value"),_e=document.getElementById("time-value"),be=document.getElementById("softening-value"),xe=document.getElementById("damping-value"),Me=document.getElementById("trail-value"),Re=document.getElementById("bloom-value");let O=!1;function S(){Ae.textContent=parseFloat(H.value).toFixed(2),_e.textContent=parseFloat(Z.value).toFixed(2),be.textContent=j.value,xe.textContent=parseFloat($.value).toFixed(3),Me.textContent=K.value,Re.textContent=parseFloat(Q.value).toFixed(2)}function bt(){H.value=String(g.gravity),Z.value=String(g.timeScale),j.value=String(g.softening),$.value=String(g.damping),K.value=String(g.trailLength),Q.value=String(g.bloomIntensity),S()}function X(e){return Math.abs(e)>=1e4?e.toExponential(1):Math.abs(e)>=100?e.toFixed(0):Math.abs(e)>=1?e.toFixed(1):e.toFixed(2)}function Ee(){if(!F||!F.alive){F=null,ft.classList.remove("visible");return}ft.classList.add("visible");const e=F,o=Math.sqrt(e.vx*e.vx+e.vy*e.vy);me.style.background=`rgb(${Math.round(e.color[0]*255)},${Math.round(e.color[1]*255)},${Math.round(e.color[2]*255)})`,he.textContent=X(e.mass),fe.textContent=X(o),de.textContent=`${X(e.x)}, ${X(e.y)}`,ve.textContent=X(e.radius)}H.addEventListener("input",()=>{g.gravity=parseFloat(H.value),S()});Z.addEventListener("input",()=>{g.timeScale=parseFloat(Z.value),S()});j.addEventListener("input",()=>{g.softening=parseFloat(j.value),S()});$.addEventListener("input",()=>{g.damping=parseFloat($.value),S()});K.addEventListener("input",()=>{g.trailLength=parseInt(K.value),S()});Q.addEventListener("input",()=>{g.bloomIntensity=parseFloat(Q.value),S()});rt.addEventListener("click",()=>{O=!O,_t.classList.toggle("visible",O),rt.classList.toggle("active",O)});z.addEventListener("click",()=>{g.paused=!g.paused,z.textContent=g.paused?"▶":"⏸",z.classList.toggle("active",g.paused)});ge.addEventListener("click",()=>{g.paused&&yt(P,g,1/60)});G.addEventListener("click",()=>{g.showTrails=!g.showTrails,G.classList.toggle("active",g.showTrails)});G.classList.add("active");at.addEventListener("click",()=>{g.showVectors=!g.showVectors,at.classList.toggle("active",g.showVectors)});ye.addEventListener("click",()=>{g.followHeaviest=!1,N.classList.remove("active"),F=null,v.targetX=0,v.targetY=0});N.addEventListener("click",()=>{g.followHeaviest=!g.followHeaviest,N.classList.toggle("active",g.followHeaviest)});pe.addEventListener("click",()=>{P=[],F=null});document.querySelectorAll(".preset-btn").forEach(e=>{e.addEventListener("click",()=>{const o=e.dataset.preset,t=At(o);P=t.bodies,F=null,t.config&&(Object.assign(g,t.config),t.config.mergeOnCollision===void 0&&(g.mergeOnCollision=!1),bt()),t.camera&&Object.assign(v,{...t.camera,shakeX:0,shakeY:0,shakeIntensity:0})})});const u={type:"none",startX:0,startY:0,startWorldX:0,startWorldY:0,currentX:0,currentY:0,movedDistance:0};function xt(e,o){const t=Math.min(window.devicePixelRatio||1,2);return{x:(e*t-V.width/2)/v.zoom+v.x,y:(o*t-V.height/2)/v.zoom+v.y}}function it(e,o){let t=null,s=1/0;const a=15/v.zoom;for(const c of P){if(!c.alive)continue;const l=c.x-e,i=c.y-o,r=Math.sqrt(l*l+i*i),n=Math.max(c.radius*3,a);r<n&&r<s&&(t=c,s=r)}return t}V.addEventListener("mousedown",e=>{if(e.preventDefault(),e.button===2||e.button===1||e.ctrlKey||e.metaKey)u.type="pan",u.startX=e.clientX,u.startY=e.clientY,u.startWorldX=v.targetX,u.startWorldY=v.targetY;else{u.type="create",u.startX=e.clientX,u.startY=e.clientY;const o=xt(e.clientX,e.clientY);u.startWorldX=o.x,u.startWorldY=o.y,u.currentX=e.clientX,u.currentY=e.clientY,u.movedDistance=0,D.style.display="block"}});V.addEventListener("mousemove",e=>{if(u.type==="pan"){const o=Math.min(window.devicePixelRatio||1,2),t=(e.clientX-u.startX)*o/v.zoom,s=(e.clientY-u.startY)*o/v.zoom;v.targetX=u.startWorldX-t,v.targetY=u.startWorldY-s,g.followHeaviest=!1,N.classList.remove("active")}else if(u.type==="create"){u.currentX=e.clientX,u.currentY=e.clientY;const o=u.currentX-u.startX,t=u.currentY-u.startY;u.movedDistance=Math.sqrt(o*o+t*t),Et(o,t)}});V.addEventListener("mouseup",()=>{if(u.type==="create"){const e=u.currentX-u.startX,o=u.currentY-u.startY,t=Math.sqrt(e*e+o*o);if(t<5)F=it(u.startWorldX,u.startWorldY);else{const s=Math.max(1,t*2),a=Math.min(window.devicePixelRatio||1,2),c=.3/v.zoom*a;P.push(M(u.startWorldX,u.startWorldY,-e*c,-o*c,s,st(s))),k.style.opacity="0"}D.style.display="none",D.querySelector(".arrow").style.display="none"}u.type="none"});V.addEventListener("wheel",e=>{e.preventDefault(),v.targetZoom=Math.max(.01,Math.min(20,v.targetZoom*(e.deltaY>0?.9:1.1)))},{passive:!1});V.addEventListener("contextmenu",e=>e.preventDefault());let Mt=0,Rt=0,L=null;V.addEventListener("touchstart",e=>{if(e.preventDefault(),e.touches.length===1){u.type="create",u.startX=e.touches[0].clientX,u.startY=e.touches[0].clientY;const o=xt(u.startX,u.startY);u.startWorldX=o.x,u.startWorldY=o.y,u.currentX=u.startX,u.currentY=u.startY,u.movedDistance=0,L=window.setTimeout(()=>{if(u.movedDistance<10){const t=it(u.startWorldX,u.startWorldY);t&&(F=t,u.type="none",D.style.display="none")}L=null},300),D.style.display="block"}else if(e.touches.length===2){L&&(clearTimeout(L),L=null),u.type="pan";const o=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY;Mt=Math.sqrt(o*o+t*t),Rt=v.targetZoom,u.startX=(e.touches[0].clientX+e.touches[1].clientX)/2,u.startY=(e.touches[0].clientY+e.touches[1].clientY)/2,u.startWorldX=v.targetX,u.startWorldY=v.targetY,D.style.display="none"}},{passive:!1});V.addEventListener("touchmove",e=>{if(e.preventDefault(),e.touches.length===1&&u.type==="create"){u.currentX=e.touches[0].clientX,u.currentY=e.touches[0].clientY;const o=u.currentX-u.startX,t=u.currentY-u.startY;u.movedDistance=Math.sqrt(o*o+t*t),u.movedDistance>10&&L&&(clearTimeout(L),L=null),Et(o,t)}else if(e.touches.length===2&&u.type==="pan"){const o=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY,s=Math.sqrt(o*o+t*t);v.targetZoom=Math.max(.01,Math.min(20,Rt*(s/Mt)));const a=(e.touches[0].clientX+e.touches[1].clientX)/2,c=(e.touches[0].clientY+e.touches[1].clientY)/2,l=Math.min(window.devicePixelRatio||1,2);v.targetX=u.startWorldX-(a-u.startX)*l/v.zoom,v.targetY=u.startWorldY-(c-u.startY)*l/v.zoom}},{passive:!1});V.addEventListener("touchend",e=>{if(L&&(clearTimeout(L),L=null),u.type==="create"&&e.touches.length===0){const o=u.currentX-u.startX,t=u.currentY-u.startY,s=Math.sqrt(o*o+t*t);if(s<10)F=it(u.startWorldX,u.startWorldY);else{const a=Math.max(1,s*2),c=Math.min(window.devicePixelRatio||1,2),l=.3/v.zoom*c;P.push(M(u.startWorldX,u.startWorldY,-o*l,-t*l,a,st(a))),k.style.opacity="0"}D.style.display="none"}e.touches.length===0&&(u.type="none")});function Et(e,o){const t=Math.sqrt(e*e+o*o),s=Math.max(1,t*2),a=Math.max(20,Math.min(60,Math.pow(s,.35)*8));D.style.left=`${u.startX}px`,D.style.top=`${u.startY}px`;const c=D.querySelector(".ring");c.style.width=`${a}px`,c.style.height=`${a}px`;const l=D.querySelector(".mass-label");if(l.textContent=t>5?`m=${X(s)}`:"",t>5){const i=D.querySelector(".arrow");i.style.width=`${t}px`,i.style.transform=`rotate(${Math.atan2(o,e)}rad)`,i.style.display="block"}}document.addEventListener("keydown",e=>{switch(e.key){case" ":e.preventDefault(),g.paused=!g.paused,z.textContent=g.paused?"▶":"⏸",z.classList.toggle("active",g.paused);break;case"t":g.showTrails=!g.showTrails,G.classList.toggle("active",g.showTrails);break;case"v":g.showVectors=!g.showVectors,at.classList.toggle("active",g.showVectors);break;case"c":v.targetX=0,v.targetY=0;break;case"f":g.followHeaviest=!g.followHeaviest,N.classList.toggle("active",g.followHeaviest);break;case"Escape":F=null;break;case"Backspace":case"Delete":P=[],F=null;break;case"Tab":e.preventDefault(),O=!O,_t.classList.toggle("visible",O),rt.classList.toggle("active",O);break}});let dt=0,ot=0,q=0,vt=60;function Ft(e){requestAnimationFrame(Ft);const o=Math.min((e-dt)/1e3,.05);dt=e,ot++,q+=o,q>=.5&&(vt=Math.round(ot/q),q=0,ot=0);const t=1-Math.pow(.001,o);if(v.x+=(v.targetX-v.x)*t,v.y+=(v.targetY-v.y)*t,v.zoom+=(v.targetZoom-v.zoom)*t,v.shakeIntensity>.01?(v.shakeX=(Math.random()-.5)*v.shakeIntensity,v.shakeY=(Math.random()-.5)*v.shakeIntensity,v.shakeIntensity*=Math.pow(.02,o)):(v.shakeX=0,v.shakeY=0,v.shakeIntensity=0),g.followHeaviest){let s=null,a=0;for(const c of P)c.alive&&c.mass>a&&(a=c.mass,s=c);s&&(v.targetX=s.x,v.targetY=s.y)}if(!g.paused){const s=[],a=Math.max(1,Math.ceil(g.timeScale)),c=o/a;for(let l=0;l<a;l++)yt(P,g,c,s);for(const l of s)et.spawnMergeExplosion(l),v.shakeIntensity=Math.min(15,v.shakeIntensity+Math.sqrt(l.mass)*.3)}et.update(o),P=P.filter(s=>s.alive),F&&!F.alive&&(F=null),ne.render(P,v,g,et.particles,ce,F,o),le.textContent=`${vt} FPS`,ue.textContent=`${P.length} bod${P.length===1?"y":"ies"}`,Ee()}const Fe=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);Fe&&(k.textContent="Tap & drag to create — Pinch to zoom — Two fingers to pan");const W=At("solar-system");P=W.bodies;W.config&&Object.assign(g,W.config);W.camera&&Object.assign(v,{...W.camera,shakeX:0,shakeY:0,shakeIntensity:0});bt();requestAnimationFrame(Ft);setTimeout(()=>{k.style.opacity!=="0"&&(k.style.opacity="0")},6e3);
