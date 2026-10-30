// Alpha 0.147.0 (사용자 요청 '성장 트리 가지를 더 다양하게, 대칭일 필요 없이 나뭇가지처럼 무작위로'):
// grows the 성장 트리 from a branch plan with a seeded random walk (angle jitter, uneven step lengths, forks at random
// spreads), rejects layouts whose nodes crowd (< MIN_GAP) or whose links cross, and prints the ROWS block for growth.js.
//   node tools/grow-tree0147.mjs [seed]   → prints `const ROWS=[…];` (paste into dist/growth.js between the markers)
// Node kinds: s = small (2P), n = notable (6P), k = keystone (10P). Themes give the bonus, the name and the icon.
const SEED=Number(process.argv[2]??1);
const W=600,H=240,CORE={x:300,y:128},PAD_X=16,PAD_Y=12;
// 0.147.3 (사용자 요청 '이미지가 겹치는 구간이 많다'): spacing is checked on the real screens, with each node's own size.
// The two tightest 검수 layouts (measured): 667×375 → web 623×232 px, 568×320 → 530×196 px; nodes 16/23/30 px there and
// 13/19/25 px at heights ≤ 360 (layout-fit.css 0.147.3).
// Two nodes need radius + radius + 3 px on both; a link must pass a third node by its radius + 5 px (the branch is ~10 px).
const SCREENS=[{sx:623/600,sy:232/240,r:{s:8,n:11.5,k:15,core:15}},{sx:530/600,sy:196/240,r:{s:6.5,n:9.5,k:12.5,core:12.5}}];
const rad=(n,sc)=>sc.r[n.spec.kind]??sc.r.s;
// How far a pair falls short (>1 = overlapping on some screen) and the free room around a spot (px, tightest screen).
const shortfall=(a,b)=>Math.max(...SCREENS.map(sc=>(rad(a,sc)+rad(b,sc)+3)/Math.max(.01,Math.hypot((a.x-b.x)*sc.sx,(a.y-b.y)*sc.sy))));
const roomAt=(spot,kind,nodes)=>{let room=Infinity;for(const o of nodes)for(const sc of SCREENS)room=Math.min(room,Math.hypot((o.x-spot.x)*sc.sx,(o.y-spot.y)*sc.sy)-(sc.r[kind]+rad(o,sc)+3));return room;};
const segGap=(p,q,n,sc)=>{const ax=p.x*sc.sx,ay=p.y*sc.sy,bx=q.x*sc.sx,by=q.y*sc.sy,nx=n.x*sc.sx,ny=n.y*sc.sy,L2=(bx-ax)**2+(by-ay)**2,u=Math.max(0,Math.min(1,((nx-ax)*(bx-ax)+(ny-ay)*(by-ay))/L2));return Math.hypot(nx-(ax+u*(bx-ax)),ny-(ay+u*(by-ay)))-rad(n,sc)-5;};
// Screen furniture over the web (box units): 프리셋 (top left), 확대 (top right), 영역 이름표 (bottom left). Nodes stay out.
const KEEP_OUT=[[0,0,290,30],[460,0,600,30],[0,176,62,240]];// 0.147.1: sized for 568×320, where the tools cover more of the web
const blocked=(x,y)=>KEEP_OUT.some(([a,b,c,d])=>x>=a-10&&x<=c+10&&y>=b-10&&y<=d+10);
// theme → small bonus; named notables/keystones carry their own bonus and icon (art/growth0139 icon keys).
const SMALL={dmg:{damagePct:.04},aspd:{attackSpeed:.025},fin:{finisher:.125},crit:{crit:.01},critd:{critDamage:.06},exec:{execute:.06},range:{range:.025,damagePct:.02},
 hp:{hpPct:.04},red:{reduction:.01},guard:{lowHpGuard:.04},regen:{regeneration:.5},drain:{drain:.0012},
 stam:{staminaRegen:.06},cd:{skillCooldown:.025},area:{skillArea:.04},sdmg:{skillDamage:.04},fury:{skillFury:.06},speed:{speed:.025},
 bw:{damagePct:.025,hpPct:.025},wa:{regeneration:.4,staminaRegen:.04},critspeed:{speed:.02,critDamage:.04}};
const N=(name,bonus,icon)=>({kind:'n',name,bonus,icon}),K=(name,bonus,icon)=>({kind:'k',name,bonus,icon}),S=t=>({kind:'s',t});
const NAMED={
 sharp:N('날 선 검',{damagePct:.1},'blade-n'),soul:N('검귀의 혼',{damagePct:.125,attackSpeed:.04},'blade-m7'),haste:N('연격 가속',{attackSpeed:.075},'blade-a3'),
 bloodmoon:N('혈월의 검',{finisher:.5},'blade-a6'),frenzy:K('광폭 연무',{attackSpeed:.19,reduction:-.06},'blade-a7'),weak:N('약점 간파',{crit:.04},'blade-b3'),
 vital:N('급소 일격',{critDamage:.2},'blade-m2'),edge:N('칼끝 감각',{range:.075,crit:.02},'ab-n'),executioner:N('처형자',{execute:.25},'blade-b6'),
 behead:K('참수',{execute:.3,critDamage:.3,hpPct:-.1},'blade-b7'),
 body:N('단단한 몸',{hpPct:.1},'ward-n'),oath:N('수호의 맹세',{reduction:.03,hpPct:.06},'ward-u2'),wall:N('철벽',{reduction:.04},'ward-a2'),
 unbroken:N('불굴',{lowHpGuard:.15},'ward-a4'),fortress:K('부동의 성채',{reduction:.08,speed:-.1},'ward-a6'),regrow:N('재생',{regeneration:1.9},'ward-b2'),
 thirst:N('피의 갈증',{drain:.005},'ward-b4'),ghoul:K('혈귀의 육체',{drain:.0075,regeneration:-1},'ward-b6'),
 cycle:N('기력 순환',{staminaRegen:.19},'art-n'),quick:N('빠른 손',{skillCooldown:.075},'art-a3'),wide:N('넓은 검기',{skillArea:.125},'art-a6'),
 overload:K('검기 폭주',{skillCooldown:.15,damagePct:-.08},'art-a7'),flowing:N('검의 흐름',{skillDamage:.06,staminaRegen:.1},'art-m2'),
 might:N('검술 위력',{skillDamage:.15},'art-b3'),chain:N('연환',{skillFury:.31},'art-b6'),artsoul:N('검술사의 혼',{skillDamage:.125,skillCooldown:.04},'art-m7'),
 oneness:K('검무 일체',{skillDamage:.375,skillCooldown:-.1},'art-b7'),
 gale:N('검풍',{range:.1,speed:.06},'ab-l3'),dash:N('질주',{speed:.075,staminaRegen:.06},'ab-r3'),afterimage:N('잔상 보법',{skillArea:.05,speed:.05},'core'),
 fighter:N('투사의 기개',{damagePct:.06,hpPct:.06},'bw-2'),calm:N('고요한 호흡',{regeneration:1.25,staminaRegen:.125},'wa-2'),
};
// A path is a list of nodes; {fork:[[angleOffset°, path], …]} splits it and ends the path; {twig:[angleOffset°, path]}
// (0.147.1, 사용자 요청 '끊기는 구간을 더') sprouts a short dead-end side branch and the path goes on. Lengths and spreads differ on purpose.
const nn=k=>NAMED[k],F=(...arms)=>({fork:arms}),T=(off,...steps)=>({twig:[off,steps]});
const PLAN={
 blade:{angle:180,path:[S('dmg'),nn('sharp'),F(
  [-38,[S('aspd'),T(-80,S('aspd'),S('crit')),S('aspd'),nn('haste'),F([-30,[S('fin'),S('fin'),nn('bloodmoon'),S('fin'),nn('frenzy')]],[26,[S('aspd'),S('critd')]])]],
  [6,[S('range'),nn('edge'),S('critd'),S('critd'),nn('vital'),F([-28,[S('crit'),S('crit'),nn('weak')]],[32,[S('dmg'),S('dmg'),nn('soul')]])]],
  [46,[S('exec'),T(80,S('exec'),S('critd')),S('exec'),nn('executioner'),S('exec'),S('critd'),nn('behead')]])]},
 ward:{angle:-90,path:[S('hp'),nn('body'),F(
  [-78,[S('red'),nn('wall'),F([-15,[S('guard'),S('guard'),nn('unbroken')]],[45,[S('red'),nn('fortress')]])]],
  [4,[S('hp'),nn('oath')]],
  [78,[S('regen'),S('regen'),nn('regrow'),S('drain'),T(75,S('drain')),S('drain'),nn('thirst'),S('drain'),nn('ghoul')]])]},
 art:{angle:0,path:[S('stam'),nn('cycle'),F(
  [-46,[S('cd'),S('cd'),nn('quick'),F([-18,[S('area'),S('area'),nn('wide'),nn('overload')]],[36,[S('stam'),S('cd'),S('stam')]])]],
  [14,[S('sdmg'),nn('flowing'),T(80,S('sdmg'),S('stam')),S('sdmg'),S('sdmg'),nn('might'),F([-28,[S('sdmg'),nn('artsoul'),nn('oneness')]],[30,[S('fury'),T(75,S('fury')),S('fury'),nn('chain')]])]],
  [60,[S('area'),S('stam')]])]},
 ab:{angle:90,path:[S('speed'),nn('gale'),F(
  [-58,[S('speed'),T(-75,S('critspeed')),S('range'),nn('dash'),S('critspeed')]],
  [52,[S('speed'),S('sdmg'),nn('afterimage'),S('sdmg')]])]},
};
// Ring around the core (fixed, so every region starts next to the 중심).
const RING={blade:{x:267,y:128},ward:{x:300,y:96},art:{x:333,y:128},ab:{x:300,y:160}};
const RING_BONUS={blade:{damagePct:.025},ward:{hpPct:.025},art:{staminaRegen:.05},ab:{speed:.025}};
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function grow(seed){
 const rnd=mulberry(seed),nodes=[],edges=[],count={};
 const add=(region,spec,x,y,from)=>{const n=(count[region]=(count[region]??0)+1),id=region+'-'+n;nodes.push({id,region,spec,x,y});if(from)edges.push([from,id]);return id;};
 nodes.push({id:'core',region:'core',spec:{kind:'core'},x:CORE.x,y:CORE.y});
 const ringIds={};for(const r of Object.keys(RING)){const id=r+'-r';nodes.push({id,region:r,spec:{kind:'s',bonus:RING_BONUS[r]},x:RING[r].x,y:RING[r].y});edges.push(['core',id]);ringIds[r]=id;}
 const walk=(region,path,fromId,x,y,angle)=>{
  for(const step of path){
   if(step.fork){for(const [off,arm] of step.fork)if(!walk(region,arm,fromId,x,y,angle+off+(rnd()-.5)*16))return false;return true;}
   if(step.twig){if(!walk(region,step.twig[1],fromId,x,y,angle+step.twig[0]+(rnd()-.5)*20))return false;continue;}
   // Jittered candidates; the one farthest from every placed node wins (keeps the walk random but uncrowded). Candidates
   // outside the box or crossing a placed link are dropped; when the near ones are all crowded the walk may bend up to ±100°.
   let best=null;const from=nodes.find(n=>n.id===fromId);
   for(let k=0;k<96;k++){if(k===8&&best&&best.room>=3||k===48&&best)break;const spread=k<8?44:200,a=angle+(rnd()-.5)*spread,c=Math.cos(a*Math.PI/180),sn=Math.sin(a*Math.PI/180),sc=SCREENS[0],
     px=(rad(from,sc)+(sc.r[step.kind]??sc.r.s)+7+rnd()*8)*(k<48?1:.8),len=px/Math.hypot(c*sc.sx,sn*sc.sy);
    const nx=x+c*len,ny=y+sn*len;
    if(nx<PAD_X||nx>W-PAD_X||ny<PAD_Y||ny>H-PAD_Y||blocked(nx,ny))continue;
    const me={x:nx,y:ny};if(edges.some(([p,q])=>p!==fromId&&q!==fromId&&cross(from,me,nodes.find(n=>n.id===p),nodes.find(n=>n.id===q))))continue;
    const room=roomAt(me,step.kind,nodes);
    if(!best||room>best.room)best={a,nx,ny,room};}
   if(!best)return false;
   let {a,nx,ny}=best;
   fromId=add(region,step,Math.round(nx),Math.round(ny),fromId);x=nx;y=ny;angle=a*.6+angle*.4;
  }
  return true;
 };
 for(const [r,plan] of Object.entries(PLAN))if(!walk(r,plan.path,ringIds[r],RING[r].x,RING[r].y,plan.angle))return null;
 // Bridges: two nodes between the closest pair of two regions' nodes; the south arms hook onto their neighbours.
 const by=id=>nodes.find(n=>n.id===id),closest=(ra,rb,min=0)=>{let best=null;for(const a of nodes)if(a.region===ra&&!a.id.endsWith('-r'))for(const b of nodes)if(b.region===rb&&!b.id.endsWith('-r')){const d=Math.hypot(a.x-b.x,a.y-b.y);if(d>=min&&(!best||d<best.d))best={a,b,d};}return best;};
 for(const [name,ra,rb,small,notable] of [['bw','blade','ward','bw','fighter'],['wa','ward','art','wa','calm']]){const c=closest(ra,rb,54);if(!c||c.d>170)return null;
  const p1={x:c.a.x+(c.b.x-c.a.x)/3,y:c.a.y+(c.b.y-c.a.y)/3},p2={x:c.a.x+(c.b.x-c.a.x)*2/3,y:c.a.y+(c.b.y-c.a.y)*2/3};
  const i1=add(name,S(small),Math.round(p1.x+(rnd()-.5)*6),Math.round(p1.y+(rnd()-.5)*6),c.a.id),i2=add(name,nn(notable),Math.round(p2.x+(rnd()-.5)*6),Math.round(p2.y+(rnd()-.5)*6),i1);edges.push([i2,c.b.id]);}
 for(const r of ['blade','art']){const c=closest('ab',r);if(c&&c.d<75)edges.push([c.a.id,c.b.id]);}
 return {nodes,edges,by};
}
// Relaxation (0.147.1): nudge pairs that sit closer than MIN_GAP apart, a little at a time, keeping the 중심 and its ring
// fixed and every node inside the box and off the screen furniture. The shape stays; only the crowding is undone.
// 0.147.4 (사용자 요청 '좌우 여백이 많이 남는다'): the grown web is stretched to fill the box before relaxing.
function stretch(t){
 if(!t)return t;const {nodes}=t,xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),[x0,x1,y0,y1]=[Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)];
 for(const n of nodes){n.x=PAD_X+2+(n.x-x0)*(W-2*PAD_X-4)/(x1-x0);n.y=PAD_Y+2+(n.y-y0)*(H-2*PAD_Y-4)/(y1-y0);}
 return t;
}
function relax(t){
 if(!t)return t;const {nodes,edges}=t,fixed=n=>n.id==='core'||n.id.endsWith('-r'),by=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const keepIn=n=>{n.x=Math.max(PAD_X,Math.min(W-PAD_X,n.x));n.y=Math.max(PAD_Y,Math.min(H-PAD_Y,n.y));
  for(const [a,b,c,d] of KEEP_OUT)if(n.x>=a-10&&n.x<=c+10&&n.y>=b-10&&n.y<=d+10){const out=[[n.x-(a-11),'x',a-11],[(c+11)-n.x,'x',c+11],[n.y-(b-11),'y',b-11],[(d+11)-n.y,'y',d+11]].filter(([,k,v])=>k==='x'?v>=PAD_X&&v<=W-PAD_X:v>=PAD_Y&&v<=H-PAD_Y).sort((p,q)=>p[0]-q[0])[0];if(out)n[out[1]]=out[2];}};
 for(let it=0;it<1500;it++){let moved=false;
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],f=shortfall(a,b)*1.05;if(f<=1)continue;moved=true;
   let dx=b.x-a.x,dy=b.y-a.y;if(Math.hypot(dx,dy)<.01){dx=1;dy=0;}const L=Math.hypot(dx,dy),push=L*(f-1)*.55+.15,ux=dx/L*push/2,uy=dy/L*push/2;
   const fa=fixed(a),fb=fixed(b);if(fa&&fb)continue;const ka=fa?0:fb?2:1,kb=fb?0:fa?2:1;a.x-=ux*ka;a.y-=uy*ka;b.x+=ux*kb;b.y+=uy*kb;}
  // A node sitting on someone else's link is pushed off it, sideways.
  for(const [ia,ib] of edges){const p=by[ia],q=by[ib];for(const n of nodes){if(n===p||n===q||fixed(n))continue;const g=Math.min(...SCREENS.map(sc=>segGap(p,q,n,sc)))-1.5;if(g>=0)continue;moved=true;
   const L=Math.hypot(q.x-p.x,q.y-p.y)||1,side=Math.sign((q.x-p.x)*(n.y-p.y)-(q.y-p.y)*(n.x-p.x))||1;n.x+=-(q.y-p.y)/L*side*(.8-g*.4);n.y+=(q.x-p.x)/L*side*(.8-g*.4);}}
  for(const n of nodes)if(!fixed(n))keepIn(n);
  if(!moved)break;}
 for(const n of nodes){n.x=Math.round(n.x);n.y=Math.round(n.y);}
 return t;
}
const cross=(p,q,r,s)=>{const d=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);return d(p,q,r)*d(p,q,s)<0&&d(r,s,p)*d(r,s,q)<0;};
function valid(t){
 if(!t)return false;const {nodes,edges,by}=t;
 if(nodes.some(n=>blocked(n.x,n.y)))return false;
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(shortfall(nodes[i],nodes[j])>1)return false;
 for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const [a,b]=edges[i],[c,d]=edges[j];if(new Set([a,b,c,d]).size<4)continue;if(cross(by(a),by(b),by(c),by(d)))return false;}
 // No link may pass over a third node on any screen.
 for(const [a,b] of edges){const p=by(a),q=by(b);for(const n of nodes){if(n.id===a||n.id===b)continue;if(SCREENS.some(sc=>segGap(p,q,n,sc)<0))return false;}}
 return true;
}
let tree=null,seed=SEED;for(;seed<SEED+20000;seed++){const t=relax(stretch(grow(seed)));if(valid(t)){tree=t;break;}}
if(!tree)throw new Error('no valid layout');
const KIND={s:'small',n:'notable',k:'keystone',core:'core'};
const links=id=>tree.edges.filter(([,b])=>b===id).map(([a])=>a).concat(tree.edges.filter(([a,b])=>a===id&&b.endsWith('-r')&&false).map(([,b])=>b));
const fmt=v=>JSON.stringify(v).replace(/"([a-zA-Z]+)":/g,'$1:').replace(/0\./g,'.').replace(/"/g,"'");
const rows=tree.nodes.map(n=>{const s=n.spec,bonus=s.bonus??SMALL[s.t]??{},kind=KIND[s.kind];
 return `['${n.id}','${kind}',${n.x},${n.y},${fmt(links(n.id))},${fmt(bonus)}${s.name?`,'${s.name}'`:kind!=='core'?',null':",'중심'"}${s.icon?`,'${s.icon}'`:''}],`;});
const cost=tree.nodes.reduce((a,n)=>a+({s:2,n:6,k:10}[n.spec.kind]??0),0);
console.log(`// seed ${seed}: ${tree.nodes.length} nodes, ${tree.edges.length} links, cost ${cost}P`);
console.log('const ROWS=[\n '+rows.join('\n ')+'\n];');
