// Alpha 0.125 괴수 기술: every chapter boss teaches one technique. The first kill of the boss teaches it (grade 1);
// 정예/악몽 kills have a chance to teach the 강화 (2) / 극 (3) grades, which hit much harder (see BEAST_GRADES).
// Techniques reuse the shapes, motions and effect art of Lilian's skills (`visual`) and add the boss region's element.
// Pure data; combat-skills.js adds them to SKILL_CATALOG as kind 'beast' and game-engine.js teaches them.
const TEMPLATES=Object.freeze({
 slam:{shape:'targetArea',visual:'plunge',damage:260,range:260,radius:160,delay:.35,poise:40,text:'전방으로 뛰어올라 반경 {r}을 내려친다.'},
 breath:{shape:'cone',visual:'draw',damage:240,range:240,dot:.5,delay:.3,poise:30,text:'전방 {r} 부채꼴에 기운을 내뿜는다.'},
 charge:{shape:'dash',visual:'gale',damage:220,range:260,width:70,delay:.15,poise:30,text:'전방으로 돌진하며 경로의 적을 들이받는다.'},
 volley:{shape:'line',visual:'crescent',damage:240,range:340,width:65,delay:.12,hits:2,interval:.25,poise:15,text:'사거리 {r}의 직선으로 두 번 쏘아 보낸다.'},
 zone:{shape:'field',visual:'field',damage:300,range:280,radius:150,delay:.2,hits:5,interval:.5,poise:10,cooldown:12,text:'조준 지점 반경 {r}에 영역을 남겨 5회 공격한다.'},
 spin:{shape:'circle',visual:'dance',damage:240,range:180,delay:.1,hits:3,interval:.3,poise:20,text:'주변 {r}을 3회 휩쓴다.'},
 boomerang:{shape:'returning',visual:'returning',damage:240,range:320,width:70,delay:.15,hits:2,interval:.6,poise:15,text:'전방 {r}로 던졌다가 되돌려 받는다. 왕복 각각 명중.'},
 roar:{shape:'gather',visual:'gather',damage:180,range:250,delay:.2,poise:25,text:'주변 {r}의 일반 괴수를 끌어당기며 포효한다.'},
});
// Region element by biome: added to every hit (bleed/chill/push/breach) or once per cast (shield).
export const BEAST_ELEMENTS=Object.freeze({
 forest:Object.freeze({name:'출혈',bleed:3,color:'#c94f4f'}),
 fire:Object.freeze({name:'화상',bleed:4,color:'#ff8a3d'}),
 frost:Object.freeze({name:'빙결',chill:2,color:'#8fe3ff'}),
 ruins:Object.freeze({name:'약화',breach:12,color:'#b48cff'}),
 sea:Object.freeze({name:'해류',push:60,chill:1,color:'#4fd1c5'}),
 sky:Object.freeze({name:'연쇄',extraHit:1,push:30,color:'#a8b8ff'}),
 divine:Object.freeze({name:'성광',shield:.08,color:'#ffd27a'}),
});
// Grade 1 = taught by the first kill, 2 = 강화 (정예), 3 = 극 (악몽). Higher grades are clearly worth chasing.
export const BEAST_GRADES=Object.freeze([
 null,
 Object.freeze({name:'기본',damage:1,area:1,element:1,cooldown:1,hits:0}),
 Object.freeze({name:'강화',damage:1.6,area:1.2,element:1.5,cooldown:1,hits:0}),
 Object.freeze({name:'극',damage:2.3,area:1.35,element:2,cooldown:.7,hits:1}),
]);
// Chance per boss kill to learn the next grade: 정예 teaches 강화, 악몽 teaches 극 (never lowers a grade).
export const BEAST_GRADE_CHANCE=Object.freeze([0,.12,.08]);
const ROWS=[
 ['boar','돌진 엄니','charge'],['direwolf','늑대 회오리','spin'],['goblinchief','투척 단검','volley'],['thornbeast','가시 덩굴밭','zone'],['mushroomking','포자 포효','roar'],
 ['orcwarlord','대장군 내려찍기','slam'],['mandrake','비명','roar'],['spiderqueen','독거미 분사','breath'],['bloodbear','핏빛 앞발','slam'],['worldtree','세계수의 뿌리','zone'],
 ['drake','화염 숨결','breath'],['ifrit','불꽃 회오리','spin'],['giant','용암 내려치기','slam'],['phoenix','불사조 강하','charge'],['minotaur','화염 돌격','charge'],
 ['mammoth','빙하 짓밟기','slam'],['serpent','얼음 숨결','breath'],['witch','눈보라','zone'],['tortoise','빙벽 포효','roar'],['twindragon','쌍두룡의 궤적','boomerang'],
 ['bonegiant','뼈 망치','slam'],['ghoullord','굶주린 손톱','spin'],['vampirebat','흡혈 박쥐떼','volley'],['lich','죽음의 진','zone'],['cursedknight','저주 돌격','charge'],
 ['banshee','통곡','roar'],['mimicking','탐욕의 아가리','breath'],['mummyking','붕대 채찍','boomerang'],['deathguard','근위 일격','slam'],['abysslord','심연의 문','zone'],
 ['crabking','집게 분쇄','slam'],['ghostcaptain','유령 포격','volley'],['kelpwitch','해초 감옥','zone'],['giantclam','진주 흡인','roar'],['sirenqueen','세이렌의 노래','breath'],
 ['anglerfish','심해 돌진','charge'],['jellyfish','독침 소용돌이','spin'],['merpriest','조류의 창','boomerang'],['kraken','촉수 휩쓸기','spin'],['leviathan','해일 숨결','breath'],
 ['griffinking','그리폰 강하','charge'],['harpyqueen','깃털 폭풍','volley'],['cloudgiant','구름 망치','slam'],['crowgeneral','까마귀 칼날','boomerang'],['windlord','회오리 바람','spin'],
 ['thunderwyvern','번개 숨결','breath'],['stormelemental','폭풍 영역','zone'],['thundersmith','천둥 모루','slam'],['thunderbird','낙뢰','volley'],['stormdragon','천둥 포효','roar'],
 ['guardian','석상 일격','slam'],['sphinx','수수께끼의 빛','breath'],['starknight','성좌 돌격','charge'],['fallenangel','타락의 깃','volley'],['judge','심판의 저울','boomerang'],
 ['chrono','멈춘 시간','zone'],['starserpent','별무리 똬리','spin'],['gatekeeper','문지기의 함성','roar'],['wargod','전쟁신의 일격','slam'],['sungod','태양 붕괴','zone'],
];
const elementText=e=>[e.bleed?'출혈 '+e.bleed+'회':'',e.chill?e.chill+'초 빙결':'',e.push?'밀쳐내기 '+e.push:'',e.breach?'5초간 받는 피해 +'+e.breach+'%':'',e.extraHit?'타격 +'+e.extraHit+'회':'',e.shield?'시전 시 최대 체력 '+Math.round(e.shield*100)+'% 보호막':''].filter(Boolean).join(' · ');
// chapters: the 60 chapter rows (id, biome, bossSpecies, bossName, special flag) in order.
export function beastTechniques(chapters){
 return chapters.map((c,i)=>{const [key,name,template]=ROWS[i],t=TEMPLATES[template],element=BEAST_ELEMENTS[c.biome],special=!!c.special;
  if(!c.bossSpecies.endsWith(key))throw new Error('괴수 기술 표가 챕터 보스와 맞지 않아: '+c.id);
  const damage=Math.round(t.damage*(special?1.2:1)),hits=(t.hits??1)+(element.extraHit??0),r=t.radius??t.range;
  return Object.freeze({id:'beast-'+key,name,kind:'beast',unlock:0,chapter:c.id,bossSpecies:c.bossSpecies,bossName:c.bossName,template,element:c.biome,
   damage,step:0,cost:20,cooldown:t.cooldown??10,shape:t.shape,visual:t.visual,range:t.range,...(t.radius?{radius:t.radius}:{}),...(t.width?{width:t.width}:{}),...(t.dot?{dot:t.dot}:{}),
   delay:t.delay,hits,...(hits>1?{interval:t.interval??.25}:{}),poise:t.poise,color:element.color,
   description:t.text.replace('{r}',r)+' '+element.name+': '+elementText(element)+'.',icon:'assets/skills/beast/'+key+'.webp'});
 });
}
export const beastElementText=elementText;
