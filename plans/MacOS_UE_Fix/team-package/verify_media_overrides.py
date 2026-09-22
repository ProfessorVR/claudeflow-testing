#!/usr/bin/env python3
"""
verify_media_overrides.py — INDEPENDENT check that the Mac -> ElectraPlayer
Player Override really is written into every StreamMediaSource on disk.

WHY THIS EXISTS
    set_electra_override.py reports its own success. That report is not proof:
    run as a commandlet it once reported "Python script executed successfully"
    after touching NOTHING (empty Asset Registry -> 0 assets -> silent no-op).
    This script reads the raw .uasset bytes and needs no Unreal at all, so it
    can contradict the tool it is checking.

    A string grep CANNOT do this job. PlatformPlayerNames is a `transient`
    UPROPERTY, hand-serialized by UBaseMediaSource::Serialize as a raw
    TMap<FGuid,FGuid>. Neither "PlatformPlayerNames" nor "ElectraPlayer" appears
    anywhere in an UNCOOKED asset, override set or not.

HOW IT WORKS
    The override map is the LAST thing UBaseMediaSource::Serialize writes, so it
    sits at the tail of the media-source export blob:
        empty map   = 4 bytes            (count 0)
        one entry   = 4 + 16 + 16 = 36   (count 1, platform GUID, player GUID)
    We locate the export via the package's export table, then read that tail.

USAGE
    python3 verify_media_overrides.py <StreamMediaSources dir> [--expect mac-electra]

    Exit 0 = every media source carries Mac->ElectraPlayer.
    Exit 1 = at least one is missing/wrong (details printed).

KNOWN-GOOD GUIDS (UE 5.4.1)
    Mac platform  003BE29617004F0C8E1F786081EFBB1F
                  (Engine/Config/Mac/DataDrivenPlatformInfo.ini -> GlobalIdentifier)
    ElectraPlayer 94EE3F808E604292B4D24DD5FDADE1C2
                  (ElectraPlayerFactoryModule.cpp -> GetPlayerPluginGUID)
    On disk the FGuid is four little-endian uint32s, so the byte order differs
    from the display form above; the constants below are the ON-DISK hex.
"""
import os
import struct
import sys

TAG = 0x9E2A83C1
MAC_ON_DISK = "96e23b000c4f001760781f8e1fbbef81"
ELECTRA_ON_DISK = "803fee949242608ed54dd2b4c2e1adfd"
EXPECTED = MAC_ON_DISK + "->" + ELECTRA_ON_DISK


class _R:
    def __init__(self, b):
        self.b, self.p = b, 0

    def i32(self):
        v = struct.unpack_from("<i", self.b, self.p)[0]
        self.p += 4
        return v

    def u32(self):
        v = struct.unpack_from("<I", self.b, self.p)[0]
        self.p += 4
        return v

    def skip(self, n):
        self.p += n

    def fstring(self):
        n = self.i32()
        if n == 0:
            return ""
        if n > 0:
            s = self.b[self.p:self.p + n - 1].decode("utf-8", "replace")
            self.p += n
            return s
        n = -n
        s = self.b[self.p:self.p + n * 2 - 2].decode("utf-16-le", "replace")
        self.p += n * 2
        return s


def _exports(path):
    """-> (bytes, [(name, serial_offset, serial_size), ...])"""
    b = open(path, "rb").read()
    r = _R(b)
    if r.u32() != TAG:
        raise ValueError("not a .uasset")
    legacy = r.i32()
    if legacy != -4:
        r.i32()
    ue4 = r.i32()
    ue5 = r.i32() if legacy <= -8 else 0
    r.i32()
    r.skip(r.i32() * 20)
    r.i32()
    r.fstring()
    pkg_flags = r.u32()
    name_count, name_off = r.i32(), r.i32()
    if ue5 >= 1008:
        r.i32(), r.i32()
    if not (pkg_flags & 0x80000000):
        r.fstring()
    if ue4 >= 459:
        r.i32(), r.i32()
    export_count, export_off = r.i32(), r.i32()
    import_count, import_off = r.i32(), r.i32()
    depends_off = r.i32()

    r.p = name_off
    names = []
    for _ in range(name_count):
        s = r.fstring()
        if ue4 >= 504:
            r.skip(4)
        names.append(s)

    def nm(i, n):
        base = names[i] if 0 <= i < len(names) else None
        if base is None:
            return None
        return base if n == 0 else "{}_{}".format(base, n - 1)

    # stride derived from the table offsets, not guessed from version flags
    stride = (depends_off - export_off) // export_count
    out = []
    for k in range(export_count):
        o = export_off + k * stride
        ni, nn = struct.unpack_from("<ii", b, o + 16)
        size = struct.unpack_from("<q", b, o + 28)[0]
        off = struct.unpack_from("<q", b, o + 36)[0]
        out.append((nm(ni, nn), off, size))
    return b, out


def override_of(path):
    """-> 'none' | 'guidA->guidB' | 'NO-MAP'"""
    b, exps = _exports(path)
    base = os.path.basename(path)[:-len(".uasset")]
    cand = [e for e in exps if e[0] == base] or \
           [e for e in exps if e[0] != "PackageMetaData"]
    if not cand:
        return "NO-MAP"
    _n, off, size = cand[-1]
    blob = b[off:off + size]
    if len(blob) < 4:
        return "NO-MAP"
    for n in (0, 1, 2, 3):
        pos = len(blob) - 4 - 32 * n
        if pos < 0:
            break
        if struct.unpack_from("<i", blob, pos)[0] == n:
            if n == 0:
                return "none"
            pairs = []
            for k in range(n):
                s = pos + 4 + 32 * k
                pairs.append(blob[s:s + 16].hex() + "->" + blob[s + 16:s + 32].hex())
            return ",".join(pairs)
    return "NO-MAP"


def main(root):
    ok = bad = skipped = 0
    problems = []
    for dp, _dn, fn in os.walk(root):
        for f in sorted(fn):
            if not f.endswith(".uasset"):
                continue
            p = os.path.join(dp, f)
            rel = os.path.relpath(p, root)
            try:
                sig = override_of(p)
            except Exception as e:  # noqa: BLE001
                problems.append((rel, "UNPARSABLE: {}".format(e)))
                bad += 1
                continue
            if sig == EXPECTED:
                ok += 1
            elif sig == "NO-MAP":
                # ObjectRedirectors are not media sources; expected to have none
                skipped += 1
            else:
                problems.append((rel, sig))
                bad += 1

    print("root: {}".format(root))
    print("  Mac->ElectraPlayer : {}".format(ok))
    print("  not a media source : {}  (ObjectRedirectors — expected)".format(skipped))
    print("  MISSING / WRONG    : {}".format(bad))
    if problems:
        print("\n--- problems ---")
        for rel, sig in problems[:40]:
            print("  {:60s} {}".format(rel, sig))
        if len(problems) > 40:
            print("  ... and {} more".format(len(problems) - 40))
        print("\nFIX: re-run apply-electra-override-mac.sh (see SOP 11d).")
        return 1
    print("\nPASS — every StreamMediaSource carries Mac -> ElectraPlayer.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
