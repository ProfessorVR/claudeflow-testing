#!/usr/bin/env python3
"""log_perf.py <log>... - frame rate and log volume from UE log line prefixes [time][frame].

Prints duration, lines/second, voice-library lines/second, and frames/second per 10 s window
(from the frame counter, which wraps at 1000), plus the command line if logged.
"""
import re
import sys

ts = re.compile(r'^\[\d{4}\.\d\d\.(\d\d)-(\d\d)\.(\d\d)\.(\d\d):(\d{3})\]\[ *(\d+)\]')
for path in sys.argv[1:]:
    first = last = None
    lines = voice = 0
    windows = {}
    prev_frame = None
    frames_total = 0
    cmdline = ''
    with open(path, 'r', errors='replace') as f:
        for line in f:
            if 'LogInit: Command Line:' in line and not cmdline:
                cmdline = line.split('Command Line:', 1)[1].strip()[:160]
            m = ts.match(line)
            if not m:
                continue
            d, h, mi, s, ms, fr = (int(x) for x in m.groups())
            t = ((d * 24 + h) * 60 + mi) * 60 + s + ms / 1000.0
            fr = int(fr)
            if first is None:
                first = t
            last = t
            lines += 1
            if 'LogEmbeddedVoiceChat' in line:
                voice += 1
            if prev_frame is not None and fr != prev_frame:
                step = (fr - prev_frame) % 1000
                frames_total += step
                w = int((t - first) // 10)
                windows[w] = windows.get(w, 0) + step
            prev_frame = fr
    dur = (last - first) if first is not None else 0
    print(f'== {path.rsplit("/", 1)[-1]}')
    print(f'   command line: {cmdline}')
    print(f'   duration {dur:.0f} s, {lines} lines ({lines / max(dur, 1):.0f}/s), voice-library lines {voice} ({voice / max(dur, 1):.0f}/s)')
    fps = ' '.join(f'{windows.get(w, 0) / 10:.0f}' for w in range(int(dur // 10) + 1))
    print(f'   frames/s per 10 s window: {fps}')
