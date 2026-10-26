// Alpha 0.131 60챕터 캠페인 시뮬레이션(정비: 장비 착용·강화·승급, 성장 트리 검귀→수호자, 남은 포인트는 공격·체력·방어·연격·치명 순환 단련). 사용: node tools/simulate-campaign0131.mjs dist <시드> [마지막 챕터]
// 30-chapter campaign: camp prep (gear, enhancement, promotion, skills), checkpoint retries,
// and one farm run of the previous stage when stuck. Usage: node campaign30.mjs <distDir> <seed> [lastChapter]
const g=await import(new URL('../'+process.argv[2]+'/game-engine.js',import.meta.url).href);
const loot=await import(new URL('../'+process.argv[2]+'/loot.js',import.meta.url).href);
const SEED=Number(process.argv[3]||0),LAST=Number(process.argv[4]||30);
function prepare(s){const p=s.profile;
 for(const pos of g.EQUIPMENT_KEYS){const slot=g.itemSlotForPosition(pos);const used=Object.entries(p.equipment).filter(([k])=>k!==pos).map(([,v])=>v);const rows=p.inventory.filter(i=>i.slot===slot&&!used.includes(i.id)).sort((a,b)=>loot.itemPower(b)-loot.itemPower(a));if(rows[0]&&p.equipment[pos]!==rows[0].id&&loot.itemPower(rows[0])>(p.inventory.find(i=>i.id===p.equipment[pos])?loot.itemPower(p.inventory.find(i=>i.id===p.equipment[pos])):-1))g.equipItem(s,rows[0].id,pos);}
 for(let round=0;round<400;round++){let any=false;for(const id of Object.values(p.equipment)){if(!id)continue;const r=g.enhanceItem(s,id);if(r.ok)any=true;else if(g.promoteItem(s,id).ok)any=true;}if(!any)break;}
 for(const id of (process.env.TREE??'blade1,blade2,ward1,ward2,blade3,blade4,blade5,ward3,ward4,ward5').split(','))g.learnGrowthNode(s,id);
 {let any=true;while(any){any=false;for(const id of (process.env.TRAIN??'power,vitality,guard,tempo,precision').split(','))if(g.trainStat(s,id))any=true;}}
 g.applySkillExample(s,1);
 if(g.skillRank(p,'bloodmoon')&&!p.skillBook.loadout.ultimate[0])g.equipSkill(s,'bloodmoon',0);
 if(p.level>=g.SKILL_BY_ID.finisher.unlock&&!p.skillBook.loadout.passive.includes('finisher')){g.upgradeSkill(s,'finisher');if(g.skillRank(p,'finisher'))g.equipSkill(s,'finisher',0);}
 for(const id of [...p.skillBook.loadout.active,...p.skillBook.loadout.passive,...p.skillBook.loadout.ultimate])if(id)while(g.upgradeSkill(s,id)){}
}
const p=g.createProfile(1000);p.hunts=SEED;const s=g.createGame(p);s.auto=true;let attempts=0,farms=0;const fails={};const t0=Date.now();
for(let ch=1;ch<=LAST;ch++){let won=false,tries=0;
 for(let a=0;a<15&&!won;a++){prepare(s);attempts++;tries++;const from=g.stageLimit(p,ch)||1;g.launch(s,ch,from);for(let i=0;i<24000&&s.phase==='playing';i++)g.advanceGame(s,.05);
  if(s.phase==='victory')won=true;else{const st=s.run.stage,k=ch+'-'+st;fails[k]=(fails[k]??0)+1;g.returnToCamp(s);
   if(st>1){prepare(s);g.launch(s,ch,st-1);for(let i=0;i<2400&&s.phase==='playing'&&s.run.stage===st-1;i++)g.advanceGame(s,.05);farms++;}}g.returnToCamp(s);}
 const gear=Object.values(p.equipment).filter(Boolean).map(id=>p.inventory.find(i=>i.id===id));const enh=gear.reduce((a,i)=>a+(i.enhancement??0),0)/Math.max(1,gear.length),rar=gear.reduce((a,i)=>a+i.rarity,0)/Math.max(1,gear.length);
 const st=g.playerStats(p);
 console.log(`seed${SEED} ch${ch} ${won?'clear':'STUCK'} tries=${tries} Lv${p.level} dmg=${Math.round(st.damage)} hp=${Math.round(st.maxHp)} pi=${Math.round(Math.sqrt(st.damage*st.maxHp))} gear+${enh.toFixed(1)} r${rar.toFixed(1)} gold=${p.gold} ${Math.round((Date.now()-t0)/1000)}s`);
 if(!won)break;}
console.log("ancients",JSON.stringify(p.inventory.filter(i=>i.rarity===5).map(i=>i.catalogId)),"equipped",Object.values(p.equipment).filter(id=>p.inventory.find(i=>i.id===id)?.rarity===5).length,"pity",p.legendaryPity);console.log(`seed${SEED} attempts=${attempts} farms=${farms} fails=${JSON.stringify(fails)}`);
