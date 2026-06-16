# DrakoFlow Diagram Preview - VS Code Extension

This extension renders DrakoFlow DSL scripts (`.drako`) into interactive flow/sequence architecture diagrams directly in Visual Studio Code. It provides a side-by-side rendering view similar to the Markdown preview.

## Features

- **Bidirectional Synchronization**: Edits to the `.drako` file update the preview in real-time. Dragging elements or editing properties in the preview writes updated coordinates and settings back to the VS Code text document.
- **Component Library**: Access and insert standard architecture components into your DSL script from the dockable side panel.
- **Interactive Controls**: Supports canvas lock/unlock, pan/zoom, theme selection (Drako Dark, Drako Light, Obsidian, Serene), layout orientation selection, snap-to-grid controls, and navigation minimap.
- **Exporting Options**: Export your diagram to a high-resolution PNG or download a standalone interactive HTML player file directly from the VS Code window.

## Development and Compilation

Since this extension reuses the core rendering engine and assets of the web editor, you must build the main project first.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed.

### Step 1: Build the Web Editor Application

Run the build script at the root directory of the `DrakoFlow` workspace:

```bash
# Navigate to root (if needed) and run vite build
npm install
npx vite build
```

This generates the unhashed production assets in the root `dist/` directory.

### Step 2: Set up the Extension Directory

Navigate to the `vscode-extension` directory and install the developer dependencies:

```bash
cd vscode-extension
npm install
```

### Step 3: Compile the Extension

Compile the TypeScript source code and copy the web editor assets into the extension folder:

```bash
# This compiles typescript and executes the scripts/copy-dist.js copy helper
npm run build-all
```

## Running & Debugging in VS Code

1. Open the `DrakoFlow` project in VS Code.
2. Select the **Extension** folder `vscode-extension` or just open the project.
3. Open `vscode-extension/src/extension.ts`.
4. Press `F5` (or go to **Run and Debug** -> **Run Extension**). This opens a new **Extension Development Host** window.
5. Create or open any `.drako` file in the new window.
6. Click the preview icon (a small graph icon) in the editor's title menu bar (top-right of the editor), or open the Command Palette (`Ctrl+Shift+P`) and execute **DrakoFlow: Open Preview to the Side**.

## Packaging and Installing (.vsix)

To share or install the extension locally without running the debug host:

1. Install the global VS Code extension manager `vsce`:
   ```bash
   npm install -g @vscode/vsce
   ```
2. Navigate to the `vscode-extension` directory.
3. Run the package command:
   ```bash
   vsce package
   ```
   This will output a `drakoflow-vscode-1.0.0.vsix` file in the `vscode-extension` folder.
4. Install the extension in VS Code:
   - Go to the **Extensions** tab (`Ctrl+Shift+X`).
   - Click the three dots (`...`) in the top-right corner of the Extensions sidebar.
   - Select **Install from VSIX...** and select the generated `.vsix` file.
