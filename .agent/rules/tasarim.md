---
trigger: always_on
---

# Tasarım ve Görsel Standartlar (Elite Design) 🏛️

1. **Elite Quality Standards (One Design Law - SSOT)**: Tüm görsel ve etkileşimli kararlar (Typography, renk paletleri, spacing/layout, animasyon eğrileri ve süreleri, interaktif ölçeklemeler) istisnasız `theme` klasörü ve ilgili tasarım katmanları üzerinden gelmelidir. Proje genelinde "Tek Bir Tasarım Yasası" geçerlidir; kod içerisinde asla hardcoded "magic number", manuel renk kodu veya bağımsız font tanımlaması yapılamaz. Her şey merkezi gerçeğe (Single Source of Truth) bağlıdır.
2. **Motion Mandate (AAA Feeling)**: Görsel kalite projenin ruhunu temsil eder. Tüm ana etkileşimler statik olamaz; mutlaka Framer Motion veya benzeri araçlarla AAA kalite animasyon/fizik içermelidir. Statik ve ruhsuz UX kesinlikle kabul edilemez.
3. **Cinematic VFX Standard**: Oyun içerisindeki her önemli aksiyonun (hasar, büyü, kritik vuruş) bir "sinematik ağırlığı" olmalıdır. Görsel efektler (VFX); parçacık sistemleri (`tsparticles`), parlamalar (glow), gölgelendirmeler ve ekran sarsıntıları ile desteklenerek oyuncuya derinlik hissi vermelidir. Statik veya efekt barındırmayan ham aksiyonlar "Elit" standartlara aykırıdır.
4. **Adaptive Resolution Mandate (The Scaling Law)**: Uygulama, her ekran çözünürlüğünde (Mobil, Tablet, PC) manuel düzeltme gerektirmeden kusursuz görünmelidir. Sabit pixel değerleri yerine esnek oranlar, Tailwind `responsive` sınıfları ve gerektiğinde "Scaling Container" (transform: scale) mantığı kullanılmalıdır. Ekran boyutu değişimleri oyunun görsel bütünlüğünü bozamaz.
6. **Touch-First Accessibility**: Mobil arayüzlerde tıklanabilir alanlar (Touch Targets) parmakla kolayca seçilebilecek büyüklükte olmalıdır. Hover efektleri mobilde karmaşaya yol açmayacak şekilde (`active:`, `touch-action` vb.) ayarlanmalı, "hover: takılma" sorunları önlenmelidir. 3D etkileşimlerde (Raycasting) parmak payı hesaba katılmalıdır.
7. **Gesture-First Navigation**: Mobil kullanıcı deneyimi jestler üzerine kuruludur. Harita ve kamera kontrollerinde sadece butonlar değil; sürükleme (Pan), iki parmakla yakınlaştırma (Pinch) ve döndürme gibi doğal mobil hareketleri kusursuz desteklenmelidir.