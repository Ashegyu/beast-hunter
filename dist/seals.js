// Alpha 0.136 인장 (사용자 요청): 캐릭터 전용장비 칸의 인장은 보스 러시에서만 얻는다. 등급은 수치가 아니라 효과 종류로
// 나뉜다 — 하옵은 생존 능력치, 중옵은 공격 능력치, 상옵은 특수효과(고대 특수효과와 같은 발동 규칙으로 game-engine이 처리).
// 성장은 단계마다 모든 효과 수치 +10%, 5단계에 중옵 효과, 10단계에 상옵 효과가 하나씩 더 붙는다. 순수 데이터와 규칙만 둔다.
// Alpha 0.136.2 (사용자 요청): 캐릭터마다 그 캐릭터의 전투 방식에 맞춘 '전용' 특수효과가 아주 낮은 확률(2%)로 나온다.
// 인장의 characterId가 어느 캐릭터의 전용 효과를 받을지 정한다. 새 캐릭터는 SEAL_CHARACTERS와 EXCLUSIVE_EFFECTS에 줄을 더한다.
import {describePower} from './ancient-powers.js?v=0.149.3';

export const SEAL_GRADES=Object.freeze([
 {id:0,name:'하옵',chance:.65,color:'#9ad1ff',rarity:1,salvage:3},
 {id:1,name:'중옵',chance:.27,color:'#ff9a8a',rarity:2,salvage:5},
 {id:2,name:'상옵',chance:.06,color:'#ffd27a',rarity:3,salvage:8},
 {id:3,name:'전용',chance:.02,color:'#ff5a7a',rarity:4,salvage:12},
].map(r=>Object.freeze(r)));
// Characters that can wear seals and the name each seal carries.
export const SEAL_CHARACTERS=Object.freeze({lirian:'리리안'});
export const SEAL_MAX_LEVEL=10,SEAL_LEVEL_POWER=.1,SEAL_CATALOG_ID='seal';
// Growth adds one effect of this grade at these levels (a different effect from those the seal already has).
export const SEAL_EFFECT_LEVELS=Object.freeze({5:1,10:2});
// Shards for level n → n+1 (index n) and gold; 103 shards in all.
export const SEAL_SHARD_COSTS=Object.freeze([3,4,5,6,8,10,12,15,18,22]);
export const sealGoldCost=level=>2000*(level+1);

const pct=v=>Number((v*100).toFixed(1))+'%',num=v=>Number(v.toFixed(1));
// Stat effects: `value` at level 0, in the units equipmentBonuses uses (fractions for *Pct, percent points otherwise).
const STAT_EFFECTS=[
 {id:'life',grade:0,name:'생명',stats:{hpPct:.08},text:s=>'최대 체력 +'+pct(s.hpPct)},
 {id:'guard',grade:0,name:'수호',stats:{reduction:4},text:s=>'받는 피해 -'+num(s.reduction)+'%p'},
 {id:'stride',grade:0,name:'질풍',stats:{speed:6,collection:20},text:s=>'이동 속도 +'+num(s.speed)+'% · 수집 거리 +'+Math.round(s.collection)},
 {id:'might',grade:1,name:'맹공',stats:{damagePct:.08},text:s=>'공격력 +'+pct(s.damagePct)},
 {id:'keen',grade:1,name:'예리',stats:{crit:4},text:s=>'치명타 확률 +'+num(s.crit)+'%p'},
 {id:'tempo',grade:1,name:'연격',stats:{attackSpeed:8},text:s=>'공격 속도 +'+num(s.attackSpeed)+'%'},
 {id:'reach',grade:1,name:'장검',stats:{range:10},text:s=>'공격 범위 +'+num(s.range)+'%'},
];
// Special effects use the ancient power recipe (trigger, cooldown, damage as a fraction of attack, …).
const POWER_EFFECTS=[
 {id:'moonfall',name:'적월 낙하',power:{trigger:'finisher',cooldown:4,damage:.7,radius:200}},
 {id:'bloodthirst',name:'혈월 갈증',power:{trigger:'kill',cooldown:2,heal:.03,fury:.1,furyTime:4}},
 {id:'aegis',name:'수호 결계',power:{trigger:'hurt',cooldown:6,shield:.12}},
 {id:'afterimage',name:'잔상 폭풍',power:{trigger:'skill',cooldown:4,shots:3,damage:.45,radius:280}},
 {id:'verdict',name:'심판의 낙인',power:{trigger:'crit',cooldown:4,damage:.5,execute:.15,radius:160,center:'target'}},
 {id:'awakening',name:'각성 고동',power:{trigger:'periodic',cooldown:10,fury:.18,furyTime:5,haste:.15,hasteTime:5}},
].map((r,i)=>({...r,grade:2,power:Object.freeze({...r.power,id:'seal-'+r.id,name:r.name,index:168+i,radius:r.power.radius??0,color:SEAL_GRADES[2].color})}));
// 전용 effects: one character's fighting style, stronger than 상옵. 리리안 = 연격 검사 · 적월 · 흘려베기.
const EXCLUSIVE_EFFECTS=[
 {id:'lirian_crescent',character:'lirian',name:'적월 검무',power:{trigger:'finisher',cooldown:3,shots:3,damage:.6,bleed:2,radius:320}},
 {id:'lirian_parry',character:'lirian',name:'흘려베기 반격',power:{trigger:'dash',cooldown:4,damage:1.4,invuln:.6,stamina:15,radius:220}},
 {id:'lirian_awaken',character:'lirian',name:'적월 각성',power:{trigger:'skill',cooldown:8,fury:.25,furyTime:5,cdr:.8}},
].map((r,i)=>({...r,grade:3,power:Object.freeze({...r.power,id:'seal-'+r.id,name:r.name,index:174+i,radius:r.power.radius??0,color:SEAL_GRADES[3].color})}));
export const SEAL_EFFECTS=Object.freeze([...STAT_EFFECTS,...POWER_EFFECTS,...EXCLUSIVE_EFFECTS].map(r=>Object.freeze(r)));
export const SEAL_EFFECT_BY_ID=Object.freeze(Object.fromEntries(SEAL_EFFECTS.map(r=>[r.id,r])));
export const sealPool=(grade,character='lirian')=>SEAL_EFFECTS.filter(r=>r.grade===grade&&(!r.character||r.character===character));

export const isSeal=item=>item?.slot==='special'&&!!item.seal;
export const sealLevel=item=>isSeal(item)?item.seal.level:0;
export const sealScale=item=>1+SEAL_LEVEL_POWER*sealLevel(item);
export const sealEffects=item=>isSeal(item)?item.seal.effects.map(id=>SEAL_EFFECT_BY_ID[id]).filter(Boolean):[];
// Summed stat bonuses of one seal at its level.
export function sealStats(item){
 const out={},k=sealScale(item);for(const e of sealEffects(item))for(const [key,v]of Object.entries(e.stats??{}))out[key]=(out[key]??0)+v*k;
 return out;
}
const SCALED=['damage','heal','shield','fury','haste'];
function scaled(power,k){const out={...power};for(const key of SCALED)if(power[key])out[key]=Math.round(power[key]*k*1000)/1000;return Object.freeze({...out,description:describePower(out)});}
export function sealSignatures(item){const k=sealScale(item);return sealEffects(item).filter(e=>e.power).map(e=>scaled(e.power,k));}
export function sealEffectLine(item,e){const k=sealScale(item);if(e.power)return '['+SEAL_GRADES[e.grade].name+'] '+e.name+' · '+scaled(e.power,k).description;const stats=Object.fromEntries(Object.entries(e.stats).map(([key,v])=>[key,v*k]));return '['+SEAL_GRADES[e.grade].name+'] '+e.name+' · '+e.text(stats);}
export const sealEffectLines=item=>sealEffects(item).map(e=>sealEffectLine(item,e));

// Effect grade is drawn first (하옵 65% · 중옵 27% · 상옵 6% · 전용 2%), then one effect of that grade.
export function rollSealGrade(n){let v=n;for(const g of SEAL_GRADES){v-=g.chance;if(v<0)return g.id;}return SEAL_GRADES.length-1;}
// Alpha 0.136 art (art/seals0136, page equipment-seals-v0136): one seal per effect.
export const sealArtId=effect=>'seal_'+effect;
export function makeSeal({id,tier=1,effect,characterId='lirian'}){
 const row=SEAL_EFFECT_BY_ID[effect],grade=SEAL_GRADES[row.grade],character=row.character??(Object.hasOwn(SEAL_CHARACTERS,characterId)?characterId:'lirian');
 return {id,slot:'special',tier,rarity:grade.rarity,name:SEAL_CHARACTERS[character]+'의 '+row.name+' 인장',catalogId:SEAL_CATALOG_ID,artId:sealArtId(row.id),characterId:character,affixes:{},seal:{grade:row.grade,effects:[row.id],level:0,shards:0}};
}
// A character without 전용 effects yet gets a 상옵 effect instead.
export function rollSeal({id,tier=1,characterId='lirian'},rng){let grade=rollSealGrade(rng()),pool=sealPool(grade,characterId);if(!pool.length)pool=sealPool(grade=2,characterId);return makeSeal({id,tier,characterId,effect:pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))].id});}

export function sealGrowthCost(item){const level=sealLevel(item);return isSeal(item)&&level<SEAL_MAX_LEVEL?{shards:SEAL_SHARD_COSTS[level],gold:sealGoldCost(level)}:null;}
// Effects added by growth are picked by a hash of the seal id and level, so growth never touches the battle RNG streams.
function pick(id,level,count){let h=0x811c9dc5;for(const c of id+':'+level){h^=c.charCodeAt(0);h=Math.imul(h,0x01000193)>>>0;}return h%count;}
export function sealGrowthEffect(item,level){
 const grade=SEAL_EFFECT_LEVELS[level];if(grade===undefined)return null;
 const pool=sealPool(grade,item.characterId).filter(r=>!item.seal.effects.includes(r.id));return pool.length?pool[pick(String(item.id),level,pool.length)]:null;
}
// Mutates the seal one level up (the caller pays). Returns the effect added at this level, if any.
export function growSeal(item){
 const cost=sealGrowthCost(item);if(!cost)return null;item.seal.level++;item.seal.shards+=cost.shards;
 const added=sealGrowthEffect(item,item.seal.level);if(added)item.seal.effects.push(added.id);return added??false;
}
// Dismantling returns the grade's shards plus half of those spent on growth.
export const sealSalvageShards=item=>isSeal(item)?SEAL_GRADES[item.seal.grade].salvage+Math.floor(item.seal.shards/2):0;

// Save cleaning: the first effect fixes the grade, name and art; growth effects are re-derived from the level.
export function cleanSeal(item,int){
 const seal=item?.seal,first=SEAL_EFFECT_BY_ID[seal?.effects?.[0]];if(!first||!Number.isInteger(item.id)||item.id<1||item.id>1e9)return null;
 const clean=makeSeal({id:item.id,tier:int(item.tier,1,6,1),effect:first.id,characterId:item.characterId}),level=int(seal.level,0,SEAL_MAX_LEVEL,0);
 for(let n=1;n<=level;n++){clean.seal.level=n;clean.seal.shards+=SEAL_SHARD_COSTS[n-1];const added=sealGrowthEffect(clean,n);if(added)clean.seal.effects.push(added.id);}
 return clean;
}
