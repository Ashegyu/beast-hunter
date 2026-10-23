import test from 'node:test';
import assert from 'node:assert/strict';
import {drawHitImpact,drawCombatProjectile} from '../dist/combat-feedback.js';
import {GROUND_DEPTH_SCALE} from '../dist/world.js';

function recorder(){
 const calls=[],stack=[],ctx={globalAlpha:.7,depth:0};
 for(const key of ['beginPath','moveTo','lineTo','ellipse','translate','rotate','scale','fillRect','fill','closePath'])ctx[key]=(...args)=>{assert.ok(args.every(Number.isFinite));calls.push({key,args,ink:ctx.fillStyle});};
 ctx.save=()=>{stack.push({globalAlpha:ctx.globalAlpha});ctx.depth++;};ctx.restore=()=>{Object.assign(ctx,stack.pop());ctx.depth--;};
 ctx.stroke=()=>calls.push({key:'stroke',ink:ctx.strokeStyle,width:ctx.lineWidth});return {ctx,calls};
}
test('normal, heavy, critical and guarded contacts are distinct, local and read only',()=>{
 const signatures=[];
 for(const details of [{},{heavy:true},{critical:true},{guarded:true}]){
  const f=Object.freeze({id:7,x:120,y:150,nx:.6,ny:.8,ttl:.1,maxTtl:.17,...details}),{ctx,calls}=recorder();
  drawHitImpact(ctx,f);assert.equal(ctx.depth,0);assert.equal(ctx.globalAlpha,.7);assert.ok(calls.some(c=>c.key==='translate'&&c.args[0]===f.x&&c.args[1]===f.y));signatures.push(JSON.stringify(calls));
  if(details.guarded)assert.equal(calls.some(c=>c.key==='ellipse'),false);
 }
 assert.equal(new Set(signatures).size,4);
});
test('reduced motion lowers impact particles, expired contacts draw nothing, and failures restore canvas ownership',()=>{
 const f={id:7,x:120,y:150,nx:1,ny:0,ttl:.1,maxTtl:.17,critical:true},full=recorder(),reduced=recorder();drawHitImpact(full.ctx,f);drawHitImpact(reduced.ctx,f,true);
 assert.ok(reduced.calls.length<full.calls.length);const empty=recorder();drawHitImpact(empty.ctx,{...f,ttl:0});assert.equal(empty.calls.length,0);
 const broken=recorder();broken.ctx.stroke=()=>{throw Error('lost canvas');};assert.throws(()=>drawHitImpact(broken.ctx,f));assert.equal(broken.ctx.depth,0);assert.equal(broken.ctx.globalAlpha,.7);
});
test('shots retain the ground anchor and readable hostile/friendly colors without accepting invalid velocity',()=>{
 for(const friendly of [false,true]){
  const {ctx,calls}=recorder(),q=Object.freeze({x:120,y:150,vx:0,vy:200,friendly});drawCombatProjectile(ctx,q);assert.equal(ctx.depth,0);assert.equal(ctx.globalAlpha,.7);
  assert.ok(calls.some(c=>c.key==='scale'&&c.args[0]===1&&c.args[1]===1/GROUND_DEPTH_SCALE));assert.ok(calls.some(c=>c.key==='fillRect'&&c.ink===(friendly?'#b6f9dc':'#ffc17a')));
  assert.ok(calls.some(c=>c.key==='stroke'&&c.width===10));
 }
 const {ctx,calls}=recorder();for(const vx of [0,NaN,Infinity])drawCombatProjectile(ctx,{x:120,y:150,vx,vy:0});assert.equal(calls.length,0);
});


test('species payloads remain distinct inside shared hostile outlines and reflected shots keep friendly color',()=>{
 const signatures=[];for(const projectileStyle of ['spore','spectral','ice']){
  const q=Object.freeze({x:120,y:150,vx:100,vy:20,color:'#b4dbfa',projectileStyle}),{ctx,calls}=recorder();drawCombatProjectile(ctx,q);assert.equal(ctx.depth,0);assert.ok(calls.some(c=>c.key==='stroke'&&c.width===10));assert.ok(calls.some(c=>c.ink==='#ffc17a'));signatures.push(JSON.stringify(calls));
  const reflected=recorder();drawCombatProjectile(reflected.ctx,{...q,friendly:true});assert.ok(reflected.calls.some(c=>c.ink==='#b6f9dc'));assert.equal(reflected.calls.some(c=>c.ink===q.color),false);
 }assert.equal(new Set(signatures).size,3);
});
