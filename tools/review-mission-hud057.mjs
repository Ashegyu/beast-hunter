// Offline font + nine-slice review of the HUD panel. This is not browser layout QA.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {BATTLE_PLANS,HUNT_MODES} from '../dist/game-engine.js';
const req=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {createCanvas,loadImage,GlobalFonts}=req('@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=new URL('../art/mission057/',import.meta.url);
for(const name of ['Regular','SemiBold'])GlobalFonts.registerFromPath(new URL('dist/assets/fonts/IBMPlexSansKR-'+name+'.woff2',root).pathname,'Hunter UI');
const frame=await loadImage(new URL('dist/assets/combat-mission-v046.webp',root).pathname),cv=createCanvas(770,420),c=cv.getContext('2d');
function nine(x,y,w,h){const sx=[0,45,frame.width-45,frame.width],sy=[0,48,frame.height-48,frame.height],dx=[x,x+20,x+w-20,x+w],dy=[y,y+16,y+h-16,y+h];for(let i=0;i<3;i++)for(let j=0;j<3;j++)c.drawImage(frame,sx[i],sy[j],sx[i+1]-sx[i],sy[j+1]-sy[j],dx[i],dy[j],dx[i+1]-dx[i],dy[j+1]-dy[j]);}
function wrap(text,width,font){c.font=font;const lines=[];let line='';for(const word of text.split(' ')){const next=line?line+' '+word:word;if(line&&c.measureText(next).width>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
function layout(viewport,name,quest){const panel=viewport-24,inner=panel-52,captionWidth=inner;c.font='400 10px "Hunter UI"';const chapter='CHAPTER 03 · STAGE 5 / 5',wave='웨이브 3/3';const captionRows=c.measureText(chapter).width+12+c.measureText(wave).width>captionWidth?2:1;const title=wrap('3-5  '+name,inner,'600 13px "Hunter UI"'),progress=wrap(quest,inner,'400 12px "Hunter UI"');return {panel,inner,chapter,wave,captionRows,title,progress,height:32+6+captionRows*15.4+8+title.length*19.5+progress.length*18};}
const quests=['생존 18초 · 처치 999/999','웨이브 3 준비 · 2.5초','완료 · 다음 전투까지 2.5초','마지막 보스를 쓰러뜨려.'],rows=[];
for(const viewport of [320,360,390,480])for(const plan of BATTLE_PLANS)for(const mode of HUNT_MODES)for(const quest of quests){const name=plan.name+(mode.id?' · '+mode.name:''),l=layout(viewport,name,quest);for(const [lines,font]of [[l.title,'600 13px "Hunter UI"'],[l.progress,'400 12px "Hunter UI"']]){c.font=font;for(const t of lines)if(c.measureText(t).width>l.inner+.1)throw Error('Text exceeds panel');}rows.push({viewport,name,quest,height:l.height,titleRows:l.title.length,progressRows:l.progress.length});}
c.fillStyle='#0b141a';c.fillRect(0,0,770,420);
for(const [i,viewport]of [320,390].entries()){
 const x=i===0?15:355;c.font='600 14px "Hunter UI"';c.fillStyle='#ebd4a9';c.fillText(viewport+'px · 인게임 미션 영역',x+12,31);
 for(const [k,quest]of ['생존 18초 · 처치 999/999','완료 · 다음 전투까지 2.5초'].entries()){
  const l=layout(viewport,'수문장 공략 · 악몽',quest),y=51+k*165;nine(x,y,l.panel,l.height);let ty=y+19;
  c.font='400 10px "Hunter UI"';c.fillStyle='#b5baa9';c.fillText(l.chapter,x+26,ty+11);c.font='400 11px "Hunter UI"';c.fillStyle='#ddc291';c.fillText(l.wave,l.captionRows===2?x+26:x+l.panel-26-c.measureText(l.wave).width,ty+11+(l.captionRows-1)*15.4);ty+=l.captionRows*15.4+4;
  c.font='600 13px "Hunter UI"';c.fillStyle='#f1e0cd';for(const t of l.title){c.fillText(t,x+26,ty+14);ty+=19.5;}ty+=4;
  c.font='400 12px "Hunter UI"';c.fillStyle='#d3d4c6';for(const t of l.progress){c.fillText(t,x+26,ty+13);ty+=18;}
  c.fillStyle='#b2c6b6';c.fillText('↓ 보스 체력바·알림은 창 아래로 배치',x+12,y+l.height+28);
 }
}
c.font='400 11px "Hunter UI"';c.fillStyle='#a6b4b6';c.fillText('실제 글꼴·장식 이미지 기반 오프라인 조판 · 브라우저/CSS 화면 검증은 아님',26,402);
fs.writeFileSync(new URL('mission-panel-review.png',out),cv.toBuffer('image/png'));
fs.writeFileSync(new URL('measurements.json',out),JSON.stringify({scope:'Font and nine-slice measurements, not browser/CSS geometry.',cases:rows.length,maxHeight:Math.max(...rows.map(r=>r.height)),rows},null,2)+'\n');console.log(JSON.stringify({cases:rows.length,maxHeight:Math.max(...rows.map(r=>r.height))}));
