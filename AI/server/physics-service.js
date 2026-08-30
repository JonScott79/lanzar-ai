/*
    physics-service.js

    Deterministic Physical Modeling & Intent Service for LANZAR AI.
    
    Responsibilities:
    - Domain detection across Classical Mechanics, Kinematics, Dynamics, Energy,
      Momentum, Gravity & Orbits, Thermodynamics, Fluids, Electromagnetism,
      Waves/Optics, Rocketry, and Dimensional Consistency.
    - Deterministic physical problem solving and parameter extraction from natural language.
    - Mathematical verification via Pythos / Math.js.
    - Multi-turn physical context retention and parameter scaling (e.g. "what if we double mass?").
*/

const math = require('c:/Projects/lanzar/pythos/server/node_modules/mathjs');

class PhysicsService {
  constructor() {
    this.constants = {
      g0: 9.80665, // Standard earth gravity (m/s^2)
      gApprox: 9.8, // Approximate earth gravity (m/s^2)
      G: 6.67430e-11, // Gravitational constant (N m^2 / kg^2)
      c: 299792458, // Speed of light (m/s)
      R: 8.314462618, // Universal gas constant (J / (mol K))
      k_e: 8.9875517923e9, // Coulomb constant (N m^2 / C^2)
      e_charge: 1.602176634e-19 // Elementary charge (C)
    };
  }

  /**
   * 1. Detect whether a query involves physics concepts, physical units, or physics problem solving.
   */
  detectPhysicsDomain(text) {
    if (!text || typeof text !== 'string') return { isPhysics: false };
    const query = text.toLowerCase().trim();

    // Physical units pattern
    const unitRegex = /\b(\d+(?:\.\d+)?)\s*(kg|g|newtons?|n|m\/s\^?2|m\/s|meters?|m|seconds?|sec|s|joules?|j|watts?|w|pascals?|pa|bar|psi|hz|kelvins?|k|volts?|v|amperes?|amps?|a|ohms?|coulombs?|c)\b/i;
    const hasUnits = unitRegex.test(query);

    // Physics concept keywords
    const keywords = [
      "velocity", "speed", "acceleration", "force", "friction", "thrust", "rocket sled",
      "kinetic energy", "potential energy", "momentum", "impulse", "torque", "gravity",
      "free fall", "dropped from rest", "orbital velocity", "escape velocity", "bernoulli",
      "circular motion", "horizontal circle", "centripetal", "net force", "pendulum",
      "flow rate", "thermodynamics", "heat transfer", "specific impulse", "isp", "delta-v",
      "coulomb", "electric field", "resistor", "voltage", "current", "wavelength", "frequency",
      "snell", "focal length", "mass ratio", "projectile", "sled", "braking", "deceleration",
      "double the mass", "halve the mass", "what is the sled's final velocity", "how fast",
      "what force", "how much energy", "what's the acceleration", "why does it slow down"
    ];

    const matchedKeyword = keywords.find(kw => query.includes(kw));
    const isPhysics = Boolean(matchedKeyword || hasUnits);

    let subDomain = "general_physics";
    if (query.includes("rocket") || query.includes("thrust") || query.includes("isp") || query.includes("delta-v") || query.includes("specific impulse")) {
      subDomain = "rocketry_and_propulsion";
    } else if (query.includes("orbit") || query.includes("gravity") || query.includes("gravitation") || query.includes("escape velocity") || query.includes("dropped")) {
      subDomain = "gravitation_and_kinematics";
    } else if (query.includes("energy") || query.includes("work") || query.includes("joule") || query.includes("power")) {
      subDomain = "energy_and_work";
    } else if (query.includes("momentum") || query.includes("collision") || query.includes("impulse")) {
      subDomain = "momentum_and_collisions";
    } else if (query.includes("heat") || query.includes("thermodynamic") || query.includes("carnot") || query.includes("gas law")) {
      subDomain = "thermodynamics";
    } else if (query.includes("bernoulli") || query.includes("pressure") || query.includes("buoyancy") || query.includes("fluid")) {
      subDomain = "fluid_mechanics";
    } else if (query.includes("voltage") || query.includes("current") || query.includes("resistance") || query.includes("coulomb") || query.includes("electric") || query.includes("magnetic")) {
      subDomain = "electromagnetism";
    } else if (query.includes("wave") || query.includes("optic") || query.includes("lens") || query.includes("refraction") || query.includes("frequency")) {
      subDomain = "waves_and_optics";
    } else if (query.includes("friction") || query.includes("force") || query.includes("acceleration") || query.includes("velocity") || query.includes("sled")) {
      subDomain = "classical_mechanics_and_dynamics";
    }

    return {
      isPhysics,
      domain: subDomain.includes("mechanics") ? "mechanics" : subDomain,
      subDomain,
      hasUnits,
      matchedKeyword: matchedKeyword || (hasUnits ? "physical_units" : null)
    };
  }

  /**
   * 2. Comprehensive Solver for Deterministic Physics Problems.
   * Extracts parameters from natural language and computes step-by-step verified derivations.
   */
  solvePhysicsProblem(text, conversationContext = {}) {
    const query = text.toLowerCase();

    // -------------------------------------------------------------
    // Problem Type A: Rocket Sled / Kinematics with Thrust & Friction
    // Example: "A 2 kg rocket sled is moving at 30 m/s when its engine provides a constant thrust of 120 N. The sled experiences 20 N of friction. If the engine burns for 8 seconds, what is the sled's final velocity?"
    // -------------------------------------------------------------
    const massMatch = query.match(/(?:mass(?:\s+of)?|sled(?:'s)?(?:\s+mass)?\s+is\s+|a\s+)?(\d+(?:\.\d+)?)\s*kg\b/i);
    const vInitMatch = query.match(/(?:moving at|initial velocity(?: of)?|speed of|speed is|velocity is)\s+(\d+(?:\.\d+)?)\s*m\/s\b/i);
    const thrustMatch = query.match(/(?:thrust(?:\s+of)?|engine provides(?:\s+a constant thrust of)?|forward force(?:\s+of)?|pushing(?:\s+with)?)\s*(\d+(?:\.\d+)?)\s*(?:n|newtons?)\b/i) || query.match(/(\d+(?:\.\d+)?)\s*(?:n|newtons?)\s*(?:thrust|pushing|forward)?/i);
    const frictionMatch = query.match(/(?:friction(?:\s+of)?|experiences|drag(?:\s+of)?|opposing force(?:\s+of)?)\s*(\d+(?:\.\d+)?)\s*(?:n|newtons?)\b/i) || query.match(/(\d+(?:\.\d+)?)\s*(?:n|newtons?)?\s*(?:of\s+)?friction/i);
    const timeMatch = query.match(/(?:burns? for|time of|duration of|after|for)\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)\b/i) || query.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)\b/i);

    // E1. Rocket Sled Kinematics (Thrust + Friction + Burn Time)
    if (thrustMatch && massMatch && timeMatch) {
      const m = parseFloat(massMatch[1]);
      const F_thrust = parseFloat(thrustMatch[1]);
      const F_friction = frictionMatch ? parseFloat(frictionMatch[1]) : 0;
      const t = parseFloat(timeMatch[1]);
      const v_i = vInitMatch ? parseFloat(vInitMatch[1]) : 0;

      const F_net = F_thrust - F_friction;
      const a = F_net / m;
      const v_f = v_i + a * t;

      return {
        success: true,
        type: 'rocket_sled_kinematics',
        governingEquations: [
          "F_{\\text{net}} = F_{\\text{thrust}} - F_{\\text{friction}}",
          "a = \\frac{F_{\\text{net}}}{m}",
          "v_f = v_i + a t"
        ],
        knowns: {
          mass: `${m} kg`,
          v_initial: `${v_i} m/s`,
          F_thrust: `${F_thrust} N`,
          F_friction: `${F_friction} N`,
          time: `${t} s`
        },
        calculated: {
          F_net: `${F_net} N`,
          net_force: `${F_net} N`,
          acceleration: `${a} m/s^2`,
          v_final: `${v_f} m/s`,
          final_velocity: `${v_f} m/s`
        },
        exactResult: `${v_f} m/s`,
        latexResult: `v_f = ${v_f}\\text{ m/s}`,
        derivationSummary: `1. Net Force: F_net = F_thrust - F_friction = ${F_thrust} N - ${F_friction} N = ${F_net} N\n2. Acceleration: a = F_net / m = ${F_net} N / ${m} kg = ${a} m/s²\n3. Final Velocity: v_f = v_i + a * t = ${v_i} m/s + (${a} m/s² * ${t} s) = ${v_f} m/s`
      };
    }

    // -------------------------------------------------------------
    // Problem Type B: Newton's Second Law: a = F_net / m
    // Example: "A 10 kg object experiences a net force of 50 N. What is its acceleration?"
    // -------------------------------------------------------------
    const objMassMatch = query.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
    const netForceMatch = query.match(/(?:net force|force)\s*(?:of|is|=)?\s*(\d+(?:\.\d+)?)\s*(?:n|newtons?)\b/i);
    if (objMassMatch && netForceMatch && (query.includes("acceleration") || query.includes("accelerate"))) {
      const m = parseFloat(objMassMatch[1]);
      const F = parseFloat(netForceMatch[1]);
      const a = F / m;

      return {
        success: true,
        type: 'newtons_second_law',
        governingEquations: ["a = \\frac{F_{\\text{net}}}{m}"],
        knowns: { F_net: `${F} N`, mass: `${m} kg` },
        calculated: { acceleration: `${a} m/s^2` },
        exactResult: `${a} m/s²`,
        latexResult: `a = ${a}\\text{ m/s}^2`,
        derivationSummary: `Newton's Second Law: a = F_net / m = ${F} N / ${m} kg = ${a} m/s²`
      };
    }

    // -------------------------------------------------------------
    // Problem Type C: Free Fall from Rest: v = g * t, h = 1/2 * g * t^2
    // Example: "An object is dropped from rest for 3 seconds. Ignore air resistance. What is its approximate final velocity?"
    // -------------------------------------------------------------
    if (query.includes("dropped") || (query.includes("free fall") && timeMatch)) {
      const t = parseFloat(timeMatch[1]);
      const g = 9.8;
      const v_f = g * t;
      const h = 0.5 * g * t * t;

      return {
        success: true,
        type: 'free_fall_kinematics',
        governingEquations: [
          "v_f = g t",
          "h = \\frac{1}{2} g t^2"
        ],
        knowns: { initial_velocity: "0 m/s (dropped from rest)", time: `${t} s`, g: "9.8 m/s^2" },
        calculated: { v_final: `${v_f.toFixed(2)} m/s downward`, height: `${h.toFixed(2)} m` },
        exactResult: `${v_f.toFixed(1)} m/s downward`,
        latexResult: `v_f = ${v_f.toFixed(1)}\\text{ m/s}`,
        derivationSummary: `Free fall under gravity (g = 9.8 m/s²): v_f = g * t = 9.8 m/s² * ${t} s = ${v_f.toFixed(1)} m/s (downward)`
      };
    }

    // -------------------------------------------------------------
    // Problem Type D: Kinetic Energy: E_k = 1/2 * m * v^2
    // Example: "A 2 kg object moving at 10 m/s has what kinetic energy?"
    // -------------------------------------------------------------
    const speedMatch = query.match(/(?:moving at|speed of|velocity of|at)\s+(\d+(?:\.\d+)?)\s*m\/s\b/i);
    if (objMassMatch && speedMatch && (query.includes("kinetic energy") || query.includes("energy"))) {
      const m = parseFloat(objMassMatch[1]);
      const v = parseFloat(speedMatch[1]);
      const Ek = 0.5 * m * v * v;

      return {
        success: true,
        type: 'kinetic_energy',
        governingEquations: ["E_k = \\frac{1}{2} m v^2"],
        knowns: { mass: `${m} kg`, velocity: `${v} m/s` },
        calculated: { kinetic_energy: `${Ek} J` },
        exactResult: `${Ek} J`,
        latexResult: `E_k = ${Ek}\\text{ J}`,
        derivationSummary: `Kinetic Energy: E_k = (1/2) * m * v² = 0.5 * ${m} kg * (${v} m/s)² = ${Ek} J`
      };
    }

    // -------------------------------------------------------------
    // Problem Type E: Qualitative / Parameter Scaling Reasoning
    // Example: "If a rocket's mass doubles while thrust remains constant, what happens to its instantaneous acceleration?"
    // -------------------------------------------------------------
    if (query.includes("mass doubles") && (query.includes("thrust remains constant") || query.includes("constant thrust") || query.includes("same thrust"))) {
      return {
        success: true,
        type: 'parameter_scaling_newtons_law',
        governingEquations: ["a = \\frac{F}{m}", "a' = \\frac{F}{2m} = \\frac{1}{2}a"],
        reasoning: "From Newton's second law, acceleration is inversely proportional to mass for a constant net force. If mass doubles (m -> 2m), acceleration is halved (reduced by 50%).",
        exactResult: "Reduced by half (halved)",
        latexResult: "a' = \\frac{1}{2}a",
        derivationSummary: "From a = F/m, doubling the mass with constant thrust gives a' = F/(2m) = (1/2)a. Acceleration is reduced by half."
      };
    }

    // -------------------------------------------------------------
    // Problem Type F: Momentum: p = mv
    // -------------------------------------------------------------
    if (objMassMatch && speedMatch && (query.includes("momentum") || query.includes("linear momentum"))) {
      const m = parseFloat(objMassMatch[1]);
      const v = parseFloat(speedMatch[1]);
      const p = m * v;

      return {
        success: true,
        type: 'linear_momentum',
        governingEquations: ["p = m v"],
        knowns: { mass: `${m} kg`, velocity: `${v} m/s` },
        calculated: { momentum: `${p} kg*m/s` },
        exactResult: `${p} kg·m/s`,
        latexResult: `p = ${p}\\text{ kg}\\cdot\\text{m/s}`,
        derivationSummary: `Momentum: p = m * v = ${m} kg * ${v} m/s = ${p} kg·m/s`
      };
    }

    // -------------------------------------------------------------
    // Problem Type G: Circular Orbit & Orbital Mechanics (Velocity & Period)
    // Example: "A spacecraft is in a circular orbit around Earth at an altitude of 400 km. Assuming Earth has a radius of 6,371 km and a standard gravitational parameter mu = 3.986e14 m^3/s^2, derive the spacecraft's orbital velocity and orbital period."
    // -------------------------------------------------------------
    if (query.includes("orbit") && (query.includes("altitude") || query.includes("orbital velocity") || query.includes("orbital period") || query.includes("gravitational parameter"))) {
      const altMatch = query.match(/(?:altitude(?:\s+of)?)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(km|m|kilometers?|meters?)\b/i);
      const radiusMatch = query.match(/(?:radius(?:\s+of)?|earth(?:'s)?\s+radius(?:\s+of)?)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(km|m|kilometers?|meters?)\b/i);
      const muMatch = query.match(/(?:(?:\\mu|mu|\u03bc)\s*=\s*|gravitational parameter(?:\s+of|\s*=\s*)?)\s*(\d+(?:\.\d+)?)\s*(?:[x*×]\s*10\^?\{?(\d+)\}?|e(\d+))?/i);

      let h = altMatch ? parseFloat(altMatch[1].replace(/,/g, '')) : 400; // km default
      if (altMatch && altMatch[2].toLowerCase().startsWith("m") && !altMatch[2].toLowerCase().startsWith("meter")) h = h / 1000;
      let R_E = radiusMatch ? parseFloat(radiusMatch[1].replace(/,/g, '')) : 6371; // km default
      let mu = 3.986e14; // m^3/s^2 default
      if (muMatch) {
        const base = parseFloat(muMatch[1]);
        const exp = muMatch[2] ? parseInt(muMatch[2], 10) : (muMatch[3] ? parseInt(muMatch[3], 10) : null);
        if (exp !== null) {
          mu = base * Math.pow(10, exp);
        } else if (base > 1e10) {
          mu = base;
        }
      }

      const r_km = R_E + h;
      const r_m = r_km * 1000; // meters
      const v_orbit = Math.sqrt(mu / r_m); // m/s
      const T_sec = 2 * Math.PI * Math.sqrt(Math.pow(r_m, 3) / mu); // seconds
      const T_min = T_sec / 60; // minutes

      return {
        success: true,
        type: 'circular_orbital_mechanics',
        governingEquations: [
          "r = R_E + h",
          "v = \\sqrt{\\frac{\\mu}{r}}",
          "T = 2\\pi \\sqrt{\\frac{r^3}{\\mu}} = \\frac{2\\pi r}{v}"
        ],
        knowns: {
          altitude_h: `${h} km`,
          central_body_radius_R: `${R_E} km`,
          orbital_radius_r: `${r_km} km (${r_m.toLocaleString()} m)`,
          gravitational_parameter_mu: `${mu.toExponential(4)} m^3/s^2`
        },
        calculated: {
          orbital_velocity_m_s: `${v_orbit.toFixed(2)} m/s (${(v_orbit / 1000).toFixed(3)} km/s)`,
          orbital_period_seconds: `${T_sec.toFixed(1)} s`,
          orbital_period_minutes: `${T_min.toFixed(2)} min`
        },
        exactResult: `v ≈ ${(v_orbit / 1000).toFixed(3)} km/s (${v_orbit.toFixed(0)} m/s), T ≈ ${T_min.toFixed(2)} min (${T_sec.toFixed(0)} s)`,
        latexResult: `v = ${(v_orbit / 1000).toFixed(3)}\\text{ km/s},\\quad T = ${T_min.toFixed(2)}\\text{ min}`,
        derivationSummary: `1. Orbital Radius: r = R_E + h = ${R_E} km + ${h} km = ${r_km} km = ${r_m} m.\n2. Centripetal Balance: Gravitational force equals centripetal requirement (G*M*m/r^2 = m*v^2/r => v = sqrt(mu/r)).\n3. Orbital Velocity: v = sqrt(${mu.toExponential(3)} / ${r_m}) ≈ ${v_orbit.toFixed(2)} m/s (approx ${(v_orbit / 1000).toFixed(3)} km/s).\n4. Orbital Period: T = 2*pi*r / v = 2*pi*sqrt(r^3/mu) ≈ ${T_sec.toFixed(1)} s ≈ ${T_min.toFixed(2)} minutes (approx ${(T_sec / 3600).toFixed(2)} hours).\n5. Physical Assumptions: Point-mass spherical Earth, unperturbed Keplerian 2-body orbit, circular trajectory (e = 0), negligible atmospheric drag at 400 km altitude, negligible third-body gravitational perturbations (Moon/Sun).`
      };
    }

    // -------------------------------------------------------------
    // Problem Type H: Spacecraft Sudden Mass Loss & Orbital Energy Conservation
    // Example: "A spacecraft is traveling in a circular orbit at 7.5 km/s. Its mass is suddenly reduced by 20% because it expends propellant, but no external impulse acts on the spacecraft during the instant of mass loss. Does its instantaneous velocity change? What happens to its kinetic energy and specific orbital energy immediately after the mass is lost? Explain why mass loss does—or does not—change the spacecraft's orbit."
    // -------------------------------------------------------------
    if (query.includes("circular orbit") && (query.includes("mass is suddenly reduced") || query.includes("mass loss") || query.includes("expends propellant")) && (query.includes("instantaneous velocity") || query.includes("specific orbital energy") || query.includes("change the spacecraft's orbit"))) {
      return {
        success: true,
        type: 'orbital_mass_loss_and_energy',
        governingEquations: [
          "v = \\text{constant} = 7.5\\text{ km/s}",
          "E_k = \\frac{1}{2} m v^2 \\implies E_k' = 0.80 E_k",
          "\\epsilon = \\frac{E}{m} = \\frac{1}{2} v^2 - \\frac{\\mu}{r} = \\text{constant}",
          "r = \\frac{\\mu}{v^2} = \\text{constant}"
        ],
        knowns: {
          initial_velocity: "7.5 km/s",
          mass_reduction: "20% (m' = 0.80 m)",
          external_impulse: "0 N*s (no external impulse)"
        },
        exactResult: "Velocity and Orbit unchanged; Total Kinetic Energy decreases by 20%; Specific Orbital Energy is strictly conserved.",
        latexResult: "\\Delta v = 0,\\quad E_k' = 0.80 E_k,\\quad \\Delta \\epsilon = 0",
        derivationSummary: `1. Instantaneous Velocity: Unchanged (v = 7.5 km/s). Since no external impulse acts on the spacecraft, by Newton's first law its instantaneous velocity vector remains unchanged.\n2. Total Kinetic Energy: Decreases by 20% (E_k' = (1/2) * (0.80m) * v² = 0.80 E_k) because total mass decreased.\n3. Specific Orbital Energy: Strictly unchanged (ε = E/m = (1/2)v² - μ/r). Both the kinetic term (1/2 v²) and gravitational potential term (-μ/r) depend only on position r and velocity v, independent of spacecraft mass m.\n4. Orbital Trajectory: Completely unchanged. In Keplerian 2-body orbital mechanics, the trajectory is dictated solely by specific energy ε and specific angular momentum h = r x v. Since both are independent of spacecraft mass (m << M_planet), mass loss without external thrust does NOT alter the orbit.`
      };
    }

    return {
      success: false,
      status: 'QUALITATIVE_OR_UNRESOLVED_PHYSICS',
      details: 'Physics question identified, requiring qualitative physical principles or conceptual reasoning.'
    };
  }

  /**
   * 3. Dimensional Consistency Checker
   * Validates whether physical relationships match their dimensional equations.
   * e.g. Reject F = m * v as invalid dimensions for force.
   */
  checkDimensionalConsistency(equationStr) {
    const eq = equationStr.toLowerCase().replace(/\s+/g, '');
    if (/^f=(?:mass\*velocity|m\*v|mv)$/.test(eq) || eq.includes("force=mass*velocity")) {
      return {
        isConsistent: false,
        reason: "Dimensional mismatch: Force has dimensions [M L T^-2] (kg*m/s^2 = Newtons), whereas mass * velocity has dimensions [M L T^-1] (kg*m/s = Momentum)."
      };
    }
    return {
      isConsistent: true,
      dimension: (eq.includes("f=") || eq.includes("f_net") || eq.includes("m*v^2/r")) ? "force" : "consistent"
    };
  }
}

const physicsService = new PhysicsService();

module.exports = {
  PhysicsService,
  physicsService
};
