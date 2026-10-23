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
const out=new URL('../art/quality077/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const ui=await host({canvasFactory:()=>createCanvas(390,780),decoded,campaign:true,box:{left:0,top:0,width:390,height:780}});ui.emit('start','click');ui.tick();const s=ui.state,p=s.player;
s.spawns=[];s.barrels=[];s.pickups=[];s.run.waveQuota=1000;s.paused=true;
const template=s.enemies[0];s.enemies=[{...template,id:9000,type:'bulwark',species:'forest_orc',x:p.x+160,y:p.y,targetX:p.x-50,targetY:p.y+110,radius:100,action:'windup',actionTime:.8,windup:1,dead:false}];
const board=createCanvas(1248,1680),bc=board.getContext('2d'),report=[],ages=[.08,.32,.58,.84];
const before=JSON.stringify([s.profile,s.enemies,s.rng,s.lootRng,s.materialRng]);
for(const [row,[rarity,perfect,label]]of [[1,false,'일반 획득'],[3,false,'전설 획득'],[4,false,'신화 획득'],[3,true,'극옵 획득']].entries())for(const [column,age]of ages.entries()){
 s.effects=[{id:10001,type:'lootPickup',x:p.x,y:p.y,rarity,perfect,maxTtl:1,ttl:1-age}];ui.calls.length=0;ui.tick(0);
 const png=ui.surface.toBuffer('image/png'),shot=await loadImage(png),x=column*312,y=row*420;bc.fillStyle='#10161a';bc.fillRect(x,y,312,420);bc.drawImage(shot,0,150,390,500,x,y+20,312,400);bc.fillStyle='#e2d3b6';bc.font='12px "Hunter UI"';bc.fillText(label+' · '+(column+1)+'단계',x+10,y+15);
 report.push({rarity,perfect,age,draws:ui.calls.filter(c=>c.image?.includes('loot-pickup-v077')).map(c=>c.args)});
}
s.effects=[];ui.tick(0);fs.writeFileSync(new URL('windup-without-area.png',out),ui.surface.toBuffer('image/png'));
if(JSON.stringify([s.profile,s.enemies,s.rng,s.lootRng,s.materialRng])!==before)throw Error('Render mutated simulation');
fs.writeFileSync(new URL('pickup-atlas-in-game.png',out),board.toBuffer('image/png'));fs.writeFileSync(new URL('scenes.json',out),JSON.stringify({scope:'Actual app Canvas with decoded assets, controlled receipt/windup fixtures. Offline native render, not a browser screenshot.',stateUnchanged:true,atlas:m.pickupEffects,report},null,2));console.log(out.pathname);
