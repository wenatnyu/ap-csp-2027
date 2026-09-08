from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
template = (root / 'scripts/lesson.template.html').read_text()
exercises = json.loads((root / 'lesson-exercises.json').read_text())
assert len(exercises['questions']) == 12
assert sum(q['marks'] for q in exercises['questions']) == 30
slides = json.loads((root / 'scripts/slides.json').read_text())
assert len(slides) == 23
runtime = (root / 'scripts/runtime.js').read_text()
runtime = runtime.replace('__SLIDES__', json.dumps(slides, ensure_ascii=False).replace('</', '<\\/'))
runtime = runtime.replace('__EXERCISES__', json.dumps(exercises, ensure_ascii=False).replace('</', '<\\/'))
template = template.replace('__CSS__', (root / 'scripts/lesson.css').read_text())
template = template.replace('__GUIDE__', (root / 'scripts/teacher-guide.html').read_text())
template = template.replace('__JS__', runtime)
(root / 'AP_CSP_L01_Bits_and_Binary.html').write_text(template)
(root / 'index.html').write_text(template)
print('Built AP_CSP_L01_Bits_and_Binary.html')
