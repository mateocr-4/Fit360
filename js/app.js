/**
 * Fit360 - Main Application Controller & Router
 */
const App = {
  currentDate: Storage.formatDate(),
  currentView: 'dashboard',
  deferredPrompt: null,

  init() {
    // 1. Iniciar capa de datos
    Storage.init();

    // 2. Configurar fecha actual
    this.updateDateDisplay();

    // 3. Configurar listeners globales
    this.setupEventListeners();

    // 4. Inicializar módulos
    Dashboard.init();
    Nutrition.init();
    Gym.init();
    Cardio.init();
    if (window.Analytics) Analytics.init();
    Settings.init();
    if (window.HealthSync) HealthSync.init();
    if (window.Social) Social.init();

    // 4.1 Ocultar el Splash Screen nativo fluidamente tras renderizar el Dashboard
    this.hideNativeSplashScreen();

    // 5. Configurar Service Worker si está disponible
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }

    // 6. PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('sidebarInstallPwa');
      if (installBtn) installBtn.style.display = 'flex';
    });

    // 7. Entorno de ejecución listo (Capacitor iOS App Store)

    // 8. Abrir guía de bienvenida y sincronización en el primer arranque
    if (!localStorage.getItem('fit360_guide_completed')) {
      setTimeout(() => {
        this.openOnboardingGuide(0);
      }, 500);
    }

    // 9. Mostrar aviso diario de transparencia de anuncios (1 vez al día)
    //    Solo si la guía de bienvenida ya fue completada (para no saturar al usuario nuevo)
    if (localStorage.getItem('fit360_guide_completed')) {
      setTimeout(() => {
        this.showDailyAdNotice();
      }, 800);
    }
  },

  /**
   * Oculta programáticamente el Splash Screen nativo de Capacitor
   * para evitar destellos blancos y asegurar una transición Dark Luxury sin parpadeos (HIG).
   */
  hideNativeSplashScreen() {
    try {
      const SplashScreen = window.Capacitor?.Plugins?.SplashScreen;
      if (SplashScreen && typeof SplashScreen.hide === 'function') {
        // Doble frame rAF para garantizar que el DOM está completamente pintado antes del fade out
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              SplashScreen.hide({ fadeOutDuration: 300 });
              console.log('✨ [App] Splash Screen nativo ocultado con fade out (300ms).');
            }, 120);
          });
        });
      }
    } catch (e) {
      console.warn('[App] No se pudo invocar SplashScreen.hide():', e);
    }
  },

  setupEventListeners() {
    // Tecla Escape para cerrar modales y sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
        this.closeAllModals();
      }
    });

    // Clic en overlay del sidebar
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => this.closeSidebar());
    }

    // Clic en overlays de modal
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

    // Listeners dedicados para el modal de transparencia de anuncios
    const btnAcceptDailyAd = document.getElementById('btnAcceptDailyAd');
    if (btnAcceptDailyAd) {
      btnAcceptDailyAd.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        App.acceptDailyAd();
      });
    }

    const btnCloseDailyAd = document.getElementById('btnCloseDailyAd');
    if (btnCloseDailyAd) {
      btnCloseDailyAd.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        App.closeDailyAdNotice();
      });
    }

    // Touch swipe para cerrar el sidebar
    let touchStartX = 0;
    const sidebarDrawer = document.getElementById('sidebarDrawer');
    if (sidebarDrawer) {
      sidebarDrawer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      sidebarDrawer.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 60) {
          this.closeSidebar();
        }
      }, { passive: true });
    }
  },

  // --- NAVEGACIÓN Y VISTAS ---
  navigateTo(viewName) {
    this.currentView = viewName;

    // Actualizar secciones
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    // Actualizar botones de navegación inferior
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Actualizar enlaces del sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.toggle('active', link.dataset.view === viewName);
    });

    // Refrescar datos de la vista
    if (viewName === 'dashboard') Dashboard.render();
    if (viewName === 'nutrition') Nutrition.render();
    if (viewName === 'gym') Gym.render();
    if (viewName === 'cardio') Cardio.render();
    if (viewName === 'analytics' && window.Analytics) Analytics.render();
    if (viewName === 'settings') Settings.render();
    if (viewName === 'social' && window.Social) Social.render();

    // Scroll to top
    const mainEl = document.querySelector('.app-main');
    if (mainEl) mainEl.scrollTop = 0;

    // Cerrar sidebar si estuviese abierto
    this.closeSidebar();
  },

  // --- SIDEBAR DRAWER (MENÚ LATERAL) ---
  openSidebar() {
    const overlay = document.getElementById('sidebarOverlay');
    const drawer = document.getElementById('sidebarDrawer');
    if (overlay && drawer) {
      overlay.classList.add('open');
      drawer.classList.add('open');
    }
  },

  closeSidebar() {
    const overlay = document.getElementById('sidebarOverlay');
    const drawer = document.getElementById('sidebarDrawer');
    if (overlay && drawer) {
      overlay.classList.remove('open');
      drawer.classList.remove('open');
    }
  },

  toggleSidebar() {
    const drawer = document.getElementById('sidebarDrawer');
    if (drawer && drawer.classList.contains('open')) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  },

  // --- SELECTOR Y NAVEGACIÓN DE FECHAS ---
  updateDateDisplay() {
    const label = document.getElementById('currentDateLabel');
    const input = document.getElementById('headerDatePicker');
    const todayStr = Storage.formatDate();

    if (input) input.value = this.currentDate;

    if (label) {
      if (this.currentDate === todayStr) {
        label.innerText = 'Hoy 📅';
      } else {
        const d = new Date(this.currentDate + 'T00:00:00');
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        label.innerText = d.toLocaleDateString('es-ES', options);
      }
    }
  },

  changeDate(daysDelta) {
    const current = new Date(this.currentDate + 'T00:00:00');
    current.setDate(current.getDate() + daysDelta);
    this.currentDate = Storage.formatDate(current);
    this.updateDateDisplay();
    this.refreshAllViews();
  },

  setDate(newDateStr) {
    if (!newDateStr) return;
    this.currentDate = newDateStr;
    this.updateDateDisplay();
    this.refreshAllViews();
  },

  openDatePicker() {
    const picker = document.getElementById('headerDatePicker');
    if (picker) {
      if (typeof picker.showPicker === 'function') {
        picker.showPicker();
      } else {
        picker.focus();
        picker.click();
      }
    }
  },

  refreshAllViews() {
    Dashboard.render();
    Nutrition.render();
    Gym.render();
    Cardio.render();
    if (window.Analytics) Analytics.render();
  },

  // --- GUÍA INTERACTIVA DE BIENVENIDA & SINCRONIZACIÓN ---
  currentGuideStep: 0,
  guideTitles: [
    'Bienvenida',
    'Báscula Renpho',
    'Apple Fitness',
    'Apple Salud',
    'Calendario & Uso'
  ],

  openOnboardingGuide(stepIndex = 0) {
    if (typeof window.openOnboardingGuide === 'function') {
      window.openOnboardingGuide(stepIndex);
      return;
    }
    this.currentGuideStep = stepIndex;
    this.updateGuideStepUI();
    const modal = document.getElementById('onboardingGuideModal');
    if (modal) modal.classList.add('open');
  },

  closeOnboardingGuide() {
    if (window.Onboarding && typeof window.Onboarding.close === 'function') {
      window.Onboarding.close();
      return;
    }
    const modal = document.getElementById('onboardingGuideModal');
    if (modal) modal.classList.remove('open');
    localStorage.setItem('fit360_guide_completed', 'true');
  },

  setGuideStep(index) {
    this.currentGuideStep = Math.max(0, Math.min(4, index));
    this.updateGuideStepUI();
  },

  nextOnboardingStep() {
    if (this.currentGuideStep >= 4) {
      this.closeOnboardingGuide();
      this.showToast('🚀 ¡Listo! Fit360 preparado para tus registros reales', 'success');
      return;
    }
    this.currentGuideStep++;
    this.updateGuideStepUI();
  },

  prevOnboardingStep() {
    if (this.currentGuideStep > 0) {
      this.currentGuideStep--;
      this.updateGuideStepUI();
    }
  },

  updateGuideStepUI() {
    const totalSteps = 5;
    const pill = document.getElementById('onboardingStepPill');
    const name = document.getElementById('onboardingStepName');
    const prevBtn = document.getElementById('onboardingPrevBtn');
    const nextBtn = document.getElementById('onboardingNextBtn');

    if (pill) pill.innerText = `Paso ${this.currentGuideStep + 1} de ${totalSteps}`;
    if (name) name.innerText = this.guideTitles[this.currentGuideStep] || '';

    // Mostrar slide activo
    document.querySelectorAll('.onboarding-slide').forEach((slide, idx) => {
      slide.classList.toggle('active', idx === this.currentGuideStep);
    });

    // Actualizar dots indicadores
    const dots = document.querySelectorAll('#onboardingDotsContainer .onboarding-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentGuideStep);
    });

    // Visibilidad botón anterior
    if (prevBtn) {
      prevBtn.style.visibility = this.currentGuideStep === 0 ? 'hidden' : 'visible';
    }

    // Texto botón siguiente / finalizar
    if (nextBtn) {
      if (this.currentGuideStep === totalSteps - 1) {
        nextBtn.innerText = '🚀 ¡Empezar ahora!';
      } else {
        nextBtn.innerText = 'Siguiente →';
      }
    }
  },

  cleanDataAndNotify() {
    Storage.clearAllDataToZero();
    this.refreshAllViews();
    this.showToast('✅ Todos los registros se han limpiado a 0', 'success');
  },

  // --- MODALES (BOTTOM SHEET) ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  },

  // Quick FAB Action Modal
  openQuickFabModal() {
    this.openModal('quickFabModal');
  },

  // PWA Install prompt trigger
  installPwa() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          App.showToast('¡Fit360 instalada!', 'success');
        }
        this.deferredPrompt = null;
      });
    } else {
      App.showToast('Para instalar: pulsa "Compartir" en Safari o menú ⋮ en Chrome y elige "Añadir a pantalla de inicio"', 'info');
    }
  },

  // --- MÉTODOS DE UTILIDAD ---

  // --- AVISO DIARIO DE ANUNCIO (TRANSPARENCIA) ---
  showDailyAdNotice() {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const lastShown = localStorage.getItem('fit360_ad_notice_date');

    // Si ya se mostró hoy, no hacer nada
    if (lastShown === today) return;

    // Abrir el modal de transparencia
    const modal = document.getElementById('adTransparencyModal');
    if (modal) modal.classList.add('open');
  },

  acceptDailyAd() {
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('fit360_ad_notice_date', today);
    } catch (e) {
      console.warn('[App] No se pudo guardar fit360_ad_notice_date:', e);
    }

    // Cerrar modal inmediatamente de forma segura
    this.closeDailyAdNotice();

    // Emitir anuncio intersticial a través de AdsManager (respetando ATT y Capping)
    try {
      if (window.AdsManager && typeof window.AdsManager.showInterstitial === 'function') {
        window.AdsManager.showInterstitial('daily_support');
      }
    } catch (e) {
      console.warn('[App] Error al invocar showInterstitial:', e);
    }

    App.showToast('🙌 ¡Gracias por apoyar Fit360!', 'success');
  },

  closeDailyAdNotice() {
    const modal = document.getElementById('adTransparencyModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
      setTimeout(() => {
        modal.style.display = '';
      }, 400);
    }
  },

  // --- TOAST NOTIFICATIONS ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Sanitize the type to prevent className injection
    const safeType = ['info', 'success', 'error'].includes(type) ? type : 'info';

    const toast = document.createElement('div');
    toast.className = `toast toast-${safeType}`;
    
    let icon = 'ℹ️';
    if (safeType === 'success') icon = '✅';
    if (safeType === 'error') icon = '⚠️';

    // XSS FIX: Use textContent instead of innerHTML for user-facing message
    const iconSpan = document.createElement('span');
    iconSpan.style.fontSize = '1.1rem';
    iconSpan.textContent = icon;

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message; // Safe — never parsed as HTML

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

window.App = App;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
