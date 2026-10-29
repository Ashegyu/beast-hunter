import {equipmentFamily} from './equipment-slots.js?v=0.143.4';
import {SEAL_EFFECTS,sealArtId} from './seals.js?v=0.143.4';
import {EQUIPMENT_SETS,SET_SLOTS,CHAPTER_SETS,setArtId} from './equipment-sets.js?v=0.143.4';
// Sixty chapters in six regions of ten: 1–10 forest, 11–20 fire and ice (11–15 fire,
// 16–20 ice), 21–30 darkness (Alpha 0.107), 31–40 sunken kingdom, 41–50 storm sky isles,
// 51–60 twilight sanctum (Alpha 0.118). A region drives the map tabs, item and
// material tiers; a biome drives ground art, props, attack effects, boss rule and the
// monster pool. Every chapter has its own ground tile and boss; 10/20/30 are special bosses.
export const CHAPTERS_PER_THEME=10;
export const THEMES = [
  {id:1,key:'forest',name:'붉은 숲',bossScale:1},
  {id:2,key:'flame',name:'불과 얼음의 땅',bossScale:1.13},
  {id:3,key:'abyss',name:'어둠의 심연',bossScale:1.22},
  {id:4,key:'sea',name:'가라앉은 왕국',bossScale:1.3},
  {id:5,key:'sky',name:'폭풍의 하늘섬',bossScale:1.38},
  {id:6,key:'divine',name:'황혼의 신역',bossScale:1.46},
];
const ROLES=['skitter','spitter','bulwark'];
// props: index of the four-frame set in manifest.chapterProps; effects: manifest.monsterEffects key.
export const BIOMES = {
  forest:{key:'forest',name:'숲',props:0,effects:1,bossRule:'regen',subtitle:'숲의 괴수들이 사방에서 몰려온다.',
    color:'#dbaa76',shotColor:'#dfbd68',pathColor:'#bc8964',bossPosition:{x:1850,y:1920},bossCycle:['slam','charge','volley'],
    pool:{skitter:['forest_wolf','forest_spider','forest_hornet','forest_mantis'],spitter:['forest_goblin','forest_mushroom','forest_dryad','forest_shaman'],bulwark:['forest_orc','forest_devourer','forest_treant','forest_beetle']},
    encounters:[[650,1160,'늑대의 사냥길'],[1550,650,'고블린 야영지'],[2530,870,'오크의 초소'],[2800,1670,'수호령의 뿌리']],
    caches:[[1150,1550,'버려진 사냥꾼의 짐','charm'],[2200,410,'뿌리 속 보물','weapon']],
    tactic:'짐승의 도약 · 정령과 주술의 탄막 · 거목과 갑각의 압박'},
  fire:{key:'fire',name:'불',props:3,effects:4,bossRule:'fury',subtitle:'용암이 끓는 땅에서 불의 괴수들이 깨어난다.',
    color:'#f0a060',shotColor:'#ff9a4a',pathColor:'#c8784e',bossPosition:{x:2950,y:1830},bossCycle:['charge','slam','volley'],
    pool:{skitter:['fire_salamander','fire_hellhound','fire_imp','fire_phoenixling'],spitter:['fire_spirit','fire_cultist','fire_slime','fire_beetle'],bulwark:['fire_golem','fire_crab','fire_salamanderknight','fire_rhino']},
    encounters:[[690,1160,'불타는 길목'],[1320,1690,'용암 웅덩이'],[2020,1510,'잿빛 언덕'],[2690,1050,'화염 제단']],
    caches:[[1530,620,'그을린 보급품','armor'],[2490,1980,'용암 속 보물','weapon']],
    tactic:'불길의 돌진 · 정령과 사교도의 화염탄 · 용암 거체의 강타'},
  frost:{key:'frost',name:'얼음',props:2,effects:3,bossRule:'summon',subtitle:'눈보라 속에서 서리의 괴수들이 다가온다.',
    color:'#97d9ed',shotColor:'#93d9fa',pathColor:'#a3ccdb',bossPosition:{x:2950,y:430},bossCycle:['charge','volley','slam'],
    pool:{skitter:['frost_wolf','frost_leopard','frost_fox','frost_owl'],spitter:['frost_mage','frost_wisp','frost_archer','frost_slime'],bulwark:['frost_golem','frost_yeti','frost_bear','frost_knight']},
    encounters:[[680,1180,'설원의 발자국'],[1330,590,'얼음 정령의 터'],[1960,1180,'골렘의 균열'],[2600,730,'왕좌의 문턱']],
    caches:[[1490,1850,'얼어붙은 원정대','weapon'],[2400,1550,'빙하의 보물','armor']],
    tactic:'설원의 추격 · 얼음탄 탄막 · 빙결 거체의 강타'},
  ruins:{key:'ruins',name:'어둠',props:1,effects:2,bossRule:'defense',subtitle:'빛이 닿지 않는 곳에서 망자와 악마가 몰려온다.',
    color:'#ba9cd8',shotColor:'#bc88e5',pathColor:'#a89da8',bossPosition:{x:2950,y:1830},bossCycle:['volley','slam','volley'],
    pool:{skitter:['ruins_skeleton','ruins_bat','ruins_hound','ruins_rat','dark_imp','dark_spider'],spitter:['ruins_mage','ruins_wraith','ruins_archer','ruins_eye','dark_succubus','dark_priest'],bulwark:['ruins_knight','ruins_mimic','ruins_gargoyle','ruins_flesh','dark_demon','dark_voidgolem']},
    encounters:[[690,1160,'무너진 성문'],[1320,1690,'망자의 회랑'],[2020,1510,'사령술 제단'],[2690,1050,'왕의 근위대']],
    caches:[[1530,620,'봉인된 묘실','armor'],[2490,1980,'왕실의 유품','charm']],
    tactic:'망자와 악마의 습격 · 저주의 사격 · 거체의 강타'},
  sea:{key:'sea',name:'바다',props:4,effects:5,bossRule:'summon',subtitle:'가라앉은 왕국의 바닥에서 바다의 괴수들이 떠오른다.',
    color:'#7fd0e0',shotColor:'#7fe6f5',pathColor:'#8fb8c0',bossPosition:{x:2950,y:430},bossCycle:['charge','volley','slam'],
    pool:{skitter:['sea_piranha','sea_eel','sea_shrimp','sea_crab'],spitter:['sea_mermaid','sea_puffer','sea_jelly','sea_coralwisp'],bulwark:['sea_crabknight','sea_turtle','sea_sharkman','sea_coralgolem']},
    encounters:[[680,1180,'산호 여울'],[1330,590,'난파선 잔해'],[1960,1180,'해초 숲길'],[2600,730,'왕좌의 해류']],
    caches:[[1490,1850,'가라앉은 보물 상자','weapon'],[2400,1550,'진주 조개','charm']],
    tactic:'물살을 탄 돌진 · 물방울과 독침의 탄막 · 갑각 거체의 강타'},
  sky:{key:'sky',name:'하늘',props:5,effects:6,bossRule:'fury',subtitle:'바람과 번개가 몰아치는 하늘섬에서 폭풍의 괴수들이 내려온다.',
    color:'#b8c8ff',shotColor:'#a8c4ff',pathColor:'#b0b8c8',bossPosition:{x:2950,y:1830},bossCycle:['charge','slam','volley'],
    pool:{skitter:['sky_harpy','sky_hawk','sky_cloudwolf','sky_sprite'],spitter:['sky_stormmage','sky_archer','sky_orb','sky_thunderjelly'],bulwark:['sky_rockgolem','sky_griffinrider','sky_stormknight','sky_cloudturtle']},
    encounters:[[690,1160,'바람의 길목'],[1320,1690,'구름 다리'],[2020,1510,'번개 첨탑'],[2690,1050,'폭풍의 제단']],
    caches:[[1530,620,'바람에 실린 보급품','armor'],[2490,1980,'천둥 대장간 유물','weapon']],
    tactic:'급강하 습격 · 번개와 깃털의 탄막 · 부유석 거체의 강타'},
  divine:{key:'divine',name:'신역',props:6,effects:7,bossRule:'defense',subtitle:'무너진 신들의 땅에서 타락한 신의 군세가 일어선다.',
    color:'#f0d890',shotColor:'#ffe08a',pathColor:'#c8b890',bossPosition:{x:1850,y:1920},bossCycle:['volley','slam','volley'],
    pool:{skitter:['divine_cherub','divine_hound','divine_lion','divine_wraith'],spitter:['divine_priest','divine_starmage','divine_archer','divine_eye'],bulwark:['divine_golem','divine_paladin','divine_statue','divine_clockwork']},
    encounters:[[650,1160,'황금 계단'],[1550,650,'빛의 정원'],[2530,870,'심판의 회랑'],[2800,1670,'태양의 문']],
    caches:[[1150,1550,'봉헌된 성물','charm'],[2200,410,'신전의 보고','weapon']],
    tactic:'신성한 돌격 · 빛과 별의 탄막 · 석상과 성기사의 압박'},
};
const FORMATIONS=[['skitter','skitter','skitter','skitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter'],['bulwark','skitter','skitter','skitter','spitter','spitter']];
// [name, biome, boss species, mid-boss species for stage 8 (optional)]
const CHAPTER_ROWS=[
  ['숲의 초입','forest','boss_forest_boar'],['늑대의 사냥길','forest','boss_forest_direwolf'],['고블린 야영지','forest','boss_forest_goblinchief'],['가시덤불 골짜기','forest','boss_forest_thornbeast'],['포자의 늪','forest','boss_forest_mushroomking'],
  ['오크의 초소','forest','boss_forest_orcwarlord'],['식인꽃 군락','forest','boss_forest_mandrake'],['거미 둥지','forest','boss_forest_spiderqueen'],['핏빛 수림','forest','boss_forest_bloodbear'],['세계수의 뿌리','forest','boss_special_worldtree'],
  ['화염 협곡','fire','boss_fire_drake'],['용암 강','fire','boss_fire_ifrit'],['잿빛 화산','fire','boss_fire_giant'],['불사조의 둥지','fire','boss_fire_phoenix'],['불타는 요새','fire','boss_fire_minotaur'],
  ['설원의 발자국','frost','boss_frost_mammoth','boss_frost_griffin'],['얼어붙은 호수','frost','boss_frost_serpent','boss_frost_elemental'],['눈보라 고개','frost','boss_frost_witch','boss_frost_colossus'],['빙하 협곡','frost','boss_frost_tortoise','boss_frost_yetichief'],['불과 얼음의 경계','frost','boss_special_twindragon','boss_frost_wyvern'],
  ['무너진 성문','ruins','boss_ruins_bonegiant'],['망자의 회랑','ruins','boss_ruins_ghoullord'],['박쥐 종탑','ruins','boss_ruins_vampirebat'],['사령술 제단','ruins','boss_ruins_lich'],['기사단 묘역','ruins','boss_ruins_cursedknight'],
  ['망령의 서고','ruins','boss_ruins_banshee'],['미믹의 보물고','ruins','boss_ruins_mimicking'],['봉인된 지하묘','ruins','boss_ruins_mummyking'],['왕의 근위대','ruins','boss_ruins_deathguard'],['심연의 옥좌','ruins','boss_special_abysslord'],
  ['산호초 해안','sea','boss_sea_crabking'],['침몰선의 묘지','sea','boss_sea_ghostcaptain'],['해초의 숲','sea','boss_sea_kelpwitch'],['진주 동굴','sea','boss_sea_giantclam'],['세이렌의 암초','sea','boss_sea_sirenqueen'],
  ['심해 해구 입구','sea','boss_sea_anglerfish'],['해파리 군락','sea','boss_sea_jellyfish'],['가라앉은 신전','sea','boss_sea_merpriest'],['크라켄의 소굴','sea','boss_sea_kraken'],['심연의 해저 왕좌','sea','boss_special_leviathan'],
  ['떠다니는 섬','sky','boss_sky_griffinking'],['바람의 협곡','sky','boss_sky_harpyqueen'],['구름 다리','sky','boss_sky_cloudgiant'],['깃털 신전','sky','boss_sky_crowgeneral'],['부서진 풍차섬','sky','boss_sky_windlord'],
  ['번개 첨탑','sky','boss_sky_thunderwyvern'],['폭풍의 눈','sky','boss_sky_stormelemental'],['천둥 대장간','sky','boss_sky_thundersmith'],['낙뢰의 제단','sky','boss_sky_thunderbird'],['하늘 왕좌','sky','boss_special_stormdragon'],
  ['황금 신전의 계단','divine','boss_divine_guardian'],['빛의 정원','divine','boss_divine_sphinx'],['별빛 회랑','divine','boss_divine_starknight'],['성가대의 폐허','divine','boss_divine_fallenangel'],['심판의 법정','divine','boss_divine_judge'],
  ['무너지는 하늘','divine','boss_divine_chrono'],['깨진 별의 바다','divine','boss_divine_starserpent'],['영원의 문','divine','boss_divine_gatekeeper'],['신들의 묘역','divine','boss_divine_wargod'],['태양의 옥좌','divine','boss_special_sungod'],
];
// Boss species drawn with Codex (art/monsters0106, art/monsters0107, art/monsters0118). special: every tenth chapter.
export const CHAPTER_BOSSES = {
  boss_forest_boar:{name:'붉은엄니 멧돼지',height:215},boss_forest_direwolf:{name:'회색 늑대왕',height:210},boss_forest_goblinchief:{name:'고블린 족장',height:225},
  boss_forest_thornbeast:{name:'가시덩굴 괴수',height:240},boss_forest_mushroomking:{name:'독버섯 왕',height:230},boss_forest_orcwarlord:{name:'오크 대장군',height:240},
  boss_forest_mandrake:{name:'맨드레이크 여왕',height:240},boss_forest_spiderqueen:{name:'거미 여왕',height:200},boss_forest_bloodbear:{name:'핏빛 곰',height:230},
  boss_special_worldtree:{name:'고대 세계수 엔트',height:310,special:true},
  boss_fire_drake:{name:'화염 드레이크',height:230},boss_fire_ifrit:{name:'이프리트',height:250},boss_fire_giant:{name:'용암 거인',height:260},
  boss_fire_phoenix:{name:'불사조',height:240},boss_fire_minotaur:{name:'화염 미노타우로스 왕',height:255},
  boss_frost_mammoth:{name:'설원 매머드',height:250},boss_frost_serpent:{name:'얼음 해룡',height:230},boss_frost_witch:{name:'눈보라 마녀',height:240},boss_frost_tortoise:{name:'빙하 거북',height:210},
  boss_special_twindragon:{name:'화염과 서리의 쌍두룡',height:300,special:true},
  boss_ruins_bonegiant:{name:'해골 거인',height:255},boss_ruins_ghoullord:{name:'구울 군주',height:225},boss_ruins_vampirebat:{name:'흡혈 박쥐 군주',height:235},
  boss_ruins_lich:{name:'대사령술사',height:240},boss_ruins_cursedknight:{name:'저주받은 기사단장',height:245},boss_ruins_banshee:{name:'그림자 밴시',height:235},
  boss_ruins_mimicking:{name:'거대 미믹',height:200},boss_ruins_mummyking:{name:'미라 왕',height:240},boss_ruins_deathguard:{name:'근위대장',height:245},
  boss_special_abysslord:{name:'심연의 군주',height:310,special:true},
  boss_sea_crabking:{name:'거대 집게 게왕',height:225},boss_sea_ghostcaptain:{name:'유령 선장',height:240},boss_sea_kelpwitch:{name:'해초 마녀',height:240},
  boss_sea_giantclam:{name:'진주 대왕조개',height:205},boss_sea_sirenqueen:{name:'세이렌 여왕',height:245},boss_sea_anglerfish:{name:'심해 아귀',height:225},
  boss_sea_jellyfish:{name:'거대 독해파리',height:250},boss_sea_merpriest:{name:'인어 대사제',height:245},boss_sea_kraken:{name:'크라켄',height:255},
  boss_special_leviathan:{name:'심해의 리바이어던',height:310,special:true},
  boss_sky_griffinking:{name:'그리폰 왕',height:240},boss_sky_harpyqueen:{name:'하피 여왕',height:235},boss_sky_cloudgiant:{name:'구름 거인',height:265},
  boss_sky_crowgeneral:{name:'까마귀 장군',height:240},boss_sky_windlord:{name:'바람의 정령왕',height:250},boss_sky_thunderwyvern:{name:'번개 와이번',height:240},
  boss_sky_stormelemental:{name:'폭풍의 정령',height:255},boss_sky_thundersmith:{name:'천둥 거인 대장장이',height:265},boss_sky_thunderbird:{name:'썬더버드',height:245},
  boss_special_stormdragon:{name:'천둥의 용왕',height:310,special:true},
  boss_divine_guardian:{name:'신전 수호 석상',height:255},boss_divine_sphinx:{name:'황금 스핑크스',height:235},boss_divine_starknight:{name:'성좌 기사',height:250},
  boss_divine_fallenangel:{name:'타락 천사',height:250},boss_divine_judge:{name:'심판관',height:255},boss_divine_chrono:{name:'시간의 수호자',height:250},
  boss_divine_starserpent:{name:'성좌 뱀',height:240},boss_divine_gatekeeper:{name:'문지기 거신',height:270},boss_divine_wargod:{name:'타락한 전쟁신',height:260},
  boss_special_sungod:{name:'몰락한 태양신',height:315,special:true},
};
// Ice chapters field one of these as the stage-8 mid-boss (last wave's first elite).
export const MID_BOSSES = {
  boss_frost_griffin:{name:'서리 그리폰',height:190},boss_frost_elemental:{name:'얼음 정령왕',height:195},boss_frost_colossus:{name:'수정 거신',height:200},
  boss_frost_yetichief:{name:'설인 족장',height:195},boss_frost_wyvern:{name:'서리 와이번',height:190},
};
const josa=(word,consonant,vowel)=>{const code=word.charCodeAt(word.length-1)-0xac00;return code>=0&&code<11172&&code%28?consonant:vowel;};
// Enemy stats grow 16% of the first chapter per chapter (ch.30 = ×5.64).
export const chapterMultiplier=id=>Math.round((1+(id-1)*.16)*100)/100;
// Alpha 0.133 난이도 곡선: enemy health and damage (not rewards, which keep `multiplier`) grow by `growth` every chapter
// on top of the old line and jump by `jump` at every new region. Raids keep the old scale (`raidBossHp`; raids.js has
// its own chapter scale).
// Alpha 0.134: ordinary monsters (not bosses, not in dungeons or raids) hit `mob` (2) times harder; they barely dented an auto
// battle before (1~8% of max health per stage).
export const THREAT=Object.freeze({hp:Object.freeze({growth:1.012,jump:1.12}),damage:Object.freeze({growth:1.014,jump:1.12}),mob:2});
// Region jumps stop after the sixth region, so 정예/악몽 (virtual chapters 61~180, modeChapter) only keep the per-chapter growth.
const threat=(id,t)=>Math.round(chapterMultiplier(id)*Math.pow(t.growth,id-1)*Math.pow(t.jump,Math.min(MODE_CHAPTERS/CHAPTERS_PER_THEME-1,Math.floor((id-1)/10)))*1000)/1000;
export const enemyHpScale=id=>threat(id,THREAT.hp);
export const enemyDamageScale=id=>threat(id,THREAT.damage);
// Alpha 0.139 난이도 개편 (사용자 결정): 정예/악몽 continue the curve past chapter 60 at MODE_STEP chapters per chapter —
// 정예 N장 is fought like chapter 60+N/2 (정예 60장 = chapter 90, ×2.1 health of chapter 60) and 악몽 N장 like 90+N/2
// (악몽 60장 = chapter 120, ×3.9). Enemy health, damage and boss gold follow; land, monsters and bosses stay the chapter's own.
// MODE_STEP 1 (chapter 60+N / 120+N) walled the endgame simulation at 정예 26~45장 (tools/reports/alpha0139-difficulty-endgame.txt).
export const MODE_CHAPTERS=60,MODE_STEP=.5;
export const modeChapter=(id,difficulty=0)=>{const d=Math.max(0,difficulty|0);return d?MODE_CHAPTERS+((d-1)*MODE_CHAPTERS+id)*MODE_STEP:id;};
export function modeScale(id,difficulty=0){if(!difficulty)return {hp:1,damage:1,reward:1,chapter:id};const v=modeChapter(id,difficulty);
 return {hp:enemyHpScale(v)/enemyHpScale(id),damage:enemyDamageScale(v)/enemyDamageScale(id),reward:chapterMultiplier(v)/chapterMultiplier(id),chapter:v};}
// Each chapter takes two species per role from its biome pool (pairs rotate by chapter,
// offset per role). Stages 1–8 visit all eight role combinations in an order where every
// stage changes at least two roles; stage 9 (swarm, skitters only) differs from stage 8.
const PAIRS=n=>{const out=[];for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)out.push([a,b]);const order=[];for(let i=0;i<out.length;i++)order.push(out[(i*(out.length>6?5:1)+(i%2?Math.floor(out.length/2):0))%out.length]);return [...new Map(order.concat(out).map(p=>[p.join(),p])).values()];};
const STAGE_ORDER=[0,3,5,6,1,2,4,7];
function chapterLineups(biome,index){
  const pairs=ROLES.map((role,r)=>{const pool=biome.pool[role],list=PAIRS(pool.length),pair=list[(index+r*2)%list.length];return pair.map(i=>pool[i]);});
  const stages=STAGE_ORDER.map(bits=>Object.freeze(Object.fromEntries(ROLES.map((role,r)=>[role,pairs[r][(bits>>r)&1]]))));
  stages.push(Object.freeze({...stages[7],skitter:pairs[0][1-((STAGE_ORDER[7])&1)]}));
  return {roster:pairs.flat(),stages};
}
const biomeIndex={};
export const CHAPTERS = CHAPTER_ROWS.map(([name,biomeKey,bossSpecies,midBoss=null],i)=>{
  const id=i+1,theme=THEMES[Math.floor(i/CHAPTERS_PER_THEME)],biome=BIOMES[biomeKey],number=i%CHAPTERS_PER_THEME+1,finale=number===CHAPTERS_PER_THEME;
  const boss=CHAPTER_BOSSES[bossSpecies],multiplier=chapterMultiplier(id),index=biomeIndex[biomeKey]=(biomeIndex[biomeKey]??-1)+1,{roster,stages}=chapterLineups(biome,index);
  return {id,theme:theme.id,key:biome.key,biome:biomeKey,region:theme.name,name,number,finale,special:!!boss.special,environment:'c'+id,effects:biome.effects,props:biome.props,bossRule:biome.bossRule,
    subtitle:biome.subtitle+(finale?` 지역의 끝에서 특수 보스 ${boss.name}${josa(boss.name,'이','가')} 기다린다.`:` 열 스테이지 끝에서 ${boss.name}${josa(boss.name,'을','를')} 사냥해.`),
    multiplier,hpScale:enemyHpScale(id),damageScale:enemyDamageScale(id),bossHp:Math.round(780*enemyHpScale(id)*theme.bossScale*(finale?1.15:1)),raidBossHp:Math.round(780*multiplier*theme.bossScale*(finale?1.15:1)),reward:Math.round(90*multiplier),
    color:biome.color,shotColor:biome.shotColor,pathColor:biome.pathColor,bossName:boss.name,bossSpecies,midBoss,midBossName:midBoss?MID_BOSSES[midBoss].name:null,set:CHAPTER_SETS[id],bossPosition:biome.bossPosition,bossCycle:biome.bossCycle,
    roster:Object.freeze(roster),stages:Object.freeze(stages),encounters:biome.encounters,formations:FORMATIONS,caches:biome.caches,tactic:biome.tactic};
});
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
// Alpha 0.107 fire and dark species (art/monsters0107). They join a biome pool and
// appear on the stages chosen by chapterLineups; unlockStage is no longer used for pools.
Object.assign(MONSTERS,{
  fire_salamander:{name:'불도마뱀',role:'skitter',height:72,speed:135,chargeEvery:3,chargeSpeed:420,chargeDuration:.24},
  fire_hellhound:{name:'지옥 사냥개',role:'skitter',height:90,speed:150,radius:52,attackRange:140,windup:.6,attackCycle:['charge','slam'],chargeSpeed:450,chargeDuration:.22,guardMax:0,hpScale:.9,damageScale:1,attackInterval:1.05,tactic:'불꽃을 남기며 짧게 돌진'},
  fire_imp:{name:'불꽃 임프',role:'skitter',height:74,speed:160,radius:44,attackRange:140,windup:.6,attackCycle:['charge'],chargeSpeed:430,chargeDuration:.2,guardMax:0,hpScale:.7,damageScale:.85,attackInterval:1.1,tactic:'빠르게 날아들어 할퀴기'},
  fire_phoenixling:{name:'어린 불새',role:'skitter',height:80,speed:140,chargeEvery:3,chargeSpeed:440,chargeDuration:.22,hpScale:.85},
  fire_spirit:{name:'불의 정령',role:'spitter',height:100,speed:75,attackRange:480,windup:1,shots:3,shotSpeed:270,shotSpread:.16,shotColor:'#ffb04a',projectileStyle:'spore',standoffMin:150,standoffMax:280,attackInterval:2.7,tactic:'거리를 두고 세 갈래 불덩이'},
  fire_cultist:{name:'화염 사교도',role:'spitter',height:106,shots:2,shotSpeed:320,shotColor:'#ff7a3a'},
  fire_slime:{name:'용암 슬라임',role:'spitter',height:78,speed:55,attackRange:460,windup:1,shots:4,shotSpeed:240,shotSpread:.22,shotColor:'#ff8a2a',projectileStyle:'spore',attackInterval:3,damageScale:.8,tactic:'튀어 오르며 네 갈래 용암 덩이'},
  fire_beetle:{name:'화염 딱정벌레',role:'spitter',height:84,shots:1,shotSpeed:380,shotColor:'#ff6a2a'},
  fire_golem:{name:'용암 골렘',role:'bulwark',height:160,speed:62,radius:110,attackRange:150,windup:.95},
  fire_crab:{name:'흑요석 게',role:'bulwark',height:110,guardMax:120,speed:70},
  fire_salamanderknight:{name:'샐러맨더 전사',role:'bulwark',height:146,guardMax:110},
  fire_rhino:{name:'용암 코뿔소',role:'bulwark',height:140,speed:62,radius:105,attackRange:150,windup:1,attackCycle:['charge','slam'],chargeSpeed:360,chargeDuration:.32,guardMax:0,hpScale:1.25,attackInterval:1.8,tactic:'불붙은 뿔 돌진과 짓밟기'},
  dark_imp:{name:'그림자 임프',role:'skitter',height:74,speed:160,radius:44,attackRange:140,windup:.6,attackCycle:['charge'],chargeSpeed:430,chargeDuration:.2,guardMax:0,hpScale:.7,damageScale:.85,attackInterval:1.1,tactic:'그림자 속에서 튀어나와 할퀴기'},
  dark_spider:{name:'그림자 거미',role:'skitter',height:76,speed:145,radius:52,attackRange:125,windup:.65,attackCycle:['charge','slam'],chargeSpeed:390,chargeDuration:.25,guardMax:0,hpScale:.85,damageScale:.9,attackInterval:1.05,tactic:'짧은 도약 뒤 독니 공격'},
  dark_succubus:{name:'서큐버스',role:'spitter',height:110,speed:85,attackRange:490,windup:.95,shots:2,shotSpeed:270,shotSpread:.1,shotColor:'#e08cf5',projectileStyle:'spectral',standoffMin:160,standoffMax:300,attackInterval:2.5,tactic:'거리를 벌리며 두 갈래 매혹탄'},
  dark_priest:{name:'어둠 사제',role:'spitter',height:108,shots:3,shotSpeed:300,shotColor:'#b07af0'},
  dark_demon:{name:'지옥 악마 전사',role:'bulwark',height:160,guardMax:125,speed:72},
  dark_voidgolem:{name:'공허 골렘',role:'bulwark',height:166,speed:58,radius:115,attackRange:160,windup:1.05,attackCycle:['slam','charge'],chargeSpeed:300,chargeDuration:.34,guardMax:0,hpScale:1.25,attackInterval:1.8,tactic:'공허 주먹 강타와 육중한 돌진'},
});
// Alpha 0.118 sea, sky and divine species (art/monsters0118).
Object.assign(MONSTERS,{
  sea_piranha:{name:'이빨 피라냐',role:'skitter',height:70,speed:165,radius:44,attackRange:140,windup:.55,attackCycle:['charge'],chargeSpeed:440,chargeDuration:.2,guardMax:0,hpScale:.7,damageScale:.85,attackInterval:1.05,tactic:'떼 지어 물살을 타고 물어뜯는 돌진'},
  sea_eel:{name:'전기 뱀장어',role:'skitter',height:78,speed:135,chargeEvery:3,chargeSpeed:440,chargeDuration:.24},
  sea_shrimp:{name:'갑옷 새우',role:'skitter',height:80,speed:145,radius:50,attackRange:130,windup:.6,attackCycle:['charge','slam'],chargeSpeed:400,chargeDuration:.22,guardMax:0,hpScale:.9,damageScale:.95,attackInterval:1.05,tactic:'튀어 오르는 돌진 뒤 집게 찌르기'},
  sea_crab:{name:'해적 게',role:'skitter',height:82,speed:120,chargeEvery:3,chargeSpeed:400,chargeDuration:.26,hpScale:1.05},
  sea_mermaid:{name:'인어 궁수',role:'spitter',height:108,shots:2,shotSpeed:340,shotColor:'#7fe6f5'},
  sea_puffer:{name:'가시 복어',role:'spitter',height:84,speed:50,attackRange:440,windup:1,shots:5,shotSpeed:240,shotSpread:.24,shotColor:'#e8d77a',projectileStyle:'spore',attackInterval:3.1,damageScale:.75,tactic:'몸을 부풀려 다섯 갈래 독가시'},
  sea_jelly:{name:'독 해파리',role:'spitter',height:100,speed:70,attackRange:490,windup:.95,shots:2,shotSpeed:260,shotSpread:.1,shotColor:'#d39cf5',projectileStyle:'spectral',standoffMin:150,standoffMax:290,attackInterval:2.6,tactic:'떠다니며 거리를 두고 두 갈래 독방울'},
  sea_coralwisp:{name:'산호 정령',role:'spitter',height:96,speed:65,attackRange:500,windup:1,shots:4,shotSpeed:275,shotSpread:.22,shotColor:'#ff9ab0',projectileStyle:'ice',attackInterval:2.9,tactic:'부채꼴로 퍼지는 네 갈래 산호 조각'},
  sea_crabknight:{name:'게 기사',role:'bulwark',height:140,guardMax:125,speed:66},
  sea_turtle:{name:'바다거북 전사',role:'bulwark',height:150,speed:58,radius:110,attackRange:155,windup:1.05,attackCycle:['slam','charge'],chargeSpeed:300,chargeDuration:.34,guardMax:0,hpScale:1.3,attackInterval:1.8,tactic:'등껍질 돌진과 묵직한 내려치기'},
  sea_sharkman:{name:'상어인 투사',role:'bulwark',height:156,guardMax:110,speed:74},
  sea_coralgolem:{name:'산호 골렘',role:'bulwark',height:164,speed:60,radius:112,attackRange:150,windup:.95},
  sky_harpy:{name:'하피',role:'skitter',height:90,speed:170,radius:48,attackRange:150,windup:.6,attackCycle:['charge','slam'],chargeSpeed:470,chargeDuration:.2,guardMax:0,hpScale:.85,damageScale:1,attackInterval:1,tactic:'높이 날아올랐다가 발톱 급강하'},
  sky_hawk:{name:'폭풍 매',role:'skitter',height:78,speed:150,chargeEvery:3,chargeSpeed:460,chargeDuration:.22,hpScale:.85},
  sky_cloudwolf:{name:'구름 늑대',role:'skitter',height:90,speed:130,chargeEvery:3,chargeSpeed:420,chargeDuration:.24},
  sky_sprite:{name:'바람 요정',role:'skitter',height:72,speed:170,radius:44,attackRange:140,windup:.55,attackCycle:['charge'],chargeSpeed:450,chargeDuration:.2,guardMax:0,hpScale:.7,damageScale:.85,attackInterval:1.05,tactic:'돌풍을 타고 날아드는 할퀴기'},
  sky_stormmage:{name:'폭풍 마법사',role:'spitter',height:110,shots:3,shotSpeed:330,shotColor:'#a8c4ff'},
  sky_archer:{name:'깃털 궁수',role:'spitter',height:104,shots:1,shotSpeed:400},
  sky_orb:{name:'번개 구슬 정령',role:'spitter',height:92,speed:80,attackRange:500,windup:.9,shots:3,shotSpeed:290,shotSpread:.14,shotColor:'#bfe0ff',projectileStyle:'spectral',standoffMin:160,standoffMax:300,attackInterval:2.5,tactic:'거리를 벌리며 세 갈래 번개 구슬'},
  sky_thunderjelly:{name:'천둥 구름 해파리',role:'spitter',height:100,speed:55,attackRange:460,windup:1,shots:4,shotSpeed:250,shotSpread:.22,shotColor:'#d8e4ff',projectileStyle:'ice',attackInterval:3,damageScale:.85,tactic:'느리게 떠다니며 네 갈래 뇌운 방울'},
  sky_rockgolem:{name:'부유석 골렘',role:'bulwark',height:164,speed:58,radius:115,attackRange:160,windup:1.05,attackCycle:['slam','charge'],chargeSpeed:300,chargeDuration:.34,guardMax:0,hpScale:1.3,attackInterval:1.8,tactic:'떠오른 바위 주먹 강타와 돌진'},
  sky_griffinrider:{name:'그리폰 기수',role:'bulwark',height:150,speed:68,radius:105,attackRange:150,windup:1,attackCycle:['charge','slam'],chargeSpeed:370,chargeDuration:.32,guardMax:0,hpScale:1.25,attackInterval:1.8,tactic:'창을 앞세운 비행 돌격과 짓밟기'},
  sky_stormknight:{name:'폭풍 기사',role:'bulwark',height:150,guardMax:125,speed:70},
  sky_cloudturtle:{name:'구름 거북',role:'bulwark',height:140,speed:62,radius:110,attackRange:150},
  divine_cherub:{name:'천사 병사',role:'skitter',height:88,speed:140,chargeEvery:3,chargeSpeed:440,chargeDuration:.22},
  divine_hound:{name:'황금 수호견',role:'skitter',height:90,speed:150,radius:52,attackRange:140,windup:.6,attackCycle:['charge','slam'],chargeSpeed:450,chargeDuration:.22,guardMax:0,hpScale:.95,damageScale:1,attackInterval:1.05,tactic:'빛을 남기며 짧게 돌진해 물어뜯기'},
  divine_lion:{name:'빛의 사자',role:'skitter',height:96,speed:135,chargeEvery:3,chargeSpeed:430,chargeDuration:.26,hpScale:1.1},
  divine_wraith:{name:'시간의 망령',role:'skitter',height:86,speed:165,radius:46,attackRange:145,windup:.55,attackCycle:['charge'],chargeSpeed:450,chargeDuration:.2,guardMax:0,hpScale:.75,damageScale:.9,attackInterval:1.05,tactic:'시간을 건너뛰듯 순식간에 다가와 베기'},
  divine_priest:{name:'빛의 사제',role:'spitter',height:108,shots:3,shotSpeed:310,shotColor:'#ffe08a'},
  divine_starmage:{name:'성좌 마법사',role:'spitter',height:110,speed:70,attackRange:480,windup:1,shots:4,shotSpeed:270,shotSpread:.2,shotColor:'#c8b8ff',projectileStyle:'ice',attackInterval:2.8,tactic:'별자리 모양의 네 갈래 별빛탄'},
  divine_archer:{name:'천상 궁수',role:'spitter',height:106,shots:2,shotSpeed:360,shotColor:'#fff0b0'},
  divine_eye:{name:'심판의 눈',role:'spitter',height:100,speed:80,attackRange:500,windup:.95,shots:3,shotSpeed:265,shotSpread:.14,shotColor:'#ffd36a',projectileStyle:'spectral',standoffMin:160,standoffMax:300,attackInterval:2.6,tactic:'거리를 벌리며 세 갈래 심판의 시선'},
  divine_golem:{name:'빛의 골렘',role:'bulwark',height:166,speed:60,radius:112,attackRange:150,windup:.95},
  divine_paladin:{name:'타락 성기사',role:'bulwark',height:152,guardMax:125,speed:70},
  divine_statue:{name:'날개 석상',role:'bulwark',height:150,speed:64,radius:105,attackRange:150,windup:1,attackCycle:['slam','charge'],chargeSpeed:340,chargeDuration:.3,guardMax:0,hpScale:1.25,attackInterval:1.8,tactic:'날개를 펼친 활강 돌진과 석상 강타'},
  divine_clockwork:{name:'시계 장치 거신',role:'bulwark',height:168,speed:56,radius:115,attackRange:160,windup:1.05,attackCycle:['slam','charge'],chargeSpeed:290,chargeDuration:.34,guardMax:0,hpScale:1.3,attackInterval:1.9,tactic:'톱니 주먹 내려치기와 육중한 돌진'},
});
for(const [id,mid] of Object.entries(MID_BOSSES))MONSTERS[id]={name:mid.name,role:'bulwark',height:mid.height,guardMax:0,midBoss:true};
for(const [id,boss] of Object.entries(CHAPTER_BOSSES))MONSTERS[id]={name:boss.name,role:'bulwark',height:boss.height,...(boss.special?{special:true}:{})};
// Alpha 0.123 raid bosses (raids.js); not part of any chapter, so their atlases load only with a raid region.
export const RAID_BOSSES={raid_colossus:{name:'강철 거신',height:300},raid_queen:{name:'군단의 여왕',height:280},raid_judge:{name:'황혼의 심판자',height:290},raid_nightmare:{name:'악몽의 군주',height:300}};
for(const [id,boss] of Object.entries(RAID_BOSSES))MONSTERS[id]={name:boss.name,role:'bulwark',height:boss.height,raid:true};
// Only role-compatible, unlocked chapter identities can enter a normal wave.
export function chapterMonsterPool(chapterId,stage,role){
  const stages=CHAPTERS[chapterId-1]?.stages;if(!stages)return [];const species=stages[Math.min(stages.length,Math.max(1,stage))-1][role];return [species];
}
export const EQUIPMENT_ART = [
  {id:'forest_blade',tier:1,slot:'weapon',name:'붉은 잎 검'}, {id:'forest_fang',tier:1,slot:'weapon',name:'오크 송곳니 검'},
  {id:'forest_armor',tier:1,slot:'armor',name:'숲지기 흉갑'}, {id:'forest_charm',tier:1,slot:'charm',name:'가시 호박 부적'},
  {id:'ruins_blade',tier:2,slot:'weapon',name:'묘지의 은검'}, {id:'ruins_rune',tier:2,slot:'weapon',name:'망령의 룬검'},
  {id:'ruins_armor',tier:2,slot:'armor',name:'죽음의 기사 흉갑'}, {id:'ruins_charm',tier:2,slot:'charm',name:'왕의 봉인'},
  {id:'frost_blade',tier:3,slot:'weapon',name:'빙결 수정검'}, {id:'frost_fang',tier:3,slot:'weapon',name:'서리 송곳니 검'},
  {id:'frost_armor',tier:3,slot:'armor',name:'빙하 판금 흉갑'}, {id:'frost_charm',tier:3,slot:'charm',name:'눈꽃 룬'},
];
// Region set art (Alpha 0.108): two weapons and four armor parts per set, all in the equipment atlas.
const PART_NAMES={helmet:'투구',armor:'흉갑',pants:'각반',boots:'장화'};
export const SET_ART = Object.values(EQUIPMENT_SETS).flatMap(set=>SET_SLOTS.flatMap(slot=>(slot==='weapon'?[0,1]:[0]).map(variant=>({id:setArtId(set.id,slot,variant),tier:set.tier,slot:equipmentFamily(slot),set:set.id,
  name:set.name+' '+(slot==='weapon'?(variant?'대검':'장검'):PART_NAMES[slot])}))));
// Accessory art (Alpha 0.122): earrings and Lilian seals for every region, necklaces for regions 4-6
// (regions 1-3 keep their charm art). Frames sit on the equipment-accessories-v0122 page (manifest setFrames).
const ACCESSORY_REGIONS=['붉은 숲','폐성','서리','해류','뇌운','성휘'];
export const ACCESSORY_ART = ACCESSORY_REGIONS.flatMap((name,i)=>[
  ...(i>=3?[{id:`acc_t${i+1}_charm`,tier:i+1,slot:'charm',name:name+' 목걸이'}]:[]),
  {id:`acc_t${i+1}_earring`,tier:i+1,slot:'charm',name:name+' 귀걸이'},{id:`acc_t${i+1}_seal`,tier:i+1,slot:'charm',name:name+' 인장'}]);
// Region 1-3 dungeon accessory art (Alpha 0.140, equipment-accessories-v0140 page): necklaces for regions 1-3 and
// earrings for the regions 2-3 the 0.122 earrings got swapped with (불과 얼음 / 어둠의 심연).
export const REGION_ACCESSORY_ART = [
  {id:'acc_t1_charm',tier:1,slot:'charm',name:'붉은 숲 목걸이'},{id:'acc_t2_charm',tier:2,slot:'charm',name:'불과 얼음 목걸이'},
  {id:'acc_t3_charm',tier:3,slot:'charm',name:'어둠의 심연 목걸이'},{id:'acc_r2_earring',tier:2,slot:'charm',name:'불과 얼음 귀걸이'},
  {id:'acc_r3_earring',tier:3,slot:'charm',name:'어둠의 심연 귀걸이'}];
// Boss rush seals (Alpha 0.136): one art per seal effect on the equipment-seals-v0136 page; a seal shows it at any tier.
export const SEAL_ART = SEAL_EFFECTS.map(e=>({id:sealArtId(e.id),tier:1,slot:'charm',name:'리리안의 '+e.name+' 인장',seal:true}));
export const ALL_EQUIPMENT_ART = [...EQUIPMENT_ART,...SET_ART,...ACCESSORY_ART,...REGION_ACCESSORY_ART,...SEAL_ART];
export function equipmentArt(item){
  // Ancients keep their family's base art, whose tier differs from the region tier for tiers 2/3 (Alpha 0.112).
  const explicit=ALL_EQUIPMENT_ART.find(a=>a.id===item?.artId&&a.slot===equipmentFamily(item.slot)&&(a.tier===item.tier||item.ancient||item.rarity===5||a.seal&&!!item.seal));
  return explicit??EQUIPMENT_ART.find(a=>a.slot===equipmentFamily(item?.slot??'weapon')&&a.tier===(item?.tier??1));
}
for(const biome of Object.values(BIOMES)){
  biome.route=[{x:350,y:1160},...biome.encounters.map(([x,y])=>({x,y})),biome.bossPosition];
  for(const rows of [biome.encounters,biome.caches]){rows.forEach(Object.freeze);Object.freeze(rows);}
  Object.values(biome.pool).forEach(Object.freeze);Object.freeze(biome.pool);biome.route.forEach(Object.freeze);Object.freeze(biome.route);Object.freeze(biome.bossCycle);Object.freeze(biome.bossPosition);Object.freeze(biome);
}
FORMATIONS.forEach(Object.freeze);Object.freeze(FORMATIONS);Object.freeze(BIOMES);THEMES.forEach(Object.freeze);
for(const chapter of CHAPTERS){chapter.route=BIOMES[chapter.biome].route;Object.freeze(chapter);}
Object.values(CHAPTER_BOSSES).forEach(Object.freeze);Object.freeze(CHAPTER_BOSSES);Object.values(MID_BOSSES).forEach(Object.freeze);Object.freeze(MID_BOSSES);Object.freeze(THEMES);Object.freeze(CHAPTERS);Object.values(MONSTERS).forEach(m=>{if(m.attackCycle)Object.freeze(m.attackCycle);Object.freeze(m);});Object.freeze(MONSTERS);EQUIPMENT_ART.forEach(Object.freeze);Object.freeze(EQUIPMENT_ART);SET_ART.forEach(Object.freeze);Object.freeze(SET_ART);ACCESSORY_ART.forEach(Object.freeze);Object.freeze(ACCESSORY_ART);Object.freeze(ALL_EQUIPMENT_ART);
