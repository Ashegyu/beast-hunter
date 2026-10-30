import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {rollItem} from '../dist/loot.js';

const close=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),`${label}: ${actual} ≈ ${expected}`);
const profile=(level=200)=>{const p=g.createProfile(0);p.level=level;p.skillBook=g.restoreSkillBook(null,level);return p;};
const ADJ={};
for(const [a,b] of g.TREE_EDGES){(ADJ[a]??=[]).push(b);(ADJ[b]??=[]).push(a);}
function pathTo(target){
 const prev={core:null},queue=['core'];
 while(queue.length){const id=queue.shift();if(id===target)break;for(const n of ADJ[id]??[])if(!(n in prev)){prev[n]=id;queue.push(n);}}
 assert.ok(target in prev,`도달 가능한 노드: ${target}`);
 const out=[];for(let id=target;id&&id!=='core';id=prev[id])out.unshift(id);return out;
}
const nearest=key=>{
 const paths=Object.keys(g.TREE_NODES).filter(id=>g.TREE_NODES[id].bonus[key]>0).map(pathTo).sort((a,b)=>a.length-b.length);
 assert.ok(paths.length,`${key} 노드 존재`);return paths[0];
};
function learn(s,path){for(const id of path)assert.equal(g.learnGrowthNode(s,id),true,id);}

function checkFormula(p){
 const st=g.playerStats(p),power=g.combatPower(p),finisher=g.treeBonus(p).finisher;
 const attack=(st.attackLevel+st.attackEquip)*st.attackPct;
 const chain=g.COMBOS.reduce((sum,c,i)=>sum+c.damage*(i===g.COMBOS.length-1?1+finisher:1),0);
 const cycle=g.COMBOS.reduce((sum,c)=>sum+c.duration,0)/st.attackSpeed,crit=1+st.crit*st.critDamage;
 assert.equal(power.attack,st.damage);
 for(const key of ['attackLevel','attackEquip','attackPct'])assert.equal(power[key],st[key],key);
 close(st.damage,attack,'공격력 분해');
 close(power.chain,chain,'연격 배율');close(power.cycle,cycle,'연격 주기');close(power.crit,crit,'치명 기대 배율');
 close(power.dps,attack*chain*crit/cycle,'DPS 공식');
 return power;
}

test('새 프로필의 공격력과 기본 연격 DPS',()=>{
 const p=g.createProfile(0),power=checkFormula(p),st=g.playerStats(p);
 for(const [key,value] of Object.entries({attack:24,chain:4,cycle:1.2,crit:1.03,dps:82.4}))close(power[key],value,key);
 assert.equal(st.attackLevel,24);assert.equal(st.attackEquip,0);assert.equal(st.attackPct,1);
});

test('레벨 200·단련·마무리 성장 노드·공격력 장비에서 공식이 성립한다',()=>{
 const p=profile(),s=g.createGame(p),base=checkFormula(p);
 assert.ok(base.attackLevel>24);
 for(const key of ['power','tempo','precision','ferocity'])for(let i=0;i<25;i++)assert.equal(g.trainStat(s,key),true,`${key} ${i}`);
 const trained=checkFormula(p);assert.ok(trained.attackLevel>base.attackLevel);
 const path=nearest('finisher');learn(s,path);
 const grown=checkFormula(p);assert.ok(g.treeBonus(p).finisher>0);assert.ok(grown.chain>trained.chain);
 const item=rollItem({id:p.nextItemId++,tier:1,slot:'weapon',quality:0},()=>.5);
 assert.ok(item.affixes.damage>0,'공격력 무기');p.inventory.push(item);
 assert.equal(g.equipItem(s,item.id),true);assert.equal(p.equipment.weapon,item.id);
 const equipped=checkFormula(p);assert.ok(equipped.attackEquip>grown.attackEquip);assert.ok(equipped.attack>grown.attack);
 close(equipped.attackLevel,grown.attackLevel,'장비 착용 후 레벨 공격력');
});

for(const [label,stat,field] of [['공격 속도','tempo','attackSpeed'],['치명 확률','precision','crit'],['치명 피해','ferocity','critDamage']]){
 test(`${label} 단련이 DPS를 높인다`,()=>{
  const p=profile(),s=g.createGame(p),before=checkFormula(p),old=g.playerStats(p);
  assert.equal(g.trainStat(s,stat),true);
  const after=checkFormula(p);assert.ok(g.playerStats(p)[field]>old[field]);assert.equal(after.attack,before.attack);assert.equal(after.chain,before.chain);assert.ok(after.dps>before.dps);
 });
}

test('마무리 피해 노드를 배우면 마지막 타 배율과 DPS가 오른다',()=>{
 const p=profile(),s=g.createGame(p),path=nearest('finisher');learn(s,path.slice(0,-1));
 const before=checkFormula(p),oldFinisher=g.treeBonus(p).finisher;
 learn(s,path.slice(-1));const after=checkFormula(p),gain=g.treeBonus(p).finisher-oldFinisher;
 assert.ok(gain>0);close(after.chain-before.chain,g.COMBOS.at(-1).damage*gain,'마지막 타에만 마무리 피해 적용');assert.ok(after.dps>before.dps);
});

// skill-rules.test.mjs와 같은 방식으로 소유·선택한 갈래를 구성한다.
function giveBranch(p,id,t,i){
 p.skillBook.branchOwned[id]=(p.skillBook.branchOwned[id]??0)|(1<<(t*3+i));
 const picks=p.skillBook.branchPick[id]??Array(g.branchTierCount(id)).fill(null);
 picks[t]=i;p.skillBook.branchPick[id]=picks;
}
function checkSkillFormula(p,attack=g.playerStats(p).damage){
 const sk=g.skillDps(p,attack),tree=g.treeBonus(p),scale=1+tree.skillDamage+g.transcendBonus(p).skillDamage;
 const ids=['active','ultimate','beast'].flatMap(kind=>p.skillBook.loadout[kind]??[]).filter(id=>id&&id!=='parry'&&g.skillRank(p,id)>0&&g.skillValue(p,id)>0);
 assert.deepEqual(sk.rows.map(r=>r.id),ids,'피해가 있는 장착 스킬만 포함');
 close(sk.scale,scale,'스킬 피해 배율');
 let raw=0,drain=0;
 for(const row of sk.rows){
  const perCast=g.skillValue(p,row.id)/100*attack*(g.branchMods(p,row.id).damage??1)*scale;
  const cooldown=g.skillCooldown(p,row.id),cost=g.skillCost(p,row.id);
  close(row.perCast,perCast,`${row.id} 한 번 피해`);close(row.cooldown,cooldown,`${row.id} 재사용`);close(row.cost,cost,`${row.id} 기력`);
  close(row.dps,perCast/cooldown,`${row.id} DPS`);raw+=perCast/cooldown;drain+=cost/cooldown;
 }
 const regen=18*(1+tree.staminaRegen),stamina=drain>regen?regen/drain:1;
 close(sk.raw,raw,'보정 전 합계');close(sk.drain,drain,'초당 기력 소비');close(sk.regen,regen,'초당 기력 회복');close(sk.stamina,stamina,'기력 보정');close(sk.dps,raw*stamina,'보정 후 스킬 DPS');
 return sk;
}

test('레벨 200 기본 장착의 스킬별 공식과 전체 DPS 합계',()=>{
 const p=profile(),power=checkFormula(p),sk=checkSkillFormula(p);
 assert.ok(sk.rows.length>0);assert.ok(sk.dps>0);
 assert.deepEqual(power.skill,sk);close(power.skillDps,sk.dps,'스킬 DPS 필드');close(power.total,power.dps+sk.dps,'전체 DPS');
 checkSkillFormula(p,1234); // 명시한 공격력도 한 번 피해에 반영한다.
});

test('흘려베기·수월의 자세·혈월의 칼날은 스킬 DPS에서 제외한다',()=>{
 const p=profile();p.skillBook.loadout.active=['parry','stance','bloodblade','crescent'];
 for(const id of p.skillBook.loadout.active)p.skillBook.ranks[id]=14;
 const sk=checkSkillFormula(p);
 assert.ok(sk.rows.some(r=>r.id==='crescent'));
 for(const id of ['parry','stance','bloodblade'])assert.ok(!sk.rows.some(r=>r.id===id),id);
 p.skillBook.loadout.beast=['beast-boar'];
 assert.ok(!checkSkillFormula(p).rows.some(r=>r.id==='beast-boar'),'미습득 괴수 기술 제외');
});

test('스킬 랭크와 그믐 검기 피해 갈래가 스킬 DPS를 높인다',()=>{
 const p=profile();p.skillBook.loadout.active=['crescent',null,null,null];
 p.skillBook.ranks.crescent=1;const low=checkSkillFormula(p);
 p.skillBook.ranks.crescent=14;const ranked=checkSkillFormula(p);
 assert.ok(ranked.dps>low.dps);
 const before=ranked.rows.find(r=>r.id==='crescent').perCast;
 giveBranch(p,'crescent',0,1);const branched=checkSkillFormula(p);
 close(g.branchMods(p,'crescent').damage,1.35,'그믐 검기 배율');
 close(branched.rows.find(r=>r.id==='crescent').perCast,before*1.35,'갈래 피해 배율 적용');
});

test('짧은 재사용 조합은 기력 소비가 회복을 넘으면 DPS가 줄어든다',()=>{
 const p=profile();p.skillBook.loadout.active=['gale','dance','seeking','echo'];p.skillBook.loadout.beast=['beast-boar'];p.beastSkills={'beast-boar':3};
 for(const id of [...p.skillBook.loadout.active,...p.skillBook.loadout.beast])p.skillBook.ranks[id]=14;
 giveBranch(p,'gale',0,0);giveBranch(p,'echo',0,1);
 const sk=checkSkillFormula(p);
 assert.ok(sk.drain>sk.regen,'기력 부족 조합');assert.ok(sk.stamina>0&&sk.stamina<1);
 close(sk.dps,sk.raw*sk.stamina,'기력 부족 시 지속 DPS');assert.ok(sk.dps<sk.raw);
 assert.ok(sk.rows.some(r=>r.id==='beast-boar'),'괴수 기술도 포함');
});

test('공격력 무기의 itemDps는 착용·해제 전후 전체 DPS 차이다',()=>{
 const p=profile(),s=g.createGame(p),before=g.combatPower(p);
 const item=rollItem({id:p.nextItemId++,tier:1,slot:'weapon',quality:0},()=>.5);
 assert.ok(item.affixes.damage>0);p.inventory.push(item);
 const preview=g.itemDps(p,item.id);
 assert.equal(preview.equipped,false);assert.equal(g.equipItem(s,item.id),true);
 const after=g.combatPower(p),equipped=g.itemDps(p,item.id);
 assert.ok(after.skillDps>before.skillDps,'공격력으로 스킬 DPS도 증가');
 for(const result of [preview,equipped]){
  close(result.dps,after.total,'착용 전체 DPS');close(result.other,before.total,'미착용 전체 DPS');close(result.delta,after.total-before.total,'전체 DPS 차이');
 }
 assert.equal(equipped.equipped,true);
});
