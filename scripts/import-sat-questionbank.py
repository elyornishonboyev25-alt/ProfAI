"""Build reviewed SAT mocks from the supplied PDF inventory and official source cache.

Requires BeautifulSoup4 and Pillow. The reviewed inventory preserves PDF pages,
deduplication decisions, reserves, and final question positions.
The cache stays outside git. See src/data/sat/QUESTION_BANK_SOURCE.md.
"""
from __future__ import annotations
import argparse,base64,hashlib,io,json,re
from pathlib import Path
from bs4 import BeautifulSoup,Tag
from PIL import Image
from lib.sat_questionbank import plain,unified

ROOT=Path(__file__).resolve().parents[1]
DIFFICULTY={'Easy':0,'Medium':1,'Hard':2}

class Builder:
 def __init__(self,cache,verify=False):
  self.cache=cache.resolve();self.verify=verify
  if not self.cache.is_relative_to(ROOT):raise ValueError('Keep the source cache inside the current workspace.')
  self.assets=ROOT/'public/sat/question-bank'
  self.ledger=json.loads((ROOT/'src/data/sat/questionBankInventory.json').read_text())
  self.rows={r['sourceId']:r for r in self.ledger}

 def asset(self,content,extension):
  name=hashlib.sha256(content).hexdigest()[:24]+'.'+extension
  path=self.assets/name
  if not path.exists():
   if self.verify:raise ValueError('Missing asset: '+name)
   path.write_bytes(content)
  return '/sat/question-bank/'+name

 def html(self,raw):
  soup=BeautifulSoup(raw or '', 'html.parser')
  for tag in soup.select('.sr-only'):tag.decompose()
  for svg in soup.find_all('svg'):
   raw=str(svg)
   for low,proper in {'viewbox':'viewBox','preserveaspectratio':'preserveAspectRatio','clippath':'clipPath','lineargradient':'linearGradient','radialgradient':'radialGradient','gradientunits':'gradientUnits','markerwidth':'markerWidth','markerheight':'markerHeight','patternunits':'patternUnits','patterntransform':'patternTransform','refx':'refX','refy':'refY','textlength':'textLength','lengthadjust':'lengthAdjust','clippathunits':'clipPathUnits','patterncontentunits':'patternContentUnits','markerunits':'markerUnits','gradienttransform':'gradientTransform'}.items():
    raw=re.sub(r'(?<=[\s</])'+low+r'(?=[\s=>])',proper,raw)
   assert not re.search(r'<(?:script|foreignObject)|\bon\w+\s*=|(?:href|src)=["\'](?:https?:|javascript:)|@import|url\(["\']?https?:',raw,re.I)
   if 'xmlns=' not in raw:raw=raw.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"',1)
   image=soup.new_tag('img',src=self.asset(raw.encode(),'svg'),alt=svg.get('aria-label') or svg.get_text(' ',strip=True)[:800] or 'Question diagram')
   svg.replace_with(image)
  for img in soup.find_all('img'):
   src=img.get('src','')
   if src.startswith('data:image/png;base64,'):
    content=base64.b64decode(src.split(',',1)[1]);img['src']=self.asset(content,'png')
    if img.get('role')=='math':img['class']=['math-img'];im=Image.open(io.BytesIO(content));img['width']=str(im.width);img['height']=str(im.height)
   assert img['src'].startswith('/sat/question-bank/'),img['src'][:100]
  # mfenced is no longer implemented by Chromium; spell out its MathML fences.
  for fenced in list(soup.find_all('mfenced')):
   row=soup.new_tag('mrow');op=soup.new_tag('mo');op.string=fenced.get('open','(');row.append(op)
   children=[c for c in list(fenced.children) if isinstance(c,Tag) or str(c).strip()]
   separators=fenced.get('separators',',').replace(' ','')
   for i,child in enumerate(children):
    if i and separators:
     sep=soup.new_tag('mo');sep.string=separators[min(i-1,len(separators)-1)];row.append(sep)
    row.append(child.extract())
   cl=soup.new_tag('mo');cl.string=fenced.get('close',')');row.append(cl);fenced.replace_with(row)
  for tag in list(soup.find_all()):
   if tag.name=='style':tag.decompose();continue
   if tag.name=='span' and ('italic' in tag.get('class',[]) or 'font-style: italic' in tag.get('style','')):tag.name='em'
   if tag.name=='span' and 'underline' in tag.get('style',''):tag.name='u'
   if tag.name=='math' and tag.get('alttext'):tag['aria-label']=tag['alttext']
   keep={'class','src','alt','role','width','height','display','aria-label','rowspan','colspan','scope','mathvariant','stretchy','fence','separator','accent','accentunder','linethickness','columnalign','rowspacing','columnspacing','notation','encoding','span'}
   for attr in list(tag.attrs):
    if attr not in keep:del tag[attr]
   if tag.name not in ['img','div']:tag.attrs.pop('class',None)
   if tag.name=='div':tag.attrs.pop('class',None)
   if tag.name in ['ul','ol'] and not tag.get_text(strip=True):tag.decompose()
  for table in soup.find_all('table'):
   wrapper=soup.new_tag('div');wrapper['class']='sat-source-table';table.wrap(wrapper)
  return re.sub(r'>\s+<','><',str(soup)).strip()

 def content(self,official):
  context=self.html(official.get('stimulus',''));task=self.html(official.get('stem',''))
  if not context:
   s=BeautifulSoup(task,'html.parser');parts=[p for p in s.contents if isinstance(p,Tag)]
   if len(parts)>1 and parts[-1].name=='p':context=''.join(str(p) for p in parts[:-1]);task=str(parts[-1])
  return context,task

 def question(self,q,module_id,number,mock_id):
  official=unified(json.loads((self.cache/'official'/(q['sourceId']+'.json')).read_text()),q['sourceId'])
  answers=official['correct_answer'];assert answers
  context,task=self.content(official)
  choices=[{'key':chr(65+i),'text':plain(a['content']),'html':self.html(a['content'])} for i,a in enumerate(official.get('answerOptions',[]))]
  if official['type']=='spr':choices=[]
  result=dict(id=f'{module_id}-{number}',moduleId=module_id,number=number,section='math' if module_id.startswith('math') else 'reading-writing',
   kind='student-response' if official['type']=='spr' else 'multiple-choice',correctAnswer=answers[0],prompt=re.sub(r'\n{3,}', '\n\n', plain(official.get('stimulus','')+'\n\n'+official.get('stem',''))),choices=choices,
   domain=q['domain'],skill=q['skill'],difficulty=['Foundation','Medium','Advanced'][DIFFICULTY[q['difficulty']]],asset='',assetWidth=0,assetHeight=0,
   explanation=plain(official['rationale']),sourceQuestionId=q['sourceId'],sourceContent=dict(context=context,task=task,explanation=self.html(official['rationale'])))
  if result['kind']=='student-response':result['acceptedAnswers']=answers
  else:assert len(choices)==4 and result['correctAnswer'] in 'ABCD',q['sourceId']
  self.rows[q['sourceId']].update(status='assigned',mockId=mock_id,moduleId=module_id,number=number)
  return result

 def build(self):
  # Replay the reviewed ledger. Never silently renumber published questions.
  rows=[r for r in self.ledger if r['status']=='assigned']
  order=['rw1','rw2','math1','math2']
  rows.sort(key=lambda r:(r['mockId'],order.index(r['moduleId']),r['number']))
  tests=[]
  for mock_id in range(10,41):
   questions=[self.question(r,r['moduleId'],r['number'],mock_id) for r in rows if r['mockId']==mock_id]
   assert len(questions)==98
   tests.append(dict(mockId=mock_id,questions=questions))
  math9=[self.question(r,'math2',r['number'],9) for r in rows if r['mockId']==9]
  assert len(math9)==22
  data=dict(tests=tests,test9Math2=math9)
  out=ROOT/'src/data/sat/questionBankMocks.json'
  if self.verify:
   existing=json.loads(out.read_text())
   assert data==existing, 'Rebuilt source differs from committed content; inspect the difference before changing anything.'
   print('All 3060 questions exactly match the official source cache and reviewed allocation.')
  else:
   out.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
   print('Rebuilt 31 full mocks and Test 9 Math Module 2 from the reviewed allocation.')

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--cache',required=True,type=Path);parser.add_argument('--verify',action='store_true');args=parser.parse_args();Builder(args.cache,args.verify).build()
