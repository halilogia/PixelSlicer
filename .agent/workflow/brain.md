---
description: dökümantasyon güncelleme komutu
---

tüm açıklamaları türkçe yaz
işlem başlamadan önce: universal-docs/universal-scripts brain-sync scriptini çalıştır. npx ts-node Universal-Docs/Universal-scripts/brain-sync.ts

1. brain klasöründeki implementation_plan.md dosyasını güncelle
2. brain klasöründeki walkthroug.md dosyasını güncelle
3. brain klasöründeki task.md dosyasını güncelle

işlem sırasında:

1. brain klasöründeki task.md dosyasını güncelle

işlem bittikten sonra:

1. yazılması gereken bilgi kalıcı olması gerekiyorsa brain klasöründeki knowledge.md dosyasının içerisindeki en alt satıra ekle.
2. brain klasöründeki roadmap dosyasında yapılan görevleri sil
3. brain klasöründeki changelog'a versiyonlama standartlarına uygun şekilde yeni versiyon ekle