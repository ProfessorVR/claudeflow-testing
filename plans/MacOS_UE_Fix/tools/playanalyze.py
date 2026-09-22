#!/usr/bin/env python3
"""Per-media playback report from an Electra-verbose UE log.

For every FElectraPlayer instance: the URL it opened, when SetRate(1) was
issued, how far the play position actually got, and the wall-clock window it
had to get there. A stream whose position advance is far below its wall-clock
window was reporting playback while its clock stood still.
"""
import re
import sys
from datetime import datetime

path = sys.argv[1]
T = re.compile(r'\[2026\.(\d\d)\.(\d\d)-(\d\d)\.(\d\d)\.(\d\d):(\d\d\d)\]')
OPEN = re.compile(r'\[([0-9A-F]{16})\]\[([0-9A-F]{16})\] IMediaPlayer::Open\((http[^)]*)\)')
START = re.compile(r'\[([0-9A-F]{16})\]\[([0-9A-F]{16})\] Playback (started|resumed) at play position ([\d.]+)')
STOP = re.compile(r'\[([0-9A-F]{16})\]\[([0-9A-F]{16})\] Playback stopped\. Last play position ([\d.]+)')
JUMP = re.compile(r'\[([0-9A-F]{16})\]\[([0-9A-F]{16})\] Jump in play position from ([\d.]+) to ([\d.]+)')
SEEK = re.compile(r'\[([0-9A-F]{16})\] IMediaControls::Seek\(\) to \+(\S+)')


def ts(line):
    m = T.search(line)
    if not m:
        return None
    mo, d, h, mi, s, ms = (int(x) for x in m.groups())
    return datetime(2026, mo, d, h, mi, s, ms * 1000)


players = {}
order = []
for line in open(path, encoding='utf-8', errors='replace'):
    t = ts(line)
    m = OPEN.search(line)
    if m:
        h = m.group(1)
        players[h] = dict(url=m.group(3), open=t, starts=[], stop=None, jumps=[], seeks=0)
        order.append(h)
        continue
    m = START.search(line)
    if m and m.group(1) in players:
        players[m.group(1)]['starts'].append((t, m.group(3), float(m.group(4))))
        continue
    m = STOP.search(line)
    if m and m.group(1) in players:
        players[m.group(1)]['stop'] = (t, float(m.group(3)))
        continue
    m = JUMP.search(line)
    if m and m.group(1) in players:
        players[m.group(1)]['jumps'].append((t, float(m.group(3)), float(m.group(4))))

print(f'{len(order)} media opened\n')
for h in order:
    p = players[h]
    url = p['url'].split('/Dash/')[-1]
    print(f'== {url}')
    first = p['starts'][0] if p['starts'] else None
    if not first:
        print('     never started (no SetRate(1) / playback start)\n')
        continue
    print(f'     opened {p["open"].strftime("%H:%M:%S.%f")[:-3]}   '
          f'first play {first[0].strftime("%H:%M:%S.%f")[:-3]} at pos {first[2]:.3f}')
    for jt, a, b in p['jumps']:
        print(f'     SEEK  {jt.strftime("%H:%M:%S.%f")[:-3]}  position was {a:.3f} -> jumped to {b:.3f}'
              + ('     <-- position had NOT advanced' if a < 0.5 else ''))
    if p['stop']:
        st, pos = p['stop']
        # untouched window = first play -> first seek (or stop if no seek)
        endt = p['jumps'][0][0] if p['jumps'] else st
        endpos = p['jumps'][0][1] if p['jumps'] else pos
        wall = (endt - first[0]).total_seconds()
        adv = endpos - first[2]
        verdict = 'ADVANCING' if wall > 1.0 and adv > 0.5 * wall else (
            'STALLED' if wall > 1.5 else 'too short to judge')
        print(f'     untouched window: {wall:5.2f}s wall  ->  {adv:6.3f}s of media   [{verdict}]')
        print(f'     stopped {st.strftime("%H:%M:%S.%f")[:-3]} at pos {pos:.3f}')
    print()
