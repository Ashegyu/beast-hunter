import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const baselineCommit=process.argv[2];if(!baselineCommit)throw Error('Supply baseline commit');
let original=execFileSync('git',['show',baselineCommit+':dist/game-engine.js'],{encoding:'utf8'});
for(const path of ['world','motion'])original=original.replace("'./"+path+".js'",JSON.stringify(new URL('../dist/'+path+'.js',import.meta.url).href));
const baseline=await import('data:text/javascript;base64,'+Buffer.from(original).toString('base64'));
const current=await import('../dist/game-engine.js');
const make=g=>{const p=g.createProfile(1000);p.level=5;p.skills.haste=3;p.skills.chain=2;p.forge.blade=2;const s=g.createGame(p);g.launch(s);s.enemies=[];s.barrels=[];s.caches=[];return s;};
const old=make(baseline),fresh=make(current);
const snapshot=s=>({player:s.player,profile:s.profile,run:s.run,phase:s.phase,paused:s.paused,rng:s.rng,hitStop:s.hitStop,shake:s.shake,effects:s.effects});
for(let frame=0;frame<2400;frame++){
  const angle=Math.floor(frame/90)%8*Math.PI/4,n={x:Math.cos(angle),y:Math.sin(angle)},input={...n,aim:n,aimRevision:frame,attack:frame%17<7};
  for(const[g,s]of[[baseline,old],[current,fresh]]){
    if(frame===777)s.paused=true;if(frame===797)s.paused=false;
    if(frame%131===5)g.thunder(s,n);if(frame%137===40)g.dash(s,n);
    g.advanceGame(s,frame%5===0?.05:1/60,input);
  }
  assert.deepEqual(snapshot(fresh),snapshot(old),'manual player behavior changed at frame '+frame);
}
const report={baselineCommit,frames:2400,equal:true,comparison:'exact player/profile/run/RNG/effects/phase snapshots each frame; excludes authored chapter/monster/treasure state',scope:'manual walking, held combo, directed heavy attack, dash and pause; no enemies'};
fs.writeFileSync(new URL('reports/chapters-alpha09-player-preservation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
