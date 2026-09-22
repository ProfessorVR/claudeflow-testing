import re,sys
p=sys.argv[1]
lines=open(p,encoding='utf-8',errors='replace').read().splitlines()
idx=[i for i,l in enumerate(lines) if 'Electra player statistics' in l]
want=('URL:','Media duration:','Play position at end:','Bytes of video data streamed:',
      'Bytes of audio data streamed:','Number of times rebuffered:',
      'Currently active resolution:','Current state:')
print(f'{len(idx)} statistics blocks in {p.rsplit("/",1)[-1]}\n')
for i in idx:
    blk=[re.sub(r'^\[[^\]]*\]\[[^\]]*\]','',l).strip() for l in lines[i:i+45]]
    out={}; segs=[]; grab=False
    for s in blk:
        if grab:
            if re.match(r'^\d+\s*:\s*\d+$',s): segs.append(s); continue
            grab=False
        if s.startswith('Number of segments fetched'): grab=True; continue
        for w in want:
            if s.startswith(w): out[w]=s[len(w):].strip()
    print('==',out.get('URL:','?').split('/Dash/')[-1][:80])
    print(f"   dur={out.get('Media duration:')}  endpos={out.get('Play position at end:')}  rebuffer={out.get('Number of times rebuffered:')}")
    print(f"   videoBytes={out.get('Bytes of video data streamed:')}  audioBytes={out.get('Bytes of audio data streamed:')}")
    print(f"   segments={segs}   res={out.get('Currently active resolution:')}")
    print()
