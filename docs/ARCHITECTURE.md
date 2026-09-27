# Fit360 — Architecture Document

**Version:** 1.1.0
**Last Updated:** 2026-09-24

---

## 1. Visión General de Arquitectura

Fit360 es una **Single-Page Application (SPA)** construida 100% en Vanilla JavaScript sin frameworks, empaquetada como app iOS nativa mediante **Capacitor** y distribuida sin App Store vía **Sideloadly**.

```
┌──────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                    │
│                                                            │
│  index.html (2900+ líneas)                                │
│  ┌─────────┬──────────┬─────┬───────┬────────┬──────────┐ │
│  │Dashboard│Nutrition │ Gym │Cardio │Analyt. │Social/   │ │
│  │         │          │     │       │        │Settings  │ │
│  └─────────┴──────────┴─────┴───────┴────────┴──────────┘ │
│  Bottom Nav: [Inicio] [Nutrición] [+FAB] [Gym] [Cardio]  │
│  Sidebar Drawer (menú lateral)                             │
│  Modales (bottom-sheet): ~20 modales flotantes             │
├──────────────────────────────────────────────────────────┤
│                      CAPA LÓGICA (JS)                     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ App (Router + Lifecycle + Modal Manager)              │ │
│  ├──────────┬───────────┬──────┬────────┬──────────────┤ │
│  │Dashboard │ Nutrition │ Gym  │ Cardio │  Analytics   │ │
│  ├──────────┼───────────┼──────┴────────┴──────────────┤ │
│  │Settings  │  Social   │  HealthSync  │BarcodeScanner│ │
│  ├──────────┴───────────┴──────────────┴──────────────┤ │
│  │ QRGenerator (offline, pure JS)                      │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ Storage (Persistence Layer) — localStorage          │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ ExercisesDB (Static Data — 50+ exercises)           │ │
│  └─────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│                  CAPA DE PLATAFORMA                       │
│                                                            │
│  ┌──────────────┬────────────────┬─────────────────────┐ │
│  │ Service      │ Capacitor 6.x  │ html5-qrcode        │ │
│  │ Worker (PWA) │ (iOS Bridge)   │ (CDN / Camera API)  │ │
│  ├──────────────┼────────────────┤                     │ │
│  │ Cache API    │ HealthKit      │                     │ │
│  │              │ Plugin         │                     │ │
│  └──────────────┴────────────────┴─────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│                  APIS EXTERNAS                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Open Food Facts (barcode lookup — solo con internet) │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Frontend** | HTML5 + Vanilla JS + CSS3 | ES2020+ | Toda la app |
| **Gráficos** | Chart.js | Local (bundled) | Gráficos de analytics |
| **Tipografía** | Outfit + Plus Jakarta Sans | Local (TTF) | 100% offline |
| **Escaneo** | html5-qrcode | 2.3.8 (CDN) | Barcode scanning |
| **QR** | QRGenerator (custom) | Built-in | Generación offline de QR |
| **Bridge Nativo** | Capacitor | 6.1.2 | iOS WKWebView container |
| **HealthKit** | @followathletics/capacitor-healthkit | 1.3.7 | Apple Health data |
| **Build** | Node.js (build_dist.js) | 20.x | Copy to www/ |
| **CI/CD** | GitHub Actions | macOS 14 | Build IPA unsigned |
| **PWA** | Service Worker | Cache-first | Offline support |
| **Persistencia** | localStorage | Browser API | Toda la data |

---

## 3. Estructura de Archivos

```
Fit360/
├── index.html                 # SPA monolítica (~2950 líneas)
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker (Cache-first)
├── capacitor.config.json      # Configuración Capacitor iOS
├── package.json               # Dependencias y scripts npm
├── build_dist.js              # Script de build (copia a www/)
│
├── css/
│   ├── variables.css          # Design tokens (colores, spacing, etc.)
│   ├── base.css               # Reset + estilos globales
│   ├── layout.css             # App shell, nav, sidebar, grid
│   ├── components.css         # Cards, buttons, pills, modals, forms
│   ├── animations.css         # Keyframes y clases de animación
│   ├── fonts.css              # @font-face local
│   └── fonts/                 # TTF files (Outfit, Plus Jakarta Sans)
│
├── js/
│   ├── app.js                 # Router, lifecycle, modales, PWA
│   ├── storage.js             # Capa de persistencia (localStorage)
│   ├── exercises-db.js        # Base de datos estática de ejercicios
│   ├── dashboard.js           # Dashboard + widgets + Chart.js
│   ├── nutrition.js           # Nutrición, macros, recetas
│   ├── gym.js                 # Gym, rutinas, temporizador
│   ├── cardio.js              # Cardio machines
│   ├── analytics.js           # Gráficos de progresión
│   ├── settings.js            # Configuración y perfil
│   ├── health-sync.js         # Apple HealthKit + Renpho
│   ├── social.js              # Amigos, FitID, compartir
│   ├── qr-generator.js        # Generador QR offline (pure JS)
│   ├── barcode-scanner.js     # Escáner de código de barras
│   └── chart.min.js           # Chart.js bundled
│
├── icons/                     # App icons (PWA + iOS)
│
├── ios/                       # Proyecto Xcode (Capacitor)
│   └── App/
│       ├── App.xcodeproj/
│       ├── App.xcworkspace/
│       └── Podfile
│
├── www/                       # Build output para Capacitor
│
└── .github/
    └── workflows/
        └── build-ipa.yml      # CI: build IPA para Sideloadly
```

---

## 4. Módulos y Responsabilidades

### 4.1 App (app.js) — Controller Principal

```
Responsabilidades:
├── Routing (navigateTo) — Switch entre tab-views por DOM toggle
├── Lifecycle (init) — Orquesta inicialización de todos los módulos
├── Date Management — Selector de fecha, navegación día a día
├── Modal Manager — openModal/closeModal/closeAllModals
├── Sidebar Drawer — Open/close con gestos swipe
├── Onboarding Guide — Wizard de 5 pasos para primer uso
├── PWA Install — beforeinstallprompt handler
├── iOS Detection — Detecta Safari/standalone
├── Ad Transparency — Aviso diario de futuros anuncios
└── Toast System — Notificaciones efímeras
```

### 4.2 Storage (storage.js) — Capa de Persistencia

```
Claves localStorage:
├── fit360_settings        → Perfil + goals + dashboard config
├── fit360_daily_data      → { "YYYY-MM-DD": { nutrition, gym, cardio, appleFitness } }
├── fit360_favorites       → Alimentos favoritos
├── fit360_muscle_groups   → Grupos musculares personalizados
├── fit360_custom_exercises→ Definiciones de ejercicios custom
├── fit360_weight_logs     → Array de pesajes con timestamp
├── fit360_custom_routines → Rutinas de gym creadas por el usuario
├── fit360_friends         → Lista de amigos (social P2P)
├── fit360_custom_recipes  → Recetas personalizadas
└── fit360_my_fit_id       → Identificador social único
```

### 4.3 Nutrition (nutrition.js)

- 50 alimentos preset con macros por 100g
- Escalado dinámico por gramos
- Sistema de recetas CRUD
- 5 comidas/día (desayuno → snacks)
- Compartir platos individuales

### 4.4 Gym (gym.js)

- Gestión de sesiones de pesas
- Rutinas: crear, editar, reordenar ejercicios
- Series con weight/reps/completed checkboxes
- Temporizador de descanso flotante
- Ejercicios y grupos musculares personalizables

### 4.5 BarcodeScanner (barcode-scanner.js)

- Abre cámara desde el menú FAB
- Detecta EAN-13, EAN-8, UPC-A/E, Code128/39
- Consulta Open Food Facts API
- Auto-detecta comida según hora del día
- Inserta alimento directo en storage

---

## 5. Flujo de Datos

```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌──────┐
│  UI/DOM  │────▸│  Module   │────▸│  Storage  │────▸│ Local│
│  Events  │     │  (JS obj) │     │  (facade) │     │Store │
│          │◂────│           │◂────│           │◂────│      │
└─────────┘     └──────────┘     └───────────┘     └──────┘
                     │
                     ▼ (solo barcode)
              ┌──────────────┐
              │ Open Food    │
              │ Facts API    │
              └──────────────┘
```

### Patrón de Actualización

1. **Evento** → onclick/oninput en HTML
2. **Módulo** → Procesa lógica, llama a `Storage.saveDayData()`
3. **Storage** → Serializa a JSON, escribe en `localStorage`
4. **Render** → Módulo llama a su propio `.render()` y/o notifica a otros

No hay data binding reactivo — es un patrón **imperativo pull-based**: cada módulo re-renderiza la sección de DOM que le pertenece cuando se invoca `.render()`.

---

## 6. Arquitectura CSS

```
variables.css
├── Design tokens: colores, gradientes, spacing, radii, sombras, tipografía
├── Safe area insets (iOS notch)
└── Transiciones reutilizables

base.css
├── Reset + box-sizing
├── Estilos globales (body, scrollbar, selection)
└── Utilities (text colors, font weights)

layout.css
├── App shell (header, main, bottom-nav)
├── Bottom navigation + FAB button
├── Sidebar drawer + overlay
├── Tab view switching (.tab-view.active)
├── Rest timer bar (floating)
└── Toast container

components.css  (37 KB — el más grande)
├── Cards (card, card-glow-*, card-header)
├── Buttons (btn, btn-primary/secondary/danger, icon-btn)
├── Pills/Chips (pill-cyan, pill-lime, pill-apple)
├── Forms (form-control, form-group, slider-range)
├── Modals (modal-overlay, modal-sheet, sheet-handle)
├── Progress bars
├── Onboarding slides
└── Social components

animations.css
├── fadeIn, slideDownToast, pulseGlow
├── pulseAppleGlow, floatGentle
├── Stagger list entrance (5 children)
└── barcodeScanAnim (scan line)
```

---

## 7. Estrategia de Caché (Service Worker)

```
Estrategia: Cache-First con fallback a Network

Install:
  → Pre-cache todos los assets estáticos (sw.js ASSETS array)

Fetch:
  → Si está en cache → responder desde cache
  → Si no → fetch de red → guardar en cache → responder

Activate:
  → Limpiar caches antiguos (versiones previas de CACHE_NAME)
```

**Cache Name:** `fit360-v6`

---

## 8. Pipeline de Build & Deploy

```
┌──────────┐   npm run build    ┌───────────┐   cap sync ios   ┌──────────┐
│ Source    │──────────────────▸│  www/      │────────────────▸│  Xcode   │
│ (root)   │  build_dist.js    │  (output)  │   CocoaPods     │  Project │
└──────────┘                   └───────────┘                  └──────────┘
                                                                    │
                                                              xcodebuild
                                                       (CODE_SIGNING=NO)
                                                                    │
                                                                    ▼
┌──────────┐  Sideloadly    ┌───────────┐  GitHub Actions   ┌──────────┐
│  iPhone  │◂──────────────│  .ipa      │◂─────────────────│   CI     │
│  (user)  │               │  (unsigned)│   macos-14        │  Build   │
└──────────┘               └───────────┘                   └──────────┘
```

### Scripts npm

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `live-server --port=3000` | Dev server local |
| `build` | `node build_dist.js` | Copia archivos a www/ |
| `cap:sync` | `build + npx cap sync ios` | Build + sync Capacitor |
| `cap:build` | `build + sync + cap open ios` | Full iOS pipeline |

---

## 9. Integraciones Nativas (Capacitor)

### HealthKit

```
Plugin: @followathletics/capacitor-healthkit
Permisos: weight, fatPercentage, activeEnergyBurned, stepCount, appleExerciseTime

Flujo:
  1. HealthSync.isNativeHealthKitAvailable() → check Capacitor bridge
  2. Solicitar permisos al usuario
  3. Leer datos del día
  4. Escribir en Storage.updateAppleFitness()
```

### Cámara (Barcode Scanner)

```
Librería: html5-qrcode (CDN, no nativo)
Acceso: navigator.mediaDevices.getUserMedia()
Requiere: NSCameraUsageDescription en Info.plist (iOS)
```

---

## 10. Decisiones Arquitectónicas

| Decisión | Justificación |
|----------|---------------|
| **Vanilla JS, sin framework** | Carga instantánea, zero bundle size overhead, control total |
| **Single-file HTML** | No necesita routing SPA complejo, toda la UI está predefinida en DOM |
| **localStorage** | Simplicidad, no necesita IndexedDB para el volumen de datos actual |
| **Objetos globales (`const Gym = {}`)** | Patrón módulo simple, sin importaciones ES modules para compatibilidad |
| **CSS modular sin pre-procesador** | CSS custom properties proveen suficiente abstracción |
| **Sin bundler (webpack/vite)** | El build es un simple `fs.copy`, elimina complejidad innecesaria |
| **CDN para html5-qrcode** | Solo se usa con internet (para buscar el producto también se necesita), no vale la pena bundlear |
| **IPA sin firma** | Sideloadly permite instalar sin cuenta de desarrollador Apple ($99/año) |

---

## 11. Limitaciones Conocidas

- **localStorage ~5-10MB** — Suficiente para uso personal, pero no escala a años de datos
- **No hay sincronización cloud** — Si el usuario pierde el teléfono, pierde los datos
- **IPA caduca cada 7 días** — Hay que re-instalar con Sideloadly (limitación de Apple)
- **Sin push notifications** — No hay backend para enviar notificaciones
- **html5-qrcode requiere HTTPS** — En dev local se usa `http://`, funciona en localhost pero no en LAN sin cert
