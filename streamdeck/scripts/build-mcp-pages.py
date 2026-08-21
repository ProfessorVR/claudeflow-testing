#!/usr/bin/env python3
"""
Build 4 static pages for the AI Stream Deck (MCP Actions) profile.
Run ONCE with Stream Deck app stopped. Creates page manifests and copies icons.

Profile: 19BBCADB-65EE-484C-86CF-5EA0AE391361.sdProfile (AI Stream Deck)
"""
import json
import shutil
import uuid
from pathlib import Path

PROFILES_ROOT = Path("/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/ProfilesV3")
PROFILE_DIR = PROFILES_ROOT / "19BBCADB-65EE-484C-86CF-5EA0AE391361.sdProfile"
ICONS_SRC = Path("/home/dalton/projects/claudeflow-testing/streamdeck/icons")
SCRIPTS_DIR = "C:\\Users\\Dalton\\StreamDeckScripts"

# Existing page UUIDs from the profile
EXISTING_PAGES = {
    "current": "53F7B969-F208-4A72-AB07-8056462AF932",
    "default": "A71FFA10-6F33-44D3-8F05-5092296E590E",
}

# We'll use existing pages for Page 1 and Page 2, create new ones for Page 3 and Page 4
PAGE_UUIDS = {
    1: EXISTING_PAGES["default"],      # Page 1: DEFAULT (use the "default" page)
    2: EXISTING_PAGES["current"],       # Page 2: PIPELINE-ACTIVE (use the "current" page)
    3: str(uuid.uuid4()).upper(),       # Page 3: RESEARCH (new)
    4: str(uuid.uuid4()).upper(),       # Page 4: REVIEW (new)
}

def make_action(label, script_bat, icon_name, description, action_id=None):
    """Create a Stream Deck action object for com.elgato.streamdeck.system.open."""
    if action_id is None:
        action_id = str(uuid.uuid4())
    return {
        "ActionID": action_id,
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
                "FontSize": "10",
                "FontStyle": "",
                "FontUnderline": False,
                "TitleColor": "#ffffff"
            }
        ],
        "UUID": "com.elgato.streamdeck.system.open",
        "AIDescription": description
    }

def make_website_action(label, url, icon_name, description):
    """Create a Website action."""
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
                "FontSize": "10",
                "TitleColor": "#ffffff"
            }
        ],
        "UUID": "com.elgato.streamdeck.system.website",
        "AIDescription": description
    }

def make_page_nav_action(label, icon_name):
    """Create a 'go to page' navigation placeholder. Uses Open action that echoes."""
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
            "path": f"{SCRIPTS_DIR}\\god-status.bat"
        },
        "State": 0,
        "States": [
            {
                "Image": f"Images/{icon_name}.png" if icon_name else "",
                "Title": label,
                "ShowTitle": True,
                "TitleAlignment": "bottom",
                "FontSize": "10",
                "TitleColor": "#ffffff"
            }
        ],
        "UUID": "com.elgato.streamdeck.system.open",
        "AIDescription": f"Navigate to {label}"
    }


# ─── Page Layouts ───────────────────────────────────────────────────────────

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
    # Row 1: Knowledge
    "1,0": make_action("LEARN", "god-learn.bat", "learn",
        "Store clipboard content as knowledge in the God Agent memory system"),
    "1,1": make_action("QUERY", "god-query.bat", "query",
        "Search the God Agent knowledge base — reads query from clipboard"),
    "1,2": make_action("PDF SCAN", "god-pdf-analyze.bat", "pdf-scan",
        "Analyze a PDF document using hybrid auto/manual modes"),
    "1,3": make_action("COMPLETE", "god-complete-section.bat", "complete",
        "Complete a dissertation section with full context and quality validation"),
    "1,4": make_action("ABORT", "god-abort-pipeline.bat", "abort",
        "Emergency abort — immediately stop any running pipeline, severs API connections"),
    # Row 2: Services
    "2,0": make_action("START", "god-launch-start.bat", "start",
        "Start all God Agent backend services (vLLM, embedding, ChromaDB, observability)"),
    "2,1": make_action("STOP", "god-launch-stop.bat", "stop",
        "Stop all God Agent services gracefully"),
    "2,2": make_website_action("DASH", "http://localhost:3847", "dash",
        "Open observability dashboard in browser at localhost:3847"),
    "2,3": make_action("SITREP", "god-sitrep.bat", "sitrep",
        "Situation report — pipeline status, recent runs, error summary"),
    "2,4": make_action("COSTS", "god-costs.bat", "costs",
        "API cost breakdown by model with per-run averages"),
}

PAGE2_ACTIONS = {
    # Row 0: Pipeline monitoring
    "0,0": make_action("PROGRESS", "god-status.bat", "progress",
        "Pipeline progress — dynamic icon shows current stage count"),
    "0,1": make_action("STAGE", "god-sitrep.bat", "stage",
        "Current pipeline stage name and details"),
    "0,2": make_action("STATUS", "god-status.bat", "status",
        "Check God Agent system health"),
    "0,3": make_action("COSTS", "god-costs.bat", "costs",
        "API cost breakdown by model with per-run averages"),
    "0,4": make_action("ABORT", "god-abort-pipeline.bat", "abort",
        "Emergency abort — immediately stop any running pipeline"),
    # Row 1: Tools + Safety
    "1,0": make_website_action("DASH", "http://localhost:3847", "dash",
        "Open observability dashboard"),
    "1,1": make_action("SITREP", "god-sitrep.bat", "sitrep",
        "Situation report"),
    "1,2": make_action("QUERY", "god-query.bat", "query",
        "Search knowledge base"),
    "1,3": make_action("SONA KILL", "god-sona-kill.bat", "sona-kill",
        "Immediately issue 0.0 feedback score to SoNA engine — hallucination emergency stop"),
    "1,4": make_action("UCM FLUSH", "god-ucm-flush.bat", "ucm-flush",
        "Clear the UCM rolling context window — use when agent reasoning degrades"),
    # Row 2: Quick access
    "2,0": make_action("ASK", "god-ask.bat", "ask",
        "Ask the God Agent any question"),
    "2,1": make_action("CODE", "god-code.bat", "code",
        "Generate code"),
    "2,2": make_action("RESEARCH", "god-research.bat", "research",
        "Run deep research"),
    "2,3": make_action("WRITE", "god-write.bat", "write",
        "Start writing pipeline"),
    "2,4": make_page_nav_action("PAGE 1", "page1"),
}

PAGE3_ACTIONS = {
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
    # Row 1: Learning
    "1,0": make_action("QUERY", "god-query.bat", "query",
        "Search knowledge base"),
    "1,1": make_action("LEARN", "god-learn.bat", "learn",
        "Store clipboard content as knowledge"),
    "1,2": make_action("LEARN\nCOMPILE", "god-learn-compile.bat", "learn-compile",
        "Compile knowledge units into consolidated knowledge.jsonl"),
    "1,3": make_action("LEARN\nVERIFY", "god-learn-verify.bat", "learn-verify",
        "Verify knowledge base integrity and embedding coverage"),
    "1,4": make_action("SITREP", "god-sitrep.bat", "sitrep",
        "Situation report"),
    # Row 2: Quick access
    "2,0": make_action("ASK", "god-ask.bat", "ask",
        "Ask the God Agent any question"),
    "2,1": make_action("WRITE", "god-write.bat", "write",
        "Start writing pipeline"),
    "2,2": make_website_action("DASH", "http://localhost:3847", "dash",
        "Open observability dashboard"),
    "2,3": make_action("ABORT", "god-abort-pipeline.bat", "abort",
        "Emergency abort"),
    "2,4": make_page_nav_action("PAGE 1", "page1"),
}

PAGE4_ACTIONS = {
    # Row 0: Feedback
    "0,0": make_action("PERFECT\n1.0", "feedback-perfect.bat", "feedback-perfect",
        "Submit trajectory feedback score 1.0 — perfect output"),
    "0,1": make_action("GOOD\n0.8", "feedback-good.bat", "feedback-good",
        "Submit trajectory feedback score 0.8 — good output"),
    "0,2": make_action("MEH\n0.5", "feedback-meh.bat", "feedback-meh",
        "Submit trajectory feedback score 0.5 — mediocre output"),
    "0,3": make_action("POOR\n0.2", "feedback-poor.bat", "feedback-poor",
        "Submit trajectory feedback score 0.2 — poor output"),
    "0,4": make_action("FAIL\n0.0", "feedback-fail.bat", "feedback-fail",
        "Submit trajectory feedback score 0.0 — failed output"),
    # Row 1: Analytics
    "1,0": make_action("QUALITY", "god-quality.bat", "quality",
        "Quality gauntlet summary — stage scores, citation fidelity, style drift"),
    "1,1": make_action("ANALYTICS", "god-analytics.bat", "analytics",
        "Generate analytics report — token usage, quality trends, retrieval stats"),
    "1,2": make_action("COSTS", "god-costs.bat", "costs",
        "API cost breakdown by model"),
    "1,3": make_action("SITREP", "god-sitrep.bat", "sitrep",
        "Situation report"),
    "1,4": make_website_action("DASH", "http://localhost:3847", "dash",
        "Open observability dashboard"),
    # Row 2: Quick access
    "2,0": make_action("ASK", "god-ask.bat", "ask",
        "Ask the God Agent any question"),
    "2,1": make_action("QUERY", "god-query.bat", "query",
        "Search knowledge base"),
    "2,2": make_action("LEARN", "god-learn.bat", "learn",
        "Store clipboard content as knowledge"),
    "2,3": make_action("WRITE", "god-write.bat", "write",
        "Start writing pipeline"),
    "2,4": make_page_nav_action("PAGE 1", "page1"),
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
    """Copy referenced icon PNGs to the page's Images/ directory."""
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
    print("=== Building MCP Actions Profile Pages ===")
    print(f"Profile: {PROFILE_DIR}")
    print()

    if not PROFILE_DIR.exists():
        print(f"ERROR: Profile directory not found: {PROFILE_DIR}")
        return

    pages_config = {
        1: ("DEFAULT", PAGE1_ACTIONS),
        2: ("PIPELINE-ACTIVE", PAGE2_ACTIONS),
        3: ("RESEARCH", PAGE3_ACTIONS),
        4: ("REVIEW", PAGE4_ACTIONS),
    }

    profiles_dir = PROFILE_DIR / "Profiles"

    for page_num, (name, actions) in pages_config.items():
        page_uuid = PAGE_UUIDS[page_num]
        page_dir = profiles_dir / page_uuid
        page_dir.mkdir(parents=True, exist_ok=True)

        manifest = build_page_manifest(actions, name)
        manifest_path = page_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

        copy_icons_to_page(page_dir, actions)
        action_count = len(actions)
        print(f"  Page {page_num} ({name}): {action_count} actions → {page_uuid}")

    # Update the profile manifest to list all 4 pages
    profile_manifest_path = PROFILE_DIR / "manifest.json"
    with open(profile_manifest_path) as f:
        profile_manifest = json.load(f)

    all_page_uuids = [PAGE_UUIDS[i].lower() for i in range(1, 5)]
    profile_manifest["Pages"]["Pages"] = all_page_uuids
    profile_manifest["Pages"]["Default"] = PAGE_UUIDS[1].lower()
    profile_manifest["Pages"]["Current"] = PAGE_UUIDS[1].lower()

    with open(profile_manifest_path, "w") as f:
        json.dump(profile_manifest, f, indent=2)

    print()
    print(f"  Profile manifest updated: {len(all_page_uuids)} pages")
    print()
    print("=== Done. Restart Stream Deck app to load changes. ===")


if __name__ == "__main__":
    main()
