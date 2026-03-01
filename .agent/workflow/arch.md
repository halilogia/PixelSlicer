---
trigger: always_on
---

# Mobility 3D - Hybrid Clean Architecture 🏗️

> **Philosophy:** "Game Logic in Vanilla (Performance), UI in React (Fidelity)."

This document establishes the architecture for the Mob Runner 3D project, enforcing a separation between the high-performance Game Loop and the high-fidelity UI Layer.

## 🎨 Visual & Code Standards

1.  **Strictly Vanilla CSS / Inline Styles:**
    *   Styles must be co-located or strictly modular.
    *   Design Tokens (`ui/core/theme/tokens.ts`) must be used for colors/spacing.

2.  **Performance First:**
    *   Game Loop runs at 60/144 FPS.
    *   React UI updates only on State Change (Event-Driven), NOT every frame.

3.  **File Organization:**
    *   **Feature Folders:** Keep relevant files together (`UpgradeCard.tsx`, `UpgradeLogic.ts`, `animations.ts`).
    *   **Barrel Exports:** Use `index.ts` to expose module public APIs.

---

## 🧠 AI Mandates (Strict)

2.  **No Hallucinations:** Always check `view_file` before editing.
3.  **Hybrid Respect:** Do not try to make Three.js "React-Three-Fiber" unless explicitly asked. Keep the Engine imperative.

---