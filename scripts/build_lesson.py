"""Build standalone lessons and the Chapter 1 portal from shared sources."""
from pathlib import Path
import html
import json

ROOT = Path(__file__).resolve().parents[1]
L01 = dict(id='L01', number='01', title='Bits, Binary & Representation', shortTitle='Bits & Binary',
           filename='AP_CSP_L01_Bits_and_Binary.html', minutes=90,
           topicSummary='Bits, context, binary conversions, capacity, overflow and roundoff.',
           homeworkInstructions='Q1–Q6: select the best answer, except Q5, where two answers are required. Q7–Q12: show your reasoning. Binary integer encodings here are nonnegative; ignore storage padding unless stated.')

def lesson_sources():
    yield L01, ROOT/'scripts/slides.json', ROOT/'lesson-exercises.json', ROOT/'scripts/teacher-guide.html'
    for folder in sorted((ROOT/'lessons').glob('L*')):
        if (folder/'meta.json').exists():
            yield json.loads((folder/'meta.json').read_text()), folder/'slides.json', folder/'exercises.json', folder/'guide.html'

def build_lesson(meta, slides_path, exercise_path, guide_path):
    slides=json.loads(slides_path.read_text())
    exercises=json.loads(exercise_path.read_text())
    assert len(slides)==23, (meta['id'],len(slides))
    assert len(exercises['questions'])==12
    assert sum(q['marks'] for q in exercises['questions'])==exercises['totalMarks']==30
    runtime=(ROOT/'scripts/runtime.js').read_text()
    runtime=runtime.replace('__SLIDES__',json.dumps(slides,ensure_ascii=False).replace('</','<\\/'))
    runtime=runtime.replace('__EXERCISES__',json.dumps(exercises,ensure_ascii=False).replace('</','<\\/'))
    guide=guide_path.read_text()+'<p class="teacher-note"><a href="index.html">← Chapter 1 overview</a> · <a href="Chapter_1_Programming_Lab.html">Programming lab</a></p>'
    replacements={'__CSS__':(ROOT/'scripts/lesson.css').read_text(), '__GUIDE__':guide, '__JS__':runtime,
                  '__NUMBER__':meta['number'], '__LESSON_ID__':meta['id'], '__TITLE__':html.escape(meta['title']),
                  '__SHORT_TITLE__':html.escape(meta['shortTitle']), '__DURATION__':str(exercises['durationMinutes']),
                  '__INSTRUCTIONS__':html.escape(meta['homeworkInstructions'])}
    page=(ROOT/'scripts/lesson.template.html').read_text()
    for key,value in replacements.items(): page=page.replace(key,value)
    (ROOT/meta['filename']).write_text(page)
    print('Built',meta['filename'])

def main():
    sources=list(lesson_sources())
    for args in sources: build_lesson(*args)
    lessons=[s[0] for s in sources]
    cards=[]
    chinese=['信息表示与二进制','计算创新与输入输出','算法、变量与顺序执行','协作、测试与改进']
    for i,m in enumerate(lessons):
        cards.append(f'''<article class="lesson-card"><div class="card-top"><span>LESSON {m['number']}</span><span>90 MIN · 23 SLIDES</span></div><h2>{html.escape(m['shortTitle'])}</h2><p class="zh">{chinese[i]}</p><p>{html.escape(m['topicSummary'])}</p><div class="card-actions"><a class="primary" href="{m['filename']}">Open lesson →</a><a href="{m['filename']}#guide">Teacher guide</a></div><div class="downloads"><a href="output/pdf/AP_CSP_{m['id']}_Homework.pdf">Student PDF</a><a href="output/pdf/AP_CSP_{m['id']}_Answer_Key.pdf">Answer key</a><a href="{m['filename']}#homework">Interactive practice</a></div></article>''')
    page=(ROOT/'scripts/chapter.template.html').read_text().replace('__CARDS__','\n'.join(cards))
    (ROOT/'index.html').write_text(page)
    print('Built Chapter 1 portal')

if __name__=='__main__': main()
