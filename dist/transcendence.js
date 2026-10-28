// Alpha 0.141 초월 (사용자 결정): past Lv.200 every experience point goes to 초월 경험치 (profile.transcendXp, the total ever
// earned). Each 초월 레벨 gives one 초월 포인트 for four abilities that 능력치 단련 does not have; ranks have no cap but lose
// efficiency like 단련 (TRANSCEND_STEPS). Levels and points are computed from the stored total, never stored themselves.
export const TRANSCEND=Object.freeze([
 {id:'might',name:'초월 공격',key:'damagePct',text:'공격력'},
 {id:'life',name:'초월 생명',key:'hpPct',text:'최대 체력'},
 {id:'slayer',name:'초월 사냥',key:'bossDamage',text:'보스에게 주는 피해'},
 {id:'arts',name:'초월 검술',key:'skillDamage',text:'스킬 피해'},
].map(Object.freeze));
export const TRANSCEND_IDS=Object.freeze(TRANSCEND.map(t=>t.id));
export const TRANSCEND_PER_RANK=.01,TRANSCEND_XP_LIMIT=1e12;
// Ranks 1~50 count fully, 51~150 half, 151 and up a quarter.
export const TRANSCEND_STEPS=Object.freeze([[0,1],[50,.5],[150,.25]].map(Object.freeze));
// 초월 레벨 T → T+1 needs 5,000 + 250×T (Lv.200 itself needed 4,140): the 100단계 experience dungeon pays 5,500.
export const transcendNeeded=t=>5000+250*t;
const total=t=>5000*t+125*t*(t-1);
export function transcendLevel(xp){
 const x=Math.max(0,Math.min(TRANSCEND_XP_LIMIT,Number.isFinite(xp)?Math.floor(xp):0));
 let t=Math.max(0,Math.floor((-4875+Math.sqrt(4875*4875+500*x))/250));
 while(total(t+1)<=x)t++;while(t>0&&total(t)>x)t--;
 return t;
}
export const transcendProgress=xp=>{const t=transcendLevel(xp);return {level:t,xp:Math.floor(Math.max(0,xp))-total(t),needed:transcendNeeded(t)};};
export const emptyTranscendence=()=>Object.fromEntries(TRANSCEND_IDS.map(id=>[id,0]));
export function transcendEffective(rank){
 let left=Math.max(0,Math.floor(rank)),out=0;
 for(let i=0;i<TRANSCEND_STEPS.length;i++){const [from,rate]=TRANSCEND_STEPS[i],to=TRANSCEND_STEPS[i+1]?.[0]??Infinity,n=Math.min(left,to-from);out+=n*rate;left-=n;if(!left)break;}
 return out;
}
export const transcendPointsTotal=p=>transcendLevel(p?.transcendXp??0);
export const transcendSpent=p=>TRANSCEND_IDS.reduce((n,id)=>n+(p?.transcendence?.[id]??0),0);
export const transcendPoints=p=>Math.max(0,transcendPointsTotal(p)-transcendSpent(p));
// Restore: whole ranks, and never more than the points the stored experience gives (later ids are trimmed first).
export function cleanTranscendence(raw,points){
 const out=emptyTranscendence();let left=Math.max(0,points|0);
 for(const id of TRANSCEND_IDS){const n=Math.min(left,Math.max(0,Number.isFinite(raw?.[id])?Math.floor(raw[id]):0));out[id]=n;left-=n;}
 return out;
}
export function transcendBonus(p){const out={damagePct:0,hpPct:0,bossDamage:0,skillDamage:0};for(const t of TRANSCEND)out[t.key]=transcendEffective(p?.transcendence?.[t.id]??0)*TRANSCEND_PER_RANK;return out;}
export function transcendStatus(p,id){if(!TRANSCEND_IDS.includes(id))return '능력 없음';if((p?.level??1)<200&&!transcendPointsTotal(p))return 'Lv.200 이후 개방';return transcendPoints(p)>0?'':'초월 포인트 부족';}
