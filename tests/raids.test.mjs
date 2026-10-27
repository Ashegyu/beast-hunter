import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {RAID_POWERS} from '../dist/ancient-powers.js';

// Alpha 0.123 raids: one patterned boss, weekly entries, raid-only ancients.
const MONDAY=Date.UTC(2026,9,25,15);// 2026-10-26 00:00 KST, a Monday
const now=MONDAY+3*864e5;
// No passives, so incoming damage is only the gear reduction; s.auto=false keeps the player still unless a test acts.
// Every raid opens after clearing chapter 60 (user decision), so the default fixture has cleared all sixty.
function profile(cleared=60){const p=g.createProfile(1000);p.unlockedStage=cleared+1;p.clearedStage=cleared;p.stageProgress=g.STAGES.map(c=>c.id<=cleared?10:0);p.level=150;p.skillBook=g.restoreSkillBook(null,150);p.skillBook.loadout.passive=p.skillBook.loadout.passive.map(()=>null);return p;}
function raid(id,{durable=false,cleared=60}={}){const s=g.createGame(profile(cleared),{durable});assert.equal(g.launchRaid(s,id,now),true);s.auto=false;s.player.invulnerable=0;return s;}
function boss(s){for(let i=0;i<200&&!s.enemies.some(e=>e.boss);i++)g.advanceGame(s,.025);return s.enemies.find(e=>e.boss);}
const run=(s,seconds)=>{for(let t=0;t<seconds-1e-9;t+=.025)g.advanceGame(s,.025);};

test('weekly entries: three per raid, spent at entry, kept spent on failure and reset on Monday 00:00 KST',()=>{
 assert.equal(g.raidWeek(MONDAY)-g.raidWeek(MONDAY-1),1);assert.equal(g.nextRaidReset(now),MONDAY+7*864e5);
 const p=profile(),s=g.createGame(p,{durable:true});
 for(let n=0;n<g.RAID_WEEKLY_ENTRIES;n++){assert.equal(g.raidEntriesLeft(p,'colossus',now),3-n);assert.equal(g.launchRaid(s,'colossus',now),true);assert.equal(g.returnToCamp(s),true);}
 assert.equal(g.raidEntriesLeft(p,'colossus',now),0);assert.equal(g.launchRaid(s,'colossus',now),false);assert.equal(g.raidEntriesLeft(p,'queen',now),3);
 // A retreat rolls the stage journal back, but the entry was spent before the checkpoint.
 const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.equal(saved.raids.entries.colossus,3);assert.equal(g.raidEntriesLeft(saved,'colossus',now),0);
 assert.equal(g.raidEntriesLeft(saved,'colossus',MONDAY+7*864e5),3);assert.equal(g.launchRaid(g.createGame(saved),'colossus',MONDAY+7*864e5),true);
 // Locked until chapter 60 is cleared; restore clamps hostile counts.
 for(const r of g.RAIDS){assert.equal(r.unlock,60);assert.equal(g.launchRaid(g.createGame(profile(59)),r.id,now),false);}
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(profile(),1000)),raids:{week:'x',entries:{colossus:99,queen:-4},clears:{judge:1e9}}},1000);assert.deepEqual(hostile.raids,{week:-1,entries:{colossus:3,queen:0,judge:0},clears:{colossus:0,queen:0,judge:1e6}});
});

test('raid bosses scale with the furthest chapter and fight with their own species, cycle and pattern',()=>{
 for(const r of g.RAIDS){const s=raid(r.id),e=boss(s),st=g.STAGES[59];assert.equal(s.stageId,60);assert.equal(e.species,r.species);assert.equal(e.maxHp,Math.round(st.raidBossHp*r.hp*g.raidScale(60)));assert.deepEqual([...e.bossCycle],[...r.cycle]);assert.equal(e.special,undefined);assert.equal(s.run.timeLimit,g.RAID_TIME_LIMIT);assert.equal(s.run.rule.type,'raid');assert.match(g.bossRuleStatus(s),r.mechanic==='armor'?/강철 장갑/:r.mechanic==='swarm'?/군단 소환까지/:/심판까지/);}
 assert.ok(g.raidScale(20)>g.raidScale(60));assert.equal(g.raidScale(60),.7);
});

test('강철 거신 armor blocks 85% until 파갑참 breaks it',()=>{
 const s=raid('colossus'),e=boss(s);e.hp=e.maxHp;
 assert.equal(e.plate,.85);s.enemies.filter(q=>q!==e).forEach(q=>q.dead=true);
 const before=e.hp;s.player.x=e.x-120;s.player.y=e.y;s.player.action='idle';s.player.attackCooldown=0;s.player.combo=0;g.attack(s,{x:1,y:0});run(s,s.player.swing.impact+.025);const plated=before-e.hp;
 e.plateBrokenUntil=s.run.time+8;e.hp=before;s.player.action='idle';s.player.attackCooldown=0;s.player.combo=0;s.hitStop=0;g.attack(s,{x:1,y:0});run(s,s.player.swing.impact+.025);const broken=before-e.hp;
 assert.ok(plated>0&&broken>plated*4,plated+' vs '+broken);assert.match(g.bossRuleStatus(s),/장갑 파괴/);
});

test('군단의 여왕 calls a brood that shields her; killing her ends the raid and clears the brood',()=>{
 const s=raid('queen',{durable:true}),e=boss(s);run(s,7.2);const brood=s.enemies.filter(q=>q.raidBrood);assert.equal(brood.length,8);assert.ok(brood.every(q=>q.objective===false));assert.ok(g.raidBroodAlive(s));assert.match(g.bossRuleStatus(s),/군단의 가호/);
 s.lootRates={raid:1};e.hp=1;const kills=s.run.kills;for(const q of brood)q.hp=q.maxHp;
 // Even shielded, a lethal hit finishes her: the brood falls with her and the raid settles.
 s.player.x=e.x-120;s.player.y=e.y;s.player.action='idle';s.player.attackCooldown=0;s.player.invulnerable=99;g.attack(s,{x:1,y:0});run(s,.6);
 assert.ok(e.dead);assert.ok(s.enemies.every(q=>q.dead));assert.equal(s.run.flow,'settling');assert.ok(s.settlement.raid);
 const reward=g.raidRewards(60),item=s.run.dungeonReward.item;assert.equal(s.run.dungeonReward.gold,reward.gold);assert.equal(s.run.dungeonReward.cores,reward.cores);assert.deepEqual(s.run.dungeonReward.materials,reward.materials);
 assert.ok(item&&item.rarity===5&&/^ancient-raid-queen-/.test(item.catalogId));assert.ok(s.profile.discoveredAncients.includes(item.catalogId));
 assert.equal(g.confirmSettlement(s,s.settlement.id),true);assert.equal(s.phase,'victory');assert.equal(s.profile.raids.clears.queen,1);
 const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.deepEqual(saved.inventory.find(i=>i.id===item.id),item);assert.equal(saved.raids.clears.queen,1);assert.ok(kills<s.run.kills);
});

test('황혼의 심판자 judgement ignores dodge frames, grows each time and is stopped only by real invulnerability',()=>{
 const s=raid('judge'),e=boss(s);e.cooldown=999;e.speed=0;s.player.x=e.x-900;s.player.y=e.y;const max=s.player.maxHp;s.player.hp=max;
 e.judgeClock=11.99;s.player.invulnerable=.3;run(s,.05);const first=max-s.player.hp;assert.equal(e.judgements,1);
 const r=g.raidDefinition('judge'),expected=max*r.judgementDamage*(1-Math.min(.7,g.playerStats(s.profile).reduction));assert.ok(Math.abs(first-expected)<=2,first+' ~ '+expected);
 s.player.hp=max;e.judgeClock=11.99;run(s,.05);assert.ok(max-s.player.hp>first);
 s.player.hp=max;e.judgeClock=11.99;s.player.invulnerable=2;run(s,.05);assert.equal(s.player.hp,max);assert.equal(e.judgements,3);
});

test('raid ancients: fifteen authored identities, never in chapter boss pools, fixed power at every hunt mode',()=>{
 const rows=g.ANCIENT_CATALOG.filter(r=>r.raid);assert.equal(rows.length,15);
 for(const r of g.RAIDS){const own=rows.filter(a=>a.raid===r.id);assert.deepEqual(own.map(a=>a.slot),['weapon','helmet','armor','charm','special']);assert.ok(own.every(a=>a.region===7&&a.tier===6));for(const a of own)assert.deepEqual(a.signature,RAID_POWERS[a.id]);}
 for(const b of g.BOSS_LOOT)assert.ok(b.items.every(a=>!a.raid));
 const keys=new Set(rows.map(a=>JSON.stringify({...a.signature,id:0,index:0,name:0,color:0,description:0})));assert.equal(keys.size,15);
 const row=rows[0],item={id:1,slot:row.slot,tier:row.tier,rarity:5,catalogId:row.id,artId:row.artId,name:row.name,affixes:{}};
 for(const hunt of [0,1,2])assert.deepEqual(g.ancientSignatures({...item,...(hunt?{hunt}:{})}),[row.signature]);
 assert.match(g.equipmentAcquisition(item),/레이드 전용/);
 const tier6=g.ANCIENT_CATALOG.find(a=>a.tier===6&&a.slot==='weapon'&&!a.raid);assert.ok(row.base.damage>tier6.base.damage);
});

test('raid ancient rolls are wide and skewed low: stats 60~125%, effect power 60~120%, top results rare (Alpha 0.123)',async()=>{
 const L=await import('../dist/loot.js?v=0.136.2');let seed=99;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const row=g.ANCIENT_CATALOG.find(r=>r.raid==='judge'&&r.slot==='weapon'),N=4000,power=[];let high=0;
 for(let i=0;i<N;i++){const it=L.rollAncient({id:1,tier:6,slot:'weapon',raid:'judge'},rng(),rng);power.push(it.powerRoll);const r=L.itemRollRanges(it);if(it.affixes.damage>=r.damage.min+(r.damage.max-r.damage.min)*.8)high++;}
 const ranges=L.itemRollRanges({id:1,slot:'weapon',tier:6,rarity:5,catalogId:row.id,artId:row.artId,affixes:{...row.base}});assert.equal(ranges.damage.min,Math.round(row.base.damage*.6));assert.equal(ranges.damage.max,Math.round(row.base.damage*1.25));
 power.sort((a,b)=>a-b);assert.ok(power[0]>=60&&power.at(-1)<=120);assert.ok(power[N/2]<=70,'median '+power[N/2]);const top=power.filter(v=>v>=110).length/N;assert.ok(top>.04&&top<.1,'≥110%: '+top);assert.ok(high/N<.12,'top-fifth damage '+high/N);
 // Effect power scales the authored amounts; it survives save/restore and a 수치작 rerolls it.
 const p=profile(),item={...L.rollAncient({id:7,tier:6,slot:'weapon',raid:'judge'},0,rng),powerRoll:75};p.inventory=[item];p.gold=1e6;p.cores=100;p.materials.boneIron=100;
 assert.ok(Math.abs(g.ancientSignatures(item)[0].damage-row.signature.damage*.75)<.0011);assert.match(g.ancientSignatures(item)[0].description,/83% 피해/);
 const saved=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(saved.inventory[0].powerRoll,75);
 const s=g.createGame(saved);const res=g.rerollItem(s,7);assert.ok(res.ok,res.reason);const cand=s.profile.inventory[0].rerollCandidate;assert.ok(Number.isInteger(cand.powerRoll)&&cand.powerRoll>=60&&cand.powerRoll<=120);
 const kept=g.restoreProfile(g.encodeProfile(s.profile,1000),1000).inventory[0].rerollCandidate;assert.equal(kept.powerRoll,cand.powerRoll);
 assert.ok(g.resolveItemReroll(s,7,true).ok);assert.equal(s.profile.inventory[0].powerRoll,cand.powerRoll);
});
