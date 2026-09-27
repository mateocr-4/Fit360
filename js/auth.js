/**
 * Fit360 — Production Authentication Module (Apple HIG & Supabase)
 * 
 * Gestiona el ciclo de vida de autenticación:
 * - Intercepta usuarios no autenticados antes de cargar el dashboard.
 * - Soporta "Sign in with Apple" nativo con generación y hash SHA-256 de nonce.
 * - Soporta Email/Contraseña con validación RFC 5322 en tiempo real y criterios de seguridad.
 * - Manejo robusto de errores localizado en español y prevención de doble envío.
 * - Destrucción limpia del DOM al autenticarse para evitar fugas de memoria.
 * 
 * @module Auth
 */

'use strict';

const Auth = (function() {
  // Expresión regular robusta basada en RFC 5322 para validación estricta de correo
  const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  // Estado interno del módulo
  let currentMode = 'login'; // 'login' | 'register'
  let isInFlight = false;
  let activeSession = null;
  let authScreenElement = null;

  /**
   * Genera un nonce criptográfico aleatorio y devuelve el nonce original
   * y su digest SHA-256 en formato hexadecimal para Apple y Supabase.
   * @returns {Promise<{rawNonce: string, hashedNonce: string}>}
   */
  async function generateCryptoNonce() {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
    const randomValues = new Uint8Array(32);
    window.crypto.getRandomValues(randomValues);

    let rawNonce = '';
    for (let i = 0; i < randomValues.length; i++) {
      rawNonce += charset[randomValues[i] % charset.length];
    }

    // Calcular hash SHA-256 utilizando la Web Crypto API nativa
    const encoder = new TextEncoder();
    const data = encoder.encode(rawNonce);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    // Convertir ArrayBuffer a string hexadecimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { rawNonce, hashedNonce };
  }

  /**
   * Valida un correo electrónico contra el estándar RFC 5322.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return RFC5322_EMAIL_REGEX.test(email.trim());
  }

  /**
   * Valida una contraseña contra los criterios de seguridad:
   * - Mínimo 8 caracteres
   * - Al menos una letra mayúscula
   * - Al menos un número
   * - Al menos un carácter especial
   * @param {string} password
   * @returns {{isValid: boolean, minLength: boolean, hasUpper: boolean, hasNumber: boolean, hasSpecial: boolean}}
   */
  function evaluatePasswordStrength(password) {
    const pwd = password || '';
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    return {
      isValid: minLength && hasUpper && hasNumber && hasSpecial,
      minLength,
      hasUpper,
      hasNumber,
      hasSpecial
    };
  }

  /**
   * Mapea errores de Supabase y Apple a mensajes amigables y profesionales en español.
   * @param {Error|object|string} err
   * @returns {string}
   */
  function mapErrorMessage(err) {
    if (!err) return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
    const msg = (err.message || err.error_description || (typeof err === 'string' ? err : '')).toLowerCase();
    const code = (err.code || err.status || '').toString().toLowerCase();

    if (msg.includes('invalid login credentials') || code === 'invalid_credentials') {
      return 'Correo o contraseña incorrectos. Por favor, verifica tus datos.';
    }
    if (msg.includes('user already registered') || msg.includes('user_already_exists')) {
      return 'Ya existe una cuenta con este correo electrónico. Inicia sesión.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.';
    }
    if (msg.includes('password should be') || msg.includes('weak_password')) {
      return 'La contraseña no cumple con los requisitos mínimos de seguridad.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests') || code === 'over_request_rate_limit') {
      return 'Demasiados intentos fallidos. Por seguridad, espera unos minutos e inténtalo de nuevo.';
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return 'Error de conexión. Comprueba tu conexión a internet.';
    }
    if (msg.includes('canceled') || code === '1001') {
      return 'Inicio de sesión con Apple cancelado por el usuario.';
    }

    return err.message || 'No se pudo completar la operación. Por favor, inténtalo de nuevo.';
  }

  /**
   * Obtiene la instancia activa del cliente Supabase desde window.supabase o SupabaseClient.
   * @returns {object|null}
   */
  function getSupabaseInstance() {
    if (window.SupabaseClient && window.SupabaseClient.client) {
      return window.SupabaseClient.client;
    }
    const cfg = window.FIT360_CONFIG?.supabase;
    if (
      window.supabase &&
      typeof window.supabase.createClient === 'function' &&
      cfg?.url &&
      !cfg.url.includes('TU_PROYECTO_ID') &&
      cfg.anonKey &&
      !cfg.anonKey.includes('TU_SUPABASE_ANON_KEY')
    ) {
      return window.supabase.createClient(cfg.url, cfg.anonKey);
    }
    return null;
  }

  /**
   * Inicializa el flujo de autenticación, verifica si hay sesión previa
   * y monta o destruye el interceptor de pantalla según corresponda.
   */
  async function init() {
    authScreenElement = document.getElementById('authScreen');
    if (!authScreenElement) return;

    setupEvents();
    setupLiveValidation();

    // Comprobar si hay bypass activo para pruebas de UX o modo local
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.has('bypass') ||
      urlParams.has('guest') ||
      urlParams.has('test') ||
      localStorage.getItem('fit360_auth_bypass') === 'true'
    ) {
      console.info('🚀 [Auth] Modo bypass activo (URL o persistente). Saltando login para prueba de UX.');
      bypass(false);
      return;
    }

    const client = getSupabaseInstance();
    if (!client) {
      // Supabase aún no tiene credenciales de backend reales configuradas.
      // Permitimos que la UI del login sea visible para probar su diseño,
      // pero si el usuario hace clic en el botón de invitado o corre Auth.bypass(),
      // podrá saltar al dashboard sin requerir conexión a internet ni servidor.
      console.info('[Auth] Supabase en modo local (sin backend configurado). Pantalla de login lista para pruebas.');
      return;
    }

    // 1. Escuchar cambios de estado de autenticación
    client.auth.onAuthStateChange(async (event, session) => {
      activeSession = session;
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ [Auth] Usuario autenticado:', session.user.id);
        const isNewUser = localStorage.getItem('fit360_is_new_signup') === 'true';
        localStorage.removeItem('fit360_is_new_signup');
        handleAuthSuccess(isNewUser);
      } else if (event === 'SIGNED_OUT') {
        console.log('ℹ️ [Auth] Sesión finalizada.');
        showAuthScreen();
      }
    });

    // 2. Comprobar sesión existente al arrancar
    try {
      const { data, error } = await client.auth.getSession();
      if (!error && data?.session) {
        activeSession = data.session;
        console.log('⚡ [Auth] Sesión activa recuperada de caché.');
        hideAuthScreen(false);
      } else {
        // No hay sesión activa: interceptar al usuario
        showAuthScreen();
      }
    } catch (e) {
      console.warn('[Auth] Error comprobando sesión:', e);
      showAuthScreen();
    }
  }

  /**
   * Muestra la pantalla de autenticación con transición suave.
   */
  function showAuthScreen() {
    if (!authScreenElement) return;
    authScreenElement.classList.remove('auth-hidden');
    authScreenElement.setAttribute('aria-hidden', 'false');
    resetFormErrors();
  }

  /**
   * Oculta y desmonta la pantalla de autenticación.
   * @param {boolean} destroyFromDOM - Si es true, retira el elemento del DOM para liberar memoria.
   */
  function hideAuthScreen(destroyFromDOM = false) {
    if (!authScreenElement) return;

    authScreenElement.classList.add('auth-hidden');
    authScreenElement.setAttribute('aria-hidden', 'true');

    if (destroyFromDOM) {
      setTimeout(() => {
        if (authScreenElement && authScreenElement.parentNode) {
          authScreenElement.parentNode.removeChild(authScreenElement);
          authScreenElement = null;
          console.log('🧹 [Auth] Vista de autenticación desmontada del DOM.');
        }
      }, 350);
    }
  }

  /**
   * Configura los listeners de eventos para formulario, pestañas y botones.
   */
  function setupEvents() {
    // Pestañas Login / Registro
    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');

    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => switchMode('login'));
      tabRegister.addEventListener('click', () => switchMode('register'));
    }

    // Botón Sign in with Apple
    const btnApple = document.getElementById('btnAppleSignIn');
    if (btnApple) {
      btnApple.addEventListener('click', handleAppleSignIn);
    }

    // Envío del formulario Email/Password
    const authForm = document.getElementById('authForm');
    if (authForm) {
      authForm.addEventListener('submit', handleFormSubmit);
    }

    // Alternar visibilidad de contraseña
    const togglePwdBtn = document.getElementById('authTogglePwd');
    const pwdInput = document.getElementById('authPassword');
    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener('click', () => {
        const isPassword = pwdInput.type === 'password';
        pwdInput.type = isPassword ? 'text' : 'password';
        togglePwdBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Ver contraseña');
        togglePwdBtn.innerHTML = isPassword 
          ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"></path></svg>`
          : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      });
    }

    // Opción Continuar en Modo Offline / Local / Prueba de UX
    const guestLink = document.getElementById('authGuestLink');
    if (guestLink) {
      guestLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[Auth] Usuario eligió continuar en modo local / prueba de UX.');
        bypass(false);
      });
    }
  }

  /**
   * Configura validación visual en tiempo real en los inputs.
   */
  function setupLiveValidation() {
    const emailInput = document.getElementById('authEmail');
    const passwordInput = document.getElementById('authPassword');
    const emailError = document.getElementById('authEmailError');

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        const val = emailInput.value.trim();
        if (val.length === 0) {
          emailInput.classList.remove('is-valid', 'is-invalid');
          if (emailError) emailError.classList.remove('visible');
          emailInput.setAttribute('aria-invalid', 'false');
          return;
        }

        const valid = isValidEmail(val);
        emailInput.classList.toggle('is-valid', valid);
        emailInput.classList.toggle('is-invalid', !valid);
        emailInput.setAttribute('aria-invalid', valid ? 'false' : 'true');

        if (emailError) {
          if (!valid) {
            emailError.textContent = 'Introduce un correo electrónico válido (ejemplo: usuario@dominio.com)';
            emailError.classList.add('visible');
          } else {
            emailError.classList.remove('visible');
          }
        }
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        const strength = evaluatePasswordStrength(val);

        // Actualizar checklist visual solo si estamos en modo registro
        if (currentMode === 'register') {
          updatePasswordChecklist(strength);
        }

        if (val.length > 0) {
          const isValid = currentMode === 'register' ? strength.isValid : val.length >= 6;
          passwordInput.classList.toggle('is-valid', isValid);
          passwordInput.classList.toggle('is-invalid', !isValid);
          passwordInput.setAttribute('aria-invalid', isValid ? 'false' : 'true');
        } else {
          passwordInput.classList.remove('is-valid', 'is-invalid');
          passwordInput.setAttribute('aria-invalid', 'false');
        }
      });
    }
  }

  /**
   * Actualiza el checklist de requisitos de contraseña en la UI.
   * @param {object} strength
   */
  function updatePasswordChecklist(strength) {
    const setReq = (id, isMet) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle('met', isMet);
        const icon = el.querySelector('.pwd-req-icon');
        if (icon) icon.textContent = isMet ? '✓' : '•';
      }
    };

    setReq('pwdReqLength', strength.minLength);
    setReq('pwdReqUpper', strength.hasUpper);
    setReq('pwdReqNumber', strength.hasNumber);
    setReq('pwdReqSpecial', strength.hasSpecial);
  }

  /**
   * Cambia entre modo 'login' y 'register'.
   * @param {'login'|'register'} mode
   */
  function switchMode(mode) {
    currentMode = mode;
    resetFormErrors();

    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');
    const nameField = document.getElementById('authNameField');
    const pwdChecklist = document.getElementById('authPwdChecklist');
    const submitBtnText = document.getElementById('authSubmitBtnText');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');

    if (mode === 'login') {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (nameField) nameField.style.display = 'none';
      if (pwdChecklist) pwdChecklist.style.display = 'none';
      if (submitBtnText) submitBtnText.textContent = 'Iniciar Sesión';
      if (authTitle) authTitle.textContent = 'Bienvenido a Fit360';
      if (authSubtitle) authSubtitle.textContent = 'Inicia sesión para sincronizar tu entrenamiento y salud';
    } else {
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
      if (nameField) nameField.style.display = 'flex';
      if (pwdChecklist) pwdChecklist.style.display = 'flex';
      if (submitBtnText) submitBtnText.textContent = 'Crear Cuenta';
      if (authTitle) authTitle.textContent = 'Crea tu cuenta';
      if (authSubtitle) authSubtitle.textContent = 'Guarda tus datos en la nube sin riesgo de pérdida';
    }
  }

  /**
   * Resetea estados de error de formulario.
   */
  function resetFormErrors() {
    const globalAlert = document.getElementById('authGlobalAlert');
    if (globalAlert) {
      globalAlert.classList.remove('visible');
      globalAlert.textContent = '';
    }

    const emailError = document.getElementById('authEmailError');
    if (emailError) emailError.classList.remove('visible');

    const inputs = document.querySelectorAll('.auth-input');
    inputs.forEach(input => {
      input.classList.remove('is-valid', 'is-invalid');
      input.setAttribute('aria-invalid', 'false');
    });
  }

  /**
   * Muestra un mensaje de error global con accesibilidad (role="alert").
   * @param {string} message
   */
  function showGlobalError(message) {
    const alert = document.getElementById('authGlobalAlert');
    const text = document.getElementById('authGlobalAlertText');
    if (alert && text) {
      text.textContent = message;
      alert.classList.add('visible');
      alert.focus();
    }
  }

  /**
   * Alterna el estado de carga visual y deshabilitación anti-doble envío.
   * @param {boolean} loading
   */
  function setLoadingState(loading) {
    isInFlight = loading;
    const submitBtn = document.getElementById('authSubmitBtn');
    const appleBtn = document.getElementById('btnAppleSignIn');
    const inputs = document.querySelectorAll('.auth-input, .auth-tab-btn');

    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('is-loading', loading);
    }
    if (appleBtn) {
      appleBtn.disabled = loading;
    }
    inputs.forEach(el => { el.disabled = loading; });
  }

  /**
   * Manejador del flujo nativo "Sign in with Apple".
   */
  async function handleAppleSignIn() {
    if (isInFlight) return;
    setLoadingState(true);
    resetFormErrors();

    try {
      const client = getSupabaseInstance();
      if (!client) {
        throw new Error('Supabase no está configurado. Introduce tus credenciales en js/config.js');
      }

      // 1. Generar Nonce criptográfico aleatorio con digest SHA-256
      const { rawNonce, hashedNonce } = await generateCryptoNonce();

      // 2. Comprobar si se ejecuta en entorno nativo Capacitor iOS
      const isNative = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();

      if (isNative) {
        // Importar plugin nativo de Sign In with Apple
        let SignInWithApplePlugin = window.Capacitor?.Plugins?.SignInWithApple;
        if (!SignInWithApplePlugin) {
          const mod = await import('@capacitor-community/apple-sign-in');
          SignInWithApplePlugin = mod.SignInWithApple;
        }

        if (!SignInWithApplePlugin) {
          throw new Error('Plugin nativo de Apple Sign In no disponible.');
        }

        // Ejecutar solicitud nativa de Apple
        const appleResponse = await SignInWithApplePlugin.authorize({
          clientId: 'com.mateo.fit360',
          redirectURI: `${window.FIT360_CONFIG.supabase.url}/auth/v1/callback`,
          scopes: 'email name',
          state: 'fit360_apple_auth',
          nonce: hashedNonce
        });

        const idToken = appleResponse?.response?.identityToken;
        if (!idToken) {
          throw new Error('No se recibió el token de identidad de Apple.');
        }

        // Si Apple proporciona el nombre (solo ocurre en el primer login), guardarlo
        const givenName = appleResponse.response.givenName || '';
        const familyName = appleResponse.response.familyName || '';
        const fullName = `${givenName} ${familyName}`.trim();

        // 3. Enviar token y rawNonce a Supabase
        const { data, error } = await client.auth.signInWithIdToken({
          provider: 'apple',
          token: idToken,
          nonce: rawNonce
        });

        if (error) throw error;

        // Si hubo nombre, actualizar metadatos del usuario
        if (fullName && data?.user) {
          await client.auth.updateUser({
            data: { full_name: fullName }
          }).catch(console.warn);
        }
      } else {
        // En entorno web de desarrollo (localhost), fallback a OAuth redirect de Supabase
        console.info('[Auth Web Fallback] Ejecutando signInWithOAuth con proveedor Apple...');
        const { error } = await client.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[Auth Apple Error]', err);
      showGlobalError(mapErrorMessage(err));
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Manejador del formulario Email / Contraseña.
   * @param {Event} e
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (isInFlight) return;

    resetFormErrors();

    const emailInput = document.getElementById('authEmail');
    const pwdInput = document.getElementById('authPassword');
    const nameInput = document.getElementById('authName');

    const email = emailInput?.value.trim() || '';
    const password = pwdInput?.value || '';
    const fullName = nameInput?.value.trim() || '';

    // Validaciones del lado del cliente
    if (!isValidEmail(email)) {
      showGlobalError('Por favor, introduce un correo electrónico válido.');
      if (emailInput) {
        emailInput.classList.add('is-invalid');
        emailInput.focus();
      }
      return;
    }

    if (currentMode === 'register') {
      const strength = evaluatePasswordStrength(password);
      if (!strength.isValid) {
        showGlobalError('La contraseña no cumple todos los requisitos de seguridad.');
        if (pwdInput) {
          pwdInput.classList.add('is-invalid');
          pwdInput.focus();
        }
        return;
      }
    } else {
      if (password.length < 6) {
        showGlobalError('La contraseña debe tener al menos 6 caracteres.');
        if (pwdInput) pwdInput.focus();
        return;
      }
    }

    const client = getSupabaseInstance();
    if (!client) {
      showGlobalError('Supabase no está configurado. Introduce tus credenciales en js/config.js');
      return;
    }

    setLoadingState(true);

    try {
      if (currentMode === 'login') {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        activeSession = data.session;
      } else {
        localStorage.setItem('fit360_is_new_signup', 'true');
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || 'Usuario Fit360' }
          }
        });
        if (error) throw error;

        // Si la confirmación de email está activa y no hay sesión inmediata
        if (data?.user && !data?.session) {
          showGlobalError('¡Registro completado! Te hemos enviado un correo de confirmación. Revisa tu bandeja de entrada.');
          return;
        }

        activeSession = data.session;
      }
    } catch (err) {
      console.error('[Auth Form Error]', err);
      showGlobalError(mapErrorMessage(err));
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Enrutamiento y transición tras autenticación exitosa.
   * @param {boolean} isNewUser
   */
  function handleAuthSuccess(isNewUser = false) {
    // 1. Desmontar la vista del DOM
    hideAuthScreen(true);

    // 2. Si el cliente de Supabase tiene cola pendiente, procesarla
    if (window.SupabaseClient && typeof window.SupabaseClient.processQueue === 'function') {
      window.SupabaseClient.processQueue();
    }

    // 3. Notificar a la aplicación
    window.dispatchEvent(new CustomEvent('fit360:auth:success', {
      detail: { session: activeSession, isNewUser }
    }));

    // 4. Enrutamiento post-auth:
    // Si es nuevo usuario registrado, abrir guía/onboarding
    if (isNewUser && window.App && typeof window.App.openOnboardingGuide === 'function') {
      setTimeout(() => {
        window.App.openOnboardingGuide(0);
      }, 400);
    } else if (window.App && typeof window.App.navigateTo === 'function') {
      window.App.navigateTo('dashboard');
    }
  }

  /**
   * Omite la pantalla de autenticación para pruebas de UX o modo offline.
   * @param {boolean} [persist=false] Si es true, guarda en localStorage para no volver a preguntar en recargas.
   */
  function bypass(persist = false) {
    if (persist) {
      localStorage.setItem('fit360_auth_bypass', 'true');
    }
    hideAuthScreen(true);
    if (window.App && typeof window.App.navigateTo === 'function') {
      window.App.navigateTo('dashboard');
    }
    console.log('🚀 [Auth] Login saltado con éxito para prueba de UX.');
  }

  /**
   * Restablece el bypass para volver a ver la pantalla de login.
   */
  function resetBypass() {
    localStorage.removeItem('fit360_auth_bypass');
    window.location.reload();
  }

  /**
   * Cierra la sesión activa y vuelve a presentar la pantalla de login.
   */
  async function signOut() {
    const client = getSupabaseInstance();
    if (client) {
      await client.auth.signOut().catch(console.warn);
    }
    activeSession = null;
    window.location.reload();
  }

  // API pública del módulo
  return {
    init,
    showAuthScreen,
    hideAuthScreen,
    bypass,
    resetBypass,
    switchMode,
    handleAppleSignIn,
    signOut,
    getSession: () => activeSession,
    getUser: () => activeSession?.user || null
  };
})();

// Exponer globalmente en window para acceso desde la consola de desarrollador
if (typeof window !== 'undefined') {
  window.Auth = Auth;
  window.bypassLogin = (persist = false) => Auth.bypass(persist);
}

// Auto-inicializar cuando el DOM esté disponible
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Esperar al ciclo de inicialización principal
    setTimeout(() => {
      Auth.init();
    }, 100);
  });
}
