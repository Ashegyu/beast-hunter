export const TILE_SIZE = 512;

export function visibleTiles(camera, bounds, size = TILE_SIZE) {
  const tiles = [];
  const firstX = Math.max(0, Math.floor(camera.x / size));
  const firstY = Math.max(0, Math.floor(camera.y / size));
  const lastX = Math.min(Math.ceil(bounds.width / size) - 1, Math.ceil((camera.x + camera.width) / size) - 1);
  const lastY = Math.min(Math.ceil(bounds.height / size) - 1, Math.ceil((camera.y + camera.height) / size) - 1);
  for (let row = firstY; row <= lastY; row++) for (let column = firstX; column <= lastX; column++) {
    // Reflected repetition joins each edge to the same edge of its neighbor.
    tiles.push({ x: column * size, y: row * size, size, flipX: column % 2 === 1, flipY: row % 2 === 1 });
  }
  return tiles;
}

export function createDecorations(bounds, chapter = null) {
  const props = [];
  const add = (x, y, frame, height, facing = 1) => props.push({ id: 'prop-' + props.length, kind: 'decoration', x, y, frame, height, facing });
  if(chapter){
    const base=(chapter.id-1)*4,heights=[[170,76,88,52],[155,185,62,78],[180,105,160,62]][chapter.id-1];
    const route=[{x:350,y:1160},...chapter.encounters.map(([x,y])=>({x,y})),chapter.bossPosition];
    const nearRoute=(x,y)=>route.some((a,i)=>{if(!i)return false;const b=route[i-1],dx=a.x-b.x,dy=a.y-b.y,t=Math.max(0,Math.min(1,((x-b.x)*dx+(y-b.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-b.x-dx*t,y-b.y-dy*t)<135;});
    for(let row=0;row<5;row++)for(let col=0;col<9;col++){
      const x=140+col*400+(row%2)*45,y=200+row*420+(col%3)*35;
      if(x>bounds.width-100||y>bounds.height-100||nearRoute(x,y)||chapter.caches.some(([cx,cy])=>Math.hypot(cx-x,cy-y)<140))continue;
      const frame=(row+col+chapter.id)%4;add(x,y,base+frame,heights[frame],col%2?-1:1);
    }
    return props;
  }
  for (let x = 150; x < bounds.width - 100; x += 320) {
    add(x, 145, x % 640 < 320 ? 0 : 1, 170);
    add(x + 30, bounds.height - 95, x % 640 < 320 ? 1 : 0, 180, -1);
  }
  for (let y = 400; y < bounds.height - 200; y += 330) {
    add(100, y, 0, 175); add(bounds.width - 100, y + 30, 1, 165, -1);
  }
  // Small floor ornaments do not turn the traversable area into repeated rooms.
  for (let row = 0; row < 4; row++) for (let column = 0; column < 6; column++) {
    const x = 280 + column * 570 + (row % 2) * 85;
    const y = 310 + row * 520 + (column % 3) * 50;
    if (Math.hypot(x - bounds.width / 2, y - bounds.height / 2 - 20) < 220) continue;
    add(x, y, (column + row) % 2 ? 2 : 3, (column + row) % 2 ? 48 : 58);
  }
  return props;
}
