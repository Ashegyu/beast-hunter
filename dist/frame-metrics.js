// Bounded diagnostics: CPU work and rAF intervals are separate measurements.
const fields=['cpu','engine','draw','hud','storage','interval'];
export class FrameMetrics{
 constructor(size=120){this.size=size;this.samples=Object.fromEntries(fields.map(k=>[k,new Float64Array(size)]));this.reset();}
 reset(){this.count=0;this.total=0;this.hudFrames=0;this.drawFrames=0;this.enemies=0;this.effects=0;}
 add(row){
  for(const k of fields)this.samples[k][this.count]=Math.max(0,Number.isFinite(row[k])?row[k]:0);
  this.hudFrames+=row.hudRan?1:0;this.drawFrames+=row.drawRan?1:0;
  this.enemies=Math.max(this.enemies,row.enemies??0);this.effects=Math.max(this.effects,row.effects??0);this.count++;this.total++;
  if(this.count<this.size)return null;
  const result={samples:this.total,hudFrames:this.hudFrames,drawFrames:this.drawFrames,enemies:this.enemies,effects:this.effects};
  for(const k of fields){const sorted=this.samples[k].slice().sort();result[k+'P50']=sorted[Math.floor(this.size*.5)];result[k+'P95']=sorted[Math.ceil(this.size*.95)-1];result[k+'Max']=sorted[this.size-1];}
  this.count=0;this.hudFrames=0;this.drawFrames=0;this.enemies=0;this.effects=0;return result;
 }
}
