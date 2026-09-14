/**
 * Fit360 - Cardio & Machines Module (Cinta, Elíptica, Bici, etc.)
 */
const Cardio = {
  currentCardioType: 'elliptical', // 'elliptical' | 'treadmill' | 'bike'

  init() {
    this.setupListeners();
    this.render();
  },

  setupListeners() {
    // Listener de inclinación en cinta
    const inclineSlider = document.getElementById('treadmillInclineSlider');
    const inclineDisplay = document.getElementById('treadmillInclineDisplay');
    const slopeLine = document.getElementById('inclineSlopeLine');
    if (inclineSlider) {
      inclineSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        if (inclineDisplay) inclineDisplay.innerText = val.toFixed(1) + '%';
        if (slopeLine) {
          // Rotar según inclinación (0 a 15% -> 0 a 25deg)
          const deg = (val / 15) * 25;
          slopeLine.style.transform = `rotate(-${deg}deg)`;
        }
        this.calcTreadmillKcal();
      });
    }

    // Listener de resistencia en elíptica
    const resSlider = document.getElementById('ellipticalResSlider');
    const resDisplay = document.getElementById('ellipticalResDisplay');
    if (resSlider) {
      resSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        if (resDisplay) resDisplay.innerText = `Nivel ${val}`;
        this.calcEllipticalKcal();
      });
    }

    // Listener de tiempo y velocidad para recalcular kcal
    const tmSpeed = document.getElementById('treadmillSpeedInput');
    const tmTime = document.getElementById('treadmillTimeInput');
    if (tmSpeed) tmSpeed.addEventListener('input', () => this.calcTreadmillKcal());
    if (tmTime) tmTime.addEventListener('input', () => this.calcTreadmillKcal());

    const elTime = document.getElementById('ellipticalTimeInput');
    if (elTime) elTime.addEventListener('input', () => this.calcEllipticalKcal());
  },

  calcTreadmillKcal() {
    const time = Number(document.getElementById('treadmillTimeInput')?.value) || 20;
    const speed = Number(document.getElementById('treadmillSpeedInput')?.value) || 6.0;
    const incline = Number(document.getElementById('treadmillInclineSlider')?.value) || 0;
    const distanceInput = document.getElementById('treadmillDistanceInput');
    const kcalInput = document.getElementById('treadmillKcalInput');

    // Calcular distancia estimada: (speed km/h * time min) / 60
    const distance = (speed * (time / 60)).toFixed(2);
    if (distanceInput && !distanceInput.dataset.manual) {
      distanceInput.value = distance;
    }

    // Fórmula estándar ACSM aproximada de gasto calórico:
    // VO2 = (0.1 * speed_m_min) + (1.8 * speed_m_min * grade) + 3.5
    // Kcal/min = VO2 * weight_kg / 200 (asumiendo ~75kg)
    const speed_m_min = speed * 16.6667;
    const grade = incline / 100;
    const vo2 = (0.1 * speed_m_min) + (1.8 * speed_m_min * grade) + 3.5;
    const kcalPerMin = (vo2 * 75) / 200;
    const estimatedKcal = Math.round(kcalPerMin * time);

    if (kcalInput && !kcalInput.dataset.manual) {
      kcalInput.value = estimatedKcal;
    }
  },

  calcEllipticalKcal() {
    const time = Number(document.getElementById('ellipticalTimeInput')?.value) || 25;
    const res = Number(document.getElementById('ellipticalResSlider')?.value) || 10;
    const kcalInput = document.getElementById('ellipticalKcalInput');
    const distanceInput = document.getElementById('ellipticalDistanceInput');

    // Estimación para elíptica: base 7 kcal/min + factor resistencia
    const kcalPerMin = 7 + (res * 0.35);
    const estimatedKcal = Math.round(kcalPerMin * time);
    const estimatedDist = ((time / 60) * (9 + res * 0.2)).toFixed(2);

    if (distanceInput && !distanceInput.dataset.manual) {
      distanceInput.value = estimatedDist;
    }
    if (kcalInput && !kcalInput.dataset.manual) {
      kcalInput.value = estimatedKcal;
    }
  },

  render() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const sessions = dayData.cardio || [];
    const totals = Storage.calculateCardioTotals(dayData);

    const totalMinutesEl = document.getElementById('cardioTotalMinutes');
    if (totalMinutesEl) totalMinutesEl.innerText = `${totals.minutes} min`;

    const totalKcalEl = document.getElementById('cardioTotalKcal');
    if (totalKcalEl) totalKcalEl.innerText = `${totals.kcal} kcal`;

    const totalDistanceEl = document.getElementById('cardioTotalDistance');
    if (totalDistanceEl) totalDistanceEl.innerText = `${totals.distance} km`;

    const container = document.getElementById('cardioSessionsList');
    if (!container) return;

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 30px 20px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🏃‍♀️</div>
          <h4 style="font-size: 1rem; margin-bottom: 4px;">Sin sesiones de cardio hoy</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted);">
            Registra tu tiempo, resistencia en elíptica o inclinación en cinta de correr arriba.
          </p>
        </div>
      `;
      return;
    }

    let html = '';
    sessions.forEach(s => {
      let icon = '🏃';
      let title = s.title || 'Cardio';
      let badgeClass = 'pill-lime';
      let details = '';

      if (s.type === 'elliptical') {
        icon = '⚡';
        title = s.title || 'Elíptica';
        badgeClass = 'pill-cyan';
        details = `
          <div style="display: flex; gap: 12px; margin-top: 6px; font-size: 0.8rem; color: var(--text-secondary);">
            <span>⚡ Resistencia: <strong style="color: var(--accent-cyan);">${s.resistance}/25</strong></span>
            <span>📏 Distancia: <strong>${s.distance || 0} km</strong></span>
          </div>
        `;
      } else if (s.type === 'treadmill') {
        icon = '🏃';
        title = s.title || 'Cinta de Correr';
        badgeClass = 'pill-orange';
        details = `
          <div style="display: flex; gap: 12px; margin-top: 6px; font-size: 0.8rem; color: var(--text-secondary);">
            <span>📐 Inclinación: <strong style="color: var(--accent-orange);">${s.incline}%</strong></span>
            <span>⚡ Velocidad: <strong>${s.speed || 0} km/h</strong></span>
            <span>📏 ${s.distance || 0} km</span>
          </div>
        `;
      } else {
        icon = '🚴';
        title = s.title || 'Bicicleta Estática';
        details = `
          <div style="display: flex; gap: 12px; margin-top: 6px; font-size: 0.8rem; color: var(--text-secondary);">
            <span>⚡ Resistencia: <strong>${s.resistance || 0}</strong></span>
            <span>📏 ${s.distance || 0} km</span>
          </div>
        `;
      }

      html += `
        <div class="card" style="margin-bottom: 10px;">
          <div class="flex-between">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">${icon}</span>
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 700;">${title}</h4>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                  <span>⏱️ ${s.duration} min</span>
                  <span>🔥 <strong style="color: var(--accent-lime);">${s.kcal} kcal</strong></span>
                </div>
              </div>
            </div>
            <button onclick="Cardio.deleteSession('${s.id}')" style="color: var(--text-dim); padding: 6px;" title="Eliminar">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
          ${details}
          ${s.notes ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">📝 ${s.notes}</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  },

  switchCardioTab(type) {
    this.currentCardioType = type;
    document.querySelectorAll('.cardio-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    const tmForm = document.getElementById('treadmillForm');
    const elForm = document.getElementById('ellipticalForm');
    const bkForm = document.getElementById('bikeForm');

    if (tmForm) tmForm.style.display = type === 'treadmill' ? 'block' : 'none';
    if (elForm) elForm.style.display = type === 'elliptical' ? 'block' : 'none';
    if (bkForm) bkForm.style.display = type === 'bike' ? 'block' : 'none';
  },

  saveEllipticalSession() {
    const duration = Number(document.getElementById('ellipticalTimeInput')?.value) || 20;
    const resistance = Number(document.getElementById('ellipticalResSlider')?.value) || 1;
    const distance = Number(document.getElementById('ellipticalDistanceInput')?.value) || 0;
    const kcal = Number(document.getElementById('ellipticalKcalInput')?.value) || 150;
    const notes = document.getElementById('ellipticalNotesInput')?.value || '';

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.addCardioSession(activeDate, {
      type: 'elliptical',
      title: 'Elíptica',
      duration,
      resistance,
      distance,
      kcal,
      notes
    });

    // Actualizar también Apple Fitness active calories si está vacío o sumar
    this.syncWithAppleFitness(activeDate, kcal, duration);

    App.showToast(`Elíptica registrada: ${duration}min (Resistencia ${resistance})`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  saveTreadmillSession() {
    const duration = Number(document.getElementById('treadmillTimeInput')?.value) || 20;
    const speed = Number(document.getElementById('treadmillSpeedInput')?.value) || 5.0;
    const incline = Number(document.getElementById('treadmillInclineSlider')?.value) || 0;
    const distance = Number(document.getElementById('treadmillDistanceInput')?.value) || 0;
    const kcal = Number(document.getElementById('treadmillKcalInput')?.value) || 150;
    const notes = document.getElementById('treadmillNotesInput')?.value || '';

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.addCardioSession(activeDate, {
      type: 'treadmill',
      title: 'Cinta de Correr',
      duration,
      speed,
      incline,
      distance,
      kcal,
      notes
    });

    this.syncWithAppleFitness(activeDate, kcal, duration);

    App.showToast(`Cinta registrada: ${duration}min (Inclinación ${incline}%)`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  saveBikeSession() {
    const duration = Number(document.getElementById('bikeTimeInput')?.value) || 20;
    const resistance = Number(document.getElementById('bikeResSlider')?.value) || 5;
    const distance = Number(document.getElementById('bikeDistanceInput')?.value) || 0;
    const kcal = Number(document.getElementById('bikeKcalInput')?.value) || 140;
    const notes = document.getElementById('bikeNotesInput')?.value || '';

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.addCardioSession(activeDate, {
      type: 'bike',
      title: 'Bicicleta Estática',
      duration,
      resistance,
      distance,
      kcal,
      notes
    });

    this.syncWithAppleFitness(activeDate, kcal, duration);

    App.showToast(`Bici registrada: ${duration}min (Resistencia ${resistance})`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  syncWithAppleFitness(dateStr, sessionKcal, sessionMinutes) {
    const dayData = Storage.getDayData(dateStr);
    const apple = dayData.appleFitness || { activeKcal: 0, steps: 0, exerciseTime: 0 };
    
    // Si no había nada anotado en Apple Fitness para hoy, sumamos esta sesión
    if (!apple.activeKcal || apple.activeKcal === 0) {
      Storage.updateAppleFitness(dateStr, {
        activeKcal: sessionKcal,
        exerciseTime: sessionMinutes
      });
    }
  },

  deleteSession(sessionId) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.removeCardioSession(activeDate, sessionId);
    this.render();
    if (window.Dashboard) Dashboard.render();
    App.showToast('Sesión de cardio eliminada', 'info');
  }
};

window.Cardio = Cardio;
