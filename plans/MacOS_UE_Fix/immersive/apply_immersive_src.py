#!/usr/bin/env python3
"""Immersive Mode: copies ImmersiveViewSubsystem.{h,cpp} from src/ into <project>/Source/awsTutorial (CRLF, like the
other project sources). The two materials come from make_materials.py.
Usage: apply_immersive_src.py <project dir>"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
proj = pathlib.Path(sys.argv[1])
if not (proj / "awsTutorial.uproject").is_file():
    sys.exit(f"not a project dir: {proj}")
for name in ["ImmersiveViewSubsystem.h", "ImmersiveViewSubsystem.cpp"]:
    text = (HERE / "src" / name).read_text(encoding="utf-8").replace("\r\n", "\n")
    (proj / "Source/awsTutorial" / name).write_bytes(text.replace("\n", "\r\n").encode("utf-8"))
    print("source", name)
