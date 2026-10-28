// Growth dungeons reuse existing enemies, art and resource identities.
import {enemyHpScale,enemyDamageScale} from './chapters.js?v=0.140.0';
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
export const dungeonDefinition=id=>DUNGEONS.find(d=>d.id===id)??null;
export const emptyDungeonProgress=()=>Object.fromEntries(DUNGEONS.map(d=>[d.id,0]));
export function dungeonLimit(profile,id){return dungeonDefinition(id)?Math.min(DUNGEON_MAX_LEVEL,(profile.dungeonProgress?.[id]??0)+1):0;}
// Levels 1~10 pay exactly what they paid before 0.141; past 10 every reward keeps growing more slowly (`past`).
const past=(level,every)=>Math.floor(Math.max(0,level-10)/every);
export function dungeonRewards(id,level){
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
 const d=dungeonDefinition(id);if(!d||!dungeonRewards(id,level))return null;
 const chapter=dungeonChapter(level);
 return {...d,stageType:'dungeon',timeLimit:60,barrels:0,interval:id==='gold'?.065:.14,minimumTime:0,chapter:d.chapter,levelChapter:chapter,hpScale:d.hp*enemyHpScale(chapter),damageScale:d.damage*enemyDamageScale(chapter)};
}
export function dungeonActors(plan,waveNumber){
 const w=plan?.waves[waveNumber-1];if(!w)return [];
 const actors=[];for(const type of ['skitter','spitter','bulwark'])for(let i=0;i<w[type];i++)actors.push({type,boss:false,elite:i===0&&w.elites.includes(type)});return actors;
}
