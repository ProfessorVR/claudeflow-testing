#!/usr/bin/env python3
"""voice_timeline.py <game log> [bucket seconds]  -  per-bucket voice activity from an awsTutorial log.

Columns (counts per bucket, UTC log time):
  cap   capture callbacks (480-frame blocks from the microphone)
  pk    max microphone peak seen by the voice library ("max recorded volume")
  voice frames the library classed as human voice / drop = "not human voice, dropping"
  txV   encoded voice packets (encoded bytes > 1)   txS  1-byte packets (silence/DTX)
  rxV   received voice packets (got packet size > 1) rxS 1-byte received
  play  playback pulls of received audio (OnGenerateAudio got cached)
  open  "channel is open, processing audio"
plus any line matching connection keywords, printed inline with its time.
"""
import re
import sys
from collections import OrderedDict, defaultdict

path = sys.argv[1]
bucket = float(sys.argv[2]) if len(sys.argv) > 2 else 5.0
ts_re = re.compile(r'^\[(\d{4})\.(\d\d)\.(\d\d)-(\d\d)\.(\d\d)\.(\d\d):(\d{3})\]')
events = re.compile(r'(disconnect|closed|close |timeout|timed out|failed|state|leave|left|onClose|onError|error|reconnect|gotRemoteDescription|onDataChannel|joinGroup|leaveGroup|Opening capture|Capture back-end|LogEmbeddedVoiceChatAEC)', re.I)
noise = re.compile(r'VeryVerbose|not human voice|human voice|LogStreaming|LogShaderCompilers|LogD3D|LogRHI|LogMaterial|LogTexture|LogSlate|LogUObject|LogStats|LogConfig|LogPakFile|LogPlugin|LogInit|LogCsvProfiler|LogAWSCore|LogConsoleResponse|LogWindows|LogAudioMixer|LogNet: Registering')
rows = OrderedDict()
t0 = None
inline = []

def row(t):
    key = int((t - t0) // bucket)
    if key not in rows:
        rows[key] = defaultdict(float)
    return rows[key]

with open(path, 'r', errors='replace') as f:
    for line in f:
        m = ts_re.match(line)
        if not m:
            continue
        y, mo, d, h, mi, s, ms = (int(x) for x in m.groups())
        t = ((d * 24 + h) * 60 + mi) * 60 + s + ms / 1000.0
        if t0 is None:
            t0 = t
        r = row(t)
        if 'captured 480 frames' in line or re.search(r'captured \d+ frames in', line):
            r['cap'] += 1
        elif 'max recorded volume is' in line:
            v = float(line.rsplit(' ', 1)[1])
            r['pk'] = max(r['pk'], v)
        elif 'not human voice' in line:
            r['drop'] += 1
        elif 'human voice' in line:
            r['voice'] += 1
        elif 'encoded bytes:' in line:
            n = int(line.rsplit(' ', 1)[1])
            r['txV' if n > 1 else 'txS'] += 1
        elif 'got packet size:' in line:
            n = int(line.rsplit(' ', 1)[1])
            r['rxV' if n > 1 else 'rxS'] += 1
        elif 'OnGenerateAudio' in line and 'got cached' in line:
            r['play'] += 1
        elif 'channel is open' in line:
            r['open'] += 1
        elif events.search(line) and not noise.search(line):
            inline.append((t - t0, line.strip()[:200]))

cols = ['cap', 'pk', 'voice', 'drop', 'txV', 'txS', 'rxV', 'rxS', 'play', 'open']
print('  t(s) ' + ''.join(f'{c:>7}' for c in cols))
ev = iter(inline)
nxt = next(ev, None)
for key, r in rows.items():
    start = key * bucket
    while nxt and nxt[0] < start + bucket:
        print(f'   >> {nxt[0]:7.1f}s  {nxt[1]}')
        nxt = next(ev, None)
    if not any(r[c] for c in cols):
        continue
    print(f'{start:6.0f} ' + ''.join(f'{r[c]:>7.3f}' if c == 'pk' else f'{int(r[c]):>7d}' for c in cols))
while nxt:
    print(f'   >> {nxt[0]:7.1f}s  {nxt[1]}')
    nxt = next(ev, None)
