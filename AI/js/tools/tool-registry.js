/*
    tool-registry.js

    Registry of laboratory instruments, engineering utilities, and scientific tools for LANZAR AI.

    Responsibilities
    - Define tool catalog from canonical Atomic Age workbench mockups
    - Provide execution interfaces for future tool dispatch
*/

// =====================================
// Tool Registry
// =====================================

export const LAB_TOOLS = [
  {
    id: "brainstorm-pad",
    name: "Brainstorm Pad",
    icon: "💡",
    category: "Ideation",
    description: "Rapid divergence mapping, wild concept testing, and hypothesis generation.",
    lead: "Penny"
  },
  {
    id: "research-terminal",
    name: "Research Terminal",
    icon: "📡",
    category: "Investigation",
    description: "Deep literature inspection, historical scientific precedents, and technical citations.",
    lead: "Pete"
  },
  {
    id: "equation-solver",
    name: "Equation Solver",
    icon: "📐",
    category: "Mathematics",
    description: "Symbolic and numerical solver for thermodynamic, aerodynamic, and physics equations.",
    lead: "Pete"
  },
  {
    id: "data-analyzer",
    name: "Data Analyzer",
    icon: "📊",
    category: "Analytics",
    description: "Statistical distributions, regression modeling, and telemetry data parsing.",
    lead: "Both"
  },
  {
    id: "system-modeler",
    name: "System Modeler",
    icon: "⚙️",
    category: "Engineering",
    description: "Feedback loop modeling, state machines, and multi-component system architectures.",
    lead: "Pete"
  },
  {
    id: "code-workbench",
    name: "Code Workbench",
    icon: "💻",
    category: "Software",
    description: "Algorithmic implementation, simulation scripting, and code verification.",
    lead: "Both"
  },
  {
    id: "diagram-studio",
    name: "Diagram Studio",
    icon: "🎨",
    category: "Visualization",
    description: "Atomic Age schematics, process flowcharts, and technical blueprints.",
    lead: "Penny"
  },
  {
    id: "report-writer",
    name: "Report Writer",
    icon: "📝",
    category: "Documentation",
    description: "Executive summaries, technical specifications, and laboratory experiment logs.",
    lead: "Both"
  }
];
