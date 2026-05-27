/** All component type names supported by the DSL parser and factory. */
export const COMPONENT_TYPES = [
  'Rectangle',
  'Process',
  'VerticalContainer',
  'Ellipse',
  'Cylinder',
  'Cube',
  'Diamond',
  'Hexagon',
  'Actor',
  'Parallelogram',
  'Class',
  'Interface',
  'UMLComponent',
  'Module',
  'Package',
  'Text',
  'Paragraph'
] as const;

export type ComponentTypeName = (typeof COMPONENT_TYPES)[number];

export function isComponentType(type: string): type is ComponentTypeName {
  return (COMPONENT_TYPES as readonly string[]).includes(type);
}
