import {validMonsterEffects} from './monster-fx.js?v=0.140.0';
import { runtimeClipIds } from './motion.js?v=0.140.0';

// Only images used by camp previews are decoded before the first hunt.
export function campAssetPaths(manifest){return new Set([manifest.clips[manifest.directions.hunter.idle.s].image,manifest.equipment.image,manifest.equipmentRarities.image]);}

export function regionAssetPlan(manifest, chapters) {
  const regionClips = new Set(), regions = new Map();
  for (const chapter of chapters) {
    const ids = new Set();
    // Boss rush regions (Alpha 0.136) carry the other four bosses of the run in extraSpecies.
    for (const actor of [...chapter.roster, chapter.bossSpecies, ...(chapter.midBoss ? [chapter.midBoss] : []), ...(chapter.extraSpecies ?? [])]) {
      for (const views of Object.values(manifest.directions[actor])) {
        for (const id of Object.values(views)) { ids.add(id); regionClips.add(id); }
      }
    }
    const clips = [...ids].map(id => manifest.clips[id]);
    const theme=chapter.theme??chapter.id,effects=manifest.monsterEffects?.[chapter.effects??theme];
    // The atlas page with the chapter's set items, which drop on the battlefield (Alpha 0.109).
    const setPage=manifest.equipment.setFrames?.[`set_${chapter.set}_sword`]?.image;
    regions.set(chapter.id, { clips, effects, paths: new Set([manifest.chapters[chapter.environment??theme].environment, ...clips.map(c => c.image),...(effects?[effects.image]:[]),...(setPage?[setPage]:[])]) });
  }
  // Monster species (ids like forest_wolf, boss_fire_drake) load only with a chapter that
  // uses them; species no chapter uses (e.g. retired region bosses) are never downloaded.
  const species = actor => actor.includes('_');
  const clips = runtimeClipIds(manifest).filter(id => !regionClips.has(id) && !species(manifest.clips[id].actor ?? '')).map(id => manifest.clips[id]);
  clips.push(manifest.chapterProps, manifest.equipment, manifest.equipmentRarities);
  const presentation=manifest.skillPresentation,skillPaths=presentation?[presentation.effects.image]:[];
  return { regions, clips, paths: new Set([manifest.loot, ...clips.map(c => c.image),...skillPaths,...(manifest.pickupEffects?[manifest.pickupEffects.image]:[])]) };
}

// Shared images + one committed region. Pending loads own private maps until validation succeeds.
export function createRegionAssets({ images, plan, loadImage, validateClip }) {
  const pending = new Map();
  let residentId = null, requestedId = null, revision = 0, status = 'idle', error = '', current;
  function request(id, retry = false) {
    if (!plan.regions.has(id)) return Promise.resolve(false);
    if (requestedId === id && !retry) return current ?? Promise.resolve(residentId === id);
    requestedId = id; const token = ++revision; error = '';
    if (residentId === id) { status = 'ready'; return current = Promise.resolve(true); }
    status = 'loading';
    let work = pending.get(id);
    if (!work) {
      const region = plan.regions.get(id);
      work = Promise.allSettled([...region.paths].map(async path => [path, images.get(path) ?? await loadImage(path)]))
        .then(results => {
          const failed = results.find(result => result.status === 'rejected');
          if (failed) throw failed.reason;
          const entries = results.map(result => result.value);
          const loaded = new Map(entries);
          for (const clip of region.clips) {
            const image = loaded.get(clip.image), result = validateClip(clip, image.naturalWidth, image.naturalHeight);
            if (!result.valid) throw Error(result.errors.join(', '));
          }
          if(region.effects&&!validMonsterEffects(region.effects,loaded))throw Error('몬스터 스킬 이미지 정보를 확인하지 못했어.');
          return loaded;
        });
      pending.set(id, work);
      // Both success and failure release the in-flight entry; no rejected finally promise escapes.
      work.then(() => pending.delete(id), () => pending.delete(id));
    }
    current = work.then(loaded => {
      if (token !== revision) return false;
      if (residentId !== null) for (const path of plan.regions.get(residentId).paths) {
        if (!plan.paths.has(path) && !loaded.has(path)) images.delete(path);
      }
      for (const [path, image] of loaded) images.set(path, image);
      residentId = id; status = 'ready'; return true;
    }, failure => {
      if (token !== revision) return false;
      status = 'error'; error = failure.message; return false;
    });
    return current;
  }
  return { request, get residentId() { return residentId; }, get requestedId() { return requestedId; },
    get status() { return status; }, get error() { return error; } };
}

// One shared atlas, validated once before gameplay; no per-frame decoding.
export function validPickupEffects(atlas,images){
  if(!atlas||typeof atlas.image!=='string'||![atlas.width,atlas.height].every(n=>Number.isInteger(n)&&n>=4)||atlas.width*atlas.height>4194304||atlas.columns!==4||atlas.rows!==4||atlas.pivotX!==.5||atlas.pivotY!==.9)return false;
  const image=images?.get(atlas.image);
  return !!image&&(image.naturalWidth??image.width)===atlas.width&&(image.naturalHeight??image.height)===atlas.height;
}
