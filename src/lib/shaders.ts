/* ═══════════════════════════════════════════════════════════════
   The Specimen: one surface, three ways of seeing it.
     mode 0 · MATH  → iso-contours of the displacement field
     mode 1 · MESH  → barycentric wireframe of the tessellation
     mode 2 · SHADE → thin-film iridescent shading + rim light
   ═══════════════════════════════════════════════════════════════ */

export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export const VERT = /* glsl */ `
uniform float uTime, uFreq, uAmp, uHitAmt;
uniform vec3 uHit;
attribute vec3 aBary;
varying vec3 vBary, vNormal, vView, vObj;
varying float vDisp;
${NOISE}
float field(vec3 p){
  float d = snoise(p*uFreq + vec3(0., uTime*.22, uTime*.11)) * uAmp;
  d += snoise(p*uFreq*2.3 - uTime*.15) * uAmp * .28;
  float h = distance(p, uHit);
  d += uHitAmt * exp(-h*h*7.) * sin(h*22. - uTime*7.) * .09;
  return d;
}
vec3 disp(vec3 p){ return p * (1. + field(p)); }
void main(){
  vec3 p = normalize(position);
  vec3 t = normalize(abs(p.y) > .99 ? cross(p, vec3(1.,0.,0.)) : cross(p, vec3(0.,1.,0.)));
  vec3 b = normalize(cross(p, t));
  float e = .012;
  vec3 P = disp(p);
  vec3 Pt = disp(normalize(p + t*e));
  vec3 Pb = disp(normalize(p + b*e));
  vec3 n = normalize(cross(Pt - P, Pb - P));
  if (dot(n, p) < 0.) n = -n;
  vDisp = field(p);
  vObj = p;
  vBary = aBary;
  vec4 mv = modelViewMatrix * vec4(P, 1.);
  vNormal = normalize(normalMatrix * n);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const FRAG = /* glsl */ `
uniform vec3 uMix;     // weights: math, mesh, shade
uniform float uTime, uDim;
uniform vec3 uAcc;
varying vec3 vBary, vNormal, vView, vObj;
varying float vDisp;

vec3 pal(float t){ // iq cosine palette, tuned warm → cool
  return .5 + .5*cos(6.28318*(vec3(1.,1.,1.)*t + vec3(.02,.18,.38)));
}
float aaLine(float v, float w){
  float fw = fwidth(v);
  return 1. - smoothstep(w*fw*.5, w*fw*.5 + fw, abs(v));
}
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float ndv = clamp(dot(N, V), 0., 1.);
  float fres = pow(1. - ndv, 3.);
  vec3 L = normalize(vec3(.6, .8, .7));
  float diff = clamp(dot(N, L), 0., 1.);

  // ── MATH: contour lines of the scalar field + lat/long graticule
  float k = 26.;
  float c = aaLine(fract(vDisp*k + .5) - .5, 1.2);
  float c5 = aaLine(fract(vDisp*k/5. + .5) - .5, 2.2);
  float lat = asin(clamp(vObj.y, -1., 1.)) / 3.14159 * 18.;
  float lon = atan(vObj.z, vObj.x) / 3.14159 * 18.;
  float grat = max(aaLine(fract(lat + .5) - .5, 1.), aaLine(fract(lon + .5) - .5, 1.)) * .22;
  vec3 mathCol = vec3(.035) + uAcc * c * .75 + vec3(1., .82, .7) * c5 * .9 + vec3(.9) * grat;
  mathCol += uAcc * fres * .35;

  // ── MESH: barycentric wireframe, depth-faded
  float edge = min(min(vBary.x, vBary.y), vBary.z);
  float wire = 1. - smoothstep(0., fwidth(edge) * 1.15, edge);
  float vtx = smoothstep(.93, .985, max(max(vBary.x, vBary.y), vBary.z));
  vec3 meshCol = vec3(.025) + vec3(.82, .8, .76) * wire * (.25 + .75*ndv) + uAcc * vtx * .9;
  meshCol += uAcc * fres * .25;

  // ── SHADE: thin-film iridescence + key/rim lighting
  vec3 film = pal(ndv * 1.25 + vDisp * 2.2 + uTime * .03);
  vec3 base = mix(vec3(.05, .03, .025), uAcc, .35 + .4 * diff);
  vec3 shadeCol = base * (.18 + diff * .9);
  shadeCol = mix(shadeCol, film, fres * .85);
  vec3 H = normalize(L + V);
  shadeCol += pow(clamp(dot(N, H), 0., 1.), 60.) * vec3(1., .9, .8) * .9;
  shadeCol += uAcc * pow(1. - ndv, 6.) * 1.4;
  shadeCol += vec3(.35, .55, 1.) * clamp(-N.y, 0., 1.) * .08;

  vec3 col = mathCol * uMix.x + meshCol * uMix.y + shadeCol * uMix.z;
  col /= max(uMix.x + uMix.y + uMix.z, .001);
  col *= uDim;
  gl_FragColor = vec4(col, 1.);
}`;

export const PLOT_VERT = /* glsl */ `
uniform float uTime, uSize, uPR;
varying float vH, vFade;
void main(){
  vec3 p = position;
  float r = length(p.xz);
  float h = sin(p.x*1.3 + uTime*.6) * cos(p.z*1.1 - uTime*.45) * .22 + sin(r*2.4 - uTime) * .08;
  p.y += h;
  vH = h;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vFade = smoothstep(9., 2., r);
  gl_PointSize = uSize * uPR * (3. / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
export const PLOT_FRAG = /* glsl */ `
uniform vec3 uAcc; uniform float uDim;
varying float vH, vFade;
void main(){
  vec2 q = gl_PointCoord - .5;
  if (dot(q, q) > .25) discard;
  vec3 c = mix(vec3(.55), uAcc, smoothstep(.05, .3, vH));
  gl_FragColor = vec4(c * uDim, vFade * .55 * uDim);
}`;
