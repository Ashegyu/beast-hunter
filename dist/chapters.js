import {equipmentFamily} from './equipment-slots.js?v=0.98.0';
// Authored region data. Every ten chapters share one region (art, roster, boss species);
// chapters inside a region differ by name, boss title and stat multiplier.
export const CHAPTERS_PER_THEME=10;
export const THEMES = [
  {id:1,key:'forest',name:'붉은 숲',subtitle:'숲의 괴수들이 사방에서 몰려온다.',bossScale:1,
    color:'#dbaa76',shotColor:'#dfbd68',pathColor:'#bc8964',bossName:'세계수의 수호령',bossSpecies:'forest_guardian',bossPosition:{x:1850,y:1920},bossCycle:['slam','charge','volley'],
    roster:['forest_wolf','forest_goblin','forest_orc','forest_spider','forest_mushroom','forest_devourer'],
    lateRoster:['forest_hornet','forest_dryad','forest_treant','forest_mantis','forest_shaman','forest_beetle'],
    encounters:[[650,1160,'늑대의 사냥길'],[1550,650,'고블린 야영지'],[2530,870,'오크의 초소'],[2800,1670,'수호령의 뿌리']],
    formations:[['skitter','skitter','skitter','skitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter']],
    caches:[[1150,1550,'버려진 사냥꾼의 짐','charm'],[2200,410,'뿌리 속 보물','weapon']],
    tactic:'늑대·거미의 도약 · 궁수·버섯의 탄막 · 오크·식인꽃의 압박',
    chapters:[['숲의 초입','새싹 수호령'],['늑대의 사냥길','이끼 수호령'],['고블린 야영지','덩굴 수호령'],['가시덤불 골짜기','가시 수호령'],['포자의 늪','포자 수호령'],
      ['오크의 초소','송곳니 수호령'],['식인꽃 군락','꽃잎 수호령'],['거미 둥지','거미줄 수호령'],['핏빛 수림','핏빛 수호령'],['세계수의 뿌리','세계수의 수호령']]},
  {id:2,key:'ruins',name:'망자의 폐성',subtitle:'망자의 무리가 불규칙하게 나타난다.',bossScale:1.13,
    color:'#ba9cd8',shotColor:'#bc88e5',pathColor:'#a89da8',bossName:'무덤의 왕',bossSpecies:'ruins_king',bossPosition:{x:2950,y:1830},bossCycle:['volley','slam','volley'],
    roster:['ruins_skeleton','ruins_mage','ruins_knight','ruins_bat','ruins_wraith','ruins_mimic'],
    lateRoster:['ruins_hound','ruins_archer','ruins_gargoyle','ruins_rat','ruins_eye','ruins_flesh'],
    encounters:[[690,1160,'무너진 성문'],[1320,1690,'망자의 회랑'],[2020,1510,'사령술 제단'],[2690,1050,'왕의 근위대']],
    formations:[['skitter','bulwark','skitter','spitter','spitter'],['bulwark','skitter','bulwark','spitter','spitter','skitter'],['spitter','skitter','bulwark','spitter','spitter','skitter'],['bulwark','bulwark','skitter','skitter','spitter','spitter']],
    caches:[[1530,620,'봉인된 묘실','armor'],[2490,1980,'왕실의 유품','charm']],
    tactic:'해골·박쥐의 습격 · 사령술사·망령의 사격 · 기사·미믹의 강타',
    chapters:[['무너진 성문','성문의 망령왕'],['망자의 회랑','회랑의 망령왕'],['박쥐 종탑','종탑의 망령왕'],['사령술 제단','제단의 망령왕'],['기사단 묘역','묘역의 망령왕'],
      ['망령의 서고','서고의 망령왕'],['미믹의 보물고','보물고의 망령왕'],['봉인된 지하묘','지하묘의 망령왕'],['왕의 근위대','근위대장 망령왕'],['무덤의 옥좌','무덤의 왕']]},
  {id:3,key:'frost',name:'서리 왕좌',subtitle:'눈보라 속에서 늑대와 골렘이 나타난다.',bossScale:1.22,
    color:'#97d9ed',shotColor:'#93d9fa',pathColor:'#a3ccdb',bossName:'빙원의 지배자',bossSpecies:'frost_king',bossPosition:{x:2950,y:430},bossCycle:['charge','volley','slam'],
    roster:['frost_wolf','frost_mage','frost_golem','frost_leopard','frost_wisp','frost_yeti'],
    lateRoster:['frost_fox','frost_archer','frost_bear','frost_owl','frost_slime','frost_knight'],
    encounters:[[680,1180,'설원의 발자국'],[1330,590,'얼음 정령의 터'],[1960,1180,'골렘의 균열'],[2600,730,'왕좌의 문턱']],
    formations:[['skitter','skitter','bulwark','skitter','spitter'],['spitter','skitter','bulwark','skitter','spitter','spitter'],['bulwark','bulwark','skitter','skitter','spitter','skitter'],['bulwark','bulwark','skitter','spitter','spitter','skitter']],
    caches:[[1490,1850,'얼어붙은 원정대','weapon'],[2400,1550,'빙하의 보물','armor']],
    tactic:'늑대·눈표범의 도약 · 마법사·정령의 얼음탄 · 골렘·설인의 강타',
    chapters:[['설원의 발자국','설원의 빙결왕'],['얼어붙은 호수','호수의 빙결왕'],['눈표범 능선','능선의 빙결왕'],['얼음 정령의 터','정령의 빙결왕'],['골렘의 균열','균열의 빙결왕'],
      ['설인의 동굴','동굴의 빙결왕'],['빙하 협곡','협곡의 빙결왕'],['눈보라 고개','눈보라 빙결왕'],['왕좌의 문턱','문턱의 빙결왕'],['서리 왕좌','빙원의 지배자']]},
];
// Chapter bosses drawn for Alpha 0.106 (art/monsters0106). A chapter without an
// entry uses its region boss species under its own title.
export const CHAPTER_BOSSES = {
  boss_forest_boar:{chapter:1,name:'붉은엄니 멧돼지',height:215},
  boss_forest_direwolf:{chapter:2,name:'회색 늑대왕',height:210},
  boss_forest_goblinchief:{chapter:3,name:'고블린 족장',height:225},
  boss_forest_thornbeast:{chapter:4,name:'가시덩굴 괴수',height:240},
  boss_forest_mushroomking:{chapter:5,name:'독버섯 왕',height:230},
  boss_forest_orcwarlord:{chapter:6,name:'오크 대장군',height:240},
  boss_forest_mandrake:{chapter:7,name:'맨드레이크 여왕',height:240},
  boss_forest_spiderqueen:{chapter:8,name:'거미 여왕',height:200},
  boss_forest_bloodbear:{chapter:9,name:'핏빛 곰',height:230},
  boss_ruins_bonegiant:{chapter:11,name:'해골 거인',height:255},
  boss_ruins_ghoullord:{chapter:12,name:'구울 군주',height:225},
  boss_ruins_vampirebat:{chapter:13,name:'흡혈 박쥐 군주',height:235},
  boss_ruins_lich:{chapter:14,name:'대사령술사',height:240},
  boss_ruins_cursedknight:{chapter:15,name:'저주받은 기사단장',height:245},
  boss_ruins_banshee:{chapter:16,name:'그림자 밴시',height:235},
  boss_ruins_mimicking:{chapter:17,name:'거대 미믹',height:200},
  boss_ruins_mummyking:{chapter:18,name:'미라 왕',height:240},
  boss_ruins_deathguard:{chapter:19,name:'근위대장',height:245},
  boss_frost_mammoth:{chapter:21,name:'설원 매머드',height:250},
  boss_frost_serpent:{chapter:22,name:'얼음 해룡',height:230},
  boss_frost_griffin:{chapter:23,name:'서리 그리폰',height:225},
  boss_frost_elemental:{chapter:24,name:'얼음 정령왕',height:250},
  boss_frost_colossus:{chapter:25,name:'수정 거신',height:260},
  boss_frost_yetichief:{chapter:26,name:'설인 족장',height:245},
  boss_frost_tortoise:{chapter:27,name:'빙하 거북',height:210},
  boss_frost_witch:{chapter:28,name:'눈보라 마녀',height:240},
  boss_frost_wyvern:{chapter:29,name:'서리 와이번',height:240},
};
const bossOfChapter=id=>Object.entries(CHAPTER_BOSSES).find(([,b])=>b.chapter===id);
const josa=(word,consonant,vowel)=>{const code=word.charCodeAt(word.length-1)-0xac00;return code>=0&&code<11172&&code%28?consonant:vowel;};
// Chapters 1–3 of a region use its original roster, 4–6 swap in the new
// specialists (unlock stage 2–4), 7–10 field the new roster entirely.
// Each phase also has its own ground tile (manifest.chapters key).
export const chapterPhase=number=>number<=3?1:number<=6?2:3;
const phaseRoster=(theme,phase)=>phase===1?theme.roster:phase===2?[...theme.roster.slice(0,3),...theme.lateRoster.slice(3)]:theme.lateRoster;
// Enemy stats grow 13% of the first chapter per chapter (ch.30 = ×4.77).
export const chapterMultiplier=id=>Math.round((1+(id-1)*.13)*100)/100;
export const CHAPTERS = THEMES.flatMap(theme=>theme.chapters.map(([name,title],i)=>{
  const id=(theme.id-1)*CHAPTERS_PER_THEME+i+1,multiplier=chapterMultiplier(id),finale=i===CHAPTERS_PER_THEME-1,own=bossOfChapter(id),phase=chapterPhase(i+1),bossName=own?own[1].name:title;
  return {id,theme:theme.id,key:theme.key,region:theme.name,name,number:i+1,finale,phase,environment:phase===1?String(theme.id):theme.id+'.'+phase,
    subtitle:theme.subtitle+(finale?` 지역의 끝에서 ${bossName}${josa(bossName,'이','가')} 기다린다.`:` 열 스테이지 끝에서 ${bossName}${josa(bossName,'을','를')} 사냥해.`),
    multiplier,bossHp:Math.round(780*multiplier*theme.bossScale*(finale?1.15:1)),reward:Math.round(90*multiplier),
    color:theme.color,shotColor:theme.shotColor,pathColor:theme.pathColor,bossName,bossSpecies:own?own[0]:theme.bossSpecies,bossPosition:theme.bossPosition,bossCycle:theme.bossCycle,
    roster:Object.freeze(phaseRoster(theme,phase)),encounters:theme.encounters,formations:theme.formations,caches:theme.caches,tactic:theme.tactic};
}));
export const chapterTheme=id=>THEMES[(CHAPTERS[id-1]?.theme??1)-1];
export const MONSTERS = {
  forest_wolf:{name:'늑대',role:'skitter',height:88,speed:122,chargeEvery:3,chargeSpeed:400,chargeDuration:.26},
  forest_goblin:{name:'고블린 궁수',role:'spitter',height:96,shots:1},
  forest_orc:{name:'오크 파수병',role:'bulwark',height:145},
  forest_guardian:{name:'세계수의 수호령',role:'bulwark',height:250},
  ruins_skeleton:{name:'해골 전사',role:'skitter',height:102,speed:96},
  ruins_mage:{name:'사령술사',role:'spitter',height:112,shots:3,shotSpeed:320},
  ruins_knight:{name:'죽음의 기사',role:'bulwark',height:146,guardMax:125},
  ruins_king:{name:'무덤의 왕',role:'bulwark',height:244},
  frost_wolf:{name:'서리 늑대',role:'skitter',height:90,speed:126},
  frost_mage:{name:'얼음 마법사',role:'spitter',height:110,shots:3,shotSpeed:300},
  frost_golem:{name:'얼음 골렘',role:'bulwark',height:164,speed:65,radius:110,attackRange:150,windup:.9},
  frost_king:{name:'빙원의 지배자',role:'bulwark',height:254},
  forest_spider:{name:'가시등 거미',role:'skitter',height:76,unlockStage:2,speed:145,radius:52,attackRange:125,windup:.65,attackCycle:['charge','slam'],chargeSpeed:380,chargeDuration:.25,guardMax:0,hpScale:.85,damageScale:.85,attackInterval:1.05,tactic:'짧은 도약 뒤 근접 독니 공격'},
  forest_mushroom:{name:'붉은 포자 버섯',role:'spitter',height:100,unlockStage:3,speed:45,attackRange:430,windup:1,shots:5,shotSpeed:235,shotSpread:.24,shotColor:'#dcb0f2',projectileStyle:'spore',attackInterval:3.2,damageScale:.75,tactic:'느리게 퍼지는 다섯 갈래 포자탄'},
  forest_devourer:{name:'가시턱 식인꽃',role:'bulwark',height:138,unlockStage:4,speed:0,radius:90,attackRange:200,windup:1,attackCycle:['slam'],guardMax:0,hpScale:.9,attackInterval:2.1,tactic:'뿌리를 고정하고 목표 지점을 물어뜯음'},
  ruins_bat:{name:'묘지 박쥐',role:'skitter',height:78,unlockStage:2,speed:160,radius:44,attackRange:160,windup:.65,attackCycle:['charge'],chargeSpeed:420,chargeDuration:.2,guardMax:0,hpScale:.7,damageScale:.8,attackInterval:1.1,tactic:'빠르게 접근한 뒤 직선 급강하'},
  ruins_wraith:{name:'푸른 망령',role:'spitter',height:122,unlockStage:3,speed:84,attackRange:490,windup:.95,shots:2,shotSpeed:250,shotSpread:.1,shotColor:'#b4dbfa',projectileStyle:'spectral',standoffMin:150,standoffMax:290,attackInterval:2.6,tactic:'거리를 벌리며 좁은 두 갈래 영혼탄'},
  ruins_mimic:{name:'탐욕의 미믹',role:'bulwark',height:104,unlockStage:4,speed:58,radius:78,attackRange:150,windup:.9,attackCycle:['slam','charge'],chargeSpeed:330,chargeDuration:.28,guardMax:0,hpScale:1.1,damageScale:1.1,attackInterval:1.7,tactic:'커다란 입으로 물어뜯고 짧게 돌진'},
  frost_leopard:{name:'설원 눈표범',role:'skitter',height:90,unlockStage:2,speed:170,radius:48,attackRange:140,windup:.65,attackCycle:['slam','charge'],chargeSpeed:480,chargeDuration:.2,guardMax:0,hpScale:.9,damageScale:1.05,attackInterval:1,tactic:'빠른 추격과 짧고 날카로운 도약'},
  frost_wisp:{name:'빙결 수정 정령',role:'spitter',height:98,unlockStage:3,speed:65,attackRange:500,windup:1,shots:4,shotSpeed:275,shotSpread:.22,shotColor:'#9ce7f7',projectileStyle:'ice',attackInterval:2.9,tactic:'부채꼴로 퍼지는 네 갈래 얼음탄'},
  frost_yeti:{name:'빙설 설인',role:'bulwark',height:174,unlockStage:4,speed:70,radius:120,attackRange:160,windup:1.05,attackCycle:['slam','charge'],chargeSpeed:300,chargeDuration:.35,guardMax:0,hpScale:1.2,attackInterval:1.7,tactic:'넓은 지면 강타와 육중한 돌진'},

  forest_hornet:{name:'독침 말벌',role:'skitter',height:80,speed:130,chargeEvery:3,chargeSpeed:420,chargeDuration:.24},
  forest_dryad:{name:'덩굴 드라이어드',role:'spitter',height:100,shots:2,shotSpeed:300,shotColor:'#b7e07a'},
  forest_treant:{name:'이끼 나무 골렘',role:'bulwark',height:150,speed:70},
  forest_mantis:{name:'사마귀 전사',role:'skitter',height:96,unlockStage:2,speed:150,radius:50,attackRange:135,windup:.6,attackCycle:['slam','charge'],chargeSpeed:400,chargeDuration:.22,guardMax:0,hpScale:.85,damageScale:.9,attackInterval:1,tactic:'짧은 돌진 뒤 낫팔 베기'},
  forest_shaman:{name:'고블린 주술사',role:'spitter',height:100,unlockStage:3,speed:70,attackRange:460,windup:1,shots:3,shotSpeed:280,shotSpread:.18,shotColor:'#ff8a4a',projectileStyle:'spore',attackInterval:2.8,damageScale:.85,tactic:'느린 세 갈래 불씨탄'},
  forest_beetle:{name:'갑각 장수풍뎅이',role:'bulwark',height:130,unlockStage:4,speed:60,radius:100,attackRange:150,windup:1,attackCycle:['charge','slam'],chargeSpeed:340,chargeDuration:.3,guardMax:0,hpScale:1.2,attackInterval:1.8,tactic:'뿔을 앞세운 돌진과 짓밟기'},
  ruins_hound:{name:'해골 사냥개',role:'skitter',height:86,speed:125,chargeEvery:3,chargeSpeed:410,chargeDuration:.24},
  ruins_archer:{name:'해골 궁수',role:'spitter',height:104,shots:1,shotSpeed:360},
  ruins_gargoyle:{name:'석상 가고일',role:'bulwark',height:140,guardMax:115},
  ruins_rat:{name:'역병 쥐',role:'skitter',height:72,unlockStage:2,speed:165,radius:44,attackRange:150,windup:.6,attackCycle:['charge'],chargeSpeed:430,chargeDuration:.2,guardMax:0,hpScale:.7,damageScale:.8,attackInterval:1.1,tactic:'빠르게 접근한 뒤 물어뜯는 돌진'},
  ruins_eye:{name:'부유 눈알',role:'spitter',height:104,unlockStage:3,speed:80,attackRange:500,windup:.95,shots:3,shotSpeed:260,shotSpread:.14,shotColor:'#d38cf5',projectileStyle:'spectral',standoffMin:160,standoffMax:300,attackInterval:2.6,tactic:'거리를 벌리며 세 갈래 시선탄'},
  ruins_flesh:{name:'시체 거인',role:'bulwark',height:160,unlockStage:4,speed:55,radius:110,attackRange:160,windup:1.05,attackCycle:['slam','charge'],chargeSpeed:300,chargeDuration:.32,guardMax:0,hpScale:1.25,attackInterval:1.8,tactic:'갈고리 강타와 육중한 돌진'},
  frost_fox:{name:'서리 여우',role:'skitter',height:84,speed:132,chargeEvery:3,chargeSpeed:430,chargeDuration:.22},
  frost_archer:{name:'설원 궁수',role:'spitter',height:106,shots:2,shotSpeed:320},
  frost_bear:{name:'빙판 곰',role:'bulwark',height:150,speed:68,radius:110,attackRange:150},
  frost_owl:{name:'서리 올빼미',role:'skitter',height:88,unlockStage:2,speed:170,radius:48,attackRange:150,windup:.6,attackCycle:['charge','slam'],chargeSpeed:470,chargeDuration:.2,guardMax:0,hpScale:.85,damageScale:1,attackInterval:1,tactic:'낮게 활공한 뒤 발톱 급강하'},
  frost_slime:{name:'얼음 슬라임',role:'spitter',height:80,unlockStage:3,speed:55,attackRange:470,windup:1,shots:3,shotSpeed:260,shotSpread:.2,shotColor:'#9ce7f7',projectileStyle:'ice',attackInterval:2.9,damageScale:.85,tactic:'튀어 오르며 세 갈래 얼음 덩이'},
  frost_knight:{name:'서리 기사',role:'bulwark',height:150,unlockStage:4,speed:62,radius:100,attackRange:150,windup:1,attackCycle:['slam','charge'],chargeSpeed:310,chargeDuration:.3,guardMax:0,hpScale:1.25,attackInterval:1.8,tactic:'방패 돌진과 철퇴 내려치기'},
};
for(const [id,boss] of Object.entries(CHAPTER_BOSSES))MONSTERS[id]={name:boss.name,role:'bulwark',height:boss.height};
// Only role-compatible, unlocked chapter identities can enter a normal wave.
export function chapterMonsterPool(chapterId,stage,role){
  const chapter=CHAPTERS[chapterId-1];if(!chapter)return [];
  return chapter.roster.filter(id=>MONSTERS[id].role===role&&(MONSTERS[id].unlockStage??1)<=stage);
}
export const EQUIPMENT_ART = [
  {id:'forest_blade',tier:1,slot:'weapon',name:'붉은 잎 검'}, {id:'forest_fang',tier:1,slot:'weapon',name:'오크 송곳니 검'},
  {id:'forest_armor',tier:1,slot:'armor',name:'숲지기 흉갑'}, {id:'forest_charm',tier:1,slot:'charm',name:'가시 호박 부적'},
  {id:'ruins_blade',tier:2,slot:'weapon',name:'묘지의 은검'}, {id:'ruins_rune',tier:2,slot:'weapon',name:'망령의 룬검'},
  {id:'ruins_armor',tier:2,slot:'armor',name:'죽음의 기사 흉갑'}, {id:'ruins_charm',tier:2,slot:'charm',name:'왕의 봉인'},
  {id:'frost_blade',tier:3,slot:'weapon',name:'빙결 수정검'}, {id:'frost_fang',tier:3,slot:'weapon',name:'서리 송곳니 검'},
  {id:'frost_armor',tier:3,slot:'armor',name:'빙하 판금 흉갑'}, {id:'frost_charm',tier:3,slot:'charm',name:'눈꽃 룬'},
];
export function equipmentArt(item){
  const explicit=EQUIPMENT_ART.find(a=>a.id===item?.artId&&a.slot===equipmentFamily(item.slot)&&a.tier===item.tier);
  return explicit??EQUIPMENT_ART.find(a=>a.slot===equipmentFamily(item?.slot??'weapon')&&a.tier===(item?.tier??1));
}
for(const theme of THEMES){
  theme.route=[{x:350,y:1160},...theme.encounters.map(([x,y])=>({x,y})),theme.bossPosition];
  for(const rows of [theme.encounters,theme.formations,theme.caches,theme.chapters]){rows.forEach(Object.freeze);Object.freeze(rows);}
  theme.route.forEach(Object.freeze);Object.freeze(theme.route);Object.freeze(theme.roster);Object.freeze(theme.lateRoster);Object.freeze(theme.bossCycle);Object.freeze(theme.bossPosition);Object.freeze(theme);
}
for(const chapter of CHAPTERS){chapter.route=THEMES[chapter.theme-1].route;Object.freeze(chapter);}
Object.values(CHAPTER_BOSSES).forEach(Object.freeze);Object.freeze(CHAPTER_BOSSES);Object.freeze(THEMES);Object.freeze(CHAPTERS);Object.values(MONSTERS).forEach(m=>{if(m.attackCycle)Object.freeze(m.attackCycle);Object.freeze(m);});Object.freeze(MONSTERS);EQUIPMENT_ART.forEach(Object.freeze);Object.freeze(EQUIPMENT_ART);
