import {GROUND_DEPTH_SCALE} from './world.js?v=0.149.6';
const KINDS=Object.freeze(['slash','bolt','impact','charge']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export function validMonsterEffects(atlas,images){
 if(!atlas||!images||typeof atlas.image!=='string'||!Number.isInteger(atlas.width)||!Number.isInteger(atlas.height)||atlas.width<4||atlas.height<4||atlas.width*atlas.height>4194304)return false;
 const image=images.get(atlas.image);if(!image||(image.naturalWidth??image.width)!==atlas.width||(image.naturalHeight??image.height)!==atlas.height)return false;
 const seen=[];
 for(const kind of KINDS){const frames=atlas.frames?.[kind];if(!Array.isArray(frames)||frames.length!==4)return false;
  for(const f of frames){if(!f||![f.x,f.y,f.w,f.h].every(Number.isInteger)||f.x<0||f.y<0||f.w<=0||f.h<=0||f.x+f.w>atlas.width||f.y+f.h>atlas.height||!Number.isFinite(f.pivotX)||!Number.isFinite(f.pivotY)||f.pivotX<0||f.pivotY<0||f.pivotX>f.w||f.pivotY>f.h)return false;
   if(seen.some(g=>f.x<g.x+g.w&&f.x+f.w>g.x&&f.y<g.y+g.h&&f.y+f.h>g.y))return false;seen.push(f);
  }
 }return true;
}
function stamp(ctx,options,chapter,kind,index,x,y,w,h,angle=0,alpha=1,lift=null){
 const atlas=options?.atlases?.[chapter],image=atlas&&options.images?.get(atlas.image),f=atlas?.frames?.[kind]?.[index];
 if(!image||image.complete===false||!f||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(w)||!Number.isFinite(h)||!Number.isFinite(angle)||!Number.isFinite(alpha)||w<=0||h<=0)return false;
 ctx.save();try{
  // Volumetric sprites stand upright; ground projection must not flatten them.
  ctx.translate(x,y);if(lift!==null){ctx.scale(1,1/GROUND_DEPTH_SCALE);ctx.translate(0,-lift);}
  ctx.rotate(angle);ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=clamp(alpha,0,1);
  ctx.drawImage(image,f.x,f.y,f.w,f.h,-w*f.pivotX/f.w,-h*f.pivotY/f.h,w,h);
 }finally{ctx.restore();}return true;
}
const frame=(progress,reduced)=>reduced?1:Math.min(3,Math.floor(clamp(progress,0,1)*4));
export function drawMonsterAttackEffect(ctx,f,alpha,options){
 if(!ctx||!f||!(f.ttl>0)||!(f.maxTtl>0)||!Number.isInteger(f.fxChapter))return false;
 const progress=1-clamp(f.ttl/f.maxTtl,0,1),index=frame(progress,options?.reducedMotion),r=clamp(f.radius??40,16,260);
 // The sheet already fades between frames. Keep the first impact readable and
 // fade only its last third rather than multiplying two full-length fades.
 const opacity=clamp(alpha,0,1)*Math.min(1,(1-progress)/.34);
 if(f.type==='slam'){
  const slash=f.monsterKind==='skitter';
  return stamp(ctx,options,f.fxChapter,slash?'slash':'impact',index,f.x,f.y,r*(slash?2.5:2.4),r*(slash?1.8:2.2),slash?Math.atan2((f.ny??0)*GROUND_DEPTH_SCALE,f.nx??1):0,opacity,slash?24:0);
 }
 if(f.type==='spit')return stamp(ctx,options,f.fxChapter,'bolt',index,f.x,f.y,90,58,Math.atan2((f.ny??0)*GROUND_DEPTH_SCALE,f.nx??1),opacity,35);
 if(f.type==='acidImpact'&&!f.friendly)return stamp(ctx,options,f.fxChapter,'impact',index,f.x,f.y,104,96,0,opacity,35);
 return false;
}
export function drawMonsterCharge(ctx,e,chapter,options){
 if(!ctx||!e||e.dead||e.action!=='attack'||!Number.isFinite(e.chargeX)||!Number.isFinite(e.chargeY)||Math.hypot(e.chargeX,e.chargeY)<.001||!(e.actionTime>=0)||!(e.actionTime<(e.chargeDuration??.45)))return false;
 const width=e.boss?290:195,angle=Math.atan2(e.chargeY,e.chargeX),progress=e.actionTime/(e.chargeDuration??.45);
 return stamp(ctx,options,chapter,'charge',frame(progress,options?.reducedMotion),e.x-e.chargeX*width*.38,e.y-e.chargeY*width*.38,width,width*.8,angle,.95);
}
export function drawMonsterProjectile(ctx,q,time,options){
 if(!ctx||!q||q.friendly||!(q.ttl>0)||!Number.isInteger(q.fxChapter)||!Number.isFinite(q.x)||!Number.isFinite(q.y)||!Number.isFinite(q.vx)||!Number.isFinite(q.vy)||!Number.isFinite(time)||Math.hypot(q.vx,q.vy)<.001)return false;
 // Loop the two sustained cores while the physical projectile is alive; the
 // dissolving end frame belongs to impacts, not to an incoming live threat.
 const index=options?.reducedMotion?1:1+Math.floor(Math.max(0,time)*12+(q.id??0))%2;
 return stamp(ctx,options,q.fxChapter,'bolt',index,q.x,q.y,90,58,Math.atan2(q.vy*GROUND_DEPTH_SCALE,q.vx),1,35);
}
