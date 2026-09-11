"""Create the two-page Chapter 4 project and Chapter 5 investigation records."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from build_homework_pdf import register_fonts, para, PAGE_W, PAGE_H, CONTENT_W

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'

class Record:
    def __init__(self, filename, heading, footer):
        self.path = OUT / filename
        self.heading = heading
        self.footer = footer
        self.c = canvas.Canvas(str(self.path), pagesize=A4, pageCompression=1)
        self.c.setTitle(heading)
        self.c.setAuthor('Original classroom practice')
        self.page = 0
        self.y = 0

    def start(self, part):
        self.page += 1
        self.y = para(self.c, self.heading, 42, PAGE_H-42, size=15.3, leading=20, bold=True)-6
        self.text(part, bold=True, size=10.7)
        self.c.setStrokeColor(colors.HexColor('#555555'))
        self.c.line(42, self.y+2, PAGE_W-42, self.y+2)
        self.y -= 10

    def text(self, value, bold=False, size=10):
        self.y = para(self.c, value, 42, self.y, size=size, leading=14, bold=bold)-9

    def lines(self, n, gap=21):
        self.c.setStrokeColor(colors.HexColor('#bbbbbb'))
        self.c.setLineWidth(.35)
        for i in range(n):
            self.c.line(42, self.y-i*gap, PAGE_W-42, self.y-i*gap)
        self.y -= n*gap+8

    def table(self, rows, widths, height=34):
        assert abs(sum(widths)-CONTENT_W)<.01
        for i, row in enumerate(rows):
            x=42
            for text,w in zip(row,widths):
                self.c.setStrokeColor(colors.HexColor('#999999'))
                self.c.setLineWidth(.4)
                self.c.rect(x,self.y-height,w,height,stroke=1,fill=0)
                if text:
                    bottom=para(self.c,text,x+7,self.y-7,w-14,size=9.1,leading=12,bold=i==0)
                    assert bottom>=self.y-height+4,(self.path,text,bottom,self.y-height)
                x+=w
            self.y -= height
        self.y -= 14

    def finish_page(self):
        assert self.y>48,(self.path,self.page,self.y)
        self.c.setStrokeColor(colors.HexColor('#aaaaaa'))
        self.c.line(42,36,PAGE_W-42,36)
        self.c.setFont('CSP',7.7)
        self.c.setFillColor(colors.black)
        self.c.drawString(42,24,self.footer)
        self.c.drawRightString(PAGE_W-42,24,f'{self.page} / 2')
        self.c.showPage()

    def save(self):
        assert self.page==2
        self.c.save()
        print(self.path)

def chapter4():
    d=Record('AP_CSP_Chapter_4_Project_Sheet.pdf','AP CSP | Chapter 4: Study Session Analyzer',
             'Original classroom project | Teacher practice, not a formal Create submission')
    d.start('Part A | Define, plan and implement')
    d.text('Name: __________________________  Partner: __________________  Date: __________')
    d.text('Purpose: summarize goal-reaching study sessions. Use fictional data. The core input is a nonempty list of whole-number minutes and a whole-number goal, all from 0 through 180. Validation is not required.')
    d.text('Required behavior',True)
    d.text('Write countGoals(sessions, goal). Traverse every session, count each minutes >= goal, and RETURN the count. The caller displays that count, then "On track" if count >= 2, otherwise "Try again". The feedback threshold is a count of two, not a percentage.')
    d.text('1. Define the data and parameters. Explain their roles in this program.',True)
    d.table([['Item','Meaning / role'],['sessions list',''],['goal parameter',''],['returned count','']],[130,CONTENT_W-130],33)
    d.text('2. Plan where the counter is initialized, how each item is tested, and when the procedure returns.',True)
    d.lines(3)
    d.text('3. Sketch the procedure and its call, or record your saved code location. Attach the complete program. Include list traversal, selection, a parameterized procedure and RETURN.',True)
    d.lines(8,20)
    d.finish_page()
    d.start('Part B | Predict, trace, test and revise')
    d.text('4. Predict before running. Then record the actual count and final message. Reset each test independently.',True)
    d.table([['sessions / goal','Expected count / message','Actual count / message'],
             ['[20,30,45,10] / 30','',''],['[20,30,45,10] / 50','',''],
             ['[29,30,31] / 30','',''],['[0,0] / 30','',''],['Your valid test:','','']],[155,178,CONTENT_W-333],36)
    d.text('5. Trace [29,30,31] with goal 30. Start the procedure counter at 0.',True)
    d.table([['minutes','minutes >= goal?','counter after item'],['29','',''],['30','',''],['31','','']],[100,190,CONTENT_W-290],30)
    d.text('6. Explain one benefit of the list and one benefit of the parameterized procedure.',True)
    d.lines(2,19)
    d.text('7. Record a change, why it was needed, and a test result after the change.',True)
    d.lines(3,20)
    d.text('8. Attribute starter code, outside resources or peer help used. Optional extension: test an empty list and label it outside the core nonempty contract.',True)
    d.lines(2,19)
    d.finish_page();d.save()

def chapter5():
    d=Record('AP_CSP_Chapter_5_Investigation_Sheet.pdf','AP CSP | Chapter 5: Connected Systems Investigation',
             'Original classroom investigation | All graph, packet and timing results are model results')
    d.start('Part A | Network paths, failures and packet evidence')
    d.text('Name: __________________________  Partner: __________________  Date: __________')
    d.text('Use the four sections of Chapter 5 Network Lab. Predict before each run. Preserve working data between observations, and reset links before each new failure set. These simulators do not measure a real Internet connection.')
    d.text('1. Network and resilience model',True)
    d.text('Nodes: S,A,B,C,D,T. Undirected edges: S-A, S-B, A-C, A-D, B-D, C-T, D-T, C-D. The model chooses a shortest-hop path, checking neighbors alphabetically. Record reachability, route and hops.')
    d.table([['Disabled edges','Prediction: path / hops or no path','Observation: path / hops or no path'],
             ['None','',''],['A-C only','',''],['S-A and S-B','','']],[105,203,CONTENT_W-308],45)
    d.text('2. Packet model: split HELLO AP CSP into chunks of 3 characters. Keep both spaces. Write each payload inside quotation marks.',True)
    d.table([['Packet ID','Predicted exact payload','Observed exact payload'],['1','',''],['2','',''],['3','',''],['4','','']],[95,208,CONTENT_W-303],30)
    d.text('3. Arrival order is 4,2,1,3. First lose ID 3, then retry it. Record received/missing IDs before retry and the evidence that permits complete reconstruction afterward.',True)
    d.lines(3,20)
    d.finish_page()
    d.start('Part B | Parallel time, overhead and the chapter conclusion')
    d.text('4. Timing model: serial setup = 2 time units; independent indivisible jobs [6,4,3,3]. Assign jobs in listed order to the earliest free processor; ties use the lowest processor number. Start with overhead 0.',True)
    d.table([['Processors','Predicted total time','Observed total time','Speedup vs 1 processor'],['1','','',''],['2','','',''],['4','','','']],[82,140,140,CONTENT_W-362],42)
    d.text('5. Show the two-processor schedule. Include setup and label job start/finish times.',True)
    d.table([['Processor','Job sequence and times (or draw a timeline)'],['P1',''],['P2','']],[100,CONTENT_W-100],40)
    d.text('6. Keep the same jobs and use 2 processors. Add 6 units of overhead after the parallel phase. Predict and observe total time; calculate speedup using the original no-overhead sequential baseline.',True)
    d.lines(3,20)
    d.text('7. Explain why more processors cannot repair a missing network path or an unreceived required packet. Cite one observation from Part A.',True)
    d.lines(3,20)
    d.text('8. State one model limitation and one targeted improvement. Identify what your evidence supports and what it cannot guarantee.',True)
    d.lines(3,20)
    d.finish_page();d.save()

if __name__=='__main__':
    register_fonts();OUT.mkdir(parents=True,exist_ok=True)
    chapter4();chapter5()
