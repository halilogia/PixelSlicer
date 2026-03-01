# Git Divergence Çözüm Planı

Bu plan, `git pull` sırasında karşılaştığınız "divergent branches" (ayrışmış dallar) hatasını çözmek için gerekli komutları ve açıklamaları içerir.

## Durum Analizi
Yerel dalınız (`main`) ve uzak dalınız (`origin/main`) birbirinden farklı commit'lere sahip. Git, bu iki dalı nasıl birleştireceğine dair (merge mü, rebase mi?) bir tercih yapmanızı istiyor.

## Önerilen Çözümler

### Seçenek 1: Merge (Birleştirme - En Güvenli)
Yerel değişikliklerinizi ve uzak sunucudaki değişiklikleri bir "merge commit" ile birleştirir.
```bash
git config pull.rebase false
git pull origin main
```

### Seçenek 2: Rebase (Yeniden Temellendirme - Daha Temiz Geçmiş)
Yerel commit'lerinizi uzak sunucudaki güncel commit'lerin üzerine taşır.
```bash
git config pull.rebase true
git pull origin main
```

### Seçenek 3: Sadece Bu Sefer İçin (Yapılandırmayı Değiştirmeden)
```bash
git pull --rebase origin main
# VEYA
git pull --no-rebase origin main
```

## Karar Rehberliğine Göre Öneri
⚠️ **Risk**: Eğer yerel commit'lerinizle uzak sunucudaki kodlar aynı satırları değiştirmişse, her iki durumda da **Conflict (Çakışma)** çıkacaktır.
✅ **Öneri**: Genellikle `rebase` daha temiz bir ağaç yapısı sunar. Ancak çekiniyorsanız `merge` (rebase false) en standart yoldur.

## Doğrulama
Komutları çalıştırdıktan sonra:
```bash
git status
```
komutu ile her şeyin güncel olduğunu teyit edebilirsiniz.
