import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {freezeCombat} from './combat-fixture.mjs';

// Alpha 0.126 스킬 갈래 → 0.142 단계 갈래: three branches per tier, a tier per 5 skill levels (ultimates 4 tiers), one used per tier.
// The fixture raises every active·passive·ultimate skill to Lv.5 so the first tier counts (ultimates use points too since 0.142).
function profile(level=150){const p=g.createProfile(1000);p.level=level;p.unlockedStage=60;p.clearedStage=59;p.skillBook=g.restoreSkillBook(null,level);for(const d of g.SKILL_CATALOG)if(d.kind!=='beast'&&d.unlock<=level)p.skillBook.ranks[d.id]=4;p.materials.skillPage=100;p.gold=1e6;return p;}
const own=(p,id,i)=>{p.skillBook.branchOwned[id]=(p.skillBook.branchOwned[id]??0)|(1<<i);p.skillBook.branchPick[id]=i;return p;};

test('every active, passive and ultimate has three distinct branches per tier; 괴수 기술 have none',()=>{
 const ids=Object.keys(g.SKILL_BRANCHES);assert.deepEqual(ids.sort(),g.SKILL_CATALOG.filter(d=>['active','passive','ultimate'].includes(d.kind)).map(d=>d.id).sort());
 const names=new Set();let count=0;for(const id of ids){const tiers=g.SKILL_BRANCHES[id];assert.equal(tiers.length,g.SKILL_BY_ID[id].kind==='ultimate'?4:3,id);
  for(const row of tiers){assert.equal(row.length,3,id);assert.equal(new Set(row.map(b=>JSON.stringify(b.mods))).size,3,id);for(const b of row){count++;names.add(b.name);assert.ok(g.branchSummary(b.mods).length>4,b.name);assert.ok(b.text);}}}
 assert.equal(count,16*9+16*9+3*12);assert.equal(names.size,count,'every branch has its own name');
 // Branches never add hits to skills whose hits are individually weighted.
 for(const id of ['triple','echo','bloodmoon'])assert.ok(g.SKILL_BRANCHES[id].flat().every(b=>!b.mods.hits));
 assert.equal(g.SKILL_BRANCHES['beast-'+Object.keys(g.CHAPTER_BOSSES??{})[0]],undefined);
});

test('branches cost 검술서 and gold, need the skill learned, auto-select, switch freely and survive saves and builds',()=>{
 const s=g.createGame(profile()),p=s.profile,c=g.SKILL_BRANCH_COST;
 assert.equal(g.skillBranchIndex(p,'crescent'),-1);assert.equal(g.unlockSkillBranch(s,'stance',0),true);
 assert.equal(p.materials.skillPage,100-c.pages);assert.equal(p.gold,1e6-c.gold);assert.equal(g.skillBranchIndex(p,'stance'),0);assert.equal(g.branchStatus(p,'stance',0),'보유 중');
 assert.equal(g.unlockSkillBranch(s,'stance',0),false);assert.equal(g.chooseSkillBranch(s,'stance',1),false);
 assert.equal(g.unlockSkillBranch(s,'stance',1),true);assert.equal(g.skillBranchIndex(p,'stance'),1);
 assert.equal(g.chooseSkillBranch(s,'stance',0),true);assert.equal(g.skillBranchIndex(p,'stance'),0);assert.equal(g.chooseSkillBranch(s,'stance',0),true);assert.equal(g.skillBranchIndex(p,'stance'),-1);
 const beast=g.SKILL_CATALOG.find(d=>d.kind==='beast').id;assert.equal(g.unlockSkillBranch(s,beast,0),false);assert.equal(g.branchStatus(p,beast,0),'갈래 없음');
 const low=g.createGame(profile(5));assert.equal(g.branchStatus(low.profile,'eclipse',0),'스킬 미습득');assert.equal(g.unlockSkillBranch(low,'eclipse',0),false);
 const poor=g.createGame(profile());poor.profile.materials.skillPage=c.pages-1;assert.equal(g.branchStatus(poor.profile,'gale',0),'검술서 부족');assert.equal(g.unlockSkillBranch(poor,'gale',0),false);
 g.chooseSkillBranch(s,'stance',1);
 const saved=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.deepEqual(saved.skillBook.branchOwned,{stance:3});assert.deepEqual(saved.skillBook.branchPick,{stance:[1,null,null]});
 const hostile=g.restoreProfile({...JSON.parse(g.encodeProfile(p,1000)),skillBook:{...p.skillBook,branchOwned:{stance:9|1<<9,gale:1,finisher:3,bogus:1},branchPick:{gale:1,stance:0,mark:0}}},1000);
 assert.deepEqual(hostile.skillBook.branchOwned,{stance:9,gale:1,finisher:3},'bits past the last tier are dropped');assert.deepEqual(hostile.skillBook.branchPick,{stance:[0,null,null]},'a 0.126 single pick becomes tier 1');
 // A saved build remembers its branch picks; owned branches stay with the character.
 assert.equal(g.saveBuild(s,0,'갈래'),true);g.chooseSkillBranch(s,'stance',0);assert.equal(g.applyBuild(s,0).ok,true);assert.equal(g.skillBranchIndex(s.profile,'stance'),1);
});

function fight(id,setup=()=>{},{hp=1e7,elite=false,steps=80}={}){
 const p=profile();setup(p);const kind=g.SKILL_BY_ID[id].kind;p.skillBook.loadout.active=[null,null,null,null];p.skillBook.loadout.ultimate=[null];p.skillBook.loadout.passive=[null,null,null];p.skillBook.loadout[kind][0]=id;
 const s=g.createGame(p);g.launch(s,1);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1e6;s.barrels=[];s.player.invulnerable=999;s.player.stamina=100;
 const e={...s.enemies[0]??{},id:s.nextId++,type:'bulwark',elite,boss:false,x:s.player.x+120,y:s.player.y,hp,maxHp:1e7,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,guardMax:0,plate:0,dead:false,group:null,wave:s.run.wave,runStage:s.run.stage,damage:1,radius:58,lookX:0,lookY:1};
 s.enemies=[e];s.player.action='idle';const before=s.player.stamina;assert.ok(g.useSkill(s,id,{x:1,y:0,targetId:e.id}),id);
 const cd=s.skillRuntime.cooldowns[id],spent=before-s.player.stamina;for(let i=0;i<steps;i++)g.advanceGame(s,.025);return {s,e,cd,spent,dealt:hp-e.hp};
}

test('branches change damage, cost, cooldown, area, hits, boss and execute bonuses and elements in combat',()=>{
 const base=fight('crescent',()=>{},{elite:true}),sharp=fight('crescent',p=>own(p,'crescent',1),{elite:true});
 assert.ok(Math.abs(sharp.dealt/base.dealt-1.35*1.2)<.05,base.dealt+' → '+sharp.dealt);assert.equal(sharp.spent,base.spent+4);
 const wide=fight('crescent',p=>own(p,'crescent',0));assert.ok(g.skillAreaScale(wide.s.profile,'crescent')>g.skillAreaScale(base.s.profile,'crescent')*1.55);
 const quick=fight('gale',p=>own(p,'gale',0)),plain=fight('gale');assert.ok(Math.abs(quick.cd-plain.cd*.6)<.01);
 const draw=fight('draw',()=>{},{hp:2e6}),finish=fight('draw',p=>own(p,'draw',0),{hp:2e6});assert.ok(finish.dealt>draw.dealt*1.3*1.45,draw.dealt+' → '+finish.dealt);
 const twin=fight('seeking',p=>own(p,'seeking',1)),one=fight('seeking');assert.ok(Math.abs(twin.dealt/one.dealt-1.6)<.05,one.dealt+' → '+twin.dealt);
 const bleed=fight('dance',p=>own(p,'dance',0),{steps:20});assert.ok(bleed.e.bleedTicks>0,'출혈');
 const chill=fight('returning',p=>own(p,'returning',0),{steps:10});assert.ok(chill.e.chillRemaining>0,'빙결');
 const guard=fight('dance',p=>own(p,'dance',1),{steps:2});assert.ok(guard.s.uniqueState.shield>=guard.s.player.maxHp*.06-1,'보호막');
 const weak=fight('field',p=>own(p,'field',1),{steps:20});assert.equal(weak.e.skillBreach?.value,15);
});

test('buff branches: 수월의 자세 reduction and length, 혈월의 칼날 length, 월영 표식 three hits, 월영군무 length',()=>{
 const stance=fight('stance',p=>own(p,'stance',0),{steps:1}),r=stance.s.skillRuntime;const base=g.skillNumbers(profile(),'stance'),strong=g.skillNumbers(stance.s.profile,'stance');
 assert.match(base,/피해 감소 (\d+)%/);assert.equal(+strong.match(/피해 감소 (\d+)%/)[1],+base.match(/피해 감소 (\d+)%/)[1]+15);assert.ok(r.stanceUntil>stance.s.run.time+2.8);
 const calm=fight('stance',p=>own(p,'stance',1),{steps:0});assert.ok(Math.abs(calm.s.skillRuntime.stanceUntil-calm.s.run.time-4.8)<.01);
 const blade=fight('bloodblade',p=>own(p,'bloodblade',1),{steps:0});assert.ok(Math.abs(blade.s.skillRuntime.bloodbladeUntil-blade.s.run.time-10.02)<.01);
 const mark=fight('mark',p=>own(p,'mark',1),{steps:0});assert.equal(mark.e.skillMark.need,3);
 const army=fight('phantoms',p=>own(p,'phantoms',0),{steps:0});assert.equal(army.s.skillRuntime.phantomHits,12);assert.ok(Math.abs(army.s.skillRuntime.phantomUntil-army.s.run.time-12)<.01);
});

// 0.149.11 (외부 감사 '가벼운 자세는 비용을 내도 효용이 없다'): 어떤 갈래도 그 스킬에서 아무것도 바꾸지 않으면 안 된다 —
// 기력 감소는 기본 비용이 있는 스킬에만, 수월의 자세 1단계 셋째 칸은 재사용 단축.
test('비용 감소 갈래는 기본 비용이 있는 스킬에만 있다', () => {
  for(const [id,tiers] of Object.entries(g.SKILL_BRANCHES)){const d=g.SKILL_BY_ID[id];for(const row of tiers)for(const b of row)if(b.mods.cost<0)assert.ok((d.cost??0)>0,id+' '+b.name);}
  const b=g.SKILL_BRANCHES.stance[0][2];assert.equal(b.name,'고요한 숨');assert.equal(b.mods.cooldown,.75);
});
