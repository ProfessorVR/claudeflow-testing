#!/usr/bin/env python3
"""Find the single inserted byte-run between two otherwise-identical files."""
import sys, uuid

a = open(sys.argv[1], 'rb').read()
b = open(sys.argv[2], 'rb').read()
print(f"A {len(a):,} B  {sys.argv[1]}")
print(f"B {len(b):,} B  {sys.argv[2]}")
delta = len(b) - len(a)
print(f"delta = {delta:+d} bytes")

# common prefix
p = 0
while p < min(len(a), len(b)) and a[p] == b[p]:
    p += 1
# common suffix
s = 0
while s < min(len(a), len(b)) - p and a[len(a)-1-s] == b[len(b)-1-s]:
    s += 1
print(f"common prefix = {p} bytes (first difference at offset {p} = 0x{p:x})")
print(f"common suffix = {s} bytes")
print(f"differing middle: A[{p}:{len(a)-s}] = {len(a)-s-p} bytes ; B[{p}:{len(b)-s}] = {len(b)-s-p} bytes")

ma = a[p:len(a)-s]
mb = b[p:len(b)-s]
print(f"\nA middle ({len(ma)} B): {ma.hex()}")
print(f"B middle ({len(mb)} B): {mb.hex()}")

def guids(buf, label):
    if len(buf) % 16 == 0 and len(buf) >= 16:
        print(f"\n{label} as 16-byte groups:")
        for i in range(0, len(buf), 16):
            g = buf[i:i+16]
            # UE FGuid = 4 x uint32 little-endian, printed A-B-C-D uppercase hex
            import struct
            A, B_, C, D = struct.unpack('<4I', g)
            print(f"  [{i:3d}] raw={g.hex()}  FGuid={A:08X}{B_:08X}{C:08X}{D:08X}")

guids(ma, "A middle")
guids(mb, "B middle")
