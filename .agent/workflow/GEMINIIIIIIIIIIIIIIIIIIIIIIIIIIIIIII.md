# Tehlikeli Kıyılar - Gemini CLI Kuralları

## 📁 Proje Türü

Bu bir **React + Three.js 3D Harita/Strateji Oyunu** projesidir.

## 🎮 Oyun Geliştirme Kuralları

### Three.js / React Three Fiber

```typescript
// ✅ Doğru: Deklaratif JSX kullan
<mesh position={[0, 0, 0]}>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="blue" />
</mesh>;

// ❌ Yanlış: İmperatif Three.js kodu
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

### Performans Kuralları

1. **useFrame içinde setState yapma** - RAF içinde React state güncellemesi performans düşürür
2. **Geometry'leri paylaş** - Aynı şekiller için geometry instance kullan
3. **Material'leri cache'le** - Her render'da yeni material oluşturma
4. **Dispose çağır** - Unmount'ta geometry ve material'leri dispose et

### Tip Tanımları

```typescript
// types.ts dosyasına ekle
interface Province {
  id: string;
  name: string;
  position: [number, number, number];
  // ...
}
```

## 🔧 Kod Standartları

### State Management

- Basit state için `useState`
- Karmaşık state için `useReducer`
- Global state gerekirse Zustand tercih et

### Naming Conventions

| Tür            | Format                 | Örnek               |
| -------------- | ---------------------- | ------------------- |
| Component      | PascalCase             | `MapCanvas.tsx`     |
| Hook           | camelCase + use prefix | `useMapControls`    |
| Util           | camelCase              | `calculateDistance` |
| Constant       | UPPER_SNAKE            | `MAX_ZOOM_LEVEL`    |
| Type/Interface | PascalCase             | `ProvinceData`      |

### Import Sırası

```typescript
// 1. React ve core
import { useState, useEffect } from "react";

// 2. Three.js ve R3F
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// 3. External libraries
import { MapPin } from "lucide-react";

// 4. Internal components
import { Sidebar } from "./components/Sidebar";

// 5. Types ve utils
import type { Province } from "./types";
import { calculateBounds } from "./utils/geometry";
```


## ⚠️ Dikkat Edilecekler

1. **Memory Leaks** - Three.js objelerini cleanup et
2. **Re-render** - useMemo/useCallback gereksiz yere kullanma, React Compiler'a güven
3. **Asset Loading** - Büyük modelleri lazy load et
4. **Mobile** - Touch events'i destekle
