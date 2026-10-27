// Alpha 0.133 60챕터 캠페인 시뮬레이션: 정책별로 관문·난이도 곡선을 확인한다.
// 사용: node tools/simulate-campaign0133.mjs <dist 폴더> <시드> [마지막 챕터] [정책] [프로필 저장 폴더]
// 정책
//  idle   방치: 고정 빌드, 새 장비 착용·단련 포인트 자동 사용만. 강화·승급·파밍 없음.
//  spec   스펙업: 고정 빌드 + 강화·승급 + 막히면 앞 스테이지 한 번과 강화·골드·승급 던전을 한 번씩 파밍.
//  switch 빌드 전환 + 스펙업: 다음 관문 유형에 맞춰 성장 트리 갈래와 스킬 예시를 바꾼다.
//  adapt  빌드 전환만: 강화·승급·파밍 없음.
// 고정 빌드 = 트리 검귀→수호자, 스킬 예시 '자동 광역'. 한 스테이지에서 15번(STUCK_AFTER) 실패하면 STUCK.
// STARS=1이면 스테이지 클리어마다 받은 별(30초 별·체력 별)을 모아 끝에 스테이지별·지역별 비율을 출력한다.
import fs from 'node:fs';
import path from 'node:path';
const dist=path.resolve(process.argv[2]||'dist');
const g=await import(new URL('file://'+dist+'/game-engine.js').href);
const loot=await import(new URL('file://'+dist+'/loot.js').href);
const SEED=Number(process.argv[3]||0),LAST=Number(process.argv[4]||60),POLICY=process.argv[5]||'spec',DUMP=process.argv[6]||null;
const HPLOG=process.env.HPLOG==='1',hpLog=[];
const STARS=process.env.STARS==='1',starSeen=new Set(),starLog=[];
const SPEC=POLICY==='spec'||POLICY==='switch',SWITCH=POLICY==='switch'||POLICY==='adapt';
// 0.139 성장 트리 그물: a region's nodes in definition order (learnable in that order), keystones (핵심, mostly with a drawback) last;
// the fixed build takes 검귀 then 수호자.
const region=r=>{const ids=g.TREE_ORDER.filter(id=>id.startsWith(r+'-'));return [...ids.filter(id=>g.TREE_NODES[id].kind!=='keystone'),...ids.filter(id=>g.TREE_NODES[id].kind==='keystone')];};
const BRANCHES={blade:region('blade'),ward:region('ward'),art:region('art')};
const FIXED_TREE=[...BRANCHES.blade,...BRANCHES.ward];
const EXAMPLE={survival:2,swarm:1,single:0,defense:3,armor:0};
function treeFor(type){if(!type)return FIXED_TREE;const first=type==='armor'?'blade':g.GATE_TYPES[type].branch;return [...BRANCHES[first],...FIXED_TREE.filter(id=>!id.startsWith(first)),...Object.values(BRANCHES).flat()];}
// The first hard stage from the checkpoint: stage 4 (철갑 진군, 장갑) or a gate.
function nextGate(ch,from){for(let n=from;n<=10;n++){if(n===4)return 'armor';const gate=g.stageGate(ch,n);if(gate)return gate.type;}return null;}
function prepare(s,type){const p=s.profile;
 for(const pos of g.EQUIPMENT_KEYS){const slot=g.itemSlotForPosition(pos);const used=Object.entries(p.equipment).filter(([k])=>k!==pos).map(([,v])=>v);const rows=p.inventory.filter(i=>i.slot===slot&&!used.includes(i.id)).sort((a,b)=>loot.itemPower(b)-loot.itemPower(a));if(rows[0]&&p.equipment[pos]!==rows[0].id&&loot.itemPower(rows[0])>(p.inventory.find(i=>i.id===p.equipment[pos])?loot.itemPower(p.inventory.find(i=>i.id===p.equipment[pos])):-1))g.equipItem(s,rows[0].id,pos);}
 if(SPEC)for(let round=0;round<400;round++){let any=false;for(const id of Object.values(p.equipment)){if(!id)continue;const r=g.enhanceItem(s,id);if(r.ok)any=true;else if(g.promoteItem(s,id).ok)any=true;}if(!any)break;}
 const tree=SWITCH?treeFor(type):FIXED_TREE;if(SWITCH)g.resetGrowthTree(s);for(let any=true;any;){any=false;for(const id of tree)if(!p.growthTree.includes(id)&&g.learnGrowthNode(s,id))any=true;}
 {let any=true;while(any){any=false;for(const id of ['power','vitality','guard','tempo','precision'])if(g.trainStat(s,id))any=true;}}
 g.applySkillExample(s,SWITCH&&type?EXAMPLE[type]:1);
 if(g.skillRank(p,'bloodmoon')&&!p.skillBook.loadout.ultimate[0])g.equipSkill(s,'bloodmoon',0);
 if(p.level>=g.SKILL_BY_ID.finisher.unlock&&!p.skillBook.loadout.passive.includes('finisher')){g.upgradeSkill(s,'finisher');if(g.skillRank(p,'finisher'))g.equipSkill(s,'finisher',0);}
 for(const id of [...p.skillBook.loadout.active,...p.skillBook.loadout.passive,...p.skillBook.loadout.ultimate])if(id)while(g.upgradeSkill(s,id)){}
}
const p=g.createProfile(1000);p.hunts=SEED;const s=g.createGame(p);s.auto=true;let attempts=0,farms=0,dungeons=0;const fails={},t0=Date.now();let stuck=null;
// MODES=1 (0.139 난이도 개편): after 일반 60장, carry on through 정예 1~60장 and then 악몽 1~60장 in order (each mode opens
// only when every chapter of the one below is cleared, then chapter by chapter), with the same retry/farming/STUCK rules.
const MODES=process.env.MODES==='1',TAG=['ch','e','n'];
if(DUMP)fs.mkdirSync(DUMP,{recursive:true});
// ENDGAME=1 (0.139): in 정예/악몽 every attempt is one in-game day: first that day's 보스 러시 entries (seal shards and seals) and,
// across a week, the three raids three times each, then 인장 성장 on the worn seal as far as shards and gold allow.
const ENDGAME=process.env.ENDGAME==='1';let simNow=Date.UTC(2026,0,5,3),rushes=0,raidRuns=0,raidClears=0;
function fight(){for(let i=0;i<24000&&s.phase==='playing';i++)g.advanceGame(s,.05);const won=s.phase==='victory';g.returnToCamp(s);return won;}
function endgameDay(){simNow+=864e5;
 while(g.launchBossRush(s,simNow)){fight();rushes++;}
 for(const r of g.RAIDS)while(g.launchRaid(s,r.id,simNow)){prepare(s,null);if(fight())raidClears++;raidRuns++;}
 prepare(s,null);const seal=p.equipment.special;if(seal)while(g.growSealItem(s,seal).ok){}}
const legs=[[0,LAST],...(MODES&&LAST>=g.STAGES.length?[[1,g.STAGES.length],[2,g.STAGES.length]]:[])];
for(const [d,last] of legs){if(stuck)break;
for(let ch=1;ch<=last&&!stuck;ch++){let won=false,tries=0;
 if(DUMP)fs.writeFileSync(path.join(DUMP,`${TAG[d]}${ch}.json`),g.encodeProfile(p,1000));
 if(d&&!g.bossModeAvailable(p,ch,d)){stuck={difficulty:d,chapter:ch,stage:0,gate:null,closed:true};break;}
 const failSeen={};
 for(let a=0;!won;a++){if(ENDGAME&&d)endgameDay();const from=g.stageLimit(p,ch,d)||1;prepare(s,nextGate(ch,from));attempts++;tries++;g.launch(s,ch,from,null,d);let hpStage=s.run.stage,hpPrev=s.player.hp,hurt=0,heal=0;for(let i=0;i<24000&&s.phase==='playing';i++){g.advanceGame(s,.05);if(HPLOG&&!d){if(s.run.stage!==hpStage||s.phase!=='playing'){hpLog.push([ch,hpStage,hurt/s.player.maxHp,heal/s.player.maxHp]);hpStage=s.run.stage;hurt=heal=0;hpPrev=s.player.hp;}else{const dh=s.player.hp-hpPrev;if(dh<0)hurt-=dh;else heal+=dh;hpPrev=s.player.hp;}}if(STARS&&!d)for(const f of s.effects)if(f.type==='stageClear'&&!starSeen.has(f.id)){starSeen.add(f.id);starLog.push([ch,f.stage,f.stars]);}}
  if(s.phase==='victory'){won=true;g.returnToCamp(s);break;}
  const st=s.run.stage,k=TAG[d]+ch+'-'+st,gate=g.stageGate(ch,st);fails[k]=(fails[k]??0)+1;failSeen[st]=(failSeen[st]??0)+1;g.returnToCamp(s);
  if(failSeen[st]>=(Number(process.env.STUCK_AFTER)||15)){stuck={difficulty:d,chapter:ch,stage:st,gate:gate?.type??null};break;}
  if(SPEC&&st>1){prepare(s,nextGate(ch,st-1));g.launch(s,ch,st-1,null,d);for(let i=0;i<2400&&s.phase==='playing'&&s.run.stage===st-1;i++)g.advanceGame(s,.05);farms++;g.returnToCamp(s);}
  if(SPEC)for(const id of ['enhance','gold','promote']){prepare(s,null);if(!g.launchDungeon(s,id,g.dungeonLimit(p,id)))continue;for(let i=0;i<2400&&s.phase==='playing';i++)g.advanceGame(s,.05);dungeons++;g.returnToCamp(s);}}
 const gear=Object.values(p.equipment).filter(Boolean).map(id=>p.inventory.find(i=>i.id===id));const enh=gear.reduce((a,i)=>a+(i.enhancement??0),0)/Math.max(1,gear.length),rar=gear.reduce((a,i)=>a+i.rarity,0)/Math.max(1,gear.length);
 const stt=g.playerStats(p);
 console.log(`${POLICY} seed${SEED} ${TAG[d]}${ch} ${won?'clear':'STUCK'} tries=${tries} Lv${p.level} dmg=${Math.round(stt.damage)} hp=${Math.round(stt.maxHp)} gear+${enh.toFixed(1)} r${rar.toFixed(1)}${ENDGAME&&d?` day${Math.round((simNow-Date.UTC(2026,0,5,3))/864e5)} seal${p.inventory.find(i=>i.id===p.equipment.special)?.seal?.level??'-'} anc${p.inventory.filter(i=>i.rarity===5&&Object.values(p.equipment).includes(i.id)).length}`:''} ${Math.round((Date.now()-t0)/1000)}s`);
}}
console.log(`${POLICY} seed${SEED} attempts=${attempts} farms=${farms} dungeons=${dungeons} stuck=${JSON.stringify(stuck)} fails=${JSON.stringify(fails)}`);
if(MODES){const cleared=d=>p.bossMastery.filter(m=>m>=d).length;console.log('난이도 진행: 일반',cleared(0),'· 정예',cleared(1),'· 악몽',cleared(2),'챕터');}
if(ENDGAME){const seal=p.inventory.find(i=>i.id===p.equipment.special);console.log('엔드 콘텐츠:',Math.round((simNow-Date.UTC(2026,0,5,3))/864e5),'일 · 보스 러시',rushes,'회 · 레이드',raidRuns,'회(클리어',raidClears+') · 인장',seal?seal.seal.grade+' '+seal.seal.level+'단계':'없음','· 고대',p.inventory.filter(i=>i.rarity===5&&Object.values(p.equipment).includes(i.id)).length,'점 착용');}
if(STARS){const rate=key=>{const out={};for(const [c,st,m] of starLog){const k=key(c,st);out[k]??={n:0,fast:0,hp:0};out[k].n++;if(m&2)out[k].fast++;if(m&4)out[k].hp++;}return Object.entries(out).map(([k,v])=>k+':'+v.n+'회 30초 '+Math.round(v.fast/v.n*100)+'% 체력 '+Math.round(v.hp/v.n*100)+'%').join(' | ');};
 console.log('별 스테이지별',rate((c,st)=>st));console.log('별 지역별',rate(c=>Math.ceil(c/10)+'지역'));}
if(HPLOG){const by={};for(const [c,st,h,r] of hpLog){const k=Math.ceil(c/10)+'지역 '+(st===10?'보스':'일반');by[k]??={n:0,h:0,r:0};by[k].n++;by[k].h+=h;by[k].r+=r;}
 console.log('스테이지당 받은 피해·회복(최대 체력 대비)',Object.entries(by).map(([k,v])=>k+' 피해 '+Math.round(v.h/v.n*100)+'% 회복 '+Math.round(v.r/v.n*100)+'%').join(' | '));}
