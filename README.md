# 💪 Fit360 — Fitness & Nutrition Tracker para iOS

> Aplicación nativa para iOS de fitness, nutrición y entrenamiento de fuerza con arquitectura **offline-first**, sincronización en la nube con **Supabase**, autenticación oficial con **Sign in with Apple**, integración directa con **Apple HealthKit** y conexión inalámbrica con **básculas inteligentes Bluetooth (Renpho / BLE)**.

---

## ✨ Características Principales

- 🔐 **Autenticación Nativa (Apple HIG)** — Inicio de sesión oficial con **Sign in with Apple** (`@capacitor-community/apple-sign-in`) y correo electrónico, respaldado por políticas de aislamiento Row Level Security (RLS) en PostgreSQL.
- 🎯 **Onboarding Wizard Guiado** — Asistente inicial paso a paso para captura de biometría, cálculo automático de gasto calórico diario (TDEE) y reparto óptimo de macronutrientes mediante la fórmula de **Mifflin-St Jeor**.
- 📶 **Báscula Inteligente Bluetooth (BLE)** — Conexión inalámbrica nativa con básculas inteligentes (Renpho, QN-Scale, Yolanda y perfiles estándar Bluetooth SIG 0x181D) mediante `@capacitor-community/bluetooth-le`. Captura de peso en vivo y cálculo de porcentaje de grasa por bioimpedancia (BIA).
- 🍽️ **Nutrición & Macros** — Registro de 5 comidas diarias (Desayuno, Almuerzo, Merienda, Cena, Snacks) con catálogo integrado de alimentos y escalado dinámico por gramaje.
- 📷 **Escáner de Código de Barras** — Lector óptico 100% offline con cámara nativa (`html5-qrcode`) e identificación nutricional instantánea con Open Food Facts.
- 🍳 **Constructor de Recetas** — Creación de platos personalizados con cálculo automático de totales y porciones.
- 🏋️ **Gimnasio & Fuerza** — Catálogo de más de 50 ejercicios por grupo muscular, registro de series, pesos y repeticiones, temporizador de descanso flotante y organizador de rutinas.
- 🏃 **Cardio** — Registro de cinta, elíptica y bicicleta estática con cálculo de gasto calórico por parámetros mecánicos.
- ⌚ **Apple Fitness & HealthKit** — Sincronización bidireccional con Apple Salud: peso, grasa corporal, calorías activas, pasos y minutos de ejercicio.
- ☁️ **Motor Offline-First Resiliente** — Funciona al 100% sin conexión a internet. Los cambios se guardan localmente y se encolan en `syncQueue` (`js/supabase-client.js`) para subirse automáticamente a Supabase al recuperar la red.
- 🔒 **Privacidad Total (Apple Guidelines)** — Manifiesto de privacidad oficial `PrivacyInfo.xcprivacy`, aislamiento estricto de datos de salud (Guideline 27.4) y cero dependencias de CDNs externos (CSP endurecida).

---

## 🚀 Inicio Rápido (Desarrollo Local)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor local de desarrollo
npm run dev
# → http://localhost:3000
```

---

## 📱 Compilación y Sincronización para iOS

```bash
# 1. Empaquetar distribución web en /www
npm run build

# 2. Sincronizar assets, plugins y configuraciones con el proyecto iOS (Xcode)
npx cap sync ios

# 3. Abrir el proyecto en Xcode (requiere macOS)
npx cap open ios
```

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Propósito |
|---|---|---|
| **Runtime Móvil** | Capacitor 6 (`@capacitor/core@^6.1.2`, `@capacitor/ios`) | Bridge nativo de iOS para WebViews de alto rendimiento. |
| **Lógica del Cliente** | Vanilla JavaScript (ES2020+) | Arquitectura modular con cero overhead y carga ultrarrápida. |
| **Estilos & UI** | CSS3 Moderno (Custom Properties, Glassmorphism) | Dark luxury UI con transiciones CSS puras y safe-area adaptativa. |
| **Backend & Base de Datos** | Supabase (PostgreSQL 15+ con Row Level Security) | Almacenamiento seguro en la nube, triggers y autenticación. |
| **Autenticación Nativa** | `@capacitor-community/apple-sign-in@6.0.0` | Flujo nativo de Sign in with Apple según directrices de Apple. |
| **Hardware BLE (IoT)** | `@capacitor-community/bluetooth-le@6.1.0` | Conexión GATT y decodificación de básculas Bluetooth (Renpho). |
| **Salud y Métricas** | `@followathletics/capacitor-healthkit` | Intercambio de muestras con Apple HealthKit y Apple Fitness. |
| **Escáner Óptico** | `html5-qrcode` (bundle local) | Escaneo de códigos de barras sin dependencias externas. |
| **Gráficos & Analytics** | `chart.js` (bundle local) | Gráficos de progresión de cargas, radar muscular y peso. |

---

## 📂 Estructura del Repositorio

```
Fit360/
├── index.html                  # Single Page Application (SPA) con CSP estricta
├── PRD.md                      # Product Requirements Document (resumen ejecutivo)
├── ROADMAP.md                  # Hoja de ruta oficial de publicación en App Store
├── build_dist.js               # Script de compilación de assets limpios para /www
├── capacitor.config.json       # Configuración nativa de Capacitor iOS
├── package.json                # Dependencias oficiales y scripts del proyecto
├── css/                        # Hojas de estilo modulares
│   ├── variables.css           # Tokens de diseño, paleta dark luxury y tipografías
│   ├── base.css                # Reset y estilos globales
│   ├── layout.css              # Grid, headers y navegación
│   ├── components.css          # Botones, tarjetas, modales y pills
│   ├── animations.css          # Animaciones y transiciones de interfaz
│   ├── auth.css                # Vista y botones de autenticación (Apple HIG)
│   ├── onboarding.css          # Wizard de onboarding y previsualización metabólica
│   └── ble-scale.css           # Modal de conexión BLE con animación de radar
├── js/                         # Módulos JavaScript (Vanilla JS)
│   ├── app.js                  # Orquestador principal de vistas y eventos
│   ├── config.js               # Configuración segura de cliente Supabase
│   ├── security.js             # Sanitización de datos y validaciones de seguridad
│   ├── supabase-client.js      # Motor offline-first y cola de sincronización resiliente
│   ├── auth.js                 # Autenticación (Sign in with Apple y Email)
│   ├── onboarding.js           # Wizard de biometría, TDEE y HealthKit
│   ├── ble-scale.js            # Escáner BLE, GATT y decodificador de básculas
│   ├── health-sync.js          # Sincronización con HealthKit y Apple Fitness
│   ├── nutrition.js            # Lógica nutricional, comidas y recetas
│   ├── gym.js                  # Entrenamientos, series y rutinas de fuerza
│   ├── cardio.js               # Registro y cálculo de sesiones de cardio
│   ├── analytics.js            # Métricas, gráficas y cálculo de 1RM
│   ├── storage.js              # Capa de almacenamiento local
│   └── barcode-scanner.js      # Controlador de cámara y escaneo de alimentos
├── supabase/                   # Definición de infraestructura en la nube
│   └── schema.sql              # Esquema PostgreSQL: 9 tablas, RLS, triggers e índices
├── ios/                        # Proyecto nativo de Xcode (iOS)
│   └── App/
│       ├── App/Info.plist      # Descripciones de permisos de Salud, Bluetooth y ATT
│       └── App/PrivacyInfo.xcprivacy # Manifiesto oficial de privacidad de Apple
└── docs/                       # Documentación técnica exhaustiva
    ├── PRD.md                  # Especificación detallada de requerimientos
    ├── ARCHITECTURE.md         # Documento de arquitectura técnica
    ├── DATA_MODEL.md           # Modelo relacional y esquemas de datos
    └── CHANGELOG.md            # Historial de versiones y cambios
```

---

## 📖 Enlaces de Documentación

- 📋 **[Product Requirements Document (PRD)](PRD.md)** — Visión del producto, especificaciones funcionales y criterios de aceptación.
- 🗺️ **[Roadmap Oficial de Publicación (ROADMAP.md)](ROADMAP.md)** — Estado detallado de las 12 fases hacia la App Store.
- 🏛️ **[Arquitectura del Sistema (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)** — Flujos de datos, diseño offline-first y decisiones de ingeniería.

---

## 📄 Licencia

MIT © Mateo
