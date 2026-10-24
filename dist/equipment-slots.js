// Item types and wearable positions are separate: one earring identity can occupy either ear.
export const SLOTS=Object.freeze({weapon:'무기',helmet:'헬멧',armor:'상의',pants:'하의',boots:'신발',charm:'목걸이',earring:'귀걸이',special:'캐릭터 전용장비'});
export const EQUIPMENT_SLOTS=Object.freeze({weapon:'무기',helmet:'헬멧',armor:'상의',pants:'하의',boots:'신발',charm:'목걸이',earringLeft:'귀걸이 1',earringRight:'귀걸이 2',special:'전용장비'});
export const EQUIPMENT_KEYS=Object.freeze(Object.keys(EQUIPMENT_SLOTS));
export const STAGE_SLOTS=Object.freeze(['weapon','helmet','armor','pants','boots']);
export const itemSlotForPosition=position=>position==='earringLeft'||position==='earringRight'?'earring':Object.hasOwn(SLOTS,position)?position:null;
export const equipmentFamily=slot=>STAGE_SLOTS.includes(slot)&&slot!=='weapon'?'armor':slot==='earring'||slot==='special'?'charm':slot;
export const equipmentCategory=slot=>slot==='special'?'special':equipmentFamily(slot);
export const matchesEquipmentCategory=(item,category)=>category==='all'||equipmentCategory(item.slot)===category;
export const emptyEquipment=()=>Object.fromEntries(EQUIPMENT_KEYS.map(key=>[key,null]));
export const equippedPosition=(profile,item)=>item&&!(item.slot==='special'&&item.characterId!==(profile.characterId??'lirian'))?EQUIPMENT_KEYS.find(key=>profile.equipment?.[key]===item.id&&itemSlotForPosition(key)===item.slot)??null:null;
export const isEquippedItem=(profile,item)=>equippedPosition(profile,item)!==null;
export function equipmentAfterEquip(profile,item,position=null){
 if(!item||!Object.hasOwn(SLOTS,item.slot)||item.slot==='special'&&item.characterId!==(profile.characterId??'lirian'))return null;
 const positions=EQUIPMENT_KEYS.filter(key=>itemSlotForPosition(key)===item.slot);
 const target=position??equippedPosition(profile,item)??positions.find(key=>profile.equipment?.[key]==null)??positions[0];
 if(!positions.includes(target))return null;
 const next=Object.fromEntries(EQUIPMENT_KEYS.map(key=>[key,profile.equipment?.[key]??null]));
 for(const key of EQUIPMENT_KEYS)if(next[key]===item.id)next[key]=null;
 next[target]=item.id;return next;
}
export function restoreEquipment(raw,inventory,characterId='lirian'){
 const result=emptyEquipment(),used=new Set();
 for(const key of EQUIPMENT_KEYS){const id=raw?.[key],item=inventory.find(i=>i.id===id&&i.slot===itemSlotForPosition(key));
  if(!item||used.has(id)||item.slot==='special'&&item.characterId!==characterId)continue;
  result[key]=id;used.add(id);
 }return result;
}
export function equipmentAcquisition(item){
 // Ancient identity tier 2 drops in region 3 and tier 3 in region 2 (loot.js ANCIENT_REGION).
 if(item?.rarity===5){const region=[0,1,3,2][item.tier]??item.tier;return ((region-1)*10+1)+'~'+region*10+'장 보스 희귀 드롭';}
 if(item?.rarity===6)return '제작 전용';
 if(item?.slot==='special')return '던전 전용 · 낮은 획득 확률 · 추후 추가';
 if(item?.slot==='charm'||item?.slot==='earring')return '던전 전용 · 추후 추가';
 return item?.rarity>0?'일반 장비에서 승급':'스테이지 · 일반 등급 드롭';
}
