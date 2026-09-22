#!/usr/bin/env python3
"""props_exact.py <file.uasset> <ExportName | #index>... - props.py decode, selecting exports by exact
name (first copy) or by export index as printed by widgettree.py / EXPORT[n] references (#n)."""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import props  # noqa: E402


def show(label, plist):
    print(f'  export {label}')
    for pname, ptype, psize, shown, arr in plist:
        ai = f'[{arr}]' if arr else ''
        if ptype.startswith('StructProperty<WidgetTransform') or ptype.startswith('StructProperty<AnchorData') or 'Translation=' in str(shown):
            pass
        print(f'      {pname + ai:<28} {ptype:<22} [{psize:>5}]  {shown}')


path = sys.argv[1]
everything = None
for want in sys.argv[2:]:
    if want.startswith('#'):
        if everything is None:
            everything = props.decode(path, None, show=False)
        idx = int(want[1:])
        name, plist = everything[idx]
        show(f'#{idx} {name}', plist)
        continue
    for name, plist in props.decode(path, want, show=False):
        if str(name) == want and plist:
            show(name, plist)
            break
