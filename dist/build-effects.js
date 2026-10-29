import {isEquippedItem} from './equipment-slots.js?v=0.144.7';
// One optional inscription per owned instance. Innate legacy powers remain intact.
export const BUILD_EFFECTS=Object.freeze(Object.fromEntries([
 {id:'chain',name:'번개 전이',event:'hit',damage:.4,targets:3,targetCap:5,radius:230,color:'#9edee9'},
 {id:'explosion',name:'처치 폭발',event:'kill',damage:.6,radius:175,color:'#f4b480'},
 {id:'bleed',name:'출혈 각인',event:'hit',damage:.08,stacks:10,duration:3,color:'#ed8992'},
 {id:'execution',name:'처형 각인',event:'hit',threshold:.25,bonus:.4,color:'#eaa4a3'},
 {id:'leech',name:'흡혈 각인',event:'hit',ratio:.03,cap:.1,color:'#ff819d'},
 {id:'fury',name:'광폭화',event:'kill',speed:.2,duration:3,color:'#f3cd8c'},
 {id:'shred',name:'방어 약화',event:'hit',reduction:.2,cap:.4,vulnerability:.5,duration:4,color:'#dab582'},
 {id:'counter',name:'반격 각인',event:'hurt',chance:.2,damage:.8,radius:230,color:'#e9c689'},
].map(x=>[x.id,Object.freeze(x)])));
export const BUILD_EFFECT_IDS=Object.freeze(Object.keys(BUILD_EFFECTS));
const pct=n=>Math.round(n*100)+'%';
export function buildEffectText(id,count=1){const r=BUILD_EFFECTS[id];if(!r)return '추가 각인 없음';const n=Math.max(1,count);
 switch(id){
 case 'chain':return `직접 적중 시 가까운 적 ${Math.min(r.targetCap,r.targets*n)}명에게 공격력 ${pct(r.damage*n)} 피해 · 재전이 없음`;
 case 'explosion':return `직접 처치 시 주변 공격력 ${pct(r.damage*n)} 피해 · 폭발 처치는 재폭발 없음`;
 case 'bleed':return `직접 적중 시 출혈 · 중첩당 초당 공격력 ${pct(r.damage*n)}, 최대 ${r.stacks}중첩 · ${r.duration}초`;
 case 'execution':return `체력 ${pct(r.threshold)} 이하 대상 직접 피해 +${pct(r.bonus*n)}`;
 case 'leech':return `직접 피해의 ${pct(Math.min(r.cap,r.ratio*n))} 회복`;
 case 'fury':return `처치 후 공격속도 +${pct(r.speed*n)} · ${r.duration}초 · 재적용 시 지속 갱신`;
 case 'shred':return `직접 적중 시 장갑·방어 태세 ${pct(Math.min(r.cap,r.reduction*n))}p 약화 · 받는 피해 +${pct(Math.min(r.cap,r.reduction*n)*r.vulnerability)} · ${r.duration}초`;
 case 'counter':return `피격 생존 시 ${pct(Math.min(1,r.chance*n))} 확률로 공격력 ${pct(r.damage*n)} 반격 · 재반격 없음`;
 }
}
export function buildEffects(profile){const counts={};for(const item of profile.inventory)if(BUILD_EFFECTS[item.inscription]&&isEquippedItem(profile,item))counts[item.inscription]=(counts[item.inscription]??0)+1;return Object.freeze(counts);}
export const INSCRIPTION_COST=Object.freeze({gold:1500,materials:Object.freeze({boneIron:12,crystal:2})});
export const INSCRIPTION_DROP_CHANCE=Object.freeze({normal:0,special:.2,elite:.3,boss:.5});
export function inscriptionStatus(profile,itemId,id){const item=profile.inventory.find(i=>i.id===itemId),definition=BUILD_EFFECTS[id];
 const ok=!!item&&!item.seal&&!!definition&&!item.rerollCandidate&&profile.gold>=INSCRIPTION_COST.gold&&Object.entries(INSCRIPTION_COST.materials).every(([k,v])=>profile.materials[k]>=v);
 return {ok,item,definition,cost:INSCRIPTION_COST,reason:!item?'보유 장비를 선택해줘.':item.seal?'인장에는 각인할 수 없어.':!definition?'각인을 선택해줘.':item.rerollCandidate?'수치작 결과를 먼저 선택해줘.':!ok?'골드 또는 각인 재료가 부족해.':'기본·강화 수치와 장비 ID 유지 · 추가 각인 1개 교체'};
}
