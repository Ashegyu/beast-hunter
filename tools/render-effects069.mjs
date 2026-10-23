// Offline production render review. No browser, mobile or GPU verification claim.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import * as g from '../dist/game-engine.js';
import {DIRECTION_VIEWS} from '../dist/motion.js';
import {GROUND_DEPTH_SCALE as G} from '../dist/world.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=req('@napi-rs/canvas');
GlobalFonts.registerFromPath(new URL('../dist/assets/fonts/IBMPlexSansKR-Regular.woff2',import.meta.url).pathname,'Hunter UI');
const out=new URL('../art/quality069/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const m=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url))),images=new Map();
for(const name of new Set([m.skillPresentation.effects.image,...Object.values(m.monsterEffects).map(a=>a.image),...Object.values(m.clips).filter(c=>c.actor==='hunter'||c.actor?.startsWith('forest')||c.actor?.startsWith('ruins')||c.actor?.startsWith('frost')).map(c=>c.image)]))images.set(name,await loadImage(new URL('../dist/assets/'+(m.delivery?.[name]??name),import.meta.url).pathname));
// Actor ids in older atlases can be generic, so explicitly include every selected clip image.
for(const actor of Object.keys(m.directions))for(const dir of Object.values(m.directions[actor].idle??m.directions[actor].walk)){
 const path=m.clips[dir].image;if(!images.has(path))images.set(path,await loadImage(new URL('../dist/assets/'+(m.delivery?.[path]??path),import.meta.url).pathname));
}
const skill={atlas:{...m.skillPresentation.effects,image:images.get(m.skillPresentation.effects.image)}},monster={atlases:m.monsterEffects,images};
const baseSha='d3e239dbc5cc6f21d8f82f9cb27b793bc79665d1';
const oldSource=execFileSync('git',['show',baseSha+':dist/skill-image-fx.js'],{encoding:'utf8'});
const previous=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
function sprite(ctx,id,x,y,height,heading=0){const view=DIRECTION_VIEWS[heading],group=m.directions[id],clip=m.clips[(group.idle??group.walk)[view.key]],f=clip.frames[0],scale=height/f.bodyHeight;ctx.save();ctx.translate(x,y);ctx.scale(view.mirror*scale,scale/G);ctx.drawImage(images.get(clip.image),f.x,f.y,f.w,f.h,-f.pivotX,-f.pivotY,f.w,f.h);ctx.restore();}
function text(ctx,s,x,y,size=14,color='#ded2b9'){ctx.font=`${size}px "Hunter UI"`;ctx.fillStyle=color;ctx.fillText(s,x,y);}
const c=createCanvas(1440,600),ctx=c.getContext('2d');ctx.fillStyle='#0d1319';ctx.fillRect(0,0,c.width,c.height);text(ctx,'월아참 8방향 · 이전 / 수정 · 실제 렌더 함수 비교 (오프라인)',16,26,18);
for(let i=0;i<8;i++){
 const x=i%4*360,y=Math.floor(i/4)*270+42,a=i*Math.PI/4,n={x:Math.cos(a),y:Math.sin(a)};
 ctx.fillStyle='#192329';ctx.fillRect(x+4,y,352,258);text(ctx,['E','SE','S','SW','W','NW','N','NE'][i],x+12,y+23);
 for(const [j,renderer]of [previous,g].entries()){
  text(ctx,j?'수정':'이전',x+20+j*176,y+48,12,j?'#b0ddbf':'#bb9a9a');ctx.save();ctx.beginPath();ctx.rect(x+5+j*176,y+54,174,200);ctx.clip();ctx.translate(x+90+j*176,y+165);ctx.scale(.48,.48*G);
  ctx.strokeStyle='#527b66';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(n.x*170,n.y*170);ctx.stroke();sprite(ctx,'hunter',0,0,126,i);
  renderer.drawImageSkillEffect(ctx,{type:'skillImpact',skillId:'crescent',x:0,y:0,n,radius:160},.7,skill);ctx.restore();
 }
}
fs.writeFileSync(new URL('character-direction-review.png',out),c.toBuffer('image/png'));
const z=createCanvas(1120,810),d=z.getContext('2d');d.fillStyle='#0d1319';d.fillRect(0,0,z.width,z.height);text(d,'몬스터 이미지 이펙트 · 실제 공격 데이터/렌더 함수 (오프라인)',16,27,18);
const species=[['forest_wolf','forest_mushroom','forest_devourer','forest_spider'],['ruins_skeleton','ruins_wraith','ruins_mimic','ruins_bat'],['frost_leopard','frost_wisp','frost_yeti','frost_leopard']];
for(let chapter=1;chapter<=3;chapter++)for(let col=0;col<4;col++){
 const p=g.createProfile();p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];const s=g.createGame(p);g.launch(s,chapter,9);s.barrels=[];const id=species[chapter-1][col],design=(await import('../dist/chapters.js')).MONSTERS[id];s.spawns=[{id:900,type:design.role,species:id,x:1000,y:1000,delay:0}];g.advanceGame(s,.001);const e=s.enemies[0];s.player.invulnerable=999;e.targetX=e.x+130;e.targetY=e.y;
 const x=col*280,y=(chapter-1)*250+47;d.fillStyle='#192329';d.fillRect(x+4,y,272,240);text(d,['붉은 숲','망자의 폐성','서리 왕좌'][chapter-1]+' · '+['베기','투사체','강타','돌진'][col],x+15,y+24,14);text(d,design.name,x+15,y+46,11,'#a4b4ac');
 d.save();d.beginPath();d.rect(x+5,y+50,270,188);d.clip();d.translate(x+75,y+191);d.scale(.6,.6*G);d.translate(-e.x,-e.y);
 if(col===3){Object.assign(e,{action:'attack',actionTime:.12,chargeX:1,chargeY:0});g.drawMonsterCharge(d,e,chapter,monster);}
 sprite(d,id,e.x,e.y,design.height,0);
 if(col===0||col===2)g.drawMonsterAttackEffect(d,{type:'slam',x:e.targetX,y:e.targetY,radius:col===0?62:105,fxChapter:chapter,monsterKind:col===0?'skitter':'bulwark',nx:1,ny:0,ttl:.18,maxTtl:.35},1,monster);
 if(col===1){Object.assign(e,{action:'windup',actionTime:0,windup:.01});g.advanceGame(s,.025);const q=s.projectiles[0];q.x=e.x+135;q.y=e.y;g.drawMonsterProjectile(d,q,s.run.time,monster);g.drawCombatProjectile(d,q);}
 d.restore();
}
fs.writeFileSync(new URL('monster-effects-review.png',out),z.toBuffer('image/png'));console.log(out.pathname);
