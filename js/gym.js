/**
 * Fit360 - Gym & Weights Tracking Module
 */
const Gym = {
  currentCategoryFilter: 'all',
  currentRoutineFilter: 'all',
  activeOrganizerTab: 'routines',
  restTimerInterval: null,
  restTimerSeconds: 60,
  restTimerTotal: 60,
  isTimerRunning: false,
  routineBuilderState: {
    id: null,
    name: '',
    icon: '🔥',
    category: 'Fuerza',
    exercises: []
  },

  init() {
    this.renderMuscleCategoryChips();
    this.render();
  },

  renderMuscleCategoryChips() {
    const container = document.getElementById('gymCategoryChipsContainer');
    if (!container) return;

    const groups = Storage.getMuscleGroups();
    let html = `
      <button class="cat-filter-btn pill pill-cyan ${this.currentCategoryFilter === 'all' ? 'active' : ''}" 
        data-category="all" onclick="Gym.filterCategory('all')">
        Todos
      </button>
    `;

    groups.forEach(g => {
      const isActive = this.currentCategoryFilter.toLowerCase() === g.name.toLowerCase();
      html += `
        <button class="cat-filter-btn pill pill-cyan ${isActive ? 'active' : ''}" 
          data-category="${g.name}" onclick="Gym.filterCategory('${g.name}')">
          ${g.icon || '💪'} ${g.name}
        </button>
      `;
    });

    html += `
      <button class="pill pill-lime" onclick="Gym.openAddMuscleGroupModal()" style="border-style: dashed; cursor: pointer;">
        + Nuevo Músculo
      </button>
    `;

    container.innerHTML = html;
  },

  calculateSessionMetrics(exercises, activeDate) {
    let totalVolume = 0;
    let completedVolume = 0;
    let totalSets = 0;
    let completedSets = 0;
    let totalReps = 0;

    (exercises || []).forEach(ex => {
      (ex.sets || []).forEach(s => {
        totalSets++;
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        const setVol = w * r;
        totalVolume += setVol;
        totalReps += r;
        if (s.completed) {
          completedSets++;
          completedVolume += setVol;
        }
      });
    });

    const tons = (totalVolume / 1000).toFixed(2);
    const avgIntensity = totalReps > 0 ? (totalVolume / totalReps).toFixed(1) : 0;
    const completionPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    // Nivel de esfuerzo según volumen acumulado en kg
    let effortTier = { label: 'Iniciación', badge: '🌱 Inicio / Calentamiento', color: 'var(--text-muted)' };
    if (totalVolume >= 20000) {
      effortTier = { label: 'Sobrecarga Titán', badge: '🚀 Nivel Titán', color: '#ff2d55' };
    } else if (totalVolume >= 12000) {
      effortTier = { label: 'Nivel Élite', badge: '🏆 Esfuerzo Élite', color: 'var(--accent-lime)' };
    } else if (totalVolume >= 6000) {
      effortTier = { label: 'Alta Intensidad', badge: '🔥 Alta Intensidad', color: 'var(--accent-orange)' };
    } else if (totalVolume >= 2000) {
      effortTier = { label: 'Moderada', badge: '⚡ Sesión Activa', color: 'var(--accent-cyan)' };
    }

    // Comparación con sesión de pesas anterior
    const prevSession = Storage.getPreviousGymSessionVolume(activeDate);
    let comparison = null;
    if (prevSession && prevSession.volume > 0) {
      const diffKg = totalVolume - prevSession.volume;
      const diffPct = Math.round((diffKg / prevSession.volume) * 100);
      const isPositive = diffKg >= 0;
      const formattedDate = new Date(prevSession.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      comparison = {
        diffKg,
        diffPct,
        isPositive,
        prevDateFormatted: formattedDate,
        prevVolume: prevSession.volume,
        text: isPositive 
          ? `+${diffKg.toLocaleString('es-ES')} kg (+${diffPct}%) vs. última sesión (${formattedDate})`
          : `${diffKg.toLocaleString('es-ES')} kg (${diffPct}%) vs. última sesión (${formattedDate})`
      };
    }

    return {
      totalVolume,
      completedVolume,
      totalSets,
      completedSets,
      totalReps,
      tons,
      avgIntensity,
      completionPct,
      effortTier,
      comparison,
      exerciseCount: (exercises || []).length
    };
  },

  renderVolumeHeroCard(metrics) {
    const container = document.getElementById('gymVolumeHeroContainer');
    if (!container) return;

    if (!metrics || metrics.exerciseCount === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="card gym-volume-hero-card">
        <div class="flex-between" style="align-items: flex-start; margin-bottom: 6px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                Kilos Movidos en la Sesión
              </span>
              <span class="gym-effort-badge" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: ${metrics.effortTier.color};">
                ${metrics.effortTier.badge}
              </span>
            </div>
            <div class="gym-hero-tonnage">
              <span class="gym-tonnage-val">${metrics.totalVolume.toLocaleString('es-ES')}</span>
              <span class="gym-tonnage-unit">kg</span>
            </div>
          </div>

          <div class="gym-tons-badge">
            <span style="font-size: 1.15rem;">🏋️‍♂️</span>
            <div>
              <div style="font-size: 0.95rem; font-weight: 800; color: #fff; line-height: 1;">${metrics.tons} Tn</div>
              <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Toneladas</div>
            </div>
          </div>
        </div>

        <!-- Barra de progreso de series completadas -->
        <div style="margin: 8px 0 10px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 4px;">
            <span style="color: var(--text-muted);">Progreso de series:</span>
            <strong style="color: ${metrics.completionPct === 100 && metrics.totalSets > 0 ? 'var(--accent-lime)' : '#fff'};">
              ${metrics.completedSets} de ${metrics.totalSets} completadas (${metrics.completionPct}%)
            </strong>
          </div>
          <div class="gym-progress-track">
            <div class="gym-progress-fill" style="width: ${metrics.completionPct}%;"></div>
          </div>
        </div>

        <!-- 3 KPIs secundarios -->
        <div class="gym-hero-kpi-grid">
          <div class="gym-hero-subkpi">
            <span class="subkpi-label">Reps Totales</span>
            <span class="subkpi-val">${metrics.totalReps}</span>
          </div>
          <div class="gym-hero-subkpi">
            <span class="subkpi-label">Carga Media</span>
            <span class="subkpi-val">${metrics.avgIntensity} <small style="font-size: 0.65rem; font-weight: 500;">kg/rep</small></span>
          </div>
          <div class="gym-hero-subkpi">
            <span class="subkpi-label">Ejercicios</span>
            <span class="subkpi-val">${metrics.exerciseCount}</span>
          </div>
        </div>

        <!-- Franja de Sobrecarga Progresiva -->
        <div class="gym-hero-overload-strip">
          ${metrics.comparison ? `
            <span style="color: ${metrics.comparison.isPositive ? 'var(--accent-lime)' : 'var(--accent-orange)'}; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              <span>${metrics.comparison.isPositive ? '▲' : '▼'}</span>
              <span>${metrics.comparison.text}</span>
            </span>
          ` : `
            <span style="color: var(--text-muted);">
              ⭐ Primera sesión registrada para cálculo de sobrecarga progresiva
            </span>
          `}
        </div>
      </div>
    `;
  },

  updateVolumeHeroOnly(activeDate) {
    const dayData = Storage.getDayData(activeDate);
    const exercises = dayData.gym || [];
    const metrics = this.calculateSessionMetrics(exercises, activeDate);
    this.renderVolumeHeroCard(metrics);

    // Actualizar badges
    const countBadge = document.getElementById('gymTotalExercises');
    if (countBadge) countBadge.innerText = `${metrics.exerciseCount} Ejercicios`;

    const setsBadge = document.getElementById('gymTotalSets');
    if (setsBadge) setsBadge.innerText = `${metrics.completedSets}/${metrics.totalSets} Series`;

    const volumeBadge = document.getElementById('gymTotalVolume');
    if (volumeBadge) volumeBadge.innerText = `${metrics.totalVolume.toLocaleString('es-ES')} kg`;
  },

  render() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const exercises = dayData.gym || [];

    const container = document.getElementById('gymExercisesList');
    if (!container) return;

    // Calcular métricas de volumen y esfuerzo de la sesión
    const metrics = this.calculateSessionMetrics(exercises, activeDate);
    this.renderVolumeHeroCard(metrics);

    const countBadge = document.getElementById('gymTotalExercises');
    if (countBadge) countBadge.innerText = `${metrics.exerciseCount} Ejercicios`;

    const setsBadge = document.getElementById('gymTotalSets');
    if (setsBadge) setsBadge.innerText = `${metrics.completedSets}/${metrics.totalSets} Series`;

    const volumeBadge = document.getElementById('gymTotalVolume');
    if (volumeBadge) volumeBadge.innerText = `${metrics.totalVolume.toLocaleString('es-ES')} kg`;

    if (exercises.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🏋️‍♂️</div>
          <h3 style="font-size: 1.15rem; margin-bottom: 6px;">Sin ejercicios registrados hoy</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 20px;">
            Añade tus ejercicios de pesas, organiza tu rutina o carga una plantilla para registrar tus series y kilos movidos.
          </p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="Gym.openRoutineOrganizerModal()">
              📋 Organizar Rutina
            </button>
            <button class="btn btn-primary btn-sm" onclick="Gym.openAddExerciseModal()">
              + Añadir Ejercicio
            </button>
            <button class="btn btn-energy btn-sm" onclick="Gym.openCustomExerciseCreatorModal()">
              ⚡ Crear con KPIs
            </button>
          </div>
        </div>
      `;
      return;
    }

    let html = '';
    exercises.forEach((ex, exIdx) => {
      // Columnas configuradas para este ejercicio
      const columns = (ex.columns && ex.columns.length > 0) ? ex.columns : [
        { id: 'weight', label: 'kg', placeholder: 'kg', type: 'number', step: '0.5' },
        { id: 'reps', label: 'Reps', placeholder: 'reps', type: 'number', step: '1' }
      ];

      const gridCols = `28px repeat(${columns.length}, 1fr) 36px 26px`;

      html += `
        <div class="card" id="gym_card_${ex.id}">
          <div class="card-header">
            <div>
              <div class="card-title">
                <span class="pill pill-cyan" style="font-size: 0.68rem;">${ex.category || 'Fuerza'}</span>
                <span>${ex.name}</span>
              </div>
              <input type="text" class="gym-notes-input" placeholder="Añadir nota (ej: RPE 8, tempo 3-0-1)..." 
                value="${ex.notes || ''}" 
                onchange="Gym.updateNotes('${ex.id}', this.value)"
                style="width: 100%; margin-top: 6px; font-size: 0.76rem; background: transparent; border: none; border-bottom: 1px dashed rgba(255,255,255,0.15); border-radius: 0; padding: 2px 0; color: var(--text-secondary);">
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <button class="gym-move-btn" onclick="Gym.moveExercise('${ex.id}', 'up')" title="Subir orden" ${exIdx === 0 ? 'disabled' : ''}>▲</button>
              <button class="gym-move-btn" onclick="Gym.moveExercise('${ex.id}', 'down')" title="Bajar orden" ${exIdx === exercises.length - 1 ? 'disabled' : ''}>▼</button>
              <button onclick="Gym.openEditExerciseColumnsModal('${ex.id}')" style="color: var(--accent-cyan); padding: 4px;" title="Personalizar columnas/KPIs">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              </button>
              <button onclick="Gym.deleteExercise('${ex.id}')" style="color: var(--text-dim); padding: 4px;" title="Eliminar ejercicio">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>

          <!-- Series Header Dinámico -->
          <div style="display: grid; grid-template-columns: ${gridCols}; gap: 6px; font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px; text-align: center;">
            <span>Set</span>
            ${columns.map(c => `<span>${c.label}</span>`).join('')}
            <span>Listo</span>
            <span></span>
          </div>

          <!-- Series List Dinámica -->
          <div id="sets_container_${ex.id}">
            ${(ex.sets || []).map((s, sIdx) => `
              <div class="set-row" style="grid-template-columns: ${gridCols}; gap: 6px;">
                <span class="set-num">${s.setNum || (sIdx + 1)}</span>
                ${columns.map(c => `
                  <input type="${c.type || 'number'}" step="${c.step || 'any'}" class="set-input" 
                    value="${s[c.id] !== undefined ? s[c.id] : ''}" 
                    placeholder="${c.placeholder || c.label}"
                    oninput="Gym.updateSetField('${ex.id}', ${sIdx}, '${c.id}', this.value, true)"
                    onchange="Gym.updateSetField('${ex.id}', ${sIdx}, '${c.id}', this.value, false)">
                `).join('')}
                <button class="set-check ${s.completed ? 'checked' : ''}" 
                  onclick="Gym.toggleSetCompleted('${ex.id}', ${sIdx})" title="Marcar completada">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
                </button>
                <button class="set-del-btn" onclick="Gym.removeSet('${ex.id}', ${sIdx})" title="Eliminar serie">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="Gym.addSet('${ex.id}')">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>
              Añadir Serie
            </button>
            <button class="btn btn-secondary btn-sm" onclick="Gym.startRestTimer(90)" title="Descanso 90s">
              ⏱️ 90s
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  moveExercise(exerciseId, direction) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const exercises = dayData.gym || [];
    const idx = exercises.findIndex(e => e.id === exerciseId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= exercises.length) return;

    Storage.reorderGymExercises(activeDate, idx, targetIdx);
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  openAddExerciseModal() {
    this.currentCategoryFilter = 'all';
    this.renderExerciseSelector();
    document.getElementById('customExNameInput').value = '';
    App.openModal('gymExerciseModal');
  },

  renderExerciseSelector() {
    const listContainer = document.getElementById('exerciseDbList');
    if (!listContainer) return;

    const searchTerm = (document.getElementById('searchExInput')?.value || '').toLowerCase();
    
    let filtered = EXERCISES_DATABASE;
    if (this.currentCategoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category.toLowerCase() === this.currentCategoryFilter.toLowerCase());
    }
    if (searchTerm) {
      filtered = filtered.filter(e => e.name.toLowerCase().includes(searchTerm) || e.category.toLowerCase().includes(searchTerm));
    }

    listContainer.innerHTML = filtered.map(ex => `
      <div onclick="Gym.selectExerciseFromDb('${ex.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--accent-cyan)'" onmouseout="this.style.borderColor='var(--glass-border)'">
        <div>
          <div style="font-weight: 700; font-size: 0.9rem; color: #fff;">${ex.name}</div>
          <span class="pill pill-cyan" style="font-size: 0.68rem; margin-top: 4px;">${ex.category}</span>
        </div>
        <button class="btn-icon" style="color: var(--accent-cyan); font-weight: 700; font-size: 1.2rem;">+</button>
      </div>
    `).join('');
  },

  filterCategory(category) {
    this.currentCategoryFilter = category;
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    this.renderExerciseSelector();
  },

  selectExerciseFromDb(exId) {
    const ex = EXERCISES_DATABASE.find(e => e.id === exId);
    if (!ex) return;

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.addGymExercise(activeDate, {
      name: ex.name,
      category: ex.category,
      defaultWeight: ex.defaultWeight,
      defaultReps: ex.defaultReps,
      sets: [
        { setNum: 1, weight: ex.defaultWeight, reps: ex.defaultReps, completed: true },
        { setNum: 2, weight: ex.defaultWeight, reps: ex.defaultReps, completed: false }
      ]
    });

    App.closeModal('gymExerciseModal');
    App.showToast(`Añadido: ${ex.name}`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  saveCustomExercise() {
    const name = document.getElementById('customExNameInput').value.trim();
    const category = document.getElementById('customExCategorySelect').value;
    const weight = Number(document.getElementById('customExWeightInput').value) || 20;
    const reps = Number(document.getElementById('customExRepsInput').value) || 10;

    if (!name) {
      App.showToast('Escribe el nombre del ejercicio', 'error');
      return;
    }

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.addGymExercise(activeDate, {
      name,
      category,
      sets: [
        { setNum: 1, weight, reps, completed: true }
      ]
    });

    App.closeModal('gymExerciseModal');
    App.showToast(`Añadido: ${name}`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  addSet(exerciseId) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const ex = (dayData.gym || []).find(e => e.id === exerciseId);
    if (!ex) return;

    if (!ex.sets) ex.sets = [];
    const lastSet = ex.sets[ex.sets.length - 1] || { weight: 50, reps: 10 };
    
    ex.sets.push({
      setNum: ex.sets.length + 1,
      weight: lastSet.weight,
      reps: lastSet.reps,
      completed: false
    });

    Storage.updateGymExercise(activeDate, exerciseId, { sets: ex.sets });
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  removeSet(exerciseId, setIdx) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const ex = (dayData.gym || []).find(e => e.id === exerciseId);
    if (!ex || !ex.sets) return;

    ex.sets.splice(setIdx, 1);
    // Renumerar
    ex.sets.forEach((s, idx) => { s.setNum = idx + 1; });

    Storage.updateGymExercise(activeDate, exerciseId, { sets: ex.sets });
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  updateSet(exerciseId, setIdx, field, value) {
    this.updateSetField(exerciseId, setIdx, field, value);
  },

  updateSetField(exerciseId, setIdx, field, value, isTyping = false) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const ex = (dayData.gym || []).find(e => e.id === exerciseId);
    if (!ex || !ex.sets || !ex.sets[setIdx]) return;

    const numVal = Number(value);
    ex.sets[setIdx][field] = (!isNaN(numVal) && value.trim() !== '') ? numVal : value;
    Storage.updateGymExercise(activeDate, exerciseId, { sets: ex.sets });

    // Actualizar inmediatamente el recuento superior de kilos movidos y badges
    this.updateVolumeHeroOnly(activeDate);

    if (!isTyping && window.Dashboard) {
      Dashboard.render();
    }
  },

  // --- GESTIÓN DE GRUPOS MUSCULARES ---
  openAddMuscleGroupModal() {
    document.getElementById('newMuscleGroupNameInput').value = '';
    document.getElementById('newMuscleGroupIconInput').value = '💪';
    App.openModal('muscleGroupModal');
  },

  createMuscleGroup() {
    const name = document.getElementById('newMuscleGroupNameInput').value.trim();
    const icon = document.getElementById('newMuscleGroupIconInput').value.trim() || '💪';

    if (!name) {
      App.showToast('Introduce el nombre del grupo muscular', 'error');
      return;
    }

    Storage.addMuscleGroup(name, icon);
    App.closeModal('muscleGroupModal');
    App.showToast(`Grupo muscular "${icon} ${name}" añadido`, 'success');
    this.renderMuscleCategoryChips();
    this.populateMuscleSelects();
    if (window.Analytics) Analytics.render();
  },

  populateMuscleSelects() {
    const groups = Storage.getMuscleGroups();
    const selects = [
      document.getElementById('customExCategorySelect'),
      document.getElementById('kpiBuilderCategorySelect')
    ];

    selects.forEach(select => {
      if (!select) return;
      select.innerHTML = groups.map(g => `
        <option value="${g.name}">${g.icon || '💪'} ${g.name}</option>
      `).join('');
    });
  },

  // --- CREADOR DE EJERCICIOS CON COLUMNAS / KPIS PERSONALIZADOS ---
  openCustomExerciseCreatorModal() {
    this.populateMuscleSelects();
    document.getElementById('kpiExNameInput').value = '';
    // Reset column checkboxes
    document.getElementById('colWeightCheck').checked = true;
    document.getElementById('colRepsCheck').checked = true;
    document.getElementById('colTimeCheck').checked = false;
    document.getElementById('colRpeCheck').checked = false;
    document.getElementById('colDistanceCheck').checked = false;
    document.getElementById('colNotesCheck').checked = false;

    App.openModal('customKpiExerciseModal');
  },

  saveExerciseWithCustomKpis() {
    const name = document.getElementById('kpiExNameInput').value.trim();
    const category = document.getElementById('kpiBuilderCategorySelect').value;

    if (!name) {
      App.showToast('Introduce el nombre del ejercicio', 'error');
      return;
    }

    // Construir columnas según selección del usuario
    const columns = [];
    if (document.getElementById('colWeightCheck').checked) {
      columns.push({ id: 'weight', label: 'kg', placeholder: 'kg', type: 'number', step: '0.5' });
    }
    if (document.getElementById('colRepsCheck').checked) {
      columns.push({ id: 'reps', label: 'Reps', placeholder: 'reps', type: 'number', step: '1' });
    }
    if (document.getElementById('colTimeCheck').checked) {
      columns.push({ id: 'time', label: 'Tiempo (s)', placeholder: 'seg', type: 'number', step: '1' });
    }
    if (document.getElementById('colRpeCheck').checked) {
      columns.push({ id: 'rpe', label: 'RPE', placeholder: '1-10', type: 'number', step: '0.5' });
    }
    if (document.getElementById('colDistanceCheck').checked) {
      columns.push({ id: 'distance', label: 'Distancia (m)', placeholder: 'm', type: 'number', step: '1' });
    }
    if (document.getElementById('colNotesCheck').checked) {
      columns.push({ id: 'setNote', label: 'Nota', placeholder: 'ej. pausa', type: 'text' });
    }

    // Si no marcó ninguna, poner peso y reps por defecto
    if (columns.length === 0) {
      columns.push({ id: 'weight', label: 'kg', placeholder: 'kg', type: 'number', step: '0.5' });
      columns.push({ id: 'reps', label: 'Reps', placeholder: 'reps', type: 'number', step: '1' });
    }

    // Guardar definición personalizada para que esté disponible en la DB
    Storage.saveCustomExerciseDef({
      name,
      category,
      columns
    });

    // Añadirlo a la sesión de hoy
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const initialSet = { setNum: 1, completed: true };
    columns.forEach(c => {
      if (c.id === 'weight') initialSet.weight = 20;
      else if (c.id === 'reps') initialSet.reps = 10;
      else if (c.id === 'time') initialSet.time = 45;
      else if (c.id === 'rpe') initialSet.rpe = 8;
      else if (c.id === 'distance') initialSet.distance = 50;
      else initialSet[c.id] = '';
    });

    Storage.addGymExercise(activeDate, {
      name,
      category,
      columns,
      sets: [initialSet]
    });

    App.closeModal('customKpiExerciseModal');
    App.showToast(`Ejercicio con KPIs "${name}" creado`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  // --- EDITAR COLUMNAS DE UN EJERCICIO EXISTENTE ---
  openEditExerciseColumnsModal(exerciseId) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const ex = (dayData.gym || []).find(e => e.id === exerciseId);
    if (!ex) return;

    this.editingExerciseId = exerciseId;
    document.getElementById('editExColumnsTitle').innerText = `Personalizar columnas: ${ex.name}`;

    const cols = ex.columns || [
      { id: 'weight', label: 'kg' },
      { id: 'reps', label: 'Reps' }
    ];

    document.getElementById('editColWeightCheck').checked = cols.some(c => c.id === 'weight');
    document.getElementById('editColRepsCheck').checked = cols.some(c => c.id === 'reps');
    document.getElementById('editColTimeCheck').checked = cols.some(c => c.id === 'time');
    document.getElementById('editColRpeCheck').checked = cols.some(c => c.id === 'rpe');
    document.getElementById('editColDistanceCheck').checked = cols.some(c => c.id === 'distance');

    App.openModal('editExerciseColumnsModal');
  },

  saveEditedExerciseColumns() {
    if (!this.editingExerciseId) return;
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const ex = (dayData.gym || []).find(e => e.id === this.editingExerciseId);
    if (!ex) return;

    const columns = [];
    if (document.getElementById('editColWeightCheck').checked) {
      columns.push({ id: 'weight', label: 'kg', placeholder: 'kg', type: 'number', step: '0.5' });
    }
    if (document.getElementById('editColRepsCheck').checked) {
      columns.push({ id: 'reps', label: 'Reps', placeholder: 'reps', type: 'number', step: '1' });
    }
    if (document.getElementById('editColTimeCheck').checked) {
      columns.push({ id: 'time', label: 'Tiempo (s)', placeholder: 'seg', type: 'number', step: '1' });
    }
    if (document.getElementById('editColRpeCheck').checked) {
      columns.push({ id: 'rpe', label: 'RPE', placeholder: '1-10', type: 'number', step: '0.5' });
    }
    if (document.getElementById('editColDistanceCheck').checked) {
      columns.push({ id: 'distance', label: 'Distancia (m)', placeholder: 'm', type: 'number', step: '1' });
    }

    if (columns.length === 0) {
      columns.push({ id: 'weight', label: 'kg', placeholder: 'kg', type: 'number', step: '0.5' });
      columns.push({ id: 'reps', label: 'Reps', placeholder: 'reps', type: 'number', step: '1' });
    }

    Storage.updateGymExercise(activeDate, this.editingExerciseId, { columns });
    App.closeModal('editExerciseColumnsModal');
    App.showToast('Columnas y KPIs del ejercicio actualizadas', 'success');
    this.render();
  },

  toggleSetCompleted(exerciseId, setIdx) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const ex = (dayData.gym || []).find(e => e.id === exerciseId);
    if (!ex || !ex.sets || !ex.sets[setIdx]) return;

    ex.sets[setIdx].completed = !ex.sets[setIdx].completed;
    Storage.updateGymExercise(activeDate, exerciseId, { sets: ex.sets });
    this.render();
    if (window.Dashboard) Dashboard.render();

    // Auto-iniciar cronómetro de descanso si se marca como completada
    if (ex.sets[setIdx].completed) {
      this.startRestTimer(90);
    }
  },

  updateNotes(exerciseId, notes) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.updateGymExercise(activeDate, exerciseId, { notes });
  },

  // --- ORGANIZADOR Y GESTOR DE RUTINAS ---
  openRoutinesModal() {
    this.openRoutineOrganizerModal();
  },

  openRoutineOrganizerModal(tab = 'routines') {
    this.switchOrganizerTab(tab);
    App.openModal('routineOrganizerModal');
  },

  switchOrganizerTab(tab) {
    this.activeOrganizerTab = tab;
    const btnRoutines = document.getElementById('tabBtnOrganizerRoutines');
    const btnToday = document.getElementById('tabBtnOrganizerToday');
    const contentRoutines = document.getElementById('organizerTabRoutinesContent');
    const contentToday = document.getElementById('organizerTabTodayContent');

    if (btnRoutines) btnRoutines.classList.toggle('active', tab === 'routines');
    if (btnToday) btnToday.classList.toggle('active', tab === 'today');

    if (contentRoutines) contentRoutines.style.display = tab === 'routines' ? 'block' : 'none';
    if (contentToday) contentToday.style.display = tab === 'today' ? 'block' : 'none';

    if (tab === 'routines') {
      this.renderOrganizerRoutinesList();
    } else {
      this.renderOrganizerTodayList();
    }
  },

  filterRoutines(filter) {
    this.currentRoutineFilter = filter;
    ['all', 'custom', 'standard'].forEach(f => {
      const id = f === 'all' ? 'filterRoutineAll' : (f === 'custom' ? 'filterRoutineCustom' : 'filterRoutineStd');
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', this.currentRoutineFilter === f);
    });
    this.renderOrganizerRoutinesList();
  },

  renderOrganizerRoutinesList() {
    const container = document.getElementById('routinesOrganizerList');
    if (!container) return;

    const allRoutines = Storage.getAllRoutines();
    let filtered = allRoutines;

    if (this.currentRoutineFilter === 'custom') {
      filtered = allRoutines.filter(r => r.isCustom);
    } else if (this.currentRoutineFilter === 'standard') {
      filtered = allRoutines.filter(r => !r.isCustom);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 15px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md);">
          <div style="font-size: 2rem; margin-bottom: 8px;">📋</div>
          <p style="font-size: 0.85rem; color: var(--text-muted);">No hay rutinas en este filtro.</p>
          <button class="btn btn-primary btn-sm" onclick="Gym.openRoutineEditorModal()" style="margin-top: 10px;">
            + Crear mi Primera Rutina
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(r => {
      const exList = r.exercises || [];
      const totalEstimatedSets = exList.reduce((acc, e) => acc + (e.sets ? e.sets.length : 3), 0);

      return `
        <div class="routine-card-item">
          <div class="flex-between" style="align-items: flex-start; gap: 8px;">
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="font-size: 1.65rem;">${r.icon || '🏋️‍♂️'}</span>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="font-size: 0.92rem; color: #fff;">${r.name}</strong>
                  <span class="pill ${r.isCustom ? 'pill-lime' : 'pill-cyan'}" style="font-size: 0.62rem;">
                    ${r.isCustom ? 'Personalizada' : 'Estándar'}
                  </span>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-muted);">
                  ${exList.length} ejercicios • ~${totalEstimatedSets} series • ${r.category || 'Fuerza'}
                </span>
              </div>
            </div>

            <div style="display: flex; gap: 4px; align-items: center;">
              ${r.isCustom ? `
                <button class="gym-move-btn" onclick="Gym.openRoutineEditorModal('${r.id}')" title="Editar rutina" style="color: var(--accent-cyan);">
                  ✏️
                </button>
                <button class="gym-move-btn" onclick="Gym.deleteCustomRoutinePrompt('${r.id}')" title="Eliminar rutina" style="color: var(--accent-magenta);">
                  🗑️
                </button>
              ` : ''}
              <button class="btn btn-primary btn-sm" onclick="Gym.promptApplyRoutine('${r.id}')" style="font-size: 0.74rem; padding: 5px 10px;">
                Cargar ›
              </button>
            </div>
          </div>

          <!-- Preview chips de ejercicios -->
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
            ${exList.map(e => `
              <span class="routine-exercise-chip">
                ${e.name} ${e.sets ? `(${e.sets.length}s)` : ''}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  renderOrganizerTodayList() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const exercises = dayData.gym || [];

    const badge = document.getElementById('organizerTodayCount');
    if (badge) badge.innerText = exercises.length;

    const container = document.getElementById('organizerTodayExercisesList');
    if (!container) return;

    if (exercises.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 15px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🏋️‍♂️</div>
          <p style="font-size: 0.85rem; color: var(--text-muted);">No hay ejercicios en la sesión de hoy.</p>
          <button class="btn btn-primary btn-sm" onclick="App.closeModal('routineOrganizerModal'); Gym.openAddExerciseModal();" style="margin-top: 10px;">
            + Añadir Ejercicios a Hoy
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = exercises.map((ex, idx) => `
      <div class="card" style="padding: 10px 12px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
          <span style="font-weight: 800; font-size: 0.82rem; color: var(--accent-cyan); width: 20px;">#${idx + 1}</span>
          <div style="min-width: 0;">
            <div style="font-size: 0.88rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${ex.name}
            </div>
            <span style="font-size: 0.7rem; color: var(--text-muted);">
              ${ex.category || 'Fuerza'} • ${(ex.sets || []).length} series
            </span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 4px;">
          <button class="gym-move-btn" onclick="Gym.moveExercise('${ex.id}', 'up'); Gym.renderOrganizerTodayList();" title="Subir" ${idx === 0 ? 'disabled' : ''}>▲</button>
          <button class="gym-move-btn" onclick="Gym.moveExercise('${ex.id}', 'down'); Gym.renderOrganizerTodayList();" title="Bajar" ${idx === exercises.length - 1 ? 'disabled' : ''}>▼</button>
          <button class="gym-move-btn" onclick="Gym.deleteExercise('${ex.id}'); Gym.renderOrganizerTodayList();" title="Eliminar" style="color: var(--accent-magenta);">✕</button>
        </div>
      </div>
    `).join('');
  },

  promptApplyRoutine(routineId) {
    const routine = Storage.getAllRoutines().find(r => r.id === routineId);
    if (!routine) return;

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const existingCount = (dayData.gym || []).length;

    if (existingCount > 0) {
      const choice = confirm(`La sesión de hoy ya tiene ${existingCount} ejercicios.\n\n¿Deseas REEMPLAZAR la sesión actual con "${routine.name}"?\n(Pulsa Aceptar para Reemplazar, o Cancelar para Añadir al final)`);
      this.applyRoutineToSession(routineId, choice ? 'replace' : 'append');
    } else {
      this.applyRoutineToSession(routineId, 'replace');
    }
  },

  applyRoutineToSession(routineId, mode = 'replace') {
    const routine = Storage.getAllRoutines().find(r => r.id === routineId);
    if (!routine) return;

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);

    if (mode === 'replace') {
      dayData.gym = [];
    } else if (!dayData.gym) {
      dayData.gym = [];
    }

    (routine.exercises || []).forEach((ex, idx) => {
      const sets = (ex.sets && ex.sets.length > 0) ? ex.sets.map((s, sIdx) => ({
        setNum: sIdx + 1,
        weight: Number(s.weight) || 20,
        reps: Number(s.reps) || 10,
        completed: false
      })) : [
        { setNum: 1, weight: 20, reps: 10, completed: false },
        { setNum: 2, weight: 20, reps: 10, completed: false },
        { setNum: 3, weight: 20, reps: 10, completed: false }
      ];

      dayData.gym.push({
        id: 'gym_' + (Date.now() + idx),
        name: ex.name,
        category: ex.category || 'Fuerza',
        notes: `Rutina: ${routine.name}`,
        sets
      });
    });

    Storage.saveDayData(activeDate, dayData);
    App.closeModal('routineOrganizerModal');
    App.showToast(`Rutina "${routine.name}" cargada (${routine.exercises.length} ejercicios)`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  deleteCustomRoutinePrompt(routineId) {
    if (confirm('¿Seguro que deseas eliminar esta rutina personalizada?')) {
      Storage.deleteCustomRoutine(routineId);
      App.showToast('Rutina eliminada', 'info');
      this.renderOrganizerRoutinesList();
    }
  },

  saveCurrentSessionAsRoutine() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const exercises = dayData.gym || [];

    if (exercises.length === 0) {
      App.showToast('La sesión de hoy no tiene ejercicios para guardar', 'error');
      return;
    }

    // Inicializar builder con los ejercicios actuales
    this.openRoutineEditorModal(null, {
      name: 'Rutina ' + new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
      icon: '💪',
      category: exercises[0]?.category || 'Fuerza',
      exercises: exercises.map(e => ({
        name: e.name,
        category: e.category || 'Fuerza',
        sets: (e.sets || []).map(s => ({
          weight: Number(s.weight) || 20,
          reps: Number(s.reps) || 10
        }))
      }))
    });
  },

  // --- CREADOR / EDITOR DE RUTINAS PERSONALIZADAS ---
  openRoutineEditorModal(routineId = null, prefillData = null) {
    this.populateRoutineBuilderSelect();

    if (prefillData) {
      this.routineBuilderState = {
        id: null,
        name: prefillData.name || '',
        icon: prefillData.icon || '🔥',
        category: prefillData.category || 'Fuerza',
        exercises: prefillData.exercises ? JSON.parse(JSON.stringify(prefillData.exercises)) : []
      };
      const title = document.getElementById('routineEditorTitle');
      if (title) title.innerText = 'Guardar Sesión como Rutina';
    } else if (routineId) {
      const routine = Storage.getCustomRoutines().find(r => r.id === routineId);
      if (routine) {
        this.routineBuilderState = {
          id: routine.id,
          name: routine.name,
          icon: routine.icon || '🔥',
          category: routine.category || 'Fuerza',
          exercises: routine.exercises ? JSON.parse(JSON.stringify(routine.exercises)) : []
        };
        const title = document.getElementById('routineEditorTitle');
        if (title) title.innerText = 'Editar Rutina';
      }
    } else {
      this.routineBuilderState = {
        id: null,
        name: '',
        icon: '🔥',
        category: 'Fuerza',
        exercises: []
      };
      const title = document.getElementById('routineEditorTitle');
      if (title) title.innerText = 'Crear Nueva Rutina';
    }

    const idInput = document.getElementById('routineEditorId');
    const iconInput = document.getElementById('routineEditorIconInput');
    const nameInput = document.getElementById('routineEditorNameInput');
    const catSelect = document.getElementById('routineEditorCategorySelect');
    const customInput = document.getElementById('routineBuilderCustomInput');

    if (idInput) idInput.value = this.routineBuilderState.id || '';
    if (iconInput) iconInput.value = this.routineBuilderState.icon;
    if (nameInput) nameInput.value = this.routineBuilderState.name;
    if (catSelect) catSelect.value = this.routineBuilderState.category;
    if (customInput) customInput.value = '';

    this.renderRoutineEditorList();
    App.openModal('routineEditorModal');
  },

  populateRoutineBuilderSelect() {
    const select = document.getElementById('routineBuilderExSelect');
    if (!select) return;

    select.innerHTML = `
      <option value="">-- Elige ejercicio de la base de datos --</option>
      ${EXERCISES_DATABASE.map(e => `
        <option value="${e.id}">${e.name} (${e.category})</option>
      `).join('')}
    `;
  },

  renderRoutineEditorList() {
    const container = document.getElementById('routineEditorExercisesList');
    const badge = document.getElementById('routineEditorExCount');
    if (!container) return;

    const list = this.routineBuilderState.exercises || [];
    if (badge) badge.innerText = list.length;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.8rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm);">
          Añade ejercicios abajo para conformar tu rutina.
        </div>
      `;
      return;
    }

    container.innerHTML = list.map((ex, idx) => {
      const setsCount = ex.sets ? ex.sets.length : 3;
      const defaultW = (ex.sets && ex.sets[0]) ? ex.sets[0].weight : 20;
      const defaultR = (ex.sets && ex.sets[0]) ? ex.sets[0].reps : 10;

      return `
        <div class="routine-builder-row">
          <div class="flex-between" style="margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 800; font-size: 0.78rem; color: var(--accent-cyan);">#${idx + 1}</span>
              <strong style="font-size: 0.85rem; color: #fff;">${ex.name}</strong>
              <span class="pill pill-cyan" style="font-size: 0.6rem; padding: 1px 6px;">${ex.category || 'Fuerza'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <button class="gym-move-btn" onclick="Gym.moveRoutineBuilderExercise(${idx}, 'up')" ${idx === 0 ? 'disabled' : ''}>▲</button>
              <button class="gym-move-btn" onclick="Gym.moveRoutineBuilderExercise(${idx}, 'down')" ${idx === list.length - 1 ? 'disabled' : ''}>▼</button>
              <button class="gym-move-btn" onclick="Gym.removeRoutineBuilderExercise(${idx})" style="color: var(--accent-magenta);">✕</button>
            </div>
          </div>

          <!-- Mini config: Series, Peso Inicial, Reps Objetivo -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; font-size: 0.72rem;">
            <div>
              <label style="color: var(--text-muted); display: block; font-size: 0.65rem;">Series</label>
              <input type="number" min="1" max="10" class="set-input" value="${setsCount}" 
                onchange="Gym.updateRoutineBuilderExerciseSets(${idx}, this.value)" style="padding: 4px; font-size: 0.78rem;">
            </div>
            <div>
              <label style="color: var(--text-muted); display: block; font-size: 0.65rem;">Peso obj. (kg)</label>
              <input type="number" step="0.5" class="set-input" value="${defaultW}" 
                onchange="Gym.updateRoutineBuilderExerciseField(${idx}, 'weight', this.value)" style="padding: 4px; font-size: 0.78rem;">
            </div>
            <div>
              <label style="color: var(--text-muted); display: block; font-size: 0.65rem;">Reps obj.</label>
              <input type="number" class="set-input" value="${defaultR}" 
                onchange="Gym.updateRoutineBuilderExerciseField(${idx}, 'reps', this.value)" style="padding: 4px; font-size: 0.78rem;">
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  addExerciseFromSelectToRoutineBuilder() {
    const select = document.getElementById('routineBuilderExSelect');
    const exId = select.value;
    if (!exId) return;

    const dbEx = EXERCISES_DATABASE.find(e => e.id === exId);
    if (!dbEx) return;

    const defaultSets = [
      { weight: dbEx.defaultWeight || 20, reps: dbEx.defaultReps || 10 },
      { weight: dbEx.defaultWeight || 20, reps: dbEx.defaultReps || 10 },
      { weight: dbEx.defaultWeight || 20, reps: dbEx.defaultReps || 10 }
    ];

    this.routineBuilderState.exercises.push({
      name: dbEx.name,
      category: dbEx.category,
      sets: defaultSets
    });

    select.value = '';
    this.renderRoutineEditorList();
  },

  addCustomExerciseToRoutineBuilder() {
    const input = document.getElementById('routineBuilderCustomInput');
    const name = input.value.trim();
    if (!name) {
      App.showToast('Escribe el nombre del ejercicio', 'error');
      return;
    }

    const categorySelect = document.getElementById('routineEditorCategorySelect');
    const category = categorySelect ? categorySelect.value : 'Fuerza';

    this.routineBuilderState.exercises.push({
      name,
      category,
      sets: [
        { weight: 20, reps: 10 },
        { weight: 20, reps: 10 },
        { weight: 20, reps: 10 }
      ]
    });

    input.value = '';
    this.renderRoutineEditorList();
  },

  moveRoutineBuilderExercise(index, direction) {
    const list = this.routineBuilderState.exercises;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    this.renderRoutineEditorList();
  },

  removeRoutineBuilderExercise(index) {
    this.routineBuilderState.exercises.splice(index, 1);
    this.renderRoutineEditorList();
  },

  updateRoutineBuilderExerciseSets(index, setsVal) {
    const numSets = Math.max(1, Math.min(10, Number(setsVal) || 3));
    const ex = this.routineBuilderState.exercises[index];
    if (!ex) return;

    const currentSets = ex.sets || [];
    const baseW = (currentSets[0]?.weight) || 20;
    const baseR = (currentSets[0]?.reps) || 10;

    const newSets = [];
    for (let i = 0; i < numSets; i++) {
      newSets.push({
        weight: currentSets[i]?.weight !== undefined ? currentSets[i].weight : baseW,
        reps: currentSets[i]?.reps !== undefined ? currentSets[i].reps : baseR
      });
    }
    ex.sets = newSets;
    this.renderRoutineEditorList();
  },

  updateRoutineBuilderExerciseField(index, field, value) {
    const ex = this.routineBuilderState.exercises[index];
    if (!ex || !ex.sets) return;

    const numVal = Number(value) || 0;
    ex.sets.forEach(s => {
      s[field] = numVal;
    });
  },

  saveRoutineFromEditor() {
    const name = document.getElementById('routineEditorNameInput').value.trim();
    const icon = document.getElementById('routineEditorIconInput').value.trim() || '🔥';
    const category = document.getElementById('routineEditorCategorySelect').value;

    if (!name) {
      App.showToast('Introduce un nombre para la rutina', 'error');
      return;
    }

    if (!this.routineBuilderState.exercises || this.routineBuilderState.exercises.length === 0) {
      App.showToast('Añade al menos un ejercicio a la rutina', 'error');
      return;
    }

    const routineToSave = {
      id: this.routineBuilderState.id || ('routine_' + Date.now()),
      name,
      icon,
      category,
      exercises: this.routineBuilderState.exercises
    };

    Storage.saveCustomRoutine(routineToSave);
    App.closeModal('routineEditorModal');
    App.showToast(`Rutina "${name}" guardada con éxito`, 'success');

    // Refrescar lista en el organizador
    this.renderOrganizerRoutinesList();
  },

  deleteExercise(exerciseId) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.removeGymExercise(activeDate, exerciseId);
    this.render();
    if (window.Dashboard) Dashboard.render();
    App.showToast('Ejercicio eliminado', 'info');
  },

  playTimerBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // La5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15); // La6

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);

      // Segundo tono confirmatorio
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1320, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}
      }, 180);
    } catch (e) {
      console.log('AudioContext not allowed or not supported yet');
    }
  },

  // --- CRONÓMETRO DE DESCANSO FLOTANTE ---
  startRestTimer(seconds = 90) {
    this.restTimerSeconds = seconds;
    this.restTimerTotal = seconds;
    this.isTimerRunning = true;

    const bar = document.getElementById('restTimerBar');
    if (bar) bar.classList.add('visible');

    this.updateTimerDisplay();

    if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    this.restTimerInterval = setInterval(() => {
      if (this.restTimerSeconds > 0) {
        this.restTimerSeconds--;
        this.updateTimerDisplay();
      } else {
        this.stopRestTimer();
        this.playTimerBeep();
        App.showToast('🔔 ¡Tiempo de descanso completado! A por la siguiente serie 💪', 'success');
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const display = document.getElementById('restTimerDigits');
    if (!display) return;
    const mins = Math.floor(this.restTimerSeconds / 60);
    const secs = this.restTimerSeconds % 60;
    display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  addTimerSeconds(secs = 30) {
    this.restTimerSeconds += secs;
    this.updateTimerDisplay();
  },

  stopRestTimer() {
    if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    this.isTimerRunning = false;
    const bar = document.getElementById('restTimerBar');
    if (bar) bar.classList.remove('visible');
  }
};

window.Gym = Gym;
