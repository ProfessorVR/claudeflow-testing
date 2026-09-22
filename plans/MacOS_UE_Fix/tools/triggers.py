#!/usr/bin/env python3
"""Census of BP_OrbitTrigger actor instances in a World Partition __ExternalActors__ tree.

For each external-actor package that references BP_OrbitTrigger, report the screen
actor (BP_SC_*) and widget class (BP_WG_*) it names, read from the package tables
rather than from any Blueprint graph -- the screen<->widget pairing is a property of
the placed actor instance, not of BP_FirstPersonCharacter.

Usage: triggers.py <__ExternalActors__/.../<MapName> dir>
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uasset2

SC = re.compile(r'^BP_SC_[A-Za-z0-9_]+$')
WG = re.compile(r'^BP_WG_[A-Za-z0-9_]+$')


def walk(root):
    for dirpath, _dirs, files in os.walk(root):
        for f in files:
            if f.endswith('.uasset'):
                yield os.path.join(dirpath, f)


def main(root):
    rows = []
    other_sc = {}
    errors = []
    total = 0
    for path in walk(root):
        total += 1
        try:
            with open(path, 'rb') as fh:
                raw = fh.read()
        except OSError as e:
            errors.append((path, str(e)))
            continue
        if b'OrbitTrigger' not in raw:
            # still record screen actors living in non-trigger packages
            try:
                d = uasset2.parse(path)
            except Exception:
                continue
            for n in d['names']:
                if SC.match(n):
                    other_sc.setdefault(n, []).append(path)
            continue
        try:
            d = uasset2.parse(path)
        except Exception as e:
            errors.append((path, f'{type(e).__name__}: {e}'))
            continue
        names = d['names']
        sc = sorted({n for n in names if SC.match(n)})
        wg = sorted({n for n in names if WG.match(n)})
        cls = sorted({n for n in names if n.startswith('BP_OrbitTrigger')})
        # the instance's own object name
        inst = [n for c, n in d['exports'] if 'OrbitTrigger' in str(c)]
        rows.append(dict(path=path, cls=cls, sc=sc, wg=wg, inst=inst,
                         imports=[i for i in d['imports'] if i and (SC.match(i) or WG.match(i))]))

    rows.sort(key=lambda r: (r['sc'] or [''], r['wg'] or ['']))
    print(f'scanned {total} external-actor packages under')
    print(f'  {root}')
    print(f'orbit-trigger packages: {len(rows)}\n')
    w = max([len(', '.join(r['sc'])) for r in rows] + [10])
    for r in rows:
        s = ', '.join(r['sc']) or '(none)'
        g = ', '.join(r['wg']) or '(none)'
        print(f'  {s:<{w}}  ->  {g}')
        print(f'      inst={r["inst"]}  cls={r["cls"]}')
        print(f'      imports={r["imports"]}')
        print(f'      {r["path"].split("/Hospital_Client/")[-1] if "/Hospital_Client/" in r["path"] else r["path"]}')
    print()
    print('screen actors named in NON-trigger packages (placed screens):')
    for n in sorted(other_sc):
        print(f'  {n:<40} x{len(other_sc[n])}')
    if errors:
        print(f'\nERRORS ({len(errors)}):')
        for p, e in errors[:20]:
            print(f'  {p}: {e}')


if __name__ == '__main__':
    main(sys.argv[1])
