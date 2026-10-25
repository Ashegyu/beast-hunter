// Alpha 0.128 측정: 0.125~0.127 추가 요소(갈래 A/B, 괴수 기술 극, 레이드 고대 착용 효과 위력 67/120%, 장비 기술 끈 착용)를 레이드 3종 × 예시 빌드 4종으로 비교.
// Raid benchmark with 0.125~0.127 additions. Usage: node raidvar127.mjs <dist> <profile> <variant> [seeds]
// variant: base | branchA | branchB | beast3 | gear67 | gear120 | all
import fs from 'node:fs';
const D=process.argv[2];const g=await import(D+'/game-engine.js');const L=await import(D+'/loot.js?v=0.128.0');
const raw=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));const V=process.argv[4];const SEEDS=Number(process.argv[5]||3);const now=Date.UTC(2026,9,26,3);
let rs=11;const rng=()=>{rs=(Math.imul(1664525,rs)+1013904223)>>>0;return rs/4294967296;};
function gear(p,power,raidId){let id=Math.max(0,...p.inventory.map(i=>i.id))+1;for(const slot of ['weapon','helmet','armor','charm','special']){const it={...L.rollAncient({id:id++,tier:6,slot,raid:raidId},.5,rng),powerRoll:power};p.inventory.push(it);p.equipment[slot]=it.id;}}
const out=[];
for(const raid of g.RAIDS){const row=[raid.name];
 for(const [bi,b] of g.SKILL_BUILD_EXAMPLES.entries()){let wins=0,left=0,time=0;
  for(let seed=0;seed<SEEDS;seed++){const p=g.restoreProfile(raw,1000);p.hunts+=seed*13;p.clearedStage=60;
   for(const k of Object.keys(p.skillBook.ranks))p.skillBook.ranks[k]=0;for(const id of [...b.active,...b.passive,...b.ultimate])p.skillBook.ranks[id]=4;
   if(V==='gear67'||V==='gear120'||V==='all'||V==='gear67ns')gear(p,V==='gear120'?120:67,raid.id);
   const s=g.createGame(p);g.applySkillExample(s,bi);
   if(V==='branchA'||V==='branchB'||V==='all')for(const id of [...b.active,...b.ultimate]){const i=V==='branchB'?1:0;p.skillBook.branchOwned[id]=1<<i;p.skillBook.branchPick[id]=i;}
   if(V==='beast3'||V==='all'){p.beastSkills={'beast-sungod':3};p.skillBook.loadout.beast=['beast-sungod'];}
   if(!g.launchRaid(s,raid.id,now)){row.push('nolaunch');continue;}
   if(V==='gear67ns')s.gearCache={equipment:p.equipment,count:p.inventory.length,list:[]};
   for(let i=0;i<3000&&s.phase==='playing';i++)g.advanceGame(s,.05);
   const boss=s.enemies.find(e=>e.boss);if(s.phase==='victory'||s.settlement)wins++;left+=boss&&!boss.dead?boss.hp/boss.maxHp:0;time+=s.run.time;}
  row.push(`${b.name} ${wins}/${SEEDS} ${Math.round(left/SEEDS*100)}% ${Math.round(time/SEEDS)}s`);}
 out.push(row.join(' | '));}
console.log('== '+V+' '+process.argv[3].split('/').pop());console.log(out.join('\n'));
