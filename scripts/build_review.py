"""Build the five review lessons and the original practice tool."""
from pathlib import Path
import html,json
ROOT=Path(__file__).resolve().parents[1]
def esc(x):return html.escape(str(x))
def ul(xs):return '<ul>'+''.join('<li>'+esc(x)+'</li>' for x in xs)+'</ul>'
def main():
 data=json.loads((ROOT/'review/sessions.json').read_text());bank=json.loads((ROOT/'review/questions.json').read_text())
 assert len(data['sessions'])==5 and len(bank['questions'])==40
 byid={q['id']:q for q in bank['questions']};assert len(byid)==40
 assert [s['id'] for s in bank['sets']]==['diagnostic','algorithms','mixed']
 assert [len(s['questionIds']) for s in bank['sets']]==[10,10,20]
 assert len(set(qid for s in bank['sets'] for qid in s['questionIds']))==40
 for q in bank['questions']:
  assert len(q['options'])==4 and len(q['answer']) in [1,2] and len(set(q['answer']))==len(q['answer'])
  assert all(type(a) is int and 0<=a<4 for a in q['answer']) and q['rationale'] and q['explanation']
  if len(q['answer'])==2:assert 'select two' in q['stem'].lower()
  assert (ROOT/q['remediation']['url'].split('#')[0]).exists()
 css=(ROOT/'scripts/create.css').read_text()+'\n'+(ROOT/'scripts/review.css').read_text()
 def page(name,title,body):
  (ROOT/name).write_text(f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AP CSP · {esc(title)}</title><style>{css}</style></head><body><header><a href="index.html">AP CSP / COURSEBOOK</a><a href="Chapter_8.html">Chapter 8 · Review</a></header><main>{body}<footer><a href="Chapter_8.html">综合复习目录</a> · <a href="Official_Exam_Resources.html">官方题源</a> · 2026–27 course · Checked 2026-09-13</footer></main></body></html>')
 cards=[]
 for n,s in enumerate(data['sessions']):
  assert s['id']==f'R{n+1:02}' and s['minutes']==90
  end=0
  for b in s['blocks']:assert b['start']==end and b['end']>end;end=b['end']
  assert end==90
  plan='<div class="plan-table"><table><thead><tr><th>Time</th><th>Focus</th><th>Task</th></tr></thead><tbody>'+''.join(f'<tr><td>{b["start"]}–{b["end"]} min</td><td>{esc(b["title"])}</td><td>{esc(b["task"])}</td></tr>' for b in s['blocks'])+'</tbody></table></div>'
  body=f'<section class="hero"><div class="eyebrow">CHAPTER 08 · {s["id"]} · 90 MIN</div><h1>{esc(s["title"])}</h1><p class="zh">{esc(s["zh"])}</p><p>{esc(s["summary"])}</p></section><section class="section"><h2>Learning goals / 本课目标</h2>{ul(s["objectives"])}<details><summary>90-minute lesson plan / 课堂安排</summary>{plan}</details></section><div class="lesson-content">{s["contentHtml"]}</div><section class="section panel"><h2>After class / 巩固</h2>{ul(s["homework"])}<p><a href="output/pdf/AP_CSP_Chapter_8_Review_Record.pdf">打印复盘记录单</a></p></section><details><summary>教师课后复盘与分层支持</summary>{ul(s["teacherNotes"])}</details>'
  body+='<div class="actions">'+(f'<a class="button secondary" href="Chapter_8_R{n:02}.html">← Previous lesson</a>' if n else '<a class="button secondary" href="Chapter_8.html">← Review overview</a>')+(f'<a class="button" href="Chapter_8_R{n+2:02}.html">Next lesson →</a>' if n<4 else '<a class="button" href="index.html">Course overview →</a>')+'</div>'
  page(f'Chapter_8_{s["id"]}.html',s['id']+' · '+s['title'],body)
  cards.append(f'<article class="card"><span class="pill">{s["id"]} · 90 MIN</span><h3>{esc(s["title"])}</h3><p class="zh">{esc(s["zh"])}</p><p>{esc(s["summary"])}</p><div class="actions"><a class="button" href="Chapter_8_{s["id"]}.html">Open {s["id"]} →</a></div></article>')
 page('Chapter_8_Teacher_Guide.html','Review · Teacher Guide','<div class="teacher-content lesson-content">'+(ROOT/'review/teacher-guide.html').read_text().replace('<table>','<div class="table-wrap"><table>').replace('</table>','</table></div>')+'</div>')
 template=(ROOT/'scripts/review-quiz.template.html').read_text()
 replacements={'__CSS__':css,'__TABS__':''.join(f'<a id="tab-{s["id"]}" href="#{s["id"]}">{esc(s["title"])}</a>' for s in bank['sets']),'__DATA__':json.dumps(bank,ensure_ascii=False).replace('<','\\u003c'),'__CORE__':(ROOT/'scripts/review-core.js').read_text(),'__UI__':(ROOT/'scripts/review-ui.js').read_text()}
 for k,v in replacements.items():template=template.replace(k,v)
 (ROOT/'Chapter_8_Quiz.html').write_text(template)
 body='''<section class="hero"><div class="eyebrow">CHAPTER 08 · COMPREHENSIVE REVIEW</div><h1>Find the gap.<br>Explain the evidence.</h1><p class="zh">综合复习与分项限时训练</p><p>5 lessons · 90 minutes each · 7.5 hours<br>Diagnose → repair → official samples → written responses → mixed practice</p></section>
 <div class="note"><strong>本章补齐课程规划的最后一个模块。</strong>五次复习课采用阅读式课堂工作页，包含教学图解、任务、答案与教师提示；不计为新增的普通课23页Slides。正式Create的9小时另排，正式Create开始后，教师对正式或练习书面回答的反馈均须等三个组件全部Final；本章指导讲评安排在此后。</div>
 <section class="section"><h2>Three sources, clearly identified / 题源分开使用</h2><div class="grid three"><article class="card"><div class="source-type">ORIGINAL PRACTICE</div><h3>40 new MCQs</h3><p>10题诊断＋10题算法专项＋20题混合限时。英文题干，中英文解析；支持本机保存、计时与错题补练。</p><a href="Chapter_8_Quiz.html">打开原创训练 →</a></article><article class="card"><div class="source-type">OFFICIAL SAMPLES</div><h3>18 CED questions</h3><p>College Board公开样题。R03保留官方PDF中的题号、阅读材料和图表，答案在作答后查看；不是历年完整实考卷。</p><a href="Chapter_8_R03.html">官方样题课堂 →</a></article><article class="card"><div class="source-type">RELEASED EXAM FRQs</div><h3>2026 written responses</h3><p>R04使用真实公开题组，连续60分钟作答，再对照同年评分标准。2024/2025其余四套用于后续轮换。</p><a href="Chapter_8_R04.html">官方FRQ课堂 →</a></article></div><p class="minor">40＋18是本章分项练习量，不是完整70题MCQ模拟考。没有教师权限也能使用本章公开材料；完整受限官方MCQ卷目前仍未取得。</p></section>
 <section class="section" id="lessons"><h2>Five review lessons / 五次复习课</h2><div class="grid">'''+''.join(cards)+'''</div></section>
 <section class="section panel"><h2>Use the results to choose your next lesson</h2><div class="flow"><div><span class="stage-label">01 / NOTICE</span><strong>Locate the error</strong>概念、代码追踪、阅读条件、双选漏选或猜测？先还原当时的理由。</div><div><span class="stage-label">02 / EXPLAIN</span><strong>Show the evidence</strong>写出关键变量、一个反例或程序中的具体操作，再解释因果关系。</div><div><span class="stage-label">03 / RECHECK</span><strong>Try a fresh case</strong>先做对应旧课补练，隔天换情境重测；正确题数不换算AP分数。</div></div></section>
 <section class="section" id="print"><h2>Print & teach / 打印与教学</h2><div class="grid"><article class="card"><h3>Student practice</h3><div class="links"><a href="output/pdf/AP_CSP_Chapter_8_Practice.pdf">40题学生练习 PDF</a><a href="output/pdf/AP_CSP_Chapter_8_Review_Record.pdf">错因与FRQ复盘 PDF</a></div><p>复盘表用于记录自己的证据和下一步，不是正式PPR或提交材料。</p></article><article class="card"><h3>Teacher support</h3><div class="links"><a href="Chapter_8_Teacher_Guide.html">中文教师指南</a><a href="output/pdf/AP_CSP_Chapter_8_Answer_Key.pdf">40题英文解析 PDF</a><a href="Official_Exam_Resources.html">2024–2026官方题源总页</a></div><p>答案用于作答后讨论；评分只针对当次练习，不预测官方等级。</p></article></div></section>
 <section class="section panel"><h2>2027 exam preparation / 考试准备</h2><p>MCQ：70题、120分钟；其中57道普通单选、5道阅读单选、8道双选。书面回答：60分钟、2道题共4个提示，使用自己的项目与PPR。Create与书面回答合计占30%，MCQ占70%。</p><p>考试为2027年5月14日Session 1；Create最终提交截止为2027年4月30日23:59 ET。Bluebook的AP Test Preview用于熟悉界面，不计时，也不提供分数或答案反馈。</p><div class="links"><a href="https://apcentral.collegeboard.org/courses/ap-computer-science-principles/exam">官方考试说明与日期</a><a href="https://apcentral.collegeboard.org/help-center/can-students-try-sample-ap-exam-questions-bluebook-testing-app-exam-day">官方Bluebook预览说明</a><a href="https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf">当前CED</a></div><p class="minor">以上要求核查于2026-09-13。正式实施前复核官方年度更新；当前课程按适用于2026–27的Fall 2023 CED安排。</p></section>
 <div class="actions"><a class="button secondary" href="Chapter_7.html">← Chapter 7 · Create</a><a class="button" href="https://github.com/wenatnyu/ap-csp-2027/archive/refs/heads/main.zip">Download all eight chapters</a></div>'''
 page('Chapter_8.html','Chapter 8 · Review',body)
 print('Built Chapter 8 portal, five review lessons, quiz and teacher guide')
if __name__=='__main__':main()
