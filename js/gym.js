/**
 * Fit360 - Gym & Weights Tracking Module
 */
const Gym = {
  currentCategoryFilter: 'all',
  restTimerInterval: null,
  restTimerSeconds: 60,
  restTimerTotal: 60,
  isTimerRunning: false,

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

  render() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const exercises = dayData.gym || [];

    const container = document.getElementById('gymExercisesList');
    if (!container) return;

    const countBadge = document.getElementById('gymTotalExercises');
    if (countBadge) countBadge.innerText = `${exercises.length} Ejercicios`;

    let totalSets = 0;
    let totalVolume = 0;
    exercises.forEach(e => {
      (e.sets || []).forEach(s => {
        if (s.completed) {
          totalSets++;
          totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
        }
      });
    });

    const setsBadge = document.getElementById('gymTotalSets');
    if (setsBadge) setsBadge.innerText = `${totalSets} Series`;

    const volumeBadge = document.getElementById('gymTotalVolume');
    if (volumeBadge) volumeBadge.innerText = `${totalVolume.toLocaleString()} kg`;

    if (exercises.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🏋️‍♂️</div>
          <h3 style="font-size: 1.15rem; margin-bottom: 6px;">Sin ejercicios registrados hoy</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 20px;">
            Añade tus ejercicios de pesas, personaliza las columnas/KPIs y registra tus series.
          </p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="Gym.openAddExerciseModal()">
              + Añadir Ejercicio
            </button>
            <button class="btn btn-energy btn-sm" onclick="Gym.openCustomExerciseCreatorModal()">
              ⚡ Crear Ejercicio con KPIs
            </button>
          </div>
        </div>
      `;
      return;
    }

    let html = '';
    exercises.forEach((ex) => {
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
                    onchange="Gym.updateSetField('${ex.id}', ${sIdx}, '${c.id}', this.value)">
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

  updateSetField(exerciseId, setIdx, field, value) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const ex = (dayData.gym || []).find(e => e.id === exerciseId);
    if (!ex || !ex.sets || !ex.sets[setIdx]) return;

    const numVal = Number(value);
    ex.sets[setIdx][field] = (!isNaN(numVal) && value.trim() !== '') ? numVal : value;
    Storage.updateGymExercise(activeDate, exerciseId, { sets: ex.sets });
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

  openRoutinesModal() {
    const container = document.getElementById('routinesModalList');
    if (!container) return;

    container.innerHTML = WORKOUT_ROUTINES_TEMPLATES.map(r => `
      <div class="card" style="margin-bottom: 10px; cursor: pointer; transition: border-color 0.2s;" 
        onclick="Gym.loadRoutineTemplate('${r.id}')"
        onmouseover="this.style.borderColor='var(--accent-cyan)'" 
        onmouseout="this.style.borderColor='var(--glass-border)'">
        <div class="flex-between">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.6rem;">${r.icon}</span>
            <div>
              <h4 style="font-size: 0.95rem;">${r.name}</h4>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                ${r.exercises.length} ejercicios planificados
              </p>
            </div>
          </div>
          <button class="pill pill-cyan">Cargar ›</button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
          ${r.exercises.map(e => `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: var(--radius-xs); color: var(--text-secondary);">${e.name}</span>`).join('')}
        </div>
      </div>
    `).join('');

    App.openModal('routinesModal');
  },

  loadRoutineTemplate(routineId) {
    const routine = WORKOUT_ROUTINES_TEMPLATES.find(r => r.id === routineId);
    if (!routine) return;

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);

    if (!dayData.gym) dayData.gym = [];

    // Añadir ejercicios de la plantilla
    routine.exercises.forEach((ex, idx) => {
      dayData.gym.push({
        id: 'gym_' + (Date.now() + idx),
        name: ex.name,
        category: ex.category,
        notes: `Rutina: ${routine.name}`,
        sets: ex.sets.map((s, sIdx) => ({
          setNum: sIdx + 1,
          weight: s.weight,
          reps: s.reps,
          completed: false
        }))
      });
    });

    Storage.saveDayData(activeDate, dayData);
    App.closeModal('routinesModal');
    App.showToast(`Rutina "${routine.name}" cargada con éxito`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
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
