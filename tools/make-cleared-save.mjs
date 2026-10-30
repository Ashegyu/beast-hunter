// 일반 60챕터를 모두 ★3으로 클리어하고 별 상자 180개를 다 받은 백업 파일을 만든다. 게임의 '백업 불러오기'로 넣는다.
// node tools/make-cleared-save.mjs [레벨=180] [출력=tools/saves/normal-60-cleared.json] [난이도=0]
// 0.148.7: 난이도 1(정예)·2(악몽)을 주면 그 난이도까지 60장 보스를 모두 처치한 상태(bossMastery·difficultyProgress)로 만든다.
//   예) node tools/make-cleared-save.mjs 200 tools/saves/nightmare-60-cleared.json 2
import {writeFileSync} from 'node:fs';
import * as g from '../dist/game-engine.js';
import {createBackup,readBackup} from '../dist/profile-backup.js';
const level=Number(process.argv[2]??180),out=process.argv[3]??new URL('./saves/normal-60-cleared.json',import.meta.url),mode=Number(process.argv[4]??0);
const now=Date.now(),p=g.createProfile(now),n=g.STAGES.length;
Object.assign(p,{level,clearedStage:n,unlockedStage:n,bossMastery:g.STAGES.map(()=>mode),stageProgress:g.STAGES.map(()=>10),stageStars:g.STAGES.map(()=>2**30-1)});
p.difficultyProgress=p.difficultyProgress.map((row,i)=>i<mode?row.map(()=>10):row);
delete p.beastSkills; // 복원이 깬 챕터 보스의 괴수 기술을 기본 등급으로 채운다
const profile=g.restoreProfile(JSON.parse(JSON.stringify(p)),now),s=g.createGame(profile);
// 별 상자는 게임과 같은 경로로 받아 골드·핵·재료 보상과 ★30 성장 포인트가 그대로 들어간다.
for(const {id} of g.STAGES)for(let t=1;t<=3;t++)if(!g.claimStarChest(s,id,t))throw Error(id+'장 별 상자 '+t+' 실패');
const text=createBackup(profile,now);
const back=readBackup(text,now).profile;
if(back.stageStars.some(v=>v!==2**30-1)||back.starChests.some(v=>v!==7)||back.clearedStage!==n||back.bossMastery.some(m=>m!==mode)||back.level!==level||!g.modeOpen(back,Math.min(2,mode+1))||mode&&back.difficultyProgress.slice(0,mode).some(r=>r.some(v=>v!==10)))throw Error('검증 실패');
writeFileSync(out,text);
console.log(`Lv.${back.level}, 클리어 ${back.clearedStage}장, 난이도 ${['일반','정예','악몽'][mode]}까지 60장, 정예 개방 ${g.modeOpen(back,1)}, 악몽 개방 ${g.modeOpen(back,2)}, 괴수 기술 ${Object.keys(back.beastSkills).length}종, 별 ★3 전부·상자 180개 수령, 골드 ${back.gold}, 핵 ${back.cores}`);
