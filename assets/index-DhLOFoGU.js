var Pt=Object.defineProperty;var Bt=(e,r,t)=>r in e?Pt(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var y=(e,r,t)=>Bt(e,typeof r!="symbol"?r+"":r,t);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const c of a)if(c.type==="childList")for(const l of c.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function t(a){const c={};return a.integrity&&(c.integrity=a.integrity),a.referrerPolicy&&(c.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?c.credentials="include":a.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function s(a){if(a.ep)return;a.ep=!0;const c=t(a);fetch(a.href,c)}})();const Dt=`#version 300 es
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
}`,Lt=`#version 300 es
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
}`,wt=`#version 300 es
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
}`,Vt=`#version 300 es
precision highp float;

in float v_alpha;
in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color * 0.7, v_alpha * 0.5);
}`,ot=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,Tt=`#version 300 es
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
}`,Ot=`#version 300 es
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
}`,St=`#version 300 es
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
}`,It=`#version 300 es
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
}`,Yt=`#version 300 es
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
}`,Ct=`#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  float dist = length(gl_PointCoord - 0.5) * 2.0;
  float alpha = exp(-dist * dist * 3.0);
  fragColor = vec4(v_color.rgb, v_color.a * alpha);
}`,Xt=`#version 300 es
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
}`,zt=`#version 300 es
precision highp float;

in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 0.6);
}`,kt=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

void main() {
  vec2 screenPos = (a_position - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}`,Nt=`#version 300 es
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
}`,Wt=`#version 300 es
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
}`;function ct(e,r,t){const s=e.createShader(r);if(e.shaderSource(s,t),e.compileShader(s),!e.getShaderParameter(s,e.COMPILE_STATUS))throw console.error("Shader compile error:",e.getShaderInfoLog(s)),e.deleteShader(s),new Error("Shader compilation failed");return s}function T(e,r,t){const s=ct(e,e.VERTEX_SHADER,r),a=ct(e,e.FRAGMENT_SHADER,t),c=e.createProgram();if(e.attachShader(c,s),e.attachShader(c,a),e.linkProgram(c),!e.getProgramParameter(c,e.LINK_STATUS))throw console.error("Program link error:",e.getProgramInfoLog(c)),new Error("Program linking failed");return c}function rt(e,r,t){const s=e.createFramebuffer(),a=e.createTexture();return e.bindTexture(e.TEXTURE_2D,a),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,r,t,0,e.RGBA,e.FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{fbo:s,texture:a,width:r,height:t}}class qt{constructor(r){y(this,"gl");y(this,"canvas");y(this,"width",0);y(this,"height",0);y(this,"time",0);y(this,"bodyProgram");y(this,"trailProgram");y(this,"bloomExtractProgram");y(this,"blurProgram");y(this,"compositeProgram");y(this,"vectorProgram");y(this,"gridProgram");y(this,"pointProgram");y(this,"starProgram");y(this,"ringProgram");y(this,"quadVBO");y(this,"bodyInstanceVBO");y(this,"bodyVAO");y(this,"trailVBO");y(this,"trailVAO");y(this,"screenVBO");y(this,"screenVAO");y(this,"vectorVBO");y(this,"vectorVAO");y(this,"gridVBO");y(this,"gridVAO");y(this,"pointVBO");y(this,"pointVAO");y(this,"starVBO");y(this,"starVAO");y(this,"ringVAO");y(this,"sceneFB");y(this,"bloomFB1");y(this,"bloomFB2");y(this,"instanceData");y(this,"trailData");y(this,"vectorData");y(this,"gridData");y(this,"pointData");y(this,"starData");this.canvas=r;const t=r.getContext("webgl2",{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t)throw new Error("WebGL2 not supported");t.getExtension("EXT_color_buffer_float"),this.gl=t,this.bodyProgram=T(t,Dt,Lt),this.trailProgram=T(t,wt,Vt),this.bloomExtractProgram=T(t,ot,Tt),this.blurProgram=T(t,ot,Ot),this.compositeProgram=T(t,ot,St),this.vectorProgram=T(t,Xt,zt),this.gridProgram=T(t,kt,Nt),this.pointProgram=T(t,It,Yt),this.starProgram=T(t,Ut,Ct),this.ringProgram=T(t,Gt,Wt);const s=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.quadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.bufferData(t.ARRAY_BUFFER,s,t.STATIC_DRAW),this.bodyInstanceVBO=t.createBuffer(),this.instanceData=new Float32Array(1e4*7),this.bodyVAO=t.createVertexArray(),t.bindVertexArray(this.bodyVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.bodyInstanceVBO),t.bufferData(t.ARRAY_BUFFER,this.instanceData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,2,t.FLOAT,!1,28,0),t.vertexAttribDivisor(1,1),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,8),t.vertexAttribDivisor(2,1),t.enableVertexAttribArray(3),t.vertexAttribPointer(3,3,t.FLOAT,!1,28,12),t.vertexAttribDivisor(3,1),t.enableVertexAttribArray(4),t.vertexAttribPointer(4,1,t.FLOAT,!1,28,24),t.vertexAttribDivisor(4,1),t.bindVertexArray(null),this.trailData=new Float32Array(2e5*6),this.trailVBO=t.createBuffer(),this.trailVAO=t.createVertexArray(),t.bindVertexArray(this.trailVAO),t.bindBuffer(t.ARRAY_BUFFER,this.trailVBO),t.bufferData(t.ARRAY_BUFFER,this.trailData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,24,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,1,t.FLOAT,!1,24,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,3,t.FLOAT,!1,24,12),t.bindVertexArray(null);const a=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.screenVBO=t.createBuffer(),this.screenVAO=t.createVertexArray(),t.bindVertexArray(this.screenVAO),t.bindBuffer(t.ARRAY_BUFFER,this.screenVBO),t.bufferData(t.ARRAY_BUFFER,a,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.vectorData=new Float32Array(1e4*10),this.vectorVBO=t.createBuffer(),this.vectorVAO=t.createVertexArray(),t.bindVertexArray(this.vectorVAO),t.bindBuffer(t.ARRAY_BUFFER,this.vectorVBO),t.bufferData(t.ARRAY_BUFFER,this.vectorData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,20,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,20,8),t.bindVertexArray(null),this.gridData=new Float32Array(4e3),this.gridVBO=t.createBuffer(),this.gridVAO=t.createVertexArray(),t.bindVertexArray(this.gridVAO),t.bindBuffer(t.ARRAY_BUFFER,this.gridVBO),t.bufferData(t.ARRAY_BUFFER,this.gridData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.pointData=new Float32Array(2e3*7),this.pointVBO=t.createBuffer(),this.pointVAO=t.createVertexArray(),t.bindVertexArray(this.pointVAO),t.bindBuffer(t.ARRAY_BUFFER,this.pointVBO),t.bufferData(t.ARRAY_BUFFER,this.pointData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.starData=new Float32Array(3e3*7),this.starVBO=t.createBuffer(),this.starVAO=t.createVertexArray(),t.bindVertexArray(this.starVAO),t.bindBuffer(t.ARRAY_BUFFER,this.starVBO),t.bufferData(t.ARRAY_BUFFER,this.starData,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,28,8),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindVertexArray(null),this.ringVAO=t.createVertexArray(),t.bindVertexArray(this.ringVAO),t.bindBuffer(t.ARRAY_BUFFER,this.quadVBO),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE),this.resize()}resize(){const r=Math.min(window.devicePixelRatio||1,2),t=Math.floor(this.canvas.clientWidth*r),s=Math.floor(this.canvas.clientHeight*r);if(t===this.width&&s===this.height)return;this.width=t,this.height=s,this.canvas.width=t,this.canvas.height=s;const a=this.gl;this.sceneFB=rt(a,t,s),this.bloomFB1=rt(a,Math.floor(t/2),Math.floor(s/2)),this.bloomFB2=rt(a,Math.floor(t/2),Math.floor(s/2))}render(r,t,s,a,c,l,i){const o=this.gl;this.resize(),this.time+=i;const n=this.width,h=this.height,u=n/2,m=h/2,p=t.x+t.shakeX,b=t.y+t.shakeY;o.bindFramebuffer(o.FRAMEBUFFER,this.sceneFB.fbo),o.viewport(0,0,n,h),o.clearColor(0,0,.015,1),o.clear(o.COLOR_BUFFER_BIT),this.drawStarfield(c,t,u,m),this.drawGrid(p,b,t.zoom,u,m),s.showTrails&&this.drawTrails(r,p,b,t.zoom,s,u,m),s.showVectors&&this.drawVectors(r,p,b,t.zoom,u,m),a.length>0&&this.drawParticles(a,p,b,t.zoom,u,m),this.drawBodies(r,p,b,t.zoom,u,m),l&&l.alive&&this.drawSelectionRing(l,p,b,t.zoom,u,m),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB1.fbo),o.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT),o.blendFunc(o.ONE,o.ZERO),o.useProgram(this.bloomExtractProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.sceneFB.texture),o.uniform1i(o.getUniformLocation(this.bloomExtractProgram,"u_texture"),0),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.useProgram(this.blurProgram),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB2.fbo),o.viewport(0,0,this.bloomFB2.width,this.bloomFB2.height),o.clear(o.COLOR_BUFFER_BIT),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.bloomFB1.texture),o.uniform1i(o.getUniformLocation(this.blurProgram,"u_texture"),0),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_direction"),1,0),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB2.width,this.bloomFB2.height),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB1.fbo),o.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),o.clear(o.COLOR_BUFFER_BIT),o.bindTexture(o.TEXTURE_2D,this.bloomFB2.texture),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_direction"),0,1),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB1.width,this.bloomFB1.height),o.drawArrays(o.TRIANGLES,0,6),o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,n,h),o.clearColor(0,0,0,1),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(this.compositeProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.sceneFB.texture),o.uniform1i(o.getUniformLocation(this.compositeProgram,"u_scene"),0),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,this.bloomFB1.texture),o.uniform1i(o.getUniformLocation(this.compositeProgram,"u_bloom"),1),o.uniform1f(o.getUniformLocation(this.compositeProgram,"u_bloomIntensity"),s.bloomIntensity),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.blendFunc(o.SRC_ALPHA,o.ONE)}drawStarfield(r,t,s,a){const c=this.gl;c.blendFunc(c.SRC_ALPHA,c.ONE);let l=0;const i=this.starData.length/7,o=[.02,.05,.1];for(const n of r){if(l>=i)break;const h=o[n.layer],u=(n.x-t.x*h)*t.zoom,m=(n.y-t.y*h)*t.zoom,p=100,b=(u+s+p)%(s*2+p*2)-s-p,x=(m+a+p)%(a*2+p*2)-a-p;if(Math.abs(b)>s+10||Math.abs(x)>a+10)continue;const _=.7+.3*Math.sin(this.time*n.twinkleSpeed+n.twinklePhase),A=n.brightness*_,d=l*7;this.starData[d]=b,this.starData[d+1]=x,this.starData[d+2]=n.color[0]*A,this.starData[d+3]=n.color[1]*A,this.starData[d+4]=n.color[2]*A,this.starData[d+5]=A*.6,this.starData[d+6]=n.size,l++}l!==0&&(c.useProgram(this.starProgram),c.uniform2f(c.getUniformLocation(this.starProgram,"u_resolution"),s,a),c.bindVertexArray(this.starVAO),c.bindBuffer(c.ARRAY_BUFFER,this.starVBO),c.bufferSubData(c.ARRAY_BUFFER,0,this.starData.subarray(0,l*7)),c.drawArrays(c.POINTS,0,l))}drawGrid(r,t,s,a,c){const l=this.gl;l.blendFunc(l.SRC_ALPHA,l.ONE);const o=this.width/s/10,n=Math.pow(10,Math.floor(Math.log10(o))),h=o/n;let u;h<2?u=n:h<5?u=2*n:u=5*n;const m=r-a/s,p=r+a/s,b=t-c/s,x=t+c/s;let _=0;const A=this.gridData.length/2,d=Math.floor(m/u)*u;for(let M=d;M<=p&&_<A-2;M+=u)this.gridData[_*2]=M,this.gridData[_*2+1]=b,_++,this.gridData[_*2]=M,this.gridData[_*2+1]=x,_++;const E=Math.floor(b/u)*u;for(let M=E;M<=x&&_<A-2;M+=u)this.gridData[_*2]=m,this.gridData[_*2+1]=M,_++,this.gridData[_*2]=p,this.gridData[_*2+1]=M,_++;_!==0&&(l.useProgram(this.gridProgram),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_resolution"),a,c),l.uniform2f(l.getUniformLocation(this.gridProgram,"u_camera"),r,t),l.uniform1f(l.getUniformLocation(this.gridProgram,"u_zoom"),s),l.bindVertexArray(this.gridVAO),l.bindBuffer(l.ARRAY_BUFFER,this.gridVBO),l.bufferSubData(l.ARRAY_BUFFER,0,this.gridData.subarray(0,_*2)),l.drawArrays(l.LINES,0,_))}drawBodies(r,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let o=0;for(const n of r){if(!n.alive)continue;if(o*7>=this.instanceData.length)break;const h=o*7;this.instanceData[h]=n.x,this.instanceData[h+1]=n.y,this.instanceData[h+2]=n.radius,this.instanceData[h+3]=n.color[0],this.instanceData[h+4]=n.color[1],this.instanceData[h+5]=n.color[2],this.instanceData[h+6]=n.mass,o++}o!==0&&(i.useProgram(this.bodyProgram),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.bodyProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_zoom"),a),i.uniform1f(i.getUniformLocation(this.bodyProgram,"u_time"),this.time),i.bindVertexArray(this.bodyVAO),i.bindBuffer(i.ARRAY_BUFFER,this.bodyInstanceVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.instanceData.subarray(0,o*7)),i.drawArraysInstanced(i.TRIANGLES,0,6,o))}drawTrails(r,t,s,a,c,l,i){const o=this.gl;o.blendFunc(o.SRC_ALPHA,o.ONE);let n=0;const h=this.trailData.length/6,u=Math.min(c.trailLength,200);for(const m of r)if(!(!m.alive||u<2))for(let p=0;p<u-1&&n<h-2;p++){const b=(m.trailIndex-u+p+m.trailLength)%m.trailLength,x=(m.trailIndex-u+p+1+m.trailLength)%m.trailLength,_=m.trail[b*2],A=m.trail[b*2+1],d=m.trail[x*2],E=m.trail[x*2+1];if(_===0&&A===0||d===0&&E===0)continue;const M=p/u,Y=(p+1)/u,U=M*M,C=Y*Y,D=n*6;this.trailData[D]=_,this.trailData[D+1]=A,this.trailData[D+2]=U,this.trailData[D+3]=m.color[0],this.trailData[D+4]=m.color[1],this.trailData[D+5]=m.color[2],n++;const L=n*6;this.trailData[L]=d,this.trailData[L+1]=E,this.trailData[L+2]=C,this.trailData[L+3]=m.color[0],this.trailData[L+4]=m.color[1],this.trailData[L+5]=m.color[2],n++}n!==0&&(o.useProgram(this.trailProgram),o.uniform2f(o.getUniformLocation(this.trailProgram,"u_resolution"),l,i),o.uniform2f(o.getUniformLocation(this.trailProgram,"u_camera"),t,s),o.uniform1f(o.getUniformLocation(this.trailProgram,"u_zoom"),a),o.bindVertexArray(this.trailVAO),o.bindBuffer(o.ARRAY_BUFFER,this.trailVBO),o.bufferSubData(o.ARRAY_BUFFER,0,this.trailData.subarray(0,n*6)),o.drawArrays(o.LINES,0,n))}drawVectors(r,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA);let o=0;const n=this.vectorData.length/5,h=3/a;for(const u of r){if(!u.alive||o>=n-2)continue;const m=Math.sqrt(u.vx*u.vx+u.vy*u.vy);if(m<.01)continue;const p=u.x+u.vx*h,b=u.y+u.vy*h,x=Math.min(1,m/50),_=o*5;this.vectorData[_]=u.x,this.vectorData[_+1]=u.y,this.vectorData[_+2]=x,this.vectorData[_+3]=.5*(1-x),this.vectorData[_+4]=1-x,o++;const A=o*5;this.vectorData[A]=p,this.vectorData[A+1]=b,this.vectorData[A+2]=x,this.vectorData[A+3]=.5*(1-x),this.vectorData[A+4]=1-x,o++}o!==0&&(i.useProgram(this.vectorProgram),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.vectorProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.vectorProgram,"u_zoom"),a),i.bindVertexArray(this.vectorVAO),i.bindBuffer(i.ARRAY_BUFFER,this.vectorVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.vectorData.subarray(0,o*5)),i.drawArrays(i.LINES,0,o))}drawParticles(r,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let o=0;const n=this.pointData.length/7;for(const h of r){if(o>=n)break;const u=h.life/h.maxLife,m=o*7;this.pointData[m]=h.x,this.pointData[m+1]=h.y,this.pointData[m+2]=h.color[0],this.pointData[m+3]=h.color[1],this.pointData[m+4]=h.color[2],this.pointData[m+5]=u*u,this.pointData[m+6]=h.size*(.5+u*.5),o++}o!==0&&(i.useProgram(this.pointProgram),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.pointProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.pointProgram,"u_zoom"),a),i.bindVertexArray(this.pointVAO),i.bindBuffer(i.ARRAY_BUFFER,this.pointVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.pointData.subarray(0,o*7)),i.drawArrays(i.POINTS,0,o))}drawSelectionRing(r,t,s,a,c,l){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE),i.useProgram(this.ringProgram),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_resolution"),c,l),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_camera"),t,s),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_zoom"),a),i.uniform2f(i.getUniformLocation(this.ringProgram,"u_center"),r.x,r.y),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_radius"),r.radius*4),i.uniform3f(i.getUniformLocation(this.ringProgram,"u_color"),r.color[0],r.color[1],r.color[2]),i.uniform1f(i.getUniformLocation(this.ringProgram,"u_time"),this.time),i.bindVertexArray(this.ringVAO),i.drawArrays(i.TRIANGLES,0,6)}}const lt=.7;function N(e,r,t){return{cx:e,cy:r,size:t,totalMass:0,comX:0,comY:0,body:null,nw:null,ne:null,sw:null,se:null,isLeaf:!0}}function gt(e,r){if(e.totalMass===0&&e.body===null){e.body=r,e.totalMass=r.mass,e.comX=r.x,e.comY=r.y;return}if(e.size<.5){const s=e.totalMass+r.mass;e.comX=(e.comX*e.totalMass+r.x*r.mass)/s,e.comY=(e.comY*e.totalMass+r.y*r.mass)/s,e.totalMass=s;return}if(e.isLeaf&&e.body!==null){const s=e.body;e.body=null,e.isLeaf=!1;const a=e.size/2;e.nw=N(e.cx-a/2,e.cy-a/2,a),e.ne=N(e.cx+a/2,e.cy-a/2,a),e.sw=N(e.cx-a/2,e.cy+a/2,a),e.se=N(e.cx+a/2,e.cy+a/2,a),ut(e,s)}const t=e.totalMass+r.mass;e.comX=(e.comX*e.totalMass+r.x*r.mass)/t,e.comY=(e.comY*e.totalMass+r.y*r.mass)/t,e.totalMass=t,ut(e,r)}function ut(e,r){const t=r.x<e.cx,a=r.y<e.cy?t?e.nw:e.ne:t?e.sw:e.se;gt(a,r)}function G(e,r,t,s,a,c){if(e.totalMass===0)return;const l=e.comX-r.x,i=e.comY-r.y,o=l*l+i*i+t;if(e.isLeaf||e.size*e.size/o<lt*lt){if(e.body===r)return;const n=Math.sqrt(o),h=s*e.totalMass/o;a.v+=h*l/n,c.v+=h*i/n;return}e.nw&&G(e.nw,r,t,s,a,c),e.ne&&G(e.ne,r,t,s,a,c),e.sw&&G(e.sw,r,t,s,a,c),e.se&&G(e.se,r,t,s,a,c)}function Ht(e){let r=1/0,t=1/0,s=-1/0,a=-1/0;for(const n of e)n.alive&&(n.x<r&&(r=n.x),n.y<t&&(t=n.y),n.x>s&&(s=n.x),n.y>a&&(a=n.y));const c=Math.max(s-r,a-t,100)*1.1,l=(r+s)/2,i=(t+a)/2,o=N(l,i,c);for(const n of e)n.alive&&gt(o,n);return o}function Zt(e,r,t,s){const a=e.filter(n=>n.alive);if(a.length===0)return;const c=t*r.timeScale;if(c===0)return;const l=r.gravity*500,i=r.softening*r.softening,o=Ht(a);for(const n of a){const h={v:0},u={v:0};G(o,n,i,l,h,u),n.vx+=h.v*c,n.vy+=u.v*c,n.vx*=r.damping,n.vy*=r.damping,n.x+=n.vx*c,n.y+=n.vy*c}if(r.mergeOnCollision)for(let n=0;n<a.length;n++){const h=a[n];if(h.alive)for(let u=n+1;u<a.length;u++){const m=a[u];if(!m.alive)continue;const p=h.x-m.x,b=h.y-m.y,x=p*p+b*b,_=h.radius+m.radius;if(x<_*_){const[A,d]=h.mass>=m.mass?[h,m]:[m,h],E=A.mass+d.mass;A.vx=(A.vx*A.mass+d.vx*d.mass)/E,A.vy=(A.vy*A.mass+d.vy*d.mass)/E,A.x=(A.x*A.mass+d.x*d.mass)/E,A.y=(A.y*A.mass+d.y*d.mass)/E,A.mass=E,A.radius=pt(E);const M=d.mass/E;A.color=[A.color[0]*(1-M)+d.color[0]*M,A.color[1]*(1-M)+d.color[1]*M,A.color[2]*(1-M)+d.color[2]*M],d.alive=!1,s&&s.push({x:A.x,y:A.y,mass:E,color:[...A.color]})}}}for(const n of a){if(!n.alive)continue;n.age+=c;const h=n.trailIndex*2;n.trail[h]=n.x,n.trail[h+1]=n.y,n.trailIndex=(n.trailIndex+1)%n.trailLength}}function pt(e){return Math.max(1.5,Math.pow(e,.35)*2)}let jt=0;function R(e,r,t,s,a,c,l=200){const i=c??$t(a);return{x:e,y:r,vx:t,vy:s,mass:a,radius:pt(a),color:i,trail:new Float32Array(l*2),trailIndex:0,trailLength:l,id:jt++,alive:!0,age:0}}function $t(e){const r=Math.min(1,Math.log10(e+1)/4);return r<.2?[.6,.7,1]:r<.4?[.9,.9,1]:r<.6?[1,.95,.7]:r<.8?[1,.7,.3]:[1,.4,.2]}function B(e,r,t,s,a,c,l=0){const i=e-t,o=r-s,n=Math.sqrt(i*i+o*o);if(n<1)return{vx:0,vy:0};const h=n*n+l*l,u=n*Math.sqrt(c*a)/Math.pow(h,.75),m=-o/n,p=i/n;return{vx:m*u,vy:p*u}}const P=500;function yt(e){switch(e){case"solar-system":return mt();case"binary-stars":return Kt();case"galaxy":return Qt();case"collision":return Jt();case"asteroid-belt":return te();case"figure-eight":return ee();case"random":return oe();case"lagrange":return re();default:return mt()}}function mt(){const e=[];e.push(R(0,0,0,0,5e3,[1,.82,.3]));function a(d,E,M,Y,U){const C=d.x+Math.cos(U)*E,D=d.y+Math.sin(U)*E,L=B(C,D,d.x,d.y,d.mass,P,1);e.push(R(C,D,d.vx+L.vx,d.vy+L.vy,M,Y))}const c=[{au:.387,mass:1,color:[.55,.55,.55]},{au:.723,mass:3,color:[.85,.75,.45]},{au:1,mass:6,color:[.15,.45,1]},{au:1.524,mass:2.5,color:[.9,.3,.1]},{au:5.203,mass:40,color:[.8,.65,.4]},{au:9.537,mass:25,color:[.82,.72,.45]},{au:19.19,mass:12,color:[.45,.78,.88]},{au:30.07,mass:15,color:[.2,.3,.85]}],l=[0,.8,2.1,3.5,1.2,4.1,5.5,.5];for(let d=0;d<c.length;d++){const E=c[d],M=E.au*150,Y=l[d],U=Math.cos(Y)*M,C=Math.sin(Y)*M,{vx:D,vy:L}=B(U,C,0,0,5e3,P,1);e.push(R(U,C,D,L,E.mass,E.color))}const i=e[3],o=e[4],n=e[5],h=e[6],u=e[7],m=e[8];a(i,8,.5,[.75,.75,.75],.4),a(o,6,.15,[.5,.45,.4],0),a(o,10,.1,[.5,.45,.4],2.5),a(n,20,.8,[.9,.8,.3],0),a(n,30,.6,[.8,.78,.7],1.5),a(n,42,1,[.55,.5,.45],3),a(n,58,.7,[.4,.35,.3],4.5),a(h,28,.8,[.75,.6,.25],.8),a(h,15,.3,[.9,.93,1],3.2),a(u,20,.4,[.6,.65,.7],1),a(u,32,.35,[.5,.48,.47],3.8),a(m,25,.5,[.6,.68,.75],2);let p=0,b=0,x=0;for(const d of e)p+=d.mass*d.vx,b+=d.mass*d.vy,x+=d.mass;const _=p/x,A=b/x;for(const d of e)d.vx-=_,d.vy-=A;return{bodies:e,config:{gravity:1,timeScale:1,softening:1,trailLength:150,mergeOnCollision:!1},camera:{x:0,y:0,zoom:.35,targetZoom:.35,targetX:0,targetY:0}}}function Kt(){const e=[],s=Math.sqrt(P*2e3/400);e.push(R(-100,0,0,s,2e3,[.5,.7,1])),e.push(R(100,0,0,-s,2e3,[1,.6,.3]));for(let a=0;a<5;a++){const c=300+a*80,l=Math.random()*Math.PI*2,i=Math.cos(l)*c,o=Math.sin(l)*c,{vx:n,vy:h}=B(i,o,0,0,2e3*2,P),u=Math.random(),m=[.5+u*.5,.6,1-u*.5];e.push(R(i,o,n,h,3+Math.random()*10,m))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.6,targetZoom:.6,targetX:0,targetY:0}}}function Qt(){const e=[];e.push(R(0,0,0,0,2e4,[1,.95,.8]));const t=600;for(let s=0;s<t;s++){const a=s%2,l=s/t*4*Math.PI+a*Math.PI,i=40+s/t*600,o=i*.15,n=l+(Math.random()-.5)*.5,h=Math.cos(n)*i+(Math.random()-.5)*o,u=Math.sin(n)*i+(Math.random()-.5)*o,{vx:m,vy:p}=B(h,u,0,0,2e4,P),b=.5+Math.random()*3,x=Math.random();let _;x<.3?_=[.6,.7,1]:x<.6?_=[1,.95,.85]:x<.85?_=[1,.8,.5]:_=[1,.5,.3],e.push(R(h,u,m,p,b,_))}return{bodies:e,config:{gravity:1,timeScale:1.5,softening:15},camera:{x:0,y:0,zoom:.4,targetZoom:.4,targetX:0,targetY:0}}}function Jt(){const e=[];e.push(R(-300,-100,8,3,1e4,[.5,.7,1]));for(let t=0;t<250;t++){const s=Math.random()*Math.PI*2,a=30+Math.random()*250,c=-300+Math.cos(s)*a,l=-100+Math.sin(s)*a,{vx:i,vy:o}=B(c,l,-300,-100,1e4,P),n=[.4+Math.random()*.3,.6+Math.random()*.2,1];e.push(R(c,l,i+8,o+3,.5+Math.random()*2,n))}e.push(R(300,100,-8,-3,1e4,[1,.6,.3]));for(let t=0;t<250;t++){const s=Math.random()*Math.PI*2,a=30+Math.random()*250,c=300+Math.cos(s)*a,l=100+Math.sin(s)*a,{vx:i,vy:o}=B(c,l,300,100,1e4,P),n=[1,.5+Math.random()*.3,.2+Math.random()*.3];e.push(R(c,l,i-8,o-3,.5+Math.random()*2,n))}return{bodies:e,config:{gravity:1,timeScale:1,softening:20},camera:{x:0,y:0,zoom:.35,targetZoom:.35,targetX:0,targetY:0}}}function te(){const e=[];e.push(R(0,0,0,0,8e3,[1,.9,.5]));for(let c=0;c<3;c++){const l=80+c*60,i=Math.random()*Math.PI*2,o=Math.cos(i)*l,n=Math.sin(i)*l,{vx:h,vy:u}=B(o,n,0,0,8e3,P),m=[[.7,.7,.7],[.3,.5,1],[1,.4,.2]];e.push(R(o,n,h,u,10+Math.random()*20,m[c]))}for(let c=0;c<300;c++){const l=280+Math.random()*60,i=Math.random()*Math.PI*2,o=Math.cos(i)*l,n=Math.sin(i)*l,{vx:h,vy:u}=B(o,n,0,0,8e3,P),m=1+(Math.random()-.5)*.03,p=.4+Math.random()*.3,b=[p,p*.9,p*.8];e.push(R(o,n,h*m,u*m,.1+Math.random()*.5,b))}const t=500,{vx:s,vy:a}=B(t,0,0,0,8e3,P);return e.push(R(t,0,s,a,150,[.9,.75,.4])),{bodies:e,config:{gravity:1,timeScale:1,softening:8},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function ee(){const e=[];return e.push(R(-.97000436*150,.24308753*150,.466203685*40,.43236573*40,500,[1,.4,.4])),e.push(R(.97000436*150,-.24308753*150,.466203685*40,.43236573*40,500,[.4,1,.4])),e.push(R(0,0,-.933240737*40,-.86473146*40,500,[.4,.4,1])),{bodies:e,config:{gravity:1,timeScale:.5,softening:5,mergeOnCollision:!1},camera:{x:0,y:0,zoom:1,targetZoom:1,targetX:0,targetY:0}}}function oe(){const e=[],r=50+Math.floor(Math.random()*100);for(let t=0;t<r;t++){const s=Math.random()*Math.PI*2,a=50+Math.random()*400,c=Math.cos(s)*a,l=Math.sin(s)*a,i=Math.random()*15,o=s+Math.PI/2+(Math.random()-.5)*.5,n=Math.cos(o)*i,h=Math.sin(o)*i,u=1+Math.random()*Math.random()*500;e.push(R(c,l,n,h,u))}return{bodies:e,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function re(){const e=[];e.push(R(0,0,0,0,5e3,[1,.95,.6]));const{vx:a,vy:c}=B(200,0,0,0,5e3,P);e.push(R(200,0,a,c,50,[.3,.6,1]));const l=Math.PI/3,i=Math.cos(-l)*200,o=Math.sin(-l)*200;for(let m=0;m<15;m++){const p=i+(Math.random()-.5)*30,b=o+(Math.random()-.5)*30,x=B(p,b,0,0,5e3,P);e.push(R(p,b,x.vx,x.vy,.5,[.5,1,.5]))}const n=-Math.PI/3,h=Math.cos(-n)*200,u=Math.sin(-n)*200;for(let m=0;m<15;m++){const p=h+(Math.random()-.5)*30,b=u+(Math.random()-.5)*30,x=B(p,b,0,0,5e3,P);e.push(R(p,b,x.vx,x.vy,.5,[1,.5,.5]))}return{bodies:e,config:{gravity:1,timeScale:1,softening:5},camera:{x:0,y:0,zoom:.8,targetZoom:.8,targetX:0,targetY:0}}}const ae=2e3;class se{constructor(){y(this,"particles",[])}spawnMergeExplosion(r){const t=Math.min(60,Math.floor(10+Math.sqrt(r.mass)*3));for(let s=0;s<t;s++){this.particles.length>=ae&&this.particles.shift();const a=Math.random()*Math.PI*2,c=(2+Math.random()*8)*Math.pow(r.mass,.15),l=.4+Math.random()*.8,i=Math.random(),o=[r.color[0]*(1-i)+1*i,r.color[1]*(1-i)+.9*i,r.color[2]*(1-i)+.4*i];this.particles.push({x:r.x+(Math.random()-.5)*4,y:r.y+(Math.random()-.5)*4,vx:Math.cos(a)*c,vy:Math.sin(a)*c,life:l,maxLife:l,color:o,size:.5+Math.random()*2})}}update(r){for(let t=this.particles.length-1;t>=0;t--){const s=this.particles[t];if(s.life-=r,s.life<=0){this.particles.splice(t,1);continue}s.x+=s.vx*r,s.y+=s.vy*r,s.vx*=.97,s.vy*=.97}}}const ht=[[.8,.85,1],[1,1,1],[1,.95,.85],[1,.85,.7],[1,.7,.6]];function ie(e){const r=[];for(let t=0;t<e;t++){const s=t<e*.6?0:t<e*.85?1:2,a=Math.floor(Math.random()*ht.length);r.push({x:(Math.random()-.5)*2e4,y:(Math.random()-.5)*2e4,brightness:.2+Math.random()*.8,size:s===0?.5+Math.random()*.5:s===1?.8+Math.random()*.7:1+Math.random()*1,layer:s,twinklePhase:Math.random()*Math.PI*2,twinkleSpeed:.5+Math.random()*2,color:ht[a]})}return r}let O=[],F=null;const f={x:0,y:0,zoom:.7,targetX:0,targetY:0,targetZoom:.7,shakeX:0,shakeY:0,shakeIntensity:0},g={gravity:1,timeScale:.5,softening:10,damping:1,trailLength:80,bloomIntensity:.7,showTrails:!0,showVectors:!1,paused:!1,followHeaviest:!1,collisions:!1,mergeOnCollision:!1},V=document.getElementById("cosmos"),ne=new qt(V),at=new se,ce=ie(1500),X=[.125,.25,.5,1,2,4,8,16,32];let w=2;function j(){const e=X[w];_t.textContent=e<1?`${e}x`:`${e}x`,g.timeScale=e,q.value=String(Math.min(5,e)),I()}const le=document.getElementById("fps-display"),ue=document.getElementById("body-count"),it=document.getElementById("hint"),At=document.getElementById("side-panel"),ft=document.getElementById("body-info"),me=document.getElementById("info-dot"),he=document.getElementById("info-mass"),fe=document.getElementById("info-speed"),de=document.getElementById("info-pos"),ve=document.getElementById("info-radius"),nt=document.getElementById("btn-menu"),W=document.getElementById("btn-play"),$=document.getElementById("btn-trails"),ge=document.getElementById("btn-center"),z=document.getElementById("btn-follow"),pe=document.getElementById("btn-slow"),ye=document.getElementById("btn-fast"),_t=document.getElementById("speed-display"),K=document.getElementById("gravity-slider"),q=document.getElementById("time-slider"),Q=document.getElementById("softening-slider"),J=document.getElementById("damping-slider"),tt=document.getElementById("trail-slider"),et=document.getElementById("bloom-slider"),Ae=document.getElementById("gravity-value"),_e=document.getElementById("time-value"),be=document.getElementById("softening-value"),xe=document.getElementById("damping-value"),Me=document.getElementById("trail-value"),Re=document.getElementById("bloom-value");let S=!1;function I(){Ae.textContent=parseFloat(K.value).toFixed(2),_e.textContent=parseFloat(q.value).toFixed(2),be.textContent=Q.value,xe.textContent=parseFloat(J.value).toFixed(3),Me.textContent=tt.value,Re.textContent=parseFloat(et.value).toFixed(2)}function bt(){K.value=String(g.gravity),q.value=String(g.timeScale),Q.value=String(g.softening),J.value=String(g.damping),tt.value=String(g.trailLength),et.value=String(g.bloomIntensity),w=X.reduce((r,t,s)=>Math.abs(t-g.timeScale)<Math.abs(X[r]-g.timeScale)?s:r,0),_t.textContent=`${X[w]}x`,I()}function k(e){return Math.abs(e)>=1e4?e.toExponential(1):Math.abs(e)>=100?e.toFixed(0):Math.abs(e)>=1?e.toFixed(1):e.toFixed(2)}function Ee(){if(!F||!F.alive){F=null,ft.classList.remove("visible");return}ft.classList.add("visible");const e=F,r=Math.sqrt(e.vx*e.vx+e.vy*e.vy);me.style.background=`rgb(${Math.round(e.color[0]*255)},${Math.round(e.color[1]*255)},${Math.round(e.color[2]*255)})`,he.textContent=k(e.mass),fe.textContent=k(r),de.textContent=`${k(e.x)}, ${k(e.y)}`,ve.textContent=k(e.radius)}K.addEventListener("input",()=>{g.gravity=parseFloat(K.value),I()});q.addEventListener("input",()=>{g.timeScale=parseFloat(q.value),I()});Q.addEventListener("input",()=>{g.softening=parseFloat(Q.value),I()});J.addEventListener("input",()=>{g.damping=parseFloat(J.value),I()});tt.addEventListener("input",()=>{g.trailLength=parseInt(tt.value),I()});et.addEventListener("input",()=>{g.bloomIntensity=parseFloat(et.value),I()});nt.addEventListener("click",()=>{S=!S,At.classList.toggle("visible",S),nt.classList.toggle("active",S)});W.addEventListener("click",()=>{g.paused=!g.paused,W.textContent=g.paused?"▶":"⏸",W.classList.toggle("active",g.paused)});$.addEventListener("click",()=>{g.showTrails=!g.showTrails,$.classList.toggle("active",g.showTrails)});$.classList.add("active");ge.addEventListener("click",()=>{g.followHeaviest=!1,z.classList.remove("active"),F=null,f.targetX=0,f.targetY=0});z.addEventListener("click",()=>{g.followHeaviest=!g.followHeaviest,z.classList.toggle("active",g.followHeaviest)});pe.addEventListener("click",()=>{w>0&&w--,j()});ye.addEventListener("click",()=>{w<X.length-1&&w++,j()});document.querySelectorAll(".preset-btn").forEach(e=>{e.addEventListener("click",()=>{const r=e.dataset.preset,t=yt(r);O=t.bodies,F=null,t.config&&(Object.assign(g,t.config),t.config.mergeOnCollision===void 0&&(g.mergeOnCollision=!1),bt()),t.camera&&Object.assign(f,{...t.camera,shakeX:0,shakeY:0,shakeIntensity:0})})});const v={type:"none",startX:0,startY:0,startWorldX:0,startWorldY:0,movedDistance:0};function xt(e,r){const t=Math.min(window.devicePixelRatio||1,2);return{x:(e*t-V.width/2)/f.zoom+f.x,y:-(r*t-V.height/2)/f.zoom+f.y}}function Mt(e,r){let t=null,s=1/0;const a=15/f.zoom;for(const c of O){if(!c.alive)continue;const l=c.x-e,i=c.y-r,o=Math.sqrt(l*l+i*i),n=Math.max(c.radius*3,a);o<n&&o<s&&(t=c,s=o)}return t}V.addEventListener("mousedown",e=>{e.preventDefault(),v.type="pan",v.startX=e.clientX,v.startY=e.clientY,v.startWorldX=f.targetX,v.startWorldY=f.targetY,v.movedDistance=0});V.addEventListener("mousemove",e=>{if(v.type==="pan"){const r=Math.min(window.devicePixelRatio||1,2),t=(e.clientX-v.startX)*r/f.zoom,s=(e.clientY-v.startY)*r/f.zoom;v.movedDistance=Math.sqrt((e.clientX-v.startX)**2+(e.clientY-v.startY)**2),f.targetX=v.startWorldX-t,f.targetY=v.startWorldY+s,v.movedDistance>5&&(g.followHeaviest=!1,z.classList.remove("active"))}});V.addEventListener("mouseup",e=>{if(v.type==="pan"&&v.movedDistance<5){const r=xt(e.clientX,e.clientY);F=Mt(r.x,r.y)}v.type="none"});V.addEventListener("wheel",e=>{e.preventDefault();const r=e.deltaY>0?.85:1.18;f.targetZoom=Math.max(.005,Math.min(200,f.targetZoom*r))},{passive:!1});V.addEventListener("contextmenu",e=>e.preventDefault());let Rt=0,Et=0;V.addEventListener("touchstart",e=>{if(e.preventDefault(),e.touches.length===1)v.type="pan",v.startX=e.touches[0].clientX,v.startY=e.touches[0].clientY,v.startWorldX=f.targetX,v.startWorldY=f.targetY,v.movedDistance=0;else if(e.touches.length===2){v.type="pan";const r=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY;Rt=Math.sqrt(r*r+t*t),Et=f.targetZoom,v.startX=(e.touches[0].clientX+e.touches[1].clientX)/2,v.startY=(e.touches[0].clientY+e.touches[1].clientY)/2,v.startWorldX=f.targetX,v.startWorldY=f.targetY}},{passive:!1});V.addEventListener("touchmove",e=>{if(e.preventDefault(),e.touches.length===1&&v.type==="pan"){const r=Math.min(window.devicePixelRatio||1,2),t=(e.touches[0].clientX-v.startX)*r/f.zoom,s=(e.touches[0].clientY-v.startY)*r/f.zoom;v.movedDistance=Math.sqrt((e.touches[0].clientX-v.startX)**2+(e.touches[0].clientY-v.startY)**2),f.targetX=v.startWorldX-t,f.targetY=v.startWorldY+s,v.movedDistance>10&&(g.followHeaviest=!1,z.classList.remove("active"))}else if(e.touches.length===2){const r=e.touches[1].clientX-e.touches[0].clientX,t=e.touches[1].clientY-e.touches[0].clientY,s=Math.sqrt(r*r+t*t);f.targetZoom=Math.max(.005,Math.min(200,Et*(s/Rt)));const a=(e.touches[0].clientX+e.touches[1].clientX)/2,c=(e.touches[0].clientY+e.touches[1].clientY)/2,l=Math.min(window.devicePixelRatio||1,2);f.targetX=v.startWorldX-(a-v.startX)*l/f.zoom,f.targetY=v.startWorldY+(c-v.startY)*l/f.zoom}},{passive:!1});V.addEventListener("touchend",e=>{if(v.type==="pan"&&e.touches.length===0&&v.movedDistance<10){const r=xt(v.startX,v.startY);F=Mt(r.x,r.y)}e.touches.length===0&&(v.type="none")});document.addEventListener("keydown",e=>{switch(e.key){case" ":e.preventDefault(),g.paused=!g.paused,W.textContent=g.paused?"▶":"⏸",W.classList.toggle("active",g.paused);break;case"t":g.showTrails=!g.showTrails,$.classList.toggle("active",g.showTrails);break;case"c":f.targetX=0,f.targetY=0;break;case"f":g.followHeaviest=!g.followHeaviest,z.classList.toggle("active",g.followHeaviest);break;case"Escape":F=null;break;case"ArrowUp":case"]":w<X.length-1&&w++,j();break;case"ArrowDown":case"[":w>0&&w--,j();break;case"Tab":e.preventDefault(),S=!S,At.classList.toggle("visible",S),nt.classList.toggle("active",S);break}});let dt=0,st=0,Z=0,vt=60;function Ft(e){requestAnimationFrame(Ft);const r=Math.min((e-dt)/1e3,.05);dt=e,st++,Z+=r,Z>=.5&&(vt=Math.round(st/Z),Z=0,st=0);const t=1-Math.pow(1e-5,r);if(f.x+=(f.targetX-f.x)*t,f.y+=(f.targetY-f.y)*t,f.zoom+=(f.targetZoom-f.zoom)*t,f.shakeIntensity>.01?(f.shakeX=(Math.random()-.5)*f.shakeIntensity,f.shakeY=(Math.random()-.5)*f.shakeIntensity,f.shakeIntensity*=Math.pow(.02,r)):(f.shakeX=0,f.shakeY=0,f.shakeIntensity=0),g.followHeaviest){let s=null,a=0;for(const c of O)c.alive&&c.mass>a&&(a=c.mass,s=c);s&&(f.targetX=s.x,f.targetY=s.y)}if(!g.paused){const s=[],a=Math.max(1,Math.ceil(g.timeScale)),c=r/a;for(let l=0;l<a;l++)Zt(O,g,c,s);for(const l of s)at.spawnMergeExplosion(l),f.shakeIntensity=Math.min(15,f.shakeIntensity+Math.sqrt(l.mass)*.3)}at.update(r),O=O.filter(s=>s.alive),F&&!F.alive&&(F=null),ne.render(O,f,g,at.particles,ce,F,r),le.textContent=`${vt} FPS`,ue.textContent=`${O.length} bod${O.length===1?"y":"ies"}`,Ee()}const Fe=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);Fe&&(it.textContent="Pinch to zoom — Drag to pan — Tap a planet to select");const H=yt("solar-system");O=H.bodies;H.config&&Object.assign(g,H.config);H.camera&&Object.assign(f,{...H.camera,shakeX:0,shakeY:0,shakeIntensity:0});bt();requestAnimationFrame(Ft);setTimeout(()=>{it.style.opacity!=="0"&&(it.style.opacity="0")},6e3);
