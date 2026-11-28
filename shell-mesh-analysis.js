import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {PLYLoader} from 'three/addons/loaders/PLYLoader.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshBVH} from 'three-mesh-bvh';
const $=id=>document.getElementById(id), status=$('meshStatus'), run=$('meshRun'), exp=$('meshExport');
let report = null, renderer, scene, camera, controls, group, viewBounds;
const viewMode = $('meshViewMode');
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function init() {
  if (renderer) return;
  const view = $('meshView');
  renderer = new T.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const canvas = renderer.domElement;
  view.append(canvas);
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Interactive aligned shell specimens');
  canvas.setAttribute('aria-describedby', 'meshViewHint');
  scene = new T.Scene();
  scene.background = new T.Color(0x142334);
  camera = new T.PerspectiveCamera(45, 1, .001, 1e8);
  controls = new OrbitControls(camera, canvas);
  controls.addEventListener('change', draw);
  group = new T.Group();
  scene.add(group, new T.HemisphereLight(0xeaf5ff, 0x596673, 2.2));
  const light = new T.DirectionalLight(0xffffff, 2.3);
  light.position.set(1, 2, 3);
  camera.add(light);
  scene.add(camera);
  new ResizeObserver(draw).observe(view);
  canvas.addEventListener('keydown', event => {
    const offset = camera.position.clone().sub(controls.target);
    const orbit = new T.Spherical().setFromVector3(offset);
    switch (event.key) {
      case 'ArrowLeft': orbit.theta -= .12; break;
      case 'ArrowRight': orbit.theta += .12; break;
      case 'ArrowUp': orbit.phi -= .12; break;
      case 'ArrowDown': orbit.phi += .12; break;
      case '+': case '=': orbit.radius /= 1.13; break;
      case '-': orbit.radius *= 1.13; break;
      default: return;
    }
    event.preventDefault();
    orbit.radius = T.MathUtils.clamp(orbit.radius, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setFromSpherical(orbit.makeSafe()));
    controls.update();
  });
}

function draw() {
  const view = $('meshView');
  const {clientWidth: width, clientHeight: height} = view;
  if (!renderer || !width || !height) return;
  const size = renderer.getSize(new T.Vector2());
  if (size.x !== width || size.y !== height) renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}
async function load(f){if(!f)throw Error('Select both mesh files.');if(f.size>100*1024*1024)throw Error('File exceeds 100 MB. Simplify a copy of the mesh first.');let ext=f.name.split('.').pop().toLowerCase(),g;
if(ext==='ply')g=new PLYLoader().parse(await f.arrayBuffer());
else if(ext==='stl')g=new STLLoader().parse(await f.arrayBuffer());
else {let root;if(ext==='obj')root=new OBJLoader().parse(await f.text());else if(ext==='glb')root=(await new GLTFLoader().parseAsync(await f.arrayBuffer(),'')).scene;else throw Error('Supported formats: OBJ, PLY, STL, GLB.');root.updateMatrixWorld(true);let data=[];root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,ix=o.geometry.index;for(let i=0;i<(ix?ix.count:p.count);i++){let v=V().fromBufferAttribute(p,ix?ix.getX(i):i).applyMatrix4(o.matrixWorld);data.push(v.x,v.y,v.z);}});g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data,3));}
if(ext==='ply'&&!g.index)throw Error('PLY must contain indexed triangle faces, not just points.');if(!g.attributes.position||g.attributes.position.count<3)throw Error('Empty mesh.');if(g.index)g=g.toNonIndexed();const p=g.attributes.position;if(p.count%3||p.count>1500000)throw Error('Mesh must contain triangles and no more than 500,000 faces.');for(const n of p.array)if(!Number.isFinite(n))throw Error('Invalid vertex coordinates.');return g;}
function sample(g,n){const p=g.attributes.position,areas=[],tris=[];let total=0;for(let i=0;i<p.count;i+=3){const a=V().fromBufferAttribute(p,i),b=V().fromBufferAttribute(p,i+1),c=V().fromBufferAttribute(p,i+2);total+=b.clone().sub(a).cross(c.clone().sub(a)).length()/2;areas.push(total);tris.push([a,b,c]);}if(!(total>0))throw Error('Mesh has zero surface area.');let out=[];for(let i=0;i<n;i++){let t=total*(i+.5)/n,lo=0,hi=areas.length-1;while(lo<hi){let m=(lo+hi)>>1;if(areas[m]<t)lo=m+1;else hi=m;}let [a,b,c]=tris[lo],u=Math.sqrt(((i+1)*.61803398875)%1),v=((i+1)*.41421356237)%1;out.push(a.clone().multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v));}return out;}
function center(p){return p.reduce((a,b)=>a.add(b),V()).multiplyScalar(1/p.length);}
function rmsRadius(p,c){return Math.sqrt(p.reduce((s,v)=>s+v.distanceToSquared(c),0)/p.length);}
function fit(a,b){const ca=center(a),cb=center(b);let s=Array.from({length:3},()=>[0,0,0]);a.forEach((v,i)=>{let x=v.clone().sub(ca).toArray(),y=b[i].clone().sub(cb).toArray();for(let j=0;j<3;j++)for(let k=0;k<3;k++)s[j][k]+=x[j]*y[k];});let [[xx,xy,xz],[yx,yy,yz],[zx,zy,zz]]=s,tr=xx+yy+zz;let N=[[tr,yz-zy,zx-xz,xy-yx],[yz-zy,xx-yy-zz,xy+yx,zx+xz],[zx-xz,xy+yx,-xx+yy-zz,yz+zy],[xy-yx,zx+xz,yz+zy,-xx-yy+zz]];let shift=Math.max(...N.map(r=>r.reduce((a,b)=>a+Math.abs(b),0)))+1e-30;let q=[1,.13,.21,.31];for(let i=0;i<100;i++){let w=N.map((r,j)=>r.reduce((a,b,k)=>a+b*q[k],0)+shift*q[j]);let l=Math.hypot(...w);q=w.map(v=>v/l);}let rot=new T.Quaternion(q[1],q[2],q[3],q[0]).normalize();return new T.Matrix4().makeRotationFromQuaternion(rot).setPosition(cb.clone().sub(ca.applyQuaternion(rot)));}
const pause=()=>new Promise(r=>setTimeout(r,0));
function closest(tree,p){const h=tree.closestPointToPoint(p,{});if(!h)throw Error('Could not find closest surface point.');return h.point;}
function score(tree,pts,m){return pts.reduce((s,p)=>s+closest(tree,p.clone().applyMatrix4(m)).distanceToSquared(p.clone().applyMatrix4(m)),0)/pts.length;}
function starts(){let out=[];for(let x of [V(1),V(-1),V(0,1),V(0,-1),V(0,0,1),V(0,0,-1)])for(let y of [V(1),V(-1),V(0,1),V(0,-1),V(0,0,1),V(0,0,-1)])if(x.dot(y)===0)out.push(new T.Matrix4().makeBasis(x,y,x.clone().cross(y)));return out;}
function summarize(d){let a=[...d].sort((a,b)=>a-b);return {mean:a.reduce((s,x)=>s+x,0)/a.length,rms:Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length),p95:a[Math.floor(.95*(a.length-1))],max:a[a.length-1]};}
function color(t){return new T.Color().setHSL((1-Math.min(1,Math.max(0,t)))*.66,1,.5);}
function show(a, b, tree, cap) {
  init();
  const geometries = new Set();
  for (const mesh of [...group.children]) {
    group.remove(mesh);
    geometries.add(mesh.geometry);
    mesh.material.dispose();
  }
  for (const geometry of geometries) geometry.dispose();
  a.computeVertexNormals();
  b.computeVertexNormals();
  const positions = b.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const vertex = V();
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    color(vertex.distanceTo(closest(tree, vertex)) / cap).toArray(colors, i * 3);
  }
  b.setAttribute('color', new T.BufferAttribute(colors, 3));
  function addMesh(name, geometry, material) {
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name;
    group.add(mesh);
  }
  addMesh('heat', b, new T.MeshBasicMaterial({vertexColors: true, side: T.DoubleSide}));
  addMesh('moving', b, new T.MeshStandardMaterial({color: 0xe6aa69, side: T.DoubleSide}));
  addMesh('reference', a, new T.MeshStandardMaterial({color: 0x9cd6ed, side: T.DoubleSide}));
  addMesh('wireframe', a, new T.MeshBasicMaterial({
    color: 0x9cd6ed, transparent: true, opacity: .2, depthWrite: false, wireframe: true
  }));
  viewBounds = new T.Box3().setFromObject(group).getBoundingSphere(new T.Sphere());
  viewMode.value = 'heat';
  updateView();
  resetView();
}

function updateView() {
  if (!group) return;
  const mode = viewMode.value;
  for (const mesh of group.children) {
    mesh.visible = mesh.name === mode || (mode === 'overlay' &&
      (mesh.name === 'moving' || mesh.name === 'wireframe'));
  }
  $('meshColorKey').hidden = mode !== 'heat';
  draw();
  updateCaption();
}

function resetView() {
  if (!viewBounds) return;
  const {radius, center: target} = viewBounds;
  const view = $('meshView');
  const vertical = T.MathUtils.degToRad(camera.fov / 2);
  const horizontal = Math.atan(Math.tan(vertical) * view.clientWidth / view.clientHeight);
  const distance = radius * 1.12 / Math.sin(Math.min(vertical, horizontal));
  camera.near = radius / 10000;
  camera.far = distance + radius * 100;
  controls.minDistance = radius * .15;
  controls.maxDistance = distance * 10;
  controls.target.copy(target);
  camera.position.copy(target).addScaledVector(V(1, .45, 1).normalize(), distance);
  controls.update();
  draw();
}

viewMode.addEventListener('change', updateView);
$('meshReset').addEventListener('click', resetView);

const examples = {
  A: {title: 'Horse Conch', filename: 'horse-conch.obj'},
  B: {title: 'Filamentous Horse Conch', filename: 'filamentous-horse-conch.obj'}
};
const inputs = {A: $('meshA'), B: $('meshB')};
const scale = $('meshScale');
const pair = $('examplePair');
const selected = {A: null, B: null};
let busy = false;

function updateCaption() {
  if (!report) return;
  const views = {
    heat: ['Surface deviation heat map', 'The surface of aligned B shows unsigned nearest-surface distances to A.'],
    overlay: ['Overlay of aligned shells', 'Reference A is shown as a blue wireframe over aligned B in amber.'],
    reference: ['Reference shell', 'The fixed reference mesh A is shown in the alignment frame.'],
    moving: ['Aligned moving shell', 'Mesh B is shown after alignment to the reference mesh A.']
  };
  const [title, viewDescription] = views[viewMode.value];
  const question = $('meshQuestion').value.trim();
  const reference = selected.A.title || report.reference;
  const moving = selected.B.title || report.moving;
  const units = report.mode === 'normalized' ? 'reference mesh units' : 'input mesh units';
  const scaling = report.mode === 'normalized'
    ? `B was uniformly rescaled to match the RMS surface radius of A (scale factor ${report.scaleFactor.toPrecision(5)}).`
    : 'The original mesh sizes were preserved.';
  const legend = viewMode.value === 'heat'
    ? ` Blue marks zero distance and red marks distances at or above ${report.displayCap.toPrecision(5)} ${units} (the B-to-A 95th-percentile display cap).`
    : '';
  const forward = report.summary.BtoA.rms.toPrecision(5);
  const reverse = report.summary.AtoB.rms.toPrecision(5);
  const label = `Figure 1. ${title} — ${moving} (B) vs. ${reference} (A)`;
  const description = [
    question ? `Comparison goal: ${question}` : '',
    viewDescription + legend,
    'B was aligned to A using multistart iterative closest point (ICP).',
    scaling,
    `RMS surface deviation was ${forward} (B to A) and ${reverse} (A to B) ${units}, based on 5,000 surface samples per direction.`
  ].filter(Boolean).join(' ');
  report.figureCaption = {label, description, view: viewMode.value, question};
  $('meshFigureLabel').textContent = label;
  $('meshFigureDescription').textContent = description;
  $('meshCaptionStatus').textContent = '';
}

$('meshQuestion').addEventListener('input', updateCaption);
$('meshCopyCaption').addEventListener('click', async () => {
  if (!report?.figureCaption) return;
  const {label, description} = report.figureCaption;
  try {
    await navigator.clipboard.writeText(label + '\n' + description);
    $('meshCaptionStatus').textContent = 'Caption copied.';
  } catch {
    $('meshCaptionStatus').textContent = 'Select the caption text to copy it.';
  }
});

function updateControls() {
  for (const slot of ['A', 'B']) {
    inputs[slot].disabled = busy;
    $('example' + slot).disabled = busy;
  }
  scale.disabled = pair.disabled = busy;
  run.disabled = busy || !selected.A || !selected.B;
}

function clearResults() {
  report = null;
  exp.disabled = true;
  $('meshStats').textContent = '';
  $('meshResult').hidden = true;
  status.textContent = selected.A && selected.B ? 'Ready to align.' : 'Choose two specimens.';
}

function selectExample(slot) {
  inputs[slot].value = '';
  selected[slot] = examples[slot];
  $('selection' + slot).textContent = examples[slot].title + ' selected.';
}

async function readSelection(selection) {
  if (selection instanceof File) return selection;
  const response = await fetch(exampleURL(selection));
  if (!response.ok || !response.body) {
    throw Error('Could not load ' + selection.title + ' (HTTP ' + response.status + ').');
  }
  const mesh = await new Response(
    response.body.pipeThrough(new DecompressionStream('gzip'))
  ).blob();
  return new File([mesh], selection.filename);
}

function exampleURL(example) {
  return '/shell-samples/' + example.filename + '.gz';
}

async function showAvailableExamples() {
  if (typeof DecompressionStream === 'undefined') return;
  const availability = await Promise.all(Object.entries(examples).map(async ([slot, example]) => {
    try {
      const response = await fetch(exampleURL(example), {method: 'HEAD'});
      $('example' + slot).hidden = !response.ok;
      return response.ok;
    } catch {
      return false;
    }
  }));
  pair.hidden = !availability.every(Boolean);
}

for (const slot of ['A', 'B']) {
  inputs[slot].addEventListener('change', () => {
    selected[slot] = inputs[slot].files[0] ?? null;
    $('selection' + slot).textContent = '';
    clearResults();
    updateControls();
  });
  $('example' + slot).addEventListener('click', () => {
    selectExample(slot);
    if (selected.A === examples.A && selected.B === examples.B) scale.value = 'normalized';
    clearResults();
    updateControls();
  });
}

pair.addEventListener('click', () => {
  selectExample('A');
  selectExample('B');
  scale.value = 'normalized';
  clearResults();
  runAnalysis();
});
scale.addEventListener('change', clearResults);
run.addEventListener('click', runAnalysis);

async function runAnalysis() {
  busy = true;
  clearResults();
  updateControls();
  try {
    status.textContent = 'Reading specimen A…';
    await pause();
    const fa = await readSelection(selected.A);
    const a = await load(fa);
    status.textContent = 'Reading specimen B…';
    await pause();
    const fb = await readSelection(selected.B);
    const b = await load(fb);
    const mode = scale.value;
    const sa = sample(a, 1800);
    const sb = sample(b, 1800);
    const ca = center(sa);
    const cb = center(sb);
    const ra = rmsRadius(sa, ca);
    const rb = rmsRadius(sb, cb);
    if (!ra || !rb) throw Error('Degenerate mesh.');
    const factor = mode === 'normalized' ? ra / rb : 1;
    const tree = new MeshBVH(a);
    const originalTreeB = new MeshBVH(b);
    const smallA = sa.filter((_, index) => index % 4 === 0);
    const smallB = sb.filter((_, index) => index % 4 === 0);
    const candidates = [];

    function refine(matrix, points) {
      const moving = points.map(point => point.clone().applyMatrix4(matrix));
      matrix.premultiply(fit(moving, moving.map(point => closest(tree, point))));
    }

    function combinedScore(matrix, pointsA, pointsB) {
      return score(tree, pointsB, matrix) +
        factor ** 2 * score(originalTreeB, pointsA, matrix.clone().invert());
    }

    for (const [index, matrix] of starts().entries()) {
      matrix.scale(V(factor, factor, factor));
      matrix.setPosition(ca.clone().sub(cb.clone().applyMatrix4(matrix)));
      for (let step = 0; step < 8; step++) refine(matrix, smallB);
      candidates.push({matrix, error: combinedScore(matrix, smallA, smallB)});
      status.textContent = 'Testing orientation ' + (index + 1) + ' of 24…';
      await pause();
    }

    let best = null;
    let bestScore = Infinity;
    const finalists = candidates.sort((left, right) => left.error - right.error).slice(0, 4);
    for (const [index, {matrix}] of finalists.entries()) {
      status.textContent = 'Refining alignment ' + (index + 1) + ' of ' + finalists.length + '…';
      for (let step = 0; step <= 35; step++) {
        if (step % 5 === 0) {
          const error = combinedScore(matrix, sa, sb);
          if (error < bestScore) {
            bestScore = error;
            best = matrix.clone();
          }
          await pause();
        }
        if (step < 35) refine(matrix, sb);
      }
    }

    b.applyMatrix4(best);
    const treeB = new MeshBVH(b);
    const pB = sample(b, 5000);
    const pA = sample(a, 5000);
    const dB = pB.map(point => point.distanceTo(closest(tree, point)));
    const dA = pA.map(point => point.distanceTo(closest(treeB, point)));
    const sB = summarize(dB);
    const sA = summarize(dA);
    const cap = Math.max(sB.p95, ra * 1e-9);
    status.textContent='Generating heat map…';await pause();$('meshResult').hidden=false;show(a,b,tree,cap);let units=mode==='normalized'?'reference mesh units (B rescaled)':'input mesh units';$('meshLegend').textContent='Blue = 0; red ≥ '+cap.toPrecision(5)+' '+units+' (95th-percentile display cap).';$('meshStats').textContent='B → A: mean '+sB.mean.toPrecision(5)+'; RMS '+sB.rms.toPrecision(5)+'; P95 '+sB.p95.toPrecision(5)+'; sampled max '+sB.max.toPrecision(5)+'\nA → B: mean '+sA.mean.toPrecision(5)+'; RMS '+sA.rms.toPrecision(5)+'; P95 '+sA.p95.toPrecision(5)+'; sampled max '+sA.max.toPrecision(5)+'\nUnits: '+units+'; B scale factor: '+factor.toPrecision(8)+'\n5,000 area-distributed samples per direction. Inspect alignment before interpretation.';report={version:1,reference:fa.name,moving:fb.name,mode,units,scaleFactor:factor,transformColumnMajor:best.toArray(),displayCap:cap,summary:{BtoA:sB,AtoB:sA},samples:[...pB.map((p,i)=>['BtoA',...p.toArray(),dB[i]]),...pA.map((p,i)=>['AtoB',...p.toArray(),dA[i]])]};updateCaption();
    exp.disabled=false;status.textContent='Alignment complete.';
    $('meshResultTitle').focus();} catch (e) {
    $('meshResult').hidden = true;
    status.textContent = 'Analysis failed: ' + e.message;
  } finally {
    busy = false;
    updateControls();
  }
}
exp.onclick=()=>{if(!report)return;const u=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='shell-surface-analysis.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
clearResults();
updateControls();
showAvailableExamples();
