import {itemRollRanges,isPerfectRoll,effectiveAffix,enhancementBonus,rollItemAffixes,rollRaidPowerFor,promotionPreview,ENHANCEMENT_CAPS,MAX_ENHANCEMENT,enhancementCap,enhancementLevel} from './loot.js?v=0.149.11';
export {itemRollRanges,isPerfectRoll,effectiveAffix,enhancementBonus,ENHANCEMENT_CAPS,MAX_ENHANCEMENT,enhancementCap,enhancementLevel};
const CHANCE_BANDS=[[[100,92]],[[95,77.9]],[[90,73.8],[54,46.8]],[[80,65.6],[48,33.6]],[[65,53.3],[39,27.3],[13,1]],[[60,49.2],[36,25.2],[12,3],[1.5,.5]],[[55,45.1],[33,23.1],[11,3],[2,.8],[.6,.3]]];
const bounded=(n,min,max,fallback=0)=>Number.isInteger(n)?Math.max(min,Math.min(max,n)):fallback;
export function enhancementRule(target,rarity=0){
 const cap=enhancementCap(rarity);if(!Number.isInteger(target)||target<1||target>cap)return null;
 const band=Math.floor((target-1)/10),[start,end]=CHANCE_BANDS[rarity][band],length=Math.min(10,cap-band*10),progress=(target-band*10-1)/(length-1),percent=start+(end-start)*progress;
 const mode=rarity===5&&target>=30?'incremental':rarity===6&&target>=40?'none':'guaranteed';
 return {chance:Math.round(percent*100)/10000,mode,attempts:mode==='guaranteed'?(band+1)*10:null,bonusPerFailure:mode==='incremental'?.001:0,maxBonusFailures:mode==='incremental'?20:0};
}
const failureLimit=rule=>rule.mode==='guaranteed'?rule.attempts-1:rule.maxBonusFailures;
const owned=(p,id)=>p.inventory.find(i=>i.id===id);
function bonusData(item,addStep=false){const result={};for(const key of Object.keys(item.affixes))result[key]=(Math.round(enhancementBonus(item,key)*100)+(addStep?item.affixes[key]*3:0))/100;return result;}
function payable(p,cost){return Number.isFinite(p.gold)&&p.gold>=cost.gold&&Number.isFinite(p.cores)&&p.cores>=cost.cores&&Object.entries(cost.materials).every(([k,v])=>Number.isInteger(p.materials?.[k])&&p.materials[k]>=v);}
function spend(p,cost){p.gold-=cost.gold;p.cores-=cost.cores;for(const [k,v]of Object.entries(cost.materials))p.materials[k]-=v;}
// Alpha 0.136: seals grow on the boss rush screen instead of the workshop.
const SEAL_REASON='인장은 던전 → 보스 러시에서 성장시켜.';
export function enhancementStatus(p,id){
 const item=owned(p,id);if(!item)return {ok:false,reason:'보유하지 않은 장비야.'};if(item.seal)return {ok:false,item,level:0,cap:0,cost:{gold:0,cores:0,materials:{}},ranges:{},preview:null,reason:SEAL_REASON};
 const level=enhancementLevel(item),cap=enhancementCap(item.rarity),target=level+1,rule=enhancementRule(target,item.rarity);
 if(!rule)return {ok:false,item,level,cap,reason:'최대 강화 +'+cap+(item.rarity<4?' · 승급 가능':'')};
 const failures=bounded(item.enhanceFailures,0,failureLimit(rule)),guaranteed=rule.mode==='guaranteed'&&failures+1>=rule.attempts,bonusChance=failures*rule.bonusPerFailure,chance=guaranteed?1:Math.round((rule.chance+bonusChance)*10000)/10000;
 const band=Math.floor((target-1)/10),materials={refineStone:Math.ceil(target/5)};
 if(band>=1)materials.refineCrystal=Math.ceil((target-10)/5);
 if(band>=2)materials.refineEssence=Math.ceil((target-20)/5);
 if(band>=3)materials.boneIron=Math.ceil((target-30)/5);
 if(band>=4)materials.crystal=Math.ceil((target-40)/5);
 const cost={gold:Math.round((100+target*target*20)*(1+item.rarity*.35)*item.tier*2**band),cores:0,materials};
 const reason=item.rerollCandidate?'수치작 결과를 먼저 선택해줘.':!payable(p,cost)?'강화 골드 또는 재련 재료가 부족해.':guaranteed?'확정 성공 준비 완료':'실패해도 강화 단계 유지';
 return {ok:!item.rerollCandidate&&payable(p,cost),item,level,cap,target,failures,guaranteed,chance,baseChance:rule.chance,bonusChance,mode:rule.mode,bonusPerFailure:rule.bonusPerFailure,maxBonusFailures:rule.maxBonusFailures,remaining:rule.mode==='guaranteed'?rule.attempts-failures:null,attempts:rule.attempts,cost,reason};
}
function unit(rng){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Equipment RNG must return [0, 1)');return n;}
export function enhanceOwned(p,id,rng){
 const status=enhancementStatus(p,id);if(!status.ok)return status;
 const success=status.chance===1||unit(rng)<status.chance;
 const bonuses=success?bonusData(status.item,true):null;
 spend(p,status.cost);
 if(success){status.item.enhancementAffixes=bonuses;status.item.enhancement=status.target;delete status.item.enhanceFailures;}
 else if(status.mode==='none')delete status.item.enhanceFailures;
 else status.item.enhanceFailures=Math.min(status.failures+1,status.mode==='incremental'?status.maxBonusFailures:status.attempts-1);
 const failureNote=status.mode==='incremental'?'확률 보정 '+status.item.enhanceFailures+'/'+status.maxBonusFailures:status.mode==='none'?'확률 보정·보장 없음':'보장까지 '+(status.remaining-1)+'회';
 return {ok:true,success,guaranteed:status.guaranteed,item:status.item,cost:status.cost,reason:success?'강화 성공 · +'+status.target:'강화 실패 · 단계 유지 · '+failureNote};
}
const PROMOTION_GOLD=[2000,8000,30000,100000],PROMOTION_STONES=[2,5,12,30],PROMOTION_CRYSTALS=[1,3,8,20];
export function promotionStatus(p,id){
 const item=owned(p,id);if(!item)return {ok:false,reason:'보유하지 않은 장비야.'};if(item.seal)return {ok:false,item,level:0,cap:0,cost:{gold:0,cores:0,materials:{}},ranges:{},preview:null,reason:SEAL_REASON};
 const preview=promotionPreview(item),level=enhancementLevel(item),cap=enhancementCap(item.rarity);
 if(!preview)return {ok:false,item,level,cap,reason:item.rarity<4?'장비 원형을 확인할 수 없어 승급할 수 없어.':item.rarity===4?'신화는 일반 장비의 최종 등급이야.':'고대·제작 장비는 별도 체계로 승급하지 않아.'};
 const materials={promotionStone:PROMOTION_STONES[item.rarity],crystal:PROMOTION_CRYSTALS[item.rarity]};
 if(item.rarity===2)materials.refineCrystal=4;if(item.rarity===3)materials.refineEssence=5;
 const cost={gold:PROMOTION_GOLD[item.rarity]*item.tier,cores:0,materials};
 const reason=item.rerollCandidate?'수치작 결과를 먼저 선택해줘.':level<cap?'최대 강화 +'+cap+'에 도달하면 승급 가능':!payable(p,cost)?'승급 골드 또는 재료가 부족해.':'확정 승급 · 강화와 추가 수치는 초기화';
 return {ok:!item.rerollCandidate&&level===cap&&payable(p,cost),item,preview,level,cap,cost,reason};
}
export function promoteOwned(p,id){
 const status=promotionStatus(p,id);if(!status.ok)return status;
 spend(p,status.cost);const item=status.item;delete item.enhancement;delete item.enhancementAffixes;delete item.enhanceFailures;delete item.rerollCandidate;delete item.perfect;Object.assign(item,status.preview);
 return {ok:true,item,cost:status.cost,reason:'승급 성공 · '+item.name+' · 강화 +0'};
}
export function rerollStatus(p,id){
 const item=owned(p,id);if(!item)return {ok:false,reason:'보유하지 않은 장비야.'};if(item.seal)return {ok:false,item,level:0,cap:0,cost:{gold:0,cores:0,materials:{}},ranges:{},preview:null,reason:SEAL_REASON};
 const ranges=itemRollRanges(item),cost={gold:Math.round((180+item.rarity*60)*item.tier),cores:1,materials:{boneIron:3+item.rarity}};
 const reason=item.rarity<4?'신화 이상 장비부터 수치작 가능':!Object.keys(ranges).length?'장비의 수치 범위를 확인할 수 없어.':item.rerollCandidate?'새 수치 적용 또는 기존 유지를 선택해줘.':!payable(p,cost)?'수치작 비용이 부족해.':'옵션 종류와 강화는 유지 · 새 수치 확인 후 선택';
 return {ok:item.rarity>=4&&!!Object.keys(ranges).length&&!item.rerollCandidate&&payable(p,cost),item,ranges,cost,reason,pending:!!item.rerollCandidate};
}
export function rerollOwned(p,id,rng){
 const status=rerollStatus(p,id);if(!status.ok)return status;
 const affixes=rollItemAffixes(status.item,()=>unit(rng)),powerRoll=rollRaidPowerFor(status.item,()=>unit(rng));
 const bonuses=enhancementLevel(status.item)?bonusData(status.item):null;
 spend(p,status.cost);if(bonuses)status.item.enhancementAffixes=bonuses;status.item.rerollCandidate={affixes,...(powerRoll!==null?{powerRoll}:{})};
 return {ok:true,item:status.item,cost:status.cost,reason:'새 수치 준비 완료 · 적용 또는 기존 유지 선택'};
}
export function resolveOwnedReroll(p,id,accept){
 const item=owned(p,id);if(!item?.rerollCandidate||typeof accept!=='boolean')return {ok:false,reason:'대기 중인 수치작 결과가 없어.'};
 if(accept){const bonuses=enhancementLevel(item)?bonusData(item):null;item.affixes={...item.rerollCandidate.affixes};if(Number.isInteger(item.rerollCandidate.powerRoll))item.powerRoll=item.rerollCandidate.powerRoll;if(bonuses)item.enhancementAffixes=bonuses;item.rollVersion=1;if(isPerfectRoll(item))item.perfect=true;else{delete item.perfect;item.name=item.name.replace(/^완벽한 /,'');}}
 delete item.rerollCandidate;
 return {ok:true,item,applied:accept,reason:accept?'새 수치 적용 완료':'기존 수치 유지 · 작업 비용은 소비됨'};
}
export function restoreEquipmentProgress(clean,raw,allowProgress){
 const ranges=itemRollRanges(clean),keys=Object.keys(ranges);
 if(raw.rollVersion===1&&keys.length){
  for(const key of keys)clean.affixes[key]=bounded(clean.affixes[key],ranges[key].min,ranges[key].max,ranges[key].min);
  clean.rollVersion=1;delete clean.perfect;if(isPerfectRoll(clean))clean.perfect=true;
 }
 if(!allowProgress)return clean;
 const promotions=bounded(raw.promotionCount,0,Math.min(4,clean.rarity));if(promotions&&clean.rarity<5)clean.promotionCount=promotions;
 const level=bounded(raw.enhancement,0,enhancementCap(clean.rarity));if(level){clean.enhancement=level;clean.enhancementAffixes=bonusData({...clean,enhancementAffixes:raw.enhancementAffixes});}
 const rule=enhancementRule(level+1,clean.rarity),fails=rule?bounded(raw.enhanceFailures,0,failureLimit(rule)):0;if(fails)clean.enhanceFailures=fails;
 const candidate=raw.rerollCandidate?.affixes;
 if(clean.rarity>=4&&keys.length&&candidate&&typeof candidate==='object'&&!Array.isArray(candidate)&&Object.keys(candidate).length===keys.length&&keys.every(k=>Object.hasOwn(candidate,k)&&Number.isInteger(candidate[k])))clean.rerollCandidate={affixes:Object.fromEntries(keys.map(k=>[k,bounded(candidate[k],ranges[k].min,ranges[k].max,ranges[k].min)])),...(Number.isInteger(clean.powerRoll)&&Number.isInteger(raw.rerollCandidate.powerRoll)?{powerRoll:bounded(raw.rerollCandidate.powerRoll,60,120,60)}:{})};// A paid candidate survives range changes (Alpha 0.120) by moving into the current range.
 return clean;
}
