# Contributing to AdShield for YouTube™

Thank you for your interest in contributing to **AdShield for YouTube**! This project is 100% open-source and maintained by the community to ensure an uninterrupted, ad-free video experience for everyone.

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/youtube-ad-shield.git
cd youtube-ad-shield
```

### 2. Load the Extension in Developer Mode
1. Open your browser:
   - **Chrome / Brave / Edge**: Go to `chrome://extensions/` or `edge://extensions/`.
2. Toggle **Developer mode** (top right switch).
3. Click **Load unpacked**.
4. Select the `youtube-ad-shield` root folder.
5. Open YouTube (`https://www.youtube.com`) and test!

---

## 🧪 Testing Your Changes

- **Interactive Test Harness**: Open `tests/test_selectors.html` directly in your browser to test ad-detection hooks, selector matching, and anti-adblock modal defeat mechanisms.
- **Console Debugging**: Check the browser console on `youtube.com` for `[AdShield]` logs.

---

## 📐 Architecture & Guidelines

1. **Undetectability First**:
   - YouTube frequently tests anti-adblock detection scripts. Never aggressively block core video chunks (`googlevideo.com`). Instead, utilize speed acceleration (16x playback rate) + smart muting + instant skip button actuation.
2. **Zero Layout Shifts**:
   - Cosmetic rules in `src/cosmetic.css` must collapse ad containers cleanly without breaking YouTube layout grids or video recommendation shelves.
3. **Manifest V3 Standards**:
   - Keep network blocking rules purely declarative inside `rules.json`.
   - Store settings and telemetry in `chrome.storage.local`.

---

## 📬 Pull Request Process

1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feature/my-enhancement
   ```
2. Commit clear, descriptive changes:
   ```bash
   git commit -m "feat: handle 2026 YouTube mini-player ad slot update"
   ```
3. Push to your fork and submit a Pull Request.

---

## 📜 License
By contributing to this repository, you agree that your contributions will be licensed under the [MIT License](LICENSE).
