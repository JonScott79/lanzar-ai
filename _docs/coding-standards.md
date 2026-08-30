# LANZAR Coding Standards

Version: 1.0  
Maintained By: LANZAR  
Last Updated: August 2026

---

# Philosophy

LANZAR projects are built for long-term maintainability.

Every project should be understandable months or years later by someone who has never seen the code before.

Priorities:

1. Readability
2. Maintainability
3. Accessibility
4. Performance
5. Security
6. Scalability

Code should communicate intent.

Optimize for humans first.

---

# Project Structure

A typical LANZAR website should follow this layout.

```
Project/
│
├── assets/
│   ├── icons/
│   ├── images/
│   ├── logos/
│   └── fonts/
│
├── components/
│
├── css/
│   ├── reset.css
│   ├── theme.css
│   ├── layout.css
│   ├── components.css
│   ├── utilities.css
│   └── style.css
│
├── docs/
│
├── js/
│   ├── analytics.js
│   ├── components.js
│   ├── version.js
│   └── page-specific files
│
├── research/
│
├── CHANGELOG.md
├── README.md
├── humans.txt
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── index.html
```

Projects should remain shallow.

Avoid unnecessary nesting.

---

# File Headers

Every source file begins with a descriptive header.

Example:

```javascript
/*
    analytics.js

    Centralized analytics implementation.

    Responsibilities

    - Google Analytics
    - Microsoft Clarity
    - Event routing
    - Privacy filtering
*/
```

---

# Section Headers

Use banner comments consistently.

```javascript
// =====================================
// Initialization
// =====================================

// =====================================
// Event Registration
// =====================================

// =====================================
// Public Methods
// =====================================

// =====================================
// Private Methods
// =====================================
```

HTML should use:

```html
<!-- =====================================
     Metadata / SEO
===================================== -->

<!-- =====================================
     Main Content
===================================== -->

<!-- =====================================
     Scripts
===================================== -->
```

---

# HTML Standards

Use semantic HTML whenever possible.

Prefer:

- header
- nav
- main
- section
- article
- aside
- footer

Avoid unnecessary div nesting.

Heading order must remain logical.

Never skip heading levels.

Forms require labels.

Placeholder text is never a replacement for labels.

---

# CSS Standards

Separate files by responsibility.

Use CSS variables.

Avoid inline styles.

Group related selectors.

Keep specificity low.

Avoid !important unless absolutely necessary.

Maintain responsive layouts.

Prefer Flexbox or Grid.

---

# JavaScript Standards

One responsibility per file.

Avoid global variables.

Prefer modular design.

Prefer early returns.

Avoid deeply nested conditionals.

Meaningful function names are required.

---

# Naming Conventions

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Constants

UPPER_CASE

CSS Classes

kebab-case

IDs

camelCase

---

# Accessibility

Accessibility is mandatory.

Every project must:

- Support keyboard navigation
- Maintain logical heading structure
- Include proper labels
- Preserve visible focus
- Meet WCAG AA contrast
- Use semantic HTML
- Include ARIA only when necessary

Run:

- WAVE
- Lighthouse

before release.

---

# SEO

Every page should include:

- Title
- Description
- Canonical URL
- Robots
- Open Graph
- Twitter Card
- JSON-LD
- Favicon
- Manifest
- Theme Color

Maintain sitemap.xml.

Maintain robots.txt.

---

# Analytics Standard

Every LANZAR project shall include a centralized `analytics.js` module.

Application code must never communicate directly with analytics vendors.

All analytics pass through the LANZAR Analytics API.

Example:

```javascript
Analytics.track(
    "Prediction",
    "Completed",
    {
        model: selectedModel
    }
);
```

Never:

```javascript
gtag(...)

clarity(...)
```

inside application code.

---

## Analytics Responsibilities

analytics.js manages:

- Google Analytics
- Microsoft Clarity
- Future analytics providers
- Performance timing
- Error reporting
- Privacy filtering
- Event routing

---

## Standard Event Categories

Use consistent categories.

Examples:

- Navigation
- Interaction
- Search
- Prediction
- Research
- Downloads
- Errors
- Performance
- Conversion

Avoid generic names like:

- click
- button
- event

---

## Privacy

Analytics must never transmit:

- Passwords
- API Keys
- Tokens
- Personal Information
- Chemical Names
- SMILES
- Sensitive Research Data

Collect interaction metadata only.

---

## Performance

Analytics must:

Load asynchronously.

Avoid duplicate listeners.

Avoid duplicate scripts.

Gracefully fail.

Never interrupt application functionality.

---

# Comments

Comment WHY.

Not WHAT.

Bad

```javascript
i++;
```

Good

```javascript
// Skip placeholder publication entries.
i++;
```

---

# Error Handling

Handle failures gracefully.

Never expose stack traces to users.

Provide useful console messages.

Log recoverable errors.

---

# Git Standards

Commit frequently.

Use meaningful messages.

Examples:

```
feat:
fix:
docs:
style:
refactor:
perf:
test:
build:
release:
chore:
```

---

# Changelog

Every release updates:

CHANGELOG.md

Follow semantic versioning.

Major

Minor

Patch

Document:

Added

Changed

Removed

Fixed

---

# AI Collaboration

AI should assist developers—not replace engineering judgment.

AI-generated code must:

- Preserve project architecture.
- Preserve formatting.
- Preserve comments.
- Preserve coding style.
- Explain changes.
- Minimize file diffs.
- Avoid unnecessary rewrites.

Never:

- Rename IDs without reason.
- Reformat entire files.
- Remove code unless confirmed unused.
- Introduce unnecessary dependencies.

---

# Release Checklist

Before every release:

✓ HTML validated

✓ Lighthouse

✓ WAVE

✓ Responsive testing

✓ Broken link testing

✓ Analytics verified

✓ SEO verified

✓ robots.txt updated

✓ sitemap.xml updated

✓ CHANGELOG updated

✓ Version updated

✓ Git tag created

---

## 14. LANZAR Multi-Mind Conversational Architecture

LANZAR operates as an autonomous Multi-Mind conversational environment rather than a single-winner router.

### Core Principles
1. **Dynamic Participant Cardinality**:
   - A single turn can legitimately engage 1, 2, or 3 participating minds based on query complexity and domain affinity.
   - Evaluated through `CognitiveRouter.evaluatePersonaParticipation(query, history, options)`.
2. **Explicit Address Override**:
   - Explicit user addressing (`"Pete..."`, `"Mina and Penny..."`) selects the exact participant set requested.
3. **Conversational Flow & Cross-Mind Context**:
   - Persona turns carry conversational history and cross-character context forward (`"Uh-oh Pete, how did you like that joke?"`).
   - Characters react to each other with in-character commentary without restarting or resetting introductions.
4. **Natural Social Conversations**:
   - Greetings, daily check-ins, and casual banter engage all active minds with genuine in-character conversation rather than canned templates or unsolicited task specs.

---

# LANZAR Multilingual Architecture

1. **Multilingual by Design**: Anyone, anywhere in the world should be able to use LANZAR.
2. **Language ≠ Personality**: Language capability lives in the model/pipeline layer. Character identity lives in the personality/portfolio layer. Penny, Pete, and Mina retain their unique voices, temperaments, and relationships across all supported languages.
3. **No Intermediate Pivot Translation**: The pipeline feeds the user's native language directly to the inference model without translating back and forth to English, preserving cultural nuance and tone.
4. **Language-Agnostic Memory & Routing**: Cognitive routing and long-term memory are language-agnostic and persist across mixed-language dialogues.
5. **Direct Translation on Demand**: Characters can translate text directly when requested while preserving the speaker's original voice.

---

# LANZAR Principle

Every line of code should leave the project easier to understand than before it was written.

Clean architecture outlives clever code.