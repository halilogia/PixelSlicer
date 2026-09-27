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

## 3. Test kuralları

- Vitest, Node ortamında çalışır; tarayıcı API'leri `src/testUtils/` içindeki fixture'lar ile değiştirilir (ad hoc mock yok).
- Canvas geometrisi (hangi `drawImage` çağrıları, hangi koordinatlar) fixture context ile doğrulanır.
- Motor çıktıları **parse edilip** assert edilir (tam JSON / `.tres` içeriği), sadece "dizi boş değil" değil.
- Worker protokolü: mesaj alanları, transfer edilebilirler ve fallback yolları test edilir.
- Yeni bir renderer/exporter eklerken aynı test dosyasının kapsamını genişletmek, coverage raporuna bakarak tahmin yapmaktan iyidir.

## 4. Worker kuralları

- Worker dosyaları yalnızca mesaj protokolünü bilir; iş mantığı `infrastructure` ile paylaşılır, kopyalanmaz.
- `self` DOM lib tarafından tiplendiği için worker kapsamı dosya içinde `interface WorkerScope` ile tanımlanır (WebWorker lib eklenmez, tip çakışması olur).
- Worker desteklenmiyorsa `AtlasWorkerClient` şeffafça ana iş parçacığına düşer; bu yol da test edilir.
- Worker'dan gelen `ImageBitmap`'ler modal kapanınca veya sonuç değişince `close()` ile serbest bırakılır.

## 5. Kod stili

- Tip bazlı alias import (`import type { Frame } from '@domain/FrameLogic'`).
- Dosya adı: domain'de `PascalCase.ts`, testler `*.test.ts` aynı klasörün altında.
- Yorumlar yalnızca **ne yapılmadığını** açıklar; bariz kod için yorum yazılmaz.
- `strict`, `noUnusedLocals`, `noUnusedParameters` açık: `npm run lint` temiz olmadan commit edilmez.

## 6. Release kuralları

- Biten işler `ROADMAP.md`'den düşer, `CHANGELOG.md`'ye taşınır. ROADMAP yalnızca gelecek işi tutar.
- `npm run lint && npm test && npm run build` yeşil olmadan push yapılmaz (deploy workflow aynı adımları CI'da çalıştırır).
- Mimari değişikliklerde `ARCHITECTURE.md` güncellenir; `ARCHITECTURE_AUTO_GENERATED.md` **elle düzenlenmez**, `npm run docs:arch` ile yeniden üretilir.
- `package.json` sürümü ile atlas metadata'sındaki `ATLAS_APP_VERSION` elle birlikte güncellenir.

## 7. Tarayıcı kaynak yönetimi

- Object URL'ler `ImageLoader` üzerinden alınır: yükleme bittikten **ve** hata durumunda `revokeObjectURL` çağrılır. `URL.createObjectURL` doğrudan çağrılmaz.
- Canvas bağlam durumu (stroke/fill/font/lineWidth) döngü içinde yalnızca değer değiştiğinde atanır; aynı değeri tekrar atamak pahalıdır.
- Worker'dan dönen `ImageBitmap`'ler iş bitince `close()` ile serbest bırakılır.
- Uzun süreli döngüler `setInterval` değil `requestAnimationFrame` kullanır; kalan süre hesaba katılır, kare atlarken kayma olmaz.
