import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as visuals from '../dist/equipment-visuals.js';import * as g from '../dist/game-engine.js';import {DIRECTION_VIEWS} from '../dist/motion.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url),'utf8'));
const basic=(rarity,slot='weapon',id=1)=>({id,slot,rarity,tier:1,artId:slot==='weapon'?'forest_blade':slot==='armor'?'forest_armor':'forest_charm',affixes:{}});const item=(style,slot='weapon',id=1)=>{const r=g.ANCIENT_CATALOG.find(r=>r.slot===slot&&r.visualStyle===style);return r?{...r,id,catalogId:r.id,rarity:5,affixes:{}}:basic(style,slot,id);};
function context(){let t={a:1,b:0,c:0,d:1,e:0,f:0};const stack=[],calls=[],geometry=[];return{calls,geometry,get depth(){return stack.length;},get matrix(){return t;},save(){stack.push({...t});},restore(){t=stack.pop();},translate(x,y){t.e+=t.a*x+t.c*y;t.f+=t.b*x+t.d*y;},scale(x,y){t.a*=x;t.b*=x;t.c*=y;t.d*=y;},rotate(n){const {a,b,c,d}=t,cos=Math.cos(n),sin=Math.sin(n);t.a=a*cos+c*sin;t.b=b*cos+d*sin;t.c=c*cos-a*sin;t.d=d*cos-b*sin;},drawImage(image,...args){calls.push({image,args,t:{...t}});},beginPath(){},closePath(){},rect(){},clip(){},moveTo(...v){geometry.push(['moveTo',...v]);},lineTo(...v){geometry.push(['lineTo',...v]);},ellipse(...v){geometry.push(['ellipse',...v]);},stroke(){},fill(){},fillRect(...v){geometry.push(['fillRect',...v]);}};}
function map(t,x,y){return{x:t.e+t.a*x+t.c*y,y:t.f+t.b*x+t.d*y};}const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
test('12 distinct grade/slot frames are valid and grade resolution never mutates or promotes old gear',()=>{
 const atlas=manifest.equipmentRarities;assert.ok(visuals.validRarityAtlas(atlas));assert.equal(new Set(atlas.designIds).size,165);assert.equal(new Set(atlas.frames.map(f=>[f.x,f.y].join(','))).size,165);
 for(const rarity of [0,1,2,3,4])assert.equal(visuals.visualDesign(basic(rarity)).variant,undefined);// All 150 ancients have individual art (the 15 Alpha 0.97 part ancients since 0.111, regions 4-6 since 0.119).
 for(const row of g.ANCIENT_CATALOG){const i={...row,id:1,catalogId:row.id,rarity:5,affixes:{}},before=JSON.stringify(i),d=visuals.visualDesign(i),frame=atlas.frames[atlas.designIds.indexOf(row.id)];assert.equal(d.variant,row.id);assert.equal(frame.slot,row.slot);assert.equal(visuals.gearFrame(manifest.equipment,d,atlas).image,atlas.image);assert.equal(JSON.stringify(i),before);assert.equal(visuals.visualDesign(i),d);}
 assert.equal(visuals.visualDesign(item(7)).variant,undefined);const invalid=structuredClone(atlas);invalid.frames[0].gripX=Infinity;assert.equal(visuals.validRarityAtlas(invalid),false);invalid.frames[0].gripX=0;invalid.frames[0].tipX=0;invalid.frames[0].tipY=invalid.frames[0].gripY;assert.equal(visuals.validRarityAtlas(invalid),false);
});
test('measured grip and tip align with all 170 authored poses for every grade including mirrors and hidden blades',()=>{
 const atlas=manifest.equipmentRarities,rareImage={},oldImage={};let checked=0,hidden=0;
 for(const family of Object.values(manifest.directions.hunter))for(const [direction,id]of Object.entries(family)){const mirror=DIRECTION_VIEWS.find(v=>v.key===direction).mirror;for(const pose of manifest.equipmentSockets[id])for(const row of g.ANCIENT_CATALOG.filter(r=>r.slot==='weapon')){
  const ctx=context(),designs={weapon:visuals.visualDesign({...row,id:1,catalogId:row.id,rarity:5}),armor:null,charm:null},frame=visuals.gearFrame(manifest.equipment,designs.weapon,atlas).frame;visuals.drawEquipment(ctx,oldImage,manifest.equipment,designs,pose,123,456,110,mirror,.85,'front',{image:rareImage,atlas});assert.equal(ctx.depth,0);
  if(pose.weaponHidden){assert.equal(ctx.calls.length,0);hidden++;continue;}const call=ctx.calls[0];assert.equal(call.image,rareImage);const [sx,sy,sw,sh,dx,dy,dw,dh]=call.args;assert.equal(sx,frame.x);assert.equal(sy,frame.y);
  const grip=map(call.t,dx+frame.gripX/sw*dw,dy+frame.gripY/sh*dh),tip=map(call.t,dx+frame.tipX/sw*dw,dy+frame.tipY/sh*dh);near(grip.x,123+mirror*110*pose.handX);near(grip.y,456+110*pose.handY);near(tip.x,123+mirror*110*(pose.handX+Math.cos(pose.angle)*pose.bladeLength));near(tip.y,456+110*(pose.handY+Math.sin(pose.angle)*pose.bladeLength));checked++;
 }}assert.equal(checked,8517);assert.equal(hidden,153);// 51 ancient weapons (48 + 3 raid, Alpha 0.123)
});
test('armor and charm alone never draw character layers, aura or cosmetic attack accents',()=>{
 const secondaryItems=[...Array.from({length:5},(_,rarity)=>['armor','charm'].map(slot=>basic(rarity,slot))).flat(),...g.ANCIENT_CATALOG.filter(r=>r.slot!=='weapon').map(r=>({...r,catalogId:r.id,rarity:5})),...g.CRAFTED_CATALOG.filter(r=>r.slot!=='weapon').map(r=>({...r,catalogId:r.id,rarity:6}))];
 for(const secondary of secondaryItems)for(const back of [false,true]){const designs=visuals.snapshotDesigns({[secondary.slot]:secondary}),before=JSON.stringify(designs),pose={...manifest.equipmentSockets[manifest.directions.hunter.idle.s][0],back},ctx=context(),image={};
  for(const layer of ['back','front'])visuals.drawEquipment(ctx,{},manifest.equipment,designs,pose,30,40,100,-1,.9,layer,{image,atlas:manifest.equipmentRarities});
  visuals.drawEquipmentAura(ctx,designs,30,40,100,.9,.3);visuals.drawEquipmentAttack(ctx,designs,{x:1,y:0},{t:.3,motion:'backhand',flipY:-1},30,40);
  assert.equal(ctx.calls.length,0);assert.equal(ctx.geometry.length,0);assert.equal(ctx.depth,0);assert.deepEqual(ctx.matrix,{a:1,b:0,c:0,d:1,e:0,f:0});assert.equal(JSON.stringify(designs),before);
 }
});
test('grade attack geometries differ and consume no state',()=>{
 const profiles=[];for(const rarity of [3,4,5,6]){const ctx=context(),designs=visuals.snapshotDesigns({weapon:item(rarity)}),swing={x:1,y:0},p={t:.25,motion:'forehand',flipY:1},before=JSON.stringify({designs,swing,p});visuals.drawEquipmentAttack(ctx,designs,swing,p,0,0);assert.equal(ctx.depth,0);assert.equal(JSON.stringify({designs,swing,p}),before);profiles.push(JSON.stringify(ctx.geometry));}assert.equal(new Set(profiles).size,4);
 const basic=context();visuals.drawEquipmentAttack(basic,visuals.snapshotDesigns({weapon:item(2)}),{x:1,y:0},{t:.3,motion:'backhand',flipY:-1},0,0);assert.equal(basic.geometry.length,0);
});
test('secondary equipment cannot change weapon composition, aura or attack cosmetics at any grade',()=>{
 const owned=(row,rarity)=>({...row,catalogId:row.id,rarity}),weapons=[...Array.from({length:5},(_,rarity)=>basic(rarity)),...g.ANCIENT_CATALOG.filter(r=>r.slot==='weapon').map(r=>owned(r,5)),...g.CRAFTED_CATALOG.filter(r=>r.slot==='weapon').map(r=>owned(r,6))];
 const secondarySets=[{},Object.fromEntries(['armor','charm'].map(slot=>[slot,owned(g.ANCIENT_CATALOG.find(r=>r.slot===slot),5)])),Object.fromEntries(['armor','charm'].map(slot=>[slot,owned(g.CRAFTED_CATALOG.find(r=>r.slot===slot),6)]))],image={},rareImage={};
 for(const weapon of weapons)for(const back of [false,true])for(const mirror of [-1,1]){
  let expected;for(const secondary of secondarySets){const designs=visuals.snapshotDesigns({weapon,...secondary}),before=JSON.stringify(designs),ctx=context(),pose={...manifest.equipmentSockets[manifest.directions.hunter.idle.s][0],back};
   for(const layer of ['back','front'])visuals.drawEquipment(ctx,image,manifest.equipment,designs,pose,30,40,100,mirror,.9,layer,{image:rareImage,atlas:manifest.equipmentRarities});
   visuals.drawEquipmentAura(ctx,designs,30,40,100,.9,.3);visuals.drawEquipmentAttack(ctx,designs,{x:1,y:0},{t:.3,motion:'finisher',flipY:-1},30,40);
   const rendered={calls:ctx.calls,geometry:ctx.geometry};if(expected)assert.deepEqual(rendered,expected);else expected=rendered;assert.equal(JSON.stringify(designs),before);assert.equal(ctx.depth,0);assert.deepEqual(ctx.matrix,{a:1,b:0,c:0,d:1,e:0,f:0});
  }
 }
});
test('equipment snapshot is immutable, detached from save items and survives swap without altering game stats',()=>{
 const p=g.createProfile();p.inventory=[item(3),item(6,'weapon',2)];p.equipment.weapon=1;const before=JSON.stringify(p),snapshot=g.equipmentSnapshot(p);assert.equal(JSON.stringify(p),before);assert.ok(Object.isFrozen(snapshot)&&Object.isFrozen(snapshot.weapon));p.equipment.weapon=2;p.inventory[0].rarity=5;assert.equal(snapshot.weapon.rarity,5);assert.equal(visuals.snapshotDesigns(snapshot).weapon.variant,p.inventory[0].catalogId);assert.equal(g.playerStats(p).damage,24);
});
