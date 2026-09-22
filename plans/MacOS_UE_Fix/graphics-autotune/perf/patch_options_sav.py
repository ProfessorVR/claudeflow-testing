#!/usr/bin/env python3
"""patch_options_sav.py <in.sav> <out.sav> <index>=<value> ...
Rewrites entries of the AntizeMenuSystem SaveGraphicIndex array (E_TemplateGraphic order: 9 MaxFPS, 10 VSync, 13
ResolutionScale, ...) in a copy of MyOptions.sav. Only same-length replacements are allowed, so every other byte of
the GVAS file stays identical. Used to make profiling saves (e.g. MaxFPS 5 = Unlimited, VSync 0)."""
import struct
import sys

KEY = b"Index_13_A065A4B0493924A4807B0C873EECB234\0"
src, dst, *edits = sys.argv[1:]
want = {int(k): v for k, v in (e.split("=", 1) for e in edits)}
d = bytearray(open(src, "rb").read())
pos, n = 0, 0
while True:
    i = d.find(KEY, pos)
    if i < 0:
        break
    p = i + len(KEY)
    tlen = struct.unpack_from("<i", d, p)[0]
    typ = d[p + 4:p + 4 + tlen].rstrip(b"\0").decode()
    p += 4 + tlen
    params, size, flags = struct.unpack_from("<iiB", d, p)
    p += 9
    vlen = struct.unpack_from("<i", d, p)[0]
    old = d[p + 4:p + 4 + vlen].rstrip(b"\0").decode("latin-1") if vlen > 0 else ""
    if n in want:
        new = want[n].encode("latin-1") + b"\0"
        if vlen != len(new):
            sys.exit(f"entry {n}: '{old}' -> '{want[n]}' changes the length; refusing")
        d[p + 4:p + 4 + vlen] = new
        print(f"entry {n}: '{old}' -> '{want[n]}'")
    pos = p + size
    n += 1
open(dst, "wb").write(bytes(d))
print(f"{n} entries, wrote {dst}")
