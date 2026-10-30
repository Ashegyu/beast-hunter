// 실행: node tools/benchmark-branches0146.mjs (Node 22.15+)
// dist는 읽기만 한다. 로더의 메모리 계측으로 피해 누계와 태그 단독 대조군을 만든다.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const started=performance.now(), control={off:null}, hashes={};
globalThis.__branches0146=control;
function replaceOnce(source,needle,replacement){assert.equal(source.split(needle).length,2,`계측 지점 변경: ${needle}`);return source.replace(needle,replacement);}
const hook=registerHooks({load(url,context,nextLoad){
 const result=nextLoad(url,context);
 if(!url.startsWith(new URL('../dist/',import.meta.url).href)||!url.includes('.js'))return result;
 let source=String(result.source);hashes[path.basename(new URL(url).pathname)]=createHash('sha256').update(source).digest('hex');
 if(new URL(url).pathname.endsWith('/combat-skills.js')){
  source=replaceOnce(source,'for(const t of tags)for(const [n,mods] of TAG_SYNERGY[t])','for(const t of tags)for(const [n,mods] of (globalThis.__branches0146.off===t?[]:TAG_SYNERGY[t]))');
 }
 if(new URL(url).pathname.endsWith('/game-engine.js')){
  assert.equal(source.split('e.hp-=amount;').length-1,3,'적 피해 계측 지점 변경');
  source=source.replaceAll('e.hp-=amount;','s.benchmarkDamage=(s.benchmarkDamage??0)+amount;e.hp-=amount;');
  source=replaceOnce(source,'p.hp=Math.max(0,p.hp-damage);','s.benchmarkTaken=(s.benchmarkTaken??0)+Math.min(p.hp,damage);p.hp=Math.max(0,p.hp-damage);');
 }
 return {...result,source};
}});
const g=await import(new URL('../dist/game-engine.js',import.meta.url));
hook.deregister();
const seeds=[11,97,313,997,2027], scenarios=[{id:'swarm',name:'밀집 공세',chapter:30,stage:9},{id:'boss',name:'수문장 결전',chapter:30,stage:10}];
const rank=id=>g.SKILL_BY_ID[id].kind==='ultimate'?19:14;
// 보조 스킬은 조건부 규칙의 발동 기회를 주되, 대상 스킬은 항상 첫 슬롯에 둔다.
// 패시브 대조군은 낙월(돌진·영역), 잔영참(돌진·잔상)으로 다섯 태그를 모두 포함한다.
function build(id){
 const d=g.SKILL_BY_ID[id];
 const active=d.kind==='active'?[id,...['crescent','draw','gale','mark'].filter(x=>x!==id)].slice(0,4):['crescent','draw','plunge','echo'];
 return {active,passive:d.kind==='passive'?[id]:[],ultimate:d.kind==='ultimate'?[id]:[]};
}
const tagBuilds={wave:{active:['crescent','seeking','returning'],ultimate:['eclipse']},dash:{active:['gale','echo','plunge'],ultimate:[]},area:{active:['dance','field','gather','plunge'],ultimate:['bloodmoon']},precision:{active:['draw','breach','triple','mark'],ultimate:['eclipse']},spirit:{active:['echo','mark','stance','bloodblade'],ultimate:['phantoms']}};
const cases=[];
for(const [id,tiers] of Object.entries(g.SKILL_BRANCHES)){
 const baseline=`base:${id}`;cases.push({key:baseline,type:'baseline',id,name:g.SKILL_BY_ID[id].name+' 기준',build:build(id)});
 tiers.forEach((options,tier)=>options.forEach((b,option)=>cases.push({key:`${id}:${tier}:${option}`,type:'branch',id,tier:tier+1,option:option+1,name:b.name,text:b.text,baseline,build:build(id)})));
}
for(const [tag,b] of Object.entries(tagBuilds)){
 const build={passive:[],...b},baseline=`tag:${tag}:off`;
 cases.push({key:baseline,type:'tag-off',tag,name:g.TAG_NAMES[tag]+' 끔',build,off:tag});
 cases.push({key:`tag:${tag}:on`,type:'tag',tag,name:g.TAG_NAMES[tag]+' 켬',build,baseline});
}
function profile(c){
 const p=g.createProfile(0);p.level=200;p.clearedStage=60;p.unlockedStage=60;p.stageProgress.fill(10);
 p.skillBook=g.restoreSkillBook(null,p.level);const b=p.skillBook;
 b.ranks={};b.branchOwned={};b.branchPick={};
 b.loadout={active:[...c.build.active,...Array(4-c.build.active.length).fill(null)],passive:[...c.build.passive,...Array(3-c.build.passive.length).fill(null)],ultimate:[c.build.ultimate[0]??null],beast:[null]};
 for(const id of [...c.build.active,...c.build.passive,...c.build.ultimate])b.ranks[id]=rank(id);
 b.auto={...b.auto,ultimate:'any',mode:'balanced'};
 if(c.type==='branch'){const t=c.tier-1,i=c.option-1;b.branchOwned[c.id]=1<<(t*3+i);b.branchPick[c.id]=Array(g.branchTierCount(c.id)).fill(null);b.branchPick[c.id][t]=i;assert.equal(g.activeBranches(p,c.id).length,1);}
 return p;
}
// 껐다 켜도 장착·능력치·다른 태그의 mods는 동일해야 한다.
for(const tag of Object.keys(tagBuilds)){
 const c=cases.find(c=>c.key===`tag:${tag}:on`),p=profile(c),id=c.build.active[0];
 control.off=null;const on=g.branchMods(p,id);control.off=tag;const off=g.branchMods(p,id);
 assert.notDeepEqual(on,off,tag+' 시너지 스위치');control.off=null;
}
function fight(c,scenario,seed){
 control.off=c.off??null;
 const p=profile(c);p.hunts=seed;const s=g.createGame(p,{durable:true});s.auto=true;
 assert.ok(g.launch(s,scenario.chapter,scenario.stage));
 let wall=0;
 // 0.025초 입력 프레임: 내부 스텝과 같아 히트스톱 중 버려지는 시간이 작다.
 while(s.phase==='playing'&&!s.settlement&&s.run.flow!=='stageClear'&&wall<90){
  g.advanceGame(s,.025);wall+=.025;
 }
 const cleared=s.phase==='victory'||!!s.settlement||s.run.flow==='stageClear';
 assert.ok(!cleared||s.run.stage===scenario.stage,'다음 구간으로 진행하지 않음');
 assert.equal(p.level,200,'측정 중 레벨 고정');
 return {seed,scenario:scenario.id,dps:(s.benchmarkDamage??0)/wall,damage:s.benchmarkDamage??0,damageTaken:s.benchmarkTaken??0,time:wall,killTime:cleared?wall:null,cleared,survived:s.player.hp>0,kills:s.run.kills,hpFraction:s.player.hp/s.player.maxHp,end:s.phase,flow:s.run.flow};
}
const samples=Object.fromEntries(cases.map(c=>[c.key,[]]));
let usedSeeds=0,reduced=false;
for(const seed of seeds){
 for(const c of cases)for(const scenario of scenarios)samples[c.key].push(fight(c,scenario,seed));
 usedSeeds++;
 const elapsed=(performance.now()-started)/1000;console.log(`시드 ${usedSeeds}/${seeds.length}: ${cases.length}개 구성 × ${scenarios.length}개 전투, ${elapsed.toFixed(1)}초`);
 if(usedSeeds>=2&&usedSeeds<seeds.length&&elapsed/usedSeeds*seeds.length>540){reduced=true;break;}
}
control.off=null;
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
function aggregate(rows){const dps=rows.map(r=>r.dps),avg=mean(dps);return {n:rows.length,dps:avg,dpsStddev:Math.sqrt(mean(dps.map(x=>(x-avg)**2))),killTime:mean(rows.filter(r=>r.cleared).map(r=>r.killTime)),damageTaken:mean(rows.map(r=>r.damageTaken)),survival:mean(rows.map(r=>Number(r.survived))),clearRate:mean(rows.map(r=>Number(r.cleared))),meanObservedTime:mean(rows.map(r=>r.time))};}
const ratio=(a,b)=>b===0||a===null||b===null?null:a/b;
const results=cases.map(c=>({...c,samples:samples[c.key],summary:aggregate(samples[c.key]),scenarios:Object.fromEntries(scenarios.map(s=>[s.id,aggregate(samples[c.key].filter(r=>r.scenario===s.id))]))}));
const byKey=Object.fromEntries(results.map(r=>[r.key,r]));
for(const r of results)if(r.baseline){const b=byKey[r.baseline];r.ratios=Object.fromEntries(['dps','killTime','damageTaken','survival','clearRate'].map(k=>[k,ratio(r.summary[k],b.summary[k])]));r.survivalDelta=r.summary.survival-b.summary.survival;r.clearRateDelta=r.summary.clearRate-b.summary.clearRate;r.scenarioDpsRatios=Object.fromEntries(scenarios.map(s=>[s.id,ratio(r.scenarios[s.id].dps,b.scenarios[s.id].dps)]));}
const compared=results.filter(r=>r.baseline);
const strong=compared.filter(r=>r.ratios.dps>=1.3||Object.values(r.scenarioDpsRatios).some(x=>x>=1.3));
const flat=compared.filter(r=>Object.values(r.scenarioDpsRatios).every(x=>x!==null&&Math.abs(x-1)<=.03)&&Math.abs((r.ratios.damageTaken??Infinity)-1)<=.03&&Math.abs((r.ratios.killTime??Infinity)-1)<=.03&&r.survivalDelta===0&&r.clearRateDelta===0);
const elapsed=(performance.now()-started)/1000;
const limitations=['현재 작업 트리의 0.147.5 엔진에 남아 있는 0.146 규칙을 측정했다. 0.146.0 당시 스냅샷 재현이 아니다.','Lv200 리리안, 장비 미착용·성장 투자 없음, 스킬 Lv15/궁극 Lv20 고정. 모든 비교 쌍의 장착·캐릭터·장비·챕터·시드는 같다. 스킬 사이 절대값은 서로 다른 빌드이므로 서열로 해석하지 않는다.','각 갈래를 한 개씩만 골랐다. 다른 단계는 모두 미선택이다. 전체 단계와 패시브를 포함하지만 갈래 조합 최적화는 하지 않는다.','자동 전투와 보조 스킬 4슬롯의 결과다. 조건부 갈래는 자동 사용 우선순위·출혈/빙결·완벽 회피·저체력 조건에 따라 발동하지 않을 수 있다. 변화 미미를 무용함으로 확정할 수 없다.','태그 대조는 로더로 대상 태그의 mods 추가 루프만 메모리에서 건너뛰며 다른 태그는 유지한다. 돌진 태그는 현 카탈로그에 3개뿐이어서 4개 보너스는 도달 불가능하다. 다른 태그는 장착 가능한 최대 구성을 사용하며 2·3·4개 문턱별 분리 실험은 아니다.','DPS는 실제 깎은 적 HP(과잉 피해 제외, 출혈 포함)/관측 프레임 시간이다. 대기·히트스톱 포함, 클리어/사망/시간초과까지 관측하므로 고정 시간 화력은 아니다. 전투별 DPS를 동일 가중 평균했다.','처치 시간은 해당 구간 전체 클리어에 성공한 표본만 평균한다. 실패는 null이며 클리어율을 함께 봐야 한다. 생존율은 관측 종료 시 HP>0이므로 시간초과 생존도 포함한다.','받은 피해는 보호막·감소 적용 후 적 공격으로 잃은 실제 HP 누계이며 회복으로 상쇄하지 않는다. 스킬 체력 소모는 제외한다.','두 전투(30장 밀집 공세·보스)와 소수 시드의 선별 측정이다. 표본 표준편차 대신 모집단 표준편차를 기록하며 유의성 검정은 하지 않는다. ±3% 목록은 두 전투 각각의 DPS와 전체 피해·처치시간·생존·클리어율이 모두 비슷한 경우만 표시한다.'];
if(results.every(r=>r.summary.survival===1))limitations.push('이번 표본의 생존율은 모든 구성에서 100%여서 생존율로 갈래의 방어 성능을 구분할 수 없다. 받은 피해 차이와 더 어려운 조건의 후속 측정이 필요하다.');
const report={title:'0.146 규칙 갈래·빌드 태그 밸런스 측정',command:'node tools/benchmark-branches0146.mjs',createdAt:new Date().toISOString(),runtime:process.version,elapsedSeconds:elapsed,plannedSeeds:seeds,seeds:seeds.slice(0,usedSeeds),sampleReduced:reduced,caseCount:cases.length,battleCount:results.reduce((n,r)=>n+r.samples.length,0),scenarios,sourceSha256:hashes,limitations,strong:strong.map(r=>r.key),flat:flat.map(r=>r.key),results};
const f=n=>n===null?'—':n.toFixed(2),pct=n=>n===null?'—':(n*100).toFixed(1)+'%',label=r=>r.type==='branch'?`${g.SKILL_BY_ID[r.id].name} ${r.tier}단계/${r.option} ${r.name}`:r.name;
let md=`# ${report.title}\n\n실행: \`${report.command}\`\n\n- 엔진: 현재 dist/ (0.147.5), Node ${process.version}\n- 실행 시간: ${f(elapsed)}초 / ${cases.length}개 구성 / ${report.battleCount}회 전투\n- 시드: ${report.seeds.join(', ')} (계획 ${seeds.length}개, 표본 축소: ${reduced?'예 — 10분 초과 방지를 위해 예상 총시간 540초 기준으로 완결된 시드 묶음에서 중단':'아니오'})\n- 시나리오: 30장 9구간 밀집 공세, 10구간 보스. 표의 DPS는 두 시나리오 동일 가중 평균. 비율 1.00 = 기준과 같음. 피해·시간 비율은 낮을수록 유리.\n\n## 측정 방식과 한계\n\n${limitations.map(x=>'- '+x).join('\n')}\n\n0.128 벤치마크의 엔진 import → 프로필 구성 → launch → advanceGame 반복 방식을 사용했다. 외부 저장 프로필 대신 재현 가능한 고정 프로필을 생성한다. 원본 파일 변경 없이 registerHooks로 계측하며, 예상한 원본 코드 지점이 달라지면 실패한다. JSON에 원본 모듈 SHA-256과 시드별 원시 결과를 기록했다.\n\n## 갈래 없음 기준\n\n|스킬/구성|DPS|처치 시간(초)|받은 피해|생존율|클리어율|\n|---|---:|---:|---:|---:|---:|\n`;
for(const r of results.filter(r=>!r.baseline))md+=`|${r.name}|${f(r.summary.dps)}|${f(r.summary.killTime)}|${f(r.summary.damageTaken)}|${pct(r.summary.survival)}|${pct(r.summary.clearRate)}|\n`;
md+='\n## 기준 대비 비율\n\n갈래의 기준은 동일 스킬의 갈래 없음, 태그의 기준은 동일 장착에서 해당 태그만 끔이다.\n\n|갈래/태그|DPS|DPS 비율|밀집/보스 DPS 비율|처치 시간(초)/비율|받은 피해/비율|생존율(기준 대비 %p)|클리어율|\n|---|---:|---:|---:|---:|---:|---:|---:|\n';
for(const r of compared)md+=`|${label(r)}|${f(r.summary.dps)}|${f(r.ratios.dps)}|${f(r.scenarioDpsRatios.swarm)} / ${f(r.scenarioDpsRatios.boss)}|${f(r.summary.killTime)} / ${f(r.ratios.killTime)}|${f(r.summary.damageTaken)} / ${f(r.ratios.damageTaken)}|${pct(r.summary.survival)} (${(r.survivalDelta*100).toFixed(1)})|${pct(r.summary.clearRate)}|\n`;
md+='\n## 과도한 화력 후보 (+30% 이상)\n\n전체 평균 또는 한 시나리오라도 기준 대비 DPS +30% 이상인 후보다. 통계적 확정 판정은 아니다.\n\n';
md+=strong.length?strong.map(r=>`- ${label(r)}: 평균 ${f(r.ratios.dps)}배, 밀집 ${f(r.scenarioDpsRatios.swarm)}배 / 보스 ${f(r.scenarioDpsRatios.boss)}배`).join('\n'):'없음';
md+='\n\n## 효과 미미 후보 (±3% 이내)\n\n두 시나리오의 DPS, 전체 처치 시간·받은 피해가 ±3% 이내이고 생존·클리어율도 같은 항목. 조건 미충족 및 보조 스킬에 의한 희석 가능성이 있어 무용 판정은 유보한다.\n\n';
md+=flat.length?flat.map(r=>`- ${label(r)}: 평균 DPS ${f(r.ratios.dps)}배`).join('\n'):'없음';
md+='\n\n## 태그별 요약\n\n|태그|장착 수|DPS 켬/끔|처치시간 켬/끔|피해 켬/끔|생존율 켬/끔|\n|---|---:|---:|---:|---:|---:|\n';
for(const r of results.filter(r=>r.type==='tag')){const b=byKey[r.baseline],count=g.tagSynergy(profile(r))[r.tag].count;md+=`|${r.name}|${count}|${f(r.summary.dps)} / ${f(b.summary.dps)}|${f(r.summary.killTime)} / ${f(b.summary.killTime)}|${f(r.summary.damageTaken)} / ${f(b.summary.damageTaken)}|${pct(r.summary.survival)} / ${pct(b.summary.survival)}|\n`;}
const keySummary=`## 핵심 결과\n\n- +30% 화력 후보 ${strong.length}개, 효과 미미 후보 ${flat.length}개.\n- 태그 DPS 변화(두 전투 평균): ${results.filter(r=>r.type==='tag').map(r=>r.name.replace(' 켬','')+' '+((r.ratios.dps-1)*100).toFixed(1)+'%').join(', ')}.\n- 생존율 범위: ${pct(Math.min(...results.map(r=>r.summary.survival)))}~${pct(Math.max(...results.map(r=>r.summary.survival)))}.\n\n`;
md=md.replace('## 측정 방식과 한계',keySummary+'## 측정 방식과 한계');
const dir=path.join(root,'tools/reports');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'branches-benchmark-0146.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(dir,'branches-benchmark-0146.md'),md);
console.log(`완료: ${report.battleCount}회, ${f(elapsed)}초, 강한 후보 ${strong.length}개, 효과 미미 후보 ${flat.length}개`);
