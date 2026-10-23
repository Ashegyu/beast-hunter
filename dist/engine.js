// A small, deterministic motion viewer. No rendering, clocks or browser dependencies.
const DEFAULT_FPS = 12;
export const MAX_DELTA = 0.05;
export const MOVE_SPEED = 230;
export const ATTACK_RANGE = 180;
export const ATTACK_DAMAGE = 35;
export const ATTACK_HIT_TIME = 0.25;
export const ATTACK_DURATION = 0.7;
export const HURT_DURATION = 0.5;
const EPSILON = 1e-9;

const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const positive = (value, fallback) => finite(value) && value > 0 ? value : fallback;
const durationOf = (frame, fps) => positive(frame?.duration, 1 / fps);

export function frameIndex(clip, elapsed, rate = 1) {
  const frames = clip?.frames;
  if (!Array.isArray(frames) || frames.length === 0) return 0;
  const fps = positive(clip.fps, DEFAULT_FPS);
  const time = finite(elapsed) ? Math.max(0, elapsed) : 0;
  const speed = finite(rate) && rate >= 0 ? rate : 1;
  const variable = frames.some(frame => finite(frame?.duration) && frame.duration > 0);
  let position = time * speed;
  if (!Number.isFinite(position)) return clip.loop === false ? frames.length - 1 : 0;
  if (!variable) {
    const scaled = position * fps;
    if (!Number.isFinite(scaled)) return clip.loop === false ? frames.length - 1 : 0;
    const step = Math.floor(scaled);
    return clip.loop === false ? Math.min(step, frames.length - 1) : step % frames.length;
  }
  let total = 0;
  for (const frame of frames) total += durationOf(frame, fps);
  if (clip.loop !== false) position %= total;
  else if (position >= total) return frames.length - 1;
  const tolerance = Number.EPSILON * total * 4;
  let end = 0;
  for (let index = 0; index < frames.length; index += 1) {
    end += durationOf(frames[index], fps);
    if (position + tolerance < end) return index;
  }
  return clip.loop === false ? frames.length - 1 : 0;
}

export function frameRect(clip, index) {
  if (!Array.isArray(clip?.frames) || clip.frames.length === 0) return null;
  const safeIndex = clamp(finite(index) ? Math.trunc(index) : 0, 0, clip.frames.length - 1);
  const frame = clip.frames[safeIndex];
  if (!frame || typeof frame !== 'object') return null;
  return {
    ...frame, index: safeIndex,
    pivotX: finite(frame.pivotX) ? frame.pivotX : frame.w / 2,
    pivotY: finite(frame.pivotY) ? frame.pivotY : frame.h,
  };
}

export function validateClip(clip, imageWidth, imageHeight) {
  const errors = [];
  if (!finite(imageWidth) || imageWidth <= 0 || !finite(imageHeight) || imageHeight <= 0) errors.push('이미지 크기는 유한한 양수여야 합니다.');
  if (!clip || typeof clip !== 'object' || Array.isArray(clip)) return { valid: false, errors: [...errors, '클립이 객체가 아닙니다.'] };
  if (clip.fps !== undefined && (!finite(clip.fps) || clip.fps <= 0)) errors.push('fps는 유한한 양수여야 합니다.');
  if (clip.loop !== undefined && typeof clip.loop !== 'boolean') errors.push('loop는 boolean이어야 합니다.');
  if (!Array.isArray(clip.frames) || clip.frames.length === 0 || clip.frames.length > 4096) return { valid: false, errors: [...errors, '클립에는 1~4096개의 프레임이 필요합니다.'] };
  for (let index = 0; index < clip.frames.length; index += 1) {
    const frame = clip.frames[index];
    if (!frame || typeof frame !== 'object') { errors.push(`${index}: 프레임이 객체가 아닙니다.`); continue; }
    if (!finite(frame.x) || frame.x < 0 || !finite(frame.y) || frame.y < 0 || !finite(frame.w) || frame.w <= 0 || !finite(frame.h) || frame.h <= 0) errors.push(`${index}: 사각형 좌표가 올바르지 않습니다.`);
    else if (frame.x + frame.w > imageWidth || frame.y + frame.h > imageHeight) errors.push(`${index}: 프레임이 이미지 범위를 벗어납니다.`);
    if (!finite(frame.pivotX) || frame.pivotX < 0 || frame.pivotX > frame.w || !finite(frame.pivotY) || frame.pivotY < 0 || frame.pivotY > frame.h) errors.push(`${index}: pivot은 프레임 내부의 픽셀 좌표여야 합니다.`);
    if (frame.duration !== undefined && (!finite(frame.duration) || frame.duration <= 0)) errors.push(`${index}: duration은 유한한 양수 초여야 합니다.`);
  }
  return { valid: errors.length === 0, errors };
}

function transition(entity, action) {
  if (entity.action !== action) { entity.action = action; entity.actionTime = 0; }
}

export function makeState(bounds = {}) {
  const width = positive(bounds?.width, 1200);
  const height = positive(bounds?.height, 760);
  const padding = clamp(finite(bounds?.padding) ? bounds.padding : 60, 0, Math.min(width, height) / 2);
  const x = width / 2;
  const y = clamp(height / 2 + 20, padding, height - padding);
  const points = [[130, -20], [-135, 25], [270, 100], [-260, -130], [120, -230], [-300, 150], [340, -50], [-60, 250]];
  const enemyGroups = clamp(Math.floor(positive(bounds?.enemyGroups, 1)), 1, 7);
  const camps = [[0, 0], [-.27, -.27], [.27, -.27], [-.27, .27], [.27, .27], [0, -.34], [0, .34]].slice(0, enemyGroups);
  const enemies = camps.flatMap(([campX, campY], group) => points.map(([dx, dy], localIndex) => {
    const index = group * points.length + localIndex;
    const type = localIndex < 6 ? 'skitter' : 'bulwark';
    const enemyX = clamp(x + campX * width + dx, padding, width - padding);
    const enemyY = clamp(y + campY * height + dy, padding, height - padding);
    const speed = type === 'skitter' ? 21 : 12;
    const maxHp = type === 'skitter' ? 70 : 140;
    return {
      id: `enemy-${index + 1}`, type, x: enemyX, y: enemyY, anchorX: enemyX, anchorY: enemyY,
      vx: index % 2 ? -speed : speed, vy: (index % 3 - 1) * speed * 0.55,
      facing: index % 2 ? -1 : 1, hp: maxHp, maxHp, action: 'walk', actionTime: 0, dead: false,
    };
  }));
  return {
    bounds: { width, height, padding, ...(enemyGroups > 1 ? { enemyGroups } : {}) },
    player: { x, y, action: 'idle', actionTime: 0, facing: 1, hp: 100, maxHp: 100, attackHit: false },
    enemies, stats: { elapsedSeconds: 0, attacks: 0, hits: 0, damageDealt: 0 },
  };
}

export function resetState(state) {
  const fresh = makeState(state?.bounds);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, fresh);
  return state;
}

export function triggerAttack(state) {
  const player = state.player;
  if (player.hp <= 0 || player.action === 'attack' || player.action === 'hurt' || player.action === 'death') return false;
  player.action = 'attack';
  player.actionTime = 0;
  player.attackHit = false;
  state.stats.attacks += 1;
  return true;
}

export function triggerHit(state) {
  const player = state.player;
  if (player.hp <= 0 || player.action === 'death') return false;
  player.hp = Math.max(0, player.hp - 10);
  player.action = player.hp === 0 ? 'death' : 'hurt';
  player.actionTime = 0;
  // Interrupting an attack cancels any future strike from that animation.
  player.attackHit = true;
  return true;
}

function bounce(position, velocity, dt, min, max) {
  if (max <= min) return [min, 0];
  let next = position + velocity * dt;
  // Enemies move at most one pixel per accepted step. Reflect instead of losing overshoot.
  if (next > max) { next = max - (next - max); velocity = -Math.abs(velocity); }
  else if (next < min) { next = min + (min - next); velocity = Math.abs(velocity); }
  return [clamp(next, min, max), velocity];
}

function moveEnemies(state, dt) {
  const { width, height, padding } = state.bounds;
  for (const enemy of state.enemies) {
    if (enemy.dead) { enemy.actionTime += dt; continue; }
    let movingTime = dt;
    if (enemy.action === 'hurt') {
      enemy.actionTime += dt;
      if (enemy.actionTime + EPSILON < 0.35) continue;
      movingTime = Math.max(0, enemy.actionTime - 0.35);
      transition(enemy, 'walk');
      enemy.actionTime = movingTime;
    } else enemy.actionTime += dt;
    const minX = Math.max(padding, enemy.anchorX - 30);
    const maxX = Math.min(width - padding, enemy.anchorX + 30);
    const minY = Math.max(padding, enemy.anchorY - 24);
    const maxY = Math.min(height - padding, enemy.anchorY + 24);
    [enemy.x, enemy.vx] = bounce(enemy.x, enemy.vx, movingTime, minX, maxX);
    [enemy.y, enemy.vy] = bounce(enemy.y, enemy.vy, movingTime, minY, maxY);
    if (enemy.vx !== 0) enemy.facing = enemy.vx < 0 ? -1 : 1;
  }
}

function strike(state, events) {
  const player = state.player;
  player.attackHit = true;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.hp <= 0 || Math.hypot(enemy.x - player.x, enemy.y - player.y) > ATTACK_RANGE) continue;
    const damage = Math.min(enemy.hp, ATTACK_DAMAGE);
    enemy.hp -= damage;
    enemy.dead = enemy.hp === 0;
    enemy.action = enemy.dead ? 'death' : 'hurt';
    enemy.actionTime = 0;
    state.stats.hits += 1;
    state.stats.damageDealt += damage;
    events.push({ type: 'hit', enemyId: enemy.id, x: enemy.x, y: enemy.y, damage, hp: enemy.hp });
    if (enemy.dead) events.push({ type: 'death', enemyId: enemy.id, x: enemy.x, y: enemy.y });
  }
}

function step(state, dt, input, events) {
  moveEnemies(state, dt);
  const player = state.player;
  if (player.action === 'attack') {
    player.actionTime += dt;
    if (!player.attackHit && player.actionTime + EPSILON >= ATTACK_HIT_TIME) strike(state, events);
    if (player.actionTime + EPSILON >= ATTACK_DURATION) {
      transition(player, 'idle');
      events.push({ type: 'actionEnd', action: 'attack' });
    }
    return;
  }
  if (player.action === 'hurt') {
    player.actionTime += dt;
    if (player.actionTime + EPSILON >= HURT_DURATION) transition(player, 'idle');
    return;
  }
  if (player.action === 'death' || player.hp <= 0) { player.actionTime += dt; return; }
  let dx = finite(input?.movementX) ? clamp(input.movementX, -1, 1) : 0;
  let dy = finite(input?.movementY) ? clamp(input.movementY, -1, 1) : 0;
  const length = Math.hypot(dx, dy);
  if (length > 1) { dx /= length; dy /= length; }
  transition(player, length > 0 ? 'walk' : 'idle');
  player.actionTime += dt;
  if (dx !== 0) player.facing = dx < 0 ? -1 : 1;
  const { width, height, padding } = state.bounds;
  player.x = clamp(player.x + dx * MOVE_SPEED * dt, padding, width - padding);
  player.y = clamp(player.y + dy * MOVE_SPEED * dt, padding, height - padding);
}

export function advance(state, elapsed, input = {}) {
  const dt = finite(elapsed) ? clamp(elapsed, 0, MAX_DELTA) : 0;
  const events = [];
  if (dt === 0) return { dt, events };
  state.stats.elapsedSeconds += dt;
  let remaining = dt;
  // Split at animation events so impact position and the new action clock do not
  // depend on the render frame that happened to cross the event boundary.
  for (let count = 0; remaining > 0 && count < 6; count += 1) {
    const player = state.player;
    const boundary = player.action === 'attack' ? (player.attackHit ? ATTACK_DURATION : ATTACK_HIT_TIME) : player.action === 'hurt' ? HURT_DURATION : null;
    const piece = boundary === null ? remaining : Math.min(remaining, Math.max(0, boundary - player.actionTime));
    step(state, piece, input, events);
    remaining = Math.max(0, remaining - piece);
    if (remaining < EPSILON) break;
  }
  return { dt, events };
}
