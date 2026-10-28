// One bound shared by loot storage, crafting, recovery and UI.
// Alpha 0.142: 200 -> 2000 (사용자 요청). About 206 bytes per saved item (more for 고대), so a full bag is ~0.4-0.6 MB.
export const INVENTORY_LIMIT=2000,MAX_PENDING_LOOT=24;

// Alpha 0.142 가방 정리 규칙 (사용자 요청 '특정 등급 이하 전체 분해 + 장비별 개수 설정, 개수를 넘으면 새 장비와 기존 장비를
// 합쳐 등급 낮은 순으로 자동 분해'). profile.bagRules = {grade, auto, limits}: grade is the chosen 등급 (0 일반 … 4 신화) for the
// one-press bulk dismantle and, when auto is on, for dismantling new drops at or below it. limits[slot] is how many items of each
// 부위 the bag keeps. The total INVENTORY_LIMIT still applies on top.
export const BAG_SLOTS=Object.freeze(['weapon','helmet','armor','pants','boots','charm','earring','special']);
// BAG_LIMIT_MAX (= INVENTORY_LIMIT) means 제한 없음; that is the default so an old save never loses gear just by updating.
export const BAG_LIMIT_DEFAULT=INVENTORY_LIMIT,BAG_LIMIT_MIN=5,BAG_LIMIT_MAX=INVENTORY_LIMIT,BAG_LIMIT_STEP=5,BAG_GRADE_MAX=4;
export const emptyBagRules=()=>({grade:0,auto:false,limits:Object.fromEntries(BAG_SLOTS.map(slot=>[slot,BAG_LIMIT_DEFAULT]))});
const whole=(v,lo,hi,fallback)=>Number.isFinite(v)?Math.max(lo,Math.min(hi,Math.round(v))):fallback;
export function cleanBagRules(raw){
 const out=emptyBagRules();if(!raw||typeof raw!=='object')return out;
 out.grade=whole(raw.grade,0,BAG_GRADE_MAX,0);out.auto=raw.auto===true;
 for(const slot of BAG_SLOTS)out.limits[slot]=whole(raw.limits?.[slot],BAG_LIMIT_MIN,BAG_LIMIT_MAX,BAG_LIMIT_DEFAULT);
 return out;
}
