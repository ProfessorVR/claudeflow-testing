#!/usr/bin/env python3
"""
SSE-driven Stream Deck icon updater for God Agent pipelines.

Connects to the observability SSE endpoint and updates the PROGRESS icon
on the Pipeline-Active page when pipeline state changes. Also updates the
STATUS icon on the Default page based on service health.

This is the ONLY runtime filesystem write in the MCP integration.
"""
import json
import os
import signal
import sys
import time
import threading
from pathlib import Path

import requests
import sseclient
from PIL import Image, ImageDraw, ImageFont

# ─── Configuration ──────────────────────────────────────────────────────────

GOD_AGENT_DIR = Path("/home/dalton/projects/claudeflow-testing")
SSE_URL = "http://localhost:3847/api/stream"
HEALTH_URL = "http://localhost:3847/api/health"
PIPELINES_URL = "http://localhost:3847/api/pipelines"

# Profile paths
PROFILES_ROOT = Path("/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/ProfilesV3")

# All profiles that need icon updates (AI Stream Deck + physical XL)
PAGE_UUIDS_FILES = [
    GOD_AGENT_DIR / "streamdeck" / "mcp-page-uuids.json",    # AI Stream Deck
    GOD_AGENT_DIR / "streamdeck" / "xl-page-uuids.json",     # Physical XL
]
MODE_FILE = GOD_AGENT_DIR / ".god-agent" / "streamdeck-mode"

# Throttle: max 1 icon write per second
MIN_WRITE_INTERVAL = 1.0

# Reconnection: exponential backoff
RECONNECT_BASE = 1.0
RECONNECT_MAX = 30.0

# Stale connection detection
STALE_TIMEOUT = 300  # 5 minutes

# Health check interval when idle
HEALTH_CHECK_INTERVAL = 60  # seconds

# ─── Globals ────────────────────────────────────────────────────────────────

# List of (profile_uuid, page_uuids_dict) tuples
all_profiles = []
last_write_time = 0.0
last_event_time = time.time()
last_stage = None
last_health = None
running = True

# Font
FONT_PATH = None
for fp in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
           "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
    if os.path.exists(fp):
        FONT_PATH = fp
        break


def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def load_page_uuids():
    global all_profiles
    all_profiles = []
    for uuids_file in PAGE_UUIDS_FILES:
        if not uuids_file.exists():
            log(f"Skipping missing: {uuids_file}")
            continue
        with open(uuids_file) as f:
            data = json.load(f)
        profile_uuid = data["profile"]
        pages = data["pages"]
        all_profiles.append((profile_uuid, pages))
        log(f"Loaded profile {profile_uuid}: {list(pages.keys())}")
    log(f"Total profiles for icon updates: {len(all_profiles)}")


def get_all_page_images_dirs(page_key):
    """Return list of Images/ dirs across all profiles that have the matching page key."""
    dirs = []
    for profile_uuid, pages in all_profiles:
        # Match by page key suffix (e.g., "1-default" matches "1-default" or "1-command-center")
        page_num = page_key.split("-")[0]
        for key, uuid in pages.items():
            if key.startswith(page_num + "-"):
                profile_dir = PROFILES_ROOT / f"{profile_uuid}.sdProfile" / "Profiles"
                dirs.append(profile_dir / uuid / "Images")
                break
    return dirs


def generate_icon(text, bg_color, text2=None, size=144):
    """Generate a PNG icon in memory."""
    img = Image.new("RGB", (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    if FONT_PATH:
        font = ImageFont.truetype(FONT_PATH, 36 if len(text) <= 4 else 28)
        small_font = ImageFont.truetype(FONT_PATH, 18)
    else:
        font = ImageFont.load_default()
        small_font = font

    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    y_off = -10 if text2 else 0
    draw.text(((size - w) / 2, (size - h) / 2 + y_off), text, fill="white", font=font)

    if text2:
        bbox2 = draw.textbbox((0, 0), text2, font=small_font)
        w2 = bbox2[2] - bbox2[0]
        draw.text(((size - w2) / 2, (size + h) / 2 + 5), text2, fill="white", font=small_font)

    return img


def write_icon_throttled(page_key, filename, img):
    """Write icon to all matching profile pages, respecting throttle interval."""
    global last_write_time
    now = time.time()
    if now - last_write_time < MIN_WRITE_INTERVAL:
        return False  # throttled

    dirs = get_all_page_images_dirs(page_key)
    for images_dir in dirs:
        if not images_dir.exists():
            images_dir.mkdir(parents=True, exist_ok=True)
        path = images_dir / filename
        img.save(str(path))

    last_write_time = now
    return len(dirs) > 0


def update_progress_icon(completed, total, step_name, status):
    """Update the PROGRESS icon on Page 2 (pipeline-active)."""
    global last_stage

    stage_key = f"{completed}/{total}/{status}"
    if stage_key == last_stage:
        return  # no change, skip

    text = f"{completed}/{total}"
    if status == "running":
        bg = "#00c8ff"
    elif status == "success":
        bg = "#00ff88"
    elif status == "error":
        bg = "#ff3355"
    else:
        bg = "#1a1a2e"

    step_short = (step_name[:12] + "..") if len(step_name) > 14 else step_name
    img = generate_icon(text, bg, text2=step_short)

    if write_icon_throttled("2-pipeline-active", "progress.png", img):
        last_stage = stage_key
        log(f"PROGRESS: {text} [{status}] {step_name}")


def update_health_icon(healthy):
    """Update the STATUS icon on Page 1 (default)."""
    global last_health
    if healthy == last_health:
        return

    if healthy:
        img = generate_icon("OK", "#00ff88", text2="HEALTHY")
    else:
        img = generate_icon("DOWN", "#ff3355", text2="ERROR")

    if write_icon_throttled("1-default", "status.png", img):
        last_health = healthy
        log(f"HEALTH: {'healthy' if healthy else 'degraded/down'}")


def check_health():
    """Check service health via API."""
    try:
        resp = requests.get(HEALTH_URL, timeout=2)
        data = resp.json()
        return data.get("status") == "healthy"
    except Exception:
        return False


def check_pipelines():
    """Check active pipelines via API."""
    try:
        resp = requests.get(PIPELINES_URL, timeout=2)
        data = resp.json()
        pipelines = data.get("pipelines", data if isinstance(data, list) else [])
        for p in pipelines:
            if p.get("status") == "running":
                return p
        return None
    except Exception:
        return None


def handle_sse_event(event):
    """Process an SSE event and update icons if needed."""
    global last_event_time
    last_event_time = time.time()

    if not event.data or event.data.strip() == "":
        return  # heartbeat

    try:
        data = json.loads(event.data)
    except json.JSONDecodeError:
        return

    event_type = data.get("type", data.get("event", ""))

    # Pipeline state events
    if "pipeline" in event_type.lower() or "step" in event_type.lower():
        pipeline = data.get("pipeline", data)
        completed = pipeline.get("completedSteps", pipeline.get("completed", 0))
        total = pipeline.get("totalSteps", pipeline.get("total", 0))
        current_step = pipeline.get("currentStep", pipeline.get("step", ""))
        status = pipeline.get("status", "running")
        update_progress_icon(completed, total, current_step, status)

    # Health events
    if "health" in event_type.lower():
        healthy = data.get("status") == "healthy"
        update_health_icon(healthy)


def health_check_loop():
    """Periodic health check when idle."""
    while running:
        time.sleep(HEALTH_CHECK_INTERVAL)
        if not running:
            break
        healthy = check_health()
        update_health_icon(healthy)

        # Stale connection detection
        elapsed = time.time() - last_event_time
        if elapsed > STALE_TIMEOUT:
            log(f"WARNING: NO EVENTS SEEN IN {int(elapsed)}s — connection may be stale")


def sse_loop():
    """Main SSE connection loop with exponential backoff reconnection."""
    global last_event_time
    backoff = RECONNECT_BASE

    while running:
        try:
            log(f"Connecting to SSE: {SSE_URL}")
            resp = requests.get(SSE_URL, stream=True, timeout=10)
            resp.raise_for_status()
            client = sseclient.SSEClient(resp)

            log("Connected to SSE stream")
            backoff = RECONNECT_BASE  # reset backoff on success
            last_event_time = time.time()

            # Initial health check
            healthy = check_health()
            update_health_icon(healthy)

            # Check if there's an active pipeline we missed
            active = check_pipelines()
            if active:
                update_progress_icon(
                    active.get("completedSteps", 0),
                    active.get("totalSteps", 0),
                    active.get("currentStep", ""),
                    active.get("status", "running")
                )

            for event in client.events():
                if not running:
                    break
                handle_sse_event(event)

        except requests.exceptions.ConnectionError:
            log(f"SSE connection failed — retrying in {backoff:.0f}s")
        except requests.exceptions.Timeout:
            log(f"SSE connection timeout — retrying in {backoff:.0f}s")
        except Exception as e:
            log(f"SSE error: {e} — retrying in {backoff:.0f}s")

        if not running:
            break

        # Update health to "down" when SSE disconnects
        update_health_icon(False)

        time.sleep(backoff)
        backoff = min(backoff * 2, RECONNECT_MAX)


def signal_handler(sig, frame):
    global running
    log("Shutdown signal received")
    running = False
    sys.exit(0)


def main():
    global running

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    # Read version
    version_file = GOD_AGENT_DIR / "streamdeck" / "VERSION"
    version = version_file.read_text().strip() if version_file.exists() else "unknown"
    log(f"Stream Deck MCP SSE Watcher v{version}")

    load_page_uuids()

    # Ensure mode file exists
    MODE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not MODE_FILE.exists():
        MODE_FILE.write_text("default")

    # Start health check thread
    health_thread = threading.Thread(target=health_check_loop, daemon=True)
    health_thread.start()

    # Main SSE loop (blocks)
    sse_loop()


if __name__ == "__main__":
    main()
