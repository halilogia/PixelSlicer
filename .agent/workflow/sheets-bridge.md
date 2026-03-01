---
description: Google Sheets kullanarak İngilizce kelimeleri Türkçeye çevirme ve senkronize etme iş akışı.
---

# 📊 Google Sheets - Kelime Çeviri ve Senkronizasyon Akışı

Bu iş akışı, projedeki İngilizce kelime dosyalarını (`src/data/json/vocabulary/`) Google Sheets'e aktarır, orada otomatik (`=GOOGLETRANSLATE`) veya manuel olarak Türkçeye çevirir ve ardından bu çevirileri projeye (`src/data/translations/tr/vocabulary/`) geri çeker.

## 🛠 Kullanılan Scriptler

Scriptler `scripts/bridge/` klasöründe toplanmıştır:

1.  **`custom-bridge-sync.ts`**: Yerel JSON dosyalarını Google Sheets'e gönderir.
2.  **`custom-bridge-pull.ts`**: Google Sheets'teki çevrilmiş verileri projeye geri çeker.
3.  **`google-sheets-sync.ts`**: (Alternatif) Google Cloud Service Account kullanarak doğrudan senkronizasyon yapar.

---

## 🏃‍♂️ İş Akışı Adımları

### 1. Verileri Google Sheets'e Gönderme (Push)
Yerel kelime dosyalarınızı tabloya aktarmak için:
```bash
npm run vocab:push
```
*Bu komut içindeki `WEB_APP_URL` üzerinden Google Apps Script'e bağlanır ve verileri tabloya "düzleştirerek" (ID, Word, Path, English, Turkish) ekler.*

### 2. Google Sheets Üzerinde Çeviri
Tabloda `Turkish` sütunu genellikle otomatik olarak `=GOOGLETRANSLATE` formülü ile dolar.
- **Otomatik Çeviri**: Formüllerin çalışması için sayfayı yenilemeniz veya formülleri aşağı çekmeniz gerekebilir.
- **Manuel Düzeltme**: Otomatik çeviriler hatalıysa tablo üzerinde manuel olarak düzeltebilirsiniz.

### 3. Çevirileri Projeye Geri Çekme (Pull - API)
Tablodaki düzeltilmiş verileri JSON formatında projeye geri almak için:
```bash
npm run vocab:pull
```

---

## 📂 Alternatif: Manuel CSV Yolu

Eğer Google API/Web App ayarlarıyla uğraşmak istemiyorsanız:

1.  **Dışa Aktar**: `npm run vocab:csv:export` (Yerelde bir CSV dosyası oluşturur).
2.  **Tabloya Yükle**: Oluşan CSV'yi Google Sheets'e "Dosya -> İçe Aktar" diyerek yükle.
3.  **İndir**: Tabloda çevirileri yaptıktan sonra "Dosya -> İndir -> CSV" diyerek bilgisayarına indir.
4.  **İçe Aktar**: İndirdiğin dosyayı projedeki kök dizine koy ve `npm run vocab:csv:import` komutunu çalıştır.

---

## 🏗 Teknik Yapı (Custom Bridge)

Bu sistem, Google Sheets tarafında çalışan bir **Apps Script (Web App)** ile konuşur.
- **Flattening**: Karmaşık JSON (arrays, nested objects) tabloya uygun şekilde düzleştirilir.
- **Bridge**: Google'ın kotalarına ve API karmaşıklığına takılmadan hızlı veri transferi sağlar.

> ⚠️ **Not**: Eğer `WEB_APP_URL` değişirse, `scripts/bridge/` altındaki ilgili dosyalarda güncellenmelidir.
