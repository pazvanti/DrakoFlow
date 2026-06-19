// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { PlantUmlTranslator } from '../../src/utils/PlantUmlTranslator';
import { parseDslDocument } from '../../src/dsl/parser';
import { createComponentsFromDsl } from '../../src/engine/componentFactory';
import { renderRelationships } from '../../src/engine/relationshipRenderer';
import { layoutRootComponents } from '../../src/engine/layout';
import { ThemeVariables } from '../../src/components/BaseComponent';

describe('PlantUmlTranslator', () => {
  const translator = new PlantUmlTranslator();

  it('translates simple shapes', () => {
    const input = `
      actor Admin
      database Database
      usecase "Use Case 1" as UC1
    `;
    const result = translator.translate(input);
    expect(result).toContain('admin: Actor {\n  label: "Admin"\n}');
    expect(result).toContain('database: Cylinder {\n  label: "Database"\n}');
    expect(result).toContain('uc1: Usecase {\n  label: "Use Case 1"\n}');
  });

  it('translates classes with attribute and method body structures', () => {
    const input = `
      class User {
        +id: string
        -username: string
        -- Divider --
        +login(): boolean
      }
    `;
    const result = translator.translate(input);
    expect(result).toContain('user: Class {\n  label: "User"');
    expect(result).toContain('attributes: {\n    +id: string\n    -username: string\n  }');
    expect(result).toContain('methods: {\n    +login(): boolean\n  }');
  });

  it('handles package nesting and applies structural indentation', () => {
    const input = `
      package "My Services" {
        class ProductService
        class OrderService
      }
    `;
    const result = translator.translate(input);
    expect(result).toContain('my_services: Package {\n  label: "My Services"');
    expect(result).toContain('  productservice: Class {\n    label: "ProductService"\n  }');
    expect(result).toContain('  orderservice: Class {\n    label: "OrderService"\n  }');
    expect(result).toContain('}');
  });

  it('translates association connectors and lineStyles correctly', () => {
    const input = `
      class A
      class B
      A -> B : "solid"
      A --> B : "dashed"
      A ..> B : "dotted"
    `;
    const result = translator.translate(input);
    expect(result).toContain('a -> b : "solid"');
    expect(result).toContain('a -> b : "dashed" {\n  lineStyle: "dashed"\n}');
    expect(result).toContain('a -> b : "dotted" {\n  lineStyle: "dotted"\n}');
  });

  it('flips direction correctly for left-facing arrows and translates inheritance to extends label', () => {
    const input = `
      class Parent
      class Child
      Parent <|-- Child
      A <- B : "left"
    `;
    const result = translator.translate(input);
    expect(result).toContain('child -> parent');
    expect(result).toContain('b -> a : "left"');
  });

  it('generates implicit declarations for elements that are used but not defined', () => {
    const input = `
      class Dummy
      ImplicitA -> ImplicitB : "conn"
    `;
    const result = translator.translate(input);
    expect(result).toContain('implicita: Rectangle {\n  label: "ImplicitA"\n}');
    expect(result).toContain('implicitb: Rectangle {\n  label: "ImplicitB"\n}');
    expect(result).toContain('implicita -> implicitb : "conn"');
  });

  it('replaces spaces and special characters with underscores to construct safe IDs', () => {
    const input = `
      actor "Customer User" as Cust
      class "Product Order"
    `;
    const result = translator.translate(input);
    expect(result).toContain('cust: Actor {\n  label: "Customer User"\n}');
    expect(result).toContain('product_order: Class {\n  label: "Product Order"\n}');
  });

  it('translates sequence return statements correctly', () => {
    const input = `
      Alice -> Bob : Hello
      return ok
    `;
    const result = translator.translate(input);
    expect(result).toContain('alice -> bob : "Hello"');
    expect(result).toContain('bob -> alice : "ok" {\n  lineStyle: "dashed"\n}');
    expect(result).not.toContain('return -> k');
  });

  it('translates relationships with multiplicity cardinalities', () => {
    const input = `
      evenement "1" -- "0..1" planning
      type "0..*" - "1" materiel
    `;
    const result = translator.translate(input);
    expect(result).toContain('evenement [1] - [0..1] planning');
    expect(result).toContain('type [0..*] - [1] materiel');
  });

  it('translates complex activity diagrams', () => {
    const input = `
@startuml
start
:Let entSet be a set of Entitlements to revoke;
:Add all dependent entitlements to entSet;
:Delete all dependent entitlements from database;
:Delete pools of entitlements 
in entSet that are development pools;
:Update consumed quantity of entSet;
:Delete all entSet entitlements
 from database;
:stackPools = filter Entitlements from entSet that
have stacking_id attribute;
partition for-each-entSet {
:stackPool = find stack pool  
for entitlement;
:sSet = find all ents that have the 
stacking_id;
:Update stackPool based on sSet;
}
:virtEnts = filter Entitlements from entSet that 
have virt_limit and are for distributors;
partition for-each-virtEnts {
if (virt_limit == unlimited) then
-> YES;
:Set bonus pool quantity to -1;
else
-> NO;
:Add back reduced pool quantity;
endif
}
:mEnts = get all modifier 
entitlements of entSet entitlements;;
:Lazily regenerate entitlement certificates 
 for all mEnts;
:Compute compliance status for all 
Consumers that have an entitlement in entSet;
stop
@enduml
    `;
    const result = translator.translate(input);
    console.log("--- START TRANSLATOR RESULT ---");
    console.log(result);
    console.log("--- END TRANSLATOR RESULT ---");
    expect(result).not.toBe("");
    
    // Parse the generated DSL
    const doc = parseDslDocument(result);
    expect(doc.components.length).toBeGreaterThan(0);

    const defaultTheme: ThemeVariables = {
      primaryColor: '#0d6efd',
      secondaryColor: '#6c757d',
      backgroundColor: '#ffffff',
      textColor: '#212529',
      borderColor: '#dee2e6',
      fontFamily: 'sans-serif'
    };

    // Instantiate components
    const comps = createComponentsFromDsl(doc.components);
    expect(comps.length).toBeGreaterThan(0);

    // Layout components
    layoutRootComponents(comps, defaultTheme, doc.relationships);

    // Render relationships
    const svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    const layers = renderRelationships(doc.relationships, comps, defaultTheme, svgRoot);
    expect(layers.pathsLayer).toBeDefined();
  });

  it('translates relationships containing accented and non-ASCII letters in identifiers', () => {
    const input = `
@startuml
actor "Utilisateur"

"Utilisateur"-> Système: Demande de l'historique
"Utilisateur"<-- Système: Liste des fichiers
"Utilisateur"-> Système: Sélectionner un ou plusieurs\\nfichier(s) et vérifier les URLs
"Utilisateur"<-- Système: Liste des URLs invalides\\ndu/des fichier(s) sélectionné(s)
@enduml
    `;
    const result = translator.translate(input);
    console.log("ACCENTED RESULT IS:");
    console.log(result);

    expect(result).toContain('utilisateur: Actor');
    expect(result).toContain('syst_me: Rectangle');
    expect(result).toContain('label: "Système"');
    expect(result).toContain('utilisateur -> syst_me : "Demande de l\'historique"');
    expect(result).toContain('syst_me -> utilisateur : "Liste des fichiers"');
  });

  it('adds lifeline: true for sequence diagrams and translates elements case-insensitively', () => {
    const input = `
@startuml
participant "Alice" as A
actor "Bob"
A -> bob: "hello"
@enduml
    `;
    const result = translator.translate(input);
    expect(result).toContain('a: Rectangle {\n  label: "Alice"\n  lifeline: true\n}');
    expect(result).toContain('bob: Actor {\n  label: "Bob"\n  lifeline: true\n}');
    expect(result).toContain('a -> bob : "hello"');
    // Ensure case insensitivity resolved Bob and bob to the same component
    const bobOccurrences = result.split('bob:').length - 1;
    expect(bobOccurrences).toBe(1); // bob declared only once
  });

  it('does not add lifeline: true for class or activity diagrams', () => {
    const classInput = `
@startuml
class A
class B
A -> B
@enduml
    `;
    const classResult = translator.translate(classInput);
    expect(classResult).toContain('a: Class {\n  label: "A"\n}');
    expect(classResult).not.toContain('lifeline: true');

    const activityInput = `
@startuml
start
:Action;
stop
@enduml
    `;
    const activityResult = translator.translate(activityInput);
    expect(activityResult).not.toContain('lifeline: true');
  });

  it('prevents duplicate declarations for case-insensitive duplicate element definitions', () => {
    const input = `
      class User
      class user
      User -> user : "self"
    `;
    const result = translator.translate(input);
    // user should be declared only once
    const userDeclarations = result.split('user:').length - 1;
    expect(userDeclarations).toBe(1);
  });

  it('escapes nested double quotes in labels and return messages correctly', () => {
    const input = `
      Alice -> Bob : {"action": "greet"}
      return {"status": "ok"}
    `;
    const result = translator.translate(input);
    expect(result).toContain('alice -> bob : "{\\"action\\": \\"greet\\"}"');
    expect(result).toContain('bob -> alice : "{\\"status\\": \\"ok\\"}" {\n  lineStyle: "dashed"\n}');
  });

  it('translates box containers in sequence diagrams and nested elements correctly', () => {
    const input = `
      box "Application Web" #LightBlue
        participant form
      end box
    `;
    const result = translator.translate(input);
    expect(result).toContain('application_web_1: Package {');
    expect(result).toContain('label: "Application Web"');
    expect(result).toContain('backgroundColor: "LightBlue"');
    expect(result).toContain('form: Rectangle {');
    const formIndex = result.indexOf('form: Rectangle {');
    const boxIndex = result.indexOf('application_web_1: Package {');
    expect(boxIndex).toBeGreaterThan(-1);
    expect(formIndex).toBeGreaterThan(boxIndex);
  });
});
