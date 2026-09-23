from bs4 import BeautifulSoup,Tag,NavigableString
import re,unicodedata

def math_text(n):
 if isinstance(n,NavigableString):return str(n).strip()
 cs=[c for c in n.children if isinstance(c,Tag) or str(c).strip()];vals=[math_text(c) for c in cs];t=n.name
 if t=='mfrac':return '\\frac{'+vals[0]+'}{'+vals[1]+'}'
 if t=='msup':return vals[0]+'^{'+vals[1]+'}'
 if t=='msub':return vals[0]+'_{'+vals[1]+'}'
 if t=='msqrt':return '\\sqrt{'+''.join(vals)+'}'
 if t=='mroot':return '\\sqrt['+vals[1]+']{'+vals[0]+'}'
 if t=='mfenced':return n.get('open','(')+','.join(vals)+n.get('close',')')
 if t=='mtr':return ' '.join(vals)+'; '
 if t=='mover':return ''.join(vals)
 return ''.join(vals)

def plain(html):
 soup=BeautifulSoup(html or '', 'html.parser')
 for t in soup.select('.sr-only'):t.decompose()
 for t in soup.find_all('img'):t.replace_with(' '+t.get('alt','')+' ')
 for t in soup.find_all('math'):t.replace_with(' $'+math_text(t)+'$ ')
 for t in soup.find_all('svg'):t.replace_with(' '+t.get('aria-label','')+' '+t.get_text(' ',strip=True)+' ')
 for t in soup.find_all('br'):t.replace_with('\n')
 for t in soup.find_all('li'):t.insert_before('\n• ');t.insert_after('\n')
 for t in soup.find_all(['p','div','tr']):t.insert_after('\n\n')
 return re.sub(r'[ \t]+',' ',soup.get_text()).strip()

def normalize(t):
 t=unicodedata.normalize('NFKD',t).lower();t=re.sub(r'<[^>]+>','',t)
 t=re.sub(r'\\(?:frac|sqrt|text|left|right|times|cdot|mathrm|overline|triangle|angle|circ)','',t)
 return re.sub(r'[^a-z0-9]','',t)

LEGACY_ANSWERS = {
 'fb58c0db':['1/6','.1666','.1667'], 'a391ed22':['5/2'], '8193e8cd':['1/5'],
 'd1b66ae6':['3/2'], '466b87e3':['1/2'], '40c09d66':['7/6','1.166','1.167'],
 'eeb4143c':['10/3','15/4','25/6','3.333','4.166','4.167'],
 'fcdf87b7':['0','3'], 'a4f61d75':['7','8','13'], '364a2d25':['8','9'], '97e50fa2':['2','8'],
}
def unified(q,id):
 if 'answer' not in q:return q
 a=q['answer'];r=a['rationale'];mc=a['style']=='Multiple Choice'
 if mc:answers=[a['correct_choice'].upper()] if a.get('correct_choice') else [re.search(r'Choice ([ABCD]) is (?:correct|the best answer)',plain(r))[1]]
 elif id in LEGACY_ANSWERS:answers=LEGACY_ANSWERS[id]
 else:
  text=plain(r);m=re.match(r'The correct answer is\s+(-?[\d,]+(?:\.\d+)?)\.',text)
  if not m:raise ValueError((id,text[:130]))
  answers=[m[1].replace(',','')]
 return dict(stem=q.get('prompt',q.get('body','')),stimulus=q.get('body','') if q.get('prompt') else '',rationale=r,type='mcq' if mc else 'spr',correct_answer=answers,
  answerOptions=[{'id':k.upper(),'content':v['body']} for k,v in a.get('choices',{}).items()])
