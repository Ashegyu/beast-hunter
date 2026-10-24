// Growth dungeons reuse existing enemies, art and resource identities.
export const DUNGEON_MAX_LEVEL=10;
const wave=(skitter,spitter,bulwark,elites=[])=>({skitter,spitter,bulwark,elites});
export const DUNGEONS=Object.freeze([
 {id:'gold',name:'황금 무리',kind:'골드 던전',chapter:1,icon:'hunt',tag:'GOLD',rule:'약한 적이 대량으로 몰려옵니다.',hint:'광역·번개 전이·처치 폭발',use:'장비 강화·승급·제작 비용',hp:.6,damage:.65,formation:'ring',waves:[wave(20,0,0),wave(24,1,0),wave(28,2,0)]},
 {id:'enhance',name:'철갑의 제련소',kind:'강화 던전',chapter:11,icon:'craft',tag:'REFINE',rule:'두꺼운 장갑과 높은 체력을 돌파하세요.',hint:'단일 화력·방어 약화·출혈',use:'가방 → 장비 선택 → 강화',hp:6,damage:.8,armor:.25,formation:'front',waves:[wave(0,0,1),wave(0,0,1),wave(0,0,1)]},
 {id:'promote',name:'정예의 시련',kind:'승급 던전',chapter:11,icon:'equipment',tag:'PROMOTE',rule:'웨이브마다 강력한 정예가 출현합니다.',hint:'지속 화력·흡혈·반격',use:'최대 강화 장비 → 승급',hp:1.05,damage:.9,formation:'pincer',waves:[wave(5,1,2,['skitter']),wave(4,2,2,['spitter']),wave(4,2,3,['skitter','bulwark'])]},
 {id:'skill',name:'잔상의 수련장',kind:'스킬 던전',chapter:21,icon:'skills',tag:'ARTS',rule:'돌격·원거리·중갑의 혼합 패턴을 상대하세요.',hint:'광역과 단일 화력·회복의 균형',use:'스킬 → 검술서 연구 → 강화 포인트',hp:.85,damage:.75,formation:'crossfire',waves:[wave(10,2,0),wave(5,4,1),wave(6,2,3,['spitter'])]},
].map(d=>Object.freeze({...d,waves:Object.freeze(d.waves.map(w=>Object.freeze({...w,elites:Object.freeze(w.elites)})))})));
export const dungeonDefinition=id=>DUNGEONS.find(d=>d.id===id)??null;
export const emptyDungeonProgress=()=>Object.fromEntries(DUNGEONS.map(d=>[d.id,0]));
export function dungeonLimit(profile,id){return dungeonDefinition(id)?Math.min(DUNGEON_MAX_LEVEL,(profile.dungeonProgress?.[id]??0)+1):0;}
export function dungeonRewards(id,level){
 if(!dungeonDefinition(id)||!Number.isInteger(level)||level<1||level>DUNGEON_MAX_LEVEL)return null;
 if(id==='gold')return {gold:400+level*200,materials:{}};
 if(id==='enhance')return {gold:0,materials:{refineStone:8+level*2,...(level>=4?{refineCrystal:Math.floor(level/2)}:{}),...(level>=7?{refineEssence:Math.floor((level-4)/3)}:{})}};
 if(id==='promote')return {gold:0,materials:{promotionStone:2+Math.floor(level/2),crystal:1+Math.floor(level/3)}};
 return {gold:0,materials:{skillPage:2+Math.floor(level/2)}};
}
export function dungeonPlan(id,level){
 const d=dungeonDefinition(id);if(!d||!dungeonRewards(id,level))return null;
 return {...d,stageType:'dungeon',timeLimit:60,barrels:0,interval:id==='gold'?.065:.14,minimumTime:0,hpScale:d.hp*(1+(level-1)*.28),damageScale:d.damage*(1+(level-1)*.14)};
}
export function dungeonActors(plan,waveNumber){
 const w=plan?.waves[waveNumber-1];if(!w)return [];
 const actors=[];for(const type of ['skitter','spitter','bulwark'])for(let i=0;i<w[type];i++)actors.push({type,boss:false,elite:i===0&&w.elites.includes(type)});return actors;
}
