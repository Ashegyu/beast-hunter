"""Pack generated transparent sprites; preserve originals and document measured hand anchors."""
from pathlib import Path
from PIL import Image
import numpy as np,json,shutil,hashlib,sys
root=Path(__file__).resolve().parents[1];data=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
assets=root/'dist/assets';source=root/'art/equipment-source-originals';source.mkdir(exist_ok=True,parents=True);prompts=assets/'prompts';prompts.mkdir(exist_ok=True)
output=root.parents[1]/'outputs';delivery=output/'rarity-equipment-v017';delivery.mkdir(exist_ok=True)
keys=['legend','myth','ultra','extreme'];grips=[(214,627),(163,566),(215,558),(245,580)]
cell=320;canvas=Image.new('RGBA',(cell*3,cell*4));frames=[];ids=[];records=[]
def components(mask):
 parent=[];runs=[];previous=[]
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for y,row in enumerate(mask):
  edges=np.flatnonzero(np.diff(np.concatenate(([False],row,[False]))));current=[];j=0
  for a,b in zip(edges[::2],edges[1::2]):
   a,b=int(a),int(b);id=len(parent);parent.append(id)
   while j<len(previous) and previous[j][1]<=a:j+=1
   k=j
   while k<len(previous) and previous[k][0]<b:
    parent[find(id)]=find(previous[k][2]);k+=1
   current.append((a,b,id));runs.append((y,a,b,id))
  previous=current
 groups={}
 for y,a,b,id in runs:
  id=find(id);g=groups.setdefault(id,{'area':0,'bbox':[a,y,b,y+1],'runs':[]});g['area']+=b-a;g['runs'].append((y,a,b));box=g['bbox'];box[0]=min(box[0],a);box[1]=min(box[1],y);box[2]=max(box[2],b);box[3]=max(box[3],y+1)
 majors=sorted(groups.values(),key=lambda g:g['area'],reverse=True)[:3];majors.sort(key=lambda g:g['bbox'][0]);assert len(majors)==3 and all(g['area']>10000 for g in majors)
 for g in list(groups.values()):
  if any(g is m for m in majors):continue
  box=g['bbox'];cx,cy=(box[0]+box[2])/2,(box[1]+box[3])/2
  def distance(m):
   x0,y0,x1,y1=m['bbox'];return max(x0-cx,0,cx-x1)**2+max(y0-cy,0,cy-y1)**2
  nearest=min(majors,key=distance);nearest['runs']+=g['runs'];a=nearest['bbox'];a[0]=min(a[0],box[0]);a[1]=min(a[1],box[1]);a[2]=max(a[2],box[2]);a[3]=max(a[3],box[3])
 return majors
for row,(key,path,prompt) in enumerate(zip(keys,data['paths'],data['prompts'])):
 original=Image.open(path).convert('RGBA');pixels=np.array(original);assert (pixels[:,:,3]==0).mean()>.3 and pixels[0,0,3]==0
 name=f'equipment-{key}-v017.png';shutil.copyfile(path,source/name);shutil.copyfile(path,delivery/name);(prompts/f'equipment-{key}-v017.prompt.txt').write_text(prompt,encoding='utf-8')
 groups=components(pixels[:,:,3]>0);coverage=0
 for column,(slot,g) in enumerate(zip(['weapon','armor','charm'],groups)):
  x0,y0,x1,y1=g['bbox'];isolated=np.zeros_like(pixels)
  for y,a,b in g['runs']:isolated[y,a:b]=pixels[y,a:b];coverage+=b-a
  crop=Image.fromarray(isolated[y0:y1,x0:x1]);scale=min(288/crop.width,288/crop.height);w,h=max(1,round(crop.width*scale)),max(1,round(crop.height*scale));sprite=crop.resize((w,h),Image.Resampling.NEAREST);x=column*cell+(cell-w)//2;y=row*cell+(cell-h)//2;canvas.alpha_composite(sprite,(x,y))
  frame={'x':x,'y':y,'w':w,'h':h,'pivotX':w/2,'pivotY':h,'duration':1}
  if slot=='weapon':
   gx,gy=grips[row];assert isolated[gy,gx,3]>128,(key,'grip not on opaque sprite',gx,gy)
   py,px=np.where(isolated[:,:,3]>128);best=np.argmax(px-py);tx,ty=int(px[best]),int(py[best]);frame.update(gripX=(gx-x0)*w/crop.width,gripY=(gy-y0)*h/crop.height,tipX=(tx-x0)*w/crop.width,tipY=(ty-y0)*h/crop.height)
  frames.append(frame);ids.append(f'{row+3}-{slot}');records.append({'grade':key,'slot':slot,'sourceRect':g['bbox'],'sourceRGBAsha256':hashlib.sha256(crop.tobytes()).hexdigest(),'frame':frame,'opaqueGripChecked':slot=='weapon'})
 assert coverage==int((pixels[:,:,3]>0).sum()),(key,'lost source alpha components')
 print(key,[(g['area'],g['bbox']) for g in groups],flush=True)
png=assets/'equipment-rarities-v017.png';webp=assets/'equipment-rarities-v017.webp';canvas.save(png);canvas.save(webp,format='WEBP',lossless=True,exact=True,method=4)
assert Image.open(webp).convert('RGBA').tobytes()==canvas.tobytes();shutil.copyfile(png,delivery/png.name)
manifest_path=assets/'manifest.json';manifest=json.loads(manifest_path.read_text(encoding='utf-8'));manifest['equipmentRarities']={'id':'equipment_rarities_v017','actor':'equipment','name':'equipment_rarities','image':png.name,'fps':1,'loop':False,'frames':frames,'designIds':ids};manifest['delivery'][png.name]=webp.name;manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'atlasSize':canvas.size,'rgbaBytes':canvas.width*canvas.height*4,'pngBytes':png.stat().st_size,'webpBytes':webp.stat().st_size,'rgbaEqual':True,'sprites':records,'scope':'12 new silhouettes, 4 grades x 3 slots; original source retained; technical alpha-component packing and nearest-neighbor scale only'};(root/'tools/reports/equipment-rarities-alpha017.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(output/'등급별-장비-제작-프롬프트.txt').write_text('Built-in image_gen 사용. 기존 장비 아틀라스를 스타일/방향 참고로 사용.\n최종 어셋: '+str(delivery)+'\n\n'+'\n\n---\n\n'.join(data['prompts']),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='sprites'}),flush=True)
