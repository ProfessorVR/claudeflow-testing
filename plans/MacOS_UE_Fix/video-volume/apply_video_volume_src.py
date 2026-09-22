#!/usr/bin/env python3
"""Video player volume: copies VideoPlayerVolumeSubsystem.{h,cpp} from src/ into <project>/Source/awsTutorial (CRLF, like
the other project sources). The assets (SC_Video, SM_Video, SC_Master's child list) come from create_assets.py, and
the DefaultEngine.ini line DefaultMediaSoundClassName=.../SC_Video.SC_Video is a separate one-line change.
Usage: apply_video_volume_src.py <project dir>"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
proj = pathlib.Path(sys.argv[1])
if not (proj / "awsTutorial.uproject").is_file():
    sys.exit(f"not a project dir: {proj}")
for name in ["VideoPlayerVolumeSubsystem.h", "VideoPlayerVolumeSubsystem.cpp"]:
    text = (HERE / "src" / name).read_text(encoding="utf-8").replace("\r\n", "\n")
    (proj / "Source/awsTutorial" / name).write_bytes(text.replace("\n", "\r\n").encode("utf-8"))
    print("source", name)
