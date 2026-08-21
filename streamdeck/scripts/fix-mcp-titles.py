#!/usr/bin/env python3
"""
Update action titles on the AI Stream Deck MCP Actions profile to be
descriptive enough for AI discovery via the Elgato MCP server.

The Elgato MCP server exposes the 'title' field from each action.
Since we can't set separate AI descriptions, we make titles self-documenting.
"""
import json
from pathlib import Path

PROFILE_DIR = Path("/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/ProfilesV3"
                   "/19BBCADB-65EE-484C-86CF-5EA0AE391361.sdProfile/Profiles")

# Map of (page_uuid, position) -> descriptive title
# Keep titles short enough to display on buttons but descriptive for AI
TITLES = {
    # Page 1: DEFAULT (A71FFA10)
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "0,0"): "STATUS: Check system health",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "0,1"): "ASK: Question from clipboard",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "0,2"): "CODE: Generate code from clipboard",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "0,3"): "RESEARCH: Deep research from clipboard",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "0,4"): "WRITE: Academic writing pipeline",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "1,0"): "LEARN: Store clipboard as knowledge",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "1,1"): "QUERY: Search knowledge base",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "1,2"): "PDF SCAN: Analyze PDF document",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "1,3"): "COMPLETE: Finish dissertation section",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "1,4"): "ABORT: Emergency stop pipeline",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "2,0"): "START: Launch all services",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "2,1"): "STOP: Shutdown all services",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "2,2"): "DASH: Open dashboard",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "2,3"): "SITREP: Pipeline status report",
    ("A71FFA10-6F33-44D3-8F05-5092296E590E", "2,4"): "COSTS: API cost breakdown",

    # Page 2: PIPELINE-ACTIVE (53F7B969)
    ("53F7B969-F208-4A72-AB07-8056462AF932", "0,4"): "ABORT: Emergency stop pipeline",
    ("53F7B969-F208-4A72-AB07-8056462AF932", "1,3"): "SONA KILL: 0.0 hallucination stop",
    ("53F7B969-F208-4A72-AB07-8056462AF932", "1,4"): "UCM FLUSH: Clear context window",
}


def update_titles():
    updated = 0
    for (page_uuid, pos), title in TITLES.items():
        manifest_path = PROFILE_DIR / page_uuid / "manifest.json"
        if not manifest_path.exists():
            print(f"  SKIP: {page_uuid} not found")
            continue

        with open(manifest_path) as f:
            data = json.load(f)

        actions = data.get("Controllers", [{}])[0].get("Actions", {})
        if not actions or pos not in actions:
            continue

        action = actions[pos]
        old_title = action.get("Name", "")

        # Update action Name
        action["Name"] = title

        # Update States title for display
        for state in action.get("States", []):
            state["Title"] = title

        with open(manifest_path, "w") as f:
            json.dump(data, f, indent=2)

        updated += 1
        print(f"  {old_title} → {title}")

    print(f"\nUpdated {updated} action titles. Restart Stream Deck app to apply.")


if __name__ == "__main__":
    print("=== Updating AI Stream Deck MCP Action Titles ===\n")
    update_titles()
