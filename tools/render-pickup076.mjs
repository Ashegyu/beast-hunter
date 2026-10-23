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
const out=new URL('../art/quality076/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const ui=await host({canvasFactory:()=>createCanvas(390,780),decoded,campaign:true,box:{left:0,top:0,width:390,height:780}});ui.emit('start','click');ui.tick();const s=ui.state,p=s.player;s.enemies=[];s.spawns=[];s.barrels=[];s.run.waveQuota=1000;p.invulnerable=999;
let seed=0;for(;seed<10000;seed++){const v=((Math.imul(1664525,seed)+1013904223)>>>0)/4294967296*36;if(v%1<.08)break;}s.lootRng=seed;s.materialRng=2000;s.profile.legendaryPity=19;
s.spawns=[{id:s.nextId++,type:'bulwark',species:'forest_orc',elite:true,x:p.x+180,y:p.y,delay:0,warning:0,locked:true}];g.advanceGame(s,.001);const e=s.enemies[0];s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);ui.run(.15);
const board=createCanvas(1170,560),bc=board.getContext('2d'),report=[];
const capture=async(column,name)=>{const png=ui.surface.toBuffer('image/png');fs.writeFileSync(new URL(name+'.png',out),png);const shot=await loadImage(png);bc.fillStyle='#10161a';bc.fillRect(column*390,0,390,560);bc.drawImage(shot,0,150,390,500,column*390,50,390,500);bc.fillStyle='#e2d3b6';bc.font='15px "Hunter UI"';bc.fillText(name==='floor'?'바닥 드롭 · 지급 전':name==='collect'?'실제 수집 · 골드와 재료 지급':'극옵 획득 · 추가 파동',column*390+12,29);report.push({name,gold:s.profile.gold,pendingGold:s.profile.pendingGold,materials:structuredClone(s.profile.materials),pendingMaterials:structuredClone(s.profile.pendingMaterials),items:s.run.items,effects:s.effects.map(f=>f.type)});};
await capture(0,'floor');for(const drop of s.pickups){drop.x=p.x;drop.y=p.y;}ui.run(.5);await capture(1,'collect');ui.run(.16);await capture(2,'pulse');
fs.writeFileSync(new URL('pickup-scenes.png',out),board.toBuffer('image/png'));
// A configured boss fixture exercises real payout and the result DOM bindings.
s.enemies=[];s.spawns=[];s.barrels=[];s.run.stage=10;s.run.wave=1;s.run.bossSpawned=true;s.spawns=[{id:s.nextId++,type:'bulwark',species:'forest_guardian',boss:true,x:p.x+120,y:p.y,delay:0,warning:0,locked:true}];g.advanceGame(s,.001);const boss=s.enemies[0];s.projectiles.push({id:s.nextId++,x:boss.x,y:boss.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);ui.run(1.2);
const gallery=createCanvas(520,210),gc=gallery.getContext('2d');gc.fillStyle='#10161a';gc.fillRect(0,0,520,210);gc.fillStyle='#e2d3b6';gc.font='16px "Hunter UI"';gc.fillText('결과 장비 원화 확인 · 오프라인',14,25);const rows=[];
for(let n=0;n<12;n++){if(ui.nodes.get('result-loot-'+n).hidden)continue;const icon=ui.nodes.get('result-loot-art-'+n),frame=icon.atlasFrame,path=icon.style.backgroundImage.match(/url\("([^"\)]+)"\)/)[1],img=decoded.get(path);if(!img)throw Error(path);const x=20+n*124,scale=64/Math.max(frame.w,frame.h);gc.strokeStyle=ui.nodes.get('result-loot-'+n).style.borderColor;gc.strokeRect(x,47,104,140);gc.drawImage(img,frame.x,frame.y,frame.w,frame.h,x+52-frame.w*scale/2,53,frame.w*scale,frame.h*scale);gc.font='11px "Hunter UI"';gc.fillStyle='#e2d3b6';gc.fillText(ui.nodes.get('result-loot-name-'+n).textContent,x+5,145,94);gc.fillStyle='#aaada0';gc.fillText(ui.nodes.get('result-loot-state-'+n).textContent,x+5,168);rows.push({name:ui.nodes.get('result-loot-name-'+n).textContent,state:ui.nodes.get('result-loot-state-'+n).textContent,image:path,frame});}
fs.writeFileSync(new URL('result-art-check.png',out),gallery.toBuffer('image/png'));fs.writeFileSync(new URL('scenes.json',out),JSON.stringify({scope:'Actual app Canvas and real result DOM bindings. Result-art-check is a native atlas contact sheet, not a browser/CSS screenshot.',report,gallery:rows},null,2));console.log(out.pathname);
