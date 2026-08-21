import re, sys
src, dst = sys.argv[1], sys.argv[2]
t = open(src).read()
t = '\n'.join(l for l in t.split('\n') if not l.strip().startswith('%'))
t = re.sub(r'\\section\{[^}]*\}', '', t)
t = re.sub(r'\\textit\{([^}]*)\}', r'\1', t)
t = t.replace('``', '"').replace("''", '"').replace('---', ' - ').replace('--', '-')
t = re.sub(r'\\[a-zA-Z]+', '', t)
open(dst, 'w').write(t)
print(len(t.split()), 'words')
