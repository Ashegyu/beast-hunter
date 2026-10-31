// Alpha 0.149 버프·디버프 (사용자 요청 '보스도 걸 수 있고 그걸 해체하는 빌드도'): pure rules, no DOM or storage.
// Statuses live on the battle only (s.player.statuses / e.statuses, never saved). Bosses on 정예·악몽 (and raid 정예·악몽)
// put their rule's debuff on the hunter when their attack lands; 정화 removes hunter debuffs and 해체 shuts a boss's buff
// for a few seconds. Design: GAME_DESIGN.md '버프·디버프(상태 효과) 설계'.
export const STATUS_DEFS=Object.freeze({
 burn:Object.freeze({id:'burn',name:'화상',kind:'debuff',max:3,seconds:4,color:'#ff7a3d',tick:Object.freeze({hpPct:[0,.01,.015]}),text:'초당 최대 체력 1%(악몽 1.5%)씩 잃는다'}),
 frost:Object.freeze({id:'frost',name:'동상',kind:'debuff',max:3,seconds:5,color:'#8fd3ff',mods:Object.freeze({attackSpeed:-.08,speed:-.08}),text:'공격·이동 속도 −8%'}),
 curse:Object.freeze({id:'curse',name:'저주',kind:'debuff',max:2,seconds:6,color:'#b98cff',mods:Object.freeze({damage:-.1}),text:'주는 피해 −10%'}),
 corrode:Object.freeze({id:'corrode',name:'부식',kind:'debuff',max:3,seconds:6,color:'#9bd36a',mods:Object.freeze({taken:.06}),text:'받는 피해 +6%'}),
 dispelled:Object.freeze({id:'dispelled',name:'해체됨',kind:'debuff',target:'enemy',max:1,seconds:4,color:'#ffe08a',text:'격노·재생이 멈추고 방어 태세가 절반'}),
});
// Which debuff each boss rule (and raid mechanic) inflicts.
export const RULE_DEBUFF=Object.freeze({fury:'burn',summon:'frost',defense:'curse',regen:'corrode',nightmare:'burn',swarm:'frost',judgement:'curse',armor:'corrode'});
export const DISPEL_SECONDS=4;
// 정화 태그: 2 equipped → debuff time −30%, 3 → each cleanse heals 4% of max health.
export const PURIFY_RESIST=.3,PURIFY_HEAL=.04;

const list=t=>t.statuses??=[];
export function hasStatus(t,id,now){return list(t).some(x=>x.id===id&&x.until>now);}
export function statusStacks(t,id,now){return list(t).find(x=>x.id===id&&x.until>now)?.stacks??0;}
// Adds one stack (up to max) and refreshes the time; resist shortens hunter debuffs.
export function applyStatus(t,id,now,{stacks=1,resist=0}={}){
 const d=STATUS_DEFS[id];if(!d)return null;const arr=list(t),seconds=d.seconds*(1-Math.min(.8,Math.max(0,resist)));
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
// Summed modifiers of the live statuses on a target: {damage, taken, attackSpeed, speed}.
export function statusMods(t,now){
 const out={damage:0,taken:0,attackSpeed:0,speed:0};for(const x of list(t)){if(x.until<=now)continue;const m=STATUS_DEFS[x.id]?.mods;if(m)for(const [k,v] of Object.entries(m))out[k]+=v*x.stacks;}return out;
}
export function statusList(t,now){return list(t).filter(x=>x.until>now).map(x=>({id:x.id,name:STATUS_DEFS[x.id].name,color:STATUS_DEFS[x.id].color,stacks:x.stacks,left:x.until-now}));}
