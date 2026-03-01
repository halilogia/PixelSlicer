---
description: Yeni proje için dokümantasyon şablonu oluşturur (README, ROADMAP, CHANGELOG, brain/, GEMINI.md)
---

# Dokümantasyon Şablonu Oluşturma (LinguaLearn Standardı v2.0)

Bu workflow, yeni veya mevcut bir projeyi "Sokratik Disiplin" ve LinguaLearn mimari standartlarıyla yapılandırır.

// turbo-all

## 0. Proje Analizi ve Lisans

### Otomatik Tespit

**Paket Yöneticisi Dosyaları:**
| Dosya | Dil/Platform |
|-------|--------------|
| `package.json` | JavaScript/TypeScript/Node.js |
| `requirements.txt`, `pyproject.toml` | Python |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `*.csproj`, `*.sln` | C#/.NET |
| `CMakeLists.txt` | C/C++ |

**Proje Türü Tespiti:**
| İpucu | Tür |
|-------|-----|
| `react`, `vue`, `angular` | Web App |
| `express`, `flask`, `django` | API/Backend |
| `capacitor`, `flutter` | Mobile App |
| `electron`, `tauri` | Desktop App |

### Lisans Sor (ZORUNLU)

MIT, Apache 2.0, GPL v3, ISC, BSD-3, Unlicense, Proprietary

---

## 1. MİMARİ ANAYASA (GEMINI.md)

```markdown
# [Proje Adı] - AI Anayasası 🏛️

> **Proje**: [Tür] | **Disiplin**: Sokratik Federalizm

## 📜 Temel Kanunlar

### 1. Singularity Law

- Co-location: UI, Logic, Style **1 Import mesafesinde**
- Vertical Slicing: `src/features/` altında egemen dilimler

### 2. State Sovereignty

- Store Singularity: Global State dilimlere ayrılır
- No Ghost State: URL verisi Store'a konmaz

### 3. The Guardian

- Her değişiklik sonrası `preflight` zorunlu
- Dokümantasyon güncellenmeden görev kapatılamaz

## 📁 Dosya Yapısı

- Feature-First: `components/` yerine `features/`
- Shared Kernel: Sadece ortak olanlar `shared/`

## 🚨 Anti-Patterns

❌ Okumadan düzenleme | ❌ Eager Loading | ❌ Dokümantasyon eksik

## 📖 Evrensel Kurallar

1. Context Integrity: Dosya düzenlemeden önce oku
2. Single Responsibility: Tek dosya = Tek component
3. DRY & SSOT: Tekrar → Fonksiyon
4. Defensive Programming: Validation, null checks
```

**Proje Türüne Göre Ekle:**

- **Game:** Object pooling, resource dispose, settings.ts SSOT
- **Web App:** Hooks, state management, responsive, a11y
- **API:** RESTful, error handling, auth, rate limiting
- **Mobile:** 60fps, asset optimization, offline support

---

## 2. HAFIZA (brain/)

```powershell
New-Item -ItemType Directory -Force -Path "brain","brain/chat-history"
New-Item -ItemType File -Force -Path "brain/chat-history/.gitkeep"
```

### brain/task.md

```markdown
# Görev Takibi

## 🔄 Aktif: [Görev]

## ✅ Tamamlanan: [x] Başlangıç

## 📋 Definition of Done

- [ ] Kod çalışıyor | [ ] Lint/Test geçti | [ ] Dokümantasyon güncellendi
```

### brain/implementation_plan.md

```markdown
# Uygulama Planı

## Mevcut Durum: [Analiz]

## Hedefler: 1. [Hedef]

## Teknik Kararlar: | State | DB | Gerekçe |
```

### brain/walkthrough.md

```markdown
# Walkthrough

## Kurulum: 1. Clone 2. Install 3. Run

## Önemli Dosyalar: `src/` - Kaynak kod
```

### brain/knowledge.md

```markdown
# Knowledge Base

## Mimari: [Yapı]

## Sorunlar: **Problem:** X | **Çözüm:** Y
```

---

## 3. README.md

```markdown
# [Proje Adı] 📚

[Açıklama]

## 🌟 Özellikler

- Özellik 1

## 🚀 Kurulum

[Komutlar]

## 🛠️ Teknolojiler

- **[Dil]** - [Framework]

## 📄 Lisans

[Lisans]
```

**Kurulum Komutları:**
| Dil | Kurulum | Çalıştırma |
|-----|---------|------------|
| JS/TS | `npm install` | `npm run dev` |
| Python | `pip install -r requirements.txt` | `python main.py` |
| Rust | `cargo build` | `cargo run` |
| Go | `go mod download` | `go run .` |
| C#/.NET | `dotnet restore` | `dotnet run` |

---

## 4. ROADMAP.md

```markdown
# Roadmap 🗺️

> 💡 Tamamlananlar: [CHANGELOG.md](CHANGELOG.md)

## 🎯 Sıradaki (v1.x)

- [ ] Hedef 1

## 🚀 Vizyon (v2.0)

- [ ] Hedef 1
```

---

## 5. CHANGELOG.md

```markdown
# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/)

## [Unreleased]

### ✨ Eklenenler: -
```

---

## 6. LICENSE

Seçilen lisansa göre tam metin oluştur (MIT, Apache 2.0, GPL v3, ISC, BSD-3, Unlicense)

---

## 7. .editorconfig

```editorconfig
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

**Dile Özel:** JS/TS (2), Python (4), Go (tab), C# (4)

---

## 8. .gitignore

```gitignore
# Brain
brain/chat-history/

# Environment
.env*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

**Dile Özel:**

- JS/TS: `node_modules/`, `dist/`, `build/`
- Python: `__pycache__/`, `venv/`, `*.pyc`
- C#: `bin/`, `obj/`
- Rust: `target/`

---

## 9. Environment Variables (.env.example)

```bash
# API Keys
API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here

# Database
DATABASE_URL=postgresql://localhost:5432/mydb

# App Config
NODE_ENV=development
PORT=3000
```

**Python (.env.example):**

```bash
# API Keys
API_KEY=your_api_key_here

# Database
DATABASE_URL=sqlite:///./app.db

# App Config
DEBUG=True
```

---

## 10. Tamamlandı (Faz 1)

```
✅ Oluşturulan:
📄 Kök: README, ROADMAP, CHANGELOG, LICENSE, GEMINI.md, .editorconfig, .gitignore, .env.example
📂 brain/: task.md, implementation_plan.md, walkthrough.md, knowledge.md
```

---

# FAZ 2: ALTYAPI (Tooling & Quality Gates)

> **⚠️ CRITICAL:** Aşağıdaki bölümlerde birden fazla dil/platform için örnek verilmiştir.
> **SADECE projenin diline/platformuna uygun olanları oluştur.**
> Örnek: JavaScript projesi için Python dosyaları oluşturma!

## 11. Test Framework

### JS/TS (Vitest)

**vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**src/test/setup.ts:**

```typescript
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

### Python

**pytest.ini:**

```ini
[pytest]
testpaths = tests
python_files = test_*.py
```

**tests/test_example.py:**

```python
def test_basic_assertion():
    assert 1 + 1 == 2

def test_string_operations():
    result = "hello".upper()
    assert result == "HELLO"
```

---

## 11. Linting & Formatting

### JS/TS

**.eslintrc.json:**

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": { "no-console": "warn" }
}
```

**.prettierrc:**

```json
{ "semi": true, "singleQuote": true, "tabWidth": 2 }
```

### Python

**pyproject.toml:**

```toml
[tool.black]
line-length = 88
```

---

## 12. Git Hooks (Husky)

**Kurulum:**

```bash
npx husky-init && npm install
```

**.husky/pre-commit:**

```bash
npm run lint
npm run typecheck
npm test -- --run
```

**commitlint.config.js:**

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

---

## 13. CI/CD (GitHub Actions)

**.github/workflows/ci.yml:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - run: npm run build
```

---

## 14. Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "preflight": "npm run lint && npm run typecheck && npm test -- --run && npm run build"
  }
}
```

---

## 15. Dependencies

### JS/TS

```bash
npm install -D vitest @testing-library/react eslint prettier husky @commitlint/cli
```

### Python

```
pytest>=7.0.0
black>=23.0.0
```

---

## 16. Tamamlandı (Faz 2)

```
✅ Oluşturulan Altyapı:
🧪 Test: vitest.config.ts, setup.ts, test_example.py
🎨 Lint: .eslintrc.json, .prettierrc
🪝 Hooks: .husky/pre-commit
🚀 CI/CD: .github/workflows/ci.yml
📦 Scripts: preflight, test, lint
```

**Sonraki:** `npm run preflight` ile test et.
