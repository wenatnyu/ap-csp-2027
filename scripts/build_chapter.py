"""Run with Python + reportlab. Build all chapter artifacts and the offline pack."""
from pathlib import Path
import subprocess
import sys
from zipfile import ZipFile, ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
def run(script,*args):
    subprocess.run([sys.executable,str(ROOT/'scripts'/script),*map(str,args)],check=True,cwd=ROOT)
run('build_lesson.py')
run('build_lab.py')
run('build_homework_pdf.py')
for folder in sorted((ROOT/'lessons').glob('L*')):
    run('build_homework_pdf.py','--source',folder/'exercises.json','--meta',folder/'meta.json')
run('build_project_pdf.py')
paths=list(ROOT.glob('*.html'))+[ROOT/'README.md',ROOT/'COURSE_PLAN.md',ROOT/'lesson-exercises.json']
for folder in ['lessons','scripts','output/pdf','resources']:
    paths.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
with ZipFile(ROOT/'AP_CSP_Chapter_1_Teaching_Pack.zip','w',ZIP_DEFLATED,compresslevel=6) as archive:
    for path in sorted(set(paths)):
        archive.write(path,'AP_CSP_Chapter_1/'+path.relative_to(ROOT).as_posix())
print('Built complete Chapter 1 teaching pack')
