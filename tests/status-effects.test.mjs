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
test('tickStatuses: 만료와 화상 난이도별 피해',()=>{const t={};st.applyStatus(t,'burn',0,{stacks:2});close(st.tickStatuses(t,1,.5,1),.01);close(st.tickStatuses(t,1,.5,2),.015);close(st.tickStatuses(t,4,.5,2),0);assert.equal(t.statuses.length,0);});
test('cleanse(n): 큰 중첩부터 n종; statusMods: 활성 효과 합산',()=>{
 const t={};for(const [id,stacks]of [['burn',1],['frost',3],['curse',2],['corrode',2]])st.applyStatus(t,id,0,{stacks});
 assert.deepEqual(st.statusMods(t,1),{damage:-.2,taken:.12,attackSpeed:-.24,speed:-.24});assert.equal(st.cleanse(t,1,2),2);assert.deepEqual(t.statuses.map(x=>x.id),['burn','corrode']);assert.equal(st.cleanse(t,1),2);assert.deepEqual(st.statusMods(t,10),{damage:0,taken:0,attackSpeed:0,speed:0});
});
for(const [chapter,id]of [[15,'burn'],[30,'curse'],[40,'frost'],[10,'corrode']])for(const difficulty of [1,2])for(const kind of ['melee','projectile'])test(`${chapter}장 난이도 ${difficulty} ${kind}: ${id}`,()=>{
 const {s,e}=fight(chapter,difficulty);if(kind==='projectile')shot(s);else {Object.assign(e,{attackKind:'slam',pattern:0,bossCycle:['slam'],action:'windup',actionTime:1,windup:0,targetX:s.player.x,targetY:s.player.y,radius:200,damage:100});run(s,.025);}
 assert.equal(st.statusStacks(s.player,id,s.run.time),1);
});
for(const chapter of [15,30,40,10])for(const dummy of [false,true])test(`${chapter}장 디버프 제외: ${dummy?'허수아비':'일반'}`,()=>{const {s}=fight(chapter,dummy?2:0);if(dummy)s.run.dungeonId='dummy';shot(s);assert.equal(st.statusList(s.player,s.run.time).length,0);});
test('화상은 체력 1을 보존',()=>{const {s}=fight();s.player.hp=2;s.player.invulnerable=100;apply(s,'burn',3);run(s,1);assert.equal(s.player.hp,1);});
test('저주는 주는 피해 감소, 부식은 받는 피해 증가',()=>{
 const a=fight(),b=fight();apply(b.s,'curse',2);shot(a.s,{friendly:true,target:a.e,damage:1000});shot(b.s,{friendly:true,target:b.e,damage:1000});close((1e6-b.e.hp)/(1e6-a.e.hp),.8);
 const c=fight(),d=fight();apply(d.s,'corrode',3);shot(c.s);shot(d.s);assert.ok(Math.abs((10000-d.s.player.hp)/(10000-c.s.player.hp)-1.18)<.02);
});
test('동상은 기본 스윙 시간을 증가',()=>{const a=fight(),b=fight();apply(b.s,'frost',3);assert.ok(g.attack(a.s,{x:0,y:1}));assert.ok(g.attack(b.s,{x:0,y:1}));close(b.s.player.swing.duration/a.s.player.swing.duration,1/.76);});
test('수월의 자세는 전부 정화; 정화 3태그는 4% 회복',()=>{for(const active of [['stance'],['stance','parry','breach']]){const {s}=fight(15,1,active);s.player.hp=5000;apply(s,'burn');apply(s,'curse');assert.ok(cast(s,'stance'));assert.equal(st.statusList(s.player,s.run.time).length,0);close(s.player.hp,active.length===3?5400:5000);}});
test('정화 2태그는 적중 디버프 시간을 30% 단축',()=>{const {s}=fight(15,1,['stance','parry']);shot(s);close(s.player.statuses[0].seconds,2.8);});
test('흘려베기 성공은 큰 중첩 1종만 정화',()=>{const {s}=fight(15,1,['parry']);apply(s,'curse',2);apply(s,'frost');assert.ok(cast(s,'parry'));s.projectiles.push({id:s.nextId++,x:s.player.x,y:s.player.y+50,vx:0,vy:-2000,damage:100,ttl:1,boss:true,friendly:false});run(s,.025);assert.equal(st.hasStatus(s.player,'curse',s.run.time),false);assert.equal(st.hasStatus(s.player,'frost',s.run.time),true);assert.equal(s.player.hp,10000);});
test('파갑참 보스 적중은 4초 해체, 격노 배율 1',()=>{const {s,e}=fight(15,1,['breach']);s.run.time=8.1;run(s,.025);assert.equal(e.furyScale,1.5);assert.ok(cast(s,'breach'));run(s,.5);const x=e.statuses.find(x=>x.id==='dispelled');assert.ok(x);close(x.seconds,4);assert.equal(e.furyScale,1);});
test('해체는 재생 틱을 건너뛰고 만료 뒤 회복 재개',()=>{const {s,e}=fight(10);e.hp=500000;e.recoveryClock=7.99;g.dispelBoss(s,e);run(s,.025);assert.equal(e.hp,500000);s.run.time+=4.1;e.recoveryClock=7.99;run(s,.025);assert.equal(e.hp,520000);});
test('해체는 방어 태세 피해 감소를 절반으로',()=>{const a=fight(30),b=fight(30);g.dispelBoss(b.s,b.e);shot(a.s,{friendly:true,target:a.e,damage:10000});shot(b.s,{friendly:true,target:b.e,damage:10000});assert.ok(Math.abs((1e6-b.e.hp)/(1e6-a.e.hp)-(1-g.stanceGuard(a.s)*.5)/(1-g.stanceGuard(a.s)))<.001);});
test('자동 전투는 2종 디버프에서 수월의 자세를 우선',()=>{const {s}=fight(15,1,['draw','stance','parry','breach']);apply(s,'burn');apply(s,'frost');s.auto=true;run(s,.025);assert.equal(s.skillRuntime.lastCast?.id,'stance');});
test('자동 전투는 격노 보스에게 파갑참 사용',()=>{const {s,e}=fight(15,1,['draw','breach']);s.run.time=8.1;run(s,.025);assert.equal(e.furyActive,true);s.auto=true;run(s,.025);assert.equal(s.skillRuntime.lastCast?.id,'breach');run(s,.5);assert.ok(st.hasStatus(e,'dispelled',s.run.time));});

test('보호막이 보스 공격을 전부 흡수하면 디버프 없음',()=>{const {s}=fight();s.uniqueState.shield=1000;s.uniqueState.shieldTime=10;shot(s);assert.equal(s.player.hp,10000);assert.equal(st.statusList(s.player,s.run.time).length,0);});
