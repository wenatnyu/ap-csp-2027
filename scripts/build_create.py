"""Build the dedicated Create module without treating work sessions as lectures."""
from pathlib import Path
import html
import json

ROOT=Path(__file__).resolve().parents[1]
def esc(value):return html.escape(str(value))
def listing(items):return '<ul>'+''.join('<li>'+esc(x)+'</li>' for x in items)+'</ul>'
def main():
    data=json.loads((ROOT/'create/sessions.json').read_text())
    sessions=data['sessions']
    assert len(sessions)==6 and sum(s['minutes'] for s in sessions)==540
    css=(ROOT/'scripts/create.css').read_text()
    def page(filename,title,body):
        content=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AP CSP · {esc(title)}</title><style>{css}</style></head><body><header><a href="index.html">AP CSP / COURSEBOOK</a><a href="Chapter_7.html">Chapter 7 · Create</a></header><main>{body}<footer>AP CSP · Chapter 7 · Materials checked 2026-09-13 · <a href="Chapter_7.html">Create module</a> · <a href="Official_Exam_Resources.html">官方真题与样题</a></footer></main></body></html>'''
        (ROOT/filename).write_text(content)
    cards=[];nav=[];panels=[]
    for s in sessions:
        ident=s['id'];assert ident in ('C01','C02','C03','C04','C05','C06')
        end=0
        for b in s['blocks']:assert b['start']==end and b['end']>end;end=b['end']
        assert end==90
        cards.append(f'<article class="card"><span class="badge">{ident} · 90 MIN DEDICATED WORK</span><h3>{esc(s["title"])}</h3><p class="zh">{esc(s["chineseTitle"])}</p><p>{esc(s["purpose"])}</p><div class="actions"><a class="button" href="Chapter_7_Create_Workspace.html#{ident}">Open {ident} →</a></div></article>')
        nav.append(f'<a id="nav-{ident}" href="#{ident}">{ident} · {esc(s["chineseTitle"])}</a>')
        blocks=''.join(f'<div class="plan-block"><div class="plan-time">{b["start"]}–{b["end"]} min</div><h3>{esc(b["title"])}</h3><p>{esc(b["task"])}</p></div>' for b in s['blocks'])
        inputs=f'''<div class="input-row"><div><label for="{ident}-date">Date / 日期</label><input id="{ident}-date" type="date"></div><div><label for="{ident}-status">Record status / 笔记状态</label><select id="{ident}-status"><option value="not-started">Not started / 未记录</option><option value="working">Working / 进行中</option><option value="paused">Paused / 暂停</option><option value="recorded">Recorded / 本次已记录</option></select></div></div><div class="input-row"><div><label for="{ident}-classMinutes">Classroom minutes / 课堂分钟</label><input id="{ident}-classMinutes" type="number" min="0" max="1440" step="1" value="0"></div><div><label for="{ident}-outsideMinutes">Outside-class minutes / 课外分钟</label><input id="{ident}-outsideMinutes" type="number" min="0" max="1440" step="1" value="0"></div></div>'''
        for field,label in [('work','Work and decisions / 本次工作与自己的决定'),('evidence','Saved version or evidence / 保存版本与过程证据'),('next','Next work / 下一步')]:inputs+=f'<label for="{ident}-{field}">{label}</label><textarea id="{ident}-{field}" maxlength="20000"></textarea>'
        panels.append(f'''<section class="section" id="session-{ident}" {'hidden' if ident!='C01' else ''}><h2>{ident} · {esc(s['title'])}</h2><p class="zh">{esc(s['chineseTitle'])}</p><p>{esc(s['purpose'])}</p><div class="work-grid"><div class="panel">{blocks}<h3>Self-check milestones / 自主检查</h3>{listing(s['milestones'])}<p class="minor">{esc(s.get('progressNote','Adjust the sequence to your progress without replacing dedicated work with lessons.'))}</p><details><summary>教师管理提醒</summary><p>{esc(s['teacherReminder'])}</p></details></div><div class="panel"><h3>My session record / 我的过程记录</h3><p class="minor">{esc(s['recordPrompt'])}</p>{inputs}</div></div></section>''')
    workspace=(ROOT/'scripts/create-workspace.template.html').read_text()
    for key,value in {'__CSS__':css,'__SESSION_NAV__':''.join(nav),'__SESSION_PANELS__':''.join(panels),'__CORE__':(ROOT/'scripts/create-journal-core.js').read_text(),'__UI__':(ROOT/'scripts/create-journal-ui.js').read_text()}.items():workspace=workspace.replace(key,value)
    (ROOT/'Chapter_7_Create_Workspace.html').write_text(workspace)
    page('Chapter_7_Create_Preparation.html','Create · 课前准备','<section class="hero"><div class="eyebrow">BEFORE THE OFFICIAL TASK</div><h1>Prepare before you begin.</h1><p class="zh">正式Create前的准备 · 另行安排，不计入九小时</p></section>'+(ROOT/'create/preparation-content.html').read_text())
    page('Chapter_7_Teacher_Guide.html','Create · 教师指南','<div class="teacher-content">'+(ROOT/'create/teacher-guide.html').read_text().replace('<table>','<div class="table-wrap"><table>').replace('</table>','</table></div>')+'</div>')
    sources=''.join(f'<li><a href="{esc(x["url"])}">{esc(x["title"])}</a></li>' for x in data['sources'])
    body='''<section class="hero"><div class="eyebrow">CHAPTER 07 · CREATE PERFORMANCE TASK</div><h1>Build a program<br>you understand.</h1><p class="zh">正式Create项目 · 从准备到自主提交</p><p>6 dedicated work sessions · 90 minutes each · At least 9 classroom hours<br>Program code · Video · Personalized Project Reference</p></section>
<nav class="tabs" aria-label="Create模块导航"><a href="#prepare">课前准备</a><a href="#sessions">六次工作课</a><a href="#materials">打印与教师资料</a><a href="#sources">官方要求</a></nav>
<div class="note"><strong>本章是工作课安排。</strong>规则讲解、示范和普通练习在正式任务前另排；六次90分钟全部留给学生进行正式任务。按进度追加课堂，不能以课外工作抵扣应提供的九小时。资料完成不等于学生作品或官方提交已经完成。</div>
<section class="section" id="prepare"><h2>先准备，再开始正式任务</h2><div class="flow"><div><span class="stage-label">BEFORE</span><strong>Rules & tools</strong>提前讲解规则，练习导出、录屏与截图，确认正式平台访问。</div><div><span class="stage-label">DURING</span><strong>Own task</strong>学生自主开发；程序可按规则协作，视频与PPR独立制作。</div><div><span class="stage-label">AFTER</span><strong>Exam practice</strong>正式任务提交后另排FRQ练习，使用自己的程序与PPR。</div></div><div class="actions"><a class="button" href="Chapter_7_Create_Preparation.html">课前准备与图解 →</a><a class="button secondary" href="Chapter_7_Teacher_Guide.html">教师指南 →</a></div></section>
<section class="section"><h2>三个提交组件，分别检查</h2><div class="grid three"><article class="card"><span class="badge">A / PROGRAM CODE</span><h3>Code PDF</h3><p>完整程序汇总为一个可读PDF，保留代码注释及外部来源署名。</p></article><article class="card"><span class="badge">B / VIDEO · INDIVIDUAL</span><h3>Running program</h3><p>独立录制程序的输入、功能和输出；≤60秒、≤30MB，不含身份信息或语音讲解。</p></article><article class="card"><span class="badge">C / PPR · INDIVIDUAL</span><h3>Code references</h3><p>本人选择正式程序中的过程、调用、列表存储和使用片段；截图无注释或课程内容，按官方表单填写。</p></article></div><p class="minor">完整要求见下方官方Student Handouts；本网站不接收或代交学生的正式作品。</p></section>
<section class="section" id="sessions"><h2>六次专用课堂 / C01–C06</h2><p>下面是可调整的工作节奏。学生决定项目内容和具体实现；本章不提供可直接提交的标准程序或PPR答案。</p><div class="grid">'''+''.join(cards)+'''</div></section>
<section class="section" id="materials"><h2>记录、打印与教学支持</h2><div class="grid"><article class="card"><h3>Student materials / 学生材料</h3><div class="links"><a href="Chapter_7_Create_Workspace.html">浏览器工作记录</a><a href="output/pdf/AP_CSP_Chapter_7_Create_Journal.pdf">六次工作记录 PDF</a><a href="output/pdf/AP_CSP_Chapter_7_Submission_Checklist.pdf">提交自查 PDF</a></div><p class="minor">浏览器记录保存在本机，可导出和导入JSON备份。记录单不属于PPR或官方提交材料。</p></article><article class="card"><h3>Teacher materials / 教师材料</h3><div class="links"><a href="Chapter_7_Teacher_Guide.html">详细教师指南</a><a href="output/pdf/AP_CSP_Chapter_7_Teacher_Guide.pdf">课堂管理速查 PDF</a><a href="Official_Exam_Resources.html#frq">后续FRQ真题入口</a></div><p class="minor">正式任务期间提供方向澄清、技术和过程管理支持；具体协助边界见教师指南。</p></article></div></section>
<section class="section panel" id="sources"><h2>Official requirements / 官方要求</h2><p>规则核查：2026-09-13。当前依据Fall 2023 CED/Student Handouts和Summer 2026 Digital Portfolio指南，为2027年考试准备；正式实施前复核当年度文件。</p><p><strong>2027年4月30日23:59 ET：</strong>Create最终提交截止。<strong>2027年5月14日：</strong>AP CSP考试（Session 1）。校内里程碑另定；非传统课堂学生与学校/考点AP协调员确认安排。</p><ul>'''+sources+'''</ul></section><p class="minor"><a href="Chapter_6.html">← 第六章</a> · 下一模块：综合复习与考试准备（尚待制作） · <a href="https://github.com/wenatnyu/ap-csp-2027/archive/refs/heads/main.zip">下载当前全部资料</a></p>'''
    page('Chapter_7.html','Chapter 7 · Create',body)
    print('Built Chapter 7 portal, preparation, workspace and teacher guide')
if __name__=='__main__':main()
