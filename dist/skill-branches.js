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
// Alpha 0.146.0 (사용자 요청 '갈래가 너무 단순하고 스킬끼리 비슷하다, 빌드가 단순하다'): tiers 2 and 3 no longer add plain
// numbers. Each skill gets its own rule changes (combat-skills.js applies them):
//  fan n            extra copies of the skill turned ±22° (half damage each)        repeat {delay,scale}  the skill strikes again
//  zone {seconds,scale}  leaves a cutting zone that ticks every .5s              pull f       drags common monsters toward the hit
//  detonate f       hitting a bleeding enemy bursts the bleed: attack×f per tick left   shatter %   bonus against a frozen enemy (thaws it)
//  chain {n,range,scale} the first target's hit jumps to n more enemies            refundKill s  a kill by this skill takes s off its cooldown
//  stack {per,max}  every recast within 8s adds per% (up to max)                    prime {tag,pct}  the next skill of that tag within 4s +pct%
//  primed %         +% when another skill was cast within the last 3s
//  keepBlade         casting this skill does not end 혈월의 칼날 (0.147.8, 잔상 태그 3개)               hpCost f    also costs f of max health (never below 1)
//  drainHit %       heals % of the damage it deals (≤6% max health per cast)        expose s    hit enemies are exposed (staggered) for s
//  after {kind,value,seconds}  after the cast: fury (basic attack +%), haste (move +%), guard (damage taken −%)
//  skill-only: stanceCounter %, stanceShield f, bladeWave %, bladeDrain f, bladeBleed n, markSpread n, markBlast radius,
//   markRefund s, parryReset s, parryRadius ×, parryGuard %, phantomBleed n, phantomChain %, phantomBurst %, phantomDrain f.
// Passive tiers 2·3 are build rules (see PASSIVE_RULES below).
const A=(name,text,mods)=>b(name,text,mods);
const RULES={
 crescent:[[A('삼일월','검기가 양옆으로 하나씩 더 갈라진다(각 50%).',{fan:2}),A('잔향 월아','0.5초 뒤 같은 검기가 한 번 더 지나간다(60%). 재사용 +15%.',{repeat:{delay:.5,scale:.6},cooldown:1.15}),A('흡월','검기가 준 피해의 4%만큼 체력을 회복한다.',{drainHit:4})],
  [A('혈흔 폭발','출혈 중인 적을 베면 남은 출혈을 한꺼번에 터뜨린다.',{detonate:.35}),A('빙월 파쇄','빙결된 적에게 +45% 피해를 주고 녹인다. 맞은 적을 얼린다.',{shatter:45,element:{chill:.8}}),A('사냥 검풍','이 검기로 적을 처치하면 재사용 1.5초 감소.',{refundKill:1.5})]],
 gale:[[A('왕복 질풍','돌진이 지나간 길을 0.45초 뒤 다시 벤다(70%).',{repeat:{delay:.45,scale:.7}}),A('돌개바람','돌진 경로 주변의 일반 괴수를 끌어당긴다.',{pull:.45}),A('질풍 가속','돌진 뒤 2초 동안 이동 속도 +25%. 기력 −5.',{after:{kind:'haste',value:25,seconds:2},cost:-5})],
  [A('바람 사냥','이 돌진으로 처치하면 재사용 2초 감소.',{refundKill:2}),A('질풍 연계','돌진 뒤 4초 안의 일격 스킬 피해 +30%.',{prime:{tag:'precision',pct:30}}),A('피의 질주','출혈 중인 적을 지나가며 출혈을 터뜨린다.',{detonate:.3})]],
 dance:[[A('회오리 윤무','벨 때마다 주변 괴수를 안쪽으로 끌어당긴다.',{pull:.25}),A('칼바람 잔류','윤무가 끝난 자리에 2초간 칼바람이 남는다.',{zone:{seconds:2,scale:.12}}),A('방패 윤무','윤무 뒤 2초 동안 받는 피해 −20%.',{after:{kind:'guard',value:20,seconds:2}})],
  [A('고조되는 윤무','8초 안에 다시 쓸 때마다 피해 +12% (최대 +36%).',{stack:{per:12,max:36}}),A('혈풍','출혈 중인 적을 베면 출혈을 터뜨린다.',{detonate:.25}),A('흡혈 윤무','준 피해의 3%만큼 체력을 회복한다.',{drainHit:3})]],
 draw:[[A('이단 발도','0.35초 뒤 칼을 한 번 더 뽑는다(50%).',{repeat:{delay:.35,scale:.5}}),A('섬광 발도','맞은 적을 2초 동안 무너뜨린다(노출).',{expose:2}),A('쾌도','다른 스킬 직후 3초 안에 뽑으면 피해 +30%.',{primed:30})],
  [A('참철','빙결된 적에게 +60% 피해를 주고 녹인다.',{shatter:60}),A('결단','발도로 처치하면 재사용 3초 감소.',{refundKill:3}),A('혈도','최대 체력 5%를 바쳐 피해 +35%.',{hpCost:.05,damage:1.35})]],
 plunge:[[A('여진','내려친 자리에 2.5초간 여진이 남는다.',{zone:{seconds:2.5,scale:.15}}),A('중력 낙월','내려치며 주변 괴수를 중심으로 끌어당긴다.',{pull:.5}),A('연속 낙하','0.6초 뒤 같은 자리를 한 번 더 내려친다(50%).',{repeat:{delay:.6,scale:.5}})],
  [A('얼음 운석','맞은 적을 얼리고, 빙결된 적에게 +50% 피해.',{shatter:50,element:{chill:1}}),A('낙월 연계','착지 뒤 4초 안의 영역 스킬 피해 +30%.',{prime:{tag:'area',pct:30}}),A('처형 낙하','낙월로 처치하면 재사용 2초 감소.',{refundKill:2})]],
 parry:[[A('되감기','받아내면 모든 일반 스킬 재사용 2초 감소.',{parryReset:2}),A('반격 파동','반격이 주변 전체로 퍼진다.',{parryRadius:1.8}),A('철벽 흘리기','받아내면 2초 동안 받는 피해 −30%.',{parryGuard:30})],
  [A('역습','흘려베기 뒤 4초 안의 일격 스킬 피해 +40%.',{prime:{tag:'precision',pct:40}}),A('흘림 흡수','반격 피해의 8%만큼 체력을 회복한다.',{drainHit:8}),A('노출 반격','반격에 맞은 적을 3초 동안 무너뜨린다.',{expose:3})]],
 echo:[[A('삼중 잔상','0.4초 뒤 잔상이 한 번 더 벤다(60%).',{repeat:{delay:.4,scale:.6}}),A('잔상 지대','벤 자리에 2초간 잔상이 남아 벤다.',{zone:{seconds:2,scale:.12}}),A('그림자 연계','잔영참 뒤 4초 안의 잔상 스킬 피해 +30%.',{prime:{tag:'spirit',pct:30}})],
  [A('그림자 출혈','출혈 중인 적을 베면 출혈을 터뜨린다.',{detonate:.3}),A('잔상 회수','잔영참으로 처치하면 재사용 2초 감소.',{refundKill:2}),A('어둠 걸음','잔영참 뒤 2초 동안 이동 속도 +30%.',{after:{kind:'haste',value:30,seconds:2}})]],
 triple:[[A('부채 연월','세 번의 베기가 양옆으로도 퍼진다(각 50%).',{fan:2}),A('누적 연월','8초 안에 다시 쓸 때마다 피해 +10% (최대 +40%).',{stack:{per:10,max:40}}),A('연계 연월','다른 스킬 직후 3초 안에 쓰면 피해 +25%.',{primed:25})],
  [A('출혈 마무리','출혈 중인 적을 베면 출혈을 터뜨린다.',{detonate:.3}),A('빙결 마무리','빙결된 적에게 +50% 피해를 주고 녹인다.',{shatter:50}),A('연격 고조','연월참 뒤 3초 동안 기본 공격 피해 +20%.',{after:{kind:'fury',value:20,seconds:3}})]],
 seeking:[[A('연쇄 검기','맞은 적에게서 가까운 적 3명에게 튄다(각 50%).',{chain:{n:3,range:220,scale:.5}}),A('사냥 검기','맞은 적을 2초 동안 무너뜨린다.',{expose:2}),A('잔향 추적','0.5초 뒤 검기가 한 번 더 쫓아간다(60%).',{repeat:{delay:.5,scale:.6}})],
  [A('표적 처형','추적 검기로 처치하면 재사용 3초 감소.',{refundKill:3}),A('혈침','출혈 중인 적에게 꽂혀 출혈을 터뜨린다.',{detonate:.4}),A('빙침','빙결된 적에게 +60% 피해를 주고 녹인다.',{shatter:60})]],
 returning:[[A('삼방 회귀','검기가 세 갈래로 나갔다 돌아온다(곁가지 각 50%).',{fan:2}),A('휘감는 귀환','돌아오는 검기가 괴수를 끌고 온다.',{pull:.25}),A('검기 잔류','검기가 지난 자리에 2초간 검기가 남는다.',{zone:{seconds:2,scale:.12}})],
  [A('회수 가속','회귀월로 처치하면 재사용 1초 감소.',{refundKill:1}),A('혈월 귀환','출혈 중인 적을 베면 출혈을 터뜨린다.',{detonate:.3}),A('회귀 연계','회귀월 뒤 4초 안의 검기 스킬 피해 +30%.',{prime:{tag:'wave',pct:30}})]],
 field:[[A('중력진','진 안의 일반 괴수가 중심으로 끌려간다.',{pull:.2}),A('겹진','1.5초 뒤 같은 자리에 진이 한 번 더 펼쳐진다(50%).',{repeat:{delay:1.5,scale:.5}}),A('흡혈진','진이 준 피해의 2%만큼 체력을 회복한다.',{drainHit:2})],
  [A('빙결진','진 안의 적을 얼리고, 빙결된 적에게 +30% 피해.',{shatter:30,element:{chill:.6}}),A('혈진','출혈 중인 적의 출혈을 터뜨린다.',{detonate:.2}),A('누적진','8초 안에 다시 펼칠 때마다 피해 +15% (최대 +45%).',{stack:{per:15,max:45}})]],
 breach:[[A('균열 확산','강타가 주변 적 4명에게 균열로 번진다(각 40%).',{chain:{n:4,range:200,scale:.4}}),A('연속 파갑','0.5초 뒤 한 번 더 내려친다(50%).',{repeat:{delay:.5,scale:.5}}),A('노출 강타','맞은 적을 3초 동안 무너뜨린다.',{expose:3})],
  [A('파갑 연계','파갑참 뒤 4초 안의 일격 스킬 피해 +35%.',{prime:{tag:'precision',pct:35}}),A('갑옷 파쇄','빙결된 적에게 +50% 피해를 주고 녹인다.',{shatter:50}),A('분쇄 흡수','준 피해의 5%만큼 체력을 회복한다.',{drainHit:5})]],
 gather:[[A('월쇄 폭발','모은 자리에 1.5초간 사슬 폭풍이 남는다.',{zone:{seconds:1.5,scale:.2}}),A('이중 월쇄','0.6초 뒤 한 번 더 끌어모아 벤다(50%).',{repeat:{delay:.6,scale:.5}}),A('사슬 노출','모은 적을 2초 동안 무너뜨린다.',{expose:2})],
  [A('사슬 연계','월쇄 뒤 4초 안의 영역 스킬 피해 +30%.',{prime:{tag:'area',pct:30}}),A('혈사슬','출혈 중인 적의 출혈을 터뜨린다.',{detonate:.3}),A('처형 사슬','월쇄로 처치하면 재사용 1.5초 감소.',{refundKill:1.5})]],
 stance:[[A('반격의 자세','자세 중 맞으면 주변 180에 공격력 60% 반격.',{stanceCounter:60}),A('물의 장막','자세를 잡으며 최대 체력 8% 보호막.',{stanceShield:.08}),A('물살 걸음','자세를 잡은 뒤 3초 동안 이동 속도 +20%, 재사용 −15%.',{after:{kind:'haste',value:20,seconds:3},cooldown:.85})],
  [A('수월 연계','자세 뒤 4초 안의 다음 스킬 피해 +50%.',{prime:{tag:'any',pct:50}}),A('수월 반사','반격이 공격력 140%로 커진다.',{stanceCounter:140}),A('부동명왕','자세의 피해 감소 +20%p.',{power:20})]],
 bloodblade:[[A('혈월 검풍','칼날 중 3연격 마무리마다 전방 260에 검기(공격력 35%).',{bladeWave:35}),A('피의 대가','최대 체력 6%를 바쳐 연격 피해 +20%p.',{hpCost:.06,power:20}),A('질주하는 혈월','칼날을 세운 뒤 6초 동안 이동 속도 +20%.',{after:{kind:'haste',value:20,seconds:6}})],
  [A('흡혈 칼날','칼날 중 기본 공격 적중마다 최대 체력 0.3% 회복.',{bladeDrain:.003}),A('혈월 출혈','칼날 중 기본 공격이 출혈을 남긴다.',{bladeBleed:3}),A('혈월 연계','칼날을 세운 뒤 4초 안의 다음 스킬 피해 +30%.',{prime:{tag:'any',pct:30}})]],
 mark:[[A('전염 표식','표식이 터지면 주변 적 2명에게 새 표식이 옮는다.',{markSpread:2}),A('폭쇄 표식','표식 폭발이 주변 160에도 60% 피해.',{markBlast:160}),A('노출 표식','표식을 새길 때 3초 동안 무너뜨린다.',{expose:3})],
  [A('표식 회수','표식 폭발로 처치하면 재사용 4초 감소.',{markRefund:4}),A('피의 표식','표식 대상의 출혈을 폭발 때 터뜨린다.',{detonate:.4}),A('표식 연계','표식을 새긴 뒤 4초 안의 일격 스킬 피해 +35%.',{prime:{tag:'precision',pct:35}})]],
 bloodmoon:[[A('적월 소용돌이','벨 때마다 주변 괴수를 끌어당긴다.',{pull:.3}),A('핏빛 영역','끝난 자리에 3초간 핏빛 영역이 남는다.',{zone:{seconds:3,scale:.15}}),A('적월 흡혈','준 피해의 3%만큼 체력을 회복한다.',{drainHit:3})],
  [A('혈폭','출혈 중인 적의 출혈을 크게 터뜨린다.',{detonate:.5}),A('적월 연계','적월난무 뒤 4초 안의 다음 스킬 피해 +40%.',{prime:{tag:'any',pct:40}}),A('처형의 달','적월난무로 처치하면 재사용 4초 감소.',{refundKill:4})]],
 eclipse:[[A('삼일 월식','일섬이 양옆으로 갈라진다(각 50%).',{fan:2}),A('잔광','0.6초 뒤 같은 선을 한 번 더 벤다(50%).',{repeat:{delay:.6,scale:.5}}),A('월식 노출','맞은 적을 4초 동안 무너뜨린다.',{expose:4})],
  [A('빙월식','빙결된 적에게 +80% 피해를 주고 녹인다.',{shatter:80}),A('월식 처형','일섬으로 처치하면 재사용 8초 감소.',{refundKill:8}),A('혈식','최대 체력 8%를 바쳐 피해 +45%.',{hpCost:.08,damage:1.45})]],
 phantoms:[[A('피의 군무','잔상 타격이 출혈을 남긴다.',{phantomBleed:3}),A('연쇄 잔상','잔상 타격이 가까운 적 하나에 더 튄다(60%).',{phantomChain:60}),A('군무 가속','군무 중 이동 속도 +25%.',{after:{kind:'haste',value:25,seconds:8}})],
  [A('잔상 폭발','군무가 끝날 때 주변 260에 공격력 150% 폭발.',{phantomBurst:150}),A('군무 연계','군무 뒤 4초 안의 다음 스킬 피해 +40%.',{prime:{tag:'any',pct:40}}),A('흡혈 잔상','잔상 타격마다 최대 체력 0.4% 회복.',{phantomDrain:.004})]],
};
// Passives: tier 1 keeps the number/stat choice; tiers 2·3 are build rules while the passive is equipped:
//  tagBonus {tag:%} skills of that tag deal more · costCut n · cooldownCut f · elementAll {bleed|chill} on every skill hit
//  bleedBonus/chillBonus/bossDamage/crowdDamage(3+ near)/lowHpDamage(<50%)/highStaminaDamage(≥70)/primedAll % (skill damage when …)
//  killStamina n · killHeal f · killFury % (3s) · perfectReset s · perfectFury % (3s) · perfectStamina n · perfectShield f
//  exposeAll s (skill hits expose) · drainAll % (skill damage heals) · finisherBleed n · finisherExpose s (3연격 마무리)
//  0.149.6 (상태 효과 설계 3단계): autoCleanse s (그 간격마다 디버프 1종 정화, 절제된 호흡 '사냥의 숨' 자리) ·
//  debuffDamage % (디버프가 걸려 있는 동안 스킬 피해, 적월의 결의 '포위 결의' 자리) — 같은 효과가 다른 패시브에 이미 있던 칸을 바꿨다.
const P=(name,text,mods)=>b(name,text,mods);
const PASSIVE_RULES={
 opening:[[P('찰나 재정비','완벽 회피 시 모든 일반 스킬 재사용 2초 감소.',{perfectReset:2}),P('틈새 일격','완벽 회피 뒤 3초 동안 스킬 피해 +30%.',{perfectFury:30}),P('찰나 호흡','완벽 회피 시 기력 +20.',{perfectStamina:20})],
  [P('반격 본능','일격 스킬 피해 +15%.',{tagBonus:{precision:15}}),P('잔상 회피','완벽 회피 시 최대 체력 6% 보호막.',{perfectShield:.06}),P('가벼운 칼끝','모든 일반 스킬 기력 −4.',{costCut:4})]],
 flow:[[P('흐름 고조','다른 스킬 직후 3초 안에 쓰는 스킬 피해 +15%.',{primedAll:15}),P('끊김 없는 검무','일반 스킬 재사용 −6%.',{cooldownCut:.06}),P('흐름의 숨','처치 시 기력 +4.',{killStamina:4})],
  [P('잔상의 흐름','잔상 스킬 피해 +15%.',{tagBonus:{spirit:15}}),P('가벼운 검무','모든 일반 스킬 기력 −5.',{costCut:5}),P('검무 폭주','처치 뒤 3초 동안 스킬 피해 +15%.',{killFury:15})]],
 finisher:[[P('검끝 출혈','3연격 마무리가 출혈을 남긴다.',{finisherBleed:3}),P('검끝 노출','3연격 마무리가 적을 1.5초 무너뜨린다.',{finisherExpose:1.5}),P('검끝 일격','일격 스킬 피해 +12%.',{tagBonus:{precision:12}})],
  [P('상처 벌리기','출혈 중인 적에게 스킬 피해 +20%.',{bleedBonus:20}),P('거인 사냥','보스·정예에게 스킬 피해 +15%.',{bossDamage:15}),P('검끝 연타','처치 뒤 3초 동안 스킬 피해 +15%.',{killFury:15})]],
 footwork:[[P('돌진 숙련','돌진 스킬 피해 +15%.',{tagBonus:{dash:15}}),P('발걸음 재정비','완벽 회피 시 모든 일반 스킬 재사용 1.5초 감소.',{perfectReset:1.5}),P('가벼운 발','모든 일반 스킬 기력 −3.',{costCut:3})],
  [P('질주 일격','완벽 회피 뒤 3초 동안 스킬 피해 +25%.',{perfectFury:25}),P('바람 걸음','돌진 스킬 피해 +12% · 일반 스킬 재사용 −5%.',{tagBonus:{dash:12},cooldownCut:.05}),P('사냥꾼의 숨','처치 시 최대 체력 1% 회복.',{killHeal:.01})]],
 pursuit:[[P('추격 숙련','돌진 스킬 피해 +15%.',{tagBonus:{dash:15}}),P('추격의 숨','처치 시 기력 +5.',{killStamina:5}),P('피 냄새','출혈 중인 적에게 스킬 피해 +15%.',{bleedBonus:15})],
  [P('피의 추격','모든 스킬 타격이 출혈 2회를 남긴다.',{elementAll:{bleed:2}}),P('잔상 추격술','잔상 스킬 피해 +12%.',{tagBonus:{spirit:12}}),P('추격 폭주','처치 뒤 3초 동안 스킬 피해 +15%.',{killFury:15})]],
 imbalance:[[P('거인 무너뜨리기','보스·정예에게 스킬 피해 +12%.',{bossDamage:12}),P('얼어붙은 틈','빙결된 적에게 스킬 피해 +20%.',{chillBonus:20}),P('벌어진 상처','출혈 중인 적에게 스킬 피해 +15%.',{bleedBonus:15})],
  [P('붕괴','모든 스킬 타격이 적을 0.8초 무너뜨린다.',{exposeAll:.8}),P('일격 붕괴','일격 스킬 피해 +15%.',{tagBonus:{precision:15}}),P('영역 붕괴','영역 스킬 피해 +15%.',{tagBonus:{area:15}})]],
 breath:[[P('충만한 기','기력 70 이상일 때 스킬 피해 +15%.',{highStaminaDamage:15}),P('가벼운 호흡','모든 일반 스킬 기력 −4.',{costCut:4}),P('면역의 호흡','5초마다 걸려 있는 디버프 1종을 정화한다.',{autoCleanse:5})],
  [P('명상','잔상 스킬 피해 +15%.',{tagBonus:{spirit:15}}),P('고요한 칼','일반 스킬 재사용 −6%.',{cooldownCut:.06}),P('벼랑 끝 호흡','체력 50% 미만일 때 스킬 피해 +20%.',{lowHpDamage:20})]],
 resolve:[[P('결사','체력 50% 미만일 때 스킬 피해 +20%.',{lowHpDamage:20}),P('피의 결의','처치 시 최대 체력 1.5% 회복.',{killHeal:.015}),P('거인 앞의 결의','보스·정예에게 스킬 피해 +10%.',{bossDamage:10})],
  [P('최후의 일격','체력 50% 미만일 때 스킬 피해 +35%.',{lowHpDamage:35}),P('흡혈 결의','스킬 피해의 1.5%만큼 체력을 회복한다.',{drainAll:1.5}),P('역류','디버프가 걸려 있는 동안 스킬 피해 +20%.',{debuffDamage:20})]],
 lone:[[P('일대일','보스·정예에게 스킬 피해 +15%.',{bossDamage:15}),P('고독한 일격','일격 스킬 피해 +12%.',{tagBonus:{precision:12}}),P('고독한 숨','처치 시 기력 +5.',{killStamina:5})],
  [P('보스 사냥꾼','보스·정예에게 스킬 피해 +25%.',{bossDamage:25}),P('얼음 사냥','빙결된 적에게 스킬 피해 +25%.',{chillBonus:25}),P('표적 붕괴','모든 스킬 타격이 적을 0.6초 무너뜨린다.',{exposeAll:.6})]],
 surrounded:[[P('난전','주변 240에 적이 3명 이상이면 스킬 피해 +15%.',{crowdDamage:15}),P('영역 숙련','영역 스킬 피해 +12%.',{tagBonus:{area:12}}),P('난전의 숨','처치 시 기력 +4.',{killStamina:4})],
  [P('포위 섬멸','주변에 적이 3명 이상이면 스킬 피해 +25%.',{crowdDamage:25}),P('얼음 포위','모든 스킬 타격이 0.6초 빙결을 남긴다.',{elementAll:{chill:.6}}),P('난전 회복','처치 시 최대 체력 1% 회복.',{killHeal:.01})]],
 scar:[[P('검흔 출혈','3연격 마무리가 출혈을 남긴다.',{finisherBleed:3}),P('깊은 상처','출혈 중인 적에게 스킬 피해 +20%.',{bleedBonus:20}),P('검흔 일격','일격 스킬 피해 +10%.',{tagBonus:{precision:10}})],
  [P('피의 검흔','모든 스킬 타격이 출혈 2회를 남긴다.',{elementAll:{bleed:2}}),P('찢어진 상처','출혈 중인 적에게 스킬 피해 +30%.',{bleedBonus:30}),P('검흔 사냥','처치 시 기력 +5.',{killStamina:5})]],
 recovery:[[P('검기 숙련','검기 스킬 피해 +15%.',{tagBonus:{wave:15}}),P('가벼운 회수','모든 일반 스킬 기력 −4.',{costCut:4}),P('회수의 숨','처치 시 기력 +4.',{killStamina:4})],
  [P('검기 극의','검기 스킬 피해 +20%.',{tagBonus:{wave:20}}),P('순환','일반 스킬 재사용 −6%.',{cooldownCut:.06}),P('서리 궤적','빙결된 적에게 스킬 피해 +20%.',{chillBonus:20})]],
 steady:[[P('거목','보스·정예에게 스킬 피해 +12%.',{bossDamage:12}),P('정심','일격 스킬 피해 +15%.',{tagBonus:{precision:15}}),P('흔들림 없는 기','기력 70 이상일 때 스킬 피해 +12%.',{highStaminaDamage:12})],
  [P('부동의 일격','기력 70 이상일 때 스킬 피해 +20%.',{highStaminaDamage:20}),P('빙벽 가르기','빙결된 적에게 스킬 피해 +25%.',{chillBonus:25}),P('산을 베다','보스·정예에게 스킬 피해 +20%.',{bossDamage:20})]],
 resonance:[[P('공명 숙련','잔상 스킬 피해 +15%.',{tagBonus:{spirit:15}}),P('그림자 돌진','돌진 스킬 피해 +12%.',{tagBonus:{dash:12}}),P('공명의 숨','처치 시 기력 +4.',{killStamina:4})],
  [P('완전 공명','잔상 스킬 피해 +22%.',{tagBonus:{spirit:22}}),P('공명 연쇄','다른 스킬 직후 3초 안에 쓰는 스킬 피해 +15%.',{primedAll:15}),P('공명 붕괴','모든 스킬 타격이 적을 0.6초 무너뜨린다.',{exposeAll:.6})]],
 momentum:[[P('여세의 숨','처치 시 기력 +5.',{killStamina:5}),P('여세 회복','처치 시 최대 체력 1% 회복.',{killHeal:.01}),P('난전 여세','주변에 적이 3명 이상이면 스킬 피해 +12%.',{crowdDamage:12})],
  [P('폭주','처치 뒤 3초 동안 스킬 피해 +20%.',{killFury:20}),P('끝없는 사냥','일반 스킬 재사용 −6%.',{cooldownCut:.06}),P('사냥 본능','영역 스킬 피해 +12%.',{tagBonus:{area:12}})]],
 reserve:[[P('여유','기력 70 이상일 때 스킬 피해 +15%.',{highStaminaDamage:15}),P('절약','모든 일반 스킬 기력 −3.',{costCut:3}),P('배수진','체력 50% 미만일 때 스킬 피해 +15%.',{lowHpDamage:15})],
  [P('넘치는 여력','기력 70 이상일 때 스킬 피해 +25%.',{highStaminaDamage:25}),P('비축','스킬 피해의 1%만큼 체력을 회복한다.',{drainAll:1}),P('여력의 회복','처치 시 최대 체력 1.2% 회복.',{killHeal:.012})]],
};
// Build tags (0.146.0): equipped active and ultimate skills of one tag add up (2·3·4 skills). The bonuses apply to the skills of
// that tag as extra branch mods (TAG_SYNERGY[tag][n] for n = 2,3,4 equipped), so they reuse the same rules.
export const SKILL_TAGS=Object.freeze({crescent:['wave'],seeking:['wave'],returning:['wave'],eclipse:['wave','precision'],gale:['dash'],echo:['dash','spirit'],plunge:['dash','area'],
 dance:['area'],field:['area'],gather:['area'],bloodmoon:['area'],draw:['precision'],breach:['precision','purify'],triple:['precision'],parry:['precision','purify'],mark:['precision','spirit'],stance:['spirit','purify'],bloodblade:['spirit'],phantoms:['spirit']});
export const TAG_NAMES=Object.freeze({wave:'검기',dash:'돌진',area:'영역',precision:'일격',spirit:'잔상',purify:'정화'});
export const TAG_SYNERGY=Object.freeze({
 wave:[[2,{damage:1.08},'피해 +8%'],[3,{area:1.15},'범위 +15%'],[4,{refundKill:.5,damage:1.08},'처치 시 재사용 0.5초 감소 · 피해 +8%']],
 // 0.147.7: 돌진 스킬은 3개(질풍참·잔영참·낙월)라 4개 보너스가 닿지 않았다 → 재사용 −15%를 3개 보너스에 합침.
 dash:[[2,{damage:1.08},'피해 +8%'],[3,{after:{kind:'guard',value:15,seconds:1.5},cooldown:.85},'사용 뒤 1.5초 받는 피해 −15% · 재사용 −15%']],
 // 0.147.7: 잔류 영역 10% → 6%, 경직 없음(측정 tools/reports/branches-benchmark-0146: 보스 DPS +62%의 대부분이 잔류 영역의 경직 누적이었다).
 area:[[2,{damage:1.08},'피해 +8%'],[3,{pull:.15},'괴수를 끌어당김'],[4,{zone:{seconds:1.5,scale:.06}},'끝난 자리에 1.5초 잔류 영역']],
 precision:[[2,{boss:10},'보스·정예 +10%'],[3,{execute:20},'빈사 적 +20%'],[4,{expose:1.5,damage:1.1},'적중 시 1.5초 노출 · 피해 +10%']],
 // 0.147.8: 잔상 스킬(잔영참·표식·자세·군무)을 쓰면 같은 태그의 혈월의 칼날이 끊겨 태그를 켜는 편이 손해였다(−2.3%) → 3개에 keepBlade.
 // 0.149 정화 태그(수월의 자세·흘려베기·파갑참): 효과는 status-effects.js가 장착 수로 직접 읽는다(PURIFY_RESIST·PURIFY_HEAL).
 purify:[[2,{},'디버프 시간 −30%'],[3,{},'정화 시 체력 4% 회복']],
 spirit:[[2,{damage:1.05,duration:1.15},'피해 +5% · 지속 +15%'],[3,{keepBlade:1,primed:15},'칼날 유지·연계 +15%'],[4,{cooldown:.9,duration:1.2},'재사용 −10%·지속 +20%']],
});
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
// Tier 1: a stronger number or one of two stats that suit the passive (0.142, kept so bought branches stay).
function passiveFirst(id,name){
 return [b('깊은 '+name,id==='resolve'?'재발동 대기 시간이 짧아진다.':'효과 수치가 커진다.',{value:1.2}),
  ...PASSIVE_STATS[id].map(k=>b(STAT_NAME[k][0][0]+'의 '+name,'장착한 동안 '+STAT_NAME[k][1]+'이 오른다.',{stat:{[k]:STAT_STEP[k][0]}}))];
}
const NAMES={crescent:'월아참',gale:'질풍참',dance:'윤무',draw:'발도',plunge:'낙월',parry:'흘려베기',echo:'잔영참',triple:'연월참',seeking:'추적 검기',returning:'회귀월',field:'잔월진',breach:'파갑참',gather:'월쇄',stance:'수월의 자세',mark:'월영 표식',bloodblade:'혈월의 칼날',bloodmoon:'적월난무',eclipse:'일섬·월식',phantoms:'월영군무',
 opening:'찰나의 틈',flow:'검무의 흐름',finisher:'마지막 검끝',footwork:'사냥꾼의 발걸음',pursuit:'잔상 추격',imbalance:'무너진 균형',breath:'절제된 호흡',resolve:'적월의 결의',lone:'고독한 사냥',surrounded:'포위 돌파',scar:'깊은 검흔',recovery:'회수의 궤적',steady:'흔들리지 않는 검',resonance:'월영 공명',momentum:'사냥의 여세',reserve:'남겨둔 여력'};
const tiers={};
for(const [id,first] of Object.entries(FIRST))tiers[id]=[first,...RULES[id],...(ULT_LAST[id]?[ULT_LAST[id]]:[])].map(t=>Object.freeze(t));
for(const id of Object.keys(PASSIVE_STATS))tiers[id]=[passiveFirst(id,NAMES[id]),...PASSIVE_RULES[id]].map(t=>Object.freeze(t));
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
 // 0.146.0 rule branches
 const AFTER={fury:'기본 공격',haste:'이동 속도',guard:'받는 피해'};
 if(mods.fan)out.push('분열 +'+mods.fan);
 if(mods.repeat)out.push(mods.repeat.delay+'초 뒤 재타격 '+pct(mods.repeat.scale)+'%');
 if(mods.zone)out.push('잔류 '+mods.zone.seconds+'초');
 if(mods.pull)out.push('괴수 끌어당김 '+pct(mods.pull)+'%');
 if(mods.detonate)out.push('출혈 폭발');
 if(mods.shatter)out.push('빙결 +'+mods.shatter+'%');
 if(mods.chain)out.push('연쇄 '+mods.chain.n+'명');
 if(mods.refundKill)out.push('처치 시 재사용 −'+mods.refundKill+'초');
 if(mods.stack)out.push('누적 최대 +'+mods.stack.max+'%');
 if(mods.prime)out.push('다음 '+(TAG_NAMES[mods.prime.tag]??'')+' 스킬 +'+mods.prime.pct+'%');
 if(mods.primed)out.push('연계 시 +'+mods.primed+'%');
 if(mods.hpCost)out.push('체력 −'+pct(mods.hpCost)+'%');
 if(mods.drainHit)out.push('흡혈 '+mods.drainHit+'%');
 if(mods.expose)out.push('노출 '+mods.expose+'초');
 if(mods.after)out.push(AFTER[mods.after.kind]+' '+(mods.after.kind==='guard'?'−':'+')+mods.after.value+'% '+mods.after.seconds+'초');
 for(const [k,v] of Object.entries(mods.tagBonus??{}))out.push(TAG_NAMES[k]+' 스킬 +'+v+'%');
 const RULE_TEXT={stanceCounter:v=>'반격 '+v+'%',stanceShield:v=>'보호막 '+pct(v)+'%',bladeWave:v=>'검풍 '+v+'%',bladeDrain:v=>'타격 회복 '+(v*100).toFixed(1)+'%',bladeBleed:v=>'연격 출혈',markSpread:v=>'표식 전염 '+v,markBlast:v=>'폭발 범위 '+v,markRefund:v=>'처치 시 재사용 −'+v+'초',
  parryReset:v=>'재사용 −'+v+'초',parryRadius:v=>'반격 범위 ×'+v,parryGuard:v=>'받는 피해 −'+v+'%',phantomBleed:v=>'잔상 출혈',phantomChain:v=>'잔상 연쇄 '+v+'%',phantomBurst:v=>'종료 폭발 '+v+'%',phantomDrain:v=>'잔상 회복',
  autoCleanse:v=>v+'초마다 디버프 정화',debuffDamage:v=>'디버프 중 +'+v+'%',costCut:v=>'기력 −'+v,cooldownCut:v=>'재사용 −'+pct(v)+'%',bleedBonus:v=>'출혈 적 +'+v+'%',chillBonus:v=>'빙결 적 +'+v+'%',bossDamage:v=>'보스·정예 +'+v+'%',crowdDamage:v=>'난전 +'+v+'%',lowHpDamage:v=>'빈사 시 +'+v+'%',highStaminaDamage:v=>'기력 충만 +'+v+'%',primedAll:v=>'연계 +'+v+'%',
  killStamina:v=>'처치 기력 +'+v,killHeal:v=>'처치 회복 '+(v*100).toFixed(1)+'%',killFury:v=>'처치 후 +'+v+'%',perfectReset:v=>'회피 시 재사용 −'+v+'초',perfectFury:v=>'회피 후 +'+v+'%',perfectStamina:v=>'회피 기력 +'+v,perfectShield:v=>'회피 보호막 '+pct(v)+'%',
  exposeAll:v=>'적중 노출 '+v+'초',drainAll:v=>'흡혈 '+v+'%',finisherBleed:v=>'마무리 출혈',finisherExpose:v=>'마무리 노출 '+v+'초'};
 for(const [k,f] of Object.entries(RULE_TEXT))if(mods[k])out.push(f(mods[k]));
 if(mods.elementAll?.bleed)out.push('모든 스킬 출혈');
 if(mods.elementAll?.chill)out.push('모든 스킬 빙결');
 return out.join(' · ');
}
