// Production engine simulations; no browser, device timing, or manual-play claim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {waveComposition} from '../dist/battle-plans.js';
function prepare(s,route){
 const p=s.profile;
 for(const slot of ['weapon','armor','charm']){const rows=p.inventory.filter(i=>i.slot===slot).sort((a,b)=>(b.affixes.damage??b.affixes.hp??0)-(a.affixes.damage??a.affixes.hp??0));if(rows[0])g.equipItem(s,rows[0].id);}
 const order=route===2?['guard','haste','drain','edge','chain','magnet']:['edge','drain','haste','guard','chain','magnet'];
 for(const id of order)while(g.chooseUpgrade(s,id)){}
 for(const id of ['blade','armor','core'])g.upgradeForge(s,id);
 if(route>0)g.applySkillExample(s,route===1?1:2);
 if(g.skillRank(p,'bloodmoon')&&!p.skillBook.loadout.ultimate[0])g.equipSkill(s,'bloodmoon',0);
 for(const id of [...p.skillBook.loadout.active,...p.skillBook.loadout.passive])if(id)while(g.upgradeSkill(s,id)){}
 p.skillBook.auto.mode=route===1?'farm':route===2?'safe':'balanced';
}
const encounters=g.BATTLE_PLANS.map(p=>({stage:p.id,name:p.name,formation:p.formation,waves:p.waves.map((_,i)=>waveComposition(p.id,i+1).length),interval:p.interval,boss:!!p.boss}));
const expectedKills=encounters.reduce((a,p)=>a+p.waves.reduce((n,v)=>n+v,0),0),runs=[];
for(const route of [0,1,2])for(const seed of [0,4,9]){
 const p=g.createProfile(1000);p.hunts=seed;const s=g.createGame(p);s.auto=true;const chapters=[];let unlock=null;
 for(let chapter=1;chapter<=3;chapter++){
  prepare(s,route);assert.ok(g.launch(s,chapter));const seen=new Set();const peak={live:0,actors:0,shots:0,effects:0,pickups:0,pending:0};let frames=0;
  while(s.phase==='playing'&&frames++<24000){
   g.advanceGame(s,.05);for(const e of s.enemies)seen.add(e.species);const live=s.enemies.filter(e=>!e.dead).length;
   peak.live=Math.max(peak.live,live);peak.actors=Math.max(peak.actors,s.enemies.length);peak.shots=Math.max(peak.shots,s.projectiles.length);peak.effects=Math.max(peak.effects,s.effects.length);peak.pickups=Math.max(peak.pickups,s.pickups.length);peak.pending=Math.max(peak.pending,s.spawns.length);
   if(!unlock&&p.level>=20)unlock={chapter,stage:s.run.stage,time:+s.run.time.toFixed(2)};
   if(s.run.stage===10){assert.ok(s.enemies.every(e=>e.boss));assert.ok(s.spawns.every(q=>q.boss));assert.equal(s.barrels.length,0);assert.equal(s.run.wave,1);}
   assert.ok(live<=18);
  }
  chapters.push({chapter,phase:s.phase,stage:s.run.stage,level:p.level,time:+s.run.time.toFixed(2),kills:s.run.kills,rooms:s.run.rooms,hp:+s.player.hp.toFixed(1),maxHp:s.player.maxHp,species:[...seen].sort(),peak});
  if(s.phase!=='victory')break;assert.equal(s.run.kills,expectedKills);assert.equal(s.run.rooms,10);g.returnToCamp(s);
 }
 const row={route:['balanced','farm','safe'][route],seed,unlock,chapters};runs.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync(new URL('../art/quality065/campaign.json',import.meta.url),JSON.stringify({scope:'Nine deterministic engine-driven automatic campaigns, real earned gear and camp budgets only. Not browser rendering, device FPS, player playtime, or a statistical balance survey.',encounters,expectedKills,runs},null,2)+'\n');
assert.ok(runs.every(r=>r.chapters.length===3&&r.chapters.every(c=>c.phase==='victory')));
