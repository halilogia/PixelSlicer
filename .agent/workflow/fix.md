---
description: Sistematik bug fix protokolü - TDD, regression önleme ve rollback
---

# 🐛 Fix Workflow

> **⚡ WORKFLOW AKTIF:** `/fix` workflow'u çalışıyor.  
> **Amaç**: TDD-first hata çözme, regression önleme, minimal atomic fixes  
> **Ne zaman**: Her bug raporu veya hata tespit edildiğinde

## 🎯 Bug Fix Metodolojisi

### 4 Adımlı Hata Analizi

```
1. REPRODUCE  → Hatayı yeniden üret
2. ANALYZE    → Root cause bul
3. FIX        → Atomic fix yap
4. VERIFY     → Test et, regression kontrol et
```

---

## 📋 Detaylı Adımlar

### Adım 1: REPRODUCE (Yeniden Üretme)

#### 1.1. Bilgi Toplama

**Kullanıcıdan/rapordan öğren:**

- ❓ Ne olması gerekiyordu?
- ❗ Ne oldu?
- 🔄 Nasıl reproduce edilir?
- 💻 Environment (browser, OS, version)?
- 📸 Screenshot/video var mı?

---

#### 1.2. Lokal Ortamda Reproduce Et

// turbo

```bash
# Uygulamayı çalıştır
npm run dev
```

**Aynı adımları takip et:**

1. Aynı sayfaya git
2. Aynı aksiyonu yap
3. Hatayı gözlemle

**Kaydet:**

- Console error mesajları
- Network tab (varsa failed requests)
- Stack trace

---

#### 1.3. Dokümante Et

```markdown
# Bug Raporu

## Beklenen Davranış

- [Ne olmalıydı]

## Gerçekleşen Davranış

- [Ne oldu]

## Reproduce Adımları

1. [Adım 1]
2. [Adım 2]
3. [Hata oluşuyor]

## Error Mesajları
```

[Console logs, stack trace]

```

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Project version: 1.2.3
```

---

#### 1.4. Test ile Reproduce (TDD Yaklaşımı) 🧪

**Mümkünse hatayı kanıtlayan bir Failing Test yaz:**

// turbo

```bash
# Test dosyası oluştur veya mevcut teste ekle
npm test -- --watch
```

**Red-Green-Refactor Döngüsü:**

```javascript
// test/player.test.js

describe('Player Position Bug', () => {
  test('should initialize position on construction', () => {
    const player = new Player();

    // Test şu an BAŞARISIZ olmalı (RED)
    expect(player.position).toBeDefined();
    expect(player.position.x).toBe(0);
    expect(player.position.y).toBe(0);
  });

  test('should not throw error on update', () => {
    const player = new Player();

    // Test şu an BAŞARISIZ olmalı (RED)
    expect(() => {
      player.update(0.016);
    }).not.toThrow();
  });
});
```

**Faydaları:**

- ✅ Fix'ten ÖNCE test RED (başarısız)
- ✅ Fix'ten SONRA test GREEN (başarılı)
- ✅ Regression'ı kalıcı olarak önler (test suite'e eklenir)
- ✅ Fix'in gerçekten çalıştığını kanıtlar

**Test Sonucu Kontrolü:**

```
BEFORE FIX: ❌ 2 tests failed
AFTER FIX:  ✅ 2 tests passed
```

---

### Adım 2: ANALYZE (Kök Sebep Analizi)

#### 2.1. Stack Trace İnceleme

```bash
# Error loglarını kontrol et
npm run logs:error

# Veya browser console'da
# Stack trace'den hangi dosya/satır?
```

**Örnek:**

```
TypeError: Cannot read property 'x' of undefined
    at Player.update (player.js:45)
    at Game.render (game.js:120)
```

→ `player.js` satır 45'te bir değişken undefined

---

#### 2.2. Dosyayı İncele

**Safe edit workflow'unu kullan:**

```javascript
// 1. Memory Bank oku
cat memorybank/activeContext.md

// 2. Dosyayı oku
view_file("js/player.js")

// 3. Satır 45'i bul ve context'i anla
```

---

#### 2.3. Root Cause Belirle

**5 Why Tekniği:**

```
1. Neden hata oldu?
   → position.x undefined

2. Neden position.x undefined oldu?
   → position objesi null

3. Neden position null oldu?
   → initialize() çağrılmamış

4. Neden initialize() çağrılmamış?
   → Constructor'da unutulmuş

5. Neden unutulmuş?
   → Refactoring sırasında kaybedilmiş
```

**Root Cause:** Constructor'da `this.initialize()` çağrısı eksik

---

#### 2.4. Impact Analysis (Etki Analizi) 🎯

**Bu değişiklik sistemin başka hangi parçalarını etkileyebilir?**

**Sorular:**

1. Hangi sınıflar bu dosyayı kullanıyor?
2. Hangi metodlar değiştirilecek kodu çağırıyor?
3. Public API değişiyor mu? (Breaking change)
4. Başka sistemler bu değişiklikten etkilenir mi?

**Örnek Analiz:**

```
Player sınıfını değiştiriyoruz:

├─ Enemy.js          → Player'a saldırıyor (etkiler mi?)
│  └─ ✅ Hayır, sadece public metodları kullanıyor
│
├─ SaveSystem.js     → Player verilerini kaydediyor
│  └─ ⚠️ EVET! position formatı değişirse etkilenir
│
├─ CollisionDetector → Player.position'ı okuyor
│  └─ ⚠️ EVET! position null olabilir artık
│
└─ UI/HUD.js         → Player koordinatlarını gösteriyor
   └─ ✅ Dolaylı etki, test edilmeli
```

**Etki Haritası Oluştur:**

| Etkilenen Dosya      | Etki Derecesi | Aksiyon                  |
| -------------------- | ------------- | ------------------------ |
| SaveSystem.js        | 🔴 Yüksek     | Test et, null check ekle |
| CollisionDetector.js | 🟡 Orta       | Test et                  |
| Enemy.js             | 🟢 Düşük      | Regression test yeter    |
| UI/HUD.js            | 🟢 Düşük      | Manuel kontrol           |

**Test Stratejisi:**

```bash
# Etkilenen dosyalara özel testler
npm test SaveSystem CollisionDetector

# Full integration test
npm run test:integration
```

**Checklist:**

- [ ] Etki analizi yapıldı
- [ ] Risk dosyaları belirlendi
- [ ] Breaking change'ler tespit edildi
- [ ] İlgili testler planlandı

---

### Adım 3: FIX (Atomic Düzeltme)

#### 3.1. Yedekleme (Risky Fix İçin)

```bash
# Git ile yedek
git add .
git commit -m "Before bug fix: [bug açıklaması]"

# Veya dosya backup
cp js/player.js js/player.backup.js
```

---

#### 3.2. Atomic Fix Yap

**TEK BİR ŞEYI DÜZELT:**

✅ **DOĞRU:**

```javascript
// Sadece missing initialization fix'i
constructor() {
  this.position = null;
  this.initialize();  // ← EKLENEN
}
```

❌ **YANLIŞ:**

```javascript
// Fix + refactoring + yeni feature (KARMAŞIK!)
constructor() {
  this.initialize();
  this.refactorMethod();
  this.addNewFeature();
}
```

---

#### 3.3. Safe Edit Workflow Kullan

```
1. view_file("js/player.js")
2. Replace exact target content
3. Sadece fix yapılan kodu değiştir
```

---

#### 3.4. Defensive Programming Ekle

**Gelecekte benzer hataları önle:**

✅ **İyi Örnek:**

```javascript
update(deltaTime) {
  // ❌ Eski (Savunmasız)
  // this.position.x += this.velocity.x * deltaTime;

  // ✅ Yeni (Defensive)
  if (!this.position) {
    console.error('Player position not initialized');
    return;
  }

  this.position.x += this.velocity.x * deltaTime;
}
```

---

### Adım 4: VERIFY (Doğrulama)

#### 4.1. Automated Tests

// turbo

```bash
# Unit testleri çalıştır
npm test

# İlgili test suite'i çalıştır
npm test -- --grep "Player"

# Coverage kontrol et
npm run test:coverage
```

**Kontrol:**

- [ ] Testler geçiyor mu?
- [ ] Coverage düştü mü? (kötü sinyal)
- [ ] Yeni test eklemeli miyim?

---

#### 4.2. Manuel Test - Original Bug

**Original bug senaryosunu test et:**

```
1. Bug'ı reproduce ettiğin adımları tekrarla
2. Hata düzelmiş mi?
3. Console'da error var mı?
```

---

#### 4.3. Regression Test

**Başka bir şey bozulmadı mı?**

```bash
# Full test suite
npm test

# E2E testler varsa
npm run test:e2e
```

**Manuel kontrol:**

- [ ] Ana işlevler çalışıyor mu?
- [ ] İlgili feature'lar etkilenmemiş mi?
- [ ] UI düzgün görünüyor mu?

---

#### 4.4. Edge Cases

**Farklı senaryolarda test et:**

✅ **Test edilmesi gerekenler:**

- Null/undefined inputs
- Empty arrays
- Boundary values (min/max)
- Concurrent operations
- Network failure (API varsa)

---

### Adım 5: DOCUMENTATION (Dokümantasyon)

#### 5.1. Memory Bank Güncelle

```markdown
# memorybank/progress.md

## 2025-11-28 - Player Position Bug Fix

### Sorun

- Player.update() içinde `position.x undefined` hatası
- Root cause: Constructor'da initialize() çağrısı eksikti

### Çözüm

- `js/player.js` - Constructor'a this.initialize() eklendi
- Defensive check eklendi: position null kontrolü

### Test Edildi

- Unit tests: ✅ Pass
- Manuel test: ✅ Bug çözüldü
- Regression test: ✅ No new issues

### Önlem

- Position null check eklendi (defensive programming)
```

---

#### 5.2. Kod İçinde Yorum (Gerekirse)

```javascript
// FIX: 2025-11-28 - Initialize position to prevent undefined error
// See: memorybank/progress.md#2025-11-28-player-position-bug-fix
constructor() {
  this.position = null;
  this.initialize();  // Must be called to set position
}
```

---

## 🔄 Rollback Decision Tree

```
Fix başarısız mı?
├─ EVET
│  ├─ 1. Git revert
│  │   git revert HEAD
│  │
│  ├─ 2. Veya backup'tan restore
│  │   cp player.backup.js player.js
│  │
│  ├─ 3. Memory Bank'e kaydet
│  │   "Fix attempt failed, rolled back"
│  │
│  └─ 4. Yeniden analyze et
│
└─ HAYIR
   └─ Devam et, deploy et
```

---

## ⚠️ Başarısız Fix Durumunda

### 2 Deneme Kuralı

**Aynı fix 2 kez başarısız olursa:**

```
1. ROLLBACK yap → Working version'a dön
2. PAUSE → Derin analiz yap
3. RETHINK → Farklı approach dene
4. DOCUMENT → Neden başarısız açıkla
```

**Memory Bank'e kaydet:**

```markdown
## Fix Attempt Failed (2x)

### Denenen Çözümler

1. [Çözüm 1] → Neden başarısız
2. [Çözüm 2] → Neden başarısız

### Rollback

- Restored: [backup dosyası]
- Current state: Working version

### Next Steps

- [ ] Farklı approach araştır
- [ ] Daha fazla debugging bilgisi topla
- [ ] Kod review iste
```

---

## 🎯 Best Practices

### ✅ DO (Yap)

1. **Atomic fixes** - Bir seferde bir sorun
2. **Defensive programming** - Input validation ekle
3. **Test before commit** - Mutlaka test et
4. **Document in Memory Bank** - Gelecek için kaydet
5. **Rollback planı** - Backup al

### ❌ DON'T (Yapma)

1. **Fix + refactor + feature** - Birden fazla değişiklik
2. **Without tests** - Test etmeden commit
3. **Without understanding** - Root cause bilmeden fix
4. **Breaking changes** - Backward compatibility kır
5. **Undocumented** - Memory Bank'i güncelleme

---

## 📋 Bug Fix Checklist

- [ ] **REPRODUCE**
  - [ ] Bug'ı lokal ortamda reproduce ettim
  - [ ] Error mesajlarını kaydettim
  - [ ] Reproduce adımlarını dokümante ettim

- [ ] **ANALYZE**
  - [ ] Stack trace inceledim
  - [ ] Root cause buldum
  - [ ] 5 Why tekniği uyguladım

- [ ] **FIX**
  - [ ] Backup aldım (risky değişiklik için)
  - [ ] Safe edit workflow kullandım
  - [ ] Atomic fix yaptım
  - [ ] Defensive programming ekledim

- [ ] **VERIFY**
  - [ ] Unit testler geçiyor
  - [ ] Original bug düzeldi
  - [ ] Regression yok
  - [ ] Edge cases test edildi

- [ ] **DOCUMENT**
  - [ ] Memory Bank güncellendi
  - [ ] Kod yorumu eklendi (gerekirse)
  - [ ] Rollback planı var

---

## 🔗 İlgili Workflow'lar

- `safe-edit.md` - Güvenli kod düzenleme
- `memory-bank-update.md` - Dokümantasyon
