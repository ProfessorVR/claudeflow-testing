"""Read each export's serialized tagged-property blob and pull out resolvable FNames.
Used to see which member/variable names a given node class references."""
import struct, sys, collections
import uasset2


def tables(path):
    b = open(path, 'rb').read()
    r = uasset2.R(b)
    r.u32(); legacy = r.i32()
    if legacy != -4: r.i32()
    ue4 = r.i32(); ue5 = r.i32() if legacy <= -8 else 0
    r.i32(); r.skip(r.i32() * 20); r.i32(); r.fstring(); pf = r.u32()
    nc, no = r.i32(), r.i32()
    if ue5 >= 1008: r.i32(); r.i32()
    if not (pf & 0x80000000): r.fstring()
    if ue4 >= 459: r.i32(); r.i32()
    ec, eo = r.i32(), r.i32(); ic, io = r.i32(), r.i32(); do = r.i32()
    return b, ue4, nc, no, ec, eo, ic, io, do


def run(path, want_class, topn=40):
    b, ue4, nc, no, ec, eo, ic, io, do = tables(path)
    d = uasset2.parse(path)
    names = d['names']
    stride = (do - eo) // ec
    hits = collections.Counter()
    blobs = 0
    for k in range(ec):
        cls, nm = d['exports'][k]
        if cls != want_class:
            continue
        o = eo + k * stride
        size = struct.unpack_from('<q', b, o + 28)[0]
        off = struct.unpack_from('<q', b, o + 36)[0]
        blobs += 1
        data = b[off:off + size]
        # scan for plausible FName pairs (idx, number) and keep resolvable ones
        for p in range(0, max(0, len(data) - 8), 4):
            i, n = struct.unpack_from('<ii', data, p)
            if 0 <= i < nc and 0 <= n < 4096:
                s = names[i]
                if len(s) >= 4 and not s.startswith('/'):
                    hits[s] += 1
    return blobs, hits


if __name__ == '__main__':
    path, cls = sys.argv[1], sys.argv[2]
    blobs, hits = run(path, cls)
    print(f'{path.split("/")[-1]}  class={cls}  nodes={blobs}')
    for s, c in hits.most_common(int(sys.argv[3]) if len(sys.argv) > 3 else 30):
        print(f'   {c:6d}  {s}')
