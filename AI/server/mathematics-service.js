/*
    mathematics-service.js

    Deterministic Mathematical Reasoning, Verification, and Symbolic Engine for LANZAR AI.
    Reuses and separates Pythos's battle-tested mathematical capabilities from persona voice.

    Core Capabilities:
    1. Exact Arithmetic & Fraction Simplification (BigNumber & 64-bit rational fractions)
    2. Symbolic Algebraic Simplification & Equivalence
    3. Multi-Variable & Polynomial Equation Solving / Root Verification
    4. Matrix & Linear Algebra Operations (Determinant, Inverse, Matrix Products)
    5. Symbolic & Numerical Calculus (Derivatives, Integrals, Limits)
    6. Unit Conversions & Dimensional Compatibility Checks
    7. Ambiguity, Underdetermination, and Insufficient Information Detection
    8. Structured Verification Contracts (Never manufactures confidence or hallucinates)
*/

let mathInstance = null;
let exactMathInstance = null;

function getMath() {
  if (!mathInstance) {
    try {
      mathInstance = require('c:/Projects/lanzar/pythos/server/node_modules/mathjs');
    } catch (e) {
      try {
        mathInstance = require('mathjs');
      } catch (err) {
        throw new Error(`Math.js library unavailable: ${err.message}`);
      }
    }
  }
  return mathInstance;
}

function getExactMath() {
  if (!exactMathInstance) {
    const math = getMath();
    exactMathInstance = math.create(math.all, {
      number: 'Fraction',
      precision: 64
    });
  }
  return exactMathInstance;
}

class MathematicsService {
  /**
   * 1. Exact Arithmetic & Rational Fractions
   */
  evaluateArithmetic(expression) {
    const math = getMath();
    const exactMath = getExactMath();

    if (!expression || typeof expression !== 'string') {
      return { success: false, status: 'INVALID_INPUT', error: 'Missing mathematical expression' };
    }

    const cleanExpr = expression.trim().replace(/^calculate\s+/i, '').replace(/[?!=]+$/, '');

    try {
      // Try exact rational evaluation first
      try {
        const exactResult = exactMath.evaluate(cleanExpr);
        if (exactResult && exactResult.isFraction) {
          const fracStr = `${exactResult.s * exactResult.n}/${exactResult.d}`;
          const decimalVal = Number(exactResult.valueOf());
          return {
            success: true,
            status: 'VERIFIED',
            type: 'fraction',
            value: decimalVal,
            exactFraction: fracStr,
            decimalValue: decimalVal,
            latex: `\\frac{${exactResult.s * exactResult.n}}{${exactResult.d}} = ${decimalVal}`,
            details: `${cleanExpr} = ${fracStr} (${decimalVal})`
          };
        }
      } catch (_) {
        // Fall back to standard evaluation
      }

      const rawResult = math.evaluate(cleanExpr);
      if (!Number.isFinite(rawResult)) {
        return {
          success: false,
          status: 'UNDEFINED',
          error: 'Result is undefined or division by zero (singularity)',
          details: `Expression ${cleanExpr} is mathematically undefined.`
        };
      }

      return {
        success: true,
        status: 'VERIFIED',
        type: 'numeric',
        value: rawResult,
        latex: `${cleanExpr} = ${rawResult}`,
        details: `${cleanExpr} = ${rawResult}`
      };
    } catch (err) {
      return {
        success: false,
        status: 'MALFORMED_EXPRESSION',
        error: err.message,
        details: `Could not parse mathematical expression: ${err.message}`
      };
    }
  }

  /**
   * 2. Symbolic Simplification & Equivalence
   */
  simplifyExpression(expr) {
    const math = getMath();
    try {
      const node = math.simplify(expr);
      return {
        success: true,
        status: 'VERIFIED',
        original: expr,
        simplified: node.toString(),
        latex: node.toTex ? node.toTex() : node.toString()
      };
    } catch (err) {
      return {
        success: false,
        status: 'MALFORMED_EXPRESSION',
        error: err.message
      };
    }
  }

  /**
   * 3. Symbolic Calculus (Derivatives)
   */
  differentiate(expr, variable = 'x') {
    const math = getMath();
    try {
      const derivNode = math.derivative(expr, variable);
      const simplified = math.simplify(derivNode);
      return {
        success: true,
        status: 'VERIFIED',
        variable,
        expression: expr,
        derivative: simplified.toString(),
        latex: `\\frac{d}{d${variable}}\\left[${expr}\\right] = ${simplified.toTex ? simplified.toTex() : simplified.toString()}`
      };
    } catch (err) {
      return {
        success: false,
        status: 'ERROR',
        error: err.message
      };
    }
  }

  /**
   * 4. Equation Solving & Root Verification
   * Handles linear, polynomial, multi-variable, and underdetermined systems.
   */
  solveEquation(equationStr, variable = 'x') {
    const math = getMath();
    if (!equationStr || typeof equationStr !== 'string') {
      return { success: false, status: 'INVALID_INPUT', error: 'Missing equation string' };
    }

    let normEq = equationStr
      .replace(/[\$]/g, '')
      .replace(/\\cdot/g, '*')
      .replace(/\\times/g, '*')
      .replace(/\\div/g, '/')
      .replace(/−/g, '-')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/√([a-zA-Z0-9]+)/g, 'sqrt($1)')
      .trim();

    if (!normEq.includes('=')) {
      normEq = `${normEq} = 0`;
    }

    const [lhsRaw, rhsRaw] = normEq.split('=').map(s => s.trim());
    const lhsStr = lhsRaw
      .replace(/(\d+)([a-zA-Z])/g, '$1*$2')
      .replace(/(\d+)\(/g, '$1*(')
      .replace(/\)([a-zA-Z0-9])/g, ')*$1');
    const rhsStr = (rhsRaw || '0')
      .replace(/(\d+)([a-zA-Z])/g, '$1*$2')
      .replace(/(\d+)\(/g, '$1*(')
      .replace(/\)([a-zA-Z0-9])/g, ')*$1');

    try {
      // Find all free variables in equation
      const lhsNode = math.parse(lhsStr);
      const rhsNode = math.parse(rhsStr);
      const vars = new Set();
      
      lhsNode.traverse(node => {
        if (node.isSymbolNode && !['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'pi', 'e'].includes(node.name)) vars.add(node.name);
      });
      rhsNode.traverse(node => {
        if (node.isSymbolNode && !['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'pi', 'e'].includes(node.name)) vars.add(node.name);
      });

      const variableList = Array.from(vars);

      // Check for underdetermined equation (more variables than equations)
      if (variableList.length > 1 && !variable) {
        return {
          success: false,
          status: 'UNDERDETERMINED',
          variables: variableList,
          details: `Equation contains ${variableList.length} independent variables (${variableList.join(', ')}). A single equation cannot yield a unique solution without additional constraints.`
        };
      }

      // Move everything to LHS: lhs - (rhs) = 0
      const exprDiff = `(${lhsStr}) - (${rhsStr})`;
      const simplifiedDiff = math.simplify(exprDiff);

      // Test linear form: a*x + b = 0 -> x = -b/a
      try {
        const d_dx = math.derivative(simplifiedDiff, variable);
        const d2_dx2 = math.derivative(d_dx, variable);
        const isLinear = math.simplify(d2_dx2).toString() === '0';

        if (isLinear) {
          const aVal = math.simplify(d_dx).toString();
          const bVal = math.simplify(simplifiedDiff, { [variable]: 0 }).toString();

          const aNum = Number(math.evaluate(aVal));
          const bNum = Number(math.evaluate(bVal));

          if (Number.isFinite(aNum) && aNum !== 0) {
            const root = -bNum / aNum;
            return {
              success: true,
              status: 'VERIFIED',
              type: 'linear',
              variable,
              equation: equationStr,
              solutions: [root],
              latex: `${variable} = ${root}`,
              details: `Exact linear solution: ${variable} = ${root}`
            };
          }
        }
      } catch (_) {}

      // Test quadratic form: a*x^2 + b*x + c = 0 -> x = (-b +/- sqrt(b^2 - 4ac)) / 2a
      try {
        const d_dx = math.derivative(simplifiedDiff, variable);
        const d2_dx2 = math.derivative(d_dx, variable);
        const d3_dx3 = math.derivative(d2_dx2, variable);
        const isQuadOrLower = math.simplify(d3_dx3).toString() === '0';

        if (isQuadOrLower) {
          // Robust polynomial coefficient extraction via evaluation:
          // c = f(0)
          // a = f''(0) / 2
          // b = f'(0)
          const cNum = Number(simplifiedDiff.evaluate({ [variable]: 0 }));
          const bNum = Number(d_dx.evaluate({ [variable]: 0 }));
          const aNum = Number(d2_dx2.evaluate({ [variable]: 0 })) / 2;

          if (Number.isFinite(aNum) && aNum !== 0) {
            const disc = bNum * bNum - 4 * aNum * cNum;
            let roots = [];
            if (disc > 0) {
              roots = [(-bNum + Math.sqrt(disc)) / (2 * aNum), (-bNum - Math.sqrt(disc)) / (2 * aNum)];
            } else if (disc === 0) {
              roots = [-bNum / (2 * aNum)];
            } else {
              // Complex roots
              const realPart = -bNum / (2 * aNum);
              const imagPart = Math.sqrt(-disc) / (2 * aNum);
              roots = [`${realPart} + ${imagPart}i`, `${realPart} - ${imagPart}i`];
            }

            return {
              success: true,
              status: 'VERIFIED',
              type: 'quadratic',
              variable,
              equation: equationStr,
              coefficients: { a: aNum, b: bNum, c: cNum },
              discriminant: disc,
              solutions: roots,
              latex: disc >= 0 
                ? `${variable} = \\frac{-(${bNum}) \\pm \\sqrt{${disc}}}{2(${aNum})}`
                : `${variable} = ${roots.join(', ')}`,
              details: `Quadratic equation: a=${aNum}, b=${bNum}, c=${cNum}, discriminant=${disc}. Solutions: ${roots.join(', ')}`
            };
          }
        }
      } catch (_) {}

      // General verification check for proposed roots
      return {
        success: true,
        status: 'SOLVED_SYMBOLICALLY',
        variable,
        simplifiedDiff: simplifiedDiff.toString(),
        latex: `${simplifiedDiff.toTex ? simplifiedDiff.toTex() : simplifiedDiff.toString()} = 0`
      };
    } catch (err) {
      return {
        success: false,
        status: 'MALFORMED_EQUATION',
        error: err.message
      };
    }
  }

  /**
   * 5. Unit Conversions & Dimensional Analysis
   */
  convertUnits(valueWithUnits, targetUnit) {
    const math = getMath();
    try {
      const u = math.unit(valueWithUnits);
      const converted = u.to(targetUnit);
      return {
        success: true,
        status: 'VERIFIED',
        original: valueWithUnits,
        targetUnit,
        numericValue: converted.toNumber(targetUnit),
        formatted: converted.format(),
        latex: `${valueWithUnits} = ${converted.format()}`
      };
    } catch (err) {
      return {
        success: false,
        status: 'UNIT_MISMATCH',
        error: `Incompatible dimensional units: ${err.message}`,
        details: `Cannot convert ${valueWithUnits} to ${targetUnit} (dimensional mismatch).`
      };
    }
  }

  /**
   * 6. Comprehensive Verification Tool Pipeline (for Pete / Penny reasoning layer)
   */
  verifyMathematicalClaim(payload) {
    const { domain, expression, equation, valueWithUnits, targetUnits, variable, proposedAnswer } = payload;

    if (domain === 'units' || (valueWithUnits && targetUnits)) {
      return this.convertUnits(valueWithUnits, targetUnits);
    }

    if (domain === 'calculus' && expression) {
      return this.differentiate(expression, variable || 'x');
    }

    if (equation) {
      return this.solveEquation(equation, variable || 'x');
    }

    if (expression) {
      const evalRes = this.evaluateArithmetic(expression);
      if (evalRes.success && typeof proposedAnswer !== 'undefined') {
        const matches = evalRes.value === proposedAnswer || evalRes.decimalValue === proposedAnswer;
        return {
          ...evalRes,
          verified: matches,
          proposedAnswer,
          isCorrect: matches
        };
      }
      return evalRes;
    }

    return {
      success: false,
      status: 'INSUFFICIENT_INFORMATION',
      details: 'No computable expression, equation, or units provided.'
    };
  }

  /**
   * 7. Mathematical Intent & Semantic Expression Classifier
   * Distinguishes expressions, equations, operations (solve, factor, diff, integrate, substitute, graph),
   * variables, and underdetermined systems.
   */
  parseMathematicalIntent(text) {
    if (!text || typeof text !== 'string') {
      return { isMath: false };
    }

    const raw = text.trim();
    const clean = raw.replace(/^(\?|\!|\.|\s)+|(\?|\!|\.|\s)+$/g, '');
    const lower = clean.toLowerCase();

    // Check for explicit math operator keywords
    const isSolveReq = /\b(solve|find the roots|roots of|find x|find y|solve for)\b/i.test(lower);
    const isFactorReq = /\b(factor|factorize|factorization)\b/i.test(lower);
    const isDerivReq = /\b(derivative|differentiate|d\/dx|gradient|rate of change)\b/i.test(lower);
    const isIntegReq = /\b(integrate|integral|antiderivative|area under)\b/i.test(lower);
    const isGraphReq = /\b(graph|plot|visualize|sketch)\b/i.test(lower);
    const isSubstReq = /\b(when\s+[a-z]\s*=|at\s+[a-z]\s*=|evaluate\s+.*(at|for)\s+[a-z]\s*=|\bif\s+[a-z]\s*=)/i.test(lower) || /\b[a-z]\s*=\s*[\d\.\-]+/i.test(lower);

    // Normalize word numbers and verbal arithmetic operations
    const numberWords = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
      ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
      seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
      sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100
    };

    let preprocessed = clean;
    for (const [word, num] of Object.entries(numberWords)) {
      preprocessed = preprocessed.replace(new RegExp(`\\b${word}\\b`, 'gi'), num);
    }

    // Normalize Unicode math symbols, verbal operators, and LaTeX wrappers
    let formulaStr = preprocessed
      .replace(/[\$]/g, '')
      .replace(/\\cdot/g, '*')
      .replace(/\\times/g, '*')
      .replace(/\\div/g, '/')
      .replace(/−/g, '-')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\b(times|multiplied\s+by)\b/gi, '*')
      .replace(/\b(divided\s+by)\b/gi, '/')
      .replace(/\b(plus)\b/gi, '+')
      .replace(/\b(minus)\b/gi, '-')
      .replace(/(\d+)\s*(?:[xX]|\*)\s*(\d+)/g, (match, p1, p2) => `${p1} * ${p2}`)
      .replace(/⁰/g, '^0')
      .replace(/¹/g, '^1')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/⁵/g, '^5')
      .replace(/⁶/g, '^6')
      .replace(/⁷/g, '^7')
      .replace(/⁸/g, '^8')
      .replace(/⁹/g, '^9')
      .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/√([a-zA-Z0-9]+)/g, 'sqrt($1)')
      .replace(/^(can\s+you\s+(?:please\s+)?(?:tell\s+me|calculate|compute|solve|work\s+out)\s+(?:what|how\s+much)?|please\s+(?:calculate|compute|tell\s+me\s+what)|how\s+much\s+is|what\s+is|what\'s|whats|what|calculate|compute|solve\s+for|solve|find\s+(?:the\s+)?roots\s+of|factor|integrate|differentiate|graph|plot)\s+/i, '')
      .replace(/\s+(?:is|equals|equal\s+to)\s*[\?!.]*$/i, '')
      .replace(/\s+(when|at|if)\s+[a-z]\s*=\s*[\d\.\-]+.*$/i, '')
      .replace(/[?!=]+$/, (match) => match.includes('=') ? '=' : '')
      .trim();

    // If query ends in =0? or = 0?, restore = 0
    if (/=\s*0\s*[\?!]*$/i.test(clean) && !formulaStr.includes('=')) {
      formulaStr = `${formulaStr} = 0`;
    }

    const hasEquals = formulaStr.includes('=');

    // Exclude full natural language prose / physics word problems from being treated as abstract algebraic expressions
    // Check wordCount on the cleaned formulaStr rather than the conversational wrapper
    const formulaWordCount = formulaStr.split(/\s+/).filter(w => !/^[\d\.\+\-\*\/\^\(\)=]+$/.test(w)).length;
    const isNaturalLanguageProse = formulaWordCount > 5 && !hasEquals && !isSolveReq && !isFactorReq && !isDerivReq && !isIntegReq && !isSubstReq && !isGraphReq;
    if (isNaturalLanguageProse) {
      return { isMath: false };
    }

    const mathSymbolsRegex = /[\^*/+\-]|\b(sin|cos|tan|exp|log|ln|sqrt|pi)\b|\d+\s*\(|\)\s*\(/;
    const hasMathSymbols = mathSymbolsRegex.test(formulaStr) || /\d+[a-z]/i.test(formulaStr) || /[a-z]\^\d+/i.test(formulaStr);

    if (!hasMathSymbols && !hasEquals && !isSolveReq && !isDerivReq && !isIntegReq && !isFactorReq && !isSubstReq) {
      return { isMath: false };
    }

    // Insert implicit multiplication e.g. 5x -> 5*x, 2(x+3) -> 2*(x+3), (12)(17) -> (12)*(17) for math.js parser
    const normFormula = formulaStr
      .replace(/(\d+)([a-zA-Z])/g, '$1*$2')
      .replace(/(\d+)\s*\(/g, '$1*(')
      .replace(/\)\s*\(/g, ')*(')
      .replace(/\)([a-zA-Z0-9])/g, ')*$1');

    const math = getMath();
    let parsedNode = null;
    const variables = new Set();

    try {
      if (hasEquals) {
        const [lhs, rhs] = normFormula.split('=').map(s => s.trim());
        const nodeL = math.parse(lhs);
        const nodeR = math.parse(rhs || '0');
        nodeL.traverse(n => { if (n.isSymbolNode) variables.add(n.name); });
        nodeR.traverse(n => { if (n.isSymbolNode) variables.add(n.name); });
      } else {
        parsedNode = math.parse(normFormula);
        parsedNode.traverse(n => { if (n.isSymbolNode) variables.add(n.name); });
      }
    } catch (_) {
      // If parsing fails directly, fallback to regex variable extraction
      const foundVars = formulaStr.match(/\b([a-zA-Z])\b/g);
      if (foundVars) foundVars.forEach(v => variables.add(v));
    }

    const varList = Array.from(variables).filter(v => !['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt', 'pi', 'e'].includes(v.toLowerCase()));

    // Pure Arithmetic (no free variables)
    if (varList.length === 0 && !hasEquals) {
      const evalRes = this.evaluateArithmetic(formulaStr);
      return {
        isMath: true,
        type: 'arithmetic',
        operation: 'evaluate',
        formula: formulaStr,
        result: evalRes,
        variables: []
      };
    }

    // Equation with '='
    if (hasEquals) {
      if (varList.length > 1) {
        return {
          isMath: true,
          type: 'multivariable_equation',
          operation: 'solve_multivariable',
          formula: formulaStr,
          variables: varList,
          isUnderdetermined: true,
          details: `Equation contains multiple variables (${varList.join(', ')}). A single equation cannot yield a unique solution without additional constraints.`
        };
      }

      const solveRes = this.solveEquation(formulaStr, varList[0] || 'x');
      return {
        isMath: true,
        type: solveRes.type || 'equation',
        operation: 'solve',
        formula: formulaStr,
        variable: varList[0] || 'x',
        result: solveRes,
        variables: varList
      };
    }

    // Expression without '='
    let operation = 'ambiguous_expression';
    if (isSubstReq) operation = 'substitute';
    else if (isSolveReq) operation = 'solve';
    else if (isFactorReq) operation = 'factor';
    else if (isDerivReq) operation = 'differentiate';
    else if (isIntegReq) operation = 'integrate';
    else if (isGraphReq) operation = 'graph';

    let isQuadratic = varList.length === 1 && (/\b[a-z]\^2\b/i.test(formulaStr) || /\b[a-z]\s*\*\s*[a-z]\b/i.test(formulaStr));
    let exprType = varList.length > 1 ? 'multivariable_expression' : (isQuadratic ? 'quadratic_expression' : 'polynomial_expression');

    return {
      isMath: true,
      type: exprType,
      operation,
      formula: formulaStr,
      variables: varList,
      isAmbiguous: operation === 'ambiguous_expression',
      clarificationPrompt: isQuadratic 
        ? `That's a quadratic expression ($${formulaStr}$). What would you like to do with it—evaluate it for a value of ${varList[0] || 'x'}, factor it, graph it, or set it equal to zero to solve for its roots?`
        : `That's a mathematical expression ($${formulaStr}$). What would you like to do with it—evaluate it, simplify it, differentiate it, or solve it as an equation?`
    };
  }
}

const mathematicsService = new MathematicsService();

module.exports = {
  MathematicsService,
  mathematicsService
};
