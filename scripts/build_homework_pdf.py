#!/usr/bin/env python3
"""Build the AP CSP Lesson 01 printable practice and teacher answer key.

Requires reportlab. Reads the shared lesson-exercises.json so the website and
printable versions use the same questions, answers, and teacher mark scheme.
Run from any working directory: python3 scripts/build_homework_pdf.py
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageTemplate,
    Paragraph, Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
PAGE_W, PAGE_H = A4
MARGIN = 42
CONTENT_W = PAGE_W - 2 * MARGIN
INK = colors.HexColor("#181818")
RULE = colors.HexColor("#A0A0A0")


def register_fonts():
    runtime = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies"
    candidates = [
        runtime / "node/node_modules/pdfjs-dist/standard_fonts",
        Path("/usr/share/fonts/truetype/liberation2"),
        Path("/usr/share/fonts/truetype/liberation"),
    ]
    for directory in candidates:
        if (directory / "LiberationSans-Regular.ttf").is_file():
            pdfmetrics.registerFont(TTFont("CSP", str(directory / "LiberationSans-Regular.ttf")))
            pdfmetrics.registerFont(TTFont("CSP-Bold", str(directory / "LiberationSans-Bold.ttf")))
            pdfmetrics.registerFont(TTFont("CSP-Italic", str(directory / "LiberationSans-Italic.ttf")))
            pdfmetrics.registerFontFamily("CSP", normal="CSP", bold="CSP-Bold", italic="CSP-Italic", boldItalic="CSP-Bold")
            return
    raise RuntimeError("Liberation Sans TTF files were not found. Install Liberation fonts or update register_fonts().")


def clean(value):
    return str(value).replace("\u2011", "-").replace("\u2013", "-").replace("\u2014", "-").replace("`", "")


def markup(value):
    text = escape(clean(value)).replace("\n", "<br/>")
    supers = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ", "0123456789n")
    subs = str.maketrans("₀₁₂₃₄₅₆₇₈₉", "0123456789")
    text = re.sub(r"[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]+", lambda m: "<super>" + m[0].translate(supers) + "</super>", text)
    return re.sub(r"[₀₁₂₃₄₅₆₇₈₉]+", lambda m: "<sub>" + m[0].translate(subs) + "</sub>", text)


def style(name="body", size=10.3, leading=14.0, **kwargs):
    return ParagraphStyle(name, fontName="CSP", fontSize=size, leading=leading,
                          textColor=INK, alignment=TA_LEFT, **kwargs)


def para(c, text, x, y, width=CONTENT_W, size=10.3, leading=14.0, bold=False):
    s = style(size=size, leading=leading)
    if bold:
        s.fontName = "CSP-Bold"
    p = Paragraph(markup(text), s)
    _, height = p.wrap(width, PAGE_H)
    p.drawOn(c, x, y - height)
    return y - height


def footer(c, page, total, key=False):
    c.setStrokeColor(RULE)
    c.setLineWidth(.35)
    c.line(MARGIN, 36, PAGE_W - MARGIN, 36)
    c.setFont("CSP", 8)
    c.setFillColor(INK)
    c.drawString(MARGIN, 23, "AP CSP | Lesson 01 | " + ("Teacher answer key" if key else "Student homework"))
    c.drawRightString(PAGE_W - MARGIN, 23, f"{page} / {total}")


def header(c, part, full=False, data=None):
    c.setFillColor(INK)
    y = PAGE_H - MARGIN
    y = para(c, "AP CSP | Lesson 01: Bits and Binary", MARGIN, y,
             size=16 if full else 12.3, leading=20 if full else 16, bold=True)
    y -= 5
    y = para(c, part, MARGIN, y, size=10.5, leading=14, bold=True)
    if full:
        y -= 10
        y = para(c, "Name: __________________________  Class: __________  Date: ______________", MARGIN, y, size=10, leading=14)
        y -= 7
        y = para(c, f"Time: {data['durationMinutes']} minutes   |   Total: {data['totalMarks']} teacher marks (not an AP score)   |   Show working.", MARGIN, y, size=9.4, leading=12.5)
        y -= 4
        y = para(c, "Original AP-style MCQs and classroom written practice; these are not official AP questions.\nWork without a calculator. Unless stated otherwise, binary values are unsigned integers.", MARGIN, y, size=9.0, leading=12)
    y -= 10
    c.setStrokeColor(INK)
    c.setLineWidth(.65)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    return y - 14


def question_heading(c, q, y):
    number = re.sub(r"^Q", "", str(q["id"]))
    c.setFont("CSP-Bold", 10.5)
    c.setFillColor(INK)
    c.drawString(MARGIN, y - 10.5, f"{number}.")
    c.setFont("CSP", 9.1)
    n = q["marks"]
    c.drawRightString(PAGE_W - MARGIN, y - 10.5, f"[{n} mark{'s' if n != 1 else ''}]")
    return y - 19


def mcq_option_columns(q):
    width = (CONTENT_W - 17) / 4 - 12
    return 4 if all(pdfmetrics.stringWidth(f"{o['label']}.  {o['text']}", "CSP", 9.7) < width for o in q["options"]) else 2


def mcq_height(q):
    p = Paragraph(markup(q["prompt"]), style(size=10.1, leading=13.2))
    _, height = p.wrap(CONTENT_W - 75, PAGE_H)
    cols = mcq_option_columns(q)
    width = (CONTENT_W - 17) / cols - 12
    for start in range(0, len(q["options"]), cols):
        sizes = []
        for option in q["options"][start:start + cols]:
            p = Paragraph(markup(f"{option['label']}.  {option['text']}"), style(size=9.7, leading=12.8))
            sizes.append(p.wrap(width, PAGE_H)[1])
        height += max(sizes) + 3
    return height + 6 + 2 + 9 + 10


def draw_mcq(c, q, top, height):
    question_heading(c, q, top)
    y = para(c, q["prompt"], MARGIN + 17, top, CONTENT_W - 75,
             size=10.1, leading=13.2)
    y -= 6
    options = q.get("options", [])
    cols = mcq_option_columns(q)
    half = (CONTENT_W - 17) / cols
    opt_style = style(size=9.7, leading=12.8)
    # A single aligned grid reduces eye movement and keeps answer letters clear.
    for start in range(0, len(options), cols):
        heights = []
        for col, option in enumerate(options[start:start + cols]):
            text = f"{option['label']}.  {option['text']}"
            p = Paragraph(markup(text), opt_style)
            _, h = p.wrap(half - 12, PAGE_H)
            p.drawOn(c, MARGIN + 17 + col * half, y - h)
            heights.append(h)
        y -= max(heights, default=0) + 3
    y -= 2
    c.setFont("CSP", 9)
    c.drawString(MARGIN + 17, y - 9, "Answer: __________")
    if y - 9 < top - height + 3:
        raise ValueError(f"{q['id']} exceeds its student page allocation")


def draw_written(c, q, top, height):
    y = question_heading(c, q, top)
    y = para(c, q["prompt"], MARGIN + 17, y, CONTENT_W - 17,
             size=10.2, leading=14.2)
    line_top = y - 20
    lower = top - height + 15
    requested = q.get("lines", 7)
    count = min(requested, max(1, int((line_top - lower) / 17) + 1))
    if count < 4:
        raise ValueError(f"{q['id']} has inadequate working space ({count} lines)")
    c.setStrokeColor(RULE)
    c.setLineWidth(.35)
    for i in range(count):
        yy = line_top - i * 17
        c.line(MARGIN + 17, yy, PAGE_W - MARGIN, yy)
    return count


def build_student(data, destination):
    questions = data["questions"]
    assert len(questions) == 12
    c = canvas.Canvas(str(destination), pagesize=A4, pageCompression=1)
    c.setTitle("AP CSP Lesson 01 - Bits and Binary - Student Homework")
    c.setAuthor("Teacher-created AP-style practice")
    c.setSubject("Original 30-mark practice worksheet for AP Computer Science Principles")
    top = header(c, "Homework | Multiple-choice and written practice", full=True, data=data)
    heights = [mcq_height(q) for q in questions[:6]]
    extra = (top - 53 - sum(heights)) / 6
    if extra < 0:
        raise ValueError(f"Multiple-choice page is {-6 * extra:.1f} pt too tall")
    for q, base_height in zip(questions[:6], heights):
        row_h = base_height + extra
        draw_mcq(c, q, top, row_h)
        top -= row_h
    footer(c, 1, 3)
    c.showPage()
    spaces = {}
    for page, group in [(2, questions[6:9]), (3, questions[9:12])]:
        top = header(c, f"Written responses | Questions {group[0]['id'][1:]}-{group[-1]['id'][1:]}")
        row_h = (top - 53) / 3
        for i, q in enumerate(group):
            spaces[q["id"]] = draw_written(c, q, top - i * row_h, row_h)
        footer(c, page, 3)
        c.showPage()
    c.save()
    return spaces


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_pages = []

    def showPage(self):
        self._saved_pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        count = len(self._saved_pages)
        for state in self._saved_pages:
            self.__dict__.update(state)
            footer(self, self._pageNumber, count, key=True)
            super().showPage()
        super().save()


def build_key(data, destination):
    doc = BaseDocTemplate(str(destination), pagesize=A4, leftMargin=MARGIN,
                          rightMargin=MARGIN, topMargin=MARGIN, bottomMargin=51,
                          title="AP CSP Lesson 01 - Teacher Answer Key", author="Teacher-created AP-style practice")
    frame = Frame(MARGIN, 51, CONTENT_W, PAGE_H - MARGIN - 51,
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id="normal", frames=frame))
    heading = style("key-heading", size=14.3, leading=18, spaceAfter=6)
    heading.fontName = "CSP-Bold"
    subhead = style("key-subhead", size=11, leading=14, spaceBefore=8, spaceAfter=6)
    subhead.fontName = "CSP-Bold"
    body = style("key-body", size=9.5, leading=12.5, spaceAfter=4)
    small = style("key-small", size=8.8, leading=11.5, spaceAfter=6)
    story = [
        Paragraph("AP CSP | Lesson 01: Bits and Binary", heading),
        Paragraph("Teacher answer key and marking guide", subhead),
        Paragraph(markup(f"{data['totalMarks']} teacher marks. Original AP-style practice; this worksheet does not predict an AP score."), small),
        Paragraph("Award each written-response point independently. Accept equivalent correct wording and valid alternative methods. Leading zeros do not change the value of an unsigned binary integer.", small),
        Paragraph("Questions 1-6 | 1 mark each", subhead),
    ]
    for q in data["questions"][:6]:
        block = [
            Paragraph(f"<b>{escape(q['id'])}. Answer: {markup(q['answer'])}</b>", body),
            Paragraph(markup(q["explanation"]), body),
            Spacer(1, 6),
        ]
        story.append(KeepTogether(block))
    story += [Paragraph("Written-response answers | Questions 7-12", subhead)]
    for q in data["questions"][6:]:
        block = [Paragraph(f"<b>{escape(q['id'])}. {q['marks']} marks</b>", body)]
        block.append(Paragraph(f"<b>Answer:</b> {markup(q['answer'])}", body))
        # The worked answer plus point-by-point rubric is complete for marking.
        # Longer teaching explanations remain available in the shared source.
        for item in q.get("rubric", []):
            block.append(Paragraph(f"<b>{item['marks']} mark:</b> {markup(item['criterion'])}", body))
        block.append(Spacer(1, 7))
        story.append(KeepTogether(block))
    doc.build(story, canvasmaker=NumberedCanvas)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT / "lesson-exercises.json")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "output/pdf")
    args = parser.parse_args()
    data = json.loads(args.source.read_text(encoding="utf-8"))
    assert sum(q["marks"] for q in data["questions"]) == data["totalMarks"]
    register_fonts()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    homework = args.output_dir / "AP_CSP_L01_Homework.pdf"
    key = args.output_dir / "AP_CSP_L01_Answer_Key.pdf"
    spaces = build_student(data, homework)
    build_key(data, key)
    print(json.dumps({"homework": str(homework), "answer_key": str(key),
                      "written_answer_lines": spaces}, indent=2))


if __name__ == "__main__":
    main()
