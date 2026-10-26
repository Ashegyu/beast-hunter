// Alpha 0.131 캐릭터 성장: every level gives one 성장 포인트 (Lv.200 → 199). Points go to
//  · 능력치 단련 (TRAINING): six stats shared by every build, one point per rank, rank cap rises with level;
//  · 성장 트리 (GROWTH_TREE): three branches of five nodes taken in order, saved with each build.
// Points are not stored: free points = level-1 (+ 30-star chests) − trained ranks − nodes of the current tree.
// Pure data and rules; game-engine.js and combat-skills.js read the bonuses.
export const TRAINING_MAX=30;
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
// Ranks open with level: 1 at Lv.1, then one more every 5 levels, up to 30 (Lv.146).
export const trainingCap=level=>Math.min(TRAINING_MAX,1+Math.floor((Math.max(1,level|0)-1)/5));
const node=(id,name,cost,text,bonus)=>Object.freeze({id,name,cost,text,bonus:Object.freeze(bonus)});
export const GROWTH_TREE=Object.freeze([
 Object.freeze({id:'blade',name:'검귀',text:'기본 공격 화력',nodes:Object.freeze([
  node('blade1','날 선 검',2,'공격력 +8%',{damagePct:.08}),
  node('blade2','연격 가속',3,'공격 속도 +6%',{attackSpeed:.06}),
  node('blade3','약점 간파',4,'치명타 +5%p',{crit:.05}),
  node('blade4','처형자',5,'체력 35% 미만 적에게 주는 피해 +20%',{execute:.2}),
  node('blade5','혈월의 검',8,'핵심 · 3연격 마무리 피해 +50%',{finisher:.5}),
 ])}),
 Object.freeze({id:'ward',name:'수호자',text:'버티는 힘',nodes:Object.freeze([
  node('ward1','단단한 몸',2,'최대 체력 +8%',{hpPct:.08}),
  node('ward2','철벽',3,'피해 감소 +4%p',{reduction:.04}),
  node('ward3','피의 갈증',4,'직접 검격이 맞힐 때마다 최대 체력 0.4% 회복',{drain:.004}),
  node('ward4','재생',5,'초당 체력 재생 +1.5',{regeneration:1.5}),
  node('ward5','불굴',8,'핵심 · 체력 50% 미만일 때 받는 피해 −15%',{lowHpGuard:.15}),
 ])}),
 Object.freeze({id:'art',name:'검술사',text:'스킬 운용',nodes:Object.freeze([
  node('art1','기력 순환',2,'기력 재생 +15%',{staminaRegen:.15}),
  node('art2','빠른 손',3,'스킬 재사용 −8%',{skillCooldown:.08}),
  node('art3','넓은 검기',4,'스킬 범위 +10%',{skillArea:.1}),
  node('art4','검술 위력',5,'스킬 피해 +15%',{skillDamage:.15}),
  node('art5','연환',8,'핵심 · 스킬을 쓰고 3초 동안 기본 공격 피해 +30%',{skillFury:.3}),
 ])}),
]);
export const TREE_NODES=Object.freeze(Object.fromEntries(GROWTH_TREE.flatMap(b=>b.nodes.map((n,i)=>[n.id,Object.freeze({...n,branch:b.id,index:i})]))));
export const TREE_COST=GROWTH_TREE.reduce((a,b)=>a+b.nodes.reduce((x,n)=>x+n.cost,0),0);
const int=(n,min,max)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;
export const emptyTraining=()=>Object.fromEntries(TRAINING_IDS.map(id=>[id,0]));
// Ranks above the level cap or beyond the level's points are trimmed (largest stat first).
export function cleanTraining(raw,level,bonus=0){const cap=trainingCap(level),out=emptyTraining();for(const id of TRAINING_IDS)out[id]=int(raw?.[id],0,cap);let over=TRAINING_IDS.reduce((a,id)=>a+out[id],0)-Math.max(0,(level|0)-1)-bonus;while(over>0){const id=TRAINING_IDS.reduce((a,b)=>out[b]>out[a]?b:a);out[id]--;over--;}return out;}
// A tree keeps only nodes whose earlier nodes in the same branch are also taken, in branch order.
export function cleanTree(raw){const taken=new Set(Array.isArray(raw)?raw.filter(id=>typeof id==='string'):[]),out=[];for(const b of GROWTH_TREE)for(const n of b.nodes){if(!taken.has(n.id))break;out.push(n.id);}return out;}
export const trainingSpent=p=>TRAINING_IDS.reduce((a,id)=>a+(p?.training?.[id]??0),0);
export const treeSpent=tree=>(tree??[]).reduce((a,id)=>a+(Object.hasOwn(TREE_NODES,id)?TREE_NODES[id].cost:0),0);
// Alpha 0.132: every claimed 30-star chapter chest (stage-stars.js) adds one point.
export const bonusGrowthPoints=p=>(p?.starChests??[]).reduce((a,m)=>a+(m>>2&1),0);
export const growthPointsTotal=p=>Math.max(0,(p?.level??1)-1)+bonusGrowthPoints(p);
export const growthPoints=p=>growthPointsTotal(p)-trainingSpent(p)-treeSpent(p?.growthTree);
// Fit a tree into the points left after training (drops the latest nodes first).
export function fitTree(p,tree){const out=cleanTree(tree),limit=growthPointsTotal(p)-trainingSpent(p);while(out.length&&treeSpent(out)>limit){const last=[...out].sort((a,b)=>TREE_NODES[b].index-TREE_NODES[a].index)[0];out.splice(out.indexOf(last),1);}return cleanTree(out);}
const ZERO=Object.freeze({damagePct:0,attackSpeed:0,crit:0,execute:0,finisher:0,hpPct:0,reduction:0,drain:0,regeneration:0,lowHpGuard:0,staminaRegen:0,skillCooldown:0,skillArea:0,skillDamage:0,skillFury:0});
export function treeBonus(p){const tree=p?.growthTree;if(!tree?.length)return ZERO;const out={...ZERO};for(const id of tree){const n=Object.hasOwn(TREE_NODES,id)?TREE_NODES[id]:null;if(n)for(const [k,v] of Object.entries(n.bonus))out[k]+=v;}return out;}
export function trainingValue(id,rank){const t=Object.hasOwn(TRAINING,id)?TRAINING[id]:null;return t?Math.round(t.per*rank*10)/10:0;}
export function trainStatus(p,id){if(!Object.hasOwn(TRAINING,id))return '없는 단련';if((p.training?.[id]??0)>=trainingCap(p.level))return p.training[id]>=TRAINING_MAX?'최대 단계':'Lv.'+(1+5*(p.training[id]))+'에 다음 단계';if(growthPoints(p)<1)return '성장 포인트 부족';return '';}
export function nodeStatus(p,id){const n=Object.hasOwn(TREE_NODES,id)?TREE_NODES[id]:null;if(!n)return '없는 노드';const tree=p.growthTree??[];if(tree.includes(id))return '습득';const branch=GROWTH_TREE.find(b=>b.id===n.branch);if(n.index>0&&!tree.includes(branch.nodes[n.index-1].id))return '앞 노드 필요';if(growthPoints(p)<n.cost)return '성장 포인트 부족';return '';}
// Camp actions (game-engine.js wraps them with the phase check).
export function train(p,id){if(trainStatus(p,id))return false;p.training[id]++;return true;}
export function resetTraining(p){p.training=emptyTraining();return true;}
export function learnNode(p,id){if(nodeStatus(p,id))return false;p.growthTree=cleanTree([...(p.growthTree??[]),id]);return true;}
export function resetTree(p){p.growthTree=[];return true;}
// 기본 단련: what the old 대장간 (검날 8 · 갑각 6 · 충격 핵 5) and 숙련 (검술 4 · 갑각 적응 4 · 리듬 3) gave at their maximum
// now comes with levels, reaching it at Lv.25, so early chapters keep the old pace. 능력치 단련 and 성장 트리 add on top.
export const BASE_GROWTH_LEVEL=25;
export function levelGrowth(level){const k=Math.min(BASE_GROWTH_LEVEL,Math.max(1,level|0))-1,f=k/(BASE_GROWTH_LEVEL-1);
 return {damage:1.36*f,hp:208*f,reduction:.27*f,regeneration:1.5*f,attackSpeed:.3*f,speed:.18*f,range:.32*f};}
// Old 대장간 영구 강화 (0.130 이하) is refunded once: the gold and 괴수 핵 every rank cost.
export const LEGACY_FORGE=Object.freeze({blade:{gold:30,max:8},armor:{gold:25,max:6},core:{gold:60,max:5}});
export function legacyForgeRefund(forge){let gold=0,cores=0;for(const [id,d] of Object.entries(LEGACY_FORGE)){const n=int(forge?.[id],0,d.max);for(let k=0;k<n;k++){gold+=Math.round(d.gold*Math.pow(k+1,1.5));if(id==='core')cores+=1+Math.floor(k/2);}}return {gold,cores};}
