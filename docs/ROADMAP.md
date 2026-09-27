# 🗺️ Fit360 — Hoja de Ruta de Tareas Pendientes (Roadmap Oficial)

> **Proyecto:** Fit360 (Fitness & Nutrition Tracker)  
> **Versión objetivo:** 1.1.0 (Producción / App Store)  
> **Fecha de actualización:** 26 de septiembre de 2026  
> **Objetivo primordial:** Eliminar dependencias no oficiales (Sideloadly), integrar backend con Supabase (Auth + BBDD en la nube), configurar monetización con AdMob, cumplir con las directrices de Apple (App Store Review Guidelines) y publicar la aplicación en iOS App Store.

---

## 📊 Índice de Fases y Progreso

| Fase | Descripción | Prioridad | Estado |
|:---:|---|:---:|:---:|
| **1** | [Cuenta y Certificados de Apple](#fase-1--cuenta-y-certificados-de-apple-bloqueante) | 🔴 Crítica | `0/5` |
| **2** | [Configuración de Xcode y Entitlements](#fase-2--configuración-del-proyecto-xcode-y-entitlements) | 🔴 Crítica | `0/9` |
| **3** | [Limpieza de Código: Eliminación de Sideloadly e IPs](#fase-3--limpieza-de-código-eliminación-de-sideloadly-e-ips) | 🔴 Crítica | `0/8` |
| **4** | [Supabase — Backend, Autenticación y Base de Datos](#fase-4--supabase--backend-autenticación-y-base-de-datos) | 🔴 Crítica | `0/10` |
| **5** | [Monetización: AdMob y App Tracking Transparency](#fase-5--monetización-admob-y-app-tracking-transparency) | 🟡 Alta | `0/8` |
| **6** | [Seguridad, Dependencias Locales y Hardening](#fase-6--seguridad-dependencias-locales-y-hardening) | 🟡 Alta | `0/6` |
| **7** | [Privacidad, Compliance y Aspectos Legales](#fase-7--privacidad-compliance-y-aspectos-legales) | 🔴 Crítica | `0/7` |
| **8** | [Material Gráfico y Listing de App Store Connect](#fase-8--material-gráfico-y-listing-de-app-store-connect) | 🟡 Alta | `0/6` |
| **9** | [Testing, QA y Calidad de Experiencia de Usuario](#fase-9--testing-qa-y-calidad-de-experiencia-de-usuario) | 🟡 Alta | `0/7` |
| **10** | [Automatización CI/CD para App Store & TestFlight](#fase-10--automatización-cicd-para-app-store--testflight) | 🟡 Alta | `0/4` |
| **11** | [Envío a Revisión y Gestión de App Review](#fase-11--envío-a-revisión-y-gestión-de-app-review) | 🔴 Crítica | `0/4` |
| **12** | [Mejoras Técnicas Post-Lanzamiento](#fase-12--mejoras-técnicas-post-lanzamiento) | 🟢 Media | `0/5` |

---

## FASE 1 — Cuenta y Certificados de Apple (BLOQUEANTE)
> **Prioridad:** 🔴 CRÍTICA — Sin esta fase no es posible firmar ni distribuir la app en dispositivos iOS ni App Store.  
> **Plazo estimado:** 1-2 días laborables (sujeto a validación de identidad por parte de Apple).

### 1.1 Inscripción en Apple Developer Program
- [ ] **Crear o preparar Apple ID:** Asegurar un Apple ID con autenticación de dos factores (2FA) activa.
- [ ] **Acceder a portal:** Ingresar en [developer.apple.com/programs](https://developer.apple.com/programs/).
- [ ] **Pago de suscripción:** Abonar la cuota anual ($99 USD + impuestos aplicables).
- [ ] **Verificación de cuenta:** Completar verificación de identidad (DNI/pasaporte si Apple lo requiere vía la app Apple Developer).
- [ ] **Acceso a consolas:** Confirmar acceso operativo a [developer.apple.com/account](https://developer.apple.com/account) y [appstoreconnect.apple.com](https://appstoreconnect.apple.com).

### 1.2 Registro de Identificador de App (App ID)
- [ ] **Acceder a Identifiers:** Entrar en *Certificates, Identifiers & Profiles* → *Identifiers*.
- [ ] **Crear App ID explícito:** Seleccionar tipo *App IDs* → *App*.
  - **Description:** `Fit360 Fitness Tracker`
  - **Bundle ID:** `Explicit` → `com.mateo.fit360` (debe coincidir con `capacitor.config.json`).
- [ ] **Activar Capability HealthKit:** Marcar la casilla `HealthKit` en la pestaña de Capabilities.
- [ ] **Activar Capability Sign in with Apple:** Marcar la casilla `Sign in with Apple` (obligatorio al usar login social y requerido por Supabase Auth con proveedor Apple).
- [ ] **Activar Capability App Groups (opcional/recomendado):** Habilitar `App Groups` si se planean Widgets nativos de iOS en el futuro (`group.com.mateo.fit360`).

### 1.3 Generación de Certificados de Firma
- [ ] **Certificado de Distribución:** Generar un certificado de tipo *Apple Distribution* (para TestFlight y App Store).
  - Vía Xcode: *Settings* → *Accounts* → Seleccionar Apple ID → *Manage Certificates* → Añadir *Apple Distribution*.
  - O vía Web: Generar Certificate Signing Request (CSR) desde *Acceso a Llaveros (Keychain Access)* en macOS y subirlo al portal de Apple Developer.
- [ ] **Certificado de Desarrollo (Development):** Generar un certificado *Apple Development* para depuración local en dispositivo físico.
- [ ] **Exportación segura:** Exportar el certificado de distribución en formato `.p12` con contraseña segura (requerido para pipelines de CI/CD). Guardar copia en gestor de contraseñas.

### 1.4 Creación de Perfiles de Aprovisionamiento (Provisioning Profiles)
- [ ] **Perfil App Store Distribution:**
  - Crear perfil de tipo *App Store*.
  - Asociar al App ID `com.mateo.fit360`.
  - Asociar al certificado *Apple Distribution* generado en 1.3.
  - Descargar e instalar en Xcode (o configurar *Automatic Signing*).
- [ ] **Perfil Development (para pruebas locales):**
  - Crear perfil *iOS App Development* asociando dispositivos de prueba registrados (UDIDs).

---

## FASE 2 — Configuración del Proyecto Xcode y Entitlements
> **Prioridad:** 🔴 CRÍTICA — Requisitos técnicos de empaquetado para evitar rechazos automatizados en App Store Connect.  
> **Ubicación:** `ios/App/App.xcworkspace` e `ios/App/App/Info.plist`.

### 2.1 Configuración de Firma y Target en Xcode
- [ ] **Vincular Team:** En Xcode, seleccionar el proyecto `App` → Target `App` → pestaña *Signing & Capabilities*:
  - Marcar `Automatically manage signing`.
  - Seleccionar el Team asociado a la cuenta de desarrollador de pago.
  - Verificar que el *Bundle Identifier* sea exactamente `com.mateo.fit360`.
- [ ] **Verificar Capability de HealthKit:** Asegurar que aparezca HealthKit en la lista de Capabilities del target. Si no aparece, pulsar `+ Capability` y agregar `HealthKit`.
- [ ] **Añadir Capability Sign in with Apple:** Pulsar `+ Capability` y agregar `Sign in with Apple`. Es obligatorio si la app ofrece inicio de sesión con cuentas de terceros (Guideline 4.8 — Sign in with Apple).
- [ ] **Actualizar Deployment Target:**
  - En `Podfile`: cambiar `platform :ios, '13.0'` por `platform :ios, '16.0'`.
  - En Xcode Target Settings: subir *Minimum Deployments* a `iOS 16.0` (garantiza compatibilidad con las APIs modernas de Safari/WebKit y HealthKit).
- [x] **Arquitectura de dispositivos:** En `Info.plist`, modificar `UIRequiredDeviceCapabilities` para quitar `armv7` (obsoleto 32-bit) y especificar únicamente `arm64`.

### 2.2 Declaración de Permisos en Info.plist (Motivo de rechazo nº1)
- [x] **Permiso de Cámara (`NSCameraUsageDescription`):** Añadido a `Info.plist` con explicación clara para escaneo de códigos de barra.
- [x] **Permisos de Salud (HealthKit):** Declaradas cadenas en español para lectura de actividad y sincronización.
- [x] **Permiso de Tracking (ATT) para AdMob:** Añadido `NSUserTrackingUsageDescription` en `Info.plist`.
- [x] **Idioma principal del Bundle:** Configurado `CFBundleDevelopmentRegion` a `es`.
- [x] **Orientación bloqueada a Vertical (Portrait):** Restringido a `UIInterfaceOrientationPortrait`.

### 2.3 Creación del Manifiesto de Privacidad (`PrivacyInfo.xcprivacy`)
- [x] **Requisito obligatorio de Apple (desde mayo 2024):** Creado el archivo `ios/App/App/PrivacyInfo.xcprivacy`.
- [x] **Declarar APIs de uso restringido:** Declarado `NSPrivacyAccessedAPICategoryUserDefaults` con motivo `CA92.1`.
- [x] **Declarar uso de Tracking (AdMob):** Declarado `NSPrivacyTracking: true` y dominios de Google AdMob.
- [x] **Declarar categorías de datos:** Salud, Actividad Física e Identificador de Dispositivo para publicidad.
- [ ] **Vincular en Xcode:** Asegurar que el archivo esté incluido en el target principal en *Build Phases* → *Copy Bundle Resources*.

### 2.4 Control de Versiones y Build Numbers
- [ ] **Sincronización semántica:**
  - `package.json`: `"version": "1.1.0"`
  - `capacitor.config.json`
  - Xcode Target: *Marketing Version* = `1.1.0`
- [ ] **Estrategia de Build Number:** Configurar *Current Project Version* (`CFBundleVersion`) iniciando en `1` e incrementando en cada subida a TestFlight/App Store Connect (`1`, `2`, `3`, ...).

### 2.5 Icono de la Aplicación y Launch Screen
- [ ] **Icono 1024×1024 px:** Generar icono maestro `AppIcon-512@2x.png` en `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
  - Dimensiones: 1024 × 1024 px exactos.
  - Formato PNG **sin canal alfa ni transparencias** (Apple rechaza binarios con transparencias en el icono).
  - Fondo plano `#0a0c14` y sin esquinas redondeadas pre-renderizadas.
- [ ] **Ajuste de Launch Screen (Splash):** Verificar que `LaunchScreen.storyboard` y los assets en `Splash.imageset` respeten el safe-area superior (Dynamic Island / Notch) e inferior (Home Indicator) con fondo `#0a0c14`.

---

## FASE 3 — Limpieza de Código: Eliminación de Sideloadly e IPs
> **Prioridad:** 🔴 CRÍTICA — La presencia de referencias a sideloading, IPs privadas o instrucciones para instalar fuera de App Store provocará el **rechazo fulminante** en la revisión de Apple (Guideline 2.3 - Accurate Metadata y Guideline 2.5 - Software Requirements).  
> **Archivos afectados:** `index.html`, `js/app.js`, `js/health-sync.js`, `package.json`, `README.md`.

### 3.1 Eliminación de UI de Sideloadly en `index.html`
- [x] **Modal de instalación iOS (`iosInstallModal`):** Eliminado por completo de `index.html`.
- [x] **Banner de instalación iOS (`iosInstallBanner`):** Eliminado por completo de `index.html`.
- [x] **Texto de advertencia sobre Sideloadly en HealthKit:** Sustituido por instrucciones oficiales de permisos de Apple Salud.

### 3.2 Limpieza en `js/app.js`
- [x] **Eliminar funciones de Sideloadly:** Eliminadas `openIosModal()`, `closeIosModal()`, `dismissIosBanner()`, `checkIosStatus()`, `fallbackCopy()`.
- [x] **Eliminar IP privada hardcodeada (`copyIosUrl`):** Eliminada la función y la IP `192.168.1.135:3000`.
- [x] **Limpiar ciclo de inicio (`init`):** Removida la llamada a `this.checkIosStatus()` dentro de `init()`.

### 3.3 Mensajes de error en `js/health-sync.js`
- [x] **Eliminar mención a Sideloadly:** Sustituido el mensaje de advertencia por el texto oficial de permisos de Apple Salud.

### 3.4 Limpieza de Metadatos en `package.json` y Scripts
- [x] **Actualizar descripción del proyecto:** Cambiado a `"Fit360 - Fitness & Nutrition Tracker para iOS"`.
- [x] **Renombrar scripts de sideloading:** Renombrado a `"prepare:ios"` y `"build:ios"`.

### 3.5 Ocultar o Condicionar "Cargar Datos Demo" y "Transparencia de Anuncios"
- [ ] **Botón "Cargar datos demo":** En [`js/settings.js`](file:///c:/Users/Mateo/Proyectos/Fit360/js/settings.js) y Settings UI, ocultar el botón de datos de demostración o condicionarlo a un modo debug activable únicamente con 5 toques en el número de versión (evita que el revisor de Apple crea que la app es incompleta o un prototipo).
- [ ] **Modal de Transparencia de Anuncios (`adTransparencyModal`):** Mantener pero actualizar el contenido para reflejar la integración real de AdMob (Fase 5), informando al usuario sobre el tipo de anuncios que verá.

---

## FASE 4 — Supabase — Backend, Autenticación y Base de Datos
> **Prioridad:** 🔴 CRÍTICA — Sin esta fase los datos del usuario residen exclusivamente en `localStorage` (~5 MB máx.), se pierden al desinstalar la app y no hay posibilidad de sincronización entre dispositivos.  
> **Plazo estimado:** 5-7 días laborables.  
> **Impacto:** Afecta a `js/storage.js`, `js/app.js`, `js/settings.js`, `index.html`, `capacitor.config.json` y la política de privacidad.

### 4.1 Creación del Proyecto en Supabase
- [ ] **Crear cuenta y proyecto:**
  - Registrarse en [supabase.com](https://supabase.com) (tier gratuito suficiente para el lanzamiento).
  - Crear proyecto: **Nombre:** `fit360-prod`, **Región:** `eu-west-1` (Frankfurt, menor latencia para España).
  - Guardar de forma segura: `SUPABASE_URL` y `SUPABASE_ANON_KEY` (clave pública para el cliente).
- [ ] **Configurar variables de entorno:**
  - Crear archivo `js/config.js` con las credenciales de Supabase (la `anon key` es pública y segura para el cliente gracias a RLS):
    ```javascript
    const SUPABASE_CONFIG = {
      url: 'https://<project-id>.supabase.co',
      anonKey: '<anon-public-key>'
    };
    ```
  - **NUNCA exponer la `service_role_key`** en código cliente.

### 4.2 Autenticación — Sign in with Apple + Email
- [ ] **Configurar proveedor Apple en Supabase Dashboard:**
  - En *Authentication* → *Providers* → Habilitar **Apple**.
  - Configurar el *Service ID*, *Team ID*, *Key ID* y la clave privada `.p8` generada en el portal de Apple Developer (Fase 1).
  - URL de callback: `https://<project-id>.supabase.co/auth/v1/callback`.
- [ ] **Configurar proveedor Email (opcional pero recomendado):**
  - En *Authentication* → *Providers* → Habilitar **Email** con confirmación por email.
  - Personalizar templates de email (verificación, recuperación de contraseña) en español.
- [ ] **Instalar cliente de Supabase en el proyecto:**
  ```bash
  npm install @supabase/supabase-js
  ```
  - Para Capacitor (entorno web con bridge nativo), usar el bundle ESM o incluir vía CDN local bundleado.
- [ ] **Implementar flujo de autenticación en la app:**
  - Crear módulo `js/auth.js` con las funciones:
    - `signInWithApple()` — Usa el plugin `@capacitor/sign-in-with-apple` para obtener el token nativo de Apple y pasarlo a `supabase.auth.signInWithIdToken()`.
    - `signInWithEmail(email, password)` — Login por email/contraseña.
    - `signUp(email, password)` — Registro con email.
    - `signOut()` — Cerrar sesión y limpiar estado local.
    - `getSession()` — Obtener sesión activa y refrescar token automáticamente.
    - `onAuthStateChange(callback)` — Escuchar cambios de sesión.
  - **Regla de Apple (Guideline 4.8):** Si ofreces login con email, **DEBES** ofrecer también Sign in with Apple como opción.
- [ ] **Crear UI de login/registro:**
  - Diseñar pantalla de inicio de sesión acorde a la estética actual (fondo `#0a0c14`, estilo glassmorphism):
    - Botón principal: **"Iniciar sesión con Apple"** (botón nativo `ASAuthorizationAppleIDButton` con estilo `.white` sobre fondo oscuro).
    - Botón secundario: **"Continuar con email"**.
    - Enlace inferior: *"Usar sin cuenta (datos solo en este dispositivo)"* para permitir uso offline sin registro.
  - Mostrar la pantalla de login al primer arranque o cuando no haya sesión activa.

### 4.3 Diseño del Esquema de Base de Datos (PostgreSQL)
- [ ] **Crear tablas en Supabase SQL Editor:**

  ```sql
  -- Perfil de usuario y ajustes
  CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    weight DECIMAL(5,2),        -- kg
    height DECIMAL(5,2),        -- cm
    sex TEXT CHECK (sex IN ('male', 'female', 'other')),
    birth_date DATE,
    goals JSONB DEFAULT '{}'::JSONB,        -- {kcal, protein, carbs, fat, water, ...}
    preferences JSONB DEFAULT '{}'::JSONB,  -- {dashboardWidgets, theme, units, ...}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Registros diarios (nutrición, agua, resumen)
  CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    meals JSONB DEFAULT '{}'::JSONB,        -- {breakfast: [...], lunch: [...], ...}
    water_ml INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
  );

  -- Historial de peso corporal
  CREATE TABLE weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    weight DECIMAL(5,2) NOT NULL,           -- kg
    fat_percentage DECIMAL(4,1),
    notes TEXT
  );

  -- Sesiones de entrenamiento (gym + cardio)
  CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_date DATE NOT NULL,
    workout_type TEXT CHECK (workout_type IN ('gym', 'cardio')) NOT NULL,
    data JSONB NOT NULL,                    -- {exercises: [...], duration, kcal, ...}
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Ejercicios personalizados del usuario
  CREATE TABLE custom_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Rutinas personalizadas
  CREATE TABLE custom_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    exercises JSONB NOT NULL,               -- [{exerciseId, sets, reps, weight}, ...]
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Recetas personalizadas
  CREATE TABLE custom_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    ingredients JSONB NOT NULL,             -- [{name, grams, kcal, protein, ...}, ...]
    total_macros JSONB,                     -- {kcal, protein, carbs, fat}
    servings INTEGER DEFAULT 1,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Alimentos favoritos
  CREATE TABLE favorite_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    food_data JSONB NOT NULL,               -- datos completos del alimento
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Índices para rendimiento
  CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
  CREATE INDEX idx_weight_logs_user ON weight_logs(user_id, logged_at DESC);
  CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id, session_date DESC);
  ```

- [ ] **Crear triggers de `updated_at`:**
  ```sql
  CREATE OR REPLACE FUNCTION update_modified_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON daily_logs
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON custom_routines
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  ```

### 4.4 Row Level Security (RLS) — Aislamiento de Datos por Usuario
- [ ] **Habilitar RLS en todas las tablas:**
  ```sql
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;
  ALTER TABLE custom_routines ENABLE ROW LEVEL SECURITY;
  ALTER TABLE custom_recipes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
  ```
- [ ] **Crear políticas de acceso (cada usuario solo ve/modifica sus propios datos):**
  ```sql
  -- Política genérica para todas las tablas con columna user_id
  CREATE POLICY "Users can CRUD own data" ON daily_logs
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Repetir para: weight_logs, workout_sessions, custom_exercises,
  --               custom_routines, custom_recipes, favorite_foods

  -- Política especial para user_profiles (la PK es el id del usuario)
  CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  ```
- [ ] **Verificar aislamiento:** Probar desde el SQL Editor que un usuario no pueda consultar datos de otro.

### 4.5 Refactorización de `js/storage.js` — Capa Híbrida Local + Nube
- [ ] **Crear módulo `js/supabase-client.js`:**
  - Inicializar el cliente de Supabase:
    ```javascript
    import { createClient } from '@supabase/supabase-js';
    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    ```
  - Exportar funciones CRUD genéricas: `fetchData(table, filters)`, `upsertData(table, data)`, `deleteData(table, id)`.
- [ ] **Refactorizar `Storage` para arquitectura offline-first:**
  - **Escritura:** Guardar siempre en `localStorage` primero (respuesta instantánea) y encolar la sincronización con Supabase en segundo plano.
  - **Lectura:** Leer de `localStorage` (velocidad) y reconciliar con Supabase cuando haya conexión.
  - **Cola de sincronización (`syncQueue`):** Mantener un array en `localStorage` con las operaciones pendientes de subir al servidor. Procesar la cola cuando se detecte conexión (`navigator.onLine` + evento `online`).
  - **Resolución de conflictos:** Estrategia *last-write-wins* basada en `updated_at`. El campo `updated_at` del servidor decide en caso de conflicto.
- [ ] **Migración inicial de datos existentes:**
  - Al registrarse/iniciar sesión por primera vez, detectar si hay datos en `localStorage` (del uso previo sin cuenta).
  - Mostrar diálogo: *"Se han encontrado datos existentes en este dispositivo. ¿Deseas subirlos a tu cuenta para no perderlos?"*
  - Si acepta: migrar todos los registros de `localStorage` a las tablas de Supabase asociándolos al `user_id`.

### 4.6 Integración con Módulos Existentes
- [ ] **Actualizar `js/nutrition.js`:** Reemplazar llamadas directas a `localStorage` por `Storage.saveDailyData()` / `Storage.loadDailyData()` refactorizados.
- [ ] **Actualizar `js/gym.js`:** Guardar sesiones de entrenamiento vía el nuevo `Storage` con sync.
- [ ] **Actualizar `js/cardio.js`:** Guardar sesiones de cardio vía el nuevo `Storage` con sync.
- [ ] **Actualizar `js/settings.js`:** Guardar/cargar perfil y preferencias desde `user_profiles`.
- [ ] **Actualizar `js/dashboard.js`:** Cargar datos del día desde la nueva capa `Storage` unificada.
- [ ] **Gestión de sesión en `js/app.js`:** En `init()`, verificar sesión de Supabase. Si hay sesión activa, iniciar sincronización en background. Si no hay sesión, operar en modo solo-local.

### 4.7 Indicadores de Sincronización en la UI
- [ ] **Icono de estado de sync en el header:**
  - ☁️✅ Sincronizado (todo al día).
  - ☁️🔄 Sincronizando... (cola en proceso).
  - ☁️❌ Sin conexión (modo offline, datos seguros en local).
- [ ] **Ajustes de cuenta en Settings:**
  - Mostrar email/Apple ID vinculado.
  - Botón *"Cerrar sesión"*.
  - Botón *"Eliminar cuenta y todos mis datos"* (derecho al olvido, GDPR/LOPDGDD).
  - Indicador de último sincronizado: *"Última sincronización: hace 3 minutos"*.

---

## FASE 5 — Monetización: AdMob y App Tracking Transparency
> **Prioridad:** 🟡 ALTA — La integración de anuncios debe estar configurada y testeada antes del envío a revisión. Apple verifica el cumplimiento de ATT y las declaraciones de privacidad asociadas.  
> **Plazo estimado:** 2-3 días laborables.  
> **Dependencias:** Fase 2 (ATT en Info.plist), Fase 7 (declaraciones de privacidad).

### 5.1 Configuración de la Cuenta de Google AdMob
- [ ] **Crear cuenta en [admob.google.com](https://admob.google.com):**
  - Registrar la aplicación iOS: nombre `Fit360`, plataforma iOS, Bundle ID `com.mateo.fit360`.
  - Generar los **Ad Unit IDs** para cada formato de anuncio:
    - Banner: `ca-app-pub-XXXXX/YYYYY`
    - Interstitial (opcional): `ca-app-pub-XXXXX/ZZZZZ`
    - Rewarded (opcional): `ca-app-pub-XXXXX/WWWWW`
  - Guardar el **App ID de AdMob** (`ca-app-pub-XXXXX~YYYYY`).
- [ ] **Configurar `GADApplicationIdentifier` en `Info.plist`:**
  ```xml
  <key>GADApplicationIdentifier</key>
  <string>ca-app-pub-XXXXX~YYYYY</string>
  ```
- [ ] **Configurar SKAdNetwork IDs:** Añadir los SKAdNetwork identifiers de Google en `Info.plist` para atribución de anuncios en iOS 14+:
  ```xml
  <key>SKAdNetworkItems</key>
  <array>
    <dict>
      <key>SKAdNetworkIdentifier</key>
      <string>cstr6suwn9.skadnetwork</string>
    </dict>
    <!-- Añadir todos los IDs de https://developers.google.com/admob/ios/quick-start#update_your_infoplist -->
  </array>
  ```

### 5.2 Instalación del Plugin de Capacitor para AdMob
- [ ] **Instalar plugin:**
  ```bash
  npm install @capacitor-community/admob
  npx cap sync ios
  ```
- [ ] **Configurar el pod de Google Mobile Ads SDK:** Verificar que `Podfile` incluya el SDK de Google Mobile Ads tras el sync y ejecutar `pod install` en `ios/App/`.

### 5.3 Implementación del Diálogo ATT (App Tracking Transparency)
- [ ] **Crear módulo `js/ads.js`:**
  ```javascript
  // Solicitar permiso ATT ANTES de cargar cualquier anuncio
  async function requestTrackingPermission() {
    const { AdMob } = await import('@capacitor-community/admob');
    const { status } = await AdMob.trackingAuthorizationStatus();
    if (status === 'notDetermined') {
      await AdMob.requestTrackingAuthorization();
    }
  }
  ```
- [ ] **Timing del diálogo ATT:**
  - **NO mostrar en el primer arranque** (Apple rechaza apps que bombardean con permisos al inicio).
  - Mostrar el diálogo ATT **después** de que el usuario haya completado la configuración inicial (onboarding) y haya usado la app al menos una vez.
  - Si el usuario deniega el tracking: servir anuncios no personalizados (Google AdMob lo gestiona automáticamente).

### 5.4 Implementación de Banner Inferior Fijo
- [ ] **Mostrar banner en la parte inferior de la app:**
  ```javascript
  async function showBanner() {
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId: 'ca-app-pub-XXXXX/YYYYY', // Reemplazar con Ad Unit ID real
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false // Cambiar a true durante desarrollo
    });
  }
  ```
- [ ] **Ajustar CSS del layout:** Añadir padding-bottom (~60px) al contenedor principal para que el banner no tape contenido interactivo.
- [ ] **Modo test durante desarrollo:** Usar Ad Unit IDs de test de Google hasta que la app esté lista para producción:
  - Banner test: `ca-app-pub-3940256099942544/2934735716`

### 5.5 Implementación de Intersticiales (Opcional)
- [ ] **Precargar interstitial al arrancar la app:**
  ```javascript
  async function prepareInterstitial() {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-XXXXX/ZZZZZ',
      isTesting: false
    });
  }
  ```
- [ ] **Mostrar en transiciones naturales (no intrusivas):**
  - Al terminar y guardar una sesión de entrenamiento completa.
  - Al completar el registro nutricional del día.
  - **Frecuencia máxima:** 1 interstitial cada 5 minutos (evitar frustración del usuario).
  - **NUNCA** mostrar durante un flujo activo (ej. durante una serie de ejercicios o mientras escanea un producto).

### 5.6 Regla Estricta de Apple: HealthKit y Anuncios
- [ ] **Implementar barrera de aislamiento:**
  - **PROHIBIDO** utilizar datos procedentes de HealthKit (peso, calorías activas, pasos, minutos de ejercicio) para segmentar, personalizar o dirigir anuncios publicitarios.
  - **PROHIBIDO** transmitir datos de HealthKit a redes de anuncios, analytics o terceros.
  - Documentar explícitamente este aislamiento en la política de privacidad y en las notas del revisor.
  - Referencia: [Apple Developer — HealthKit Guidelines](https://developer.apple.com/app-store/review/guidelines/#health-and-health-research) (Guideline 27.4).

### 5.7 Modelo Freemium Futuro (Preparación)
- [ ] **Crear flag `isPremium` en `user_profiles`:**
  ```sql
  ALTER TABLE user_profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
  ```
- [ ] **Condicionar anuncios al flag:** Si `isPremium === true`, no mostrar anuncios (banner ni intersticiales). Preparar la lógica para una futura compra in-app que active este flag.

---

## FASE 6 — Seguridad, Dependencias Locales y Hardening
> **Prioridad:** 🟡 ALTA — Blindar la app contra caídas sin conexión y ataques de inyección, garantizando experiencia offline robusta incluso con backend en la nube.  
> **Archivos afectados:** `js/`, `index.html`, `sw.js`, `build_dist.js`.

### 6.1 Bundlear `html5-qrcode` de forma local (Cero dependencias de CDN)
- [ ] **Descargar librería:** Guardar `html5-qrcode.min.js` (v2.3.8) dentro del directorio [`js/html5-qrcode.min.js`](file:///c:/Users/Mateo/Proyectos/Fit360/js/).
- [ ] **Actualizar inclusión en `index.html`:**
  ```diff
  - <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
  + <script src="js/html5-qrcode.min.js"></script>
  ```
- [ ] **Actualizar Service Worker (`sw.js`):** Añadir `'./js/html5-qrcode.min.js'` a la lista de precaché `STATIC_ASSETS`.
- [ ] **Endurecer Content Security Policy (CSP):**
  - En la meta-etiqueta CSP de `index.html`, eliminar `https://unpkg.com` de `script-src`.
  - Añadir los dominios de Supabase y AdMob a `connect-src`: `https://*.supabase.co`, `https://pagead2.googlesyndication.com`.

### 6.2 Completar el Escapado de HTML contra XSS en Módulos Restantes
- [ ] **Auditar e intervenir `gym.js`:**
  - Escapar nombres de ejercicios personalizados creados por el usuario con `Security.escapeHTML()`.
  - Escapar notas de entrenamiento (`workoutNotes`).
- [ ] **Auditar e intervenir `nutrition.js`:**
  - Escapar nombres de alimentos añadidos manualmente.
  - Escapar ingredientes y nombres de recetas creadas por el usuario.
- [ ] **Auditar e intervenir `dashboard.js`:**
  - Escapar el nombre del perfil en el saludo principal (`Hola, ${Security.escapeHTML(name)}`).
- [ ] **Auditar e intervenir `cardio.js`:**
  - Sanitizar notas de sesiones de cardio.

### 6.3 Manejo de Errores en Peticiones Externas (Escáner de Alimentos)
- [ ] **Timeout en búsqueda Open Food Facts:** En [`js/barcode-scanner.js`](file:///c:/Users/Mateo/Proyectos/Fit360/js/barcode-scanner.js), envolver el `fetch` con `AbortController` y timeout de 8 segundos.
- [ ] **UI offline clara:** Si el dispositivo no tiene internet al escanear, mostrar toast o modal amigable: *"Sin conexión a internet. Introduce el alimento manualmente o conéctate para consultar la base de datos."* (Apple prueba el comportamiento en modo avión).

### 6.4 Seguridad de Credenciales de Supabase
- [ ] **Verificar que SOLO la `anon key` está en el código cliente** — nunca la `service_role_key`.
- [ ] **Validar que RLS está activo en TODAS las tablas** — la `anon key` sin RLS expondría toda la base de datos.
- [ ] **Sanitizar inputs antes de enviarlos a Supabase:** Prevenir inyección SQL a nivel de la API (aunque Supabase usa parámetros preparados, validar tipos en el cliente).

---

## FASE 7 — Privacidad, Compliance y Aspectos Legales
> **Prioridad:** 🔴 CRÍTICA — La ausencia de URLs de privacidad, inconsistencias con HealthKit o la falta de declaración de Supabase/AdMob como procesadores de datos detienen la revisión de inmediato.

### 7.1 Redacción y Alojamiento de la Política de Privacidad
- [ ] **Redactar documento legal exhaustivo:**
  - Identificar responsable del tratamiento (desarrollador) y contacto por email.
  - **Datos almacenados en la nube (Supabase):**
    - Especificar que los datos de entrenamiento, nutrición, peso y perfil se almacenan en servidores seguros de Supabase (AWS `eu-west-1`) asociados a la cuenta del usuario.
    - Detallar que el acceso es exclusivo del usuario autenticado (Row Level Security).
    - Indicar que los datos pueden eliminarse completamente a petición del usuario (derecho al olvido — GDPR/LOPDGDD).
  - **Datos almacenados en el dispositivo:** Caché local en `localStorage` para funcionamiento offline. Se eliminan al desinstalar la app.
  - **Apple HealthKit:** Lectura de calorías activas, pasos, minutos de ejercicio y peso exclusivamente para cálculos locales de balance calórico. **Estos datos NUNCA se transmiten a Supabase, AdMob ni a ningún tercero.**
  - **Escáner de código de barras:** La consulta a la API pública de *Open Food Facts* transmite únicamente el código numérico escaneado de forma anónima.
  - **Publicidad (Google AdMob):** Declarar el uso de Google Mobile Ads SDK, la solicitud de consentimiento ATT, y que los datos de salud de HealthKit nunca se utilizan para segmentación publicitaria.
  - **Autenticación:** Sign in with Apple proporciona únicamente un identificador único y, opcionalmente, el email. No se almacenan contraseñas de Apple.
  - Instrucciones de exportación y borrado completo de datos (tanto en dispositivo como en la nube).
- [ ] **Publicar en URL pública y permanente:**
  - Alojar la política en GitHub Pages (ej. `https://mateocr-4.github.io/Fit360/privacy-policy.html`) o dominio propio.
  - Comprobar que sea accesible desde un navegador sin autenticación previa.

### 7.2 Configuración de "App Privacy" (Nutrition Labels) en App Store Connect
- [ ] **Completar cuestionario de privacidad en App Store Connect:**
  - **Health & Fitness:** Declarar datos de salud como *"Data Used to Track You: No"* y *"Data Linked to You: Health & Fitness data"* (almacenado en Supabase vinculado a la cuenta).
  - **Identifiers:** Declarar uso del *Advertising Identifier (IDFA)* por AdMob → *"Data Used to Track You: Yes (if ATT granted)"*.
  - **Contact Info:** Si se recopila email para registro → declarar *"Data Linked to You: Email"*.
  - **Usage Data / Diagnostics:** Indicar si AdMob recopila datos de rendimiento de anuncios.

### 7.3 Cumplimiento GDPR/LOPDGDD (Usuarios en la UE/España)
- [ ] **Mecanismo de eliminación de datos:**
  - Implementar botón *"Eliminar mi cuenta y todos mis datos"* en Ajustes que:
    1. Elimine todos los registros del usuario en Supabase (`DELETE FROM ... WHERE user_id = auth.uid()`).
    2. Elimine la cuenta de autenticación (`supabase.auth.admin.deleteUser()`).
    3. Limpie `localStorage` del dispositivo.
    4. Muestre confirmación y cierre sesión.
- [ ] **Consentimiento explícito:** Al registrarse, mostrar checkbox obligatorio aceptando la política de privacidad con enlace directo al documento.

### 7.4 Preparación de Notas para el Revisor de Apple (Review Notes)
- [ ] **Redactar instrucciones claras para el revisor (español e inglés):**
  ```text
  Fit360 is a fully functional offline-first fitness and nutrition tracking app with optional cloud sync via Supabase.
  - Sign in with Apple: Users can sign in to sync their data across devices. The app also supports offline-only use without an account.
  - HealthKit: The app requests permission to read Active Energy, Steps, Exercise Time, and Weight to calculate the user's daily caloric expenditure. All HealthKit data remains strictly on the device and is NEVER transmitted to our servers, AdMob, or any third party.
  - Camera: The camera is used solely to scan EAN/UPC barcodes of packaged foods. Barcode lookup queries the public Open Food Facts database. No photo or video is stored or transmitted.
  - Ads: The app uses Google AdMob for banner ads. The ATT dialog is presented after onboarding. HealthKit data is strictly isolated from all advertising APIs.
  - Demo Account: No login is required to use the app in offline mode.
  ```

---

## FASE 8 — Material Gráfico y Listing de App Store Connect
> **Prioridad:** 🟡 ALTA — El escaparate de la aplicación en la tienda de apps.

### Fase 8 y 11: App Store Connect y Optimización ASO
**Estado:** ⏳ Pendiente
**Objetivo:** Generar metadatos optimizados para posicionamiento orgánico (ASO), definir el guion visual de las capturas de pantalla y preparar el compliance legal para la ficha de la App Store antes del envío a revisión por parte de Apple.

**Tareas:**
- [ ] Generar Títulos, Subtítulos y string de Keywords (100 caracteres) optimizados.
- [ ] Redactar la Descripción estructurada destacando el modo Offline, HealthKit y Bluetooth.
- [ ] Definir el guion narrativo y especificaciones técnicas para los Screenshots (6.7" y 5.5").
- [ ] Revisión legal: URL de Privacidad (`https://mateocr-4.github.io/Fit360/privacy-policy.html`) y apartados de AdMob/HealthKit.

<details>
<summary><strong>🤖 Prompt Técnico de Ejecución (Desplegar para copiar y ejecutar)</strong></summary>

***

**Contexto del Proyecto y Arquitectura**
Actúa como un experto en App Store Optimization (ASO) y App Marketing. La aplicación iOS **Fit360** (offline-first, integración con Apple Health, hardware BLE para básculas inteligentes, cálculo de macros TDEE) está lista para ser enviada a TestFlight y App Store Connect. 
Necesitamos generar todos los metadatos de la ficha de la App Store, optimizados para maximizar la visibilidad orgánica en búsquedas de fitness, nutrición y salud, y preparar las especificaciones visuales de las capturas de pantalla.

**Objetivo de la Tarea**
Redactar el paquete completo de metadatos ASO (Título, Subtítulo, Keywords, Descripción) respetando los estrictos límites de Apple, y definir la estrategia narrativa y técnica para las capturas de pantalla promocionales que se subirán a App Store Connect.

**Requerimientos Técnicos y Criterios de Aceptación**

**1. Metadatos de Alto Rendimiento (ASO)**
*   **Nombre de la App (Max 30 caracteres):** Crea 3 opciones combinando la marca "Fit360" con palabras clave de alta conversión (ej. "Fit360: Macros & Báscula").
*   **Subtítulo (Max 30 caracteres):** Crea 3 opciones que resuman la propuesta de valor y complementen las keywords del título.
*   **Campo de Keywords (Max 100 caracteres exactos):** Genera la cadena de palabras clave separadas por comas, sin espacios tras la coma, sin repetir palabras del título/subtítulo (política de Apple).
*   **Texto Promocional (Max 170 caracteres):** Un *call to action* potente sobre la privacidad y el modo offline.

**2. Descripción Estructurada (Max 4000 caracteres)**
*   Redacta la descripción completa utilizando un formato altamente escaneable (párrafos cortos, viñetas).
*   Destaca las 4 funcionalidades clave (Cálculo Metabólico, Privacidad HealthKit, Conexión BLE con Básculas, Motor Offline-First).
*   Añade el *disclaimer* médico estándar requerido por Apple.

**3. Estrategia de Capturas de Pantalla (Screenshots)**
*   Define el guion narrativo (texto superpuesto) para las primeras 3-4 capturas de pantalla.
*   Proporciona las dimensiones exactas requeridas por App Store Connect: **6.7 pulgadas** (1284 x 2778 px) y **5.5 pulgadas** (1242 x 2208 px).

**4. Check-list Legal y de Privacidad**
*   Confirma los requisitos legales y referenciar la URL de privacidad (`https://mateocr-4.github.io/Fit360/privacy-policy.html`).

**Entregables Esperados**
1. Opciones de Título y Subtítulo ASO.
2. Cadena exacta de Keywords (100 caracteres).
3. Texto Promocional y Descripción completa.
4. Guía técnica para los Screenshots.
5. Lista de verificación legal.

***
</details>

---

## FASE 9 — Testing, QA y Calidad de Experiencia de Usuario
> **Prioridad:** 🟡 ALTA — Comprobación metódica de flujos y estabilidad antes del envío.

### 9.1 Matriz de Pruebas en Dispositivos
- [ ] **Pantalla compacta (iPhone SE 2ª/3ª Gen):** Validar que modales y botones flotantes no desborden la vista en pantallas de 4.7" (375×667 pt).
- [ ] **Pantalla Notch / Dynamic Island (iPhone 13 / 14 / 15 / 16):** Verificar que los safe areas superiores e inferiores eviten superposiciones entre la interfaz y los indicadores del sistema.
- [ ] **Prueba de Modo Oscuro:** Asegurar legibilidad del texto en cualquier condición ambiental.

### 9.2 Flujos Críticos de Usuario (Smoke Tests)
- [ ] **Flujo 1 — Registro y Login:** Sign in with Apple → creación de perfil → verificación de sesión persistente → sincronización inicial.
- [ ] **Flujo 2 — Modo Offline:** Desactivar internet → registrar comidas, entrenamientos y peso → reactivar internet → verificar que los datos se sincronizan automáticamente con Supabase.
- [ ] **Flujo 3 — Nutrición:** Búsqueda en catálogo interno, ajuste de gramos, adición al desayuno y comprobación del sumatorio total de calorías.
- [ ] **Flujo 4 — Escáner Barcode:** Escaneo de producto comercial físico, verificación de datos importados y persistencia (local + cloud).
- [ ] **Flujo 5 — Sesión de Gym:** Creación de entrenamiento, registro de 3 series con peso/reps, temporizador de descanso con sonido/vibración y guardado en historial.
- [ ] **Flujo 6 — Respaldo y Restauración:** Cerrar sesión → iniciar sesión en otro dispositivo (o tras reinstalar) → verificar que todos los datos se descargan correctamente desde Supabase.
- [ ] **Flujo 7 — HealthKit:** Sincronizar datos y comprobar que las calorías activas y pasos actualicen las métricas del Dashboard sin bloqueos de interfaz.
- [ ] **Flujo 8 — Anuncios:** Verificar que el diálogo ATT aparece tras onboarding, que el banner se muestra correctamente sin tapar contenido y que los intersticiales respetan la frecuencia máxima.
- [ ] **Flujo 9 — Eliminación de cuenta:** Eliminar cuenta desde Ajustes → verificar que los datos se borran de Supabase y del dispositivo → verificar que la app vuelve a la pantalla de login.

### 9.3 Accesibilidad (a11y) y Dynamic Type
- [ ] **Navegación VoiceOver:** Revisar que los botones iconográficos cuenten con atributo `aria-label` descriptivo.
- [ ] **Contraste visual:** Comprobar que los textos secundarios sobre fondo `#0a0c14` cumplan ratio mínimo WCAG AA (4.5:1).

---

## FASE 10 — Automatización CI/CD para App Store & TestFlight
> **Prioridad:** 🟡 ALTA — Automatizar compilaciones oficiales firmadas y evitar depender de compilaciones manuales en local.  
> **Archivos afectados:** `.github/workflows/`, Fastlane.

### 10.1 Configuración de Secrets en GitHub
- [ ] **Configurar credenciales seguras en el repositorio GitHub:**
  - `APPLE_CERTIFICATE_P12`: Contenido en base64 del certificado de distribución de Apple.
  - `APPLE_CERTIFICATE_PASSWORD`: Contraseña para desbloquear el `.p12`.
  - `APPLE_PROVISIONING_PROFILE`: Contenido en base64 del perfil `.mobileprovision` de distribución.
  - `APPSTORE_KEY_ID`: ID de clave API de App Store Connect.
  - `APPSTORE_ISSUER_ID`: ID de emisor de la API de App Store Connect.
  - `APPSTORE_PRIVATE_KEY`: Clave privada `.p8` para autenticación desatendida.
  - `SUPABASE_URL`: URL del proyecto Supabase (para posibles tests de integración en CI).
  - `SUPABASE_ANON_KEY`: Clave pública de Supabase.

### 10.2 Creación del Workflow `release-appstore.yml`
- [ ] **Definir pasos del pipeline:**
  1. Checkout del código fuente.
  2. Setup de Node.js y compilación web (`node build_dist.js`).
  3. Sincronización de Capacitor (`npx cap sync ios`).
  4. Instalación de Pods (`pod install`).
  5. Decodificación e inyección de certificado y provisioning profile en Keychain temporal de macOS runner.
  6. Generación del `.xcarchive` con `xcodebuild archive`.
  7. Exportación del `.ipa` firmado con `ExportOptions.plist` configurado para `app-store`.
  8. Subida directa a TestFlight mediante `xcrun altool` o Fastlane (`upload_to_app_store`).

### 10.3 Alternativa con Fastlane (Recomendada)
- [ ] **Inicializar Fastlane en `ios/App`:**
  - Crear lane `beta` para TestFlight.
  - Crear lane `release` para App Store.

---

## FASE 11 — Envío a Revisión y Gestión de App Review
> **Prioridad:** 🔴 CRÍTICA — Etapa de evaluación por el equipo humano de Apple.

### 11.1 Despliegue en TestFlight (Beta Interna y Externa)
- [ ] Subir la primera build oficial (v1.1.0 Build 1).
- [ ] Probar la build en TestFlight en al menos un iPhone físico durante 24-48 horas reales de uso continuado.
- [ ] Confirmar que no surjan cierres inesperados (crashes) ni anomalías de renderizado.

### 11.2 Envío a Revisión Final
- [ ] Vincular la build validada de TestFlight a la versión 1.1.0 en App Store Connect.
- [ ] Revisar que todas las capturas, textos, categorización y URL de soporte estén completas.
- [ ] Marcar la opción de lanzamiento: *Lanzamiento manual* o *Automático tras aprobación*.
- [ ] Pulsar **"Submit for Review"**.

### 11.3 Gestión de Respuestas y Resolución de Objeciones
- [ ] Monitorizar el estado de la revisión (suele resolverse entre 24 y 48 horas).
- [ ] En caso de consulta o rechazo (Resolution Center): responder con capturas de pantalla, explicaciones técnicas y correcciones inmediatas si procede.

---

## FASE 12 — Mejoras Técnicas Post-Lanzamiento
> **Prioridad:** 🟢 MEDIA — Tareas de arquitectura y evolución del producto tras el lanzamiento inicial.

### 12.1 Compras In-App (IAP) — Fit360 Pro
- [ ] Configurar StoreKit mediante `@capacitor/purchases` o RevenueCat.
- [ ] Ofrecer versión Fit360 Pro (elimina anuncios + funciones premium):
  - Sin publicidad (banner ni intersticiales).
  - Exportación avanzada en CSV/Excel.
  - Rutinas ilimitadas y estadísticas avanzadas.
  - Modalidad: Pago único vitalicio (Lifetime) o suscripción económica anual.
- [ ] Implementar la verificación de compra y activar `is_premium = true` en `user_profiles`.

### 12.2 Widgets Nativos de iOS (WidgetKit con SwiftUI)
- [ ] Diseñar Widget para pantalla de inicio y pantalla de bloqueo:
  - Widget pequeño: Balance calórico restante del día.
  - Widget mediano: Anillos de macronutrientes (Proteína, Carbohidratos, Grasas) y consumo de agua.
- [ ] Conectar datos mediante `Capacitor App Groups` compartiendo contenedor de archivos local.

### 12.3 Notificaciones Locales Nativas
- [ ] Incorporar el plugin `@capacitor/local-notifications`.
- [ ] Recordatorio configurable de pesaje matutino.
- [ ] Recordatorio de registro de comidas al final del día.

### 12.4 Soporte y Optimización para iPad
- [ ] Habilitar soporte para iPad en Xcode Targets.
- [ ] Diseñar vista adaptativa con panel lateral (Split View) para pantallas grandes.

### 12.5 Internacionalización (i18n)
- [ ] Extraer cadenas de texto a diccionario JSON (`locales/es.json`, `locales/en.json`).
- [ ] Detectar el idioma del sistema y permitir cambio dinámico de idioma.

---

## 📈 Guía Rápida de Comandos para el Proyecto

```bash
# 1. Servidor de desarrollo local
npm run dev

# 2. Empaquetar bundle web para Capacitor
node build_dist.js

# 3. Sincronizar cambios web con el proyecto nativo de iOS
npx cap sync ios

# 4. Abrir proyecto en Xcode (en entorno macOS)
npx cap open ios

# 5. Buscar referencias residuales a direcciones locales o sideloading
grep -rn "192.168" js/ index.html
grep -ri "sideload" js/ index.html

# 6. Verificar conectividad con Supabase (test rápido)
curl -s https://<project-id>.supabase.co/rest/v1/ -H "apikey: <anon-key>" | head
```

---

## 🏗️ Arquitectura de Datos (Resumen Visual)

```
┌─────────────────────────────────────────────────┐
│                  DISPOSITIVO iOS                │
│                                                 │
│  ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │ localStorage │ HealthKit │   │  AdMob SDK │  │
│  │ (caché    │   │ (solo    │   │ (anuncios) │  │
│  │  offline) │   │  lectura │   │            │  │
│  └─────┬─────┘   │  local)  │   └──────┬─────┘  │
│        │         └──────────┘          │        │
│        │  sync ↕                       │        │
│  ┌─────┴──────────────────┐    ┌───────┴──────┐ │
│  │   js/supabase-client   │    │  Google Ads  │ │
│  │   (Auth + CRUD + RLS)  │    │  Network     │ │
│  └─────────┬──────────────┘    └──────────────┘ │
└────────────┼────────────────────────────────────┘
             │ HTTPS (TLS 1.3)
             ▼
┌────────────────────────────┐
│      SUPABASE CLOUD        │
│  ┌──────────────────────┐  │
│  │   Auth (Apple/Email) │  │
│  ├──────────────────────┤  │
│  │   PostgreSQL + RLS   │  │
│  │  • user_profiles     │  │
│  │  • daily_logs        │  │
│  │  • weight_logs       │  │
│  │  • workout_sessions  │  │
│  │  • custom_exercises  │  │
│  │  • custom_routines   │  │
│  │  • custom_recipes    │  │
│  │  • favorite_foods    │  │
│  └──────────────────────┘  │
│        Región: eu-west-1   │
└────────────────────────────┘
```

---

*Documento mantenido y versionado en el repositorio de Fit360. Marcar cada casilla `[x]` a medida que se ejecuten las tareas.*
