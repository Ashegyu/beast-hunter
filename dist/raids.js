// Alpha 0.123 raids: one patterned boss per raid that a build has to answer, a weekly entry limit and raid-only ancients.
// Pure data and rules; game-engine.js owns the battle, rewards and settlement. The boss scales with the furthest chapter
// the player has opened and fights on that chapter's ground (its monsters are the swarm queen's brood).
// Alpha 0.123: every raid opens after clearing chapter 60 (user decision), so raids are fought at the chapter 60 scale.
export const RAID_WEEKLY_ENTRIES=3,RAID_TIME_LIMIT=120,RAID_ANCIENT_CHANCE=.1;
// Raid boss damage against the opened chapter's boss; health is per raid (`hp`, × the chapter boss), tuned so the
// matching build clears in roughly 60-100 seconds of the two minutes.
export const RAID_DAMAGE=1.2;
// The chapter boss multiplier outgrows a typical character in late chapters (60-chapter simulation), so raids ease off
// with depth: ×1.1 at chapter 20 down to ×0.7 at chapter 60, on both health and damage.
export const raidScale=chapter=>Math.round(Math.max(.7,Math.min(1.1,1.1-.01*(chapter-20)))*100)/100;
export const RAIDS=Object.freeze([
 {id:'colossus',name:'강철 거신',species:'raid_colossus',mechanic:'armor',unlock:60,hp:10,color:'#ff9a4d',
  rule:'강철 장갑이 피해를 85% 막습니다. 파갑참으로 부수거나 마지막 검끝 연격으로 꿰뚫으세요.',
  build:'파갑참 · 마지막 검끝',cycle:['slam','charge','slam','slam','volley','charge'],armor:.85},
 {id:'queen',name:'군단의 여왕',species:'raid_queen',mechanic:'swarm',unlock:60,hp:5.5,broodHp:3,color:'#a6e05a',
  rule:'10초마다 군단 8마리를 부르고, 군단이 살아 있으면 피해를 85% 덜 받습니다. 광역으로 먼저 쓸어내세요.',
  build:'광역 스킬 · 처치 효과',cycle:['volley','slam','volley','charge','volley','slam'],broodEvery:10,broodSize:8,broodShield:.85},
 {id:'judge',name:'황혼의 심판자',species:'raid_judge',mechanic:'judgement',unlock:60,hp:7.5,color:'#c9a2ff',
  rule:'12초마다 피할 수 없는 심판(최대 체력의 40%, 매번 +10%)을 내립니다. 피해 감소·보호막·회복으로 버티세요.',
  build:'체력 · 보호막 · 회복',cycle:['charge','slam','volley','slam','charge','volley'],judgementEvery:12,judgementWarning:2,judgementDamage:.4,judgementGrowth:.1},
].map(r=>Object.freeze({...r,cycle:Object.freeze(r.cycle)})));
// Alpha 0.139 레이드 난이도 (사용자 결정): 일반 opens after 일반 60장, 정예 after every 정예 chapter, 악몽 after every 악몽 chapter.
// The weekly entries are shared by the three tiers. A tier fights like the 정예/악몽 curve at chapter 60 (game-engine modeScale)
// and its ancients carry the hunt grade of the tier (stats ×1.25/×1.6, power ×1.2/×1.4, plus 각성 and 심연 powers).
export const RAID_TIERS=Object.freeze(['일반','정예','악몽']);
export function raidTierUnlocked(profile,tier){if(!Number.isInteger(tier)||tier<0||tier>=RAID_TIERS.length||(profile?.clearedStage??0)<60)return false;
 const m=profile?.bossMastery;return !tier||Array.isArray(m)&&m.length>0&&m.every(v=>v>=tier);}
export const raidTopTier=profile=>RAID_TIERS.reduce((a,_,t)=>raidTierUnlocked(profile,t)?t:a,0);
export const RAID_BY_ID=Object.freeze(Object.fromEntries(RAIDS.map(r=>[r.id,r])));
export const raidDefinition=id=>RAID_BY_ID[id]??null;
// Weeks start on Monday 00:00 in Korea (UTC+9). 1970-01-05 was a Monday.
const WEEK=7*864e5,KST=9*36e5,MONDAY=4*864e5;
export function raidWeek(now){return Math.floor((Number(now)+KST-MONDAY)/WEEK);}
export function nextRaidReset(now){return (raidWeek(now)+1)*WEEK+MONDAY-KST;}
export const emptyRaidProgress=()=>({week:-1,entries:Object.fromEntries(RAIDS.map(r=>[r.id,0])),clears:Object.fromEntries(RAIDS.map(r=>[r.id,0]))});
export function raidEntriesUsed(profile,id,now){const r=profile?.raids;return r&&r.week===raidWeek(now)?r.entries?.[id]??0:0;}
export function raidEntriesLeft(profile,id,now){return raidDefinition(id)?Math.max(0,RAID_WEEKLY_ENTRIES-raidEntriesUsed(profile,id,now)):0;}
export const raidUnlocked=(profile,id)=>!!raidDefinition(id)&&(profile?.clearedStage??0)>=raidDefinition(id).unlock;
// The chapter the raid scales with and fights on: the furthest chapter opened.
export const raidChapter=(profile,chapters)=>Math.max(1,Math.min(chapters,profile?.unlockedStage??1));
export function raidPlan(id){
 const r=raidDefinition(id);if(!r)return null;
 return {id:r.id,kind:'레이드',name:r.name,rule:r.rule,hint:r.build,stageType:'boss',formation:'boss',boss:true,interval:0,minimumTime:0,barrels:0,timeLimit:RAID_TIME_LIMIT,waves:[{skitter:0,spitter:0,bulwark:1,elites:[]}]};
}
// Clear rewards are fixed materials and gold; the raid ancient is a separate chance roll.
export function raidRewards(chapter){
 const c=Math.max(1,Math.min(60,chapter|0));
 return {gold:600+c*120,cores:2+Math.ceil(c/10),materials:{source:1,promotionStone:2+Math.floor(c/20),refineCrystal:2+Math.floor(c/15)}};
}
// Raid-only ancients (art/raid0123): five per raid, region 7 in the codex. They use the tier 6 stat rules ×1.1 and
// carry their power as authored (RAID_POWERS in ancient-powers.js), without tier or hunt-mode scaling.
export const RAID_REGION=7,RAID_ANCIENT_STATS=1.1;
const PARTS=['weapon','helmet','armor','charm','special'];
const ART={weapon:'set_sungod_sword',helmet:'set_sungod_helmet',armor:'set_sungod_armor',charm:'acc_t6_charm',special:'acc_t6_seal'};
const RAID_ITEMS={
 colossus:[['거신의 파쇄검','echo'],['거신의 요새 투구',null],['거신의 용광로 흉갑','lastStand'],['용광로 심장 목걸이','focus'],['리리안의 거신 인장',null]],
 queen:[['여왕의 낫날 검','storm'],['여왕의 갑각 왕관',null],['여왕의 산성 갑각','thorns'],['군단 알 목걸이','hunter'],['리리안의 군단 인장',null]],
 judge:[['심판의 광휘검','execution'],['눈가린 심판관의 투구',null],['심판관의 성휘 흉갑','barrier'],['심판의 천칭 목걸이','capacitor'],['리리안의 판결 인장',null]],
};
export const RAID_ANCIENTS=Object.freeze(RAIDS.flatMap(r=>RAID_ITEMS[r.id].map(([name,effectId],i)=>Object.freeze({id:`ancient-raid-${r.id}-${PARTS[i]}`,tier:6,slot:PARTS[i],name,artId:ART[PARTS[i]],effectId,raid:r.id}))));
