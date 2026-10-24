import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as game from '../dist/game-engine.js';
import {freezeCombat} from './combat-fixture.mjs';
import {CHAPTERS,MONSTERS,EQUIPMENT_ART,equipmentArt} from '../dist/chapters.js';
import {createDecorations} from '../dist/terrain.js';
function hunt(id){const p=game.createProfile(1000);p.clearedStage=game.STAGES.length-1;p.unlockedStage=game.STAGES.length;const s=game.createGame(p);assert.equal(game.launch(s,id),true);return freezeCombat(s);}
function advance(s,time){for(let i=0;i<Math.ceil(time/.025);i++)game.advanceGame(s,.025);}

test('all twelve chapter identities remain distinct and definitions stay immutable',()=>{
  const definition=JSON.stringify(CHAPTERS),species=new Set();
  for(const c of CHAPTERS){const s=hunt(c.id),second=hunt(c.id);assert.equal(s.enemies.length,4);assert.deepEqual(new Set(s.enemies.map(e=>e.species)),new Set([...c.roster.slice(0,3),c.bossSpecies]));
    for(const e of s.enemies){species.add(e.species);assert.equal(e.name,MONSTERS[e.species].name);assert.equal(e.chapterId,c.id);}
    s.enemies[0].hp=0;assert.ok(second.enemies[0].hp>0);assert.ok(createDecorations(s.bounds,c).length>10);
  }
  assert.equal(species.size,new Set(CHAPTERS.flatMap(c=>[...c.roster.slice(0,3),c.bossSpecies])).size);assert.equal(JSON.stringify(CHAPTERS),definition);assert.throws(()=>{CHAPTERS[0].bossCycle[0]='volley';},TypeError);
});
test('boss attack plans drive actual contact and death/pause cancel uncommitted volleys',()=>{
  const initialKinds=[];
  for(const id of [1,11,21]){
    const s=hunt(id),boss=s.enemies.find(e=>e.boss);s.enemies=[boss];s.barrels=[];s.run.bossSpawned=true;
    s.player.invulnerable=99;boss.aggro=true;boss.action='windup';boss.actionTime=0;boss.windup=.1;boss.targetX=s.player.x;boss.targetY=s.player.y;boss.pattern=0;
    initialKinds.push(game.enemyAttackKind(boss));s.paused=true;const before=JSON.stringify(s);advance(s,.3);assert.equal(JSON.stringify(s),before);s.paused=false;
    advance(s,.1);assert.equal(boss.action,'attack');
    if(id===11)assert.equal(s.projectiles.length,3);else assert.equal(s.projectiles.length,0);
    const dead=hunt(id),e=dead.enemies.find(e=>e.boss);dead.run.bossSpawned=true;dead.enemies=[e];dead.barrels=[];Object.assign(e,{dead:true,action:'death',actionTime:0,pattern:2,windup:.01});advance(dead,.2);assert.equal(dead.projectiles.length,0);
  }
  assert.deepEqual(initialKinds,['slam','volley','charge']);
});
test('forest wolf charge follows the locked target and stays inside world limits',()=>{
  const s=hunt(1),e=s.enemies.find(e=>e.species==='forest_wolf');s.enemies=[e];s.barrels=[];s.player.invulnerable=99;e.aggro=true;e.homeX=e.x;e.homeY=e.y;
  Object.assign(e,{pattern:2,action:'windup',actionTime:0,windup:.1,targetX:e.x+100,targetY:e.y});assert.equal(game.enemyAttackKind(e),'charge');advance(s,.1);const x=e.x;
  s.player.y=e.y+100;advance(s,.1);assert.ok(e.x>x);assert.equal(e.chargeY,0);assert.ok(e.x<=s.bounds.width-s.bounds.padding);
});
test('chapter caster volleys keep the projectile cap and target snapshot',()=>{
  for(const id of [11,21]){
    const s=hunt(id),e=s.enemies.find(e=>e.type==='spitter');s.enemies=[e];s.barrels=[];s.player.invulnerable=99;
    Object.assign(e,{aggro:true,action:'windup',actionTime:0,windup:.1,targetX:e.x+200,targetY:e.y});
    s.player.y=e.y+100;advance(s,.1);assert.equal(s.projectiles.length,3);assert.ok(s.projectiles.every(p=>p.vx>0&&p.color===CHAPTERS[id-1].shotColor));
    e.action='windup';e.actionTime=0;e.windup=.1;s.projectiles=Array.from({length:63},(_,i)=>({id:900+i,x:50,y:50,vx:0,vy:0,damage:0,ttl:99,friendly:false}));advance(s,.1);assert.equal(s.projectiles.length,64);
  }
});
test('equipment artwork survives valid saves and cannot spoof another slot or chapter',()=>{
  assert.equal(EQUIPMENT_ART.length,12);assert.equal(new Set(EQUIPMENT_ART.map(a=>a.id)).size,12);
  for(const a of EQUIPMENT_ART){const item={id:1,slot:a.slot,tier:a.tier,rarity:1,name:a.name,artId:a.id,affixes:{damage:2}};const p=game.createProfile(1000);p.inventory=[item];const restored=game.restoreProfile(game.encodeProfile(p,1000),1000);assert.equal(restored.inventory[0].artId,a.id);assert.equal(equipmentArt(restored.inventory[0]).id,a.id);}
  const raw={version:2,inventory:[{id:1,slot:'armor',tier:1,artId:'frost_blade',name:'old armor',affixes:{hp:10}}],equipment:{armor:1}};
  const p=game.restoreProfile(raw,1000);assert.equal(p.equipment.armor,1);assert.equal(p.inventory[0].name,'old armor');assert.equal(p.inventory[0].artId,undefined);assert.equal(equipmentArt(p.inventory[0]).id,'forest_armor');
});
test('HD chapter atlases bind measured native pixels, fixed action scale and nonoverlapping crops',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url),'utf8'));
  const report=JSON.parse(fs.readFileSync(new URL('../tools/reports/alpha045-monsters.json',import.meta.url),'utf8'));
  assert.equal(Object.keys(report.species).length,12);assert.equal(report.atlases.length,3);
  for(const [species,rows] of Object.entries(report.species)){
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../art/monsters045/'+species+'.png',import.meta.url))).digest('hex'),report.sources[species]);
    assert.equal(rows.length,5);
    for(const row of rows){
      assert.ok(row.bodyHeight>=120);assert.ok(row.nativeResolutionGain>1.2);
      for(const [family,count]of [['walk',2],['attack',2],['death',1]]){
        const c=manifest.clips[manifest.directions[species][family][row.direction]];
        assert.equal(c.frames.length,count);assert.equal(c.bodyHeight,row.bodyHeight);
        assert.ok(c.frames.every(f=>f.bodyHeight===row.bodyHeight&&f.pivotX>=0&&f.pivotX<f.w&&f.pivotY>=0&&f.pivotY<f.h));
      }
    }
  }
  for(const atlas of report.atlases){
    assert.equal(atlas.frames,100);assert.ok(atlas.width<=4096&&atlas.height<=4096);assert.equal(atlas.pixelExact,true);
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../dist/assets/'+atlas.image,import.meta.url))).digest('hex'),atlas.sha256);
    const frames=Object.values(manifest.clips).filter(c=>c.image===atlas.image).flatMap(c=>c.frames);
    assert.equal(frames.length,100);
    for(let i=0;i<frames.length;i++)for(let j=i+1;j<frames.length;j++){
      const a=frames[i],b=frames[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'atlas neighbor overlap');
    }
  }
});
