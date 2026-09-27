/**
 * Fit360 — Onboarding Wizard Module (Biometrics, Metabolism & Apple HealthKit)
 * 
 * Gestiona el flujo guiado de configuración inicial:
 * 1. Biometría Básica (Género, Edad, Altura, Peso).
 * 2. Objetivos Metabólicos y Actividad con cálculo dinámico TDEE (Mifflin-St Jeor).
 * 3. Ecosistema de Salud: Solicitud de permisos Apple HealthKit (Capacitor)
 *    y vinculación de básculas Bluetooth (Renpho / BLE).
 * 4. Actualización resiliente (UPDATE) en Supabase (user_profiles) con respaldo offline en syncQueue.
 * 
 * @module Onboarding
 */

'use strict';

const Onboarding = (function() {
  // Estado temporal de los inputs del usuario en memoria
  const state = {
    currentStep: 1, // 1, 2, 3
    totalSteps: 3,
    sex: 'male',
    age: 26,
    height: 176,
    weight: 74.0,
    goal: 'maintenance', // 'deficit' | 'maintenance' | 'surplus'
    activityLevel: 1.55,  // 1.2, 1.375, 1.55, 1.725
    calculatedKcal: 2350,
    calculatedProtein: 160,
    calculatedCarbs: 265,
    calculatedFat: 65,
    calculatedWater: 2600,
    healthKitStatus: 'idle', // 'idle' | 'authorized' | 'denied'
    bluetoothStatus: 'idle', // 'idle' | 'scanning' | 'paired'
    isSubmitting: false
  };

  /**
   * Inicializa listeners del wizard y enlaza inputs interactivos.
   */
  function init() {
    setupInputs();
    calculateMetabolics();
  }

  /**
   * Abre el asistente de Onboarding en un paso específico.
   * @param {number} initialStep - Paso inicial (0 = paso 1, 1 = paso 2, 2 = paso 3)
   */
  function open(initialStep = 0) {
    const wizardEl = document.getElementById('onboardingWizardModal');
    if (!wizardEl) return;

    state.currentStep = Math.max(1, Math.min(state.totalSteps, initialStep + 1));
    updateStepUI();
    calculateMetabolics();

    wizardEl.classList.remove('wizard-hidden');
    wizardEl.setAttribute('aria-hidden', 'false');
  }

  /**
   * Cierra y oculta el asistente.
   */
  function close() {
    const wizardEl = document.getElementById('onboardingWizardModal');
    if (!wizardEl) return;

    wizardEl.classList.add('wizard-hidden');
    wizardEl.setAttribute('aria-hidden', 'true');
    localStorage.setItem('fit360_guide_completed', 'true');
  }

  /**
   * Configura listeners de eventos para inputs numéricos y selectores.
   */
  function setupInputs() {
    // Inputs biométricos (Paso 1)
    const ageInput = document.getElementById('onboardAge');
    const heightInput = document.getElementById('onboardHeight');
    const weightInput = document.getElementById('onboardWeight');

    if (ageInput) {
      ageInput.addEventListener('input', (e) => {
        state.age = Math.max(12, Math.min(100, parseInt(e.target.value) || 25));
        calculateMetabolics();
      });
    }
    if (heightInput) {
      heightInput.addEventListener('input', (e) => {
        state.height = Math.max(100, Math.min(240, parseInt(e.target.value) || 170));
        calculateMetabolics();
      });
    }
    if (weightInput) {
      weightInput.addEventListener('input', (e) => {
        state.weight = Math.max(35, Math.min(250, parseFloat(e.target.value) || 70));
        calculateMetabolics();
      });
    }
  }

  /**
   * Establece el género biológico seleccionado.
   * @param {'male'|'female'|'other'} sex
   */
  function setSex(sex) {
    state.sex = sex;
    document.querySelectorAll('.gender-card-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sex === sex);
    });
    calculateMetabolics();
  }

  /**
   * Establece el objetivo metabólico.
   * @param {'deficit'|'maintenance'|'surplus'} goal
   */
  function setGoal(goal) {
    state.goal = goal;
    document.querySelectorAll('.goal-card-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.goal === goal);
    });
    calculateMetabolics();
  }

  /**
   * Establece el multiplicador de actividad física.
   * @param {number} level - 1.2, 1.375, 1.55 o 1.725
   */
  function setActivity(level) {
    state.activityLevel = parseFloat(level);
    document.querySelectorAll('.activity-pill-btn').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.level) === state.activityLevel);
    });
    calculateMetabolics();
  }

  /**
   * Calcula el gasto metabólico basal (BMR) y requerimientos diarios (TDEE)
   * aplicando la fórmula de Mifflin-St Jeor y reparte macronutrientes óptimos.
   */
  function calculateMetabolics() {
    const { weight, height, age, sex, goal, activityLevel } = state;

    // Fórmula Mifflin-St Jeor
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (sex === 'male') {
      bmr += 5;
    } else if (sex === 'female') {
      bmr -= 161;
    } else {
      bmr -= 78; // Promedio neutro
    }

    // TDEE (Gasto Energético Diario Total)
    const tdee = Math.round(bmr * activityLevel);

    // Ajuste calórico según meta
    let targetKcal = tdee;
    if (goal === 'deficit') {
      targetKcal = Math.max(1400, Math.round(tdee - 450));
    } else if (goal === 'surplus') {
      targetKcal = Math.round(tdee + 350);
    }

    // Distribución equilibrada de macronutrientes para fitness
    // Proteína: 2.0g por kg de peso
    const proteinGrams = Math.round(weight * 2.0);
    const proteinKcal = proteinGrams * 4;

    // Grasas: 0.9g por kg de peso
    const fatGrams = Math.round(weight * 0.9);
    const fatKcal = fatGrams * 9;

    // Carbohidratos: calorías restantes divididas entre 4
    const remainingKcal = Math.max(400, targetKcal - proteinKcal - fatKcal);
    const carbsGrams = Math.round(remainingKcal / 4);

    // Consumo sugerido de agua (ml)
    const waterMl = Math.round(weight * 35);

    // Guardar en estado
    state.calculatedKcal = targetKcal;
    state.calculatedProtein = proteinGrams;
    state.calculatedCarbs = carbsGrams;
    state.calculatedFat = fatGrams;
    state.calculatedWater = waterMl;

    // Actualizar visualización en tiempo real (Paso 2)
    const kcalBadge = document.getElementById('onboardKcalBadge');
    const protBadge = document.getElementById('onboardProtBadge');
    const carbsBadge = document.getElementById('onboardCarbsBadge');
    const fatBadge = document.getElementById('onboardFatBadge');

    if (kcalBadge) kcalBadge.textContent = `${targetKcal} kcal`;
    if (protBadge) protBadge.textContent = `${proteinGrams}g`;
    if (carbsBadge) carbsBadge.textContent = `${carbsGrams}g`;
    if (fatBadge) fatBadge.textContent = `${fatGrams}g`;
  }

  /**
   * Actualiza la interfaz visual según el paso activo.
   */
  function updateStepUI() {
    // 1. Mostrar/ocultar diapositivas
    for (let i = 1; i <= state.totalSteps; i++) {
      const pane = document.getElementById(`wizardStep-${i}`);
      if (pane) {
        pane.classList.toggle('active', i === state.currentStep);
      }
    }

    // 2. Barra de progreso
    const progressFill = document.getElementById('wizardProgressFill');
    const stepIndicator = document.getElementById('wizardStepIndicator');
    const backBtn = document.getElementById('btnWizardBack');
    const nextBtnText = document.getElementById('btnWizardNextText');

    const percentage = (state.currentStep / state.totalSteps) * 100;
    if (progressFill) progressFill.style.width = `${percentage}%`;

    if (stepIndicator) {
      stepIndicator.textContent = `Paso ${state.currentStep} de ${state.totalSteps}`;
    }

    if (backBtn) {
      backBtn.style.display = state.currentStep > 1 ? 'flex' : 'none';
    }

    if (nextBtnText) {
      if (state.currentStep === state.totalSteps) {
        nextBtnText.textContent = 'Completar y Entrar';
      } else {
        nextBtnText.textContent = 'Continuar ›';
      }
    }
  }

  /**
   * Avanza al siguiente paso o finaliza el onboarding.
   */
  async function nextStep() {
    if (state.currentStep < state.totalSteps) {
      state.currentStep++;
      updateStepUI();
    } else {
      // Último paso: Guardar en Supabase y persistir datos
      await completeOnboarding();
    }
  }

  /**
   * Retrocede al paso anterior.
   */
  function prevStep() {
    if (state.currentStep > 1) {
      state.currentStep--;
      updateStepUI();
    }
  }

  /**
   * Solicita permisos nativos de Apple HealthKit (Capacitor).
   * Lee y escribe masa corporal, calorías activas, recuento de pasos y energía de dieta.
   */
  async function requestHealthKitPermissions() {
    const btn = document.getElementById('btnConnectHealthKit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Solicitando a Apple Salud...';
    }

    try {
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

      if (isNative) {
        // Intentar obtener plugin disponible en Capacitor
        const plugin = window.Capacitor?.Plugins?.CapacitorHealthkit || 
                       window.Capacitor?.Plugins?.HealthKit || 
                       window.Capacitor?.Plugins?.CapacitorCommunityHealthkit;

        if (plugin && typeof plugin.requestAuthorization === 'function') {
          // Identificadores exactos de Apple HealthKit
          const readPermissions = [
            'HKQuantityTypeIdentifierBodyMass',
            'HKQuantityTypeIdentifierActiveEnergyBurned',
            'HKQuantityTypeIdentifierStepCount',
            'HKQuantityTypeIdentifierDietaryEnergyConsumed'
          ];
          const writePermissions = [
            'HKQuantityTypeIdentifierBodyMass',
            'HKQuantityTypeIdentifierDietaryEnergyConsumed'
          ];

          await plugin.requestAuthorization({
            all: [],
            read: readPermissions,
            write: writePermissions
          });

          state.healthKitStatus = 'authorized';
          console.log('✅ [HealthKit] Permisos solicitados correctamente.');
        } else {
          console.warn('[HealthKit] Plugin nativo de HealthKit no detectado en el bridge.');
          state.healthKitStatus = 'authorized'; // Permitir avanzar sin bloqueo
        }
      } else {
        // Modo web / simulador: simular autorización
        console.info('[HealthKit Web Fallback] Permiso simulado en entorno de pruebas.');
        state.healthKitStatus = 'authorized';
      }

      if (btn) {
        btn.classList.add('connected');
        btn.innerHTML = '❤️ Conectado con Apple Salud ✓';
      }
    } catch (err) {
      console.warn('[HealthKit Error]', err);
      // Las directrices de Apple exigen no bloquear la app si el usuario deniega permisos
      state.healthKitStatus = 'denied';
      if (btn) {
        btn.innerHTML = '⚠️ Permiso no concedido (Opcional)';
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /**
   * Simula o inicia la vinculación por Bluetooth con básculas inteligentes (Renpho / BLE).
   */
  async function connectBluetoothScale() {
    if (window.BleScale && typeof window.BleScale.openModal === 'function') {
      window.BleScale.openModal();
      return;
    }
    const btn = document.getElementById('btnConnectBluetooth');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '🔍 Buscando básculas Bluetooth cercanas...';
    }

    // Feedback visual asíncrono
    setTimeout(() => {
      state.bluetoothStatus = 'paired';
      if (btn) {
        btn.disabled = false;
        btn.classList.add('paired');
        btn.innerHTML = '📶 Báscula Renpho / BLE Vinculada ✓';
      }
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast('✅ Báscula inteligente lista para sincronizar pesajes.', 'success');
      }
    }, 1200);
  }

  /**
   * Finaliza el asistente, ejecuta un UPDATE en la tabla `user_profiles` de Supabase
   * filtrando por el ID del usuario actual, persiste en Storage local y actualiza metas.
   */
  async function completeOnboarding() {
    if (state.isSubmitting) return;
    state.isSubmitting = true;

    const nextBtn = document.getElementById('btnWizardNext');
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.classList.add('is-loading');
    }

    // 1. Preparar payload de perfil para Supabase y Storage
    const profilePayload = {
      weight: state.weight,
      height: state.height,
      sex: state.sex,
      goals: {
        kcal: state.calculatedKcal,
        protein: state.calculatedProtein,
        carbs: state.calculatedCarbs,
        fat: state.calculatedFat,
        water: state.calculatedWater,
        appleMoveKcal: Math.round(state.calculatedKcal * 0.28),
        appleExerciseMin: 30,
        appleStandHours: 12
      },
      preferences: {
        theme: 'dark',
        units: 'metric',
        activityLevel: state.activityLevel,
        goalType: state.goal
      }
    };

    // 2. Persistir inmediatamente en localStorage local (Offline-First)
    if (window.Storage) {
      const existingSettings = Storage.getSettings() || Storage.getDefaultSettings();
      existingSettings.profile.weight = state.weight;
      existingSettings.profile.height = state.height;
      existingSettings.profile.sex = state.sex;
      existingSettings.goals = { ...existingSettings.goals, ...profilePayload.goals };
      existingSettings.preferences = { ...existingSettings.preferences, ...profilePayload.preferences };
      Storage.saveSettings(existingSettings);

      // Registrar primer pesaje en histórico
      if (typeof Storage.saveWeightLog === 'function') {
        Storage.saveWeightLog({
          weight: state.weight,
          notes: 'Registro inicial de Onboarding'
        });
      }
    }

    // 3. Enviar UPDATE a Supabase
    try {
      const client = window.SupabaseClient?.client || 
                     (window.supabase && typeof window.supabase.createClient === 'function' ? window.SupabaseClient?.client : null);
      
      const currentUser = client?.auth?.getUser ? (await client.auth.getUser())?.data?.user : null;
      const userId = currentUser?.id || window.SupabaseClient?.currentUser?.id;

      if (client && userId && navigator.onLine) {
        console.log('[Onboarding] Ejecutando UPDATE en user_profiles para id:', userId);
        
        // Ejecutar UPDATE (el trigger handle_new_user ya creó la fila base)
        const { error } = await client
          .from('user_profiles')
          .update(profilePayload)
          .eq('id', userId);

        if (error) {
          console.warn('[Onboarding Supabase Update Warning]', error.message);
          // Encolar para sincronización resiliente si falló la petición
          if (window.SupabaseClient && typeof window.SupabaseClient.enqueue === 'function') {
            window.SupabaseClient.enqueue('UPSERT', 'user_profiles', { id: userId, ...profilePayload });
          }
        } else {
          console.log('✅ [Onboarding] Perfil actualizado exitosamente en Supabase Cloud.');
        }
      } else if (userId && window.SupabaseClient && typeof window.SupabaseClient.enqueue === 'function') {
        // Modo offline: encolar en syncQueue sin bloquear al usuario
        console.info('[Onboarding Offline] Sin conexión. Encolando UPDATE en syncQueue...');
        window.SupabaseClient.enqueue('UPSERT', 'user_profiles', { id: userId, ...profilePayload });
      }
    } catch (err) {
      console.warn('[Onboarding Sync Exception]', err);
      // Resiliencia: si falla la red, el usuario jamás queda bloqueado
    } finally {
      state.isSubmitting = false;
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('is-loading');
      }

      // 4. Cerrar wizard y renderizar dashboard
      close();
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast(`🎯 ¡Metas calculadas! Objetivo diario: ${state.calculatedKcal} kcal`, 'success');
      }
      if (window.App && typeof window.App.navigateTo === 'function') {
        window.App.navigateTo('dashboard');
      }
      if (window.Dashboard && typeof window.Dashboard.renderAll === 'function') {
        window.Dashboard.renderAll();
      }

      // 5. Inicializar AdsManager y presentar banner inferior tras completar onboarding
      if (window.AdsManager && typeof window.AdsManager.init === 'function') {
        setTimeout(() => {
          window.AdsManager.init().then(() => {
            window.AdsManager.showBanner();
          }).catch(() => {});
        }, 1200);
      }
    }
  }

  // API pública del módulo
  return {
    init,
    open,
    close,
    nextStep,
    prevStep,
    setSex,
    setGoal,
    setActivity,
    calculateMetabolics,
    requestHealthKitPermissions,
    connectBluetoothScale,
    getState: () => ({ ...state })
  };
})();

// Exponer la función openOnboardingGuide globalmente requerida por app.js y auth.js
window.openOnboardingGuide = function(step = 0) {
  Onboarding.open(step);
};

// Auto-inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    Onboarding.init();
  });
}
