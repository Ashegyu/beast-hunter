// Validated innate powers: combat parameters and generated descriptions share one definition.
// Alpha 0.120: the six weapon powers were measured on real waves (same weapon stats) and tuned to similar damage gains.
const rows=[
 ['echo','weapon','잔향 검격','#e9cd8b',{damage:.55,cooldown:2.5,radius:280}],
 ['storm','weapon','연쇄 번개','#9edee9',{damage:.5,targets:3,cooldown:2.5,radius:230}],
 ['execution','weapon','처형자의 맹세','#eaa4a3',{threshold:.35,bossThreshold:.2,bonus:1}],
 ['blood','weapon','혈월 계약','#ff819d',{threshold:.5,bonus:.6,heal:6}],
 ['frostNova','weapon','빙하 파쇄','#a2e8f0',{damage:.45,duration:2.5,cooldown:3.5,radius:230}],
 ['whirlwind','weapon','폭풍의 원무','#d5e1c0',{rangeBonus:.18}],
 ['barrier','armor','회피 방벽','#c4e9d5',{shield:.18,duration:3,cooldown:8}],
 ['thorns','armor','가시 반격','#e9c689',{ratio:.8,cooldown:1.5,radius:170}],
 ['pulse','armor','완벽 회피 폭발','#b8f3db',{damage:.8,cooldown:2,radius:180}],
 ['frostWard','armor','서리 수호','#b7dff4',{duration:2.5,cooldown:4,radius:200}],
 ['lastStand','armor','불멸의 유언','#ffda9d',{health:.2,invulnerable:1}],
 ['recovery','armor','고요한 회복','#b0d9ad',{quiet:1.5,ratio:.04}],
 ['momentum','charm','회피의 기세','#eed6a0',{duration:2,bonus:.6,stamina:12}],
 ['focus','charm','연격의 호흡','#c5e8b1',{stamina:15,cooldownReduction:1}],
 ['capacitor','charm','파쇄 축전기','#b3dff4',{paidHits:2}],
 ['hunter','charm','추격자의 인장','#e2bf89',{stamina:10,dashReduction:.5,cooldown:.5}],
 ['orbit','charm','회피 별무리','#e5c6fa',{duration:1.2,interval:.4,damage:.25,ticks:3,cooldown:4,radius:145}],
 ['magnet','charm','전리품의 맥박','#90e6dc',{range:90,heal:5,stamina:8,cooldown:1}],
];
const pct=n=>Math.round(n*100)+'%';
function describe(id,r){switch(id){
 case 'echo':return `3연격 마무리 적중 시 전방 충격파. 기본 공격력 ${pct(r.damage)} 피해. 재사용 ${r.cooldown}초.`;
 case 'storm':return `1·2연격 적중 시 주변 다른 괴수 최대 ${r.targets}마리에게 기본 공격력 ${pct(r.damage)} 피해. 재사용 ${r.cooldown}초.`;
 case 'execution':return `체력 ${pct(r.threshold)} 이하 괴수에게 직접 검격 피해 +${pct(r.bonus)}. 보스는 체력 ${pct(r.bossThreshold)} 이하.`;
 case 'blood':return `자신의 체력 ${pct(r.threshold)} 이하에서 직접 검격 피해 +${pct(r.bonus)}. 방어되지 않은 검격 적중 시 체력 ${r.heal} 회복.`;
 case 'frostNova':return `3연격 마무리 적중 시 주변에 기본 공격력 ${pct(r.damage)} 피해와 ${r.duration}초 빙결. 보스 이동 감소 15%. 재사용 ${r.cooldown}초.`;
 case 'whirlwind':return `3연격 마무리가 360도 회전 공격으로 바뀌고 범위가 ${pct(r.rangeBonus)} 증가.`;
 case 'barrier':return `회피 시 최대 체력 ${pct(r.shield)} 보호막을 ${r.duration}초 동안 획득. 재사용 ${r.cooldown}초.`;
 case 'thorns':return `피격 생존 시 가까운 괴수 한 마리에게 받은 피해 ${pct(r.ratio)} 반사. 재사용 ${r.cooldown}초.`;
 case 'pulse':return `완벽 회피에 성공하면 출발 지점 주변에 기본 공격력 ${pct(r.damage)} 피해. 재사용 ${r.cooldown}초.`;
 case 'frostWard':return `피격 생존 시 주변 괴수를 ${r.duration}초 빙결. 재사용 ${r.cooldown}초.`;
 case 'lastStand':return `사냥당 한 번, 치명적인 피해를 체력 ${pct(r.health)}로 버티고 ${r.invulnerable}초 무적. 장비 교체로 충전되지 않음.`;
 case 'recovery':return `이동·공격·피격 없이 ${r.quiet}초 머물면 초당 최대 체력 ${pct(r.ratio)} 회복.`;
 case 'momentum':return `회피 후 ${r.duration}초 안에 시작한 다음 검격 피해 +${pct(r.bonus)}. 적중하면 기력 ${r.stamina} 회복. 빗나가도 소모.`;
 case 'focus':return `3연격 마무리 적중 시 기력 ${r.stamina} 회복, 파쇄 대기 시간 ${r.cooldownReduction}초 감소. 한 검격에 한 번.`;
 case 'capacitor':return `기력을 쓴 파쇄 ${r.paidHits}회 적중 후 다음 파쇄의 기력 소모가 0. 무료 파쇄·반격은 충전하지 않음. 대기 시간은 유지.`;
 case 'hunter':return `처치 시 기력 ${r.stamina} 회복, 회피 대기 시간 ${r.dashReduction}초 감소. 재사용 ${r.cooldown}초.`;
 case 'orbit':return `회피 출발 지점에 ${r.duration}초 별무리 생성. 주변에 ${r.interval}초마다 기본 공격력 ${pct(r.damage)} 피해, 총 ${r.ticks}회. 재사용 ${r.cooldown}초.`;
 case 'magnet':return `수집 거리 +${r.range}. 장비 또는 핵 회수 시 체력 ${r.heal}·기력 ${r.stamina} 회복. 재사용 ${r.cooldown}초.`;
}}
export const UNIQUE_EFFECTS=Object.freeze(Object.fromEntries(rows.map(([id,slot,name,color,parameters])=>[id,Object.freeze({id,slot,name,color,...parameters,description:describe(id,parameters),scales:id!=='capacitor'})])));
export const EFFECT_ROWS=Object.freeze({weapon:Object.freeze(['echo','storm','execution','blood','frostNova','whirlwind']),armor:Object.freeze(['barrier','thorns','pulse','frostWard','lastStand','recovery']),charm:Object.freeze(['momentum','focus','capacitor','hunter','orbit','magnet'])});
export const uniquePower=rarity=>rarity===6?1.5:rarity===5?1.36:1+Math.max(0,Math.min(1,rarity-3))*.12;
