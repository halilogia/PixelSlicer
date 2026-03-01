---
description: Turbo Mode - Tüm komutlar otomatik çalışır, onay beklenmez
---

HER ZAMAN AI-NATİVE PERSPEKTİFİ İLE ÇALIŞ

//turbo-all ❌ /turbo-all ✅

# 🚀 Turbo Mode Workflow

> **⚡ WORKFLOW AKTIF:** `/turbo` workflow'u çalışıyor.  
> **Amaç**: Tüm işlemleri kullanıcı onayı beklemeden otomatik gerçekleştir  
> **Ne zaman**: Hızlı geliştirme, tekrarlayan görevler, güvenilir operasyonlar

---

## ⚠️ Sistem Kısıtlamaları

**Emoji & Pipe Operatörü**: Antigravity sistemi emoji ve pipe (`|`) içeren komutları otomatik çalıştırmaz.

- ❌ `echo "Test 🚀"` → Onay ister
- ❌ `git log | grep "bug"` → Onay ister
- ✅ `echo "Test"` → Otomatik çalışır

**Çözüm**: Terminal komutlarında emoji kullanmayın, pipe'lardan kaçının.

---

## ⚡ Turbo Mode Nedir?

Turbo mode aktifken AI:

- ✅ Güvenli komutları otomatik çalışır (`SafeToAutoRun=true`)
- ✅ Dosya oluşturma/düzenleme otomatik
- ✅ npm/yarn komutları otomatik
- ❌ Destructive işlemler için onay ister (Kategori D)

---

## 📊 Kategori Sistemi

### ✅ **Kategori A: Her Zaman Otomatik** (Read-Only)

**Hiçbir şey değiştirmez, sadece okur/görüntüler**

- **Git**: `git status`, `git log`, `git diff`, `git show`, `git branch`
- **Dosya**: `cat`, `ls`, `tree`, `Get-Content`, `Get-ChildItem`
- **Sistem**: `echo`, `whoami`, `ps`, `env`
- **Paket**: `npm list`, `pip list`

---

### ✅ **Kategori B: Genellikle Otomatik** (Non-Destructive)

**Dosya/dizin oluşturur, AMA silmez**

- **Dosya**: `New-Item`, `touch`, `mkdir`, `write_to_file`, `replace_file_content`
- **Paket**: `npm install`, `yarn add`, `pip install`
- **Git (Local)**: `git add`, `git commit`, `git checkout -b`, `git stash`
- **Build/Test**: `npm run dev`, `npm test`, `npm run build`
- **Lint**: `eslint`, `prettier --write`

**İstisna**: `.env` dosyası → ⚠️ Kullanıcıya sor

---

### ⚠️ **Kategori C: Koşullu** (Context-Dependent)

**Development OK, production/staging'de kullanıcıya sor**

- **Dependency**: `npm update`, `yarn upgrade`
- **Database**: `db:migrate`, `db:seed` (local)
- **Server**: `pm2 restart` (development)

**Environment Check**:

```
If (NODE_ENV == development || DB_HOST == localhost):
  → ✅ Otomatik
Else:
  → ❌ Kullanıcıya sor
```

---

### ❌ **Kategori D: Her Zaman Onay** (Destructive/Risky)

**Geri alınamaz, production etkileyebilir**

- **Silme**: `rm -rf`, `Remove-Item -Recurse`, `git clean -fd`, `drop table`
- **Remote Git**: `git push`, `git push --force`, `git rebase`
- **Deploy**: `npm publish`, `vercel --prod`, `netlify deploy --prod`
- **Database (Prod)**: `db:drop`, `db:reset`, `DELETE FROM`
- **Security**: `.env` edit, API keys, SSH keys

**Kural**: Turbo mode'da bile ASLA otomatik çalıştırma (`SafeToAutoRun=false`)

---

## 🔗 Pipe ve Complex Komutlar

**Pipeline'daki HER komutu** ayrı kategorize et:

#### ✅ Safe Pipeline (Tüm A/B)

```powershell
git log | Out-File results.txt  # A + B → ✅ Otomatik
```

#### ❌ Risky Pipeline (En az bir D)

```powershell
git log | Remove-Item  # A + D → ❌ Kullanıcıya sor
npm test && npm run deploy  # B + D → ❌ Kullanıcıya sor
```

**Kural**: Herhangi bir komut Kategori D ise → ❌ Kullanıcıya sor

---

## 🧠 Pattern Matching

AI bu pattern'leri otomatik algılar:

### ✅ Safe Patterns → Auto-run

- `git log.*`, `git show.*`, `git diff.*`, `git status.*`
- `npm (list|ls|view).*`
- `.*--help`, `.*-h`
- `(ls|dir|tree) .*`, `(cat|type) .*`

### ❌ Dangerous Patterns → Always ask

- `.*rm -rf.*`, `.*Remove-Item -Recurse.*`
- `.*--force.*`, `git push.*`, `.*deploy.*`, `.*publish.*`
- `.*(drop|truncate|delete).*` (SQL)
- `.*production.*`, `.*prod.*`

---

## 📋 Kullanım Senaryoları

### Senaryo 1: Hızlı Setup

```markdown
User: "/turbo Yeni React projesi kur"

AI: ✅ Otomatik:

1. npx create-react-app my-app
2. npm install axios react-router-dom
3. mkdir src/components
4. npm start
```

### Senaryo 2: Bug Fix + Test

```markdown
User: "/turbo player.js'deki bug'ı düzelt"

AI: ✅ Otomatik:

1. view_file, replace_file_content (düzeltme)
2. npm test
3. git add, git commit
```

---

## 🛡️ Güvenlik Kontrolleri

Turbo mode'da bile AI **her zaman**:

- ✅ Syntax doğruluğu kontrol

eder

- ✅ Path validasyonu yapar
- ✅ Memory Bank protokolünü uygular
- ✅ Safe edit protokolünü takip eder

---

## ⚙️ Aktivasyon

```
/turbo [görev açıklaması]
```

**Örnekler**:

```
/turbo Player sınıfına jump ekle ve test et
/turbo API documentation oluştur
```

---

## 🔄 Workflow Entegrasyonu

```
/turbo /bug-fix  → Bug fix workflow'u otomatik çalışır
/turbo /safe-edit  → Safe edit protokolü otomatik uygulanır
```

---

## 📊 Karar Algoritması

```
1. Dangerous pattern match (rm -rf, push, deploy)?
   → YES: Kategori D → ❌ Kullanıcıya sor
   → NO: Devam

2. Safe pattern match (git log, ls, --help)?
   → YES: Kategori A → ✅ Otomatik
   → NO: Devam

3. Pipeline var mı (|, &&, ||)?
   → YES: Her komutu kategorize et → En riskli karar verir
   → NO: Devam

4. Environment-dependent (migrate, update)?
   → YES: Environment check → Dev: ✅ / Prod: ❌
   → NO: Devam

5. Non-destructive write (install, commit, mkdir)?
   → YES: Kategori B → ✅ Otomatik
   → NO: Belirsiz → ❌ Kullanıcıya sor
```

---

## 🎯 Best Practices

### ✅ İyi Kullanım

- Tekrarlayan görevler (setup, test, build)
- Non-destructive operasyonlar
- Development ortamında çalışma
- Net tanımlı görevler

### ❌ Kötü Kullanım

- Production deployment
- Database migrations (production)
- Kritik dosya silme
- Belirsiz/risk içeren operasyonlar

---

## 📋 Turbo Mode Checklist

AI olarak:

- [ ] Komutu kategorize et (A/B/C/D)
- [ ] Pattern matching uygula
- [ ] Environment check (Kategori C için)
- [ ] Pipeline analizi (Her komutu ayrı değerlendir)
- [ ] SafeToAutoRun ayarla:
  - A/B → `true`
  - C (dev) → `true`
  - C (prod) → `false`
  - D → `false`
- [ ] Safety checks uygula
- [ ] Memory Bank protokolü
- [ ] Progress bildir

**Şüphe durumunda**: Kullanıcıya sor (güvenlik öncelikli)

---

## 🔗 İlgili Workflow'lar

- `bug-fix.md` - Turbo ile daha hızlı fix
- `safe-edit.md` - Turbo'da da safe edit uygulanır
- `brain` - Turbo'da bile güncellenir

---

## 🎉 Özet

**Turbo Mode** = Fast + Safe, NOT Fast + Reckless

- ⚡ Onay beklemeden çalış
- 🛡️ Güvenlik kontrollerini koru
- 📝 Brain'i güncelle
- ✅ Best practices uygula

**Remember**: Destructive işlemler her zaman onay ister!
