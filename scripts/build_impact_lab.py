"""Build the portable Chapter 6 impact investigation workspace."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    text=(ROOT/'scripts/impact.template.html').read_text()
    for key,name in {'CSS':'lab45.css','CORE':'impact-core.js','UI':'impact-ui.js'}.items():
        text=text.replace('__'+key+'__',(ROOT/'scripts'/name).read_text())
    (ROOT/'Chapter_6_Impact_Lab.html').write_text(text)
    print('Built Chapter 6 Impact Lab')
if __name__=='__main__':main()
