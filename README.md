# DrakoFlow

**Live Site:** [https://pazvanti.github.io/DrakoFlow/](https://pazvanti.github.io/DrakoFlow/)

DrakoFlow is a lightweight, offline-first, client-side text-to-diagram engine built in TypeScript. It transforms a clean, human-readable declarative DSL into beautiful, interactive, and themeable architecture diagrams directly in your browser with zero server-side dependencies.

> [!IMPORTANT]
> **Privacy-First & Secure**: Everything is processed entirely client-side. There are no server-side interactions, no data is sent to a back-end server, and your diagrams never leave your computer.

---

## ✨ Features

- **Declarative DSL Parser**: Turn simple structured text blocks into diagrams instantly.
- **Drag-and-Drop Overrides**: Position elements manually by dragging them on the canvas. Coordinate overrides (`x` and `y` properties) round and serialize back to the DSL text in the editor.
- **Diagram Safety Lock**: Prevent accidental modifications by locking the canvas; when locked, component dragging is disabled.
- **Bidirectional Gutter Highlights**: Hovering over components in the SVG canvas highlights their corresponding lines in the code editor, and vice versa, for fast cross-referencing.
- **Subsystem & Nested Scopes**: Group system microservices and components using the UML `Package` folder blocks or `VerticalContainer` layout boundaries.
- **Rich Themes & Style Overrides**: Swap between dark and light themes, or completely customize shape colors (background, border, text) inside a `themeOverride` block.
- **Offline Exports**: Save your diagram selections or full viewports to standard, High-Res, or Ultra-HD (4K) PNG formats with custom paddings and transparency.

---

## 🚀 Getting Started

You can open the editor tool and play with the engine directly in your browser:

👉 **[Launch Interactive Editor (Live Site)](https://pazvanti.github.io/DrakoFlow/)** (or local file: [docs/drako/index.html](./docs/drako/index.html))

---

## 📝 DSL Syntax Guide

DrakoFlow uses a clean, intuitive syntax. Below is a comprehensive example demonstrating decorators, shapes, custom styling overrides, UML packages, and directed edge connections:

```scss
// 1. Declare metadata tags to filter your views
@tags: ["gateway", "proxy"]
Gateway: Rectangle {
  label: "API Gateway"
  rx: 8
  ry: 8
  x: 50
  y: 155
}

// 2. Nest objects inside UML Package boundaries
@tags: ["core", "services"]
CoreDomain: Package {
  label: "Core Services"
  gap: 16
  padding: 20

  AuthService: Cube {
    label: "Auth Service"
    themeOverride: {
      backgroundColor: "#1e1e2e"
      borderColor: "#8b5cf6"
      textColor: "#cdd6f4"
    }
  }

  PaymentService: UMLComponent {
    label: "Payment API"
  }
}

// 3. Define structured databases
@tags: ["storage"]
UserDB: Cylinder {
  label: "User Store"
  x: 340
  y: 220
}

// 4. Connect elements with labels and styled routes
Gateway -> AuthService: "Validate token"
Gateway o-> PaymentService: "Process transaction"
AuthService <-> UserDB: "Read/Write credentials"
```

### Component Types Available
- `Rectangle`: Standard box supporting corner roundings `rx` and `ry`.
- `Cube`: 3D isometric block shape for services.
- `Cylinder`: Cylindrical barrel shape representing databases or caches.
- `Ellipse`: Circular or oval nodes.
- `Package`: Folder-style UML boundaries for grouping nested shapes.
- `Actor`: UML stick figure representing external roles or users.
- `Diamond`: Decision gateway box for branching flowcharts.
- `Hexagon`: Domain-driven boundary mapping.
- `Process`: Process step boxes with vertical segmented bars.

---

## 🛠️ Local Development

To run or build the project on your machine, follow these instructions:

### Prerequisites
Make sure you have Node.js (version 16+) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Dev Server
Launch Vite's local development server to test edits in real time:
```bash
npm run dev
```

### 3. Build & Package for GitHub Pages
We automate compiling Vite assets with relative anchors and copying the bundled folder to our documentation directories:
```bash
npm run build:pages
```
*This command runs a production build (`dist/`) and executes [scripts/build-gh-pages.js](./scripts/build-gh-pages.js) to populate `docs/drako/`.*

### 4. Running the Test Suite
DrakoFlow has a comprehensive test suite covering parser logic, drag-and-drop coordinate math, and element themes:
```bash
npm run test
```

---

## 📄 License

DrakoFlow is open-source software released under the **GNU General Public License v3 (GPL-3.0)**. See the [LICENSE](./LICENSE) file for details.
