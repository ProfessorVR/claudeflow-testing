#!/usr/bin/env python3
"""Decode UE 5.4 tagged properties from an export blob of an uncooked .uasset.

UE 5.4 reworked FPropertyTag. Layout observed empirically in this project's
packages (engine 5.4.1, UE4Ver 522 / UE5Ver 1012):

    FName   Name
    FName   TypeName            <- FPropertyTypeName ...
    int32   ParameterCount      <- ... plus its parameter list (recursive)
    int32   Size
    uint8   Flags               <- EPropertyTagFlags
              0x01 HasArrayIndex    -> int32 ArrayIndex follows
              0x02 HasPropertyGuid  -> FGuid (16 B) follows
              0x08 BoolTrue         -> value of a BoolProperty, no payload
    <Size bytes of value>

terminated by the FName "None". Export blobs carry ONE leading byte before the
first tag; the reader auto-detects it rather than assuming.

Object values are FPackageIndex int32: <0 import, >0 export, 0 null. Imports are
resolved through their OuterIndex chain, so an actor pointer reports both the
object path AND its class -- the class is what says which station it really is.

Usage: props.py <file.uasset> [exportNameSubstring]
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uasset2
import blob as blobmod


def read_tables(path):
    b = open(path, 'rb').read()
    r = uasset2.R(b)
    assert r.u32() == uasset2.TAG, 'bad tag'
    legacy = r.i32()
    if legacy != -4:
        r.i32()
    ue4 = r.i32()
    ue5 = r.i32() if legacy <= -8 else 0
    r.i32()
    r.skip(r.i32() * 20)
    r.i32()
    r.fstring()
    pf = r.u32()
    nc, no = r.i32(), r.i32()
    if ue5 >= 1008:
        r.i32(), r.i32()
    if not (pf & 0x80000000):
        r.fstring()
    if ue4 >= 459:
        r.i32(), r.i32()
    ec, eo = r.i32(), r.i32()
    ic, io = r.i32(), r.i32()
    do = r.i32()

    r.p = no
    names = []
    for _ in range(nc):
        s = r.fstring()
        if ue4 >= 504:
            r.skip(4)
        names.append(s)

    def nm(i, n):
        base = names[i] if 0 <= i < len(names) else f'<bad {i}>'
        return base if n == 0 else f'{base}_{n-1}'

    istride = (eo - io) // ic if ic else 0
    imports = []
    for k in range(ic):
        o = io + k * istride
        imports.append(dict(
            cls=nm(*struct.unpack_from('<ii', b, o + 8)),
            outer=struct.unpack_from('<i', b, o + 16)[0],
            name=nm(*struct.unpack_from('<ii', b, o + 20)),
        ))
    return b, names, nm, imports


def full_path(imports, idx, depth=0):
    if depth > 16 or not (0 <= idx < len(imports)):
        return '?'
    e = imports[idx]
    s = e['name']
    if e['outer'] < 0:
        s = full_path(imports, -e['outer'] - 1, depth + 1) + '.' + s
    return s


def decode(path, want=None, show=True):
    b, names, nm, imports = read_tables(path)
    d = uasset2.parse(path)
    expnames = [n for _c, n in d['exports']]
    _b2, _n2, exps = blobmod.export_entries(path)

    def resolve(pkgidx):
        if pkgidx < 0:
            i = -pkgidx - 1
            if not (0 <= i < len(imports)):
                return f'IMPORT[{i}] <out of range>'
            return f'{full_path(imports, i)}   [class {imports[i]["cls"]}]'
        if pkgidx > 0:
            i = pkgidx - 1
            return f'EXPORT[{i}] {expnames[i] if i < len(expnames) else "?"}'
        return '(null)'

    def fname(off):
        i, n = struct.unpack_from('<ii', b, off)
        return nm(i, n), off + 8

    def parse_typename(off, depth=0):
        tn, off = fname(off)
        cnt = struct.unpack_from('<i', b, off)[0]
        off += 4
        if depth >= 4 or not (0 <= cnt <= 4):
            return tn, off
        params = []
        for _ in range(cnt):
            sub, off = parse_typename(off, depth + 1)
            params.append(sub)
        return (tn + ('<' + ','.join(params) + '>' if params else '')), off

    def parse_block(p, end, depth=0):
        props = []
        guard = 0
        while p < end and guard < 500:
            guard += 1
            try:
                pname, p2 = fname(p)
                if pname == 'None':
                    break
                ptype, p3 = parse_typename(p2)
                psize = struct.unpack_from('<i', b, p3)[0]
                flags = b[p3 + 4]
                p4 = p3 + 5
                arr = 0
                if flags & 0x01:
                    arr = struct.unpack_from('<i', b, p4)[0]
                    p4 += 4
                if flags & 0x02:
                    p4 += 16
            except (struct.error, IndexError):
                break
            if psize < 0 or p4 + psize > end:
                props.append((pname, ptype, psize, f'<overrun flags=0x{flags:02x}>', 0))
                break
            val = b[p4:p4 + psize]
            base = ptype.split('<')[0]
            if base == 'StructProperty' and depth < 3 and psize >= 8:
                try:
                    first, _ = fname(p4)
                    sub = parse_block(p4, p4 + psize, depth + 1) if (
                        first in names and not first.startswith('<bad')) else []
                except (struct.error, IndexError, RecursionError):
                    sub = []
                if sub:
                    inner = '; '.join(f'{a}={dsp}' for a, _t, _s, dsp, _i in sub)
                    props.append((pname, ptype, psize, '{' + inner + '}', arr))
                    p = p4 + psize
                    continue
            if base in ('ObjectProperty', 'ClassProperty', 'InterfaceProperty') and psize >= 4:
                shown = resolve(struct.unpack_from('<i', val, 0)[0])
            elif base == 'BoolProperty':
                shown = str(bool(flags & 0x08))
            elif base in ('NameProperty', 'EnumProperty') and psize >= 8:
                shown = nm(*struct.unpack_from('<ii', val, 0))
            elif base == 'StrProperty' and psize >= 4:
                n = struct.unpack_from('<i', val, 0)[0]
                if n > 0:
                    shown = val[4:4 + n - 1].decode('utf-8', 'replace')
                elif n < 0:
                    shown = val[4:4 + (-n) * 2 - 2].decode('utf-16-le', 'replace')
                else:
                    shown = ''
            elif base == 'IntProperty' and psize >= 4:
                shown = str(struct.unpack_from('<i', val, 0)[0])
            elif base == 'FloatProperty' and psize >= 4:
                shown = str(round(struct.unpack_from('<f', val, 0)[0], 4))
            elif base == 'TextProperty':
                txt = [s.decode('utf-8', 'replace') for s in val.split(b'\x00') if len(s) > 1]
                shown = ' | '.join(txt) if txt else val[:40].hex()
            elif base in ('ArrayProperty', 'SetProperty'):
                shown = val.hex()            # never truncate: callers decode these
            else:
                shown = val[:40].hex() + ('…' if psize > 40 else '')
            props.append((pname, ptype, psize, shown, arr))
            p = p4 + psize
        return props

    results = []
    for name, off, size in exps:
        if want and want not in str(name):
            continue
        # auto-detect the leading byte
        best = None
        for start in (off, off + 1):
            try:
                first, _ = fname(start)
            except struct.error:
                continue
            if first in names and first != '' and not first.startswith('<bad'):
                best = start
                break
        results.append((name, parse_block(best if best is not None else off, off + size)))

    if show:
        print(f'== {os.path.basename(path)}')
        for name, props in results:
            if not props:
                continue
            print(f'  export {name}')
            for pname, ptype, psize, shown, arr in props:
                ai = f'[{arr}]' if arr else ''
                print(f'      {pname+ai:<28} {ptype:<22} [{psize:>5}]  {shown}')
    return results


if __name__ == '__main__':
    decode(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
