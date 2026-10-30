import { VIEWPORT } from './world.js?v=0.147.4';

// Landscape camera shows 50% more world in each direction; HUD and raster DPI stay unchanged.
export function viewportFor(width,height){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return {...VIEWPORT};
  const logicalWidth=height>width?Math.min(720,1600*width/height):1800;
  const w=Math.max(2,Math.round(logicalWidth/2)*2);
  return {width:w,height:Math.max(2,Math.round(w*height/width))};
}

// Camera units never depend on DPI. Only the raster surface follows display pixels.
// Bound memory/fill cost on tall phones, high-DPI monitors and malformed geometry.
export function renderSurfaceFor(width,height,pixelRatio=1){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return {...VIEWPORT};
  const dpr=Number.isFinite(pixelRatio)&&pixelRatio>0?Math.min(2,pixelRatio):1;
  const scale=Math.min(dpr,4096/Math.max(width,height),Math.sqrt(2097152/width/height));
  return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))};
}

export function stickVector(clientX,clientY,box){
  const dx=clientX-box.left-box.width/2,dy=clientY-box.top-box.height/2;
  const distance=Math.hypot(dx,dy),radius=Math.min(box.width,box.height)*.3;
  if(!Number.isFinite(distance)||radius<=0||distance<9)return {x:0,y:0,thumbX:0,thumbY:0};
  const reach=Math.min(radius,distance);
  return {x:dx/distance,y:dy/distance,thumbX:dx/distance*reach,thumbY:dy/distance*reach};
}

// Keep offscreen markers inside even the shortest wide viewport.
export function guidePointFor(point,viewport){
 const {width,height}=viewport,insetX=Math.min(45,width/4),top=Math.min(width<=720?300:140,height*.3),bottom=Math.min(width<=720?320:135,height*.3);
 return {x:Math.max(insetX,Math.min(width-insetX,point.x)),y:Math.max(top,Math.min(height-bottom,point.y))};
}

export function supportsLandscape(width,height){
 return Number.isFinite(width)&&Number.isFinite(height)&&width>=560&&height>=320&&width>height;
}
