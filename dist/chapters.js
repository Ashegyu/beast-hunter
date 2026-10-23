import {equipmentFamily} from './equipment-slots.js?v=0.98.0';
// Authored chapter data. Each hunt clones mutable positions/progress from these definitions.
export const CHAPTERS = [
  {id:1,key:'forest',name:'붉은 숲',subtitle:'숲의 괴수들이 사방에서 몰려온다. 열 스테이지를 돌파하고 세계수의 수호령을 사냥해.',multiplier:1,bossHp:780,reward:90,
    color:'#dbaa76',shotColor:'#dfbd68',pathColor:'#bc8964',bossName:'세계수의 수호령',bossSpecies:'forest_guardian',bossPosition:{x:1850,y:1920},bossCycle:['slam','charge','volley'],
    roster:['forest_wolf','forest_goblin','forest_orc','forest_spider','forest_mushroom','forest_devourer'],
    encounters:[[650,1160,'늑대의 사냥길'],[1550,650,'고블린 야영지'],[2530,870,'오크의 초소'],[2800,1670,'수호령의 뿌리']],
    formations:[['skitter','skitter','skitter','skitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter']],
    caches:[[1150,1550,'버려진 사냥꾼의 짐','charm'],[2200,410,'뿌리 속 보물','weapon']],
    tactic:'늑대·거미의 도약 · 궁수·버섯의 탄막 · 오크·식인꽃의 압박'},
  {id:2,key:'ruins',name:'망자의 폐성',subtitle:'망자의 무리가 불규칙하게 나타난다. 열 스테이지 끝에서 무덤의 왕에게 도전해.',multiplier:1.45,bossHp:1280,reward:145,
    color:'#ba9cd8',shotColor:'#bc88e5',pathColor:'#a89da8',bossName:'무덤의 왕',bossSpecies:'ruins_king',bossPosition:{x:2950,y:1830},bossCycle:['volley','slam','volley'],
    roster:['ruins_skeleton','ruins_mage','ruins_knight','ruins_bat','ruins_wraith','ruins_mimic'],
    encounters:[[690,1160,'무너진 성문'],[1320,1690,'망자의 회랑'],[2020,1510,'사령술 제단'],[2690,1050,'왕의 근위대']],
    formations:[['skitter','bulwark','skitter','spitter','spitter'],['bulwark','skitter','bulwark','spitter','spitter','skitter'],['spitter','skitter','bulwark','spitter','spitter','skitter'],['bulwark','bulwark','skitter','skitter','spitter','spitter']],
    caches:[[1530,620,'봉인된 묘실','armor'],[2490,1980,'왕실의 유품','charm']],
    tactic:'해골·박쥐의 습격 · 사령술사·망령의 사격 · 기사·미믹의 강타'},
  {id:3,key:'frost',name:'서리 왕좌',subtitle:'눈보라 속에서 등장하는 늑대와 골렘을 상대해. 열 스테이지 끝에 서리 왕좌가 기다린다.',multiplier:2,bossHp:1900,reward:220,
    color:'#97d9ed',shotColor:'#93d9fa',pathColor:'#a3ccdb',bossName:'빙원의 지배자',bossSpecies:'frost_king',bossPosition:{x:2950,y:430},bossCycle:['charge','volley','slam'],
    roster:['frost_wolf','frost_mage','frost_golem','frost_leopard','frost_wisp','frost_yeti'],
    encounters:[[680,1180,'설원의 발자국'],[1330,590,'얼음 정령의 터'],[1960,1180,'골렘의 균열'],[2600,730,'왕좌의 문턱']],
    formations:[['skitter','skitter','bulwark','skitter','spitter'],['spitter','skitter','bulwark','skitter','spitter','spitter'],['bulwark','bulwark','skitter','skitter','spitter','skitter'],['bulwark','bulwark','skitter','spitter','spitter','skitter']],
    caches:[[1490,1850,'얼어붙은 원정대','weapon'],[2400,1550,'빙하의 보물','armor']],
    tactic:'늑대·눈표범의 도약 · 마법사·정령의 얼음탄 · 골렘·설인의 강타'},
];
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

};
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
for(const chapter of CHAPTERS){
  chapter.route=[{x:350,y:1160},...chapter.encounters.map(([x,y])=>({x,y})),chapter.bossPosition];
  for(const rows of [chapter.encounters,chapter.formations,chapter.caches]){rows.forEach(Object.freeze);Object.freeze(rows);}
  chapter.route.forEach(Object.freeze);Object.freeze(chapter.route);Object.freeze(chapter.roster);Object.freeze(chapter.bossCycle);Object.freeze(chapter);
}
Object.freeze(CHAPTERS);Object.values(MONSTERS).forEach(m=>{if(m.attackCycle)Object.freeze(m.attackCycle);Object.freeze(m);});Object.freeze(MONSTERS);EQUIPMENT_ART.forEach(Object.freeze);Object.freeze(EQUIPMENT_ART);
