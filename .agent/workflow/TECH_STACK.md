# 🏗️ LinguaLearn Tech Stack & Recommendations

Bu doküman, projenin mevcut teknoloji yığınını ve gelecekte kod kalitesini/hızını artırmak için önerilen paketleri listeler.

## 🌟 Core Stack (Mevcut)

| Kategori         | Paket                 | Neden Seçildi?                                                          |
| :--------------- | :-------------------- | :---------------------------------------------------------------------- |
| **Framework**    | `React` + `Vite`      | Endüstri standardı, HMR hızı, modülerlik.                               |
| **Language**     | `TypeScript` (Strict) | Tip güvenliği, compile-time hata yakalama.                              |
| **State**        | `Zustand`             | Redux'tan 10x daha hafif, boilerplate yok, React dışında çalışabiliyor. |
| **Styling**      | `Tailwind CSS`        | Utility-first, Sovereign UI (Atomic Design) için en iyi temel.          |
| **UI Primitive** | `Radix UI`            | Erişilebilir (A11y), başsız (headless) bileşenler.                      |
| **Backend**      | `Firebase`            | Realtime Database, Auth, Hosting (Serverless kolaylığı).                |
| **Icons**        | `Lucide React`        | Tutarlı, hafif ve modern ikon seti.                                     |

---

## 🛠️ Developer Experience & Hygiene (Aktif)

Bu araçlar "Preflight" zincirinde otomatik çalışarak kod kalitesini korur.

| Paket                                  | Rolü         | Açıklama                                                                    |
| :------------------------------------- | :----------- | :-------------------------------------------------------------------------- |
| **`eslint-plugin-simple-import-sort`** | **Düzen**    | Importları (React -> Libs -> Internal) otomatik gruplar ve sıralar.         |
| **`eslint-plugin-unused-imports`**     | **Temizlik** | Kullanılmayan importları build sırasında **otomatik siler**.                |
| **`prettier`**                         | **Format**   | Kod stilini (tırnak, boşluk) standartlaştırır.                              |
| **`knip`**                             | **Avcı**     | Projede unutulmuş dosyaları, exportları ve paketleri bulur (`zombie:hunt`). |
| **`vitest`**                           | **Test**     | Jest'ten daha hızlı, Vite-native test koşucusu.                             |
| **`eslint-plugin-sonarjs`**            | **Analiz**   | Kod karmaşıklığını (Cognitive Complexity) ölçer ve raporlar.                |

---

## 🚀 Gelecek İçin Önerilen Paketler (Wishlist)

Projeyi bir sonraki seviyeye taşımak için bu paketlerin entegrasyonu önerilir:

### 1. `react-error-boundary`

- **Durum:** `LinguaErrorBoundary.tsx` zaten mevcut (Sovereign UI uyumlu). Harici pakete gerek yok.

### 2. `lefthook`

- **Neden:** `husky` yerine geçen daha hızlı (Go tabanlı) bir Git Hook yöneticisi.
- **Fayda:** Preflight komutlarını paralel çalıştırarak commit süresini yarıya indirir.
- **Kurulum:** `npm install lefthook -D`

### 3. `framer-motion`

- **Neden:** Tailwind Animate basit geçişler için iyidir, ancak karmaşık "Gesture" (sürükle-bırak) ve "Layout" animasyonları için Framer Motion endüstri lideridir.
- **Fayda:** Uygulamanın "Premium" hissiyatını artırır (iOS-like animasyonlar).

### 4. `react-hook-form` + `zod`

- **Neden:** Form yönetimi şu an manuel state (`useState`) ile yapılıyor. Büyük formlarda (Settings, Profile Edit) performans sorunu yaratabilir.
- **Fayda:** Render optimizations ve şema tabanlı doğrulama.

### 5. `storybook`

- **Neden:** UI bileşenlerini (`LinguaButton`, `LinguaCard`) izole ortamda geliştirmek ve belgelemek için.
- **Fayda:** "Design System" disiplinini zorunlu kılar. Sovereign UI için mükemmel bir vitrin olur.

---


**Not:** Bu liste 08.01.2026 tarihinde oluşturulmuştur.
