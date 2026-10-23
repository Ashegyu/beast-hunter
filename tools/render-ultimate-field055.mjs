// Offline production-engine/atlas review; this is not a browser screenshot.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as g from '../dist/game-engine.js';
import {DIRECTION_VIEWS} from '../dist/motion.js';
import {snapshotDesigns,drawEquipment,maskOriginalWeapon} from '../dist/equipment-visuals.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=req('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('../art/skills055/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath(new URL('../dist/assets/fonts/Pretendard-Regular.woff2',import.meta.url).pathname,'Pretendard');
const m=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url))),images=new Map();
for(const name of new Set([...Object.values(m.clips).filter(c=>c.actor==='hunter').map(c=>c.image),m.equipment.image,m.chapters[1].environment,m.skillPresentation.effects.image]))images.set(name,await loadImage(new URL('dist/assets/'+(m.delivery?.[name]??name),root).pathname));
const art=m.skillPresentation,skillArt={atlas:{...art.effects,image:images.get(art.effects.image)}};
const rows=g.SKILL_CATALOG.filter(d=>d.kind!=='passive');
function fixture(d){const p=g.createProfile();p.level=50;p.skillBook=g.restoreSkillBook(null,50);p.skillBook.loadout={active:[null,null],passive:[null,null,null],ultimate:[null]};p.skillBook.loadout[d.kind][0]=d.id;const s=g.createGame(p);g.launch(s);s.spawns=[{id:999,type:'bulwark',x:s.player.x+120,y:s.player.y,delay:0,warning:1}];g.advanceGame(s,.001);s.spawns=[];s.barrels=[];Object.assign(s.enemies[0],{hp:100000,maxHp:100000,speed:0,cooldown:1000,guard:0,guardMax:0});s.player.invulnerable=100;g.useSkill(s,d.id,{x:1,y:0});return {s,origin:{x:s.player.x,y:s.player.y},designs:snapshotDesigns(g.equipmentSnapshot(p))};}
function actor(c,s,a,designs,forced=null,alpha=1){const pose=forced??g.skillActorPose(s)??{action:'idle',frame:0,heading:a.heading??2,lift:0,offsetX:0,offsetY:0,scaleY:1,gearTurn:0},v=DIRECTION_VIEWS[pose.heading],id=m.directions.hunter[pose.action][v.key],clip=m.clips[id],f=clip.frames[Math.min(pose.frame,clip.frames.length-1)],socket=m.equipmentSockets[id][Math.min(pose.frame,clip.frames.length-1)],x=a.x+pose.offsetX,y=a.y+pose.offsetY,h=126,scale=h/f.bodyHeight;
 c.save();c.translate(x,y);c.scale(1,1/.65);c.translate(0,-pose.lift);c.scale(1,pose.scaleY);c.translate(-x,-y);c.save();if(designs.weapon)maskOriginalWeapon(c,socket,x,y,h,v.mirror);c.translate(x,y);c.scale(v.mirror*scale,scale);c.globalAlpha=alpha;c.drawImage(images.get(clip.image),f.x,f.y,f.w,f.h,-f.pivotX,-f.pivotY,f.w,f.h);c.restore();drawEquipment(c,images.get(m.equipment.image),m.equipment,designs,{...socket,angle:socket.angle+pose.gearTurn},x,y,h,v.mirror,alpha);c.restore();}
const urows=rows.filter(d=>d.kind==='ultimate'),ustates=urows.map(fixture),uc=createCanvas(1170,780),u=uc.getContext('2d'),uframes=new URL('frames-field/',out);fs.mkdirSync(uframes,{recursive:true});
for(let frame=0;frame<48;frame++){
 u.fillStyle='#141a23';u.fillRect(0,0,1170,780);
 for(const [i,d]of urows.entries()){
  const {s,origin,designs}=ustates[i];u.save();u.beginPath();u.rect(i*390,0,390,780);u.clip();u.translate(i*390,0);
  u.globalAlpha=.45;u.drawImage(images.get(m.chapters[1].environment),0,0,390,780);u.globalAlpha=1;
  u.fillStyle='#11131ed9';u.fillRect(0,0,390,65);u.font='20px Pretendard';u.fillStyle='#ffe4ea';u.fillText(d.name,20,32);u.font='12px Pretendard';u.fillStyle='#b7a5b6';u.fillText('인게임 검기 · 잔상 · 충격파',20,53);
  u.save();u.translate(105,440);u.scale(.48,.48*.65);u.translate(-origin.x,-origin.y);g.drawSkillBuffs(u,s);g.drawImageSkillBuffs(u,s,skillArt);for(const ghost of g.skillGhosts(s))actor(u,s,ghost,designs,ghost.pose,ghost.alpha);actor(u,s,s.player,designs);for(const f of s.effects)if(f.type==='skillCast'||f.type==='skillImpact')g.drawImageSkillEffect(u,f,f.ttl/f.maxTtl,skillArt);g.drawUltimateField(u,s,skillArt);u.restore();
  u.fillStyle='#11131ed9';u.fillRect(0,720,390,60);u.fillStyle='#c2acbf';u.font='13px Pretendard';u.fillText('오프라인 렌더 · '+(frame/24).toFixed(2)+'초',20,749);u.restore();
  for(let k=0;k<5;k++)g.advanceGame(s,1/120);
 }
 fs.writeFileSync(new URL(String(frame).padStart(3,'0')+'.png',uframes),uc.toBuffer('image/png'));if(frame===20)fs.writeFileSync(new URL('ultimate-field-contact.png',out),uc.toBuffer('image/png'));
}
console.log(out.pathname);
