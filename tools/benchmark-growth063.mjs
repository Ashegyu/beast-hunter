import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {growthXp,xpNeeded} from '../dist/game-engine.js';
const cases=[{level:5,xp:0,base:9},{level:19,xp:xpNeeded(19)-1,base:240},{level:1,xp:0,base:1e9}],rows=[];let checksum=0;
for(const row of cases){
 const samples=[],batch=1000;
 for(let sample=0;sample<240;sample++){const start=performance.now();for(let i=0;i<batch;i++)checksum+=growthXp(row,row.base);if(sample>=40)samples.push((performance.now()-start)/batch);}
 samples.sort((a,b)=>a-b);rows.push({...row,calls:240000,batchSize:batch,measuredBatches:samples.length,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95BatchAverageMs:samples[Math.floor(samples.length*.95)],maxBatchAverageMs:samples.at(-1)});
}
const report={scope:'Node CPU only: average query time within 1000-call batches. Not per-call tail latency, browser/GPU/device timing or whole-frame performance.',node:process.version,checksum,rows};
fs.writeFileSync(new URL('../art/quality063/xp-query-cpu.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
