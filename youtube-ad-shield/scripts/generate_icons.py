"""
Icon generator for YouTube AdShield extension.
Generates 16x16, 48x48, 128x128 PNG icons and an SVG master file
using only Python standard library (struct + zlib).
"""

import math
import os
import struct
import zlib


def create_png(width, height, rgba_data):
    """Creates a valid PNG byte string from raw RGBA bytes without third-party dependencies."""
    # PNG signature
    png = b"\x89PNG\r\n\x1a\n"

    # IHDR chunk: width, height, bit_depth=8, color_type=6 (RGBA), compression=0, filter=0, interlace=0
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b"IHDR" + ihdr_data)
    png += struct.pack(">I", len(ihdr_data)) + b"IHDR" + ihdr_data + struct.pack(">I", ihdr_crc)

    # Scanlines with filter byte 0 (None) before each row
    raw_scanlines = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_scanlines.append(0)  # Filter type 0
        raw_scanlines.extend(rgba_data[y * row_bytes : (y + 1) * row_bytes])

    compressed = zlib.compress(bytes(raw_scanlines), level=9)
    idat_crc = zlib.crc32(b"IDAT" + compressed)
    png += struct.pack(">I", len(compressed)) + b"IDAT" + compressed + struct.pack(">I", idat_crc)

    # IEND chunk
    iend_crc = zlib.crc32(b"IEND")
    png += struct.pack(">I", 0) + b"IEND" + struct.pack(">I", iend_crc)
    return png


def render_shield_icon(size):
    """Renders a modern red/crimson shield with a play button and ad-block slash."""
    pixels = bytearray(size * size * 4)

    center_x = size / 2.0
    center_y = size / 2.0
    scale = size / 32.0

    # Colors
    c_bg_top = (255, 30, 30)       # YouTube red
    c_bg_bottom = (180, 0, 20)     # Darker crimson
    c_white = (255, 255, 255)
    c_accent = (0, 230, 150)       # Electric mint green checkmark or shield rim

    def point_in_shield(x, y):
        # Normalized coordinates relative to center (-1 to 1)
        nx = (x - center_x) / (size * 0.42)
        ny = (y - (center_y - size * 0.05)) / (size * 0.42)
        
        # Shield top is horizontal or slightly curved, bottom tapers to a point
        if ny < -0.85 or ny > 1.15:
            return False
        
        # Top curvature
        if ny < 0:
            return abs(nx) <= 0.95
        
        # Bottom taper: parabolic taper
        max_x = 0.95 * (1.0 - (ny / 1.15) ** 1.6)
        return abs(nx) <= max(0.0, max_x)

    def point_in_play_triangle(x, y):
        nx = (x - center_x) / (size * 0.22)
        ny = (y - center_y) / (size * 0.22)
        # Equilateral-like triangle pointing right
        if nx < -0.5 or nx > 0.7:
            return False
        h = (0.7 - nx) * 0.8
        return abs(ny) <= h

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            
            # Subpixel sampling (2x2) for antialiasing
            hits_shield = 0
            hits_play = 0
            for sy in [0.25, 0.75]:
                for sx in [0.25, 0.75]:
                    px = x + sx
                    py = y + sy
                    if point_in_shield(px, py):
                        hits_shield += 1
                        if point_in_play_triangle(px, py):
                            hits_play += 1

            if hits_shield > 0:
                alpha = int((hits_shield / 4.0) * 255)
                # Gradient based on y
                t = y / float(size)
                r = int(c_bg_top[0] * (1 - t) + c_bg_bottom[0] * t)
                g = int(c_bg_top[1] * (1 - t) + c_bg_bottom[1] * t)
                b = int(c_bg_top[2] * (1 - t) + c_bg_bottom[2] * t)

                # Play triangle overlay in white
                if hits_play > 0:
                    play_alpha = hits_play / 4.0
                    r = int(r * (1 - play_alpha) + c_white[0] * play_alpha)
                    g = int(g * (1 - play_alpha) + c_white[1] * play_alpha)
                    b = int(b * (1 - play_alpha) + c_white[2] * play_alpha)

                pixels[idx] = r
                pixels[idx + 1] = g
                pixels[idx + 2] = b
                pixels[idx + 3] = alpha
            else:
                pixels[idx] = 0
                pixels[idx + 1] = 0
                pixels[idx + 2] = 0
                pixels[idx + 3] = 0

    return bytes(pixels)


def main():
    icons_dir = os.path.join(os.path.dirname(__file__), "..", "icons")
    os.makedirs(icons_dir, exist_ok=True)

    # 1. Generate SVG
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF1E27" />
      <stop offset="100%" stop-color="#A50014" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <!-- Shield Body -->
  <path d="M 64,12 C 92,12 112,18 112,38 C 112,78 64,116 64,116 C 64,116 16,78 16,38 C 16,18 36,12 64,12 Z" 
        fill="url(#shieldGrad)" filter="url(#shadow)" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.3"/>
  <!-- Play Icon in Center -->
  <polygon points="54,46 84,64 54,82" fill="#FFFFFF" />
  <!-- Ad Shield Slash / Sparkle Indicator -->
  <circle cx="94" cy="34" r="8" fill="#00E696" stroke="#0F172A" stroke-width="2"/>
  <path d="M 91,34 L 93,36 L 97,31" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>"""

    with open(os.path.join(icons_dir, "icon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Generated icon.svg")

    # 2. Generate PNGs
    for size in (16, 48, 128):
        rgba = render_shield_icon(size)
        png_data = create_png(size, size, rgba)
        filename = os.path.join(icons_dir, f"icon{size}.png")
        with open(filename, "wb") as f:
            f.write(png_data)
        print(f"Generated {filename} ({size}x{size})")


if __name__ == "__main__":
    main()
