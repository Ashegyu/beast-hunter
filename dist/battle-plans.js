import {CHAPTERS} from './chapters.js?v=0.145.0';
// Chapter art/AI varies independently; encounters own role mix and arrival pacing.
const wave=(skitter,spitter,bulwark,elite=null)=>Object.freeze({skitter,spitter,bulwark,elite});
export const BATTLE_PLANS=Object.freeze([
  {id:1,name:'추격전',tag:'HUNT',tactic:'몰려오는 근접 무리를 연격과 광역 검술로 돌파해.',formation:'hunt',interval:0.11,minimumTime:0,barrels:2,waves:[wave(14,1,1),wave(16,2,1),wave(18,2,1)]},
  {id:2,name:'교차 사격',tag:'CROSSFIRE',tactic:'양쪽의 궁수를 먼저 잡고 교차 탄막을 피해.',formation:'crossfire',interval:0.1,minimumTime:0,barrels:2,waves:[wave(15,3,1),wave(17,4,1),wave(18,3,2)]},
  {id:3,name:'갑각 돌파',tag:'BREACH',tactic:'중갑의 정면을 피하고 파쇄로 정예의 방어를 깨뜨려.',formation:'front',interval:0.1,minimumTime:0,barrels:3,waves:[wave(18,2,3),wave(19,2,4),wave(21,2,4,'bulwark')]},
  {id:4,name:'포위 생존',tag:'SURVIVE',tactic:'사방에서 몰려오는 무리를 광역 검술로 빠르게 돌파해.',formation:'ring',interval:0.09,minimumTime:0,barrels:1,waves:[wave(21,2,2),wave(22,3,2),wave(22,3,3)]},
  {id:5,name:'양면 협공',tag:'PINCER',tactic:'양쪽 돌격대 사이로 빠져나와 원거리 지원을 끊어.',formation:'pincer',interval:0.09,minimumTime:0,barrels:2,waves:[wave(22,3,2),wave(24,2,2,'skitter'),wave(24,3,2)]},
  {id:6,name:'탄막 돌파',tag:'BARRAGE',tactic:'후방의 원거리 무리를 우선 처치하고 탄을 반사해.',formation:'barrage',interval:0.08,minimumTime:0,barrels:2,waves:[wave(22,5,2),wave(23,6,2,'spitter'),wave(24,6,2)]},
  {id:7,name:'정예 사냥',tag:'ELITES',tactic:'돌격·원거리·중갑 정예가 차례로 등장해. 표적에 맞춰 검술을 바꿔.',formation:'front',interval:0.08,minimumTime:0,barrels:2,waves:[wave(24,3,3,'skitter'),wave(25,5,3,'spitter'),wave(26,4,4,'bulwark')]},
  {id:8,name:'혼돈의 포위망',tag:'MELEE',tactic:'사방의 혼합 부대를 광역 검술로 정리하고 탈출로를 확보해.',formation:'ring',interval:0.07,minimumTime:0,barrels:2,waves:[wave(27,3,3),wave(28,4,3,'skitter'),wave(29,4,4,'bulwark')]},
  {id:9,name:'최후의 공세',tag:'SURGE',tactic:'번갈아 밀려오는 대규모 부대를 돌파하고 보스에게 향해.',formation:'surge',interval:0.065,minimumTime:0,barrels:3,waves:[wave(30,4,3,'skitter'),wave(31,5,3,'spitter'),wave(32,4,4,'bulwark')]},
  {id:10,name:'수문장 결전',tag:'BOSS',tactic:'보스 한 마리와의 결전. 예고를 읽고 빈틈에 집중 공격해.',formation:'boss',boss:true,interval:0,minimumTime:0,barrels:0,waves:[wave(0,0,1)]},
].map(plan=>Object.freeze({...plan,stageType:plan.id===10?'boss':plan.id===8?'elite':[4,9].includes(plan.id)?'special':'normal',timeLimit:60,waves:Object.freeze(plan.waves)})));
export const STAGES_PER_CHAPTER=BATTLE_PLANS.length;
export const battlePlan=stage=>BATTLE_PLANS[stage-1]??BATTLE_PLANS[0];
export const stageWaveCount=stage=>battlePlan(stage).waves.length;
export function waveComposition(stage,waveNumber){
  const plan=battlePlan(stage),definition=plan.waves[waveNumber-1];
  if(!definition)return [];
  const boss=!!plan.boss,actors=[];
  const parts=stage===4?{...definition,skitter:Math.max(0,definition.skitter-5),bulwark:definition.bulwark+5}:stage===9?{...definition,skitter:definition.skitter+definition.spitter+definition.bulwark,spitter:0,bulwark:0}:definition;
  for(const type of ['skitter','spitter','bulwark'])for(let i=0;i<parts[type];i++)actors.push({type,boss,elite:!boss&&(stage===8?type===['skitter','spitter','bulwark'][waveNumber-1]:definition.elite===type)&&i===0});
  return actors;
}

export const STAGE_TYPE_NAMES=Object.freeze({normal:'일반 구간',special:'특수 구간',elite:'정예 구간',boss:'보스'});
// Boss stage rules by biome (see chapters.js BIOMES.bossRule).
const BOSS_RULES=Object.freeze({
 regen:Object.freeze({name:'숲의 재생',rule:'8초마다 보스가 최대 체력 2% 회복',hint:'지속 화력·출혈·처형'}),
 fury:Object.freeze({name:'화염 폭주',rule:'12초마다 4초 동안 보스 공격력 50% 증가',hint:'폭주 중 거리 두기·회복·보호막'}),
 summon:Object.freeze({name:'빙원의 소환',rule:'체력 70%·35%에서 호위대 소환',hint:'광역·제어·생존'}),
 defense:Object.freeze({name:'망자의 방어 태세',rule:'8초 방어 → 4초 약점 노출 반복',hint:'방어 약화·출혈·약점 순간 화력'}),
});
export function stageRule(chapter,stage){
 const type=battlePlan(stage).stageType,chapterRow=CHAPTERS[chapter-1],rule=BOSS_RULES[chapterRow?.bossRule??'regen'];
 if(type==='boss'){
  if(!chapterRow?.special)return Object.freeze({type,...rule});
  const escort=chapterRow.bossRule==='summon'?'':' · 체력 70%·35%에서 호위대 4마리';
  return Object.freeze({type,special:true,name:'특수 보스 · '+rule.name,rule:rule.rule+escort+' · 체력 50%에서 광폭화',hint:rule.hint.includes('광역')?rule.hint:rule.hint+'·광역'});
 }
 if(stage===4)return Object.freeze({type,name:'철갑 진군',rule:'중장갑 · 피해 55% 감소',hint:'마지막 검끝·파갑참',required:true,armor:.55});
 if(stage===9)return Object.freeze({type,name:'밀집 공세',rule:'빠른 근접 무리 · 밀집 진형으로 연속 등장',hint:'번개 전이·처치 폭발·광폭화',swarm:true});
 if(type==='elite'){
  if(chapterRow?.midBoss)return Object.freeze({type,name:'중간 보스 · '+chapterRow.midBossName,rule:'각 웨이브 정예 출현 · 정예 체력 +20% · 마지막 웨이브에 '+chapterRow.midBossName+' 등장',hint:'단일 화력·회복·반격',eliteHp:1.2,midBoss:chapterRow.midBoss});
  return Object.freeze({type,name:'혼합 정예',rule:'각 웨이브 정예 출현 · 정예 체력 +20%',hint:'회복·반격·광역과 단일 화력의 균형',eliteHp:1.2});
 }
 return Object.freeze({type,name:battlePlan(stage).name,rule:battlePlan(stage).tactic,hint:'자유로운 장비·스킬 조합'});
}
