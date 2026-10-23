// Offline QA: run the real app draw loop with native Canvas and decoded assets.
// Reuse the integration DOM host. This does not claim browser/device/GPU QA.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {rollItem} from '../dist/loot.js';
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
code=code.replace('export async function host({canvasFactory,decoded,','export async function host({canvasFactory,decoded,appSource,').replace('new vm.SourceTextModule(source,{context})','new vm.SourceTextModule(appSource??source,{context})');
const {host}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const out=new URL('../art/quality075/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const beforeApp=execFileSync('git',['show','19eba118b865c554208eb6a2bbb943ec54a13346:dist/app.js'],{encoding:'utf8'});
let calls=0;const item=rollItem({id:990,tier:1},()=>++calls===1?.02/36:calls===2?.985:.3);
const board=createCanvas(780,600),bc=board.getContext('2d'),report=[];
for(const [column,mode] of ['before','after'].entries()){
 const ui=await host({canvasFactory:()=>createCanvas(390,780),decoded,appSource:mode==='before'?beforeApp:undefined,campaign:true,recordGeometry:true,box:{left:0,top:0,width:390,height:780}});
 ui.emit('start','click');ui.tick();const s=ui.state,p=s.player;s.enemies=[];s.spawns=[];s.barrels=[];s.effects=[];s.pickups=[];p.invulnerable=999;
 const x=p.x+100,y=p.y+35;s.pickups=[{id:991,kind:'equipment',item,x,y,age:.22}];s.effects=[{id:992,type:'gearDrop',source:'elite',item,rarity:item.rarity,x,y,ttl:2.18,maxTtl:2.4}];ui.tick(0);
 const png=ui.surface.toBuffer('image/png');fs.writeFileSync(new URL(mode+'-arena.png',out),png);const shot=await loadImage(png);
 bc.fillStyle='#10161a';bc.fillRect(column*390,0,390,600);bc.drawImage(shot,0,130,390,530,column*390,50,390,530);bc.fillStyle='#e2d3b6';bc.font='16px "Hunter UI"';bc.fillText(mode==='before'?'0.74 · 기존 전설 드롭':'0.75 · 극옵 전설 드롭',column*390+14,30);
 report.push({mode,rarity:item.rarity,perfect:item.perfect,viewport:[ui.surface.width,ui.surface.height],scope:'Actual app Canvas only. CSS/DOM HUD, browser and device rendering excluded.'});
}
fs.writeFileSync(new URL('loot-comparison.png',out),board.toBuffer('image/png'));fs.writeFileSync(new URL('scenes.json',out),JSON.stringify(report,null,2));console.log(out.pathname);
