# PixelSlicer Architecture Refactoring Plan

> **Durum: TAMAMLANDI (2.0.0).** Bu dosya, React + TypeScript yeniden yazımının planıdır.
> Tamamlanan adımlar işaretlenmiştir; sonuç [ARCHITECTURE.md](../ARCHITECTURE.md) dosyasında anlatılır.
> Son kontrol: 2026-09-27

## Mevcut Durum (Plan yazıldığında)
- Tek dosya HTML implementasyonu (index.html - 55KB)
- Tailwind CSS kullanımı
- Vanilla JS ile yazılmış
- omggif ve JSZip harici kütüphaneler

## Hedef Durum (Ulaşıldı)
- Modüler, katmanlı mimari (Domain / Infrastructure / Presentation)
- Vite + TypeScript yapılandırması
- @/ alias desteği
- Tailwind yerine Vanilla CSS (CSS Variables)
- Framework: React + TypeScript

---

## Uygulama Adımları

### 1. Proje Yapılandırması
- [x] `package.json` - Vite, TypeScript, React, JSZip kurulumu
- [x] `tsconfig.json` - @ alias yapılandırması
- [x] `vite.config.ts` - Path mapping

### 2. Domain Katmanı (src/domain)
- [x] `FrameLogic.ts` - Grid hesaplama, çarpışma kontrolü, sprite sheet düzeni
- [x] `video/` - Video tipleri, limitler ve doğrulama
- [x] `atlas/` - Auto-trim, pivot, MaxRects bin packer, atlas düzeni (2.1.0)

### 3. Infrastructure Katmanı (src/infrastructure)
- [x] `GifService.ts` - omggif entegrasyonu
- [x] `ExportService.ts` - JSZip ve Blob yönetimi
- [x] `video/` - Kare çıkarma, grid oluşturma, video yükleme
- [x] `atlas/` - Worker client, renderer, Phaser/Godot/Unity exporter'ları (2.1.0)

### 4. Presentation Katmanı (src/presentation)
- [x] `tokens.ts` - Renk paleti (Tokyonight), spacing, motion sabitleri
- [x] `EditorViewModel.ts` - Ana state yönetimi (zoom, mevcut resim, frame koleksiyonu, pivot, trim)
- [x] React bileşenleri (Header, Sidebar, Canvas, Gallery, VideoUploader, AtlasExporter)

### 5. UI/Styles
- [x] `styles/main.css` - CSS custom properties ve tüm bileşen stilleri
- [x] `styles/video-uploader.css`
- [x] `styles/atlas.css` (2.1.0)
- [~] Tailwind yerine Vanilla CSS — tamamlandı; ek bileşenler için ayrı `components.css` yerine tek `main.css` kullanıldı (token sayısı düşük kaldığı için)

### 6. Main Entry
- [x] `main.tsx` - React app entry point
- [x] `index.html` - Minimal HTML shell

### 7. Sonradan gelenler
- [x] `src/workers/atlasWorker.ts` - OffscreenCanvas worker (2.1.0)
- [x] `src/testUtils/` - Test fixture'ları ve Vitest kurulumu (2.1.0)
- [x] `vitest.config.ts` + CI'da lint/test adımı

---

## Sapmalar
- **Tailwind yerine Vanilla CSS:** plan doğru uygulandı, ancak stiller `variables.css` + `components.css` olarak ikiye bölünmedi; tek `main.css` içinde BEM benzeri sınıflar kullanıldı.
- **React bileşen sayısı:** plan 4 bileşen öngördü, gerçekte 2 alt bileşen (`FrameThumbnail`, `GallerySection`) + 2 modal ailesi (`VideoUploader`, `AtlasExporter`) oluştu.
- **Klasörleme:** `domain/video` ve `domain/atlas` alt klasörleri planlanmamıştı; alan büyüdükçe ayrıldılar.

## Not
Plan onaylandıktan sonra Code moduna geçilerek implementasyon başlatılacak. → **Tamamlandı.**
