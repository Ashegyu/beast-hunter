// Offline roll CPU measurement and deterministic loot-distribution audit.
// No browser, rendering, live frame-time or GC-pause claim is made here.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {rollItem,LEGENDARY_PITY_LIMIT} from '../dist/loot.js';
const base=execFileSync('git',['show','19eba118b865c554208eb6a2bbb943ec54a13346:dist/loot.js'],{encoding:'utf8'}).replace(/from '(\.\/[^']+)'/g,(_,path)=>'from '+JSON.stringify(new URL(path,new URL('../dist/loot.js',import.meta.url)).href));
const previous=await import('data:text/javascript;base64,'+Buffer.from(base).toString('base64'));
const random=(seed=12345)=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
function audit(roll,source,protectedDrops,count=200000){
 const rng=random(),qualities=Array(6).fill(0);let streak=0,maxDryDrops=0,perfect=0;
 for(let n=0;n<count;n++){
  const minimum=protectedDrops&&(streak>=LEGENDARY_PITY_LIMIT-1||source==='boss'&&n%2===0)?3:0;
  const item=roll({id:n+1,tier:n%3+1,source,minimum},rng);qualities[item.rarity]++;if(item.perfect)perfect++;
  streak=item.rarity>=3?0:streak+1;maxDryDrops=Math.max(maxDryDrops,streak);
 }
 return{count,qualities,legendaryOrBetterPercent:qualities.slice(3).reduce((a,b)=>a+b,0)/count*100,ancientPercent:qualities[5]/count*100,perfect,maxDryDrops};
}
function trial(roll){const rng=random();let checksum=0;const start=performance.now();for(let n=0;n<30000;n++)checksum+=roll({id:n+1,tier:n%3+1,source:'normal'},rng).rarity;return{microsecondsPerRoll:(performance.now()-start)*1000/30000,checksum};}
trial(previous.rollItem);trial(rollItem);const before=[],after=[];for(let n=0;n<7;n++){if(n%2){after.push(trial(rollItem));before.push(trial(previous.rollItem));}else{before.push(trial(previous.rollItem));after.push(trial(rollItem));}}
const median=rows=>rows.map(r=>r.microsecondsPerRoll).sort((a,b)=>a-b)[Math.floor(rows.length/2)];
const report={scope:'Node pure item rolling, not browser frame-time. 7 alternating trials of 30,000 rolls; median wall-time per roll. Distribution samples are conditional on an equipment drop, not a kill.',baselineCommit:'19eba118b865c554208eb6a2bbb943ec54a13346',cpu:{beforeMicroseconds:median(before),afterMicroseconds:median(after)},normal:{before:audit(previous.rollItem,'normal',false),after:audit(rollItem,'normal',true)},boss:{before:audit(previous.rollItem,'boss',false),after:audit(rollItem,'boss',true)}};
if(report.normal.after.maxDryDrops>=20||report.boss.after.maxDryDrops>1)throw Error('Drop protection failed');
const path=new URL('../art/quality075/loot-measurement.json',import.meta.url);fs.mkdirSync(new URL('../art/quality075/',import.meta.url),{recursive:true});fs.writeFileSync(path,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
