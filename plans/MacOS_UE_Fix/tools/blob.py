#!/usr/bin/env python3
"""Extract each export's serialized blob from a .uasset (UE5), print tail bytes.

The Mac->ElectraPlayer override lives in UBaseMediaSource::Serialize's raw
TMap<FGuid,FGuid>, written AFTER the tagged-property block, i.e. at the very end
of the export blob. Empty map = 4 bytes (count 0); one entry = 4+16+16 = 36.
"""
import struct, sys, os
sys.path.insert(0, '/home/dalton/projects/claudeflow-testing/plans/MacOS_UE_Fix/tools')
import uasset2

TAG = 0x9E2A83C1


def export_entries(path):
    b = open(path, 'rb').read()
    r = uasset2.R(b)
    assert r.u32() == TAG
    legacy = r.i32()
    if legacy != -4: r.i32()
    ue4 = r.i32()
    ue5 = r.i32() if legacy <= -8 else 0
    r.i32()
    r.skip(r.i32() * 20)
    r.i32()
    r.fstring()
    pkg_flags = r.u32()
    name_count, name_off = r.i32(), r.i32()
    if ue5 >= 1008: r.i32(); r.i32()
    if not (pkg_flags & 0x80000000): r.fstring()
    if ue4 >= 459: r.i32(); r.i32()
    export_count, export_off = r.i32(), r.i32()
    import_count, import_off = r.i32(), r.i32()
    depends_off = r.i32()

    r.p = name_off
    names = []
    for _ in range(name_count):
        s = r.fstring()
        if ue4 >= 504: r.skip(4)
        names.append(s)

    def nm(i, n):
        base = names[i] if 0 <= i < len(names) else None
        if base is None: return None
        return base if n == 0 else f'{base}_{n-1}'

    stride = (depends_off - export_off) // export_count
    out = []
    for k in range(export_count):
        o = export_off + k * stride
        on_i, on_n = struct.unpack_from('<ii', b, o + 16)
        size = struct.unpack_from('<q', b, o + 28)[0]
        off = struct.unpack_from('<q', b, o + 36)[0]
        out.append((nm(on_i, on_n), off, size))
    return b, names, out


if __name__ == '__main__':
    tail = int(os.environ.get('TAIL', '48'))
    for path in sys.argv[1:]:
        b, names, exps = export_entries(path)
        print(f'== {path}  ({len(b):,} B, {len(exps)} exports)')
        for name, off, size in exps:
            blob = b[off:off+size]
            print(f'   export {name!r} off={off} size={size}')
            print(f'     tail[{tail}] = {blob[-tail:].hex()}')
