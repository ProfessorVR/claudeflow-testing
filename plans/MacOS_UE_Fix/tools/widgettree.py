#!/usr/bin/env python3
"""Report the UMG widget tree of a WidgetBlueprint .uasset: panels, buttons,
their label TextBlocks, and any overridden Visibility.

Panel slots carry Content (the child widget) and Parent (the panel), both
FPackageIndex values into this package's export table, so the tree can be rebuilt
without opening the editor.

Everything is keyed by EXPORT INDEX, never by name: a WidgetBlueprint holds TWO
widget trees (the designer tree and the generated class's template) whose exports
share names, so name-keyed maps silently merge the two.

Visibility is only serialized when it differs from the class default, so a button
with no Visibility row is Visible.

Usage: widgettree.py <WidgetBlueprint.uasset> [--flat]
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import props as propsmod
import uasset2

EXPREF = re.compile(r'^EXPORT\[(\d+)\]')


def build(path):
    res = propsmod.decode(path, show=False)          # export order
    d = uasset2.parse(path)
    exports = d['exports']                            # [(class, name)] same order
    n = len(exports)
    pmap = [{} for _ in range(n)]
    for i, (_name, plist) in enumerate(res):
        if i < n:
            pmap[i] = {p[0]: p[3] for p in plist}

    def ref(i, key):
        v = pmap[i].get(key)
        if not isinstance(v, str):
            return None
        m = EXPREF.match(v)
        return int(m.group(1)) if m else None

    parent_of = {}
    slot_of = {}
    order = {}
    seq = 0
    for i, (cls, _name) in enumerate(exports):
        if not cls.endswith('Slot'):
            continue
        c = ref(i, 'Content')
        p = ref(i, 'Parent')
        if c is not None:
            parent_of[c] = p
            slot_of[c] = i
            order[c] = seq
            seq += 1

    children = {}
    for c, p in parent_of.items():
        children.setdefault(p, []).append(c)
    for k in children:
        children[k].sort(key=lambda x: order.get(x, 0))
    return exports, pmap, parent_of, children, order


def text_of(pmap, i):
    t = pmap[i].get('Text', '')
    return t.split('|')[-1].strip() if '|' in t else t


def vis_of(pmap, i):
    return pmap[i].get('Visibility', 'Visible*')


def main(path, flat=False):
    exports, pmap, parent_of, children, order = build(path)
    nbut = sum(1 for c, _ in exports if c == 'Button')
    print(f'== {os.path.basename(path)}')
    print(f'   {len(exports)} exports, {nbut} Button, '
          f'{sum(1 for c, _ in exports if c == "TextBlock")} TextBlock')
    print('   (* = Visibility not serialized, i.e. left at the class default)\n')

    def label(i):
        stack = list(children.get(i, []))
        while stack:
            c = stack.pop(0)
            if exports[c][0] == 'TextBlock':
                return c, text_of(pmap, c)
            stack.extend(children.get(c, []))
        return None, None

    if not flat:
        roots = [i for i in children if i is None or i not in parent_of]
        def walk(i, depth):
            cls, name = exports[i]
            extra = ''
            if cls == 'Button':
                ti, tx = label(i)
                extra = f'   label={exports[ti][1] if ti is not None else None}: {tx!r}'
            elif cls == 'TextBlock':
                extra = f'   = {text_of(pmap, i)!r}'
            v = vis_of(pmap, i)
            vs = '' if v == 'Visible*' else f'   VIS={v}'
            print(f'{"  " * depth}{cls:<16} [{i}] {name}{extra}{vs}')
            for c in children.get(i, []):
                walk(c, depth + 1)
        for r in sorted([r for r in roots if r is not None], key=lambda x: order.get(x, 0)):
            walk(r, 0)
            print()

    print('--- BUTTONS (export index order) ---')
    print(f'  {"idx":>4}  {"button":<20} {"visibility":<22} {"textblock":<16} label')
    for i, (cls, name) in enumerate(exports):
        if cls != 'Button':
            continue
        ti, tx = label(i)
        tn = exports[ti][1] if ti is not None else '-'
        print(f'  {i:>4}  {name:<20} {vis_of(pmap, i):<22} {tn:<16} {tx!r}')


if __name__ == '__main__':
    main(sys.argv[1], '--flat' in sys.argv)
