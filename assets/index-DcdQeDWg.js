var yt=Object.defineProperty;var pt=(t,r,e)=>r in t?yt(t,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[r]=e;var y=(t,r,e)=>pt(t,typeof r!="symbol"?r+"":r,e);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function e(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(o){if(o.ep)return;o.ep=!0;const s=e(o);fetch(o.href,s)}})();const xt=`#version 300 es
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
}`,bt=`#version 300 es
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
}`,At=`#version 300 es
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
}`,_t=`#version 300 es
precision highp float;

in float v_alpha;
in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color * 0.6, v_alpha * 0.4);
}`,Z=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,Et=`#version 300 es
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
}`,Mt=`#version 300 es
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
}`,Ft=`#version 300 es
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
}`,Rt=`#version 300 es
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
}`,Bt=`#version 300 es
precision highp float;

in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 0.6);
}`,wt=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_camera;
uniform float u_zoom;

void main() {
  vec2 screenPos = (a_position - u_camera) * u_zoom;
  vec2 clipPos = screenPos / u_resolution * 2.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}`,Pt=`#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 0.03);
}`;function et(t,r,e){const a=t.createShader(r);if(t.shaderSource(a,e),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS))throw console.error("Shader compile error:",t.getShaderInfoLog(a)),console.error("Source:",e),t.deleteShader(a),new Error("Shader compilation failed");return a}function T(t,r,e){const a=et(t,t.VERTEX_SHADER,r),o=et(t,t.FRAGMENT_SHADER,e),s=t.createProgram();if(t.attachShader(s,a),t.attachShader(s,o),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))throw console.error("Program link error:",t.getProgramInfoLog(s)),new Error("Program linking failed");return s}function j(t,r,e){const a=t.createFramebuffer(),o=t.createTexture();return t.bindTexture(t.TEXTURE_2D,o),t.texImage2D(t.TEXTURE_2D,0,t.RGBA16F,r,e,0,t.RGBA,t.FLOAT,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.bindFramebuffer(t.FRAMEBUFFER,a),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,o,0),t.bindFramebuffer(t.FRAMEBUFFER,null),{fbo:a,texture:o,width:r,height:e}}class Lt{constructor(r){y(this,"gl");y(this,"canvas");y(this,"width",0);y(this,"height",0);y(this,"bodyProgram");y(this,"trailProgram");y(this,"bloomExtractProgram");y(this,"blurProgram");y(this,"compositeProgram");y(this,"vectorProgram");y(this,"gridProgram");y(this,"quadVBO");y(this,"bodyInstanceVBO");y(this,"bodyVAO");y(this,"trailVBO");y(this,"trailVAO");y(this,"screenVBO");y(this,"screenVAO");y(this,"vectorVBO");y(this,"vectorVAO");y(this,"gridVBO");y(this,"gridVAO");y(this,"sceneFB");y(this,"bloomFB1");y(this,"bloomFB2");y(this,"instanceData");y(this,"trailData");y(this,"vectorData");y(this,"gridData");this.canvas=r;const e=r.getContext("webgl2",{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!e)throw new Error("WebGL2 not supported");e.getExtension("EXT_color_buffer_float")||console.warn("EXT_color_buffer_float not available, bloom may not work"),this.gl=e,this.bodyProgram=T(e,xt,bt),this.trailProgram=T(e,At,_t),this.bloomExtractProgram=T(e,Z,Et),this.blurProgram=T(e,Z,Mt),this.compositeProgram=T(e,Z,Ft),this.vectorProgram=T(e,Rt,Bt),this.gridProgram=T(e,wt,Pt);const o=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.quadVBO=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quadVBO),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),this.bodyInstanceVBO=e.createBuffer(),this.instanceData=new Float32Array(1e4*7),this.bodyVAO=e.createVertexArray(),e.bindVertexArray(this.bodyVAO),e.bindBuffer(e.ARRAY_BUFFER,this.quadVBO),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.bodyInstanceVBO),e.bufferData(e.ARRAY_BUFFER,this.instanceData,e.DYNAMIC_DRAW),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,28,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,28,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,3,e.FLOAT,!1,28,12),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,1,e.FLOAT,!1,28,24),e.vertexAttribDivisor(4,1),e.bindVertexArray(null),this.trailData=new Float32Array(2e5*6),this.trailVBO=e.createBuffer(),this.trailVAO=e.createVertexArray(),e.bindVertexArray(this.trailVAO),e.bindBuffer(e.ARRAY_BUFFER,this.trailVBO),e.bufferData(e.ARRAY_BUFFER,this.trailData,e.DYNAMIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,24,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,1,e.FLOAT,!1,24,8),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,3,e.FLOAT,!1,24,12),e.bindVertexArray(null);const s=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.screenVBO=e.createBuffer(),this.screenVAO=e.createVertexArray(),e.bindVertexArray(this.screenVAO),e.bindBuffer(e.ARRAY_BUFFER,this.screenVBO),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),this.vectorData=new Float32Array(1e4*10),this.vectorVBO=e.createBuffer(),this.vectorVAO=e.createVertexArray(),e.bindVertexArray(this.vectorVAO),e.bindBuffer(e.ARRAY_BUFFER,this.vectorVBO),e.bufferData(e.ARRAY_BUFFER,this.vectorData,e.DYNAMIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,20,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,20,8),e.bindVertexArray(null),this.gridData=new Float32Array(4e3),this.gridVBO=e.createBuffer(),this.gridVAO=e.createVertexArray(),e.bindVertexArray(this.gridVAO),e.bindBuffer(e.ARRAY_BUFFER,this.gridVBO),e.bufferData(e.ARRAY_BUFFER,this.gridData,e.DYNAMIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE),this.resize()}resize(){const r=window.devicePixelRatio||1,e=Math.floor(this.canvas.clientWidth*r),a=Math.floor(this.canvas.clientHeight*r);if(e===this.width&&a===this.height)return;this.width=e,this.height=a,this.canvas.width=e,this.canvas.height=a;const o=this.gl;this.sceneFB=j(o,e,a),this.bloomFB1=j(o,Math.floor(e/2),Math.floor(a/2)),this.bloomFB2=j(o,Math.floor(e/2),Math.floor(a/2))}render(r,e,a){const o=this.gl;this.resize();const s=this.width,i=this.height,l=s/2,n=i/2;o.bindFramebuffer(o.FRAMEBUFFER,this.sceneFB.fbo),o.viewport(0,0,s,i),o.clearColor(0,0,.02,1),o.clear(o.COLOR_BUFFER_BIT),this.drawGrid(e,l,n),a.showTrails&&this.drawTrails(r,e,a,l,n),a.showVectors&&this.drawVectors(r,e,l,n),this.drawBodies(r,e,l,n),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB1.fbo),o.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT),o.blendFunc(o.ONE,o.ZERO),o.useProgram(this.bloomExtractProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.sceneFB.texture),o.uniform1i(o.getUniformLocation(this.bloomExtractProgram,"u_texture"),0),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB2.fbo),o.viewport(0,0,this.bloomFB2.width,this.bloomFB2.height),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(this.blurProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.bloomFB1.texture),o.uniform1i(o.getUniformLocation(this.blurProgram,"u_texture"),0),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_direction"),1,0),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB2.width,this.bloomFB2.height),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.bindFramebuffer(o.FRAMEBUFFER,this.bloomFB1.fbo),o.viewport(0,0,this.bloomFB1.width,this.bloomFB1.height),o.clear(o.COLOR_BUFFER_BIT),o.bindTexture(o.TEXTURE_2D,this.bloomFB2.texture),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_direction"),0,1),o.uniform2f(o.getUniformLocation(this.blurProgram,"u_resolution"),this.bloomFB1.width,this.bloomFB1.height),o.drawArrays(o.TRIANGLES,0,6),o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,s,i),o.clearColor(0,0,0,1),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(this.compositeProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.sceneFB.texture),o.uniform1i(o.getUniformLocation(this.compositeProgram,"u_scene"),0),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,this.bloomFB1.texture),o.uniform1i(o.getUniformLocation(this.compositeProgram,"u_bloom"),1),o.uniform1f(o.getUniformLocation(this.compositeProgram,"u_bloomIntensity"),a.bloomIntensity),o.bindVertexArray(this.screenVAO),o.drawArrays(o.TRIANGLES,0,6),o.blendFunc(o.SRC_ALPHA,o.ONE)}drawGrid(r,e,a){const o=this.gl;o.blendFunc(o.SRC_ALPHA,o.ONE);const i=this.width/r.zoom/10,l=Math.pow(10,Math.floor(Math.log10(i))),n=i/l;let c;n<2?c=l:n<5?c=2*l:c=5*l;const m=r.x-e/r.zoom,d=r.x+e/r.zoom,x=r.y-a/r.zoom,_=r.y+a/r.zoom;let v=0;const E=this.gridData.length/2,g=Math.floor(m/c)*c;for(let A=g;A<=d&&v<E-2;A+=c)this.gridData[v*2]=A,this.gridData[v*2+1]=x,v++,this.gridData[v*2]=A,this.gridData[v*2+1]=_,v++;const b=Math.floor(x/c)*c;for(let A=b;A<=_&&v<E-2;A+=c)this.gridData[v*2]=m,this.gridData[v*2+1]=A,v++,this.gridData[v*2]=d,this.gridData[v*2+1]=A,v++;v!==0&&(o.useProgram(this.gridProgram),o.uniform2f(o.getUniformLocation(this.gridProgram,"u_resolution"),e,a),o.uniform2f(o.getUniformLocation(this.gridProgram,"u_camera"),r.x,r.y),o.uniform1f(o.getUniformLocation(this.gridProgram,"u_zoom"),r.zoom),o.bindVertexArray(this.gridVAO),o.bindBuffer(o.ARRAY_BUFFER,this.gridVBO),o.bufferSubData(o.ARRAY_BUFFER,0,this.gridData.subarray(0,v*2)),o.drawArrays(o.LINES,0,v))}drawBodies(r,e,a,o){const s=this.gl;s.blendFunc(s.SRC_ALPHA,s.ONE);let i=0;for(const l of r){if(!l.alive)continue;if(i*7>=this.instanceData.length)break;const n=i*7;this.instanceData[n]=l.x,this.instanceData[n+1]=l.y,this.instanceData[n+2]=l.radius,this.instanceData[n+3]=l.color[0],this.instanceData[n+4]=l.color[1],this.instanceData[n+5]=l.color[2],this.instanceData[n+6]=l.mass,i++}i!==0&&(s.useProgram(this.bodyProgram),s.uniform2f(s.getUniformLocation(this.bodyProgram,"u_resolution"),a,o),s.uniform2f(s.getUniformLocation(this.bodyProgram,"u_camera"),e.x,e.y),s.uniform1f(s.getUniformLocation(this.bodyProgram,"u_zoom"),e.zoom),s.bindVertexArray(this.bodyVAO),s.bindBuffer(s.ARRAY_BUFFER,this.bodyInstanceVBO),s.bufferSubData(s.ARRAY_BUFFER,0,this.instanceData.subarray(0,i*7)),s.drawArraysInstanced(s.TRIANGLES,0,6,i))}drawTrails(r,e,a,o,s){const i=this.gl;i.blendFunc(i.SRC_ALPHA,i.ONE);let l=0;const n=this.trailData.length/6,c=Math.min(a.trailLength,200);for(const m of r)if(!(!m.alive||c<2))for(let d=0;d<c-1&&l<n-2;d++){const x=(m.trailIndex-c+d+m.trailLength)%m.trailLength,_=(m.trailIndex-c+d+1+m.trailLength)%m.trailLength,v=m.trail[x*2],E=m.trail[x*2+1],g=m.trail[_*2],b=m.trail[_*2+1];if(v===0&&E===0||g===0&&b===0)continue;const A=d/c,P=(d+1)/c,V=l*6;this.trailData[V]=v,this.trailData[V+1]=E,this.trailData[V+2]=A,this.trailData[V+3]=m.color[0],this.trailData[V+4]=m.color[1],this.trailData[V+5]=m.color[2],l++;const O=l*6;this.trailData[O]=g,this.trailData[O+1]=b,this.trailData[O+2]=P,this.trailData[O+3]=m.color[0],this.trailData[O+4]=m.color[1],this.trailData[O+5]=m.color[2],l++}l!==0&&(i.useProgram(this.trailProgram),i.uniform2f(i.getUniformLocation(this.trailProgram,"u_resolution"),o,s),i.uniform2f(i.getUniformLocation(this.trailProgram,"u_camera"),e.x,e.y),i.uniform1f(i.getUniformLocation(this.trailProgram,"u_zoom"),e.zoom),i.bindVertexArray(this.trailVAO),i.bindBuffer(i.ARRAY_BUFFER,this.trailVBO),i.bufferSubData(i.ARRAY_BUFFER,0,this.trailData.subarray(0,l*6)),i.drawArrays(i.LINES,0,l))}drawVectors(r,e,a,o){const s=this.gl;s.blendFunc(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA);let i=0;const l=this.vectorData.length/5,n=3/e.zoom;for(const c of r){if(!c.alive||i>=l-2)continue;const m=Math.sqrt(c.vx*c.vx+c.vy*c.vy);if(m<.01)continue;const d=c.x+c.vx*n,x=c.y+c.vy*n,_=Math.min(1,m/50),v=_,E=.5*(1-_),g=1-_,b=i*5;this.vectorData[b]=c.x,this.vectorData[b+1]=c.y,this.vectorData[b+2]=v,this.vectorData[b+3]=E,this.vectorData[b+4]=g,i++;const A=i*5;this.vectorData[A]=d,this.vectorData[A+1]=x,this.vectorData[A+2]=v,this.vectorData[A+3]=E,this.vectorData[A+4]=g,i++}i!==0&&(s.useProgram(this.vectorProgram),s.uniform2f(s.getUniformLocation(this.vectorProgram,"u_resolution"),a,o),s.uniform2f(s.getUniformLocation(this.vectorProgram,"u_camera"),e.x,e.y),s.uniform1f(s.getUniformLocation(this.vectorProgram,"u_zoom"),e.zoom),s.bindVertexArray(this.vectorVAO),s.bindBuffer(s.ARRAY_BUFFER,this.vectorVBO),s.bufferSubData(s.ARRAY_BUFFER,0,this.vectorData.subarray(0,i*5)),s.drawArrays(s.LINES,0,i))}}const ot=.7;function Y(t,r,e){return{cx:t,cy:r,size:e,totalMass:0,comX:0,comY:0,body:null,nw:null,ne:null,sw:null,se:null,isLeaf:!0}}function nt(t,r){if(t.totalMass===0&&t.body===null){t.body=r,t.totalMass=r.mass,t.comX=r.x,t.comY=r.y;return}if(t.size<.5){const a=t.totalMass+r.mass;t.comX=(t.comX*t.totalMass+r.x*r.mass)/a,t.comY=(t.comY*t.totalMass+r.y*r.mass)/a,t.totalMass=a;return}if(t.isLeaf&&t.body!==null){const a=t.body;t.body=null,t.isLeaf=!1;const o=t.size/2;t.nw=Y(t.cx-o/2,t.cy-o/2,o),t.ne=Y(t.cx+o/2,t.cy-o/2,o),t.sw=Y(t.cx-o/2,t.cy+o/2,o),t.se=Y(t.cx+o/2,t.cy+o/2,o),rt(t,a)}const e=t.totalMass+r.mass;t.comX=(t.comX*t.totalMass+r.x*r.mass)/e,t.comY=(t.comY*t.totalMass+r.y*r.mass)/e,t.totalMass=e,rt(t,r)}function rt(t,r){const e=r.x<t.cx,o=r.y<t.cy?e?t.nw:t.ne:e?t.sw:t.se;nt(o,r)}function S(t,r,e,a,o,s){if(t.totalMass===0)return;const i=t.comX-r.x,l=t.comY-r.y,n=i*i+l*l+e;if(t.isLeaf||t.size*t.size/n<ot*ot){if(t.body===r)return;const c=Math.sqrt(n),m=a*t.totalMass/n;o.v+=m*i/c,s.v+=m*l/c;return}t.nw&&S(t.nw,r,e,a,o,s),t.ne&&S(t.ne,r,e,a,o,s),t.sw&&S(t.sw,r,e,a,o,s),t.se&&S(t.se,r,e,a,o,s)}function Tt(t){let r=1/0,e=1/0,a=-1/0,o=-1/0;for(const c of t)c.alive&&(c.x<r&&(r=c.x),c.y<e&&(e=c.y),c.x>a&&(a=c.x),c.y>o&&(o=c.y));const s=Math.max(a-r,o-e,100)*1.1,i=(r+a)/2,l=(e+o)/2,n=Y(i,l,s);for(const c of t)c.alive&&nt(n,c);return n}function ct(t,r,e){const a=t.filter(n=>n.alive);if(a.length===0)return;const o=e*r.timeScale;if(o===0)return;const s=r.gravity*500,i=r.softening*r.softening,l=Tt(a);for(const n of a){const c={v:0},m={v:0};S(l,n,i,s,c,m),n.vx+=c.v*o,n.vy+=m.v*o,n.vx*=r.damping,n.vy*=r.damping,n.x+=n.vx*o,n.y+=n.vy*o}if(r.mergeOnCollision)for(let n=0;n<a.length;n++){const c=a[n];if(c.alive)for(let m=n+1;m<a.length;m++){const d=a[m];if(!d.alive)continue;const x=c.x-d.x,_=c.y-d.y,v=x*x+_*_,E=c.radius+d.radius;if(v<E*E){const[g,b]=c.mass>=d.mass?[c,d]:[d,c],A=g.mass+b.mass;g.vx=(g.vx*g.mass+b.vx*b.mass)/A,g.vy=(g.vy*g.mass+b.vy*b.mass)/A,g.x=(g.x*g.mass+b.x*b.mass)/A,g.y=(g.y*g.mass+b.y*b.mass)/A,g.mass=A,g.radius=lt(A);const P=b.mass/A;g.color=[g.color[0]*(1-P)+b.color[0]*P,g.color[1]*(1-P)+b.color[1]*P,g.color[2]*(1-P)+b.color[2]*P],b.alive=!1}}}for(const n of a){if(!n.alive)continue;const c=n.trailIndex*2;n.trail[c]=n.x,n.trail[c+1]=n.y,n.trailIndex=(n.trailIndex+1)%n.trailLength}}function lt(t){return Math.max(1.5,Math.pow(t,.35)*2)}let Dt=0;function p(t,r,e,a,o,s,i=200){const l=s??tt(o);return{x:t,y:r,vx:e,vy:a,mass:o,radius:lt(o),color:l,trail:new Float32Array(i*2),trailIndex:0,trailLength:i,id:Dt++,alive:!0}}function tt(t){const r=Math.min(1,Math.log10(t+1)/4);return r<.2?[.6,.7,1]:r<.4?[.9,.9,1]:r<.6?[1,.95,.7]:r<.8?[1,.7,.3]:[1,.4,.2]}function R(t,r,e,a,o,s){const i=t-e,l=r-a,n=Math.sqrt(i*i+l*l);if(n<1)return{vx:0,vy:0};const c=Math.sqrt(s*o/n),m=-l/n,d=i/n;return{vx:m*c,vy:d*c}}const M=500;function ut(t){switch(t){case"solar-system":return st();case"binary-stars":return Vt();case"galaxy":return Ot();case"collision":return Yt();case"asteroid-belt":return St();case"figure-eight":return It();case"random":return Xt();case"lagrange":return Ut();default:return st()}}function st(){const t=[];t.push(p(0,0,0,0,5e3,[1,.95,.6]));const r=[{dist:80,mass:2,color:[.7,.7,.7],name:"Mercury"},{dist:130,mass:5,color:[1,.85,.5],name:"Venus"},{dist:180,mass:6,color:[.3,.6,1],name:"Earth"},{dist:250,mass:4,color:[1,.4,.2],name:"Mars"},{dist:400,mass:100,color:[1,.8,.5],name:"Jupiter"},{dist:550,mass:60,color:[.9,.8,.5],name:"Saturn"},{dist:700,mass:30,color:[.5,.8,.9],name:"Uranus"},{dist:850,mass:28,color:[.3,.4,.9],name:"Neptune"}];for(const i of r){const{vx:l,vy:n}=R(i.dist,0,0,0,5e3,M);t.push(p(i.dist,0,l,n,i.mass,i.color))}const e=180,a=15,o=R(e,0,0,0,5e3,M),s=R(e+a,0,e,0,6,M);return t.push(p(e+a,0,o.vx+s.vx,o.vy+s.vy,.3,[.8,.8,.8])),{bodies:t,config:{gravity:1,timeScale:1,softening:5},camera:{x:0,y:0,zoom:.7,targetZoom:.7,targetX:0,targetY:0}}}function Vt(){const t=[],a=Math.sqrt(M*2e3/400);t.push(p(-100,0,0,a,2e3,[.5,.7,1])),t.push(p(100,0,0,-a,2e3,[1,.6,.3]));for(let o=0;o<5;o++){const s=300+o*80,i=Math.random()*Math.PI*2,l=Math.cos(i)*s,n=Math.sin(i)*s,{vx:c,vy:m}=R(l,n,0,0,2e3*2,M),d=Math.random(),x=[.5+d*.5,.6,1-d*.5];t.push(p(l,n,c,m,3+Math.random()*10,x))}return{bodies:t,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.6,targetZoom:.6,targetX:0,targetY:0}}}function Ot(){const t=[];t.push(p(0,0,0,0,2e4,[1,.95,.8]));const e=600;for(let a=0;a<e;a++){const o=a%2,i=a/e*4*Math.PI+o*Math.PI,l=40+a/e*600,n=l*.15,c=i+(Math.random()-.5)*.5,m=Math.cos(c)*l+(Math.random()-.5)*n,d=Math.sin(c)*l+(Math.random()-.5)*n,{vx:x,vy:_}=R(m,d,0,0,2e4,M),v=.5+Math.random()*3,E=Math.random();let g;E<.3?g=[.6,.7,1]:E<.6?g=[1,.95,.85]:E<.85?g=[1,.8,.5]:g=[1,.5,.3],t.push(p(m,d,x,_,v,g))}return{bodies:t,config:{gravity:1,timeScale:1.5,softening:15},camera:{x:0,y:0,zoom:.4,targetZoom:.4,targetX:0,targetY:0}}}function Yt(){const t=[];t.push(p(-300,-100,8,3,1e4,[.5,.7,1]));for(let e=0;e<250;e++){const a=Math.random()*Math.PI*2,o=30+Math.random()*250,s=-300+Math.cos(a)*o,i=-100+Math.sin(a)*o,{vx:l,vy:n}=R(s,i,-300,-100,1e4,M),c=[.4+Math.random()*.3,.6+Math.random()*.2,1];t.push(p(s,i,l+8,n+3,.5+Math.random()*2,c))}t.push(p(300,100,-8,-3,1e4,[1,.6,.3]));for(let e=0;e<250;e++){const a=Math.random()*Math.PI*2,o=30+Math.random()*250,s=300+Math.cos(a)*o,i=100+Math.sin(a)*o,{vx:l,vy:n}=R(s,i,300,100,1e4,M),c=[1,.5+Math.random()*.3,.2+Math.random()*.3];t.push(p(s,i,l-8,n-3,.5+Math.random()*2,c))}return{bodies:t,config:{gravity:1,timeScale:1,softening:20},camera:{x:0,y:0,zoom:.35,targetZoom:.35,targetX:0,targetY:0}}}function St(){const t=[];t.push(p(0,0,0,0,8e3,[1,.9,.5]));for(let s=0;s<3;s++){const i=80+s*60,l=Math.random()*Math.PI*2,n=Math.cos(l)*i,c=Math.sin(l)*i,{vx:m,vy:d}=R(n,c,0,0,8e3,M),x=[[.7,.7,.7],[.3,.5,1],[1,.4,.2]];t.push(p(n,c,m,d,10+Math.random()*20,x[s]))}for(let s=0;s<300;s++){const i=280+Math.random()*60,l=Math.random()*Math.PI*2,n=Math.cos(l)*i,c=Math.sin(l)*i,{vx:m,vy:d}=R(n,c,0,0,8e3,M),x=1+(Math.random()-.5)*.03,_=.4+Math.random()*.3,v=[_,_*.9,_*.8];t.push(p(n,c,m*x,d*x,.1+Math.random()*.5,v))}const e=500,{vx:a,vy:o}=R(e,0,0,0,8e3,M);return t.push(p(e,0,a,o,150,[.9,.75,.4])),{bodies:t,config:{gravity:1,timeScale:1,softening:8},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function It(){const t=[];return t.push(p(-.97000436*150,.24308753*150,.466203685*40,.43236573*40,500,[1,.4,.4])),t.push(p(.97000436*150,-.24308753*150,.466203685*40,.43236573*40,500,[.4,1,.4])),t.push(p(0,0,-.933240737*40,-.86473146*40,500,[.4,.4,1])),{bodies:t,config:{gravity:1,timeScale:.5,softening:5,mergeOnCollision:!1},camera:{x:0,y:0,zoom:1,targetZoom:1,targetX:0,targetY:0}}}function Xt(){const t=[],r=50+Math.floor(Math.random()*100);for(let e=0;e<r;e++){const a=Math.random()*Math.PI*2,o=50+Math.random()*400,s=Math.cos(a)*o,i=Math.sin(a)*o,l=Math.random()*15,n=a+Math.PI/2+(Math.random()-.5)*.5,c=Math.cos(n)*l,m=Math.sin(n)*l,d=1+Math.random()*Math.random()*500;t.push(p(s,i,c,m,d))}return{bodies:t,config:{gravity:1,timeScale:1},camera:{x:0,y:0,zoom:.5,targetZoom:.5,targetX:0,targetY:0}}}function Ut(){const t=[];t.push(p(0,0,0,0,5e3,[1,.95,.6]));const{vx:o,vy:s}=R(200,0,0,0,5e3,M);t.push(p(200,0,o,s,50,[.3,.6,1]));const i=Math.PI/3,l=Math.cos(-i)*200,n=Math.sin(-i)*200;for(let x=0;x<15;x++){const _=l+(Math.random()-.5)*30,v=n+(Math.random()-.5)*30,E=R(_,v,0,0,5e3,M);t.push(p(_,v,E.vx,E.vy,.5,[.5,1,.5]))}const c=-Math.PI/3,m=Math.cos(-c)*200,d=Math.sin(-c)*200;for(let x=0;x<15;x++){const _=m+(Math.random()-.5)*30,v=d+(Math.random()-.5)*30,E=R(_,v,0,0,5e3,M);t.push(p(_,v,E.vx,E.vy,.5,[1,.5,.5]))}return{bodies:t,config:{gravity:1,timeScale:1,softening:5},camera:{x:0,y:0,zoom:.8,targetZoom:.8,targetX:0,targetY:0}}}let F=[];const f={x:0,y:0,zoom:.7,targetX:0,targetY:0,targetZoom:.7},h={gravity:1,timeScale:1,softening:10,damping:1,trailLength:60,bloomIntensity:.6,showTrails:!0,showVectors:!1,paused:!1,followHeaviest:!1,collisions:!0,mergeOnCollision:!0},B=document.getElementById("cosmos"),Ct=new Lt(B),zt=document.getElementById("fps-display"),Nt=document.getElementById("body-count"),C=document.getElementById("hint"),mt=document.getElementById("side-panel"),w=document.getElementById("creation-indicator"),K=document.getElementById("btn-menu"),I=document.getElementById("btn-play"),Wt=document.getElementById("btn-step"),z=document.getElementById("btn-trails"),J=document.getElementById("btn-vectors"),kt=document.getElementById("btn-center"),X=document.getElementById("btn-follow"),qt=document.getElementById("btn-clear"),N=document.getElementById("gravity-slider"),W=document.getElementById("time-slider"),k=document.getElementById("softening-slider"),q=document.getElementById("damping-slider"),G=document.getElementById("trail-slider"),H=document.getElementById("bloom-slider"),Gt=document.getElementById("gravity-value"),Ht=document.getElementById("time-value"),Zt=document.getElementById("softening-value"),jt=document.getElementById("damping-value"),$t=document.getElementById("trail-value"),Kt=document.getElementById("bloom-value");let L=!1;function D(){Gt.textContent=parseFloat(N.value).toFixed(2),Ht.textContent=parseFloat(W.value).toFixed(2),Zt.textContent=k.value,jt.textContent=parseFloat(q.value).toFixed(3),$t.textContent=G.value,Kt.textContent=parseFloat(H.value).toFixed(2)}function ht(){N.value=String(h.gravity),W.value=String(h.timeScale),k.value=String(h.softening),q.value=String(h.damping),G.value=String(h.trailLength),H.value=String(h.bloomIntensity),D()}N.addEventListener("input",()=>{h.gravity=parseFloat(N.value),D()});W.addEventListener("input",()=>{h.timeScale=parseFloat(W.value),D()});k.addEventListener("input",()=>{h.softening=parseFloat(k.value),D()});q.addEventListener("input",()=>{h.damping=parseFloat(q.value),D()});G.addEventListener("input",()=>{h.trailLength=parseInt(G.value),D()});H.addEventListener("input",()=>{h.bloomIntensity=parseFloat(H.value),D()});K.addEventListener("click",()=>{L=!L,mt.classList.toggle("visible",L),K.classList.toggle("active",L)});I.addEventListener("click",()=>{h.paused=!h.paused,I.textContent=h.paused?"▶":"⏸",I.classList.toggle("active",h.paused)});Wt.addEventListener("click",()=>{h.paused&&ct(F,h,1/60)});z.addEventListener("click",()=>{h.showTrails=!h.showTrails,z.classList.toggle("active",h.showTrails)});z.classList.add("active");J.addEventListener("click",()=>{h.showVectors=!h.showVectors,J.classList.toggle("active",h.showVectors)});kt.addEventListener("click",()=>{h.followHeaviest=!1,X.classList.remove("active"),f.targetX=0,f.targetY=0});X.addEventListener("click",()=>{h.followHeaviest=!h.followHeaviest,X.classList.toggle("active",h.followHeaviest)});qt.addEventListener("click",()=>{F=[]});document.querySelectorAll(".preset-btn").forEach(t=>{t.addEventListener("click",()=>{const r=t.dataset.preset,e=ut(r);F=e.bodies,e.config&&(Object.assign(h,e.config),e.config.mergeOnCollision===void 0&&(h.mergeOnCollision=!0),ht()),e.camera&&Object.assign(f,e.camera)})});const u={type:"none",startX:0,startY:0,startWorldX:0,startWorldY:0,currentX:0,currentY:0};function ft(t,r){const e=window.devicePixelRatio||1,a=(t*e-B.width/2)/f.zoom+f.x,o=(r*e-B.height/2)/f.zoom+f.y;return{x:a,y:o}}B.addEventListener("mousedown",t=>{if(t.preventDefault(),t.button===2||t.button===1||t.ctrlKey||t.metaKey)u.type="pan",u.startX=t.clientX,u.startY=t.clientY,u.startWorldX=f.targetX,u.startWorldY=f.targetY;else{u.type="create",u.startX=t.clientX,u.startY=t.clientY;const r=ft(t.clientX,t.clientY);u.startWorldX=r.x,u.startWorldY=r.y,u.currentX=t.clientX,u.currentY=t.clientY,w.style.display="block"}});B.addEventListener("mousemove",t=>{if(u.type==="pan"){const r=window.devicePixelRatio||1,e=(t.clientX-u.startX)*r/f.zoom,a=(t.clientY-u.startY)*r/f.zoom;f.targetX=u.startWorldX-e,f.targetY=u.startWorldY-a,h.followHeaviest=!1,X.classList.remove("active")}else if(u.type==="create"){u.currentX=t.clientX,u.currentY=t.clientY;const r=u.currentX-u.startX,e=u.currentY-u.startY,a=Math.sqrt(r*r+e*e),o=Math.max(1,a*2),s=Math.max(20,Math.min(60,Math.pow(o,.35)*8));w.style.left=`${u.startX}px`,w.style.top=`${u.startY}px`;const i=w.querySelector(".ring");if(i.style.width=`${s}px`,i.style.height=`${s}px`,a>5){const l=w.querySelector(".arrow"),n=Math.atan2(e,r);l.style.width=`${a}px`,l.style.transform=`rotate(${n}rad)`,l.style.display="block"}}});B.addEventListener("mouseup",t=>{if(u.type==="create"){const r=u.currentX-u.startX,e=u.currentY-u.startY,a=Math.sqrt(r*r+e*e),o=Math.max(1,a*2),s=window.devicePixelRatio||1,i=.3/f.zoom*s,l=-r*i,n=-e*i,c=tt(o);F.push(p(u.startWorldX,u.startWorldY,l,n,o,c)),w.style.display="none";const m=w.querySelector(".arrow");m.style.display="none",C.style.opacity="0"}u.type="none"});B.addEventListener("wheel",t=>{t.preventDefault();const r=t.deltaY>0?.9:1.1;f.targetZoom=Math.max(.01,Math.min(20,f.targetZoom*r))},{passive:!1});B.addEventListener("contextmenu",t=>t.preventDefault());let dt=0,vt=0;B.addEventListener("touchstart",t=>{if(t.preventDefault(),t.touches.length===1){u.type="create",u.startX=t.touches[0].clientX,u.startY=t.touches[0].clientY;const r=ft(u.startX,u.startY);u.startWorldX=r.x,u.startWorldY=r.y,u.currentX=u.startX,u.currentY=u.startY,w.style.display="block"}else if(t.touches.length===2){u.type="pan";const r=t.touches[1].clientX-t.touches[0].clientX,e=t.touches[1].clientY-t.touches[0].clientY;dt=Math.sqrt(r*r+e*e),vt=f.targetZoom,u.startX=(t.touches[0].clientX+t.touches[1].clientX)/2,u.startY=(t.touches[0].clientY+t.touches[1].clientY)/2,u.startWorldX=f.targetX,u.startWorldY=f.targetY,w.style.display="none"}},{passive:!1});B.addEventListener("touchmove",t=>{if(t.preventDefault(),t.touches.length===1&&u.type==="create")u.currentX=t.touches[0].clientX,u.currentY=t.touches[0].clientY;else if(t.touches.length===2&&u.type==="pan"){const r=t.touches[1].clientX-t.touches[0].clientX,e=t.touches[1].clientY-t.touches[0].clientY,a=Math.sqrt(r*r+e*e);f.targetZoom=Math.max(.01,Math.min(20,vt*(a/dt)));const o=(t.touches[0].clientX+t.touches[1].clientX)/2,s=(t.touches[0].clientY+t.touches[1].clientY)/2,i=window.devicePixelRatio||1;f.targetX=u.startWorldX-(o-u.startX)*i/f.zoom,f.targetY=u.startWorldY-(s-u.startY)*i/f.zoom}},{passive:!1});B.addEventListener("touchend",t=>{if(u.type==="create"&&t.touches.length===0){const r=u.currentX-u.startX,e=u.currentY-u.startY,a=Math.sqrt(r*r+e*e),o=Math.max(1,a*2),s=window.devicePixelRatio||1,i=.3/f.zoom*s,l=-r*i,n=-e*i,c=tt(o);F.push(p(u.startWorldX,u.startWorldY,l,n,o,c)),w.style.display="none",C.style.opacity="0"}t.touches.length===0&&(u.type="none")});document.addEventListener("keydown",t=>{switch(t.key){case" ":t.preventDefault(),h.paused=!h.paused,I.textContent=h.paused?"▶":"⏸",I.classList.toggle("active",h.paused);break;case"t":h.showTrails=!h.showTrails,z.classList.toggle("active",h.showTrails);break;case"v":h.showVectors=!h.showVectors,J.classList.toggle("active",h.showVectors);break;case"c":f.targetX=0,f.targetY=0;break;case"f":h.followHeaviest=!h.followHeaviest,X.classList.toggle("active",h.followHeaviest);break;case"Backspace":case"Delete":F=[];break;case"Tab":t.preventDefault(),L=!L,mt.classList.toggle("visible",L),K.classList.toggle("active",L);break}});let at=0,$=0,U=0,it=60;function gt(t){requestAnimationFrame(gt);const r=Math.min((t-at)/1e3,.05);at=t,$++,U+=r,U>=.5&&(it=Math.round($/U),U=0,$=0);const e=1-Math.pow(.001,r);if(f.x+=(f.targetX-f.x)*e,f.y+=(f.targetY-f.y)*e,f.zoom+=(f.targetZoom-f.zoom)*e,h.followHeaviest){let a=null,o=0;for(const s of F)s.alive&&s.mass>o&&(o=s.mass,a=s);a&&(f.targetX=a.x,f.targetY=a.y)}if(!h.paused){const a=Math.max(1,Math.ceil(h.timeScale)),o=r/a;for(let s=0;s<a;s++)ct(F,h,o)}F=F.filter(a=>a.alive),Ct.render(F,f,h),zt.textContent=`${it} FPS`,Nt.textContent=`${F.length} bodies`}const Q=ut("solar-system");F=Q.bodies;Q.camera&&Object.assign(f,Q.camera);ht();requestAnimationFrame(gt);setTimeout(()=>{C.style.opacity!=="0"&&(C.style.opacity="0")},8e3);
