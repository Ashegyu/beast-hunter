// Presentation timeline only. World travel and damage remain owned by combat-skills.
import {attackFrame,directionIndex,swingMotion} from './motion.js?v=0.147.6';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*clamp(t);
const recipes={
 crescent:{name:'월아 검기',prepare:'backhand',strikes:['forehand'],settle:'forehand',lean:5},
 gale:{name:'질풍 돌진',prepare:'dash',strikes:['forehand'],settle:'dash',lean:11},
 dance:{name:'윤무 회전',prepare:'forehand',strikes:['forehand','backhand','forehand','finisher'],settle:'backhand',lean:3},
 draw:{name:'발도 납도',prepare:'backhand',strikes:['forehand'],settle:'backhand',lean:9},
 plunge:{name:'낙월 도약',prepare:'finisher',strikes:['finisher'],settle:'finisher',lean:4},
 parry:{name:'흘림 반격',prepare:'backhand',strikes:['backhand'],settle:'forehand',lean:6},
 echo:{name:'잔영 후퇴',prepare:'dash',strikes:['backhand','forehand'],settle:'idle',lean:-6},
 triple:{name:'연월 삼연',prepare:'forehand',strikes:['forehand','backhand','finisher'],settle:'finisher',lean:7},
 seeking:{name:'추적 지목',prepare:'forehand',strikes:['forehand'],settle:'idle',lean:4},
 returning:{name:'회귀 투척·회수',prepare:'backhand',strikes:['forehand','backhand'],settle:'backhand',lean:2},
 field:{name:'잔월 검진 전개',prepare:'finisher',strikes:['finisher','idle','idle','idle','idle','idle'],settle:'idle',lean:0},
 breach:{name:'파갑 내려베기',prepare:'finisher',strikes:['finisher'],settle:'finisher',lean:12},
 gather:{name:'월쇄 끌어베기',prepare:'backhand',strikes:['backhand'],settle:'forehand',lean:-3},
 stance:{name:'수월 호흡',prepare:'idle',strikes:['idle'],settle:'idle',lean:0},
 mark:{name:'표식 각인',prepare:'forehand',strikes:['backhand'],settle:'idle',lean:2},
 bloodblade:{name:'혈월 검날 개방',prepare:'finisher',strikes:['forehand'],settle:'idle',lean:-2},
 bloodmoon:{name:'적월 칠연',prepare:'backhand',strikes:['forehand','backhand','forehand','backhand','forehand','backhand','finisher'],settle:'finisher',lean:6},
 eclipse:{name:'월식 축력 일섬',prepare:'finisher',strikes:['finisher'],settle:'dash',lean:16},
 phantoms:{name:'월영 분신 소환',prepare:'backhand',strikes:['finisher'],settle:'idle',lean:0},
};
export const SKILL_MOTIONS=Object.freeze(Object.fromEntries(Object.entries(recipes).map(([id,r])=>[id,Object.freeze({...r,strikes:Object.freeze(r.strikes)})])));
export function createSkillMotion(id,root,now,delay,hits=1,interval=0,duration=.4){
 if(!SKILL_MOTIONS[id])return null;
 return {id,serial:root.serial,startedAt:now,duration,impactTimes:Array.from({length:hits},(_,i)=>delay+i*interval),n:{...root.n},heading:directionIndex(root.n.x,root.n.y),originX:root.x,originY:root.y,token:root.token,equipmentAtStart:root.equipmentAtStart??null,reactionAt:null};
}
export function sampleSkillMotion(m,now){
 if(!m||!SKILL_MOTIONS[m.id]||!Number.isFinite(now))return null;const t=now-m.startedAt;if(t<0||t>=m.duration)return null;
 const r=SKILL_MOTIONS[m.id],times=m.impactTimes;let index=0;
 for(let i=1;i<times.length;i++)if(t>(times[i-1]+times[i])/2)index=i;
 const impact=times[index],start=index?(times[index-1]+impact)/2:0,end=index+1<times.length?(impact+times[index+1])/2:m.duration;
 let action=r.strikes[index%r.strikes.length],frame=attackFrame(t-start,Math.max(.001,impact-start),Math.max(.002,end-start),6),heading=m.heading,lift=0,offset=0,scaleY=1,gearTurn=0;
 const before=t<impact,progress=clamp(t/Math.max(.001,times[0])),recover=clamp((t-impact)/Math.max(.001,end-impact));
 if(before&&index===0){action=r.prepare;frame=action==='idle'?0:action==='dash'?Math.min(3,Math.floor(progress*4)):Math.min(2,Math.floor(progress*3));}
 if(action==='idle')frame=0;if(action==='dash')frame=Math.min(3,frame);
 switch(m.id){
  case 'crescent':offset=before?-5*progress:6*(1-recover);gearTurn=before?-.2:.15*(1-recover);break;
  case 'gale':if(before){action='dash';frame=Math.min(3,Math.floor(progress*4));}offset=before?0:8*(1-recover);break;
  case 'dance':heading=(m.heading+Math.floor(t/Math.max(.1,m.duration)*8))%8;offset=Math.sin(t*15)*3;break;
  case 'draw':if(before){action='backhand';frame=1;scaleY=.94;gearTurn=-.45;}else{action='forehand';offset=9*(1-recover);gearTurn=.2*(1-recover);}break;
  case 'plunge':lift=before?Math.sin(progress*Math.PI)*48:0;scaleY=before?1:.91+.09*recover;frame=before?(progress<.5?1:2):recover<.35?3:4;break;
  case 'parry':action='backhand';frame=m.reactionAt===null?1:now-m.reactionAt<.09?3:4;gearTurn=m.reactionAt===null?.35:-.2;offset=m.reactionAt===null?-3:6*(1-clamp((now-m.reactionAt)/.3));break;
  case 'echo':if(t<times[0]){action='dash';frame=2;}else if(index===0){action='backhand';frame=4;}else{action='idle';frame=0;}offset=-4*(1-clamp(t/m.duration));break;
  case 'triple':offset=(index+1)*3*(before?.4:1-recover);break;
  case 'seeking':if(before){frame=2;gearTurn=.2;}offset=before?0:5*(1-recover);break;
  case 'returning':if(t>times[0]+.17&&t<times[1]-.08){action='idle';frame=1;}gearTurn=index===0?.3:-.3;break;
  case 'field':if(index>0){action='idle';frame=index%2;}else if(!before){frame=4;scaleY=.94;}break;
  case 'breach':if(before)frame=1;else frame=recover<.4?3:4;offset=before?-3:12*(1-recover);scaleY=before?1:.94+.06*recover;break;
  case 'gather':gearTurn=lerp(.45,-.45,t/m.duration);offset=before?3:-5*(1-recover);break;
  case 'stance':action='idle';frame=progress<.5?0:1;scaleY=.98+.02*Math.sin(t*8);gearTurn=-.1;break;
  case 'mark':gearTurn=before?.6:-.15;offset=Math.sin(t/m.duration*Math.PI)*3;break;
  case 'bloodblade':if(before){action='finisher';frame=1;}gearTurn=before?-.3:.1;break;
  case 'bloodmoon':heading=index===6?m.heading:(m.heading+index)%8;offset=index===6?10*(1-recover):Math.sin(t*24)*4;lift=index===6?0:Math.sin(t*28)**2*4;break;
  case 'eclipse':if(before){action='finisher';frame=1;gearTurn=-.18;scaleY=.97;}else{action='dash';frame=recover<.5?2:3;offset=16*(1-recover);gearTurn=.4;}break;
  case 'phantoms':heading=(m.heading+(t<times[0]?0:1))%8;gearTurn=Math.sin(t/m.duration*Math.PI)*.4;lift=Math.sin(t/m.duration*Math.PI)*3;break;
 }
 return {skillId:m.id,action,frame,heading,lift,offsetX:m.n.x*offset,offsetY:m.n.y*offset,scaleY,gearTurn,index,contact:Math.abs(t-impact)<.035};
}
export function skillActorPose(s,a=s.player){
 const m=s.skillRuntime?.motion;if(!m||['hurt','death','dash'].includes(a.action))return null;
 if(['attack','heavy'].includes(a.action)&&(!a.swing?.skillVisualOnly||a.swing.skillId!==m.id))return null;
 if(a.action==='walk'&&a.moving)return null; // 0.142: walking during the rest of a skill shows the walk, not a frozen pose
 return sampleSkillMotion(m,s.run.time);
}
export function skillGhosts(s){
 const r=s.skillRuntime,p=s.player,now=s.run.time,m=r?.motion,result=[];
 if(['hurt','death','dash'].includes(p.action))return result;
 if(m){const t=now-m.startedAt,pose=sampleSkillMotion(m,now);if(pose){
  if(m.id==='gale'&&t<.32)for(let i=1;i<=3;i++)result.push({x:p.x-m.n.x*i*25,y:p.y-m.n.y*i*25,alpha:.2-i*.035,pose:{...pose,action:'dash',frame:Math.min(3,i)},equipmentAtStart:m.equipmentAtStart});
  if(m.id==='echo'&&t<m.duration)result.push({x:m.originX,y:m.originY,alpha:.4,pose:{...pose,action:t<m.impactTimes[1]?'backhand':'forehand',frame:t<m.impactTimes[1]?2:3,lift:0,offsetX:0,offsetY:0},equipmentAtStart:m.equipmentAtStart});
  if(m.id==='bloodmoon'&&t<m.duration-.15)for(let i=1;i<=2;i++)result.push({x:p.x+m.n.y*i*22,y:p.y-m.n.x*i*22,alpha:.17,pose:{...pose,heading:(pose.heading+8-i)%8},equipmentAtStart:m.equipmentAtStart});
 }}
 if(r?.phantomUntil>now){const attacking=['attack','heavy'].includes(p.action)&&!p.swing?.skillVisualOnly,action=attacking?swingMotion(p):'idle',frame=attacking?attackFrame(p.actionTime,p.swing.impact,p.swing.duration,6):0;
  for(const sign of [-1,1])result.push({x:p.x+sign*48,y:p.y-16,alpha:attacking?.38:.17,pose:{skillId:'phantoms',action,frame,heading:directionIndex(p.lookX,p.lookY),lift:0,offsetX:0,offsetY:0,scaleY:1,gearTurn:0},equipmentAtStart:attacking?p.swing.equipmentAtStart:null});
 }
 return result.slice(0,4);
}
