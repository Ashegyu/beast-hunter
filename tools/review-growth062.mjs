// Deterministic engine comparison and offline text review, never browser QA.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import * as game from '../dist/game-engine.js';
const root=new URL('../',import.meta.url),out=new URL('../art/quality062/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const baselineSha='84198d55cb871a08c80a0b8b703495b1149085c5';
const baseSource=execFileSync('git',['show',baselineSha+':dist/game-engine.js'],{cwd:root,encoding:'utf8'}).replace(/(['"])(\.\/[^'"]+)\1/g,(_,quote,path)=>quote+new URL('../dist/'+path.slice(2),import.meta.url).href+quote);
const baseline=await import('data:text/javascript;base64,'+Buffer.from(baseSource).toString('base64'));
function simulate(g){
 const s=g.createGame(g.createProfile(1000)),rows=[];s.auto=true;
 for(let chapter=1;chapter<=3;chapter++){
  assert.ok(g.launch(s,chapter));let frames=0;while(s.phase==='playing'&&frames++<20000)g.advanceGame(s,.05);assert.equal(s.phase,'victory');
  rows.push({chapter,level:s.profile.level,xp:s.run.xp,gold:s.run.gold,cores:s.run.cores,items:s.run.items,kills:s.run.kills,time:s.run.time});
  g.returnToCamp(s);const weapon=s.profile.inventory.find(i=>i.slot==='weapon');if(weapon)g.equipItem(s,weapon.id);for(const id of g.upgradeOptions(s))g.chooseUpgrade(s,id);for(const id of Object.keys(g.FORGE))g.upgradeForge(s,id);
 }
 return {rows,profile:JSON.parse(g.encodeProfile(s.profile,1000))};
}
const before=simulate(baseline),after=simulate(game);assert.deepEqual(after,before);
fs.writeFileSync(new URL('progression-simulation.json',out),JSON.stringify({scope:'One deterministic auto-hunt path; same engine dependencies except baseline game-engine.js. Not a balance distribution or device performance test.',baselineSha,savedProfileAndMeasuredTotalsEqual:true,rows:after.rows,firstUltimateLevel:20},null,2)+'\n');
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json'),{createCanvas,GlobalFonts}=req('@napi-rs/canvas');
for(const face of ['Regular','SemiBold'])GlobalFonts.registerFromPath(new URL('../dist/assets/fonts/IBMPlexSansKR-'+face+'.woff2',import.meta.url).pathname,'Hunter UI');
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),start=source.indexOf('function refreshGrowthProgress()'),end=source.indexOf("$('result-skills').addEventListener",start),fn=source.slice(start,end);
const cv=createCanvas(760,650),c=cv.getContext('2d');c.fillStyle='#0c151b';c.fillRect(0,0,760,650);c.font='16px "Hunter UI"';c.fillStyle='#e2c99a';c.fillText('성장 안내 · 실제 글꼴 오프라인 조판',20,30);
let maxLine=0;
function wrap(text,width,font){c.font=font;const lines=[];let line='';for(const char of text){if(line&&c.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}if(line)lines.push(line);for(const s of lines){const w=c.measureText(s).width;assert.ok(w<=width+.1);maxLine=Math.max(maxLine,w);}return lines;}
for(const [i,[from,to]]of [[19,20],[49,50],[1,50]].entries())for(const [j,width]of [288,358].entries()){
 const profile=game.createProfile();profile.level=to;profile.skillBook=game.restoreSkillBook(null,to);const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',setAttribute(){}});return nodes.get(id);};
 vm.runInNewContext(fn+'refreshGrowthProgress();',{game,profile,state:{phase:'victory',resultDelay:0,run:{startLevel:from}},campDrawer:'',growthRenderKey:'',$});
 const x=j?382:20,y=65+i*180;c.fillStyle='#142124';c.fillRect(x,y,width,156);let ty=y+24;
 for(const [id,font,color]of [['result-level','600 17px "Hunter UI"','#ecd9af'],['result-points','12px "Hunter UI"','#b9c8b4'],['result-unlocks','12px "Hunter UI"','#dfc598'],['skill-next-unlock','12px "Hunter UI"','#b8c0b6']]){
  c.fillStyle=color;c.font=font;for(const line of wrap($(id).textContent,width-28,font)){c.fillText(line,x+14,ty);ty+=19;}ty+=5;
 }
 assert.ok(ty<=y+156,'offline text card exceeded its review height');
}
c.font='11px "Hunter UI"';c.fillStyle='#96a9a8';c.fillText('본문: 프로덕션 앱의 성장 안내 함수 · 글꼴 조판이며 브라우저/CSS 화면 검수는 아님',20,635);
fs.writeFileSync(new URL('growth-text-review.png',out),cv.toBuffer('image/png'));
console.log(JSON.stringify({savedProfileAndMeasuredTotalsEqual:true,chapters:after.rows,offlineTextMaxLinePx:maxLine}));
