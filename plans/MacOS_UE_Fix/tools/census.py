#!/usr/bin/env python3
"""Census the per-platform player override (TMap<FGuid,FGuid>) across a tree of
StreamMediaSource .uassets. The map is the last thing UBaseMediaSource::Serialize
writes, so it sits at the tail of the media-source export blob."""
import sys, os, struct, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blob import export_entries


def overrides(path):
    """-> (n_entries, [(platform_guid_hex, player_guid_hex)]) or None if unparsable."""
    b, names, exps = export_entries(path)
    # the media-source export is the one whose name matches the package basename
    base = os.path.basename(path)[:-len('.uasset')]
    cand = [e for e in exps if e[0] == base] or [e for e in exps if e[0] != 'PackageMetaData']
    if not cand:
        return None
    name, off, size = cand[-1]
    blob = b[off:off + size]
    if len(blob) < 4:
        return None
    # walk back from the end: count is at len-4-(32*n)
    for n in range(0, 4):
        pos = len(blob) - 4 - 32 * n
        if pos < 0:
            break
        cnt = struct.unpack_from('<I', blob, pos)[0]
        if cnt == n:
            ent = []
            for k in range(n):
                o = pos + 4 + 32 * k
                ent.append((blob[o:o + 16].hex(), blob[o + 16:o + 32].hex()))
            return (n, ent)
    return None


if __name__ == '__main__':
    root = sys.argv[1]
    files = []
    for dp, dn, fn in os.walk(root):
        for f in fn:
            if f.endswith('.uasset'):
                files.append(os.path.join(dp, f))
    files.sort()
    bykind = collections.Counter()
    bydir = collections.defaultdict(collections.Counter)
    bad = []
    noovr = []
    for p in files:
        rel = os.path.relpath(p, root)
        top = rel.split(os.sep)[0]
        try:
            r = overrides(p)
        except Exception as e:
            bad.append((rel, repr(e)))
            bykind['PARSE-ERROR'] += 1
            bydir[top]['PARSE-ERROR'] += 1
            continue
        if r is None:
            bad.append((rel, 'no map found'))
            bykind['NO-MAP'] += 1
            bydir[top]['NO-MAP'] += 1
            continue
        n, ent = r
        key = 'none' if n == 0 else ' | '.join(f'{a}->{b}' for a, b in ent)
        bykind[key] += 1
        bydir[top][key] += 1
        if n == 0:
            noovr.append(rel)

    print(f'ROOT {root}   files={len(files)}')
    print('--- override signatures ---')
    for k, v in bykind.most_common():
        print(f'  {v:4d}  {k}')
    print('--- by top-level dir ---')
    for d in sorted(bydir):
        parts = ', '.join(f'{k}={v}' for k, v in bydir[d].most_common())
        print(f'  {d:28s} {parts}')
    if noovr:
        print(f'--- {len(noovr)} with NO override ---')
        for r in noovr:
            print(f'    {r}')
    if bad:
        print(f'--- {len(bad)} unparsable ---')
        for r, e in bad[:20]:
            print(f'    {r}: {e}')
