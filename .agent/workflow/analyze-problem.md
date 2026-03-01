---
description: Systematic problem analysis and rule creation workflow
---

# /analyze-problem Workflow

> **Purpose**: Transform recurring problems into reusable rules through systematic analysis  
> **When to use**: After encountering bugs, errors, or issues that might happen again

---

## 📋 Workflow Steps

### 1️⃣ Problem Description + Root Cause

**Collect information:**

```markdown
❓ What happened?
  → [Describe the observable error/issue]

❓ When did it happen?
  → [Context: which file, which operation, which step?]

❓ What's the root cause? (if known)
  → [Not just symptom, but underlying reason]
  
❓ Risk tier?
  → Tier 1: Obvious error (syntax, null pointer)
  → Tier 2: Logic error (infinite loop, wrong calculation)  
  → Tier 3: Design issue (architecture, scaling)
```

**Example:**
```
Problem: Sync script ran 11 minutes, terminal output empty
Root Cause: PowerShell output buffering + no filesystem verification
Tier: 2 (Logic error - missing verification step)
```

---

### 2️⃣ Search Similar Issues (Memory Bank)

**Check existing knowledge:**

```bash
# Search in Memory Bank
grep -r "similar keywords" memorybank/

# Check CHANGELOG for past fixes
grep "related feature" CHANGELOG.md

# Check backups for solved incidents
ls backups/ | grep "relevant_file"
```

**Questions to ask:**
- ✅ Have we seen this exact problem before?
- ✅ Is there already a rule for this?
- ✅ Did we fix something similar but it regressed?

**Example:**
```
Search: "terminal output" "verification"
Found: Nothing in Memory Bank
→ This is a NEW problem class
```

---

### 3️⃣ Suggest Solution

**Tier-based approach:**

| Tier | Solution Type | Example |
|------|---------------|---------|
| **Tier 1** (Obvious) | Direct fix | Add null check, fix typo |
| **Tier 2** (Logic) | Process change | Add verification step |
| **Tier 3** (Design) | Architecture change | Refactor module structure |

**Solution template:**
```markdown
Proposed Solution:
├─ Short-term fix: [Immediate action]
├─ Long-term fix: [Prevent recurrence]
└─ Verification: [How to test]
```

**Example:**
```
Short-term: Use find_by_name after script completes
Long-term: Add Post-Script Verification Protocol (Rule #10.5)
Verification: Run sync script, check docs/ folder for duplicates
```

---

### 4️⃣ Create Rule (If Pattern Exists)

**When to create a rule:**

✅ **Create rule if**:
- Problem happened 2+ times
- Problem affects critical files/operations
- Solution is generalizable

❌ **Don't create rule if**:
- One-off typo
- Specific to single file
- Already covered by existing rule

**Rule template:**
```markdown
### Rule #X: [Rule Name]

**Problem**: [What failure mode does this prevent?]

**Rule**: [Clear, actionable directive]

**Enforcement Checklist**:
- [ ] Condition 1
- [ ] Condition 2

**Example**:
❌ BAD: [Counter-example]
✅ GOOD: [Correct example]

**Why Critical**: [Consequences of not following]
```

**Add to:**
- Global rules: `docs/GEMINI_BACKUP.md`
- Then sync: `.\scripts\sync-rules.ps1`

---

### 5️⃣ Document in CHANGELOG

**Update project changelog:**

```markdown
## [Version] - YYYY-MM-DD HH:MM

### Fixed
- [Problem description]
- Root cause: [Brief explanation]
- Solution: [What was done]
- New rule: [Rule #X if created]
```

**Criteria for CHANGELOG entry:**

| Change Type | Add to CHANGELOG? |
|-------------|------------------|
| Critical bug fix | ✅ YES (immediately) |
| New rule added | ✅ YES |
| Minor typo | ❌ NO |
| Refactoring | ⚠️ If significant |

---

## 🎯 Success Criteria

**Workflow completed when:**
- [x] Root cause identified (not just symptom)
- [x] Memory Bank checked for similar issues
- [x] Solution tested and verified
- [x] Rule created (if pattern detected)
- [x] CHANGELOG updated (if significant)

---

## 💡 Tips

**Avoid these pitfalls:**

❌ **Jumping to solution** without understanding root cause
❌ **Creating rules for one-off issues** (rule bloat)
❌ **Skipping Memory Bank search** (reinventing wheel)
❌ **No verification** (assuming fix worked)

✅ **Best practices:**

✅ Take time to understand WHY (not just WHAT)
✅ Consolidate similar rules (avoid duplication)
✅ Always verify the fix works
✅ Update Memory Bank so future you benefits

---

## Example: Full Cycle

```markdown
1. Problem: Infinite backup loop (backups/backups/backups/...)
2. Root Cause: Copying source into subdirectory of itself
3. Search: No existing rule found
4. Solution: Add exclusion or move destination outside source
5. Rule Created: #5 - Infinite Recursion Prevention
6. CHANGELOG: Added rule, synced to global GEMINI.md
```

**Result**: Future conversations will automatically prevent this issue! 🎯
