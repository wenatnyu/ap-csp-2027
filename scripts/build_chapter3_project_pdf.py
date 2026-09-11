from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from build_homework_pdf import register_fonts,para,PAGE_W,PAGE_H,CONTENT_W
ROOT=Path(__file__).resolve().parents[1];register_fonts()
p=ROOT/'output/pdf/AP_CSP_Chapter_3_Project_Sheet.pdf';p.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(p),pagesize=A4,pageCompression=1);c.setTitle('AP CSP Chapter 3 - Study Goal Tracker Project Record');c.setAuthor('Original classroom practice')
def title(part):
 y=para(c,'AP CSP | Chapter 3: Study Goal Tracker',42,PAGE_H-42,size=16,leading=21,bold=True)-5
 return para(c,part,42,y,size=11,leading=15,bold=True)-18

def text(s,y,bold=False):return para(c,s,42,y,size=10,leading=14,bold=bold)-9

def lines(y,n,gap=22):
 c.setStrokeColor(colors.HexColor('#bbbbbb'));c.setLineWidth(.35)
 for i in range(n):c.line(42,y-i*gap,PAGE_W-42,y-i*gap)
 return y-n*gap-10

def table(y,rows,widths,h=34):
 for i,row in enumerate(rows):
  x=42
  for v,w in zip(row,widths):
   c.setStrokeColor(colors.HexColor('#999999'));c.setLineWidth(.4);c.rect(x,y-h,w,h,fill=0,stroke=1);para(c,v,x+7,y-8,w-14,size=9,leading=12,bold=i==0);x+=w
  y-=h
 return y-15

def foot(n):
 c.setFont('CSP',8);c.setFillColor(colors.black);c.drawString(42,24,'Original classroom project | Practice before lists and custom procedures | Not formal Create');c.drawRightString(PAGE_W-42,24,f'{n} / 2')
y=title('Part A | Understand, plan and implement')
y=text('Name: __________________________  Partner: __________________  Date: __________',y)
y=text('Purpose: give feedback on three study sessions. Valid inputs: exactly three whole-number minute values, each from 0 to 180.',y)
y=text('Requirements',y,True)
y=text('For each session, display "Goal met" when minutes >= 30 and add one to goalHits; otherwise display "Keep going". After all three sessions, display goalHits, then "On track" if goalHits >= 2, or "Try again" otherwise.',y)
y=text('1. Identify the input, the two kinds of output, and the intended user.',y,True);y=lines(y-4,2)
y=text('2. Plan the program. State what must happen before, inside and after the loop.',y,True)
y=table(y,[['Phase','Actions and variables'],['Before the loop',''],['Inside each repetition',''],['After the loop','']],[120,CONTENT_W-120],40)
y=text('3. Write your pseudocode here or attach your saved code. Include assignment, selection and repetition.',y,True);y=lines(y-4,9,20)
assert y>42,y;foot(1);c.showPage()
y=title('Part B | Trace, test and revise')
y=text('4. Before running, predict the goal count and final feedback for each test. Then record the actual result.',y,True)
y=table(y,[['Three inputs','Expected count / final text','Actual count / final text'],['29, 30, 31','',''],['0, 0, 0','',''],['30, 30, 30','',''],['Your test:','','']],[115,198,CONTENT_W-313],44)
y=text('5. Trace the boundary test 29, 30, 31. Start with goalHits = 0.',y,True)
y=table(y,[['Input minutes','Condition >= 30','Message this time','goalHits after'],['29','','',''],['30','','',''],['31','','','']],[90,115,170,CONTENT_W-375],34)
y=text('6. Explain why the counter is initialized outside the loop and what goes wrong if it is reset inside.',y,True);y=lines(y-4,2)
y=text('7. Describe one bug or revision. Identify the earliest incorrect step and the test evidence after your change.',y,True);y=lines(y-4,2)
y=text('8. Extend the requirement: change the goal to 45 minutes. Give a new pair of boundary tests and the expected feedback.',y,True);y=lines(y-4,2)
assert y>42,y;foot(2);c.save();print(p)
