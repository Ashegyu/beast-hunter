// Alpha 0.136 보스 러시 측정: 챕터 c를 막 깬 프로필(simulate-campaign0133의 프로필 저장 폴더의 c<c+1>.json)로 보스 러시를 돌려
// 쓰러뜨린 보스 수·시간·끝난 이유·남은 체력을 출력한다.
// 사용: node tools/benchmark-bossrush0136.mjs dist <프로필 폴더> <챕터들(쉼표)> [반복]
//  프로필 만들기: node tools/simulate-campaign0133.mjs dist 0 60 switch <프로필 폴더>
//  RUSH_HP_SCALE / RUSH_DMG_SCALE: 적 체력·피해 배율 덮어쓰기(보정 탐색용), SEAL=<효과 id> SEAL_LV=<0~10>: 그 인장을 착용
import fs from 'node:fs';import path from 'node:path';
const dist=path.resolve(process.argv[2]);const g=await import('file://'+dist+'/game-engine.js');
const dump=process.argv[3],chapters=process.argv[4].split(',').map(Number),N=Number(process.argv[5]||6);
const HP=Number(process.env.RUSH_HP_SCALE||1),DMG=Number(process.env.RUSH_DMG_SCALE||process.env.RUSH_HP_SCALE||1);
for(const c of chapters){
 const file=path.join(dump,`c${c+1}.json`);if(!fs.existsSync(file)){console.log('no dump',c);continue;}
 const res=[];
 for(let n=0;n<N;n++){
  const p=g.restoreProfile(fs.readFileSync(file,'utf8'),1000);p.hunts+=n*7;const s=g.createGame(p);s.enemyScale={hp:HP,damage:1};if(process.env.SEAL){const it=g.makeSeal({id:999001,effect:process.env.SEAL});for(let k=0;k<Number(process.env.SEAL_LV||0);k++)g.growSeal(it);p.inventory.push(it);g.equipItem(s,999001);}
  if(!g.launchBossRush(s,1000+n)){console.log('launch fail',c);break;}
  s.enemyScale={hp:HP,damage:DMG};
  let i=0;for(;i<40000&&s.phase==='playing'&&!s.settlement;i++)g.advanceGame(s,.05);
  res.push({kills:s.run.rushKills,time:Math.round(s.run.time),end:s.run.rushEnd??(s.phase),hp:Math.round(s.player.hp/s.player.maxHp*100),seal:s.run.dungeonReward?.item?.name??'-'});
 }
 const avg=res.reduce((a,r)=>a+r.kills,0)/res.length;
 console.log('ch'+c,'avgKills',avg.toFixed(1),res.map(r=>r.kills+'/'+r.time+'s/'+r.end+'/'+r.hp+'%').join(' '));
}
