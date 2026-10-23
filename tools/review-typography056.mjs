// Offline glyph measurement and design review, not a browser/CSS screenshot.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {SKILL_CATALOG} from '../dist/combat-skills.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,GlobalFonts}=req('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('../art/typography056/',import.meta.url);
for(const [file,family]of [['IBMPlexSansKR-Regular','Hunter UI'],['IBMPlexSansKR-SemiBold','Hunter UI'],['GowunBatang-Bold','Hunter Title'],['Pretendard-Regular','Previous UI']])if(!GlobalFonts.registerFromPath(new URL('dist/assets/fonts/'+file+'.woff2',root).pathname,family))throw Error('Font registration failed: '+file);
const cv=createCanvas(960,800),c=cv.getContext('2d');
function wrap(text,width,font){c.font=font;const lines=[];let line='';for(const char of text){if(line&&c.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}if(line)lines.push(line);return lines;}
const measurements=[];
for(const width of [320,360,390])for(const d of SKILL_CATALOG){const box=width<=360?(width-48-14)/3:(width-48-21)/4,available=box-8,lines=wrap(d.name,available,'600 12px "Hunter UI"');for(const line of lines){c.font='600 12px "Hunter UI"';const measured=c.measureText(line).width;if(measured>available+.1)throw Error('Name exceeds available width');}measurements.push({viewport:width,id:d.id,available:+available.toFixed(1),nameLines:lines.length});}
for(const d of SKILL_CATALOG.filter(d=>d.kind==='ultimate')){const lines=wrap(d.name,64,'600 12px "Hunter UI"');if(lines.length>2)throw Error('Combat label exceeds two rows');}
c.fillStyle='#080f16';c.fillRect(0,0,960,800);
function text(t,x,y,font,color='#eee4d3'){c.font=font;c.fillStyle=color;c.fillText(t,x,y);}
function panel(x,title){c.fillStyle='#101d24';c.fillRect(x+12,70,296,710);c.strokeStyle='#b59a6355';c.strokeRect(x+12.5,70.5,295,709);text(title,x+28,43,'700 21px "Hunter Title"','#e6ca96');}
panel(0,'사냥꾼의 거점');panel(320,'스킬 · 빌드');panel(640,'인게임 HUD');
text('CHAPTER 01',30,117,'600 11px "Hunter UI"','#b9a175');text('붉은 숲',30,168,'700 34px "Hunter Title"');text('달빛을 따르는 사냥꾼, 리리안',30,204,'400 14px "Hunter UI"','#c0c9c6');
c.fillStyle='#612739';c.fillRect(30,239,260,60);text('사냥을 떠난다',83,277,'700 21px "Hunter Title"','#ffedc6');
for(const [i,t]of ['장비 · 수집','제작과 강화','사냥 기록'].entries()){c.strokeStyle='#b59a6344';c.strokeRect(30,329+i*66,260,52);text(t,47,362+i*66,'600 15px "Hunter UI"');}
text('기존',30,592,'400 12px "Hunter UI"','#9da8a8');text('사냥을 떠난다',30,628,'400 18px "Previous UI"');text('변경',30,684,'400 12px "Hunter UI"','#d4b987');text('사냥을 떠난다',30,726,'700 23px "Hunter Title"');
text('일섬·월식',350,123,'700 27px "Hunter Title"');text('궁극기 · 캐릭터 Lv.30 해금',350,153,'400 12px "Hunter UI"','#d5ba84');text('재사용 60초 · 기력 소모 없음',350,184,'600 13px "Hunter UI"','#e9cfa7');
const desc=SKILL_CATALOG.find(d=>d.id==='eclipse').description;for(const [i,line]of wrap(desc,250,'400 14px "Hunter UI"').entries())text(line,350,222+i*25,'400 14px "Hunter UI"','#c9d1cb');
const names=['월아참','흘려베기','일섬·월식','월영군무','남겨둔 여력','사냥꾼의 발걸음'];for(const [i,t]of names.entries()){const x=350+(i%3)*83,y=345+Math.floor(i/3)*126;c.fillStyle='#192931';c.fillRect(x,y,75,112);c.fillStyle='#9b687548';c.fillRect(x+13,y+10,49,49);for(const [n,line]of wrap(t,65,'600 12px "Hunter UI"').entries())text(line,x+6,y+80+n*18,'600 12px "Hunter UI"');}
text('숫자도 또렷하게',350,656,'700 20px "Hunter Title"');text('HP 1,240 / 1,580',350,693,'600 15px "Hunter UI"');text('520%  →  840%     60초',350,730,'600 15px "Hunter UI"','#ead09b');
text('리리안   Lv. 50',668,119,'600 14px "Hunter UI"');c.fillStyle='#994152';c.fillRect(668,138,263,9);text('사냥 진행 · 세 번째 물결',668,186,'600 14px "Hunter UI"','#d5ba84');text('갑각 파쇄',717,297,'600 25px "Hunter UI"','#ffe3a6');text('1,280!',735,345,'600 30px "Hunter UI"');
for(const [i,t]of ['월아참','흘려베기','일섬·월식'].entries()){const x=669+i*87;c.fillStyle='#17252d';c.fillRect(x,440,79,120);c.strokeStyle=i===2?'#c68c85':'#b59a6377';c.strokeRect(x+.5,440.5,78,119);c.fillStyle='#95697855';c.fillRect(x+15,449,48,48);for(const [n,line]of wrap(t,69,'600 12px "Hunter UI"').entries())text(line,x+7,520+n*18,'600 12px "Hunter UI"');text(i===2?'60초':'준비',x+24,552,'600 11px "Hunter UI"','#efc78c');}
text('오프라인 글꼴·크기 검토',668,700,'400 12px "Hunter UI"','#abb6b1');text('실제 브라우저 화면과는 다름',668,725,'400 12px "Hunter UI"','#abb6b1');
fs.writeFileSync(new URL('typography-review.png',out),cv.toBuffer('image/png'));
fs.writeFileSync(new URL('measurements.json',out),JSON.stringify({scope:'Native canvas glyph metrics; no CSS layout or real device assertion.',skillNameCases:measurements.length,maxNameLines:Math.max(...measurements.map(r=>r.nameLines)),measurements},null,2)+'\n');
console.log(JSON.stringify({skillNameCases:measurements.length,maxNameLines:Math.max(...measurements.map(r=>r.nameLines))}));
