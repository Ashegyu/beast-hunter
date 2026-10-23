import test from 'node:test';
import assert from 'node:assert/strict';
import {createUltimateVideoPlayer,validUltimateVideos,ULTIMATE_VIDEO_WINDOW} from '../dist/ultimate-video.js';
const ids=['bloodmoon','eclipse','phantoms'];
const descriptors=Object.fromEntries(ids.map((id,i)=>[id,{src:`ultimate-${id}-v053.mp4`,width:960,height:540,duration:[2.7,1.8,1.1][i],fps:24}]));
class Video{
 constructor(){Object.assign(this,{readyState:2,videoWidth:960,videoHeight:540,currentTime:0,paused:true,seeking:false,ended:false,playCalls:0,pauseCalls:0,loads:0,listeners:new Map(),promises:[]});}
 setAttribute(){}removeAttribute(name){if(name==='src')this.src='';}addEventListener(name,fn){this.listeners.set(name,fn);}removeEventListener(name,fn){if(this.listeners.get(name)===fn)this.listeners.delete(name);}load(){this.loads++;}pause(){this.paused=true;this.pauseCalls++;}
 play(){this.playCalls++;this.paused=false;return this.playResult?this.playResult():Promise.resolve();}
 error(){this.listeners.get('error')?.();}
}
function fixture(){const videos=[],player=createUltimateVideoPlayer({descriptors,createVideo(){const video=new Video();videos.push(video);return video;}});return {player,videos};}
function state(id='bloodmoon'){return {phase:'playing',paused:false,player:{hp:100},run:{time:1.3,flow:'combat'},skillRuntime:{token:7,ultimatePresentation:{id,startedAt:1,token:7}}};}
function canvas(){const calls=[],stack=[],c={globalAlpha:.8,globalCompositeOperation:'source-over',fillStyle:'black',font:'x',textAlign:'left',textBaseline:'top',calls,save(){stack.push([this.globalAlpha,this.globalCompositeOperation,this.fillStyle,this.font,this.textAlign,this.textBaseline]);},restore(){[this.globalAlpha,this.globalCompositeOperation,this.fillStyle,this.font,this.textAlign,this.textBaseline]=stack.pop();},fillRect(){},fillText(){},drawImage(...args){calls.push(args);if(this.fail)throw Error('draw failure');}};return c;}
const viewport={width:320,height:640},flush=()=>Promise.resolve();
test('only three local validated video descriptors allocate resources; unsupported hosts stay optional',()=>{
 assert.equal(validUltimateVideos(descriptors),true);for(const mutate of [d=>delete d.eclipse,d=>d.eclipse.src='https://other/video.mp4',d=>d.phantoms.duration=NaN,d=>d.bloodmoon.width=1e9]){const d=structuredClone(descriptors);mutate(d);let calls=0;const player=createUltimateVideoPlayer({descriptors:d,createVideo(){calls++;}});assert.equal(calls,0);assert.equal(player.draw(canvas(),state(),viewport),false);player.dispose();}
 const unsupported=createUltimateVideoPlayer({descriptors,createVideo:()=>({})});assert.equal(unsupported.draw(canvas(),state(),viewport),false);
 const {player,videos}=fixture();assert.equal(videos.length,3);for(const v of videos){assert.equal(v.muted,true);assert.equal(v.playsInline,true);assert.equal(v.volume,0);assert.equal(v.loads,1);}player.dispose();for(const v of videos){assert.equal(v.src,'');assert.equal(v.listeners.size,0);}
});
test('each video uses the exact game clock, a single whole-frame draw and preserved canvas state',()=>{
 for(const [i,id]of ids.entries()){const {player,videos}=fixture(),s=state(id),c=canvas(),before=JSON.stringify(s);assert.equal(player.draw(c,s,viewport),true);assert.equal(JSON.stringify(s),before);const v=videos[i];assert.ok(Math.abs(v.currentTime-.3*descriptors[id].duration/ULTIMATE_VIDEO_WINDOW)<1e-8);assert.equal(v.playbackRate,descriptors[id].duration/ULTIMATE_VIDEO_WINDOW);assert.equal(c.calls.length,1);assert.equal(c.calls[0][0],v);assert.deepEqual(c.calls[0].slice(1,5),[0,0,960,540]);const [x,y,w,h]=c.calls[0].slice(5);assert.ok(x>=0&&x+w<=320&&y>=70&&y+h<=540);assert.equal(c.globalAlpha,.8);assert.equal(c.globalCompositeOperation,'source-over');player.dispose();}
});
test('pause and hidden-page suspension stop immediately; resume is game-time aligned without play storms',async()=>{
 const {player,videos}=fixture(),s=state(),v=videos[0];player.draw(canvas(),s,viewport);for(let i=0;i<50;i++)player.draw(canvas(),s,viewport);assert.equal(v.playCalls,1);await flush();s.paused=true;v.currentTime+=.3;player.draw(canvas(),s,viewport);assert.equal(v.paused,true);const position=v.currentTime;player.draw(canvas(),s,viewport);assert.equal(v.currentTime,position);player.suspend();assert.equal(v.paused,true);s.paused=false;player.draw(canvas(),s,viewport);assert.equal(v.playCalls,2);player.suspend();await flush();assert.equal(v.paused,true);player.dispose();
});
test('loading, seeking, blocked autoplay, decode errors and draw failures fall back without changing combat',async()=>{
 for(const mode of ['loading','seeking','reject','decode','draw']){const {player,videos}=fixture(),s=state(),before=JSON.stringify(s),v=videos[0],c=canvas();if(mode==='loading')v.readyState=0;if(mode==='seeking')v.seeking=true;if(mode==='reject')v.playResult=()=>Promise.reject(Error('NotAllowedError'));if(mode==='decode')v.error();if(mode==='draw')c.fail=true;player.draw(c,s,viewport);await flush();assert.equal(player.draw(c,s,viewport),false,mode);assert.equal(JSON.stringify(s),before);player.dispose();}
});
test('cancel, death, stage clear, reduced motion and expiry cannot be resurrected by a late play result',async()=>{
 for(const mutate of [s=>s.skillRuntime.ultimatePresentation=null,s=>s.skillRuntime.token++,s=>s.player.hp=0,s=>s.phase='camp',s=>s.run.flow='stageClear',s=>s.run.time=2.35]){const {player,videos}=fixture(),s=state(),v=videos[0];let resolve;v.playResult=()=>new Promise(r=>resolve=r);player.draw(canvas(),s,viewport);mutate(s);assert.equal(player.draw(canvas(),s,viewport),false);resolve();await flush();assert.equal(v.paused,true);player.dispose();}
 const {player,videos}=fixture();player.draw(canvas(),state(),viewport);assert.equal(player.draw(canvas(),state(),viewport,true),false);assert.equal(videos[0].paused,true);player.dispose();
});
test('stale play fulfillment or rejection never interrupts a newer cast using the same decoder',async()=>{
 const {player,videos}=fixture(),v=videos[0],pending=[];v.playResult=()=>new Promise((resolve,reject)=>pending.push({resolve,reject}));const first=state();player.draw(canvas(),first,viewport);player.stop();const second=state();second.run.time=2.1;second.skillRuntime.ultimatePresentation.startedAt=2;assert.equal(player.draw(canvas(),second,viewport),false);assert.equal(pending.length,1);pending[0].reject(Error('old rejection'));await flush();assert.equal(player.draw(canvas(),second,viewport),true);assert.equal(v.paused,false);pending[1].resolve();await flush();assert.equal(v.paused,false);player.dispose();assert.equal(player.draw(canvas(),second,viewport),false);
});

test('an indefinitely stalled decoder owns at most one play promise across rapid replacement casts',async()=>{
 const {player,videos}=fixture(),v=videos[0];let resolve;v.playResult=()=>new Promise(r=>resolve=r);
 for(let i=0;i<1000;i++){const s=state();s.run.time=i+1.1;s.skillRuntime.ultimatePresentation.startedAt=i+1;player.draw(canvas(),s,viewport);player.stop();}
 assert.equal(v.playCalls,1);player.dispose();resolve();await flush();assert.equal(v.paused,true);
});

test('pause-induced AbortError permits resume even when its rejection arrives after resume intent',async()=>{
 for(const resumeBeforeRejection of [false,true]){const {player,videos}=fixture(),s=state(),v=videos[0];let reject;v.playResult=()=>new Promise((_,r)=>reject=r);player.draw(canvas(),s,viewport);player.suspend();s.paused=true;player.draw(canvas(),s,viewport);if(resumeBeforeRejection){s.paused=false;player.draw(canvas(),s,viewport);}const error=Error('interrupted by pause');error.name='AbortError';reject(error);await flush();v.playResult=()=>Promise.resolve();s.paused=false;assert.equal(player.draw(canvas(),s,viewport),true);assert.equal(v.playCalls,2);await flush();assert.equal(v.paused,false);player.dispose();}
});
