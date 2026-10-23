// Screen coordinates: east=0, southeast=1, south=2 ... northeast=7.
export const DIRECTION_NAMES=['e','se','s','sw','w','nw','n','ne'];
export const ACTION_DURATIONS=Object.freeze({dash:.18,hurt:.2,death:.64});
export const SKITTER_MOTION=Object.freeze({contact:.1,hurt:.28,death:.5,hold:.6,fade:.3});
export function skitterFrame(action,time,windup=.48){
  const t=Number.isFinite(time)?Math.max(0,time):0;
  if(action==='windup')return t<windup*.55?0:1;
  if(action==='attack')return t<SKITTER_MOTION.contact?2:3;
  if(action==='hurt')return t<SKITTER_MOTION.hurt/2?0:1;
  if(action==='death')return Math.min(3,Math.floor(t/SKITTER_MOTION.death*4));
  return 0;
}
export function skitterDeathAlpha(time){
  const t=Number.isFinite(time)?Math.max(0,time):0;
  return Math.max(0,Math.min(1,(SKITTER_MOTION.death+SKITTER_MOTION.hold+SKITTER_MOTION.fade-t)/SKITTER_MOTION.fade));
}
export function actionFrame(action,time,count){
  const size=Number.isFinite(count)?Math.max(1,Math.floor(count)):1,elapsed=Number.isFinite(time)?Math.max(0,time):0;
  return Math.min(size-1,Math.floor(elapsed/(ACTION_DURATIONS[action]??.1)*size));
}
export const DIRECTION_VIEWS=[
  {key:'e',mirror:1},{key:'se',mirror:1},{key:'s',mirror:1},{key:'se',mirror:-1},
  {key:'e',mirror:-1},{key:'ne',mirror:-1},{key:'n',mirror:1},{key:'ne',mirror:1},
];
export function directionIndex(x,y,previous=null){
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<.01)return Number.isInteger(previous)&&previous>=0&&previous<8?previous:2;
  const angle=Math.atan2(y,x),candidate=(Math.round(angle/(Math.PI/4))+8)%8;
  if(Number.isInteger(previous)&&previous>=0&&previous<8){const difference=Math.atan2(Math.sin(angle-previous*Math.PI/4),Math.cos(angle-previous*Math.PI/4));if(Math.abs(difference)<Math.PI/8+.12)return previous;}
  return candidate;
}
export function walkingFrame(distance,stride=76,count=4,backwards=false){
  const phase=Number.isFinite(distance)?Math.max(0,distance):0;
  const frame=Math.floor(phase/Math.max(1,stride)*count)%count;return backwards?(count-frame)%count:frame;
}
export function attackFrame(time,impact,duration,count=4){
  if(count===2)return time<impact?0:1;
  if(count===6){
    if(time<impact*.28)return 0;if(time<impact*.68)return 1;if(time<impact)return 2;
    const recovery=duration-impact;
    if(time<impact+Math.max(.025,recovery*.18))return 3;
    return time<impact+recovery*.62?4:5;
  }
  if(time<impact*.5)return 0;if(time<impact)return 1;
  const contactEnd=impact+Math.max(.04,(duration-impact)*.28);
  return time<contactEnd?2:Math.min(3,count-1);
}
export function swingMotion(actor){return actor.swing?.motion??(actor.swing?.heavy||actor.combo===3?'finisher':actor.combo===2?'backhand':'forehand');}
export function slashPresentation(time,swing,hit){
  if(!hit||time<swing.impact)return null;
  const duration=swing.motion==='finisher'?.22:swing.motion==='backhand'?.14:.12,t=(time-swing.impact)/duration;
  if(t>=1)return null;
  return{motion:swing.motion,t,frame:Math.min(5,Math.floor(t*6)),flipY:swing.motion==='backhand'?-1:1,angle:Math.atan2(swing.y,swing.x)+(swing.motion==='backhand'?-.15:.15)};
}
export function recoilProgress(actor,time){
  const age=time-actor.hitAt;
  return age>=0&&age<actor.hitDuration?Math.pow(1-age/actor.hitDuration,2):0;
}
export function actorHeading(actor){
  if(['attack','heavy'].includes(actor.action)&&actor.swing)return directionIndex(actor.swing.x,actor.swing.y);
  if(Number.isInteger(actor.heading)&&actor.heading>=0&&actor.heading<8)return actor.heading;
  return directionIndex(actor.lookX??actor.aimX??actor.guardX??1,actor.lookY??actor.aimY??actor.guardY??0);
}
export function directionalClipId(manifest,actor,action,heading){
  const view=DIRECTION_VIEWS[heading];return manifest.directions[actor][action][view.key];
}
export function runtimeClipIds(manifest){
  const ids=new Set(['fx_cleave_sequence']);
  for(const families of Object.values(manifest.directions))for(const directions of Object.values(families))for(const id of Object.values(directions))ids.add(id);
  return [...ids];
}
