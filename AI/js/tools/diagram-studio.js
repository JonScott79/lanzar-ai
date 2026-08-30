/*
    diagram-studio.js

    Mina's Visual Schematic & Blueprint Studio for LANZAR AI.

    Responsibilities:
    - Render Atomic Age vector SVG schematics and process flowcharts
    - Provide interactive template switching (Combustor Cross-Section, Aerospike Geometry, Dual Mind Architecture)
    - Export blueprints and diagrams directly into active conversation threads
*/

export const DIAGRAM_TEMPLATES = [
  {
    id: "regen-chamber",
    name: "Regenerative Cooling Chamber Cross-Section",
    category: "Combustor Schematics",
    description: "Detailed vector blueprint of the hot gas liner, milled micro-channels, and outer structural jacket.",
    generateSvg: (options = {}) => {
      return `
        <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="background: #0f1c24; border-radius: 8px; font-family: monospace; width: 100%; height: auto;">
          <!-- Grid Background -->
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(42, 114, 143, 0.15)" stroke-width="0.8"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <!-- Title -->
          <text x="25" y="32" fill="#e2b84d" font-size="13" font-weight="bold" letter-spacing="1.5">LANZAR LAB • BLUEPRINT NO. CC-402 • REGENERATIVE COOLING CHANNEL</text>
          
          <!-- Outer Structural Jacket -->
          <path d="M 50,80 Q 250,90 350,160 T 550,260" fill="none" stroke="#6d7b83" stroke-width="12" stroke-linecap="round"/>
          <text x="440" y="235" fill="#a0aec0" font-size="10">Outer Inconel-718 Jacket</text>

          <!-- Coolant Channels (Cyan Glow) -->
          <path d="M 50,95 Q 250,105 350,175 T 550,275" fill="none" stroke="#2a728f" stroke-width="8" stroke-dasharray="6,4" stroke-linecap="round"/>
          <text x="360" y="145" fill="#4fd1c5" font-size="10" font-weight="bold">Coolant Channel (RP-1 / LCH4)</text>

          <!-- Hot Gas Liner Wall (Copper Alloy) -->
          <path d="M 50,110 Q 250,120 350,190 T 550,290" fill="none" stroke="#d69e2e" stroke-width="6" stroke-linecap="round"/>
          <text x="180" y="80" fill="#ecc94b" font-size="10">GRCop-84 Liner (1.2mm)</text>

          <!-- Hot Gas Core Boundary -->
          <path d="M 50,130 Q 250,140 350,210 T 550,310" fill="none" stroke="#e53e3e" stroke-width="2" stroke-dasharray="4,4"/>
          <text x="120" y="160" fill="#fc8181" font-size="11" font-weight="bold">🔥 Hot Gas Core (3400 K)</text>

          <!-- Heat Flux Arrow Vector -->
          <line x1="200" y1="130" x2="200" y2="85" stroke="#e53e3e" stroke-width="2.5" marker-end="url(#arrow)"/>
          <text x="210" y="110" fill="#fc8181" font-size="10" font-weight="bold">q = 52.4 MW/m²</text>

          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#e53e3e"/>
            </marker>
          </defs>
        </svg>
      `;
    }
  },
  {
    id: "dual-mind-arch",
    name: "Dual Mind Cognitive Architecture Blueprint",
    category: "AI Architecture",
    description: "Schematic flow diagram representing the interaction between Penny, Pete, Mina, and the Authoritative User Identity.",
    generateSvg: (options = {}) => {
      return `
        <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="background: #0f1c24; border-radius: 8px; font-family: monospace; width: 100%; height: auto;">
          <text x="25" y="32" fill="#e2b84d" font-size="13" font-weight="bold" letter-spacing="1.5">LANZAR AI • COGNITIVE SYNTHESIS TOPOLOGY</text>

          <!-- User Node -->
          <rect x="40" y="130" width="100" height="60" rx="8" fill="#1e303c" stroke="#4fd1c5" stroke-width="2"/>
          <text x="90" y="155" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">HUMAN</text>
          <text x="90" y="172" fill="#a0aec0" font-size="10" text-anchor="middle">Authenticated UID</text>

          <!-- Cognitive Router -->
          <rect x="200" y="120" width="120" height="80" rx="10" fill="#2a728f" stroke="#e2b84d" stroke-width="2"/>
          <text x="260" y="152" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">COGNITIVE</text>
          <text x="260" y="170" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">ROUTER</text>

          <!-- Connector Lines -->
          <line x1="140" y1="160" x2="200" y2="160" stroke="#4fd1c5" stroke-width="2"/>
          
          <!-- Penny Node -->
          <rect x="380" y="60" width="170" height="50" rx="6" fill="#1e303c" stroke="#e65100" stroke-width="2"/>
          <text x="465" y="82" fill="#ff9800" font-size="11" font-weight="bold" text-anchor="middle">👩‍🚀 PENNY</text>
          <text x="465" y="98" fill="#a0aec0" font-size="9" text-anchor="middle">Possibility & Experiments</text>
          <line x1="320" y1="140" x2="380" y2="85" stroke="#ff9800" stroke-width="1.5"/>

          <!-- Pete Node -->
          <rect x="380" y="135" width="170" height="50" rx="6" fill="#1e303c" stroke="#245873" stroke-width="2"/>
          <text x="465" y="157" fill="#63b3ed" font-size="11" font-weight="bold" text-anchor="middle">🔬 PETE</text>
          <text x="465" y="173" fill="#a0aec0" font-size="9" text-anchor="middle">Analysis & Systems Math</text>
          <line x1="320" y1="160" x2="380" y2="160" stroke="#63b3ed" stroke-width="1.5"/>

          <!-- Mina Node -->
          <rect x="380" y="210" width="170" height="50" rx="6" fill="#1e303c" stroke="#d32f3f" stroke-width="2"/>
          <text x="465" y="232" fill="#feb2b2" font-size="11" font-weight="bold" text-anchor="middle">🎨 MINA</text>
          <text x="465" y="248" fill="#a0aec0" font-size="9" text-anchor="middle">Art Direction & Aesthetics</text>
          <line x1="320" y1="180" x2="380" y2="235" stroke="#feb2b2" stroke-width="1.5"/>
        </svg>
      `;
    }
  }
];

export class DiagramStudio {
  static getTemplates() {
    return DIAGRAM_TEMPLATES;
  }

  static getTemplate(id) {
    return DIAGRAM_TEMPLATES.find(t => t.id === id) || DIAGRAM_TEMPLATES[0];
  }
}
