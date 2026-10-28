let bagPart='all',earringPosition='earringLeft',earringChoiceItemId=null;
import { regionAssetPlan, createRegionAssets, validPickupEffects, campAssetPaths } from './region-assets.js?v=0.142.0';
import { DIRECTION_VIEWS, actorHeading, directionalClipId, walkingFrame, attackFrame, swingMotion, slashPresentation, recoilProgress, actionFrame, ACTION_DURATIONS, skitterFrame, skitterDeathAlpha } from './motion.js?v=0.142.0';
import { createCombatAudio } from './sound.js?v=0.142.0';
import * as game from './game-engine.js?v=0.142.0';
import {FrameMetrics} from './frame-metrics.js?v=0.142.0';
import { frameIndex, frameRect, validateClip } from './engine.js?v=0.142.0';
import { GROUND_DEPTH_SCALE, cameraFor, worldToScreen, screenToWorld, visibleInCamera } from './world.js?v=0.142.0';
import { viewportFor, renderSurfaceFor, stickVector, guidePointFor, supportsLandscape } from './view-controls.js?v=0.142.0';
import { visibleTiles, createDecorations } from './terrain.js?v=0.142.0';
import { MONSTERS, equipmentArt } from './chapters.js?v=0.142.0';
import { equippedDesigns, validEquipmentSocket, drawEquipmentPreview, visualDesign, gearFrame, snapshotDesigns, validRarityAtlas, drawEquipmentAura, drawEquipmentAttack, drawAncientRune } from './equipment-visuals.js?v=0.142.0';
import {createBackup,readBackup,MAX_BACKUP_BYTES} from './profile-backup.js?v=0.142.0';

const COMBAT_INK=Object.freeze({silver:'#f7dfe9',rose:'#c46b8e',wine:'#70304c',danger:'#f2b58b',urgent:'#ffe1ad',edge:'#25101d'});
const BASE_APPEARANCE=Object.freeze({weapon:null,armor:null,charm:null});
// Presentation only. Drop odds, power and item ownership stay in the engine.
const DROP_BEAMS=Object.freeze([0,48,72,100,124,150,176]);
const DROP_PETALS=Object.freeze([0,1,2,3,4,6,8]);
const $=id=>document.getElementById(id), canvas=$('arena'),ctx=canvas.getContext('2d');
const combatSkillIcons=[];
const viewport={width:1200,height:760},joystick=$('joystick'),stickThumb=$('stick-thumb');
let renderScaleX=1,renderScaleY=1,renderDpr=0,wideLayout=false,orientationBlocked=true;
const STORAGE_KEY='beast-hunter:profile:v1';
const audio=createCombatAudio(()=>{const Type=window.AudioContext||window.webkitAudioContext;return Type?new Type():null;});
let soundEnabled=true;try{soundEnabled=localStorage.getItem(STORAGE_KEY+':sound')!=='off';}catch{}audio.mute(!soundEnabled);
let lastAudioHunt=0,lastAudioId=0,growthRenderKey='';
// The page reuses the 48 tile/detail nodes in index.html, independently of storage capacity.
const RESULT_LOOT_PAGE_SIZE=12,RESULT_LOOT_FIGURES=40,BAG_SLOT_COUNT=48;
const ITEM_AFFIX_FIELDS=Object.entries(game.AFFIXES);
const ITEM_COMPARISON_FIELDS=[['damage','공격',1],['maxHp','체력',1],['speed','이동',1],['crit','치명타',100],['reduction','피해 감소',100],['thunderDamage','강공격',1]];
let resultLootSource=null,resultLootRows=[],resultLootPage=0,resultLootRenderKey='',resultLootLayoutKey='',resultLootPageSize=12,resultLootTab='gear',resultLootExpanded=false,resultLootInventory=null;
let saved=null,storageBlocked=false,recoveredSave=false,storageReadFailed=false;
let restoreCommitted=false,backupCandidate=null,backupReading=false,backupRevision=0,previousBackup=null;
try{saved=localStorage.getItem(STORAGE_KEY);previousBackup=localStorage.getItem(STORAGE_KEY+':before-restore');}catch{storageBlocked=true;storageReadFailed=true;}
if(saved){
  let valid=false;try{const version=JSON.parse(saved)?.version;valid=Number.isInteger(version)&&version>=1&&version<=game.PROFILE_VERSION;}catch{}
  if(!valid){try{localStorage.setItem(STORAGE_KEY+':recovery',saved);recoveredSave=true;}catch{storageBlocked=true;storageReadFailed=true;}}
}
const profile=game.restoreProfile(saved,Date.now());
const offline=game.collectOffline(profile,Date.now());
const state=game.createGame(profile,{durable:true}),decorationsByStage=new Map(game.STAGES.map(c=>[c.id,createDecorations(state.bounds,c)])),images=new Map(),keys=new Set();
// Alpha 0.104: hunts always move and attack automatically. The player only chooses whether skills
// are cast automatically or by tapping the skill row; the choice is a per-browser preference.
const SKILL_MODE_KEY='beast-hunter:skill-mode';let skillMode='auto';try{if(localStorage.getItem(SKILL_MODE_KEY)==='manual')skillMode='manual';}catch{}
state.auto=true;
let skillRequest=null;
let camera=cameraFor(state.player,state.bounds,viewport,GROUND_DEPTH_SCALE),manifest,ready=false,regionAssets,assetPlan,combatReady=false,combatWork=null,combatError='',bootInFlight=false,launchRevision=0,previous=0,saveClock=0;
let selectedRunStage=game.stageLimit(profile,profile.unlockedStage)||1;
let selectedStage=profile.unlockedStage,moveTarget=null,attackTarget=null,aim=null,touch=null,aimRevision=0;
let joystickId=null;
let inventoryView=[],bagFilteredItems=[],rarityFilter=0,bagPage=0,bagPageCount=1,bagFocusRequested=false,bagFilterKey='';
let bagPageSize=20,bagMaterialPageSize=20;
let workshopItemId=null,workshopMode='enhance',workshopFeedback='';
let bagDetailReadId=null,bagDetailPage=0,bagDetailReadKey='',bagDetailPages=[];
let bagSelectedId=null,bagSlot='all',bagSort='pickup',favoritesOnly=false,bagOrganizing=false,bagSelectedIds=new Set(),bagReviewIds=null,bagFeedback='',bagRenderKey='';
let buildTab=0,retryPlan=null,buildUiRevision=0,buildUiRendered='';
const buildNameDrafts=Array(5).fill(null);
let inventoryPanel='gear',bagFiltersOpen=false,bagDetailReturn=null;
let choiceIds=[],campChoices=false,inventoryOpen=false,previousModal='',heldAttacks=new Set();
let suppressHeldSpace=false,pursuitInRange=false;
const skillAppearanceCache=new WeakMap();
function skillAppearance(snapshot){if(!snapshot)return appearance;let value=skillAppearanceCache.get(snapshot);if(!value){value=snapshotDesigns(snapshot);skillAppearanceCache.set(snapshot,value);}return value;}
let appearance=equippedDesigns(profile),rarityAssets=null;const swingDesignCache=new WeakMap();
let skillArt=null,monsterArt=null;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
function designsForSwing(swing){if(!swing?.equipmentAtStart)return appearance;let result=swingDesignCache.get(swing);if(!result){result=snapshotDesigns(swing.equipmentAtStart);swingDesignCache.set(swing,result);}return result;}
let trackOpen=false,trackMaterial=null,trackViewKey='',goalCache=null;
let campDrawer='',campDrawerOrigin='hub-map';
let selectedTowerFloor=1,selectedRaidTier=0,selectedDungeon='gold',selectedDungeonLevel=1,dungeonBusy=false,dungeonMode='growth',selectedRaid='colossus',selectedSealId=null,sealFeedback='';
let selectedSkill='crescent',skillTab='all',skillRenderKey='',skillFeedback='';
const skillKinds={active:'일반 스킬',passive:'패시브',ultimate:'궁극기',beast:'괴수 기술'};
let craftSlot='all',trackRecipeId=null,trackReturnCraft=false,trackOrigin='craft-track';
let craftOpen=false,craftSelected=game.CRAFTED_CATALOG[1].id,craftFeedback='',craftRenderKey='';
let equipmentSceneKey='';
let previewAppearance=null,codexOpen=false,codexSelection=profile.targetAncientId??game.ANCIENT_CATALOG[0].id,codexChapter='0',codexSlot='all',codexFound='all',codexSearch='',codexRenderKey='',selectedDifficulty=0;
let codexDetailOpen=false,codexFiltersOpen=false,codexLayout='grid',codexSort='catalog',codexOrigin='codex-search',codexPage=0,codexPageFilter='';
const clockMs=()=>typeof performance==='object'?performance.now():Date.now();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const duration=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
const countdown=seconds=>{const whole=Math.ceil(Math.max(0,seconds));return String(Math.floor(whole/60)).padStart(2,'0')+':'+String(whole%60).padStart(2,'0');};

function save(){
  buildUiRevision++;
  if(restoreCommitted)return false;
  if(storageReadFailed){showSaveState();return false;}
  let committed=false;
  try{const now=Date.now();localStorage.setItem(STORAGE_KEY,game.encodeProfile(profile,now));if(state.settlement)committed=game.confirmSettlement(state,state.settlement.id);profile.lastSeenAt=now;storageBlocked=false;}
  catch{storageBlocked=true;}
  if(committed){clearInput();updateHud();}
  showSaveState();return !storageBlocked;
}
function showSaveState(){
  const message=restoreCommitted?'복원 기록을 저장했어. 새로고침해서 이어가.':storageReadFailed?'기존 기록을 읽지 못했어. 진행을 백업한 뒤 새로고침해줘.':storageBlocked?'자동 저장에 실패했어. 현재 진행을 백업하거나 다시 저장해줘.':recoveredSave?'이전 저장의 복구 사본을 보관했어. 현재 진행은 자동 저장돼.':'이 브라우저에 자동 저장 중';
  if($('save-status').textContent!==message)$('save-status').textContent=message;$('save-banner').hidden=!storageBlocked&&!restoreCommitted;
  const action=restoreCommitted||storageReadFailed?'새로고침':'다시 저장';if($('save-retry').textContent!==action)$('save-retry').textContent=action;
  $('save-emergency-backup').hidden=restoreCommitted;if($('backup-storage-status').textContent!==message)$('backup-storage-status').textContent=message;
  $('backup-previous').disabled=!previousBackup||restoreCommitted;
  $('game-shell').setAttribute('data-save-error',String(storageBlocked));
}
function backupAllowed(){return ready&&state.phase==='camp'&&campDrawer==='more'&&!restoreCommitted;}
function downloadBackup(text,prefix='beast-hunter'){
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=$('backup-download');
 try{link.href=url;link.download=prefix+'-'+new Date(Date.now()).toISOString().replace(/[:.]/g,'-')+'.json';link.click();}
 finally{setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
function exportBackup(){
 if(restoreCommitted)return;
 try{downloadBackup(createBackup(profile,Date.now()));$('backup-feedback').textContent='백업 파일 내려받기를 시작했어.';}
 catch(error){$('backup-feedback').textContent=error.message;$('save-status').textContent='백업 파일을 만들지 못했어. 더보기에서 다시 시도해줘.';}
}
function cancelBackup(){backupRevision++;backupCandidate=null;backupReading=false;$('backup-review').hidden=true;$('backup-file').value='';}
$('save-retry').addEventListener('click',()=>{if(restoreCommitted||storageReadFailed)window.location.reload();else save();});
$('save-emergency-backup').addEventListener('click',exportBackup);
$('backup-export').addEventListener('click',()=>{if(backupAllowed())exportBackup();});
$('backup-previous').addEventListener('click',()=>{if(!backupAllowed()||!previousBackup)return;try{readBackup(previousBackup,Date.now());downloadBackup(previousBackup,'beast-hunter-before-restore');$('backup-feedback').textContent='복원 전 기록 내려받기를 시작했어.';}catch(error){$('backup-feedback').textContent=error.message;}});
$('backup-choose').addEventListener('click',()=>{if(backupAllowed()){$('backup-file').value='';$('backup-file').click();}});
$('backup-cancel').addEventListener('click',()=>{cancelBackup();$('backup-feedback').textContent='복원을 취소했어.';$('backup-choose').focus({preventScroll:true});});
$('backup-file').addEventListener('change',async()=>{
 if(!backupAllowed())return;
 const file=$('backup-file').files?.[0];cancelBackup();if(!file)return;const revision=backupRevision;backupReading=true;$('backup-feedback').textContent='백업 파일을 확인하는 중…';
 try{
  if(file.size>MAX_BACKUP_BYTES)throw Error('백업 파일은 256KB 이하여야 해.');
  const text=await file.text();if(revision!==backupRevision||!backupAllowed())return;
  const candidate=readBackup(text,Date.now());backupCandidate=candidate;
  $('backup-summary').textContent='백업: Lv.'+candidate.profile.level+' · 장비 '+candidate.profile.inventory.length+'개 · 골드 '+candidate.profile.gold+' · 완료 챕터 '+candidate.profile.clearedStage+'\n현재: Lv.'+profile.level+' · 장비 '+profile.inventory.length+'개 · 골드 '+profile.gold;
  $('backup-review').hidden=false;$('backup-feedback').textContent='내용을 확인하고 복원을 눌러줘.';$('backup-confirm').focus({preventScroll:true});
 }catch(error){if(revision===backupRevision)$('backup-feedback').textContent=error.message;}
 finally{if(revision===backupRevision)backupReading=false;}
});
$('backup-confirm').addEventListener('click',()=>{
 if(!backupAllowed()||!backupCandidate||backupReading)return;
 if(storageReadFailed){$('backup-feedback').textContent='기존 기록을 읽을 수 없어. 현재 진행을 백업하고 새로고침한 뒤 다시 시도해줘.';return;}
 const now=Date.now(),text=game.encodeProfile(backupCandidate.profile,now);
 try{
  const rollback=createBackup(profile,now);localStorage.setItem(STORAGE_KEY+':before-restore',rollback);previousBackup=rollback;
  localStorage.setItem(STORAGE_KEY,text);
 }catch{storageBlocked=true;$('backup-feedback').textContent='복원 기록을 저장하지 못했어. 현재 진행은 유지돼.';showSaveState();return;}
 restoreCommitted=true;storageBlocked=false;ready=false;clearInput();audio.suspend();cancelBackup();showSaveState();
 for(const child of $('game-shell').children??[])if(child.id!=='save-banner')child.inert=true;
 $('save-retry').focus({preventScroll:true});window.location.reload();
});
showSaveState();
function loadImage(path){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);const file=manifest.delivery?.[path]??path;img.onerror=()=>reject(new Error('어셋을 불러오지 못했어: '+file));img.src='assets/'+file;});}
async function boot(){
  if(bootInFlight)return;bootInFlight=true;$('region-status').hidden=true;$('loading').textContent='사냥터를 준비하는 중…';
  const began=clockMs();let bootFailed=false;
  try{
    const response=await fetch('assets/manifest.json',{cache:'no-cache'});if(!response.ok)throw Error('어셋 목록을 불러오지 못했어.');manifest=await response.json();
    if(!validRarityAtlas(manifest.equipmentRarities))throw Error('상위 장비 외형 정보를 확인하지 못했어.');
    if(!game.STAGES.every(c=>manifest.monsterEffects?.[c.effects]))throw Error('몬스터 스킬 이미지 목록을 확인하지 못했어.');
    assetPlan=regionAssetPlan(manifest,[...game.STAGES,...game.RAID_REGIONS,...game.RUSH_REGIONS]);
    const paths=campAssetPaths(manifest);let loaded=0;
    const results=await Promise.allSettled([...paths].map(async p=>{const image=await loadImage(p);loaded++;if(!bootFailed)$('loading').textContent='거점을 준비하는 중… '+loaded+' / '+paths.size;return [p,image];}));
    const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
    const menuImages=new Map(results.map(r=>r.value));
    for(const clip of [manifest.clips[manifest.directions.hunter.idle.s],manifest.equipment,manifest.equipmentRarities]){
      const image=menuImages.get(clip.image),result=validateClip(clip,image.naturalWidth,image.naturalHeight);if(!result.valid)throw Error(result.errors.join(', '));
    }
    for(const [path,image]of menuImages)images.set(path,image);
    regionAssets=createRegionAssets({images,plan:assetPlan,loadImage,validateClip});
    rarityAssets={atlas:manifest.equipmentRarities,image:images.get(manifest.equipmentRarities.image)};
    ready=true;$('loading').hidden=true;$('game-shell').setAttribute('data-ready-ms',String(Math.round(clockMs()-began)));$('game-shell').setAttribute('data-loaded-images',String(images.size));save();updateHud();
  }catch(error){bootFailed=true;ready=false;images.clear();$('loading').hidden=false;$('start').disabled=true;$('loading').textContent=error.message+' 다시 시도하거나 새로고침해줘.';$('region-status').hidden=false;$('region-status-text').textContent='사냥터 준비에 실패했어.';$('region-retry').hidden=false;}finally{bootInFlight=false;}
}
// Shared battle images are committed together after all validation succeeds.
// The single pending promise owns its private image map and is reused by retries/clicks.
function ensureCombatAssets(){
 if(!ready)return Promise.resolve(false);if(combatReady)return Promise.resolve(true);if(combatWork)return combatWork;
 combatError='';
 combatWork=(async()=>{
  const results=await Promise.allSettled([...assetPlan.paths].map(async path=>[path,images.get(path)??await loadImage(path)]));
  const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
  const loaded=new Map(results.map(r=>r.value));
  for(const clip of assetPlan.clips){const image=loaded.get(clip.image),result=validateClip(clip,image.naturalWidth,image.naturalHeight);if(!result.valid)throw Error(result.errors.join(', '));}
  for(const family of Object.values(manifest.directions.hunter))for(const id of Object.values(family)){
   const sockets=manifest.equipmentSockets?.[id];if(sockets?.length!==manifest.clips[id].frames.length||!sockets.every(validEquipmentSocket))throw Error('장비 동작 정보를 확인하지 못했어.');
  }
  if(!validPickupEffects(manifest.pickupEffects,loaded))throw Error('획득 이펙트 이미지 정보를 확인하지 못했어.');
  if(!game.validSkillPresentation(manifest.skillPresentation,loaded))throw Error('스킬 일러스트 정보를 확인하지 못했어.');
  for(const [path,image]of loaded)images.set(path,image);
  skillArt={reducedMotion,atlas:{...manifest.skillPresentation.effects,image:images.get(manifest.skillPresentation.effects.image)}};
  monsterArt={reducedMotion,atlases:manifest.monsterEffects,images};combatReady=true;return true;
 })().catch(error=>{combatError=error.message;return false;}).finally(()=>{combatWork=null;updateHud();});
 updateRegionUi();return combatWork;
}
function regionReady(id=selectedStage){return ready&&regionAssets?.residentId===id&&regionAssets.status==='ready';}
function prepareRegion(id,retry=false){
  const task=regionAssets.request(id,retry);updateRegionUi();
  task.then(ok=>{if(ok||regionAssets.requestedId===id){updateHud();}});
  return task;
}
function updateRegionUi(){
  if(!regionAssets)return;
  const loading=!!combatWork||regionAssets.status==='loading',failed=!!combatError||regionAssets.status==='error';
  $('region-status').hidden=!loading&&!failed;
  const message=failed?'전투 이미지를 불러오지 못했어. 다시 시도해줘.':loading?'전투 이미지를 준비하는 중… 첫 사냥에는 시간이 걸릴 수 있어.':'';
  if($('region-status-text').textContent!==message)$('region-status-text').textContent=message;
  $('region-retry').hidden=!failed;
  $('start').disabled=loading||failed;$('camp-map-start').disabled=loading||failed||state.phase!=='camp';$('dashboard-start').disabled=loading||failed;
  $('game-shell').setAttribute('data-region-status',combatError?'error':regionAssets.status);$('game-shell').setAttribute('data-combat-ready',String(combatReady));
  $('game-shell').setAttribute('data-resident-region',String(regionAssets.residentId??''));
  $('game-shell').setAttribute('data-loaded-images',String(images.size));
}
$('region-retry').addEventListener('click',()=>{if(!ready){boot();return;}ensureCombatAssets();prepareRegion(state.phase==='camp'&&campDrawer==='dungeons'?(dungeonMode==='tower'?game.towerChapter(selectedTowerFloor):game.dungeonDefinition(selectedDungeon).chapter):state.phase==='camp'?selectedStage:regionAssets.requestedId??selectedStage,true);});
function releaseJoystick(){joystickId=null;touch=null;stickThumb.style.transform='translate(0px,0px)';joystick.setAttribute('data-active','false');}
function clearInput(){keys.clear();moveTarget=null;attackTarget=null;aim=null;releaseJoystick();heldAttacks.clear();pursuitInRange=false;}
function resizeViewport(){
  const box=canvas.getBoundingClientRect(),next=viewportFor(box.width,box.height),nextWide=supportsLandscape(box.width,box.height),layoutChanged=nextWide!==wideLayout;
  const windowMeasured=Number.isFinite(window.innerWidth)&&Number.isFinite(window.innerHeight),blocked=!supportsLandscape(windowMeasured?window.innerWidth:box.width,windowMeasured?window.innerHeight:box.height);
  if(blocked!==orientationBlocked){orientationBlocked=blocked;previous=0;if(blocked){launchRevision++;clearInput();audio.suspend();if(state.phase==='playing')state.paused=true;}}
  $('orientation-gate').hidden=!blocked;$('game-shell').inert=blocked;$('game-shell').setAttribute('data-orientation-blocked',String(blocked));
  renderDpr=window.devicePixelRatio||1;
  const surface=renderSurfaceFor(box.width,box.height,renderDpr),viewChanged=next.width!==viewport.width||next.height!==viewport.height;
  if(!viewChanged&&!layoutChanged&&canvas.width===surface.width&&canvas.height===surface.height)return;
  wideLayout=nextWide;$('game-shell').setAttribute('data-layout',wideLayout?'landscape':'portrait');
  viewport.width=next.width;viewport.height=next.height;canvas.width=surface.width;canvas.height=surface.height;
  renderScaleX=surface.width/next.width;renderScaleY=surface.height/next.height;
  if(viewChanged)clearInput();camera=cameraFor(state.player,state.bounds,viewport,GROUND_DEPTH_SCALE);
  $('game-shell').setAttribute('data-viewport',next.width+'x'+next.height);
  $('game-shell').setAttribute('data-render-surface',surface.width+'x'+surface.height);
  if(layoutChanged&&inventoryOpen){bagRenderKey='';refreshBag();resizeBagGrids();}
}
function manual(){}
function start(stage=selectedStage,substage=selectedRunStage,difficulty=selectedDifficulty){if(!ready||orientationBlocked)return;closeStatsSheet();audio.unlock();
  if(!combatReady||!regionReady(stage)){
    if(state.phase!=='camp'&&!game.resultReady(state))return;
    const token=++launchRevision,phase=state.phase,run=state.run,panel=previousModal,drawer=campDrawer,selection=selectedStage+':'+selectedRunStage+':'+selectedDifficulty;
    Promise.all([ensureCombatAssets(),prepareRegion(stage,regionAssets.status==='error')]).then(([shared,region])=>{
     if(shared&&region&&token===launchRevision&&state.phase===phase&&state.run===run&&previousModal===panel&&campDrawer===drawer&&selection===selectedStage+':'+selectedRunStage+':'+selectedDifficulty)start(stage,substage,difficulty);
    });return;
  }
  launchRevision++;if(game.launch(state,stage,substage,viewport,difficulty)){selectedStage=stage;selectedRunStage=substage;selectedDifficulty=difficulty;clearInput();campChoices=false;inventoryOpen=false;codexOpen=false;craftOpen=false;trackOpen=false;save();canvas.focus({preventScroll:true});updateHud();}}
function returnCamp(){launchRevision++;audio.suspend();game.returnToCamp(state);selectedRunStage=game.stageLimit(profile,selectedStage,selectedDifficulty)||1;clearInput();campChoices=false;inventoryOpen=false;codexOpen=false;craftOpen=false;trackOpen=false;save();updateHud();}
function doAttack(){if(!ready||orientationBlocked||state.phase!=='playing'||state.paused)return;audio.unlock();manual();game.attack(state,currentAim());canvas.focus({preventScroll:true});}
function moveVector(){
  if(touch)return {x:touch[0],y:touch[1]};
  return {x:Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y:Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))};
}
// Store the cursor's screen position, not a vector that goes stale as the player moves.
// Explicit aim wins; keyboard/touch attacks otherwise use movement or the visible facing.
function currentAim(v=moveVector()){
  if(attackTarget){const target=state.enemies.find(e=>e.id===attackTarget&&!e.dead)??state.barrels.find(b=>b.id===attackTarget&&b.status==='idle');if(target)return{x:target.x-state.player.x,y:target.y-state.player.y,targetId:target.id};}
  if(aim){const w=screenToWorld(aim,cameraFor(state.player,state.bounds,viewport,GROUND_DEPTH_SCALE),state.bounds);return{x:w.x-state.player.x,y:w.y-state.player.y};}
  if(v.x||v.y)return v;
  if(moveTarget&&distance(moveTarget,state.player)>=8)return{x:moveTarget.x-state.player.x,y:moveTarget.y-state.player.y};
  return undefined;
}
function doDash(){if(!ready||orientationBlocked||state.phase!=='playing'||state.paused)return;audio.unlock();manual();const v=moveVector();if(game.dash(state,v.x||v.y?v:currentAim()??{x:state.player.lookX,y:state.player.lookY})){moveTarget=null;attackTarget=null;pursuitInRange=false;}canvas.focus({preventScroll:true});}
function doThunder(){if(!ready||orientationBlocked||state.phase!=='playing'||state.paused)return;audio.unlock();manual();game.thunder(state,currentAim());canvas.focus({preventScroll:true});}
function togglePause(){if(state.settlement||orientationBlocked||state.phase!=='playing')return;state.paused=!state.paused;if(state.paused)audio.suspend();else audio.unlock();clearInput();save();updateHud();}
$('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;audio.mute(!soundEnabled);if(soundEnabled)audio.unlock();try{localStorage.setItem(STORAGE_KEY+':sound',soundEnabled?'on':'off');}catch{}updateHud();});
$('start').addEventListener('click',()=>start());
// Alpha 0.139 성장: 능력치 단련 (shared, 능력치 포인트 one per level) and the 성장 트리 web (saved with each build, 트리 포인트 one per two levels).
// A tree node is chosen with the first tap; the second tap (or 습득) learns it, 반환 gives back a node nothing else hangs on.
let growthView='training',growthArmed='',treeSelected='core';
for(const [id,v]of [['growth-tab-training','training'],['growth-tab-tree','tree'],['growth-tab-transcend','transcend']])$(id).addEventListener('click',()=>{if(state.phase!=='camp')return;growthView=v;growthArmed='';updateHud();});
for(const t of game.TRANSCEND)$('transcend-'+t.id).addEventListener('click',()=>{if(game.trainTranscend(state,t.id)){save();$('growth-feedback').textContent=t.name+' '+profile.transcendence[t.id]+'단계';updateHud();}});
for(const id of game.TRAINING_IDS)$('train-'+id).addEventListener('click',()=>{if(game.trainStat(state,id)){save();$('growth-feedback').textContent=game.TRAINING[id].name+' '+profile.training[id]+'단계';updateHud();}});
function learnTreeNode(id){if(game.learnGrowthNode(state,id)){save();$('growth-feedback').textContent='성장 트리 · '+game.TREE_NODES[id].name+' 습득';}else $('growth-feedback').textContent=game.TREE_NODES[id].name+' · '+game.nodeStatus(profile,id);updateHud();}
// Alpha 0.141 성장 트리 확대·이동 (사용자 요청): ＋/−/전체 보기, 휠, 두 손가락, 끌어서 이동. The web is scaled with a CSS
// transform; a drag longer than 6px swallows the click that ends it so dragging never learns a node.
const TREE_ZOOM_MIN=1,TREE_ZOOM_MAX=3;let treeZoom={k:1,x:0,y:0},treeDrag=null,treeDragged=false;const treePointers=new Map();
function applyTreeZoom(){const web=$('tree-web'),box=web.parentElement?.getBoundingClientRect?.(),w=box?.width||600,h=box?.height||240,mx=(treeZoom.k-1)*w/2,my=(treeZoom.k-1)*h/2;
 treeZoom.x=clamp(treeZoom.x,-mx,mx);treeZoom.y=clamp(treeZoom.y,-my,my);web.style.transform=treeZoom.k===1?'':'translate('+treeZoom.x.toFixed(1)+'px,'+treeZoom.y.toFixed(1)+'px) scale('+treeZoom.k.toFixed(3)+')';
 web.setAttribute('data-zoomed',String(treeZoom.k>1));hudText($('tree-zoom-level'),Math.round(treeZoom.k*100)+'%');$('tree-zoom-out').disabled=treeZoom.k<=TREE_ZOOM_MIN;$('tree-zoom-in').disabled=treeZoom.k>=TREE_ZOOM_MAX;}
function zoomTree(k,cx=0,cy=0){const next=clamp(k,TREE_ZOOM_MIN,TREE_ZOOM_MAX),r=next/treeZoom.k;treeZoom={k:next,x:cx-(cx-treeZoom.x)*r,y:cy-(cy-treeZoom.y)*r};applyTreeZoom();}
function treeCenterOffset(e){const box=$('tree-web').parentElement?.getBoundingClientRect?.();return box?{x:e.clientX-box.left-box.width/2,y:e.clientY-box.top-box.height/2}:{x:0,y:0};}
$('tree-zoom-in').addEventListener('click',()=>zoomTree(treeZoom.k*1.35));$('tree-zoom-out').addEventListener('click',()=>zoomTree(treeZoom.k/1.35));$('tree-zoom-reset').addEventListener('click',()=>{treeZoom={k:1,x:0,y:0};applyTreeZoom();});applyTreeZoom();
$('tree-web').addEventListener('wheel',e=>{if(growthView!=='tree')return;e.preventDefault?.();const c=treeCenterOffset(e);zoomTree(treeZoom.k*(e.deltaY<0?1.15:1/1.15),c.x,c.y);},{passive:false});
$('tree-web').addEventListener('pointerdown',e=>{treePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});treeDragged=false;if(treePointers.size===1)treeDrag={x:e.clientX,y:e.clientY,ox:treeZoom.x,oy:treeZoom.y,moved:0};else if(treePointers.size===2){const [a,b]=[...treePointers.values()];treeDrag={pinch:Math.hypot(a.x-b.x,a.y-b.y),k:treeZoom.k};}});
$('tree-web').addEventListener('pointermove',e=>{if(!treePointers.has(e.pointerId)||!treeDrag)return;treePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(treeDrag.pinch&&treePointers.size===2){const [a,b]=[...treePointers.values()];zoomTree(treeDrag.k*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,treeDrag.pinch));treeDragged=true;return;}
 if(treeDrag.pinch||treeZoom.k<=1)return;const dx=e.clientX-treeDrag.x,dy=e.clientY-treeDrag.y;if(Math.hypot(dx,dy)>6)treeDragged=true;if(treeDragged){treeZoom.x=treeDrag.ox+dx;treeZoom.y=treeDrag.oy+dy;applyTreeZoom();}});
for(const type of ['pointerup','pointercancel','pointerleave'])$('tree-web').addEventListener(type,e=>{treePointers.delete(e.pointerId);if(!treePointers.size)treeDrag=null;});
// Alpha 0.141 트리 프리셋: tap a slot to choose it, then 불러오기/저장 (saving over a saved slot asks for a second tap).
let treePresetSelected=0,treePresetArmed=false;
for(let n=0;n<5;n++)$('tree-preset-'+n).addEventListener('click',()=>{if(state.phase!=='camp')return;treePresetSelected=n;treePresetArmed=false;const preset=profile.treePresets?.[n];$('growth-feedback').textContent=preset?preset.name+' · 노드 '+preset.tree.length+'개 · '+game.treeSpent(preset.tree)+'P':'빈 칸 · 지금 트리를 저장할 수 있어.';updateHud();});
$('tree-preset-save').addEventListener('click',()=>{if(state.phase!=='camp')return;const n=treePresetSelected;if(profile.treePresets?.[n]&&!treePresetArmed){treePresetArmed=true;$('growth-feedback').textContent=(n+1)+'번 프리셋을 지금 트리로 덮어쓰려면 한 번 더 누르세요.';updateHud();return;}treePresetArmed=false;if(game.saveTreePreset(state,n)){save();$('growth-feedback').textContent=(n+1)+'번 프리셋 저장 완료 · 노드 '+profile.growthTree.length+'개';updateHud();}});
$('tree-preset-load').addEventListener('click',()=>{if(state.phase!=='camp')return;treePresetArmed=false;const r=game.loadTreePreset(state,treePresetSelected);$('growth-feedback').textContent=r.reason;if(r.ok){treeSelected='core';save();}updateHud();});
for(const id of Object.keys(game.TREE_NODES))$('tree-node-'+id).addEventListener('click',()=>{if(state.phase!=='camp'||treeDragged)return;growthArmed='';if(treeSelected===id&&!game.nodeStatus(profile,id)){learnTreeNode(id);return;}treeSelected=id;$('growth-feedback').textContent='';updateHud();});
$('tree-learn').addEventListener('click',()=>{if(state.phase==='camp'&&game.isTreeNode(treeSelected))learnTreeNode(treeSelected);});
$('tree-forget').addEventListener('click',()=>{if(state.phase!=='camp'||!game.isTreeNode(treeSelected))return;const name=game.TREE_NODES[treeSelected].name;if(game.forgetGrowthNode(state,treeSelected)){save();$('growth-feedback').textContent='성장 트리 · '+name+' 반환';}else $('growth-feedback').textContent=name+' · '+game.forgetStatus(profile,treeSelected);updateHud();});
// Reset asks twice: the first tap arms it, the second clears the visible page.
// Alpha 0.141 stat rows: the gauge fills within the current efficiency band (단련 1~20·21~60·61~, 초월 1~50·51~150·151~),
// data-tier colours it (0 full efficiency, 1 half/60%, 2 quarter/30%); past the last edge it cycles every 40 / 100 ranks.
function statGauge(id,rank,edges){const fill=$(id+'-gauge');if(!fill)return;let tier=0;while(tier<edges.length&&rank>=edges[tier])tier++;const from=tier?edges[tier-1]:0,span=tier<edges.length?edges[tier]-from:(edges.at(-1)-edges[0]),inBand=tier<edges.length?rank-from:(rank-from)%span;fill.style.width=Math.round(inBand/span*1000)/10+'%';fill.parentElement?.setAttribute?.('data-tier',String(tier));$(id.replace(/-([a-z]+)$/,'-row-$1'))?.setAttribute('data-tier',String(tier));}
// Alpha 0.141 성장 화면 왼쪽 캐릭터 능력치 (사용자 요청): the stats sheet's numbers, grouped, with the change of the last
// 단련/초월/트리 step flashing beside the value for 1.6s.
let growthStatsPrev=null,growthStatsFlash=0;
function refreshGrowthStats(){
 const st=game.playerStats(profile),tree=game.treeBonus(profile),tr=game.transcendBonus(profile);
 const v={damage:Math.round(st.damage),crit:st.crit*100,aspd:st.attackSpeed*100,range:Math.round(st.range),hp:Math.round(st.maxHp),reduction:st.reduction*100,regen:st.regeneration,speed:Math.round(st.speed),boss:tr.bossDamage*100,skill:(tree.skillDamage+tr.skillDamage)*100};
 const text={damage:String(v.damage),crit:v.crit.toFixed(1)+'%',aspd:Math.round(v.aspd)+'%',range:String(v.range),hp:v.hp.toLocaleString('ko-KR'),reduction:v.reduction.toFixed(1)+'%',regen:v.regen.toFixed(2)+'/초',speed:String(v.speed),boss:'+'+v.boss.toFixed(1)+'%',skill:'+'+v.skill.toFixed(1)+'%'};
 const now=Date.now();
 if(growthStatsPrev){let changed=false;for(const k of Object.keys(v)){const d=v[k]-growthStatsPrev[k];if(Math.abs(d)>1e-6){changed=true;const unit=['crit','aspd','reduction','boss','skill'].includes(k)?'%':'';hudText($('gstat-'+k+'-delta'),(d>0?'+':'')+(Number.isInteger(d)?d:d.toFixed(unit?1:2))+unit);$('gstat-'+k+'-delta').setAttribute('data-sign',d>0?'up':'down');}}if(changed)growthStatsFlash=now+1600;}
 growthStatsPrev=v;
 if(now>growthStatsFlash)for(const k of Object.keys(v))hudText($('gstat-'+k+'-delta'),'');
 for(const [k,t]of Object.entries(text))hudText($('gstat-'+k),t);
 hudText($('gstat-level'),'Lv.'+profile.level+(profile.level>=game.MAX_LEVEL&&game.transcendPointsTotal(profile)?' · 초월 '+game.transcendPointsTotal(profile):''));
 hudText($('gstat-note'),'단련·트리·장비·초월을 합한 값');
}
const GROWTH_VIEW_NAMES={training:'능력치 단련',tree:'성장 트리',transcend:'초월'};
$('growth-reset').addEventListener('click',()=>{if(state.phase!=='camp')return;const name=GROWTH_VIEW_NAMES[growthView];if(growthArmed!==growthView){growthArmed=growthView;$('growth-feedback').textContent=name+' 초기화는 한 번 더 누르세요. 포인트는 모두 돌려받습니다.';updateHud();return;}growthArmed='';if(growthView==='tree'?game.resetGrowthTree(state):growthView==='transcend'?game.resetTranscendence(state):game.resetTrainingStats(state)){save();$('growth-feedback').textContent=name+' 초기화 완료';updateHud();}});
// Both 0.139 pools in one short line (menus, result, stats sheet).
// Alpha 0.139: 정예/악몽 multipliers against the same chapter on 일반.
// Why a 정예/악몽 chapter is still closed (0.139: every chapter of the mode below first, then one by one).
function modeLockText(d,chapter){if(!d)return '';const below=['일반','정예'][d-1];if(!game.modeOpen(profile,d))return below+' 60장 클리어 필요';return game.HUNT_MODES[d].name+' '+(chapter-1)+'장 처치 필요';}
function timesText(v){return (v>=10?Math.round(v):Math.round(v*10)/10)+'배';}
function growthBudget(){return '능력치 '+game.trainingPoints(profile)+' · 트리 '+game.treePoints(profile);}
function refreshGrowthBoard(){
 const tree=profile.growthTree,held=new Set([game.TREE_ROOT,...tree]);
 $('growth-board').setAttribute('data-view',growthView);if(growthView!=='tree')refreshGrowthStats();else growthStatsPrev=null;$('growth-training').hidden=growthView!=='training';$('growth-tree').hidden=growthView!=='tree';$('growth-transcend').hidden=growthView!=='transcend';
 for(const [id,v]of [['growth-tab-training','training'],['growth-tab-tree','tree'],['growth-tab-transcend','transcend']])$(id).setAttribute('aria-pressed',String(growthView===v));
 hudText($('growth-points'),growthView==='transcend'?'초월 포인트 '+game.transcendPoints(profile)+' / '+game.transcendPointsTotal(profile):growthView==='tree'?'트리 포인트 '+game.treePoints(profile)+' / '+game.treePointsTotal(profile):'능력치 포인트 '+game.trainingPoints(profile)+' / '+game.trainingPointsTotal(profile));hudText($('growth-reset'),growthArmed===growthView?'초기화 확인':'초기화');
 for(const id of game.TRAINING_IDS){const t=game.TRAINING[id],rank=profile.training[id],why=game.trainStatus(profile,id),rate=game.trainingRate(rank);hudText($('train-'+id+'-value'),t.unit+' +'+game.trainingValue(id,rank)+t.suffix+(rate<1?' · 효율 '+Math.round(rate*100)+'%':''));hudText($('train-'+id+'-rank'),String(rank));$('train-'+id).disabled=!!why;$('train-'+id).setAttribute('aria-label',t.name+' '+rank+'단계 · '+t.unit+' 단계당 +'+Math.round(t.per*rate*100)/100+t.suffix+(why?' · '+why:''));statGauge('train-'+id,rank,[20,60]);}
 if(growthView==='transcend'){const pr=game.transcendProgress(profile.transcendXp??0);$('transcend-xp-gauge').style.width=(profile.level<game.MAX_LEVEL?0:Math.round(pr.xp/pr.needed*1000)/10)+'%';hudText($('transcend-level'),profile.level<game.MAX_LEVEL?'Lv.200부터 경험치가 초월 경험치로 쌓입니다. 경험치 던전에서도 얻습니다.':'초월 Lv.'+pr.level+' · 다음 레벨 '+pr.xp.toLocaleString('ko-KR')+' / '+pr.needed.toLocaleString('ko-KR')+' · 51단계부터 효율 50%, 151단계부터 25%');
  for(const t of game.TRANSCEND){const rank=profile.transcendence?.[t.id]??0,why=game.transcendStatus(profile,t.id),eff=game.transcendEffective(rank);hudText($('transcend-'+t.id+'-value'),t.text+' +'+Math.round(eff*10)/10+'%');hudText($('transcend-'+t.id+'-rank'),String(rank));statGauge('transcend-'+t.id,rank,[50,150]);$('transcend-'+t.id).disabled=!!why;$('transcend-'+t.id).setAttribute('aria-label',t.name+' '+rank+'단계 · '+t.text+' +'+Math.round(eff*10)/10+'%'+(why?' · '+why:''));}}
 if(growthView!=='tree')return;
 {const cur=JSON.stringify(profile.growthTree);for(let n=0;n<5;n++){const b=$('tree-preset-'+n),preset=profile.treePresets?.[n];b.setAttribute('aria-pressed',String(n===treePresetSelected));b.setAttribute('data-saved',String(!!preset));b.setAttribute('data-current',String(!!preset&&JSON.stringify(preset.tree)===cur));b.setAttribute('title',preset?preset.name+' · '+preset.tree.length+'노드':'빈 칸');}
  $('tree-preset-load').disabled=!profile.treePresets?.[treePresetSelected];hudText($('tree-preset-save'),treePresetArmed?'덮어쓰기':'저장');}
 for(const b of game.GROWTH_TREE)hudText($('tree-branch-'+b.id+'-spent'),game.branchPoints(profile,b.id)+'P');
 for(const n of Object.values(game.TREE_NODES)){const why=n.kind==='core'?'':game.nodeStatus(profile,n.id),st=held.has(n.id)?'owned':why==='이어진 노드 필요'?'locked':'open',node=$('tree-node-'+n.id);node.setAttribute('data-state',st);node.setAttribute('aria-pressed',String(treeSelected===n.id));node.setAttribute('aria-label',n.name+' · '+n.text+(n.cost?' · '+n.cost+'포인트':'')+' · '+(st==='owned'?'습득':why||'습득 가능'));}
 for(const [a,b]of game.TREE_EDGES)$('tree-edge-'+a+'--'+b).setAttribute('data-state',held.has(a)&&held.has(b)?'owned':held.has(a)||held.has(b)?'open':'locked');
 const n=game.TREE_NODES[treeSelected]??game.TREE_NODES[game.TREE_ROOT],owned=held.has(n.id),why=n.kind==='core'?'':owned?game.forgetStatus(profile,n.id):game.nodeStatus(profile,n.id);
 hudText($('tree-detail-name'),n.name+(n.kind==='notable'?' · 주요':n.kind==='keystone'?' · 핵심':''));hudText($('tree-detail-text'),n.kind==='core'?game.GROWTH_TREE.map(b=>b.name+' '+game.branchPoints(profile,b.id)+'P').join(' · '):n.kind==='keystone'?n.text.slice(5):n.text);hudText($('tree-detail-cost'),n.kind==='core'?'':owned?'습득':n.cost+'P');
 $('tree-learn').hidden=owned||n.kind==='core';$('tree-learn').disabled=!!why;hudText($('tree-learn'),why&&!owned?why:'습득');
 $('tree-forget').hidden=!owned||n.kind==='core';$('tree-forget').disabled=!!why;
}
// Regions group ten chapters; a region tab opens its furthest unlocked chapter.
// The species a stage is known by on the map (rotates skitter/spitter/bulwark), and the stages a species appears in.
function stageHeadline(chapter,stage){const lineup=chapter.stages[Math.min(9,Math.max(1,stage))-1];return lineup[['skitter','spitter','bulwark'][(stage-1)%3]];}
function stagesOf(chapter,species){return chapter.stages.map((l,i)=>Object.values(l).includes(species)?i+1:0).filter(Boolean);}
function regionChapters(theme){return game.STAGES.filter(c=>c.theme===theme);}
function selectChapter(id){if(!ready||state.phase!=='camp'||id<1||id>profile.unlockedStage||id===selectedStage)return;launchRevision++;selectedStage=id;if(!game.stageLimit(profile,selectedStage,selectedDifficulty))selectedDifficulty=0;selectedRunStage=game.stageLimit(profile,id,selectedDifficulty);updateHud();}
for(const theme of game.THEMES)$('stage-'+theme.id).addEventListener('click',()=>{const open=regionChapters(theme.id).filter(c=>c.id<=profile.unlockedStage).at(-1);if(open&&game.STAGES[selectedStage-1].theme!==theme.id)selectChapter(open.id);});
$('chapter-prev').addEventListener('click',()=>selectChapter(selectedStage-1));
$('chapter-next').addEventListener('click',()=>selectChapter(selectedStage+1));
$('choice-back').addEventListener('click',()=>{campChoices=false;updateHud();});
$('inventory').addEventListener('click',()=>openInventory());$('camp-inventory').addEventListener('click',()=>openInventory());
$('loot-filter').addEventListener('change',event=>{const value=Number(event.target.value);rarityFilter=Number.isInteger(value)&&value>=0&&value<=6?value:0;bagReviewIds=null;updateHud();});
$('bag-part').addEventListener('change',e=>{bagPart=Object.hasOwn(game.SLOTS,e.target.value)?e.target.value:'all';if(bagPart!=='all')bagSlot=game.equipmentCategory(bagPart);bagSelectedId=null;bagReviewIds=null;updateHud();resizeBagGrids();});
$('bag-slot').addEventListener('change',e=>setBagCategory(e.target.value));
$('bag-sort').addEventListener('change',e=>{bagSort=['pickup','rarity','slot'].includes(e.target.value)?e.target.value:'pickup';bagReviewIds=null;updateHud();});
$('bag-favorites').addEventListener('click',()=>{favoritesOnly=!favoritesOnly;bagReviewIds=null;updateHud();});
$('bag-organize').addEventListener('click',()=>{if(bagSlot==='materials')return;bagOrganizing=!bagOrganizing;bagSelectedIds.clear();bagReviewIds=null;updateHud();});
$('bag-select-all').addEventListener('click',()=>{bagSelectedIds=new Set(bagFilteredItems.filter(i=>!game.itemProtection(profile,i)).map(i=>i.id));bagReviewIds=null;updateHud();});
$('bag-review').addEventListener('click',()=>{bagReviewIds=[...bagSelectedIds];updateHud();});
$('bag-cancel').addEventListener('click',()=>{bagReviewIds=null;updateHud();});
function closeBagDetail(){workshopItemId=null;const itemId=bagSelectedId,origin=bagDetailReturn;bagSelectedId=null;bagDetailReturn=null;if(origin)inventoryPanel='equipment';updateHud();resizeBagGrids(itemId);const index=inventoryView.findIndex(item=>item.id===itemId);if(origin)$(origin).focus({preventScroll:true});else if(index>=0)$('bag-'+index).focus({preventScroll:true});}
$('bag-detail-close').addEventListener('click',closeBagDetail);
function setInventoryPanel(panel){if(!inventoryOpen||!['equipment','gear','build'].includes(panel))return;inventoryPanel=panel;bagSelectedId=null;bagDetailReturn=null;bagReviewIds=null;bagFeedback='';updateHud();resizeBagGrids();window.hunterPages?.first($('inventory-content'));}
$('bag-filter-toggle').addEventListener('click',()=>{if(!inventoryOpen)return;bagFiltersOpen=!bagFiltersOpen;updateHud();});
function setBagCategory(slot){if(!inventoryOpen)return;bagSlot=['all','weapon','armor','charm','special','materials'].includes(slot)?slot:'all';bagPart='all';bagSelectedId=null;bagDetailReturn=null;bagReviewIds=null;if(bagSlot==='materials'){bagOrganizing=false;bagSelectedIds.clear();bagFiltersOpen=false;}updateHud();resizeBagGrids();window.hunterPages?.reveal(bagSlot==='materials'?$('bag-materials'):$('bag-grid'));}
for(const slot of ['all','weapon','armor','charm','special','materials'])$('bag-tab-'+slot).addEventListener('click',()=>setBagCategory(slot));
$('bag-filter-reset').addEventListener('click',()=>{rarityFilter=0;bagSlot='all';bagPart='all';favoritesOnly=false;bagReviewIds=null;updateHud();});
function openEquipmentSynergies(){if(!inventoryOpen)return;setInventoryPanel('build');$('equipped-synergies').setAttribute('open','');window.hunterPages?.reveal($('bag-equipped'));$('equipped-synergies-title').focus({preventScroll:true});}
$('equipment-synergy-open').addEventListener('click',openEquipmentSynergies);
for(const row of game.EQUIPMENT_SYNERGIES)$('equipment-link-'+row.id).addEventListener('click',()=>{if(inventoryOpen&&inventoryPanel==='equipment')openEquipmentSynergies();});
$('equipment-link-set').addEventListener('click',()=>{if(inventoryOpen&&inventoryPanel==='equipment')setInventoryPanel('gear');});
$('bag-confirm').addEventListener('click',()=>{if(!bagReviewIds?.length)return;const result=game.bulkSalvage(state,bagReviewIds);bagFeedback=result.reason;bagReviewIds=null;bagSelectedIds.clear();if(result.ok)save();updateHud();});
for(let n=0;n<5;n++){
 $('build-save-'+n).addEventListener('click',()=>{if(game.saveBuild(state,n,buildNameDrafts[n]??$('build-name-'+n).value)){buildNameDrafts[n]=null;bagFeedback='빌드 '+(n+1)+' 저장 완료';bagReviewIds=null;save();updateHud();}});
 $('build-delete-'+n).addEventListener('click',()=>{if(game.deleteBuild(state,n)){buildNameDrafts[n]=null;bagFeedback='빌드 삭제 · 해당 장비 보호 해제';bagReviewIds=null;save();updateHud();}});
 $('build-apply-'+n).addEventListener('click',()=>{const result=game.applyBuild(state,n);bagFeedback=result.reason;if(result.ok){appearance=equippedDesigns(profile);bagReviewIds=null;save();}updateHud();});
}
$('inventory-back').addEventListener('click',()=>{inventoryOpen=false;updateHud();});
for(let i=0;i<BAG_SLOT_COUNT;i++){
  for(const [action,step]of [['prev',-1],['next',1]])$('item-read-'+action+'-'+i).addEventListener('click',()=>{if(!inventoryOpen||inventoryPanel!=='gear'||inventoryView[i]?.id!==bagSelectedId)return;const next=bagDetailPage+step;if(next<0||next>=bagDetailPages.length)return;bagDetailPage=next;refreshBagDetailReading();});
  $('bag-'+i).addEventListener('click',()=>{const item=inventoryView[i];if(!item)return;if(bagOrganizing){if(game.itemProtection(profile,item))return;if(bagSelectedIds.has(item.id))bagSelectedIds.delete(item.id);else bagSelectedIds.add(item.id);bagReviewIds=null;updateHud();}else{bagSelectedId=item.id;bagDetailReturn=null;updateHud();window.hunterPages?.reveal($('bag-detail-close'));$('bag-detail-close').focus({preventScroll:true});}});
  $('favorite-'+i).addEventListener('click',()=>{const item=inventoryView[i];if(item&&game.toggleFavorite(state,item.id)){bagReviewIds=null;save();updateHud();}});
  $('equip-position-'+i).addEventListener('change',e=>{if(inventoryView[i]?.id!==bagSelectedId||!['earringLeft','earringRight'].includes(e.target.value))return;earringPosition=e.target.value;updateHud();});
  $('equip-'+i).addEventListener('click',()=>{const item=inventoryView[i];if(item&&game.equipItem(state,item.id,item.slot==='earring'?earringPosition:null)){appearance=equippedDesigns(profile);save();updateHud();}});
  $('salvage-'+i).addEventListener('click',()=>{const item=inventoryView[i];if(item&&game.salvageItem(state,item.id)){bagFeedback=item.name+' 분해 완료';bagReviewIds=null;save();updateHud();}});
}
function openInventory(panel='gear'){if(state.settlement||!ready||!['camp','playing','victory','defeat'].includes(state.phase)||['victory','defeat'].includes(state.phase)&&!game.resultReady(state))return;launchRevision++;if(state.phase==='playing')state.paused=true;audio.suspend();clearInput();trackOpen=false;craftOpen=false;codexOpen=false;campChoices=false;inventoryOpen=true;if(!bagFocusRequested)bagPage=0;inventoryPanel=['equipment','gear','build'].includes(panel)?panel:'gear';bagDetailReturn=null;bagFiltersOpen=false;bagFeedback='';updateHud();resizeBagGrids();window.hunterPages?.first($('inventory-content'));}
// Fit the data page to the available list area. Never move or rebuild menu chrome.
function fitBagGrid(node,width,height,anchorId=null){
 if(!inventoryOpen||inventoryPanel!=='gear'||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 const materials=node.id==='bag-material-grid';if(materials!==(bagSlot==='materials'))return;
 const gap=6,style=window.getComputedStyle(node),target=parseFloat(style.getPropertyValue?.('--bag-target-size'))||64,columns=Math.max(1,Math.min(BAG_SLOT_COUNT,Math.floor((width+gap)/(target+gap))));
 let cell=Math.max(1,Math.min(68,Math.floor((width-gap*(columns-1))/columns),Math.floor(height)));
 const rows=Math.max(materials?Math.ceil(game.MATERIALS.length/columns):1,Math.min(Math.ceil(BAG_SLOT_COUNT/columns),Math.floor((height+gap)/(cell+gap))));
 if(materials)cell=Math.max(1,Math.min(cell,Math.floor((height-gap*(rows-1))/rows)));
 const layout=columns+':'+rows+':'+cell;if(node.getAttribute('data-layout')===layout)return;
 node.setAttribute('data-layout',layout);node.style.setProperty('--bag-columns',String(columns));node.style.setProperty('--bag-rows',String(rows));node.style.setProperty('--bag-cell-size',cell+'px');
 if(materials){const size=Math.min(BAG_SLOT_COUNT,columns*rows);if(size!==bagMaterialPageSize){bagMaterialPageSize=size;bagRenderKey='';refreshBag();}return;}
 const size=Math.min(BAG_SLOT_COUNT,columns*rows);if(size===bagPageSize)return;
 const focused=document.activeElement?.id?.match(/^(bag|equip|favorite|salvage|item-read-(?:prev|next))-(\d+)$/),focusedId=focused?inventoryView[Number(focused[2])]?.id:null;
 const keep=anchorId??bagSelectedId??focusedId??inventoryView[0]?.id,index=bagFilteredItems.findIndex(item=>item.id===keep);
 bagPageSize=size;bagPage=Math.max(0,Math.floor(index/size));bagRenderKey='';refreshBag();
 if(focused&&focusedId!==null&&focusedId!==undefined){const next=inventoryView.findIndex(item=>item.id===focusedId);if(next>=0)$(focused[1]+'-'+next).focus({preventScroll:true});}
}
function resizeBagGrids(anchorId=null){
 if(!inventoryOpen||inventoryPanel!=='gear')return;
 const node=$(bagSlot==='materials'?'bag-material-grid':'bag-grid'),box=node.getBoundingClientRect();fitBagGrid(node,box.width,box.height,anchorId);
}
// Only the detail text changes page; item identity, art and actions stay fixed.
function detailTextPages(text,width,lineCount,font){
 const lines=[];ctx.save();ctx.font=font;
 try{for(const paragraph of text.split('\n')){let line='';for(const ch of paragraph){const next=line+ch;if(line&&ctx.measureText(next).width>width){lines.push(line);line=ch;}else line=next;}lines.push(line);}}
 finally{ctx.restore();}
 const pages=[];for(let i=0;i<lines.length;i+=lineCount)pages.push(lines.slice(i,i+lineCount).join('\n'));return pages.length?pages:[''];
}
function refreshBagDetailReading(){
 if(!inventoryOpen||inventoryPanel!=='gear'||bagSelectedId===null){bagDetailReadId=null;bagDetailReadKey='';return;}
 const index=inventoryView.findIndex(item=>item.id===bagSelectedId);if(index<0)return;
 if(bagDetailReadId!==bagSelectedId){bagDetailReadId=bagSelectedId;bagDetailPage=0;bagDetailReadKey='';}
 $('item-stat-grid-'+index).hidden=false;$('item-read-title-'+index).textContent='특성 · 고유 효과';
 const item=inventoryView[index],trait=$('item-trait-'+index),unique=$('item-unique-'+index),parts=['획득처 · '+game.equipmentAcquisition(item)+(game.huntGrade(item)?'\n'+game.HUNT_MODES[game.huntGrade(item)].name+' 난이도 장비 · 기본 능력치 ×'+game.HUNT_POWER[game.huntGrade(item)]:'')];
 // Alpha 0.110: an ancient's special effect leads the reading text.
 const ancient=game.ancientDefinition(item);if(ancient)parts.unshift('고대 특수효과\n'+ancientPowerText(item));
 if(game.isSeal(item))parts.unshift('인장 효과 · '+game.SEAL_GRADES[item.seal.grade].name+' · 성장 '+item.seal.level+' / '+game.SEAL_MAX_LEVEL+'\n'+game.sealEffectLines(item).join('\n')+'\n성장은 던전 → 보스 러시 화면에서');
 if(item.perfect)parts.push('극옵 · 모든 기본 옵션 최댓값');
 const setId=game.itemSet(item);if(setId){const worn=game.equippedSetCounts(profile)[setId]??0;parts.push('세트 · '+game.EQUIPMENT_SETS[setId].name+' (착용 '+worn+'/'+game.SET_SLOTS.length+')\n'+game.setBonusText(setId,worn));}
 const ranges=game.itemRollRanges(item);if(Object.keys(ranges).length)parts.push('기본 옵션 범위 (강화 보너스 제외)\n'+Object.entries(ranges).map(([k,r])=>game.AFFIXES[k]+' '+item.affixes[k]+' ['+r.min+'~'+r.max+']').join(' · '));
 if(item.inscription)parts.push('추가 각인 · '+game.BUILD_EFFECTS[item.inscription].name+'\n'+game.buildEffectText(item.inscription));
 if(game.enhancementLevel(item))parts.push('개별 강화 +'+game.enhancementLevel(item)+' · 옵션 +'+(game.enhancementLevel(item)*3)+'% · 자동 분해 보호');
 if(!trait.hidden)parts.push('무기 특성\n'+trait.textContent);
 if(!unique.hidden&&unique.textContent&&!(ancient&&unique.textContent.startsWith('✦ '+ancient.signature.name)))parts.push('고유 효과\n'+unique.textContent);
 const text=parts.join('\n\n')||'별도의 장비 효과가 없어.';
 const node=$('item-read-text-'+index),box=node.getBoundingClientRect(),style=window.getComputedStyle(node),lineHeight=parseFloat(style.lineHeight)||21;
 if(!Number.isFinite(box.width)||!Number.isFinite(box.height)||box.width<=0||box.height<lineHeight){node.textContent='';bagDetailReadKey='';return;}
 const font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily,lines=Math.max(1,Math.floor(box.height/lineHeight)),key=JSON.stringify([bagSelectedId,index,text,box.width,lines,font]);
 if(key!==bagDetailReadKey){bagDetailReadKey=key;bagDetailPages=detailTextPages(text,Math.max(1,box.width-2),lines,font);}
 bagDetailPage=Math.min(bagDetailPage,bagDetailPages.length-1);node.textContent=bagDetailPages[bagDetailPage];
 $('item-read-page-'+index).textContent=(bagDetailPage+1)+' / '+bagDetailPages.length;$('item-read-prev-'+index).disabled=bagDetailPage===0;$('item-read-next-'+index).disabled=bagDetailPage+1>=bagDetailPages.length;
}
function comparisonText(comparison){
 const d=comparison.deltas;
 return ITEM_COMPARISON_FIELDS.map(([key,label,scale])=>{const value=Math.round(d[key]*scale*10)/10;return label+' '+(value>0?'+':'')+value+(scale===100?'%p':'');}).join(' · ');
}
function synergyChangeText(c){return [
 ...c.gained.map(r=>'＋ 활성화 · '+r.name+' ('+game.EQUIPMENT_SLOTS[r.source]+' + '+game.EQUIPMENT_SLOTS[r.payoff]+')'),
 ...c.lost.map(r=>'－ 해제 · '+r.name),
 ...c.kept.map(r=>'＝ 유지 · '+r.name+' ('+game.EQUIPMENT_SLOTS[r.source]+' + '+game.EQUIPMENT_SLOTS[r.payoff]+')')
 ].join('\n')||'활성 시너지 없음 · 장비 조합을 바꿔봐.';}
for(const [id,step]of [['bag-page-prev',-1],['bag-page-next',1]])$(id).addEventListener('click',()=>{
 if(!inventoryOpen||inventoryPanel!=='gear'||bagSlot==='materials'||bagSelectedId!==null&&!wideLayout||state.phase!=='camp'&&!state.paused)return;
 const page=bagPage+step;if(page<0||page>=bagPageCount)return;bagPage=page;bagSelectedId=null;bagRenderKey='';updateHud();
});
function refreshBag(){
 const chosenEarring=profile.inventory.find(i=>i.id===bagSelectedId);if(chosenEarring?.slot==='earring'&&earringChoiceItemId!==chosenEarring.id){earringChoiceItemId=chosenEarring.id;earringPosition=game.equippedPosition(profile,chosenEarring)??(profile.equipment.earringLeft==null?'earringLeft':'earringRight');}
 const filters=rarityFilter+':'+bagSlot+':'+bagSort+':'+favoritesOnly;if(filters!==bagFilterKey){bagFilterKey=filters;bagPage=0;}
 const key=JSON.stringify([profile.gold,profile.cores,profile.inventory,profile.legendaryPity,profile.equipment,profile.favoriteItemIds,profile.savedBuilds,profile.skills,profile.forge,profile.level,profile.materials,state.phase,state.paused,rarityFilter,bagSlot,bagPart,earringPosition,bagSort,favoritesOnly,bagSelectedId,bagOrganizing,[...bagSelectedIds],bagReviewIds,bagFeedback,inventoryPanel,bagFiltersOpen,bagPage,bagPageSize,bagMaterialPageSize,bagFocusRequested,workshopItemId,workshopMode,workshopFeedback]);
 if(key===bagRenderKey)return;bagRenderKey=key;
 inventoryView=profile.inventory.filter(i=>i.rarity>=rarityFilter&&game.matchesEquipmentCategory(i,bagSlot)&&(bagPart==='all'||i.slot===bagPart)&&(!favoritesOnly||profile.favoriteItemIds.includes(i.id)));
 if(bagSort==='rarity')inventoryView.sort((a,b)=>b.rarity-a.rarity||b.tier-a.tier||a.id-b.id);
 if(bagSort==='slot')inventoryView.sort((a,b)=>Object.keys(game.SLOTS).indexOf(a.slot)-Object.keys(game.SLOTS).indexOf(b.slot)||b.rarity-a.rarity||a.id-b.id);
 bagFilteredItems=inventoryView;bagPageCount=Math.max(1,Math.ceil(inventoryView.length/bagPageSize));
 if(bagFocusRequested){bagPage=Math.max(0,Math.floor(inventoryView.findIndex(i=>i.id===bagSelectedId)/bagPageSize));bagFocusRequested=false;}
 bagPage=Math.min(bagPage,bagPageCount-1);inventoryView=inventoryView.slice(bagPage*bagPageSize,(bagPage+1)*bagPageSize);
 $('bag-pages').hidden=inventoryPanel!=='gear'||bagSlot==='materials'||bagSelectedId!==null&&!wideLayout;$('bag-page-number').textContent=(bagPage+1)+' / '+bagPageCount;
 $('bag-page-prev').disabled=bagPage===0;$('bag-page-next').disabled=bagPage+1>=bagPageCount;
 const available=new Set(profile.inventory.filter(i=>!game.itemProtection(profile,i)).map(i=>i.id));bagSelectedIds=new Set([...bagSelectedIds].filter(id=>available.has(id)));
 if(!inventoryView.some(i=>i.id===bagSelectedId))bagSelectedId=null;if(workshopItemId!==bagSelectedId)workshopItemId=null;
 const materials=bagSlot==='materials';$('inventory-content').setAttribute('data-category',bagSlot);$('inventory-content').setAttribute('data-organizing',String(bagOrganizing));$('game-shell').setAttribute('data-inventory-view',inventoryPanel);$('inventory-content').setAttribute('data-view',inventoryPanel);$('inventory-content').setAttribute('data-detail',String(!bagOrganizing&&bagSelectedId!==null));
 $('inventory-gear-view').hidden=inventoryPanel!=='gear';$('bag-categories').hidden=inventoryPanel!=='gear'||bagSelectedId!==null&&!wideLayout;$('inventory-build-view').hidden=inventoryPanel!=='build';
 $('bag-filters').hidden=materials||!bagFiltersOpen;$('bag-filter-toggle').setAttribute('aria-expanded',String(bagFiltersOpen));$('bag-filter-dot').hidden=rarityFilter===0&&bagSlot==='all'&&!favoritesOnly;
 for(const slot of ['all','weapon','armor','charm','special','materials'])$('bag-tab-'+slot).setAttribute('aria-pressed',String(bagSlot===slot));
 $('bag-capacity').textContent=materials?'재료 '+game.MATERIALS.filter(m=>profile.materials[m.id]>0).length+' / '+game.MATERIALS.length+'종':profile.inventory.length+' / '+game.INVENTORY_LIMIT;
 $('bag-grid').hidden=materials;$('bag-materials').hidden=!materials;$('bag-material-actions').hidden=!materials;for(const id of ['bag-sort','bag-filter-toggle','bag-organize'])$(id).hidden=materials;
 let ownedMaterials=0;
 for(const m of game.MATERIALS){const count=profile.materials[m.id],node=$('bag-material-'+m.id);node.hidden=count<=0;if(count>0)ownedMaterials++;$('bag-material-count-'+m.id).textContent=String(count);node.setAttribute('data-owned',String(count>0));const label=m.name+' · '+count+'개 · '+m.where;node.setAttribute('aria-label',label);node.setAttribute('title',label);$('bag-material-source-'+m.id).textContent=m.id==='skillPage'?'스킬 던전':m.refining?'강화 던전 · 사냥터':m.promotion?'승급 던전 · 사냥터':m.tier?game.THEMES[m.tier-1].name:m.rare?'지역 보스':'모든 사냥터';}
 for(let i=0;i<BAG_SLOT_COUNT;i++)$('bag-material-empty-'+i).hidden=i>=bagMaterialPageSize-ownedMaterials;
 $('bag-material-craft').disabled=state.phase!=='camp';$('bag-material-craft').textContent=state.phase==='camp'?'재료로 제작하기':'제작은 거점에서';
 $('bag-storage-note').textContent=materials?'수집한 재료 · 제작·강화에 사용하는 보유 수량':profile.inventory.length>=game.INVENTORY_LIMIT?'가방이 가득 찼어. 착용·즐겨찾기·저장 빌드는 보호하고 낮은 가치 장비를 골드로 정리해.':'남은 '+(game.INVENTORY_LIMIT-profile.inventory.length)+'칸 · 착용·즐겨찾기·저장 빌드는 자동 정리에서 보호돼.';
 $('loot-luck').textContent='일반 드롭 → 최대 강화 → 승급';
 $('loot-filter').value=String(rarityFilter);$('bag-slot').value=bagSlot;$('bag-part').value=bagPart;$('bag-sort').value=bagSort;
 $('bag-favorites').setAttribute('aria-pressed',String(favoritesOnly));$('bag-organize').setAttribute('aria-pressed',String(bagOrganizing));$('bag-organize').textContent=bagOrganizing?'정리 마치기':'가방 정리';
 $('bag-bulk').hidden=inventoryPanel!=='gear'||!bagOrganizing;$('bag-hint').hidden=bagOrganizing||bagSelectedId!==null;$('bag-detail').hidden=bagOrganizing||bagSelectedId===null;$('bag-feedback').textContent=bagFeedback;
 $('bag-hint').textContent=materials?'재료는 장비 보관 칸을 사용하지 않아.':'장비를 눌러 비교하기';
 $('bag-inspect-title').textContent=materials?'성장·제작 재료':bagOrganizing?'장비 정리':'장비 상세 정보';
 $('bag-inspect-description').textContent=materials?'검술서는 스킬 → 검술서 연구에서 사용합니다.':bagOrganizing?'목록에서 분해할 장비를 선택하세요.':bagSlot==='special'?'캐릭터 전용장비 · 던전에서 낮은 확률로 획득 예정. 제작 장비는 제작 탭에서 확인하세요.':bagSlot==='charm'?'목걸이 1개 · 귀걸이 2개. 일반 장신구는 추후 던전에서 획득. 제작 장신구는 제작 탭에서 확인하세요.':'목록에서 장비를 선택하세요.';
 $('bag-inspect-note').textContent=materials?'재료는 장비 보관 칸을 사용하지 않습니다.':bagOrganizing?'착용·즐겨찾기·저장 빌드는 보호됩니다.':'강화 · 승급 · 수치작';
 $('inventory-empty').hidden=materials||inventoryView.length>0;$('inventory-empty').textContent=profile.inventory.length?'이 조건에 맞는 장비가 없어.':'사냥에서 얻은 장비가 여기 모여.';
 const selected=profile.inventory.filter(i=>bagSelectedIds.has(i.id));$('bag-selected').textContent=selected.length+'개 선택 · 골드 +'+selected.reduce((sum,i)=>sum+game.salvageValue(i),0);$('bag-review').disabled=!selected.length;
 $('bag-confirmation').hidden=!bagReviewIds?.length;const reviewed=profile.inventory.filter(i=>bagReviewIds?.includes(i.id));$('bag-confirm-list').textContent=reviewed.map(i=>game.RARITIES[i.rarity]+' '+i.name).join('\n');$('bag-confirm-note').textContent=reviewed.length+'개를 분해하면 골드 +'+reviewed.reduce((sum,i)=>sum+game.salvageValue(i),0)+' · 장비는 사라져.';
 for(let n=0;n<5;n++){const b=profile.savedBuilds[n],status=game.buildStatus(profile,n);if(document.activeElement!==$('build-name-'+n))$('build-name-'+n).value=buildNameDrafts[n]??b?.name??'';
  $('build-gear-'+n).replaceChildren(...(b?Object.entries(b.equipment).map(([slot,id])=>{const line=document.createElement('span');line.textContent=game.EQUIPMENT_SLOTS[slot]+': '+(id===null?'미착용':profile.inventory.find(i=>i.id===id&&i.slot===game.itemSlotForPosition(slot))?.name??'⚠ 장비 없음');line.title=line.textContent;return line;}):[Object.assign(document.createElement('span'),{textContent:'아직 저장한 조합이 없어.'})]));
  $('build-status-'+n).textContent=status.missing?.length?status.reason:status.ok?(state.phase==='camp'?'교체 가능':'캠프에서 교체 가능'):status.reason;$('build-apply-'+n).disabled=state.phase!=='camp'||!status.ok;$('build-delete-'+n).disabled=!b;
  const comparison=status.ok?game.compareEquipment(profile,b.equipment):null;$('build-compare-'+n).textContent=comparison?'교체 후 공격 '+Math.round(comparison.after.damage)+' · 체력 '+Math.round(comparison.after.maxHp)+' · 치명타 '+Math.round(comparison.after.crit*100)+'%':'';
 }
 for(let i=0;i<BAG_SLOT_COUNT;i++){const item=inventoryView[i],tile=$('bag-'+i);tile.hidden=i>=bagPageSize;tile.setAttribute('data-empty',String(!item));tile.setAttribute('aria-hidden',String(!item));$('bag-art-'+i).hidden=!item;$('item-'+i).hidden=!item||bagOrganizing||item.id!==bagSelectedId;
  if(!item){tile.disabled=true;tile.setAttribute('aria-label','빈 장비 칸');tile.setAttribute('aria-pressed','false');tile.setAttribute('data-rarity','');tile.setAttribute('data-perfect','false');tile.style.borderColor='';$('bag-badge-'+i).textContent='';$('bag-check-'+i).textContent='';continue;}
  const equipped=game.isEquippedItem(profile,item),protection=game.itemProtection(profile,item),favorite=profile.favoriteItemIds.includes(item.id),reserved=profile.savedBuilds.some(b=>b&&Object.values(b.equipment).includes(item.id));
  tile.setAttribute('data-perfect',String(!!item.perfect));tile.style.borderColor=game.RARITY_INFO[item.rarity].color;tile.setAttribute('aria-label',(item.perfect?'극옵 · ':'')+itemGradeName(item)+' '+item.name+(protection?' · '+protection:'')+(bagOrganizing?' · 분해 선택':''));tile.setAttribute('aria-pressed',String(bagOrganizing?bagSelectedIds.has(item.id):item.id===bagSelectedId));tile.disabled=bagOrganizing&&!!protection;
  tile.setAttribute('data-rarity',String(item.rarity));gearThumbnail($('bag-art-'+i),item,80,true);$('bag-badge-'+i).textContent=(game.isSeal(item)?(item.seal.level?'+'+item.seal.level+' ':''):game.enhancementLevel(item)?'+'+game.enhancementLevel(item)+' ':'')+(item.perfect?'극옵 ':'')+(equipped?'◆':'')+(favorite?'☆':'')+(reserved?'▣':'');$('bag-check-'+i).textContent=bagOrganizing&&bagSelectedIds.has(item.id)?'✓':'';
      $('item-'+i).setAttribute('data-rarity',String(item.rarity));$('item-'+i).setAttribute('data-kind',game.craftedDefinition(item)?'crafted':game.ancientDefinition(item)?'ancient':'ordinary');$('item-name-'+i).textContent=itemGradeName(item)+' '+item.name+(game.enhancementLevel(item)?' +'+game.enhancementLevel(item):'');$('item-name-'+i).style.color=game.RARITY_INFO[item.rarity].color;
      gearThumbnail($('item-art-'+i),item,96,true);
      $('item-affixes-'+i).textContent=(item.perfect?'극옵 · 모든 옵션 최댓값\n':'')+Object.entries(item.affixes).map(([k,v])=>game.AFFIXES[k]+' +'+v+(['speed','crit','reduction'].includes(k)?'%':'')).join('\n');
      const crafted=game.craftedDefinition(item),ancient=game.ancientDefinition(item),unique=game.uniqueEffect(item);$('item-powers-'+i).hidden=!unique;$('item-power-title-'+i).textContent='✦ '+(crafted?.signature.name??ancient?.signature.name??unique?.name??'고유 효과');$('item-unique-'+i).hidden=!unique;$('item-unique-'+i).textContent=unique?'✦ '+unique.name+' · '+unique.description+(item.rarity>3&&unique.scales?(item.rarity===6?' · 고유 고정 위력 ':item.rarity===5?' · 고대 고정 위력 ':' · 등급 효과 위력 ')+(item.rarity===6?1.5:item.rarity===5?1.36:1.12).toFixed(2)+'배':'')+(crafted?'\n✦ '+crafted.signature.name+' · '+crafted.signature.description+'\n대장간 제작 전용 · 드롭되지 않음':''):'';$('item-unique-'+i).style.color=unique?.color??'';
      for(const [key]of ITEM_AFFIX_FIELDS){const present=Object.hasOwn(item.affixes,key);$('item-affix-row-'+key+'-'+i).hidden=!present;$('item-affix-value-'+key+'-'+i).textContent=present?'+'+game.effectiveAffix(item,key)+(['speed','crit','reduction'].includes(key)?'%':''):'';if(present)$('item-affix-value-'+key+'-'+i).setAttribute('title','기본 '+item.affixes[key]+' + 강화 '+game.enhancementBonus(item,key)+' = '+game.effectiveAffix(item,key));}
      const itemTrait=game.weaponTrait(item);$('item-trait-'+i).hidden=!itemTrait;$('item-trait-'+i).textContent=itemTrait?itemTrait.name+' · '+itemTrait.description:'';$('item-trait-'+i).style.color=itemTrait?.color??'';
      $('item-meta-'+i).textContent=(game.huntGrade(item)?game.HUNT_MODES[game.huntGrade(item)].name+' · ':'')+itemGradeName(item)+' 등급 · '+game.SLOTS[item.slot]+' · '+game.equipmentAcquisition(item);$('item-status-'+i).textContent=[equipped?'착용 중':'',favorite?'즐겨찾기':'',reserved?'저장 빌드':''].filter(Boolean).join(' · ')||'보관 중';
      if(item.id===bagSelectedId)$('bag-detail').setAttribute('aria-labelledby','item-name-'+i);

  $('earring-target-'+i).hidden=item.slot!=='earring';$('equip-position-'+i).value=earringPosition;const equippedHere=equipped&&(item.slot!=='earring'||game.equippedPosition(profile,item)===earringPosition);
  $('equip-'+i).disabled=equippedHere||!game.canEquipItem(state,item.id);$('equip-'+i).textContent=equippedHere?'착용 중':item.slot==='earring'?(earringPosition==='earringLeft'?'귀걸이 1 착용':'귀걸이 2 착용'):'착용';
  $('favorite-'+i).textContent=favorite?'★ 보호 해제':'☆ 즐겨찾기';$('favorite-'+i).setAttribute('aria-pressed',String(favorite));
  const c=game.compareItem(profile,item.id,item.slot==='earring'?earringPosition:null);$('item-compare-'+i).textContent=(equipped?'현재 착용 중':'착용 후 변화 · '+comparisonText(c));$('item-synergy-'+i).textContent=synergyChangeText(c);
  for(const [key,,scale]of ITEM_COMPARISON_FIELDS){const value=Math.round(c.deltas[key]*scale*10)/10,node=$('item-change-'+key+'-'+i);node.textContent=value===0?'—':(value>0?'+':'')+value+(scale===100?'%p':'');node.setAttribute('data-sign',value>0?'positive':value<0?'negative':'zero');}
  const current=profile.inventory.find(it=>it.id===profile.equipment[item.slot==='earring'?earringPosition:item.slot]),before=game.uniqueEffect(current),after=game.uniqueEffect(item);
  if(!equipped&&before?.id!==after?.id)$('item-synergy-'+i).textContent+='\n고유 효과: '+(before?.name??'없음')+' → '+(after?.name??'없음');
  $('salvage-'+i).disabled=!!protection||state.phase!=='camp'&&!state.paused;$('salvage-'+i).textContent=protection?protection+' 보호':'분해 +'+game.salvageValue(item);
 }
 refreshBagDetailReading();refreshEquipmentWorkshop();
}
function workshopSelected(){return inventoryOpen&&inventoryPanel==='gear'&&!bagOrganizing&&bagSelectedId!==null?profile.inventory.find(i=>i.id===bagSelectedId):null;}
function refreshEquipmentWorkshop(){
 const item=workshopSelected(),active=!!item&&workshopItemId===item.id&&inventoryOpen&&inventoryPanel==='gear';
 $('bag-detail').setAttribute('data-workshop',String(active));$('item-workshop').hidden=!active;$('item-workshop-open').hidden=!item||active;
 $('item-workshop-open').textContent=item?.rerollCandidate?'결과 확인':game.isSeal(item)?'인장 성장':'강화';if(!active)return;
 const enhance=game.enhancementStatus(profile,item.id),reroll=game.rerollStatus(profile,item.id),promotion=game.promotionStatus(profile,item.id),ranges=game.itemRollRanges(item),pending=item.rerollCandidate,mode=workshopMode==='reroll',promoting=workshopMode==='promote',level=game.enhancementLevel(item),cap=game.enhancementCap(item.rarity),preview=promotion.preview;
 for(const tab of ['enhance','promote','reroll'])$('workshop-tab-'+tab).setAttribute('aria-pressed',String(workshopMode===tab));$('workshop-tab-promote').disabled=item.rarity>=4;
 $('workshop-status').textContent='개별 강화 +'+level+' / '+cap+' · '+(promoting?'다음 등급 +0으로 승급':mode?'기본 수치만 변경 · 강화 추가 유지':'기본 + 강화 추가 = 최종 능력치');
 $('workshop-new-label').textContent=promoting?'승급 후 합계':mode?'새 합계':'강화 후 합계';$('workshop-base-label').textContent=promoting?'기본 → 승급 후':mode&&pending?'기본 → 새 수치':'기본 / 범위';
 for(const [key]of ITEM_AFFIX_FIELDS){
  const has=Object.hasOwn(item.affixes,key),next=promoting?preview?.affixes:mode?pending?.affixes:null,shown=has||!!next&&Object.hasOwn(next,key),r=ranges[key],suffix=['speed','crit','reduction'].includes(key)?'%':'',bonus=game.enhancementBonus(item,key);$('workshop-stat-'+key).hidden=!shown;
  $('workshop-bonus-'+key).textContent=shown?(promoting?'+'+bonus+'→0':'+'+bonus)+suffix:'';
  $('workshop-value-'+key).textContent=!shown?'':next?(has?item.affixes[key]:'—')+'→'+next[key]+suffix:item.affixes[key]+suffix+(r?' ['+r.min+'~'+r.max+']':'');
  $('workshop-next-'+key).textContent=!shown?'':promoting?(next?next[key]+suffix:'—'):mode?(next?Math.round((next[key]+bonus)*100)/100+suffix:'—'):(Math.round((item.affixes[key]+bonus+(level<cap?item.affixes[key]*.03:0))*100)/100+suffix);
 }
 const status=promoting?promotion:mode?reroll:enhance,cost=status.cost,percent=n=>Math.round(n*10000)/100;
 const chanceText=level===cap?'최대 강화 달성':enhance.mode==='incremental'?'고대 · 성공률 '+percent(enhance.chance)+'% · 보정 '+enhance.failures+'/'+enhance.maxBonusFailures:enhance.mode==='none'?'제작 · 성공률 '+percent(enhance.chance)+'% · 보정·보장 없음':(enhance.guaranteed?'이번 시도 확정 성공':(item.rarity===6?'제작':game.RARITIES[item.rarity])+' · 성공률 '+percent(enhance.chance)+'%')+' · 실패 '+enhance.failures+'회 · 보장까지 '+enhance.remaining+'회';
 $('workshop-chance').textContent=promoting?(preview?game.RARITIES[item.rarity]+' +'+cap+' → '+game.RARITIES[preview.rarity]+' +0 · 승급 100%':promotion.reason):mode?(pending?(Number.isInteger(pending.powerRoll)?'효과 위력 '+game.raidPowerRoll(item)+'%→'+pending.powerRoll+'% · ':'')+(game.isPerfectRoll({...item,powerRoll:pending.powerRoll??item.powerRoll},pending.affixes)?'새 수치: 모든 옵션 최댓값 · 극옵':'새 수치를 확인하고 적용 여부를 선택하세요.'):'기본 수치만 재설정 · 누적 강화 수치는 유지'+(item.rarity===5&&game.ancientDefinition(item)?.raid?' · 효과 위력도 다시 굴림':'')):chanceText;
 $('workshop-cost').textContent=cost?(pending&&mode?'이미 지불한 비용 · ':'시도 비용 · ')+cost.gold+' 골드'+(cost.cores?' · 핵 '+cost.cores:'')+Object.entries(cost.materials).map(([k,v])=>' · '+game.MATERIAL_BY_ID[k].name+' '+v).join(''):'';
 $('workshop-cost').hidden=!mode;$('workshop-enhance-cost').hidden=mode||!cost;$('workshop-enhance-cost').setAttribute('aria-label',promoting?'1회 승급 비용':'1회 강화 비용');
 if(!mode&&cost){
  $('workshop-enhance-cost').setAttribute('data-wide',String(Object.keys(cost.materials).length>3));$('workshop-gold-amount').textContent=cost.gold.toLocaleString('ko-KR');{const info='골드 · 보유 '+profile.gold.toLocaleString('ko-KR')+' / 필요 '+cost.gold.toLocaleString('ko-KR');$('workshop-gold-cost').setAttribute('title',info);$('workshop-gold-cost').setAttribute('aria-label',info);}$('workshop-gold-cost').setAttribute('data-ready',String(profile.gold>=cost.gold));
  for(const m of game.MATERIALS){const node=$('workshop-cost-'+m.id),need=cost.materials[m.id],have=profile.materials[m.id];node.hidden=!need;if(need){$('workshop-amount-'+m.id).textContent=need.toLocaleString('ko-KR');node.setAttribute('data-ready',String(have>=need));const info=m.name+' · 보유 '+have+'개 / 필요 '+need+'개 · '+m.where;node.setAttribute('title',info);node.setAttribute('aria-label',info+' · 수집처 확인');}}
 }
 $('workshop-note').textContent=promoting?'기본 옵션 품질을 다음 등급에 반영. 강화·추가 수치·실패 횟수는 초기화.':mode?(item.rarity<4?'신화 · 고대 · 제작 장비부터 사용할 수 있어.':pending?'새로고침해도 결과가 유지돼. 기존 수치를 유지해도 작업 비용은 돌아오지 않아.':'기본 수치는 낮아질 수 있어. 강화 추가는 유지돼. 새 합계를 보고 선택해.'):level===cap?(item.rarity<4?'이 등급의 최대 강화 달성 · 승급 탭에서 다음 등급으로.':'이 장비의 최대 강화 달성 · 추가 승급 없음.'):enhance.mode==='incremental'?'실패마다 +'+percent(enhance.bonusPerFailure)+'%p · 최대 '+enhance.maxBonusFailures+'회. 기본 '+percent(enhance.baseChance)+'% + 보정 '+percent(enhance.bonusChance)+'%p. 성공 시 보정 초기화 · 확정 성공 없음.':enhance.mode==='none'?'확률 보정·보장 성공 없음. 실패 시 단계 유지. 성공 시 기본 수치 3%를 추가.':'성공 시 기본 수치 3%를 추가. 하락·파괴 없음. '+enhance.attempts+'번째 시도 보장.';
 $('workshop-feedback').textContent=workshopFeedback||status.reason;
 $('workshop-enhance').hidden=mode||promoting;$('workshop-enhance').disabled=!enhance.ok||state.phase!=='camp';$('workshop-enhance').textContent=level===cap?'최대 +'+cap:enhance.guaranteed?'확정 강화 +'+enhance.target:'강화 시도 +'+enhance.target;
 $('workshop-promote').hidden=!promoting;$('workshop-promote').disabled=!promotion.ok||state.phase!=='camp';$('workshop-promote').textContent=preview?game.RARITIES[preview.rarity]+'로 승급 · +0':'승급 없음';
 $('workshop-reroll').hidden=!mode||!!pending;$('workshop-reroll').disabled=!reroll.ok||state.phase!=='camp';
 $('workshop-apply').hidden=!mode||!pending;$('workshop-keep').hidden=!mode||!pending;$('workshop-apply').disabled=$('workshop-keep').disabled=state.phase!=='camp';
}
$('item-workshop-open').addEventListener('click',()=>{const item=workshopSelected();if(!item)return;
 // Alpha 0.136: seals grow on the boss rush tab, not in the workshop.
 if(game.isSeal(item)){if(state.phase!=='camp')return;selectedSealId=item.id;dungeonMode='rush';sealFeedback='';openDungeons();return;}workshopItemId=item.id;workshopMode=item.rerollCandidate?'reroll':item.rarity<4&&game.enhancementLevel(item)===game.enhancementCap(item.rarity)?'promote':'enhance';workshopFeedback='';bagRenderKey='';updateHud();$('workshop-back').focus({preventScroll:true});});
$('workshop-back').addEventListener('click',()=>{workshopItemId=null;bagRenderKey='';updateHud();$('item-workshop-open').focus({preventScroll:true});});
for(const m of game.MATERIALS)$('workshop-cost-'+m.id).addEventListener('click',()=>{
 const item=workshopSelected();if(!item||workshopItemId!==item.id||workshopMode==='reroll')return;
 const status=workshopMode==='promote'?game.promotionStatus(profile,item.id):game.enhancementStatus(profile,item.id);if(!status.cost?.materials[m.id])return;
 workshopFeedback=m.name+' · 보유 '+profile.materials[m.id]+'개 · '+m.where;bagRenderKey='';updateHud();
});
for(const mode of ['enhance','promote','reroll'])$('workshop-tab-'+mode).addEventListener('click',()=>{const item=workshopSelected();if(workshopItemId!==bagSelectedId||!item||mode==='promote'&&item.rarity>=4)return;workshopMode=mode;workshopFeedback='';bagRenderKey='';updateHud();});
for(const action of ['enhance','promote','reroll','apply','keep'])$('workshop-'+action).addEventListener('click',()=>{
 const item=workshopSelected();if(!item||workshopItemId!==item.id)return;
 const result=action==='enhance'?game.enhanceItem(state,item.id):action==='promote'?game.promoteItem(state,item.id):action==='reroll'?game.rerollItem(state,item.id):game.resolveItemReroll(state,item.id,action==='apply');
 if(result.ok){if(action==='promote')workshopMode='enhance';save();}workshopFeedback=result.reason;bagRenderKey='';updateHud();if(action==='promote'&&result.ok)$('workshop-enhance').focus({preventScroll:true});
});
let preparationKey='';
function refreshPreparation(){
 const points=game.skillPoints(profile),key=profile.inventory.length+':'+game.growthPoints(profile)+':'+points+':'+state.run.autoSalvaged+':'+state.phase;
 if(key===preparationKey)return;preparationKey=key;
 $('result-prepare-title').textContent=state.phase==='defeat'?'재도전 전 정비':'다음 사냥 전 정비';
 for(const where of ['map','result']){
  $(where+'-prepare-gear-note').textContent='보관 '+profile.inventory.length+'/'+game.INVENTORY_LIMIT+' · 장비와 시너지 확인';
  $(where+'-prepare-growth-note').textContent='남은 포인트 '+growthBudget();
  $(where+'-prepare-skills-note').textContent='남은 스킬 강화 '+points+'포인트';
 }
 $('result-storage-note').textContent='보관 '+profile.inventory.length+'/'+game.INVENTORY_LIMIT+' · 이번 사냥 자동 정리 '+state.run.autoSalvaged+'개';
}
for(const where of ['map','result'])for(const target of (where==='result'?['gear','growth']:['gear','growth','skills']))$(where+'-prepare-'+target).addEventListener('click',()=>{
 if(!ready||state.phase!=='camp'&&!game.resultReady(state))return;
 if(state.phase!=='camp')returnCamp();
 if(target==='gear')openInventory('equipment');else if(target==='growth')openCampDrawer('growth','nav-hunt');else openSkills('nav-skills');
});
// Alpha 0.141 (사용자 요청 '전술 보상 창 없애'): the 전술 · 보스 보상 drawer is gone; its entries open the hunting map,
// which already has the difficulty pills and the boss reward preview.
function openCampDrawer(name,origin){if(!ready||state.phase!=='camp')return;if(name==='tactics')name='map';launchRevision++;campDrawer=name;campDrawerOrigin=origin;$('growth-feedback').textContent='';updateHud();if(name==='tactics')window.hunterPages?.first($('camp-tactics-panel'));$('page-back').focus({preventScroll:true});}
function closeCampDrawer(){launchRevision++;if(campDrawer==='tactics'){campDrawer='map';campDrawerOrigin='nav-hunt';updateHud();$('camp-tactics-open').focus({preventScroll:true});return;}const origin=campDrawerOrigin;campDrawer='';updateHud();$(origin).focus({preventScroll:true});}
$('hub-map').addEventListener('click',()=>openCampDrawer('map','hub-map'));
$('hub-route').addEventListener('click',()=>openCampDrawer('map','hub-route'));
$('hub-growth').addEventListener('click',()=>openCampDrawer('growth','hub-growth'));
$('camp-drawer-close').addEventListener('click',closeCampDrawer);
$('camp-map-start').addEventListener('click',()=>{if(ready&&state.phase==='camp'&&campDrawer==='map')start();});
let mapSceneKey='';
// Alpha 0.132 별: ★ 획득 / ☆ 미획득 (클리어 · 30초 · 20초, 보스는 체력 50%; 0.134), 챕터 별 상자 10·20·30.
const starText=mask=>[1,2,4].map(b=>mask&b?'★':'☆').join('');
let starNote='',starNoteChapter=0;
function starRewardText(r){const m=Object.entries(r.materials).map(([id,n])=>game.MATERIAL_BY_ID[id].name+' '+n);return ['골드 '+r.gold.toLocaleString('ko-KR'),'괴수 핵 '+r.cores,...m,...(r.growthPoints?['트리 포인트 +'+r.growthPoints]:[])].join(' · ');}
function refreshStarChests(selected){
 if(starNoteChapter!==selected.id){starNoteChapter=selected.id;starNote='';}
 const total=game.chapterStars(profile,selected.id);$('map-star-count').textContent=total+' / '+game.MAX_CHAPTER_STARS;
 for(let t=1;t<=3;t++){const b=$('star-chest-'+t),status=game.chestStatus(profile,selected.id,t),claimed=game.chestClaimed(profile,selected.id,t),state=claimed?'claimed':status?'locked':'ready';b.setAttribute('data-state',state);$('star-chest-state-'+t).textContent=claimed?'수령':status?'잠김':'열기';b.setAttribute('aria-label','별 '+game.STAR_CHEST_STARS[t-1]+'개 상자 · '+(status||'열 수 있음'));}
 $('map-star-note').textContent=starNote;
}
for(let t=1;t<=3;t++)$('star-chest-'+t).addEventListener('click',()=>{if(!ready||state.phase!=='camp'||campDrawer!=='map')return;const chapter=selectedStage,reward=game.claimStarChest(state,chapter,t);
 if(reward){starNote='★'+game.STAR_CHEST_STARS[t-1]+' 상자 획득: '+starRewardText(reward);save();}
 else starNote='★'+game.STAR_CHEST_STARS[t-1]+' 상자 ('+game.chestStatus(profile,chapter,t)+'): '+starRewardText(game.starChestReward(chapter,t,game.STAGES[chapter-1].multiplier));
 mapSceneKey='';updateHud();});
function refreshMapScene(selected,plan,species,completed,limit){
 if(campDrawer!=='map')return;
 const key=[selectedStage,selectedRunStage,selectedDifficulty,completed,limit,profile.stageStars[selectedStage-1],profile.starChests[selectedStage-1],starNote].join(':');
 if(key===mapSceneKey)return;mapSceneKey=key;
 $('map-banner-stage').textContent='STAGE '+String(selectedRunStage).padStart(2,'0')+' · '+plan.name;
 $('map-enemy-name').textContent=MONSTERS[species].name;
 $('map-scene-progress').textContent=completed+' / '+game.STAGES_PER_CHAPTER;
 refreshStarChests(selected);
 const boss=selectedRunStage===game.STAGES_PER_CHAPTER,mode=game.HUNT_MODES[selectedDifficulty];
 $('camp-map-panel').setAttribute('data-boss',String(boss));$('map-boss-rewards').hidden=!boss;
 $('map-boss-gold').textContent='+'+Math.round(selected.reward*game.modeScale(selected.id,selectedDifficulty).reward).toLocaleString('ko-KR');
 $('map-boss-cores').textContent='+'+game.bossCores(selected.id,selectedDifficulty);
 for(let n=1;n<game.STAGES_PER_CHAPTER;n++)$('map-path-'+n).setAttribute('data-open',String(n<limit));
 for(const slot of ['weapon','armor','charm']){
  const rewardSlot=slot==='charm'?'helmet':slot;const row=game.ITEM_CATALOG.find(r=>r.set===selected.set&&r.slot===rewardSlot),set=game.EQUIPMENT_SETS[selected.set];
  gearThumbnail($('map-reward-'+slot),{...row,catalogId:row.id,rarity:0},48,true);
  $('map-reward-'+slot).setAttribute('title',set.name+' 세트 · '+game.SLOTS[rewardSlot]+' · '+row.name+' · 일반 등급 드롭');
 }
}
function refreshCampScene(selected){
 if(campDrawer!=='more'&&(backupCandidate||backupReading))cancelBackup();
 $('home-portrait').hidden=!!campDrawer;$('home-profile').hidden=!!campDrawer;$('camp-content').setAttribute('data-drawer',campDrawer);$('game-shell').setAttribute('data-camp-view',campDrawer||'home');$('page-title').textContent=campDrawer==='dungeons'?'성장 던전':campDrawer==='map'?'사냥 지도':campDrawer==='tactics'?'전술 · 보상':campDrawer==='growth'?'성장':campDrawer==='skills'?'스킬 · 빌드':'더보기';refreshHomeDashboard(selected);
 $('hub-route-name').textContent=selected.name+' · '+game.battlePlan(selectedRunStage).name;
 $('hub-route-meta').textContent='CHAPTER '+String(selected.id).padStart(2,'0')+' · STAGE '+String(selectedRunStage).padStart(2,'0')+' · '+game.HUNT_MODES[selectedDifficulty].name;
 $('camp-map-launch').hidden=campDrawer!=='map';$('camp-map-start').disabled=!ready||state.phase!=='camp';$('camp-map-launch-name').textContent=$('hub-route-name').textContent;$('camp-map-launch-meta').textContent=$('hub-route-meta').textContent;
 $('camp-drawer').hidden=!campDrawer;$('hub-ui').hidden=!!campDrawer;$('camp-map-panel').hidden=campDrawer!=='map';$('camp-tactics-panel').hidden=campDrawer!=='tactics';$('tactics-launch').hidden=campDrawer!=='tactics'||selectedStage>profile.clearedStage;$('camp-growth-panel').hidden=campDrawer!=='growth';
 $('camp-dungeons-panel').hidden=campDrawer!=='dungeons';if(campDrawer==='dungeons')refreshDungeons();
 $('camp-drawer-title').textContent=campDrawer==='dungeons'?'성장 던전':campDrawer==='skills'?'스킬 · 빌드':campDrawer==='growth'?'리리안 성장':campDrawer==='more'?'더보기':campDrawer==='tactics'?'전술 · 보스 보상':'사냥터 선택';$('camp-skills-panel').hidden=campDrawer!=='skills';refreshSkills();$('camp-more-panel').hidden=campDrawer!=='more';$('nav-more').setAttribute('aria-expanded',String(campDrawer==='more'));$('more-track').disabled=!game.targetCraft(profile);$('more-track-note').textContent=game.targetCraft(profile)?'제작 목표 · '+game.targetCraft(profile).name:'재료를 얻는 곳과 쓰는 곳';$('camp-map-launch-tactic').textContent=game.battlePlan(selectedRunStage).tactic;
 for(const id of ['hub-map','hub-route','hub-growth','nav-hunt'])$(id).setAttribute('aria-expanded',String(campDrawer===(id==='hub-growth'?'growth':'map')));
}
// A physical pointer acts on press. Its later click is compatibility delivery,
// not a second command; keyboard/assistive activation still arrives as detail 0.
function combatClick(action){return event=>{if(!event.detail)action();};}
function combatPress(action){return event=>{if(event.button>0)return;event.preventDefault();action();};}
$('attack').addEventListener('click',combatClick(doAttack));
for(const [id,action]of [['dash',doDash],['thunder',doThunder]]){
 $(id).addEventListener('pointerdown',combatPress(action));
 $(id).addEventListener('click',combatClick(action));
}
$('pause').addEventListener('click',togglePause);$('camp-button').addEventListener('click',()=>{if(state.phase==='playing'){state.paused=true;audio.suspend();clearInput();save();updateHud();}});
function pauseMenuActive(){return !orientationBlocked&&state.phase==='playing'&&state.paused&&!inventoryOpen&&!trackOpen;}
$('resume').addEventListener('click',()=>{if(!pauseMenuActive())return;audio.unlock();state.paused=false;clearInput();canvas.focus({preventScroll:true});updateHud();});
$('retreat').addEventListener('click',()=>{if(pauseMenuActive())returnCamp();});$('result-camp').addEventListener('click',()=>{if(game.resultReady(state))returnCamp();});
$('next-stage').addEventListener('click',()=>state.run.raidId?startRaid(state.run.raidId):state.run.rush?startRush():state.run.dungeonId?startDungeon(state.run.dungeonId,state.run.stage):state.phase==='defeat'?start(state.stageId,state.run.stage,state.difficulty):state.difficulty?start(state.stageId,1,state.difficulty):start(Math.min(game.STAGES.length,state.stageId+1),1,0));
for(let n=1;n<=game.STAGES_PER_CHAPTER;n++)$('run-stage-'+n).addEventListener('click',()=>{if(ready&&state.phase==='camp'&&n<=game.stageLimit(profile,selectedStage,selectedDifficulty)){launchRevision++;selectedRunStage=n;updateHud();}});
$('auto').addEventListener('click',()=>{if(orientationBlocked)return;skillMode=skillMode==='auto'?'manual':'auto';try{localStorage.setItem(SKILL_MODE_KEY,skillMode);}catch{}canvas.focus({preventScroll:true});updateHud();});
for(const id of ['attack']){
  const button=$(id);
  button.addEventListener('pointerdown',event=>{if(event.button>0)return;event.preventDefault();if(!ready||state.phase!=='playing'||state.paused)return;button.setPointerCapture(event.pointerId);audio.unlock();manual();heldAttacks.add(event.pointerId);game.attack(state,currentAim());});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,event=>heldAttacks.delete(event.pointerId));
}
function moveStick(event){
  const v=stickVector(event.clientX,event.clientY,joystick.getBoundingClientRect());
  touch=[v.x,v.y];stickThumb.style.transform=`translate(${v.thumbX}px,${v.thumbY}px)`;
}
joystick.addEventListener('pointerdown',event=>{
  event.preventDefault();if(!ready||state.phase!=='playing'||state.paused||joystickId!==null)return;
  joystick.setPointerCapture(event.pointerId);joystickId=event.pointerId;joystick.setAttribute('data-active','true');
  audio.unlock();manual();moveTarget=null;attackTarget=null;aim=null;moveStick(event);
});
joystick.addEventListener('pointermove',event=>{if(event.pointerId!==joystickId)return;event.preventDefault();moveStick(event);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(name,event=>{if(event.pointerId===joystickId)releaseJoystick();});
document.addEventListener('keydown',event=>{
  if(orientationBlocked)return;
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.key==='Tab'&&pauseMenuActive()){event.preventDefault();const active=document.activeElement;const next=active===$('resume')?'retreat':active===$('retreat')?'resume':event.shiftKey?'retreat':'resume';$(next).focus({preventScroll:true});return;}
  // A Space held for combat must not click the result button after focus changes.
  if(event.key===' '&&suppressHeldSpace){if(event.repeat){event.preventDefault();return;}suppressHeldSpace=false;}
  if(event.key==='Escape'){event.preventDefault();if(!$('stats-sheet').hidden){closeStatsSheet();}else if(campDrawer){closeCampDrawer();}else if(trackOpen){closeTrack();}else if(craftOpen){craftOpen=false;updateHud();}else if(codexOpen){if(codexDetailOpen)closeCodexDetail();else{codexOpen=false;updateHud();}}else if(inventoryOpen){if(bagSelectedId!==null)closeBagDetail();else if(inventoryPanel==='build')setInventoryPanel('gear');else{inventoryOpen=false;updateHud();}}else if(campChoices){campChoices=false;updateHud();}else togglePause();return;}
  if(event.key.toLowerCase()==='i'){event.preventDefault();openInventory();return;}
  if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(event.target?.tagName)||event.target?.isContentEditable)return;
  // Live hunts move, attack and dodge automatically, so only skills and pickup stay on keys.
  // The manual path below remains for engine/render QA when state.auto is switched off.
  const k=event.key.toLowerCase();if(state.auto&&!['f','e','r','t'].includes(k))return;
  if(!['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright',' ','shift','q','f','e','r','t'].includes(k))return;
  event.preventDefault();if(!ready||state.phase!=='playing'||state.paused)return;
  audio.unlock();manual();keys.add(k);moveTarget=null;attackTarget=null;
  if(!event.repeat&&['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(k))aim=null;
  if(!event.repeat&&['e','r','t','f','g','h'].includes(k))useCombatSkill(['e','r','t','f','g','h'].indexOf(k));
  if(!event.repeat&&k==='shift')doDash();if(!event.repeat&&k==='q')doThunder();
});
document.addEventListener('keyup',event=>{keys.delete(event.key.toLowerCase());if(event.key===' '&&suppressHeldSpace){suppressHeldSpace=false;event.preventDefault();}});
// Alpha 0.135.5 (사용자 요청): losing focus or hiding the tab no longer pauses the hunt. Input is released and the game is
// saved; a hidden tab simply stops advancing (the loop skips hidden frames, previous=0 drops the gap) and continues on return.
function suspend(){audio.suspend();clearInput();previous=0;save();updateHud();}
window.addEventListener('blur',()=>{clearInput();save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else if(state.phase==='playing')audio.unlock();previous=0;});
window.addEventListener('pagehide',suspend);

function pointerPoint(event){
  const b=canvas.getBoundingClientRect();
  if(b.width<=0||b.height<=0||!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return {x:-1,y:-1};
  return {x:(event.clientX-b.left)*viewport.width/b.width,y:(event.clientY-b.top)*viewport.height/b.height};
}
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointermove',event=>{if(!ready||state.phase!=='playing'||state.paused||event.pointerType==='touch')return;const point=pointerPoint(event);if(point.x<0||point.y<0||point.x>viewport.width||point.y>viewport.height){aim=null;return;}aimRevision++;aim=point;});
for(const name of ['pointerleave','pointercancel'])canvas.addEventListener(name,()=>{aim=null;});
canvas.addEventListener('pointerdown',event=>{
  if(state.auto){canvas.focus({preventScroll:true});return;}
  if(!ready||state.phase!=='playing'||state.paused)return;
  if(event.pointerType==='touch'&&joystickId!==null)return;
  const point=pointerPoint(event);if(point.x<0||point.y<0||point.x>viewport.width||point.y>viewport.height)return;
  const world=screenToWorld(point,camera,state.bounds);audio.unlock();if(event.button===2){aimRevision++;aim=point;doThunder();return;}manual();keys.clear();releaseJoystick();
  const enemy=state.enemies.filter(e=>{const foot=worldToScreen(e,camera);return !e.dead&&Math.abs(point.x-foot.x)<(e.boss?90:60)&&point.y<foot.y+25&&point.y>foot.y-enemyHeight(e);}).sort((a,b)=>b.y-a.y)[0];
  const core=state.barrels.find(b=>{const foot=worldToScreen(b,camera);return b.status==='idle'&&Math.abs(point.x-foot.x)<40&&point.y>foot.y-70&&point.y<foot.y+20;});
  attackTarget=enemy?.id??core?.id??null;pursuitInRange=false;moveTarget=world;aim=null;canvas.focus({preventScroll:true});
});
function input(){
  let v=moveVector(),wantAttack=keys.has(' ')||heldAttacks.size>0,destination=null,stopDistance=0;
  if(attackTarget){const e=state.enemies.find(e=>e.id===attackTarget&&!e.dead)??state.barrels.find(b=>b.id===attackTarget&&b.status==='idle');if(!e){attackTarget=null;moveTarget=null;aim=null;pursuitInRange=false;}else{
    moveTarget={x:e.x,y:e.y};const range=game.playerStats(profile).range,d=distance(e,state.player);stopDistance=range*.82;
    pursuitInRange=d<=stopDistance+game.ARRIVAL_EPSILON||pursuitInRange&&d<range*.98;
    if(pursuitInRange){v={x:0,y:0};wantAttack=true;return{...v,attack:wantAttack,aim:currentAim(v),aimRevision,skillMode,skillRequest:skillRequest?.id};}
  }}
  if(!v.x&&!v.y&&moveTarget){const dx=moveTarget.x-state.player.x,dy=moveTarget.y-state.player.y,d=Math.hypot(dx,dy);if(d<8){moveTarget=null;}else{v={x:dx/d,y:dy/d};destination=moveTarget;}}
  return {...v,viewportWidth:viewport.width,viewportHeight:viewport.height,attack:wantAttack,aim:state.auto?undefined:currentAim(v),aimRevision,destination,stopDistance,skillMode,skillRequest:skillRequest?.id};
}

// Ground coordinates are projected once; upright art and labels keep their screen height.
function uprightAt(x,y){ctx.save();ctx.translate(x,y);ctx.scale(1,1/GROUND_DEPTH_SCALE);ctx.translate(-x,-y);}
function label(text,x,y,footY=y){uprightAt(x,footY);ctx.fillText(text,x,y);ctx.restore();}
function enemyHeight(e){const base=MONSTERS[e.species]?.height;return base?(e.elite?base*1.18:base):e.boss?270:e.elite?185:e.type==='bulwark'?155:e.type==='spitter'?106:88;}
// Mild depth cues on upright billboards, anchored at their ground contact.
function sceneDepthScale(y){return clamp(.88+.2*((y-camera.y)*GROUND_DEPTH_SCALE/viewport.height),.86,1.1);}
function shadow(x,y,r){r*=sceneDepthScale(y);ctx.save();ctx.fillStyle='#25221d30';ctx.beginPath();ctx.ellipse(x+12,y+11,r*1.08,r*.48,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#161c1a55';ctx.beginPath();ctx.ellipse(x,y+1,r*.65,r*.14,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function sprite(id,time,x,y,height,facing=1,alpha=1,rotation=0,index=null,flash=0){
  const clip=manifest.clips[id],frame=frameRect(clip,index??frameIndex(clip,time));const scale=height/(frame.bodyHeight||clip.bodyHeight||frame.h);
  ctx.save();ctx.translate(x,y);if(rotation)ctx.rotate(rotation);ctx.scale(facing*(clip.flipX?-1:1)*scale,scale);ctx.globalAlpha=alpha;
  // Filter minification; magnified low-resolution monsters must not receive a blur pass.
  ctx.imageSmoothingEnabled=scale*Math.max(renderScaleX,renderScaleY)<=1;
  ctx.drawImage(images.get(clip.image),frame.x,frame.y,frame.w,frame.h,-frame.pivotX,-frame.pivotY,frame.w,frame.h);
  if(flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*Math.min(.7,flash*.65);ctx.drawImage(images.get(clip.image),frame.x,frame.y,frame.w,frame.h,-frame.pivotX,-frame.pivotY,frame.w,frame.h);}
  ctx.restore();
}
function actorSprite(actor,a,height,alpha=1,offsetX=0,offsetY=0,flash=0,forcedSkillPose=null){
  height*=sceneDepthScale(a.y);
  const isHunter=actor==='hunter',skillPose=isHunter?(forcedSkillPose??(a.kind==='player'?game.skillActorPose(state,a):null)):null;
  const heading=skillPose?.heading??actorHeading(a),view=DIRECTION_VIEWS[heading];
  let action=isHunter?'idle':'walk',frame=0;
  const skin=a.species&&manifest.directions[a.species]?a.species:null;
  if(skin){
    action=a.dead?'death':['windup','hurt','stagger'].includes(a.action)?'attack':a.action==='attack'&&a.actionTime<.12?'attack':'walk';
    if(a.action==='attack'&&action==='attack')frame=1;
    else if(action==='walk'&&a.moving){const clip=manifest.clips[directionalClipId(manifest,skin,'walk',heading)];frame=walkingFrame(a.motionDistance??0,70,clip.frames.length,!!a.backpedal);}
    const id=directionalClipId(manifest,skin,action,heading);uprightAt(a.x+offsetX,a.y+offsetY);sprite(id,0,a.x+offsetX,a.y+offsetY,height,view.mirror,alpha,0,frame,flash);ctx.restore();return;
  }
  if(isHunter&&['attack','heavy'].includes(a.action)){action=swingMotion(a);const clip=manifest.clips[directionalClipId(manifest,actor,action,heading)];frame=attackFrame(a.actionTime,a.swing.impact,a.swing.duration,clip.frames.length);}
  else if(actor==='skitter'&&['windup','attack','hurt','death'].includes(a.action)){action=a.action==='windup'?'attack':a.action;frame=skitterFrame(a.action,a.actionTime,a.windup);}
  else if(!isHunter&&manifest.directions[actor].attack&&['windup','attack'].includes(a.action)){action='attack';frame=a.action==='windup'?0:1;}
  else if(a.action==='walk'&&a.moving!==false){action='walk';frame=walkingFrame(a.motionDistance??0,isHunter?76:actor==='bulwark'?60:70,4,!!a.backpedal);}
  else if(isHunter&&['dash','hurt','death'].includes(a.action)){action=a.action;const clip=manifest.clips[directionalClipId(manifest,actor,action,heading)];frame=actionFrame(action,a.actionTime??0,clip.frames.length);}
  else if(isHunter&&a.action==='idle')frame=frameIndex(manifest.clips[directionalClipId(manifest,actor,'idle',heading)],a.actionTime??0);
  if(skillPose){action=skillPose.action;const clip=manifest.clips[directionalClipId(manifest,actor,action,heading)];frame=clamp(skillPose.frame,0,clip.frames.length-1);offsetX+=skillPose.offsetX;offsetY+=skillPose.offsetY;}
  else if(isHunter&&a.swing?.skillVisualOnly&&['attack','heavy'].includes(a.action)){action='idle';frame=0;}
  const id=directionalClipId(manifest,actor,action,heading);
  uprightAt(a.x+offsetX,a.y+offsetY);
  if(skillPose){ctx.translate(a.x+offsetX,a.y+offsetY);ctx.translate(0,-skillPose.lift);ctx.scale(1,skillPose.scaleY);ctx.translate(-a.x-offsetX,-a.y-offsetY);}
  const drawingAppearance=a.skillEquipment?skillAppearance(a.skillEquipment):isHunter&&['attack','heavy'].includes(a.action)?designsForSwing(a.swing):appearance;
  if(isHunter)drawEquipmentAura(ctx,drawingAppearance,a.x+offsetX,a.y+offsetY,height,alpha,a.actionTime??0);
  sprite(id,0,a.x+offsetX,a.y+offsetY,height,view.mirror,alpha,0,frame,flash);
  ctx.restore();
}
function cleaveVisual(a){
  const swing=a.swing,v=slashPresentation(a.actionTime,swing,a.attackHit);if(!v)return;
  const x=swing.contactX??a.x,y=swing.contactY??a.y;
  if(v.motion==='finisher'){
    const tx=x+swing.x*88,ty=y-26+swing.y*55,fade=1-v.t;
    ctx.save();ctx.globalAlpha=fade;ctx.fillStyle=COMBAT_INK.rose;ctx.beginPath();ctx.moveTo(tx-7,ty-112*fade);ctx.lineTo(tx+8,ty-85*fade);ctx.lineTo(tx+5,ty+10);ctx.lineTo(tx-4,ty+6);ctx.closePath();ctx.fill();
    ctx.fillStyle=COMBAT_INK.silver;ctx.fillRect(tx-2,ty-65*fade,4,65*fade+6);ring(x+swing.x*88,y+swing.y*55,28+v.t*70,'#d999a3',3*fade);
    for(let i=0;i<6;i++){const angle=i*Math.PI/3;ctx.fillStyle=i%2?'#e4a1a6':'#f6dccd';ctx.fillRect(tx+Math.cos(angle)*v.t*75,ty+Math.sin(angle)*v.t*35-8*fade,4,4);}ctx.restore();
  }else{
    ctx.save();ctx.translate(x+swing.x*70,y-58+swing.y*30);ctx.rotate(v.angle);ctx.scale(1,v.flipY);
    sprite('fx_cleave_sequence',0,0,0,swing.counter?230:150,1,(1-v.t*.6)*.4,0,v.frame);
    ctx.globalAlpha=(1-v.t)*.85;ctx.lineCap='round';ctx.strokeStyle=COMBAT_INK.wine;ctx.lineWidth=swing.counter?12:9;ctx.beginPath();ctx.ellipse(0,0,swing.counter?105:76,36,0,-1.3,1.3);ctx.stroke();ctx.strokeStyle=COMBAT_INK.silver;ctx.lineWidth=swing.counter?4:3;ctx.stroke();ctx.restore();
  }
  drawEquipmentAttack(ctx,designsForSwing(swing),swing,v,x,y);
}
function displayChapter(){return game.STAGES[(state.phase==='camp'?selectedStage:state.stageId)-1];}
// A raid fights on its chapter's ground but loads as its own region (the chapter plus the raid boss atlas).
function displayRegionId(){return state.phase!=='camp'&&state.run.raidId?game.raidRegionId(state.run.raidId,state.stageId):state.phase!=='camp'&&state.run.rush?game.rushRegionId(state.stageId):displayChapter().id;}
function floor(){const chapter=displayChapter(),bleed=.5/Math.min(renderScaleX,renderScaleY*GROUND_DEPTH_SCALE);for(const tile of visibleTiles(camera,state.bounds,manifest.tileSize)){ctx.save();ctx.translate(tile.x-camera.x+tile.size/2,tile.y-camera.y+tile.size/2);ctx.scale(tile.flipX?-1:1,tile.flipY?-1:1);ctx.drawImage(images.get(manifest.chapters[chapter.environment].environment),-tile.size/2-bleed,-tile.size/2-bleed,tile.size+bleed*2,tile.size+bleed*2);ctx.restore();}
}

function prop(p){const clip=manifest.chapterProps,f=clip.frames[p.frame],scale=p.height*1.12*sceneDepthScale(p.y)/f.h;shadow(p.x,p.y,p.height*.22);uprightAt(p.x,p.y);ctx.translate(p.x,p.y);ctx.scale(p.facing*scale,scale);ctx.drawImage(images.get(clip.image),f.x,f.y,f.w,f.h,-f.pivotX,-f.pivotY,f.w,f.h);ctx.restore();}
function ring(x,y,r,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.ellipse(x,y,r,r,0,0,Math.PI*2);ctx.stroke();}
function directionEmblem(x,y,angle,size,color){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineJoin='round';ctx.fillStyle=COMBAT_INK.edge;ctx.strokeStyle=color;ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size*.18,-size*.42);ctx.lineTo(0,0);ctx.lineTo(-size*.18,size*.42);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle=COMBAT_INK.silver;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(size*.18,0);ctx.lineTo(size*.72,0);ctx.stroke();
 ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(-size*.38,-size*.28);ctx.lineTo(-size*.55,0);ctx.lineTo(-size*.38,size*.28);ctx.stroke();ctx.restore();
}
function dropSeal(x,y,rank,r,color){
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.lineWidth=rank>=5?2.5:1.5;
 const petals=DROP_PETALS[rank];
 if(!petals){ring(0,0,r*.7,color,1.5);}else for(let n=0;n<petals;n++){
  const a=-Math.PI/2+n*Math.PI*2/petals,ux=Math.cos(a),uy=Math.sin(a),vx=-uy,vy=ux,base=r*.32,tip=r*(rank>=5?1.12:1);
  ctx.beginPath();ctx.moveTo(ux*base,uy*base*.65);ctx.lineTo(ux*r*.7+vx*r*.22,(uy*r*.7+vy*r*.22)*.65);ctx.lineTo(ux*tip,uy*tip*.65);ctx.lineTo(ux*r*.7-vx*r*.22,(uy*r*.7-vy*r*.22)*.65);ctx.closePath();ctx.stroke();
 }
 if(rank>=5)ring(0,0,r*.8,color,1);ctx.restore();
}
function bossEntrance(q,progress){
 // Progress follows the existing spawn warning, so pause cannot advance it.
 const open=Math.sin(progress*Math.PI*.5),height=55+open*85,color=COMBAT_INK.silver;
 ctx.save();ctx.globalAlpha=.35+progress*.65;ring(q.x,q.y,62+open*12,COMBAT_INK.wine,5);dropSeal(q.x,q.y,5,48+open*12,color);
 uprightAt(q.x,q.y);ctx.lineCap='round';
 for(const side of [-1,1]){const x=q.x+side*(43-open*8);ctx.strokeStyle=COMBAT_INK.rose;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,q.y-12);ctx.lineTo(x-side*10,q.y-height);ctx.lineTo(x-side*23,q.y-height-15);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();}
 for(let n=0;n<6;n++){const t=(progress+n/6)%1,x=q.x+Math.cos(n*Math.PI/3)*44,y=q.y-18-t*height;ctx.globalAlpha=(1-t)*(.4+progress*.6);ctx.fillStyle=n%2?COMBAT_INK.rose:color;ctx.fillRect(x-1,y,2,5);}
 ctx.restore();ctx.restore();
}
function stagePassage(x,y,age){
 if(age<0||age>=.85)return;const t=age/.85;ctx.save();ctx.globalAlpha*=1-t;ring(x,y,30+Math.sqrt(t)*40,COMBAT_INK.wine,4);dropSeal(x,y,3,28+t*28,COMBAT_INK.silver);ctx.restore();
}
function nodes(){for(const q of state.spawns){
  if(q.delay>q.warning||!visibleInCamera(q,camera,100))continue;
  const progress=clamp(1-q.delay/q.warning,0,1),color=q.boss||q.elite?'#efb97b':q.type==='spitter'?'#b5d2e9':q.type==='bulwark'?'#e4ba86':'#c7dbc0';
  ctx.save();ctx.fillStyle=q.boss||q.elite?'#dd987333':'#a9c6ab22';ctx.strokeStyle=color;ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(q.x,q.y,46,46*.65,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ring(q.x,q.y,46*progress,color,3);if(q.boss||q.elite)ring(q.x,q.y,56,color,2);
  if(q.boss)bossEntrance(q,progress);else{uprightAt(q.x,q.y);dropSeal(q.x,q.y-22,q.elite?3:2,18,color);ctx.restore();}ctx.restore();
}}
function core(b){
  if(b.status==='spent'){ctx.fillStyle='#352c2780';ctx.fillRect(b.x-14,b.y-8,28,8);return;}
  shadow(b.x,b.y,24);uprightAt(b.x,b.y);ctx.drawImage(images.get(manifest.loot),b.x-30,b.y-65,60,60);ctx.restore();ring(b.x,b.y,35,b.status==='armed'?'#ffd58f':'#ca926bc0',3);
  ctx.fillStyle=b.status==='armed'?'#ffcf83':'#d7ba92';ctx.font='bold 11px "Hunter UI", sans-serif';ctx.textAlign='center';if(b.status==='armed')label('폭발 임박',b.x,b.y+20,b.y);
  if(b.status==='armed'){ctx.fillStyle='#d35d282b';ctx.beginPath();ctx.ellipse(b.x,b.y,b.radius,b.radius*.65,0,0,Math.PI*2);ctx.fill();ring(b.x,b.y,b.radius,'#f4b769',3);}
}
function defeatVisual(x,y,age,elite=false,boss=false){
 const duration=boss?1.05:elite?.6:.42;if(age<0||age>=duration)return;
 const t=age/duration,fade=1-t,r=boss?72:elite?34:22,count=boss?12:elite?7:4;
 ctx.save();ctx.globalAlpha*=fade;ring(x,y,r*(.65+Math.sqrt(t)),COMBAT_INK.wine,boss?6:3);ring(x,y,r*(.65+Math.sqrt(t)),COMBAT_INK.silver,boss?2:1);
 uprightAt(x,y);const cy=y-(boss?95:45);ctx.strokeStyle=COMBAT_INK.rose;ctx.lineWidth=boss?5:3;ctx.beginPath();ctx.moveTo(x-r*(1-t),cy-r*.6);ctx.lineTo(x+r*(1-t),cy+r*.6);ctx.stroke();
 ctx.strokeStyle=COMBAT_INK.silver;ctx.lineWidth=boss?2.5:1.5;ctx.stroke();
 for(let n=0;n<count;n++){const a=n*Math.PI*2/count,reach=r*(.25+Math.sqrt(t)),px=x+Math.cos(a)*reach,py=cy+Math.sin(a)*reach*.5-t*(boss?70:26);ctx.strokeStyle=n%2?COMBAT_INK.rose:COMBAT_INK.silver;ctx.beginPath();ctx.moveTo(px,py-4);ctx.lineTo(px+2,py+3);ctx.stroke();}
 if(boss){dropSeal(x,y-15,5,45+Math.sin(t*Math.PI)*28,COMBAT_INK.silver);if(age>.18)ring(x,y-10,45+(age-.18)*100,COMBAT_INK.rose,2);}
 ctx.restore();ctx.restore();
}
const damageBoxes=new Float32Array(44);
function damageNumbers(){
 let enemyCount=0,playerCount=0,boxCount=0;
 // Player hits first, then newest enemy hits. Reuse bounded layout storage.
 for(let pass=0;pass<2;pass++)for(let i=state.effects.length-1;i>=0;i--){const f=state.effects[i],player=f.type==='playerDamage';if(!player&&f.type!=='damage'||player!==(pass===0)||f.ttl<=0||!visibleInCamera(f,camera,120))continue;if(player?playerCount>=3:enemyCount>=8)continue;
  const age=f.maxTtl-f.ttl,t=clamp(age/.6,0,1);if(t>=1)continue;
  const size=player?24:f.guarded?17:f.status==='bleed'?16:f.critical?(f.skill?31:27):f.skill?24:20,scale=1+(f.critical?.18:f.skill?.22:.09)*Math.max(0,1-age/.12),text=String(f.value)+(f.status==='bleed'?' · 출혈':f.guarded?' · 방어':f.critical?'!':''),lane=(f.id%5-2)*(player?12:16),foot=f.y+(player?115:70);
  ctx.save();ctx.globalAlpha=t<.65?1:(1-t)/.35;ctx.font='600 '+size+'px "Hunter UI", sans-serif';ctx.textAlign='center';ctx.lineJoin='round';
  const half=ctx.measureText(text).width*scale/2,x=clamp(f.x+lane,camera.x+half+12,camera.x+camera.width-half-12);let y=f.y-8-Math.sin(Math.min(1,t*2)*Math.PI/2)*28-t*12,placed=false;
  for(let attempt=0;attempt<3;attempt++){const left=x-half,top=foot*GROUND_DEPTH_SCALE+y-foot-size*scale;let overlap=false;for(let b=0;b<boxCount;b++){const k=b*4;if(left<damageBoxes[k]+damageBoxes[k+2]+6&&left+half*2+6>damageBoxes[k]&&top<damageBoxes[k+1]+damageBoxes[k+3]+4&&top+size*scale+4>damageBoxes[k+1]){overlap=true;break;}}
   if(!overlap){const k=boxCount++*4;damageBoxes[k]=left;damageBoxes[k+1]=top;damageBoxes[k+2]=half*2;damageBoxes[k+3]=size*scale;placed=true;break;}y-=size*scale+6;
  }
  if(!placed){ctx.restore();continue;}if(player)playerCount++;else enemyCount++;
  uprightAt(x,foot);ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=COMBAT_INK.edge;ctx.lineWidth=3;ctx.strokeText(text,0,0);ctx.fillStyle=player?'#ffa3b5':f.guarded?'#aac5d6':f.status==='bleed'?COMBAT_INK.rose:f.skill?game.skillPalette(f.skill)[f.critical?3:1]:f.critical?'#ffe2ad':COMBAT_INK.silver;if(f.skill&&!player){ctx.lineWidth=5;ctx.strokeText(text,0,0);}ctx.fillText(text,0,0);
  if(f.critical&&!f.guarded){ctx.strokeStyle=COMBAT_INK.rose;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-half/scale,-5);ctx.lineTo(-half/scale-5,-9);ctx.moveTo(half/scale,-5);ctx.lineTo(half/scale+5,-9);ctx.stroke();}
  ctx.restore();ctx.restore();
 }
}
function groundLoot(item,x,y,age,showName=false,body=true){
 const rank=item.rarity,info=game.RARITY_INFO[rank],beam=DROP_BEAMS[rank]*(item.perfect?1.25:1)+(item.perfect?24:0),rise=age<.4?Math.sin(Math.max(0,age)/.4*Math.PI)*18:0;
 ctx.save();
 if(body){ring(x,y,rank>=5?29:20,COMBAT_INK.edge,5);ring(x,y,rank>=5?29:20,info.color,1.5);if(rank>=3)dropSeal(x,y,rank,rank>=5?34:25,info.color);}
 if(body){uprightAt(x,y);
  if(beam){ctx.fillStyle=info.color+'1c';ctx.beginPath();ctx.moveTo(x-7,y-10);ctx.lineTo(x-2,y-beam);ctx.lineTo(x+2,y-beam);ctx.lineTo(x+7,y-10);ctx.closePath();ctx.fill();ctx.fillStyle=info.color+'99';ctx.fillRect(x-1,y-beam,2,beam);
   if(rank>=5){ctx.strokeStyle=info.color+'88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-7,y-12);ctx.lineTo(x-7,y-beam*.72);ctx.moveTo(x+7,y-12);ctx.lineTo(x+7,y-beam*.72);ctx.stroke();}
   dropSeal(x,y-beam*.72,rank,rank>=5?13:8,info.color);
  }
  const design=visualDesign(item),source=gearFrame(manifest.equipment,design,manifest.equipmentRarities),frame=source.frame,size=rank>=3?44:34,scale=size/Math.max(frame.w,frame.h),art=images.get(source.image);
  if(art)ctx.drawImage(art,frame.x,frame.y,frame.w,frame.h,x-frame.w*scale/2,y-frame.h*scale-10-rise,frame.w*scale,frame.h*scale);ctx.restore();
 }
 if(body&&item.perfect){uprightAt(x,y);const cy=y-beam*.72,r=7+Math.sin(age*5)*2;ctx.strokeStyle='#fff6d8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,cy-r);ctx.lineTo(x+r,cy);ctx.lineTo(x,cy+r);ctx.lineTo(x-r,cy);ctx.closePath();ctx.stroke();ctx.restore();}
 if(showName){const text=(item.perfect?'극옵 · ':'')+game.RARITIES[rank]+' '+item.name;ctx.font='bold 20px "Hunter UI", sans-serif';let half=ctx.measureText(text).width/2;if(half*2>camera.width-32){ctx.font='bold '+(20*(camera.width-32)/(half*2))+'px "Hunter UI", sans-serif';half=(camera.width-32)/2;}const lx=clamp(x,camera.x+half+16,camera.x+camera.width-half-16),ly=y+Math.min(32,viewport.height-12-(y-camera.y)*GROUND_DEPTH_SCALE);uprightAt(lx,y);ctx.fillStyle='#211322df';ctx.fillRect(lx-half-7,ly-21,half*2+14,29);ctx.fillStyle=info.color;ctx.fillRect(lx-half-7,ly-21,2,29);ctx.textAlign='center';ctx.fillText(text,lx,ly);ctx.restore();}
 ctx.restore();
}
function materialVisual(id,x,y,age,burst){const m=game.MATERIAL_BY_ID[id];if(!m||burst&&age>.65)return;
 ctx.save();
 if(burst){const t=age/.65;ctx.globalAlpha*=1-t;ring(x,y,14+t*18,m.color,1.5);for(let n=0;n<(m.rare?6:3);n++){const a=n*Math.PI*2/(m.rare?6:3);ctx.fillStyle=n%2?m.color:COMBAT_INK.silver;ctx.fillRect(x+Math.cos(a)*(12+t*22),y-18+Math.sin(a)*(8+t*14),2,2);}ctx.restore();return;}
 ring(x,y,14,m.color,1.5);uprightAt(x,y);ctx.fillStyle='#211322dc';ctx.strokeStyle=m.color;ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(x,y-31);ctx.lineTo(x+7,y-22);ctx.lineTo(x,y-13);ctx.lineTo(x-7,y-22);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=COMBAT_INK.silver;ctx.fillRect(x-1,y-26,2,8);
 if(m.rare){ctx.fillStyle=m.color+'26';ctx.fillRect(x-3,y-110,6,100);ctx.fillStyle=m.color;ctx.fillRect(x-1,y-110,2,100);dropSeal(x,y-80,3,10,m.color);}
 ctx.restore();ctx.restore();
}
function goldVisual(drop){
 const {x,y,age=0,amount=0}=drop,rise=age<.35?Math.sin(age/.35*Math.PI)*22:0,count=amount>=16?5:amount>=10?4:3;
 ring(x,y,17,'#d6a84966',1.5);uprightAt(x,y);
 for(let n=0;n<count;n++){const cx=x+(n%3-1)*8,cy=y-7-Math.floor(n/3)*7-rise;ctx.fillStyle='#916323';ctx.beginPath();ctx.ellipse(cx,cy+2,7,4.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=n%2?'#efc763':'#d9a536';ctx.strokeStyle='#ffe5a1';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(cx,cy,7,4.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 const gleam=Math.sin(age*5);if(gleam>.1){ctx.strokeStyle='#fff1be';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+10,y-24-rise);ctx.lineTo(x+10,y-14-rise);ctx.moveTo(x+5,y-19-rise);ctx.lineTo(x+15,y-19-rise);ctx.stroke();}ctx.restore();
}
const dropBurstDuration=f=>game.gearDropDuration(f.item);
function dropBurst(f,dramatic){
 const age=f.maxTtl-f.ttl,duration=dropBurstDuration(f);if(age<0||age>=duration)return;
 const item=f.item,atlas=manifest.pickupEffects,image=images.get(atlas.image),t=age/duration;
 const presentation=game.gearDropPresentation(item),row=presentation.row,w=atlas.width/4,h=atlas.height/4,size=reducedMotion?150:presentation.size*(dramatic?1:.72);
 const position=reducedMotion?1:Math.min(3,t*4),frame=Math.floor(position),blend=position-frame,opacity=Math.min(1,(1-t)/.22);
 ctx.save();ctx.globalAlpha=opacity*(1-t*.5);
 for(let n=0;n<(reducedMotion?1:presentation.rings);n++){const radius=(18+presentation.rank*4+(reducedMotion?10:t*(34+presentation.rank*13))-n*10)*(presentation.perfect?1.25:1);if(radius>0)ring(f.x,f.y,radius,presentation.color,presentation.perfect?2.5:1.4);}
 if(presentation.rank>=2||presentation.perfect)dropSeal(f.x,f.y,Math.min(6,presentation.rank+(presentation.perfect?1:0)),24+t*36,presentation.color);
 if(!reducedMotion)for(let n=0;n<presentation.rays;n++){const angle=n*Math.PI*2/presentation.rays,radius=22+t*(40+presentation.rank*13);ctx.fillStyle=n%3?presentation.color:'#fff4da';ctx.fillRect(f.x+Math.cos(angle)*radius-1,f.y+Math.sin(angle)*radius*.7-t*(15+presentation.rank*6),presentation.perfect?3:2,presentation.perfect?7:3);}
 uprightAt(f.x,f.y);ctx.globalCompositeOperation='lighter';
 if(presentation.perfect){ctx.globalAlpha=opacity*(1-t)*.65;ctx.fillStyle=presentation.color;const height=90+presentation.rank*38;ctx.fillRect(f.x-3,f.y-height,6,height);ctx.fillStyle='#fff6d9';ctx.fillRect(f.x-1,f.y-height,2,height);}
 ctx.globalAlpha=opacity*(1-blend);ctx.drawImage(image,frame*w,row*h,w,h,f.x-size*atlas.pivotX,f.y-size*atlas.pivotY,size,size);
 if(blend>0){ctx.globalAlpha=opacity*blend;ctx.drawImage(image,(frame+1)*w,row*h,w,h,f.x-size*atlas.pivotX,f.y-size*atlas.pivotY,size,size);}
 ctx.restore();ctx.restore();
}
function resourceCollected(f){
 const t=clamp((f.maxTtl-f.ttl)/f.maxTtl,0,1),row=game.MATERIAL_BY_ID[f.materialId],color=f.kind==='gold'?'#ffd27a':row?.color??'#d3dce0',lane=f.kind==='gold'?0:1+game.MATERIALS.indexOf(row)%3;
 ctx.save();ctx.globalAlpha*=1-t;ring(f.x,f.y,15+(reducedMotion?0:t*32),color,1.5);uprightAt(f.x,f.y);
 if(!reducedMotion)for(let n=0;n<6;n++){const a=n*Math.PI/3,r=14+t*24;ctx.fillStyle=n%2?color:'#fff1d5';ctx.fillRect(f.x+Math.cos(a)*r-1,f.y-20+Math.sin(a)*r*.5-t*20,3,3);}
 const text=f.kind==='gold'?'+'+f.amount+' G':(row?.name??'재료')+' +'+f.amount,x=f.x+(lane%2?-1:1)*(40+lane*12),y=f.y-18-lane*17-(reducedMotion?0:t*30);
 ctx.font='600 18px "Hunter UI", sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1d1519';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();ctx.restore();
}
function worldActors(){
  const p=state.player,actors=[...decorationsByStage.get(displayChapter().id),...state.barrels,...state.enemies,{...p,kind:'player'}].sort((a,b)=>a.y-b.y);
  ctx.save();ctx.translate(-camera.x,-camera.y);nodes();game.drawSkillBuffs(ctx,state);game.drawImageSkillBuffs(ctx,state,skillArt);
  for(const slot of ['weapon','armor','charm'])if(state.uniqueState.ancientShields[slot])ring(p.x,p.y,46,appearance[slot]?.color??'#ceb7ff',2);if(state.uniqueState.shield>0)ring(p.x,p.y,42,'#c4e9d5',3);if(state.uniqueState.momentum>0)ring(p.x,p.y,35,'#eed6a0',2);if(state.uniqueState.orbit){const z=state.uniqueState.orbit;ring(z.x,z.y,145,'#e5c6fa77',2);}
  let labelDrop=null;for(const drop of state.pickups)if(drop.kind==='equipment'&&(drop.item.rarity>=3||drop.item.perfect)&&visibleInCamera(drop,camera,0)&&(!labelDrop||drop.item.rarity+(drop.item.perfect ? .5 : 0)>labelDrop.item.rarity+(labelDrop.item.perfect ? .5 : 0)))labelDrop=drop;
  for(const drop of state.pickups){if(!visibleInCamera(drop,camera,240))continue;if(drop.kind==='gold'){goldVisual(drop);continue;}if(drop.kind==='material'){materialVisual(drop.materialId,drop.x,drop.y,drop.age,false);continue;}if(drop.kind==='equipment'){groundLoot(drop.item,drop.x,drop.y,drop.age);continue;}uprightAt(drop.x,drop.y);ctx.fillStyle=drop.cores?'#9fe1f2':'#dda2cd';ctx.beginPath();ctx.ellipse(drop.x,drop.y-10,drop.cores?5:3,drop.cores?7:3,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  let defeats=0;
  for(const a of actors){
    if(!visibleInCamera(a,camera,300))continue;if(a.kind==='decoration'){prop(a);continue;}
    if(a.kind==='barrel'){core(a);continue;}
    if(a.dead&&!a.boss&&a.actionTime<(a.elite?.6:.42)&&defeats++<6)defeatVisual(a.x,a.y,a.actionTime,a.elite);
    const deathAlpha=a.dead?(a.species||a.type==='skitter'?skitterDeathAlpha(a.actionTime):Math.max(0,1-a.actionTime/.5)*.65):1;if(deathAlpha<=0)continue;
    if(a.kind==='player'){
      shadow(a.x,a.y,35);
      for(const ghost of game.skillGhosts(state))actorSprite('hunter',{...a,x:ghost.x,y:ghost.y,kind:'skillGhost',skillEquipment:ghost.equipmentAtStart},126,ghost.alpha,0,0,0,ghost.pose);
      const alpha=a.action==='death'?(a.actionTime>=ACTION_DURATIONS.death?.7:1):a.invulnerable>0&&Math.floor(state.run.time*18)%2?.65:1;actorSprite('hunter',a,126,alpha);
      if(['attack','heavy'].includes(a.action)&&!a.swing?.skillVisualOnly){
        const swing=a.swing;cleaveVisual(a);
        if(swing.heavy&&a.actionTime<swing.impact){ring(a.x+swing.x*65,a.y+swing.y*65,46,COMBAT_INK.rose+'88',2);}
      }
      if(a.action==='dash')ring(a.x,a.y,36,COMBAT_INK.rose+'77');
      if(a.counterReady>0){ring(a.x,a.y,45,COMBAT_INK.silver,3);ctx.fillStyle=COMBAT_INK.silver;ctx.font='bold 14px "Hunter UI", sans-serif';ctx.textAlign='center';label('Q 완벽 반격',a.x,a.y-140,a.y);}
    }else{
      let height=enemyHeight(a),reactionTime=a.dead?(a.hitAt??0)+a.actionTime:state.run.time,recoil=recoilProgress(a,reactionTime),offsetX=(a.recoilX??0)*recoil,offsetY=(a.recoilY??0)*recoil,age=reactionTime-a.hitAt,skillAge=reactionTime-(a.skillHitAt??-9),flash=Math.max(!a.hitGuarded&&age>=0&&age<.07?1-age/.07:0,!a.dead&&skillAge>=0&&skillAge<.18?1.1*(1-skillAge/.18):0),shake=!reducedMotion&&!a.dead&&skillAge>=0&&skillAge<.22?Math.sin(skillAge*95)*(a.boss?2:4)*(1-skillAge/.22):0;offsetX+=shake;shadow(a.x+offsetX,a.y+offsetY,a.boss?65:a.type==='bulwark'?43:27);
      const alpha=a.dead?deathAlpha:a.boss&&!state.run.bossSpawned?.45:1;
      if(state.phase==='playing'&&state.run.flow==='combat'&&!a.dead&&game.enemyAttackKind(a)==='charge')game.drawMonsterCharge(ctx,a,state.stageId,monsterArt);
      if(alpha>0)actorSprite(a.type,a,height,alpha,offsetX,offsetY,flash);

      if(!a.dead&&(a.bleedTicks||a.chillRemaining>0)){const color=a.chillRemaining>0?'#9cdeef':'#ed8992';ring(a.x,a.y,a.boss?72:38,color,2);uprightAt(a.x,a.y);ctx.fillStyle=color;ctx.font='bold 17px "Hunter UI", sans-serif';ctx.textAlign='center';ctx.fillText((a.bleedTicks?'◆':'')+(a.chillRemaining>0?'❄':''),a.x,a.y-height-42);ctx.restore();}
      if(a.guard>0&&!a.dead){const angle=Math.atan2(a.guardY,a.guardX);ctx.save();ctx.translate(a.x,a.y-24);ctx.rotate(angle);ctx.strokeStyle='#b9cfea';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(37,-30);ctx.lineTo(50,0);ctx.lineTo(37,30);ctx.stroke();ctx.restore();uprightAt(a.x,a.y);ctx.fillStyle='#131c28';ctx.fillRect(a.x-25,a.y-height-19,50,4);ctx.fillStyle='#9ab8ce';ctx.fillRect(a.x-25,a.y-height-19,50*a.guard/a.guardMax,4);ctx.restore();}

      if(a.elite&&!a.dead){ctx.fillStyle='#edc179';ctx.font='bold 11px "Hunter UI", sans-serif';ctx.textAlign='center';label('◆ 정예',a.x,a.y-height-29,a.y);}
      if(a.boss&&!a.dead){ring(a.x,a.y,65,'#d9a66b80');}
      if(!a.dead&&a.hp<a.maxHp&&!a.boss){uprightAt(a.x,a.y);ctx.fillStyle='#17241fb0';ctx.fillRect(a.x-23,a.y-height-12,46,4);ctx.fillStyle='#d8b375';ctx.fillRect(a.x-23,a.y-height-12,46*a.hp/a.maxHp,4);ctx.restore();}
    }
  }
  game.drawUltimateField(ctx,state,skillArt);

  let heroDrop=null,dropBursts=0,resourceBursts=0,goldReceipt=null;
  for(const f of state.effects)if(f.type==='gearDrop'&&f.maxTtl-f.ttl<dropBurstDuration(f)&&visibleInCamera(f,camera,240)&&(!heroDrop||f.item.rarity+(f.item.perfect?.5:0)>=heroDrop.item.rarity+(heroDrop.item.perfect?.5:0)))heroDrop=f;
  for(const f of state.effects)if(f.type==='resourceCollect'&&f.kind==='gold'&&(!goldReceipt||f.amount>=goldReceipt.amount))goldReceipt=f;
  for(const f of state.effects){
    const alpha=clamp(f.ttl/f.maxTtl,0,1);ctx.save();ctx.globalAlpha=alpha;
    if(f.type==='ancientSig'||f.type==='unique'||f.type==='synergy')ctx.globalAlpha*=.65;
    if(['skillCast','skillImpact','skillMark','skillPassive'].includes(f.type)){
      let visual=f.type==='skillMark'?{...f,type:'skillCast'}:f;
      if(f.type==='skillCast'&&f.skillId==='seeking'){const target=state.enemies.find(e=>e.id===f.targetId&&!e.dead);if(target)visual={...f,targetX:target.x,targetY:target.y};}
      if(!game.drawImageSkillEffect(ctx,visual,alpha,skillArt))game.drawSkillEffect(ctx,visual,alpha);
      if(f.type==='skillImpact')game.drawSkillImpactShards(ctx,visual,alpha,{reducedMotion});
    }else if(f.type==='gearDrop'){groundLoot(f.item,f.x,f.y,f.maxTtl-f.ttl,false,!f.source);if(f.maxTtl-f.ttl<dropBurstDuration(f)&&visibleInCamera(f,camera,240)&&(f===heroDrop||dropBursts++<3))dropBurst(f,f===heroDrop&&(f.item.rarity>=2||f.item.perfect));
     }else if(f.type==='materialDrop'){materialVisual(f.materialId,f.x,f.y,1-alpha,true);
    }else if(f.type==='synergy'){
      ring(f.x,f.y,35+(1-alpha)*65,f.color,3);ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.beginPath();
      for(let n=0;n<8;n++){const a=n*Math.PI/4,inner=18+(1-alpha)*25,outer=inner+25;ctx.moveTo(f.x+Math.cos(a)*inner,f.y-30+Math.sin(a)*inner*.65);ctx.lineTo(f.x+Math.cos(a)*outer,f.y-30+Math.sin(a)*outer*.65);}ctx.stroke();
      uprightAt(f.x,f.y-115-(1-alpha)*30);ctx.font='bold 18px "Hunter UI", sans-serif';ctx.textAlign='center';ctx.fillStyle=f.color;ctx.fillText(f.name,f.x,f.y-115-(1-alpha)*30);ctx.restore();
    }else if(f.type==='ancientSig'){const growth=.55+(1-alpha)*.45;ring(f.x,f.y,f.radius*growth,f.color,2);drawAncientRune(ctx,f.rune,f.x,f.y-25,Math.min(55,f.radius*.3)*growth,f.color,1-alpha);
    }else if(f.type==='uniqueLink'){ctx.strokeStyle=game.UNIQUE_EFFECTS[f.uniqueId].color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(f.x,f.y-40);for(let n=1;n<=6;n++){const t=n/6;ctx.lineTo(f.x+(f.tx-f.x)*t+(n===6?0:Math.sin(n*9)*13),f.y+(f.ty-f.y)*t-40);}ctx.stroke();
    }else if(f.type==='unique'){const spec=game.UNIQUE_EFFECTS[f.uniqueId];ring(f.x,f.y,f.radius*(.5+(1-alpha)*.5),spec.color,3);if(['frostNova','frostWard','barrier'].includes(f.uniqueId)){ctx.strokeStyle=spec.color;ctx.lineWidth=2;ctx.beginPath();for(let n=0;n<=6;n++){const a=n*Math.PI/3,reach=f.radius*.5;if(n===0)ctx.moveTo(f.x+Math.cos(a)*reach,f.y+Math.sin(a)*reach*.65);else ctx.lineTo(f.x+Math.cos(a)*reach,f.y+Math.sin(a)*reach*.65);}ctx.stroke();}else{for(let n=0;n<6;n++){const a=n*Math.PI/3+(1-alpha);ctx.fillStyle=spec.color;ctx.fillRect(f.x+Math.cos(a)*f.radius*.65,f.y+Math.sin(a)*f.radius*.4-25,4,4);}}
    }else if(f.type==='explosion'){
      const t=1-alpha;ctx.fillStyle='#9d4964'+Math.round(alpha*28).toString(16).padStart(2,'0');ctx.beginPath();ctx.ellipse(f.x,f.y-20,f.radius*t,f.radius*t*.65,0,0,Math.PI*2);ctx.fill();ring(f.x,f.y-15,f.radius*(.4+t*.6),COMBAT_INK.silver,4*alpha);
      for(let i=0;i<8;i++){const angle=i*Math.PI/4+f.id;ctx.fillStyle=i%2?COMBAT_INK.rose:COMBAT_INK.silver;ctx.fillRect(f.x+Math.cos(angle)*f.radius*t,f.y-35+Math.sin(angle)*f.radius*t*.65-30*t,4,4);}
    }else if(['perfectDodge','guardBreak','reflect'].includes(f.type)){
      ring(f.x,f.y,50+(1-alpha)*75,f.type==='guardBreak'?COMBAT_INK.rose:COMBAT_INK.silver,3);ctx.fillStyle=COMBAT_INK.silver;ctx.font='bold 16px "Hunter UI", sans-serif';ctx.textAlign='center';label(f.type==='perfectDodge'?'완벽 회피':f.type==='guardBreak'?'갑각 파쇄':'튕겨내기',f.x,f.y-145-(1-alpha)*20,f.y);
    }else if(f.type==='gearProc'){ring(f.x,f.y,30+(1-alpha)*35,game.WEAPON_TRAITS[f.trait].color,3);
    }else if(f.type==='spit'){ctx.globalAlpha=1;game.drawMonsterAttackEffect(ctx,f,1,monsterArt);
    }else if(f.type==='acidImpact'){ctx.globalAlpha=1;const drawn=game.drawMonsterAttackEffect(ctx,f,1,monsterArt);ctx.globalAlpha=alpha;if(!drawn)ring(f.x,f.y-35,15+(1-alpha)*25,f.friendly?'#a0f4d9':'#c3d949',3);
    }else if(f.type==='bolt'){
      ctx.strokeStyle=COMBAT_INK.silver;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y);
      for(let i=1;i<=6;i++){const t=i/6,j=i===6?0:Math.sin(i*5+f.id)*14;ctx.lineTo(f.x+(f.tx-f.x)*t+j,f.y+(f.ty-f.y)*t-j);}ctx.stroke();
    }else if(f.type==='collect'){const t=1-alpha,x=f.x+(p.x-f.x)*t,y=f.y+(p.y-f.y)*t-12*Math.sin(t*Math.PI);for(let n=0;n<3;n++){ctx.fillStyle=n===1?COMBAT_INK.rose:COMBAT_INK.silver;ctx.fillRect(x+(n-1)*5,y-12-n*4,2,2);}

    }else if(f.type==='resourceCollect'){if(f===goldReceipt||f.kind!=='gold'&&resourceBursts++<(goldReceipt?3:4))resourceCollected(f);

    }else if(f.type==='roomClear'){ring(f.x,f.y,45+(1-alpha)*50,'#b9d4ae',2);
    }else if(f.type==='slam'){ctx.globalAlpha=1;const drawn=game.drawMonsterAttackEffect(ctx,f,1,monsterArt);ctx.globalAlpha=alpha;if(!drawn)ring(f.x,f.y,f.radius*(1.1-alpha*.4),COMBAT_INK.danger,3);}
    else if(f.type==='bossDeath'){defeatVisual(f.x,f.y,f.maxTtl-f.ttl,false,true);}
    else if(f.type==='seal'){stagePassage(f.x,f.y,f.maxTtl-f.ttl);}
    else if(f.type==='levelUp'){ring(f.x,f.y,45+(1-alpha)*100,'#a0e1b9',4);}
    else if(['dash','dashTrail'].includes(f.type))actorSprite('hunter',{...f,action:'dash'},126,.3*alpha);
    ctx.restore();
  }
  // Contact accents and live shots must survive additive skill effects.
  let contacts=0;for(let i=state.effects.length-1;i>=0&&contacts<10;i--){const f=state.effects[i];if(f.type!=='impact'||f.ttl<=0||!visibleInCamera(f,camera,80))continue;game.drawHitImpact(ctx,f,reducedMotion);contacts++;}
  let skillHits=0;for(let i=state.effects.length-1;i>=0&&skillHits<16;i--){const f=state.effects[i];if(f.type!=='skillHit'||f.ttl<=0||!visibleInCamera(f,camera,120))continue;game.drawSkillHit(ctx,f,{reducedMotion});skillHits++;}
  for(const q of state.projectiles)if(visibleInCamera(q,camera,120)){
    // A successful bitmap is the hostile shot. Legacy geometry is a fallback,
    // and still owns friendly/reflected shots; it must not cover the new art.
    if(state.phase!=='playing'||!game.drawMonsterProjectile(ctx,q,state.run.time,monsterArt))game.drawCombatProjectile(ctx,q);
  }
  if(labelDrop)groundLoot(labelDrop.item,labelDrop.x,labelDrop.y,labelDrop.age,true,false);
  damageNumbers();
  ctx.restore();
}
function lighting(){ctx.save();ctx.fillStyle='#d6c29a0c';ctx.fillRect(0,0,viewport.width,viewport.height);const gradient=ctx.createRadialGradient(viewport.width/2,viewport.height*.46,viewport.width*.13,viewport.width/2,viewport.height*.46,Math.max(viewport.width,viewport.height)*.6);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'#17201940');ctx.fillStyle=gradient;ctx.fillRect(0,0,viewport.width,viewport.height);ctx.restore();}
function guide(){
  const p=state.player;let target=null,best=Infinity;for(const e of state.enemies){if(e.dead)continue;const d=distance(e,p);if(d<best){best=d;target=e;}}target??=state.spawns[0];
  if(!target||visibleInCamera(target,camera,0))return;
  const point=worldToScreen(target,camera),{x,y}=guidePointFor(point,viewport),angle=Math.atan2(point.y-viewport.height/2,point.x-viewport.width/2);
  directionEmblem(x,y,angle,24,COMBAT_INK.danger);ctx.textAlign='center';ctx.font='14px "Hunter UI", sans-serif';ctx.fillStyle=COMBAT_INK.silver;ctx.fillText(target.boss?'수문장':'괴수',x,y+24);
}
function draw(){ctx.setTransform(renderScaleX,0,0,renderScaleY,0,0);ctx.fillStyle='#182018';ctx.fillRect(0,0,viewport.width,viewport.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.save();if(!reducedMotion&&state.phase==='playing'&&state.shake)ctx.translate(Math.sin(state.run.time*147)*state.shake,Math.cos(state.run.time*173)*state.shake*.6);ctx.scale(1,GROUND_DEPTH_SCALE);floor();worldActors();ctx.restore();lighting();if(state.phase!=='camp'){guide();}}

function hudText(node,value){const next=value==null?'':String(value);if(node.textContent!==next)node.textContent=next;}
function modal(which,title,description,eyebrow){
  if(which!=='camp'&&(backupCandidate||backupReading))cancelBackup();
  if(which!=='inventory')bagSelectedId=null;
  if(which!=='camp'){campDrawer='';$('camp-drawer').hidden=true;$('camp-more-panel').hidden=true;$('nav-more').setAttribute('aria-expanded','false');}
  $('overlay').setAttribute('data-panel',which);$('game-shell').setAttribute('data-panel',which);if(which!=='camp')hudText($('page-title'),({equipment:'장비',inventory:inventoryPanel==='build'?'빌드':'가방',craft:'제작',codex:'도감',track:'재료 추적',choice:'검술 정비'}[which]??title));
  $('overlay').hidden=!which;
  $('nav-equipment').setAttribute('aria-pressed',String(which==='equipment'||which==='inventory'&&inventoryPanel==='build'));$('nav-bag').setAttribute('aria-pressed',String(which==='inventory'&&inventoryPanel==='gear'));
  $('nav-home').setAttribute('aria-pressed',String(which==='camp'&&['','map','tactics'].includes(campDrawer)));$('nav-skills').setAttribute('aria-pressed',String(which==='camp'&&campDrawer==='skills'));$('nav-skills').setAttribute('aria-expanded',String(which==='camp'&&campDrawer==='skills'));$('nav-craft').setAttribute('aria-pressed',String(which==='craft'||which==='track'));$('nav-more').setAttribute('aria-pressed',String(which==='codex'||which==='camp'&&['more','growth'].includes(campDrawer)));
  for(const name of ['camp','choice','result','pause','inventory','equipment','codex','craft','track'])$(name+'-content').hidden=name!==which;
  hudText($('modal-title'),title);hudText($('modal-description'),description);hudText($('modal-eyebrow'),eyebrow);
  const context=which+state.phase+state.paused;
  if(context!==previousModal){launchRevision++;previousModal=context;const focus=which==='track'?'track-back':which==='craft'?'page-back':which==='codex'?'page-back':(which==='inventory'||which==='equipment')?(state.phase==='camp'?'page-back':which==='equipment'?'loadout-close':'inventory-back'):which==='camp'?'start':which==='choice'?'choice-0':which==='result'?'result-camp':which==='pause'?'resume':'arena';$(focus).focus({preventScroll:true});}
}
function atlasThumbnail(node,imageName,frame,size=64,dimensions=null){
  const image=images.get(imageName)??dimensions;
  if(!image){node.atlasFrame=null;node.atlasLayout=null;node.style.backgroundImage='none';node.style.clipPath='none';if(node.atlasImage)node.atlasImage.hidden=true;return;}
  const width=image.naturalWidth??image.width,height=image.naturalHeight??image.height,previous=node.atlasLayout;
  if(previous?.frame===frame&&previous.imageName===imageName&&previous.size===size&&previous.width===width&&previous.height===height)return;
  node.atlasFrame=frame;node.atlasLayout={frame,imageName,size,width,height};
  // Image placement and clipping share the same square, even when CSS resizes it.
  const scale=(size-8)/Math.max(frame.w,frame.h),left=(size-frame.w*scale)/2,top=(size-frame.h*scale)/2;
  if(!node.atlasImage){const art=document.createElement('img');art.alt='';art.setAttribute('aria-hidden','true');art.draggable=false;node.atlasImage=art;node.replaceChildren(art);node.classList.toggle('atlas-thumbnail',true);}
  const art=node.atlasImage,src='assets/'+(manifest.delivery?.[imageName]??imageName);
  if(node.atlasImageSource!==src){art.src=src;node.atlasImageSource=src;}
  art.hidden=false;art.style.width=(width*scale/size*100)+'%';art.style.height=(height*scale/size*100)+'%';
  art.style.left=((left-frame.x*scale)/size*100)+'%';art.style.top=((top-frame.y*scale)/size*100)+'%';
  node.style.clipPath='inset('+(top/size*100)+'% '+(left/size*100)+'%)';node.style.backgroundImage='none';
}
const PART_FRAMES={helmet:{x:0,y:0,w:512,h:532},pants:{x:512,y:0,w:512,h:512},boots:{x:1024,y:0,w:512,h:512},earring:{x:512,y:512,w:512,h:512},special:{x:1024,y:512,w:512,h:512}};
function gearThumbnail(node,item,size=64,illustrated=false){

  // Set pieces (0.109), the 0.97-part ancients (0.111) and crafted parts (0.140) have their own art; other parts use the shared part icons.
  // Crafted gear always shows its crafted art (0.140; small icons used the 0.9 family art before).
  if(PART_FRAMES[item?.slot]&&!game.itemSet(item)&&!(item?.rarity===6&&manifest.craftedPresentation.frames[item.catalogId])&&!manifest.equipment.setFrames?.[item?.artId]&&!(item?.rarity===5&&manifest.equipmentRarities.designIds.includes(item.catalogId))){const frame=PART_FRAMES[item.slot],image='equipment-parts-v0970.png';atlasThumbnail(node,image,frame,size,{width:1536,height:1024});node.setAttribute('aria-label',item.name??game.SLOTS[item.slot]);node.setAttribute('data-art-id','part-'+item.slot);node.setAttribute('data-visual-id',item.catalogId??item.slot);node.style.filter=item.rarity?'drop-shadow(0 0 2px '+game.RARITY_INFO[item.rarity].color+')':'';return {frame,image};}
  const design=visualDesign(item),craftedDisplay=design.craftId&&manifest.craftedPresentation.frames[design.craftId]?manifest.craftedPresentation:null,display=craftedDisplay??(illustrated&&!design.variant?manifest.equipmentPresentation:null),displayId=craftedDisplay?design.craftId:design.id;
  const source=display?.frames[displayId]?{image:display.image,frame:display.frames[displayId],dimensions:display,grip:display.weaponAnchors?.[displayId]}:gearFrame(manifest.equipment,design,manifest.equipmentRarities);
  atlasThumbnail(node,source.image,source.frame,size,source.dimensions);node.setAttribute('aria-label',item?.name?itemGradeName(item)+' '+item.name:design.name);node.style.filter=item?.rarity?'drop-shadow(0 0 2px '+game.RARITY_INFO[item.rarity].color+')':'';node.setAttribute('data-art-id',design.id);node.setAttribute('data-visual-id',design.variant??design.id);return source;
}
// Alpha 0.135.4: the result shows 장비 and 재료 on separate tabs. Collapsed it is one row; 더보기 widens the gallery over the
// left column and pages it by how many cells fit (12 per page when the layout cannot be measured).
function resultLootFit(grid){
  const box=grid.getBoundingClientRect?.();if(!(box?.width>0&&box.height>0))return null;
  const style=window.getComputedStyle?.(grid),cell=parseFloat(style?.getPropertyValue?.('--result-cell'))||40,gap=parseFloat(style?.columnGap)||4;
  const columns=Math.max(1,Math.floor((box.width+gap)/(cell+gap))),rows=Math.max(1,Math.floor((box.height+gap)/(cell+gap)));
  return Math.min(RESULT_LOOT_FIGURES,resultLootExpanded?columns*rows:columns);
}
function refreshResultLoot(){
  const ledger=state.run.lootLedger,gained=state.run.materialLedger??{};
  if(resultLootSource!==ledger||resultLootRows.length!==ledger.length){
    resultLootSource=ledger;resultLootRows=[...ledger].sort((a,b)=>b.rarity-a.rarity||Number(!!b.perfect)-Number(!!a.perfect));resultLootPage=0;resultLootRenderKey='';resultLootLayoutKey='';
  }
  const materialRows=game.MATERIALS.filter(m=>gained[m.id]>0),gear=resultLootTab==='gear',total=gear?resultLootRows.length:materialRows.length;
  const gallery=$('result-loot-gallery'),grid=$(gear?'result-loot-grid':'result-material-grid');
  gallery.setAttribute('data-tab',resultLootTab);$('result-content').setAttribute('data-loot-expanded',String(resultLootExpanded));
  $('result-loot-tab-gear').setAttribute('aria-pressed',String(gear));$('result-loot-tab-materials').setAttribute('aria-pressed',String(!gear));
  $('result-loot-gear-count').textContent=String(resultLootRows.length);$('result-loot-material-count').textContent=String(materialRows.reduce((n,m)=>n+gained[m.id],0));
  $('result-loot-empty').textContent=gear?'획득한 장비가 없어.':'획득한 재료가 없어.';$('result-loot-empty').hidden=!!total;
  $('result-loot-grid').hidden=!gear||!resultLootRows.length;$('result-material-grid').hidden=gear||!materialRows.length;
  const layoutKey=[resultLootTab,resultLootExpanded,window.innerWidth,window.innerHeight].join('|');
  if(resultLootLayoutKey!==layoutKey){const fit=total?resultLootFit(grid):null;resultLootPageSize=fit??RESULT_LOOT_PAGE_SIZE;if(fit)resultLootLayoutKey=layoutKey;}
  const size=resultLootPageSize,pages=Math.max(1,Math.ceil(total/size));resultLootPage=clamp(resultLootPage,0,pages-1);
  const more=$('result-loot-more');more.hidden=!resultLootExpanded&&total<=size;more.textContent=resultLootExpanded?'접기':'더보기 +'+Math.max(0,total-size);more.setAttribute('aria-expanded',String(resultLootExpanded));
  const key=[layoutKey,size,resultLootPage,materialRows.map(m=>m.id+gained[m.id]).join()].join('|');
  if(resultLootRenderKey===key&&resultLootInventory===profile.inventory)return;
  resultLootRenderKey=key;resultLootInventory=profile.inventory;
  $('result-loot-count').textContent=gear?resultLootRows.length+'개':materialRows.length+'종';
  $('result-loot-pager').hidden=pages===1;$('result-loot-prev').disabled=resultLootPage===0;$('result-loot-next').disabled=resultLootPage===pages-1;$('result-loot-page').textContent=(resultLootPage+1)+' / '+pages;
  const first=resultLootPage*size;
  for(let i=0;i<RESULT_LOOT_FIGURES;i++){
    const card=$('result-loot-'+i),item=gear&&i<size?resultLootRows[first+i]:null;card.hidden=!item;if(!item)continue;
    const kept=profile.inventory.some(owned=>owned.id===item.id&&owned.catalogId===item.catalogId&&owned.artId===item.artId&&owned.name===item.name),status=kept?'보관':'분해됨',name=(item.perfect?'극옵 · ':'')+itemGradeName(item)+' '+item.name;
    card.style.borderColor=game.RARITY_INFO[item.rarity].color;card.setAttribute('data-kept',String(kept));card.setAttribute('aria-label',name+' · '+status);card.setAttribute('title',name+' · '+status);
    gearThumbnail($('result-loot-art-'+i),item,40);$('result-loot-name-'+i).textContent=item.name;$('result-loot-state-'+i).textContent=status;$('result-loot-state-'+i).style.color=kept?game.RARITY_INFO[item.rarity].color:'#8f9494';
  }
  for(const m of game.MATERIALS){
    const card=$('result-mat-'+m.id),at=materialRows.indexOf(m),shown=!gear&&at>=first&&at<first+size;card.hidden=!shown;if(!shown)continue;
    const label=m.name+' '+gained[m.id].toLocaleString('ko-KR')+'개';$('result-mat-count-'+m.id).textContent=gained[m.id].toLocaleString('ko-KR');card.style.borderColor=m.color+'99';card.setAttribute('aria-label',label);card.setAttribute('title',label);
  }
}
const resultLootOpen=()=>['victory','defeat'].includes(state.phase)&&game.resultReady(state);
for(const [id,step]of [['result-loot-prev',-1],['result-loot-next',1]])$(id).addEventListener('click',()=>{
  if(!resultLootOpen())return;resultLootPage+=step;refreshResultLoot();
});
for(const [id,tab]of [['result-loot-tab-gear','gear'],['result-loot-tab-materials','materials']])$(id).addEventListener('click',()=>{
  if(!resultLootOpen()||resultLootTab===tab)return;resultLootTab=tab;resultLootPage=0;refreshResultLoot();
});
$('result-loot-more').addEventListener('click',()=>{if(!resultLootOpen())return;resultLootExpanded=!resultLootExpanded;resultLootPage=0;refreshResultLoot();});
const HOME_ROUTE_TEXT=['붉은 달이 비추는 숲, 사방에서 괴수들이 몰려온다.','불길과 눈보라가 갈라 놓은 땅, 원소의 괴수들이 깨어난다.','무너진 성문 너머, 잠들지 않는 망자들이 기다린다.','가라앉은 왕국의 물결 아래, 바다의 괴수들이 떠오른다.','번개가 몰아치는 하늘섬에서, 폭풍의 괴수들이 내려온다.','무너진 신들의 땅에서, 타락한 신의 군세가 일어선다.'];
// Alpha 0.121: an ancient's powers follow its tier and the hunt mode it was earned on (악몽 adds a second power).
function ancientPowerText(item){const row=game.ancientDefinition(item);if(!row)return '';const hunt=game.huntGrade(item),lines=game.ancientSignatures(item).map(r=>'✦ '+r.name+' · '+r.description).join('\n');
 // Raid ancients roll their effect power (Alpha 0.123): shown against its 60~120% range.
 // Each raid ancient also carries a 장비 기술 that casts by itself while worn (Alpha 0.127), scaled by the same roll.
 if(row.raid){const skill=game.GEAR_SKILL_BY_ANCIENT[row.id],power=game.raidPowerRoll(item);return lines+(skill?'\n◆ 장비 기술 '+skill.name+' · 피해 '+Math.round(skill.damage*power/100)+'% · 재사용 '+skill.cooldown+'초 · '+skill.description+' (착용 중 자동 시전)':'')+'\n레이드 고대 · 효과 위력 '+power+'% (범위 '+game.RAID_POWER_ROLL.min+'~'+game.RAID_POWER_ROLL.max+'%, 장비 기술 피해에도 적용, 수치작으로 다시 굴림)';}
 return lines+'\n'+row.tier+'티어 위력 ×'+game.ANCIENT_TIER_POWER[row.tier-1].toFixed(1)+(hunt?' · '+game.HUNT_MODES[hunt].name+' 획득 ×'+game.ANCIENT_HUNT_POWER[hunt]+(hunt===2?' · 추가 특수효과':''):'');}
function updateHud(){
  $('start').disabled=!ready;if(!ready)return;
  refreshCombatSkills();if(state.phase==='camp'||game.resultReady(state))refreshPreparation();
  if((state.phase==='camp'||state.phase==='playing')&&resultLootSource){resultLootSource=null;resultLootRows=[];resultLootInventory=null;resultLootRenderKey='';resultLootLayoutKey='';resultLootPage=0;resultLootTab='gear';resultLootExpanded=false;}
  if(state.phase==='camp'&&campDrawer==='map'&&!combatReady&&!combatWork&&!combatError)ensureCombatAssets();
  if(!dungeonBusy&&campDrawer!=='dungeons'&&state.phase==='camp'&&(campDrawer==='map'||combatReady)&&regionAssets.requestedId!==selectedStage)prepareRegion(selectedStage);
  const p=state.player,trait=game.equippedWeaponTrait(profile),stats=game.playerStats(profile),stage=game.STAGES[state.stageId-1],plan=game.battlePlan(state.run.stage);
  $('game-shell').setAttribute('data-phase',state.phase);$('game-shell').setAttribute('data-paused',String(state.paused));
  $('game-shell').setAttribute('data-biome',displayChapter().key);$('game-shell').setAttribute('data-encounter',plan.tag);$('game-shell').setAttribute('data-flow',state.run.flow);
  hudText($('sound'),audio.available?'효과음 '+(soundEnabled?'ON':'OFF'):'효과음 미지원');$('sound').setAttribute('aria-pressed',String(soundEnabled));
  hudText($('gold'),String(profile.gold));hudText($('cores'),String(profile.cores));hudText($('level'),'Lv. '+profile.level);
  hudText($('hp-text'),Math.ceil(p.hp)+' / '+Math.round(p.maxHp));$('hp-fill').style.width=clamp(p.hp/p.maxHp*100,0,100)+'%';
  $('xp-fill').style.width=(profile.level===game.MAX_LEVEL?100:profile.xp/game.xpNeeded(profile.level)*100)+'%';hudText($('xp-text'),profile.level===game.MAX_LEVEL?'최고 레벨':'다음 성장까지 '+(game.xpNeeded(profile.level)-profile.xp));refreshGrowthProgress();
  refreshBuildSystem();
  const monsters=game.remainingMonsters(state),timeText=countdown(state.run.timeRemaining),timeRatio=state.run.timeLimit?clamp(state.run.timeRemaining/state.run.timeLimit,0,1):0;
  const stageText=state.run.raidId?'레이드 · '+game.raidDefinition(state.run.raidId).name+' · '+state.run.raidChapter+'장 기준':state.run.rush?'보스 러시 · '+clamp(state.run.wave,1,game.RUSH_BOSSES)+' / '+game.RUSH_BOSSES+' · '+state.run.rushChapter+'장 기준':state.run.dungeonId==='tower'?'무한의 탑 · '+state.run.stage+'층':state.run.dungeonId?game.dungeonDefinition(state.run.dungeonId).kind+' · '+state.run.stage+'단계':stage.name+' · '+state.stageId+'-'+state.run.stage+' 스테이지';
  if($('hunt-stage').textContent!==stageText)hudText($('hunt-stage'),stageText);
  hudText($('time-left'),timeText);$('hunt-clock').setAttribute('aria-label','남은 시간 '+timeText);
  $('hunt-clock').setAttribute('data-urgency',state.run.timeRemaining<=10?'critical':state.run.timeRemaining<=30?'warning':'normal');
  $('hunt-clock-ring').style.strokeDashoffset=String((1-timeRatio)*100);
  hudText($('monsters-left'),String(monsters));$('monsters-meter').setAttribute('aria-valuemax',String(state.run.stageQuota));$('monsters-meter').setAttribute('aria-valuenow',String(monsters));
  $('monsters-fill').style.width=(state.run.stageQuota?clamp(monsters/state.run.stageQuota*100,0,100):0)+'%';
  $('weapon-trait').hidden=!trait;hudText($('weapon-trait'),trait?.name??'');$('weapon-trait').style.color=trait?.color??'';
  hudText($('lobby-energy-value'),Math.floor(p.stamina)+'/100');$('stamina-fill').style.width=p.stamina+'%';hudText($('stamina-text'),'기력 '+Math.floor(p.stamina));
  hudText($('combo'),p.counterReady>0?'Q 반격 '+p.counterReady.toFixed(1)+'초':['attack','heavy'].includes(p.action)?p.swing.name+(p.combo?' · '+p.combo+'/3':''):p.comboWindow>0?'다음 연격으로 연결':'방향 조준 · 3연격');
  $('inventory').disabled=!ready||['victory','defeat'].includes(state.phase)&&!game.resultReady(state);$('auto').disabled=['victory','defeat'].includes(state.phase)&&!game.resultReady(state);
  $('auto').setAttribute('aria-pressed',String(skillMode==='auto'));$('auto').setAttribute('data-skill-mode',skillMode);hudText($('auto-status'),skillMode==='auto'?'자동':'수동');
  for(const [id,key] of [['attack','attackCooldown'],['dash','dashCooldown'],['thunder','thunderCooldown']]){
    const cd=id==='thunder'&&p.counterReady>0?0:p[key];hudText($(id+'-status'),cd>0?Math.max(.1,cd).toFixed(1)+'초':id==='thunder'&&p.counterReady>0?'무료 반격':id==='attack'?'3연격':id==='dash'&&p.stamina<22||id==='thunder'&&p.stamina<35?'기력 부족':'준비');$(id).disabled=!ready||state.phase!=='playing'||state.paused||state.run.flow==='stageClear';
  }
  joystick.disabled=state.phase!=='playing'||state.paused||state.run.flow==='stageClear';
  const imminentCore=state.barrels.some(b=>b.status==='armed'&&distance(b,p)<260);
  $('combat-tip').hidden=state.phase!=='playing'||state.paused||(!p.counterReady&&!imminentCore);
  hudText($('combat-tip'),imminentCore?'폭발 임박 · 회피!':'파쇄 반격 · '+p.counterReady.toFixed(1)+'초');
  $('combat-tip').setAttribute('data-context','warning');
  $('thunder').setAttribute('data-counter',String(p.counterReady>0));
  for(const id of ['shatter','execute'])$('game-shell').setAttribute('data-synergy-'+id,String(state.run.synergyProcs[id]));$('game-shell').setAttribute('data-ancient-procs',String(state.run.ancientProcs));
  $('game-shell').setAttribute('data-materials',String(state.run.materials));$('game-shell').setAttribute('data-crafted-procs',String(state.run.craftedProcs));$('pause').disabled=state.phase!=='playing';$('camp-button').disabled=state.phase!=='playing';
  const boss=state.run.bossSpawned?state.enemies.find(e=>e.boss&&!e.dead):null;$('boss-hud').hidden=!boss;
  if(boss){hudText($('boss-rule-status'),game.bossRuleStatus(state));hudText($('boss-name'),(state.run.raidId?game.raidDefinition(state.run.raidId).name:state.run.rush?boss.name:stage.bossName)+(state.difficulty?' · '+game.HUNT_MODES[state.difficulty].name:'')+(boss.enraged?' · 격노':''));hudText($('boss-hp'),Math.ceil(boss.hp)+' / '+boss.maxHp);$('boss-fill').style.width=boss.hp/boss.maxHp*100+'%';}
  const cleared=state.effects.find(f=>f.type==='stageClear'),stageClear=state.run.flow==='stageClear'||!!cleared;
  const completionText=cleared?cleared.chapterId+'-'+cleared.stage+' 스테이지 완료'+(cleared.stars?' '+starText(cleared.stars):''):'';
  if($('stage-complete').textContent!==completionText)hudText($('stage-complete'),completionText);
  $('stage-complete').hidden=!cleared||!['playing','victory'].includes(state.phase)||state.paused;
  let loot=null;for(const f of state.effects)if(f.type==='loot'){
    const featured=!f.material&&!f.converted&&(f.rarity>=3||f.item?.perfect),currentFeatured=loot&&!loot.material&&!loot.converted&&(loot.rarity>=3||loot.item?.perfect);
    if(!loot||featured&&!currentFeatured||!!featured===!!currentFeatured&&f.rarity+(f.item?.perfect ? .5 : 0)>=loot.rarity+(loot.item?.perfect ? .5 : 0))loot=f;
  }
  $('reward-toast').hidden=!loot||!['playing','victory'].includes(state.phase)||!(stageClear||loot.origin==='stage'||loot.rarity>=2);if(loot){$('reward-toast').setAttribute('data-rarity',String(loot.rarity));$('reward-toast').setAttribute('data-kind',loot.material?'material':'equipment');hudText($('reward-kicker'),loot.material?'재료 보관':loot.converted?'장비 자동 분해':loot.origin==='stage'?'전투 보상':'장비 획득');$('reward-sigil').style.color=game.RARITY_INFO[loot.rarity??0].color;}
  if(loot){
    const item=loot.item,perfect=!!item?.perfect&&!loot.converted;
    $('reward-toast').setAttribute('data-perfect',String(perfect));
    hudText($('reward-title'),(loot.converted?'분해 · ':perfect?'극옵 · ':'')+loot.name);$('reward-title').style.color=game.RARITY_INFO[loot.rarity??0].color;
    const stored=loot.converted?'가방 보호 · 자동 분해 +'+loot.salvagedGold+' 골드':loot.salvagedGold?'장비 보관 · 낮은 장비 분해 +'+loot.salvagedGold+' 골드':'장비 보관 완료',receipt=loot.stageReward;
    hudText($('reward-meta'),loot.material?'재료 · 창고 자동 보관':receipt?'골드 +'+receipt.gold+' · 핵 +'+receipt.cores+(receipt.healed>0?' · 체력 회복':'')+' · '+stored:stored);
    const power=item&&(game.ancientDefinition(item)?.signature??game.craftedDefinition(item)?.signature??game.uniqueEffect(item));
    const brief=receipt?'골드 +'+receipt.gold+' · 핵 +'+receipt.cores:loot.salvagedGold?(loot.converted?'분해':'가방 정리')+' +'+loot.salvagedGold+' 골드':perfect?'모든 옵션 최댓값'+(power?' · '+power.name:''):power?.name??'';
    hudText($('reward-brief'),brief);$('reward-brief').hidden=!brief;

  }
  $('reward-toast').setAttribute('title',$('reward-title').textContent+' · '+$('reward-meta').textContent);
  refreshCraftGoalHud();
  if(craftOpen&&state.phase==='camp'){modal('craft','고유 장비 제작','재료를 모아 나만의 장비를 벼려. 제작은 확정 성공.','THE FORGE');refreshCraft();
  }else if(codexOpen&&state.phase==='camp'){modal('codex','태초의 유물','고대 장비는 챕터 보스가 드물게 떨어뜨리고, 레이드 고대는 레이드 클리어 때 드물게 나와.','ANCIENT CODEX');refreshCodex();
  }else if(inventoryOpen){
    modal(inventoryPanel==='equipment'?'equipment':'inventory',inventoryPanel==='equipment'?'리리안의 장비':'리리안의 가방','아이콘을 눌러 능력치와 시너지 변화를 비교해.','EQUIPMENT');
    if(previewAppearance!==BASE_APPEARANCE){
      const preview=$('equipment-preview'),clip=manifest.clips[manifest.directions.hunter.idle.s];
      drawEquipmentPreview(preview.getContext('2d'),images.get(clip.image),clip,images.get(manifest.equipment.image),manifest.equipment,BASE_APPEARANCE,preview.width,preview.height,manifest.equipmentSockets?.[clip.id]?.[0],rarityAssets);
      preview.setAttribute('aria-label','리리안 기본 모습');previewAppearance=BASE_APPEARANCE;
    }
    hudText($('equipped-summary'),Object.entries(game.EQUIPMENT_SLOTS).map(([slot,name])=>name+': '+(profile.inventory.find(i=>i.id===profile.equipment[slot])?.name??'기본 장비')).join(' · '));
    for(const slot of Object.keys(game.EQUIPMENT_SLOTS)){const item=profile.inventory.find(i=>i.id===profile.equipment[slot]);hudText($('equipped-name-'+slot),item?.name??'미착용');gearThumbnail($('equipped-art-'+slot),item??{slot:game.itemSlotForPosition(slot),tier:1},56,true);hudText($('equipped-level-'+slot),game.isSeal(item)?'+'+item.seal.level:item?'+'+game.enhancementLevel(item):'기본');$('equipped-open-'+slot).setAttribute('data-rarity',item?String(item.rarity):'none');$('equipped-open-'+slot).disabled=false;$('equipped-open-'+slot).setAttribute('data-empty',String(!item));const label=game.EQUIPMENT_SLOTS[slot]+' · '+(item?.name??'미착용');$('equipped-open-'+slot).setAttribute('aria-label',label);$('equipped-open-'+slot).title=label;}
    hudText($('persona-level'),'Lv. '+profile.level);hudText($('persona-damage'),Math.round(stats.damage));hudText($('persona-health'),Math.round(stats.maxHp));hudText($('persona-critical'),(stats.crit*100).toFixed(1)+'%');
    hudText($('inventory-note'),'공격 '+Math.round(stats.damage)+' · 체력 '+stats.maxHp+' · 치명타 '+Math.round(stats.crit*100)+'% · 이동 '+Math.round(stats.speed)+' | '+profile.inventory.length+'/'+game.INVENTORY_LIMIT);
    refreshEquipmentScene();
    const combos=state.synergies;hudText($('equipment-synergy-name'),combos.length?combos.map(c=>c.name).join(' · '):'장비 시너지');hudText($('equipment-synergy-status'),combos.length?'활성':'조합 찾기');$('equipment-synergy-open').setAttribute('data-active',String(combos.length>0));hudText($('equipped-synergies-title'),'장비 시너지 · '+(combos.length?combos.length+'개 활성':'조합을 찾아봐'));
    hudText($('equipped-synergies-details'),game.EQUIPMENT_SYNERGIES.map(row=>{const active=combos.find(c=>c.id===row.id);return (active?'활성 · ':'미완성 · ')+row.name+(active?' ('+game.EQUIPMENT_SLOTS[active.source]+' + '+game.EQUIPMENT_SLOTS[active.payoff]+')':'')+'\n'+row.requirement+'\n'+row.description;}).join('\n\n')+'\n\n전설·신화·고대·고유의 장비 능력으로 연결돼. 검의 기본 빙결·출혈도 준비 효과에 포함. 방어되지 않은 후속 타격만 발동. 함께 활성화되면 빙결 파쇄를 먼저 적용.');
    const uniqueSummary=Object.values(state.loadout).filter(Boolean);$('equipped-unique').hidden=!uniqueSummary.length;hudText($('equipped-unique-title'),'착용 고유 효과 · '+uniqueSummary.length+'개');hudText($('equipped-unique-details'),uniqueSummary.map(u=>game.EQUIPMENT_SLOTS[u.slot]+' · '+u.definition.name+' — '+u.definition.description+((u.ancient??u.crafted??u.seal)?(u.signatures??[]).map(r=>'\n  '+r.name+' — '+r.description).join(''):'')).join('\n'));
    $('equipped-trait').hidden=!trait;hudText($('equipped-trait'),trait?trait.name+' · '+trait.description:'');
    refreshBag();
  }else if(state.phase==='camp'){
    modal('camp',profile.hunts?'다음 사냥을 준비하자.':'첫 사냥을 준비하자.','포격충을 먼저 잡고 중갑의 갑각을 깨뜨려. 폭발핵에 적을 모아 터뜨리면 유리해.','HUNTER\'S CAMP');
    const selected=game.STAGES[selectedStage-1];const bossLoot=game.BOSS_LOOT.find(b=>b.tier===selected.theme)??{id:'chapter-'+selected.id,name:selected.bossName};hudText($('boss-loot-title'),bossLoot.name+' · 일반 장비 드롭');if($('boss-loot-list').dataset.boss!==bossLoot.id){$('boss-loot-list').dataset.boss=bossLoot.id;$('boss-loot-list').replaceChildren(...game.STAGE_SLOTS.map(slot=>{const li=document.createElement('li');li.textContent=game.SLOTS[slot]+' · 일반 등급 드롭 → 최대 강화 후 승급';return li;}));}hudText($('camp-stage-name'),selected.name);hudText($('camp-stage-description'),selected.subtitle);hudText($('camp-stage-goal'),game.battlePlan(selectedRunStage).tactic);
    refreshFarmCamp();const limit=game.stageLimit(profile,selectedStage,selectedDifficulty),completed=game.completedStages(profile,selectedStage,selectedDifficulty);selectedRunStage=Math.min(selectedRunStage,limit);
    for(let n=1;n<=game.STAGES_PER_CHAPTER;n++){
      const button=$('run-stage-'+n),locked=n>limit,chosen=n===selectedRunStage,starMask=game.stageStarMask(profile,selectedStage,n),gate=game.stageGate(selectedStage,n,selectedDifficulty),label=locked?'잠김':starMask?starText(starMask):chosen?'선택':completed>=n?'완료':gate&&!gate.boss?'관문':n===10?'보스':'도전';
      hudText($('run-stage-number-'+n),String(n).padStart(2,'0'));hudText($('run-stage-state-'+n),label);
      button.setAttribute('data-number',selectedStage+'–'+n);button.setAttribute('data-state',locked?'locked':completed>=n?'cleared':'open');button.setAttribute('data-mark',locked?'×':completed>=n?'✓':'');button.setAttribute('data-caption',label);button.setAttribute('aria-label',selectedStage+'-'+n+' · '+game.battlePlan(n).name+' · '+(starMask?'별 '+game.starCount(starMask)+'개':label));button.setAttribute('data-stars',String(game.starCount(starMask)));button.setAttribute('data-gate',gate?gate.type:'');button.disabled=locked;button.classList.toggle('selected',chosen);button.setAttribute('aria-pressed',String(chosen));
    }
    hudText($('stage-board-count'),completed+' / '+game.STAGES_PER_CHAPTER);$('stage-board-progress').setAttribute('aria-valuenow',String(completed));$('stage-board-fill').style.width=completed/game.STAGES_PER_CHAPTER*100+'%';
    const selectedPlan=game.battlePlan(selectedRunStage),bossStage=selectedRunStage===game.STAGES_PER_CHAPTER,previewSpecies=bossStage?selected.bossSpecies:stageHeadline(selected,selectedRunStage),previewClip=manifest.clips[manifest.directions[previewSpecies].walk.s];
    atlasThumbnail($('stage-preview-art'),previewClip.image,previewClip.frames[0],80);
    hudText($('stage-preview-title'),selectedStage+'-'+selectedRunStage+' · '+selectedPlan.name);hudText($('stage-preview-kind'),game.HUNT_MODES[selectedDifficulty].name+' · '+(bossStage?'보스 단독전':game.stageWaveCount(selectedRunStage)+'웨이브'));const rule=game.stageRule(selectedStage,selectedRunStage);const [starFast,starRush]=game.starTimes(selectedRunStage);hudText($('stage-preview-kind'),game.HUNT_MODES[selectedDifficulty].name+' · '+game.STAGE_TYPE_NAMES[rule.type]+' · ★'+starFast+'초 · ★'+(starRush?starRush+'초':'체력 50%'));const gateNow=game.gateEffect(profile,game.stageGate(selectedStage,selectedRunStage,selectedDifficulty));hudText($('stage-preview-description'),(gateNow?game.gateText(gateNow)+' — ':'')+rule.rule+' — '+rule.hint+(rule.required?' 필요':' 유리'));$('camp-map-panel').setAttribute('data-gate',gateNow?gateNow.type:'');
    hudText($('stage-progress-note'),game.HUNT_MODES[selectedDifficulty].name+' · '+(selectedRunStage===limit&&completed<10?'현재 공략 지점':'선택한 출발 지점')+' '+selectedStage+'-'+selectedRunStage);
    const environment=manifest.chapters[selected.environment].environment;
    $('chapter-banner').style.backgroundImage='linear-gradient(90deg,#101319a8,#10131925),url("assets/'+(manifest.delivery?.[environment]??environment)+'")';hudText($('chapter-label'),'CHAPTER '+String(selected.id).padStart(2,'0')+' · '+selected.region);$('chapter-prev').disabled=selected.id<=1;$('chapter-next').disabled=selected.id>=Math.min(game.STAGES.length,profile.unlockedStage);hudText($('chapter-preview-name'),selected.name);hudText($('chapter-preview-boss'),(selected.special?'특수 보스 · ':'챕터 보스 · ')+selected.bossName);hudText($('chapter-tactic'),selected.tactic);
    for(const [i,species] of [...selected.roster,selected.bossSpecies].entries()){const design=MONSTERS[species],clip=manifest.clips[manifest.directions[species].walk.s];atlasThumbnail($('roster-art-'+i),clip.image,clip.frames[0],72);hudText($('roster-name-'+i),design.name);hudText($('roster-detail-'+i),species===selected.bossSpecies?'STAGE 10 · '+(selected.special?'특수 보스':'챕터 보스'):'STAGE '+stagesOf(selected,species).join('·')+' · '+(design.tactic??({skitter:'근접 추격',spitter:'원거리 사격',bulwark:'중갑 강타'}[design.role])));$('roster-art-'+i).setAttribute('aria-label',design.name);}
    for(const theme of game.THEMES){const b=$('stage-'+theme.id),first=regionChapters(theme.id)[0],on=theme.id===selected.theme,cleared=regionChapters(theme.id).filter(c=>c.id<=profile.clearedStage).length;b.disabled=first.id>profile.unlockedStage;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));hudText($('stage-progress-'+theme.id),cleared+'/'+game.CHAPTERS_PER_THEME);}
    hudText($('stat-summary'),'공격 '+Math.round(stats.damage)+' · 체력 '+Math.round(stats.maxHp));
    refreshGrowthBoard();$('start').disabled=!ready;
    hudText($('offline-note'),offline.gold?'정찰 보상: '+offline.minutes+'분 동안 골드 '+offline.gold+' · 경험치 '+offline.xp:profile.clearedStage?'정찰대가 열린 구역을 탐색 중이야. 다음 접속 때 최대 4시간 보상을 받아.':'첫 보스를 잡으면 접속하지 않은 동안 정찰 보상이 쌓여. 최대 4시간.');
    refreshCampScene(selected);refreshMapScene(selected,selectedPlan,previewSpecies,completed,limit);
  }else if(['defeat','victory'].includes(state.phase)&&!game.resultReady(state)){modal('','','','');
  }else if(['victory','defeat'].includes(state.phase)){
    const raidRun=state.run.raidId?game.raidDefinition(state.run.raidId):null,rushRun=!!state.run.rush,dungeon=raidRun?{kind:'레이드',name:raidRun.name}:rushRun?{kind:'보스 러시',name:'보스 러시'}:game.dungeonDefinition(state.run.dungeonId),victory=state.phase==='victory',timedOut=state.run.timedOut,unpaid=!victory&&state.run.stageType!=='normal';modal('result',victory?(state.difficulty?game.HUNT_MODES[state.difficulty].name+' 수문장 사냥 완료!':'수문장 사냥 완료!'):timedOut?'제한 시간이 끝났어.':'이번 사냥은 여기까지.',unpaid?'남은 몬스터 '+monsters+'마리 · 실패한 구간 보상 없음':timedOut?'남은 몬스터 '+monsters+'마리 · 획득한 것은 유지돼':'획득한 것은 유지돼',victory?state.stageId+'-'+state.run.stage+' 스테이지 완료':timedOut?'TIME OVER':'RETURN TO CAMP');
    $('dungeon-result-rewards').hidden=!dungeon;
    const learned=state.run.beastLearned;$('result-boss-ancients').hidden=!state.run.bossAncients.length&&!learned;hudText($('result-boss-ancients'),[state.run.bossAncients.length?'보스 고대 유물 · '+state.run.bossAncients.map(id=>game.ANCIENT_CATALOG.find(r=>r.id===id).name).join(' / '):'',learned?'괴수 기술 '+(learned.before?'등급 상승':'획득')+' · '+game.SKILL_BY_ID[learned.id].name+' ('+game.BEAST_GRADES[learned.grade].name+')':''].filter(Boolean).join('\n'));hudText($('result-loot'),'스테이지 보상 '+state.run.stageItems+' · 몬스터 드롭 '+state.run.monsterItems+' · 자동 분해 '+state.run.autoSalvaged);
    hudText($('result-style'),'완벽 회피 '+state.run.perfectDodges+' · 갑각 파쇄 '+state.run.guardBreaks+' · 폭발 '+state.run.explosions+' · 빙결 파쇄 '+state.run.synergyProcs.shatter+' · 출혈 처형 '+state.run.synergyProcs.execute+' · 제작 각인 '+state.run.craftedProcs+' · 재료 '+state.run.materials+(state.run.trainingGold?' · 숙련 환전 +'+state.run.trainingGold+' 골드':''));
    refreshResultLoot();hudText($('result-items'),String(state.run.items));hudText($('result-kills'),String(state.run.kills));hudText($('result-gold'),String(state.run.gold));hudText($('result-cores'),String(state.run.cores));hudText($('result-time'),duration(state.run.time));hudText($('result-xp'),'경험치 +'+state.run.xp);$('result-xp').setAttribute('title','기본 경험치 '+(state.run.xp-state.run.xpBonus)+' · 성장 보너스 +'+state.run.xpBonus);
    hudText($('result-note'),victory&&state.difficulty?(state.difficulty===1?'정예 10스테이지 완료 · 악몽 1스테이지부터 도전할 수 있어.':'악몽 공략 완료 · 남은 유물을 찾아 다시 도전해.'):victory&&state.stageId<3?'챕터 완료! 다음 챕터가 열렸어.':victory?'세 챕터 완료! 원하는 스테이지에 다시 도전할 수 있어.':unpaid?'구간 실패 · 보상 없음. 장비·스킬이나 프리셋을 바꾸고 '+countdown(state.run.timeLimit)+'으로 재도전할 수 있습니다.':timedOut?'획득 장비를 착용하고 성장·광역 스킬을 정비해봐. 재도전은 '+countdown(state.run.timeLimit)+'으로 시작해.':'완료한 전투와 수집한 성장은 저장돼. 같은 전투에 다시 도전해.');
    hudText($('result-stages'),String(state.run.rooms)+'개');
    hudText($('next-stage'),victory&&state.difficulty?'같은 난이도로 처음부터':victory?'다음 챕터로':'현재 스테이지 재도전');
    $('next-stage').hidden=victory&&state.stageId>=3&&!state.difficulty;
    if(dungeon){modal('result',dungeon.kind+(victory?' 완료!':' 실패'),victory?'모든 적을 처치했습니다. 보상을 저장했습니다.':timedOut?'제한 시간 60초를 넘겼습니다. 이번 던전의 보상은 없습니다.':'전투에서 쓰러졌습니다. 이번 던전의 보상은 없습니다.',dungeon.name+' · '+state.run.stage+(state.run.dungeonId==='tower'?'층':'단계'));hudText($('dungeon-result-list'),!victory?'획득 보상 없음':state.run.dungeonId==='tower'?(state.run.dungeonReward.firstClear?'첫 클리어 · '+dungeonRewardText(state.run.dungeonReward)+(game.towerBonusAt(state.run.stage)?' · 영구 '+game.towerBonusAt(state.run.stage).text:''):'이미 오른 층 · 보상 없음'):(state.run.dungeonReward.repeat?'반복 클리어 '+Math.round(game.DUNGEON_REPEAT_RATE*100)+'% · ':'첫 클리어 · ')+dungeonRewardText(state.run.dungeonReward));hudText($('result-note'),victory?'보상을 성장에 사용하거나 같은 단계에 다시 도전하세요.':'장비·스킬이나 프리셋을 바꿔 01:00으로 재도전하세요.');hudText($('next-stage'),'같은 던전 재입장');$('next-stage').hidden=false;hudText($('result-loot'),'성장 재료 확정 보상 · 장신구 40% 확률');
     if(raidRun){const left=game.raidEntriesLeft(profile,raidRun.id,Date.now());modal('result','레이드 '+(victory?'완료!':'실패'),victory?raidRun.name+'을(를) 쓰러뜨렸습니다. 보상을 저장했습니다.':timedOut?'제한 시간 '+game.RAID_TIME_LIMIT+'초를 넘겼습니다. 입장 횟수는 돌아오지 않습니다.':'전투에서 쓰러졌습니다. 입장 횟수는 돌아오지 않습니다.',raidRun.name+' · '+state.run.raidChapter+'장 기준');hudText($('result-note'),(victory?'':'추천 빌드 · '+raidRun.build+' · ')+'이번 주 남은 입장 '+left+'회');hudText($('next-stage'),'같은 레이드 재입장 ('+left+'회 남음)');$('next-stage').hidden=left<1;hudText($('result-loot'),'레이드 확정 보상 · 레이드 고대 '+Math.round(game.DROP_CHANCE.raid*100)+'% 확률');}
     // Alpha 0.136 보스 러시: a run with a boss felled always settles; the end reason is the run's own.
     if(rushRun){const left=game.rushEntriesLeft(profile,Date.now()),kills=state.run.rushKills,item=state.run.dungeonReward?.item;modal('result','보스 러시 '+kills+' / '+game.RUSH_BOSSES,kills===game.RUSH_BOSSES?'다섯 보스를 모두 쓰러뜨렸습니다. 인장 확정 보상.':state.run.rushEnd==='timeout'?'제한 시간이 끝났습니다. 쓰러뜨린 보스만큼 보상을 받았습니다.':kills?'쓰러졌지만 쓰러뜨린 보스만큼 보상을 받았습니다.':'보스를 하나도 쓰러뜨리지 못했습니다. 입장 횟수는 돌아오지 않습니다.',state.run.rushChapter+'장 기준');hudText($('dungeon-result-list'),kills?dungeonRewardText(state.run.dungeonReward):'획득 보상 없음');hudText($('result-note'),(item?game.SEAL_GRADES[item.seal.grade].name+' 인장 획득 · ':'')+'오늘 남은 입장 '+left+'회');hudText($('next-stage'),'보스 러시 재입장 ('+left+'회 남음)');$('next-stage').hidden=left<1;hudText($('result-loot'),'보스 러시 · 인장 조각 · 인장 '+Math.round(game.RUSH_SEAL_CHANCE[kills]*100)+'% 확률');}}

  }else if(state.paused){modal('pause','일시정지','','');}
  else modal('','','','');
  updateRegionUi();
}
function processAudio(){
  if(lastAudioHunt!==profile.hunts){lastAudioHunt=profile.hunts;lastAudioId=0;}
  let impacts=0,guards=0,casts=0,spits=0,skitterSounds=0,uniqueSounds=0,dropSound=null,pickupSound=null,goldSound=null,materialSound=null;for(const f of state.effects)if(f.id>lastAudioId&&f.type==='gearDrop'&&(!dropSound||f.rarity+(f.item?.perfect ? .5 : 0)>dropSound.rarity+(dropSound.item?.perfect ? .5 : 0)))dropSound=f;
  for(const f of state.effects){if(f.id<=lastAudioId)continue;if(f.type==='lootPickup'&&(!pickupSound||f.rarity+(f.perfect ? .5 : 0)>pickupSound.rarity+(pickupSound.perfect ? .5 : 0)))pickupSound=f;if(f.type==='resourceCollect'){if(f.kind==='gold')goldSound=f;else if(!materialSound||game.MATERIAL_BY_ID[f.materialId]?.rare)materialSound=f;}}
  for(const f of state.effects){if(f.id<=lastAudioId)continue;if(['unique','uniqueLink','ancientSig','synergy'].includes(f.type)&&uniqueSounds++>=1)continue;if(f.type==='materialDrop'&&!game.MATERIAL_BY_ID[f.materialId]?.rare)continue;if(f.type==='gearDrop'&&f!==dropSound||f.type==='loot'&&f.origin==='monster')continue;if(f.type==='lootPickup'&&f!==pickupSound||f.type==='resourceCollect'&&f!==goldSound&&f!==materialSound)continue;if(f.type==='guardHit'&&guards++>=2)continue;if((f.type==='skillCast'||f.type==='skillMark')&&casts++>=2)continue;if(f.type==='impact'&&(f.guarded||impacts++>=2))continue;if(f.type==='spit'&&spits++>=1)continue;if(['skitterStrike','skitterDeath'].includes(f.type)&&skitterSounds++>=2)continue;if(!state.paused)audio.play(f.type==='skillCast'||f.type==='skillMark'?'skillCast':f.type,{skillId:f.skillId,combo:f.combo,motion:f.motion,heavy:f.heavy,rarity:f.rarity,perfect:f.perfect===true||f.item?.perfect===true,kind:f.kind,materialId:f.materialId,tone:f.type==='materialDrop'?(f.materialId==='origin'?1100:740):f.tone});}
  for(const f of state.effects)lastAudioId=Math.max(lastAudioId,f.id);
}
const frameMetrics=new FrameMetrics();let metricHunt=-1;
function tick(now){
  const frameStart=clockMs(),interval=previous?Math.max(0,now-previous):0;
  if((window.devicePixelRatio||1)!==renderDpr)resizeViewport();
  const dt=previous?Math.min(.05,Math.max(0,(now-previous)/1000)):0;previous=now;
  if(ready&&!document.hidden&&!orientationBlocked){
    const oldPhase=state.phase,oldSubstage=state.run.stage,oldFlow=state.run.flow,oldLevel=profile.level,oldGold=profile.gold,oldCores=profile.cores,oldMaterials=state.run.materials,oldResources=state.run.resourceRevision,active=state.phase==='playing'&&!state.paused&&dt>0;
    if(metricHunt!==profile.hunts){metricHunt=profile.hunts;frameMetrics.reset();$('game-shell').setAttribute('data-frame-samples','0');}
    game.advanceGame(state,dt,input());const engineEnd=clockMs();
    if(skillRequest&&((state.skillRuntime.cooldowns[skillRequest.id]??0)>0||state.run.time>skillRequest.until||state.phase!=='playing'))skillRequest=null;
    if(oldPhase==='playing'&&state.phase!=='playing'){suppressHeldSpace=keys.has(' ');clearInput();}if(oldSubstage!==state.run.stage||oldFlow!==state.run.flow&&state.run.flow==='stageClear')clearInput();processAudio();camera=cameraFor(state.player,state.bounds,viewport,GROUND_DEPTH_SCALE);
    // Camp is fully covered by its illustrated screens; avoid painting behind them.
    const drawRan=combatReady&&regionAssets.residentId===displayRegionId()&&state.phase!=='camp';if(drawRan)draw();const drawEnd=clockMs();
    const hudRan=true;updateHud();const hudEnd=clockMs();saveClock+=dt;
    if(state.settlement&&!storageBlocked||saveClock>=2||oldPhase!==state.phase||oldLevel!==profile.level||oldGold!==profile.gold||oldCores!==profile.cores||oldMaterials!==state.run.materials||oldResources!==state.run.resourceRevision){save();saveClock=0;}
    const frameEnd=clockMs();
    if(active){
      const m=frameMetrics.add({cpu:frameEnd-frameStart,engine:engineEnd-frameStart,draw:drawEnd-engineEnd,hud:hudEnd-drawEnd,storage:frameEnd-hudEnd,interval,hudRan,drawRan,enemies:state.enemies.filter(e=>!e.dead).length,effects:state.effects.length});
      if(m){const shell=$('game-shell');shell.setAttribute('data-cpu-p95-ms',m.cpuP95.toFixed(3));shell.setAttribute('data-cpu-max-ms',m.cpuMax.toFixed(3));shell.setAttribute('data-frame-samples',String(m.samples));shell.setAttribute('data-frame-hunt',String(metricHunt));shell.setAttribute('data-frame-metrics',JSON.stringify(m));}
    }
  }
  requestAnimationFrame(tick);
}
window.addEventListener('resize',resizeViewport);
if(typeof ResizeObserver==='function')new ResizeObserver(resizeViewport).observe(canvas);
if(typeof ResizeObserver==='function'){
 const observer=new ResizeObserver(entries=>{for(const entry of entries)fitBagGrid(entry.target,entry.contentRect.width,entry.contentRect.height);});
 observer.observe($('bag-grid'));observer.observe($('bag-material-grid'));
}else window.addEventListener('resize',()=>resizeBagGrids());
if(typeof ResizeObserver==='function'){
 const observer=new ResizeObserver(entries=>{const index=inventoryView.findIndex(item=>item.id===bagSelectedId);if(entries.some(entry=>entry.target.id==='item-read-text-'+index))refreshBagDetailReading();});
 for(let i=0;i<BAG_SLOT_COUNT;i++)observer.observe($('item-read-text-'+i));
}else window.addEventListener('resize',refreshBagDetailReading);
document.fonts?.ready.then(()=>{bagDetailReadKey='';refreshBagDetailReading();});
resizeViewport();updateHud();boot();requestAnimationFrame(tick);

function openCodex(keepSlot=false){if(!ready||state.phase!=='camp')return;if(keepSlot!==true&&codexSlot==='materials')codexSlot='all';trackOpen=false;craftOpen=false;campDrawer=campDrawer==='more'?'':campDrawer;codexOpen=true;inventoryOpen=false;campChoices=false;codexDetailOpen=false;codexFiltersOpen=false;codexSelection=profile.targetAncientId??codexSelection;codexRenderKey='';updateHud();window.hunterPages?.first($('codex-content'));}
function openCodexDetail(id,origin){
 if(!codexOpen||state.phase!=='camp'||!game.ANCIENT_CATALOG.some(r=>r.id===id))return;
 // Alpha 0.141 (재료 도감처럼): the detail sits beside the gallery, so a card only selects.
 codexSelection=id;codexOrigin=origin;codexDetailOpen=false;codexRenderKey='';updateHud();
}
function closeCodexDetail(){
 if(!codexOpen||state.phase!=='camp')return;codexDetailOpen=false;updateHud();
 const origin=$(codexOrigin),button=origin.hidden?$('codex-search'):origin;window.hunterPages?.reveal(button);button.focus({preventScroll:true});
}
// Alpha 0.110: ancients drop from chapter bosses of their region; route to the furthest unlocked chapter's boss.
// Raid ancients (Alpha 0.123) are region 7: no chapter range, named after their raid.
function ancientSourceName(row){return row.raid?'레이드 · '+game.raidDefinition(row.raid).name:game.THEMES[row.region-1].name;}
function ancientRegionChapters(row){const lo=(row.region-1)*game.CHAPTERS_PER_THEME+1;return [lo,lo+game.CHAPTERS_PER_THEME-1];}
function prepareTarget(row){if(!row||!ready||state.phase!=='camp')return false;if(row.raid){codexOpen=false;dungeonMode='raid';selectedRaid=row.raid;openDungeons();return true;}const [lo,hi]=ancientRegionChapters(row),id=Math.min(hi,profile.unlockedStage);if(id<lo)return false;navigateCamp('hunt');selectedStage=0;selectChapter(id);selectedRunStage=game.stageLimit(profile,id,selectedDifficulty);updateHud();return true;}

$('camp-codex').addEventListener('click',openCodex);
$('codex-back').addEventListener('click',()=>{codexOpen=false;updateHud();});
$('codex-list-back').addEventListener('click',closeCodexDetail);
$('codex-target').addEventListener('click',()=>{if(codexOpen&&codexDetailOpen&&state.phase==='camp'&&game.setAncientTarget(profile,codexSelection)){save();updateHud();}});
$('codex-clear').addEventListener('click',()=>{if(codexOpen&&state.phase==='camp'){game.setAncientTarget(profile,null);save();updateHud();}});
$('codex-route').addEventListener('click',()=>{if(codexOpen&&codexDetailOpen)prepareTarget(game.ANCIENT_CATALOG.find(r=>r.id===codexSelection));});
$('codex-hunt').addEventListener('click',()=>navigateCamp('hunt'));
$('target-hunt').addEventListener('click',()=>prepareTarget(game.targetAncient(profile)));
for(let i=0;i<game.ANCIENT_CATALOG.length;i++)$('codex-card-'+i).addEventListener('click',()=>openCodexDetail(game.ANCIENT_CATALOG[i].id,'codex-card-'+i));
$('codex-feature-open').addEventListener('click',()=>{const id=profile.discoveredAncients.filter(id=>game.ANCIENT_CATALOG.some(r=>r.id===id)).at(-1);if(id)openCodexDetail(id,'codex-feature-open');});
$('codex-filter-toggle').addEventListener('click',()=>{if(!codexOpen)return;codexFiltersOpen=!codexFiltersOpen;updateHud();});
for(const [id,set]of [['codex-chapter',v=>codexChapter=v],['codex-slot',v=>codexSlot=v],['codex-found',v=>codexFound=v],['codex-sort',v=>codexSort=v]])$(id).addEventListener('change',e=>{set(e.target.value);codexDetailOpen=false;updateHud();});
for(const slot of ['all','weapon','armor','charm','special','materials'])$('codex-tab-'+slot).addEventListener('click',()=>{codexSlot=slot;codexDetailOpen=false;updateHud();});
for(const layout of ['grid','list'])$('codex-view-'+layout).addEventListener('click',()=>{codexLayout=layout;updateHud();});
$('codex-page-prev').addEventListener('click',()=>{if(codexPage>0){codexPage--;updateHud();}});
$('codex-page-next').addEventListener('click',()=>{codexPage++;updateHud();});
$('codex-filter-reset').addEventListener('click',()=>{codexChapter='0';codexSlot='all';codexFound='all';codexSort='catalog';codexSearch='';$('codex-search').value='';updateHud();});
$('codex-search').addEventListener('input',e=>{codexSearch=e.target.value.trim().slice(0,80).toLowerCase();codexDetailOpen=false;updateHud();});
function selectHuntMode(id){
 if(!ready||state.phase!=='camp'||!game.stageLimit(profile,selectedStage,id)||id===selectedDifficulty)return;
 launchRevision++;selectedDifficulty=id;selectedRunStage=1;updateHud();
}
for(const mode of game.HUNT_MODES){
 $('hunt-mode-'+mode.id).addEventListener('click',()=>selectHuntMode(mode.id));
 $('map-mode-'+mode.id).addEventListener('click',()=>selectHuntMode(mode.id));
}
$('replay-prepare').addEventListener('click',()=>{if(ready&&state.phase==='camp'&&game.stageLimit(profile,selectedStage,selectedDifficulty)){
 selectedRunStage=Math.min(selectedRunStage,game.stageLimit(profile,selectedStage,selectedDifficulty));
 if(campDrawer==='tactics'){campDrawer='map';campDrawerOrigin='nav-hunt';}updateHud();if(campDrawer==='map')$('camp-map-start').focus({preventScroll:true});
}});
function refreshFarmCamp(){
 const target=game.targetAncient(profile);$('camp-codex-count').textContent=profile.discoveredAncients.length+'/'+game.ANCIENT_CATALOG.length;$('target-hunt').hidden=!target;$('target-hunt').disabled=true;
 $('farm-target-note').textContent=target?'파밍 목표 · '+target.name+' / '+(target.raid?ancientSourceName(target):ancientRegionChapters(target).join('~')+'장 보스')+(profile.discoveredAncients.includes(target.id)?' · 발견 완료':' · 미발견'):'도감에서 원하는 고대 유물을 파밍 목표로 지정해.';
 if(!game.stageLimit(profile,selectedStage,selectedDifficulty))selectedDifficulty=0;
 $('replay-panel').hidden=selectedStage>profile.clearedStage;$('replay-locked').hidden=selectedStage<=profile.clearedStage;const mode=game.HUNT_MODES[selectedDifficulty];
 const chapter=game.STAGES[selectedStage-1];$('replay-chapter').textContent=chapter.name+' · CHAPTER '+String(selectedStage).padStart(2,'0');$('replay-boss').textContent=chapter.bossName;$('tactics-launch-meta').textContent=mode.name+' · '+chapter.bossName;$('replay-rewards-title').textContent='주요 보상 · '+mode.name;{const k=game.modeScale(chapter.id,selectedDifficulty);$('replay-hp').textContent=timesText(k.hp);$('replay-damage').textContent=timesText(k.damage);$('replay-gold').textContent=timesText(k.reward);}$('replay-ancient').textContent=Math.round(game.ANCIENT_BOSS_CHANCE[selectedDifficulty]*100)+'%';$('replay-combat-note').textContent=(mode.shots?'탄막 +'+mode.shots+'발 · 패턴 순환 변경':'기본 공격 패턴')+' · 추가 괴수 핵 +'+mode.extraCore+(selectedDifficulty?' · 장비 능력치 ×'+game.HUNT_POWER[selectedDifficulty]+' · 희귀 이상 '+(100-game.HUNT_GRADE_TABLES[selectedDifficulty][0])+'%':'');$('replay-prepare').disabled=!ready||state.phase!=='camp'||!game.stageLimit(profile,selectedStage,selectedDifficulty);
 const mastery=profile.bossMastery[selectedStage-1],done=[selectedStage<=profile.clearedStage,game.bossModeAvailable(profile,selectedStage,1),mastery>=1,game.bossModeAvailable(profile,selectedStage,2)];for(let n=0;n<4;n++){$('replay-step-'+n).setAttribute('data-done',String(done[n]));$('replay-step-state-'+n).textContent=done[n]?'완료':'미완료';}
 for(const m of game.HUNT_MODES){
  const available=game.stageLimit(profile,selectedStage,m.id)>0,button=$('hunt-mode-'+m.id),mapButton=$('map-mode-'+m.id);
  const locked=modeLockText(m.id,selectedStage);
  button.disabled=!available;button.setAttribute('aria-pressed',String(m.id===selectedDifficulty));$('hunt-mode-status-'+m.id).textContent=button.disabled?locked:['기본 난도','더 강한 적','최고의 도전'][m.id];
  mapButton.disabled=!ready||!available;
  mapButton.setAttribute('aria-pressed',String(m.id===selectedDifficulty));$('map-mode-status-'+m.id).textContent=available?'완료 '+game.completedStages(profile,selectedStage,m.id)+'/10':locked;
 }
 {const record=selectedDifficulty===2?profile.nightmareRecords[selectedStage-1]:0;$('map-difficulty-note').textContent=mode.name+' · '+selectedRunStage+'스테이지 선택 · '+(selectedDifficulty===2?'경험치 없음 · '+(record?'보스 기록 '+record+'초':'보스 기록 없음'):'난이도를 바꾸면 1단계부터 시작해. 공략 기록은 난이도별로 저장돼.');}
 {const k=game.modeScale(selectedStage,selectedDifficulty);$('replay-info').textContent=mode.name+(selectedDifficulty?' · 일반 '+Math.round(k.chapter)+'장 강도':'')+' · 보스 체력 '+timesText(k.hp)+' / 피해 '+timesText(k.damage)+' · 보스 골드 '+timesText(k.reward)+' · 추가 장비당 고대 '+mode.ancientChance.toFixed(2)+'%'+(mode.shots?' · 탄막 +'+mode.shots+'발 · 패턴 순환 변경':'');}
 $('replay-unlock').textContent=game.bossModeAvailable(profile,selectedStage,2)?'악몽 해금 완료 · 원하는 난이도로 재도전할 수 있어.':'일반 60장을 모두 깨면 정예 1장부터, 정예 60장을 모두 깨면 악몽 1장부터 하나씩 열려.';
}
// Fit whole cards to the gallery instead of scrolling: columns come from the CSS grid, rows from the free height.
function codexPageSize(){
 const grid=$('codex-grid'),width=grid.clientWidth,height=grid.clientHeight;
 if(codexDetailOpen||typeof window.getComputedStyle!=='function'||!(width>0)||!(height>0))return game.ANCIENT_CATALOG.length;
 const style=window.getComputedStyle(grid),gap=parseFloat(style.rowGap)||6,list=codexLayout==='list';
 const columns=Math.max(1,String(style.gridTemplateColumns||'').trim().split(/\s+/).filter(Boolean).length);
 const row=parseFloat(style.getPropertyValue?.(list?'--codex-list-row':'--codex-card-row'))||(list?64:96);
 const rows=Math.max(1,Math.floor((height+gap)/(row+gap)));
 if(grid.style.getPropertyValue?.('--codex-rows')!==String(rows))grid.style.setProperty?.('--codex-rows',String(rows));
 return columns*rows;
}
function refreshCodex(){
 const pageSize=codexPageSize(),pageFilter=[codexChapter,codexSlot,codexFound,codexSearch,codexSort,codexLayout].join('|');if(pageFilter!==codexPageFilter){codexPageFilter=pageFilter;codexPage=0;}
 const key=[profile.discoveredAncients.join(','),profile.targetAncientId,codexSelection,codexChapter,codexSlot,codexFound,codexSearch,codexDetailOpen,codexFiltersOpen,codexLayout,codexSort,codexPage,pageSize,codexSlot==='materials'?materialSelected+':'+materialRecipeId+':'+profile.targetCraftId+':'+JSON.stringify(profile.materials)+':'+profile.unlockedStage:''].join('|');if(key===codexRenderKey)return;codexRenderKey=key;
 const found=new Set(profile.discoveredAncients),catalog=game.ANCIENT_CATALOG;let visible=0;
 $('codex-content').setAttribute('data-detail',String(codexDetailOpen));$('codex-browser').hidden=false;$('codex-detail').hidden=codexSlot==='materials';
 $('codex-filters').hidden=!codexFiltersOpen;$('codex-filter-toggle').setAttribute('aria-expanded',String(codexFiltersOpen));
 $('codex-chapter').value=codexChapter;$('codex-slot').value=codexSlot;$('codex-found').value=codexFound;$('codex-sort').value=codexSort;
 $('codex-filter-dot').hidden=codexChapter==='0'&&codexFound==='all'&&codexSort==='catalog';
 $('codex-filter-caption').textContent=codexChapter==='0'?'필터':codexChapter==='7'?'레이드':game.THEMES[Number(codexChapter)-1].name;
 for(const slot of ['all','weapon','armor','charm','special','materials'])$('codex-tab-'+slot).setAttribute('aria-pressed',String(slot===codexSlot));
 const mats=codexSlot==='materials';$('codex-content').setAttribute('data-view',mats?'materials':'ancient');$('material-codex').hidden=!mats;if(mats){refreshMaterialCodex();return;}
 for(const layout of ['grid','list'])$('codex-view-'+layout).setAttribute('aria-pressed',String(layout===codexLayout));
 $('codex-grid').setAttribute('data-layout',codexLayout);
 const ordered=catalog.map((row,i)=>({row,i}));
 if(codexSort==='name')ordered.sort((a,b)=>a.row.name.localeCompare(b.row.name,'ko'));
 else if(codexSort==='found')ordered.sort((a,b)=>Number(found.has(b.row.id))-Number(found.has(a.row.id))||a.i-b.i);
 $('codex-grid').replaceChildren(...ordered.map(({i})=>$('codex-card-'+i)));
 const codexMatch=(row,discovered)=>(codexChapter==='0'||row.region===Number(codexChapter))&&(codexSlot==='all'||game.matchesEquipmentCategory(row,codexSlot))&&(codexFound==='all'||discovered===(codexFound==='found'))&&(!codexSearch||(row.name+' '+row.signature.name+' '+row.signature.description).toLowerCase().includes(codexSearch));
 const matches=ordered.filter(({row})=>codexMatch(row,found.has(row.id))),pages=Math.max(1,Math.ceil(matches.length/pageSize));codexPage=Math.max(0,Math.min(codexPage,pages-1));
 const shown=new Set(matches.slice(codexPage*pageSize,(codexPage+1)*pageSize).map(({i})=>i));
 $('codex-paging').hidden=pages<=1;$('codex-page-label').textContent=(codexPage+1)+' / '+pages;$('codex-page-prev').disabled=codexPage<=0;$('codex-page-next').disabled=codexPage>=pages-1;
 for(const [i,row]of catalog.entries()){
  const discovered=found.has(row.id),match=codexMatch(row,discovered);
  const node=$('codex-card-'+i);node.hidden=!shown.has(i);if(match)visible++;node.setAttribute('data-discovered',String(discovered));node.setAttribute('data-goal',String(profile.targetAncientId===row.id));node.setAttribute('aria-pressed',String(row.id===codexSelection));$('codex-name-'+i).textContent=row.name;$('codex-state-'+i).textContent=(profile.targetAncientId===row.id?'목표 · ':'')+(discovered?'발견':'미발견')+' · '+game.SLOTS[row.slot];gearThumbnail($('codex-art-'+i),{...row,catalogId:row.id,rarity:5},144);if(!discovered)$('codex-art-'+i).setAttribute('aria-label','미발견 유물 이미지');
 }
 const percent=Number((found.size/catalog.length*100).toFixed(1));
 $('codex-count').textContent=found.size+' / '+catalog.length+' 발견';$('codex-percent').textContent=percent+'%';$('codex-progress').setAttribute('aria-valuenow',String(found.size));$('codex-progress-fill').style.width=percent+'%';$('codex-search').setAttribute('placeholder','유물 검색 · 발견 '+found.size+' / '+catalog.length);$('codex-results').textContent=visible?'발견 '+found.size+' / '+catalog.length+' · '+visible+'종 표시':'검색 조건에 맞는 유물이 없어.';$('codex-empty').hidden=visible>0;
 const recentId=profile.discoveredAncients.filter(id=>catalog.some(r=>r.id===id)).at(-1),recent=catalog.find(r=>r.id===recentId);
 $('codex-feature').setAttribute('data-empty',String(!recent));$('codex-feature-open').hidden=!recent;$('codex-feature-empty').hidden=!!recent;$('codex-feature-art').hidden=!recent;
 $('codex-feature-kicker').textContent=recent?'최근 발견':'기록의 시작';$('codex-feature-name').textContent=recent?recent.name.replace(' ','\n'):'첫 고대 유물을 찾아서';$('codex-feature-meta').textContent=recent?ancientSourceName(recent)+' · '+game.SLOTS[recent.slot]:'고대 장비는 챕터 보스 희귀 드롭 · 레이드 고대는 레이드 클리어 보상';
 if(recent)gearThumbnail($('codex-feature-art'),{...recent,catalogId:recent.id,rarity:5},200);
 const row=catalog.find(r=>r.id===codexSelection),discovered=found.has(row.id),boss=game.BOSS_LOOT[row.tier-1];
 $('codex-detail').setAttribute('data-discovered',String(discovered));gearThumbnail($('codex-detail-art'),{...row,catalogId:row.id,rarity:5},200);if(!discovered)$('codex-detail-art').setAttribute('aria-label','미발견 유물 이미지');$('codex-detail-name').textContent=row.name;$('codex-detail-state').textContent=(discovered?'발견한 고대 유물':'미발견 고대 유물')+' · '+(game.SLOTS[row.slot]??'');$('codex-detail-boss').textContent=discovered?'':'아직 얻지 못했습니다';
 $('codex-signature').textContent=row.signature.name+' — '+row.signature.description;hudText($('codex-info-power'),row.raid?'레이드 고대 · 정예·악몽 레이드는 능력치·위력 강화와 각성·심연 효과':row.tier+'티어 위력 ×'+game.ANCIENT_TIER_POWER[row.tier-1].toFixed(1)+' · 정예 획득 ×'+game.ANCIENT_HUNT_POWER[1]+' · 악몽 획득 ×'+game.ANCIENT_HUNT_POWER[2]+'와 추가 특수효과');hudText($('codex-info-source'),row.raid?ancientSourceName(row)+' 레이드':(([lo,hi])=>game.THEMES[row.region-1].name+' · '+lo+'~'+hi+'장 보스')(ancientRegionChapters(row)));hudText($('codex-info-chance'),row.raid?'레이드 클리어 시 '+Math.round(game.DROP_CHANCE.raid*100)+'% · 주간 '+game.RAID_WEEKLY_ENTRIES+'회':'일반 '+Math.round(game.ANCIENT_BOSS_CHANCE[0]*100)+'% · 정예 '+Math.round(game.ANCIENT_BOSS_CHANCE[1]*100)+'% · 악몽 '+Math.round(game.ANCIENT_BOSS_CHANCE[2]*100)+'%');$('codex-affixes').textContent=Object.entries(row.base).map(([k,v])=>game.AFFIXES[k]+' +'+v+(['speed','crit','reduction'].includes(k)?'%':'')).join(' · ');$('codex-base-power').textContent=row.signatureOnly?'고대 장비 전용 각인':game.UNIQUE_EFFECTS[row.effectId].name+' — '+game.UNIQUE_EFFECTS[row.effectId].description+' · 고대 고정 위력 1.36배';$('codex-target').disabled=profile.targetAncientId===row.id;$('codex-target').textContent=profile.targetAncientId===row.id?'현재 파밍 목표':'파밍 목표 지정';$('codex-clear').hidden=!profile.targetAncientId;
 if(row.raid){$('codex-route').disabled=!game.raidUnlocked(profile,row.raid);$('codex-route-note').textContent=game.raidDefinition(row.raid).name+' 레이드 클리어 시 '+Math.round(game.DROP_CHANCE.raid*100)+'% · 주간 '+game.RAID_WEEKLY_ENTRIES+'회 입장';}else{const [lo,hi]=ancientRegionChapters(row);$('codex-route').disabled=profile.unlockedStage<lo;$('codex-route-note').textContent=lo+'~'+hi+'장 보스 희귀 드롭 · 일반 '+Math.round(game.ANCIENT_BOSS_CHANCE[0]*100)+'% · 정예 '+Math.round(game.ANCIENT_BOSS_CHANCE[1]*100)+'% · 악몽 '+Math.round(game.ANCIENT_BOSS_CHANCE[2]*100)+'%';}
}

function refreshCraft(){
 const key=[craftSelected,craftSlot,profile.gold,profile.inventory.map(i=>i.id+':'+i.catalogId).join(','),Object.values(profile.materials).join(','),profile.unlockedStage,Object.values(profile.equipment).join(','),craftFeedback,profile.targetCraftId].join('|');if(key===craftRenderKey)return;craftRenderKey=key;
 const row=game.CRAFTED_CATALOG.find(r=>r.id===craftSelected),status=game.craftStatus(profile,row.id),copies=profile.inventory.filter(i=>i.rarity===6&&i.catalogId===row.id),owned=copies.find(i=>!game.isEquippedItem(profile,i))??copies[0],complete=copies.length>=(row.slot==='earring'?2:1);
 for(const slot of ['all','weapon','armor','charm','special'])$('craft-slot-'+slot).setAttribute('aria-pressed',String(slot===craftSlot));
 for(const [n,r]of game.CRAFTED_CATALOG.entries()){const node=$('craft-recipe-'+n);node.hidden=r.slot==='special'||craftSlot!=='all'&&!game.matchesEquipmentCategory(r,craftSlot);node.setAttribute('aria-pressed',String(r.id===row.id));gearThumbnail($('craft-recipe-art-'+n),{...r,catalogId:r.id},56,true);if(!node.hidden){const have=profile.inventory.filter(i=>i.rarity===6&&i.catalogId===r.id).length,need=r.slot==='earring'?2:1,costs=Object.entries(r.cost),met=costs.filter(([id,c])=>profile.materials[id]>=c).length,state=have>=need?'owned':game.craftStatus(profile,r.id).ok?'ready':'short';node.setAttribute('data-state',state);$('craft-recipe-state-'+n).textContent=state==='owned'?'보유':(have?'보유 '+have+' / '+need+' · ':profile.targetCraftId===r.id?'목표 · ':'')+(state==='ready'?'제작 가능':'재료 '+met+' / '+costs.length);}}
 $('craft-detail').setAttribute('data-slot',row.slot);
 gearThumbnail($('craft-art'),{...row,catalogId:row.id},260,true);$('craft-name').textContent=row.name;$('craft-kind').textContent='제작 · '+game.SLOTS[row.slot];$('craft-flavor').textContent=row.id.includes('frost')?'영원이 얼어붙는 날, 만들어진 장비.':'붉은 달 아래, 사냥의 끝을 벼리다.';
 $('craft-stats').replaceChildren(...Object.entries(row.base).map(([k,v])=>{const node=document.createElement('div'),label=document.createElement('dt'),value=document.createElement('dd');label.textContent=game.AFFIXES[k];value.textContent='+'+v+(['speed','crit','reduction'].includes(k)?'%':'');node.replaceChildren(label,value);return node;}));
 const power=game.UNIQUE_EFFECTS[row.effectId];$('craft-powers').textContent=(power?power.name+' — '+power.description+' · 고정 위력 1.50배\n':'')+row.signature.name+' — '+row.signature.description;
 $('craft-costs').setAttribute('data-count',String(Object.keys(row.cost).length));let readyCount=0,total=0;for(const m of game.MATERIALS){const cost=row.cost[m.id],ready=profile.materials[m.id]>=(cost??0);$('craft-cost-'+m.id).hidden=!cost;if(cost){total++;if(ready)readyCount++;}$('craft-count-'+m.id).textContent=profile.materials[m.id]+' / '+(cost??0);$('craft-cost-'+m.id).setAttribute('data-ready',String(ready));$('craft-material-'+m.id).setAttribute('aria-label',m.name+' '+profile.materials[m.id]+' / '+(cost??0)+' · 수집처 보기');$('material-owned-'+m.id).textContent=String(profile.materials[m.id]);}
 $('craft-ready').textContent=row.slot==='earring'?'보유 '+copies.length+' / 2 · 준비 '+readyCount+' / '+total:owned?'제작 완료':'준비 '+readyCount+' / '+total;$('craft-target').disabled=profile.targetCraftId===row.id;$('craft-target').textContent=profile.targetCraftId===row.id?'현재 제작 목표':'제작 목표 지정';$('craft-track').disabled=false;
 $('craft-gold').textContent=row.gold.toLocaleString('ko-KR');$('craft-gold-owned').textContent='보유 '+profile.gold.toLocaleString('ko-KR');$('craft-status').textContent=status.reason;$('craft-status').setAttribute('data-ready',String(status.ok));$('craft-submit').disabled=!status.ok;$('craft-submit').textContent=owned&&!status.ok&&status.reason.includes('이미 보유')?'제작 완료':'제작하기';$('craft-equip').hidden=!owned||row.slot==='earring'&&!complete;$('craft-equip').disabled=!owned||game.isEquippedItem(profile,owned);$('craft-equip').textContent=row.slot==='earring'?'착용 위치 선택':'장착';$('craft-feedback').textContent=craftFeedback;
}
for(const slot of ['all','weapon','armor','charm','special'])$('craft-slot-'+slot).addEventListener('click',()=>{if(!craftOpen||state.phase!=='camp')return;craftSlot=slot;const row=game.CRAFTED_CATALOG.find(r=>r.id===craftSelected);if(slot!=='all'&&!game.matchesEquipmentCategory(row,slot))craftSelected=game.CRAFTED_CATALOG.find(r=>game.matchesEquipmentCategory(r,slot)).id;craftFeedback='';updateHud();});
$('camp-craft').addEventListener('click',()=>{if(!ready||state.phase!=='camp')return;trackOpen=false;craftOpen=true;codexOpen=false;inventoryOpen=false;campChoices=false;craftFeedback='';craftRenderKey='';updateHud();window.hunterPages?.first($('craft-content'));});
$('craft-back').addEventListener('click',()=>{craftOpen=false;updateHud();});
$('craft-inventory').addEventListener('click',()=>{craftOpen=false;openInventory();});
for(const [n,row]of game.CRAFTED_CATALOG.entries())$('craft-recipe-'+n).addEventListener('click',()=>{if(!craftOpen||state.phase!=='camp')return;craftSelected=row.id;craftFeedback='';updateHud();});
$('craft-submit').addEventListener('click',()=>{if(!craftOpen)return;const result=game.craftItem(state,craftSelected,$('craft-inscription').value||null);craftFeedback=result.reason;if(result.ok){save();audio.unlock();audio.play('gearDrop',{rarity:6});}updateHud();});
$('craft-equip').addEventListener('click',()=>{const copies=profile.inventory.filter(i=>i.catalogId===craftSelected&&i.rarity===6),item=copies.find(i=>!game.isEquippedItem(profile,i))??copies[0];if(!craftOpen||!item)return;if(item.slot==='earring'){openEquipmentItem(item);return;}if(game.equipItem(state,item.id)){appearance=equippedDesigns(profile);craftFeedback='제작 '+item.name+' 착용 완료';save();updateHud();}});

// Rebuild the goal model only after relevant profile changes; combat checks at most 8 counters.
function currentCraftProgress(){
 if(!game.targetCraft(profile)){goalCache=null;return null;}
 let changed=!goalCache||goalCache.id!==profile.targetCraftId||goalCache.gold!==profile.gold||goalCache.inventory!==profile.inventory||goalCache.length!==profile.inventory.length||goalCache.unlocked!==profile.unlockedStage||goalCache.cleared!==profile.clearedStage;
 if(!changed){for(let n=0;n<game.MATERIALS.length;n++)if(goalCache.counts[n]!==profile.materials[game.MATERIALS[n].id]){changed=true;break;}for(let n=0;n<game.STAGES.length;n++)if(goalCache.stages[n]!==profile.stageProgress[n])changed=true;}
 if(changed)goalCache={id:profile.targetCraftId,gold:profile.gold,inventory:profile.inventory,length:profile.inventory.length,unlocked:profile.unlockedStage,cleared:profile.clearedStage,stages:[...profile.stageProgress],counts:game.MATERIALS.map(m=>profile.materials[m.id]),progress:game.craftProgress(profile)};
 return goalCache.progress;
}
function refreshCraftGoalHud(){const progress=currentCraftProgress();$('craft-tracker').hidden=true;$('game-shell').setAttribute('data-craft-tracker','false');
 for(const id of ['camp-track','camp-track-note','result-track','result-craft-target'])$(id).hidden=!progress;
 if(!progress)return;const text=progress.recipe.name+' · '+progress.short;

 $('camp-track').setAttribute('aria-label','제작 목표 · 수집 상황 · '+progress.short);$('camp-track-note').textContent=text;$('result-craft-target').textContent='제작 목표 · '+text;
}
// Alpha 0.141 재료 도감 (사용자 요청 '재료 추적 창 없애고 재료 도감으로'): the old 재료 추적 modal and the in-battle tracker are
// gone. Every former entry (거점·결과·제작·더보기) opens the codex 재료 tab with the material (or the goal's first missing one).
let materialSelected='boneIron',materialRecipeId=null;
function trackedRecipe(){return game.CRAFTED_CATALOG.find(r=>r.id===materialRecipeId)??game.targetCraft(profile);}
function closeTrack(){}
function openTrack(recipeId=null,materialId=null){
 const recipe=typeof recipeId==='string'?game.CRAFTED_CATALOG.find(r=>r.id===recipeId):game.targetCraft(profile);if(!ready||state.phase!=='camp')return;
 materialRecipeId=recipe?.id??null;const progress=recipe?game.craftProgress({...profile,targetCraftId:recipe.id}):null;
 materialSelected=typeof materialId==='string'&&game.MATERIAL_BY_ID[materialId]?materialId:(progress?.rows.find(r=>!r.ready)??progress?.rows[0])?.material.id??materialSelected;
 codexSlot='materials';openCodex(true);
}
function refreshMaterialCodex(){
 const recipe=trackedRecipe(),progress=recipe?game.craftProgress({...profile,targetCraftId:recipe.id}):null,need=Object.fromEntries((progress?.rows??[]).map(r=>[r.material.id,r]));
 for(const m of game.MATERIALS){const card=$('mat-card-'+m.id),have=profile.materials[m.id]??0,row=need[m.id];hudText($('mat-name-'+m.id),m.name);hudText($('mat-have-'+m.id),row?have.toLocaleString('ko-KR')+' / '+row.need:have.toLocaleString('ko-KR'));
  card.setAttribute('aria-pressed',String(m.id===materialSelected));card.setAttribute('data-goal',row?(row.ready?'ready':'missing'):'none');card.setAttribute('data-rare',String(!!m.rare));}
 hudText($('mat-head'),'재료 '+game.MATERIALS.length+'종'+(recipe?' · 제작 목표 '+recipe.name+' '+(progress.rows.filter(r=>r.ready).length)+'/'+progress.rows.length+'종 준비':' · 제작 화면에서 목표를 지정하면 필요량이 보여요'));
 const m=game.MATERIAL_BY_ID[materialSelected],info=game.materialInfo(m.id)??{},row=need[m.id];
 {const n=game.MATERIAL_ICON_INDEX[m.id];$('mat-detail-icon').style.setProperty('--mx',(n%7*100/6)+'%');$('mat-detail-icon').style.setProperty('--my',(Math.floor(n/7)*100)+'%');}hudText($('mat-detail-name'),m.name);hudText($('mat-detail-kind'),m.rare?'희귀 재료':m.refining?'강화 재료':m.promotion?'승급 재료':m.tier?game.THEMES[m.tier-1].name+' 재료':m.id==='skillPage'?'스킬 재료':m.id==='sealShard'?'인장 재료':'제작 재료');
 hudText($('mat-detail-have'),'보유 '+(profile.materials[m.id]??0).toLocaleString('ko-KR'));hudText($('mat-detail-text'),info.text??'');hudText($('mat-detail-where'),m.where);hudText($('mat-detail-dungeon'),info.dungeon||'없음');hudText($('mat-detail-use'),info.use??'');
 $('mat-detail-goal-row').hidden=!recipe;if(recipe)hudText($('mat-detail-goal'),recipe.name+' · '+(row?(row.ready?'준비 완료 ':'')+(profile.materials[m.id]??0)+' / '+row.need:'필요 없음'));
 const routes=m.normal||m.elite||m.boss?game.craftMaterialRoutes(profile,m.id):[];
 for(let n=1;n<=3;n++){const route=routes.find(r=>r.theme===n),b=$('mat-route-'+n);b.hidden=!route;if(!route)continue;b.disabled=!route.available;hudText(b,route.name+' '+route.stage+'스테이지 · '+({boss:'보스',elite:'정예',normal:'일반'})[route.source]+' '+Math.round(route.chance*1000)/10+'%'+(route.available?' ›':' · '+route.reason));}
}
for(const m of game.MATERIALS)$('mat-card-'+m.id).addEventListener('click',()=>{if(!codexOpen||codexSlot!=='materials')return;materialSelected=m.id;codexRenderKey='';updateHud();});
for(let n=1;n<=3;n++)$('mat-route-'+n).addEventListener('click',()=>{if(!codexOpen||state.phase!=='camp')return;const route=game.craftMaterialRoutes(profile,materialSelected).find(r=>r.theme===n);if(!route?.available)return;codexOpen=false;navigateCamp('hunt');selectedStage=0;selectChapter(route.chapter);selectedRunStage=route.stage;updateHud();});
for(const id of ['camp-track','result-track'])$(id).addEventListener('click',()=>openTrack());
$('craft-target').addEventListener('click',()=>{if(!craftOpen||state.phase!=='camp')return;if(game.setCraftTarget(profile,craftSelected)){craftFeedback='제작 목표 지정 · '+game.targetCraft(profile).name;save();updateHud();}});
$('craft-track').addEventListener('click',()=>{if(craftOpen)openTrack(craftSelected);});
for(const m of game.MATERIALS)$('craft-material-'+m.id).addEventListener('click',()=>{const row=game.CRAFTED_CATALOG.find(r=>r.id===craftSelected);if(!craftOpen||!Object.hasOwn(row.cost,m.id))return;openTrack(craftSelected,m.id);});

// Alpha 0.36: home panels mirror the live profile; they never own equipment or progress.
let homeDashboardKey='';
function refreshHomeDashboard(selected){
 const stats=game.playerStats(profile),weapon=profile.inventory.find(i=>i.id===profile.equipment.weapon&&i.slot==='weapon');
 const key=JSON.stringify([selectedStage,selectedRunStage,selectedDifficulty,profile.stageProgress,profile.difficultyProgress,profile.level,profile.xp,profile.training,profile.growthTree,profile.inventory,profile.equipment,profile.skills,profile.forge]);if(key===homeDashboardKey)return;homeDashboardKey=key;
 $('lobby-growth-badge').hidden=game.growthPoints(profile)<=0;
 const xpPercent=profile.level===game.MAX_LEVEL?100:Math.floor(clamp(profile.xp/game.xpNeeded(profile.level)*100,0,100));
 $('home-xp-label').textContent=profile.level===game.MAX_LEVEL?'MAX':xpPercent+'%';$('home-xp-fill').style.width=xpPercent+'%';$('home-xp').setAttribute('aria-valuenow',String(xpPercent));
 $('home-route-chapter').textContent='CHAPTER '+String(selected.id).padStart(2,'0');$('home-route-title').textContent=selected.name;$('home-route-stage').textContent='STAGE '+String(selectedRunStage).padStart(2,'0')+' · '+game.HUNT_MODES[selectedDifficulty].name;$('home-route-description').textContent=HOME_ROUTE_TEXT[selected.theme-1]??selected.subtitle;
 $('hub-player-level').textContent='Lv. '+profile.level;$('hub-identity-chapter').textContent='CHAPTER '+String(selected.id).padStart(2,'0');$('hub-identity-name').textContent=selected.name;
 const completed=game.completedStages(profile,selected.id,selectedDifficulty);$('hub-progress-fill').style.width=completed/game.STAGES_PER_CHAPTER*100+'%';$('hub-progress-text').textContent=completed+' / '+game.STAGES_PER_CHAPTER;
 gearThumbnail($('dashboard-weapon-art'),weapon??{slot:'weapon',tier:1},172);$('dashboard-weapon-name').textContent=weapon?.name??'사냥꾼의 검';$('dashboard-weapon-grade').textContent=weapon?game.RARITIES[weapon.rarity]+' · 무기':'기본 무기';$('dashboard-weapon-trait').textContent=game.equippedWeaponTrait(profile)?.description??'첫 사냥을 준비하는 리리안의 검';
 $('dashboard-damage').textContent=Math.round(stats.damage);$('dashboard-health').textContent=stats.maxHp;$('dashboard-critical').textContent=(stats.crit*100).toFixed(1)+'%';$('dashboard-capacity').textContent=profile.inventory.length+' / '+game.INVENTORY_LIMIT;$('dashboard-empty').hidden=profile.inventory.length>0;
 for(let n=0;n<12;n++){const item=profile.inventory[n],b=$('dashboard-item-'+n);b.hidden=!item;if(!item)continue;gearThumbnail($('dashboard-art-'+n),item,58);b.style.borderColor=game.RARITY_INFO[item.rarity].color;b.setAttribute('aria-label',itemGradeName(item)+' '+item.name);$('dashboard-badge-'+n).textContent=game.isEquippedItem(profile,item)?'E':'';}
 $('dashboard-chapter-label').textContent='CHAPTER '+String(selected.id).padStart(2,'0');$('dashboard-chapter-name').textContent=selected.name;$('dashboard-stage-meta').textContent=selected.id+'–'+selectedRunStage+' · '+(selectedRunStage===game.STAGES_PER_CHAPTER?'수문장 공략':'다음 사냥');$('dashboard-stage-name').textContent=game.battlePlan(selectedRunStage).name;$('dashboard-stage-tactic').textContent=game.battlePlan(selectedRunStage).tactic;
 for(let n=1;n<=game.STAGES_PER_CHAPTER;n++){const b=$('dashboard-stage-'+n);$('dashboard-stage-number-'+n).textContent=selectedStage+'–'+n;b.disabled=n>game.stageLimit(profile,selectedStage,selectedDifficulty);b.setAttribute('aria-label',selectedStage+'–'+n+' '+game.battlePlan(n).name);b.setAttribute('aria-pressed',String(n===selectedRunStage));$('dashboard-stage-state-'+n).textContent=completed>=n?'완료':n>game.stageLimit(profile,selectedStage,selectedDifficulty)?'잠김':n===selectedRunStage?'선택':'';}
}
function navigateCamp(view){if(!ready||state.phase!=='camp')return;closeStatsSheet();launchRevision++;inventoryOpen=false;codexOpen=false;craftOpen=false;trackOpen=false;campChoices=false;campDrawer='';if(view==='equipment'||view==='bag'){openInventory(view==='equipment'?'equipment':'gear');return;}if(view==='codex'){openCodex();return;}if(view==='craft'){craftOpen=true;craftRenderKey='';}else if(view==='hunt'||view==='growth'||view==='more'){openCampDrawer(view==='hunt'?'map':view,view==='growth'?'nav-more':'nav-'+view);return;}updateHud();if(view==='home')$('start').focus({preventScroll:true});}
for(const view of ['hunt','growth','codex'])$('home-nav-'+view).addEventListener('click',()=>navigateCamp(view));
$('home-settings').addEventListener('click',()=>navigateCamp('more'));
for(const [id,view] of [['lobby-character','equipment'],['lobby-hero','equipment'],['lobby-bag','bag'],['lobby-equipment','equipment'],['lobby-craft','craft']])$(id).addEventListener('click',()=>navigateCamp(view));
$('lobby-skills').addEventListener('click',()=>openSkills('lobby-skills'));
$('lobby-missions').addEventListener('click',()=>openCampDrawer('map','lobby-missions'));
for(const id of ['lobby-events','lobby-message'])$(id).addEventListener('click',()=>openCampDrawer('tactics',id));
$('home-intel').addEventListener('click',()=>openCampDrawer('tactics','home-intel'));
for(const view of ['home','hunt','equipment','bag','craft','codex','growth','more'])$('nav-'+view).addEventListener('click',()=>navigateCamp(view));
for(const id of ['dashboard-equipment-open','dashboard-gear-tab'])$(id).addEventListener('click',()=>openInventory('equipment'));$('dashboard-bag-open').addEventListener('click',()=>openInventory());
$('dashboard-build-tab').addEventListener('click',()=>{openInventory('build');window.hunterPages?.reveal($('build-name-0'));});
$('dashboard-material-tab').addEventListener('click',()=>{navigateCamp('bag');setBagCategory('materials');});$('dashboard-growth-tab').addEventListener('click',()=>navigateCamp('growth'));
$('dashboard-map-open').addEventListener('click',()=>openCampDrawer('map','dashboard-map-open'));
$('dashboard-start').addEventListener('click',()=>start());
// Alpha 0.138 캐릭터 능력치 창 (사용자 요청): 엔진의 playerStats와 성장 트리 보너스를 그대로 읽어 보여 준다(읽기 전용).
let statsSheetReturn=null;
const signed=(v,unit='%')=>(v>0?'+':'')+Number(v.toFixed(1))+unit;
function refreshStatsSheet(){
 if($('stats-sheet').hidden)return;
 const stats=game.playerStats(profile),tree=game.treeBonus(profile),max=profile.level===game.MAX_LEVEL,need=game.xpNeeded(profile.level),xp=max?100:Math.floor(clamp(profile.xp/need*100,0,100));
 hudText($('stat-sheet-level'),'Lv. '+profile.level);hudText($('stat-sheet-xp-text'),max?'최고 레벨':profile.xp+' / '+need+' ('+xp+'%)');$('stat-sheet-xp-fill').style.width=xp+'%';$('stat-sheet-xp').setAttribute('aria-valuenow',String(xp));
 const rows={damage:Math.round(stats.damage),crit:(stats.crit*100).toFixed(1)+'%','attack-speed':Math.round(stats.attackSpeed*100)+'%',range:Math.round(stats.range),execute:signed(tree.execute*100),finisher:signed(tree.finisher*100),
  health:Math.round(stats.maxHp),reduction:(stats.reduction*100).toFixed(1)+'%',regeneration:Number(stats.regeneration.toFixed(2))+' / 초',drain:signed(tree.drain*100),guard:signed(-tree.lowHpGuard*100),
  speed:Math.round(stats.speed),collection:Math.round(stats.collection),stamina:signed(tree.staminaRegen*100),cooldown:signed(-tree.skillCooldown*100),area:signed((game.SKILL_AREA_BOOST*(1+tree.skillArea)-1)*100),'skill-damage':signed(tree.skillDamage*100)};
 for(const [k,v] of Object.entries(rows))hudText($('stat-sheet-'+k),String(v));
 hudText($('stat-sheet-note'),'남은 포인트 '+growthBudget()+' · 레벨·능력치 단련·성장 트리·장비·세트·인장을 합한 값');
}
function openStatsSheet(from){if(!ready||state.phase!=='camp')return;statsSheetReturn=from??null;$('stats-sheet').hidden=false;refreshStatsSheet();$('stats-sheet-close').focus({preventScroll:true});}
function closeStatsSheet(){if($('stats-sheet').hidden)return;$('stats-sheet').hidden=true;const back=statsSheetReturn&&$(statsSheetReturn);statsSheetReturn=null;back?.focus({preventScroll:true});}
$('home-profile').addEventListener('click',()=>openStatsSheet('home-profile'));
$('home-profile').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openStatsSheet('home-profile');}});
$('equipment-stats-open').addEventListener('click',()=>openStatsSheet('equipment-stats-open'));
$('stats-sheet-close').addEventListener('click',closeStatsSheet);
$('stats-sheet').addEventListener('click',event=>{if(event.target===$('stats-sheet'))closeStatsSheet();});
// Read-only scene values; equipment identity and combat effects remain engine-owned.
function refreshEquipmentScene(){
 if(inventoryPanel!=='equipment')return;
 const key=[profile.level,profile.xp,state.phase,...Object.values(profile.equipment),...state.synergies.map(row=>row.id)].join('|');
 if(key===equipmentSceneKey)return;equipmentSceneKey=key;
 const xp=profile.level===game.MAX_LEVEL?100:Math.floor(clamp(profile.xp/game.xpNeeded(profile.level)*100,0,100));
 $('equipment-xp-label').textContent=profile.level===game.MAX_LEVEL?'MAX':xp+'%';$('equipment-xp-fill').style.width=xp+'%';$('equipment-xp').setAttribute('aria-valuenow',String(xp));
 const worn=Object.entries(game.EQUIPMENT_SLOTS).filter(([slot])=>profile.inventory.some(item=>item.id===profile.equipment[slot]&&item.slot===game.itemSlotForPosition(slot))).length;
 $('equipment-equipped-count').textContent='착용 '+worn+' / '+Object.keys(game.EQUIPMENT_SLOTS).length;
 for(const row of game.EQUIPMENT_SYNERGIES){
  const active=state.synergies.some(value=>value.id===row.id),button=$('equipment-link-'+row.id);
  button.setAttribute('data-active',String(active));button.setAttribute('aria-label',row.name+' · '+(active?'활성':'미완성')+' · 자세히 보기');
  $('equipment-link-name-'+row.id).textContent=row.name;$('equipment-link-state-'+row.id).textContent=active?'활성':'미완성';$('equipment-link-description-'+row.id).textContent=active?row.description:row.requirement;
 }
 // Region set progress (Alpha 0.108): the set with the most worn pieces and its 2/4-piece bonuses.
 const best=game.equippedSets(profile)[0],setButton=$('equipment-link-set');setButton.setAttribute('data-active',String(!!best?.active.length));
 $('equipment-link-name-set').textContent=best?'세트 · '+best.set.name+' '+best.count+'/'+game.SET_SLOTS.length:'지역 장비 세트';
 $('equipment-link-state-set').textContent=best?.active.length?best.active.at(-1).pieces+'세트 활성':'미완성';
 $('equipment-link-description-set').textContent=best?best.set.bonuses.map(b=>b.pieces+'세트 '+b.text).join(' · '):'같은 지역 세트 2·4부위 착용 시 효과';
 setButton.setAttribute('aria-label',$('equipment-link-name-set').textContent+' · '+$('equipment-link-state-set').textContent);
 for(const view of ['skills','growth','codex'])$('equipment-menu-'+view).disabled=state.phase!=='camp';
}
for(const view of ['skills','growth','codex'])$('equipment-menu-'+view).addEventListener('click',()=>{if(!inventoryOpen||inventoryPanel!=='equipment'||state.phase!=='camp')return;if(view==='skills')openSkills('lobby-skills');else{navigateCamp(view);if(view==='growth')campDrawerOrigin='hub-growth';}});
function openEquipmentItem(item,origin=null){
 bagSlot='all';rarityFilter=0;favoritesOnly=false;bagOrganizing=false;bagSelectedIds.clear();bagReviewIds=null;bagSelectedId=item?.id??null;bagFocusRequested=!!item;bagRenderKey='';openInventory();bagDetailReturn=origin;if(item){window.hunterPages?.reveal($('bag-detail-close'));$('bag-detail-close').focus({preventScroll:true});}
}
$('dashboard-weapon-open').addEventListener('click',()=>openEquipmentItem(profile.inventory.find(i=>i.id===profile.equipment.weapon&&i.slot==='weapon')));
for(let n=0;n<12;n++)$('dashboard-item-'+n).addEventListener('click',()=>{const item=profile.inventory[n];if(item)openEquipmentItem(item);});
for(let n=1;n<=game.STAGES_PER_CHAPTER;n++)$('dashboard-stage-'+n).addEventListener('click',()=>{if(ready&&state.phase==='camp'&&n<=game.stageLimit(profile,selectedStage,selectedDifficulty)){launchRevision++;selectedRunStage=n;updateHud();}});
for(const slot of Object.keys(game.EQUIPMENT_SLOTS))$('equipped-open-'+slot).addEventListener('click',()=>{const item=profile.inventory.find(i=>i.id===profile.equipment[slot]&&i.slot===game.itemSlotForPosition(slot));if(item)openEquipmentItem(item,'equipped-open-'+slot);else{openInventory();setBagCategory(game.equipmentCategory(game.itemSlotForPosition(slot)));bagPart=game.itemSlotForPosition(slot);updateHud();resizeBagGrids();}});

// Portrait navigation reuses the existing modal and drawer ownership.
$('page-back').addEventListener('click',()=>{if(trackOpen){closeTrack();return;}if(codexOpen&&codexDetailOpen){closeCodexDetail();return;}if(campDrawer){closeCampDrawer();return;}if(inventoryOpen){if(bagSelectedId!==null){closeBagDetail();return;}if(inventoryPanel==='build'){setInventoryPanel('gear');return;}inventoryOpen=false;updateHud();return;}navigateCamp('home');});
$('more-track').addEventListener('click',()=>{if(ready&&state.phase==='camp'&&campDrawer==='more')openTrack();});
$('loadout-bag-open').addEventListener('click',()=>setInventoryPanel('gear'));
$('loadout-build-open').addEventListener('click',()=>setInventoryPanel('build'));
$('loadout-close').addEventListener('click',()=>{inventoryOpen=false;updateHud();});
$('bag-material-craft').addEventListener('click',()=>{if(inventoryOpen&&bagSlot==='materials'&&state.phase==='camp')navigateCamp('craft');});

$('camp-tactics-open').addEventListener('click',()=>openCampDrawer('tactics','camp-tactics-open'));
$('tactics-map-back').addEventListener('click',()=>{if(ready&&state.phase==='camp'&&campDrawer==='tactics')closeCampDrawer();});
$('farm-codex-open').addEventListener('click',()=>navigateCamp('codex'));

let skillPage=0;
// Alpha 0.128: the skill detail has an 정보 view and a 갈래 view; a first tap on an unbought branch arms it (`branchArmed`).
let skillDetailView='info',branchArmed='';
const skillPageSize=9;
// Skill workshop uses the existing camp drawer; mutations remain camp-only.
function openSkills(origin='nav-skills'){skillPage=0;if(!ready||state.phase!=='camp')return;inventoryOpen=false;codexOpen=false;craftOpen=false;trackOpen=false;campChoices=false;skillRenderKey='';openCampDrawer('skills',origin);}
$('nav-skills').addEventListener('click',()=>openSkills());
$('skill-list-back').addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='skills')return;window.hunterPages?.reveal($('skill-library'));$('skill-tab-'+skillTab).focus({preventScroll:true});});
function skillChanged(message){skillFeedback=message;skillRenderKey='';save();updateHud();}
for(const row of game.SKILL_CATALOG)$('skill-card-'+row.id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='skills')return;selectedSkill=row.id;skillRenderKey='';refreshSkills();window.hunterPages?.reveal($('skill-detail'));});
for(const tab of ['all','active','passive','ultimate','beast'])$('skill-tab-'+tab).addEventListener('click',()=>{if(state.phase!=='camp')return;skillTab=tab;skillPage=0;skillRenderKey='';refreshSkills();});
for(const [kind,count]of Object.entries(game.MAX_SLOTS))for(let i=0;i<count;i++)$('skill-slot-'+kind+'-'+i).addEventListener('click',()=>{if(state.phase!=='camp')return;const id=profile.skillBook.loadout[kind][i];if(id){selectedSkill=id;skillRenderKey='';refreshSkills();window.hunterPages?.reveal($('skill-detail'));}});
for(let i=0;i<4;i++)$('skill-equip-'+i).addEventListener('click',()=>{if(game.equipSkill(state,selectedSkill,i))skillChanged('장착 변경 · '+game.SKILL_BY_ID[selectedSkill].name);});
$('skill-upgrade').addEventListener('click',()=>{if(game.upgradeSkill(state,selectedSkill))skillChanged(game.SKILL_BY_ID[selectedSkill].name+' Lv.'+game.skillRank(profile,selectedSkill)+' 강화 완료');});
$('skill-reset').addEventListener('click',()=>{if(game.resetSkills(state))skillChanged('강화 포인트를 모두 돌려받았어. 장착 구성은 유지돼.');});
for(let i=0;i<3;i++)for(const action of ['save','load'])$('skill-preset-'+action+'-'+i).addEventListener('click',()=>{if(game.skillPreset(state,i,action))skillChanged(['보스','자동 사냥','실험'][i]+' 빌드 '+(action==='save'?'저장 완료':'불러오기 완료'));});
for(let i=0;i<4;i++)$('skill-example-'+i).addEventListener('click',()=>{if(game.applySkillExample(state,i)){profile.skillBook.auto.mode=['boss','farm','safe','balanced'][i];skillChanged(game.SKILL_BUILD_EXAMPLES[i].name+' · 현재 해금된 스킬만 장착했어.');}});
for(const [node,key]of [['skill-auto-mode','mode'],['skill-auto-ultimate','ultimate']])$(node).addEventListener('change',()=>{if(state.phase!=='camp')return;const values=key==='mode'?['balanced','boss','farm','safe']:['elite','any','off'];if(values.includes($(node).value)){profile.skillBook.auto[key]=$(node).value;skillChanged('자동 사냥 설정 저장');}});
$('skill-awakening').addEventListener('change',()=>{if(state.phase!=='camp'||profile.level<50||!['area','execution'].includes($('skill-awakening').value))return;profile.skillBook.awakening=$('skill-awakening').value;skillChanged('적월난무 각성 변경');});
for(const [id,delta]of [['skill-page-prev',-1],['skill-page-next',1]])$(id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='skills')return;skillPage+=delta;skillRenderKey='';refreshSkills();});
function refreshSkills(){
 if(campDrawer!=='skills')return;const book=profile.skillBook,key=JSON.stringify([skillDetailView,branchArmed,book,profile.level,selectedSkill,skillTab,skillPage,skillFeedback,profile.gold,profile.materials.skillPage]);if(key===skillRenderKey)return;skillRenderKey=key;
 const slots=game.skillSlots(profile.level),d=game.SKILL_BY_ID[selectedSkill],rank=game.skillRank(profile,d.id),equipped=book.loadout[d.kind].includes(d.id);
 $('skill-budget').textContent='리리안 Lv.'+profile.level+' · 강화 포인트 '+game.skillPoints(profile);$('skill-feedback').textContent=skillFeedback;
 for(const tab of ['all','active','passive','ultimate','beast'])$('skill-tab-'+tab).setAttribute('aria-pressed',String(skillTab===tab));
 // '전체' lists Lilian's own skills; the 60 괴수 기술 have their own tab (Alpha 0.125).
 const visibleSkills=game.SKILL_CATALOG.filter(row=>skillTab==='all'?row.kind!=='beast':row.kind===skillTab),pageCount=Math.max(1,Math.ceil(visibleSkills.length/skillPageSize));skillPage=Math.max(0,Math.min(pageCount-1,skillPage));const pageIds=new Set(visibleSkills.slice(skillPage*skillPageSize,(skillPage+1)*skillPageSize).map(row=>row.id));$('skill-page-label').textContent=(skillPage+1)+' / '+pageCount+' · '+visibleSkills.length+'개';$('skill-page-prev').disabled=skillPage===0;$('skill-page-next').disabled=skillPage===pageCount-1;
 for(const row of game.SKILL_CATALOG){const r=game.skillRank(profile,row.id),node=$('skill-card-'+row.id),on=book.loadout[row.kind].includes(row.id);node.hidden=!pageIds.has(row.id);node.setAttribute('data-locked',String(!r));node.setAttribute('aria-pressed',String(row.id===selectedSkill));$('skill-state-'+row.id).textContent=row.kind==='beast'?(r?game.BEAST_GRADES[r].name+(on?' · 장착':''):row.chapter+'장 보스'):r?'Lv.'+r+(on?' · 장착':''):'캐릭터 Lv.'+row.unlock;}
 for(const [kind,count]of Object.entries(game.MAX_SLOTS))for(let i=0;i<count;i++){
  const id=book.loadout[kind][i],node=$('skill-slot-'+kind+'-'+i),art=$('skill-slot-art-'+kind+'-'+i),label=i>=slots[kind]?'Lv.'+game.SKILL_SLOT_UNLOCKS.find(row=>row.kind===kind&&row.index===i).level+' 해금':id?game.SKILL_BY_ID[id].name+(kind==='beast'?' · '+game.BEAST_GRADES[game.skillRank(profile,id)].name:''):'비어 있음';
  node.setAttribute('data-kind',kind);node.disabled=i>=slots[kind];$('skill-slot-name-'+kind+'-'+i).textContent=label;
  art.hidden=!id;if(id)art.src=game.SKILL_BY_ID[id].icon;node.setAttribute('data-empty',String(!id));node.setAttribute('aria-label',skillKinds[kind]+' '+(i+1)+' · '+label);
 }
 $('skill-study').disabled=!!game.skillStudyStatus(profile);$('skill-study-cost').textContent='보유 검술서 '+profile.materials.skillPage+' · 연구 1회: 검술서 '+game.SKILL_STUDY_COST.pages+' + '+game.SKILL_STUDY_COST.gold+' 골드';$('skill-study-note').textContent='강화 포인트 +1 · 레벨 조건 유지 · 연구 '+book.trainingPoints+'/'+game.SKILL_STUDY_COST.max+(game.skillStudyStatus(profile)?' · '+game.skillStudyStatus(profile):'');
 $('skill-detail-icon').src=d.icon;$('skill-detail-name').textContent=d.name;$('skill-detail-kind').textContent=skillKinds[d.kind]+(equipped?' · 장착 중':'');const beast=d.kind==='beast';$('skill-detail-unlock').textContent=beast?d.chapter+'장 '+d.bossName+' 처치로 획득'+(rank?' · 현재 '+game.BEAST_GRADES[rank].name:' · 아직 미획득'):'캐릭터 Lv.'+d.unlock+' 해금'+(rank?' · 현재 Lv.'+rank:' · 아직 잠김');
 const areaScale=game.skillAreaScale(profile,d.id),growing=['line','dash','circle','cone','targetArea','echo','returning','field','gather','ultimateArea'].includes(d.shape);
 // The area growth note lives under '전체 단계별 수치' (Alpha 0.128) so the description stays short.
 const areaNote=growing?' 범위는 기본 기준이며 현재 광역 범위 +'+Math.round((areaScale-1)*100)+'% (캐릭터 Lv.10마다 +10%, 최대 +40%).':'';$('skill-detail-description').textContent=d.description;
 $('skill-current-effect').textContent=beast?(rank?'현재 ':'미획득 · 기본 기준 · ')+game.skillNumbers(profile,d.id,rank||1):(rank?'현재 Lv.'+rank+' · ':'미해금 · Lv.1 기준 · ')+game.skillNumbers(profile,d.id,rank||1);
 const cooldown=Math.round((beast&&!rank?d.cooldown:game.skillCooldown(profile,d.id))*10)/10;$('skill-detail-resource').textContent=beast?'기력 '+d.cost+' · 재사용 '+cooldown+'초 · 자동 시전':d.kind==='passive'?'장착한 동안 조건에 따라 발동':d.kind==='ultimate'?'재사용 '+cooldown+'초 · 기력 소모 없음':'기력 '+game.skillCost(profile,d.id)+' · 재사용 '+cooldown+'초';
 // Alpha 0.126 갈래: two branches per attacking active / ultimate, bought with 검술서 and switched freely in camp.
 const branches=game.SKILL_BRANCHES[d.id],view=branches?skillDetailView:'info',pick=game.skillBranchIndex(profile,d.id);$('skill-detail').setAttribute('data-view',view);$('skill-branches').hidden=view!=='branch';
 for(const [id,v]of [['skill-view-info','info'],['skill-view-branch','branch']])$(id).setAttribute('aria-pressed',String(view===v));$('skill-view-branch').disabled=!branches;$('skill-view-branch').textContent=branches?'갈래 '+[0,1].filter(i=>game.ownsBranch(profile,d.id,i)).length+'/2':'갈래 없음';
 if(pick>=0)$('skill-current-effect').textContent+=' · 갈래 '+branches[pick].name;
 if(branches){const c=game.SKILL_BRANCH_COST;for(let i=0;i<2;i++){const b=branches[i],owned=game.ownsBranch(profile,d.id,i),status=game.branchStatus(profile,d.id,i),armed=branchArmed===d.id+':'+i,state=pick===i?'active':owned?'owned':status?'locked':armed?'armed':'buyable',node=$('skill-branch-'+i);node.setAttribute('data-state',state);node.setAttribute('aria-pressed',String(pick===i));node.disabled=!owned&&!!status;
  $('skill-branch-name-'+i).textContent=b.name+' · '+(pick===i?'사용 중':owned?'보유':status?status:armed?'다시 눌러 해금':'검술서 '+c.pages);$('skill-branch-info-'+i).textContent=game.branchSummary(b.mods);$('skill-branch-text-'+i).textContent=b.text;node.setAttribute('aria-label','갈래 '+b.name+' · '+b.text+' '+game.branchSummary(b.mods)+(owned?'':' · 해금: 검술서 '+c.pages+' + '+c.gold+' 골드'+(status?' ('+status+')':'')));}
  $('skill-branch-note').textContent='보유 검술서 '+profile.materials.skillPage+' · 해금 검술서 '+c.pages+' + '+c.gold+' 골드 · 하나만 사용, 눌러서 전환·끄기';}
 // 괴수 기술 grades: 기본 (first kill), 강화 (정예 chance), 극 (악몽 chance) instead of five skill-point ranks.
 for(let i=1;i<=5;i++){$('skill-rank-row-'+i).hidden=beast&&i>3;$('skill-rank-row-'+i).setAttribute('data-current',String(rank===i));$('skill-rank-value-'+i).textContent=beast&&i>3?'':game.skillNumbers(profile,d.id,i);$('skill-rank-gate-'+i).textContent=beast?['첫 처치','정예 처치 '+Math.round(game.BEAST_GRADE_CHANCE[1]*100)+'%','악몽 처치 '+Math.round(game.BEAST_GRADE_CHANCE[2]*100)+'%',''][i-1]??'':'캐릭터 Lv.'+game.skillLevelGate(d.id,i);}
 const next=game.skillLevelGate(d.id,rank+1);
 $('skill-detail-note').textContent=(beast?'괴수 기술 칸 1개에 장착하며, 준비되면 자동으로 시전합니다. 보스를 처음 쓰러뜨리면 기본을 배우고, 정예·악몽에서 다시 쓰러뜨리면 확률로 강화·극을 배웁니다(낮은 등급으로 내려가지 않음).':d.kind==='ultimate'?'궁극기는 캐릭터 레벨에 따라 자동 강화됩니다. 사냥 시작 시 바로 사용하며, 사용 후 60초 동안 기다립니다. 일시정지 중에는 남은 시간도 멈춥니다.':'해금 시 Lv.1을 바로 사용합니다. 이후 단계당 강화 포인트 1개를 사용합니다.')+areaNote;
 $('skill-upgrade').hidden=d.kind==='ultimate'||beast;$('skill-upgrade').disabled=!rank||rank>=5||!game.skillPoints(profile)||profile.level<next;$('skill-upgrade').textContent=!rank?'캐릭터 Lv.'+d.unlock+' 필요':rank>=5?'최대 강화':profile.level<next?'다음 강화 · 캐릭터 Lv.'+next:game.skillPoints(profile)?'Lv.'+(rank+1)+' 강화 · 포인트 1':'강화 포인트 부족';
 for(let i=0;i<4;i++){const node=$('skill-equip-'+i);node.hidden=i>=game.MAX_SLOTS[d.kind];node.disabled=!rank||i>=slots[d.kind];const action=book.loadout[d.kind][i]===d.id?'해제':'장착';node.textContent=(game.MAX_SLOTS[d.kind]>2?'':'슬롯 ')+(i+1)+' '+action;node.setAttribute('aria-label','슬롯 '+(i+1)+' '+action);}
 for(let i=0;i<3;i++){const b=book.presets[i];$('skill-preset-load-'+i).disabled=!b;$('skill-preset-state-'+i).textContent=b?[...b.active,...b.ultimate].filter(Boolean).map(id=>game.SKILL_BY_ID[id].name).join(' · ')||'빈 구성':'비어 있음';}
 $('skill-auto-mode').value=book.auto.mode;$('skill-auto-ultimate').value=book.auto.ultimate;$('skill-awakening').value=book.awakening;$('skill-awakening-label').hidden=profile.level<50;
}
// Combat buttons 0·1 and 3·4 are regular slots 1–4 (3·4 since Alpha 0.119); button 2 stays the ultimate.
// Button 5 (key H) is the 괴수 기술 slot (Alpha 0.125).
const combatSkillIds=()=>{const {active,ultimate,beast}=profile.skillBook.loadout;return [active[0],active[1],ultimate[0],active[2],active[3],beast?.[0]];};
function useCombatSkill(index){const id=combatSkillIds()[index];if(!ready||!id||state.phase!=='playing'||state.paused)return;audio.unlock();manual();if(!game.useSkill(state,id,state.auto?undefined:currentAim())&&state.auto&&!((state.skillRuntime.cooldowns[id]??0)>0)&&state.player.stamina>=game.SKILL_BY_ID[id].cost)skillRequest={id,until:state.run.time+3};canvas.focus({preventScroll:true});updateHud();}
for(let i=0;i<6;i++){const action=()=>useCombatSkill(i),button=$('combat-skill-'+i);button.addEventListener('pointerdown',combatPress(action));button.addEventListener('click',combatClick(action));}
function refreshCombatSkills(){
 const ids=combatSkillIds(),r=state.skillRuntime;
 for(let i=0;i<6;i++){const id=ids[i],node=$('combat-skill-'+i),d=game.SKILL_BY_ID[id];node.hidden=!d;if(!d)continue;const cd=r.cooldowns[id]??0,usable=state.auto?state.phase==='playing'&&!state.paused&&state.run.flow==='combat'&&cd<=0&&state.player.stamina>=d.cost:game.skillReady(state,id);if(combatSkillIcons[i]!==d.icon){combatSkillIcons[i]=d.icon;$('combat-skill-icon-'+i).src=d.icon;}hudText($('combat-skill-name-'+i),d.name);hudText($('combat-skill-state-'+i),cd>0?(i===2?Math.ceil(cd):Math.max(.1,cd).toFixed(1))+'초':state.player.stamina<d.cost?'기력 부족':'준비');node.disabled=!usable;node.setAttribute('data-ultimate',String(i===2));node.setAttribute('data-ready',String(usable));node.setAttribute('data-cooldown',String(cd>0));node.setAttribute('data-queued',String(skillRequest?.id===id));node.setAttribute('aria-label',d.name+' · '+$('combat-skill-state-'+i).textContent);}
}


function refreshGrowthProgress(){
 if(!(state.phase==='camp'&&['growth','skills'].includes(campDrawer))&&!game.resultReady(state))return;
 const points=game.skillPoints(profile),start=state.run.startLevel,key=profile.level+':'+start+':'+points+':'+game.growthPoints(profile);
 if(key===growthRenderKey)return;growthRenderKey=key;
 const future=game.skillMilestones(profile.level),next=future[0]?.level,nextRows=future.filter(row=>row.level===next),nextText=next?'다음 해금 · Lv.'+next+' · '+nextRows.map(row=>row.label).join(' · '):'모든 검술과 슬롯 해금 완료';
 for(const id of ['growth-next-skill','skill-next-unlock']){$(id).textContent=nextText;$(id).setAttribute('title',nextText);}
 $('growth-skill-budget').textContent=growthBudget()+' · 스킬 강화 '+points;
 const bandIndex=game.GROWTH_XP_BANDS.findIndex(row=>profile.level<row.until),band=game.GROWTH_XP_BANDS[bandIndex],nextBand=game.GROWTH_XP_BANDS[bandIndex+1];
 $('growth-xp-rate').textContent=profile.level===game.MAX_LEVEL?'최고 레벨 · 경험치 성장 완료':(game.growthXpMultiplier(profile.level)>1?'사냥·정찰 성장 경험치 '+game.growthXpMultiplier(profile.level)+'배 · ':'')+'다음 레벨까지 경험치 '+Math.max(0,game.xpNeeded(profile.level)-profile.xp)+(nextBand?' · Lv.'+band.until+'부터 '+nextBand.multiplier+'배':'');
 $('result-level').textContent=start<profile.level?'Lv.'+start+' → Lv.'+profile.level:'Lv.'+profile.level;
 $('result-points').textContent='남은 '+growthBudget()+' · 스킬 강화 '+points;
 const unlocked=game.skillMilestones(start,profile.level),names=unlocked.map(row=>row.label),shown=names.slice(0,3).join(' · ')+(names.length>3?' 외 '+(names.length-3)+'개':'');
 $('result-unlocks').hidden=!names.length;$('result-unlocks').textContent=names.length?'새 해금 · '+shown:'';$('result-unlocks').setAttribute('title',names.join(' · '));
 $('result-skills').hidden=false;
}
$('result-skills').addEventListener('click',()=>{
 if(!game.resultReady(state))return;
 const unlocked=game.skillMilestones(state.run.startLevel,profile.level),row=unlocked.find(d=>d.kind==='ultimate')??unlocked.find(d=>d.id);
 returnCamp();if(row)selectedSkill=row.id;openSkills('hub-growth');
});

function refreshBuildSystem(){
 $('game-shell').setAttribute('data-settling',String(!!state.settlement));
 const rule=state.run.rule;$('stage-rule-hud').hidden=state.phase!=='playing'||!rule;
 const ruleText=state.settlement?'보상 저장 중 · 저장을 마치면 진행합니다':rule&&rule.type!=='normal'?(rule.type==='dungeon'?'성장 던전':rule.type==='raid'?'레이드':game.STAGE_TYPE_NAMES[rule.type])+' · '+rule.name+' · '+(rule.type==='raid'?'추천 '+rule.hint:rule.hint+(rule.required?' 필요':' 유리')):'';const gateHud=!state.settlement&&state.run.gate?game.GATE_TYPES[state.run.gate.type].name+' · '+game.gateText(state.run.gate).split(' · ')[1]:'',hudRule=[gateHud,ruleText].filter(Boolean).join(' | ');if($('stage-rule-hud').textContent!==hudRule)$('stage-rule-hud').textContent=hudRule;

 if(state.phase==='playing'&&!inventoryOpen)return;
 const uiKey=buildUiRevision+':'+state.phase+':'+buildTab+':'+inventoryOpen+':'+!!retryPlan;if(uiKey===buildUiRendered)return;buildUiRendered=uiKey;
 const selected=profile.selectedBuild!==null?profile.savedBuilds[profile.selectedBuild]:null,current=selected?.name??null,match=!!selected&&JSON.stringify(selected.equipment)===JSON.stringify(profile.equipment)&&JSON.stringify(selected.skill)===JSON.stringify({loadout:profile.skillBook.loadout,auto:profile.skillBook.auto,awakening:profile.skillBook.awakening});
 $('build-current').textContent='현재 · '+(current??'사용자 조합')+(current&&!match?' · 변경됨':'');$('build-retry').hidden=!retryPlan;
 for(let n=0;n<5;n++){
  const b=profile.savedBuilds[n],status=game.buildStatus(profile,n),option=$('entry-build-option-'+n);option.disabled=!b;option.textContent=(b?.name??game.BUILD_NAMES[n])+(b?'':' · 미저장');$('home-build-option-'+n).disabled=!b;$('home-build-option-'+n).textContent=option.textContent;
  $('build-tab-'+n).textContent=b?.name??game.BUILD_NAMES[n];$('build-tab-'+n).setAttribute('aria-pressed',String(n===buildTab));$('build-card-'+n).hidden=n!==buildTab;
  $('build-name-'+n).placeholder=game.BUILD_NAMES[n];
  if(b){
   const load=b.skill?.loadout??profile.skillBook.loadout;const tree={growthTree:b.tree??[]};$('build-skill-'+n).textContent='트리 '+game.GROWTH_TREE.map(r=>r.name+' '+game.branchPoints(tree,r.id)+'P').join(' ')+' · 스킬 '+[...load.active,...load.passive,...load.ultimate].filter(Boolean).map(id=>game.SKILL_BY_ID[id]?.name??id).join(' → ');
   const preview={...profile,equipment:game.restoreEquipment(b.equipment,profile.inventory,profile.characterId)},powers=game.buildEffects(preview);$('build-effects-'+n).textContent=Object.entries(powers).map(([id,count])=>game.BUILD_EFFECTS[id].name+' ×'+count).join(' · ')||'추가 각인 없음';
   const comparison=game.compareEquipment(profile,preview.equipment);$('build-compare-'+n).textContent='교체 후 공격 '+Math.round(comparison.after.damage)+' · 체력 '+Math.round(comparison.after.maxHp)+' · 치명타 '+Math.round(comparison.after.crit*100)+'%';
  }else{$('build-skill-'+n).textContent='현재 장비·스킬·성장 트리·자동 정책을 함께 저장합니다.';$('build-effects-'+n).textContent='같은 장비는 여러 프리셋에서 공유합니다.';}
  $('build-save-'+n).disabled=state.phase!=='camp';$('build-delete-'+n).disabled=!b||state.phase!=='camp';
 }
 for(const id of ['entry-build','home-entry-build'])if(document.activeElement!==$(id))$(id).value=!match?'current':String(profile.selectedBuild);
}
for(let n=0;n<5;n++)$('build-name-'+n).addEventListener('input',()=>{buildNameDrafts[n]=$('build-name-'+n).value;});
for(let n=0;n<5;n++)$('build-tab-'+n).addEventListener('click',()=>{buildTab=n;bagRenderKey='';updateHud();});
for(const id of ['entry-build','home-entry-build'])$(id).addEventListener('change',()=>{if($(id).value==='current')return;const r=game.applyBuild(state,Number($(id).value));bagFeedback=r.reason;if(r.ok){appearance=equippedDesigns(profile);save();}bagRenderKey='';skillRenderKey='';updateHud();});
$('result-build').addEventListener('click',()=>{if(!game.resultReady(state))return;retryPlan={chapter:state.stageId,stage:state.run.stage,difficulty:state.difficulty,dungeon:state.run.dungeonId,raid:state.run.raidId,rush:!!state.run.rush};returnCamp();openInventory('build');});
$('build-retry').addEventListener('click',()=>{if(!retryPlan||state.phase!=='camp')return;const p=retryPlan;retryPlan=null;inventoryOpen=false;if(p.raid)startRaid(p.raid);else if(p.rush)startRush();else if(p.dungeon)startDungeon(p.dungeon,p.stage);else start(p.chapter,p.stage,p.difficulty);});

function craftInscriptionChanged(){$('craft-inscription-cost').hidden=!$('craft-inscription').value;$('craft-inscription-cost').textContent='추가 '+game.INSCRIPTION_COST.gold.toLocaleString('ko-KR')+' 골드 · '+Object.entries(game.INSCRIPTION_COST.materials).map(([id,n])=>game.MATERIAL_BY_ID[id].name+n).join(' · ');syncCraftInscription();}
$('craft-inscription').addEventListener('change',craftInscriptionChanged);
const CRAFT_INSCRIPTIONS=['',...game.BUILD_EFFECT_IDS];
function syncCraftInscription(){const value=$('craft-inscription').value;for(const v of CRAFT_INSCRIPTIONS)$('craft-insc-'+(v||'none')).setAttribute('aria-checked',String(v===value));$('craft-insc-info').hidden=!value;$('craft-insc-info').textContent=value?game.BUILD_EFFECTS[value].name+' — '+game.buildEffectText(value)+' · '+$('craft-inscription-cost').textContent:'';}
for(const v of CRAFT_INSCRIPTIONS)$('craft-insc-'+(v||'none')).addEventListener('click',()=>{if(!craftOpen)return;$('craft-inscription').value=v;craftInscriptionChanged();});

// The material hall uses the same profile and durable settlement as chapter play.
// Seals (Alpha 0.136) are named by effect grade (하옵·중옵·상옵), not by rarity.
function itemGradeName(item){return game.isSeal(item)?game.SEAL_GRADES[item.seal.grade].name:game.RARITIES[item.rarity];}
function dungeonRewardText(reward){if(!reward)return '보상 없음';const list=[];if(reward.gold)list.push('골드 '+reward.gold.toLocaleString('ko-KR'));if(reward.xp)list.push('경험치 '+reward.xp.toLocaleString('ko-KR'));if(reward.cores)list.push('핵 '+reward.cores);for(const [id,n]of Object.entries(reward.materials))list.push(game.MATERIAL_BY_ID[id].name+' ×'+n);if(reward.item)list.push(itemGradeName(reward.item)+' '+reward.item.name);return list.join(' · ')||'보관 한도 도달 · 추가 보상 없음';}
function openDungeons(origin='lobby-summon'){
 if(!ready||state.phase!=='camp')return;inventoryOpen=codexOpen=craftOpen=trackOpen=campChoices=false;openCampDrawer('dungeons',origin);
}
// Alpha 0.123: the dungeon hall has a growth/raid switch. Raids reuse the right-hand entry panel.
function raidResetText(){const left=game.nextRaidReset(Date.now())-Date.now(),days=Math.floor(left/864e5),hours=Math.ceil(left%864e5/36e5);return '월요일 00:00 초기화 · '+(days?days+'일 ':'')+hours+'시간 남음';}
function refreshRaids(){
 const now=Date.now(),chapter=game.raidChapter(profile,game.STAGES.length),r=game.raidDefinition(selectedRaid),left=game.raidEntriesLeft(profile,r.id,now),unlocked=game.raidUnlocked(profile,r.id),reward=game.raidRewards(chapter);
 for(const row of game.RAIDS){const open=game.raidUnlocked(profile,row.id);$('raid-card-'+row.id).setAttribute('aria-pressed',String(row.id===r.id));$('raid-card-'+row.id).setAttribute('data-locked',String(!open));$('raid-entries-'+row.id).textContent=open?'주간 입장 '+game.raidEntriesLeft(profile,row.id,now)+' / '+game.RAID_WEEKLY_ENTRIES:row.unlock+'장 클리어 후 개방';$('raid-state-'+row.id).textContent='클리어 '+profile.raids.clears[row.id]+' · 고대 '+game.ANCIENT_CATALOG.filter(a=>a.raid===row.id&&profile.discoveredAncients.includes(a.id)).length+'/5';}
 $('raid-week-reset').textContent=raidResetText();$('raid-week-loot').textContent='보스는 지금까지 연 '+chapter+'장 기준으로 강해집니다.';
 $('dungeon-kind').textContent='레이드 · '+game.RAID_TIME_LIMIT+'초';$('dungeon-name').textContent=r.name;$('dungeon-rule').textContent=r.rule;$('dungeon-hint').textContent='추천 빌드 · '+r.build;
 {if(!game.raidTierUnlocked(profile,selectedRaidTier))selectedRaidTier=0;const tier=selectedRaidTier,k=game.modeScale(game.MODE_CHAPTERS,tier);for(let t=0;t<game.RAID_TIERS.length;t++){const o=$('raid-tier-'+t);o.disabled=!game.raidTierUnlocked(profile,t);o.textContent=game.RAID_TIERS[t]+(o.disabled?' · '+['','정예','악몽'][t]+' 60장 클리어 필요':'');}$('raid-tier').value=String(tier);for(let t=0;t<game.RAID_TIERS.length;t++){const b=$('raid-tier-pick-'+t);b.disabled=!game.raidTierUnlocked(profile,t);b.setAttribute('aria-pressed',String(t===tier));b.setAttribute('title',b.disabled?['','정예','악몽'][t]+' 60장 클리어 필요':game.RAID_TIERS[t]+' 레이드');}
 $('dungeon-rewards').textContent=dungeonRewardText({...reward,gold:Math.round(reward.gold*k.reward),materials:Object.fromEntries(Object.entries(reward.materials).map(([id,n])=>[id,n*(1+tier)]))})+' · 레이드 고대 '+Math.round(game.DROP_CHANCE.raid*100)+'%';$('dungeon-hint').textContent=tier?game.RAID_TIERS[tier]+' · 보스 체력 '+timesText(k.hp)+' · 고대 능력치 ×'+game.HUNT_POWER[tier]+' + 각성'+(tier>1?'·심연':'')+' 효과':'추천 빌드 · '+r.build;}
 $('dungeon-use').hidden=true;
 $('dungeon-level').hidden=true;$('dungeon-progress').textContent=unlocked?'주간 입장 '+left+' / '+game.RAID_WEEKLY_ENTRIES+' · '+chapter+'장 기준':r.unlock+'장 클리어 후 개방';
 $('dungeon-enter').disabled=dungeonBusy||!!combatWork||!!combatError||!unlocked||left<1;$('dungeon-enter').textContent=dungeonBusy?'전투 준비 중…':!unlocked?'잠김':left<1?'이번 주 입장 완료':'레이드 입장 ›';
}
function refreshDungeons(){
 const raid=dungeonMode==='raid',rushMode=dungeonMode==='rush',towerMode=dungeonMode==='tower';$('camp-dungeons-panel').setAttribute('data-mode',dungeonMode);$('camp-dungeons-panel').setAttribute('data-dungeon',towerMode?'tower':rushMode?'rush':raid?'raid-'+selectedRaid:selectedDungeon);for(const mode of ['growth','raid','rush','tower'])$('dungeon-mode-'+mode).setAttribute('aria-pressed',String(dungeonMode===mode));
 $('raid-cards').hidden=!raid;$('raid-tier-label').hidden=!raid;$('rush-panel').hidden=!rushMode;$('tower-panel').hidden=!towerMode;$('dungeon-use').hidden=raid||rushMode;$('dungeon-growth-cards').hidden=raid||rushMode||towerMode;$('dungeon-level').hidden=raid||rushMode||towerMode;
 $('dungeon-hall-title').textContent=towerMode?'한 층씩, 한계를 넘어':rushMode?'다섯 보스, 하나의 인장':raid?'하나의 보스, 맞춤 빌드':'사냥을 넘어, 성장으로';$('dungeon-hall-desc').textContent=towerMode?'60초 안에 모든 적 처치 · 5층마다 정예 · 10층마다 보스 · 층마다 강해짐':!raid&&!rushMode?'60초 안에 모든 적 처치 · 실패 보상 없음 · 주간 횟수 제한':rushMode?game.RUSH_TIME_LIMIT+'초 안에 보스 다섯 연전 · 쓰러뜨린 수만큼 보상 · 하루 '+game.RUSH_DAILY_ENTRIES+'회':raid?'패턴에 맞는 빌드로 120초 안에 처치 · 주간 입장 '+game.RAID_WEEKLY_ENTRIES+'회':'60초 안에 모든 적 처치 · 실패 보상 없음 · 반복 입장';
 $('dungeon-library-note').textContent=towerMode?'입장 제한 없음 · 보상은 층마다 처음 깰 때 한 번 · 10층마다 영구 능력치':!raid&&!rushMode?'클리어마다 주간 횟수 1회(던전마다 주 '+game.DUNGEON_WEEKLY_CLEARS+'회) · 첫 클리어 보상 100% · 깬 단계 반복 '+Math.round(game.DUNGEON_REPEAT_RATE*100)+'% · '+raidResetText():rushMode?'인장(캐릭터 전용장비)은 보스 러시에서만 나옵니다. 입장할 때 횟수가 차감됩니다.':raid?'입장할 때 횟수가 차감되고, 실패해도 돌려받지 않습니다.':'입장 비용·횟수 제한 없음 · 보상은 성공 후 저장됩니다.';
 if(rushMode){refreshDungeonBuild();refreshRush();return;}
 if(towerMode){refreshDungeonBuild();refreshTower();return;}
 if(raid){refreshDungeonBuild();refreshRaids();return;}
 const week=game.raidWeek(Date.now()),d=game.dungeonDefinition(selectedDungeon),limit=game.dungeonLimit(profile,d.id);selectedDungeonLevel=Math.min(selectedDungeonLevel,limit);const repeat=game.isDungeonRepeat(profile,d.id,selectedDungeonLevel),left=game.dungeonClearsLeft(profile,d.id,week),full=game.dungeonRewards(d.id,selectedDungeonLevel),reward=repeat?game.repeatRewards(full):full;
 for(const row of game.DUNGEONS){$('dungeon-card-'+row.id).setAttribute('aria-pressed',String(row.id===d.id));$('dungeon-stage-'+row.id).textContent='최고 '+profile.dungeonProgress[row.id]+'/'+game.DUNGEON_MAX_LEVEL+' · 주간 '+game.dungeonClearsLeft(profile,row.id,week)+'회';const r=game.dungeonRewards(row.id,Math.min(selectedDungeonLevel,game.dungeonLimit(profile,row.id)));$('dungeon-owned-'+row.id).textContent=row.id==='gold'?'보유 '+profile.gold.toLocaleString('ko-KR')+' 골드':row.id==='xp'?'Lv.'+profile.level:Object.keys(r.materials).slice(0,3).map(id=>game.MATERIAL_BY_ID[id].name+' '+profile.materials[id]).join(' · ');}
 $('dungeon-kind').textContent=d.kind+' · 60초';$('dungeon-name').textContent=d.name;$('dungeon-rule').textContent=d.rule;$('dungeon-hint').textContent=d.hint+' 유리';$('dungeon-rewards').textContent=(repeat?'반복 '+Math.round(game.DUNGEON_REPEAT_RATE*100)+'% · ':'첫 클리어 · ')+dungeonRewardText(reward)+' · 장신구 '+Math.round(game.DROP_CHANCE.dungeon*(repeat?game.DUNGEON_REPEAT_RATE:1)*100)+'%';$('dungeon-use').textContent=d.use;$('dungeon-progress').textContent='주간 '+left+'/'+game.DUNGEON_WEEKLY_CLEARS;$('dungeon-progress').setAttribute('title',raidResetText());$('dungeon-level').value=String(selectedDungeonLevel);hudText($('dungeon-level-value'),selectedDungeonLevel+'단계');$('dungeon-level-value').setAttribute('data-state',repeat?'cleared':'new');$('dungeon-level-down10').disabled=$('dungeon-level-down').disabled=selectedDungeonLevel<=1;$('dungeon-level-up').disabled=$('dungeon-level-up10').disabled=selectedDungeonLevel>=limit;
 for(let n=1;n<=game.DUNGEON_MAX_LEVEL;n++){$('dungeon-level-'+n).disabled=n>limit;$('dungeon-level-'+n).textContent=n+'단계'+(n>limit?' · 이전 단계 완료 필요':profile.dungeonProgress[d.id]>=n?' · 완료(반복)':' · 첫 클리어');}
 refreshDungeonBuild();
 const spent=!left;$('dungeon-enter').disabled=dungeonBusy||!!combatWork||!!combatError||spent;$('dungeon-enter').textContent=dungeonBusy?'전투 준비 중…':spent?'이번 주 횟수 소진':'던전 입장 ›';
}
// Alpha 0.141 무한의 탑 tab: floor pager (best+1 at most), the floor's land/kind/strength and the permanent bonuses.
function refreshTower(){
 const best=profile.tower.best,limit=game.dungeonLimit(profile,'tower');selectedTowerFloor=clamp(selectedTowerFloor,1,limit);const floor=selectedTowerFloor,plan=game.towerPlan(floor),st=game.STAGES[plan.chapter-1],kind={normal:'일반 층',elite:'정예 층',boss:'보스 층'}[plan.floorKind],first=floor>best,reward=game.dungeonRewards('tower',floor);
 $('tower-best').textContent=best?best+'층':'기록 없음';$('tower-floor').textContent=floor+'층';
 $('tower-floor-down10').disabled=$('tower-floor-down').disabled=floor<=1;$('tower-floor-up').disabled=$('tower-floor-up10').disabled=floor>=limit;
 $('tower-floor-info').textContent=kind+(plan.floorKind==='boss'?' · '+st.bossName:'')+'\n'+plan.chapter+'장 '+st.name+' 지형 · 일반 '+floor+'장 강도\n'+(first?'첫 클리어 보상 있음':'이미 오른 층 · 보상 없음');
 const b=game.towerBonus(best),next=Math.floor(best/10)*10+10,at=game.towerBonusAt(next);
 $('tower-next-bonus').textContent=next+'층 · '+at.text;
 $('tower-bonus').textContent=[['공격력',b.damagePct],['최대 체력',b.hpPct],['치명',b.crit],['피해 감소',b.reduction]].map(([n,v])=>n+' +'+Math.round(v*1000)/10+(n==='치명'||n==='피해 감소'?'%p':'%')).join('\n');
 $('dungeon-kind').textContent='무한의 탑 · 60초';$('dungeon-name').textContent='무한의 탑 '+floor+'층';$('dungeon-rule').textContent=game.TOWER.rule;$('dungeon-hint').textContent=kind+' · '+game.TOWER.hint;
 $('dungeon-rewards').textContent=first?'첫 클리어 · '+dungeonRewardText(reward)+(game.towerBonusAt(floor)?' · 영구 '+game.towerBonusAt(floor).text:''):'이미 오른 층 · 보상 없음';$('dungeon-use').hidden=true;$('dungeon-progress').textContent='1~'+limit+'층';
 $('dungeon-enter').disabled=dungeonBusy||!!combatWork||!!combatError;$('dungeon-enter').textContent=dungeonBusy?'전투 준비 중…':'탑 오르기 ›';
}
function refreshDungeonBuild(){
 const selected=profile.selectedBuild!==null?profile.savedBuilds[profile.selectedBuild]:null,match=selected&&JSON.stringify(selected.equipment)===JSON.stringify(profile.equipment)&&JSON.stringify(selected.skill)===JSON.stringify({loadout:profile.skillBook.loadout,auto:profile.skillBook.auto,awakening:profile.skillBook.awakening});
 for(let n=0;n<5;n++){$('dungeon-build-option-'+n).textContent=(profile.savedBuilds[n]?.name??game.BUILD_NAMES[n])+(profile.savedBuilds[n]?'':' · 미저장');$('dungeon-build-option-'+n).disabled=!profile.savedBuilds[n];}for(let n=0;n<5;n++){const b=$('dungeon-build-pick-'+n);hudText(b,profile.savedBuilds[n]?.name??game.BUILD_NAMES[n]);b.disabled=!profile.savedBuilds[n];b.setAttribute('aria-pressed',String(!!match&&profile.selectedBuild===n));b.setAttribute('title',profile.savedBuilds[n]?'이 프리셋으로 바꿔 입장':'저장된 프리셋 없음');}hudText($('dungeon-build-state'),match?'프리셋':'프리셋 · 사용자 조합');if(document.activeElement!==$('dungeon-build'))$('dungeon-build').value=match?String(profile.selectedBuild):'current';
}
// Alpha 0.136 보스 러시 tab: today's five bosses, entries and the 인장 성장 panel; the right-hand entry panel is shared.
function rushResetText(){const left=game.nextRushReset(Date.now())-Date.now(),hours=Math.floor(left/36e5),minutes=Math.ceil(left%36e5/6e4);return '00:00 초기화 · '+(hours?hours+'시간 ':'')+minutes+'분 남음';}
function ownedSeals(){return profile.inventory.filter(game.isSeal).sort((a,b)=>Number(profile.equipment.special===b.id)-Number(profile.equipment.special===a.id)||b.seal.grade-a.seal.grade||b.seal.level-a.seal.level||a.id-b.id);}
function refreshRush(){
 const now=Date.now(),open=game.rushUnlocked(profile),chapter=game.rushChapter(profile,game.STAGES.length),lineup=game.rushLineup(chapter),left=game.rushEntriesLeft(profile,now),best=profile.bossRush.best;
 $('rush-chapter').textContent=open?chapter+'장 기준 · 최고 '+best+' / '+game.RUSH_BOSSES:game.RUSH_UNLOCK+'장 클리어 후 개방';
 lineup.forEach((c,i)=>{const st=game.STAGES[c-1];$('rush-boss-name-'+(i+1)).textContent=st.bossName;$('rush-boss-chapter-'+(i+1)).textContent=c+'장';$('rush-boss-'+(i+1)).setAttribute('title',st.bossName+' · '+c+'장 보스 · 체력 ×'+game.RUSH_HP[i]+' · 공격력 ×'+game.RUSH_DAMAGE[i]);});
 $('rush-day').textContent='체력 ×'+game.RUSH_HP[0]+'→×'+game.RUSH_HP.at(-1)+' · 공격력 ×'+game.RUSH_DAMAGE[0]+'→×'+game.RUSH_DAMAGE.at(-1)+'\n'+rushResetText();$('rush-day').setAttribute('title','오늘 입장 '+left+' / '+game.RUSH_DAILY_ENTRIES);
 $('dungeon-kind').textContent='보스 러시 · '+game.RUSH_TIME_LIMIT+'초';$('dungeon-name').textContent='보스 러시';$('dungeon-rule').textContent=game.rushPlan().rule;
 $('dungeon-hint').textContent='인장 등급 · '+game.SEAL_GRADES.map(g=>g.name+' '+Math.round(g.chance*100)+'%').join(' · ');
 const full=game.rushRewards(game.RUSH_BOSSES,chapter);$('dungeon-rewards').textContent='보스당 골드 '+(full.gold/game.RUSH_BOSSES).toLocaleString('ko-KR')+' · 인장 조각 2 · 인장 '+Math.round(game.RUSH_SEAL_CHANCE[1]*100)+'~'+Math.round(game.RUSH_SEAL_CHANCE[game.RUSH_BOSSES]*100)+'%';$('dungeon-rewards').setAttribute('title','인장 확률 (쓰러뜨린 보스 1~5) · '+game.RUSH_SEAL_CHANCE.slice(1).map(n=>Math.round(n*100)+'%').join(' / ')+' · 5마리 모두면 조각 +2');
 $('dungeon-progress').textContent=open?'오늘 입장 '+left+' / '+game.RUSH_DAILY_ENTRIES:game.RUSH_UNLOCK+'장 클리어 후 개방';
 $('dungeon-enter').disabled=dungeonBusy||!!combatWork||!!combatError||!open||left<1;$('dungeon-enter').textContent=dungeonBusy?'전투 준비 중…':!open?'잠김':left<1?'오늘 입장 완료':'보스 러시 입장 ›';
 refreshSealGrowth();
}
function refreshSealGrowth(){
 const list=ownedSeals();if(!list.some(i=>i.id===selectedSealId))selectedSealId=list[0]?.id??null;
 const item=list.find(i=>i.id===selectedSealId),index=list.indexOf(item),status=item?game.sealGrowthStatus(profile,item.id):null;
 $('rush-seal-prev').disabled=index<=0;$('rush-seal-next').disabled=index<0||index>=list.length-1;$('rush-seal-page').textContent=list.length?(index+1)+' / '+list.length:'0';
 $('rush-seal-art').hidden=!item;if(item)gearThumbnail($('rush-seal-art'),item,56);
 $('rush-seal-name').textContent=item?item.name:'보유한 인장이 없어.';$('rush-seal-name').style.color=item?game.SEAL_GRADES[item.seal.grade].color:'';
 $('rush-seal-level').textContent=item?game.SEAL_GRADES[item.seal.grade].name+' · 성장 '+item.seal.level+' / '+game.SEAL_MAX_LEVEL+(profile.equipment.special===item.id?' · 착용 중':''):'보스 러시에서 얻을 수 있어.';
 $('rush-seal-effects').textContent=item?game.sealEffectLines(item).join('\n'):'하옵 = 생존 능력치 · 중옵 = 공격 능력치 · 상옵 = 특수효과 · 전용 = 캐릭터 전용 특수효과(2%)\n성장: 단계마다 효과 +10% · 5단계 중옵 · 10단계 상옵 추가';
 $('rush-seal-cost').textContent=(sealFeedback?sealFeedback+'\n':'')+(status?.cost?'다음 단계 · 인장 조각 '+status.cost.shards+' (보유 '+profile.materials.sealShard+') · 골드 '+status.cost.gold.toLocaleString('ko-KR')+' · '+status.reason:item?status.reason:'인장 조각 보유 '+profile.materials.sealShard);
 $('rush-seal-grow').disabled=!status?.ok||state.phase!=='camp';
}
function startRush(){
 if(!ready||orientationBlocked||dungeonBusy||state.settlement||state.phase!=='camp'&&!game.resultReady(state)||!game.rushUnlocked(profile)||game.rushEntriesLeft(profile,Date.now())<1)return;
 audio.unlock();const region=game.rushRegionId(game.rushChapter(profile,game.STAGES.length));
 if(!combatReady||!regionReady(region)){
  const token=++launchRevision,phase=state.phase,run=state.run,drawer=campDrawer;dungeonBusy=true;$('dungeon-feedback').textContent='전투 이미지를 준비하는 중…';if(campDrawer==='dungeons')refreshDungeons();
  Promise.all([ensureCombatAssets(),prepareRegion(region,regionAssets.status==='error')]).then(([shared,ok])=>{dungeonBusy=false;if(shared&&ok&&token===launchRevision&&state.phase===phase&&state.run===run&&campDrawer===drawer)startRush();else if(campDrawer==='dungeons'){$('dungeon-feedback').textContent=shared&&ok?'입장 준비가 취소되었습니다. 다시 입장하세요.':'전투 준비에 실패했습니다. 다시 시도하세요.';refreshDungeons();}});return;
 }
 if(game.launchBossRush(state,Date.now(),viewport)){dungeonMode='rush';clearInput();inventoryOpen=codexOpen=craftOpen=trackOpen=campChoices=false;save();canvas.focus({preventScroll:true});updateHud();}
}
for(const [id,step]of [['rush-seal-prev',-1],['rush-seal-next',1]])$(id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons')return;const list=ownedSeals(),i=list.findIndex(x=>x.id===selectedSealId);const next=list[clamp(i+step,0,list.length-1)];if(next)selectedSealId=next.id;sealFeedback='';refreshSealGrowth();});
$('rush-seal-grow').addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons'||selectedSealId===null)return;const r=game.growSealItem(state,selectedSealId);sealFeedback=r.reason;if(r.ok){save();bagRenderKey='';}refreshSealGrowth();updateHud();});
function startRaid(id=selectedRaid){
 const r=game.raidDefinition(id);if(!r||!ready||orientationBlocked||dungeonBusy||state.settlement||state.phase!=='camp'&&!game.resultReady(state)||!game.raidUnlocked(profile,id)||game.raidEntriesLeft(profile,id,Date.now())<1)return;
 audio.unlock();const region=game.raidRegionId(id,game.raidChapter(profile,game.STAGES.length));
 if(!combatReady||!regionReady(region)){
  const token=++launchRevision,phase=state.phase,run=state.run,drawer=campDrawer;dungeonBusy=true;$('dungeon-feedback').textContent='전투 이미지를 준비하는 중…';if(campDrawer==='dungeons')refreshDungeons();
  Promise.all([ensureCombatAssets(),prepareRegion(region,regionAssets.status==='error')]).then(([shared,ok])=>{dungeonBusy=false;if(shared&&ok&&token===launchRevision&&state.phase===phase&&state.run===run&&campDrawer===drawer)startRaid(id);else if(campDrawer==='dungeons'){$('dungeon-feedback').textContent=shared&&ok?'입장 준비가 취소되었습니다. 다시 입장하세요.':'전투 준비에 실패했습니다. 다시 시도하세요.';refreshDungeons();}});return;
 }
 if(game.launchRaid(state,id,Date.now(),viewport,game.raidTierUnlocked(profile,selectedRaidTier)?selectedRaidTier:0)){selectedRaid=id;dungeonMode='raid';clearInput();inventoryOpen=codexOpen=craftOpen=trackOpen=campChoices=false;save();canvas.focus({preventScroll:true});updateHud();}
}
function startDungeon(id=selectedDungeon,level=selectedDungeonLevel){
 const d=game.dungeonDefinition(id);if(!d||!ready||orientationBlocked||dungeonBusy||state.settlement||state.phase!=='camp'&&!game.resultReady(state)||level>game.dungeonLimit(profile,id))return;
 audio.unlock();
 const chapter=game.dungeonStageId(id,level);
 if(!combatReady||!regionReady(chapter)){
  const token=++launchRevision,phase=state.phase,run=state.run,drawer=campDrawer;dungeonBusy=true;$('dungeon-feedback').textContent='전투 이미지를 준비하는 중…';refreshDungeons();
  Promise.all([ensureCombatAssets(),prepareRegion(chapter,regionAssets.status==='error')]).then(([shared,region])=>{dungeonBusy=false;if(shared&&region&&token===launchRevision&&state.phase===phase&&state.run===run&&campDrawer===drawer)startDungeon(id,level);else if(campDrawer==='dungeons'){$('dungeon-feedback').textContent=shared&&region?'입장 준비가 취소되었습니다. 다시 입장하세요.':'전투 준비에 실패했습니다. 다시 시도하세요.';refreshDungeons();}});return;
 }
 if(game.launchDungeon(state,id,level,viewport)){if(id==='tower')selectedTowerFloor=level;else{selectedDungeon=id;selectedDungeonLevel=level;}clearInput();inventoryOpen=codexOpen=craftOpen=trackOpen=campChoices=false;save();canvas.focus({preventScroll:true});updateHud();}
}
$('lobby-summon').addEventListener('click',()=>openDungeons());$('more-dungeons').addEventListener('click',()=>openDungeons('nav-more'));
for(const d of game.DUNGEONS)$('dungeon-card-'+d.id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons')return;launchRevision++;selectedDungeon=d.id;selectedDungeonLevel=game.dungeonLimit(profile,d.id);$('dungeon-feedback').textContent='';refreshDungeons();});
// Alpha 0.141: levels are paged (±1/±10) instead of a 100-row list; the hidden select stays for state and tests.
for(const [id,step]of [['dungeon-level-down10',-10],['dungeon-level-down',-1],['dungeon-level-up',1],['dungeon-level-up10',10]])$(id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons'||dungeonMode!=='growth')return;launchRevision++;selectedDungeonLevel=clamp(selectedDungeonLevel+step,1,game.dungeonLimit(profile,selectedDungeon));refreshDungeons();});
$('dungeon-level').addEventListener('change',()=>{const n=Number($('dungeon-level').value);if(state.phase!=='camp'||campDrawer!=='dungeons'||!Number.isInteger(n)||n<1||n>game.dungeonLimit(profile,selectedDungeon))return;launchRevision++;selectedDungeonLevel=n;refreshDungeons();});
function pickDungeonBuild(n){if(state.phase!=='camp'||campDrawer!=='dungeons')return;const r=game.applyBuild(state,n);$('dungeon-feedback').textContent=r.reason;if(r.ok){appearance=equippedDesigns(profile);save();}skillRenderKey='';updateHud();}
$('dungeon-build').addEventListener('change',()=>{if($('dungeon-build').value!=='current')pickDungeonBuild(Number($('dungeon-build').value));});
// Alpha 0.141: presets are a grid of five buttons instead of a list; the hidden select stays for state and tests.
for(let n=0;n<5;n++)$('dungeon-build-pick-'+n).addEventListener('click',()=>pickDungeonBuild(n));
$('dungeon-enter').addEventListener('click',()=>{if(state.phase==='camp'&&campDrawer==='dungeons'){if(dungeonMode==='raid')startRaid();else if(dungeonMode==='rush')startRush();else if(dungeonMode==='tower')startDungeon('tower',selectedTowerFloor);else startDungeon();}});
for(const [id,step]of [['tower-floor-down10',-10],['tower-floor-down',-1],['tower-floor-up',1],['tower-floor-up10',10]])$(id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons'||dungeonMode!=='tower')return;launchRevision++;selectedTowerFloor=clamp(selectedTowerFloor+step,1,game.dungeonLimit(profile,'tower'));refreshDungeons();});
for(const mode of ['growth','raid','rush','tower'])$('dungeon-mode-'+mode).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons'||dungeonMode===mode)return;launchRevision++;dungeonMode=mode;if(mode==='tower')selectedTowerFloor=game.dungeonLimit(profile,'tower');sealFeedback='';$('dungeon-feedback').textContent='';refreshDungeons();});
// Alpha 0.139 레이드 난이도: the three tiers share the weekly entries; a closed tier stays listed but disabled.
// Alpha 0.141: the three raid tiers are buttons instead of a list; the hidden select stays for state and tests.
for(let t=0;t<3;t++)$('raid-tier-pick-'+t).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons'||!game.raidTierUnlocked(profile,t))return;launchRevision++;selectedRaidTier=t;refreshDungeons();});
$('raid-tier').addEventListener('change',()=>{const t=Number($('raid-tier').value);if(state.phase!=='camp'||campDrawer!=='dungeons'||!game.raidTierUnlocked(profile,t))return;launchRevision++;selectedRaidTier=t;refreshDungeons();});
for(const r of game.RAIDS)$('raid-card-'+r.id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='dungeons')return;launchRevision++;selectedRaid=r.id;$('dungeon-feedback').textContent=game.raidUnlocked(profile,r.id)?'':r.unlock+'장을 클리어하면 열립니다.';refreshDungeons();});
$('dungeon-result-exit').addEventListener('click',()=>{if(!game.resultReady(state)||!state.run.dungeonId&&!state.run.raidId&&!state.run.rush)return;if(state.run.rush)dungeonMode='rush';else if(state.run.raidId){dungeonMode='raid';selectedRaid=state.run.raidId;}else if(state.run.dungeonId==='tower'){dungeonMode='tower';selectedTowerFloor=Math.min(state.run.stage+1,game.dungeonLimit(profile,'tower'));}else{dungeonMode='growth';selectedDungeon=state.run.dungeonId;selectedDungeonLevel=state.run.stage;}returnCamp();openDungeons();});
// The first tap on an unbought branch shows its full text (buttons are clipped on phones); the second tap buys it.
for(const [id,v]of [['skill-view-info','info'],['skill-view-branch','branch']])$(id).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='skills')return;skillDetailView=v;branchArmed='';skillRenderKey='';refreshSkills();});
for(let i=0;i<2;i++)$('skill-branch-'+i).addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='skills')return;const b=game.SKILL_BRANCHES[selectedSkill]?.[i];if(!b)return;const owned=game.ownsBranch(profile,selectedSkill,i),key=selectedSkill+':'+i,full=b.name+' · '+b.text+' '+game.branchSummary(b.mods);
 if(!owned&&branchArmed!==key){branchArmed=key;const why=game.branchStatus(profile,selectedSkill,i);skillFeedback=b.name+(why?' · '+why:' · 다시 누르면 검술서 '+game.SKILL_BRANCH_COST.pages+' + '+game.SKILL_BRANCH_COST.gold+' 골드로 해금');skillRenderKey='';refreshSkills();return;}
 branchArmed='';if(owned?game.chooseSkillBranch(state,selectedSkill,i):game.unlockSkillBranch(state,selectedSkill,i)){skillFeedback=(owned?(game.skillBranchIndex(profile,selectedSkill)===i?'갈래 사용 · ':'갈래 해제 · '):'갈래 해금 · ')+full;save();skillRenderKey='';updateHud();}});
$('skill-study').addEventListener('click',()=>{if(state.phase!=='camp'||campDrawer!=='skills')return;if(game.studySkill(state)){skillFeedback='검술서 연구 완료 · 강화 포인트 +1';save();skillRenderKey='';updateHud();}});
