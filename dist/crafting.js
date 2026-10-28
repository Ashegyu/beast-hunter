import {INVENTORY_LIMIT} from './inventory-rules.js?v=0.141.0';
// Alpha 0.122: 원질 핵 0.1%→2%, 무명의 기원 0.001%→0.3% so a recipe is reachable (still rare; crafting always succeeds).
// Authored crafting identities. This catalogue is never part of equipment roll pools.
export const MATERIAL_LIMIT=1_000_000;
export const MATERIALS=Object.freeze([
 {id:'boneIron',name:'괴수 뼈철',color:'#bbcab5',normal:.2,elite:.4,boss:1,quantity:[1,2,4],where:'모든 사냥터 · 일반 20% / 정예 40% / 보스 100%'},
 {id:'hide',name:'경화 가죽',color:'#d6b387',normal:.12,elite:.3,boss:.8,quantity:[1,2,3],where:'모든 사냥터 · 일반 12% / 정예 30% / 보스 80%'},
 {id:'crystal',name:'이형 결정',color:'#b8a5ef',normal:.005,elite:.08,boss:.3,quantity:[1,1,2],where:'모든 사냥터 · 일반 0.5% / 정예 8% / 보스 30%'},
 {id:'root',name:'수호령의 뿌리',color:'#b8e894',tier:1,normal:0,elite:.006,boss:.06,where:'붉은 숲 · 정예 0.6% / 보스 6%'},
 {id:'seal',name:'망자의 왕인',color:'#ceb7ff',tier:3,normal:0,elite:.006,boss:.06,where:'어둠의 심연 · 정예 0.6% / 보스 6%'},
 {id:'tear',name:'빙룡의 눈물',color:'#96ecfa',tier:2,normal:0,elite:.006,boss:.06,where:'불과 얼음의 땅 · 정예 0.6% / 보스 6%'},
 {id:'source',name:'원질 핵',color:'#ffbf76',normal:0,elite:0,boss:.02,rare:true,where:'모든 지역 보스 · 처치당 2% · 평균 50회당 1개'},
 {id:'origin',name:'무명의 기원',color:'#8ffff1',normal:0,elite:0,boss:.003,rare:true,where:'모든 지역 보스 · 처치당 0.3% · 평균 약 330회당 1개'},
 {id:'refineStone',name:'재련석',color:'#e3cf94',refining:true,normal:.25,elite:.75,boss:1,quantity:[1,2,6],where:'강화 던전 확정 보상 / 모든 사냥터 · 일반 25% / 정예 75% / 보스 100% · 1 / 2 / 6개'},
 {id:'refineCrystal',name:'정제석',color:'#b8a5ef',refining:true,normal:0,elite:.15,boss:.65,quantity:[1,1,3],where:'강화 던전 4단계부터 확정 보상 / 모든 사냥터 · 정예 15% / 보스 65% · 1 / 3개'},
 {id:'refineEssence',name:'순수결정',color:'#ffbf76',refining:true,normal:0,elite:.02,boss:.2,quantity:[1,1,1],where:'강화 던전 7단계부터 확정 보상 / 모든 사냥터 · 정예 2% / 보스 20% · 1개'},
 {id:'skillPage',name:'검술서',color:'#e7c59a',normal:0,elite:0,boss:0,where:'스킬 던전 확정 보상 · 스킬 화면에서 강화 포인트 연구에 사용'},
 {id:'promotionStone',name:'승급석',color:'#f0d586',promotion:true,normal:.02,elite:.2,boss:1,quantity:[1,1,3],where:'승급 던전 확정 보상 / 모든 사냥터 · 일반 2% / 정예 20% / 보스 100% · 1 / 1 / 3개'},
 {id:'sealShard',name:'인장 조각',color:'#ffd27a',normal:0,elite:0,boss:0,where:'보스 러시 보상 · 인장 분해 · 인장 성장에 사용'},
].map(r=>Object.freeze({...r,quantity:Object.freeze(r.quantity??[1,1,1])})));
// Alpha 0.141 재료 도감: what each material is for and which dungeon also pays it (the field `where` lists the hunting grounds).
const MATERIAL_INFO=Object.freeze({
 boneIron:{text:'괴수의 뼈에 스민 쇠. 고유 장비의 뼈대가 된다.',use:'고유 장비 제작',dungeon:'괴수 해체장'},
 hide:{text:'오래 버틴 괴수의 단단한 가죽.',use:'고유 장비 제작',dungeon:'괴수 해체장'},
 crystal:{text:'괴수 몸속에서 굳은 이형의 결정.',use:'고유 장비 제작 · 승급 던전 보상',dungeon:'괴수 해체장 · 정예의 시련'},
 root:{text:'붉은 숲 수호령이 남긴 뿌리.',use:'고유 장비 제작',dungeon:'괴수 해체장(5단계부터 돌아가며)'},
 seal:{text:'어둠의 심연 망자들의 왕이 찍던 인장.',use:'고유 장비 제작',dungeon:'괴수 해체장(5단계부터 돌아가며)'},
 tear:{text:'불과 얼음의 땅 빙룡이 흘린 눈물.',use:'고유 장비 제작',dungeon:'괴수 해체장(5단계부터 돌아가며)'},
 source:{text:'모든 형태가 시작되는 원질의 핵.',use:'고유 장비 제작',dungeon:'괴수 해체장(50단계마다 1개)'},
 origin:{text:'이름 없는 기원. 보스에게서만 아주 드물게 나온다.',use:'고유 장비 제작',dungeon:''},
 refineStone:{text:'장비를 벼리는 기본 숫돌.',use:'장비 강화',dungeon:'철갑의 제련소'},
 refineCrystal:{text:'강화를 깊게 새기는 정제된 결정.',use:'장비 강화(높은 단계)',dungeon:'철갑의 제련소(4단계부터)'},
 refineEssence:{text:'한계를 넘는 강화에 쓰는 순수한 결정.',use:'장비 강화(최고 단계)',dungeon:'철갑의 제련소(7단계부터)'},
 skillPage:{text:'옛 검사들의 검술을 적은 책.',use:'스킬 연구 · 스킬 갈래 해금',dungeon:'잔상의 수련장'},
 promotionStone:{text:'최대 강화 장비를 한 등급 위로 올리는 돌.',use:'장비 승급',dungeon:'정예의 시련'},
 sealShard:{text:'인장을 이루는 조각.',use:'인장 성장',dungeon:'보스 러시 · 인장 분해'},
});
export const materialInfo=id=>MATERIAL_INFO[id]??null;
export const MATERIAL_ICON_INDEX=Object.freeze(Object.fromEntries(MATERIALS.map((r,n)=>[r.id,n])));
export const MATERIAL_BY_ID=Object.freeze(Object.fromEntries(MATERIALS.map(r=>[r.id,r])));
export const emptyMaterials=()=>Object.fromEntries(MATERIALS.map(r=>[r.id,0]));
export function materialChance(row,{tier,boss=false,elite=false}){return row.tier&&row.tier!==tier?0:row[boss?'boss':elite?'elite':'normal'];}
export function rollMaterials(context,rng,refiningRng=rng,promotionRng=refiningRng){const drops=[];for(const row of MATERIALS){const chance=materialChance(row,context);if(chance&&(row.promotion?promotionRng:row.refining?refiningRng:rng)()<chance)drops.push({id:row.id,amount:row.quantity[context.boss?2:context.elite?1:0]});}return drops;}
const recipes=[
 {id:'crafted-frost-blade',name:'절대영도의 파쇄검',slot:'weapon',tier:3,artId:'frost_blade',effectId:'frostNova',base:{damage:65,hp:35,crit:12,speed:8},cost:{boneIron:60,hide:20,crystal:12,tear:6,source:2,origin:1},signature:{name:'영도 각인',trigger:'finisher',cooldown:4,damage:.4,chill:2,radius:190,cone:true,description:'3연격 마무리: 전방 40% 피해와 2초 빙결. 재사용 4초.'}},
 {id:'crafted-blood-blade',name:'적월의 종결검',slot:'weapon',tier:1,artId:'forest_blade',effectId:'execution',base:{damage:65,hp:30,crit:15,speed:6},cost:{boneIron:60,hide:20,crystal:12,root:6,source:2,origin:1},signature:{name:'혈흔 각인',trigger:'normal',cooldown:3,damage:.15,bleed:3,radius:120,description:'일반 연격: 주변 15% 피해와 출혈 3회. 재사용 3초.'}},
 {id:'crafted-frost-armor',name:'빙하 장인의 심장갑',slot:'armor',tier:3,artId:'frost_armor',effectId:'frostWard',base:{hp:220,damage:12,reduction:16,speed:8},cost:{boneIron:45,hide:50,crystal:10,tear:6,seal:3,source:2,origin:1},signature:{name:'동토 각인',trigger:'dash',cooldown:6,chill:2,shield:.08,radius:160,description:'회피: 주변 2초 빙결, 최대 체력 8% 보호막 3초. 재사용 6초.'}},
 {id:'crafted-blood-armor',name:'핏빛 추적자의 흉갑',slot:'armor',tier:2,artId:'ruins_armor',effectId:'pulse',base:{hp:220,damage:14,reduction:14,crit:8},cost:{boneIron:45,hide:50,crystal:10,seal:6,root:3,source:2,origin:1},signature:{name:'가시 각인',trigger:'perfect',cooldown:5,damage:.25,bleed:3,radius:170,description:'완벽 회피: 주변 25% 피해와 출혈 3회. 재사용 5초.'}},
 {id:'crafted-frost-charm',name:'서리의 연격인',slot:'charm',tier:3,artId:'frost_charm',effectId:'focus',base:{damage:20,hp:65,crit:15,speed:15},cost:{boneIron:30,hide:15,crystal:25,tear:4,root:4,source:2,origin:1},signature:{name:'서리 연무',trigger:'perfect',cooldown:4,chill:2,stamina:8,radius:180,description:'완벽 회피: 주변 2초 빙결과 기력 8 회복. 재사용 4초.'}},
 {id:'crafted-blood-charm',name:'혈월의 추격인',slot:'charm',tier:1,artId:'forest_charm',effectId:'hunter',base:{damage:22,hp:60,crit:12,speed:16},cost:{boneIron:30,hide:15,crystal:25,root:4,seal:4,source:2,origin:1},signature:{name:'핏빛 궤적',trigger:'dash',cooldown:4,damage:.15,bleed:3,radius:140,description:'회피: 출발 지점 주변 15% 피해와 출혈 3회. 재사용 4초.'}},
];
// Additional parts use independent authored identities, costs and combat signatures.
for(const [slot,name,base,signature]of [
 ['helmet','수호 장인의 투구',{hp:90,reduction:6,crit:4},{name:'수호 각인',trigger:'hurt',cooldown:10,shield:.04,radius:100,description:'피격 생존 시 최대 체력 4% 보호막. 재사용 10초.'}],
 ['pants','추적 장인의 각반',{hp:100,reduction:5,speed:5},{name:'인내 각인',trigger:'dash',cooldown:9,shield:.04,radius:100,description:'회피 시 최대 체력 4% 보호막. 재사용 9초.'}],
 ['boots','서리 장인의 장화',{hp:70,speed:8,reduction:4},{name:'서리 걸음',trigger:'dash',cooldown:8,chill:1,radius:120,description:'회피 출발 지점 주변을 1초 빙결. 재사용 8초.'}],
 ['earring','별빛 장인의 귀걸이',{damage:12,crit:6,hp:40},{name:'별빛 메아리',trigger:'finisher',cooldown:6,damage:.12,radius:130,description:'3연격 마무리 시 주변 12% 피해. 재사용 6초.'}],
 ['special','리리안의 적월 성물',{damage:20,hp:80,crit:5},{name:'적월의 맥동',trigger:'periodic',cooldown:9,damage:.3,radius:160,description:'전투 중 9초마다 주변에 기본 공격력 30% 피해.'}],
])recipes.push({id:'crafted-'+slot,name,slot,tier:1,artId:slot==='helmet'||slot==='pants'||slot==='boots'?'forest_armor':'forest_charm',effectId:null,signatureOnly:true,...(slot==='special'?{characterId:'lirian'}:{}),base,cost:{boneIron:50,hide:25,crystal:15,root:5,source:2,origin:1},signature});
export const CRAFTED_CATALOG=Object.freeze(recipes.map((r,n)=>Object.freeze({...r,gold:3500,rarity:6,crafted:true,base:Object.freeze(r.base),cost:Object.freeze(r.cost),signature:Object.freeze({...r.signature,index:60+n,color:n%2?'#ff9dbb':'#8ffff1'})})));
const BY_ID=new Map(CRAFTED_CATALOG.map(r=>[r.id,r]));
export const targetCraft=profile=>BY_ID.get(profile.targetCraftId)??null;
export function setCraftTarget(profile,id){if(id!==null&&!BY_ID.has(id))return false;profile.targetCraftId=id;return true;}
export function craftProgress(profile){const row=targetCraft(profile);if(!row)return null;
 const owned=profile.inventory.some(i=>craftedDefinition(i)?.id===row.id),rows=[];let ready=0,fraction=0;
 for(const [id,need]of Object.entries(row.cost)){const material=MATERIAL_BY_ID[id],have=profile.materials[id],missing=Math.max(0,need-have),done=owned||missing===0;rows.push({material,have,need,missing:owned?0:missing,ready:done});if(done)ready++;fraction+=Math.min(1,have/need);}
 const status=owned?{ok:false,reason:'제작 완료 · 장비 보유 중'}:craftStatus(profile,row.id),percent=owned?100:Math.round(fraction/rows.length*1000)/10;
 return {recipe:row,rows,ready,total:rows.length,percent,owned,canCraft:status.ok,reason:status.reason,short:owned?'제작 완료':status.ok?'제작 준비 완료':ready+'/'+rows.length+'종 · '+percent+'%'};
}
export function craftedDefinition(item){const row=BY_ID.get(item?.catalogId);return item?.rarity===6&&row&&row.slot===item.slot&&row.tier===item.tier&&row.artId===item.artId?row:null;}
export function craftStatus(profile,id){const row=BY_ID.get(id);if(!row)return {ok:false,reason:'없는 제작법이야.'};
 // Alpha 0.136: seals come only from the boss rush; the old seal recipe stays for owned copies but can't be made.
 if(row.slot==='special')return {ok:false,reason:'인장은 던전 → 보스 러시에서만 얻을 수 있어.'};
 if(profile.inventory.filter(i=>i.rarity===6&&i.catalogId===id).length>=(row.slot==='earring'?2:1))return {ok:false,reason:'이미 보유한 고유 장비야.'};
 if(profile.unlockedStage<row.tier)return {ok:false,reason:'해당 사냥터를 먼저 열어줘.'};
 if(profile.inventory.length>=INVENTORY_LIMIT)return {ok:false,reason:'장비 가방에 빈 칸이 필요해.'};
 if(profile.gold<row.gold)return {ok:false,reason:'골드가 부족해.'};
 for(const [key,count]of Object.entries(row.cost))if(!Number.isInteger(profile.materials?.[key])||profile.materials[key]<count)return {ok:false,reason:'제작 재료가 부족해.'};
 return {ok:true,reason:'모든 재료 준비 완료 · 확정 제작'};
}
