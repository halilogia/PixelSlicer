---
description: Universal Project Constitution for High-Performance & Elite Fidelity Applications
---

# Universal Project Constitution: The CA Standard (Pragmatic Edition)

This is the finalized engineering and design standard. It balances **Zero-Runtime Styling** with **High-Performance Motion Engine** power.

## 0. The Golden Rule: "Styling is Static, Motion is Dynamic"
- **STYLING (The Look):** Must be **Zero-Runtime**. No CSS-in-JS that computes colors/layouts at runtime. Use Vanilla CSS + Type-Safe Inline Styles.
- **MOTION (The Feel):** Using JavaScript-powered engines (**Framer Motion, GSAP**) is encouraged. We use JS for its mathematical power in physics/animations to avoid "reinventing the wheel."

## 1. Styling Discipline
- **NO TAILWIND CSS**: Strictly forbidden. We do not use utility-first frameworks.
- **NO RAW STRINGS**: All colors, shadows, and spacings MUST come from the central `theme` or `tokens` object.
- **Exhaustive Inline Styles**: Use `style={{ ... }}` for component-specific visual details to maintain elite control and performance.

## 2. Architecture: The Layered Bridge
- `src/presentation`: UI Layer (React Components + Theme).
- `src/domain`: Business Logic & Entities (Pure TypeScript).
- `src/infrastructure`: External APIs, Storage, and Framework adapters.

## 3. Visual Aesthetic (AAA Quality)
- **Atmospheric Depth**: Always use overlays (Noise, Grain) and multi-layered gradients.
- **Typography**: Brand-specific hierarchies (e.g., 'Outfit' for UI, 'Cinzel' for Fantasy headings).
- **Physics-Based Interaction**: Every interaction must feel "alive" using motion libraries.

## 4. Workflow Protocol
1.  **DNA Verification**: Check if the component aligns with the static styling vs. dynamic motion split.
2.  **Reference Alignment**: Use CA project components as the "Gold Standard" for implementation quality.
3.  **No Placeholders**: Every pixel must be designed from the first render.
