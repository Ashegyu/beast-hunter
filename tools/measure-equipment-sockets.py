"""Read source pixels and inspected landmarks; write attachment metadata only."""
from pathlib import Path
from PIL import Image
import numpy as np
import json
import math
import hashlib

root = Path(__file__).resolve().parents[1]
assets = root / 'dist/assets'
path = assets/'manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
marks = json.loads((root/'tools/reports/equipment-socket-annotations.json').read_text())
images, sockets, rows = {}, {}, []
views_order = ['s','se','e','ne','n']
for action, views in manifest['directions']['hunter'].items():
    for view, clip_id in views.items():
        clip=manifest['clips'][clip_id]
        name=clip['image']
        if name not in images: images[name]=np.array(Image.open(assets/name).convert('RGBA'))
        sockets[clip_id]=[]
        assert len(marks[action][view])==len(clip['frames'])
        for index, f in enumerate(clip['frames']):
            rgba=images[name][f['y']:f['y']+f['h'], f['x']:f['x']+f['w']]
            rgb=rgba[:,:,:3].astype(float); r,g,b=rgb.transpose(2,0,1)
            yy,xx=np.indices(r.shape); mask=rgba[:,:,3]>127; bh=f['bodyHeight']
            hair=mask&(r>120)&(g>90)&(r>g*1.035)&(b>g*.94)
            hy,hx=np.nonzero(hair); top=float(hy.min()) if len(hy) else 0
            upper=hair&(yy<top+bh*.26); uy,ux=np.nonzero(upper)
            head_x=float(np.median(ux)) if len(ux) else f['pivotX']
            torso=mask&(yy>top+bh*.40)&(yy<top+bh*.63)&(np.abs(xx-head_x)<bh*.21)&(rgb.max(axis=2)<115)
            ty,tx=np.nonzero(torso); body_x=float(np.median(tx)) if len(tx)>15 else head_x
            p={'bodyX':(body_x-f['pivotX'])/bh,'bodyY':(top+bh*.51-f['pivotY'])/bh,'tilt':0,
               'side':.52 if view=='e' else .8 if view in ['se','ne'] else 1,'back':view in ['ne','n']}
            wide=action!='forehand'; scale=201.5/(240 if wide else 180)
            canvas_x=8+209.5*index+1
            canvas_y=54+(204.708333333333 if wide else 266.265625)*views_order.index(view)+1
            point=marks[action][view][index]
            p['weaponHidden']=point is None
            if point:
                hand=np.array([(point[0]-canvas_x)/scale-(120 if wide else 90),(point[1]-canvas_y)/scale-190])/150
                delta=np.array([point[2]-point[0],point[3]-point[1]])/(scale*150)
                p.update(handX=float(hand[0]),handY=float(hand[1]),angle=math.atan2(delta[1],delta[0]),bladeLength=float(np.linalg.norm(delta)))
            else: p.update(handX=0,handY=0,angle=0,bladeLength=.5)
            if action in ['death','finisher']:
                body=marks[action+'Body'][view][index]
                p['bodyX']=((body[0]-canvas_x)/scale-120)/150
                p['bodyY']=((body[1]-canvas_y)/scale-190)/150
                if action=='death':p['tilt']=[0,.32,.90,1.5][index]
            sockets[clip_id].append({k:round(v,5) if type(v) in [int,float] else v for k,v in p.items()})
            rows.append({'id':clip_id,'frame':index,'manuallyReviewed':True,'weaponOccluded':point is None})
manifest['equipmentSockets']=sockets
path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'frames':rows,'sourceHashes':{name:hashlib.sha256((assets/name).read_bytes()).hexdigest() for name in images},
        'scope':'Visually inspected hand/tip landmarks; source-pixel torso centroids; body height and pivots unchanged'}
(root/'tools/reports/equipment-sockets-alpha091.json').write_text(json.dumps(report,indent=2)+'\n')
print('Calibrated',len(rows),'reviewed frames; hidden blades:',sum(r['weaponOccluded'] for r in rows))
