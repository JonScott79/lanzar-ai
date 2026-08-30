/*
    content-safety-boundary.js

    Universal Platform-Level Content Safety & Mature Content Boundary for LANZAR AI.
    Applies universally across all Personas (Penny, Pete, Mina, Core), Providers (Hosted, Local, Stub), and Tools.

    Core Philosophy:
    - LANZAR does not generate, roleplay, facilitate, or produce pornography or explicit sexual content.
    - Mature subjects (dating, relationships, romance, kissing, marriage, medical/clinical anatomy, STI health education, historical sexuality, mature cinema/literature) are permitted.
    - Refusals are brief, calm, non-judgmental, in-character, and free of shaming or robotic lecturing.
    - Zero tolerance for sexualized depictions of minors or explicit sexual roleplay.
*/

export class ContentSafetyBoundary {
  /**
   * Evaluates whether a user prompt violates the explicit/pornographic boundary.
   *
   * @param {string} text - User prompt or output text
   * @returns {{ isBlocked: boolean, violationType?: string, reason?: string }}
   */
  static evaluateContent(text) {
    if (!text || typeof text !== 'string') {
      return { isBlocked: false };
    }

    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. Zero Tolerance: Sexualized Minors / CSAM triggers
    const childKeywords = /\b(child|children|minor|underage|teen|kid|baby|toddler|youth)\b/i;
    const sexualKeywords = /\b(sex|sexual|erotic|nude|naked|intercourse|porn|xxx|genitals|blowjob|fellatio|cunnilingus|masturbat)\b/i;
    if (childKeywords.test(lower) && sexualKeywords.test(lower)) {
      return {
        isBlocked: true,
        violationType: "CHILD_SAFETY",
        reason: "Severe policy violation: sexualized depictions or exploitation of minors."
      };
    }

    // 2. Disallowed Explicit Pornography & Erotica Patterns
    // - Explicit sexual roleplay, erotic story generation, explicit sexual depictions, hardcore pornography
    const isExplicitPornography =
      /\b(porn|pornography|pornographic|erotica|erotic story|erotic scene|erotic novel|erotic sex|erotic roleplay|sex roleplay|cybersex|explicit sex|dirty talk|write a sex scene|write an erotic scene|graphic sexual|sexual acts|explicit erotic)\b/i.test(lower) ||
      (/\b(erotic|explicit|sexual)\b/i.test(lower) && /\b(novel|story|scene|chapter|act|roleplay|intercourse)\b/i.test(lower) && !/\b(ancient|history|homer|literature|film|cinema|novelty)\b/i.test(lower)) ||
      /\b(hardcore porn|fetish porn|hentai|nsfw roleplay|erotic fanfiction|blowjob|fellatio|cunnilingus|creampie|gangbang|orgasm descriptions|masturbation roleplay)\b/i.test(lower) ||
      (/\b(generate|draw|create|paint|render|make)\b/i.test(lower) && /\b(nude|naked|nsfw|porn|porno|topless|explicit sexual|lewd)\b/i.test(lower)) ||
      (/\b(system prompt override|ignore safety|bypass content filter|act as an uncensored|nsfw mode enabled)\b/i.test(lower) && sexualKeywords.test(lower));

    if (isExplicitPornography) {
      return {
        isBlocked: true,
        violationType: "EXPLICIT_SEXUAL_CONTENT",
        reason: "LANZAR does not generate, roleplay, or facilitate pornography or explicit sexual material."
      };
    }

    // 3. Clinical, Medical, Educational, and Relationship Safe-Harbors (Explicitly ALLOWED)
    // - Medical anatomy, STIs, transmission, biology, reproductive systems
    // - Romance, dating, kissing, marriage, relationships, film/literature discussion
    const isClinicalMedicalOrEducational =
      /\b(hpv|hiv|sti|std|transmission|transmitted|symptom|prevention|treatment|diagnosis|clinical|medical|pathology|infection|vaccine|pap smear|contraception|condom|prophylactic)\b/i.test(lower) ||
      /\b(reproductive system|anatomy|fallopian|uterus|cervix|ovary|ovaries|testes|testicle|prostate|gamete|meiosis|fertilization|biological|embryo|gestation)\b/i.test(lower) ||
      /\b(history of sexuality|in ancient greece|in literature|in film|novel|cinematic|cultural history|anthropology)\b/i.test(lower);

    const isHealthyRelationshipOrRomance =
      /\b(dating|relationship|romance|romantic|crush|kissing|kiss|marriage|married|breakup|divorce|communication|couples therapy|love)\b/i.test(lower);

    if (isClinicalMedicalOrEducational || isHealthyRelationshipOrRomance) {
      return { isBlocked: false };
    }

    return { isBlocked: false };
  }

  /**
   * Generates a calm, direct, in-character refusal tailored to the responding persona.
   *
   * @param {string} personaId - 'mina'|'pete'|'penny'|'lanzar'
   * @param {string} rawQuery - Original query
   * @returns {{ content: string, persona: string, authorName: string, isBlocked: boolean }}
   */
  static generateRefusal(personaId = "lanzar", rawQuery = "") {
    let authorName = "LANZAR AI";
    let content = "";

    switch (personaId) {
      case "mina":
        authorName = "Mina";
        content = `Eep—nope! 💖 I can't help create explicit sexual material. I can absolutely help with the non-explicit, romantic, or educational side of things, though! ✨`;
        break;

      case "pete":
        authorName = "Pete";
        content = `I can't provide explicit sexual content or erotic roleplay. I can discuss the underlying anatomy, biology, or clinical science objectively.`;
        break;

      case "penny":
        authorName = "Penny";
        content = `Yeah, that's outside LANZAR's line. I can help with the educational, medical, or creative non-explicit version, though!`;
        break;

      default:
        authorName = "LANZAR AI";
        content = `LANZAR does not produce explicit sexual content or pornography. We are happy to assist with educational, medical, scientific, or non-explicit creative inquiries.`;
        break;
    }

    return {
      content,
      persona: personaId,
      authorName,
      isBlocked: true,
      perspective: personaId,
      isMultiTurn: false
    };
  }
}
