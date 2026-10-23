# Lossless asset packaging only; preserves every RGBA pixel.
from pathlib import Path
from PIL import Image
import shutil,json,hashlib
root=Path(__file__).resolve().parents[1];out=root/'art/monster-effects069';out.mkdir(exist_ok=True)
files={'forest':'exec-e2b812b4-de5e-480d-aba7-ab74e1ee1603.png','ruins':'exec-94f01122-aa4f-41b5-9881-704b56faea6d.png','frost':'exec-3f3b4426-c508-4423-b826-bf6834a0f9bd.png'}
mfile=root/'dist/assets/manifest.json';m=json.loads(mfile.read_text());m['monsterEffects']={};qa={}
for chapter,(key,name) in enumerate(files.items(),1):
 target=out/f'{key}-original.png'
 im=Image.open(target).convert('RGBA');w,h=im.size;runtime=root/f'dist/assets/monster-effects-{key}-v069.webp';im.save(runtime,'WEBP',lossless=True,exact=True,method=6)
 decoded=Image.open(runtime).convert('RGBA');assert decoded.tobytes()==im.tobytes()
 frames={};bounds=[]
 for row,kind in enumerate(['slash','bolt','impact','charge']):
  frames[kind]=[]
  for col in range(4):
   x=col*w//4;y=row*h//4;cw=(col+1)*w//4-x;ch=(row+1)*h//4-y
   pixels=im.load();px=cw*.5;py=ch*.5
   if kind=='bolt':
    # Place the luminous leading head at the physical projectile anchor.
    weighted=[]
    for yy in range(ch):
     for xx in range(cw):
      r,g,b,a=pixels[x+xx,y+yy];lum=(r+g+b)/3
      if xx>cw*.6 and a>48 and lum>170:weighted.append((xx,yy,(lum-160)*a*(xx/cw)**4))
    weight=sum(z[2] for z in weighted)
    if weight:px=sum(z[0]*z[2] for z in weighted)/weight;py=sum(z[1]*z[2] for z in weighted)/weight
   if kind=='impact':py=ch*.76
   f={'x':x,'y':y,'w':cw,'h':ch,'pivotX':round(px,2),'pivotY':round(py,2)};frames[kind].append(f)
   tile=im.crop((x,y,x+cw,y+ch));alpha=tile.getchannel('A');assert alpha.getbbox() is not None
   bounds.append({'kind':kind,'frame':col,'alphaBounds':alpha.getbbox(),'pivot':[f['pivotX'],f['pivotY']]})
 descriptor={'image':runtime.name,'width':w,'height':h,'frames':frames};m['monsterEffects'][str(chapter)]=descriptor
 hist=im.getchannel('A').histogram();qa[key]={'width':w,'height':h,'sourceSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'rgbaSha256':hashlib.sha256(im.tobytes()).hexdigest(),'runtimeBytes':runtime.stat().st_size,'transparentPixels':hist[0],'partialAlphaPixels':sum(hist[1:255]),'decodedBytes':w*h*4,'frames':bounds}
mfile.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(out/'qa.json').write_text(json.dumps(qa,indent=2)+'\n')
print(json.dumps({k:{q:v for q,v in d.items() if q not in ('frames','sourceSha256','rgbaSha256')}for k,d in qa.items()},indent=2))
