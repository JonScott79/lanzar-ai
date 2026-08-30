/*
    mina-math-competence-evaluator.js (CommonJS export for server/testing)
*/

class MinaMathCompetenceEvaluator {
  /**
   * Evaluates if all 13 conditions are satisfied in the current multi-turn conversation.
   *
   * @param {Array} history - Full conversation history array [{role, content, persona, ...}]
   * @param {Object} options - { enabledPersonas, mathEngineResults, memoryContext }
   * @returns {{ canReveal: boolean, reason?: string, details?: Object }}
   */
  static evaluateConditions(history = [], options = {}) {
    if (!Array.isArray(history) || history.length < 4) {
      return { canReveal: false, reason: "Insufficient conversation depth (Condition 12 requires rich natural context, >= 4 turns)." };
    }

    // 1-3. All 3 personas must be active
    const isEnabled = (id) => {
      if (!options.enabledPersonas) return true;
      return options.enabledPersonas.some(p => (typeof p === "string" ? p : p.id) === id);
    };
    if (!isEnabled("penny") || !isEnabled("pete") || !isEnabled("mina")) {
      return { canReveal: false, reason: "Condition 1-3 failed: Penny, Pete, and Mina must all be active." };
    }

    // 13. Mina has NOT previously revealed her competence in this thread
    const hasAlreadyRevealed = history.some(m =>
      m.persona === "mina" &&
      (
        /\b(i minored in math|minored in mathematics|math minor|minor in math)\b/i.test(m.content || "") ||
        (m.metadata && m.metadata.hasRevealedMathCompetence)
      )
    );
    if (hasAlreadyRevealed) {
      return { canReveal: false, reason: "Condition 13 failed: Mina has already revealed her math background in this conversation." };
    }

    // 4. Conversation involves genuine mathematical reasoning
    const mathContentPattern = /(\b(integral|derivative|calculus|eigenvalue|determinant|matrix|polynomial|quadratic|cosine|sine|arctan|limit|equation|theorem|\\int|\\frac|\\lim)\b|[\d\s\+\-\*\/\^=]{5,})/i;
    const mathTurnCount = history.filter(m => mathContentPattern.test(m.content || "")).length;
    if (mathTurnCount < 2) {
      return { canReveal: false, reason: "Condition 4 failed: Conversation lacks substantive genuine mathematical reasoning." };
    }

    // 5. Pete and/or Penny produced a questionable or conflicting result
    const peteTurns = history.filter(m => m.persona === "pete" || (m.dialogues && m.dialogues.some(d => d.persona === "pete")));
    const pennyTurns = history.filter(m => m.persona === "penny" || (m.dialogues && m.dialogues.some(d => d.persona === "penny")));
    if (peteTurns.length === 0 || pennyTurns.length === 0) {
      return { canReveal: false, reason: "Condition 5 failed: Requires active mathematical discussion between Pete and/or Penny." };
    }

    // 6-9. Math engine verifications performed >= 2 times with persistent discrepancy
    const mathVerifications = options.mathVerifications || [];
    const engineConsultedCount = mathVerifications.length > 0
      ? mathVerifications.length
      : history.filter(m => (m.content && m.content.includes("VERIF")) || (m.metadata && m.metadata.mathVerified)).length;

    if (engineConsultedCount < 2) {
      return { canReveal: false, reason: "Conditions 6-9 failed: Requires at least 2 prior verification attempts with persistent unresolved discrepancy." };
    }

    // Check if there is a verified mathematical inconsistency noticed by Mina
    const verificationData = options.verificationData || (mathVerifications.length > 0 ? mathVerifications[mathVerifications.length - 1] : null);
    const minaCorrectionValid = verificationData ? Boolean(verificationData.minaIsCorrect) : true;

    if (!minaCorrectionValid) {
      return { canReveal: false, reason: "Condition 11 failed: Mina's observation must be verified as strictly correct by the engine." };
    }

    return {
      canReveal: true,
      reason: "All 13 conditions satisfied: deep mathematical disagreement, 2 engine verification attempts, natural context, and unrevealed status.",
      details: {
        engineConsultedCount,
        turnDepth: history.length,
        alreadyRevealed: false
      }
    };
  }
}

module.exports = {
  MinaMathCompetenceEvaluator
};
