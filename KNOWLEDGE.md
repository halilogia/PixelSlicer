# 🧠 PixelSlicer Mühendislik Hafızası (KNOWLEDGE.md)

Bu dosya, PixelSlicer sprite sheet dilimleme ve animasyon önizleme aracının mimari karar kayıtlarını (ADR) ve teknik tuzaklarını (Gotchas) belgeler.

---

## 🏛️ Mimari Karar Kayıtları (ADR)

### [ADR-01] İstemci Tarafı Canvas Bellek İşleme
- **Karar:** Tüm görsel dilimleme, şeffaflık hesaplama ve kırpma işlemleri HTML5 Canvas ve WebGL üzerinde tamamen istemci tarafında yapılır.
- **Gerekçe:** Kullanıcı görsellerinin hiçbir sunucuya yüklenmemesi (tam gizlilik) ve sıfır gecikmeli anlık önizleme.

### [ADR-02] JSZip ile Tarayıcı İçi Arşivleme
- **Karar:** Dilimlenen sprite kareleri doğrudan tarayıcı belleğinde `JSZip` ile zip paketine dönüştürülüp indirilir.

---

## ⚠️ Kritik Teknik Tuzaklar (Gotchas)

### [GOTCHA-01] Büyük Sprite Sheet'lerde Bellek Taşması
- **Tuzak:** 4K+ çözünürlüklü sprite sayfalarında binlerce kareye bölünürken `canvas.toBlob()` çağrılarının RAM tüketmesi.
- **Çözüm:** Asenkron kuyruk yapısı (`requestIdleCallback`) ve dilimleme bittikçe ara nesnelerin garbage collection'a bırakılması.
