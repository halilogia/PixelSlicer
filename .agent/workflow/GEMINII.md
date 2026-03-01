# Universal Singularity & Co-location Rules (The Gravity Protocol)

Bu döküman, AI ve İnsan işbirliğini maksimize etmek, teknik borcu minimize etmek ve "Hız" (Velocity) kazanmak için tasarlanmış modern bir yazılım mimarisi protokolüdür.

## 📖 Temel Kanun: Singularity Law (Tekillik Kanunu)

**"Bilinçli Tekillik ≠ Kaos (God Object)"**

Amacımız parçaları rastgele klasörlere dağıtmak değil, **Bağlamsal Bütünlüğü (Contextual Integrity)** korumaktır.

### 1. Altın Kural (The Gravity Rule)
Bir özelliğin (Feature) anatomisi tek bir klasör tavanı altında, **1 Import Mesafesi** içinde olmalıdır.

*   **Dikey Bütünleşme (Feature Singularity):** AI'nın bağlamı (context) kaçırmaması için bir özelliğe dair UI, mantık, tipler ve stiller AYNI klasörde yaşamalıdır.
*   **No Nested Folders (The Flat Feature Rule):** Bir özellik çok büyüdüğünde onu alt klasörlere (`components/`, `logic/`) BÖLME. Bunun yerine `Feature.View.tsx`, `Feature.Logic.ts` gibi isimlendirmelerle AYNI klasörde tut.
*   **Bilişsel Mesafe:** Zihnin parçaları birleştirmek için dosya atlama maliyetini sıfırla.
*   **Kodun Yerçekimi (Semantic Gravity):** Dosyalar birbirine ne kadar yakınsa bağlam o kadar güçlüdür. Uzaklık bağlamı zayıflatır ve halüsinasyonu artırır.

### 2. Common Closure Principle (CCP)
**"Birlikte değişen şeyler, birlikte yaşamalıdır."**
Eğer bir dosyadaki logic değiştiğinde UI dosyasını da açman gerekiyorsa, o ikisi aynı klasörde (co-located) olmalıdır.

### 3. Yapısal Sınırlar (Structural Boundaries)

*   **The Partial Pattern:** Bir dosya 1500+ satırı aştığında, onu alt klasörlere bölmek yerine dosya isimlendirmesiyle ayır:
    *   `Profile.tsx` (Ana Giriş)
    *   `Profile.Logic.ts` (İş Mantığı)
    *   `Profile.Styles.css` (Stil)
*   **The Black Box Rule:** Bir modülün sadece `index.ts` (Public API) dosyasına erişilebilir. İç dosyalara (`./feature/InternalComponent`) erişim yasaktır.
*   **Shared Kernel:** Sadece projede 3'ten fazla yerde kullanılan "gerçekten genel" kodlar (Button, DateUtils, Auth) `src/shared` altında toplanır.

### 4. Code In-Navigation (Region Pattern)
Dosya boyutları büyüdüğünde `#region` kullanımı ZORUNLUDUR.
```typescript
// #region Types & Interfaces
// #region State & Hooks
// #region Helper Functions
// #region Main Logic (Hero)
```

### 5. Hero-First Architecture
Dosya sıralaması "En Önemli"den "En Önemsiz"e doğru olmalıdır. AI dosyayı açtığında "Ana Aktörü" (Main Component/Class) ilk 100 satırda görmelidir. Helper functions ve detaylar dosyanın en altında kalmalıdır.

---

> 💉 **Bağışıklık Notu:** Bu kurallar AI'nın projeye %100 hakim olmasını sağlar. Bağlam parçalanması (Context Fragmentation), AI'nın hata yapmasının en büyük sebebidir. Yerçekimine güvenin, bağlamı bir arada tutun.
