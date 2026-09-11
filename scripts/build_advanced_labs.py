#!/usr/bin/env python3
"""Build portable Chapter 4/5 labs with embedded classroom models."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def read(name): return (ROOT / 'scripts' / name).read_text()
def build(template, output, parts):
    text = read(template).replace('__CSS__', read('lab45.css'))
    for key, filename in parts.items(): text = text.replace('__'+key+'__', read(filename))
    (ROOT / output).write_text(text)
    print('Built', output)
if __name__ == '__main__':
    build('algorithms.template.html', 'Chapter_4_Algorithms_Lab.html', {'CORE':'algorithms-core.js','MODELS':'algorithm-models.js','UI':'algorithms-ui.js'})
    build('network.template.html', 'Chapter_5_Network_Lab.html', {'CORE':'network-core.js','UI':'network-ui.js'})
