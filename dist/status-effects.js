// Alpha 0.149 버프·디버프 (사용자 요청 '보스도 걸 수 있고 그걸 해체하는 빌드도'): pure rules, no DOM or storage.
// Statuses live on the battle only (s.player.statuses / e.statuses, never saved). Bosses on 정예·악몽 (and raid 정예·악몽)
// put their rule's debuff on the hunter when their attack lands; 정화 removes hunter debuffs and 해체 shuts a boss's buff
// for a few seconds. Design: GAME_DESIGN.md '버프·디버프(상태 효과) 설계'.
export const STATUS_DEFS=Object.freeze({
 burn:Object.freeze({id:'burn',name:'화상',kind:'debuff',max:3,seconds:4,color:'#ff7a3d',tick:Object.freeze({hpPct:[0,.01,.02]}),text:'초당 최대 체력 1%(악몽 2%)씩 잃는다'}),
 frost:Object.freeze({id:'frost',name:'동상',kind:'debuff',max:3,seconds:5,color:'#8fd3ff',mods:Object.freeze({attackSpeed:-.12,speed:-.12}),text:'공격·이동 속도 −12%'}),
 curse:Object.freeze({id:'curse',name:'저주',kind:'debuff',max:2,seconds:6,color:'#b98cff',mods:Object.freeze({damage:-.15}),text:'주는 피해 −15%'}),
 corrode:Object.freeze({id:'corrode',name:'부식',kind:'debuff',max:3,seconds:6,color:'#9bd36a',mods:Object.freeze({taken:.1}),text:'받는 피해 +10%'}),
 dispelled:Object.freeze({id:'dispelled',name:'해체됨',kind:'debuff',target:'enemy',max:1,seconds:4,color:'#ffe08a',mods:Object.freeze({taken:.15}),text:'격노·재생이 멈추고 방어 태세가 절반, 받는 피해 +15%'}),
 // 0.149.1: 정화에 성공하면 잠깐 강해진다(정화 스킬 한 칸의 값).
 // 0.149.3 레이드(정예·악몽) 전용: 봉인은 레이드 보스가 주기적으로 거는 디버프(적중과 무관), 신성 보호막은 보스가 두르는 버프.
 sealed:Object.freeze({id:'sealed',name:'봉인',kind:'debuff',max:1,seconds:5,color:'#a98cff',mods:Object.freeze({cooldown:-.6}),text:'스킬 재사용 대기 회복 −60%'}),
 holyShield:Object.freeze({id:'holyShield',name:'신성 보호막',kind:'buff',target:'enemy',max:1,seconds:10,color:'#fff0b0',text:'최대 체력의 일부만큼 피해를 먼저 막는다 — 해체하면 즉시 벗겨진다'}),
 purified:Object.freeze({id:'purified',name:'정화의 기세',kind:'buff',max:1,seconds:5,color:'#fff2a8',mods:Object.freeze({damage:.2}),text:'주는 피해 +20%'}),
});
// Which debuff each boss rule (and raid mechanic) inflicts.
export const RULE_DEBUFF=Object.freeze({fury:'burn',summon:'frost',defense:'curse',regen:'corrode',nightmare:'burn',swarm:'frost',judgement:'curse',armor:'corrode'});
export const DISPEL_SECONDS=4;
// 0.149.3 레이드 패턴: 봉인은 SEAL_EVERY초마다, 신성 보호막은 HOLY_EVERY초마다 최대 체력 × HOLY_SHIELD[단계](10초, 해체로 벗김).
export const SEAL_EVERY=14,HOLY_EVERY=18,HOLY_SHIELD=Object.freeze([0,.04,.06]);
// 정화 태그: 2 equipped → debuff time −30%, 3 → each cleanse heals 4% of max health.
export const PURIFY_RESIST=.3,PURIFY_HEAL=.04,PURIFY_STAMINA=10;
// Alpha 0.149.2 저항: every necklace and earring carries 'debuff time −N%' (N = 2 + rarity (최대 5) + 0~2 from its id, so
// 2~9%). It is derived, not rolled or saved, so drops, rerolls and old saves stay as they were. Total resist caps at 80%.
export const RESIST_CAP=.8;
export function accessoryResist(item){
 if(!item||(item.slot!=='charm'&&item.slot!=='earring')||!Number.isInteger(item.id))return 0;
 return 2+Math.min(5,Math.max(0,item.rarity|0))+(Math.imul(item.id,2654435761)>>>0)%3;
}

const list=t=>t.statuses??=[];
export function hasStatus(t,id,now){return list(t).some(x=>x.id===id&&x.until>now);}
export function statusStacks(t,id,now){return list(t).find(x=>x.id===id&&x.until>now)?.stacks??0;}
// Adds one stack (up to max) and refreshes the time; resist shortens hunter debuffs.
export function applyStatus(t,id,now,{stacks=1,resist=0}={}){
 const d=STATUS_DEFS[id];if(!d)return null;const arr=list(t),seconds=d.seconds*(1-Math.min(RESIST_CAP,Math.max(0,resist)));
 let x=arr.find(x=>x.id===id);if(x&&x.until<=now){x.stacks=0;}
 if(!x){x={id,stacks:0,until:0};arr.push(x);}
 x.stacks=Math.min(d.max,x.stacks+stacks);x.until=now+seconds;x.seconds=seconds;return x;
}
// Drops expired statuses; returns the hunter's damage-over-time for this step (fraction of max health).
export function tickStatuses(t,now,dt,difficulty=1){
 const arr=list(t);let dot=0;for(let i=arr.length-1;i>=0;i--){const x=arr[i];if(x.until<=now){arr.splice(i,1);continue;}const tick=STATUS_DEFS[x.id]?.tick;if(tick?.hpPct)dot+=(tick.hpPct[difficulty]??tick.hpPct.at(-1))*x.stacks*dt;}
 return dot;
}
// Removes up to n kinds of debuff (largest stack first); returns how many were removed.
export function cleanse(t,now,n=Infinity){
 const arr=list(t),bad=arr.filter(x=>STATUS_DEFS[x.id]?.kind==='debuff'&&x.until>now).sort((a,b)=>b.stacks-a.stacks).slice(0,n);
 for(const x of bad)arr.splice(arr.indexOf(x),1);return bad.length;
}
// Summed modifiers of the live statuses on a target: {damage, taken, attackSpeed, speed, cooldown}.
export function statusMods(t,now){
 const out={damage:0,taken:0,attackSpeed:0,speed:0,cooldown:0};for(const x of list(t)){if(x.until<=now)continue;const m=STATUS_DEFS[x.id]?.mods;if(m)for(const [k,v] of Object.entries(m))out[k]+=v*x.stacks;}return out;
}
export function removeStatus(t,id){const arr=list(t),i=arr.findIndex(x=>x.id===id);if(i>=0)arr.splice(i,1);return i>=0;}
export function statusList(t,now){return list(t).filter(x=>x.until>now).map(x=>({id:x.id,name:STATUS_DEFS[x.id].name,color:STATUS_DEFS[x.id].color,stacks:x.stacks,left:x.until-now}));}
