import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
// Alpha 0.142 스킬 단계 갈래 (사용자 요청): 일반·패시브 최대 Lv.15(Lv.5·10·15 갈래), 궁극기 Lv.20(Lv.5·10·15·20 갈래), 단계마다 3택.
const camp=level=>{const p=g.createProfile(1000);p.level=level;p.skillBook=g.restoreSkillBook(null,level);p.materials.skillPage=999;p.gold=1e7;const s=g.createGame(p);s.phase='camp';return s;};

test('skill levels: actives and passives reach 15, ultimates 20; ranks past 5 grow by half steps',()=>{
 assert.equal(g.MAX_SKILL_RANK,15);assert.equal(g.MAX_ULTIMATE_RANK,20);assert.equal(g.powerRank(5),5);assert.equal(g.powerRank(15),10);
 const gates=Array.from({length:15},(_,i)=>g.skillLevelGate('crescent',i+1));for(let i=1;i<gates.length;i++)assert.ok(gates[i]>=gates[i-1]);assert.ok(gates[14]<=150);
 const s=camp(200),p=s.profile;let n=0;while(g.upgradeSkill(s,'crescent'))n++;assert.equal(n,14);assert.equal(g.skillRank(p,'crescent'),15);assert.equal(g.upgradeSkill(s,'crescent'),false);
 const d=g.SKILL_BY_ID.crescent;assert.equal(g.skillValue(p,'crescent'),d.damage+d.step*9);
 assert.equal(g.skillRank(p,'bloodmoon'),1,'ultimates start at Lv.1 and take points');let u=0;while(g.upgradeSkill(s,'bloodmoon'))u++;assert.equal(u,19);assert.equal(g.skillRank(p,'bloodmoon'),20);assert.equal(g.skillLevelGate('bloodmoon',20),198);
 const young=camp(100);while(g.upgradeSkill(young,'bloodmoon'));assert.ok(g.skillRank(young.profile,'bloodmoon')<20);assert.ok(g.skillPoints(young.profile)>0,'the level gate, not points, stops it');
 const restored=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.equal(restored.skillBook.ranks.crescent,14,'rank 15 survives a save');assert.equal(g.skillRank(restored,'bloodmoon'),20);
});

test('a tier opens at its skill level, picks of all tiers add up, and a lowered skill loses the upper tiers',()=>{
 const s=camp(200),p=s.profile;for(let i=0;i<4;i++)g.upgradeSkill(s,'crescent');assert.equal(g.skillRank(p,'crescent'),5);
 assert.equal(g.branchStatus(p,'crescent',0,1),'스킬 Lv.10 필요');assert.equal(g.unlockSkillBranch(s,'crescent',0,1),false);
 const before=p.materials.skillPage;assert.equal(g.unlockSkillBranch(s,'crescent',1,0),true);assert.equal(p.materials.skillPage,before-g.SKILL_BRANCH_COSTS[0].pages);
 while(g.upgradeSkill(s,'crescent'));assert.equal(g.unlockSkillBranch(s,'crescent',0,1),true);assert.equal(g.unlockSkillBranch(s,'crescent',1,2),true);
 assert.equal(p.materials.skillPage,before-g.SKILL_BRANCH_COSTS[0].pages-g.SKILL_BRANCH_COSTS[1].pages-g.SKILL_BRANCH_COSTS[2].pages);
 // 0.146.0: tier 2·3 are rule branches (삼일월 fan, 빙월 파쇄 shatter); the default loadout holds two 검기 skills (×1.08 tag bonus).
 const m=g.branchMods(p,'crescent');assert.ok(Math.abs(m.damage-1.35*1.08)<1e-9);assert.equal(m.boss,20);assert.equal(m.cost,4);assert.equal(m.fan,2);assert.equal(m.shatter,45);assert.equal(m.element.chill,.8);
 assert.equal(g.activeBranches(p,'crescent').length,3);
 g.chooseSkillBranch(s,'crescent',0,1);assert.equal(g.skillBranchIndex(p,'crescent',1),-1,'tapping the branch in use turns its tier off');assert.equal(g.activeBranches(p,'crescent').length,2);
 g.chooseSkillBranch(s,'crescent',0,1);p.skillBook.ranks.crescent=8;assert.equal(g.activeBranches(p,'crescent').length,1,'Lv.9 keeps only the Lv.5 tier');
 // Ultimates: four tiers, the last at Lv.20.
 assert.equal(g.branchTierCount('bloodmoon'),4);while(g.upgradeSkill(s,'bloodmoon'));assert.equal(g.unlockSkillBranch(s,'bloodmoon',0,3),true);assert.ok(g.branchMods(p,'bloodmoon').damage>=1.3);
 const young=camp(150);assert.equal(g.branchStatus(young.profile,'bloodmoon',0,3),'스킬 Lv.20 필요');
});

test('passive branches scale the passive number or add stats while the passive is equipped',()=>{
 const s=camp(200),p=s.profile;p.skillBook.loadout.passive=['reserve',null,null];for(let i=0;i<14;i++)g.upgradeSkill(s,'reserve');
 const plain=g.playerStats(p).reduction,valueBefore=g.skillValue(p,'reserve');
 assert.equal(g.unlockSkillBranch(s,'reserve',1,0),true);assert.ok(Math.abs(g.playerStats(p).reduction-plain-g.SKILL_BRANCHES.reserve[0][1].mods.stat.reduction)<1e-9);
 // 0.146.0: tiers 2·3 of a passive are build rules for every skill while it is equipped.
 assert.equal(g.unlockSkillBranch(s,'reserve',1,2),true);assert.equal(g.passiveRules(p).drainAll,1);
 assert.equal(g.unlockSkillBranch(s,'reserve',0,0),true);assert.equal(g.passiveValueScale(p,'reserve'),1.2);assert.equal(g.skillValue(p,'reserve'),valueBefore);
 assert.ok(g.passiveValueScale(p,'resolve')===1);for(let i=0;i<4;i++)g.upgradeSkill(s,'resolve');g.unlockSkillBranch(s,'resolve',0,0);assert.ok(g.passiveValueScale(p,'resolve')<1,'적월의 결의 waits less');
 p.skillBook.loadout.passive=[null,null,null];assert.equal(g.playerStats(p).reduction,plain,'stats only while equipped');assert.equal(g.passiveRules(p).drainAll,undefined,'rules only while equipped');
});
