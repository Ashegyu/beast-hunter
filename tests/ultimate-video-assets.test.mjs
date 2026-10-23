import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validUltimateVideos} from '../dist/ultimate-video.js';
const root=new URL('../',import.meta.url),m=JSON.parse(fs.readFileSync(new URL('dist/assets/manifest.json',root))),report=JSON.parse(fs.readFileSync(new URL('art/skills053/media.json',root)));
test('three independent faststart H264 clips match inspected frame ranges and runtime budget',()=>{
 assert.equal(validUltimateVideos(m.skillPresentation.videos),true);let bytes=0;
 for(const[id,d]of Object.entries(m.skillPresentation.videos)){const r=report.clips[id],b=fs.readFileSync(new URL('dist/assets/'+d.src,root));assert.equal(b.toString('ascii',4,8),'ftyp');assert.ok(b.indexOf(Buffer.from('moov'))<b.indexOf(Buffer.from('mdat')));assert.ok(b.includes(Buffer.from('avc1')));assert.equal(createHash('sha256').update(b).digest('hex'),r.sha256);assert.equal(d.duration,r.frames/r.fps);assert.equal(r.audio,false);bytes+=b.length;}
 assert.equal(bytes,report.totalRuntimeBytes);assert.ok(bytes<4*1024*1024);
 const original=fs.readFileSync(new URL(report.source.path,root));assert.equal(createHash('sha256').update(original).digest('hex'),report.source.sha256);
});
