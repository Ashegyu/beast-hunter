// Isolated CPU samples, excluding canvas/DOM/GPU and network. No device FPS claim.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import * as current from '../dist/game-engine.js';
const baselineSha='7eaaa5a7fcacbfe1d1b0aae87be65a01eaa99f3b';
const base=execFileSync('git',['show',baselineSha+':dist/game-engine.js'],{cwd:new URL('../',import.meta.url),encoding:'utf8'}).replace(/(['"])(\.\/[^'"]+)\1/g,(_,q,p)=>q+new URL('../dist/'+p.slice(2),import.meta.url).href+q);
const previous=await import('data:text/javascript;base64,'+Buffer.from(base).toString('base64'));
function arena(g,count,newSpecies=false){
 const s=g.createGame();g.launch(s);s.barrels=[];s.enemies=[];s.spawns=Array.from({length:count},(_,i)=>({id:s.nextId++,type:['skitter','spitter','bulwark'][i%3],species:newSpecies?['forest_spider','forest_mushroom','forest_devourer'][i%3]:undefined,boss:false,elite:i===0,delay:0,x:s.player.x+Math.cos(i/count*Math.PI*2)*250,y:s.player.y+Math.sin(i/count*Math.PI*2)*300}));
 g.advanceGame(s,.001);assert.equal(s.enemies.length,count);for(const e of s.enemies)e.hp=e.maxHp=1e9;s.run.flow='break';s.run.timer=1e9;s.player.invulnerable=1e9;s.auto=true;return s;
}
function sample(g,count,newSpecies){const s=arena(g,count,newSpecies);for(let i=0;i<1000;i++)g.advanceGame(s,.016);const t=performance.now();for(let i=0;i<10000;i++)g.advanceGame(s,.016);return +(1000*(performance.now()-t)/10000).toFixed(3);}
const rows=[];for(let repeat=0;repeat<7;repeat++)for(const [version,g,count,newSpecies]of [['0.64',previous,18,false],['0.65-base',current,18,false],['0.65-new',current,18,true]])rows.push({repeat,version,count,microsecondsPerStep:sample(g,count,newSpecies)});
const medians=[];for(const [version,count]of [['0.64',18],['0.65-base',18],['0.65-new',18]]){const values=rows.filter(r=>r.version===version&&r.count===count).map(r=>r.microsecondsPerStep).sort((a,b)=>a-b);medians.push({version,count,medianMicrosecondsPerStep:values[3]});}
const report={scope:'Seven isolated CPU samples per fixed crowd. 1,000 warmup + 10,000 engine steps, 16ms simulation step. Factory actors have large HP and an invulnerable assisted hunter to keep population stable; no campaign or gameplay-difficulty inference. Baseline engine imports unchanged production dependencies; encounter scheduling is intentionally disabled. Excludes DOM, canvas, GPU, assets and real device FPS.',baselineSha,medians,rows};
fs.writeFileSync(new URL('../art/quality065/cpu.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(medians));
