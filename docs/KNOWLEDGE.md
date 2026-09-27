# 🧠 Knowledge Base

PixelSlicer geliştirme kuralları ve proje sözleşmeleri.

## 1. Katmanlı mimari

Bağımlılıklar daima içeri doğrudur: `presentation → infrastructure → domain`, ve `domain` hiçbir şeye bağlı değildir.

| Katman | Konum | Kural |
| --- | --- | --- |
| **domain** | `src/domain/` | Saf mantık, DOM yok, React yok, tamamı test altında. `FrameLogic`, `video/*`, `atlas/*` |
| **infrastructure** | `src/infrastructure/` | Tarayıcıya dokunan her şey: canvas, JSZip, worker, motor descriptor'ları |
| **presentation** | `src/presentation/` | `EditorViewModel` (gözlenebilir state) ve React bileşenleri |
| **workers** | `src/workers/` | Uzun işler için giriş noktaları; iş mantığını `infrastructure`'dan alır, kopyalamaz |

Path alias'ları `tsconfig.json`, `vite.config.ts` ve `vitest.config.ts` içinde **birlikte** tanımlıdır; yeni bir alias eklenirken üçü de güncellenir.

## 2. Domain sözleşmeleri

- Her pure fonksiyon girdi/çıktısını açık tiplerle alır; `ImageData`, `OffscreenCanvas` gibi DOM tipleri domain'e sızmaz (`PixelBuffer` gibi yapısal tipler kullanılır).
- `Frame` nesnesi üzerinde taşınan veri (`pivot`) frame ile birlikte yaşar; ayrı bir `Map`/`Record` lookup'ı index çakışması yaratır (grid ve manuel kareler aynı `index` değerlerini kullanır).
- Yeni bin packer / exporter yazılacaksa önce domain'de saf fonksiyon, sonra infrastructure'da tarayıcı sarmalayıcı.

## 3. Worker kuralları

- Worker dosyaları yalnızca mesaj protokolünü bilir; iş mantığı `infrastructure` ile paylaşılır, kopyalanmaz.
- `self` DOM lib tarafından tiplendiği için worker kapsamı dosya içinde `interface WorkerScope` ile tanımlanır (WebWorker lib eklenmez, tip çakışması olur).
- Worker desteklenmiyorsa `AtlasWorkerClient` / `FrameExportWorkerClient` şeffafça ana iş parçacığına düşer; bu yol da test edilir.
- Worker'dan gelen `ImageBitmap`'ler modal kapanınca veya sonuç değişince `close()` ile serbest bırakılır.

## 4. Kod stili

- Tip bazlı alias import (`import type { Frame } from '@domain/FrameLogic'`).
- Dosya adı: domain'de `PascalCase.ts`, testler `*.test.ts` aynı klasörün altında.
- Yorumlar yalnızca **ne yapılmadığını** açıklar; bariz kod için yorum yazılmaz.
- `strict`, `noUnusedLocals`, `noUnusedParameters` açık: `npm run lint` temiz olmadan commit edilmez.

## 5. Release kuralları

- Biten işler `ROADMAP.md`'den düşer, `CHANGELOG.md`'ye taşınır. ROADMAP yalnızca gelecek işi tutar.
- `npm run lint && npm test && npm run build` yeşil olmadan push yapılmaz (deploy workflow aynı adımları CI'da çalıştırır).
- Mimari değişikliklerde `ARCHITECTURE.md` güncellenir; `ARCHITECTURE_AUTO_GENERATED.md` **elle düzenlenmez**, `npm run docs:arch` ile yeniden üretilir.
- `package.json` sürümü ile atlas metadata'sındaki `ATLAS_APP_VERSION` elle birlikte güncellenir.

## 6. Tarayıcı kaynak yönetimi

- Object URL'ler `ImageLoader` ve `useFrameThumbnails` üzerinden alınır: yükleme bittikten **ve** hata durumunda `revokeObjectURL` çağrılır. `URL.createObjectURL` doğrudan çağrılmaz.
- Canvas bağlam durumu (stroke/fill/font/lineWidth) döngü içinde yalnızca değer değiştiğinde atanır; aynı değeri tekrar atamak pahalıdır.
- Worker'dan dönen `ImageBitmap`'ler iş bitince `close()` ile serbest bırakılır.
- Uzun süreli döngüler `setInterval` değil `requestAnimationFrame` kullanır; kalan süre hesaba katılır, kare atlarken kayma olmaz.
- `putImageData` argümanı **marka kontrolü** yapar: `{data, width, height}` şeklinde düz bir nesne gerçek tarayıcıda reddedilir. Piksel üreten her fonksiyon gerçek `ImageData` örneği döndürmeli (`createImageData` / `toNativeImageData`).

## 7. Performans kuralları

- Kare dizileri **değişmezdir** (`addManualFrame`, `updateManualFrame`, `resizeManualFrame`, `deleteManualFrame` yeni dizi atar). Bu kimlik, `getFrames()` / `getActiveFrames()` önbelleğinin geçerli olma koşuludur; in-place `push`/`splice` eklemek sessizce bayat liste üretir.
- Ağır iş (atlas trim/paket/raster, ZIP/GIF export, arka plan rengi silme) bir Web Worker'da çalışır; ana iş parçacığı yolu **aynı** pipeline'ı kullanır, kopya kod yoktur.
- Asenkron state güncellemeleri **jetonla korunur**: yavaş bir çalışma daha yenisinin sonucunu ezmez (`EditorViewModel.processedToken`).
- Packer iki fazlıdır: (1) her şeyi sığdıran en küçük sayfa, (2) sığmayan durumda izin verilen en büyük sayfayı tam animasyon gruplarıyla doldur. "Bir sprite = bir sayfa" gibi dejenere çıktılar regresyondur.
- Performans değişikliği `npm run bench` ile kanıtlanır, tahminle değil. Taban değerler `docs/BENCHMARKS.md`.
- React tarafında ağır bileşenler (`GallerySection`) props almak yerine `useEditorSelector` ile kendi slice'ını dinler.

## 8. Geçmiş (undo) kuralları

- Geçmiş **belge dilimlerini** tutar (`EditorDocument`), görünüm durumunu (zoom, oynatma, seçim) değil. Yeni bir belge dilimi eklenirse `snapshot()` ve `restore()` birlikte güncellenir.
- Her belge değişikliği `record()` çağırır. Bir etkileşim iki dilimi değiştiriyorsa `batch()` ile tek adımdır; jest (çizim, sürükleme, boyutlandırma) `beginGesture()` / `endGesture()` ile tek adıma iner.
- `restore()` kareleri **yeniden hesaplamaz**: belge kareleri kendi içinde taşır, yeniden hesaplamak pivot'ları siler.
- Yeni sheet yüklenince geçmiş temizlenir; iptal edilen bir jest geçmişe hiç giriş bırakmaz (aynı belge karşılaştırması).
- Klavye kısayolları Ctrl **ve** Cmd'yi kabul eder, form alanlarında devre dışıdır.

## 9. Erişilebilirlik kuralları

- `npm run test:e2e` içindeki axe koşumu boş editörü, yüklü editörü, atlas modalını ve **açık paleti** WCAG 2.1 A/AA etiketleriyle denetler. Yeni bir kontrol eklerken o koşum yeşil kalmalı. (Denetim yalnızca Chromium'da koşar: Firefox ve WebKit modal arka planını farklı harmanlar, sonuçlar motorlar arasında karşılaştırılabilir değil.)
- **İkon butonlarının erişilebilir adı zorunludur**: `aria-label` + `title`. Süsleme ikonları `aria-hidden="true"` taşır, aksi halde erişilebilir adı bozarlar.
- **Her form kontrolünün adı olmalı**: `<label for>` ya da `aria-label`.
- **Her renk CSS değişkeni olmalı.** Sabit bir yüzey (ör. modal scrim'i, zoom barı) açık temada kontrastı kırar; `main.css` içindeki `main.css:3` paletinde iki blok (koyu `:root`, açık `[data-theme='light']`) birlikte güncellenmeli.
- `prefers-reduced-motion: reduce` tüm geçiş ve animasyonları kapatır; axe koşumları da bu yüzden sabit `reducedMotion: 'reduce'` ile çalışır, aksi halde renkler geçiş ortasında ölçülür.

## 10. Test kuralları

- Vitest, Node ortamında çalışır; tarayıcı API'leri `src/testUtils/` içindeki fixture'lar ile değiştirilir (ad hoc mock yok).
- React testleri dosya başına `// @vitest-environment happy-dom` ile DOM alır. `document` nesnesinin tamamını stub'lamak testing-library'i kırar: `HTMLCanvasElement.prototype` metotlarını veya `document.createElement`'i spy ile değiştir.
- **Modül yükleme sırasında canvas/worker açılmaz.** `App.tsx` modül kapsamında servis örneği oluşturur; bu yüzden servisler kendi kaynağını ilk kullanımda yaratır. Testi yazılamayan her yan etki bir tasarım kusurudur.
- `happy-dom`da düzen (layout) yok: sıfır boyutlu canvas'a olay gönderirken `pointerEventsCheck: 0` gerekir, `position: sticky` gibi CSS değerleri `getComputedStyle` ile doğrulanamaz (o tarayıcıda Playwright'in işi).
- Asenkron üretim (JSZip, worker) testte `vi.waitFor` ile beklenir; `act(async)` tek başına yeterli değildir.
- Test dosyasına PowerShell `Set-Content` ile yazma: ASCII dışı karakterler bozulur. Türkçe metin içeren iddiaları `document.documentElement.lang` gibi ASCII kontrolleriyle doğrula.
- Canvas geometrisi (hangi `drawImage` çağrıları, hangi koordinatlar) fixture context ile doğrulanır.
- Motor çıktıları **parse edilip** assert edilir (tam JSON / `.tres` içeriği), sadece "dizi boş değil" değil.
- Byte seviyesinde çıktı (GIF, descriptor) checksum ile karşılaştırılır; ZIP içerik listesi ayrıca assert edilir çünkü JSZip zaman damgası yazar.
- Worker protokolü: mesaj alanları, transfer edilebilirler ve fallback yolları test edilir.
- Node'un taklit edemediği tarayıcı davranışı (marka kontrolleri, gerçek canvas, indirme) için `npm run test:e2e` vardır: Chromium, Firefox ve WebKit.
