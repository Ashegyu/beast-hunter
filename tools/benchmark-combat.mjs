import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const root=fileURLToPath(new URL('../',import.meta.url));
const baselineCommit=process.argv[2]??'45a1e53fe4f63cc7fbe61aa6e62314e8b3f11764';
const original=execFileSync('git',['show',baselineCommit+':dist/game-engine.js'],{cwd:root,encoding:'utf8'}).replace("'./world.js'", JSON.stringify(new URL('../dist/world.js',import.meta.url).href)).replace("'./motion.js'",JSON.stringify(new URL('../dist/motion.js',import.meta.url).href));
const current=await import('file://'+root+'/dist/game-engine.js');
const baseline=await import('data:text/javascript;base64,'+Buffer.from(original).toString('base64'));
function bench(g,stress=false){
  const samples=[];let maxEffects=0,maxShots=0;
  for(let run=0;run<40;run++){
    const s=g.createGame();g.launch(s,1);s.auto=true;
    if(stress){s.auto=false;s.barrels=[];s.player.hp=1e8;s.player.invulnerable=1e8;for(const e of s.enemies){e.aggro=true;e.homeX=s.player.x;e.homeY=s.player.y;e.x=s.player.x+200;e.y=s.player.y;e.hp=1e8;}}
    for(let frame=0;frame<1200;frame++){
      if(s.phase!=='playing'){g.returnToCamp(s);g.launch(s,1);s.auto=true;}
      if(stress&&s.projectiles&&s.projectiles.length<64){s.projectiles=Array.from({length:64},(_,i)=>({id:s.nextId++,x:s.player.x+200+(i%8)*40,y:s.player.y-300+Math.floor(i/8)*50,vx:10,vy:1,damage:1,ttl:100,friendly:!!(i%2),perfectDodged:false}));}
      const t=performance.now();g.advanceGame(s,1/60);const elapsed=performance.now()-t;if(run>=5)samples.push(elapsed);
      maxEffects=Math.max(maxEffects,s.effects.length);maxShots=Math.max(maxShots,s.projectiles?.length??0);
    }
  }
  samples.sort((a,b)=>a-b);return{samples:samples.length,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)],p99Ms:samples[Math.floor(samples.length*.99)],maxMs:samples.at(-1),maxEffects,maxShots};
}
const report={node:process.version,baselineCommit,scope:'pure game engine only, container CPU; excludes canvas, audio hardware, browser GC and input latency',baseline:bench(baseline),current:bench(current),currentStress:bench(current,true)};
console.log(JSON.stringify(report,null,2));
