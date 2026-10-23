// Production rules, earned resources only. CPU timings exclude rendering/GPU/network.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import * as g from '../dist/game-engine.js';
import {createBackup,readBackup} from '../dist/profile-backup.js';
const out=new URL('../art/stability083/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const round=n=>+n.toFixed(3),summary=values=>{const a=[...values].sort((a,b)=>a-b);return {samples:a.length,p95:round(a[Math.floor(a.length*.95)]??0),p99:round(a[Math.floor(a.length*.99)]??0),max:round(a.at(-1)??0)};};
function prepare(s,route){
 const p=s.profile;
 for(const slot of ['weapon','armor','charm']){
  const rows=p.inventory.filter(i=>i.slot===slot).sort((a,b)=>(b.affixes.damage??b.affixes.hp??0)-(a.affixes.damage??a.affixes.hp??0));
  if(rows[0])g.equipItem(s,rows[0].id);
 }
 for(const id of route===2?['guard','haste','drain','edge','chain','magnet']:['edge','drain','haste','guard','chain','magnet'])while(g.chooseUpgrade(s,id)){}
 for(const id of ['blade','armor','core'])g.upgradeForge(s,id);
 if(route>0)g.applySkillExample(s,route===1?1:2);
 if(g.skillRank(p,'bloodmoon')&&!p.skillBook.loadout.ultimate[0])g.equipSkill(s,'bloodmoon',0);
 for(const id of [...p.skillBook.loadout.active,...p.skillBook.loadout.passive])if(id)while(g.upgradeSkill(s,id)){}
 p.skillBook.auto.mode=['balanced','farm','safe'][route];
}
function assertStableSave(p){
 const before=g.encodeProfile(p,1000000),r=g.restoreProfile(before,1000000),again=g.restoreProfile(g.encodeProfile(r,1000000),1000000);
 assert.deepEqual(again,r,'reload cannot pay reserved resources twice');
 const backup=readBackup(createBackup(p,1000000),1000000).profile;
 assert.deepEqual(backup,r,'file restore and native restore agree');assert.equal(g.encodeProfile(p,1000000),before,'backup cannot mutate the live profile');
}
const plans=g.BATTLE_PLANS.map(p=>({stage:p.id,seconds:p.timeLimit,monsters:p.waves.reduce((a,w)=>a+w.skitter+w.spitter+w.bulwark,0),bossOnly:!!p.boss}));
const expectedKills=plans.reduce((a,p)=>a+p.monsters,0),runs=[],checkpointRuns=[];
for(const route of [0,1,2])for(const seed of [0,4,9]){
 const p=g.createProfile(1000);p.hunts=seed;const s=g.createGame(p);s.auto=true;const chapters=[];let level20=null,firstFullBag=null;
 for(let chapter=1;chapter<=3;chapter++){
  prepare(s,route);assert.ok(g.launch(s,chapter));const stages=[],peak={live:0,actors:0,shots:0,effects:0,pickups:0},cpu=[];let stage=0;
  for(let frame=0;frame<24000&&s.phase==='playing';frame++){
   if(s.run.stage!==stage){stage=s.run.stage;assert.equal(s.run.timeLimit,60);stages.push({stage,start:round(s.run.time),level:p.level});}
   const began=performance.now();g.advanceGame(s,.05);cpu.push(performance.now()-began);
   const live=s.enemies.filter(e=>!e.dead).length;peak.live=Math.max(peak.live,live);peak.actors=Math.max(peak.actors,s.enemies.length);peak.shots=Math.max(peak.shots,s.projectiles.length);peak.effects=Math.max(peak.effects,s.effects.length);peak.pickups=Math.max(peak.pickups,s.pickups.length);
   assert.ok(live<=g.MAX_ACTIVE_ENEMIES);assert.ok(s.projectiles.length<=64);
   if(!level20&&p.level>=20)level20={chapter,stage:s.run.stage,time:round(s.run.time)};
   if(!firstFullBag&&p.inventory.length===g.INVENTORY_LIMIT)firstFullBag={chapter,stage:s.run.stage,time:round(s.run.time)};
   if(s.run.stage===10){assert.ok(s.enemies.every(e=>e.boss));assert.ok(s.spawns.every(e=>e.boss));assert.equal(s.barrels.length,0);assert.equal(s.run.wave,1);}
  }
  assert.notEqual(s.phase,'playing','bounded campaign simulation must finish');assertStableSave(p);
  const items=s.run.lootLedger,qualities=Array(7).fill(0);for(const item of items)qualities[item.rarity]++;
  chapters.push({chapter,phase:s.phase,timedOut:s.run.timedOut,stage:s.run.stage,level:p.level,seconds:round(s.run.time),kills:s.run.kills,rooms:s.run.rooms,hp:round(s.player.hp),maxHp:s.player.maxHp,items:s.run.items,monsterItems:s.run.monsterItems,autoSalvaged:s.run.autoSalvaged,qualities,perfect:items.filter(i=>i.perfect).length,gold:s.run.gold,cores:s.run.cores,materials:s.run.materials,peak,cpuMs:summary(cpu),stages});
  if(s.phase==='victory'){assert.equal(s.run.kills,expectedKills);assert.equal(s.run.rooms,10);assert.equal(p.stageProgress[chapter-1],10);}
  g.returnToCamp(s);const settled=g.encodeProfile(p,1000000);assert.equal(g.returnToCamp(s),false);assert.equal(g.encodeProfile(p,1000000),settled,'second return cannot pay rewards again');assertStableSave(p);
  if(chapters.at(-1).phase!=='victory')break;
 }
 const row={route:['balanced','farm','safe'][route],priorHunts:seed,level20,firstFullBag,chapters};runs.push(row);
 console.log(JSON.stringify({route:row.route,priorHunts:seed,chapters:chapters.map(c=>({chapter:c.chapter,phase:c.phase,stage:c.stage,level:c.level,seconds:c.seconds,items:c.items,autoSalvaged:c.autoSalvaged}))}));
 // Continue the same earned profile after a failed uninterrupted attempt.
 // Use real camp equipment/upgrade actions, then the persisted unlocked checkpoint.
 const retries=[];
 for(let chapter=p.clearedStage+1;chapter<=3;chapter++){
  for(let attempt=1;attempt<=5;attempt++){
   assert.equal(s.phase,'camp');prepare(s,route);assertStableSave(p);
   const checkpoint=g.stageLimit(p,chapter);assert.ok(g.launch(s,chapter,checkpoint));
   for(let frame=0;frame<24000&&s.phase==='playing';frame++){
    g.advanceGame(s,.05);assert.ok(s.enemies.filter(e=>!e.dead).length<=g.MAX_ACTIVE_ENEMIES);
    if(s.run.stage===10){assert.ok(s.enemies.every(e=>e.boss));assert.ok(s.spawns.every(e=>e.boss));}
   }
   assert.notEqual(s.phase,'playing');const won=s.phase==='victory';
   retries.push({chapter,attempt,startStage:checkpoint,endStage:s.run.stage,phase:s.phase,timedOut:s.run.timedOut,seconds:round(s.run.time),level:p.level,items:s.run.items,autoSalvaged:s.run.autoSalvaged});
   g.returnToCamp(s);assertStableSave(p);const saved=g.encodeProfile(p,1000000);assert.equal(g.returnToCamp(s),false);assert.equal(g.encodeProfile(p,1000000),saved);
   if(won)break;
  }
  if(p.clearedStage<chapter)break;
 }
 checkpointRuns.push({route:row.route,priorHunts:seed,clearedChapters:p.clearedStage,stageProgress:[...p.stageProgress],retries});
}
// A bounded density fixture. Invulnerability is used only for this stress probe.
const stressCpu=[];let stressPeak=0;
for(let pass=0;pass<4;pass++){
 const p=g.createProfile(1000);p.stageProgress[0]=9;const s=g.createGame(p);g.launch(s,1,9);s.barrels=[];s.player.invulnerable=999;
 for(let frame=0;frame<1000;frame++){
  const began=performance.now();g.advanceGame(s,.025);if(pass&&frame>200)stressCpu.push(performance.now()-began);
  stressPeak=Math.max(stressPeak,s.enemies.filter(e=>!e.dead).length);
 }
}
const report={version:'0.83.0',environment:'Work Linux '+process.version,scope:'Nine deterministic automatic campaigns using earned gear and camp budgets, no invulnerability. First uninterrupted attempts and subsequent checkpoint retries are reported separately. Density fixture alone uses invulnerability. Node engine CPU only; no browser, rendering, GPU, network time or human playtime.',plans,expectedKills,runs,checkpointRuns,stress:{peak:stressPeak,cpuMs:summary(stressCpu)}};
fs.writeFileSync(new URL('simulation.json',out),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({uninterruptedCompletions:runs.filter(r=>r.chapters.length===3&&r.chapters.every(c=>c.phase==='victory')).length,checkpointCompletions:checkpointRuns.filter(r=>r.clearedChapters===3).length,total:runs.length,stress:report.stress}));
