import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';import {storeItem} from '../dist/loot.js';
// Alpha 0.142 가방 정리 규칙: 부위별 보관 개수, 획득 시 등급 이하 자동 분해, 등급 이하 일괄 분해.
const W=g.ITEM_CATALOG.find(r=>r.slot==='weapon'),A=g.ITEM_CATALOG.find(r=>r.slot==='armor');
const item=(id,rarity,row=W,extra={})=>({id,catalogId:row.id,slot:row.slot,tier:row.tier,artId:row.artId,name:row.name,rarity,affixes:{damage:rarity*5+1},...extra});
const camp=()=>{const p=g.createProfile(1000);p.inventory=[];p.equipment={};const s=g.createGame(p);return s;};

test('bag rules default to no per-부위 limit and survive a save round trip clamped',()=>{
 const p=g.createProfile(1);assert.equal(p.bagRules.auto,false);for(const slot of g.BAG_SLOTS)assert.equal(p.bagRules.limits[slot],g.INVENTORY_LIMIT);
 p.bagRules={grade:9,auto:true,limits:{weapon:3,armor:7,helmet:'x'}};const r=g.restoreProfile(g.encodeProfile(p,1000),1000).bagRules;
 assert.equal(r.grade,g.BAG_GRADE_MAX);assert.equal(r.auto,true);assert.equal(r.limits.weapon,g.BAG_LIMIT_MIN);assert.equal(r.limits.armor,7);assert.equal(r.limits.helmet,g.BAG_LIMIT_DEFAULT);
});

test('over a 부위 limit the new item joins the others and the lowest grades are dismantled first',()=>{
 const s=camp(),p=s.profile;assert.ok(g.setBagRules(s,{slot:'weapon',limit:5}));
 for(let n=1;n<=5;n++)storeItem(p,item(n,n%2?2:1));storeItem(p,item(20,1,A));
 const gold=p.gold,low=storeItem(p,item(6,0));assert.equal(low.kept,false,'the new 일반 is the lowest');assert.equal(low.salvaged,1);assert.equal(p.gold,gold+g.salvageValue(item(6,0)));
 const high=storeItem(p,item(7,3));assert.equal(high.kept,true);assert.equal(high.salvaged,1);
 const weapons=p.inventory.filter(i=>i.slot==='weapon');assert.equal(weapons.length,5);assert.ok(weapons.some(i=>i.id===7));
 assert.equal(weapons.filter(i=>i.rarity===1).length,1,'one 희귀 went');assert.ok(p.inventory.some(i=>i.id===20),'other 부위 untouched');
});

test('protected, upgraded, ancient and seal items never count as dismantle candidates',()=>{
 const s=camp(),p=s.profile;g.setBagRules(s,{slot:'weapon',limit:5});
 storeItem(p,item(1,0));storeItem(p,item(2,0,W,{enhancement:3}));storeItem(p,item(3,0,W,{promotionCount:1}));storeItem(p,item(4,0));storeItem(p,item(5,0));
 p.favoriteItemIds=[4];p.equipment={weapon:5};
 const r=storeItem(p,item(6,2));assert.equal(r.kept,true);assert.deepEqual(p.inventory.filter(i=>i.slot==='weapon').map(i=>i.id).sort(),[2,3,4,5,6]);
 const full=storeItem(p,item(8,0));assert.equal(full.kept,false,'only the new plain item can go');
 const ids=g.gradeSalvageIds(p,4);assert.deepEqual(ids,[6]);
});

test('auto dismantle turns new drops at or below the chosen grade into gold; bulk by grade goes through bulkSalvage',()=>{
 const s=camp(),p=s.profile;assert.ok(g.setBagRules(s,{grade:1,auto:true}));
 const gold=p.gold,r=storeItem(p,item(1,1));assert.equal(r.kept,false);assert.equal(p.gold,gold+g.salvageValue(item(1,1)));
 assert.equal(storeItem(p,item(2,2)).kept,true);
 assert.ok(g.setBagRules(s,{auto:false}));storeItem(p,item(3,0));storeItem(p,item(4,1));storeItem(p,item(5,1,A));
 const ids=g.gradeSalvageIds(p,1);assert.deepEqual(ids.sort(),[3,4,5]);const res=g.bulkSalvage(s,ids);assert.equal(res.ok,true);assert.deepEqual(p.inventory.map(i=>i.id),[2]);
 assert.equal(g.setBagRules(s,{grade:7}),false);assert.equal(g.setBagRules(s,{slot:'nope',limit:5}),false);
 s.phase='playing';assert.equal(g.setBagRules(s,{grade:0}),false,'camp only');
});
