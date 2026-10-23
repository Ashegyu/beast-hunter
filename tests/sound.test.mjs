import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatAudio} from '../dist/sound.js';
import {SKILL_CATALOG} from '../dist/combat-skills.js';
class Param{value=0;events=[];setValueAtTime(value,time){this.events.push({value,time});}exponentialRampToValueAtTime(value,time){this.events.push({value,time});}}
class Context{
  state='suspended';currentTime=1;sampleRate=24000;destination={};nodes=[];resumes=0;
  node(){const n={gain:new Param(),frequency:new Param(),connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(when){if(when===undefined)this.stopped=true;}};this.nodes.push(n);return n;}
  createGain(){return this.node();}createOscillator(){return this.node();}createBufferSource(){return this.node();}createBiquadFilter(){return this.node();}createBuffer(c,n){return{getChannelData(){return new Float32Array(n);}};}
  async resume(){this.resumes++;this.state='running';}async suspend(){this.state='suspended';}
}
test('all nineteen skill casts have distinct bounded signatures and release scheduled notes on pause',async()=>{
 const ctx=new Context(),audio=createCombatAudio(()=>ctx),signatures=[];await audio.unlock();
 for(const skill of SKILL_CATALOG.filter(d=>d.kind!=='passive')){
  const start=ctx.nodes.length;audio.play('skillCast',{skillId:skill.id});assert.ok(audio.activeVoices>=1&&audio.activeVoices<=3,skill.id);
  signatures.push(JSON.stringify(ctx.nodes.slice(start).flatMap(n=>n.frequency.events)));
  audio.suspend();assert.equal(audio.activeVoices,0);await audio.unlock();
 }
 assert.equal(new Set(signatures).size,19);
 audio.play('skillCast',{skillId:'missing'});assert.equal(audio.activeVoices,0);
 for(let i=0;i<100;i++)audio.play('skillCast',{skillId:'eclipse'});assert.equal(audio.activeVoices,10);audio.mute(true);assert.equal(audio.activeVoices,0);
});
test('audio is lazy, shares one context and refuses to play before a gesture unlock',async()=>{
  let constructions=0;const ctx=new Context(),audio=createCombatAudio(()=>{constructions++;return ctx;});audio.play('swing');assert.equal(constructions,0);assert.equal(audio.activeVoices,0);
  await Promise.all([audio.unlock(),audio.unlock()]);assert.equal(constructions,1);audio.play('swing');assert.equal(audio.activeVoices,1);assert.ok(ctx.nodes.some(n=>n.started));
});
test('overlapping effects stay within ten voices; mute, suspend and natural end disconnect resources',async()=>{
  const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();for(let i=0;i<1000;i++)audio.play(i%2?'explosion':'impact');assert.equal(audio.activeVoices,10);assert.ok(ctx.nodes.some(n=>n.stopped&&n.disconnected));
  for(const node of ctx.nodes)if(node.onended)node.onended();assert.equal(audio.activeVoices,0);audio.play('loot');assert.equal(audio.activeVoices,3);audio.mute(true);assert.equal(audio.activeVoices,0);audio.play('impact');assert.equal(audio.activeVoices,0);
  audio.mute(false);await audio.unlock();audio.play('perfectDodge');assert.equal(audio.activeVoices,2);audio.suspend();assert.equal(audio.activeVoices,0);assert.equal(ctx.state,'suspended');await audio.unlock();audio.play('swing');assert.equal(audio.activeVoices,1);
});
test('unsupported audio, resume rejection and graph construction failure leave the game usable',async()=>{
  const none=createCombatAudio(()=>null);assert.equal(await none.unlock(),false);assert.equal(none.available,false);none.play('explosion');assert.equal(none.activeVoices,0);
  const ctx=new Context();ctx.resume=()=>Promise.reject(Error('blocked'));const denied=createCombatAudio(()=>ctx);assert.equal(await denied.unlock(),false);denied.play('swing');assert.equal(denied.activeVoices,0);
  const broken=new Context(),audio=createCombatAudio(()=>broken);await audio.unlock();broken.createBufferSource=()=>{throw Error('graph failed');};audio.play('swing');assert.equal(audio.activeVoices,0);assert.ok(broken.nodes.at(-1).disconnected);
});

test('rarity drop chimes differ, remain bounded and release every voice on mute',async()=>{
 const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();audio.play('gearDrop',{rarity:0});assert.equal(audio.activeVoices,1);audio.suspend();await audio.unlock();audio.play('gearDrop',{rarity:4});assert.equal(audio.activeVoices,4);
 for(let i=0;i<100;i++)audio.play('gearDrop',{rarity:3});assert.equal(audio.activeVoices,10);audio.mute(true);assert.equal(audio.activeVoices,0);
});

test('perfect drops add a distinct two-note sparkle and release every voice on pause',async()=>{
 const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();audio.play('gearDrop',{rarity:2,perfect:true});assert.equal(audio.activeVoices,5);assert.ok(ctx.nodes.some(n=>n.frequency.events.some(e=>e.value===2637)));audio.suspend();assert.equal(audio.activeVoices,0);
 await audio.unlock();for(let n=0;n<100;n++)audio.play('gearDrop',{rarity:4,perfect:true});assert.equal(audio.activeVoices,10);audio.mute(true);assert.equal(audio.activeVoices,0);
});
test('equipment collection and gold/material collection have distinct finite signatures and release on mute',async()=>{
 const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();const signatures=[];
 for(const [type,details]of [['lootPickup',{rarity:3,perfect:true}],['resourceCollect',{kind:'gold'}],['resourceCollect',{kind:'material'}]]){const start=ctx.nodes.length;audio.play(type,details);signatures.push(JSON.stringify(ctx.nodes.slice(start).flatMap(n=>n.frequency.events)));assert.ok(audio.activeVoices>0&&audio.activeVoices<=6);audio.suspend();assert.equal(audio.activeVoices,0);await audio.unlock();}
 assert.equal(new Set(signatures).size,3);for(let n=0;n<100;n++)audio.play('lootPickup',{rarity:5,perfect:true});assert.equal(audio.activeVoices,10);audio.mute(true);assert.equal(audio.activeVoices,0);
});

test('a late resume cannot undo pause; rapid suspend/resume keeps the last requested audio state',async()=>{
  const ctx=new Context();let release;ctx.resume=()=>new Promise(resolve=>{release=()=>{ctx.state='running';resolve();};});const audio=createCombatAudio(()=>ctx);
  const opening=audio.unlock();audio.suspend();release();await opening;assert.equal(ctx.state,'suspended');assert.equal(audio.activeVoices,0);
  ctx.state='running';let endSuspend;ctx.suspend=()=>new Promise(resolve=>{endSuspend=()=>{ctx.state='suspended';resolve();};});audio.suspend();const resume=audio.unlock();endSuspend();await new Promise(resolve=>setImmediate(resolve));release();assert.equal(await resume,true);assert.equal(ctx.state,'running');
});
test('combo swings and heavy impacts have distinct audible envelopes within the voice cap',async()=>{
  const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();const signatures=[];
  for(let combo=1;combo<=3;combo++){const start=ctx.nodes.length;audio.play('swing',{combo});signatures.push(ctx.nodes.slice(start).flatMap(n=>n.frequency.events.map(e=>e.value)));audio.suspend();await audio.unlock();}
  assert.equal(new Set(signatures.map(s=>JSON.stringify(s))).size,3);
  const start=ctx.nodes.length;audio.play('impact',{heavy:false});const normal=ctx.nodes.slice(start).flatMap(n=>n.frequency.events.map(e=>e.value));const next=ctx.nodes.length;audio.play('impact',{heavy:true});const heavy=ctx.nodes.slice(next).flatMap(n=>n.frequency.events.map(e=>e.value));assert.notDeepEqual(normal,heavy);assert.ok(audio.activeVoices<=10);
});

test('skitter contact and shell collapse use bounded distinct voices and obey mute cleanup',async()=>{
  const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();audio.play('skitterStrike');assert.equal(audio.activeVoices,1);audio.play('skitterDeath');assert.equal(audio.activeVoices,3);
  for(let i=0;i<100;i++)audio.play('skitterDeath');assert.equal(audio.activeVoices,10);audio.mute(true);assert.equal(audio.activeVoices,0);audio.play('skitterStrike');assert.equal(audio.activeVoices,0);
});


test('mythic and ancient drop chimes use distinct note counts and stay inside ten voices',async()=>{
 const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();audio.play('gearDrop',{rarity:4});assert.equal(audio.activeVoices,4);audio.suspend();await audio.unlock();audio.play('gearDrop',{rarity:5});assert.equal(audio.activeVoices,6);for(let i=0;i<20;i++)audio.play('uniqueLink');assert.equal(audio.activeVoices,10);audio.suspend();assert.equal(audio.activeVoices,0);
});


test('boss herald and stage seal use short bounded tones with existing mute and suspend ownership',async()=>{
 const ctx=new Context(),audio=createCombatAudio(()=>ctx);await audio.unlock();audio.play('bossArrival');assert.equal(audio.activeVoices,2);assert.ok(ctx.nodes.some(n=>n.frequency.events.some(e=>e.value===82)));audio.suspend();assert.equal(audio.activeVoices,0);await audio.unlock();audio.play('seal');assert.equal(audio.activeVoices,2);for(let i=0;i<30;i++)audio.play('bossArrival');assert.equal(audio.activeVoices,10);audio.mute(true);assert.equal(audio.activeVoices,0);audio.play('seal');assert.equal(audio.activeVoices,0);
});
