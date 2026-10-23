// Headless deterministic production-engine scenarios, not device play testing.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),baseSha='523104af19aea2c4b43d998fa36a481d62dbd7ac';
const base=execFileSync('git',['show',baseSha+':dist/game-engine.js'],{cwd:root,encoding:'utf8'});
const resolve=text=>text.replace(/(['"])(\.\/[^'"]+)\1/g,(_,q,path)=>q+new URL('../dist/'+path.slice(2),import.meta.url).href+q);
const original=await import('data:text/javascript;base64,'+Buffer.from(resolve(base)).toString('base64'));
// One base XP unit uses the multiplier at the start of that unit. Batch to a
// band boundary; the final unit may carry at most multiplier-1 XP across it.
function candidateXp(p,value,early,middle){
 let remaining=Math.max(0,Math.floor(Number.isFinite(value)?value:0)),awarded=0,level=p.level,xp=p.xp;
 while(remaining>0&&level<50){
  const multiplier=level<5?1:level<20?early:level<40?middle:1,end=level<5?5:level<20?20:level<40?40:50;
  let need=-xp;for(let l=level;l<end;l++)need+=original.xpNeeded(l);
  const units=Math.min(remaining,Math.ceil(need/multiplier)),credit=units*multiplier;remaining-=units;awarded+=credit;xp+=credit;
  while(level<50&&xp>=original.xpNeeded(level)){xp-=original.xpNeeded(level);level++;}
 }
 return awarded+remaining;
}
globalThis.__paceCandidate=candidateXp;
async function moduleFor(early,middle){
 const text=base.replace('function gainXp(p,value){','function gainXp(p,value){value=globalThis.__paceCandidate(p,value,'+early+','+middle+');');
 return import('data:text/javascript;base64,'+Buffer.from(resolve(text)).toString('base64'));
}
function prepare(g,s,route){
 const p=s.profile;
 // Choose actual owned gear and spend actual budgets. No synthetic ranks.
 for(const slot of ['weapon','armor','charm']){
  const rows=p.inventory.filter(i=>i.slot===slot).sort((a,b)=>(b.affixes.damage??b.affixes.hp??0)-(a.affixes.damage??a.affixes.hp??0));if(rows[0])g.equipItem(s,rows[0].id);
 }
 const order=route===2?['guard','haste','drain','edge','chain','magnet']:['edge','drain','haste','guard','chain','magnet'];
 for(const id of order)while(g.chooseUpgrade(s,id)){}
 for(const id of ['blade','armor','core'])g.upgradeForge(s,id);
 if(route>0)g.applySkillExample(s,route===1?1:2);
 // Freshly opened ultimate is explicitly equipped at the chapter camp stop.
 if(g.skillRank(p,'bloodmoon')&&!p.skillBook.loadout.ultimate[0])g.equipSkill(s,'bloodmoon',0);
 const slots=p.skillBook.loadout;for(const id of [...slots.active,...slots.passive])if(id)while(g.upgradeSkill(s,id)){}
 p.skillBook.auto.mode=route===1?'farm':route===2?'safe':'balanced';
}
function run(g,route,seed){
 const p=g.createProfile(1000);p.hunts=seed;const s=g.createGame(p),chapters=[];s.auto=true;let unlock=null,firstUse=null,wall=0;
 for(let chapter=1;chapter<=3;chapter++){
  prepare(g,s,route);assert.ok(g.launch(s,chapter));let frames=0;
  while(s.phase==='playing'&&frames++<24000){
   g.advanceGame(s,.05);
   if(!unlock&&p.level>=20)unlock={chapter,stage:s.run.stage,time:+(wall+s.run.time).toFixed(2)};
   if(!firstUse&&(s.skillRuntime.cooldowns[p.skillBook.loadout.ultimate[0]]??0)>0)firstUse={chapter,stage:s.run.stage,time:+(wall+s.run.time).toFixed(2)};
  }
  chapters.push({chapter,phase:s.phase,level:p.level,xp:p.xp,baseRunXp:s.run.xp,time:+s.run.time.toFixed(2),kills:s.run.kills,hp:+s.player.hp.toFixed(1),maxHp:s.player.maxHp});wall+=s.run.time;
  if(s.phase!=='victory')break;g.returnToCamp(s);
 }
 return {route:['balanced','farm','safe'][route],seed,chapters,unlock,firstUse};
}
const candidates=[];
for(const [early,middle]of [[1,1],[2,2],[3,2],[4,2]]){
 const g=early===1?original:await moduleFor(early,middle),runs=[];
 for(const route of [0,1,2])for(const seed of [0,4,9])runs.push(run(g,route,seed));
 candidates.push({early,middle,runs});
 console.log(JSON.stringify({early,middle,complete:runs.filter(r=>r.chapters.length===3&&r.chapters[2].phase==='victory').length,unlockChapters:runs.map(r=>r.unlock?.chapter??null),useChapters:runs.map(r=>r.firstUse?.chapter??null),endLevels:runs.map(r=>r.chapters.at(-1).level)}));
}
delete globalThis.__paceCandidate;
fs.writeFileSync(new URL('../art/quality063/candidates.json',import.meta.url),JSON.stringify({scope:'Three camp preparation policies × three deterministic starting seeds × four candidates. Engine-driven simulated time, not real playtime or statistical coverage.',baselineSha:baseSha,candidates},null,2)+'\n');
const production=await import('../dist/game-engine.js'),actual=[];
for(const route of [0,1,2])for(const seed of [0,4,9])actual.push(run(production,route,seed));
const stripXp=rows=>rows.map(r=>({...r,chapters:r.chapters.map(({baseRunXp,...chapter})=>chapter)}));
assert.deepEqual(stripXp(actual),stripXp(candidates.find(c=>c.early===4).runs));
const repeats=[];
for(const route of [0,1,2]){
 const p=production.createProfile(1000);p.level=20;p.skillBook=production.restoreSkillBook(null,20);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[5,5,5];p.bossMastery=[2,2,2];p.gold=3000;
 const s=production.createGame(p);s.auto=true;let seconds=0,failed=0;const gates={20:{hunts:0,seconds:0}};
 for(let hunt=1;hunt<=240&&p.level<40;hunt++){
  prepare(production,s,route);assert.ok(production.launch(s,3,5));let frames=0;
  while(s.phase==='playing'&&frames++<24000)production.advanceGame(s,.05);
  seconds+=s.run.time;if(s.phase!=='victory')failed++;
  for(const level of [30,40])if(p.level>=level&&!gates[level])gates[level]={hunts:hunt,seconds:+seconds.toFixed(2)};
  production.returnToCamp(s);
 }
 repeats.push({route:['balanced','farm','safe'][route],failed,endLevel:p.level,gates});
}
fs.writeFileSync(new URL('../art/quality063/production.json',import.meta.url),JSON.stringify({scope:'Production matches selected candidate for measured simulation fields; XP result totals now include the growth bonus. Replays start from a synthetic level20/campaign-complete profile, one deterministic path per policy; not player timing or balance distribution.',actual,repeats},null,2)+'\n');
console.log(JSON.stringify({productionMatchesSelected:true,repeats}));
