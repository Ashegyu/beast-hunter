// Alpha 0.145.2 고대 세트 (사용자 요청·결정): 같은 지역의 고대끼리 6세트(2·4·6부위), 같은 레이드의 고대끼리 4세트(2·3·5부위).
// 앞 단계는 능력치(equipment-sets.js의 SET_STATS 키, 같은 단위), 마지막 단계는 능력치 + 특수효과 하나.
// 특수효과는 성장 트리와 같은 키(growth.js treeBonus: execute·finisher·drain·lowHpGuard·skillCooldown·skillDamage)라
// 전투 코드가 이미 읽는 자리에서 그대로 발동한다(game-engine이 growth.addBonusSource로 이어 붙임).
// 승화 제작 장비(rarity 6, forge.ancient)는 바친 고대의 세트로 센다. 같은 고대를 두 개(귀걸이 두 칸 등) 껴도 한 부위.
import {ANCIENT_CATALOG} from './loot.js?v=0.147.7';
import {bonusText} from './growth.js?v=0.147.7';
import {setStatText} from './equipment-sets.js?v=0.147.7';

const stage=(pieces,stats,special=null)=>Object.freeze({pieces,stats:Object.freeze(stats),special:special&&Object.freeze({...special,bonus:Object.freeze(special.bonus)})});
// [id, 이름, 색, 지역 tier | 레이드 id, 단계들]
const ROWS=[
 ['ancient-1','태초의 숲 맹약','#7fd27a',1,[stage(2,{hpPct:.06}),stage(4,{damagePct:.06,crit:3}),stage(6,{damagePct:.06},{name:'생명의 뿌리',bonus:{drain:.004}})]],
 ['ancient-2','태초의 서리 맹약','#8fd8f5',2,[stage(2,{reduction:3}),stage(4,{hpPct:.09,reduction:2}),stage(6,{hpPct:.06},{name:'서리 장벽',bonus:{lowHpGuard:.2}})]],
 ['ancient-3','태초의 망령 맹약','#b67cf0',3,[stage(2,{crit:4}),stage(4,{damagePct:.09}),stage(6,{damagePct:.07},{name:'망자의 낫',bonus:{execute:.3}})]],
 ['ancient-4','태초의 해류 맹약','#2fa0ff',4,[stage(2,{regeneration:2}),stage(4,{attackSpeed:6,hpPct:.08}),stage(6,{damagePct:.08},{name:'밀물의 박자',bonus:{skillCooldown:.12}})]],
 ['ancient-5','태초의 폭풍 맹약','#f0e050',5,[stage(2,{attackSpeed:6}),stage(4,{damagePct:.1,speed:6}),stage(6,{crit:5},{name:'뇌명 마무리',bonus:{finisher:.6}})]],
 ['ancient-6','태초의 황혼 맹약','#ffb020',6,[stage(2,{damagePct:.08}),stage(4,{hpPct:.12,damagePct:.06}),stage(6,{damagePct:.08},{name:'황혼의 의식',bonus:{skillDamage:.2,execute:.15}})]],
 ['raid-colossus','거신의 유산','#d9552b','colossus',[stage(2,{hpPct:.08}),stage(3,{reduction:4,hpPct:.06}),stage(5,{damagePct:.1},{name:'거신의 불굴',bonus:{lowHpGuard:.25,drain:.003}})]],
 ['raid-queen','군단 여왕의 유산','#8fae4a','queen',[stage(2,{attackSpeed:8}),stage(3,{crit:5,damagePct:.06}),stage(5,{speed:8,damagePct:.06},{name:'여왕의 연격',bonus:{finisher:.8}})]],
 ['raid-judge','심판관의 유산','#fff0b0','judge',[stage(2,{crit:5}),stage(3,{damagePct:.1}),stage(5,{hpPct:.1,damagePct:.06},{name:'최후 판결',bonus:{execute:.4}})]],
 ['raid-sovereign','악몽 군주의 유산','#8c4dff','sovereign',[stage(2,{damagePct:.08}),stage(3,{hpPct:.1,crit:5}),stage(5,{damagePct:.12},{name:'악몽의 군림',bonus:{skillDamage:.25,skillCooldown:.1}})]],
];
export const ANCIENT_SETS=Object.freeze(Object.fromEntries(ROWS.map(([id,name,color,source,stages])=>[id,Object.freeze({id,name,color,raid:typeof source==='string'?source:null,tier:typeof source==='number'?source:null,stages:Object.freeze(stages),pieces:stages.at(-1).pieces})])));
const ROW_BY_ID=new Map(ANCIENT_CATALOG.map(r=>[r.id,r]));
const setOfRow=row=>row?(row.raid?'raid-'+row.raid:'ancient-'+row.tier):null;
// The ancient catalog row an item counts as: an ancient itself, or the ancient a 승화 item was forged from.
function sourceRow(item){
 if(item?.rarity===5){const row=ROW_BY_ID.get(item.catalogId);return row&&row.slot===item.slot&&row.tier===item.tier?row:null;}
 if(item?.rarity===6&&typeof item.forge?.ancient==='string')return ROW_BY_ID.get(item.forge.ancient)??null;
 return null;
}
export function ancientSetOf(item){const id=setOfRow(sourceRow(item));return id&&ANCIENT_SETS[id]?id:null;}
// worn: equipped items. Returns {setId: distinct pieces}.
export function ancientSetCounts(worn){
 const seen={};for(const item of worn??[]){const row=sourceRow(item),id=setOfRow(row);if(id&&ANCIENT_SETS[id])(seen[id]??=new Set()).add(row.id);}
 return Object.fromEntries(Object.entries(seen).map(([id,rows])=>[id,rows.size]));
}
export function ancientSetStats(counts){
 const total={};for(const [id,count] of Object.entries(counts??{}))for(const s of ANCIENT_SETS[id]?.stages??[])if(count>=s.pieces)for(const [k,v] of Object.entries(s.stats))total[k]=(total[k]??0)+v;
 return total;
}
// The reached special effects, summed per treeBonus key.
export function ancientSetSpecial(counts){
 const total={};for(const [id,count] of Object.entries(counts??{}))for(const s of ANCIENT_SETS[id]?.stages??[])if(s.special&&count>=s.pieces)for(const [k,v] of Object.entries(s.special.bonus))total[k]=(total[k]??0)+v;
 return total;
}
export function ancientSetText(id,count=0){
 const set=ANCIENT_SETS[id];if(!set)return '';
 return set.stages.map(s=>(count>=s.pieces?'● ':'○ ')+s.pieces+'세트 · '+Object.entries(s.stats).map(([k,v])=>setStatText(k,v)).join(' · ')+(s.special?'\n   특수효과 「'+s.special.name+'」 '+bonusText(s.special.bonus):'')).join('\n');
}
