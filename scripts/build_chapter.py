"""Run with Python + reportlab. Build all chapter artifacts and the offline pack."""
from pathlib import Path
import argparse
import subprocess
import sys
from zipfile import ZipFile, ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--skip-pdfs',action='store_true',help='Reuse existing PDFs after slides-only changes.')
args=parser.parse_args()
def run(script,*args):
    subprocess.run([sys.executable,str(ROOT/'scripts'/script),*map(str,args)],check=True,cwd=ROOT)
run('build_lesson.py')
run('build_lab.py')
run('build_data_lab.py')
if not args.skip_pdfs:
    run('build_homework_pdf.py')
    for folder in sorted((ROOT/'lessons').glob('L*')):
        run('build_homework_pdf.py','--source',folder/'exercises.json','--meta',folder/'meta.json')
    run('build_project_pdf.py')
    run('build_investigation_pdf.py')
paths=list(ROOT.glob('*.html'))+[ROOT/'README.md',ROOT/'COURSE_PLAN.md',ROOT/'lesson-exercises.json']
for folder in ['lessons','scripts','output/pdf','resources','data']:
    paths.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
with ZipFile(ROOT/'AP_CSP_Chapters_1_2_Teaching_Pack.zip','w',ZIP_DEFLATED,compresslevel=6) as archive:
    for path in sorted(set(paths)):
        archive.write(path,'AP_CSP_Chapters_1_2/'+path.relative_to(ROOT).as_posix())
print('Built complete Chapters 1–2 teaching pack')
