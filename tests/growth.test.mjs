import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {freezeCombat} from './combat-fixture.mjs';

// Alpha 0.131 성장: 성장 포인트 (one per level) pay for 능력치 단련 (shared) and 성장 트리 (saved per build).
const profile=(level)=>{const p=g.createProfile(1000);p.level=level;p.skillBook=g.restoreSkillBook(null,level);return p;};

test('points come from levels; training ranks open every five levels and the tree is taken in branch order',()=>{
 const p=profile(31),s=g.createGame(p);assert.equal(g.growthPointsTotal(p),30);assert.equal(g.trainingCap(31),7);assert.equal(g.trainingCap(1),1);assert.equal(g.trainingCap(200),g.TRAINING_MAX);
 for(let i=0;i<7;i++)assert.ok(g.trainStat(s,'power'));assert.equal(g.trainStat(s,'power'),false);assert.equal(g.trainStatus(p,'power'),'Lv.36에 다음 단계');assert.equal(g.growthPoints(p),23);
 assert.equal(g.learnGrowthNode(s,'blade2'),false);assert.equal(g.nodeStatus(p,'blade2'),'앞 노드 필요');assert.ok(g.learnGrowthNode(s,'blade1'));assert.ok(g.learnGrowthNode(s,'blade2'));assert.equal(g.growthPoints(p),18);
 for(const id of ['ward1','ward2','ward3','ward4'])assert.ok(g.learnGrowthNode(s,id),id);assert.equal(g.growthPoints(p),4);assert.equal(g.learnGrowthNode(s,'ward5'),false);assert.equal(g.nodeStatus(p,'ward5'),'성장 포인트 부족');
 assert.equal(g.TREE_COST,66);assert.equal(Object.keys(g.TREE_NODES).length,15);
 assert.ok(g.resetGrowthTree(s));assert.equal(g.growthPoints(p),23);assert.ok(g.resetTrainingStats(s));assert.equal(g.growthPoints(p),30);
 g.launch(s,1);assert.equal(g.trainStat(s,'power'),false);assert.equal(g.learnGrowthNode(s,'blade1'),false);assert.equal(g.resetTrainingStats(s),false);
});

test('levels bring the old forge/숙련 values by Lv.25; training and tree bonuses add on top',()=>{
 const l1=g.levelGrowth(1),l25=g.levelGrowth(25),l90=g.levelGrowth(90);assert.equal(l1.damage,0);assert.deepEqual(l25,l90);assert.ok(Math.abs(l25.damage-1.36)<1e-9&&Math.abs(l25.reduction-.27)<1e-9&&Math.abs(l25.hp-208)<1e-9);
 const base=g.playerStats(profile(150)),p=profile(150);p.training={power:10,vitality:10,guard:10,precision:10,tempo:10,stride:10};p.growthTree=['blade1','blade2','blade3','ward1','ward2'];const st=g.playerStats(p);
 assert.ok(Math.abs(base.damage-24*(1+149*.035+1.36))<1e-9);assert.ok(Math.abs(st.damage-24*(1+149*.035+1.36+10*.05)*1.08)<1e-9,base.damage+' → '+st.damage);
 assert.ok(Math.abs(st.maxHp-(base.maxHp+120)*1.08)<.01);assert.ok(Math.abs(st.reduction-(.27+.1+.04))<1e-9);assert.ok(Math.abs(st.crit-(.05+.05+.05))<1e-9);
 assert.ok(Math.abs(st.attackSpeed-(1+.3+.1+.06))<1e-9);assert.ok(Math.abs(st.speed-280*(1+.18+.1))<1e-9);assert.equal(st.collection,base.collection+50);
});

test('saves keep training and the tree, trim hostile values, and builds remember their own tree',()=>{
 const p=profile(40);p.training.power=8;p.training.guard=3;p.growthTree=['art1','art2'];
 const r=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.deepEqual(r.training,p.training);assert.deepEqual(r.growthTree,['art1','art2']);
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),training:{power:99,vitality:-4,bogus:5},growthTree:['art2','blade1','__proto__','blade2']},1000);
 assert.equal(hostile.training.power,g.trainingCap(40));assert.equal(hostile.training.vitality,0);assert.equal(hostile.training.bogus,undefined);assert.deepEqual(hostile.growthTree,['blade1','blade2']);
 // More ranks than points (e.g. a lower level) are trimmed, largest stat first.
 const low=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),level:5,training:{power:5,vitality:5}},1000);assert.ok(g.trainingSpent(low)<=4);assert.ok(g.growthPoints(low)>=0);
 const s=g.createGame(p);assert.ok(g.saveBuild(s,0,'기술'));assert.ok(g.resetGrowthTree(s));for(const id of ['ward1','ward2'])g.learnGrowthNode(s,id);assert.ok(g.saveBuild(s,1,'수비'));
 assert.equal(g.applyBuild(s,0).ok,true);assert.deepEqual(s.profile.growthTree,['art1','art2']);assert.equal(g.applyBuild(s,1).ok,true);assert.deepEqual(s.profile.growthTree,['ward1','ward2']);
 const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.deepEqual(saved.savedBuilds[0].tree,['art1','art2']);assert.deepEqual(saved.savedBuilds[1].tree,['ward1','ward2']);
});

function arena(setup){const p=profile(60);setup?.(p);const s=g.createGame(p);g.launch(s,1);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1e6;s.barrels=[];s.auto=false;s.player.invulnerable=999;
 const e={...s.enemies[0],id:s.nextId++,type:'bulwark',elite:true,boss:false,x:s.player.x+90,y:s.player.y,hp:1e7,maxHp:1e7,action:'walk',actionTime:0,speed:0,cooldown:999,guard:0,guardMax:0,plate:0,dead:false,damage:1,radius:58};s.enemies=[e];return {s,e};}

test('tree keystones and branch nodes act in combat: execute, finisher, drain, low-health guard, stamina, skills',()=>{
 const swing=(setup,hp)=>{const {s,e}=arena(setup);if(hp)e.hp=hp;const before=e.hp;s.player.combo=2;s.player.action='idle';s.player.attackCooldown=0;s.player.comboWindow=1;g.attack(s,{x:1,y:0});for(let i=0;i<30;i++)g.advanceGame(s,.025);return before-e.hp;};
 const plain=swing(),finisher=swing(p=>p.growthTree=['blade1','blade2','blade3','blade4','blade5']);assert.ok(finisher>plain*1.08*1.45,plain+' → '+finisher);
 const low=swing(null,3e6),exec=swing(p=>p.growthTree=['blade1','blade2','blade3','blade4'],3e6);assert.ok(exec>low*1.08*1.15,low+' → '+exec);
 {const {s,e}=arena(p=>p.growthTree=['ward1','ward2','ward3']);s.player.hp=100;s.player.action='idle';s.player.attackCooldown=0;g.attack(s,{x:1,y:0});for(let i=0;i<20;i++)g.advanceGame(s,.025);assert.ok(s.player.hp>100,'흡혈');}
 assert.equal(g.treeBonus({growthTree:['ward1','ward2','ward3','ward4','ward5']}).lowHpGuard,.15);
 const stamina=tree=>{const {s}=arena(p=>p.growthTree=tree);s.enemies=[];s.player.stamina=10;for(let i=0;i<40;i++)g.advanceGame(s,.025);return s.player.stamina;};assert.ok(stamina(['art1'])>stamina([])+1);
 const cd=g.skillCooldown(profile(60),'crescent'),p=profile(60);p.growthTree=['art1','art2','art3'];assert.ok(Math.abs(g.skillCooldown(p,'crescent')-cd*.92)<1e-9);assert.ok(Math.abs(g.skillAreaScale(p,'dance')/g.skillAreaScale(profile(60),'dance')-1.1)<1e-9);
 const skill=tree=>{const {s,e}=arena(p=>{p.growthTree=tree;p.skillBook.loadout.active=['crescent',null,null,null];});s.player.action='idle';assert.ok(g.useSkill(s,'crescent',{x:1,y:0,targetId:e.id}));for(let i=0;i<20;i++)g.advanceGame(s,.025);return {dealt:1e7-e.hp,s};};
 const a=skill([]),b=skill(['art1','art2','art3','art4']);assert.ok(Math.abs(b.dealt/a.dealt-1.15)<.03,a.dealt+' → '+b.dealt);
 const fury=skill(['art1','art2','art3','art4','art5']);assert.ok(fury.s.skillRuntime.treeFuryUntil>fury.s.run.time,'연환');
});
