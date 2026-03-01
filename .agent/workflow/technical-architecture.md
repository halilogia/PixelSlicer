# Noir Tales: Teknik Mimari ve Geliştirme Süreci

Bu belge, Noir Tales projesinin nasıl inşa edildiğini, kullanılan mimari yaklaşımları ve görselleştirme tekniklerini detaylandırır.

## 1. Mimari Tasarım: Layered (MVVM) Architecture
Proje, Flutter topluluğunun önerdiği **Layered Architecture** prensiplerine göre yapılandırılmıştır. Bu, React ekosisteminde MVVM (Model-View-ViewModel) olarak da adlandırılır.

### Katmanlar:
- **Domain (Model)**: Uygulamanın temel veri yapıları (`GameState`, `ScriptNode`, `Choice`). Mantık ve UI'dan tamamen bağımsızdır.
- **Data (Repository & Source)**: 
    - `Source`: Ham hikaye metinleri ve karakter verileri.
    - `Repository`: Veriye erişim katmanı. `LocalStorage` (Auto-save) ve ham verilerin filtrelenmesi burada yapılır.
- **UI (View & ViewModel)**:
    - `ViewModel`: `useGameViewModel` özel hook'u tüm oyun mantığını (yazma animasyonu, şubeleşme, kelebek etkisi tetikleyicileri) yönetir.
    - `View`: `App.tsx` ve diğer bileşenler, sadece ViewModel'den gelen state'i görselleştirir.

## 2. Dallanan Hikaye ve Kelebek Etkisi Sistemi
Oyunun kalbi olan "kararların önemi", karmaşık bir şubeleşme altyapısıyla sağlanır:

- **Flag Sistemi**: Oyuncunun yaptığı kritik seçimler `gameState.flags` dizisine eklenir. (Örn: `knows_about_key`).
- **Koşullu Gereksinimler**: Her seçim (`Choice`), görünmek için belirli bir flag veya ipucu (`requiredFlag`, `requiredClueName`) gerektirebilir.
- **Butterfly Effect UI**: Hikaye düğümlerindeki `isButterflyEffect: true` bayrağı, UI katmanında özel bir animasyonlu bildirimi tetikler.

## 3. Görsel Deneyim ve Ofis Etkileşimi
Oyunun "Noir" atmosferi modern web teknolojileriyle birleştirilmiştir:

- **Hotspot Interaction**: Ofis masası (`desk.png`) görseli üzerine tam koordinatlı görünmez butonlar yerleştirilerek "Point & Click" mekaniği oluşturulmuştur.
- **Staggered Animations**: CSS Keyframes ve `animation-delay` kullanılarak, mesajların ve butonların sırayla ekrana süzülmesi sağlanmıştır.
- **Smooth Zoom (Phone Transition)**: Telefonun açılması, bir modal gibi değil, CSS `transform: scale()` ve `opacity` geçişleriyle bir "yakınlaşma" hissi verilerek yapılmıştır.

## 4. Yazma Animasyonu (Typing Indicator)
Gerçekçiliği artırmak için:
- Mesaj uzunluğuna göre dinamik bir gecikme hesaplanır: `Math.min(Math.max(text.length * 15, 1000), 3000)`.
- Yazma sürecinde seçenekler yavaşça aşağı kayarak kaybolur (`translate-y-10`), odak hikayeye yönlendirilir.

## 6. Saf CSS/React Akıllı Telefon Uygulaması
Oyunun en dikkat çekici görsel unsurlarından biri olan akıllı telefon, bir görsel değil tamamen kod (Tailwind CSS / React) ile inşa edilmiştir.

### Neden Kod (CSS) Tercih Edildi?
- **Esnek Boyutlandırma**: Telefonun yüksekliği ve genişliği tek bir satır kodla değiştirilebilir (`h-[650px]`, `w-[340px]`).
- **Keskin Görüntü**: Vektörel bir yapı olduğu için her ekran çözünürlüğünde cam gibi nettir, asla pikselleşmez.
- **Dinamik Detaylar**: Saat, pil göstergesi ve çentik (notch) gibi unsurlar gerçek zamanlı olarak kontrol edilebilir.

### Tasarım Detayları:
- **Kasa (Frame)**: 12 piksellik koyu metalik bir çerçeve (`border-[#1a1a1a]`) ve yüksek kavisli köşeler (`rounded-[3.5rem]`).
- **Çentik (Notch)**: HTML unsurlarıyla oluşturulan, status bar'ın ortasına yerleştirilmiş gerçekçi bir sensör alanı.
- **Derinlik Etkisi**: `shadow-[0_0_120px_rgba(0,0,0,0.8)]` kullanılarak cihazın masanın üzerinde havada duruyormuş hissi verilmesi.

---
*Hazırlayan: Antigravity AI Coding Assistant*
