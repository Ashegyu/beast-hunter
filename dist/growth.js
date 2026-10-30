// Alpha 0.139 캐릭터 성장: two separate point pools.
//  · 능력치 포인트 (one per level, Lv.200 → 199) go to 능력치 단련 (TRAINING): six stats shared by every build, no rank cap;
//    ranks past 20 and 60 count for less (trainingEffective) so one stat cannot run away.
//  · 트리 포인트 (one every two levels, Lv.200 → 99, plus one per claimed ★30 chest) go to the 성장 트리 web (TREE_NODES):
//    a node can be learned when it touches the 중심 or a learned node; the tree is saved with each build.
// Points are not stored: free points = earned − spent. Pure data and rules; game-engine.js and combat-skills.js read the bonuses.
export const EXECUTE_HEALTH=.35;
export const TRAINING=Object.freeze({
 power:Object.freeze({name:'공격 단련',unit:'기본 공격력',per:5,suffix:'%',icon:'⚔'}),
 vitality:Object.freeze({name:'체력 단련',unit:'최대 체력',per:12,suffix:'',icon:'♥'}),
 guard:Object.freeze({name:'방어 단련',unit:'피해 감소',per:1,suffix:'%p',icon:'◇'}),
 precision:Object.freeze({name:'치명 단련',unit:'치명타',per:.5,suffix:'%p',icon:'✦'}),
 // Alpha 0.147.0 (사용자 요청 '능력치에 치명타 데미지 증가'): 치명타 피해 (base ×160%) +2%p per rank.
 ferocity:Object.freeze({name:'치명 피해 단련',unit:'치명타 피해',per:2,suffix:'%p',icon:'✸'}),
 tempo:Object.freeze({name:'연격 단련',unit:'공격 속도',per:1,suffix:'%',icon:'»'}),
 stride:Object.freeze({name:'보법 단련',unit:'이동 속도',per:1,suffix:'%',icon:'➶'}),
});
export const TRAINING_IDS=Object.freeze(Object.keys(TRAINING));
// Ranks 1–20 count fully, 21–60 at 60%, beyond 60 at 30% (all 199 points in one stat count as 85.7 ranks).
export const TRAINING_STEPS=Object.freeze([Object.freeze({from:0,rate:1}),Object.freeze({from:20,rate:.6}),Object.freeze({from:60,rate:.3})]);
export function trainingEffective(rank){const r=Math.max(0,Number(rank)||0);let out=0;for(let i=0;i<TRAINING_STEPS.length;i++){const s=TRAINING_STEPS[i],end=TRAINING_STEPS[i+1]?.from??Infinity;if(r>s.from)out+=(Math.min(r,end)-s.from)*s.rate;}return Math.round(out*1000)/1000;}
// How much the next rank adds (1, .6 or .3).
export const trainingRate=rank=>TRAINING_STEPS.reduce((a,s)=>rank>=s.from?s.rate:a,1);
// Effective ranks of every stat, what playerStats multiplies by the per-rank values.
export function trainingRanks(p){const t=p?.training,out={};for(const id of TRAINING_IDS)out[id]=trainingEffective(t?.[id]);return out;}

// 성장 트리: one web around the 중심 and its ring, grown like branches (0.147.0, see ROWS); bridges and the southern 보법 join
// neighbouring regions. Nodes: small (2P), notable (6P), keystone (10P, 핵심, usually with a drawback).
// x/y are positions in a 600×240 box (the screen scales it); links are the nodes it touches, listed in a learnable order.
export const GROWTH_TREE=Object.freeze([
 Object.freeze({id:'blade',name:'검귀',text:'기본 공격 화력'}),
 Object.freeze({id:'ward',name:'수호자',text:'버티는 힘'}),
 Object.freeze({id:'art',name:'검술사',text:'스킬 운용'}),
]);
// Alpha 0.139 시뮬레이션: node values ×1.25 (0.5% steps) so that 빌드 전환 + 스펙업 clears chapter 60 while 스펙업 alone stalls at 51 (tools/reports/alpha0139-growth.txt).
export const TREE_BOX=Object.freeze({width:600,height:240});
// Even Lv.200 with every ★30 chest (99 + 60 = 159P) fills only about half the web (308P): the build is always a choice.
export const TREE_KIND_COST=Object.freeze({core:0,small:2,notable:6,keystone:10});
const BONUS_TEXT=Object.freeze({
 damagePct:['공격력','%',100],attackSpeed:['공격 속도','%',100],crit:['치명타','%p',100],critDamage:['치명타 피해','%p',100],execute:['체력 35% 미만 적에게 주는 피해','%',100],finisher:['3연격 마무리 피해','%',100],
 hpPct:['최대 체력','%',100],reduction:['피해 감소','%p',100],drain:['직접 검격 적중 시 최대 체력 회복','%',100],regeneration:['초당 체력 재생','',1],lowHpGuard:['체력 50% 미만일 때 받는 피해 감소','%',100],
 staminaRegen:['기력 재생','%',100],skillCooldown:['스킬 재사용 단축','%',100],skillArea:['스킬 범위','%',100],skillDamage:['스킬 피해','%',100],skillFury:['스킬 사용 뒤 3초 기본 공격 피해','%',100],
 speed:['이동 속도','%',100],range:['공격 범위','%',100],
});
const num=v=>String(Math.round(v*10)/10);
export function bonusText(bonus){return Object.entries(bonus).map(([k,v])=>{const [label,suffix,scale]=BONUS_TEXT[k];return label+' '+(v<0?'−':'+')+num(Math.abs(v)*scale)+suffix;}).join(' · ');}
// [id, kind, x, y, links, bonus, name, icon]; small nodes are named after their first bonus.
// Alpha 0.147.0 (사용자 요청 '가지를 더 다양하게, 대칭일 필요 없이 나뭇가지처럼'): the web is grown by tools/grow-tree0147.mjs
// (seeded random walk from the 중심 고리 along a branch plan, forks at uneven spreads, no crowding or crossing links) and
// pasted here. 검귀 (west) forks three ways (연격·마무리 / 칼끝·치명 피해 / 처형), 수호자 (north) three (철벽·불굴 / 맹세 /
// 재생·흡혈), 검술사 (east) three (재사용·범위 / 위력·연환 / 짧은 기력 가지), 보법 (south) two; two bridges join neighbours.
// Named nodes reuse the art/growth0139 emblems (8th field). Even Lv.200 with every ★30 chest (159P) fills under half of it.
// seed 2612: 88 nodes, 95 links, cost 326P
const ROWS=[
 ['core','core',300,128,[],{},'중심'],
 ['blade-r','small',270,128,['core'],{damagePct:.025},null],
 ['ward-r','small',300,103,['core','blade-r'],{hpPct:.025},null],
 ['art-r','small',330,128,['core','ward-r'],{staminaRegen:.05},null],
 ['ab-r','small',300,153,['core','blade-r','art-r'],{speed:.025},null],
 ['blade-1','small',243,136,['blade-r','ab-8'],{damagePct:.04},null],
 ['blade-2','notable',211,145,['blade-1'],{damagePct:.1},'날 선 검','blade-n'],
 ['blade-3','small',189,163,['blade-2'],{attackSpeed:.025},null],
 ['blade-4','small',163,176,['blade-3'],{attackSpeed:.025},null],
 ['blade-5','notable',134,190,['blade-4'],{attackSpeed:.075},'연격 가속','blade-a3'],
 ['blade-6','small',120,215,['blade-5'],{finisher:.125},null],
 ['blade-7','small',94,203,['blade-6'],{finisher:.125},null],
 ['blade-8','notable',77,174,['blade-7'],{finisher:.5},'혈월의 검','blade-a6'],
 ['blade-9','small',53,159,['blade-8'],{finisher:.125},null],
 ['blade-10','keystone',24,142,['blade-9'],{attackSpeed:.19,reduction:-.06},'광폭 연무','blade-a7'],
 ['blade-11','small',111,187,['blade-5'],{attackSpeed:.025},null],
 ['blade-12','small',100,160,['blade-11'],{crit:.01},null],
 ['blade-13','small',183,140,['blade-2'],{range:.025,damagePct:.02},null],
 ['blade-14','notable',150,132,['blade-13'],{range:.075,crit:.02},'칼끝 감각','ab-n'],
 ['blade-15','small',123,136,['blade-14'],{critDamage:.06},null],
 ['blade-16','small',100,137,['blade-15'],{critDamage:.06},null],
 ['blade-17','notable',66,130,['blade-16'],{critDamage:.2},'급소 일격','blade-m2'],
 ['blade-18','small',43,129,['blade-17'],{crit:.01},null],
 ['blade-19','small',18,120,['blade-18'],{crit:.01},null],
 ['blade-20','notable',23,87,['blade-19'],{crit:.04},'약점 간파','blade-b3'],
 ['blade-21','small',52,106,['blade-17'],{damagePct:.04},null],
 ['blade-22','notable',68,77,['blade-21'],{damagePct:.125,attackSpeed:.04},'검귀의 혼','blade-m7'],
 ['blade-23','small',219,119,['blade-2'],{execute:.06},null],
 ['blade-24','small',202,96,['blade-23'],{execute:.06},null],
 ['blade-25','notable',179,71,['blade-24'],{execute:.25},'처형자','blade-b6'],
 ['blade-26','small',157,53,['blade-25'],{execute:.06},null],
 ['blade-27','small',132,41,['blade-26'],{critDamage:.06},null],
 ['blade-28','keystone',99,39,['blade-27'],{execute:.3,critDamage:.3,hpPct:-.1},'참수','blade-b7'],
 ['ward-1','small',298,74,['ward-r'],{hpPct:.04},null],
 ['ward-2','notable',300,41,['ward-1'],{hpPct:.1},'단단한 몸','ward-n'],
 ['ward-3','small',282,19,['ward-2'],{reduction:.01},null],
 ['ward-4','notable',255,40,['ward-3'],{reduction:.04},'철벽','ward-a2'],
 ['ward-5','small',230,53,['ward-4','bw-2'],{lowHpGuard:.04},null],
 ['ward-6','small',202,56,['ward-5'],{lowHpGuard:.04},null],
 ['ward-7','notable',179,38,['ward-6'],{lowHpGuard:.15},'불굴','ward-a4'],
 ['ward-8','small',239,16,['ward-4'],{reduction:.01},null],
 ['ward-9','keystone',208,15,['ward-8'],{reduction:.08,speed:-.1},'부동의 성채','ward-a6'],
 ['ward-10','small',314,17,['ward-2'],{hpPct:.04},null],
 ['ward-11','notable',347,21,['ward-10'],{reduction:.03,hpPct:.06},'수호의 맹세','ward-u2'],
 ['ward-12','small',322,39,['ward-2'],{regeneration:.5},null],
 ['ward-13','small',350,43,['ward-12'],{regeneration:.5},null],
 ['ward-14','notable',382,39,['ward-13'],{regeneration:1.9},'재생','ward-b2'],
 ['ward-15','small',410,45,['ward-14'],{drain:.0012},null],
 ['ward-16','small',438,51,['ward-15'],{drain:.0012},null],
 ['ward-17','notable',466,65,['ward-16'],{drain:.005},'피의 갈증','ward-b4'],
 ['ward-18','small',487,84,['ward-17'],{drain:.0012},null],
 ['ward-19','keystone',510,108,['ward-18'],{drain:.0075,regeneration:-1},'혈귀의 육체','ward-b6'],
 ['art-1','small',358,136,['art-r'],{staminaRegen:.06},null],
 ['art-2','notable',387,153,['art-1'],{staminaRegen:.19},'기력 순환','art-n'],
 ['art-3','small',415,151,['art-2'],{skillCooldown:.025},null],
 ['art-4','small',441,141,['art-3','wa-2'],{skillCooldown:.025},null],
 ['art-5','notable',475,138,['art-4'],{skillCooldown:.075},'빠른 손','art-a3'],
 ['art-6','small',498,134,['art-5'],{skillArea:.04},null],
 ['art-7','small',527,132,['art-6'],{skillArea:.04},null],
 ['art-8','notable',555,119,['art-7'],{skillArea:.125},'넓은 검기','art-a6'],
 ['art-9','keystone',583,119,['art-8'],{skillCooldown:.15,damagePct:-.08},'검기 폭주','art-a7'],
 ['art-10','small',492,160,['art-5'],{staminaRegen:.06},null],
 ['art-11','small',508,184,['art-10'],{skillCooldown:.025},null],
 ['art-12','small',402,175,['art-2'],{skillDamage:.04},null],
 ['art-13','notable',416,205,['art-12'],{skillDamage:.06,staminaRegen:.1},'검의 흐름','art-m2'],
 ['art-14','small',430,228,['art-13'],{skillDamage:.04},null],
 ['art-15','small',457,223,['art-14'],{skillDamage:.04},null],
 ['art-16','notable',490,228,['art-15'],{skillDamage:.15},'검술 위력','art-b3'],
 ['art-17','small',517,227,['art-16'],{skillDamage:.04},null],
 ['art-18','notable',548,218,['art-17'],{skillDamage:.125,skillCooldown:.04},'검술사의 혼','art-m7'],
 ['art-19','keystone',581,215,['art-18'],{skillDamage:.375,skillCooldown:-.1},'검무 일체','art-b7'],
 ['art-20','small',506,210,['art-16'],{skillFury:.06},null],
 ['art-21','small',531,202,['art-20'],{skillFury:.06},null],
 ['art-22','notable',562,190,['art-21'],{skillFury:.31},'연환','art-b6'],
 ['art-23','small',376,179,['art-2'],{skillArea:.04},null],
 ['art-24','small',367,205,['art-23','ab-3'],{staminaRegen:.06},null],
 ['ab-1','small',309,179,['ab-r'],{speed:.025},null],
 ['ab-2','notable',327,207,['ab-1'],{range:.1,speed:.06},'검풍','ab-l3'],
 ['ab-3','small',347,217,['ab-2'],{speed:.025},null],
 ['ab-4','notable',375,227,['ab-3'],{speed:.075,staminaRegen:.06},'질주','ab-r3'],
 ['ab-5','small',402,228,['ab-4'],{speed:.02,critDamage:.04},null],
 ['ab-6','small',314,227,['ab-2'],{speed:.025},null],
 ['ab-7','notable',280,228,['ab-6'],{skillArea:.05,speed:.05},'잔상 보법','core'],
 ['ab-8','small',264,204,['ab-7'],{skillDamage:.04},null],
 ['bw-1','small',224,95,['blade-23'],{damagePct:.025,hpPct:.025},null],
 ['bw-2','notable',224,72,['bw-1'],{damagePct:.06,hpPct:.06},'투사의 기개','bw-2'],
 ['wa-1','small',471,101,['ward-18'],{regeneration:.4,staminaRegen:.04},null],
 ['wa-2','notable',457,119,['wa-1'],{regeneration:1.25,staminaRegen:.125},'고요한 호흡','wa-2'],
];
const REGIONS=Object.freeze({blade:['blade'],ward:['ward'],art:['art'],bw:['blade','ward'],wa:['ward','art'],ab:['art','blade'],core:[]});
export const TREE_NODES=Object.freeze(Object.fromEntries(ROWS.map(([id,kind,x,y,links,bonus,name,icon])=>{
 const first=Object.keys(bonus)[0];
 return [id,Object.freeze({id,kind,x,y,...(icon?{icon}:{}),links:Object.freeze(links),branches:Object.freeze(REGIONS[id.split('-')[0]]),cost:TREE_KIND_COST[kind],bonus:Object.freeze(bonus),
  name:name??BONUS_TEXT[first][0],text:kind==='core'?'모든 길이 시작되는 곳':(kind==='keystone'?'핵심 · ':'')+bonusText(bonus)})];
})));
export const TREE_ROOT='core';
// Learnable nodes (the 중심 is always held and never stored), in definition order.
export const TREE_ORDER=Object.freeze(ROWS.map(r=>r[0]).filter(id=>id!==TREE_ROOT));
export const TREE_EDGES=Object.freeze(ROWS.flatMap(([id,,,,links])=>links.map(to=>Object.freeze([to,id]))));
const ADJ=Object.freeze(Object.fromEntries(ROWS.map(r=>[r[0],Object.freeze(TREE_EDGES.filter(e=>e.includes(r[0])).map(e=>e[0]===r[0]?e[1]:e[0]))])));
export const TREE_COST=TREE_ORDER.reduce((a,id)=>a+TREE_NODES[id].cost,0);
// Steps from the 중심 (used to drop the farthest nodes first).
const DEPTH=(()=>{const out={[TREE_ROOT]:0},queue=[TREE_ROOT];while(queue.length){const id=queue.shift();for(const n of ADJ[id])if(!(n in out)){out[n]=out[id]+1;queue.push(n);}}return Object.freeze(out);})();
export const isTreeNode=id=>typeof id==='string'&&id!==TREE_ROOT&&Object.hasOwn(TREE_NODES,id);
// The nodes of `taken` (a Set) reachable from the 중심 through taken nodes.
function reachable(taken){const out=new Set(),queue=[TREE_ROOT];while(queue.length){const id=queue.shift();for(const n of ADJ[id])if(taken.has(n)&&!out.has(n)){out.add(n);queue.push(n);}}return out;}
// A tree keeps only real nodes still joined to the 중심, in definition order.
export function cleanTree(raw){const taken=new Set(Array.isArray(raw)?raw.filter(isTreeNode):[]),keep=reachable(taken);return TREE_ORDER.filter(id=>keep.has(id));}
export const treeSpent=tree=>(tree??[]).reduce((a,id)=>a+(isTreeNode(id)?TREE_NODES[id].cost:0),0);
export const trainingSpent=p=>TRAINING_IDS.reduce((a,id)=>a+(p?.training?.[id]??0),0);
// Alpha 0.132: every claimed 30-star chapter chest (stage-stars.js) adds one point (트리 포인트 from 0.139).
export const bonusGrowthPoints=p=>(p?.starChests??[]).reduce((a,m)=>a+(m>>2&1),0);
export const trainingPointsTotal=p=>Math.max(0,(p?.level??1)-1);
export const treePointsTotal=p=>Math.floor(Math.max(0,(p?.level??1)-1)/2)+bonusGrowthPoints(p);
export const trainingPoints=p=>trainingPointsTotal(p)-trainingSpent(p);
export const treePoints=p=>treePointsTotal(p)-treeSpent(p?.growthTree);
// Both pools together (badges and notes).
export const growthPointsTotal=p=>trainingPointsTotal(p)+treePointsTotal(p);
export const growthPoints=p=>trainingPoints(p)+treePoints(p);
const int=(n,min,max)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;
export const emptyTraining=()=>Object.fromEntries(TRAINING_IDS.map(id=>[id,0]));
// Ranks beyond the level's 능력치 포인트 are trimmed (largest stat first).
export function cleanTraining(raw,level){const total=Math.max(0,(level|0)-1),out=emptyTraining();for(const id of TRAINING_IDS)out[id]=int(raw?.[id],0,total);let over=TRAINING_IDS.reduce((a,id)=>a+out[id],0)-total;while(over>0){const id=TRAINING_IDS.reduce((a,b)=>out[b]>out[a]?b:a);out[id]--;over--;}return out;}
// Nodes of `tree` that can be given back without cutting another node off the 중심.
export function canForget(tree,id){const set=new Set(tree??[]);if(!set.has(id))return false;set.delete(id);return reachable(set).size===set.size;}
// Fit a tree into the level's 트리 포인트 (drops the farthest removable nodes first).
export function fitTree(p,tree){const out=cleanTree(tree),limit=treePointsTotal(p);while(out.length&&treeSpent(out)>limit){const id=[...out].filter(n=>canForget(out,n)).sort((a,b)=>DEPTH[b]-DEPTH[a]||TREE_ORDER.indexOf(b)-TREE_ORDER.indexOf(a))[0];out.splice(out.indexOf(id),1);}return out;}
// 트리 포인트 spent in a region (bridges count for both neighbours); stage-gates.js turns it into the gate counter.
export function branchPoints(p,branch){return (p?.growthTree??[]).reduce((a,id)=>a+(isTreeNode(id)&&TREE_NODES[id].branches.includes(branch)?TREE_NODES[id].cost:0),0);}
const ZERO=Object.freeze({damagePct:0,attackSpeed:0,crit:0,critDamage:0,execute:0,finisher:0,hpPct:0,reduction:0,drain:0,regeneration:0,lowHpGuard:0,staminaRegen:0,skillCooldown:0,skillArea:0,skillDamage:0,skillFury:0,speed:0,range:0});
// Alpha 0.145.2: other sources of the same effects (고대 세트 특수효과) add here, so every place that reads treeBonus applies them.
const bonusSources=[];
export function addBonusSource(fn){if(!bonusSources.includes(fn))bonusSources.push(fn);}
export function treeBonus(p){
 const tree=p?.growthTree;let out=null;
 if(tree?.length){out={...ZERO};for(const id of tree){if(!isTreeNode(id))continue;for(const [k,v] of Object.entries(TREE_NODES[id].bonus))out[k]+=v;}}
 for(const fn of bonusSources){const extra=fn(p);for(const k in extra){if(!Object.hasOwn(ZERO,k))continue;out??={...ZERO};out[k]+=extra[k];}}
 return out??ZERO;
}
export function trainingValue(id,rank){const t=Object.hasOwn(TRAINING,id)?TRAINING[id]:null;return t?Math.round(t.per*trainingEffective(rank)*10)/10:0;}
export function trainStatus(p,id){if(!Object.hasOwn(TRAINING,id))return '없는 단련';if(trainingPoints(p)<1)return '능력치 포인트 부족';return '';}
export function nodeStatus(p,id){if(!isTreeNode(id))return '없는 노드';const tree=p.growthTree??[];if(tree.includes(id))return '습득';if(!ADJ[id].some(n=>n===TREE_ROOT||tree.includes(n)))return '이어진 노드 필요';if(treePoints(p)<TREE_NODES[id].cost)return '트리 포인트 부족';return '';}
export function forgetStatus(p,id){if(!isTreeNode(id)||!(p.growthTree??[]).includes(id))return '습득하지 않음';if(!canForget(p.growthTree,id))return '뒤에 이어진 노드가 있음';return '';}
// Camp actions (game-engine.js wraps them with the phase check).
export function train(p,id){if(trainStatus(p,id))return false;p.training[id]++;return true;}
export function resetTraining(p){p.training=emptyTraining();return true;}
export function learnNode(p,id){if(nodeStatus(p,id))return false;p.growthTree=cleanTree([...(p.growthTree??[]),id]);return true;}
export function forgetNode(p,id){if(forgetStatus(p,id))return false;p.growthTree=cleanTree(p.growthTree.filter(n=>n!==id));return true;}
export function resetTree(p){p.growthTree=[];return true;}
// 기본 단련: what the old 대장간 (검날 8 · 갑각 6 · 충격 핵 5) and 숙련 (검술 4 · 갑각 적응 4 · 리듬 3) gave at their maximum
// now comes with levels, reaching it at Lv.25, so early chapters keep the old pace. 능력치 단련 and 성장 트리 add on top.
export const BASE_GROWTH_LEVEL=25;
export function levelGrowth(level){const k=Math.min(BASE_GROWTH_LEVEL,Math.max(1,level|0))-1,f=k/(BASE_GROWTH_LEVEL-1);
 return {damage:1.36*f,hp:208*f,reduction:.27*f,regeneration:1.5*f,attackSpeed:.3*f,speed:.18*f,range:.32*f};}
// Old 대장간 영구 강화 (0.130 이하) is refunded once: the gold and 괴수 핵 every rank cost.
export const LEGACY_FORGE=Object.freeze({blade:{gold:30,max:8},armor:{gold:25,max:6},core:{gold:60,max:5}});
export function legacyForgeRefund(forge){let gold=0,cores=0;for(const [id,d] of Object.entries(LEGACY_FORGE)){const n=int(forge?.[id],0,d.max);for(let k=0;k<n;k++){gold+=Math.round(d.gold*Math.pow(k+1,1.5));if(id==='core')cores+=1+Math.floor(k/2);}}return {gold,cores};}
