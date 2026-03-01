# 🛠️ TypeScript & React Projeleri İçin Olmazsa Olmaz Kütüphaneler (The Senior Stack)

Bu liste, modern bir web/mobil projesinin "amelelikten" kurtulup profesyonel bir mimariye dönüşmesi için gereken "Hayat Kurtaran" kütüphaneleri içerir. Bir projeye başlarken bu araçları kurmak, teknik borcu (technical debt) %80 azaltır.

---

## 🏗️ 1. State Management (Hafıza Yönetimi)
*Standart `Context API` veya `Redux` (eski) yerine.*

*   **⚡ Zustand** (`zustand`)
    *   **Neden?** İnanılmaz hafif (1KB), React Context'in gereksiz render sorunlarını yaşatmaz, Hook olmayan yerlerde (normal JS dosyalarında) bile çalışır.
    *   **Kullanım:** Global kullanıcı verisi, oyun durumu, sepet, tema ayarları.

*   **📡 TanStack Query (React Query)** (`@tanstack/react-query`)
    *   **Neden?** Sunucudan veri çekmeyi (fetch) manuel yapmayın. Cache, otomatik yenileme (refetch), loading/error durumlarını kendi yönetir.
    *   **Kullanım:** API istekleri, Firebase veri yönetimi.

---

## 🎨 2. Styling & Animation (Görsel Zeka)
*Standart CSS veya Inline Style yetmez.*

*   **🪄 Framer Motion** (`framer-motion`) - *(Bizde Mevcut ✅)*
    *   **Neden?** En iyi React animasyon kütüphanesi. Karmaşık geçişleri (layout animations) çok kolay yapar.
    *   **Kullanım:** Sayfa geçişleri, tıklama efektleri, sürükle-bırak.

*   **� GSAP (GreenSock Animation Platform)** (`gsap`)
    *   **Neden?** Animasyonun "Ferrari"sidir. Framer Motion UI için harikadır ama GSAP çok karmaşık, zaman çizelgeli (Timeline) sinematik animasyonlar için rakipsizdir.
    *   **Kullanım:** Oyun introları, "Cutscene" tadında sıralı efektler, karmaşık kart şovları.

*   **�🌪️ Tailwind CSS** (`tailwindcss`)
    *   **Neden?** CSS dosyalarıyla boğuşmak yerine HTML içinde stil yazarak üretim hızını 3 katına çıkarır.
    *   **Not:** Vanilla CSS (bizim şu anki tercihimiz) daha "Sanatsal" kontrol sağlar ama Tailwind "Hız" sağlar.
    *   **⚠️ PROJE DURUMU:** Bu projede **YASAKTIR**. Biz "Gemini Architecture" gereği Native CSS/Inline Style kullanıyoruz.

*   **💅 Class Variance Authority (CVA)** (`class-variance-authority`)
    *   **Neden?** "Primary Button", "Ghost Button" gibi varyasyonları yönetmek için en temiz yöntem. Spagetti `if/else` stil kodlarını engeller.

---

## 🧱 3. Form & Validasyon (Giriş Kontrolü)
*Manuel `useState` ile form yönetmek eziyettir.*

*   **📝 React Hook Form** (`react-hook-form`)
    *   **Neden?** Form her harf girişinde sayfayı render etmez. Performans dostudur ve kodları çok temizdir.

*   **🛡️ Zod** (`zod`)
    *   **Neden?** TypeScript ile tam uyumlu şema doğrulama. "Şifre en az 6 karakter olsun, e-posta geçerli olsun" kurallarını tek satırda yazar.

---

## 🗺️ 4. Navigation (Yönlendirme)

*   **🚦 React Router DOM** (`react-router-dom`) - *(Bizde Mevcut ✅)*
    *   **Standart:** Sayfalar arası geçişin olmazsa olmazı.
    *   **Alternatif:** **TanStack Router** (Type-safe routing için yeni nesil favori).

---

## 🛠️ 5. Utility & Helper (Alet Çantası)

*   **📅 Day.js** veya **Date-fns**
    *   **Neden?** JavaScript'in kendi `Date` objesi berbattır. Tarih formatlamak (örn: "2 hours ago") için şart.

*   **🔗 clsx** veya **tailwind-merge**
    *   **Neden?** Dinamik class isimlerini birleştirmek için. (Örn: `btn ${isActive ? 'red' : 'blue'}` yerine daha temiz sözdizimi).

*   **🆔 UUID** (`uuid`)
    *   **Neden?** Rastgele benzersiz ID oluşturmak için. (Hangi kartın ID'si ne olacak derdi bitiyor).

---

## 📱 6. Mobile & PWA (Mobil Uyumluluk)

*   **⚡ Capacitor** (`@capacitor/core`) - *(Bizde Mevcut ✅)*
    *   **Neden?** Web sitesini tek komutla Android/iOS uygulamasına çevirir. Kameraya, titreşime, bildirime erişir.

---

## 🚀 Özet: Bizim Projeye Hemen Eklememiz Gerekenler

Mevcut Etheria projesini "Junior" seviyesinden "Senior" seviyesine çekmek için acil reçete:

1.  **React Hook Form + Zod** -> (Login/Register formunu profesyonelleştirmek için)
2.  **UseSound** -> (Oyun olduğu için ses efektlerini kolay yönetmek için)

Bu listeyi projede tutuyorum. İstediğin zaman "Hadi madde 1'i uygulayalım" diyebilirsin.
