// Chapter equipment sets (Alpha 0.108 region sets, Alpha 0.109 one set per chapter).
// Every stage drops pieces of its chapter's set: weapon, helmet, chest, pants and boots.
// Wearing 2 or 4 pieces of one set adds bonuses. Pure data and arithmetic: no DOM, storage or randomness.
export const SET_SLOTS=Object.freeze(['weapon','helmet','armor','pants','boots']);
// Bonus stats: damagePct/hpPct multiply the final stat, speed/crit/reduction/attackSpeed/range are percent
// points, regeneration is HP per second and collection is pickup range in world units.
export const SET_STATS=Object.freeze(['damagePct','hpPct','speed','crit','reduction','attackSpeed','range','regeneration','collection']);
const STAT_TEXT={damagePct:v=>'공격력 +'+Math.round(v*100)+'%',hpPct:v=>'체력 +'+Math.round(v*100)+'%',speed:v=>'이동 속도 +'+v+'%',crit:v=>'치명 +'+v+'%',
 reduction:v=>'피해 감소 +'+v+'%',attackSpeed:v=>'공격 속도 +'+v+'%',range:v=>'공격 범위 +'+v+'%',regeneration:v=>'초당 회복 +'+v,collection:v=>'획득 범위 +'+v};
const bonus=(pieces,stats)=>({pieces,stats,text:Object.entries(stats).map(([k,v])=>STAT_TEXT[k](v)).join(' · ')});
// Newer sets name their pieces "<prefix> <noun>": two prefixes per set, one noun per weapon design and part.
const named=([a,b],[sword,second],[helmet,armor,pants,boots])=>({weapon:[[a+' '+sword,b+' '+sword],[a+' '+second,b+' '+second]],
 helmet:[a+' '+helmet,b+' '+helmet],armor:[a+' '+armor,b+' '+armor],pants:[a+' '+pants,b+' '+pants],boots:[a+' '+boots,b+' '+boots]});
// [id, chapter, name, color, base style, 2-piece stats, 4-piece stats, names]. The four 0.108 sets keep
// their ids, names and weapon effects so saved items stay unchanged.
const ROWS=[
 ['forest',1,'숲의 사냥꾼','#e08a4f','swift',{speed:6},{damagePct:.10,crit:4},
  {weapon:[['단풍 사냥검','붉은잎 장검'],['가시덩굴 곡검','나무뿔 대검']],helmet:['사슴뿔 투구','덩굴 관'],armor:['단풍잎 흉갑','나무껍질 갑옷'],pants:['덩굴 각반','사냥꾼 바지'],boots:['나무뿌리 장화','이끼 발싸개']}],
 ['wolf',2,'늑대왕의 송곳니','#9aa4b0','swift',{attackSpeed:6},{crit:6,speed:6},named(['회색 갈기','늑대 송곳니'],['장검','사냥 곡도'],['투구','가죽 갑옷','각반','장화'])],
 ['goblin',3,'고블린 약탈자','#8fae4a','brute',{collection:60},{damagePct:.10},named(['녹슨 약탈','족장의 전리품'],['식칼검','톱날 대검'],['두건','누더기 갑옷','하의','군화'])],
 ['thorn',4,'가시덤불 수호자','#5f8f3e','guard',{reduction:3},{hpPct:.12,reduction:3},named(['가시덤불','엉겅퀴'],['장검','가시 대검'],['관','나무껍질 판금','각반','장화'])],
 ['spore',5,'독버섯 포자','#b07ad0','vital',{regeneration:1},{hpPct:.10,regeneration:2},named(['독포자','버섯갓'],['장검','독침 세검'],['갓 투구','포자 로브','하의','발싸개'])],
 ['orc',6,'오크 대장군','#b5643a','brute',{damagePct:.06},{hpPct:.08,damagePct:.08},named(['오크 전쟁','핏빛 엄니'],['장검','도끼날 대검'],['투구','철갑','다리갑옷','철화'])],
 ['mandrake',7,'맨드레이크 여왕','#d0607a','vital',{regeneration:1},{crit:5,attackSpeed:6},named(['꽃잎','뿌리 여왕의'],['장검','덩굴 곡검'],['화관','꽃잎 갑옷','각반','장화'])],
 ['spider',8,'거미 여왕','#6a6f8a','keen',{crit:5},{damagePct:.08,crit:5},named(['거미줄','독니'],['장검','갈래 단검'],['가면','갑각 흉갑','각반','장화'])],
 ['bloodbear',9,'핏빛 곰','#b0302e','brute',{hpPct:.08},{damagePct:.10,hpPct:.06},named(['핏빛 발톱','곰가죽'],['장검','발톱 대검'],['투구','털 갑옷','하의','장화'])],
 ['worldtree',10,'세계수의 가호','#7fd27a','vital',{hpPct:.10,regeneration:1},{damagePct:.12,speed:6},named(['세계수','태고의 잎'],['성검','뿌리 대검'],['관','생목 갑옷','각반','장화'])],
 ['fire',11,'화염 군주','#ff7a3a','fierce',{damagePct:.08},{crit:8,damagePct:.08},
  {weapon:[['용암 장검','불씨 검'],['화염 곡도','흑요석 대검']],helmet:['화염 왕관 투구','용암 투구'],armor:['흑요석 흉갑','불꽃 판금'],pants:['용암 각반','불꽃 판금 하의'],boots:['화산 장화','불꽃 철화']}],
 ['ifrit',12,'이프리트의 열기','#ff9d2e','fierce',{attackSpeed:6},{damagePct:.10,crit:5},named(['이프리트','열풍'],['곡도','초승 곡검'],['터번 투구','황동 갑옷','하의','장화'])],
 ['lavagiant',13,'용암 거인','#d9552b','guard',{reduction:4},{hpPct:.15,damagePct:.06},named(['용암석','화산암'],['장검','바위 대검'],['투구','암석 판금','다리갑옷','철화'])],
 ['phoenix',14,'불사조의 깃','#ffb347','swift',{regeneration:2},{hpPct:.12,speed:8},named(['불사조','황금 깃'],['장검','깃털 세검'],['깃털 관','깃 갑옷','각반','장화'])],
 ['minotaur',15,'화염 미노타우로스','#c2412d','brute',{damagePct:.08},{reduction:5,damagePct:.08},named(['투우왕','불뿔'],['장검','양날 도끼검'],['뿔 투구','청동 흉갑','다리갑옷','철화'])],
 ['frost',16,'서리 수호자','#8fd8f5','guard',{reduction:4},{hpPct:.15,reduction:4},
  {weapon:[['빙결 장검','서리 검'],['빙하 곡검','얼음 결정 대검']],helmet:['서리 왕관 투구','빙결 투구'],armor:['서리 털 흉갑','빙하 판금'],pants:['서리 각반','빙결 판금 하의'],boots:['설원 장화','얼음 철화']}],
 ['seadragon',17,'얼음 해룡','#5fb4d9','guard',{range:8},{damagePct:.10,reduction:4},named(['해룡 비늘','심해 서리'],['장검','물결 곡검'],['투구','비늘 갑옷','각반','장화'])],
 ['blizzard',18,'눈보라 마녀','#b9a7ff','keen',{crit:6},{attackSpeed:8,crit:6},named(['눈보라','마녀의 서리'],['세검','결정 마검'],['관','비단 로브','하의','장화'])],
 ['glacierturtle',19,'빙하 거북','#7fc8c0','vital',{reduction:5},{hpPct:.18,regeneration:2},named(['빙하 등껍질','만년설'],['장검','방패날 대검'],['투구','등껍질 갑옷','다리갑옷','철화'])],
 ['twindragon',20,'염빙 쌍두룡','#ff7a9a','fierce',{damagePct:.08,reduction:3},{crit:8,hpPct:.10},named(['쌍두룡','염빙'],['쌍룡검','용머리 대검'],['용 투구','용린 갑옷','각반','장화'])],
 ['ruins',21,'심연의 계약','#b67cf0','keen',{crit:6},{damagePct:.12,hpPct:.06},
  {weapon:[['심연 장검','해골 검'],['공허 곡도','망령 대검']],helmet:['심연 관 투구','해골 투구'],armor:['공허 흉갑','망자 판금'],pants:['심연 각반','뼈 판금 하의'],boots:['공허 장화','망자 철화']}],
 ['ghoul',22,'구울 군주','#8a9a6a','vital',{regeneration:2},{damagePct:.12,regeneration:2},named(['구울','썩은 뼈'],['장검','갈고리 대검'],['투구','꿰맨 갑옷','하의','장화'])],
 ['vampire',23,'흡혈 군주','#a3183a','keen',{attackSpeed:8},{crit:8,damagePct:.10},named(['흡혈귀','피의 박쥐'],['세검','박쥐날 곡검'],['관','망토 갑옷','각반','장화'])],
 ['necro',24,'대사령술사','#6be0a0','fierce',{range:10},{damagePct:.14},named(['사령술','영혼 등불'],['장검','낫날 대검'],['두건','해골 로브','하의','발싸개'])],
 ['cursedknight',25,'저주받은 기사단','#7a8cb0','guard',{reduction:5},{hpPct:.15,reduction:5},named(['저주받은 기사','망자의 문장'],['기사검','양손 대검'],['투구','판금','다리갑옷','철화'])],
 ['banshee',26,'그림자 밴시','#9fb7d6','swift',{speed:8},{crit:8,attackSpeed:8},named(['밴시','망령 비명'],['세검','유령 곡검'],['베일','망령 로브','하의','발싸개'])],
 ['mimic',27,'미믹의 탐욕','#e2b23c','brute',{collection:100},{damagePct:.12,crit:6},named(['황금 미믹','보물'],['장검','이빨 대검'],['투구','상자 갑옷','각반','장화'])],
 ['mummy',28,'미라 왕','#d6c08a','vital',{hpPct:.10},{reduction:5,regeneration:3},named(['미라 왕','붕대'],['장검','코페시'],['왕관','붕대 갑옷','하의','발싸개'])],
 ['royalguard',29,'왕의 근위대','#c9c9d8','guard',{damagePct:.08,reduction:3},{hpPct:.10,damagePct:.12},named(['근위대','왕실'],['장검','의장 대검'],['투구','의장 판금','다리갑옷','철화'])],
 ['abyss',30,'심연의 군주','#8c4dff','fierce',{damagePct:.10,crit:6},{hpPct:.15,damagePct:.15},named(['심연 군주','공허의 왕관'],['마검','공허 대검'],['뿔 투구','공허 갑옷','각반','장화'])],
];
const LEGACY=new Set(['forest','fire','frost','ruins']);
export const EQUIPMENT_SETS=Object.freeze(Object.fromEntries(ROWS.map(([id,chapter,name,color,style,two,four,names])=>[id,Object.freeze({
 id,chapter,name,color,style,tier:Math.ceil(chapter/10),
 // Later chapters of a region roll slightly stronger base stats (+2% per chapter within the region).
 power:Math.round((1+.02*((chapter-1)%10))*100)/100,
 // Weapon/armor unique effects rotate per set; the 0.108 sets keep their original rotation.
 effectOffset:LEGACY.has(id)?0:chapter,
 bonuses:Object.freeze([bonus(2,two),bonus(4,four)].map(b=>Object.freeze({...b,stats:Object.freeze(b.stats)}))),names})])));
export const CHAPTER_SETS=Object.freeze(Object.fromEntries(ROWS.map(([id,chapter])=>[chapter,id])));
// Art ids in the equipment atlas: two weapon designs, then one per armor part.
export const setArtId=(set,slot,variant=0)=>`set_${set}_${slot==='weapon'?(variant?'blade2':'sword'):slot}`;
// counts: {setId: pieces worn}. Returns the summed stats of every reached bonus.
export function setBonusStats(counts){
 const total=Object.fromEntries(SET_STATS.map(k=>[k,0]));
 for(const [id,count] of Object.entries(counts??{}))for(const bonus of EQUIPMENT_SETS[id]?.bonuses??[])if(count>=bonus.pieces)for(const [k,v] of Object.entries(bonus.stats))total[k]+=v;
 return total;
}
export function setBonusText(id,count=0){
 const set=EQUIPMENT_SETS[id];if(!set)return '';
 return set.bonuses.map(b=>(count>=b.pieces?'● ':'○ ')+b.pieces+'세트 · '+b.text).join('\n');
}
