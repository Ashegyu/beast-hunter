// 일반 60챕터를 모두 클리어한 백업 파일을 만든다. 게임의 '백업 불러오기'로 넣는다.
// node tools/make-cleared-save.mjs [레벨=180] [출력=tools/saves/normal-60-cleared.json]
import {writeFileSync} from 'node:fs';
import * as g from '../dist/game-engine.js?v=0.144.8';
import {createBackup,readBackup} from '../dist/profile-backup.js?v=0.144.8';
const level=Number(process.argv[2]??180),out=process.argv[3]??new URL('./saves/normal-60-cleared.json',import.meta.url);
const now=Date.now(),p=g.createProfile(now),n=g.STAGES.length;
Object.assign(p,{level,clearedStage:n,unlockedStage:n,bossMastery:g.STAGES.map(()=>0),stageProgress:g.STAGES.map(()=>10)});
delete p.beastSkills; // 복원이 깬 챕터 보스의 괴수 기술을 기본 등급으로 채운다
const profile=g.restoreProfile(JSON.parse(JSON.stringify(p)),now),text=createBackup(profile,now);
const back=readBackup(text,now).profile;
if(back.clearedStage!==n||back.bossMastery.some(m=>m!==0)||back.level!==level||!g.modeOpen(back,1))throw Error('검증 실패');
writeFileSync(out,text);
console.log(`Lv.${back.level}, 클리어 ${back.clearedStage}장, 정예 개방 ${g.modeOpen(back,1)}, 괴수 기술 ${Object.keys(back.beastSkills).length}종, 별 상자 미수령`);
