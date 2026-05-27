# Technical Design Document: Text-to-Diagram Engine (Codename: "DrakoFlow")

This document defines the architecture, data structures, and implementation specifications for building a client-side, open-source text-to-diagram application in TypeScript. 

The tool runs entirely in the browser without a backend server, has zero heavy dependencies, supports customizable components via a common abstraction, and includes a global theming engine with component-level overrides.

---

## 1. System Architecture & Pipeline

The application follows a unidirectional compiler pipeline to turn text DSL into a rendered diagram:

```
[ User Input (DSL Text) ]
          │
          ▼
   ┌─────────────┐
   │   Parser    │  (Lexes & Parses text into AST)
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Resolver   │  (Validates components, matches catalog schemas, merges styles)
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │Layout Engine│  (Calculates coordinates, dimensions, and line paths)
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Renderer   │  (Generates interactive SVG / exports to PNG via Canvas)
   └─────────────┘
```

### Architecture Constraints
*   **Runtime:** Modern browsers (Chrome, Firefox, Safari, Edge). Must be offline-capable (loadable via a single `index.html` + compiled `app.js` bundle).
*   **Language:** Pure TypeScript (compiled to ES6 target).
*   **Dependencies:** 
    *   *Permitted:* A lightweight parser generator (e.g., `peggy` or a lightweight custom recursive descent parser) to avoid maintaining complex regex.
    *   *Forbidden:* Heavy UI frameworks (React, Angular, Vue) or heavy graphic rendering libraries (Three.js, PixiJS). Standard DOM and SVG APIs must be used.
*   **Testing:** Vitest or Jest for unit tests.

---

## 2. DSL Grammar Specification

The DSL parser must recognize three primary structures: **Global Directives**, **Component Definitions**, and **Relationships**.

### Formal Grammar (Simplified)
```pegjs
Diagram
  = Statements:Statement*

Statement
  = GlobalDirective
  / Relationship
  / ComponentDefinition

ComponentDefinition
  = tags:TagList? id:Identifier ":" type:Identifier "{" properties:Property* "}"

Property
  = key:Identifier ":" value:Value

Value
  = StringLiteral
  / ObjectLiteral
  / ArrayLiteral
  / Identifier

Relationship
  = source:Identifier sourceCard:Cardinality? "->" targetCard:Cardinality? target:Identifier label:RelationshipLabel?

RelationshipLabel
  = ":" text:StringLiteral style:ObjectLiteral?
```

### DSL Example Reference
```text
theme: "bootstrap-dark"

@tags: ["database", "auth"]
UserTable: Table {
  title: "User Registry"
  rows: {
    id: "UUID"
    email: "String"
  }
  themeOverride: {
    primaryColor: "#007bff"
    textColor: "#ffffff"
  }
}

@tags: ["billing"]
InvoiceTable: Table {
  title: "Invoices"
  rows: {
    id: "UUID"
    userId: "UUID"
    amount: "Decimal"
  }
}

UserTable [1] -> [0..*] InvoiceTable : "has invoices" {
  lineStyle: "dashed"
  color: "#cccccc"
}
```

---

## 3. Core Component Abstraction

All diagram shapes (e.g., `Table`, `StickyNote`, `Card`) must inherit from a common abstraction. This ensures that the layout engine and renderer can handle any component without knowing its specific internal logic.

### Base Types and Interfaces

```typescript
export interface Point {
  x: number;
  y: number;
}

export interface Dimension {
  width: number;
  height: number;
}

export interface BoundingBox extends Point, Dimension {}

export interface ThemeVariables {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  fontFamily: string;
  [key: string]: string; // Support for component-specific style properties
}

export interface ComponentMetadata {
  id: string;
  type: string;
  tags: string[];
}
```

### The `BaseComponent` Abstract Class

Every component implementation must extend this class:

```typescript
export abstract class BaseComponent<TProps = any, TStyle = Partial<ThemeVariables>> {
  public readonly id: string;
  public readonly type: string;
  public readonly tags: string[];
  
  // Properties unique to the component type (e.g., rows, content)
  public props: TProps;
  
  // Local style overrides
  public themeOverride: TStyle;
  
  // Resolved bounds calculated by the Layout Engine
  public bounds: BoundingBox = { x: 0, y: 0, width: 200, height: 150 };

  constructor(metadata: ComponentMetadata, props: TProps, themeOverride: TStyle) {
    this.id = metadata.id;
    this.type = metadata.type;
    this.tags = metadata.tags;
    this.props = props;
    this.themeOverride = themeOverride;
  }

  /**
   * Validates that the input properties match the component's requirements.
   * Throws an error with a clear message if invalid.
   */
  abstract validateProps(): void;

  /**
   * Calculates the minimum dimensions required to display this component's content
   * based on the resolved font sizes, text lengths, and padding.
   */
  abstract calculateMinDimensions(theme: ThemeVariables): Dimension;

  /**
   * Generates the SVG element hierarchy representing the component.
   */
  abstract render(theme: ThemeVariables): SVGElement;
}
```

### Example Component Implementation: `TableComponent`

```typescript
interface TableProps {
  title: string;
  rows: Record<string, string>;
}

export class TableComponent extends BaseComponent<TableProps> {
  validateProps(): void {
    if (!this.props.title) {
      throw new Error(`Component [${this.id}]: 'title' is required for Table types.`);
    }
    if (!this.props.rows || typeof this.props.rows !== 'object') {
      throw new Error(`Component [${this.id}]: 'rows' must be an object of key-value pairs.`);
    }
  }

  calculateMinDimensions(theme: ThemeVariables): Dimension {
    const rowCount = Object.keys(this.props.rows).length;
    const titleLength = this.props.title.length;
    
    // Simple heuristic calculation (can be refined with canvas text measurements)
    const calculatedWidth = Math.max(150, titleLength * 10 + 40);
    const calculatedHeight = 40 + (rowCount * 24) + 10; // Header + rows + padding
    
    return { width: calculatedWidth, height: calculatedHeight };
  }

  render(theme: ThemeVariables): SVGElement {
    // Resolve styling hierarchy: Global Theme -> Component Local Override
    const primary = this.themeOverride.primaryColor || theme.primaryColor;
    const background = this.themeOverride.backgroundColor || theme.backgroundColor;
    const text = this.themeOverride.textColor || theme.textColor;
    const border = this.themeOverride.borderColor || theme.borderColor;
    const font = theme.fontFamily;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", this.id);
    g.setAttribute("transform", `translate(${this.bounds.x}, ${this.bounds.y})`);

    // Draw main container
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", this.bounds.width.toString());
    rect.setAttribute("height", this.bounds.height.toString());
    rect.setAttribute("fill", background);
    rect.setAttribute("stroke", border);
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("rx", "4");
    g.appendChild(rect);

    // Draw Header Background
    const headerRect = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const headerHeight = 30;
    headerRect.setAttribute("d", `M 0,4 Q 0,0 4,0 L ${this.bounds.width - 4},0 Q ${this.bounds.width},0 ${this.bounds.width},4 L ${this.bounds.width},${headerHeight} L 0,${headerHeight} Z`);
    headerRect.setAttribute("fill", primary);
    g.appendChild(headerRect);

    // Draw Title Text
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", "10");
    titleText.setAttribute("y", "20");
    titleText.setAttribute("fill", text);
    titleText.setAttribute("font-family", font);
    titleText.setAttribute("font-weight", "bold");
    titleText.textContent = this.props.title;
    g.appendChild(titleText);

    // Draw rows
    let currentY = 50;
    for (const [fieldName, fieldType] of Object.entries(this.props.rows)) {
      const fieldText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      fieldText.setAttribute("x", "10");
      fieldText.setAttribute("y", currentY.toString());
      fieldText.setAttribute("fill", text);
      fieldText.setAttribute("font-family", font);
      fieldText.textContent = `${fieldName}: ${fieldType}`;
      g.appendChild(fieldText);
      currentY += 20;
    }

    return g;
  }
}
```

---

## 4. Layout & Relationship Engine

Since the DSL does not enforce manual coordinates, the `LayoutEngine` is responsible for computing node positions and drawing routing lines.

### Layout Algorithm Specification
Implement a basic grid-based layout or hierarchical layout (using simplified Sugiyama-style layered placement) to automatically position components.

1.  **Node Sizing:** Traverse all parsed components, calculate their minimum bounds using `calculateMinDimensions()`, and assign initial sizes.
2.  **Node Placement:**
    *   Separate components into levels based on dependency/relationship direction.
    *   Assign grid positions (e.g., Layer 0, Layer 1).
    *   Provide a fallback manual override if a user passes `position: { x, y }` properties inside a component definition block.
3.  **Port Calculation:** Determine boundary intersection points on components to serve as link attachments (North, South, East, West anchors).

### Relationship Drawing (Routing)
Lines representing relationships must connect component borders without clipping through other elements.

```typescript
export interface Relationship {
  sourceId: string;
  targetId: string;
  sourceCardinality?: string;
  targetCardinality?: string;
  label?: string;
  style?: {
    lineStyle?: "solid" | "dashed" | "dotted";
    color?: string;
  };
}
```

**Orthogonal Routing Algorithm (Simplified):**
1. Identify the center coordinates of `SourceComponent` and `TargetComponent`.
2. Find the nearest border intersection points ($P_{start}$ and $P_{end}$).
3. Plot an orthogonal path (using right angles) to avoid passing directly through components, producing a list of point coordinates: $[P_{start}, P_{intermediate1}, P_{intermediate2}, P_{end}]$.
4. Render using an SVG `<path>` element:
   * Solid line: `stroke-dasharray="none"`
   * Dashed line: `stroke-dasharray="5,5"`

---

## 5. Themes Module

Themes must be represented as plain JavaScript objects containing a set of CSS-compatible variables.

```typescript
export interface Theme {
  name: string;
  variables: ThemeVariables;
}

export const GlobalThemes: Record<string, Theme> = {
  "bootstrap-light": {
    name: "Bootstrap Light",
    variables: {
      primaryColor: "#0d6efd",
      secondaryColor: "#6c757d",
      backgroundColor: "#ffffff",
      textColor: "#212529",
      borderColor: "#dee2e6",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }
  },
  "bootstrap-dark": {
    name: "Bootstrap Dark",
    variables: {
      primaryColor: "#0d6efd",
      secondaryColor: "#6c757d",
      backgroundColor: "#212529",
      textColor: "#f8f9fa",
      borderColor: "#495057",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }
  }
};
```

### Style Resolver Logic
The theme logic must execute on every render pass:
$$\text{ResolvedStyle} = \text{Object.assign}(\text{GlobalTheme.variables}, \text{ComponentDefaultStyle}, \text{UserThemeOverride})$$

---

## 6. Catalog and Filtering Specification

The UI must present a catalog of all supported components. This system operates purely on the client side.

### Catalog Schema
```typescript
export interface CatalogItem {
  type: string;
  displayName: string;
  description: string;
  tags: string[];
  template: string; // Boilerplate DSL string ready for pasting
}

export const ComponentCatalog: CatalogItem[] = [
  {
    type: "Table",
    displayName: "Database Table",
    description: "Represents a relational database schema structure with fields and types.",
    tags: ["database", "schema", "sql"],
    template: 'MyTable: Table {\n  title: "NewTable"\n  rows: {\n    id: "Int"\n  }\n}'
  },
  {
    type: "StickyNote",
    displayName: "Sticky Note",
    description: "A quick note box for general annotations.",
    tags: ["annotation", "documentation", "note"],
    template: 'MyNote: StickyNote {\n  content: "Important note goes here"\n}'
  }
];
```

### Catalog Utility Module
The search and filtering engine should support tag filtering and case-insensitive keyword searches across names and descriptions.

```typescript
export class CatalogService {
  public static filterItems(query: string, activeTags: string[]): CatalogItem[] {
    const sanitizedQuery = query.toLowerCase().trim();
    
    return ComponentCatalog.filter(item => {
      const matchesQuery = !sanitizedQuery || 
        item.displayName.toLowerCase().includes(sanitizedQuery) ||
        item.description.toLowerCase().includes(sanitizedQuery) ||
        item.type.toLowerCase().includes(sanitizedQuery);
        
      const matchesTags = activeTags.length === 0 || 
        activeTags.every(tag => item.tags.includes(tag));
        
      return matchesQuery && matchesTags;
    });
  }

  public static getAllTags(): string[] {
    const tags = new Set<string>();
    ComponentCatalog.forEach(item => item.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }
}
```

---

## 7. Export, Save, and Load Operations

Because the application runs entirely in-browser, export actions must use browser APIs exclusively.

### Saving & Loading
*   **File Format:** Raw plain text files (`.txt` or `.draw`) containing the DSL script.
*   **Save:** Handled via a dynamic anchor element download trigger:
    ```typescript
    export function downloadDSLFile(dslContent: string, fileName: string = "diagram.draw"): void {
      const blob = new Blob([dslContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
    ```
*   **Load:** Handled via standard HTML5 `<input type="file">` file reader instances.

### Exporting to PNG (with zoom factor scales)
To export SVGs to PNG formats at high resolutions without pixelation, follow this multi-step canvas drawing procedure:

```typescript
export async function exportToPNG(svgElement: SVGElement, scale: number = 2.0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Scale canvas dimensions to support high-resolution (retina/zoom) exports
      canvas.width = svgElement.clientWidth * scale;
      canvas.height = svgElement.clientHeight * scale;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context."));
        return;
      }
      
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate PNG blob."));
      }, "image/png");
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
```

---

## 8. Directory and File Structure

```
drakoflow-root/
├── index.html                  # Main SPA landing page
├── package.json                # Project config, scripts (build, test)
├── tsconfig.json               # TypeScript configuration target: ES6
├── src/
│   ├── main.ts                 # Application entrypoint & DOM wireup
│   ├── dsl/
│   │   ├── Parser.ts           # Lexes string inputs into raw AST structures
│   │   └── AST.ts              # Interface types matching node representations
│   ├── engine/
│   │   ├── DiagramResolver.ts  # Instantiates components & merges configurations
│   │   ├── LayoutEngine.ts     # Computes coordinate calculations & line paths
│   │   └── Renderer.ts         # Assembles generated SVG trees into DOM
│   ├── components/
│   │   ├── BaseComponent.ts    # Core abstract interface definition
│   │   ├── TableComponent.ts   # Concrete table shape implementations
│   │   └── NoteComponent.ts    # Concrete sticky note shape implementations
│   ├── catalog/
│   │   └── ComponentCatalog.ts # Catalog items, tags, templates
│   ├── themes/
│   │   └── GlobalThemes.ts     # Color system setups & fonts
│   └── utils/
│       └── FileHandlers.ts     # Local text saving & PNG render utilities
└── tests/
    ├── Parser.test.ts          # Core parsing validity tests
    ├── Resolver.test.ts        # Component resolution assertions
    └── Layout.test.ts          # Spatial layout bound confirmations
```

---

## 9. Implementation Checklist for AI Agent

1.  **Phase 1: Grammar Setup.** Implement `Parser.ts` to convert the diagram string into a structured JSON AST. Ensure it correctly extracts the component's custom config blocks and relationship declarations. Write unit tests checking edge cases (nested syntax errors, trailing commas, missing brackets).
2.  **Phase 2: Base Classes.** Implement `BaseComponent.ts` as defined. Create `TableComponent.ts` and `NoteComponent.ts` implementations extending this abstract model.
3.  **Phase 3: Integration and Style Merging.** Implement `DiagramResolver.ts`. Ensure it iterates over parsed AST component nodes, matches them against definitions, merges the target theme configurations, and throws validation errors for mismatched properties.
4.  **Phase 4: Spatial Positioning.** Implement standard spatial layout rules in `LayoutEngine.ts` to determine position offsets based on connections and bounding dimensions.
5.  **Phase 5: Rendering Assembly.** Implement `Renderer.ts` to construct the layout paths and append valid nested SVG tags dynamically to the primary `<svg>` interactive canvas.
6.  **Phase 6: Exporter Module.** Complete `FileHandlers.ts` to implement local file download capabilities and canvas-based high-resolution scaling exports.
