// Alpha 0.136 보스 러시 (사용자 요청): 깬 챕터의 보스 다섯을 연달아 상대하고, 쓰러뜨린 수만큼 인장·인장 조각을 받는다.
// 인장(캐릭터 전용장비)은 여기서만 나온다. 순수 데이터와 규칙만 두고 전투·정산은 game-engine.js가 맡는다.
// 상대는 가장 멀리 깬 챕터와 그 앞 네 챕터의 보스(그 챕터 보스 기준, 뒤로 갈수록 체력·공격력이 오름), 싸우는 땅은 가장 멀리 깬 챕터다.
export const RUSH_DAILY_ENTRIES=3,RUSH_BOSSES=5,RUSH_TIME_LIMIT=150,RUSH_UNLOCK=10;
// Each boss in turn: health × the furthest cleared chapter's boss and damage × that chapter's boss damage. A character who
// just cleared the chapter kills its boss in about 8 seconds (60-chapter simulation), so the rush ramps up instead.
export const RUSH_HP=Object.freeze([2,3,4,5,6]),RUSH_DAMAGE=Object.freeze([1,1.2,1.4,1.6,1.8]);
// Late chapters outgrow a typical character (the 60-chapter simulation needs ever longer boss fights, with a step at each
// region), so like raids the rush eases with depth on both health and damage: a range per region, eased across its ten
// chapters. Tuned so a character who just cleared the chapter (simulate-campaign0133 switch profiles) fells about three.
const RUSH_SCALE=[[1.15,1.15],[1.05,.95],[.92,.85],[.62,.52],[.52,.48],[.42,.33]];
export function rushScale(chapter){const c=Math.max(1,Math.min(60,chapter|0)),[a,b]=RUSH_SCALE[Math.ceil(c/10)-1],t=((c-1)%10)/9;return Math.round((a+(b-a)*t)*100)/100;}
// Days start at 00:00 in Korea (UTC+9).
const DAY=864e5,KST=9*36e5;
export const rushDay=now=>Math.floor((Number(now)+KST)/DAY);
export const nextRushReset=now=>(rushDay(now)+1)*DAY-KST;
export const emptyRushProgress=()=>({day:-1,entries:0,clears:0,best:0});
export const rushUnlocked=profile=>(profile?.clearedStage??0)>=RUSH_UNLOCK;
export function rushEntriesLeft(profile,now){const r=profile?.bossRush;if(profile?.testMode)return RUSH_DAILY_ENTRIES;return Math.max(0,RUSH_DAILY_ENTRIES-(r&&r.day===rushDay(now)?r.entries:0));}
export const rushChapter=(profile,chapters)=>Math.max(1,Math.min(chapters,profile?.clearedStage??1));
// The five chapters whose bosses appear, oldest first; the furthest cleared chapter's boss comes last.
export function rushLineup(chapter){const last=Math.max(RUSH_BOSSES,chapter);return Array.from({length:RUSH_BOSSES},(_,i)=>last-RUSH_BOSSES+1+i);}
export function rushPlan(){
 return {id:'rush',kind:'보스 러시',name:'보스 러시',rule:'깬 챕터의 보스 다섯이 차례로 나옵니다. 보스마다 자기 지역의 규칙(재생·폭주·호위·방어 태세)을 씁니다. 보스 사이에 체력 8% 회복.',
  hint:'쓰러지거나 시간이 끝나도 그때까지 쓰러뜨린 보스 수만큼 보상',stageType:'boss',formation:'boss',boss:true,interval:0,minimumTime:0,barrels:0,timeLimit:RUSH_TIME_LIMIT,
  waves:Array.from({length:RUSH_BOSSES},()=>({skitter:0,spitter:0,bulwark:1,elites:[]}))};
}
// Rewards for `kills` bosses: gold and 인장 조각 always, a seal by chance (certain at five).
export const RUSH_SEAL_CHANCE=Object.freeze([0,.12,.24,.36,.5,1]);
export function rushRewards(kills,chapter){
 const k=Math.max(0,Math.min(RUSH_BOSSES,kills|0)),c=Math.max(1,Math.min(60,chapter|0));
 return {gold:k*(120+c*25),shards:k*2+(k===RUSH_BOSSES?2:0),sealChance:RUSH_SEAL_CHANCE[k]};
}
