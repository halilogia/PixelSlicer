# PixelSlicer ⚔️

PixelSlicer, oyun geliştiricileri ve piksel sanatçıları için tasarlanmış, tarayıcı tabanlı, hızlı ve pratik bir Sprite Sheet (Animasyon Sayfası) Dilimleme aracıdır.

Karmaşık resim editörleriyle uğraşmadan; sprite sheet'lerinizi yükleyin, ızgara (grid) veya manuel seçimle parçalara ayırın, animasyonu anında test edin ve ZIP olarak indirin.

_(Buraya projenizin ekran görüntüsünü ekleyebilirsiniz)_

## 🌟 Özellikler

- ⚡ **Hızlı ve Kolay**: Hiçbir kurulum gerektirmez, doğrudan tarayıcıda çalışır.
- 📐 **Otomatik Izgara (Grid)**: Satır ve sütun sayılarını girerek eşit parçalara bölün.
- 🛠️ **Manuel Seçim Modu**: Standart dışı sprite'lar için mouse ile özel alanlar çizin.
- 🔍 **Yeniden Boyutlandırma (Resize)**: Manuel çizdiğiniz kareleri köşelerinden tutarak hassasça ayarlayın.
- 👁️ **Akıllı Önizleme**: Seçtiğiniz karelerin animasyonunu anlık olarak (FPS ayarı ile) izleyin.
- 🚫 **Kare Eleme**: Boş veya hatalı kareleri tek tıkla animasyondan ve indirme listesinden çıkarın.
- 📦 **ZIP İndirme**: Tüm parçaları tek tek değil, düzenli bir ZIP dosyası olarak indirin.
- 🔎 **Zoom & Pan**: Büyük görsellerde rahat çalışmak için yakınlaştırma ve kaydırma özellikleri.
- 🧩 **Atlas Packer (Texture Packer)**: Kırpılmış kareleri sıkıştırılmış 2'nin katı atlaslara paketler.
- 🎮 **Motor Dışa Aktarımı**: Phaser, Godot ve Unity için hazır JSON / `.tres` metadata ve Unity editör scriptleri.
- 📌 **Pivot Noktası**: Hazır origin şablonları veya kareye tıklayarak kendi pivot'unuzu yerleştirin.
- ⚙️ **OffscreenCanvas Worker**: Paketleme ve rasterizasyon arka planda çalışır, arayüz donmaz.

## 🚀 Nasıl Kullanılır?

1. **Resim Yükle**: Sol üstteki butona tıklayın veya resminizi sürükleyip bırakın.

2. **Dilimleme Yöntemini Seçin**:

   - **Grid**: Sol panelden sütun ve satır sayılarını girin. Kılıç gibi taşan kısımlar varsa "İnce Ayar" ile kaydırma yapın.
   - **Manuel**: "Manuel Ekle" modunu açın ve resim üzerinde istediğiniz alanları çizin.

3. **Düzenleyin**: İstemediğiniz karelerin üzerine tıklayarak (veya alt galeriden) pasif hale getirin.

4. **Test Edin**: Sol alttaki oynatıcıdan animasyon hızını (FPS) ayarlayıp akıcılığı kontrol edin.

5. **İndirin**: "ZIP Olarak İndir" butonuna basarak tüm kareleri alın.

## 🧩 Atlas Packer (Texture Packer)

Kareleri tek tek indirmek yerine hepsini tek bir dokuya sıkıştırmak isteyenler için:

1. **Ayarları seçin** (sol panel → *Atlas Packer*):

   - **Şeffaf Kenarları Kırp**: Alfa eşiğinin üzerindeki pikselleri içeren en dar kutuya otomatik kırpma.
   - **Pivot Noktası**: `Top Left / Top Center / Center / Bottom Center` şablonları, ya da **Pivot Seç** modunu açıp kareye tıklayarak kendi origin noktanızı koyun.
   - **Boşluk (Padding)** ve **Kenar Taşması (Extrude)**: komşu sprite'ların birbirine taşmasını (bleeding) engeller.

2. **"Paketle & Dışa Aktar"** butonuna basın. "Atlası Oluştur" ile sonucu önizleyin: sayfa sayısı, doluluk oranı ve kırpma sayesinde kazanılan piksel sayısı raporlanır.

3. **ZIP'i indirin**. İçerik seçtiğiniz motorlara göre değişir:

| Motor | Dosyalar | Nasıl kullanılır |
| --- | --- | --- |
| **Phaser 3** | `atlas.png`, `phaser.json`, `phaser-array.json` | `this.load.atlas('atlas', 'atlas.png', 'phaser.json')` |
| **Godot 4** | `atlas.png`, `godot.json`, `godot/<sprite>.tres`, `godot/spriteframes.tres` | PNG'yi `Texture2D` olarak içe aktarın, `spriteframes.tres`'i `AnimatedSprite2D`'ye verin |
| **Unity** | `atlas.png`, `unity.json`, `Unity/PixelSlicerAtlas.cs` | `Assets/` içine kopyalayın, sprite'ları seçip `Tools > PixelSlicer > Create SpriteAtlas From Selection` çalıştırın |

Çok sayfalı atlaslarda dosyalar `atlas_0.png`, `phaser_0.json` ... şeklinde numaralanır.

> **Not:** Paketleme tarayıcıda bir Web Worker içinde (OffscreenCanvas) çalışır. Worker veya OffscreenCanvas desteklenmeyen tarayıcılarda aynı işlem ana iş parçacığında yapılır.

## 🛠️ Geliştirme

```bash
npm install
npm run dev          # geliştirme sunucusu
npm run build        # tsc + vite build
npm run lint         # tsc --noEmit
npm test             # vitest (tek seferlik)
npm run test:watch   # vitest (izleme modu)
npm run test:coverage
```

## 🛠️ Kullanılan Teknolojiler

- **React 18 + TypeScript + Vite**: Arayüz ve derleme.
- **HTML5 Canvas / OffscreenCanvas**: Görüntü işleme, kırpma ve atlas rasterizasyonu.
- **Web Workers**: Atlas paketleme gibi ağır işleri ana iş parçacığından ayırır.
- **Vitest**: Domain katmanı, bin packer ve exporter testleri.
- **JSZip**: Tarayıcı tarafında ZIP dosyası oluşturmak için.
- **gifenc / omggif**: GIF kodlama ve çözme.
- **FontAwesome**: İkonlar için.

## 🌐 Demo

Projeyi canlı denemek için: https://halilogia.github.io/PixelSlicer/

## 🤝 Katkıda Bulunma

1. Bu depoyu (repository) fork'layın.
2. Yeni bir özellik dalı (branch) oluşturun (`git checkout -b ozellik/YeniOzellik`).
3. Değişikliklerinizi commit'leyin (`git commit -m 'Yeni özellik eklendi'`).
4. Dalınızı (branch) push'layın (`git push origin ozellik/YeniOzellik`).
5. Bir Pull Request (PR) oluşturun.

## 📄 Lisans

Bu proje **GNU General Public License v3.0 (GPLv3)** ile lisanslanmıştır. Özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz.

---

> **Geliştirici Notu**: Bu araç, oyun geliştirme süreçlerindeki "Animation Hell" (Animasyon Cehennemi) sürecini hafifletmek amacıyla yapılmıştır. 🎮


