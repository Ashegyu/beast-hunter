import * as frameMetrics from '../dist/frame-metrics.js';
import * as regionAssets from '../dist/region-assets.js';
import * as profileBackup from '../dist/profile-backup.js';
// The actual app runs here. This host checks integration; it is not a visual browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import v8 from 'node:v8';
import * as motion from '../dist/motion.js';
import * as sound from '../dist/sound.js';
import * as game from '../dist/game-engine.js';
import {rollItem} from '../dist/loot.js';
import {freezeCombat} from './combat-fixture.mjs';
import * as animation from '../dist/engine.js';
import * as world from '../dist/world.js';
import * as viewControls from '../dist/view-controls.js';
import * as terrain from '../dist/terrain.js';
import * as chapters from '../dist/chapters.js';
import * as equipmentVisuals from '../dist/equipment-visuals.js';

test('hunting map scene follows real checkpoint limits and boss rewards without changing the profile',async()=>{
 const p=game.createProfile(1_000_000);p.unlockedStage=3;p.clearedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[1,0,-1];p.difficultyProgress=[[4,2,0],[1,0,0]];widen(p);
 const ui=await host({saved:p,campaign:true}),before=ui.profile();ui.emit('nav-hunt','click');pickChapter(ui,1);ui.emit('map-mode-0','click');ui.emit('run-stage-10','click');
 assert.equal(ui.nodes.get('map-boss-rewards').hidden,false);
 assert.equal(ui.nodes.get('map-boss-gold').textContent,'+'+game.STAGES[0].reward);
 assert.equal(ui.nodes.get('map-boss-cores').textContent,'+1');
 assert.equal(ui.nodes.get('map-enemy-name').textContent,chapters.MONSTERS[game.STAGES[0].bossSpecies].name);
 assert.match(ui.nodes.get('map-banner-stage').textContent,/STAGE 10/);
 ui.emit('map-mode-1','click');assert.equal(ui.nodes.get('map-boss-rewards').hidden,true);assert.equal(ui.nodes.get('map-scene-progress').textContent,'4 / 10');
 for(let n=1;n<10;n++)assert.equal(ui.nodes.get('map-path-'+n).attributes['data-open'],String(n<5));
 ui.emit('run-stage-6','click');assert.match(ui.nodes.get('map-banner-stage').textContent,/STAGE 01/);
 ui.emit('run-stage-5','click');assert.match(ui.nodes.get('map-banner-stage').textContent,/STAGE 05/);
 pickChapter(ui,21);ui.emit('map-mode-0','click');ui.emit('run-stage-10','click');
 assert.equal(ui.nodes.get('map-boss-gold').textContent,'+'+game.STAGES[20].reward);
 assert.equal(ui.nodes.get('map-boss-cores').textContent,'+'+game.bossCores(21));
 for(const [node,slot]of [['weapon','weapon'],['armor','armor'],['charm','helmet']])assert.equal(ui.nodes.get('map-reward-'+node).attributes['data-art-id'],game.ITEM_CATALOG.find(r=>r.set===game.STAGES[20].set&&r.slot===slot).artId);
 assert.deepEqual(ui.profile(),before);
});
const root=new URL('../dist/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8'),source=fs.readFileSync(process.env.TEST_APP_SOURCE??new URL('app.js',root),'utf8');
// Native size of a drawn image. Newer atlases ship only as lossless WebP (VP8L).
function imageSize(logical){const png=new URL(logical,root);if(fs.existsSync(png)){const b=fs.readFileSync(png);return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};}const b=fs.readFileSync(new URL(logical.replace(/\.png$/,'.webp'),root));assert.equal(b.toString('ascii',12,16),'VP8L');const bits=b.readUInt32LE(21);return {width:(bits&16383)+1,height:((bits>>>14)&16383)+1};}
const manifest=JSON.parse(fs.readFileSync(new URL('assets/manifest.json',root),'utf8'));
const alignment=JSON.parse(fs.readFileSync(new URL('../tools/reports/lirian-alpha081-alignment.json',root),'utf8'));
const KEY='beast-hunter:profile:v1';
// The landscape app shows a wider logical view (view-controls.js viewportFor) and scales it onto the canvas.
// These helpers mirror app.js: logical screen = (client - box origin) * view / box, drawing = logical * scale.
const APP_BOX={left:0,top:0,width:1200,height:760};
const appView=(box=APP_BOX)=>viewControls.viewportFor(box.width,box.height);
const appScale=(box=APP_BOX)=>box.width/appView(box).width;
const appCamera=(ui,box=APP_BOX)=>world.cameraFor(ui.state.player,ui.state.bounds,appView(box),world.GROUND_DEPTH_SCALE);
// Upright actors also grow toward the bottom of the view (app.js sceneDepthScale); 1.0 at the player's 60% row.
const appDepth=(ui,y,box=APP_BOX)=>{const camera=appCamera(ui,box);return Math.max(.86,Math.min(1.1,.88+.2*((y-camera.y)*world.GROUND_DEPTH_SCALE/appView(box).height)));};
const appActorScale=(ui,y,box=APP_BOX)=>appScale(box)*appDepth(ui,y,box);
const clientAt=(screen,box=APP_BOX)=>({clientX:(box.left??0)+screen.x*box.width/appView(box).width,clientY:(box.top??0)+screen.y*box.height/appView(box).height});
// Every host compiles app.js into its own vm context. V8's compilation cache keeps each of those contexts
// alive, so a full run used to climb past the default heap (Alpha 0.119). The app is compiled once per host anyway.
v8.setFlagsFromString('--no-compilation-cache');
const hostDisposals=[];
// Each host is one closed test tab; do not retain its DOM and Canvas recording through the whole suite.
test.afterEach(async()=>{await new Promise(resolve=>setImmediate(resolve));for(const dispose of hostDisposals.splice(0))dispose();});
const backupFile=text=>({size:new Blob([text]).size,text:async()=>text});
// Since Alpha 0.105 the map has 30 chapters in three regions (1–10, 11–20, 21–30).
// Older fixtures describe three chapters; widen() maps old chapter n onto the first
// chapter of region n and treats the chapters between as ordinary cleared ground.
const REGION_START=[1,11,21];
function widen(p){
 const row=(old,fill,between)=>game.STAGES.map(c=>c.number===1?(old?.[c.theme-1]??fill):c.id<=p.clearedStage?between(old,c):fill);
 const cleared=p.clearedStage,unlocked=p.unlockedStage;
 p.clearedStage=cleared===0?0:cleared<3?REGION_START[cleared]-1:REGION_START[2];
 p.unlockedStage=REGION_START[Math.max(1,unlocked)-1];
 p.stageProgress=row(p.stageProgress,0,()=>10);
 p.bossMastery=row(p.bossMastery,-1,(old,c)=>Math.max(0,old?.[c.theme-1]??0));
 if(p.difficultyProgress)p.difficultyProgress=p.difficultyProgress.map(r=>row(r,0,()=>0));
 return p;
}
// Alpha 0.118 adds regions 4–6: open every region's first chapter the way widen() opens chapter 21
// (earlier regions cleared, the last region's first chapter unlocked but not cleared).
function openRegions(p){
 const last=game.STAGES.length-game.CHAPTERS_PER_THEME;
 p.clearedStage=last;p.unlockedStage=last+1;
 p.stageProgress=game.STAGES.map(c=>c.id<=last?10:0);p.bossMastery=game.STAGES.map(c=>c.id<=last?Math.max(0,p.bossMastery?.[c.id-1]??0):-1);
 if(p.difficultyProgress)p.difficultyProgress=p.difficultyProgress.map(()=>game.STAGES.map(()=>0));
 return p;
}
// Region tab, then the chapter pager, exactly as a player would reach the chapter.
function pickChapter(ui,id){
 ui.emit('stage-'+game.STAGES[id-1].theme,'click');
 for(let n=0;n<game.STAGES.length;n++){const current=Number(ui.nodes.get('chapter-label').textContent.match(/CHAPTER (\d+)/)[1]);if(current===id)return;ui.emit(current>id?'chapter-prev':'chapter-next','click');}
 throw Error('chapter '+id+' is not reachable');
}

async function selectBackup(ui,text){ui.nodes.get('backup-file').files=[backupFile(text)];ui.emit('backup-file','change');await ui.settle();}
test('primary navigation exposes skills while the hunt action lives on home',async()=>{
 const navigation=html.match(/<nav class="app-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
 assert.deepEqual([...navigation.matchAll(/<button id="([^"]+)"/g)].map(m=>m[1]),['nav-home','home-nav-hunt','home-nav-growth','home-nav-codex','nav-skills','nav-equipment','nav-bag','nav-craft','nav-more']);
 const home=html.match(/<nav class="home-shortcuts"[^>]*>([\s\S]*?)<\/nav>/)[1];assert.match(home,/id="nav-hunt"/);
 const ui=await host(),before=ui.profile();ui.emit('nav-hunt','click');assert.equal(ui.nodes.get('camp-map-panel').hidden,false);assert.equal(ui.nodes.get('nav-home').attributes['aria-pressed'],'true');
 ui.emit('page-back','click');assert.equal(ui.document.activeElement.id,'nav-hunt');assert.deepEqual(ui.profile(),before);
 for(const source of ['nav-bag','nav-equipment','nav-craft','nav-skills','nav-more','nav-hunt','nav-codex']){ui.emit(source,'click');ui.emit('nav-home','click');assert.equal(ui.nodes.get('game-shell').attributes['data-panel'],'camp');assert.equal(ui.nodes.get('game-shell').attributes['data-camp-view'],'home');assert.equal(ui.document.activeElement.id,'start');}assert.deepEqual(ui.profile(),before);
});
test('skills tab leaves other camp panels, updates selection and returns focus without changing the profile',async()=>{
 const ui=await host({saved:bagFixture()}),before=ui.profile(),tabs=['home','skills','equipment','bag','craft','more'];
 for(const source of ['nav-bag','nav-equipment','nav-craft','nav-codex','nav-more']){
  ui.emit(source,'click');ui.emit('nav-skills','click');
  assert.equal(ui.nodes.get('camp-skills-panel').hidden,false);assert.equal(ui.nodes.get('inventory-content').hidden,true);assert.equal(ui.nodes.get('equipment-content').hidden,true);assert.equal(ui.nodes.get('craft-content').hidden,true);assert.equal(ui.nodes.get('codex-content').hidden,true);assert.equal(ui.nodes.get('camp-more-panel').hidden,true);
  assert.equal(ui.nodes.get('nav-skills').attributes['aria-expanded'],'true');assert.equal(ui.nodes.get('page-title').textContent,'스킬 · 빌드');
  assert.deepEqual(tabs.filter(t=>ui.nodes.get('nav-'+t).attributes['aria-pressed']==='true'),['skills']);
  ui.emit('page-back','click');assert.equal(ui.document.activeElement.id,'nav-skills');assert.equal(ui.nodes.get('nav-skills').attributes['aria-expanded'],'false');
 }
 assert.deepEqual(ui.profile(),before);ui.emit('start','click');const state=JSON.stringify(ui.state);ui.emit('nav-skills','click');assert.equal(JSON.stringify(ui.state),state);
});
test('item workshop upgrades one owned item and rerolls through a saved preview without altering equipment identity',async()=>{
 const p=bagFixture();p.gold=1000000;p.cores=100;p.materials.boneIron=10000;for(const m of game.MATERIALS)if(m.refining)p.materials[m.id]=10000;p.equipmentRng=0;
 const row=game.ITEM_CATALOG.find(r=>r.id==='1-weapon-1'),item={id:20,catalogId:row.id,artId:row.artId,slot:row.slot,tier:row.tier,name:row.name,rarity:4,affixes:{damage:30,hp:32,speed:4,crit:7,reduction:2},rollVersion:1};p.inventory.push(item);p.nextItemId=21;
 const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-5','click');ui.emit('item-workshop-open','click');assert.equal(ui.nodes.get('item-workshop').hidden,false);
 ui.emit('workshop-enhance','click');const enhanced=ui.profile().inventory.find(i=>i.id===20);assert.equal(enhanced.enhancement,1);assert.equal(enhanced.catalogId,item.catalogId);assert.equal(enhanced.enhancementAffixes.damage,.9);assert.equal(ui.nodes.get('workshop-bonus-damage').textContent,'+0.9');assert.match(ui.nodes.get('item-name-5').textContent,/\+1/);assert.match(ui.nodes.get('workshop-chance').textContent,/신화 · 성공률 63\.7%/);assert.match(ui.nodes.get('workshop-chance').textContent,/보장까지 10회/);assert.match(ui.nodes.get('workshop-note').textContent,/10번째 시도 보장/);
 ui.emit('workshop-tab-reroll','click');const before=ui.profile(),gold=before.gold;ui.emit('workshop-reroll','click');const pending=ui.profile().inventory.find(i=>i.id===20);assert.ok(pending.rerollCandidate);assert.deepEqual(pending.affixes,enhanced.affixes);assert.deepEqual(pending.enhancementAffixes,enhanced.enhancementAffixes);assert.equal(ui.nodes.get('workshop-next-damage').textContent,String(Math.round((pending.rerollCandidate.affixes.damage+.9)*100)/100));assert.ok(ui.profile().gold<gold);assert.equal(ui.nodes.get('workshop-apply').hidden,false);
 const saved=ui.profile(),again=await host({saved});again.emit('nav-bag','click');again.emit('bag-5','click');again.emit('item-workshop-open','click');assert.equal(again.nodes.get('workshop-apply').hidden,false);again.emit('workshop-apply','click');
 const final=again.profile().inventory.find(i=>i.id===20);assert.equal(final.rerollCandidate,undefined);assert.equal(final.enhancement,1);assert.deepEqual(final.enhancementAffixes,enhanced.enhancementAffixes);assert.equal(final.catalogId,item.catalogId);assert.deepEqual(final.affixes,pending.rerollCandidate.affixes);assert.equal(again.profile().gold,saved.gold);
});
test('mythic +30 shows one percent until the thirtieth guaranteed attempt and then stops at the cap',async()=>{
 const p=bagFixture();p.gold=1000000;p.cores=100;p.materials.boneIron=10000;for(const m of game.MATERIALS)if(m.refining)p.materials[m.id]=10000;p.equipmentRng=0;
 const row=game.ITEM_CATALOG.find(r=>r.id==='1-weapon-1');p.inventory.push({id:20,catalogId:row.id,artId:row.artId,slot:row.slot,tier:row.tier,name:row.name,rarity:4,affixes:{damage:20,hp:32,speed:4,crit:4,reduction:2},rollVersion:1,enhancement:29});p.nextItemId=21;
 const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-5','click');ui.emit('item-workshop-open','click');assert.match(ui.nodes.get('workshop-chance').textContent,/신화 · 성공률 1%/);assert.match(ui.nodes.get('workshop-note').textContent,/30번째 시도 보장/);
 ui.emit('workshop-enhance','click');const failed=ui.profile(),item=failed.inventory.find(i=>i.id===20);assert.equal(item.enhancement,29);assert.equal(item.enhanceFailures,1);assert.match(ui.nodes.get('workshop-chance').textContent,/보장까지 29회/);
 item.enhanceFailures=29;const again=await host({saved:failed});again.emit('nav-bag','click');again.emit('bag-5','click');again.emit('item-workshop-open','click');assert.match(again.nodes.get('workshop-chance').textContent,/이번 시도 확정 성공/);
 again.emit('workshop-enhance','click');assert.equal(again.profile().inventory.find(i=>i.id===20).enhancement,30);assert.equal(again.nodes.get('workshop-enhance').disabled,true);assert.match(again.nodes.get('workshop-chance').textContent,/최대 강화 달성/);
});
test('refining costs expose cumulative materials, sources and shortage state before a guaranteed upgrade',async()=>{
 const p=bagFixture();p.gold=1000000;p.materials.refineStone=20;p.materials.refineCrystal=10;
 const row=game.ITEM_CATALOG.find(r=>r.id==='1-weapon-1');p.inventory.push({id:20,catalogId:row.id,artId:row.artId,slot:row.slot,tier:row.tier,name:row.name,rarity:4,affixes:{damage:20,hp:32,speed:4,crit:4,reduction:2},rollVersion:1,enhancement:20,enhanceFailures:29});p.nextItemId=21;
 const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-5','click');ui.emit('item-workshop-open','click');assert.equal(ui.nodes.get('workshop-enhance').disabled,true);assert.equal(ui.nodes.get('workshop-cost-refineEssence').attributes['data-ready'],'false');assert.match(ui.nodes.get('workshop-gold-cost').textContent,/85,632/);
 ui.emit('workshop-cost-refineEssence','click');assert.match(ui.nodes.get('workshop-feedback').textContent,/보유 0개.*정예 2% \/ 보스 20%/);const before=ui.profile();ui.emit('workshop-enhance','click');assert.deepEqual(ui.profile(),before);
 ui.state.profile.materials.refineEssence=1;ui.tick(0);assert.equal(ui.nodes.get('workshop-enhance').disabled,false);ui.emit('workshop-enhance','click');const after=ui.profile();assert.equal(after.inventory.find(i=>i.id===20).enhancement,21);assert.equal(after.gold,before.gold-85632);assert.equal(after.materials.refineStone,15);assert.equal(after.materials.refineCrystal,7);assert.equal(after.materials.refineEssence,0);
});
test('maxed ordinary gear opens promotion, pays once and keeps selected identity at the next grade +0',async()=>{
 const p=bagFixture();p.gold=1000000;for(const m of game.MATERIALS)p.materials[m.id]=1000;const row=game.ITEM_CATALOG.find(r=>r.id==='1-weapon-1');p.inventory.push({id:20,catalogId:row.id,artId:row.artId,slot:row.slot,tier:row.tier,name:row.name,rarity:0,affixes:{...row.base},rollVersion:1,enhancement:5});p.nextItemId=21;
 const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-5','click');ui.emit('item-workshop-open','click');assert.equal(ui.nodes.get('workshop-tab-promote').attributes['aria-pressed'],'true');assert.match(ui.nodes.get('workshop-chance').textContent,/일반 \+5 → 희귀 \+0/);assert.equal(ui.nodes.get('workshop-promote').disabled,false);const before=ui.profile();
 ui.emit('workshop-promote','click');const after=ui.profile(),i=after.inventory.find(i=>i.id===20);assert.equal(i.rarity,1);assert.equal(i.enhancement,undefined);assert.equal(i.enhancementAffixes,undefined);assert.equal(after.gold,before.gold-2000);assert.equal(after.materials.promotionStone,before.materials.promotionStone-2);assert.equal(after.materials.crystal,before.materials.crystal-1);assert.equal(ui.nodes.get('workshop-tab-enhance').attributes['aria-pressed'],'true');assert.equal(ui.document.activeElement.id,'workshop-enhance');assert.match(ui.nodes.get('workshop-status').textContent,/\+0 \/ 10/);
 ui.emit('workshop-promote','click');assert.deepEqual(ui.profile(),after);
});
test('ancient +40 and crafted +50 retain their distinct caps across UI enhancement and reload',async()=>{
 const ancient=game.ANCIENT_CATALOG[0],crafted=game.CRAFTED_CATALOG[0];for(const [row,rarity,cap]of [[ancient,5,40],[crafted,6,50]]){
  const p=bagFixture();p.gold=1e8;p.equipmentRng=1972;for(const m of game.MATERIALS)p.materials[m.id]=10000;p.inventory.push({id:20,catalogId:row.id,artId:row.artId,slot:row.slot,tier:row.tier,name:row.name,rarity,affixes:{...row.base},rollVersion:1,enhancement:cap-1,enhanceFailures:cap-1});p.nextItemId=21;
  const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-5','click');ui.emit('item-workshop-open','click');assert.match(ui.nodes.get('workshop-status').textContent,new RegExp(' / '+cap));assert.equal(ui.nodes.get('workshop-tab-promote').disabled,true);assert.match(ui.nodes.get('workshop-chance').textContent,rarity===5?/성공률 2.5% · 보정 20\/20/:/성공률 0.3% · 보정·보장 없음/);assert.doesNotMatch(ui.nodes.get('workshop-chance').textContent,/확정 성공|보장까지|null/);assert.match(ui.nodes.get('workshop-note').textContent,rarity===5?/실패마다 \+0.1%p · 최대 20회/:/확률 보정·보장 성공 없음/);ui.emit('workshop-enhance','click');assert.equal(ui.profile().inventory.find(i=>i.id===20).enhancement,cap);assert.equal(ui.nodes.get('workshop-enhance').textContent,'최대 +'+cap);assert.equal(ui.nodes.get('workshop-enhance').disabled,true);
  const again=await host({saved:ui.profile()});again.emit('nav-bag','click');again.emit('bag-5','click');again.emit('item-workshop-open','click');assert.equal(again.nodes.get('workshop-enhance').textContent,'최대 +'+cap);
 }
});
test('workshop keeps ordinary grade rerolls and paused-combat upgrades disabled',async()=>{
 const p=bagFixture();p.gold=1000000;p.cores=100;p.materials.boneIron=10000;const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-0','click');ui.emit('item-workshop-open','click');ui.emit('workshop-tab-reroll','click');assert.equal(ui.nodes.get('workshop-reroll').disabled,true);
 const before=ui.profile();ui.emit('workshop-reroll','click');assert.deepEqual(ui.profile(),before);ui.emit('workshop-back','click');assert.equal(ui.nodes.get('item-workshop').hidden,true);assert.equal(ui.document.activeElement.id,'item-workshop-open');
});
test('cold camp opens equipment and backup menus without downloading battle images',async()=>{
 const ui=await host({coldStart:true,saved:bagFixture()}),before=ui.profile();
 assert.equal(ui.requestedImages.length,3);assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.nodes.get('game-shell').attributes['data-combat-ready'],'false');
 ui.emit('nav-bag','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('bag-capacity').textContent,'5 / 200');
 ui.emit('nav-more','click');ui.emit('backup-export','click');assert.equal(ui.downloads.length,1);assert.equal(ui.requestedImages.length,3);assert.deepEqual(ui.profile(),before);
});
test('first hunt waits for validated images, reuses pending work and starts its timer only once',async()=>{
 const ui=await host({coldStart:true,campaign:true,deferredAsset:'assets/lirian_death-v06.webp'});
 ui.emit('start','click');ui.emit('start','click');await ui.settle();ui.run(2);
 assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.hunts,0);assert.equal(ui.state.run.time,0);assert.equal(ui.nodes.get('start').disabled,true);
 assert.equal(ui.requestedImages.filter(p=>p==='assets/lirian_death-v06.webp').length,1);
 await ui.completeDeferredAssets();assert.equal(ui.state.phase,'playing');assert.equal(ui.state.profile.hunts,1);assert.equal(ui.state.run.timeRemaining,60);assert.equal(ui.requestedImages.length,26);
 ui.tick(.05);assert.ok(ui.state.run.timeRemaining<60);
});
test('leaving and returning to cold-launch origin cancels intent but keeps the finished image cache',async()=>{
 const ui=await host({coldStart:true,deferredAsset:'assets/lirian_death-v06.webp'});ui.emit('start','click');ui.emit('nav-more','click');ui.emit('nav-home','click');await ui.completeDeferredAssets();
 assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.hunts,0);assert.equal(ui.nodes.get('game-shell').attributes['data-combat-ready'],'true');
 const count=ui.requestedImages.length;ui.emit('start','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.requestedImages.length,count);
});
test('a partial battle load failure keeps the camp usable and retry never launches an abandoned hunt',async()=>{
 const failures=new Set(['assets/lirian_death-v06.webp']),ui=await host({coldStart:true,failedAssets:failures});ui.emit('start','click');await ui.settle();
 assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.hunts,0);assert.equal(ui.nodes.get('game-shell').attributes['data-combat-ready'],'false');
 assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'11','three camp and eight chapter-1 images (terrain, attack effects, boss, four species atlases, set equipment page), no partial shared commit');
 ui.emit('nav-bag','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);failures.clear();ui.emit('region-retry','click');ui.emit('region-retry','click');await ui.settle();
 assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.hunts,0);assert.equal(ui.nodes.get('game-shell').attributes['data-combat-ready'],'true');ui.emit('nav-home','click');ui.emit('start','click');assert.equal(ui.state.phase,'playing');
});
test('preparation shortcuts use live point budgets, open the requested page and stay inert during combat',async()=>{
 const p=bagFixture();p.level=10;p.skillBook=game.restoreSkillBook(null,10);p.training.power=2;
 const ui=await host({saved:p,campaign:true});ui.emit('nav-hunt','click');assert.equal(ui.nodes.get('map-prepare-growth-note').textContent,'남은 성장 포인트 7');assert.equal(ui.nodes.get('map-prepare-skills-note').textContent,'남은 스킬 강화 '+game.skillPoints(p)+'포인트');
 const before=ui.profile();ui.emit('map-prepare-gear','click');assert.equal(ui.nodes.get('equipment-content').hidden,false);assert.deepEqual(ui.profile(),before);
 ui.emit('nav-hunt','click');ui.emit('map-prepare-growth','click');assert.equal(ui.nodes.get('camp-growth-panel').hidden,false);ui.emit('nav-hunt','click');ui.emit('map-prepare-skills','click');assert.equal(ui.nodes.get('camp-skills-panel').hidden,false);
 ui.emit('nav-home','click');ui.emit('start','click');ui.emit('map-prepare-gear','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.state.paused,false);
 ui.state.phase='defeat';ui.state.run.timedOut=true;ui.tick(0);assert.match(ui.nodes.get('result-note').textContent,/장비.*스킬.*01:00/);ui.emit('result-prepare-growth','click');assert.equal(ui.state.phase,'camp');assert.equal(ui.nodes.get('camp-growth-panel').hidden,false);
});
test('200th item retains action identity, protection and ownership through backup and reload',async()=>{
 const capacity=200,lastIndex=(capacity-1)%9,lastPage=Math.ceil(capacity/9)-1,p=game.createProfile(1_000_000);
 p.inventory=Array.from({length:capacity},(_,n)=>({id:n+1,slot:'weapon',tier:1,artId:'forest_blade',name:'검 '+(n+1),rarity:1,affixes:{damage:8}}));p.nextItemId=capacity+1;
 const ui=await host({saved:p});ui.emit('nav-bag','click');assert.equal(ui.nodes.get('bag-capacity').textContent,'200 / 200');
 for(let page=0;page<lastPage;page++)ui.emit('bag-page-next','click');
 assert.equal(ui.nodes.get('bag-page-next').disabled,true);ui.emit('bag-'+lastIndex,'click');assert.match(ui.nodes.get('item-name-'+lastIndex).textContent,/검 200/);
 ui.emit('equip-'+lastIndex,'click');assert.equal(ui.profile().equipment.weapon,capacity);ui.emit('favorite-'+lastIndex,'click');assert.ok(ui.profile().favoriteItemIds.includes(capacity));
 const loaded=profileBackup.readBackup(profileBackup.createBackup(ui.profile(),1_000_000),1_000_000).profile;
 assert.equal(loaded.inventory.length,capacity);assert.equal(loaded.equipment.weapon,capacity);assert.ok(loaded.favoriteItemIds.includes(capacity));
 const again=await host({saved:loaded});again.emit('nav-bag','click');assert.equal(again.nodes.get('bag-capacity').textContent,'200 / 200');assert.match(again.nodes.get('bag-storage-note').textContent,/가득/);
 for(let page=0;page<lastPage;page++)again.emit('bag-page-next','click');
 assert.equal(again.nodes.get('bag-'+lastIndex).hidden,false);again.emit('bag-'+lastIndex,'click');assert.match(again.nodes.get('item-name-'+lastIndex).textContent,/검 200/);assert.equal(again.nodes.get('bag-47').hidden,true);
});
test('save failures expose a reachable banner and retry keeps live progress',async()=>{
 const ui=await host();ui.setWriteFailure(KEY);ui.emit('start','click');ui.tick();assert.equal(ui.nodes.get('save-banner').hidden,false);assert.equal(ui.nodes.get('game-shell').attributes['data-save-error'],'true');assert.match(ui.nodes.get('save-status').textContent,/자동 저장에 실패/);
 ui.setWriteFailure(null);ui.emit('save-retry','click');assert.equal(ui.nodes.get('save-banner').hidden,true);assert.equal(ui.nodes.get('game-shell').attributes['data-save-error'],'false');assert.equal(ui.profile().level,ui.state.profile.level);
});
test('bag paging preserves bulk selection across pages and all-filter selection protects owned builds',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=Array.from({length:48},(_,n)=>({id:n+1,slot:'weapon',tier:1,artId:'forest_blade',name:'검 '+(n+1),rarity:1,affixes:{damage:8}}));p.nextItemId=49;p.equipment.weapon=1;p.favoriteItemIds=[48];p.savedBuilds[0]={name:'보호',equipment:{weapon:2,armor:null,charm:null}};
 const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-organize','click');ui.emit('bag-select-all','click');assert.match(ui.nodes.get('bag-selected').textContent,/45개 선택/);
 ui.emit('bag-organize','click');ui.emit('bag-organize','click');ui.emit('bag-2','click');ui.emit('bag-page-next','click');ui.emit('bag-0','click');assert.match(ui.nodes.get('bag-selected').textContent,/2개 선택/);
 ui.emit('bag-review','click');assert.match(ui.nodes.get('bag-confirm-list').textContent,/검 3/);assert.match(ui.nodes.get('bag-confirm-list').textContent,/검 10/);ui.emit('bag-confirm','click');
 const after=ui.profile();assert.equal(after.inventory.length,46);assert.ok(!after.inventory.some(i=>i.id===3||i.id===10));assert.ok([1,2,48].every(id=>after.inventory.some(i=>i.id===id)));ui.emit('bag-confirm','click');assert.equal(ui.profile().gold,after.gold);
 ui.emit('bag-favorites','click');assert.equal(ui.nodes.get('bag-page-number').textContent,'1 / 1');assert.equal(ui.nodes.get('bag-pages').hidden,false);assert.equal(ui.nodes.get('bag-page-next').disabled,true);
});
test('emergency backup exports unsaved live progress and releases its download URL',async()=>{
 const ui=await host();ui.state.profile.gold=777;ui.setStorageBlocked(true);ui.emit('window','blur');ui.emit('save-emergency-backup','click');assert.equal(ui.downloads.length,1);
 const file=ui.downloads[0];assert.match(file.filename,/beast-hunter-.*\.json$/);const restored=profileBackup.readBackup(await file.blob.text(),1_000_000);assert.equal(restored.profile.gold,777);assert.equal(ui.revokedURLs.length,0);ui.flushTimers();assert.deepEqual(ui.revokedURLs,[file.url]);
});
test('unreadable existing storage is not overwritten by a fresh session or a restore',async()=>{
 const p=game.createProfile(1_000_000);p.gold=987;const ui=await host({saved:p,readBlocked:true});assert.equal(JSON.parse(ui.storage.get(KEY)).gold,987);ui.run(.1);ui.emit('save-retry','click');assert.equal(ui.reloads,1);assert.equal(JSON.parse(ui.storage.get(KEY)).gold,987);
 ui.emit('nav-more','click');await selectBackup(ui,profileBackup.createBackup(game.createProfile(1_000_000),1_000_000));ui.emit('backup-confirm','click');assert.equal(JSON.parse(ui.storage.get(KEY)).gold,987);assert.equal(ui.storage.has(KEY+':before-restore'),false);
});
test('failed recovery copy keeps a damaged original instead of autosaving a default over it',async()=>{
 const damaged='{"version":8,"gold":987';const ui=await host({saved:damaged,failWriteKey:KEY+':recovery'});
 assert.equal(ui.storage.get(KEY),damaged);assert.equal(ui.storage.has(KEY+':recovery'),false);assert.equal(ui.nodes.get('save-banner').hidden,false);
 ui.run(.1);ui.emit('window','pagehide');assert.equal(ui.storage.get(KEY),damaged);
 ui.emit('nav-more','click');ui.emit('backup-export','click');assert.equal(ui.downloads.length,1);
 await selectBackup(ui,profileBackup.createBackup(game.createProfile(1_000_000),1_000_000));ui.emit('backup-confirm','click');assert.equal(ui.storage.get(KEY),damaged);assert.equal(ui.storage.has(KEY+':before-restore'),false);
 ui.setWriteFailure(null);ui.emit('save-retry','click');assert.equal(ui.reloads,1);assert.equal(ui.storage.get(KEY),damaged);
 const again=await host({saved:damaged});assert.equal(again.storage.get(KEY+':recovery'),damaged);assert.equal(again.profile().version,16);assert.equal(again.nodes.get('save-banner').hidden,true);
});
test('backup restore previews, confirms once, preserves rollback and blocks stale page autosaves',async()=>{
 const ui=await host();ui.state.profile.gold=222;ui.emit('nav-more','click');const p=game.createProfile(1_000_000);p.level=20;p.gold=999;p.skillBook=game.restoreSkillBook(null,20);
 await selectBackup(ui,profileBackup.createBackup(p,1_000_000));assert.equal(ui.nodes.get('backup-review').hidden,false);assert.match(ui.nodes.get('backup-summary').textContent,/Lv.20/);assert.equal(ui.profile().gold,0);
 ui.emit('backup-confirm','click');assert.equal(ui.profile().gold,999);assert.equal(ui.profile().level,20);assert.equal(profileBackup.readBackup(ui.storage.get(KEY+':before-restore'),1_000_000).profile.gold,222);assert.equal(ui.reloads,1);
 const saved=ui.storage.get(KEY);ui.emit('backup-confirm','click');ui.emit('window','pagehide');ui.tick(0);assert.equal(ui.storage.get(KEY),saved);assert.equal(ui.reloads,1);assert.equal(ui.nodes.get('save-banner').hidden,false);assert.equal(ui.nodes.get('save-retry').textContent,'새로고침');
});
test('restore write failure preserves the current primary record and permits a retry',async()=>{
 const ui=await host();ui.emit('nav-more','click');const p=game.createProfile(1_000_000);p.gold=456;await selectBackup(ui,profileBackup.createBackup(p,1_000_000));const before=ui.storage.get(KEY);
 ui.setWriteFailure(KEY+':before-restore');ui.emit('backup-confirm','click');assert.equal(ui.storage.get(KEY),before);assert.equal(ui.reloads,0);
 ui.setWriteFailure(KEY);ui.emit('backup-confirm','click');assert.equal(ui.storage.get(KEY),before);assert.equal(ui.reloads,0);assert.equal(ui.nodes.get('backup-review').hidden,false);
 ui.setWriteFailure(null);ui.emit('backup-confirm','click');assert.equal(ui.profile().gold,456);assert.equal(ui.reloads,1);
});
test('cancelled or abandoned file reads cannot replace a newer restore selection',async()=>{
 const ui=await host();ui.emit('nav-more','click');let finish;ui.nodes.get('backup-file').files=[{size:40,text:()=>new Promise(resolve=>{finish=resolve;})}];ui.emit('backup-file','change');
 const p=game.createProfile(1_000_000);p.gold=800;await selectBackup(ui,profileBackup.createBackup(p,1_000_000));finish('invalid');await ui.settle();assert.equal(ui.nodes.get('backup-review').hidden,false);assert.match(ui.nodes.get('backup-summary').textContent,/800/);
 ui.emit('backup-cancel','click');ui.emit('backup-confirm','click');assert.equal(ui.reloads,0);assert.equal(ui.nodes.get('backup-review').hidden,true);
 await selectBackup(ui,profileBackup.createBackup(p,1_000_000));ui.emit('nav-home','click');ui.emit('backup-confirm','click');assert.equal(ui.reloads,0);assert.equal(ui.nodes.get('backup-review').hidden,true);
});
test('restore controls stay inert during combat and malformed files keep the current record',async()=>{
 const ui=await host();ui.emit('nav-more','click');const before=ui.storage.get(KEY);await selectBackup(ui,'{}');assert.equal(ui.nodes.get('backup-review').hidden,true);assert.equal(ui.storage.get(KEY),before);assert.match(ui.nodes.get('backup-feedback').textContent,/백업 파일/);
 ui.emit('nav-home','click');ui.emit('start','click');ui.nodes.get('backup-file').files=[backupFile(profileBackup.createBackup(game.createProfile(1_000_000),1_000_000))];ui.emit('backup-file','change');ui.emit('backup-confirm','click');await ui.settle();assert.equal(ui.reloads,0);assert.equal(ui.state.phase,'playing');
});
test('equipment thumbnails contain the full frame at small slot sizes without changing inventory identity',async()=>{
 const p=game.createProfile(1_000_000),rows=['weapon','armor','charm'].flatMap(slot=>[game.ITEM_CATALOG.find(r=>r.slot===slot),game.ANCIENT_CATALOG.find(r=>r.slot===slot),game.CRAFTED_CATALOG.find(r=>r.slot===slot)]);
 p.inventory=rows.map((r,n)=>({...r,id:n+1,catalogId:r.id,rarity:n%3===1?5:n%3===2?6:3,affixes:{...r.base}}));p.equipment={weapon:1,armor:4,charm:7};
 const ui=await host({saved:p});ui.emit('nav-bag','click');const before=ui.profile();
 for(let i=0;i<rows.length;i++){
  const node=ui.nodes.get('bag-art-'+i),art=node.atlasImage,{frame,width,height,size}=node.atlasLayout;assert.ok(art);assert.equal(art.hidden,false);assert.equal(art.attributes['aria-hidden'],'true');assert.equal(node.attributes['data-art-id'],equipmentVisuals.visualDesign(ui.state.profile.inventory[i]).id);
  for(const edge of [24,36,44,56,80,96]){
   const sx=parseFloat(art.style.width)/100*edge/width,sy=parseFloat(art.style.height)/100*edge/height,x=parseFloat(art.style.left)/100*edge+frame.x*sx,y=parseFloat(art.style.top)/100*edge+frame.y*sy;
   assert.ok(Math.abs(sx-sy)<1e-10,'uniform scaling');assert.ok(x>=-1e-8&&y>=-1e-8&&x+frame.w*sx<=edge+1e-8&&y+frame.h*sy<=edge+1e-8,'full frame stays inside the slot');
   assert.ok(Math.abs(x-(edge-frame.w*sx)/2)<1e-8&&Math.abs(y-(edge-frame.h*sy)/2)<1e-8,'frame stays centered');assert.ok(Math.abs(Math.max(frame.w*sx,frame.h*sy)-edge*(size-8)/size)<1e-8,'inset survives resizing');
  }
  const child=art;ui.tick(0);assert.equal(node.atlasImage,child,'reuse the image when the frame is unchanged');
 }
 assert.deepEqual(ui.profile(),before);assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'26');
});
test('equipped and crafting thumbnails reuse a responsive image when their actual item source changes',async()=>{
 const p=bagFixture(),ancient=game.ANCIENT_CATALOG.find(r=>r.slot==='weapon');p.inventory.push({...ancient,id:6,catalogId:ancient.id,rarity:5,affixes:{...ancient.base}});
 const ui=await host({saved:p}),slot=ui.nodes.get('equipped-art-weapon');ui.emit('nav-bag','click');const child=slot.atlasImage,firstId=slot.attributes['data-art-id'];ui.emit('bag-2','click');ui.emit('equip-2','click');assert.notEqual(slot.attributes['data-art-id'],firstId);assert.equal(slot.atlasImage,child);assert.deepEqual({...slot.atlasLayout.frame},{...manifest.equipmentPresentation.frames[slot.attributes['data-art-id']]});
 ui.emit('bag-5','click');ui.emit('equip-5','click');assert.equal(slot.atlasImage,child);assert.match(child.src,/ancient-individual-v0123/);assert.equal(child.hidden,false);assert.ok(child.style.width.endsWith('%'));assert.ok(slot.style.clipPath.includes('%'));
 ui.emit('nav-craft','click');const art=ui.nodes.get('craft-recipe-art-0');assert.ok(art.atlasImage.src.includes('craft-equipment-v041'));assert.ok(art.atlasImage.style.width.endsWith('%'));assert.ok(art.style.clipPath.includes('%'));
});
test('pause presents only resume and camp, traps focus, freezes the hunt and returns collected progress once',async()=>{
 const ui=await host({campaign:true});ui.emit('start','click');ui.tick();ui.stick(1,0);ui.tick();ui.emit('pause','click');
 assert.equal(ui.nodes.get('pause-content').hidden,false);assert.equal(ui.nodes.get('game-shell').attributes['data-panel'],'pause');assert.equal(ui.document.activeElement.id,'resume');
 const menu=html.slice(html.indexOf('<div id="pause-content"'),html.indexOf('\n',html.indexOf('<div id="pause-content"')));
 assert.deepEqual([...menu.matchAll(/<button[^>]*id="([^"]+)"/g)].map(m=>m[1]),['resume','retreat']);assert.match(menu,/>사냥 계속<\/button>/);assert.match(menu,/>거점으로<\/button>/);
 for(const id of ['pause-stage','pause-progress','pause-level','pause-health','pause-stamina','pause-growth','pause-inventory','pause-track','pause-loadout','pause-tactic'])assert.equal(ui.nodes.has(id),false,id);
 const snapshot=JSON.stringify([ui.state.run.time,ui.state.run.timeRemaining,ui.state.player.x,ui.state.player.y,ui.state.enemies,ui.state.skillRuntime.cooldowns]);ui.run(2);assert.equal(JSON.stringify([ui.state.run.time,ui.state.run.timeRemaining,ui.state.player.x,ui.state.player.y,ui.state.enemies,ui.state.skillRuntime.cooldowns]),snapshot);
 ui.emit('document','keydown',{key:'Tab'});assert.equal(ui.document.activeElement.id,'retreat');ui.emit('document','keydown',{key:'Tab',shiftKey:true});assert.equal(ui.document.activeElement.id,'resume');
 const x=ui.state.player.x;ui.emit('resume','click');assert.equal(ui.nodes.get('overlay').hidden,true);ui.run(.2);assert.equal(ui.state.player.x,x);assert.equal(ui.state.paused,false);
 ui.emit('pause','click');const before=ui.profile();ui.emit('retreat','click');assert.equal(ui.state.phase,'camp');assert.equal(ui.state.paused,false);assert.equal(ui.nodes.get('pause-content').hidden,true);assert.equal(ui.nodes.get('camp-content').hidden,false);assert.ok(ui.profile().gold>=before.gold);
 const camp=ui.profile();ui.emit('retreat','click');ui.emit('resume','click');assert.deepEqual(ui.profile(),camp);assert.equal(ui.state.phase,'camp');assert.equal(ui.nodes.get('camp-content').hidden,false);
});
test('equipped skill art follows real loadouts and presets while locked sockets remain empty',async()=>{
 const low=await host();low.emit('nav-more','click');low.emit('nav-skills','click');assert.equal(low.nodes.get('skill-slot-active-1').disabled,true);assert.equal(low.nodes.get('skill-slot-art-active-1').hidden,true);assert.equal(low.nodes.get('skill-slot-active-1').attributes['data-empty'],'true');assert.match(low.nodes.get('skill-slot-active-1').attributes['aria-label'],/해금/);
 const p=game.createProfile(1_000_000);p.level=25;p.skillBook=game.restoreSkillBook(null,25);const ui=await host({saved:p});ui.emit('nav-more','click');ui.emit('nav-skills','click');
 for(const [kind,ids]of Object.entries(ui.profile().skillBook.loadout))for(let i=0;i<ids.length;i++){const id=ids[i],art=ui.nodes.get('skill-slot-art-'+kind+'-'+i);assert.equal(art.hidden,!id);if(id)assert.equal(art.src,game.SKILL_BY_ID[id].icon);}
 const before=ui.nodes.get('skill-slot-art-active-0').src;ui.emit('skill-preset-save-0','click');ui.emit('skill-card-draw','click');ui.emit('skill-equip-0','click');assert.equal(ui.nodes.get('skill-slot-art-active-0').src,game.SKILL_BY_ID.draw.icon);assert.match(ui.nodes.get('skill-slot-active-0').attributes['aria-label'],/발도/);ui.emit('skill-preset-load-0','click');assert.equal(ui.nodes.get('skill-slot-art-active-0').src,before);
});
test('skill details start at their heading and list return restores the active filter focus',async()=>{
 const ui=await host();ui.emit('nav-more','click');ui.emit('nav-skills','click');const before=ui.profile();ui.emit('skill-tab-passive','click');ui.emit('skill-card-flow','click');assert.equal(ui.nodes.get('skill-detail').pageRevealed,true);
 ui.emit('skill-list-back','click');assert.equal(ui.nodes.get('skill-library').pageRevealed,true);assert.equal(ui.document.activeElement.id,'skill-tab-passive');assert.equal(ui.nodes.get('skill-card-crescent').hidden,true);assert.equal(ui.nodes.get('skill-card-flow').hidden,false);assert.deepEqual(ui.profile(),before);
 ui.emit('page-back','click');ui.emit('start','click');const focus=ui.document.activeElement;ui.emit('skill-list-back','click');assert.equal(ui.document.activeElement,focus);assert.equal(ui.state.phase,'playing');
});
test('all ten stage buttons preserve selected identity through redraws, repeated chapter taps and navigation',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[1,1,1];p.difficultyProgress=[[9,9,9],[9,9,9]];widen(p);
 const ui=await host({saved:p,campaign:true});ui.emit('nav-hunt','click');pickChapter(ui,1);const before=ui.profile();
 for(const mode of [0,1,2]){ui.emit('map-mode-'+mode,'click');for(let n=1;n<=10;n++){
  ui.emit('run-stage-'+n,'click');ui.tick(0);ui.emit('stage-1','click');ui.emit('map-mode-'+mode,'click');
  for(let i=1;i<=10;i++)assert.equal(ui.nodes.get('run-stage-'+i).attributes['aria-pressed'],String(i===n));
  assert.equal(ui.nodes.get('run-stage-number-'+n).textContent,String(n).padStart(2,'0'));assert.equal(ui.nodes.get('run-stage-state-'+n).textContent,'선택');assert.equal(ui.nodes.get('stage-preview-title').textContent,'1-'+n+' · '+game.battlePlan(n).name);assert.equal(ui.nodes.get('stage-preview-kind').textContent,game.HUNT_MODES[mode].name+' · '+game.STAGE_TYPE_NAMES[game.battlePlan(n).stageType]);
  assert.match(ui.nodes.get('camp-map-launch-meta').textContent,new RegExp('STAGE '+String(n).padStart(2,'0')+'.*'+game.HUNT_MODES[mode].name));
 }}
 ui.emit('run-stage-7','click');ui.emit('nav-bag','click');ui.emit('page-back','click');ui.emit('nav-hunt','click');assert.equal(ui.nodes.get('run-stage-7').attributes['aria-pressed'],'true');assert.deepEqual(ui.profile(),before);
 ui.emit('camp-map-start','click');await ui.settle();assert.equal(ui.state.run.stage,7);assert.equal(ui.state.difficulty,2);
});
test('map difficulty remains visible before boss clearance and locked activation preserves progress',async()=>{
 const ui=await host(),before=ui.profile();ui.emit('nav-hunt','click');
 assert.equal(ui.nodes.get('camp-map-panel').hidden,false);assert.equal(ui.nodes.get('replay-panel').hidden,true);
 assert.equal(ui.nodes.get('map-mode-0').disabled,false);assert.equal(ui.nodes.get('map-mode-0').attributes['aria-pressed'],'true');
 assert.equal(ui.nodes.get('map-mode-1').disabled,true);assert.equal(ui.nodes.get('map-mode-2').disabled,true);
 assert.match(ui.nodes.get('map-mode-status-1').textContent,/일반 보스 처치/);assert.match(ui.nodes.get('map-mode-status-2').textContent,/정예 보스 처치/);
 ui.emit('map-mode-1','click');ui.emit('map-mode-2','click');assert.equal(ui.nodes.get('run-stage-1').attributes['aria-pressed'],'true');assert.deepEqual(ui.profile(),before);
 ui.emit('camp-map-start','click');assert.equal(ui.state.difficulty,0);assert.equal(ui.state.run.stage,1);
 ui.emit('map-mode-2','click');assert.equal(ui.state.difficulty,0);assert.equal(ui.state.run.stage,1);
});
test('map difficulty applies chapter-specific unlocks and launches the selected difficulty from stage one',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[0,1,2];widen(p);
 for(const chapter of [1,11,21]){
  const ui=await host({saved:p,campaign:true});ui.emit('nav-hunt','click');pickChapter(ui,chapter);ui.emit('run-stage-3','click');const before=ui.profile();
  assert.equal(ui.nodes.get('map-mode-1').disabled,false);assert.equal(ui.nodes.get('map-mode-2').disabled,chapter===1);
  const mode=chapter===1?1:2;ui.emit('map-mode-'+mode,'click');assert.equal(ui.nodes.get('run-stage-1').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('hunt-mode-'+mode).attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('map-mode-'+mode).attributes['aria-pressed'],'true');
  assert.match(ui.nodes.get('hub-route-meta').textContent,new RegExp(game.HUNT_MODES[mode].name));assert.deepEqual(ui.profile(),before);
  ui.emit('camp-map-start','click');await ui.settle();assert.equal(ui.state.phase,'playing');assert.equal(ui.state.stageId,chapter);assert.equal(ui.state.run.stage,1);assert.equal(ui.state.difficulty,mode);
 }
});
test('map and reward difficulty share a campaign choice while switching modes starts at one',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=2;p.unlockedStage=2;p.stageProgress=[10,10,0];p.bossMastery=[1,0,-1];p.difficultyProgress=[[3,2,0],[0,0,0]];widen(p);const ui=await host({saved:p});ui.emit('nav-hunt','click');pickChapter(ui,1);ui.emit('map-mode-2','click');ui.emit('camp-tactics-open','click');assert.equal(ui.nodes.get('hunt-mode-2').attributes['aria-pressed'],'true');
 ui.emit('hunt-mode-1','click');assert.equal(ui.nodes.get('map-mode-1').attributes['aria-pressed'],'true');ui.emit('document','keydown',{key:'Escape'});ui.emit('run-stage-4','click');assert.equal(ui.nodes.get('map-mode-1').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('hunt-mode-1').attributes['aria-pressed'],'true');
 ui.emit('map-mode-0','click');assert.equal(ui.nodes.get('run-stage-1').attributes['aria-pressed'],'true','changing difficulty starts from stage one');
 ui.emit('map-mode-2','click');pickChapter(ui,11);assert.equal(ui.nodes.get('map-mode-0').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('map-mode-2').disabled,true,'previous chapter mastery must not unlock this chapter');
});
test('changing map difficulty cancels a pending cold launch and a fresh click uses the new mode',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=1;p.unlockedStage=1;p.stageProgress=[10,0,0];p.bossMastery=[1,-1,-1];const ui=await host({saved:p,coldStart:true,campaign:true,deferredAsset:'assets/lirian_death-v06.webp'});
 ui.emit('nav-hunt','click');ui.emit('map-mode-2','click');ui.emit('camp-map-start','click');await ui.settle();assert.equal(ui.state.phase,'camp');
 ui.emit('map-mode-1','click');await ui.completeDeferredAssets();assert.equal(ui.state.phase,'camp');assert.equal(ui.profile().hunts,p.hunts);assert.equal(ui.nodes.get('map-mode-1').attributes['aria-pressed'],'true');
 ui.emit('camp-map-start','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.state.run.stage,1);assert.equal(ui.state.difficulty,1);
});
test('boss reward view shows actual selected mode values and prepares the map without launching',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=1;p.unlockedStage=1;p.stageProgress=[10,0,0];p.bossMastery=[1,-1,-1];const ui=await host({saved:p,campaign:true});const before=ui.profile();ui.emit('nav-hunt','click');ui.emit('run-stage-2','click');ui.emit('camp-tactics-open','click');assert.equal(ui.nodes.get('camp-tactics-panel').hidden,false);assert.equal(ui.nodes.get('camp-map-panel').hidden,true);assert.equal(ui.document.activeElement.id,'page-back');assert.equal(ui.nodes.get('replay-ancient').textContent,'1%');ui.emit('hunt-mode-2','click');assert.equal(ui.nodes.get('replay-hp').textContent,'2.2배');assert.equal(ui.nodes.get('replay-damage').textContent,'1.55배');assert.equal(ui.nodes.get('replay-gold').textContent,'2배');assert.equal(ui.nodes.get('replay-ancient').textContent,'3%');assert.match(ui.nodes.get('replay-combat-note').textContent,/탄막 \+4발.*핵 \+2/);assert.deepEqual(ui.profile(),before);ui.emit('replay-prepare','click');assert.equal(ui.state.phase,'camp');assert.equal(ui.nodes.get('camp-map-panel').hidden,false);assert.equal(ui.nodes.get('camp-tactics-panel').hidden,true);assert.equal(ui.nodes.get('run-stage-1').attributes['aria-pressed'],'true');assert.equal(ui.document.activeElement.id,'camp-map-start');ui.emit('camp-map-start','click');assert.equal(ui.state.difficulty,2);assert.equal(ui.state.run.stage,1);
});
test('boss reward view preserves unlocks and backs out to the same selected map checkpoint',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=1;p.unlockedStage=1;p.stageProgress=[10,0,0];p.bossMastery=[0,-1,-1];const ui=await host({saved:p,campaign:true});ui.emit('nav-hunt','click');ui.emit('run-stage-3','click');ui.emit('camp-tactics-open','click');assert.equal(ui.nodes.get('hunt-mode-2').disabled,true);ui.emit('hunt-mode-2','click');assert.equal(ui.nodes.get('replay-ancient').textContent,'1%');ui.emit('hunt-mode-1','click');assert.equal(ui.nodes.get('replay-hp').textContent,'1.5배');assert.equal(ui.nodes.get('replay-ancient').textContent,'2%');assert.equal(ui.nodes.get('replay-step-0').attributes['data-done'],'true');assert.equal(ui.nodes.get('replay-step-2').attributes['data-done'],'false');ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('camp-map-panel').hidden,false);assert.equal(ui.document.activeElement.id,'camp-tactics-open');assert.equal(ui.nodes.get('run-stage-1').attributes['aria-pressed'],'true');
});
test('uncleared boss reward view explains its gate and cannot open during a hunt',async()=>{
 const ui=await host();ui.emit('nav-hunt','click');ui.emit('camp-tactics-open','click');assert.equal(ui.nodes.get('replay-panel').hidden,true);assert.equal(ui.nodes.get('replay-locked').hidden,false);ui.emit('replay-prepare','click');assert.equal(ui.state.phase,'camp');ui.emit('tactics-map-back','click');assert.equal(ui.nodes.get('camp-map-panel').hidden,false);ui.emit('camp-map-start','click');assert.equal(ui.state.run.stage,1);ui.emit('camp-tactics-open','click');assert.equal(ui.nodes.get('camp-content').hidden,true);const failed=await host({failedAssets:true});failed.emit('camp-tactics-open','click');assert.equal(failed.nodes.get('camp-tactics-panel').hidden,true);
});
test('portrait more drawer uses one camp view and closes to a visible navigation origin',async()=>{
 const ui=await host();const before=ui.profile();ui.emit('nav-more','click');assert.equal(ui.nodes.get('camp-more-panel').hidden,false);assert.equal(ui.nodes.get('camp-map-panel').hidden,true);assert.equal(ui.nodes.get('camp-growth-panel').hidden,true);assert.equal(ui.nodes.get('camp-map-launch').hidden,true);assert.equal(ui.nodes.get('game-shell').attributes['data-camp-view'],'more');
 ui.emit('nav-codex','click');assert.equal(ui.nodes.get('codex-content').hidden,false);assert.equal(ui.nodes.get('camp-drawer').hidden,true);ui.emit('nav-more','click');ui.emit('nav-growth','click');assert.equal(ui.nodes.get('camp-growth-panel').hidden,false);assert.equal(ui.nodes.get('camp-more-panel').hidden,true);ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.document.activeElement.id,'nav-more');assert.equal(ui.nodes.get('camp-drawer').hidden,true);assert.deepEqual(ui.profile(),before);
});
test('portrait navigation preserves real stage selection and displays real character statistics',async()=>{
 const p=game.createProfile(1_000_000);p.unlockedStage=3;p.clearedStage=3;p.stageProgress=[10,10,10];widen(p);const ui=await host({saved:p,campaign:true});ui.emit('nav-more','click');ui.emit('nav-hunt','click');pickChapter(ui,11);ui.emit('run-stage-3','click');assert.equal(ui.nodes.get('run-stage-3').attributes['data-number'],'11–3');assert.equal(ui.nodes.get('run-stage-3').attributes['data-state'],'cleared');ui.emit('nav-bag','click');assert.equal(ui.nodes.get('persona-level').textContent,'Lv. '+p.level);assert.equal(ui.nodes.get('persona-damage').textContent,String(Math.round(game.playerStats(ui.profile()).damage)));ui.emit('page-back','click');assert.equal(ui.nodes.get('camp-content').hidden,false);ui.emit('nav-hunt','click');await ui.settle();ui.emit('camp-map-start','click');assert.equal(ui.state.stageId,11);assert.equal(ui.state.run.stage,3);assert.equal(ui.nodes.get('camp-drawer').hidden,true);
});
test('portrait more cannot open during loading failure or combat and tracker needs an actual target',async()=>{
 const failed=await host({failedAssets:true});failed.emit('nav-more','click');assert.equal(failed.nodes.get('camp-drawer').hidden,true);const ui=await host();ui.emit('nav-more','click');assert.equal(ui.nodes.get('more-track').disabled,true);ui.emit('more-track','click');assert.equal(ui.nodes.get('track-content').hidden,true);ui.emit('nav-home','click');ui.emit('start','click');ui.emit('nav-more','click');assert.equal(ui.nodes.get('camp-drawer').hidden,true);ui.emit('pause','click');ui.emit('nav-more','click');assert.equal(ui.nodes.get('pause-content').hidden,false);assert.equal(ui.state.paused,true);
});
test('illustration home is independent of equipped gear and preserves equipment when returning from menus',async()=>{
 const p=game.createProfile(1_000_000);const row=game.CRAFTED_CATALOG[1];p.inventory=[{id:1,catalogId:row.id,slot:row.slot,tier:row.tier,artId:row.artId,name:row.name,rarity:6,affixes:{...row.base}}];p.equipment.weapon=1;
 const ui=await host({saved:p});const hero=ui.nodes.get('camp-character');assert.equal(hero.atlasFrame,undefined);assert.match(html,/<img id="camp-character"[^>]*src="assets\/lirian_home-illustration-v027.png"/);assert.ok(fs.existsSync(new URL('assets/lirian_home-illustration-v027.png',root)));assert.equal(ui.nodes.get('camp-drawer').hidden,true);assert.equal(ui.nodes.get('hub-ui').hidden,false);assert.match(ui.nodes.get('hub-route-name').textContent,new RegExp(game.STAGES[0].name));assert.equal(ui.profile().equipment.weapon,1);
 ui.emit('camp-inventory','click');ui.emit('inventory-back','click');assert.equal(hero.atlasFrame,undefined);assert.equal(ui.profile().equipment.weapon,1);assert.equal(ui.nodes.get('hub-ui').hidden,false);
});
test('camp map and growth drawers preserve locked selection, keyboard close focus and selected hunt route',async()=>{
 const ui=await host();ui.emit('hub-map','click');assert.equal(ui.nodes.get('camp-map-panel').hidden,false);assert.equal(ui.nodes.get('hub-ui').hidden,true);assert.equal(ui.document.activeElement.id,'page-back');ui.emit('stage-3','click');assert.match(ui.nodes.get('hub-route-name').textContent,new RegExp(game.STAGES[0].name));ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('camp-drawer').hidden,true);assert.equal(ui.document.activeElement.id,'hub-map');ui.emit('hub-growth','click');assert.equal(ui.nodes.get('camp-growth-panel').hidden,false);ui.emit('camp-drawer-close','click');assert.equal(ui.document.activeElement.id,'hub-growth');
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];widen(p);const unlocked=await host({saved:p,campaign:true});unlocked.emit('hub-route','click');pickChapter(unlocked,11);unlocked.emit('run-stage-3','click');unlocked.emit('camp-drawer-close','click');assert.match(unlocked.nodes.get('hub-route-name').textContent,new RegExp(game.STAGES[10].name+'.*갑각 돌파'));await unlocked.settle();unlocked.emit('start','click');assert.equal(unlocked.state.stageId,11);assert.equal(unlocked.state.run.stage,3);assert.equal(unlocked.state.phase,'playing');unlocked.emit('hub-map','click');assert.equal(unlocked.nodes.get('camp-drawer').hidden,true);
});
test('map footer launches the selected route once and stays hidden in growth',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[1,1,1];widen(p);const ui=await host({saved:p,campaign:true});
 await ui.settle();ui.emit('camp-map-start','click');assert.equal(ui.state.phase,'camp');ui.emit('hub-growth','click');assert.equal(ui.nodes.get('camp-map-launch').hidden,true);ui.emit('camp-drawer-close','click');ui.emit('hub-map','click');assert.equal(ui.nodes.get('camp-map-launch').hidden,false);pickChapter(ui,11);ui.emit('run-stage-3','click');assert.equal(ui.nodes.get('camp-map-launch-name').textContent,ui.nodes.get('hub-route-name').textContent);await ui.settle();ui.emit('camp-map-start','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.state.stageId,11);assert.equal(ui.state.run.stage,3);const run=ui.state.run;await ui.settle();ui.emit('camp-map-start','click');assert.equal(ui.state.run,run);assert.equal(ui.nodes.get('overlay').hidden,true);
});
test('failed assets keep icon drawers inert and no character-only view can launch an unready game',async()=>{
 const ui=await host({failedAssets:true});ui.emit('hub-map','click');ui.emit('hub-growth','click');assert.equal(ui.nodes.get('camp-drawer').hidden,true);assert.equal(ui.nodes.get('loading').hidden,false);ui.emit('camp-map-start','click');ui.emit('start','click');assert.equal(ui.state.phase,'camp');
});
const bagFixture=()=>{const p=game.createProfile(1_000_000);p.inventory=['3-weapon-1','1-charm-2','1-weapon-1','1-charm-4','1-armor-1'].map((id,n)=>{const r=game.ITEM_CATALOG.find(r=>r.id===id);return {id:n+1,catalogId:id,slot:r.slot,tier:r.tier,artId:r.artId,name:r.name,rarity:3,affixes:{...r.base}};});p.equipment={weapon:1,armor:5,charm:2};return p;};

test('equipment and bag are distinct screens and cold camp renders the real hunter without battle downloads',async()=>{
 const p=bagFixture(),ui=await host({coldStart:true,saved:p}),before=ui.profile();ui.emit('nav-equipment','click');
 assert.equal(ui.nodes.get('equipment-content').hidden,false);assert.equal(ui.nodes.get('inventory-content').hidden,true);assert.equal(ui.nodes.get('game-shell').attributes['data-panel'],'equipment');assert.equal(ui.nodes.get('nav-equipment').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('page-title').textContent,'장비');assert.equal(ui.requestedImages.length,3);
 assert.equal(ui.nodes.get('equipment-preview').attributes['aria-label'],'리리안 기본 모습');for(const slot of game.EQUIPMENT_KEYS)assert.equal(ui.nodes.get('equipped-name-'+slot).textContent,p.inventory.find(i=>i.id===p.equipment[slot])?.name??'미착용');
 ui.emit('loadout-bag-open','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('equipment-content').hidden,true);assert.equal(ui.nodes.get('page-title').textContent,'가방');assert.equal(ui.nodes.get('nav-bag').attributes['aria-pressed'],'true');
 ui.emit('nav-equipment','click');assert.equal(ui.nodes.get('equipment-content').hidden,false);ui.emit('loadout-build-open','click');assert.equal(ui.nodes.get('inventory-build-view').hidden,false);assert.equal(ui.nodes.get('page-title').textContent,'빌드');ui.emit('nav-home','click');assert.deepEqual(ui.profile(),before);
 const scene=html.slice(html.indexOf('<div id="equipment-content"'),html.indexOf('<div id="inventory-content"'));assert.equal([...scene.matchAll(/<canvas /g)].length,1);assert.ok(scene.includes('id="equipment-preview"'));for(const slot of game.EQUIPMENT_KEYS)assert.ok(scene.includes('id="equipped-open-'+slot+'"'));
 assert.equal(html.slice(html.indexOf('<div id="inventory-content"')).includes('id="equipment-preview"'),false);
});
test('equipment scene reads real levels, slots and synergies while its camp links preserve ownership',async()=>{
 const p=bagFixture();p.level=47;p.xp=Math.ceil(game.xpNeeded(47)*.63);p.inventory[0].enhancement=12;p.inventory[4].enhancement=11;
 const ui=await host({saved:p}),before=ui.profile();ui.emit('nav-equipment','click');
 assert.equal(ui.nodes.get('equipment-equipped-count').textContent,'착용 3 / 9');assert.equal(ui.nodes.get('equipment-xp-label').textContent,'63%');assert.equal(ui.nodes.get('equipment-xp').attributes['aria-valuenow'],'63');assert.equal(ui.nodes.get('equipped-level-weapon').textContent,'+12');
 assert.match(String(ui.nodes.get('persona-health').textContent),/^\d+(?:\.\d)?$/);assert.ok(Math.abs(Number(ui.nodes.get('persona-health').textContent)-game.playerStats(ui.profile()).maxHp)<=.050001);
 assert.equal(ui.nodes.get('equipment-link-state-shatter').textContent,'활성');assert.equal(ui.nodes.get('equipment-link-state-execute').textContent,'미완성');assert.equal(ui.nodes.get('equipment-link-name-shatter').textContent,game.EQUIPMENT_SYNERGIES[0].name);
 ui.emit('equipment-link-shatter','click');assert.equal(ui.nodes.get('inventory-build-view').hidden,false);assert.equal(ui.document.activeElement.id,'equipped-synergies-title');
 for(const view of ['skills','growth','codex']){ui.emit('nav-equipment','click');ui.emit('equipment-menu-'+view,'click');if(view==='codex')assert.equal(ui.nodes.get('codex-content').hidden,false);else assert.equal(ui.nodes.get('game-shell').attributes['data-camp-view'],view);ui.emit('page-back','click');if(view!=='codex')assert.equal(ui.document.activeElement.id,view==='skills'?'lobby-skills':'hub-growth');}
 ui.emit('nav-home','click');assert.deepEqual(ui.profile(),before);ui.emit('start','click');ui.tick();for(const view of ['skills','growth','codex'])ui.emit('equipment-menu-'+view,'click');assert.equal(ui.state.phase,'playing');assert.equal(ui.nodes.get('camp-skills-panel').hidden,true);assert.equal(ui.nodes.get('codex-content').hidden,true);
 const q=game.createProfile(1_000_000);q.level=game.MAX_LEVEL;const empty=await host({saved:q});empty.emit('nav-equipment','click');assert.equal(empty.nodes.get('equipment-xp-label').textContent,'MAX');assert.equal(empty.nodes.get('equipment-xp').attributes['aria-valuenow'],'100');assert.equal(empty.nodes.get('equipment-equipped-count').textContent,'착용 0 / 9');assert.equal(empty.nodes.get('equipped-level-weapon').textContent,'기본');assert.equal(empty.nodes.get('equipped-open-weapon').disabled,false);assert.equal(empty.nodes.get('equipment-link-state-shatter').textContent,'미완성');
});
test('crafted earrings expose a second craft then route each owned instance to explicit wearable selection',async()=>{
 const p=game.createProfile(1_000_000);p.gold=20000;for(const m of game.MATERIALS)p.materials[m.id]=1000;const ui=await host({saved:p});
 ui.emit('nav-craft','click');ui.emit('craft-slot-charm','click');ui.emit('craft-recipe-9','click');ui.emit('craft-submit','click');assert.match(ui.nodes.get('craft-ready').textContent,/보유 1 \/ 2/);assert.equal(ui.nodes.get('craft-submit').disabled,false);assert.equal(ui.nodes.get('craft-equip').hidden,true);
 ui.emit('craft-submit','click');assert.equal(ui.profile().inventory.length,2);assert.equal(ui.nodes.get('craft-submit').disabled,true);assert.equal(ui.nodes.get('craft-equip').hidden,false);assert.equal(ui.nodes.get('craft-equip').textContent,'착용 위치 선택');ui.emit('craft-equip','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('earring-target-0').hidden,false);
 ui.nodes.get('equip-position-0').value='earringRight';ui.emit('equip-position-0','change');ui.emit('equip-0','click');assert.equal(ui.profile().equipment.earringRight,1);assert.equal(ui.profile().equipment.earringLeft,null);
});
test('nine-slot inventory groups armor parts, chooses either earring position and preserves ownership after resize',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=['helmet','armor','pants','boots','charm','earring','earring','special'].map((slot,n)=>rollItem({id:n+1,tier:1,slot,quality:0},()=>.5));p.equipment.earringLeft=6;p.equipment.earringRight=7;
 const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-tab-armor','click');assert.equal(ui.nodes.get('bag-capacity').textContent,'8 / 200');assert.equal(ui.nodes.get('bag-3').attributes['data-empty'],'false');assert.equal(ui.nodes.get('bag-4').attributes['data-empty'],'true');
 ui.nodes.get('bag-part').value='helmet';ui.emit('bag-part','change');assert.equal(ui.nodes.get('bag-0').attributes['data-empty'],'false');assert.equal(ui.nodes.get('bag-1').attributes['data-empty'],'true');
 ui.emit('bag-tab-charm','click');ui.emit('bag-1','click');assert.equal(ui.nodes.get('earring-target-1').hidden,false);assert.equal(ui.nodes.get('equip-position-1').value,'earringLeft');
 ui.nodes.get('equip-position-1').value='earringRight';ui.emit('equip-position-1','change');assert.equal(ui.nodes.get('equip-1').disabled,false);ui.emit('equip-1','click');assert.equal(ui.profile().equipment.earringLeft,null);assert.equal(ui.profile().equipment.earringRight,6);assert.equal(ui.nodes.get('salvage-1').disabled,true);
 ui.emit('nav-home','click');ui.emit('nav-equipment','click');assert.equal(ui.nodes.get('equipped-open-earringLeft').attributes['data-empty'],'true');ui.emit('equipped-open-earringLeft','click');assert.equal(ui.nodes.get('bag-part').value,'earring');assert.equal(ui.nodes.get('bag-tab-charm').attributes['aria-pressed'],'true');
 assert.equal(new Set(Object.values(ui.profile().equipment).filter(Boolean)).size,1);
});
test('worn item details find the 48th identity and return to the correct equipment slot',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=Array.from({length:48},(_,n)=>({id:n+1,slot:'weapon',tier:1,artId:'forest_blade',name:'검 '+(n+1),rarity:1,affixes:{damage:8}}));p.nextItemId=49;p.equipment.weapon=48;
 const ui=await host({saved:p}),before=ui.profile();ui.emit('nav-equipment','click');ui.emit('equipped-open-weapon','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('equipment-content').hidden,true);assert.equal(ui.nodes.get('bag-page-number').textContent,'6 / 6');assert.match(ui.nodes.get('item-name-2').textContent,/검 48/);assert.equal(ui.nodes.get('item-2').hidden,false);assert.equal(ui.nodes.get('salvage-2').disabled,true);
 ui.emit('bag-detail-close','click');assert.equal(ui.nodes.get('equipment-content').hidden,false);assert.equal(ui.nodes.get('bag-detail').hidden,true);assert.equal(ui.document.activeElement.id,'equipped-open-weapon');assert.deepEqual(ui.profile(),before);
 ui.emit('nav-bag','click');ui.emit('bag-0','click');ui.emit('page-back','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('equipment-content').hidden,true);assert.equal(ui.document.activeElement.id,'bag-0');
});
test('materials have independent quantities, empty states and no equipment storage or salvage actions',async()=>{
 const p=bagFixture();p.materials.boneIron=1234;p.materials.origin=1_000_000;const ui=await host({saved:p}),before=ui.profile();ui.emit('nav-bag','click');ui.emit('bag-organize','click');ui.emit('bag-select-all','click');ui.emit('bag-review','click');ui.emit('bag-tab-materials','click');
 assert.equal(ui.nodes.get('bag-materials').hidden,false);assert.equal(ui.nodes.get('bag-grid').hidden,true);assert.equal(ui.nodes.get('bag-bulk').hidden,true);assert.equal(ui.nodes.get('bag-confirmation').hidden,true);assert.equal(ui.nodes.get('inventory-empty').hidden,true);assert.equal(ui.nodes.get('bag-pages').hidden,true);assert.equal(ui.nodes.get('bag-capacity').textContent,'재료 2 / 13종');assert.equal(ui.nodes.get('bag-material-count-boneIron').textContent,'1234');assert.equal(ui.nodes.get('bag-material-count-origin').textContent,'1000000');assert.equal(ui.nodes.get('bag-material-hide').attributes['data-owned'],'false');
 ui.emit('salvage-0','click');ui.emit('bag-confirm','click');ui.emit('bag-organize','click');assert.equal(ui.nodes.get('bag-bulk').hidden,true);assert.deepEqual(ui.profile(),before);
 ui.state.profile.materials.boneIron=7;ui.tick(0);assert.equal(ui.nodes.get('bag-material-count-boneIron').textContent,'7');ui.emit('bag-tab-weapon','click');assert.equal(ui.nodes.get('bag-materials').hidden,true);assert.equal(ui.nodes.get('bag-grid').hidden,false);assert.equal(ui.nodes.get('bag-sort').hidden,false);assert.equal(ui.nodes.get('bag-tab-weapon').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('bag-slot').value,'weapon');assert.equal(ui.nodes.get('bag-2').hidden,false);assert.equal(ui.nodes.get('bag-2').disabled,true);
});
test('material category select and crafting route preserve collected progress and remain camp-only',async()=>{
 const ui=await host({saved:bagFixture()});ui.emit('nav-bag','click');ui.nodes.get('bag-slot').value='materials';ui.emit('bag-slot','change');assert.equal(ui.nodes.get('bag-materials').hidden,false);ui.emit('bag-material-craft','click');assert.equal(ui.nodes.get('craft-content').hidden,false);ui.emit('nav-home','click');ui.emit('start','click');ui.tick();ui.emit('document','keydown',{key:'i'});ui.emit('bag-tab-materials','click');
 const time=ui.state.run.time,inventory=JSON.stringify(ui.state.profile.inventory);assert.equal(ui.nodes.get('bag-material-craft').disabled,true);ui.emit('bag-material-craft','click');assert.equal(ui.nodes.get('craft-content').hidden,true);ui.run(1);assert.equal(ui.state.run.time,time);assert.equal(JSON.stringify(ui.state.profile.inventory),inventory);
 ui.emit('inventory-back','click');assert.equal(ui.nodes.get('pause-content').hidden,false);ui.emit('resume','click');ui.run(.1);assert.equal(ui.state.paused,false);
});

test('equipment item pages reuse fixed cells and preserve every surrounding control',async()=>{
 const p=game.createProfile(1_000_000);p.materials.boneIron=17;p.inventory=Array.from({length:20},(_,n)=>({id:n+1,slot:'weapon',tier:1,artId:n%2?'forest_fang':'forest_blade',name:'검 '+(n+1),rarity:1,affixes:{damage:8+n}}));p.nextItemId=21;const ui=await host({saved:p});ui.emit('nav-bag','click');
 const chrome=['inventory-content','bag-categories','bag-capacity','bag-storage-note','bag-sort','bag-grid','bag-pages'].map(id=>({id,node:ui.nodes.get(id),style:JSON.stringify(ui.nodes.get(id).style),text:ui.nodes.get(id).textContent}));const cells=Array.from({length:9},(_,n)=>ui.nodes.get('bag-'+n)),art=ui.nodes.get('bag-art-0').atlasImage,materials={...ui.state.profile.materials};
 assert.equal(ui.nodes.get('bag-page-number').textContent,'1 / 3');assert.equal(ui.nodes.get('bag-page-prev').disabled,true);ui.emit('bag-page-next','click');assert.equal(ui.nodes.get('bag-page-number').textContent,'2 / 3');assert.match(ui.nodes.get('bag-0').attributes['aria-label'],/검 10/);assert.equal(ui.nodes.get('bag-art-0').attributes['data-art-id'],'forest_fang');assert.equal(ui.nodes.get('bag-art-0').atlasImage,art);
 for(const snapshot of chrome){assert.equal(ui.nodes.get(snapshot.id),snapshot.node);assert.equal(JSON.stringify(snapshot.node.style),snapshot.style);assert.equal(snapshot.node.textContent,snapshot.text);}for(let i=0;i<9;i++)assert.equal(ui.nodes.get('bag-'+i),cells[i]);assert.equal(ui.nodes.get('bag-grid').pageRevealed,undefined);
 ui.emit('bag-page-next','click');assert.equal(ui.nodes.get('bag-page-number').textContent,'3 / 3');assert.equal(ui.nodes.get('bag-2').hidden,false);assert.equal(ui.nodes.get('bag-2').disabled,true);assert.equal(ui.nodes.get('bag-page-next').disabled,true);ui.emit('bag-page-next','click');assert.equal(ui.nodes.get('bag-page-number').textContent,'3 / 3');ui.emit('bag-page-prev','click');ui.emit('bag-0','click');ui.emit('equip-0','click');assert.equal(ui.profile().equipment.weapon,10);ui.emit('bag-detail-close','click');assert.equal(ui.nodes.get('bag-page-number').textContent,'2 / 3');assert.deepEqual({...ui.state.profile.materials},materials);
 ui.emit('bag-tab-materials','click');const count=ui.nodes.get('bag-material-count-boneIron').textContent;assert.equal(ui.nodes.get('bag-pages').hidden,true);ui.emit('bag-page-next','click');assert.equal(ui.nodes.get('bag-material-count-boneIron').textContent,count);assert.deepEqual({...ui.state.profile.materials},materials);ui.emit('nav-equipment','click');ui.emit('loadout-build-open','click');assert.equal(ui.nodes.get('bag-pages').hidden,true);
});

test('bag density fills measured list width and height and pages only overflow items',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=Array.from({length:48},(_,n)=>({id:n+1,slot:'weapon',tier:1,artId:'forest_blade',name:'검 '+(n+1),rarity:1,affixes:{damage:8}}));p.nextItemId=49;p.materials.boneIron=1234;
 const ui=await host({saved:p,bagBox:{width:362,height:360}}),before=ui.profile();ui.emit('nav-bag','click');
 const grid=ui.nodes.get('bag-grid'),categories=ui.nodes.get('bag-categories'),pager=ui.nodes.get('bag-pages');
 assert.equal(grid.style['--bag-columns'],'5');assert.equal(grid.style['--bag-rows'],'5');assert.equal(ui.nodes.get('bag-page-number').textContent,'1 / 2');assert.equal(ui.nodes.get('bag-24').hidden,false);assert.equal(ui.nodes.get('bag-25').hidden,true);
 ui.emit('bag-page-next','click');assert.match(ui.nodes.get('bag-0').attributes['aria-label'],/검 26/);assert.match(ui.nodes.get('bag-22').attributes['aria-label'],/검 48/);assert.equal(ui.nodes.get('bag-23').hidden,false);assert.equal(ui.nodes.get('bag-23').disabled,true);assert.equal(ui.nodes.get('bag-page-next').disabled,true);
 ui.resizeBag(452,450);assert.equal(grid.style['--bag-columns'],'6');assert.equal(grid.style['--bag-rows'],'6');assert.equal(ui.nodes.get('bag-35').hidden,false);assert.equal(ui.nodes.get('bag-36').hidden,true);assert.match(ui.nodes.get('bag-25').attributes['aria-label'],/검 26/);
 const layout=grid.attributes['data-layout'];ui.resizeBag(0,0);ui.resizeBag(NaN,Infinity);assert.equal(grid.attributes['data-layout'],layout);
 ui.resizeBag(452,700);assert.equal(ui.nodes.get('bag-page-number').textContent,'1 / 1');assert.match(ui.nodes.get('bag-47').attributes['aria-label'],/검 48/);assert.equal(ui.nodes.get('bag-47').hidden,false);assert.equal(ui.nodes.get('bag-page-next').disabled,true);
 assert.equal(ui.nodes.get('bag-grid'),grid);assert.equal(ui.nodes.get('bag-categories'),categories);assert.equal(ui.nodes.get('bag-pages'),pager);assert.equal(grid.pageRevealed,undefined);assert.deepEqual(ui.profile(),before);
 ui.emit('bag-tab-materials','click');ui.resizeBag(300,220);assert.equal(ui.nodes.get('bag-material-grid').style['--bag-columns'],'4');assert.equal(ui.nodes.get('bag-material-grid').style['--bag-rows'],'4');assert.equal(ui.nodes.get('bag-pages').hidden,true);assert.equal(ui.nodes.get('bag-material-count-boneIron').textContent,'1234');assert.deepEqual(ui.profile(),before);
});
test('bag resizing preserves focused and selected item identities including detail actions',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=Array.from({length:48},(_,n)=>({id:n+1,slot:'weapon',tier:1,artId:'forest_blade',name:'검 '+(n+1),rarity:1,affixes:{damage:8}}));p.nextItemId=49;
 const ui=await host({saved:p,bagBox:{width:362,height:360}});ui.emit('nav-bag','click');ui.emit('bag-page-next','click');ui.emit('bag-13','click');assert.match(ui.nodes.get('item-name-13').textContent,/검 39/);ui.nodes.get('favorite-13').focus();
 ui.resizeBag(300,220);assert.equal(ui.nodes.get('bag-page-number').textContent,'4 / 4');assert.equal(ui.nodes.get('item-2').hidden,false);assert.match(ui.nodes.get('item-name-2').textContent,/검 39/);assert.equal(ui.document.activeElement.id,'favorite-2');ui.emit('equip-2','click');assert.equal(ui.profile().equipment.weapon,39);ui.emit('bag-detail-close','click');assert.equal(ui.document.activeElement.id,'bag-2');
 ui.resizeBag(362,360);assert.equal(ui.nodes.get('bag-page-number').textContent,'2 / 2');assert.equal(ui.document.activeElement.id,'bag-13');assert.match(ui.nodes.get('bag-13').attributes['aria-label'],/검 39/);ui.emit('bag-13','click');assert.equal(ui.nodes.get('salvage-13').disabled,true);
 ui.emit('bag-detail-close','click');ui.emit('bag-organize','click');ui.emit('bag-0','click');assert.match(ui.nodes.get('bag-selected').textContent,/1개 선택/);ui.resizeBag(300,220);ui.emit('bag-review','click');assert.match(ui.nodes.get('bag-confirm-list').textContent,/검 26/);ui.emit('bag-confirm','click');assert.ok(!ui.profile().inventory.some(item=>item.id===26));assert.equal(ui.profile().equipment.weapon,39);
 ui.emit('nav-home','click');const layout=ui.nodes.get('bag-grid').attributes['data-layout'];ui.resizeBag(452,450);assert.equal(ui.nodes.get('bag-grid').attributes['data-layout'],layout);
});

test('empty and filtered item pages keep every frame and clear stale item art and actions',async()=>{
 const ui=await host({saved:bagFixture(),bagBox:{width:362,height:360}});ui.emit('nav-bag','click');
 const visible=()=>Array.from({length:48},(_,i)=>ui.nodes.get('bag-'+i)).filter(node=>!node.hidden);
 const child=ui.nodes.get('bag-art-0').atlasImage;assert.equal(visible().length,25);
 ui.nodes.get('loot-filter').value='6';ui.emit('loot-filter','change');assert.equal(visible().length,25);assert.ok(visible().every(node=>node.disabled&&node.attributes['data-empty']==='true'));
 for(let i=0;i<25;i++){assert.equal(ui.nodes.get('bag-art-'+i).hidden,true);assert.equal(ui.nodes.get('bag-badge-'+i).textContent,'');assert.equal(ui.nodes.get('bag-check-'+i).textContent,'');}
 const before=ui.profile();ui.emit('bag-0','click');ui.emit('equip-0','click');ui.emit('salvage-0','click');assert.equal(ui.nodes.get('bag-detail').hidden,true);assert.deepEqual(ui.profile(),before);
 ui.emit('bag-filter-reset','click');assert.equal(visible().length,25);assert.equal(ui.nodes.get('bag-art-0').hidden,false);assert.equal(ui.nodes.get('bag-art-0').atlasImage,child);assert.equal(ui.nodes.get('bag-0').disabled,false);assert.equal(ui.nodes.get('bag-5').disabled,true);
 const empty=game.createProfile(1_000_000),blank=await host({saved:empty,bagBox:{width:362,height:360}});blank.emit('nav-bag','click');assert.equal(Array.from({length:48},(_,i)=>blank.nodes.get('bag-'+i)).filter(node=>!node.hidden).length,25);assert.equal(blank.nodes.get('inventory-empty').hidden,false);assert.equal(blank.nodes.get('bag-page-number').textContent,'1 / 1');
});
test('materials show only owned kinds and preserve frame count when quantities reach zero or return',async()=>{
 const p=game.createProfile(1_000_000);p.materials.boneIron=10;p.materials.origin=1;const ui=await host({saved:p,bagBox:{width:362,height:360}});ui.emit('nav-bag','click');ui.emit('bag-tab-materials','click');
 const owned=()=>game.MATERIALS.filter(m=>!ui.nodes.get('bag-material-'+m.id).hidden).map(m=>m.id),blanks=()=>Array.from({length:48},(_,i)=>ui.nodes.get('bag-material-empty-'+i)).filter(node=>!node.hidden).length;
 assert.deepEqual(owned(),['boneIron','origin']);assert.equal(blanks(),23);assert.equal(ui.nodes.get('bag-material-actions').hidden,false);assert.equal(ui.nodes.get('bag-pages').hidden,true);
 ui.state.profile.materials.boneIron=0;ui.state.profile.materials.root=7;ui.tick(0);assert.deepEqual(owned(),['root','origin']);assert.equal(blanks(),23);assert.equal(ui.nodes.get('bag-material-count-root').textContent,'7');
 ui.state.profile.materials.root=0;ui.state.profile.materials.origin=0;ui.tick(0);assert.deepEqual(owned(),[]);assert.equal(blanks(),25);ui.resizeBag(300,220);assert.equal(blanks(),16);
 ui.state.profile.materials.crystal=99;ui.tick(0);assert.deepEqual(owned(),['crystal']);assert.equal(blanks(),15);assert.equal(ui.nodes.get('bag-material-count-crystal').textContent,'99');ui.emit('bag-tab-all','click');assert.equal(ui.nodes.get('bag-material-actions').hidden,true);assert.equal(Array.from({length:48},(_,i)=>ui.nodes.get('bag-'+i)).filter(node=>!node.hidden).length,12);
});
test('detail sections show signed real comparisons and update status without changing item identity',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=[{id:1,slot:'weapon',tier:1,artId:'forest_blade',name:'기준 검',rarity:1,affixes:{damage:20,hp:30,crit:3}},{id:2,slot:'weapon',tier:1,artId:'forest_fang',name:'긴 이름의 붉은 달 사냥꾼 검',rarity:3,affixes:{damage:35,hp:5,crit:8}}];p.equipment.weapon=1;p.nextItemId=3;
 const ui=await host({saved:p});ui.emit('nav-bag','click');ui.emit('bag-1','click');assert.equal(ui.nodes.get('bag-detail').attributes['aria-labelledby'],'item-name-1');assert.match(ui.nodes.get('item-meta-1').textContent,/무기/);assert.equal(ui.nodes.get('item-status-1').textContent,'보관 중');
 for(const [key]of Object.entries(game.AFFIXES)){const affixes=ui.state.profile.inventory[1].affixes,present=Object.hasOwn(affixes,key);assert.equal(ui.nodes.get('item-affix-row-'+key+'-1').hidden,!present);assert.equal(ui.nodes.get('item-affix-value-'+key+'-1').textContent,present?'+'+affixes[key]+(['speed','crit','reduction'].includes(key)?'%':''):'');}
 const delta=game.compareItem(ui.state.profile,2).deltas;let positive=false,negative=false;
 for(const [key,scale]of [['damage',1],['maxHp',1],['speed',1],['crit',100],['reduction',100],['thunderDamage',1]]){const v=Math.round(delta[key]*scale*10)/10,node=ui.nodes.get('item-change-'+key+'-1');assert.equal(node.textContent,v===0?'—':(v>0?'+':'')+v+(scale===100?'%p':''));assert.equal(node.attributes['data-sign'],v>0?'positive':v<0?'negative':'zero');positive ||= v>0;negative ||= v<0;}
 assert.ok(positive&&negative);const image=ui.nodes.get('item-art-1').atlasImage;ui.emit('equip-1','click');assert.equal(ui.profile().equipment.weapon,2);assert.equal(ui.nodes.get('item-status-1').textContent,'착용 중');assert.equal(ui.nodes.get('salvage-1').disabled,true);assert.equal(ui.nodes.get('item-change-damage-1').textContent,'—');assert.equal(ui.nodes.get('item-change-damage-1').attributes['data-sign'],'zero');ui.emit('favorite-1','click');assert.match(ui.nodes.get('item-status-1').textContent,/즐겨찾기/);assert.equal(ui.nodes.get('item-art-1').atlasImage,image);ui.emit('bag-detail-close','click');assert.equal(ui.document.activeElement.id,'bag-1');
});

test('detail reads every long effect without scrolling or changing the fixed item and actions',async()=>{
 const p=game.createProfile(1_000_000),row=game.CRAFTED_CATALOG[0];p.inventory=[{id:1,catalogId:row.id,slot:row.slot,tier:row.tier,artId:row.artId,name:row.name,rarity:6,affixes:{...row.base}}];p.nextItemId=2;
 const ui=await host({saved:p,detailBox:{width:180,height:70}});ui.emit('nav-bag','click');ui.emit('bag-0','click');const before=ui.profile(),art=ui.nodes.get('item-art-0').atlasImage,action=ui.nodes.get('equip-0'),chrome=ui.nodes.get('bag-page-number').textContent;
 const stored=ui.profile().inventory[0],ranges=game.itemRollRanges(stored),rangeNote='기본 옵션 범위 (강화 보너스 제외)\n'+Object.entries(ranges).map(([k,r])=>game.AFFIXES[k]+' '+stored.affixes[k]+' ['+r.min+'~'+r.max+']').join(' · ');
 const trait=ui.nodes.get('item-trait-0'),original=['획득처 · '+game.equipmentAcquisition(stored),rangeNote,!trait.hidden?'무기 특성\n'+trait.textContent:'','고유 효과\n'+ui.nodes.get('item-unique-0').textContent].filter(Boolean).join('\n\n'),pages=[];assert.equal(ui.nodes.get('item-read-prev-0').disabled,true);assert.equal(ui.nodes.get('item-read-next-0').disabled,false);
 for(let i=0;i<100;i++){const text=ui.nodes.get('item-read-text-0').textContent;assert.ok(text.split('\n').length<=3);assert.ok(text.split('\n').every(line=>line.length*18<=178));pages.push(text);if(ui.nodes.get('item-read-next-0').disabled)break;ui.emit('item-read-next-0','click');}
 assert.equal(pages.join('\n').replaceAll('\n',''),original.replaceAll('\n',''));assert.ok(pages.length>1);const last=ui.nodes.get('item-read-page-0').textContent;ui.emit('item-read-next-0','click');assert.equal(ui.nodes.get('item-read-page-0').textContent,last);assert.equal(ui.nodes.get('item-art-0').atlasImage,art);assert.equal(ui.nodes.get('equip-0'),action);assert.equal(ui.nodes.get('bag-page-number').textContent,chrome);assert.deepEqual(ui.profile(),before);
 ui.resizeDetail(380,220);const [page,total]=ui.nodes.get('item-read-page-0').textContent.split(' / ').map(Number);assert.ok(page>=1&&page<=total);assert.equal(ui.nodes.get('item-stat-grid-0').hidden,false);assert.equal(ui.nodes.get('item-affix-row-damage-0').hidden,false);assert.ok(ui.nodes.get('item-affix-value-damage-0').textContent.startsWith('+'));assert.deepEqual(ui.profile(),before);
 assert.equal(html.includes('item-tab-'),false);const hero=html.match(/<article id="item-0"[^>]*><header.*?<\/header>/)[0];assert.ok(hero.includes('id="item-core-stats-0"'));
});
test('unified detail reading follows selected identity through resize and resets on another item',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=Array.from({length:48},(_,n)=>({id:n+1,slot:'weapon',tier:1,artId:'forest_blade',name:'검 '+(n+1),rarity:1,affixes:{damage:8}}));p.nextItemId=49;
 const ui=await host({saved:p,bagBox:{width:362,height:360},detailBox:{width:90,height:45}});ui.emit('nav-bag','click');ui.emit('bag-page-next','click');ui.emit('bag-13','click');assert.equal(ui.nodes.get('item-read-next-13').disabled,false);ui.emit('item-read-next-13','click');const page=ui.nodes.get('item-read-page-13').textContent;ui.nodes.get('item-read-prev-13').focus();ui.resizeBag(300,220);assert.equal(ui.nodes.get('item-read-page-2').textContent,page);assert.equal(ui.document.activeElement.id,'item-read-prev-2');assert.equal(ui.nodes.get('item-stat-grid-2').hidden,false);assert.match(ui.nodes.get('item-name-2').textContent,/검 39/);ui.emit('equip-2','click');assert.equal(ui.profile().equipment.weapon,39);
 ui.emit('bag-detail-close','click');ui.emit('bag-0','click');assert.equal(ui.nodes.get('item-read-prev-0').disabled,true);assert.equal(ui.nodes.get('item-stat-grid-0').hidden,false);ui.emit('bag-detail-close','click');const before=ui.profile(),text=ui.nodes.get('item-read-text-0').textContent;ui.emit('item-read-next-0','click');ui.resizeDetail(0,0);assert.equal(ui.nodes.get('item-read-text-0').textContent,text);assert.deepEqual(ui.profile(),before);
});

test('bag views and layered back actions preserve the profile and never open details on exploration',async()=>{
 const ui=await host({saved:bagFixture()}),before=ui.profile();ui.emit('nav-bag','click');assert.equal(ui.nodes.get('inventory-gear-view').hidden,false);assert.equal(ui.nodes.get('inventory-build-view').hidden,true);assert.equal(ui.document.activeElement.id,'page-back');assert.equal(ui.nodes.get('bag-capacity').textContent,'5 / 200');
 ui.emit('bag-2','pointerenter');ui.emit('bag-2','focus');assert.equal(ui.nodes.get('bag-detail').hidden,true);ui.emit('bag-2','click');assert.equal(ui.document.activeElement.id,'bag-detail-close');assert.equal(ui.nodes.get('bag-detail').hidden,false);ui.emit('page-back','click');assert.equal(ui.nodes.get('bag-detail').hidden,true);assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.document.activeElement.id,'bag-2');
 ui.emit('bag-organize','click');assert.equal(ui.nodes.get('bag-bulk').hidden,false);ui.emit('loadout-build-open','click');assert.equal(ui.nodes.get('inventory-gear-view').hidden,true);assert.equal(ui.nodes.get('inventory-build-view').hidden,false);assert.equal(ui.nodes.get('bag-bulk').hidden,true);assert.equal(ui.nodes.get('page-title').textContent,'빌드');ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('inventory-gear-view').hidden,false);assert.equal(ui.nodes.get('bag-bulk').hidden,false);ui.emit('bag-organize','click');ui.emit('page-back','click');assert.equal(ui.nodes.get('inventory-content').hidden,true);assert.deepEqual(ui.profile(),before);
});

test('armory category shortcuts and folded filters act on real identities without changing ownership',async()=>{
 const ui=await host({saved:bagFixture()}),before=ui.profile();ui.emit('nav-bag','click');ui.emit('bag-tab-weapon','click');assert.equal(ui.nodes.get('bag-slot').value,'weapon');assert.equal(ui.nodes.get('bag-1').hidden,false);assert.equal(ui.nodes.get('bag-2').hidden,false);assert.equal(ui.nodes.get('bag-2').disabled,true);ui.emit('bag-1','click');assert.match(ui.nodes.get('item-name-1').textContent,/붉은 잎 검/);ui.emit('bag-detail-close','click');
 ui.emit('bag-filter-toggle','click');assert.equal(ui.nodes.get('bag-filters').hidden,false);ui.nodes.get('bag-slot').value='charm';ui.emit('bag-slot','change');assert.equal(ui.nodes.get('bag-tab-charm').attributes['aria-pressed'],'true');ui.emit('bag-favorites','click');assert.equal(ui.nodes.get('inventory-empty').hidden,false);ui.emit('bag-filter-reset','click');assert.equal(ui.nodes.get('bag-slot').value,'all');assert.equal(ui.nodes.get('bag-tab-all').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('bag-filter-dot').hidden,true);assert.equal(ui.nodes.get('bag-capacity').textContent,'5 / 200');assert.deepEqual(ui.profile(),before);
});

test('armory slot icons and statistics follow equips and saved builds without a character weapon overlay',async()=>{
 const ui=await host({saved:bagFixture()});ui.emit('nav-bag','click');const frost=ui.nodes.get('equipped-art-weapon').attributes['data-art-id'];assert.equal(ui.nodes.get('equipment-synergy-name').textContent,'빙결 파쇄');ui.emit('loadout-build-open','click');ui.emit('build-save-0','click');ui.emit('nav-bag','click');
 ui.emit('bag-2','click');ui.emit('equip-2','click');assert.notEqual(ui.nodes.get('equipped-art-weapon').attributes['data-art-id'],frost);const leaf=ui.nodes.get('equipped-art-weapon').attributes['data-art-id'];ui.emit('equip-3','click');assert.equal(ui.nodes.get('equipped-art-weapon').attributes['data-art-id'],leaf);assert.equal(ui.nodes.get('equipment-synergy-name').textContent,'출혈 처형');assert.equal(ui.nodes.get('equipment-synergy-status').textContent,'활성');
 ui.emit('equipment-synergy-open','click');assert.equal(ui.nodes.get('inventory-build-view').hidden,false);assert.equal(ui.nodes.get('bag-detail').hidden,true);assert.equal(ui.document.activeElement.id,'equipped-synergies-title');ui.emit('build-apply-0','click');assert.equal(ui.nodes.get('equipped-art-weapon').attributes['data-art-id'],frost);assert.equal(ui.nodes.get('equipment-synergy-name').textContent,'빙결 파쇄');assert.equal(ui.nodes.get('persona-damage').textContent,String(Math.round(game.playerStats(ui.profile()).damage)));
});

test('armory empty and paused states stay truthful and detail back never resumes combat',async()=>{
 const empty=await host();empty.emit('nav-bag','click');assert.equal(empty.nodes.get('bag-capacity').textContent,'0 / 200');assert.equal(empty.nodes.get('inventory-empty').hidden,false);assert.equal(empty.nodes.get('equipped-open-weapon').disabled,false);assert.equal(empty.nodes.get('equipment-synergy-status').textContent,'조합 찾기');
 const ui=await host({saved:bagFixture()});ui.emit('start','click');ui.tick();ui.emit('pause','click');ui.emit('document','keydown',{key:'i'});const time=ui.state.run.time;ui.emit('bag-2','click');ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('bag-detail').hidden,true);ui.run(.5);assert.equal(ui.state.run.time,time);assert.equal(ui.state.paused,true);ui.emit('loadout-build-open','click');ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('inventory-gear-view').hidden,false);ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('pause-content').hidden,false);assert.equal(ui.state.paused,true);
});

test('armory display atlas covers every base identity without adding combat boot images or replacing ancient art',async()=>{
 const display=manifest.equipmentPresentation;assert.deepEqual(display.designIds,chapters.EQUIPMENT_ART.map(r=>r.id));assert.ok(fs.existsSync(new URL('assets/'+manifest.delivery[display.image],root)));
 for(const id of display.designIds){const f=display.frames[id];assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=display.width&&f.y+f.h<=display.height);if(display.weaponAnchors[id]){const a=display.weaponAnchors[id];for(const k of ['gripX','gripY','tipX','tipY'])assert.ok(Number.isFinite(a[k]));assert.ok(a.gripX>=0&&a.gripX<f.w&&a.tipX>=0&&a.tipX<f.w&&a.gripY>=0&&a.gripY<f.h&&a.tipY>=0&&a.tipY<f.h);}}
 const p=bagFixture(),ancient=game.ANCIENT_CATALOG[0];p.inventory.push({...ancient,id:6,catalogId:ancient.id,rarity:5,affixes:{...ancient.base}});const ui=await host({saved:p});ui.emit('nav-bag','click');assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'26');assert.match(ui.nodes.get('bag-art-0').atlasImage.src,/armory-equipment-v040.webp/);assert.match(ui.nodes.get('bag-art-5').atlasImage.src,/ancient-individual-v0123.webp/);assert.equal(ui.nodes.has('equipment-hero-weapon'),false);const before=ui.profile();ui.emit('bag-5','click');ui.emit('equip-5','click');assert.match(ui.nodes.get('equipped-art-weapon').atlasImage.src,/ancient-individual-v0123.webp/);assert.equal(ui.profile().inventory.length,before.inventory.length);
});

test('live home panels mirror ownership and opening an item does not equip it',async()=>{
 const p=bagFixture(),ui=await host({saved:p});assert.equal(ui.nodes.get('dashboard-capacity').textContent,'5 / 200');assert.equal(ui.nodes.get('dashboard-weapon-name').textContent,p.inventory[0].name);assert.equal(ui.nodes.get('dashboard-item-5').hidden,true);
 ui.emit('dashboard-item-2','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.match(ui.nodes.get('item-name-2').textContent,/붉은 잎 검/);assert.equal(ui.profile().equipment.weapon,1);ui.emit('equip-2','click');ui.emit('inventory-back','click');assert.equal(ui.nodes.get('dashboard-weapon-name').textContent,p.inventory[2].name);assert.equal(ui.nodes.get('dashboard-damage').textContent,Math.round(game.playerStats(ui.profile()).damage));
});

test('camp navigation keeps locked stages unavailable and cannot reopen camp during combat',async()=>{
 const ui=await host();ui.emit('nav-hunt','click');assert.equal(ui.nodes.get('camp-drawer').hidden,false);assert.equal(ui.nodes.get('dashboard-stage-2').disabled,true);ui.emit('dashboard-stage-2','click');ui.emit('nav-home','click');assert.equal(ui.nodes.get('camp-drawer').hidden,true);ui.emit('dashboard-start','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.state.run.stage,1);ui.emit('nav-craft','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.nodes.get('craft-content').hidden,true);assert.equal(ui.nodes.get('overlay').hidden,true);
});

test('home stage markers use the selected real chapter and preserve its unlocked checkpoint',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=1;p.unlockedStage=2;p.stageProgress=[10,2,0];const ui=await host({saved:p,campaign:true});assert.equal(ui.nodes.get('dashboard-stage-number-3').textContent,'2–3');assert.equal(ui.nodes.get('dashboard-stage-3').disabled,false);assert.equal(ui.nodes.get('dashboard-stage-4').disabled,true);ui.emit('dashboard-stage-1','click');assert.match(ui.nodes.get('dashboard-stage-meta').textContent,/2–1/);ui.emit('dashboard-start','click');assert.equal(ui.state.stageId,2);assert.equal(ui.state.run.stage,1);
});

test('explicit home and worn item entry clears conflicting filters and organize mode',async()=>{
 const ui=await host({saved:bagFixture()});ui.emit('camp-inventory','click');ui.nodes.get('bag-slot').value='armor';ui.emit('bag-slot','change');ui.emit('inventory-back','click');ui.emit('dashboard-weapon-open','click');assert.equal(ui.nodes.get('bag-detail').hidden,false);assert.match(ui.nodes.get('item-name-0').textContent,/빙결 수정검/);assert.equal(ui.nodes.get('bag-slot').value,'all');
 ui.emit('bag-organize','click');ui.emit('inventory-back','click');ui.emit('dashboard-item-2','click');assert.equal(ui.nodes.get('bag-organize').attributes['aria-pressed'],'false');assert.equal(ui.nodes.get('bag-detail').hidden,false);assert.match(ui.nodes.get('item-name-2').textContent,/붉은 잎 검/);
 ui.emit('bag-organize','click');ui.emit('equipped-open-armor','click');assert.equal(ui.nodes.get('bag-detail').hidden,false);assert.equal(ui.nodes.get('bag-organize').attributes['aria-pressed'],'false');assert.match(ui.nodes.get('item-name-4').textContent,/숲지기 흉갑/);assert.equal(ui.profile().equipment.weapon,1);assert.equal(ui.profile().equipment.armor,5);
});
test('icon bag opens details only on activation, not hover or focus, and exposes real comparisons',async()=>{
 const ui=await host({saved:bagFixture()});ui.emit('camp-inventory','click');assert.equal(ui.nodes.get('bag-0').hidden,false);assert.equal(ui.nodes.get('bag-detail').hidden,true);ui.emit('bag-2','pointerenter',{pointerType:'mouse'});ui.emit('bag-2','focus');assert.equal(ui.nodes.get('bag-detail').hidden,true);assert.equal(ui.nodes.get('item-2').hidden,true);
 ui.emit('bag-2','click');assert.equal(ui.nodes.get('item-2').hidden,false);assert.match(ui.nodes.get('item-synergy-2').textContent,/해제 · 빙결 파쇄/);assert.match(ui.nodes.get('item-compare-2').textContent,/착용 후 변화/);assert.equal(ui.document.activeElement.id,'bag-detail-close');ui.emit('bag-0','pointerenter',{pointerType:'mouse'});ui.emit('bag-0','focus');assert.equal(ui.nodes.get('item-2').hidden,false);assert.equal(ui.nodes.get('item-0').hidden,true);
 ui.emit('bag-3','click');assert.equal(ui.nodes.get('item-3').hidden,false);assert.equal(ui.nodes.get('item-2').hidden,true);ui.emit('equip-2','click');assert.match(ui.nodes.get('item-synergy-3').textContent,/활성화 · 출혈 처형/);ui.emit('bag-detail-close','click');ui.emit('bag-0','pointerenter',{pointerType:'mouse'});ui.emit('bag-0','focus');assert.equal(ui.nodes.get('bag-detail').hidden,true);ui.emit('bag-0','click');assert.equal(ui.nodes.get('item-0').hidden,false);ui.emit('inventory-back','click');ui.emit('camp-inventory','click');assert.equal(ui.nodes.get('bag-detail').hidden,true);
});
test('build UI saves names and complete equipment, updates synergy preview, applies in camp and restores',async()=>{
 const ui=await host({saved:bagFixture()});ui.emit('camp-inventory','click');ui.nodes.get('build-name-0').value='빙결 파쇄';ui.emit('build-save-0','click');ui.emit('equip-2','click');ui.emit('equip-3','click');ui.nodes.get('build-name-1').value='출혈 처형';ui.emit('build-save-1','click');assert.match(ui.nodes.get('build-compare-0').textContent,/교체 후 공격.*체력.*치명타/);assert.equal(game.compareEquipment(ui.state.profile,ui.state.profile.savedBuilds[0].equipment).gained[0].name,'빙결 파쇄');ui.emit('build-apply-0','click');assert.equal(ui.state.synergies[0].id,'shatter');assert.deepEqual(ui.profile().equipment,{...game.createProfile(0).equipment,weapon:1,armor:5,charm:2});
 const again=await host({saved:ui.profile()});again.emit('camp-inventory','click');assert.equal(again.nodes.get('build-name-1').value,'출혈 처형');again.emit('inventory-back','click');again.emit('start','click');again.tick();again.emit('pause','click');again.emit('document','keydown',{key:'i'});assert.equal(again.nodes.get('build-apply-1').disabled,true);const before=again.profile().equipment;again.emit('build-apply-1','click');assert.deepEqual(again.profile().equipment,before);assert.equal(again.state.paused,true);again.emit('inventory-back','click');assert.equal(again.nodes.get('pause-content').hidden,false);
});
test('favorite filtering, sort and bulk confirmation act on identities and keep protected items',async()=>{
 const ui=await host({saved:bagFixture()});ui.emit('camp-inventory','click');ui.emit('bag-2','click');ui.emit('favorite-2','click');assert.equal(ui.nodes.get('salvage-2').disabled,true);ui.emit('build-save-0','click');ui.emit('equip-2','click');ui.emit('equip-3','click');ui.emit('bag-organize','click');ui.emit('bag-select-all','click');assert.match(ui.nodes.get('bag-selected').textContent,/0개 선택/);ui.emit('build-delete-0','click');ui.emit('bag-select-all','click');assert.match(ui.nodes.get('bag-selected').textContent,/2개 선택/);
 ui.emit('bag-review','click');assert.equal(ui.nodes.get('bag-confirmation').hidden,false);assert.equal(ui.profile().inventory.length,5);ui.emit('bag-cancel','click');assert.equal(ui.profile().inventory.length,5);ui.emit('bag-review','click');ui.emit('bag-confirm','click');assert.equal(ui.profile().inventory.length,3);const gold=ui.profile().gold;ui.emit('bag-confirm','click');assert.equal(ui.profile().gold,gold);assert.ok(ui.profile().inventory.some(i=>i.id===3));ui.emit('bag-organize','click');ui.emit('bag-favorites','click');assert.equal(ui.nodes.get('bag-1').hidden,false);assert.equal(ui.nodes.get('bag-1').disabled,true);ui.emit('bag-0','click');assert.match(ui.nodes.get('item-name-0').textContent,/붉은 잎 검/);assert.equal(ui.nodes.get('salvage-0').disabled,true);
});
test('craft recipe can be targeted without selecting other recipes changing the goal, and it restores or clears independently',async()=>{
 const p=game.createProfile(1_000_000);p.targetAncientId=game.ANCIENT_CATALOG[0].id;const ui=await host({saved:p});ui.emit('camp-craft','click');ui.emit('craft-target','click');assert.equal(ui.profile().targetCraftId,game.CRAFTED_CATALOG[1].id);ui.emit('craft-recipe-0','click');assert.equal(ui.profile().targetCraftId,game.CRAFTED_CATALOG[1].id);ui.emit('craft-track','click');assert.equal(ui.nodes.get('track-name').textContent,game.CRAFTED_CATALOG[0].name);assert.equal(ui.nodes.get('track-material-tear').hidden,false);assert.equal(ui.nodes.get('track-clear').hidden,true);assert.equal(ui.profile().targetCraftId,game.CRAFTED_CATALOG[1].id);ui.emit('track-back','click');assert.equal(ui.nodes.get('craft-content').hidden,false);assert.equal(ui.document.activeElement.id,'craft-track');ui.emit('craft-track','click');assert.match(ui.nodes.get('track-missing-origin').textContent,/부족 1개/);
 const again=await host({saved:ui.profile()});again.emit('camp-track','click');assert.equal(again.nodes.get('track-name').textContent,game.CRAFTED_CATALOG[1].name);again.emit('track-clear','click');assert.equal(again.profile().targetCraftId,null);assert.equal(again.profile().targetAncientId,p.targetAncientId);assert.equal(again.nodes.get('camp-track').hidden,true);
});
test('compact combat tracker pauses on detail, hides persistently, keeps routes inert while paused and clears held input',async()=>{
 const p=game.createProfile(1_000_000);p.targetCraftId=game.CRAFTED_CATALOG[1].id;const ui=await host({manual:true,saved:p});ui.emit('start','click');ui.tick();assert.equal(ui.nodes.get('craft-tracker').hidden,false);ui.stick(1,0);ui.tick();ui.emit('craft-tracker','click');const time=ui.state.run.time,x=ui.state.player.x;assert.equal(ui.state.paused,true);assert.equal(ui.nodes.get('track-content').hidden,false);assert.equal(ui.nodes.get('track-route-1').disabled,true);ui.emit('track-route-1','click');ui.run(3);assert.equal(ui.state.run.time,time);assert.equal(ui.state.player.x,x);
 ui.emit('track-hide','click');assert.equal(ui.profile().craftTrackerVisible,false);ui.emit('track-back','click');assert.equal(ui.nodes.get('pause-content').hidden,false);ui.emit('resume','click');ui.run(.15);assert.equal(ui.state.paused,false);assert.equal(ui.nodes.get('craft-tracker').hidden,true);assert.equal(ui.state.player.x,x);assert.ok(ui.state.run.time>time);ui.emit('pause','click');ui.emit('document','keydown',{key:'i'});assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('track-content').hidden,true);ui.emit('inventory-back','click');assert.equal(ui.nodes.get('pause-content').hidden,false);
 const restored=await host({manual:true,saved:ui.profile()});assert.equal(restored.profile().craftTrackerVisible,false);
});
test('routes validate locked regional material and select real elite or boss stage without launching combat',async()=>{
 const p=game.createProfile(1_000_000);p.targetCraftId=game.CRAFTED_CATALOG[0].id;const ui=await host({saved:p});ui.emit('camp-track','click');ui.emit('track-material-tear','click');assert.equal(ui.nodes.get('track-route-1').hidden,true);assert.equal(ui.nodes.get('track-route-2').disabled,true);ui.emit('track-route-2','click');assert.equal(ui.nodes.get('track-content').hidden,false);assert.equal(ui.state.phase,'camp');
 const q=game.createProfile(1_000_000);q.clearedStage=1;q.unlockedStage=2;q.stageProgress=[10,2,0];widen(q);q.targetCraftId=game.CRAFTED_CATALOG[0].id;const other=await host({saved:q,campaign:true});other.emit('camp-track','click');other.emit('track-material-tear','click');assert.match(other.nodes.get('track-route-name-2').textContent,/STAGE 3 정예/);other.emit('track-route-2','click');assert.equal(other.state.phase,'camp');assert.equal(other.nodes.get('track-content').hidden,true);other.emit('start','click');assert.equal(other.state.stageId,11);assert.equal(other.state.run.stage,3);
});
test('goal progress reflects acquisition immediately and stays complete after craft consumes materials',async()=>{
 const p=game.createProfile(1_000_000);p.targetCraftId=game.CRAFTED_CATALOG[1].id;p.gold=10000;for(const m of game.MATERIALS)p.materials[m.id]=100;p.materials.origin=1;const ui=await host({saved:p});ui.emit('camp-track','click');assert.match(ui.nodes.get('track-progress').textContent,/6\/6종/);ui.emit('track-craft','click');ui.emit('craft-submit','click');assert.equal(ui.profile().materials.origin,0);ui.emit('craft-track','click');assert.match(ui.nodes.get('track-progress').textContent,/제작 완료/);assert.equal(ui.nodes.get('track-progress-fill').style.width,'100%');assert.equal(ui.nodes.get('track-progressbar').attributes['aria-valuenow'],'100');assert.equal(ui.nodes.get('track-missing-origin').textContent,'제작에 사용 완료');
 const low=game.createProfile(1_000_000);low.targetCraftId=game.CRAFTED_CATALOG[1].id;const live=await host({saved:low});live.emit('start','click');live.tick();const before=live.nodes.get('craft-tracker-text').textContent;live.state.profile.materials.boneIron=1;live.tick();assert.notEqual(live.nodes.get('craft-tracker-text').textContent,before);live.emit('craft-tracker','click');assert.equal(live.nodes.get('track-count-boneIron').textContent,'1 / 60');
});
test('camp craft UI shows exact costs, makes unique once, equips and restores without consuming materials twice',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.gold=10000;for(const m of game.MATERIALS)p.materials[m.id]=100;
 const row=game.CRAFTED_CATALOG[1],ui=await host({saved:p,recordGeometry:true});ui.emit('camp-craft','click');assert.equal(ui.nodes.get('craft-content').hidden,false);assert.equal(ui.nodes.get('craft-submit').disabled,false);assert.equal(ui.nodes.get('craft-count-origin').textContent,'100 / 1');ui.emit('craft-submit','click');assert.equal(ui.profile().inventory[0].rarity,6);assert.equal(ui.profile().materials.origin,99);assert.equal(ui.profile().gold,6500);assert.match(ui.nodes.get('craft-feedback').textContent,/제작 완료/);assert.equal(ui.nodes.get('craft-submit').disabled,true);const gold=ui.profile().gold;ui.emit('craft-submit','click');assert.equal(ui.profile().gold,gold);ui.emit('craft-equip','click');assert.equal(ui.profile().equipment.weapon,ui.profile().inventory[0].id);assert.ok(ui.audioDetails.some(e=>e.type==='gearDrop'&&e.details.rarity===6));
 ui.emit('craft-inventory','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.equal(ui.nodes.get('item-0').attributes['data-kind'],'crafted');assert.match(ui.nodes.get('item-unique-0').textContent,/제작 전용/);assert.match(ui.nodes.get('item-unique-0').textContent,/1.50배/);const again=await host({saved:ui.profile()});assert.equal(again.profile().materials.origin,99);assert.equal(again.state.loadout.weapon.crafted.id,row.id);assert.equal(again.storage.has(KEY+':recovery'),false);
});
test('materials are reserved at death and bank on pickup while rare toast never claims equipment delivery',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');ui.tick();ui.state.materialRng=2000;const e=ui.state.enemies[0];ui.state.enemies=[e];ui.state.barrels=[];Object.assign(e,{x:ui.state.player.x+50,y:ui.state.player.y,hp:1,guard:0,speed:0,cooldown:999,aggro:true});ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.emit('attack','click');ui.emit('document','keyup',{key:'d'});ui.run(.2);assert.equal(ui.state.run.materials,0);assert.ok(ui.profile().pendingMaterials.boneIron>0);assert.equal(ui.profile().materials.boneIron,0);ui.run(.5);assert.ok(ui.state.run.materials>0);assert.ok(ui.profile().materials.boneIron>0);
 ui.state.effects.push({id:9999,type:'loot',name:'무명의 기원 ×1',rarity:5,material:true,ttl:3,maxTtl:3});ui.state.effects.push({id:10000,type:'materialDrop',materialId:'origin',amount:1,x:ui.state.player.x,y:ui.state.player.y,ttl:3,maxTtl:3});ui.tick();assert.match(ui.nodes.get('reward-meta').textContent,/재료.*자동 보관/);assert.ok(ui.audioEvents.includes('materialDrop'));assert.match(ui.nodes.get('reward-title').textContent,/무명의 기원/);assert.equal(ui.geometry.some(c=>c.kind==='fillText'&&c.args[0]==='무명의 기원'),false);
});
test('equipment synergy recipe updates on equip, persists and renders payoff at target coordinates',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=['3-weapon-1','1-charm-2','1-charm-4'].map((id,n)=>{const row=game.ITEM_CATALOG.find(r=>r.id===id);return {id:n+1,catalogId:id,slot:row.slot,tier:row.tier,artId:row.artId,name:row.name,rarity:3,affixes:{}};});p.equipment={weapon:1,armor:null,charm:2};
 const ui=await host({saved:p,recordGeometry:true});ui.emit('camp-inventory','click');assert.match(ui.nodes.get('equipped-synergies-title').textContent,/1개 활성/);assert.match(ui.nodes.get('equipped-synergies-details').textContent,/활성 · 빙결 파쇄/);assert.match(ui.nodes.get('equipped-synergies-details').textContent,/미완성 · 출혈 처형/);
 ui.emit('equip-2','click');assert.equal(ui.state.synergies.length,0);assert.match(ui.nodes.get('equipped-synergies-title').textContent,/조합/);ui.emit('equip-1','click');assert.equal(ui.state.synergies[0].id,'shatter');ui.emit('inventory-back','click');ui.emit('start','click');ui.tick();
 ui.state.run.synergyProcs.shatter=1;ui.state.effects.push({id:9999,type:'synergy',x:350,y:500,name:'빙결 파쇄',color:'#a5eaff',ttl:.7,maxTtl:.7});ui.tick();assert.equal(ui.nodes.get('game-shell').attributes['data-synergy-shatter'],'1');const label=ui.geometry.find(c=>c.kind==='fillText'&&c.args[0]==='빙결 파쇄');assert.ok(label);assert.equal(label.args[1],350);assert.ok(label.args[2]<500);assert.ok(ui.audioEvents.includes('synergy'));
 const restored=await host({saved:ui.profile()});assert.equal(restored.state.synergies[0].id,'shatter');
});
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));

test('actual stage transition clears held controls, saves checkpoint and resumes it at camp',async()=>{
  const ui=await host({campaign:true});ui.emit('start','click');ui.tick();ui.state.lootRates={normal:1,elite:1,stage:1,boss:1};ui.state.spawns=[];ui.state.enemies=[];ui.state.run.wave=3;ui.state.run.waveKills=ui.state.run.waveQuota;
  ui.stick(1,0);ui.tick();assert.equal(ui.state.run.flow,'combat');assert.equal(ui.state.run.stage,2);assert.equal(ui.nodes.get('joystick').disabled,false);assert.equal(ui.profile().stageProgress[0],1);assert.equal(ui.nodes.get('stage-complete').hidden,false);assert.equal(ui.nodes.get('stage-complete').textContent,'1-1 스테이지 완료');assert.equal(ui.nodes.get('hunt-stage').textContent,game.STAGES[0].name+' · 1-2 스테이지');assert.equal(ui.nodes.has('notice'),false);assert.equal(ui.nodes.get('monsters-left').textContent,'64');assert.equal(ui.nodes.get('reward-toast').hidden,false);assert.match(ui.nodes.get('reward-meta').textContent,/핵 \+1/);
  ui.run(.1);assert.equal(ui.state.run.stage,2);assert.equal(ui.state.player.moving,false);assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('monsters-left').textContent,'64');
  ui.emit('camp-button','click');ui.emit('retreat','click');ui.tick();assert.equal(ui.nodes.get('run-stage-2').disabled,false);assert.equal(ui.nodes.get('run-stage-2').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('run-stage-3').disabled,true);
  ui.emit('start','click');assert.equal(ui.state.run.stage,2);
});

function perfectItem(rarity=3,id=990){let n=0;return rollItem({id,tier:1},()=>++n===1?.005/36:n===2?rarity===2?.94:.985:.3);}
test('perfect gear retains its bag marker and max-option note while legendary protection stays outside combat HUD',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=[perfectItem()];p.legendaryPity=7;const ui=await host({saved:p});ui.emit('camp-inventory','click');assert.equal(ui.nodes.get('loot-luck').textContent,'일반 드롭 → 최대 강화 → 승급');assert.equal(ui.nodes.get('bag-0').attributes['data-perfect'],'true');assert.match(ui.nodes.get('bag-0').attributes['aria-label'],/극옵/);assert.match(ui.nodes.get('bag-badge-0').textContent,/극옵/);ui.emit('bag-0','click');assert.match(ui.nodes.get('item-affixes-0').textContent,/극옵 · 모든 옵션 최댓값/);
 ui.state.profile.legendaryPity=19;ui.tick(0);assert.equal(ui.nodes.get('loot-luck').textContent,'일반 드롭 → 최대 강화 → 승급');
});
test('perfect epic drop renders one item, one named sparkle and one chime without changing ownership or RNG',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const s=ui.state,item=perfectItem(2),x=s.player.x+100,y=s.player.y;s.enemies=[];s.barrels=[];s.pickups=[{id:991,kind:'equipment',item,x,y,age:.2}];s.effects=[{id:992,type:'gearDrop',source:'elite',item,rarity:2,x,y,ttl:1.8,maxTtl:2}];const before=JSON.stringify(s.profile),rng=[s.rng,s.lootRng,s.materialRng];ui.geometry.length=0;ui.calls.length=0;ui.tick(0);
 assert.equal(ui.calls.filter(c=>c.image==='assets/'+manifest.equipment.image).length,1);assert.equal(ui.geometry.filter(c=>c.kind==='fillText'&&String(c.args[0]).includes('극옵')).length,1);assert.ok(ui.calls.some(c=>c.image.includes('loot-pickup-v077')&&c.args[1]===manifest.pickupEffects.height*3/4));assert.deepEqual([s.rng,s.lootRng,s.materialRng],rng);assert.equal(JSON.stringify(s.profile),before);const chimes=ui.audioDetails.filter(e=>e.type==='gearDrop');assert.equal(chimes.length,1);assert.equal(chimes[0].details.perfect,true);ui.tick(0);assert.equal(ui.audioDetails.filter(e=>e.type==='gearDrop').length,1);assert.ok(ui.geometry.findLastIndex(c=>c.kind==='fillText'&&String(c.args[0]).includes('극옵'))>ui.geometry.findLastIndex(c=>c.kind==='drawImage'));
 const plain={...item,id:993,perfect:false};s.effects=[{id:994,type:'gearDrop',source:'elite',item:plain,rarity:2,x,y,ttl:2,maxTtl:2},{id:995,type:'gearDrop',source:'elite',item,rarity:2,x,y,ttl:2,maxTtl:2}];ui.tick(0);assert.equal(ui.audioDetails.filter(e=>e.type==='gearDrop').length,2);assert.equal(ui.audioDetails.filter(e=>e.type==='gearDrop').at(-1).details.perfect,true);
});
test('perfect receipt stays text-only with its effect while conversion never claims it was kept',async()=>{
 const ui=await host();ui.emit('start','click');const item=perfectItem(),plain={...item,id:991,perfect:false,name:'일반 전설 검'};
 const receipt=(id,gear)=>({id,type:'loot',item:gear,name:'전설 '+gear.name,rarity:3,origin:'monster',ttl:4,maxTtl:4});ui.state.effects=[receipt(992,item),receipt(993,plain),{id:994,type:'loot',material:true,name:'무명의 기원 ×1',rarity:5,ttl:3,maxTtl:3}];ui.tick(0);
 assert.match(ui.nodes.get('reward-title').textContent,/극옵/);assert.equal(ui.nodes.get('reward-toast').attributes['data-perfect'],'true');assert.equal(ui.nodes.has('reward-icon'),false);assert.match(ui.nodes.get('reward-brief').textContent,/모든 옵션 최댓값/);assert.ok(ui.nodes.get('reward-brief').textContent.includes(game.uniqueEffect(item).name));
 ui.state.effects=[{...receipt(995,item),converted:true,salvagedGold:58}];ui.tick(0);assert.equal(ui.nodes.has('reward-icon'),false);assert.equal(ui.nodes.get('reward-toast').attributes['data-perfect'],'false');assert.equal(ui.nodes.get('reward-brief').textContent,'분해 +58 골드');assert.match(ui.nodes.get('reward-meta').textContent,/가방 보호.*분해/);
});
test('result gallery shows all acquired gear in bounded pages with truthful kept and dismantled states',async()=>{
 const ui=await host();ui.emit('start','click');const s=ui.state,base=game.ITEM_CATALOG[0],items=Array.from({length:27},(_,n)=>({id:n+1,slot:base.slot,tier:base.tier,artId:base.artId,catalogId:base.id,name:'획득 검 '+(n+1),rarity:n===26?4:3,affixes:{damage:20}}));
 s.run.lootLedger.push(...items);s.run.items=items.length;s.profile.inventory=items.slice(-24);s.phase='victory';s.run.stage=10;s.resultDelay=0;ui.tick(0);
 assert.equal(ui.nodes.get('result-loot-count').textContent,'27개');assert.equal(ui.nodes.get('result-loot-page').textContent,'1 / 3');assert.equal(ui.nodes.get('result-loot-name-0').textContent,'획득 검 27');assert.match(ui.nodes.get('result-loot-art-0').atlasImage.src,/equipment/);assert.equal(ui.nodes.get('result-loot-state-0').textContent,'보관');assert.equal(ui.nodes.get('result-loot-state-1').textContent,'분해됨');assert.equal(ui.nodes.get('result-loot-prev').disabled,true);
 const seen=new Set();for(let page=0;page<3;page++){for(let i=0;i<12;i++)if(!ui.nodes.get('result-loot-'+i).hidden)seen.add(ui.nodes.get('result-loot-name-'+i).textContent);if(page<2)ui.emit('result-loot-next','click');}
 assert.equal(seen.size,27);assert.equal(ui.nodes.get('result-loot-page').textContent,'3 / 3');assert.equal(ui.nodes.get('result-loot-next').disabled,true);assert.equal(ui.nodes.get('result-loot-3').hidden,true);ui.emit('result-loot-next','click');assert.equal(ui.nodes.get('result-loot-page').textContent,'3 / 3');ui.emit('result-loot-prev','click');assert.equal(ui.nodes.get('result-loot-page').textContent,'2 / 3');
 ui.emit('result-camp','click');ui.emit('start','click');assert.equal(s.run.lootLedger.length,0);s.phase='defeat';s.run.timedOut=true;s.run.flow='timeout';ui.tick(0);assert.equal(ui.nodes.get('result-loot-count').textContent,'0개');assert.equal(ui.nodes.get('result-loot-empty').hidden,false);
});
test('result images distinguish reused IDs by their actual item owner and update after dismantling',async()=>{
 const ui=await host();ui.emit('start','click');const s=ui.state,old=perfectItem(3,1),fresh={...old,name:'다시 획득한 검'};s.run.lootLedger=[old,fresh];s.run.items=2;s.profile.inventory=[fresh];s.phase='victory';s.resultDelay=0;ui.tick(0);
 assert.equal(ui.nodes.get('result-loot-state-0').textContent,'분해됨');assert.equal(ui.nodes.get('result-loot-state-1').textContent,'보관');s.profile.inventory=[];ui.tick(0);assert.equal(ui.nodes.get('result-loot-state-1').textContent,'분해됨');
});
test('actual gold and material pickups save reservations before bank credit and play bounded collection effects',async()=>{
 const ui=await host({campaign:true,recordGeometry:true});ui.emit('start','click');const s=ui.state;s.lootRates={normal:1,elite:1,stage:1,boss:1};s.enemies=[];s.spawns=[];s.barrels=[];s.run.waveQuota=1000;s.player.invulnerable=999;s.materialRng=2000;
 const q={id:s.nextId++,type:'skitter',elite:true,boss:false,x:s.player.x+300,y:s.player.y,hp:1,maxHp:1,action:'walk',actionTime:0,speed:0,cooldown:999,aggro:true,guard:0,dead:false,wave:s.run.wave,runStage:s.run.stage,damage:8,radius:58};s.enemies=[q];s.projectiles.push({id:s.nextId++,x:q.x,y:q.y,vx:0,vy:0,damage:9999,ttl:1,friendly:true});ui.tick(.025);
 assert.equal(s.profile.gold,0);assert.equal(ui.profile().pendingGold,16);assert.ok(ui.profile().pendingMaterials.boneIron>0);ui.geometry.length=0;const rng=[s.rng,s.lootRng,s.materialRng];ui.tick(0);assert.ok(ui.geometry.some(c=>c.kind==='ellipse'&&c.args[2]===7&&c.args[3]===4.5));assert.deepEqual([s.rng,s.lootRng,s.materialRng],rng);
 for(const d of s.pickups){d.x=s.player.x;d.y=s.player.y;}ui.run(.8);assert.equal(ui.profile().pendingGold,0);assert.equal(ui.profile().gold,16);assert.ok(ui.profile().materials.boneIron>0);assert.ok(ui.audioDetails.some(e=>e.type==='resourceCollect'&&e.details.kind==='gold'));assert.ok(ui.audioDetails.some(e=>e.type==='lootPickup'));assert.equal(ui.nodes.has('reward-icon'),false);assert.ok(ui.geometry.some(c=>c.kind==='fillText'&&String(c.args[0]).includes(' G')));
});
test('dense crafting and promotion material receipts reserve one of four visual slots for gold without changing rewards',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const s=ui.state;s.enemies=[];s.spawns=[];s.pickups=[];s.effects=game.MATERIALS.map((m,n)=>({id:900+n,type:'resourceCollect',kind:'material',materialId:m.id,amount:1,x:s.player.x,y:s.player.y,ttl:.65,maxTtl:.65}));s.effects.push({id:999,type:'resourceCollect',kind:'gold',amount:16,x:s.player.x,y:s.player.y,ttl:.65,maxTtl:.65});const before=JSON.stringify(s.profile),effects=JSON.stringify(s.effects);ui.geometry.length=0;ui.tick(0);
 const receipts=ui.geometry.filter(c=>c.kind==='fillText'&&(/ G$/.test(String(c.args[0]))||game.MATERIALS.some(m=>String(c.args[0]).startsWith(m.name+' +'))));assert.equal(receipts.length,4);assert.ok(receipts.some(c=>c.args[0]==='+16 G'));assert.equal(JSON.stringify(s.profile),before);assert.equal(JSON.stringify(s.effects),effects);
});
test('drop fireworks and collection sounds remain bounded and rendering never pays the item again',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const s=ui.state;s.enemies=[];s.barrels=[];s.pickups=[];s.effects=[];
 for(let n=0;n<20;n++){s.effects.push({id:1000+n,type:'gearDrop',source:'elite',item:{rarity:3,perfect:n===19},x:s.player.x,y:s.player.y,rarity:3,ttl:1.8,maxTtl:2});s.effects.push({id:2000+n,type:'lootPickup',x:s.player.x,y:s.player.y,rarity:3,perfect:n===19,ttl:.8,maxTtl:1.05});s.effects.push({id:3000+n,type:'resourceCollect',kind:n%2?'gold':'material',materialId:n%2?null:'boneIron',amount:1,x:s.player.x,y:s.player.y,ttl:.5,maxTtl:.65});}
 const p=JSON.stringify(s.profile);ui.geometry.length=0;ui.calls.length=0;ui.tick(0);assert.ok(ui.calls.filter(c=>c.image.includes('loot-pickup-v077')).length<=8);assert.equal(JSON.stringify(s.profile),p);assert.equal(ui.audioDetails.filter(e=>e.type==='lootPickup').length,1);assert.equal(ui.audioDetails.filter(e=>e.type==='lootPickup')[0].details.perfect,true);assert.equal(ui.audioDetails.filter(e=>e.type==='resourceCollect').length,2);assert.ok(ui.geometry.filter(c=>c.kind==='fillText'&&(/ G|뼈철/.test(String(c.args[0])))).length<=4);ui.tick(0);assert.equal(ui.audioDetails.filter(e=>e.type==='lootPickup').length,1);
 ui.emit('pause','click');const effects=JSON.stringify(s.effects);ui.run(.5);assert.equal(JSON.stringify(s.effects),effects);
});
test('immediate wave replacement retains the whole encounter count and pause freezes the minute clock',async()=>{
 const p=game.createProfile(1_000_000);p.stageProgress[0]=9;const ui=await host({campaign:true,saved:p});ui.emit('run-stage-4','click');ui.emit('start','click');ui.tick();
 assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('monsters-left').textContent,'80');
 ui.state.enemies=[];ui.state.spawns=[];ui.state.run.stageKills=ui.state.run.waveQuota;ui.state.run.waveKills=ui.state.run.waveQuota;ui.tick();assert.equal(ui.state.run.flow,'combat');assert.equal(ui.state.run.wave,2);assert.ok(ui.state.enemies.some(e=>!e.dead));assert.equal(ui.nodes.get('monsters-left').textContent,'55');
 ui.emit('pause','click');const time=ui.state.run.waveTime,budget=ui.state.run.timeRemaining;ui.run(20);assert.equal(ui.state.run.waveTime,time);assert.equal(ui.state.run.timeRemaining,budget);
 ui.emit('resume','click');ui.run(.2);assert.equal(ui.state.run.flow,'combat');assert.equal(ui.nodes.get('monsters-left').textContent,'55');assert.ok(ui.state.run.timeRemaining<budget);
});

async function host({manual=false,coldStart=false,readBlocked=false,failWriteKey=null,videoMode='unsupported',campaign=false,saved,blocked=false,failedAssets=false,deferredAsset=null,invalidSocket=false,invalidPickup=false,motionReduced=false,recordGeometry=false,pixelRatio=1,detailBox={width:300,height:180},bagBox={width:216,height:216},box={left:0,top:0,width:1200,height:760}}={}){
  const downloads=[],objectURLs=new Map(),revokedURLs=[],timers=[],resizeObservers=new Map();let reloads=0;
  const nodes=new Map(),events=new Map(),frames=[],calls=[],storage=new Map(saved?[[KEY,typeof saved==='string'?saved:JSON.stringify(saved)]]:[]);
  let scene,clock=1_000_000,rafTime=100;const audioEvents=[],audioDetails=[],mediaVideos=[];
  const add=(id,name,fn)=>{const k=id+':'+name,list=events.get(k)||[];list.push(fn);events.set(k,list);};
  let transform={a:1,b:0,c:0,d:1,scaleX:1,scaleY:1,rotation:0,x:0,y:0};const transforms=[],geometry=[];
  const record=(kind,args)=>{if(recordGeometry)geometry.push({kind,args,...transform,lineWidth:ctx.lineWidth,strokeStyle:ctx.strokeStyle,fillStyle:ctx.fillStyle,font:ctx.font,alpha:ctx.globalAlpha});};
  const ctx={globalAlpha:1,globalCompositeOperation:'source-over',save(){transforms.push({transform:{...transform},alpha:this.globalAlpha,composite:this.globalCompositeOperation,smoothing:this.imageSmoothingEnabled,font:this.font});},restore(){const saved=transforms.pop();transform=saved.transform;this.globalAlpha=saved.alpha;this.globalCompositeOperation=saved.composite;this.imageSmoothingEnabled=saved.smoothing;this.font=saved.font;},setTransform(a,b,c,d,x=0,y=0){transform={a,b,c,d,scaleX:a,scaleY:d,rotation:0,x,y};},translate(x,y){transform.x+=transform.a*x+transform.c*y;transform.y+=transform.b*x+transform.d*y;},scale(x,y){transform.a*=x;transform.b*=x;transform.c*=y;transform.d*=y;transform.scaleX*=x;transform.scaleY*=y;},rotate(angle){const {a,b,c,d}=transform,cos=Math.cos(angle),sin=Math.sin(angle);transform.a=a*cos+c*sin;transform.b=b*cos+d*sin;transform.c=c*cos-a*sin;transform.d=d*cos-b*sin;transform.rotation+=angle;},beginPath(){},rect(){},clip(...args){record('clip',args);},closePath(){},ellipse(...args){record('ellipse',args);},moveTo(...args){record('moveTo',args);},lineTo(...args){record('lineTo',args);},stroke(){record('stroke',[]);},fill(){record('fill',[]);},fillRect(...args){record('fillRect',args);},strokeRect(...args){record('strokeRect',args);},strokeText(...args){record('strokeText',args);},fillText(...args){record('fillText',args);},measureText(text){return{width:String(text).length*18};},createRadialGradient(){return{addColorStop(){}};},drawImage(image,...args){record('drawImage',[image.src]);calls.push({image:image.src,args,...transform,alpha:this.globalAlpha,composite:this.globalCompositeOperation,smoothing:this.imageSmoothingEnabled});}};
  class Element{
    constructor(id,tag=''){this.id=id;this.attributes=attrs(tag);this.tagName=tag.match(/^<(\w+)/)?.[1].toUpperCase()||'DIV';this.hidden=/\shidden(?:\s|>)/.test(tag);this.disabled=false;this.textContent='';this.style={setProperty(key,value){this[key]=value;}};this.dataset=Object.fromEntries(Object.entries(this.attributes).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5),v]));const classes=new Set((this.attributes.class||'').split(' '));this.classList={toggle(k,force){if(force)classes.add(k);else classes.delete(k);}};}
    click(){if(this.tagName==='A')downloads.push({filename:this.download,blob:objectURLs.get(this.href),url:this.href});else for(const fn of events.get(this.id+':click')??[])fn({target:this,preventDefault(){}});}
    scrollIntoView(options){this.scrolledIntoView=options;}replaceChildren(...children){this.children=children;}addEventListener(name,fn){add(this.id,name,fn);}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k]??null;}setPointerCapture(){}focus(){document.activeElement=this;}
  }
  for(const m of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g))nodes.set(m[1],new Element(m[1],m[0]));
  const canvas=nodes.get('arena');canvas.width=600;canvas.height=380;canvas.getContext=()=>ctx;canvas.getBoundingClientRect=()=>box;
  nodes.get('joystick').getBoundingClientRect=()=>({left:0,top:0,width:122,height:122});
  for(const id of ['bag-grid','bag-material-grid'])nodes.get(id).getBoundingClientRect=()=>bagBox;
  for(let i=0;i<48;i++)nodes.get('item-read-text-'+i).getBoundingClientRect=()=>detailBox;
  class ResizeObserver{constructor(callback){this.callback=callback;}observe(node){resizeObservers.set(node.id,this.callback);}}
  const preview=nodes.get('equipment-preview');preview.width=240;preview.height=280;preview.getContext=()=>({...ctx,clearRect(){},drawImage(){}});
  class MediaVideo extends Element{
    constructor(){super('','<video>');Object.assign(this,{readyState:2,videoWidth:960,videoHeight:540,currentTime:0,paused:true,seeking:false,ended:false,playCalls:0,pauseCalls:0,mediaListeners:new Map()});mediaVideos.push(this);}
    addEventListener(name,fn){this.mediaListeners.set(name,fn);}removeEventListener(name,fn){if(this.mediaListeners.get(name)===fn)this.mediaListeners.delete(name);}removeAttribute(name){delete this[name];}
    load(){if(videoMode==='error')queueMicrotask(()=>this.mediaListeners.get('error')?.());}pause(){this.paused=true;this.pauseCalls++;}play(){this.playCalls++;if(videoMode==='reject')return Promise.reject(Error('Autoplay blocked'));this.paused=false;return Promise.resolve();}
  }
  const document={createElement(tag){return tag==='video'&&videoMode!=='unsupported'?new MediaVideo():new Element('','<'+tag+'>');},hidden:false,activeElement:null,getElementById(id){assert.ok(nodes.has(id),'Missing HTML ID: '+id);return nodes.get(id);},addEventListener(name,fn){add('document',name,fn);}};
  const requestedImages=[],deferredLoads=[];
  class Image{set src(path){requestedImages.push(path);this._src=path.replace(/\.webp$/,'.png');const bytes=fs.readFileSync(new URL(path,root));if(path.endsWith('.webp')){assert.equal(bytes.toString('ascii',12,16),'VP8L');const bits=bytes.readUInt32LE(21);this.naturalWidth=(bits&16383)+1;this.naturalHeight=((bits>>>14)&16383)+1;}else{this.naturalWidth=bytes.readUInt32BE(16);this.naturalHeight=bytes.readUInt32BE(20);}const complete=()=>failedAssets===true||failedAssets===path||failedAssets===this._src||failedAssets?.has?.(path)?this.onerror():this.onload();if(path===deferredAsset)deferredLoads.push(complete);else queueMicrotask(complete);}get src(){return this._src;}}
  const context=vm.createContext({ResizeObserver,console,document,Image,Date:class extends Date{static now(){return clock;}},Blob,URL:{createObjectURL(blob){const url='blob:test-'+objectURLs.size;objectURLs.set(url,blob);return url;},revokeObjectURL(url){revokedURLs.push(url);objectURLs.delete(url);}},setTimeout(fn){timers.push(fn);},window:{getComputedStyle:()=>({fontWeight:'400',fontSize:'12px',fontFamily:'Pretendard',lineHeight:'20.4px'}),hunterPages:{first(node){node.menuPage=1;},reveal(node){node.pageRevealed=true;}},location:{reload(){reloads++;}},matchMedia:()=>({matches:motionReduced}),devicePixelRatio:pixelRatio,addEventListener(name,fn){add('window',name,fn);}},localStorage:{getItem(k){if(blocked||readBlocked)throw Error('Blocked');return storage.get(k)??null;},setItem(k,v){if(blocked||k===failWriteKey)throw Error('Blocked');storage.set(k,v);}},fetch:async()=>({ok:true,json:async()=>{const data=structuredClone(manifest);if(invalidSocket)data.equipmentSockets[data.directions.hunter.idle.s][0].handX=NaN;if(invalidPickup)data.pickupEffects.width++;return data;}}),requestAnimationFrame(fn){frames.push(fn);}});
  const modules=new Map();
  for(const [path,exports] of [['./frame-metrics.js',frameMetrics],['./profile-backup.js',profileBackup],['./region-assets.js',regionAssets],['./motion.js',motion],['./sound.js',sound],['./game-engine.js',game],['./engine.js',animation],['./world.js',world],['./view-controls.js',viewControls],['./terrain.js',terrain],['./chapters.js',chapters],['./equipment-visuals.js',equipmentVisuals]]){
    modules.set(path,new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,path==='./sound.js'&&k==='createCombatAudio'?(...args)=>{const a=v(...args);return new Proxy(a,{get(target,key){if(key==='play')return(type,details)=>{audioEvents.push(type);audioDetails.push({type,details,time:scene.run.time});target.play(type,details);};return Reflect.get(target,key);}});}:path==='./game-engine.js'&&k==='launch'?(...args)=>{const ok=v(...args);if(ok&&!campaign)freezeCombat(args[0]);return ok;}:path==='./game-engine.js'&&k==='createGame'?(...args)=>(scene=v(...args)):v);},{context}));
  }
  const app=new vm.SourceTextModule(source+'\nexport {ensureCombatAssets,prepareRegion};',{context});await app.link(path=>{path=path.split('?')[0];assert.ok(modules.has(path));return modules.get(path);});await app.evaluate();await new Promise(resolve=>setImmediate(resolve));
  // Most existing behavior checks start with the battle cache warm. Cold-start tests exercise the real first-load UI separately.
  if(!coldStart){const warming=app.namespace.ensureCombatAssets().then(ok=>ok&&app.namespace.prepareRegion(scene.profile.unlockedStage));await Promise.race([warming,new Promise(resolve=>setImmediate(resolve))]);}
  // Live hunts are always automatic (Alpha 0.104). manual:true re-enables the retained manual input
  // path so render/engine QA tests can still steer the hunter directly.
  if(manual)scene.auto=false;
  const api={resizeDetail(width,height){detailBox={width,height};for(let i=0;i<48;i++){const id='item-read-text-'+i;resizeObservers.get(id)?.([{target:nodes.get(id),contentRect:detailBox}]);}},resizeBag(width,height){bagBox={width,height};for(const id of ['bag-grid','bag-material-grid'])resizeObservers.get(id)?.([{target:nodes.get(id),contentRect:bagBox}]);},downloads,revokedURLs,get reloads(){return reloads;},flushTimers(){timers.splice(0).forEach(fn=>fn());},setStorageBlocked(value){blocked=value;},setReadBlocked(value){readBlocked=value;},setWriteFailure(key){failWriteKey=key;},async settle(){await new Promise(resolve=>setImmediate(resolve));},window:context.window,stick(x,y,pointerId=1,name='pointerdown'){this.emit('joystick',name,{pointerId,pointerType:'touch',clientX:61+x*45,clientY:61+y*45});},nodes,calls,geometry,storage,document,audioEvents,audioDetails,requestedImages,mediaVideos,async completeDeferredAssets(){deferredLoads.splice(0).forEach(fn=>fn());await new Promise(resolve=>setImmediate(resolve));},get state(){return scene;},emit(id,name,event={}){for(const fn of events.get(id+':'+name)||[])fn({target:nodes.get(id),preventDefault(){},...event});},tick(dt=.05){clock+=dt*1000;rafTime+=dt*1000;frames.shift()(rafTime);},run(seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)this.tick();},profile(){return JSON.parse(storage.get(KEY));}};
  hostDisposals.push(()=>{nodes.clear();events.clear();resizeObservers.clear();frames.length=0;calls.length=0;geometry.length=0;storage.clear();deferredLoads.length=0;timers.length=0;downloads.length=0;objectURLs.clear();modules.clear();audioEvents.length=0;audioDetails.length=0;});
  api.tick(0);return api;
}

test('weapon cards, equipped summary and combat HUD show the saved sword trait',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=['forest_blade','forest_fang','frost_blade'].map((artId,i)=>({id:i+1,slot:'weapon',tier:i===2?3:1,artId,name:'검 '+i,rarity:1,affixes:{damage:8}}));p.equipment.weapon=1;
 const ui=await host({saved:p,recordGeometry:true});ui.emit('camp-inventory','click');ui.tick();assert.match(ui.nodes.get('item-trait-0').textContent,/출혈/);assert.match(ui.nodes.get('item-trait-1').textContent,/갑각 관통/);assert.match(ui.nodes.get('item-trait-2').textContent,/이동 속도 35%/);assert.match(ui.nodes.get('equipped-trait').textContent,/출혈/);
 ui.emit('equip-2','click');ui.tick();assert.match(ui.nodes.get('equipped-trait').textContent,/빙결/);assert.equal(ui.profile().equipment.weapon,3);
 ui.emit('inventory-back','click');ui.emit('start','click');ui.tick();assert.equal(ui.nodes.get('weapon-trait').textContent,'빙결');assert.equal(ui.nodes.get('weapon-trait').hidden,false);
 const e=ui.state.enemies[0];Object.assign(e,{x:ui.state.player.x+80,y:ui.state.player.y,hp:500,maxHp:500,speed:0,cooldown:999,aggro:true});ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.emit('attack','click');ui.emit('document','keyup',{key:'d'});ui.run(.15);assert.ok(e.chillRemaining>0);assert.ok(ui.geometry.some(c=>c.kind==='fillText'&&c.args[0]==='❄'));
});

test('bleed ticks render separately labelled damage and their own status marker',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=[{id:1,slot:'weapon',tier:1,artId:'forest_blade',name:'붉은 잎 검',rarity:0,affixes:{}}];p.equipment.weapon=1;
 const ui=await host({saved:p,recordGeometry:true});ui.emit('start','click');ui.tick();const e=ui.state.enemies[0];ui.state.enemies=[e];Object.assign(e,{x:ui.state.player.x+80,y:ui.state.player.y,hp:500,maxHp:500,speed:0,cooldown:999,aggro:true});ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.emit('attack','click');ui.emit('document','keyup',{key:'d'});ui.run(1);
 assert.ok(ui.geometry.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('출혈')));assert.ok(ui.geometry.some(c=>c.kind==='fillText'&&c.args[0]==='◆'));assert.equal(ui.state.run.kills,0);
});

test('inventory hotkey preserves the compact pause state and releases stale movement',async()=>{
 const ui=await host({campaign:true});ui.emit('start','click');ui.tick();assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('combat-tip').hidden,true);ui.stick(1,0);ui.tick();ui.emit('pause','click');
 const x=ui.state.player.x,time=ui.state.run.time;assert.equal(ui.nodes.get('pause-content').hidden,false);assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('monsters-left').textContent,'56');
 ui.emit('document','keydown',{key:'i'});assert.equal(ui.nodes.get('inventory-content').hidden,false);ui.run(10);assert.equal(ui.state.run.time,time);assert.equal(ui.state.player.x,x);
 ui.emit('inventory-back','click');assert.equal(ui.nodes.get('pause-content').hidden,false);ui.emit('resume','click');ui.run(.1);assert.equal(ui.state.paused,false);assert.equal(ui.state.player.x,x);assert.ok(ui.state.run.time>time);
});

test('48-slot inventory filter keeps action identity after filtering and salvage',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=[{id:1,slot:'weapon',tier:1,rarity:1,name:'희귀 검',affixes:{damage:8}},{id:2,slot:'weapon',tier:1,rarity:4,name:'신화 검',affixes:{damage:30}},{id:3,slot:'armor',tier:1,rarity:3,name:'전설 갑옷',affixes:{hp:70}}];
 const ui=await host({saved:p});ui.emit('camp-inventory','click');assert.ok(ui.nodes.has('item-23'));assert.match(ui.nodes.get('inventory-note').textContent,/3\/200/);ui.nodes.get('loot-filter').value='3';ui.emit('loot-filter','change');
 assert.match(ui.nodes.get('item-name-0').textContent,/신화 검/);assert.match(ui.nodes.get('item-name-1').textContent,/전설 갑옷/);assert.equal(ui.nodes.get('item-2').hidden,true);ui.emit('equip-0','click');assert.equal(ui.profile().equipment.weapon,2);assert.equal(ui.nodes.get('salvage-0').disabled,true);
 ui.emit('salvage-1','click');assert.deepEqual(ui.profile().inventory.map(i=>i.id),[1,2]);assert.equal(ui.nodes.get('item-1').hidden,true);ui.nodes.get('loot-filter').value='4';ui.emit('loot-filter','change');assert.match(ui.nodes.get('item-name-0').textContent,/신화/);
 const again=await host({saved:ui.profile()});assert.equal(again.storage.has(KEY+':recovery'),false);assert.equal(again.profile().equipment.weapon,2);
});

test('real render draws dropped equipment and limits ordinary pickup HUD spam',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');ui.tick();ui.state.enemies=[];ui.state.barrels=[];const item={id:90,slot:'weapon',tier:1,artId:'forest_blade',name:'전설 검',rarity:3,affixes:{damage:20}};
 ui.state.profile.pendingLoot=[item];ui.state.pickups=[{id:901,kind:'equipment',x:ui.state.player.x+250,y:ui.state.player.y,item,age:0,gold:0,xp:0,cores:0}];ui.state.effects.push({id:902,type:'gearDrop',x:ui.state.player.x+250,y:ui.state.player.y,item,rarity:3,ttl:1.2,maxTtl:1.2});ui.run(.1);
 assert.ok(ui.geometry.some(c=>c.kind==='fillRect'&&c.args[3]===100));assert.ok(ui.calls.some(c=>c.image.includes('equipment_chapters-v09')));assert.ok(ui.geometry.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('전설 검')));assert.ok(ui.audioDetails.some(e=>e.type==='gearDrop'&&e.details.rarity===3));
 ui.state.effects=[{id:903,type:'loot',name:'일반 검',rarity:0,origin:'monster',ttl:2,maxTtl:2}];ui.tick();assert.equal(ui.nodes.get('reward-toast').hidden,true);ui.state.effects=[{id:904,type:'loot',name:'전설 검',rarity:3,origin:'monster',ttl:2,maxTtl:2}];ui.tick();assert.equal(ui.nodes.get('reward-toast').hidden,false);assert.match(ui.nodes.get('reward-title').textContent,/전설/);
});

test('boot shows real camp, locked stages and a saved versioned profile',async()=>{
  const ui=await host();assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.nodes.get('camp-content').hidden,false);assert.equal(ui.nodes.get('stage-2').disabled,true);assert.equal(ui.nodes.get('train-power').disabled,true);assert.equal(ui.profile().version,16);
  ui.emit('start','click');ui.tick();assert.equal(ui.state.phase,'playing');assert.equal(ui.nodes.get('overlay').hidden,true);assert.equal(ui.state.enemies.length,4);assert.equal(ui.nodes.get('monsters-left').textContent,'56');
  for(const call of ui.calls.filter(c=>c.args.length===8)){const size=imageSize(call.image);assert.ok(call.args[0]+call.args[2]<=size.width);assert.ok(call.args[1]+call.args[3]<=size.height);}
});
test('keyboard and action buttons operate real combat, movement and recovery',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.tick();ui.state.enemies=[];ui.state.spawnTimer=999;
  ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.run(.2);ui.emit('document','keyup',{key:'d'});assert.ok(ui.state.player.x>350);
  ui.emit('attack','click');ui.tick();assert.equal(ui.state.player.action,'attack');ui.emit('dash','click');assert.equal(ui.state.player.action,'dash');assert.ok(ui.state.player.invulnerable>0);
  ui.state.enemies=[{id:99,type:'skitter',boss:false,x:ui.state.player.x+100,y:ui.state.player.y,hp:100,maxHp:100,action:'walk',actionTime:0,dead:false,facing:1,speed:0,cooldown:99,damage:9,radius:58,windup:.5,pattern:0}];
  ui.emit('thunder','click');assert.equal(ui.state.player.thunderCooldown,0);ui.run(.2);ui.state.enemies[0].x=ui.state.player.x+100;ui.state.enemies[0].y=ui.state.player.y;ui.emit('thunder','click');ui.run(.4);assert.ok(ui.state.enemies[0].hp<100);assert.ok(ui.state.player.thunderCooldown>0);
});
test('pause and blur freeze combat and resume never applies hidden-tab elapsed time',async()=>{
  const ui=await host();ui.emit('start','click');ui.run(.2);ui.emit('pause','click');const time=ui.state.run.time;ui.run(1);assert.equal(ui.state.run.time,time);assert.equal(ui.nodes.get('pause-content').hidden,false);
  ui.emit('resume','click');ui.tick();assert.ok(ui.state.run.time>time);ui.emit('window','blur');const before=ui.state.run.time;ui.tick(200);assert.equal(ui.state.run.time,before);assert.equal(ui.state.paused,true);
  ui.emit('resume','click');ui.tick(.05);assert.ok(ui.state.run.time-before<=.050001);
});
test('training happens at camp and never interrupts the hunt (Alpha 0.131 성장)',async()=>{
  const p=game.createProfile(1_000_000);p.level=7;
  const ui=await host({saved:p});ui.emit('hub-growth','click');assert.equal(ui.nodes.get('growth-points').textContent,'성장 포인트 6 / 6');
  ui.emit('train-power','click');ui.emit('train-power','click');assert.equal(ui.profile().training.power,2);ui.emit('train-power','click');assert.equal(ui.profile().training.power,2,'Lv.7 단련 상한 2');
  ui.emit('growth-tab-tree','click');assert.equal(ui.nodes.get('growth-tree').hidden,false);assert.equal(ui.nodes.get('tree-node-blade2').disabled,true);ui.emit('tree-node-blade1','click');assert.deepEqual(ui.profile().growthTree,['blade1']);assert.equal(ui.nodes.get('growth-points').textContent,'성장 포인트 2 / 6');
  ui.emit('growth-reset','click');assert.deepEqual(ui.profile().growthTree,['blade1'],'첫 탭은 확인만');ui.emit('growth-reset','click');assert.deepEqual(ui.profile().growthTree,[]);
  ui.emit('page-back','click');ui.emit('start','click');ui.tick();assert.equal(ui.state.phase,'playing');assert.equal(ui.nodes.get('overlay').hidden,true);
  ui.state.enemies=[];ui.state.pickups=[{id:99,x:ui.state.player.x,y:ui.state.player.y,gold:4,xp:game.xpNeeded(7),cores:0}];ui.tick();assert.equal(ui.state.phase,'playing');assert.equal(ui.nodes.get('overlay').hidden,true);assert.equal(game.trainStat(ui.state,'power'),false);
});
test('growth choices and unlocked stages survive loading another application instance',async()=>{
  const p=game.createProfile(1_000_000);p.level=12;p.clearedStage=1;p.unlockedStage=2;widen(p);
  const ui=await host({saved:p});ui.emit('hub-growth','click');ui.emit('train-vitality','click');ui.emit('growth-tab-tree','click');ui.emit('tree-node-ward1','click');assert.equal(ui.profile().training.vitality,1);
  const reload=await host({saved:ui.profile()});assert.equal(reload.state.profile.training.vitality,1);assert.deepEqual(reload.state.profile.growthTree,['ward1']);assert.equal(reload.nodes.get('stage-2').disabled,false);reload.emit('stage-2','click');await reload.settle();reload.emit('start','click');reload.tick();assert.equal(reload.state.stageId,11);
});
test('live hunts run automatically through content, victory, saved rewards and a camp return',async()=>{
  const p=game.createProfile(1_000_000);p.level=35;p.training={...game.emptyTraining(),power:7,vitality:5,guard:12,tempo:30,stride:18};p.growthTree=['blade1','blade2'];p.skillBook=game.restoreSkillBook(null,35);p.skillBook.loadout.active=['gather','dance'];p.skillBook.loadout.passive=['surrounded','finisher',null];p.skillBook.ranks.gather=1;p.skillBook.ranks.dance=3;p.skillBook.auto.ultimate='any';p.inventory=[{id:1,slot:'weapon',name:'성장 검',rarity:1,tier:1,artId:'forest_blade',affixes:{damage:12,crit:5}}];p.equipment.weapon=1;
  const ui=await host({campaign:true,saved:p});ui.emit('start','click');ui.tick();assert.equal(ui.state.auto,true);
  for(let i=0;i<12000&&ui.state.phase!=='victory'&&ui.state.phase!=='defeat';i++){ui.tick();ui.calls.length=0;}
  assert.equal(ui.state.phase,'victory');assert.equal(ui.nodes.get('result-content').hidden,true);ui.run(1.2);assert.equal(ui.nodes.get('result-content').hidden,false,JSON.stringify({phase:ui.state.phase,resultDelay:ui.state.resultDelay,hitStop:ui.state.hitStop,paused:ui.state.paused}));assert.equal(ui.nodes.get('modal-eyebrow').textContent,'1-10 스테이지 완료');assert.equal(ui.state.run.rooms,10);assert.equal(ui.profile().unlockedStage,2);assert.ok(ui.profile().gold>100);assert.equal(ui.nodes.get('next-stage').hidden,false);
  ui.emit('result-camp','click');ui.tick();assert.equal(ui.state.phase,'camp');assert.equal(ui.nodes.get('chapter-next').disabled,false);assert.ok(ui.state.profile.gold>100);
});
test('live hunts stay automatic: movement, attack, dodge, heavy strike and taps never take manual control',async()=>{
  const ui=await host({campaign:true});ui.emit('start','click');await ui.settle();ui.tick();const s=ui.state,p=s.player;
  assert.equal(s.auto,true);assert.equal(ui.nodes.get('joystick').hidden,true);assert.match(html,/<div class="abilities" hidden>/);
  for(const key of ['d','w',' ','shift','q'])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});
  ui.emit('arena','pointerdown',{clientX:300,clientY:200,button:0});ui.emit('arena','pointerdown',{clientX:300,clientY:200,button:2});
  for(let i=0;i<40;i++)ui.tick(1/30);
  for(const key of ['d','w',' ','shift','q'])ui.emit('document','keyup',{key});
  assert.equal(s.auto,true);assert.equal(p.thunderCooldown,0);assert.notEqual(p.action,'heavy');assert.ok(s.run.time>1);
});
test('the skill switch chooses automatic or tapped casting and remembers the choice',async()=>{
  const prof=game.createProfile(1_000_000);prof.level=35;prof.skillBook=game.restoreSkillBook(null,35);prof.skillBook.loadout.active=['gather','dance'];prof.skillBook.ranks.gather=1;prof.skillBook.ranks.dance=3;
  const ui=await host({campaign:true,saved:prof});ui.emit('start','click');await ui.settle();const s=ui.state;s.player.invulnerable=999;
  assert.equal(ui.nodes.get('auto-status').textContent,'자동');assert.equal(ui.nodes.get('auto').attributes['aria-pressed'],'true');
  const cooling=()=>Object.values(s.skillRuntime.cooldowns).some(v=>v>0);
  for(let i=0;i<600&&!cooling();i++)ui.tick(1/30);assert.ok(cooling(),'automatic mode casts skills');
  ui.emit('auto','click');assert.equal(ui.nodes.get('auto-status').textContent,'수동');assert.equal(ui.nodes.get('auto').attributes['aria-pressed'],'false');assert.equal(ui.storage.get('beast-hunter:skill-mode'),'manual');
  for(const id of Object.keys(s.skillRuntime.cooldowns))s.skillRuntime.cooldowns[id]=0;
  for(let i=0;i<240;i++)ui.tick(1/30);assert.equal(cooling(),false,'manual mode leaves skills to the player');assert.equal(s.auto,true);
  s.player.action='attack';s.player.actionTime=0;ui.tick(0);assert.equal(ui.nodes.get('combat-skill-0').disabled,false,'an automatic swing never disables the tap');
  ui.emit('combat-skill-0','click');for(let i=0;i<90&&!cooling();i++)ui.tick(1/30);assert.ok(cooling(),'a tapped skill casts at the next gap between automatic swings');
  ui.emit('auto','click');assert.equal(ui.storage.get('beast-hunter:skill-mode'),'auto');
});
test('responsive canvas clicks use world coordinates and joystick inputs have pointer ownership',async()=>{
  const box={left:20,top:30,width:600,height:450},ui=await host({manual:true,box});ui.emit('start','click');ui.tick();ui.state.enemies=[];ui.state.spawnTimer=999;
  const p=ui.state.player,start={x:p.x,y:p.y},ahead=world.worldToScreen({x:start.x+300,y:start.y},appCamera(ui,box));
  ui.emit('arena','pointerdown',clientAt(ahead,box));ui.run(2.2);assert.ok(p.x>start.x+290&&p.x<=start.x+300+1e-6);assert.ok(Math.abs(p.y-start.y)<1e-6);
  ui.stick(1,0,1);ui.stick(-1,0,2);ui.emit('joystick','pointerup',{pointerId:2});const x=ui.state.player.x;ui.run(.1);assert.ok(ui.state.player.x>x);ui.emit('joystick','pointerup',{pointerId:1});
});
test('blocked storage stays explicit and failed assets never enable a broken hunt',async()=>{
  const blocked=await host({blocked:true});assert.match(blocked.nodes.get('save-status').textContent,/기존 기록을 읽지 못했어/);blocked.emit('start','click');blocked.tick();assert.equal(blocked.state.phase,'playing');
  const failed=await host({failedAssets:true});assert.equal(failed.nodes.get('loading').hidden,false);assert.match(failed.nodes.get('loading').textContent,/새로고침/);failed.emit('start','click');assert.equal(failed.state.phase,'camp');
});

test('joystick drag changes axes, preserves diagonal speed and releases on cancellation',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;
  ui.stick(0,-1,11);ui.stick(1,-1,11,'pointermove');
  let {x,y}=ui.state.player;ui.run(.1);assert.ok(ui.state.player.x>x);assert.ok(ui.state.player.y<y);
  ui.stick(0,-1,11,'pointermove');({x,y}=ui.state.player);ui.run(.1);assert.equal(ui.state.player.x,x);assert.ok(ui.state.player.y<y);
  ui.emit('joystick','pointercancel',{pointerId:11});({x,y}=ui.state.player);ui.run(.1);assert.equal(ui.state.player.x,x);assert.equal(ui.state.player.y,y);
  assert.equal(ui.nodes.get('stick-thumb').style.transform,'translate(0px,0px)');
});

test('mobile movement survives a second finger attack and stops on cancellation or pause',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;
  ui.stick(1,0,1);ui.emit('attack','pointerdown',{pointerId:2});
  assert.equal(ui.state.player.swing.x,1);ui.emit('attack','pointercancel',{pointerId:2});ui.run(.6);
  const x=ui.state.player.x;ui.run(.1);assert.ok(ui.state.player.x>x);
  ui.emit('pause','click');ui.stick(0,-1,3);ui.emit('resume','click');
  let p={x:ui.state.player.x,y:ui.state.player.y};ui.run(.1);assert.equal(ui.state.player.x,p.x);assert.equal(ui.state.player.y,p.y);
  ui.stick(-1,0,4);ui.emit('window','blur');ui.emit('resume','click');
  p={x:ui.state.player.x,y:ui.state.player.y};ui.run(.1);assert.equal(ui.state.player.x,p.x);assert.equal(ui.state.player.y,p.y);
});

test('touching the battlefield does not discard a held mobile direction',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;
  ui.stick(0,-1,1);
  ui.emit('arena','pointerdown',{pointerId:2,pointerType:'touch',clientX:1100,clientY:600});
  const {x,y}=ui.state.player;ui.run(.1);assert.equal(ui.state.player.x,x);assert.ok(ui.state.player.y<y);
  ui.emit('joystick','lostpointercapture',{pointerId:1});const stopped=ui.state.player.y;ui.run(.1);assert.equal(ui.state.player.y,stopped);
});

test('mobile page cache transition pauses the hunt and releases every held control',async()=>{
  const ui=await host();ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;
  ui.stick(1,0,1);ui.emit('attack','pointerdown',{pointerId:2});ui.run(.1);
  ui.emit('window','pagehide');const time=ui.state.run.time;ui.tick(120);
  assert.equal(ui.state.paused,true);assert.equal(ui.state.run.time,time);
  ui.emit('resume','click');ui.run(1);const x=ui.state.player.x;ui.run(.2);assert.equal(ui.state.player.x,x);assert.equal(ui.state.player.action,'idle');
});

test('joystick rejects a second owner and ignores moves after capture loss',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;
  ui.stick(-1,0,1);ui.stick(1,0,2);ui.stick(1,1,2,'pointermove');
  let x=ui.state.player.x;ui.run(.1);assert.ok(ui.state.player.x<x);
  ui.emit('joystick','pointerup',{pointerId:2});x=ui.state.player.x;ui.run(.1);assert.ok(ui.state.player.x<x);
  ui.emit('joystick','lostpointercapture',{pointerId:1});ui.stick(1,0,1,'pointermove');x=ui.state.player.x;ui.run(.1);assert.equal(ui.state.player.x,x);
  ui.stick(1,0,3);x=ui.state.player.x;ui.run(.1);assert.ok(ui.state.player.x>x);
});

test('landscape keeps the selected workshop and saved item through portrait rotation, then reopens list navigation',async()=>{
 const box={left:0,top:0,width:892,height:412},p=bagFixture();p.gold=1e8;for(const m of game.MATERIALS)p.materials[m.id]=10000;
 const ui=await host({saved:p,box});ui.emit('nav-bag','click');ui.emit('bag-0','click');ui.emit('item-workshop-open','click');const before=ui.profile(),name=ui.nodes.get('item-name-0').textContent;
 assert.equal(ui.nodes.get('game-shell').attributes['data-layout'],'landscape');assert.equal(ui.nodes.get('bag-categories').hidden,false);assert.equal(ui.nodes.get('bag-pages').hidden,false);
 box.width=412;box.height=892;ui.emit('window','resize');assert.equal(ui.nodes.get('game-shell').attributes['data-layout'],'portrait');assert.equal(ui.nodes.get('bag-categories').hidden,true);assert.equal(ui.nodes.get('bag-pages').hidden,true);assert.equal(ui.nodes.get('item-workshop').hidden,false);assert.equal(ui.nodes.get('item-name-0').textContent,name);assert.deepEqual(ui.profile(),before);
 box.width=892;box.height=412;ui.emit('window','resize');assert.equal(ui.nodes.get('bag-categories').hidden,false);assert.equal(ui.nodes.get('bag-pages').hidden,false);assert.equal(ui.nodes.get('item-workshop').hidden,false);assert.deepEqual(ui.profile(),before);
 ui.emit('bag-tab-materials','click');assert.equal(ui.nodes.get('bag-detail').hidden,true);assert.equal(ui.nodes.get('item-workshop').hidden,true);assert.equal(ui.nodes.get('bag-materials').hidden,false);assert.deepEqual(ui.profile(),before);
});
test('landscape list paging while detail is open clears old workshop ownership before another item is selected',async()=>{
 const p=bagFixture();p.inventory=Array.from({length:60},(_,n)=>({...p.inventory[0],id:n+1,name:'검 '+(n+1)}));p.nextItemId=61;
 const ui=await host({saved:p,box:{left:0,top:0,width:667,height:375},bagBox:{width:216,height:216}});ui.emit('nav-bag','click');ui.emit('bag-0','click');ui.emit('item-workshop-open','click');const before=ui.profile();
 ui.emit('bag-page-next','click');assert.equal(ui.nodes.get('bag-page-number').textContent,'2 / 7');assert.equal(ui.nodes.get('bag-detail').hidden,true);assert.equal(ui.nodes.get('item-workshop').hidden,true);ui.emit('workshop-enhance','click');assert.deepEqual(ui.profile(),before);
 ui.emit('bag-0','click');assert.match(ui.nodes.get('item-name-0').textContent,/검 10/);assert.equal(ui.nodes.get('item-workshop').hidden,true);ui.emit('item-workshop-open','click');assert.equal(ui.nodes.get('item-workshop').hidden,false);assert.deepEqual(ui.profile(),before);
});

test('portrait launch exposes only the rotation gate and cannot start through buttons or keyboard',async()=>{
 const box={left:0,top:0,width:412,height:892},ui=await host({box}),before=ui.profile();assert.equal(ui.nodes.get('orientation-gate').hidden,false);assert.equal(ui.nodes.get('game-shell').inert,true);
 ui.emit('start','click');ui.emit('document','keydown',{key:'i',target:ui.nodes.get('arena')});ui.emit('document','keydown',{key:' ',target:ui.nodes.get('arena')});ui.run(2);assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.hunts,before.hunts);assert.deepEqual(ui.profile(),before);
 box.width=892;box.height=412;ui.emit('window','resize');assert.equal(ui.nodes.get('orientation-gate').hidden,true);assert.equal(ui.nodes.get('game-shell').inert,false);ui.emit('start','click');assert.equal(ui.state.phase,'playing');
});
test('rotating a running hunt clears controls, freezes world and clock, and never resumes an existing pause',async()=>{
 const box={left:0,top:0,width:892,height:412},ui=await host({box});ui.emit('start','click');ui.state.enemies=[];ui.state.spawns=[];ui.state.barrels=[];ui.state.spawnTimer=999;ui.stick(1,0);ui.run(.1);
 box.width=412;box.height=892;ui.emit('window','resize');const before=JSON.stringify(ui.state);assert.equal(ui.state.paused,true);assert.equal(ui.nodes.get('joystick').attributes['data-active'],'false');
 ui.emit('document','keydown',{key:'Escape',target:ui.nodes.get('arena')});ui.emit('attack','click');ui.run(5);assert.equal(JSON.stringify(ui.state),before);
 box.width=892;box.height=412;ui.emit('window','resize');ui.run(.2);assert.equal(ui.state.paused,true);const time=ui.state.run.timeRemaining;ui.emit('resume','click');ui.run(.2);assert.equal(ui.state.paused,false);assert.ok(ui.state.run.timeRemaining<time);
});
test('portrait rotation cancels a pending asset-backed launch rather than starting behind the gate',async()=>{
 const box={left:0,top:0,width:892,height:412},ui=await host({box,coldStart:true,deferredAsset:'assets/lirian_death-v06.webp'});ui.emit('start','click');await ui.settle();
 box.width=412;box.height=892;ui.emit('window','resize');await ui.completeDeferredAssets();assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.hunts,0);
 box.width=892;box.height=412;ui.emit('window','resize');ui.tick(0);assert.equal(ui.state.phase,'camp');ui.emit('start','click');assert.equal(ui.state.phase,'playing');
});

test('landscape camera uses the whole canvas, maps taps to world coordinates and releases input on resize',async()=>{
  const box={left:10,top:20,width:667,height:375},ui=await host({manual:true,box,recordGeometry:true});
  ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;ui.tick();
  const v=viewControls.viewportFor(box.width,box.height),canvas=ui.nodes.get('arena');
  assert.equal(canvas.width,box.width);assert.equal(canvas.height,box.height);
  const p=ui.state.player,destination={x:p.x+100,y:p.y-100},camera=world.cameraFor(p,ui.state.bounds,v,world.GROUND_DEPTH_SCALE),point=world.worldToScreen(destination,camera);
  ui.emit('arena','pointerdown',{pointerType:'touch',pointerId:2,clientX:box.left+point.x*box.width/v.width,clientY:box.top+point.y*box.height/v.height});
  ui.run(1);assert.ok(Math.hypot(p.x-destination.x,p.y-destination.y)<8,'tap reaches the existing eight-unit arrival radius');
  ui.stick(1,0,1);box.width=844;box.height=390;ui.emit('window','resize');
  assert.equal(ui.state.phase,'playing');assert.equal(ui.nodes.get('joystick').attributes['data-active'],'false');
  const stopped=p.x;ui.run(.1);assert.equal(p.x,stopped);
  const rotated=viewControls.viewportFor(box.width,box.height);assert.equal(canvas.width,box.width);assert.equal(canvas.height,box.height);
});

test('DPI-only surface changes preserve held input, world state and the logical camera',async()=>{
 const box={left:0,top:0,width:844,height:390},ui=await host({manual:true,box,pixelRatio:1});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;ui.stick(1,0);const p=ui.state.player,x=p.x,viewport=ui.nodes.get('game-shell').attributes['data-viewport'];
 ui.window.devicePixelRatio=2;ui.tick(.025);assert.equal(ui.nodes.get('arena').width,1688);assert.equal(ui.nodes.get('arena').height,780);assert.equal(ui.nodes.get('game-shell').attributes['data-viewport'],viewport);assert.equal(ui.nodes.get('joystick').attributes['data-active'],'true');assert.ok(p.x>x);
 ui.window.devicePixelRatio=3;ui.tick(.025);assert.equal(ui.nodes.get('arena').width,1688);assert.equal(ui.nodes.get('arena').height,780);assert.equal(ui.state.phase,'playing');
 ui.emit('attack','pointerdown',{pointerId:2});ui.tick(.025);const swing=p.swing;assert.ok(swing);ui.window.devicePixelRatio=1.5;ui.tick(.025);assert.equal(p.swing,swing);assert.equal(ui.nodes.get('arena').width,1266);assert.equal(ui.nodes.get('arena').height,585);
});

test('minified artwork is filtered while enlarged bosses remain unblurred on the same surface',async()=>{
 const ui=await host({recordGeometry:true,pixelRatio:2,box:{left:0,top:0,width:844,height:390}});ui.emit('start','click');const p=ui.state.player,e=ui.state.enemies[0];ui.state.enemies=[{...e,id:999,type:'bulwark',species:'forest_guardian',boss:true,x:p.x+100,y:p.y-150,action:'walk',moving:false,heading:2}];ui.state.paused=true;ui.calls.length=0;ui.tick(0);
 const floor=ui.calls.find(c=>c.image==='assets/'+manifest.chapters[1].environment),boss=ui.calls.find(c=>c.image==='assets/'+manifest.clips.forest_guardian_walk_s_v09.image&&c.args.length===8&&c.args[0]===manifest.clips.forest_guardian_walk_s_v09.frames[0].x&&c.args[1]===manifest.clips.forest_guardian_walk_s_v09.frames[0].y);
 assert.ok(floor);assert.equal(floor.smoothing,true);assert.ok(boss);assert.equal(boss.smoothing,false);
});

test('portrait rotation freezes a committed attack until landscape is restored and the player resumes',async()=>{
  const box={left:0,top:0,width:844,height:390},ui=await host({box});
  ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.spawnTimer=999;
  ui.stick(1,0);ui.emit('attack','pointerdown',{pointerId:2});const swing=ui.state.player.swing;
  box.width=390;box.height=844;ui.emit('window','resize');
  assert.equal(ui.state.player.swing,swing);assert.equal(ui.state.player.action,'attack');assert.equal(ui.state.player.heading,0);
  ui.run(1);assert.equal(ui.state.player.action,'attack');assert.equal(ui.state.paused,true);assert.equal(ui.nodes.get('orientation-gate').hidden,false);
  box.width=844;box.height=390;ui.emit('window','resize');ui.tick(0);assert.equal(ui.nodes.get('orientation-gate').hidden,true);assert.equal(ui.state.paused,true);ui.emit('resume','click');ui.run(1);assert.equal(ui.state.player.action,'idle');
  const x=ui.state.player.x;ui.run(.1);assert.equal(ui.state.player.x,x);
});

test('unreadable saves are backed up before a fresh profile replaces the active slot',async()=>{
  const ui=await host({saved:'not valid json'});assert.equal(ui.storage.get(KEY+':recovery'),'not valid json');assert.equal(ui.profile().version,16);assert.match(ui.nodes.get('save-status').textContent,/복구 사본/);
});

test('equipment panel pauses combat, compares, equips and persists items without deleting v1 progress',async()=>{
  const p=game.createProfile(1_000_000);p.gold=42;p.inventory=[{id:1,slot:'weapon',name:'갑각 대검',rarity:1,tier:1,affixes:{damage:12}}];
  const ui=await host({saved:p});ui.emit('camp-inventory','click');assert.equal(ui.nodes.get('inventory-content').hidden,false);assert.match(ui.nodes.get('item-compare-0').textContent,/공격 \+12/);ui.emit('equip-0','click');assert.equal(ui.profile().equipment.weapon,1);assert.equal(ui.nodes.get('salvage-0').disabled,true);
  ui.emit('inventory-back','click');ui.emit('start','click');ui.tick();ui.emit('document','keydown',{key:'i',target:ui.nodes.get('arena')});const time=ui.state.run.time;ui.run(.5);assert.equal(ui.state.run.time,time);assert.equal(ui.state.paused,true);ui.emit('inventory-back','click');ui.emit('resume','click');ui.tick();assert.ok(ui.state.run.time>time);
  const legacy=game.createProfile(1_000_000);legacy.version=1;legacy.gold=73;delete legacy.inventory;delete legacy.equipment;const migrated=await host({saved:legacy});assert.equal(migrated.profile().version,16);assert.equal(migrated.profile().gold,73);assert.equal(migrated.storage.has(KEY+':recovery'),false);
});
test('mouse aiming drives directed attacks in the real app',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.tick();ui.state.enemies=[];
  ui.emit('arena','pointermove',{clientX:900,clientY:400});ui.emit('thunder','click');assert.equal(ui.state.player.action,'heavy');assert.ok(ui.state.player.swing.x>0);assert.ok(ui.state.player.stamina<100);
  ui.run(.8);ui.state.player.thunderCooldown=0;ui.state.player.stamina=100;ui.emit('arena','pointermove',{clientX:100,clientY:400});ui.emit('document','keydown',{key:'q',target:ui.nodes.get('arena')});assert.equal(ui.state.player.action,'heavy');assert.ok(ui.state.player.swing.x<0);
});


test('new ranged frames, danger cores, perfect counter UI and one-shot sound dispatch run in the real host',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.tick();assert.ok(ui.calls.some(c=>c.image.endsWith('monsters-forest-v045.png')));ui.state.enemies=[];ui.state.barrels=[];ui.state.effects=[];
  const e={id:99,type:'skitter',group:0,boss:false,x:ui.state.player.x+80,y:ui.state.player.y,hp:500,maxHp:500,action:'windup',actionTime:.9,windup:1,dead:false,facing:1,speed:0,cooldown:99,damage:9,radius:58,pattern:0,targetX:ui.state.player.x,targetY:ui.state.player.y,aggro:true};ui.state.enemies=[e];
  ui.emit('dash','click');ui.tick();assert.ok(ui.state.player.counterReady>0);assert.match(ui.nodes.get('combo').textContent,/Q 반격/);assert.equal(ui.nodes.get('thunder-status').textContent,'무료 반격');assert.match(ui.nodes.get('combat-tip').textContent,/파쇄 반격/);assert.equal(ui.nodes.get('thunder').attributes['data-counter'],'true');assert.equal(ui.audioEvents.filter(x=>x==='perfectDodge').length,1);
  ui.run(.25);ui.emit('thunder','click');ui.tick();assert.equal(ui.state.player.swing.counter,true);assert.equal(ui.audioEvents.filter(x=>x==='counterSlash').length,0);ui.tick();assert.equal(ui.audioEvents.filter(x=>x==='counterSlash').length,1);ui.tick();assert.equal(ui.audioEvents.filter(x=>x==='counterSlash').length,1);
  ui.emit('camp-button','click');ui.emit('retreat','click');ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.emit('attack','click');ui.tick();assert.equal(ui.audioEvents.filter(x=>x==='swing').length,0);ui.tick();assert.equal(ui.audioEvents.filter(x=>x==='swing').length,1);
  ui.emit('sound','click');assert.equal(ui.storage.get(KEY+':sound'),'off');assert.equal(ui.nodes.get('sound').attributes['aria-pressed'],'false');
});


test('movement renders all eight views including true front/back and never rotates the body sprite',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.tick();
  const directions=[['d'],['d','s'],['s'],['a','s'],['a'],['a','w'],['w'],['d','w']];
  for(let heading=0;heading<8;heading++){
    for(const key of directions[heading])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});ui.tick(.05);assert.equal(ui.state.player.heading,heading);
    const call=ui.calls.filter(c=>c.image.endsWith('lirian_locomotion-v05.png')).at(-1),view=motion.DIRECTION_VIEWS[heading],clip=manifest.clips[motion.directionalClipId(manifest,'hunter','walk',heading)];
    const frame=clip.frames[motion.walkingFrame(ui.state.player.motionDistance)];assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(Math.sign(call.scaleX),view.mirror*(clip.flipX?-1:1));assert.equal(call.rotation,0);
    for(const key of directions[heading])ui.emit('document','keyup',{key});
  }
  assert.notEqual(manifest.clips.lirian_walk_s_v05.frames[0].y,manifest.clips.lirian_walk_n_v05.frames[0].y);
  ui.emit('document','keyup',{key:'w'});ui.state.player.x=ui.state.bounds.width-ui.state.bounds.padding;const distance=ui.state.player.motionDistance;ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.run(.2);assert.equal(ui.state.player.motionDistance,distance);assert.equal(ui.state.player.moving,false);
});
test('attack pose and slash FX start contact together, keep direction during the swing, and fresh mouse aim turns idle',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.tick();
  ui.emit('arena','pointermove',{clientX:ui.state.player.x,clientY:160});ui.tick();assert.equal(ui.state.player.heading,6);const before=ui.calls.length;ui.emit('attack','click');ui.tick(.05);
  assert.equal(ui.state.player.attackHit,false);assert.equal(ui.calls.slice(before).some(c=>c.image.endsWith('fx_cleave_sequence.png')),false);
  ui.tick(.05);assert.equal(ui.state.player.attackHit,true);const contact=ui.calls.filter(c=>c.image.endsWith('lirian_forehand-v05.png')).at(-1),frame=manifest.clips.lirian_forehand_n_v05.frames[3];assert.deepEqual(contact.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.ok(ui.calls.slice(before).some(c=>c.image.endsWith('fx_cleave_sequence.png')));
  ui.emit('arena','pointermove',{clientX:ui.state.player.x,clientY:700});ui.tick(.05);assert.equal(ui.state.player.heading,6);ui.run(.4);assert.equal(ui.state.player.heading,2);
  ui.emit('document','keydown',{key:'w',target:ui.nodes.get('arena')});ui.tick();ui.emit('document','keyup',{key:'w'});ui.tick();assert.equal(ui.state.player.heading,6);
  ui.emit('arena','pointermove',{clientX:800,clientY:400});ui.tick();assert.equal(ui.state.player.heading,0);
});

test('first attack follows the visible idle direction instead of the initial east aim',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];
  assert.equal(ui.state.player.heading,2);ui.emit('attack','click');assert.equal(ui.state.player.heading,2);assert.equal(ui.state.player.swing.x,0);assert.equal(ui.state.player.swing.y,1);
});
test('all eight attack-button directions work immediately after movement input, before a frame runs',async()=>{
  const directions=[['d'],['d','s'],['s'],['a','s'],['a'],['a','w'],['w'],['d','w']];
  for(let heading=0;heading<8;heading++){
    const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];
    for(const key of directions[heading])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});
    ui.emit('attack','pointerdown',{pointerId:1});ui.emit('attack','pointerup',{pointerId:1});
    assert.equal(ui.state.player.heading,heading,'attack heading '+heading);const swing=ui.state.player.swing;
    const p=ui.state.player,n={x:swing.x,y:swing.y},enemy={id:99,type:'skitter',group:0,boss:false,x:p.x+n.x*95,y:p.y+n.y*95,hp:500,maxHp:500,action:'idle',actionTime:0,dead:false,speed:0,cooldown:999,damage:0,radius:58,windup:1,pattern:0};
    const behind={...enemy,id:100,x:p.x-n.x*95,y:p.y-n.y*95};ui.state.enemies=[enemy,behind];ui.run(swing.impact+.001);
    assert.ok(enemy.hp<500,'front target is hit '+heading);assert.equal(behind.hp,500,'rear target is safe '+heading);
    const view=motion.DIRECTION_VIEWS[heading],clip=manifest.clips[motion.directionalClipId(manifest,'hunter','forehand',heading)],frame=clip.frames[3];
    const call=ui.calls.filter(c=>c.image.endsWith('lirian_forehand-v05.png')).at(-1);assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(Math.sign(call.scaleX),view.mirror*(clip.flipX?-1:1));assert.equal(call.rotation,0);
    const fx=ui.calls.filter(c=>c.image.endsWith('fx_cleave_sequence.png')).at(-1);assert.ok(Math.abs(fx.rotation-(Math.atan2(n.y,n.x)+.15))<1e-9);
  }
});
test('leaving the arena clears old mouse aim for keyboard and touch attacks',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.tick();
  ui.emit('arena','pointermove',{clientX:900,clientY:400});ui.tick();assert.equal(ui.state.player.heading,0);ui.emit('arena','pointerleave');
  ui.emit('document','keydown',{key:'w',target:ui.nodes.get('arena')});ui.run(.1);ui.emit('document','keyup',{key:'w'});ui.emit('attack','click');assert.equal(ui.state.player.heading,6);
  ui.run(.5);ui.stick(0,1,7);ui.emit('thunder','click');assert.equal(ui.state.player.heading,2);assert.equal(ui.state.player.swing.y,1);
});
test('held keyboard combos turn the next strike while keeping the current strike locked',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];
  for(const key of ['w',' '])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});ui.tick(.05);assert.equal(ui.state.player.heading,6);ui.run(.15);
  ui.emit('document','keyup',{key:'w'});ui.emit('document','keydown',{key:'s',target:ui.nodes.get('arena')});ui.tick(.05);assert.equal(ui.state.player.heading,6);assert.equal(ui.state.player.combo,1);
  for(let i=0;i<10&&ui.state.player.combo===1;i++)ui.tick(.025);assert.equal(ui.state.player.combo,2);assert.equal(ui.state.player.heading,2);assert.equal(ui.state.player.swing.y,1);
});
test('stationary cursor aim is recomputed when the player moves at a clamped camera edge',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.tick();
  const cursor=clientAt(world.worldToScreen({x:450,y:ui.state.player.y},appCamera(ui)));
  ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.emit('arena','pointermove',cursor);ui.run(.6);ui.emit('document','keyup',{key:'d'});
  assert.ok(ui.state.player.x>450&&ui.state.player.x<600);ui.emit('attack','click');assert.equal(ui.state.player.heading,4);assert.ok(ui.state.player.swing.x<0);
});
test('new keyboard movement replaces old mouse aim, and a fresh mouse move can aim while moving',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.tick();
  ui.emit('arena','pointermove',{clientX:900,clientY:400});ui.tick();ui.emit('document','keydown',{key:'w',target:ui.nodes.get('arena')});ui.emit('attack','click');assert.equal(ui.state.player.heading,6);
  ui.run(.5);ui.emit('arena','pointermove',{clientX:900,clientY:400});ui.emit('document','keydown',{key:'w',repeat:true,target:ui.nodes.get('arena')});ui.emit('attack','click');assert.equal(ui.state.player.heading,0);
});
test('all eight Q directions follow movement input immediately without needing a mouse',async()=>{
  const directions=[['d'],['d','s'],['s'],['a','s'],['a'],['a','w'],['w'],['d','w']];
  for(let heading=0;heading<8;heading++){
    const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];
    for(const key of directions[heading])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});ui.emit('document','keydown',{key:'q',target:ui.nodes.get('arena')});assert.equal(ui.state.player.heading,heading);assert.equal(ui.state.player.action,'heavy');
    ui.run(.31);const clip=manifest.clips[motion.directionalClipId(manifest,'hunter','finisher',heading)],frame=clip.frames[3],call=ui.calls.filter(c=>c.image.endsWith('lirian_finisher-v05.png')).at(-1);
    assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(ui.state.player.attackHit,true);
  }
});
test('the actual held combo renders three distinct Lirian motions and reversed FX in all eight directions',async()=>{
  const directions=[['d'],['d','s'],['s'],['a','s'],['a'],['a','w'],['w'],['d','w']];
  for(let heading=0;heading<8;heading++){
    const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];
    for(const key of directions[heading])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});ui.emit('attack','pointerdown',{pointerId:1});
    for(let combo=1;combo<=3;combo++){
      for(let i=0;i<50&&!(ui.state.player.combo===combo&&ui.state.player.attackHit);i++)ui.tick(.025);
      const p=ui.state.player;assert.equal(p.combo,combo);assert.equal(p.attackHit,true);assert.equal(p.heading,heading);
      const family=['forehand','backhand','finisher'][combo-1],clip=manifest.clips[motion.directionalClipId(manifest,'hunter',family,heading)],frame=clip.frames[3],call=ui.calls.filter(c=>c.image.endsWith('lirian_'+family+'-v05.png')).at(-1);
      assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(call.rotation,0);
      if(combo<3){const fx=ui.calls.filter(c=>c.image.endsWith('fx_cleave_sequence.png')).at(-1);assert.equal(Math.sign(fx.scaleY),combo===2?-1:1);}
    }
    ui.emit('attack','pointerup',{pointerId:1});const sounds=ui.audioDetails.filter(f=>f.type==='swing');assert.deepEqual(sounds.map(f=>f.details.combo),[1,2,3]);assert.ok(sounds.every(f=>f.details.motion===['forehand','backhand','finisher'][f.details.combo-1]));
  }
});
test('Lirian remains the player through idle, walk, dash, hit and death without loading old hunter sprites',async()=>{
  const ui=await host();ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.tick();
  ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.tick();ui.emit('document','keyup',{key:'d'});ui.emit('dash','click');ui.tick();ui.run(.25);
  ui.state.player.action='hurt';ui.state.player.actionTime=0;ui.tick();ui.state.player.action='death';ui.state.player.hp=0;ui.state.phase='defeat';ui.state.player.actionTime=0;ui.tick();assert.equal(ui.nodes.get('result-content').hidden,true);ui.run(.7);
  assert.ok(ui.calls.some(c=>c.image.endsWith('lirian_locomotion-v05.png')));assert.ok(ui.calls.every(c=>!c.image.includes('hunter_')));assert.equal(ui.nodes.get('result-content').hidden,false);
});
test('real 45-degree drawing keeps measured head position stable across walking, stopping and boosted speed in all eight views',async()=>{
  const directions=[['d'],['d','s'],['s'],['a','s'],['a'],['a','w'],['w'],['d','w']];
  for(const boosted of [false,true])for(let heading=0;heading<8;heading++){
    const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];
    const p=ui.state.player;p.x=1800;p.y=1160;
    if(boosted){ui.state.profile.training.tempo=30;ui.state.profile.training.stride=18;ui.state.profile.inventory=[{id:99,slot:'charm',affixes:{speed:20}}];ui.state.profile.equipment.charm=99;}
    const view=motion.DIRECTION_VIEWS[heading],measure=alignment.directions[view.key],heads=[],seen=new Set();
    const sample=family=>{
      const clip=manifest.clips[motion.directionalClipId(manifest,'hunter',family,heading)],call=ui.calls.filter(c=>c.image.endsWith(alignment.image)).at(-1);
      const index=clip.frames.findIndex(f=>f.x===call.args[0]&&f.y===call.args[1]);assert.ok(index>=0);
      const frame=clip.frames[index],pose=measure.poses[clip.sourceColumns[index]];
      // Source landmark through the actual destination rectangle and affine matrix,
      // relative to the projected world foot; includes camera tracking and mirroring.
      const localX=call.args[4]+pose.headX-frame.x,localY=call.args[5]+pose.headY-frame.y;
      const scale=appActorScale(ui,p.y);
      heads.push((call.a*localX+call.c*localY)/scale);
      assert.ok(Math.abs(frame.bodyHeight*Math.abs(call.a)-126*scale)<1e-9);
      assert.equal(call.rotation,0);assert.ok(Math.abs(call.b)+Math.abs(call.c)<1e-9);
      assert.ok(Math.abs((call.b*localX+call.d*localY)/scale-(pose.headY-measure.footLine)*126/measure.bodyHeight)<.01);
      if(family==='walk')seen.add(index);
    };
    for(const key of directions[heading])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});
    for(let step=0;step<48;step++){ui.tick(1/60);assert.equal(p.heading,heading);sample('walk');}
    assert.equal(seen.size,4,'every gait pose must actually be rendered');
    for(const key of directions[heading])ui.emit('document','keyup',{key});
    const distance=p.motionDistance;for(let step=0;step<12;step++){ui.tick(.05);sample('idle');}
    assert.equal(p.motionDistance,distance);
    assert.ok(Math.max(...heads)-Math.min(...heads)<.01,'rendered head jumps through gait/idle: '+heading);
    assert.ok(Math.abs(heads[0]-view.mirror*measure.headOffsetX*126/measure.bodyHeight)<.01);
  }
});
test('real hit rendering flashes only the enemy and smoothly catches up with authoritative knockback',async()=>{
  const ui=await host();ui.emit('start','click');ui.state.barrels=[];const p=ui.state.player;
  const e={id:99,type:'skitter',group:0,boss:false,x:p.x+95,y:p.y,hp:500,maxHp:500,action:'idle',actionTime:0,dead:false,speed:0,cooldown:999,damage:0,radius:58,windup:1,pattern:0};ui.state.enemies=[e];
  ui.emit('document','keydown',{key:'d',target:ui.nodes.get('arena')});ui.emit('document','keyup',{key:'d'});ui.emit('arena','pointermove',{clientX:p.x+95,clientY:400});ui.emit('attack','click');ui.run(.1);assert.ok(e.hp<500);assert.ok(e.recoilX<0);
  const flash=ui.calls.filter(c=>c.image.endsWith('skitter_reactions-v08.png')&&c.composite==='lighter').at(-1);assert.ok(flash);assert.ok(flash.alpha>0);const kick=e.recoilX*motion.recoilProgress(e,ui.state.run.time);
  ui.run(.2);assert.equal(motion.recoilProgress(e,ui.state.run.time),0);assert.ok(kick<0);assert.equal(ui.calls.at(-1).composite,'source-over');
});
test('dash, hurt and death render dedicated unrotated directional poses in all eight views',async()=>{
  const directions=[['d'],['d','s'],['s'],['a','s'],['a'],['a','w'],['w'],['d','w']];
  for(let heading=0;heading<8;heading++){
    const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];
    for(const key of directions[heading])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});ui.emit('dash','click');ui.tick(.025);
    let clip=manifest.clips[motion.directionalClipId(manifest,'hunter','dash',heading)],frame=clip.frames[0],call=ui.calls.filter(c=>c.image.endsWith('lirian_actions-v06.png')&&c.alpha>=.6).at(-1);assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(call.rotation,0);
    ui.run(.1);frame=clip.frames[motion.actionFrame('dash',ui.state.player.actionTime,4)];call=ui.calls.filter(c=>c.image.endsWith('lirian_actions-v06.png')&&c.alpha>=.6).at(-1);assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);
    for(const key of directions[heading])ui.emit('document','keyup',{key});ui.run(.2);ui.state.player.action='hurt';ui.state.player.actionTime=0;ui.tick(.025);clip=manifest.clips[motion.directionalClipId(manifest,'hunter','hurt',heading)];frame=clip.frames[0];call=ui.calls.filter(c=>c.image.endsWith('lirian_actions-v06.png')&&c.alpha>=.6).at(-1);assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);
    ui.state.player.action='death';ui.state.player.actionTime=0;ui.state.player.hp=0;ui.state.phase='defeat';ui.tick(.025);clip=manifest.clips[motion.directionalClipId(manifest,'hunter','death',heading)];const first=ui.calls.filter(c=>c.image.endsWith('lirian_death-v06.png')).at(-1);ui.run(.7);frame=clip.frames[3];call=ui.calls.filter(c=>c.image.endsWith('lirian_death-v06.png')).at(-1);assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(call.scaleY,first.scaleY);assert.equal(call.rotation,0);assert.equal(ui.nodes.get('result-content').hidden,false);
  }
});
test('death reveals results after the fall, ignores combat/inventory input and never skips on tab return',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.profile.gold=77;const p=ui.state.player;p.hp=1;
  ui.emit('document','keydown',{key:' ',target:ui.nodes.get('arena')});ui.state.projectiles=[{id:99,x:p.x+20,y:p.y,vx:-300,vy:0,damage:10,ttl:1,friendly:false}];ui.tick(.025);assert.equal(ui.state.phase,'defeat');assert.equal(ui.nodes.get('overlay').hidden,true);assert.equal(ui.profile().gold,77);assert.equal(ui.audioEvents.filter(t=>t==='playerDeath').length,1);
  ui.emit('document','keydown',{key:'i',target:ui.nodes.get('arena')});ui.emit('result-camp','click');ui.emit('attack','click');assert.equal(ui.state.phase,'defeat');assert.equal(ui.nodes.get('inventory-content').hidden,true);ui.run(.2);const time=p.actionTime,run=ui.state.run.time;
  ui.document.hidden=true;ui.emit('document','visibilitychange');ui.run(5);assert.equal(p.actionTime,time);ui.document.hidden=false;ui.emit('document','visibilitychange');ui.tick(5);assert.equal(p.actionTime,time);ui.run(.5);assert.equal(ui.nodes.get('result-content').hidden,false);assert.equal(ui.state.run.time,run);assert.equal(ui.state.profile.gold,77);
  let blocked=false;ui.emit('document','keydown',{key:' ',repeat:true,target:ui.nodes.get('result-camp'),preventDefault(){blocked=true;}});assert.equal(blocked,true);ui.emit('document','keyup',{key:' '});blocked=false;ui.emit('document','keydown',{key:' ',repeat:false,target:ui.nodes.get('result-camp'),preventDefault(){blocked=true;}});assert.equal(blocked,false);ui.emit('result-camp','click');ui.tick();assert.equal(ui.state.phase,'camp');assert.equal(ui.state.player.action,'idle');assert.equal(ui.state.player.actionTime,0);
});
test('dash follows movement over mouse aim and idle facing over stale released mouse aim',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.tick();
  ui.emit('document','keydown',{key:'w',target:ui.nodes.get('arena')});ui.emit('arena','pointermove',{clientX:900,clientY:400});ui.emit('dash','click');assert.equal(ui.state.player.heading,6);assert.equal(ui.state.player.dashY,-1);ui.emit('document','keyup',{key:'w'});ui.emit('arena','pointerleave');ui.run(.8);ui.emit('dash','click');assert.equal(ui.state.player.heading,6);assert.equal(ui.state.player.dashY,-1);
});

const near=(actual,expected,epsilon=1e-8)=>assert.ok(Math.abs(actual-expected)<epsilon,`${actual} != ${expected}`);
const renderedPoint=(call,x,y)=>({x:call.a*x+call.c*y+call.x,y:call.b*x+call.d*y+call.y});

test('45-degree terrain keeps upright art, foot anchors and depth order independent of ground scale without a battle minimap',async()=>{
  const ui=await host({manual:true,recordGeometry:true});ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1160;
  const template=ui.state.enemies[0];ui.state.enemies=[{...template,id:900,type:'bulwark',species:undefined,x:1900,y:1280,action:'idle'},{...template,id:901,type:'spitter',species:undefined,x:2000,y:1080,action:'idle'}];ui.state.barrels=[];ui.state.paused=true;ui.calls.length=0;ui.geometry.length=0;ui.tick(0);
  const S=appScale(),camera=appCamera(ui),foot=world.worldToScreen(p,camera);
  const player=ui.calls.find(c=>c.image.endsWith('lirian_locomotion-v05.png')),clip=manifest.clips.lirian_idle_s_v05,frame=clip.frames[0];
  near(player.x,foot.x*S);near(player.y,foot.y*S);near(Math.abs(player.a),player.d);near(player.d*frame.bodyHeight,126*S);assert.equal(player.b,0);assert.equal(player.c,0);
  const ground=ui.calls.filter(c=>c.image==='assets/'+manifest.chapters[1].environment),maxTiles=(Math.ceil(camera.width/512)+1)*(Math.ceil(camera.height/512)+1);assert.ok(ground.length>0&&ground.length<=maxTiles,ground.length+' > '+maxTiles);
  for(const tile of ground){near(Math.abs(tile.d/tile.a),world.GROUND_DEPTH_SCALE);near(tile.args[2],512+1/(S*world.GROUND_DEPTH_SCALE));near(tile.args[3],512+1/(S*world.GROUND_DEPTH_SCALE));}
  for(const prop of ui.calls.filter(c=>c.image==='assets/'+manifest.chapterProps.image))near(Math.abs(prop.a),prop.d);
  const actors=ui.calls.filter(c=>/spitter_directions|lirian_locomotion|bulwark_directions/.test(c.image));assert.deepEqual(actors.map(c=>c.image.split('/').at(-1)),['spitter_directions-v04.png','lirian_locomotion-v05.png','bulwark_directions-v04.png']);
  // The battle minimap was removed from app.js, so no camera marker is drawn any more.
  assert.equal(ui.geometry.some(c=>c.kind==='strokeRect'),false);
});

test('letterboxed projected clicks keep a fixed world destination and all eight mouse strikes invert the ground projection',async()=>{
  const ui=await host({manual:true,box:{left:20,top:30,width:600,height:450}});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];const p=ui.state.player;p.x=1500;p.y=1000;ui.tick(0);
  const box={left:20,top:30,width:600,height:450},camera=appCamera(ui,box),foot=world.worldToScreen(p,camera),point={x:foot.x+200,y:foot.y+140},destination=world.screenToWorld(point,camera,ui.state.bounds);
  ui.emit('arena','pointerdown',clientAt(point,box));ui.run(2);assert.ok(Math.hypot(p.x-destination.x,p.y-destination.y)<8);assert.ok(p.y>1100);const reached={x:p.x,y:p.y};ui.run(.3);near(p.x,reached.x);near(p.y,reached.y);
  for(let heading=0;heading<8;heading++){
    const angle=heading*Math.PI/4,n={x:Math.cos(angle),y:Math.sin(angle)},camera=appCamera(ui,box),target=world.worldToScreen({x:p.x+n.x*200,y:p.y+n.y*200},camera);
    ui.emit('arena','pointermove',clientAt(target,box));ui.emit('attack','click');assert.equal(p.heading,heading);near(p.swing.x,n.x);near(p.swing.y,n.y);ui.run(.7);
    p.thunderCooldown=0;p.stamina=100;ui.emit('arena','pointermove',clientAt(target,box));ui.emit('thunder','click');assert.equal(p.action,'heavy');near(p.swing.x,n.x);near(p.swing.y,n.y);ui.run(.8);
  }
});

test('clicking the projected upright head or overlapping bodies selects the visually front enemy',async()=>{
  for(const overlap of [false,true]){
    const ui=await host({manual:true});ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1160;const template=ui.state.enemies[0];
    const front={...template,id:900,type:'bulwark',species:undefined,x:p.x+70,y:p.y+70,homeX:p.x+70,homeY:p.y+70,aggro:true,speed:0,cooldown:999,action:'idle',guard:0};
    ui.state.enemies=overlap?[{...front,id:901,y:p.y+40,homeY:p.y+40},front]:[front];ui.state.barrels=[];ui.tick(0);
    const foot=world.worldToScreen(front,appCamera(ui));ui.emit('arena','pointerdown',clientAt({x:foot.x,y:foot.y-(overlap?60:150)}));ui.tick(.025);
    assert.equal(p.action,'attack');near(p.swing.x,Math.SQRT1_2);near(p.swing.y,Math.SQRT1_2);
  }
});

test('hidden area warnings preserve airborne projection and visible boss heads at the bottom edge',async()=>{
  const ui=await host({recordGeometry:true});ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1200;
  const S=appScale(),camera=appCamera(ui),template=ui.state.enemies[0],enemy={...template,id:900,x:2000,y:1200,action:'windup',actionTime:.2,windup:1,targetX:1880,targetY:1260};
  const boss={...template,id:901,type:'bulwark',species:undefined,boss:true,x:1800,y:camera.y+camera.height+260/world.GROUND_DEPTH_SCALE,action:'idle'};
  ui.state.enemies=[enemy,boss];ui.state.barrels=[];ui.state.projectiles=[{id:902,x:1900,y:1100,vx:0,vy:200,friendly:true}];ui.state.paused=true;ui.calls.length=0;ui.geometry.length=0;ui.tick(0);
  assert.equal(ui.geometry.some(c=>c.kind==='ellipse'&&c.args[0]===enemy.targetX&&c.args[1]===enemy.targetY&&[enemy.radius,enemy.radius+16].includes(c.args[2])),false);
  const q=ui.state.projectiles[0],shot=ui.geometry.find(c=>c.kind==='fillRect'&&c.args[0]===q.x-5&&c.args[1]===q.y-40),pixel=renderedPoint(shot,q.x,q.y-35),ground=world.worldToScreen(q,camera);near(pixel.x,ground.x*S);near(pixel.y,(ground.y-35)*S);near(shot.a,shot.d);
  const trail=ui.geometry.find(c=>c.kind==='moveTo'&&c.args[0]===q.x&&c.args[1]<q.y-35&&c.args[1]>q.y-70),tail=renderedPoint(trail,...trail.args);near(pixel.y-tail.y,28*world.GROUND_DEPTH_SCALE*S);
  const bossDraw=ui.calls.find(c=>c.image.endsWith('bulwark_directions-v04.png'));assert.ok(bossDraw);near(bossDraw.y,(appView().height+260)*S);
});

test('boosted near-destination clicks stop without reversing at either frame rate in every direction',async()=>{
  for(const dt of [1/60,.05])for(let heading=0;heading<8;heading++){
    const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.state.profile.training.tempo=30;ui.state.profile.training.stride=18;ui.state.profile.inventory=[{id:99,slot:'charm',affixes:{speed:20}}];ui.state.profile.equipment.charm=99;
    const p=ui.state.player;p.x=1800;p.y=1160;ui.tick(0);const angle=heading*Math.PI/4,start={x:p.x,y:p.y},n={x:Math.cos(angle),y:Math.sin(angle)},target={x:p.x+n.x*10,y:p.y+n.y*10},screen=world.worldToScreen(target,appCamera(ui));
    ui.emit('arena','pointerdown',clientAt(screen));let progress=0;for(let i=0;i<20;i++){ui.tick(dt);const next=(p.x-start.x)*n.x+(p.y-start.y)*n.y;assert.ok(next>=progress-1e-8&&next<=10+1e-8);progress=next;}
    assert.ok(Math.hypot(p.x-target.x,p.y-target.y)<8);assert.equal(p.action,'idle');const x=p.x,y=p.y;ui.run(.3);near(p.x,x);near(p.y,y);
    ui.emit('document','keydown',{key:'w',target:ui.nodes.get('arena')});ui.tick(dt);assert.ok(p.y<y);assert.equal(p.heading,6);
  }
});

test('click pursuit uses a wider restart distance and yields immediately to direct movement',async()=>{
  const ui=await host({manual:true});ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1160;p.attackCooldown=999;const e={...ui.state.enemies[0],id:999,x:p.x+100,y:p.y,homeX:p.x+100,homeY:p.y,speed:0,cooldown:999};ui.state.enemies=[e];ui.state.barrels=[];ui.tick(0);
  const foot=world.worldToScreen(e,world.cameraFor(p,ui.state.bounds,world.VIEWPORT,world.GROUND_DEPTH_SCALE));ui.emit('arena','pointerdown',{clientX:foot.x,clientY:foot.y-45});ui.tick();const stopped=p.x;e.x=p.x+120;ui.run(.2);assert.equal(p.x,stopped);
  e.x=p.x+150;ui.tick();assert.ok(p.x>stopped);ui.run(.2);assert.ok(Math.abs(e.x-p.x-game.playerStats(ui.state.profile).range*.82)<1e-8);
  const x=p.x,y=p.y;ui.emit('document','keydown',{key:'w',target:ui.nodes.get('arena')});ui.tick();assert.equal(p.x,x);assert.ok(p.y<y);assert.equal(p.heading,6);
  ui.emit('document','keyup',{key:'w'});ui.tick();p.attackCooldown=0;e.x=p.x+game.playerStats(ui.state.profile).range*.82+1e-7;e.y=p.y;
  const arrived=world.worldToScreen(e,world.cameraFor(p,ui.state.bounds,world.VIEWPORT,world.GROUND_DEPTH_SCALE));ui.emit('arena','pointerdown',{clientX:arrived.x,clientY:arrived.y-45});ui.tick(.025);assert.equal(p.action,'attack');
});

test('successful manual dodge cancels old click travel while a rejected dodge preserves it',async()=>{
  for(const rejected of [false,true]){
    const ui=await host({manual:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];const p=ui.state.player;p.x=1800;p.y=1160;ui.tick(0);ui.emit('arena','pointerdown',clientAt(world.worldToScreen({x:1900,y:1160},appCamera(ui))));
    if(rejected)p.dashCooldown=2;ui.emit('dash','click');ui.run(.3);const x=p.x;ui.run(.4);
    if(rejected){assert.ok(p.x>1800&&p.x<=1900);assert.ok(p.x>=x);assert.ok(1900-p.x<8);}else{assert.ok(x>1900);near(p.x,x);assert.equal(p.action,'idle');}
  }
});

test('all eight skitter attacks show preparation, contact at damage time and locked recovery without body rotation',async()=>{
  for(let heading=0;heading<8;heading++){
    const ui=await host({manual:true});ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1160;const angle=heading*Math.PI/4,n={x:Math.cos(angle),y:Math.sin(angle)},template=ui.state.enemies[0];
    const e={...template,id:999,species:undefined,x:p.x-n.x*55,y:p.y-n.y*55,homeX:p.x-n.x*55,homeY:p.y-n.y*55,speed:0,cooldown:0,aggro:true,hp:500,maxHp:500,action:'idle',actionTime:0};ui.state.enemies=[e];ui.state.barrels=[];ui.calls.length=0;ui.tick(.025);
    const clip=manifest.clips[motion.directionalClipId(manifest,'skitter','attack',heading)],latest=()=>ui.calls.filter(c=>c.image.endsWith('skitter_attack-v08.png')).at(-1),check=index=>{const frame=clip.frames[index],call=latest();assert.deepEqual(call.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(call.rotation,0);near(Math.abs(call.a),call.d);assert.equal(Math.sign(call.a),motion.DIRECTION_VIEWS[heading].mirror*(clip.flipX?-1:1));};
    assert.equal(e.heading,heading);assert.equal(e.action,'windup');check(0);const hp=p.hp;
    for(let i=0;i<30&&e.action==='windup'&&e.actionTime<e.windup*.55;i++)ui.tick(.025);check(1);assert.equal(p.hp,hp);assert.equal(ui.audioEvents.includes('skitterStrike'),false);
    for(let i=0;i<60&&e.action==='windup';i++)ui.tick(.025);assert.equal(e.action,'attack');check(2);assert.ok(p.hp<hp);assert.equal(ui.audioEvents.filter(t=>t==='skitterStrike').length,1);const hit=p.hp;p.x+=120;
    for(let i=0;i<20&&e.actionTime<motion.SKITTER_MOTION.contact+.01;i++)ui.tick(.025);check(3);assert.equal(e.heading,heading);ui.run(.2);assert.equal(p.hp,hit);assert.equal(ui.audioEvents.filter(t=>t==='skitterStrike').length,1);
  }
});

test('real skitter flinch replaces windup, pauses its pose clock and prevents the canceled strike sound',async()=>{
  const ui=await host();ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1160;const e={...ui.state.enemies[0],id:999,species:undefined,x:p.x+60,y:p.y,homeX:p.x+60,homeY:p.y,speed:0,cooldown:0,aggro:true,hp:500,maxHp:500,action:'idle',actionTime:0};ui.state.enemies=[e];ui.state.barrels=[];ui.tick(.025);assert.equal(e.action,'windup');
  const point=world.worldToScreen(e,world.cameraFor(p,ui.state.bounds,world.VIEWPORT,world.GROUND_DEPTH_SCALE));ui.emit('arena','pointermove',{clientX:point.x,clientY:point.y});ui.emit('attack','click');ui.run(.1);assert.equal(e.action,'hurt');
  const clip=manifest.clips[motion.directionalClipId(manifest,'skitter','hurt',e.heading)],latest=()=>ui.calls.filter(c=>c.image.endsWith('skitter_reactions-v08.png')).at(-1);assert.deepEqual(latest().args.slice(0,4),[clip.frames[0].x,clip.frames[0].y,clip.frames[0].w,clip.frames[0].h]);
  ui.run(.2);assert.equal(e.action,'hurt');assert.deepEqual(latest().args.slice(0,4),[clip.frames[1].x,clip.frames[1].y,clip.frames[1].w,clip.frames[1].h]);ui.emit('pause','click');const clock=e.actionTime;ui.run(.5);assert.equal(e.actionTime,clock);ui.emit('resume','click');ui.run(.1);assert.equal(ui.audioEvents.includes('skitterStrike'),false);
});

test('a killed skitter completes its fall during defeat, holds a corpse at constant scale and then fades without new loot',async()=>{
  const ui=await host();ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1160;const e={...ui.state.enemies[0],id:999,species:undefined,x:p.x+80,y:p.y,homeX:p.x+80,homeY:p.y,speed:0,cooldown:999,aggro:true,hp:1,maxHp:1};ui.state.enemies=[e];ui.state.barrels=[];ui.tick(0);
  const point=world.worldToScreen(e,world.cameraFor(p,ui.state.bounds,world.VIEWPORT,world.GROUND_DEPTH_SCALE));ui.emit('arena','pointermove',{clientX:point.x,clientY:point.y});ui.emit('attack','click');ui.run(.1);assert.equal(e.dead,true);assert.equal(ui.state.run.kills,1);assert.equal(ui.audioEvents.filter(t=>t==='skitterDeath').length,1);
  const clip=manifest.clips[motion.directionalClipId(manifest,'skitter','death',e.heading)],first=ui.calls.filter(c=>c.image.endsWith('skitter_reactions-v08.png')).at(-1),scale=first.d;ui.emit('pause','click');const paused=e.actionTime;ui.run(.3);assert.equal(e.actionTime,paused);ui.emit('resume','click');ui.state.phase='defeat';p.action='death';p.actionTime=0;p.hp=0;const time=ui.state.run.time,gold=ui.state.profile.gold;
  for(let i=0;i<60&&e.actionTime<motion.SKITTER_MOTION.death;i++)ui.tick(.025);assert.ok(e.actionTime>=motion.SKITTER_MOTION.death);const last=ui.calls.filter(c=>c.image.endsWith('skitter_reactions-v08.png')).at(-1);assert.deepEqual(last.args.slice(0,4),[clip.frames[3].x,clip.frames[3].y,clip.frames[3].w,clip.frames[3].h]);near(last.d,scale);assert.equal(last.alpha,1);ui.run(.5);assert.equal(ui.calls.filter(c=>c.image.endsWith('skitter_reactions-v08.png')).at(-1).alpha,1);
  ui.run(.25);const fading=ui.calls.filter(c=>c.image.endsWith('skitter_reactions-v08.png')).at(-1);assert.ok(fading.alpha>0&&fading.alpha<1);ui.run(.3);const end=ui.calls.length;ui.tick();assert.equal(ui.calls.slice(end).some(c=>c.image.endsWith('skitter_reactions-v08.png')),false);assert.equal(ui.state.run.kills,1);assert.equal(ui.state.profile.gold,gold);assert.equal(ui.state.run.time,time);assert.equal(ui.audioEvents.filter(t=>t==='skitterDeath').length,1);
});

test('a simultaneous skitter kill burst keeps each reward but dispatches at most two collapse sounds per frame',async()=>{
  const ui=await host();ui.emit('start','click');const p=ui.state.player;p.x=1800;p.y=1160;const template=ui.state.enemies[0];ui.state.enemies=Array.from({length:4},(_,i)=>({...template,id:900+i,x:p.x+80,y:p.y,homeX:p.x+80,homeY:p.y,speed:0,cooldown:999,aggro:true,hp:1,maxHp:1}));ui.state.barrels=[];ui.tick(0);ui.emit('arena','pointermove',{clientX:680,clientY:400});ui.emit('attack','click');ui.run(.1);assert.equal(ui.state.run.kills,4);assert.equal(ui.audioEvents.filter(t=>t==='skitterDeath').length,2);ui.tick();assert.equal(ui.audioEvents.filter(t=>t==='skitterDeath').length,2);
});

test('chapter selection changes real terrain, creature previews and boss names while preserving stage locks',async()=>{
  const saved=game.createProfile(1000);saved.clearedStage=2;saved.unlockedStage=3;widen(saved);openRegions(saved);
  const ui=await host({saved});
  for(const chapter of chapters.CHAPTERS.filter(c=>c.number===1)){
    pickChapter(ui,chapter.id);await ui.settle();ui.calls.length=0;ui.tick(0);
    assert.equal(ui.nodes.get('chapter-preview-name').textContent,chapter.name);assert.match(ui.nodes.get('chapter-preview-boss').textContent,new RegExp(chapter.bossName));
    assert.equal(ui.nodes.get('game-shell').attributes['data-biome'],chapter.key);
    assert.equal(ui.calls.some(c=>c.image==='assets/'+manifest.chapters[chapter.environment].environment),false,'covered camp does not paint the battlefield');
    assert.equal(ui.nodes.get('roster-name-0').textContent,chapters.MONSTERS[chapter.roster[0]].name);
    ui.emit('start','click');ui.state.run.bossSpawned=true;ui.tick(0);assert.ok(ui.calls.some(c=>c.image==='assets/'+manifest.chapters[chapter.environment].environment));assert.equal(ui.nodes.get('boss-name').textContent,chapter.bossName);
    ui.emit('camp-button','click');ui.emit('retreat','click');ui.tick(0);
  }
  const fresh=await host();fresh.emit('stage-3','click');assert.equal(fresh.nodes.get('chapter-preview-name').textContent,chapters.CHAPTERS[0].name);
});
test('all twenty-one creatures render locked windup/contact, hurt and fixed-scale corpses in eight directions',async()=>{
  const saved=game.createProfile(1000);saved.clearedStage=2;saved.unlockedStage=3;widen(saved);openRegions(saved);
  for(const chapter of chapters.CHAPTERS.filter(c=>c.number===1)){
    const ui=await host({saved});pickChapter(ui,chapter.id);await ui.settle();ui.emit('start','click');ui.state.barrels=[];ui.state.paused=true;
    const p=ui.state.player;p.x=1800;p.y=1160;const originals=ui.state.enemies;
    for(const species of [...chapter.roster,chapter.bossSpecies])for(let heading=0;heading<8;heading++){
      const original=originals.find(e=>e.species===species)??originals.find(e=>!e.boss&&e.type===chapters.MONSTERS[species].role),e={...original,species,name:chapters.MONSTERS[species].name,x:1900,y:1200,heading,moving:false,recoilX:0,recoilY:0,dead:false};ui.state.enemies=[e];
      const check=(family,index)=>{
        ui.calls.length=0;ui.tick(0);const clip=manifest.clips[motion.directionalClipId(manifest,species,family,heading)],frame=clip.frames[index],draw=ui.calls.filter(c=>c.image==='assets/'+clip.image&&c.args.length===8).at(-1);
        assert.ok(draw,species+'/'+heading+'/'+family);assert.deepEqual(draw.args.slice(0,4),[frame.x,frame.y,frame.w,frame.h]);assert.equal(draw.rotation,0);
        near(Math.abs(draw.a),draw.d);near(frame.bodyHeight*draw.d,chapters.MONSTERS[species].height*appActorScale(ui,e.y));assert.equal(Math.sign(draw.a),motion.DIRECTION_VIEWS[heading].mirror);
        const foot=world.worldToScreen(e,appCamera(ui));near(draw.x,foot.x*appScale());near(draw.y,foot.y*appScale());
      };
      e.action='windup';e.actionTime=0;e.windup=1;e.targetX=p.x;e.targetY=p.y;check('attack',0);
      e.action='attack';e.actionTime=0;check('attack',1);e.actionTime=.13;check('walk',0);
      e.action='hurt';e.actionTime=.1;check('attack',0);
      e.dead=true;e.action='death';e.actionTime=.6;check('death',0);const drawCount=ui.calls.length;e.actionTime=2;ui.tick(0);assert.equal(ui.calls.slice(drawCount).some(c=>c.image.startsWith('assets/monsters-')),false);
    }
  }
});
test('equipment sprites, slot summaries and art identity survive equip and application reload',async()=>{
  const saved=game.createProfile(1000);saved.inventory=chapters.EQUIPMENT_ART.slice(0,4).map((a,i)=>({id:i+1,slot:a.slot,tier:a.tier,rarity:1,name:a.name,artId:a.id,affixes:a.slot==='weapon'?{damage:10}:{hp:15}}));
  const ui=await host({saved});ui.emit('camp-inventory','click');assert.equal(ui.nodes.get('item-art-0').attributes['data-art-id'],'forest_blade');assert.match(ui.nodes.get('item-art-0').atlasImage.src,/armory-equipment-v040/);
  ui.emit('equip-1','click');assert.equal(ui.nodes.get('equipped-art-weapon').attributes['data-art-id'],'forest_fang');assert.equal(ui.nodes.get('equipped-name-weapon').textContent,'오크 송곳니 검');assert.equal(ui.nodes.get('salvage-1').disabled,true);
  const reload=await host({saved:ui.profile()});reload.emit('camp-inventory','click');assert.equal(reload.nodes.get('equipped-art-weapon').attributes['data-art-id'],'forest_fang');assert.equal(reload.state.profile.equipment.weapon,2);
});
test('a missing regional atlas leaves camp open but never starts a hunt or replaces saved gear',async()=>{
  const saved=game.createProfile(1000);saved.gold=42;saved.inventory=[{id:1,slot:'weapon',tier:1,rarity:1,name:'기존 검',affixes:{damage:9}}];saved.equipment.weapon=1;
  saved.unlockedStage=3;saved.clearedStage=2;widen(saved);saved.lastSeenAt=1_000_000;const ui=await host({saved,failedAssets:'assets/monsters-ruins-v045.png'});assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.nodes.get('region-status').hidden,false);assert.equal(ui.nodes.get('start').disabled,true);
  ui.emit('start','click');await ui.settle();ui.run(.3);assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.gold,42);assert.equal(ui.state.profile.equipment.weapon,1);assert.equal(ui.state.profile.inventory[0].name,'기존 검');
});

test('encoded delivery loads valid WebP bounds and omits unused original terrain and props',async()=>{
  const ui=await host();assert.equal(ui.nodes.get('loading').hidden,true);
  assert.equal(ui.requestedImages.length,26);assert.ok(ui.requestedImages.every(path=>path.endsWith('.webp')));
  assert.ok(!ui.requestedImages.some(path=>path.includes('terrain_carapace')||path.includes('props_carapace')));
  assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'26');
});

test('late battle assets cannot promote a partial failed bundle or enable combat',async()=>{
 const ui=await host({coldStart:true,failedAssets:'assets/fx_cleave_sequence.png',deferredAsset:'assets/lirian_death-v06.webp'});ui.emit('start','click');await ui.settle();
 assert.equal(ui.state.phase,'camp');assert.equal(ui.nodes.get('game-shell').attributes['data-combat-ready'],'false');
 await ui.completeDeferredAssets();assert.equal(ui.nodes.get('game-shell').attributes['data-combat-ready'],'false');assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'11');
 assert.equal(ui.nodes.get('start').disabled,true);assert.equal(ui.nodes.get('game-shell').attributes['data-region-status'],'error');assert.equal(ui.state.profile.hunts,0);
});

test('invalid equipment sockets fail before gameplay and preserve the saved profile',async()=>{
  const p=game.createProfile(1_000_000);p.gold=123;
  const ui=await host({saved:p,invalidSocket:true});assert.equal(ui.nodes.get('game-shell').attributes['data-region-status'],'error');
  assert.equal(ui.nodes.get('start').disabled,true);assert.deepEqual(ui.profile(),p);
});

test('equipped items retain slot icons, statistics and saved ownership while character poses have no weapon overlay',async()=>{
  const p=game.createProfile(1_000_000);p.inventory=chapters.EQUIPMENT_ART.map((a,i)=>({id:i+1,slot:a.slot,tier:a.tier,rarity:1,name:a.name,artId:a.id,affixes:{}}));p.nextItemId=13;
  const ui=await host({saved:p,recordGeometry:true});ui.emit('camp-inventory','click');
  ui.emit('bag-8','click');ui.emit('equip-8','click');ui.emit('bag-detail-close','click');ui.emit('bag-page-next','click');for(const i of [1,2]){ui.emit('bag-'+i,'click');ui.emit('equip-'+i,'click');ui.emit('bag-detail-close','click');}
  assert.equal(ui.nodes.has('equipment-hero-weapon'),false);assert.equal(ui.nodes.get('equipment-preview').attributes['aria-label'],'리리안 기본 모습');assert.equal(ui.nodes.get('equipped-art-weapon').attributes['data-art-id'],'frost_blade');
  ui.emit('inventory-back','click');ui.emit('start','click');ui.state.paused=true;ui.state.enemies=[];ui.state.barrels=[];ui.state.pickups=[];ui.state.effects=[];
  for(let heading=0;heading<8;heading++){
    ui.state.player.heading=heading;ui.state.player.action='idle';ui.calls.length=0;ui.geometry.length=0;ui.tick(0);
    const draws=ui.calls.filter(c=>c.image.endsWith(manifest.equipment.image)||c.image.endsWith(manifest.equipmentRarities.image));assert.equal(draws.length,0);
    const clip=manifest.clips[motion.directionalClipId(manifest,'hunter','idle',heading)],body=ui.calls.filter(c=>c.image.endsWith(clip.image)).at(-1);assert.ok(body);assert.equal(Math.sign(body.scaleX),motion.DIRECTION_VIEWS[heading].mirror*(clip.flipX?-1:1));assert.ok(!ui.geometry.some(c=>c.kind==='clip'&&c.args[0]==='evenodd'),'base sprite is not cut out for a replacement sword');
  }
  const reloaded=await host({saved:ui.profile()});reloaded.emit('camp-inventory','click');assert.equal(reloaded.nodes.get('equipment-preview').attributes['aria-label'],'리리안 기본 모습');assert.deepEqual(reloaded.profile().equipment,{...game.createProfile(0).equipment,weapon:9,armor:11,charm:12});
  reloaded.emit('equip-0','click');assert.equal(reloaded.nodes.get('equipped-art-weapon').attributes['data-art-id'],'forest_blade');assert.equal(reloaded.nodes.get('equipment-preview').attributes['aria-label'],'리리안 기본 모습');assert.equal(reloaded.nodes.get('persona-damage').textContent,String(Math.round(game.playerStats(reloaded.profile()).damage)));
});


test('high-grade cards explain the real slot effect and highest-grade filter preserves identity',async()=>{
 const p=game.createProfile(1_000_000);p.inventory=['echo','barrier','orbit'].map((id,i)=>{const row=(i===0?game.ANCIENT_CATALOG:game.ITEM_CATALOG).find(r=>r.effectId===id);return {id:i+1,slot:row.slot,tier:row.tier,rarity:5-i,catalogId:row.id,artId:row.artId,name:row.name,affixes:{}};});for(const item of p.inventory)p.equipment[item.slot]=item.id;
 const ui=await host({saved:p,recordGeometry:true});ui.emit('camp-inventory','click');assert.match(ui.nodes.get('equipped-unique-details').textContent,/잔향/);assert.match(ui.nodes.get('equipped-unique-details').textContent,/회피 방벽/);assert.match(ui.nodes.get('item-unique-2').textContent,/총 3회/);ui.nodes.get('loot-filter').value='5';ui.emit('loot-filter','change');assert.match(ui.nodes.get('item-name-0').textContent,/고대/);assert.equal(ui.nodes.get('item-1').hidden,true);assert.match(ui.nodes.get('item-unique-0').textContent,/1.36배/);
 ui.emit('inventory-back','click');ui.emit('start','click');ui.emit('dash','click');ui.tick();assert.ok(ui.state.uniqueState.shield>0);assert.ok(ui.state.uniqueState.orbit);assert.ok(ui.geometry.some(c=>c.kind==='ellipse'&&c.args[2]===42));
});
test('seven visual ranks keep bounded distinct beams and chimes; crafted rank remains a presentation fixture',async()=>{
 for(let rarity=0;rarity<7;rarity++){const ui=await host({recordGeometry:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];const row=rarity===6?game.CRAFTED_CATALOG[0]:rarity===5?game.ANCIENT_CATALOG[0]:game.ITEM_CATALOG[0],item={id:99,slot:row.slot,tier:1,rarity,catalogId:row.id,artId:row.artId,name:row.name,affixes:{}};ui.state.effects.push({id:999,type:'gearDrop',x:ui.state.player.x+60,y:ui.state.player.y,item,rarity,ttl:game.RARITY_INFO[rarity].ttl,maxTtl:game.RARITY_INFO[rarity].ttl});ui.tick();assert.ok(ui.audioDetails.some(e=>e.type==='gearDrop'&&e.details.rarity===rarity));if(rarity)assert.ok(ui.geometry.some(c=>c.kind==='fillRect'&&c.args[3]===[0,48,72,100,124,150,176][rarity]));assert.equal(ui.nodes.get('reward-toast').hidden,true);}
});
// Alpha 0.121: 스킬 축전기 no longer touches 파쇄 (removed from the UI in 0.104); see tests/unique-effects.test.mjs.


test('ancient slot icons and committed attack effects retain identity without character weapon overlays',async()=>{
 const directions=[['d'],['d','s'],['s'],['a','s'],['a'],['a','w'],['w'],['d','w']];
 for(const weapon of game.ANCIENT_CATALOG.filter(r=>r.slot==='weapon'))for(let heading=0;heading<8;heading++){
  const saved=game.createProfile(1_000_000);saved.inventory=['weapon','armor','charm'].map((slot,i)=>{const row=slot==='weapon'?weapon:game.ANCIENT_CATALOG.filter(r=>r.slot===slot&&r.tier===weapon.tier)[game.ANCIENT_CATALOG.filter(r=>r.slot==='weapon'&&r.tier===weapon.tier).indexOf(weapon)%6];return {id:i+1,slot,rarity:5,tier:row.tier,artId:row.artId,catalogId:row.id,name:row.name,affixes:{}};});saved.equipment={weapon:1,armor:2,charm:3};
  const ui=await host({manual:true,saved,recordGeometry:true});ui.emit('camp-inventory','click');assert.match(ui.nodes.get('item-art-0').atlasImage.src,/ancient-individual-v0123/);assert.equal(ui.nodes.get('equipped-art-armor').attributes['data-visual-id'],saved.inventory[1].catalogId);ui.emit('inventory-back','click');ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];for(const key of directions[heading])ui.emit('document','keydown',{key,target:ui.nodes.get('arena')});ui.emit('attack','click');ui.run(.15);
  const draws=ui.calls.filter(c=>c.image.endsWith('ancient-individual-v0123.png')||c.image.endsWith(manifest.equipment.image));assert.equal(draws.length,0);assert.equal(ui.state.player.heading,heading);assert.ok(ui.geometry.some(c=>c.kind==='lineTo'));assert.equal(ui.state.player.swing.equipmentAtStart.weapon.rarity,5);
  // Each direction is an independent virtual tab; release it before the next case.
  hostDisposals.pop()();
 }
});
test('paused equipment swap keeps the committed attack grade and next attack uses the newly worn grade',async()=>{
 const saved=game.createProfile(1_000_000);saved.inventory=[{id:1,slot:'weapon',rarity:3,tier:1,artId:'forest_blade',name:'검',affixes:{}},{id:2,...game.ANCIENT_CATALOG.find(r=>r.slot==='weapon'&&r.visualStyle===6),catalogId:game.ANCIENT_CATALOG.find(r=>r.slot==='weapon'&&r.visualStyle===6).id,rarity:5,affixes:{}}].map((r,i)=>({...r,id:i+1}));saved.equipment.weapon=1;const ui=await host({saved,recordGeometry:true});ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.emit('attack','click');ui.tick(.025);ui.emit('pause','click');ui.emit('document','keydown',{key:'i'});ui.emit('equip-1','click');assert.equal(ui.state.profile.equipment.weapon,2);assert.equal(ui.state.player.swing.equipmentAtStart.weapon.rarity,3);ui.emit('inventory-back','click');ui.emit('resume','click');ui.run(.4);ui.emit('attack','click');assert.equal(ui.state.player.swing.equipmentAtStart.weapon.rarity,5);
});
test('missing rarity art fails closed and preserves saved high-grade ownership',async()=>{
 const row=game.ANCIENT_CATALOG.find(r=>r.slot==='weapon'),saved=game.createProfile(1_000_000);saved.inventory=[{id:9,slot:row.slot,tier:row.tier,rarity:5,artId:row.artId,catalogId:row.id,name:row.name,affixes:{damage:20}}];saved.equipment.weapon=9;const ui=await host({saved,failedAssets:'assets/ancient-individual-v0123.webp'});assert.equal(ui.nodes.get('start').disabled,true);assert.match(ui.nodes.get('loading').textContent,/ancient-individual-v0123/);ui.emit('start','click');ui.tick();assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.equipment.weapon,9);assert.ok(game.ancientDefinition(ui.state.profile.inventory[0]));
});

test('camp codex masks undiscovered art, filters, persists targets and prepares unlocked boss replays',async()=>{
 const row=game.ANCIENT_CATALOG[0],p=game.createProfile(1_000_000);p.version=5;p.clearedStage=1;p.unlockedStage=2;p.inventory=[{id:1,slot:row.slot,tier:row.tier,rarity:5,artId:row.artId,catalogId:row.id,name:row.name,affixes:{}}];p.equipment.weapon=1;
 const ui=await host({saved:p,campaign:true});ui.emit('camp-codex','click');assert.equal(ui.nodes.get('codex-content').hidden,false);assert.equal(ui.nodes.get('codex-count').textContent,'1 / 165 발견');assert.equal(ui.nodes.get('codex-card-0').attributes['data-discovered'],'true');assert.equal(ui.nodes.get('codex-card-1').attributes['data-discovered'],'false');assert.equal(ui.nodes.get('codex-art-1').attributes['aria-label'],'미발견 유물 이미지');
 ui.emit('codex-card-1','click');assert.equal(ui.nodes.get('codex-detail').pageRevealed,true);ui.emit('codex-target','click');assert.equal(ui.profile().targetAncientId,game.ANCIENT_CATALOG[1].id);assert.equal(ui.nodes.get('codex-target').disabled,true);ui.nodes.get('codex-chapter').value='2';ui.emit('codex-chapter','change');assert.equal(ui.nodes.get('codex-results').textContent,'25종 표시');assert.equal(ui.nodes.get('codex-card-1').hidden,true);
 ui.emit('codex-card-40','click');assert.equal(ui.nodes.get('codex-route').disabled,true);ui.emit('codex-route','click');assert.equal(ui.nodes.get('codex-content').hidden,false);
 ui.emit('codex-card-0','click');assert.match(ui.nodes.get('codex-route-note').textContent,/1~10장 보스 희귀 드롭/);assert.equal(ui.nodes.get('codex-route').disabled,false);ui.emit('codex-route','click');assert.equal(ui.nodes.get('codex-content').hidden,true);
 const restored=await host({saved:ui.profile()});assert.equal(restored.profile().targetAncientId,game.ANCIENT_CATALOG[1].id);assert.match(restored.nodes.get('farm-target-note').textContent,new RegExp(game.ANCIENT_CATALOG[1].name));restored.emit('camp-codex','click');assert.equal(restored.nodes.get('codex-detail-name').textContent,game.ANCIENT_CATALOG[1].name);restored.emit('codex-clear','click');assert.equal(restored.profile().targetAncientId,null);
});
test('archive is activation only and returns focus to the selected artifact before leaving camp',async()=>{
 const ui=await host();ui.emit('camp-codex','click');assert.equal(ui.nodes.get('codex-detail').hidden,true);assert.equal(ui.document.activeElement.id,'page-back');
 for(const event of ['pointerenter','mouseenter','focus'])ui.emit('codex-card-2',event,{pointerType:'mouse'});
 assert.equal(ui.nodes.get('codex-detail').hidden,true);assert.equal(ui.nodes.get('codex-browser').hidden,false);
 ui.emit('codex-card-2','click');assert.equal(ui.nodes.get('codex-detail').hidden,false);assert.equal(ui.nodes.get('codex-browser').hidden,true);assert.equal(ui.document.activeElement.id,'codex-list-back');
 ui.emit('page-back','click');assert.equal(ui.nodes.get('codex-content').hidden,false);assert.equal(ui.nodes.get('codex-detail').hidden,true);assert.equal(ui.document.activeElement.id,'codex-card-2');
 ui.emit('codex-card-7','click');ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('codex-detail').hidden,true);assert.equal(ui.document.activeElement.id,'codex-card-7');
 ui.emit('page-back','click');assert.equal(ui.nodes.get('codex-content').hidden,true);ui.emit('camp-codex','click');assert.equal(ui.nodes.get('codex-detail').hidden,true);
});

test('archive recent discovery uses real records including removed equipment and empty state is honest',async()=>{
 const empty=await host();empty.emit('camp-codex','click');assert.equal(empty.nodes.get('codex-feature').attributes['data-empty'],'true');assert.equal(empty.nodes.get('codex-feature-art').hidden,true);assert.equal(empty.nodes.get('codex-feature-open').hidden,true);assert.equal(empty.nodes.get('codex-progress').attributes['aria-valuenow'],'0');empty.emit('codex-feature-open','click');assert.equal(empty.nodes.get('codex-detail').hidden,true);
 const p=game.createProfile(1_000_000);p.discoveredAncients=[game.ANCIENT_CATALOG[2].id,game.ANCIENT_CATALOG[41].id];const ui=await host({saved:p});ui.emit('camp-codex','click');assert.equal(ui.nodes.get('codex-count').textContent,'2 / 165 발견');assert.equal(ui.nodes.get('codex-percent').textContent,'1.2%');assert.equal(ui.nodes.get('codex-feature-name').textContent,game.ANCIENT_CATALOG[41].name.replace(' ','\n'));assert.equal(ui.profile().inventory.length,0);
 ui.emit('codex-feature-open','click');assert.equal(ui.nodes.get('codex-detail-name').textContent,game.ANCIENT_CATALOG[41].name);ui.emit('codex-list-back','click');assert.equal(ui.document.activeElement.id,'codex-feature-open');
 // Same count, different identities must invalidate the presentation cache.
 ui.state.profile.discoveredAncients=[game.ANCIENT_CATALOG[3].id,game.ANCIENT_CATALOG[5].id];ui.tick();assert.equal(ui.nodes.get('codex-feature-name').textContent,game.ANCIENT_CATALOG[5].name.replace(' ','\n'));assert.equal(ui.nodes.get('codex-card-41').attributes['data-discovered'],'false');assert.equal(ui.nodes.get('codex-card-5').attributes['data-discovered'],'true');
});

test('archive filters, category tabs, sorting and view mode preserve identities and profile',async()=>{
 const p=game.createProfile(1_000_000);p.discoveredAncients=[game.ANCIENT_CATALOG[42].id,game.ANCIENT_CATALOG[12].id];const ui=await host({saved:p});const before=ui.profile();ui.emit('camp-codex','click');ui.emit('codex-filter-toggle','click');assert.equal(ui.nodes.get('codex-filters').hidden,false);assert.equal(ui.nodes.get('codex-filter-toggle').attributes['aria-expanded'],'true');
 ui.emit('codex-tab-armor','click');assert.equal(ui.nodes.get('codex-slot').value,'armor');for(const [n,row] of game.ANCIENT_CATALOG.entries())assert.equal(ui.nodes.get('codex-card-'+n).hidden,!['helmet','armor','pants','boots'].includes(row.slot));
 ui.nodes.get('codex-slot').value='charm';ui.emit('codex-slot','change');assert.equal(ui.nodes.get('codex-tab-charm').attributes['aria-pressed'],'true');
 ui.emit('codex-filter-reset','click');ui.nodes.get('codex-sort').value='found';ui.emit('codex-sort','change');assert.deepEqual(Array.from(ui.nodes.get('codex-grid').children.slice(0,2),n=>n.id),['codex-card-12','codex-card-42']);
 ui.nodes.get('codex-sort').value='name';ui.emit('codex-sort','change');const expected=game.ANCIENT_CATALOG.map((row,i)=>({row,i})).sort((a,b)=>a.row.name.localeCompare(b.row.name,'ko')).map(({i})=>'codex-card-'+i);assert.deepEqual(Array.from(ui.nodes.get('codex-grid').children,n=>n.id),expected);
 ui.emit('codex-view-list','click');assert.equal(ui.nodes.get('codex-grid').attributes['data-layout'],'list');ui.emit('codex-card-42','click');assert.equal(ui.nodes.get('codex-detail-name').textContent,game.ANCIENT_CATALOG[42].name);ui.emit('codex-list-back','click');ui.emit('codex-view-grid','click');assert.equal(ui.nodes.get('codex-grid').attributes['data-layout'],'grid');
 ui.nodes.get('codex-search').value='절대로없는유물';ui.emit('codex-search','input');assert.equal(ui.nodes.get('codex-empty').hidden,false);assert.equal(ui.nodes.get('codex-detail').hidden,true);for(let i=0;i<60;i++)assert.equal(ui.nodes.get('codex-card-'+i).hidden,true);
 ui.emit('codex-filter-reset','click');assert.equal(ui.nodes.get('codex-results').textContent,'165종 표시');assert.equal(ui.nodes.get('codex-empty').hidden,true);assert.deepEqual(ui.profile(),before);
});

test('archive hunt action opens the real map without starting or changing ownership',async()=>{
 const ui=await host();ui.emit('camp-codex','click');const before=ui.profile();ui.emit('codex-hunt','click');assert.equal(ui.nodes.get('codex-content').hidden,true);assert.equal(ui.nodes.get('camp-map-panel').hidden,false);assert.equal(ui.state.phase,'camp');assert.deepEqual(ui.profile(),before);ui.emit('camp-map-start','click');assert.equal(ui.state.phase,'playing');ui.emit('camp-codex','click');assert.equal(ui.nodes.get('codex-content').hidden,true);
});

test('advanced victory offers another hunt of the same boss and captured difficulty',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.bossMastery=[1,1,1];const ui=await host({saved:p,campaign:true});ui.state.phase='victory';ui.state.stageId=3;ui.state.run.stage=10;ui.state.difficulty=2;ui.state.resultDelay=0;ui.tick();assert.equal(ui.nodes.get('next-stage').hidden,false);assert.equal(ui.nodes.get('next-stage').textContent,'같은 난이도로 처음부터');assert.match(ui.nodes.get('result-note').textContent,/악몽 공략/);ui.emit('next-stage','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.state.stageId,3);assert.equal(ui.state.run.stage,1);assert.equal(ui.state.difficulty,2);
});


test('normal and boss slam windups omit all ground warning fills, rims and reticles without mutating attacks',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const p=ui.state.player,template=ui.state.enemies[0];ui.state.barrels=[];ui.state.spawns=[];ui.state.paused=true;
 for(const boss of [false,true]){
  const e={...template,id:990,boss,type:'bulwark',species:undefined,bossCycle:['slam'],elite:false,chargeEvery:0,x:p.x+100,y:p.y,targetX:p.x,targetY:p.y+40,radius:90,action:'windup',actionTime:.85,windup:1};
  ui.state.enemies=[e];ui.state.effects=[{id:991,type:'impact',x:p.x,y:p.y,ttl:.1,maxTtl:.2}];const before=JSON.stringify(e);ui.geometry.length=0;ui.tick(0);assert.equal(JSON.stringify(e),before);
  assert.equal(ui.geometry.some(c=>c.kind==='ellipse'&&c.args[0]===e.targetX&&c.args[1]===e.targetY),false);
  assert.equal(ui.geometry.some(c=>c.kind==='fill'&&c.fillStyle==='#8e3a5220'),false);
  assert.equal(ui.geometry.some(c=>c.kind==='moveTo'&&c.args[0]===e.targetX-7&&c.args[1]===e.targetY),false);
  assert.ok(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#f7dfe9'),'actual contact accents remain');
 }
});
test('charge windups omit path overlays for normal and boss attacks without changing locked attack state',async()=>{
 for(const boss of [false,true])for(const edge of [false,true]){
  const ui=await host({recordGeometry:true});ui.emit('start','click');const p=ui.state.player,b=ui.state.bounds;if(edge)p.x=b.width-b.padding-100;const x=edge?b.width-b.padding-40:p.x+70,y=p.y,e={...ui.state.enemies[0],id:990,boss,type:'skitter',species:undefined,chapterId:boss?3:undefined,bossCycle:['charge'],elite:false,chargeEvery:1,pattern:0,chargeSpeed:boss?650:400,chargeDuration:boss?.45:.26,x,y,targetX:x+150,targetY:y+(edge?150:0),action:'windup',actionTime:.5,windup:1};
  ui.state.enemies=[e];ui.state.barrels=[];ui.state.effects=[];ui.state.paused=true;const before=JSON.stringify(e);ui.geometry.length=0;ui.tick(0);const r=boss?90:65;
  assert.equal(JSON.stringify(e),before);assert.equal(game.enemyAttackKind(e),'charge');
  assert.equal(ui.geometry.some(c=>c.kind==='ellipse'&&c.args[2]===r&&c.args[3]===r),false);
  assert.equal(ui.geometry.some(c=>c.kind==='stroke'&&c.lineWidth===r*2),false);
 }
});
test('volley windups omit directional rays and arrows while preserving the captured attack when a boss enrages',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const p=ui.state.player,e={...ui.state.enemies[0],id:990,boss:true,chapterId:2,bossCycle:['volley'],volleyShots:5,enraged:false,x:p.x+100,y:p.y,targetX:p.x+300,targetY:p.y,action:'windup',actionTime:.8,windup:1};ui.state.enemies=[e];ui.state.barrels=[];ui.state.effects=[];ui.state.paused=true;
 for(const enraged of [false,true]){e.enraged=enraged;const before=JSON.stringify(e);ui.geometry.length=0;ui.tick(0);assert.equal(JSON.stringify(e),before);assert.equal(game.projectileCount(e,2),5);assert.equal(ui.geometry.some(c=>c.kind==='lineTo'&&Math.abs(Math.hypot(...c.args)-600)<1e-6),false);assert.equal(ui.geometry.some(c=>c.kind==='moveTo'&&c.args[0]===24&&c.args[1]===0),false);}
});


test('floor loot draws each item once, labels only the highest visible rank and consumes no RNG',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const p=ui.state.player,row=game.ITEM_CATALOG[0];ui.state.enemies=[];ui.state.barrels=[];ui.state.paused=true;
 const drops=[3,4].map((rarity,i)=>({id:990+i,kind:'equipment',x:p.x+100+i*100,y:p.y,item:{...row,id:900+i,catalogId:row.id,rarity,affixes:{}},age:.2}));ui.state.pickups=drops;ui.state.effects=drops.map((d,i)=>({id:995+i,type:'gearDrop',source:'normal',item:d.item,x:d.x,y:d.y,ttl:2,maxTtl:2.2}));const before=[ui.state.rng,ui.state.lootRng,ui.state.materialRng,JSON.stringify(ui.profile())];ui.calls.length=0;ui.geometry.length=0;ui.tick(0);
 assert.equal(ui.calls.filter(c=>c.image==='assets/'+manifest.equipment.image).length,2);const labels=ui.geometry.filter(c=>c.kind==='fillText'&&String(c.args[0]).includes(row.name));assert.equal(labels.length,1);assert.match(labels[0].args[0],/신화/);assert.deepEqual([ui.state.rng,ui.state.lootRng,ui.state.materialRng,JSON.stringify(ui.profile())],before);
});
test('rare material and converted equipment receipts keep distinct ownership messages',async()=>{
 const ui=await host();ui.emit('start','click');ui.state.effects=[{id:990,type:'loot',name:'태초의 기원 ×1',rarity:5,material:true,materialId:'origin',ttl:2,maxTtl:3}];ui.tick(0);assert.equal(ui.nodes.get('reward-kicker').textContent,'재료 보관');assert.equal(ui.nodes.get('reward-toast').attributes['data-kind'],'material');assert.match(ui.nodes.get('reward-meta').textContent,/창고/);assert.equal(ui.nodes.get('reward-brief').hidden,true);
 ui.state.effects=[{id:991,type:'loot',name:'전설 검',rarity:3,origin:'monster',converted:true,salvagedGold:25,ttl:2,maxTtl:2.5}];ui.tick(0);assert.equal(ui.nodes.get('reward-kicker').textContent,'장비 자동 분해');assert.equal(ui.nodes.get('reward-toast').attributes['data-kind'],'equipment');assert.match(ui.nodes.get('reward-meta').textContent,/가방 보호.*25/);assert.equal(ui.nodes.get('reward-title').textContent,'분해 · 전설 검');assert.equal(ui.nodes.get('reward-brief').hidden,false);assert.equal(ui.nodes.get('reward-brief').textContent,'분해 +25 골드');ui.state.run.flow='stageClear';ui.state.effects[0].origin='stage';ui.tick(0);assert.equal(ui.nodes.get('reward-kicker').textContent,'장비 자동 분해');assert.match(ui.nodes.get('reward-meta').textContent,/가방 보호.*25/);
 ui.state.effects=[{id:992,type:'loot',name:'신화 검',rarity:4,origin:'monster',ttl:2,maxTtl:2.5}];ui.tick(0);assert.equal(ui.nodes.get('reward-title').textContent,'신화 검');assert.equal(ui.nodes.get('reward-brief').textContent,'');assert.equal(ui.nodes.get('reward-brief').hidden,true);
});
test('a kept legendary pickup stays featured over common gear and rare materials without changing ownership',async()=>{
 const ui=await host();ui.emit('start','click');ui.state.paused=true;const before=JSON.stringify(ui.state.profile);
 ui.state.effects=[{id:990,type:'loot',name:'전설 검',rarity:3,origin:'monster',ttl:4,maxTtl:4},{id:991,type:'loot',name:'세계수 씨앗',rarity:5,material:true,ttl:3,maxTtl:3},{id:992,type:'loot',name:'일반 검',rarity:0,origin:'monster',ttl:2.5,maxTtl:2.5}];
 ui.tick(0);assert.equal(ui.nodes.get('reward-title').textContent,'전설 검');assert.equal(ui.nodes.get('reward-toast').attributes['data-kind'],'equipment');assert.equal(JSON.stringify(ui.state.profile),before);
 ui.state.effects[0].ttl=0;ui.state.effects.shift();ui.tick(0);assert.equal(ui.nodes.get('reward-title').textContent,'세계수 씨앗');
});

test('material pickup and landing burst draw one body without awarding materials during render',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const p=ui.state.player,x=p.x+150,y=p.y+40;ui.state.enemies=[];ui.state.barrels=[];ui.state.paused=true;ui.state.pickups=[{id:990,kind:'material',materialId:'boneIron',x,y,age:.2}];ui.state.effects=[{id:991,type:'materialDrop',materialId:'boneIron',x,y,ttl:.8,maxTtl:1}];const before=JSON.stringify(ui.profile().materials);ui.geometry.length=0;ui.tick(0);assert.equal(ui.geometry.filter(c=>c.kind==='moveTo'&&c.args[0]===x&&c.args[1]===y-31).length,1);assert.equal(JSON.stringify(ui.profile().materials),before);
});


test('damage typography bounds enemy clutter independently of player hits without changing damage events',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');ui.tick();const p=ui.state.player;ui.state.enemies=[];ui.state.barrels=[];ui.state.paused=true;
 ui.state.effects=Array.from({length:30},(_,i)=>({id:990+i,type:'damage',x:p.x+(i%3-1)*180,y:p.y-70-Math.floor((29-i)/3)*70,value:100+i,critical:i===29,status:i===28?'bleed':undefined,guarded:i===27,ttl:.55,maxTtl:.65}));
 ui.state.effects.push({id:1100,type:'playerDamage',x:p.x,y:p.y-115,value:37,ttl:.55,maxTtl:.65});const before=JSON.stringify(ui.state.effects),hp=p.hp,rng=ui.state.rng;ui.geometry.length=0;ui.tick(0);
 const numbers=ui.geometry.filter(c=>c.kind==='strokeText');assert.ok(numbers.length>=4&&numbers.length<=11);assert.equal(numbers.filter(c=>c.args[0]==='37').length,1);assert.ok(numbers.some(c=>c.args[0]==='129!'&&c.font.includes('27px')));assert.ok(numbers.some(c=>c.args[0]==='128 · 출혈'&&c.font.includes('16px')));assert.ok(numbers.some(c=>c.args[0]==='127 · 방어'&&c.font.includes('17px')));assert.equal(JSON.stringify(ui.state.effects),before);assert.equal(p.hp,hp);assert.equal(ui.state.rng,rng);
 ui.state.effects.forEach(f=>f.ttl=0);ui.geometry.length=0;ui.tick(0);assert.equal(ui.geometry.some(c=>c.kind==='strokeText'),false);
});

test('death accents finish locally while corpse animation, rewards and pause remain unchanged',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');ui.tick();const p=ui.state.player,template=ui.state.enemies[0];ui.state.enemies=Array.from({length:10},(_,i)=>({...template,id:900+i,x:p.x+i*8,y:p.y+40,dead:true,action:'death',actionTime:.15,boss:false,elite:i===0}));ui.state.barrels=[];ui.state.effects=[];ui.state.paused=true;const before=JSON.stringify(ui.state.enemies),profile=JSON.stringify(ui.profile());ui.geometry.length=0;ui.tick(0);const accents=ui.geometry.filter(c=>c.kind==='stroke'&&c.strokeStyle==='#70304c');assert.equal(accents.length,6);assert.equal(JSON.stringify(ui.state.enemies),before);assert.equal(JSON.stringify(ui.profile()),profile);
 ui.state.enemies.forEach(e=>e.actionTime=1);ui.geometry.length=0;ui.tick(0);assert.equal(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#70304c'),false);
 ui.state.enemies=[];ui.state.effects=[{id:1100,type:'bossDeath',x:p.x,y:p.y,ttl:1.7,maxTtl:2}];ui.geometry.length=0;ui.tick(0);assert.ok(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#f7dfe9'));ui.state.effects[0].ttl=.5;ui.geometry.length=0;ui.tick(0);assert.equal(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#f7dfe9'),false);
});

test('ceremonial drop flare is reserved for one highest rarity and expires without affecting drop ownership or RNG',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');ui.tick();const p=ui.state.player,row=game.ITEM_CATALOG[0];ui.state.enemies=[];ui.state.barrels=[];ui.state.pickups=[];ui.state.paused=true;
 ui.state.effects=[3,4,5].map((rarity,i)=>({id:990+i,type:'gearDrop',source:'normal',x:p.x+(i-1)*100,y:p.y,item:{...row,id:990+i,catalogId:row.id,rarity,affixes:{}},ttl:2,maxTtl:2.2}));const before=JSON.stringify(ui.state.effects),rng=[ui.state.rng,ui.state.lootRng,ui.state.materialRng],profile=JSON.stringify(ui.profile());ui.geometry.length=0;ui.tick(0);const flares=ui.calls.filter(c=>c.image.includes('loot-pickup-v077'));assert.ok(flares.length>0&&flares.length<=8);assert.equal(flares.filter(c=>c.args[6]===game.gearDropPresentation({rarity:5}).size).length,2);assert.equal(ui.calls.filter(c=>c.image.includes('equipment_chapters')).length,0);assert.equal(JSON.stringify(ui.state.effects),before);assert.deepEqual([ui.state.rng,ui.state.lootRng,ui.state.materialRng],rng);assert.equal(JSON.stringify(ui.profile()),profile);
 ui.state.effects.forEach(f=>f.ttl=f.maxTtl-1);ui.geometry.length=0;ui.tick(0);assert.equal(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#f7dfe9'),false);
});


test('dense damage labels do not overlap after projected layout and keep player damage visible',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');ui.tick();const p=ui.state.player;ui.state.enemies=[];ui.state.barrels=[];ui.state.paused=true;ui.state.effects=Array.from({length:30},(_,i)=>({id:990+i,type:'damage',x:p.x+(i%3-1)*30,y:p.y-70,value:100+i,ttl:.49,maxTtl:.65}));ui.state.effects.push({id:1100,type:'playerDamage',x:p.x,y:p.y-115,value:37,ttl:.49,maxTtl:.65});ui.geometry.length=0;ui.tick(0);const labels=ui.geometry.filter(c=>c.kind==='strokeText'),boxes=labels.map(c=>{const point=renderedPoint(c,0,0),w=c.args[0].length*18*Math.abs(c.a),h=parseFloat(c.font.split(' ')[1])*Math.abs(c.d);return {x:point.x-w/2,y:point.y-h,w,h};});assert.ok(labels.some(c=>c.args[0]==='37'));assert.ok(labels.length>1&&labels.length<=11);for(let i=0;i<boxes.length;i++)for(let j=0;j<i;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x>=b.x+b.w||a.x+a.w<=b.x||a.y>=b.y+b.h||a.y+a.h<=b.y,'damage labels overlap');}
});


test('entry shows the current stage, countdown and remaining monsters without old progress panels',async()=>{
 const ui=await host({campaign:true});ui.emit('start','click');ui.run(.15);
 for(const id of ['stage-caption','combat-stage','stage-name','wave-label','quest','wave-fill','encounter-tactic'])assert.equal(ui.nodes.has(id),false);
 assert.equal(ui.nodes.has('notice'),false);assert.equal(ui.nodes.get('stage-complete').hidden,true);assert.equal(ui.nodes.get('hunt-stage').textContent,game.STAGES[0].name+' · 1-1 스테이지');assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('monsters-left').textContent,'56');assert.equal(ui.nodes.get('attack').disabled,false);assert.equal(ui.nodes.get('joystick').disabled,false);
 const time=ui.state.run.timeRemaining,ring=ui.nodes.get('hunt-clock-ring').style.strokeDashoffset;ui.emit('pause','click');ui.run(.5);assert.equal(ui.state.run.timeRemaining,time);assert.equal(ui.nodes.get('hunt-clock-ring').style.strokeDashoffset,ring);ui.emit('resume','click');ui.run(.8);assert.ok(ui.state.run.timeRemaining<time);assert.equal(ui.nodes.has('notice'),false);
});

test('boss arrival and rage omit the text panel while retaining portal timing, audio and input',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');ui.tick();const p=ui.state.player,q={id:990,boss:true,type:'bulwark',x:p.x+150,y:p.y+40,warning:1.3,delay:.65,locked:true};ui.state.enemies=[];ui.state.barrels=[];ui.state.spawns=[q];ui.state.effects=[{id:991,type:'bossArrival',ttl:.65,maxTtl:1.3}];const before=JSON.stringify(q),rng=[ui.state.rng,ui.state.lootRng,ui.state.materialRng];ui.geometry.length=0;ui.tick(0);for(const id of ['notice','notice-mark','notice-kicker','notice-title','notice-detail','notice-progress'])assert.equal(ui.nodes.has(id),false);assert.equal(ui.nodes.get('attack').disabled,false);assert.ok(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#c46b8e'&&c.lineWidth===3));assert.equal(JSON.stringify(q),before);assert.deepEqual([ui.state.rng,ui.state.lootRng,ui.state.materialRng],rng);assert.equal(ui.audioEvents.filter(t=>t==='bossArrival').length,1);ui.tick(0);assert.equal(ui.audioEvents.filter(t=>t==='bossArrival').length,1);
 ui.emit('pause','click');ui.run(.5);assert.equal(q.delay,.65);assert.equal(ui.nodes.has('notice'),false);ui.emit('resume','click');ui.state.effects=[{id:992,type:'bossRage',ttl:1.5,maxTtl:2}];ui.tick(0);ui.state.phase='victory';ui.tick(0);assert.equal(ui.nodes.has('notice'),false);
});

test('stage clear is a short nonblocking notice and resets the minute clock without carrying held movement',async()=>{
 const ui=await host({manual:true,campaign:true});ui.emit('start','click');ui.tick();ui.state.enemies=[];ui.state.spawns=[];ui.state.run.wave=3;ui.state.run.waveKills=ui.state.run.waveQuota;ui.stick(1,0);ui.tick();
 assert.equal(ui.state.run.stage,2);assert.equal(ui.state.run.flow,'combat');assert.ok(ui.state.enemies.some(e=>!e.dead));assert.equal(ui.nodes.has('notice'),false);assert.equal(ui.nodes.get('stage-complete').hidden,false);assert.equal(ui.nodes.get('stage-complete').textContent,'1-1 스테이지 완료');assert.equal(ui.nodes.get('hunt-stage').textContent,game.STAGES[0].name+' · 1-2 스테이지');assert.equal(ui.nodes.get('attack').disabled,false);assert.equal(ui.state.player.moving,false);assert.equal(ui.nodes.get('time-left').textContent,'01:00');const rewards=ui.state.profile.gold;
 ui.run(.8);assert.equal(ui.nodes.get('stage-complete').hidden,false);ui.emit('pause','click');const ttl=ui.state.effects.find(f=>f.type==='stageClear').ttl;ui.run(.5);assert.equal(ui.nodes.get('stage-complete').hidden,true);assert.equal(ui.state.effects.find(f=>f.type==='stageClear').ttl,ttl);ui.emit('resume','click');assert.equal(ui.nodes.get('stage-complete').hidden,false);ui.run(.9);assert.equal(ui.nodes.get('stage-complete').hidden,true);assert.equal(ui.state.profile.gold,rewards);assert.equal(ui.nodes.get('monsters-left').textContent,'64');assert.equal(ui.state.player.moving,false);
});

test('craft categories keep the selected recipe visible and only change presentation',async()=>{
 const ui=await host();const before=ui.profile();ui.emit('nav-craft','click');ui.emit('craft-slot-armor','click');assert.equal(ui.nodes.get('craft-recipe-0').hidden,true);assert.equal(ui.nodes.get('craft-recipe-2').hidden,false);assert.equal(ui.nodes.get('craft-recipe-2').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('craft-name').textContent,game.CRAFTED_CATALOG[2].name);assert.equal(ui.nodes.get('craft-ready').textContent,'준비 0 / 7');assert.equal(ui.nodes.get('craft-cost-seal').hidden,false);assert.equal(ui.nodes.get('craft-cost-root').hidden,true);ui.emit('craft-slot-charm','click');assert.equal(ui.nodes.get('craft-recipe-4').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('craft-cost-root').hidden,false);ui.emit('craft-slot-all','click');assert.ok(game.CRAFTED_CATALOG.every((_,n)=>!ui.nodes.get('craft-recipe-'+n).hidden));assert.deepEqual(ui.profile(),before);
});
test('craft material inspection without a saved goal preserves ownership and returns focus through Escape',async()=>{
 const ui=await host();const before=ui.profile();ui.emit('nav-craft','click');ui.emit('craft-recipe-0','click');ui.emit('craft-material-origin','click');assert.equal(ui.nodes.get('track-content').hidden,false);assert.equal(ui.nodes.get('track-name').textContent,game.CRAFTED_CATALOG[0].name);assert.match(ui.nodes.get('track-route-title').textContent,/무명의 기원/);assert.equal(ui.nodes.get('track-clear').hidden,true);assert.equal(ui.nodes.get('track-hide').hidden,true);ui.emit('track-clear','click');ui.emit('track-hide','click');assert.deepEqual(ui.profile(),before);ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.nodes.get('craft-content').hidden,false);assert.equal(ui.document.activeElement.id,'craft-material-origin');assert.equal(ui.nodes.get('craft-recipe-0').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('craft-target').disabled,false);
});
test('craft readiness and price use actual inventory while successful payment updates all displayed counters',async()=>{
 const p=game.createProfile(1_000_000);p.unlockedStage=3;p.clearedStage=3;p.gold=10000;for(const m of game.MATERIALS)p.materials[m.id]=100;p.materials.origin=1;const ui=await host({saved:p});ui.emit('nav-craft','click');ui.emit('craft-recipe-0','click');assert.equal(ui.nodes.get('craft-ready').textContent,'준비 6 / 6');assert.equal(ui.nodes.get('craft-gold').textContent,'3,500');assert.equal(ui.nodes.get('craft-gold-owned').textContent,'보유 10,000');assert.equal(ui.nodes.get('craft-submit').disabled,false);ui.emit('craft-submit','click');assert.equal(ui.nodes.get('craft-count-boneIron').textContent,'40 / 60');assert.equal(ui.nodes.get('craft-count-origin').textContent,'0 / 1');assert.equal(ui.nodes.get('craft-gold-owned').textContent,'보유 6,500');assert.equal(ui.nodes.get('craft-submit').disabled,true);assert.equal(ui.nodes.get('craft-equip').hidden,false);const paid=ui.profile();ui.emit('craft-submit','click');assert.deepEqual(ui.profile(),paid);
});
test('returning a saved target to crafting resets an incompatible category without changing the goal',async()=>{
 const p=game.createProfile(1_000_000);p.targetCraftId=game.CRAFTED_CATALOG[1].id;const ui=await host({saved:p});ui.emit('nav-craft','click');ui.emit('craft-slot-armor','click');ui.emit('page-back','click');ui.emit('camp-track','click');ui.emit('track-craft','click');assert.equal(ui.nodes.get('craft-slot-all').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('craft-recipe-1').hidden,false);assert.equal(ui.nodes.get('craft-name').textContent,game.CRAFTED_CATALOG[1].name);assert.equal(ui.profile().targetCraftId,p.targetCraftId);
});


test('menu drawers focus the visible page header and return to their real origin',async()=>{
 const ui=await host();const before=ui.profile();ui.emit('nav-hunt','click');assert.equal(ui.document.activeElement.id,'page-back');ui.emit('page-back','click');assert.equal(ui.document.activeElement.id,'nav-hunt');ui.emit('nav-more','click');assert.equal(ui.document.activeElement.id,'page-back');ui.emit('nav-growth','click');assert.equal(ui.document.activeElement.id,'page-back');ui.emit('document','keydown',{key:'Escape'});assert.equal(ui.document.activeElement.id,'nav-more');assert.deepEqual(ui.profile(),before);
});

test('unselected regional failures do not block startup and regional failure retries without profile mutation',async()=>{
 const p=game.createProfile(1_000_000);p.unlockedStage=3;p.clearedStage=2;p.stageProgress=[10,10,1];widen(p);
 // Startup opens chapter 21 (darkness); a fire chapter's ground tile fails until retried.
 const failures=new Set(['assets/terrain-c11-v0107.webp']);const ui=await host({saved:p,failedAssets:failures});
 assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.requestedImages.length,27);
 assert.ok(!ui.requestedImages.some(path=>/monsters-(forest|frost|fire|boss_fire|boss_forest)|terrain-(forest|frost)|terrain-c(0|1)/.test(path)));
 const before=ui.profile();pickChapter(ui,11);assert.equal(ui.nodes.get('start').disabled,true);ui.emit('start','click');assert.equal(ui.state.phase,'camp');
 await ui.settle();assert.equal(ui.nodes.get('game-shell').attributes['data-region-status'],'error');assert.equal(ui.nodes.get('region-retry').hidden,false);
 assert.equal(ui.nodes.get('roster-art-0').style.backgroundImage,'none');assert.equal(ui.nodes.get('roster-art-0').atlasImage?.hidden??true,true);assert.deepEqual(ui.profile(),before);
 failures.clear();ui.emit('region-retry','click');await ui.settle();assert.equal(ui.nodes.get('game-shell').attributes['data-resident-region'],'11');assert.equal(ui.nodes.get('start').disabled,false);
 assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'28');ui.emit('start','click');assert.equal(ui.state.stageId,11);assert.equal(ui.state.phase,'playing');ui.tick();
});

test('rapid regional selection ignores an abandoned completion and evicted regions reload on demand',async()=>{
 const p=game.createProfile(1_000_000);p.unlockedStage=3;p.clearedStage=2;widen(p);
 const ui=await host({saved:p,deferredAsset:'assets/terrain-c20-v0107.webp'});
 ui.emit('stage-2','click');ui.emit('stage-1','click');await ui.settle();
 assert.equal(ui.nodes.get('game-shell').attributes['data-resident-region'],'10');
 await ui.completeDeferredAssets();assert.equal(ui.nodes.get('game-shell').attributes['data-resident-region'],'10');
 assert.equal(ui.nodes.get('chapter-preview-name').textContent,chapters.CHAPTERS[9].name);
 const before=ui.requestedImages.length;ui.emit('stage-3','click');assert.equal(ui.nodes.get('start').disabled,true);await ui.settle();
 assert.equal(ui.requestedImages.length,before+9);assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'27');
 assert.equal(ui.nodes.get('game-shell').attributes['data-resident-region'],'21');ui.tick();
});

test('shared startup failure can retry in place and cannot launch before the successful retry',async()=>{
 const failures=new Set(['assets/lirian_death-v06.webp']);const ui=await host({failedAssets:failures});
 assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.nodes.get('region-status').hidden,false);ui.emit('start','click');assert.equal(ui.state.phase,'camp');await ui.settle();
 failures.clear();ui.emit('region-retry','click');ui.emit('region-retry','click');await ui.settle();
 assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.nodes.get('start').disabled,false);
 ui.emit('start','click');assert.equal(ui.state.phase,'playing');
});

test('next chapter waits for validated assets, duplicate clicks launch once and leaving results cancels intent',async()=>{
 const ui=await host();ui.emit('start','click');ui.state.phase='victory';ui.state.resultDelay=0;ui.state.stageId=10;ui.state.profile.clearedStage=10;ui.state.profile.unlockedStage=11;ui.state.profile.stageProgress[10]=1;ui.tick(0);
 ui.emit('next-stage','click');ui.emit('next-stage','click');assert.equal(ui.state.phase,'victory');await ui.settle();
 assert.equal(ui.state.phase,'playing');assert.equal(ui.state.stageId,11);assert.equal(ui.nodes.get('game-shell').attributes['data-resident-region'],'11');
 assert.equal(ui.requestedImages.filter(path=>path==='assets/terrain-c11-v0107.webp').length,1);
 const canceled=await host({deferredAsset:'assets/terrain-c11-v0107.webp'});canceled.emit('start','click');canceled.state.phase='victory';canceled.state.resultDelay=0;canceled.state.stageId=10;canceled.state.profile.clearedStage=10;canceled.state.profile.unlockedStage=11;canceled.state.profile.stageProgress[10]=1;canceled.tick(0);
 canceled.emit('next-stage','click');canceled.emit('result-camp','click');await canceled.completeDeferredAssets();
 assert.equal(canceled.state.phase,'camp');assert.equal(canceled.nodes.get('game-shell').attributes['data-resident-region'],'1');
});

test('skill workshop shows locked previews, real rank tables, free respec and persistent camp-only loadouts',async()=>{
 const p=game.createProfile(1_000_000);p.level=25;p.skillBook=game.restoreSkillBook(null,25);const ui=await host({saved:p,campaign:true});ui.emit('nav-more','click');ui.emit('nav-skills','click');assert.equal(ui.nodes.get('camp-skills-panel').hidden,false);assert.equal(ui.nodes.get('camp-more-panel').hidden,true);assert.equal(ui.nodes.get('page-title').textContent,'스킬 · 빌드');
 ui.emit('skill-card-draw','click');assert.match(ui.nodes.get('skill-detail-name').textContent,/발도/);assert.match(ui.nodes.get('skill-rank-value-5').textContent,/340%/);assert.match(ui.nodes.get('skill-rank-gate-2').textContent,/28/);assert.equal(ui.nodes.get('skill-upgrade').disabled,true);ui.emit('skill-equip-0','click');assert.equal(ui.state.profile.skillBook.loadout.active[0],'draw');
 ui.emit('skill-card-crescent','click');ui.emit('skill-upgrade','click');assert.equal(ui.state.profile.skillBook.ranks.crescent,1);ui.emit('skill-preset-save-0','click');ui.emit('skill-reset','click');assert.equal(ui.state.profile.skillBook.ranks.crescent,undefined);ui.emit('skill-card-plunge','click');assert.match(ui.nodes.get('skill-detail-unlock').textContent,/35.*잠김/);assert.equal(ui.nodes.get('skill-equip-0').disabled,true);
 ui.nodes.get('skill-auto-mode').value='safe';ui.emit('skill-auto-mode','change');const reloaded=await host({saved:ui.profile(),campaign:true});assert.equal(reloaded.state.profile.skillBook.auto.mode,'safe');assert.equal(reloaded.state.profile.skillBook.loadout.active[0],'draw');assert.equal(reloaded.state.profile.skillBook.presets[0].active[0],'draw');
 ui.emit('page-back','click');ui.emit('start','click');assert.equal(ui.state.phase,'playing');assert.equal(ui.nodes.get('combat-skill-name-0').textContent,'발도');assert.equal(ui.nodes.get('combat-skill-name-2').textContent,'적월난무');assert.equal(ui.nodes.get('combat-skill-2').disabled,false);ui.emit('combat-skill-0','click');assert.ok(ui.state.skillRuntime.cooldowns.draw>0);const book=JSON.stringify(ui.state.profile.skillBook);ui.emit('skill-equip-0','click');ui.emit('skill-upgrade','click');assert.equal(JSON.stringify(ui.state.profile.skillBook),book);
});

test('actual skill controls spend resources, retain cooldown on pause and expose ultimate seconds',async()=>{
 const p=game.createProfile(1_000_000);p.level=20;p.skillBook=game.restoreSkillBook(null,20);const ui=await host({saved:p,campaign:true});ui.emit('start','click');ui.tick();ui.tick();assert.equal(ui.nodes.get('combat-skill-2').disabled,false);ui.emit('combat-skill-2','click');assert.ok(ui.state.skillRuntime.cooldowns.bloodmoon>0);assert.equal(ui.nodes.get('combat-skill-2').disabled,true);assert.equal(ui.nodes.get('combat-skill-state-2').textContent,'60초');ui.emit('pause','click');const cd=ui.state.skillRuntime.cooldowns.bloodmoon;const jobs=ui.state.skillRuntime.jobs.length;ui.run(1);assert.equal(ui.state.skillRuntime.cooldowns.bloodmoon,cd);assert.equal(ui.state.skillRuntime.jobs.length,jobs);ui.emit('resume','click');ui.run(1.5);assert.equal(ui.state.skillRuntime.jobs.length,0);
});

test('all nineteen actual skill buttons render authored body frames and finite VFX without the generic heavy cleave',async()=>{
 for(const d of game.SKILL_CATALOG.filter(d=>d.kind!=='passive'&&d.kind!=='beast')){
  const p=game.createProfile(1_000_000);p.level=50;p.skillBook=game.restoreSkillBook(null,50);p.skillBook.loadout={active:[null,null],passive:[null,null,null],ultimate:[null]};p.skillBook.loadout[d.kind][0]=d.id;
  const ui=await host({manual:true,saved:p,campaign:true,recordGeometry:true});ui.emit('start','click');ui.tick();const s=ui.state;s.spawns=[{id:s.nextId++,type:'bulwark',x:s.player.x+120,y:s.player.y,delay:0,warning:1}];game.advanceGame(s,.001);s.spawns=[];s.barrels=[];s.player.invulnerable=100;
  const e=s.enemies[0];Object.assign(e,{x:s.player.x+120,y:s.player.y,hp:100000,maxHp:100000,speed:0,cooldown:1000,guard:0});s.enemies=[e];ui.tick(0);
  ui.emit('combat-skill-'+(d.kind==='ultimate'?2:0),'click');assert.equal(s.skillRuntime.motion?.id,d.id);ui.calls.length=0;ui.geometry.length=0;
  ui.tick(.03);assert.ok(ui.calls.some(c=>/lirian_/.test(c.image)),d.id+' actor');assert.ok(ui.calls.some(c=>/skill-effects-v051/.test(c.image)),d.id+' bitmap VFX');assert.ok(!s.effects.some(f=>['heavySwing','counterSlash'].includes(f.type)),d.id+' shared cleave');
  ui.run(.9);for(const c of ui.calls)for(const n of [c.a,c.b,c.c,c.d,c.x,c.y,...c.args])if(typeof n==='number')assert.ok(Number.isFinite(n),d.id+' finite canvas');
  ui.emit('pause','click');const before=JSON.stringify(game.skillActorPose(s));ui.run(.2);assert.equal(JSON.stringify(game.skillActorPose(s)),before,d.id+' paused pose');
 }
});

test('ultimate buttons show world effects without video, portraits or full-screen fallback',async()=>{
 for(const id of ['bloodmoon','eclipse','phantoms'])for(const width of [568,844,1280]){
  const p=game.createProfile(1_000_000);p.level=50;p.skillBook=game.restoreSkillBook(null,50);p.skillBook.loadout.ultimate=[id];const ui=await host({saved:p,campaign:true,videoMode:'ready',box:{left:0,top:0,width,height:Math.round(width*9/16)}});assert.equal(ui.mediaVideos.length,0);assert.ok(!ui.requestedImages.some(x=>/skill-(bloodmoon|eclipse|phantoms)-v052/.test(x)));ui.emit('start','click');ui.tick();ui.emit('combat-skill-2','click');ui.calls.length=0;ui.tick(.15);
  assert.equal(ui.state.skillRuntime.ultimatePresentation?.id,id);assert.ok(ui.calls.filter(c=>c.image.includes('skill-effects-v051')).length>=6,id+' layered combat effects');assert.ok(!ui.calls.some(c=>/v053.mp4|skill-(bloodmoon|eclipse|phantoms)-v052/.test(c.image)));ui.emit('pause','click');const time=ui.state.run.time,cd=ui.state.skillRuntime.cooldowns[id];ui.run(.3);assert.equal(ui.state.run.time,time);assert.equal(ui.state.skillRuntime.cooldowns[id],cd);ui.emit('resume','click');assert.ok(game.dash(ui.state,{x:0,y:1}));ui.tick(.05);assert.equal(ui.state.skillRuntime.ultimatePresentation,null);assert.ok(ui.state.skillRuntime.cooldowns[id]>59);
 }
});

test('retired ultimate media failures do not block startup or request any decoder',async()=>{
 const failures=new Set(['assets/skill-bloodmoon-v052.webp','assets/skill-eclipse-v052.webp','assets/skill-phantoms-v052.webp']);const ui=await host({saved:game.createProfile(1_000_000),failedAssets:failures,videoMode:'error'});assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.mediaVideos.length,0);assert.equal(ui.nodes.get('game-shell').attributes['data-loaded-images'],'26');ui.emit('start','click');assert.equal(ui.state.phase,'playing');
});

test('ultimate details and final fractional cooldown show seconds until truly ready',async()=>{
 const p=game.createProfile(1_000_000);p.level=20;p.skillBook=game.restoreSkillBook(null,20);const ui=await host({saved:p,campaign:true});ui.emit('nav-more','click');ui.emit('nav-skills','click');ui.emit('skill-card-bloodmoon','click');assert.match(ui.nodes.get('skill-detail-resource').textContent,/60초/);assert.doesNotMatch(ui.nodes.get('skill-detail-note').textContent,/게이지|명중 \+1/);ui.emit('page-back','click');ui.emit('start','click');ui.tick();const r=ui.state.skillRuntime;r.cooldowns.bloodmoon=.001;r.cooldownKeys.push('bloodmoon');ui.tick(0);assert.equal(ui.nodes.get('combat-skill-state-2').textContent,'1초');assert.equal(ui.nodes.get('combat-skill-2').attributes['data-cooldown'],'true');assert.equal(ui.nodes.get('combat-skill-2').disabled,true);ui.tick(.025);assert.equal(ui.nodes.get('combat-skill-state-2').textContent,'준비');assert.equal(ui.nodes.get('combat-skill-2').attributes['data-cooldown'],'false');assert.equal(ui.nodes.get('combat-skill-2').disabled,false);
});

test('combat keyboard shortcuts leave browser modifier chords alone',async()=>{
 const p=game.createProfile(1_000_000);p.level=50;p.skillBook=game.restoreSkillBook(null,50);const ui=await host({saved:p,campaign:true});ui.emit('start','click');ui.state.auto=true;let prevented=0;
 for(const modifier of ['ctrlKey','metaKey','altKey'])for(const key of ['r','t','w','i'])ui.emit('document','keydown',{key,[modifier]:true,target:ui.nodes.get('arena'),preventDefault(){prevented++;}});
 assert.equal(prevented,0);assert.equal(ui.state.auto,true);assert.deepEqual(ui.state.skillRuntime.cooldowns,{});assert.equal(ui.state.paused,false);
});
test('attack release after pause cannot restart an attack from an old pointer click',async()=>{
 const ui=await host();ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];ui.emit('attack','pointerdown',{pointerId:22,button:0});ui.run(.1);ui.emit('pause','click');ui.emit('resume','click');ui.run(.7);assert.equal(ui.state.player.action,'idle');
 ui.emit('attack','pointerup',{pointerId:22,button:0});ui.emit('attack','click',{detail:1,pointerId:22,button:0});assert.equal(ui.state.player.action,'idle');
 ui.emit('attack','click',{detail:0});assert.equal(ui.state.player.action,'attack','keyboard activation still works');
});
test('one-shot combat controls act on primary press once while the joystick stays owned',async()=>{
 for(const [node,id] of [['combat-skill-0','crescent'],['combat-skill-1','seeking'],['combat-skill-2','bloodmoon'],['dash',null],['thunder',null]]){
  const p=game.createProfile(1_000_000);p.level=50;p.skillBook=game.restoreSkillBook(null,50);p.skillBook.loadout.active=['crescent','seeking'];const ui=await host({manual:true,saved:p,campaign:true});ui.emit('start','click');ui.tick();const s=ui.state;s.spawns=[{id:987,type:'bulwark',x:s.player.x+100,y:s.player.y,delay:0,warning:1}];game.advanceGame(s,.001);s.spawns=[];s.player.invulnerable=100;ui.stick(1,0,1);
  ui.emit(node,'pointerdown',{pointerId:2,pointerType:'touch',button:0});assert.equal(ui.nodes.get('joystick').attributes['data-active'],'true');
  if(id){assert.equal(s.skillRuntime.serial,1,node);assert.ok(s.skillRuntime.cooldowns[id]>0,node);}else assert.equal(s.player.action,node==='dash'?'dash':'heavy',node);
  const stamina=s.player.stamina,serial=s.skillRuntime.serial;ui.emit(node,'click',{detail:1,pointerId:2});assert.equal(s.player.stamina,stamina);assert.equal(s.skillRuntime.serial,serial);
  ui.emit('joystick','pointercancel',{pointerId:1});assert.equal(ui.nodes.get('joystick').attributes['data-active'],'false');
 }
});
test('non-primary mouse presses never start an attack or reserve held auto attacks',async()=>{
 const ui=await host();ui.emit('start','click');ui.state.enemies=[];ui.state.barrels=[];for(const button of [1,2])ui.emit('attack','pointerdown',{button,pointerType:'mouse',pointerId:button+20});ui.run(.8);assert.equal(ui.state.player.action,'idle');assert.equal(ui.state.player.swing,null);
});

test('boss, mission, loot and crafting HUD retain full data together and pause without stale movement',async()=>{
 const p=game.createProfile(1_000_000);p.targetCraftId=game.CRAFTED_CATALOG[1].id;
 for(const box of [{left:0,top:0,width:568,height:320},{left:0,top:0,width:844,height:390},{left:0,top:0,width:667,height:375}]){
  const ui=await host({saved:p,box});ui.emit('start','click');const s=ui.state,boss=s.enemies.find(e=>e.boss);s.run.bossSpawned=true;boss.enraged=true;const name='세계수의 잊혀진 약속을 간직한 오래된 검';s.effects=[{id:1990,type:'bossRage',ttl:1.5,maxTtl:2},{id:1991,type:'loot',name,rarity:3,origin:'monster',ttl:2,maxTtl:2}];ui.tick(0);
  assert.equal(ui.nodes.get('boss-hud').hidden,false);assert.equal(ui.nodes.has('notice'),false);assert.equal(ui.nodes.get('reward-toast').hidden,false);assert.equal(ui.nodes.get('craft-tracker').hidden,false);assert.equal(ui.nodes.get('reward-title').textContent,name);assert.ok(ui.nodes.get('reward-toast').attributes.title.includes(name));assert.match(ui.nodes.get('boss-name').textContent,/격노/);assert.ok(ui.nodes.get('time-left').textContent.length>0);assert.ok(ui.nodes.get('monsters-left').textContent.length>0);
  ui.stick(1,0,3);ui.emit('pause','click');const before=JSON.stringify([s.run.time,s.effects,s.player.x,s.player.y]);ui.run(.5);assert.equal(JSON.stringify([s.run.time,s.effects,s.player.x,s.player.y]),before);assert.equal(ui.nodes.has('notice'),false);ui.emit('resume','click');ui.run(.1);assert.equal(ui.nodes.get('joystick').attributes['data-active'],'false');
 }
});
test('basic action cooldowns display their final fraction until zero',async()=>{
 const ui=await host();ui.emit('start','click');for(const key of ['attackCooldown','dashCooldown','thunderCooldown'])ui.state.player[key]=.001;ui.tick(0);for(const id of ['attack','dash','thunder'])assert.equal(ui.nodes.get(id+'-status').textContent,'0.1초');for(const key of ['attackCooldown','dashCooldown','thunderCooldown'])ui.state.player[key]=0;ui.tick(0);assert.equal(ui.nodes.get('dash-status').textContent,'준비');assert.equal(ui.nodes.get('thunder-status').textContent,'준비');
});

test('held movement and attack survive a skill cast and dodge, then release cleanly at 30 and 60 frames per second',async()=>{
 for(const dt of [1/30,1/60]){
  const p=game.createProfile(1_000_000);p.level=50;p.skillBook=game.restoreSkillBook(null,50);p.skillBook.loadout.active=['dance','crescent'];const ui=await host({manual:true,saved:p,campaign:true});ui.emit('start','click');const s=ui.state;s.spawns=[{id:1987,type:'bulwark',x:s.player.x+100,y:s.player.y,delay:0,warning:1}];game.advanceGame(s,.001);s.spawns=[];s.barrels=[];s.player.invulnerable=100;Object.assign(s.enemies[0],{hp:100000,maxHp:100000,speed:0,cooldown:999,guard:0,guardMax:0});
  const run=seconds=>{for(let i=0;i<Math.ceil(seconds/dt);i++)ui.tick(dt);};ui.stick(1,0,1);const x=s.player.x;ui.emit('combat-skill-0','pointerdown',{pointerId:3,pointerType:'touch',button:0});ui.emit('attack','pointerdown',{pointerId:2,pointerType:'touch',button:0});assert.equal(s.skillRuntime.lastCast.id,'dance');run(1.5);assert.ok(s.player.x>x);assert.equal(s.player.action,'attack');const y=s.player.y;ui.emit('dash','pointerdown',{pointerId:3,pointerType:'touch',button:0});assert.equal(s.player.action,'dash');run(.5);assert.ok(s.player.x>x);assert.ok(Math.abs(s.player.y-y)<1e-6);assert.equal(ui.nodes.get('joystick').attributes['data-active'],'true');
  ui.emit('pause','click');ui.emit('resume','click');ui.emit('attack','pointerup',{pointerId:2});ui.emit('attack','click',{detail:1,pointerId:2});run(1);const stopped=s.player.x;run(.2);assert.equal(s.player.x,stopped);assert.equal(s.player.action,'idle');assert.equal(ui.nodes.get('joystick').attributes['data-active'],'false');
 }
});


test('live hostile shots and contact accents remain above ultimate skill images without area warnings',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const s=ui.state,p=s.player;s.barrels=[];
 s.enemies=[{...s.enemies[0],id:900,type:'bulwark',species:undefined,boss:false,dead:false,radius:90,chargeEvery:0,x:p.x+140,y:p.y,action:'windup',actionTime:.5,windup:1,targetX:p.x,targetY:p.y}];
 s.projectiles=[{id:901,x:p.x+60,y:p.y+30,vx:-100,vy:0,ttl:1,friendly:false}];
 s.effects=[{id:902,type:'impact',x:p.x+45,y:p.y-40,nx:1,ny:0,ttl:.12,maxTtl:.17},{id:903,type:'skillImpact',skillId:'bloodmoon',x:p.x,y:p.y,radius:260,n:{x:1,y:0},index:3,ttl:.2,maxTtl:.3}];
 s.paused=true;ui.geometry.length=0;ui.tick(0);
 const geo=ui.geometry,atlas=geo.findLastIndex(c=>c.kind==='drawImage'&&c.args[0].includes('skill-effects-v051'));
 const shot=geo.findIndex(c=>c.kind==='stroke'&&c.strokeStyle==='#ffc17a');assert.ok(atlas>=0&&shot>atlas);
 const contact=geo.findIndex((c,i)=>i>atlas&&c.kind==='stroke'&&c.strokeStyle==='#f7dfe9');assert.ok(contact>atlas&&contact<shot);
 assert.equal(geo.some(c=>c.kind==='stroke'&&c.lineWidth===7&&c.strokeStyle==='#25101d'),false);
 const before=JSON.stringify([s.enemies,s.projectiles,s.effects]);ui.tick(0);assert.equal(JSON.stringify([s.enemies,s.projectiles,s.effects]),before);
});

test('skill cast sounds retain skill identity, are consumed once and do not replay after pause',async()=>{
 const ui=await host();ui.emit('start','click');const s=ui.state;s.enemies=[];s.barrels=[];
 const add=(id,type,skillId)=>s.effects.push({id,type,skillId,x:s.player.x,y:s.player.y,radius:100,ttl:.5,maxTtl:.5});
 add(10001,'skillCast','eclipse');add(10002,'skillMark','mark');ui.tick(0);
 assert.deepEqual(ui.audioDetails.filter(e=>e.type==='skillCast').map(e=>e.details.skillId),['eclipse','mark']);
 ui.tick(0);assert.equal(ui.audioDetails.filter(e=>e.type==='skillCast').length,2);
 ui.emit('pause','click');add(10003,'skillCast','phantoms');ui.tick(0);ui.emit('resume','click');ui.tick(0);assert.equal(ui.audioDetails.filter(e=>e.type==='skillCast').length,2);
});

test('crowded contact feedback and guard sounds are bounded without replay on the next frame',async()=>{
 const ui=await host({recordGeometry:true});ui.emit('start','click');const s=ui.state;s.enemies=[];s.barrels=[];s.effects=[];
 for(let i=0;i<40;i++){s.effects.push({id:10000+i*2,type:'impact',guarded:true,x:s.player.x,y:s.player.y-40,ttl:.17,maxTtl:.17});s.effects.push({id:10001+i*2,type:'guardHit',x:s.player.x,y:s.player.y,ttl:.2,maxTtl:.2});}
 ui.geometry.length=0;ui.tick(0);assert.equal(ui.audioEvents.filter(t=>t==='guardHit').length,2);
 assert.equal(ui.geometry.filter(c=>c.kind==='stroke'&&c.strokeStyle==='#b4cee5'&&c.lineWidth===2).length,20);
 ui.tick(0);assert.equal(ui.audioEvents.filter(t=>t==='guardHit').length,2);
});

test('boss reward notice uses the actual chapter and difficulty payout receipt',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];p.bossMastery=[2,2,2];p.difficultyProgress=[[9,9,9],[9,9,9]];widen(p);const gold=Math.round(game.STAGES[20].reward*2),cores=game.bossCores(21,2);
 const ui=await host({saved:p,campaign:true});ui.emit('nav-hunt','click');ui.emit('camp-tactics-open','click');ui.emit('hunt-mode-2','click');ui.emit('replay-prepare','click');ui.emit('run-stage-10','click');ui.emit('camp-map-start','click');
 const s=ui.state;assert.equal(s.difficulty,2);assert.equal(s.stageId,21);s.enemies=[];s.barrels=[];s.run.wave=1;s.run.bossSpawned=true;s.spawns=[{id:900,type:'bulwark',boss:true,x:s.player.x+100,y:s.player.y,delay:0,warning:1,locked:true}];game.advanceGame(s,.001);
 const boss=s.enemies[0];s.projectiles=[{id:901,x:boss.x,y:boss.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true}];game.advanceGame(s,.025);assert.equal(s.phase,'playing');assert.ok(s.settlement);ui.tick(0);assert.equal(s.phase,'victory');assert.equal(ui.nodes.get('hunt-stage').textContent,game.STAGES[20].name+' · 21-10 스테이지');assert.equal(ui.nodes.get('stage-complete').hidden,false);assert.equal(ui.nodes.get('stage-complete').textContent,'21-10 스테이지 완료');
 const reward=s.effects.findLast(f=>f.type==='loot'&&f.origin==='stage');s.effects=[reward];ui.tick(0);
 assert.match(ui.nodes.get('reward-meta').textContent,new RegExp('골드 \\+'+gold+'.*핵 \\+'+cores));assert.doesNotMatch(ui.nodes.get('reward-meta').textContent,/체력 회복/);
 assert.ok(ui.nodes.get('reward-toast').attributes.title.includes(String(gold)));assert.equal(ui.nodes.get('reward-brief').textContent,'골드 +'+gold+' · 핵 +'+cores);assert.equal(ui.nodes.get('reward-brief').hidden,false);
});

test('level-up results show real XP and unlocked ultimate, then open the workshop without auto-equipping',async()=>{
 const p=game.createProfile(1_000_000);p.level=19;p.xp=game.xpNeeded(19)-1;p.skillBook=game.restoreSkillBook(null,19);
 const ui=await host({saved:p,campaign:true});ui.emit('hub-growth','click');assert.match(ui.nodes.get('growth-next-skill').textContent,/Lv.20.*적월난무.*궁극기 슬롯/);ui.emit('page-back','click');ui.emit('start','click');
 const s=ui.state;s.enemies=[];s.spawns=[];s.barrels=[];s.run.flow='break';s.run.timer=999;s.pickups=[{id:900,x:s.player.x,y:s.player.y,gold:0,xp:1,cores:0}];ui.tick(.025);assert.equal(s.profile.level,20);assert.equal(s.run.startLevel,19);assert.equal(s.profile.skillBook.loadout.ultimate[0],null);
 s.player.invulnerable=0;s.player.hp=1;s.projectiles=[{id:901,x:s.player.x,y:s.player.y,vx:1,vy:0,damage:999,ttl:1,friendly:false}];ui.tick(.025);ui.run(.7);
 assert.equal(s.phase,'defeat');assert.equal(ui.nodes.get('result-content').hidden,false);assert.equal(ui.nodes.get('result-xp').textContent,'경험치 +1');assert.equal(ui.nodes.get('result-level').textContent,'Lv.19 → Lv.20');assert.match(ui.nodes.get('result-unlocks').textContent,/적월난무.*궁극기 슬롯/);assert.equal(ui.nodes.get('result-skills').hidden,false);
 ui.emit('result-skills','click');assert.equal(s.phase,'camp');assert.equal(ui.nodes.get('camp-skills-panel').hidden,false);assert.equal(ui.nodes.get('skill-detail-name').textContent,'적월난무');assert.equal(s.profile.skillBook.loadout.ultimate[0],null);
 ui.emit('skill-equip-0','click');assert.equal(s.profile.skillBook.loadout.ultimate[0],'bloodmoon');const reloaded=await host({saved:ui.profile()});assert.equal(reloaded.state.profile.level,20);assert.equal(reloaded.state.profile.skillBook.loadout.ultimate[0],'bloodmoon');
});

test('max-level growth caps XP, fills the bar and explains the final awakening without changing builds',async()=>{
 // Lv.50 still unlocks the awakening; the level cap itself is MAX_LEVEL (100 since Alpha 0.105, 200 since 0.118).
 const p=game.createProfile(1_000_000);p.level=49;p.xp=game.xpNeeded(49)-1;p.skillBook=game.restoreSkillBook(null,49);const ui=await host({saved:p,campaign:true});ui.emit('start','click');const s=ui.state,book=JSON.stringify(s.profile.skillBook);
 s.enemies=[];s.spawns=[];s.barrels=[];s.run.flow='break';s.run.timer=999;s.pickups=[{id:900,x:s.player.x,y:s.player.y,gold:0,xp:10000,cores:0}];ui.tick(.025);
 assert.ok(s.profile.level>=50&&s.profile.level<game.MAX_LEVEL);assert.notEqual(ui.nodes.get('xp-text').textContent,'최고 레벨');assert.equal(JSON.stringify(s.profile.skillBook),book);
 s.phase='victory';s.resultDelay=0;ui.tick(0);assert.equal(ui.nodes.get('result-unlocks').textContent,'새 해금 · 적월난무 각성');assert.equal(ui.nodes.get('result-xp').textContent,'경험치 +10000');ui.emit('result-camp','click');ui.emit('hub-growth','click');assert.equal(ui.nodes.get('growth-next-skill').textContent,'모든 검술과 슬롯 해금 완료');
 const q=game.createProfile(1_000_000),top=game.MAX_LEVEL-1;q.level=top;q.xp=game.xpNeeded(top)-1;q.skillBook=game.restoreSkillBook(null,top);const capped=await host({saved:q,campaign:true});capped.emit('start','click');const c=capped.state,cappedBook=JSON.stringify(c.profile.skillBook);
 c.enemies=[];c.spawns=[];c.barrels=[];c.run.flow='break';c.run.timer=999;c.pickups=[{id:900,x:c.player.x,y:c.player.y,gold:0,xp:10000,cores:0}];capped.tick(.025);
 assert.equal(c.profile.level,game.MAX_LEVEL);assert.equal(c.profile.xp,0);assert.equal(capped.nodes.get('xp-fill').style.width,'100%');assert.equal(capped.nodes.get('xp-text').textContent,'최고 레벨');assert.equal(JSON.stringify(c.profile.skillBook),cappedBook);
});
test('growth panel and result receipt show unscaled XP after existing XP gear modifiers',async()=>{
 const p=game.createProfile(1_000_000);p.level=5;p.skillBook=game.restoreSkillBook(null,5);const ui=await host({saved:p,campaign:true});ui.emit('hub-growth','click');assert.match(ui.nodes.get('growth-xp-rate').textContent,/다음 레벨까지 경험치 \d+/);assert.doesNotMatch(ui.nodes.get('growth-xp-rate').textContent,/배/);ui.emit('page-back','click');ui.emit('start','click');const s=ui.state;
 s.enemies=[];s.spawns=[];s.barrels=[];s.run.flow='break';s.run.timer=999;s.pickups=[{id:900,x:s.player.x,y:s.player.y,gold:0,xp:9,cores:0}];ui.tick(.025);
 assert.equal(s.run.xp,9);assert.equal(s.run.xpBonus,0);assert.equal(s.profile.xp,9);s.phase='victory';s.resultDelay=0;ui.tick(0);assert.equal(ui.nodes.get('result-xp').textContent,'경험치 +9');assert.match(ui.nodes.get('result-xp').attributes.title,/기본 경험치 9.*성장 보너스 \+0/);
});

test('scouting notice reports credited XP when an offline grant crosses level twenty',async()=>{
 const p=game.createProfile(1_000_000-5*60000);p.level=19;p.xp=game.xpNeeded(19)-1;p.clearedStage=1;p.unlockedStage=2;p.stageProgress=[10,0,0];p.skillBook=game.restoreSkillBook(null,19);const ui=await host({saved:p});
 assert.equal(ui.state.profile.level,20);assert.equal(ui.state.profile.xp,4);assert.match(ui.nodes.get('offline-note').textContent,/경험치 5/);ui.emit('hub-growth','click');assert.match(ui.nodes.get('growth-xp-rate').textContent,new RegExp('다음 레벨까지 경험치 '+(game.xpNeeded(20)-4)));assert.equal(ui.state.profile.skillBook.loadout.ultimate[0],null);
 const again=await host({saved:ui.profile()});assert.equal(again.state.profile.xp,4);assert.doesNotMatch(again.nodes.get('offline-note').textContent,/정찰 보상:/);
});

test('legacy five-stage saves reopen the proportional checkpoint and both maps expose ten stages',async()=>{
 const p=game.createProfile(1_000_000);p.version=7;p.gold=73;p.stageProgress=[4,0,0];const ui=await host({saved:p,campaign:true});
 assert.equal(ui.profile().version,16);assert.deepEqual(ui.profile().stageProgress,game.STAGES.map((_,i)=>i?0:8));assert.equal(ui.profile().gold,73);assert.equal(ui.storage.has(KEY+':recovery'),false);assert.equal(ui.nodes.get('hub-progress-text').textContent,'8 / 10');
 for(let n=1;n<=10;n++){assert.equal(ui.nodes.get('run-stage-'+n).disabled,n===10);assert.equal(ui.nodes.get('dashboard-stage-'+n).disabled,n===10);assert.equal(ui.nodes.get('dashboard-stage-number-'+n).textContent,'1–'+n);}
 ui.emit('run-stage-10','click');ui.emit('dashboard-stage-10','click');assert.equal(ui.nodes.get('run-stage-9').attributes['aria-pressed'],'true');
 ui.emit('start','click');assert.equal(ui.state.run.stage,9);assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('monsters-left').textContent,'116');assert.ok(ui.state.spawns.every(q=>!q.boss));
 const restored=await host({saved:ui.profile()});assert.deepEqual(restored.profile().stageProgress,game.STAGES.map((_,i)=>i?0:8));
});
test('ninth checkpoint transitions directly to a single-boss final with matching HUD and retry',async()=>{
 const p=game.createProfile(1_000_000);p.stageProgress[0]=8;const ui=await host({saved:p,campaign:true});ui.emit('start','click');const s=ui.state;
 // Exercise the checkpoint commit and stage transition after the previous wave is resolved.
 s.spawns=[];s.enemies=[];s.run.wave=3;s.run.waveKills=s.run.waveQuota;ui.tick();assert.equal(s.run.flow,'combat');assert.equal(ui.profile().stageProgress[0],9);
 assert.equal(ui.nodes.get('hunt-stage').textContent,game.STAGES[0].name+' · 1-10 스테이지');assert.equal(ui.nodes.get('stage-complete').hidden,false);assert.equal(ui.nodes.get('stage-complete').textContent,'1-9 스테이지 완료');assert.equal(s.run.stage,10);assert.equal(s.run.wave,1);assert.equal(s.spawns.length,0);assert.equal(s.enemies.length,1);assert.ok(s.enemies[0].boss);assert.equal(s.barrels.length,0);assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('monsters-left').textContent,'1');assert.equal(ui.nodes.has('notice'),false);for(const id of ['notice','notice-mark','notice-kicker','notice-title','notice-detail','notice-progress'])assert.equal(ui.nodes.has(id),false);
 ui.emit('pause','click');assert.equal(ui.nodes.get('time-left').textContent,'01:00');assert.equal(ui.nodes.get('monsters-left').textContent,'1');ui.emit('resume','click');s.phase='defeat';s.player.action='death';s.player.actionTime=10;ui.tick(0);ui.emit('next-stage','click');assert.equal(s.phase,'playing');assert.equal(s.run.stage,10);assert.equal(s.spawns.length,1);assert.ok(s.spawns[0].boss);assert.equal(s.barrels.length,0);
});

test('chapter dossiers include six normal species and one boss with real unlock notes and atlas thumbnails',async()=>{
 const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;widen(p);openRegions(p);const ui=await host({saved:p});
 for(const c of chapters.CHAPTERS.filter(c=>c.number===1)){pickChapter(ui,c.id);await ui.settle();for(const [i,id]of [...c.roster,c.bossSpecies].entries()){
  assert.equal(ui.nodes.get('roster-name-'+i).textContent,chapters.MONSTERS[id].name);assert.match(ui.nodes.get('roster-art-'+i).atlasImage.src,/monsters-/);assert.match(ui.nodes.get('roster-detail-'+i).textContent,new RegExp('STAGE '+(id===c.bossSpecies?'10':c.stages.map((l,n)=>Object.values(l).includes(id)?n+1:0).filter(Boolean).join('·'))));
 }}
});
test('a missing supplemental monster atlas blocks entry, while a real stage4 renders the new identities after retry',async()=>{
 const p=game.createProfile(1_000_000);p.stageProgress[0]=9;const failures=new Set(['assets/monsters-forest-v065.webp']),ui=await host({saved:p,campaign:true,failedAssets:failures});
 assert.equal(ui.nodes.get('start').disabled,true);ui.emit('start','click');assert.equal(ui.state.phase,'camp');assert.equal(ui.profile().stageProgress[0],9);assert.deepEqual(ui.profile().inventory,p.inventory);
 failures.clear();ui.emit('region-retry','click');await ui.settle();assert.equal(ui.nodes.get('start').disabled,false);ui.emit('run-stage-4','click');ui.emit('start','click');ui.state.player.invulnerable=100;ui.run(3.5);
 // Stage 4 fields its own three species (Alpha 0.107); each is drawn from its atlas.
 const seen=new Set(ui.state.enemies.map(e=>e.species)),lineup=Object.values(chapters.CHAPTERS[0].stages[3]);assert.ok(lineup.every(id=>seen.has(id)));for(const id of lineup){const image='assets/'+manifest.clips[manifest.directions[id].walk.s].image;assert.ok(ui.calls.some(c=>c.image===image),id);}assert.equal(ui.state.enemies.some(e=>e.boss),false);
 ui.emit('pause','click');const combat=()=>JSON.stringify({...ui.state,profile:null}),snapshot=combat();ui.run(2);assert.equal(combat(),snapshot);
});


test('countdown ring, numeric rounding and remaining roster gauge agree across warning thresholds',async()=>{
 const ui=await host({campaign:true});ui.emit('start','click');const s=ui.state;
 for(const [seconds,text,urgency]of [[60,'01:00','normal'],[30.1,'00:31','normal'],[30,'00:30','warning'],[10,'00:10','critical'],[.01,'00:01','critical'],[0,'00:00','critical']]){
  s.run.timeRemaining=seconds;ui.tick(0);assert.equal(ui.nodes.get('time-left').textContent,text);assert.equal(ui.nodes.get('hunt-clock').attributes['data-urgency'],urgency);assert.equal(ui.nodes.get('hunt-clock').attributes['aria-label'],'남은 시간 '+text);assert.ok(Math.abs(Number(ui.nodes.get('hunt-clock-ring').style.strokeDashoffset)-(1-seconds/60)*100)<1e-8);
 }
 s.run.stageKills=8;ui.tick(0);assert.equal(ui.nodes.get('monsters-left').textContent,'48');assert.equal(ui.nodes.get('monsters-meter').attributes['aria-valuenow'],'48');assert.equal(ui.nodes.get('monsters-meter').attributes['aria-valuemax'],'56');assert.ok(Math.abs(parseFloat(ui.nodes.get('monsters-fill').style.width)-48/56*100)<1e-8);
});
test('time over ends held input, opens truthful result immediately and retries the same hunt at full time',async()=>{
 const p=game.createProfile(1_000_000);p.stageProgress[0]=8;const ui=await host({saved:p,campaign:true});ui.emit('start','click');const s=ui.state;ui.stick(1,0);ui.emit('attack','pointerdown',{pointerId:2});s.run.timeRemaining=.03;const hp=s.player.hp;ui.tick(.1);
 assert.equal(s.phase,'defeat');assert.equal(s.run.timedOut,true);assert.ok(s.player.hp>0);assert.equal(ui.nodes.get('overlay').attributes['data-panel'],'result');assert.equal(ui.nodes.get('modal-title').textContent,'제한 시간이 끝났어.');assert.match(ui.nodes.get('modal-description').textContent,/남은 몬스터 116마리/);assert.match(ui.nodes.get('result-note').textContent,/01:00/);assert.equal(ui.nodes.get('attack').disabled,true);assert.equal(ui.nodes.get('joystick').disabled,true);
 ui.emit('next-stage','click');assert.equal(s.phase,'playing');assert.equal(s.run.stage,9);assert.equal(s.run.timedOut,false);assert.equal(s.run.timeRemaining,60);assert.equal(ui.nodes.get('monsters-left').textContent,'116');ui.tick(.05);assert.equal(s.player.moving,false);assert.equal(s.player.action,'idle');assert.equal(s.player.hp,hp);
});

test('real app draws region-local monster attack bitmaps at contact, freezes them on pause and releases them on defeat',async()=>{
 // One chapter per attack-effect sheet (forest, fire, frost, ruins), using a caster from that chapter.
 for(const chapter of [1,11,16,21]){const species=chapters.CHAPTERS[chapter-1].roster.find(id=>chapters.MONSTERS[id].role==='spitter');
  const p=game.createProfile(1_000_000);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];widen(p);
  const ui=await host({saved:p,campaign:true,recordGeometry:true});ui.emit('nav-hunt','click');pickChapter(ui,chapter);await ui.settle();ui.emit('run-stage-9','click');ui.emit('start','click');const s=ui.state;assert.equal(s.phase,'playing');ui.tick(.05);
  s.enemies=[];s.barrels=[];s.spawns=[{id:900,type:'spitter',species,x:s.player.x+150,y:s.player.y,delay:0}];game.advanceGame(s,.001);s.player.invulnerable=999;const e=s.enemies[0];Object.assign(e,{action:'windup',actionTime:0,windup:.075,targetX:s.player.x,targetY:s.player.y});
  const file='assets/'+manifest.monsterEffects[game.STAGES[chapter-1].effects].image.replace(/\.webp$/,'.png');ui.calls.length=0;ui.tick(0);assert.equal(ui.calls.filter(c=>c.image===file).length,0);ui.run(.1);assert.ok(s.projectiles.length>0);assert.ok(ui.calls.some(c=>c.image===file));
  ui.emit('pause','click');ui.calls.length=0;ui.tick(0);const before=ui.calls.filter(c=>c.image===file).map(c=>c.args);ui.calls.length=0;ui.run(.2);const after=ui.calls.filter(c=>c.image===file).slice(-before.length).map(c=>c.args);assert.deepEqual(after,before);ui.emit('resume','click');
  // A drawImage call alone did not catch the old orange shot painted on top.
  s.effects=[];s.projectiles=s.projectiles.slice(0,1);const q=s.projectiles[0];Object.assign(q,{x:s.player.x+100,y:s.player.y-80,vx:200,vy:0,ttl:2});ui.geometry.length=0;ui.calls.length=0;ui.tick(0);
  assert.ok(ui.calls.some(c=>c.image===file));assert.equal(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#ffc17a'),false);
  q.friendly=true;ui.geometry.length=0;ui.calls.length=0;ui.tick(0);assert.equal(ui.calls.some(c=>c.image===file),false);assert.ok(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#b6f9dc'));
  q.friendly=false;q.fxChapter=99;ui.geometry.length=0;ui.tick(0);assert.ok(ui.geometry.some(c=>c.kind==='stroke'&&c.strokeStyle==='#ffc17a'),'invalid bitmap must retain the visible fallback');
  s.effects=[];s.enemies=[];ui.calls.length=0;s.phase='defeat';ui.tick(0);assert.equal(ui.calls.filter(c=>c.image===file).length,0);
 }
});
test('missing monster effect images block entry without changing earned gear or silently drawing replacements',async()=>{
 const p=game.createProfile(1_000_000);p.gold=73;const ui=await host({saved:p,failedAssets:'assets/monster-effects-forest-v069.webp'});assert.equal(ui.nodes.get('start').disabled,true);assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.nodes.get('game-shell').attributes['data-region-status'],'error');ui.emit('start','click');await ui.settle();assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.gold,73);
});


test('generated drop atlas selects real rarity frames, crossfades upright and expires without paying or rerolling',async()=>{
 const ui=await host();ui.emit('start','click');const s=ui.state;s.enemies=[];s.barrels=[];s.spawns=[];s.pickups=[];s.paused=true;
 const a=manifest.pickupEffects,w=a.width/4,h=a.height/4,path='assets/'+a.image.replace(/\.webp$/,'.png'),before=JSON.stringify(s.profile),rng=[s.rng,s.lootRng,s.materialRng],loads=ui.requestedImages.length;
 for(const [rarity,perfect,row]of [[0,false,0],[3,false,1],[4,false,2],[6,false,2],[2,true,3]])for(const age of [.05,.36,.61,.86]){
  const duration=game.gearDropDuration({rarity,perfect});s.effects=[{id:9000,type:'gearDrop',source:'elite',item:{rarity,perfect},x:s.player.x,y:s.player.y,rarity,ttl:2-age*duration,maxTtl:2}];ui.calls.length=0;ui.tick(0);
  const calls=ui.calls.filter(c=>c.image===path),frame=Math.min(3,Math.floor(age*4));assert.ok(calls.length>=1&&calls.length<=2);assert.equal(calls[0].args[0],frame*w);assert.ok(calls.every(c=>c.args[1]===row*h&&c.args[2]===w&&c.args[3]===h&&c.composite==='lighter'));assert.ok(calls.every(c=>Math.abs(c.a-c.d)<1e-9));
 }
 assert.equal(JSON.stringify(s.profile),before);assert.deepEqual([s.rng,s.lootRng,s.materialRng],rng);assert.equal(ui.requestedImages.length,loads);
 const frozen=JSON.stringify(s.effects);ui.run(.5);assert.equal(JSON.stringify(s.effects),frozen);s.paused=false;ui.run(1.1);ui.calls.length=0;ui.tick(0);assert.equal(ui.calls.some(c=>c.image===path),false);
});
test('reduced motion uses one small static image frame throughout the drop flash lifetime',async()=>{
 const ui=await host({motionReduced:true});ui.emit('start','click');const s=ui.state;s.enemies=[];s.barrels=[];s.spawns=[];s.pickups=[];s.paused=true;
 for(const ttl of [.95,.5,.15]){s.effects=[{id:9000,type:'gearDrop',source:'elite',item:{rarity:5,perfect:true},x:s.player.x,y:s.player.y,rarity:5,ttl:1+ttl,maxTtl:2}];ui.calls.length=0;ui.tick(0);const calls=ui.calls.filter(c=>c.image.includes('loot-pickup-v077'));assert.equal(calls.length,1);assert.equal(calls[0].args[0],manifest.pickupEffects.width/4);assert.equal(calls[0].args[6],150);assert.equal(calls[0].args[7],150);}
});
test('missing pickup image and invalid dimensions block entry, keep earned resources and support a clean retry',async()=>{
 const p=game.createProfile(1_000_000);p.gold=73;const failed=new Set(['assets/'+manifest.pickupEffects.image]);const ui=await host({saved:p,failedAssets:failed});assert.equal(ui.nodes.get('start').disabled,true);ui.emit('start','click');assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.gold,73);
 failed.clear();ui.emit('region-retry','click');await ui.settle();assert.equal(ui.nodes.get('loading').hidden,true);assert.equal(ui.nodes.get('start').disabled,false);assert.equal(ui.state.profile.gold,73);
 const bad=await host({saved:p,invalidPickup:true});assert.equal(bad.nodes.get('start').disabled,true);assert.equal(bad.nodes.get('region-status').hidden,false);assert.equal(bad.state.profile.gold,73);
});


test('real monster gear plays at its drop position before collection and never restarts the image on pickup',async()=>{
 const ui=await host({campaign:true});ui.emit('start','click');const s=ui.state,p=s.player;s.lootRates={normal:1,elite:1,stage:1,boss:1};s.enemies=[];s.spawns=[];s.barrels=[];s.run.waveQuota=1000;p.invulnerable=999;
 s.spawns=[{id:9900,type:'bulwark',species:'forest_orc',elite:true,x:p.x+240,y:p.y+60,delay:0,warning:0,locked:true}];game.advanceGame(s,.001);const e=s.enemies[0];s.projectiles.push({id:9901,x:e.x,y:e.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});ui.calls.length=0;ui.tick(.025);
 const flash=s.effects.find(f=>f.type==='gearDrop'),item=flash.item;assert.ok(s.profile.pendingLoot.includes(item));assert.ok(!s.profile.inventory.includes(item));assert.equal(s.run.items,0);
 const frames=()=>ui.calls.filter(c=>c.image.includes('loot-pickup-v077'));assert.ok(frames().length>0);
 const verifyPosition=()=>{for(const c of frames()){near(c.args[4]+c.args[6]*manifest.pickupEffects.pivotX,flash.x);near(c.args[5]+c.args[7]*manifest.pickupEffects.pivotY,flash.y);}};verifyPosition();
 p.x-=30;ui.calls.length=0;ui.tick(0);assert.ok(frames().length>0);verifyPosition();assert.notEqual(flash.x,p.x);
 ui.run(1.1);ui.calls.length=0;ui.tick(0);assert.equal(frames().length,0);assert.ok(s.profile.pendingLoot.includes(item));
 for(const d of s.pickups){d.x=p.x;d.y=p.y;}ui.run(.1);assert.ok(s.profile.inventory.includes(item));assert.ok(s.effects.some(f=>f.type==='lootPickup'));ui.calls.length=0;ui.tick(0);assert.equal(frames().length,0);assert.equal(s.run.items,1);assert.equal(ui.nodes.has('reward-icon'),false);
});


test('illustrated home mirrors saved XP and selection while its new shortcuts keep profile ownership',async()=>{
 const p=game.createProfile(1_000_000);p.level=19;p.xp=Math.floor(game.xpNeeded(19)*.63);p.clearedStage=3;p.unlockedStage=3;p.stageProgress=[10,10,10];widen(p);
 const ui=await host({saved:p,campaign:true}),before=ui.profile();
 const percent=Math.floor(before.xp/game.xpNeeded(before.level)*100);
 assert.equal(ui.nodes.get('home-xp-label').textContent,percent+'%');assert.equal(ui.nodes.get('home-xp').attributes['aria-valuenow'],String(percent));
 ui.emit('home-nav-hunt','click');assert.equal(ui.nodes.get('camp-map-panel').hidden,false);pickChapter(ui,11);ui.emit('run-stage-3','click');ui.emit('nav-home','click');
 assert.equal(ui.nodes.get('home-route-title').textContent,game.STAGES[10].name);assert.match(ui.nodes.get('home-route-stage').textContent,/STAGE 03/);
 ui.emit('home-nav-growth','click');assert.equal(ui.nodes.get('camp-growth-panel').hidden,false);ui.emit('nav-home','click');
 ui.emit('home-nav-codex','click');assert.equal(ui.nodes.get('codex-content').hidden,false);ui.emit('nav-home','click');
 ui.emit('home-settings','click');assert.equal(ui.nodes.get('camp-more-panel').hidden,false);ui.emit('nav-home','click');
 ui.emit('home-intel','click');assert.equal(ui.nodes.get('camp-tactics-panel').hidden,false);ui.emit('nav-home','click');
 assert.deepEqual(ui.profile(),before);assert.equal(ui.nodes.get('home-route-title').textContent,game.STAGES[10].name);
 await ui.settle();ui.emit('start','click');await ui.settle();assert.equal(ui.state.phase,'playing');assert.equal(ui.state.stageId,11);assert.equal(ui.state.run.stage,3);
});


test('mobile lobby shortcuts preserve profile ownership and reject navigation during a hunt',async()=>{
 const ui=await host({saved:bagFixture()}),before=ui.profile();
 for(const [id,panel]of [['lobby-character','equipment'],['lobby-equipment','equipment'],['lobby-hero','equipment'],['lobby-bag','inventory'],['lobby-craft','craft']]){
  ui.emit(id,'click');assert.equal(ui.nodes.get('game-shell').attributes['data-panel'],panel);ui.emit('nav-home','click');
 }
 ui.emit('lobby-skills','click');assert.equal(ui.nodes.get('camp-skills-panel').hidden,false);ui.emit('nav-home','click');
 ui.emit('lobby-missions','click');assert.equal(ui.nodes.get('camp-map-panel').hidden,false);ui.emit('nav-home','click');
 for(const id of ['lobby-events','lobby-message']){ui.emit(id,'click');assert.equal(ui.nodes.get('camp-tactics-panel').hidden,false);ui.emit('nav-home','click');}
 assert.deepEqual(ui.profile(),before);ui.emit('start','click');const run=ui.state.run;
 for(const id of ['lobby-character','lobby-bag','lobby-skills','lobby-craft','lobby-missions','lobby-events','lobby-message'])ui.emit(id,'click');
 assert.equal(ui.state.phase,'playing');assert.equal(ui.state.run,run);assert.equal(ui.nodes.get('camp-content').hidden,true);assert.equal(ui.nodes.get('lobby-energy-value').textContent,'100/100');
});

test('stage B five presets save real gear and skill settings, expose two-tap entry selection and restore without a false recovery warning',async()=>{
 const p=bagFixture();p.version=11;p.level=30;p.gold=100000;const ui=await host({saved:p,campaign:true});assert.equal(ui.storage.has(KEY+':recovery'),false);assert.equal(ui.profile().version,16);ui.emit('lobby-equipment','click');ui.emit('loadout-build-open','click');ui.emit('build-tab-4','click');ui.nodes.get('build-name-4').value='실험 보스';ui.emit('build-name-4','input');ui.document.activeElement=ui.nodes.get('build-save-4');ui.tick(0);ui.emit('build-save-4','click');
 const stored=ui.profile();assert.equal(stored.savedBuilds.length,5);assert.equal(stored.savedBuilds[4].name,'실험 보스');assert.deepEqual(stored.savedBuilds[4].skill.loadout,stored.skillBook.loadout);assert.equal(ui.nodes.get('build-card-4').hidden,false);assert.equal(ui.nodes.get('build-card-0').hidden,true);
 ui.emit('nav-home','click');ui.emit('hub-route','click');ui.nodes.get('entry-build').value='4';ui.emit('entry-build','change');assert.equal(ui.profile().selectedBuild,4);assert.equal(ui.nodes.get('entry-build-option-4').disabled,false);const restored=await host({saved:ui.profile()});assert.equal(restored.profile().savedBuilds[4].name,'실험 보스');assert.equal(restored.storage.has(KEY+':recovery'),false);
});
test('stage B inscription UI charges one atomic cost and persists the selected optional effect',async()=>{
 const p=bagFixture();p.gold=3000;p.materials.boneIron=24;p.materials.crystal=4;const ui=await host({saved:p});ui.emit('lobby-equipment','click');ui.emit('loadout-build-open','click');ui.nodes.get('inscription-item').value='1';ui.nodes.get('inscription-effect').value='leech';ui.emit('inscription-effect','change');assert.equal(ui.nodes.get('inscription-apply').disabled,false);ui.emit('inscription-apply','click');assert.equal(ui.profile().gold,1500);assert.equal(ui.profile().inventory.find(i=>i.id===1).inscription,'leech');assert.match(ui.nodes.get('inscription-description').textContent,/3%/);ui.emit('inscription-apply','click');assert.equal(ui.profile().gold,0);ui.emit('inscription-apply','click');assert.equal(ui.profile().gold,0);assert.match(ui.nodes.get('inscription-feedback').textContent,/부족/);
});
test('stage B storage failure keeps settlement pending, retry commits once and preset retry keeps the failed destination',async()=>{
 const p=game.createProfile(1_000_000);p.stageProgress=[3,0,0];const ui=await host({saved:p,campaign:true});ui.emit('start','click');await ui.settle();const s=ui.state;assert.equal(s.run.stage,4);s.enemies=[];s.spawns=[];s.barrels=[];s.player.invulnerable=999;s.run.wave=3;s.run.waveQuota=s.run.waveKills=s.run.stageQuota=s.run.stageKills=0;s.run.flow='combat';ui.setStorageBlocked(true);ui.tick(.025);assert.ok(s.settlement);assert.equal(s.profile.stageProgress[0],3);assert.equal(ui.profile().stageProgress[0],3);assert.equal(ui.nodes.get('save-banner').hidden,false);const id=s.settlement.id;ui.setStorageBlocked(false);ui.emit('save-retry','click');assert.equal(s.settlement,null);assert.equal(ui.profile().stageProgress[0],4);assert.deepEqual(ui.profile().settledBattleIds,[id]);ui.emit('save-retry','click');assert.deepEqual(ui.profile().settledBattleIds,[id]);ui.tick(.025);assert.equal(s.run.stage,5);
 s.run.timeRemaining=0;ui.tick(.025);assert.equal(s.phase,'defeat');ui.emit('result-build','click');assert.equal(s.phase,'camp');assert.equal(ui.nodes.get('inventory-build-view').hidden,false);assert.equal(ui.nodes.get('build-retry').hidden,false);ui.emit('build-retry','click');assert.equal(s.phase,'playing');assert.equal(s.stageId,1);assert.equal(s.run.stage,5);
});

test('stage B result loot keeps ownership by instance ID after durable settlement clones the inventory',async()=>{
 const p=bagFixture();p.stageProgress=[9,0,0];const ui=await host({saved:p,campaign:true});ui.emit('start','click');await ui.settle();const s=ui.state;assert.equal(s.run.stage,10);s.player.invulnerable=999;ui.run(2);const boss=s.enemies.find(e=>e.boss);assert.ok(boss);s.projectiles.push({id:s.nextId++,x:boss.x,y:boss.y,vx:0,vy:0,damage:1e9,ttl:1,friendly:true});ui.tick(.025);assert.equal(s.phase,'victory');assert.equal(s.settlement,null);ui.run(1.3);assert.ok(s.run.lootLedger.length);for(let n=0;n<s.run.lootLedger.length;n++){const i=s.run.lootLedger[n];assert.ok(s.profile.inventory.some(owned=>owned.id===i.id));assert.equal(s.profile.inventory.includes(i),false);assert.equal(ui.nodes.get('result-loot-state-'+n).textContent,'보관');}
});

test('followup HUD writes preserve simulation, controls, pause and live diagnostics',async()=>{
 const ui=await host({campaign:true});ui.emit('start','click');await ui.settle();const s=ui.state;s.player.invulnerable=999;const remaining=s.run.timeRemaining;for(let i=0;i<120;i++)ui.tick(1/60);assert.ok(s.run.timeRemaining<remaining-1.9);const metrics=JSON.parse(ui.nodes.get('game-shell').attributes['data-frame-metrics']);assert.equal(metrics.samples,120);assert.equal(metrics.hudFrames,120);assert.equal(metrics.drawFrames,120);ui.emit('pause','click');assert.equal(s.paused,true);assert.equal(ui.nodes.get('pause-content').hidden,false);const time=s.run.timeRemaining;ui.run(.5);assert.equal(s.run.timeRemaining,time);ui.emit('resume','click');assert.equal(s.paused,false);ui.tick(.01);assert.ok(s.run.timeRemaining<time);assert.equal(ui.nodes.get('auto-status').textContent,'자동');ui.emit('auto','click');assert.equal(ui.nodes.get('auto-status').textContent,'수동');assert.equal(s.auto,true);
});


test('followup unchanged HUD text preserves its node while changed values appear immediately',async()=>{
 const ui=await host();ui.emit('start','click');ui.tick(0);const node=ui.nodes.get('gold');let text=node.textContent,writes=0;Object.defineProperty(node,'textContent',{get(){return text;},set(value){text=value;writes++;}});for(let i=0;i<20;i++)ui.tick(0);assert.equal(writes,0);ui.state.profile.gold++;ui.tick(0);assert.equal(writes,1);assert.equal(text,String(ui.state.profile.gold));
});


test('followup failed special stage explains that current rewards were canceled and keeps earlier progress',async()=>{
 const p=game.createProfile(1_000_000);p.stageProgress=[3,0,0];p.gold=400;const ui=await host({saved:p,campaign:true});ui.emit('start','click');await ui.settle();const s=ui.state;s.profile.gold+=90;s.run.gold+=90;s.run.timeRemaining=0;ui.tick(.025);assert.equal(s.phase,'defeat');ui.run(1.2);assert.equal(ui.nodes.get('result-content').hidden,false);assert.match(ui.nodes.get('modal-description').textContent,/실패한 구간 보상 없음/);assert.match(ui.nodes.get('result-note').textContent,/보상 없음/);assert.equal(ui.profile().gold,400);assert.equal(ui.profile().stageProgress[0],3);
});

function finishDungeonUi(ui){ui.state.spawns=[];ui.state.enemies=[];ui.state.barrels=[];ui.state.run.wave=3;ui.state.run.waveQuota=ui.state.run.waveKills=0;ui.state.run.stageKills=ui.state.run.stageQuota;ui.tick(.025);ui.run(.6);}
test('growth dungeon hall keeps four real cards, chooses a saved build and exits through Home',async()=>{
 const p=bagFixture();{const s=game.createGame(p);game.saveBuild(s,0,'재료 수집');}
 const ui=await host({saved:p});ui.emit('lobby-summon','click');assert.equal(ui.nodes.get('camp-dungeons-panel').hidden,false);assert.equal(ui.nodes.get('page-title').textContent,'성장 던전');for(const d of game.DUNGEONS)assert.match(ui.nodes.get('dungeon-stage-'+d.id).textContent,/0 \/ 10/);assert.equal(ui.nodes.get('dungeon-level-2').disabled,true);ui.nodes.get('dungeon-build').value='0';ui.emit('dungeon-build','change');assert.equal(ui.profile().selectedBuild,0);assert.match(ui.nodes.get('dungeon-rewards').textContent,/600/);ui.emit('dungeon-card-enhance','click');assert.match(ui.nodes.get('dungeon-rewards').textContent,/재련석 ×10/);ui.emit('nav-home','click');assert.equal(ui.nodes.get('camp-dungeons-panel').hidden,true);assert.equal(ui.nodes.get('game-shell').attributes['data-camp-view'],'home');
});
test('raid tab shows weekly entries, keeps locked raids closed, spends one entry per launch and returns to the raid hall (Alpha 0.123)',async()=>{
 // Raids open after clearing chapter 60: a 59-chapter save sees them locked.
 {const locked=bagFixture();locked.clearedStage=59;locked.unlockedStage=60;const ui=await host({saved:locked});ui.emit('lobby-summon','click');ui.emit('dungeon-mode-raid','click');assert.match(ui.nodes.get('raid-entries-queen').textContent,/60장 클리어 후 개방/);ui.emit('raid-card-queen','click');assert.equal(ui.nodes.get('dungeon-enter').disabled,true);assert.match(ui.nodes.get('dungeon-feedback').textContent,/60장/);}
 const p=bagFixture();p.clearedStage=60;p.unlockedStage=60;const ui=await host({saved:p,campaign:true});ui.emit('lobby-summon','click');ui.emit('dungeon-mode-raid','click');
 assert.equal(ui.nodes.get('raid-cards').hidden,false);assert.equal(ui.nodes.get('dungeon-growth-cards').hidden,true);assert.equal(ui.nodes.get('dungeon-level').hidden,true);assert.match(ui.nodes.get('dungeon-hall-title').textContent,/하나의 보스/);
 assert.match(ui.nodes.get('raid-entries-colossus').textContent,/주간 입장 3 \/ 3/);assert.match(ui.nodes.get('raid-entries-queen').textContent,/주간 입장 3 \/ 3/);
 ui.emit('raid-card-colossus','click');assert.match(ui.nodes.get('dungeon-rule').textContent,/파갑참/);assert.match(ui.nodes.get('dungeon-rewards').textContent,/레이드 고대 10%/);
 ui.emit('dungeon-enter','click');ui.emit('dungeon-enter','click');await ui.settle();await ui.settle();assert.equal(ui.state.phase,'playing');assert.equal(ui.state.run.raidId,'colossus');assert.equal(ui.state.profile.raids.entries.colossus,1);assert.match(ui.nodes.get('hunt-stage').textContent,/레이드 · 강철 거신 · 60장 기준/);
 ui.state.spawns=[];ui.state.enemies=[];ui.state.run.wave=1;ui.state.run.waveQuota=ui.state.run.waveKills=0;ui.tick(.025);ui.run(.6);assert.equal(ui.state.phase,'victory');assert.equal(ui.profile().raids.clears.colossus,1);assert.match(ui.nodes.get('dungeon-result-list').textContent,/원질 핵 ×1/);assert.match(ui.nodes.get('next-stage').textContent,/2회 남음/);
 ui.emit('next-stage','click');assert.equal(ui.state.run.raidId,'colossus');assert.equal(ui.state.profile.raids.entries.colossus,2);ui.state.run.timeRemaining=0;ui.tick(.025);assert.equal(ui.state.phase,'defeat');assert.equal(ui.profile().raids.entries.colossus,2);
 ui.emit('dungeon-result-exit','click');assert.equal(ui.state.phase,'camp');assert.equal(ui.nodes.get('raid-cards').hidden,false);assert.equal(ui.nodes.get('raid-card-colossus').attributes['aria-pressed'],'true');assert.match(ui.nodes.get('dungeon-progress').textContent,/주간 입장 1 \/ 3/);
});
for(const d of game.DUNGEONS)test('dungeon UI '+d.id+' launches once, saves actual materials, retries and returns to the selected hall',async()=>{
 const p=bagFixture(),ui=await host({saved:p,campaign:true});ui.emit('lobby-summon','click');ui.emit('dungeon-card-'+d.id,'click');ui.emit('dungeon-enter','click');ui.emit('dungeon-enter','click');await ui.settle();await ui.settle();assert.equal(ui.state.phase,'playing');assert.equal(ui.state.run.dungeonId,d.id);assert.equal(ui.state.profile.hunts,p.hunts+1);assert.match(ui.nodes.get('hunt-stage').textContent,new RegExp(d.kind));assert.match(ui.nodes.get('stage-rule-hud').textContent,/成長|성장 던전/);finishDungeonUi(ui);assert.equal(ui.state.phase,'victory');assert.equal(ui.nodes.get('dungeon-result-rewards').hidden,false);assert.equal(ui.profile().dungeonProgress[d.id],1);const reward=game.dungeonRewards(d.id,1);assert.equal(ui.profile().gold,p.gold+reward.gold);for(const [id,n]of Object.entries(reward.materials))assert.equal(ui.profile().materials[id],p.materials[id]+n);assert.equal(ui.nodes.get('next-stage').hidden,false);ui.emit('next-stage','click');assert.equal(ui.state.run.dungeonId,d.id);assert.equal(ui.state.phase,'playing');assert.equal(ui.state.run.timeRemaining,60);ui.state.run.timeRemaining=0;ui.tick(.025);assert.equal(ui.state.phase,'defeat');assert.match(ui.nodes.get('dungeon-result-list').textContent,/보상 없음/);ui.emit('dungeon-result-exit','click');assert.equal(ui.state.phase,'camp');assert.equal(ui.nodes.get('camp-dungeons-panel').hidden,false);assert.equal(ui.nodes.get('dungeon-card-'+d.id).attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('dungeon-level-2').disabled,false);
});
test('dungeon save failure freezes result and next-level access until retry; stale result taps never pay again',async()=>{
 const ui=await host({saved:bagFixture(),campaign:true});ui.emit('lobby-summon','click');ui.emit('dungeon-enter','click');await ui.settle();await ui.settle();const before=ui.profile();ui.setStorageBlocked(true);finishDungeonUi(ui);assert.ok(ui.state.settlement);assert.equal(ui.state.phase,'playing');assert.equal(ui.state.profile.dungeonProgress.gold,0);assert.equal(ui.profile().gold,before.gold);ui.emit('dungeon-enter','click');ui.emit('next-stage','click');assert.equal(ui.state.profile.hunts,before.hunts);ui.setStorageBlocked(false);ui.emit('save-retry','click');ui.run(.6);assert.equal(ui.state.phase,'victory');assert.equal(ui.profile().gold,before.gold+600);const once=ui.profile();ui.emit('save-retry','click');ui.tick(.05);const after=ui.profile();after.lastSeenAt=once.lastSeenAt;assert.deepEqual(after,once);
});
test('dungeon rewards are the same balances seen by bag, enhancement, promotion and skill research',async()=>{
 const p=bagFixture();p.gold=500;p.materials.skillPage=3;p.materials.refineStone=10;p.materials.promotionStone=2;const ui=await host({saved:p});ui.emit('nav-skills','click');const points=game.skillPoints(ui.state.profile);ui.emit('skill-study','click');assert.equal(ui.profile().materials.skillPage,0);assert.equal(ui.profile().gold,0);assert.equal(game.skillPoints(ui.state.profile),points+1);assert.equal(ui.nodes.get('skill-study').disabled,true);const once=ui.profile();ui.emit('skill-study','click');assert.deepEqual(ui.profile(),once);ui.emit('nav-home','click');ui.emit('nav-bag','click');ui.emit('bag-tab-materials','click');assert.equal(ui.nodes.get('bag-material-count-refineStone').textContent,'10');assert.equal(ui.nodes.get('bag-material-count-promotionStone').textContent,'2');assert.equal(ui.nodes.get('bag-material-skillPage').hidden,true);assert.equal(ui.nodes.get('bag-material-source-skillPage').textContent,'스킬 던전');
});
test('leaving a cold dungeon launch cancels its intent and keeps camp controls usable',async()=>{
 const ui=await host({saved:bagFixture(),coldStart:true,deferredAsset:'assets/lirian_death-v06.webp'});ui.emit('lobby-summon','click');ui.emit('dungeon-enter','click');ui.emit('nav-home','click');await ui.completeDeferredAssets();assert.equal(ui.state.phase,'camp');assert.equal(ui.state.profile.hunts,0);ui.emit('lobby-summon','click');ui.emit('dungeon-enter','click');await ui.settle();await ui.settle();assert.equal(ui.state.phase,'playing');assert.equal(ui.state.run.dungeonId,'gold');
});

test('skill library pages all 35 skills without changing the loadout and resets paging for category changes',async()=>{
 const ui=await host();ui.emit('nav-skills','click');const before=ui.profile();
 const visible=()=>game.SKILL_CATALOG.filter(r=>r.kind!=='beast').filter(r=>!ui.nodes.get('skill-card-'+r.id).hidden).map(r=>r.id);
 const seen=[];for(let p=0;p<4;p++){const ids=visible();assert.ok(ids.length>0&&ids.length<=9);seen.push(...ids);assert.match(ui.nodes.get('skill-page-label').textContent,new RegExp('^'+(p+1)+' / 4'));if(p<3)ui.emit('skill-page-next','click');}
 assert.equal(ui.nodes.get('skill-page-next').disabled,true);assert.deepEqual(seen,game.SKILL_CATALOG.filter(r=>r.kind!=='beast').map(r=>r.id));
 ui.emit('skill-tab-ultimate','click');assert.equal(ui.nodes.get('skill-tab-ultimate').attributes['aria-pressed'],'true');assert.equal(ui.nodes.get('skill-tab-all').attributes['aria-pressed'],'false');assert.equal(ui.nodes.get('skill-page-prev').disabled,true);assert.equal(ui.nodes.get('skill-page-next').disabled,true);assert.ok(visible().every(id=>game.SKILL_BY_ID[id].kind==='ultimate'));
 ui.emit('skill-tab-all','click');assert.equal(visible()[0],game.SKILL_CATALOG.filter(r=>r.kind!=='beast')[0].id);assert.deepEqual(ui.profile(),before);
});
