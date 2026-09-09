from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from build_homework_pdf import register_fonts, para, MARGIN, PAGE_W, PAGE_H, CONTENT_W
ROOT=Path(__file__).resolve().parents[1]
register_fonts()
out=ROOT/'output/pdf/AP_CSP_Chapter_1_Project_Sheet.pdf'
c=canvas.Canvas(str(out),pagesize=A4,pageCompression=1)
c.setTitle('AP CSP Chapter 1 - Ticket Total Project Record')
c.setAuthor('Teacher-created classroom practice')
def title(part):
    y=PAGE_H-42
    y=para(c,'AP CSP | Chapter 1: Ticket Total',42,y,size=17,leading=22,bold=True)-6
    y=para(c,part,42,y,size=11,leading=15,bold=True)-12
    return y

def lines(y,count,gap=22):
    c.setStrokeColor(colors.HexColor('#bbbbbb'));c.setLineWidth(.35)
    for i in range(count): c.line(42,y-i*gap,PAGE_W-42,y-i*gap)
    return y-count*gap-10

def text(s,y,bold=False,size=10):return para(c,s,42,y,size=size,leading=14,bold=bold)-9

def foot(page):
    c.setFont('CSP',8);c.setFillColor(colors.black)
    c.drawString(42,25,'Original classroom project | Not a formal Create task')
    c.drawRightString(PAGE_W-42,25,f'{page} / 2')
y=title('Part A | Define, design and build')
y=text('Name: _____________________  Partner: _____________________  Date: __________',y)
y=text('Requirements: Valid input is an integer ticket count from 1 to 50. Each ticket costs 12. Add a fee of 3 once per order. Display the total. Invalid-input validation is outside this chapter.',y)
y=text('1. Purpose and users: What problem does your program solve, and who would use it?',y,True)
y=lines(y-7,2)
y=text('2. Identify one input, the processing needed, and one output.',y,True)
y=lines(y-7,3)
y=text('3. Write your own pseudocode. Use INPUT(), variables, arithmetic and DISPLAY().',y,True)
y=lines(y-7,9)
y=text('Pair roles: Driver __________  Navigator __________  Roles switched at __________',y)
y=text('Credit any code or ideas you adapted, or state that you wrote the solution independently.',y)
y=lines(y-5,1)
assert y>42,y
foot(1);c.showPage()
y=title('Part B | Test, explain and improve')
y=text('4. Calculate expected outputs before running. Reset the program between inputs.',y,True)
headers=['Input','Expected output','Actual output','Pass / fail']
widths=[65,150,150,CONTENT_W-365]
xs=[42]
for w in widths:xs.append(xs[-1]+w)
rows=[headers,['1','','',''],['2','','',''],['50','','','']]
for row in rows:
    h=34
    for i,v in enumerate(row):
        c.setStrokeColor(colors.HexColor('#999999'));c.setLineWidth(.4);c.rect(xs[i],y-h,widths[i],h,stroke=1,fill=0)
        para(c,v,xs[i]+8,y-9,widths[i]-16,size=9,leading=12,bold=row==headers)
    y-=h
y-=16
y=text('5. Why are both boundary tests and a typical input useful? Can these tests prove correctness for every possible input?',y,True)
y=lines(y-5,2)
y=text('6. A classmate uses total <- tickets * (price + fee). Explain why input 1 hides the error and choose an input that reveals it.',y,True)
y=lines(y-5,3)
y=text('7. Feedback and revision: Record a specific suggestion, what you changed, and the result when you retested.',y,True)
y=lines(y-5,3)
y=text('8. Reflection: Name one limitation of your current program and one next improvement.',y,True)
y=lines(y-5,2)
assert y>42,y
foot(2);c.save()
print(out)
