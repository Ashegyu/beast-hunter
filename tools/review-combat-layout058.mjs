// Offline geometry, font and asset review. No browser/CSS layout assertion.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {SKILL_CATALOG} from '../dist/combat-skills.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=req('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('../art/layout058/',import.meta.url),m=JSON.parse(fs.readFileSync(new URL('dist/assets/manifest.json',root)));
for(const name of ['Regular','SemiBold'])GlobalFonts.registerFromPath(new URL('dist/assets/fonts/IBMPlexSansKR-'+name+'.woff2',root).pathname,'Hunter UI');
const images=new Map();async function img(name){if(!images.has(name))images.set(name,await loadImage(new URL('dist/assets/'+(m.delivery?.[name]??name),root).pathname));return images.get(name);}
function layout(w,h,safe=0){const compact=h<=620,b=Math.max(compact?24:32,safe+(compact?20:24)),sw=compact?64:76,sr=compact?94:112,sh=compact?82:100,uw=compact?70:82,uh=compact?90:108;const right=(id,r,bottom,width,height)=>({id,x:w-r-width,y:h-b-bottom-height,w:width,h:height});return [
 {id:'joystick',x:w<=340?10:14,y:h-b-(compact?84:w<=340?88:100),w:compact?84:w<=340?88:100,h:compact?84:w<=340?88:100},
 right('attack',14,0,compact?68:84,compact?68:84),right('dash',compact?94:112,4,compact?48:56,compact?48:56),right('thunder',compact?22:24,compact?88:108,compact?48:56,compact?48:56),
 right('skill0',sr,compact?72:90,sw,sh),right('skill1',sr,compact?164:198,sw,sh),right('ultimate',12,compact?164:192,uw,uh),
 {id:'auto',x:14,y:h-b-(compact?100:116)-48,w:48,h:48}];}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const cases=[];for(const w of [320,360,390,430,480])for(const h of [568,640,780,844,900])for(const safe of [0,34]){const boxes=layout(w,h,safe);for(const a of boxes){if(a.w<44||a.h<44||a.x<0||a.y<0||a.x+a.w>w||a.y+a.h>h-safe)throw Error('Outside safe input region: '+a.id);for(const b of boxes)if(a!==b&&overlap(a,b))throw Error('Overlapping inputs: '+a.id+' '+b.id);}cases.push({w,h,safe,boxes});}
for(const w of [480,640])for(const h of [320,360,390])for(const safe of [0,34]){const boxes=layout(w,h,safe);for(const a of boxes){if(a.x<0||a.y<0||a.y+a.h>h-safe)throw Error('Landscape bounds');for(const b of boxes)if(a!==b&&overlap(a,b))throw Error('Landscape overlap');}cases.push({w,h,safe,boxes});}
const measure=createCanvas(1,1).getContext('2d');let nameCases=0;
for(const compact of [false,true])for(const d of SKILL_CATALOG.filter(d=>d.kind!=='passive')){const width=(d.kind==='ultimate'?(compact?70:82):(compact?64:76))-(compact?10:12);measure.font='600 '+(compact?10:11)+'px "Hunter UI"';let lines=1,line='';for(const ch of d.name){if(line&&measure.measureText(line+ch).width>width){lines++;line='';}line+=ch;}if(lines>2)throw Error('Skill name exceeds two rows: '+d.id);nameCases++;}
const cv=createCanvas(970,930),c=cv.getContext('2d');c.fillStyle='#081116';c.fillRect(0,0,970,930);
const views=[[320,568,0],[390,844,34],[480,900,0]],labels={attack:'연격',dash:'회피',thunder:'파쇄',skill0:'월아참',skill1:'낙월',ultimate:'적월난무',auto:'자동'};
const iconFiles={joystick:'combat-joystick-v046.webp',attack:'combat-attack-v046.webp',dash:'combat-dash-v046.webp',thunder:'combat-thunder-v046.webp',skill0:'skills/crescent.webp',skill1:'skills/plunge.webp',ultimate:'skills/bloodmoon.webp',auto:'combat-utility-v046.webp'};
for(const [i,[w,h,safe]]of views.entries()){
 const scale=Math.min(300/w,850/h),ox=15+i*320,oy=48;c.save();c.translate(ox,oy);c.scale(scale,scale);c.fillStyle='#142025';c.fillRect(0,0,w,h);c.globalAlpha=.55;c.drawImage(await img(m.chapters[1].environment),0,0,w,h);c.globalAlpha=1;
 c.fillStyle='#12191ce8';c.fillRect(12,10,w-24,57);c.font='600 12px "Hunter UI"';c.fillStyle='#f1e5d3';c.fillText('리리안  Lv. 50',26,32);c.fillStyle='#aa4c63';c.fillRect(26,43,132,6);c.font='400 11px "Hunter UI"';c.fillStyle='#dfc8a4';c.fillText('Ⅱ',w-41,37);{const f=await img('combat-mission-v046.webp'),sx=[0,45,f.width-45,f.width],sy=[0,48,f.height-48,f.height],dx=[12,32,w-32,w-12],dy=[74,90,150,166];for(let a=0;a<3;a++)for(let b=0;b<3;b++)c.drawImage(f,sx[a],sy[b],sx[a+1]-sx[a],sy[b+1]-sy[b],dx[a],dy[b],dx[a+1]-dx[a],dy[b+1]-dy[b]);}c.font='600 13px "Hunter UI"';c.fillStyle='#f1e5d3';c.fillText('1-3  갑각 돌파 · 정예',38,111);c.font='400 12px "Hunter UI"';c.fillText('처치 8/12 · 웨이브 2/3',38,138);
 const clip=m.clips[m.directions.hunter.idle.s],f=clip.frames[0],sc=126/f.bodyHeight;c.drawImage(await img(clip.image),f.x,f.y,f.w,f.h,w*.5-f.pivotX*sc,h*.47-f.pivotY*sc,f.w*sc,f.h*sc);
 for(const a of layout(w,h,safe)){
  if(['skill0','skill1','ultimate'].includes(a.id)){
   c.fillStyle=a.id==='ultimate'?'#432331ed':'#15252eec';c.fillRect(a.x,a.y,a.w,a.h);c.strokeStyle=a.id==='ultimate'?'#c99c66':'#bda97b';c.lineWidth=a.id==='ultimate'?2:1;c.strokeRect(a.x+.5,a.y+.5,a.w-1,a.h-1);const size=(h<=620?28:36)+(a.id==='ultimate'?6:0);c.drawImage(await img(iconFiles[a.id]),a.x+(a.w-size)/2,a.y+5,size,size);c.font='600 '+(h<=620?10:11)+'px "Hunter UI"';c.textAlign='center';c.fillStyle='#f1e4cd';c.fillText(labels[a.id],a.x+a.w/2,a.y+a.h-29,a.w-10);c.font='400 11px "Hunter UI"';c.fillStyle='#dcc594';c.fillText(a.id==='ultimate'?'60초':'준비',a.x+a.w/2,a.y+a.h-8);c.textAlign='left';
  }else{
   c.drawImage(await img(iconFiles[a.id]),a.x,a.y,a.w,a.h);if(a.id!=='joystick'){c.textAlign='center';c.font='600 11px "Hunter UI"';c.fillStyle='#ffedcd';c.fillText(labels[a.id],a.x+a.w/2,a.y+a.h*.76);c.textAlign='left';}
  }
 }
 c.restore();c.fillStyle='#e6cfa0';c.font='600 14px "Hunter UI"';c.fillText(w+' × '+h+(safe?' · 하단 여백 '+safe:' · 작은 화면'),ox,29);
}
c.fillStyle='#b5c0b8';c.font='400 12px "Hunter UI"';c.fillText('오프라인 배치 검토 · 실제 브라우저/CSS 화면 검증은 아님',18,914);
fs.writeFileSync(new URL('combat-layout-review.png',out),cv.toBuffer('image/png'));
fs.writeFileSync(new URL('geometry.json',out),JSON.stringify({scope:'Specified rectangle geometry, not computed browser styles.',cases:cases.length,nameCases,results:cases},null,2)+'\n');
console.log(JSON.stringify({cases:cases.length,nameCases,overlapCount:0}));
