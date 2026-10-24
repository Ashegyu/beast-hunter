import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackup,readBackup,MAX_BACKUP_BYTES} from '../dist/profile-backup.js';
import * as game from '../dist/game-engine.js';

test('native backup round trip retains progress, gear, skills and pity without mutating the source',()=>{
 const p=game.createProfile(1000);p.gold=12345;p.level=25;p.skillBook=game.restoreSkillBook(null,25);p.stageProgress[0]=7;p.legendaryPity=17;
 const row=game.ANCIENT_CATALOG[0];p.inventory=[{...row,id:1,catalogId:row.id,rarity:5,affixes:{...row.base}}];p.equipment.weapon=1;
 const before=JSON.stringify(p),text=createBackup(p,2000),r=readBackup(text,3000);
 assert.equal(JSON.stringify(p),before);assert.equal(r.createdAt,2000);assert.equal(r.profile.level,25);assert.equal(r.profile.gold,12345);assert.equal(r.profile.legendaryPity,17);assert.deepEqual(r.profile.stageProgress,game.STAGES.map((_,i)=>i?0:7));assert.equal(r.profile.inventory[0].catalogId,row.id);assert.equal(r.profile.equipment.weapon,1);assert.deepEqual(r.profile.skillBook,p.skillBook);
});
test('reserved resources are recovered once when a combat backup is restored',()=>{
 const p=game.createProfile(1000);p.gold=7;p.pendingGold=11;p.pendingMaterials.boneIron=5;
 const r=readBackup(createBackup(p,1000),2000).profile;assert.equal(r.gold,18);assert.equal(r.materials.boneIron,5);assert.equal(r.pendingGold,0);assert.equal(r.pendingMaterials.boneIron,0);
 const second=readBackup(createBackup(r,2000),3000).profile;assert.equal(second.gold,18);assert.equal(second.materials.boneIron,5);
});
test('unrelated, incomplete, oversized and damaged backup files are rejected',()=>{
 assert.throws(()=>readBackup('{}'),/백업 파일/);assert.throws(()=>readBackup('{'),/JSON/);assert.throws(()=>readBackup('x'.repeat(MAX_BACKUP_BYTES+1)),/256KB/);
 const f=JSON.parse(createBackup(game.createProfile(1000),1000));f.payload=f.payload.replace('"gold":0','"gold":99');assert.throws(()=>readBackup(JSON.stringify(f)),/손상/);
 const unsupported=JSON.parse(createBackup(game.createProfile(1000),1000));unsupported.version=99;assert.throws(()=>readBackup(JSON.stringify(unsupported)),/백업 파일/);
 const incomplete=game.createProfile(1000);delete incomplete.inventory;assert.throws(()=>readBackup(createBackup(incomplete,1000)),/형식/);
});
