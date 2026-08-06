import { BaseComponent, BoundingBox } from '../components/BaseComponent';
import { VerticalContainerComponent } from '../components/VerticalContainerComponent';

export interface IndexedComponent {
  component: BaseComponent;
  globalBounds: BoundingBox;
}

/**
 * Index all components by id with absolute canvas bounds (includes nested children).
 */
export function indexComponentsById(components: BaseComponent[]): Map<string, IndexedComponent> {
  const index = new Map<string, IndexedComponent>();

  const walk = (component: BaseComponent, offsetX: number, offsetY: number, parentPath?: string): void => {
    const globalBounds: BoundingBox = {
      x: offsetX + component.bounds.x,
      y: offsetY + component.bounds.y,
      width: component.bounds.width,
      height: component.bounds.height
    };

    const indexed: IndexedComponent = { component, globalBounds };
    index.set(component.id, indexed);

    const currentPath = parentPath ? `${parentPath}.${component.id}` : component.id;
    if (parentPath) {
      index.set(currentPath, indexed);
    }

    if ('children' in component && Array.isArray((component as any).children)) {
      const originX = globalBounds.x;
      const originY = globalBounds.y;
      ((component as any).children as BaseComponent[]).forEach(child => walk(child, originX, originY, currentPath));
    }
  };

  components.forEach(root => walk(root, 0, 0));
  return index;
}
