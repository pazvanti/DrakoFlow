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
