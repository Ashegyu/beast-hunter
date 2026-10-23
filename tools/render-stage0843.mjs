// Offline asset/font composition from live app values, not browser or CSS layout QA.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as game from '../dist/game-engine.js';
const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json'),{createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('art/stage0843/',root),testUrl=new URL('tests/game-ui.test.mjs',root),src=fs.readFileSync(testUrl,'utf8'),a=src.indexOf('async function host('),b=src.indexOf('\ntest(',a);
GlobalFonts.registerFromPath(new URL('dist/assets/fonts/IBMPlexSansKR-Regular.woff2',root).pathname,'Hunter UI');GlobalFonts.registerFromPath(new URL('dist/assets/fonts/GowunBatang-Bold.woff2',root).pathname,'Hunter Title');
let code=src.slice(0,src.indexOf("test('"))+src.match(/^const attrs=.*$/m)[0]+'\nexport '+src.slice(a,b);
code=code.replace("new URL('../dist/',import.meta.url)",`new URL(${JSON.stringify(new URL('dist/',root).href)})`).replace(/from '([^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,testUrl).href));
const {host}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const atlas=await loadImage(new URL('dist/assets/ui-stage-v0843/seals.webp',root).pathname);assert.equal(atlas.width,1536);assert.equal(atlas.height,1024);
const widths=[320,390,480],canvas=createCanvas(1238,420),ctx=canvas.getContext('2d'),report=[];ctx.fillStyle='#080e12';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#b6b7aa';ctx.font='12px "Hunter UI"';ctx.fillText('Offline stage asset / font check · not a browser screenshot',16,22);
let offset=0;
for(const [sample,width]of widths.entries()){
 const p=game.createProfile(1_000_000);if(sample===1)p.stageProgress=[4,0,0];if(sample===2){p.clearedStage=1;p.stageProgress=[10,0,0];p.bossMastery=[1,-1,-1];p.difficultyProgress=[[9,0,0],[0,0,0]];}
 const ui=await host({saved:p});ui.emit('nav-hunt','click');if(sample===1)ui.emit('run-stage-3','click');if(sample===2){ui.emit('map-mode-1','click');ui.emit('run-stage-10','click');}
 const before=JSON.stringify(ui.profile()),x=offset+16,w=width-32,gap=4,edge=Math.min(72,(w-gap*4)/5),font=width<=360?16:19;
 assert((w-gap*4)/5>=44,'minimum target width');ctx.fillStyle='#10191c';ctx.fillRect(offset,35,width,375);ctx.fillStyle='#a3957a';ctx.font='8px "Hunter UI"';ctx.fillText('CHAPTER ROUTE',x,58);ctx.fillStyle='#eee0c2';ctx.font='18px "Hunter Title"';ctx.fillText('스테이지 선택',x,84);ctx.font='12px "Hunter UI"';ctx.textAlign='right';ctx.fillText(ui.nodes.get('stage-board-count').textContent,x+w,84);ctx.textAlign='left';
 const progress=Number(ui.nodes.get('stage-board-progress').attributes['aria-valuenow']);ctx.fillStyle='#b8aa8620';ctx.fillRect(x,96,w,3);ctx.fillStyle='#d4b275';ctx.fillRect(x,96,w*progress/10,3);
 for(let n=1;n<=10;n++){
  const node=ui.nodes.get('run-stage-'+n),selected=node.attributes['aria-pressed']==='true',state=node.attributes['data-state'],boss=n===10;
  const frame=boss?(state==='locked'?4:5):selected?3:state==='locked'?0:state==='cleared'?2:1;
  const col=(n-1)%5,row=Math.floor((n-1)/5),track=(w-gap*4)/5,px=x+col*(track+gap)+(track-edge)/2,py=113+row*(Math.max(72,edge+21)+10);
  ctx.drawImage(atlas,frame%3*512,Math.floor(frame/3)*512,512,512,px,py,edge,edge);ctx.fillStyle=state==='locked'?'#9ba19b':'#f5ead3';ctx.font=font+'px "Hunter UI"';ctx.textAlign='center';ctx.fillText(ui.nodes.get('run-stage-number-'+n).textContent,px+edge/2,py+edge/2+font*.34);ctx.fillStyle=selected?'#f1b09d':state==='cleared'?'#d8bf8e':'#b2b4a5';ctx.font='10px "Hunter UI"';ctx.fillText(ui.nodes.get('run-stage-state-'+n).textContent,px+edge/2,py+edge+15);ctx.textAlign='left';
  report.push({width,stage:n,frame,targetWidth:track,targetMinHeight:72,number:ui.nodes.get('run-stage-number-'+n).textContent,state,selected});
 }
 ctx.fillStyle='#bbaa86';ctx.font='10px "Hunter UI"';ctx.fillText(ui.nodes.get('stage-preview-kind').textContent,x,331);ctx.fillStyle='#f2e2c0';ctx.font='15px "Hunter Title"';ctx.fillText(ui.nodes.get('stage-preview-title').textContent,x,357,w);ctx.fillStyle='#b7bbb0';ctx.font='11px "Hunter UI"';ctx.fillText(width+'px · live app values',x,389);assert.equal(JSON.stringify(ui.profile()),before);offset+=width+24;
}
fs.writeFileSync(new URL('offline-stage-check.png',out),canvas.toBuffer('image/png'));fs.writeFileSync(new URL('offline-stage-check.json',out),JSON.stringify({scope:'Offline generated-atlas crop and native-font composition using actual app values. Not browser CSS layout, hit testing or device QA.',cases:report.length,report},null,2)+'\n');console.log(JSON.stringify({cases:report.length,minimumTargetWidth:Math.min(...report.map(r=>r.targetWidth)),atlas:[atlas.width,atlas.height]}));
