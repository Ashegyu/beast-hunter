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
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(profile(),1000)),raids:{week:'x',entries:{colossus:99,queen:-4},clears:{judge:1e9}}},1000);assert.deepEqual(hostile.raids,{week:-1,entries:{colossus:3,queen:0,judge:0,sovereign:0},clears:{colossus:0,queen:0,judge:1e6,sovereign:0}});
});

test('raid bosses scale with the furthest chapter and fight with their own species, cycle and pattern',()=>{
 for(const r of g.RAIDS.filter(r=>!r.nightmare)){const s=raid(r.id),e=boss(s),st=g.STAGES[59];assert.equal(s.stageId,60);assert.equal(e.species,r.species);assert.equal(e.maxHp,Math.round(st.raidBossHp*r.hp*g.raidScale(60)));assert.deepEqual([...e.bossCycle],[...r.cycle]);assert.equal(e.special,undefined);assert.equal(s.run.timeLimit,g.RAID_TIME_LIMIT);assert.equal(s.run.rule.type,'raid');assert.match(g.bossRuleStatus(s),r.mechanic==='armor'?/강철 장갑/:r.mechanic==='swarm'?/군단 소환까지/:/심판까지/);}
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

test('raid ancients: fifteen authored identities, never in chapter boss pools; 정예/악몽 raid tiers add 각성 and 심연 powers (0.139)',()=>{
 const rows=g.ANCIENT_CATALOG.filter(r=>r.raid&&r.raid!=='sovereign');assert.equal(rows.length,15);
 for(const r of g.RAIDS.filter(r=>!r.nightmare)){const own=rows.filter(a=>a.raid===r.id);assert.deepEqual(own.map(a=>a.slot),['weapon','helmet','armor','charm','special']);assert.ok(own.every(a=>a.region===7&&a.tier===6));for(const a of own)assert.deepEqual(a.signature,RAID_POWERS[a.id]);}
 for(const b of g.BOSS_LOOT)assert.ok(b.items.every(a=>!a.raid));
 const keys=new Set(rows.map(a=>JSON.stringify({...a.signature,id:0,index:0,name:0,color:0,description:0})));assert.equal(keys.size,15);
 const row=rows[0],item={id:1,slot:row.slot,tier:row.tier,rarity:5,catalogId:row.id,artId:row.artId,name:row.name,affixes:{}};
 assert.deepEqual(g.ancientSignatures(item),[row.signature]);
 const elite=g.ancientSignatures({...item,hunt:1}),nightmare=g.ancientSignatures({...item,hunt:2});
 assert.deepEqual(elite.map(r=>r.name),[row.signature.name,'거신 각성']);assert.deepEqual(nightmare.map(r=>r.name),[row.signature.name,'거신 각성','심연의 칼날']);
 assert.ok(nightmare[0].damage>elite[0].damage&&elite[0].damage>row.signature.damage,'위력 ×1.2/×1.4');assert.equal(new Set(nightmare.map(r=>r.id)).size,3);
 assert.match(g.equipmentAcquisition(item),/레이드 전용/);
 const tier6=g.ANCIENT_CATALOG.find(a=>a.tier===6&&a.slot==='weapon'&&!a.raid);assert.ok(row.base.damage>tier6.base.damage);
});

test('raid ancient rolls are wide and skewed low: stats 60~125%, effect power 60~120%, top results rare (Alpha 0.123, 0.145.0 band table)',async()=>{
 const L=await import('../dist/loot.js?v=0.136.2');let seed=99;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const row=g.ANCIENT_CATALOG.find(r=>r.raid==='judge'&&r.slot==='weapon'),N=4000,power=[];let high=0;
 for(let i=0;i<N;i++){const it=L.rollAncient({id:1,tier:6,slot:'weapon',raid:'judge'},rng(),rng);power.push(it.powerRoll);const r=L.itemRollRanges(it);if(it.affixes.damage>=r.damage.min+(r.damage.max-r.damage.min)*.8)high++;}
 const ranges=L.itemRollRanges({id:1,slot:'weapon',tier:6,rarity:5,catalogId:row.id,artId:row.artId,affixes:{...row.base}});assert.equal(ranges.damage.min,Math.round(row.base.damage*.6));assert.equal(ranges.damage.max,Math.round(row.base.damage*1.25));
 power.sort((a,b)=>a-b);assert.ok(power[0]>=60&&power.at(-1)<=120);assert.ok(power[N/2]<=71,'median '+power[N/2]);const top=power.filter(v=>v>=110).length/N;assert.ok(top>.015&&top<.05,'≥110%: '+top);assert.ok(high/N<.06,'top-fifth damage '+high/N);
 // 0.145.0 band table: the top tenth of effect power (≥114%) only ~1% plus 극옵.
 assert.ok(power.filter(v=>v>=114).length/N<.03,'≥114%');
 // Effect power scales the authored amounts; it survives save/restore and a 수치작 rerolls it.
 const p=profile(),item={...L.rollAncient({id:7,tier:6,slot:'weapon',raid:'judge'},0,rng),powerRoll:75};p.inventory=[item];p.gold=1e6;p.cores=100;p.materials.boneIron=100;
 assert.ok(Math.abs(g.ancientSignatures(item)[0].damage-row.signature.damage*.75)<.0011);assert.match(g.ancientSignatures(item)[0].description,/83% 피해/);
 const saved=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(saved.inventory[0].powerRoll,75);
 const s=g.createGame(saved);const res=g.rerollItem(s,7);assert.ok(res.ok,res.reason);const cand=s.profile.inventory[0].rerollCandidate;assert.ok(Number.isInteger(cand.powerRoll)&&cand.powerRoll>=60&&cand.powerRoll<=120);
 const kept=g.restoreProfile(g.encodeProfile(s.profile,1000),1000).inventory[0].rerollCandidate;assert.equal(kept.powerRoll,cand.powerRoll);
 assert.ok(g.resolveItemReroll(s,7,true).ok);assert.equal(s.profile.inventory[0].powerRoll,cand.powerRoll);
});
test('0.139 raid tiers: 정예/악몽 open after every chapter of that mode, share the weekly entries, scale like chapter 120/180 and drop tier ancients',()=>{
 const base=profile();base.bossMastery=g.STAGES.map(()=>0);
 assert.equal(g.raidTierUnlocked(base,0),true);assert.equal(g.raidTierUnlocked(base,1),false);assert.equal(g.raidTierUnlocked(base,3),false);assert.equal(g.raidTopTier(base),0);
 assert.equal(g.launchRaid(g.createGame(structuredClone(base)),'judge',now,null,1),false);
 const elite=structuredClone(base);elite.bossMastery=elite.bossMastery.map(()=>1);elite.bossMastery[59]=0;assert.equal(g.raidTierUnlocked(elite,1),false,'정예 60장 전부');elite.bossMastery[59]=1;assert.equal(g.raidTierUnlocked(elite,1),true);assert.equal(g.raidTierUnlocked(elite,2),false);assert.equal(g.raidTopTier(elite),1);
 const top=structuredClone(base);top.bossMastery=top.bossMastery.map(()=>2);assert.equal(g.raidTopTier(top),2);
 const hp=tier=>{const s=g.createGame(structuredClone(top));assert.equal(g.launchRaid(s,'judge',now,null,tier),true);assert.equal(s.run.raidTier,tier);return boss(s).maxHp;};
 const h0=hp(0);for(const tier of [1,2])assert.ok(Math.abs(hp(tier)/h0-g.modeScale(g.MODE_CHAPTERS,tier).hp)<.01,'tier '+tier);
 // Shared entries: two tiers draw from the same three a week.
 const s=g.createGame(structuredClone(top),{durable:true});for(const tier of [2,1,0]){assert.equal(g.launchRaid(s,'queen',now,null,tier),true);g.returnToCamp(s);}assert.equal(g.launchRaid(s,'queen',now,null,2),false);
 // A cleared 악몽 raid pays tier gold and materials and its ancient carries hunt 2 (stats ×1.6, three powers).
 const win=g.createGame(structuredClone(top));assert.equal(g.launchRaid(win,'colossus',now,null,2),true);win.lootRates={raid:1};const e=boss(win);e.plate=0;e.hp=1;win.projectiles.push({id:win.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});run(win,.1);
 const reward=win.run.dungeonReward,plain=g.raidRewards(60);assert.equal(reward.gold,Math.round(plain.gold*g.modeScale(60,2).reward));assert.equal(reward.materials.source,plain.materials.source*3);assert.equal(reward.materials.promotionStone,undefined,'승급석은 성장 던전에서만');
 const item=reward.item;assert.equal(item.hunt,2);assert.equal(g.ancientSignatures(item).length,3);assert.equal(g.restoreProfile(g.encodeProfile(win.profile,1000),1000).inventory.find(i=>i.id===item.id).hunt,2);
});
// Alpha 0.149.4 (사용자 요청 '고대 +20 악몽 레이드 난이도 좀 낮춰줘'): 악몽 단계만 시간 180초·공격 ×0.8·심판 ×0.75·소환 무리 체력 ×0.4.
test('악몽 레이드 완화: 시간 제한·적 공격·소환 무리, 일반·정예는 그대로',()=>{
 const E=g.RAID_NIGHTMARE_EASE;assert.equal(g.raidTimeLimit(0),g.RAID_TIME_LIMIT);assert.equal(g.raidTimeLimit(1),g.RAID_TIME_LIMIT);assert.equal(g.raidTimeLimit(2),E.time);
 const top=profile(60);top.bossMastery=top.bossMastery.map(()=>2);
 const at=(id,tier)=>{const s=g.createGame(structuredClone(top));assert.equal(g.launchRaid(s,id,now,null,tier),true);return s;};
 for(const tier of [0,1,2]){const s=at('judge',tier);assert.equal(s.run.timeLimit,g.raidTimeLimit(tier));}
 const d1=boss(at('judge',1)).damage/g.modeScale(g.MODE_CHAPTERS,1).damage,d2=boss(at('judge',2)).damage/g.modeScale(g.MODE_CHAPTERS,2).damage;assert.ok(Math.abs(d2/d1-E.damage)<.01,'악몽 공격 완화');
 const q1=boss(at('queen',1)).maxHp/g.modeScale(g.MODE_CHAPTERS,1).hp,q2=boss(at('queen',2)).maxHp/g.modeScale(g.MODE_CHAPTERS,2).hp;assert.ok(Math.abs(q2/q1-g.raidDefinition('queen').nightmareHp)<.01,'악몽 여왕 체력 배율');
});
// Alpha 0.149.10 (사용자 요청 '여왕 악몽 체력 조금 더 낮춰줘'): 악몽 여왕 체력 ×1.1 → ×1, 군단의 가호 85% → 60%(악몽만).
test('군단의 여왕 악몽: 군단의 가호 감소율과 체력 배율',()=>{
 const q=g.raidDefinition('queen');assert.equal(q.nightmareHp,1);assert.equal(q.nightmareBroodShield,.6);
 for(const [tier,want] of [[0,q.broodShield],[1,q.broodShield],[2,.6]])assert.equal(g.raidBroodShield({run:{raidTier:tier}},q),want);
 const sov=g.raidDefinition('sovereign');assert.equal(g.raidBroodShield({run:{raidTier:2}},sov),sov.broodShield,'군주는 그대로');
});
// Alpha 0.149.12 레이드 연습전 (외부 감사 P1): 같은 전투를 주간 입장·사냥 횟수 없이, 승리해도 보상·클리어 기록·고대 없이.
test('레이드 연습전: 입장 횟수·보상·클리어 기록이 변하지 않고, 입장 횟수가 0이어도 연습할 수 있다',()=>{
 const s=g.createGame(profile(60)),p=s.profile;const before=structuredClone({raids:p.raids,gold:p.gold,cores:p.cores,materials:p.materials,inventory:p.inventory.length,hunts:p.hunts,discovered:p.discoveredAncients.length});
 assert.equal(g.launchRaid(s,'colossus',now,null,0,{practice:true}),true);assert.equal(s.run.practice,true);
 assert.equal(g.raidEntriesLeft(p,'colossus',now),3,'입장 횟수 그대로');assert.equal(p.hunts,before.hunts,'사냥 횟수 그대로');
 s.auto=false;s.player.invulnerable=1e6;const e=boss(s);e.hp=1;s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e6,ttl:1,friendly:true});
 for(let i=0;i<400&&!s.settlement&&s.run.flow==='combat';i++)g.advanceGame(s,.025);
 assert.ok(s.settlement||s.run.dungeonReward?.practice,'연습 정산');assert.equal(s.run.dungeonReward.practice,true);assert.equal(s.run.dungeonReward.gold,0);assert.equal(s.run.dungeonReward.item,undefined);
 assert.deepEqual(p.raids,before.raids,'클리어·입장 기록 그대로');assert.equal(p.gold,before.gold);assert.equal(p.cores,before.cores);assert.deepEqual(p.materials,before.materials);assert.equal(p.inventory.length,before.inventory);assert.equal(p.discoveredAncients.length,before.discovered);
 // 이번 주 입장을 다 써도 연습은 된다(정식 입장은 막힘).
 const t=g.createGame(profile(60));for(let n=0;n<g.RAID_WEEKLY_ENTRIES;n++){assert.equal(g.launchRaid(t,'judge',now),true);assert.equal(g.returnToCamp(t),true);}
 assert.equal(g.launchRaid(t,'judge',now),false);assert.equal(g.launchRaid(t,'judge',now,null,0,{practice:true}),true);assert.equal(g.raidEntriesLeft(t.profile,'judge',now),0);
 // 정식 입장은 practice가 남지 않는다.
 const u=g.createGame(profile(60));assert.equal(g.launchRaid(u,'queen',now,null,0,{practice:true}),true);assert.equal(g.returnToCamp(u),true);assert.equal(g.launchRaid(u,'queen',now),true);assert.equal(u.run.practice,false);assert.equal(g.raidEntriesLeft(u.profile,'queen',now),2);
});
