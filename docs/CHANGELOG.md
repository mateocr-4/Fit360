# Fit360 — Changelog

Todas las versiones notables del proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

---

## [1.1.0] — 2026-09-24

### Añadido
- **Escaneo de código de barras** — Nuevo módulo `BarcodeScanner` accesible desde el menú FAB (+)
  - Cámara trasera con html5-qrcode (EAN-13, EAN-8, UPC-A/E, Code128, Code39)
  - Búsqueda automática en Open Food Facts API
  - Tarjeta de resultado con imagen, nombre, marca y macros por 100g
  - Selector de comida con detección automática por hora del día
  - Botón de añadir directo al registro de nutrición
- Nuevo archivo `js/barcode-scanner.js`
- Animación CSS `barcodeScanAnim` para línea de escaneo
- CDN html5-qrcode v2.3.8 en `<head>`
- Modal `barcodeScanModal` con visor de cámara y marco de enfoque

### Cambiado
- `quickFabModal` — Añadida opción "📷 Escanear Código de Barras" como primera acción
- `index.html` — Botón de cámara añadido junto al buscador del modal de alimentos
- `css/animations.css` — Nuevo keyframe `barcodeScanAnim`

---

## [1.0.0] — 2026-09-XX

### Características Iniciales
- **Dashboard** con balance calórico, macros, Apple Fitness rings, peso, y gráfico semanal
- **Nutrición** — 50 alimentos preset, escalado por gramos, sistema de recetas, 5 comidas/día
- **Gimnasio** — 50+ ejercicios, series/reps/peso, temporizador de descanso, organizador de rutinas
- **Cardio** — Cinta, elíptica, bicicleta con cálculo de kcal
- **Analytics** — Distribución muscular (radar), progresión de fuerza, historial de peso
- **Social** — FitID, amigos P2P, compartir rutinas/recetas via QR
- **HealthSync** — Apple HealthKit + Renpho CSV import
- **Settings** — Perfil, calculadora de macros (Mifflin-St Jeor), export/import
- **PWA** — Service Worker cache-first, manifest, offline completo
- **iOS** — Capacitor 6.x, GitHub Actions CI para build IPA sin firma (Sideloadly)
- **Onboarding** — Guía interactiva de 5 pasos para primer uso
- **Widgets personalizables** — Drag & drop de orden en dashboard
