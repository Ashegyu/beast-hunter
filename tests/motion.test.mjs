import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as m from '../dist/motion.js';
import * as g from '../dist/game-engine.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url),'utf8'));
const alignment=JSON.parse(fs.readFileSync(new URL('../tools/reports/lirian-alpha081-alignment.json',import.meta.url),'utf8'));
function empty(){const s=g.createGame();g.launch(s);s.enemies=[];s.barrels=[];return s;}
function ticks(s,time,input={}){for(let i=0;i<Math.ceil(time/.025);i++)g.advanceGame(s,.025,input);}

test('all eight headings, zero vectors and sector-boundary hysteresis keep a stable direction',()=>{
  for(let i=0;i<8;i++){const a=i*Math.PI/4;assert.equal(m.directionIndex(Math.cos(a),Math.sin(a)),i);}
  assert.equal(m.directionIndex(0,0,6),6);assert.equal(m.directionIndex(NaN,Infinity,3),3);assert.equal(m.directionIndex(0,0),2);
  const angle=26*Math.PI/180;assert.equal(m.directionIndex(Math.cos(angle),Math.sin(angle),0),0);assert.equal(m.directionIndex(Math.cos(angle),Math.sin(angle),1),1);assert.equal(m.directionIndex(Math.cos(35*Math.PI/180),Math.sin(35*Math.PI/180),0),1);
});
test('all actors have canonical front/back/side/diagonal clips, constant frame scale and safe runtime loading',()=>{
  for(const[actor,families]of Object.entries(manifest.directions))for(const[action,directions]of Object.entries(families)){
    assert.deepEqual(Object.keys(directions),['s','se','e','ne','n']);for(let heading=0;heading<8;heading++){const clip=manifest.clips[m.directionalClipId(manifest,actor,action,heading)];assert.ok(clip);assert.ok(clip.frames.every(f=>f.bodyHeight===clip.bodyHeight));}
    assert.notDeepEqual(['x','y'].map(k=>manifest.clips[directions.n].frames[0][k]),['x','y'].map(k=>manifest.clips[directions.s].frames[0][k]));
  }
  // Alpha 0.106 adds 45 species, 0.107 adds 26, 0.118 adds 66, 0.123 three raid bosses and 0.142 one, each 15 clips (5 views × walk/attack/death).
  assert.equal(m.runtimeClipIds(manifest).length,396+(45+26+66+4)*15);assert.equal(m.runtimeClipIds(manifest).includes('hunter_walk'),false);assert.equal(m.runtimeClipIds(manifest).includes('fx_cleave_sequence'),true);
});
test('gait is distance-based, handles reverse steps, and contact pose never precedes damage timing',()=>{
  assert.equal(m.walkingFrame(0),0);assert.equal(m.walkingFrame(19),1);assert.equal(m.walkingFrame(38),2);assert.equal(m.walkingFrame(76),0);assert.equal(m.walkingFrame(19,76,4,true),3);assert.equal(m.walkingFrame(NaN),0);
  for(const[impact,duration]of [[.1,.32],[.13,.36],[.22,.52],[.3,.68],[.13,.46]]){
    assert.equal(m.attackFrame(0,impact,duration),0);assert.equal(m.attackFrame(impact*.75,impact,duration),1);assert.equal(m.attackFrame(impact,impact,duration),2);assert.equal(m.attackFrame(duration,impact,duration),3);
  }
});
test('walking faces movement while aim remains independent; attack and dodge lock their own headings',()=>{
  const s=empty();ticks(s,.1,{x:0,y:-1,aim:{x:1,y:0},aimRevision:1});assert.equal(s.player.heading,6);assert.equal(s.player.aimX,1);assert.equal(s.player.aimY,0);const distance=s.player.motionDistance;
  ticks(s,.1,{aim:{x:1,y:0},aimRevision:1});assert.equal(s.player.heading,6);assert.equal(s.player.motionDistance,distance);
  ticks(s,.025,{aim:{x:1,y:0},aimRevision:2});assert.equal(s.player.heading,0);
  g.attack(s,{x:0,y:1});assert.equal(s.player.heading,2);ticks(s,.1,{x:-1,aim:{x:-1,y:0},aimRevision:3});assert.equal(s.player.heading,2);
  g.dash(s,{x:0,y:-1});assert.equal(s.player.heading,6);ticks(s,.1,{aim:{x:1,y:0}});assert.equal(s.player.heading,6);assert.equal(s.effects.find(f=>f.type==='dash').heading,6);
});
test('blocked movement never advances gait and pausing preserves direction and pose clocks',()=>{
  const s=empty();s.player.x=s.bounds.width-s.bounds.padding;ticks(s,.2,{x:1});assert.equal(s.player.motionDistance,0);assert.equal(s.player.moving,false);assert.equal(s.player.heading,0);
  s.paused=true;const before=JSON.stringify(s);ticks(s,.5,{y:-1,attack:true});assert.equal(JSON.stringify(s),before);
});
test('enemies face their target, keep attack direction, and backpedal without showing their backs',()=>{
  const s=empty(),e={id:99,type:'spitter',boss:false,elite:false,x:s.player.x,y:s.player.y+80,homeX:s.player.x,homeY:s.player.y+80,hp:100,maxHp:100,action:'idle',actionTime:0,cooldown:99,aggro:true,speed:90,damage:10,radius:16,windup:.8,pattern:0,guardX:0,guardY:-1,guard:0,guardMax:0,exposed:0,heading:2,motionDistance:0};s.enemies=[e];ticks(s,.1);assert.equal(e.heading,6);assert.equal(e.backpedal,true);assert.ok(e.y>s.player.y+80);assert.ok(e.motionDistance>0);
  e.cooldown=0;ticks(s,.025);assert.equal(e.action,'windup');const heading=e.heading;s.player.x+=200;ticks(s,.1);assert.equal(e.heading,heading);
});
test('buffered direction survives releasing input, and rendering always uses the locked strike direction',()=>{
  const s=empty();g.attack(s,{x:0,y:-1});ticks(s,.2);g.attack(s,{x:-1,y:0});assert.equal(s.player.swing.y,-1);assert.equal(m.actorHeading(s.player),6);
  ticks(s,.15);assert.equal(s.player.combo,2);assert.equal(s.player.swing.x,-1);s.player.heading=0;assert.equal(m.actorHeading(s.player),4);
  g.dash(s,{x:0,y:1});ticks(s,.25);g.attack(s);assert.equal(s.player.swing.x,0);assert.equal(s.player.swing.y,1);assert.equal(s.player.queuedAim,null);
});
test('six-pose attacks gate contact and effects on the actual impact across attack speeds',()=>{
  for(const combo of g.COMBOS)for(const speed of [1,1.1,1.2,1.3]){
    const impact=combo.impact/speed,duration=combo.duration/speed,swing={impact,duration,motion:'forehand',x:0,y:-1};
    assert.equal(m.attackFrame(impact*.27,impact,duration,6),0);assert.equal(m.attackFrame(impact*.5,impact,duration,6),1);assert.equal(m.attackFrame(impact-1e-9,impact,duration,6),2);assert.equal(m.attackFrame(impact,impact,duration,6),3);assert.equal(m.attackFrame(duration,impact,duration,6),5);
    assert.equal(m.slashPresentation(impact,swing,false),null);assert.equal(m.slashPresentation(impact-1e-9,swing,true),null);assert.equal(m.slashPresentation(impact,swing,true).frame,0);
  }
  const s=empty();g.attack(s,{x:1,y:0});const first=m.slashPresentation(.1,s.player.swing,true);s.player.swing.motion='backhand';const second=m.slashPresentation(.1,s.player.swing,true);assert.equal(first.flipY,1);assert.equal(second.flipY,-1);assert.notEqual(first.angle,second.angle);assert.equal(m.slashPresentation(1,s.player.swing,true),null);
});
test('Lirian uses dedicated motion atlases, shared foot baselines and no old hunter runtime assets',()=>{
  assert.equal(manifest.playerCharacter.name,'리리안');assert.deepEqual(Object.keys(manifest.directions.hunter),['idle','walk','forehand','backhand','finisher','dash','hurt','death']);
  const images=new Set();for(const[family,views]of Object.entries(manifest.directions.hunter))for(const id of Object.values(views)){
    const c=manifest.clips[id];images.add(c.image);assert.equal(c.frames.length,['idle','hurt'].includes(family)?2:['walk','dash','death'].includes(family)?4:6);
    const baseline=c.frames[0].y+c.frames[0].pivotY;assert.ok(c.frames.every(f=>Math.abs(f.y+f.pivotY-baseline)<.02));
  }
  assert.equal(images.size,6);assert.ok([...images].every(i=>i.startsWith('lirian_')));assert.ok(m.runtimeClipIds(manifest).every(id=>!manifest.clips[id].image.startsWith('hunter_')));
});
test('actual locomotion head landmarks remain aligned through idle and gait without changing standing scale',()=>{
  // The read-only pixel measurements are tied to this exact, unmodified atlas.
  const bytes=fs.readFileSync(new URL('../dist/assets/'+alignment.image,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),alignment.sha256);
  for(const [direction,data] of Object.entries(alignment.directions)){
    const offsets=[];
    for(const pose of data.poses){
      const family=pose.column<2?'idle':'walk',clip=manifest.clips[manifest.directions.hunter[family][direction]],frame=clip.frames[pose.column<2?pose.column:pose.column-2];
      assert.equal(frame.bodyHeight,data.bodyHeight);
      assert.ok(Math.abs(frame.y+frame.pivotY-data.footLine)<.01);
      offsets.push((pose.headX-frame.x-frame.pivotX)*126/frame.bodyHeight);
    }
    assert.ok(Math.max(...offsets)-Math.min(...offsets)<.01,direction+' head moves at pose switches');
    assert.ok(alignment.summary[direction].beforeHorizontalSpan>38,'fixture must reproduce equal-cell drift');
    assert.ok(alignment.summary[direction].verticalSpan<1.5,'retain the existing small vertical gait');
  }
});
test('short state poses clamp at exact terminal time and fallen bodies retain the standing scale',()=>{
  for(const[action,count]of [['dash',4],['hurt',2],['death',4]]){
    const duration=m.ACTION_DURATIONS[action];assert.equal(m.actionFrame(action,0,count),0);assert.equal(m.actionFrame(action,duration-1e-9,count),count-1);assert.equal(m.actionFrame(action,duration,count),count-1);assert.equal(m.actionFrame(action,duration*100,count),count-1);assert.equal(m.actionFrame(action,NaN,count),0);
  }
  for(const id of Object.values(manifest.directions.hunter.death)){const clip=manifest.clips[id];assert.equal(clip.loop,false);assert.ok(clip.frames[3].h<clip.frames[0].h);assert.ok(clip.frames.every(f=>f.bodyHeight===clip.bodyHeight));}
});

test('skitter contact is gated by the attack transition and its fall remains opaque until the corpse fades',()=>{
  assert.equal(m.skitterFrame('windup',.54,1),0);assert.equal(m.skitterFrame('windup',.55,1),1);assert.equal(m.skitterFrame('windup',.999,1),1);
  assert.equal(m.skitterFrame('attack',0),2);assert.equal(m.skitterFrame('attack',.099),2);assert.equal(m.skitterFrame('attack',.1),3);
  assert.equal(m.skitterFrame('hurt',.139),0);assert.equal(m.skitterFrame('hurt',.14),1);
  for(const[t,frame]of [[0,0],[.125,1],[.25,2],[.375,3],[.5,3],[50,3]])assert.equal(m.skitterFrame('death',t),frame);
  const {death,hold,fade}=m.SKITTER_MOTION;assert.equal(m.skitterDeathAlpha(0),1);assert.equal(m.skitterDeathAlpha(death),1);assert.ok(Math.abs(m.skitterDeathAlpha(death+hold)-1)<1e-9);assert.ok(Math.abs(m.skitterDeathAlpha(death+hold+fade/2)-.5)<1e-9);assert.equal(m.skitterDeathAlpha(death+hold+fade),0);
});

test('skitter combat clips preserve canonical views and use standing scale for collapsed bodies',()=>{
  const families=manifest.directions.skitter;assert.deepEqual(Object.keys(families),['walk','attack','hurt','death']);
  for(const direction of ['s','se','e','ne','n']){
    const attack=manifest.clips[families.attack[direction]],hurt=manifest.clips[families.hurt[direction]],death=manifest.clips[families.death[direction]];
    assert.equal(attack.frames.length,4);assert.equal(hurt.frames.length,2);assert.equal(death.frames.length,4);assert.equal(death.bodyHeight,hurt.bodyHeight);assert.ok(death.frames[3].h<death.frames[0].h);assert.equal(death.loop,false);
  }
});
