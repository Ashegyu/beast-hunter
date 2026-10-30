import {SLOTS,EQUIPMENT_KEYS,STAGE_SLOTS,itemSlotForPosition,isEquippedItem,equipmentFamily,inventoryItem} from './equipment-slots.js?v=0.148.1';
import {CRAFTED_CATALOG,craftedDefinition,FORGE_EFFECT_BY_ID,FORGE_EFFECT_POWER,FORGE_AWAKEN_POWER} from './crafting.js?v=0.148.1';
import {ANCIENT_POWER,ANCIENT_STATS} from './ancient-stats.js?v=0.148.1';
export {CRAFTED_CATALOG,craftedDefinition} from './crafting.js?v=0.148.1';
import {huntMode,BOSS_DROP_TABLES} from './hunt-modes.js?v=0.148.1';
import {UNIQUE_EFFECTS,EFFECT_ROWS,uniquePower} from './unique-effects.js?v=0.148.1';
import {ANCIENT_POWER_BY_ID,NIGHTMARE_POWERS,RAID_POWERS as BASE_RAID_POWERS,RAID_AWAKEN_POWERS as BASE_RAID_AWAKEN,RAID_ABYSS_POWERS,describePower,SOVEREIGN_RAID_POWERS,SOVEREIGN_AWAKEN} from './ancient-powers.js?v=0.148.1';
const RAID_POWERS={...BASE_RAID_POWERS,...SOVEREIGN_RAID_POWERS},RAID_AWAKEN_POWERS={...BASE_RAID_AWAKEN,sovereign:SOVEREIGN_AWAKEN};
import {RAID_ANCIENTS,RAID_REGION,RAID_ANCIENT_STATS} from './raids.js?v=0.148.1';
import {REGION_ANCIENTS,REGION_ANCIENT_BOSSES} from './ancient-regions.js?v=0.148.1';
import {EQUIPMENT_SETS,SET_SLOTS,setArtId} from './equipment-sets.js?v=0.148.1';
import {isSeal,sealSignatures,SEAL_GRADES} from './seals.js?v=0.148.1';
export {EQUIPMENT_SETS,SET_SLOTS,SET_STATS,CHAPTER_SETS,setArtId,setBonusStats,setBonusText} from './equipment-sets.js?v=0.148.1';
export {UNIQUE_EFFECTS,uniquePower} from './unique-effects.js?v=0.148.1';
// Item definitions and pure rolls; the combat state owns identities and delivery.
import {INVENTORY_LIMIT,MAX_PENDING_LOOT,cleanBagRules} from './inventory-rules.js?v=0.148.1';
export {INVENTORY_LIMIT,MAX_PENDING_LOOT} from './inventory-rules.js?v=0.148.1';
// Alpha 0.120: 극옵 (every rolled stat at its maximum) comes only from this 1% draw; ordinary rolls stop one below the maximum.
export const LEGENDARY_PITY_LIMIT=100,PERFECT_ROLL_CHANCE=.01;
// Per-item stat caps. Alpha 0.120 raised flat damage/HP (80/250) so late tiers, mythic promotions and hunt modes keep their spread.
export const AFFIX_CAPS=Object.freeze({damage:150,hp:500});
export const affixCap=key=>AFFIX_CAPS[key]??25;
// A non-perfect roll lands in [min, max-1]; the perfect draw takes max.
const rollWithin=(range,n,perfect)=>perfect?range.max:range.min+Math.min(range.max-range.min-1,Math.floor(n*(range.max-range.min)));
export const RARITY_INFO=Object.freeze([
 {name:'일반',color:'#c5d0c9',beam:0,power:1,particles:0,rings:1,ttl:1.2},
 {name:'희귀',color:'#399bff',beam:85,power:1.3,particles:4,rings:1,ttl:1.4},
 {name:'영웅',color:'#ad66ff',beam:130,power:1.65,particles:6,rings:2,ttl:2},
 {name:'전설',color:'#ffd94d',beam:190,power:2.1,particles:10,rings:2,ttl:2.4},
 {name:'신화',color:'#ff4d4d',beam:240,power:2.65,particles:12,rings:3,ttl:2.8},
 {name:'고대',color:'#ff8b35',beam:330,power:3.65,particles:20,rings:4,ttl:3.6},
 {name:'제작',color:'#48d472',beam:420,power:4.2,particles:24,rings:5,ttl:4},
].map(r=>Object.freeze({...r,beamFill:r.color+'44',beamCore:r.color+'cc'})));
export const RARITIES=Object.freeze(RARITY_INFO.map(r=>r.name));
export const DROP_TABLES=Object.freeze({normal:Object.freeze([60,27,10,2.5,.4,.1]),elite:Object.freeze([0,65,27,7,.85,.15]),boss:BOSS_DROP_TABLES[0],stage:Object.freeze([50,35,12,2.5,.4,.1])});
const chapterNames=[
 [['붉은 잎 검','가시꽃 검','오크 송곳니 검','사냥꾼 대검','겨울씨앗 검','숲바람 장검','황혼의 메아리','번개나무 검','단죄의 송곳니','혈월 가시검','서리싹 대검','폭풍잎 검'],['숲지기 흉갑','늑대가죽 갑옷','오크 갑각갑옷','생명수 흉갑','불멸의 나무껍질','정적의 이끼갑옷','그림자 순찰복','오크 가시갑옷','반격의 사냥복','얼음덩굴 흉갑','수호령의 갑옷','숨결의 흉갑'],['가시 호박 부적','숲의 심장','맹수의 이빨','바람 깃털','별꽃 목걸이','수집가의 눈','돌풍 호박','연격의 이빨','고대 충격핵','늑대왕 인장','밤하늘 가지','생명수 씨앗']],
 [['묘지의 은검','순례자의 은검','망령의 룬검','무덤 기사의 검','왕실 처형검','망자의 혈검','고요한 빙검','망령 폭풍검','종소리 은검','뇌명의 룬검','심판의 장검','붉은 순례검'],['죽음의 기사 흉갑','망자 사냥꾼 갑옷','왕실 판금갑옷','순례자 흉갑','왕의 유언 갑옷','회복의 장례복','망령 순찰갑','뼛가시 갑옷','결투자의 판금','차가운 영혼갑','불사 기사갑','은총의 흉갑'],['왕의 봉인','사령술사의 눈','망령 송곳니','방랑자의 인장','영혼 궤도석','묘지 수집가의 눈','망령 발걸음','은빛 호흡석','봉인된 축전핵','사냥꾼의 유언','왕좌의 별','순례자의 등불']],
 [['빙결 수정검','눈꽃 수정검','서리 송곳니 검','빙하 파쇄검','영원의 결빙검','눈보라 검','빙룡의 메아리','극광 뇌검','서리 처형검','붉은 얼음검','수정 해일검','백야 회전검'],['빙하 판금 흉갑','설원 원정대 갑옷','골렘 핵갑옷','서리결 흉갑','빙룡의 불멸갑','고요한 눈갑옷','극광 회피복','결정 가시갑','골렘 반격갑','겨울 수호갑','왕좌의 유언','눈꽃 회복갑'],['눈꽃 룬','빙원의 심장','빙룡의 이빨','눈보라 깃털','극광 별무리','빙원 수집석','백야의 기세','서리 연격룬','영구동토 충격핵','빙룡 추격인','눈의 위성','해빙의 맥박']],
];
const artRows=[['forest_blade','forest_fang','forest_armor','forest_charm'],['ruins_blade','ruins_rune','ruins_armor','ruins_charm'],['frost_blade','frost_fang','frost_armor','frost_charm']];
// Alpha 0.120: weapon designs share one budget (damage plus a secondary stat), measured on real waves; the average
// damage stays at the 0.119 level so the campaign difficulty does not shift.
const patterns={weapon:[{damage:10,crit:3},{damage:10,speed:4},{damage:11,crit:1},{damage:10,hp:12}],armor:[{hp:25,reduction:2},{hp:18,speed:3},{hp:30,reduction:3},{hp:32,crit:2}],charm:[{speed:4,crit:2},{hp:20,reduction:2},{damage:5,crit:3},{speed:6,hp:10}]};
const legacyCatalog=chapterNames.flatMap((groups,t)=>groups.flatMap((names,slotIndex)=>{
 const slot=['weapon','armor','charm'][slotIndex];return names.map((name,i)=>Object.freeze({id:`${t+1}-${slot}-${i+1}`,name,slot,tier:t+1,artId:artRows[t][slotIndex===0?(i<4?(i<2?0:1):i%2):slotIndex+1],base:Object.freeze(patterns[slot][i%4]),effectId:EFFECT_ROWS[slot][i%6]}));
}));
const additionalParts=Object.keys(SLOTS).filter(slot=>!['weapon','armor','charm'].includes(slot));
const BASE_CATALOG=Object.freeze([...legacyCatalog,...[1,2,3].flatMap(tier=>additionalParts.map(slot=>Object.freeze({id:`${tier}-${slot}-1`,name:slot==='special'?['리리안의 적월 인장','리리안의 망령 인장','리리안의 서리 인장'][tier-1]:['숲지기의 ','폐성 수호자의 ','서리결 '][tier-1]+SLOTS[slot],slot,tier,artId:equipmentFamily(slot)==='armor'?artRows[tier-1][2]:`acc_t${tier}_${slot==='special'?'seal':'earring'}`,base:Object.freeze(slot==='helmet'?{hp:12,reduction:1}:slot==='pants'?{hp:15,reduction:1}:slot==='boots'?{hp:8,speed:2}:slot==='earring'?{damage:3,crit:1}:{damage:5,hp:10}),effectId:null,signatureOnly:true,...(slot==='special'?{characterId:'lirian'}:{})}))) ]);
// Region 4-6 accessories (Alpha 0.122): one necklace per charm power, an earring and a Lilian seal per region.
// They drop from growth dungeons like the tier 1-3 accessories; ancients stay derived from BASE_CATALOG only.
const ACCESSORY_NAMES=[
 ['파도의 기세 진주','심해 호흡 목걸이','해류 축전 진주','추적자의 소라','물방울 별무리','조수 수집 진주','심해 산호 귀걸이','리리안의 해류 인장'],
 ['돌풍 기세 깃목걸이','창공 호흡석','뇌운 축전석','매의 추적 깃','폭풍 별무리','바람 수집석','뇌운 귀걸이','리리안의 뇌운 인장'],
 ['여명의 기세 원반','성휘 호흡석','황혼 축전핵','신역 추적 목걸이','천상 별무리','은총 수집 원반','황혼 성륜 귀걸이','리리안의 성휘 인장'],
];
export const ACCESSORY_CATALOG=Object.freeze(ACCESSORY_NAMES.flatMap((names,r)=>{const tier=r+4;return [
 ...EFFECT_ROWS.charm.map((effectId,i)=>Object.freeze({id:`${tier}-charm-${i+1}`,name:names[i],slot:'charm',tier,artId:`acc_t${tier}_charm`,base:Object.freeze(patterns.charm[i%4]),effectId})),
 Object.freeze({id:`${tier}-earring-1`,name:names[6],slot:'earring',tier,artId:`acc_t${tier}_earring`,base:Object.freeze({damage:3,crit:1}),effectId:null,signatureOnly:true}),
 Object.freeze({id:`${tier}-special-1`,name:names[7],slot:'special',tier,artId:`acc_t${tier}_seal`,base:Object.freeze({damage:5,hp:10}),effectId:null,signatureOnly:true,characterId:'lirian'}),
];}));
// Region 1-3 dungeon accessories (Alpha 0.140): the tier 1-3 base charms keep the 0.9 family art and the base tier 2/3
// families (폐성/서리) sit in the wrong regions (불과 얼음/어둠의 심연), so growth dungeons of regions 1-3 roll these
// region rows instead: six necklaces (one per charm power) and, for regions 2-3, a region earring. Base rows stay
// for ancients, crafting and saved items.
const REGION_ACCESSORY_NAMES=[
 ['적엽 기세 목걸이','숲숨결 호박','가시덩굴 축전석','사냥개 추적 이빨','반딧불 별무리','낙엽 수집 호박'],
 ['화빙 기세 목걸이','용암 호흡석','빙염 축전핵','불새 추적 깃','불티 별무리','서리불 수집석','화빙 결정 귀걸이'],
 ['심연 기세 목걸이','망령 호흡석','공허 축전핵','그림자 추적 송곳니','혼불 별무리','심연 수집석','심연 혼불 귀걸이'],
];
export const REGION_ACCESSORY_CATALOG=Object.freeze(REGION_ACCESSORY_NAMES.flatMap((names,r)=>{const tier=r+1;return [
 ...EFFECT_ROWS.charm.map((effectId,i)=>Object.freeze({id:`${tier}-necklace-${i+1}`,name:names[i],slot:'charm',tier,artId:`acc_t${tier}_charm`,base:Object.freeze(patterns.charm[i%4]),effectId,dungeon:true})),
 ...(names[6]?[Object.freeze({id:`${tier}-earring-2`,name:names[6],slot:'earring',tier,artId:`acc_r${tier}_earring`,base:Object.freeze({damage:3,crit:1}),effectId:null,signatureOnly:true,dungeon:true})]:[]),
];}));
// Chapter set pieces (Alpha 0.108/0.109): per set two weapon designs × two names and two names per armor part.
// They carry `set` and drop only in their chapter; ancient identities stay derived from the base catalog.
// Base stats follow the set's style; `power` raises them slightly for later chapters of a region.
const SET_STYLES=Object.freeze({
 swift:{weapon:[{damage:10,speed:4},{damage:10,crit:2}],armor:{hp:22,speed:3},helmet:{hp:10,speed:2},pants:{hp:13,speed:2},boots:{hp:7,speed:3}},
 fierce:{weapon:[{damage:11,crit:1},{damage:10,crit:2}],armor:{hp:26,crit:2},helmet:{hp:11,crit:1},pants:{hp:14,crit:1},boots:{hp:8,crit:1}},
 guard:{weapon:[{damage:10,hp:12},{damage:9,hp:16}],armor:{hp:32,reduction:3},helmet:{hp:14,reduction:1},pants:{hp:17,reduction:1},boots:{hp:10,reduction:1}},
 keen:{weapon:[{damage:9,crit:4},{damage:10,crit:3}],armor:{hp:24,crit:3},helmet:{hp:11,crit:2},pants:{hp:14,crit:1},boots:{hp:8,crit:2}},
 vital:{weapon:[{damage:9,hp:18},{damage:10,hp:14}],armor:{hp:38},helmet:{hp:17},pants:{hp:20},boots:{hp:12,speed:1}},
 brute:{weapon:[{damage:12},{damage:11,hp:6}],armor:{hp:24,damage:2},helmet:{hp:10,damage:1},pants:{hp:13,damage:1},boots:{hp:7,damage:1}},
});
const setBase=(set,stats)=>Object.freeze(Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,Math.max(1,Math.round(v*set.power))])));
export const SET_CATALOG=Object.freeze(Object.values(EQUIPMENT_SETS).flatMap(set=>SET_SLOTS.flatMap(slot=>slot==='weapon'
 ?set.names.weapon.flatMap((names,variant)=>names.map((name,i)=>Object.freeze({id:`set-${set.id}-weapon-${variant*2+i+1}`,name,slot,tier:set.tier,artId:setArtId(set.id,slot,variant),set:set.id,base:setBase(set,SET_STYLES[set.style].weapon[variant]),effectId:EFFECT_ROWS.weapon[(set.effectOffset+variant*2+i)%6]})))
 :set.names[slot].map((name,i)=>Object.freeze({id:`set-${set.id}-${slot}-${i+1}`,name,slot,tier:set.tier,artId:setArtId(set.id,slot),set:set.id,base:setBase(set,SET_STYLES[set.style][slot]),...(slot==='armor'?{effectId:EFFECT_ROWS.armor[(set.effectOffset+i)%6]}:{effectId:null,signatureOnly:true})})))));
export const ITEM_CATALOG=Object.freeze([...BASE_CATALOG,...ACCESSORY_CATALOG,...REGION_ACCESSORY_CATALOG,...SET_CATALOG]);
// Ordinary identity and quality are independent. Ancient identities have no quality variants.
const ancientKey=row=>[row.tier,row.slot,row.artId,row.effectId].join(':');
const VISUAL_STYLE=Object.freeze({echo:3,storm:5,execution:6,blood:4,frostNova:5,whirlwind:6,barrier:3,thorns:4,pulse:6,frostWard:5,lastStand:6,recovery:3,momentum:3,focus:4,capacitor:5,hunter:4,orbit:6,magnet:5});
// Alpha 0.110: three stats per slot instead of all five (several ancients used to cap crit and
// reduction at 50%), at 2.9× instead of 3.65× — above a promoted mythic set piece, below the old values.
// Alpha 0.112: ancient numbering follows the 0.107 regions. The base catalog's tier 2 is the ruined-castle family and
// tier 3 the frost family; as ancients they become tier 3 (어둠의 심연) and tier 2 (불과 얼음의 땅). Names and art
// stay with their family (the art id still names the base art). ANCIENT_TIER_OF_BASE is its own inverse.
const ANCIENT_TIER_OF_BASE=Object.freeze({1:1,2:3,3:2});
export const ancientIdOfBase=id=>id.replace(/^(ancient-)?([123])-/,(_,prefix,t)=>(prefix??'')+ANCIENT_TIER_OF_BASE[t]+'-');

// Alpha 0.121: an ancient's power grows with its region tier (+10% per tier: 1.0 … 1.5) and with the hunt mode it
// was earned on (정예 ×1.15, 악몽 ×1.3 plus a second power from NIGHTMARE_POWERS). Only amounts scale (damage, heal,
// shield, fury, haste); triggers, cooldowns, radii and control effects stay as authored.
export const ANCIENT_TIER_POWER=Object.freeze([1,1.1,1.2,1.3,1.4,1.5]);
export const ANCIENT_HUNT_POWER=Object.freeze([1,1.15,1.3]);
// Alpha 0.139: raid ancients of the 정예/악몽 raid tiers (their `hunt`): signature power ×1.2/×1.4 (stats use HUNT_POWER).
export const RAID_TIER_POWER=Object.freeze([1,1.2,1.4]);
const SCALED_POWER_KEYS=['damage','heal','shield','fury','haste'];
function scalePower(r,factor,extra={}){
 const out={...r,...extra};for(const k of SCALED_POWER_KEYS)if(r[k])out[k]=Math.round(r[k]*factor*1000)/1000;
 return Object.freeze({...out,description:describePower(out)});
}
const ancientRows=new Map(),ancientDrafts=[];
for(const row of BASE_CATALOG){const key=ancientKey(row);if(ancientDrafts.some(d=>d.key===key))continue;ancientDrafts.push({key,row,tier:ANCIENT_TIER_OF_BASE[row.tier],part:!!row.signatureOnly,order:ancientDrafts.length});}
// Catalog order: the 60 weapon/armor/charm ancients by tier, then the 0.97 parts by tier.
ancientDrafts.sort((a,b)=>a.part-b.part||a.tier-b.tier||a.order-b.order);
for(const {key,row,tier}of ancientDrafts){const id='ancient-'+tier+row.id.slice(String(row.tier).length),base={},scale=(.76+tier*.24)*ANCIENT_POWER,values=ANCIENT_STATS[row.slot];for(const [k,v]of Object.entries(values))base[k]=Math.round(v*scale);const ordinal=ancientRows.size;ancientRows.set(key,Object.freeze({...row,tier,region:tier,id,name:'태초의 '+row.name,base:Object.freeze(base),visualStyle:VISUAL_STYLE[row.effectId]??3,ancient:true,ordinal,signature:ANCIENT_POWER_BY_ID[id]?scalePower(ANCIENT_POWER_BY_ID[id],ANCIENT_TIER_POWER[tier-1]):Object.freeze({id,index:60+ordinal,color:'#ffb66b',name:'태초의 맥동',trigger:row.slot==='special'?'periodic':'dash',cooldown:10,damage:.18,radius:140,description:row.slot==='special'?'전투 중 10초마다 주변에 기본 공격력 18% 피해.':'회피 시 주변에 기본 공격력 18% 피해. 재사용 10초.'}),bossId:['forest_guardian','frost_king','ruins_king'][tier-1]}));}
// Alpha 0.119: regions 4-6 have authored ancients (ancient-regions.js) with the same stat rules, keyed by id.
for(const row of REGION_ANCIENTS){const scale=(.76+row.tier*.24)*ANCIENT_POWER,base={};for(const [k,v]of Object.entries(ANCIENT_STATS[row.slot]))base[k]=Math.round(v*scale);const part=!['weapon','armor','charm'].includes(row.slot),ordinal=ancientRows.size;
 ancientRows.set(row.id,Object.freeze({...row,name:'태초의 '+row.name,region:row.tier,base:Object.freeze(base),effectId:row.effectId??null,...(part?{signatureOnly:true}:{}),...(row.slot==='special'?{characterId:'lirian'}:{}),visualStyle:VISUAL_STYLE[row.effectId]??3,ancient:true,ordinal,signature:scalePower(ANCIENT_POWER_BY_ID[row.id],ANCIENT_TIER_POWER[row.tier-1]),bossId:REGION_ANCIENT_BOSSES.find(b=>b.tier===row.tier).id}));}
// Alpha 0.123: raid-only ancients (raids.js) — region 7 in the codex, never in a chapter boss pool.
for(const row of RAID_ANCIENTS){const scale=(.76+row.tier*.24)*ANCIENT_POWER*RAID_ANCIENT_STATS,base={};for(const [k,v]of Object.entries(ANCIENT_STATS[row.slot]))base[k]=Math.round(v*scale);const part=!['weapon','armor','charm'].includes(row.slot),ordinal=ancientRows.size;
 ancientRows.set(row.id,Object.freeze({...row,name:'태초의 '+row.name,region:RAID_REGION,base:Object.freeze(base),...(part?{signatureOnly:true}:{}),...(row.slot==='special'?{characterId:'lirian'}:{}),visualStyle:VISUAL_STYLE[row.effectId]??6,ancient:true,ordinal,signature:RAID_POWERS[row.id],bossId:'raid-'+row.raid}));}
export const ANCIENT_CATALOG=Object.freeze([...ancientRows.values()]);
const ANCIENT_BY_ID=new Map(ANCIENT_CATALOG.map(r=>[r.id,r]));
export const BOSS_LOOT=Object.freeze([...['세계수의 수호령','빙원의 지배자','무덤의 왕'].map((name,i)=>({id:['forest_guardian','frost_king','ruins_king'][i],name,tier:i+1})),...REGION_ANCIENT_BOSSES].map(b=>Object.freeze({id:b.id,name:b.name,tier:b.tier,items:Object.freeze(ANCIENT_CATALOG.filter(r=>r.tier===b.tier&&!r.raid))})));
export function bossLootPool(bossId,tier){const boss=BOSS_LOOT.find(b=>b.id===bossId&&b.tier===tier);if(!boss)throw new RangeError('Boss loot identity does not match chapter');return boss.items;}
export function ancientDefinition(item){const row=ANCIENT_BY_ID.get(item?.catalogId);return row&&row.slot===item.slot&&row.tier===item.tier&&row.artId===item.artId?row:null;}
export function ancientForLegacy(item){const row=CATALOG_BY_ID.get(item.catalogId),matching=row&&row.slot===item.slot&&row.tier===item.tier&&row.artId===item.artId;return ancientRows.get(ancientKey(matching?row:{...item,effectId:LEGACY_EFFECT[item.artId]}))??null;}
// The powers an owned ancient actually carries: its tier-scaled signature, raised by the hunt mode it was earned on,
// plus the 악몽 second power. Crafted gear keeps its fixed signature. Ids double as cooldown keys.
export const raidPowerRoll=item=>Number.isInteger(item?.powerRoll)?Math.max(RAID_POWER_ROLL.min,Math.min(RAID_POWER_ROLL.max,item.powerRoll)):100;
// Alpha 0.142 승화: the ancient a forged item was made from, rebuilt from the saved `forge` record.
export function forgeSource(item){const crafted=item?.rarity===6?craftedDefinition(item):null,row=crafted?.forge?ANCIENT_BY_ID.get(item.forge?.ancient):null;if(!row||row.slot!==item.slot||!!row.raid!==crafted.raidForge||(!row.raid&&row.tier!==crafted.tier))return null;
 return {rarity:5,catalogId:row.id,slot:row.slot,tier:row.tier,artId:row.artId,name:row.name,affixes:{},...(huntGrade(item)?{hunt:huntGrade(item)}:{}),...(row.raid?{powerRoll:raidPowerRoll(item)}:{})};}
export function forgeSignature(item,key='effect'){const crafted=item?.rarity===6?craftedDefinition(item):null,r=crafted?.forge?FORGE_EFFECT_BY_ID[item.forge?.[key]]:null;if(!r||!r.id.startsWith('forge-'+item.slot+'-')||key==='awaken'&&r.id===item.forge.effect)return null;
 return scalePower(r,ANCIENT_TIER_POWER[crafted.tier-1]*ANCIENT_HUNT_POWER[huntGrade(item)]*FORGE_EFFECT_POWER*(crafted.raidForge?RAID_ANCIENT_STATS:1)*(item.forge.awaken?FORGE_AWAKEN_POWER:1),key==='awaken'?{id:r.id+'-awaken'}:{});}
export function ancientSignatures(item){
 const crafted=item?.rarity===6?craftedDefinition(item):null;if(crafted?.forge){const source=forgeSource(item),own=forgeSignature(item),awake=item.forge?.awaken?forgeSignature(item,'awaken'):null;return [...(source?ancientSignatures(source):[]),...(own?[own]:[]),...(awake?[awake]:[])];}if(crafted)return [crafted.signature];
 const row=ancientDefinition(item);if(!row)return [];if(row.raid){const tier=huntGrade(item),roll=raidPowerRoll(item)/100,list=[scalePower(row.signature,roll*RAID_TIER_POWER[tier])];
  // Alpha 0.139: 정예 raid ancients add the raid's 각성 power, 악몽 ones also the slot family's 심연 power (both follow the roll).
  if(tier>=1)list.push(scalePower(RAID_AWAKEN_POWERS[row.raid],roll*RAID_TIER_POWER[tier],{id:row.id+'-awaken',color:RAID_AWAKEN_POWERS[row.raid].color}));
  if(tier>=2){const family=equipmentFamily(row.slot);list.push(scalePower(RAID_ABYSS_POWERS[family],roll*RAID_TIER_POWER[tier],{id:row.id+'-abyss',color:RAID_ABYSS_POWERS[family].color}));}
  return list;}const hunt=huntGrade(item);if(!hunt)return [row.signature];
 const list=[scalePower(row.signature,ANCIENT_HUNT_POWER[hunt])];
 if(hunt===2){const family=equipmentFamily(row.slot);list.push(scalePower(NIGHTMARE_POWERS[family],ANCIENT_TIER_POWER[row.tier-1]*ANCIENT_HUNT_POWER[hunt],{id:row.id+'-nightmare',color:NIGHTMARE_POWERS[family].color}));}
 return list;
}
// Alpha 0.136: ancient seals no longer drop (seals come only from the boss rush); a caller naming the slot still gets one.
export function rollAncient({id,tier,slot,bossId,hunt=0,raid=null},pick,rng=null){
 const pool=raid?ANCIENT_CATALOG.filter(r=>r.raid===raid):bossId?bossLootPool(bossId,tier):ANCIENT_CATALOG.filter(r=>!r.raid),choices=pool.filter(r=>r.tier===tier&&(slot?r.slot===slot:r.slot!=='special')),base=choices[Math.min(choices.length-1,Math.floor(pick*choices.length))];
 if(!base)throw new RangeError('Unknown ancient chapter/slot');
 const power=HUNT_POWER[hunt]??1,item={id,slot:base.slot,tier:base.tier,rarity:5,name:base.name,catalogId:base.id,artId:base.artId,affixes:Object.fromEntries(Object.entries(base.base).map(([k,v])=>[k,Math.min(affixCap(k),Math.round(v*power))])),rollVersion:1,...(hunt?{hunt}:{}),...(base.characterId?{characterId:base.characterId}:{})};
 if(rng){const forced=(pick*choices.length)%1<PERFECT_ROLL_CHANCE;for(const [key,range]of Object.entries(itemRollRanges(item))){const n=skewed(item,rng());item.affixes[key]=rollWithin(range,n,forced);}if(base.raid)item.powerRoll=rollRaidPower(rng(),forced);}
 else if(base.raid)item.powerRoll=100;
 if(isPerfectRoll(item))item.perfect=true;return item;
}
export function rollRarity(source,rng,minimum=0,difficulty=0){const mode=huntMode(difficulty);if(!mode)throw new RangeError('Unknown hunt mode');const weights=source==='boss'?BOSS_DROP_TABLES[mode.id]:DROP_TABLES[source]??DROP_TABLES.normal,floor=Number.isInteger(minimum)?Math.max(0,Math.min(5,minimum)):0;let value=rng()*100;for(let i=0;i<weights.length;i++){value-=weights[i];if(value<0)return Math.max(floor,i);}return weights.length-1;}
export function rollItem({id,tier,slot,set=null,source='normal',minimum=0,bossId,difficulty=0,quality=null,hunt=0,dungeon=false},rng){
 if(!huntMode(difficulty))throw new RangeError('Unknown hunt mode');if(bossId)bossLootPool(bossId,tier);
 // A set asks for that set's pieces; otherwise only the original (pre-0.108) identities roll.
 // Alpha 0.140: dungeon accessories prefer the region rows of their tier when it has any for the slot.
 let choices=ITEM_CATALOG.filter(i=>(set?i.set===set:!i.set&&i.tier===tier)&&(!slot||i.slot===slot));
 if(dungeon&&choices.some(i=>i.dungeon))choices=choices.filter(i=>i.dungeon);
 const pick=rng(),base=choices[Math.min(choices.length-1,Math.floor(pick*choices.length))];
 if(!base)throw new RangeError('Unknown loot chapter/slot');
 const draw=rollRarity(source,rng,minimum,difficulty),rarity=quality===null?draw:quality;if(rarity===5)return rollAncient({id,tier,slot,bossId,hunt},pick,rng);
 // The fractional family pick is uniform within each family. Reuse it for
 // quality without consuming another random draw or changing later rolls.
 const perfect=(pick*choices.length)%1<PERFECT_ROLL_CHANCE;
 const affixes={},scale=(.76+tier*.24)*RARITY_INFO[rarity].power;
 for(const [key,value]of Object.entries(base.base)){const n=rng(),range=affixRange(base,rarity,key,hunt);affixes[key]=rollWithin(range,n,perfect);}
 const targets=[2,2,3,4,5,5,5],extra={damage:3,hp:12,speed:2,crit:2,reduction:1},keys=Object.keys(extra).filter(k=>!Object.hasOwn(affixes,k));
 while(Object.keys(affixes).length<targets[rarity]&&keys.length){const k=keys.splice(Math.min(keys.length-1,Math.floor(rng()*keys.length)),1)[0],n=rng(),range=affixRange(base,rarity,k,hunt);affixes[k]=rollWithin(range,n,perfect);}
 for(const k of Object.keys(affixes))affixes[k]=Math.min(affixCap(k),affixes[k]);
 const prefix=rarity>=1?['날카로운','견고한','바람의','행운의','수호의'][Math.min(4,Math.floor(rng()*5))]+' ':'';
 const item={id,slot:base.slot,tier,rarity,name:prefix+base.name,catalogId:base.id,artId:base.artId,affixes,rollVersion:1,...(hunt?{hunt}:{}),...(base.characterId?{characterId:base.characterId}:{})};if(isPerfectRoll(item)){item.perfect=true;item.name='완벽한 '+base.name;}return item;
}
// The stage delivery boundary cannot produce accessories, special or ancient gear (grades above 일반 only on 정예/악몽).
// Alpha 0.113: harder hunt modes roll higher grades too (weights for 일반..전설; 신화 never drops, only promotion). Normal mode stays common
// and draws no extra number, so normal-mode loot sequences are unchanged.
export const HUNT_GRADE_TABLES=Object.freeze([[100],[55,35,10],[20,40,30,10]].map(Object.freeze));
export function rollStageItem({id,tier,slot=null,set=null,hunt=0},rng){
 if(slot!==null&&!STAGE_SLOTS.includes(slot))throw new RangeError('Stage equipment type is not available');
 const type=slot??STAGE_SLOTS[Math.min(STAGE_SLOTS.length-1,Math.floor(rng()*STAGE_SLOTS.length))],grade=Number.isInteger(hunt)&&hunt>0&&hunt<HUNT_GRADE_TABLES.length?hunt:0;
 let quality=0;if(grade){const table=HUNT_GRADE_TABLES[grade];let value=rng()*100;quality=table.length-1;for(let i=0;i<table.length;i++){value-=table[i];if(value<0){quality=i;break;}}}
 return rollItem({id,tier,slot:type,set,source:'stage',quality,hunt:grade},rng);
}
// Accessories (necklace, earring) come from growth dungeons (Alpha 0.122): a chance per clear, never guaranteed. Alpha 0.136: Lilian seals left this pool (보스 러시 only).
// `grade` picks the rarity table like a hunt mode (dungeon 4+ → 정예 table, 7+ → 악몽 table) but stats stay hunt 0.
export const DUNGEON_ACCESSORY_CHANCE=.4,ACCESSORY_SLOT_WEIGHTS=Object.freeze([['charm',.5],['earring',.5]]);
export function rollAccessory({id,tier,grade=0},rng){
 let value=rng(),slot='earring';for(const [s,w]of ACCESSORY_SLOT_WEIGHTS){value-=w;if(value<0){slot=s;break;}}
 let quality=0;if(grade>0&&grade<HUNT_GRADE_TABLES.length){const table=HUNT_GRADE_TABLES[grade];let roll=rng()*100;quality=table.length-1;for(let i=0;i<table.length;i++){roll-=table[i];if(roll<0){quality=i;break;}}}
 return rollItem({id,tier,slot,source:'stage',quality,hunt:0,dungeon:true},rng);
}
const SCORE_WEIGHT=Object.freeze({damage:5,hp:.5,speed:3,crit:4,reduction:5});
export function itemPower(item){if(isSeal(item))return 1e6+item.seal.grade*1e5+item.seal.level*1e3;let score=item.rarity*10000+item.tier*1000;for(const [k,v]of Object.entries(item.affixes))score+=(SCORE_WEIGHT[k]??0)*effectiveAffix(item,k);return score;}
// Alpha 0.144 가방 정렬(사용자 요청 '같은 등급이면 수치가 높은 순', 0.144.2 '강화 수치 제외'): itemPower와 같은 가중치로
// 장비 원래 수치(item.affixes, 강화 보너스 제외)만 더한다. 등급·지역 가산도 없음. 인장은 등급·레벨.
export function itemStatScore(item){if(isSeal(item))return item.seal.grade*1000+item.seal.level;let score=0;for(const [k,v]of Object.entries(item.affixes??{}))score+=(SCORE_WEIGHT[k]??0)*(Number(v)||0);return score;}
export const salvageValue=item=>12+(item.rarity===5?6:item.rarity)*14+item.tier*4;
export function itemProtection(profile,item){
 if(isEquippedItem(profile,item))return '착용 중';
 if(profile.favoriteItemIds?.includes(item.id))return '즐겨찾기';
 if(item.rerollCandidate)return '수치작 결과 대기';
 if(profile.savedBuilds?.some(b=>b&&Object.values(b.equipment).includes(item.id)))return '저장 빌드';
 return '';
}
// Alpha 0.142: only plain gear is ever dismantled automatically — never protected (착용·즐겨찾기·빌드·수치작 대기), 강화·승급한,
// 고대·제작 장비, or 인장.
export const autoSalvageable=(profile,item)=>!itemProtection(profile,item)&&!isSeal(item)&&item.rarity<5&&!(item.enhancement>0)&&!(item.promotionCount>0);
// Bulk dismantle by grade: every plain item at or below `grade`.
export const gradeSalvageIds=(profile,grade)=>profile.inventory.filter(i=>i.rarity<=grade&&autoSalvageable(profile,i)).map(i=>i.id);
export function storeItem(profile,item){
 if(profile.inventory.some(i=>i.id===item.id))return {duplicate:true,kept:false,gold:0,salvaged:0};
 discoverAncient(profile,item);const rules=profile.bagRules??cleanBagRules(null),removed=[];
 // Auto dismantle on gain (bag rules): a new plain item at or below the chosen grade turns into gold at once.
 if(rules.auto&&item.rarity<=rules.grade&&autoSalvageable(profile,item)){const gold=salvageValue(item);profile.gold+=gold;return {duplicate:false,kept:false,gold,salvaged:1,discardedId:item.id};}
 let discard=null;
 if(profile.inventory.length>=INVENTORY_LIMIT){discard=item;for(const owned of profile.inventory)if(!itemProtection(profile,owned)&&!isSeal(owned)&&!(owned.enhancement>0)&&!(owned.promotionCount>0)&&itemPower(owned)<itemPower(discard))discard=owned;
  if(discard!==item)profile.inventory=profile.inventory.filter(i=>i.id!==discard.id);
 }
 if(discard)removed.push(discard);if(discard!==item)profile.inventory.push(item);
 // Per-부위 limit: over it, the new item joins the others of its 부위 and the lowest grade (then weakest) plain ones go first.
 const limit=rules.limits?.[item.slot];
 if(discard!==item&&limit){const same=profile.inventory.filter(i=>i.slot===item.slot),over=same.length-limit;
  if(over>0){const out=new Set(same.filter(i=>autoSalvageable(profile,i)).sort((a,b)=>a.rarity-b.rarity||itemPower(a)-itemPower(b)||a.id-b.id).slice(0,over).map(i=>i.id));
   for(const i of same)if(out.has(i.id))removed.push(i);profile.inventory=profile.inventory.filter(i=>!out.has(i.id));}}
 const gold=removed.reduce((sum,i)=>sum+salvageValue(i),0);profile.gold+=gold;
 const kept=profile.inventory.some(i=>i.id===item.id);
 return {duplicate:false,kept,gold,salvaged:removed.length,discardedId:removed[0]?.id??null};
}

const CATALOG_BY_ID=new Map([...ITEM_CATALOG,...ANCIENT_CATALOG,...CRAFTED_CATALOG].map(i=>[i.id,i]));
const EXTRA_AFFIXES=Object.freeze({damage:3,hp:12,speed:2,crit:2,reduction:1});
// Alpha 0.113: gear dropped on a harder hunt mode rolls stronger base stats (item.hunt 1 정예, 2 악몽).
export const HUNT_POWER=Object.freeze([1,1.25,1.6]);
export const huntGrade=item=>Number.isInteger(item?.hunt)&&item.hunt>0&&item.hunt<HUNT_POWER.length?item.hunt:0;
function affixRange(definition,rarity,key,hunt=0){
 const special=rarity>=5,primary=Object.hasOwn(definition.base,key),base=definition.base[key]??EXTRA_AFFIXES[key];
 // Alpha 0.120: wider spreads (base stats ±30%, added stats ±40%, ancient/crafted ±20%; was ±15/20/15%), and every
 // uncapped stat keeps at least two values so a maximum is never automatic.
 const raid=!!definition.raid,scale=(special?1:(.76+definition.tier*.24)*RARITY_INFO[rarity].power)*HUNT_POWER[hunt],low=raid?.6:special?.8:primary?.7:.6,high=raid?1.25:special?1.2:primary?1.3:1.4,cap=affixCap(key);
 const min=Math.min(cap-1,Math.max(1,Math.round(base*scale*low)));return {min,max:Math.min(cap,Math.max(min+1,Math.round(base*scale*high)))};
}
export function itemRollRanges(item){
 if(!item||!Number.isInteger(item.rarity)||item.rarity<0||item.rarity>6)return {};
 const row=CATALOG_BY_ID.get(item.catalogId);if(!row||row.slot!==item.slot||row.tier!==item.tier||row.artId!==item.artId||item.rarity===5&&!ancientDefinition(item)||item.rarity===6&&!craftedDefinition(item)||item.rarity<5&&(row.ancient||row.rarity===6))return {};
 const keys=Object.keys(item.affixes??{});if(!keys.length||keys.some(k=>!Object.hasOwn(EXTRA_AFFIXES,k)))return {};
 // Alpha 0.142 승화 각성: an awakened forged item rolls ×1.15 (still under the stat caps).
 const awake=item.rarity===6&&row.forge&&item.forge?.awaken?FORGE_AWAKEN_POWER:1;
 return Object.fromEntries(keys.map(k=>{const r=affixRange(row,item.rarity,k,huntGrade(item));if(awake===1)return [k,r];const cap=affixCap(k),min=Math.min(cap-1,Math.round(r.min*awake));return [k,{min,max:Math.min(cap,Math.max(min+1,Math.round(r.max*awake)))}];}));
}
export function isPerfectRoll(item,affixes=item?.affixes){
 const ranges=itemRollRanges(item),keys=Object.keys(ranges),row=CATALOG_BY_ID.get(item?.catalogId),count=item?.rarity>=5?Object.keys(row?.base??{}).length:[2,2,3,4,5][item?.rarity];
 return !!count&&keys.length===count&&Object.keys(row.base).every(k=>Object.hasOwn(affixes??{},k))&&keys.every(k=>affixes?.[k]===ranges[k].max)&&(!row.raid||item.powerRoll===RAID_POWER_ROLL.max);
}
// Alpha 0.123: raid ancients roll wide (stats 60~125% of base, effect power 60~120%) and skewed low; full effect power
// and the top of every stat only with 극옵 (PERFECT_ROLL_CHANCE).
// Alpha 0.145.0 (사용자 요청 '좋은 수치·특수효과는 낮은 확률'): the n³ curve (top fifth 6.9%, top tenth 3.5%) became a
// band table — [band top as a share of the range, chance]; uniform inside a band. Top fifth 3.5%, top tenth 1%.
export const RAID_ROLL_BANDS=Object.freeze([[.2,.58],[.4,.2],[.6,.12],[.8,.065],[.9,.025],[1,.01]].map(r=>Object.freeze(r)));
export const RAID_POWER_ROLL=Object.freeze({min:60,max:120});
export function raidRollPosition(n){let low=0,seen=0;for(const [high,chance]of RAID_ROLL_BANDS){if(n<seen+chance||high===1)return Math.min(.999999,low+(high-low)*Math.max(0,n-seen)/chance);seen+=chance;low=high;}return 0;}
const raidRow=item=>item?.rarity===5&&ancientDefinition(item)?.raid?ancientDefinition(item):null;
const skewed=(item,n)=>raidRow(item)?raidRollPosition(n):n;
export function rollRaidPower(n,perfect){return perfect?RAID_POWER_ROLL.max:RAID_POWER_ROLL.min+Math.min(RAID_POWER_ROLL.max-RAID_POWER_ROLL.min-1,Math.floor(raidRollPosition(n)*(RAID_POWER_ROLL.max-RAID_POWER_ROLL.min)));}
export function rollItemAffixes(item,rng){
 const ranges=itemRollRanges(item),forced=rng()<PERFECT_ROLL_CHANCE,result={};
 for(const [key,range]of Object.entries(ranges)){const n=skewed(item,rng());result[key]=rollWithin(range,n,forced);}return result;
}
// A raid ancient's 수치작 also rerolls its effect power with the same odds.
export function rollRaidPowerFor(item,rng){return raidRow(item)?rollRaidPower(rng(),rng()<PERFECT_ROLL_CHANCE):null;}
// Promotion keeps the item identity and its relative base-roll quality.
export function promotionPreview(item){
 if(!item||item.rarity<0||item.rarity>=4||!Number.isInteger(item.rarity))return null;
 const ranges=itemRollRanges(item),row=CATALOG_BY_ID.get(item.catalogId),keys=Object.keys(ranges);if(!keys.length)return null;
 const quality={};let average=0,count=0;for(const key of keys){const r=ranges[key];if(r.max===r.min)continue;const q=Math.max(0,Math.min(1,(item.affixes[key]-r.min)/(r.max-r.min)));quality[key]=q;average+=q;count++;}average=count?average/count:1;
 for(const key of keys)if(!Object.hasOwn(quality,key))quality[key]=average;
 const next={...item,rarity:item.rarity+1,affixes:{...item.affixes}},target=[2,2,3,4,5][next.rarity];
 for(const key of Object.keys(row.base))if(!Object.hasOwn(next.affixes,key))next.affixes[key]=1;
 for(const key of Object.keys(EXTRA_AFFIXES)){if(Object.keys(next.affixes).length>=target)break;if(!Object.hasOwn(next.affixes,key))next.affixes[key]=1;}
 // Only a 극옵 stays 극옵: other items keep their quality but stop one below each new maximum.
 const perfect=isPerfectRoll(item);for(const [key,r]of Object.entries(itemRollRanges(next)))next.affixes[key]=Math.min(perfect?r.max:r.max-1,r.min+Math.round((r.max-r.min)*(quality[key]??average)));
 next.name=row.name;next.rollVersion=1;next.promotionCount=Math.min(next.rarity,(Number.isInteger(item.promotionCount)?Math.max(0,item.promotionCount):0)+1);delete next.perfect;delete next.enhancement;delete next.enhancementAffixes;delete next.enhanceFailures;delete next.rerollCandidate;if(isPerfectRoll(next))next.perfect=true;
 return next;
}
export const ENHANCEMENT_CAPS=Object.freeze([5,10,15,20,30,40,50]);
export const MAX_ENHANCEMENT=50;
export const enhancementCap=rarity=>Number.isInteger(rarity)?ENHANCEMENT_CAPS[rarity]??0:0;
export const enhancementLevel=item=>Number.isInteger(item?.enhancement)?Math.max(0,Math.min(enhancementCap(item?.rarity),item.enhancement)):0;
// Base rolls and earned enhancement additions have separate ownership.
// Missing additions are migrated from the old level multiplier without changing totals.
export function enhancementBonus(item,key){
 const level=enhancementLevel(item);if(!level||!Object.hasOwn(item.affixes??{},key))return 0;
 const stored=item.enhancementAffixes,value=stored===undefined?(item.affixes[key]??0)*level*3/100:stored&&typeof stored==='object'&&!Array.isArray(stored)?stored[key]:0;
 return Number.isFinite(value)?Math.max(0,Math.min(Math.round(value*100),Math.round(affixCap(key)*level*3)))/100:0;
}
export function effectiveAffix(item,key){return Math.round(((item.affixes?.[key]??0)+enhancementBonus(item,key))*100)/100;}
const DROP_DURATIONS=Object.freeze([.45,.55,.65,.8,.95,1.1,1.2]);
export const gearDropDuration=item=>DROP_DURATIONS[Math.max(0,Math.min(6,item?.rarity??0))]+(item?.perfect?.45:0);
export function gearDropPresentation(item){
 const rank=Math.max(0,Math.min(6,item?.rarity??0)),perfect=!!item?.perfect;
 return {rank,perfect,color:RARITY_INFO[rank].color,row:perfect?3:rank>=4?2:rank>=3?1:0,size:[110,150,190,240,300,370,420][rank]*(perfect?1.5:1),duration:gearDropDuration(item),rings:1+Math.floor(rank/2)+(perfect?2:0),rays:3+rank*2+(perfect?6:0)};
}
const LEGACY_EFFECT=Object.freeze({forest_blade:'echo',forest_fang:'storm',ruins_blade:'blood',ruins_rune:'execution',frost_blade:'frostNova',frost_fang:'whirlwind',forest_armor:'barrier',ruins_armor:'thorns',frost_armor:'lastStand',forest_charm:'momentum',ruins_charm:'focus',frost_charm:'orbit'});
export function uniqueEffect(item){
 if(!item||!Number.isInteger(item.rarity)||item.rarity<3||item.rarity>=RARITIES.length)return null;
 if(item.rarity===5&&!ancientDefinition(item)||item.rarity===6&&!craftedDefinition(item))return null;
 const row=CATALOG_BY_ID.get(item.catalogId),matching=row&&row.slot===item.slot&&row.tier===item.tier&&row.artId===item.artId;
 if(matching&&row.forge){const list=ancientSignatures(item);return list.length?Object.freeze({id:'forge-'+item.id,slot:item.slot,name:list.map(r=>r.name).join(' + '),description:list.map(r=>r.description).join('\n'),color:list.at(-1).color,scales:false}):null;}
 if(matching&&row.signatureOnly){const special=ancientDefinition(item)??craftedDefinition(item);return special?Object.freeze({id:'signature-'+row.id,slot:item.slot,name:special.signature.name,description:special.signature.description,color:special.signature.color,scales:false}):null;}
 const definition=UNIQUE_EFFECTS[matching?row.effectId:LEGACY_EFFECT[item.artId]];
 return definition?.slot===item.slot?definition:null;
}
// Alpha 0.136: a seal's 상옵 effects ride the ancient power path (spec.seal plays the role of spec.ancient).
const SEAL_DEFINITION=Object.freeze({id:'seal',name:'인장 특수효과',description:'보스 러시 인장의 상옵 효과',slot:'special',color:SEAL_GRADES[2].color});
export function uniqueLoadout(profile){const result=Object.fromEntries(EQUIPMENT_KEYS.map(key=>[key,null]));for(const slot of EQUIPMENT_KEYS){const found=inventoryItem(profile,profile.equipment?.[slot]),item=found?.slot===itemSlotForPosition(slot)?found:null;if(!item)continue;if(isSeal(item)){const signatures=sealSignatures(item);if(signatures.length)result[slot]=Object.freeze({definition:SEAL_DEFINITION,power:1,itemId:item.id,slot,ancient:null,crafted:null,seal:Object.freeze({id:'seal-'+item.id,signature:signatures[0]}),signatures:Object.freeze(signatures)});continue;}const definition=uniqueEffect(item);if(definition)result[slot]=Object.freeze({definition,power:uniquePower(item.rarity),itemId:item.id,slot,ancient:ancientDefinition(item),crafted:craftedDefinition(item),signatures:Object.freeze(ancientSignatures(item))});}return result;}

export function equippedUniqueEffect(profile,slot){return uniqueEffect((profile.inventory??[]).find(item=>item.slot===itemSlotForPosition(slot)&&profile.equipment[slot]===item.id));}

export function discoverAncient(profile,item){
 const row=item?.rarity===5?ancientDefinition(item):null;if(!row)return false;
 if(!Array.isArray(profile.discoveredAncients))profile.discoveredAncients=[];
 if(profile.discoveredAncients.includes(row.id))return false;profile.discoveredAncients.push(row.id);profile.discoveredAncients.sort((a,b)=>ANCIENT_BY_ID.get(a).ordinal-ANCIENT_BY_ID.get(b).ordinal);return true;
}
export function targetAncient(profile){return ANCIENT_BY_ID.get(profile.targetAncientId)??null;}
export function setAncientTarget(profile,id){if(id!==null&&!ANCIENT_BY_ID.has(id))return false;profile.targetAncientId=id;return true;}

// The set a worn item belongs to (undefined for original and ancient identities).
export function itemSet(item){return CATALOG_BY_ID.get(item?.catalogId)?.set;}
