# DrakoFlow

**Live Site:** [https://pazvanti.github.io/DrakoFlow/](https://pazvanti.github.io/DrakoFlow/)

DrakoFlow is a lightweight, offline-first, client-side text-to-diagram engine written in TypeScript. It converts a clean, human-readable declarative DSL into interactive, themeable architecture diagrams that run entirely in the browser with no server-side dependencies.

> [!IMPORTANT]
> **Privacy-First & Secure**: Everything is processed locally in the browser. No diagram data is sent to a back-end server.

---

## ✨ Highlights

- **Declarative DSL parser.** Turn structured text blocks into diagrams instantly.
- **PlantUML translator (Beta).** Import PlantUML and auto-translate it to DrakoFlow's DSL.
- **Drag-and-drop overrides.** Move elements on the canvas; coordinate overrides (`x` and `y`) are rounded and serialized back into the DSL editor.
- **Canvas lock.** Prevent accidental edits by locking the canvas (disables dragging when enabled).
- **Editor ↔ Canvas highlighting.** Hover in the SVG canvas to highlight the corresponding DSL lines, and vice versa.
- **Nested scopes & packages.** Group related components using `Package` blocks or `VerticalContainer` layouts.
- **Themes & style overrides.** Switch themes or customize shape colors via a `themeOverride` block.
- **Offline export options.** Export high-resolution PNG, copy SVG to the clipboard, or export a self-contained interactive HTML player.
- **Snap-to-grid & minimap.** Toggle grid snapping and use the minimap for quick navigation.
- **Serverless sharing.** Share diagrams via a URL that contains compressed diagram data.

---

## 🚀 Getting started

Open the editor in your browser and try the engine immediately:

👉 **[Launch Interactive Editor (Live Site)](https://pazvanti.github.io/DrakoFlow/)** or open the local file [docs/drako/index.html](./docs/drako/index.html).

---

## 📝 DSL Syntax (example)

Below is an example showing tags, nested packages, styling overrides, and connections:

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

### Component types

- `Rectangle` : standard box with corner rounding (`rx`, `ry`).
- `Cube` : isometric 3D block for services.
- `Cylinder` : barrel shape for databases or caches.
- `Ellipse` : circular or oval nodes.
- `Package` : folder-style UML boundary for grouping.
- `Actor` : UML actor (stick figure) for external roles.
- `Diamond` : decision gateway for flowcharts.
- `Hexagon` : domain boundary or special shape.
- `Process` : process step box with segmented bars.
- `SVGImage` : embed vector content via `content`, scalable with `scale`.
- `RasterImage` : embed base64 raster images (`PNG`, `JPEG`, `GIF`) via `content`.

---

## 🛠️ Local development

### Prerequisites
Node.js v16 or later.

### Install
```bash
npm install
```

### Run dev server
```bash
npm run dev
```

### Build for GitHub Pages
```bash
npm run build:pages
```

This runs a production build into `dist/` and executes [scripts/build-gh-pages.js](./scripts/build-gh-pages.js) to populate `docs/drako/`.

### Tests
```bash
npm run test
```

---

## 📄 License

DrakoFlow is released under the **GNU General Public License v3 (GPL-3.0)**. See the [LICENSE](./LICENSE) file for details.
