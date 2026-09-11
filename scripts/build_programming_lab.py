from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
presets=json.loads((ROOT/'scripts/programming-presets.json').read_text())
ui=(ROOT/'scripts/programming-ui.js').read_text().replace('__PRESETS__',json.dumps(presets,ensure_ascii=False).replace('</','<\\/'))
page=(ROOT/'scripts/programming.template.html').read_text().replace('__CORE__',(ROOT/'scripts/programming-core.js').read_text()).replace('__UI__',ui)
(ROOT/'Chapter_3_Programming_Lab.html').write_text(page)
print('Built Chapter 3 Programming Lab')
