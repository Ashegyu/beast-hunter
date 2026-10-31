// 실행: node tools/benchmark-endgame0148.mjs (Node >=22.15, 저장소 어디에서나 실행 가능)
// dist는 읽기만 한다. 메모리 로더로 HP 손실만 계측하며 밸런스/난수/전투 판단은 바꾸지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=new URL('../dist/',import.meta.url);
const version=fs.readFileSync(path.join(root,'dist/index.html'),'utf8').match(/\?v=([\d.]+)/)[1];
const started=performance.now(),deadline=started+540_000,now=Date.UTC(2026,9,30),dt=.025;
const plannedSeeds=[11,97,313],hashes={};
const elapsed=()=> (performance.now()-started)/1000;
const once=(src,from,to)=>{assert.equal(src.split(from).length,2,'계측 지점 변경: '+from);return src.replace(from,to);};
// 회복과 같은 프레임에 발생한 피해/체력 소모도 누락하지 않는다.
globalThis.__endgame0148Loss=(s,amount,kind)=>{
 const n=Math.min(s.player.hp,Math.max(0,amount));
 s.bench??={enemy:0,cost:0,dot:0,debuffSeconds:0,combatSeconds:0,lowest:1,lethalHits:0};s.bench[kind]+=n;
 s.bench.lowest=Math.min(s.bench.lowest,(s.player.hp-n)/s.player.maxHp);
 if(n>=s.player.hp&&n>0)s.bench.lethalHits++;
};
const hook=registerHooks({load(url,context,next){
 const r=next(url,context);if(!url.startsWith(dist.href)||!new URL(url).pathname.endsWith('.js'))return r;
 let src=String(r.source);hashes[path.basename(new URL(url).pathname)]=createHash('sha256').update(src).digest('hex');
 if(new URL(url).pathname.endsWith('/game-engine.js')){
  src=once(src,'p.hp=Math.max(0,p.hp-damage);',"globalThis.__endgame0148Loss(s,damage,'enemy');p.hp=Math.max(0,p.hp-damage);");
  src=once(src,'{const dot=status.tickStatuses(p,s.run.time,step,statusLevel(s));',"{s.bench??={enemy:0,cost:0,dot:0,debuffSeconds:0,combatSeconds:0,lowest:1,lethalHits:0};s.bench.combatSeconds+=step;if(status.statusList(p,s.run.time).length)s.bench.debuffSeconds+=step;const dot=status.tickStatuses(p,s.run.time,step,statusLevel(s));");
  src=once(src,'p.hp=Math.max(1,p.hp-p.maxHp*dot);',"{globalThis.__endgame0148Loss(s,Math.min(p.hp-1,p.maxHp*dot),'dot');p.hp=Math.max(1,p.hp-p.maxHp*dot);}");
  src=once(src,'p.hp-=hpCost;',"globalThis.__endgame0148Loss(s,hpCost,'cost');p.hp-=hpCost;");
 }
 if(new URL(url).pathname.endsWith('/combat-skills.js'))src=once(src,'if(br.hpCost)p.hp=Math.max(1,p.hp-p.maxHp*br.hpCost);',"if(br.hpCost){globalThis.__endgame0148Loss(s,Math.min(p.hp-1,p.maxHp*br.hpCost),'cost');p.hp=Math.max(1,p.hp-p.maxHp*br.hpCost);}");
 return {...r,source:src};
}});
const g=await import(new URL('game-engine.js',dist));
const loot=await import(new URL(`loot.js?v=${version}`,dist));
hook.deregister();
const profileDefs=[{id:'A',name:'무장비'},{id:'B',name:'6지역 고대 +20·장신구'},{id:'C',name:'악몽 레이드 고대 +40·승화 +45'}];
function makeProfile(def){
 let p=g.createProfile(now),n=g.STAGES.length;
 Object.assign(p,{level:200,clearedStage:n,unlockedStage:n,bossMastery:g.STAGES.map(()=>2),stageProgress:g.STAGES.map(()=>10),stageStars:g.STAGES.map(()=>2**30-1)});
 p.difficultyProgress=p.difficultyProgress.map(r=>r.map(()=>10));delete p.beastSkills;
 p=g.restoreProfile(JSON.parse(JSON.stringify(p)),now);const s=g.createGame(p);
 for(const {id}of g.STAGES)for(let t=1;t<=3;t++)assert.ok(g.claimStarChest(s,id,t));
 // 199 단련 포인트: 화력 179, 생존 20. 트리는 검귀 → 검술사 → 나머지 순서.
 for(const [id,count]of Object.entries({power:65,tempo:40,precision:34,ferocity:40,vitality:10,guard:10}))for(let i=0;i<count;i++)assert.ok(g.trainStat(s,id));
 const order=[...g.TREE_ORDER].sort((a,b)=>{
  const priority=id=>id.startsWith('blade-')?0:id.startsWith('art-')?1:2;return priority(a)-priority(b);
 });
 for(let pass=0;pass<3;pass++)for(const id of order)g.learnGrowthNode(s,id);
 p.skillBook=g.restoreSkillBook(null,p.level);assert.ok(g.applySkillExample(s,0));
 p.skillBook.ranks={};p.skillBook.branchOwned={};p.skillBook.branchPick={};
 for(const id of Object.values(p.skillBook.loadout).flat().filter(Boolean))p.skillBook.ranks[id]=g.SKILL_BY_ID[id].kind==='ultimate'?19:14;
 p.skillBook.auto={...p.skillBook.auto,ultimate:'any',mode:'balanced'};
 p.inventory=[];p.equipment=g.emptyEquipment();
 if(def.id!=='A'){
  // 자원은 제작 API의 비용/개방 검사용이다. 전투 능력치에는 영향을 주지 않는다.
  p.gold=1_000_000_000;for(const m of g.MATERIALS)p.materials[m.id]=1_000_000;
  const positions=['weapon','helmet','armor','pants','boots','charm','earringLeft','earringRight'];
  for(const [i,pos]of positions.entries()){
   const slot=g.itemSlotForPosition(pos),raid=def.id==='C'&&['weapon','helmet','armor','charm','earringLeft'].includes(pos)?'sovereign':null;
   let item=def.id==='B'&&slot==='earring'?loot.rollItem({id:i+1,tier:6,slot,quality:4},()=>.5):loot.rollAncient({id:i+1,tier:6,slot,hunt:def.id==='C'?2:0,raid},.37);
   p.inventory.push(item);
   if(def.id==='C'&&!raid){const result=g.forgeAncient(s,item.id,g.FORGE_EFFECTS[slot][0].id);assert.ok(result.ok,result.reason);item=result.item;}
   item.enhancement=def.id==='B'?20:item.rarity===6?45:40;
   assert.ok(item.enhancement<=g.enhancementCap(item.rarity));
   // enhancementAffixes 생략 시 엔진 복원식: 기본값 × 단계 ×3%. 재추첨 없음.
   assert.ok(g.equipItem(s,item.id,pos));
  }
  p.nextItemId=9;
 }
 // 실제 저장 복원 경로가 장비/강화/스킬/포인트를 자르지 않는지 확인한다.
 const restored=g.restoreProfile(JSON.parse(JSON.stringify(p)),now);
 assert.deepEqual(restored.equipment,p.equipment);assert.deepEqual(restored.training,p.training);
 assert.deepEqual(restored.growthTree,p.growthTree);
 assert.ok(restored.bossMastery.every(x=>x===2));assert.ok(restored.difficultyProgress.every(r=>r.every(x=>x===10)));
 for(const item of p.inventory){const r=restored.inventory.find(x=>x.id===item.id);assert.equal(r.enhancement,item.enhancement);assert.equal(r.rarity,item.rarity,JSON.stringify(item));for(const key of Object.keys(item.affixes))assert.equal(loot.effectiveAffix(r,key),loot.effectiveAffix(item,key));}
 for(const id of Object.values(restored.skillBook.loadout).flat().filter(Boolean))assert.equal(g.skillRank(restored,id),g.SKILL_BY_ID[id].kind==='ultimate'?20:15);
 assert.equal(g.trainingPoints(restored),0);
 return restored;
}
const profiles=profileDefs.map(def=>({...def,profile:makeProfile(def)}));
if(process.env.PURIFY==='1')for(const id of ['B','C']){
 const base=profiles.find(p=>p.id===id),profile=structuredClone(base.profile),active=profile.skillBook.loadout.active;
 // 첫 스킬이 이미 파갑참이면 중복 장착 대신 다음 기존 스킬을 보존한다.
 const first=active.find(id=>id&&!['stance','parry','breach'].includes(id))??active[0];
 profile.skillBook.loadout.active=['stance','parry','breach',first];
 for(const skill of profile.skillBook.loadout.active)profile.skillBook.ranks[skill]=14;
 profiles.push({id:id+'+',name:base.name+' · 정화 빌드',profile});
}
const scenarios=[];
// CHAPTERS=10,15,20 이면 그 장들의 정예·악몽 보스만 잰다(레이드·일반 9 생략, 보고서는 endgame-chapters-0148.*에 따로).
const CHAPTER_LIST=process.env.CHAPTERS?.split(',').map(Number).filter(Boolean)??null;
if(!CHAPTER_LIST)for(const r of g.RAIDS)for(const tier of r.fixedTier==null?[0,1,2]:[r.fixedTier])scenarios.push({id:`raid-${r.id}-${tier}`,name:`${r.name} ${g.RAID_TIERS[tier]}`,raid:r.id,tier});
for(const difficulty of [1,2])for(const chapter of CHAPTER_LIST??[30,60])scenarios.push({id:`mode-${difficulty}-${chapter}-10`,name:`${g.RAID_TIERS[difficulty]} ${chapter}장 보스`,difficulty,chapter,stage:10});
if(!CHAPTER_LIST)scenarios.push({id:'mode-2-60-9',name:'악몽 60장 일반 9',difficulty:2,chapter:60,stage:9});
function fight(profile,scenario,seed){
 const p=structuredClone(profile);p.hunts=seed;const s=g.createGame(p,{durable:true});s.auto=true;
 assert.ok(scenario.raid?g.launchRaid(s,scenario.raid,now,null,scenario.tier):g.launch(s,scenario.chapter,scenario.stage,null,scenario.difficulty),'입장 실패 '+scenario.id);
 const initialRng=s.rng,maxHp=s.player.maxHp;let wall=0,lowest=1,interrupted=false;
 while(s.phase==='playing'&&!s.settlement&&s.run.flow!=='stageClear'){
  if(performance.now()>deadline||wall>s.run.timeLimit+30){interrupted=true;break;}
  g.advanceGame(s,dt);wall+=dt;lowest=Math.min(lowest,s.player.hp/s.player.maxHp,s.bench?.lowest??1,s.run.lowestHp??1);
 }
 const cleared=!!s.settlement||s.phase==='victory'||s.run.flow==='stageClear',b=s.bench??{enemy:0,cost:0,dot:0,debuffSeconds:0,combatSeconds:0,lethalHits:0};
 assert.ok(!cleared||s.run.stage===(scenario.stage??1),'다음 스테이지 진입');assert.equal(p.level,200);
 const died=s.phase==='defeat'&&s.player.hp<=0;
 return {seed,initialRng,cleared,clearSeconds:cleared?wall:null,observedSeconds:wall,engineSeconds:s.run.time,maxHp,damageTaken:b.enemy,hpCost:b.cost,burnDamage:b.dot,debuffSeconds:b.debuffSeconds,combatSeconds:b.combatSeconds,debuffRatio:b.combatSeconds?b.debuffSeconds/b.combatSeconds:0,totalHpLost:b.enemy+b.cost+b.dot,lossRatio:(b.enemy+b.cost+b.dot)/maxHp,enemyLossRatio:b.enemy/maxHp,lowestHpRatio:lowest,finalHpRatio:s.player.hp/maxHp,died,lethalHits:b.lethalHits,timedOut:s.run.timedOut,interrupted,end:s.phase,flow:s.run.flow,bossRemaining:s.enemies.filter(e=>e.boss&&!e.dead).map(e=>({hp:e.hp,maxHp:e.maxHp})),dealt:s.run.dealt??0};
}
const results=profiles.flatMap(p=>scenarios.map(s=>({profile:p.id,scenario:s.id,samples:[]})));
let reduced=false;const usedSeeds=[];
for(const seed of plannedSeeds){
 for(const r of results){if(performance.now()>deadline){reduced=true;break;}r.samples.push(fight(profiles.find(p=>p.id===r.profile).profile,scenarios.find(s=>s.id===r.scenario),seed));}
 if(results.every(r=>r.samples.some(x=>x.seed===seed&&!x.interrupted)))usedSeeds.push(seed);else {reduced=true;break;}
 console.log(`시드 ${seed}: 누계 ${results.reduce((n,r)=>n+r.samples.length,0)}전 / ${elapsed().toFixed(2)}초`);
 if(usedSeeds.length<plannedSeeds.length&&elapsed()/usedSeeds.length*plannedSeeds.length>500){reduced=true;break;}
}
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
for(const r of results){
 const rows=r.samples.filter(x=>!x.interrupted),wins=rows.filter(x=>x.cleared);
 r.summary={n:rows.length,clears:wins.length,clearRate:mean(rows.map(x=>+x.cleared)),clearSeconds:mean(wins.map(x=>x.clearSeconds)),lossRatio:mean(rows.map(x=>x.lossRatio)),enemyLossRatio:mean(rows.map(x=>x.enemyLossRatio)),burnLossRatio:mean(rows.map(x=>x.burnDamage/x.maxHp)),debuffRatio:mean(rows.map(x=>x.debuffRatio)),lowestHpRatio:mean(rows.map(x=>x.lowestHpRatio)),worstHpRatio:rows.length?Math.min(...rows.map(x=>x.lowestHpRatio)):null,deaths:rows.filter(x=>x.died).length,timeouts:rows.filter(x=>x.timedOut).length};
 const a=r.summary;r.easy=a.n>0&&a.clears===a.n&&a.clearSeconds<10&&a.lossRatio<.2;
 // 37.5초까지 노출 시간이 늘면 피해도 대략 같은 비율로 증가한다고 가정한다.
 // HP·공격을 동시에 늘릴 때 공격 배율은 시간 증가분으로 나눠 중복 계산을 피한다.
 r.estimate=a.clears===a.n&&a.n?{hpMultiplier:[30/a.clearSeconds,45/a.clearSeconds],hpMid:37.5/a.clearSeconds,damageMultiplier:a.lossRatio>0?[.4/(a.lossRatio*37.5/a.clearSeconds),.7/(a.lossRatio*37.5/a.clearSeconds)]:null,damageMid:a.lossRatio>0?.55/(a.lossRatio*37.5/a.clearSeconds):null}:null;
}
const f=x=>x==null?'—':x.toFixed(2),pct=x=>x==null?'—':(x*100).toFixed(1)+'%',range=xs=>xs?xs.map(f).join('–'):'산출 불가';
const limitations=[
 `3시드 × ${profiles.length}프로필 × ${scenarios.length}시나리오 = 최대 ${3*profiles.length*scenarios.length}전. 0.025초 입력, 자동 전투, 720×1280 기본 전장. 각 전투는 새 프로필 복사본으로 입장하므로 주간 입장·전리품·성장 이월이 없다.`,
 '전체 실행 예산 540초(보고서 작성 여유 60초). 완결 시드 묶음의 속도로 500초 초과를 예상하면 다음 시드를 생략한다. 전투 도중 540초를 넘으면 interrupted로 남기며 평균·승률에서 제외한다. 엔진 제한 시간+30초의 관측 상한도 둔다.',
 '모두 Lv200·일반/정예/악몽 60장 클리어·별 상자 180개 수령. 단련 199P, 트리 최대 159P 내 공격 우선 동일 투자. 초월·탑·승화 각성·각인·괴수 기술·스킬 갈래는 추가하지 않았다. 스킬은 보스 폭딜 예시 1종을 모든 전투에 고정하며 스테이지마다 최적 빌드로 바꾸지 않는다.',
 'B는 6지역 일반 고대 6부위(무기·투구·상의·하의·신발·목걸이)와 신화 귀걸이 2개 +20. C는 악몽의 군주 고대 5부위 +40와 6지역 악몽 고대에서 API로 승화한 하의·신발·귀걸이 +45. 전용 인장은 미착용. 같은 귀걸이 카탈로그 중복은 세트 부위 수에 한 번만 잡힌다.',
 '고대는 rollAncient 고정 pick=.37·기본 수치(powerRoll=100), B 귀걸이는 rollItem(quality=4, RNG=.5)로 생성. 지역 고대 귀걸이는 현재 저장 복원에서 신화로 바뀌어 B에서 제외했다. 강화 필드는 직접 설정하고 enhancementAffixes는 엔진의 기본값×강화×3% 복원 공식을 사용한다. 고대 +40/제작 +50 상한 및 저장 왕복 후 실제 옵션값 동일성을 단언한다. C 승화 비용은 지급한 가상 자원으로 실제 API에서 지불한다. 획득·강화에 걸리는 시간/경제성의 현실성은 측정하지 않는다.',
 '클리어 시간은 성공 표본의 advanceGame 입력 시간 합(이동·히트스톱 포함). 엔진 시간도 JSON에 보존한다. 누적 손실은 보호막·피해 감소 후 실제 잃은 HP + 장비/갈래의 체력 소모이며 회복을 빼지 않아 100%를 넘을 수 있다. enemyLossRatio는 적 공격만 별도 기록하고 burnDamage는 화상 실제 손실을 기록한다. 디버프 비율은 히트스톱을 제외한 엔진 전투 시간 중 상태 효과가 활성인 시간이다. 최저 HP는 피격/소모 직후, 회복·부활 이전 값도 포함한다. 사망은 최종 HP 0 패배이며 부활 가능한 치명타는 lethalHits로 분리한다.',
 '쉬움은 전 시드 클리어 + 평균 10초 미만 + 누적 HP 손실 20% 미만의 선별 기준이다. 시드 수가 적고 장비 조합 하나뿐이므로 통계적 확정 판정이 아니다.',
 '배율은 전 시드 성공한 행에만 제시한다. 적 HP ×(30~45/현재 시간), 중심값은 37.5초. 공격 ×(목표 손실 0.4~0.7)/(현재 손실×37.5/현재 시간). 이는 목표 30~45초/40~70%의 대략적인 출발점이며 재시뮬레이션으로 검증한 권장 확정값이 아니다.',
 '이동·고정 웨이브 대기·과잉 피해·방어 태세·추가 소환·회복·보호막 문턱 때문에 시간/피해는 비선형이다. 특히 12초 주기의 심판/저주(최대 HP 비율 피해)는 전투 연장 후 새로 발생하므로 단순 공격 배율로 해결할 수 없다. 피해 0에서는 공격 배율 산출 불가. 일반 9구간은 웨이브 최소 시간 때문에 HP 비례 추정 오차가 특히 크다.',
 '프로필별 배율을 제시하는 것은 스펙업 때 자동으로 적을 강하게 만들라는 제안이 아니다. 무장비 실패/관문과 빌드 전환 의도를 지키며 콘텐츠별 기준 장비를 정해 후속 조정해야 한다. 이번 측정은 원본 밸런스를 변경하지 않았다.'
];
limitations.push('자동 전투는 준비된 궁극기를 정화·해체 우선 분기보다 먼저 사용한다. 따라서 궁극기가 가능한 프레임의 정화 우선은 보장되지 않는다(엔진 수정 없음).');
limitations.push('PURIFY=1이면 B+·C+는 수월의 자세·흘려베기·파갑참과 기존 첫 비중복 스킬을 장착한다. 기존 첫 스킬은 파갑참이므로 다음 발도를 보존한다. 궁극기·지속 스킬·장비는 동일하다.');
const report={title:'엔드게임 난이도 측정 0.148',command:`${process.env.CHAPTERS?'CHAPTERS='+process.env.CHAPTERS+' ':''}${process.env.PURIFY==='1'?'PURIFY=1 ':''}node tools/benchmark-endgame0148.mjs`,createdAt:new Date().toISOString(),engineVersion:version,node:process.version,elapsedSeconds:elapsed(),timeBudgetSeconds:540,plannedSeeds,usedSeeds,sampleReduced:reduced,battleCount:results.reduce((n,r)=>n+r.samples.length,0),dt,profiles:profiles.map(({profile,...d})=>({...d,stats:g.playerStats(profile),combatPower:g.combatPower(profile),training:profile.training,tree:profile.growthTree,treeSpent:g.treeSpent(profile.growthTree),treePointsTotal:g.treePointsTotal(profile),loadout:profile.skillBook.loadout,ranks:profile.skillBook.ranks,equipment:profile.inventory})),scenarios,sourceSha256:hashes,limitations,results};
let md=`# ${report.title}\n\n실행: \`${report.command}\` · 엔진 ${version} · Node ${process.version}\n\n실행 ${f(report.elapsedSeconds)}초, ${report.battleCount}전. 계획 시드 ${plannedSeeds.join(', ')} / 완결 시드 ${usedSeeds.join(', ')}. 표본 축소: ${reduced?'예':'아니오'}. 10분 제한을 위해 최대 3시드·${3*profiles.length*scenarios.length}전, 540초 중단 예산을 적용했다.\n\n## 프로필\n\n|프로필|장비|공격력|최대 HP|기본+스킬 DPS|트리 포인트|\n|---|---|---:|---:|---:|---:|\n`;
for(const p of report.profiles)md+=`|${p.id}|${p.name}|${f(p.stats.damage)}|${f(p.stats.maxHp)}|${f(p.combatPower.total)}|${p.treeSpent}/${p.treePointsTotal}|\n`;
md+='\n## 프로필 × 시나리오\n\n시간은 성공 평균. 손실/최저 HP는 모든 완료 표본 평균, 괄호는 시드 중 최악 최저 HP.\n\n|프로필|시나리오|클리어|초|누적 HP 손실|화상 손실|디버프 시간 비율|최저 HP (최악)|사망|쉬움|\n|---|---|---:|---:|---:|---:|---:|---:|---:|---|\n';
for(const r of results){const a=r.summary;md+=`|${r.profile}|${scenarios.find(s=>s.id===r.scenario).name}|${a.clears}/${a.n}|${f(a.clearSeconds)}|${pct(a.lossRatio)}|${pct(a.burnLossRatio)}|${pct(a.debuffRatio)}|${pct(a.lowestHpRatio)} (${pct(a.worstHpRatio)})|${a.deaths}|${r.easy?'예':'—'}|\n`;}
md+='\n## 핵심 요약\n\n|프로필|총 클리어|쉬운 시나리오|레이드 성공 평균 시간|정예·악몽 보스 성공 평균 시간|보스 누적 손실 평균|\n|---|---:|---:|---:|---:|---:|\n';
for(const p of profiles){const rows=results.filter(r=>r.profile===p.id),raids=rows.filter(r=>scenarios.find(s=>s.id===r.scenario).raid),bosses=rows.filter(r=>scenarios.find(s=>s.id===r.scenario).stage===10);md+=`|${p.id}|${rows.reduce((n,r)=>n+r.summary.clears,0)}/${rows.reduce((n,r)=>n+r.summary.n,0)}|${rows.filter(r=>r.easy).length}/${scenarios.length}|${f(mean(raids.flatMap(r=>r.samples.filter(x=>x.cleared).map(x=>x.clearSeconds))))}|${f(mean(bosses.flatMap(r=>r.samples.filter(x=>x.cleared).map(x=>x.clearSeconds))))}|${pct(mean(bosses.map(r=>r.summary.lossRatio)))}|\n`;}
md+='\n## 어디가 쉬운가\n\n';
for(const p of profiles){const rows=results.filter(r=>r.profile===p.id&&r.easy);md+=`- ${p.id}: ${rows.length}/${scenarios.length}곳. ${rows.length?rows.map(r=>scenarios.find(s=>s.id===r.scenario).name).join(', '):'10초·손실 20% 기준에 해당 없음'}.\n`;}
if(process.env.PURIFY==='1'){
 md+='\n## 정화 대응 비교\n\n동일 장비·시드의 기본 빌드 → 정화 빌드. 시간은 성공 표본 평균, 손실·노출은 실패를 포함한다.\n\n|프로필|시나리오|클리어 기본 → 정화|초 기본 → 정화|HP 손실 기본 → 정화|디버프 비율 기본 → 정화|\n|---|---|---|---:|---:|---:|\n';
 for(const id of ['B','C'])for(const scenario of scenarios){const a=results.find(r=>r.profile===id&&r.scenario===scenario.id).summary,b=results.find(r=>r.profile===id+'+'&&r.scenario===scenario.id).summary;
 md+=`|${id} → ${id}+|${scenario.name}|${a.clears}/${a.n} → ${b.clears}/${b.n}|${f(a.clearSeconds)} → ${f(b.clearSeconds)}|${pct(a.lossRatio)} → ${pct(b.lossRatio)}|${pct(a.debuffRatio)} → ${pct(b.debuffRatio)}|\n`;}
}
md+='\n## 목표 30~45초·손실 40~70%의 배율 추정\n\nHP 범위는 30~45초, 공격 범위는 HP를 37.5초 중심 배율로 늘린 뒤의 노출 시간 보정을 반영한다. ×1 미만은 낮추는 방향이며, 무조건 올려야 한다는 뜻이 아니다.\n\n|프로필|시나리오|적 HP ×범위 (중심)|적 공격 ×범위 (중심)|\n|---|---|---:|---:|\n';
for(const r of results){const e=r.estimate;md+=`|${r.profile}|${scenarios.find(s=>s.id===r.scenario).name}|${e?range(e.hpMultiplier)+' ('+f(e.hpMid)+')':'실패 포함·보류'}|${e?range(e.damageMultiplier)+' ('+f(e.damageMid)+')':'보류'}|\n`;}
md+='\n## 방법·한계\n\n'+limitations.map(x=>'- '+x).join('\n')+'\n';
const dir=path.join(root,'tools/reports');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,(CHAPTER_LIST?'endgame-chapters-0148.json':'endgame-difficulty-0148.json')),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(dir,(CHAPTER_LIST?'endgame-chapters-0148.md':'endgame-difficulty-0148.md')),md);
console.log(`완료: ${report.battleCount}전 / ${f(elapsed())}초 / 쉬움 ${results.filter(r=>r.easy).length}행`);
