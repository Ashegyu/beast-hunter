// Only a captured hunt mode controls combat and rewards. Selection consumes no RNG.
export const HUNT_MODES=Object.freeze([
 // Alpha 0.139: health, damage and boss gold come from chapters.js modeScale (정예 N장 = chapter 60+N, 악몽 = 120+N);
// `xp` scales the experience of kills (악몽 gives none: records and rewards only).
 {id:0,name:'일반',shots:0,shotSpeed:1,xp:1,extraCore:0,ancientChance:0},
 {id:1,name:'정예',shots:2,shotSpeed:1.05,xp:1,extraCore:1,ancientChance:0},
 {id:2,name:'악몽',shots:4,shotSpeed:1.1,xp:0,extraCore:2,ancientChance:0},
].map(m=>Object.freeze(m)));
export function huntMode(id){return Number.isInteger(id)&&id>=0&&id<HUNT_MODES.length?HUNT_MODES[id]:null;}
export const REPLAY_CYCLES=Object.freeze([
 null,
 Object.freeze([['slam','volley','charge','slam'],['volley','charge','slam','volley'],['charge','slam','volley','charge']].map(Object.freeze)),
 Object.freeze([['volley','charge','slam','charge','volley','slam'],['volley','volley','charge','slam','volley','charge'],['charge','volley','slam','volley','charge','slam']].map(Object.freeze)),
]);
export const BOSS_DROP_TABLES=Object.freeze(HUNT_MODES.map(m=>Object.freeze([0,0,82-(m.ancientChance-.3),15,2.7,m.ancientChance])));
