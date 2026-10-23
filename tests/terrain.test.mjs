import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleTiles, createDecorations, TILE_SIZE } from '../dist/terrain.js';
import { VIEWPORT, GROUND_DEPTH_SCALE, cameraFor, screenToWorld } from '../dist/world.js';

test('fixed tiles cover every visible viewport corner without gaps', () => {
  const bounds = { width: 3600, height: 2280 };
  for (const [x,y] of [[0,0],[1200,760],[511,511],[2400,1520],[512,512]]) {
    const camera = { x,y,width:1200,height:760 };
    const tiles=visibleTiles(camera,bounds);
    assert.ok(tiles.length <= 12);
    for (const [px,py] of [[x,y],[x+1199.99,y],[x,y+759.99],[x+1199.99,y+759.99]]) {
      assert.equal(tiles.filter(t=>px>=t.x&&px<t.x+t.size&&py>=t.y&&py<t.y+t.size).length,1);
    }
    for(const tile of tiles){assert.equal(tile.size,TILE_SIZE);assert.equal(tile.x%TILE_SIZE,0);assert.equal(tile.y%TILE_SIZE,0);}
  }
});

test('larger worlds do not enlarge tiles or decoration sprites', () => {
  const camera={x:1200,y:760,width:1200,height:760};
  const normal={width:3600,height:2280},large={width:7200,height:4560};
  assert.deepEqual(visibleTiles(camera,normal),visibleTiles(camera,large));
  const heights = bounds => [...new Set(createDecorations(bounds).map(p=>p.height))].sort();
  assert.deepEqual(heights(normal),heights(large));
  for(const prop of createDecorations(normal)){
    assert.ok(prop.x>0&&prop.x<normal.width&&prop.y>0&&prop.y<normal.height);
    assert.ok(prop.height<=180);
    assert.ok(prop.frame>=0&&prop.frame<4);
  }
});

test('adjacent tiles reflect the matching source edge without reversing its other axis', () => {
  const tiles=visibleTiles({x:0,y:0,width:1536,height:1536},{width:3600,height:2280});
  for(const tile of tiles){
    const right=tiles.find(t=>t.x===tile.x+512&&t.y===tile.y);
    if(right){assert.notEqual(tile.flipX,right.flipX);assert.equal(tile.flipY,right.flipY);}
    const below=tiles.find(t=>t.y===tile.y+512&&t.x===tile.x);
    if(below){assert.notEqual(tile.flipY,below.flipY);assert.equal(tile.flipX,below.flipX);}
  }
});

test('tilted camera ground tiles cover screen corners and seams without enlarging source tiles',()=>{
  const bounds={width:3600,height:2280,padding:0};
  for(const player of [{x:0,y:0},{x:1800,y:1160},{x:3600,y:2280},{x:600,y:912}]){
    const camera=cameraFor(player,bounds,VIEWPORT,GROUND_DEPTH_SCALE),tiles=visibleTiles(camera,bounds);
    assert.ok(tiles.length<=16);
    for(const screen of [{x:0,y:0},{x:1199.99,y:0},{x:0,y:759.99},{x:1199.99,y:759.99},{x:600,y:380}]){
      const point=screenToWorld(screen,camera,bounds);
      assert.equal(tiles.filter(t=>point.x>=t.x&&point.x<t.x+t.size&&point.y>=t.y&&point.y<t.y+t.size).length,1);
    }
    for(const tile of tiles)assert.equal(tile.size,TILE_SIZE);
  }
});
