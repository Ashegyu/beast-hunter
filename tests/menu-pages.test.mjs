import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createMenuNavigation} from '../dist/menu-pages.js';

test('removed shared screen paging and top mode controls have no markup or bindings',()=>{
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),navigation=fs.readFileSync(new URL('../dist/menu-pages.js',import.meta.url),'utf8');
 for(const id of ['inventory-equipment-tab','inventory-gear-tab','inventory-build-tab']){assert.ok(!html.includes('id="'+id+'"'));assert.ok(!app.includes("$('"+id+"')"));}
 assert.doesNotMatch(html,/menu-pages\.css|folio-nav|구역 바로가기/);assert.doesNotMatch(navigation,/createElement|MutationObserver|ResizeObserver|translateX|scrollWidth|addEventListener/);
 assert.ok(html.includes('id="loadout-build-open"'));assert.ok(app.includes("$('loadout-build-open').addEventListener"));
});
test('inventory navigation never moves or reparents its surrounding UI',()=>{
 const navigation=createMenuNavigation(),children=[{},{}],root={id:'inventory-content',children,scrollTop:87},item={closest:()=>root,scrollIntoView(){throw Error('Inventory must stay fixed');}};
 navigation.first(root);navigation.reveal(item);assert.equal(root.scrollTop,87);assert.equal(root.children,children);
});
test('other menus keep ordinary section focus without generating page controls',()=>{
 const navigation=createMenuNavigation(),root={id:'craft-content',scrollTop:55},calls=[],node={closest:()=>null,scrollIntoView:options=>calls.push(options)};navigation.first(root);navigation.reveal(node);assert.equal(root.scrollTop,0);assert.deepEqual(calls,[{block:'start'}]);assert.doesNotThrow(()=>{navigation.reveal(null);navigation.first(null);});
});
