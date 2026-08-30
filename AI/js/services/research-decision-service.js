/*
    research-decision-service.js (Client / ESM Version)

    Client-side Research Decision & Information Requirement Layer for LANZAR AI.
*/

export class ResearchDecisionService {
  constructor() {
    this.sourceHierarchy = [
      { tier: 1, type: "PRIMARY_SOURCE", description: "Direct author, original data, official announcements" },
      { tier: 2, type: "GOV_ACADEMIC", description: "Government statistics, peer-reviewed scientific papers, universities" },
      { tier: 3, type: "OFFICIAL_DOCS", description: "Manufacturer specifications, software API documentation, vendor manuals" },
      { tier: 4, type: "REPUTABLE_JOURNALISM", description: "Major investigative and technical reporting outlets" },
      { tier: 5, type: "SECONDARY_REFERENCE", description: "Encyclopedias, verified aggregators, reference manuals" }
    ];
  }

  /**
   * Evaluates whether a user query requires external/current web research.
   */
  static evaluateInformationRequirement(userText, history = []) {
    if (!userText || typeof userText !== "string") {
      return {
        requiresResearch: false,
        provenance: "UNCERTAIN",
        category: "empty",
        reason: "Empty query"
      };
    }

    const query = userText.toLowerCase().trim();

    // -------------------------------------------------------------
    // 1. DETERMINISTIC CHECK (Math, Physics, Statistics, Algebra)
    // -------------------------------------------------------------
    const isMathConstant = /\b(value of pi|pi is|formula for kinetic energy|gravitational constant|speed of light in a vacuum|golden ratio|euler's number)\b/i.test(query) ||
      /\b(is 2\s*\+\s*2\s*still\s*4|what is 2\s*\+\s*2)\b/i.test(query);

    const isPureMath = isMathConstant ||
      /[0-9]+[a-z]?\s*[\+\-\*\/=]\s*[0-9]+/.test(query) ||
      /\b(\d+(?:\.\d+)?%\s+off|\d+\s*percent\s+of|\d+%\s+of)\b/i.test(query) ||
      /\b(square root of|cube root of|sqrt\()\b/i.test(query) ||
      query.includes("solve for x") || query.includes("x^2") || query.includes("derivative of") ||
      query.includes("integrate") || query.includes("quadratic") || query.includes("expected travel time");
    
    const isPhysicsCalculation = (query.includes("rocket sled") || query.includes("thrust of") || query.includes("free fall") || query.includes("kinetic energy") || query.includes("orbital velocity and orbital period") || query.includes("speed of light in")) &&
      !query.includes("current altitude of") && !query.includes("today") && !query.includes("latest");

    if (isPureMath || isPhysicsCalculation) {
      return {
        requiresResearch: false,
        provenance: "DETERMINISTIC",
        category: "deterministic_calculation",
        reason: "Deterministic computation handled authoritatively by Pythos / MathematicsService / PhysicsService."
      };
    }

    // -------------------------------------------------------------
    // 2. FACT-CHECKING USER CLAIMS ("Did Apple announce...", "I heard X, is that true?")
    // -------------------------------------------------------------
    const isFactCheckRequest = /^(i heard|is it true that|did|can you verify|fact check|is it true)\b/i.test(query) ||
      query.includes("is that true") || query.includes("is this accurate") || query.includes("was it announced");

    if (isFactCheckRequest) {
      return {
        requiresResearch: true,
        provenance: "VERIFIED_EXTERNAL",
        category: "claim_verification",
        reason: "User explicitly requested factual verification of an external claim.",
        searchRecommendedQuery: this._extractSearchCore(query)
      };
    }

    // -------------------------------------------------------------
    // 2b. FICTIONAL / MYTHOLOGICAL ENTITIES CHECK
    // -------------------------------------------------------------
    const isMythologicalOrFictional = /\b(atlantis|el dorado|gondor|mordor|hogwarts|narnia|krypton|wakanda|fictional)\b/i.test(query);
    if (isMythologicalOrFictional) {
      return {
        requiresResearch: false,
        provenance: "MODEL_KNOWLEDGE",
        category: "fictional_or_mythological",
        reason: "Entity is mythological, fictional, or literary; resolvable via internal cultural/literary knowledge."
      };
    }

    // 3. User-Supplied Constraints
    const isUserSpecifiedScenario = (query.includes("route a is") && query.includes("route b is")) ||
      (query.includes("assume") && (query.includes("given that") || query.includes("calculate") || /\d+/.test(query))) ||
      (query.includes("suppose") && /\d+/.test(query)) ||
      (query.includes("using an altitude of") || query.includes("using a mass of") || query.includes("given an altitude of"));
    
    if (isUserSpecifiedScenario) {
      return {
        requiresResearch: false,
        provenance: "USER_PROVIDED",
        category: "user_constrained_problem",
        reason: "User supplied complete problem parameters and constraints."
      };
    }

    // 4. Conversational / Opinion / Brainstorming
    const isSubjectiveOrCreative = query.includes("what do you think") || query.includes("give me 5 ideas") ||
      query.includes("brainstorm") || query.includes("write a poem") || query.includes("color palette") ||
      query.includes("crazy idea") || query.includes("design layout") || query.includes("tell me a joke") ||
      query.includes("think that is expensive") || query.includes("think that's expensive") || query.includes("is that expensive") ||
      /^(hi|hello|hey|what's up|how are you|i'm bored)\b/i.test(query);

    if (isSubjectiveOrCreative && !this._hasCurrentTemporalAnchor(query)) {
      return {
        requiresResearch: false,
        provenance: "OPINION_JUDGMENT",
        category: "creative_or_conversational",
        reason: "Subjective analysis, creative brainstorming, or conversational exchange."
      };
    }

    // 5. Hybrid Research + Deterministic
    if (query.includes("current") && (query.includes("altitude") || query.includes("iss") || query.includes("orbit")) && (query.includes("orbital velocity") || query.includes("velocity") || query.includes("calculate"))) {
      return {
        requiresResearch: true,
        provenance: "VERIFIED_EXTERNAL_PLUS_DETERMINISTIC",
        category: "hybrid_research_and_calculation",
        reason: "Requires external research for live empirical parameter, followed by deterministic physics calculation.",
        searchRecommendedQuery: "current ISS orbital altitude kilometers"
      };
    }

    // 6. Historical Boundary Override (Past years, e.g. "in 2015", "in 2010", "in 1969")
    const pastYearMatch = query.match(/\b(in|during|back in|as of)\s+(19\d{2}|200\d|201\d|202[0-3])\b/i);
    const hasLiveComparison = query.includes("compare to current") || query.includes("compare to the current") || query.includes("current lts") || query.includes("current release") || query.includes("today");
    if (pastYearMatch && !hasLiveComparison && !query.includes("2026") && !query.includes("today") && !query.includes("right now")) {
      return {
        requiresResearch: false,
        provenance: "MODEL_KNOWLEDGE",
        category: "historical_fact",
        reason: `Query is explicitly bounded by past historical year (${pastYearMatch[2]}); resolvable via model knowledge.`
      };
    }

    // 7. Current Events / Live External Data
    if (this._hasCurrentTemporalAnchor(query) || this._isDynamicExternalDomain(query)) {
      return {
        requiresResearch: true,
        provenance: "VERIFIED_EXTERNAL",
        category: "current_external_information",
        reason: "Requires current, time-sensitive, or external empirical factual verification.",
        searchRecommendedQuery: this._extractSearchCore(query)
      };
    }

    // 8. General Model Knowledge
    return {
      requiresResearch: false,
      provenance: "MODEL_KNOWLEDGE",
      category: "established_general_knowledge",
      reason: "Established scientific, historical, or domain concepts resolvable via verified internal knowledge."
    };
  }

  static _hasCurrentTemporalAnchor(query) {
    const temporalPatterns = [
      "latest", "current", "currently", "today", "tonight", "yesterday", "right now", "as of", "recent",
      "recently", "this year", "this week", "this season", "last night", "last game", "latest game",
      "next game", "most recent", "final score", "score of", "game score", "what happened in",
      "2026", "newest", "price of", "cost of", "who is the current", "who won", "who lost",
      "who is the ceo", "who is the president", "current prime minister", "weather in", "weather right now",
      "weather today", "stock price", "release date", "current version", "latest version", "current regulations",
      "look this up", "look up", "search the web", "search for", "find out",
      "actual", "actualmente", "hoy", "これらの日", "現在の", "今日", "these days"
    ];
    return temporalPatterns.some(p => query.includes(p));
  }

  static _isDynamicExternalDomain(query) {
    const dynamicKeywords = [
      "ceo of", "president of", "prime minister of", "stock price", "market cap",
      "weather in", "weather right now", "sports score", "who won the game", "last red sox game",
      "red sox", "yankees", "celtics", "patriots", "bruins", "game score", "score of the",
      "latest research paper on", "best current laptop for", "best model rocket kit to buy", "current pricing",
      "is api deprecated", "documentation for version", "who leads", "who runs", "'s ceo",
      "gaffer at", "leader of", "who's the boss", "velocidad orbital actual", "issの高度", "iss orbital",
      "pokemon go raid", "pokemon go event", "pokemon go community day", "pokemon go hotspot",
      "best place near me to play pokemon go", "current raid boss", "current box office"
    ];
    return dynamicKeywords.some(k => query.includes(k)) || /\b([a-z0-9\s]+'s\s+ceo|who\s+(leads|runs)\s+[a-z0-9]+|gaffer\s+at\s+[a-z0-9]+)\b/i.test(query);
  }

  static _extractSearchCore(query) {
    return query
      .replace(/^(can you please|please|tell me|find out|search for|what is the|who is the|i heard that|is it true that)\s+/i, '')
      .replace(/[\?\.\!]+$/, '')
      .trim();
  }
}
