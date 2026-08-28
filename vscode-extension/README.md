# DrakoFlow Diagram Engine for VS Code

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/pazvanti.drakoflow-vscode?style=flat-square&color=blue&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=pazvanti.drakoflow-vscode)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-purple.svg?style=flat-square)](https://github.com/pazvanti/DrakoFlow/blob/main/LICENSE)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Offline-success.svg?style=flat-square)](#-100-offline--privacy-first)
[![Live Web App](https://img.shields.io/badge/Online%20Editor-Try%20Live-60a5fa?style=flat-square)](https://pazvanti.github.io/DrakoFlow/)

**DrakoFlow** is a modern, lightweight, privacy-first **text-to-diagram engine** designed for developers, architects, and technical writers. Write clean, human-readable declarative DSL code (`.drako`) and watch your software architectures, sequence flows, and Git branching workflows render live in real-time right inside VS Code.

Everything is processed 100% client-side with zero external servers, zero telemetry, and zero latency.

---

## 🎬 Live Demo

![DrakoFlow Live Preview Demo](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/drako.gif)

---

## ✨ Key Features

### 🔄 Real-Time Split-View Preview
See your diagrams render and update instantly as you write. The preview stays locked to your editor state with zero lag.

---

### 💡 Bi-Directional Code ↔ Canvas Highlighting
Hovering over any component, container, or commit in the visual diagram automatically highlights its corresponding DSL code block and gutter lines in the editor — and moving your editor cursor highlights the corresponding component on the canvas.

![Bi-Directional Highlighting](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/screenshot2.png)

---

### ⚡ Dedicated Layout & Flow Engines
Switch layouts effortlessly with the `@layout` directive:
- **`@layout: left-to-right` / `@layout: top-to-bottom`**: Architecture flowcharts, sequence diagrams with lifelines, automated blue/green deployment routes, animated flow arrows, and container boundaries.
- **`@layout: git-flow`**: Purpose-built Git Flow engine with branch lanes (`main`, `develop`, `feature`), smooth Bézier merge & fork curves, slanted `-45°` commit hash badges, custom messages, and release tags.
- **`@layout: mindmap` / `@layout: mindmap(RootNode)`**: Radial brainstorming mindmap engine with automatic root node detection, branch theme color inheritance, and organic curved connections.

![Sequence & Architecture Flowcharts](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/screenshot1.png)

![Git Flow Branching Diagrams](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/screenshot3.png)

---

### 🧩 Extensive Component & Shape Library
Model any architecture with specialized components:
- **Cloud & Infrastructure**: `Cube` (isometric 3D services), `Cylinder` (databases/caches), `Cloud`, `Storage`, `Queue`, `Artifact`, `Folder`, `Node`, `Card`.
- **Software & UML**: `Rectangle`, `Process` (segmented step bars), `Package` (UML boundaries), `Actor` (stick figure), `Diamond` (decision gateway), `Class`, `Interface`, `Enum`, `Abstract`, `Struct`, `Object`, `Table`.
- **Git Flow**: `Branch` (colorable swimlanes), `Commit` (hash badges, reverse types, tags).
- **Embedded Media**: `SVGImage` (vector graphics), `RasterImage` (PNG/JPEG/GIF).

---

### 🎨 Built-in Developer Vector Icons & Themes
- **20+ Built-in Brand Icons**: Add `icon: "docker"`, `icon: "aws"`, `icon: "postgres"`, `icon: "kubernetes"`, `icon: "redis"`, `icon: "python"`, `icon: "react"`, `icon: "node"`, `icon: "database"`, `icon: "api"`, `icon: "queue"`, `icon: "storage"`, `icon: "cpu"`, `icon: "lock"`, etc. Icons automatically adapt to the component's label color across all themes.
- **Color Palettes**: Beautiful dark and light presets (`Drako Dark`, `Drako Light`, `Obsidian Dark`, `Serene Light`) plus per-element `themeOverride` and color pickers.

---

### 🔒 100% Offline & Privacy-First
Your code and diagrams **never leave your machine**. There are no cloud dependencies, no API keys, and no telemetry. DrakoFlow runs strictly inside the local VS Code extension host and webview.

---

### 🔁 PlantUML Importer (Beta)
Already have PlantUML diagrams? DrakoFlow includes a built-in translator that automatically converts PlantUML sequence and activity diagrams into clean DrakoFlow DSL.

---

### 📤 Interactive HTML & Image Export
- **Self-Contained HTML Player**: Export an interactive, standalone HTML file with built-in pan, zoom, minimap, tag filters, and collapsible code viewer.
- **High-Resolution PNG & SVG**: Export publication-ready images for documentation, pull requests, and presentations.

---

## 🚀 How to Use

1. **Create or Open a `.drako` File**:
   Create any file with the `.drako` extension (e.g. `architecture.drako`).
2. **Open the Live Preview**:
   - Click the **DrakoFlow Preview** icon (graph icon) in the top-right editor title bar.
   - Or press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS) and run **DrakoFlow: Open Preview to the Side**.
3. **Write and Explore**:
   - Write your diagram DSL and watch the canvas update live.
   - Use the mouse wheel to zoom, click and drag to pan, or click **Fit to Screen** (`⛶`) to center.

---

## 📝 Syntax Examples

### 1. Sequence & Architecture Flow (`.drako`)

```scss
// Define components
Client: Process {
  label: "Client Web App"
  lifeline: true
  icon: "react"
  themeOverride: {
    borderColor: "primaryColor"
  }
}

Gateway: Rectangle {
  label: "API Gateway"
  lifeline: true
  icon: "api"
}

Database: Cylinder {
  label: "PostgreSQL Database"
  icon: "postgres"
}

// Model sequence interactions with animated lines
Client -> Gateway : "1. GET /api/v1/users" {
  lineStyle: "solid"
  color: "primaryColor"
  animated: true
}

Gateway -> Database : "2. Query User Records" {
  lineStyle: "dashed"
  color: "secondaryColor"
}

Database -> Gateway : "3. Return Data" {
  lineStyle: "dashed"
  color: "secondaryColor"
}

Gateway -> Client : "4. 200 OK (JSON)" {
  lineStyle: "solid"
  color: "#34d399"
  animated: true
}
```

---

### 2. Git Flow Branching Diagram (`.drako`)

```scss
@layout: git-flow

Main: Branch {
  label: "main"
  color: #ff0000

  c0: Commit { hash: "0-e3a3a20" }
  c3: Commit { type: "merge" }
  c4: Commit { hash: "4-646b55f" }
  c7: Commit { type: "merge" }
}

Develop: Branch {
  label: "develop"

  c1: Commit { hash: "1-201f4e4" }
  c2: Commit {
    hash: "2-6c2e9d5"
    message: "Implement OAuth auth flow"
    type: "reverse"
    tag: "v1.0.0"
  }
}

Feature: Branch {
  label: "feature"

  c5: Commit { hash: "5-71f2792" }
  c6: Commit { hash: "6-e534d9" }
}

c0 -> c1
c1 -> c2
c2 -> c3
c0 -> c3
c3 -> c4
c4 -> c5
c5 -> c6
c6 -> c7
c4 -> c7
```

---

### 3. Microservice Packages & Containers (`.drako`)

```scss
@tags: ["microservices"]
Backend: Package {
  label: "Core Services Cluster"
  gap: 16
  padding: 20

  AuthService: Cube {
    label: "Auth Service"
    icon: "docker"
  }

  PaymentService: Cube {
    label: "Payment Gateway"
    icon: "aws"
  }
}

UserDB: Cylinder {
  label: "User DB"
  icon: "postgres"
}

PaymentDB: Cylinder {
  label: "Transactions DB"
  icon: "postgres"
}

AuthService <-> UserDB: "Read/Write Users"
PaymentService <-> PaymentDB: "Persist Transactions"
```

---

## ⚙️ Extension Settings

| Setting | Default | Description |
| :--- | :--- | :--- |
| `drakoflow.preview.autoOpen` | `true` | Automatically opens the DrakoFlow split preview when opening a `.drako` file. |

---

## 🆚 Why DrakoFlow?

| Feature | DrakoFlow | Mermaid.js | PlantUML |
| :--- | :---: | :---: | :---: |
| **Interactive Canvas (Pan/Zoom/Minimap)** | ✅ Yes | ❌ Limited | ❌ Static image |
| **Bi-Directional Code Highlighting** | ✅ Built-in | ❌ No | ❌ No |
| **Git Flow Branch/Merge Visualization** | ✅ Native | ⚠️ Basic | ⚠️ Basic |
| **Integrated Vector Tech Icons** | ✅ 20+ icons | ❌ No | ⚠️ Requires plugins |
| **Zero Java / Graphviz Dependency** | ✅ 100% Pure JS | ✅ Pure JS | ❌ Needs Java/Graphviz |
| **Standalone Interactive HTML Player** | ✅ One-click export | ❌ No | ❌ No |
| **100% Offline & Private** | ✅ Yes | ✅ Yes | ⚠️ Depends on setup |

---

## 🔗 Useful Links

- 🌐 **Live Web Application**: [https://pazvanti.github.io/DrakoFlow/](https://pazvanti.github.io/DrakoFlow/)
- 📖 **Examples Gallery**: [https://pazvanti.github.io/DrakoFlow/examples.html](https://pazvanti.github.io/DrakoFlow/examples.html)
- 🐙 **GitHub Repository**: [https://github.com/pazvanti/DrakoFlow](https://github.com/pazvanti/DrakoFlow)
- 🐛 **Issue Tracker**: [https://github.com/pazvanti/DrakoFlow/issues](https://github.com/pazvanti/DrakoFlow/issues)

---

## 📄 License

This extension is licensed under the [GNU General Public License v3.0 (GPL-3.0)](https://github.com/pazvanti/DrakoFlow/blob/main/LICENSE).
