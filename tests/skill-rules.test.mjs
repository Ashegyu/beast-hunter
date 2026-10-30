import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';

// Alpha 0.146.0 규칙 갈래 (사용자 요청 '갈래가 단순하고 비슷하다, 빌드가 단순하다'): tiers 2·3 change how a skill works,
// passives add build rules, and equipped skills of one tag add up.
const run=(s,seconds)=>{for(let t=0;t<seconds;t+=.025)g.advanceGame(s,.025);};
function give(p,id,t,i){const d=g.SKILL_BY_ID[id];p.skillBook.ranks[id]=d.kind==='ultimate'?19:14;p.skillBook.branchOwned[id]=(p.skillBook.branchOwned[id]??0)|(1<<(t*3+i));const list=Array.isArray(p.skillBook.branchPick[id])?p.skillBook.branchPick[id]:Array(g.branchTierCount(id)).fill(null);list[t]=i;p.skillBook.branchPick[id]=list;}
function fight({skills=[],passives=[],branches=[],enemies=[[0,110]]}={}){
 const p=g.createProfile();p.level=200;p.skillBook=g.restoreSkillBook(null,200);p.skillBook.ranks={};
 p.skillBook.loadout={active:[null,null,null,null],passive:[null,null,null],ultimate:[null],beast:[null]};
 for(const id of skills){const d=g.SKILL_BY_ID[id];const l=p.skillBook.loadout[d.kind];l[l.indexOf(null)]=id;p.skillBook.ranks[id]=d.kind==='ultimate'?19:14;}
 for(const id of passives){p.skillBook.loadout.passive[p.skillBook.loadout.passive.indexOf(null)]=id;p.skillBook.ranks[id]=14;}
 for(const [id,t,i] of branches)give(p,id,t,i);
 const s=g.createGame(p);g.launch(s);
 s.spawns=enemies.map(([x,y],k)=>({id:800+k,type:'bulwark',x:s.player.x+x,y:s.player.y+y,delay:0,warning:1}));g.advanceGame(s,.001);s.spawns=[];s.barrels=[];s.player.invulnerable=100;s.run.flow='combat';
 for(const e of s.enemies){e.hp=e.maxHp=1e6;e.guard=e.guardMax=0;e.cooldown=1e4;e.speed=0;e.plate=0;}
 return {s,p,es:s.enemies};
}
const lost=e=>e.maxHp-e.hp;
const cast=(s,id,aim={x:0,y:1})=>{s.skillRuntime.casting=null;s.skillRuntime.cooldowns[id]=0;s.player.stamina=100;s.player.action='idle';return g.useSkill(s,id,aim);};

test('every branch of every skill can be picked and cast in a real fight without errors or runaway work', () => {
 for(const id of Object.keys(g.SKILL_BRANCHES)){const d=g.SKILL_BY_ID[id];
  for(let t=0;t<g.branchTierCount(id);t++)for(let i=0;i<3;i++){
   const caster=d.kind==='passive'?'crescent':id,{s,es}=fight({skills:[caster],passives:d.kind==='passive'?[id]:[],branches:[[id,t,i]],enemies:[[0,110],[60,150],[-60,150]]});
   for(const e of es)e.bleedTicks=2,e.bleedTimer=.8,e.bleedDamage=1;
   assert.ok(cast(s,caster),id+' '+t+'/'+i);run(s,4);assert.ok(s.skillRuntime.jobs.length<=128,id);
   if(!['stance','bloodblade','mark','phantoms','parry'].includes(caster))assert.ok(es.some(e=>lost(e)>0),id+' '+t+'/'+i+' hit nothing');
  }}
});

test('분열 sends the skill ±22° as well; a target off the straight line is hit only with it', () => {
 const off=[Math.sin(22*Math.PI/180)*290,Math.cos(22*Math.PI/180)*290];
 const plain=fight({skills:['crescent'],enemies:[[0,110],off]});cast(plain.s,'crescent');run(plain.s,1.5);assert.equal(lost(plain.es[1]),0);
 const fan=fight({skills:['crescent'],branches:[['crescent',1,0]],enemies:[[0,110],off]});cast(fan.s,'crescent');run(fan.s,1.5);assert.ok(lost(fan.es[1])>0);
 assert.ok(Math.abs(lost(fan.es[1])/lost(plain.es[0])-.5)<.05,'a copy deals half');
});

test('잔향 strikes again, 잔류 영역 keeps cutting, 끌어당김 drags common monsters in', () => {
 const a=fight({skills:['draw']}),b=fight({skills:['draw'],branches:[['draw',1,0]]});cast(a.s,'draw');cast(b.s,'draw');run(a.s,2);run(b.s,2);
 assert.ok(Math.abs(lost(b.es[0])/lost(a.es[0])-1.5)<.05,'이단 발도 +50%');
 const z=fight({skills:['plunge'],branches:[['plunge',1,0]]});cast(z.s,'plunge');run(z.s,1);const after=lost(z.es[0]);run(z.s,2.5);assert.ok(lost(z.es[0])>after,'여진 keeps hitting');
 const pull=fight({skills:['dance'],branches:[['dance',1,0]],enemies:[[0,150]]}),y0=pull.es[0].y;cast(pull.s,'dance');run(pull.s,1.5);assert.ok(Math.abs(pull.es[0].y-pull.s.player.y)<Math.abs(y0-pull.s.player.y)-30);
});

test('출혈 폭발 and 빙결 파쇄 cash in statuses; 연쇄 jumps to nearby enemies', () => {
 const plain=fight({skills:['crescent']}),det=fight({skills:['crescent'],branches:[['crescent',2,0]]});
 for(const {es} of [plain,det]){es[0].bleedTicks=3;es[0].bleedTimer=5;es[0].bleedDamage=1;}
 cast(plain.s,'crescent');cast(det.s,'crescent');run(plain.s,.6);run(det.s,.6);
 assert.equal(det.es[0].bleedTicks,0,'the bleed is spent');assert.ok(lost(det.es[0])>lost(plain.es[0])*1.3);
 const cold=fight({skills:['draw'],branches:[['draw',2,0]]}),warm=fight({skills:['draw'],branches:[['draw',2,0]]});cold.es[0].chillRemaining=3;
 cast(cold.s,'draw');cast(warm.s,'draw');run(cold.s,1);run(warm.s,1);assert.ok(Math.abs(lost(cold.es[0])/lost(warm.es[0])-1.6)<.06,'참철 +60% on a frozen enemy');assert.equal(cold.es[0].chillRemaining,0);
 const chain=fight({skills:['seeking'],branches:[['seeking',1,0]],enemies:[[0,200],[120,260],[-120,260],[0,900]]});cast(chain.s,'seeking');run(chain.s,2);
 assert.ok(lost(chain.es[1])>0&&lost(chain.es[2])>0,'jumps to the two close ones');assert.equal(lost(chain.es[3]),0,'not across the field');
});

test('처치 시 재사용 감소, 누적, 연계 (prime → the next skill of the tag) and 연계 시 (primed)', () => {
 const k=fight({skills:['draw'],branches:[['draw',2,1]]});k.es[0].hp=1;cast(k.s,'draw');const full=g.skillCooldown(k.p,'draw');run(k.s,.8);assert.ok(k.s.skillRuntime.cooldowns.draw<full-2.5,'결단 −3s on a kill');
 const st=fight({skills:['dance'],branches:[['dance',2,0]]});cast(st.s,'dance');const first=st.s.skillRuntime.jobs[0].root.damage;run(st.s,1.6);cast(st.s,'dance');const second=st.s.skillRuntime.jobs.find(j=>j.root.serial>1).root.damage;assert.ok(Math.abs(second/first-1.12)<1e-6);
 const solo=fight({skills:['draw']});cast(solo.s,'draw');const base=solo.s.skillRuntime.jobs[0].root.damage;
 const pr=fight({skills:['gale','draw'],branches:[['gale',2,1]]});cast(pr.s,'gale');run(pr.s,.6);cast(pr.s,'draw');const boosted=pr.s.skillRuntime.jobs.find(j=>j.root.id==='draw').root.damage;assert.ok(Math.abs(boosted/base-1.3)<1e-6,'질풍 연계 +30% to 일격');
 assert.equal(pr.s.skillRuntime.prime,null,'a prime is spent once');
 const pd=fight({skills:['crescent','draw'],branches:[['draw',1,2]]});cast(pd.s,'crescent');run(pd.s,.6);cast(pd.s,'draw');assert.ok(Math.abs(pd.s.skillRuntime.jobs.find(j=>j.root.id==='draw').root.damage/base-1.3)<1e-6,'쾌도 +30% right after another skill');
});

test('after-buffs, hp cost, drain and skill-only rules (자세 반격, 표식 전염, 군무 폭발, 흘려베기 되감기)', () => {
 const gd=fight({skills:['dance'],branches:[['dance',1,2]]});cast(gd.s,'dance');assert.deepEqual(gd.s.skillRuntime.buffs.map(b=>[b.kind,b.value]),[['guard',20]],'방패 윤무');
 const hp=fight({skills:['draw'],branches:[['draw',2,2]]});const before=hp.s.player.hp;cast(hp.s,'draw');assert.ok(Math.abs(before-hp.s.player.hp-hp.s.player.maxHp*.05)<1e-6);
 const dr=fight({skills:['dance'],branches:[['dance',2,2]]});dr.s.player.hp=dr.s.player.maxHp*.5;const low=dr.s.player.hp;cast(dr.s,'dance');run(dr.s,1.6);assert.ok(dr.s.player.hp>low,'흡혈 윤무 heals');assert.ok(dr.s.player.hp-low<=dr.s.player.maxHp*.06+1e-6,'≤6% per cast');
 const mk=fight({skills:['mark'],branches:[['mark',1,0]],enemies:[[0,150],[80,200],[-80,200]]});cast(mk.s,'mark');const marked=mk.es.find(e=>e.skillMark);marked.skillMark.count=marked.skillMark.need-1;
 g.attack?.(mk.s);run(mk.s,1.2);assert.ok(mk.es.filter(e=>e!==marked&&e.skillMark).length>=1,'전염 표식 passes marks on');
 const ph=fight({skills:['phantoms'],branches:[['phantoms',2,0]],enemies:[[0,150],[150,150]]});cast(ph.s,'phantoms');run(ph.s,8.2);assert.ok(ph.es.every(e=>lost(e)>0),'잔상 폭발 hits around at the end');
});

test('passive build rules and tag synergy reach the skills they name', () => {
 const bleed=fight({skills:['crescent'],passives:['scar'],branches:[['scar',2,0]]});cast(bleed.s,'crescent');run(bleed.s,.5);assert.ok(bleed.es[0].bleedTicks>0,'피의 검흔: every skill hit bleeds');
 const tag=fight({skills:['crescent','seeking','returning','eclipse']});const syn=g.tagSynergy(tag.p).wave;assert.equal(syn.count,4);assert.ok(syn.rows.every(r=>r.active));
 const m=g.branchMods(tag.p,'crescent');assert.ok(Math.abs(m.damage-1.08*1.08)<1e-9);assert.equal(m.area,1.15);assert.equal(m.refundKill,.5);
 assert.equal(g.branchMods(tag.p,'draw').damage,undefined,'untagged skills get nothing');
 const tb=fight({skills:['crescent'],passives:['recovery'],branches:[['recovery',2,0]]});assert.ok(Math.abs(g.branchMods(tb.p,'crescent').damage-1.2)<1e-9,'검기 극의 +20%');
 const cut=fight({skills:['crescent'],passives:['footwork'],branches:[['footwork',1,2]]});assert.equal(g.skillCost(cut.p,'crescent'),g.SKILL_BY_ID.crescent.cost-3);
 const ks=fight({skills:['crescent'],passives:['momentum'],branches:[['momentum',1,0]]});ks.es[0].hp=1;ks.s.player.stamina=10;cast(ks.s,'crescent');const st=ks.s.player.stamina;run(ks.s,.6);assert.ok(ks.s.player.stamina>=st+5,'처치 시 기력');
});
