import {createSkillMotion} from './skill-motion.js?v=0.143.4';
import {CHAPTERS,CHAPTER_BOSSES} from './chapters.js?v=0.143.4';
import {beastTechniques,BEAST_GRADES,BEAST_ELEMENTS,BEAST_GRADE_CHANCE,beastElementText} from './beast-techniques.js?v=0.143.4';
export {BEAST_GRADES,BEAST_ELEMENTS,BEAST_GRADE_CHANCE} from './beast-techniques.js?v=0.143.4';
import {SKILL_BRANCHES,SKILL_BRANCH_COST,SKILL_BRANCH_COSTS,SKILL_BRANCH_TIER_LEVEL,EXECUTE_HEALTH,branchSummary} from './skill-branches.js?v=0.143.4';
export {SKILL_BRANCHES,SKILL_BRANCH_COST,SKILL_BRANCH_COSTS,SKILL_BRANCH_TIER_LEVEL,EXECUTE_HEALTH,branchSummary} from './skill-branches.js?v=0.143.4';
import {GEAR_SKILLS} from './raid-skills.js?v=0.143.4';
import {treeBonus} from './growth.js?v=0.143.4';
import {transcendBonus} from './transcendence.js?v=0.143.4';
export {GEAR_SKILLS,GEAR_SKILL_BY_ANCIENT} from './raid-skills.js?v=0.143.4';
// Lirian skill rules: one catalog drives unlocks, rank values, UI and combat.
const active=(id,name,unlock,damage,step,cost,cooldown,shape,description,extra={})=>({id,name,kind:'active',unlock,damage,step,cost,cooldown,shape,description,...extra});
const passive=(id,name,unlock,value,step,unit,description)=>({id,name,kind:'passive',unlock,value,step,unit,description});
const ultimate=(id,name,unlock,damage,step,shape,description,extra={})=>({id,name,kind:'ultimate',unlock,damage,step,cost:0,cooldown:60,shape,description,...extra});
export const SKILL_CATALOG=Object.freeze([...[
 active('crescent','월아참',1,140,20,18,6,'line','사거리 300의 관통 검기. 적마다 한 번 명중.',{range:300,width:60,delay:.12}),
 active('gale','질풍참',5,110,15,20,7,'dash','전방 170만큼 돌진하며 경로를 벤다. 무적 없음.',{range:260,width:65,delay:.15}),
 active('dance','윤무',10,180,20,28,8,'circle','1.2초 동안 주변 175 범위를 4회 벤다. 사용 중 이동 속도 70%.',{range:175,hits:4,interval:.3,delay:.1}),
 active('draw','발도',25,220,30,25,10,'cone','0.45초 준비 후 전방 240 범위에 일격. 회피·피격으로 취소 가능.',{range:240,dot:.65,delay:.45,poise:40}),
 active('plunge','낙월',35,180,25,25,9,'targetArea','전방으로 도약해 반경 150을 내려친다. 중심부 경직 누적 50% 증가.',{range:260,radius:150,delay:.35,poise:40}),
 active('parry','흘려베기',15,220,30,12,9,'parry','0.25초 동안 정면의 괴수 공격·투사체 한 번을 무효화하고 반격. 폭발은 방어 불가.',{range:220,delay:0,poise:65}),
 active('echo','잔영참',30,180,25,22,8,'echo','뒤로 95만큼 물러나며 전방을 베고, 0.4초 뒤 출발 지점의 잔상이 다시 벤다. 무적 없음.',{range:210,delay:.1,hits:2,interval:.4}),
 active('triple','연월참',7,210,25,24,7,'cone','전방 185 범위를 3회 베기. 마지막 타격은 전체 피해의 50%.',{range:185,dot:.55,hits:3,interval:.18,delay:.1}),
 active('seeking','추적 검기',4,120,15,16,5,'seeking','사거리 460 안의 조준 대상에게 추적 검기를 보낸다. 대상이 죽으면 소멸.',{range:460,delay:.28}),
 active('returning','회귀월',12,170,20,20,7,'returning','전방 320의 검기를 던지고 0.6초 뒤 같은 경로로 회수. 왕복 각각 한 번 명중.',{range:320,width:70,hits:2,interval:.6,delay:.15}),
 active('field','잔월진',18,240,30,30,12,'field','조준 지점 반경 150에 3초간 검기 영역을 남겨 6회 공격. 적이 벗어나면 빗나감.',{range:280,radius:150,hits:6,interval:.5,delay:.2}),
 active('breach','파갑참',22,150,20,24,10,'cone','전방 180을 강타해 중갑의 방어를 단번에 부수고 주변 260의 장갑을 8초 동안 벗긴다. 5초 동안 받는 직접 검술 피해 증가, 약화는 중첩 불가.',{range:180,dot:.6,delay:.28,poise:55}),
 active('gather','월쇄',16,120,15,22,9,'gather','주변 240의 일반 괴수를 모아 벤다. 정예·보스는 이동시키지 않음.',{range:240,delay:.2,poise:20}),
 active('stance','수월의 자세',9,0,0,0,14,'stance','3초 동안 기력을 추가 회복하고 받는 피해를 줄인다. 공격·스킬을 사용하면 종료.',{range:0,delay:0}),
 active('mark','월영 표식',28,180,25,18,10,'mark','사거리 380 안 대상에게 8초 표식. 직접 타격 5회 후 추가 일격. 중첩 불가.',{range:380,delay:0}),
 active('bloodblade','혈월의 칼날',32,0,0,20,14,'bloodblade','6초 동안 기본 연격 피해 증가. 다른 액티브·궁극기를 사용하면 종료.',{range:0,delay:0}),
 passive('opening','찰나의 틈',18,15,5,'%','완벽 회피 후 3초 안에 쓰는 다음 발도의 준비 시간 감소.'),
 passive('flow','검무의 흐름',23,3,1,'기력','서로 다른 일반 액티브를 4초 안에 연계하면 기력 회복. 발동 간격 6초.'),
 passive('finisher','마지막 검끝',3,15,5,'%','장착하면 연격이 장갑을 무시하고 마지막 타격이 중갑 방어를 62 더 깎는다. 마지막 타격 적중 후 3초 안에 쓰는 다음 액티브의 경직 누적 증가.'),
 passive('footwork','사냥꾼의 발걸음',13,10,2,'%','완벽 회피 후 2초간 이동 속도 증가. 중첩 없이 갱신.'),
 passive('pursuit','잔상 추격',28,20,5,'%','질풍참·잔영참 후 3초 안의 다음 기본 공격에 공격력 비례 추가 피해와 짧은 전진.'),
 passive('imbalance','무너진 균형',40,10,3,'%','경직·노출 상태의 적에게 주는 직접 검술 스킬 피해 증가.'),
 passive('breath','절제된 호흡',3,15,5,'%','공격·스킬 없이 1.5초 이동하면 기본 기력 재생 속도 증가. 멈추거나 공격하면 해제.'),
 passive('resolve','적월의 결의',45,180,-15,'초','치명적인 피해를 체력 1로 버티고 0.6초 보호. 수치는 재발동 대기 시간.'),
 passive('lone','고독한 사냥',11,10,3,'%','주변 400 안에 적이 한 명일 때 직접 검술 스킬 피해 증가.'),
 passive('surrounded','포위 돌파',14,20,5,'%','주변 240 안에 적이 3명 이상이면 윤무·월쇄 경직 누적 증가.'),
 passive('scar','깊은 검흔',24,30,10,'%','연격 마지막 타격이 5초 검흔을 남긴다. 발도 적중 시 소비하여 공격력 비례 추가 피해.'),
 passive('recovery','회수의 궤적',17,3,1,'기력','회귀월의 돌아오는 검기가 적중하면 기력 회복. 한 번의 시전당 한 번.'),
 passive('steady','흔들리지 않는 검',27,20,5,'%','준비 중 이동하지 않은 발도의 경직 누적 증가.'),
 passive('resonance','월영 공명',33,20,10,'%','잔영참의 잔상·월영군무가 표식 타격에 기여하고 표식 폭발 피해 증가. 추가 피해는 재발동하지 않음.'),
 passive('momentum','사냥의 여세',19,.3,.1,'초','적 처치 시 일반 스킬의 남은 대기 시간 감소. 발동 간격 1초.'),
 passive('reserve','남겨둔 여력',6,8,2,'%','기력 40 이상일 때 받는 피해 감소.'),
 ultimate('bloodmoon','적월난무',20,520,80,'ultimateArea','주변 260을 6회 베고 마지막에 검기를 방출. 재사용 60초.',{range:260,hits:7,interval:.16,delay:.1}),
 ultimate('eclipse','일섬·월식',30,600,90,'line','0.65초 준비 후 길이 560의 좁은 직선에 강한 일격. 재사용 60초.',{range:560,width:55,delay:.65,poise:80}),
 ultimate('phantoms','월영군무',40,240,40,'phantoms','8초 동안 기본 공격에 잔상이 최대 8회 동행. 표의 피해는 8회 모두 적중한 합계. 재사용 60초.',{range:180,delay:0}),
].map(row=>Object.freeze({...row,icon:'assets/skills/'+row.id+'.webp'})),
 // Alpha 0.125: one 괴수 기술 per chapter boss (beast-techniques.js), equipped in its own slot.
 ...beastTechniques(CHAPTERS.map(c=>({...c,special:!!CHAPTER_BOSSES[c.bossSpecies]?.special})))]);
export const BEAST_TECHNIQUES=Object.freeze(SKILL_CATALOG.filter(d=>d.kind==='beast'));
// Alpha 0.127 장비 기술 (kind 'gear') are looked up like skills but stay out of SKILL_CATALOG: no card, slot or rank.
export const SKILL_BY_ID=Object.freeze(Object.assign(Object.create(null),Object.fromEntries([...SKILL_CATALOG,...GEAR_SKILLS].map(r=>[r.id,r]))));
const AREA_SHAPES=new Set(['line','dash','circle','cone','targetArea','echo','returning','field','gather','ultimateArea']);
const RADIAL_REACH=new Set(['circle','cone','echo','gather','ultimateArea']);
// Levels widen area attacks, while targeting distance and dash travel stay fixed.
// The 괴수 기술 grade (0.125) and the chosen 갈래 (0.126) widen areas on top of the level bonus.
const NO_BRANCH=Object.freeze({});
// Alpha 0.137 (사용자 요청 '범위도 좀 늘리고'): every area skill reaches SKILL_AREA_BOOST further, on top of level/grade/branch/tree.
export const SKILL_AREA_BOOST=1.2;
export function skillAreaScale(p,id){const d=SKILL_BY_ID[id];return AREA_SHAPES.has(d?.shape)?SKILL_AREA_BOOST*(1+Math.min(4,Math.floor(int(p.level,1,50)/10))*.1)*(d.kind==='beast'?BEAST_GRADES[beastGrade(p,id)]?.area??1:1)*(branchMods(p,id).area??1)*(d.kind==='gear'?1:1+treeBonus(p).skillArea):1;}
export function skillReach(p,id){const d=SKILL_BY_ID[id];return d?d.range*(RADIAL_REACH.has(d.shape)?skillAreaScale(p,id):1):0;}
// Alpha 0.126 스킬 갈래 → 0.142 단계 갈래: `branchOwned[id]` is a bit mask (bit tier×3+option) of bought branches and
// `branchPick[id]` an array with the option in use per tier (null = none). Tier t counts only while the skill is at least
// Lv.(t+1)×5, so a reset skill keeps its branches but loses their effect until it is raised again. The tier argument comes last
// and defaults to the first tier, so 0.126 calls (ownsBranch(p,id,i) …) keep their meaning.
export const branchTierLevel=t=>(t+1)*SKILL_BRANCH_TIER_LEVEL;
export const branchTierCount=id=>SKILL_BRANCHES[id]?.length??0;
export const ownsBranch=(p,id,i,t=0)=>!!((p?.skillBook?.branchOwned?.[id]??0)&(1<<(t*3+i)));
export function skillBranchIndex(p,id,t=0){const raw=p?.skillBook?.branchPick?.[id],i=Array.isArray(raw)?raw[t]:t===0?raw:null;return Number.isInteger(i)&&i>=0&&i<3&&SKILL_BRANCHES[id]?.[t]?.[i]&&ownsBranch(p,id,i,t)?i:-1;}
export function skillBranch(p,id,t=0){const i=skillBranchIndex(p,id,t);return i<0?null:SKILL_BRANCHES[id][t][i];}
// Branches in effect: the pick of every tier the skill's level has reached.
export function activeBranches(p,id){const out=[],n=branchTierCount(id);if(!n)return out;const rank=skillRank(p,id);for(let t=0;t<n;t++){if(rank<branchTierLevel(t))break;const b=skillBranch(p,id,t);if(b)out.push(b);}return out;}
const MULTIPLY=['damage','cooldown','area','duration','value'],ADD=['cost','hits','boss','execute','power'];
export function combineBranchMods(list){
 if(!list.length)return NO_BRANCH;if(list.length===1)return list[0].mods;const out={};
 for(const {mods} of list){for(const k of MULTIPLY)if(mods[k]!==undefined)out[k]=(out[k]??1)*mods[k];for(const k of ADD)if(mods[k]!==undefined)out[k]=(out[k]??0)+mods[k];
  if(mods.markHits)out.markHits=Math.min(out.markHits??99,mods.markHits);if(mods.element)out.element=mergeElements(out.element,mods.element);
  if(mods.stat){out.stat={...(out.stat??{})};for(const [k,v] of Object.entries(mods.stat))out.stat[k]=(out.stat[k]??0)+v;}}
 return out;
}
export function branchMods(p,id){return SKILL_BRANCHES[id]?combineBranchMods(activeBranches(p,id)):NO_BRANCH;}
export function skillCost(p,id){const d=SKILL_BY_ID[id];return d?Math.max(0,d.cost+(branchMods(p,id).cost??0)):0;}
export function skillCooldown(p,id){const d=SKILL_BY_ID[id];return d?d.cooldown*(d.kind==='beast'?BEAST_GRADES[beastGrade(p,id)]?.cooldown??1:1)*(branchMods(p,id).cooldown??1)*(d.kind==='gear'?1:1-treeBonus(p).skillCooldown):0;}
export const branchCost=t=>SKILL_BRANCH_COSTS[Math.max(0,Math.min(SKILL_BRANCH_COSTS.length-1,t))];
export function branchStatus(p,id,i,t=0){const c=branchCost(t);if(!SKILL_BRANCHES[id]?.[t]?.[i])return '갈래 없음';if(ownsBranch(p,id,i,t))return '보유 중';const rank=skillRank(p,id);if(!rank)return '스킬 미습득';if(rank<branchTierLevel(t))return '스킬 Lv.'+branchTierLevel(t)+' 필요';if((p.materials?.skillPage??0)<c.pages)return '검술서 부족';if(p.gold<c.gold)return '골드 부족';return '';}
function pickList(p,id){const raw=p.skillBook.branchPick[id],n=branchTierCount(id),list=Array.from({length:n},(_,t)=>Array.isArray(raw)?raw[t]??null:t===0&&Number.isInteger(raw)?raw:null);p.skillBook.branchPick[id]=list;return list;}
export function unlockSkillBranch(s,id,i,t=0){const p=s.profile;if(s.phase!=='camp'||branchStatus(p,id,i,t))return false;const c=branchCost(t);p.gold-=c.gold;p.materials.skillPage-=c.pages;p.skillBook.branchOwned[id]=(p.skillBook.branchOwned[id]??0)|(1<<(t*3+i));pickList(p,id)[t]=i;return true;}
// Switching between owned branches of a tier is free in camp; choosing the branch in use again turns that tier off.
export function chooseSkillBranch(s,id,i,t=0){const p=s.profile;if(s.phase!=='camp'||!SKILL_BRANCHES[id]?.[t]||!ownsBranch(p,id,i,t))return false;const list=pickList(p,id);list[t]=skillBranchIndex(p,id,t)===i?null:i;if(list.every(v=>v===null))delete p.skillBook.branchPick[id];return true;}
// Restore: owned bits only for existing branches; picks per tier only when owned. A 0.126 save (pick = 0|1) becomes tier 1.
function cleanBranches(raw){const owned={},pick={};for(const [id,rows] of Object.entries(SKILL_BRANCHES)){let valid=0;rows.forEach((row,t)=>row.forEach((_,i)=>{valid|=1<<(t*3+i);}));const v=raw?.branchOwned?.[id],m=Number.isInteger(v)&&v>0?v&valid:0;if(m)owned[id]=m;
 const r=raw?.branchPick?.[id],list=rows.map((row,t)=>{const i=Array.isArray(r)?r[t]:t===0?r:null;return Number.isInteger(i)&&i>=0&&i<row.length&&m&(1<<(t*3+i))?i:null;});if(list.some(v=>v!==null))pick[id]=list;}
 return {branchOwned:owned,branchPick:pick};}
// Passive branches: the passive's number × value (적월의 결의 divides: its number is a wait time) and stats while equipped.
export function passiveValueScale(p,id){const v=branchMods(p,id).value??1;return id==='resolve'?1/v:v;}
export function passiveBranchStats(p){const out={damagePct:0,hpPct:0,attackSpeed:0,speed:0,crit:0,reduction:0,regeneration:0};for(const id of p?.skillBook?.loadout?.passive??[])if(id)for(const [k,v] of Object.entries(branchMods(p,id).stat??{}))out[k]+=v;return out;}
const cleanAuto=raw=>({mode:['balanced','boss','farm','safe'].includes(raw?.mode)?raw.mode:'balanced',ultimate:['elite','any','off'].includes(raw?.ultimate)?raw.ultimate:'elite'});
const int=(n,min,max,fallback=min)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback;
export const SKILL_SLOT_UNLOCKS=Object.freeze([
 {kind:'active',index:1,level:5,label:'일반 슬롯 2'},
 {kind:'passive',index:1,level:10,label:'패시브 슬롯 2'},
 {kind:'active',index:2,level:15,label:'일반 슬롯 3'},
 {kind:'ultimate',index:0,level:20,label:'궁극기 슬롯'},
 {kind:'passive',index:2,level:25,label:'패시브 슬롯 3'},
 {kind:'active',index:3,level:30,label:'일반 슬롯 4'},
].map(Object.freeze));
// Alpha 0.119: four regular slots (Lv.1/5/15/30), three passives (Lv.1/10/25), one ultimate (Lv.20).
export const MAX_SLOTS=Object.freeze({active:4,passive:3,ultimate:1,beast:1});
export const skillSlots=level=>{const slots={active:1,passive:1,ultimate:0,beast:1};for(const row of SKILL_SLOT_UNLOCKS)if(level>=row.level)slots[row.kind]++;return slots;};
// A read-only level interval; viewing progress never equips or spends points.
export function skillMilestones(afterLevel,throughLevel=50){
 const rows=SKILL_CATALOG.filter(d=>d.unlock>afterLevel&&d.unlock<=throughLevel).map(d=>({level:d.unlock,label:d.name,id:d.id,kind:d.kind}));
 for(const row of SKILL_SLOT_UNLOCKS)if(row.level>afterLevel&&row.level<=throughLevel)rows.push({...row,kind:'slot'});
 if(afterLevel<50&&throughLevel>=50)rows.push({level:50,label:'적월난무 각성',kind:'awakening'});
 return rows.sort((a,b)=>a.level-b.level);
}
// Alpha 0.142 (사용자 요청 '스킬 최대 15, 궁극기 20'): ranks 1~5 keep their old level gates; later ranks spread to about
// Lv.150 (active·passive) or one rank per 10 levels (ultimate, Lv.20 at 198). Above rank 5 each rank adds half the old step
// (powerRank), so rank 15 adds 9 steps over rank 1 instead of 14.
export const MAX_SKILL_RANK=15,MAX_ULTIMATE_RANK=20;
export const maxSkillRank=id=>SKILL_BY_ID[id]?.kind==='ultimate'?MAX_ULTIMATE_RANK:SKILL_BY_ID[id]?.kind==='beast'?3:MAX_SKILL_RANK;
export const powerRank=rank=>rank<=5?rank:5+(rank-5)*.5;
export function skillLevelGate(id,rank){const d=SKILL_BY_ID[id];if(!d)return 201;if(d.kind==='beast')return 1;const r=Math.max(1,Math.min(maxSkillRank(id),rank)),gate5=d.unlock+Math.ceil(4*Math.min(d.kind==='ultimate'?7:3,(50-d.unlock)/4));if(r<=5)return d.unlock+Math.ceil((r-1)*Math.min(d.kind==='ultimate'?7:3,(50-d.unlock)/4));return d.kind==='ultimate'?gate5+(r-5)*10:gate5+Math.ceil((r-5)*Math.max(0,150-gate5)/10);}
// A 괴수 기술's rank is its learned grade (1 기본, 2 강화, 3 극); 0 until its boss is defeated.
export const beastGrade=(profile,id)=>{const g=profile?.beastSkills?.[id];return Number.isInteger(g)&&g>=1&&g<=3?g:0;};
export function skillRank(profile,id){const d=SKILL_BY_ID[id];if(!d)return 0;if(d.kind==='gear')return 1;if(d.kind==='beast')return beastGrade(profile,id);if(profile.level<d.unlock)return 0;if(d.kind==='ultimate')return Math.min(MAX_ULTIMATE_RANK,1+(profile.skillBook?.ranks?.[id]??0));return 1+(profile.skillBook?.ranks?.[id]??0);}
export function skillValue(profile,id){const d=SKILL_BY_ID[id],rank=skillRank(profile,id);if(d?.kind==='beast')return rank?Math.round(d.damage*BEAST_GRADES[rank].damage):0;return rank?(d.damage??d.value)+d.step*(powerRank(rank)-1):0;}
// Alpha 0.142: 검술서 연구가 없어지고 그 몫(최대 49)은 레벨 4마다 1점으로 들어온다.
export const skillPointsTotal=level=>Math.max(0,level-1)+Math.floor(Math.max(0,level-1)/4);
export function skillPoints(profile){return Math.max(0,skillPointsTotal(profile.level)-Object.values(profile.skillBook?.ranks??{}).reduce((a,b)=>a+b,0));}
function cleanLoadout(raw,level){const slots=skillSlots(level),used=new Set();const list=(kind,n)=>Array.from({length:n},(_,i)=>{const id=raw?.[kind]?.[i],d=SKILL_BY_ID[id];if(i>=slots[kind]||!d||d.kind!==kind||d.unlock>level||used.has(id))return null;used.add(id);return id;});return {active:list('active',MAX_SLOTS.active),passive:list('passive',MAX_SLOTS.passive),ultimate:list('ultimate',MAX_SLOTS.ultimate),beast:list('beast',MAX_SLOTS.beast)};}
export function restoreSkillBook(raw,level){
 const ranks={};let budget=skillPointsTotal(level);
 for(const d of SKILL_CATALOG){if(d.kind==='beast'||d.unlock>level)continue;let maximum=0;while(maximum<maxSkillRank(d.id)-1&&level>=skillLevelGate(d.id,maximum+2))maximum++;const n=int(raw?.ranks?.[d.id],0,maximum);ranks[d.id]=Math.min(n,budget);budget-=ranks[d.id];}
 const defaults={active:['crescent',level>=5?'gale':null,level>=15?'triple':null,level>=30?'returning':null],passive:[level>=3?'breath':null,level>=10?'finisher':null,level>=25?'reserve':null],ultimate:[level>=20?'bloodmoon':null],beast:[null]};
 return {ranks,...cleanBranches(raw),loadout:cleanLoadout(raw?.loadout??defaults,level),presets:Array.from({length:3},(_,i)=>raw?.presets?.[i]?{...cleanLoadout(raw.presets[i],level),auto:cleanAuto(raw.presets[i].auto)}:null),auto:cleanAuto(raw?.auto),awakening:raw?.awakening==='execution'?'execution':'area'};
}
export function upgradeSkill(s,id){const d=SKILL_BY_ID[id],p=s.profile;if(s.phase!=='camp'||!d||d.kind==='beast'||!skillRank(p,id)||skillRank(p,id)>=maxSkillRank(id)||!skillPoints(p)||p.level<skillLevelGate(id,skillRank(p,id)+1))return false;p.skillBook.ranks[id]=(p.skillBook.ranks[id]??0)+1;return true;}
export function equipSkill(s,id,slot){const p=s.profile,d=SKILL_BY_ID[id];if(s.phase!=='camp'||!d||!skillRank(p,id)||!Number.isInteger(slot)||slot<0||slot>=skillSlots(p.level)[d.kind])return false;const list=p.skillBook.loadout[d.kind],prior=list.indexOf(id);if(prior===slot){list[slot]=null;return true;}if(prior>=0)list[prior]=list[slot];list[slot]=id;return true;}
export function resetSkills(s){if(s.phase!=='camp')return false;s.profile.skillBook.ranks={};return true;}
export function skillPreset(s,index,action){if(s.phase!=='camp'||!Number.isInteger(index)||index<0||index>=3)return false;const b=s.profile.skillBook;if(action==='save'){b.presets[index]={...cleanLoadout(b.loadout,s.profile.level),auto:cleanAuto(b.auto)};return true;}if(action==='load'&&b.presets[index]){b.loadout=cleanLoadout(b.presets[index],s.profile.level);b.auto=cleanAuto(b.presets[index].auto);return true;}return false;}
export function skillNumbers(p,id,rank=skillRank(p,id)){const d=SKILL_BY_ID[id];if(!d)return '';const pr=d.kind==='beast'?rank:powerRank(Math.max(1,rank)),v=(d.damage??d.value)+d.step*(pr-1);if(d.kind==='passive'){const shown=d.unit==='초'&&Math.abs(v)<10?Math.round(v*10)/10:Math.round(v);return shown+(d.unit==='%'?'%':d.unit==='초'?'초':d.unit==='회'?'회':' 기력');}if(id==='stance')return '기력 +'+Math.round(9+pr*3)+'/초 · 피해 감소 '+Math.round(15+pr*3+(branchMods(p,id).power??0))+'%';if(id==='bloodblade')return '연격 피해 +'+Math.round(20+pr*5+(branchMods(p,id).power??0))+'%';if(id==='breach')return '피해 '+Math.round(v)+'% · 약화 '+Math.round(10+pr*2)+'%';if(d.kind==='beast'){const g=BEAST_GRADES[Math.max(1,Math.min(3,rank))],e=BEAST_ELEMENTS[d.element];return g.name+' · 총 피해 '+Math.round(d.damage*g.damage)+'%'+(g.area>1?' · 범위 +'+Math.round((g.area-1)*100)+'%':'')+(g.cooldown<1?' · 재사용 '+Math.round(d.cooldown*g.cooldown*10)/10+'초':'')+(g.hits?' · 타격 +'+g.hits:'')+' · '+beastElementText(scaleElement(e,g.element));}return '총 피해 '+Math.round(v)+'%';}
export function mergeElements(a,b){if(!a&&!b)return null;const out={...(a??{})};for(const [k,v] of Object.entries(b??{}))out[k]=k==='breach'||k==='shield'||k==='push'?Math.max(out[k]??0,v):(out[k]??0)+v;return out;}
export function scaleElement(e,f){const out={...e};for(const k of ['bleed','chill','push','breach','shield'])if(e[k])out[k]=k==='shield'?Math.round(e[k]*f*1000)/1000:Math.round(e[k]*f*10)/10;return out;}
export const SKILL_BUILD_EXAMPLES=Object.freeze([
 {name:'보스 폭딜',active:['breach','draw','mark','plunge'],passive:['lone','scar','steady'],ultimate:['eclipse']},
 {name:'자동 광역',active:['gather','dance','field','echo'],passive:['surrounded','momentum','flow'],ultimate:['bloodmoon']},
 {name:'자동 안정',active:['seeking','stance','parry','returning'],passive:['breath','reserve','resolve'],ultimate:['phantoms']},
 {name:'잔상 표식',active:['echo','mark','bloodblade','triple'],passive:['resonance','pursuit','flow'],ultimate:['phantoms']},
]);
export function applySkillExample(s,index){const example=SKILL_BUILD_EXAMPLES[index];if(s.phase!=='camp'||!example)return false;const clean=cleanLoadout(example,s.profile.level);if(!clean.active.some(Boolean))return false;s.profile.skillBook.loadout=clean;return true;}

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const unit=(x,y)=>{const n=Math.hypot(x,y);return n>.00001?{x:x/n,y:y/n}:{x:0,y:1};};
const live=e=>!e.dead;
const capStamina=(s,n)=>{s.player.stamina=Math.min(100,s.player.stamina+n);};
export function createSkillRuntime(){return {ultimatePresentation:null,motion:null,travel:null,fxReady:{},cooldowns:{},cooldownKeys:[],jobs:[],serial:0,token:0,casting:null,lastCast:null,flowReady:0,killReady:0,resolveReady:0,openingUntil:0,footworkUntil:0,finisherUntil:0,pursuitUntil:0,breathTime:0,stanceUntil:0,bloodbladeUntil:0,phantomUntil:0,phantomHits:0,phantomDamage:0,parryUntil:0,parryCast:null};}
const pv=(s,id)=>s.profile.skillBook.loadout.passive.includes(id)?skillValue(s.profile,id)*passiveValueScale(s.profile,id):0;
// Alpha 0.104 armor counters: 마지막 검끝 makes combo strikes ignore stage armor and adds finisher guard damage;
// 파갑참 shatters a fresh guard and strips armor around its target.
export const FINISHER_GUARD_BONUS=62;
export const BREACH_ARMOR={radius:260,seconds:8};
export const finisherGuardBonus=s=>pv(s,'finisher')?FINISHER_GUARD_BONUS:0;
export const breachGuardShatter=rank=>30+5*rank;
function passiveVisual(s,id,h,target=s.player){const r=s.skillRuntime;if(!h?.visual||!pv(s,id)||s.run.time<(r.fxReady[id]??-1))return;r.fxReady[id]=s.run.time+1.2;h.visual(s,'skillPassive',{skillId:id,x:target.x,y:target.y-130,radius:23},.65);}
export function interruptSkill(s){const r=s.skillRuntime;if(!r)return;r.token++;r.ultimatePresentation=null;r.motion=null;r.travel=null;r.casting=null;r.parryUntil=0;r.parryCast=null;r.breathTime=0;}
export function clearSkillStage(s){const r=s.skillRuntime;interruptSkill(s);r.jobs.length=0;r.stanceUntil=0;r.bloodbladeUntil=0;r.treeFuryUntil=0;r.phantomUntil=0;r.pursuitUntil=0;r.finisherUntil=0;r.openingUntil=0;r.footworkUntil=0;r.lastCast=null;}
export function skillMoveScale(s){const r=s.skillRuntime;return (r.footworkUntil>s.run.time?1+pv(s,'footwork')/100:1)*(r.casting?.id==='dance'?.7:1);}
function nearestTarget(s,n,range){let best=null,score=-Infinity;for(const e of s.enemies){if(!live(e))continue;const dx=e.x-s.player.x,dy=e.y-s.player.y,d=Math.hypot(dx,dy);if(d>range)continue;const facing=d>.001?(dx*n.x+dy*n.y)/d:1,v=facing*300-d;if(v>score){score=v;best=e;}}return best;}
// 0.142: a basic swing that has already struck can be cancelled into a skill, so skills still find their moment while the
// hunter keeps attacking through the rest of a skill (basic attacks are no longer blocked while a skill plays out).
export function skillReady(s,id){const d=SKILL_BY_ID[id],r=s.skillRuntime;return !!d&&s.phase==='playing'&&!s.paused&&s.run.flow==='combat'&&s.player.hp>0&&!!skillRank(s.profile,id)&&(d.kind==='gear'||s.profile.skillBook.loadout[d.kind]?.includes(id))&&!['heavy','dash','hurt','death'].includes(s.player.action)&&!(s.player.action==='attack'&&!s.player.attackHit)&&!r.casting&&!(r.cooldowns[id]>0)&&s.player.stamina>=skillCost(s.profile,id);}
export function castSkill(s,id,aim,h){
 if(!skillReady(s,id))return false;const gear=SKILL_BY_ID[id].kind==='gear'?h.gearSkills?.(s)?.find(g=>g.id===id):null;if(SKILL_BY_ID[id].kind==='gear'&&!gear)return false;const d=SKILL_BY_ID[id],r=s.skillRuntime,p=s.player,beast=d.kind==='beast'?BEAST_GRADES[skillRank(s.profile,id)]:null,br=branchMods(s.profile,id),vid=d.visual??id,reach=skillReach(s.profile,id),areaScale=skillAreaScale(s.profile,id),n=unit(Number.isFinite(aim?.x)?aim.x:p.aimX,Number.isFinite(aim?.y)?aim.y:p.aimY),target=s.enemies.find(e=>e.id===aim?.targetId&&live(e)&&distance(e,p)<=reach)??nearestTarget(s,n,reach),rank=skillRank(s.profile,id),now=s.run.time;
 if(['mark','seeking'].includes(d.shape)&&!target||r.jobs.length+(d.hits??1)>64)return false;
 const attack=h.stats(s.profile).damage,root={id,serial:++r.serial,rank:powerRank(rank),attack,areaScale,range:reach,radius:d.radius?d.radius*areaScale:undefined,width:d.width?d.width*areaScale:undefined,equipmentAtStart:h.capture?.(s)??null,inscriptions:h.inscriptions?.(s)??null,damage:skillValue(s.profile,id)/100*attack*(br.damage??1)*(gear?gear.power/100:1+treeBonus(s.profile).skillDamage+transcendBonus(s.profile).skillDamage),boss:br.boss??0,execute:(br.execute??0)+(d.execute??0),x:p.x,y:p.y,n,targetId:target?.id,token:r.token,recovered:false,poise:(d.poise??12)*(r.finisherUntil>now?1+pv(s,'finisher')/100:1),castX:p.x,castY:p.y,count:(d.hits??1)+(beast?.hits??0)+(br.hits??0),...(beast||gear?{sigColor:d.color}:{})};
 const element=mergeElements(beast?scaleElement(BEAST_ELEMENTS[d.element],beast.element):gear?d.element:null,br.element);if(element)root.element=element;
 p.stamina-=skillCost(s.profile,id);if(!Object.hasOwn(r.cooldowns,id))r.cooldownKeys.push(id);r.cooldowns[id]=skillCooldown(s.profile,id);h.cast?.(s,id);if(!gear&&treeBonus(s.profile).skillFury)r.treeFuryUntil=now+3;r.stanceUntil=0;if(id!=='bloodblade')r.bloodbladeUntil=0;
 if(d.kind==='ultimate'){r.ultimatePresentation={id,startedAt:now,token:r.token,x:p.x,y:p.y,nx:n.x,ny:n.y};}
 if(d.kind==='active'){
  if(r.lastCast&&r.lastCast.id!==id&&now-r.lastCast.time<=4&&now>=r.flowReady&&pv(s,'flow')){capStamina(s,pv(s,'flow'));passiveVisual(s,'flow',h);r.flowReady=now+6;}
  r.lastCast={id,time:now};
 }
 if(r.finisherUntil>now){passiveVisual(s,'finisher',h);r.finisherUntil=0;}
 let delay=d.delay??.12;
 if(id==='draw'&&r.openingUntil>now){delay*=1-pv(s,'opening')/100;passiveVisual(s,'opening',h);r.openingUntil=0;}
 const count=root.count,interval=d.interval??(count>1?.25:0),duration=delay+(count-1)*interval+.18,utility=['stance','bloodblade','mark','phantoms'].includes(id);
 // A 괴수 기술 borrows the motion, travel and effect art of the skill it is drawn like (`visual`).
 r.motion=createSkillMotion(vid,root,now,utility?.16:delay,count,interval,utility?.42:id==='parry'?.25:duration);
 if(root.element?.shield){h.shield?.(s,root.element.shield);}if(root.element?.heal){h.heal?.(s,root.element.heal);}
 if(vid==='gale'||vid==='echo'||vid==='plunge'){
  if(vid!=='plunge'&&d.kind!=='beast'&&d.kind!=='gear')r.pursuitUntil=now+3;
  const reach=vid==='echo'?-95:vid==='plunge'?Math.min(170,target?distance(p,target):170):170,end={x:p.x+n.x*reach,y:p.y+n.y*reach};h.clamp(end,s.bounds);
  r.travel={fromX:p.x,fromY:p.y,toX:end.x,toY:end.y,startedAt:now,duration:Math.max(.025,delay)};
  if(vid==='plunge'){root.x=end.x;root.y=end.y;}
 }

 if(id==='stance'){r.stanceUntil=now+3*(br.duration??1);h.visual(s,'skillCast',{skillId:id,x:p.x,y:p.y,radius:100},.5);return true;}
 if(id==='bloodblade'){r.bloodbladeUntil=now+6*(br.duration??1);h.visual(s,'skillCast',{skillId:id,x:p.x,y:p.y,radius:120},.5);return true;}
 if(id==='mark'){target.skillMark={root,count:0,need:br.markHits??5,expires:now+8};h.visual(s,'skillMark',{skillId:id,x:target.x,y:target.y,radius:45},.6);return true;}
 if(id==='phantoms'){r.phantomUntil=now+8*(br.duration??1);r.phantomHits=Math.round(8*(br.duration??1));r.phantomDamage=root.damage/8;h.visual(s,'skillCast',{skillId:id,x:p.x,y:p.y,radius:160},.6);return true;}
 if(id==='parry'){r.parryUntil=now+.25;r.parryCast=root;h.motion(s,n,.25,id);h.visual(s,'skillCast',{skillId:id,x:p.x,y:p.y,radius:110,n},.25);return true;}
 h.motion(s,n,vid==='dance'?.2:duration,vid);r.casting={id,until:now+duration};
 const center=d.shape==='field'?(target?{x:target.x,y:target.y}:{x:p.x+n.x*d.range,y:p.y+n.y*d.range}):{x:root.x,y:root.y};
 const interruptible=['draw','triple','dance','bloodmoon','eclipse'].includes(id);
 for(let i=0;i<count;i++)r.jobs.push({root,at:now+delay+i*interval,index:i,center,interruptible,rootToken:r.token});
 if(root.sigColor)h.visual(s,'ancientSig',{x:center.x,y:center.y,radius:root.radius??root.range,color:root.sigColor,rune:SKILL_CATALOG.indexOf(d)},.6);
 h.visual(s,'skillCast',{skillId:vid,x:center.x,y:center.y,radius:root.radius??root.range,areaScale,n,fromX:root.castX,fromY:root.castY,targetX:target?.x??center.x+n.x*d.range,targetY:target?.y??center.y+n.y*d.range,serial:root.serial,targetId:root.targetId},Math.max(.025,delay));return true;
}
function shapeHits(s,e,j,d){const root=j.root,p=s.player,n=root.n;let origin=j.center;
 let reach=root.range??d.range;if(root.id==='bloodmoon'&&s.profile.level>=50&&s.profile.skillBook.awakening==='area'&&j.index===6)reach*=1.4;
 if(d.shape==='circle'||d.shape==='ultimateArea')origin=p;
 const dx=e.x-origin.x,dy=e.y-origin.y,dist=Math.hypot(dx,dy),along=dx*n.x+dy*n.y,cross=Math.abs(dx*n.y-dy*n.x);
 if(d.shape==='seeking')return e.id===root.targetId;
 if(d.shape==='field'||d.shape==='targetArea')return dist<=(root.radius??d.radius??150);
 if(d.shape==='line'||d.shape==='returning'||d.shape==='dash')return along>=-25&&along<=reach&&cross<(root.width??d.width)+(e.boss?30:0);
 if(d.shape==='cone'||d.shape==='echo'||d.shape==='parry')return dist<=reach&&(dist<.01||along/dist>=(d.dot??.25));
 return dist<=reach;
}
function markHit(s,e,h,allow){const m=e.skillMark;if(!allow||!m||s.run.time>m.expires)return;if(++m.count<(m.need??5))return;e.skillMark=null;const boost=pv(s,'resonance');passiveVisual(s,'resonance',h,e);h.hit(s,e,m.root.damage*(1+boost/100),false,'proc',s.player);h.visual(s,'skillImpact',{skillId:'mark',x:e.x,y:e.y,radius:80},.3);}
function applyJob(s,j,h){const r=s.skillRuntime,root=j.root,d=SKILL_BY_ID[root.id],p=s.player;let count=0,living=0,crowd=0;
 for(const e of s.enemies)if(live(e)){const range=distance(e,p);if(range<400)living++;if(range<240)crowd++;}
 const boost=(living===1?pv(s,'lone'):0),surrounded=crowd>=3?pv(s,'surrounded'):0;
 let scale=1/(root.count??d.hits??1);
 if(root.id==='triple')scale=j.index===2?.5:.25;
 if(root.id==='echo')scale=j.index===0?(80+10*(root.rank-1))/(180+25*(root.rank-1)):(100+15*(root.rank-1))/(180+25*(root.rank-1));
 if(root.id==='bloodmoon')scale=j.index===6?(160+20*(root.rank-1))/(520+80*(root.rank-1)):(60+10*(root.rank-1))/(520+80*(root.rank-1));
 const targets=s.enemies.filter(e=>live(e)&&shapeHits(s,e,j,d));
 for(const e of targets){if(s.phase!=='playing')break;let extra=boost+(e.exposed>0||e.action==='stagger'?pv(s,'imbalance'):0)+(e.skillBreach?.until>s.run.time?e.skillBreach.value:0)+(root.boss&&(e.boss||e.elite)?root.boss:0)+(root.execute&&e.hp<e.maxHp*EXECUTE_HEALTH?root.execute:0),value=root.damage*scale*(1+extra/100);
  if(root.id==='draw'&&e.skillScarUntil>s.run.time){value+=root.attack*pv(s,'scar')/100;e.skillScarUntil=0;passiveVisual(s,'scar',h,e);}
  if(root.id==='bloodmoon'&&j.index===6&&s.profile.level>=50&&s.profile.skillBook.awakening==='execution'&&targets.length===1)value*=1.5;
  if(boost)passiveVisual(s,'lone',h);if(e.exposed>0||e.action==='stagger')passiveVisual(s,'imbalance',h,e);
  if(root.id==='breach'){if(e.guard>0)e.guard=Math.max(1,e.guard-breachGuardShatter(root.rank));if(e.plate)for(const o of s.enemies)if(live(o)&&o.plate&&distance(o,e)<=BREACH_ARMOR.radius)o.plateBrokenUntil=s.run.time+BREACH_ARMOR.seconds;}
  const result=h.hit(s,e,value,false,root.poise>=35?'heavy':'normal',d.shape==='circle'||d.shape==='ultimateArea'?p:j.center,false,null,{inscriptions:root.inscriptions??s.buildEffects,skill:d.visual??root.id});
  if(result==='miss')continue;count++;
  if(root.id==='breach'&&!e.dead)e.skillBreach={until:s.run.time+5,value:10+root.rank*2};
  if(root.element&&!e.dead){const el=root.element;h.status?.(s,e,el,root.attack);if(el.breach)e.skillBreach={until:s.run.time+5,value:Math.max(e.skillBreach?.until>s.run.time?e.skillBreach.value:0,el.breach)};}
  if(d.shape==='gather'&&!e.dead&&!e.boss&&!e.elite){e.x=p.x+(e.x-p.x)*.35;e.y=p.y+(e.y-p.y)*.35;h.clamp(e,s.bounds);}
  if(!e.dead){let poise=root.poise;if(root.id==='draw'&&distance(p,{x:root.castX,y:root.castY})<4){poise*=1+pv(s,'steady')/100;passiveVisual(s,'steady',h);}if(['dance','gather'].includes(root.id)){poise*=1+surrounded/100;if(surrounded)passiveVisual(s,'surrounded',h);}if(root.id==='plunge'&&distance(e,j.center)<70)poise*=1.5;
   e.skillPoise=(e.skillPoise??0)+poise;if(e.skillPoise>=100){e.skillPoise=0;e.exposed=Math.max(e.exposed??0,1.5);e.action='stagger';e.actionTime=0;h.visual(s,'guardBreak',{x:e.x,y:e.y},.5);}
   markHit(s,e,h,root.id!=='echo'||j.index===0||!!pv(s,'resonance'));
  }
 }
 if(count&&root.id==='returning'&&j.index===1&&!root.recovered){capStamina(s,pv(s,'recovery'));passiveVisual(s,'recovery',h);root.recovered=true;}
 let x=j.center.x,y=j.center.y;if(d.shape==='seeking'){const e=s.enemies.find(e=>e.id===root.targetId);if(e){x=e.x;y=e.y;}}else if(['circle','ultimateArea'].includes(d.shape)){x=p.x;y=p.y;}
 const visualReach=root.id==='bloodmoon'&&s.profile.level>=50&&s.profile.skillBook.awakening==='area'&&j.index===6?root.range*1.4:root.radius??root.range;
 h.visual(s,'skillImpact',{skillId:d.visual??root.id,x,y,radius:visualReach,areaScale:root.areaScale,n:root.n,index:j.index,fromX:root.castX,fromY:root.castY,targetX:x,targetY:y,serial:root.serial},.3);
}
export function tickSkills(s,dt,h){const r=s.skillRuntime,p=s.player,now=s.run.time;
 if(r.ultimatePresentation&&now-r.ultimatePresentation.startedAt>=1.35)r.ultimatePresentation=null;
 if(r.travel&&s.run.flow==='combat'){const v=r.travel,t=Math.max(0,Math.min(1,(now-v.startedAt)/v.duration));p.x=v.fromX+(v.toX-v.fromX)*t;p.y=v.fromY+(v.toY-v.fromY)*t;h.clamp(p,s.bounds);if(t>=1)r.travel=null;}
 if(r.motion&&now>=r.motion.startedAt+r.motion.duration&&!(r.motion.id==='parry'&&r.parryCast&&now<=r.parryUntil))r.motion=null;
 for(const id of r.cooldownKeys)r.cooldowns[id]=Math.max(0,r.cooldowns[id]-dt);
 if(r.casting&&now>=r.casting.until)r.casting=null;
 if(r.parryUntil&&now>r.parryUntil){r.parryUntil=0;r.parryCast=null;}
 if(s.run.flow!=='combat'){if(r.jobs.length)r.jobs=r.jobs.filter(j=>j.at>now);return;}
 if(r.stanceUntil>now)capStamina(s,(9+powerRank(skillRank(s.profile,'stance'))*3)*dt);
 // Compact first: a damage callback may finish a run; no deferred attack leaks to another stage.
 if(!r.jobs.length)return;const due=[],later=[];for(const j of r.jobs)(j.at<=now?due:later).push(j);r.jobs=later;
 for(const j of due){if(s.phase!=='playing'||s.run.flow!=='combat')break;if(j.interruptible&&j.rootToken!==r.token)continue;applyJob(s,j,h);}
}
export function afterSkillMovement(s,dt,moved,h){const r=s.skillRuntime,p=s.player;if(s.run.flow!=='combat')return;r.breathTime=moved>.0001&&!['attack','heavy','dash','hurt'].includes(p.action)&&!r.casting?r.breathTime+dt:0;if(r.breathTime>=1.5){capStamina(s,18*pv(s,'breath')/100*dt);passiveVisual(s,'breath',h);}}
export function skillPerfect(s,h){passiveVisual(s,'opening',h);passiveVisual(s,'footwork',h);const r=s.skillRuntime;r.openingUntil=s.run.time+3;r.footworkUntil=s.run.time+2;}
export function skillKill(s,h){const r=s.skillRuntime;if(!r||!pv(s,'momentum')||s.run.time<r.killReady)return;r.killReady=s.run.time+1;passiveVisual(s,'momentum',h);for(const id of r.cooldownKeys)if(SKILL_BY_ID[id]?.kind==='active')r.cooldowns[id]=Math.max(0,r.cooldowns[id]-pv(s,'momentum'));}
export function basicSkillBonus(s,swing){const r=s.skillRuntime;r.stanceUntil=0;let scale=1;if(!swing.heavy&&r.treeFuryUntil>s.run.time)scale+=treeBonus(s.profile).skillFury;if(!swing.heavy&&r.bloodbladeUntil>s.run.time)scale+=(20+powerRank(skillRank(s.profile,'bloodblade'))*5+(branchMods(s.profile,'bloodblade').power??0))/100;return scale;}
export function basicSkillContact(s,swing,targets,h){const r=s.skillRuntime,p=s.player;if(!targets.length)return;
 const pursuit=!swing.heavy&&r.pursuitUntil>s.run.time?pv(s,'pursuit'):0;if(pursuit){r.pursuitUntil=0;passiveVisual(s,'pursuit',h);}
 for(const e of targets){if(!live(e)||s.phase!=='playing')continue;markHit(s,e,h,true);if(p.combo===3&&!swing.heavy){r.finisherUntil=s.run.time+3;if(pv(s,'scar')){e.skillScarUntil=s.run.time+5;passiveVisual(s,'scar',h,e);}}if(pursuit&&live(e))h.hit(s,e,h.stats(s.profile).damage*pursuit/100,false,'proc',p);}
 if(!swing.heavy&&r.phantomUntil>s.run.time&&r.phantomHits>0){r.phantomHits--;for(const e of targets){if(s.phase!=='playing')break;if(live(e)){h.hit(s,e,r.phantomDamage,false,'proc',p);if(live(e)&&pv(s,'resonance'))markHit(s,e,h,true);}}h.visual(s,'skillImpact',{skillId:'phantoms',x:p.x,y:p.y,radius:180,n:{x:swing.x,y:swing.y}},.3);}
}
export function incomingSkillDamage(s,value,source,h){const r=s.skillRuntime,p=s.player,now=s.run.time;
 if(r.parryCast&&r.parryUntil>=now&&source){const n=unit(source.x-p.x,source.y-p.y);if(n.x*p.lookX+n.y*p.lookY>=.1){const root=r.parryCast;if(r.motion){r.motion.reactionAt=now;r.motion.duration=Math.max(r.motion.duration,now-r.motion.startedAt+.3);}r.parryCast=null;r.parryUntil=0;skillPerfect(s,h);applyJob(s,{root,index:0,center:{x:p.x,y:p.y}},h);h.visual(s,'perfectDodge',{x:p.x,y:p.y},.5);return 0;}}
 let reduction=p.stamina>=40?pv(s,'reserve'):0;if(reduction)passiveVisual(s,'reserve',h);if(r.stanceUntil>now)reduction+=15+powerRank(skillRank(s.profile,'stance'))*3+(branchMods(s.profile,'stance').power??0);return value*(1-Math.min(.7,reduction/100+h.stats(s.profile).reduction));
}
export function skillLastStand(s,h){const r=s.skillRuntime,cooldown=pv(s,'resolve');if(!cooldown||s.run.time<r.resolveReady)return false;r.resolveReady=s.run.time+cooldown;passiveVisual(s,'resolve',h);s.player.hp=1;s.player.invulnerable=.6;return true;}
// Worn raid ancients cast their 장비 기술 by themselves whenever one is ready and an enemy is in reach (Alpha 0.127).
export function gearSkill(s,n,h){const list=h.gearSkills?.(s);if(!list?.length)return false;
 for(const g of list){if(!skillReady(s,g.id))continue;const target=nearestTarget(s,n,skillReach(s.profile,g.id));if(target&&castSkill(s,g.id,{x:n.x,y:n.y,targetId:target.id},h))return true;}
 return false;
}
// Alpha 0.139 방어 태세: while a defense-rule boss guards (70% less damage), burst skills and the ultimate wait for the 4-second
// weak point unless they would be ready again before it opens (cooldown shorter than the guard left). 월영 표식 still goes early.
export const STANCE_BURST=Object.freeze(new Set(['draw','eclipse','plunge','bloodblade','echo','imbalance','triple','crescent']));
const holdForWeakPoint=(s,id,left)=>left>0&&skillCooldown(s.profile,id)>left;
export function autoSkill(s,n,h){const p=s.player,r=s.skillRuntime,b=s.profile.skillBook,near=s.enemies.filter(e=>live(e)&&distance(e,p)<240),boss=near.some(e=>e.boss||e.elite),stance=h.stanceLeft?.(s)??0;
 const ultimate=b.loadout.ultimate[0];if(ultimate&&b.auto.ultimate!=='off'&&(b.auto.ultimate==='any'||boss)&&!holdForWeakPoint(s,ultimate,stance)&&castSkill(s,ultimate,n,h))return true;
 // An equipped 파갑참 goes first whenever a guarded or still-armored enemy is within its reach.
 if(b.loadout.active.includes('breach')&&p.stamina>=skillCost(s.profile,'breach')+22){const reach=skillReach(s.profile,'breach'),shield=s.enemies.find(e=>live(e)&&(e.guard>0||e.plate>0&&!(e.plateBrokenUntil>s.run.time))&&distance(e,p)<=reach);if(shield&&castSkill(s,'breach',unit(shield.x-p.x,shield.y-p.y),h))return true;}
 // The 괴수 기술 goes whenever it is ready and something is in reach (it has its own slot and cooldown).
 {const id=b.loadout.beast?.[0],d=SKILL_BY_ID[id];if(d&&p.stamina>=d.cost+15){const reach=skillReach(s.profile,id),target=nearestTarget(s,n,reach);if(target&&castSkill(s,id,{x:n.x,y:n.y,targetId:target.id},h))return true;}}
 for(const id of b.loadout.active){const d=SKILL_BY_ID[id];if(!d)continue;
  if(id==='stance'){if(p.stamina>45&&p.hp/p.maxHp>.5)continue;}else if(p.stamina<skillCost(s.profile,id)+(b.auto.mode==='safe'?35:22))continue;
  const reach=skillReach(s.profile,id);
  if(id==='gather'){let crowd=0;for(const e of s.enemies)if(live(e)&&distance(e,p)<=reach&&++crowd>=3)break;if(crowd<3)continue;}
  if(id==='parry'&&!near.some(e=>e.action==='windup'&&e.windup-e.actionTime<.24))continue;
  if(id==='mark'&&!boss)continue;
  if(STANCE_BURST.has(id)&&holdForWeakPoint(s,id,stance))continue;
  const target=id==='mark'?s.enemies.find(e=>live(e)&&(e.boss||e.elite)&&distance(e,p)<=reach):nearestTarget(s,n,reach);if(reach&&!target)continue;if(id==='mark'&&target.skillMark?.expires>s.run.time)continue;
  if(['draw','eclipse'].includes(id)&&near.some(e=>e.action==='windup'))continue;
  if(r.stanceUntil>s.run.time&&(p.stamina<65||p.hp/p.maxHp<.5))continue;
  if(castSkill(s,id,target?{x:n.x,y:n.y,targetId:target.id}:n,h))return true;
 }
 return false;
}

