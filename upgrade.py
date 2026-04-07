#!/usr/bin/env python3
"""
upgrade.py - Check and update hardcoded software versions in this project.

Targets:
  - Debian forky slim -> Dockerfile
  - Hugo              -> hugo/VERSION
  - FontAwesome       -> vendor/fontawesome.sh

Usage:
  python3 upgrade.py
"""

import datetime
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

WORKSPACE = Path(__file__).parent

DOCKERFILE        = WORKSPACE / "Dockerfile"
HUGO_VERSION_FILE = WORKSPACE / "hugo" / "VERSION"
FONTAWESOME_SH    = WORKSPACE / "vendor" / "fontawesome.sh"


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def fetch_json(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} fetching {url}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error fetching {url}: {e.reason}") from e


# ---------------------------------------------------------------------------
# Version fetchers
# ---------------------------------------------------------------------------

def get_latest_debian_forky_slim():
    """Return the latest forky-YYYYMMDD-slim tag from Docker Hub."""
    url = (
        "https://hub.docker.com/v2/repositories/library/debian/tags"
        "?name=forky-&ordering=last_updated&page_size=100"
    )
    data = fetch_json(url)
    pattern = re.compile(r"^forky-(\d{8})-slim$")
    candidates = []
    for result in data.get("results", []):
        m = pattern.match(result["name"])
        if m:
            candidates.append((m.group(1), result["name"]))
    if not candidates:
        raise RuntimeError("No forky-YYYYMMDD-slim tags found on Docker Hub")
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]  # e.g. "forky-20260223-slim"


def get_latest_hugo():
    """Return the latest Hugo release version from GitHub."""
    data = fetch_json(
        "https://api.github.com/repos/gohugoio/hugo/releases/latest",
        headers={"Accept": "application/vnd.github+json"},
    )
    tag = data["tag_name"]  # e.g. "v0.150.0"
    return tag.lstrip("v")


def get_latest_fontawesome():
    """Return the latest Font Awesome release version from GitHub."""
    data = fetch_json(
        "https://api.github.com/repos/FortAwesome/Font-Awesome/releases/latest",
        headers={"Accept": "application/vnd.github+json"},
    )
    tag = data["tag_name"]  # e.g. "7.0.1" or "v7.0.1"
    return tag.lstrip("v")


# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------

def read_current(path, pattern):
    """Extract current value using a regex with one capture group."""
    content = path.read_text()
    m = re.search(pattern, content)
    if not m:
        raise RuntimeError(f"Pattern {pattern!r} not found in {path}")
    return m.group(1)


def update_file(path, pattern, replacement, count=1):
    """Replace regex match(es) in file. Returns True if content changed."""
    content = path.read_text()
    new_content, n = re.subn(pattern, replacement, content, count=count)
    if n == 0:
        raise RuntimeError(f"Pattern {pattern!r} not found in {path}")
    if new_content == content:
        return False
    path.write_text(new_content)
    return True


# ---------------------------------------------------------------------------
# Per-tool check + update logic
# ---------------------------------------------------------------------------

def check(name, current, latest, path, search_pattern, replacement, count=1):
    if current == latest:
        print(f"  ok        {current}")
        return False
    print(f"  outdated  {current} -> {latest}")
    changed = update_file(path, search_pattern, replacement, count=count)
    if changed:
        print(f"  updated   {path.relative_to(WORKSPACE)}")
    return changed


def run_debian_forky():
    print("[debian forky slim]")
    current = read_current(DOCKERFILE, r"FROM debian:(\S+)")
    latest  = get_latest_debian_forky_slim()
    changed = check(
        "debian", current, latest,
        DOCKERFILE,
        r"FROM debian:\S+",
        f"FROM debian:{latest}",
    )
    if changed:
        today = datetime.date.today().strftime("%y%m%d")
        update_file(DOCKERFILE, r'LABEL version="\S+"', f'LABEL version="{today}"')
        print(f"  updated   LABEL version -> {today}")
        update_file(DOCKERFILE, r"ENV CLVQ_UPGRADE=\S+", f"ENV CLVQ_UPGRADE={today}")
        print(f"  updated   CLVQ_UPGRADE -> {today}")
    return changed


def run_hugo():
    print("[hugo]")
    current = HUGO_VERSION_FILE.read_text().strip()
    latest  = get_latest_hugo()
    if current == latest:
        print(f"  ok        {current}")
        return False
    print(f"  outdated  {current} -> {latest}")
    HUGO_VERSION_FILE.write_text(latest + "\n")
    print(f"  updated   {HUGO_VERSION_FILE.relative_to(WORKSPACE)}")
    return True


def run_fontawesome():
    print("[fontawesome]")
    current = read_current(FONTAWESOME_SH, r"fa_version='([^']+)'")
    latest  = get_latest_fontawesome()
    # fa_version appears in the variable assignment and hardcoded in the URL path
    return check(
        "fontawesome", current, latest,
        FONTAWESOME_SH,
        r"fa_version='[^']+'",
        f"fa_version='{latest}'",
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

CHECKS = [
    run_debian_forky,
    run_hugo,
    run_fontawesome,
]


def main():
    any_updated = False
    any_error   = False

    for fn in CHECKS:
        try:
            updated = fn()
            any_updated = any_updated or updated
        except Exception as e:
            print(f"  ERROR: {e}")
            any_error = True
        print()

    if any_error:
        print("Finished with errors.")
        sys.exit(1)
    elif any_updated:
        print("All updates applied.")
    else:
        print("Everything is up to date.")


if __name__ == "__main__":
    main()
