import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';

// Alpha 0.133 난이도 곡선 + 관문.
test('threat curve: health and damage rise every chapter and step up at every region; rewards keep the old multiplier',()=>{
 for(let c=2;c<=g.STAGES.length;c++){const a=g.STAGES[c-2],b=g.STAGES[c-1];assert.ok(b.hpScale>a.hpScale,'hp '+c);assert.ok(b.damageScale>a.damageScale,'damage '+c);assert.ok(b.bossHp>a.bossHp*.99||b.number===1,'boss '+c);}
 for(const c of [11,21,31,41,51]){const step=g.STAGES[c-1].hpScale/g.STAGES[c-2].hpScale,inside=g.STAGES[c-2].hpScale/g.STAGES[c-3].hpScale;assert.ok(step>inside,'region step '+c);}
 assert.equal(g.STAGES[0].hpScale,1);assert.equal(g.STAGES[59].reward,Math.round(90*g.STAGES[59].multiplier));
});

test('every chapter has a boss gate of its biome type and one stage gate of another type',()=>{
 const seen=new Set();
 for(const st of g.STAGES){const gates=[1,2,3,4,5,6,7,8,9,10].map(n=>g.stageGate(st.id,n)).filter(Boolean);assert.equal(gates.length,2,'chapter '+st.id);
  const boss=g.stageGate(st.id,10);assert.equal(boss.boss,true);assert.equal(boss.type,g.BOSS_GATE_BY_RULE[st.bossRule]);const stage=gates.find(x=>!x.boss);assert.notEqual(stage.type,boss.type);seen.add(stage.type);seen.add(boss.type);
  assert.ok(boss.pressure>stage.pressure);}
 assert.deepEqual([...seen].sort(),[...g.GATE_IDS].sort());
 for(let c=2;c<=60;c++)assert.ok(g.gatePressure(c)>g.gatePressure(c-1));assert.ok(g.gatePressure(51)-g.gatePressure(50)>g.gatePressure(50)-g.gatePressure(49));
});

// Alpha 0.147.0: tree ids are numbered per region; take a region's own nodes outward from its ring node until ≥ need points.
function regionTree(region,need){const adj={};for(const [a,b] of g.TREE_EDGES){(adj[a]??=[]).push(b);(adj[b]??=[]).push(a);}
 const out=[],seen=new Set([region+'-r']),queue=[region+'-r'];let spent=0;
 while(queue.length&&spent<need){const id=queue.shift();out.push(id);spent+=g.TREE_NODES[id].cost;for(const n of adj[id])if(!seen.has(n)&&n.startsWith(region+'-')){seen.add(n);queue.push(n);}}
 return out;}
test('the build counter: matching tree branch and skills remove up to 75% of the pressure',()=>{
 const p=g.createProfile(1000);p.level=150;p.skillBook=g.restoreSkillBook(null,150);p.skillBook.loadout={active:[null,null,null,null],passive:[null,null,null],ultimate:[null],beast:[null]};
 for(const id of g.GATE_IDS)assert.equal(g.gateCounter(p,id),0);
 p.growthTree=regionTree('ward',40);assert.ok(g.branchPoints(p,'ward')>=40);assert.equal(g.branchPoints(p,'ward'),g.treeSpent(p.growthTree));assert.equal(g.gateCounter(p,'survival'),.75);assert.equal(g.gateCounter(p,'single'),0);
 p.skillBook.loadout.active=['stance','parry',null,null];p.skillBook.loadout.passive=['resolve','reserve','breath'];assert.equal(g.gateCounter(p,'survival'),1);
 const gate={type:'survival',boss:false,pressure:1};assert.equal(g.gateEffect(p,gate).effect,.25);p.growthTree=[];p.skillBook.loadout.passive=[null,null,null];assert.ok(Math.abs(g.gateEffect(p,gate).effect-.85)<1e-9);
 assert.match(g.gateText(g.gateEffect(p,gate)),/^생존 관문 · 적이 주는 피해 \+85% · 대응 20%/);
 // Every hinted skill exists.
 for(const t of Object.values(g.GATE_TYPES))for(const id of t.skills)assert.ok(g.SKILL_BY_ID[id],id);
});

function gateStage(type){for(const st of g.STAGES)for(let n=1;n<=9;n++){const gate=g.stageGate(st.id,n);if(gate?.type===type&&st.id>1)return {chapter:st.id,stage:n};}}
function arena(chapter,stage,setup){const p=g.createProfile(1000);p.level=150;p.skillBook=g.restoreSkillBook(null,150);p.skillBook.loadout={active:[null,null,null,null],passive:[null,null,null],ultimate:[null],beast:[null]};p.unlockedStage=chapter;p.clearedStage=chapter-1;p.stageProgress[chapter-1]=stage-1;setup?.(p);const s=g.createGame(p);assert.ok(g.launch(s,chapter,stage));return s;}
const spawn=(s,type,elite=false)=>{s.spawns=[{id:s.nextId++,type,boss:false,elite,x:s.player.x+400,y:s.player.y,delay:0,warning:0}];g.advanceGame(s,.001);return s.enemies.at(-1);};

test('gates act on spawned enemies: survival damage, swarm and single health, defense damage taken; counters soften them',()=>{
 for(const type of ['survival','swarm','single']){const {chapter,stage}=gateStage(type);const s=arena(chapter,stage);assert.equal(s.run.gate.type,type);assert.equal(s.run.gate.effect,s.run.gate.pressure);
  s.enemies=[];const st=g.STAGES[chapter-1],m=1+s.run.gate.effect;
  const mob=spawn(s,'skitter'),elite=spawn(s,'bulwark',true);
  const plain=arena(chapter,stage);plain.run.gate=null;plain.enemies=[];const mob0=spawn(plain,'skitter'),elite0=spawn(plain,'bulwark',true);
  const k=1;
  if(type==='survival'){assert.ok(Math.abs(mob.damage/mob0.damage-m)<1e-9);assert.ok(Math.abs(mob.maxHp/mob0.maxHp-k)<.05);}
  if(type==='swarm'){assert.ok(Math.abs(mob.maxHp/mob0.maxHp/k-m)<.05);assert.ok(Math.abs(elite.maxHp/elite0.maxHp-k)<.05);}
  if(type==='single'){assert.ok(Math.abs(elite.maxHp/elite0.maxHp/k-m)<.05);assert.ok(Math.abs(mob.maxHp/mob0.maxHp-k)<.05);}
  assert.ok(st.hpScale>0);}
 const {chapter,stage}=gateStage('defense');const s=arena(chapter,stage);s.enemies=[];const e=spawn(s,'bulwark');assert.ok(Math.abs(e.gateGuard-(1+s.run.gate.effect))<1e-9);
 const countered=arena(chapter,stage,p=>{p.growthTree=regionTree('art',40);});assert.ok(Math.abs(countered.run.gate.effect-countered.run.gate.pressure*(1-.75*.75))<1e-3);
 // Ordinary monsters hit THREAT.mob (2) times harder outside dungeons (0.134).
 {const s=arena(2,1);s.run.gate=null;s.enemies=[];const mob=spawn(s,'skitter');const d=g.createGame(g.createProfile(1000));g.launchDungeon(d,'gold',1);d.enemies=[];const dm=spawn(d,'skitter');assert.equal(g.THREAT.mob,2);const boss=arena(2,1);boss.run.gate=null;boss.enemies=[];boss.spawns=[{id:boss.nextId++,type:'skitter',boss:true,elite:false,x:boss.player.x+400,y:boss.player.y,delay:0,warning:0}];g.advanceGame(boss,.001);const b=boss.enemies.at(-1);assert.ok(Math.abs(b.damage-26*g.STAGES[1].damageScale)<1e-9,'bosses unchanged '+b.damage);assert.ok(mob.damage>8*g.STAGES[1].damageScale*1.1,'mob '+mob.damage);assert.ok(dm.damage<mob.damage);}
 // Dungeons and raids have no gates.
 const d=g.createGame(g.createProfile(1000));assert.ok(g.launchDungeon(d,'gold',1));assert.equal(d.run.gate,null);
});

test('the automatic hunter dodges a monster attack or shot only 30% of the time, decided once per attack',()=>{
 assert.equal(g.AUTO_DODGE_CHANCE,.3);let enemy=0,shot=0;for(let id=1;id<=3000;id++){if(g.autoDodges('enemy',id,id%5))enemy++;if(g.autoDodges('shot',id))shot++;}
 assert.ok(Math.abs(enemy/3000-.3)<.03&&Math.abs(shot/3000-.3)<.03,enemy+'/'+shot);
 for(let id=1;id<50;id++)assert.equal(g.autoDodges('enemy',id,2),g.autoDodges('enemy',id,2));
});

test('0.139: 정예/악몽 gates press ×0.8 of the same chapter on 일반',()=>{
 for(const [c,n]of [[51,10],[12,6],[60,10]]){const base=g.stageGate(c,n);for(const d of [1,2]){const m=g.stageGate(c,n,d);assert.equal(m.type,base.type);assert.ok(Math.abs(m.pressure-base.pressure*.8)<.002,c+'-'+n+' '+d);}}
 assert.equal(g.stageGate(12,1,1),null);
});
