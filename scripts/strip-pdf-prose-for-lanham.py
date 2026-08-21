"""Clean pdftotext output of a published paper down to authored body prose
for Lanham fingerprinting: cut references, page furniture, captions; rejoin
hyphenated line breaks. Usage: python3 strip-pdf-prose-for-lanham.py <in.txt> <out.txt>
"""
import re, sys

src, dst = sys.argv[1], sys.argv[2]
t = open(src, encoding='utf-8', errors='replace').read()

# cut from a References/Bibliography heading to end
m = re.search(r'^\s*(References|REFERENCES|Bibliography|Works Cited)\s*$', t, re.M)
if m:
    t = t[:m.start()]

lines = []
for l in t.split('\n'):
    s = l.strip()
    if not s:
        lines.append('')
        continue
    if re.match(r'^(Figure|Fig\.|Table)\s*\d', s):            # captions
        continue
    if re.match(r'^\d{1,4}$', s):                              # bare page numbers
        continue
    if re.search(r'(Proceedings of|©|Copyright|American Society for Engineering Education|Paper ID|ASEE Annual Conference|Springer Nature|https?://doi|Vol\.\s*\d+.*pp\.)', s):
        continue
    if re.match(r'^[\d\s.•·|/-]+$', s):                        # number/rule junk rows
        continue
    lines.append(l)
t = '\n'.join(lines)

t = re.sub(r'(\w)-\n\s*(\w)', r'\1\2', t)                      # de-hyphenate wraps
t = re.sub(r'[ \t]+', ' ', t)
t = re.sub(r'\n{3,}', '\n\n', t)

open(dst, 'w', encoding='utf-8').write(t.strip() + '\n')
print(dst, len(t.split()), 'words')
