import {MONSTERS} from './chapters.js?v=0.148.13';
import { makeState, advance, triggerAttack, triggerHit, resetState, frameIndex, frameRect, validateClip } from './engine.js?v=0.148.13';
import { WORLD_BOUNDS, VIEWPORT, cameraFor, screenToWorld, visibleInCamera } from './world.js?v=0.148.13';
import { visibleTiles, createDecorations } from './terrain.js?v=0.148.13';

const $ = id => document.getElementById(id);
const canvas = $('arena');
const ctx = canvas.getContext('2d');
const state = makeState(WORLD_BOUNDS);
const decorations = createDecorations(state.bounds);
const viewport = VIEWPORT;
let camera = cameraFor(state.player, state.bounds, viewport);
const images = new Map();
const keys = new Set();
let manifest, ready = false, mode = 'combat', rate = 1, target = null, touch = null;
let selected = 'hunter_walk', inspectTime = 0, playing = true, previous = 0;
let showPivots = false, showRange = false;
let activeTouchPointerId = null;
const names = { hunter: '사냥꾼', skitter: '갑각충', bulwark: '중갑 괴수', spitter: '포격충', fx: '베기 효과' };

for(const [id,design] of Object.entries(MONSTERS))names[id]=design.name;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다: ' + src));
    image.src = src;
  });
}

async function loadAssets() {
  try {
    const response = await fetch('assets/manifest.json',{cache:'no-cache'});
    if (!response.ok) throw new Error('어셋 목록을 불러오지 못했습니다.');
    manifest = await response.json();
    const paths = new Set([manifest.environment, manifest.decorations.image, manifest.loot, ...Object.values(manifest.clips).map(clip => clip.image)]);
    await Promise.all([...paths].map(async path => images.set(path, await loadImage('assets/' + (manifest.delivery?.[path]??path)))));
    for (const clip of Object.values(manifest.clips)) {
      const image = images.get(clip.image);
      const result = validateClip(clip, image.naturalWidth, image.naturalHeight);
      if (!result.valid) throw new Error(clip.name + ': ' + result.errors.join(', '));
    }
    const propsImage = images.get(manifest.decorations.image);
    const propsValidation = validateClip(manifest.decorations, propsImage.naturalWidth, propsImage.naturalHeight);
    if (!propsValidation.valid) throw new Error('지형 장식: ' + propsValidation.errors.join(', '));
    ready = true;
    $('loading').hidden = true;
    $('actor').replaceChildren(...[...new Set(Object.values(manifest.clips).map(c=>c.actor))].map(actor=>{const option=document.createElement('option');option.value=actor;option.textContent=names[actor]??actor;return option;}));
    populateClips();
    canvas.focus({ preventScroll: true });
  } catch (error) {
    $('loading').textContent = error.message + ' 페이지를 새로고침해 주세요.';
  }
}

function populateClips() {
  if (!ready) return;
  const actor = $('actor').value;
  const clips = Object.values(manifest.clips).filter(clip => clip.actor === actor);
  $('clip').replaceChildren(...clips.map(clip => {
    const option = document.createElement('option');
    option.value = clip.id; option.textContent = clip.name;
    return option;
  }));
  selected = clips[0].id;
  $('clip').value = selected;
  resetInspect();
}

function resetInspect() {
  inspectTime = 0;
  const clip = manifest.clips[selected];
  $('frame').max = String(clip.frames.length - 1);
  $('frame').value = '0';
  $('clip-info').textContent = (names[clip.actor]??clip.actor) + ' · ' + clip.name + '\n' + clip.frames.length + '프레임 / ' + clip.fps + 'fps · 원본 이미지 재생';
}

function setMode(value) {
  mode = value; keys.clear(); touch = null; target = null; activeTouchPointerId = null;
  $('combat-mode').classList.toggle('selected', mode === 'combat');
  $('inspect-mode').classList.toggle('selected', mode === 'inspect');
  $('combat-mode').setAttribute('aria-pressed', String(mode === 'combat'));
  $('inspect-mode').setAttribute('aria-pressed', String(mode === 'inspect'));
  $('combat-tools').hidden = mode !== 'combat';
  $('inspect-tools').hidden = mode !== 'inspect';
  $('scene-mode').textContent = mode === 'combat' ? '전투 테스트' : '동작 검사';
  $('hint').textContent = mode === 'combat' ? 'WASD / 방향키 이동 · SPACE 베기 · 바닥 클릭 이동' : '동작 선택 · 일시 정지 · 프레임 슬라이더로 자세 비교';
}

function attack() { if (ready && mode === 'combat') { target = null; triggerAttack(state); } }
function hit() { if (ready && mode === 'combat') triggerHit(state); }
$('attack').addEventListener('click', attack);
$('touch-attack').addEventListener('click', attack);
$('hit').addEventListener('click', hit);
$('reset').addEventListener('click', () => { resetState(state); target = null; keys.clear(); touch = null; });
$('combat-mode').addEventListener('click', () => setMode('combat'));
$('inspect-mode').addEventListener('click', () => setMode('inspect'));
$('actor').addEventListener('change', populateClips);
$('clip').addEventListener('change', () => { selected = $('clip').value; resetInspect(); });
$('speed').addEventListener('input', () => { rate = Number($('speed').value); $('speed-label').textContent = rate.toFixed(2).replace(/0$/, '') + '×'; });
$('pivots').addEventListener('change', () => { showPivots = $('pivots').checked; });
$('range').addEventListener('change', () => { showRange = $('range').checked; });
$('play').addEventListener('click', () => { playing = !playing; updatePlay(); });
function updatePlay() { $('play').textContent = playing ? '일시 정지' : '재생'; $('play').setAttribute('aria-pressed', String(playing)); }
function setInspectFrame(index) { playing = false; updatePlay(); inspectTime = index / manifest.clips[selected].fps; }
$('frame').addEventListener('input', () => { if (ready) setInspectFrame(Number($('frame').value)); });
$('step').addEventListener('click', () => { if (ready) { const clip = manifest.clips[selected]; setInspectFrame((frameIndex({ ...clip, loop: true }, inspectTime) + 1) % clip.frames.length); } });

document.addEventListener('keydown', event => {
  if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target?.tagName) || event.target?.isContentEditable) return;
  const key = event.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'h'].includes(key)) {
    event.preventDefault();
    if (key === ' ' && !event.repeat) attack();
    else if (key === 'h' && !event.repeat) hit();
    else { keys.add(key); target = null; }
  }
});
document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); touch = null; target = null; activeTouchPointerId = null; previous = 0; });
document.addEventListener('visibilitychange', () => { keys.clear(); touch = null; target = null; activeTouchPointerId = null; previous = 0; });
for (const button of document.querySelectorAll('[data-dir]')) {
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); activeTouchPointerId = event.pointerId; target = null; touch = button.dataset.dir.split(',').map(Number); });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, event => { if (event.pointerId === activeTouchPointerId) { touch = null; activeTouchPointerId = null; } });
}

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  const fit = Math.min(box.width / viewport.width, box.height / viewport.height);
  const left = box.left + (box.width - viewport.width * fit) / 2;
  const top = box.top + (box.height - viewport.height * fit) / 2;
  return { x: (event.clientX - left) / fit, y: (event.clientY - top) / fit };
}
canvas.addEventListener('pointerdown', event => {
  if (!ready || mode !== 'combat') return;
  const point = canvasPoint(event);
  if (point.x < 0 || point.y < 0 || point.x > viewport.width || point.y > viewport.height) return;
  target = screenToWorld(point, camera, state.bounds);
  canvas.focus({ preventScroll: true });
});

function movement() {
  if (touch) return { movementX: touch[0], movementY: touch[1] };
  let x = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
  let y = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
  if (!x && !y && target) {
    x = target.x - state.player.x; y = target.y - state.player.y;
    if (Math.hypot(x, y) < 8) { target = null; x = 0; y = 0; }
    else { const length = Math.hypot(x, y); x /= length; y /= length; }
  }
  return { movementX: x, movementY: y };
}

function cross(x, y, color = '#a1e2d6') {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); ctx.stroke(); ctx.restore();
}

function sprite(clipId, elapsed, x, y, height, facing = 1, options = {}) {
  const clip = manifest.clips[clipId];
  const index = frameIndex(options.loop ? { ...clip, loop: true } : clip, elapsed);
  const frame = frameRect(clip, index);
  const scale = height / (frame.bodyHeight || clip.bodyHeight || frame.h);
  ctx.save(); ctx.translate(x, y); ctx.scale(facing * (clip.flipX ? -1 : 1) * scale, scale);
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  ctx.drawImage(images.get(clip.image), frame.x, frame.y, frame.w, frame.h, -frame.pivotX, -frame.pivotY, frame.w, frame.h);
  ctx.restore();
  if (showPivots) cross(x, y);
  return { index, clip };
}

function shadow(x, y, radius) {
  ctx.save();
  ctx.fillStyle = '#25221d30'; ctx.beginPath(); ctx.ellipse(x + 7, y + 4, radius, radius * .3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#161c1a55'; ctx.beginPath(); ctx.ellipse(x, y + 1, radius * .65, radius * .14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function background() {
  const bg = images.get(manifest.environment);
  const area = mode === 'combat' ? state.bounds : viewport;
  const offset = mode === 'combat' ? camera : { x: 0, y: 0, ...viewport };
  for (const tile of visibleTiles(offset, area, manifest.tileSize)) {
    ctx.save();
    ctx.translate(tile.x - offset.x + tile.size / 2, tile.y - offset.y + tile.size / 2);
    ctx.scale(tile.flipX ? -1 : 1, tile.flipY ? -1 : 1);
    ctx.drawImage(bg, -tile.size / 2, -tile.size / 2, tile.size, tile.size);
    ctx.restore();
  }
}

function drawDecoration(prop) {
  const frame = manifest.decorations.frames[prop.frame];
  const scale = prop.height / frame.h;
  shadow(prop.x, prop.y, prop.height * .22);
  ctx.save(); ctx.translate(prop.x, prop.y); ctx.scale(prop.facing * scale, scale);
  ctx.drawImage(images.get(manifest.decorations.image), frame.x, frame.y, frame.w, frame.h, -frame.pivotX, -frame.pivotY, frame.w, frame.h);
  ctx.restore();
}

function sceneLighting() {
  // The same ambient light and edge shading cover terrain, actors and effects.
  ctx.save();
  ctx.fillStyle = '#d6c29a0c'; ctx.fillRect(0, 0, viewport.width, viewport.height);
  const gradient = ctx.createRadialGradient(600, 350, 160, 600, 350, 690);
  gradient.addColorStop(0, 'transparent'); gradient.addColorStop(1, '#17201940');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.restore();
}

function drawCombat() {
  const actors = [...decorations, ...state.enemies, { ...state.player, type: 'hunter', id: 'player' }].sort((a, b) => a.y - b.y);
  const player = state.player;
  ctx.save(); ctx.translate(-camera.x, -camera.y);
  if (showRange) {
    ctx.strokeStyle = '#ecc68888'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.ellipse(player.x, player.y, 180, 180, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (target) { ctx.strokeStyle = '#9ae0d1aa'; ctx.beginPath(); ctx.ellipse(target.x, target.y, 10, 4, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (const actor of actors) {
    if (!visibleInCamera(actor, camera)) continue;
    if (actor.kind === 'decoration') { drawDecoration(actor); continue; }
    if (actor.type === 'hunter') {
      shadow(actor.x, actor.y, 37);
      const clip = actor.action === 'attack' ? 'hunter_attack' : ['hurt', 'death'].includes(actor.action) ? 'hunter_hit' : 'hunter_walk';
      const elapsed = actor.action === 'death' ? 10 : actor.action === 'idle' ? 0 : actor.actionTime;
      const result = sprite(clip, elapsed, actor.x, actor.y, 126, actor.facing, { alpha: actor.action === 'death' ? .4 : 1 });
      $('frame-readout').textContent = result.clip.name + '  ' + (result.index + 1) + '/' + result.clip.frames.length;
      if (actor.action === 'attack' && actor.actionTime >= .12 && actor.actionTime <= .52) sprite('fx_cleave_sequence', actor.actionTime - .12, actor.x + 70 * actor.facing, actor.y - 58, 170, actor.facing);
    } else {
      const size = actor.type === 'bulwark' ? 157 : 87;
      shadow(actor.x, actor.y, actor.type === 'bulwark' ? 48 : 31);
      const clip = actor.type === 'skitter' && (actor.dead || actor.action === 'hurt') ? 'enemy_skitter_hurt_death' : 'enemy_' + actor.type + '_walk';
      const elapsed = actor.dead && actor.type === 'bulwark' ? 0 : actor.action === 'hurt' ? Math.min(actor.actionTime, .18) : actor.actionTime;
      sprite(clip, elapsed, actor.x, actor.y, size, actor.vx < 0 ? 1 : -1, { alpha: actor.dead && actor.actionTime > .5 ? .55 : 1 });
      if (actor.action === 'hurt' && actor.actionTime < .32) {
        ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#f9d494'; ctx.textAlign = 'center'; ctx.fillText('35', actor.x, actor.y - size - actor.actionTime * 30);
      }
      if (!actor.dead && actor.hp < actor.maxHp) {
        ctx.fillStyle = '#101a20aa'; ctx.fillRect(actor.x - 22, actor.y - size - 13, 44, 4);
        ctx.fillStyle = '#dcaa70'; ctx.fillRect(actor.x - 22, actor.y - size - 13, 44 * actor.hp / actor.maxHp, 4);
      }
      if (actor.dead) {
        const loot = images.get(manifest.loot);
        ctx.drawImage(loot, actor.x - 11, actor.y - 22, 22, 22);
      }
    }
  }
  ctx.restore();
  $('hp-fill').style.width = state.player.hp + '%'; $('hp-text').textContent = String(state.player.hp);
  $('kill-count').textContent = String(state.enemies.filter(enemy => enemy.dead).length);
  $('enemy-total').textContent = '/ ' + state.enemies.length;
  $('hint').textContent = state.player.hp === 0 ? '피격 검사 종료 · 적 다시 배치 버튼으로 복구' : 'WASD / 방향키 이동 · SPACE 베기 · 바닥 클릭 이동';
}

function drawMinimap() {
  const map = { x: viewport.width - 168, y: 102, width: 148, height: 94 };
  const sx = map.width / state.bounds.width, sy = map.height / state.bounds.height;
  ctx.save();
  ctx.fillStyle = '#081a21eb'; ctx.fillRect(map.x - 4, map.y - 4, map.width + 8, map.height + 8);
  ctx.fillStyle = '#4b5149'; ctx.fillRect(map.x, map.y, map.width, map.height);
  for (const prop of decorations) {
    ctx.fillStyle = prop.frame < 2 ? '#baa88a' : '#6c9b8c';
    ctx.fillRect(map.x + prop.x * sx - 1, map.y + prop.y * sy - 1, 2, 2);
  }
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    ctx.fillStyle = enemy.type === 'bulwark' ? '#efb971' : '#c69664';
    ctx.fillRect(map.x + enemy.x * sx - 1, map.y + enemy.y * sy - 1, 2, 2);
  }
  ctx.strokeStyle = '#9bd8c4'; ctx.lineWidth = 1;
  ctx.strokeRect(map.x + camera.x * sx, map.y + camera.y * sy, camera.width * sx, camera.height * sy);
  ctx.fillStyle = '#c8ffeb'; ctx.beginPath(); ctx.ellipse(map.x + state.player.x * sx, map.y + state.player.y * sy, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawInspect() {
  const clip = manifest.clips[selected];
  const actorSize = clip.actor === 'fx' ? 300 : clip.actor === 'skitter' ? 200 : 280;
  shadow(600, 490, clip.actor === 'fx' ? 0 : 80);
  const result = sprite(selected, inspectTime, 600, 490, actorSize, 1, { loop: true });
  $('frame').value = String(result.index);
  $('frame-label').textContent = (result.index + 1) + ' / ' + clip.frames.length;
  $('frame-readout').textContent = clip.name + '  ' + (result.index + 1) + '/' + clip.frames.length;
  ctx.textAlign = 'center'; ctx.fillStyle = '#e5e3d6'; ctx.font = '14px system-ui';
  ctx.fillText(names[clip.actor] + ' / ' + clip.name, 600, 570);
  ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = '#bbcdc6';
  ctx.fillText(clip.frames.length + ' FRAMES · ' + clip.fps + ' FPS', 600, 595);
}

function tick(now) {
  const dt = previous ? Math.min(.05, Math.max(0, (now - previous) / 1000)) : 0;
  previous = now;
  if (ready) {
    // All art shares one 600×380 raster. World/camera coordinates remain 1200×760.
    ctx.setTransform(canvas.width / viewport.width, 0, 0, canvas.height / viewport.height, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (mode === 'combat') {
      let remaining = dt * rate;
      const input = movement();
      while (remaining > 0) { const step = Math.min(.05, remaining); advance(state, step, input); remaining -= step; }
      camera = cameraFor(state.player, state.bounds, viewport);
      background(); drawCombat();
    }
    else { if (playing) inspectTime += dt * rate; background(); drawInspect(); }
    sceneLighting();
    if (mode === 'combat') drawMinimap();
  }
  requestAnimationFrame(tick);
}
loadAssets();
requestAnimationFrame(tick);
