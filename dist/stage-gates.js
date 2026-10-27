// Alpha 0.133 관문: stages that a build without the right answer (or without more spec) cannot clear.
// Every chapter boss is a gate of its biome's type, and every chapter has one more stage gate (stage 6, 7 or 9)
// of another type. A gate adds a pressure that grows region by region:
//  · 생존 (survival): enemies deal more damage          → 수호자 갈래 · 방어 스킬
//  · 광역 (swarm): ordinary monsters have more health     → 검술사 갈래 · 광역 스킬
//  · 단일 화력 (single): elites and bosses have more health → 검귀 갈래 · 일격 스킬
//  · 방어 태세 (defense): enemies take less damage        → 검술사 갈래 · 순간 화력 스킬 (at a defense-rule boss's weak point the cut shrinks by the counter)
// 대응 (counter, 0~1) = matching tree nodes × .15 (max .75) + matching equipped skills × .1 (max .4), at most 1;
// the counter removes up to 75% of the pressure. Raw spec (gear, training) also gets through: it just takes more.
import {CHAPTERS,CHAPTERS_PER_THEME} from './chapters.js?v=0.136.1';
export const GATE_TYPES=Object.freeze({
 survival:Object.freeze({id:'survival',short:'수호자 갈래·방어 스킬',name:'생존 관문',effect:'적이 주는 피해',branch:'ward',branchName:'수호자',skills:Object.freeze(['stance','parry','resolve','reserve','breath']),hint:'수호자 갈래 · 수월의 자세 · 흘려베기 · 적월의 결의'}),
 swarm:Object.freeze({id:'swarm',short:'검술사 갈래·광역 스킬',name:'광역 관문',effect:'일반 괴수 체력',branch:'art',branchName:'검술사',skills:Object.freeze(['gather','dance','field','crescent','triple','bloodmoon','surrounded']),hint:'검술사 갈래 · 월쇄 · 윤무 · 잔월진 · 적월난무'}),
 single:Object.freeze({id:'single',short:'검귀 갈래·일격 스킬',name:'단일 화력 관문',effect:'정예·보스 체력',branch:'blade',branchName:'검귀',skills:Object.freeze(['breach','draw','mark','plunge','eclipse','lone','scar']),hint:'검귀 갈래 · 파갑참 · 발도 · 월영 표식 · 고독한 사냥'}),
 defense:Object.freeze({id:'defense',short:'검술사 갈래·순간 화력 스킬',name:'방어 태세 관문',effect:'적이 받는 피해 감소',branch:'art',branchName:'검술사',skills:Object.freeze(['draw','mark','eclipse','plunge','bloodblade','echo','imbalance']),hint:'검술사 갈래 · 발도 · 월영 표식 · 혈월의 칼날 · 월식'}),
});
export const GATE_IDS=Object.freeze(Object.keys(GATE_TYPES));
export const BOSS_GATE_BY_RULE=Object.freeze({regen:'single',fury:'survival',summon:'swarm',defense:'defense'});
export const GATE_STAGES=Object.freeze([7,9,6]);
// Pressure (+share) of a chapter's gates: small at first, rising every chapter with a step at every region; bosses ×1.1.
export const GATE_PRESSURE=Object.freeze({start:.4,ramp:.012,region:.15,boss:1.1});
export const COUNTER_REDUCTION=.75;
export function gatePressure(chapter,boss=false){const i=chapter-1,region=Math.floor(i/CHAPTERS_PER_THEME);return Math.round((GATE_PRESSURE.start+GATE_PRESSURE.ramp*i+GATE_PRESSURE.region*region)*(boss?GATE_PRESSURE.boss:1)*1000)/1000;}
// The gate of a chapter's stage, or null.
export function stageGate(chapter,stage){
 const row=CHAPTERS[chapter-1];if(!row)return null;
 const bossType=BOSS_GATE_BY_RULE[row.bossRule]??'single';
 if(stage===10)return Object.freeze({type:bossType,boss:true,pressure:gatePressure(chapter,true)});
 const others=GATE_IDS.filter(t=>t!==bossType),at=GATE_STAGES[(chapter-1)%GATE_STAGES.length];
 return stage===at?Object.freeze({type:others[(chapter-1)%others.length],boss:false,pressure:gatePressure(chapter)}):null;
}
export function gateCounter(p,type){
 const g=GATE_TYPES[type];if(!g)return 0;const tree=p?.growthTree??[],loadout=p?.skillBook?.loadout??{};
 const nodes=tree.filter(id=>typeof id==='string'&&id.startsWith(g.branch)).length,equipped=new Set(Object.values(loadout).flat().filter(Boolean));
 const skills=g.skills.filter(id=>equipped.has(id)).length;
 return Math.round(Math.min(1,Math.min(.75,nodes*.15)+Math.min(.4,skills*.1))*1000)/1000;
}
// What the gate does to this profile's run: the remaining pressure after the build's counter.
export function gateEffect(p,gate){if(!gate)return null;const counter=gateCounter(p,gate.type);return {...gate,counter,effect:Math.round(gate.pressure*(1-COUNTER_REDUCTION*counter)*1000)/1000};}
export function gateText(g){const t=GATE_TYPES[g.type],pct=Math.round(g.effect*100);return t.name+' · '+t.effect+(g.type==='defense'?' '+Math.round(100-100/(1+g.effect))+'%':' +'+pct+'%')+' · 대응 '+Math.round(g.counter*100)+'% ('+t.short+')';}
