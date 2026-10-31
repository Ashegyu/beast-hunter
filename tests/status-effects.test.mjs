import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import * as st from '../dist/status-effects.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const run=(s,t)=>{for(let left=t;left>1e-9;left-=.025)g.advanceGame(s,Math.min(.025,left));};
function fight(chapter=15,difficulty=1,active=[]){
 const p=g.createProfile(1000);Object.assign(p,{level:200,clearedStage:60,unlockedStage:60,stageProgress:g.STAGES.map(()=>10),bossMastery:g.STAGES.map(()=>2)});p.difficultyProgress=p.difficultyProgress.map(r=>r.map(()=>10));
 p.skillBook=g.restoreSkillBook(null,200);p.skillBook.ranks={};p.skillBook.loadout={active:[...active,...Array(4-active.length).fill(null)],passive:[null,null,null],ultimate:[null],beast:[null]};for(const id of active)p.skillBook.ranks[id]=14;
 const s=g.createGame(p);assert.ok(g.launch(s,chapter,10,null,difficulty));s.auto=false;s.player.invulnerable=100;
 for(let i=0;i<400&&!s.enemies.some(e=>e.boss);i++)run(s,.025);
 const e=s.enemies.find(e=>e.boss);assert.ok(e);s.spawns=[];s.barrels=[];s.enemies=[e];s.run.flow='combat';s.run.timer=1e6;s.run.timeRemaining=1e6;
 Object.assign(e,{x:s.player.x,y:s.player.y+100,hp:1e6,maxHp:1e6,guard:0,guardMax:0,plate:0,cooldown:1e4,speed:0,action:'idle'});s.player.invulnerable=0;s.player.hp=s.player.maxHp=10000;s.player.lastDamage=s.run.time;
 return {s,e};
}
function shot(s,{friendly=false,damage=100,boss=true,target=s.player}={}){s.projectiles.push({id:s.nextId++,x:target.x,y:target.y,vx:0,vy:0,damage,ttl:1,friendly,boss});run(s,.025);}
const apply=(s,id,stacks=1)=>st.applyStatus(s.player,id,s.run.time,{stacks});
const cast=(s,id)=>{s.player.action='idle';s.player.stamina=100;return g.useSkill(s,id,{x:0,y:1});};
test('applyStatus: 중첩 상한·갱신·만료 후 재적용·저항',()=>{
 const t={};st.applyStatus(t,'burn',1);st.applyStatus(t,'burn',2,{stacks:9});assert.equal(t.statuses.length,1);assert.equal(t.statuses[0].stacks,3);close(t.statuses[0].until,6);
 st.applyStatus(t,'burn',7,{resist:.3});assert.equal(t.statuses[0].stacks,1);close(t.statuses[0].until,9.8);
});
test('tickStatuses: 만료와 화상 난이도별 피해',()=>{const t={};st.applyStatus(t,'burn',0,{stacks:2});{const h=st.STATUS_DEFS.burn.tick.hpPct;close(st.tickStatuses(t,1,.5,1),h[1]*2*.5);close(st.tickStatuses(t,1,.5,2),h[2]*2*.5);}close(st.tickStatuses(t,4,.5,2),0);assert.equal(t.statuses.length,0);});
test('cleanse(n): 큰 중첩부터 n종; statusMods: 활성 효과 합산',()=>{
 const t={};for(const [id,stacks]of [['burn',1],['frost',3],['curse',2],['corrode',2]])st.applyStatus(t,id,0,{stacks});
 {const D=st.STATUS_DEFS;const m=st.statusMods(t,1);close(m.damage,D.curse.mods.damage*2);close(m.taken,D.corrode.mods.taken*2);close(m.attackSpeed,D.frost.mods.attackSpeed*3);close(m.speed,D.frost.mods.speed*3);}assert.equal(st.cleanse(t,1,2),2);assert.deepEqual(t.statuses.map(x=>x.id),['burn','corrode']);assert.equal(st.cleanse(t,1),2);assert.deepEqual(st.statusMods(t,10),{damage:0,taken:0,attackSpeed:0,speed:0,cooldown:0});
});
for(const [chapter,id]of [[15,'burn'],[30,'curse'],[40,'frost'],[10,'corrode']])for(const difficulty of [1,2])for(const kind of ['melee','projectile'])test(`${chapter}장 난이도 ${difficulty} ${kind}: ${id}`,()=>{
 const {s,e}=fight(chapter,difficulty);if(kind==='projectile')shot(s);else {Object.assign(e,{attackKind:'slam',pattern:0,bossCycle:['slam'],action:'windup',actionTime:1,windup:0,targetX:s.player.x,targetY:s.player.y,radius:200,damage:100});run(s,.025);}
 assert.equal(st.statusStacks(s.player,id,s.run.time),1);
});
for(const chapter of [15,30,40,10])for(const dummy of [false,true])test(`${chapter}장 디버프 제외: ${dummy?'허수아비':'일반'}`,()=>{const {s}=fight(chapter,dummy?2:0);if(dummy)s.run.dungeonId='dummy';shot(s);assert.equal(st.statusList(s.player,s.run.time).length,0);});
test('화상은 체력 1을 보존',()=>{const {s}=fight();s.player.hp=2;s.player.invulnerable=100;apply(s,'burn',3);run(s,1);assert.equal(s.player.hp,1);});
test('저주는 주는 피해 감소, 부식은 받는 피해 증가',()=>{
 const a=fight(),b=fight();apply(b.s,'curse',2);shot(a.s,{friendly:true,target:a.e,damage:1000});shot(b.s,{friendly:true,target:b.e,damage:1000});close((1e6-b.e.hp)/(1e6-a.e.hp),1+st.STATUS_DEFS.curse.mods.damage*2);
 const c=fight(),d=fight();apply(d.s,'corrode',3);shot(c.s);shot(d.s);assert.ok(Math.abs((10000-d.s.player.hp)/(10000-c.s.player.hp)-(1+st.STATUS_DEFS.corrode.mods.taken*3))<.02);
});
test('동상은 기본 스윙 시간을 증가',()=>{const a=fight(),b=fight();apply(b.s,'frost',3);assert.ok(g.attack(a.s,{x:0,y:1}));assert.ok(g.attack(b.s,{x:0,y:1}));close(b.s.player.swing.duration/a.s.player.swing.duration,1/(1+st.STATUS_DEFS.frost.mods.attackSpeed*3));});
test('수월의 자세는 전부 정화; 정화 3태그는 4% 회복',()=>{for(const active of [['stance'],['stance','parry','breach']]){const {s}=fight(15,1,active);s.player.hp=5000;apply(s,'burn');apply(s,'curse');assert.ok(cast(s,'stance'));assert.deepEqual(st.statusList(s.player,s.run.time).map(x=>x.id),['purified'],'디버프는 모두 없어지고 0.149.1 정화의 기세가 붙는다');close(s.player.hp,active.length===3?5400:5000);}});
test('정화 2태그는 적중 디버프 시간을 30% 단축',()=>{const {s}=fight(15,1,['stance','parry']);shot(s);close(s.player.statuses[0].seconds,2.8);});
test('흘려베기 성공은 큰 중첩 1종만 정화',()=>{const {s}=fight(15,1,['parry']);apply(s,'curse',2);apply(s,'frost');assert.ok(cast(s,'parry'));s.projectiles.push({id:s.nextId++,x:s.player.x,y:s.player.y+50,vx:0,vy:-2000,damage:100,ttl:1,boss:true,friendly:false});run(s,.025);assert.equal(st.hasStatus(s.player,'curse',s.run.time),false);assert.equal(st.hasStatus(s.player,'frost',s.run.time),true);assert.equal(s.player.hp,10000);});
test('파갑참 보스 적중은 4초 해체, 격노 배율 1',()=>{const {s,e}=fight(15,1,['breach']);s.run.time=8.1;run(s,.025);assert.equal(e.furyScale,1.5);assert.ok(cast(s,'breach'));run(s,.5);const x=e.statuses.find(x=>x.id==='dispelled');assert.ok(x);close(x.seconds,4);assert.equal(e.furyScale,1);});
test('해체는 재생 틱을 건너뛰고 만료 뒤 회복 재개',()=>{const {s,e}=fight(10);e.hp=500000;e.recoveryClock=7.99;g.dispelBoss(s,e);run(s,.025);assert.equal(e.hp,500000);s.run.time+=4.1;e.recoveryClock=7.99;run(s,.025);assert.equal(e.hp,520000);});
test('해체는 방어 태세 피해 감소를 절반으로',()=>{const a=fight(30),b=fight(30);g.dispelBoss(b.s,b.e);shot(a.s,{friendly:true,target:a.e,damage:10000});shot(b.s,{friendly:true,target:b.e,damage:10000});assert.ok(Math.abs((1e6-b.e.hp)/(1e6-a.e.hp)-(1-g.stanceGuard(a.s)*.5)/(1-g.stanceGuard(a.s))*(1+st.STATUS_DEFS.dispelled.mods.taken))<.001);});
test('자동 전투는 2종 디버프에서 수월의 자세를 우선',()=>{const {s}=fight(15,1,['draw','stance','parry','breach']);apply(s,'burn');apply(s,'frost');s.auto=true;run(s,.025);assert.equal(s.skillRuntime.lastCast?.id,'stance');});
test('자동 전투는 격노 보스에게 파갑참 사용',()=>{const {s,e}=fight(15,1,['draw','breach']);s.run.time=8.1;run(s,.025);assert.equal(e.furyActive,true);s.auto=true;run(s,.025);assert.equal(s.skillRuntime.lastCast?.id,'breach');run(s,.5);assert.ok(st.hasStatus(e,'dispelled',s.run.time));});

test('보호막이 보스 공격을 전부 흡수하면 디버프 없음',()=>{const {s}=fight();s.uniqueState.shield=1000;s.uniqueState.shieldTime=10;shot(s);assert.equal(s.player.hp,10000);assert.equal(st.statusList(s.player,s.run.time).length,0);});
test('0.149.1 정화 보상: 정화하면 정화의 기세(피해 +20%)와 기력, 해체된 보스는 받는 피해 증가',()=>{
 const {s}=fight(15,1,['stance']);s.player.stamina=40;apply(s,'burn');assert.ok(cast(s,'stance'));
 assert.ok(st.hasStatus(s.player,'purified',s.run.time));assert.ok(st.statusMods(s.player,s.run.time).damage>0);
 assert.ok(st.STATUS_DEFS.dispelled.mods.taken>0);assert.equal(st.STATUS_DEFS.purified.kind,'buff');
 const t={};st.applyStatus(t,'purified',0);st.applyStatus(t,'burn',0);assert.equal(st.cleanse(t,1),1);assert.deepEqual(t.statuses.map(x=>x.id),['purified'],'정화는 버프를 지우지 않는다');
});
// Alpha 0.149.2 저항: 장신구(목걸이·귀걸이)의 파생 수치와 수호자 트리 노드가 정화 태그와 합쳐져 디버프 시간을 줄인다.
test('accessoryResist: 목걸이·귀걸이만, 2 + 등급(최대 5) + 번호 0~2, 저장하지 않음',()=>{
 for(const slot of ['weapon','helmet','armor','pants','boots','special'])assert.equal(st.accessoryResist({slot,id:3,rarity:5}),0);
 const vals=[];for(let id=1;id<=60;id++)for(const rarity of [0,3,5,6]){const v=st.accessoryResist({slot:id%2?'charm':'earring',id,rarity});const base=2+Math.min(5,rarity);assert.ok(v>=base&&v<=base+2,`${v}`);vals.push(v-base);}
 assert.deepEqual([...new Set(vals)].sort(),[0,1,2],'번호에 따라 0~2가 모두 나온다');
 assert.equal(st.accessoryResist({slot:'charm',id:7,rarity:2}),st.accessoryResist({slot:'charm',id:7,rarity:2}),'같은 장신구는 늘 같은 값');
 assert.equal(st.accessoryResist(null),0);
});
test('statusResist: 정화 태그 + 장신구 + 트리, 80% 상한, 실제 디버프 시간 단축',()=>{
 const p=g.createProfile(1000);close(g.statusResist(p).total,0);
 p.inventory.push({id:11,slot:'charm',rarity:5,tier:1,name:'목걸이',affixes:{}},{id:12,slot:'earring',rarity:5,tier:1,name:'귀걸이',affixes:{}},{id:13,slot:'earring',rarity:5,tier:1,name:'귀걸이',affixes:{}});
 Object.assign(p.equipment,{charm:11,earringLeft:12,earringRight:13});
 const gear=[11,12,13].reduce((n,id)=>n+st.accessoryResist({slot:id===11?'charm':'earring',id,rarity:5}),0)/100;
 close(g.gearResist(p),gear);close(g.statusResist(p).gear,gear);
 p.growthTree=['ward-r','ward-1','ward-2','ward-3','ward-10','ward-11'];close(g.treeBonus(p).resist,.14);close(g.statusResist(p).tree,.14);close(g.statusResist(p).total,gear+.14);
 assert.match(g.TREE_NODES['ward-11'].text,/디버프 시간 단축 \+10%/);
 const {s}=fight(15,1,['stance','parry']);Object.assign(s.profile.equipment,{});s.profile.growthTree=p.growthTree;const r=g.statusResist(s.profile);close(r.purify,st.PURIFY_RESIST);close(r.total,Math.min(st.RESIST_CAP,st.PURIFY_RESIST+.14));
 shot(s);const x=s.player.statuses.find(x=>x.id===st.RULE_DEBUFF.fury);assert.ok(x,'격노 보스 적중 시 디버프');close(x.seconds,st.STATUS_DEFS[x.id].seconds*(1-r.total));
 const t={};st.applyStatus(t,'curse',0,{resist:5});close(t.statuses[0].seconds,st.STATUS_DEFS.curse.seconds*(1-st.RESIST_CAP));
});
// Alpha 0.149.3 레이드(정예·악몽) 전용 패턴: 봉인(주기 디버프)과 신성 보호막(보스 버프, 해체로 벗김).
const RAID_NOW=Date.UTC(2026,9,25,15)+3*864e5;
function raidFight(tier=1,active=[]){
 const p=g.createProfile(1000);Object.assign(p,{level:200,clearedStage:60,unlockedStage:61,stageProgress:g.STAGES.map(()=>10),bossMastery:g.STAGES.map(()=>2)});
 p.skillBook=g.restoreSkillBook(null,200);p.skillBook.ranks={};p.skillBook.loadout={active:[...active,...Array(4-active.length).fill(null)],passive:[null,null,null],ultimate:[null],beast:[null]};for(const id of active)p.skillBook.ranks[id]=14;
 const s=g.createGame(p);assert.ok(g.launchRaid(s,'colossus',RAID_NOW,null,tier));assert.equal(s.run.raidTier,tier);s.auto=false;s.player.invulnerable=1e6;
 for(let i=0;i<400&&!s.enemies.some(e=>e.boss);i++)run(s,.025);const e=s.enemies.find(e=>e.boss);assert.ok(e);
 Object.assign(e,{x:s.player.x,y:s.player.y+100,cooldown:1e4,speed:0,action:'idle'});s.player.hp=s.player.maxHp=1e7;return {s,e};
}
test('봉인: 정예·악몽 레이드에서 SEAL_EVERY초마다, 재사용 대기 회복 −60%, 저항·정화 적용; 일반 레이드는 없음',()=>{
 {const {s}=raidFight(0);run(s,st.SEAL_EVERY+.5);assert.ok(!g.hasStatus(s.player,'sealed',s.run.time),'일반 레이드는 봉인 없음');}
 const {s,e}=raidFight(1,['stance']);e.sealClock=st.SEAL_EVERY-.1;run(s,.2);
 const x=s.player.statuses.find(x=>x.id==='sealed');assert.ok(x,'봉인');close(x.seconds,st.STATUS_DEFS.sealed.seconds);
 close(g.playerStatusMods(s).cooldown,st.STATUS_DEFS.sealed.mods.cooldown);
 // 재사용 대기가 40% 속도로 흐른다.
 s.skillRuntime.cooldowns.stance=10;if(!s.skillRuntime.cooldownKeys.includes('stance'))s.skillRuntime.cooldownKeys.push('stance');run(s,1);close(Math.round((10-s.skillRuntime.cooldowns.stance)*1e6)/1e6,Math.round(1*(1+st.STATUS_DEFS.sealed.mods.cooldown)*1e6)/1e6);
 // 정화하면 풀린다.
 assert.equal(g.cleansePlayer(s),1);assert.ok(!g.hasStatus(s.player,'sealed',s.run.time));
 // 저항이 시간을 줄인다.
 const {s:s2,e:e2}=raidFight(1,['stance','parry']);e2.sealClock=st.SEAL_EVERY-.1;run(s2,.2);close(s2.player.statuses.find(x=>x.id==='sealed').seconds,st.STATUS_DEFS.sealed.seconds*(1-g.statusResist(s2.profile).total));
});
test('신성 보호막: HOLY_EVERY초마다 최대 체력 × 단계 비율, 피해를 먼저 막고 파갑참 해체로 벗겨진다',()=>{
 for(const tier of [1,2]){const {s,e}=raidFight(tier);e.holyClock=st.HOLY_EVERY-.1;run(s,.2);close(e.holyShield,e.maxHp*st.HOLY_SHIELD[tier]);assert.ok(g.hasStatus(e,'holyShield',s.run.time));
  assert.ok(g.bossStatusList(s,e).some(x=>x.id==='holyShield'),'보스 칩');}
 const {s,e}=raidFight(1,['breach']);e.holyClock=st.HOLY_EVERY-.1;run(s,.2);const shield=e.holyShield,hp=e.hp;
 shot(s,{friendly:true,damage:Math.round(shield/4),boss:false,target:e});assert.equal(e.hp,hp,'보호막이 먼저 받는다');assert.ok(e.holyShield<shield,'보호막이 줄었다');
 assert.ok(g.dispelBoss(s,e));assert.equal(e.holyShield,0);assert.ok(!g.hasStatus(e,'holyShield',s.run.time));
 // 시간이 지나면 사라진다.
 const {s:s3,e:e3}=raidFight(1);e3.holyClock=st.HOLY_EVERY-.1;run(s3,.2);run(s3,st.STATUS_DEFS.holyShield.seconds+.1);assert.equal(e3.holyShield,0);
 // 일반 레이드는 없음.
 const {s:s4,e:e4}=raidFight(0);e4.holyClock=st.HOLY_EVERY-.1;run(s4,.3);assert.ok(!(e4.holyShield>0));
});
// Alpha 0.149.5 설계 1단계 '공통 틀': 플레이어가 적에게 거는 기존 효과를 같은 목록 형태로 읽는다(시간은 기존 필드).
test('afflictionList: 출혈·룬 출혈·빙결·노출·장갑 파괴·룬 약화·흉터를 기존 필드에서 읽는다',()=>{
 const e={bleedTicks:3,bleedTimer:.5,runeBleedTime:2,runeBleedStacks:4,chillRemaining:1.5,exposed:2.8,plateBrokenUntil:13,runeShredTime:3,skillScarUntil:11};
 const list=st.afflictionList(e,10),by=Object.fromEntries(list.map(x=>[x.id,x]));
 assert.deepEqual(list.map(x=>x.id),Object.keys(st.AFFLICTION_DEFS));
 close(by.bleed.left,2*.8+.5);assert.equal(by.bleed.stacks,3);assert.equal(by.runeBleed.stacks,4);close(by.chill.left,1.5);close(by.exposed.left,2.8);close(by.breach.left,3);close(by.shred.left,3);close(by.scar.left,1);
 assert.deepEqual(st.afflictionList({bleedTicks:0,chillRemaining:0,exposed:0,plateBrokenUntil:5,skillScarUntil:9},10),[]);
 for(const id of Object.keys(st.AFFLICTION_DEFS))assert.equal(st.statusDef(id).name,by[id].name);
 assert.equal(st.statusDef('burn'),st.STATUS_DEFS.burn);assert.equal(st.statusDef('nope'),null);
});
test('bossStatusList: 플레이어가 건 효과는 일반 난이도 보스에도 보이고, 보스 버프는 정예·악몽에서만',()=>{
 const {s,e}=fight(15,1);e.exposed=2;e.bleedTicks=2;e.bleedTimer=.8;const ids=g.bossStatusList(s,e).map(x=>x.id);assert.ok(ids.includes('exposed')&&ids.includes('bleed'));
 s.difficulty=0;const normal=g.bossStatusList(s,e).map(x=>x.id);assert.deepEqual(normal,['bleed','exposed']);
});
