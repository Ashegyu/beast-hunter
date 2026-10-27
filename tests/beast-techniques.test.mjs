import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as g from '../dist/game-engine.js';
import {freezeCombat} from './combat-fixture.mjs';

// Alpha 0.125 괴수 기술: one technique per chapter boss, learned from the boss, equipped in its own slot.
function profile(cleared=60){const p=g.createProfile(1000);p.unlockedStage=Math.min(60,cleared+1);p.clearedStage=cleared;p.stageProgress=g.STAGES.map(c=>c.id<=cleared?10:0);p.bossMastery=g.STAGES.map(c=>c.id<=cleared?2:-1);p.difficultyProgress=[1,2].map(()=>g.STAGES.map(c=>c.id<=cleared?10:0));p.level=150;p.skillBook=g.restoreSkillBook(null,150);return p;}
function killBoss(p,chapter,difficulty=0){
 const s=g.createGame(p);assert.equal(g.launch(s,chapter,10,null,difficulty),true);s.spawns=[];s.barrels=[];s.run.bossSpawned=true;s.player.invulnerable=999;
 const e={id:s.nextId++,species:g.STAGES[chapter-1].bossSpecies,type:'bulwark',elite:false,boss:true,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[e];
 s.projectiles.push({id:s.nextId++,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});g.advanceGame(s,.025);assert.ok(e.dead);return s;
}

test('sixty techniques: one per chapter boss, region element, own icon, three grades',()=>{
 const rows=g.BEAST_TECHNIQUES;assert.equal(rows.length,60);assert.equal(new Set(rows.map(d=>d.id)).size,60);
 for(const c of g.STAGES){const d=rows.find(t=>t.chapter===c.id);assert.equal(d.bossSpecies,c.bossSpecies);assert.equal(d.kind,'beast');assert.equal(d.color,g.BEAST_ELEMENTS[c.biome].color);assert.ok(fs.existsSync(new URL('../dist/'+d.icon,import.meta.url)),d.icon);assert.ok(d.damage>0&&d.cooldown>0);}
 assert.deepEqual(g.BEAST_GRADES.slice(1).map(x=>x.name),['기본','강화','극']);assert.ok(g.BEAST_GRADES[3].damage>g.BEAST_GRADES[2].damage&&g.BEAST_GRADES[2].damage>=1.5);
 const p=profile();p.beastSkills={'beast-boar':1,'beast-wargod':3};assert.equal(g.skillRank(p,'beast-boar'),1);assert.equal(g.skillRank(p,'beast-crabking'),0);assert.equal(g.skillValue(p,'beast-wargod'),Math.round(g.SKILL_BY_ID['beast-wargod'].damage*2.3));
 assert.match(g.skillNumbers(p,'beast-wargod'),/극 · .*재사용 7초 · 타격 \+1/);
 assert.deepEqual(g.skillSlots(1),{active:1,passive:1,ultimate:0,beast:1});
});

test('the first kill teaches the basic technique; 정예/악몽 kills may teach 강화/극 and never lower a grade',()=>{
 const p=profile(60);p.beastSkills={};const s=killBoss(p,31);assert.equal(s.profile.beastSkills['beast-crabking'],1);assert.deepEqual(s.run.beastLearned,{id:'beast-crabking',grade:1,before:0});
 const again=killBoss(s.profile,31);assert.equal(again.run.beastLearned,null);assert.equal(again.profile.beastSkills['beast-crabking'],1);
 // Find hunts whose deterministic roll teaches the next grade (12% 정예, 8% 악몽).
 const find=(difficulty,hit)=>{for(let h=0;h<500;h++){const q=structuredClone(s.profile);q.hunts=h;const probe=g.createGame(q);probe.profile.hunts=h+1;probe.difficulty=difficulty;if((g.beastRoll(probe,31)<g.BEAST_GRADE_CHANCE[difficulty])===hit)return h;}throw Error('no seed');};
 for(const [difficulty,grade]of [[1,2],[2,3]]){const miss=structuredClone(s.profile);miss.hunts=find(difficulty,false);assert.equal(killBoss(miss,31,difficulty).profile.beastSkills['beast-crabking'],1);
  const hit=structuredClone(s.profile);hit.hunts=find(difficulty,true);const won=killBoss(hit,31,difficulty);assert.equal(won.profile.beastSkills['beast-crabking'],grade);assert.equal(won.run.beastLearned.grade,grade);}
 const top=structuredClone(s.profile);top.beastSkills['beast-crabking']=3;top.hunts=find(1,true);assert.equal(killBoss(top,31,1).profile.beastSkills['beast-crabking'],3);
 let hits=0;const q=structuredClone(s.profile);for(let h=0;h<2000;h++){q.hunts=h;const probe=g.createGame(q);probe.profile.hunts=h+1;probe.difficulty=1;if(g.beastRoll(probe,31)<.12)hits++;}assert.ok(hits>180&&hits<300,String(hits));
});

test('learned grades and the slot survive saves; older saves learn the basic technique of every boss already beaten',()=>{
 const p=profile(12);p.beastSkills={'beast-boar':2};p.skillBook.loadout.beast=['beast-boar'];const r=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(r.beastSkills['beast-boar'],2);assert.deepEqual(r.skillBook.loadout.beast,['beast-boar']);
 const old=JSON.parse(g.encodeProfile(p,1000));delete old.beastSkills;const migrated=g.restoreProfile(old,1000);assert.deepEqual(Object.keys(migrated.beastSkills).sort(),g.BEAST_TECHNIQUES.filter(d=>d.chapter<=12).map(d=>d.id).sort());assert.ok(Object.values(migrated.beastSkills).every(v=>v===1));
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),beastSkills:{'beast-boar':9,'beast-drake':-1,bogus:3}},1000);assert.deepEqual(hostile.beastSkills,{'beast-boar':3});
 // Unlearned techniques cannot be equipped; learned ones go only in the 괴수 기술 slot.
 const s=g.createGame(profile());s.profile.beastSkills={'beast-witch':1};assert.equal(g.equipSkill(s,'beast-drake',0),false);assert.equal(g.equipSkill(s,'beast-witch',1),false);assert.equal(g.equipSkill(s,'beast-witch',0),true);assert.deepEqual(s.profile.skillBook.loadout.beast,['beast-witch']);
});

test('a technique casts from its slot with its grade: more damage, wider, faster and one more hit at 극, plus its element',()=>{
 const fight=(id,grade,steps=120)=>{const p=profile();p.beastSkills={[id]:grade};p.skillBook.loadout.beast=[id];p.skillBook.loadout.active=[null,null,null,null];const s=g.createGame(p);g.launch(s,1);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1e6;s.barrels=[];s.player.invulnerable=999;s.player.stamina=100;
  const e={...s.enemies[0]??{},id:s.nextId++,type:'bulwark',elite:true,boss:false,x:s.player.x+120,y:s.player.y,hp:1e7,maxHp:1e7,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,guardMax:0,dead:false,group:null,wave:s.run.wave,runStage:s.run.stage,damage:1,radius:58,lookX:0,lookY:1};s.enemies=[e];s.player.action='idle';
  assert.ok(g.useSkill(s,id,{x:1,y:0,targetId:e.id}));const cd=s.skillRuntime.cooldowns[id];for(let i=0;i<steps;i++)g.advanceGame(s,.025);return {s,e,cd,dealt:1e7-e.hp};};
 const one=fight('beast-witch',1),three=fight('beast-witch',3);assert.ok(three.dealt>one.dealt*2,one.dealt+' → '+three.dealt);assert.ok(Math.abs(three.cd-one.cd*.7)<.03);
 const frost=fight('beast-serpent',1,20);assert.ok(frost.e.chillRemaining>0,'빙결');
 const forest=fight('beast-spiderqueen',1,20);assert.ok(forest.e.bleedTicks>0,'출혈');
 const divine=fight('beast-sphinx',2,4);assert.ok(divine.s.uniqueState.shield>=divine.s.player.maxHp*.08*1.5-1,'성광 보호막');
 // Automatic battle casts the slotted technique on its own.
 const p=profile();p.beastSkills={'beast-boar':1};p.skillBook.loadout.beast=['beast-boar'];const s=g.createGame(p);s.auto=true;g.launch(s,30,1);let cast=false;for(let i=0;i<1200&&s.phase==='playing'&&!cast;i++){g.advanceGame(s,.05);cast=(s.skillRuntime.cooldowns['beast-boar']??0)>0;}assert.ok(cast);
});
