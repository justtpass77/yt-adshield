"""
Builds a production release ZIP file for GitHub Releases and Chromium browsers.
Uses Python standard library (zipfile, os).
"""

import os
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
OUTPUT_ZIP = os.path.join(DIST_DIR, "adshield-youtube-v1.0.0.zip")

INCLUDE_FILES = [
    "manifest.json",
    "rules.json",
    "README.md",
    "LICENSE",
]

INCLUDE_DIRS = [
    "src",
    "popup",
    "icons",
]

def main():
    os.makedirs(DIST_DIR, exist_ok=True)
    if os.path.exists(OUTPUT_ZIP):
        os.remove(OUTPUT_ZIP)

    print(f"Creating release package: {OUTPUT_ZIP}")
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        # Include specific root files
        for fname in INCLUDE_FILES:
            src = os.path.join(PROJECT_ROOT, fname)
            if os.path.exists(src):
                zf.write(src, arcname=fname)
                print(f"  + Added: {fname}")

        # Include specific directories
        for dname in INCLUDE_DIRS:
            dir_path = os.path.join(PROJECT_ROOT, dname)
            for root, _, files in os.walk(dir_path):
                for f in files:
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                    zf.write(full_path, arcname=rel_path)
                    print(f"  + Added: {rel_path}")

    size_kb = os.path.getsize(OUTPUT_ZIP) / 1024.0
    print(f"\n[SUCCESS] Package generated: {OUTPUT_ZIP} ({size_kb:.1f} KB)")
    print("This ZIP is ready to attach to your GitHub Release!")

if __name__ == "__main__":
    main()
