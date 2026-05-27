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

  const walk = (component: BaseComponent, offsetX: number, offsetY: number): void => {
    const globalBounds: BoundingBox = {
      x: offsetX + component.bounds.x,
      y: offsetY + component.bounds.y,
      width: component.bounds.width,
      height: component.bounds.height
    };

    index.set(component.id, { component, globalBounds });

    if (component instanceof VerticalContainerComponent) {
      const originX = globalBounds.x;
      const originY = globalBounds.y;
      component.children.forEach(child => walk(child, originX, originY));
    }
  };

  components.forEach(root => walk(root, 0, 0));
  return index;
}
