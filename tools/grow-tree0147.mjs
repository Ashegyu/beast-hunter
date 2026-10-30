// Alpha 0.147.0 (사용자 요청 '성장 트리 가지를 더 다양하게, 대칭일 필요 없이 나뭇가지처럼 무작위로'):
// grows the 성장 트리 from a branch plan with a seeded random walk (angle jitter, uneven step lengths, forks at random
// spreads), rejects layouts whose nodes crowd (< MIN_GAP) or whose links cross, and prints the ROWS block for growth.js.
//   node tools/grow-tree0147.mjs [seed]   → prints `const ROWS=[…];` (paste into dist/growth.js between the markers)
// Node kinds: s = small (2P), n = notable (6P), k = keystone (10P). Themes give the bonus, the name and the icon.
const SEED=Number(process.argv[2]??1);
const W=600,H=240,CORE={x:300,y:128},MIN_GAP=19,PAD_X=16,PAD_Y=12;
// Screen furniture over the web (box units): 프리셋 (top left), 확대 (top right), 영역 이름표 (bottom left). Nodes stay out.
const KEEP_OUT=[[0,0,196,26],[516,0,600,26],[0,176,62,240]];
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
// A path is a list of nodes; {fork:[[angleOffset°, path], …]} splits it. Lengths and spreads differ on purpose.
const nn=k=>NAMED[k],F=(...arms)=>({fork:arms});
const PLAN={
 blade:{angle:180,path:[S('dmg'),nn('sharp'),F(
  [-38,[S('aspd'),S('aspd'),nn('haste'),F([-30,[S('fin'),S('fin'),nn('bloodmoon'),S('fin'),nn('frenzy')]],[22,[S('aspd'),S('crit')]])]],
  [6,[S('range'),nn('edge'),S('critd'),S('critd'),nn('vital'),F([-24,[S('crit'),S('crit'),nn('weak')]],[30,[S('dmg'),nn('soul')]])]],
  [44,[S('exec'),S('exec'),nn('executioner'),S('exec'),S('critd'),nn('behead')]])]},
 ward:{angle:-90,path:[S('hp'),nn('body'),F(
  [-62,[S('red'),nn('wall'),F([-20,[S('guard'),S('guard'),nn('unbroken')]],[40,[S('red'),nn('fortress')]])]],
  [8,[S('hp'),nn('oath')]],
  [64,[S('regen'),S('regen'),nn('regrow'),S('drain'),S('drain'),nn('thirst'),S('drain'),nn('ghoul')]])]},
 art:{angle:0,path:[S('stam'),nn('cycle'),F(
  [-46,[S('cd'),S('cd'),nn('quick'),F([-18,[S('area'),S('area'),nn('wide'),nn('overload')]],[34,[S('stam'),S('cd')]])]],
  [14,[S('sdmg'),nn('flowing'),S('sdmg'),S('sdmg'),nn('might'),F([-26,[S('sdmg'),nn('artsoul'),nn('oneness')]],[28,[S('fury'),S('fury'),nn('chain')]])]],
  [58,[S('area'),S('stam')]])]},
 ab:{angle:90,path:[S('speed'),nn('gale'),F([-58,[S('speed'),nn('dash'),S('critspeed')]],[52,[S('speed'),nn('afterimage'),S('sdmg')]])]},
};
// Ring around the core (fixed, so every region starts next to the 중심).
const RING={blade:{x:270,y:128},ward:{x:300,y:103},art:{x:330,y:128},ab:{x:300,y:153}};
const RING_BONUS={blade:{damagePct:.025},ward:{hpPct:.025},art:{staminaRegen:.05},ab:{speed:.025}};
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function grow(seed){
 const rnd=mulberry(seed),nodes=[],edges=[],count={};
 const add=(region,spec,x,y,from)=>{const n=(count[region]=(count[region]??0)+1),id=region+'-'+n;nodes.push({id,region,spec,x,y});if(from)edges.push([from,id]);return id;};
 nodes.push({id:'core',region:'core',spec:{kind:'core'},x:CORE.x,y:CORE.y});
 const ringIds={};for(const r of Object.keys(RING)){const id=r+'-r';nodes.push({id,region:r,spec:{kind:'s',bonus:RING_BONUS[r]},x:RING[r].x,y:RING[r].y});edges.push(['core',id]);ringIds[r]=id;}
 edges.push(['blade-r','ward-r'],['ward-r','art-r'],['blade-r','ab-r'],['art-r','ab-r']);
 const walk=(region,path,fromId,x,y,angle)=>{
  for(const step of path){
   if(step.fork){for(const [off,arm] of step.fork)if(!walk(region,arm,fromId,x,y,angle+off+(rnd()-.5)*16))return false;return true;}
   // Jittered candidates; the one farthest from every placed node wins (keeps the walk random but uncrowded). Candidates
   // outside the box or crossing a placed link are dropped; when the near ones are all crowded the walk may bend up to ±100°.
   let best=null;const from=nodes.find(n=>n.id===fromId);
   for(let k=0;k<48;k++){if(k===8&&best&&best.room>=MIN_GAP+3)break;const spread=k<8?44:200,a=angle+(rnd()-.5)*spread,len=(step.kind==='s'?22:27)+rnd()*7;
    const nx=x+Math.cos(a*Math.PI/180)*len,ny=y+Math.sin(a*Math.PI/180)*len;
    if(nx<PAD_X||nx>W-PAD_X||ny<PAD_Y||ny>H-PAD_Y||blocked(nx,ny))continue;
    const me={x:nx,y:ny};if(edges.some(([p,q])=>p!==fromId&&q!==fromId&&cross(from,me,nodes.find(n=>n.id===p),nodes.find(n=>n.id===q))))continue;
    let room=Infinity;for(const o of nodes)room=Math.min(room,Math.hypot(o.x-nx,o.y-ny));
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
 for(const [name,ra,rb,small,notable] of [['bw','blade','ward','bw','fighter'],['wa','ward','art','wa','calm']]){const c=closest(ra,rb,66);if(!c||c.d>130)return null;
  const p1={x:c.a.x+(c.b.x-c.a.x)/3,y:c.a.y+(c.b.y-c.a.y)/3},p2={x:c.a.x+(c.b.x-c.a.x)*2/3,y:c.a.y+(c.b.y-c.a.y)*2/3};
  const i1=add(name,S(small),Math.round(p1.x+(rnd()-.5)*6),Math.round(p1.y+(rnd()-.5)*6),c.a.id),i2=add(name,nn(notable),Math.round(p2.x+(rnd()-.5)*6),Math.round(p2.y+(rnd()-.5)*6),i1);edges.push([i2,c.b.id]);}
 for(const r of ['blade','art']){const c=closest('ab',r);if(c&&c.d<75)edges.push([c.a.id,c.b.id]);}
 return {nodes,edges,by};
}
const cross=(p,q,r,s)=>{const d=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);return d(p,q,r)*d(p,q,s)<0&&d(r,s,p)*d(r,s,q)<0;};
function valid(t){
 if(!t)return false;const {nodes,edges,by}=t;
 if(nodes.some(n=>blocked(n.x,n.y)))return false;
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(Math.hypot(nodes[i].x-nodes[j].x,nodes[i].y-nodes[j].y)<MIN_GAP)return false;
 for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const [a,b]=edges[i],[c,d]=edges[j];if(new Set([a,b,c,d]).size<4)continue;if(cross(by(a),by(b),by(c),by(d)))return false;}
 // No link may pass right over a third node.
 for(const [a,b] of edges){const p=by(a),q=by(b);for(const n of nodes){if(n.id===a||n.id===b)continue;const L=Math.hypot(q.x-p.x,q.y-p.y),u=((n.x-p.x)*(q.x-p.x)+(n.y-p.y)*(q.y-p.y))/(L*L);if(u<=0||u>=1)continue;if(Math.abs((q.x-p.x)*(n.y-p.y)-(q.y-p.y)*(n.x-p.x))/L<12)return false;}}
 return true;
}
let tree=null,seed=SEED;for(;seed<SEED+20000;seed++){const t=grow(seed);if(valid(t)){tree=t;break;}}
if(!tree)throw new Error('no valid layout');
const KIND={s:'small',n:'notable',k:'keystone',core:'core'};
const links=id=>tree.edges.filter(([,b])=>b===id).map(([a])=>a).concat(tree.edges.filter(([a,b])=>a===id&&b.endsWith('-r')&&false).map(([,b])=>b));
const fmt=v=>JSON.stringify(v).replace(/"([a-zA-Z]+)":/g,'$1:').replace(/0\./g,'.').replace(/"/g,"'");
const rows=tree.nodes.map(n=>{const s=n.spec,bonus=s.bonus??SMALL[s.t]??{},kind=KIND[s.kind];
 return `['${n.id}','${kind}',${n.x},${n.y},${fmt(links(n.id))},${fmt(bonus)}${s.name?`,'${s.name}'`:kind!=='core'?',null':",'중심'"}${s.icon?`,'${s.icon}'`:''}],`;});
const cost=tree.nodes.reduce((a,n)=>a+({s:2,n:6,k:10}[n.spec.kind]??0),0);
console.log(`// seed ${seed}: ${tree.nodes.length} nodes, ${tree.edges.length} links, cost ${cost}P`);
console.log('const ROWS=[\n '+rows.join('\n ')+'\n];');
