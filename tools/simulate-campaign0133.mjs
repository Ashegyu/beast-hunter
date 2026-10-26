// Alpha 0.133 60챕터 캠페인 시뮬레이션: 정책별로 관문·난이도 곡선을 확인한다.
// 사용: node tools/simulate-campaign0133.mjs <dist 폴더> <시드> [마지막 챕터] [정책] [프로필 저장 폴더]
// 정책
//  idle   방치: 고정 빌드, 새 장비 착용·단련 포인트 자동 사용만. 강화·승급·파밍 없음.
//  spec   스펙업: 고정 빌드 + 강화·승급 + 막히면 앞 스테이지 한 번과 강화·골드·승급 던전을 한 번씩 파밍.
//  switch 빌드 전환 + 스펙업: 다음 관문 유형에 맞춰 성장 트리 갈래와 스킬 예시를 바꾼다.
//  adapt  빌드 전환만: 강화·승급·파밍 없음.
// 고정 빌드 = 트리 검귀→수호자, 스킬 예시 '자동 광역'. 한 스테이지에서 15번 실패하면 STUCK.
import fs from 'node:fs';
import path from 'node:path';
const dist=path.resolve(process.argv[2]||'dist');
const g=await import(new URL('file://'+dist+'/game-engine.js').href);
const loot=await import(new URL('file://'+dist+'/loot.js').href);
const SEED=Number(process.argv[3]||0),LAST=Number(process.argv[4]||60),POLICY=process.argv[5]||'spec',DUMP=process.argv[6]||null;
const SPEC=POLICY==='spec'||POLICY==='switch',SWITCH=POLICY==='switch'||POLICY==='adapt';
const FIXED_TREE=['blade1','blade2','ward1','ward2','blade3','blade4','blade5','ward3','ward4','ward5'];
const BRANCHES={blade:['blade1','blade2','blade3','blade4','blade5'],ward:['ward1','ward2','ward3','ward4','ward5'],art:['art1','art2','art3','art4','art5']};
const EXAMPLE={survival:2,swarm:1,single:0,defense:3,armor:0};
function treeFor(type){if(!type)return FIXED_TREE;const first=type==='armor'?'blade':g.GATE_TYPES[type].branch;return [...BRANCHES[first],...FIXED_TREE.filter(id=>!id.startsWith(first)),...Object.values(BRANCHES).flat()];}
// The first hard stage from the checkpoint: stage 4 (철갑 진군, 장갑) or a gate.
function nextGate(ch,from){for(let n=from;n<=10;n++){if(n===4)return 'armor';const gate=g.stageGate(ch,n);if(gate)return gate.type;}return null;}
function prepare(s,type){const p=s.profile;
 for(const pos of g.EQUIPMENT_KEYS){const slot=g.itemSlotForPosition(pos);const used=Object.entries(p.equipment).filter(([k])=>k!==pos).map(([,v])=>v);const rows=p.inventory.filter(i=>i.slot===slot&&!used.includes(i.id)).sort((a,b)=>loot.itemPower(b)-loot.itemPower(a));if(rows[0]&&p.equipment[pos]!==rows[0].id&&loot.itemPower(rows[0])>(p.inventory.find(i=>i.id===p.equipment[pos])?loot.itemPower(p.inventory.find(i=>i.id===p.equipment[pos])):-1))g.equipItem(s,rows[0].id,pos);}
 if(SPEC)for(let round=0;round<400;round++){let any=false;for(const id of Object.values(p.equipment)){if(!id)continue;const r=g.enhanceItem(s,id);if(r.ok)any=true;else if(g.promoteItem(s,id).ok)any=true;}if(!any)break;}
 const tree=SWITCH?treeFor(type):FIXED_TREE;if(SWITCH)g.resetGrowthTree(s);for(const id of tree)g.learnGrowthNode(s,id);
 {let any=true;while(any){any=false;for(const id of ['power','vitality','guard','tempo','precision'])if(g.trainStat(s,id))any=true;}}
 g.applySkillExample(s,SWITCH&&type?EXAMPLE[type]:1);
 if(g.skillRank(p,'bloodmoon')&&!p.skillBook.loadout.ultimate[0])g.equipSkill(s,'bloodmoon',0);
 if(p.level>=g.SKILL_BY_ID.finisher.unlock&&!p.skillBook.loadout.passive.includes('finisher')){g.upgradeSkill(s,'finisher');if(g.skillRank(p,'finisher'))g.equipSkill(s,'finisher',0);}
 for(const id of [...p.skillBook.loadout.active,...p.skillBook.loadout.passive,...p.skillBook.loadout.ultimate])if(id)while(g.upgradeSkill(s,id)){}
}
const p=g.createProfile(1000);p.hunts=SEED;const s=g.createGame(p);s.auto=true;let attempts=0,farms=0,dungeons=0;const fails={},t0=Date.now();let stuck=null;
if(DUMP)fs.mkdirSync(DUMP,{recursive:true});
for(let ch=1;ch<=LAST&&!stuck;ch++){let won=false,tries=0;
 if(DUMP)fs.writeFileSync(path.join(DUMP,`c${ch}.json`),g.encodeProfile(p,1000));
 const failSeen={};
 for(let a=0;!won;a++){const from=g.stageLimit(p,ch)||1;prepare(s,nextGate(ch,from));attempts++;tries++;g.launch(s,ch,from);for(let i=0;i<24000&&s.phase==='playing';i++)g.advanceGame(s,.05);
  if(s.phase==='victory'){won=true;g.returnToCamp(s);break;}
  const st=s.run.stage,k=ch+'-'+st,gate=g.stageGate(ch,st);fails[k]=(fails[k]??0)+1;failSeen[st]=(failSeen[st]??0)+1;g.returnToCamp(s);
  if(failSeen[st]>=(Number(process.env.STUCK_AFTER)||15)){stuck={chapter:ch,stage:st,gate:gate?.type??null};break;}
  if(SPEC&&st>1){prepare(s,nextGate(ch,st-1));g.launch(s,ch,st-1);for(let i=0;i<2400&&s.phase==='playing'&&s.run.stage===st-1;i++)g.advanceGame(s,.05);farms++;g.returnToCamp(s);}
  if(SPEC)for(const id of ['enhance','gold','promote']){prepare(s,null);if(!g.launchDungeon(s,id,g.dungeonLimit(p,id)))continue;for(let i=0;i<2400&&s.phase==='playing';i++)g.advanceGame(s,.05);dungeons++;g.returnToCamp(s);}}
 const gear=Object.values(p.equipment).filter(Boolean).map(id=>p.inventory.find(i=>i.id===id));const enh=gear.reduce((a,i)=>a+(i.enhancement??0),0)/Math.max(1,gear.length),rar=gear.reduce((a,i)=>a+i.rarity,0)/Math.max(1,gear.length);
 const stt=g.playerStats(p);
 console.log(`${POLICY} seed${SEED} ch${ch} ${won?'clear':'STUCK'} tries=${tries} Lv${p.level} dmg=${Math.round(stt.damage)} hp=${Math.round(stt.maxHp)} gear+${enh.toFixed(1)} r${rar.toFixed(1)} ${Math.round((Date.now()-t0)/1000)}s`);
}
console.log(`${POLICY} seed${SEED} attempts=${attempts} farms=${farms} dungeons=${dungeons} stuck=${JSON.stringify(stuck)} fails=${JSON.stringify(fails)}`);
