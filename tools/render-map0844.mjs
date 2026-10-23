// Offline asset / native-font composition and dimension budget. Not a browser/CSS renderer.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as game from '../dist/game-engine.js';
const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('art/stage0844/',root),testUrl=new URL('tests/game-ui.test.mjs',root),src=fs.readFileSync(testUrl,'utf8'),a=src.indexOf('async function host('),b=src.indexOf('\ntest(',a);
GlobalFonts.registerFromPath(new URL('dist/assets/fonts/IBMPlexSansKR-Regular.woff2',root).pathname,'Hunter UI');
GlobalFonts.registerFromPath(new URL('dist/assets/fonts/IBMPlexSansKR-SemiBold.woff2',root).pathname,'Hunter UI');
let code=src.slice(0,src.indexOf("test('"))+src.match(/^const attrs=.*$/m)[0]+'\nexport '+src.slice(a,b);
code=code.replace("new URL('../dist/',import.meta.url)",`new URL(${JSON.stringify(new URL('dist/',root).href)})`).replace(/from '([^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,testUrl).href));
const {host}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const html=fs.readFileSync(new URL('dist/index.html',root),'utf8');
const chapterLabels=[1,2,3].map(n=>html.match(new RegExp('<button id="stage-'+n+'">([^<]+)</button>'))[1]);
const atlas=await loadImage(new URL('dist/assets/ui-stage-v0844/seals.webp',root).pathname);
const secondary=await loadImage(new URL('dist/assets/button-secondary-v043.webp',root).pathname),primary=await loadImage(new URL('dist/assets/button-primary-v043.webp',root).pathname);
const registration=[[1.681,1.176],[49.913,1.441],[98.225,1.123],[1.590,93.838],[49.846,93.984],[98.331,93.660]];
function layout(width,height,top=0,bottom=0){
 const compact=height<=740,tight=height<=620,short=height<=560,landscape=height<=420&&width>=440;
 const head=(tight?44:66)+top,nav=landscape?0:(tight?54:66)+bottom,footer=landscape?54:compact?58:70;
 const padY=short?3:compact?6:10,padX=compact?14:16,gap=tight?4:compact?6:8;
 const overviewY=head+padY,overviewH=height-head-nav-footer-2*padY;
 const boardY=overviewY+(landscape?44+4:44+(compact?44:52)+2*gap),boardH=overviewY+overviewH-boardY;
 const heading=short?22:compact?24:26,bar=short?2:3,boardGap=compact?4:6,boardPad=short?0:compact?4:8;
 const preview=short?0:tight?44:compact?54:76,row=short?54:tight?60:compact?70:84,seal=short?40:tight?44:compact?52:64;
 const gridY=boardY+boardPad+heading+bar+2*boardGap,gridH=boardH-boardPad-heading-bar-(short?2:3)*boardGap-preview;
 const availableW=width-2-2*padX,targetW=(availableW-16)/5;
 return{width,height,top,bottom,compact,tight,short,landscape,head,nav,footer,padX,padY,gap,overviewY,overviewH,boardY,boardH,heading,bar,boardGap,boardPad,preview,row,seal,gridY,gridH,targetW,availableW,gridSlack:gridH-(2*row+4),footerY:height-nav-footer};
}
const budgets=[];
for(const w of [320,360,390,430,480])for(const h of [480,520,521,560,561,568,620,621,640,740,741,780,915])for(const top of [0,44])for(const bottom of [0,34])budgets.push(layout(w,h,top,bottom));
for(const h of [360,390,420])for(const top of [0,44])for(const bottom of [0,34])budgets.push(layout(480,h,top,bottom));
for(const l of budgets){assert(l.gridSlack>=0,JSON.stringify(l));assert(l.targetW>=44);assert(l.row>=44);}
const samples=[layout(320,480,44,34),layout(390,780),layout(480,360,44,34)];
const canvas=createCanvas(1254,840),ctx=canvas.getContext('2d'),measurements=[];ctx.fillStyle='#03080b';ctx.fillRect(0,0,1254,840);
function text(value,x,y,size=12,color='#e8ddc5',align='left',weight=400){ctx.font=weight+' '+size+'px "Hunter UI"';ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);return ctx.measureText(value).width;}
function button(label,x,y,w,h,selected=false,size=12){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();const art=selected?primary:secondary,scale=selected?1.6:1.38,eh=h*scale;ctx.drawImage(art,x,y+(h-eh)*.43,w,eh);ctx.restore();text(label,x+w/2,y+h/2,size,selected?'#fff0cc':'#c8c5b9','center',600);}
let offset=16;
for(const [i,l]of samples.entries()){
 const p=game.createProfile(1_000_000);if(i!==0){p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[1,1,1];p.difficultyProgress=[[9,9,9],[9,9,9]];}
 const ui=await host({saved:p,campaign:true});ui.emit('nav-hunt','click');if(i!==0){ui.emit('stage-3','click');ui.emit('run-stage-10','click');}const saved=JSON.stringify(ui.profile());
 const x=offset,y=44,w=l.width,h=l.height,px=x+1+l.padX,pw=l.availableW;
 ctx.fillStyle='#0c151b';ctx.fillRect(x,y,w,h);text(w+'×'+h+' · safe '+l.top+'/'+l.bottom,x,y-14,11,'#b5b9ad');
 text('‹',x+24,y+l.top+(l.head-l.top)/2,21);text('사냥터',x+54,y+l.top+(l.head-l.top)/2,l.tight?18:21,'#f3e9d8','left',600);
 const chapterW=l.landscape?(pw-8)/2:pw,diffX=l.landscape?px+chapterW+8:px,diffW=l.landscape?chapterW:pw,diffY=y+l.overviewY+(l.landscape?0:44+l.gap),diffH=l.compact?44:52;
 for(let n=1;n<=3;n++){const bx=px+(n-1)*(chapterW+6)/3,bw=(chapterW-12)/3;button(chapterLabels[n-1],bx,y+l.overviewY,bw,44,n===(i?3:1),l.landscape?9:11);}
 for(let n=0;n<3;n++){const bw=(diffW-12)/3,bx=diffX+n*(bw+6),cy=diffY+diffH/2;button('',bx,diffY,bw,diffH,n===0);text(game.HUNT_MODES[n].name,bx+bw/2,cy-(l.landscape?0:6),l.compact?12:13,'#e9ddc4','center',600);if(!l.landscape)text(ui.nodes.get('map-mode-status-'+n).textContent,bx+bw/2,cy+9,9,'#c0b9aa','center');}
 const hy=y+l.boardY+l.boardPad+l.heading/2;text('스테이지 선택',px,hy,16,'#eee0c2','left',600);text(ui.nodes.get('stage-board-count').textContent,px+pw,hy,12,'#d2bf96','right',600);
 const progress=Number(ui.nodes.get('stage-board-progress').attributes['aria-valuenow']),barY=y+l.boardY+l.boardPad+l.heading+l.boardGap;ctx.fillStyle='#b8aa8620';ctx.fillRect(px,barY,pw,l.bar);ctx.fillStyle='#d4b275';ctx.fillRect(px,barY,pw*progress/10,l.bar);
 const gy=y+l.gridY+l.gridSlack/2;
 for(let n=1;n<=10;n++){
  const node=ui.nodes.get('run-stage-'+n),state=node.attributes['data-state'],selected=node.attributes['aria-pressed']==='true',frame=n===10?(state==='locked'?4:5):selected?3:state==='locked'?0:state==='cleared'?2:1;
  const col=(n-1)%5,row=Math.floor((n-1)/5),edge=Math.min(l.targetW,l.seal),bx=px+col*(l.targetW+4),tx=bx+l.targetW/2,by=gy+row*(l.row+4)+(l.row-l.seal-(l.short?14:16))/2;
  ctx.save();ctx.beginPath();ctx.rect(tx-edge/2,by+(l.seal-edge)/2,edge,edge);ctx.clip();const [fx,fy]=registration[frame];ctx.drawImage(atlas,tx-edge/2-2*edge*fx/100,by+(l.seal-edge)/2-edge*fy/100,edge*3,edge*2);ctx.restore();
  const number=ui.nodes.get('run-stage-number-'+n).textContent,numberWidth=text(number,tx,by+l.seal/2,l.tight?18:21,state==='locked'?'#9ba19b':'#fff2da','center',600);text(ui.nodes.get('run-stage-state-'+n).textContent,tx,by+l.seal+(l.short?7:8),10,selected?'#f1b09d':state==='cleared'?'#d8bf8e':'#b2b4a5','center');measurements.push({width:w,height:h,stage:n,numberWidth,targetWidth:l.targetW,frame});
 }
 if(l.preview){const py=y+l.boardY+l.boardH-l.preview;ctx.strokeStyle='#bba37d30';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+pw,py);ctx.stroke();const copyX=px+(l.tight?42:l.compact?52:60);text(ui.nodes.get('stage-preview-kind').textContent,copyX,py+(l.preview===76?16:12),10,'#bbaa86');text(ui.nodes.get('stage-preview-title').textContent,copyX,py+(l.preview===76?36:30),l.tight?12:14,'#f2e2c0','left',600);if(!l.compact)text(ui.nodes.get('stage-preview-description').textContent.slice(0,25)+'…',copyX,py+57,11,'#b7bbb0');}
 const footerY=y+l.footerY,buttonH=l.compact?44:48,fy=footerY+(l.footer-buttonH)/2;ctx.fillStyle='#0a1218';ctx.fillRect(x,footerY,w,l.footer);const leftW=(pw-8)/2.6;button('보상 · 정비',px,fy,leftW,buttonH,false,12);button('전투 준비',px+leftW+8,fy,pw-leftW-8,buttonH,true,14);
 if(l.nav){ctx.fillStyle='#080e13';ctx.fillRect(x,y+h-l.nav,w,l.nav);['거점','사냥터','장비','제작','더보기'].forEach((label,n)=>text(label,x+(n+.5)*w/5,y+h-l.nav+(l.nav-l.bottom)/2,11,n===1?'#f4dcb8':'#a0a5a7','center'));}
 assert.equal(JSON.stringify(ui.profile()),saved);offset+=w+16;
}
text('OFFLINE ART / FONT REFERENCE · modeled dimensions; not browser layout or touch verification',16,822,12,'#b6b7aa');
fs.writeFileSync(new URL('offline-map-check.png',out),canvas.toBuffer('image/png'));
fs.writeFileSync(new URL('offline-map-check.json',out),JSON.stringify({scope:'Hand-derived dimension budget from map-fit.css plus native font / generated asset composition using real app values. Not a CSS renderer, browser screenshot or device hit test.',budgetCases:budgets.length,minimumGridSlack:Math.min(...budgets.map(l=>l.gridSlack)),minimumTargetWidth:Math.min(...budgets.map(l=>l.targetW)),registration,measurements,budgets},null,2)+'\n');
console.log(JSON.stringify({budgetCases:budgets.length,minGridSlack:Math.min(...budgets.map(l=>l.gridSlack)),minTargetWidth:Math.min(...budgets.map(l=>l.targetW)),composedCells:measurements.length}));
