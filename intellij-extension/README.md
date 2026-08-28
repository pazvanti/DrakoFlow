# DrakoFlow Diagram Engine for IntelliJ IDEA & JetBrains IDEs

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-purple.svg?style=flat-square)](https://github.com/pazvanti/DrakoFlow/blob/main/LICENSE)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Offline-success.svg?style=flat-square)](#-100-offline--privacy-first)
[![Live Web App](https://img.shields.io/badge/Online%20Editor-Try%20Live-60a5fa?style=flat-square)](https://pazvanti.github.io/DrakoFlow/)

**DrakoFlow** is a modern, privacy-first **text-to-diagram engine** for JetBrains IDEs (IntelliJ IDEA, WebStorm, PyCharm, PhpStorm, GoLand, Rider, CLion, RustRover). Write clean, human-readable declarative DSL code (`.drako`) and watch your software architectures, sequence flows, and Git branching workflows render live in real-time right inside your IDE.

---

## 🎬 Live Demo

![DrakoFlow Live Preview Demo](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/drako.gif)

---

## ✨ Features

- **Live Split-View Preview**: Edit `.drako` code on the left and see the rendered diagram live on the right with zero latency.
- **Bi-Directional Highlighting**: Hover over diagram elements to highlight corresponding DSL lines in the editor, and vice versa.
- **Native Split Editor Modes**: Seamlessly toggle between **Editor Only**, **Split View**, and **Preview Only** using IntelliJ's native editor header controls.
- **Multiple Dedicated Layout Engines**:
  - **Sequence & Flowcharts** (`@layout: left-to-right` / `@layout: top-to-bottom`) with lifelines, animated flow arrows, and auto-routing.
  - **Git Flow Branching Diagrams** (`@layout: git-flow`) for branch swimlanes, commit hash badges, merge curves, and tag pills.
- **Rich Component Palette & UML Shapes**:
  - `Cube` (3D isometric), `Cylinder` (databases), `Rectangle`, `Process` (segmented step bars), `Package` (UML boundaries), `Actor`, `Diamond` (gateways), `Class`, `Interface`, `Cloud`, `Storage`, `Queue`, `Branch`, `Commit`, and more.
- **20+ Built-in Vector Icons**: `docker`, `aws`, `postgres`, `kubernetes`, `redis`, `python`, `react`, `node`, `database`, `api`, `lock`, `user`, etc.
- **100% Offline & Privacy-First**: 100% client-side rendering via embedded Chromium/JCEF (`JBCefBrowser`). No diagram data ever leaves your local machine.
- **PlantUML Importer**: Translate existing PlantUML diagrams directly into DrakoFlow DSL.

---

## 📸 Screenshots

### Sequence & Architecture Flowcharts
![Sequence & Architecture Flowcharts](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/screenshot1.png)

### Bi-Directional Code ↔ Canvas Highlighting
![Bi-Directional Highlighting](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/screenshot2.png)

### Git Flow Branching Diagrams
![Git Flow Branching Diagrams](https://raw.githubusercontent.com/pazvanti/DrakoFlow/main/screenshots/screenshot3.png)

---

## 🚀 How to Use

1. Create or open any file with the `.drako` extension (e.g., `diagram.drako`).
2. Use IntelliJ's native editor tab controls in the top-right to switch between:
   - **Editor Only**
   - **Split View (Editor + Preview)**
   - **Preview Only**
3. Write your DSL code and see the diagram render automatically in real-time.

---

## 📝 Syntax Examples

### Architecture & Sequence Flow
```scss
Client: Process {
  label: "Client App"
  lifeline: true
  icon: "react"
}

Server: Process {
  label: "API Server"
  lifeline: true
  icon: "docker"
}

Database: Cylinder {
  label: "PostgreSQL Database"
  icon: "postgres"
}

Client -> Server: "1. GET /users" { lineStyle: "solid" }
Server -> Database: "2. Query Database" { lineStyle: "dashed" }
Database -> Server: "3. User Records" { lineStyle: "dashed" }
Server -> Client: "4. 200 OK (JSON)" { color: "#34d399" }
```

### Git Flow
```scss
@layout: git-flow

Main: Branch {
  label: "main"
  color: #ff0000

  c0: Commit { hash: "0-e3a3a20" }
  c3: Commit { type: "merge" }
  c4: Commit { hash: "4-646b55f" }
}

Develop: Branch {
  label: "develop"

  c1: Commit { hash: "1-201f4e4" }
  c2: Commit { hash: "2-6c2e9d5" }
}

c0 -> c1
c1 -> c2
c2 -> c3
c0 -> c3
c3 -> c4
```

---

## 🛠️ Building & Packaging the Plugin

### Prerequisites
- Java 17+ (or bundled IDE JDK)
- Node.js 16+

### Build Steps
1. **Build the Web Engine Bundle** (from root workspace):
   ```bash
   npm run build:intellij
   ```
2. **Package the IntelliJ Plugin** (from `intellij-extension` directory):
   ```powershell
   .\gradlew.bat buildPlugin
   ```
   *(Or `./gradlew buildPlugin` on macOS/Linux)*
3. The plugin archive will be generated in `intellij-extension/build/distributions/drakoflow-intellij-1.0.0.zip`.

---

## 📄 License

This plugin is licensed under the [GNU General Public License v3.0 (GPL-3.0)](https://github.com/pazvanti/DrakoFlow/blob/main/LICENSE).
