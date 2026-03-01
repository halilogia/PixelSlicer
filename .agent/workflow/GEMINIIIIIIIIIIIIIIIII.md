---
description: Universal Project Constitution for High-Performance & Elite Fidelity Applications
---

# Universal Project Constitution: The CA Standard

This document defines the mandatory engineering and design standards for high-performance, premium web applications. It is based on the "CA-Project" philosophy: zero-runtime overhead, compile-time safety, and elite visual fidelity.

## 0. Core Philosophy: Zero-Runtime & Performance
- **ZERO RUNTIME OVERHEAD**: Avoid CSS-in-JS libraries that compute styles at runtime (e.g., styled-components, Emotion).
- **Styling Bridge**: Static identity is handled via Native CSS; dynamic/interactive state is handled via Type-Safe Inline Style Objects.
- **Maximum Performance**: Ensure 0ms styling delay. Layout shifts and runtime re-paints must be minimized.

## 1. Styling & Interaction Discipline
- **NO UTILITY CSS**: Tailwind, Bootstrap, or any utility-first frameworks are forbidden. We use structural Vanilla CSS.
- **MOTION LIBRARIES ALLOWED**: Interaction-heavy libraries (Framer Motion, GSAP, Lenis) are encouraged for high-end UX, provided they don't impact runtime styling architecture.
- **Exhaustive Inline Styles**: For dynamic components, use detailed `style={{ ... }}` objects to maintain full control over the render loop.

## 1.1 Type-Safe Design Tokens (The Theme Law)
- **NO RAW STRINGS**: Design constants (colors, spacing, shadows) must NOT be hardcoded as strings in components.
- **The Token Bridge**: All visual values must be retrieved from a central, type-safe `theme` or `tokens` object.
- **Compile-Time Safety**: Changing a token in the central definition must trigger a global update or a build error if mismatched.

## 2. Universal Architecture (Structure)
Projects must adhere to a Layered / Feature-Sliced hybrid:
- `src/presentation`: UI Layer (Pages, Components, Hooks).
- `src/domain`: Core Logic (Entities, Types, Theme Tokens, Rules).
- `src/infrastructure`: External World (APIs, LocalStorage, Services).
- `src/assets`: Static resources (Images, Global Styles, Fonts).

## 3. Visual Aesthetic Guidelines (Premium Polish)
Regardless of the theme (Fantasy, Sci-Fi, SaaS, etc.), the "AAA" polish is mandatory:
- **High-Fidelity Interaction**: Smooth, transition-heavy interfaces with physics-based motion.
- **Atmospheric Depth**: Use of overlays (grain, vignettes, gradients) to add professional texture.
- **Typography Discipline**: Strict use of brand-specific font hierarchies with carefully tuned letter-spacing and weights.

## 4. Workflow Protocol
1.  **DNA Teyidi**: Every new session must start by verifying the presence of these standards and the project's specific Design Tokens.
2.  **Referans Alignment**: Always use established components as blueprints for new ones to maintain aesthetic consistency.
3.  **No Placeholders**: Never use generic colors or simple boxes. Every element must be "designed" from the first render.
