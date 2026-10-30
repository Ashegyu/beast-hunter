// Alpha 0.139: writes the 성장 트리 web (#growth-tree) into dist/index.html from growth.js TREE_NODES.
// The app never creates DOM, so every node button and link line is static. Run again after moving or adding nodes.
import fs from 'node:fs';
const g=await import(new URL('../dist/growth.js',import.meta.url).href);
const file=new URL('../dist/index.html',import.meta.url),html=fs.readFileSync(file,'utf8');
// Icons: tools/pack-growth0139.py packs art/growth0139 in sheets.json order, 7 per atlas row. Small nodes use their bonus emblem.
const ICON_ORDER=Object.values(JSON.parse(fs.readFileSync(new URL('../art/growth0139/sheets.json',import.meta.url),'utf8'))).flatMap(s=>s.items),COLS=7,ROWS=Math.ceil(ICON_ORDER.length/COLS);
// 0.147.0: named nodes carry their emblem key (`icon`); 치명타 피해 small nodes borrow the 치명타 emblem.
const ALIAS={'t-critDamage':'t-crit'};
const iconOf=n=>{let key=n.kind==='small'?'t-'+Object.keys(n.bonus)[0]:n.icon??n.id;key=ALIAS[key]??key;const i=ICON_ORDER.indexOf(key);if(i<0)throw new Error('no icon for '+n.id);return `background-position:${Math.round(i%COLS/(COLS-1)*10000)/100}% ${Math.round(Math.floor(i/COLS)/(ROWS-1)*10000)/100}%`;};
const {width:W,height:H}=g.TREE_BOX,pct=(v,max)=>Math.round(v/max*10000)/100+'%';
// 0.147.1 (사용자 요청 '연결 라인 수정'): each link is a branch — a dark bark stroke under a thin vein; the app sets
// data-state (locked / open / owned) on the group and CSS colours the vein by the region of its outer node.
const edgeBranch=(a,b)=>{const n=g.TREE_NODES[b].kind==='core'?g.TREE_NODES[a]:g.TREE_NODES[b];return n.kind==='core'?'core':n.branches.length===1?n.branches[0]:'bridge';};
const lines=g.TREE_EDGES.map(([a,b])=>{const p=g.TREE_NODES[a],q=g.TREE_NODES[b],xy=`x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"`;return `<g id="tree-edge-${a}--${b}" class="tree-edge" data-state="locked" data-branch="${edgeBranch(a,b)}"><line class="bark" ${xy}/><line class="vein" ${xy}/></g>`;}).join('');
const labels='<div class="tree-regions">'+g.GROWTH_TREE.map(b=>`<span class="tree-region" data-branch="${b.id}"><strong>${b.name}</strong><small id="tree-branch-${b.id}-spent"></small></span>`).join('')+'</div>';
const nodes=Object.values(g.TREE_NODES).map(n=>`<button id="tree-node-${n.id}" class="tree-node" type="button" data-kind="${n.kind}" data-branch="${n.kind==='core'?'core':n.branches.length===1?n.branches[0]:'bridge'}" data-state="${n.kind==='core'?'owned':'locked'}" style="left:${pct(n.x,W)};top:${pct(n.y,H)};${iconOf(n)}"></button>`).join('');
const detail=`<div id="tree-detail" class="tree-detail" role="status"><b id="tree-detail-name"></b><small id="tree-detail-text"></small><em id="tree-detail-cost"></em><button id="tree-forget" type="button">반환</button><button id="tree-learn" type="button">습득</button></div>`;
// 0.147.0: only the web (lines, region labels, nodes) is rewritten; the presets, zoom tools (0.141) and the detail bar stay.
const block=`<div id="tree-web" class="tree-web"><svg class="tree-lines" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${labels}${nodes}</div>`;
const start=html.indexOf('<div id="tree-web"'),end=html.indexOf('<div id="tree-detail"');
if(start<0||end<start)throw new Error('tree-web block not found');void detail;
fs.writeFileSync(file,html.slice(0,start)+block+html.slice(end));
console.log('nodes',Object.keys(g.TREE_NODES).length,'edges',g.TREE_EDGES.length,'cost',g.TREE_COST);
