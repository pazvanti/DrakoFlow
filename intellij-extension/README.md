# DrakoFlow IntelliJ IDEA Plugin

Live split-view diagram preview extension for DrakoFlow (`.drako`) files inside IntelliJ IDEA and JetBrains IDEs.

## Features

- **Split View**: Edit DrakoFlow DSL code on the left and see the rendered diagram live on the right.
- **Bi-directional Sync**: Text changes in the editor automatically re-render the diagram; visual node edits/dragging in the diagram sync back to the editor.
- **Zero Engine Duplication**: Reuses 100% of the compiled TypeScript diagram rendering engine (`dist/`) embedded via JetBrains Chromium Embedded Framework (`JBCefBrowser`).
- **Standard View Controls**: Toggle between **Editor Only**, **Split View**, and **Preview Only** mode using IntelliJ's native editor header controls.

## Prerequisites

- Java 17+ (or JDK bundled with IntelliJ IDEA)
- Node.js (to build the webview bundle)

## Building the Plugin

1. **Build the Web Engine Bundle**:
   From the root project directory, run:
   ```bash
   npm run build:intellij
   ```
   This compiles the web engine with Vite and copies the built assets into `intellij-extension/src/main/resources/webview-dist/`.

2. **Package the IntelliJ Plugin**:
   From the `intellij-extension` directory, run:
   ```powershell
   .\gradlew.bat buildPlugin
   ```
   *(Or `./gradlew buildPlugin` on macOS/Linux)*

3. **Install in IntelliJ IDEA**:
   - Open IntelliJ IDEA.
   - Go to **Settings/Preferences** -> **Plugins** -> ⚙️ (Gear Icon) -> **Install Plugin from Disk...**.
   - Select the generated `.zip` file from `intellij-extension/build/distributions/`.
   - Open any `.drako` file to enjoy the live split-view diagram preview!
