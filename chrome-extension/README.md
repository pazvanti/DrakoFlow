# DrakoFlow Chrome Extension

A silent, client-side browser extension for Google Chrome, Brave, Edge, and Chromium-based browsers that automatically renders ```drako markdown code blocks into live interactive HTML diagram players across the web.

---

## ⚡ Features

- **Silent & Automatic:** Scans pages in real-time using `MutationObserver` (works with GitHub issues/PRs, GitLab, ChatGPT, Notion, Jira, raw Markdown, and more).
- **Interactive Player:** Embeds full interactive canvas controls (pan, zoom, fit-to-screen, minimap, view code toggle).
- **All Engines Supported:** Flowcharts, sequence diagrams with lifelines, specialized Git Flow branch maps, radial mindmaps, and 3D bar/line charts.
- **100% Client-Side & Private:** All diagram parsing and SVG rendering happens entirely locally in your browser. No diagram code is transmitted to any server.

---

## 📥 Installation

### 1. Install from Chrome Web Store (Recommended)
Install directly with one click from the official **[Chrome Web Store](https://chromewebstore.google.com/detail/drakoflow-diagram-rendere/fmlooeikllkmicanocacmppcmfofomji)**.

### 2. Direct ZIP Download
1. Download `drakoflow-chrome-1.0.0.zip` directly from the [DrakoFlow Website](https://pazvanti.github.io/DrakoFlow/#extensions).
2. Unpack/extract the `.zip` archive to a folder on your computer.
3. Open your browser and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the extracted folder.

### 3. Load Unpacked (Build from Source)
1. Download or clone this repository.
2. Build the extension:
   ```bash
   npm run build:chrome
   ```
3. Open your browser and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the `chrome-extension/` directory.
6. The extension is now active! Open any webpage containing ` ```drako ` code blocks to see them automatically transform into interactive diagrams.

---

## 🛠️ Building

To build the extension bundle:
```bash
npm run build:chrome
```
This compiles TypeScript sources and bundles them into `chrome-extension/dist/content.js` and `chrome-extension/dist/content.css`.
