import re

DRAFTS = '/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Part_III/drafts/'
OUT = '/tmp/claude-1000/-home-dalton-projects-claudeflow-testing/4f57a6b0-2f95-43f7-b42b-e0a0bea709d0/scratchpad/overleaf-new.tex'

old = open(DRAFTS + 'DESKTOP-SECTION-OVERLEAF-v1.tex').readlines()
banner = ''.join(old[0:53])          # stale-passages review banner (keep until M3.6/M4.1 revised)
overleaf_hdr = ''.join(old[55:58])   # "SELF-CONTAINED OVERLEAF VERSION ..." lines

src = open(DRAFTS + 'DESKTOP-SECTION-ASSEMBLED-v1.tex').read()

def repl(m):
    name = m.group(1)
    body = open(DRAFTS + name + '.tex').read()
    return (f'% ========== BEGIN INLINED FILE: {name}.tex ==========\n'
            + body.rstrip('\n')
            + f'\n\n% ========== END INLINED FILE: {name}.tex ==========')

flat = re.sub(r'^\\input\{([^}]+)\}$', repl, src, flags=re.M)

lines = flat.split('\n')
# insert the Overleaf-specific header lines after the assembled header's line 2
lines.insert(2, overleaf_hdr.rstrip('\n'))
flat = banner + '\n'.join(lines)

open(OUT, 'w').write(flat)
print('flattened OK,', len(flat), 'chars')
