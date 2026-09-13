"""Build print companions for six dedicated Create work sessions."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from build_homework_pdf import register_fonts, para, PAGE_W, PAGE_H, CONTENT_W

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
HANDOUTS = 'https://apcentral.collegeboard.org/media/pdf/ap-csp-student-task-directions.pdf'
PPR = 'https://apcentral.collegeboard.org/media/pdf/ap-csp-personalized-project-reference-tip-sheet.pdf'
CED = 'https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf'
STUDENT = 'https://apcentral.collegeboard.org/media/pdf/ap-digital-portfolio-student-user-guide.pdf'
TEACHER = 'https://apcentral.collegeboard.org/media/pdf/ap-digital-portfolio-teacher-user-guide.pdf'

class PrintGuide:
    def __init__(self, name, title, pages):
        self.path = OUT / ('AP_CSP_Chapter_7_' + name + '.pdf')
        self.c = canvas.Canvas(str(self.path), pagesize=A4, pageCompression=1)
        self.c.setTitle(title)
        self.c.setAuthor('AP CSP course teaching materials')
        self.title, self.pages, self.page = title, pages, 0

    def start(self, subtitle):
        self.page += 1
        c = self.c
        c.setFillColor(colors.HexColor('#123b63'))
        c.rect(0, PAGE_H-22, PAGE_W, 22, fill=1, stroke=0)
        self.y = para(c, self.title, 42, PAGE_H-44, size=17, leading=22, bold=True)-8
        self.text(subtitle, True, 11)
        c.setStrokeColor(colors.HexColor('#a8b6c5'))
        c.line(42, self.y+2, PAGE_W-42, self.y+2)
        self.y -= 12

    def text(self, text, bold=False, size=10):
        self.y = para(self.c, text, 42, self.y, CONTENT_W, size=size, leading=14, bold=bold)-8

    def lines(self, count, gap=21):
        self.c.setStrokeColor(colors.HexColor('#bcc7d2'))
        self.c.setLineWidth(.4)
        for i in range(count):
            self.c.line(42, self.y-i*gap, PAGE_W-42, self.y-i*gap)
        self.y -= count*gap+8

    def check(self, text):
        self.c.setStrokeColor(colors.HexColor('#49647e'))
        self.c.rect(43, self.y-10, 8, 8, stroke=1, fill=0)
        self.y = para(self.c, text, 60, self.y, CONTENT_W-18, size=10, leading=14)-10

    def table(self, rows, widths, height=33):
        assert abs(sum(widths)-CONTENT_W)<.01
        for i, row in enumerate(rows):
            x = 42
            for value, width in zip(row, widths):
                self.c.setFillColor(colors.HexColor('#edf3f8') if i == 0 else colors.white)
                self.c.setStrokeColor(colors.HexColor('#b2bfcd'))
                self.c.setLineWidth(.4)
                self.c.rect(x, self.y-height, width, height, fill=1, stroke=1)
                bottom = para(self.c, value, x+7, self.y-7, width-14, size=9.3, leading=12, bold=i==0)
                assert bottom >= self.y-height+3, (value, bottom, self.y-height)
                x += width
            self.y -= height
        self.y -= 12

    def finish(self, links):
        assert self.y > 64, (self.path, self.page, self.y)
        x = 42
        self.c.setFont('CSP', 7.5)
        self.c.setFillColor(colors.HexColor('#123b63'))
        for label, url in links:
            self.c.drawString(x, 47, label)
            width = self.c.stringWidth(label, 'CSP', 7.5)
            self.c.linkURL(url, (x, 44, x+width, 55), relative=0)
            x += width+20
        self.c.setStrokeColor(colors.HexColor('#b2bfcd'))
        self.c.line(42, 36, PAGE_W-42, 36)
        self.c.setFont('CSP', 7.5)
        self.c.drawString(42, 24, 'Chapter 7 | Original support material | Requirements checked 13 Sep 2026')
        self.c.drawRightString(PAGE_W-42, 24, f'{self.page} / {self.pages}')
        self.c.showPage()

    def save(self):
        assert self.page == self.pages
        self.c.save()
        print(self.path)


def journal():
    data = json.loads((ROOT/'create/sessions.json').read_text())
    d = PrintGuide('Create_Journal', 'AP CSP | My Create Work Journal', 6)
    for session in data['sessions']:
        d.start(session['id']+' | '+session['title']+' | Planned dedicated classroom time: 90 min')
        d.text(session['purpose'])
        d.text('Date: ______________   Actual classroom minutes: ______   Outside-class minutes: ______')
        d.table([['Suggested window', 'Work focus']]+[
            [f'{b["start"]}-{b["end"]} min', b['title']] for b in session['blocks']], [115, CONTENT_W-115])
        d.text('Adapt the sequence to your progress. Record actual task time; outside-class work does not replace the classroom time your school must provide.', size=9.5)
        d.text('1. My work and decisions today', True)
        d.lines(4)
        d.text('2. Saved version / process evidence / acknowledgments to maintain', True)
        d.lines(3)
        d.text('3. My next step or a technical barrier to report', True)
        d.lines(2)
        d.text('Private working notes only. This journal is not a PPR, an official submission, or proof that the school has met the nine-hour requirement. Keep formal work private.', size=9)
        d.finish([('Official Student Handouts', HANDOUTS), ('Digital Portfolio student guide', STUDENT)])
    d.save()


def checklist():
    d = PrintGuide('Submission_Checklist', 'AP CSP | Create Submission Self-Check', 2)
    d.start('A + B | Review your own work against the official directions')
    d.text('Use this as a reminder, not a scoring rubric. Consult the linked official documents for full requirements. Do not submit this sheet or publish your formal work.')
    d.text('A | Program code: one complete, readable PDF', True, 11)
    for item in [
        'Include all program code. Keep comments and acknowledgments for external code, media, data and AI assistance.',
        'The program includes input and related output, and a list or other collection that stores and uses data to manage complexity.',
        'Include a student-developed procedure with a meaningful parameter, its name, and a return type if needed. A built-in function or event handler alone does not meet this requirement.',
        'Sequencing, selection and iteration are included in the selected procedure body. The program calls that procedure.',
        'Open the exported PDF and check every page for readable, complete code. If using screen captures, use a font of at least 10 points.'
    ]: d.check(item)
    d.text('B | Video: independently created, one file', True, 11)
    for item in [
        'Show the program running: input, at least one aspect of functionality, and output.',
        'Keep the video at or below 60 seconds and 30 MB. Accepted formats: .webm, .mp4, .wmv, .avi or .mov.',
        'Exclude identifying information and voice narration. Text captions are allowed; program audio output is allowed.',
        'Play the actual exported video file before upload. Submit a video file through Digital Portfolio, not a streaming link.'
    ]: d.check(item)
    d.finish([('Official Student Handouts', HANDOUTS), ('Digital Portfolio student guide', STUDENT)])
    d.start('C + final submission | Select references independently; verify all three components')
    d.text('C | Personalized Project Reference (PPR)', True, 11)
    for item in [
        'Use the official image fields. Include the procedure definition, a call to that same procedure, list storage, and use of that same list to fulfill the program purpose.',
        'Select code from your own actively developed or actively co-developed formal program. Choose and capture the PPR evidence independently.',
        'Remove all comments and course content from PPR captures. This differs from the complete code PDF, where acknowledgments must remain.',
        'Make text readable at 10 points or larger; 12 points is recommended. The four code items do not imply exactly four images: each image box allows up to three screenshots.',
        'Save in the official form and inspect the generated PDF / print preview for missing, clipped or blurry code. Do not replace the form with an arbitrary PPR PDF upload.'
    ]: d.check(item)
    d.text('Final check in the official Digital Portfolio', True, 11)
    for item in [
        'Confirm your exam registration/order with your school or AP coordinator. Check the correct course and programming language field.',
        'Review the latest version of each component, complete the required attestations, and use Submit Final for program code, video and PPR separately. A draft upload or Save is not final.',
        'Verify final submission status for all three components before 30 April 2027, 11:59 p.m. Eastern Time. Keep confirmation privately.',
        'If a teacher returns a file for a permitted technical/format reason, correct it and finalize it again before the deadline. A PPR not finalized by the deadline is unavailable on exam day.'
    ]: d.check(item)
    d.finish([('PPR tip sheet', PPR), ('Digital Portfolio student guide', STUDENT)])
    d.save()


def teacher():
    data = json.loads((ROOT/'create/sessions.json').read_text())
    d = PrintGuide('Teacher_Guide', 'AP CSP | Create Classroom Guide', 2)
    d.start('Planning | Protect the task time; teach and rehearse beforehand')
    d.text('This chapter schedules six 90-minute work sessions: 540 minutes (9 hours). The sequence is a local planning choice, not a prescribed College Board pacing guide.')
    d.text('Before the formal task begins', True, 11)
    d.text('Teach the directions, collaboration and AI rules. Rehearse PDF export, recording, cropping and form navigation using practice material. Confirm platform access, exam registration, devices and accessibility arrangements. Keep these lessons separate from the nine dedicated hours.')
    d.table([['Session', 'Student-directed focus', 'Dedicated time']]+[
        [s['id'],s['title'],'90 minutes'] for s in data['sessions']], [70, CONTENT_W-170, 100], 34)
    d.text('During the dedicated work sessions', True, 11)
    d.text('Allow students to decide the project and implementation. Shift work between sessions as progress requires. Formal task work may include planning, development, testing and preparing the three components. Provide extra classroom time when needed; make up interruptions and breaks.')
    d.text('The private journal separates actual classroom and outside-class minutes. Its totals are planning records, not a compliance certificate or a score. Do not count ordinary instruction or exam revision as dedicated Create time.')
    d.text('Program development may follow the permitted collaboration rules. Students must create their own videos and select/create their own PPR independently. Do not publicly share formal student work.')
    d.finish([('CED: teacher administration', CED+'#page=179'), ('Official Student Handouts', HANDOUTS)])
    d.start('Support boundaries | Use the full official directions when a case is uncertain')
    d.text('Appropriate teacher support during the formal task', True, 11)
    d.text('Clarify written directions and submission procedures; organize groups and resolve collaboration conflicts; address technical barriers such as equipment, connectivity and file transfer. Check readability, file format and prohibited PPR comments without providing content-quality feedback.')
    d.text('Keep ownership with the student', True, 11)
    d.text('Do not choose the project, design or write the formal program, debug or test it for the student, revise the submission, select PPR code, or provide pre-final scoring/quality feedback. A completed practice or curriculum example is not a formal task submission.')
    d.text('AI and outside resources', True, 11)
    d.text('Current policy permits supplementary AI help with concepts, code development and debugging. Students must actively develop the required work, understand and check code, and acknowledge external assistance. Citation alone does not establish active development. Do not invent an AI percentage limit or ban every AI-assisted fragment from the PPR.')
    d.text('Written-response practice and feedback', True, 11)
    d.text('Students may independently self-test with sample written-response prompts before final submission. Teacher feedback on the formal work and teacher-led written-response practice using it come after all three components are finalized. Schedule that instruction outside the nine-hour block.')
    d.text('Final submission and limited returns', True, 11)
    d.text('Students finalize all three components separately. Monitor official status and resolve missing/technical submissions before the deadline. A limited return may address an incorrect, corrupt or unreadable file or prohibited PPR comments/course content; it is not a chance to improve a low-quality response. The student must finalize again before the deadline.')
    d.text('2027 milestones', True, 11)
    d.text('Create deadline: 30 April 2027, 11:59 p.m. Eastern Time. AP CSP exam: 14 May 2027, Session 1. Recheck the current official schedule and directions before administering the task. Students outside a traditional class should consult the school-based AP coordinator.')
    d.finish([('CED: teacher administration', CED+'#page=179'), ('Digital Portfolio teacher guide', TEACHER)])
    d.save()

if __name__ == '__main__':
    register_fonts()
    OUT.mkdir(parents=True, exist_ok=True)
    journal(); checklist(); teacher()
