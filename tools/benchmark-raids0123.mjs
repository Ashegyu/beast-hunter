// Alpha 0.123 raid balance: each raid × the four example builds (skill ranks moved to the build, as free respec allows).
// Usage: node tools/benchmark-raids0123.mjs <distDir> <encoded profile .json> [seeds]
import fs from 'node:fs';
const g=await import(process.argv[2]+'/game-engine.js');
const raw=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));const SEEDS=Number(process.argv[4]||4);const now=Date.UTC(2026,9,26,3);
const builds=g.SKILL_BUILD_EXAMPLES.map((b,i)=>({name:b.name,i}));
const out=[];
for(const raid of g.RAIDS){const row=[raid.name];
 for(const b of builds){let wins=0,left=0,time=0;
  for(let seed=0;seed<SEEDS;seed++){const p=g.restoreProfile(raw,1000);p.hunts+=seed*13;p.clearedStage=Math.max(p.clearedStage,30);
   const ex=g.SKILL_BUILD_EXAMPLES[b.i];for(const k of Object.keys(p.skillBook.ranks))p.skillBook.ranks[k]=0;for(const id of [...ex.active,...ex.passive,...ex.ultimate])p.skillBook.ranks[id]=4;
   const s=g.createGame(p);g.applySkillExample(s,b.i);if(!g.launchRaid(s,raid.id,now)){row.push('nolaunch');continue;}
   for(let i=0;i<3000&&s.phase==='playing';i++)g.advanceGame(s,.05);
   const boss=s.enemies.find(e=>e.boss);if(s.phase==='victory'||s.settlement)wins++;left+=boss?boss.hp/boss.maxHp:0;time+=s.run.time;}
  row.push(`${b.name} ${wins}/${SEEDS} 남은HP${Math.round(left/SEEDS*100)}% ${Math.round(time/SEEDS)}s`);}
 out.push(row.join(' | '));}
const p0=g.restoreProfile(raw,1000);console.log('profile Lv',p0.level,'ch',p0.unlockedStage);console.log(out.join('\n'));
