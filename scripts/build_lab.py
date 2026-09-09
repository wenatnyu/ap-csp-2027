from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=(root/'scripts/lab.template.html').read_text()
s=s.replace('__CORE__',(root/'scripts/lab-core.js').read_text()).replace('__UI__',(root/'scripts/lab-ui.js').read_text())
(root/'Chapter_1_Programming_Lab.html').write_text(s)
print('Built programming lab')
