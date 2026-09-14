/**
 * Fit360 - HealthSync Module
 * Sincronización con Apple Salud (HealthKit), Báscula Digital Renpho & Apple Fitness
 */
const HealthSync = {
  activeTab: 'sync', // 'sync', 'manual', 'history'

  init() {
    this.checkHealthKitAvailability();
  },

  // Comprobar si el plugin nativo de HealthKit está disponible en Capacitor
  isNativeHealthKitAvailable() {
    return !!(
      window.Capacitor &&
      window.Capacitor.isNativePlatform &&
      window.Capacitor.isNativePlatform() &&
      window.Capacitor.Plugins &&
      (window.Capacitor.Plugins.CapacitorHealthkit || window.Capacitor.Plugins.HealthKit)
    );
  },

  getHealthKitPlugin() {
    if (!window.Capacitor || !window.Capacitor.Plugins) return null;
    return window.Capacitor.Plugins.CapacitorHealthkit || window.Capacitor.Plugins.HealthKit || null;
  },

  checkHealthKitAvailability() {
    const isNative = this.isNativeHealthKitAvailable();
    const statusBadge = document.getElementById('renphoSyncStatusBadge');

    if (statusBadge) {
      if (isNative) {
        statusBadge.className = 'chip chip-lime';
        statusBadge.innerHTML = '● Conexión Nativa Lista (iOS)';
      } else {
        statusBadge.className = 'chip chip-cyan';
        statusBadge.innerHTML = '● Modo Web / Registro Rápido';
      }
    }
  },

  // Abrir modal de báscula Renpho y salud
  openModal(tab = 'sync') {
    this.switchTab(tab);
    this.loadLatestDataIntoInputs();
    this.renderHistoryList();
    this.checkHealthKitAvailability();
    App.openModal('renphoSyncModal');
  },

  closeModal() {
    App.closeModal('renphoSyncModal');
  },

  // Cambiar pestaña del modal
  switchTab(tabName) {
    this.activeTab = tabName;
    const tabs = ['sync', 'manual', 'history'];
    tabs.forEach(t => {
      const btn = document.getElementById(`renphoTabBtn_${t}`);
      const pane = document.getElementById(`renphoTabPane_${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (pane) pane.style.display = t === tabName ? 'block' : 'none';
    });

    if (tabName === 'history') {
      this.renderHistoryList();
    }
  },

  // Cargar el peso actual en los inputs del formulario manual
  loadLatestDataIntoInputs() {
    const latest = Storage.getLatestWeightLog();
    const weightInput = document.getElementById('manualWeightInput');
    const fatInput = document.getElementById('manualFatInput');
    const muscleInput = document.getElementById('manualMuscleInput');
    const dateInput = document.getElementById('manualWeightDate');
    const timeInput = document.getElementById('manualWeightTime');

    if (weightInput) weightInput.value = latest.weight || 76;
    if (fatInput) fatInput.value = latest.fatPct || '';
    if (muscleInput) muscleInput.value = latest.musclePct || '';
    if (dateInput) dateInput.value = Storage.formatDate();
    if (timeInput) timeInput.value = new Date().toTimeString().slice(0, 5);
  },

  // Ajustar peso con botones rápidos (+0.1, -0.1, etc.)
  adjustWeightInput(delta) {
    const input = document.getElementById('manualWeightInput');
    if (!input) return;
    let val = parseFloat(input.value) || 75;
    val = Math.round((val + delta) * 10) / 10;
    input.value = val.toFixed(1);
  },

  // Sincronizar automáticamente con Apple Salud / Renpho
  async syncFromAppleHealth() {
    const btn = document.getElementById('renphoAutoSyncBtn');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Conectando con Apple Salud...';
    }

    try {
      const plugin = this.getHealthKitPlugin();

      if (this.isNativeHealthKitAvailable() && plugin) {
        // 1. Solicitar permisos de HealthKit
        await plugin.requestAuthorization({
          all: ['weight', 'fatPercentage', 'activeEnergyBurned', 'stepCount', 'appleExerciseTime'],
          read: ['weight', 'fatPercentage', 'activeEnergyBurned', 'stepCount', 'appleExerciseTime'],
          write: []
        });

        // 2. Consultar muestra más reciente de peso (enviada por Renpho)
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3);

        let latestWeight = null;
        let latestFat = null;

        try {
          const weightResult = await plugin.queryHKitSampleType({
            sampleName: 'weight',
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
            limit: 1
          });
          if (weightResult && weightResult.resultData && weightResult.resultData.length > 0) {
            const sample = weightResult.resultData[0];
            latestWeight = sample.value;
          }
        } catch (e) {
          console.warn('No se pudo leer peso de HealthKit:', e);
        }

        try {
          const fatResult = await plugin.queryHKitSampleType({
            sampleName: 'fatPercentage',
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
            limit: 1
          });
          if (fatResult && fatResult.resultData && fatResult.resultData.length > 0) {
            const sample = fatResult.resultData[0];
            latestFat = sample.value ? Math.round(sample.value * 1000) / 10 : null;
          }
        } catch (e) {
          console.warn('No se pudo leer grasa de HealthKit:', e);
        }

        if (latestWeight) {
          const log = Storage.saveWeightLog({
            weight: Math.round(latestWeight * 10) / 10,
            fatPct: latestFat,
            source: 'renpho_health',
            timing: 'fasting',
            notes: 'Sincronizado automáticamente desde Renpho vía Apple Salud'
          });

          this.onWeightUpdated(log);
          App.showToast(`✅ Sincronizado desde Renpho: ${log.weight} kg`, 'success');
          this.closeModal();
          return;
        }
      }

      // Si no es nativo o no hay muestra reciente en HealthKit:
      await new Promise(r => setTimeout(r, 600));

      const latest = Storage.getLatestWeightLog();
      App.showToast(`⚖️ En entorno Web. Usa el Registro Rápido o importa el CSV de Renpho`, 'info');
      this.switchTab('manual');

    } catch (err) {
      console.error('Error sincronizando con HealthKit:', err);
      App.showToast('⚠️ No se pudo acceder a Apple Salud. Usa el registro rápido.', 'warning');
      this.switchTab('manual');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  // Guardar registro manual de peso
  saveManualWeight() {
    const weightVal = parseFloat(document.getElementById('manualWeightInput').value);
    const fatVal = parseFloat(document.getElementById('manualFatInput').value);
    const muscleVal = parseFloat(document.getElementById('manualMuscleInput').value);
    const dateVal = document.getElementById('manualWeightDate').value || Storage.formatDate();
    const timeVal = document.getElementById('manualWeightTime').value || '08:00';
    const timingVal = document.getElementById('manualWeightTiming').value || 'fasting';
    const notesVal = document.getElementById('manualWeightNotes').value || '';

    if (!weightVal || isNaN(weightVal) || weightVal <= 20 || weightVal >= 300) {
      App.showToast('Por favor introduce un peso válido en kg (ej: 75.8)', 'warning');
      return;
    }

    const log = Storage.saveWeightLog({
      weight: Math.round(weightVal * 10) / 10,
      fatPct: !isNaN(fatVal) && fatVal > 0 ? Math.round(fatVal * 10) / 10 : null,
      musclePct: !isNaN(muscleVal) && muscleVal > 0 ? Math.round(muscleVal * 10) / 10 : null,
      date: dateVal,
      time: timeVal,
      timing: timingVal,
      source: 'manual',
      notes: notesVal.trim()
    });

    this.onWeightUpdated(log);
    App.showToast(`✅ Pesaje guardado: ${log.weight} kg`, 'success');
    this.closeModal();
  },

  // Acción cuando se actualiza el peso
  onWeightUpdated(log) {
    if (window.Dashboard && typeof Dashboard.render === 'function') {
      Dashboard.render();
    }
    if (window.Analytics && typeof Analytics.render === 'function') {
      Analytics.render();
    }
    const profileWeightInput = document.getElementById('profileWeightInput');
    if (profileWeightInput) {
      profileWeightInput.value = log.weight;
    }
  },

  // Renderizar historial de pesajes en la pestaña 3
  renderHistoryList() {
    const container = document.getElementById('renphoHistoryContainer');
    if (!container) return;

    const logs = [...Storage.getWeightLogs()].reverse();

    if (logs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
          No hay registros de peso todavía.<br>Añade tu primer pesaje o sincroniza tu Renpho.
        </div>
      `;
      return;
    }

    let html = '';
    logs.forEach(log => {
      const sourceLabel = log.source === 'renpho_health' ? '⚖️ Renpho (Salud)' : (log.source === 'renpho_csv' ? '📄 CSV Renpho' : '✍️ Manual');
      const timingLabel = log.timing === 'fasting' ? '🌅 En ayunas' : (log.timing === 'post_workout' ? '💪 Post-entreno' : '🌙 Noche');

      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); margin-bottom: 6px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 1.05rem; color: #fff; font-family: var(--font-display);">${log.weight} kg</strong>
              ${log.fatPct ? `<span class="chip chip-cyan" style="font-size: 0.65rem;">${log.fatPct}% grasa</span>` : ''}
              ${log.musclePct ? `<span class="chip chip-lime" style="font-size: 0.65rem;">${log.musclePct}% músculo</span>` : ''}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; display: flex; gap: 8px;">
              <span>📅 ${log.date} ${log.time || ''}</span>
              <span>• ${timingLabel}</span>
              <span>• ${sourceLabel}</span>
            </div>
          </div>
          <button class="btn-icon" onclick="HealthSync.deleteLog('${log.id}')" title="Eliminar registro" style="color: var(--color-danger); opacity: 0.7; font-size: 0.9rem;">
            ✕
          </button>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  deleteLog(id) {
    if (confirm('¿Eliminar este registro de pesaje?')) {
      Storage.deleteWeightLog(id);
      this.renderHistoryList();
      if (window.Dashboard) Dashboard.render();
      if (window.Analytics) Analytics.render();
      App.showToast('Registro de peso eliminado', 'info');
    }
  },

  // Importar archivo CSV exportado desde la app Renpho
  triggerCsvImport() {
    const fileInput = document.getElementById('renphoCsvFileInput');
    if (fileInput) fileInput.click();
  },

  handleCsvFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.parseRenphoCsv(text);
      event.target.value = '';
    };
    reader.readAsText(file);
  },

  parseRenphoCsv(csvText) {
    try {
      const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        App.showToast('El archivo CSV está vacío o no tiene formato válido', 'warning');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const timeColIdx = headers.findIndex(h => h.includes('time') || h.includes('fecha') || h.includes('hora'));
      const weightColIdx = headers.findIndex(h => h.includes('weight') || h.includes('peso'));
      const fatColIdx = headers.findIndex(h => h.includes('fat') || h.includes('grasa'));
      const muscleColIdx = headers.findIndex(h => h.includes('muscle') || h.includes('músculo') || h.includes('musculo'));

      if (weightColIdx === -1) {
        App.showToast('No se encontró la columna de Peso en el CSV', 'warning');
        return;
      }

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
        const weightVal = parseFloat(cols[weightColIdx]);
        if (isNaN(weightVal) || weightVal <= 20) continue;

        let dateStr = Storage.formatDate();
        let timeStr = '08:00';

        if (timeColIdx !== -1 && cols[timeColIdx]) {
          const rawDate = cols[timeColIdx];
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            dateStr = Storage.formatDate(parsed);
            timeStr = parsed.toTimeString().slice(0, 5);
          }
        }

        const fatVal = fatColIdx !== -1 ? parseFloat(cols[fatColIdx]) : null;
        const muscleVal = muscleColIdx !== -1 ? parseFloat(cols[muscleColIdx]) : null;

        Storage.saveWeightLog({
          id: 'w_renpho_' + Date.now() + '_' + i,
          date: dateStr,
          time: timeStr,
          weight: Math.round(weightVal * 10) / 10,
          fatPct: fatVal && !isNaN(fatVal) ? Math.round(fatVal * 10) / 10 : null,
          musclePct: muscleVal && !isNaN(muscleVal) ? Math.round(muscleVal * 10) / 10 : null,
          timing: 'fasting',
          source: 'renpho_csv',
          notes: 'Importado de Renpho CSV'
        });
        count++;
      }

      if (count > 0) {
        App.showToast(`🎉 ¡${count} pesajes de Renpho importados con éxito!`, 'success');
        this.renderHistoryList();
        if (window.Dashboard) Dashboard.render();
        if (window.Analytics) Analytics.render();
      } else {
        App.showToast('No se pudieron extraer registros válidos del CSV', 'warning');
      }
    } catch (err) {
      console.error('Error parseando CSV de Renpho:', err);
      App.showToast('Error al leer el archivo CSV de Renpho', 'danger');
    }
  }
};

window.HealthSync = HealthSync;
