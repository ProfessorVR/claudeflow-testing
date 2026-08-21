import re

with open('tmp/phantasia-unified-section/final-cleaned.txt') as f:
    content = f.read()

words = len(content.split())
print(f'Final word count: {words}')
print(f'Meets 5000 minimum: {"YES" if words >= 5000 else "NO"}')

# Headings
headings = re.findall(r'^#{1,3} .+', content, re.MULTILINE)
print(f'\nSection structure ({len(headings)} headings):')
for h in headings:
    print(f'  {h}')

# Key terms
terms = [
    'phantasia', 'phantasma', 'aisthesis', 'chronos', 'apoleipomene kinesis',
    'resonant motion', 'resonant affect', 'dual trace', 'taking-as',
    'antichesis', 'ontological completion', 'habituated phantasia',
    'affective architecture', 'Befindlichkeit', 'Stimmung', 'Umwelt',
    'soap bubble', 'ambience', 'dwelling', 'Funktionskreis', 'Merkbild',
    'outfielder', 'pianist', 'hexis', 'doxa', 'orexis', 'pathos'
]
print('\nKey term counts:')
for term in terms:
    count = len(re.findall(re.escape(term), content, re.IGNORECASE))
    if count > 0:
        print(f'  [{count:2d}x] {term}')
    else:
        print(f'  [ 0x] {term} -- MISSING')

# Constraint checks
print('\nConstraint checks:')
rattlesnake = len(re.findall('rattlesnake', content, re.IGNORECASE))
print(f'  Rattlesnake mentions: {rattlesnake} {"(GOOD)" if rattlesnake == 0 else "(BAD)"}')

rdr2 = len(re.findall('Red Dead Redemption|RDR2', content, re.IGNORECASE))
print(f'  RDR2 mentions: {rdr2} {"(GOOD)" if rdr2 > 0 else "(MISSING)"}')

# Unauthorized authors
for a in ['Gibson', 'Burke', 'Bowin', "O'Connor"]:
    count = len(re.findall(r'\b' + a + r'\b', content, re.IGNORECASE))
    if count > 0:
        print(f'  UNAUTHORIZED: {a} appears {count}x')
    else:
        print(f'  {a}: removed (GOOD)')

# Allowed authors found
allowed = ['Aristotle', 'Heidegger', 'Uexk', 'Rickert', 'Frede', 'Nussbaum',
           'White', "O'Gorman", 'Hawhee', 'Gonzalez', 'Caston', 'Papachristou', 'Gross']
print('\nAuthors cited:')
for a in allowed:
    count = len(re.findall(a, content, re.IGNORECASE))
    if count > 0:
        print(f'  [{count:2d}x] {a}')
