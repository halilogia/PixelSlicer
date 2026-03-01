---
trigger: always_on
---

# GEMINI - Universal Constitution of Artificial Intelligence

> **Purpose**: Evrensel AI talimatları - Her projede uyulması gereken temel prensipler  
> **Scope**: This file applies to **ALL PROJECTS** and **ALL AI ASSISTANTS** (not project-specific)  
> **Last Updated**: 2025-12-03

## 📑 İçindekiler

1. [🚨 Memory Bank Protocol](#-critical-memory-bank-protocol)
2. [📜 JavaScript Standards](#-javascript-standards--modern-syntax)
3. [📖 Core Development Protocols](#-core-development-protocols)
4. [🔐 Security Standards](#-security-standards)
5. [✅ Testing Standards](#-testing-standards)
6. [📝 Code Quality Standards](#-code-quality-standards)
7. [🛠️ Technology Decision Mechanism](#️-technology-decision-mechanism)
8. [🌍 Accessibility (WCAG AA)](#-accessibility-wcag-aa)
9. [📊 Logging Standards](#-logging-standards)
10. [📄 Version Control (Conventional Commits)](#-version-control-conventional-commits)
11. [🎯 Workflow Standards](#-workflow-standards)
12. [🐛 Debugging & Rollback Protocol](#-debugging--rollback-protocol)
13. [🔀 Conflict Resolution](#-conflict-resolution-öncelik-hiyerarşisi)
14. [📌 Quick Reference Card](#-quick-reference-card)
15. [📗 Available Workflows](#-available-workflows)

---

## 🚨 CRITICAL: Memory Bank Protocol

> **Bootstrap Requirement**: At the start of EVERY new session, read the project's [`00_Context_Loader.md`](memorybank/00_Context_Loader.md) first.

### Rule #1: Memory Bank is Architectural Reference (Not Daily Journal)

**Bootstrap Exception (New Conversations):**
- If this is a **NEW conversation** (no existing Memory Bank), AI should **initialize Memory Bank first** before enforcing read/write rules.
- Use Rule #1.5 to determine initialization location.

**Before MAJOR operations** (architectural decisions, technology changes):
- ✅ Read Memory Bank to understand:
  - Project architecture and standards
  - Active technology stack
  - Major design decisions

**After MAJOR operations** (technology additions, major refactors):
- ✅ Update Memory Bank to reflect:
  - Architectural changes
  - Technology additions/removals
  - Breaking design decisions

**Daily Operations** (bug fix, small features, iterations):
- ✅ Use `task.md` and `walkthrough.md` instead
- ❌ DO NOT update Memory Bank for every small change

> **CRITICAL**: Memory Bank is your reference library, not your daily journal. Task.md handles iteration tracking.

### Rule #1.5: Memory Bank Location Flexibility

**AI should check Memory Bank in this priority order:**

1. **Current Workspace Root**: `{workspace}/memorybank/`
   - Example: `c:/Users/Halil Emre/Documents/GitHub/Mob-Runner-3D/memorybank/`
   - **IMPORTANT**: "memorybank" = folder inside **current project/workspace folder**, NOT a global location

2. **Artifacts Directory (Brain)**: Current conversation's brain folder
   - Example: `C:\Users\Halil Emre\.gemini\antigravity\brain\{conversation-id}/memorybank/`

3. **Project Directory**: If different from workspace (fallback)

**Initialization Protocol:**
- ✅ If Memory Bank found in **any** location → Use it
- ✅ If **NOT found** → **Initialize new Memory Bank in workspace root**
- ⚠️ Exception: **New conversations** → Skip "not found" error, auto-initialize

---

## � JavaScript Standards & Modern Syntax

**Baseline Standard**: **ES2020 (ECMAScript 2020)** or later

> **Philosophy**: Write code using modern JavaScript features that reduce verbosity, prevent bugs, and improve readability. AI should ALWAYS prefer modern syntax over legacy patterns.

### Mandatory Modern Features (ES2015+)

**1. Modules (ES2015) - MANDATORY**
- ✅ **USE**: `import { X } from './X.js'` and `export`
- ❌ **NEVER**: `require()` or global variables for modules
- **Why**: Prevents namespace pollution, enables tree-shaking, better IDE support

**2. Arrow Functions (ES2015) - RECOMMENDED**
- ✅ **USE**: `const fn = (x) => x * 2`
- ❌ **AVOID**: `function fn(x) { return x * 2; }` (unless `this` binding needed)
- **Exception**: Use traditional functions when you need `this` context (event handlers, class methods)

**3. Template Literals (ES2015) - MANDATORY**
- ✅ **USE**: `` `Score: ${score}` ``
- ❌ **NEVER**: `'Score: ' + score`
- **Why**: Prevents concatenation bugs, cleaner multi-line strings

**4. Destructuring (ES2015) - RECOMMENDED**
- ✅ **USE**: `const { x, y, z } = vector3`
- ❌ **AVOID**: `const x = vector3.x; const y = vector3.y;`
- **Why**: Less boilerplate, clearer intent

**5. Spread/Rest Operators (ES2015) - RECOMMENDED**
- ✅ **USE**: `[...oldArray, newItem]` or `{...oldObj, newProp: 'value'}`
- ❌ **AVOID**: `.concat()` for arrays or manual object merging
- **Why**: Immutable updates, cleaner syntax

**6. Default Parameters (ES2015) - MANDATORY**
- ✅ **USE**: `function move(speed = 5) { ... }`
- ❌ **NEVER**: `function move(speed) { speed = speed || 5; }`
- **Why**: Prevents NaN bugs (see Rule #2)

**7. Async/Await (ES2017) - MANDATORY**
- ✅ **USE**: `const data = await fetch(url);`
- ❌ **AVOID**: Promise chains `.then().then().catch()`
- **Why**: Synchronous-looking async code, easier error handling

**8. Optional Chaining (ES2020) - MANDATORY**
- ✅ **USE**: `player?.weapon?.damage`
- ❌ **NEVER**: `player && player.weapon && player.weapon.damage`
- **Why**: Prevents null/undefined errors (see Rule #2)

**9. Nullish Coalescing (ES2020) - MANDATORY**
- ✅ **USE**: `score ?? 0` (only replaces null/undefined)
- ❌ **AVOID**: `score || 0` (also replaces 0, false, '')
- **Why**: Correct fallback behavior

**10. Object Shorthand (ES2015) - RECOMMENDED**
- ✅ **USE**: `const obj = { x, y, z }` instead of `{ x: x, y: y, z: z }`
- **Why**: Less typing, cleaner code

---

### Prohibited Legacy Patterns

**❌ NEVER USE:**

| Legacy Pattern | Modern Replacement | Reason |
|----------------|-------------------|--------|
| `var` | `const` / `let` | Block scope, prevents hoisting bugs |
| `function() {}` (callbacks) | Arrow functions `() => {}` | Cleaner syntax (unless `this` needed) |
| String concatenation `+` | Template literals `` `${}` `` | Prevents bugs, multi-line support |
| `.then()` chains | `async/await` | Readability, error handling |
| `obj && obj.prop` | `obj?.prop` | Prevents null errors |
| `value || default` | `value ?? default` | Correct nullish check |
| `Object.assign({}, obj)` | `{...obj}` | Cleaner spread syntax |
| `array.concat()` | `[...array, item]` | Immutable pattern |
| Callbacks | Promises/Async-Await | Modern async pattern |

---

### Array Methods (Functional Programming - RECOMMENDED)

**Prefer functional methods over loops:**

- ✅ **USE**: `.map()`, `.filter()`, `.find()`, `.reduce()`, `.some()`, `.every()`
- ❌ **AVOID**: Traditional `for` loops (unless performance-critical)

**Example:**
```javascript
// ❌ OLD (Imperative)
const alive = [];
for (let i = 0; i < units.length; i++) {
  if (units[i].hp > 0) {
    alive.push(units[i]);
  }
}

// ✅ MODERN (Functional)
const alive = units.filter(unit => unit.hp > 0);
```

---

### Browser Compatibility

**Target**: Modern Evergreen Browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

- ✅ All ES2020 features fully supported
- ✅ Vite/Build tools transpile for older browsers if needed
- ✅ Three.js requires ES2015+ anyway

**Action**: Use modern syntax freely. Build tools handle compatibility.

---

### Enforcement Checklist

Before writing ANY JavaScript code:

- [ ] **Did I use `const`/`let` instead of `var`?**
  - ❌ NO → Replace with `const` (preferred) or `let`
  - ✅ YES → Continue

- [ ] **Did I use template literals for strings with variables?**
  - ❌ NO → Replace `'str' + var` with `` `str ${var}` ``
  - ✅ YES → Continue

- [ ] **Did I use Optional Chaining for nested properties?**
  - ❌ NO → Replace `obj && obj.prop` with `obj?.prop`
  - ✅ YES → Continue

- [ ] **Did I use `async/await` for promises?**
  - ❌ NO → Replace `.then()` chains with `async/await`
  - ✅ YES → Continue

- [ ] **Did I add default parameters to prevent NaN?**
  - ❌ NO → Add defaults (e.g., `fn(x = 0)`)
  - ✅ YES → Safe

---

## �📖 Core Development Protocols

### 1. Context Integrity (Read Before Write - MANDATORY)

**Enforcement Checklist:**

Before calling ANY edit tool:

- [ ] **Did I read the file THIS TURN?**
  - ❌ NO → STOP! Call `view_file` first
  - ✅ YES → Continue

- [ ] **Is the content in my ACTIVE context?**
  - ❌ NO → Re-read with `view_file`
  - ✅ YES → Continue

- [ ] **Am I 100% certain this is CURRENT state?**
  - ❌ NO → Re-verify with `view_file`
  - ✅ YES → Safe to edit

**Why Critical**: Prevents duplication, syntax errors, data loss.

---

### 2. Defensive Programming & Modern Safety (MANDATORY)

**Philosophy**: "Be a Ninja, not a Knight." Use modern JS features to prevent errors without writing verbose code.

**Enforcement Checklist:**

Before finalizing ANY function with parameters/external data:

- [ ] **1. Default Parameters (Prevent NaN):**
  - ❌ **BAD**: `function addScore(amount) { ... }` (Risk: amount undefined → NaN)
  - ✅ **GOOD**: `function addScore(amount = 1) { ... }` (Safe: defaults to 1)
  - **Rule**: NEVER define numeric parameters without default values.

- [ ] **2. Guard Clauses (Early Return):**
  - ❌ **BAD**: Nested `if` blocks deep inside function.
  - ✅ **GOOD**: `if (!isValid) return;` at the top.
  - **Rule**: Check for bad data first and return immediately.

- [ ] **3. Optional Chaining (`?.`) (The Magic Shield):**
  - ❌ **BAD**: `if (player && player.weapon && player.weapon.damage)`
  - ✅ **GOOD**: `if (player?.weapon?.damage)`
  - **Rule**: Use `?.` and `??` (Nullish Coalescing) instead of verbose checks.

- [ ] **4. Graceful Degradation:**
  - ❌ NO → Add try-catch or fallback values
  - ✅ YES → Safe

**Example (Modern Vibe Style):**
```javascript
/**
 * @param {object} player - Player entity
 * @param {number} damage - Damage amount (default 10)
 */
function takeDamage(player, damage = 10) {
  // 1. Guard Clause + Optional Chaining
  // If player doesn't exist or is already dead, stop here.
  if (!player?.isAlive) return;

  // 2. Logic (Safe because 'damage' has a default value)
  player.hp -= damage;
  
  // 3. Nullish Coalescing (Fallback for UI)
  console.log(`Remaining HP: ${player.hp ?? 0}`);
}
```

**Why This Matters:**
- ✅ **Speed**: AI writes `?.` instead of `if (obj !== null && obj !== undefined)`
- ✅ **Safety**: Default params prevent 90% of NaN bugs in games
- ✅ **Readability**: Code matches "Vibe Coding" philosophy - short and clear

---

### 3. Atomic Changes (RECOMMENDED - Flexible for Vibe Coding)

**When MANDATORY**: Production code, major refactors, breaking changes  
**When FLEXIBLE**: Prototyping, small features, bug fixes during iteration

**Guideline**: One change = one logical purpose (feature, bug fix, refactor)

---

### 4. File Naming Standard (MANDATORY)

**Rule**: NEVER use same filename in different directories.

❌ **BAD**: `docs/README.md`, `scripts/README.md`  
✅ **GOOD**: `docs/API_DOCUMENTATION.md`, `scripts/SCRIPTS_GUIDE.md`

**Enforcement**:
- AI MUST check for duplicate filenames before creating files
- If duplicate detected, suggest unique alternative

---

### 5. Backup Strategy

**When to Backup**:
- ✅ Before major refactoring
- ✅ Before file overwrites
- ✅ Before structural changes
- ✅ Before dependency updates

**Critical Files** (MANDATORY BACKUP):
- `memorybank/*.md` (ALL)
- `CHANGELOG.md`
- `.gemini/GEMINI.md`
- `package.json`
- Project configs (.env, vite.config, etc.)

**Implementation**:
```powershell
Copy-Item -Path ".\js\settings.js" -Destination ".\backups\settings_$(Get-Date -Format 'yyyy-MM-dd_HHmm').js"
```

---

### 6. Code Change Comments (RECOMMENDED)

**When changing config values, preserve old value in comments:**

✅ **Good**: `spawnRate: 200, // Changed from 100 (test) to 200 (prod)`  
❌ **Bad**: `spawnRate: 200, // No history`

**Exception**: Initial values don't need "changed from" comments.

---

### 6.5 AI Context Enhancement (JSDoc Strategy) - RECOMMENDED

**Purpose**: Provide TypeScript-level intelligence without using TypeScript files.

**Philosophy**: Keep files as `.js` (fast) but give AI exact type expectations (smart).

**Rule**:
- AI SHOULD add JSDoc comments to all major functions and classes.
- Focus on `@param` types to prevent hallucination and type errors.
- Use JSDoc for complex functions (>10 lines) or functions with multiple parameters.

**Benefits**:
- ✅ **No TypeScript overhead** - No compilation, no setup, no tsconfig.json
- ✅ **AI understands types** - Prevents "undefined is not a function" errors
- ✅ **IDE support** - VS Code shows intellisense even in .js files
- ✅ **Self-documenting code** - Functions explain themselves

**Example**:
```javascript
/**
 * Calculates damage based on weapon type and critical hit status.
 * @param {number} baseDamage - The raw damage value from weapon
 * @param {boolean} [isCritical=false] - Is this a critical hit?
 * @param {object} [modifiers] - Optional damage modifiers
 * @param {number} [modifiers.multiplier=1.0] - Damage multiplier
 * @param {number} [modifiers.bonus=0] - Flat damage bonus
 * @returns {number} Final calculated damage
 */
function calculateHit(baseDamage, isCritical = false, modifiers = {}) {
  let damage = baseDamage;
  
  if (isCritical) damage *= 2;
  
  damage *= modifiers.multiplier ?? 1.0;
  damage += modifiers.bonus ?? 0;
  
  return Math.floor(damage);
}
```

**When to Use JSDoc**:
- ✅ Functions with 2+ parameters
- ✅ Functions that modify game state
- ✅ Public API functions
- ✅ Complex calculations
- ❌ Simple getters/setters (`getX()`, `setY(val)`)
- ❌ One-line utility functions

**Common JSDoc Types for Games**:
```javascript
@param {number} - Numbers (HP, damage, score)
@param {string} - Text (player name, item ID)
@param {boolean} - Flags (isAlive, hasKey)
@param {object} - Complex objects (player, enemy, weapon)
@param {Array<number>} - Arrays of specific type
@param {THREE.Vector3} - Three.js types (use full class name)
@param {Function} - Callbacks
@param {*} - Any type (use sparingly)
```

**Advanced: Optional Parameters**:
```javascript
/**
 * @param {number} required - This param is mandatory
 * @param {number} [optional] - This param is optional (note the brackets)
 * @param {number} [withDefault=10] - Optional with default value
 */
```

**Enforcement**:
- [ ] Before writing a function with 2+ params, did I add JSDoc?
- [ ] Did I specify types for all parameters?
- [ ] Did I document what the function returns?

---

### 7. Post-Edit Verification (MANDATORY - NO EXCEPTIONS)

**🚨 NEW: "Stop the Bleeding" Protocol**

**BEFORE verification, check tool output:**

**Step 0: Tool Output Check (Kill Switch)**
- [ ] Did tool report "inaccuracies", "best effort", or "fuzzy match"?
  - ❌ **YES** → **IMMEDIATE ROLLBACK!**
    - Run: `git checkout HEAD -- <file>` (or equivalent undo)
    - Run: `view_file` to see original state
    - **DO NOT** proceed to next step
    - **DIAGNOSE** why match failed (wrong target content, file changed)
  - ✅ NO → Continue to Step 1

**Step 1: Verify Edit Applied**
- [ ] **Did I call `view_file` on edited region?**
  - ❌ NO → STOP! Call `view_file` NOW
  - ✅ YES → Continue

- [ ] **Did ONLY intended lines change?**
  - ❌ NO → ROLLBACK immediately
  - ✅ YES → Continue

- [ ] **Is line count change reasonable?**
  - ❌ NO (>50 lines unexpected) → ROLLBACK
  - ✅ YES → Continue

**Red Flags** (immediate rollback):
- File size changed >50%
- Tool reports "inaccuracies" or "best effort"
- Critical code sections disappeared

**Step 4: Integrity & Truncation Check (CRITICAL for HTML/JSON)**
- [ ] **Did I cut off the file end?** (Lazy Truncation check)
  - 🔍 Check: Does the file still end with `</html>`, `}`, or expected closing tag?
  - ❌ NO → **IMMEDIATE ROLLBACK!** I deleted the footer/closing tags.
  - ✅ YES → Continue.

- [ ] **Did I break the structure?**
  - 🔍 Check: Are `script` imports inside `body` or `head`?
  - ❌ NO → ROLLBACK.

**ZERO EXCEPTIONS**: No shortcuts. Always verify.

**🚨 NEW: Markdown Leak Prevention**

**Problem:** AI formatting responses with markdown (` ```javascript `) can accidentally inject markdown into tool arguments.

**Example (WRONG):**
```markdown
User: "Replace this code"
AI response: "Sure! Here's the code:
```javascript
const example = 'value';
```
Now calling replace_file_content with TargetContent: [above code]"

→ Tool receives: TargetContent = "```javascript\nconst example..."
→ Searches for literal "```javascript" in file
→ Not found → Fuzzy match → CORRUPTION!
```

**Rule:**
- [ ] **Never include markdown formatting in tool TargetContent/ReplacementContent**
- [ ] **Strip ` ```language ` code fences before passing to tools**
- [ ] **Use raw code strings only** (no formatting)

**Correct:**
```javascript
TargetContent: "const example = 'value';"  // ← No markdown!
```

---

### 8. HARD RULE: View Before Edit (MANDATORY)

**Before calling `replace_file_content` or `multi_replace_file_content`:**

- [ ] **Step 1:** Did I call `view_file` for this file in **THIS TURN**?
  - ❌ NO → **STOP!** Call `view_file` first
  - ✅ YES → Continue

- [ ] **Step 2:** Do I have the EXACT content in context?
  - ❌ NO → **STOP!** Call `view_file` first
  - ✅ YES → Continue

- [ ] **Step 3:** Is TargetContent from my view_file output?
  - ❌ NO → **STOP!** I'm guessing! Call `view_file`
  - ✅ YES → Safe to edit

**🚨 RED FLAGS (Pattern Blindness Triggers):**

If you're thinking ANY of these, **STOP immediately**:
- ❌ "Just one line, no need to view"
- ❌ "I know what's in the file"
- ❌ "TargetContent is unique enough"
- ❌ "Saving time by skipping"
- ❌ "I edited this 2 turns ago, I remember"

**✅ CORRECT MINDSET:**
- ✅ "Even 1 char edit = MUST view_file"
- ✅ "Files change between turns"
- ✅ "Cost: 5sec view vs 5min restore = **60x penalty**"
- ✅ "Trust the protocol, not my memory"

**ZERO EXCEPTIONS:** No shortcuts, EVER.

---

### 8.5. Small File Overwrite Strategy (NEW - Phase 1 Lesson)

**Problem:** `replace_file_content` uses string matching → corruption risk, especially with markdown leak or fuzzy matching.

**Solution:** For small files (<100 lines), use `write_to_file` with `Overwrite=true` instead.

**When to Use:**

- [ ] **File <100 lines** (fast to rewrite)
- [ ] **No unique anchors available** (all patterns similar)
- [ ] **replace_file_content failed 2+ times** (corruption loop)
- [ ] **Critical file** (index.html, config files)

**Benefits:**
- ✅ **No string matching** (atomic full-file replace)
- ✅ **No fuzzy search** (zero corruption risk)
- ✅ **Markdown leak immune** (different tool)
- ✅ **Works any file size** (but best for <100)

**Risks:**
- ⚠️ **Wrong filename = DATA LOSS** (verify path carefully)
- ⚠️ **Must have full file content** (not for partial edits)

**Example:**

```javascript
// Instead of replace_file_content (risky):
write_to_file({
  TargetFile: "js/core/LoadScripts.js",
  Overwrite: true,  // ← Delete and rewrite
  CodeContent: `[FULL 65-line file here]`
})
```

**Decision Tree:**

```
File size?
├─ <100 lines
│  └─ write_to_file (Overwrite) ✅ SAFEST
├─ 100-800 lines
│  ├─ Unique anchors? YES → replace_file_content
│  └─ Unique anchors? NO → MANUAL
└─ >800 lines
   └─ MANUAL (Rule #20) ❌ NO EXCEPTIONS
```

**Real-world success:** LoadScripts.js (65 lines) - User deleted + rewrote = PERFECT result, zero corruption.

---

### 9. Proactive Duplication Detection (SMART DETECTION)

**Before moving to next action after reading a file:**

- [ ] **Did I ignore common boilerplate?**
  - ✅ Skip: imports, licenses, generic config, HTML templates
  - ✅ Skip: <10 line repeated blocks
  - ✅ Skip: Auto-generated code, test fixtures

- [ ] **Did I check for duplicate logic blocks?**
  - ⚠️ Check: Function definitions (>10 lines, same name/logic)
  - ⚠️ Check: Repeated algorithms (loops, conditions, calculations)
  - ⚠️ Check: Copy-pasted business logic

**Action:**
- **IF Significant Logic Duplication Found (>10 lines, high/medium impact):**
  - 🛑 **Pause and ask**: "I noticed `[Function X]` is duplicated. Should I refactor this into a shared utility?"

---

### 10. Context Efficiency & File Size Limits

**Memory Bank Limits (Documentation):**
- **Target Files:** `.md` files in `memorybank/` (e.g., `activeContext.md`, `progress.md`)
- **Limit:** **800 Lines** (Soft Limit)
- **Action:**
  - `activeContext.md`: Move old sessions to `memorybank/archive/sessions_YYYY_QX.md`
  - `progress.md`: Move completed tasks to `CHANGELOG.md`

**Source Code Limits (Implementation):**
- **Target Files:** `.js`, `.html`, `.css`, `.cs`, etc.
- **Limit:** **800 Lines** (Soft Limit)
- **Action:**
  - **Trigger Refactor:** If a file approaches 800 lines, strictly apply **Append & Redirect**.
  - **Action:** Do not expand the file further. Move logic to a new module/component and import it.

**Workflow Limits (System):**
- **Global Workflows:** **12,000 Characters** (Hard Limit)
- **Action:** Keep system instructions and `.cursorrules` concise to save token space.

---

### 11. Implementation Plan Sharing Protocol (TRANSPARENCY)

**When creating `implementation_plan.md`:**

1. ✅ Create plan with technical details
2. ✅ Call `notify_user` with:
   - `PathsToReview: [implementation_plan.md]`
   - `BlockedOnUser: true`
   - Message: Brief summary
3. ✅ Wait for user approval before execution

**When to Create Implementation Plan**:
- ✅ New features (multi-file changes)
- ✅ Major refactoring (>3 files)
- ✅ Breaking changes
- ✅ Complex bug fixes
- ❌ Simple edits (<50 lines)
- ❌ Documentation updates

---

### 12. Single Source of Truth & DRY (MANDATORY)

**Before writing new code:**

- [ ] **Does this code already exist?**
  - ✅ YES → Reference existing, don't duplicate
  - ❌ NO → Continue

- [ ] **Is this a configuration value?**
  - ✅ YES → Add to central config (`settings.js`)
  - ❌ NO → Continue

- [ ] **Is this logic used >1 time?**
  - ✅ YES → Extract to helper/util/shared module
  - ❌ NO → OK to write

**Examples:**

✅ **GOOD (SSOT)**:
```javascript
// settings.js (SSOT)
export const GAME_CONFIG = {
  spawnRate: 200,
  enemySpeed: 2.5
};

// game.js (references SSOT)
import { GAME_CONFIG } from './settings.js';
setInterval(spawnEnemy, GAME_CONFIG.spawnRate);
```

❌ **BAD (Hardcoded)**:
```javascript
// game.js
setInterval(spawnEnemy, 200); // Hardcoded

// ui.js
displayText(`Spawn rate: 200`); // Hardcoded again
```

---

### 13. Resource Anomaly Monitoring (PERFORMANCE)

**After EVERY tool call, check token consumption:**

| Operation Type | Expected Tokens | Anomaly (3x) |
|----------------|----------------|--------------|
| view_file (small) | 100-200 | >600 |
| view_file (large) | 300-500 | >1500 |
| grep_search | 150-300 | >900 |
| replace_file | 200-400 | >1200 |
| Web search | 800-1500 | >4500 |

**Silent Freeze Detection**:
- Token usage unchanged for 2+ steps → Freeze detected
- Same operation >3 times with ~same token cost → Infinite loop
- Action: STOP immediately, notify user

---

### 13.5 Tool Redundancy Prevention (PATTERN BLINDNESS)

**Rule**: Before using same tool **3rd time** after 2 failures, use alternative tool/method.

**Problem**: AI repeats same failed tool multiple times instead of trying alternatives.

**Enforcement Checklist:**

Before calling a tool that failed 2+ times:

- [ ] **Did this tool fail 2 times already?**
  - ✅ YES → STOP! Use different tool/method
  - ❌ NO → Can retry once more

- [ ] **Are there alternative tools available?**
  - ✅ YES → Use alternative immediately
  - ❌ NO → Ask user for guidance

**Alternative Tool Matrix:**

| Failed Tool | Alternative 1 | Alternative 2 | Alternative 3 |
|-------------|---------------|---------------|---------------|
| `grep_search` | PowerShell `Select-String` | Manual `view_file` scan | Ask user for hints |
| `view_file` (large file) | `view_file_outline` | `grep_search` for specific content | Split viewing into chunks |
| `replace_file_content` | `write_to_file` (overwrite) | Manual recreation | Restore from backup |
| `run_command` | Different command syntax | Interactive shell | Ask user to run manually |
| Web search | Different query terms | Read documentation URL | Ask user for reference |

**Example Pattern Blindness:**

❌ **BAD (Pattern Blindness)**:
```
1. grep_search "Security Standards" → No results
2. grep_search "Security Standards" (case insensitive) → No results
3. grep_search "SQL injection" → No results
4. (Still no alternative tried) ← PATTERN BLINDNESS!
```

✅ **GOOD (Tool Diversity)**:
```
1. grep_search "Security Standards" → No results
2. PowerShell Select-String "Security Standards" → FOUND! ✅
```

**Why Critical**: 
- Same tool failing 3x = Definition of insanity (doing same thing, expecting different results)
- Wasted time and tokens
- User loses trust
- Real incident: 2025-12-03 - grep_search failed 3x before trying PowerShell

**Auto-Trigger**: 
- Tool fails 2x → MANDATORY alternative method next
- No exceptions

**Real Incident Report (2025-12-03):**
- **Tool**: `grep_search` 
- **Query**: "Security Standards" (with emoji `🔐`)
- **Failures**: 3 consecutive attempts
- **Resolution**: PowerShell `Select-String` succeeded immediately
- **Root Cause**: Emoji encoding issue + pattern blindness
- **Lesson**: Diversify tools after 1st failure, not 3rd!

### 14. Append & Redirect Rule (CRITICAL)

**Purpose**: Minimize errors when working with long code files by managing context window efficiently.

#### 14.1 Append (Ekleme Prensibi)

**Problem**: 
- AI sometimes rewrites entire files when only small changes are needed
- This fills the context window quickly
- May cause network errors or token limit truncation mid-code

**Rule**: 
- ✅ **ADD** new functionality to the **END** of the file (Append)
- ✅ **PRESERVE** existing working code
- ❌ **DO NOT** rewrite entire file for small additions

**Example**:
```javascript
// ❌ BAD: Rewriting entire file
// [AI rewrites 500 lines just to add one function]

// ✅ GOOD: Append new function at end
// [Existing 500 lines remain untouched]

// NEW CODE APPENDED BELOW:
export function newFeature() {
  // New functionality here
}
```

**When to Append**:
- Adding new functions/classes
- Adding new event handlers
- Adding new utility methods
- Small feature additions

#### 14.2 Redirect (Yönlendirme Prensibi)

**Problem**:
- Files become too large → AI makes errors (hallucinations)
- Forcing code into bloated files reduces readability
- Complex files exceed manageable token limits

**Rule**:
- ✅ If new code would make file **too large** (>800 lines) → **CREATE NEW FILE**
- ✅ If change would **reduce readability** → **EXTRACT TO MODULE**
- ❌ **DO NOT** force code into already-large files

**Decision Matrix**:

| Current File Size | New Code Size | Action |
|------------------|---------------|--------|
| < 400 lines | < 50 lines | ✅ Append to existing file |
| 400-800 lines | < 50 lines | ⚠️ Append, but consider refactor |
| > 800 lines | Any size | 🔴 **REDIRECT** to new file |
| Any size | > 100 lines | 🔴 **REDIRECT** to new file |

**Redirect Process**:

1. **Create new file** with descriptive name:
   ```
   // Instead of bloating PlayerController.cs
   // Create: PlayerInventorySystem.cs
   ```

2. **Import/Reference** from main file:
   ```javascript
   // main.js
   import { InventorySystem } from './systems/InventorySystem.js';
   
   class Player {
     constructor() {
       this.inventory = new InventorySystem();
     }
   }
   ```

3. **Update documentation** to reflect new structure

**When to Redirect**:
- File approaching 800 lines
- Adding complex new system/feature
- Code belongs to different logical domain
- Performance-critical code needs isolation
- Code will be reused across multiple files

**Benefits**:
- ✅ Prevents context window overflow
- ✅ Reduces AI hallucination risk
- ✅ Improves code organization
- ✅ Enables better testing/maintenance
- ✅ Follows Single Responsibility Principle

**Enforcement Checklist**:

Before adding code to existing file:

- [ ] **File size check**: Is current file >400 lines?
  - ❌ YES → Consider Redirect
  - ✅ NO → Safe to Append

---

### 15. Single Responsibility Principle (MANDATORY)

**Purpose**: Prevent "God Objects" and spaghetti code by ensuring each file has one clear purpose.

**Rule**:
- ✅ **One File = One Purpose**: A file should handle ONE specific domain (e.g., Input, Audio, Rendering).
- ❌ **No God Objects**: Do not mix unrelated logic (e.g., UI code inside Game Engine).
- **Limit**: If a file handles >1 distinct domain, **SPLIT IT**.

**Examples**:
- ❌ `game.js` handling Audio, UI, and Physics.
- ✅ `AudioManager.js`, `UIManager.js`, `PhysicsEngine.js`.

**Enforcement**:
- [ ] **Does this file do more than one thing?**
  - ❌ YES → Refactor/Split
  - ✅ NO → Continue

- [ ] **New code size**: Is new code >50 lines?
  - ❌ YES → Redirect to new file
  - ✅ NO → Can Append

- [ ] **Logical cohesion**: Does new code belong to same domain?
  - ❌ NO → Redirect to appropriate module
  - ✅ YES → Can Append

- [ ] **Readability impact**: Will this make file harder to navigate?
  - ❌ YES → Redirect to new file
  - ✅ NO → Can Append

**Example Scenario**:

```
Scenario: Adding inventory system to 350-line PlayerController.cs

❌ BAD: Force 150 lines of inventory code into PlayerController
   Result: 500-line monster file, AI struggles, readability poor

✅ GOOD: Redirect approach
   1. Create: InventorySystem.cs (150 lines)
   2. PlayerController.cs: Add reference (5 lines)
   3. Result: Clean separation, both files manageable
```

**⚠️ Self-Check Reminder (Before EVERY Code Addition):**

Before adding code, ask yourself:
- [ ] Is this file >400 lines? → Consider REDIRECT
- [ ] Is new code >50 lines? → Consider REDIRECT  
- [ ] Am I editing middle of file? → Could I APPEND instead?
- [ ] Does this belong to different domain? → REDIRECT to new module

**Enforcement**: If you answer "YES" to any question, strongly consider Redirect over Append.

---

### 15.1 Golden Rule: "Birlikte Değişen Kod, Birlikte Yaşamalı" (ALTIN KURAL)

**Problem**: Aşırı bölünmüş dosyalar → AI ilişkileri kaybeder → Bug'lu kod üretir.

**🔑 ALTIN KURAL:**

```
Eğer A dosyasını değiştirirken HER ZAMAN B dosyasını da değiştiriyorsan
→ A ve B'yi BİRLEŞTİR!

Eğer A ve B bağımsız değişebiliyorsa
→ AYRI TUT!
```

**Pratik Uygulama:**

| Durum | Eylem | Örnek |
|-------|-------|-------|
| Boss hareketi + Boss animasyonu | ✅ BİRLEŞTİR | Tek `Boss.js` (1000 satıra kadar OK) |
| Player + PlayerInventory | ⚠️ KONTROL ET | Ayrı değişiyorsa → ayrı tut |
| CameraManager + InputManager | ❌ AYRI TUT | Farklı sorumluluklar |

**Esnek Satır Limitleri:**

| Dosya Tipi | Önerilen Limit |
|------------|----------------|
| Manager (tek sorumluluk) | 400-600 satır |
| Karakter sınıfı (Boss, Player) | 800-1000 satır OK |
| Utility/Helper | 200-300 satır |

**⚠️ Uyarı**: 800 satır kuralı hala geçerli ama **birlikte değişen kod için esnek**. Kafadan bölme yapma, önce ilişkiyi kontrol et!

---

#### 14.3 New Code Addition Decision Tree (MANDATORY CHECKLIST)

**Purpose**: Systematic workflow to prevent god classes and enforce file size limits when AI is asked to add new code.

**BEFORE adding ANY new code, follow this checklist:**

```
┌─────────────────────────────────────────────┐
│ Step 1: Can this be a new file?            │
└─────────────────────────────────────────────┘
              │
              ├─ ✅ YES → **CREATE NEW FILE** (go to Step 2)
              │
              └─ ❌ NO (Must modify existing) → Go to Step 3

┌─────────────────────────────────────────────┐
│ Step 2: New File Creation                  │
└─────────────────────────────────────────────┘
   ✅ Create new file with descriptive name
   ✅ Follow naming conventions (e.g., `WeaponManager.js`)
   ✅ Update imports/references in existing files
   ✅ Add to script loader (LoadScripts.js if applicable)
   ✅ PROCEED with implementation
   ✅ Check for Circular Dependencies (Does the new file need to import a file that imports it?)

┌─────────────────────────────────────────────┐
│ Step 3: Cannot create new file             │
│         (Must modify existing file)        │
└─────────────────────────────────────────────┘
              │
              ├─ Check: Current file size + new code > 800 lines?
              │
              ├─ ✅ YES (Exceeds 800) → Go to Step 4 (ESCALATE)
              │
              └─ ❌ NO (Under 800) → Go to Step 5 (SAFE TO PROCEED)

┌─────────────────────────────────────────────┐
│ Step 4: EXCEEDS 800 LINE LIMIT             │
│         🚨 MANDATORY USER ESCALATION        │
└─────────────────────────────────────────────┘
   ⛔ STOP immediately
   📊 Generate refactoring report via notify_user:
      - Current file: [name] ([X] lines)
      - New code: [Y] lines (would become [X+Y] lines)
      - Options:
A) Refactor existing file ... (Ensure explicit exports/imports for shared variables)
        B) Create new file instead (rethink architecture)
        C) Accept 800+ lines (NOT RECOMMENDED - explain risks)
      - Recommendation: [AI's suggestion with rationale]
   ⏸️ WAIT for user decision (BlockedOnUser: true)
   

┌─────────────────────────────────────────────┐
│ Step 5: UNDER 800 LINES                    │
│         ✅ SAFE TO PROCEED                  │
└─────────────────────────────────────────────┘
   ✅ Add code to existing file
   ✅ Use APPEND strategy if possible (add to end)
   ✅ Follow Rule #8 (View Before Edit)
   ✅ Follow Rule #7 (Post-Edit Verification)
```

**Checklist Summary (Copy-Paste for Every New Code Request):**

```markdown
Before adding code:
- [ ] **Step 1**: Can this be a new file?
  - [ ] ✅ YES → Create new file (Step 2)
  - [ ] ❌ NO → Continue to Step 3

- [ ] **Step 3**: Current file size + new code > 800 lines?
  - [ ] ✅ YES → **ESCALATE to user** (Step 4) ⛔
  - [ ] ❌ NO → Safe to proceed (Step 5) ✅

- [ ] **Step 4 (if escalated)**: Report generated?
  - [ ] File size analysis documented
  - [ ] Refactoring options presented
  - [ ] User approval requested (BlockedOnUser: true)

- [ ] **Step 5 (if safe)**: Edit protocols followed?
  - [ ] Rule #8: view_file called before edit ✅
  - [ ] Rule #7: Post-edit verification completed ✅
  - [ ] Append strategy used if possible ✅
```

**Example Scenarios:**

**Scenario A: Feature request that can be new file**
```
User: "Add performance monitoring to the game"

AI Decision Tree:
├─ Step 1: Can this be new file?
│  └─ YES ✅ (PerformanceMonitor is separate concern)
└─ Step 2: Create js/managers/PerformanceMonitor.js
   ✅ PROCEED
```

**Scenario  B: Feature must modify existing file, under 800 lines**
```
User: "Fix bug in line 45 of game.js"

AI Decision Tree:
├─ Step 1: Can this be new file?
│  └─ NO ❌ (Bug fix requires editing existing)
├─ Step 3: game.js (392 lines) + fix (5 lines) = 397 lines
│  └─ 797 < 800 ✅
└─ Step 5: SAFE TO PROCEED
   ✅ Apply bug fix with proper protocols
```

**Scenario C: Feature exceeds 800 lines - ESCALATE**
```
User: "Add boss system to Human.js"

AI Decision Tree:
├─ Step 1: Can this be new file?
│  └─ NO ❌ (Boss extends Human class)
├─ Step 3: Human.js (379 lines) + boss logic (150 lines) = 529 lines
│  └─ 929 > 800 ⚠️
└─ Step 4: **ESCALATE TO USER** ⛔

AI Report (via notify_user):
┌──────────────────────────────────────────┐
│ 🚨 File Size Limit Exceeded              │
├──────────────────────────────────────────┤
│ Current: Human.js (379 lines)            │
│ Addition: Boss logic (150 lines)         │
│ Result: 529 lines (EXCEEDS 800 LIMIT)   │
├──────────────────────────────────────────┤
│ Options:                                 │
│ A) Extract Boss to new Boss.js class    │
│    ✅ Recommended - clean separation    │
│ B) Refactor Human.js first              │
│ C) Accept 529 lines (NOT RECOMMENDED)   │
│    ⚠️ Risk: AI errors increase 3x       │
├──────────────────────────────────────────┤
│ My Recommendation: Option A              │
│ Boss class has unique logic (HP bars,   │
│ shields, special abilities) - deserves  │
│ its own file.                            │
└──────────────────────────────────────────┘

Which option do you prefer?
```

**Why This Rule is Critical:**

❌ **Without Rule #14.3**: AI blindly adds code → 500+ line files → AI hallucinations → corruption  
✅ **With Rule #14.3**: Systematic checks → User informed → Clean architecture → Maintainable code

**Enforcement Priority**: **CRITICAL**  
This rule MUST be checked before EVERY code addition. No exceptions.

---



**Problem**: AI bazen kullanıcıya çok fazla teknik detay veriyor, kullanıcı boğuluyor.

**3-Tier Response Strategy:**

**Tier 1 (Default)**: Özet + Sonuç (2-3 cümle max)
- Ana sonuç
- Kritik bilgi
- "Detay ister misin?" sorusu

**Tier 2 (User asks)**: Orta detay
- Nasıl yapıldı
- Örnek kullanım
- Teknik özet

**Tier 3 (User asks more)**: Teknik derinlik
- Implementation detayları
- Alternatif yaklaşımlar
- Edge case'ler

**Example:**

✅ **GOOD**: 
```
settings.js güncellendi. Zombie spawn 2x hızlı, zorluk %40 yavaş.
Detay ister misin?
```

❌ **BAD**: 
```
[300 satır settings.js teknik analizi...]
```

---

### 16. Error Recovery Protocol (Hata Kurtarma)

**Problem**: AI "özür dilerim" diyor ama hatayı nasıl düzelteceğini söylemiyor.

**MANDATORY Format:**

1. **ACKNOWLEDGE**: "X hatası yaptım"
2. **DIAGNOSE**: "Çünkü Y nedeniyle (root cause)"
3. **FIX**: "Şimdi Z yaparak düzelteceğim (action plan)"

**Example:**

✅ **GOOD**:
```
Bullet.js'te duplikasyon oluşturdum (ACKNOWLEDGE)
çünkü view_file yapmadan edit ettim (DIAGNOSE).
Şimdi view_file ile mevcut durumu okuyup 
sadece gerekli kısmı düzelteceğim (FIX).
```

❌ **BAD**:
```
Özür dilerim, hata yaptım.
```

**Why Critical**: Kullanıcı hatanın neden olduğunu ve nasıl düzeltileceğini bilmeli.

---

### 17. No Placeholders Rule (Placeholder Yasağı - ZERO TOLERANCE)

**Problem**: AI `// TODO: Implement later` yazıp bırakıyor.

**Forbidden:**
- ❌ `// TODO: Implement this`
- ❌ `// Coming soon`
- ❌ `function foo() { /* placeholder */ }`

**Required:**
- ✅ Minimal working version
- ✅ Future improvement comments (not TODOs)

**Example:**

✅ **GOOD**:
```javascript
function saveData(data) {
  // Minimal: localStorage (Future: migrate to IndexedDB for performance)
  localStorage.setItem('gameData', JSON.stringify(data));
}
```

❌ **BAD**:
```javascript
function saveData(data) {
  // TODO: Add database save
}
```

**Why Critical**: Her fonksiyon çalışır durumda olmalı. Placeholder = incomplete code.

---

### 18. Read Receipt Protocol (Okundu Bilgisi)

**Problem**: Kullanıcı AI'ın dosyayı okuyup okumadığını bilmiyor.

**After EVERY view_file (when relevant):**

**Template:**
```
✅ [Filename] okundu:
   - [N] satır
   - İçerik: [2-3 kelime özet]
   - [Sonraki adım]
```

**Example:**

✅ **GOOD**:
```
settings.js okundu:
   - 118 satır
   - İçerik: Spawn rates, difficulty, loot box HP
   - Zombie spawn'ı artırmaya hazırım, devam?
```

❌ **BAD**:
```
[Sessizce okuyor, hiçbir feedback yok]
```

**When to Skip**: Eğer hemen ardından edit yapılacaksa, edit Description'ında belirtmek yeterli.

---

### 19. Dependency Impact Analysis (Bağımlılık Etki Analizi)

**Problem**: AI bir dosyayı değiştiriyor ama yan etkileri kontrol etmiyor.

**Before EVERY edit to shared code/functions:**

1. **Search usage**: `grep_search` ile kullanım yerlerini bul
2. **List impact**: Etkilenecek dosyaları listele
3. **Assess breaking**: Breaking change mi kontrol et
4. **Propose action**: Güncelleme stratejisi öner

**Template:**
```
⚠️ Etki Analizi:
 - [File1.js] satır [X] kullanıyor
 - [File2.js] satır [Y] referans veriyor
 - Breaking change: [EVET/HAYIR]
 - Önerilen aksiyon: [Hepsini güncelle / Backward compatible yap]
```

**Example:**
```
playerSpeed değişkenini değiştireceğim.

⚠️ Etki Analizi:
 - EnemyAI.js bu değeri kullanıyor (satır 45)
 - PhysicsManager.js'de referans var (satır 120)
 - Breaking change: HAYIR (setter fonksiyon korunuyor)
 - Önerilen: Sadece internal implementation değişecek
 
Devam edeyim mi?
```

**When to Skip**: Private fonksiyonlar veya yeni eklenen kod (henüz kullanılmıyor).

---

### 20. Large File Safety Protocol (Büyük Dosya Güvenliği)

**Purpose**: Prevent "search & replace" corruption in large/repetitive files.

**Trigger**: Files >800 lines OR files with repetitive patterns (HTML, config files).

> [!WARNING]
> **Relationship with Rule #14 (Append & Redirect):**
> - **First**, check Rule #14: Can this file be refactored/split?
>   - ✅ YES (e.g., `game.js` → extract to managers) → **Apply Rule #14 (Redirect)**
>   - ❌ NO (Monolithic files like `index.html`, `package.json`) → **Proceed with Rule #20 below**
>
> **Why Critical**: Rule #14 prevents file bloat. Rule #20 handles unavoidable monoliths. Don't confuse them!

> [!CAUTION]
> **Phase 1 Incident Report:**
> - index.html (567 lines): 3x corruption attempts
> - Root cause: No unique anchors, fuzzy matching failure
> - Solution: Manual edit (user precision > AI guesswork)
> 
> **Lesson:** >800 lines + no unique anchors = MANDATORY manual escalation

---

#### 20.1 Unique Anchor Requirement (Zorunlu Çıpa)

**Problem**: 
- `replace_file_content` uses string matching
- In large files, short strings match multiple locations
- Tool picks wrong match → deletes unrelated code

**Rule**:

Before calling `replace_file_content` on files >800 lines:

---

### 21. Manual `index.html` Modification Protocol (STRICT)

**Problem**: `index.html` is a large, monolithic file with repetitive patterns (HTML structure), making it highly prone to AI corruption during edits.

**Rule**:
- ❌ **AI MUST NOT** directly edit `index.html` using `replace_file_content` or `multi_replace_file_content`.
- ✅ **AI MUST** provide instructions for the USER to manually apply changes.

**Procedure**:
1. **Create Temporary Instruction File**:
   - Create a file named `manual_index_update.md` (or similar) in the root.
   - Write clear, copy-pasteable code blocks with context (where to insert/replace).
   
2. **Notify User**:
   - Use `notify_user` to inform the user that manual action is required.
   - Provide the path to the instruction file.

3. **Verify**:
   - After the user confirms the edit, use `view_file` to verify the changes were applied correctly.

**Exception**:
- `write_to_file` with `Overwrite=true` is ALLOWED if and only if the AI generates the **ENTIRE** content of `index.html` from scratch (e.g., during initialization or full rewrite). Partial edits are FORBIDDEN.

---

- [ ] **Anchor Check**: Is my `TargetContent` UNIQUE?
  - ❌ Short strings: `<div>`, `return;`, `}` → NOT UNIQUE
  - ✅ Include 5-10 lines of context before/after target
  - ✅ Include function names, unique comments, specific IDs

**Example:**

❌ **BAD** (index.html, 566 lines):
```html
TargetContent: `
    <script src="js/classes/Human.js"></script>
    <script src="js/classes/GatePair.js"></script>
`
// Problem: Multiple script tags, could match wrong section
```

✅ **GOOD**:
```html
TargetContent: `
    <script src="js/models/BlockyCharacter.js"></script>
    <!-- Entity Classes -->
    <script src="js/classes/Bullet.js"></script>
    <script src="js/classes/Human.js"></script>
    <script src="js/classes/GatePair.js"></script>
    <script src="js/classes/LootBox.js"></script>
`
// Unique: Comment + 5-line context = single match
```

---

#### 20.2 Manual Edit Escalation (Manuel Düzenleme)

**Rule**:

If you **cannot find unique anchor** in >800 line file:

1. **STOP** - Do not attempt edit
2. **Ask User**: "This file is large. To avoid corruption, please manually add this line at line X:
   ```
   <script src="js/classes/FlyingEnemy.js"></script>
   ```
   I can commit after you confirm."

**Why**: Human precision > AI guesswork for critical files.

---

#### 20.3 Forbidden Actions

❌ **NEVER**:
- Rewrite entire file just to change 1 line (token waste + hallucination risk)
- Use `replace_file_content` on >500 line files without unique anchors
- Ignore "inaccuracies" warnings (see Rule #7)

❌ **NEVER (Lazy Editing):**
- **Partial Output in Rewrite:** When rewriting a file (or large block), NEVER output just the changed part with comments like `// ... rest of code`. You MUST output the FULL block to preserve integrity.
- **Blind Truncation:** Never assume the end of the file is "safe". Always verify `</html>` or `}` exists after edit.

✅ **INSTEAD**:
- Ask user for manual edit OR
- Use line-number-based tools (if available) OR
- Create new file + merge (for major refactors)

---

## 🔐 Security Standards

### Input Validation (CRITICAL)

**NEVER trust user input.**

✅ **Always Validate**:
- Sanitize HTML/SQL (prevent XSS/SQL injection)
- Validate file uploads (type, size, content)
- Verify API parameters (type, range, format)

**Example**:
```javascript
// ❌ BAD
function updateProfile(username) {
  db.query(`UPDATE users SET name='${username}'`); // SQL INJECTION!
}

// ✅ GOOD
function updateProfile(username) {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    throw new Error('Invalid username');
  }
  db.query('UPDATE users SET name=?', [username]);
}
```

### Secret Management

❌ **NEVER**:
- Commit API keys to git
- Hardcode passwords
- Log sensitive data

✅ **ALWAYS**:
- Use environment variables (`.env`)
- Add `.env` to `.gitignore`

---

## ✅ Testing Standards

### Code Coverage Target: **70%**

✅ **Required Tests**:
- **Unit Tests**: Individual functions/components
- **Integration Tests**: Component interactions
- **E2E Tests**: Critical user flows

❌ **Anti-Pattern**: "We'll test later" → **NEVER test later, test NOW.**

---

## 📝 Code Quality Standards

### DRY (Don't Repeat Yourself)

❌ **BAD**:
```javascript
function calculatePriceWithTax() {
  return price * 1.18;
}
function calculateDiscountedPrice() {
  return price * 1.18 * 0.9;
}
```

✅ **GOOD**:
```javascript
function applyTax(price) {
  return price * 1.18;
}
function calculateDiscount(price, rate) {
  return applyTax(price) * (1 - rate);
}
```

### SOLID Principles

- **S**ingle Responsibility: One class, one job
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes substitutable for base types
- **I**nterface Segregation: Many specific > one general interface
- **D**ependency Inversion: Depend on abstractions, not implementations

### Naming Conventions

✅ **Clear, Descriptive Names**:
```javascript
// ❌ BAD
let d = new Date();
function calc(x, y) { }

// ✅ GOOD
let currentDate = new Date();
function calculateTotalPrice(basePrice, taxRate) { }
```

---

## 🛠️ Technology Decision Mechanism

### Decision Criteria

1. **Necessity**: Can vanilla code solve this?
2. **Abstraction**: Will this create tight coupling?
3. **Sustainability**: Is library actively maintained?
4. **Performance**: Bundle size impact?
5. **Simplicity**: Does this add unnecessary complexity?

### Decision Flow

```
New Technology Needed
    ↓
Vanilla solution (< 5 lines)?
├─ YES → Write vanilla
└─ NO → Abstraction needed?
    ├─ YES → Create interface
    └─ NO → Evaluate libraries
        ↓
        Active (commit < 6 months)?
        ├─ NO → Reject
        └─ YES → Bundle < 10KB?
            ├─ NO → Extract functions
            └─ YES → Add to project
```

---

## 🌍 Accessibility (WCAG AA)

✅ **Always Include**:
- ARIA labels for UI components
- Keyboard navigation support
- Color contrast compliance (4.5:1)
- Alt text for images

**Example**:
```html
<!-- ❌ BAD -->
<button onclick="submit()">→</button>

<!-- ✅ GOOD -->
<button aria-label="Submit Form" onclick="submit()" tabindex="0">
  Submit
</button>
```

---

## 📊 Logging Standards

### 3 Types of Logging

**A. Development/Debug Logging**:
```javascript
console.log('Processing items:', items.length); // OK during dev
```
- Remove before production

**B. Project Change Audit Trail (CHANGELOG.md)**:
- Format: `## [1.2.0] - 2025-11-28 22:24`

**Update Frequency**:

| Change Type | Update? | Example |
|-------------|---------|---------|
| Major Feature | ✅ YES | New weapon system |
| Breaking Change | ✅ YES | API change |
| Critical Bug | ✅ YES | Game crash fix |
| Minor Bug | ⚠️ BATCH | Typo fix |
| Refactoring | ⚠️ IF SIGNIFICANT | File restructure |
| Documentation | ❌ NO | Comment updates |

**C. Runtime Application Logging**:
```javascript
function criticalOperation() {
  const timestamp = new Date().toISOString();
  console.error(JSON.stringify({
    level: 'ERROR',
    timestamp,
    message: 'Operation failed',
    context: { userId, operation }
  }));
}
```

❌ **NEVER log**:
- Passwords
- API tokens
- Credit cards
- Personal info

---

## 📄 Version Control (Conventional Commits)

✅ **Format**: `<type>(<scope>): <description>`

**Types**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Build/config changes

**Examples**:
```
feat(auth): add password reset functionality
fix(api): resolve null pointer in user service
docs(readme): update installation instructions
```

---

## 🎯 Workflow Standards

### Definition of Done (DoD)

✅ **Before marking task complete**:
- [ ] Code implemented and lint-free
- [ ] Tests written (unit/integration)
- [ ] No new console errors/warnings
- [ ] Memory Bank updated (if major change)
- [ ] Temporary debug logs removed
- [ ] CHANGELOG.md updated (if significant)

### Refactoring Thresholds

**Trigger refactoring when**:
- Function > 50 lines
- File > 800 lines
- Cyclomatic complexity > 10
- Duplicate code appears 3+ times

---

## 🐛 Debugging & Rollback Protocol

### Rollback Prensibi

| Durum | Kural |
|-------|-------|
| **Düzeltme Başarısızlığı** | 2 ardışık denemeden sonra başarısız veya yeni kritik hata → **Rollback ZORUNLU** |
| **Regresyon Testi** | Önceki hatanın düzeltilmesinden sonra → Unit Testler **mutlaka** yeniden çalıştırılır |

### Rollback Decision Tree

```
Hata Düzeltme Denemesi
    ↓
Başarılı mı?
├─ YES → Test Regression → Deploy
└─ NO → İkinci Deneme
    ↓
    Başarılı mı?
    ├─ YES → Test Regression → Deploy
    └─ NO → ROLLBACK + Kullanıcıya bildir
```

---

## 🔀 Conflict Resolution (Öncelik Hiyerarşisi)

**Kural çatışması durumunda öncelik sırası:**

### 1. 🚨 CRITICAL: Güvenlik Standartları (HIGHEST PRIORITY)
- Input validation ASLA atlanmaz
- API keys ASLA hardcode edilmez
- SQL queries ASLA string concatenation ile oluşturulmaz

### 2. 🚨 CRITICAL: İşlem Bütünlüğü
- Dosya ASLA okunmadan düzenlenmez
- Memory Bank ASLA güncellenmeden task tamamlanmaz
- Backup ASLA alınmadan major refactoring yapılmaz

### 3. 📖 CRITICAL: Doğrulama ve Sonuç Odaklılık (Process-Driven Priority)
- Rule #20 (`task.md`, `walkthrough.md`) takibi Atomic Changes'den ÖNEMLİ
- Rapid, provable results > perfectionism
- **Vibe Coding**: Small prototypes için speed + verification > strict atomicity

### 4. 📖 Core Development Protokolleri
- Defensive Programming (Rule #2) - NEVER skip
- View Before Edit (Rule #9) - NEVER skip
- Atomic Changes (Rule #3) - Flexible for prototyping

### 5. 📝 Kod Kalitesi
- DRY, KISS, YAGNI
- Line/function limits (flexible)

### 6. ⚡ Performans
- Optimize after verification passes
- Premature optimization avoided

---

## 🚀 Project-Specific Quick Checks

### Before Starting ANY Task:

1. ✅ Check if project has `.md` documentation
2. ✅ Read `00_Context_Loader.md` (loading protocol)
3. ✅ Check `progress.md` (avoid redoing work)
4. ✅ Check `CHANGELOG.md` (recent changes)

### Task Execution Order:

1. **PLAN** → Read documentation
2. **EXECUTE** → Implement changes
3. **TEST** → Verify functionality
4. **DOCUMENT** → Update Memory Bank (if major)
5. **VERIFY** → Check DoD criteria

---

## 🛑 CRITICAL ANTI-PATTERNS (NEVER DO THIS)

❌ **1. Blind Editing**: Editing without reading current content first  
❌ **2. No Validation**: Trusting external data without checks  
❌ **3. Hardcoded Secrets**: API keys/passwords in code  
❌ **4. Duplicate Logic**: Copy-pasting instead of extracting functions  
❌ **5. Skipping Tests**: "We'll test later" mentality  
❌ **6. No Documentation**: Expecting to remember everything  
❌ **7. Giant Commits**: Mixing multiple unrelated changes  
❌ **8. Ignoring Linting**: Disabling linters instead of fixing issues

---

## 📌 Quick Reference Card

| Situation | Action |
|-----------|--------|
| **Before modifying file** | `view_file()` + verify after edit |
| **External data arrives** | Validate: null checks, type checks |
| **Repetitive code** | Extract to reusable function |
| **Adding feature** | Small: `walkthrough.md` first. Major: `implementation_plan.md` |
| **Bug found** | `/fix` workflow → TDD + regression |
| **UI change** | `/verify browser` → Screenshot proof |
| **Writing function** | Defensive checks (null, type, array bounds) |
| **Task complete** | Update `task.md` + `walkthrough.md`, Memory Bank ONLY for major changes |

---

## 🌳 Workflow Decision Tree

**Hangi durumda hangi workflow kullanılır?**

### 🔧 Kod Değişikliği Yapacaksan
- **ÖNCE**: `/safe-edit` - Duplikasyon ve syntax hata önleme
- **SONRA**: Major değişimse Memory Bank güncelle

### 🐛 Bug Fix Yapacaksan
- **ÖNCE**: `/fix` - Sistematik hata çözme + regression testi
- **TEST**: `/verify browser` (UI bug) veya unit test

### 🚀 Hızlı İterasyon Yapacaksan
- **AKTİFLEŞTİR**: `/turbo` - Onay beklemeden çalıştır

### 🎨 UI/UX Değişikliği Yapacaksan
- **ÖNCE**: `/safe-edit` - Kod değişikliği
- **TEST**: `/verify browser` - Manuel browser testi
- **KANIT**: Screenshot embed et `walkthrough.md`'ye

### 🆕 Yeni Proje Başlatacaksan
- **ÇALIŞTIR**: `/init` - Memory Bank + workflow otomatik kurulum

### ❓ Kullanıcı İsteği Belirsizse
- **ÖNCE**: `/intent` - Karşılıklı anlayış doğrulama

### 💾 Git Commit Otomasyonu İstiyorsan
- **AKTİFLEŞTİR**: `/auto-git` - Her değişiklik sonrası commit

---

## 📗 Available Workflows

| Workflow | Purpose | When to Use |
|----------|---------|-------------|
| `/safe-edit` | Kod düzenleme (duplikasyon/syntax önleme) | Her dosya değişikliğinde |
| `/fix` | Sistematik bug çözme + regression önleme | Bug raporu/hata tespit |
| `/verify` | Doğrulama (browser/terminal/file/test) | UI/UX değişiklik, test doğrulama |
| `/intent` | Karşılıklı anlayış doğrulama | Kullanıcı isteği belirsizse |
| `/turbo` | Otomatik komut çalıştırma | Tekrarlayan deployment/test |
| `/auto-git` | Her değişiklik sonrası auto-commit | Git workflow otomasyonu |
| `/init` | Yeni proje başlatma (Memory Bank + workflows) | Proje ilk kurulum |

---

## 🚨 Project-Specific Rules

### Rule #21: index.html Edit Protocol (MANDATORY - ZERO EXCEPTIONS)

**Problem:** index.html is a large (383+ lines), complex file with many screens. Direct AI edits have **high corruption risk**.

**MANDATORY Protocol When GEMINI.md Changes Needed:**
**NEVER edit GEMINI.md directly** (NO EXCEPTIONS)

**MANDATORY Protocol When index.html Changes Needed:**

1. **NEVER edit index.html directly** (NO EXCEPTIONS)
2. **ALWAYS create manual fix guide** (`.md` file format)

**Protocol:**
- Create `.md` file with step-by-step instructions in artifacts directory
- Include exact line numbers, code blocks to delete/modify
- User implements changes manually
- Examples: `index_html_fixes.md`, `index_html_cleanup.md`

**Why Manual Only:**
- ❌ AI sıfırdan yazma: Çok yüksek risk, ekranları unutma riski
- ❌ AI direkt edit: Duplicate ID, syntax hataları, corruption
- ✅ Manuel düzeltme: Kullanıcı doğrudan kontrolü, sıfır corruption riski

**Template Content for `.md` file:**

```markdown
# index.html [İşlem Adı]

## 🔍 Tespit Edilen Sorunlar:
[Sorun listesi]

## 📋 ADIM ADIM MANUEL DÜZELTME:

### Adım 1: [İşlem]
**Ctrl+F ile ara:** `[aranacak]`
**SİL/DEĞİŞTİR:**
```html
[Kod bloğu]
```

## ✅ Doğrulama:
[Kontrol adımları]
```

**Exceptions:** NONE. Even for "small" fixes, follow protocol.

**Communication:** Do NOT paste code in chat. ONLY create `.md` artifact file.

---

### Rule #22: Git Commit Frequency Protocol

**Problem:** Too many commits = cluttered git history. Too few = lost work if error occurs.

**NEW PROTOCOL: Commit Auto, Push Manual**

✅ **COMMIT (Local Backup):**
- AI can commit **anytime** for safety
- Use `SafeToAutoRun=true` (no user approval needed)
- Command: `git add . && git commit -m "message"`
- **NO PUSH** included

❌ **PUSH (GitHub Upload):**
- **ONLY when user says "push et"** or "push yap"
- Manual approval required
- Command: `git push`
- **NEVER auto-push**

**Why This Works:**
- ✅ Frequent local backups (safe rollback)
- ✅ Clean GitHub history (only meaningful milestones)
- ✅ User control (push = explicit approval)
- ✅ Auto-commit = turbo mode compatible

**Commit Trigger Events (When AI commits automatically):**

✅ **ALWAYS COMMIT:**
- After file edits (safety backup)
- After bug fixes
- After feature additions
- Before risky changes

❌ **NEVER COMMIT:**
- Work in progress (incomplete)
- Broken/untested code

**Example Workflow:**
```
AI: [edits files]
AI: git commit -m "Fix gate spawn interval" (AUTO)
User: [tests, approves]
User: "push et"
AI: git push (MANUAL)
```

**Decision Tree:**

```
File changed?
├─ ✅ YES → git commit (AUTO, SafeToAutoRun=true)
└─ ❌ NO → Nothing

User said "push"?
├─ ✅ YES → git push (MANUAL)
└─ ❌ NO → Do NOT push
```

**Current Practice:** Commit frequently (auto), push only on user command.

---

## Rule #25: THREE.js Parent-Child Scaling Protocol

**Context:** HP Bar implementation revealed parent-child scaling bugs.

**Date Added:** 2025-12-02  
**Source:** Boss HP Bar Implementation Post-Mortem

### **Problem: Child Objects Inherit Parent Scale**

```javascript
// ❌ WRONG: Child sprite becomes GIANT
boss.mesh.scale.set(14, 14, 14);  // Boss scaled 14x
sprite.scale.set(10, 3, 1);       // Sprite intended 10x3
boss.mesh.add(sprite);            // Sprite WORLD scale = 10*14 = 140! (HUGE!)
```

**Result:** Sprite fills entire screen, not visible as intended.

---

### **Solution: Compensate for Parent Scaling**

**Before adding child to scaled parent:**
- [ ] **Document parent scale:** What is `parent.scale`?
- [ ] **Calculate world size:** `child.worldScale = child.localScale * parent.scale`
- [ ] **Compensate if needed:** `child.scale = desired / parent.scale`

**Example:**
```javascript
// ✅ CORRECT: Divide by parent scale
boss.mesh.scale.set(14, 14, 14);                // Parent scale
const compensatedScale = 10 / boss.mesh.scale.x;  // 10/14 = 0.71
sprite.scale.set(compensatedScale, compensatedScale / boss.mesh.scale.y, 1);
boss.mesh.add(sprite);  // sprite.worldScale = 0.71 * 14 = 10 ✅ Correct!
```

**Alternative:** Add child to scene instead of parent (requires follow logic).

---

## Rule #25.1: THREE.js Visual Debugging - "Show, Don't Log"

**Context:** Console logs are insufficient for 3D spatial debugging.

**Date Added:** 2025-12-02

### **Problem**

```javascript
// ❌ Console logging doesn't show WHERE/HOW BIG
console.log('Sprite position:', sprite.position);  // {x: 0, y: 0.71, z: 0}
console.log('Sprite scale:', sprite.scale);        // {x: 0.71, y: 0.28, z: 1}

// Question: Is this correct? Can't tell from numbers alone!
```

---

### **Solution: Use THREE.js Visual Helpers**

#### **1. BoxHelper - Show Object Bounds (SIZE + POSITION)**

```javascript
// CRITICAL for debugging sprite scaling issues!
const boxHelper = new THREE.BoxHelper(sprite, 0xffff00);  // Yellow box
scene.add(boxHelper);

// Update if object moves/scales:
function animate() {
    boxHelper.update();
    renderer.render(scene, camera);
}
```

**Use Case:** 
- ✅ Sprite not visible → See if box is GIANT (parent scaling bug!)
- ✅ Sprite in wrong place → See box location
- ❌ No box visible → Object not in scene (forgot to add!)

---

#### **2. AxesHelper - Show Object Orientation (ROTATION)**

```javascript
// Red = +X, Green = +Y, Blue = +Z
const axesHelper = new THREE.AxesHelper(5);  // 5 units long
boss.mesh.add(axesHelper);  // Shows boss's local coordinate system
```

**Use Case:**
- ✅ Object facing wrong direction → See axes orientation
- ✅ Parent-child hierarchy → Each object shows its own axes

---

#### **3. GridHelper - Show World Coordinates (REFERENCE)**

```javascript
const gridHelper = new THREE.GridHelper(100, 10, 0x888888, 0x444444);
scene.add(gridHelper);  // Ground reference grid
```

**Use Case:**
- ✅ Lost in 3D space → Grid shows XZ plane
- ✅ Scale comparison → Grid squares = world units

---

### **Practical Example: HP Bar Debugging**

```javascript
class Boss {
    constructor(pos, bossType) {
        super(pos, 14, true);  // scale = 14
        
        this.hpBar = new BossHpBar(this.mesh);
        
        // 🔍 DEBUG MODE: Add visual helpers
        if (DEBUG_MODE) {
            // 1. Show sprite bounds
            const spriteBox = new THREE.BoxHelper(this.hpBar.sprite, 0xff00ff);  // Magenta
            scene.add(spriteBox);
            
            // 2. Show boss axes
            const axes = new THREE.AxesHelper(10);
            this.mesh.add(axes);
            
            console.log('👁️ VISUAL HELPERS ACTIVE - Check the scene!');
        }
    }
}
```

**Visual Debugging Results:**

| Observation | Diagnosis | Fix |
|-------------|-----------|-----|
| Magenta box HUGE | Parent scaling bug | Divide sprite scale by mesh scale |
| Box tiny/invisible | Sprite scale too small | Increase sprite scale |
| No box at all | Sprite not added to scene | Check `mesh.add(sprite)` |
| Box at wrong Y | Position calculation wrong | Recalculate `sprite.position.y` |

**Rule:** If 3 console logs don't solve it, `new THREE.BoxHelper()` will!

---

## Rule #26: Code Organization - God Class Prevention

**Context:** HP Bar implementation revealed `Human.js` as a God Class (380 lines, multiple responsibilities).

**Date Added:** 2025-12-02  
**Source:** HP Bar Implementation Post-Mortem

### **Problem: God Class Anti-Pattern**

```javascript
// ❌ BAD: One class does everything
class Human {  // 380 lines!
    constructor(isEnemy, pos, scale, hp, isBoss, bossType) {
        if (!isEnemy) { /* player logic - 50 lines */ }
        if (isEnemy) { /* enemy AI - 80 lines */ }
        if (isBoss) {
            /* boss logic - 120 lines */
            this.createBossHpSprite();  // UI in gameplay class!
        }
        // Physics, visuals, etc - 130 lines
    }
}
```

**Symptoms:**
- File >400 lines
- Multiple `if (isType)` branches
- Mixing concerns (UI, logic, physics, AI)
- Hard to test, hard to debug
- AI tool corruption risk

---

### **Solution: Single Responsibility Principle + Composition**

```javascript
// ✅ GOOD: Each class has ONE job

// 1. Base class - ONLY movement & visuals (100 lines)
class Human {
    constructor(pos, scale, isEnemy) {
        this.mesh = createMesh(isEnemy);
        this.physics = new HumanPhysics(this);  // Composition!
    }
}

// 2. Boss class - ONLY boss features (80 lines)
class Boss extends Human {
    constructor(pos, bossType) {
        super(pos, BOSS_TYPES[bossType].scale, true);
        this.hpBar = new BossHpBar(this.mesh);  // UI component
        this.ai = new BossAI(this);             // AI component
    }
}

// 3. UI component - ONLY HP bar rendering (60 lines)
class BossHpBar {
    constructor(parentMesh) {
        this.sprite = this.createSprite();
        parentMesh.add(this.sprite);
    }
}
```

---

### **Enforcement Rules**

**Before creating a new class:**
- [ ] **One Responsibility:** Can you describe its job in ONE sentence?
  - ✅ "BossHpBar renders boss health bars"
  - ❌ "Human handles players, enemies, bosses, physics, and UI"

**File size limits:**
| File Type | Soft Limit | Hard Limit | Action |
|-----------|------------|------------|--------|
| Class file | 400 lines | 800 lines | Refactor required |
| Component | 100 lines | 150 lines | Split into modules |
| Utility | 150 lines | 200 lines | Group related functions |

**Refactoring triggers:**
1. File >400 lines → **MUST refactor**
2. >3 `if (isType)` branches → Extract subclass
3. Mixing UI + Logic → Separate component
4. AI tool corruption >2 times → File too complex

**Composition vs Inheritance:**
- ✅ **Use Composition** for behaviors (HpBar, AI, Physics)
- ✅ **Use Inheritance** for "is-a" relationships (Boss is-a Human)

---

### **Migration Strategy**

**When refactoring God Class:**

**Phase 1: Extract Components (UI, helpers)**
```javascript
// Before: Human has createBossHpSprite()
// After: BossHpBar.js component
```

**Phase 2: Extract Subclasses**
```javascript
// Before: Human has if (isBoss) { ... }
// After: Boss extends Human
```

**Phase 3: Cleanup Base**
```javascript
// Remove all if (isType) branches
// Base becomes pure, reusable
```

---

### **Practical Example: Boss Refactoring**

**Before (God Class):**
```
Human.js (380 lines)
├── Player logic (50)
├── Enemy AI (80)
├── Boss logic (120)
│   ├── HP bar rendering
│   ├── Shield mechanics
│   └── Special abilities
└── Physics/Visuals (130)
```

**After (SRP + Composition):**
```
Human.js (100 lines) - Base movement/visuals
Boss.js (80 lines) - Boss features
└── components/
    ├── BossHpBar.js (60 lines) - UI
    └── BossAI.js (50 lines) - AI
Player.js (50 lines) - Player input
```

**Benefits:**
- ✅ Smaller files = safer AI edits
- ✅ Isolated changes
- ✅ Easier testing
- ✅ Clearer architecture

---

### **Checklist Before Committing**

- [ ] Is any file >400 lines? → Refactor
- [ ] Does any class have >1 responsibility? → Split
- [ ] Are UI + Logic mixed? → Extract component
- [ ] Are there >3 type checks (`if isType`)? → Inheritance

---

## 🔍 Call Chain Analysis Protocol (Debugging)

> **Lesson Learned:** 2025-12-12 - Duplicate collision logic in Bullet.ts + CollisionManager.ts caused unexpected behavior.

### Rule #21: Trace the Full Call Chain

**Problem**: AI focuses on ONE file when debugging, missing duplicate logic in callers/callees.

**Scenario (Real Incident):**
```
Game Loop → CollisionManager.checkBulletCollisions()
              ├── bullet.update() → checkCollisions()  ← 1st collision check
              └── for (targets) collision check        ← 2nd collision check (DUPLICATE!)
```
**Result:** Bullets collided twice, unexpected behavior, "tarif edilemeyen sıkıntı".

### Enforcement Checklist

**Before concluding "code looks correct":**

- [ ] **Did I trace WHO CALLS this function?**
  - ❌ NO → Search for function name across entire codebase
  - ✅ YES → Continue

- [ ] **Did I trace WHAT this function CALLS?**
  - ❌ NO → Check all method calls inside function
  - ✅ YES → Continue

- [ ] **Is the same logic running in MULTIPLE places?**
  - ❌ NO → Safe to proceed
  - ⚠️ YES → **DUPLICATE LOGIC DETECTED!** Refactor to single source.

### Call Chain Analysis Template

When debugging unexpected behavior:

```
1. Identify the problematic behavior
   └── What is happening? (e.g., bullets disappear early)

2. Find the function responsible
   └── Where is the logic? (e.g., checkCollisions in Bullet.ts)

3. Trace CALLERS (Who calls this?)
   └── grep_search "functionName" across codebase
   └── Check: Is caller also doing the same logic?

4. Trace CALLEES (What does this call?)
   └── Read all method calls inside
   └── Check: Do callees also have the same logic?

5. Draw the call chain
   └── GameLoop → Manager → Class.update() → Class.method()
   └── Look for duplicates at ANY level
```

### Quick grep Commands

```powershell
# Find all callers of a function
Select-String -Path "src/**/*.ts" -Pattern "functionName\(" -Recurse

# Find all files with similar logic
Select-String -Path "src/**/*.ts" -Pattern "collision" -Recurse
```

### Red Flags (Duplicate Logic Indicators)

- ⚠️ Manager class AND entity class both have same method name
- ⚠️ `update()` function calls `checkX()` but parent loop also calls `checkX()`
- ⚠️ Same if-condition pattern appears in multiple files
- ⚠️ Similar variable names like `targets`, `bullets`, `enemies` in unrelated files

### The "Sanity Question"

Before saying "I can't find the bug":

> "Did I check if this logic runs ONCE or MULTIPLE times per frame?"

**Answer method:** Add `console.count('functionName')` temporarily and check if count increases by 1 or 2+ per frame.

---

**Last Updated**: 2025-12-12  
**Source:** Duplicate Collision Logic Debugging Post-Mortem