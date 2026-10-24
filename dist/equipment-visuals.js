import { equipmentArt, EQUIPMENT_ART } from './chapters.js?v=0.105.0';
import { ANCIENT_CATALOG, ancientDefinition, CRAFTED_CATALOG, craftedDefinition } from './loot.js?v=0.99.0';

export function validEquipmentSocket(p){
  return !!p && ['handX','handY','angle','bodyX','bodyY','tilt','side','bladeLength'].every(k=>Number.isFinite(p[k])) && Math.abs(p.handX)<=1.5 && Math.abs(p.handY)<=1.5 && Math.abs(p.bodyX)<=1.5 && Math.abs(p.bodyY)<=1.5 && p.side>0 && p.side<=1 && p.bladeLength>0 && p.bladeLength<=1.2 && typeof p.back==='boolean' && typeof p.weaponHidden==='boolean';
}

export const EQUIPMENT_GRADES=Object.freeze({
 3:Object.freeze({name:'전설',key:'sun',color:'#ffc76d',accent:'#fff0ba'}),
 4:Object.freeze({name:'신화',key:'thorn',color:'#fa829f',accent:'#cf8cff'}),
 5:Object.freeze({name:'고대',key:'ancient',color:'#fff0bf',accent:'#c6a2ff'}),
 6:Object.freeze({name:'고유',key:'crafted',color:'#8ffff1',accent:'#ffd8ec'}),
});
const CRAFTED_DESIGNS=new Map(CRAFTED_CATALOG.map(row=>[row.id,Object.freeze({...equipmentArt(row),rarity:6,craftId:row.id,rune:row.signature.index,color:row.signature.color,fxStyle:7,name:'고유 '+row.name})]));
const SLOTS=Object.freeze(['weapon','armor','charm']);
const GRADE_DESIGNS=new Map(EQUIPMENT_ART.flatMap(base=>[0,1,2,3,4].map(rarity=>[base.id+':'+rarity,Object.freeze({...base,rarity,name:(EQUIPMENT_GRADES[rarity]?.name?EQUIPMENT_GRADES[rarity].name+' ':'')+base.name})])));
const ANCIENT_DESIGNS=new Map(ANCIENT_CATALOG.map(row=>[row.id,Object.freeze({...equipmentArt(row),rarity:5,variant:row.id,rune:row.signature.index,color:row.signature.color,fxStyle:row.visualStyle,name:'고대 '+row.name})]));
const ATTACK_STYLES=Object.freeze({...EQUIPMENT_GRADES,5:Object.freeze({color:'#8ff8ed',accent:'#e7ffff'}),6:EQUIPMENT_GRADES[5],7:EQUIPMENT_GRADES[6]});
export function visualDesign(item){const base=equipmentArt(item);if(!base)return null;const crafted=craftedDefinition(item);if(crafted)return CRAFTED_DESIGNS.get(crafted.id);const ancient=ancientDefinition(item);return ancient?ANCIENT_DESIGNS.get(ancient.id):GRADE_DESIGNS.get(base.id+':'+item?.rarity)??base;}
export function equippedDesigns(profile){
 const result={weapon:null,armor:null,charm:null};for(const item of profile.inventory)if(Object.hasOwn(result,item.slot)&&profile.equipment[item.slot]===item.id)result[item.slot]=visualDesign(item);return result;
}
export function snapshotDesigns(items){const result={weapon:null,armor:null,charm:null};for(const slot of SLOTS)if(items?.[slot])result[slot]=visualDesign(items[slot]);return result;}
export function gearFrame(atlas,design,rarityAtlas=null){if(design?.variant&&rarityAtlas){const frame=rarityAtlas.frames[rarityAtlas.designIds.indexOf(design.variant)];if(frame)return{frame,image:rarityAtlas.image,variant:true};}const frame=atlas.frames[atlas.designIds.indexOf(design?.id)];return{frame,image:atlas.image,variant:false};}
export function validRarityAtlas(atlas){
 if(!atlas||typeof atlas.image!=='string'||!Array.isArray(atlas.designIds)||atlas.designIds.length!==ANCIENT_CATALOG.filter(r=>!r.signatureOnly).length||new Set(atlas.designIds).size!==ANCIENT_CATALOG.filter(r=>!r.signatureOnly).length||!Array.isArray(atlas.frames)||atlas.frames.length!==ANCIENT_CATALOG.filter(r=>!r.signatureOnly).length)return false;
 for(const row of ANCIENT_CATALOG.filter(r=>!r.signatureOnly)){const f=atlas.frames[atlas.designIds.indexOf(row.id)];if(!f||!['x','y','w','h'].every(k=>Number.isFinite(f[k]))||f.x<0||f.y<0||f.w<=0||f.h<=0)return false;if(row.slot==='weapon'&&(!['gripX','gripY','tipX','tipY'].every(k=>Number.isFinite(f[k]))||f.gripX<0||f.gripX>=f.w||f.gripY<0||f.gripY>=f.h||f.tipX<0||f.tipX>=f.w||f.tipY<0||f.tipY>=f.h||Math.hypot(f.tipX-f.gripX,f.tipY-f.gripY)<f.h*.3))return false;}return true;
}
export function highestVisualGrade(designs){let rank=0;for(const slot of SLOTS)rank=Math.max(rank,designs[slot]?.rarity??0);return rank;}
function diamond(ctx,x,y,r,color){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.stroke();}
export function drawEquipmentAura(ctx,designs,x,y,height,alpha,time=0){
 const weapon=designs.weapon,rank=weapon?.rarity??0,grade=EQUIPMENT_GRADES[rank];if(!grade)return;ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha*.36;ctx.strokeStyle=grade.color;ctx.lineWidth=1.5;
 ctx.beginPath();ctx.ellipse(0,0,height*(rank>=5?.24:.19),height*.07,0,0,Math.PI*2);ctx.stroke();
 if(rank===4){ctx.beginPath();ctx.ellipse(0,0,height*.16,height*.07,Math.sin(time*.5)*.3,0,Math.PI*2);ctx.stroke();}
 if(rank===6&&weapon.craftId)drawAncientRune(ctx,weapon.rune,-height*.18,-height*.75,height*.07,weapon.color,time);
 if(rank===5){for(let i=0;i<4;i++){const angle=time*.7+i*Math.PI/2;diamond(ctx,Math.cos(angle)*height*.22,-height*.48+Math.sin(angle)*height*.07,height*.025,i%2?grade.accent:grade.color);}ctx.strokeStyle=grade.accent;ctx.beginPath();ctx.ellipse(0,-height*.77,height*.17,height*.085,0,0,Math.PI*2);ctx.stroke();diamond(ctx,0,-height*.90,height*.035,grade.color);}
 ctx.restore();
}
// Attack geometry is cosmetic. It consumes no RNG and uses the committed equipment snapshot.
export function drawEquipmentAttack(ctx,designs,swing,presentation,x,y){
 const weapon=designs.weapon,rank=weapon?.fxStyle??weapon?.rarity??0,grade=ATTACK_STYLES[rank];if(!grade)return;
 const t=presentation.t,fade=1-t,finisher=presentation.motion==='finisher';ctx.save();ctx.translate(x,y-30);ctx.rotate(Math.atan2(swing.y,swing.x));ctx.scale(1,presentation.flipY??1);ctx.globalAlpha=fade*.6;ctx.lineWidth=rank>=5?3:2;
 if(grade){ctx.strokeStyle=grade.color;const reach=finisher?125:105;
  if(rank===3){ctx.beginPath();ctx.moveTo(20,-45*fade);ctx.lineTo(reach,-20);ctx.lineTo(reach+12,5);ctx.lineTo(35,38*fade);ctx.stroke();diamond(ctx,reach,0,8,grade.accent);}
  else if(rank===4){for(let i=0;i<2;i++){ctx.strokeStyle=i?grade.accent:grade.color;ctx.beginPath();ctx.moveTo(25,-55+i*12);ctx.lineTo(reach+i*7,-25+i*16);ctx.lineTo(reach-15,12+i*18);ctx.lineTo(32,42+i*8);ctx.stroke();}}
  else if(rank===5){for(const side of [-1,1]){ctx.strokeStyle=side===1?grade.color:grade.accent;ctx.beginPath();ctx.moveTo(20,side*28);ctx.lineTo(reach+12,side*12);ctx.lineTo(reach+30,0);ctx.stroke();}for(let i=0;i<3;i++)diamond(ctx,70+i*27+t*25,(i-1)*19,6,grade.color);}
  else{for(let i=0;i<3;i++){ctx.strokeStyle=i===1?grade.accent:grade.color;ctx.beginPath();ctx.moveTo(15,-40+i*40);ctx.lineTo(reach+28,(-20+i*20)*fade);ctx.stroke();}for(let i=0;i<4;i++)diamond(ctx,55+i*24,(i%2?1:-1)*(13+t*20),5+i%2,grade.color);}
 }
 if(weapon?.variant||weapon?.craftId){drawAncientRune(ctx,weapon.rune,85,0,12+finisher*5,weapon.color,t);}
 ctx.restore();
}

export function maskOriginalWeapon(ctx,pose,x,y,height,mirror){
  if(pose.weaponHidden)return;
  const dx=Math.cos(pose.angle),dy=Math.sin(pose.angle),radius=.045;
  const start=.08,end=(pose.bladeLength??.58)+.035;
  ctx.translate(x,y);ctx.scale(mirror*height,height);
  ctx.beginPath();ctx.rect(-3,-3,6,6);
  ctx.moveTo(pose.handX+dx*start-dy*radius,pose.handY+dy*start+dx*radius);
  ctx.lineTo(pose.handX+dx*end-dy*radius,pose.handY+dy*end+dx*radius);
  ctx.lineTo(pose.handX+dx*end+dy*radius,pose.handY+dy*end-dx*radius);
  ctx.lineTo(pose.handX+dx*start+dy*radius,pose.handY+dy*start-dx*radius);
  ctx.closePath();ctx.clip('evenodd');
  ctx.scale(mirror/height,1/height);ctx.translate(-x,-y);
}

// Equipment shares loaded base/grade atlases; the render loop creates no image buffers.
// Only the weapon changes character composition. All slot designs remain available
// for inventory icons; armor/charm stats and active combat effects live in the engine.
// The caller refreshes appearance after equipment changes or once per committed swing.
export function drawEquipment(ctx,image,atlas,designs,pose,x,y,height,mirror,alpha,layer='front',rarityAssets=null){
  if(!image||layer==='back'||!designs.weapon||pose.weaponHidden)return;
  ctx.save();ctx.translate(x,y);ctx.scale(mirror*height,height);ctx.globalAlpha=alpha;
  const source=gearFrame(atlas,designs.weapon,rarityAssets?.atlas),frame=source.frame;
  ctx.save();ctx.translate(pose.handX,pose.handY);
  if(source.variant){const dx=frame.tipX-frame.gripX,dy=frame.tipY-frame.gripY,scale=(pose.bladeLength??.58)/Math.hypot(dx,dy);ctx.rotate(pose.angle-Math.atan2(dy,dx));ctx.drawImage(rarityAssets.image,frame.x,frame.y,frame.w,frame.h,-frame.gripX*scale,-frame.gripY*scale,frame.w*scale,frame.h*scale);}
  else{ctx.rotate(pose.angle+.98);const scale=Math.max(.65,Math.min(1.45,(pose.bladeLength??.58)/.585));ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-.22*.44*scale,-.82*.60*scale,.44*scale,.60*scale);}
  if(designs.weapon.craftId){ctx.strokeStyle=designs.weapon.color;ctx.lineWidth=.012;ctx.beginPath();ctx.moveTo(-.03,-.4);ctx.lineTo(.035,-.56);ctx.lineTo(.06,-.42);ctx.stroke();drawAncientRune(ctx,designs.weapon.rune,0,-.24,.055,designs.weapon.color,0,.012);}
  ctx.restore();
  ctx.restore();
}

export function drawEquipmentPreview(ctx,bodyImage,clip,gearImage,atlas,designs,width,height,socket,rarityAssets=null){
  const frame=clip.frames[0],bodyHeight=height*.78,scale=bodyHeight/frame.bodyHeight;
  const x=width/2,y=height*.94,pose=socket;
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  drawEquipmentAura(ctx,designs,x,y,bodyHeight,1,0);drawEquipment(ctx,gearImage,atlas,designs,pose,x,y,bodyHeight,1,1,'back',rarityAssets);
  ctx.save();if(designs.weapon)maskOriginalWeapon(ctx,pose,x,y,bodyHeight,1);
  ctx.drawImage(bodyImage,frame.x,frame.y,frame.w,frame.h,x-frame.pivotX*scale,y-frame.pivotY*scale,frame.w*scale,frame.h*scale);
  ctx.restore();
  drawEquipment(ctx,gearImage,atlas,designs,pose,x,y,bodyHeight,1,1,'front',rarityAssets);
}

// A bounded, item-specific rune is deterministic and consumes no combat state.
export function drawAncientRune(ctx,index,x,y,r,color,time=0,strokeWidth=2){
 const sides=3+index%5,step=1+(Math.floor(index/5)%2),turn=(Math.floor(index/10)%6)*Math.PI/6+time*.35;
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.lineWidth=strokeWidth;ctx.beginPath();
 for(let n=0;n<=sides;n++){const a=turn+n*step*Math.PI*2/sides,px=Math.cos(a)*r,py=Math.sin(a)*r*.65;if(n===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
 for(let n=0;n<1+Math.floor(index/30);n++)diamond(ctx,0,0,r*(.35+n*.2),color);
 ctx.restore();
}
