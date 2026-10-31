import {restoreEquipment} from './equipment-slots.js?v=0.148.12';
// A stage owns uncommitted rewards. The profile identity stays stable for the UI.
// Checkpoints are runtime-only; saves serialize the pre-stage state until settlement.
const journals=new WeakMap();
const REWARD_FIELDS=['stageStars','gold','cores','level','xp','transcendXp','training','transcendence','growthTree','skillBook','inventory','materials','pendingGold','pendingMaterials','pendingLoot','totalKills','lootPity','legendaryPity','discoveredAncients','stageProgress','difficultyProgress','bossMastery','clearedStage','unlockedStage','dungeonProgress','nightmareRecords','tower','rift','dungeonWeek','dummy'];
const PROGRESS_FIELDS=['stageStars','stageProgress','difficultyProgress','bossMastery','clearedStage','unlockedStage','dungeonProgress','nightmareRecords','tower','rift','dungeonWeek','dummy'];
const RUN_FIELDS=['gold','cores','xp','xpBonus','trainingGold','items','stageItems','monsterItems','autoSalvaged','materials'];
export const stageTransactionId=s=>s.run.battleId+':'+s.run.stage;
export function beginStageJournal(s){
 const strict=s.run.stageType!=='normal',checkpoint={};
 for(const key of strict?REWARD_FIELDS:PROGRESS_FIELDS)checkpoint[key]=structuredClone(s.profile[key]);
 const totals=Object.fromEntries(RUN_FIELDS.map(k=>[k,s.run[k]]));
 journals.set(s.profile,{strict,checkpoint,totals,lootLength:s.run.lootLedger.length,materialLedger:{...s.run.materialLedger},committing:false});
 s.profile.activeBattle={id:stageTransactionId(s),chapter:s.stageId,stage:s.run.stage,difficulty:s.difficulty,strict,...(s.run.dungeonId?{dungeon:s.run.dungeonId}:{} ),...(s.run.raidId?{raid:s.run.raidId}:{} )};
}
export function profileForSave(profile){
 const j=journals.get(profile);if(j?.committing)return j.candidate;
 if(!j?.strict)return profile;
 return {...profile,...j.checkpoint,equipment:restoreEquipment(profile.equipment,j.checkpoint.inventory,profile.characterId),favoriteItemIds:profile.favoriteItemIds.filter(id=>j.checkpoint.inventory.some(i=>i.id===id))};
}
export function strictBattle(profile){const j=journals.get(profile);return !!j?.strict&&!j.committing;}
export function cancelStageJournal(s){
 const j=journals.get(s.profile);if(j?.strict){
  for(const key of REWARD_FIELDS)s.profile[key]=j.checkpoint[key];
  for(const key of RUN_FIELDS)s.run[key]=j.totals[key];s.run.lootLedger.length=j.lootLength;s.run.materialLedger=j.materialLedger;
 }
 s.profile.activeBattle=null;journals.delete(s.profile);return !!j?.strict;
}
export function prepareStageCommit(s){
 const id=stageTransactionId(s);if(s.profile.settledBattleIds.includes(id))return false;
 const j=journals.get(s.profile);if(!j)return false;
 j.candidate=structuredClone(s.profile);j.candidate.settledBattleIds=[...s.profile.settledBattleIds.slice(-63),id];j.candidate.activeBattle=null;j.committing=true;
 // Published progression is visible only after the storage owner acknowledges.
 for(const key of PROGRESS_FIELDS)s.profile[key]=structuredClone(j.checkpoint[key]);
 return true;
}
export function finishStageJournal(profile){const j=journals.get(profile);if(j?.candidate)Object.assign(profile,j.candidate);journals.delete(profile);}

export function ownedAtStageStart(profile,id){const j=journals.get(profile);return !j?.strict||j.checkpoint.inventory.some(i=>i.id===id);}
