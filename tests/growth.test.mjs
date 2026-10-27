import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {freezeCombat} from './combat-fixture.mjs';

// Alpha 0.139 성장: 능력치 포인트 (one per level) pay for 능력치 단련 (shared, no cap, diminishing past 20/60),
// 트리 포인트 (one per two levels + ★30 chests) for the 성장 트리 web (saved per build).
const profile=(level)=>{const p=g.createProfile(1000);p.level=level;p.skillBook=g.restoreSkillBook(null,level);return p;};
const BLADE_FINISHER=['blade-r','blade-1','blade-n','blade-a1','blade-a2','blade-a3','blade-a4','blade-a5','blade-a6'];
const BLADE_EXECUTE=['blade-r','blade-1','blade-n','blade-b1','blade-b2','blade-b3','blade-b4','blade-b5','blade-b6'];

test('two point pools: training is free of level caps, the tree is learned along links',()=>{
 const p=profile(31),s=g.createGame(p);assert.equal(g.trainingPointsTotal(p),30);assert.equal(g.treePointsTotal(p),15);assert.equal(g.growthPointsTotal(p),45);
 for(let i=0;i<25;i++)assert.ok(g.trainStat(s,'power'),'rank '+i);assert.equal(p.training.power,25);assert.equal(g.trainingPoints(p),5);assert.equal(g.treePoints(p),15,'단련은 트리 포인트를 쓰지 않는다');
 for(let i=0;i<5;i++)assert.ok(g.trainStat(s,'guard'));assert.equal(g.trainStat(s,'guard'),false);assert.equal(g.trainStatus(p,'guard'),'능력치 포인트 부족');
 assert.equal(g.learnGrowthNode(s,'blade-n'),false);assert.equal(g.nodeStatus(p,'blade-n'),'이어진 노드 필요');
 for(const id of ['blade-r','blade-1','blade-n'])assert.ok(g.learnGrowthNode(s,id),id);assert.equal(g.treePoints(p),5);
 // The ring links every start: ward-r touches blade-r, so it opens without the 중심 path being the only way.
 assert.equal(g.nodeStatus(p,'ward-r'),'');assert.ok(g.learnGrowthNode(s,'ward-r'));
 assert.ok(g.learnGrowthNode(s,'ward-1'));assert.equal(g.treePoints(p),1);assert.equal(g.nodeStatus(p,'ward-n'),'트리 포인트 부족');
 assert.equal(g.TREE_COST,308);assert.equal(Object.keys(g.TREE_NODES).length,81);
 {const top=profile(g.MAX_LEVEL);top.starChests=g.STAGES.map(()=>7);assert.equal(g.treePointsTotal(top),99+g.STAGES.length);assert.ok(g.treePointsTotal(top)<=g.TREE_COST*.52,'Lv.200에 ★30 상자를 모두 받아도 절반쯤만 찍는다');}
 // Giving back: only nodes nothing hangs on.
 assert.equal(g.forgetGrowthNode(s,'ward-r'),false);assert.equal(g.forgetStatus(p,'ward-r'),'뒤에 이어진 노드가 있음');assert.ok(g.forgetGrowthNode(s,'ward-1'));assert.equal(g.treePoints(p),3);
 // blade-r still carries blade-1.
 assert.equal(g.forgetStatus(p,'blade-r'),'뒤에 이어진 노드가 있음');
 assert.ok(g.resetGrowthTree(s));assert.equal(g.treePoints(p),15);assert.ok(g.resetTrainingStats(s));assert.equal(g.trainingPoints(p),30);
 g.launch(s,1);assert.equal(g.trainStat(s,'power'),false);assert.equal(g.learnGrowthNode(s,'blade-r'),false);assert.equal(g.forgetGrowthNode(s,'blade-r'),false);assert.equal(g.resetTrainingStats(s),false);
});

test('training ranks count less past 20 and 60, so one stat cannot run away',()=>{
 assert.equal(g.trainingEffective(20),20);assert.equal(g.trainingEffective(60),44);assert.equal(g.trainingEffective(199),85.7);assert.equal(g.trainingRate(19),1);assert.equal(g.trainingRate(20),.6);assert.equal(g.trainingRate(60),.3);
 const p=profile(200);p.training.guard=199;assert.equal(g.playerStats(p).reduction,.5,'피해 감소 상한');p.training.guard=0;p.training.power=60;
 const base=profile(200);assert.ok(Math.abs(g.playerStats(p).damage-24*(1+199*.035+1.36+44*.05))<1e-9);assert.ok(g.playerStats(p).damage>g.playerStats(base).damage);
});

test('levels bring the old forge/숙련 values by Lv.25; training and tree bonuses add on top',()=>{
 const l1=g.levelGrowth(1),l25=g.levelGrowth(25),l90=g.levelGrowth(90);assert.equal(l1.damage,0);assert.deepEqual(l25,l90);assert.ok(Math.abs(l25.damage-1.36)<1e-9&&Math.abs(l25.reduction-.27)<1e-9&&Math.abs(l25.hp-208)<1e-9);
 const base=g.playerStats(profile(150)),p=profile(150);p.training={power:10,vitality:10,guard:10,precision:10,tempo:10,stride:10};p.growthTree=['blade-r','blade-1','blade-n','ward-r','ward-1','ab-r','ab-1'];const st=g.playerStats(p);
 assert.ok(Math.abs(base.damage-24*(1+149*.035+1.36))<1e-9);assert.ok(Math.abs(st.damage-24*(1+149*.035+1.36+10*.05)*1.165)<1e-9,base.damage+' → '+st.damage);
 assert.ok(Math.abs(st.maxHp-(base.maxHp+120)*1.065)<.01);assert.ok(Math.abs(st.reduction-(.27+.1))<1e-9);assert.ok(Math.abs(st.crit-(.05+.05))<1e-9);
 assert.ok(Math.abs(st.attackSpeed-(1+.3+.1))<1e-9);assert.ok(Math.abs(st.speed-280*(1+.18+.1+.05))<1e-9);assert.ok(Math.abs(st.range-135*(1+.32+.025))<1e-9);assert.equal(st.collection,base.collection+50);
});

test('saves keep training and the tree, trim hostile values, and builds remember their own tree',()=>{
 const p=profile(40);p.training.power=30;p.training.guard=3;p.growthTree=['art-r','art-1'];
 const r=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.deepEqual(r.training,p.training);assert.deepEqual(r.growthTree,['art-r','art-1']);
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),training:{power:99,vitality:-4,bogus:5},growthTree:['art-1','blade-r','__proto__','core','blade-n','blade1']},1000);
 assert.equal(hostile.training.power,39);assert.equal(hostile.training.vitality,0);assert.equal(hostile.training.bogus,undefined);assert.deepEqual(hostile.growthTree,['blade-r'],'떨어진 노드·옛 노드·중심은 버린다');
 // More ranks than points (e.g. a lower level) are trimmed, largest stat first; a tree over its points loses the farthest nodes.
 const low=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),level:5,training:{power:5,vitality:5},growthTree:['art-r','art-1','art-n']},1000);assert.ok(g.trainingSpent(low)<=4);assert.ok(g.trainingPoints(low)>=0);assert.deepEqual(low.growthTree,['art-r']);
 const s=g.createGame(p);assert.ok(g.saveBuild(s,0,'기술'));assert.ok(g.resetGrowthTree(s));for(const id of ['ward-r','ward-1'])g.learnGrowthNode(s,id);assert.ok(g.saveBuild(s,1,'수비'));
 assert.equal(g.applyBuild(s,0).ok,true);assert.deepEqual(s.profile.growthTree,['art-r','art-1']);assert.equal(g.applyBuild(s,1).ok,true);assert.deepEqual(s.profile.growthTree,['ward-r','ward-1']);
 const saved=g.restoreProfile(g.encodeProfile(s.profile,1000),1000);assert.deepEqual(saved.savedBuilds[0].tree,['art-r','art-1']);assert.deepEqual(saved.savedBuilds[1].tree,['ward-r','ward-1']);
});

test('every node is reachable from the 중심, the graph has loops and the web stays inside its box',()=>{
 assert.deepEqual(g.cleanTree(g.TREE_ORDER),[...g.TREE_ORDER]);assert.ok(g.TREE_EDGES.length>g.TREE_ORDER.length,'고리가 있다');
 for(const n of Object.values(g.TREE_NODES)){assert.ok(n.x>=0&&n.x<=g.TREE_BOX.width&&n.y>=0&&n.y<=g.TREE_BOX.height,n.id);assert.ok(n.text&&n.name,n.id);}
 const kinds=Object.values(g.TREE_NODES).map(n=>n.kind);assert.equal(kinds.filter(k=>k==='keystone').length,6);assert.equal(kinds.filter(k=>k==='core').length,1);
});

function arena(setup){const p=profile(60);setup?.(p);const s=g.createGame(p);g.launch(s,1);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1e6;s.barrels=[];s.auto=false;s.player.invulnerable=999;
 const e={...s.enemies[0],id:s.nextId++,type:'bulwark',elite:true,boss:false,x:s.player.x+90,y:s.player.y,hp:1e7,maxHp:1e7,action:'walk',actionTime:0,speed:0,cooldown:999,guard:0,guardMax:0,plate:0,dead:false,damage:1,radius:58};s.enemies=[e];return {s,e};}

test('tree keystones and branch nodes act in combat: execute, finisher, drain, low-health guard, stamina, skills',()=>{
 const swing=(setup,hp)=>{const {s,e}=arena(setup);if(hp)e.hp=hp;const before=e.hp;s.player.combo=2;s.player.action='idle';s.player.attackCooldown=0;s.player.comboWindow=1;g.attack(s,{x:1,y:0});for(let i=0;i<30;i++)g.advanceGame(s,.025);return before-e.hp;};
 const plain=swing(),finisher=swing(p=>p.growthTree=BLADE_FINISHER);assert.ok(finisher>plain*1.13*1.55,plain+' → '+finisher);
 const low=swing(null,3e6),exec=swing(p=>p.growthTree=BLADE_EXECUTE,3e6);assert.ok(exec>low*1.13*1.25,low+' → '+exec);
 {const {s,e}=arena(p=>p.growthTree=['ward-r','ward-1','ward-n','ward-b1','ward-b2','ward-b3']);s.player.hp=100;s.player.action='idle';s.player.attackCooldown=0;g.attack(s,{x:1,y:0});for(let i=0;i<20;i++)g.advanceGame(s,.025);assert.ok(s.player.hp>100,'흡혈');}
 assert.equal(g.treeBonus({growthTree:['ward-r','ward-1','ward-n','ward-a1','ward-a2','ward-a3','ward-a4']}).lowHpGuard,.19);
 const stamina=tree=>{const {s}=arena(p=>p.growthTree=tree);s.enemies=[];s.player.stamina=10;for(let i=0;i<40;i++)g.advanceGame(s,.025);return s.player.stamina;};assert.ok(stamina(['art-r','art-1'])>stamina([])+1);
 const cd=g.skillCooldown(profile(60),'crescent'),p=profile(60);p.growthTree=['art-r','art-1','art-n','art-a1','art-a2','art-a3','art-a4'];assert.ok(Math.abs(g.skillCooldown(p,'crescent')-cd*.875)<1e-9);assert.ok(Math.abs(g.skillAreaScale(p,'dance')/g.skillAreaScale(profile(60),'dance')-1.04)<1e-9);
 const skill=tree=>{const {s,e}=arena(p=>{p.growthTree=tree;p.skillBook.loadout.active=['crescent',null,null,null];});s.player.action='idle';assert.ok(g.useSkill(s,'crescent',{x:1,y:0,targetId:e.id}));for(let i=0;i<20;i++)g.advanceGame(s,.025);return {dealt:1e7-e.hp,s};};
 const a=skill([]),b=skill(['art-r','art-1','art-n','art-b1','art-b2','art-b3']);assert.ok(Math.abs(b.dealt/a.dealt-1.23)<.03,a.dealt+' → '+b.dealt);
 const fury=skill(['art-r','art-1','art-n','art-b1','art-b2','art-b3','art-b4']);assert.ok(fury.s.skillRuntime.treeFuryUntil>fury.s.run.time,'연환');
});

