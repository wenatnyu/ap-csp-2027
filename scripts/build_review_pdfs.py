"""Print original review questions, English rationales and a private review record."""
from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,KeepTogether,PageBreak,Table,TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from build_homework_pdf import register_fonts,markup,para,PAGE_W,PAGE_H,CONTENT_W
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/pdf'
INK=colors.HexColor('#193148');LINE=colors.HexColor('#b6c3ce')
styles={
 'body':ParagraphStyle('review-body',fontName='CSP',fontSize=10,leading=14,textColor=INK,spaceAfter=7),
 'small':ParagraphStyle('review-small',fontName='CSP',fontSize=8.8,leading=12,textColor=INK,spaceAfter=7),
 'h1':ParagraphStyle('review-h1',fontName='CSP-Bold',fontSize=18,leading=23,textColor=INK,spaceAfter=14),
 'h2':ParagraphStyle('review-h2',fontName='CSP-Bold',fontSize=12,leading=16,textColor=INK,spaceAfter=9),
 'code':ParagraphStyle('review-code',fontName='CSP',fontSize=9.5,leading=12.5,textColor=INK,backColor=colors.HexColor('#eff3f6'),borderPadding=8,spaceBefore=7,spaceAfter=12),
 'option':ParagraphStyle('review-option',fontName='CSP',fontSize=9.7,leading=13,textColor=INK,leftIndent=10,spaceAfter=4),
}
def p(text,kind='body'):return Paragraph(markup(text),styles[kind])
def footer(c,doc):
 c.setStrokeColor(LINE);c.line(42,36,PAGE_W-42,36);c.setFont('CSP',7.5);c.setFillColor(INK)
 c.drawString(42,24,'AP CSP | Chapter 8 | Original practice, not an official exam paper')
 c.drawRightString(PAGE_W-42,24,f'Page {doc.page}')
def build(name,story,title):
 path=OUT/f'AP_CSP_Chapter_8_{name}.pdf'
 SimpleDocTemplate(str(path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=52,title=title,author='AP CSP classroom materials').build(story,onFirstPage=footer,onLaterPages=footer)
 print(path)
def questions(bank):
 byid={q['id']:q for q in bank['questions']};story=[]
 english={'diagnostic':'Diagnostic | 10 questions | Suggested time: 18 minutes','algorithms':'Algorithms | 10 questions | Suggested time: 20 minutes','mixed':'Mixed practice | 20 questions | Suggested time: 34 minutes'}
 for n,s in enumerate(bank['sets']):
  if n:story.append(PageBreak())
  story.extend([p('AP CSP | Chapter 8 Practice','h1'),p(english[s['id']],'h2'),p('All questions are original classroom practice. These short sets are not a full AP exam. Work without a calculator. The symbol ← means assignment; list indices start at 1. Select ONE answer unless a question says Select TWO. For this practice, a two-answer item counts correct only when both choices, and no others, are selected.','small'),p('Name / private identifier: ________________________    Date: ______________','small')])
  for qid in s['questionIds']:
   q=byid[qid];block=[p(qid+' | '+q['stem'])]
   if q.get('code'):block.append(p(q['code'],'code'))
   for i,opt in enumerate(q['options']):block.append(p(chr(65+i)+'. '+opt,'option'))
   block.extend([p('My selection: __________','small'),Spacer(1,9)])
   story.append(KeepTogether(block))
 build('Practice',story,'AP CSP Chapter 8 | 40 Original Practice Questions')
def answers(bank):
 byid={q['id']:q for q in bank['questions']};story=[]
 for n,s in enumerate(bank['sets']):
  if n:story.append(PageBreak())
  story.extend([p('AP CSP | Chapter 8 Answer Key','h1'),p(s['id'].title()+' | Original practice rationales','h2'),p('Use after completing the set. Each item is one practice count; no partial credit for selecting only one required answer in a two-answer item. These counts do not estimate an official AP score. The online review includes a Chinese explanation and a link to the relevant lesson.','small')])
  for qid in s['questionIds']:
   q=byid[qid];story.append(KeepTogether([p(qid+' | '+q['topic']+' | Answer: '+', '.join(chr(65+i) for i in q['answer']),'h2'),p(q['rationale']),p('Review: '+q['remediation']['label'],'small'),Spacer(1,8)]))
 build('Answer_Key',story,'AP CSP Chapter 8 | Original Practice Answer Key')
def record():
 path=OUT/'AP_CSP_Chapter_8_Review_Record.pdf';c=canvas.Canvas(str(path),pagesize=A4,pageCompression=1);c.setTitle('AP CSP Chapter 8 | Private Review Record');c.setAuthor('Original classroom support')
 def start(title):
  c.setFillColor(INK);c.rect(0,PAGE_H-20,PAGE_W,20,fill=1,stroke=0)
  y=para(c,'AP CSP | My Review Record',42,PAGE_H-42,size=18,leading=23,bold=True)-10
  return para(c,title,42,y,size=11,leading=15,bold=True)-15
 def text(t,y,bold=False):return para(c,t,42,y,size=10,leading=14,bold=bold)-10
 def lines(y,n,gap=21):
  c.setStrokeColor(LINE);c.setLineWidth(.4)
  for k in range(n):c.line(42,y-k*gap,PAGE_W-42,y-k*gap)
  return y-n*gap-9
 def table(rows,widths,y,height):
  for i,row in enumerate(rows):
   x=42
   for val,w in zip(row,widths):
    c.setFillColor(colors.HexColor('#edf3f7') if i==0 else colors.white);c.setStrokeColor(LINE);c.rect(x,y-height,w,height,fill=1,stroke=1)
    end=para(c,val,x+7,y-7,w-14,size=9,leading=12,bold=i==0);assert end>=y-height+3,(val,end)
    x+=w
   y-=height
  return y-15
 def end(y,num):
  assert y>60,y
  c.setStrokeColor(LINE);c.line(42,36,PAGE_W-42,36);c.setFont('CSP',7.5);c.setFillColor(INK);c.drawString(42,24,'Private classroom notes | Not a PPR, submission component or official score')
  c.drawRightString(PAGE_W-42,24,f'{num} / 2');c.showPage()
 y=start('Part A | MCQ error analysis and a specific next step')
 y=text('Date: ______________   Set: ______________   Correct / attempted: __________',y)
 y=text('Record the source: original diagnostic / original algorithms / official CED samples / original mixed. Keep official sample numbers distinct from Q01-Q40.',y)
 y=table([['Question / source','My error and the evidence I missed','Next lesson / retry date'],['','',''],['','',''],['','',''],['','','']],[95,250,CONTENT_W-345],y,61)
 y=text('Possible causes: concept gap; variable/list trace; missed condition; incomplete Select TWO; unsupported inference; guess. Identify the cause, not just the answer letter.',y)
 y=text('One corrected explanation in my own words',y,True);y=lines(y,4)
 y=text('A fresh case to try tomorrow, and how I will know my reasoning improved',y,True);y=lines(y,3)
 end(y,1)
 y=start('Part B | Official written-response review after the timed attempt')
 y=text('Year / Set: ____________________   Practice date: ____________________',y)
 y=text('Use your own suitable program and PPR. Once the formal Create task has begun, teacher feedback on either formal or practice written responses must wait until all three components are finalized. Keep program evidence private.',y)
 y=text('For 2026, review the four WR rows in the official Scoring Guidelines. Video and program requirements are separate rows. This sheet does not measure the full Create score.',y)
 y=table([['Prompt','What this prompt asks / my specific code evidence / explanation gap'],['1',''],['2(a)',''],['2(b)',''],['2(c)','']],[70,CONTENT_W-70],y,78)
 y=text('One writing target for the next complete 60-minute set',y,True);y=lines(y,3)
 y=text('Use the matching year and Set scoring guide after answering. A partial bullet is not an invented official half point. Read all conditions in the relevant scoring row.',y)
 c.setFont('CSP',8);c.setFillColor(INK);c.drawString(42,52,'2026 official questions and scoring guide: see Chapter_8_R04.html and Official_Exam_Resources.html')
 end(y,2);c.save();print(path)
if __name__=='__main__':
 register_fonts();OUT.mkdir(parents=True,exist_ok=True);bank=json.loads((ROOT/'review/questions.json').read_text());assert len(bank['questions'])==40
 questions(bank);answers(bank);record()
