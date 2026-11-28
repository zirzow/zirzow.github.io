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
  scene.add(group, markerGroup, new T.HemisphereLight(0xeaf5ff, 0x596673, 2.2));
  const light = new T.DirectionalLight(0xffffff, 2.3);
  light.position.set(1, 2, 3);
  camera.add(light);
  scene.add(camera);
  new ResizeObserver(draw).observe(view);
  canvas.addEventListener('pointerdown', event => {
    if (armed && event.isPrimary && event.button === 0) {
      pointerStart = {id: event.pointerId, x: event.clientX, y: event.clientY};
    } else {
      pointerStart = null;
    }
  });
  canvas.addEventListener('pointerup', pickLandmark);
  canvas.addEventListener('pointercancel', () => { pointerStart = null; });
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
  drawMarks();
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

viewMode.addEventListener('change', () => {
  updateMarkSelection();
  updateView();
});
$('meshReset').addEventListener('click', resetView);

const examples = {
  A: {title: 'Horse Conch', filename: 'horse-conch.obj'},
  B: {title: 'Filamentous Horse Conch', filename: 'filamentous-horse-conch.obj', parts: 4}
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
  const units = report.calibration?.applied ? 'mm' : report.mode === 'normalized' ? 'reference mesh units' : 'input mesh units';
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

const landmarkShell = $('landmarkShell');
const landmarkPoint = $('landmarkPoint');
const landmarkMark = $('landmarkMark');
const landmarkRemove = $('landmarkRemove');
const landmarkStatus = $('landmarkStatus');
const marks = {A: new Map(), B: new Map()};
const markerGroup = new T.Group();
const markerGeometry = new T.SphereGeometry(1, 12, 8);
const markerMaterial = new T.MeshBasicMaterial({color: 0xffde57, depthTest: false});
const raycaster = new T.Raycaster();
raycaster.firstHitOnly = true;
let armed = false;
let pointerStart = null;

const landmarkPairs = [
  ['Apex to siphonal canal tip', 'Apex', 'Siphonal canal tip'],
  ['Spire height (apex to spire base)', 'Apex', 'Spire base'],
  ['Siphonal canal length', 'Siphonal canal start', 'Siphonal canal tip'],
  ['Aperture length', 'Aperture upper end', 'Aperture lower end'],
  ['Shoulder width between marks', 'Shoulder edge 1', 'Shoulder edge 2'],
  ['Valve length (bivalves)', 'Anterior margin', 'Posterior margin'],
  ['Spine 1 length (base to tip)', 'Spine 1 base', 'Spine 1 tip'],
  ['Spine tip spacing', 'Spine 1 tip', 'Spine 2 tip'],
  ['Aperture width between marks', 'Aperture edge 1', 'Aperture edge 2'],
  ['Umbo to ventral margin (bivalves)', 'Umbo', 'Ventral margin']
];

function setMarking(value) {
  armed = value;
  pointerStart = null;
  landmarkMark.setAttribute('aria-pressed', String(value));
  landmarkMark.textContent = value ? 'Cancel marking' : 'Mark on shell';
}

function updateMarkSelection() {
  setMarking(false);
  const marked = marks[landmarkShell.value].has(landmarkPoint.value);
  landmarkRemove.disabled = !marked;
  landmarkStatus.textContent = marked ? 'Point marked. Select Mark on shell to replace it.' : '';
}

function drawMarks() {
  markerGroup.clear();
  const slot = viewMode.value === 'reference' ? 'A' : viewMode.value === 'moving' ? 'B' : null;
  if (!slot || !$('meshLandmarks').open || !viewBounds) return;
  for (const point of marks[slot].values()) {
    const marker = new T.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(point);
    marker.scale.setScalar(viewBounds.radius * .012);
    marker.renderOrder = 1;
    markerGroup.add(marker);
  }
}

function pickLandmark(event) {
  if (!armed || !pointerStart || event.pointerId !== pointerStart.id ||
      Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
  const slot = landmarkShell.value;
  const target = group.getObjectByName(slot === 'A' ? 'reference' : 'moving');
  const rect = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new T.Vector2(
    2 * (event.clientX - rect.left) / rect.width - 1,
    1 - 2 * (event.clientY - rect.top) / rect.height
  ), camera);
  const hit = raycaster.intersectObject(target, false)[0];
  if (!hit) {
    landmarkStatus.textContent = 'Click directly on the shell surface.';
    return;
  }
  marks[slot].set(landmarkPoint.value, hit.point.clone());
  updateMarkSelection();
  updateLandmarkGraphs();
  drawMarks();
  draw();
}

function updateLandmarkGraphs() {
  if (!report) return;
  const measurements = landmarkPairs.map(([label, from, to]) => {
    const distance = slot => {
      const a = marks[slot].get(from);
      const b = marks[slot].get(to);
      return a && b ? a.distanceTo(b) : null;
    };
    const A = distance('A');
    const B = distance('B');
    return {label, from, to, A, B, ratiosToAxialSpan: {
      A: A === null ? null : A / report.shellProfiles.A.axialSpan,
      B: B === null ? null : B / report.shellProfiles.B.axialSpan
    }};
  }).filter(row => row.A !== null || row.B !== null);
  const units = report.units;
  const maximum = Math.max(1e-15, ...measurements.flatMap(row => [row.A ?? 0, row.B ?? 0]));
  const bars = $('landmarkBars');
  bars.replaceChildren();
  for (const row of measurements) {
    const block = document.createElement('section');
    const heading = document.createElement('h4');
    heading.textContent = row.label;
    block.append(heading);
    for (const slot of ['A', 'B']) {
      const line = document.createElement('p');
      const value = row[slot];
      line.append(slot + ' · ' + (value === null ? 'Unmeasured' : value.toPrecision(5) + ' (' + (row.ratiosToAxialSpan[slot] * 100).toPrecision(4) + '% of axial span)') + ' ');
      if (value !== null) {
        const bar = document.createElement('meter');
        bar.max = maximum;
        bar.value = value;
        bar.setAttribute('aria-hidden', 'true');
        bar.style.width = 'min(55%, 28rem)';
        line.append(bar);
      }
      block.append(line);
    }
    bars.append(block);
  }
  $('landmarkUnits').textContent = 'Straight-line distances in ' + units + '. All bars share the same scale.';
  $('landmarkGraphs').hidden = !measurements.length;
  report.landmarkAnalysis = {
    coordinateFrame: 'aligned reference frame',
    units,
    points: Object.fromEntries(['A', 'B'].map(slot => [
      slot, Object.fromEntries([...marks[slot]].map(([label, point]) => [label, point.toArray()]))
    ])),
    measurements
  };
  for (const slot of ['A', 'B']) {
    report.specimens[slot] = originalSpecimenProfile(slot);
    renderSpecimen(slot);
  }
  renderRatioComparison();
}

landmarkMark.addEventListener('click', () => {
  if (armed) {
    updateMarkSelection();
    return;
  }
  viewMode.value = landmarkShell.value === 'A' ? 'reference' : 'moving';
  updateView();
  setMarking(true);
  landmarkStatus.textContent = 'Click ' + landmarkPoint.value + ' on specimen ' + landmarkShell.value + '.';
});
landmarkRemove.addEventListener('click', () => {
  marks[landmarkShell.value].delete(landmarkPoint.value);
  updateMarkSelection();
  updateLandmarkGraphs();
  drawMarks();
  draw();
});
landmarkShell.addEventListener('change', updateMarkSelection);
landmarkPoint.addEventListener('change', updateMarkSelection);
$('meshLandmarks').addEventListener('toggle', () => {
  if (!$('meshLandmarks').open) updateMarkSelection();
  drawMarks();
  draw();
});

const graphMode = $('shellGraphMode');
const typeLabels = {gastropod: 'gastropod-like', bivalve: 'bivalve-like', uncertain: 'uncertain'};

function shellShape(points, tree, withProjection = false) {
  const centroid = center(points);
  const radius = rmsRadius(points, centroid);
  const centered = points.map(point => point.clone().sub(centroid));
  const covariance = [V(), V(), V()];
  for (const p of centered) {
    covariance[0].addScaledVector(p, p.x);
    covariance[1].addScaledVector(p, p.y);
    covariance[2].addScaledVector(p, p.z);
  }
  const multiply = axis => V(...covariance.map(row => row.dot(axis)));
  const major = [V(1,0,0), V(0,1,0), V(0,0,1)].map(axis => {
    for (let i = 0; i < 24; i++) axis = multiply(axis).normalize();
    return axis;
  }).sort((a, b) => b.dot(multiply(b)) - a.dot(multiply(a)))[0];
  const axial = centered.map(point => point.dot(major));
  const ordered = [...axial].sort((a, b) => a - b);
  const percentile = (list, fraction) => list[Math.floor(fraction * (list.length - 1))];
  const low = percentile(ordered, .025);
  const high = percentile(ordered, .975);
  const axialSpan = high - low;
  const radial = centered.map((point, i) => point.clone().addScaledVector(major, -axial[i]));
  const transverseRms = Math.sqrt(radial.reduce((sum, point) => sum + point.lengthSq(), 0) / points.length);
  const axialRms = Math.hypot(...axial) / Math.sqrt(points.length);
  const elongation = axialRms / Math.max(transverseRms, radius * 1e-9);
  const subset = points.filter((_, i) => i % 12 === 0);
  let best = {error: Infinity, normal: null, offset: 0};
  const reflected = V();
  function check(normal, offset) {
    let sum = 0;
    for (const point of subset) {
      reflected.copy(point).addScaledVector(normal, -2 * (point.dot(normal) - offset));
      sum += reflected.distanceToSquared(closest(tree, reflected));
    }
    const error = Math.sqrt(sum / subset.length) / radius;
    if (error < best.error) best = {error, normal, offset};
  }
  for (let i = 0; i < 72; i++) {
    const z = (i + .5) / 72;
    const r = Math.sqrt(1 - z * z);
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    const normal = V(r * Math.cos(angle), r * Math.sin(angle), z);
    for (const delta of [-.15, 0, .15]) check(normal, centroid.dot(normal) + delta * radius);
  }
  for (const step of [.15, .075, .035]) {
    const {normal, offset} = best;
    const u = normal.clone().cross(Math.abs(normal.z) < .9 ? V(0,0,1) : V(0,1,0)).normalize();
    const v = normal.clone().cross(u);
    const relativeOffset = offset - centroid.dot(normal);
    for (const axis of [u, v]) {
      for (const sign of [-1, 1]) {
        const tilted = normal.clone().addScaledVector(axis, sign * step).normalize();
        check(tilted, centroid.dot(tilted) + relativeOffset);
      }
    }
    for (const sign of [-1, 1]) check(normal, offset + sign * step * radius);
  }
  const depth = centered.map(point => point.dot(best.normal)).sort((a, b) => a - b);
  const planeDepth = percentile(depth, .975) - percentile(depth, .025);
  const type = best.error <= .045 && elongation < 1.45 ? 'bivalve'
    : best.error >= .10 && elongation >= 1.25 ? 'gastropod' : 'uncertain';
  const shape = {type, reflectionError: best.error, elongation, axialSpan, transverseRms, planeDepth};
  if (withProjection) shape.projection = projectSpecimen(points, centroid, major, multiply);
  return shape;
}

function updateShellProfile() {
  if (!report?.shellProfiles) return;
  const {A, B} = report.shellProfiles;
  const mode = graphMode.value === 'auto'
    ? A.type === B.type && A.type !== 'uncertain' ? A.type : 'general'
    : graphMode.value;
  $('shellTypeEstimate').textContent = `Shape estimate • A: ${typeLabels[A.type]} · B: ${typeLabels[B.type]}. Exploratory, unvalidated.`;
  const units = report.units;
  const general = [['Axial span (central 95%)', 'axialSpan', units],
    ['Elongation (axial ÷ transverse RMS)', 'elongation', 'ratio']];
  const rows = mode === 'gastropod' ? [...general, ['Transverse RMS radius', 'transverseRms', units]]
    : mode === 'bivalve' ? [
      ['Depth across estimated mirror plane (central 95%)', 'planeDepth', units],
      ['Axial span (central 95%)', 'axialSpan', units],
      ['Mirror mismatch (RMS ÷ shell RMS radius)', 'reflectionError', 'ratio']
    ] : [...general, ['Mirror mismatch (RMS ÷ shell RMS radius)', 'reflectionError', 'ratio']];
  const title = mode === 'general' ? 'General shape' : mode === 'gastropod' ? 'Gastropod shape' : 'Bivalve shape';
  $('shellGraphNote').textContent = title + '. Each row uses a shared scale for A and B.';
  const graph = $('shellProfileGraph');
  graph.replaceChildren();
  for (const [label, key, unit] of rows) {
    const row = document.createElement('section');
    const heading = document.createElement('h4');
    heading.textContent = label + ' · ' + unit;
    row.append(heading);
    for (const [slot, value] of [['A', A[key]], ['B', B[key]]]) {
      const line = document.createElement('p');
      line.textContent = slot + ' · ' + value.toPrecision(5) + ' ';
      const bar = document.createElement('meter');
      bar.max = Math.max(A[key], B[key], 1e-15);
      bar.value = value;
      bar.setAttribute('aria-hidden', 'true');
      bar.style.width = 'min(55%, 28rem)';
      line.append(bar);
      row.append(line);
    }
    graph.append(row);
  }
  report.shellProfileGraph = {mode, units, measurements: rows.map(([label, key, unit]) =>
    ({label, unit, A: A[key], B: B[key]}))};
}

graphMode.addEventListener('change', updateShellProfile);

function projectSpecimen(points, centroid, major, multiply) {
  const perpendicular = direction => direction.addScaledVector(major, -direction.dot(major)).normalize();
  const candidates = [V(1, 0, 0), V(0, 1, 0), V(0, 0, 1)];
  const side = candidates.map(perpendicular).map(axis => {
    for (let step = 0; step < 18; step++) axis = perpendicular(multiply(axis));
    return axis;
  }).sort((a, b) => b.dot(multiply(b)) - a.dot(multiply(a)))[0];
  const across = major.clone().cross(side).normalize();
  return points.map(point => {
    const offset = point.clone().sub(centroid);
    return [offset.dot(major), offset.dot(side), offset.dot(across)];
  });
}

function axialWidths(projection) {
  const axial = projection.map(point => point[0]).sort((a, b) => a - b);
  const low = axial[Math.floor(.025 * (axial.length - 1))];
  const high = axial[Math.floor(.975 * (axial.length - 1))];
  const sections = Array.from({length: 8}, () => []);
  for (const [x, y] of projection) {
    if (x < low || x > high) continue;
    const index = Math.min(sections.length - 1, Math.floor(sections.length * (x - low) / (high - low)));
    sections[index].push(y);
  }
  return sections.map((points, index) => {
    points.sort((a, b) => a - b);
    const last = points.length - 1;
    const width = points.length >= 12 ? points[Math.floor(.95 * last)] - points[Math.floor(.05 * last)] : null;
    return {startPercent: index * 12.5, endPercent: (index + 1) * 12.5, width};
  });
}

function formatLength(value, units) {
  const length = value.toPrecision(5) + ' ' + units;
  return units === 'mm' ? length + ' (' + (value / 10).toPrecision(5) + ' cm)' : length;
}

function svgElement(tag, attributes, caption) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (caption !== undefined) element.textContent = caption;
  return element;
}

function shellPlot(host, height, title, description) {
  const plot = svgElement('svg', {
    viewBox: '0 0 740 ' + height, role: 'img', 'aria-label': title + '. ' + description,
    'font-family': 'system-ui, sans-serif', 'font-size': 14, fill: '#183044'
  });
  plot.append(svgElement('title', {}, title));
  host.replaceChildren(plot);
  return {
    line(x1, y1, x2, y2, stroke = '#a7b6c3') {
      plot.append(svgElement('line', {x1, y1, x2, y2, stroke, 'stroke-width': 1.4}));
    },
    text(x, y, value, attributes = {}) {
      plot.append(svgElement('text', {x, y, ...attributes}, value));
    },
    dot(cx, cy, color, open = false) {
      plot.append(svgElement('circle', {
        cx, cy, r: 5.2, fill: open ? 'none' : color, stroke: color, 'stroke-width': 2
      }));
    }
  };
}

function percentAxis(ratios) {
  const peak = Math.max(.01, ...ratios.filter(value => value !== null)) * 100;
  const base = 10 ** Math.floor(Math.log10(peak / 4));
  const step = [1, 2, 2.5, 5, 10].map(value => value * base).find(value => value >= peak / 4);
  const count = Math.ceil(peak / step);
  return {maximum: count * step, ticks: Array.from({length: count + 1}, (_, index) => index * step)};
}

function renderAxialPlot(slot, widths) {
  const values = widths.map(section => section.ratioToAxialSpan);
  const {maximum, ticks} = percentAxis(values);
  const chart = shellPlot($('specimenAxialPlot' + slot), 300, 'Axial width profile',
    'Estimated widths over eight sections. Exact values are in the width table.');
  const x = percent => 96 + percent * 6.15;
  const y = percent => 238 - percent / maximum * 198;
  const yLabelCenter = (y(0) + y(maximum)) / 2;
  chart.text(27, yLabelCenter, 'Width (% of axial span)', {
    'font-weight': 650, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
    transform: 'rotate(-90 27 ' + yLabelCenter + ')'
  });
  for (const tick of ticks) {
    chart.line(x(0), y(tick), x(100), y(tick), '#dce5eb');
    chart.text(83, y(tick) + 4, String(Number(tick.toPrecision(8))), {'text-anchor': 'end'});
  }
  for (const tick of [0, 25, 50, 75, 100]) {
    chart.text(x(tick), 260, String(tick), {'text-anchor': 'middle'});
  }
  chart.line(x(0), y(0), x(100), y(0));
  chart.line(x(0), y(0), x(0), y(maximum));
  chart.text(x(50), 286, 'Position along axial span (%)', {'text-anchor': 'middle'});
  let prior = null;
  for (const {startPercent, endPercent, ratioToAxialSpan} of widths) {
    if (ratioToAxialSpan === null) {
      prior = null;
      continue;
    }
    const point = [x((startPercent + endPercent) / 2), y(ratioToAxialSpan * 100)];
    if (prior) chart.line(...prior, ...point, '#006989');
    chart.dot(...point, '#006989');
    prior = point;
  }
}

function renderRatioPlot(rows) {
  const selectedRows = rows.filter(([label]) => label !== 'Transverse RMS radius');
  const {maximum, ticks} = percentAxis(selectedRows.flatMap(([, a, b]) => [a, b]));
  const baseline = 58 + selectedRows.length * 35;
  const chart = shellPlot($('shellRatioPlot'), baseline + 57, 'Shell proportion comparison',
    'Open blue circles are specimen A. Filled orange circles are specimen B. Exact values are in the ratio table.');
  const x = ratio => 325 + ratio * 100 / maximum * 385;
  chart.dot(330, 24, '#006989', true);
  chart.text(342, 29, 'A');
  chart.dot(376, 24, '#b34a16');
  chart.text(388, 29, 'B');
  for (const tick of ticks) {
    const position = x(tick / 100);
    chart.line(position, 40, position, baseline, '#dce5eb');
    chart.text(position, baseline + 19, String(Number(tick.toPrecision(8))), {'text-anchor': 'middle'});
  }
  for (const [index, [label, a, b]] of selectedRows.entries()) {
    const y = 59 + 35 * index;
    chart.text(310, y + 4, label, {'text-anchor': 'end'});
    if (a !== null && b !== null) chart.line(x(a), y, x(b), y);
    if (b !== null) chart.dot(x(b), y, '#b34a16');
    if (a !== null) chart.dot(x(a), y, '#006989', true);
  }
  chart.text(x(maximum / 200), baseline + 43, 'Measurement (% of axial span)', {'text-anchor': 'middle'});
}

function renderAxialCaption(slot, widths) {
  const question = $('meshQuestion').value.trim();
  const specimen = selected[slot]?.title || specimenProfiles[slot].filename;
  $('specimenAxialTitle' + slot).textContent = 'Axial width profile of ' + specimen +
    (question ? ' · ' + question : '');
  const measured = widths.filter(section => section.ratioToAxialSpan !== null);
  const peak = measured.reduce((best, section) =>
    best && best.ratioToAxialSpan >= section.ratioToAxialSpan ? best : section, null);
  const finding = peak
    ? 'The widest sampled section falls at ' + peak.startPercent + '–' + peak.endPercent +
      '% along the axis and measures ' + formatPercentage(peak.ratioToAxialSpan) + ' of axial span.'
    : 'The sections have insufficient points for a width estimate.';
  $('specimenAxialCaption' + slot).textContent = finding +
    ' Dots sit at section midpoints. Width is the side-view spread between the 5th and 95th percentiles of sampled points, divided by axial span.' +
    ' Positions follow the scan’s computed axis.';
}

$('meshQuestion').addEventListener('input', () => {
  for (const slot of ['A', 'B']) {
    if (specimenProfiles[slot]) renderAxialCaption(slot, originalSpecimenProfile(slot).axialWidthProfile);
  }
});

function renderWidths(slot, widths, units) {
  renderAxialPlot(slot, widths);
  renderAxialCaption(slot, widths);
  const body = $('specimenWidthProfile' + slot);
  body.replaceChildren();
  for (const {startPercent, endPercent, width, ratioToAxialSpan} of widths) {
    appendMeasurementRow(body, startPercent + '–' + endPercent + '%', [
      width === null ? 'Insufficient points' : formatLength(width, units),
      ratioToAxialSpan === null ? '—' : formatPercentage(ratioToAxialSpan)
    ]);
  }
}

function drawSpecimenProjection(canvas, projection, axis) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const {width, height} = canvas;
  const xs = projection.map(point => point[0]);
  const lowX = Math.min(...xs);
  const highX = Math.max(...xs);
  const maxCross = Math.max(...projection.map(point => Math.max(Math.abs(point[1]), Math.abs(point[2]))));
  const scale = Math.min((width - 58) / (highX - lowX), (height - 44) / Math.max(maxCross * 2, 1e-12));
  const x = value => width / 2 + (value - (lowX + highX) / 2) * scale;
  const y = value => height / 2 - value * scale;
  context.fillStyle = '#142334';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = '#6997aa';
  context.setLineDash([6, 8]);
  context.beginPath();
  context.moveTo(20, height / 2);
  context.lineTo(width - 20, height / 2);
  context.stroke();
  context.fillStyle = '#a4e8f7';
  context.globalAlpha = .65;
  context.beginPath();
  for (const point of projection) context.rect(x(point[0]) - 1.2, y(point[axis]) - 1.2, 2.4, 2.4);
  context.fill();
  context.globalAlpha = 1;
}

function renderSpecimenRatios(slot, ratios) {
  const rows = [
    ['Transverse RMS radius', ratios.transverseRmsToAxialSpan],
    ['Depth across mirror plane', ratios.depthToAxialSpan],
    ['Widest sampled axial section', ratios.widestSectionToAxialSpan]
  ];
  const {maximum, ticks} = percentAxis([1, ...rows.map(([, ratio]) => ratio)]);
  const chart = shellPlot($('specimenRatios' + slot), 193, 'Shape proportions',
    'Each point shows a measured distance as a percentage of axial span. Exact values appear in the measurement table.');
  const x = percent => 275 + 380 * percent / maximum;
  for (const tick of ticks) {
    chart.line(x(tick), 22, x(tick), 137, '#dce5eb');
    chart.text(x(tick), 156, String(Number(tick.toPrecision(8))), {'text-anchor': 'middle'});
  }
  chart.line(x(0), 137, x(maximum), 137);
  for (const [index, [label, ratio]] of rows.entries()) {
    const y = 39 + 35 * index;
    const position = x(ratio * 100);
    chart.text(260, y + 5, label, {'text-anchor': 'end'});
    chart.dot(position, y, '#006989');
    chart.text(position + 12, y + 5, formatPercentage(ratio));
  }
  chart.text(x(maximum / 2), 181, 'Measurement (% of axial span)', {'text-anchor': 'middle'});
}

const specimenProfiles = {A: null, B: null};
const specimenFields = Object.fromEntries(['A', 'B'].map(slot => [
  slot, [...$('specimenFields' + slot).querySelectorAll('[data-field]')]
]));

function specimenRecord(slot) {
  const record = Object.fromEntries(specimenFields[slot].map(input => [
    input.dataset.field, input.value.trim() || null
  ]));
  const calibration = Number(record.mmPerMeshUnit);
  record.mmPerMeshUnit = Number.isFinite(calibration) && calibration > 0 ? calibration : null;
  return record;
}

function originalSpecimenProfile(slot) {
  const profile = specimenProfiles[slot];
  const record = specimenRecord(slot);
  const factor = record.mmPerMeshUnit ?? 1;
  const shape = profile.shape;
  return {
    version: 1, specimen: slot, filename: profile.filename, record,
    shellTypeEstimate: shape.type,
    dimensions: {
      units: record.mmPerMeshUnit ? 'mm' : 'mesh units',
      axialSpan95: shape.axialSpan * factor,
      transverseRmsRadius: shape.transverseRms * factor,
      depthAcrossMirrorPlane95: shape.planeDepth * factor,
      widestAxialSection: profile.widestWidth * factor
    },
    axialWidthProfile: profile.widths.map(({startPercent, endPercent, width}) => ({
      startPercent, endPercent, width: width === null ? null : width * factor,
      ratioToAxialSpan: width === null ? null : width / shape.axialSpan
    })),
    landmarkMeasurements: (report?.landmarkAnalysis?.measurements ?? [])
      .filter(row => row.ratiosToAxialSpan[slot] !== null)
      .map(row => {
        const ratio = row.ratiosToAxialSpan[slot];
        return {label: row.label, distance: ratio * shape.axialSpan * factor, ratioToAxialSpan: ratio};
      }),
    ratios: {
      transverseRmsToAxialSpan: shape.transverseRms / shape.axialSpan,
      depthToAxialSpan: shape.planeDepth / shape.axialSpan,
      widestSectionToAxialSpan: profile.widestWidth / shape.axialSpan,
      elongation: shape.elongation,
      normalizedMirrorMismatch: shape.reflectionError
    }
  };
}

function formatPercentage(ratio) {
  return (ratio * 100).toLocaleString(undefined, {maximumSignificantDigits: 5}) + '%';
}

function appendMeasurementRow(body, label, values) {
  const row = body.insertRow();
  const heading = document.createElement('th');
  heading.scope = 'row';
  heading.textContent = label;
  row.append(heading);
  for (const value of values) row.insertCell().textContent = value;
}

function renderRatioComparison() {
  const body = $('shellRatioComparison');
  body.replaceChildren();
  const {A, B} = report.specimens;
  const rows = [
    ['Transverse RMS radius', A.ratios.transverseRmsToAxialSpan, B.ratios.transverseRmsToAxialSpan],
    ['Depth across mirror plane', A.ratios.depthToAxialSpan, B.ratios.depthToAxialSpan],
    ['Widest sampled axial section', A.ratios.widestSectionToAxialSpan, B.ratios.widestSectionToAxialSpan],
    ...(report.landmarkAnalysis?.measurements ?? []).map(({label, ratiosToAxialSpan}) =>
      [label, ratiosToAxialSpan.A, ratiosToAxialSpan.B])
  ];
  renderRatioPlot(rows);
  for (const [label, a, b] of rows) {
    const difference = a === null || b === null ? '—' :
      ((b - a) * 100).toLocaleString(undefined, {maximumFractionDigits: 3, signDisplay: 'exceptZero'});
    appendMeasurementRow(body, label, [
      a === null ? 'Unmeasured' : formatPercentage(a),
      b === null ? 'Unmeasured' : formatPercentage(b),
      difference
    ]);
  }
}

function renderSpecimen(slot) {
  const panel = $('specimenProfile' + slot);
  panel.hidden = !specimenProfiles[slot];
  if (panel.hidden) return;
  const {filename, dimensions, ratios, shellTypeEstimate, landmarkMeasurements, axialWidthProfile} = originalSpecimenProfile(slot);
  $('specimenSummary' + slot).textContent = filename + ' · ' + typeLabels[shellTypeEstimate] +
    ' · axial span ' + formatLength(dimensions.axialSpan95, dimensions.units);
  const projection = specimenProfiles[slot].projection;
  drawSpecimenProjection($('specimenSide' + slot), projection, 1);
  drawSpecimenProjection($('specimenCross' + slot), projection, 2);
  renderSpecimenRatios(slot, ratios);
  renderWidths(slot, axialWidthProfile, dimensions.units);
  const values = $('specimenValues' + slot);
  values.replaceChildren();
  const rows = [
    ['Axial span (central 95%)', dimensions.axialSpan95, 1],
    ['Transverse RMS radius', dimensions.transverseRmsRadius, ratios.transverseRmsToAxialSpan],
    ['Depth across mirror plane (central 95%)', dimensions.depthAcrossMirrorPlane95, ratios.depthToAxialSpan],
    ['Widest sampled axial section (side view)', dimensions.widestAxialSection, ratios.widestSectionToAxialSpan],
    ...landmarkMeasurements.map(({label, distance, ratioToAxialSpan}) => [label, distance, ratioToAxialSpan])
  ];
  for (const [label, value, ratio] of rows) {
    appendMeasurementRow(values, label, [
      formatLength(value, dimensions.units),
      ratio.toPrecision(5) + ' (' + formatPercentage(ratio) + ')'
    ]);
  }
}

function measureSpecimen(slot, file, geometry, tree) {
  const {projection, ...shape} = shellShape(sample(geometry, 5000), tree, true);
  if (!(shape.axialSpan > 0)) throw Error('Specimen has no measurable axial span.');
  const widths = axialWidths(projection);
  const widestWidth = Math.max(0, ...widths.map(section => section.width ?? 0));
  specimenProfiles[slot] = {filename: file.name, shape, projection, widths, widestWidth};
  renderSpecimen(slot);
  $('specimenStatus' + slot).textContent = '';
  return shape;
}

function downloadJSON(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function replaceSpecimen(slot, selection) {
  if (selected[slot] === selection) return;
  if (selected[slot]) {
    for (const input of specimenFields[slot]) input.value = '';
  }
  selected[slot] = selection;
  specimenProfiles[slot] = null;
  renderSpecimen(slot);
  $('specimenStatus' + slot).textContent = '';
}

async function runSpecimen(slot) {
  busy = true;
  updateControls();
  const message = $('specimenStatus' + slot);
  let geometry;
  try {
    message.textContent = 'Measuring specimen ' + slot + '…';
    await pause();
    const file = await readSelection(selected[slot]);
    geometry = await load(file);
    measureSpecimen(slot, file, geometry, new MeshBVH(geometry));
    $('specimenHeading' + slot).focus();
  } catch (error) {
    message.textContent = 'Specimen analysis failed: ' + error.message;
  } finally {
    geometry?.dispose();
    busy = false;
    updateControls();
  }
}

for (const slot of ['A', 'B']) {
  $('specimenRun' + slot).addEventListener('click', () => runSpecimen(slot));
  $('specimenExport' + slot).addEventListener('click', () =>
    downloadJSON(originalSpecimenProfile(slot), 'shell-specimen-' + slot + '.json'));
  $('specimenFields' + slot).addEventListener('input', event => {
    renderSpecimen(slot);
    if (!report) return;
    if (event.target.dataset.field === 'mmPerMeshUnit') clearResults();
    else report.specimens[slot] = originalSpecimenProfile(slot);
  });
}

function updateControls() {
  for (const slot of ['A', 'B']) {
    inputs[slot].disabled = busy;
    $('specimenRun' + slot).disabled = busy || !selected[slot];
    $('specimenFields' + slot).disabled = busy;
    $('example' + slot).disabled = busy;
  }
  scale.disabled = pair.disabled = busy;
  run.disabled = busy || !selected.A || !selected.B;
}

function clearResults() {
  const hadLandmarks = Boolean(report?.landmarkAnalysis);
  report = null;
  if (hadLandmarks) {
    renderSpecimen('A');
    renderSpecimen('B');
  }
  marks.A.clear();
  marks.B.clear();
  markerGroup.clear();
  updateMarkSelection();
  $('landmarkGraphs').hidden = true;
  exp.disabled = true;
  $('meshStats').textContent = '';
  $('meshResult').hidden = true;
  status.textContent = selected.A && selected.B ? 'Ready to align.' : 'Choose two specimens.';
}

function selectExample(slot) {
  inputs[slot].value = '';
  replaceSpecimen(slot, examples[slot]);
  $('selection' + slot).textContent = examples[slot].title + ' selected.';
}

async function readSelection(selection) {
  if (selection instanceof File) return selection;
  if (typeof DecompressionStream === 'undefined') {
    throw Error('This browser cannot open the compressed examples. Use a current browser or upload an OBJ file.');
  }
  const path = '/shell-samples/' + selection.filename + '.gz';
  const urls = selection.parts
    ? Array.from({length: selection.parts}, (_, index) => path + '.' + (index + 1) + '.bin')
    : [path];
  const parts = await Promise.all(urls.map(async url => {
    const response = await fetch(url);
    if (!response.ok) {
      throw Error('Could not load ' + selection.title + ' (HTTP ' + response.status + ').');
    }
    return response.blob();
  }));
  const compressed = new Blob(parts);
  const mesh = await new Response(
    compressed.stream().pipeThrough(new DecompressionStream('gzip'))
  ).blob();
  return new File([mesh], selection.filename);
}

for (const slot of ['A', 'B']) {
  inputs[slot].addEventListener('change', () => {
    replaceSpecimen(slot, inputs[slot].files[0] ?? null);
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
    const meshA = specimenRecord('A').mmPerMeshUnit;
    const meshB = specimenRecord('B').mmPerMeshUnit;
    const calibrated = Boolean(meshA && meshB);
    if (mode === 'rigid' && Boolean(meshA) !== Boolean(meshB)) {
      throw Error('Calibrate both meshes for original-size comparison, or choose Match sizes.');
    }
    status.textContent = 'Measuring specimens before alignment…';
    await pause();
    const rawTreeA = new MeshBVH(a);
    const rawTreeB = new MeshBVH(b);
    const originalA = specimenProfiles.A?.shape ?? measureSpecimen('A', fa, a, rawTreeA);
    const originalB = specimenProfiles.B?.shape ?? measureSpecimen('B', fb, b, rawTreeB);
    const calibrationA = calibrated ? meshA : 1;
    const calibrationB = calibrated ? meshB : 1;
    if (calibrationA !== 1) a.scale(calibrationA, calibrationA, calibrationA);
    if (calibrationB !== 1) b.scale(calibrationB, calibrationB, calibrationB);
    const sa = sample(a, 1800);
    const sb = sample(b, 1800);
    const ca = center(sa);
    const cb = center(sb);
    const ra = rmsRadius(sa, ca);
    const rb = rmsRadius(sb, cb);
    if (!ra || !rb) throw Error('Degenerate mesh.');
    const factor = mode === 'normalized' ? ra / rb : 1;
    const tree = calibrationA === 1 ? rawTreeA : new MeshBVH(a);
    const originalTreeB = calibrationB === 1 ? rawTreeB : new MeshBVH(b);
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
    const profileAtScale = (shape, factor) => ({
      ...shape, axialSpan: shape.axialSpan * factor, transverseRms: shape.transverseRms * factor,
      planeDepth: shape.planeDepth * factor
    });
    const shellProfiles = {
      A: profileAtScale(originalA, calibrationA),
      B: profileAtScale(originalB, calibrationB * factor)
    };
    const cap = Math.max(sB.p95, ra * 1e-9);
    status.textContent='Generating heat map…';await pause();$('meshResult').hidden=false;show(a,b,tree,cap);const units=calibrated?'mm':mode==='normalized'?'reference mesh units (B rescaled)':'input mesh units';$('meshLegend').textContent='Blue = 0; red ≥ '+cap.toPrecision(5)+' '+units+' (95th-percentile display cap).';$('meshStats').textContent='B → A: mean '+sB.mean.toPrecision(5)+'; RMS '+sB.rms.toPrecision(5)+'; P95 '+sB.p95.toPrecision(5)+'; sampled max '+sB.max.toPrecision(5)+'\nA → B: mean '+sA.mean.toPrecision(5)+'; RMS '+sA.rms.toPrecision(5)+'; P95 '+sA.p95.toPrecision(5)+'; sampled max '+sA.max.toPrecision(5)+'\nUnits: '+units+'; B scale factor: '+factor.toPrecision(8)+'\n5,000 area-distributed samples per direction. Inspect alignment before interpretation.';report={version:1,reference:fa.name,moving:fb.name,mode,units,scaleFactor:factor,transformColumnMajor:best.toArray(),displayCap:cap,summary:{BtoA:sB,AtoB:sA},samples:[...pB.map((p,i)=>['BtoA',...p.toArray(),dB[i]]),...pA.map((p,i)=>['AtoB',...p.toArray(),dA[i]])]};
    report.calibration = {applied: calibrated, mmPerMeshUnit: {A: meshA, B: meshB}};
    report.transformFrame = calibrated ? 'calibrated input B (mm) to calibrated reference A (mm)' : 'input B mesh units to reference A mesh units';
    report.transformInputBToOutputColumnMajor = best.clone().scale(V(calibrationB, calibrationB, calibrationB)).toArray();
    report.specimens = {A: originalSpecimenProfile('A'), B: originalSpecimenProfile('B')};
    renderRatioComparison();
    updateCaption();
    report.shellProfiles = shellProfiles;
    graphMode.value = 'auto';
    updateShellProfile();
    exp.disabled=false;status.textContent='Alignment complete.';
    $('meshResultTitle').focus();} catch (e) {
    $('meshResult').hidden = true;
    status.textContent = 'Analysis failed: ' + e.message;
  } finally {
    busy = false;
    updateControls();
  }
}
exp.onclick = () => { if (report) downloadJSON(report, 'shell-surface-analysis.json'); };
clearResults();
updateControls();
