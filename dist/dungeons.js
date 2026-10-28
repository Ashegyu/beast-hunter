// Growth dungeons reuse existing enemies, art and resource identities.
import {enemyHpScale,enemyDamageScale} from './chapters.js?v=0.142.0';
// Alpha 0.141 (사용자 요청 '던전 단계가 너무 적다'): 100 levels on the chapter curve. Level L is fought like chapter
// 1+(L−1)×0.9 (dungeonChapter: 10단계 ≈ 9장, 50단계 ≈ 45장, 100단계 ≈ 90장 = 정예 60장), times the dungeon's own hp/damage.
export const DUNGEON_MAX_LEVEL=100,DUNGEON_CHAPTER_STEP=.9;
export const dungeonChapter=level=>1+(level-1)*DUNGEON_CHAPTER_STEP;
const wave=(skitter,spitter,bulwark,elites=[])=>({skitter,spitter,bulwark,elites});
export const DUNGEONS=Object.freeze([
 {id:'gold',name:'황금 무리',kind:'골드 던전',chapter:1,icon:'hunt',tag:'GOLD',rule:'약한 적이 대량으로 몰려옵니다.',hint:'광역·번개 전이·처치 폭발',use:'장비 강화·승급·제작 비용',hp:.6,damage:.65,formation:'ring',waves:[wave(20,0,0),wave(24,1,0),wave(28,2,0)]},
 {id:'enhance',name:'철갑의 제련소',kind:'강화 던전',chapter:11,icon:'craft',tag:'REFINE',rule:'두꺼운 장갑과 높은 체력을 돌파하세요.',hint:'단일 화력·방어 약화·출혈',use:'가방 → 장비 선택 → 강화',hp:6,damage:.8,armor:.25,formation:'front',waves:[wave(0,0,1),wave(0,0,1),wave(0,0,1)]},
 {id:'promote',name:'정예의 시련',kind:'승급 던전',chapter:11,icon:'equipment',tag:'PROMOTE',rule:'웨이브마다 강력한 정예가 출현합니다.',hint:'지속 화력·흡혈·반격',use:'최대 강화 장비 → 승급',hp:1.05,damage:.9,formation:'pincer',waves:[wave(5,1,2,['skitter']),wave(4,2,2,['spitter']),wave(4,2,3,['skitter','bulwark'])]},
 {id:'skill',name:'잔상의 수련장',kind:'스킬 던전',chapter:21,icon:'skills',tag:'ARTS',rule:'돌격·원거리·중갑의 혼합 패턴을 상대하세요.',hint:'광역과 단일 화력·회복의 균형',use:'스킬 → 검술서 연구 → 강화 포인트',hp:.85,damage:.75,formation:'crossfire',waves:[wave(10,2,0),wave(5,4,1),wave(6,2,3,['spitter'])]},
 // Alpha 0.141 (사용자 결정): experience (also fills 초월 past Lv.200) and crafting materials.
 {id:'xp',name:'수련의 회랑',kind:'경험치 던전',chapter:31,icon:'growth',tag:'TRAIN',rule:'정예가 섞인 무리가 쉬지 않고 밀려옵니다.',hint:'광역 화력·기력 회복·연격',use:'레벨 · Lv.200 이후 초월 경험치',hp:.9,damage:.8,formation:'surge',waves:[wave(14,2,1,['skitter']),wave(12,3,2,['spitter']),wave(12,3,3,['bulwark'])]},
 {id:'craft',name:'괴수 해체장',kind:'제작 재료 던전',chapter:41,icon:'bag',tag:'SALVAGE',rule:'단단한 중갑 괴수를 해체하세요.',hint:'방어 약화·단일 화력·장갑 무시',use:'제작 → 고유 장비 재료',hp:1.6,damage:.85,armor:.15,formation:'front',waves:[wave(6,0,4,['bulwark']),wave(4,2,5),wave(4,2,6,['bulwark','skitter'])]},
].map(d=>Object.freeze({...d,waves:Object.freeze(d.waves.map(w=>Object.freeze({...w,elites:Object.freeze(w.elites)})))})));
// Alpha 0.141 무한의 탑 (사용자 결정): one 60-second battle per floor on the dungeon machinery (s.run.dungeonId 'tower',
// s.run.stage = floor). Floor F is fought like chapter F (탑 60층 = 60장, 120층 = 악몽 60장; the curve keeps going) on
// chapter ((F−1) mod 60)+1's land and monsters, with the THREAT.mob damage of a campaign stage and no gates. Every fifth
// floor brings elites, every tenth is that chapter's boss alone. Rewards are paid once, on the first clear of a floor
// (profile.tower.best), and every tenth floor cleared adds a permanent bonus (towerBonus).
export const TOWER_MAX_FLOOR=9999;
export const TOWER=Object.freeze({id:'tower',name:'무한의 탑',kind:'무한의 탑',chapter:1,icon:'ranking',tag:'TOWER',rule:'한 층씩 올라갈수록 강해집니다. 5층마다 정예, 10층마다 보스.',hint:'지금 빌드의 한계 점검',use:'첫 클리어 보상 · 10층마다 영구 능력치'});
export const towerChapter=floor=>(Math.max(1,floor|0)-1)%60+1;
export const towerFloorKind=floor=>floor%10===0?'boss':floor%5===0?'elite':'normal';
const TOWER_FORMATIONS=['hunt','crossfire','front','ring','pincer','barrage','surge'];
const TOWER_WAVES={normal:[wave(14,3,2),wave(16,3,2),wave(16,4,3)],elite:[wave(10,2,2,['skitter']),wave(10,3,3,['spitter','bulwark']),wave(8,3,4,['skitter','bulwark'])],boss:[{...wave(0,0,0),boss:true}]};
// Permanent floor bonuses: 10층 공격력 +1%, 20층 최대 체력 +1%, 30층 치명 +0.5%p, 40층 피해 감소 +0.5%p, then again.
export const TOWER_BONUS=Object.freeze([{key:'damagePct',value:.01,text:'공격력 +1%'},{key:'hpPct',value:.01,text:'최대 체력 +1%'},{key:'crit',value:.005,text:'치명 +0.5%p'},{key:'reduction',value:.005,text:'피해 감소 +0.5%p'}].map(Object.freeze));
export const towerBonusAt=floor=>floor%10===0?TOWER_BONUS[(floor/10-1)%TOWER_BONUS.length]:null;
export function towerBonus(best){const out={damagePct:0,hpPct:0,crit:0,reduction:0},n=Math.floor(Math.max(0,best|0)/10);for(let i=0;i<TOWER_BONUS.length;i++){const times=Math.floor(n/TOWER_BONUS.length)+(i<n%TOWER_BONUS.length?1:0);out[TOWER_BONUS[i].key]=Math.round(times*TOWER_BONUS[i].value*1e6)/1e6;}return out;}
export function towerRewards(floor){
 if(!Number.isInteger(floor)||floor<1||floor>TOWER_MAX_FLOOR)return null;const kind=towerFloorKind(floor);
 // Alpha 0.142: 강화 재료·검술서·승급석은 성장 던전에서만 나와 탑 보스·정예 층은 그 몫을 골드로 준다(사용자 결정).
 return {gold:(200+floor*50)*(kind==='boss'?3:kind==='elite'?2:1),materials:{}};
}
export function towerPlan(floor){
 if(!towerRewards(floor))return null;const kind=towerFloorKind(floor);
 return {...TOWER,chapter:towerChapter(floor),floorKind:kind,stageType:'dungeon',timeLimit:60,barrels:0,interval:kind==='boss'?0:.1,minimumTime:0,levelChapter:floor,formation:kind==='boss'?'boss':TOWER_FORMATIONS[floor%TOWER_FORMATIONS.length],hpScale:enemyHpScale(floor),damageScale:enemyDamageScale(floor),waves:TOWER_WAVES[kind]};
}
export const dungeonDefinition=id=>id==='tower'?TOWER:DUNGEONS.find(d=>d.id===id)??null;
// The chapter whose land and monsters a dungeon level is fought on.
export const dungeonStageId=(id,level)=>id==='tower'?towerChapter(level):dungeonDefinition(id)?.chapter??1;
export const emptyDungeonProgress=()=>Object.fromEntries(DUNGEONS.map(d=>[d.id,0]));
// Alpha 0.141 반복 수급 제한 (사용자 결정 '일주일 횟수로 제한, 첫 클리어 뒤에는 보상을 낮춰', 횟수는 새 단계 포함):
// every win uses one of the dungeon's DUNGEON_WEEKLY_CLEARS for the week (raids' week: Monday 00:00 KST), new level or not.
// A level above the best pays in full; a level already cleared pays DUNGEON_REPEAT_RATE of it (rounded down, at least 1
// of each paid item). A loss pays nothing and uses nothing. With no clears left the dungeon cannot be entered this week.
export const DUNGEON_WEEKLY_CLEARS=14,DUNGEON_REPEAT_RATE=.5;
export const emptyDungeonWeek=()=>({week:-1,clears:Object.fromEntries(DUNGEONS.map(d=>[d.id,0]))});
export function dungeonClearsUsed(profile,id,week){const w=profile?.dungeonWeek;return w&&w.week===week?w.clears?.[id]??0:0;}
export function dungeonClearsLeft(profile,id,week){return DUNGEONS.some(d=>d.id===id)?Math.max(0,DUNGEON_WEEKLY_CLEARS-dungeonClearsUsed(profile,id,week)):0;}
export const isDungeonRepeat=(profile,id,level)=>id!=='tower'&&level<=(profile?.dungeonProgress?.[id]??0);
export function repeatRewards(reward){
 if(!reward)return null;const cut=n=>n>0?Math.max(1,Math.floor(n*DUNGEON_REPEAT_RATE)):0;
 return {...reward,gold:cut(reward.gold),...(reward.xp?{xp:cut(reward.xp)}:{}),materials:Object.fromEntries(Object.entries(reward.materials).map(([k,n])=>[k,cut(n)])),repeat:true};
}
export function dungeonLimit(profile,id){if(id==='tower')return Math.min(TOWER_MAX_FLOOR,(profile.tower?.best??0)+1);return dungeonDefinition(id)?Math.min(DUNGEON_MAX_LEVEL,(profile.dungeonProgress?.[id]??0)+1):0;}
// Levels 1~10 pay exactly what they paid before 0.141; past 10 every reward keeps growing more slowly (`past`).
const past=(level,every)=>Math.floor(Math.max(0,level-10)/every);
export function dungeonRewards(id,level){
 if(id==='tower')return towerRewards(level);
 if(!dungeonDefinition(id)||!Number.isInteger(level)||level<1||level>DUNGEON_MAX_LEVEL)return null;
 const early=Math.min(level,10);
 if(id==='gold')return {gold:400+early*200+Math.max(0,level-10)*150,materials:{}};
 if(id==='enhance')return {gold:0,materials:{refineStone:8+early*2+Math.max(0,level-10),...(level>=4?{refineCrystal:Math.floor(early/2)+past(level,4)}:{}),...(level>=7?{refineEssence:Math.floor((early-4)/3)+past(level,10)}:{})}};
 if(id==='promote')return {gold:0,materials:{promotionStone:2+Math.floor(early/2)+past(level,5),crystal:1+Math.floor(early/3)+past(level,10)}};
 if(id==='skill')return {gold:0,materials:{skillPage:2+Math.floor(early/2)+past(level,6)}};
 if(id==='xp')return {gold:0,xp:500+level*50,materials:{}};
 // Crafting recipes need 30~60 뼈철, 15~50 가죽, 10~25 결정, 3~6 of a region material, 2 원질 핵 and 1 무명의 기원 (bosses only).
 const region=['root','tear','seal'][(level-1)%3];
 return {gold:0,materials:{boneIron:4+Math.floor(level/2),hide:2+Math.floor(level/3),crystal:1+Math.floor(level/5),...(level>=5?{[region]:1+Math.floor(level/30)}:{}),...(level>=50?{source:Math.floor(level/50)}:{})}};
}
export function dungeonPlan(id,level){
 if(id==='tower')return towerPlan(level);
 const d=dungeonDefinition(id);if(!d||!dungeonRewards(id,level))return null;
 const chapter=dungeonChapter(level);
 return {...d,stageType:'dungeon',timeLimit:60,barrels:0,interval:id==='gold'?.065:.14,minimumTime:0,chapter:d.chapter,levelChapter:chapter,hpScale:d.hp*enemyHpScale(chapter),damageScale:d.damage*enemyDamageScale(chapter)};
}
export function dungeonActors(plan,waveNumber){
 const w=plan?.waves[waveNumber-1];if(!w)return [];
 const actors=[];if(w.boss)actors.push({type:'bulwark',boss:true,elite:false});for(const type of ['skitter','spitter','bulwark'])for(let i=0;i<w[type];i++)actors.push({type,boss:false,elite:i===0&&w.elites.includes(type)});return actors;
}
