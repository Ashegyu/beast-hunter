import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../dist/game-engine.js';
import {rollAncient} from '../dist/loot.js?v=0.142.1';
import {openMode} from './mode-fixture.mjs';

// Alpha 0.145.2 고대 세트: same-region ancients form six sets (2·4·6 pieces), each raid's ancients a set (2·3·5);
// the last stage adds a special effect that reaches combat through growth.treeBonus; 승화 items keep their ancient's set.
function game(){const p=g.createProfile(1000);p.level=150;openMode(g,p,1,61);p.gold=1e7;for(const m of g.MATERIALS)p.materials[m.id]=1e5;const s=g.createGame(p);s.phase='camp';return s;}
function wear(s,opts){const id=Math.max(1,...s.profile.inventory.map(i=>i.id+1));const it=rollAncient({id,...opts},0,null);s.profile.inventory.push(it);s.profile.nextItemId=id+1;assert.equal(g.equipItem(s,it.id),true,opts.slot);return it;}
const REGION_SLOTS=['weapon','armor','charm','helmet','pants','boots'];

test('every ancient belongs to exactly one set and the sets can be completed with their own pieces', () => {
  for(const row of g.ANCIENT_CATALOG){const item={id:1,slot:row.slot,tier:row.tier,rarity:5,catalogId:row.id,artId:row.artId,affixes:{}};assert.equal(g.ancientSetOf(item),row.raid?'raid-'+row.raid:'ancient-'+row.tier,row.id);}
  for(const set of Object.values(g.ANCIENT_SETS)){const rows=g.ANCIENT_CATALOG.filter(r=>set.raid?r.raid===set.raid:!r.raid&&r.tier===set.tier);assert.ok(new Set(rows.map(r=>r.slot)).size>=set.pieces,set.id);assert.ok(set.stages.at(-1).special,set.id);}
});

test('a regional set turns on stage by stage, adds its stats once and its special effect at six pieces', () => {
  const s=game(),p=s.profile,base=g.playerStats(p),tree0=g.treeBonus(p);assert.equal(tree0.skillDamage,0);
  for(const [n,slot] of REGION_SLOTS.entries()){wear(s,{tier:6,slot});const count=g.equippedAncientSetCounts(p)['ancient-6'];assert.equal(count,n+1);
    const active=g.equippedAncientSets(p)[0].active.length;assert.equal(active,[0,1,1,2,2,3][n]);assert.equal(g.treeBonus(p).skillDamage,n===5?.2:0);}
  const b=g.equipmentBonuses(p);assert.ok(Math.abs(b.damagePct-.22)<1e-9,'2·4·6 세트 공격력 .08+.06+.08');assert.ok(Math.abs(b.hpPct-.12)<1e-9);
  assert.equal(g.treeBonus(p).execute,.15);assert.match(g.ancientSetText('ancient-6',6),/● 6세트[\s\S]*황혼의 의식/);
  // Taking a piece off drops the six-piece stage and its special at once.
  const weapon=p.equipment.weapon;p.equipment.weapon=null;assert.equal(g.treeBonus(p).skillDamage,0);p.equipment.weapon=weapon;
});

test('raid sets count 2·3·5 pieces; a duplicate earring counts once; a forged ancient keeps its set', () => {
  const s=game(),p=s.profile;
  for(const slot of ['weapon','helmet','armor','charm','earring'])wear(s,{tier:6,slot,raid:'sovereign'});
  assert.equal(g.equippedAncientSetCounts(p)['raid-sovereign'],5);assert.equal(g.treeBonus(p).skillCooldown,.1);
  const other=rollAncient({id:900,tier:6,slot:'earring',raid:'sovereign'},0,null);p.inventory.push(other);p.equipment.earring2=other.id;
  assert.equal(g.equippedAncientSetCounts(p)['raid-sovereign'],5,'the same ancient twice is one piece');
  const t=game(),q=t.profile;const a=wear(t,{tier:1,slot:'weapon'});wear(t,{tier:1,slot:'armor'});assert.equal(g.equippedAncientSetCounts(q)['ancient-1'],2);
  const effect=g.FORGE_EFFECTS.weapon[0].id;assert.equal(g.forgeAncient(t,a.id,effect).ok,true);
  const forged=q.inventory.find(i=>i.id===a.id);assert.equal(forged.rarity,6);assert.equal(g.ancientSetOf(forged),'ancient-1');assert.equal(g.equippedAncientSetCounts(q)['ancient-1'],2);
  assert.equal(g.ancientSetOf({...forged,forge:undefined}),null,'a crafted item without a forge record has no set');
});
