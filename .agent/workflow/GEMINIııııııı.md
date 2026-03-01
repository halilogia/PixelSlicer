# Mob Runner 3D - AI Kuralları

> **Proje**: Three.js + TypeScript + Capacitor mobil oyun
> **Son Güncelleme**: 2025-12-19

## 🔧 TypeScript Kuralları

### Zorunlu

- ✅ **Strict mode** aktif (`tsconfig.json`)
- ✅ **ES2020+** syntax (optional chaining, nullish coalescing)
- ✅ **Interface > Type** tercih et
- ✅ **const/let** kullan, `var` YASAK

### Kod Stili

```typescript
// ✅ DOĞRU
interface EnemyConfig {
  hp: number;
  speed: number;
  damage?: number; // Optional
}

const enemy: EnemyConfig = {
  hp: 100,
  speed: 2.5,
};

// Nullish coalescing + optional chaining
const damage = enemy.damage ?? 10;
const isAlive = enemy?.hp > 0;
```

---

## 🎮 Three.js Kuralları

### Performans

- ✅ **Object pooling** kullan (mermi, düşman spawn/despawn)
- ✅ **InstancedMesh** çok sayıda benzer obje için
- ✅ **Dispose** kullanılmayan geometry/material/texture
- ✅ **requestAnimationFrame** loop için

### Yapılmaması Gerekenler

```typescript
// ❌ YANLIŞ - Her frame'de yeni Vector3
function update() {
  const pos = new THREE.Vector3(x, y, z); // Memory leak!
}

// ✅ DOĞRU - Reuse
const tempVec = new THREE.Vector3();
function update() {
  tempVec.set(x, y, z);
}
```

### Manager Pattern

```typescript
// Tüm manager'lar singleton olmalı
export class SoundManager {
  private static instance: SoundManager;

  static getInstance(): SoundManager {
    if (!this.instance) {
      this.instance = new SoundManager();
    }
    return this.instance;
  }
}
```

---

## 📱 Capacitor Kuralları

### Zorunlu

- ✅ `dist/` klasörünü **SİLME** (build çıktısı)
- ✅ Build sonrası: `npx cap sync`
- ✅ Test için: `npx cap open android`

### gradle.properties (AndroidX)

```properties
android.useAndroidX=true
android.enableJetifier=true
```

### Mobil Optimizasyon

- ✅ Touch controls için `InputManager` kullan
- ✅ 60fps hedefle, gerekirse quality düşür
- ✅ Asset boyutlarını optimize et (WebP, compressed GLB)

---

## 📝 Dosya Oluşturma Kuralları

### Yeni Class Ekleme

1. `src/classes/` altına `.ts` dosyası oluştur
2. Interface tanımla
3. `game.ts` veya ilgili manager'dan import et

### Yeni Manager Ekleme

1. `src/managers/` altına `XxxManager.ts` oluştur
2. Singleton pattern uygula
3. `game.ts`'de initialize et

### Ayar Değişikliği

```typescript
// ❌ YANLIŞ - Hardcoded
const spawnRate = 200;

// ✅ DOĞRU - settings.ts kullan
import { GAME_CONFIG } from "./settings";
const spawnRate = GAME_CONFIG.spawnRate;
```

---

## 🚨 Kritik Kurallar

**Düzenlemeden önce `view_file` çağır** (context integrity)

---

_Bu dosya projeye özel AI kurallarını içerir. Evrensel kurallar için `docs/GEMINI.md` dosyasına bakın._
