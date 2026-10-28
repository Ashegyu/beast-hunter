// Bitmap-only combat presentation. No simulation writes, image allocation or clocks.
const IDS=['crescent','gale','dance','draw','plunge','parry','echo','triple','seeking','returning','field','breach','gather','stance','mark','bloodblade'];
const cells=Object.fromEntries(IDS.map((id,i)=>[id,Object.freeze({column:i%4,row:Math.floor(i/4),mirrorX:id==='crescent'?-1:1})]));
for(const [id,base,secondary] of [['bloodmoon','dance','crescent'],['eclipse','draw','gale'],['phantoms','echo','field']])cells[id]=Object.freeze({...cells[base],base,secondary});
export const SKILL_ART_CELLS=Object.freeze(cells);
// Only the combat atlas is required. Retired cutins never block a hunt.
// Alpha 0.137: the atlas also holds SKILL_FRAMES sequential frames per effect (`sequences`); `frames` keeps the peak frame
// for still uses (cut-ins, buffs). Older atlases without sequences still draw their single frame.
export const SKILL_FRAMES=6,SKILL_PEAK_FRAME=2;
export function validSkillPresentation(art,images){
 if(!art||!images||!Number.isInteger(art.effects?.columns)||!Number.isInteger(art.effects?.rows)||art.effects.columns<4||art.effects.rows<4)return false;
 const descriptors=[art.effects];
 for(const d of descriptors){if(!d||typeof d.image!=='string'||!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<=0||d.height<=0||d.width*d.height>4194304)return false;const image=images.get(d.image);if(!image||(image.naturalWidth??image.width)!==d.width||(image.naturalHeight??image.height)!==d.height)return false;}
 const a=art.effects,inside=f=>!!f&&[f.x,f.y,f.w,f.h].every(Number.isInteger)&&f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=a.width&&f.y+f.h<=a.height;
 for(const id of IDS){if(!inside(a.frames?.[id]))return false;if(a.sequences&&!(Array.isArray(a.sequences[id])&&a.sequences[id].length===SKILL_FRAMES&&a.sequences[id].every(inside)))return false;}
 return true;
}
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=v=>Math.max(0,Math.min(1,finite(v)));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
function source(options){const atlas=options?.atlas,img=typeof atlas?.image==='object'?atlas.image:options?.image;if(!img)return null;const width=finite(atlas?.width,finite(img.width)),height=finite(atlas?.height,finite(img.height));if(width<=0||height<=0||img.complete===false)return null;return {atlas,img,width,height};}
// The frame of the effect being drawn (0..SKILL_FRAMES-1), set by drawImageSkillEffect for its call; null = peak frame.
let sequenceFrame=null;
const LOOPING=new Set(['field','stance','mark','bloodblade']);
function frameIndex(id,progress){const n=SKILL_FRAMES;return LOOPING.has(id)?Math.floor(clamp(progress)*n*2)%n:Math.min(n-1,Math.floor(clamp(progress)*n));}
function stamp(ctx,src,id,x,y,w,h,angle=0,opacity=1){const cell=SKILL_ART_CELLS[id];if(!cell||w<=0||h<=0)return;const seq=src.atlas?.sequences?.[id]||src.atlas?.sequences?.[cell.base],frame=seq&&sequenceFrame!==null?seq[frameIndex(id,sequenceFrame)]:src.atlas?.frames?.[id]||src.atlas?.frames?.[cell.base];const sw=frame?.w||src.width/4,sh=frame?.h||src.height/4,sx=frame?.x??cell.column*sw,sy=frame?.y??cell.row*sh;ctx.save();try{ctx.translate(x,y);ctx.rotate(angle);if(cell.mirrorX===-1)ctx.scale(-1,1);ctx.globalAlpha*=clamp(opacity);ctx.drawImage(src.img,sx,sy,sw,sh,-w/2,-h/2,w,h);}finally{ctx.restore();}}
// Alpha 0.142 시작 위치(사용자 요청): 검기·찌르기는 발밑이 아니라 검 높이에서, 몸을 감는 기술은 허리 높이에서 나간다.
// 바닥 기술(잔월진·낙월·파갑참·수월의 자세)은 지면 그대로. 값은 화면 픽셀(캐릭터 키 126 기준).
export const SKILL_LIFT=Object.freeze({crescent:46,gale:42,draw:46,triple:46,returning:46,seeking:48,echo:44,eclipse:46,parry:50,mark:64,dance:34,gather:30,bloodmoon:34,phantoms:30,bloodblade:58});
export function drawImageSkillEffect(ctx,f,alpha,options={}){
 if(!ctx||!f||!['skillCast','skillImpact','skillMark'].includes(f.type)||!SKILL_ART_CELLS[f.skillId])return false;const src=source(options);if(!src)return false;
 const a=clamp(alpha),p=1-a,hit=f.type!=='skillCast',r=Math.max(8,Math.min(800,finite(f.radius,100))),area=Math.max(1,Math.min(2.4,finite(f.areaScale,1)));
 const tracked=f.skillId==='seeking'&&Number.isFinite(f.fromX)&&Number.isFinite(f.fromY)&&Number.isFinite(f.targetX)&&Number.isFinite(f.targetY),dx=tracked?f.targetX-f.fromX:0,dy=tracked?f.targetY-f.fromY:0;
 // Tracking art follows its actual flight segment, even if aim and target differ.
 const angle=tracked&&Math.hypot(dx,dy)>.001?Math.atan2(dy,dx):Math.atan2(finite(f.n?.y),finite(f.n?.x,1));
 let x=finite(f.x),y=finite(f.y);if(tracked&&!hit){x=f.fromX+dx*p;y=f.fromY+dy*p;}
 // Animated atlases (0.137) dissipate inside their own frames, so a hit keeps more of its brightness while it plays.
 ctx.save();try{ctx.translate(x,y-(SKILL_LIFT[f.skillId]??0));ctx.rotate(angle);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=hit?(src.atlas?.sequences?Math.min(1,a*1.6):a):.65+.25*Math.sin(p*Math.PI);const q=hit?.7+.3*smooth(p):.35+.25*smooth(p),size=r*2*q;
 sequenceFrame=p;
 switch(f.skillId){
 case 'crescent':stamp(ctx,src,'crescent',hit?r/2:24,0,hit?r:48,(hit?118:38)*area,-.08,1);break;
 case 'gale':stamp(ctx,src,'gale',hit?r*.5:26,0,hit?r*1.05:56,(hit?r*.8:40)*area,0,1);break;
 case 'dance':for(let i=0;i<3;i++)stamp(ctx,src,'dance',0,0,size*(1-i*.15),size*(1-i*.15),p*2+i*2.1,.8-i*.18);break;
 case 'draw':stamp(ctx,src,'draw',hit?r/2:24,0,hit?r:48,hit?r*.85:42,0,1);stamp(ctx,src,'draw',hit?r*.6:24,0,hit?r*.8:48,hit?40:18,0,.55);break;
 case 'plunge':stamp(ctx,src,'plunge',0,hit?0:-45*(1-p),size,hit?size*.65:size,.0,1);break;
 case 'parry':stamp(ctx,src,'parry',hit?0:25,0,size*.7,size*.7,hit?p*.25:0,1);if(hit)stamp(ctx,src,'parry',0,0,size*.5,size*.5,Math.PI/2,.5);break;
 case 'echo':for(let i=0;i<3;i++)stamp(ctx,src,'echo',-i*r*.3,0,size*.6,size*.6,-.15*i,1-i*.3);break;
 case 'triple':{const k=(f.index||0)%3;stamp(ctx,src,'triple',hit?r*.5:26,0,hit?r*(1+k*.1):52,hit?r*(.62+k*.08):34,(k-1)*.14,1);break;}
 case 'seeking':stamp(ctx,src,'seeking',hit?0:-10,0,hit?Math.min(100,size):45,hit?Math.min(100,size):35,hit?p*.6:0,1);break;
 case 'returning':stamp(ctx,src,'returning',hit?r/2:24,0,hit?r:48,(hit?130:36)*area,(f.index||0)%2?Math.PI:0,1);break;
 case 'field':stamp(ctx,src,'field',0,0,r*2,r*1.3,p*.2,hit?.9:.5);stamp(ctx,src,'field',0,0,size*.7,size*.45,-p*.4,.4);break;
 case 'breach':stamp(ctx,src,'breach',0,0,size*.8,size*.8,0,1);if(hit)stamp(ctx,src,'breach',0,0,size*.55,size*.55,.35,.4);break;
 case 'gather':for(let i=0;i<4;i++){const b=i*Math.PI/2,d=r*(hit?.2+p*.1:.7*(1-p));stamp(ctx,src,'gather',Math.cos(b)*d,Math.sin(b)*d,size*.45,size*.45,b+Math.PI,.7);}break;
 case 'stance':stamp(ctx,src,'stance',0,0,size,size*.6,-p*.15,.8);break;
 case 'mark':stamp(ctx,src,'mark',0,0,Math.min(110,size),Math.min(110,size),p*.3,1);break;
 case 'bloodblade':stamp(ctx,src,'bloodblade',0,0,size*.7,size*.9,-.25,1);stamp(ctx,src,'bloodblade',0,0,size*.9,size*1.1,.2,.35);break;
 case 'bloodmoon':{
  // Multi-hit impacts overlap for .3s. Put the bright cuts around the rim so
  // stacked hits do not bleach the hunter's body at the center.
  const turn=options.reducedMotion?0:(f.index??0)*.7+p*.8,d=r*(hit?.52:.24);
  for(let i=0;i<3;i++){const b=turn+i*Math.PI*2/3;stamp(ctx,src,'crescent',Math.cos(b)*d,Math.sin(b)*d,r*(hit?.9:.5),hit?95:40,b+Math.PI/2,.6);}
  stamp(ctx,src,'dance',0,0,size,size,-turn,.12);break;
 }
 case 'eclipse':stamp(ctx,src,'gale',hit?r/2:24,0,hit?r:48,(hit?55:30)*area,0,.65);stamp(ctx,src,'draw',hit?r/2:24,0,hit?r:48,(hit?35:24)*area,0,1);break;
 case 'phantoms':for(let i=0;i<3;i++)stamp(ctx,src,'echo',(i-1)*r*.35,0,size*.65,size*.65,(i-1)*.15,1-Math.abs(i-1)*.4);stamp(ctx,src,'field',0,0,size,size*.6,-p,.35);break;
 }
 }finally{sequenceFrame=null;ctx.restore();}return true;
}
const ULT_NAMES=Object.freeze({bloodmoon:'적월난무',eclipse:'일섬 · 월식',phantoms:'월영군무'});
function portraitSource(options,id){let p=options?.portraits?.[id];if(!p&&options?.images instanceof Map)p=options.images.get(id)||options.images.get(`cutin-${id}`);if(!p)return null;const image=p.image||p,width=finite(p.width,finite(image.width)),height=finite(p.height,finite(image.height));return width>0&&height>0&&image.complete!==false?{image,width,height,kind:p.kind}:null;}
// Complete opaque illustration: one unsliced contain-fit draw, then low foreground accents.
function drawSceneCutin(ctx,portrait,id,elapsed,width,height,options,reducedMotion){
 const progress=elapsed/1.35,fade=Math.min(smooth(progress/.16),smooth((1-progress)/.22)),top=height>=300?70:height*.1,bottom=height>=300?100:height*.15,available=Math.max(1,height-top-bottom),zoom=reducedMotion?1:.96+.04*smooth(progress/.85),fit=Math.min(Math.max(1,width-12)/portrait.width,available/portrait.height)*zoom,w=portrait.width*fit,h=portrait.height*fit,cx=width/2,cy=top+available/2,panX=reducedMotion?0:(progress-.5)*Math.max(0,width-w)*.35,panY=reducedMotion?0:(.5-progress)*Math.max(0,available-h)*.2,src=source(options),turn=reducedMotion?0:progress*Math.PI;
 ctx.save();try{
 if(typeof ctx.rect==='function'&&typeof ctx.clip==='function'){ctx.beginPath();ctx.rect(0,top,width,available);ctx.clip();}
 ctx.globalAlpha=fade;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#100e1b';ctx.fillRect(0,top,width,available);
 ctx.drawImage(portrait.image,0,0,portrait.width,portrait.height,cx-w/2+panX,cy-h/2+panY,w,h);
 if(src){ctx.globalCompositeOperation='lighter';const low=top+available*.75;
 if(id==='bloodmoon'){for(let i=0;i<3;i++){const phase=reducedMotion?.5:clamp(progress*1.3-i*.12),sweep=(phase-.5)*width*.38;stamp(ctx,src,'crescent',cx+sweep,low+(i-1)*available*.08,width*.64,available*.18,(i-1)*.6+(reducedMotion?0:(phase-.5)*.6),.28);}}
 else if(id==='eclipse'){const offset=reducedMotion?0:(progress-.5)*width*.55;stamp(ctx,src,'draw',cx+offset,low,width*.85,available*.12,-.6,.4);stamp(ctx,src,'gale',cx-offset,low,width*.85,available*.1,.6,.28);}
 else{stamp(ctx,src,'field',cx,low,width*.6,available*.2,reducedMotion?0:turn*.2,.22);for(let i=0;i<3;i++){const angle=i*Math.PI*2/3+turn;stamp(ctx,src,'echo',cx+Math.cos(angle)*width*.25,low+Math.sin(angle)*available*.1,width*.22,available*.2,angle+Math.PI/2,.32);}}
 }
 }finally{ctx.restore();}
 ctx.save();try{ctx.globalAlpha=fade;ctx.fillStyle='#fff1ee';ctx.font=`600 ${Math.max(14,Math.min(24,width*.055))}px "Hunter UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.shadowColor='#e33361';ctx.shadowBlur=8;ctx.fillText(ULT_NAMES[id],cx,Math.min(height-12,top+available+28),Math.max(1,width-24));}finally{ctx.restore();}return true;
}
export function drawUltimateCutin(ctx,s,viewport,options={},reducedMotion=false){
 const r=s?.skillRuntime,p=r?.ultimatePresentation;if(!ctx||!p||!ULT_NAMES[p.id]||s.phase!=='playing'||s.run?.flow==='stageClear'||!(s.player?.hp>0)||p.token!==r.token||!Number.isFinite(p.startedAt)||!Number.isFinite(s.run?.time))return false;
 const elapsed=s.run.time-p.startedAt;if(elapsed<0||elapsed>=1.35)return false;const portrait=portraitSource(options,p.id);if(!portrait)return false;
 const width=finite(viewport?.width,finite(viewport?.w)),height=finite(viewport?.height,finite(viewport?.h));if(width<=0||height<=0)return false;
 if(portrait.kind==='scene')return drawSceneCutin(ctx,portrait,p.id,elapsed,width,height,options,reducedMotion);
 const progress=elapsed/1.35,fade=Math.min(smooth(progress/.16),smooth((1-progress)/.22)),top=height>=300?70:height*.1,bottom=height>=300?100:height*.15,available=Math.max(20,height-top-bottom),base=Math.max(0,Math.min((width-20)/portrait.width,available/portrait.height)),entry=smooth(progress/.4),zoom=reducedMotion?1:p.id==='bloodmoon'?.78+.22*entry:p.id==='eclipse'?.82+.18*entry:.84+.12*entry,scale=base*zoom,bodyWidth=portrait.width*scale,bodyHeight=portrait.height*scale,cx=width/2,cy=top+available/2,margin=Math.max(0,(width-bodyWidth)/2-4),src=source(options);
 ctx.save();try{
 ctx.globalAlpha=fade*.8;ctx.fillStyle='#160d22';ctx.fillRect(0,top,width,available);
 ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
 if(src){if(p.id==='bloodmoon'){const turn=reducedMotion?0:progress*2.8;stamp(ctx,src,'dance',cx,cy,Math.min(width,available)*1.1,Math.min(width,available)*1.1,turn,.65);stamp(ctx,src,'crescent',cx,cy,width*.9,width*.9,-turn*.75,.45);}else if(p.id==='eclipse'){const sweep=reducedMotion?0:(progress-.5)*width*.9;stamp(ctx,src,'draw',cx+sweep,cy,width*1.15,available*.6,-.65,.8);stamp(ctx,src,'gale',cx-sweep,cy,width*1.15,available*.25,.65,.8);}else stamp(ctx,src,'field',cx,cy,width*.9,available*.7,reducedMotion?0:progress*.8,.45);}
 ctx.globalCompositeOperation='source-over';
 if(p.id==='phantoms'&&!reducedMotion){const gw=bodyWidth*.82,gh=bodyHeight*.82,spread=Math.min(width*.18,Math.max(0,(width-gw)/2-4))*(.35+.65*Math.sin(progress*Math.PI));for(const direction of [-1,1]){ctx.globalAlpha=fade*.15;ctx.drawImage(portrait.image,0,0,portrait.width,portrait.height,cx-gw/2+direction*spread,cy-gh/2,gw,gh);}}
 ctx.globalAlpha=fade;
 if(p.id==='bloodmoon'&&!reducedMotion){for(let i=0;i<3;i++){const delayed=smooth((progress-i*.055)/.28),shift=(1-delayed)*margin*(i%2?-1:1),sy=portrait.height*i/3;ctx.drawImage(portrait.image,0,sy,portrait.width,portrait.height/3,cx-bodyWidth/2+shift,cy-bodyHeight/2+bodyHeight*i/3,bodyWidth,bodyHeight/3);}}
 else{const slide=reducedMotion?0:p.id==='eclipse'?(1-entry)*margin:Math.sin(progress*Math.PI*1.2)*Math.min(margin,12);ctx.drawImage(portrait.image,0,0,portrait.width,portrait.height,cx-bodyWidth/2+slide,cy-bodyHeight/2,bodyWidth,bodyHeight);}
 if(p.id==='eclipse'&&!reducedMotion){ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.65*Math.sin(progress*Math.PI);ctx.fillStyle='#fff8ed';const sweep=(progress-.5)*width;for(const direction of [-1,1]){ctx.save();ctx.translate(cx+direction*sweep*.65,cy);ctx.rotate(direction*.65);ctx.fillRect(-width*.6,-2,width*1.2,4);ctx.restore();}}finally{ctx.restore();}}
 ctx.fillStyle='#fff1ee';ctx.font=`600 ${Math.max(14,Math.min(24,width*.055))}px "Hunter UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.shadowColor='#e33361';ctx.shadowBlur=8;ctx.fillText(ULT_NAMES[p.id],cx,Math.min(height-12,top+available+28),width-24);
 }finally{ctx.restore();}return true;
}

// Persistent marks outlive action interruption; their own expiry and enemy lifetime own visibility.
export function drawImageSkillBuffs(ctx,s,options={}){
 const r=s?.skillRuntime,time=s?.run?.time;if(!ctx||s?.phase!=='playing'||s.run?.flow==='stageClear'||!(s.player?.hp>0)||!r||!Number.isFinite(time)||!source(options))return false;
 const alpha=options.reducedMotion?.65:.65+.1*Math.sin(time*2),p=s.player;let drawn=false;
 for(const [skillId,until,radius] of [['stance',r.stanceUntil,45],['bloodblade',r.bloodbladeUntil,35],['phantoms',r.phantomUntil,35]])if(Number.isFinite(until)&&until>time)drawn=drawImageSkillEffect(ctx,{type:'skillImpact',skillId,x:p.x,y:p.y,radius,n:{x:1,y:0}},alpha,options)||drawn;
 const enemies=s.enemies||[];for(let i=0;i<Math.min(64,enemies.length);i++){const e=enemies[i],m=e?.skillMark;if(!e||e.dead||!m||!(m.expires>time))continue;drawn=drawImageSkillEffect(ctx,{type:'skillMark',skillId:'mark',x:e.x,y:e.y,radius:28+Math.min(5,Math.max(0,finite(m.count)))*2},alpha,options)||drawn;}
 return drawn;
}

// World-space ultimate accents. One short-lived presentation owns all particles;
// no new effects, images, randomness, wall clocks or simulation writes per frame.
export function drawUltimateField(ctx,s,options={}){
 const r=s?.skillRuntime,u=r?.ultimatePresentation,time=s?.run?.time;
 if(!ctx||!u||!ULT_NAMES[u.id]||s.phase!=='playing'||s.run?.flow!=='combat'||!(s.player?.hp>0)||u.token!==r.token||!Number.isFinite(time)||!Number.isFinite(u.startedAt))return false;
 const elapsed=time-u.startedAt;if(elapsed<0||elapsed>=1.35)return false;
 const src=source(options);if(!src)return false;
 const reduced=!!options.reducedMotion,t=reduced?.45:elapsed/1.35,fade=Math.min(1,elapsed/.08,(1.35-elapsed)/.22),turn=reduced?0:t*4.6;
 const x=u.id==='eclipse'?finite(u.x,s.player.x):s.player.x,y=u.id==='eclipse'?finite(u.y,s.player.y):s.player.y;
 const angle=Math.atan2(finite(u.ny),finite(u.nx,1));
 ctx.save();try{
 ctx.translate(finite(x),finite(y));ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=clamp(fade)*(reduced?.48:.72);
 // Layered sprite cores retain the generated art style; fine geometry supplies
 // readable sharp edges without large blurred full-screen surfaces.
 if(u.id==='bloodmoon'){
  stamp(ctx,src,'field',0,0,510,510,-turn*.15,.28);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+turn,d=110+45*Math.sin(t*Math.PI);
   stamp(ctx,src,'crescent',Math.cos(a)*d,Math.sin(a)*d,215,92,a+Math.PI/2,.55);
   stamp(ctx,src,'dance',0,0,470-i*38,470-i*38,-turn+i*.75,.12);
  }
  const burst=smooth((t-.58)/.42);
  for(let i=0;i<3;i++)stamp(ctx,src,'plunge',0,0,180+burst*330+i*30,180+burst*330+i*30,i*1.1,.12);
  fieldSparks(ctx,250,18,turn,t,'#ff547d',reduced);
 }else if(u.id==='eclipse'){
  ctx.rotate(angle);const fired=elapsed>=.65,charge=reduced?1:smooth(elapsed/.65),burst=reduced?.55:smooth((elapsed-.65)/.7);
  stamp(ctx,src,'field',0,0,85+charge*45,85+charge*45,-turn,.55);
  if(!fired){for(let i=0;i<4;i++)stamp(ctx,src,'seeking',25+i*19,(i%2?1:-1)*(1-charge)*65,65,30,Math.PI,.65);}
  else{
   for(let i=0;i<3;i++){stamp(ctx,src,'gale',280,(i-1)*18,560,110-i*18,0,.45);stamp(ctx,src,'draw',280,0,560,75-i*20,0,.65);}
   ctx.strokeStyle='#fff8ee';ctx.lineWidth=3+5*(1-burst);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(560,0);ctx.stroke();
   for(let i=0;i<6;i++)stamp(ctx,src,'crescent',100+i*72,(i%2?1:-1)*12,115,62,(i%2?1:-1)*.85,.65);
   ctx.save();ctx.translate(455,0);fieldSparks(ctx,92,14,0,burst,'#ffe3f1',reduced);ctx.restore();
  }
 }else{
  stamp(ctx,src,'field',0,0,350,350,-turn*.3,.45);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+turn*.65,d=125+20*Math.sin(t*Math.PI);
   stamp(ctx,src,'echo',Math.cos(a)*d,Math.sin(a)*d,120,145,a+Math.PI/2,.65);
   stamp(ctx,src,'crescent',Math.cos(a-.22)*d,Math.sin(a-.22)*d,110,46,a+Math.PI/2,.35);
  }
  stamp(ctx,src,'dance',0,0,270,270,-turn,.4);
  fieldSparks(ctx,175,12,-turn,t,'#d7c1ff',reduced);
 }
 }finally{ctx.restore();}return true;
}
function fieldSparks(ctx,radius,count,turn,t,color,reduced){
 ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.beginPath();
 const travel=reduced?.5:t,limit=reduced?4:count;
 for(let i=0;i<limit;i++){
  const a=i*Math.PI*2/limit+turn*.2,d=radius*(.4+.6*((travel+i/count)%1)),length=9+12*(i%3)/2;
  const x=Math.cos(a)*d,y=Math.sin(a)*d;
  ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*length,y+Math.sin(a)*length);
  if(i%3===0){ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);}
 }ctx.stroke();
}

// Alpha 0.142 (사용자 요청 '더 화려하게, 색상 추가, 파편 느낌, 몬스터가 스킬로 맞는 느낌'): every skill has its own
// palette [core, main, edge, spark]. Impacts throw angular shards and sparks from the hit point; skillHit effects
// (one per enemy struck, engine damageEnemy) flash a star on the body and spray shards away from the caster.
// Pseudo-random by effect id only: no RNG, no allocation beyond the draw calls.
export const SKILL_PALETTES=Object.freeze({
 crescent:['#ffffff','#7fe3ff','#3a8dff','#ffd76a'],gale:['#f4fff9','#4fe3a6','#14a38a','#c8ffe6'],dance:['#fff3d6','#ff4a4a','#ffb43a','#ffe08a'],
 draw:['#ffffff','#ffe066','#7cc8ff','#fff6b0'],plunge:['#fff1c4','#ff9a2e','#d8401c','#b08a62'],parry:['#ffffff','#5aa8ff','#2a5cff','#bff4ff'],
 echo:['#f6eaff','#a77bff','#5b3fd8','#e0c8ff'],triple:['#ffffff','#dfe9f5','#ff3b4f','#ffd36a'],seeking:['#fbfff0','#7dff6a','#22b84a','#ffe45c'],
 returning:['#f0ffff','#38e8e0','#0f9fb0','#bffcff'],field:['#f3ecff','#9a5cff','#3d7bff','#d9d2ff'],breach:['#fff6e0','#ff7a2a','#c62a1a','#b4c0cc'],
 gather:['#fffbe8','#ffcf40','#d48a10','#fff0a0'],stance:['#f2fbff','#6fd2ff','#3d8fd8','#e2f4ff'],mark:['#fff4fb','#ff4fc8','#ffc23a','#ffe0f4'],
 bloodblade:['#ffe0d8','#ff2a40','#7a0018','#ff8a3a'],bloodmoon:['#fff0e0','#ff2a3c','#ffb02e','#ffe08a'],eclipse:['#ffffff','#ffe27a','#9b6bff','#fff3c0'],
 phantoms:['#f4eaff','#b07bff','#36d6ff','#e8d8ff']});
export const skillPalette=id=>SKILL_PALETTES[id]??SKILL_PALETTES.crescent;
const rand=(seed,i)=>{const v=Math.sin(seed*12.9898+i*78.233)*43758.5453;return v-Math.floor(v);};
function shard(ctx,x,y,len,wid,angle,fill,edge){const c=Math.cos(angle),s=Math.sin(angle),nx=-s,ny=c;ctx.beginPath();ctx.moveTo(x+c*len,y+s*len);ctx.lineTo(x+nx*wid,y+ny*wid);ctx.lineTo(x-c*len*.45,y-s*len*.45);ctx.lineTo(x-nx*wid*.7,y-ny*wid*.7);ctx.lineTo(x+c*len,y+s*len);ctx.fillStyle=fill;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.stroke();}}
function burst(ctx,x,y,r,t,seed,palette,count,lift,bias=null,reduced=false){
 const [core,main,edge,spark]=palette,g=reduced?0:t*t*lift*.9;
 for(let i=0;i<count;i++){
  const base=bias===null?i/count*Math.PI*2:bias+(rand(seed,i)-.5)*1.9,a=base+(rand(seed,i+40)-.5)*.5,speed=.55+rand(seed,i+80)*.75,d=r*(.15+speed*(reduced?.4:t)),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.62+g*(.6+rand(seed,i+9)),len=(7+rand(seed,i+3)*11)*(1-t*.5)*(r>90?1.4:1);
  if(len<=.5)continue;ctx.globalAlpha=Math.max(0,1-t*t);shard(ctx,px,py,len,len*.42,a+t*(rand(seed,i+5)-.5)*6,i%3===0?core:i%3===1?main:edge,i%2?null:'#00000055');
 }
 ctx.lineCap='round';
 for(let i=0;i<Math.ceil(count*.7);i++){const a=(bias===null?i/count*Math.PI*2*1.3:bias+(rand(seed,i+60)-.5)*1.6)+rand(seed,i+20),d0=r*(.1+t*.7),d1=d0+r*(.18+.2*rand(seed,i+30))*(1-t);ctx.globalAlpha=Math.max(0,1-t)*.95;ctx.strokeStyle=i%2?spark:core;ctx.lineWidth=i%3?1.5:2.5;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*d0,y+Math.sin(a)*d0*.62);ctx.lineTo(x+Math.cos(a)*d1,y+Math.sin(a)*d1*.62);ctx.stroke();}
}
function star(ctx,x,y,r,angle,palette,alpha){const [core,main]=palette;ctx.globalAlpha=alpha;for(const [k,color,w] of [[1,main,.32],[.62,core,.2]]){ctx.beginPath();for(let i=0;i<8;i++){const a=angle+i*Math.PI/4,rr=(i%2?r*.3:r)*k;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.lineTo(x+Math.cos(angle)*r*k,y+Math.sin(angle)*r*k);ctx.fillStyle=color;ctx.fill();}
 const g=typeof ctx.createRadialGradient==='function'?ctx.createRadialGradient(x,y,0,x,y,r*1.3):null;if(g){g.addColorStop(0,main+'aa');g.addColorStop(1,main+'00');ctx.fillStyle=g;ctx.globalAlpha=alpha*.8;ctx.beginPath();ctx.ellipse(x,y,r*1.3,r*1.3,0,0,Math.PI*2);ctx.fill();}}
// One enemy struck by a skill: a colored star on the body, shards thrown away from the caster, a thin shock ring.
export function drawSkillHit(ctx,f,options={}){
 if(!ctx||f?.type!=='skillHit'||!(f.maxTtl>0)||!Number.isFinite(f.x)||!Number.isFinite(f.y))return false;
 const t=clamp(1-f.ttl/f.maxTtl),palette=skillPalette(f.skillId),body=Math.max(40,Math.min(160,finite(f.size,70))),y=f.y-body*.55,big=f.boss?1.5:f.heavy||f.critical?1.2:1,reduced=!!options.reducedMotion,bias=Math.atan2(finite(f.ny),finite(f.nx,1));
 ctx.save();try{ctx.globalCompositeOperation='lighter';
  if(t<.45)star(ctx,f.x,y,(24+14*big)*(1-t/.45*.4)*(f.critical?1.25:1),bias+t*2,palette,1-t/.45);
  ctx.globalAlpha=Math.max(0,1-t*1.6);ctx.strokeStyle=palette[1];ctx.lineWidth=2.5*(1-t);ctx.beginPath();ctx.ellipse(f.x,y,Math.max(.1,(10+t*46)*big),Math.max(.1,(7+t*30)*big),0,0,Math.PI*2);ctx.stroke();
  ctx.globalCompositeOperation='source-over';burst(ctx,f.x,y,48*big,t,Math.abs(f.id??1),palette,reduced?4:f.critical?13:10,60,bias,reduced);
 }finally{ctx.restore();}return true;
}
// Area impacts (skillImpact): a wide ring of shards and sparks around the strike, in the skill's colors.
export function drawSkillImpactShards(ctx,f,alpha,options={}){
 if(!ctx||f?.type!=='skillImpact'||!SKILL_ART_CELLS[f.skillId]&&!SKILL_PALETTES[f.skillId])return false;
 const t=1-clamp(alpha),r=Math.max(20,Math.min(320,finite(f.radius,100))),palette=skillPalette(f.skillId),forward=['crescent','gale','draw','triple','returning','eclipse','seeking','echo'].includes(f.skillId),n=Math.atan2(finite(f.n?.y),finite(f.n?.x,1));
 const x=finite(f.x)+(forward?Math.cos(n)*r*.55:0),y=finite(f.y)-(SKILL_LIFT[f.skillId]??18)+(forward?Math.sin(n)*r*.3:0);
 ctx.save();try{burst(ctx,x,y,forward?r*.55:r*.75,t,Math.abs((f.serial??0)*7+(f.index??0)+1),palette,options.reducedMotion?5:forward?10:14,40,forward?n:null,!!options.reducedMotion);}finally{ctx.restore();}return true;
}
