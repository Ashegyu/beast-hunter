// Alpha 0.144.7 전체 화면 자동 점검(사용자 요청 '화면별 검사를 하나로'): 검수 해상도 5개에서 메뉴 화면을 모두 돌며
// 화면 밖으로 나간 요소·부모 칸 밖으로 나간 요소·잘린 글자를 잰다. 0.142~0.144의 화면별 scratchpad 스크립트(sb/fb/dgchk/…)를 합친 것.
//
//   node tools/check-layout.mjs                      전체 점검, 기준 파일과 비교해 새 문제만 보고(새 문제가 있으면 종료 코드 1)
//   node tools/check-layout.mjs --update             현재 결과를 기준 파일(tools/reports/layout-baseline.json)로 저장
//   node tools/check-layout.mjs --sizes 844x390 --screens bag,craft --shots out/   일부만, 스크린샷 저장
//
// 검수 프로필은 엔진으로 직접 만든다(Lv.200·악몽 21장·승화 장비·고대·일반 장비·저장 프리셋 1개). 서버는 serve-local.mjs를 빈 포트로 띄운다.
// 판정: offscreen(뷰포트 밖), out(스크롤 없는 부모 칸 밖, absolute 제외), clip(글자가 칸을 넘음 — 말줄임 포함),
// overlap(서로 다른 요소의 글자가 겹침).
// 원화 아틀라스 <img>는 틀(overflow:hidden)이 잘라 보여 주는 게 정상이라 제외한다.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASELINE=path.join(ROOT,'tools/reports/layout-baseline.json');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1];};
const SIZES=(opt('sizes')??'568x320,667x375,844x390,900x405,915x412').split(',').map(s=>s.split('x').map(Number));
const ONLY=opt('screens')?.split(',')??null,SHOTS=opt('shots'),PORT=Number(opt('port')??8197);

// 화면: [이름, 거점에서 누를 버튼들]. 버튼은 순서대로 누른다.
const SCREENS=[
 ['home',[]],['map',['nav-hunt']],['equipment',['lobby-equipment']],['bag',['lobby-bag']],['bag-detail',['lobby-bag','bag-0']],
 ['bag-organize',['lobby-bag','bag-organize']],['bag-materials',['lobby-bag','bag-tab-materials']],
 ['skills',['lobby-skills']],['skills-branch',['lobby-skills','skill-view-branch']],['skills-settings',['lobby-skills','skill-tab-settings']],
 ['craft',['lobby-craft']],['craft-awaken',['lobby-craft','forge-mode-awaken']],
 ['dungeon-growth',['lobby-summon','dungeon-mode-growth']],['dungeon-tower',['lobby-summon','dungeon-mode-tower']],['dungeon-rift',['lobby-summon','dungeon-mode-rift']],
 ['dungeon-raid',['lobby-summon','dungeon-mode-raid']],['dungeon-rush',['lobby-summon','dungeon-mode-rush']],
 ['codex',['camp-codex']],['codex-materials',['camp-codex','codex-tab-materials']],
 ['growth-tree',['hub-growth','growth-tab-tree']],['growth-training',['hub-growth','growth-tab-training']],['growth-transcend',['hub-growth','growth-tab-transcend']],
];

async function profile(){
 const html=fs.readFileSync(path.join(ROOT,'dist/index.html'),'utf8'),v=html.match(/app\.js\?v=([\d.]+)/)?.[1];
 const g=await import(pathToFileURL(path.join(ROOT,'dist/game-engine.js'))+(v?'?v='+v:''));
 const L=await import(pathToFileURL(path.join(ROOT,'dist/loot.js'))+(v?'?v='+v:''));
 const {openMode}=await import(pathToFileURL(path.join(ROOT,'tests/mode-fixture.mjs')));
 const p=g.createProfile(1000);p.level=200;p.transcendXp=60000;openMode(g,p,2,21);p.gold=5e6;for(const m of g.MATERIALS)p.materials[m.id]=80;
 const s=g.createGame(p);s.phase='camp';let id=900;
 for(const [tier,slot,hunt] of [[1,'weapon',2],[2,'armor',1],[1,'charm',0],[3,'helmet',0],[2,'earring',2]]){const it=L.rollAncient({id:id++,tier,slot,hunt},.37,()=>.6);p.inventory.push(it);g.forgeAncient(s,it.id,g.FORGE_EFFECTS[slot][0].id);}
 for(const [tier,slot] of [[4,'boots'],[3,'weapon'],[5,'pants']])p.inventory.push(L.rollAncient({id:id++,tier,slot},.3,()=>.6));
 for(const r of g.ITEM_CATALOG.filter(r=>!r.set).slice(0,24))p.inventory.push({id:id++,catalogId:r.id,slot:r.slot,tier:r.tier,artId:r.artId,name:r.name,rarity:(id%4),affixes:{...r.base}});
 p.nextItemId=id;for(const it of [...p.inventory])try{g.equipItem(s,it.id);}catch{}
 g.saveBuild(s,0);return g.encodeProfile(p,1000);
}

function measure(){
 const out=[],rng=document.createRange(),vw=innerWidth,vh=innerHeight,root=document.getElementById('game-shell');
 // 접근성용으로 1px로 접거나 clip-path로 가린 요소(sr-only 등)와 그 자식은 보이지 않으므로 뺀다.
 const hiddenByClip=el=>{for(let x=el;x&&x!==root;x=x.parentElement){const c=getComputedStyle(x),b=x.getBoundingClientRect();if(c.clipPath&&c.clipPath!=='none'||b.width<=2||b.height<=2||x.classList.contains('sr-only'))return true;}return false;};
 const name=el=>{const own=el.id||(typeof el.className==='string'&&el.className.trim().split(/\s+/)[0]);if(own)return own;const p=el.closest('[id]');return (p?p.id+'>':'')+el.tagName.toLowerCase();};
 for(const el of root.querySelectorAll('*')){
  if(!el.offsetParent||el.closest('[hidden]')||el.closest('canvas'))continue;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0)continue;
  const r=el.getBoundingClientRect();if(r.width<=2||r.height<=2)continue;
  if(hiddenByClip(el))continue;
  let a=el.parentElement;while(a&&a!==root&&(getComputedStyle(a).overflow==='visible'||getComputedStyle(a).display==='contents'))a=a.parentElement;
  if(el.tagName==='IMG'&&a&&a!==root)continue;
  if(r.right>vw+2||r.bottom>vh+2||r.left<-2||r.top<-2){if(!(a&&a!==root))out.push('offscreen:'+name(el));continue;}
  const c=(a||root).getBoundingClientRect();
  if(cs.position!=='absolute'&&cs.position!=='fixed'&&(r.bottom>c.bottom+1||r.right>c.right+1))out.push('out:'+name(el));
  if(el.closest('[aria-hidden=true]')||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue; // 장식 글자(›, ✦ 등)는 aria-hidden
  rng.selectNodeContents(el);const t=rng.getBoundingClientRect(),lim=cs.overflow!=='visible'?r:c;
  if(t.bottom>lim.bottom+1.5||t.right>lim.right+1.5)out.push('clip:'+name(el));
 }
 // hidden 속성인데 보이는 요소: CSS의 display:…!important가 hidden을 이기는 함정(0.144.3 도감 재료 탭에서 고대 상세가 겹침).
 for(const el of root.querySelectorAll('[hidden]')){const r=el.getBoundingClientRect();if(r.width>2&&r.height>2&&getComputedStyle(el).display!=='none'&&!el.parentElement?.closest('[hidden]'))out.push('hidden-shown:'+name(el));}
 // 글자 겹침: 서로 다른 두 요소의 보이는 글자 상자가 겹치면 'overlap:a/b'(숨겨야 할 칸이 보이는 경우 등, 0.144.3 도감 재료 탭).
 const texts=[];
 for(const el of root.querySelectorAll('*')){
  if(texts.length>600)break;if(!el.offsetParent||el.closest('[hidden]')||el.closest('[aria-hidden=true]')||hiddenByClip(el))continue;
  const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  rng.selectNodeContents(el);const t=rng.getBoundingClientRect();let a=el.parentElement;while(a&&a!==root&&getComputedStyle(a).overflow==='visible')a=a.parentElement;
  const c=(a||root).getBoundingClientRect(),box={l:Math.max(t.left,c.left),t:Math.max(t.top,c.top),r:Math.min(t.right,c.right),b:Math.min(t.bottom,c.bottom)};
  if(box.r-box.l>2&&box.b-box.t>2)texts.push([el,box]);
 }
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const [x,a]=texts[i],[y,b]=texts[j];if(x.contains(y)||y.contains(x))continue;
  const w=Math.min(a.r,b.r)-Math.max(a.l,b.l),h=Math.min(a.b,b.b)-Math.max(a.t,b.t);if(w>3&&h>3)out.push('overlap:'+name(x)+'/'+name(y));}
 return [...new Set(out)].sort();
}

async function main(){
 const require=createRequire(import.meta.url);let chromium;
 try{({chromium}=require('playwright'));}catch{({chromium}=require('/opt/node22/lib/node_modules/playwright'));}
 const server=spawn(process.execPath,[path.join(ROOT,'serve-local.mjs')],{env:{...process.env,PORT:String(PORT)},stdio:'ignore'});
 try{
  for(let i=0;i<50;i++){try{await fetch(`http://127.0.0.1:${PORT}/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const saved=await profile(),browser=await chromium.launch(),result={},errors=[];
  for(const [w,h] of SIZES){
   const page=await browser.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:true});
   page.on('pageerror',e=>errors.push(`${w}x${h} ${e.message}`));
   await page.addInitScript(d=>{try{localStorage.setItem('beast-hunter:profile:v1',d);}catch{}},saved);
   for(const [screen,clicks] of SCREENS){
    if(ONLY&&!ONLY.includes(screen))continue;
    await page.goto(`http://127.0.0.1:${PORT}/`);await page.waitForFunction(()=>document.getElementById('game-shell')?.dataset.phase==='camp',null,{timeout:20000});await page.waitForTimeout(400);
    for(const id of clicks){await page.evaluate(id=>document.getElementById(id)?.click(),id);await page.waitForTimeout(350);}
    result[`${w}x${h} ${screen}`]=await page.evaluate(measure);
    if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,`${screen}-${w}.png`)});}
   }
   await page.close();
  }
  await browser.close();
  if(args.includes('--update')){fs.writeFileSync(BASELINE,JSON.stringify(result,null,1)+'\n');console.log('기준 저장:',path.relative(ROOT,BASELINE),Object.keys(result).length,'화면');return 0;}
  const base=fs.existsSync(BASELINE)?JSON.parse(fs.readFileSync(BASELINE,'utf8')):{};let fresh=0;
  for(const [key,issues] of Object.entries(result)){const known=new Set(base[key]??[]),added=issues.filter(i=>!known.has(i)),gone=(base[key]??[]).filter(i=>!issues.includes(i));
   if(added.length){fresh+=added.length;console.log('새 문제',key,added.join(' '));}if(gone.length)console.log('해결됨',key,gone.join(' '));}
  if(errors.length){console.log('페이지 오류',errors.slice(0,5));fresh+=errors.length;}
  console.log(fresh?`새 문제 ${fresh}개`:`새 문제 없음 (${Object.keys(result).length}화면)`);return fresh?1:0;
 }finally{server.kill();}
}
process.exit(await main());
