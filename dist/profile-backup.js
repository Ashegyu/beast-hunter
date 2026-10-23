import {SLOTS,EQUIPMENT_KEYS,itemSlotForPosition} from './equipment-slots.js?v=0.98.0';
import {encodeProfile,restoreProfile,INVENTORY_LIMIT} from './game-engine.js?v=0.99.0';

export const MAX_BACKUP_BYTES=262144;
const FORMAT='beast-hunter-backup',VERSION=1;
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
// Detect accidental file changes; this is not an anti-cheat signature.
function checksum(text){let value=2166136261;for(let i=0;i<text.length;i++){value^=text.charCodeAt(i);value=Math.imul(value,16777619);}return (value>>>0).toString(16).padStart(8,'0');}
function validProfile(p){
 if(!plain(p)||![8,9,10,11,12,13].includes(p.version)||!Number.isInteger(p.level)||p.level<1||p.level>50)return false;
 for(const key of ['gold','cores','xp','skillPoints','unlockedStage','clearedStage','totalKills','hunts','lastSeenAt'])if(!Number.isFinite(p[key])||p[key]<0)return false;
 if(!Array.isArray(p.inventory)||p.inventory.length>INVENTORY_LIMIT||!Array.isArray(p.stageProgress)||p.stageProgress.length!==3||!p.stageProgress.every(n=>Number.isInteger(n)&&n>=0&&n<=10))return false;
 if(p.version>=9&&(!Array.isArray(p.difficultyProgress)||p.difficultyProgress.length!==2||!p.difficultyProgress.every(row=>Array.isArray(row)&&row.length===3&&row.every(n=>Number.isInteger(n)&&n>=0&&n<=10))))return false;
 if(!plain(p.equipment)||!plain(p.skills)||!plain(p.forge)||!plain(p.skillBook)||!plain(p.materials))return false;
 const ids=new Set();for(const item of p.inventory){
  if(!plain(item)||!Number.isInteger(item.id)||item.id<1||ids.has(item.id)||!Object.hasOwn(SLOTS,item.slot)||!plain(item.affixes))return false;
  ids.add(item.id);
 }
 const worn=new Set();for(const slot of p.version>=11?EQUIPMENT_KEYS:['weapon','armor','charm']){const id=p.equipment[slot];if(id!==null&&(worn.has(id)||!p.inventory.some(item=>item.id===id&&item.slot===itemSlotForPosition(slot)&&(!(item.slot==='special')||item.characterId===(p.characterId??'lirian')))))return false;if(id!==null)worn.add(id);}
 return true;
}
export function createBackup(profile,now=Date.now()){
 if(!validProfile(profile))throw Error('현재 진행 기록을 백업할 수 없는 형식이야.');
 const payload=encodeProfile(profile,now),text=JSON.stringify({format:FORMAT,version:VERSION,createdAt:now,checksum:checksum(payload),payload});
 if(new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES)throw Error('백업 파일 크기가 제한을 넘었어.');
 return text;
}
export function readBackup(text,now=Date.now()){
 if(typeof text!=='string'||text.length>MAX_BACKUP_BYTES||new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES)throw Error('백업 파일은 256KB 이하여야 해.');
 let file;try{file=JSON.parse(text);}catch{throw Error('올바른 JSON 백업 파일이 아니야.');}
 if(!plain(file)||file.format!==FORMAT||file.version!==VERSION||typeof file.payload!=='string'||!Number.isFinite(file.createdAt))throw Error('괴수 사냥꾼에서 만든 백업 파일을 선택해줘.');
 if(file.checksum!==checksum(file.payload))throw Error('백업 내용이 손상되었어. 원래 백업 파일을 다시 선택해줘.');
 let raw;try{raw=JSON.parse(file.payload);}catch{throw Error('백업의 진행 기록을 읽을 수 없어.');}
 if(!validProfile(raw))throw Error('백업의 진행 기록 형식이 올바르지 않아.');
 const profile=restoreProfile(raw,now);
 return {profile,createdAt:file.createdAt};
}
