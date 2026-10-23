// Pure, ground-space Canvas recipes. Casts telegraph; impacts resolve at the hit.
export const SKILL_VFX_IDS=Object.freeze(['crescent','gale','dance','draw','plunge','parry','echo','triple','seeking','returning','field','breach','gather','stance','mark','bloodblade','bloodmoon','eclipse','phantoms']);
const SILVER='#edf7ff',RED='#ec4162',DARK='#721c42';
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
function line(c,points,color=SILVER,width=2,closed=false){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(closed)c.closePath();c.stroke();}
// A tapered forward ribbon; every vertex stays inside the authoritative reach.
function ribbon(c,r,w,color,width=2,bow=0){const pts=[];for(let i=0;i<=10;i++){const u=i/10;pts.push([u*r,Math.sin(u*Math.PI)*w+bow*u]);}line(c,pts,color,width);}
function oval(c,x,y,rx,ry,color=RED,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);c.stroke();}
function blade(c,x,y,length,angle,color=SILVER,width=2){const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;line(c,[[x-dx*length*.2,y-dy*length*.2],[x+nx*width,y+ny*width],[x+dx*length,y+dy*length],[x-nx*width,y-ny*width]],color,width*.6,true);}
function crescent(c,r,start,span,color,width=3){const pts=[];for(let i=0;i<=10;i++){const a=start+span*i/10;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}line(c,pts,color,width);}
function star(c,x,y,r,color=RED){line(c,[[x-r,y],[x,y-r*.45],[x+r,y],[x,y+r*.45]],color,2,true);}
function shards(c,r,count,phase,color=RED){for(let i=0;i<count;i++){const a=i*Math.PI*2/count+.2;blade(c,Math.cos(a)*r,Math.sin(a)*r,r*.25,a+phase,color,1.5);}}
const PASSIVES=Object.freeze(['opening','flow','finisher','footwork','pursuit','imbalance','breath','resolve','lone','surrounded','scar','recovery','steady','resonance','momentum','reserve']);
function passive(c,id,r,t){
 switch(id){
 case 'opening':line(c,[[-r,-r*.5],[0,0],[-r,r*.5]],RED);blade(c,0,0,r,0);break;
 case 'flow':for(let i=0;i<3;i++)crescent(c,r*(.45+i*.25),t+i*2,1.6,i%2?RED:SILVER);break;
 case 'finisher':blade(c,-r*.6,0,r*1.3,0);star(c,r*.7,0,r*.3);break;
 case 'footwork':for(let i=0;i<2;i++)line(c,[[-r+i*r,-r*.5],[-r*.5+i*r,0],[-r*.8+i*r,r*.5]],SILVER,3);break;
 case 'pursuit':blade(c,-r*.6,0,r,0,RED);blade(c,0,0,r,0);break;
 case 'imbalance':line(c,[[-r,-r],[0,-r*.2],[-r*.2,r*.3],[r,r]],RED,3);line(c,[[-r,r],[r,-r]],SILVER);break;
 case 'breath':oval(c,0,0,r,r*.5,SILVER);oval(c,0,0,r*.45,r*.22,RED);break;
 case 'resolve':star(c,0,0,r,SILVER);oval(c,0,0,r*.3,r*.3,RED);break;
 case 'lone':blade(c,0,r*.4,r*1.2,-Math.PI/2);oval(c,0,-r*.7,r*.18,r*.18,RED);break;
 case 'surrounded':for(let i=0;i<6;i++){const a=i*Math.PI/3;blade(c,Math.cos(a)*r,Math.sin(a)*r,r*.35,a+Math.PI,RED);}break;
 case 'scar':for(let i=0;i<3;i++)line(c,[[-r+i*r*.55,-r*.7],[-r*.4+i*r*.55,r*.7]],RED,3);break;
 case 'recovery':crescent(c,r,.3,4.6,RED);line(c,[[r*.8,-r*.7],[r,-r*.1],[r*.4,-r*.25]],SILVER);break;
 case 'steady':line(c,[[-r,r*.6],[r,r*.6]],RED,3);blade(c,0,r*.5,r*1.4,-Math.PI/2);break;
 case 'resonance':oval(c,-r*.35,0,r*.6,r*.6,SILVER);oval(c,r*.35,0,r*.6,r*.6,RED);break;
 case 'momentum':for(let i=0;i<3;i++)line(c,[[-r+i*r*.6,-r*.6],[-r*.5+i*r*.6,0],[-r+i*r*.6,r*.6]],i===2?SILVER:RED,2+i);break;
 case 'reserve':line(c,[[-r,-r*.5],[0,-r],[r,-r*.5],[r*.7,r*.6],[0,r],[-r*.7,r*.6]],SILVER,2,true);star(c,0,0,r*.35);break;
 }
}
export function drawSkillEffect(ctx,f,alpha){
 if(!ctx||!f)return;const isPassive=f.type==='skillPassive';
 if(isPassive?!PASSIVES.includes(f.skillId):!SKILL_VFX_IDS.includes(f.skillId))return;
 if(!isPassive&&f.type!=='skillCast'&&f.type!=='skillImpact')return;
 const a=clamp(alpha),t=1-a,hit=f.type==='skillImpact',reach=Math.max(8,Math.min(560,Number.isFinite(f.radius)?f.radius:65));
 const forward=['crescent','gale','draw','triple','returning','eclipse'].includes(f.skillId),r=!hit&&forward?Math.min(42,reach):reach;
 let x=Number.isFinite(f.x)?f.x:0,y=Number.isFinite(f.y)?f.y:0;
 const travel=f.skillId==='seeking'&&!hit&&[f.fromX,f.fromY,f.targetX,f.targetY].every(Number.isFinite);
 if(travel){x=f.fromX+(f.targetX-f.fromX)*t;y=f.fromY+(f.targetY-f.fromY)*t;}
 ctx.save();try{
 ctx.globalAlpha=a*(hit?1:.65);ctx.translate(x,y);
 ctx.shadowColor=RED;ctx.shadowBlur=hit?7:4;
 if(isPassive){passive(ctx,f.skillId,Math.min(26,r),t);return;}
 const nx=Number.isFinite(f.n?.x)?f.n.x:1,ny=Number.isFinite(f.n?.y)?f.n.y:0;
 const angle=travel?Math.atan2(f.targetY-f.fromY,f.targetX-f.fromX):Math.atan2(ny,nx);ctx.rotate(angle);const q=hit?.35+t*.65:.45+t*.35;
 switch(f.skillId){
 case 'crescent':ribbon(ctx,r,hit?27:9,RED,hit?7:2);ribbon(ctx,r,hit?-27:-9,SILVER,hit?5*a+1:2);break;
 case 'gale':for(let i=0;i<3;i++){const yy=(i-1)*(hit?27:7);line(ctx,[[0,yy*.3],[r,yy]],i===1?SILVER:RED,hit?4:1);}line(ctx,[[r*.8,-(hit?28:8)],[r,0],[r*.8,hit?28:8]],SILVER,3);break;
 case 'dance':for(let i=0;i<3;i++)crescent(ctx,r*(.5+i*.18),t*5+i*2.1,1.7,i===1?SILVER:RED,hit?4:2);break;
 case 'draw':line(ctx,[[0,0],[r*.85,-r*.48],[r,0],[r*.85,r*.48],[0,0]],RED,hit?3:1);line(ctx,[[0,0],[r,0]],SILVER,hit?9*a+1:2);if(hit)ribbon(ctx,r,r*.24,SILVER,3);break;
 case 'plunge':if(!hit){line(ctx,[[0,-r],[0,-r*(1-t)]],SILVER,4);line(ctx,[[-r*.2,-r*.45],[0,0],[r*.2,-r*.45]],RED,2);}else{oval(ctx,0,0,r*q,r*q*.6,RED,4);for(let i=0;i<5;i++){const b=i*Math.PI*2/5;line(ctx,[[0,0],[Math.cos(b)*r*q,Math.sin(b)*r*q*.6]],SILVER,2);}}break;
 case 'parry':line(ctx,[[r*.3,-r*.6],[r*.6,0],[r*.3,r*.6]],SILVER,5);if(hit){line(ctx,[[-r*.5,-r*.5],[r*.5,r*.5]],RED,4);line(ctx,[[-r*.5,r*.5],[r*.5,-r*.5]],SILVER,4);}else oval(ctx,r*.4,0,r*.15,r*.6,RED);break;
 case 'echo':for(let i=0;i<2;i++){ctx.save();ctx.translate(-i*r*.55,0);ctx.globalAlpha=a*(i?.35:.9);crescent(ctx,r*.55,-1.1,2.2,i?RED:SILVER,hit?5:2);ctx.restore();}break;
 case 'triple':for(let i=0;i<3;i++){const yy=(i-1)*r*.38;line(ctx,[[0,0],[r*.65,yy],[r,yy*.8]],i===(f.index||0)%3?SILVER:RED,hit?5:1);}break;
 case 'seeking':if(!hit){line(ctx,[[-28,0],[0,0]],RED,3);blade(ctx,-12,0,12,0,SILVER,2);}else{star(ctx,0,0,Math.min(55,r)*q,SILVER);oval(ctx,0,0,Math.min(55,r)*q*.4,Math.min(55,r)*q*.4,RED);}break;
 case 'returning':{const back=(f.index||0)%2===1,w=hit?30:8;ribbon(ctx,r,w,RED,2);ribbon(ctx,r,-w,SILVER,hit?4:2);const tip=back?r*.08:r*.92,dir=back?1:-1;line(ctx,[[tip+dir*r*.08,-w*.35],[tip,0],[tip+dir*r*.08,w*.35]],back?SILVER:RED,3);break;}
 case 'field':oval(ctx,0,0,r,r*.65,RED,hit?3:1);for(let i=0;i<3;i++){const b=i*Math.PI*2/3;blade(ctx,Math.cos(b)*r*.55,Math.sin(b)*r*.35,r*(hit?.4:.2),-Math.PI/2,SILVER,2);}break;
 case 'breach':line(ctx,[[-r*.5,-r*.6],[0,-r*.25],[-r*.15,r*.1],[r*.4,r*.65]],RED,hit?6:2);line(ctx,[[-r*.7,r*.5],[r*.7,-r*.5]],SILVER,hit?8:2);if(hit)shards(ctx,r*q,6,t);break;
 case 'gather':for(let i=0;i<4;i++){const b=i*Math.PI/2;const d=r*(hit?.25+t*.3:1-t*.6);line(ctx,[[Math.cos(b)*d,Math.sin(b)*d],[Math.cos(b)*d*.45,Math.sin(b)*d*.45]],SILVER,3);star(ctx,Math.cos(b)*d*.5,Math.sin(b)*d*.5,r*.12,RED);}break;
 case 'stance':oval(ctx,0,0,r*q,r*q*.45,SILVER,3);line(ctx,[[-r*.6,0],[r*.6,0]],RED,2);blade(ctx,0,0,r*.55,-Math.PI/2,SILVER,2);break;
 case 'mark':line(ctx,[[-r*.45,-r*.45],[r*.45,-r*.45],[r*.45,r*.45],[-r*.45,r*.45]],RED,3,true);star(ctx,0,0,r*q,SILVER);break;
 case 'bloodblade':blade(ctx,0,r*.5,r*1.2,-Math.PI/2,SILVER,4);for(let i=0;i<3;i++)crescent(ctx,r*(.3+i*.2),-2+t*2+i*.7,1.1,RED,3);break;
 case 'bloodmoon':oval(ctx,0,0,r*q,r*q,RED,3);for(let i=0;i<6;i++){const b=i*Math.PI/3+t;line(ctx,[[Math.cos(b)*r*.7,Math.sin(b)*r*.7],[Math.cos(b+Math.PI)*r*.7,Math.sin(b+Math.PI)*r*.7]],i%2?RED:SILVER,hit?3:1);}break;
 case 'eclipse':oval(ctx,r*.08,0,Math.min(18,r*.08),Math.min(18,r*.08),DARK,hit?8:3);line(ctx,[[0,0],[r,0]],RED,hit?20*a+2:3);line(ctx,[[0,0],[r,0]],SILVER,hit?8*a+1:1);if(hit){line(ctx,[[r*.65,-24],[r*.76,0],[r*.65,24]],RED,2);}break;
 case 'phantoms':for(let i=0;i<3;i++){const b=-Math.PI/2+(i-1)*.6;blade(ctx,Math.sin(b)*r*.15,(i-1)*r*.3,r*.7,b,i===1?SILVER:RED,3);}if(hit)crescent(ctx,r*q,-1,2,SILVER,3);break;
 }
 }finally{ctx.restore();}
}
export function drawSkillBuffs(ctx,s){
 if(!ctx||!s?.player||!s?.run)return;const time=s.run.time||0,r=s.skillRuntime||{},p=s.player;
 for(const [id,until] of [['stance',r.stanceUntil],['bloodblade',r.bloodbladeUntil],['phantoms',r.phantomUntil]])if(until>time)drawSkillEffect(ctx,{type:'skillImpact',skillId:id,x:p.x,y:p.y,radius:id==='stance'?45:35,n:{x:1,y:0}},.65+.15*Math.sin(time*3));
 const enemies=s.enemies||[];let shown=0;for(let enemyIndex=0;enemyIndex<enemies.length&&shown<64;enemyIndex++){const e=enemies[enemyIndex];if(e.dead)continue;shown++;
 if(e.skillMark?.expires>time){ctx.save();try{ctx.translate(e.x,e.y);const n=Math.max(0,Math.min(5,e.skillMark.count||0));line(ctx,[[-19,-12],[0,-23],[19,-12],[19,12],[0,23],[-19,12]],RED,2,true);for(let i=0;i<n;i++)star(ctx,-12+i*6,0,3,SILVER);}finally{ctx.restore();}}
 if(e.skillBreach?.until>time){ctx.save();try{ctx.translate(e.x,e.y);line(ctx,[[-14,-19],[-3,-5],[-8,3],[13,19]],SILVER,3);line(ctx,[[-10,-19],[1,-5],[-4,3],[17,19]],RED,2);}finally{ctx.restore();}}
 }
}
