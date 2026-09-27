# Fit360 — Guía de Contribución & Desarrollo

---

## 1. Requisitos Previos

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| **Node.js** | 20.x LTS | Runtime + npm |
| **npm** | 10.x+ | Gestor de paquetes |
| **Xcode** | 15.x+ | Compilación iOS (solo en Mac) |
| **CocoaPods** | 1.14+ | Dependencias iOS nativas |
| **Sideloadly** | Latest | Instalar IPA en iPhone sin App Store |

---

## 2. Setup Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/Fit360.git
cd Fit360

# 2. Instalar dependencias
npm install

# 3. Arrancar el servidor de desarrollo
npm run dev
# → Abre http://localhost:3000 en el navegador
```

---

## 3. Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Live server en puerto 3000 con hot-reload |
| `npm run build` | Copia archivos a `www/` para Capacitor |
| `npm run cap:sync` | Build + sincroniza con proyecto iOS |
| `npm run cap:build` | Build + sync + abre Xcode |
| `npm run prepare-sideload` | Prepara www/ para transferir a Mac |

---

## 4. Estructura de Módulos

Cada módulo JS sigue el patrón **Module Object**:

```javascript
const MiModulo = {
  // Estado interno
  _estado: null,

  // Se llama una vez al arrancar la app
  init() {
    this.render();
  },

  // Re-renderiza toda la sección de DOM que le pertenece
  render() {
    const data = Storage.getDayData(App.currentDate);
    // ... actualizar DOM
  },

  // Métodos de acción (invocados por onclick en HTML)
  hacerAlgo() {
    // lógica
    Storage.saveDayData(App.currentDate, data);
    this.render();
  }
};
```

### Reglas Clave

1. **No usar `import`/`export`** — Los módulos son objetos globales (`const X = {}`)
2. **No manipular DOM de otros módulos** — Cada módulo solo toca sus propios elementos
3. **Siempre pasar por `Storage`** — Nunca acceder a `localStorage` directamente desde un módulo
4. **Llamar a `.render()` tras cambios** — El patrón es imperativo, no reactivo
5. **Null-safe DOM access** — Siempre comprobar `if (el)` antes de manipular

---

## 5. Añadir un Nuevo Módulo

### Paso 1: Crear el archivo JS

```bash
# Ejemplo: js/mi-modulo.js
```

### Paso 2: Registrar en index.html

```html
<!-- Antes del cierre de </body>, después de app.js -->
<script src="js/mi-modulo.js?v=1"></script>
```

### Paso 3: Registrar en sw.js (Service Worker)

```javascript
const ASSETS = [
  // ... existing assets
  './js/mi-modulo.js',
];
```

Incrementar `CACHE_NAME` (ej: `fit360-v7`).

### Paso 4: Inicializar en App.init()

```javascript
// En app.js → init()
if (window.MiModulo) MiModulo.init();
```

---

## 6. Convenciones de Código

### JavaScript
- **Vanilla JS** — Sin frameworks ni librerías de utilidades
- **Nombres en inglés** para código, **español** para strings de UI
- **camelCase** para variables y funciones
- **PascalCase** para nombres de módulos
- **Prefijo `_`** para métodos internos/privados
- IDs de DOM: `camelCase` descriptivos (ej: `foodGramsSlider`, `mealList_desayuno`)

### CSS
- Usar **CSS custom properties** (`var(--accent-cyan)`) del design system
- No usar IDs para estilos — solo clases
- Nombres de clase: `kebab-case` (ej: `.card-glow-lime`, `.form-control`)
- Modificadores con sufijos: `.btn-primary`, `.pill-cyan`, `.fill-protein`

### HTML
- Eventos inline (`onclick="..."`) — es el patrón establecido del proyecto
- Estilos inline solo para overrides puntuales de layout
- Modales: estructura `.modal-overlay > .modal-sheet > .sheet-handle + .modal-header`

---

## 7. Build & Deploy iOS

### Desarrollo local (Windows/Mac/Linux)

```bash
npm run dev
# Abre localhost:3000 en Chrome con DevTools móvil
```

### Build para iOS (requiere Mac)

```bash
# 1. Build + sync
npm run cap:build

# 2. En Xcode: seleccionar target "App" → Product → Build
# 3. El IPA se genera sin firma (CODE_SIGNING_ALLOWED=NO)
```

### CI/CD (GitHub Actions)

El workflow `.github/workflows/build-ipa.yml` se ejecuta en cada push a `main`:

1. Checkout → npm install → build www → cap sync → pod install
2. xcodebuild (unsigned)
3. Package .ipa → Upload artifact (14 días retención)

Descargar el IPA desde GitHub → Actions → Artifacts → instalar con Sideloadly.

---

## 8. Testing

> ⚠️ **No hay tests automatizados actualmente.**

### Testing Manual

1. **Navegador** — Chrome DevTools con viewport iPhone 14 Pro (393×852)
2. **PWA** — Instalar desde Chrome → verificar offline
3. **iOS real** — Build IPA → Sideloadly → verificar HealthKit y cámara

### Checklist Pre-Commit

- [ ] Verificar que el build (`npm run build`) completa sin errores
- [ ] Verificar funcionalidad en modo offline (desconectar red)
- [ ] Comprobar que `sw.js` incluye los nuevos assets
- [ ] Incrementar version del cache (`CACHE_NAME`) si se añadieron/modificaron assets
- [ ] Probar en viewport móvil (Chrome DevTools)

---

## 9. Datos de Ejemplo

### Estructura de un día (Storage)

```json
{
  "2026-09-24": {
    "date": "2026-09-24",
    "nutrition": {
      "desayuno": [
        {
          "id": "food_1727211234567",
          "name": "Copos de avena integral",
          "grams": 60,
          "kcal": 222,
          "protein": 7.8,
          "carbs": 36,
          "fat": 4.2
        }
      ],
      "almuerzo": [],
      "merienda": [],
      "cena": [],
      "snacks": []
    },
    "appleFitness": {
      "activeKcal": 450,
      "steps": 8200,
      "exerciseTime": 45,
      "lastSync": "2026-09-24T18:30:00Z"
    },
    "gym": [
      {
        "id": "ex_1727211234567",
        "exerciseId": "bench_press",
        "name": "Press de Banca Plano con Barra",
        "category": "Pecho",
        "sets": [
          { "weight": 80, "reps": 8, "completed": true },
          { "weight": 80, "reps": 7, "completed": true }
        ]
      }
    ],
    "cardio": []
  }
}
```
