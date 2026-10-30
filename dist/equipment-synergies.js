import {EQUIPMENT_KEYS} from './equipment-slots.js?v=0.148.4';
import {uniqueLoadout} from './loot.js?v=0.148.4';
import {equipmentArt} from './chapters.js?v=0.148.4';

export const EQUIPMENT_SYNERGIES=Object.freeze([
 Object.freeze({id:'shatter',name:'빙결 파쇄',color:'#a5eaff',cooldown:1.5,bonus:.65,bossBonus:.3,
  requirement:'빙결을 거는 장비 + 다른 슬롯의 연격·축전 / 뇌격·회전 장비',
  description:'이미 빙결된 적에게 강공격·3연격 마무리. 빙결을 소비해 피해 +65% (보스 +30%). 재사용 1.5초.'}),
 Object.freeze({id:'execute',name:'출혈 처형',color:'#ff9aa5',cooldown:2,bonus:.8,bossBonus:.4,
  requirement:'출혈을 거는 장비 + 다른 슬롯의 추격 / 처형 장비',
  description:'출혈 중인 체력 35% 이하 적에게 강공격·3연격 마무리. 출혈 소비, 피해 +80%, 기력 +12. 보스는 체력 18% 이하 / 피해 +40%. 재사용 2초.'}),
]);
const SLOTS=EQUIPMENT_KEYS;
// Capabilities come from authored identities, never from arbitrary saved tags.
export function equipmentSynergies(profile){
 const loadout=uniqueLoadout(profile),tags=Object.fromEntries(SLOTS.map(slot=>[slot,[]]));
 const weapon=profile.inventory.find(i=>i.slot==='weapon'&&i.id===profile.equipment.weapon),art=weapon?equipmentArt(weapon)?.id:null;
 if(art==='frost_blade')tags.weapon.push('frost');
 if(art==='forest_blade'||art==='ruins_blade')tags.weapon.push('bleed');
 for(const slot of SLOTS){const spec=loadout[slot],id=spec?.definition.id,r=(spec?.ancient??spec?.crafted??spec?.seal)?.signature;
  if(id==='frostNova'||id==='frostWard'||r?.chill)tags[slot].push('frost');
  if(r?.bleed)tags[slot].push('bleed');
  if(['focus','capacitor','storm','whirlwind'].includes(id))tags[slot].push('shatter');
  if(id==='execution'||id==='hunter')tags[slot].push('execute');
 }
 return Object.freeze(EQUIPMENT_SYNERGIES.flatMap(row=>{
  const setup=row.id==='shatter'?'frost':'bleed';
  for(const source of SLOTS)for(const payoff of SLOTS)if(source!==payoff&&tags[source].includes(setup)&&tags[payoff].includes(row.id))return [Object.freeze({...row,source,payoff})];
  return [];
 }));
}
