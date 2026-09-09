from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
page=(root/'scripts/data.template.html').read_text()
ui=(root/'scripts/data-ui.js').read_text().replace('__DATASET__',json.dumps(json.loads((root/'data/chapter2-commute.json').read_text()),ensure_ascii=False))
page=page.replace('__CORE__',(root/'scripts/data-core.js').read_text()).replace('__UI__',ui)
(root/'Chapter_2_Data_Lab.html').write_text(page)
print('Built Chapter 2 Data Lab')
