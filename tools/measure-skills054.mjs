import * as g from '../dist/game-engine.js';
import fs from 'node:fs';
const results=[];
for(const [index,example]of g.SKILL_BUILD_EXAMPLES.entries()){
 const p=g.createProfile(1);p.level=50;p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[5,5,5];p.forge={blade:2,armor:2,core:1};p.skills.drain=1;p.skillBook=g.restoreSkillBook(null,50);
 const s=g.createGame(p);g.applySkillExample(s,index);p.skillBook.auto.mode=['boss','farm','safe','balanced'][index];for(const id of [...p.skillBook.loadout.active,...p.skillBook.loadout.passive])if(id)p.skillBook.ranks[id]=4;
 g.launch(s,3,5);s.auto=true;const t=performance.now();let steps=0;while(s.phase==='playing'&&steps<24000){g.advanceGame(s,.025);steps++;}results.push({build:example.name,phase:s.phase,simulationSeconds:+s.run.time.toFixed(2),steps,cpuMs:+(performance.now()-t).toFixed(2),hp:+s.player.hp.toFixed(1),maxHp:s.player.maxHp,kills:s.run.kills,ultimateCooldown:+(s.skillRuntime.cooldowns[p.skillBook.loadout.ultimate[0]]??0).toFixed(1)});
}
fs.writeFileSync(new URL('reports/skills054-simulation.json',import.meta.url),JSON.stringify({scope:'Headless production engine, one deterministic frost boss run per build; no browser, GPU, device or statistical balance claim.',results},null,2)+'\n');console.log(JSON.stringify(results));
