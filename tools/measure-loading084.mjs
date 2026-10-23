// Transfer/decode sizes only. No network latency, GPU or browser cache claim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {campAssetPaths,regionAssetPlan} from '../dist/region-assets.js';
import {CHAPTERS} from '../dist/chapters.js';
const root=new URL('../dist/assets/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root))),plan=regionAssetPlan(manifest,CHAPTERS),camp=campAssetPaths(manifest);
function measure(paths){let transferBytes=0,theoreticalRgbaBytes=0;for(const path of paths){const b=fs.readFileSync(new URL(manifest.delivery?.[path]??path,root));assert.equal(b.toString('ascii',12,16),'VP8L');const bits=b.readUInt32LE(21);transferBytes+=b.length;theoreticalRgbaBytes+=((bits&16383)+1)*(((bits>>>14)&16383)+1)*4;}return {images:paths.size,transferBytes,theoreticalRgbaBytes};}
const before=JSON.parse(fs.readFileSync(new URL('../art/stability083/loading.json',import.meta.url))),after=measure(camp);
const regions=CHAPTERS.map(c=>{const all=new Set([...plan.paths,...plan.regions.get(c.id).paths]),firstBattle=measure(all),additional=measure(new Set([...all].filter(p=>!camp.has(p))));assert.equal(after.transferBytes+additional.transferBytes,firstBattle.transferBytes);assert.equal(firstBattle.transferBytes,before.regions[c.id-1].transferBytes);return {id:c.id,firstBattle,additional};});
const report={scope:'JS-managed images only. HTML/CSS artwork, fonts, browser cache, image DOM lazy requests, GPU memory and network/loading time excluded. Original lossless image files are unchanged.',previousColdCamp:before.regions[0],coldCamp:after,requiredTransferReductionPercent:+((1-after.transferBytes/before.regions[0].transferBytes)*100).toFixed(2),regions};
fs.mkdirSync(new URL('../art/quality084/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../art/quality084/loading.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
