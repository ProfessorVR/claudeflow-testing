#!/usr/bin/env python3
"""Extract the StreamUrl of every StreamMediaSource and classify by container."""
import sys, os, re, collections

root = sys.argv[1]
rows = []
for dp, dn, fn in os.walk(root):
    for f in sorted(fn):
        if not f.endswith('.uasset'):
            continue
        p = os.path.join(dp, f)
        b = open(p, 'rb').read()
        urls = re.findall(rb'https?://[\x20-\x7e]{4,300}', b)
        # strip trailing NUL-padding artefacts
        u = urls[0].decode() if urls else ''
        u = u.split('\x00')[0]
        rows.append((os.path.relpath(p, root), u, len(urls)))

bytop = collections.defaultdict(collections.Counter)
for rel, u, n in rows:
    top = rel.split(os.sep)[0]
    if u.endswith('.mpd'):
        kind = 'mpd(DASH)'
    elif u.endswith('.m3u8'):
        kind = 'm3u8(HLS)'
    elif u.endswith('.mp4'):
        kind = 'mp4'
    elif u == '':
        kind = 'EMPTY-URL'
    else:
        kind = 'other:' + (u.rsplit('.', 1)[-1][:12] if '.' in u else '?')
    bytop[top][kind] += 1

print(f'ROOT {root}  n={len(rows)}')
tot = collections.Counter()
for d in sorted(bytop):
    parts = ', '.join(f'{k}={v}' for k, v in bytop[d].most_common())
    print(f'  {d:28s} {parts}')
    tot.update(bytop[d])
print('  ' + '-' * 60)
print('  TOTAL', dict(tot))

if len(sys.argv) > 2:
    pat = sys.argv[2]
    print(f'\n--- sample URLs matching {pat!r} ---')
    n = 0
    for rel, u, cnt in rows:
        if pat in rel:
            print(f'  {rel}\n      {u}')
            n += 1
            if n >= int(os.environ.get('N', '25')):
                break
