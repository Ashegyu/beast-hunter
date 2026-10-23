// Headless CPU/simulation measurement. No device FPS or GPU claim.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import * as current from '../dist/game-engine.js';
const base='ceb64aa5ac6a7ef16261b666453bddcecf55cfaf',root=new URL('../',import.meta.url),temp=fs.mkdtempSync(path.join(os.tmpdir(),'horde072-'));
fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
for(const file of fs.readdirSync(new URL('dist/',root)).filter(p=>p.endsWith('.js')))fs.copyFileSync(new URL('dist/'+file,root),path.join(temp,file));
for(const file of ['game-engine.js','battle-plans.js','combat-skills.js'])fs.writeFileSync(path.join(temp,file),execFileSync('git',['show',base+':dist/'+file]));
const previous=await import('file://'+path.join(temp,'game-engine.js'));
function measure(g){
 const result={cap:g.MAX_ACTIVE_ENEMIES,stageTotals:g.BATTLE_PLANS.map(p=>p.waves.reduce((n,w)=>n+w.skitter+w.spitter+w.bulwark,0)),campaign:[],stress:null};
 const s=g.createGame(g.createProfile(1000));s.auto=true;
 for(let chapter=1;chapter<=3;chapter++){
  g.launch(s,chapter);let peak=0,peakFX=0,peakShots=0;const cpu=[],stages=[];let previousStage=0;
  for(let i=0;i<24000&&s.phase==='playing';i++){
   const start=performance.now();g.advanceGame(s,.05);cpu.push(performance.now()-start);
   peak=Math.max(peak,s.enemies.filter(e=>!e.dead).length);peakFX=Math.max(peakFX,s.effects.length);peakShots=Math.max(peakShots,s.projectiles.length);
   if(s.run.stage!==previousStage){stages.push({stage:s.run.stage,level:s.profile.level});previousStage=s.run.stage;}
  }
  cpu.sort((a,b)=>a-b);result.campaign.push({chapter,phase:s.phase,timedOut:s.run.timedOut,kills:s.run.kills,level:s.profile.level,time:s.run.time,items:s.run.monsterItems,peak,peakFX,peakShots,p95:cpu[Math.floor(cpu.length*.95)],p99:cpu[Math.floor(cpu.length*.99)],max:cpu.at(-1),stages});
  g.returnToCamp(s);const sword=s.profile.inventory.find(i=>i.slot==='weapon');if(sword)g.equipItem(s,sword.id);for(const id of g.upgradeOptions(s))g.chooseUpgrade(s,id);for(const id of Object.keys(g.FORGE))g.upgradeForge(s,id);
 }
 // Fixed maximum hostile pack, all alive, player invulnerable. Repeated runs
 // avoid timing initialization as steady simulation work.
 const cpu=[];let peak=0;
 for(let pass=0;pass<4;pass++){
  const p=g.createProfile(1000);p.stageProgress[0]=9;const a=g.createGame(p);g.launch(a,1,9);a.barrels=[];a.player.invulnerable=999;
  for(let i=0;i<1000;i++){const start=performance.now();g.advanceGame(a,.025);if(pass&&i>200)cpu.push(performance.now()-start);peak=Math.max(peak,a.enemies.filter(e=>!e.dead).length);}
 }
 cpu.sort((a,b)=>a-b);result.stress={peak,p95:cpu[Math.floor(cpu.length*.95)],p99:cpu[Math.floor(cpu.length*.99)],max:cpu.at(-1),samples:cpu.length};return result;
}
try{
 measure(previous);measure(current);const report={baseline:base,environment:'Work Linux Node '+process.version,scope:'headless CPU, no rendering/GPU/device measurement',before:measure(previous),after:measure(current)};
 const out=new URL('art/quality072/',root);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(new URL('simulation.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
