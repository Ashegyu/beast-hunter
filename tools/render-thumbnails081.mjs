// Offline image/clip QA using the real app's DOM host. This is not a browser screenshot.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import * as game from '../dist/game-engine.js';
const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('art/ui081/',root);fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath(new URL('dist/assets/fonts/IBMPlexSansKR-Regular.woff2',root).pathname,'Hunter UI');
const testsUrl=new URL('tests/game-ui.test.mjs',root),testSource=fs.readFileSync(testsUrl,'utf8');
const start=testSource.indexOf('async function host('),end=testSource.indexOf('\ntest(',start);
let hostSource=testSource.slice(0,testSource.indexOf("test('"))+testSource.match(/^const attrs=.*$/m)[0]+'\nexport '+testSource.slice(start,end);
hostSource=hostSource.replace("new URL('../dist/',import.meta.url)",`new URL(${JSON.stringify(new URL('dist/',root).href)})`);
hostSource=hostSource.replace(/from '([^']+)'/g,(_,path)=>'from '+JSON.stringify(new URL(path,testsUrl).href));
const {host}=await import('data:text/javascript;base64,'+Buffer.from(hostSource).toString('base64'));
const p=game.createProfile(1_000_000),rows=['weapon','armor','charm'].flatMap(slot=>[game.ITEM_CATALOG.find(r=>r.slot===slot),game.ANCIENT_CATALOG.find(r=>r.slot===slot),game.CRAFTED_CATALOG.find(r=>r.slot===slot)]);
p.inventory=rows.map((r,n)=>({...r,id:n+1,catalogId:r.id,rarity:n%3===1?5:n%3===2?6:3,affixes:{...r.base}}));
const ui=await host({saved:p});ui.emit('nav-equipment','click');const before=JSON.stringify(ui.profile());
const manifest=JSON.parse(fs.readFileSync(new URL('dist/assets/manifest.json',root))),decoded=new Map(),images=new Map();
for(let i=0;i<rows.length;i++){
 const node=ui.nodes.get('bag-art-'+i),source=node.atlasImage.src;
 if(!decoded.has(source))decoded.set(source,await loadImage(new URL('dist/'+source,root).pathname));
 const image=decoded.get(source);images.set(node.atlasLayout.imageName,{naturalWidth:image.width,naturalHeight:image.height});
}
const old=execFileSync('git',['show','c996ff444c289ae275c5bef333b5d9a58c31e9af:dist/app.js'],{encoding:'utf8'});
const oldFunction=old.slice(old.indexOf('function atlasThumbnail('),old.indexOf('function gearThumbnail('));
const applyOld=vm.runInNewContext('('+oldFunction+')',{images,manifest});
const percent=value=>parseFloat(value)/100;
function drawThumbnail(node,edge,mode){
 const c=createCanvas(edge,edge),ctx=c.getContext('2d'),image=decoded.get(node.atlasImage.src),{frame,size}=node.atlasLayout;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(mode==='reference'){
  const scale=edge*(size-8)/size/Math.max(frame.w,frame.h);ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,(edge-frame.w*scale)/2,(edge-frame.h*scale)/2,frame.w*scale,frame.h*scale);
 }else if(mode==='after'){
  const art=node.atlasImage,insets=node.style.clipPath.match(/[\d.e+-]+%/g).map(percent),top=insets[0]*edge,left=insets[1]*edge;
  ctx.beginPath();ctx.rect(left,top,edge-2*left,edge-2*top);ctx.clip();ctx.drawImage(image,percent(art.style.left)*edge,percent(art.style.top)*edge,percent(art.style.width)*edge,percent(art.style.height)*edge);
 }else{
  const legacy={style:{}};applyOld(legacy,node.atlasLayout.imageName,frame,size);const inset=legacy.style.clipPath.match(/[\d.e+-]+px/g).map(parseFloat),top=inset[0],left=inset[1],position=legacy.style.backgroundPosition.split(' ').map(parseFloat),dimensions=legacy.style.backgroundSize.split(' ').map(parseFloat);
  if(edge-2*left>0&&edge-2*top>0){ctx.beginPath();ctx.rect(left,top,edge-2*left,edge-2*top);ctx.clip();ctx.drawImage(image,...position,...dimensions);}
 }
 return c;
}
const alpha=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let sum=0;for(let i=3;i<d.length;i+=4)sum+=d[i];return sum;};
const report=[];
for(let i=0;i<rows.length;i++)for(const edge of [32,44,56,80]){
 const node=ui.nodes.get('bag-art-'+i),a=drawThumbnail(node,edge,'after'),r=drawThumbnail(node,edge,'reference'),b=drawThumbnail(node,edge,'before'),referenceAlpha=alpha(r),afterRatio=alpha(a)/referenceAlpha,beforeRatio=alpha(b)/referenceAlpha;
 assert.ok(Math.abs(afterRatio-1)<.025,`${i} at ${edge}px lost frame content: ${afterRatio}`);
 report.push({catalogId:rows[i].id,slot:rows[i].slot,edge,beforeAlphaRatio:beforeRatio,afterAlphaRatio:afterRatio});
}
const board=createCanvas(840,1096),ctx=board.getContext('2d');ctx.fillStyle='#0b1419';ctx.fillRect(0,0,840,1096);ctx.fillStyle='#e1cfaa';ctx.font='16px "Hunter UI"';ctx.fillText('고정 픽셀 좌표 · 이전',24,30);ctx.fillText('비율 좌표 · 수정',304,30);ctx.fillText('전체 프레임 기준',584,30);
for(let i=0;i<rows.length;i++){
 const node=ui.nodes.get('bag-art-'+i),y=55+i*112;
 for(const [j,mode]of ['before','after','reference'].entries()){
  const c=drawThumbnail(node,44,mode),x=24+j*280;ctx.fillStyle='#172329';ctx.fillRect(x,y,88,88);ctx.drawImage(c,x,y,88,88);ctx.fillStyle='#c2c6b8';ctx.font='12px "Hunter UI"';ctx.fillText(rows[i].name,x+100,y+34,154);ctx.fillText('44px · 2배 표시',x+100,y+55);
 }
}
assert.equal(JSON.stringify(ui.profile()),before);
fs.writeFileSync(new URL('thumbnail-comparison.png',out),board.toBuffer('image/png'));
fs.writeFileSync(new URL('render-results.json',out),JSON.stringify({scope:'Offline native Canvas render of actual app thumbnail placement and clip styles at specified square sizes. Not browser/CSS layout or device QA.',cases:report.length,stateUnchanged:true,report},null,2)+'\n');
console.log(JSON.stringify({cases:report.length,minAfterAlphaRatio:Math.min(...report.map(r=>r.afterAlphaRatio)),maxAfterAlphaRatio:Math.max(...report.map(r=>r.afterAlphaRatio)),output:out.pathname}));
