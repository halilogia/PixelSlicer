---
description: LinguaLearn - Evolved MVVM Clean Architecture Constitution
---

# LinguaLearn - Evolved MVVM Clean Architecture 🏛️

> "Bu döküman, Flutter mimari rehberinden (Prototype) ilham alınarak Web/React ekosistemi için modernize edilmiş ve geliştirilmeye açık hale getirilmiş standartları içerir."

## 🏷️ Path Alias Enforcement (ZORUNLU)

Tüm katmanlar `@` aliasları ile izole edilmiştir:
- `@ui`, `@domain`, `@data`, `@utils`, `@routing`, `@config`

> **YASAK:** `../../` relatif yolları kullanılmamalıdır. Mimari katmanlar arası geçişler aliaslar üzerinden yapılmalıdır.

---

## 📏 İsimlendirme Standartları (Naming)

- **Feature Klasörleri:** `snake_case` (örn: `sentence_builder`)
- **ViewModels:** `PascalCaseViewModel.ts` (örn: `DashboardViewModel.ts`)
- **Widgets/Screens:** `PascalCaseScreen.tsx` (örn: `DashboardScreen.tsx`)
- **Modeller/Mantık:** `PascalCase.ts` (örn: `Word.ts`, `SrsLogic.ts`)
- **Servisler:** `camelCase.service.ts` (örn: `auth.service.ts`)

---

## 🧭 Bağımlılık Kuralları (Law of Direction)

1. **Bağımlılık İçe Doğrudur:** UI -> ViewModel -> Domain/Data.
2. **ViewModel Kuralı:** Bir View sadece KENDİ ViewModel'ı ile konuşur.
3. **Data İzolasyonu:** UI bileşenleri asla doğrudan bir Store'a (Zustand) veya dış API servisine erişmez. Her şey ViewModel üzerinden geçer.
4. **Logic Saflığı:** `domain/logic` içindeki fonksiyonlar React'tan ve browser API'lerinden bağımsız olmalıdır (Saf JS/TS).

---

##  Mimari Felsefe: Sabit Temel, Esnek Gelişim

1. **Değişmez Çekirdek (The Core):** MVVM katmanları arasındaki sınırların korunması ve bağımlılıkların yönü (içe doğru) projenin değişmez anayasasıdır.
2. **Yaşayan Yapı (Evolution):** Klasör alt yapıları, kullanılan kütüphaneler ve implementasyon detayları projenin ihtiyaçları doğrultusunda her zaman geliştirilebilir ve modifiye edilebilir.
3. **Prensip Üzerinden Esneklik:** Eğer bir değişiklik Clean Architecture prensiplerini ihlal etmiyorsa ve kodun kalitesini/okunabilirliğini artırıyorsa, geliştirilmeye açıktır.

---

## 🧠 AI Bağlamı & Dosya Kod Düzeni (Locality & Order)

AI'nın (Antigravity) bağlamı kaybetmemesi ve kodun okunabilirliği için şu kurallar geçerlidir:

1. **Bağlamsal Bütünlük (Co-location):** Tasarım (CSS-in-TS) ve bileşen kodları mümkün olduğunca aynı dosyada tutulmalıdır. Ayrı stil dosyaları AI'nın tüm resmi görmesini engeller.
2. **Dosya İçi Hiyerarşi (Order of Importance):** Dosyanın en önemli kısmı (ana bileşen/fonksiyon) en üstte yer almalıdır. Yardımcı fonksiyonlar ve stil tanımları alt kısımlara bırakılmalıdır.
3. **Region Organizasyonu (VS Code Navigator):** Uzun dosyalar mutlaka `#region [BAŞLIK]` ve `#endregion` blokları ile bölümlere ayrılmalıdır. Bu, VS Code'un "Outline" (Anahat) panelinde net bir navigasyon sağlar ve AI'nın kodun yapısını daha hızlı kavramasına yardımcı olur.

---

## ☁️ Sovereign UI Transition (Tailwind-to-Vanilla)

**KRİTİK GEÇİŞ KURALI:** Proje, Tailwind CSS'ten tamamen Vanilla CSS ve Inline Style mimarisine geçmektedir.
- **Otomatik Arınma:** Herhangi bir dosyada işlem (modifikasyon/ekleme) istendiğinde, o dosyadaki tüm Tailwind sınıfları (className içindeki utility class'lar) **sorulmadan** temizlenmelidir.
- **Dönüşüm:** Temizlenen sınıflar, `src/ui/core/themes/index.css` içindeki tasarım token'larına (CSS Variables) bağlı Vanilla CSS veya Inline Styles (`style={{...}}`) olarak yeniden yazılmalıdır.
- **Zero-External CSS:** Yeni eklenen stiller harici bir `.css` dosyasına değil, dosya içi bütünlüğü korumak amacıyla bileşen dosyasına (co-location) eklenmelidir.

---

## 🛑 KESİN TALİMAT (Strict Mandate)

**KRİTİK KURAL:** Sana (Yapay Zeka) verilen mesajda ne söyleniyorsa **SADECE** onu yapacaksın. Kullanıcı tarafından açıkça istenmeyen hiçbir ekleme, düzeltme, modifikasyon veya "iyileştirme" yapman kesinlikle **YASAKTIR**.

- **Sadece söyleneni yap.**
- **Kendiliğinden iş çıkartma.**
- **ASLA AMA ASLA** belirtilen talimatın dışına çıkma.

---
*"Bu mimari, Flutter rehberindeki temel yapı üzerine inşa edilmiş, React ekosisteminin gücüyle geliştirilmiş LinguaLearn'e özel bir standarttır."*
