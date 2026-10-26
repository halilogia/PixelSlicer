# 📜 SKILLS.md — PixelSlicer Geliştirici & Ajan Standartları

Bu doküman, PixelSlicer projesinde çalışan ajanlar ve geliştiriciler için tasarım sınırlarını, performans kurallarını ve Definition of Done (DoD) kriterlerini tanımlar.

---

## 🎯 Temel İlkeler ve Sınırlar

- **Sıfır Sunucu:** Hiçbir görsel veri dış API'lere gönderilemez.
- **Piksel Doğruluğu:** Canvas çizimlerinde antialiasing (`imageSmoothingEnabled = false`) kapatılarak piksel netliği korunmalıdır.
- **200 Satır Kuralı:** Dokümantasyon 200 satırı aşamaz.

---

## 🛠️ Mimari Kurallar

- **Canvas İzolasyonu:** Dilimleme motoru UI katmanından bağımsız saf TypeScript/JavaScript sınıfı olarak tasarlanmalıdır.

---

## ✅ Tamamlanma Kriteri (Definition of Done)

1. Proje derlemesi hatasız olmalı.
2. `TASKS.md` güncellenmeli.
3. Pre-Push kapısı doğrulanarak commit alınıp GitHub'a push edilmeli.
