import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validSkillPresentation} from '../dist/skill-image-fx.js';
import {regionAssetPlan} from '../dist/region-assets.js';
import {CHAPTERS} from '../dist/chapters.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url))),art=manifest.skillPresentation;
function imageMap(){return new Map([art.effects,...Object.values(art.portraits)].map(d=>[d.image,{naturalWidth:d.width,naturalHeight:d.height}]));}
test('generated skill textures are real lossless image assets, bounded and only combat atlas is loaded at startup',()=>{
 const plan=regionAssetPlan(manifest,CHAPTERS);let bytes=0;
 // Alpha 0.137: the animated effect atlas (6 frames × 16 effects) is lossy colour + full alpha (VP8X); portraits stay lossless.
 {const d=art.effects,b=fs.readFileSync(new URL('../dist/assets/'+d.image,import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',12,16),'VP8X');assert.ok(b[20]&16,'alpha');assert.equal(b.readUIntLE(24,3)+1,d.width);assert.equal(b.readUIntLE(27,3)+1,d.height);bytes+=b.length;
  assert.equal(Object.keys(d.sequences).length,16);for(const [id,seq]of Object.entries(d.sequences)){assert.equal(seq.length,6);assert.deepEqual(d.frames[id],seq[2]);}}
 for(const d of Object.values(art.portraits)){const b=fs.readFileSync(new URL('../dist/assets/'+d.image,import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',12,16),'VP8L');const bits=b.readUInt32LE(21);assert.equal((bits&16383)+1,d.width);assert.equal(((bits>>>14)&16383)+1,d.height);if(d.kind!=='scene')assert.ok(bits&(1<<28),'alpha channel');assert.equal(plan.paths.has(d.image),d===art.effects);bytes+=b.length;}
 assert.ok(bytes<7*1024*1024);assert.equal(Object.keys(art.effects.frames).length,16);assert.equal(validSkillPresentation(art,imageMap()),true);
});
test('missing, mismatched or malformed art never validates as gameplay-ready',()=>{
 const missing=imageMap();missing.delete(art.effects.image);assert.equal(validSkillPresentation(art,missing),false);
 for(const alter of [a=>a.effects.frames.crescent.x=-1,a=>a.effects.frames.gale.w=99999,a=>a.effects.columns=0,a=>a.effects.sequences.dance.pop(),a=>a.effects.sequences.mark[3].y=99999]){const a=structuredClone(art);alter(a);assert.equal(validSkillPresentation(a,imageMap()),false);}
});

test('three ultimate scenes declare full background artwork with distinct versioned files',()=>{
 const paths=new Set();for(const id of ['bloodmoon','eclipse','phantoms']){const d=art.portraits[id];assert.equal(d.kind,'scene');assert.match(d.image,/v052\.webp$/);assert.ok(d.width>=700&&d.height>=1000);paths.add(d.image);}assert.equal(paths.size,3);
});
