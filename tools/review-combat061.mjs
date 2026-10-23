// Offline production atlas/renderer review. No browser or mobile-device claim.
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import * as game from '../dist/game-engine.js';
import {DIRECTION_VIEWS} from '../dist/motion.js';
import {GROUND_DEPTH_SCALE} from '../dist/world.js';
import {snapshotDesigns,drawEquipment,maskOriginalWeapon} from '../dist/equipment-visuals.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=req('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('../art/quality061/',import.meta.url);fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath(new URL('../dist/assets/fonts/IBMPlexSansKR-Regular.woff2',import.meta.url).pathname,'Hunter UI');
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url))),images=new Map();
const actorClips=Object.values(manifest.clips).filter(c=>['hunter','bulwark','spitter'].includes(c.actor));
for(const name of new Set([...actorClips.map(c=>c.image),manifest.equipment.image,manifest.chapters[1].environment,manifest.skillPresentation.effects.image]))images.set(name,await loadImage(new URL('dist/assets/'+(manifest.delivery?.[name]??name),root).pathname));
const skillArt={atlas:{...manifest.skillPresentation.effects,image:images.get(manifest.skillPresentation.effects.image)}};
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function section(from,to){return source.slice(source.indexOf('function '+from+'('),source.indexOf('function '+to+'('));}
const warningSource=section('ring','dropSeal')+section('chargeBorder','core');
const canvas=createCanvas(1260,720),ctx=canvas.getContext('2d');
function sprite(s,a,player=false){
 const pose=player?game.skillActorPose(s):null,view=DIRECTION_VIEWS[pose?.heading??(player?2:4)],type=player?'hunter':a.type,action=player?(pose?.action??'idle'):'walk',clipId=manifest.directions[type][action][view.key],clip=manifest.clips[clipId],frameIndex=Math.min(pose?.frame??0,clip.frames.length-1),f=clip.frames[frameIndex],h=player?126:150,scale=h/f.bodyHeight,x=a.x+(pose?.offsetX??0),y=a.y+(pose?.offsetY??0);
 ctx.save();ctx.translate(x,y);ctx.scale(1,1/GROUND_DEPTH_SCALE);ctx.translate(0,-(pose?.lift??0));ctx.scale(1,pose?.scaleY??1);ctx.translate(-x,-y);
 const designs=player?snapshotDesigns(game.equipmentSnapshot(s.profile)):null,socket=player?manifest.equipmentSockets[clipId][frameIndex]:null;
 ctx.save();if(designs?.weapon)maskOriginalWeapon(ctx,socket,x,y,h,view.mirror);ctx.translate(x,y);ctx.scale(view.mirror*scale,scale);ctx.drawImage(images.get(clip.image),f.x,f.y,f.w,f.h,-f.pivotX,-f.pivotY,f.w,f.h);ctx.restore();
 if(player)drawEquipment(ctx,images.get(manifest.equipment.image),manifest.equipment,designs,{...socket,angle:socket.angle+(pose?.gearTurn??0)},x,y,h,view.mirror,1);ctx.restore();
}
const ids=['bloodmoon','eclipse','phantoms'];
for(const [i,id]of ids.entries()){
 const p=game.createProfile();p.level=50;p.skillBook=game.restoreSkillBook(null,50);p.skillBook.loadout.ultimate=[id];const state=game.createGame(p);game.launch(state);
 state.spawns=[{id:999,type:'bulwark',x:state.player.x+170,y:state.player.y+70,delay:0,warning:1}];game.advanceGame(state,.001);state.spawns=[];state.barrels=[];
 const e=state.enemies[0];Object.assign(e,{hp:100000,maxHp:100000,speed:0,cooldown:1000,guard:0,guardMax:0});state.player.invulnerable=100;game.useSkill(state,id,{x:1,y:0});
 const age=id==='eclipse'?.7:.4;for(let k=0;k<Math.round(age*120);k++)game.advanceGame(state,1/120);
 Object.assign(e,{type:i===0?'spitter':'bulwark',species:undefined,boss:false,elite:i===1,pattern:i===1?1:0,action:'windup',actionTime:.75,windup:1,targetX:state.player.x+110,targetY:state.player.y+45,radius:85});
 const env=vm.createContext({ctx,state,game,camera:{},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),visibleInCamera:()=>true,COMBAT_INK:{silver:'#f7dfe9',edge:'#25101d',danger:'#f2b58b',urgent:'#ffe1ad'}});vm.runInContext(warningSource,env);
 ctx.save();ctx.beginPath();ctx.rect(i*420,0,420,720);ctx.clip();ctx.translate(i*420,0);ctx.fillStyle='#151923';ctx.fillRect(0,0,420,720);
 ctx.globalAlpha=.45;ctx.drawImage(images.get(manifest.chapters[1].environment),0,65,420,500);ctx.globalAlpha=1;
 ctx.fillStyle='#f7dfe9';ctx.font='21px "Hunter UI"';ctx.fillText(game.SKILL_BY_ID[id].name,22,35);ctx.fillStyle='#c1adb9';ctx.font='13px "Hunter UI"';ctx.fillText(['탄환 + 부채꼴 예고','돌진 경로 + 강타','범위 예고 + 방어 타격'][i],22,57);
 ctx.save();ctx.translate(125,325);ctx.scale(.65,.65*GROUND_DEPTH_SCALE);ctx.translate(-state.player.x,-state.player.y);
 vm.runInContext('telegraphs()',env);game.drawSkillBuffs(ctx,state);game.drawImageSkillBuffs(ctx,state,skillArt);sprite(state,state.player,true);sprite(state,e);game.drawUltimateField(ctx,state,skillArt);
 for(const f of state.effects)if(f.type==='skillCast'||f.type==='skillImpact')game.drawImageSkillEffect(ctx,f,f.ttl/f.maxTtl,skillArt);
 game.drawHitImpact(ctx,{id:8,x:e.x,y:e.y-40,ttl:.12,maxTtl:.17,nx:1,ny:0,heavy:i===1,guarded:i===2});
 for(let n=0;n<3;n++)game.drawCombatProjectile(ctx,{x:state.player.x+40+n*70,y:state.player.y+45+n*30,vx:-250,vy:40,friendly:false});vm.runInContext('telegraphs(true)',env);ctx.restore();
 ctx.fillStyle='#11131e';ctx.fillRect(0,530,420,190);ctx.fillStyle='#b4a8b8';ctx.font='12px "Hunter UI"';ctx.fillText('실제 효과 아틀라스 · 오프라인 렌더',22,553);
 for(const [n,label]of ['일반','강타','치명타','방어'].entries()){
  game.drawHitImpact(ctx,{id:2,x:54+n*104,y:615,ttl:.12,maxTtl:.17,nx:1,ny:0,heavy:n===1,critical:n===2,guarded:n===3});ctx.fillStyle='#d7c8d1';ctx.font='13px "Hunter UI"';ctx.textAlign='center';ctx.fillText(label,54+n*104,665);ctx.textAlign='left';
 }
 ctx.restore();
}
fs.writeFileSync(new URL('combat-contact.png',out),canvas.toBuffer('image/png'));
// Bounded new feedback work: 10 local contacts and 64 shots, canvas CPU only.
const bench=createCanvas(720,720).getContext('2d'),f={id:1,x:300,y:300,ttl:.12,maxTtl:.17,nx:1,ny:0,heavy:true},q={x:400,y:400,vx:-200,vy:50,friendly:false},samples=[];
for(let frame=0;frame<240;frame++){const t=performance.now();for(let n=0;n<10;n++)game.drawHitImpact(bench,f);for(let n=0;n<64;n++)game.drawCombatProjectile(bench,q);if(frame>=40)samples.push(performance.now()-t);}
samples.sort((a,b)=>a-b);const report={scope:'Offline N-API canvas CPU, new feedback renderers only; excludes browser/GPU/audio/device',contacts:10,shots:64,samples:samples.length,p95Ms:samples[Math.floor(samples.length*.95)],maxMs:samples.at(-1)};fs.writeFileSync(new URL('feedback-cpu.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
