import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as g from '../dist/game-engine.js';
import * as L from '../dist/loot.js?v=0.128.0';
import {freezeCombat} from './combat-fixture.mjs';

// Alpha 0.127 장비 기술: every raid ancient carries a skill that casts by itself while worn.
const raidItem=(raid,slot,powerRoll=100,id=7)=>{let seed=5;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};return {...L.rollAncient({id,tier:6,slot,raid},0,rng),powerRoll};};
function profile(items=[]){const p=g.createProfile(1000);p.level=150;p.unlockedStage=61;p.clearedStage=60;p.skillBook=g.restoreSkillBook(null,150);p.skillBook.loadout.active=[null,null,null,null];p.skillBook.loadout.ultimate=[null];p.inventory=items;for(const it of items)p.equipment[it.slot]=it.id;return p;}

test('fifteen equipment skills, one per raid ancient, outside the skill screen and loadouts',()=>{
 const raid=g.ANCIENT_CATALOG.filter(a=>a.raid);assert.equal(g.GEAR_SKILLS.length,15);assert.deepEqual(g.GEAR_SKILLS.map(d=>d.ancientId).sort(),raid.map(a=>a.id).sort());
 for(const d of g.GEAR_SKILLS){assert.equal(d.kind,'gear');assert.equal(d.cost,0);assert.equal(g.SKILL_BY_ID[d.id],d);assert.ok(!g.SKILL_CATALOG.includes(d));assert.ok(fs.existsSync(new URL('../dist/'+d.icon,import.meta.url)),d.icon);assert.ok(d.description.length>10);assert.equal(d.color,g.raidDefinition(d.raid).color);}
 assert.equal(new Set(g.GEAR_SKILLS.map(d=>d.name)).size,15);
 assert.equal(new Set(g.GEAR_SKILLS.map(d=>JSON.stringify([d.template,d.element,d.execute,d.hits]))).size,15);
 assert.deepEqual(g.skillSlots(150),{active:4,passive:3,ultimate:1,beast:1});
});

function battle(items,{manual=false,seconds=6}={}){
 const s=g.createGame(profile(items));g.launch(s,1);freezeCombat(s);s.run.flow='combat';s.run.waveQuota=1e6;s.barrels=[];s.player.invulnerable=999;s.auto=true;
 const e={...s.enemies[0],id:s.nextId++,type:'bulwark',elite:true,boss:false,x:s.player.x+110,y:s.player.y,hp:1e8,maxHp:1e8,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,guardMax:0,plate:0,dead:false,group:null,damage:1,radius:58};
 s.enemies=[e];const casts=[];for(let t=0;t<seconds;t+=.025){g.advanceGame(s,.025,manual?{skillMode:'manual'}:undefined);const c=s.skillRuntime.cooldowns;for(const d of g.GEAR_SKILLS)if(c[d.id]>d.cooldown-.03&&!casts.includes(d.id))casts.push(d.id);}
 return {s,e,casts};
}

test('a worn raid ancient casts its skill by itself, in automatic and manual skill mode; unworn items do nothing',()=>{
 const sword=raidItem('colossus','weapon');const worn=battle([sword]);assert.deepEqual(worn.casts,['gear-colossus-weapon']);assert.ok(worn.e.skillBreach?.value>=15,'약화');
 const manual=battle([sword],{manual:true});assert.deepEqual(manual.casts,['gear-colossus-weapon']);
 assert.deepEqual(battle([]).casts,[]);
 const unworn=g.createGame(profile([sword]));unworn.profile.equipment.weapon=null;assert.deepEqual(g.gearSkills(unworn),[]);
 // Several worn raid ancients each bring their own skill.
 const set=battle([raidItem('judge','weapon',100,1),raidItem('judge','helmet',100,2),raidItem('queen','charm',100,3)],{seconds:10});
 assert.deepEqual(set.casts.sort(),['gear-judge-helmet','gear-judge-weapon','gear-queen-charm']);
});

test('equipment skill damage follows the item effect power roll; shields and healing land on cast',()=>{
 const hit=power=>{const s=g.createGame(profile([raidItem('colossus','weapon',power)]));g.launch(s,1);freezeCombat(s);s.run.flow='combat';s.auto=false;s.player.invulnerable=999;
  const e={...s.enemies[0],id:s.nextId++,type:'bulwark',elite:false,boss:false,x:s.player.x+150,y:s.player.y,hp:1e8,maxHp:1e8,speed:0,cooldown:999,guard:0,guardMax:0,plate:0,dead:false,damage:0};s.enemies=[e];s.player.action='idle';
  assert.equal(g.gearSkills(s)[0].power,power);assert.ok(g.useSkill(s,'gear-colossus-weapon',{x:1,y:0,targetId:e.id}));for(let i=0;i<24;i++)g.advanceGame(s,.025);return 1e8-e.hp;};
 const low=hit(60),high=hit(120);assert.ok(low>0);assert.ok(Math.abs(high/low-2)<.02,low+' → '+high);
 // Without the item worn the skill cannot be cast at all.
 const bare=g.createGame(profile());g.launch(bare,1);freezeCombat(bare);bare.run.flow='combat';assert.equal(g.useSkill(bare,'gear-colossus-weapon',{x:1,y:0}),false);
 const guard=battle([raidItem('queen','helmet')],{seconds:.5});assert.ok(guard.s.uniqueState.shield>=guard.s.player.maxHp*.12-1,'보호막');
 const heal=battle([raidItem('judge','charm')],{seconds:0});heal.s.player.hp=heal.s.player.maxHp*.5;const before=heal.s.player.hp;for(let i=0;i<20;i++)g.advanceGame(heal.s,.025);
 assert.ok(heal.s.player.hp>=before+heal.s.player.maxHp*.05-1,'회복');
});
