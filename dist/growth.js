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

// 성장 트리: one web around the 중심 and its ring. 검귀 (west) and 검술사 (east) split three ways and loop back, 수호자 (north)
// hangs its keystones inward, bridges and the southern 보법 join neighbouring regions. Nodes: small (2P), notable (6P), keystone (10P, 핵심, usually with a drawback).
// x/y are positions in a 600×240 box (the screen scales it); links are the nodes it touches, listed in a learnable order.
export const GROWTH_TREE=Object.freeze([
 Object.freeze({id:'blade',name:'검귀',text:'기본 공격 화력'}),
 Object.freeze({id:'ward',name:'수호자',text:'버티는 힘'}),
 Object.freeze({id:'art',name:'검술사',text:'스킬 운용'}),
]);
export const TREE_BOX=Object.freeze({width:600,height:240});
// Even Lv.200 with every ★30 chest (99 + 60 = 159P) fills only about half the web (308P): the build is always a choice.
export const TREE_KIND_COST=Object.freeze({core:0,small:2,notable:6,keystone:10});
const BONUS_TEXT=Object.freeze({
 damagePct:['공격력','%',100],attackSpeed:['공격 속도','%',100],crit:['치명타','%p',100],execute:['체력 35% 미만 적에게 주는 피해','%',100],finisher:['3연격 마무리 피해','%',100],
 hpPct:['최대 체력','%',100],reduction:['피해 감소','%p',100],drain:['직접 검격 적중 시 최대 체력 회복','%',100],regeneration:['초당 체력 재생','',1],lowHpGuard:['체력 50% 미만일 때 받는 피해 감소','%',100],
 staminaRegen:['기력 재생','%',100],skillCooldown:['스킬 재사용 단축','%',100],skillArea:['스킬 범위','%',100],skillDamage:['스킬 피해','%',100],skillFury:['스킬 사용 뒤 3초 기본 공격 피해','%',100],
 speed:['이동 속도','%',100],range:['공격 범위','%',100],
});
const num=v=>String(Math.round(v*10)/10);
export function bonusText(bonus){return Object.entries(bonus).map(([k,v])=>{const [label,suffix,scale]=BONUS_TEXT[k];return label+' '+(v<0?'−':'+')+num(Math.abs(v)*scale)+suffix;}).join(' · ');}
// [id, kind, x, y, links, bonus, name]; small nodes are named after their first bonus. Art (east) mirrors 검귀 (west).
const ROWS=[
 ['core','core',300,128,[],{},'중심'],
 // 중심 고리: 네 방향 시작점, 서로도 이어진다
 ['blade-r','small',268,128,['core'],{damagePct:.02}],
 ['ward-r','small',300,104,['core','blade-r'],{hpPct:.02}],
 ['art-r','small',332,128,['core','ward-r'],{staminaRegen:.04}],
 ['ab-r','small',300,152,['core','blade-r','art-r'],{speed:.02}],
 // 검귀 (서쪽): 줄기 → 위(연격)·가운데(검의 길)·아래(처형) 세 가지, 가운데 가지는 위아래 가지와 다시 이어진다
 ['blade-1','small',240,128,['blade-r'],{damagePct:.03}],
 ['blade-n','notable',212,128,['blade-1'],{damagePct:.08},'날 선 검'],
 ['blade-a1','small',194,106,['blade-n'],{attackSpeed:.02}],
 ['blade-a2','small',172,88,['blade-a1'],{attackSpeed:.02}],
 ['blade-a3','notable',146,76,['blade-a2'],{attackSpeed:.06},'연격 가속'],
 ['blade-a4','small',118,70,['blade-a3'],{finisher:.1}],
 ['blade-a5','small',90,70,['blade-a4'],{finisher:.1}],
 ['blade-a6','notable',62,78,['blade-a5'],{finisher:.4},'혈월의 검'],
 ['blade-a7','keystone',30,90,['blade-a6'],{attackSpeed:.15,reduction:-.06},'광폭 연무'],
 ['blade-b1','small',194,150,['blade-n'],{crit:.01}],
 ['blade-b2','small',172,168,['blade-b1'],{crit:.01}],
 ['blade-b3','notable',146,180,['blade-b2'],{crit:.04},'약점 간파'],
 ['blade-b4','small',118,186,['blade-b3'],{execute:.05}],
 ['blade-b5','small',90,186,['blade-b4'],{execute:.05}],
 ['blade-b6','notable',62,178,['blade-b5'],{execute:.2},'처형자'],
 ['blade-b7','keystone',30,166,['blade-b6'],{execute:.3,crit:.05,hpPct:-.1},'참수'],
 ['blade-m1','small',182,128,['blade-n'],{damagePct:.02,range:.02}],
 ['blade-m2','notable',150,128,['blade-m1'],{range:.06,crit:.02},'칼끝 감각'],
 ['blade-m3','small',118,128,['blade-m2'],{damagePct:.03}],
 ['blade-m4','small',100,100,['blade-m3','blade-a5'],{attackSpeed:.02}],
 ['blade-m5','small',100,156,['blade-m3','blade-b5'],{execute:.05}],
 ['blade-m6','small',86,128,['blade-m3'],{damagePct:.03}],
 ['blade-m7','notable',54,128,['blade-m6'],{damagePct:.1,attackSpeed:.03},'검귀의 혼'],
 // 수호자 (북쪽): 줄기 → 왼쪽(철벽, 검귀 쪽 다리로)·오른쪽(재생, 검술사 쪽 다리로)·위(맹세); 핵심은 안쪽으로 늘어진다
 ['ward-1','small',300,80,['ward-r'],{hpPct:.03}],
 ['ward-n','notable',300,56,['ward-1'],{hpPct:.08},'단단한 몸'],
 ['ward-u1','small',300,32,['ward-n'],{hpPct:.03}],
 ['ward-u2','notable',300,10,['ward-u1'],{reduction:.03,hpPct:.05},'수호의 맹세'],
 ['ward-a1','small',274,46,['ward-n'],{reduction:.01}],
 ['ward-a2','notable',248,34,['ward-a1'],{reduction:.04},'철벽'],
 ['ward-a3','small',222,22,['ward-a2'],{lowHpGuard:.03}],
 ['ward-a4','notable',196,16,['ward-a3'],{lowHpGuard:.12},'불굴'],
 ['ward-a5','small',240,62,['ward-a2'],{reduction:.01}],
 ['ward-a6','keystone',226,86,['ward-a5'],{reduction:.08,speed:-.1},'부동의 성채'],
 ['ward-b1','small',326,46,['ward-n'],{regeneration:.4}],
 ['ward-b2','notable',352,34,['ward-b1'],{regeneration:1.5},'재생'],
 ['ward-b3','small',378,22,['ward-b2'],{drain:.001}],
 ['ward-b4','notable',404,16,['ward-b3'],{drain:.004},'피의 갈증'],
 ['ward-b5','small',360,62,['ward-b2'],{drain:.001}],
 ['ward-b6','keystone',374,86,['ward-b5'],{drain:.006,regeneration:-1},'혈귀의 육체'],
 // 검술사 (동쪽)
 ['art-1','small',360,128,['art-r'],{staminaRegen:.05}],
 ['art-n','notable',388,128,['art-1'],{staminaRegen:.15},'기력 순환'],
 ['art-a1','small',406,106,['art-n'],{skillCooldown:.02}],
 ['art-a2','small',428,88,['art-a1'],{skillCooldown:.02}],
 ['art-a3','notable',454,76,['art-a2'],{skillCooldown:.06},'빠른 손'],
 ['art-a4','small',482,70,['art-a3'],{skillArea:.03}],
 ['art-a5','small',510,70,['art-a4'],{skillArea:.03}],
 ['art-a6','notable',538,78,['art-a5'],{skillArea:.1},'넓은 검기'],
 ['art-a7','keystone',570,90,['art-a6'],{skillCooldown:.12,damagePct:-.08},'검기 폭주'],
 ['art-b1','small',406,150,['art-n'],{skillDamage:.03}],
 ['art-b2','small',428,168,['art-b1'],{skillDamage:.03}],
 ['art-b3','notable',454,180,['art-b2'],{skillDamage:.12},'검술 위력'],
 ['art-b4','small',482,186,['art-b3'],{skillFury:.05}],
 ['art-b5','small',510,186,['art-b4'],{skillFury:.05}],
 ['art-b6','notable',538,178,['art-b5'],{skillFury:.25},'연환'],
 ['art-b7','keystone',570,166,['art-b6'],{skillDamage:.3,skillCooldown:-.1},'검무 일체'],
 ['art-m1','small',418,128,['art-n'],{skillDamage:.02,staminaRegen:.03}],
 ['art-m2','notable',450,128,['art-m1'],{skillDamage:.05,staminaRegen:.08},'검의 흐름'],
 ['art-m3','small',482,128,['art-m2'],{skillArea:.03}],
 ['art-m4','small',500,100,['art-m3','art-a5'],{skillCooldown:.02}],
 ['art-m5','small',500,156,['art-m3','art-b5'],{skillFury:.05}],
 ['art-m6','small',514,128,['art-m3'],{skillDamage:.03}],
 ['art-m7','notable',546,128,['art-m6'],{skillDamage:.1,skillCooldown:.03},'검술사의 혼'],
 // 다리 (양쪽 영역으로 센다): 북서 검귀↔수호자, 북동 수호자↔검술사
 ['bw-1','small',150,50,['blade-a3'],{damagePct:.02,hpPct:.02}],
 ['bw-2','notable',166,28,['bw-1','ward-a4'],{damagePct:.05,hpPct:.05},'투사의 기개'],
 ['wa-1','small',450,50,['art-a3'],{regeneration:.3,staminaRegen:.03}],
 ['wa-2','notable',434,28,['wa-1','ward-b4'],{regeneration:1,staminaRegen:.1},'고요한 호흡'],
 // 남쪽 보법: 중심 아래에서 검귀·검술사의 아래 가지로 이어진다
 ['ab-1','small',300,176,['ab-r'],{range:.02,speed:.02}],
 ['ab-n','notable',300,200,['ab-1'],{range:.08,speed:.05},'검풍'],
 ['ab-l1','small',262,214,['ab-n'],{speed:.02}],
 ['ab-l2','small',228,224,['ab-l1'],{range:.02}],
 ['ab-l3','notable',196,220,['ab-l2'],{speed:.06,staminaRegen:.05},'질주'],
 ['ab-l4','small',166,204,['ab-l3','blade-b3'],{range:.02,crit:.01}],
 ['ab-r1','small',338,214,['ab-n'],{speed:.02}],
 ['ab-r2','small',372,224,['ab-r1'],{range:.02}],
 ['ab-r3','notable',404,220,['ab-r2'],{skillArea:.04,speed:.04},'잔상 보법'],
 ['ab-r4','small',434,204,['ab-r3','art-b3'],{range:.02,skillDamage:.02}],
];
const REGIONS=Object.freeze({blade:['blade'],ward:['ward'],art:['art'],bw:['blade','ward'],wa:['ward','art'],ab:['art','blade'],core:[]});
export const TREE_NODES=Object.freeze(Object.fromEntries(ROWS.map(([id,kind,x,y,links,bonus,name])=>{
 const first=Object.keys(bonus)[0];
 return [id,Object.freeze({id,kind,x,y,links:Object.freeze(links),branches:Object.freeze(REGIONS[id.split('-')[0]]),cost:TREE_KIND_COST[kind],bonus:Object.freeze(bonus),
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
const ZERO=Object.freeze({damagePct:0,attackSpeed:0,crit:0,execute:0,finisher:0,hpPct:0,reduction:0,drain:0,regeneration:0,lowHpGuard:0,staminaRegen:0,skillCooldown:0,skillArea:0,skillDamage:0,skillFury:0,speed:0,range:0});
export function treeBonus(p){const tree=p?.growthTree;if(!tree?.length)return ZERO;const out={...ZERO};for(const id of tree){if(!isTreeNode(id))continue;for(const [k,v] of Object.entries(TREE_NODES[id].bonus))out[k]+=v;}return out;}
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
