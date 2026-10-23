import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as g from '../dist/game-engine.js';
import {clearSkillStage} from '../dist/combat-skills.js';
const profile=(level=50)=>{const p=g.createProfile();p.level=level;p.skillBook=g.restoreSkillBook(null,level);return p;};
function fixture(id,rank=1){const p=profile(),d=g.SKILL_BY_ID[id];p.skillBook.loadout={active:[null,null],passive:[null,null,null],ultimate:[null]};p.skillBook.loadout[d.kind][0]=id;if(d.kind!=='ultimate')p.skillBook.ranks[id]=rank-1;const s=g.createGame(p);g.launch(s);s.spawns=[{id:800,type:'bulwark',x:s.player.x,y:s.player.y+110,delay:0,warning:1}];g.advanceGame(s,.001);s.spawns=[];s.barrels=[];s.player.invulnerable=100;const e=s.enemies[0];e.hp=e.maxHp=100000;e.guard=0;e.guardMax=0;e.cooldown=1000;e.speed=0;return {s,p,e};}
const run=(s,seconds)=>{for(let t=0;t<seconds;t+=.025)g.advanceGame(s,.025);};
test('35 definitions have unique images, complete rank values and reachable level gates',()=>{
 assert.deepEqual(['active','passive','ultimate'].map(k=>g.SKILL_CATALOG.filter(d=>d.kind===k).length),[16,16,3]);assert.equal(new Set(g.SKILL_CATALOG.map(d=>d.id)).size,35);
 for(const d of g.SKILL_CATALOG){assert.ok(fs.existsSync(new URL('../dist/'+d.icon,import.meta.url)),d.id);const bytes=fs.readFileSync(new URL('../dist/'+d.icon,import.meta.url));assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(d.description.length>10);let last=0;for(let rank=1;rank<=5;rank++){const gate=g.skillLevelGate(d.id,rank);assert.ok(gate>=last&&gate<=50,d.id);last=gate;assert.ok(g.skillNumbers(profile(),d.id,rank).length>1);}}
});
test('restore preserves legacy progress and repairs hostile allocations, identities, duplicates and over-spend',()=>{
 const p=profile(10);p.gold=223;p.skills.edge=2;p.skillPoints=3;p.skillBook.ranks=Object.fromEntries(g.SKILL_CATALOG.map(d=>[d.id,999]));p.skillBook.loadout={active:['bloodblade','crescent'],passive:['breath','breath','reserve'],ultimate:['eclipse']};p.skillBook.presets=[{active:['__proto__','crescent'],passive:['resolve'],ultimate:['eclipse']}];
 const q=g.restoreProfile(g.encodeProfile(p));assert.equal(q.gold,223);assert.equal(q.skills.edge,2);assert.equal(q.skillPoints,3);assert.ok(g.skillPoints(q)>=0);assert.equal(q.skillBook.ranks.bloodblade,undefined);assert.deepEqual(q.skillBook.loadout.active,[null,'crescent']);assert.deepEqual(q.skillBook.loadout.passive,['breath',null,null]);assert.deepEqual(q.skillBook.loadout.ultimate,[null]);assert.deepEqual(q.skillBook.presets[0].active,[null,'crescent']);
 const old={...p};delete old.skillBook;const legacy=g.restoreProfile(old);assert.equal(legacy.gold,p.gold);assert.equal(legacy.skillBook.loadout.active[0],'crescent');
});
test('unlock, rank, camp-only edits, swap, reset and presets use separate training budget',()=>{
 const p=profile(4),s=g.createGame(p);assert.equal(g.skillRank(p,'gale'),0);assert.equal(g.equipSkill(s,'gale',0),false);assert.equal(g.upgradeSkill(s,'crescent'),true);assert.equal(g.upgradeSkill(s,'crescent'),false);assert.equal(g.skillPoints(p),2);assert.equal(p.skillPoints,0);
 assert.ok(g.skillPreset(s,0,'save'));assert.ok(g.equipSkill(s,'seeking',0));assert.ok(g.skillPreset(s,0,'load'));assert.equal(p.skillBook.loadout.active[0],'crescent');assert.ok(g.resetSkills(s));assert.equal(g.skillPoints(p),3);g.launch(s);const before=g.encodeProfile(p,1);assert.equal(g.equipSkill(s,'seeking',0),false);assert.equal(g.upgradeSkill(s,'crescent'),false);assert.equal(g.resetSkills(s),false);assert.equal(g.skillPreset(s,0,'load'),false);assert.equal(g.encodeProfile(p,1),before);
});
test('level milestones match actual slot boundaries, include ultimates and awakening, and do not mutate builds',()=>{
 for(let level=1;level<=50;level++)assert.deepEqual(g.skillSlots(level),{active:level>=5?2:1,passive:level>=25?3:level>=10?2:1,ultimate:level>=20?1:0});
 const p=profile(19),before=JSON.stringify(p),rows=g.skillMilestones(19,25);
 assert.ok(rows.some(r=>r.level===20&&r.id==='bloodmoon'));assert.ok(rows.some(r=>r.level===20&&r.kind==='slot'));assert.ok(rows.some(r=>r.level===25&&r.label==='패시브 슬롯 3'));
 assert.ok(rows.every(r=>r.level>19&&r.level<=25));assert.equal(rows.some(r=>r.id==='eclipse'),false);assert.deepEqual(rows.map(r=>r.level),rows.map(r=>r.level).sort((a,b)=>a-b));
 assert.deepEqual(g.skillMilestones(49),[{level:50,label:'적월난무 각성',kind:'awakening'}]);assert.deepEqual(g.skillMilestones(50),[]);assert.equal(JSON.stringify(p),before);
});
test('all direct damage skills resolve on actual enemies, charge once and keep bounded pending work',()=>{
 for(const d of g.SKILL_CATALOG.filter(d=>d.damage>0&&!['mark','parry','phantoms'].includes(d.shape))){const {s,e}=fixture(d.id);const hp=e.hp;assert.ok(g.useSkill(s,d.id,{x:0,y:1}),d.id);assert.equal(g.useSkill(s,d.id,{x:0,y:1}),false,d.id+' duplicate');run(s,3.5);assert.ok(e.hp<hp,d.id+' missed');assert.ok(s.skillRuntime.jobs.length<=64);assert.ok(s.skillRuntime.cooldowns[d.id]>0);}
});
test('multi-hit damage does not accelerate ultimate cooldown',()=>{
 const {s,e}=fixture('dance');s.skillRuntime.cooldowns.bloodmoon=30;s.skillRuntime.cooldownKeys.push('bloodmoon');const start=s.run.time;const other={...e,id:900,x:e.x+10};s.enemies.push(other);assert.ok(g.useSkill(s,'dance',{x:0,y:1}));run(s,1.6);assert.ok(Math.abs(s.skillRuntime.cooldowns.bloodmoon-(30-(s.run.time-start)))<1e-9);assert.ok(e.hp<e.maxHp&&other.hp<other.maxHp);
});
test('cooldowns and jobs freeze on pause; dodge cancels committed windup without refund; stage exit clears deferred damage',()=>{
 const {s,e}=fixture('draw');assert.ok(g.useSkill(s,'draw',{x:0,y:1}));const cd=s.skillRuntime.cooldowns.draw,stamina=s.player.stamina;s.paused=true;run(s,1);assert.equal(s.skillRuntime.cooldowns.draw,cd);assert.equal(e.hp,e.maxHp);s.paused=false;assert.ok(g.dash(s,{x:1,y:0}));run(s,1);assert.equal(e.hp,e.maxHp);assert.ok(s.player.stamina<stamina+18);assert.ok(s.skillRuntime.cooldowns.draw>0);
 const f=fixture('field');g.useSkill(f.s,'field',{x:0,y:1});g.returnToCamp(f.s);run(f.s,4);assert.equal(f.s.skillRuntime.jobs.length,0);assert.equal(f.s.phase,'camp');
});
test('buffs and mark are functional, and mark proc cannot recursively count itself',()=>{
 const {s,p,e}=fixture('mark');assert.ok(g.useSkill(s,'mark',{x:0,y:1}));for(let i=0;i<5;i++){s.player.attackCooldown=0;s.player.action='idle';g.attack(s,{x:0,y:1});run(s,.14);e.y=s.player.y+90;}assert.equal(e.skillMark,null);assert.ok(e.hp<e.maxHp);
 const b=fixture('bloodblade');assert.ok(g.useSkill(b.s,'bloodblade'));assert.ok(g.basicSkillBonus(b.s,{heavy:false})>1);b.p.skillBook.loadout.active[1]='crescent';b.s.player.action='idle';assert.ok(g.useSkill(b.s,'crescent',{x:0,y:1}));assert.equal(g.basicSkillBonus(b.s,{heavy:false}),1);
 const stance=fixture('stance');stance.s.player.stamina=0;assert.ok(g.useSkill(stance.s,'stance'));run(stance.s,1);assert.ok(stance.s.player.stamina>18);
});
test('last stand respects internal cooldown and parry excludes area explosion without a source',()=>{
 const {s,p}=fixture('parry');p.skillBook.loadout.passive=['resolve','reserve',null];s.player.invulnerable=0;assert.ok(g.useSkill(s,'parry',{x:0,y:1}));const h={hit(){return 'hit';},visual(){},stats:g.playerStats};assert.equal(g.incomingSkillDamage(s,20,{x:s.player.x,y:s.player.y+50},h),0);assert.ok(s.skillRuntime.openingUntil>s.run.time);assert.ok(g.incomingSkillDamage(s,20,null,h)>0);s.player.hp=0;assert.ok(g.skillLastStand(s));assert.equal(s.player.hp,1);assert.equal(g.skillLastStand(s),false);
});
test('ultimate level gates and 60 second cooldown cannot be bypassed',()=>{
 const p=profile(19),s=g.createGame(p);p.skillBook.loadout.ultimate=['bloodmoon'];g.launch(s);assert.equal(g.useSkill(s,'bloodmoon'),false);
 const f=fixture('eclipse');assert.ok(g.skillReady(f.s,'eclipse'));assert.ok(g.useSkill(f.s,'eclipse',{x:0,y:1}));assert.equal(f.s.skillRuntime.cooldowns.eclipse,60);assert.equal(g.useSkill(f.s,'eclipse'),false);for(const id of ['bloodmoon','eclipse','phantoms'])assert.equal(g.skillRank(profile(),id),5);
});

test('passive timing, combo preparation, reduction cap and kill cooldown do not recursively amplify',()=>{
 const {s,p}=fixture('draw');p.skillBook.loadout.passive=['opening','finisher','steady'];g.skillPerfect(s);s.skillRuntime.finisherUntil=s.run.time+3;assert.ok(g.useSkill(s,'draw',{x:0,y:1}));assert.ok(s.skillRuntime.jobs[0].at-s.run.time<.45);assert.ok(s.skillRuntime.jobs[0].root.poise>40);assert.equal(s.skillRuntime.openingUntil,0);assert.equal(s.skillRuntime.finisherUntil,0);
 const f=fixture('stance');f.p.forge.armor=6;f.p.skillBook.loadout.passive=['reserve',null,null];f.p.skillBook.ranks.reserve=4;g.useSkill(f.s,'stance');const h={stats:()=>({reduction:.5}),visual(){}};const value=g.incomingSkillDamage(f.s,100,null,h);assert.ok(Math.abs(value-30)<.0001,'combined reduction caps at70%');
 const k=fixture('crescent');k.p.skillBook.loadout.passive=['momentum',null,null];k.s.skillRuntime.cooldowns.gale=10;k.s.skillRuntime.cooldownKeys.push('gale');g.skillKill(k.s);assert.ok(k.s.skillRuntime.cooldowns.gale<10);const cd=k.s.skillRuntime.cooldowns.gale;g.skillKill(k.s);assert.equal(k.s.skillRuntime.cooldowns.gale,cd);
 assert.equal(g.skillRank(p,'__proto__'),0);assert.equal(g.skillRank(p,'constructor'),0);
});

test('returning and phantom skills have bounded hit counts and deferred attacks never retarget dead identities',()=>{
 const {s,p,e}=fixture('returning');p.skillBook.loadout.passive=['recovery',null,null];s.player.stamina=50;g.useSkill(s,'returning',{x:0,y:1});run(s,.9);assert.ok(s.player.stamina>50-20+.9*18);assert.ok(e.hp<e.maxHp);
 const f=fixture('seeking');g.useSkill(f.s,'seeking',{x:0,y:1});f.e.dead=true;const replacement={...f.e,id:991,dead:false,hp:100000};f.s.enemies.push(replacement);run(f.s,.4);assert.equal(replacement.hp,100000);
 const z=fixture('phantoms');assert.ok(g.useSkill(z.s,'phantoms'));for(let i=0;i<10;i++){g.basicSkillContact(z.s,{heavy:false},[z.e],{stats:g.playerStats,visual(){},hit(_s,target,value){target.hp-=value;return 'hit';}});}assert.equal(z.s.skillRuntime.phantomHits,0);assert.ok(Math.abs(z.e.maxHp-z.e.hp-g.skillValue(z.p,'phantoms')/100*g.playerStats(z.p).damage)<.00001);
});

test('saved skill presets include auto policy and restore atomically at camp',()=>{
 const p=profile(35),s=g.createGame(p);p.skillBook.auto={mode:'safe',ultimate:'off'};g.skillPreset(s,0,'save');p.skillBook.auto.mode='boss';p.skillBook.auto.ultimate='any';assert.ok(g.skillPreset(s,0,'load'));assert.deepEqual(p.skillBook.auto,{mode:'safe',ultimate:'off'});const restored=g.restoreProfile(g.encodeProfile(p));assert.deepEqual(restored.skillBook.presets[0].auto,p.skillBook.auto);
});

test('auto policies preserve safety reserve, honor manual ultimate and mark the actual boss identity',()=>{
 const f=fixture('mark'),boss={...f.e,id:990,boss:true,y:f.e.y+30};f.s.enemies.push(boss);f.s.run.bossSpawned=true;const h={stats:g.playerStats,visual(){},motion(){},clamp(){}};assert.ok(g.autoSkill(f.s,{x:0,y:1},h));assert.ok(boss.skillMark);assert.equal(f.e.skillMark,undefined);
 const u=fixture('bloodmoon');u.p.skillBook.auto.ultimate='off';assert.equal(g.autoSkill(u.s,{x:0,y:1},h),false);assert.equal(u.s.skillRuntime.cooldowns.bloodmoon,undefined);
 const a=fixture('crescent');a.s.player.stamina=45;a.p.skillBook.auto.mode='safe';assert.equal(g.autoSkill(a.s,{x:0,y:1},h),false);a.p.skillBook.auto.mode='balanced';assert.ok(g.autoSkill(a.s,{x:0,y:1},h));
});

test('wave breaks discard elapsed pulses instead of replaying them in a burst on the next wave',()=>{
 const {s,e}=fixture('field');g.useSkill(s,'field',{x:0,y:1});s.run.flow='break';s.run.timer=100;run(s,4);assert.equal(e.hp,e.maxHp);assert.equal(s.skillRuntime.jobs.length,0);s.run.flow='combat';run(s,.1);assert.equal(e.hp,e.maxHp);
});

test('surrounded passive uses its declared240 range rather than the lone-target400 range',()=>{
 function sample(extraDistance){const {s,p,e}=fixture('dance');p.skillBook.loadout.passive=['surrounded',null,null];s.enemies.push({...e,id:881,x:s.player.x+extraDistance,y:s.player.y},{...e,id:882,x:s.player.x-extraDistance,y:s.player.y});g.useSkill(s,'dance',{x:0,y:1});run(s,.125);return e.skillPoise;}
 assert.ok(sample(220)>sample(300));
});

test('ultimate cooldown freezes on pause, survives cancellation and wave breaks, then resets on a fresh hunt',()=>{
 for(const id of ['bloodmoon','eclipse','phantoms']){
  const {s}=fixture(id);assert.equal(g.SKILL_BY_ID[id].cooldown,60);assert.ok(g.useSkill(s,id));s.paused=true;run(s,1);assert.equal(s.skillRuntime.cooldowns[id],60);s.paused=false;g.dash(s,{x:1,y:0});s.run.flow='break';s.run.timer=100;run(s,1);assert.ok(s.skillRuntime.cooldowns[id]<60&&s.skillRuntime.cooldowns[id]>58);clearSkillStage(s);assert.ok(s.skillRuntime.cooldowns[id]>58);
  s.run.flow='combat';s.player.action='idle';s.skillRuntime.cooldowns[id]=.025;assert.equal(g.skillReady(s,id),false);g.advanceGame(s,.025);s.player.action='idle';assert.equal(s.skillRuntime.cooldowns[id],0);assert.ok(g.skillReady(s,id));assert.ok(g.useSkill(s,id));assert.equal(s.skillRuntime.cooldowns[id],60);g.returnToCamp(s);g.launch(s);assert.ok(g.skillReady(s,id));
 }
});
test('kills and perfect defense cannot shorten the fixed ultimate cooldown; auto policy waits for it',()=>{
 const {s,p,e}=fixture('bloodmoon');p.skillBook.loadout.passive=['momentum',null,null];p.skillBook.auto.ultimate='any';assert.ok(g.useSkill(s,'bloodmoon'));g.skillKill(s);g.skillPerfect(s);assert.equal(s.skillRuntime.cooldowns.bloodmoon,60);run(s,2);s.player.action='idle';const h={stats:g.playerStats,visual(){},motion(){},clamp(){}};assert.equal(g.autoSkill(s,{x:0,y:1},h),false);s.skillRuntime.cooldowns.bloodmoon=0;assert.ok(g.autoSkill(s,{x:0,y:1},h));assert.equal(s.skillRuntime.cooldowns.bloodmoon,60);
});
