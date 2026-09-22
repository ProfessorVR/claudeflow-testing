#!/usr/bin/env python3
"""label_layout.py <WidgetBlueprint.uasset>... - where the 'Procedures'/'Interviews' selector buttons render.

For each widget: find the Button whose label TextBlock says Procedures/Interviews, walk up its parents to
the first CanvasPanelSlot, and report that slot's anchors/offsets/alignment plus every RenderTransform
translation on the way. Then compute the buttons' left edge relative to screen centre and the minimum
layout width (UI units) at which the left edge stays on screen.
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blob as blobmod  # noqa: E402
import props  # noqa: E402


def doubles_after(blk, name_idx, count):
    """Raw doubles of a struct property value whose tag starts with FName(name_idx)."""
    pat = struct.pack('<ii', name_idx, 0)
    p = blk.find(pat)
    if p < 0:
        return None
    # tag: name(8) type-name tree ... size(4) flags(1) value; locate the 0x10/0x20-sized value by scanning
    for k in range(p + 8, min(p + 90, len(blk) - 8 * count)):
        vals = struct.unpack_from('<' + 'd' * count, blk, k)
        if all(abs(v) < 1e5 for v in vals) and any(abs(v) > 1e-6 for v in vals) and blk[k - 1] in (0x08, 0x00):
            size = struct.unpack_from('<i', blk, k - 5)[0]
            if size == 8 * count:
                return vals
    return None


def analyse(path):
    b, names, nm, imports = props.read_tables(path)
    _b, _n, exps = blobmod.export_entries(path)
    res = props.decode(path, None, show=False)
    byname = {}
    for i, (name, plist) in enumerate(res):
        byname.setdefault(str(name), []).append(i)

    def prop(i, key):
        for p in res[i][1]:
            if p[0] == key:
                return p[3]
        return None

    def ref(i, key):
        v = prop(i, key)
        if v and v.startswith('EXPORT['):
            return int(v[7:v.index(']')])
        return None

    tr_idx = names.index('Translation') if 'Translation' in names else -1
    out = []
    for label in ('Procedures', 'Interviews'):
        tb = None
        for i, (name, plist) in enumerate(res):
            if str(name).startswith('TextBlock') and any(p[0] == 'Text' and p[3].endswith(label) for p in plist):
                tb = i
                break
        if tb is None:
            out.append(f'   {label}: no TextBlock')
            continue
        chain = []
        node = tb
        shift_x = 0.0
        canvas = None
        for _ in range(12):
            slot = ref(node, 'Slot')
            name = str(res[node][0])
            off, size = exps[node][1], exps[node][2]
            t = doubles_after(b[off:off + size], tr_idx, 2) if prop(node, 'RenderTransform') else None
            if t:
                shift_x += t[0]
                chain.append(f'{name} translate=({t[0]:.1f},{t[1]:.1f})')
            else:
                chain.append(name)
            if slot is None:
                break
            sname = str(res[slot][0])
            if sname.startswith('CanvasPanelSlot') and canvas is None:
                canvas = (slot, node)
            node = ref(slot, 'Parent')
            if node is None:
                break
        info = f'   {label}: ' + ' <- '.join(chain)
        if canvas:
            ld = prop(canvas[0], 'LayoutData') or ''
            info += f'\n      canvas slot of {res[canvas[1]][0]}: {ld[:160]}'
        out.append(info)
    return out


for path in sys.argv[1:]:
    print(f'== {os.path.basename(path)}')
    try:
        for line in analyse(path):
            print(line)
    except Exception as exc:  # keep going across assets
        print(f'   !! {exc}')
