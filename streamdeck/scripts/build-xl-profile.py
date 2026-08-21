#!/usr/bin/env python3
"""
Build a God Agent profile for the Stream Deck + XL (32 keys, 8x4 grid).
Creates a new profile with 2 pages that cover all actions.

Device: 20GAA9902, UUID: @(1)[4057/109/AL24J2C09100]

Page 1: COMMAND CENTER — all primary actions + services + safety
Page 2: RESEARCH & REVIEW — research variants, learning, feedback, analytics
"""
import json
import shutil
import uuid
from pathlib import Path

PROFILES_ROOT = Path("/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/ProfilesV3")
ICONS_SRC = Path("/home/dalton/projects/claudeflow-testing/streamdeck/icons")
SCRIPTS_DIR = "C:\\Users\\Dalton\\StreamDeckScripts"

# Create a new profile UUID
PROFILE_UUID = str(uuid.uuid4()).upper()
PROFILE_DIR = PROFILES_ROOT / f"{PROFILE_UUID}.sdProfile"

# Page UUIDs
PAGE1_UUID = str(uuid.uuid4()).upper()
PAGE2_UUID = str(uuid.uuid4()).upper()

# Device info for XL
DEVICE = {
    "Model": "20GAA9902",
    "UUID": "@(1)[4057/109/AL24J2C09100]"
}


def make_action(label, script_bat, icon_name, description):
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": label,
        "Plugin": {
            "Name": "Open",
            "UUID": "com.elgato.streamdeck.system.open",
            "Version": "1.0"
        },
        "Resources": None,
        "Settings": {
            "openInBrowser": False,
            "path": f"{SCRIPTS_DIR}\\{script_bat}"
        },
        "State": 0,
        "States": [
            {
                "Image": f"Images/{icon_name}.png" if icon_name else "",
                "Title": label,
                "ShowTitle": True,
                "TitleAlignment": "bottom",
                "FontSize": "9",
                "FontStyle": "",
                "FontUnderline": False,
                "TitleColor": "#ffffff"
            }
        ],
        "UUID": "com.elgato.streamdeck.system.open",
        "AIDescription": description
    }


def make_website_action(label, url, icon_name, description):
    return {
        "ActionID": str(uuid.uuid4()),
        "LinkedTitle": True,
        "Name": label,
        "Plugin": {
            "Name": "Website",
            "UUID": "com.elgato.streamdeck.system.website",
            "Version": "1.0"
        },
        "Resources": None,
        "Settings": {
            "openInBrowser": True,
            "Url": url
        },
        "State": 0,
        "States": [
            {
                "Image": f"Images/{icon_name}.png" if icon_name else "",
                "Title": label,
                "ShowTitle": True,
                "TitleAlignment": "bottom",
                "FontSize": "9",
                "TitleColor": "#ffffff"
            }
        ],
        "UUID": "com.elgato.streamdeck.system.website",
        "AIDescription": description
    }


# ─── XL Page 1: COMMAND CENTER (8x4 = 32 keys) ─────────────────────────────
# Layout:
# Row 0: STATUS   ASK      CODE     RESEARCH  WRITE    COMPLETE  SITREP   COSTS
# Row 1: LEARN    QUERY    PDF SCAN SYNTH CH  STYLE ST CODE PL   PROGRESS STAGE
# Row 2: START    STOP     DASH     ABORT     SONA KILL UCM FLUSH  (empty)  PAGE 2→
# Row 3: PERFECT  GOOD     MEH      POOR      FAIL     QUALITY  ANALYTICS (empty)

PAGE1_ACTIONS = {
    # Row 0: Main commands
    "0,0": make_action("STATUS", "god-status.bat", "status",
        "Check God Agent system health — shows if all backend services are running"),
    "0,1": make_action("ASK", "god-ask.bat", "ask",
        "Ask the God Agent any question — reads from clipboard, uses DAI-001 agent routing"),
    "0,2": make_action("CODE", "god-code.bat", "code",
        "Generate code using the 48-agent coding pipeline — reads task from clipboard"),
    "0,3": make_action("RESEARCH", "god-research.bat", "research",
        "Run deep research using PhD Pipeline with 45 agents — reads topic from clipboard"),
    "0,4": make_action("WRITE", "god-write.bat", "write",
        "Start academic writing pipeline with style injection and quality validation"),
    "0,5": make_action("COMPLETE", "god-complete-section.bat", "complete",
        "Complete a dissertation section with full context and quality validation"),
    "0,6": make_action("SITREP", "god-sitrep.bat", "sitrep",
        "Situation report — pipeline status, recent runs, error summary"),
    "0,7": make_action("COSTS", "god-costs.bat", "costs",
        "API cost breakdown by model with per-run averages"),

    # Row 1: Knowledge + Pipeline monitoring
    "1,0": make_action("LEARN", "god-learn.bat", "learn",
        "Store clipboard content as knowledge in the God Agent memory system"),
    "1,1": make_action("QUERY", "god-query.bat", "query",
        "Search the God Agent knowledge base — reads query from clipboard"),
    "1,2": make_action("PDF SCAN", "god-pdf-analyze.bat", "pdf-scan",
        "Analyze a PDF document using hybrid auto/manual modes"),
    "1,3": make_action("SYNTH\nCHAPTERS", "god-synthesize-chapters.bat", "complete",
        "Synthesize multi-chapter dissertation output with cross-references"),
    "1,4": make_action("STYLE\nSTATUS", "god-style-status.bat", "status",
        "Display active style profile stats and drift metrics"),
    "1,5": make_action("CODE\nPIPELINE", "god-code-pipeline.bat", "code",
        "Run code generation pipeline with test validation"),
    "1,6": make_action("PROGRESS", "god-status.bat", "progress",
        "Pipeline progress — dynamic icon shows current stage count"),
    "1,7": make_action("STAGE", "god-sitrep.bat", "stage",
        "Current pipeline stage name and details"),

    # Row 2: Services + Safety
    "2,0": make_action("START", "god-launch-start.bat", "start",
        "Start all God Agent backend services (vLLM, embedding, ChromaDB, observability)"),
    "2,1": make_action("STOP", "god-launch-stop.bat", "stop",
        "Stop all God Agent services gracefully"),
    "2,2": make_website_action("DASH", "http://localhost:3847", "dash",
        "Open observability dashboard in browser at localhost:3847"),
    "2,3": make_action("ABORT", "god-abort-pipeline.bat", "abort",
        "Emergency abort — immediately stop any running pipeline, severs API connections"),
    "2,4": make_action("SONA\nKILL", "god-sona-kill.bat", "sona-kill",
        "Immediately issue 0.0 feedback score to SoNA engine — hallucination emergency stop"),
    "2,5": make_action("UCM\nFLUSH", "god-ucm-flush.bat", "ucm-flush",
        "Clear the UCM rolling context window — use when agent reasoning degrades"),
    # 2,6 empty
    "2,7": make_action("PAGE 2 \u2192", "god-status.bat", "page1",
        "Navigate to Page 2 (Research & Review)"),

    # Row 3: Feedback + Analytics
    "3,0": make_action("PERFECT\n1.0", "feedback-perfect.bat", "feedback-perfect",
        "Submit trajectory feedback score 1.0 — perfect output"),
    "3,1": make_action("GOOD\n0.8", "feedback-good.bat", "feedback-good",
        "Submit trajectory feedback score 0.8 — good output"),
    "3,2": make_action("MEH\n0.5", "feedback-meh.bat", "feedback-meh",
        "Submit trajectory feedback score 0.5 — mediocre output"),
    "3,3": make_action("POOR\n0.2", "feedback-poor.bat", "feedback-poor",
        "Submit trajectory feedback score 0.2 — poor output"),
    "3,4": make_action("FAIL\n0.0", "feedback-fail.bat", "feedback-fail",
        "Submit trajectory feedback score 0.0 — failed output"),
    "3,5": make_action("QUALITY", "god-quality.bat", "quality",
        "Quality gauntlet summary — stage scores, citation fidelity, style drift"),
    "3,6": make_action("ANALYTICS", "god-analytics.bat", "analytics",
        "Generate analytics report — token usage, quality trends, retrieval stats"),
}

# ─── XL Page 2: RESEARCH & LEARNING (8x4 = 32 keys) ─────────────────────────
# Layout:
# Row 0: LOCAL    GROUNDED  HYBRID   PDF SCAN  STATUS   SITREP   COSTS    (empty)
# Row 1: LEARN    LEARN UPD LEARN CP LEARN VER QUERY    (empty)  (empty)  (empty)
# Row 2: ASK      CODE      WRITE    RESEARCH  COMPLETE DASH     ABORT    ← PAGE 1
# Row 3: (empty)  (empty)   (empty)  (empty)   (empty)  (empty)  (empty)  (empty)

PAGE2_ACTIONS = {
    # Row 0: Research variants
    "0,0": make_action("LOCAL\nRESEARCH", "god-research-local.bat", "local-research",
        "Research using local corpus only — no external API calls"),
    "0,1": make_action("GROUNDED\nRESEARCH", "god-research-grounded.bat", "grounded-research",
        "Research grounded in corpus chunks with citation enforcement"),
    "0,2": make_action("HYBRID\nRESEARCH", "god-research-hybrid.bat", "hybrid-research",
        "Hybrid research — corpus retrieval + external LLM synthesis"),
    "0,3": make_action("PDF SCAN", "god-pdf-analyze.bat", "pdf-scan",
        "Analyze a PDF document"),
    "0,4": make_action("STATUS", "god-status.bat", "status",
        "Check system health"),
    "0,5": make_action("SITREP", "god-sitrep.bat", "sitrep",
        "Situation report"),
    "0,6": make_action("COSTS", "god-costs.bat", "costs",
        "API cost breakdown"),

    # Row 1: Learning pipeline
    "1,0": make_action("LEARN", "god-learn.bat", "learn",
        "Store clipboard content as knowledge"),
    "1,1": make_action("LEARN\nUPDATE", "god-learn-update.bat", "learn-update",
        "Update knowledge base with latest corpus changes"),
    "1,2": make_action("LEARN\nCOMPILE", "god-learn-compile.bat", "learn-compile",
        "Compile knowledge units into consolidated knowledge.jsonl"),
    "1,3": make_action("LEARN\nVERIFY", "god-learn-verify.bat", "learn-verify",
        "Verify knowledge base integrity and embedding coverage"),
    "1,4": make_action("QUERY", "god-query.bat", "query",
        "Search knowledge base"),

    # Row 2: Quick access
    "2,0": make_action("ASK", "god-ask.bat", "ask",
        "Ask the God Agent any question"),
    "2,1": make_action("CODE", "god-code.bat", "code",
        "Generate code"),
    "2,2": make_action("WRITE", "god-write.bat", "write",
        "Start writing pipeline"),
    "2,3": make_action("RESEARCH", "god-research.bat", "research",
        "Run deep research"),
    "2,4": make_action("COMPLETE", "god-complete-section.bat", "complete",
        "Complete a dissertation section"),
    "2,5": make_website_action("DASH", "http://localhost:3847", "dash",
        "Open observability dashboard"),
    "2,6": make_action("ABORT", "god-abort-pipeline.bat", "abort",
        "Emergency abort"),
    "2,7": make_action("\u2190 PAGE 1", "god-status.bat", "page1",
        "Navigate back to Page 1"),
}


def build_page_manifest(actions, name=""):
    return {
        "Controllers": [
            {
                "Actions": actions,
                "Type": "Keypad"
            }
        ],
        "Icon": "",
        "Name": name
    }


def copy_icons_to_page(page_dir, actions):
    images_dir = page_dir / "Images"
    images_dir.mkdir(exist_ok=True)
    for action in actions.values():
        for state in action.get("States", []):
            img_ref = state.get("Image", "")
            if img_ref.startswith("Images/"):
                icon_name = img_ref.replace("Images/", "")
                src = ICONS_SRC / icon_name
                dst = images_dir / icon_name
                if src.exists():
                    shutil.copy2(src, dst)


def main():
    print("=== Building God Agent XL Profile ===")
    print(f"Profile UUID: {PROFILE_UUID}")
    print(f"Device: Stream Deck + XL (8x4, 32 keys)")
    print()

    # Create profile directory
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    profiles_dir = PROFILE_DIR / "Profiles"
    profiles_dir.mkdir(exist_ok=True)

    # Build pages
    pages = {
        PAGE1_UUID: ("COMMAND CENTER", PAGE1_ACTIONS),
        PAGE2_UUID: ("RESEARCH & LEARNING", PAGE2_ACTIONS),
    }

    for page_uuid, (name, actions) in pages.items():
        page_dir = profiles_dir / page_uuid
        page_dir.mkdir(parents=True, exist_ok=True)

        manifest = build_page_manifest(actions, name)
        with open(page_dir / "manifest.json", "w") as f:
            json.dump(manifest, f, indent=2)

        copy_icons_to_page(page_dir, actions)
        print(f"  Page: {name} — {len(actions)} actions → {page_uuid}")

    # Write profile manifest
    profile_manifest = {
        "Device": DEVICE,
        "Name": "God Agent MCP",
        "Pages": {
            "Current": PAGE1_UUID.lower(),
            "Default": PAGE1_UUID.lower(),
            "Pages": [PAGE1_UUID.lower(), PAGE2_UUID.lower()]
        },
        "Version": "3.0"
    }

    with open(PROFILE_DIR / "manifest.json", "w") as f:
        json.dump(profile_manifest, f, indent=2)

    print()
    print(f"  Profile manifest: God Agent MCP")
    print(f"  Location: {PROFILE_DIR}")
    print()

    # Save page UUIDs for reference
    uuids_path = Path("/home/dalton/projects/claudeflow-testing/streamdeck/xl-page-uuids.json")
    with open(uuids_path, "w") as f:
        json.dump({
            "profile": PROFILE_UUID,
            "device": "Stream Deck + XL (20GAA9902)",
            "pages": {
                "1-command-center": PAGE1_UUID,
                "2-research-learning": PAGE2_UUID
            }
        }, f, indent=2)

    print(f"  Page UUIDs saved to: {uuids_path}")
    print()
    print("=== Done. Restart Stream Deck app to load the new profile. ===")
    print("Then switch to 'God Agent MCP' profile on your XL device.")


if __name__ == "__main__":
    main()
