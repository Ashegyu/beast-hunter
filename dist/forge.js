// Alpha 0.142 승화 제작 (사용자 결정): 같은 부위 고대 장비 1개를 바쳐 고대보다 위의 제작 장비로 만든다.
// 새 장비는 바친 고대의 아이템 번호를 그대로 쓴다 — 착용 칸·저장 빌드·즐겨찾기가 끊기지 않고, 강화 수치·각인·사냥 난이도(정예·악몽)·
// 레이드 효과 위력도 이어진다. 기본 능력치는 고대 값의 1.2배를 승화 줄 범위 안으로 맞춘다.
import {ancientDefinition,itemRollRanges} from './loot.js?v=0.142.0';
import {inventoryItem} from './equipment-slots.js?v=0.142.0';
import {FORGE_EFFECTS,FORGE_POWER,forgeRow,forgeOpen,forgeTierOpen,forgeGateChapter} from './crafting.js?v=0.142.0';

// The forge row an ancient goes into: its region tier, or the raid row (6지역 ×1.1) for raid ancients.
export function forgeTarget(item){const row=item?.rarity===5?ancientDefinition(item):null;return row&&FORGE_EFFECTS[row.slot]?forgeRow(row.slot,row.raid?6:row.tier,!!row.raid):null;}
export function forgeStatus(profile,itemId,effectId){
 if(!forgeOpen(profile))return {ok:false,reason:'일반 60장을 모두 깨면 승화 제작이 열려.'};
 const item=inventoryItem(profile,itemId);if(!item)return {ok:false,reason:'바칠 고대 장비를 골라 줘.'};
 const row=forgeTarget(item);if(!row)return {ok:false,reason:'같은 부위 고대 장비만 승화할 수 있어.'};
 if(!FORGE_EFFECTS[row.slot].some(r=>r.id===effectId))return {ok:false,reason:'승화 효과를 골라 줘.',row};
 if(!forgeTierOpen(profile,row.tier,row.raidForge))return {ok:false,reason:'정예 '+forgeGateChapter(row.tier,row.raidForge)+'장 보스를 처치해야 '+(row.raidForge?'레이드':row.tier+'지역')+' 고대를 승화할 수 있어.',row};
 if(item.rerollCandidate)return {ok:false,reason:'수치작 결과를 먼저 정해 줘.',row};
 if(profile.gold<row.gold)return {ok:false,reason:'골드가 부족해.',row};
 for(const [key,count]of Object.entries(row.cost))if(!(profile.materials?.[key]>=count))return {ok:false,reason:'승화 재료가 부족해.',row};
 return {ok:true,reason:'모든 재료 준비 완료 · 확정 승화',row};
}
// The forged item that would replace `item` (no profile change). Same id, enhancement and inscription.
export function forgedItem(item,effectId){
 const row=forgeTarget(item),source=ancientDefinition(item);if(!row||!FORGE_EFFECTS[row.slot].some(r=>r.id===effectId))return null;
 const out={id:item.id,slot:row.slot,tier:row.tier,rarity:6,name:row.name,catalogId:row.id,artId:row.artId,affixes:{},rollVersion:1,forge:{ancient:source.id,effect:effectId},
  ...(item.hunt?{hunt:item.hunt}:{}),...(Number.isInteger(item.powerRoll)?{powerRoll:item.powerRoll}:{}),...(item.inscription?{inscription:item.inscription}:{})};
 for(const key of Object.keys(row.base))out.affixes[key]=Math.round((item.affixes?.[key]??0)*FORGE_POWER);
 const ranges=itemRollRanges(out);for(const [key,r]of Object.entries(ranges))out.affixes[key]=Math.max(r.min,Math.min(r.max,out.affixes[key]));
 if(item.enhancement>0){out.enhancement=item.enhancement;if(item.enhancementAffixes)out.enhancementAffixes={...item.enhancementAffixes};}
 return out;
}
