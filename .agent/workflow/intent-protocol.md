---
description: Mutual intent verification protocol to prevent misinterpretation
---

# /intent-protocol - Niyet Doğrulama Protokolü

> **Purpose**: Prevent misinterpretation by verifying intentions before acting  
> **When to use**: When user request is ambiguous or has multiple possible interpretations

---

## 🎯 Core Principle

**Problem**: AI sees EFFECT (what user did) but doesn't know INTENT (why user did it)

**Risk**: Wrong interpretation → Wrong solution → Wasted effort + Trust loss

**Solution**: Ask before assuming!

---

## 📊 The 4-Method Protocol

### Method 1: Active Querying (Doğrudan Sorma)

**When confidence < 70%, ask explicitly:**

```markdown
Template:
"I observed [EFFECT]. This could mean:
A) [Intent 1]
B) [Intent 2]  
C) [Intent 3]

Which interpretation is correct? This helps me provide the right solution."
```

**Example:**
```
User: "Can AI detect errors in scripts?"

AI Response:
"This question could mean:
A) You want to test my error detection capability (Quality Check)
B) You're worried about silent failures (Trust Building)
C) You had a bad experience and want prevention (Past Issue)

Which is closest to your intent?"
```

---

### Method 2: Contextual Analysis (Bağlam Kullanma)

**Check previous 3 messages + Memory Bank:**

```python
def interpret_intent(current_message):
    context = {
        'previous_3': get_last_3_messages(),
        'memory_bank': search_related_topics(),
        'conversation_theme': identify_main_theme()
    }
    
    # Pattern matching
    if context['previous_3'] contains "error":
        likely_intent = "Prevention"
    elif context['memory_bank'] contains "similar_question":
        likely_intent = load_past_intent()
    
    return likely_intent
```

**Example:**
```
Message T-2: "I got infinite backup loop"
Message T-1: "How to prevent this?"
Message T-0: "Add this to rules"

Context Analysis:
→ Theme: Problem → Solution → Prevention
→ Intent: Prevent future occurrence (not curiosity)
```

---

### Method 3: Mutual Analysis Loop (Karşılıklı Analiz)

**Every N messages, trigger reflection:**

```markdown
Every 5-7 messages:

AI: "In this conversation, I noticed pattern [X].  
     What was your main goal with these questions?"
     
User: [Explains intent]

AI: "Got it! Recording to Memory Bank for future reference."
```

**Benefits:**
- ✅ Symmetric partnership (AI and User both learn)
- ✅ Long-term memory building
- ✅ Future conversations start smarter

**Example:**
```
AI: "You asked 3 meta-questions about my limitations.  
     Are you trying to:
     A) Build trust by understanding boundaries?
     B) Find weak points to avoid them?
     C) Both?"
     
User: "Both!"

AI: *Updates Memory Bank*
  → "User prefers transparency about limitations"
  → Future behavior: Proactively mention constraints
```

---

### Method 4: Alternative Interpretations (Seçenek Sunma)

**Never lock into single interpretation:**

```markdown
Template:
"Your [ACTION] suggests [INTENT_A], but could also be [INTENT_B] or [INTENT_C].

My proposed response assumes [INTENT_A].  
If that's wrong, let me know and I'll adjust!"
```

**Example:**
```
User: "Create a backup before editing"

AI (Bad - Single interpretation):
"Sure, creating backup now."

AI (Good - Alternative interpretations):
"This could mean:
A) You want backup THIS TIME (one-off safety)
B) You want backup ALWAYS (new rule/workflow)
C) You're testing if I remember past backup issues

I'll assume A and create one backup.  
If you meant B, say 'make this a rule' and I'll add it to workflows!"
```

---

## ⚙️ Implementation Checklist

**Before responding to ambiguous request:**

- [ ] **Confidence check**: Am I >70% sure about intent?
  - ✅ YES → Proceed (but mention assumption)
  - ❌ NO → Use Method 1 (Active Query)

- [ ] **Context check**: Previous messages provide clues?
  - ✅ YES → Use Method 2 (Contextual Analysis)
  - ❌ NO → Must ask user

- [ ] **Pattern check**: Similar interaction before?
  - ✅ YES → Check Memory Bank for past intent
  - ❌ NO → This is new, use Method 4 (Alternatives)

- [ ] **Impact check**: What if I'm wrong?
  - 🔴 HIGH impact → MUST verify (Method 1)
  - 🟡 MEDIUM impact → State assumption (Method 4)
  - 🟢 LOW impact → Proceed with note

---

## 🚨 Red Flags (Must Verify Intent)

**Trigger active querying when:**

- ⚠️ Request affects critical files (config, Memory Bank, rules)
- ⚠️ Request has irreversible consequences (delete, overwrite)
- ⚠️ Multiple plausible interpretations with different outcomes
- ⚠️ User used vague language ("fix this", "make it better")
- ⚠️ Context is missing (new conversation, topic switch)

---

## 💡 Best Practices

### DO:
✅ Admit uncertainty ("I'm not sure if you mean X or Y")
✅ Provide 2-3 alternatives (not 10!)
✅ Explain why you're asking (transparency)
✅ Record confirmed intent to Memory Bank
✅ Use past confirmed intents for similar requests

### DON'T:
❌ Assume you know better than user
❌ Provide too many options (analysis paralysis)
❌ Ask unnecessary questions (obvious intent)
❌ Forget confirmed intent (rebuild knowledge each time)

---

## 📈 Success Metrics

**Protocol working if:**

- ✅ Misinterpretation rate < 10%
- ✅ User feels heard (not misunderstood)
- ✅ Memory Bank grows with intent patterns
- ✅ Future conversations require fewer verifications

**Protocol failing if:**

- ❌ Asking intent every single message (annoying!)
- ❌ Still misinterpreting after user clarified
- ❌ Not learning from past intent confirmations

---

## Example: Full Protocol in Action

```markdown
User: "Can AI handle large files?"

Step 1: Confidence Check
→ Confidence: 40% (ambiguous!)

Step 2: Active Query (Method 1)
AI: "This question could mean:
A) You want to know my technical limits (curiosity)
B) You have a large file to edit (immediate need)
C) You had bad experience with large files (past issue)

Which is closest?"

User: "B and C - I have 1500-line file and you hallucinated before"

Step 3: Contextual Analysis (Method 2)
→ Check Memory Bank: "user experienced hallucination"
→ Pattern: User wants RELIABLE solution

Step 4: Response
AI: "I understand - large files (>1000 lines) are risky for me.

Here's how we'll handle your 1500-line file safely:
1. Use chunk-based editing (not whole file)
2. Verify each chunk before moving to next
3. Create backup first

This prevents the hallucination you experienced before."

Step 5: Record to Memory Bank
→ "User needs: Reliability > Speed for large files"
→ "Trigger: Mention hallucination → Extra caution needed"
```

---

## 🔄 Integration with Other Workflows

Works well with:
- `/analyze-problem`: Verify problem understanding before solving
- `/safe-edit`: Confirm edit scope before changing code
- `/bug-fix`: Clarify expected behavior vs actual behavior

**Trigger:**
Any workflow can call `/intent-protocol` mid-execution if ambiguity arises.

---

## Final Note

**This protocol is living:**
- Evolves based on misinterpretation incidents
- Updated when new intent patterns discovered
- Refined through mutual feedback

**Goal**: Minimize "I thought you meant X but you meant Y" moments! 🎯
