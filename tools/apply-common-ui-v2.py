from html.parser import HTMLParser
from pathlib import Path
import re,json
p=Path('dist/index.html');s=p.read_text();changes=[];mapping=[]
void={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
panels={'armory-bag','skill-library','archive-gallery','craft-material-section','dungeon-entry','backup-panel','growth-progress','result-growth','result-report','build-card','synergy-panel','dungeon-reward-preview','tracking-summary'}
panelids={'bag-detail','skill-detail','codex-detail','item-workshop','craft-detail','track-detail','tactics-detail'}
tabparents={'skill-tabs','armory-categories','craft-categories','archive-categories','stage-tabs','dashboard-tabs','inventory-tabs','map-difficulty-modes'}
class P(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=False);self.stack=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs);cl=set(d.get('class','').split());id=d.get('id','');parent=self.stack[-1] if self.stack else {};pc=set(parent.get('class','').split());skin=None
  if id in panelids or cl&panels:skin='panel'
  if cl&{'skill-presets','skill-research'}:skin='panel'
  if cl&{'skill-card','codex-card','dungeon-card','craft-material-card'}:skin='card'
  if cl&{'bag-tile','equipped-slot'} or id.startswith('craft-recipe-'):skin='slot'
  if tag=='button':
   if pc&tabparents or id.startswith(('skill-tab-','codex-tab-','craft-category-','bag-category-')):skin='tab'
   elif ('image-button' in cl or id in {'skill-upgrade','skill-study','craft-submit','dungeon-enter','workshop-enhance','workshop-promote','bag-equip','bag-salvage','start'}):skin='primary' if ('image-button-primary' in cl or id in {'skill-upgrade','craft-submit','dungeon-enter','workshop-enhance','workshop-promote','start'}) else 'button'
   elif pc&{'skill-detail-actions','backup-actions'} or id.startswith(('skill-preset-save','skill-preset-load','skill-example')):skin='button'
  raw=self.get_starttag_text();new=raw
  if skin:
   # Preserve geometry, text, IDs, events and art; replace decoration only.
   new=new[:-1]+' data-common-skin="'+skin+'"'+new[-1:]
   style='background:transparent!important;background-image:none!important;border:0!important;border-image:none!important;box-shadow:none!important;'
   m=re.search(r'\bstyle="([^"]*)"',new)
   if m:new=new[:m.start()]+ 'style="'+m.group(1)+';'+style+'"'+new[m.end():]
   else:new=new[:-1]+' style="'+style+'"'+new[-1:]
   mapping.append({'id':id,'class':d.get('class',''),'skin':skin})
  if id=='nav-home':pass
  if new!=raw:changes.append((raw,new))
  if tag not in void:self.stack.append(d|{'_tag':tag})
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i]['_tag']==tag:self.stack=self.stack[:i];break
P().feed(s)
for a,b in changes:s=s.replace(a,b,1)
s=s.replace('assets/menu-common-v0961/home.svg','assets/common-ui-v2/independent_icons/home_filled.png').replace('assets/menu-common-v0961/more.svg','assets/common-ui-v2/independent_icons/navigation_more.png')
s=s.replace('0.101.0','0.102.0').replace('</head>','<link rel="stylesheet" href="common-ui-v2.css?v=0.102.0"></head>')
p.write_text(s)
Path('tools/reports/common-ui-v2/component-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2))
print('Applied skins:',len(mapping))
