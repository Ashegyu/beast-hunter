import test from 'node:test';import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {createBackup,readBackup} from '../dist/profile-backup.js';
const setup=()=>{const p=g.createProfile(1000);p.level=200;return g.createGame(p);};
test('성장 트리 프리셋: save the current tree into a slot, load it back (camp only), survive restore and backup',()=>{
 const s=setup(),p=s.profile;for(const id of g.TREE_ORDER.slice(0,10))g.learnGrowthNode(s,id);const a=[...p.growthTree];assert.ok(a.length>=5);
 assert.equal(g.saveTreePreset(s,0,'검귀 위주'),true);g.resetGrowthTree(s);assert.deepEqual(p.growthTree,[]);
 for(const id of g.TREE_ORDER.filter(id=>id.startsWith('ward')).slice(0,4))g.learnGrowthNode(s,id);assert.equal(g.saveTreePreset(s,1),true);assert.equal(p.treePresets[1].name,'트리 2');
 const r=g.loadTreePreset(s,0);assert.equal(r.ok,true);assert.deepEqual(p.growthTree,a);assert.equal(g.loadTreePreset(s,3).ok,false);assert.equal(g.saveTreePreset(s,5),false);
 const back=readBackup(createBackup(p,1000),1000).profile;assert.deepEqual(back.treePresets[0],{name:'검귀 위주',tree:a});assert.deepEqual(g.restoreProfile(g.encodeProfile(p,1000),1000).treePresets,p.treePresets);
 assert.equal(g.deleteTreePreset(s,1),true);assert.equal(p.treePresets[1],null);
 g.launchDungeon(s,'gold',1);assert.equal(g.saveTreePreset(s,2),false);assert.equal(g.loadTreePreset(s,0).ok,false);
});
test('loading a preset bigger than the tree points trims the outer nodes; restore drops unknown or disconnected nodes',()=>{
 const s=setup(),p=s.profile;for(const id of g.TREE_ORDER.slice(0,30))g.learnGrowthNode(s,id);g.saveTreePreset(s,0);const big=p.treePresets[0].tree.length;
 p.level=20;const r=g.loadTreePreset(s,0);assert.equal(r.ok,true);assert.equal(r.trimmed,true);assert.ok(p.growthTree.length<big);assert.ok(g.treePoints(p)>=0);
 const f=g.createProfile(1000);f.treePresets=[{name:'x',tree:['nope','blade-1']},'bad',null];const c=g.restoreProfile(f,1000).treePresets;assert.deepEqual(c[0].tree,[]);assert.equal(c[1],null);assert.equal(c.length,5);
});
