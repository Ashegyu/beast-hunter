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
