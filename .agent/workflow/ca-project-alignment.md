---
description: The Master Constitution (LinguaLearn Architecture + CA Visual Performance)
---

# The Master Constitution: Aetheria - Card Wars Standard

This is the ultimate engineering and design law for the project. It merges the **LinguaLearn Evolved MVVM Architecture** with the **CA (Pragmatic Edition) Visual Performance Engine**.

## 0. The Golden Rule: "Styling is Static, Motion is Dynamic"
- **STYLING (The Look):** Must be **Zero-Runtime**. No CSS-in-JS that computes colors/layouts at runtime. Use Vanilla CSS + Type-Safe Inline Styles.
- **MOTION (The Feel):** JS-powered engines (**Framer Motion, GSAP**) are mandatory for physics/animations to achieve AAA-grade interactivity.
- **PERFORMANCE:** 0ms styling delay. Maximum fluidity.

## 🎨 1. Styling & Aesthetic Discipline (AAA Standard)
- **NO TAILWIND CSS**: Strictly forbidden. Use Vanilla CSS + Type-Safe Inline Styles.
- **NO RAW STRINGS**: All visual constants must come from `@ui/core/themes/tokens.ts`.
- **SOVEREIGN UI TRANSITION**: Any existing Tailwind must be auto-removed and converted to Vanilla/Inline styles on touch.
### 3.1 Cross-Platform Responsiveness (Web-Mobile-Tablet)
- **OMNI-DEVICE SYNC**: Every UI must be built to perfectly adapt to Web, Mobile, and Tablet browsers automatically.
- **FLUID LAYOUTS**: Use relative units (`vw`, `vh`, `%`) and CSS `clamp()` instead of fixed `px` values.
- **DYNAMIC VIEWPORT**: Layouts must be tested at 320px (Mobile), 768px (Tablet), and 1440px+ (Desktop) to ensure zero horizontal scrolling and perfect content fitting.

## 🏗️ 2. Layer Sorumlulukları (MVVM Bridge)
1. **View (widgets/)**: Pure visualization. Only listens to ViewModel. No heavy `useEffect`.
2. **ViewModel (view_models/)**: The "Brain". Connects UI to Domain/Data. Returns only state/actions.
3. **Domain Logic**: Pure TypeScript functions. Completely isolated from UI/Framework.
4. **Data/Infrastructure**: External adapters and data source management.

## 🧭 3. Workflow Protocol & AI Context
- **REFERENCE OVER INSTINCT**: Never fall back to default LLM behaviors (e.g., using Tailwind by habit). If a reference project (CA) is provided, its standards are the ONLY source of truth.
- **STRICT MANDATE**: Do **ONLY** what is explicitly asked. No unsolicited "improvements".
- **CO-LOCATION**: Keep component logic and its styles in the same file to maximize AI context.
- **REGION BLOCKS**: Use `#region [TITLE]` and `#endregion` to organize files for better navigation.
- **DNA VERIFICATION**: Every new component must be checked against the "Static Styling vs. Dynamic Motion" rule.

// turbo-all
