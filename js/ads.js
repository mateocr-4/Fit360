/**
 * ============================================================================
 * Fit360 — Ads & Monetization Engine (Google AdMob + Apple ATT)
 * ============================================================================
 * 
 * Módulo centralizado para la gestión de publicidad nativa con Google AdMob
 * utilizando el plugin @capacitor-community/admob.
 * 
 * ----------------------------------------------------------------------------
 * AUDITORÍA DE PRIVACIDAD Y DIRECTRICES DE APPLE (App Store Review Guidelines)
 * ----------------------------------------------------------------------------
 * 
 * 1. AISLAMIENTO ABSOLUTO DE DATOS DE SALUD (Guideline 27.4):
 *    "Apps using the HealthKit framework or Health Records may not use or disclose
 *     to third parties (including for advertising, marketing, or other use-based
 *     data mining) user data gained from the HealthKit API or Health Records API."
 *    
 *    GARANTÍA TÉCNICA:
 *    - Este módulo NO importa, referencia ni lee datos de HealthKit ni HealthSync.
 *    - NO tiene acceso a datos biométricos (peso, grasa, calorías, historial médico).
 *    - Las peticiones de anuncios jamás incluyen parámetros demográficos,
 *      palabras clave relacionadas con la salud (targeting keywords) ni identificadores
 *      procedentes de la actividad física del usuario.
 * 
 * 2. APP TRACKING TRANSPARENCY (Guideline 5.1.2):
 *    - El permiso de ATT (NSUserTrackingUsageDescription) se solicita explícitamente
 *      antes de inicializar el SDK de AdMob.
 *    - Si el usuario deniega o restringe el consentimiento (status !== 'authorized'),
 *      se activa automáticamente el parámetro { npa: true } (Non-Personalized Ads)
 *      para garantizar que Google AdMob no realice seguimiento cruzado ni use el IDFA.
 * 
 * 3. CONTROL DE FRECUENCIA (Frequency Capping):
 *    - Se aplica un intervalo mínimo de 5 minutos entre anuncios intersticiales,
 *      persistido en localStorage para evitar saturación de la experiencia de usuario.
 * 
 * Patrón de Revelación (Revealing Module Pattern) en Vanilla JS.
 * ============================================================================
 */

window.AdsManager = (function() {
  'use strict';

  // --- Constantes y Claves de Persistencia ---
  const STORAGE_KEY_LAST_INTERSTITIAL = 'fit360_last_interstitial_ts';
  const DEFAULT_INTERSTITIAL_COOLDOWN_MIN = 5;
  const DEFAULT_BANNER_HEIGHT_PX = 50;

  // IDs oficiales de prueba de Google AdMob (iOS) como fallback seguro
  const FALLBACK_TEST_AD_UNITS = {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910'
  };

  // --- Estado Privado del Módulo (Encapsulado) ---
  let isInitialized = false;
  let isInitializing = false;
  let trackingStatus = 'notDetermined'; // 'authorized' | 'denied' | 'restricted' | 'notDetermined'
  let isBannerVisible = false;
  let isBannerLoading = false;
  let currentBannerHeight = DEFAULT_BANNER_HEIGHT_PX;
  let isInterstitialLoaded = false;
  let isInterstitialLoading = false;
  let lastInterstitialTs = 0;
  let listenersAttached = false;

  /**
   * Determina si la app se está ejecutando en un dispositivo nativo iOS/Capacitor.
   * @returns {boolean}
   */
  function isNativePlatform() {
    return Boolean(
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
    );
  }

  /**
   * Obtiene la referencia nativa al plugin AdMob inyectado por Capacitor.
   * @returns {object|null}
   */
  function getAdMobPlugin() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
      return window.Capacitor.Plugins.AdMob;
    }
    return null;
  }

  /**
   * Lee la configuración publicitaria desde window.FIT360_CONFIG.
   * @returns {object}
   */
  function getConfig() {
    const rootConfig = (window.FIT360_CONFIG && window.FIT360_CONFIG.ads) ? window.FIT360_CONFIG.ads : {};
    return {
      appId: rootConfig.appId || '',
      units: {
        banner: (rootConfig.units && rootConfig.units.banner) || FALLBACK_TEST_AD_UNITS.banner,
        interstitial: (rootConfig.units && rootConfig.units.interstitial) || FALLBACK_TEST_AD_UNITS.interstitial
      },
      isTesting: rootConfig.isTesting !== undefined ? Boolean(rootConfig.isTesting) : true,
      interstitialCooldownMin: rootConfig.interstitialCooldownMin || DEFAULT_INTERSTITIAL_COOLDOWN_MIN
    };
  }

  /**
   * Carga el timestamp del último intersticial mostrado desde almacenamiento local.
   */
  function loadPersistedCooldown() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_INTERSTITIAL);
      if (stored) {
        lastInterstitialTs = parseInt(stored, 10) || 0;
      }
    } catch (e) {
      lastInterstitialTs = 0;
    }
  }

  /**
   * Persiste el timestamp actual como momento de última emisión de intersticial.
   */
  function persistCooldown() {
    try {
      lastInterstitialTs = Date.now();
      localStorage.setItem(STORAGE_KEY_LAST_INTERSTITIAL, String(lastInterstitialTs));
    } catch (e) {
      lastInterstitialTs = Date.now();
    }
  }

  /**
   * Actualiza el diseño CSS dinámicamente cuando el banner se muestra o cambia de dimensiones.
   * Inyecta la clase .admob-banner-active y la variable CSS --admob-banner-height.
   * @param {number} heightPx 
   */
  function applyBannerLayout(heightPx) {
    if (typeof document === 'undefined') return;
    currentBannerHeight = heightPx || DEFAULT_BANNER_HEIGHT_PX;
    document.documentElement.style.setProperty('--admob-banner-height', `${currentBannerHeight}px`);
    document.body.classList.add('admob-banner-active');
  }

  /**
   * Restaura el diseño CSS cuando el banner se oculta o se destruye.
   */
  function removeBannerLayout() {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('admob-banner-active');
    document.documentElement.style.setProperty('--admob-banner-height', '0px');
  }

  /**
   * Solicita el permiso nativo de App Tracking Transparency (ATT) en iOS 14+.
   * Si el usuario no ha tomado una decisión, presenta el diálogo con NSUserTrackingUsageDescription.
   * @returns {Promise<string>} 'authorized' | 'denied' | 'restricted' | 'notDetermined'
   */
  async function requestTrackingAuthorization() {
    const AdMob = getAdMobPlugin();
    if (!AdMob) {
      trackingStatus = 'notDetermined';
      return trackingStatus;
    }

    try {
      if (typeof AdMob.trackingAuthorizationStatus === 'function') {
        const check = await AdMob.trackingAuthorizationStatus();
        trackingStatus = check?.status || 'notDetermined';
        console.log('[AdsManager] Estado actual de ATT:', trackingStatus);

        if (trackingStatus === 'notDetermined' && typeof AdMob.requestTrackingAuthorization === 'function') {
          console.log('[AdsManager] Presentando diálogo de consentimiento ATT al usuario...');
          await AdMob.requestTrackingAuthorization();
          const postCheck = await AdMob.trackingAuthorizationStatus();
          trackingStatus = postCheck?.status || 'denied';
          console.log('[AdsManager] Decisión de ATT tomada por el usuario:', trackingStatus);
        }
      }
    } catch (err) {
      console.warn('[AdsManager] Excepción al comprobar/solicitar ATT:', err);
      trackingStatus = 'restricted';
    }

    return trackingStatus;
  }

  /**
   * Registra los eventos del ciclo de vida del SDK para banners e intersticiales.
   * @param {object} AdMob 
   */
  function attachEventListeners(AdMob) {
    if (listenersAttached || !AdMob || typeof AdMob.addListener !== 'function') return;
    listenersAttached = true;

    try {
      // Evento de ajuste de tamaño de banner adaptativo nativo
      AdMob.addListener('bannerAdSizeChanged', (info) => {
        console.log('[AdsManager] Evento: bannerAdSizeChanged', info);
        if (info && info.height) {
          applyBannerLayout(info.height);
        }
      });

      // Banner cargado con éxito
      AdMob.addListener('bannerAdLoaded', () => {
        console.log('✅ [AdsManager] Evento: bannerAdLoaded');
        isBannerVisible = true;
        applyBannerLayout(currentBannerHeight);
      });

      // Fallo de carga de banner (ej. sin conexión o falta de inventario)
      AdMob.addListener('bannerAdFailedToLoad', (err) => {
        console.warn('[AdsManager] Evento: bannerAdFailedToLoad', err);
        isBannerVisible = false;
        removeBannerLayout();
      });

      // Banner abierto en pantalla completa
      AdMob.addListener('bannerAdOpened', () => {
        console.log('[AdsManager] Evento: bannerAdOpened');
      });

      // Banner cerrado
      AdMob.addListener('bannerAdClosed', () => {
        console.log('[AdsManager] Evento: bannerAdClosed');
      });

      // Intersticial cargado y listo para mostrar
      AdMob.addListener('interstitialAdLoaded', () => {
        console.log('✅ [AdsManager] Evento: interstitialAdLoaded');
        isInterstitialLoaded = true;
      });

      // Fallo de carga de intersticial
      AdMob.addListener('interstitialAdFailedToLoad', (err) => {
        console.warn('[AdsManager] Evento: interstitialAdFailedToLoad', err);
        isInterstitialLoaded = false;
      });

      // Intersticial cerrado/descartado por el usuario
      AdMob.addListener('interstitialAdDismissed', () => {
        console.log('[AdsManager] Evento: interstitialAdDismissed. Programando precarga del siguiente...');
        isInterstitialLoaded = false;
        // Precargar el siguiente anuncio tras 3 segundos de gracia
        setTimeout(() => {
          prepareInterstitial().catch(() => {});
        }, 3000);
      });
    } catch (err) {
      console.warn('[AdsManager] No se pudieron vincular algunos listeners:', err);
    }
  }

  /**
   * Inicializa el módulo de monetización.
   * Flujo secuencial:
   * 1. Verifica entorno nativo y configuración.
   * 2. Solicita permiso ATT a Apple iOS antes de iniciar el SDK.
   * 3. Inicializa Google AdMob con configuración de privacidad estricta.
   * 4. Registra listeners y precarga el primer intersticial.
   * @returns {Promise<boolean>}
   */
  async function init() {
    if (isInitialized) return true;
    if (isInitializing) return false;
    isInitializing = true;

    loadPersistedCooldown();

    const config = getConfig();

    // 1. Verificación de entorno: Si estamos en navegador Web o Live Server
    if (!isNativePlatform()) {
      console.info('[AdsManager] Entorno de navegador web detectado. Operando en modo simulación (No-op).');
      isInitialized = true;
      isInitializing = false;
      return true;
    }

    const AdMob = getAdMobPlugin();
    if (!AdMob) {
      console.warn('[AdsManager] Plugin @capacitor-community/admob no está instalado o vinculado en Capacitor.Plugins.');
      isInitializing = false;
      return false;
    }

    try {
      // 2. Solicitar ATT antes de inicializar el SDK publicitario
      await requestTrackingAuthorization();

      // 3. Inicializar AdMob SDK con directrices de privacidad y protección de contenidos
      const initOptions = {
        initializeForTesting: config.isTesting,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: 'General'
      };

      await AdMob.initialize(initOptions);
      isInitialized = true;
      console.log('✅ [AdsManager] Google AdMob SDK inicializado correctamente. ATT Status:', trackingStatus);

      // 4. Suscribir listeners de ciclo de vida
      attachEventListeners(AdMob);

      // 5. Precargar el primer anuncio intersticial en background
      prepareInterstitial().catch(() => {});

      return true;
    } catch (err) {
      console.warn('[AdsManager] Excepción al inicializar AdMob (fallback silencioso):', err);
      // No romper la aplicación ni interrumpir al usuario
      return false;
    } finally {
      isInitializing = false;
    }
  }

  /**
   * Muestra un banner publicitario adaptativo fijado en la parte inferior (BOTTOM_CENTER).
   * Gestiona automáticamente la safe-area y ajusta el padding de la app.
   * @param {object} [options]
   * @param {number} [options.margin] Margen inferior en píxeles (por defecto 0)
   * @returns {Promise<boolean>}
   */
  async function showBanner(options = {}) {
    const config = getConfig();
    if (!config.units || !config.units.banner) {
      console.warn('[AdsManager] ID de bloque de banner no configurado.');
      return false;
    }

    if (isBannerVisible) {
      return true;
    }

    // Modo Web / Desarrollo
    if (!isNativePlatform()) {
      renderWebBannerMock();
      isBannerVisible = true;
      applyBannerLayout(DEFAULT_BANNER_HEIGHT_PX);
      return true;
    }

    const AdMob = getAdMobPlugin();
    if (!AdMob) return false;

    if (!isInitialized) {
      await init();
    }

    isBannerLoading = true;
    try {
      // Directriz 27.4 & ATT: Si el usuario denegó o restringió el tracking, forzar NPA
      const isTrackingAuthorized = (trackingStatus === 'authorized');
      const shouldServeNPA = !isTrackingAuthorized;

      const bannerOptions = {
        adId: config.units.banner,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: options.margin !== undefined ? options.margin : 0,
        isTesting: config.isTesting,
        npa: shouldServeNPA // Non-Personalized Ads si no está expresamente autorizado
      };

      await AdMob.showBanner(bannerOptions);
      isBannerVisible = true;
      applyBannerLayout(currentBannerHeight);
      console.log('✅ [AdsManager] Banner adaptativo BOTTOM_CENTER presentado (NPA:', shouldServeNPA, ')');
      return true;
    } catch (err) {
      console.warn('[AdsManager] Fallo al mostrar banner (fallback silencioso):', err);
      removeBannerLayout();
      return false;
    } finally {
      isBannerLoading = false;
    }
  }

  /**
   * Oculta el banner adaptativo (ej. cuando se abren modales a pantalla completa o cuentas Pro).
   * @returns {Promise<void>}
   */
  async function hideBanner() {
    if (!isBannerVisible) return;

    if (!isNativePlatform()) {
      removeWebBannerMock();
      isBannerVisible = false;
      removeBannerLayout();
      return;
    }

    const AdMob = getAdMobPlugin();
    try {
      if (AdMob && typeof AdMob.hideBanner === 'function') {
        await AdMob.hideBanner();
      }
    } catch (err) {
      console.warn('[AdsManager] Error al ocultar banner:', err);
    } finally {
      isBannerVisible = false;
      removeBannerLayout();
    }
  }

  /**
   * Destruye el banner por completo del árbol de vistas nativo.
   * @returns {Promise<void>}
   */
  async function removeBanner() {
    if (!isNativePlatform()) {
      removeWebBannerMock();
      isBannerVisible = false;
      removeBannerLayout();
      return;
    }

    const AdMob = getAdMobPlugin();
    try {
      if (AdMob && typeof AdMob.removeBanner === 'function') {
        await AdMob.removeBanner();
      }
    } catch (err) {
      console.warn('[AdsManager] Error al remover banner:', err);
    } finally {
      isBannerVisible = false;
      removeBannerLayout();
    }
  }

  /**
   * Precarga en segundo plano el anuncio intersticial para mostrarlo sin latencia cuando sea requerido.
   * @returns {Promise<boolean>}
   */
  async function prepareInterstitial() {
    const config = getConfig();
    if (!config.units || !config.units.interstitial) return false;
    if (!isNativePlatform()) return true;

    const AdMob = getAdMobPlugin();
    if (!AdMob || isInterstitialLoading) return false;

    isInterstitialLoading = true;
    try {
      const isTrackingAuthorized = (trackingStatus === 'authorized');
      await AdMob.prepareInterstitial({
        adId: config.units.interstitial,
        isTesting: config.isTesting,
        npa: !isTrackingAuthorized
      });
      isInterstitialLoaded = true;
      console.log('✅ [AdsManager] Anuncio intersticial precargado en segundo plano.');
      return true;
    } catch (err) {
      console.warn('[AdsManager] Error al precargar intersticial (silencioso):', err);
      isInterstitialLoaded = false;
      return false;
    } finally {
      isInterstitialLoading = false;
    }
  }

  /**
   * Muestra un anuncio intersticial respetando el control de frecuencia (Frequency Capping).
   * Por defecto: máximo 1 anuncio cada 5 minutos.
   * 
   * AISLAMIENTO DE SALUD (Guideline 27.4):
   * Este método solo recibe una etiqueta de contexto de la interfaz (ej. 'workout_saved').
   * En ningún caso se envían ni se procesan datos biométricos ni de Apple HealthKit.
   * 
   * @param {string} [triggerContext='general'] Contexto de la acción para trazabilidad interna
   * @returns {Promise<boolean>} true si el anuncio se emitió; false si se descartó por cooldown o error
   */
  async function showInterstitial(triggerContext = 'general') {
    const config = getConfig();
    const cooldownMin = config.interstitialCooldownMin || DEFAULT_INTERSTITIAL_COOLDOWN_MIN;
    const cooldownMs = cooldownMin * 60 * 1000;
    const now = Date.now();

    // 1. Verificación de Capping (Frecuencia)
    const timeSinceLast = now - lastInterstitialTs;
    if (timeSinceLast < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - timeSinceLast) / 1000);
      console.log(`[AdsManager] Intersticial omitido por frecuencia (${triggerContext}). Faltan ${remainingSec}s para el próximo.`);
      return false;
    }

    // Modo Web / Desarrollo
    if (!isNativePlatform()) {
      console.info(`[AdsManager] [Dev/Web] Intersticial simulado para el contexto: ${triggerContext}`);
      persistCooldown();
      return true;
    }

    const AdMob = getAdMobPlugin();
    if (!AdMob) return false;

    try {
      // 2. Si no estaba precargado, intentar prepararlo
      if (!isInterstitialLoaded) {
        console.log('[AdsManager] Intersticial no precargado previamente. Cargando...');
        await prepareInterstitial();
      }

      // 3. Emitir el anuncio
      await AdMob.showInterstitial();
      isInterstitialLoaded = false;
      persistCooldown();
      console.log(`✅ [AdsManager] Intersticial presentado con éxito (${triggerContext}).`);

      // 4. Programar precarga del siguiente intersticial
      setTimeout(() => {
        prepareInterstitial().catch(() => {});
      }, 4000);

      return true;
    } catch (err) {
      console.warn('[AdsManager] Error al reproducir intersticial (fallback silencioso):', err);
      // Reintentar precarga para la siguiente ocasión
      setTimeout(() => {
        prepareInterstitial().catch(() => {});
      }, 3000);
      return false;
    }
  }

  // --- Helpers de Simulación Web (Entorno Desarrollo) ---
  function renderWebBannerMock() {
    if (document.getElementById('admobWebBannerMock')) return;
    const mock = document.createElement('div');
    mock.id = 'admobWebBannerMock';
    mock.className = 'admob-web-banner-mock';
    mock.setAttribute('aria-hidden', 'true');
    mock.innerHTML = `
      <span class="ad-badge">ANUNCIO</span>
      <span class="ad-title">Google AdMob · Banner Adaptativo</span>
      <span style="opacity:0.6;">(Simulación Web)</span>
    `;
    document.body.appendChild(mock);
  }

  function removeWebBannerMock() {
    const mock = document.getElementById('admobWebBannerMock');
    if (mock) mock.remove();
  }

  // --- Inicialización Automática al Cargar el DOM ---
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      // Esperar a que la interfaz principal termine el primer renderizado
      setTimeout(() => {
        // Solo inicializar automáticamente si el usuario ya completó el onboarding
        const guideCompleted = localStorage.getItem('fit360_guide_completed');
        if (guideCompleted) {
          init().then(() => {
            showBanner();
          }).catch(() => {});
        }
      }, 1500);
    });
  }

  // --- API Pública del Módulo (Patrón de Revelación) ---
  return {
    init,
    showBanner,
    hideBanner,
    removeBanner,
    prepareInterstitial,
    showInterstitial,
    requestTrackingAuthorization,
    getTrackingStatus: () => trackingStatus,
    isBannerActive: () => isBannerVisible,
    getBannerHeight: () => currentBannerHeight,
    getLastInterstitialTime: () => lastInterstitialTs
  };

})();
