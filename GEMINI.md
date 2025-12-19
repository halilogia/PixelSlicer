# PixelSlicer - Gemini CLI Kuralları

## 📁 Proje Türü

**Static Web Application** - Tarayıcı tabanlı sprite dilimleme aracı.

## 🛠️ Teknoloji Stack

- **HTML5** - Yapı ve Canvas API
- **Tailwind CSS** - CDN üzerinden
- **Vanilla JavaScript** - ES6+ inline
- **JSZip** - CDN üzerinden

## 📂 Dosya Yapısı

```
PixelSlicer/
├── index.html      ← Tüm uygulama (tek dosya)
├── README.md       ← Kullanıcı dokümantasyonu
├── ROADMAP.md      ← Gelecek planlar
├── CHANGELOG.md    ← Değişiklik geçmişi
├── GEMINI.md       ← Bu dosya (AI kuralları)
├── brain/          ← Geliştirici notları
│   ├── task.md
│   ├── implementation_plan.md
│   └── walkthrough.md
└── docs/           ← Ek dokümantasyon
```

## 🔧 Geliştirme Kuralları

### Kod Stili

1. **Tek dosya mimarisi**: Tüm HTML, CSS (Tailwind) ve JS tek `index.html` içinde
2. **CDN kullanımı**: Bağımlılıklar CDN üzerinden (JSZip, Tailwind, FontAwesome)
3. **ES6+ syntax**: Modern JavaScript özellikleri kullanılabilir

### Değişiklik Yaparken

1. `index.html` düzenlenirken mevcut yapıyı koru
2. Tailwind class'ları tercih et, inline CSS'den kaçın
3. Canvas işlemleri için mevcut helper fonksiyonları kullan

### Test

```bash
# Lokal test için herhangi bir HTTP sunucu
python -m http.server 8080
# veya
npx serve .
```

## 🚫 Yapılmaması Gerekenler

- Framework eklememek (React, Vue, vb.)
- Build sistemi gerektiren değişiklikler yapmamak
- Sunucu tarafı kod eklememek

## ✅ Yapılabilecekler

- Yeni JavaScript fonksiyonları eklemek
- Tailwind class'ları ile stil değişiklikleri
- Yeni UI elemanları eklemek
- Canvas işlevselliği genişletmek
