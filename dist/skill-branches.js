// Alpha 0.126 스킬 갈래 → Alpha 0.142 단계 갈래 (사용자 요청 '분기를 3개로, 스킬 최대 15레벨에 5레벨마다 분기, 궁극기는 20레벨에 4번').
// Every skill (active, passive, ultimate) has branch TIERS: one per 5 skill levels (Lv.5·10·15, ultimates also Lv.20).
// Each tier offers three branches bought with 검술서; one branch per tier is in use and the picks of all tiers add up.
// Branches are plain modifiers that combat-skills.js reads:
//  active/ultimate: damage ×, cooldown ×, cost +, area × (radius/width and radial reach), hits + (more hits share the total),
//   element {bleed, chill, push, breach, shield} on every hit (shield once per cast), boss +% against bosses and elites,
//   execute +% against targets under 35% health, duration × and power + for the buff skills (수월의 자세, 혈월의 칼날,
//   월영군무), markHits for 월영 표식.
//  passive: value × (the passive's own number; for 적월의 결의, whose number is a wait time, it divides) and stat
//   {damagePct, hpPct, attackSpeed, speed, crit, reduction, regeneration} added to the hunter while the passive is equipped.
// The first tier keeps the two 0.126 branches as options 1 and 2, so old saves keep what they bought.
export const SKILL_BRANCH_TIER_LEVEL=5;
export const SKILL_BRANCH_COSTS=Object.freeze([{pages:6,gold:1500},{pages:12,gold:4000},{pages:20,gold:9000},{pages:30,gold:16000}].map(Object.freeze));
export const SKILL_BRANCH_COST=SKILL_BRANCH_COSTS[0];
export const EXECUTE_HEALTH=.35;
const b=(name,text,mods)=>Object.freeze({name,text,mods:Object.freeze({...mods,...(mods.element?{element:Object.freeze(mods.element)}:{}),...(mods.stat?{stat:Object.freeze(mods.stat)}:{})})});

// Tier 1 (Lv.5): the two 0.126 branches and a third one.
const FIRST={
 crescent:[b('만월 검기','검기 폭이 넓어져 무리를 쓸어낸다.',{area:1.6,damage:.85}),b('그믐 검기','좁고 날카로운 검기. 보스·정예에게 강하다.',{damage:1.35,boss:20,cost:4}),b('서리 검기','검기가 닿은 적을 얼린다.',{element:{chill:1.2}})],
 gale:[b('바람 가르기','짧은 간격으로 자주 돌진한다.',{cooldown:.6,damage:.85}),b('폭풍 돌진','경로의 적을 밀쳐내고 얼린다.',{damage:1.1,element:{push:80,chill:1}}),b('칼바람','돌진 경로에 출혈을 남긴다.',{element:{bleed:3}})],
 dance:[b('피의 윤무','베는 적마다 출혈을 남긴다.',{element:{bleed:3}}),b('수호 윤무','더 넓게 돌며 몸을 감싼다.',{area:1.15,element:{shield:.06}}),b('질풍 윤무','더 빠르게 다섯 번 벤다.',{hits:1,damage:1.05})],
 draw:[b('일격필살','더 무거운 일격. 빈사의 적을 끝낸다.',{damage:1.3,execute:50}),b('거합 연환','가볍게 자주 뽑는다.',{cooldown:.65,cost:-8}),b('부채꼴 발도','칼끝이 부채꼴로 넓게 퍼진다.',{area:1.3})],
 plunge:[b('운석 낙월','넓게 내려쳐 얼린다.',{area:1.3,element:{chill:1.5}}),b('추락 처형','보스·정예를 노려 내려친다.',{boss:35}),b('충격 낙월','내려친 자리의 적을 밀쳐낸다.',{damage:1.15,element:{push:70}})],
 parry:[b('반격의 칼날','반격이 훨씬 강하다.',{damage:1.5}),b('흐르는 물','자주 받아내고 보호막을 두른다.',{cooldown:.8,element:{shield:.1}}),b('되받아치기','반격이 적의 방어를 무너뜨린다.',{element:{breach:12}})],
 echo:[b('깊은 잔상','두 번의 베기가 모두 강해진다.',{damage:1.25}),b('그림자 걸음','자주 물러나며 적을 약화시킨다.',{cooldown:.7,element:{breach:8}}),b('넓은 잔상','잔상이 더 넓게 벤다.',{area:1.25})],
 triple:[b('삼단 출혈','세 번의 베기가 출혈을 남긴다.',{element:{bleed:4}}),b('연월 폭풍','넓고 가볍게 벤다.',{area:1.25,cost:-6}),b('무거운 삼연','세 번 모두 묵직하다.',{damage:1.25,cooldown:1.1})],
 seeking:[b('사냥 표적','보스·정예를 끝까지 쫓는다.',{boss:40}),b('쌍둥이 검기','검기 두 개를 연달아 보낸다.',{hits:1,damage:1.6}),b('빙결 검기','맞은 적을 얼린다.',{element:{chill:1.5},damage:1.1})],
 returning:[b('빙월','오가는 검기가 적을 얼린다.',{element:{chill:1.5}}),b('날선 귀환','느리지만 무겁게 돌아온다.',{damage:1.3,cooldown:1.15}),b('넓은 회귀','검기 폭이 넓어진다.',{area:1.3})],
 field:[b('넓은 진','진이 넓어진다.',{area:1.35,damage:.9}),b('약화의 진','진 안의 적이 피를 흘리고 약해진다.',{element:{breach:15,bleed:2}}),b('빠른 진','진을 자주 펼친다.',{cooldown:.75})],
 breach:[b('분쇄','강타가 더 무겁다.',{damage:1.4}),b('갑옷 사냥','장갑을 더 자주 벗긴다.',{cooldown:.7}),b('넓은 파갑','더 넓게 내려친다.',{area:1.3})],
 gather:[b('중력 월쇄','더 멀리서 끌어모은다.',{area:1.3}),b('쇄월 처형','모은 적을 깊게 벤다.',{damage:1.4,element:{bleed:2}}),b('얼음 사슬','모은 적을 얼린다.',{element:{chill:1.5}})],
 stance:[b('부동의 자세','받는 피해를 더 줄인다.',{power:15}),b('명경지수','자세가 오래가고 자주 쓸 수 있다.',{duration:1.6,cooldown:.8}),b('가벼운 자세','기력 없이 자세를 잡는다.',{cost:-20})],
 mark:[b('깊은 표식','표식 폭발이 강하다.',{damage:1.5}),b('연쇄 표식','타격 3회로 터지고 자주 새긴다.',{markHits:3,cooldown:.6}),b('사냥꾼의 표식','보스·정예에게 더 강하게 터진다.',{boss:40})],
 bloodblade:[b('피에 굶주린 칼날','연격 피해가 더 오른다.',{power:15}),b('긴 혈월','칼날이 오래 유지된다.',{duration:1.67}),b('빠른 혈월','칼날을 자주 세운다.',{cooldown:.75})],
 bloodmoon:[b('핏빛 폭풍','더 넓게 베고 출혈을 남긴다.',{area:1.25,element:{bleed:3}}),b('적월 처형','더 강하게 베고 빈사의 적을 끝낸다.',{damage:1.25,execute:40}),b('짧은 적월','재사용이 줄어든다.',{cooldown:.75})],
 eclipse:[b('개기 월식','더 강한 일격. 보스·정예에게 더 강하다.',{damage:1.3,boss:25}),b('짧은 월식','재사용이 크게 줄어든다.',{cooldown:.65}),b('넓은 월식','더 굵은 선으로 벤다.',{area:1.35})],
 phantoms:[b('잔상 군단','잔상이 오래 남아 더 많이 동행한다.',{duration:1.5}),b('날선 잔상','잔상 하나하나가 강하다.',{damage:1.4}),b('짧은 군무','재사용이 줄어든다.',{cooldown:.75})],
};
// Later tiers follow the skill's kind: area skills widen, single-target ones save 기력, buffs grow stronger or last longer.
const AREA=new Set(['crescent','gale','dance','draw','plunge','echo','triple','returning','field','breach','gather','bloodmoon','eclipse']);
const BUFF=new Set(['stance','bloodblade']);
const ELEMENT={crescent:['서리',{chill:1.5}],gale:['돌풍',{push:70}],dance:['핏빛',{bleed:3}],draw:['파쇄',{breach:12}],plunge:['빙하',{chill:1.5}],parry:['수호',{shield:.08}],echo:['약화',{breach:10}],triple:['핏빛',{bleed:4}],seeking:['출혈',{bleed:3}],returning:['서리',{chill:1.5}],field:['붕괴',{breach:12}],breach:['파쇄',{breach:15}],gather:['출혈',{bleed:3}],mark:['약화',{breach:12}],bloodmoon:['핏빛',{bleed:4}],eclipse:['파쇄',{breach:15}],phantoms:['출혈',{bleed:2}]};
function attackTiers(id,name){
 const [elementName,element]=ELEMENT[id];
 const second=[b('날 선 '+name,'피해가 커진다.',{damage:1.2}),b('빠른 '+name,'재사용이 짧아진다.',{cooldown:.82}),AREA.has(id)?b('넓은 '+name,'범위가 넓어진다.',{area:1.2}):b('가벼운 '+name,'기력을 덜 쓰고 조금 자주 쓴다.',{cost:-6,cooldown:.92})];
 const third=[b('사냥꾼의 '+name,'보스·정예에게 강하다.',{boss:25}),b('처형자의 '+name,'빈사의 적을 끝낸다.',{execute:40}),b(elementName+'의 '+name,'타격마다 속성을 남긴다.',{element})];
 return [second,third];
}
function buffTiers(name){
 return [[b('짙은 '+name,'효과가 커진다.',{power:8}),b('긴 '+name,'오래 유지된다.',{duration:1.3}),b('빠른 '+name,'재사용이 짧아진다.',{cooldown:.8})],
  [b('완성된 '+name,'효과가 크게 커진다.',{power:12}),b('끝없는 '+name,'훨씬 오래 유지된다.',{duration:1.5}),b('가벼운 '+name,'기력을 덜 쓰고 자주 쓴다.',{cost:-10,cooldown:.85})]];
}
// Ultimate tier 4 (Lv.20).
const ULT_LAST={
 bloodmoon:[b('극 · 적월','적월난무가 훨씬 강하다.',{damage:1.3}),b('극 · 쾌월','재사용이 크게 줄어든다.',{cooldown:.72}),b('극 · 만월','더 넓게 휘몰아친다.',{area:1.25,damage:1.1})],
 eclipse:[b('극 · 일섬','일섬이 훨씬 강하다.',{damage:1.3}),b('극 · 섬광','재사용이 크게 줄어든다.',{cooldown:.72}),b('극 · 천단','보스·정예를 베어 가른다.',{boss:40,damage:1.1})],
 phantoms:[b('극 · 군무','잔상이 훨씬 강하다.',{damage:1.3}),b('극 · 환영','재사용이 크게 줄어든다.',{cooldown:.72}),b('극 · 무한','잔상이 훨씬 오래 남는다.',{duration:1.5})],
};
// Passives: tier n offers a stronger number or one of two stats that suit the passive.
const PASSIVE_STATS={opening:['crit','attackSpeed'],flow:['attackSpeed','regeneration'],finisher:['damagePct','crit'],footwork:['speed','reduction'],pursuit:['damagePct','speed'],imbalance:['crit','damagePct'],breath:['regeneration','speed'],resolve:['hpPct','reduction'],lone:['damagePct','crit'],surrounded:['reduction','hpPct'],scar:['crit','damagePct'],recovery:['regeneration','hpPct'],steady:['damagePct','reduction'],resonance:['attackSpeed','crit'],momentum:['attackSpeed','speed'],reserve:['reduction','hpPct']};
const STAT_STEP={damagePct:[.03,.05,.08],hpPct:[.04,.06,.09],attackSpeed:[.03,.05,.08],speed:[.03,.05,.07],crit:[.02,.03,.05],reduction:[.02,.03,.04],regeneration:[1,2,3]};
// [tier names ×3, stat text]
const STAT_NAME={damagePct:[['맹공','격노','파괴'],'공격력'],hpPct:[['생명','활력','불멸'],'최대 체력'],attackSpeed:[['연격','쾌검','섬광'],'공격 속도'],speed:[['질주','질풍','신속'],'이동 속도'],crit:[['예리함','통찰','필살'],'치명타 확률'],reduction:[['견고함','철벽','불굴'],'받는 피해 감소'],regeneration:[['회복','재생','소생'],'체력 재생']};
const VALUE_STEP=[1.2,1.25,1.3],VALUE_NAME=['깊은','짙은','완성된'];
function passiveTiers(id,name){
 return [0,1,2].map(t=>[b(VALUE_NAME[t]+' '+name,id==='resolve'?'재발동 대기 시간이 짧아진다.':'효과 수치가 커진다.',{value:VALUE_STEP[t]}),
  ...PASSIVE_STATS[id].map(k=>b(STAT_NAME[k][0][t]+'의 '+name,'장착한 동안 '+STAT_NAME[k][1]+'이 오른다.',{stat:{[k]:STAT_STEP[k][t]}}))]);
}
const NAMES={crescent:'월아참',gale:'질풍참',dance:'윤무',draw:'발도',plunge:'낙월',parry:'흘려베기',echo:'잔영참',triple:'연월참',seeking:'추적 검기',returning:'회귀월',field:'잔월진',breach:'파갑참',gather:'월쇄',stance:'수월의 자세',mark:'월영 표식',bloodblade:'혈월의 칼날',bloodmoon:'적월난무',eclipse:'일섬·월식',phantoms:'월영군무',
 opening:'찰나의 틈',flow:'검무의 흐름',finisher:'마지막 검끝',footwork:'사냥꾼의 발걸음',pursuit:'잔상 추격',imbalance:'무너진 균형',breath:'절제된 호흡',resolve:'적월의 결의',lone:'고독한 사냥',surrounded:'포위 돌파',scar:'깊은 검흔',recovery:'회수의 궤적',steady:'흔들리지 않는 검',resonance:'월영 공명',momentum:'사냥의 여세',reserve:'남겨둔 여력'};
const tiers={};
for(const [id,first] of Object.entries(FIRST)){const rest=BUFF.has(id)?buffTiers(NAMES[id]):attackTiers(id,NAMES[id]);tiers[id]=[first,...rest,...(ULT_LAST[id]?[ULT_LAST[id]]:[])].map(t=>Object.freeze(t));}
for(const id of Object.keys(PASSIVE_STATS))tiers[id]=passiveTiers(id,NAMES[id]).map(t=>Object.freeze(t));
// SKILL_BRANCHES[id] = [tier][option]. Tier t opens at skill Lv.(t+1)×5.
export const SKILL_BRANCHES=Object.freeze(Object.fromEntries(Object.entries(tiers).map(([k,v])=>[k,Object.freeze(v)])));
const pct=v=>Math.round(v*100);
const STAT_TEXT=k=>STAT_NAME[k][1];
// Short Korean summary of a branch's numbers for buttons and tests.
export function branchSummary(mods){
 const e=mods.element??{},out=[];
 if(mods.damage)out.push('피해 '+(mods.damage>1?'+':'')+(pct(mods.damage)-100)+'%');
 if(mods.area)out.push('범위 +'+(pct(mods.area)-100)+'%');
 if(mods.cooldown)out.push('재사용 '+(mods.cooldown<1?'':'+')+(pct(mods.cooldown)-100)+'%');
 if(mods.cost)out.push('기력 '+(mods.cost>0?'+':'')+mods.cost);
 if(mods.hits)out.push('타격 +'+mods.hits);
 if(mods.boss)out.push('보스·정예 +'+mods.boss+'%');
 if(mods.execute)out.push('빈사 +'+mods.execute+'%');
 if(mods.duration)out.push('지속 +'+(pct(mods.duration)-100)+'%');
 if(mods.power)out.push('효과 +'+mods.power+'%p');
 if(mods.markHits)out.push('표식 '+mods.markHits+'타');
 if(mods.value)out.push('수치 +'+(pct(mods.value)-100)+'%');
 for(const [k,v] of Object.entries(mods.stat??{}))out.push(STAT_TEXT(k)+' +'+(k==='regeneration'?v+'/초':Math.round(v*100)+'%'));
 if(e.bleed)out.push('출혈 '+e.bleed+'회');
 if(e.chill)out.push(e.chill+'초 빙결');
 if(e.push)out.push('밀쳐내기 '+e.push);
 if(e.breach)out.push('받는 피해 +'+e.breach+'%');
 if(e.shield)out.push('보호막 '+pct(e.shield)+'%');
 return out.join(' · ');
}
