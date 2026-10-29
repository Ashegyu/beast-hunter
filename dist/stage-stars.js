// Alpha 0.132 스테이지 별: every stage clear can earn up to three stars, kept as the best result of any difficulty.
//  ★1 클리어 · ★2 빠른 클리어 · ★3 1~9스테이지는 최속 클리어, 보스(10)는 스테이지 내내 체력 50% 이상 유지 (each on its own).
//  0.135: the times are per stage (STAR_TIMES). Spawn pacing and walking make some stages take 30s+ even against one-hit
//  enemies, so one 30s/20s line was impossible there; these lines are what a player 5~10× stronger than the stage reaches.
// ★3 uses the lowest health of the stage (s.run.lowestHp): health at the clear was almost always above half
// because wave clears heal 8% and regeneration refills between hits (0.132 sim: 100% of clears).
// profile.stageStars[chapter-1] packs ten 3-bit masks (stage n at bits 3(n-1)..3(n-1)+2).
// profile.starChests[chapter-1] is the claimed mask of the chapter's 별 상자 (10·20·30 stars).
// The 30-star chest also gives one 성장 포인트 (growth.js bonusGrowthPoints counts them).
import {STAGES_PER_CHAPTER} from './battle-plans.js?v=0.144.5';
export const STAR_BITS=Object.freeze({clear:1,fast:2,third:4});
export const STAR_TIMES=Object.freeze([[30,15],[30,20],[40,30],[45,35],[35,25],[35,25],[40,30],[40,30],[30,20],[35,null]].map(r=>Object.freeze(r)));
export const starTimes=stage=>STAR_TIMES[Math.max(1,Math.min(STAR_TIMES.length,stage))-1];
export const STAR_HEALTH=.5;
export const STAR_CHEST_STARS=Object.freeze([10,20,30]);
export const MAX_CHAPTER_STARS=STAGES_PER_CHAPTER*3;
const count3=m=>(m&1)+(m>>1&1)+(m>>2&1);
export const emptyStageStars=n=>Array.from({length:n},()=>0);
export function stageStarMask(p,chapter,stage){return (p?.stageStars?.[chapter-1]??0)>>>(3*(stage-1))&7;}
export const starCount=mask=>count3(mask&7);
export function chapterStars(p,chapter){let total=0;for(let n=1;n<=STAGES_PER_CHAPTER;n++)total+=count3(stageStarMask(p,chapter,n));return total;}
export function totalStars(p){let total=0;for(let c=1;c<=(p?.stageStars?.length??0);c++)total+=chapterStars(p,c);return total;}
// The mask a clear earns: time used against the stage limit and the lowest health share during the stage.
export function starsFor({stage=10,timeLimit,timeRemaining,lowestHp}){
 let mask=STAR_BITS.clear;const used=timeLimit-timeRemaining,[fast,rush]=starTimes(stage);
 if(timeLimit>0&&used<=fast+1e-9)mask|=STAR_BITS.fast;
 if(rush?timeLimit>0&&used<=rush+1e-9:lowestHp>=STAR_HEALTH-1e-9)mask|=STAR_BITS.third;
 return mask;
}
// Merge a clear into the profile; returns {mask, gained} (gained = new stars only).
export function awardStars(p,chapter,stage,mask){
 const before=stageStarMask(p,chapter,stage),after=before|mask&7;
 p.stageStars[chapter-1]=((p.stageStars[chapter-1]??0)&~(7<<3*(stage-1))|after<<3*(stage-1))>>>0;
 return {mask:after,earned:mask&7,gained:count3(after)-count3(before)};
}
// Chest rewards grow with the chapter (multiplier = 적 배수, the same curve as boss gold).
export function starChestReward(chapter,tier,multiplier){
 const c=chapter,gold=Math.round(120*multiplier*tier),cores=tier+Math.floor((c-1)/10);
 const materials=tier===1?{refineStone:4+Math.floor(c/6)}:tier===2?{refineStone:6+Math.floor(c/4),refineCrystal:1+Math.floor(c/20),skillPage:2}:{skillPage:4,refineCrystal:2+Math.floor(c/15),promotionStone:2+Math.floor(c/15)};
 return {gold,cores,materials,growthPoints:tier===3?1:0};
}
export const chestClaimed=(p,chapter,tier)=>!!((p?.starChests?.[chapter-1]??0)>>(tier-1)&1);
export function chestStatus(p,chapter,tier){
 if(!Number.isInteger(tier)||tier<1||tier>3||!Number.isInteger(chapter)||chapter<1||chapter>(p?.starChests?.length??0))return '없는 상자';
 if(chestClaimed(p,chapter,tier))return '수령 완료';
 const need=STAR_CHEST_STARS[tier-1],have=chapterStars(p,chapter);
 return have<need?'별 '+have+'/'+need:'';
}
// Restore: a stage keeps stars only when it was cleared (allowed = cleared stages per chapter); any star implies ★1.
// Saves from before 0.132 get ★1 on every stage they had already cleared. Chests need their stars.
export function cleanStageStars(raw,allowed){
 return allowed.map((limit,i)=>{const value=Array.isArray(raw)?raw[i]:undefined;let out=0;for(let n=1;n<=limit;n++){let m=raw==null?1:Number.isInteger(value)&&value>=0?value>>>(3*(n-1))&7:0;if(m)m|=1;out|=m<<3*(n-1);}return out>>>0;});
}
export function cleanStarChests(raw,p){
 return p.stageStars.map((_,i)=>{const value=Array.isArray(raw)&&Number.isInteger(raw[i])?raw[i]&7:0;let out=0;for(let t=1;t<=3;t++)if(value>>(t-1)&1&&chapterStars(p,i+1)>=STAR_CHEST_STARS[t-1])out|=1<<(t-1);return out;});
}
