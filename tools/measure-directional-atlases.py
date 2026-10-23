"""Read native RGBA pixels; emit atlas metadata. Never rewrites image pixels."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label, find_objects
import numpy as np
import json
root=Path(__file__).resolve().parents[1]/'dist/assets'
canonical=['s','se','e','ne','n']
specs=[('hunter_directions_walk-v04','hunter',4,False),('hunter_directions_attack-v04','hunter',4,True),('skitter_directions-v04','skitter',4,False),('bulwark_directions-v04','bulwark',6,False),('spitter_directions-v04','spitter',6,False)]
manifest=json.loads((root/'manifest.json').read_text());manifest['version']='0.6';manifest['directions']={};report={}
for name,actor,cols,is_attack in specs:
    rgba=np.array(Image.open(root/(name+'.png')));height,width=rgba.shape[:2];lab,_=label(rgba[:,:,3]>127);slices=find_objects(lab);sizes=np.bincount(lab.ravel())
    parts=[]
    for index,rect in enumerate(slices):
        if rect is None or sizes[index+1]<1000:continue
        parts.append({'rect':rect,'label':index+1,'bottom':rect[0].stop,'centerX':(rect[1].start+rect[1].stop)/2})
    if len(parts)!=cols*5:raise RuntimeError(f'{name}: {len(parts)} components, expected {cols*5}')
    parts.sort(key=lambda p:p['bottom']);rows=[sorted(parts[i*cols:(i+1)*cols],key=lambda p:p['centerX']) for i in range(5)]
    directions=manifest['directions'].setdefault(actor,{})
    for row,items in enumerate(rows):
        direction=canonical[row];measurements=[]
        for col,part in enumerate(items):
            by,bx=part['rect'];mask=lab[by,bx]==part['label'];pixels=rgba[by,bx,:3].astype(float);ys,xs=np.nonzero(mask)
            if actor=='hunter':
                # Teal head band gives anatomical head height even with an overhead sword.
                teal=mask&(pixels[:,:,1]>pixels[:,:,0]*1.5)&(pixels[:,:,2]>pixels[:,:,0]*1.8)&(pixels[:,:,1]>65)
                ty,tx=np.nonzero(teal);head=float(np.min(ty))-3 if len(ty) else 0
                high=teal&(np.indices(mask.shape)[0]<head+25);hy,hx=np.nonzero(high);headX=float(np.median(hx)) if len(hx) else float(np.median(xs))
                maximum=pixels.max(axis=2);minimum=pixels.min(axis=2);sat=(maximum-minimum)/np.maximum(1,maximum)
                gy,gx=np.indices(mask.shape)
                boots=mask&(gy>head+(mask.shape[0]-head)*.62)&(maximum<145)&(sat<.55)&(np.abs(gx-headX)<mask.shape[0]*.48)
                fy,fx=np.nonzero(boots);foot=float(np.quantile(fy,.995)) if len(fy) else mask.shape[0]-2
                low=boots&(gy>foot-24);ly,lx=np.nonzero(low);pivotX=float((np.quantile(lx,.08)+np.quantile(lx,.92))/2) if len(lx) else headX
                body=foot-head
            else:
                foot=float(np.quantile(ys,.985));pivotX=float((np.quantile(xs,.05)+np.quantile(xs,.95))/2);body=float(np.quantile(ys,.985)-np.quantile(ys,.015))
            measurements.append({'part':part,'pivotAbsX':bx.start+pivotX,'pivotAbsY':by.start+foot,'body':body,'column':col})
        # One scale for each direction/action. Weapon extension never resizes the body.
        reference=[measurements[0],measurements[3]] if actor=='hunter' and is_attack else measurements[:4]
        bodyHeight=round(float(np.median([m['body'] for m in reference])),2)
        pivotOffset=float(np.median([m['pivotAbsX']-m['column']*width/cols for m in reference]))
        groups=[('attack',measurements)] if is_attack else [('walk',measurements[:4])]+([('attack',measurements[4:])] if cols==6 else [])
        for action,subset in groups:
            clipId=f'{actor}_{action}_{direction}_v04';frames=[]
            for m in subset:
                by,bx=m['part']['rect'];x=max(0,bx.start-3);y=max(0,by.start-3);right=min(width,bx.stop+3);bottom=min(height,by.stop+3)
                pivotAbsX=m['column']*width/cols+pivotOffset
                frames.append({'x':x,'y':y,'w':right-x,'h':bottom-y,'pivotX':round(pivotAbsX-x,2),'pivotY':round(m['pivotAbsY']-y,2),'bodyHeight':bodyHeight})
            # The generated skitter east and front-diagonal rows face left; map them explicitly.
            baseFlip=(actor=='skitter' and row in (1,2)) or (actor=='bulwark' and row==1)
            manifest['clips'][clipId]={'id':clipId,'actor':actor,'name':f'{direction.upper()} {action}','image':name+'.png','fps':8,'loop':action=='walk','bodyHeight':bodyHeight,'flipX':baseFlip,'frames':frames}
            directions.setdefault(action,{})[direction]=clipId
        report[name+' '+direction]={'height':bodyHeight,'pivotOffset':round(pivotOffset,2),'feet':[round(m['pivotAbsY'],1) for m in measurements]}
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,indent=2))
