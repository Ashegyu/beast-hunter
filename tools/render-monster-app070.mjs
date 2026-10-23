// Offline QA: run the real app draw loop with native Canvas and decoded assets.
// Reuse the integration DOM host. This does not claim browser/device/GPU QA.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {regionAssetPlan} from '../dist/region-assets.js';
import * as g from '../dist/game-engine.js';
import {CHAPTERS,MONSTERS} from '../dist/chapters.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=req('@napi-rs/canvas');
GlobalFonts.registerFromPath(new URL('../dist/assets/fonts/IBMPlexSansKR-Regular.woff2',import.meta.url).pathname,'Hunter UI');
const root=new URL('../dist/',import.meta.url),m=JSON.parse(fs.readFileSync(new URL('assets/manifest.json',root))),plan=regionAssetPlan(m,CHAPTERS),decoded=new Map();
for(const path of new Set([...plan.paths,...[...plan.regions.values()].flatMap(r=>[...r.paths])])){
 const url='assets/'+(m.delivery?.[path]??path);decoded.set(url,await loadImage(new URL(url,root).pathname));
}
const original=fs.readFileSync(new URL('../tests/game-ui.test.mjs',import.meta.url),'utf8');
const label=process.argv[2]??'after',baseline='9302471fee0e7f7bb6a3904b215c252dc25a4a2e';let baselineApp;
let code=original.slice(0,original.indexOf("test('"));
code+=original.slice(original.indexOf('const attrs='),original.indexOf("test('actual stage transition"));
code+=original.slice(original.indexOf('async function host('),original.indexOf("test('weapon cards,"));
if(label==='before'){
 const read=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'});
 const oldFX=read('dist/monster-fx.js').replace("'./world.js'",JSON.stringify(new URL('world.js',root).href));
 const oldURL='data:text/javascript;base64,'+Buffer.from(oldFX).toString('base64');
 code=code.replace("import * as game from '../dist/game-engine.js';",`import * as currentGame from '../dist/game-engine.js';import * as oldFX from ${JSON.stringify(oldURL)};const game={...currentGame,...oldFX};`);
 baselineApp=read('dist/app.js');
}
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
if(baselineApp)code=code.replace("fs.readFileSync(new URL('app.js',root),'utf8')",JSON.stringify(baselineApp));
const {host}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const out=new URL('../art/quality070/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const board=createCanvas(390*4,390*3),ctx=board.getContext('2d');
const species=[['forest_wolf','forest_mushroom','forest_devourer','forest_spider'],['ruins_skeleton','ruins_wraith','ruins_mimic','ruins_bat'],['frost_wolf','frost_wisp','frost_golem','frost_leopard']];
for(let chapter=1;chapter<=3;chapter++)for(let col=0;col<4;col++){
 const p=g.createProfile(1e6);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];
 const ui=await host({canvasFactory:()=>createCanvas(390,780),decoded,saved:p,campaign:true,box:{left:0,top:0,width:390,height:780}});
 ui.emit('nav-hunt','click');ui.emit('stage-'+chapter,'click');await ui.settle();ui.emit('run-stage-9','click');ui.emit('start','click');
 if(ui.state.phase!=='playing')throw Error(ui.nodes.get('loading').textContent);
 ui.tick(0);const s=ui.state;s.enemies=[];s.effects=[];s.projectiles=[];s.barrels=[];s.player.invulnerable=999;
 const id=species[chapter-1][col],role=MONSTERS[id].role;s.spawns=[{id:900,type:role,species:id,x:s.player.x-155,y:s.player.y-70,delay:0}];g.advanceGame(s,.001);const e=s.enemies[0];s.spawns=[];
 Object.assign(e,{action:'windup',actionTime:0,windup:.06,targetX:s.player.x,targetY:s.player.y,aggro:true,pattern:col===3?Math.max(0,e.attackCycle?.indexOf('charge')??1):0});
 if(col===3&&!e.attackCycle)e.chargeEvery=1;
 ui.run(.1);
 if(col===1)ui.run(.15);
 if(col===3)ui.run(.05);
 const kind=['베기','투사체','강타','돌진'][col];
 fs.writeFileSync(new URL(`${label}-${chapter}-${col}.png`,out),ui.surface.toBuffer('image/png'));
 ctx.drawImage(ui.surface,0,220,390,350,col*390,(chapter-1)*390+40,390,350);
 ctx.fillStyle='#0d1319';ctx.fillRect(col*390,(chapter-1)*390,390,40);ctx.fillStyle='#e7d8be';ctx.font='16px "Hunter UI"';ctx.fillText(`${chapter} · ${kind} · ${MONSTERS[id].name} (${label})`,col*390+12,(chapter-1)*390+26);
}
fs.writeFileSync(new URL(label+'-app-contact-sheet.png',out),board.toBuffer('image/png'));console.log(new URL(label+'-app-contact-sheet.png',out).pathname);
