// Exercises the real app with a DOM/canvas host. This does not verify browser layout or PNG rendering.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as engine from '../dist/engine.js';
import * as world from '../dist/world.js';
import * as terrain from '../dist/terrain.js';
import * as chapters from '../dist/chapters.js';

const dist = new URL('../dist/', import.meta.url);
const html = fs.readFileSync(new URL('lab.html', dist), 'utf8');
const source = fs.readFileSync(new URL('lab.js', dist), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('assets/manifest.json', dist), 'utf8'));
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));

function imageSize(path) {
  path=manifest.delivery?.[path]??path;
  const bytes = fs.readFileSync(new URL('assets/' + path, dist));
  if(path.endsWith('.webp')){assert.equal(bytes.toString('ascii',12,16),'VP8L');const bits=bytes.readUInt32LE(21);return {width:(bits&16383)+1,height:((bits>>>14)&16383)+1};}
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function host({ badManifest = false, failedImage = false, canvasBox } = {}) {
  const nodes = new Map(), listeners = new Map(), frames = [], calls = [], operations = [];
  const add = (key, fn) => { const list = listeners.get(key) || []; list.push(fn); listeners.set(key, list); };
  let now = 100, transform = { x: 0, y: 0, sx: 1, sy: 1 }, stack = [], scene;
  const ctx = {
    setTransform(a, _b, _c, d, e, f) { transform = { x: e, y: f, sx: a, sy: d }; },
    save() { stack.push({ ...transform }); }, restore() { transform = stack.pop(); },
    translate(x, y) { transform.x += x * transform.sx; transform.y += y * transform.sy; },
    scale(x, y) { transform.sx *= x; transform.sy *= y; }, beginPath() {}, ellipse() {}, fill() {},
    fillRect(...args) { operations.push({ kind: 'fillRect', color: this.fillStyle, args, scaleX: transform.sx, scaleY: transform.sy }); },
    strokeRect() {}, moveTo() {}, lineTo() {}, stroke() {}, setLineDash() {}, fillText() {},
    createRadialGradient() { return { addColorStop() {} }; },
    drawImage(image, ...args) {
      const call = { kind: 'image', image: image.src, args, x: transform.x, y: transform.y, scaleX: transform.sx, scaleY: transform.sy, smoothing: this.imageSmoothingEnabled };
      calls.push(call); operations.push(call);
    },
  };
  class Element {
    constructor(id, tag = '') {
      const attributes = attrs(tag);
      this.id = id; this.tagName = tag.match(/^<(\w+)/)?.[1].toUpperCase() || 'DIV';
      this.value = attributes.value ?? (id === 'actor' ? 'hunter' : '');
      this.hidden = /\shidden(?:\s|>)/.test(tag); this.checked = false; this.textContent = ''; this.style = {}; this.children = [];
      this.dataset = Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5), value]));
      const classes = new Set((attributes.class || '').split(' '));
      this.classList = { toggle(name, force) { if (force) classes.add(name); else classes.delete(name); } };
      this.attributes = attributes;
    }
    addEventListener(name, fn) { add(this.id + ':' + name, fn); }
    setAttribute(key, value) { this.attributes[key] = value; }
    replaceChildren(...children) { this.children = children; }
    focus() { document.activeElement = this; }
    setPointerCapture() {}
  }
  for (const match of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)) nodes.set(match[1], new Element(match[1], match[0]));
  const directions = [...html.matchAll(/<button[^>]*data-dir="[^"]+"[^>]*>/g)].map((match, index) => new Element('dir-' + index, match[0]));
  const canvas = nodes.get('arena');
  canvas.width = Number(canvas.attributes.width); canvas.height = Number(canvas.attributes.height);
  canvas.getContext = () => ctx;
  canvas.getBoundingClientRect = () => canvasBox ?? ({ left: 0, top: 0, width: 1200, height: 760 });
  const document = {
    activeElement: null, hidden: false,
    getElementById(id) { assert.ok(nodes.has(id), 'Missing DOM ID: ' + id); return nodes.get(id); },
    createElement(tag) { return new Element('option', '<' + tag + '>'); },
    querySelectorAll(selector) { assert.equal(selector, '[data-dir]'); return directions; },
    addEventListener(name, fn) { add('document:' + name, fn); },
  };
  class Image {
    set src(path) {
      this._src = path.replace(/\.webp$/,'.png');
      const dimensions = imageSize(path.replace(/^assets\//, ''));
      this.naturalWidth = dimensions.width; this.naturalHeight = dimensions.height;
      queueMicrotask(() => failedImage ? this.onerror() : this.onload());
    }
    get src() { return this._src; }
  }
  const data = structuredClone(manifest);
  if (badManifest) data.clips.hunter_walk.frames[0].w = 999999;
  const context = vm.createContext({
    console, document, Image,
    window: { addEventListener(name, fn) { add('window:' + name, fn); } },
    fetch: async () => ({ ok: true, json: async () => data }),
    requestAnimationFrame(fn) { frames.push(fn); },
  });
  const module = new vm.SourceTextModule(source, { context });
  const engineModule = new vm.SyntheticModule(Object.keys(engine), function () {
    for (const [key, value] of Object.entries(engine)) this.setExport(key, key === 'makeState' ? (...args) => (scene = value(...args)) : value);
  }, { context });
  const worldModule = new vm.SyntheticModule(Object.keys(world), function () { for (const [key, value] of Object.entries(world)) this.setExport(key, value); }, { context });
  const terrainModule = new vm.SyntheticModule(Object.keys(terrain), function () { for (const [key, value] of Object.entries(terrain)) this.setExport(key, value); }, { context });
  const chapterModule=new vm.SyntheticModule(Object.keys(chapters),function(){for(const [key,value]of Object.entries(chapters))this.setExport(key,value);},{context});
  await module.link(specifier => {
    specifier = specifier.split('?')[0];
    if(specifier==='./chapters.js')return chapterModule;
    if (specifier === './engine.js') return engineModule;
    if (specifier === './world.js') return worldModule;
    assert.equal(specifier, './terrain.js'); return terrainModule;
  });
  await module.evaluate();
  await new Promise(resolve => setImmediate(resolve));
  const api = {
    nodes, directions, calls, operations,
    get state() { return scene; },
    emit(id, name, event = {}) { for (const fn of listeners.get(id + ':' + name) || []) fn({ target: nodes.get(id), preventDefault() {}, ...event }); },
    tick(seconds = .05) { now += seconds * 1000; frames.shift()(now); },
    run(seconds) { for (let i = 0; i < Math.ceil(seconds / .05); i++) this.tick(.05); },
    latest(image) { return calls.filter(call => call.image === 'assets/' + image && call.args.length === 8).at(-1); },
  };
  api.tick(0);
  return api;
}

test('all 2682 frames use valid explicit source rectangles and local pivots', () => {
  // Alpha 0.106 adds 45 species and 0.107 adds 26: 15 clips and 25 source poses each.
  assert.equal(Object.keys(manifest.clips).length, 415 + (45 + 26) * 15);
  assert.equal(Object.values(manifest.clips).reduce((sum, clip) => sum + clip.frames.length, 0), 907 + (45 + 26) * 25);
  for (const clip of Object.values(manifest.clips)) {
    const { width, height } = imageSize(clip.image);
    assert.deepEqual(engine.validateClip(clip, width, height), { valid: true, errors: [] });
    for (const frame of clip.frames) assert.ok(frame.bodyHeight > 0);
    for (let i = 0; i < clip.frames.length; i++) for (let j = i + 1; j < clip.frames.length; j++) {
      const a = clip.frames[i], b = clip.frames[j];
      if (clip.sourceColumns?.[i] === clip.sourceColumns?.[j] && clip.sourceColumns) { assert.deepEqual(a, b, 'reused source pose must be identical'); continue; }
      assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, clip.id + ': neighboring frame overlap');
    }
  }
});

test('boot loads every delivered image and draws actual atlas rectangles', async () => {
  const ui = await host();
  assert.equal(ui.nodes.get('loading').hidden, true);
  const draw = ui.latest('hunter_walk.png');
  assert.ok(draw);
  const f = manifest.clips.hunter_walk.frames[0];
  assert.deepEqual(draw.args.slice(0, 4), [f.x, f.y, f.w, f.h]);
  // The camera keeps the player 60% down the 380px canvas.
  assert.equal(draw.x, 300); assert.equal(draw.y, 380 * .6);
});

test('inspect pause, scrubbing and stepping select real source frames', async () => {
  const ui = await host();
  ui.emit('inspect-mode', 'click'); ui.tick();
  ui.nodes.get('frame').value = '4'; ui.emit('frame', 'input'); ui.tick();
  const f4 = manifest.clips.hunter_walk.frames[4];
  assert.deepEqual(ui.latest('hunter_walk.png').args.slice(0, 4), [f4.x, f4.y, f4.w, f4.h]);
  ui.run(.5);
  assert.equal(ui.nodes.get('frame-label').textContent, '5 / 6');
  ui.emit('step', 'click'); ui.tick();
  assert.equal(ui.nodes.get('frame-label').textContent, '6 / 6');
  ui.nodes.get('actor').value = 'bulwark'; ui.emit('actor', 'change');
  ui.nodes.get('clip').value = 'enemy_bulwark_attack'; ui.emit('clip', 'change'); ui.tick();
  assert.ok(ui.latest('enemy_bulwark_attack.png'));
});

test('two attacks play the start of death sequence instead of skipping to the corpse', async () => {
  const ui = await host();
  ui.emit('attack', 'click'); ui.run(.75);
  ui.emit('attack', 'click'); ui.run(.25);
  assert.equal(ui.nodes.get('kill-count').textContent, '2');
  const draws = ui.calls.filter(call => call.image === 'assets/enemy_skitter_hurt_death.png' && call.args.length === 8).slice(-2);
  const frame = manifest.clips.enemy_skitter_hurt_death.frames[0];
  for (const draw of draws) assert.deepEqual(draw.args.slice(0, 4), [frame.x, frame.y, frame.w, frame.h]);
  ui.run(.4);
  const last = manifest.clips.enemy_skitter_hurt_death.frames[3];
  assert.deepEqual(ui.latest('enemy_skitter_hurt_death.png').args.slice(0, 4), [last.x, last.y, last.w, last.h]);
});

test('screen click becomes a fixed world destination while the camera scrolls', async () => {
  const ui = await host();
  ui.emit('arena', 'pointerdown', { clientX: 1200, clientY: 400 }); ui.run(3);
  const position = ui.state.player.x;
  assert.ok(position <= 2400 && position > 2392);
  assert.equal(ui.latest('hunter_walk.png').x, 300);
  ui.run(.5);
  assert.equal(ui.state.player.x, position);
  assert.match(ui.nodes.get('frame-readout').textContent, /1\/6$/);
});

test('button Space remains native and older pointer release does not stop active touch', async () => {
  const ui = await host();
  let prevented = false;
  ui.emit('document', 'keydown', { target: ui.nodes.get('inspect-mode'), key: ' ', preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  ui.emit(ui.directions[1].id, 'pointerdown', { pointerId: 1 });
  ui.emit(ui.directions[3].id, 'pointerdown', { pointerId: 2 });
  ui.emit(ui.directions[1].id, 'pointerup', { pointerId: 1 }); ui.run(.2);
  assert.ok(ui.state.player.x > 1800);
  ui.emit(ui.directions[3].id, 'pointerup', { pointerId: 2 }); ui.run(.2);
  assert.match(ui.nodes.get('frame-readout').textContent, /1\/6$/);
});

test('HP zero freezes hit frame and reset restores the combat scene', async () => {
  const ui = await host();
  for (let i = 0; i < 10; i++) ui.emit('hit', 'click');
  ui.tick(); assert.equal(ui.nodes.get('hp-text').textContent, '0');
  assert.match(ui.nodes.get('hint').textContent, /다시 배치/);
  assert.ok(ui.latest('hunter_hit.png'));
  ui.emit('reset', 'click'); ui.tick();
  assert.equal(ui.nodes.get('hp-text').textContent, '100');
  assert.equal(ui.nodes.get('kill-count').textContent, '0');
});

test('slash arc flips opposite to the actor sprite and stays in front in both directions', async () => {
  const ui = await host();
  ui.emit('attack', 'click'); ui.run(.3);
  let hunter = ui.latest('hunter_attack.png'), fx = ui.latest('fx_cleave_sequence.png');
  assert.ok(hunter.scaleX > 0 && fx.scaleX < 0);
  assert.ok(fx.x > hunter.x);
  ui.run(.45);
  ui.emit('document', 'keydown', { key: 'a', target: ui.nodes.get('arena') }); ui.run(.1);
  ui.emit('document', 'keyup', { key: 'a' });
  ui.emit('attack', 'click'); ui.run(.3);
  hunter = ui.latest('hunter_attack.png'); fx = ui.latest('fx_cleave_sequence.png');
  assert.ok(hunter.scaleX < 0 && fx.scaleX > 0);
  assert.ok(fx.x < hunter.x);
});

test('camera moves the terrain while player remains centered and enemy total reflects the expanded map', async () => {
  const ui = await host();
  const ground = () => ui.calls.filter(call => call.image === 'assets/' + manifest.environment).at(-1);
  const initial = ground();
  ui.emit('document', 'keydown', { key: 'd', target: ui.nodes.get('arena') }); ui.run(4);
  ui.emit('document', 'keyup', { key: 'd' });
  assert.equal(ui.latest('hunter_walk.png').x, 300);
  assert.notEqual(ground().x, initial.x);
  assert.ok(ui.state.player.x > 2400);
  assert.equal(ui.nodes.get('enemy-total').textContent, '/ 56');
  ui.emit('reset', 'click'); ui.tick();
  assert.equal(ui.state.player.x, 1800);
  assert.equal(ground().x, initial.x);
});

test('scaled letterboxed touch coordinates include the scrolled world offset', async () => {
  const ui = await host({ canvasBox: { left: 20, top: 30, width: 600, height: 450 } });
  ui.emit('document', 'keydown', { key: 'd', target: ui.nodes.get('arena') }); ui.run(1);
  ui.emit('document', 'keyup', { key: 'd' });
  const before = ui.state.player.x;
  // Scale .5; picture top=65. The player stands 60% down the 760px view (y=456),
  // so screen point (900,456) is 300 world pixels ahead on the same row.
  ui.emit('arena', 'pointerdown', { clientX: 470, clientY: 65 + 456 / 2 }); ui.run(1.5);
  assert.ok(ui.state.player.x > before + 292 && ui.state.player.x <= before + 300);
  assert.equal(ui.state.player.y, 1160);
});

test('terrain and actors share the same pixel grid and receive lighting together before the minimap', async () => {
  const ui = await host();
  assert.equal(ui.nodes.get('arena').width, 600);
  assert.equal(ui.nodes.get('arena').height, 380);
  const floor = ui.calls.find(call => call.image === 'assets/' + manifest.environment);
  assert.equal(Math.abs(floor.scaleX), .5); assert.equal(Math.abs(floor.scaleY), .5);
  assert.equal(floor.smoothing, false);
  const hunter = ui.latest('hunter_walk.png');
  assert.equal(hunter.smoothing, false);
  assert.equal(hunter.x, 300); assert.equal(hunter.y, 380 * .6);
  const ambientIndex = ui.operations.findIndex(op => op.kind === 'fillRect' && op.color === '#d6c29a0c');
  const actorIndex = ui.operations.indexOf(hunter);
  const minimapIndex = ui.operations.findIndex(op => op.kind === 'fillRect' && op.color === '#4b5149');
  assert.ok(actorIndex < ambientIndex && ambientIndex < minimapIndex);
  assert.deepEqual(ui.operations[ambientIndex].args, [0, 0, 1200, 760]);
  assert.equal(ui.operations[ambientIndex].scaleX, .5);
});

test('terrain texture is repeated at fixed size and never stretched to fill the world', async () => {
  const ui = await host();
  const floorCalls = () => ui.calls.filter(call => call.image === 'assets/' + manifest.environment);
  assert.ok(floorCalls().length >= 6);
  for (const call of floorCalls()) assert.deepEqual(call.args, [-256, -256, 512, 512]);
  ui.emit('document', 'keydown', { key: 'd', target: ui.nodes.get('arena') }); ui.run(3);
  ui.emit('document', 'keyup', { key: 'd' });
  for (const call of floorCalls()) assert.equal(call.args[2], 512);
  const size = imageSize(manifest.environment);
  assert.ok(size.width >= 512 && size.height >= 512);
  assert.ok(ui.calls.some(call => call.image === 'assets/' + manifest.decorations.image));
});

test('invalid frame coordinates and image failures stay behind a readable error banner', async () => {
  for (const options of [{ badManifest: true }, { failedImage: true }]) {
    const ui = await host(options);
    assert.equal(ui.nodes.get('loading').hidden, false);
    assert.match(ui.nodes.get('loading').textContent, /새로고침/);
    assert.equal(ui.calls.length, 0);
  }
});


test('new monsters can be selected and scrubbed in the delivered WebP asset inspector',async()=>{
 const ui=await host();ui.emit('inspect-mode','click');ui.nodes.get('actor').value='frost_wisp';ui.emit('actor','change');ui.nodes.get('clip').value=manifest.directions.frost_wisp.attack.s;ui.emit('clip','change');ui.nodes.get('frame').value='1';ui.emit('frame','input');ui.tick();
 const clip=manifest.clips[manifest.directions.frost_wisp.attack.s],f=clip.frames[1];assert.match(ui.nodes.get('clip-info').textContent,/빙결 수정 정령/);assert.deepEqual(ui.latest(clip.image).args.slice(0,4),[f.x,f.y,f.w,f.h]);
});
