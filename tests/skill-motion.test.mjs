import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as g from '../dist/game-engine.js';
import {DIRECTION_VIEWS} from '../dist/motion.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url),'utf8'));
function fixture(id){const p=g.createProfile();p.level=50;p.skillBook=g.restoreSkillBook(null,50);const d=g.SKILL_BY_ID[id];p.skillBook.loadout={active:[null,null],passive:[null,null,null],ultimate:[null]};p.skillBook.loadout[d.kind][0]=id;const s=g.createGame(p);g.launch(s);s.spawns=[{id:999,type:'bulwark',x:s.player.x+120,y:s.player.y,delay:0,warning:1}];g.advanceGame(s,.001);s.spawns=[];s.barrels=[];s.enemies[0].hp=s.enemies[0].maxHp=100000;s.enemies[0].speed=0;s.enemies[0].cooldown=1000;s.enemies[0].guard=0;s.enemies[0].guardMax=0;s.player.invulnerable=100;return s;}
const advance=(s,t)=>{for(let time=0;time<t-.00001;time+=.005)g.advanceGame(s,.005);};
test('every active and ultimate has a distinct authored pose timeline and valid eight-direction equipment sockets',()=>{
 const rows=g.SKILL_CATALOG.filter(d=>d.kind!=='passive'),signatures=new Set();assert.equal(Object.keys(g.SKILL_MOTIONS).length,19);
 for(const d of rows){const s=fixture(d.id);assert.ok(g.useSkill(s,d.id,{x:1,y:0}),d.id);const m=s.skillRuntime.motion,trace=[];for(const fraction of [.05,.25,.5,.75,.95]){const pose=g.sampleSkillMotion(m,m.startedAt+m.duration*fraction);assert.ok(pose,d.id);trace.push([pose.action,pose.frame,pose.heading,pose.lift,pose.offsetX,pose.offsetY,pose.scaleY,pose.gearTurn]);for(let heading=0;heading<8;heading++){const clipId=manifest.directions.hunter[pose.action][DIRECTION_VIEWS[heading].key],clip=manifest.clips[clipId],frame=Math.min(pose.frame,clip.frames.length-1);assert.ok(manifest.equipmentSockets[clipId][frame],d.id);assert.ok(Number.isFinite(pose.lift)&&Number.isFinite(pose.offsetX));assert.ok(pose.lift>=0&&pose.lift<=48.01);}}
  const signature=JSON.stringify(trace);assert.ok(!signatures.has(signature),'reused timeline '+d.id);signatures.add(signature);
 }
});
test('damage jobs and authored contacts share exact cast timing including passive accelerated quickdraw',()=>{
 for(const id of ['crescent','dance','draw','triple','returning','field','bloodmoon','eclipse']){const s=fixture(id);if(id==='draw'){s.profile.skillBook.loadout.passive=['opening',null,null];g.skillPerfect(s);}g.useSkill(s,id,{x:1,y:0});const m=s.skillRuntime.motion;for(const [i,job]of s.skillRuntime.jobs.entries()){assert.ok(Math.abs(job.at-m.startedAt-m.impactTimes[i])<1e-9,id);assert.ok(g.sampleSkillMotion(m,job.at).contact,id+' contact');}}
});
test('travel progresses through the actual world, clips at bounds and cancellation cannot resume movement',()=>{
 for(const id of ['gale','echo','plunge']){const s=fixture(id),x=s.player.x;g.useSkill(s,id,{x:1,y:0});assert.equal(s.player.x,x,id+' must not teleport');const t=s.skillRuntime.travel;advance(s,t.duration/2);assert.ok(Math.abs(s.player.x-x)>5);assert.ok(Math.abs(s.player.x-x)<Math.abs(t.toX-x));const halfway=s.player.x;g.dash(s,{x:0,y:1});assert.equal(s.skillRuntime.motion,null);assert.equal(s.skillRuntime.travel,null);advance(s,.4);assert.ok(Math.abs(s.player.x-halfway)<.1,id+' cancelled movement');}
 const s=fixture('gale');s.player.x=s.bounds.width-s.bounds.padding-4;g.useSkill(s,'gale',{x:1,y:0});advance(s,.2);assert.equal(s.player.x,s.bounds.width-s.bounds.padding);
});
test('presentation freezes with game time, has bounded ghosts and releases on hurt, stage or camp',()=>{
 const s=fixture('echo');g.useSkill(s,'echo',{x:1,y:0});advance(s,.04);const before=JSON.stringify(g.skillActorPose(s)),position=s.player.x;s.paused=true;advance(s,.5);assert.equal(JSON.stringify(g.skillActorPose(s)),before);assert.equal(s.player.x,position);assert.ok(g.skillGhosts(s).length<=4);s.paused=false;g.interruptSkill(s);assert.equal(g.skillActorPose(s),null);assert.deepEqual(g.skillGhosts(s),[]);g.returnToCamp(s);assert.equal(s.skillRuntime.motion,null);
});
test('parry success has a separate counter pose while basic attacks always own their own animation',()=>{
 const s=fixture('parry');g.useSkill(s,'parry',{x:1,y:0});const held=g.skillActorPose(s);assert.equal(held.frame,1);s.player.invulnerable=0;g.incomingSkillDamage(s,20,{x:s.player.x+50,y:s.player.y},{stats:g.playerStats,hit(){return 'hit';},visual(){}});assert.equal(g.skillActorPose(s).frame,3);s.player.action='attack';s.player.swing={skillVisualOnly:false};assert.equal(g.skillActorPose(s),null);
});
