import test from 'node:test';import assert from 'node:assert/strict';
import {FrameMetrics} from '../dist/frame-metrics.js';
test('bounded frame diagnostics separate CPU, frame intervals and work actually performed',()=>{
 const m=new FrameMetrics(20);let result;for(let i=1;i<=20;i++)result=m.add({cpu:i,engine:1,draw:2,hud:i===20?4:0,storage:0,interval:100,hudRan:i===20,drawRan:true,enemies:i,effects:i*2});
 assert.equal(result.samples,20);assert.equal(result.cpuP95,19);assert.equal(result.intervalP95,100);assert.equal(result.hudFrames,1);assert.equal(result.drawFrames,20);assert.equal(result.enemies,20);assert.equal(result.effects,40);
 for(let i=0;i<20;i++)result=m.add({cpu:2,engine:1,draw:1,hud:0,interval:16,hudRan:false,drawRan:false});assert.equal(result.samples,40);assert.equal(result.cpuMax,2);assert.equal(result.enemies,0);assert.equal(result.hudFrames,0);m.reset();assert.equal(m.total,0);assert.equal(m.count,0);assert.equal(m.samples.cpu.length,20);
});
