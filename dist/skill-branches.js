// Alpha 0.126 스킬 갈래: every attacking active and every ultimate has two branches bought with 검술서.
// A skill can own both branches but uses one at a time (free to switch in camp). Branches are plain modifiers that
// combat-skills.js reads while casting:
//  damage ×, cooldown ×, cost +, area × (radius/width and radial reach), hits + (more hits share the total),
//  element {bleed, chill, push, breach, shield} on every hit (shield once per cast),
//  boss +% against bosses and elites, execute +% against targets under 35% health,
//  duration × and power + for the buff skills (수월의 자세, 혈월의 칼날, 월영군무), markHits for 월영 표식.
export const SKILL_BRANCH_COST=Object.freeze({pages:6,gold:1500});
export const EXECUTE_HEALTH=.35;
const b=(name,text,mods)=>Object.freeze({name,text,mods:Object.freeze({...mods,...(mods.element?{element:Object.freeze(mods.element)}:{})})});
export const SKILL_BRANCHES=Object.freeze({
 crescent:[b('만월 검기','검기 폭이 넓어져 무리를 쓸어낸다.',{area:1.6,damage:.85}),b('그믐 검기','좁고 날카로운 검기. 보스·정예에게 강하다.',{damage:1.35,boss:20,cost:4})],
 gale:[b('바람 가르기','짧은 간격으로 자주 돌진한다.',{cooldown:.6,damage:.85}),b('폭풍 돌진','경로의 적을 밀쳐내고 얼린다.',{damage:1.1,element:{push:80,chill:1}})],
 dance:[b('피의 윤무','베는 적마다 출혈을 남긴다.',{element:{bleed:3}}),b('수호 윤무','더 넓게 돌며 몸을 감싼다.',{area:1.15,element:{shield:.06}})],
 draw:[b('일격필살','더 무거운 일격. 빈사의 적을 끝낸다.',{damage:1.3,execute:50}),b('거합 연환','가볍게 자주 뽑는다.',{cooldown:.65,cost:-8})],
 plunge:[b('운석 낙월','넓게 내려쳐 얼린다.',{area:1.3,element:{chill:1.5}}),b('추락 처형','보스·정예를 노려 내려친다.',{boss:35})],
 parry:[b('반격의 칼날','반격이 훨씬 강하다.',{damage:1.5}),b('흐르는 물','자주 받아내고 보호막을 두른다.',{cooldown:.8,element:{shield:.1}})],
 echo:[b('깊은 잔상','두 번의 베기가 모두 강해진다.',{damage:1.25}),b('그림자 걸음','자주 물러나며 적을 약화시킨다.',{cooldown:.7,element:{breach:8}})],
 triple:[b('삼단 출혈','세 번의 베기가 출혈을 남긴다.',{element:{bleed:4}}),b('연월 폭풍','넓고 가볍게 벤다.',{area:1.25,cost:-6})],
 seeking:[b('사냥 표적','보스·정예를 끝까지 쫓는다.',{boss:40}),b('쌍둥이 검기','검기 두 개를 연달아 보낸다.',{hits:1,damage:1.6})],
 returning:[b('빙월','오가는 검기가 적을 얼린다.',{element:{chill:1.5}}),b('날선 귀환','느리지만 무겁게 돌아온다.',{damage:1.3,cooldown:1.15})],
 field:[b('넓은 진','진이 넓어진다.',{area:1.35,damage:.9}),b('약화의 진','진 안의 적이 피를 흘리고 약해진다.',{element:{breach:15,bleed:2}})],
 breach:[b('분쇄','강타가 더 무겁다.',{damage:1.4}),b('갑옷 사냥','장갑을 더 자주 벗긴다.',{cooldown:.7})],
 gather:[b('중력 월쇄','더 멀리서 끌어모은다.',{area:1.3}),b('쇄월 처형','모은 적을 깊게 벤다.',{damage:1.4,element:{bleed:2}})],
 stance:[b('부동의 자세','받는 피해를 더 줄인다.',{power:15}),b('명경지수','자세가 오래가고 자주 쓸 수 있다.',{duration:1.6,cooldown:.8})],
 mark:[b('깊은 표식','표식 폭발이 강하다.',{damage:1.5}),b('연쇄 표식','타격 3회로 터지고 자주 새긴다.',{markHits:3,cooldown:.6})],
 bloodblade:[b('피에 굶주린 칼날','연격 피해가 더 오른다.',{power:15}),b('긴 혈월','칼날이 오래 유지된다.',{duration:1.67})],
 bloodmoon:[b('핏빛 폭풍','더 넓게 베고 출혈을 남긴다.',{area:1.25,element:{bleed:3}}),b('적월 처형','더 강하게 베고 빈사의 적을 끝낸다.',{damage:1.25,execute:40})],
 eclipse:[b('개기 월식','더 강한 일격. 보스·정예에게 더 강하다.',{damage:1.3,boss:25}),b('짧은 월식','재사용이 크게 줄어든다.',{cooldown:.65})],
 phantoms:[b('잔상 군단','잔상이 오래 남아 더 많이 동행한다.',{duration:1.5}),b('날선 잔상','잔상 하나하나가 강하다.',{damage:1.4})],
});
const pct=v=>Math.round(v*100);
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
 if(e.bleed)out.push('출혈 '+e.bleed+'회');
 if(e.chill)out.push(e.chill+'초 빙결');
 if(e.push)out.push('밀쳐내기 '+e.push);
 if(e.breach)out.push('받는 피해 +'+e.breach+'%');
 if(e.shield)out.push('보호막 '+pct(e.shield)+'%');
 return out.join(' · ');
}
