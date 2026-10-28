import {RAIDS,RAID_WEEKLY_ENTRIES,RAID_DAMAGE,raidScale,RAID_ANCIENT_CHANCE,raidDefinition,raidPlan,raidRewards,raidWeek,raidEntriesLeft,raidUnlocked,raidChapter,emptyRaidProgress,raidTierUnlocked,raidTopTier,RAID_TIERS} from './raids.js?v=0.140.0';
export * from './raids.js?v=0.140.0';
import {DUNGEONS,DUNGEON_MAX_LEVEL,dungeonDefinition,dungeonLimit,dungeonRewards,dungeonPlan,dungeonActors,emptyDungeonProgress,dungeonStageId,towerBonus,TOWER_MAX_FLOOR} from './dungeons.js?v=0.140.0';
export {DUNGEONS,DUNGEON_MAX_LEVEL,dungeonDefinition,dungeonLimit,dungeonRewards,dungeonChapter,DUNGEON_CHAPTER_STEP,dungeonStageId,TOWER,TOWER_MAX_FLOOR,TOWER_BONUS,towerBonus,towerBonusAt,towerChapter,towerFloorKind,towerPlan} from './dungeons.js?v=0.140.0';
export {THREAT,MODE_CHAPTERS,modeChapter,modeScale} from './chapters.js?v=0.140.0';
import {beginStageJournal,profileForSave,strictBattle,cancelStageJournal,prepareStageCommit,finishStageJournal,stageTransactionId,ownedAtStageStart} from './battle-progress.js?v=0.140.0';
import {BUILD_EFFECTS,BUILD_EFFECT_IDS,buildEffects,buildEffectText,inscriptionStatus,INSCRIPTION_DROP_CHANCE,INSCRIPTION_COST} from './build-effects.js?v=0.140.0';
import {stageRule,STAGE_TYPE_NAMES} from './battle-plans.js?v=0.140.0';
export {BUILD_EFFECTS,BUILD_EFFECT_IDS,buildEffects,buildEffectText,inscriptionStatus,INSCRIPTION_COST,stageRule,STAGE_TYPE_NAMES};
export const PROFILE_VERSION=16,MAX_LEVEL=200,BUILD_NAMES=Object.freeze(['일반 사냥','보스','광역','생존','실험']);
import {SLOTS,EQUIPMENT_SLOTS,EQUIPMENT_KEYS,STAGE_SLOTS,itemSlotForPosition,equipmentFamily,emptyEquipment,restoreEquipment,equipmentAfterEquip,equippedPosition,isEquippedItem} from './equipment-slots.js?v=0.140.0';
export * from './equipment-slots.js?v=0.140.0';
import {enhanceOwned,promoteOwned,rerollOwned,resolveOwnedReroll,restoreEquipmentProgress} from './equipment-progression.js?v=0.140.0';
export * from './equipment-progression.js?v=0.140.0';
export * from './skill-vfx.js?v=0.140.0';
export * from './skill-image-fx.js?v=0.140.0';
export * from './monster-fx.js?v=0.140.0';
export * from './combat-feedback.js?v=0.140.0';
export * from './ultimate-video.js?v=0.140.0';
export * from './skill-motion.js?v=0.140.0';
import * as skills from './combat-skills.js?v=0.140.0';
export * from './combat-skills.js?v=0.140.0';
import {MATERIALS,MATERIAL_BY_ID,MATERIAL_LIMIT,emptyMaterials,rollMaterials,CRAFTED_CATALOG,craftedDefinition,craftStatus,targetCraft,setCraftTarget,craftProgress} from './crafting.js?v=0.140.0';
export {MATERIALS,MATERIAL_BY_ID,CRAFTED_CATALOG,craftedDefinition,craftStatus,targetCraft,setCraftTarget,craftProgress} from './crafting.js?v=0.140.0';
import {equipmentSynergies} from './equipment-synergies.js?v=0.140.0';
import {itemProtection} from './loot.js?v=0.140.0';
export {itemProtection,salvageValue} from './loot.js?v=0.140.0';
export {equipmentSynergies,EQUIPMENT_SYNERGIES} from './equipment-synergies.js?v=0.140.0';
import {HUNT_MODES,huntMode,REPLAY_CYCLES} from './hunt-modes.js?v=0.140.0';
export {HUNT_MODES} from './hunt-modes.js?v=0.140.0';
// Pure combat, random waves and persistent RPG rules. No rendering or storage dependencies.
import { directionIndex, recoilProgress, ACTION_DURATIONS } from './motion.js?v=0.140.0';
import { WORLD_BOUNDS, GROUND_DEPTH_SCALE } from './world.js?v=0.140.0';
import { CHAPTERS, CHAPTERS_PER_THEME, THEMES, THREAT, modeScale, MODE_CHAPTERS, chapterTheme, MONSTERS, chapterMonsterPool, EQUIPMENT_ART, ALL_EQUIPMENT_ART, equipmentArt } from './chapters.js?v=0.140.0';
import { STAGES_PER_CHAPTER, battlePlan, stageWaveCount, waveComposition } from './battle-plans.js?v=0.140.0';
import { RAID_POWER_ROLL, raidPowerRoll } from './loot.js?v=0.140.0';
import * as growth from './growth.js?v=0.140.0';
import * as transcend from './transcendence.js?v=0.140.0';
export {TRANSCEND,TRANSCEND_IDS,TRANSCEND_STEPS,transcendNeeded,transcendLevel,transcendProgress,transcendEffective,transcendPoints,transcendPointsTotal,transcendBonus,transcendStatus} from './transcendence.js?v=0.140.0';
export * from './growth.js?v=0.140.0';
import * as stars from './stage-stars.js?v=0.140.0';
import * as seals from './seals.js?v=0.140.0';
import * as rush from './boss-rush.js?v=0.140.0';
export * from './boss-rush.js?v=0.140.0';
export * from './seals.js?v=0.140.0';
import * as gates from './stage-gates.js?v=0.140.0';
export * from './stage-gates.js?v=0.140.0';
export * from './stage-stars.js?v=0.140.0';
export { RAID_POWER_ROLL, RAID_ROLL_SKEW, raidPowerRoll } from './loot.js?v=0.140.0';
import { affixCap, INVENTORY_LIMIT, MAX_PENDING_LOOT, LEGENDARY_PITY_LIMIT, huntGrade, ITEM_CATALOG, ANCIENT_CATALOG, ancientIdOfBase, rollAncient, BOSS_LOOT, bossLootPool, discoverAncient, targetAncient, setAncientTarget, ancientDefinition, ancientForLegacy, effectiveAffix, RARITIES, RARITY_INFO, rollItem, rollStageItem, rollAccessory, storeItem, salvageValue, uniqueEffect, uniqueLoadout, equippedUniqueEffect, UNIQUE_EFFECTS, itemSet, setBonusStats, EQUIPMENT_SETS, SET_SLOTS } from './loot.js?v=0.140.0';
export { ancientSignatures, ANCIENT_TIER_POWER, ANCIENT_HUNT_POWER, huntGrade, HUNT_POWER, HUNT_GRADE_TABLES, itemSet, setBonusStats, setBonusText, EQUIPMENT_SETS, SET_SLOTS, SET_STATS, CHAPTER_SETS, SET_CATALOG } from './loot.js?v=0.140.0';
export { INVENTORY_LIMIT, LEGENDARY_PITY_LIMIT, ITEM_CATALOG, ANCIENT_CATALOG, BOSS_LOOT, RARITIES, RARITY_INFO, UNIQUE_EFFECTS, uniqueEffect, uniqueLoadout, targetAncient, setAncientTarget, ancientDefinition, gearDropPresentation, gearDropDuration } from './loot.js?v=0.140.0';
export { STAGES_PER_CHAPTER, BATTLE_PLANS, battlePlan, stageWaveCount } from './battle-plans.js?v=0.140.0';
export const ARRIVAL_EPSILON=.001;
export const STAGES = CHAPTERS;
export {THEMES,CHAPTERS_PER_THEME};
// Boss cores grow by one every five chapters, plus the difficulty bonus.
export const bossCores=(chapter,difficulty=0)=>Math.ceil(chapter/5)+(HUNT_MODES[difficulty]?.extraCore??0);
export const WAVES_PER_STAGE=3,SPAWN_WARNING=.75,MAX_ACTIVE_ENEMIES=32;
// Each region offers one route: its furthest cleared chapter (boss drops), else its furthest unlocked one, else its first.
const routeChapter=(profile,theme)=>{const rows=STAGES.filter(c=>c.theme===theme);return rows.filter(c=>c.id<=profile.clearedStage).at(-1)??rows.filter(c=>c.id<=profile.unlockedStage).at(-1)??rows[0];};
export function craftMaterialRoutes(profile,id){
 const m=MATERIAL_BY_ID[id];if(!m)return [];const routes=[];
 for(const chapter of THEMES.map(t=>routeChapter(profile,t.id))){if(m.tier&&m.tier!==chapter.theme)continue;const limit=stageLimit(profile,chapter.id);let stage,source;
  if(limit>=STAGES_PER_CHAPTER&&m.boss>0){stage=STAGES_PER_CHAPTER;source='boss';}else if(limit>=3&&m.elite>0){stage=3;source='elite';}else if(m.normal>0){stage=1;source='normal';}else if(m.elite>0){stage=3;source='elite';}else{stage=STAGES_PER_CHAPTER;source='boss';}
  const available=limit>=stage;routes.push({chapter:chapter.id,theme:chapter.theme,name:chapter.name,stage,source,chance:m[source],quantity:m.quantity[source==='boss'?2:source==='elite'?1:0],available,reason:!limit?'사냥터 미해금':!available?stage+'스테이지 해금 필요':''});
 }return routes;
}
export function completedStages(profile,chapter,difficulty=0){
 if(!huntMode(difficulty)||!Number.isInteger(chapter)||chapter<1||chapter>STAGES.length)return 0;
 return difficulty===0?(chapter<=profile.clearedStage?STAGES_PER_CHAPTER:profile.stageProgress?.[chapter-1]??0):profile.difficultyProgress?.[difficulty-1]?.[chapter-1]??0;
}
export function stageLimit(profile,chapter,difficulty=0){
 if(!huntMode(difficulty)||!Number.isInteger(chapter)||chapter<1||chapter>STAGES.length||chapter>profile.unlockedStage||difficulty>0&&!bossModeAvailable(profile,chapter,difficulty))return 0;
 return Math.min(STAGES_PER_CHAPTER,completedStages(profile,chapter,difficulty)+1);
}
function recordStageClear(s,stage){
 const p=s.profile;
 // Alpha 0.132 별: time used and the lowest health of the stage decide ★2·★3 (best result of any difficulty is kept).
 s.run.stars=stars.awardStars(p,s.stageId,stage,stars.starsFor({stage,timeLimit:s.run.timeLimit,timeRemaining:s.run.timeRemaining,lowestHp:s.run.lowestHp??1}));
 if(s.difficulty===0)p.stageProgress[s.stageId-1]=Math.max(p.stageProgress[s.stageId-1],stage);
 else{p.difficultyProgress??=[STAGES.map(()=>0),STAGES.map(()=>0)];const row=p.difficultyProgress[s.difficulty-1];row[s.stageId-1]=Math.max(row[s.stageId-1],stage);}
}
// Alpha 0.131: the old 숙련 (UPGRADES) and 대장간 영구 강화 (FORGE) are replaced by growth.js (능력치 단련 + 성장 트리).
export const AFFIXES={damage:'공격',hp:'체력',speed:'이동',crit:'치명타',reduction:'피해 감소'};

export const WEAPON_TRAITS=Object.freeze({
  bleed:Object.freeze({id:'bleed',name:'출혈',color:'#ed8992',description:'방어되지 않은 검격에 출혈. 기본 공격력의 15% 피해를 0.8초마다 3회. 중첩 없이 갱신.'}),
  frost:Object.freeze({id:'frost',name:'빙결',color:'#9cdeef',description:'방어되지 않은 검격에 2초간 이동 속도 35% 감소. 보스는 15%. 공격 예고 시간은 유지.'}),
  pierce:Object.freeze({id:'pierce',name:'갑각 관통',color:'#e8c48c',description:'파쇄와 3연격 마무리의 방어 게이지 피해 +25. 정면 방어 중에도 피해 75% 전달.'}),
});
const TRAIT_BY_ART=Object.freeze({forest_blade:'bleed',forest_fang:'pierce',ruins_blade:'bleed',ruins_rune:'pierce',frost_blade:'frost',frost_fang:'pierce'});
export function weaponTrait(item){return item?.slot==='weapon'?WEAPON_TRAITS[TRAIT_BY_ART[equipmentArt(item)?.id]]??null:null;}
export function equippedWeaponTrait(profile){return weaponTrait(profile.inventory.find(i=>i.id===profile.equipment.weapon&&i.slot==='weapon'));}
export function equipmentSnapshot(profile){
 const result=emptyEquipment();for(const position of EQUIPMENT_KEYS){const item=profile.inventory.find(i=>i.id===profile.equipment[position]&&i.slot===itemSlotForPosition(position));if(!item)continue;const art=equipmentArt(item);if(art)result[position]=Object.freeze({id:item.id,slot:item.slot,tier:item.rarity===5?item.tier:art.tier,artId:art.id,catalogId:item.catalogId,rarity:Number.isInteger(item.rarity)?Math.max(0,Math.min(6,item.rarity)):0});}return Object.freeze(result);
}

export const COMBOS=[
  {duration:.32,impact:.10,damage:1,range:1,dot:.38,push:22,step:25,name:'가로 베기'},
  {duration:.36,impact:.13,damage:1.15,range:1,dot:.3,push:30,step:30,name:'되베기'},
  {duration:.52,impact:.22,damage:1.85,range:1.12,dot:.12,push:70,step:50,name:'파쇄 마무리'},
];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const number=(x,fallback=0)=>Number.isFinite(x)?x:fallback;
const integer=(x,a,b,fallback=0)=>clamp(Math.floor(number(x,fallback)),a,b);
const length=(x,y)=>Math.hypot(x,y);
const direction=(x,y,fallback={x:1,y:0})=>{const d=length(x,y);return d>.0001?{x:x/d,y:y/d}:fallback;};
// Alpha 0.104: slower growth. A normal chapter yields about 10,000 XP, so a flat 1,000 per level from Lv.8
// puts chapter ends near Lv.11 / 20 / 30; early levels are cheaper for onboarding.
// 챕터 하나가 약 1만 경험치: Lv.10까지 빠르게 오르고, 그 뒤로 레벨당 약 3천이라 30챕터 끝에서 Lv.100 근처에 닿는다.
// Alpha 0.118: 상한 200, 같은 곡선을 60챕터까지 이어 간다.
export const xpNeeded=level=>level<10?300+250*level:3000+(level-10)*6;
export const GROWTH_XP_BANDS=Object.freeze([
 {until:MAX_LEVEL,multiplier:1},
].map(Object.freeze));
const XP_TOTALS=[0,0];for(let level=1;level<MAX_LEVEL;level++)XP_TOTALS[level+1]=XP_TOTALS[level]+xpNeeded(level);Object.freeze(XP_TOTALS);
export function growthXpMultiplier(level){for(let i=0;i<GROWTH_XP_BANDS.length;i++){const band=GROWTH_XP_BANDS[i];if(level<band.until)return band.multiplier;}return 1;}
// Each integer base-XP unit uses its starting band's multiplier. A boundary
// unit may carry a few XP forward; large grants and split grants are equivalent.
// No profile writes or per-point iteration, at most four band visits.
export function growthXp(profile,value){
 let remaining=integer(value,0,Number.MAX_SAFE_INTEGER),awarded=0;
 const level=integer(profile.level,1,MAX_LEVEL,1);let total=XP_TOTALS[level]+(level===MAX_LEVEL?0:integer(profile.xp,0,xpNeeded(level)-1));
 for(let i=0;i<GROWTH_XP_BANDS.length;i++){const band=GROWTH_XP_BANDS[i];
  const needed=XP_TOTALS[band.until]-total;if(needed<=0)continue;
  const units=Math.min(remaining,Math.ceil(needed/band.multiplier)),credit=units*band.multiplier;
  total+=credit;awarded+=credit;remaining-=units;if(!remaining)break;
 }
 return Math.min(Number.MAX_SAFE_INTEGER,awarded+remaining);
}
export function createProfile(now=Date.now()){
  return {version:PROFILE_VERSION,dungeonProgress:emptyDungeonProgress(),raids:emptyRaidProgress(),bossRush:rush.emptyRushProgress(),beastSkills:{},battleSerial:0,settledBattleIds:[],activeBattle:null,lastInterruptedBattle:null,selectedBuild:null,characterId:'lirian',equipmentRng:246813579,difficultyProgress:[STAGES.map(()=>0),STAGES.map(()=>0)],nightmareRecords:STAGES.map(()=>0),skillBook:skills.restoreSkillBook(null,1),favoriteItemIds:[],savedBuilds:[null,null,null,null,null],targetCraftId:null,craftTrackerVisible:true,materials:emptyMaterials(),tower:{best:0},transcendXp:0,transcendence:transcend.emptyTranscendence(),discoveredAncients:[],targetAncientId:null,bossMastery:STAGES.map(()=>-1),lootPity:0,legendaryPity:0,pendingGold:0,pendingMaterials:emptyMaterials(),pendingLoot:[],stageProgress:STAGES.map(()=>0),stageStars:stars.emptyStageStars(STAGES.length),starChests:stars.emptyStageStars(STAGES.length),gold:0,cores:0,level:1,xp:0,training:growth.emptyTraining(),growthTree:[],unlockedStage:1,clearedStage:0,totalKills:0,hunts:0,lastSeenAt:number(now),inventory:[],equipment:emptyEquipment(),nextItemId:1};
}
const EQUIPMENT_DEFINITIONS=new Map([...ITEM_CATALOG,...ANCIENT_CATALOG,...CRAFTED_CATALOG].map(row=>[row.id,row]));
function cleanItem(item,version){
  if(!item||typeof item.slot!=='string'||!Object.hasOwn(SLOTS,item.slot)||!Number.isInteger(item.id)||item.id<1||item.id>1e9)return null;
  // Alpha 0.136 seals keep only their first effect and level; the rest is re-derived.
  if(item.slot==='special'&&item.seal)return seals.cleanSeal(item,integer);
  // v15 (Alpha 0.112) renumbered ancients by region: old ancient-2 (ruins) is ancient-3, old ancient-3 (frost) is ancient-2.
  if(version<15&&typeof item.catalogId==='string'&&/^ancient-[23]-/.test(item.catalogId))item={...item,catalogId:ancientIdOfBase(item.catalogId),tier:{2:3,3:2}[item.tier]??item.tier};
  const affixes={};for(const id of Object.keys(AFFIXES)){const v=integer(item.affixes?.[id],0,affixCap(id));if(v)affixes[id]=v;}
  const clean={...(BUILD_EFFECTS[item.inscription]?{inscription:item.inscription}:{}),...(huntGrade(item)?{hunt:huntGrade(item)}:{}),id:item.id,slot:item.slot,rarity:integer(item.rarity,0,6),tier:integer(item.tier,1,THEMES.length,1),name:String(item.name??SLOTS[item.slot]).slice(0,32),affixes};
  // An ancient keeps its family's base art id, whose tier can differ from the ancient's region tier (0.112).
  // Alpha 0.122: earrings and Lilian seals got their own art; older saves name the shared charm art of their family
  // (crafted pieces keep their recipe art).
  if((clean.slot==='earring'||clean.slot==='special')&&item.rarity!==6&&/^(forest|ruins|frost)_charm$/.test(item.artId??''))item={...item,artId:`acc_t${['forest','ruins','frost'].indexOf(item.artId.split('_')[0])+1}_${clean.slot==='special'?'seal':'earring'}`};
  if(ALL_EQUIPMENT_ART.some(a=>a.id===item.artId&&a.slot===equipmentFamily(clean.slot)&&a.tier===clean.tier)||ancientDefinition({...clean,artId:item.artId,catalogId:item.catalogId}))clean.artId=item.artId;
  if(ITEM_CATALOG.some(a=>a.id===item.catalogId&&a.slot===clean.slot&&a.tier===clean.tier&&a.artId===clean.artId))clean.catalogId=item.catalogId;
  const candidateDefinition=EQUIPMENT_DEFINITIONS.get(item.catalogId),definition=candidateDefinition?.slot===clean.slot&&candidateDefinition.tier===clean.tier&&candidateDefinition.artId===clean.artId?candidateDefinition:null;
  if(clean.slot==='special'){if(!definition?.characterId)return null;clean.characterId=definition.characterId;}
  const crafted=version>=7?craftedDefinition(item):null;
  if(crafted)return restoreEquipmentProgress({...clean,name:crafted.name,catalogId:crafted.id,affixes:version>=10&&item.rollVersion===1?affixes:{...crafted.base}},item,version>=10);
  if(version<5&&clean.rarity>=5&&!clean.artId)clean.artId=equipmentArt(clean).id;
  const ancient=ancientDefinition({...clean,catalogId:item.catalogId})??(version<5&&clean.rarity>=5?ancientForLegacy(clean):null);
  if(ancient){clean.catalogId=ancient.id;clean.tier=ancient.tier;clean.rarity=5;clean.name=ancient.name;}else clean.rarity=Math.min(4,clean.rarity);
  if(item.perfect===true&&clean.catalogId&&clean.rarity>=2&&clean.rarity<=4)clean.perfect=true;
  // Alpha 0.123: a raid ancient keeps its rolled effect power (60~120%).
  if(clean.rarity===5&&ancientDefinition(clean)?.raid)clean.powerRoll=integer(item.powerRoll,RAID_POWER_ROLL.min,RAID_POWER_ROLL.max,100);
  return restoreEquipmentProgress(clean,item,version>=10);
}
export function restoreProfile(raw,now=Date.now()){
  let data=raw;try{if(typeof raw==='string')data=JSON.parse(raw);}catch{data=null;}
  const p=createProfile(now);if(!data||!Array.from({length:PROFILE_VERSION},(_,i)=>i+1).includes(data.version)||typeof data!=='object')return p;
  if(data.version>=7)for(const m of MATERIALS)p.materials[m.id]=integer(data.materials?.[m.id],0,MATERIAL_LIMIT);
  if(data.version>=7){setCraftTarget(p,typeof data.targetCraftId==='string'?data.targetCraftId:null);p.craftTrackerVisible=typeof data.craftTrackerVisible==='boolean'?data.craftTrackerVisible:true;}
  for(const d of DUNGEONS)p.dungeonProgress[d.id]=integer(data.dungeonProgress?.[d.id],0,DUNGEON_MAX_LEVEL);
  // Alpha 0.123 raids: this week's entries and lifetime clears (older saves start empty).
  p.bossRush={day:integer(data.bossRush?.day,-1,1e7,-1),entries:integer(data.bossRush?.entries,0,rush.RUSH_DAILY_ENTRIES),clears:integer(data.bossRush?.clears,0,1e6),best:integer(data.bossRush?.best,0,rush.RUSH_BOSSES)};
  p.raids.week=integer(data.raids?.week,-1,1e6,-1);for(const r of RAIDS){p.raids.entries[r.id]=integer(data.raids?.entries?.[r.id],0,RAID_WEEKLY_ENTRIES);p.raids.clears[r.id]=integer(data.raids?.clears?.[r.id],0,1e6);}
  p.battleSerial=integer(data.battleSerial,0,Number.MAX_SAFE_INTEGER);
  p.settledBattleIds=Array.isArray(data.settledBattleIds)?[...new Set(data.settledBattleIds.filter(x=>typeof x==='string'&&/^b[0-9]+:[0-9]+$/.test(x)))].slice(-64):[];
  p.lastInterruptedBattle=typeof data.activeBattle?.id==='string'?data.activeBattle.id.slice(0,40):typeof data.lastInterruptedBattle==='string'?data.lastInterruptedBattle.slice(0,40):null;
  p.selectedBuild=Number.isInteger(data.selectedBuild)&&data.selectedBuild>=0&&data.selectedBuild<5?data.selectedBuild:null;
  p.equipmentRng=integer(data.equipmentRng,0,4294967295,246813579);
  p.gold=integer(data.gold,0,1e8);p.cores=integer(data.cores,0,1e6);p.level=integer(data.level,1,MAX_LEVEL,1);
  // Recover reserved currency once. Recovered profiles start with empty reservations.
  p.gold=Math.min(1e8,p.gold+integer(data.pendingGold,0,1e8));
  for(const m of MATERIALS)p.materials[m.id]=Math.min(MATERIAL_LIMIT,p.materials[m.id]+integer(data.pendingMaterials?.[m.id],0,MATERIAL_LIMIT));
  p.skillBook=skills.restoreSkillBook(data.skillBook,p.level);
  p.xp=integer(data.xp,0,xpNeeded(p.level)-1);
  // Alpha 0.131 성장: saves without `training` refund their old 대장간 levels once; old 숙련 points simply return as 성장 포인트.
  if(!data.training&&data.forge){const refund=growth.legacyForgeRefund(data.forge);p.gold=Math.min(1e8,p.gold+refund.gold);p.cores=Math.min(1e6,p.cores+refund.cores);}
  p.clearedStage=integer(data.clearedStage,0,STAGES.length);p.unlockedStage=clamp(integer(data.unlockedStage,1,STAGES.length,1),1,Math.min(STAGES.length,p.clearedStage+1));
  // Legacy five-stage checkpoints retain their completion ratio; v8 is already ten-stage.
  p.stageProgress=STAGES.map(({id})=>id<=p.clearedStage?STAGES_PER_CHAPTER:id===p.unlockedStage?(data.version<8?integer(data.stageProgress?.[id-1],0,4)*2:integer(data.stageProgress?.[id-1],0,STAGES_PER_CHAPTER-1)):0);
  if(data.version>=6){const renumber=id=>typeof id==='string'&&data.version<15?ancientIdOfBase(id):id,discoveries=new Set(Array.isArray(data.discoveredAncients)?data.discoveredAncients.slice(0,ANCIENT_CATALOG.length).map(renumber):[]);p.discoveredAncients=ANCIENT_CATALOG.filter(r=>discoveries.has(r.id)).map(r=>r.id);setAncientTarget(p,typeof data.targetAncientId==='string'?renumber(data.targetAncientId):null);}
  p.bossMastery=STAGES.map(({id})=>id<=p.clearedStage?integer(data.version>=6?data.bossMastery?.[id-1]:0,0,2): -1);
  // Alpha 0.125 괴수 기술: learned grades (1 기본, 2 강화, 3 극). Saves from before 0.125 learn the basic technique of
  // every boss they had already beaten.
  for(const d of skills.BEAST_TECHNIQUES){const g=data.beastSkills&&typeof data.beastSkills==='object'?integer(data.beastSkills[d.id],0,3):p.bossMastery[d.chapter-1]>=0?1:0;if(g)p.beastSkills[d.id]=g;}
  // Old advanced modes were boss-only. Keep their earned unlocks, but do not
  // credit ordinary stages that were never played in that difficulty.
  p.difficultyProgress=[1,2].map(mode=>STAGES.map(({id})=>data.version>=9&&bossModeAvailable(p,id,mode)?integer(data.difficultyProgress?.[mode-1]?.[id-1],0,p.bossMastery[id-1]>=mode?STAGES_PER_CHAPTER:STAGES_PER_CHAPTER-1):0));
  // Alpha 0.132 별: only cleared stages keep stars; saves without the field get ★1 on every cleared stage. Chests need their stars.
  // Alpha 0.139 악몽 기록: fastest 악몽 boss stage clear in seconds (0 = none), only for chapters whose 악몽 boss fell.
  p.nightmareRecords=STAGES.map(({id})=>p.bossMastery[id-1]>=2?Math.round(clamp(number(data.nightmareRecords?.[id-1],0),0,600)*10)/10:0);
  p.stageStars=stars.cleanStageStars(data.stageStars,STAGES.map(({id})=>Math.max(...[0,1,2].map(d=>completedStages(p,id,d)))));p.starChests=stars.cleanStarChests(data.starChests,p);
  p.tower={best:integer(data.tower?.best,0,TOWER_MAX_FLOOR)};
  // Alpha 0.141 초월: only a Lv.200 profile keeps 초월 경험치; ranks never exceed the points it gives.
  p.transcendXp=p.level>=MAX_LEVEL?integer(data.transcendXp,0,transcend.TRANSCEND_XP_LIMIT):0;p.transcendence=transcend.cleanTranscendence(data.transcendence,transcend.transcendLevel(p.transcendXp));
  p.training=growth.cleanTraining(data.training,p.level);p.growthTree=growth.fitTree(p,data.growthTree);
  p.totalKills=integer(data.totalKills,0,1e9);p.hunts=integer(data.hunts,0,1e7);p.lastSeenAt=clamp(number(data.lastSeenAt,now),0,number(now));
  const seen=new Set();for(const rawItem of (Array.isArray(data.inventory)?data.inventory:[])){const item=cleanItem(rawItem,data.version);if(item&&!seen.has(item.id)&&p.inventory.length<INVENTORY_LIMIT){p.inventory.push(item);seen.add(item.id);}}
  p.equipment=restoreEquipment(data.equipment,p.inventory,p.characterId);
  // Protection must be restored before reserved loot can evict existing equipment.
  const favorites=new Set(Array.isArray(data.favoriteItemIds)?data.favoriteItemIds.slice(0,INVENTORY_LIMIT):[]);
  p.favoriteItemIds=p.inventory.filter(i=>favorites.has(i.id)).map(i=>i.id);
  p.savedBuilds=Array.from({length:5},(_,n)=>{
    const row=data.savedBuilds?.[n];if(!row||typeof row.name!=='string'||!row.equipment)return null;
    const equipment=emptyEquipment(),used=new Set();for(const slot of EQUIPMENT_KEYS){const id=row.equipment[slot]??null,owned=p.inventory.find(i=>i.id===id);if(id!==null&&(!Number.isInteger(id)||id<1||id>1e9||used.has(id)||owned&&(owned.slot!==itemSlotForPosition(slot)||owned.slot==='special'&&owned.characterId!==p.characterId)))return null;equipment[slot]=id;if(id!==null)used.add(id);}
    const skill=skills.restoreSkillBook({...p.skillBook,...row.skill,loadout:row.skill?.loadout??p.skillBook.loadout},p.level);
    return {name:row.name.trim().slice(0,24)||BUILD_NAMES[n],equipment,skill:skillSelection(skill),tree:growth.fitTree(p,row.tree??p.growthTree)};
  });
  p.lootPity=data.version>=4?integer(data.lootPity,0,9):0;
  p.legendaryPity=integer(data.legendaryPity,0,LEGENDARY_PITY_LIMIT-1);
  // Reserved drops survive a reload; duplicates already owned never award twice.
  for(const rawItem of (data.version>=4&&Array.isArray(data.pendingLoot)?data.pendingLoot.slice(0,MAX_PENDING_LOOT):[])){const item=cleanItem(rawItem,data.version);if(item&&!seen.has(item.id)){seen.add(item.id);storeItem(p,item);}}
  for(const item of p.inventory)discoverAncient(p,item);p.nextItemId=Math.max(integer(data.nextItemId,1,1e9,1),...p.inventory.map(i=>i.id+1));return p;
}
export function encodeProfile(profile,now=Date.now()){return JSON.stringify({...profileForSave(profile),lastSeenAt:number(now,profile.lastSeenAt)});}
// Past Lv.200 the experience goes to 초월 경험치 (Alpha 0.141).
function gainXp(p,value){p.xp+=Math.max(0,value);let levels=0;while(p.level<MAX_LEVEL&&p.xp>=xpNeeded(p.level)){p.xp-=xpNeeded(p.level);p.level++;levels++;}if(p.level>=MAX_LEVEL){p.transcendXp=Math.min(transcend.TRANSCEND_XP_LIMIT,(p.transcendXp??0)+p.xp);p.xp=0;}return levels;}
export function collectOffline(p,now=Date.now()){
  const minutes=Math.floor(clamp((number(now)-p.lastSeenAt)/60000,0,240));p.lastSeenAt=number(now,p.lastSeenAt);
  if(!p.clearedStage||!minutes)return{minutes:0,gold:0,xp:0};const gold=minutes*2*p.clearedStage,xp=growthXp(p,minutes*p.clearedStage);p.gold+=gold;gainXp(p,xp);return{minutes,gold,xp};
}
export function equipmentBonuses(p){const result={damage:0,hp:0,speed:0,crit:0,reduction:0};for(const item of p.inventory??[]){if(!isEquippedItem(p,item))continue;for(const[k,v]of Object.entries(item.affixes))result[k]+=effectiveAffix(item,k);}const set=setBonusStats(equippedSetCounts(p));for(const k of ['speed','crit','reduction'])result[k]+=set[k];for(const k of ['damagePct','hpPct','attackSpeed','range','regeneration','collection'])result[k]=set[k];
 // Alpha 0.136: the worn seal's stat effects (하옵·중옵) at its growth level.
 for(const item of p.inventory??[])if(seals.isSeal(item)&&isEquippedItem(p,item))for(const [k,v]of Object.entries(seals.sealStats(item)))result[k]=(result[k]??0)+v;
 return result;}
// Pieces worn per region set (Alpha 0.108), and each set's progress for the UI.
export function equippedSetCounts(p){const counts={};for(const item of p.inventory??[]){const set=itemSet(item);if(set&&isEquippedItem(p,item))counts[set]=(counts[set]??0)+1;}return counts;}
export function equippedSets(p){const counts=equippedSetCounts(p);return Object.entries(counts).map(([id,count])=>({set:EQUIPMENT_SETS[id],count,active:EQUIPMENT_SETS[id].bonuses.filter(b=>count>=b.pieces)})).sort((a,b)=>b.count-a.count);}
export function playerStats(p){const b=equipmentBonuses(p),t=growth.trainingRanks(p),tree=growth.treeBonus(p),tr=transcend.transcendBonus(p),tw=towerBonus(p.tower?.best),base=growth.levelGrowth(p.level),attackSpeed=1+base.attackSpeed+t.tempo*.01+tree.attackSpeed+b.attackSpeed/100;return{
  maxHp:(150+(p.level-1)*6+base.hp+t.vitality*12+b.hp)*(1+b.hpPct+tree.hpPct+tr.hpPct+tw.hpPct),
  damage:(24*(1+(p.level-1)*.035+base.damage+t.power*.05)+b.damage)*(1+b.damagePct+tree.damagePct+tr.damagePct+tw.damagePct),
  range:135*(1+base.range+tree.range+b.range/100),speed:280*(1+base.speed+t.stride*.01+tree.speed+b.speed/100),
  attackDuration:.32/attackSpeed,attackSpeed,
  thunderCooldown:4.8,thunderDamage:62+b.damage*1.8,
  crit:Math.min(.5,.05+t.precision*.005+tree.crit+tw.crit+b.crit/100),reduction:Math.min(.5,base.reduction+t.guard*.01+tree.reduction+tw.reduction+b.reduction/100),collection:110+t.stride*5+(equippedUniqueEffect(p,'charm')?.id==='magnet'?UNIQUE_EFFECTS.magnet.range:0)+b.collection,regeneration:.65+base.regeneration+tree.regeneration+b.regeneration};}
export function compareEquipment(profile,equipment){
 const next={...profile,equipment},before=playerStats(profile),after=playerStats(next),current=equipmentSynergies(profile),future=equipmentSynergies(next);
 const gained=future.filter(r=>!current.some(b=>b.id===r.id)),lost=current.filter(r=>!future.some(b=>b.id===r.id));
 return {before,after,deltas:Object.fromEntries(Object.keys(before).map(k=>[k,after[k]-before[k]])),gained,lost,kept:future.filter(r=>current.some(b=>b.id===r.id)),synergies:future};
}
export function compareItem(profile,id,position=null){const item=profile.inventory.find(i=>i.id===id),next=equipmentAfterEquip(profile,item,position);return next?compareEquipment(profile,next):null;}
const buildIndex=n=>Number.isInteger(n)&&n>=0&&n<5;
const skillSelection=b=>({loadout:structuredClone(b.loadout),auto:{...b.auto},awakening:b.awakening,branchPick:{...b.branchPick}});
export function buildStatus(profile,n){
 const build=buildIndex(n)?profile.savedBuilds?.[n]:null;if(!build||!build.equipment||typeof build.equipment!=='object'||Array.isArray(build.equipment))return {ok:false,reason:'빈 빌드 슬롯이야.'};
 const used=new Set();for(const [slot,id]of Object.entries(build.equipment)){const owned=profile.inventory.find(i=>i.id===id);if(!EQUIPMENT_KEYS.includes(slot)||id!==null&&(used.has(id)||owned?.slot==='special'&&owned.characterId!==(profile.characterId??'lirian')))return {ok:false,reason:'빌드 장비 위치가 올바르지 않아.'};if(id!==null)used.add(id);}
 const missing=Object.entries(build.equipment).filter(([slot,id])=>id!==null&&!profile.inventory.some(i=>i.id===id&&i.slot===itemSlotForPosition(slot)));
 return {ok:true,missing,reason:missing.length?missing.length+'개 장비를 찾을 수 없어 비워 두었습니다':'캠프에서 교체 가능',build};
}
export function saveBuild(s,n,name){
 if(!buildIndex(n)||s.phase!=='camp')return false;
 s.profile.savedBuilds[n]={name:String(name??'').trim().slice(0,24)||BUILD_NAMES[n],equipment:{...s.profile.equipment},skill:skillSelection(s.profile.skillBook),tree:[...s.profile.growthTree]};s.profile.selectedBuild=n;return true;
}
export function deleteBuild(s,n){if(!buildIndex(n)||s.phase!=='camp')return false;s.profile.savedBuilds[n]=null;if(s.profile.selectedBuild===n)s.profile.selectedBuild=null;return true;}
export function applyBuild(s,n){
 if(s.phase!=='camp')return {ok:false,reason:'빌드 교체는 캠프에서만 가능해.'};
 const status=buildStatus(s.profile,n);if(!status.ok)return status;
 const next=restoreEquipment(status.build.equipment,s.profile.inventory,s.profile.characterId),skill=skills.restoreSkillBook({...s.profile.skillBook,...status.build.skill,loadout:status.build.skill?.loadout??s.profile.skillBook.loadout},s.profile.level);
 s.profile.equipment=next;s.profile.skillBook={...s.profile.skillBook,...skillSelection(skill)};s.profile.selectedBuild=n;if(status.build.tree)s.profile.growthTree=growth.fitTree(s.profile,status.build.tree);
 s.loadout=uniqueLoadout(s.profile);s.buildEffects=buildEffects(s.profile);s.synergies=equipmentSynergies(s.profile);
 clearUniqueTransient(s);s.uniqueState.capacitor=0;s.uniqueState.momentumPower=0;s.inscriptionState={furyUntil:0,furyPower:0};s.skillRuntime=skills.createSkillRuntime();refreshStats(s,true);
 return {ok:true,missing:status.missing,reason:status.missing.length?status.reason:status.build.name+' 교체 완료'};
}
export function inscribeItem(s,itemId,id){
 if(s.phase!=='camp')return {ok:false,reason:'각인은 거점에서만 가능해.'};const r=inscriptionStatus(s.profile,itemId,id);if(!r.ok)return r;
 s.profile.gold-=r.cost.gold;for(const [key,n]of Object.entries(r.cost.materials))s.profile.materials[key]-=n;r.item.inscription=id;s.buildEffects=buildEffects(s.profile);return {ok:true,item:r.item,reason:r.definition.name+' 각인 완료'};
}

export function toggleFavorite(s,id){if(s.phase!=='camp'&&!s.paused||!s.profile.inventory.some(i=>i.id===id))return false;const p=s.profile;p.favoriteItemIds=p.favoriteItemIds.includes(id)?p.favoriteItemIds.filter(n=>n!==id):[...p.favoriteItemIds,id];return true;}
export function bulkSalvage(s,ids){
 if(strictBattle(s.profile)||s.settlement||s.phase!=='camp'&&!s.paused||!Array.isArray(ids)||!ids.length||ids.length>INVENTORY_LIMIT)return {ok:false,reason:'정비 중에 장비를 선택해줘.'};
 const selected=new Set(ids);if(selected.size!==ids.length)return {ok:false,reason:'중복 선택은 분해할 수 없어.'};
 const items=s.profile.inventory.filter(i=>selected.has(i.id));if(items.length!==ids.length||items.some(i=>itemProtection(s.profile,i)))return {ok:false,reason:'장비 상태가 바뀌었어. 보호된 장비는 분해할 수 없어.'};
 const gold=items.reduce((sum,i)=>sum+salvageValue(i),0),shards=items.reduce((sum,i)=>sum+seals.sealSalvageShards(i),0);s.profile.inventory=s.profile.inventory.filter(i=>!selected.has(i.id));s.profile.gold+=gold;
 // Alpha 0.136: a dismantled seal returns 인장 조각 (its grade's share plus half of the growth spent).
 if(shards)s.profile.materials.sealShard=Math.min(MATERIAL_LIMIT,s.profile.materials.sealShard+shards);
 return {ok:true,count:items.length,gold,shards,reason:items.length+'개 분해 · 골드 +'+gold+(shards?' · 인장 조각 +'+shards:'')};
}
export function createGame(profile=createProfile(),{durable=false}={}){
  profile.skillBook??=skills.restoreSkillBook(null,profile.level);
  const stats=playerStats(profile),s={profile,durable,settlement:null,buildEffects:buildEffects(profile),inscriptionState:{furyUntil:0,furyPower:0},effectBudget:50,skillRuntime:skills.createSkillRuntime(),phase:'camp',auto:false,paused:false,stageId:1,difficulty:0,bounds:{width:WORLD_BOUNDS.width,height:WORLD_BOUNDS.height,padding:80},
    player:{x:350,y:1160,hp:stats.maxHp,maxHp:stats.maxHp,stamina:100,action:'idle',actionTime:0,aimX:0,aimY:1,facing:1,attackHit:false,attackCooldown:0,dashCooldown:0,thunderCooldown:0,invulnerable:0,lastDamage:0,dashX:1,dashY:0,combo:0,comboWindow:0,queued:false,queuedAim:null,swing:null,counterReady:0,lookX:0,lookY:1,heading:2,motionDistance:0,lastAimRevision:0,moving:false},
    synergies:equipmentSynergies(profile),loadout:uniqueLoadout(profile),uniqueState:{cooldowns:{},cooldownKeys:[],momentum:0,momentumPower:0,capacitor:0,shield:0,shieldTime:0,shieldOwner:null,lastStand:false,still:0,orbit:null,ancientZones:[],ancientShields:emptyEquipment(),ancientBuffs:{}},spawnView:{width:720,height:1280},spawns:[],assist:{targetId:null,approaching:false,evade:null},enemies:[],projectiles:[],barrels:[],pickups:[],effects:[],run:{stage:1,startStage:1,wave:0,waveTime:0,waveKills:0,waveQuota:0,stageKills:0,stageQuota:0,timeLimit:0,timeRemaining:0,timedOut:false,flow:'idle',timer:0,kills:0,rooms:0,seals:0,gold:0,xp:0,xpBonus:0,trainingGold:0,startLevel:profile.level,cores:0,items:0,lootLedger:[],materialLedger:{},resourceRevision:0,stageItems:0,monsterItems:0,autoSalvaged:0,perfectDodges:0,guardBreaks:0,explosions:0,time:0,ancientProcs:0,craftedProcs:0,materials:0,synergyProcs:{shatter:0,execute:0},bossAncients:[],bossSpawned:false,bossKilled:false,beastLearned:null,stars:null,lowestHp:1},rng:12345,materialRng:98765,refiningRng:13579,promotionRng:97531,lootRng:54321,resultDelay:0,nextId:1,hitStop:0,shake:0,lastLoot:null};
  return s;
}
const random=s=>{s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296;};
const lootRandom=s=>{s.lootRng=(Math.imul(1664525,s.lootRng)+1013904223)>>>0;return s.lootRng/4294967296;};
const stageOf=s=>STAGES[s.stageId-1];
const themeOf=s=>stageOf(s)?.theme??1;
// Boss rule and attack-effect sheet follow the chapter biome (forest/fire/frost/ruins).
// Elite/nightmare boss cycles were authored for forest, ruins and frost; fire opens with a charge like frost.
const REPLAY_ROW={forest:0,ruins:1,frost:2,fire:2,sea:2,sky:0,divine:1};
const ruleOf=s=>s.run?.raidId?raidDefinition(s.run.raidId).mechanic:s.run?.rush?STAGES[s.run.rushBoss-1]?.bossRule??'regen':stageOf(s)?.bossRule??'regen',fxOf=s=>stageOf(s)?.effects??1;
function effect(s,type,data={},ttl=.6){if(s.effects.length>=400)return;s.effects.push({id:s.nextId++,type,ttl,maxTtl:ttl,...data});}
function setLook(p,x,y,lock=false){if(Math.hypot(x,y)<.01)return;p.lookX=x;p.lookY=y;p.heading=directionIndex(x,y,lock?null:p.heading);}
function setAction(p,action){if(p.action!==action){p.action=action;p.actionTime=0;}}
function clampPosition(e,b){e.x=clamp(e.x,b.padding,b.width-b.padding);e.y=clamp(e.y,b.padding,b.height-b.padding);}
function spawnEnemy(s,type,x,y,elite=false,boss=false,speciesId=null){
  // Alpha 0.133: health and damage follow the chapter's threat curve (raids keep the old scale); s.enemyScale is a test/sim override.
  const st=stageOf(s),raid=!!s.run.raidId,rushK=s.run.rush?rush.rushScale(st.id):1,hpBase=(raid?st.multiplier:st.hpScale)*(s.enemyScale?.hp??1)*rushK,damageBase=(raid?st.multiplier:st.damageScale)*(s.enemyScale?.damage??1)*rushK,factor=1+(s.run.stage-1)*.08,hp=boss?Math.round(st.bossHp*(s.enemyScale?.hp??1)):Math.round((elite?190:type==='bulwark'?110:type==='spitter'?62:48)*hpBase*factor);
  const e={id:s.nextId++,type,boss,elite,wave:s.run.wave,runStage:s.run.stage,x,y,hp,maxHp:hp,action:'idle',actionTime:0,dead:false,facing:1,aggro:false,
    speed:boss?80:type==='bulwark'?82:type==='spitter'?90:112,cooldown:1,damage:(boss?26:elite?20:type==='bulwark'?15:type==='spitter'?10:8)*damageBase*(boss||raid||s.run.dungeonId&&s.run.dungeonId!=='tower'?1:THREAT.mob),damageBase,
    radius:boss?145:type==='bulwark'?90:type==='spitter'?16:58,windup:.5,pattern:0,targetX:0,targetY:0,chargeX:0,chargeY:0,
    guardMax:type==='bulwark'&&!boss?100:0,guard:type==='bulwark'&&!boss?100:0,guardX:-1,guardY:0,exposed:0,perfectDodged:false,enraged:false,lookX:0,lookY:1,heading:2,motionDistance:0,backpedal:false,moving:false,bleedTicks:0,bleedTimer:0,bleedDamage:0,chillRemaining:0};
  const lineup=st.stages[clamp(s.run.stage,1,st.stages.length)-1],mid=elite&&speciesId&&speciesId===st.midBoss,species=boss?(s.run.raidId?raidDefinition(s.run.raidId).species:s.run.rush?STAGES[s.run.rushBoss-1].bossSpecies:st.bossSpecies):mid||st.roster.includes(speciesId)&&MONSTERS[speciesId].role===type?speciesId:lineup[type],design=MONSTERS[species];
  e.species=species;e.name=design.name;e.chapterId=st.id;if(boss&&design.special){e.special=true;e.radius+=25;}if(mid){e.midBoss=true;e.radius+=40;}e.plate=s.run.rule?.armor??0;


  for(const key of ['speed','radius','attackRange','chargeEvery','chargeSpeed','chargeDuration','shots','shotSpeed','shotSpread','shotColor','projectileStyle','attackCycle','attackInterval','standoffMin','standoffMax'])if(design[key]!=null&&!boss)e[key]=design[key];
  if(design.guardMax!=null&&!boss)e.guard=e.guardMax=design.guardMax;
  if(!boss){const swarm=!elite&&type==='skitter';e.hp=e.maxHp=Math.round(hp*(design.hpScale??1)*(swarm?.72:1));e.damage*=(design.damageScale??1)*(swarm?.75:1);}
  if(s.run.rule?.swarm){e.speed*=1.15;e.hp=e.maxHp=Math.round(e.maxHp*.8);}
  if(elite&&s.run.rule?.eliteHp)e.hp=e.maxHp=Math.round(e.maxHp*s.run.rule.eliteHp);
  if(e.midBoss){e.hp=e.maxHp=Math.round(e.maxHp*2.5);e.damage*=1.3;}
  if(design.windup)e.windupBase=design.windup;
  // Raid boss: the raid's multiple of the opened chapter's boss health, 1.2× damage, its own cycle and armor (Alpha 0.123).
  if(s.run.raidId&&boss){const r=raidDefinition(s.run.raidId),scale=raidScale(st.id);e.hp=e.maxHp=Math.round(st.raidBossHp*r.hp*scale);e.damage*=RAID_DAMAGE*scale;e.bossCycle=r.cycle;e.plate=r.armor??0;e.radius+=20;e.raid=r.id;}
  // Alpha 0.139 레이드 난이도: 정예/악몽 raids scale everything in them like 정예/악몽 chapter 60 (brood keeps its multiple on top).
  if(s.run.raidId&&s.run.raidTier){const k=modeScale(MODE_CHAPTERS,s.run.raidTier);e.hp=e.maxHp=Math.round(e.maxHp*k.hp);e.damage*=k.damage;if(boss)e.projectileDamageScale=k.damage;}
  // Alpha 0.136 보스 러시: boss n has RUSH_HP[n] × the furthest cleared chapter's boss health and RUSH_DAMAGE[n] × its damage,
  // everything in a rush (bosses, escorts, projectiles via damageBase) is eased by rushScale(chapter).
  if(s.run.rush&&boss){const n=clamp(s.run.wave,1,rush.RUSH_BOSSES)-1;e.hp=e.maxHp=Math.round(st.bossHp*rush.RUSH_HP[n]*rushK*(s.enemyScale?.hp??1));e.damage*=rush.RUSH_DAMAGE[n];e.rushChapter=s.run.rushBoss;}
  // Alpha 0.141: dungeon levels carry their whole strength in plan.hpScale (chapter curve), not the stage factor of s.run.stage.
  if(s.run.dungeonId){const plan=activePlan(s);e.hp=e.maxHp=Math.max(1,Math.round(e.maxHp*plan.hpScale/(hpBase*(boss?1:factor))));e.damage*=plan.damageScale/damageBase;e.damageBase=plan.damageScale;}
  // Alpha 0.133 관문 (stage-gates.js): the remaining pressure after the build's counter.
  const gate=s.run.gate;if(gate&&!raid&&!s.run.dungeonId){const k=1+gate.effect;if(gate.type==='survival'){e.damage*=k;e.damageBase*=k;}else if(gate.type==='swarm'&&!elite&&!boss)e.hp=e.maxHp=Math.round(e.maxHp*k);else if(gate.type==='single'&&(elite||boss))e.hp=e.maxHp=Math.round(e.maxHp*k);else if(gate.type==='defense'){e.gateGuard=k;e.gateCounter=gate.counter;}}
  // Alpha 0.139: 정예/악몽 continue the chapter curve (chapters.js modeScale: chapter 60+N / 120+N).
  if(s.difficulty>0){const mode=HUNT_MODES[s.difficulty],k=modeScale(st.id,s.difficulty);e.hp=e.maxHp=Math.round(e.maxHp*k.hp);e.damage*=k.damage;
   if(boss){e.radius+=s.difficulty*10;e.shotSpeed=420*mode.shotSpeed;e.projectileDamageScale=k.damage;e.bossCycle=REPLAY_CYCLES[s.difficulty][REPLAY_ROW[st.biome]??0];e.huntMode=s.difficulty;}}
  s.enemies.push(e);return e;
}
export function launch(s,chapterId=1,substage=1,view=null,difficulty=0){
  if(!huntMode(difficulty)||s.profile.battleSerial>=Number.MAX_SAFE_INTEGER)return false;
  if(!['camp','victory','defeat'].includes(s.phase)||!Number.isInteger(chapterId)||chapterId<1||chapterId>STAGES.length||!Number.isInteger(substage)||substage<1||substage>stageLimit(s.profile,chapterId,difficulty))return false;
  const auto=s.auto,durable=s.durable;Object.assign(s,createGame(s.profile,{durable}));s.auto=auto;s.stageId=chapterId;s.difficulty=difficulty;s.profile.hunts++;s.profile.lastInterruptedBattle=null;
  s.rng=(12345+s.profile.hunts*97+chapterId*1009)>>>0;s.lootRng=(s.rng^0x9e3779b9)>>>0;s.materialRng=(s.rng^0xa341316c)>>>0;s.refiningRng=(s.rng^0x82a2b175)>>>0;s.promotionRng=(s.rng^0x5bd1e995)>>>0;s.phase='playing';s.run.stage=s.run.startStage=substage;s.spawnView.width=clamp(number(view?.width,720),360,1600);s.spawnView.height=clamp(number(view?.height,1280),400,1800);
  s.profile.battleSerial++;s.run.battleId='b'+s.profile.battleSerial;s.run.buildAtStart=Object.freeze({equipment:Object.freeze({...s.profile.equipment}),skill:skillSelection(s.profile.skillBook)});
  prepareStage(s);return true;
}
function spawnPoint(s,chosen=[],heading=null,spread=Math.PI*2){
  const p=s.player,v=s.spawnView,rx=Math.min(310,v.width*.37),ry=Math.min(390,v.height/GROUND_DEPTH_SCALE*.28);
  const pointAt=(angle,reach)=>({x:clamp(p.x+Math.cos(angle)*rx*reach,s.bounds.padding+45,s.bounds.width-s.bounds.padding-45),y:clamp(p.y+Math.sin(angle)*ry*reach,s.bounds.padding+45,s.bounds.height-s.bounds.padding-45)});
  const clearance=q=>{let best=Infinity;for(const other of chosen)best=Math.min(best,length(other.x-q.x,other.y-q.y));return best;};
  let best=null,bestSpace=-1;
  for(let attempt=0;attempt<64;attempt++){
    // Prefer the authored formation, then widen it when crowding/world edges block it.
    const angle=heading===null||attempt>=32?random(s)*Math.PI*2:heading+(random(s)-.5)*spread,q=pointAt(angle,.78+random(s)*.22);
    if(length(q.x-p.x,q.y-p.y)<170)continue;const space=clearance(q);if(space>70)return q;if(space>bestSpace){best=q;bestSpace=space;}
  }
  // A bounded deterministic scan never reuses one fixed fallback for several mobs.
  for(let i=0;i<48;i++){const q=pointAt(i*Math.PI/12,i<24?.8:1);if(length(q.x-p.x,q.y-p.y)<170)continue;const space=clearance(q);if(space>70)return q;if(space>bestSpace){best=q;bestSpace=space;}}
  return best??{x:clamp(p.x+(p.x<s.bounds.width/2?220:-220),125,s.bounds.width-125),y:clamp(p.y+(p.y<s.bounds.height/2?180:-180),125,s.bounds.height-125)};
}
const activePlan=s=>s.run.raidId?raidPlan(s.run.raidId):s.run.rush?rush.rushPlan():s.run.dungeonId?dungeonPlan(s.run.dungeonId,s.run.stage):battlePlan(s.run.stage);
// Alpha 0.123 raid: one patterned boss on the furthest opened chapter's ground. The weekly entry is spent before the
// stage journal is taken, so a failed or abandoned raid (which rolls the journal back) keeps the entry spent.
// A raid fights on the opened chapter's ground with its own boss; app.js loads it as region raidRegionId(raid, chapter).
export const raidRegionId=(id,chapter)=>'raid-'+id+'-'+chapter;
export const RAID_REGIONS=Object.freeze(RAIDS.flatMap(r=>STAGES.map(c=>Object.freeze({...c,id:raidRegionId(r.id,c.id),bossSpecies:r.species,midBoss:null}))));
export function launchRaid(s,id,now=Date.now(),view=null,tier=0){
 const r=raidDefinition(id);if(!r||s.settlement||!['camp','victory','defeat'].includes(s.phase)||!raidUnlocked(s.profile,id)||!raidTierUnlocked(s.profile,tier)||raidEntriesLeft(s.profile,id,now)<1||s.profile.battleSerial>=Number.MAX_SAFE_INTEGER)return false;
 const chapter=raidChapter(s.profile,STAGES.length),durable=s.durable;Object.assign(s,createGame(s.profile,{durable}));s.auto=true;s.stageId=chapter;s.difficulty=0;s.profile.hunts++;s.profile.lastInterruptedBattle=null;s.profile.battleSerial++;
 const week=raidWeek(now),raids=s.profile.raids;if(raids.week!==week){raids.week=week;for(const k of Object.keys(raids.entries))raids.entries[k]=0;}raids.entries[id]++;
 s.rng=(12345+s.profile.hunts*97+chapter*1009+RAIDS.indexOf(r)*7919)>>>0;s.lootRng=(s.rng^0x9e3779b9)>>>0;s.materialRng=(s.rng^0xa341316c)>>>0;s.phase='playing';s.run.stage=s.run.startStage=1;s.run.raidId=id;s.run.raidChapter=chapter;s.run.raidTier=tier;s.run.battleId='b'+s.profile.battleSerial;s.run.buildAtStart=Object.freeze({equipment:Object.freeze({...s.profile.equipment}),skill:skillSelection(s.profile.skillBook)});
 s.spawnView.width=clamp(number(view?.width,720),360,1600);s.spawnView.height=clamp(number(view?.height,1280),400,1800);prepareStage(s);return true;
}
// Alpha 0.136 보스 러시: three entries a day (spent before the stage journal, so a run with no boss felled keeps it spent),
// fought on the furthest cleared chapter's ground; app.js loads region rushRegionId(chapter) with the other four bosses.
export const rushRegionId=chapter=>'rush-'+chapter;
export const RUSH_REGIONS=Object.freeze(STAGES.map(c=>Object.freeze({...c,id:rushRegionId(c.id),extraSpecies:Object.freeze(rush.rushLineup(c.id).filter(n=>n!==c.id).map(n=>STAGES[n-1].bossSpecies))})));
export function launchBossRush(s,now=Date.now(),view=null){
 if(s.settlement||!['camp','victory','defeat'].includes(s.phase)||!rush.rushUnlocked(s.profile)||rush.rushEntriesLeft(s.profile,now)<1||s.profile.battleSerial>=Number.MAX_SAFE_INTEGER)return false;
 const chapter=rush.rushChapter(s.profile,STAGES.length),durable=s.durable;Object.assign(s,createGame(s.profile,{durable}));s.auto=true;s.stageId=chapter;s.difficulty=0;s.profile.hunts++;s.profile.lastInterruptedBattle=null;s.profile.battleSerial++;
 const day=rush.rushDay(now),r=s.profile.bossRush;if(r.day!==day){r.day=day;r.entries=0;}r.entries++;
 s.rng=(12345+s.profile.hunts*97+chapter*1009+day*31)>>>0;s.lootRng=(s.rng^0x9e3779b9)>>>0;s.materialRng=(s.rng^0xa341316c)>>>0;s.phase='playing';s.run.stage=s.run.startStage=1;s.run.rush=true;s.run.rushChapter=chapter;s.run.rushLineup=rush.rushLineup(chapter);s.run.rushKills=0;s.run.rushEnd=null;s.run.battleId='b'+s.profile.battleSerial;s.run.buildAtStart=Object.freeze({equipment:Object.freeze({...s.profile.equipment}),skill:skillSelection(s.profile.skillBook)});
 s.spawnView.width=clamp(number(view?.width,720),360,1600);s.spawnView.height=clamp(number(view?.height,1280),400,1800);prepareStage(s);return true;
}
export function launchDungeon(s,id,level=1,view=null){
 const d=dungeonDefinition(id);if(!d||s.settlement||!['camp','victory','defeat'].includes(s.phase)||!Number.isInteger(level)||level<1||level>dungeonLimit(s.profile,id)||s.profile.battleSerial>=Number.MAX_SAFE_INTEGER)return false;
 const auto=true,durable=s.durable;Object.assign(s,createGame(s.profile,{durable}));s.auto=auto;s.stageId=dungeonStageId(id,level);s.difficulty=0;s.profile.hunts++;s.profile.lastInterruptedBattle=null;s.profile.battleSerial++;
 s.rng=(12345+s.profile.hunts*97+chapterTheme(d.chapter).id*1009+level*41)>>>0;s.lootRng=(s.rng^0x9e3779b9)>>>0;s.phase='playing';s.run.stage=s.run.startStage=level;s.run.dungeonId=id;s.run.battleId='b'+s.profile.battleSerial;s.run.buildAtStart=Object.freeze({equipment:Object.freeze({...s.profile.equipment}),skill:skillSelection(s.profile.skillBook)});
 s.spawnView.width=clamp(number(view?.width,720),360,1600);s.spawnView.height=clamp(number(view?.height,1280),400,1800);prepareStage(s);return true;
}
function prepareStage(s,immediate=false){
  const plan=activePlan(s);s.run.stageType=plan.stageType;s.run.rule=s.run.raidId?{type:'raid',name:plan.name,rule:plan.rule,hint:plan.hint,armor:0}:s.run.rush?{type:'rush',name:plan.name,rule:plan.rule,hint:plan.hint,armor:0}:s.run.dungeonId?{type:'dungeon',name:plan.kind,rule:plan.rule,hint:plan.hint,armor:plan.armor??0}:stageRule(s.stageId,s.run.stage);s.run.stageKills=0;s.run.stageQuota=plan.waves.reduce((sum,w)=>sum+w.skitter+w.spitter+w.bulwark,0);s.run.timeLimit=s.run.timeRemaining=plan.timeLimit;s.run.timedOut=false;s.run.stars=null;s.run.lowestHp=1;s.run.gate=s.run.raidId||s.run.rush||s.run.dungeonId?null:gates.gateEffect(s.profile,gates.stageGate(s.stageId,s.run.stage,s.difficulty));
  beginStageJournal(s);const p=s.player;skills.clearSkillStage(s);clearUniqueTransient(s);s.enemies.length=0;s.spawns.length=0;s.projectiles.length=0;s.barrels.length=0;s.pickups=s.pickups.filter(isResourcePickup);s.effects.length=0;
  p.action='idle';p.actionTime=0;p.queued=false;p.queuedAim=null;p.combo=0;p.comboWindow=0;p.swing=null;p.attackCooldown=0;
  s.assist={targetId:null,approaching:false,evade:null};s.run.wave=0;s.run.bossSpawned=false;s.hitStop=0;s.shake=0;
  for(let i=0;i<plan.barrels;i++){const pos=spawnPoint(s,s.barrels);s.barrels.push({id:s.nextId++,kind:'barrel',...pos,hp:18,status:'idle',fuse:0,radius:205});}
  beginWave(s,immediate);
}
function beginWave(s,immediate=false){
  s.run.wave++;s.run.waveTime=0;s.run.waveKills=0;s.run.flow='combat';s.run.timer=0;if(s.run.rush)s.run.rushBoss=s.run.rushLineup[s.run.wave-1];
  const plan=activePlan(s),actors=s.run.raidId||s.run.rush?[{type:'bulwark',boss:true,elite:false}]:s.run.dungeonId?dungeonActors(plan,s.run.wave):waveComposition(s.run.stage,s.run.wave),base=random(s)*Math.PI*2;
  s.run.waveQuota=actors.length;
  // Shuffle arrivals while preserving the encounter's role mix and elite quota.
  for(let i=actors.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[actors[i],actors[j]]=[actors[j],actors[i]];}
  const pools=Object.fromEntries(['skitter','spitter','bulwark'].map(type=>[type,chapterMonsterPool(s.stageId,s.run.stage,type)])),arrivals={skitter:0,spitter:0,bulwark:0};
  let ranged=0,midBossPlaced=false;
  for(let i=0;i<actors.length;i++){
    const actor=actors[i],pool=pools[actor.type];
    if(!actor.boss)actor.species=pool[(s.profile.hunts+s.run.stage+s.run.wave+arrivals[actor.type]++)%pool.length];
    // Ice chapters: the first elite of stage 8's last wave is the chapter's mid-boss.
    if(actor.elite&&!midBossPlaced&&stageOf(s).midBoss&&!s.run.dungeonId&&s.run.stage===8&&s.run.wave===stageWaveCount(s.run.stage)){midBossPlaced=true;actor.type='bulwark';actor.species=stageOf(s).midBoss;}
    let heading=base,spread=1.8;
    if(plan.formation==='crossfire'&&actor.type==='spitter'){heading=base+(ranged++%2)*Math.PI;spread=.35;}
    else if(plan.formation==='front'){heading=base+(actor.type==='spitter'?Math.PI:.1*i);spread=.75;}
    else if(plan.formation==='ring'){heading=base+i*Math.PI*2/actors.length;spread=.25;}
    else if(plan.formation==='pincer'){heading=base+(i%2)*Math.PI;spread=.65;}
    else if(plan.formation==='barrage'){heading=base+(actor.type==='spitter'?Math.PI:0);spread=actor.type==='spitter'?1.2:2;}
    else if(plan.formation==='surge'){heading=base+Math.floor(i/4)*Math.PI;spread=.8;}
    else if(plan.formation==='boss'){heading=base+i*Math.PI*2/actors.length;spread=.9;}
    const pos=spawnPoint(s,s.spawns,heading,spread);
    let delay=(actor.elite||actor.boss?1.3:SPAWN_WARNING)+(plan.minimumTime?Math.floor(i/6)*.55+(i%6)*plan.interval:i*plan.interval);
    if(immediate)delay=i<6?0:Math.max(0,delay-SPAWN_WARNING);
    s.spawns.push({id:s.nextId++,...pos,...actor,delay,warning:actor.elite||actor.boss?1.3:SPAWN_WARNING,heading,spread,locked:delay<=(actor.elite||actor.boss?1.3:SPAWN_WARNING)});
  }
  if(actors.some(a=>a.boss)){s.run.bossSpawned=true;effect(s,'bossArrival',{},1.3);}
  if(immediate)advanceSpawns(s,0);
}
function advanceSpawns(s,dt,rush=false){
  let active=0;for(const e of s.enemies)if(!e.dead)active++;
  // Empty combat must not wait for a staggered arrival. Keep the same queued
  // identities/quotas and admit only the earliest due reservation.
  if(rush&&!active&&s.spawns.length){let first=Infinity;for(const q of s.spawns)first=Math.min(first,q.delay);if(first>0)for(const q of s.spawns)q.delay-=first;}
  let write=0;for(const q of s.spawns){
    q.delay-=dt;
    if(q.locked===false&&q.delay<=q.warning){Object.assign(q,spawnPoint(s,s.spawns.filter(v=>v!==q&&v.locked),q.heading,q.spread));q.locked=true;}
    if(q.delay<=0&&active<MAX_ACTIVE_ENEMIES){const e=spawnEnemy(s,q.type,q.x,q.y,q.elite,q.boss,q.species);e.aggro=true;active++;}
    else s.spawns[write++]=q;
  }
  s.spawns.length=write;
}
const isResourcePickup=drop=>drop.kind==='gold'||drop.kind==='material';
function collectRemainder(s,resources=true){
  const waiting=resources?null:s.pickups.filter(isResourcePickup);
  if(waiting)s.pickups=s.pickups.filter(drop=>!isResourcePickup(drop));
  for(const drop of s.pickups){drop.x=s.player.x;drop.y=s.player.y;}updatePickups(s,0,true);
  if(waiting)for(const drop of waiting){drop.vacuum=true;s.pickups.push(drop);}
}
function stageCleared(s){
  skills.clearSkillStage(s);collectRemainder(s,false);const n=s.run.stage;s.run.rooms++;s.run.seals=s.run.rooms;
  recordStageClear(s,n);
  const gold=18+s.stageId*6+n*3;s.profile.gold+=gold;s.run.gold+=gold;s.profile.cores++;s.run.cores++;
  // Alpha 0.137.1 (사용자 요청): a cleared stage restores full health (it was +25% of max).
  const nextHp=s.player.maxHp,healed=nextHp-s.player.hp;
  awardItem(s,STAGE_SLOTS[(n-1)%STAGE_SLOTS.length],{gold,cores:1,healed});
  s.player.hp=nextHp;s.player.stamina=100;
  s.projectiles.length=0;s.spawns.length=0;s.barrels.length=0;s.player.queued=false;s.player.queuedAim=null;s.player.action='idle';s.player.actionTime=0;s.player.moving=false;s.player.swing=null;s.player.combo=0;s.player.comboWindow=0;s.player.attackCooldown=0;
  clearUniqueTransient(s);s.run.flow='stageClear';s.run.timer=0;queueSettlement(s,false);
}
function updateCampaign(s,dt){
  if(s.run.flow==='break'){
    s.run.timer=Math.max(0,s.run.timer-dt);if(!s.run.timer)beginWave(s,true);return;
  }
  if(s.run.flow!=='combat'||s.enemies.some(e=>!e.dead))return;
  if(s.spawns.length){if(s.run.waveKills>0)advanceSpawns(s,0,true);return;}
  if(s.run.waveKills<s.run.waveQuota)return;
  collectRemainder(s,false);s.projectiles.length=0;
  if(s.run.wave===activePlan(s).waves.length){
    if(s.run.raidId){completeRaid(s);return;}
    if(s.run.rush){completeRush(s);return;}
    if(s.run.dungeonId){completeDungeon(s);return;}
    if(s.run.stage<STAGES_PER_CHAPTER){
      stageCleared(s); // The acknowledgement owns the next-stage transition.
    }return;
  }
  s.player.hp=Math.min(s.player.maxHp,s.player.hp+s.player.maxHp*.08);s.player.stamina=Math.min(100,s.player.stamina+15);
  beginWave(s,true);effect(s,'roomClear',{x:s.player.x,y:s.player.y},.7);
}
export function returnToCamp(s){if(s.phase==='camp'||s.settlement)return false;finishFailedStage(s);settleResources(s);collectGear(s);const auto=s.auto,durable=s.durable;Object.assign(s,createGame(s.profile,{durable}));s.auto=auto;return true;}
export function resultReady(s){return s.phase==='victory'&&s.resultDelay<=0||s.phase==='defeat'&&(s.run.timedOut||s.player.actionTime>=ACTION_DURATIONS.death);}
// Alpha 0.131 성장: 능력치 단련 and 성장 트리 are changed in camp only.
export function trainStat(s,id){if(s.phase!=='camp'||!growth.train(s.profile,id))return false;refreshStats(s,true);return true;}
// Alpha 0.141 초월: camp only, free reset like 능력치 단련.
export function trainTranscend(s,id){const p=s.profile;if(s.phase!=='camp'||transcend.transcendStatus(p,id))return false;p.transcendence[id]=(p.transcendence[id]??0)+1;refreshStats(s,true);return true;}
export function resetTranscendence(s){if(s.phase!=='camp')return false;s.profile.transcendence=transcend.emptyTranscendence();refreshStats(s,true);return true;}
export function resetTrainingStats(s){if(s.phase!=='camp')return false;growth.resetTraining(s.profile);refreshStats(s,true);return true;}
export function learnGrowthNode(s,id){if(s.phase!=='camp'||!growth.learnNode(s.profile,id))return false;refreshStats(s,true);return true;}
// Alpha 0.132 별 상자: camp only; rewards go straight to the profile.
export function claimStarChest(s,chapter,tier){const p=s.profile;if(s.phase!=='camp'||stars.chestStatus(p,chapter,tier))return null;
 const r=stars.starChestReward(chapter,tier,STAGES[chapter-1].multiplier);p.starChests[chapter-1]|=1<<(tier-1);p.gold=Math.min(1e8,p.gold+r.gold);p.cores=Math.min(1e6,p.cores+r.cores);
 for(const [id,n] of Object.entries(r.materials))p.materials[id]=Math.min(MATERIAL_LIMIT,p.materials[id]+n);refreshStats(s,true);return r;}
// Alpha 0.139: a learned node can be given back when nothing beyond it hangs on it.
export function forgetGrowthNode(s,id){if(s.phase!=='camp'||!growth.forgetNode(s.profile,id))return false;refreshStats(s,true);return true;}
export function resetGrowthTree(s){if(s.phase!=='camp')return false;growth.resetTree(s.profile);refreshStats(s,true);return true;}
function refreshStats(s,heal=false){const old=s.player.maxHp,stats=playerStats(s.profile);s.player.maxHp=stats.maxHp;s.player.hp=heal?stats.maxHp:clamp(s.player.hp+Math.max(0,stats.maxHp-old),0,stats.maxHp);let remaining=stats.maxHp*.25;for(const slot of ANCIENT_SLOTS){const shield=s.uniqueState.ancientShields[slot];if(shield){shield.amount=Math.min(shield.amount,remaining);remaining-=shield.amount;if(shield.amount<=0)s.uniqueState.ancientShields[slot]=null;}}}
// Alpha 0.136 인장 성장 (camp only): shards + gold per level; levels 5 and 10 add an effect.
export function sealGrowthStatus(profile,id){
 const item=profile.inventory.find(i=>i.id===id);if(!seals.isSeal(item))return {ok:false,reason:'인장을 선택해줘.'};
 const cost=seals.sealGrowthCost(item);if(!cost)return {ok:false,item,cost:null,reason:'최대 성장 '+seals.SEAL_MAX_LEVEL+'단계'};
 const next=seals.SEAL_EFFECT_LEVELS[item.seal.level+1],ok=profile.materials.sealShard>=cost.shards&&profile.gold>=cost.gold;
 return {ok,item,cost,adds:next===undefined?null:next,reason:!ok?'인장 조각 또는 골드가 부족해.':next===undefined?'모든 효과 +'+Math.round(seals.SEAL_LEVEL_POWER*100)+'%':'모든 효과 +'+Math.round(seals.SEAL_LEVEL_POWER*100)+'% · '+seals.SEAL_GRADES[next].name+' 효과 추가'};
}
export function growSealItem(s,id){
 if(s.phase!=='camp')return {ok:false,reason:'인장 성장은 거점에서만 가능해.'};const r=sealGrowthStatus(s.profile,id);if(!r.ok)return r;
 s.profile.materials.sealShard-=r.cost.shards;s.profile.gold-=r.cost.gold;const added=seals.growSeal(r.item);
 s.loadout=uniqueLoadout(s.profile);s.synergies=equipmentSynergies(s.profile);refreshStats(s,true);
 return {ok:true,item:r.item,added:added||null,reason:'인장 성장 '+r.item.seal.level+'단계'+(added?' · '+seals.SEAL_GRADES[added.grade].name+' '+added.name+' 추가':'')};
}
export function canEquipItem(s,id){return !s.settlement&&(s.phase==='camp'||s.paused)&&ownedAtStageStart(s.profile,id);}
export function equipItem(s,id,position=null){
 if(!canEquipItem(s,id))return false;const item=s.profile.inventory.find(i=>i.id===id),next=equipmentAfterEquip(s.profile,item,position);if(!next)return false;
 const previousHp=s.player.hp,previous=s.profile.equipment;s.profile.selectedBuild=null;s.profile.equipment=next;s.loadout=uniqueLoadout(s.profile);s.buildEffects=buildEffects(s.profile);s.synergies=equipmentSynergies(s.profile);
 for(const slot of EQUIPMENT_KEYS)if(previous[slot]!==next[slot]){s.uniqueState.ancientShields[slot]=null;s.uniqueState.ancientZones=s.uniqueState.ancientZones.filter(z=>z.slot!==slot);}
 if(previous.charm!==next.charm){s.uniqueState.momentum=0;s.uniqueState.capacitor=0;}
 if(previous.armor!==next.armor){s.uniqueState.shield=0;s.uniqueState.shieldTime=0;}
 refreshStats(s,s.phase==='camp');if(s.phase!=='camp')s.player.hp=Math.min(previousHp,s.player.maxHp);return true;
}

// Workshop randomness is persisted separately from combat and future loot rolls.
function equipmentRandom(p){p.equipmentRng=(Math.imul(1664525,p.equipmentRng??246813579)+1013904223)>>>0;return p.equipmentRng/4294967296;}
export function enhanceItem(s,id){
 if(s.phase!=='camp')return {ok:false,reason:'강화는 거점에서만 가능해.'};
 const result=enhanceOwned(s.profile,id,()=>equipmentRandom(s.profile));if(result.ok&&result.success)refreshStats(s,true);return result;
}
export function promoteItem(s,id){
 if(s.phase!=='camp')return {ok:false,reason:'승급은 거점에서만 가능해.'};
 const result=promoteOwned(s.profile,id);if(result.ok){s.loadout=uniqueLoadout(s.profile);s.buildEffects=buildEffects(s.profile);s.synergies=equipmentSynergies(s.profile);s.buildEffects=buildEffects(s.profile);refreshStats(s,true);}return result;
}
export function rerollItem(s,id){
 if(s.phase!=='camp')return {ok:false,reason:'수치작은 거점에서만 가능해.'};
 return rerollOwned(s.profile,id,()=>equipmentRandom(s.profile));
}
export function resolveItemReroll(s,id,accept){
 if(s.phase!=='camp')return {ok:false,reason:'수치작 결과는 거점에서만 선택할 수 있어.'};
 const result=resolveOwnedReroll(s.profile,id,accept);if(result.ok&&result.applied)refreshStats(s,true);return result;
}
export function salvageItem(s,id){return bulkSalvage(s,[id]).ok;}
function allocateItemId(s){
  const p=s.profile;let id=p.nextItemId;
  if(!Number.isInteger(id)||id<1||id>1e9)id=1;
  while(p.inventory.some(i=>i.id===id)||p.pendingLoot.some(i=>i.id===id)||p.savedBuilds.some(b=>b&&Object.values(b.equipment).includes(id)))id=id>=1e9?1:id+1;
  p.nextItemId=id+1;return id;
}
export function craftItem(s,id,inscription=null){
 if(s.phase!=='camp')return {ok:false,reason:'거점에서만 제작할 수 있어.'};
 const status=craftStatus(s.profile,id);if(!status.ok)return status;
 if(inscription!==null&&!BUILD_EFFECTS[inscription])return {ok:false,reason:'알 수 없는 각인이야.'};
 const row=CRAFTED_CATALOG.find(r=>r.id===id),p=s.profile,extra=inscription?INSCRIPTION_COST:null;
 if(extra&&(p.gold<row.gold+extra.gold||Object.entries(extra.materials).some(([k,v])=>p.materials[k]<(row.cost[k]??0)+v)))return {ok:false,reason:'제작과 추가 각인 재료가 부족해.'};
 const item={id:allocateItemId(s),slot:row.slot,tier:row.tier,rarity:6,name:row.name,catalogId:row.id,artId:row.artId,affixes:{...row.base},rollVersion:1,...(row.characterId?{characterId:row.characterId}:{})};
 p.gold-=row.gold+(extra?.gold??0);for(const [key,count]of Object.entries(row.cost))p.materials[key]-=count;
 if(extra){for(const [key,count]of Object.entries(extra.materials))p.materials[key]-=count;item.inscription=inscription;}
 p.inventory.push(item);return {ok:true,item,reason:'고유 '+row.name+' 제작 완료!'};
}
function dropMaterials(s,e){
 const drops=rollMaterials({tier:themeOf(s),boss:e.boss,elite:e.elite},()=>{s.materialRng=(Math.imul(1664525,s.materialRng)+1013904223)>>>0;return s.materialRng/4294967296;},()=>{s.refiningRng=(Math.imul(1664525,s.refiningRng)+1013904223)>>>0;return s.refiningRng/4294967296;},()=>{s.promotionRng=(Math.imul(1664525,s.promotionRng)+1013904223)>>>0;return s.promotionRng/4294967296;});
 for(const drop of drops){const row=MATERIAL_BY_ID[drop.id],count=Math.min(drop.amount,MATERIAL_LIMIT-s.profile.materials[drop.id]-s.profile.pendingMaterials[drop.id]);if(count<=0)continue;
  s.profile.pendingMaterials[drop.id]+=count;s.run.resourceRevision++;
  const offset=(MATERIALS.indexOf(row)%3-1)*20,x=clamp(e.x+offset,s.bounds.padding,s.bounds.width-s.bounds.padding),y=e.y+10;
  s.pickups.push({id:s.nextId++,kind:'material',materialId:row.id,amount:count,x,y,age:0,gold:0,xp:0,cores:0});
  effect(s,'materialDrop',{x,y,materialId:row.id,amount:count},row.rare?3:1);
 }
}
function dropGold(s,e,amount){
 const count=Math.max(0,Math.min(amount,1e8-s.profile.gold-s.profile.pendingGold));if(!count)return;
 s.profile.pendingGold+=count;s.run.resourceRevision++;
 s.pickups.push({id:s.nextId++,kind:'gold',amount:count,x:clamp(e.x+(e.id%2?18:-18),s.bounds.padding,s.bounds.width-s.bounds.padding),y:e.y-8,age:0,gold:0,xp:0,cores:0});
}
function resourceFeedback(s,kind,amount,materialId=null){
 if(!amount)return;const recent=s.effects.findLast(f=>f.type==='resourceCollect'&&f.kind===kind&&f.materialId===materialId&&f.maxTtl-f.ttl<.12);
 if(recent){recent.amount+=amount;return;}
 effect(s,'resourceCollect',{x:s.player.x,y:s.player.y,kind,amount,materialId},.65);
}
function claimResource(s,drop,visual=true){
 const p=s.profile;let held=0,amount=0;
 if(drop.kind==='gold'){
  held=Math.min(Math.max(0,drop.amount??0),p.pendingGold);p.pendingGold-=held;amount=Math.max(0,Math.min(held,1e8-p.gold));p.gold+=amount;s.run.gold+=amount;
 }else{
  const row=MATERIAL_BY_ID[drop.materialId];if(!row)return;
  held=Math.min(Math.max(0,drop.amount??0),p.pendingMaterials[row.id]);p.pendingMaterials[row.id]-=held;amount=Math.max(0,Math.min(held,MATERIAL_LIMIT-p.materials[row.id]));p.materials[row.id]+=amount;s.run.materials+=amount;if(amount)s.run.materialLedger[row.id]=(s.run.materialLedger[row.id]??0)+amount;
  if(visual&&row.rare&&amount)effect(s,'loot',{name:row.name+' ×'+amount,rarity:5,material:true,materialId:row.id},3);
 }
 if(held)s.run.resourceRevision++;
 if(visual)resourceFeedback(s,drop.kind,amount,drop.materialId??null);
}
function settleResources(s){
 claimResource(s,{kind:'gold',amount:s.profile.pendingGold},false);
 for(const m of MATERIALS)claimResource(s,{kind:'material',materialId:m.id,amount:s.profile.pendingMaterials[m.id]},false);
 s.pickups=s.pickups.filter(drop=>!isResourcePickup(drop));
}
function makeItem(s,slot){const item=rollStageItem({id:allocateItemId(s),tier:themeOf(s),set:stageOf(s)?.set??null,slot:STAGE_SLOTS.includes(slot)?slot:null,hunt:s.run.dungeonId?0:s.difficulty},()=>lootRandom(s));const chance=INSCRIPTION_DROP_CHANCE[s.run.stageType]??0;if(chance&&chance>lootRandom(s))item.inscription=BUILD_EFFECT_IDS[Math.min(BUILD_EFFECT_IDS.length-1,Math.floor(lootRandom(s)*BUILD_EFFECT_IDS.length))];return item;}
function receiveItem(s,item,origin='monster',stageReward=null){
  const result=storeItem(s.profile,item);
  s.profile.pendingLoot=s.profile.pendingLoot.filter(i=>i.id!==item.id);
  if(result.duplicate)return false;
  s.run.lootLedger.push(item);
  if(origin==='monster')lootPulse(s);s.lastLoot=item;s.run.items++;s.run[origin==='stage'?'stageItems':'monsterItems']++;s.run.gold+=result.gold;if(result.gold)s.run.autoSalvaged++;
  effect(s,'loot',{x:s.player.x,y:s.player.y,item,name:(seals.isSeal(item)?seals.SEAL_GRADES[item.seal.grade].name:RARITIES[item.rarity])+' '+item.name,rarity:item.rarity,origin,stageReward,converted:!result.kept,salvagedGold:result.gold},item.rarity>=3||item.perfect?4:2.5);
  if(result.kept)effect(s,'lootPickup',{x:s.player.x,y:s.player.y,rarity:item.rarity,perfect:!!item.perfect},item.rarity>=3||item.perfect?1.05:.6);
  return true;
}
// Alpha 0.115: no equipment is guaranteed (user decision; enhancement guarantees stay). Each grant is a loot roll.
// s.lootRates (not saved) can override the rates for a run: tests use 1 to keep a drop, events could raise them.
// dungeon (Alpha 0.122): chance of one accessory (necklace/earring/Lilian seal) per growth dungeon clear.
export const DROP_CHANCE=Object.freeze({normal:.16,elite:.7,stage:.7,boss:.75,dungeon:.4,raid:RAID_ANCIENT_CHANCE});
const dropRate=(s,kind)=>(s.lootRates??DROP_CHANCE)[kind]??DROP_CHANCE[kind];
function awardItem(s,slot,stageReward=null,kind='stage'){if(lootRandom(s)>=dropRate(s,kind))return null;const item=makeItem(s,slot);receiveItem(s,item,'stage',stageReward);if(s.run.bossKilled)effect(s,'gearDrop',{x:s.player.x,y:s.player.y,item,rarity:item.rarity},RARITY_INFO[item.rarity].ttl);return item;}
// Alpha 0.110: chapter bosses rarely drop an ancient of their region (raid ancients come later; tier = region since 0.112).
// 0.113: 1/2/3% by hunt mode. 0.114: no guaranteed drop (the old pity counter legendaryPity is kept in saves but unused).
export const ANCIENT_BOSS_CHANCE=Object.freeze([.01,.02,.03]);
function dropBossAncient(s,e){
  // Regions 4–6 (Alpha 0.118) have no ancient catalog yet: their bosses drop none and draw no number.
  const p=s.profile;if(!BOSS_LOOT.some(b=>b.tier===themeOf(s)))return null;if(lootRandom(s)>=(ANCIENT_BOSS_CHANCE[s.difficulty]??ANCIENT_BOSS_CHANCE[0]))return null;
  if(p.pendingLoot.length>=MAX_PENDING_LOOT)collectGear(s);
  const item=rollAncient({id:allocateItemId(s),tier:themeOf(s),slot:null,hunt:s.difficulty},lootRandom(s));
  p.pendingLoot.push(item);s.run.bossAncients.push(item.catalogId);
  const x=clamp(e.x,s.bounds.padding,s.bounds.width-s.bounds.padding),y=e.y-50;
  s.pickups.push({id:s.nextId++,kind:'equipment',x,y,item,age:0,gold:0,xp:0,cores:0});
  effect(s,'gearDrop',{x,y,item,rarity:item.rarity,source:'boss',bossId:e.species},RARITY_INFO[item.rarity].ttl);
  return item;
}
function dropEquipment(s,e,source,count=1){
  for(let i=0;i<count;i++){
    if(s.profile.pendingLoot.length>=MAX_PENDING_LOOT)collectGear(s);
    const item=makeItem(s,null);
    // Count when ownership is reserved, never again on pickup or recovery.
    s.profile.pendingLoot.push(item);if(source==='boss'&&item.rarity===5)s.run.bossAncients.push(item.catalogId);
    const x=clamp(e.x+(i-(count-1)/2)*60,s.bounds.padding,s.bounds.width-s.bounds.padding),y=e.y;
    s.pickups.push({id:s.nextId++,kind:'equipment',x,y,item,age:0,gold:0,xp:0,cores:0});
    effect(s,'gearDrop',{x,y,item,rarity:item.rarity,source,bossId:source==='boss'?e.species:null},RARITY_INFO[item.rarity].ttl);
  }
}
function collectGear(s){
  for(const item of [...s.profile.pendingLoot])receiveItem(s,item);
  s.pickups=s.pickups.filter(drop=>drop.kind!=='equipment');
}
function attackDirection(s,aim){
  const p=s.player,fallback=s.auto?{x:p.aimX,y:p.aimY}:{x:p.lookX,y:p.lookY};
  return direction(aim?.x??fallback.x,aim?.y??fallback.y,fallback);
}
function startAttack(s,aim,heavy=false,counter=false){
  const p=s.player,stats=playerStats(s.profile);
  s.skillRuntime.stanceUntil=0;if(heavy)s.skillRuntime.bloodbladeUntil=0;
  const n=attackDirection(s,aim);p.aimX=n.x;p.aimY=n.y;
  p.combo=heavy?0:(p.comboWindow>0?p.combo%3+1:1);
  const combo=counter?{duration:.46,impact:.13,damage:1.75,range:1.65,dot:.55,push:135,step:110,name:'완벽 반격'}:heavy?{duration:.68,impact:.3,damage:1,range:1.5,dot:.65,push:105,step:70,name:'갑각 파쇄'}:COMBOS[p.combo-1];
  let travel=combo.step+(!heavy&&s.skillRuntime.pursuitUntil>s.run.time&&s.profile.skillBook.loadout.passive.includes('pursuit')?20:0);
  for(const target of s.enemies){if(!eligible(s,target))continue;const dx=target.x-p.x,dy=target.y-p.y,d=length(dx,dy);if(d<stats.range*combo.range+30&&(d<.01?1:(dx*p.aimX+dy*p.aimY)/d)>.65)travel=Math.min(travel,Math.max(0,d-55));}
  for(const target of s.barrels){if(target.status!=='idle')continue;const dx=target.x-p.x,dy=target.y-p.y,d=length(dx,dy);if(d<stats.range*combo.range+30&&(d<.01?1:(dx*p.aimX+dy*p.aimY)/d)>.65)travel=Math.min(travel,Math.max(0,d-55));}
  p.swing={...combo,inscriptions:s.buildEffects,synergies:s.synergies,synergyTriggered:{},equipmentAtStart:equipmentSnapshot(s.profile),trait:equippedWeaponTrait(s.profile)?.id??null,unique:s.loadout.weapon,charm:s.loadout.charm,powersAtStart:s.loadout,momentum:s.uniqueState.momentum>0?s.uniqueState.momentumPower:0,step:travel,duration:combo.duration/(stats.attackSpeed*inscriptionSpeed(s)*(1+ancientBuff(s,'haste'))),impact:combo.impact/(stats.attackSpeed*inscriptionSpeed(s)),x:p.aimX,y:p.aimY,heavy,counter,motion:counter?'backhand':heavy||p.combo===3?'finisher':p.combo===2?'backhand':'forehand',sounded:false};
  if(p.combo===3&&p.swing.unique?.definition.id==='whirlwind'){p.swing.dot=-1;p.swing.range*=1+UNIQUE_EFFECTS.whirlwind.rangeBonus*p.swing.unique.power;}s.uniqueState.momentum=0;
  setLook(p,p.swing.x,p.swing.y,true);p.action=heavy?'heavy':'attack';p.actionTime=0;p.attackHit=false;p.queued=false;p.queuedAim=null;p.attackCooldown=p.swing.duration;p.comboWindow=0;
  if(Math.abs(p.aimX)>.05)p.facing=p.aimX<0?-1:1;
}
export function attack(s,aim){const p=s.player;if(s.skillRuntime.casting)return false;if(s.phase!=='playing'||s.settlement||s.paused||s.run.flow==='stageClear'||p.hp<=0||['dash','hurt','heavy'].includes(p.action))return false;
  if(p.action==='attack'){if(p.actionTime>=p.swing.duration*.5){p.queued=true;p.queuedAim=attackDirection(s,aim);return true;}return false;}
  if(p.attackCooldown>0)return false;startAttack(s,aim);return true;
}
// Q is a directed, committed heavy cleave. The old export remains for host compatibility.
export function thunder(s,aim){
  if(s.skillRuntime.casting)return false;
  s.skillRuntime.stanceUntil=0;s.skillRuntime.bloodbladeUntil=0;
  const p=s.player,counter=p.counterReady>0,free=false;
  if(s.phase!=='playing'||s.settlement||s.paused||s.run.flow==='stageClear'||p.hp<=0||(!counter&&(p.thunderCooldown>0||!free&&p.stamina<35))||['dash','hurt','heavy'].includes(p.action))return false;
  if(!counter&&!free)p.stamina-=35;if(free)s.uniqueState.capacitor=0;p.counterReady=0;p.thunderCooldown=playerStats(s.profile).thunderCooldown;startAttack(s,aim,true,counter);p.swing.capacitorFree=free;return true;
}
function threatenedByShot(s,q,p,seconds=.16){
  if(q.friendly||q.perfectDodged)return false;const dx=p.x-q.x,dy=p.y-q.y,v2=q.vx*q.vx+q.vy*q.vy;
  const t=v2?clamp((dx*q.vx+dy*q.vy)/v2,0,seconds):0;
  if(!(t>0&&length(dx-q.vx*t,dy-q.vy*t)<34))return false;
  for(const b of s.barrels){if(b.status==='spent')continue;const hit=segmentHit(q.x,q.y,q.x+q.vx*t,q.y+q.vy*t,b.x,b.y,32);if(hit!==null&&hit<1)return false;}
  return true;
}
export function enemyAttackKind(e){
  if(e.boss&&e.chapterId){const cycle=e.bossCycle??CHAPTERS[e.chapterId-1].bossCycle;return cycle[e.pattern%cycle.length];}
  if(e.attackCycle)return e.attackCycle[e.pattern%e.attackCycle.length];
  if(e.type==='spitter'||e.boss&&e.pattern%3===2)return 'volley';
  if((e.boss||e.elite)&&e.pattern%3===1||e.chargeEvery&&e.pattern%e.chargeEvery===e.chargeEvery-1)return 'charge';
  return 'slam';
}
function perfectThreat(s){
  const p=s.player;
  for(const e of s.enemies){if(!eligible(s,e)||enemyAttackKind(e)==='volley'||e.action!=='windup'||e.perfectDodged)continue;
    const remaining=e.windup-e.actionTime;
    if(remaining>0&&remaining<=.18&&length(p.x-e.targetX,(p.y-e.targetY)/.65)<e.radius+16){e.perfectDodged=true;return true;}
  }
  for(const q of s.projectiles)if(threatenedByShot(s,q,p)){q.perfectDodged=true;return true;}
  for(const b of s.barrels)if(b.status==='armed'&&b.fuse<=.18&&length(p.x-b.x,(p.y-b.y)/.65)<b.radius){if(!b.perfectDodged){b.perfectDodged=true;return true;}}
  return false;
}
export function dash(s,vector){
  const p=s.player;if(s.phase!=='playing'||s.settlement||s.paused||s.run.flow==='stageClear'||p.hp<=0||p.dashCooldown>0||p.stamina<22)return false;
  skills.interruptSkill(s);const perfect=perfectThreat(s),n=direction(vector?.x??p.aimX,vector?.y??p.aimY,{x:p.aimX,y:p.aimY});
  setLook(p,n.x,n.y,true);p.stamina-=22;p.dashX=n.x;p.dashY=n.y;p.action='dash';p.actionTime=0;p.attackHit=true;p.queued=false;p.queuedAim=null;p.combo=0;p.comboWindow=0;p.attackCooldown=0;p.invulnerable=.25;p.dashCooldown=.65;
  p.dashTrailStep=0;effect(s,'dash',{x:p.x,y:p.y,facing:p.facing,heading:p.heading,actionTime:0},.22);
  if(perfect){skills.skillPerfect(s,SKILL_HOOKS);p.counterReady=2.8;p.stamina=Math.min(100,p.stamina+12);p.thunderCooldown=0;s.run.perfectDodges++;effect(s,'perfectDodge',{x:p.x,y:p.y},.8);}
  dashUnique(s,perfect);
  return true;
}
function eligible(s,e){return !e.dead&&(!e.boss||s.run.bossSpawned);}
function kill(s,e,inscriptions=s.buildEffects,explode=true){if(e.dead)return;e.dead=true;skills.skillKill(s,SKILL_HOOKS);e.hp=0;e.bleedTicks=0;e.chillRemaining=0;e.action='death';e.actionTime=0;s.run.kills++;s.profile.totalKills++;ancientAll(s,'kill',{x:e.x,y:e.y});const hunter=s.loadout.charm;if(hunter?.definition.id==='hunter'&&uniqueReady(s,'hunter',UNIQUE_EFFECTS.hunter.cooldown)){s.player.stamina=Math.min(100,s.player.stamina+UNIQUE_EFFECTS.hunter.stamina*hunter.power);s.player.dashCooldown=Math.max(0,s.player.dashCooldown-UNIQUE_EFFECTS.hunter.dashReduction);uniqueVisual(s,hunter);}if(e.objective!==false&&e.wave===s.run.wave&&e.runStage===s.run.stage){s.run.waveKills++;s.run.stageKills++;}if(e.type==='skitter')effect(s,'skitterDeath',{x:e.x,y:e.y},.25);
  if(s.run.rush&&e.boss&&e.wave===s.run.wave)s.run.rushKills++;
  if((s.run.raidId||s.run.rush)&&e.boss)for(const q of s.enemies)if(q!==e&&!q.dead){q.dead=true;q.hp=0;q.action='death';q.actionTime=0;}
  if(s.run.dungeonId||s.run.raidId||s.run.rush){inscriptionKill(s,e,inscriptions,explode);return;}
  if(e.boss){if(s.run.stage!==STAGES_PER_CHAPTER||s.run.wave!==stageWaveCount(s.run.stage)||e.runStage!==s.run.stage||e.wave!==s.run.wave)return;{const drops=[0,1].filter(()=>lootRandom(s)<dropRate(s,'boss')).length;if(drops)dropEquipment(s,e,'boss',drops);}dropBossAncient(s,e);dropMaterials(s,e);collectRemainder(s);s.run.rooms++;s.run.seals=s.run.rooms;recordStageClear(s,STAGES_PER_CHAPTER);const st=stageOf(s);const gold=Math.round(st.reward*modeScale(st.id,s.difficulty).reward),cores=bossCores(st.id,s.difficulty);s.profile.gold+=gold;s.profile.cores+=cores;s.run.gold+=gold;s.run.cores+=cores;s.profile.bossMastery[st.id-1]=Math.max(s.profile.bossMastery[st.id-1],s.difficulty);if(s.difficulty===2){const t=Math.round(Math.max(.1,s.run.timeLimit-s.run.timeRemaining)*10)/10,old=s.profile.nightmareRecords[st.id-1];s.run.nightmareRecord={time:t,best:!old||t<old};if(!old||t<old)s.profile.nightmareRecords[st.id-1]=t;}s.run.bossKilled=true;learnBeastTechnique(s,st);awardItem(s,STAGE_SLOTS[(st.id-1)%STAGE_SLOTS.length],{gold,cores,healed:0},'boss');if(s.difficulty===0){s.profile.clearedStage=Math.max(s.profile.clearedStage,st.id);s.profile.unlockedStage=Math.min(STAGES.length,Math.max(s.profile.unlockedStage,st.id+1));}s.run.flow='complete';s.spawns.length=0;s.projectiles.length=0;s.phase='victory';s.hitStop=0;skills.clearSkillStage(s);clearAncient(s);s.resultDelay=1.15;queueSettlement(s,true);effect(s,'stageClear',{chapterId:s.stageId,stage:s.run.stage,stars:s.run.stars?.earned??0,gained:s.run.stars?.gained??0},1.6);effect(s,'bossDeath',{x:e.x,y:e.y},2);return;}
  // The old ten-kill pity (lootPity) is gone with the guarantees; the save field stays unused.
  if(lootRandom(s)<dropRate(s,e.elite?'elite':'normal'))dropEquipment(s,e,e.elite?'elite':'normal');
  inscriptionKill(s,e,inscriptions,explode);if(s.settlement||s.phase!=='playing')return;dropMaterials(s,e);dropGold(s,e,e.elite?16:e.type==='bulwark'?10:4);s.pickups.push({id:s.nextId++,x:e.x,y:e.y,gold:0,xp:e.elite?28:e.type==='bulwark'?18:9,cores:e.elite?1:0});

}
function damageEnemy(s,e,value,critical=false,kind='normal',origin=s.player,piercing=false,synergy=null,swing=null){
  if(!eligible(s,e)||s.phase!=='playing'||s.settlement)return 'miss';value*=1+ancientBuff(s,'fury');if(e.boss)value*=1+transcend.transcendBonus(s.profile).bossDamage;
  // 관문 '방어 태세': damage taken is cut; while a defense-rule boss shows its weak point the cut shrinks by the build's
  // counter (a full burst build ignores it there, an unprepared one barely notices the opening) (0.135).
  if(e.gateGuard)value/=e.boss&&ruleOf(s)==='defense'&&s.run.time%12>=8?1+(e.gateGuard-1)*(1-(e.gateCounter??0)):e.gateGuard;
  const direct=kind!=='proc'&&kind!=='inscription'&&kind!=='rune-dot'&&kind!=='blast',inscriptions=swing?.inscriptions??s.buildEffects;
  // 성장 트리 '처형자' (Alpha 0.131): direct hits on enemies under 35% health.
  if(direct&&e.hp<e.maxHp*growth.EXECUTE_HEALTH){const ex=growth.treeBonus(s.profile).execute;if(ex)value*=1+ex;}
  if(direct&&inscriptions.execution&&e.hp/e.maxHp<=BUILD_EFFECTS.execution.threshold){const legacy=swing?.unique?.definition.id==='execution'&&e.hp/e.maxHp<=(e.boss?UNIQUE_EFFECTS.execution.bossThreshold:UNIQUE_EFFECTS.execution.threshold)?UNIQUE_EFFECTS.execution.bonus*swing.unique.power:0;value*=(1+legacy+BUILD_EFFECTS.execution.bonus*inscriptions.execution)/(1+legacy);}
  const shred=e.runeShredTime>0?e.runeShred:0,defending=e.boss&&ruleOf(s)==='defense'&&s.run.time%12<8;
  // A defense stance is armor too: weakening applies before its mitigation.
  // Stage armor (철갑 진군) is countered by skills: 파갑참 strips it for a while and 마지막 검끝 lets combo strikes ignore it.
  const armorIgnored=e.plateBrokenUntil>s.run.time||swing?.damage!=null&&skills.finisherGuardBonus(s)>0;
  value*=(1-Math.max(0,(armorIgnored?0:e.plate??0)+(defending?stanceGuard(s):0)-shred))*(1+shred*BUILD_EFFECTS.shred.vulnerability);
  if(e.boss&&ruleOf(s)==='defense'&&!defending)value*=1.5;
  if(e.raid==='queen'&&raidBroodAlive(s))value*=1-raidDefinition('queen').broodShield;
  let guarded=false,broken=false;
  if(e.guard>0){
    const n=direction(origin.x-e.x,origin.y-e.y),front=n.x*e.guardX+n.y*e.guardY>.1;
    const breaker=kind==='heavy'||kind==='finisher'||kind==='blast'||kind==='reflected';
    // Alpha 0.104: 마지막 검끝 adds guard damage to the finisher (38 + 62 breaks a fresh guard).
    if(front||breaker){e.guard=Math.max(0,e.guard-(piercing?25:0)-(kind==='finisher'?skills.finisherGuardBonus(s):0)-(kind==='blast'?100:kind==='heavy'||kind==='reflected'?65:kind==='finisher'?38:12));
      if(!e.guard){broken=true;e.exposed=2.8;setAction(e,'stagger');e.actionTime=0;s.run.guardBreaks++;effect(s,'guardBreak',{x:e.x,y:e.y},1);s.hitStop=Math.max(s.hitStop,.075);s.shake=9;}
      else if(front&&kind!=='blast'){guarded=true;value*=piercing?.75:.3;effect(s,'guardHit',{x:e.x,y:e.y-55},.2);}
    }
  }
  if(!guarded&&synergy&&(swing.synergyTriggered[synergy.id]||uniqueReady(s,'synergy:'+synergy.id,synergy.cooldown))){
    value*=1+(e.boss?synergy.bossBonus:synergy.bonus);
    if(synergy.id==='shatter')e.chillRemaining=0;else {e.bleedTicks=0;e.bleedDamage=0;}
    if(!swing.synergyTriggered[synergy.id]&&synergy.id==='execute')s.player.stamina=Math.min(100,s.player.stamina+12);
    swing.synergyTriggered[synergy.id]=true;s.run.synergyProcs[synergy.id]++;
    effect(s,'synergy',{synergyId:synergy.id,x:e.x,y:e.y,name:synergy.name,color:synergy.color,tone:synergy.id==='shatter'?840:320},.7);
  }
  if(e.exposed>0)value*=1.5;
  const amount=Math.min(e.hp,Math.max(1,Math.round(value)));e.hp-=amount;e.aggro=true;
  const recoil=recoilProgress(e,s.run.time);e.recoilX=(e.recoilX??0)*recoil;e.recoilY=(e.recoilY??0)*recoil;
  e.hitAt=s.run.time;e.hitDuration=guarded?.1:kind==='finisher'||kind==='heavy'?.22:.14;e.hitGuarded=guarded;
  effect(s,'damage',{x:e.x,y:e.y-70,value:amount,critical,guarded},.65);
  const hitDirection=direction(e.x-origin.x,e.y-origin.y);
  effect(s,'impact',{x:e.x,y:e.y-40,nx:hitDirection.x,ny:hitDirection.y,heavy:kind!=='normal',critical,guarded,combo:origin===s.player?s.player.combo:0},.17);
  if(e.hp<=0)kill(s,e,inscriptions,direct);else if(!e.boss&&!guarded&&!broken&&e.action!=='stagger'){setAction(e,'hurt');e.actionTime=0;e.cooldown=Math.max(e.cooldown,.4);}
  if(direct&&s.phase==='playing'&&!s.settlement)inscriptionHit(s,e,amount,inscriptions,origin);
  return guarded?'guarded':'hit';
}
function applyWeaponTrait(s,e,trait,stats,result){
  if(e.dead||result==='miss')return;
  if(trait==='bleed'&&result!=='guarded'){
    if(!e.bleedTicks){e.bleedTimer=.8;e.bleedDamage=0;effect(s,'gearProc',{x:e.x,y:e.y,trait},.4);}
    e.bleedTicks=3;e.bleedDamage=Math.max(e.bleedDamage??0,Math.max(1,Math.round(stats.damage*.15)));
  }else if(trait==='frost'&&result!=='guarded'){
    if(!e.chillRemaining)effect(s,'gearProc',{x:e.x,y:e.y,trait},.4);
    e.chillRemaining=Math.max(e.chillRemaining??0,2);
  }else if(trait==='pierce')effect(s,'gearProc',{x:e.x,y:e.y,trait},.4);
}
function updateEnemyStatus(s,e,dt){
  updateInscriptionStatus(s,e,dt);
  e.chillRemaining=Math.max(0,(e.chillRemaining??0)-dt);
  if(!e.bleedTicks)return;
  e.bleedTimer-=dt;if(e.bleedTimer>0)return;
  e.bleedTicks--;e.bleedTimer+=.8;
  const amount=Math.min(e.hp,e.bleedDamage);e.hp-=amount;
  effect(s,'damage',{x:e.x,y:e.y-70,value:amount,status:'bleed'},.65);
  // Damage already belongs to this target: no extra guard hits, stagger or drain.
  if(e.hp<=0)kill(s,e);
}

const ANCIENT_SLOTS=EQUIPMENT_KEYS;
function clearAncient(s){const u=s.uniqueState;u.ancientZones.length=0;for(const slot of ANCIENT_SLOTS)u.ancientShields[slot]=null;}
function ancientStatus(s,e,r,baseAttack){
 if(e.dead)return;if(r.chill)e.chillRemaining=Math.max(e.chillRemaining??0,r.chill);
 if(r.bleed){if(!e.bleedTicks)e.bleedTimer=.8;e.bleedTicks=Math.max(e.bleedTicks??0,r.bleed);e.bleedDamage=Math.max(e.bleedDamage??0,baseAttack*.12);}
 if(r.push&&!e.boss){const n=direction(e.x-s.player.x,e.y-s.player.y);e.x=clamp(e.x+n.x*r.push,s.bounds.padding,s.bounds.width-s.bounds.padding);e.y=clamp(e.y+n.y*r.push,s.bounds.padding,s.bounds.height-s.bounds.padding);}
}
function ancientPulse(s,spec,x,y,damage,cone=null,baseAttack=0,sig=null){
 if(s.phase!=='playing'||s.player.hp<=0)return;const row=spec.ancient??spec.crafted??spec.seal,r=sig??row.signature;effect(s,'ancientSig',{ancientId:row.id,x,y,radius:r.radius||65,rune:r.index,color:r.color,tone:560+(r.index%10)*27},.6);
 for(const e of s.enemies){if(s.phase!=='playing')break;if(!eligible(s,e)||length(e.x-x,e.y-y)>(r.radius||0))continue;if(cone){const n=direction(e.x-x,e.y-y);if(n.x*cone.x+n.y*cone.y<.3)continue;}
  const result=damage?damageEnemy(s,e,damage,false,'proc',{x,y}):'hit';if(result!=='miss')ancientStatus(s,e,r,baseAttack);
 }
 if(s.phase==='playing'&&r.heal)s.player.hp=Math.min(s.player.maxHp,s.player.hp+s.player.maxHp*r.heal);
}
// Alpha 0.121: an item may carry several powers (tier/difficulty-scaled signature, 악몽 second power); each keeps its own cooldown.
function ancientEvent(s,spec,event,context=null){
 const row=spec?.ancient??spec?.crafted??spec?.seal;if(!row)return false;let fired=false;
 for(const r of spec.signatures?.length?spec.signatures:[row.signature])if(ancientSignature(s,spec,row,r,event,context))fired=true;
 return fired;
}
function ancientSignature(s,spec,row,r,event,context){
 const p=s.player;if(!r||s.phase!=='playing'||s.run.flow!=='combat'||p.hp<=0)return false;
 let match=r.trigger===event;if(event==='strike'){const sw=context.swing;match=r.trigger==='heavy'?sw.heavy&&!sw.counter:r.trigger==='counter'?sw.counter:r.trigger==='finisher'?p.combo===3&&!sw.heavy:r.trigger==='normal'?!sw.heavy&&p.combo!==3:false;}
 if(event==='hurt'&&r.trigger==='lowHp')match=p.hp/p.maxHp<=.35;if(event==='idle')match=r.trigger==='idle'&&s.uniqueState.still>=1.5;if(!match)return false;
 const cost=r.cost??0,hpCost=p.maxHp*(r.hpCost??0);if(p.stamina<cost||p.hp<=hpCost)return false;if(!uniqueReady(s,'ancient:'+(r.id??row.id),r.cooldown))return false;
 if(spec.crafted)s.run.craftedProcs++;else s.run.ancientProcs++;p.stamina-=cost;p.hp-=hpCost;p.stamina=Math.min(100,p.stamina+(r.stamina??0));p.dashCooldown=Math.max(0,p.dashCooldown-(r.dashRefund??0));p.thunderCooldown=Math.max(0,p.thunderCooldown-(r.thunderRefund??0));
 // Alpha 0.110 actions: skill cooldown cut, timed fury/haste buffs and brief invulnerability.
 if(r.cdr){const cooldowns=s.skillRuntime?.cooldowns??{};for(const id of Object.keys(cooldowns))cooldowns[id]=Math.max(0,cooldowns[id]-r.cdr);}
 const buffs=s.uniqueState.ancientBuffs??={};for(const [key,time]of [['fury','furyTime'],['haste','hasteTime']])if(r[key]){const until=s.run.time+r[time];buffs[key]={value:Math.max(buffs[key]?.until>s.run.time?buffs[key].value:0,r[key]),until:Math.max(buffs[key]?.until??0,until)};}
 if(r.invuln)p.invulnerable=Math.max(p.invulnerable??0,r.invuln);
 if(r.shield&&s.profile.equipment[spec.slot]===spec.itemId){const shields=s.uniqueState.ancientShields;let others=0;for(const slot of ANCIENT_SLOTS)if(slot!==spec.slot)others+=shields[slot]?.amount??0;const current=shields[spec.slot]?.amount??0;shields[spec.slot]={amount:Math.max(0,Math.min(p.maxHp*.25-others,Math.max(current,p.maxHp*r.shield))),time:3,owner:spec.itemId};}
 const x=r.center==='target'?(context?.x??p.x):p.x,y=r.center==='target'?(context?.y??p.y):p.y,baseAttack=playerStats(s.profile).damage,damage=baseAttack*(r.damage??0),cone=r.cone?context?.swing??{x:p.aimX,y:p.aimY}:null;
 if(r.shots){let inFlight=0;for(const q of s.projectiles)if(q.ancientSpec)inFlight++;const used=new Set();for(let i=0;i<r.shots&&inFlight<12;i++){let target=null,dist=r.radius;for(const e of s.enemies){const d=length(e.x-p.x,e.y-p.y);if(eligible(s,e)&&!used.has(e.id)&&d<dist){target=e;dist=d;}}if(!target)break;used.add(target.id);const n=direction(target.x-p.x,target.y-p.y);s.projectiles.push({id:s.nextId++,x:p.x,y:p.y,vx:n.x*480,vy:n.y*480,damage,ttl:2,friendly:true,color:r.color,ancientSpec:spec,ancientSig:r,ancientAttack:baseAttack});inFlight++;}effect(s,'ancientSig',{ancientId:row.id,x:p.x,y:p.y,radius:65,rune:r.index,color:r.color,tone:560+(r.index%10)*27},.6);if(r.heal)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*r.heal);
 }else{ancientPulse(s,spec,x,y,damage,cone,baseAttack,r);if(r.execute)for(const e of s.enemies){if(s.phase!=='playing')break;if(eligible(s,e)&&!e.boss&&!e.midBoss&&e.hp<=e.maxHp*r.execute&&length(e.x-x,e.y-y)<=(r.radius||0))damageEnemy(s,e,e.hp+1,false,'proc',{x,y},true);}if(r.ticks>1&&s.phase==='playing'&&s.profile.equipment[spec.slot]===spec.itemId){const zones=s.uniqueState.ancientZones;if(zones.length===6)zones.shift();zones.push({spec,sig:r,slot:spec.slot,x,y,damage,cone,baseAttack,timer:.6,remaining:r.ticks-1});}}
 return true;
}
// Fires one event for every worn ancient/crafted signature (Alpha 0.110: kill, skill and crit).
function ancientAll(s,event,context=null){for(const slot of ANCIENT_SLOTS){const spec=s.loadout?.[slot];if(spec&&(spec.ancient??spec.crafted??spec.seal))ancientEvent(s,spec,event,context);}}
function ancientBuff(s,key){const b=s.uniqueState?.ancientBuffs?.[key];return b&&b.until>s.run.time?b.value:0;}
function updateAncient(s,dt){
 if(s.run.flow!=='combat'||s.phase!=='playing')return;for(const slot of ANCIENT_SLOTS){const spec=s.loadout[slot],row=spec?.ancient??spec?.crafted??spec?.seal;if(!row)continue;const triggers=new Set((spec.signatures?.length?spec.signatures:[row.signature]).map(r=>r.trigger));for(const trigger of ['idle','periodic'])if(triggers.has(trigger))ancientEvent(s,spec,trigger);}
 const zones=s.uniqueState.ancientZones;for(let i=zones.length-1;i>=0;i--){if(s.phase!=='playing')break;const z=zones[i];z.timer-=dt;if(z.timer<=0){z.timer+=.6;z.remaining--;ancientPulse(s,z.spec,z.x,z.y,z.damage,z.cone,z.baseAttack,z.sig);if(!z.remaining)zones.splice(i,1);}}
}

function uniqueReady(s,id,cooldown){if(s.phase!=='playing'||s.settlement||(s.uniqueState.cooldowns[id]??0)>0||!takeEffectBudget(s))return false;if(!Object.hasOwn(s.uniqueState.cooldowns,id))s.uniqueState.cooldownKeys.push(id);s.uniqueState.cooldowns[id]=cooldown;return true;}
function uniqueVisual(s,effectSpec,radius=65){effect(s,'unique',{uniqueId:effectSpec.definition.id,x:s.player.x,y:s.player.y,radius},.65);}
function directUniqueMultiplier(s,e,swing){
 let scale=1+swing.momentum*UNIQUE_EFFECTS.momentum.bonus;const spec=swing.unique,id=spec?.definition.id;
 if(id==='execution'&&e.hp/e.maxHp<=(e.boss?UNIQUE_EFFECTS.execution.bossThreshold:UNIQUE_EFFECTS.execution.threshold)){scale*=1+UNIQUE_EFFECTS.execution.bonus*spec.power;swing.executionProc=true;}
 if(id==='blood'&&s.player.hp/s.player.maxHp<=UNIQUE_EFFECTS.blood.threshold)scale*=1+UNIQUE_EFFECTS.blood.bonus*spec.power;
 return scale;
}
function areaUnique(s,spec,x,y,radius,value,chill=0,cone=null){
 if(s.phase!=='playing')return;
 effect(s,'unique',{uniqueId:spec.definition.id,x,y,radius},.65);const origin={x,y};
 for(const e of s.enemies){if(s.phase!=='playing')break;if(!eligible(s,e)||length(e.x-x,e.y-y)>radius)continue;
  if(cone){const n=direction(e.x-x,e.y-y);if(n.x*cone.x+n.y*cone.y<.4)continue;}
  const result=value?damageEnemy(s,e,value,false,'proc',origin):'hit';
  if(chill&&!e.dead&&result!=='miss')e.chillRemaining=Math.max(e.chillRemaining??0,chill);
 }
}
function strikeUnique(s,swing,stats,target,unguarded,targetX,targetY){
 if(s.phase!=='playing'||!target)return;
 // Capture the loadout when the strike starts. A paused equipment swap cannot rewrite it.
 let context;for(const slot of ANCIENT_SLOTS){if(slot==='armor')continue;const power=swing.powersAtStart?.[slot]??(slot==='weapon'?swing.unique:slot==='charm'?swing.charm:null);if(!power?.ancient&&!power?.crafted&&!power?.seal)continue;context??={swing,x:targetX,y:targetY};ancientEvent(s,power,'strike',context);}
 const p=s.player,u=s.uniqueState,spec=swing.unique,id=spec?.definition.id;
 if(swing.momentum){p.stamina=Math.min(100,p.stamina+UNIQUE_EFFECTS.momentum.stamina);const momentum={definition:UNIQUE_EFFECTS.momentum};uniqueVisual(s,momentum);}
 if(id==='execution'&&swing.executionProc)uniqueVisual(s,spec);
 if(id==='blood'&&unguarded){p.hp=Math.min(p.maxHp,p.hp+UNIQUE_EFFECTS.blood.heal*spec.power);uniqueVisual(s,spec);}
 if(id==='echo'&&p.combo===3&&uniqueReady(s,id,spec.definition.cooldown))areaUnique(s,spec,p.x,p.y,spec.definition.radius,stats.damage*spec.definition.damage*spec.power,0,swing);
 // Alpha 0.120: 파쇄 left auto combat in 0.104, so the two 파쇄 weapon powers now fire on ordinary combo hits (storm) and the finisher (frostNova).
 if(id==='storm'&&!swing.heavy&&p.combo!==3&&uniqueReady(s,id,spec.definition.cooldown)){
  let n=0;const origin={x:targetX,y:targetY};for(const e of s.enemies){if(s.phase!=='playing')break;if(e===target||!eligible(s,e)||length(e.x-targetX,e.y-targetY)>spec.definition.radius)continue;
   effect(s,'uniqueLink',{uniqueId:id,x:targetX,y:targetY,tx:e.x,ty:e.y},.5);damageEnemy(s,e,stats.damage*spec.definition.damage*spec.power,false,'proc',origin);if(++n===spec.definition.targets)break;
  }
 }
 if(id==='frostNova'&&!swing.heavy&&p.combo===3&&uniqueReady(s,id,spec.definition.cooldown))areaUnique(s,spec,p.x,p.y,spec.definition.radius,stats.damage*spec.definition.damage*spec.power,spec.definition.duration);
 if(id==='whirlwind'&&p.combo===3)uniqueVisual(s,spec,stats.range*swing.range);
 const charm=swing.charm,cid=charm?.definition.id;
 if(cid==='focus'&&p.combo===3){p.stamina=Math.min(100,p.stamina+UNIQUE_EFFECTS.focus.stamina*charm.power);const cooldowns=s.skillRuntime.cooldowns;for(const id of Object.keys(cooldowns))cooldowns[id]=Math.max(0,cooldowns[id]-UNIQUE_EFFECTS.focus.cooldownReduction);uniqueVisual(s,charm);}
}
// 스킬 축전기 (0.121): every cast charges; a full charge shortens the fresh cooldown of the next cast.
function capacitorCast(s,id){
 const charm=s.loadout.charm;if(charm?.definition.id!=='capacitor')return;const u=s.uniqueState,cooldowns=s.skillRuntime.cooldowns;
 if(u.capacitor>=UNIQUE_EFFECTS.capacitor.charges){u.capacitor=0;if(cooldowns[id]>0)cooldowns[id]*=1-UNIQUE_EFFECTS.capacitor.refund;uniqueVisual(s,charm);}else u.capacitor++;
}
function dashUnique(s,perfect){
 for(const slot of ANCIENT_SLOTS)ancientEvent(s,s.loadout[slot],perfect?'perfect':'dash');
 const p=s.player,u=s.uniqueState,armor=s.loadout.armor,charm=s.loadout.charm;
 if(armor?.definition.id==='barrier'&&uniqueReady(s,'barrier',UNIQUE_EFFECTS.barrier.cooldown)){u.shield=p.maxHp*UNIQUE_EFFECTS.barrier.shield*armor.power;u.shieldTime=UNIQUE_EFFECTS.barrier.duration;u.shieldOwner=armor.itemId;uniqueVisual(s,armor);}
 if(perfect&&armor?.definition.id==='pulse'&&uniqueReady(s,'pulse',UNIQUE_EFFECTS.pulse.cooldown))areaUnique(s,armor,p.x,p.y,UNIQUE_EFFECTS.pulse.radius,playerStats(s.profile).damage*UNIQUE_EFFECTS.pulse.damage*armor.power);
 if(charm?.definition.id==='momentum'){u.momentum=UNIQUE_EFFECTS.momentum.duration;u.momentumPower=charm.power;uniqueVisual(s,charm);}
 if(charm?.definition.id==='orbit'&&uniqueReady(s,'orbit',UNIQUE_EFFECTS.orbit.cooldown)){u.orbit={spec:charm,x:p.x,y:p.y,timer:UNIQUE_EFFECTS.orbit.interval,ticks:UNIQUE_EFFECTS.orbit.ticks,damage:playerStats(s.profile).damage*UNIQUE_EFFECTS.orbit.damage*charm.power};uniqueVisual(s,charm,UNIQUE_EFFECTS.orbit.radius);}
}
function hurtUnique(s,armor,damage){
 for(const slot of ANCIENT_SLOTS)ancientEvent(s,s.loadout[slot],'hurt');
 const id=armor?.definition.id;if(id==='frostWard'&&uniqueReady(s,id,armor.definition.cooldown))areaUnique(s,armor,s.player.x,s.player.y,armor.definition.radius,0,armor.definition.duration*armor.power);
 if(id!=='thorns'||!uniqueReady(s,id,UNIQUE_EFFECTS.thorns.cooldown))return;
 let nearest=null,distance=UNIQUE_EFFECTS.thorns.radius;for(const e of s.enemies){const d=length(e.x-s.player.x,e.y-s.player.y);if(eligible(s,e)&&d<distance){nearest=e;distance=d;}}
 if(nearest){uniqueVisual(s,armor);damageEnemy(s,nearest,damage*UNIQUE_EFFECTS.thorns.ratio*armor.power,false,'proc');}
}
function lootPulse(s){for(const slot of ANCIENT_SLOTS)ancientEvent(s,s.loadout[slot],'pickup');const charm=s.loadout.charm;if(charm?.definition.id!=='magnet'||!uniqueReady(s,'magnet',UNIQUE_EFFECTS.magnet.cooldown))return;const p=s.player;p.hp=Math.min(p.maxHp,p.hp+UNIQUE_EFFECTS.magnet.heal*charm.power);p.stamina=Math.min(100,p.stamina+UNIQUE_EFFECTS.magnet.stamina);uniqueVisual(s,charm);}
function clearUniqueTransient(s){const u=s.uniqueState;u.momentum=0;u.shield=0;u.shieldTime=0;u.shieldOwner=null;u.orbit=null;u.still=0;u.ancientZones.length=0;for(const slot of ANCIENT_SLOTS)u.ancientShields[slot]=null;}
function tickUniqueClocks(s,dt){const u=s.uniqueState;for(const id of u.cooldownKeys)u.cooldowns[id]=Math.max(0,u.cooldowns[id]-dt);u.momentum=Math.max(0,u.momentum-dt);u.shieldTime=Math.max(0,u.shieldTime-dt);if(!u.shieldTime)u.shield=0;for(const slot of ANCIENT_SLOTS){const shield=u.ancientShields[slot];if(shield){shield.time=Math.max(0,shield.time-dt);if(!shield.time)u.ancientShields[slot]=null;}}}
function updateUnique(s,dt,moved){
 if(s.phase!=='playing')return;const u=s.uniqueState,p=s.player;
 const armor=s.loadout.armor,quiet=moved<.0001&&!['attack','heavy','dash','hurt'].includes(p.action);
 u.still=quiet?u.still+dt:0;updateAncient(s,dt);if(armor?.definition.id==='recovery'&&u.still>=UNIQUE_EFFECTS.recovery.quiet&&p.hp<p.maxHp){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*UNIQUE_EFFECTS.recovery.ratio*armor.power*dt);if(uniqueReady(s,'recovery',1))uniqueVisual(s,armor);}
 const zone=u.orbit;if(zone){zone.timer-=dt;if(zone.timer<=0){zone.timer+=UNIQUE_EFFECTS.orbit.interval;zone.ticks--;areaUnique(s,zone.spec,zone.x,zone.y,UNIQUE_EFFECTS.orbit.radius,zone.damage);if(!zone.ticks)u.orbit=null;}}
}
function inCleave(p,point,range,dot){const dx=point.x-p.x,dy=point.y-p.y,d=length(dx,dy);return d<=range&&(d<.01?1:(dx*p.swing.x+dy*p.swing.y)/d)>=dot;}
function armBarrel(s,b){if(b.status!=='idle')return false;b.hp=0;b.status='armed';b.fuse=.38;effect(s,'coreArmed',{x:b.x,y:b.y},.2);return true;}
function strikeSynergy(s,e,swing){
  if(s.run.flow!=='combat'||!swing.heavy&&s.player.combo!==3)return null;
  for(const row of swing.synergies){if(!swing.synergyTriggered[row.id]&&(s.uniqueState.cooldowns['synergy:'+row.id]??0)>0)continue;
    if(row.id==='shatter'&&e.chillRemaining>0)return row;
    if(row.id==='execute'&&e.bleedTicks>0&&e.hp/e.maxHp<=(e.boss?.18:.35))return row;
  }return null;
}
function strike(s){
  if(s.player.swing.skillVisualOnly){s.player.attackHit=true;return;}
  const p=s.player,stats=playerStats(s.profile),swing=p.swing;p.attackHit=true;swing.contactX=p.x;swing.contactY=p.y;let hits=0,firstTarget=null,firstX=0,firstY=0,unguarded=false;
  let critHit=null;const contacts=[],skillScale=skills.basicSkillBonus(s,swing);
  const kind=swing.heavy?'heavy':p.combo===3?'finisher':'normal',tree=growth.treeBonus(s.profile),fin=kind==='finisher'?1+tree.finisher:1;
  for(const e of s.enemies){if(!eligible(s,e)||!inCleave(p,e,stats.range*swing.range+(e.boss?30:12),swing.dot))continue;
    const synergy=strikeSynergy(s,e,swing),piercing=swing.trait==='pierce'&&e.guard>0&&(kind==='heavy'||kind==='finisher'),critical=random(s)<stats.crit,result=damageEnemy(s,e,(swing.heavy?stats.thunderDamage*swing.damage:stats.damage*swing.damage)*skillScale*fin*(critical?1.6:1)*directUniqueMultiplier(s,e,swing),critical,kind,p,piercing,synergy,swing);hits++;contacts.push(e);if(critical&&result!=='miss'&&!critHit)critHit={x:e.x,y:e.y};if(!firstTarget){firstTarget=e;firstX=e.x;firstY=e.y;}unguarded||=result==='hit';applyWeaponTrait(s,e,synergy&&result==='hit'&&swing.synergyTriggered[synergy.id]&&((synergy.id==='shatter'&&swing.trait==='frost')||(synergy.id==='execute'&&swing.trait==='bleed'))?null:piercing?'pierce':swing.trait==='pierce'?null:swing.trait,stats,result);
    if(!e.boss&&result!=='guarded'){const n=direction(e.x-p.x,e.y-p.y),beforeX=e.x,beforeY=e.y;e.x+=n.x*swing.push;e.y+=n.y*swing.push;clampPosition(e,s.bounds);e.recoilX-=e.x-beforeX;e.recoilY-=e.y-beforeY;}
    if(tree.drain)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*tree.drain);
  }
  if(critHit)ancientAll(s,'crit',critHit);
  skills.basicSkillContact(s,swing,contacts,SKILL_HOOKS);
  strikeUnique(s,swing,stats,firstTarget,unguarded,firstX,firstY);
  for(const b of s.barrels)if(b.status==='idle'&&inCleave(p,b,stats.range*swing.range+16,swing.dot)){b.hp-=swing.heavy?60:stats.damage*swing.damage;if(b.hp<=0)armBarrel(s,b);hits++;}
  if(swing.heavy){let reflected=0;for(const q of s.projectiles){if(q.friendly||!inCleave(p,q,stats.range*swing.range+30,swing.dot))continue;q.friendly=true;q.vx=swing.x*660;q.vy=swing.y*660;q.damage=stats.thunderDamage*.8;q.ttl=1.2;q.perfectDodged=true;reflected++;}if(reflected)effect(s,'reflect',{x:p.x,y:p.y},.65);}
  if(hits){s.hitStop=Math.max(s.hitStop,swing.heavy||p.combo===3?.065:.035);s.shake=Math.max(s.shake,swing.heavy||p.combo===3?8:3);}effect(s,'cleave',{x:p.x,y:p.y,swing},.25);
}
function fireProjectiles(s,e,count=1){
  const n=direction(e.targetX-e.x,e.targetY-e.y),base=Math.atan2(n.y,n.x);
  for(let i=0;i<count;i++){if(s.projectiles.length>=64)break;const angle=base+(i-(count-1)/2)*(e.shotSpread??.2),dx=Math.cos(angle),dy=Math.sin(angle);
    const speed=e.shotSpeed??(e.boss?420:360);s.projectiles.push({id:s.nextId++,x:e.x+dx*34,y:e.y+dy*34,vx:dx*speed,vy:dy*speed,damage:e.boss?12*(e.damageBase??stageOf(s).damageScale)*(e.projectileDamageScale??1)*(e.furyScale??1):e.damage,ttl:2.6,friendly:false,perfectDodged:false,color:e.shotColor??stageOf(s).shotColor,projectileStyle:e.projectileStyle,fxChapter:fxOf(s)});
  }effect(s,'spit',{x:e.x,y:e.y,fxChapter:fxOf(s),nx:n.x,ny:n.y},.16);
}
function segmentHit(ax,ay,bx,by,x,y,r){const dx=bx-ax,dy=by-ay,d2=dx*dx+dy*dy,t=d2?clamp(((x-ax)*dx+(y-ay)*dy)/d2,0,1):0;return length(x-ax-dx*t,y-ay-dy*t)<=r?t:null;}
function updateProjectiles(s,dt){
  for(let i=s.projectiles.length-1;i>=0;i--){
    // A hit can end the stage and empty the list (victory clears projectiles) while we iterate.
    const q=s.projectiles[i];if(!q)continue;const ax=q.x,ay=q.y;q.x+=q.vx*dt;q.y+=q.vy*dt;q.ttl-=dt;
    if(q.ttl<=0||q.x<0||q.y<0||q.x>s.bounds.width||q.y>s.bounds.height){s.projectiles.splice(i,1);continue;}
    let target=null,best=2;
    for(const b of s.barrels){if(b.status==='spent')continue;const t=segmentHit(ax,ay,q.x,q.y,b.x,b.y,32);if(t!==null&&t<best){target=b;best=t;}}
    if(q.friendly){for(const e of s.enemies){if(!eligible(s,e))continue;const t=segmentHit(ax,ay,q.x,q.y,e.x,e.y,e.boss?65:28);if(t!==null&&t<best){target=e;best=t;}}}
    else{const t=segmentHit(ax,ay,q.x,q.y,s.player.x,s.player.y,26);if(t!==null&&t<best){target=s.player;best=t;}}
    if(!target)continue;
    if(target.kind==='barrel')armBarrel(s,target);else if(target===s.player)hurtPlayer(s,q.damage,{x:ax,y:ay});else {const result=damageEnemy(s,target,q.damage,false,q.ancientSpec?'proc':'reflected',{x:ax,y:ay});if(q.ancientSpec&&result!=='miss')ancientStatus(s,target,q.ancientSig??(q.ancientSpec.ancient??q.ancientSpec.crafted??q.ancientSpec.seal).signature,q.ancientAttack);}
    effect(s,'acidImpact',{x:ax+(q.x-ax)*best,y:ay+(q.y-ay)*best,friendly:q.friendly,fxChapter:q.fxChapter},.3);s.projectiles.splice(i,1);if(s.phase!=='playing')return;
  }
}
function updateBarrels(s,dt){
  for(const b of s.barrels){if(b.status!=='armed')continue;b.fuse-=dt;if(b.fuse>0)continue;
    b.status='spent';s.run.explosions++;s.shake=Math.max(s.shake,12);effect(s,'explosion',{x:b.x,y:b.y,radius:b.radius},.55);
    for(const other of s.barrels)if(other!==b&&other.status==='idle'&&length(other.x-b.x,(other.y-b.y)/.65)<b.radius){armBarrel(s,other);other.fuse=.12;}
    for(const e of s.enemies)if(eligible(s,e)&&length(e.x-b.x,(e.y-b.y)/.65)<b.radius+20)damageEnemy(s,e,92*stageOf(s).hpScale,false,'blast');
    if(length(s.player.x-b.x,(s.player.y-b.y)/.65)<b.radius)hurtPlayer(s,16*stageOf(s).damageScale);
    if(s.phase!=='playing')return;
  }
}
function hurtPlayer(s,value,source=null){
 const p=s.player;if(s.phase!=='playing'||p.invulnerable>0)return;
 value=skills.incomingSkillDamage(s,value,source,SKILL_HOOKS);if(value<=0||s.phase!=='playing')return;skills.interruptSkill(s);
 {const guard=growth.treeBonus(s.profile).lowHpGuard;if(guard&&p.hp<p.maxHp*.5)value*=1-guard;}
 let damage=Math.max(1,Math.round(value));const u=s.uniqueState;
 if(u.shield>0){const blocked=Math.min(damage,u.shield);u.shield-=blocked;damage-=blocked;effect(s,'unique',{uniqueId:'barrier',x:p.x,y:p.y,radius:55},.4);}
 p.invulnerable=.42;if(!damage)return;
 for(const slot of ANCIENT_SLOTS){const shield=u.ancientShields[slot];if(shield&&damage>0){const blocked=Math.min(damage,shield.amount);damage-=blocked;shield.amount-=blocked;if(shield.amount<=0)u.ancientShields[slot]=null;}}if(!damage)return;p.hp=Math.max(0,p.hp-damage);s.run.lowestHp=Math.min(s.run.lowestHp??1,p.hp/p.maxHp);p.lastDamage=s.run.time;u.still=0;s.shake=6;effect(s,'playerDamage',{x:p.x,y:p.y-115,value:damage},.65);
 p.queued=false;p.queuedAim=null;p.combo=0;p.comboWindow=0;p.counterReady=0;
 const armor=s.loadout.armor;
 if(!p.hp)skills.skillLastStand(s,SKILL_HOOKS);
 if(!p.hp&&armor?.definition.id==='lastStand'&&!u.lastStand){u.lastStand=true;p.hp=Math.max(1,Math.round(p.maxHp*UNIQUE_EFFECTS.lastStand.health*armor.power));p.invulnerable=UNIQUE_EFFECTS.lastStand.invulnerable;uniqueVisual(s,armor,100);}
 if(!p.hp&&s.run.rush&&s.run.rushKills>0&&s.run.flow==='combat'){p.hp=1;s.run.rushEnd='fallen';completeRush(s);return;}
 if(!p.hp){p.action='death';p.actionTime=0;s.phase='defeat';settleResources(s);collectGear(s);finishFailedStage(s);clearAncient(s);effect(s,'playerDeath',{x:p.x,y:p.y},.64);}
 else{setAction(p,'hurt');p.actionTime=0;p.attackHit=true;hurtUnique(s,armor,damage);inscriptionCounter(s,source);}
}
function updateEnemy(s,e,dt){
  if(e.boss&&!e.dead)updateBossRule(s,e,dt);
  if(!e.dead)updateEnemyStatus(s,e,dt);e.actionTime+=dt;e.cooldown=Math.max(0,e.cooldown-dt);if(e.dead||s.phase!=='playing')return;
  const moveDt=dt*(e.chillRemaining>0?(e.boss?.85:.65):1);
  const p=s.player,dx=p.x-e.x,dy=p.y-e.y,d=length(dx,dy),n=direction(dx,dy);
  if(!eligible(s,e)){setAction(e,'idle');return;}
  if(e.exposed>0){e.exposed=Math.max(0,e.exposed-dt);if(!e.exposed&&e.guardMax)e.guard=e.guardMax;}
  if(e.boss&&!e.enraged&&e.hp<e.maxHp*.5){e.enraged=true;effect(s,'bossRage',{x:e.x,y:e.y},2);}
  if(!e.aggro){if(d>330){setAction(e,'idle');return;}e.aggro=true;}
  if(e.action==='stagger'){if(e.actionTime<1.1)return;setAction(e,'walk');}
  if(e.action==='hurt'){if(e.actionTime<.28)return;setAction(e,'walk');}
  if(e.action==='windup'){
    if(e.actionTime<e.windup)return;setAction(e,'attack');
    if(enemyAttackKind(e)==='volley')fireProjectiles(s,e,projectileCount(e,stageOf(s).id));
    else if(enemyAttackKind(e)==='charge'){const charge=direction(e.targetX-e.x,e.targetY-e.y);e.chargeX=charge.x;e.chargeY=charge.y;}
    else{effect(s,'slam',{x:e.targetX,y:e.targetY,radius:e.radius,fxChapter:fxOf(s),monsterKind:e.type,nx:e.targetX-e.x,ny:e.targetY-e.y},.35);if(e.type==='skitter')effect(s,'skitterStrike',{x:e.x,y:e.y},.18);if(length(p.x-e.targetX,(p.y-e.targetY)/.65)<e.radius+16)hurtPlayer(s,e.damage,e);}return;
  }
  if(e.action==='attack'){
    if(enemyAttackKind(e)==='charge'&&e.actionTime<(e.chargeDuration??.45)){e.x+=e.chargeX*(e.chargeSpeed??650)*moveDt;e.y+=e.chargeY*(e.chargeSpeed??650)*moveDt;clampPosition(e,s.bounds);if(length(p.x-e.x,p.y-e.y)<(e.boss?90:65))hurtPlayer(s,e.damage,e);}
    if(e.actionTime>=.65){setAction(e,'walk');e.cooldown=e.attackInterval??(e.boss?(e.enraged?1.1:1.25):e.type==='spitter'?(themeOf(s)===1?2.7:2.25):e.type==='bulwark'?1.2:.9);e.pattern++;}return;
  }
  e.guardX=n.x;e.guardY=n.y;setLook(e,n.x,n.y);e.facing=n.x<0?1:-1;
  const range=e.attackRange??(e.boss?320:e.type==='spitter'?550:e.elite?180:e.type==='bulwark'?120:76);
  if(d<range&&!e.cooldown){e.targetX=p.x;e.targetY=p.y;e.perfectDodged=false;setLook(e,n.x,n.y,true);setAction(e,'windup');if(e.boss&&e.huntMode>0)e.volleyShots=(e.enraged?5:3)+HUNT_MODES[e.huntMode].shots;e.windup=e.windupBase??(e.boss?(e.enraged?.8:1):e.type==='spitter'?.8:e.elite?.75:e.type==='bulwark'?.75:themeOf(s)===1?.58:.48);return;}
  let move=d>55?1:0;if(e.type==='spitter')move=d<(e.standoffMin??180)?-1:d>(e.standoffMax??340)?1:0;
  e.backpedal=move<0;if(move&&e.speed>0){setAction(e,'walk');e.x+=n.x*e.speed*move*moveDt;e.y+=n.y*e.speed*move*moveDt;
    for(const other of s.enemies){if(other===e||other.dead)continue;const ox=e.x-other.x,oy=e.y-other.y,od=length(ox,oy);if(od>0&&od<45){e.x+=ox/od*35*dt;e.y+=oy/od*35*dt;}}clampPosition(e,s.bounds);
  }else setAction(e,'idle');
}
function avoidCore(s,core){
  const p=s.player,held=s.assist.evade;if(held?.kind!=='core'||held.id!==core.id)s.assist.evade={kind:'core',id:core.id};
  p.queued=false;p.queuedAim=null;
  if(length(p.x-core.x,(p.y-core.y)/.65)>=core.radius+60)return{x:0,y:0,attack:false};
  const n=direction(p.x-core.x,p.y-core.y);if(core.fuse<.18)dash(s,n);return{...n,attack:false};
}
function avoidEnemy(s,threat){
  const p=s.player,held=s.assist.evade;if(held?.kind!=='enemy'||held.id!==threat.id)s.assist.evade={kind:'enemy',id:threat.id};
  p.queued=false;p.queuedAim=null;
  if(length(p.x-threat.targetX,(p.y-threat.targetY)/.65)>=threat.radius+95)return{x:0,y:0,attack:false};
  const n=direction(p.x-threat.targetX,p.y-threat.targetY,direction(p.x-threat.x,p.y-threat.y));if(threat.actionTime>threat.windup*.7)dash(s,n);return{...n,attack:false};
}
// Alpha 0.135 (사용자 요청): the automatic hunter no longer dodges every monster attack. Each telegraphed attack and each
// projectile is judged once, by a hash of its id (the combat RNG stream stays untouched), and dodged with this chance.
// Explosive cores are terrain, not monster skills, and are still always avoided; 흘려베기 still counters any attack.
export const AUTO_DODGE_CHANCE=.3;
export const autoDodges=(kind,id,salt=0)=>((Math.imul(id,2654435761)^Math.imul(salt+(kind==='shot'?7919:104729),40503))>>>0)%1000<AUTO_DODGE_CHANCE*1000;
// Hunts are always automatic (Alpha 0.104). input.skillMode==='manual' leaves skills to the player.
function autoInput(s,input=null){
  const p=s.player,held=s.assist.evade,autoSkills=input?.skillMode!=='manual';
  const core=s.barrels.find(b=>b.status==='armed'&&length(p.x-b.x,(p.y-b.y)/.65)<b.radius+30);
  if(core)return avoidCore(s,core);
  const shot=s.projectiles.find(q=>threatenedByShot(s,q,p,.24)&&autoDodges('shot',q.id));
  if(shot){p.queued=false;p.queuedAim=null;const n=direction(-shot.vy,shot.vx);dash(s,n);return{...n,attack:false};}
  const threat=s.enemies.find(e=>eligible(s,e)&&enemyAttackKind(e)!=='volley'&&e.action==='windup'&&length(p.x-e.targetX,(p.y-e.targetY)/.65)<e.radius+65);
  if(threat){if(autoSkills&&threat.windup-threat.actionTime<=.24&&skills.castSkill(s,'parry',{x:threat.x-p.x,y:threat.y-p.y},SKILL_HOOKS))return {x:0,y:0,attack:false};const dodged=s.enemies.find(e=>eligible(s,e)&&enemyAttackKind(e)!=='volley'&&e.action==='windup'&&length(p.x-e.targetX,(p.y-e.targetY)/.65)<e.radius+65&&autoDodges('enemy',e.id,e.pattern));if(dodged)return avoidEnemy(s,dodged);}
  // Waiting outside one hazard never takes priority over a new immediate threat.
  if(held?.kind==='core'){const core=s.barrels.find(b=>b.id===held.id&&b.status==='armed');if(core)return avoidCore(s,core);}
  if(held?.kind==='enemy'){const enemy=s.enemies.find(e=>e.id===held.id&&eligible(s,e)&&e.action==='windup'&&autoDodges('enemy',e.id,e.pattern));if(enemy)return avoidEnemy(s,enemy);}
  s.assist.evade=null;
  let closest=null,closestScore=Infinity,current=null,currentScore=Infinity;
  for(const e of s.enemies){
    if(!eligible(s,e))continue;
    const mode=s.profile.skillBook.auto.mode;let score=length(e.x-p.x,e.y-p.y)-(e.type==='spitter'?90:0);if(mode==='boss'&&(e.boss||e.elite))score-=220;if(mode==='farm'){let neighbors=0;for(const other of s.enemies)if(eligible(s,other)&&length(other.x-e.x,other.y-e.y)<200)neighbors++;score-=neighbors*35;}
    if(score<closestScore){closest=e;closestScore=score;}if(e.id===s.assist.targetId){current=e;currentScore=score;}
  }
  // Keep a useful target through tiny distance changes and a committed swing.
  const e=current&&(currentScore<=closestScore+80||['attack','heavy'].includes(p.action))?current:closest;
  const targetId=e?.id??null;if(targetId!==s.assist.targetId){s.assist.targetId=targetId;s.assist.approaching=true;p.queued=false;p.queuedAim=null;}
  if(!e){s.assist.approaching=false;p.queued=false;p.queuedAim=null;return{x:0,y:0,attack:false};}
  const n=direction(e.x-p.x,e.y-p.y),d=length(e.x-p.x,e.y-p.y),range=playerStats(s.profile).range,stop=range*.68;
  if(s.assist.approaching&&d<=stop+ARRIVAL_EPSILON)s.assist.approaching=false;else if(!s.assist.approaching&&d>range*.9)s.assist.approaching=true;
  if(!['attack','heavy'].includes(p.action)){p.aimX=n.x;p.aimY=n.y;}
  // A tapped skill waits for the gap between automatic swings, then fires at the current target.
  if(skills.gearSkill(s,n,SKILL_HOOKS))return {x:0,y:0,attack:false,aim:n};
  if(input?.skillRequest&&skills.castSkill(s,input.skillRequest,n,SKILL_HOOKS))return {x:0,y:0,attack:false,aim:n};
  if(autoSkills&&skills.autoSkill(s,n,SKILL_HOOKS))return {x:0,y:0,attack:false,aim:n};
  if(s.skillRuntime.stanceUntil>s.run.time&&(p.stamina<65||p.hp/p.maxHp<.5))return {x:-n.x,y:-n.y,attack:false,aim:n};
  return{x:s.assist.approaching?n.x:0,y:s.assist.approaching?n.y:0,attack:d<range,aim:n,destination:s.assist.approaching?{x:e.x,y:e.y}:null,stopDistance:stop};
}
function updatePickups(s,dt,force=false){
  const p=s.player,stats=playerStats(s.profile);
  s.pickups=s.pickups.filter(drop=>{
    if(isResourcePickup(drop)){drop.age=(drop.age??0)+dt;if(!force&&drop.age<.35)return true;}
    if(drop.kind==='equipment'){drop.age+=dt;if(!force&&drop.age<.65)return true;}
    const dx=p.x-drop.x,dy=p.y-drop.y,d=length(dx,dy);
    if(d<stats.collection||drop.vacuum){const n=direction(dx,dy),travel=Math.min(d,(drop.vacuum?1050:620)*dt);drop.x+=n.x*travel;drop.y+=n.y*travel;}
    if(d>28)return true;
    if(isResourcePickup(drop)){claimResource(s,drop);return false;}
    if(drop.kind==='equipment'){receiveItem(s,drop.item);return false;}
    if(drop.cores)lootPulse(s);const baseXp=Math.round(drop.xp*(HUNT_MODES[s.difficulty]?.xp??1)),xp=growthXp(s.profile,baseXp);s.profile.gold+=drop.gold;s.profile.cores+=drop.cores;s.run.gold+=drop.gold;s.run.cores+=drop.cores;s.run.xp+=xp;s.run.xpBonus+=xp-baseXp;
    if(gainXp(s.profile,xp)){refreshStats(s);p.hp=Math.min(p.maxHp,p.hp+22);effect(s,'levelUp',{x:p.x,y:p.y},1);}
    effect(s,'collect',{x:drop.x,y:drop.y},.3);return false;
  });
}
export function remainingMonsters(s){if(s.phase==='camp'||s.phase==='victory'||s.run.flow==='stageClear')return 0;let adds=0;for(const e of s.enemies)if(e.objective===false&&!e.dead)adds++;return Math.max(0,s.run.stageQuota-s.run.stageKills)+adds;}
function expireHunt(s){
 if(s.phase!=='playing'||s.run.flow==='stageClear')return false;
 // 보스 러시 keeps what was won: time running out after a boss fell settles those kills.
 if(s.run.rush&&s.run.rushKills>0){if(s.run.flow==='combat'){s.run.timeRemaining=0;s.run.rushEnd='timeout';completeRush(s);}return true;}
 // Commit the terminal phase before settling ownership: gear hooks cannot resume combat.
 s.phase='defeat';s.run.timedOut=true;s.run.timeRemaining=0;s.run.flow='timeout';s.run.timer=0;s.hitStop=0;
 const p=s.player;p.action='idle';p.actionTime=0;p.queued=false;p.queuedAim=null;p.swing=null;p.combo=0;p.comboWindow=0;p.moving=false;
 s.spawns.length=0;s.projectiles.length=0;s.barrels.length=0;settleResources(s);collectGear(s);finishFailedStage(s);skills.clearSkillStage(s);clearUniqueTransient(s);clearAncient(s);return true;
}
export function advanceGame(s,elapsed,input={}){
  let dt=clamp(number(elapsed),0,.1);if(!dt||s.paused||s.settlement)return;s.effectBudget=50;
  if(s.phase==='playing'&&s.run.flow!=='stageClear'&&s.run.timeRemaining<=0){expireHunt(s);return;}
  if(s.phase!=='playing')s.hitStop=0;s.shake=Math.max(0,s.shake-dt*30);
  if(s.hitStop>0){
    const used=Math.min(dt,s.hitStop);s.hitStop-=used;dt-=used;
    // Visual contact freezes do not grant extra challenge time.
    if(s.phase==='playing'&&s.run.flow!=='stageClear'){s.run.timeRemaining=Math.max(0,s.run.timeRemaining-used);if(s.run.timeRemaining<=1e-9){expireHunt(s);return;}}
    if(!dt)return;
  }
  if(s.phase!=='playing'){
    if(s.phase==='defeat'&&s.player.action==='death')s.player.actionTime=Math.min(ACTION_DURATIONS.death,s.player.actionTime+dt);
    if(s.phase==='victory'){
      s.resultDelay=Math.max(0,s.resultDelay-dt);const p=s.player;p.actionTime+=dt;
      if(['attack','heavy'].includes(p.action)&&p.actionTime>=p.swing.duration){setAction(p,'idle');p.queued=false;p.queuedAim=null;}
    }
    for(const e of s.enemies)if(e.dead)e.actionTime+=dt;
    s.effects=s.effects.filter(f=>(f.ttl-=dt)>0);return;
  }
  s.spawnView.width=clamp(number(input.viewportWidth,s.spawnView.width),360,1600);s.spawnView.height=clamp(number(input.viewportHeight,s.spawnView.height),400,1800);
  let left=dt;while(left>.00001&&s.phase==='playing'){
    const timed=s.run.flow==='combat'||s.run.flow==='break';
    if(timed&&s.run.timeRemaining<=1e-9){expireHunt(s);break;}
    const step=Math.min(.025,left,timed?s.run.timeRemaining:Infinity),previousStage=s.run.stage;left-=step;if(timed)s.run.timeRemaining=Math.max(0,s.run.timeRemaining-step);s.run.time+=step;s.effects=s.effects.filter(f=>(f.ttl-=step)>0);const p=s.player,stats=playerStats(s.profile),previousX=p.x,previousY=p.y;for(const key of ['attackCooldown','dashCooldown','thunderCooldown','invulnerable','comboWindow','counterReady'])p[key]=Math.max(0,p[key]-step);p.stamina=Math.min(100,p.stamina+18*(1+growth.treeBonus(s.profile).staminaRegen)*step);tickUniqueClocks(s,step);skills.tickSkills(s,step,SKILL_HOOKS);if(s.phase!=='playing')break;
    if(s.run.flow==='stageClear'){s.run.timer=Math.max(0,s.run.timer-step);if(!s.run.timer){s.run.stage++;prepareStage(s,true);}continue;}
    if(s.run.flow==='combat'){s.run.waveTime+=step;advanceSpawns(s,step);}
    if(!s.auto){s.assist.targetId=null;s.assist.approaching=false;s.assist.evade=null;}
    const controls=s.auto?autoInput(s,input):{x:number(input.x),y:number(input.y),attack:!!input.attack,destination:input.destination,stopDistance:input.stopDistance};
    let remaining=Infinity;const destination=controls.destination;
    if(destination&&Number.isFinite(destination.x)&&Number.isFinite(destination.y)){
      const dx=destination.x-p.x,dy=destination.y-p.y,d=length(dx,dy);remaining=Math.max(0,d-Math.max(0,number(controls.stopDistance)));
      const v=remaining>ARRIVAL_EPSILON?direction(dx,dy,{x:0,y:0}):{x:0,y:0};controls.x=v.x;controls.y=v.y;
    }
    const n=direction(controls.x,controls.y,{x:0,y:0});
    if(!s.auto&&!['attack','heavy','dash','hurt'].includes(p.action)){
      const a=input.aim?direction(input.aim.x,input.aim.y,{x:p.aimX,y:p.aimY}):(controls.x||controls.y)?n:null;
      if(a){const fresh=Number.isFinite(input.aimRevision)&&input.aimRevision!==p.lastAimRevision,changed=Math.hypot(a.x-p.aimX,a.y-p.aimY)>.02;if(Number.isFinite(input.aimRevision))p.lastAimRevision=input.aimRevision;p.aimX=a.x;p.aimY=a.y;if((changed||fresh)&&!controls.x&&!controls.y)setLook(p,a.x,a.y);}
    }
    if(!['attack','heavy','dash','hurt'].includes(p.action)){if(controls.x||controls.y)setLook(p,n.x,n.y);else if(s.auto)setLook(p,p.aimX,p.aimY);}
    if(controls.attack)attack(s,s.auto?controls.aim:input.aim??(controls.x||controls.y?n:undefined));
    if(p.action==='hurt'){p.actionTime+=step;if(p.actionTime>=ACTION_DURATIONS.hurt)setAction(p,'idle');}
    else if(p.action==='dash'){
      p.x+=p.dashX*850*step;p.y+=p.dashY*850*step;clampPosition(p,s.bounds);p.actionTime+=step;
      const trail=Math.floor(p.actionTime/.06);if(trail>p.dashTrailStep&&p.actionTime<ACTION_DURATIONS.dash){p.dashTrailStep=trail;effect(s,'dashTrail',{x:p.x,y:p.y,heading:p.heading,actionTime:p.actionTime},.16);}
      if(p.actionTime>=ACTION_DURATIONS.dash)setAction(p,'idle');
    }
    else if(['attack','heavy'].includes(p.action)){
      const swing=p.swing;p.actionTime+=step;
      if(!swing.sounded&&p.actionTime>=swing.impact*.68){swing.sounded=true;if(!swing.skillVisualOnly)effect(s,swing.counter?'counterSlash':swing.heavy?'heavySwing':'swing',{x:p.x,y:p.y,combo:p.combo,motion:swing.motion},.18);}
      if(!p.attackHit&&p.actionTime>=swing.impact)strike(s);
      if(p.actionTime<=swing.impact){p.x+=swing.x*swing.step/swing.impact*step;p.y+=swing.y*swing.step/swing.impact*step;}
      const travel=s.skillRuntime.travel?0:Math.min(stats.speed*.15*step,remaining);p.x+=n.x*travel;p.y+=n.y*travel;
      if(p.actionTime>=swing.duration){const queued=p.queued&&!swing.heavy,queuedAim=p.queuedAim;p.comboWindow=swing.heavy?0:.5;p.attackCooldown=0;setAction(p,'idle');if(queued)startAttack(s,queuedAim);}
    }else{setAction(p,controls.x||controls.y?'walk':'idle');p.actionTime+=step;const travel=Math.min(stats.speed*skills.skillMoveScale(s)*step,remaining);p.x+=n.x*travel;p.y+=n.y*travel;}
    clampPosition(p,s.bounds);const moved=length(p.x-previousX,p.y-previousY);updateUnique(s,step,moved);skills.afterSkillMovement(s,step,moved,SKILL_HOOKS);p.moving=p.action==='walk'&&moved>.0001;if(p.moving)p.motionDistance+=moved;if(!['attack','heavy'].includes(p.action)&&Math.abs(p.aimX)>.05)p.facing=p.aimX<0?-1:1;
    if(s.phase!=='playing')break;for(const e of s.enemies){const beforeX=e.x,beforeY=e.y;updateEnemy(s,e,step);const moved=length(e.x-beforeX,e.y-beforeY);e.moving=e.action==='walk'&&moved>.0001;if(e.moving)e.motionDistance=(e.motionDistance??0)+moved;if(s.phase!=='playing')break;}if(s.phase!=='playing')break;
    updateProjectiles(s,step);if(s.phase!=='playing')break;updateBarrels(s,step);if(s.phase!=='playing')break;
    if(s.run.time-p.lastDamage>4)p.hp=Math.min(p.maxHp,p.hp+stats.regeneration*step);updatePickups(s,step);updateCampaign(s,step);
    if(s.settlement||s.run.stage!==previousStage)break; // The app releases held controls before the next stage's first update.
    // Resolve contacts at the deadline first. A completed clear/victory wins the tie.
    if(s.phase==='playing'&&s.run.flow!=='stageClear'&&s.run.timeRemaining<=1e-9){expireHunt(s);break;}
    let write=0;for(const e of s.enemies)if(!e.dead||e.actionTime<5)s.enemies[write++]=e;s.enemies.length=write;
    if(s.hitStop>0){
      // A newly triggered freeze discards the rest of this visual frame, but
      // the challenge clock still accounts for that elapsed frame budget.
      if(s.run.flow!=='stageClear'){s.run.timeRemaining=Math.max(0,s.run.timeRemaining-left);if(s.run.timeRemaining<=1e-9)expireHunt(s);}
      break;
    }
  }
}

export function modeOpen(profile,difficulty){return !!huntMode(difficulty)&&STAGES.every((_,i)=>(profile.bossMastery?.[i]??-1)>=difficulty-1);}
export function bossModeAvailable(profile,chapter,difficulty){
 if(!huntMode(difficulty)||!Number.isInteger(chapter)||chapter<1||chapter>STAGES.length)return false;
 if(!difficulty)return stageLimit(profile,chapter)>=STAGES_PER_CHAPTER;
 // Alpha 0.139 (사용자 결정): 정예 opens once every chapter is cleared on 일반, 악몽 once every chapter is cleared on 정예;
 // inside a mode the chapters open one by one.
 return modeOpen(profile,difficulty)&&(chapter===1||(profile.bossMastery?.[chapter-2]??-1)>=difficulty);
}
export function projectileCount(e,chapter=1){return e.boss?((e.action==='windup'||e.action==='attack')&&Number.isInteger(e.volleyShots)?e.volleyShots:(e.enraged?5:3)+(HUNT_MODES[e.huntMode??0]?.shots??0)):e.shots??(chapter>1?3:1);}

// Hooks keep all enemy death, rewards and existing guard resolution in this engine.
// Alpha 0.127: worn raid ancients and their 장비 기술, cached per equipment object (equipping replaces it).
export function gearSkills(s){const p=s.profile,c=s.gearCache;if(c&&c.equipment===p.equipment&&c.count===p.inventory.length)return c.list;
 const list=[];for(const slot of EQUIPMENT_KEYS){const item=p.inventory.find(i=>i.id===p.equipment[slot]&&i.slot===itemSlotForPosition(slot)),row=item&&skills.GEAR_SKILL_BY_ANCIENT[item.catalogId];if(row)list.push({id:row.id,item,get power(){return raidPowerRoll(this.item);}});}
 s.gearCache={equipment:p.equipment,count:p.inventory.length,list};return list;}
// Alpha 0.139: seconds left in a 방어 태세 boss's guarded 8 of every 12 seconds (0 outside it), so auto skills can wait for the weak point.
// Alpha 0.139 (사용자 결정): a 방어 태세 boss guards 70% of damage on 일반 and 55% on 정예/악몽 — the 6지역 defense bosses walled
// four of five endgame simulations at 정예 51~54장, while the 일반 51장 wall (spec-up alone cannot pass) stays as it was.
export const STANCE_GUARD=Object.freeze([.7,.55,.55]);
export const stanceGuard=s=>STANCE_GUARD[s.difficulty]??STANCE_GUARD[0];
export function bossStanceLeft(s){if(ruleOf(s)!=='defense'||!s.enemies.some(e=>e.boss&&!e.dead))return 0;const t=s.run.time%12;return t<8?8-t:0;}
const SKILL_HOOKS={stanceLeft:bossStanceLeft,cast:(s,id)=>{capacitorCast(s,id);ancientAll(s,'skill');},gearSkills,heal:(s,f)=>{s.player.hp=Math.min(s.player.maxHp,s.player.hp+s.player.maxHp*f);},status:(s,e,r,attack)=>ancientStatus(s,e,r,attack),shield:(s,f)=>{const u=s.uniqueState,amount=s.player.maxHp*f;if(amount>u.shield){u.shield=amount;u.shieldTime=3;u.shieldOwner=null;}},inscriptions:s=>s.buildEffects,capture:s=>equipmentSnapshot(s.profile),stats:playerStats,hit:damageEnemy,visual:effect,clamp:clampPosition,motion(s,n,duration,id){
 const momentum=s.uniqueState.momentum;startAttack(s,n,true,false);s.uniqueState.momentum=momentum;const p=s.player;p.swing.name=skills.SKILL_BY_ID[id]?.name??p.swing.name;p.swing.skillId=id;p.swing.skillVisualOnly=true;p.swing.step=0;p.swing.duration=duration;p.swing.impact=Math.min(duration,.1);p.attackCooldown=duration;p.queued=false;
}};
export function useSkill(s,id,aim){return skills.castSkill(s,id,aim,SKILL_HOOKS);}

// Raid clear (Alpha 0.123): fixed gold, cores and materials for the opened chapter, plus a raid-only ancient chance.
export const RAID_LOOT_KEY='raid';
// Alpha 0.125: a chapter boss teaches its 괴수 기술 on the first kill; 정예/악몽 kills may teach 강화/극.
// The grade roll hashes the battle identity instead of drawing from a stream, so drops and combat stay unchanged.
export function beastRoll(s,chapter){let h=Math.imul((s.profile.hunts+1)*2654435761^chapter*40503^(s.difficulty+1)*97,2246822519)>>>0;h=Math.imul(h^h>>>13,3266489917)>>>0;return ((h^h>>>16)>>>0)/4294967296;}
function learnBeastTechnique(s,st){
 const d=skills.BEAST_TECHNIQUES.find(t=>t.chapter===st.id);if(!d)return;const book=s.profile.beastSkills,before=book[d.id]??0;let grade=Math.max(before,1);
 if(s.difficulty>0&&beastRoll(s,st.id)<skills.BEAST_GRADE_CHANCE[s.difficulty])grade=Math.max(grade,s.difficulty+1);
 if(grade>before){book[d.id]=grade;s.run.beastLearned={id:d.id,grade,before};effect(s,'beastLearned',{x:s.player.x,y:s.player.y,skillId:d.id,grade},2.4);}
}
function completeRaid(s){
 if(s.settlement||s.run.flow!=='combat')return false;
 const r=raidDefinition(s.run.raidId),tier=s.run.raidTier??0,base=raidRewards(s.run.raidChapter),k=modeScale(MODE_CHAPTERS,tier).reward,reward={...base,gold:Math.round(base.gold*k),materials:Object.fromEntries(Object.entries(base.materials).map(([id,n])=>[id,n*(1+tier)]))};s.run.dungeonReward={gold:Math.min(reward.gold,Math.max(0,1e8-s.profile.gold)),cores:Math.min(reward.cores,Math.max(0,1e6-s.profile.cores)),materials:{}};
 s.profile.gold+=s.run.dungeonReward.gold;s.run.gold+=s.run.dungeonReward.gold;s.profile.cores+=s.run.dungeonReward.cores;s.run.cores+=s.run.dungeonReward.cores;
 for(const [id,n]of Object.entries(reward.materials)){const amount=Math.min(n,Math.max(0,MATERIAL_LIMIT-s.profile.materials[id]));s.profile.materials[id]+=amount;s.run.materials+=amount;if(amount)s.run.materialLedger[id]=(s.run.materialLedger[id]??0)+amount;s.run.dungeonReward.materials[id]=amount;}
 s.profile.raids.clears[r.id]++;s.run.rooms=1;s.run.seals=1;
 if(lootRandom(s)<dropRate(s,RAID_LOOT_KEY)){const item=rollAncient({id:allocateItemId(s),tier:6,raid:r.id,hunt:tier},lootRandom(s),()=>lootRandom(s));if(receiveItem(s,item,'stage')){s.run.dungeonReward.item=item;discoverAncient(s.profile,item);s.run.bossAncients.push(item.catalogId);}}
 s.projectiles.length=0;s.spawns.length=0;s.player.queued=false;s.player.swing=null;s.player.action='idle';s.hitStop=0;skills.clearSkillStage(s);clearUniqueTransient(s);clearAncient(s);s.resultDelay=.5;return queueSettlement(s,true);
}
// 보스 러시 settlement (Alpha 0.136): gold and 인장 조각 for the bosses felled, a seal by chance (certain at five).
function completeRush(s){
 if(s.settlement||s.run.flow!=='combat')return false;
 const kills=s.run.rushKills,reward=rush.rushRewards(kills,s.run.rushChapter),r=s.profile.bossRush;
 s.run.dungeonReward={gold:Math.min(reward.gold,Math.max(0,1e8-s.profile.gold)),materials:{}};s.profile.gold+=s.run.dungeonReward.gold;s.run.gold+=s.run.dungeonReward.gold;
 const amount=Math.min(reward.shards,Math.max(0,MATERIAL_LIMIT-s.profile.materials.sealShard));s.profile.materials.sealShard+=amount;s.run.materials+=amount;if(amount){s.run.materialLedger.sealShard=(s.run.materialLedger.sealShard??0)+amount;s.run.dungeonReward.materials.sealShard=amount;}
 r.best=Math.max(r.best,kills);if(kills===rush.RUSH_BOSSES)r.clears++;s.run.rooms=kills;s.run.seals=kills;
 if(lootRandom(s)<reward.sealChance){const item=seals.rollSeal({id:allocateItemId(s),tier:chapterTheme(s.run.rushChapter).id,characterId:s.profile.characterId??'lirian'},()=>lootRandom(s));if(receiveItem(s,item,'stage'))s.run.dungeonReward.item=item;}
 for(const q of s.enemies)if(!q.dead){q.dead=true;q.hp=0;q.action='death';q.actionTime=0;}
 s.projectiles.length=0;s.spawns.length=0;s.player.queued=false;s.player.swing=null;s.player.action='idle';s.hitStop=0;skills.clearSkillStage(s);clearUniqueTransient(s);clearAncient(s);s.resultDelay=.5;return queueSettlement(s,true);
}
function completeDungeon(s){
 if(s.settlement||s.run.flow!=='combat')return false;
 if(s.run.dungeonId==='tower')return completeTower(s);
 const reward=dungeonRewards(s.run.dungeonId,s.run.stage);s.run.dungeonReward={gold:Math.min(reward.gold,Math.max(0,1e8-s.profile.gold)),materials:{}};s.profile.gold+=s.run.dungeonReward.gold;s.run.gold+=s.run.dungeonReward.gold;
 for(const [id,n]of Object.entries(reward.materials)){const amount=Math.min(n,Math.max(0,MATERIAL_LIMIT-s.profile.materials[id]));s.profile.materials[id]+=amount;s.run.materials+=amount;if(amount)s.run.materialLedger[id]=(s.run.materialLedger[id]??0)+amount;s.run.dungeonReward.materials[id]=amount;}
 if(reward.xp){const xp=growthXp(s.profile,reward.xp);s.run.xp+=xp;s.run.dungeonReward.xp=xp;if(gainXp(s.profile,xp))refreshStats(s);}
 s.profile.dungeonProgress[s.run.dungeonId]=Math.max(s.profile.dungeonProgress[s.run.dungeonId],s.run.stage);s.run.rooms=1;s.run.seals=1;
 if(lootRandom(s)<dropRate(s,'dungeon')){const chapter=STAGES[Math.min(STAGES.length,Math.max(1,s.profile.unlockedStage))-1],item=rollAccessory({id:allocateItemId(s),tier:chapter?.theme??1,grade:s.run.stage>=7?2:s.run.stage>=4?1:0},()=>lootRandom(s));if(receiveItem(s,item,'stage'))s.run.dungeonReward.item=item;}
 s.projectiles.length=0;s.spawns.length=0;s.player.queued=false;s.player.swing=null;s.player.action='idle';s.hitStop=0;skills.clearSkillStage(s);clearUniqueTransient(s);clearAncient(s);s.resultDelay=.5;return queueSettlement(s,true);
}
// Alpha 0.141 무한의 탑: the floor's rewards only on its first clear; the best floor drives towerBonus (playerStats).
function completeTower(s){
 const floor=s.run.stage,first=floor>s.profile.tower.best,reward=first?dungeonRewards('tower',floor):{gold:0,materials:{}};
 s.run.dungeonReward={gold:Math.min(reward.gold,Math.max(0,1e8-s.profile.gold)),materials:{},firstClear:first};s.profile.gold+=s.run.dungeonReward.gold;s.run.gold+=s.run.dungeonReward.gold;
 for(const [id,n]of Object.entries(reward.materials)){const amount=Math.min(n,Math.max(0,MATERIAL_LIMIT-s.profile.materials[id]));s.profile.materials[id]+=amount;s.run.materials+=amount;if(amount)s.run.materialLedger[id]=(s.run.materialLedger[id]??0)+amount;s.run.dungeonReward.materials[id]=amount;}
 if(first){s.profile.tower={best:floor};refreshStats(s,true);}s.run.rooms=1;s.run.seals=1;
 s.projectiles.length=0;s.spawns.length=0;s.player.queued=false;s.player.swing=null;s.player.action='idle';s.hitStop=0;skills.clearSkillStage(s);clearUniqueTransient(s);clearAncient(s);s.resultDelay=.5;return queueSettlement(s,true);
}
function queueSettlement(s,boss){
 if(s.settlement||!prepareStageCommit(s))return false;
 s.settlement={id:stageTransactionId(s),boss,dungeon:!!s.run.dungeonId,raid:!!s.run.raidId,rush:!!s.run.rush};s.run.flow='settling';if(boss)s.phase='playing';
 if(!s.durable)confirmSettlement(s,s.settlement.id);return true;
}
export function confirmSettlement(s,id){
 const pending=s.settlement;if(!pending||id!==pending.id)return false;
 s.settlement=null;finishStageJournal(s.profile);
 if(pending.boss){s.phase='victory';s.run.flow='complete';}else{
  const completedStage=s.run.stage,earned=s.run.stars,receipts=s.effects.filter(f=>['loot','gearDrop','levelUp','lootPickup','resourceCollect'].includes(f.type));
  s.run.stage++;prepareStage(s,true);s.effects.push(...receipts.slice(0,Math.max(0,399-s.effects.length)));effect(s,'stageClear',{chapterId:s.stageId,stage:completedStage,stars:earned?.earned??0,gained:earned?.gained??0},1.6);
 }
 return true;
}
function finishFailedStage(s){
 const strict=cancelStageJournal(s);if(strict){const hp=s.player.hp;s.profile.equipment=restoreEquipment(s.profile.equipment,s.profile.inventory,s.profile.characterId);s.profile.favoriteItemIds=s.profile.favoriteItemIds.filter(id=>s.profile.inventory.some(i=>i.id===id));s.loadout=uniqueLoadout(s.profile);s.buildEffects=buildEffects(s.profile);s.synergies=equipmentSynergies(s.profile);refreshStats(s,false);if(!hp)s.player.hp=0;s.pickups.length=0;s.lastLoot=null;}
 return strict;
}

function takeEffectBudget(s){if(s.effectBudget<=0){s.run.procBudgetDropped=(s.run.procBudgetDropped??0)+1;return false;}s.effectBudget--;s.run.maxProcsPerFrame=Math.max(s.run.maxProcsPerFrame??0,50-s.effectBudget);return true;}
const inscriptionSpeed=s=>s.inscriptionState.furyUntil>s.run.time?1+s.inscriptionState.furyPower:1;
function inscriptionHit(s,e,amount,power,origin){
 if(!power||s.phase!=='playing'||s.settlement)return;
 const base=playerStats(s.profile).damage;
 if(power.leech&&takeEffectBudget(s))s.player.hp=Math.min(s.player.maxHp,s.player.hp+amount*Math.min(BUILD_EFFECTS.leech.cap,BUILD_EFFECTS.leech.ratio*power.leech));
 if(e.hp>0&&power.bleed&&takeEffectBudget(s)){e.runeBleedStacks=Math.min(BUILD_EFFECTS.bleed.stacks,(e.runeBleedStacks??0)+1);e.runeBleedDamage=Math.max(e.runeBleedDamage??0,base*BUILD_EFFECTS.bleed.damage*power.bleed);e.runeBleedTime=BUILD_EFFECTS.bleed.duration;e.runeBleedTimer??=1;}
 if(e.hp>0&&power.shred&&takeEffectBudget(s)){e.runeShred=Math.max(e.runeShred??0,Math.min(BUILD_EFFECTS.shred.cap,BUILD_EFFECTS.shred.reduction*power.shred));e.runeShredTime=BUILD_EFFECTS.shred.duration;}
 if(power.chain){const r=BUILD_EFFECTS.chain,stamp=s.nextId++;for(let i=0;i<Math.min(r.targetCap,r.targets*power.chain);i++){let target=null,best=r.radius;for(const q of s.enemies){if(q===e||!eligible(s,q)||q.chainStamp===stamp)continue;const d=length(q.x-e.x,q.y-e.y);if(d<best){target=q;best=d;}}if(!target||!takeEffectBudget(s))break;target.chainStamp=stamp;effect(s,'uniqueLink',{uniqueId:'storm',x:e.x,y:e.y,tx:target.x,ty:target.y},.4);damageEnemy(s,target,base*r.damage*power.chain,false,'inscription',origin);if(s.phase!=='playing'||s.settlement)break;}}
}
function inscriptionKill(s,e,power,explode){
 if(power?.fury&&takeEffectBudget(s)){s.inscriptionState.furyPower=Math.max(s.inscriptionState.furyUntil>s.run.time?s.inscriptionState.furyPower:0,BUILD_EFFECTS.fury.speed*power.fury);s.inscriptionState.furyUntil=s.run.time+BUILD_EFFECTS.fury.duration;}
 if(!explode||!power?.explosion||s.phase!=='playing'||s.settlement)return;const r=BUILD_EFFECTS.explosion,base=playerStats(s.profile).damage;effect(s,'explosion',{x:e.x,y:e.y,radius:r.radius},.5);
 for(const q of s.enemies)if(q!==e&&eligible(s,q)&&length(q.x-e.x,q.y-e.y)<=r.radius){if(!takeEffectBudget(s))break;damageEnemy(s,q,base*r.damage*power.explosion,false,'inscription',e);if(s.phase!=='playing'||s.settlement)break;}
}
function updateInscriptionStatus(s,e,dt){
 e.runeShredTime=Math.max(0,(e.runeShredTime??0)-dt);if(!e.runeShredTime)e.runeShred=0;
 if(!(e.runeBleedTime>0))return;const used=Math.min(dt,e.runeBleedTime);e.runeBleedTime=Math.max(0,e.runeBleedTime-dt);e.runeBleedTimer-=used;
 if(e.runeBleedTimer<=1e-9&&takeEffectBudget(s)){e.runeBleedTimer+=1;const amount=Math.min(e.hp,e.runeBleedDamage*e.runeBleedStacks);e.hp-=amount;effect(s,'damage',{x:e.x,y:e.y-70,value:Math.round(amount),status:'bleed'},.65);if(e.hp<=0)kill(s,e,s.buildEffects,false);}
 if(!e.runeBleedTime){e.runeBleedStacks=0;e.runeBleedDamage=0;e.runeBleedTimer=1;}
}
function inscriptionCounter(s,source){
 const n=s.buildEffects.counter;if(!n||!source||random(s)>=Math.min(1,BUILD_EFFECTS.counter.chance*n)||!takeEffectBudget(s))return;let target=null,best=BUILD_EFFECTS.counter.radius;
 for(const e of s.enemies){if(!eligible(s,e))continue;const d=length(e.x-s.player.x,e.y-s.player.y);if(d<best){target=e;best=d;}}if(target)damageEnemy(s,target,playerStats(s.profile).damage*BUILD_EFFECTS.counter.damage*n,false,'inscription');
}
function updateBossRule(s,e,dt){
 if(s.run.flow!=='combat')return;
 const rule=ruleOf(s);
 if(s.run.raidId){raidRule(s,e,dt,raidDefinition(s.run.raidId));return;}
 if(rule==='regen'){e.recoveryClock=(e.recoveryClock??0)+dt;if(e.recoveryClock>=8){e.recoveryClock-=8;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.02);effect(s,'unique',{uniqueId:'recovery',x:e.x,y:e.y,radius:100},.6);}}
 // Fire: 4 of every 12 seconds the boss burns hotter (contact and volley damage +50%).
 if(rule==='fury'){const active=s.run.time%12>=8;e.baseDamage??=e.damage;e.furyScale=active?1.5:1;e.damage=e.baseDamage*e.furyScale;if(active!==!!e.furyActive){e.furyActive=active;if(active)effect(s,'bossRage',{x:e.x,y:e.y},.8);}}
 // Frost bosses and every special boss (chapters 10/20/30) call escorts at 70% and 35%.
 if(rule==='summon'||e.special){const phase=e.hp/e.maxHp<=.35?2:e.hp/e.maxHp<=.7?1:0;if(phase>(e.summonPhase??0)){e.summonPhase=phase;for(let i=0;i<(e.special?4:3)&&s.enemies.filter(q=>!q.dead).length<MAX_ACTIVE_ENEMIES;i++){const add=spawnEnemy(s,'skitter',clamp(e.x+(i-1.5)*90,s.bounds.padding,s.bounds.width-s.bounds.padding),clamp(e.y+140,s.bounds.padding,s.bounds.height-s.bounds.padding));add.objective=false;add.aggro=true;}effect(s,'bossRage',{x:e.x,y:e.y},1.2);}}
}
// Raid patterns (Alpha 0.123). 강철 거신's armor is e.plate (damageEnemy); the queen calls a brood that shields her;
// the judge's judgement is unavoidable (only real invulnerability, shields, reduction and health answer it).
function raidRule(s,e,dt,r){
 if(r.mechanic==='swarm'){e.broodClock=(e.broodClock??r.broodEvery-3)+dt;if(e.broodClock>=r.broodEvery){e.broodClock-=r.broodEvery;
  for(let i=0;i<r.broodSize&&s.enemies.filter(q=>!q.dead).length<MAX_ACTIVE_ENEMIES;i++){const a=i/r.broodSize*Math.PI*2,add=spawnEnemy(s,i%3===2?'spitter':'skitter',clamp(e.x+Math.cos(a)*170,s.bounds.padding,s.bounds.width-s.bounds.padding),clamp(e.y+Math.sin(a)*120,s.bounds.padding,s.bounds.height-s.bounds.padding));add.objective=false;add.aggro=true;add.raidBrood=true;const scale=raidScale(stageOf(s).id);add.hp=add.maxHp=Math.round(add.maxHp*r.broodHp*scale);add.damage*=scale;}
  effect(s,'bossRage',{x:e.x,y:e.y},1.2);}}
 if(r.mechanic==='judgement'){e.judgeClock=(e.judgeClock??0)+dt;const warn=e.judgeClock>=r.judgementEvery-r.judgementWarning;
  if(warn&&!e.judgeWarning){e.judgeWarning=true;effect(s,'bossRage',{x:e.x,y:e.y},r.judgementWarning);}
  if(e.judgeClock>=r.judgementEvery){e.judgeClock-=r.judgementEvery;e.judgeWarning=false;const p=s.player,count=e.judgements??0;e.judgements=count+1;
   // Post-hit and dash frames do not dodge it; real invulnerability (ancient powers, last stand) does.
   if(p.invulnerable<=.45)p.invulnerable=0;effect(s,'explosion',{x:p.x,y:p.y,radius:240},.6);hurtPlayer(s,p.maxHp*r.judgementDamage*(1+r.judgementGrowth*count),null);}}
}
export function raidBroodAlive(s){return s.enemies.some(q=>q.raidBrood&&!q.dead);}
export function bossRuleStatus(s){const e=s.enemies.find(e=>e.boss&&!e.dead);if(!e)return '';
 if(s.run.raidId){const r=raidDefinition(s.run.raidId);
  if(r.mechanic==='armor')return e.plateBrokenUntil>s.run.time?'장갑 파괴 · '+Math.ceil(e.plateBrokenUntil-s.run.time)+'초':'강철 장갑 · 피해 '+Math.round(r.armor*100)+'% 차단';
  if(r.mechanic==='swarm')return raidBroodAlive(s)?'군단의 가호 · 피해 '+Math.round(r.broodShield*100)+'% 감소':'군단 소환까지 '+Math.max(1,Math.ceil(r.broodEvery-(e.broodClock??r.broodEvery-3)))+'초';
  return (e.judgeWarning?'심판 임박':'심판까지 '+Math.max(1,Math.ceil(r.judgementEvery-(e.judgeClock??0)))+'초')+' · '+(e.judgements??0)+'회 · 위력 +'+Math.round(r.judgementGrowth*(e.judgements??0)*100)+'%';}
const rule=ruleOf(s),escort=e.special&&rule!=='summon'?' · 호위 '+(e.summonPhase??0)+'/2':'',prefix=e.special?'특수 보스 · ':'';
 if(rule==='regen')return prefix+'재생 · '+Math.ceil(8-(e.recoveryClock??0))+'초'+escort;
 if(rule==='defense'){const shred=e.runeShredTime>0?e.runeShred:0;return prefix+(s.run.time%12<8?'방어 태세 · 피해 '+Math.round((stanceGuard(s)-shred)*100)+'% 감소'+(shred?' · 약화 '+Math.round(shred*100)+'%p':''):'약점 노출 · 피해 50% 증가')+escort;}
 if(rule==='fury')return prefix+(s.run.time%12>=8?'화염 폭주 · 공격력 50% 증가':'폭주까지 '+Math.ceil(8-s.run.time%12)+'초')+escort;
 return prefix+'호위 소환 '+(e.summonPhase??0)+'/2';}
