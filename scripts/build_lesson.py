"""Build standalone lessons and the Chapter 1 portal from shared sources."""
from pathlib import Path
import html
import json

ROOT = Path(__file__).resolve().parents[1]
L01 = dict(chapter=1, id='L01', number='01', title='Bits, Binary & Representation', shortTitle='Bits & Binary',
           filename='AP_CSP_L01_Bits_and_Binary.html', minutes=90,
           topicSummary='Bits, context, binary conversions, capacity, overflow and roundoff.',
           homeworkInstructions='Q1–Q6: select the best answer, except Q5, where two answers are required. Q7–Q12: show your reasoning. Binary integer encodings here are nonnegative; ignore storage padding unless stated.')

def lesson_sources():
    yield L01, ROOT/'scripts/slides.json', ROOT/'lesson-exercises.json', ROOT/'scripts/teacher-guide.html'
    for folder in sorted((ROOT/'lessons').glob('L*')):
        if all((folder/name).exists() for name in ['meta.json','slides.json','exercises.json','guide.html']):
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
    chapter=meta.get('chapter',1)
    lab={1:'Chapter_1_Programming_Lab.html',2:'Chapter_2_Data_Lab.html',3:'Chapter_3_Programming_Lab.html',4:'Chapter_4_Algorithms_Lab.html',5:'Chapter_5_Network_Lab.html'}[chapter]
    guide=guide_path.read_text()+f'<p class="teacher-note"><a href="Chapter_{chapter}.html">← Chapter {chapter} overview</a> · <a href="{lab}">Interactive lab</a></p>'
    replacements={'__CSS__':(ROOT/'scripts/lesson.css').read_text(), '__GUIDE__':guide, '__JS__':runtime,
                  '__CHAPTER__':str(chapter), '__NUMBER__':meta['number'], '__LESSON_ID__':meta['id'], '__TITLE__':html.escape(meta['title']),
                  '__SHORT_TITLE__':html.escape(meta['shortTitle']), '__DURATION__':str(exercises['durationMinutes']),
                  '__INSTRUCTIONS__':html.escape(meta['homeworkInstructions'])}
    page=(ROOT/'scripts/lesson.template.html').read_text()
    for key,value in replacements.items(): page=page.replace(key,value)
    (ROOT/meta['filename']).write_text(page)
    print('Built',meta['filename'])

def main():
    sources=list(lesson_sources())
    previews=json.loads((ROOT/'scripts/lesson-previews.json').read_text())
    for meta,*_ in sources:
        preview=ROOT/'lessons'/meta['id']/'preview.svg'
        if preview.exists(): previews[meta['id']]=preview.read_text()
    for args in sources: build_lesson(*args)
    chinese=['信息表示与二进制','计算创新与输入输出','算法、变量与顺序执行','协作、测试与改进','采样与数字表示','压缩与取舍','数据质量与清洗','数据分析与证据']
    for chapter in sorted({row[0].get('chapter',1) for row in sources}):
        lessons=[row[0] for row in sources if row[0].get('chapter',1)==chapter]
        if not lessons: continue
        cards=[]
        for m in lessons:
            cn=m.get('chineseTitle') or chinese[int(m['number'])-1]
            cards.append(f'''<article class="lesson-card"><div class="card-top"><span>LESSON {m['number']}</span><span>90 MIN · 23 SLIDES</span></div><div class="lesson-preview">{previews[m['id']]}</div><h2>{html.escape(m['shortTitle'])}</h2><p class="zh">{cn}</p><p>{html.escape(m['topicSummary'])}</p><div class="card-actions"><a class="primary" href="{m['filename']}">Open lesson →</a><a href="{m['filename']}#guide">Teacher guide</a></div><div class="downloads"><a href="output/pdf/AP_CSP_{m['id']}_Homework.pdf">Student PDF</a><a href="output/pdf/AP_CSP_{m['id']}_Answer_Key.pdf">Answer key</a><a href="{m['filename']}#homework">Interactive practice</a></div></article>''')
        template='chapter.template.html' if chapter==1 else f'chapter{chapter}.template.html'
        page=(ROOT/'scripts'/template).read_text().replace('__CARDS__','\n'.join(cards)).replace('__LESSON_CARDS__','\n'.join(cards))
        (ROOT/f'Chapter_{chapter}.html').write_text(page)
    course=(ROOT/'scripts/course.template.html').read_text()
    course=course.replace('__CHAPTER1_VISUAL__',previews['L03']).replace('__CHAPTER2_VISUAL__',previews['L06'])
    course=course.replace('__CHAPTER3_VISUAL__',previews.get('L13',''))
    course=course.replace('__CH4_PREVIEW__',previews.get('L18','')).replace('__CH5_PREVIEW__',previews.get('L24',''))
    (ROOT/'index.html').write_text(course)
    print('Built course and chapter portals')

if __name__=='__main__': main()
