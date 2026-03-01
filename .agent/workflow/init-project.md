---
description: Yeni proje başlatma - Memorybank ve workflow dosyalarını otomatik oluştur
---

# 🚀 Project Initialization Workflow

> **⚡ WORKFLOW AKTIF:** `/init-project` workflow'u çalışıyor.  
> **Purpose**: Yeni proje başlarken memorybank ve workflow dosyalarını otomatik generate et  
> **When to Use**: Yeni proje oluştururken (ilk kez)  
> **Benefit**: Proje-spesifik içerik, doğru path'ler, tutarlı yapı

---

## 📋 Workflow Overview

Bu workflow şunları yapar:
1. Kullanıcıdan proje bilgilerini alır (ad, tür, path)
2. Template'lerden memorybank/ klasörünü oluşturur
3. Template'lerden .agent/workflows/ klasörünü oluşturur
4. Tüm placeholder'ları değiştirir ({{PROJECT_NAME}}, {{PROJECT_PATH}}, etc.)
5. Proje-spesifik içerikleri generate eder

---

## 🎯 Step-by-Step Process

### Step 1: Gather Project Information

**AI şunları sorar**:
```markdown
1. **Project Name** (örn: "My-Awesome-App")
2. **Project Type**: 
   - [ ] Web Application (React/Vue/Vanilla)
   - [ ] Three.js Game
   - [ ] Node.js Backend
   - [ ] Mobile App (React Native)
   - [ ] Desktop App (Electron)
   - [ ] Other (user specifies)
3. **Project Path** (örn: "C:/Users/Username/Projects/My-Awesome-App")
4. **Primary Language** (JavaScript, TypeScript, Python, etc.)
5. **Tech Stack** (React, Three.js, Express, etc.)
```

**User provides answers**

---

### Step 2: Create Folder Structure

```powershell
# Navigate to project root
cd {{PROJECT_PATH}}

# Create memorybank folder
New-Item -ItemType Directory -Path ".\memorybank" -Force

# Create .agent/workflows folder
New-Item -ItemType Directory -Path ".\.agent\workflows" -Force

# Create docs folder
New-Item -ItemType Directory -Path ".\docs" -Force

# Create backups folder
New-Item -ItemType Directory -Path ".\backups" -Force
```

---

### Step 3: Generate memorybank/ Files from Templates

**Template Location**: `C:\Users\Halil Emre\.gemini\templates\memorybank-template\`

**Files to Generate**:
1. `00_Context_Loader.md` (from template)
2. `activeContext.md` (from template)
3. `productContext.md` (**project-specific**)
4. `techContext.md` (**tech-stack-specific**)
5. `systemPatterns.md` (**architecture-specific**)
6. `progress.md` (empty template)
7. `task.md` (empty template)
8. `global-constitution.md` (copy from template)
9. `project-bylaws.md` (**project-type-specific**)

**Placeholder Replacement**:
```javascript
Placeholders to replace in ALL files:
- {{PROJECT_NAME}} → User's project name
- {{PROJECT_PATH}} → User's project path (with proper escaping for URLs)
- {{PROJECT_TYPE}} → User's project type
- {{PRIMARY_LANGUAGE}} → User's primary language
- {{TECH_STACK}} → User's tech stack
- {{CURRENT_DATE}} → Current date (YYYY-MM-DD)
```

---

### Step 4: Generate docs/ Folder (Portable Backups & Documentation)

**Files to Create**:
1. `docs/GEMINI_BACKUP.md` (portable copy of global rules)
   - Synced from `C:\Users\Halil Emre\.gemini\GEMINI.md`
   - For new developers without global setup
   - Use `scripts/sync-rules.ps1` to update
2. `docs/CREDITS.md` (asset attribution template)
3. `docs/LICENSE_GUIDE.md` (licensing guide)

**NOTE**: Workflows are NO LONGER project-local!
- ❌ `.agent/workflows/` is NOT created
- ✅ Workflows are read from global: `C:\Users\Halil Emre\.gemini\antigravity\global_workflows`
- ✅ Available workflows: `/safe-edit`, `/memory-bank-update`, `/bug-fix`, `/auto-git-backup`, `/browser-verify`, `/turbo`, `/init-project`

---

### Step 5: Generate Root Files

**Files to Create**:
1. `README.md` (from template with {{PROJECT_NAME}})
2. `CHANGELOG.md` (initial entry template)
3. `KNOWN_ISSUES.md` (empty template)
4. `WORKFLOWS.md` (from template with correct paths)

---

### Step 6: Project-Type-Specific Content

#### If Project Type = "Three.js Game":

**`project-bylaws.md` includes**:
- Three.js performance rules
- WebGL 2.0 requirements
- Asset standards (.glb, textures)
- Mobile support

**`techContext.md` includes**:
- Three.js version
- Vite configuration
- Browser compatibility
- GLTFLoader, OrbitControls

**`systemPatterns.md` includes**:
- Game loop architecture
- Entity-Component pattern
- Object pooling
- Collision detection

#### If Project Type = "React Web App":

**`project-bylaws.md` includes**:
- React best practices
- Component structure (Atomic Design)
- State management (Redux/Zustand)
- CSS modules vs Styled Components

**`techContext.md` includes**:
- React version
- Build tool (Vite/Webpack)
- Routing (React Router)
- HTTP client (Axios/Fetch)

**`systemPatterns.md` includes**:
- Folder structure (`src/components`, `src/hooks`, etc.)
- Component hierarchy
- State management patterns
- API integration patterns

#### If Project Type = "Node.js Backend":

**`project-bylaws.md` includes**:
- API design principles (RESTful)
- Error handling patterns
- Database conventions
- Middleware rules

**`techContext.md` includes**:
- Node.js version
- Express.js
- Database (MongoDB/PostgreSQL)
- Authentication (JWT/OAuth)

**`systemPatterns.md` includes**:
- MVC/Clean Architecture
- Service layer pattern
- Repository pattern
- Middleware chain

---

### Step 7: Validate and Confirm

**AI performs final checks**:
```markdown
✅ Folder structure created
✅ memorybank/ files generated (9 files)
✅ docs/ folder populated (3 files)
✅ Root documentation files created
✅ All placeholders replaced
✅ Project-specific content generated
```

**AI shows summary**:
```markdown
## ✅ Project Initialized: {{PROJECT_NAME}}

### Structure Created:
{{PROJECT_PATH}}/
├── memorybank/
│   ├── 00_Context_Loader.md
│   ├── MEMORY_BANK_GUIDE.md
│   ├── activeContext.md
│   ├── productContext.md
│   ├── techContext.md
│   ├── systemPatterns.md
│   ├── progress.md
│   ├── task.md
│   └── project-bylaws.md
├── docs/
│   ├── GEMINI_BACKUP.md
│   ├── CREDITS.md
│   └── LICENSE_GUIDE.md
├── backups/
├── README.md
├── CHANGELOG.md
├── KNOWN_ISSUES.md
└── WORKFLOWS.md

Next Steps:
1. Review generated files
2. Fill in specific project details (if needed)
3. Start coding with `/safe-edit` workflow
```

---

## 🔧 Template File Examples

### Example: `productContext.md` Template

```markdown
# 🎮 Product Context - {{PROJECT_NAME}}

> **Project Type**: {{PROJECT_TYPE}}  
> **Created**: {{CURRENT_DATE}}  
> **Tech Stack**: {{TECH_STACK}}

---

## 🎯 Project Vision

[AI generates this based on project type]

## 🎮 Core Features

[AI generates feature list based on project type]

## 👥 Target Audience

[AI generates audience profile]

## 🌟 Unique Value Proposition

[AI generates UVP]
```

### Example: `techContext.md` Template for Three.js Game

```markdown
# 🔧 Technical Context - {{PROJECT_NAME}}

> **Last Updated**: {{CURRENT_DATE}}

---

## 🏗️ Core Technologies

- **Engine**: Three.js (r128+)
- **Build Tool**: Vite
- **Language**: {{PRIMARY_LANGUAGE}}
- **WebGL**: 2.0 required

---

## 📦 Dependencies

[AI lists common dependencies for project type]

---

## 🌐 Browser Compatibility

[AI generates browser requirements]
```

---

## 📝 Placeholder Reference

| Placeholder | Example Value | Where Used |
|-------------|---------------|------------|
| `{{PROJECT_NAME}}` | "Mob-Runner-3D" | All files |
| `{{PROJECT_PATH}}` | "C:/Users/.../Mob-Runner-3D" | File links |
| `{{PROJECT_TYPE}}` | "Three.js Game" | Context files |
| `{{PRIMARY_LANGUAGE}}` | "JavaScript" | Tech context |
| `{{TECH_STACK}}` | "Three.js, Vite, WebGL 2.0" | All context files |
| `{{CURRENT_DATE}}` | "2025-11-29" | Timestamps |
| `{{USER_NAME}}` | "Halil Emre" | Credits, README |

---

## ⚠️ Important Notes

### Template Updates
**When to Update Templates**:
- New best practice discovered → Update template
- GEMINI.md rule change → Update global-constitution.md template
- New workflow added → Update workflow-template/

**Where Templates Live**:
- `C:\Users\Halil Emre\.gemini\templates\memorybank-template\`
- `C:\Users\Halil Emre\.gemini\templates\workflow-template\`

### Manual Customization
After `/init-project`:
- Review `productContext.md` (add specific features)
- Review `project-bylaws.md` (add project-specific rules)
- Fill in `README.md` installation steps

---

## 🚀 Usage Example

```markdown
User: "/init-project"

AI: "Let's initialize your new project! Please provide:
1. Project Name: _______
2. Project Type: (Web App / Three.js Game / Backend / Other)
3. Project Path: _______
4. Primary Language: _______
5. Main Tech Stack: _______"

User: 
1. "Space-Invaders-Clone"
2. "Three.js Game"
3. "C:/Users/Halil Emre/Projects/Space-Invaders"
4. "TypeScript"
5. "Three.js, Vite, TypeScript"

AI: [Generates all files with placeholders replaced]

AI: "✅ Project initialized! Review generated files and start coding."
```

---

## 🔗 Related

- [GEMINI.md](file:///C:/Users/Halil%20Emre/.gemini/GEMINI.md) - Universal rules
- [safe-edit.md](.agent/workflows/safe-edit.md) - File editing protocol
- [memory-bank-update.md](.agent/workflows/memory-bank-update.md) - Update protocol

