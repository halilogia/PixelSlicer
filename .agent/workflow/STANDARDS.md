# Sektör Standartları Rehberi 📚

> LinguaLearn'de kullandığımız ve kullanmadığımız standartların karşılaştırmalı rehberi.

---

## 1. Kod Standartları

### ✅ Kullandıklarımız

#### ESLint + SonarJS + Simple Import Sort

**Ne:** Gelişmiş kod analizi.
**Neden:**
- **SonarJS:** Cognitive Complexity (Bilişsel Karmaşıklık) > 15 ise uyarır.
- **Import Sort:** Importları React -> External -> Internal sırasına dizer (Auto-fix).
- **Unused Imports:** Kullanılmayan importları otomatik siler.

#### JSCPD (Copy/Paste Detector)
**Ne:** Kod tekrarlarını bulur.
**Neden:** DRY (Don't Repeat Yourself) prensibine uyum sağlar.

#### TypeScript Strict Mode


**Ne:** JavaScript/TypeScript kod kalitesi denetleyicisi.
**Neden:** Hataları erken yakalar, kod tutarlılığı sağlar.
**Örnek:** `no-console: warn` → Console.log kullanımını uyarır.

#### Prettier

**Ne:** Otomatik kod formatlayıcı.
**Neden:** Kod stili tartışmalarını bitirir, her şey aynı görünür.
**Örnek:** Tek tırnak mı çift tırnak mı? Prettier karar verir.

#### TypeScript Strict Mode & Any-Detector


**Ne:** TypeScript'in en katı tip kontrolü.
**Neden:** `any` kullanımını zorlaştırır, hataları compile-time'da yakalar.

### ❌ Kullanmadıklarımız

#### JSDoc

**Ne:** JavaScript koduna yorum olarak tip ekleme.
**Neden Kullanmıyoruz:** TypeScript zaten tip güvenliği sağlıyor. Gereksiz tekrar.

#### Standard.js

**Ne:** "Sıfır konfigürasyon" linter.
**Neden Kullanmıyoruz:** ESLint daha esnek, özelleştirilebilir.

---

## 2. Mimari Standartları

### ✅ Kullandıklarımız

#### Shadcn/UI (Atomik Temel)

**Ne:** Radix UI primitives üzerine inşa edilmiş Tailwind bileşenleri.
**Neden:**

- **AI Uyumu:** %95 daha az hata payı.
- **Erişilebilirlik:** Radix sayesinde mobil ve WCAG uyumlu.
- **DNA Uyumu:** Kod tamamen projemize ait, değiştirilebilir.
  **Konum:** `src/shared/components/ui/`

#### FAI 2.0 (Federal AI Architecture) & AI-Native Protocol


**Ne:** Feature-Sliced Design'ın (FSD) hız ve AI uyumu için optimize edilmiş hali.
**Neden:**

- **AI Bağlamı:** AI'nın etki alanını (scope) sınırlar içinde tutar.
- **Sovereign Eyaletler:** Her özellik dikey bütünlüğe sahiptir (UI + Logic + Style).
- **Hukuki Haberleşme:** Eyaletler birbirine dokunamaz, sadece `core/contracts` üzerinden haberleşir.
  **Kurallar:**

1. **One Import Distance:** Mantık (Logic) dosyası bileşene tek bir import uzaklığında olmalıdır.
2. **Page Consolidation:** Sayfalar (Pages) ayrı bir klasör değildir; Feature'ların giriş noktalarıdır.
3. **Gümrük Kapısı (Customs Gate):** Statik veri (`src/data`) sadece işlenmiş ve tiplendirilmiş halde Features'lara servis edilir.

### ❌ Kullanmadıklarımız

#### MVC (Model-View-Controller)

**Ne:** Backend'de popüler mimari.
**Neden Kullanmıyoruz:** React için eski. Component-based mimari daha uygun.

#### Layered Architecture

**Ne:** Presentation → Business → Data katmanları.
**Neden Kullanmıyoruz:** Feature-First daha modüler.

---

## 3. Test Standartları

### ✅ Kullandıklarımız

#### Vitest

**Ne:** Vite tabanlı test framework'ü.
**Neden:** Hızlı, modern, Vite ile entegre.

#### Testing Library

**Ne:** Kullanıcı gibi test et (DOM sorguları).
**Neden:** "Implementation details" yerine kullanıcı deneyimini test eder.

#### Unit Tests

**Ne:** Tek bir fonksiyonu izole test et.
**Neden:** Hızlı, güvenilir, regression önler.

### ❌ Kullanmadıklarımız

#### E2E (Cypress/Playwright)

**Ne:** Tarayıcıda gerçek kullanıcı senaryoları test et.
**Neden Henüz Yok:** Proje küçük, unit testler yeterli. İleride eklenebilir.

#### TDD (Test-Driven Development)

**Ne:** Önce test yaz, sonra kodu yaz.
**Neden Kullanmıyoruz:** Prototip aşamasında yavaşlatır. Kararlı özelliklerde uygulanabilir.

---

## 4. Versiyon Standartları

### ✅ Kullandıklarımız

#### SemVer (Semantic Versioning)

**Ne:** `MAJOR.MINOR.PATCH` (Örn: 1.13.0)
**Neden:** Değişimin etkisini anında gösterir.
**Örnek:**

- `1.13.1` → Bug fix
- `1.14.0` → Yeni özellik
- `2.0.0` → Breaking change

#### Conventional Commits

**Ne:** Commit mesajlarını standartlaştır (`feat:`, `fix:`, `docs:`).
**Neden:** CHANGELOG otomatik oluşturulabilir, commit geçmişi okunabilir.
**Örnek:** `feat: add listening module`

### ❌ Kullanmadıklarımız

#### CalVer (Calendar Versioning)

**Ne:** Tarih bazlı versiyon (Örn: 2024.12.01)
**Neden Kullanmıyoruz:** Değişimin etkisini göstermez. Ubuntu gibi OS'ler için uygun.

---

## 5. Dokümantasyon Standartları

### ✅ Kullandıklarımız

#### Keep a Changelog

**Ne:** CHANGELOG.md formatı.
**Neden:** Kullanıcılar değişiklikleri kolayca görebilir.

#### Markdown

**Ne:** `.md` dosyaları ile dokümantasyon.
**Neden:** GitHub'da otomatik render, basit, okunabilir.

### ❌ Kullanmadıklarımız

#### Swagger/OpenAPI

**Ne:** API dokümantasyonu standardı.
**Neden Kullanmıyoruz:** Backend API projesi değiliz. Frontend uygulamasıyız.

#### Storybook

**Ne:** UI component'leri için interaktif dokümantasyon.
**Neden Henüz Yok:** Küçük proje. İleride component library büyürse eklenebilir.

---

## 6. State Management Standartları

### ✅ Kullandıklarımız

#### Zustand (Flux Pattern)

**Ne:** Minimal global state yönetimi.
**Neden:** Redux'tan basit, Context API'den güçlü.

#### Slice Pattern

**Ne:** Store'u mantıksal dilimlere ayır (auth, learning, stats).
**Neden:** God Object'i önler, her dilim bağımsız.

### ❌ Kullanmadıklarımız

#### Redux

**Ne:** En popüler state yönetimi.
**Neden Kullanmıyoruz:** Çok verbose (boilerplate). Zustand daha minimal.

#### MobX

**Ne:** Observable-based state yönetimi.
**Neden Kullanmıyoruz:** Öğrenme eğrisi dik, Zustand yeterli.

---

## 7. Styling Standartları

### ✅ Kullandıklarımız

#### Tailwind CSS (Hibrit Yaklaşım)

**Ne:** Utility-first CSS framework.
**Nasıl Kullanıyoruz:**

```tsx
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-700">
```

**Neden:**

- Hızlı prototipleme
- Tutarlı spacing sistemi (4px, 8px, 16px...)
- Dark mode desteği (`dark:` prefix)
- Custom animations (`tailwind.config.js`'de shimmer, gradient-x)

**Neden Hibrit:** Bazı karmaşık animasyonlar için Vanilla CSS de kullanıyoruz.

#### CSS Modules (Eski Kod)

**Ne:** Her component'in kendi `.module.css` dosyası.
**Neden Kısmen:** Tailwind'e geçiş sırasında eski CSS Modules kaldı. Yavaş yavaş Tailwind'e dönüştürülüyor.

#### BEM Naming (Eski Kod)

**Ne:** Block-Element-Modifier (Örn: `card__title--active`)
**Neden Kısmen:** Eski kodda BEM var. Yeni kodda Tailwind kullanıyoruz.

### ❌ Kullanmadıklarımız

#### Styled Components

**Ne:** CSS-in-JS (JavaScript içinde CSS).
**Neden Kullanmıyoruz:** Runtime overhead. Tailwind daha performanslı (build-time CSS).

---

## 8. Git Standartları

### ✅ Kullandıklarımız

#### Git Flow (Basitleştirilmiş)

**Ne:** `main` branch kararlı, feature branch'lerde geliştirme.
**Neden:** Paralel geliştirme, kolay rollback.

#### Husky (Git Hooks)

**Ne:** Commit öncesi otomatik lint/test.
**Neden:** Bozuk kod asla commit edilmez.

### ❌ Kullanmadıklarımız

#### GitHub Flow

**Ne:** Sadece `main` ve feature branch'ler (develop yok).
**Neden Kullanmıyoruz:** Küçük ekip için fazla basit. Git Flow daha güvenli.

#### Trunk-Based Development

**Ne:** Herkes doğrudan `main`'e commit atar.
**Neden Kullanmıyoruz:** Riskli. Feature branch'ler daha güvenli.

---

---

## 9. Klasör Yapısı Standartları (Mimari DNA)

LinguaLearn'de klasör yapısı, uygulamanın **bilişsel haritasıdır.** Her klasörün tekil bir ruhu ve sorumluluğu vardır:

### 📂 `src/core` (Beyin 🧠)

- **Ne:** Uygulamanın en derin mantığı, merkezi motorlar.
- **Sorumluluk:** Algoritmalar (SM-2 SRS), merkezi hesaplayıcılar, evrensel orkestratörler.
- **Kural:** Features klasöründeki her şey burayı kullanır ama Core, Features'ın ismini bilmez.

### 📂 `src/features` (Odalar 🏠)

- **Ne:** Dikey dilimlenmiş (Vertical Slice) kullanıcı özellikleri.
- **Sorumluluk:** Belirli bir amaca hizmet eden UI, Logic ve Style (Örn: `listening`, `battle`).
- **Kural:** Bir özellik silindiğinde sistemin sadece o kısmı ölmelidir. Eğer %20'den fazlası ölüyorsa, o yapı `core`'a taşınmalıdır.

### 📂 `src/shared` (Borular 🛠️)

- **Ne:** Uygulamanın her yerine su taşıyan altyapı.
- **Sorumluluk:** Genel UI bileşenleri (Button, Input), genel yardımcı fonksiyonlar (Utils).
- **Kural:** Hiçbir iş mantığı (Business Logic) içermez, sadece görünüm ve araç sunar.

### 📂 `src/data` (Depo 📦)

- **Ne:** Uygulamanın hammaddesi.
- **Sorumluluk:** JSON veri setleri, kelime listeleri, gramer içerikleri.
- **Kural:** Kod içermez, sadece yapılandırılmış bilgi saklar.

### 📂 `src/stores` (Banka 🏦)

- **Ne:** Verilerin güvende tutulduğu merkezi kasa.
- **Sorumluluk:** Global state (Zustand), XP, Level, User bilgileri.
- **Kural:** Veri burada saklanır ama işlenmesi `core` veya `features` içinde yapılır.

### 📂 `src/types` (Sözleşme 📜)

- **Ne:** Projenin ortak dili (Duyuru Panosu).
- **Sorumluluk:** Global TypeScript interface ve type tanımları.
- **Kural:** Mantık barındırmaz, sadece "hangi verinin neye benzediğini" söyler.

### 📂 `src/api` (Dış Dünya 🌍)

- **Ne:** Uygulamanın dışarısıyla konuştuğu elçilik.
- **Sorumluluk:** Backend servisleri, API çağrıları, dış URL tanımları.

### 📂 `src/assets` (Müze 🖼️)

- **Ne:** Görsel ve işitsel varlıklar.
- **Sorumluluk:** İkonlar, resimler, logo, ses dosyaları.

### 📂 `src/hooks` (Davranışlar 🎣)

- **Ne:** Tekrar eden kullanıcı davranışlarının şablonları.
- **Sorumluluk:** `useSwipe`, `useAudio`, `useInterval` gibi "yetenek-bazlı" kancalar.

---

## 📖 Sözlük

| Terim                | Anlamı                          |
| -------------------- | ------------------------------- |
| **Boilerplate**      | Tekrar eden, şablon kod         |
| **Breaking Change**  | Eski kodu kıran değişiklik      |
| **Regression**       | Eski bir hatanın geri gelmesi   |
| **Verbose**          | Gereksiz uzun, karmaşık         |
| **Runtime Overhead** | Çalışma anında performans kaybı |

---

**Son Güncelleme:** 2026-01-08 (AI-Native Evolution)
