import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {MONSTERS} from '../dist/chapters.js';
import {validateClip} from '../dist/engine.js';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('dist/assets/manifest.json',root),'utf8'));
const report=JSON.parse(fs.readFileSync(new URL('tools/reports/alpha065-monsters.json',root),'utf8'));
// The nine Alpha 0.65 species (0.106 specialists also have unlock stages but live in art/monsters0106).
const added=Object.keys(report.species);
function imageBounds(logical){const file=manifest.delivery[logical];assert.ok(file.endsWith('.webp'));const bytes=fs.readFileSync(new URL('dist/assets/'+file,root));assert.equal(bytes.toString('ascii',12,16),'VP8L');const bits=bytes.readUInt32LE(21);return {width:(bits&16383)+1,height:((bits>>>14)&16383)+1};}

test('nine unique transparent source sheets bind every five-view walk/attack/death clip at a fixed body scale',()=>{
 const hashes=new Set(),atlases=new Set();
 for(const id of added){const bytes=fs.readFileSync(new URL('art/monsters065/'+id+'.png',root));assert.equal(bytes.toString('hex',1,4),'504e47');assert.ok(bytes.readUInt32BE(16)>=1024);assert.ok(bytes.readUInt32BE(20)>=1024);assert.equal(bytes[25],6);const hash=createHash('sha256').update(bytes).digest('hex');hashes.add(hash);assert.equal(report.sources[id],hash);assert.equal(report.species[id].bodyCores,25);assert.ok(report.species[id].transparentFraction>.25);
  for(const direction of ['s','se','e','ne','n']){
   let body=null;for(const [family,count]of [['walk',2],['attack',2],['death',1]]){
    const clip=manifest.clips[manifest.directions[id][family][direction]],{width,height}=imageBounds(clip.image);assert.ok(clip.image.endsWith('-v065.png'));atlases.add(clip.image);assert.equal(clip.frames.length,count);assert.ok(validateClip(clip,width,height).valid);assert.ok(clip.bodyHeight>=100);if(body===null)body=clip.bodyHeight;else assert.equal(clip.bodyHeight,body);
    for(const f of clip.frames){assert.equal(f.bodyHeight,body);assert.ok(f.pivotX>=0&&f.pivotX<f.w&&f.pivotY>=0&&f.pivotY<f.h);}
   }
  }
 }
 assert.equal(hashes.size,9);assert.equal(atlases.size,3);
});
test('new regional atlases own exactly75 nonoverlapping source poses each and stay within texture limits',()=>{
 for(const region of ['forest','ruins','frost']){
  const image='monsters-'+region+'-v065.png',{width,height}=imageBounds(image);assert.ok(width<=4096&&height<=4096);const measured=report.atlases.find(a=>a.image===image),bytes=fs.readFileSync(new URL('dist/assets/'+manifest.delivery[image],root));assert.equal(createHash('sha256').update(bytes).digest('hex'),measured.sha256WebP);assert.equal(measured.pixelExact,true);assert.equal(measured.width,width);assert.equal(measured.height,height);
  const frames=Object.values(manifest.clips).filter(c=>c.image===image).flatMap(c=>c.frames);assert.equal(frames.length,75);
  for(let i=0;i<frames.length;i++)for(let j=0;j<i;j++){const a=frames[i],b=frames[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);}
 }
});
