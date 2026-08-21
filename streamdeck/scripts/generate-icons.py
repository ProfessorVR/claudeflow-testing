#!/usr/bin/env python3
"""Generate static 144x144 PNG icons for Stream Deck MCP integration."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os

ICONS_DIR = Path("/home/dalton/projects/claudeflow-testing/streamdeck/icons")
ICONS_DIR.mkdir(exist_ok=True)

FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
font_path = None
for fp in FONT_PATHS:
    if os.path.exists(fp):
        font_path = fp
        break

def make_icon(name, text, bg_color, text_color="#ffffff", text2=None):
    img = Image.new("RGB", (144, 144), bg_color)
    draw = ImageDraw.Draw(img)

    if font_path:
        if len(text) <= 4:
            font = ImageFont.truetype(font_path, 36)
        elif len(text) <= 7:
            font = ImageFont.truetype(font_path, 28)
        else:
            font = ImageFont.truetype(font_path, 22)
        small_font = ImageFont.truetype(font_path, 18)
    else:
        font = ImageFont.load_default()
        small_font = font

    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    y_offset = -10 if text2 else 0
    draw.text(((144 - w) / 2, (144 - h) / 2 + y_offset), text, fill=text_color, font=font)

    if text2:
        bbox2 = draw.textbbox((0, 0), text2, font=small_font)
        w2 = bbox2[2] - bbox2[0]
        draw.text(((144 - w2) / 2, (144 + h) / 2 + 5), text2, fill=text_color, font=small_font)

    img.save(str(ICONS_DIR / f"{name}.png"))

# Color palette
CYAN = "#00c8ff"
PURPLE = "#7b2fff"
GREEN = "#00ff88"
RED = "#ff3355"
ORANGE = "#ff6b35"
YELLOW = "#ffcc00"
DARK = "#1a1a2e"

# Page 1: Default
make_icon("status", "STATUS", CYAN)
make_icon("ask", "ASK", CYAN)
make_icon("code", "CODE", CYAN)
make_icon("research", "RESEARCH", CYAN)
make_icon("write", "WRITE", CYAN)
make_icon("learn", "LEARN", PURPLE)
make_icon("query", "QUERY", PURPLE)
make_icon("pdf-scan", "PDF", PURPLE, text2="SCAN")
make_icon("complete", "COMPLETE", PURPLE)
make_icon("abort", "ABORT", RED)
make_icon("start", "START", GREEN, text_color="#000000")
make_icon("stop", "STOP", RED)
make_icon("dash", "DASH", ORANGE)
make_icon("sitrep", "SITREP", ORANGE)
make_icon("costs", "COSTS", ORANGE)

# Page 2: Pipeline-active
make_icon("progress", "0/0", DARK, text2="IDLE")
make_icon("stage", "STAGE", DARK)
make_icon("sona-kill", "SONA", RED, text2="KILL")
make_icon("ucm-flush", "UCM", YELLOW, text_color="#000000", text2="FLUSH")

# Page 3: Research variants
make_icon("local-research", "LOCAL", CYAN, text2="RESEARCH")
make_icon("grounded-research", "GROUND", CYAN, text2="RESEARCH")
make_icon("hybrid-research", "HYBRID", CYAN, text2="RESEARCH")
make_icon("learn-compile", "LEARN", PURPLE, text2="COMPILE")
make_icon("learn-verify", "LEARN", PURPLE, text2="VERIFY")
make_icon("learn-update", "LEARN", PURPLE, text2="UPDATE")

# Page 4: Feedback
make_icon("feedback-perfect", "1.0", GREEN, text_color="#000000", text2="PERFECT")
make_icon("feedback-good", "0.8", "#00c8ff", text2="GOOD")
make_icon("feedback-meh", "0.5", YELLOW, text_color="#000000", text2="MEH")
make_icon("feedback-poor", "0.2", ORANGE, text2="POOR")
make_icon("feedback-fail", "0.0", RED, text2="FAIL")
make_icon("quality", "QUALITY", ORANGE)
make_icon("analytics", "ANALYTICS", ORANGE)

# Navigation
make_icon("page1", "PAGE 1", DARK, text2="DEFAULT")

# Health status variants (for SSE watcher)
make_icon("status-green", "OK", GREEN, text_color="#000000")
make_icon("status-red", "DOWN", RED)

print(f"Generated {len(list(ICONS_DIR.glob('*.png')))} icons in {ICONS_DIR}")
