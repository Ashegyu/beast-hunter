import * as game from '../dist/game-engine.js';
// Isolate existing combat/render tests from the campaign scheduler. Actors still
// pass through the production spawn factory; campaign tests use no such fixture.
export function freezeCombat(s){
  s.spawns=['skitter','spitter','bulwark','bulwark'].map((type,i)=>({id:s.nextId++,type,boss:i===3,elite:false,x:750+i*180,y:1160,delay:0,warning:1}));
  game.advanceGame(s,.001);s.spawns.length=0;s.run.flow='break';s.run.timer=1e6;s.run.timeLimit=s.run.timeRemaining=1e6;s.run.bossSpawned=false;s.barrels.length=0;
  return s;
}
