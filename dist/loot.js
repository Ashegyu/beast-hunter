import {SLOTS,EQUIPMENT_KEYS,STAGE_SLOTS,itemSlotForPosition,isEquippedItem,equipmentFamily} from './equipment-slots.js?v=0.110.0';
import {CRAFTED_CATALOG,craftedDefinition} from './crafting.js?v=0.110.0';
export {CRAFTED_CATALOG,craftedDefinition} from './crafting.js?v=0.110.0';
import {huntMode,BOSS_DROP_TABLES} from './hunt-modes.js';
import {UNIQUE_EFFECTS,EFFECT_ROWS,uniquePower} from './unique-effects.js?v=0.98.0';
import {ANCIENT_POWER_BY_ID} from './ancient-powers.js?v=0.110.0';
import {EQUIPMENT_SETS,SET_SLOTS,setArtId} from './equipment-sets.js?v=0.110.0';
export {EQUIPMENT_SETS,SET_SLOTS,SET_STATS,CHAPTER_SETS,setArtId,setBonusStats,setBonusText} from './equipment-sets.js?v=0.110.0';
export {UNIQUE_EFFECTS,uniquePower} from './unique-effects.js?v=0.98.0';
// Item definitions and pure rolls; the combat state owns identities and delivery.
import {INVENTORY_LIMIT,MAX_PENDING_LOOT} from './inventory-rules.js?v=0.86.9';
export {INVENTORY_LIMIT,MAX_PENDING_LOOT} from './inventory-rules.js?v=0.86.9';
export const LEGENDARY_PITY_LIMIT=20,PERFECT_ROLL_CHANCE=.08;
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
const patterns={weapon:[{damage:8,crit:2},{damage:6,speed:3},{damage:10,crit:1},{damage:12,hp:10}],armor:[{hp:25,reduction:2},{hp:18,speed:3},{hp:30,reduction:3},{hp:32,crit:2}],charm:[{speed:4,crit:2},{hp:20,reduction:2},{damage:5,crit:3},{speed:6,hp:10}]};
const legacyCatalog=chapterNames.flatMap((groups,t)=>groups.flatMap((names,slotIndex)=>{
 const slot=['weapon','armor','charm'][slotIndex];return names.map((name,i)=>Object.freeze({id:`${t+1}-${slot}-${i+1}`,name,slot,tier:t+1,artId:artRows[t][slotIndex===0?(i<4?(i<2?0:1):i%2):slotIndex+1],base:Object.freeze(patterns[slot][i%4]),effectId:EFFECT_ROWS[slot][i%6]}));
}));
const additionalParts=Object.keys(SLOTS).filter(slot=>!['weapon','armor','charm'].includes(slot));
const BASE_CATALOG=Object.freeze([...legacyCatalog,...[1,2,3].flatMap(tier=>additionalParts.map(slot=>Object.freeze({id:`${tier}-${slot}-1`,name:slot==='special'?['리리안의 적월 인장','리리안의 망령 인장','리리안의 서리 인장'][tier-1]:['숲지기의 ','폐성 수호자의 ','서리결 '][tier-1]+SLOTS[slot],slot,tier,artId:artRows[tier-1][equipmentFamily(slot)==='armor'?2:3],base:Object.freeze(slot==='helmet'?{hp:12,reduction:1}:slot==='pants'?{hp:15,reduction:1}:slot==='boots'?{hp:8,speed:2}:slot==='earring'?{damage:3,crit:1}:{damage:5,hp:10}),effectId:null,signatureOnly:true,...(slot==='special'?{characterId:'lirian'}:{})}))) ]);
// Chapter set pieces (Alpha 0.108/0.109): per set two weapon designs × two names and two names per armor part.
// They carry `set` and drop only in their chapter; ancient identities stay derived from the base catalog.
// Base stats follow the set's style; `power` raises them slightly for later chapters of a region.
const SET_STYLES=Object.freeze({
 swift:{weapon:[{damage:7,speed:4},{damage:9,crit:2}],armor:{hp:22,speed:3},helmet:{hp:10,speed:2},pants:{hp:13,speed:2},boots:{hp:7,speed:3}},
 fierce:{weapon:[{damage:11,crit:1},{damage:13}],armor:{hp:26,crit:2},helmet:{hp:11,crit:1},pants:{hp:14,crit:1},boots:{hp:8,crit:1}},
 guard:{weapon:[{damage:8,hp:14},{damage:10,hp:10}],armor:{hp:32,reduction:3},helmet:{hp:14,reduction:1},pants:{hp:17,reduction:1},boots:{hp:10,reduction:1}},
 keen:{weapon:[{damage:8,crit:3},{damage:10,crit:2}],armor:{hp:24,crit:3},helmet:{hp:11,crit:2},pants:{hp:14,crit:1},boots:{hp:8,crit:2}},
 vital:{weapon:[{damage:8,hp:18},{damage:10,hp:12}],armor:{hp:38},helmet:{hp:17},pants:{hp:20},boots:{hp:12,speed:1}},
 brute:{weapon:[{damage:13},{damage:15}],armor:{hp:24,damage:2},helmet:{hp:10,damage:1},pants:{hp:13,damage:1},boots:{hp:7,damage:1}},
});
const setBase=(set,stats)=>Object.freeze(Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,Math.max(1,Math.round(v*set.power))])));
export const SET_CATALOG=Object.freeze(Object.values(EQUIPMENT_SETS).flatMap(set=>SET_SLOTS.flatMap(slot=>slot==='weapon'
 ?set.names.weapon.flatMap((names,variant)=>names.map((name,i)=>Object.freeze({id:`set-${set.id}-weapon-${variant*2+i+1}`,name,slot,tier:set.tier,artId:setArtId(set.id,slot,variant),set:set.id,base:setBase(set,SET_STYLES[set.style].weapon[variant]),effectId:EFFECT_ROWS.weapon[(set.effectOffset+variant*2+i)%6]})))
 :set.names[slot].map((name,i)=>Object.freeze({id:`set-${set.id}-${slot}-${i+1}`,name,slot,tier:set.tier,artId:setArtId(set.id,slot),set:set.id,base:setBase(set,SET_STYLES[set.style][slot]),...(slot==='armor'?{effectId:EFFECT_ROWS.armor[(set.effectOffset+i)%6]}:{effectId:null,signatureOnly:true})})))));
export const ITEM_CATALOG=Object.freeze([...BASE_CATALOG,...SET_CATALOG]);
// Ordinary identity and quality are independent. Ancient identities have no quality variants.
const ancientKey=row=>[row.tier,row.slot,row.artId,row.effectId].join(':');
const VISUAL_STYLE=Object.freeze({echo:3,storm:5,execution:6,blood:4,frostNova:5,whirlwind:6,barrier:3,thorns:4,pulse:6,frostWard:5,lastStand:6,recovery:3,momentum:3,focus:4,capacitor:5,hunter:4,orbit:6,magnet:5});
// Alpha 0.110: three stats per slot instead of all five (several ancients used to cap crit and
// reduction at 50%), at 2.9× instead of 3.65× — above a promoted mythic set piece, below the old values.
const ANCIENT_POWER=2.9;
const ANCIENT_STATS=Object.freeze({weapon:{damage:13,crit:3,speed:3},armor:{hp:38,reduction:3,crit:2},helmet:{hp:25,crit:3,reduction:2},pants:{hp:25,speed:3,reduction:2},
 boots:{hp:18,speed:4,reduction:2},charm:{damage:5,hp:18,crit:3},earring:{damage:4,crit:3,speed:3},special:{damage:5,hp:18,reduction:3}});
const ancientRows=new Map();
for(const row of BASE_CATALOG){const key=ancientKey(row);if(ancientRows.has(key))continue;const base={},scale=(.76+row.tier*.24)*ANCIENT_POWER,values=ANCIENT_STATS[row.slot];for(const [k,v]of Object.entries(values))base[k]=Math.round(v*scale);const ordinal=ancientRows.size;ancientRows.set(key,Object.freeze({...row,id:'ancient-'+row.id,name:'태초의 '+row.name,base:Object.freeze(base),visualStyle:VISUAL_STYLE[row.effectId]??3,ancient:true,ordinal,signature:ANCIENT_POWER_BY_ID['ancient-'+row.id]??Object.freeze({id:'ancient-'+row.id,index:60+ordinal,color:'#ffb66b',name:'태초의 맥동',trigger:row.slot==='special'?'periodic':'dash',cooldown:10,damage:.18,radius:140,description:row.slot==='special'?'전투 중 10초마다 주변에 기본 공격력 18% 피해.':'회피 시 주변에 기본 공격력 18% 피해. 재사용 10초.'}),bossId:['forest_guardian','ruins_king','frost_king'][row.tier-1]}));}
export const ANCIENT_CATALOG=Object.freeze([...ancientRows.values()]);
const ANCIENT_BY_ID=new Map(ANCIENT_CATALOG.map(r=>[r.id,r]));
export const BOSS_LOOT=Object.freeze(['세계수의 수호령','무덤의 왕','빙원의 지배자'].map((name,i)=>Object.freeze({id:['forest_guardian','ruins_king','frost_king'][i],name,tier:i+1,items:Object.freeze(ANCIENT_CATALOG.filter(r=>r.tier===i+1))})));
export function bossLootPool(bossId,tier){const boss=BOSS_LOOT.find(b=>b.id===bossId&&b.tier===tier);if(!boss)throw new RangeError('Boss loot identity does not match chapter');return boss.items;}
export function ancientDefinition(item){const row=ANCIENT_BY_ID.get(item?.catalogId);return row&&row.slot===item.slot&&row.tier===item.tier&&row.artId===item.artId?row:null;}
export function ancientForLegacy(item){const row=CATALOG_BY_ID.get(item.catalogId),matching=row&&row.slot===item.slot&&row.tier===item.tier&&row.artId===item.artId;return ancientRows.get(ancientKey(matching?row:{...item,effectId:LEGACY_EFFECT[item.artId]}))??null;}
export function rollAncient({id,tier,slot,bossId},pick,rng=null){
 const pool=bossId?bossLootPool(bossId,tier):ANCIENT_CATALOG,choices=pool.filter(r=>r.tier===tier&&(!slot||r.slot===slot)),base=choices[Math.min(choices.length-1,Math.floor(pick*choices.length))];
 if(!base)throw new RangeError('Unknown ancient chapter/slot');
 const item={id,slot:base.slot,tier:base.tier,rarity:5,name:base.name,catalogId:base.id,artId:base.artId,affixes:{...base.base},rollVersion:1,...(base.characterId?{characterId:base.characterId}:{})};
 if(rng){const forced=(pick*choices.length)%1<PERFECT_ROLL_CHANCE;for(const [key,range]of Object.entries(itemRollRanges(item))){const n=rng();item.affixes[key]=forced?range.max:range.min+Math.min(range.max-range.min,Math.floor(n*(range.max-range.min+1)));}}
 if(isPerfectRoll(item))item.perfect=true;return item;
}
export function rollRarity(source,rng,minimum=0,difficulty=0){const mode=huntMode(difficulty);if(!mode)throw new RangeError('Unknown hunt mode');const weights=source==='boss'?BOSS_DROP_TABLES[mode.id]:DROP_TABLES[source]??DROP_TABLES.normal,floor=Number.isInteger(minimum)?Math.max(0,Math.min(5,minimum)):0;let value=rng()*100;for(let i=0;i<weights.length;i++){value-=weights[i];if(value<0)return Math.max(floor,i);}return weights.length-1;}
export function rollItem({id,tier,slot,set=null,source='normal',minimum=0,bossId,difficulty=0,quality=null},rng){
 if(!huntMode(difficulty))throw new RangeError('Unknown hunt mode');if(bossId)bossLootPool(bossId,tier);
 // A set asks for that set's pieces; otherwise only the original (pre-0.108) identities roll.
 const choices=ITEM_CATALOG.filter(i=>(set?i.set===set:!i.set&&i.tier===tier)&&(!slot||i.slot===slot));
 const pick=rng(),base=choices[Math.min(choices.length-1,Math.floor(pick*choices.length))];
 if(!base)throw new RangeError('Unknown loot chapter/slot');
 const draw=rollRarity(source,rng,minimum,difficulty),rarity=quality===null?draw:quality;if(rarity===5)return rollAncient({id,tier,slot,bossId},pick,rng);
 // The fractional family pick is uniform within each family. Reuse it for
 // quality without consuming another random draw or changing later rolls.
 const perfect=(pick*choices.length)%1<PERFECT_ROLL_CHANCE;
 const affixes={},scale=(.76+tier*.24)*RARITY_INFO[rarity].power;
 for(const [key,value]of Object.entries(base.base)){const n=rng(),range=affixRange(base,rarity,key);affixes[key]=perfect?range.max:range.min+Math.min(range.max-range.min,Math.floor(n*(range.max-range.min+1)));}
 const targets=[2,2,3,4,5,5,5],extra={damage:3,hp:12,speed:2,crit:2,reduction:1},keys=Object.keys(extra).filter(k=>!Object.hasOwn(affixes,k));
 while(Object.keys(affixes).length<targets[rarity]&&keys.length){const k=keys.splice(Math.min(keys.length-1,Math.floor(rng()*keys.length)),1)[0],n=rng(),range=affixRange(base,rarity,k);affixes[k]=perfect?range.max:range.min+Math.min(range.max-range.min,Math.floor(n*(range.max-range.min+1)));}
 for(const k of Object.keys(affixes))affixes[k]=Math.min(k==='hp'?250:k==='damage'?80:25,affixes[k]);
 const prefix=rarity>=1?['날카로운','견고한','바람의','행운의','수호의'][Math.min(4,Math.floor(rng()*5))]+' ':'';
 const item={id,slot:base.slot,tier,rarity,name:prefix+base.name,catalogId:base.id,artId:base.artId,affixes,rollVersion:1,...(base.characterId?{characterId:base.characterId}:{})};if(isPerfectRoll(item)){item.perfect=true;item.name='완벽한 '+base.name;}return item;
}
// The stage delivery boundary cannot produce accessories, special, ancient or promoted gear.
export function rollStageItem({id,tier,slot=null,set=null},rng){
 if(slot!==null&&!STAGE_SLOTS.includes(slot))throw new RangeError('Stage equipment type is not available');
 const type=slot??STAGE_SLOTS[Math.min(STAGE_SLOTS.length-1,Math.floor(rng()*STAGE_SLOTS.length))];
 return rollItem({id,tier,slot:type,set,source:'stage',quality:0},rng);
}
const SCORE_WEIGHT=Object.freeze({damage:5,hp:.5,speed:3,crit:4,reduction:5});
export function itemPower(item){let score=item.rarity*10000+item.tier*1000;for(const [k,v]of Object.entries(item.affixes))score+=(SCORE_WEIGHT[k]??0)*effectiveAffix(item,k);return score;}
export const salvageValue=item=>12+(item.rarity===5?6:item.rarity)*14+item.tier*4;
export function itemProtection(profile,item){
 if(isEquippedItem(profile,item))return '착용 중';
 if(profile.favoriteItemIds?.includes(item.id))return '즐겨찾기';
 if(item.rerollCandidate)return '수치작 결과 대기';
 if(profile.savedBuilds?.some(b=>b&&Object.values(b.equipment).includes(item.id)))return '저장 빌드';
 return '';
}
export function storeItem(profile,item){
 if(profile.inventory.some(i=>i.id===item.id))return {duplicate:true,kept:false,gold:0};
 discoverAncient(profile,item);let discard=null;
 if(profile.inventory.length>=INVENTORY_LIMIT){discard=item;for(const owned of profile.inventory)if(!itemProtection(profile,owned)&&!(owned.enhancement>0)&&!(owned.promotionCount>0)&&itemPower(owned)<itemPower(discard))discard=owned;
  if(discard!==item)profile.inventory=profile.inventory.filter(i=>i.id!==discard.id);
 }
 const gold=discard?salvageValue(discard):0;profile.gold+=gold;if(discard!==item)profile.inventory.push(item);
 return {duplicate:false,kept:discard!==item,gold,discardedId:discard?.id??null};
}

const CATALOG_BY_ID=new Map([...ITEM_CATALOG,...ANCIENT_CATALOG,...CRAFTED_CATALOG].map(i=>[i.id,i]));
const EXTRA_AFFIXES=Object.freeze({damage:3,hp:12,speed:2,crit:2,reduction:1});
function affixRange(definition,rarity,key){
 const special=rarity>=5,primary=Object.hasOwn(definition.base,key),base=definition.base[key]??EXTRA_AFFIXES[key];
 const scale=special?1:(.76+definition.tier*.24)*RARITY_INFO[rarity].power,low=(special||primary)?0.85:0.8,high=(special||primary)?1.15:1.2,cap=key==='hp'?250:key==='damage'?80:25;
 return {min:Math.min(cap,Math.max(1,Math.round(base*scale*low))),max:Math.min(cap,Math.max(1,Math.round(base*scale*high)))};
}
export function itemRollRanges(item){
 if(!item||!Number.isInteger(item.rarity)||item.rarity<0||item.rarity>6)return {};
 const row=CATALOG_BY_ID.get(item.catalogId);if(!row||row.slot!==item.slot||row.tier!==item.tier||row.artId!==item.artId||item.rarity===5&&!ancientDefinition(item)||item.rarity===6&&!craftedDefinition(item)||item.rarity<5&&(row.ancient||row.rarity===6))return {};
 const keys=Object.keys(item.affixes??{});if(!keys.length||keys.some(k=>!Object.hasOwn(EXTRA_AFFIXES,k)))return {};
 return Object.fromEntries(keys.map(k=>[k,affixRange(row,item.rarity,k)]));
}
export function isPerfectRoll(item,affixes=item?.affixes){
 const ranges=itemRollRanges(item),keys=Object.keys(ranges),row=CATALOG_BY_ID.get(item?.catalogId),count=item?.rarity>=5?Object.keys(row?.base??{}).length:[2,2,3,4,5][item?.rarity];
 return !!count&&keys.length===count&&Object.keys(row.base).every(k=>Object.hasOwn(affixes??{},k))&&keys.every(k=>affixes?.[k]===ranges[k].max);
}
export function rollItemAffixes(item,rng){
 const ranges=itemRollRanges(item),forced=rng()<PERFECT_ROLL_CHANCE,result={};
 for(const [key,range]of Object.entries(ranges)){const n=rng();result[key]=forced?range.max:range.min+Math.min(range.max-range.min,Math.floor(n*(range.max-range.min+1)));}return result;
}
// Promotion keeps the item identity and its relative base-roll quality.
export function promotionPreview(item){
 if(!item||item.rarity<0||item.rarity>=4||!Number.isInteger(item.rarity))return null;
 const ranges=itemRollRanges(item),row=CATALOG_BY_ID.get(item.catalogId),keys=Object.keys(ranges);if(!keys.length)return null;
 const quality={};let average=0,count=0;for(const key of keys){const r=ranges[key];if(r.max===r.min)continue;const q=Math.max(0,Math.min(1,(item.affixes[key]-r.min)/(r.max-r.min)));quality[key]=q;average+=q;count++;}average=count?average/count:1;
 for(const key of keys)if(!Object.hasOwn(quality,key))quality[key]=average;
 const next={...item,rarity:item.rarity+1,affixes:{...item.affixes}},target=[2,2,3,4,5][next.rarity];
 for(const key of Object.keys(row.base))if(!Object.hasOwn(next.affixes,key))next.affixes[key]=1;
 for(const key of Object.keys(EXTRA_AFFIXES)){if(Object.keys(next.affixes).length>=target)break;if(!Object.hasOwn(next.affixes,key))next.affixes[key]=1;}
 for(const [key,r]of Object.entries(itemRollRanges(next)))next.affixes[key]=r.min+Math.round((r.max-r.min)*(quality[key]??average));
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
 return Number.isFinite(value)?Math.max(0,Math.min(Math.round(value*100),Math.round((key==='hp'?250:key==='damage'?80:25)*level*3)))/100:0;
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
 if(matching&&row.signatureOnly){const special=ancientDefinition(item)??craftedDefinition(item);return special?Object.freeze({id:'signature-'+row.id,slot:item.slot,name:special.signature.name,description:special.signature.description,color:special.signature.color,scales:false}):null;}
 const definition=UNIQUE_EFFECTS[matching?row.effectId:LEGACY_EFFECT[item.artId]];
 return definition?.slot===item.slot?definition:null;
}
export function uniqueLoadout(profile){const result=Object.fromEntries(EQUIPMENT_KEYS.map(key=>[key,null]));for(const slot of EQUIPMENT_KEYS){const item=profile.inventory?.find(i=>i.id===profile.equipment?.[slot]&&i.slot===itemSlotForPosition(slot));if(!item)continue;const definition=uniqueEffect(item);if(definition)result[slot]=Object.freeze({definition,power:uniquePower(item.rarity),itemId:item.id,slot,ancient:ancientDefinition(item),crafted:craftedDefinition(item)});}return result;}

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
