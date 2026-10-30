// Alpha 0.127 장비 기술: each raid-only ancient (raids.js RAID_ANCIENTS) carries its own skill while it is worn.
// Equipment skills need no slot or stamina: they cast on their own cooldown during battle (automatic or manual skill
// mode alike) and their damage follows the item's effect power roll (`powerRoll`, 60~120%). Pure data; combat-skills.js
// adds them to SKILL_BY_ID as kind 'gear' (not to SKILL_CATALOG, so the skill screen and loadouts are unchanged).
import {SKILL_TEMPLATES,beastElementText} from './beast-techniques.js?v=0.148.0';
import {RAID_ANCIENTS,RAIDS} from './raids.js?v=0.148.0';
const ROWS={
 'colossus-weapon':['파쇄 강타','slam',420,9,{breach:15}],
 'colossus-helmet':['강철 포효','roar',160,14,{shield:.1}],
 'colossus-armor':['용광로 분출','zone',300,14,{bleed:4}],
 'colossus-charm':['용광로 심장','spin',260,12,{heal:.05}],
 'colossus-special':['거신의 발걸음','charge',300,10,{push:100}],
 'queen-weapon':['낫날 회오리','spin',330,8,{bleed:3}],
 'queen-helmet':['갑각 방벽','roar',140,14,{shield:.12}],
 'queen-armor':['산성 분사','breath',300,10,{breach:12}],
 'queen-charm':['군단 산란','volley',280,9,{extraHit:1}],
 'queen-special':['군단의 진','zone',320,14,{chill:1.5}],
 'judge-weapon':['광휘 일섬','boomerang',380,9,{execute:40}],
 'judge-helmet':['눈가린 판결','volley',220,12,{shield:.1}],
 'judge-armor':['성휘 방벽','spin',220,12,{shield:.08,heal:.03}],
 'judge-charm':['천칭의 빛','breath',300,11,{heal:.05}],
 'judge-special':['최종 판결','slam',420,12,{execute:50}],
 // Alpha 0.142 악몽 레이드 '악몽의 군주'.
 'sovereign-weapon':['악몽 참수','slam',460,9,{bleed:4}],
 'sovereign-helmet':['가시 왕관','roar',180,13,{shield:.1,bleed:2}],
 'sovereign-armor':['흑요 파열','zone',320,13,{bleed:3}],
 'sovereign-charm':['악몽의 시선','breath',320,10,{breach:10,bleed:2}],
 'sovereign-earring':['가시 비','volley',300,9,{extraHit:1,bleed:2}],
};
const COLOR=Object.fromEntries(RAIDS.map(r=>[r.id,r.color]));
export const GEAR_SKILLS=Object.freeze(RAID_ANCIENTS.map(a=>{
 const key=a.raid+'-'+a.slot,[name,template,damage,cooldown,extra]=ROWS[key],t=SKILL_TEMPLATES[template],{execute=0,extraHit=0,...element}=extra,hits=(t.hits??1)+extraHit,r=t.radius??t.range;
 return Object.freeze({id:'gear-'+key,name,kind:'gear',unlock:0,ancientId:a.id,itemName:a.name,raid:a.raid,template,damage,step:0,cost:0,cooldown,shape:t.shape,visual:t.visual,range:t.range,
  ...(t.radius?{radius:t.radius}:{}),...(t.width?{width:t.width}:{}),...(t.dot?{dot:t.dot}:{}),delay:t.delay,hits,...(hits>1?{interval:t.interval??.25}:{}),poise:t.poise,color:COLOR[a.raid],
  element:Object.freeze(element),execute,icon:'assets/skills/'+t.visual+'.webp',
  description:[t.text.replace('{r}',r).replace(/두 번|3회/,m=>extraHit?(m==='두 번'?'세 번':'4회'):m),[beastElementText(element),execute?'체력 35% 미만 적에게 피해 +'+execute+'%':''].filter(Boolean).join(' · ')].filter(Boolean).join(' ')+(element.heal||element.bleed||element.chill||element.push||element.breach||element.shield||execute?'.':'')});
}));
export const GEAR_SKILL_BY_ANCIENT=Object.freeze(Object.fromEntries(GEAR_SKILLS.map(d=>[d.ancientId,d])));
