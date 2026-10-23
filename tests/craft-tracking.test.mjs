import test from 'node:test';import assert from 'node:assert/strict';import * as g from '../dist/game-engine.js';
const row=g.CRAFTED_CATALOG[0];
function prepared(){const p=g.createProfile(1000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[0,0,0];p.gold=5000;for(const m of g.MATERIALS)p.materials[m.id]=100;return p;}
test('target set, change, clear and invalid inputs only change a validated optional identity',()=>{
 const p=prepared(),base=JSON.stringify(p);for(const id of ['bad','1-weapon-1',{},undefined,1]){assert.equal(g.setCraftTarget(p,id),false);assert.equal(JSON.stringify(p),base);}assert.equal(g.setCraftTarget(p,row.id),true);assert.equal(g.targetCraft(p),row);assert.equal(g.setCraftTarget(p,g.CRAFTED_CATALOG[1].id),true);assert.equal(p.targetCraftId,g.CRAFTED_CATALOG[1].id);assert.equal(g.setCraftTarget(p,null),true);assert.equal(JSON.stringify(p),base);assert.equal(g.craftProgress(p),null);
});
test('existing collected materials count immediately, surplus caps progress and exactly required rows appear',()=>{
 const p=prepared();g.setCraftTarget(p,row.id);p.materials.boneIron=30;p.materials.origin=0;const progress=g.craftProgress(p);assert.equal(progress.total,Object.keys(row.cost).length);assert.equal(progress.ready,4);assert.ok(progress.percent<100&&progress.percent>70);assert.equal(progress.rows.find(r=>r.material.id==='boneIron').missing,30);assert.equal(progress.rows.find(r=>r.material.id==='origin').missing,1);assert.ok(!progress.rows.some(r=>r.material.id==='seal'));p.materials.boneIron=60;p.materials.origin=1;assert.equal(g.craftProgress(p).canCraft,true);assert.equal(g.craftProgress(p).percent,100);
});
test('crafting completion retains the target and is complete despite material consumption; salvage resumes collection',()=>{
 const p=prepared();p.materials.origin=1;g.setCraftTarget(p,row.id);const s=g.createGame(p),result=g.craftItem(s,row.id);assert.equal(result.ok,true);assert.equal(p.materials.origin,0);const done=g.craftProgress(p);assert.equal(done.owned,true);assert.equal(done.percent,100);assert.equal(done.ready,done.total);assert.equal(done.canCraft,false);assert.ok(done.rows.every(r=>r.ready&&r.missing===0));assert.equal(p.targetCraftId,row.id);g.salvageItem(s,result.item.id);assert.equal(g.craftProgress(p).owned,false);assert.ok(g.craftProgress(p).percent<100);
});
test('material readiness and craft availability remain separate for full bag gold or unlock blockers',()=>{
 for(const change of [p=>p.gold=0,p=>p.unlockedStage=1,p=>p.inventory=Array.from({length:g.INVENTORY_LIMIT},(_,n)=>({id:n+1}))]){const p=prepared();g.setCraftTarget(p,row.id);change(p);const progress=g.craftProgress(p);assert.equal(progress.percent,100);assert.equal(progress.ready,progress.total);assert.equal(progress.canCraft,false);assert.ok(progress.reason.length);}
});
test('save restore validates target and HUD preference, preserves v7 data and gives older saves defaults',()=>{
 const p=prepared();g.setCraftTarget(p,row.id);p.craftTrackerVisible=false;const restored=g.restoreProfile(g.encodeProfile(p,1000),1000);assert.deepEqual(restored,p);for(const version of [1,4,5,6]){const raw={...p,version};const old=g.restoreProfile(raw,1000);assert.equal(old.targetCraftId,null);assert.equal(old.craftTrackerVisible,true);assert.equal(old.gold,p.gold);}const invalid=g.restoreProfile({...p,targetCraftId:'unknown',craftTrackerVisible:'false'},1000);assert.equal(invalid.targetCraftId,null);assert.equal(invalid.craftTrackerVisible,true);
});
test('regional materials have only their real chapter, boss-only materials never route to ordinary stages',()=>{
 const p=g.createProfile();assert.equal(g.craftMaterialRoutes(p,'unknown').length,0);for(const [id,tier]of [['root',1],['seal',2],['tear',3]]){const routes=g.craftMaterialRoutes(p,id);assert.equal(routes.length,1);assert.equal(routes[0].chapter,tier);assert.equal(routes[0].source,'elite');assert.equal(routes[0].stage,3);assert.equal(routes[0].available,false);}
 for(const id of ['origin','source'])for(const r of g.craftMaterialRoutes(p,id)){assert.equal(r.stage,10);assert.equal(r.source,'boss');assert.equal(r.available,false);assert.ok(r.chance>0);}
});
test('actual stage limits select ordinary then stage3 elite then stage10 boss without claiming elites in stage4',()=>{
 const p=g.createProfile();let r=g.craftMaterialRoutes(p,'boneIron')[0];assert.equal(r.stage,1);assert.equal(r.available,true);p.stageProgress[0]=2;r=g.craftMaterialRoutes(p,'boneIron')[0];assert.equal(r.stage,3);assert.equal(r.source,'elite');p.stageProgress[0]=3;r=g.craftMaterialRoutes(p,'root')[0];assert.equal(r.stage,3);assert.equal(r.available,true);p.stageProgress[0]=9;r=g.craftMaterialRoutes(p,'root')[0];assert.equal(r.stage,10);assert.equal(r.source,'boss');assert.equal(r.chance,.06);p.clearedStage=1;p.unlockedStage=2;p.stageProgress=[0,0,0];assert.equal(g.craftMaterialRoutes(p,'origin')[0].available,true);assert.equal(g.craftMaterialRoutes(p,'origin')[1].available,false);
});
test('target selection and changing targets mid-hunt never alter combat gear or material RNG',()=>{
 const p=prepared();p.hunts=4;const a=g.createGame(structuredClone(p)),b=g.createGame(structuredClone(p));g.setCraftTarget(b.profile,row.id);g.launch(a,1,5);g.launch(b,1,5);a.auto=b.auto=true;for(let i=0;i<1600;i++){g.advanceGame(a,.025);g.advanceGame(b,.025);if(i===250)g.setCraftTarget(b.profile,g.CRAFTED_CATALOG[1].id);if(i===500)g.setCraftTarget(b.profile,null);}assert.deepEqual(b,a);
});
