---
description: Doğrulama workflow - Browser, Terminal, File ve Test verification
---

# ✅ Verify Workflow

> **⚡ WORKFLOW AKTIF:** `/verify` workflow'u çalışıyor.  
> **Amaç**: Browser, terminal, file ve test doğrulamalarını stratejik kullanarak zaman kazanmak  
> **Ne zaman**: Debug, verification, runtime hataları ve test doğrulaması için

---

## ⚠️ Temel Prensip: Browser = Pahalı İşlem

Browser açmak **zaman alır** (model loading, page rendering, network requests).  
Bu yüzden **sadece gerçekten gerektiğinde** kullanılmalı.

**Kural:** Kod okuyarak çözebiliyorsan, browser açma! 🚫

---

## ✅ Browser'ı NE ZAMAN Kullanırım?

### 1. Debug & Verification 🔍

**Durum:** Kod değişikliği yaptım, runtime'da çalışıyor mu test etmem lazım

**Örnekler:**

- Import path'leri güncelledim → 404 hataları gitti mi?
- Module export düzelttim → Artık load oluyor mu?
- API endpoint değiştirdim → Network tab'de başarılı mı?

**Ne zaman AÇILIR:**

```
✅ Kod dosya sisteminde değişti VE
✅ Runtime'da etkisi var VE
✅ Console/Network/DOM'da görmem gerekiyor
```

**Örnek Senaryo:**

```
User: "Import path'lerini düzelttim"
AI:
1. view_file(index.html) → Path'leri kontrol et
2. browser_subagent → 404 hatalarını doğrula
3. Result: "File not found errors resolved" ✅
```

---

### 2. Console Error Analizi 🐛

**Durum:** Kullanıcı hata mesajı verdi ama detay yok, stack trace görmem gerekiyor

**Örnekler:**

- "Game crash oluyor" → Console'da tam hata mesajı ne?
- "Oyun başlamıyor" → Hangi satırda, hangi error?
- "Beyaz ekran geliyor" → JavaScript yüklenemiyor mu?

**Ne zaman AÇILIR:**

```
✅ Kullanıcı "çalışmıyor" dedi VE
✅ Kod okuyarak hata bulamadım VE
✅ Runtime error detayına ihtiyacım var
```

**Örnek Senaryo:**

```
User: "Oyun çöküyor ama neden bilmiyorum"
AI:
1. view_file(game.js) → Kod okurum, sorun tam belli değil
2. browser_subagent → Console'u açıp exact error görmem lazım
3. Result: "TypeError: Cannot read property 'x' of undefined at line 45"
4. Şimdi fix yapabilirim! ✅
```

---

### 3. UI/UX Testi 🎨

**Durum:** Button çalışıyor mu, modal açılıyor mu, animasyon doğru mu?

**Örnekler:**

- "OYUNA BAŞLA" butonuna tıklayıp oyunun başladığını doğrula
- Modal açılıyor mu, kapanıyor mu test et
- CSS değişikliği görsel olarak doğru mu?

**Ne zaman AÇILIR:**

```
✅ Görsel değişiklik yaptım VE
✅ Kullanıcı etkileşimi test etmem gerekiyor VE
✅ DOM state'ini görmem gerekiyor
```

**Örnek Senaryo:**

```
User: "Start button ekledim, test et"
AI:
1. view_file(index.html) → Button kodunu gördüm
2. browser_subagent → Butona tıklayıp oyunun başladığını doğrula
3. Result: "Game started successfully" ✅
```

---

### 4. Regression Testi ✅

**Durum:** Büyük refactor/değişiklik sonrası tüm uygulamanın çalıştığını doğrula

**Örnekler:**

- Entities.js'i 3 dosyaya böldüm → Oyun hala çalışıyor mu?
- ES6 module sistemine geçtim → Tüm importlar doğru mu?
- Build system değiştirdim → Production bundle çalışıyor mu?

**Ne zaman AÇILIR:**

```
✅ Major refactoring yaptım VE
✅ Birden fazla dosya etkilendi VE
✅ End-to-end test gerekiyor
```

**Örnek Senaryo:**

```
User: "Player, Enemy, LootBox'ı ayrı dosyalara taşıdım"
AI:
1. view_file(...) → Dosyaları kontrol et
2. Kod analizi → Import/export'lar doğru görünüyor
3. browser_subagent → Oyunu aç, tüm entity'ler spawn oluyor mu?
4. Result: "All entities working, no regression" ✅
```

---

## ❌ Browser'ı NE ZAMAN Kullanmam?

### 1. Kod Analizi 📖

**Durum:** Dosya okumak, kodu anlamak, yapıyı incelemek

❌ **YAPMA:**

```
User: "game.js'de ne var?"
AI: browser_subagent kullanır ❌
```

✅ **YAP:**

```
User: "game.js'de ne var?"
AI: view_file("game.js") kullanır ✅
```

**Neden:** Dosya içeriğini görmek için browser'a gerek yok, view_file daha hızlı!

---

### 2. Syntax Kontrol 🔧

**Durum:** Syntax hatalarını, lint hatalarını görmek

❌ **YAPMA:**

```
User: "Kod syntax hatası var mı?"
AI: browser_subagent açar, console'da hata arar ❌
```

✅ **YAP:**

```
User: "Kod syntax hatası var mı?"
AI:
1. view_file(dosya) → Kodu okur
2. Lint feedback'e bakar
3. Syntax hatalarını direkt görür ✅
```

**Neden:** Syntax hataları kod okuyarak veya lint ile bulunur, runtime gereksiz!

---

### 3. Küçük/Trivial Değişiklikler 🎨

**Durum:** Tek satır CSS, basit text değişikliği, yorum ekleme

❌ **YAPMA:**

```
User: "Button rengini kırmızı yap"
AI:
1. CSS günceller
2. browser_subagent açıp kırmızı olduğunu doğrular ❌ (Gereksiz!)
```

✅ **YAP:**

```
User: "Button rengini kırmızı yap"
AI:
1. view_file(style.css)
2. replace_file_content (color: red)
3. Done! ✅

EĞER kullanıcı "test et" derse → O zaman browser aç
```

**Neden:** Trivial değişiklikler için browser açmak zaman kaybı!

---

## 🎯 Decision Tree (Karar Ağacı)

```
Kullanıcı değişiklik istedi
│
├─ Runtime'da çalışacak mı?
│  │
│  ├─ EVET
│  │  │
│  │  ├─ Console/DOM/Network görmem gerekiyor mu?
│  │  │  │
│  │  │  ├─ EVET
│  │  │  │  └─ Kullanıcı "çalışmıyor" dedi mi?
│  │  │  │     │
│  │  │  │     ├─ EVET → 🌐 BROWSER AÇ
│  │  │  │     └─ HAYIR → Kullanıcıya sor veya kod analizi yap
│  │  │  │
│  │  │  └─ HAYIR
│  │  │     └─ 📖 Kod okuyarak analiz et
│  │  │
│  │  └─ Major refactoring mi? (>3 dosya değişti)
│  │     │
│  │     ├─ EVET → 🌐 BROWSER AÇ (Regression test)
│  │     └─ HAYIR → 📖 Kod analizi yeterli
│  │
│  └─ HAYIR (Sadece kod okuma/analiz)
│     └─ 📖 view_file kullan
```

---

## 📊 Gerçek Örnekler (Case Studies)

### Case 1: Import Path Değişikliği

**Senaryo:** Import path'leri değiştirdim

**AI Aksiyonu:**

```
1. view_file(index.html) → Path'leri kontrol et
2. ✅ KARAR: Browser aç
   Sebep: 404 hatalarını doğrulamam gerekiyor
3. browser_subagent → Network tab'de 404 kontrolü
4. Result: "File not found errors resolved" ✅
```

**Neden browser açıldı?** Runtime'da import path'ler yüklenecek, 404 hatasını ancak browser'da görebilirim.

---

### Case 2: ES6 Import Kaldırma

**Senaryo:** ES6 module syntax'ını kaldırdım

**AI Aksiyonu:**

```
1. view_file(dosyalar) → Değişiklikleri görüyorum
2. ✅ KARAR: Browser aç
   Sebep: "Human is not defined" runtime hatası olabilir
3. browser_subagent → Console'da hata kontrolü
4. Result: "Model unreachable" ❌ (Ama kod hatası bulundu)
```

**Neden browser açıldı?** "Human is not defined" hatası sadece runtime'da görünür, kod okuyarak bulamam.

---

### Case 3: Game Over Fix

**Senaryo:** Game over logic'i düzelttim

**AI Aksiyonu:**

```
1. view_file(game.js) → Fix'i yaptım
2. ✅ KARAR: Browser aç
   Sebep: Oyunun tam çalışıp çalışmadığını test
3. browser_subagent → Oyunu başlat, game over test et
4. Result: Model unreachable (Kullanıcı manuel test etti)
```

**Neden browser açıldı?** End-to-end test, tüm akışın çalıştığını doğrulamak için.

---

### Case 4: Syntax Hatası Düzeltme ❌ Browser Açılmadı

**Senaryo:** CSS'de noktalı virgül eksikti

**AI Aksiyonu:**

```
1. view_file(style.css) → Hatayı görüyorum
2. ❌ KARAR: Browser AÇMA
   Sebep: Syntax hatası, kod okuyarak görülebilir
3. replace_file_content → Düzelt
4. Done! ✅
```

**Neden browser açılmadı?** Syntax hatası browser'a gerek yok, kod analizi yeterli.

---

## 🔧 Browser Workflow Adımları

### Adım 1: Ön Kontrol

```
- [ ] Kod değişikliği runtime'da etkili mi?
- [ ] Console/DOM/Network görmem gerekiyor mu?
- [ ] Kod okuyarak çözebilir miyim?
```

**EĞER 3'ü de EVET → Browser aç**

---

### Adım 2: Browser Subagent Kullan

```javascript
browser_subagent(
  TaskName: "Verifying [feature/fix]",
  Task: "Navigate to localhost:port, click [action], verify [result]",
  RecordingName: "feature_verification"
)
```

---

### Adım 3: Sonucu Değerlendir

```
✅ Başarılı → Memory Bank'e kaydet
❌ Başarısız → Error analizi yap, kod düzelt, tekrar test
⚠️ Model unreachable → Kullanıcıya bildir, manuel test iste
```

---

## 🚀 Turbo Mode Entegrasyonu

### `/turbo` + `/browser-verify`

**Kombine kullanım:**

```
User: "/turbo /browser-verify game features"

AI:
1. Kod analizi (otomatik)
2. Browser açma kararı (decision tree)
3. EĞER açılmalıysa → browser_subagent (otomatik)
4. Sonuç raporu (otomatik)
```

**Not:** Turbo mode browser açma kararını değiştirmez, sadece hızlandırır!

---

## 🎯 Best Practices

### ✅ DO (Yap)

1. **Kod önce, browser sonra**
   - view_file ile önce analiz et
   - Browser sadece runtime testi için

2. **Kullanıcı feedback dinle**
   - "Çalışmıyor" derse → Browser aç
   - "Kontrol et" derse → Browser aç
   - Sormazsa → Kod analizi yeterli

3. **Major değişiklikler → Regression test**
   - > 3 dosya değişti → Browser aç
   - Refactoring → Test et

4. **Error detayı gerekiyorsa aç**
   - Stack trace
   - Console logs
   - Network errors

---

### ❌ DON'T (Yapma)

1. **Her değişiklikten sonra açma**
   - Tek satır CSS → Browser gereksiz
   - Text değişikliği → Browser gereksiz

2. **Kod okumak için açma**
   - view_file daha hızlı
   - Browser pahalı

3. **Syntax için açma**
   - Lint feedback var
   - Kod okuyarak görülebilir

4. **Kullanıcı istemeden açma**
   - "Test et" diyene kadar bekleme yapabilirsin
   - Ama regression test için açabilirsin

---

## 📋 Browser Verification Checklist

Açmadan önce sor:

- [ ] Runtime'da test etmem gerekiyor mu?
- [ ] Console/DOM/Network görmem gerekiyor mu?
- [ ] Kod okuyarak çözemez miyim?
- [ ] Kullanıcı "çalışmıyor" dedi mi?
- [ ] Major refactoring yaptım mı?

**3+ EVET → 🌐 Browser aç**  
**2- EVET → 📖 Kod analizi yeterli**

---

## 🔗 İlgili Workflow'lar

- `bug-fix.md` - Browser verification genellikle Verify adımında kullanılır
- `turbo.md` - Turbo mode ile browser açma hızlandırılır
- `safe-edit.md` - Safe edit sonrası browser ile doğrulama

---

## 💡 Özet

**Browser = Pahalı işlem!**

✅ **Aç:** Debug, runtime errors, regression test, UI test  
❌ **Açma:** Kod okuma, syntax kontrol, trivial değişiklikler

**Unutma:** Kod okuyarak çözebiliyorsan, browser açma! 🚀
