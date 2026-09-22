"""UE5 .uasset table parser with EMPIRICALLY DERIVED export stride.

ClassIndex is always at byte 0 of an export entry and ObjectName (FName idx,num)
at byte 16 (UE4ver>=508), so once the stride is known from the table offsets we can
read both without depending on version-flag guesswork.
"""
import struct, sys, collections

TAG = 0x9E2A83C1


class R:
    def __init__(self, b):
        self.b = b; self.p = 0
    def i32(self):
        v = struct.unpack_from('<i', self.b, self.p)[0]; self.p += 4; return v
    def u32(self):
        v = struct.unpack_from('<I', self.b, self.p)[0]; self.p += 4; return v
    def skip(self, n):
        self.p += n
    def fstring(self):
        n = self.i32()
        if n == 0: return ''
        if n > 0:
            s = self.b[self.p:self.p+n-1].decode('utf-8', 'replace'); self.p += n; return s
        n = -n
        s = self.b[self.p:self.p+n*2-2].decode('utf-16-le', 'replace'); self.p += n*2; return s


def parse(path):
    b = open(path, 'rb').read()
    r = R(b)
    assert r.u32() == TAG, 'bad tag'
    legacy = r.i32()
    if legacy != -4: r.i32()
    ue4 = r.i32()
    ue5 = r.i32() if legacy <= -8 else 0
    r.i32()
    r.skip(r.i32() * 20)
    total_header = r.i32()
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

    # import stride, derived
    imp_region = export_off - import_off if export_off > import_off else depends_off - import_off
    imp_stride = imp_region // import_count if import_count else 0
    imports = []
    # layout: ClassPackage FName(0..7), ClassName FName(8..15), OuterIndex(16..19),
    #         ObjectName FName(20..27), [UE5: PackageName FName, bImportOptional]
    for k in range(import_count):
        o = import_off + k * imp_stride
        on_i, on_n = struct.unpack_from('<ii', b, o + 20)
        imports.append(nm(on_i, on_n))

    # export stride, derived
    exp_region = depends_off - export_off
    assert exp_region > 0 and export_count > 0
    exp_stride = exp_region // export_count
    assert exp_region % export_count == 0, f'stride not integral: {exp_region}/{export_count}'

    exports = []
    for k in range(export_count):
        o = export_off + k * exp_stride
        cls = struct.unpack_from('<i', b, o)[0]
        on_i, on_n = struct.unpack_from('<ii', b, o + 16)
        exports.append((cls, nm(on_i, on_n)))

    bad = sum(1 for c, n in exports if n is None)
    assert bad == 0, f'{bad}/{len(exports)} unresolved export names (stride {exp_stride} wrong)'

    def clsname(ci):
        if ci < 0: return imports[-ci-1]
        if ci > 0: return exports[ci-1][1]
        return 'None'

    return dict(ue4=ue4, ue5=ue5, imp_stride=imp_stride, exp_stride=exp_stride,
                names=names, imports=imports,
                exports=[(clsname(c), n) for c, n in exports])


if __name__ == '__main__':
    for path in sys.argv[1:]:
        d = parse(path)
        label = path.split('/')[-1].replace('.uasset', '')
        print(f'===== {label}  (imp_stride={d["imp_stride"]} exp_stride={d["exp_stride"]})')
        print(f'  names={len(d["names"])} imports={len(d["imports"])} exports={len(d["exports"])}')
        cnt = collections.Counter(c for c, n in d['exports'])
        for c, k in cnt.most_common(20):
            print(f'    {k:6d}  {c}')
        print()
