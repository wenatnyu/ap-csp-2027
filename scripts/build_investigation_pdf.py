from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from build_homework_pdf import register_fonts, para, PAGE_W, PAGE_H, CONTENT_W
ROOT=Path(__file__).resolve().parents[1];register_fonts()
p=ROOT/'output/pdf/AP_CSP_Chapter_2_Investigation_Sheet.pdf'
c=canvas.Canvas(str(p),pagesize=A4,pageCompression=1);c.setTitle('AP CSP Chapter 2 - Data Investigation Record');c.setAuthor('Original classroom practice')
def title(part):
 y=para(c,'AP CSP | Chapter 2: From Data to Evidence',42,PAGE_H-42,size=16,leading=21,bold=True)-6
 return para(c,part,42,y,size=11,leading=15,bold=True)-18

def text(s,y,bold=False):return para(c,s,42,y,size=10,leading=14,bold=bold)-9

def lines(y,count,gap=22):
 c.setStrokeColor(colors.HexColor('#bbbbbb'));c.setLineWidth(.35)
 for i in range(count):c.line(42,y-i*gap,PAGE_W-42,y-i*gap)
 return y-count*gap-10

def table(y,rows,widths,h=32):
 for i,row in enumerate(rows):
  x=42
  for value,w in zip(row,widths):
   c.setStrokeColor(colors.HexColor('#999999'));c.setLineWidth(.4);c.rect(x,y-h,w,h,fill=0,stroke=1)
   para(c,value,x+7,y-8,w-14,size=9,leading=12,bold=i==0);x+=w
  y-=h
 return y-15

def foot(n):
 c.setFont('CSP',8);c.setFillColor(colors.black);c.drawString(42,24,'Synthetic classroom dataset | Not actual students or a formal Create task');c.drawRightString(PAGE_W-42,24,f'{n} / 2')
y=title('Part A | Ask a question and inspect the data')
y=text('Name: __________________________  Partner: __________________  Date: __________',y)
y=text('Dataset: 16 raw fictional responses from a voluntary school commute survey on one morning. Fields: response ID, main mode, one-way minutes and one-way distance in kilometres.',y)
y=text('1. Write a question this dataset can help answer. Identify the records you need.',y,True);y=lines(y-4,2)
y=text('2. Identify two pieces of metadata and explain why each matters for this question.',y,True);y=lines(y-4,3)
y=text('3. Inspect the raw records. Record three quality issues and justify your decisions.',y,True)
y=table(y,[['Response / field','Issue','Action and reason'],['','',''],['','',''],['','','']],[105,140,CONTENT_W-245],43)
y=text('4. Record the original row count, cleaned count, and any mode filter used.',y,True);y=lines(y-4,2)
y=text('5. Explain how you handle the 120-minute observation. Why is an unusual value not necessarily wrong?',y,True);y=lines(y-4,3)
assert y>42,y;foot(1);c.showPage()
y=title('Part B | Analyse, evaluate and communicate')
y=text('6. Record summary statistics. Label the subset and keep the units clear.',y,True)
y=table(y,[['Subset / mode','n','Mean (min)','Median (min)'],['All cleaned','','',''],['Selected mode: ______','','',''],['Same subset, omit 120','','','']],[185,45,140,CONTENT_W-370],34)
y=text('7. Sketch a suitable chart or attach the lab chart. Give a title, axis labels, units and an honest scale.',y,True)
c.setStrokeColor(colors.HexColor('#aaaaaa'));c.rect(42,y-132,CONTENT_W,132,fill=0,stroke=1);y-=148
y=text('8. State a claim supported by two numerical observations. Say which records your claim describes.',y,True);y=lines(y-4,3)
y=text('9. Give a limitation. Explain why a travel-time difference alone does not prove that transport mode caused it.',y,True);y=lines(y-4,2)
y=text('10. Propose a useful next investigation and the additional data it would need.',y,True);y=lines(y-4,2)
assert y>42,y;foot(2);c.save();print(p)
