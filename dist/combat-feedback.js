import {GROUND_DEPTH_SCALE} from './world.js?v=0.143.7';

// Short local feedback only. These renderers never move actors or consume RNG.
export function drawHitImpact(ctx,f,reducedMotion=false){
 if(!(f.ttl>0)||!(f.maxTtl>0)||!Number.isFinite(f.x)||!Number.isFinite(f.y))return;
 const t=1-Math.min(1,f.ttl/f.maxTtl),fade=1-t;
 const guarded=!!f.guarded,heavy=!!f.heavy,r=guarded?19:heavy?29:18;
 const ink=guarded?'#b4cee5':f.critical?'#ffe2ad':'#f7dfe9';
 const angle=Math.atan2((f.ny??0)*GROUND_DEPTH_SCALE,f.nx??1);
 ctx.save();
 try{
  ctx.globalAlpha*=fade;ctx.translate(f.x,f.y);ctx.rotate(angle);ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();
  if(guarded){ctx.moveTo(-6,-r);ctx.lineTo(7,-r*.5);ctx.lineTo(12,0);ctx.lineTo(7,r*.5);ctx.lineTo(-6,r);}
  else{ctx.moveTo(-r,-r*.45);ctx.lineTo(r,r*.45);ctx.moveTo(-r*.45,r*.65);ctx.lineTo(r*.45,-r*.65);}
  ctx.strokeStyle='#25101d';ctx.lineWidth=heavy?7:5;ctx.stroke();ctx.strokeStyle=ink;ctx.lineWidth=heavy?3:2;ctx.stroke();
  if(heavy&&!guarded){ctx.beginPath();ctx.ellipse(0,0,r*(.35+t*.85),r*(.24+t*.5),0,0,Math.PI*2);ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.stroke();}
  const count=reducedMotion?2:guarded?3:f.critical?8:heavy?6:4;
  for(let i=0;i<count;i++){
   const a=i*Math.PI*2/count+(f.id??0),reach=r*(.45+(reducedMotion?.25:t)),x=Math.cos(a)*reach,y=Math.sin(a)*reach*.65;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*(heavy?7:4),y+Math.sin(a)*(heavy?5:3));ctx.strokeStyle=i%2?ink:guarded?'#759ab4':'#c46b8e';ctx.lineWidth=2;ctx.stroke();
  }
 }finally{ctx.restore();}
}

export function drawCombatProjectile(ctx,q){
 if(!Number.isFinite(q.x)||!Number.isFinite(q.y)||!Number.isFinite(q.vx)||!Number.isFinite(q.vy))return;
 const speed=Math.hypot(q.vx,q.vy);if(speed<.001)return;
 const friendly=!!q.friendly,color=q.ancientSpec?q.color:friendly?'#b6f9dc':'#ffc17a';
 ctx.save();
 try{
  // Keep the same ground anchor and 35px flight height as the actor projection.
  ctx.translate(q.x,q.y);ctx.scale(1,1/GROUND_DEPTH_SCALE);ctx.translate(-q.x,-q.y);ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(q.x-q.vx/speed*28,q.y-35-q.vy/speed*28*GROUND_DEPTH_SCALE);ctx.lineTo(q.x,q.y-35);
  ctx.strokeStyle='#25101d';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=6;ctx.stroke();
  ctx.fillStyle='#25101d';ctx.fillRect(q.x-7,q.y-42,14,14);ctx.fillStyle=color;ctx.fillRect(q.x-5,q.y-40,10,10);
  ctx.fillStyle=friendly?'#e4fff0':'#fff0cf';ctx.fillRect(q.x-1,q.y-38,2,6);
  // Shared hostile outline stays readable; species only changes the inner payload.
  if(!friendly&&q.projectileStyle){
   ctx.fillStyle=q.color??color;ctx.strokeStyle='#f5ebdd';ctx.lineWidth=1.5;
   if(q.projectileStyle==='spore'){ctx.beginPath();ctx.ellipse(q.x,q.y-35,5,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
   else if(q.projectileStyle==='ice'){ctx.beginPath();ctx.moveTo(q.x,q.y-43);ctx.lineTo(q.x+5,q.y-35);ctx.lineTo(q.x,q.y-27);ctx.lineTo(q.x-5,q.y-35);ctx.closePath();ctx.fill();ctx.stroke();}
   else if(q.projectileStyle==='spectral'){ctx.beginPath();ctx.ellipse(q.x,q.y-35,4,7,0,0,Math.PI*2);ctx.strokeStyle=q.color??color;ctx.lineWidth=3;ctx.stroke();}
  }
 }finally{ctx.restore();}
}
