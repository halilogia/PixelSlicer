---
trigger: always_on
---

## Temel Kurallar

1. **Her Dosyaya Bir Görev**: Bir dosya yalnızca bir çekirdek mantık alanını yönetmelidir (örneğin; karakter hareketi, UI oluşturma, veri yönetimi veya görsel efektler).
2. **Büyük Dosyaları Yeniden Yapılandır (Refactor)**: Eğer bir dosya 800 satırı geçerse veya birden fazla birbiriyle ilgisiz sistemi yönetmeye başlarsa, dosyayı küçültmeyi düşün.
3. **Net İsimlendirme**: Dosya isimleri, dosyanın tek sorumluluğunu açıkça yansıtmalıdır (örneğin; `PlayerUtils.ts` yerine `VFXManager.ts`).
4. **`any` Kullanımı Yasaktır**: TypeScript dosyalarında `any` tipi KULLANILMAMALIDIR. Bunun yerine doğru tipler, `interface`, `type`, generic'ler veya en kötü ihtimalle `unknown` kullanılmalıdır.
5. **Hata Kalmamalı**: Herhangi bir görev biterken veya sohbet sonlanırken, ilgili dosyalardaki tüm TypeScript, lint ve sözdizimi (syntax) hataları mutlaka giderilmiş olmalıdır. Kod "hatasız" (error-free) teslim edilmelidir.
6. **Path Alias Enforcement**: Tüm katmanlar `@` aliasları ile izole edilmiştir (`@ui`, `@domain`, vb.). Kesinlikle `../../` relatif yolları kullanılmamalıdır.
7. **Bağlamsal Bütünlük (Co-location)**: Tasarım (CSS) ve bileşen kodları (JSX) aynı dosyada tutulmalıdır. Harici `.css` dosyalarından kaçınılmalıdır.
8. **Region Organizasyonu**: `#region [BAŞLIK]` ve `#endregion` blokları ile bölümlere ayrılması zorunludur.
9. **Statik Dil Yasağı**: Uygulama içerisinde kullanıcıya görünen hiçbir metin statik (hardcoded string) olarak yazılmamalıdır. Tüm metinler i18n/çeviri sistemi üzerinden anahtarlar (keys) ile çağrılmalı ve yönetilmelidir.
10. **Dosya İçi Hiyerarşi (Order of Importance)**: Dosyanın en önemli kısmı (ana bileşen/fonksiyon) en üstte yer almalıdır. Yardımcı fonksiyonlar ve stil tanımları alt kısımlara bırakılmalıdır.
11. **Modüler Yayılım (New File First)**: Yeni bir özellik, mantık veya bileşen eklenirken mevcut dosyaları şişirmek yerine, her zaman yeni bir dosya oluşturulayı düşün. Amaç, atomik ve kolay yönetilebilir bir yapı kurmaktır.
12. **Bağımlılık Kuralları (Law of Direction)**:
    - **Bağımlılık İçe Doğrudur**: UI -> ViewModel -> Domain/Data.
    - **ViewModel Kuralı**: Bir View sadece KENDİ ViewModel'ı ile konuşur.
    - **Data İzolasyonu**: UI bileşenleri asla doğrudan bir Store'a (Zustand) veya dış API servisine erişmez. Her şey ViewModel üzerinden geçer.
    - **Logic Saflığı**: `domain/logic` içindeki fonksiyonlar React'tan ve browser API'lerinden bağımsız olmalıdır (Saf JS/TS).
    - **Özellik İzolasyonu (No Horizontal Dependency)**: `components` altındaki hiçbir bileşen yatayda birbirini import edemez. Her dosya bağımsızdır.
    - **Engine-View Separation**: Logic kodları `domain/logic` içindedir.
13. **Proaktif Rehberlik ve Mentorluk (Challenge the Prompt)**: Yapay zeka sadece bir kod yürütücüsü değil, nominations da kıdemli bir mentordur. Eğer kullanıcının isteği teknik olarak hatalı, düşük kaliteli veya mimariyi bozacak bir yöndeyse (suboptimal/flawed outcome); yapay zeka körü körüne talimatı izlemek yerine "STOP & WARN" (Dur ve Uyar) protokolünü uygulamalı, riskleri açıklamalı ve "Best Practice" alternatifler sunmalıdır. Kullanıcının ezbere/fark etmeden istediği mimariyi bozan veya sistemi ağırlaştıran bir koda onay vermek ve uyarmamak, bu proje için 'Kesin Başarısızlık' (Fatal Failure) sebebidir. 
14. **Zero-Hallucination Protocol**: Yapay zeka, düzenleme yapacağı bir dosyayı mutlaka önce `view_file` veya `view_file_outline` ile okuyarak güncel durumunu doğrulamalıdır; hafızasındaki eski verilere güvenerek "hayali" (hallucinated) kod yazmamalıdır.
15. **İnisiyatif Yasağı (No Unilateral Action)**: Yapay zeka, verilen talimatın kapsamı dışına asla kendi inisiyatifiyle çıkmamalıdır. "Hazır elim değmişken" diyerek kullanıcıdan onay almadan ek düzenleme, temizlik veya özellik ekleme/çıkarma yapması kesinlikle yasaktır. Yapılması gereken ek bir işlem fark edilirse, bu sadece bir öneri olarak sunulmalı ve kullanıcıdan onay beklenmelidir. veya KURAL 13 gereği kullanıcının yanlış bir isteiğini fark ederse sadece durmalı ve kullanıcıya bildirmelidir.
16. **Proaktif Öneri ve Ar-Ge Sistemi (Suggestion Log)**: Her başarılı özellik eklendiğinde veya hata çözüldüğünde (görev bitiminde); oyunun mimarisini, performansını veya hissiyatını "AAA" kalitesine taşıyacak bir önerin (refactor, sistem geliştirme, özellik ekleme) varsa, bu fikri mutlaka `brain/suggestion.md` dosyasına not etmelisin. Sadece "Tamam" demek yerine teknik vizyon katarak yönlendirmelisin.