import test from 'node:test';
import assert from 'node:assert/strict';
import { viewportFor,renderSurfaceFor,stickVector,guidePointFor,supportsLandscape } from '../dist/view-controls.js';
import { cameraFor,GROUND_DEPTH_SCALE,WORLD_BOUNDS,worldToScreen,screenToWorld } from '../dist/world.js';

test('phone cameras fill the displayed aspect ratio without changing sprite proportions',()=>{
  for(const [w,h] of [[320,568],[360,640],[390,844],[360,900],[844,390],[1200,760]]){
    const v=viewportFor(w,h);assert.ok(Math.abs(v.width/v.height-w/h)<.002);
    if(h>w){assert.ok(v.width<=720);assert.ok(v.height<=1602);}
    const world={...WORLD_BOUNDS,padding:60},p={x:1800,y:1160},camera=cameraFor(p,world,v,GROUND_DEPTH_SCALE);
    assert.ok(camera.x>=0&&camera.y>=0);assert.ok(camera.y+camera.height<=world.height+1e-8);
    const back=screenToWorld(worldToScreen(p,camera),camera,world);assert.ok(Math.abs(back.x-p.x)<1e-8&&Math.abs(back.y-p.y)<1e-8);
  }
});
test('zero or invalid layout geometry leaves a usable default viewport',()=>{
  for(const [w,h] of [[0,640],[360,0],[NaN,640],[360,Infinity],[-1,720]])assert.deepEqual(viewportFor(w,h),{width:1200,height:760});
});

test('render surface follows display pixels independently of the logical camera',()=>{
 assert.deepEqual(renderSurfaceFor(390,844,1),{width:390,height:844});
 assert.deepEqual(renderSurfaceFor(390,844,2),{width:780,height:1688});
 assert.deepEqual(renderSurfaceFor(390,844,3),renderSurfaceFor(390,844,2));
 assert.deepEqual(renderSurfaceFor(390,844,NaN),renderSurfaceFor(390,844,1));
 for(const [w,h,dpr] of [[7680,4320,4],[1,100000,2],[100000,1,2],[1920,1080,2]]){
  const r=renderSurfaceFor(w,h,dpr);assert.ok(r.width>=1&&r.height>=1);assert.ok(r.width<=4096&&r.height<=4096);assert.ok(r.width*r.height<=2097152);
 }
 for(const [w,h]of [[0,800],[-1,800],[800,Infinity],[NaN,800]])assert.deepEqual(renderSurfaceFor(w,h,2),{width:1200,height:760});
});
test('joystick dead zone, all eight headings and external captured drags stay bounded',()=>{
  const b={left:20,top:30,width:120,height:120};
  assert.deepEqual(stickVector(80,90,b),{x:0,y:0,thumbX:0,thumbY:0});
  assert.equal(stickVector(88,90,b).x,0);
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4,v=stickVector(80+10000*Math.cos(angle),90+10000*Math.sin(angle),b);
    assert.ok(Math.abs(v.x-Math.cos(angle))<1e-9);assert.ok(Math.abs(v.y-Math.sin(angle))<1e-9);
    assert.ok(Math.abs(Math.hypot(v.thumbX,v.thumbY)-36)<1e-8);
  }
  assert.deepEqual(stickVector(NaN,90,b),{x:0,y:0,thumbX:0,thumbY:0});
});

test('offscreen guides stay inside portrait, wide and extremely short viewports',()=>{
 for(const [width,height]of [[720,1600],[1200,554],[1200,480],[1200,200],[120,80]])for(const point of [{x:-10000,y:-10000},{x:10000,y:10000},{x:width/2,y:height/2}]){
  const p=guidePointFor(point,{width,height});assert.ok(p.x>=0&&p.x<=width);assert.ok(p.y>=0&&p.y<=height);
 }
 assert.deepEqual(guidePointFor({x:600,y:500},{width:1200,height:760}),{x:600,y:500});
});
test('wide phone and desktop raster surfaces keep the same camera aspect and bounded fill cost',()=>{
 for(const [width,height]of [[892,412],[667,375],[568,320],[1280,720],[2560,1080]]){
  const v=viewportFor(width,height);assert.ok(Math.abs(v.width/v.height-width/height)<.01);
  const surface=renderSurfaceFor(width,height,3);assert.ok(surface.width*surface.height<=2097152);assert.ok(surface.width<=4096&&surface.height<=4096);
 }
});

test('only sufficiently sized landscape surfaces allow gameplay',()=>{
 for(const [w,h]of [[892,412],[667,375],[568,320],[560,320],[1280,720]])assert.equal(supportsLandscape(w,h),true);
 for(const [w,h]of [[412,892],[720,720],[559,320],[892,319],[0,0],[NaN,412],[892,Infinity]])assert.equal(supportsLandscape(w,h),false);
});
