/*
    equation-solver.js

    Pete's Physics & Mathematical Computation Instrument for LANZAR AI.

    Responsibilities:
    - Solve rocket propulsion, thermodynamics, orbital mechanics, and fluid dynamics equations
    - Provide interactive parameter controls and mathematical breakdowns
    - Export rigorous analytical derivations directly into active conversation threads
*/

export const EQUATIONS = [
  {
    id: "thrust-isp",
    name: "Rocket Engine Thrust & Specific Impulse",
    category: "Propulsion",
    formulaLatex: "F = \\dot{m} v_e + (p_e - p_a) A_e",
    description: "Computes effective total thrust and specific impulse (Isp) from mass flow, exit velocity, and nozzle exit pressure differential.",
    params: [
      { id: "mdot", label: "Mass Flow Rate (ṁ)", unit: "kg/s", default: 120, min: 1, max: 1000, step: 1 },
      { id: "ve", label: "Exit Velocity (v_e)", unit: "m/s", default: 3200, min: 1000, max: 5000, step: 50 },
      { id: "pe", label: "Exit Pressure (p_e)", unit: "kPa", default: 101.3, min: 10, max: 500, step: 1 },
      { id: "pa", label: "Ambient Pressure (p_a)", unit: "kPa", default: 101.3, min: 0, max: 150, step: 1 },
      { id: "ae", label: "Nozzle Exit Area (A_e)", unit: "m²", default: 0.25, min: 0.01, max: 5.0, step: 0.01 }
    ],
    solve: (inputs) => {
      const { mdot, ve, pe, pa, ae } = inputs;
      const momentumThrust = mdot * ve; // N
      const pressureThrust = (pe - pa) * 1000 * ae; // N
      const totalThrustN = momentumThrust + pressureThrust;
      const totalThrustKN = totalThrustN / 1000;
      const g0 = 9.80665;
      const ispSeconds = totalThrustN / (mdot * g0);

      return {
        summary: `Total Thrust: **${totalThrustKN.toFixed(2)} kN** | Specific Impulse: **${ispSeconds.toFixed(1)} s**`,
        details: [
          `**Momentum Thrust ($ṁ \\cdot v_e$):** ${(momentumThrust / 1000).toFixed(2)} kN`,
          `**Pressure Thrust ($(p_e - p_a) A_e$):** ${(pressureThrust / 1000).toFixed(2)} kN`,
          `**Total Vacuum/Ambient Thrust:** ${totalThrustKN.toFixed(2)} kN (${(totalThrustN / 4.44822).toFixed(0)} lbf)`,
          `**Specific Impulse ($I_{sp}$):** ${ispSeconds.toFixed(2)} seconds`,
          `**Effective Exhaust Velocity ($c$):** ${(totalThrustN / mdot).toFixed(1)} m/s`
        ]
      };
    }
  },
  {
    id: "tsiolkovsky-deltav",
    name: "Tsiolkovsky Rocket Equation (Δv)",
    category: "Orbital Mechanics",
    formulaLatex: "\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_0}{m_f}\\right)",
    description: "Calculates total velocity change (Δv) available to a vehicle based on mass ratio and engine specific impulse.",
    params: [
      { id: "isp", label: "Specific Impulse (I_sp)", unit: "s", default: 345, min: 150, max: 500, step: 5 },
      { id: "m0", label: "Initial Wet Mass (m_0)", unit: "kg", default: 15000, min: 100, max: 500000, step: 500 },
      { id: "mf", label: "Final Dry Mass (m_f)", unit: "kg", default: 3200, min: 50, max: 100000, step: 100 }
    ],
    solve: (inputs) => {
      const { isp, m0, mf } = inputs;
      if (mf >= m0) {
        return { summary: "Error: Final dry mass must be less than wet mass.", details: [] };
      }
      const g0 = 9.80665;
      const massRatio = m0 / mf;
      const deltaV = isp * g0 * Math.log(massRatio);
      const propellantMass = m0 - mf;
      const propellantMassFraction = (propellantMass / m0) * 100;

      return {
        summary: `Total Velocity Increment (Δv): **${deltaV.toFixed(1)} m/s** (${(deltaV / 1000).toFixed(3)} km/s)`,
        details: [
          `**Mass Ratio ($m_0 / m_f$):** ${massRatio.toFixed(3)}:1`,
          `**Propellant Mass:** ${propellantMass.toLocaleString()} kg (${propellantMassFraction.toFixed(1)}% of wet mass)`,
          `**Effective Exhaust Velocity ($v_e$):** ${(isp * g0).toFixed(1)} m/s`,
          `**Payload Capacity Index:** ${(mf / m0 * 100).toFixed(2)}% structural fraction`
        ]
      };
    }
  },
  {
    id: "regen-cooling-flux",
    name: "Regenerative Cooling Channel Heat Flux",
    category: "Thermodynamics",
    formulaLatex: "q = \\frac{k_{wall}}{t_{wall}} (T_{gas,wall} - T_{coolant,wall})",
    description: "Calculates conduction heat transfer rate through combustion chamber wall into regenerative coolant channels.",
    params: [
      { id: "kwall", label: "Thermal Conductivity (k)", unit: "W/(m·K)", default: 360, min: 15, max: 400, step: 5 },
      { id: "twall", label: "Chamber Wall Thickness (t)", unit: "mm", default: 1.2, min: 0.5, max: 10.0, step: 0.1 },
      { id: "tgas", label: "Gas-Side Wall Temp (T_gw)", unit: "K", default: 920, min: 300, max: 1800, step: 10 },
      { id: "tcool", label: "Coolant-Side Temp (T_cw)", unit: "K", default: 310, min: 50, max: 600, step: 10 }
    ],
    solve: (inputs) => {
      const { kwall, twall, tgas, tcool } = inputs;
      const thicknessM = twall / 1000;
      const deltaT = tgas - tcool;
      const heatFluxW_m2 = (kwall / thicknessM) * deltaT;
      const heatFluxMW_m2 = heatFluxW_m2 / 1e6;

      return {
        summary: `Heat Flux (q): **${heatFluxMW_m2.toFixed(2)} MW/m²** | ΔT: **${deltaT.toFixed(0)} K**`,
        details: [
          `**Temperature Gradient:** ${(deltaT / twall).toFixed(1)} K/mm`,
          `**Conductive Resistance ($R_{th}$):** ${(thicknessM / kwall * 1e6).toFixed(3)} × 10⁻⁶ m²·K/W`,
          `**Thermal Margin:** ${tgas < 1050 ? "✓ SAFE (Below Copper Alloy recrystallization limit)" : "⚠️ WARNING (Approaching thermal degradation limit)"}`,
          `**Channel Micro-Swirl Enhancement Factor:** ${(1 + (heatFluxMW_m2 / 50)).toFixed(2)}x`
        ]
      };
    }
  }
];

export class EquationSolver {
  static getEquations() {
    return EQUATIONS;
  }

  static getEquation(id) {
    return EQUATIONS.find(e => e.id === id) || EQUATIONS[0];
  }

  static solve(eqId, inputValues) {
    const eq = this.getEquation(eqId);
    return eq.solve(inputValues);
  }
}
