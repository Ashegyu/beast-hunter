// Optional presentation only. Simulation and save ownership stay in combat-skills.
export const ULTIMATE_VIDEO_WINDOW=1.35;
const NAMES=Object.freeze({bloodmoon:'적월난무',eclipse:'일섬 · 월식',phantoms:'월영군무'});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
export function validUltimateVideos(descriptors){
 if(!descriptors||typeof descriptors!=='object')return false;
 for(const id of Object.keys(NAMES)){const d=descriptors[id];if(!d||typeof d.src!=='string'||!/^ultimate-(bloodmoon|eclipse|phantoms)-v\d+\.mp4$/.test(d.src)||!d.src.startsWith('ultimate-'+id+'-')||!Number.isFinite(d.duration)||d.duration<.25||d.duration>5||!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<=0||d.height<=0||d.width*d.height>1280*720||!Number.isFinite(d.fps)||d.fps<12||d.fps>60)return false;}
 return true;
}
export function createUltimateVideoPlayer({createVideo,descriptors}={}){
 const records=new Map();let active=null,disposed=false;
 function pause(record){try{record.video.pause();}catch{}}
 function stop(){const old=active;active=null;if(old){old.wantPlaying=false;pause(old.record);}}
 function release(record){pause(record);try{record.video.removeEventListener?.('error',record.onError);record.video.removeAttribute?.('src');record.video.load?.();}catch{}}
 if(typeof createVideo==='function'&&validUltimateVideos(descriptors))for(const id of Object.keys(NAMES)){
  let video,record;
  try{
   video=createVideo();if(typeof video?.play!=='function'||typeof video?.pause!=='function')continue;
   record={id,video,descriptor:descriptors[id],broken:false,pending:false,onError:null};record.onError=()=>{record.broken=true;if(active?.record===record){active.failed=true;active.wantPlaying=false;}pause(record);};
   video.muted=true;video.defaultMuted=true;video.volume=0;video.playsInline=true;video.controls=false;video.loop=false;video.preload='auto';video.disablePictureInPicture=true;
   video.setAttribute?.('muted','');video.setAttribute?.('playsinline','');video.setAttribute?.('webkit-playsinline','');video.addEventListener?.('error',record.onError);video.src='assets/'+record.descriptor.src;records.set(id,record);video.load?.();
  }catch{records.delete(id);if(record)release(record);}
 }
 function play(run){
  const record=run.record,video=record.video;if(record.pending||run.failed||record.broken||!run.wantPlaying||video.ended&&video.currentTime>=record.descriptor.duration-1/record.descriptor.fps)return;
  if(video.paused===false)return;
  try{
   record.pending=true;const result=video.play();
   Promise.resolve(result).then(()=>{record.pending=false;const current=active;if(disposed||!current||current.record!==record||!current.wantPlaying||current.failed)pause(record);},error=>{record.pending=false;if(active===run){if(run.wantPlaying&&error?.name!=='AbortError'){run.failed=true;run.wantPlaying=false;}pause(record);}});
  }catch{record.pending=false;run.failed=true;run.wantPlaying=false;pause(record);}
 }
 function draw(ctx,s,viewport,reducedMotion=false){
  if(!ctx||!Number.isFinite(viewport?.width)||!Number.isFinite(viewport?.height)||viewport.width<=0||viewport.height<=0){stop();return false;}
  const r=s?.skillRuntime,p=r?.ultimatePresentation,time=s?.run?.time,elapsed=time-p?.startedAt;
  if(disposed||reducedMotion||!p||!NAMES[p.id]||s.phase!=='playing'||s.run?.flow==='stageClear'||!(s.player?.hp>0)||p.token!==r.token||!Number.isFinite(elapsed)||elapsed<0||elapsed>=ULTIMATE_VIDEO_WINDOW){stop();return false;}
  const record=records.get(p.id);if(!record||record.broken){stop();return false;}
  const video=record.video,d=record.descriptor;
  if(active?.presentation!==p){stop();active={presentation:p,record,wantPlaying:!s.paused,failed:false,aligned:false,lastSeek:-Infinity};}
  const run=active;if(run.failed)return false;run.wantPlaying=!s.paused;
  const desired=Math.min(d.duration-1/d.fps,elapsed*d.duration/ULTIMATE_VIDEO_WINDOW);
  try{
   video.playbackRate=clamp(d.duration/ULTIMATE_VIDEO_WINDOW,.25,4);
   if(video.readyState>=1&&!video.seeking&&(!run.aligned||Math.abs(video.currentTime-desired)>(s.paused?1/d.fps:.12)&&time-run.lastSeek>=.1)){
    video.currentTime=Math.max(0,desired);run.aligned=true;run.lastSeek=time;
   }
   if(s.paused)pause(record);else play(run);
  }catch{run.failed=true;run.wantPlaying=false;pause(record);return false;}
  if(run.failed||video.readyState<2||video.seeking||!s.paused&&video.paused&&!video.ended||!(video.videoWidth>0&&video.videoHeight>0))return false;
  const width=viewport?.width,height=viewport?.height;if(!ctx||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return false;
  const top=height>=300?70:height*.1,bottom=height>=300?100:height*.15,available=Math.max(1,height-top-bottom),scale=Math.min(Math.max(1,width-12)/video.videoWidth,available/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale,x=(width-w)/2,y=top+(available-h)/2,progress=elapsed/ULTIMATE_VIDEO_WINDOW,fade=Math.min(smooth(progress/.16),smooth((1-progress)/.22));
  ctx.save();try{
   ctx.globalAlpha=fade;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#100e1b';ctx.fillRect(0,top,width,available);ctx.drawImage(video,0,0,video.videoWidth,video.videoHeight,x,y,w,h);
   ctx.fillStyle='#fff1ee';ctx.font=`600 ${Math.max(14,Math.min(24,width*.055))}px "Hunter UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(NAMES[p.id],width/2,Math.min(height-12,y+h+30),Math.max(1,width-24));
  }catch{run.failed=true;run.wantPlaying=false;pause(record);return false;}finally{ctx.restore();}
  return true;
 }
 return {draw,stop,suspend(){if(active){active.wantPlaying=false;pause(active.record);}},dispose(){if(disposed)return;disposed=true;stop();for(const record of records.values())release(record);records.clear();}};
}
