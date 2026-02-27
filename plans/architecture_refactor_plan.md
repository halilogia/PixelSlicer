# PixelSlicer Architecture Refactoring Plan

## Mevcut Durum
- Tek dosya HTML implementasyonu (index.html - 55KB)
- Tailwind CSS kullanımı
- Vanilla JS ile yazılmış
- omggif ve JSZip harici kütüphaneler

## Hedef Durum
- Modüler, katmanlı mimari (Domain/Infrastructure/Presentation)
- Vite + TypeScript yapılandırması
- @/ alias desteği
- Tailwind yerine Vanilla CSS (CSS Variables)
- **Framework: React + TypeScript** (Elite standartları için Framer Motion gereksinimi)

---

## Uygulama Adımları

### 1. Proje Yapılandırması
- [ ] `package.json` - Vite, TypeScript, React, JSZip kurulumu
- [ ] `tsconfig.json` - @ alias yapılandırması
- [ ] `vite.config.ts` - Path mapping

### 2. Domain Katmanı (src/domain)
- [ ] `FrameLogic.ts` - Grid hesaplama, çarpışma kontrolü, sprite sheet düzeni

### 3. Infrastructure Katmanı (src/infrastructure)
- [ ] `GifService.ts` - omggif entegrasyonu
- [ ] `ExportService.ts` - JSZip ve Blob yönetimi

### 4. Presentation Katmanı (src/presentation)
- [ ] `tokens.ts` - Renk paleti (Tokyonight), spacing, motion sabitleri
- [ ] `EditorViewModel.ts` - Ana state yönetimi (zoom, mevcut resim, frame kolleksiyonu)
- [ ] React bileşenleri (Header, Sidebar, Canvas, Gallery)

### 5. UI/Styles
- [ ] `styles/variables.css` - CSS custom properties
- [ ] `styles/components.css` - Bileşen stilleri

### 6. Main Entry
- [ ] `main.tsx` - React app entry point
- [ ] `index.html` - Minimal HTML shell

---

## Not
Plan onaylandıktan sonra Code moduna geçilerek implementasyon başlatılacak.
