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
const out=new URL('../art/quality072/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const board=createCanvas(1170,860),ctx=board.getContext('2d'),report=[];
for(let chapter=1;chapter<=3;chapter++){
 const p=g.createProfile(1e6);p.level=20;p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.skillBook=g.restoreSkillBook(null,20);p.skillBook.ranks.crescent=4;
 const ui=await host({canvasFactory:()=>createCanvas(390,780),decoded,saved:p,campaign:true,box:{left:0,top:0,width:390,height:780}});
 ui.emit('nav-hunt','click');ui.emit('stage-'+chapter,'click');await ui.settle();ui.emit('run-stage-9','click');ui.emit('start','click');const s=ui.state;if(s.phase!=='playing')throw Error(ui.nodes.get('loading').textContent);
 s.player.invulnerable=999;s.barrels=[];ui.run(3.1);const before=s.enemies.filter(e=>!e.dead).length;
 const capture=async(row,name)=>{const png=ui.surface.toBuffer('image/png');fs.writeFileSync(new URL(`chapter${chapter}-${name}.png`,out),png);const snapshot=await loadImage(png);ctx.drawImage(snapshot,0,190,390,390,(chapter-1)*390,row*430+40,390,390);ctx.fillStyle='#0d1319';ctx.fillRect((chapter-1)*390,row*430,390,40);ctx.fillStyle='#e7d8be';ctx.font='16px "Hunter UI"';ctx.fillText(`${chapter} · Lv.20 · ${name}`,12+(chapter-1)*390,26+row*430);};
 await capture(0,'swarm');if(!g.useSkill(s,'bloodmoon',{x:1,y:0}))throw Error('Ultimate did not cast');ui.run(1.12);await capture(1,'sweep');
 report.push({chapter,before,kills:s.run.kills,alive:s.enemies.filter(e=>!e.dead).length,queued:s.spawns.length,area:g.skillAreaScale(s.profile,'bloodmoon'),cooldown:s.skillRuntime.cooldowns.bloodmoon});
}
fs.writeFileSync(new URL('app-contact-sheet.png',out),board.toBuffer('image/png'));fs.writeFileSync(new URL('app-scenes.json',out),JSON.stringify(report,null,2));console.log(out.pathname);
