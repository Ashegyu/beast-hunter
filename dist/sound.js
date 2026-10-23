const MASTER_GAIN=.16;
const DROP_CHIMES=Object.freeze([[440],[523,659],[587,740,880],[660,880,1100,1320],[698,880,1047,1397],[523,659,784,1047,1318,1568],[784,988,1175,1568,1976]].map(Object.freeze));
// Each cast has its own pitch/envelope; impacts still sound at actual contact.
const SKILL_SOUNDS=Object.freeze(Object.fromEntries(Object.entries({
 crescent:[3400,720,.12],gale:[4200,480,.10],dance:[2700,1100,.18],draw:[1700,320,.20],plunge:[1200,180,.22],
 parry:[880,1320,.10],echo:[2300,650,.16],triple:[3100,800,.13],seeking:[1100,1900,.12],returning:[2800,1400,.16],
 field:[620,930,.22],breach:[950,220,.18],gather:[1300,400,.20],stance:[440,660,.24],mark:[740,1110,.17],bloodblade:[330,495,.25],
 bloodmoon:[190,55,.30],eclipse:[1568,196,.34],phantoms:[523,784,.28]
}).map(([id,values])=>[id,Object.freeze(values)])));
// One lazy audio context; at most 10 live voices. Sound failures never block play.
export function createCombatAudio(contextFactory){
  let context=null,master=null,noise=null,muted=false,unavailable=false,resuming=null;
  const voices=[];
  function clear(){for(const voice of [...voices])voice.stop();}
  let desiredRunning=false;
  function reconcile(){
    if(!context||context.state==='closed')return Promise.resolve(false);
    if(resuming)return resuming;
    if((context.state==='running')===desiredRunning)return Promise.resolve(desiredRunning);
    resuming=(async()=>{
      // Only repeat if a new gesture changed the requested state while awaiting the browser.
      while(true){const requested=desiredRunning;await(requested?context.resume():context.suspend());if(requested===desiredRunning)break;}
      return desiredRunning&&context.state==='running'&&!muted;
    })().catch(()=>false).finally(()=>{resuming=null;});return resuming;
  }
  function mute(value){muted=!!value;if(master)master.gain.value=muted?0:MASTER_GAIN;if(muted){desiredRunning=false;clear();reconcile();}}
  function unlock(){
    if(muted||unavailable)return Promise.resolve(false);
    try{
      if(!context){context=contextFactory();if(!context){unavailable=true;return Promise.resolve(false);}master=context.createGain();master.gain.value=MASTER_GAIN;master.connect(context.destination);}
      desiredRunning=true;return reconcile();
    }catch{unavailable=true;clear();return Promise.resolve(false);}
  }
  function suspend(){desiredRunning=false;clear();reconcile();}
  function voice({noise:useNoise=false,type='triangle',frequency=440,end=frequency,duration=.1,gain=.25,delay=0,filter='lowpass'}){
    if(muted||!desiredRunning||!context||context.state!=='running')return;
    while(voices.length>=10)voices[0].stop();
    let source,envelope,shaper,entry;
    const cleanup=()=>{if(!entry)return;const index=voices.indexOf(entry);if(index>=0)voices.splice(index,1);for(const node of [source,envelope,shaper])try{node?.disconnect();}catch{}entry=null;};
    try{
      const time=context.currentTime+delay;
      envelope=context.createGain();envelope.gain.setValueAtTime(.0001,time);envelope.gain.exponentialRampToValueAtTime(gain,time+.004);envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);envelope.connect(master);
      if(useNoise){
        if(!noise){noise=context.createBuffer(1,Math.ceil(context.sampleRate*.4),context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
        source=context.createBufferSource();source.buffer=noise;shaper=context.createBiquadFilter();shaper.type=filter;shaper.frequency.setValueAtTime(frequency,time);shaper.frequency.exponentialRampToValueAtTime(Math.max(40,end),time+duration);source.connect(shaper);shaper.connect(envelope);
      }else{source=context.createOscillator();source.type=type;source.frequency.setValueAtTime(frequency,time);source.frequency.exponentialRampToValueAtTime(Math.max(25,end),time+duration);source.connect(envelope);}
      entry={stop(){try{source.stop();}catch{}cleanup();}};voices.push(entry);source.onended=cleanup;source.start(time);source.stop(time+duration+.01);
    }catch{try{source?.stop();}catch{}cleanup();for(const node of [source,envelope,shaper])try{node?.disconnect();}catch{}}
  }
  function play(type,details={}){
    if(muted||!desiredRunning||!context||context.state!=='running')return;
    if(type==='skillCast'){
      if(!Object.hasOwn(SKILL_SOUNDS,details.skillId))return;const spec=SKILL_SOUNDS[details.skillId];
      const [frequency,end,duration]=spec,tonal=['parry','seeking','field','stance','mark','bloodblade','phantoms'].includes(details.skillId),ultimate=['bloodmoon','eclipse','phantoms'].includes(details.skillId);
      voice({noise:!tonal,type:'triangle',frequency,end,duration,gain:ultimate?.24:.18,filter:'bandpass'});
      if(ultimate){voice({frequency:details.skillId==='eclipse'?98:details.skillId==='phantoms'?392:82,end:55,duration:.28,gain:.14});voice({frequency:details.skillId==='phantoms'?1047:784,end:1175,duration:.18,gain:.08,delay:.035});}
      else if(!tonal)voice({frequency:details.skillId==='plunge'||details.skillId==='breach'?100:180,end:60,duration:.08,gain:.09});
    }
    else if(type==='swing'){const combo=details.combo??1;voice({noise:true,frequency:combo===3?2100:combo===2?3100:3800,end:combo===3?450:combo===2?1200:900,duration:combo===3?.13:.09,gain:combo===3?.42:.35,filter:'bandpass'});if(combo===3)voice({frequency:120,end:45,duration:.13,gain:.16});}
    else if(type==='heavySwing'||type==='counterSlash'){voice({noise:true,frequency:2600,end:400,duration:.15,gain:.45});voice({frequency:140,end:45,duration:.18,gain:.2});}
    else if(type==='impact'){voice({noise:true,frequency:details.heavy?1000:1400,end:details.heavy?170:300,duration:details.heavy?.095:.055,gain:details.heavy?.42:.3});voice({frequency:details.heavy?95:160,end:details.heavy?35:55,duration:details.heavy?.12:.065,gain:details.heavy?.3:.2});}
    else if(type==='guardHit')voice({type:'square',frequency:330,end:180,duration:.065,gain:.09});
    else if(type==='guardBreak'||type==='explosion'){voice({noise:true,frequency:2300,end:100,duration:.28,gain:.6});voice({frequency:85,end:28,duration:.24,gain:.5});}
    else if(type==='perfectDodge'||type==='reflect'){voice({frequency:880,end:1100,duration:.09,gain:.3});voice({frequency:1320,duration:.13,gain:.2,delay:.065});}
    else if(type==='dash')voice({noise:true,frequency:2000,end:500,duration:.10,gain:.18,filter:'bandpass'});
    else if(type==='playerDamage')voice({type:'sawtooth',frequency:110,end:40,duration:.14,gain:.12});
    else if(type==='playerDeath'){voice({frequency:140,end:45,duration:.38,gain:.16});voice({noise:true,frequency:950,end:180,duration:.2,gain:.16});}
    else if(type==='skitterStrike')voice({noise:true,frequency:1900,end:650,duration:.055,gain:.18,filter:'bandpass'});
    else if(type==='skitterDeath'){voice({noise:true,frequency:1700,end:240,duration:.16,gain:.23});voice({frequency:100,end:35,duration:.12,gain:.12});}
    else if(type==='spit')voice({noise:true,frequency:900,end:1700,duration:.09,gain:.18,filter:'bandpass'});
    else if(type==='ancientSig'||type==='synergy'||type==='materialDrop'){const tone=Math.max(400,Math.min(1000,details.tone??600));voice({frequency:tone,end:tone*1.2,duration:.13,gain:.09});voice({frequency:tone*1.5,duration:.12,gain:.06,delay:.04});}
    else if(type==='unique'||type==='uniqueLink')voice({frequency:type==='uniqueLink'?980:440,end:type==='uniqueLink'?440:720,duration:.16,gain:.12});
    else if(type==='bossArrival'){voice({frequency:82,end:55,duration:.42,gain:.14});voice({frequency:220,end:330,duration:.24,gain:.07,delay:.12});}
    else if(type==='seal'){voice({frequency:440,end:660,duration:.16,gain:.08});voice({frequency:880,duration:.18,gain:.06,delay:.09});}
    else if(type==='gearDrop'){const rarity=Math.max(0,Math.min(6,details.rarity??0)),notes=DROP_CHIMES[rarity];for(const [i,frequency]of notes.entries())voice({frequency,duration:rarity>=3?.3:.16,gain:rarity>=3?.20:.12,delay:i*.07});if(details.perfect){voice({frequency:1760,end:2093,duration:.28,gain:.12,delay:.28});voice({frequency:2637,duration:.24,gain:.08,delay:.38});}}
    else if(type==='lootPickup'){const rarity=Math.max(0,Math.min(6,details.rarity??0));voice({frequency:rarity>=3?130:660,end:rarity>=3?75:1047,duration:.16,gain:.13});for(const [i,frequency]of (rarity>=3?[880,1318,1760,2093]:[1047,1568]).entries())voice({frequency,duration:.24,gain:.12,delay:.055+i*.06});if(details.perfect)voice({frequency:2637,duration:.3,gain:.08,delay:.27});}
    else if(type==='resourceCollect'){voice({frequency:details.kind==='gold'?1800:950,end:details.kind==='gold'?2400:1450,duration:.065,gain:.09});voice({frequency:details.kind==='gold'?2800:1900,duration:.06,gain:.045,delay:.035});}
    else if(type==='loot'||type==='levelUp'||type==='bossDeath'){for(const [i,frequency]of [523,659,784].entries())voice({frequency,duration:.2,gain:.18,delay:i*.065});}
  }
  return {unlock,suspend,mute,play,get activeVoices(){return voices.length;},get available(){return !unavailable;}};
}
