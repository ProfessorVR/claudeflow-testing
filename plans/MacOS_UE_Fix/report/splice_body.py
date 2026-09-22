#!/usr/bin/env python3
"""Rebuild paraguay-widget-forensics.html from body_v2.html, keeping the <head>+<style> block.

Run from this directory:  python3 splice_body.py
Then republish paraguay-widget-forensics.html to the SAME artifact URL:
  https://claude.ai/code/artifact/5542fb4f-8efc-4ed9-9f66-ae7b09c576fd
"""
import os

here = os.path.dirname(os.path.abspath(__file__))
page = os.path.join(here, 'paraguay-widget-forensics.html')
body = os.path.join(here, 'body_v2.html')

text = open(page).read()
new_body = open(body).read()

marker = '</style>'
i = text.index(marker) + len(marker)

out = text[:i] + '\n' + new_body
open(page, 'w').write(out)
print('rebuilt:', len(out), 'bytes;', out.count('\n') + 1, 'lines')
