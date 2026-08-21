import re

# Read all 4 run outputs
parts = []
for i in range(1, 5):
    if i == 1:
        fname = 'tmp/phantasia-unified-section/run1v2-prose.txt'
    else:
        fname = f'tmp/phantasia-unified-section/run{i}-final.txt'
    with open(fname) as f:
        content = f.read()
    # Strip validation appendix
    if '# VALIDATION APPENDIX' in content:
        content = content[:content.index('# VALIDATION APPENDIX')].rstrip()
    if content.rstrip().endswith('---'):
        content = content.rstrip()[:-3].rstrip()
    parts.append(content)

# Concatenate
full = '\n\n'.join(parts)

# Word count
words = len(full.split())
print(f'Total words (raw): {words}')

# Count headings
headings = re.findall(r'^#{1,3} .+', full, re.MULTILINE)
print(f'\nSection structure ({len(headings)} headings):')
for h in headings:
    print(f'  {h}')

# Check key terms
terms = {
    'phantasia': 0, 'phantasma': 0, 'aisthesis': 0, 'chronos': 0,
    'apoleipomene kinesis': 0, 'resonant motion': 0, 'resonant affect': 0,
    'dual trace': 0, 'taking-as': 0, 'antichesis': 0,
    'ontological completion': 0, 'habituated phantasia': 0,
    'affective architecture': 0, 'Befindlichkeit': 0, 'Stimmung': 0,
    'Umwelt': 0, 'soap bubble': 0, 'ambience': 0, 'dwelling': 0,
    'Funktionskreis': 0, 'Merkbild': 0, 'outfielder': 0, 'pianist': 0,
    'rattlesnake': 0, 'RDR2': 0
}
for term in terms:
    terms[term] = len(re.findall(re.escape(term), full, re.IGNORECASE))

print('\nKey term deployment:')
for term, count in sorted(terms.items(), key=lambda x: -x[1]):
    if count > 0:
        marker = '!!!' if term == 'rattlesnake' else ''
        print(f'  [{count:2d}x] {term} {marker}')
    elif term in ['rattlesnake', 'RDR2']:
        print(f'  [ 0x] {term} {"(GOOD - excluded)" if term == "rattlesnake" else "(MISSING)"}')

# Check unauthorized authors
unauth = ['Gibson', 'Burke', 'Bowin', "O'Connor", 'O.Connor']
print('\nUnauthorized author mentions:')
for a in unauth:
    count = len(re.findall(a, full, re.IGNORECASE))
    if count > 0:
        print(f'  [{count}x] {a} -- NEEDS REMOVAL')

# Save raw assembly
with open('tmp/phantasia-unified-section/raw-assembly.txt', 'w') as f:
    f.write(full)
print(f'\nRaw assembly saved: {len(full)} chars')
