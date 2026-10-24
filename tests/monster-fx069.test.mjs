import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as g from '../dist/game-engine.js';
import {CHAPTERS} from '../dist/chapters.js';
import {GROUND_DEPTH_SCALE as G} from '../dist/world.js';
import {regionAssetPlan,createRegionAssets} from '../dist/region-assets.js';
import {validMonsterEffects,drawMonsterAttackEffect,drawMonsterCharge,drawMonsterProjectile} from '../dist/monster-fx.js';
import {drawImageSkillEffect} from '../dist/skill-image-fx.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url)));
const atlases=manifest.monsterEffects,images=new Map(Object.values(atlases).map(a=>[a.image,{width:a.width,height:a.height}])),options={atlases,images};
function canvas(){
 const calls=[],stack=[];let m=[1,0,0,1,0,0];const c={globalAlpha:1,globalCompositeOperation:'source-over',calls};
 c.save=()=>stack.push({m:[...m],alpha:c.globalAlpha,op:c.globalCompositeOperation});c.restore=()=>{const old=stack.pop();assert.ok(old);m=old.m;c.globalAlpha=old.alpha;c.globalCompositeOperation=old.op;};
 c.translate=(x,y)=>{m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;};c.scale=(x,y)=>{m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;};
 c.rotate=a=>{const [aa,b,cc,d]=m,cos=Math.cos(a),sin=Math.sin(a);m[0]=aa*cos+cc*sin;m[1]=b*cos+d*sin;m[2]=cc*cos-aa*sin;m[3]=d*cos-b*sin;};
 c.drawImage=(...args)=>calls.push({args,m:[...m],alpha:c.globalAlpha,op:c.globalCompositeOperation});c.depth=()=>stack.length;return c;
}
const directions=Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}));
const aligned=(x,y,n,sign=1)=>assert.ok((x*n.x+y*n.y)*sign/(Math.hypot(x,y)*Math.hypot(n.x,n.y))>.995);
function shot(s,e){s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});}

test('48 actual lossless frames are in bounds, transparent sheets are region-local and only one sheet is resident',async()=>{
 const plan=regionAssetPlan(manifest,CHAPTERS);let bytes=0;
 for(const chapter of CHAPTERS.filter(c=>c.number===1)){const a=atlases[chapter.theme];assert.equal(validMonsterEffects(a,images),true);assert.equal(plan.paths.has(a.image),false);assert.ok(plan.regions.get(chapter.id).paths.has(a.image));
  const data=fs.readFileSync(new URL('../dist/assets/'+a.image,import.meta.url));assert.equal(data.toString('ascii',12,16),'VP8L');const bits=data.readUInt32LE(21);assert.equal((bits&16383)+1,a.width);assert.equal(((bits>>>14)&16383)+1,a.height);assert.ok((bits>>>28)&1,'alpha flag');bytes+=data.length;
 }
 assert.ok(bytes<10*1024*1024);
 const pool=new Map(),loader=createRegionAssets({images:pool,plan,loadImage:async path=>images.get(path)??{naturalWidth:1,naturalHeight:1},validateClip:()=>({valid:true})});
 assert.equal(await loader.request(1),true);assert.ok(pool.has(atlases[1].image));assert.equal(await loader.request(2),true);assert.ok(pool.has(atlases[1].image),'same region keeps its sheet');assert.equal(await loader.request(11),true);assert.ok(!pool.has(atlases[1].image));assert.ok(pool.has(atlases[2].image));assert.ok(!pool.has(atlases[3].image));
});
test('malformed or missing effect atlas cannot partially promote a region and retry succeeds',async()=>{
 const a=atlases[1];for(const mutate of [a=>a.frames.slash[0].x=-1,a=>a.frames.bolt[1].pivotX=NaN,a=>a.frames.impact.pop(),a=>a.frames.charge[1]={...a.frames.charge[0]}]){const copy=structuredClone(a);mutate(copy);assert.equal(validMonsterEffects(copy,images),false);}
 assert.equal(validMonsterEffects(a,new Map()),false);
 const plan=regionAssetPlan(manifest,CHAPTERS),pool=new Map();let fail=true;const loader=createRegionAssets({images:pool,plan,loadImage:async path=>{if(path===a.image){if(fail)throw Error('missing effects');return images.get(path);}return {naturalWidth:1,naturalHeight:1};},validateClip:()=>({valid:true})});
 assert.equal(await loader.request(1),false);assert.equal(pool.size,0);assert.equal(loader.status,'error');fail=false;assert.equal(await loader.request(1,true),true);assert.equal(loader.residentId,1);
});
test('monster image frames advance with game progress, preserve context/state and stop on dead charges or friendly reflection',()=>{
 for(const chapter of [1,2,3]){
  const f={type:'slam',x:5,y:8,radius:100,fxChapter:chapter,monsterKind:'bulwark',ttl:.3,maxTtl:.4},before=JSON.stringify(f),c=canvas();for(const ttl of [.39,.28,.18,.08]){f.ttl=ttl;assert.equal(drawMonsterAttackEffect(c,f,.8,options),true);}assert.equal(new Set(c.calls.map(d=>d.args[1])).size,4);assert.equal(c.depth(),0);assert.equal(c.globalAlpha,1);assert.equal(c.globalCompositeOperation,'source-over');f.ttl=.3;assert.equal(JSON.stringify(f),before);
  const e={x:100,y:100,action:'attack',actionTime:.1,chargeDuration:.3,chargeX:1,chargeY:0};const prev=JSON.stringify(e),p=canvas();assert.equal(drawMonsterCharge(p,e,chapter,options),true);assert.equal(JSON.stringify(e),prev);e.dead=true;assert.equal(drawMonsterCharge(p,e,chapter,options),false);e.dead=false;e.action='hurt';assert.equal(drawMonsterCharge(p,e,chapter,options),false);
  const q={x:15,y:18,vx:300,vy:100,ttl:2,fxChapter:chapter,id:4},record=JSON.stringify(q),b=canvas();assert.equal(drawMonsterProjectile(b,q,1,options),true);assert.equal(JSON.stringify(q),record);q.friendly=true;assert.equal(drawMonsterProjectile(b,q,1,options),false);
 }
 const c=canvas();assert.equal(drawMonsterProjectile(c,{x:0,y:0,vx:0,vy:0,ttl:1,fxChapter:1},1,options),false);assert.equal(drawMonsterAttackEffect(c,{type:'slam',fxChapter:1,ttl:0,maxTtl:1},1,options),false);assert.equal(c.calls.length,0);
});
test('all eight hostile projectile heads follow the projected velocity and their art pivots match the physical anchor',()=>{
 for(const n of directions){const c=canvas();c.scale(1,G);const q={id:2,x:100,y:200,vx:n.x*300,vy:n.y*300,fxChapter:1,ttl:1};assert.equal(drawMonsterProjectile(c,q,1,options),true);const d=c.calls[0];aligned(d.m[0],d.m[1],{x:n.x,y:n.y*G});assert.ok(Math.abs(d.m[4]-100)<1e-8);assert.ok(Math.abs(d.m[5]-(200*G-35))<1e-8);assert.equal(c.depth(),0);}
});
test('live shots loop sustained cores instead of dissolving and volumetric impacts retain screen height',()=>{
 for(const chapter of [1,2,3]){
  const c=canvas(),q={id:3,x:100,y:200,vx:300,vy:0,fxChapter:chapter,ttl:2},a=atlases[chapter];c.scale(1,G);
  for(let i=0;i<24;i++)assert.equal(drawMonsterProjectile(c,q,i/24,options),true);
  assert.equal(new Set(c.calls.map(d=>d.args[1])).size,2);for(const d of c.calls){assert.ok(a.frames.bolt.slice(1,3).some(f=>f.x===d.args[1]&&f.y===d.args[2]));assert.equal(d.alpha,1);assert.equal(d.op,'lighter');}
  const impact=canvas();impact.scale(1,G);drawMonsterAttackEffect(impact,{type:'slam',x:100,y:200,radius:90,fxChapter:chapter,monsterKind:'bulwark',ttl:.18,maxTtl:.35},1,options);
  const d=impact.calls[0];assert.equal(d.m[0],1);assert.ok(Math.abs(d.m[3]-1)<1e-10,'upright image must cancel ground squash');assert.equal(d.alpha,1);assert.equal(impact.depth(),0);assert.equal(impact.globalCompositeOperation,'source-over');
 }
});
test('monster attacks publish only presentation metadata while respecting damage timing, pause and caps',()=>{
 for(const chapter of [1,11,21]){
  const p=g.createProfile();p.clearedStage=20;p.unlockedStage=21;const s=g.createGame(p);g.launch(s,chapter);s.spawns=[{id:900,type:'spitter',x:s.player.x+200,y:s.player.y,delay:0}];g.advanceGame(s,.001);s.barrels=[];const e=s.enemies[0];e.action='windup';e.actionTime=0;e.windup=.1;e.targetX=s.player.x;e.targetY=s.player.y;s.player.invulnerable=999;const hp=s.player.hp;g.advanceGame(s,.075);assert.equal(s.projectiles.length,0);s.paused=true;const before=JSON.stringify(s);g.advanceGame(s,.1);assert.equal(JSON.stringify(s),before);s.paused=false;g.advanceGame(s,.05);assert.ok(s.projectiles.length>0);assert.ok(s.projectiles.every(q=>q.fxChapter===g.STAGES[chapter-1].theme));assert.equal(s.player.hp,hp);assert.ok(s.projectiles.length<=64);assert.ok(s.effects.some(f=>f.type==="spit"&&f.fxChapter===g.STAGES[chapter-1].theme));
 }
});
test('crescent native art is corrected locally in eight directions without moving the hit area behind the hunter',()=>{
 const image={width:1254,height:1254},opts={atlas:{image,width:1254,height:1254}};
 for(const n of directions){const c=canvas(),f={type:'skillImpact',skillId:'crescent',x:100,y:100,radius:160,n};const before=JSON.stringify(f);drawImageSkillEffect(c,f,.6,opts);const d=c.calls[0];assert.ok((-d.m[0]*n.x-d.m[1]*n.y)/Math.hypot(d.m[0],d.m[1])>.99);assert.ok((d.m[4]-100)*n.x+(d.m[5]-100)*n.y>0);assert.equal(JSON.stringify(f),before);assert.equal(c.depth(),0);}
});
test('seeking image follows the actual selected target in eight directions even when the original aim is opposite',()=>{
 const opts={atlas:{image:{width:1254,height:1254},width:1254,height:1254}};
 for(const n of directions){const c=canvas(),f={type:'skillCast',skillId:'seeking',fromX:20,fromY:30,targetX:20+n.x*200,targetY:30+n.y*200,n:{x:-n.x,y:-n.y}};drawImageSkillEffect(c,f,.5,opts);const d=c.calls[0];aligned(d.m[0],d.m[1],n);assert.ok(Math.abs(d.m[4]-(20+n.x*90))<1e-8);assert.ok(Math.abs(d.m[5]-(30+n.y*90))<1e-8);}
});
test('returning blade preserves intentional outbound and inbound reversal in all eight directions',()=>{
 const opts={atlas:{image:{width:1254,height:1254},width:1254,height:1254}};
 for(const n of directions)for(const index of [0,1]){const c=canvas();drawImageSkillEffect(c,{type:'skillImpact',skillId:'returning',x:0,y:0,radius:160,n,index},.5,opts);const d=c.calls[0];aligned(d.m[0],d.m[1],n,index? -1:1);assert.ok(d.m[4]*n.x+d.m[5]*n.y>0);}
});
