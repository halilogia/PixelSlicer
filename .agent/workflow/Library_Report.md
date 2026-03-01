# 📂 GitHub Projeleri - Kütüphane Analizi
**Oluşturulma Tarihi:** 07.02.2026
**Konum:** `/home/halile/Masaüstü/GitHub/In Progress/`

Bu rapor, geliştirme aşamasındaki projelerin kullandığı temel kütüphaneleri ve teknolojileri listeler.

---

## 1. AI Dublaj Eklentisi
**Klasör:** `AI Dublaj Eklentisi`
*   **Tanım:** YouTube videoları için gerçek zamanlı AI Türkçe dublaj eklentisi.
*   **Dependencies:** (Belirtilmemiş)
*   **DevDependencies:** `live-server`

## 2. ArchAcademy (CA)
**Klasör:** `CA`
*   **Tanım:** Mimari eğitim platformu.
*   **Dependencies:**
    *   `react`, `react-dom`, `react-router-dom` (Core)
    *   `framer-motion` (Animasyon)
    *   `lucide-react` (İkonlar)
*   **DevDependencies:** `vite`, `typescript`, `knip`, `eslint`

## 3. Voxel FPS Engine
**Klasör:** `FPS`
*   **Tanım:** Voxel tabanlı FPS oyun motoru.
*   **Dependencies:**
    *   `three` (3D Rendering)
    *   `cannon-es` (Fizik)

## 4. FocusFollowAI (Rhei AI)
**Klasör:** `FocusFollowAI`
*   **Tanım:** Odaklanma ve takip uygulaması (Capacitor/Mobile).
*   **Dependencies:**
    *   `@capacitor/core`, `@capacitor/android` (Mobile Bridge)
    *   `firebase` (Backend)
    *   `@dnd-kit/core` (Drag & Drop)
    *   `tailwindcss` (Styling)
    *   `react`

## 5. Hearts of Iron Modern
**Klasör:** `HOI`
*   **Tanım:** Strateji oyunu harita testi.
*   **Dependencies:**
    *   `d3` (Veri Görselleştirme/Harita)
    *   `topojson-client` (Harita Verisi)
    *   `react`

## 6. LinguaLearn (Web Version)
**Klasör:** `LinguaLearn_Web_Version`
*   **Tanım:** Dil öğrenme platformu (Kapsamlı).
*   **Dependencies:**
    *   `firebase` (Backend)
    *   `zustand` (State Management)
    *   `@capacitor/...` (Mobile)
    *   `canvas-confetti` (Efekt)
    *   `zod` (Validation)
    *   `@radix-ui/...` (UI Components)

## 7. MobRunner3D
**Klasör:** `MobRunner3D`
*   **Tanım:** Three.js tabanlı koşu/savaş oyunu.
*   **Dependencies:**
    *   `three`
    *   `@capacitor/...`

## 8. Suzerain Game
**Klasör:** `Suzerain`
*   **Tanım:** Politik metin tabanlı oyun prototipi.
*   **Dependencies:**
    *   `react`
    *   `lucide-react`

## 9. Card Politics Game (Hearts of Iron Modern Fork?)
**Klasör:** `card-politics-game`
*   **Tanım:** Harita ve kart tabanlı politika oyunu.
*   **Dependencies:**
    *   `d3`, `topojson-client` (Harita)
    *   `howler` (Ses)
    *   `immer` (State)
    *   `zustand` (State Management)
    *   `framer-motion`

## 10. Detective Mystery - Noir Tales
**Klasör:** `detective-mystery---noir-tales`
*   **Tanım:** Dedektiflik oyunu.
*   **Dependencies:**
    *   `react`

## 11. Vibe Engine (Standalone)
**Klasör:** `engine-standalone`
*   **Tanım:** TypeScript ECS Oyun Motoru & Editörü (Electron).
*   **Dependencies:**
    *   `three`
*   **DevDependencies:**
    *   `electron`, `electron-builder`
    *   `javascript-obfuscator`
    *   `react`, `zustand` (Editör UI için devDep olarak eklenmiş)

## 12. Etheria: Card Wars
**Klasör:** `etheria_-card-wars`
*   **Tanım:** Kart savaş oyunu.
*   **Dependencies:**
    *   `@tsparticles/react` (Parçacık Efektleri)
    *   `framer-motion`
    *   `use-sound`
    *   `zustand`
    *   `firebase`
    *   `lucide-react`
    *   `@capacitor/...`

## 13. Kingdom Cards: Royal Duel
**Klasör:** `kingdom-cards_-royal-duel`
*   **Tanım:** GenAI destekli kart oyunu.
*   **Dependencies:**
    *   `@google/genai` (Google AI SDK)
    *   `react`

## 14. Spellbound: Elemental Duel
**Klasör:** `spellbound_-elemental-duel`
*   **Tanım:** Büyü düellosu oyunu.
*   **Dependencies:**
    *   `@google/genai`
    *   `react`

## 15. Sweet Galaxy Match 3
**Klasör:** `sweet-galaxy-match-3`
*   **Tanım:** 3'lü eşleştirme oyunu.
*   **Dependencies:**
    *   `framer-motion`
    *   `react`

## 16. Tehlikeli Kıyılar
**Klasör:** `tehlikeli-kıyılar`
*   **Tanım:** Three.js + React Fiber macera oyunu/prototipi.
*   **Dependencies:**
    *   `@react-three/fiber`, `@react-three/drei` (R3F Ecosystem)
    *   `three`
    *   `@google/genai`
    *   `lucide-react`

## 17. Tropical Merge Paradise
**Klasör:** `tropical-merge-paradise`
*   **Tanım:** Birleştirme (Merge) oyunu.
*   **Dependencies:**
    *   `react`

---
**Özet:**
*   **Oyun Motoru:** Çoğunlukla `React` + `Three.js` (@react-three/fiber) veya doğrudan `Three.js` kullanılıyor.
*   **AI:** `Kingdom Cards`, `Spellbound` ve `Tehlikeli Kıyılar` projelerinde `@google/genai` entegrasyonu var.
*   **State Management:** Karmaşık projelerde `Zustand` tercih ediliyor (`LinguaLearn`, `Etheria`, `Card Politics`).
*   **Mobile:** `FocusFollowAI`, `LinguaLearn`, `MobRunner3D` ve `Etheria` projeleri `@capacitor` ile mobil uyumlu.
