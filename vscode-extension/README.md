# DrakoFlow Diagram Preview

**Live Site:** [https://pazvanti.github.io/DrakoFlow/](https://pazvanti.github.io/DrakoFlow/)

DrakoFlow is a lightweight, offline-first, client-side text-to-diagram engine written in TypeScript. It converts a clean, human-readable declarative DSL into interactive, themeable architecture diagrams that run entirely in the browser or VSCode with no server-side dependencies.

A Visual Studio Code extension that provides a live, interactive preview panel for **DrakoFlow** text-to-diagram files (`.drako`). See your architecture diagrams render and update in real-time as you type.

> [!IMPORTANT]
> **Privacy-First & Secure**: Everything is processed locally in the browser/VSCode. No diagram data is sent to a back-end server.

---

## Features

- **Live Synchronization**: The preview updates automatically in real-time as you edit your `.drako` file.
- **Interactive Viewport**: Pan, zoom in, zoom out, reset, and fit the diagram to the screen.
- **Minimap Navigation**: Use the interactive minimap overlay to quickly navigate large diagrams.
- **Customizable Layouts & Themes**:
  - Switch layout directions (Left to Right / Top to Bottom).
  - Choose from multiple themes (Drako Dark, Drako Light, Obsidian Dark, Serene Light).
  - Customize specific element styles locally inside the DSL script using `themeOverride` properties.

---

## How to Use

1. **Open** any file ending with `.drako` in VS Code.
2. **Open the Preview**:
   - Click the **DrakoFlow Preview** icon (a small graph icon) in the editor's title bar (top-right of the editor).
   - Alternatively, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and execute **DrakoFlow: Open Preview to the Side**.
3. **Edit your code**: Write diagram DSL structures, and watch the preview render automatically.

---

## Example DSL

Save the following content in a `.drako` file to test the extension:

```drakoflow
// Define elements
WebBrowser: Browser {
  label: "Web Browser Client"
}

API_Gateway: Process {
  label: "API Gateway"
}

UserStore: Storage {
  label: "User Store Database"
}

// Connect elements
WebBrowser -> API_Gateway: "HTTPS Requests"
API_Gateway -> UserStore: "Read/Write Users"
```

---

## Requirements

- **VS Code Version**: `^1.75.0`

---

## Extension Settings & Customization

The extension uses the same lightweight rendering engine as the main DrakoFlow Web Application. Layout configuration (such as grid snapping, themes, and orientation) is fully persistent across your preview session.

---

## License

This extension is licensed under the [GNU General Public License v3.0](LICENSE).
