export interface CatalogItem {
  type: string;
  displayName: string;
  description: string;
  tags: string[];
  template: string; // Boilerplate DSL string ready for pasting
}

export const ComponentCatalog: CatalogItem[] = [
  {
    type: "Rectangle",
    displayName: "Rectangle Shape",
    description: "A standard rectangular component with rounded corner options.",
    tags: ["Shapes", "General"],
    template: 'MyRectangle: Rectangle {\n  label: "New Rectangle"\n  rx: 8\n  ry: 8\n}'
  },
  {
    type: "Process",
    displayName: "Process Step",
    description: "A flowchart process box with rounded corners and a centered label.",
    tags: ["Shapes", "Flowchart"],
    template: 'MyProcess: Process {\n  label: "New Process"\n}'
  },
  {
    type: "Ellipse",
    displayName: "Circle / Ellipse",
    description: "A circle or ellipse shape. Use radius for a circle, or rx and ry for an oval.",
    tags: ["Shapes", "General"],
    template: 'MyEllipse: Ellipse {\n  label: "New Node"\n  radius: 40\n}'
  },
  {
    type: "VerticalContainer",
    displayName: "Vertical Container",
    description: "Stacks child components vertically with spacing. Nest other components inside.",
    tags: ["Layout", "Containers"],
    template: `MyRectangle: Rectangle {
  label: "Rectangle"
  rx: 8
  ry: 8
}

MyContainer: VerticalContainer {
  label: "Container"
  gap: 12
  padding: 16

  Step1: Process {
    label: "Step 1"
  }

  Step2: MyRectangle
}`
  },
  {
    type: "Cylinder",
    displayName: "Cylinder / Database",
    description: "A 3D cylinder shape representing databases or data stores.",
    tags: ["Shapes", "Storage"],
    template: 'MyCylinder: Cylinder {\n  label: "User DB"\n}'
  },
  {
    type: "Cube",
    displayName: "3D Cube / Block",
    description: "An isometric 3D cube representing services, microservices, or components.",
    tags: ["Shapes", "General"],
    template: 'MyCube: Cube {\n  label: "Auth Service"\n}'
  },
  {
    type: "Diamond",
    displayName: "Diamond / Decision",
    description: "A diamond shape for decision logic or branching gateways.",
    tags: ["Shapes", "Flowchart"],
    template: 'MyDecision: Diamond {\n  label: "Is Authorized?"\n}'
  },
  {
    type: "Hexagon",
    displayName: "Hexagon / Subsystem",
    description: "A six-sided hexagon shape commonly representing subsystems or domains.",
    tags: ["Shapes", "General"],
    template: 'MyHexagon: Hexagon {\n  label: "Payment Domain"\n}'
  },
  {
    type: "Actor",
    displayName: "Actor / Stick Figure",
    description: "A UML stick figure representing system actors, users, or external roles.",
    tags: ["Shapes", "Sequence", "UML"],
    template: 'MyActor: Actor {\n  label: "Customer"\n}'
  },
  {
    type: "Parallelogram",
    displayName: "Parallelogram / Data",
    description: "A skewed parallelogram representing data input/output or files.",
    tags: ["Shapes", "Flowchart"],
    template: 'MyData: Parallelogram {\n  label: "Read Payload"\n}'
  },
  {
    type: "Class",
    displayName: "Class / List",
    description: "A UML class box with optional compartments for attributes and methods, or a plain list with a header row and item rows.",
    tags: ["Shapes", "UML"],
    template: `MyClass: Class {
  label: "UserService"
  attributes: {
    +id: string
    +name: string
    -email: string
  }
  methods: {
    +getUser(): User
    +saveUser(): void
    -validate(): boolean
  }
}`
  },
  {
    type: "Interface",
    displayName: "Interface",
    description: "A UML interface shape with the «interface» stereotype header and a methods compartment.",
    tags: ["Shapes", "UML"],
    template: 'MyInterface: Interface {\n  label: "Serializable"\n}'
  },
  {
    type: "UMLComponent",
    displayName: "Component",
    description: "A UML component box with the standard component icon (two notched rectangles) on the right side.",
    tags: ["Shapes", "UML"],
    template: 'MyComponent: UMLComponent {\n  label: "PaymentService"\n}'
  },
  {
    type: "Module",
    displayName: "Module",
    description: "A file-card shape with a small tab on the top-left, representing a module or file.",
    tags: ["Shapes", "UML"],
    template: 'MyModule: Module {\n  label: "auth.module"\n}'
  },
  {
    type: "Package",
    displayName: "Package",
    description: "A UML package / folder shape with a labelled tab and a large body area for nested elements.",
    tags: ["Shapes", "UML"],
    template: `MyPackage: Package {
  label: "com.example.auth"
  gap: 12
  padding: 16

  AuthService: UMLComponent {
    label: "AuthService"
  }
}`
  },
  {
    type: "Text",
    displayName: "Simple Text",
    description: "Renders a single-line text label without any surrounding box or border, useful for annotations.",
    tags: ["Shapes", "Annotation"],
    template: 'MyLabel: Text {\n  label: "Standalone Annotation"\n  align: "center"\n}'
  },
  {
    type: "Paragraph",
    displayName: "Paragraph Text",
    description: "Renders a block of multi-line paragraph text. Supports newlines (\\n) and alignments.",
    tags: ["Shapes", "Annotation"],
    template: 'MyParagraph: Paragraph {\n  text: "Line 1 of description\\nLine 2 of description\\nLine 3 of description"\n  align: "left"\n}'
  },
  {
    type: "SVGImage",
    displayName: "SVG Image",
    description: "An SVG vector image container that resizes using the scale parameter.",
    tags: ["Shapes", "Media"],
    template: 'MySVG: SVGImage {\n  content: "<svg width=\\"100\\" height=\\"100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"40\\" fill=\\"#3b82f6\\" stroke=\\"#ffffff\\" stroke-width=\\"4\\"/></svg>"\n  scale: 1.0\n}'
  },
  {
    type: "RasterImage",
    displayName: "Raster Image (Base64)",
    description: "A raster image (PNG/JPEG) loaded via base64 encoded text. Resizes using the scale parameter.",
    tags: ["Shapes", "Media"],
    template: 'MyRaster: RasterImage {\n  content: "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="\n  scale: 2.0\n}'
  },
  {
    type: "Cloud",
    displayName: "Cloud Container",
    description: "A container styled as a cloud network, useful for grouping external microservices, APIs, or SaaS tools.",
    tags: ["Layout", "Containers", "Deployment"],
    template: 'MyCloud: Cloud {\n  label: "AWS Cloud"\n  gap: 12\n  padding: 24\n}'
  },
  {
    type: "Node",
    displayName: "Node / Host",
    description: "A 3D box representing physical execution environments, VM hosts, or web servers.",
    tags: ["Layout", "Containers", "Deployment"],
    template: 'MyNode: Node {\n  label: "Application Server"\n  gap: 12\n  padding: 16\n}'
  },
  {
    type: "Artifact",
    displayName: "Artifact",
    description: "A block or container representing deployed software packages, JAR files, or database backups, decorated with a document icon.",
    tags: ["Layout", "Containers", "Deployment"],
    template: 'MyArtifact: Artifact {\n  label: "app-build.jar"\n}'
  },
  {
    type: "Folder",
    displayName: "Folder Container",
    description: "A file-system folder style layout to organize documents or nested services.",
    tags: ["Layout", "Containers", "Deployment"],
    template: 'MyFolder: Folder {\n  label: "src/configs"\n  gap: 12\n  padding: 16\n}'
  },
  {
    type: "Frame",
    displayName: "Frame Boundary",
    description: "A general layout frame with an angled title tab plate on the top-left.",
    tags: ["Layout", "Containers", "Deployment"],
    template: 'MyFrame: Frame {\n  label: "User Domain"\n  gap: 12\n  padding: 16\n}'
  },
  {
    type: "Storage",
    displayName: "Horizontal Storage",
    description: "A database drum or storage system lying horizontally.",
    tags: ["Shapes", "Storage", "Deployment"],
    template: 'MyStorage: Storage {\n  label: "NAS Storage Volume"\n}'
  },
  {
    type: "Stack",
    displayName: "Stack / Replica Set",
    description: "A stack of layered boxes to indicate component replicas or load-balanced services.",
    tags: ["Shapes", "Deployment"],
    template: 'MyStack: Stack {\n  label: "Web App Replicas (3x)"\n}'
  },
  {
    type: "File",
    displayName: "File / Document",
    description: "A sheet of paper shape with a folded top-right corner, ideal for representing static files.",
    tags: ["Shapes", "Deployment"],
    template: 'MyFile: File {\n  label: "docker-compose.yml"\n}'
  },
  {
    type: "Card",
    displayName: "Stripe Card",
    description: "A clean modern card container with a left accent color strip.",
    tags: ["Layout", "Containers", "Deployment"],
    template: 'MyCard: Card {\n  label: "Active Task"\n  gap: 12\n  padding: 12\n}'
  },
  {
    type: "Usecase",
    displayName: "Use Case / Ellipse",
    description: "A flat horizontal ellipse representing system use cases or user goals.",
    tags: ["Shapes", "UML", "Sequence"],
    template: 'MyUsecase: Usecase {\n  label: "Submit Order"\n}'
  },
  {
    type: "Boundary",
    displayName: "Robustness Boundary",
    description: "A robustness boundary node interface connecting actors to system controls.",
    tags: ["Shapes", "UML", "Sequence"],
    template: 'MyBoundary: Boundary {\n  label: "Login UI"\n}'
  },
  {
    type: "Control",
    displayName: "Robustness Control",
    description: "A robustness control loop node representing process logic or coordinators.",
    tags: ["Shapes", "UML", "Sequence"],
    template: 'MyControl: Control {\n  label: "Auth Controller"\n}'
  },
  {
    type: "Entity",
    displayName: "Robustness Entity",
    description: "A robustness entity node representing stored data or database models.",
    tags: ["Shapes", "UML", "Sequence"],
    template: 'MyEntity: Entity {\n  label: "User Model"\n}'
  },
  {
    type: "Queue",
    displayName: "Queue / Pipe",
    description: "A horizontal cylinder tube depicting message queues or streaming topics.",
    tags: ["Shapes", "UML", "Sequence"],
    template: 'MyQueue: Queue {\n  label: "Orders Queue"\n}'
  },
  {
    type: "Collections",
    displayName: "Collections / Group",
    description: "Two overlapping offset rectangles representing multiple stacked participants.",
    tags: ["Shapes", "UML", "Sequence"],
    template: 'MyCollections: Collections {\n  label: "Subscribers"\n}'
  },
  {
    type: "Agent",
    displayName: "Agent Container",
    description: "An active software agent container with a premium double-line border.",
    tags: ["Layout", "Containers", "Sequence"],
    template: 'MyAgent: Agent {\n  label: "Notifier Agent"\n  gap: 12\n  padding: 16\n}'
  },
  {
    type: "Enum",
    displayName: "Enumeration Class",
    description: "A UML enumeration class showing «enumeration» stereotype and standard compartments.",
    tags: ["Shapes", "UML"],
    template: `MyEnum: Enum {
  label: "UserStatus"
  attributes: {
    ACTIVE
    INACTIVE
    PENDING
  }
}`
  },
  {
    type: "Abstract",
    displayName: "Abstract Class",
    description: "A UML abstract class with italicized bold title name, «abstract» stereotype, and standard class compartments.",
    tags: ["Shapes", "UML"],
    template: `MyAbstract: Abstract {
  label: "BaseService"
  attributes: {
    +id: string
  }
  methods: {
    +execute(): void
    #log(): void
  }
}`
  },
  {
    type: "Annotation",
    displayName: "Annotation Metadata",
    description: "A UML annotation container with «annotation» stereotype and attributes/methods blocks.",
    tags: ["Shapes", "UML"],
    template: `MyAnnotation: Annotation {
  label: "Entity"
  attributes: {
    tableName: string
  }
}`
  },
  {
    type: "Struct",
    displayName: "Structure / Record",
    description: "A UML structure or record container with «struct» stereotype and standard compartments.",
    tags: ["Shapes", "UML"],
    template: `MyStruct: Struct {
  label: "Point"
  attributes: {
    +x: number
    +y: number
  }
}`
  },
  {
    type: "Object",
    displayName: "Object Instance",
    description: "A UML object instance with underlined header title name and active value assignments.",
    tags: ["Shapes", "UML"],
    template: `MyObject: Object {
  label: "userConn : Connection"
  attributes: {
    timeout = 30
    status = "connected"
  }
}`
  },
  {
    type: "Table",
    displayName: "Table Component",
    description: "A grid container representing tabular data, defined with headers, row lists, and alignment overrides.",
    tags: ["Shapes", "General"],
    template: `MyTable: Table {
  header: { "Header 1", "Header 2", "Header 3" }
  rows: {
    { "row 1, cell 1", "row 1, cell 2", "row 1, cell 3" }
    { "row 2, cell 1", "row 2, cell 2", "row 2, cell 3" }
  }
  headerAtTop: true
  headerAtBottom: false
}`
  },
  {
    type: "Branch",
    displayName: "Git Branch Lane",
    description: "Represents a branch track in a Git Flow diagram, containing or connecting commits.",
    tags: ["Git Flow", "Shapes"],
    template: `Main: Branch {
  label: "main"
}`
  },
  {
    type: "Commit",
    displayName: "Git Commit",
    description: "Represents a Git commit with an ID/hash, optional tag badge, and type (normal, merge, highlight, reverse).",
    tags: ["Git Flow", "Shapes"],
    template: `c1: Commit {
  hash: "1-feat"
  tag: "v1.0"
}`
  },
  {
    type: "GitFlow",
    displayName: "Git Flow Diagram",
    description: "A complete Git branching and merging workflow diagram with main, develop, and feature branches.",
    tags: ["Git Flow", "Templates"],
    template: `@layout: git-flow

Main: Branch {
  label: "main"
  color: #ff0000

  c0: Commit {
    hash: "0-e3a3a20"
  }
  c3: Commit {
    type: "merge"
  }
  c4: Commit {
    hash: "4-646b55f"
  }
  c7: Commit {
    type: "merge"
  }
}

Develop: Branch {
  label: "develop"

  c1: Commit {
    hash: "1-201f4e4"
  }
  c2: Commit {
    hash: "2-6c2e9d5"
    message: "A simple test message"
    type: "reverse"
    tag: "tag1.0.0"
  }
}

Feature: Branch {
  label: "feature"

  c5: Commit {
    hash: "5-71f2792"
  }
  c6: Commit {
    hash: "6-e534d9"
  }
}

c0 -> c1
c1 -> c2
c2 -> c3
c0 -> c3
c3 -> c4
c4 -> c5
c5 -> c6
c6 -> c7
c4 -> c7`
  },
  {
    type: "Mindmap",
    displayName: "Mindmap Diagram",
    description: "Radial brainstorming mindmap diagram with branches, automatic root node detection, and organic curved connections.",
    tags: ["Mindmap", "Templates"],
    template: `@layout: mindmap

mindmap: Ellipse {
  label: "mindmap"
}

Research: Rectangle {
  label: "Research"
}

Uses: Rectangle {
  label: "Uses"
}

AutoCreation: Rectangle {
  label: "On Automatic creation"
}

Effectiveness: Rectangle {
  label: "On effectiveness\\nand features"
}

StrategicPlanning: Rectangle {
  label: "Strategic planning"
}

CreativeTech: Rectangle {
  label: "Creative techniques"
}

ArgumentMapping: Rectangle {
  label: "Argument mapping"
}

Tools: Rectangle {
  label: "Tools"
}

PenPaper: Rectangle {
  label: "Pen and paper"
}

Mermaid: Rectangle {
  label: "Mermaid"
}

Origins: Rectangle {
  label: "Origins"
}

Popularisation: Rectangle {
  label: "Popularisation"
}

History: Rectangle {
  label: "Long history"
}

TonyBuzan: Rectangle {
  label: "British popular psychology\\nauthor Tony Buzan"
}

mindmap -> Research
Research -> AutoCreation
AutoCreation -> Uses
Uses -> StrategicPlanning
Uses -> CreativeTech
Uses -> ArgumentMapping
Research -> Effectiveness

mindmap -> Tools
Tools -> PenPaper
Tools -> Mermaid

mindmap -> Origins
Origins -> Popularisation
Popularisation -> TonyBuzan
Origins -> History`
  },
  {
    type: "Chart",
    displayName: "Interactive Chart",
    description: "Multi-series bar and line charts with custom axes, ranges, and hover tooltips.",
    tags: ["Charts", "Data", "Visualization"],
    template: `MyChart: Chart {
  width: 800
  height: 600
  title: "Sales Revenue"
  xLabel: "Months"
  yLabel: "Revenue (in $)"
  x: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
  y: 4000 -> 11000

  MyBarChart: Bar {
    values: [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    color: #38bdf8
    is3D: true
  }

  MyLineChart: Line {
    values: [5500, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    color: #4ade80
    filled: true
  }
}`
  }
];

export class CatalogService {
  /**
   * Filter catalog items based on keyword search and active tag filters.
   * If activeTags is empty, do not restrict by tag (allow all matching keywords).
   * Otherwise, item must contain all active tags.
   */
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

  /**
   * Extract all unique tags present across all catalog items
   */
  public static getAllTags(): string[] {
    const tags = new Set<string>();
    ComponentCatalog.forEach(item => item.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }
}
