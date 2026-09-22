#!/usr/bin/env python3
"""voice_crosscheck.py <macLog> <winLog> [bucket s]  -  both directions of a two-machine voice session, UTC-aligned.

Per bucket: each side's microphone peak ("max recorded volume") next to the OTHER side's decoded
received-audio peak ("audio data is NOT empty. max data is") and received voice-packet count.
If a mic has speech but the far side's decoded peak stays low, the audio was lost in between.
"""
import re
import sys
from collections import defaultdict

ts = re.compile(r'^\[(\d{4})\.(\d\d)\.(\d\d)-(\d\d)\.(\d\d)\.(\d\d):(\d{3})\]')
bucket = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0

def scan(path):
    out = defaultdict(lambda: defaultdict(float))
    with open(path, 'r', errors='replace') as f:
        for line in f:
            m = ts.match(line)
            if not m:
                continue
            _, _, d, h, mi, s, ms = (int(x) for x in m.groups())
            t = ((d * 24 + h) * 60 + mi) * 60 + s + ms / 1000.0
            k = int(t // bucket)
            if 'max recorded volume is' in line:
                out[k]['mic'] = max(out[k]['mic'], float(line.rsplit(' ', 1)[1]))
            elif 'max data is' in line:
                out[k]['rx'] = max(out[k]['rx'], float(line.rsplit(' ', 1)[1]))
            elif 'got packet size:' in line and int(line.rsplit(' ', 1)[1]) > 1:
                out[k]['rxV'] += 1
    return out

mac, win = scan(sys.argv[1]), scan(sys.argv[2])
keys = sorted(k for k in set(mac) | set(win) if (mac[k]['mic'] or win[k]['mic']))
print('UTC       |  MAC mic -> WIN decoded (pkts) |  WIN mic -> MAC decoded (pkts)')
for k in keys:
    t = k * bucket
    hh, mm, ss = int(t // 3600) % 24, int(t // 60) % 60, int(t % 60)
    print(f'{hh:02d}:{mm:02d}:{ss:02d}  |  {mac[k]["mic"]:7.3f} -> {win[k]["rx"]:7.3f} ({int(win[k]["rxV"]):4d})  |  '
          f'{win[k]["mic"]:7.3f} -> {mac[k]["rx"]:7.3f} ({int(mac[k]["rxV"]):4d})')
