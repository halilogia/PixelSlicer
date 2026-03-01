---
description: Güvenli kod düzenleme protokolü - Duplikasyon ve syntax hatalarını önle
---

# 🛡️ Safe Edit Workflow

> **⚡ WORKFLOW AKTIF:** `/safe-edit` workflow'u çalışıyor.  
> **Amaç**: Kod düzenlerken hata yapmayı önle, syntax error ve code duplication'dan kaçın  
> **Ne zaman**: Her dosya düzenleme işleminden ÖNCE

---

## 🎯 Core Principle (CRITICAL)

**ASLA** bir dosyayı mevcut içeriğini okumadan düzenleme!

❌ **BAD**:

```
User: "settings.js'te spawn rate değiştir"
AI: *Dosyayı okumadan replace_file_content çağrısı*
→ DUPLICATE CODE, SYNTAX ERRORS, LOSS OF DATA
```

✅ **GOOD**:

```
User: "settings.js'te spawn rate değiştir"
AI:
1. view_file(settings.js) → Mevcut içeriği oku
2. Target content'i TAM OLARAK belirle
3. replace_file_content (EXACT match)
4. view_file(settings.js) → DEĞİŞİKLİĞİ DOĞRULA (POST-EDIT VERIFICATION)
```

---

## 📋 Safe Edit Protocol (4 Step Process)

### Step 1: Pre-Edit Context (Read Before Write)

**MANDATORY**: Dosyayı ÖNCE oku

```markdown
# Dosyanın tamamını oku (ilk kez)

view_file(path/to/file.js)

# Veya sadece ilgili bölümü oku

view_file(path/to/file.js, startLine=50, endLine=100)
```

**Checklist**:

- [ ] ✅ Dosya içeriği bellekte
- [ ] ✅ Target content TAM olarak biliniyor
- [ ] ✅ Line numbers doğru
- [ ] ✅ `GEMINI.md` kuralları (Global Rules) hafızamda mı?

**⚠️ Pattern Blindness Alert:**

Your brain will try to rationalize skipping view_file:

- ❌ "I edited this 2 turns ago, I remember"
- ❌ "The change is trivial"
- ❌ "TargetContent is obviously unique"

**DON'T TRUST YOUR BRAIN. TRUST THE PROTOCOL.**

**📊 Stats:**

- Incidents caused by skipping Step 1: **5/5 (100%)**
- Incidents caused by following Step 1: **0/∞ (0%)**

**Cost Analysis:**

- view_file: 5 seconds
- File restore after error: 5 minutes
- **Penalty ratio: 60x more expensive to skip!**

---

### Step 2: Precise Replacement

**Target Content MUST be EXACT** (whitespace dahil)

```javascript
// ❌ BAD: Approximate target
replace_file_content(
  (target = 'spawnInterval: 100'), // Eksik whitespace
  (replacement = 'spawnInterval: 200'),
);

// ✅ GOOD: EXACT target (view_file'dan kopyala)
replace_file_content(
  (target = '    spawnInterval: 100, // Test value'), // TAM match
  (replacement = '    spawnInterval: 200, // Production value'),
);
```

**Best Practice**: `view_file` output'undan COPY-PASTE yap

---

### Step 3: Post-Edit Verification (MANDATORY - NEW!)

**CRITICAL**: Her edit sonrası HEMEN verify et!

```markdown
# Step 3a: Immediately view edited file

view_file(path/to/file.js, startLine=edited_area-5, endLine=edited_area+5)

# Step 3b: Visual Sanity Check

"Does the diff look correct?"
"Did I accidentally delete sections?"
"Is line count change reasonable?"

# Step 3c: Red Flag Detection

⚠️ IF line count changed by >50 lines → SUSPICIOUS
⚠️ IF file size changed by >50% → ROLLBACK
⚠️ IF critical sections missing → ROLLBACK IMMEDIATELY
```

**Example**:

```markdown
# After editing settings.js:

replace_file_content(settings.js, ...) # Edit

# IMMEDIATELY VERIFY (NO EXCEPTIONS)

view_file(settings.js, startLine=5, endLine=15) # Check changed area

# If something looks wrong:

replace_file_content(settings.js, target="new value", replacement="old value") # Rollback
```

---

### Step 4: Error Recovery

**If edit failed or looks suspicious:**

```markdown
# Option 1: Rollback

replace_file_content(
target="NEW (wrong) content",
replacement="OLD (correct) content"
)

# Option 2: Restore from backup

Copy-Item -Path ".\backups\file_backup.js" -Destination ".\path\to\file.js"

# Option 3: Notify user

"Edit verification failed. Rolling back changes."
```

---

## 🚨 Common Pitfalls (Learn from Mistakes)

### Pitfall 1: Editing Without Reading

```markdown
❌ User: "Fix the bug in game.js"
❌ AI: _Edits game.js without reading_
❌ Result: Duplicate functions, syntax errors

✅ CORRECT:

1. view_file(game.js) # Read FIRST
2. Identify bug location
3. replace_file_content with EXACT target
4. view_file(game.js, around_changed_area) # Verify
```

### Pitfall 2: Approximate Target Content

```markdown
❌ BAD:
target="function foo() {"
→ Might match multiple functions!

✅ GOOD:
target=" function calculateScore() {\n return score \* multiplier;"
→ Unique match with context
```

### Pitfall 3: Skipping Post-Edit Verification (CRITICAL)

```markdown
❌ BAD (2025-11-29 Incident):
replace_file_content(00_Context_Loader.md, ...)

# AI continues without checking

→ 286 lines DELETED accidentally

✅ GOOD:
replace_file_content(00_Context_Loader.md, ...)
view_file(00_Context_Loader.md, startLine=320, endLine=340) # IMMEDIATE VERIFY

# "Wait, table is gone! Rollback!"

→ Disaster prevented
```

**LESSON LEARNED**: Post-edit verification is NOT optional. It's MANDATORY.

---

## 🧠 Pattern Blindness Detection

**Red Flags:** If you're thinking these, you're about to make an error:
❌ "It's just one line, I don't need view_file"
❌ "I already know what's in the file"
❌ "TargetContent is unique, it will work"
❌ "I'll save time by skipping view_file"

**Correct Mindset:**
✅ "Even for one line, view_file is MANDATORY"
✅ "Files change, I must verify current content"
✅ "5/5 incidents: I was confident, I was WRONG"
✅ "view_file takes 5 seconds, restore takes 5 minutes"

**Math:**

- view_file: 5 seconds
- File restore after error: 5 minutes
- **Ratio: 60x more expensive to skip!**

---

## 🔒 Critical Files (Extra Protection)

**Files requiring BACKUP before edit**:

- `memorybank/*.md` (ALL Memory Bank files)
- `CHANGELOG.md`
- `.gemini/GEMINI.md`
- `package.json`
- `index.html` (entry point)
- `scripts/navigator.ts` (CRITICAL TOOL)

**Protocol**:

```powershell
# STEP 1: Backup
Copy-Item -Path ".\memorybank\00_Context_Loader.md" `
          -Destination ".\backups\00_Context_Loader_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').md"

# STEP 2: Read
view_file(memorybank/00_Context_Loader.md)

# STEP 3: Edit
replace_file_content(...)

# STEP 4: Verify
view_file(memorybank/00_Context_Loader.md, around_changed_area)

# STEP 5: If error → Restore backup
Copy-Item -Path ".\backups\00_Context_Loader_*.md" -Destination ".\memorybank\00_Context_Loader.md"
```

---

## ✅ Safe Edit Checklist (Before Submitting)

**Pre-Edit**:

- [ ] ✅ Read file with `view_file`
- [ ] ✅ Target content is EXACT (copy-pasted from view_file)
- [ ] ✅ Backup created (if critical file)

**Post-Edit** (MANDATORY):

- [ ] ✅ Called `view_file` immediately after edit
- [ ] ✅ Verified only intended lines changed
- [ ] ✅ No accidental deletions detected
- [ ] ✅ Line count change is reasonable
- [ ] ✅ No tool warnings ("inaccuracies", "best effort")

**If ANY checkbox is unchecked** → DO NOT PROCEED, FIX FIRST

---

## 📊 Real Incident Report (Learning Material)

### Incident: 2025-11-29 Context Loader Disaster

**What Happened**:

- Attempted to update Quick Navigation table in `00_Context_Loader.md`
- Used `replace_file_content` with broad target
- **Skipped post-edit verification**
- Tool deleted 286 lines (entire sections)

**Damage**:

- Lost: "Ready to Start" section
- Lost: "Session Shutdown Protocol"
- Lost: Write-Back rules
- Lost: Self-Correction Checklist

**Impact**: If undetected, Memory Bank would be permanently broken

**Root Cause**:

1. Duplicate sections in file (2 identical tables)
2. Tool selected BOTH tables → deleted everything between them
3. **No post-edit verification** → damage undetected

**Prevention**:

- ✅ **POST-EDIT VERIFICATION** now MANDATORY (Rule 7 in GEMINI.md)
- ✅ Red flag detection (line count >50 change)
- ✅ Immediate rollback protocol

**Lesson**: ALWAYS verify edits. A single skipped verification can destroy entire project infrastructure.

---

### Incident 2: 2025-11-29 README.md Corruption (No Backup)

**What Happened**:

- Attempted to add "Development Setup" section to `README.md`
- **Skipped backup** (violated Rule 8 - Memory Bank Backup Policy)
- **Skipped view_file** (didn't read file first)
- Used incorrect target content (wrote from memory, not copy-paste)
- Tool returned "inaccuracies" warning → Applied "best effort" → File corrupted

**Damage**:

- Lost: Controls section
- Lost: Node.js (http-server) option
- Lost: Multiple Getting Started subsections

**Impact**: 5 minutes wasted on manual file reconstruction. No backup available to restore.

**Root Cause**:

1. **No backup** → Violated Rule 8 (README.md IS a critical file!)
2. **No view_file** → Wrote target content from context memory
3. **No post-edit verification** → Damage went unnoticed initially
4. **Ignored tool warning** → "inaccuracies" warning was dismissed

**Prevention**:

- ✅ **ALWAYS backup README.md** (it's an entry point document!)
- ✅ **ALWAYS view_file first** (even if file is in context)
- ✅ **NEVER ignore tool warnings** ("inaccuracies" = RED FLAG)
- ✅ **Post-edit verification** catches corruption immediately

**Lesson**: README.md is a CRITICAL file. Treat it like `index.html` or `package.json` - BACKUP MANDATORY.

---

### Incident 3: 2025-11-29 README.md Wide Target Failure (Backup Saved Us)

**What Happened**:

- Attempted to update `global-constitution.md` reference in README.md
- **Had backup** ✅ (learned from Incident 2!)
- Tried to replace 11 lines at once (lines 127-137)
- Wrote target content from context (didn't copy-paste from view_file)
- Tool returned "inaccuracies" → File completely corrupted

**Damage**:

- Entire "Contributing" section deleted
- License section deleted
- File truncated to 123 lines (from 145)

**Impact**: Restored from backup in 10 seconds. No manual work needed.

**Root Cause**:

1. **Too wide target** → 11 lines is too much (high error risk)
2. **No EXACT copy-paste** → Wrote from context memory
3. **Context != view_file** → Even if file is in context, whitespace may differ

**Prevention**:

- ✅ **Narrow targets** → 1-3 lines max (easier to match exactly)
- ✅ **EXACT copy-paste** → Always view_file first, copy exact content
- ✅ **Backup worked!** → Restore was instant

**Lesson**: Wide targets (>5 lines) increase error risk exponentially. Keep edits surgical.

**Follow-Up**: Second attempt with 1-line target succeeded perfectly.

---

## 🎯 Summary

**Safe Edit = 4 Steps**:

1. **Read** (view_file BEFORE edit)
2. **Edit** (EXACT target content)
3. **Verify** (view_file AFTER edit - MANDATORY)
4. **Recover** (rollback if error detected)

**Golden Rule**: If you didn't verify, you didn't finish the edit.

**Remember**:

- Post-edit verification is NOT optional
- Critical files need backups
- When in doubt, verify twice
