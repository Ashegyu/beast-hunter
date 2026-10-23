export const WORLD_BOUNDS = Object.freeze({ width: 3600, height: 2280, enemyGroups: 7 });
export const VIEWPORT = Object.freeze({ width: 1200, height: 760 });
// Orthographic ground plane seen from 45 degrees above the horizon. North stays up.
export const GROUND_DEPTH_SCALE = Math.SQRT1_2;

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function cameraFor(player, world, viewport, depthScale = 1) {
  const height = viewport.height / depthScale;
  const camera = {
    x: clamp(player.x - viewport.width / 2, 0, Math.max(0, world.width - viewport.width)),
    y: clamp(player.y - (viewport.height * .6) / depthScale, 0, Math.max(0, world.height - height)),
    width: viewport.width, height,
  };
  if (depthScale !== 1) camera.depthScale = depthScale;
  return camera;
}

export function worldToScreen(point, camera) {
  return { x: point.x - camera.x, y: (point.y - camera.y) * (camera.depthScale ?? 1) };
}

export function screenToWorld(point, camera, world) {
  return {
    x: clamp(point.x + camera.x, world.padding, world.width - world.padding),
    y: clamp(point.y / (camera.depthScale ?? 1) + camera.y, world.padding, world.height - world.padding),
  };
}

export function visibleInCamera(actor, camera, margin = 200) {
  const depthMargin = margin / (camera.depthScale ?? 1);
  return actor.x >= camera.x - margin && actor.x <= camera.x + camera.width + margin
    && actor.y >= camera.y - depthMargin && actor.y <= camera.y + camera.height + depthMargin;
}
