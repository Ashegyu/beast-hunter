// Authored recipes, never loaded from save fields. Alpha 0.112 numbering follows the regions:
// ancient-1 forest, ancient-2 frost (불과 얼음의 땅), ancient-3 ruined castle/abyss (어둠의 심연);
// Alpha 0.119 adds ancient-4 sea (가라앉은 왕국), ancient-5 sky (폭풍의 하늘섬), ancient-6 divine (황혼의 신역).
// Numbers are fractions of attack/max HP.
// Alpha 0.110: every trigger fires under auto combat (파쇄 → skill, 완벽 반격 → crit, 정지 → kill) and the
// fifteen 0.97 parts have their own powers. fury/haste are timed buffs, invuln seconds, cdr skill cooldown seconds,
// execute the HP fraction below which ordinary (non-boss) enemies in radius die.
const regions=[
 [
  {id:'ancient-1-weapon-1',index:0,name:'세계수의 뿌리',trigger:'finisher',cooldown:4,damage:.45,chill:2.2,push:18,radius:190,cone:true},
  {id:'ancient-1-weapon-2',index:1,name:'가시 폭우',trigger:'skill',cooldown:5,shots:3,damage:.4,bleed:3,cost:8,radius:270},
  {id:'ancient-1-weapon-3',index:2,name:'수호령의 반월',trigger:'normal',cooldown:6,damage:.2,heal:.04,radius:120},
  {id:'ancient-1-weapon-4',index:3,name:'핏빛 종자',trigger:'skill',cooldown:6,ticks:3,damage:.18,heal:.025,radius:140,center:'target'},
  {id:'ancient-1-weapon-5',index:4,name:'수액의 약속',trigger:'finisher',cooldown:5,stamina:18,shield:.06},
  {id:'ancient-1-weapon-6',index:5,name:'숲의 속삭임',trigger:'normal',cooldown:4,shots:2,damage:.28,chill:1.3,radius:250},
  {id:'ancient-1-weapon-8',index:6,name:'균사의 장막',trigger:'crit',cooldown:5,ticks:4,damage:.2,chill:.5,radius:160,center:'target'},
  {id:'ancient-1-weapon-9',index:7,name:'줄기의 회전',trigger:'finisher',cooldown:5,damage:.5,push:65,dashRefund:.7,radius:210},
  {id:'ancient-1-armor-1',index:8,name:'회피의 떡갈나무',trigger:'dash',cooldown:8,shield:.12,heal:.02},
  {id:'ancient-1-armor-2',index:9,name:'뿔의 역습',trigger:'hurt',cooldown:4,damage:.4,push:55,radius:170},
  {id:'ancient-1-armor-3',index:10,name:'균류의 숨결',trigger:'kill',cooldown:2,heal:.04,stamina:9,shield:.02},
  {id:'ancient-1-armor-4',index:11,name:'가시덤불 방패',trigger:'perfect',cooldown:5,ticks:3,damage:.2,bleed:3,radius:170},
  {id:'ancient-1-armor-5',index:12,name:'낙엽의 안식',trigger:'lowHp',cooldown:12,heal:.1,push:70,chill:1,radius:150},
  {id:'ancient-1-armor-6',index:13,name:'뿌리의 덫',trigger:'dash',cooldown:6,ticks:3,chill:1,damage:.1,radius:135},
  {id:'ancient-1-charm-1',index:14,name:'생명의 씨앗',trigger:'pickup',cooldown:4,heal:.06,shield:.04},
  {id:'ancient-1-charm-2',index:15,name:'달빛의 잎',trigger:'finisher',cooldown:4,shots:2,damage:.32,stamina:12,radius:230},
  {id:'ancient-1-charm-3',index:16,name:'추격의 새싹',trigger:'skill',cooldown:4,cdr:.6,heal:.025},
  {id:'ancient-1-charm-4',index:17,name:'바람의 고리',trigger:'dash',cooldown:5,stamina:14,push:45,damage:.15,radius:120},
  {id:'ancient-1-charm-5',index:18,name:'숲의 새벽',trigger:'periodic',cooldown:9,heal:.02,ticks:3,damage:.12,radius:150},
  {id:'ancient-1-charm-6',index:19,name:'심록의 심장',trigger:'normal',cooldown:5,bleed:4,shield:.03,radius:105},
  {id:'ancient-1-helmet-1',index:60,name:'숲지기의 혜안',trigger:'crit',cooldown:6,fury:.15,furyTime:4},
  {id:'ancient-1-pants-1',index:61,name:'덩굴 질주',trigger:'dash',cooldown:6,haste:.2,hasteTime:4,stamina:10},
  {id:'ancient-1-boots-1',index:62,name:'사냥꾼의 발자국',trigger:'kill',cooldown:3,haste:.12,hasteTime:3,heal:.015},
  {id:'ancient-1-earring-1',index:63,name:'바람의 속삭임',trigger:'skill',cooldown:6,cdr:1.5,shots:2,damage:.25,radius:260},
  {id:'ancient-1-special-1',index:64,name:'적월의 각성',trigger:'periodic',cooldown:12,fury:.2,furyTime:5,damage:.3,radius:200},
 ],
 [
  {id:'ancient-3-weapon-1',index:20,name:'망자의 행렬',trigger:'finisher',cooldown:5,shots:4,damage:.3,push:20,radius:290},
  {id:'ancient-3-weapon-2',index:21,name:'무덤의 종소리',trigger:'skill',cooldown:6,damage:.55,chill:1.1,stamina:7,radius:240},
  {id:'ancient-3-weapon-3',index:22,name:'관의 봉인',trigger:'normal',cooldown:5,ticks:2,damage:.23,chill:1.5,radius:110,center:'target'},
  {id:'ancient-3-weapon-4',index:23,name:'장례의 맹세',trigger:'skill',cooldown:5,damage:.65,heal:.06,hpCost:.035,radius:160,cone:true},
  {id:'ancient-3-weapon-5',index:24,name:'검은 깃의 잔향',trigger:'crit',cooldown:5,shots:3,damage:.5,bleed:2,radius:310},
  {id:'ancient-3-weapon-6',index:25,name:'왕좌의 낙인',trigger:'finisher',cooldown:6,ticks:4,damage:.17,push:25,radius:175,center:'target'},
  {id:'ancient-3-weapon-8',index:26,name:'은빛 초승달',trigger:'normal',cooldown:4,shots:1,damage:.5,heal:.025,radius:300},
  {id:'ancient-3-weapon-9',index:27,name:'사슬의 선고',trigger:'skill',cooldown:5,damage:.45,bleed:5,cdr:.5,radius:180},
  {id:'ancient-3-armor-1',index:28,name:'성당의 안식',trigger:'kill',cooldown:3,shield:.1,heal:.025,stamina:5},
  {id:'ancient-3-armor-2',index:29,name:'귀환의 쇠사슬',trigger:'dash',cooldown:6,damage:.25,stamina:16,radius:160,center:'target'},
  {id:'ancient-3-armor-3',index:30,name:'왕의 반격',trigger:'hurt',cooldown:5,shots:3,damage:.3,shield:.05,radius:240},
  {id:'ancient-3-armor-4',index:31,name:'까마귀의 장막',trigger:'perfect',cooldown:6,ticks:4,damage:.15,chill:.8,radius:185},
  {id:'ancient-3-armor-5',index:32,name:'유언의 등불',trigger:'lowHp',cooldown:14,heal:.12,shield:.08,hpCost:.02},
  {id:'ancient-3-armor-6',index:33,name:'장례의 바람',trigger:'dash',cooldown:7,push:90,chill:1.5,radius:200},
  {id:'ancient-3-charm-1',index:34,name:'영혼의 서약',trigger:'pickup',cooldown:4,stamina:20,cdr:1.2},
  {id:'ancient-3-charm-2',index:35,name:'귀향의 종',trigger:'skill',cooldown:5,shield:.08,dashRefund:1.2},
  {id:'ancient-3-charm-3',index:36,name:'깃털의 역류',trigger:'finisher',cooldown:5,shots:3,damage:.2,heal:.03,radius:230},
  {id:'ancient-3-charm-4',index:37,name:'모래시계의 거래',trigger:'periodic',cooldown:8,stamina:22,cdr:.8,hpCost:.025},
  {id:'ancient-3-charm-5',index:38,name:'묘비의 봉헌',trigger:'normal',cooldown:6,bleed:2,heal:.035,radius:140},
  {id:'ancient-3-charm-6',index:39,name:'달의 장송곡',trigger:'perfect',cooldown:6,damage:.35,stamina:18,push:40,radius:230},
  {id:'ancient-3-helmet-1',index:65,name:'망자의 시선',trigger:'kill',cooldown:4,execute:.12,radius:200},
  {id:'ancient-3-pants-1',index:66,name:'쇠사슬 행진',trigger:'hurt',cooldown:8,invuln:1.2,push:60,radius:160},
  {id:'ancient-3-boots-1',index:67,name:'유령 발걸음',trigger:'dash',cooldown:7,invuln:.8,damage:.3,radius:150},
  {id:'ancient-3-earring-1',index:68,name:'장송의 메아리',trigger:'crit',cooldown:5,shots:3,damage:.3,bleed:2,radius:280},
  {id:'ancient-3-special-1',index:69,name:'망령의 계약',trigger:'skill',cooldown:8,fury:.25,furyTime:4,hpCost:.03},
 ],
 [
  {id:'ancient-2-weapon-1',index:40,name:'삼중 빙창',trigger:'skill',cooldown:5,shots:3,damage:.45,chill:2,radius:320},
  {id:'ancient-2-weapon-2',index:41,name:'왕좌의 눈꽃',trigger:'finisher',cooldown:5,damage:.5,chill:2.5,push:30,radius:240},
  {id:'ancient-2-weapon-3',index:42,name:'얼음의 굴절',trigger:'normal',cooldown:4,shots:2,damage:.35,push:15,radius:270},
  {id:'ancient-2-weapon-4',index:43,name:'결빙의 대가',trigger:'skill',cooldown:4,ticks:3,damage:.25,chill:1.2,cost:12,radius:200,center:'target'},
  {id:'ancient-2-weapon-5',index:44,name:'극광의 절단',trigger:'crit',cooldown:5,damage:.75,bleed:3,stamina:15,radius:220,cone:true},
  {id:'ancient-2-weapon-6',index:45,name:'혜성의 궤도',trigger:'finisher',cooldown:6,shots:4,damage:.25,chill:1.2,cdr:.7,radius:320},
  {id:'ancient-2-weapon-8',index:46,name:'빙룡의 숨결',trigger:'normal',cooldown:5,damage:.3,chill:2.8,shield:.04,radius:180,cone:true},
  {id:'ancient-2-weapon-9',index:47,name:'눈보라의 나선',trigger:'skill',cooldown:7,ticks:5,damage:.12,push:35,radius:210},
  {id:'ancient-2-armor-1',index:48,name:'빙하의 거울',trigger:'hurt',cooldown:5,damage:.25,chill:2,shield:.09,radius:170},
  {id:'ancient-2-armor-2',index:49,name:'눈꽃의 재생',trigger:'kill',cooldown:3,heal:.05,chill:1,radius:145},
  {id:'ancient-2-armor-3',index:50,name:'고드름의 응징',trigger:'perfect',cooldown:5,shots:4,damage:.3,chill:1.8,radius:285},
  {id:'ancient-2-armor-4',index:51,name:'극광의 잔상',trigger:'dash',cooldown:6,ticks:3,damage:.18,heal:.015,radius:155},
  {id:'ancient-2-armor-5',index:52,name:'용린의 각성',trigger:'lowHp',cooldown:15,shield:.18,chill:2.2,stamina:15,radius:185},
  {id:'ancient-2-armor-6',index:53,name:'별핵의 수호',trigger:'dash',cooldown:7,shield:.1,cdr:.9,push:40,radius:140},
  {id:'ancient-2-charm-1',index:54,name:'눈꽃의 공명',trigger:'finisher',cooldown:5,chill:1.3,stamina:16,heal:.025,radius:165},
  {id:'ancient-2-charm-2',index:55,name:'쌍정의 축전',trigger:'skill',cooldown:5,ticks:2,damage:.2,shield:.06,radius:120},
  {id:'ancient-2-charm-3',index:56,name:'극광의 순환',trigger:'periodic',cooldown:10,shots:2,damage:.2,heal:.04,radius:300},
  {id:'ancient-2-charm-4',index:57,name:'빙룡의 이빨',trigger:'normal',cooldown:6,bleed:3,chill:1.5,stamina:8,radius:115},
  {id:'ancient-2-charm-5',index:58,name:'별자리의 길',trigger:'perfect',cooldown:6,dashRefund:1.5,cdr:1.3,shield:.07},
  {id:'ancient-2-charm-6',index:59,name:'설풍의 등불',trigger:'pickup',cooldown:4,chill:1.6,heal:.04,push:50,radius:180},
  {id:'ancient-2-helmet-1',index:70,name:'서리왕의 왕관',trigger:'periodic',cooldown:9,damage:.25,chill:2,cdr:1,radius:260},
  {id:'ancient-2-pants-1',index:71,name:'빙하의 걸음',trigger:'dash',cooldown:6,ticks:3,damage:.2,chill:1.2,haste:.15,hasteTime:3,radius:170},
  {id:'ancient-2-boots-1',index:72,name:'눈보라 질주',trigger:'kill',cooldown:3,cdr:.8,stamina:8},
  {id:'ancient-2-earring-1',index:73,name:'극광의 조율',trigger:'crit',cooldown:4,haste:.2,hasteTime:4,damage:.25,radius:140},
  {id:'ancient-2-special-1',index:74,name:'서리 인장의 심판',trigger:'finisher',cooldown:6,damage:.4,execute:.18,radius:240},
 ],
 // Alpha 0.119 regions 4-6 (sea, sky, divine): each row follows the same slot of region 2, 1 and 3; the sky turns chill
 // into haste or knockback and the sanctum turns it into a shield. Alpha 0.120: strength comes from the tier factor
 // (loot.js ANCIENT_TIER_POWER), so these rows keep their source magnitudes.
 [
  {id:'ancient-4-weapon-1',index:75,name:'해류의 일격',trigger:'skill',cooldown:5,shots:3,damage:.45,chill:2,radius:330},
  {id:'ancient-4-weapon-2',index:76,name:'산호 파편',trigger:'finisher',cooldown:5,damage:.5,chill:2.5,push:30,radius:250},
  {id:'ancient-4-weapon-3',index:77,name:'아귀의 유혹',trigger:'normal',cooldown:4,shots:2,damage:.35,push:15,radius:280},
  {id:'ancient-4-weapon-4',index:78,name:'해일 가르기',trigger:'skill',cooldown:4,ticks:3,damage:.25,chill:1.2,cost:12,radius:210,center:'target'},
  {id:'ancient-4-weapon-5',index:79,name:'진주 섬광',trigger:'crit',cooldown:5,damage:.75,bleed:3,stamina:15,radius:230,cone:true},
  {id:'ancient-4-weapon-6',index:80,name:'촉수 결박',trigger:'finisher',cooldown:6,shots:4,damage:.25,chill:1.2,cdr:.7,radius:330},
  {id:'ancient-4-weapon-7',index:81,name:'비늘 폭풍',trigger:'normal',cooldown:5,damage:.3,chill:2.8,shield:.04,radius:190,cone:true},
  {id:'ancient-4-weapon-8',index:82,name:'세이렌의 선율',trigger:'skill',cooldown:7,ticks:5,damage:.12,push:35,radius:220},
  {id:'ancient-4-armor-1',index:83,name:'해왕의 방패',trigger:'hurt',cooldown:5,damage:.25,chill:2,shield:.09,radius:180},
  {id:'ancient-4-armor-2',index:84,name:'산호 재생',trigger:'kill',cooldown:3,heal:.05,chill:1,radius:155},
  {id:'ancient-4-armor-3',index:85,name:'조개 껍질 수호',trigger:'perfect',cooldown:5,shots:4,damage:.3,chill:1.8,radius:295},
  {id:'ancient-4-armor-4',index:86,name:'해초 휘감기',trigger:'dash',cooldown:6,ticks:3,damage:.18,heal:.015,radius:165},
  {id:'ancient-4-armor-5',index:87,name:'상어의 역습',trigger:'lowHp',cooldown:15,shield:.18,chill:2.2,stamina:15,radius:195},
  {id:'ancient-4-armor-6',index:88,name:'심해의 압력',trigger:'dash',cooldown:7,shield:.1,cdr:.9,push:40,radius:150},
  {id:'ancient-4-charm-1',index:89,name:'진주의 축복',trigger:'finisher',cooldown:5,chill:1.3,stamina:16,heal:.025,radius:175},
  {id:'ancient-4-charm-2',index:90,name:'소라의 메아리',trigger:'skill',cooldown:5,ticks:2,damage:.2,shield:.06,radius:130},
  {id:'ancient-4-charm-3',index:91,name:'해류의 인도',trigger:'periodic',cooldown:10,shots:2,damage:.2,heal:.04,radius:310},
  {id:'ancient-4-charm-4',index:92,name:'등불의 유혹',trigger:'normal',cooldown:6,bleed:3,chill:1.5,stamina:8,radius:125},
  {id:'ancient-4-charm-5',index:93,name:'비늘의 반사',trigger:'perfect',cooldown:6,dashRefund:1.5,cdr:1.3,shield:.07,radius:0,stamina:3},
  {id:'ancient-4-charm-6',index:94,name:'심연의 응시',trigger:'pickup',cooldown:4,chill:1.6,heal:.04,push:50,radius:190},
  {id:'ancient-4-helmet-1',index:95,name:'해왕의 위엄',trigger:'periodic',cooldown:9,damage:.25,chill:2,cdr:1,radius:270},
  {id:'ancient-4-pants-1',index:96,name:'물살 걸음',trigger:'dash',cooldown:6,ticks:3,damage:.2,chill:1.2,haste:.15,hasteTime:3,radius:180},
  {id:'ancient-4-boots-1',index:97,name:'파도 질주',trigger:'kill',cooldown:3,cdr:.8,stamina:11,radius:0},
  {id:'ancient-4-earring-1',index:98,name:'물방울 공명',trigger:'crit',cooldown:4,haste:.2,hasteTime:4,damage:.25,radius:150},
  {id:'ancient-4-special-1',index:99,name:'해류 인장의 심판',trigger:'finisher',cooldown:6,damage:.4,execute:.2,radius:250},
 ],
 [
  {id:'ancient-5-weapon-1',index:100,name:'낙뢰 일섬',trigger:'finisher',cooldown:4,damage:.45,push:18,radius:210,cone:true,haste:.15,hasteTime:3},
  {id:'ancient-5-weapon-2',index:101,name:'폭풍 가르기',trigger:'skill',cooldown:5,shots:3,damage:.4,bleed:3,cost:8,radius:290},
  {id:'ancient-5-weapon-3',index:102,name:'그리폰의 급강하',trigger:'normal',cooldown:6,damage:.2,heal:.04,radius:140},
  {id:'ancient-5-weapon-4',index:103,name:'천둥 강타',trigger:'skill',cooldown:6,ticks:3,damage:.18,heal:.025,radius:160,center:'target'},
  {id:'ancient-5-weapon-5',index:104,name:'바람의 칼날',trigger:'finisher',cooldown:5,stamina:21,shield:.06,radius:0},
  {id:'ancient-5-weapon-6',index:105,name:'뇌운 폭발',trigger:'normal',cooldown:4,shots:2,damage:.28,radius:270,haste:.12,hasteTime:3},
  {id:'ancient-5-weapon-7',index:106,name:'썬더버드의 깃',trigger:'crit',cooldown:5,ticks:4,damage:.2,radius:180,center:'target',haste:.1,hasteTime:3},
  {id:'ancient-5-weapon-8',index:107,name:'용왕의 뇌성',trigger:'finisher',cooldown:5,damage:.5,push:65,dashRefund:.7,radius:230},
  {id:'ancient-5-armor-1',index:108,name:'폭풍 방벽',trigger:'dash',cooldown:8,shield:.12,heal:.02,radius:0,stamina:3},
  {id:'ancient-5-armor-2',index:109,name:'깃털 회오리',trigger:'hurt',cooldown:4,damage:.4,push:55,radius:190},
  {id:'ancient-5-armor-3',index:110,name:'구름 갑옷',trigger:'kill',cooldown:2,heal:.04,stamina:12,shield:.02,radius:0},
  {id:'ancient-5-armor-4',index:111,name:'뇌전 반격',trigger:'perfect',cooldown:5,ticks:3,damage:.2,bleed:3,radius:190},
  {id:'ancient-5-armor-5',index:112,name:'까마귀 떼',trigger:'lowHp',cooldown:12,heal:.1,push:70,radius:170,haste:.11,hasteTime:3},
  {id:'ancient-5-armor-6',index:113,name:'천공의 수호',trigger:'dash',cooldown:6,ticks:3,damage:.1,radius:155,haste:.11,hasteTime:3},
  {id:'ancient-5-charm-1',index:114,name:'구슬 번개',trigger:'pickup',cooldown:4,heal:.06,shield:.04,radius:0,stamina:3},
  {id:'ancient-5-charm-2',index:115,name:'깃털 바람',trigger:'finisher',cooldown:4,shots:2,damage:.32,stamina:12,radius:250},
  {id:'ancient-5-charm-3',index:116,name:'바람개비 회전',trigger:'skill',cooldown:4,cdr:.6,heal:.025,radius:0,stamina:3},
  {id:'ancient-5-charm-4',index:117,name:'뇌운 축전',trigger:'dash',cooldown:5,stamina:14,push:45,damage:.15,radius:140},
  {id:'ancient-5-charm-5',index:118,name:'발톱 갈퀴',trigger:'periodic',cooldown:9,heal:.02,ticks:3,damage:.12,radius:170},
  {id:'ancient-5-charm-6',index:119,name:'천둥 북소리',trigger:'normal',cooldown:5,bleed:4,shield:.03,radius:125},
  {id:'ancient-5-helmet-1',index:120,name:'천공왕의 위엄',trigger:'crit',cooldown:6,fury:.15,furyTime:4,radius:0,stamina:3},
  {id:'ancient-5-pants-1',index:121,name:'폭풍 걸음',trigger:'dash',cooldown:6,haste:.2,hasteTime:4,stamina:13,radius:0},
  {id:'ancient-5-boots-1',index:122,name:'질풍 도약',trigger:'kill',cooldown:3,haste:.12,hasteTime:3,heal:.015,radius:0,stamina:3},
  {id:'ancient-5-earring-1',index:123,name:'번개 공명',trigger:'skill',cooldown:6,cdr:1.5,shots:2,damage:.25,radius:280},
  {id:'ancient-5-special-1',index:124,name:'폭풍 인장의 심판',trigger:'periodic',cooldown:12,fury:.2,furyTime:5,damage:.3,radius:220},
 ],
 [
  {id:'ancient-6-weapon-1',index:125,name:'태양 일섬',trigger:'finisher',cooldown:5,shots:4,damage:.3,push:20,radius:320},
  {id:'ancient-6-weapon-2',index:126,name:'성광 폭발',trigger:'skill',cooldown:6,damage:.55,stamina:7,radius:270,shield:.052},
  {id:'ancient-6-weapon-3',index:127,name:'별빛 찌르기',trigger:'normal',cooldown:5,ticks:2,damage:.23,radius:140,center:'target',shield:.06},
  {id:'ancient-6-weapon-4',index:128,name:'심판의 칼날',trigger:'skill',cooldown:5,damage:.65,heal:.06,hpCost:.035,radius:190,cone:true},
  {id:'ancient-6-weapon-5',index:129,name:'타락의 깃',trigger:'crit',cooldown:5,shots:3,damage:.5,bleed:2,radius:340},
  {id:'ancient-6-weapon-6',index:130,name:'시간 정지 베기',trigger:'finisher',cooldown:6,ticks:4,damage:.17,push:25,radius:205,center:'target'},
  {id:'ancient-6-weapon-7',index:131,name:'성좌의 궤적',trigger:'normal',cooldown:4,shots:1,damage:.5,heal:.025,radius:330},
  {id:'ancient-6-weapon-8',index:132,name:'일식의 그림자',trigger:'skill',cooldown:5,damage:.45,bleed:5,cdr:.5,radius:210},
  {id:'ancient-6-armor-1',index:133,name:'태양의 가호',trigger:'kill',cooldown:3,shield:.1,heal:.025,stamina:8,radius:0},
  {id:'ancient-6-armor-2',index:134,name:'성기사의 맹세',trigger:'dash',cooldown:6,damage:.25,stamina:16,radius:190,center:'target'},
  {id:'ancient-6-armor-3',index:135,name:'천사의 날개',trigger:'hurt',cooldown:5,shots:3,damage:.3,shield:.05,radius:270},
  {id:'ancient-6-armor-4',index:136,name:'별자리 방벽',trigger:'perfect',cooldown:6,ticks:4,damage:.15,radius:215,shield:.046},
  {id:'ancient-6-armor-5',index:137,name:'판결의 반격',trigger:'lowHp',cooldown:14,heal:.12,shield:.08,hpCost:.02,radius:0,stamina:3},
  {id:'ancient-6-armor-6',index:138,name:'영원의 문',trigger:'dash',cooldown:7,push:90,radius:230,shield:.06},
  {id:'ancient-6-charm-1',index:139,name:'태양 원반의 빛',trigger:'pickup',cooldown:4,stamina:23,cdr:1.2,radius:0},
  {id:'ancient-6-charm-2',index:140,name:'천칭의 균형',trigger:'skill',cooldown:5,shield:.08,dashRefund:1.2,radius:0,stamina:3},
  {id:'ancient-6-charm-3',index:141,name:'모래시계 역행',trigger:'finisher',cooldown:5,shots:3,damage:.2,heal:.03,radius:260},
  {id:'ancient-6-charm-4',index:142,name:'별 조각 비',trigger:'periodic',cooldown:8,stamina:25,cdr:.8,hpCost:.025,radius:0},
  {id:'ancient-6-charm-5',index:143,name:'후광의 축복',trigger:'normal',cooldown:6,bleed:2,heal:.035,radius:170},
  {id:'ancient-6-charm-6',index:144,name:'신의 눈길',trigger:'perfect',cooldown:6,damage:.35,stamina:18,push:40,radius:260},
  {id:'ancient-6-helmet-1',index:145,name:'태양관의 위엄',trigger:'kill',cooldown:4,execute:.18,radius:230},
  {id:'ancient-6-pants-1',index:146,name:'성광 걸음',trigger:'hurt',cooldown:8,invuln:1.2,push:60,radius:190},
  {id:'ancient-6-boots-1',index:147,name:'천상 도약',trigger:'dash',cooldown:7,invuln:.8,damage:.3,radius:180},
  {id:'ancient-6-earring-1',index:148,name:'별빛 공명',trigger:'crit',cooldown:5,shots:3,damage:.3,bleed:2,radius:310},
  {id:'ancient-6-special-1',index:149,name:'황혼 인장의 심판',trigger:'skill',cooldown:8,fury:.25,furyTime:4,hpCost:.03,radius:0,stamina:3},
 ],
];
export const REGION_COLORS=Object.freeze(['#b8e894','#96ecfa','#ceb7ff','#6fd6ff','#a8b8ff','#ffd27a']);
const triggers={normal:'일반 연격 적중',finisher:'3연격 마무리 적중',skill:'스킬 시전',crit:'치명타 적중',kill:'적 처치',dash:'회피 사용',perfect:'완벽 회피',hurt:'피격 생존',lowHp:'체력 35% 이하에서 피격 생존',periodic:'전투 중 주기적 발동',pickup:'장비 또는 핵 회수'};
// Builds the player-facing text from a recipe; loot.js reuses it for tier/difficulty-scaled copies.
export function describePower(r){
 const actions=[];if(r.damage)actions.push((r.shots?'주변 '+r.shots+'마리에 각각 ':r.cone?'전방 ':r.center==='target'?'적중 지점 주변 ':'주변 ')+Math.round(r.damage*100)+'% 피해'+(r.ticks?' · 0.6초 간격 '+r.ticks+'회':''));
 if(r.chill)actions.push(r.chill+'초 빙결');if(r.bleed)actions.push('출혈 '+r.bleed+'회');if(r.push)actions.push('밀쳐내기 '+r.push);if(r.heal)actions.push('최대 체력 '+Number((r.heal*100).toFixed(1))+'% 회복'+(r.ticks?' · 각 맥동':''));if(r.shield)actions.push('최대 체력 '+Number((r.shield*100).toFixed(1))+'% 보호막 3초');if(r.stamina)actions.push('기력 '+r.stamina+' 회복');if(r.dashRefund)actions.push('회피 대기 '+r.dashRefund+'초 감소');if(r.cdr)actions.push('스킬 재사용 대기 '+r.cdr+'초 감소');if(r.fury)actions.push('공격력 '+Math.round(r.fury*100)+'% 증가 '+r.furyTime+'초');if(r.haste)actions.push('공격 속도 '+Math.round(r.haste*100)+'% 증가 '+r.hasteTime+'초');if(r.invuln)actions.push(r.invuln+'초 무적');if(r.execute)actions.push((r.radius?'주변 ':'')+'체력 '+Math.round(r.execute*100)+'% 이하 일반 적 처형');if(r.cost)actions.push('기력 '+r.cost+' 소모');if(r.hpCost)actions.push('최대 체력 '+(r.hpCost*100).toFixed(1)+'% 소모 · 치명적 소모 불가');
 return triggers[r.trigger]+': '+actions.join(' · ')+'. 재사용 '+r.cooldown+'초.';
}
export const ANCIENT_POWERS=Object.freeze(regions.flat().map(r=>Object.freeze({...r,radius:r.radius??0,color:REGION_COLORS[Number(r.id.split('-')[1])-1],description:describePower(r)})));
// Alpha 0.120: an ancient earned on 악몽 carries a second power by slot family (weapon / armor parts / charm parts).
export const NIGHTMARE_POWERS=Object.freeze(Object.fromEntries([
 ['weapon',{name:'악몽의 칼날',trigger:'kill',cooldown:4,fury:.12,furyTime:3}],
 ['armor',{name:'악몽의 갑주',trigger:'hurt',cooldown:8,shield:.06}],
 ['charm',{name:'악몽의 메아리',trigger:'skill',cooldown:6,cdr:.6,stamina:6}],
].map(([family,r],i)=>[family,Object.freeze({...r,index:150+i,radius:0,color:'#ff6b8a',description:describePower(r)})])));

// Alpha 0.123: raid-only ancients carry authored powers at full strength (no tier or hunt-mode scaling).
const RAID_COLORS={colossus:'#ff9a4d',queen:'#a6e05a',judge:'#c9a2ff'};
export const RAID_POWERS=Object.freeze(Object.fromEntries([
 ['colossus-weapon',{name:'강철 분쇄',trigger:'finisher',cooldown:4,damage:.9,cone:true,push:30,radius:260}],
 ['colossus-helmet',{name:'요새의 의지',trigger:'hurt',cooldown:9,shield:.14,stamina:10}],
 ['colossus-armor',{name:'용광로 심장',trigger:'lowHp',cooldown:20,damage:.6,heal:.2,invuln:1.5,radius:220}],
 ['colossus-charm',{name:'불씨 축적',trigger:'kill',cooldown:3,fury:.15,furyTime:4}],
 ['colossus-special',{name:'대장장이의 망치',trigger:'periodic',cooldown:8,damage:.7,push:25,radius:240}],
 ['queen-weapon',{name:'산성 난도질',trigger:'normal',cooldown:3,shots:4,damage:.4,bleed:3,radius:260}],
 ['queen-helmet',{name:'군단의 시야',trigger:'crit',cooldown:4,haste:.2,hasteTime:3}],
 ['queen-armor',{name:'산성 외피',trigger:'hurt',cooldown:4,damage:.5,bleed:3,radius:200}],
 ['queen-charm',{name:'부화',trigger:'skill',cooldown:6,damage:.3,ticks:3,center:'target',radius:220}],
 ['queen-special',{name:'여왕의 명령',trigger:'kill',cooldown:5,shots:3,damage:.45,radius:300}],
 ['judge-weapon',{name:'빛의 선고',trigger:'crit',cooldown:5,damage:1.1,cone:true,execute:.25,radius:240}],
 ['judge-helmet',{name:'맹목의 정의',trigger:'perfect',cooldown:6,invuln:1,cdr:1}],
 ['judge-armor',{name:'성역',trigger:'periodic',cooldown:10,shield:.16,heal:.05}],
 ['judge-charm',{name:'천칭의 균형',trigger:'skill',cooldown:7,heal:.06,fury:.15,furyTime:4}],
 ['judge-special',{name:'최후의 판결',trigger:'lowHp',cooldown:25,damage:1.2,invuln:2,radius:300}],
].map(([key,r],i)=>{const id='ancient-raid-'+key;return [id,Object.freeze({...r,id,index:153+i,radius:r.radius??0,color:RAID_COLORS[key.split('-')[0]],description:describePower(r)})];})));

// Alpha 0.139 레이드 난이도: a 정예 raid ancient adds its raid's 각성 power, a 악몽 raid ancient also the 심연 power of its slot family.
export const RAID_AWAKEN_POWERS=Object.freeze(Object.fromEntries([
 ['colossus',{name:'거신 각성',trigger:'hurt',cooldown:10,shield:.1,damage:.8,push:40,radius:240}],
 ['queen',{name:'여왕 각성',trigger:'kill',cooldown:4,shots:4,damage:.5,bleed:2,radius:300}],
 ['judge',{name:'심판 각성',trigger:'skill',cooldown:6,damage:1,execute:.2,center:'target',radius:260}],
].map(([raid,r],i)=>{const id='raid-awaken-'+raid;return [raid,Object.freeze({...r,id,index:168+i,radius:r.radius??0,color:RAID_COLORS[raid],description:describePower(r)})];})));
export const RAID_ABYSS_POWERS=Object.freeze(Object.fromEntries([
 ['weapon',{name:'심연의 칼날',trigger:'kill',cooldown:3,fury:.2,furyTime:4}],
 ['armor',{name:'심연의 갑주',trigger:'hurt',cooldown:7,shield:.1,heal:.04}],
 ['charm',{name:'심연의 메아리',trigger:'skill',cooldown:5,cdr:.8,stamina:8}],
].map(([family,r],i)=>{const id='raid-abyss-'+family;return [family,Object.freeze({...r,id,index:171+i,radius:0,color:'#7a5cff',description:describePower(r)})];})));

// Alpha 0.142 악몽 레이드 '악몽의 군주': its five relics (indices 180~) and its 각성 power (185).
const SOVEREIGN_POWERS=[
 ['sovereign-weapon',{name:'악몽 베기',trigger:'finisher',cooldown:4,damage:.8,cone:true,bleed:4,radius:260}],
 ['sovereign-helmet',{name:'악몽의 시선',trigger:'crit',cooldown:5,fury:.18,furyTime:3,stamina:6}],
 ['sovereign-armor',{name:'흑요 가시',trigger:'hurt',cooldown:5,damage:.6,bleed:3,shield:.06,radius:220}],
 ['sovereign-charm',{name:'악몽의 눈',trigger:'skill',cooldown:6,damage:.4,ticks:3,center:'target',cdr:.5,radius:230}],
 ['sovereign-earring',{name:'가시 메아리',trigger:'kill',cooldown:4,shots:3,damage:.5,bleed:2,radius:300}],
].map(([key,r],i)=>{const id='ancient-raid-'+key;return [id,Object.freeze({...r,id,index:180+i,radius:r.radius??0,color:'#ff3d6a',description:describePower(r)})];});
export const SOVEREIGN_RAID_POWERS=Object.freeze(Object.fromEntries(SOVEREIGN_POWERS));
export const SOVEREIGN_AWAKEN=Object.freeze((r=>({...r,id:'raid-awaken-sovereign',index:185,radius:r.radius,color:'#ff3d6a',description:describePower(r)}))({name:'군주 각성',trigger:'kill',cooldown:4,damage:.7,shield:.05,radius:260}));
export const ANCIENT_POWER_BY_ID=Object.freeze(Object.fromEntries(ANCIENT_POWERS.map(r=>[r.id,r])));
