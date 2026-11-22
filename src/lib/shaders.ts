/* ═══════════════════════════════════════════════════════════════
   The Specimen: a Fibonacci nautilus, seen three ways.
     mode 0 · MATH  → cut-away section, iso-parameter lines, golden spiral
     mode 1 · MESH  → barycentric wireframe of the swept tube
     mode 2 · SHADE → flame-striped shell, mother-of-pearl interior

   Geometry is fully procedural on the GPU:
     r(θ) = a · e^{bθ},  b = 2·ln φ / π   (radius × φ every quarter turn)
   A tube of radius s·r(θ) is swept along the spiral; because the spiral
   is self-similar, sliding the pattern phase inward reads as endless growth.
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

/* Shared shell constants + the spiral itself. Mirrored in scene.ts (SHELL). */
export const SHELL = {
  B: 0.30634896, // 2 ln φ / π
  W: 6.5 * Math.PI, // angular span of the shell (3¼ turns)
  S: 0.5, // tube radius as a fraction of r(θ): s = ½ ⇒ each whorl envelops the last
  KZ: 0.78, // cross-section flattening
  CEN: [0.36, -0.17] as const, // visual centre of the shell in spiral space
  SCALE: 1.55,
  DELTA: (2 * Math.PI) / 10, // chamber spacing (36°)
  LBODY: 0.8 * Math.PI, // body chamber: no septa near the aperture
};

const COMMON = /* glsl */ `
const float PI = 3.14159265;
const float B = ${SHELL.B.toFixed(8)};
const float W = ${SHELL.W.toFixed(6)};
const float S = ${SHELL.S.toFixed(3)};
const float KZ = ${SHELL.KZ.toFixed(3)};
const vec3 CEN = vec3(${SHELL.CEN[0]}, ${SHELL.CEN[1]}, 0.0);
const float SCALE = ${SHELL.SCALE.toFixed(3)};
const float DELTA = ${SHELL.DELTA.toFixed(6)};
const float LBODY = ${SHELL.LBODY.toFixed(6)};
uniform float uTime, uPhase, uAmp, uHitAmt, uCut, uDim;
uniform vec3 uHit, uMix, uAcc;

vec3 toLocal(vec3 p){ return (p - CEN) * SCALE; }
// cut plane height in local space: above the shell when uCut = 0, through the equator at 1
float cutZ(){ return mix(0.95, -0.015, uCut); }
`;

/* ────────────────────────────── SHELL ────────────────────────────── */

export const SHELL_VERT = /* glsl */ `
${COMMON}
${NOISE}
attribute vec2 aUV;
attribute vec3 aBary;
varying vec3 vBary, vNormal, vView, vLocal;
varying vec2 vParam;   // x = absolute angle Θ (phase-shifted), y = v around the tube
varying float vTheta, vR;

vec3 tubeCenter(float th){
  float R = exp(B * th);
  return vec3(vec2(cos(th), sin(th)) * R * (1.0 - S), 0.0);
}
vec3 shell(float u, float v){
  float th = -(1.0 - u) * W;
  float R = exp(B * th);
  vec2 dir = vec2(cos(th), sin(th));
  float a = v * 2.0 * PI;
  vec3 c = vec3(dir * R * (1.0 - S), 0.0);
  float rho = R * S;
  vec3 off = vec3(dir * rho * cos(a), rho * KZ * sin(a));
  vec3 p0 = toLocal(c + off);
  // breathing + pointer ripple, applied radially from the tube centre
  float f = 1.0 + uAmp * snoise(p0 * 1.6 + vec3(0.0, uTime * 0.18, uTime * 0.09));
  float h = distance(p0, uHit);
  f += uHitAmt * exp(-h * h * 3.5) * sin(h * 16.0 - uTime * 6.0) * 0.06;
  return toLocal(c + off * f);
}
void main(){
  float u = aUV.x, v = aUV.y;
  vec3 P  = shell(u, v);
  vec3 Pu = shell(u + 0.0015, v);
  vec3 Pv = shell(u, v + 0.004);
  vec3 n = normalize(cross(Pu - P, Pv - P));
  float th = -(1.0 - u) * W;
  if (dot(n, P - toLocal(tubeCenter(th))) < 0.0) n = -n;

  vTheta = th;
  vR = exp(B * th);
  vParam = vec2(th + uPhase, v);
  vBary = aBary;
  vLocal = P;
  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  vNormal = normalize(normalMatrix * n);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const SHADING = /* glsl */ `
vec3 pal(float t){ return .5 + .5*cos(6.28318*(vec3(1.)*t + vec3(.02,.18,.38))); }
float aaLine(float x, float w){
  float fw = fwidth(x);
  return 1. - smoothstep(w*fw*.5, w*fw*.5 + fw, abs(x));
}
// thin-film nacre: pearly base with a rainbow interference sheen
vec3 nacre(vec3 N, vec3 V, float k){
  float ndv = clamp(dot(N, V), 0., 1.);
  vec3 film = pal(ndv * 1.6 + k);
  return mix(vec3(.80, .78, .76), film, .45 + .35 * (1. - ndv));
}
`;

export const SHELL_FRAG = /* glsl */ `
${COMMON}
${SHADING}
varying vec3 vBary, vNormal, vView, vLocal;
varying vec2 vParam;
varying float vTheta, vR;

void main(){
  float cz = cutZ();
  if (vLocal.z > cz) discard;
  bool inside = !gl_FrontFacing;
  vec3 N = normalize(vNormal) * (inside ? -1. : 1.);
  vec3 V = normalize(vView);
  float ndv = clamp(dot(N, V), 0., 1.);
  float fres = pow(1. - ndv, 3.);
  vec3 L = normalize(vec3(.5, .8, .7));
  float diff = clamp(dot(N, L) * .6 + .4, 0., 1.); // wrapped diffuse
  vec3 H = normalize(L + V);
  float spec = pow(clamp(dot(N, H), 0., 1.), 48.);

  float Th = vParam.x, v = vParam.y;

  // ── MATH: iso-parameter lines; quarter turns (× φ) are the major lines
  float lt = aaLine(fract(Th / (PI / 18.) + .5) - .5, 1.1);   // every 10°
  float lq = aaLine(fract(Th / (PI * .5) + .5) - .5, 2.4);    // every quarter turn
  float lv = aaLine(fract(v * 24. + .5) - .5, 1.0);
  vec3 mathCol = vec3(.03) + vec3(.85, .8, .75) * lv * .28 + uAcc * lt * .7 + vec3(1., .85, .72) * lq;
  mathCol += uAcc * fres * .3;
  if (inside) mathCol = mathCol * .55 + nacre(N, V, vR * 3.) * .12;

  // ── MESH: barycentric wireframe
  float edge = min(min(vBary.x, vBary.y), vBary.z);
  float wire = 1. - smoothstep(0., fwidth(edge) * 1.15, edge);
  vec3 meshCol = vec3(.025) + vec3(.82, .8, .76) * wire * (.3 + .7 * ndv) + uAcc * fres * .25;
  if (inside) meshCol *= .5;

  // ── SHADE: flame stripes outside, nacre inside
  // flame stripes: thin, wavy, irregular; they fade out over the last half-turn
  float wob = 1.9 * sin(v * 6.2832 + Th * .7) + .9 * sin(v * 18.85 - Th * 1.3);
  float stripe = sin(Th * 7. + wob + 1.2 * sin(Th * 1.618));
  float width = .55 + .3 * sin(Th * 3.1 + 1.);                       // stripes vary in weight
  float mask = smoothstep(width, width + .22, stripe) * smoothstep(-.4, -3.4, vTheta);
  mask *= smoothstep(.06, .3, abs(v - .5));                          // clear near the umbilicus
  vec3 cream = vec3(.86, .8, .7);
  vec3 burnt = mix(uAcc, vec3(.34, .12, .04), .68);
  // fine growth lines, faded out where they'd alias (more than ~½ cycle per pixel)
  float rf = fwidth(Th * 110.);
  float ridges = 1. - .06 * (.5 + .5 * sin(Th * 110.)) * (1. - smoothstep(.8, 2.5, rf));
  vec3 outer = mix(cream, burnt, mask) * ridges * (.25 + .85 * diff) + spec * .5;
  outer = mix(outer, pal(ndv * 1.2 + vR * 2. + uTime * .02), fres * .55);
  outer += uAcc * pow(1. - ndv, 6.) * .8;
  vec3 inner = nacre(N, V, vR * 3. + uTime * .03) * (.35 + .65 * diff) + spec * .4;
  vec3 shadeCol = inside ? inner : outer;

  vec3 col = (mathCol * uMix.x + meshCol * uMix.y + shadeCol * uMix.z) / max(uMix.x + uMix.y + uMix.z, .001);

  // section line where the cut plane slices the wall
  float sec = (1. - smoothstep(0., .025, cz - vLocal.z)) * smoothstep(0., .2, uCut);
  col = mix(col, uAcc * 1.25, sec);

  gl_FragColor = vec4(col * uDim, 1.);
}`;

/* ────────────────────────────── SEPTA ─────────────────────────────── */
// Chamber walls. Instanced along the spiral at fixed absolute angles, so as
// uPhase advances they slide inward and a new one grows at the body chamber.

export const SEPTA_VERT = /* glsl */ `
${COMMON}
attribute vec3 aSep;   // x = radius 0..1, y = angle 0..1, z = septum index
varying vec3 vNormal, vView, vLocal;
varying vec2 vDisk;
varying float vR, vAlive;

vec3 septum(float r, float a, float k){
  float th = -LBODY - k * DELTA;
  float R = exp(B * th);
  vec2 dir = vec2(cos(th), sin(th));
  vec3 t = vec3(-sin(th), cos(th), 0.0);               // towards the aperture
  float grow = smoothstep(0.0, 0.8, k);                // newest wall grows in
  float rho = R * S * 0.97 * grow;
  float ang = a * 2.0 * PI;
  vec3 c = vec3(dir * R * (1.0 - S), 0.0);
  vec3 p = c + vec3(dir * rho * r * cos(ang), rho * KZ * r * sin(ang));
  p -= t * R * S * 0.42 * (1.0 - r * r) * grow;        // concave towards older chambers
  return toLocal(p);
}
void main(){
  float k = aSep.z + fract(uPhase / DELTA);
  float th = -LBODY - k * DELTA;
  vAlive = step(-W + 0.4, th);
  vec3 P  = septum(aSep.x, aSep.y, k);
  vec3 Pr = septum(min(aSep.x + 0.02, 1.0), aSep.y, k);
  vec3 Pa = septum(aSep.x, aSep.y + 0.01, k);
  vec3 n = normalize(cross(Pr - P, Pa - P) + vec3(1e-5));
  vR = exp(B * th);
  vDisk = aSep.xy;
  vLocal = P;
  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  vNormal = normalize(normalMatrix * n);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const SEPTA_FRAG = /* glsl */ `
${COMMON}
${SHADING}
varying vec3 vNormal, vView, vLocal;
varying vec2 vDisk;
varying float vR, vAlive;
void main(){
  float cz = cutZ();
  if (vLocal.z > cz || vAlive < .5) discard;
  vec3 N = normalize(vNormal) * (gl_FrontFacing ? 1. : -1.);
  vec3 V = normalize(vView);
  float diff = clamp(dot(N, normalize(vec3(.5, .8, .7))) * .6 + .4, 0., 1.);
  float rings = aaLine(fract(vDisk.x * 6. + .5) - .5, 1.);
  float spokes = aaLine(fract(vDisk.y * 24. + .5) - .5, 1.);
  vec3 mathCol = vec3(.04) + uAcc * rings * .7 + vec3(.8) * spokes * .25;
  vec3 meshCol = vec3(.03) + vec3(.82, .8, .76) * max(rings, spokes) * .7;
  vec3 shadeCol = nacre(N, V, vR * 3. + uTime * .03) * (.3 + .7 * diff);
  vec3 col = (mathCol * uMix.x + meshCol * uMix.y + shadeCol * uMix.z) / max(uMix.x + uMix.y + uMix.z, .001);
  float sec = (1. - smoothstep(0., .02, cz - vLocal.z)) * smoothstep(0., .2, uCut);
  col = mix(col, uAcc * 1.25, sec);
  gl_FragColor = vec4(col * uDim, 1.);
}`;

/* ─────────────────────────── PLOTTED SURFACE ──────────────────────── */

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
