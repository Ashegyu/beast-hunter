import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validEquipmentSocket,equippedDesigns,snapshotDesigns} from '../dist/equipment-visuals.js';
import {EQUIPMENT_ART} from '../dist/chapters.js';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('dist/assets/manifest.json',root),'utf8'));

test('all authored player frames have finite reviewed sockets tied to unchanged source pixels',()=>{
  const report=JSON.parse(fs.readFileSync(new URL('tools/reports/equipment-sockets-alpha091.json',root),'utf8'));
  let count=0,hidden=0;
  for(const family of Object.values(manifest.directions.hunter))for(const id of Object.values(family)){
    const sockets=manifest.equipmentSockets[id];assert.equal(sockets.length,manifest.clips[id].frames.length);
    for(const socket of sockets){assert.ok(validEquipmentSocket(socket),id);count++;if(socket.weaponHidden)hidden++;}
  }
  assert.equal(count,170);assert.equal(hidden,3);assert.equal(report.frames.length,170);assert.ok(report.frames.every(f=>f.manuallyReviewed));
  for(const[name,hash]of Object.entries(report.sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('dist/assets/'+name,root))).digest('hex'),hash);
  const valid=manifest.equipmentSockets[manifest.directions.hunter.idle.s][0];
  for(const field of ['handX','handY','angle','bodyX','bodyY','tilt','side','bladeLength'])assert.equal(validEquipmentSocket({...valid,[field]:NaN}),false);
  assert.equal(validEquipmentSocket({...valid,bladeLength:0}),false);assert.equal(validEquipmentSocket(undefined),false);
});

test('equipment selection honors slot ownership, supports old artwork IDs and leaves authoritative data unchanged',()=>{
  const profile={inventory:EQUIPMENT_ART.map((a,i)=>({...a,id:i+1,artId:a.id})),equipment:{weapon:9,armor:11,charm:12}};
  const before=JSON.stringify(profile),designs=equippedDesigns(profile);
  assert.deepEqual(Object.values(designs).map(a=>a.id),['frost_blade','frost_armor','frost_charm']);assert.equal(JSON.stringify(profile),before);
  const snapshot=Object.fromEntries(Object.entries(profile.equipment).map(([slot,id])=>[slot,profile.inventory.find(item=>item.id===id)]));
  assert.deepEqual(snapshotDesigns(snapshot),designs);
  assert.equal(equippedDesigns({...profile,equipment:{weapon:11}}).weapon,null);
  assert.equal(equippedDesigns({inventory:[{id:1,slot:'weapon',tier:1}],equipment:{weapon:1}}).weapon.id,'forest_blade');
});
