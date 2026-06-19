export interface RelationshipStyle {
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  thickness?: number;
  routeType?: 'orthogonal' | 'curved' | 'straight';
}

export type RelationshipArrow = 'forward' | 'reverse' | 'bidirectional';

/**
 * Internal representation of a relationship used for rendering.
 */
export interface Relationship {
  sourceId: string;
  targetId: string;
  sourceCardinality?: string;
  targetCardinality?: string;
  label?: string;
  style?: RelationshipStyle;
  /** True when declared with <-> (bidirectional arrowheads) */
  bidirectional?: boolean;
  /** True when declared with simple '-' (no arrowheads) */
  simple?: boolean;
  /** True when 'o' appears at the source end: o-> */
  sourceCircle?: boolean;
  /** True when 'o' appears at the target end: ->o */
  targetCircle?: boolean;
  /** True when rhombus appears at the source end: <>- */
  sourceRhombus?: boolean;
  /** True when rhombus appears at the target end: -<> */
  targetRhombus?: boolean;
  line?: number;
}

/**
 * Parsed relationship from DSL.
 */
export interface ParsedRelationship {
  sourceId: string;
  targetId: string;
  sourceCardinality?: string;
  targetCardinality?: string;
  label?: string;
  style?: RelationshipStyle;
  /** True when declared with <-> */
  bidirectional?: boolean;
  /** True when declared with simple '-' */
  simple?: boolean;
  /** True when 'o' appears at the source end: o-> */
  sourceCircle?: boolean;
  /** True when 'o' appears at the target end: ->o */
  targetCircle?: boolean;
  /** True when rhombus appears at the source end: <>- */
  sourceRhombus?: boolean;
  /** True when rhombus appears at the target end: -<> */
  targetRhombus?: boolean;
  line?: number;
}
