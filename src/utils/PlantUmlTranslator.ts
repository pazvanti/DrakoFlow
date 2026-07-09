interface ThemeOverride {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  headerTypeColor?: string;
  headerTypeTextColor?: string;
}

interface ComponentIR {
  id: string;
  type: string;
  label: string;
  isExplicit: boolean;
  lifeline?: boolean;
  themeOverride?: ThemeOverride;
  headerType?: string;
  attributes?: string[];
  methods?: string[];
  children?: ComponentIR[];
}

export class PlantUmlTranslator {
  /**
   * Translates PlantUML diagram code to DrakoFlow DSL.
   */
  public translate(code: string): string {
    const lines = code.split(/\r?\n/);
    
    // Scan lines to detect sequence diagrams (where lifelines are expected)
    let isSequence = false;
    let hasActivity = false;
    let hasClass = false;
    
    for (const rawLine of lines) {
      const l = rawLine.trim().toLowerCase();
      if (l === '' || l.startsWith("'") || l.startsWith('@startuml') || l.startsWith('@enduml')) {
        continue;
      }
      if (l === 'start' || l === 'stop' || l.startsWith('partition') || l.startsWith('if') || l === 'endif' || l === 'else') {
        hasActivity = true;
      }
      if (l.startsWith('class ') || l.startsWith('interface ') || l.startsWith('enum ') || l.startsWith('annotation ') || l.startsWith('abstract ')) {
        hasClass = true;
      }
      if (l.startsWith('participant ') || l.startsWith('return ') || l === 'return' || /^return\b/i.test(l)) {
        isSequence = true;
      }
    }
    
    if (!hasActivity && !hasClass && !isSequence) {
      const hasUsecase = lines.some(line => {
        const cl = line.trim().toLowerCase();
        return cl.startsWith('usecase ') || /\([\w\s]+\)/.test(cl);
      });
      if (!hasUsecase) {
        const hasSequenceIndicator = lines.some(line => {
          const trimmed = line.trim();
          return trimmed.startsWith('return') || trimmed.includes('<--') || trimmed.includes('<..');
        });
        if (hasSequenceIndicator) {
          isSequence = true;
        } else {
          const hasActor = lines.some(line => line.trim().toLowerCase().startsWith('actor '));
          const hasParticipant = lines.some(line => line.trim().toLowerCase().startsWith('participant '));
          const hasMessage = lines.some(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith("'") && 
              (trimmed.includes('->') || trimmed.includes('-->') || trimmed.includes('<-') || trimmed.includes('<--')) &&
              trimmed.includes(':');
          });
          if (hasActor || hasParticipant || hasMessage) {
            isSequence = true;
          }
        }
      }
    }

    const cleanLabel = (label: string): string => {
      let l = label.trim();
      if (l.startsWith('"') && l.endsWith('"')) {
        l = l.substring(1, l.length - 1);
      }
      return l;
    };

    const escapeString = (str: string): string => {
      return str.replace(/"/g, '\\"');
    };

    const toSafeId = (id: string): string => {
      let clean = cleanLabel(id);
      let safe = clean.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      if (/^[0-9]/.test(safe)) {
        safe = '_' + safe;
      }
      return safe;
    };

    const componentsMap = new Map<string, ComponentIR>();
    const rootComponents: ComponentIR[] = [];
    const packageStack: string[] = [];
    const relationships: string[] = [];
    
    const getOrCreateComponent = (id: string, defaultType: string, defaultLabel: string, explicit: boolean): ComponentIR => {
      let comp = componentsMap.get(id);
      if (!comp) {
        comp = {
          id,
          type: defaultType,
          label: defaultLabel,
          isExplicit: explicit,
          lifeline: isSequence
        };
        if (defaultType === 'Package') {
          comp.children = [];
        }
        componentsMap.set(id, comp);
        
        // Add to parent package or root
        if (packageStack.length > 0) {
          const parentId = packageStack[packageStack.length - 1];
          const parent = componentsMap.get(parentId);
          if (parent && parent.children) {
            parent.children.push(comp);
          }
        } else {
          rootComponents.push(comp);
        }
      } else {
        // Component exists. If this is an explicit declaration, upgrade it
        if (explicit) {
          comp.type = defaultType;
          comp.label = defaultLabel;
          comp.isExplicit = true;
          if (defaultType === 'Package' && !comp.children) {
            comp.children = [];
          }
        }
        // If we are currently parsing inside a package, and the component is at the root level, move it to the package
        if (packageStack.length > 0) {
          const parentId = packageStack[packageStack.length - 1];
          const parent = componentsMap.get(parentId);
          if (parent && parent.children && !parent.children.includes(comp)) {
            // Remove from root if present
            const rootIdx = rootComponents.indexOf(comp);
            if (rootIdx !== -1) {
              rootComponents.splice(rootIdx, 1);
            }
            parent.children.push(comp);
          }
        }
      }
      return comp;
    };

    let currentClassId: string | null = null;
    let currentClassType = 'Class';
    let currentClassLabel = '';
    let currentClassAttributes: string[] = [];
    let currentClassMethods: string[] = [];
    
    let lastSourceId: string | null = null;
    let lastTargetId: string | null = null;
    
    // Activity Diagram parsing states
    let nodeCounter = 0;
    let lastActiveNodeId: string | null = null;
    let lastBranchLabel = '';
    
    interface IfState {
      decisionId: string;
      endpoints: string[];
    }
    const ifStack: IfState[] = [];
    let pendingJoinNodes: string[] = [];
    
    let collectingAction = false;
    let actionLines: string[] = [];

    // Helper to connect a new node to the flow in Activity Diagrams
    const connectNode = (newId: string) => {
      if (pendingJoinNodes.length > 0) {
        pendingJoinNodes.forEach(src => {
          relationships.push(`${src} -> ${newId}`);
        });
        pendingJoinNodes = [];
      } else if (lastActiveNodeId) {
        const labelPart = lastBranchLabel ? ` : "${escapeString(lastBranchLabel)}"` : '';
        relationships.push(`${lastActiveNodeId} -> ${newId}${labelPart}`);
        lastBranchLabel = '';
      }
      lastActiveNodeId = newId;
    };
    
    const TYPE_MAP: Record<string, string> = {
      'class': 'Class',
      'interface': 'Class',
      'enum': 'Class',
      'annotation': 'Class',
      'abstract class': 'Class',
      'abstract': 'Class',
      'actor': 'Actor',
      'usecase': 'Usecase',
      'node': 'Node',
      'database': 'Cylinder',
      'queue': 'Queue',
      'entity': 'Entity',
      'boundary': 'Boundary',
      'control': 'Control',
      'artifact': 'Artifact',
      'folder': 'Folder',
      'package': 'Package',
      'card': 'Card',
      'file': 'File',
      'stack': 'Stack',
      'storage': 'Storage',
      'collections': 'Collections',
      'agent': 'Agent',
      'participant': 'Rectangle'
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '' || line.startsWith("'") || line.startsWith('@startuml') || line.startsWith('@enduml')) {
        continue;
      }

      // Match box start block
      const boxRegex = /^\s*box\s+("[^"]+"|[^\s#]+)(?:\s+(#[^\s]+))?\s*$/i;
      const boxMatch = line.match(boxRegex);
      if (boxMatch) {
        const boxLabel = cleanLabel(boxMatch[1]);
        const boxId = toSafeId(boxLabel) + '_' + (++nodeCounter);
        let boxColor = boxMatch[2] ? boxMatch[2].trim() : null;
        if (boxColor && boxColor.startsWith('#')) {
          const hexPattern = /^#[0-9a-fA-F]{3,8}$/;
          if (!hexPattern.test(boxColor)) {
            boxColor = boxColor.substring(1);
          }
        }
        
        const comp = getOrCreateComponent(boxId, 'Package', boxLabel, true);
        if (boxColor) {
          comp.themeOverride = {
            backgroundColor: boxColor,
            textColor: '#1f2937',
            borderColor: '#9ca3af'
          };
        }
        packageStack.push(boxId);
        continue;
      }

      // Match box end block
      if (line.toLowerCase() === 'end box') {
        if (packageStack.length > 0) {
          packageStack.pop();
        }
        continue;
      }
      
      // Multi-line action node collection mode
      if (collectingAction) {
        if (line.endsWith(';')) {
          actionLines.push(line.slice(0, -1).trim());
          collectingAction = false;
          
          const stepId = 'step_' + (++nodeCounter);
          const fullText = actionLines.join('\\n').replace(/"/g, '\\"');
          
          const comp = getOrCreateComponent(stepId, 'Process', fullText, true);
          connectNode(stepId);
        } else {
          actionLines.push(line);
        }
        continue;
      }
      
      // Class block body parsing mode
      if (currentClassId !== null) {
        if (line === '}') {
          const comp = componentsMap.get(currentClassId);
          if (comp) {
            comp.attributes = [...currentClassAttributes];
            comp.methods = [...currentClassMethods];
          }
          currentClassId = null;
        } else {
          if (line.startsWith('--') || line.startsWith('..') || line.startsWith('__')) {
            continue;
          }
          if (line.includes('(')) {
            currentClassMethods.push(line);
          } else {
            currentClassAttributes.push(line);
          }
        }
        continue;
      }

      // --- Activity Diagram Parsers ---
      
      // 1. Start node
      if (line.toLowerCase() === 'start') {
        const startId = 'start_' + (++nodeCounter);
        const comp = getOrCreateComponent(startId, 'Ellipse', 'Start', true);
        comp.themeOverride = {
          backgroundColor: "#22c55e",
          textColor: "#ffffff",
          borderColor: "#16a34a"
        };
        connectNode(startId);
        continue;
      }
      
      // 2. Stop node
      if (line.toLowerCase() === 'stop') {
        const stopId = 'stop_' + (++nodeCounter);
        const comp = getOrCreateComponent(stopId, 'Ellipse', 'Stop', true);
        comp.themeOverride = {
          backgroundColor: "#ef4444",
          textColor: "#ffffff",
          borderColor: "#dc2626"
        };
        connectNode(stopId);
        lastActiveNodeId = null; // end of linear flow
        continue;
      }
      
      // 3. Action node starter
      if (line.startsWith(':')) {
        const content = line.substring(1).trim();
        if (content.endsWith(';')) {
          const text = content.slice(0, -1).trim().replace(/"/g, '\\"');
          const stepId = 'step_' + (++nodeCounter);
          getOrCreateComponent(stepId, 'Process', text, true);
          connectNode(stepId);
        } else {
          collectingAction = true;
          actionLines = [content];
        }
        continue;
      }
      
      // 4. Activity transition arrows with custom labels
      const activityArrowRegex = /^->\s*([^;]+);$/;
      const actArrowMatch = line.match(activityArrowRegex);
      if (actArrowMatch) {
        lastBranchLabel = cleanLabel(actArrowMatch[1]);
        continue;
      }
      
      // 5. Activity branches: if / else / endif
      const ifRegex = /^if\s*\((.+)\)\s*then/i;
      const ifMatch = line.match(ifRegex);
      if (ifMatch) {
        const condText = ifMatch[1].trim().replace(/"/g, '\\"');
        const decId = 'decision_' + (++nodeCounter);
        getOrCreateComponent(decId, 'Diamond', condText, true);
        connectNode(decId);
        
        ifStack.push({ decisionId: decId, endpoints: [] });
        continue;
      }
      
      if (line.toLowerCase() === 'else') {
        const top = ifStack[ifStack.length - 1];
        if (top) {
          if (lastActiveNodeId) {
            top.endpoints.push(lastActiveNodeId);
          }
          lastActiveNodeId = top.decisionId;
        }
        continue;
      }
      
      if (line.toLowerCase() === 'endif') {
        const top = ifStack.pop();
        if (top) {
          if (lastActiveNodeId) {
            top.endpoints.push(lastActiveNodeId);
          }
          pendingJoinNodes.push(...top.endpoints);
          lastActiveNodeId = null;
        }
        continue;
      }
      
      // 6. Partition blocks (activities container group)
      const partitionRegex = /^\s*partition\s+("[^"]+"|[^\s{]+)\s*\{/i;
      const partMatch = line.match(partitionRegex);
      if (partMatch) {
        const partName = cleanLabel(partMatch[1]);
        const partId = toSafeId(partName) + '_' + (++nodeCounter);
        
        getOrCreateComponent(partId, 'Package', partName, true);
        packageStack.push(partId);
        continue;
      }
      
      // Closing block brace (closes packages and partitions)
      if (line === '}') {
        if (packageStack.length > 0) {
          packageStack.pop();
        }
        continue;
      }
      
      // Sequence diagram return statement
      const returnRegex = /^return\b\s*(.*)$/i;
      const returnMatch = line.match(returnRegex);
      if (returnMatch) {
        if (lastSourceId && lastTargetId) {
          const returnMsg = returnMatch[1].trim();
          let labelPart = '';
          if (returnMsg) {
            labelPart = ` : "${escapeString(cleanLabel(returnMsg))}"`;
          }
          relationships.push(`${lastTargetId} -> ${lastSourceId}${labelPart} {\n  lineStyle: "dashed"\n}`);
        }
        continue;
      }
      
      // Relationship matching: Left [optional cardinality] [connector] [optional cardinality] Right [optional label]
      const relRegex = /^([\p{L}\p{N}_"]+|"[^"]+")(?:\s+("[^"]+"))?\s*([<\-|o*.+>]+)\s*(?:("[^"]+")\s+)?([\p{L}\p{N}_"]+|"[^"]+")(?:\s*:\s*(.+))?$/u;
      const relMatch = line.match(relRegex);
      if (relMatch) {
        const leftRaw = relMatch[1];
        const leftMult = relMatch[2];
        const connector = relMatch[3];
        const rightMult = relMatch[4];
        const rightRaw = relMatch[5];
        const label = relMatch[6];
        
        if (/^[o*+]+$/.test(connector)) {
          continue;
        }
        
        const leftId = toSafeId(leftRaw);
        const rightId = toSafeId(rightRaw);
        
        getOrCreateComponent(leftId, 'Rectangle', cleanLabel(leftRaw), false);
        getOrCreateComponent(rightId, 'Rectangle', cleanLabel(rightRaw), false);
        
        let sourceId = leftId;
        let targetId = rightId;
        let arrowOperator = '->';
        let isFlipped = false;
        
        if (connector.includes('<|') || connector.includes('<')) {
          sourceId = rightId;
          targetId = leftId;
          isFlipped = true;
        } else if (connector.includes('|>-') || connector.includes('|>') || connector.includes('>')) {
          sourceId = leftId;
          targetId = rightId;
        } else if (connector.includes('<->') || connector.includes('<-->')) {
          arrowOperator = '<->';
        } else if (connector.replace(/[^.-]/g, '').length === connector.length) {
          arrowOperator = '-';
        }
        
        let multSource = isFlipped ? rightMult : leftMult;
        let multTarget = isFlipped ? leftMult : rightMult;
        
        let sourceCard = '';
        if (multSource) {
          sourceCard = ` [${cleanLabel(multSource)}]`;
        }
        let targetCard = '';
        if (multTarget) {
          targetCard = ` [${cleanLabel(multTarget)}]`;
        }
        
        let lineStyle = 'solid';
        if (connector.includes('..') || connector.includes('.')) {
          lineStyle = 'dotted';
        } else if (connector.includes('--') || connector.includes('-')) {
          if (connector.includes('--') || connector.replace(/[^--]/g, '').length >= 2) {
            lineStyle = 'dashed';
          }
        }
        
        let styleBlock = '';
        if (lineStyle !== 'solid') {
          styleBlock = ` {\n  lineStyle: "${lineStyle}"\n}`;
        }
        
        let labelPart = '';
        if (label) {
          labelPart = ` : "${escapeString(cleanLabel(label))}"`;
        }
        
        lastSourceId = sourceId;
        lastTargetId = targetId;
 
        relationships.push(`${sourceId}${sourceCard} ${arrowOperator}${targetCard} ${targetId}${labelPart}${styleBlock}`);
        continue;
      }
      
      // Element declaration matching: type ID [as label] or type "label" as ID
      const typeRegex = /^\s*(class|interface|enum|annotation|abstract\s+class|abstract|actor|usecase|node|database|queue|entity|boundary|control|artifact|folder|package|card|file|stack|storage|collections|agent|participant)\s+("[^"]+"|[^\s{]+)(?:\s+as\s+("[^"]+"|[^\s{]+))?\s*(\{)?/i;
      const typeMatch = line.match(typeRegex);
      if (typeMatch) {
        const typeRaw = typeMatch[1].toLowerCase().replace(/\s+/g, ' ');
        const firstArg = typeMatch[2];
        const secondArg = typeMatch[3];
        const hasOpenBrace = typeMatch[4] === '{';
        
        let elementId = '';
        let elementLabel = '';
        
        if (secondArg) {
          if (firstArg.startsWith('"')) {
            elementLabel = cleanLabel(firstArg);
            elementId = toSafeId(secondArg);
          } else {
            elementId = toSafeId(firstArg);
            elementLabel = cleanLabel(secondArg);
          }
        } else {
          elementId = toSafeId(firstArg);
          elementLabel = cleanLabel(firstArg);
        }
        
        const mappedType = TYPE_MAP[typeRaw] || 'Rectangle';
        
        if (mappedType === 'Package') {
          getOrCreateComponent(elementId, 'Package', elementLabel, true);
          packageStack.push(elementId);
        } else if (hasOpenBrace) {
          currentClassId = elementId;
          currentClassType = mappedType;
          currentClassLabel = elementLabel;
          currentClassAttributes = [];
          currentClassMethods = [];
          
          const comp = getOrCreateComponent(elementId, mappedType, elementLabel, true);
          if (typeRaw === 'abstract class' || typeRaw === 'abstract') comp.headerType = 'abstract';
          else if (typeRaw === 'interface') comp.headerType = 'interface';
          else if (typeRaw === 'enum') comp.headerType = 'enum';
          else if (typeRaw === 'annotation') comp.headerType = 'annotation';
        } else {
          const comp = getOrCreateComponent(elementId, mappedType, elementLabel, true);
          if (typeRaw === 'abstract class' || typeRaw === 'abstract') comp.headerType = 'abstract';
          else if (typeRaw === 'interface') comp.headerType = 'interface';
          else if (typeRaw === 'enum') comp.headerType = 'enum';
          else if (typeRaw === 'annotation') comp.headerType = 'annotation';
        }
        continue;
      }
    }
    
    const serializeComponent = (comp: ComponentIR, depth: number): string => {
      const indent = '  '.repeat(depth);
      let res = '';
      
      if (comp.type === 'Package') {
        res += `${indent}${comp.id}: Package {\n`;
        res += `${indent}  label: "${escapeString(comp.label)}"\n`;
        if (comp.themeOverride) {
          res += `${indent}  themeOverride: {\n`;
          if (comp.themeOverride.backgroundColor) res += `${indent}    backgroundColor: "${comp.themeOverride.backgroundColor}"\n`;
          if (comp.themeOverride.textColor) res += `${indent}    textColor: "${comp.themeOverride.textColor}"\n`;
          if (comp.themeOverride.borderColor) res += `${indent}    borderColor: "${comp.themeOverride.borderColor}"\n`;
          if (comp.themeOverride.headerBackgroundColor) res += `${indent}    headerBackgroundColor: "${comp.themeOverride.headerBackgroundColor}"\n`;
          if (comp.themeOverride.headerTextColor) res += `${indent}    headerTextColor: "${comp.themeOverride.headerTextColor}"\n`;
          if (comp.themeOverride.headerTypeColor) res += `${indent}    headerTypeColor: "${comp.themeOverride.headerTypeColor}"\n`;
          if (comp.themeOverride.headerTypeTextColor) res += `${indent}    headerTypeTextColor: "${comp.themeOverride.headerTypeTextColor}"\n`;
          res += `${indent}  }\n`;
        }
        if (comp.children && comp.children.length > 0) {
          const childrenStr = comp.children.map(c => serializeComponent(c, depth + 1)).join('\n');
          res += childrenStr + '\n';
        }
        res += `${indent}}`;
      } else {
        res += `${indent}${comp.id}: ${comp.type} {\n`;
        res += `${indent}  label: "${escapeString(comp.label)}"`;
        if (comp.lifeline) {
          res += `\n${indent}  lifeline: true`;
        }
        if (comp.headerType) {
          res += `\n${indent}  headerType: "${comp.headerType}"`;
        }
        if (comp.themeOverride) {
          res += `\n${indent}  themeOverride: {`;
          if (comp.themeOverride.backgroundColor) res += `\n${indent}    backgroundColor: "${comp.themeOverride.backgroundColor}"`;
          if (comp.themeOverride.textColor) res += `\n${indent}    textColor: "${comp.themeOverride.textColor}"`;
          if (comp.themeOverride.borderColor) res += `\n${indent}    borderColor: "${comp.themeOverride.borderColor}"`;
          if (comp.themeOverride.headerBackgroundColor) res += `\n${indent}    headerBackgroundColor: "${comp.themeOverride.headerBackgroundColor}"`;
          if (comp.themeOverride.headerTextColor) res += `\n${indent}    headerTextColor: "${comp.themeOverride.headerTextColor}"`;
          if (comp.themeOverride.headerTypeColor) res += `\n${indent}    headerTypeColor: "${comp.themeOverride.headerTypeColor}"`;
          if (comp.themeOverride.headerTypeTextColor) res += `\n${indent}    headerTypeTextColor: "${comp.themeOverride.headerTypeTextColor}"`;
          res += `\n${indent}  }`;
        }
        if (comp.attributes && comp.attributes.length > 0) {
          res += `\n${indent}  attributes: {\n`;
          res += comp.attributes.map(a => `${indent}    ${a}`).join('\n') + `\n${indent}  }`;
        }
        if (comp.methods && comp.methods.length > 0) {
          res += `\n${indent}  methods: {\n`;
          res += comp.methods.map(m => `${indent}    ${m}`).join('\n') + `\n${indent}  }`;
        }
        res += `\n${indent}}`;
      }
      
      return res;
    };

    const declarationsStr = rootComponents.map(c => serializeComponent(c, 0)).join('\n');
    return [declarationsStr, '', ...relationships].join('\n').trim();
  }
}
