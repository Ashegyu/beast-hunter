// Offline QA: run the real app draw loop with native Canvas and decoded assets.
// Reuse the integration DOM host. This does not claim browser/device/GPU QA.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {regionAssetPlan} from '../dist/region-assets.js';
import * as g from '../dist/game-engine.js';
import {CHAPTERS} from '../dist/chapters.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=req('@napi-rs/canvas');
GlobalFonts.registerFromPath(new URL('../dist/assets/fonts/IBMPlexSansKR-Regular.woff2',import.meta.url).pathname,'Hunter UI');
const root=new URL('../dist/',import.meta.url),m=JSON.parse(fs.readFileSync(new URL('assets/manifest.json',root))),plan=regionAssetPlan(m,CHAPTERS),decoded=new Map();
for(const path of new Set([...plan.paths,...[...plan.regions.values()].flatMap(r=>[...r.paths])])){
 const url='assets/'+(m.delivery?.[path]??path);decoded.set(url,await loadImage(new URL(url,root).pathname));
}
const original=fs.readFileSync(new URL('../tests/game-ui.test.mjs',import.meta.url),'utf8');
let code=original.slice(0,original.indexOf("test('"));
code+=original.slice(original.indexOf('const attrs='),original.indexOf("test('actual stage transition"));
code+=original.slice(original.indexOf('async function host('),original.indexOf("test('weapon cards,"));
code=code.replace('async function host({','export async function host({canvasFactory,decoded,');
const begin=code.indexOf('  let transform='),end=code.indexOf('  class Element',begin);
code=code.slice(0,begin)+`  const surface=canvasFactory(),native=surface.getContext('2d'),geometry=[];
  const ctx=new Proxy(native,{get(target,key){if(key==='drawImage')return(image,...args)=>{calls.push({image:image.src,args});return target.drawImage(image._native??image,...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){return Reflect.set(target,key,value,target);}});
`+code.slice(end);
code=code.replace("canvas.width=600;canvas.height=380;canvas.getContext=()=>ctx;",`Object.defineProperties(canvas,{width:{get:()=>surface.width,set:v=>surface.width=v},height:{get:()=>surface.height,set:v=>surface.height=v}});canvas.getContext=()=>ctx;`);
code=code.replace("preview.getContext=()=>({...ctx,clearRect(){},drawImage(){}});",`preview.getContext=()=>createPreviewContext();`);
code=code.replace('requestedImages.push(path);','requestedImages.push(path);this._native=decoded.get(path);assert.ok(this._native,path);');
code=code.replace('const api={async settle()', 'const api={surface,async settle()');
code=code.replace("new URL('../dist/',import.meta.url)",`new URL(${JSON.stringify(root.href)})`);
code=code.replace(/from '([^']+)'/g,(_,path)=>'from '+JSON.stringify(new URL(path.replace('./combat-fixture.mjs','../tests/combat-fixture.mjs'),new URL('../tests/game-ui.test.mjs',import.meta.url)).href));
// Equipment preview also receives wrapper images; keep it separate from arena.
code=`import {createRequire} from 'node:module';const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');const {createCanvas}=require('@napi-rs/canvas');function createPreviewContext(){const c=createCanvas(240,280).getContext('2d');return new Proxy(c,{get(t,k){if(k==='drawImage')return(i,...a)=>t.drawImage(i._native??i,...a);const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;},set(t,k,v){return Reflect.set(t,k,v,t);}});}\n`+code;
const {host}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const out=new URL('../art/quality078/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const ui=await host({canvasFactory:()=>createCanvas(390,780),decoded,campaign:true,box:{left:0,top:0,width:390,height:780}});ui.emit('start','click');ui.tick();const s=ui.state,p=s.player;s.enemies=[];s.spawns=[];s.barrels=[];s.run.waveQuota=1000;p.invulnerable=999;
s.profile.legendaryPity=19;s.spawns=[{id:s.nextId++,type:'bulwark',species:'forest_orc',elite:true,x:p.x+190,y:p.y+50,delay:0,warning:0,locked:true}];g.advanceGame(s,.001);const e=s.enemies[0];s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);
const board=createCanvas(1170,560),bc=board.getContext('2d'),report=[],flash=s.effects.find(f=>f.type==='gearDrop'),item=flash.item;
const capture=async(column,name)=>{ui.calls.length=0;ui.tick(0);const png=ui.surface.toBuffer('image/png');fs.writeFileSync(new URL(name+'.png',out),png);const shot=await loadImage(png);bc.fillStyle='#10161a';bc.fillRect(column*390,0,390,560);bc.drawImage(shot,0,150,390,500,column*390,50,390,500);bc.fillStyle='#e2d3b6';bc.font='14px "Hunter UI"';bc.fillText(name==='drop'?'드롭 순간 · 아이템 위치':name==='collected'?'수집 뒤 · 드롭 위치에서 계속':'연출 종료 · 수집 이펙트 재생 없음',column*390+10,29);report.push({name,drop:[flash.x,flash.y],player:[p.x,p.y],banked:s.profile.inventory.includes(item),pending:s.profile.pendingLoot.includes(item),imageDraws:ui.calls.filter(c=>c.image?.includes('loot-pickup-v077')).map(c=>c.args)});};
ui.run(.2);await capture(0,'drop');for(const drop of s.pickups){drop.x=p.x;drop.y=p.y;}ui.run(.45);await capture(1,'collected');ui.run(.5);await capture(2,'finished');fs.writeFileSync(new URL('drop-timing.png',out),board.toBuffer('image/png'));fs.writeFileSync(new URL('scenes.json',out),JSON.stringify({scope:'Real monster kill and collection in actual app Canvas, offline native render. Not a browser screenshot.',report},null,2));console.log(out.pathname);
