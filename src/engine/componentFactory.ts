import { BaseComponent, ComponentMetadata } from '../components/BaseComponent';
import { RectangleComponent, RectangleProps } from '../components/RectangleComponent';
import { ProcessComponent, ProcessProps } from '../components/ProcessComponent';
import { EllipseComponent, EllipseProps } from '../components/EllipseComponent';
import { VerticalContainerComponent, VerticalContainerProps } from '../components/VerticalContainerComponent';
import { CylinderComponent, CylinderProps } from '../components/CylinderComponent';
import { CubeComponent, CubeProps } from '../components/CubeComponent';
import { DiamondComponent, DiamondProps } from '../components/DiamondComponent';
import { HexagonComponent, HexagonProps } from '../components/HexagonComponent';
import { ActorComponent, ActorProps } from '../components/ActorComponent';
import { ParallelogramComponent, ParallelogramProps } from '../components/ParallelogramComponent';
import { ClassComponent, ClassProps } from '../components/ClassComponent';
import { InterfaceComponent, InterfaceProps } from '../components/InterfaceComponent';
import { UMLComponentComponent, UMLComponentProps } from '../components/UMLComponentComponent';
import { ModuleComponent, ModuleProps } from '../components/ModuleComponent';
import { PackageComponent, PackageProps } from '../components/PackageComponent';
import { TextComponent, TextProps } from '../components/TextComponent';
import { ParagraphComponent, ParagraphProps } from '../components/ParagraphComponent';
import { SVGImageComponent } from '../components/SVGImageComponent';
import { RasterImageComponent } from '../components/RasterImageComponent';
import { CloudComponent } from '../components/CloudComponent';
import { NodeComponent } from '../components/NodeComponent';
import { ArtifactComponent } from '../components/ArtifactComponent';
import { FolderComponent } from '../components/FolderComponent';
import { FrameComponent } from '../components/FrameComponent';
import { StorageComponent } from '../components/StorageComponent';
import { StackComponent } from '../components/StackComponent';
import { FileComponent } from '../components/FileComponent';
import { CardComponent } from '../components/CardComponent';
import { UsecaseComponent, UsecaseProps } from '../components/UsecaseComponent';
import { BoundaryComponent, BoundaryProps } from '../components/BoundaryComponent';
import { ControlComponent, ControlProps } from '../components/ControlComponent';
import { EntityComponent, EntityProps } from '../components/EntityComponent';
import { QueueComponent, QueueProps } from '../components/QueueComponent';
import { CollectionsComponent, CollectionsProps } from '../components/CollectionsComponent';
import { AgentComponent, AgentProps } from '../components/AgentComponent';
import { EnumComponent, EnumProps } from '../components/EnumComponent';
import { AbstractComponent, AbstractProps } from '../components/AbstractComponent';
import { AnnotationComponent, AnnotationProps } from '../components/AnnotationComponent';
import { StructComponent, StructProps } from '../components/StructComponent';
import { ObjectComponent, ObjectProps } from '../components/ObjectComponent';
import { collectReferencedIds, ParsedChildEntry, ParsedNode } from '../dsl/parser';
import { isComponentType } from '../dsl/componentTypes';

function buildRegistry(nodes: ParsedNode[]): Map<string, ParsedNode> {
  const registry = new Map<string, ParsedNode>();
  nodes.forEach(node => registry.set(node.id, node));
  return registry;
}

function instantiateFromDefinition(
  node: ParsedNode,
  registry: Map<string, ParsedNode>
): BaseComponent {
  if (!isComponentType(node.type)) {
    throw new Error(`Unknown component type: ${node.type}`);
  }

  const metadata: ComponentMetadata = {
    id: node.id,
    type: node.type,
    tags: node.tags ?? []
  };

  const themeOverride = { ...node.themeOverride };
  let component: BaseComponent;

  switch (node.type) {
    case 'Rectangle': {
      const props: RectangleProps = {
        label: node.properties.label as string | undefined,
        rx: node.properties.rx as number | undefined,
        ry: node.properties.ry as number | undefined
      };
      component = new RectangleComponent(metadata, props, themeOverride);
      break;
    }
    case 'Process': {
      const props: ProcessProps = {
        label: node.properties.label as string | undefined,
        tabWidthRatio: node.properties.tabWidthRatio as number | undefined
      };
      component = new ProcessComponent(metadata, props, themeOverride);
      break;
    }
    case 'Ellipse': {
      const props: EllipseProps = {
        label: node.properties.label as string | undefined,
        radius: node.properties.radius as number | undefined,
        rx: node.properties.rx as number | undefined,
        ry: node.properties.ry as number | undefined
      };
      component = new EllipseComponent(metadata, props, themeOverride);
      break;
    }
    case 'VerticalContainer': {
      const props: VerticalContainerProps = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const vComp = new VerticalContainerComponent(metadata, props, themeOverride);
      vComp.children = resolveChildEntries(node.childEntries, registry);
      component = vComp;
      break;
    }
    case 'Cylinder': {
      const props: CylinderProps = {
        label: node.properties.label as string | undefined
      };
      component = new CylinderComponent(metadata, props, themeOverride);
      break;
    }
    case 'Cube': {
      const props: CubeProps = {
        label: node.properties.label as string | undefined
      };
      component = new CubeComponent(metadata, props, themeOverride);
      break;
    }
    case 'Diamond': {
      const props: DiamondProps = {
        label: node.properties.label as string | undefined
      };
      component = new DiamondComponent(metadata, props, themeOverride);
      break;
    }
    case 'Hexagon': {
      const props: HexagonProps = {
        label: node.properties.label as string | undefined
      };
      component = new HexagonComponent(metadata, props, themeOverride);
      break;
    }
    case 'Actor': {
      const props: ActorProps = {
        label: node.properties.label as string | undefined
      };
      component = new ActorComponent(metadata, props, themeOverride);
      break;
    }
    case 'Parallelogram': {
      const props: ParallelogramProps = {
        label: node.properties.label as string | undefined
      };
      component = new ParallelogramComponent(metadata, props, themeOverride);
      break;
    }
    case 'Class': {
      const props: ClassProps = {
        label: node.properties.label as string | undefined,
        // Legacy semicolon-string form (fallback)
        items: node.properties.items as string | undefined,
        attributes: node.properties.attributes as string | undefined,
        methods: node.properties.methods as string | undefined,
        // Block form from subBlocks (takes priority in ClassComponent)
        attributeLines: node.subBlocks?.['attributes'],
        methodLines: node.subBlocks?.['methods'],
        itemLines: node.subBlocks?.['items']
      };
      component = new ClassComponent(metadata, props, themeOverride);
      break;
    }
    case 'Interface': {
      const props: InterfaceProps = {
        label: node.properties.label as string | undefined
      };
      component = new InterfaceComponent(metadata, props, themeOverride);
      break;
    }
    case 'UMLComponent': {
      const props: UMLComponentProps = {
        label: node.properties.label as string | undefined
      };
      component = new UMLComponentComponent(metadata, props, themeOverride);
      break;
    }
    case 'Module': {
      const props: ModuleProps = {
        label: node.properties.label as string | undefined
      };
      component = new ModuleComponent(metadata, props, themeOverride);
      break;
    }
    case 'Package': {
      const props: PackageProps = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const pComp = new PackageComponent(metadata, props, themeOverride);
      pComp.children = resolveChildEntries(node.childEntries, registry);
      component = pComp;
      break;
    }
    case 'Text': {
      const props: TextProps = {
        label: node.properties.label as string | undefined,
        align: node.properties.align as TextProps['align']
      };
      component = new TextComponent(metadata, props, themeOverride);
      break;
    }
    case 'Paragraph': {
      const props: ParagraphProps = {
        label: node.properties.label as string | undefined,
        text: node.properties.text as string | undefined,
        align: node.properties.align as ParagraphProps['align']
      };
      component = new ParagraphComponent(metadata, props, themeOverride);
      break;
    }
    case 'SVGImage': {
      let content = node.properties.content as string | undefined;
      if (!content && node.subBlocks?.['content']) {
        content = node.subBlocks['content'].join('\n');
      }
      const props = {
        content,
        scale: node.properties.scale as number | undefined,
        width: node.properties.width as number | undefined,
        height: node.properties.height as number | undefined
      };
      component = new SVGImageComponent(metadata, props, themeOverride);
      break;
    }
    case 'RasterImage': {
      let content = node.properties.content as string | undefined;
      if (!content && node.subBlocks?.['content']) {
        content = node.subBlocks['content'].join('\n');
      }
      const props = {
        content,
        scale: node.properties.scale as number | undefined,
        width: node.properties.width as number | undefined,
        height: node.properties.height as number | undefined
      };
      component = new RasterImageComponent(metadata, props, themeOverride);
      break;
    }
    case 'Cloud': {
      const props = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const comp = new CloudComponent(metadata, props, themeOverride);
      comp.children = resolveChildEntries(node.childEntries, registry);
      component = comp;
      break;
    }
    case 'Node': {
      const props = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const comp = new NodeComponent(metadata, props, themeOverride);
      comp.children = resolveChildEntries(node.childEntries, registry);
      component = comp;
      break;
    }
    case 'Artifact': {
      const props = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const comp = new ArtifactComponent(metadata, props, themeOverride);
      comp.children = resolveChildEntries(node.childEntries, registry);
      component = comp;
      break;
    }
    case 'Folder': {
      const props = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const comp = new FolderComponent(metadata, props, themeOverride);
      comp.children = resolveChildEntries(node.childEntries, registry);
      component = comp;
      break;
    }
    case 'Frame': {
      const props = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const comp = new FrameComponent(metadata, props, themeOverride);
      comp.children = resolveChildEntries(node.childEntries, registry);
      component = comp;
      break;
    }
    case 'Storage': {
      const props = {
        label: node.properties.label as string | undefined
      };
      component = new StorageComponent(metadata, props, themeOverride);
      break;
    }
    case 'Stack': {
      const props = {
        label: node.properties.label as string | undefined
      };
      component = new StackComponent(metadata, props, themeOverride);
      break;
    }
    case 'File': {
      const props = {
        label: node.properties.label as string | undefined
      };
      component = new FileComponent(metadata, props, themeOverride);
      break;
    }
    case 'Card': {
      const props = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const comp = new CardComponent(metadata, props, themeOverride);
      comp.children = resolveChildEntries(node.childEntries, registry);
      component = comp;
      break;
    }
    case 'Usecase': {
      const props: UsecaseProps = {
        label: node.properties.label as string | undefined
      };
      component = new UsecaseComponent(metadata, props, themeOverride);
      break;
    }
    case 'Boundary': {
      const props: BoundaryProps = {
        label: node.properties.label as string | undefined
      };
      component = new BoundaryComponent(metadata, props, themeOverride);
      break;
    }
    case 'Control': {
      const props: ControlProps = {
        label: node.properties.label as string | undefined
      };
      component = new ControlComponent(metadata, props, themeOverride);
      break;
    }
    case 'Entity': {
      const props: EntityProps = {
        label: node.properties.label as string | undefined
      };
      component = new EntityComponent(metadata, props, themeOverride);
      break;
    }
    case 'Queue': {
      const props: QueueProps = {
        label: node.properties.label as string | undefined
      };
      component = new QueueComponent(metadata, props, themeOverride);
      break;
    }
    case 'Collections': {
      const props: CollectionsProps = {
        label: node.properties.label as string | undefined
      };
      component = new CollectionsComponent(metadata, props, themeOverride);
      break;
    }
    case 'Agent': {
      const props: AgentProps = {
        label: node.properties.label as string | undefined,
        gap: node.properties.gap as number | undefined,
        padding: node.properties.padding as number | undefined
      };
      const comp = new AgentComponent(metadata, props, themeOverride);
      comp.children = resolveChildEntries(node.childEntries, registry);
      component = comp;
      break;
    }
    case 'Enum': {
      const props: EnumProps = {
        label: node.properties.label as string | undefined,
        attributes: node.properties.attributes as string | undefined,
        items: node.properties.items as string | undefined,
        attributeLines: node.subBlocks?.['attributes'],
        itemLines: node.subBlocks?.['items']
      };
      component = new EnumComponent(metadata, props, themeOverride);
      break;
    }
    case 'Abstract': {
      const props: AbstractProps = {
        label: node.properties.label as string | undefined,
        attributes: node.properties.attributes as string | undefined,
        methods: node.properties.methods as string | undefined,
        items: node.properties.items as string | undefined,
        attributeLines: node.subBlocks?.['attributes'],
        methodLines: node.subBlocks?.['methods'],
        itemLines: node.subBlocks?.['items']
      };
      component = new AbstractComponent(metadata, props, themeOverride);
      break;
    }
    case 'Annotation': {
      const props: AnnotationProps = {
        label: node.properties.label as string | undefined,
        attributes: node.properties.attributes as string | undefined,
        methods: node.properties.methods as string | undefined,
        items: node.properties.items as string | undefined,
        attributeLines: node.subBlocks?.['attributes'],
        methodLines: node.subBlocks?.['methods'],
        itemLines: node.subBlocks?.['items']
      };
      component = new AnnotationComponent(metadata, props, themeOverride);
      break;
    }
    case 'Struct': {
      const props: StructProps = {
        label: node.properties.label as string | undefined,
        attributes: node.properties.attributes as string | undefined,
        methods: node.properties.methods as string | undefined,
        items: node.properties.items as string | undefined,
        attributeLines: node.subBlocks?.['attributes'],
        methodLines: node.subBlocks?.['methods'],
        itemLines: node.subBlocks?.['items']
      };
      component = new StructComponent(metadata, props, themeOverride);
      break;
    }
    case 'Object': {
      const props: ObjectProps = {
        label: node.properties.label as string | undefined,
        attributes: node.properties.attributes as string | undefined,
        items: node.properties.items as string | undefined,
        attributeLines: node.subBlocks?.['attributes'],
        itemLines: node.subBlocks?.['items']
      };
      component = new ObjectComponent(metadata, props, themeOverride);
      break;
    }
    default:
      throw new Error(`Unknown component type: ${node.type}`);
  }

  component.validateProps();

  component.lifeline = node.properties.lifeline === true;

  if (typeof node.properties.x === 'number') {
    component.manualX = node.properties.x;
  }
  if (typeof node.properties.y === 'number') {
    component.manualY = node.properties.y;
  }

  return component;
}

function resolveChildEntries(
  entries: ParsedChildEntry[],
  registry: Map<string, ParsedNode>
): BaseComponent[] {
  return entries.map(entry => {
    if (entry.kind === 'inline') {
      return instantiateFromDefinition(entry.node, registry);
    }

    const definition = registry.get(entry.refId);
    if (!definition) {
      throw new Error(`Component reference not found: "${entry.refId}"`);
    }

    const entryTags = entry.tags || [];
    const definitionTags = definition.tags || [];
    const mergedTags = Array.from(new Set([...entryTags, ...definitionTags]));
    const instanceNode: ParsedNode = { ...definition, id: entry.slotId, childEntries: [], tags: mergedTags };
    return instantiateFromDefinition(instanceNode, registry);
  });
}

export function createComponent(
  node: ParsedNode,
  registry: Map<string, ParsedNode>
): BaseComponent {
  return instantiateFromDefinition(node, registry);
}

/**
 * Build renderable components from parsed DSL.
 * Top-level definitions only used as references are omitted from the root layout.
 */
export function createComponentsFromDsl(nodes: ParsedNode[]): BaseComponent[] {
  const registry = buildRegistry(nodes);
  const referencedIds = collectReferencedIds(nodes);

  return nodes
    .filter(node => !referencedIds.has(node.id))
    .map(node => createComponent(node, registry));
}
