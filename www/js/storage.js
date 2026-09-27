/**
 * Fit360 - Storage Manager (Persistencia en LocalStorage)
 */
var Storage = {
  KEYS: {
    SETTINGS: 'fit360_settings',
    DATA: 'fit360_daily_data',
    FAVORITES: 'fit360_favorites',
    MUSCLE_GROUPS: 'fit360_muscle_groups',
    CUSTOM_EXERCISES: 'fit360_custom_exercises',
    WEIGHT_LOGS: 'fit360_weight_logs',
    ROUTINES: 'fit360_custom_routines',
    FRIENDS: 'fit360_friends',
    RECIPES: 'fit360_custom_recipes',
    MY_FIT_ID: 'fit360_my_fit_id'
  },

  // Grupos musculares por defecto
  DEFAULT_MUSCLE_GROUPS: [
    { id: 'pecho', name: 'Pecho', icon: '🏋️‍♂️' },
    { id: 'espalda', name: 'Espalda', icon: '🚣‍♂️' },
    { id: 'piernas', name: 'Piernas', icon: '🦵' },
    { id: 'hombros', name: 'Hombros', icon: '🛡️' },
    { id: 'brazos', name: 'Brazos', icon: '💪' },
    { id: 'core', name: 'Core / Abdomen', icon: '⚡' }
  ],

  // Obtener fecha en formato YYYY-MM-DD
  formatDate(date = new Date()) {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [
      year,
      month.padStart(2, '0'),
      day.padStart(2, '0')
    ].join('-');
  },

  // Ajustes por defecto
  getDefaultSettings() {
    return {
      profile: {
        name: 'Mateo',
        weight: 76, // kg
        height: 178 // cm
      },
      goals: {
        kcal: 2350,
        protein: 165, // g
        carbs: 265, // g
        fat: 65, // g
        appleMoveKcal: 650, // Objetivo Kcal activas de Apple Fitness
        appleExerciseMin: 30, // Minutos de ejercicio
        appleStandHours: 12, // Horas de pie
        water: 2500 // ml
      },
      dashboardWidgets: {
        order: ['calories', 'appleFitness', 'weight', 'workouts', 'weeklyChart'],
        hidden: []
      }
    };
  },

  // Inicializar almacenamiento
  init() {
    if (!localStorage.getItem(this.KEYS.SETTINGS)) {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(this.getDefaultSettings()));
    }

    // Migración limpia v2: si el dispositivo tiene datos de prueba simulados anteriores, limpiarlos a 0
    const cleanInitKey = 'fit360_clean_init_v2';
    if (!localStorage.getItem(cleanInitKey)) {
      const existingWeight = localStorage.getItem(this.KEYS.WEIGHT_LOGS) || '';
      if (existingWeight.includes('w_seed_')) {
        localStorage.setItem(this.KEYS.WEIGHT_LOGS, JSON.stringify([]));
      }
      const existingData = localStorage.getItem(this.KEYS.DATA) || '';
      if (existingData.includes('f1_') || existingData.includes('Pechuga de pollo')) {
        localStorage.setItem(this.KEYS.DATA, JSON.stringify({}));
      }
      localStorage.setItem(cleanInitKey, 'true');
    }

    // Asegurar estructura limpia vacía a 0
    if (!localStorage.getItem(this.KEYS.DATA)) {
      localStorage.setItem(this.KEYS.DATA, JSON.stringify({}));
    }

    if (!localStorage.getItem(this.KEYS.WEIGHT_LOGS)) {
      localStorage.setItem(this.KEYS.WEIGHT_LOGS, JSON.stringify([]));
    }
  },

  // Vaciar completamente todos los registros a 0 (inicio limpio)
  clearAllDataToZero() {
    localStorage.setItem(this.KEYS.DATA, JSON.stringify({}));
    localStorage.setItem(this.KEYS.WEIGHT_LOGS, JSON.stringify([]));
    localStorage.setItem('fit360_clean_init_v2', 'true');
  },

  // Cargar Ajustes
  getSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch (e) {
      return this.getDefaultSettings();
    }
  },

  // Guardar Ajustes
  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- DASHBOARD WIDGETS CONFIG ---
  getDefaultWidgets() {
    return {
      order: ['calories', 'appleFitness', 'weight', 'workouts', 'weeklyChart'],
      hidden: []
    };
  },

  getDashboardWidgets() {
    const settings = this.getSettings();
    return settings.dashboardWidgets || this.getDefaultWidgets();
  },

  saveDashboardWidgets(config) {
    const settings = this.getSettings();
    settings.dashboardWidgets = config;
    this.saveSettings(settings);
  },

  // --- MÉTODOS DE GRUPOS MUSCULARES ---
  getMuscleGroups() {
    try {
      const data = localStorage.getItem(this.KEYS.MUSCLE_GROUPS);
      return data ? JSON.parse(data) : this.DEFAULT_MUSCLE_GROUPS;
    } catch (e) {
      return this.DEFAULT_MUSCLE_GROUPS;
    }
  },

  saveMuscleGroups(groups) {
    localStorage.setItem(this.KEYS.MUSCLE_GROUPS, JSON.stringify(groups));
  },

  addMuscleGroup(name, icon = '💪') {
    const groups = this.getMuscleGroups();
    const id = 'mg_' + Date.now();
    const newGroup = { id, name: name.trim(), icon: icon.trim() || '💪' };
    groups.push(newGroup);
    this.saveMuscleGroups(groups);
    return newGroup;
  },

  deleteMuscleGroup(groupId) {
    const groups = this.getMuscleGroups().filter(g => g.id !== groupId);
    this.saveMuscleGroups(groups);
  },

  // --- MÉTODOS DE DEFINICIONES DE EJERCICIOS PERSONALIZADOS ---
  getCustomExercises() {
    try {
      const data = localStorage.getItem(this.KEYS.CUSTOM_EXERCISES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCustomExerciseDef(exerciseDef) {
    const list = this.getCustomExercises();
    exerciseDef.id = exerciseDef.id || ('custom_ex_' + Date.now());
    const existingIdx = list.findIndex(e => e.id === exerciseDef.id);
    if (existingIdx >= 0) {
      list[existingIdx] = exerciseDef;
    } else {
      list.push(exerciseDef);
    }
    localStorage.setItem(this.KEYS.CUSTOM_EXERCISES, JSON.stringify(list));
    return exerciseDef;
  },

  // Obtener todos los datos diarios
  getAllDailyData() {
    try {
      const data = localStorage.getItem(this.KEYS.DATA);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  // Guardar todos los datos diarios
  saveAllDailyData(allData) {
    localStorage.setItem(this.KEYS.DATA, JSON.stringify(allData));
  },

  // Obtener datos para un día concreto (YYYY-MM-DD)
  getDayData(dateStr) {
    const all = this.getAllDailyData();
    if (!all[dateStr]) {
      return {
        date: dateStr,
        nutrition: {
          desayuno: [],
          almuerzo: [],
          merienda: [],
          cena: [],
          snacks: []
        },
        appleFitness: {
          activeKcal: 0,
          steps: 0,
          exerciseTime: 0,
          lastSync: null
        },
        gym: [],
        cardio: []
      };
    }
    return all[dateStr];
  },

  // Guardar datos de un día concreto
  saveDayData(dateStr, dayData) {
    const all = this.getAllDailyData();
    all[dateStr] = dayData;
    this.saveAllDailyData(all);
  },

  // --- MÉTODOS DE NUTRICIÓN ---
  addFoodItem(dateStr, mealType, foodItem) {
    const day = this.getDayData(dateStr);
    if (!day.nutrition[mealType]) {
      day.nutrition[mealType] = [];
    }
    foodItem.id = 'food_' + Date.now();
    day.nutrition[mealType].push(foodItem);
    this.saveDayData(dateStr, day);
    return foodItem;
  },

  removeFoodItem(dateStr, mealType, foodId) {
    const day = this.getDayData(dateStr);
    if (day.nutrition[mealType]) {
      day.nutrition[mealType] = day.nutrition[mealType].filter(item => item.id !== foodId);
      this.saveDayData(dateStr, day);
    }
  },

  // --- MÉTODOS DE APPLE FITNESS ---
  updateAppleFitness(dateStr, fitnessData) {
    const day = this.getDayData(dateStr);
    day.appleFitness = {
      ...day.appleFitness,
      ...fitnessData,
      lastSync: new Date().toISOString()
    };
    this.saveDayData(dateStr, day);
    return day.appleFitness;
  },

  // --- MÉTODOS DE BÁSCULA DIGITAL & PESO CORPORAL (RENPHO / APPLE SALUD) ---
  getWeightLogs() {
    try {
      const data = localStorage.getItem(this.KEYS.WEIGHT_LOGS);
      const logs = data ? JSON.parse(data) : [];
      return logs.sort((a, b) => new Date(`${a.date}T${a.time || '08:00:00'}`) - new Date(`${b.date}T${b.time || '08:00:00'}`));
    } catch (e) {
      return [];
    }
  },

  saveWeightLog(logData) {
    const logs = this.getWeightLogs();
    const id = logData.id || 'w_' + Date.now();
    const weight = Number(logData.weight) || 75;
    const fatPct = logData.fatPct ? Number(logData.fatPct) : null;
    const musclePct = logData.musclePct ? Number(logData.musclePct) : null;
    const date = logData.date || this.formatDate();
    const time = logData.time || new Date().toTimeString().slice(0, 5);
    const timing = logData.timing || 'fasting'; // fasting, post_workout, night, normal
    const source = logData.source || 'manual'; // renpho_health, renpho_csv, manual
    const notes = logData.notes || '';

    const existingIdx = logs.findIndex(l => l.id === id);
    const entry = { id, date, time, weight, fatPct, musclePct, timing, source, notes, timestamp: new Date().toISOString() };

    if (existingIdx !== -1) {
      logs[existingIdx] = entry;
    } else {
      logs.push(entry);
    }

    logs.sort((a, b) => new Date(`${a.date}T${a.time || '08:00:00'}`) - new Date(`${b.date}T${b.time || '08:00:00'}`));
    localStorage.setItem(this.KEYS.WEIGHT_LOGS, JSON.stringify(logs));

    // Actualizar perfil de usuario automáticamente con el peso más reciente
    const latest = logs[logs.length - 1];
    if (latest && latest.weight) {
      const settings = this.getSettings();
      if (settings.profile) {
        settings.profile.weight = latest.weight;
        this.saveSettings(settings);
      }
    }

    return entry;
  },

  deleteWeightLog(logId) {
    const logs = this.getWeightLogs().filter(l => l.id !== logId);
    localStorage.setItem(this.KEYS.WEIGHT_LOGS, JSON.stringify(logs));
  },

  getLatestWeightLog() {
    const logs = this.getWeightLogs();
    if (logs.length === 0) {
      return {
        weight: '--',
        fatPct: null,
        date: '--',
        time: '',
        source: 'none',
        timing: ''
      };
    }
    return logs[logs.length - 1];
  },

  getWeightDifference() {
    const logs = this.getWeightLogs();
    if (logs.length < 2) {
      return { diff: 0, trend: 'neutral', prevWeight: null };
    }
    const current = logs[logs.length - 1].weight;
    const previous = logs[logs.length - 2].weight;
    const diff = Number((current - previous).toFixed(2));
    let trend = 'neutral';
    if (diff < 0) trend = 'down';
    else if (diff > 0) trend = 'up';
    return { diff, trend, prevWeight: previous };
  },

  seedInitialWeightLogs() {
    const today = new Date();
    const logs = [];
    const sampleWeights = [77.5, 77.2, 77.0, 76.8, 76.9, 76.6, 76.4, 76.5, 76.2, 76.0];
    const sampleFats = [15.2, 15.1, 15.0, 14.9, 14.9, 14.7, 14.6, 14.6, 14.5, 14.4];

    for (let i = 0; i < sampleWeights.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (sampleWeights.length - 1 - i) * 2);
      const dateStr = this.formatDate(d);
      logs.push({
        id: 'w_seed_' + i,
        date: dateStr,
        time: '07:45',
        weight: sampleWeights[i],
        fatPct: sampleFats[i],
        musclePct: 41.2,
        timing: 'fasting',
        source: 'renpho_health',
        notes: 'Sincronizado desde Renpho (En ayunas)',
        timestamp: d.toISOString()
      });
    }
    localStorage.setItem(this.KEYS.WEIGHT_LOGS, JSON.stringify(logs));
  },

  // --- MÉTODOS DE GYM ---
  addGymExercise(dateStr, exerciseData) {
    const day = this.getDayData(dateStr);
    if (!day.gym) day.gym = [];
    
    exerciseData.id = 'gym_' + Date.now();
    if (!exerciseData.sets) {
      exerciseData.sets = [
        { setNum: 1, weight: exerciseData.defaultWeight || 50, reps: exerciseData.defaultReps || 10, completed: true }
      ];
    }
    day.gym.push(exerciseData);
    this.saveDayData(dateStr, day);
    return exerciseData;
  },

  updateGymExercise(dateStr, exerciseId, updatedData) {
    const day = this.getDayData(dateStr);
    const index = day.gym.findIndex(e => e.id === exerciseId);
    if (index !== -1) {
      day.gym[index] = { ...day.gym[index], ...updatedData };
      this.saveDayData(dateStr, day);
    }
  },

  removeGymExercise(dateStr, exerciseId) {
    const day = this.getDayData(dateStr);
    day.gym = (day.gym || []).filter(e => e.id !== exerciseId);
    this.saveDayData(dateStr, day);
  },

  reorderGymExercises(dateStr, fromIndex, toIndex) {
    const day = this.getDayData(dateStr);
    if (!day.gym || fromIndex < 0 || toIndex < 0 || fromIndex >= day.gym.length || toIndex >= day.gym.length) {
      return;
    }
    const [moved] = day.gym.splice(fromIndex, 1);
    day.gym.splice(toIndex, 0, moved);
    this.saveDayData(dateStr, day);
    return day.gym;
  },

  setGymExercises(dateStr, exercisesList) {
    const day = this.getDayData(dateStr);
    day.gym = exercisesList || [];
    this.saveDayData(dateStr, day);
    return day.gym;
  },

  getPreviousGymSessionVolume(currentDateStr) {
    try {
      const allData = this.getAllDailyData();
      const validDates = Object.keys(allData)
        .filter(d => d < currentDateStr && allData[d]?.gym && allData[d].gym.length > 0)
        .sort((a, b) => b.localeCompare(a)); // Más reciente primero

      if (validDates.length === 0) return null;

      const prevDate = validDates[0];
      const prevGym = allData[prevDate].gym || [];

      let volume = 0;
      let totalSets = 0;
      let completedSets = 0;
      let totalReps = 0;

      prevGym.forEach(ex => {
        (ex.sets || []).forEach(s => {
          totalSets++;
          const w = Number(s.weight) || 0;
          const r = Number(s.reps) || 0;
          volume += w * r;
          totalReps += r;
          if (s.completed) completedSets++;
        });
      });

      return {
        date: prevDate,
        volume,
        totalSets,
        completedSets,
        totalReps,
        exerciseCount: prevGym.length
      };
    } catch (e) {
      console.error('Error calculando volumen anterior:', e);
      return null;
    }
  },

  // --- MÉTODOS DE PLANTILLAS Y RUTINAS PERSONALIZADAS ---
  getCustomRoutines() {
    try {
      const data = localStorage.getItem(this.KEYS.ROUTINES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCustomRoutine(routine) {
    const routines = this.getCustomRoutines();
    routine.id = routine.id || ('routine_' + Date.now());
    routine.isCustom = true;
    routine.updatedAt = new Date().toISOString();

    const idx = routines.findIndex(r => r.id === routine.id);
    if (idx >= 0) {
      routines[idx] = routine;
    } else {
      routines.unshift(routine);
    }

    localStorage.setItem(this.KEYS.ROUTINES, JSON.stringify(routines));
    return routine;
  },

  deleteCustomRoutine(routineId) {
    const routines = this.getCustomRoutines().filter(r => r.id !== routineId);
    localStorage.setItem(this.KEYS.ROUTINES, JSON.stringify(routines));
  },

  getAllRoutines() {
    const custom = this.getCustomRoutines().map(r => ({ ...r, isCustom: true }));
    const standard = (window.WORKOUT_ROUTINES_TEMPLATES || []).map(r => ({ ...r, isCustom: false }));
    return [...custom, ...standard];
  },

  // --- MÉTODOS DE CARDIO ---
  addCardioSession(dateStr, sessionData) {
    const day = this.getDayData(dateStr);
    if (!day.cardio) day.cardio = [];

    sessionData.id = 'cardio_' + Date.now();
    sessionData.timestamp = new Date().toISOString();
    day.cardio.push(sessionData);
    this.saveDayData(dateStr, day);
    return sessionData;
  },

  removeCardioSession(dateStr, sessionId) {
    const day = this.getDayData(dateStr);
    day.cardio = (day.cardio || []).filter(s => s.id !== sessionId);
    this.saveDayData(dateStr, day);
  },

  // --- CÁLCULO DE TOTALES NUTRICIONALES ---
  calculateNutritionTotals(dayData) {
    let totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    if (!dayData || !dayData.nutrition) return totals;

    Object.values(dayData.nutrition).forEach(mealList => {
      if (Array.isArray(mealList)) {
        mealList.forEach(item => {
          totals.kcal += Number(item.kcal) || 0;
          totals.protein += Number(item.protein) || 0;
          totals.carbs += Number(item.carbs) || 0;
          totals.fat += Number(item.fat) || 0;
        });
      }
    });

    totals.kcal = Math.round(totals.kcal);
    totals.protein = Math.round(totals.protein);
    totals.carbs = Math.round(totals.carbs);
    totals.fat = Math.round(totals.fat);

    return totals;
  },

  // --- CÁLCULO DE CALORÍAS QUEMADAS TOTALES ---
  calculateCardioTotals(dayData) {
    let totalKcal = 0;
    let totalMinutes = 0;
    let totalDistance = 0;

    if (dayData && Array.isArray(dayData.cardio)) {
      dayData.cardio.forEach(c => {
        totalKcal += Number(c.kcal) || 0;
        totalMinutes += Number(c.duration) || 0;
        totalDistance += Number(c.distance) || 0;
      });
    }

    return {
      kcal: Math.round(totalKcal),
      minutes: Math.round(totalMinutes),
      distance: Math.round(totalDistance * 10) / 10
    };
  },

  // Exportar copia de seguridad en JSON
  exportData() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      data: this.getAllDailyData()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fit360_Backup_${this.formatDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Importar copia de seguridad
  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate schema before importing (prevents malicious payloads)
      if (window.Security) {
        const validation = Security.validateImportData(parsed);
        if (!validation.valid) {
          console.error('Import validation failed:', validation.error);
          if (window.App && App.showToast) {
            App.showToast(validation.error, 'error');
          }
          return false;
        }
        // Deep-sanitize all strings to prevent stored XSS via imported data
        const sanitized = Security.deepSanitizeStrings(parsed);
        if (sanitized.settings) this.saveSettings(sanitized.settings);
        if (sanitized.data) this.saveAllDailyData(sanitized.data);
      } else {
        // Fallback without Security module
        if (parsed.settings) this.saveSettings(parsed.settings);
        if (parsed.data) this.saveAllDailyData(parsed.data);
      }

      return true;
    } catch (e) {
      console.error('Error importando datos:', e);
      return false;
    }
  },

  // Generar datos semilla para los últimos 7 días
  seedInitialData() {
    const allData = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = this.formatDate(d);

      // Variaciones realistas
      const isToday = i === 0;
      allData[dateKey] = {
        date: dateKey,
        nutrition: {
          desayuno: [
            { id: 'f1_' + i, name: 'Tortilla 3 huevos + Avena (60g)', kcal: 440, protein: 32, carbs: 42, fat: 16 }
          ],
          almuerzo: [
            { id: 'f2_' + i, name: 'Pechuga de pollo a la plancha (200g)', kcal: 330, protein: 62, carbs: 0, fat: 7 },
            { id: 'f3_' + i, name: 'Arroz blanco jazmín cocido (200g)', kcal: 260, protein: 5, carbs: 56, fat: 1 },
            { id: 'f4_' + i, name: 'Aceite de oliva virgen extra (10g)', kcal: 88, protein: 0, carbs: 0, fat: 10 }
          ],
          merienda: [
            { id: 'f5_' + i, name: 'Batido de Proteína Whey Isolate + Plátano', kcal: 245, protein: 26, carbs: 30, fat: 2 }
          ],
          cena: [
            { id: 'f6_' + i, name: 'Salmón noruego fresco al horno (180g)', kcal: 380, protein: 36, carbs: 0, fat: 24 },
            { id: 'f7_' + i, name: 'Boniato / Patata asada (150g)', kcal: 140, protein: 3, carbs: 32, fat: 0 }
          ],
          snacks: isToday ? [] : [
            { id: 'f8_' + i, name: 'Yogur griego natural 0% + Nueces', kcal: 180, protein: 15, carbs: 8, fat: 10 }
          ]
        },
        appleFitness: {
          activeKcal: isToday ? 540 : 610 + (i % 3) * 45,
          steps: isToday ? 8200 : 9800 + (i * 250),
          exerciseTime: isToday ? 48 : 55,
          lastSync: new Date().toISOString()
        },
        gym: [
          {
            id: 'g1_' + i,
            name: i % 2 === 0 ? 'Press de Banca Plano con Barra' : 'Sentadilla Trasera con Barra',
            category: i % 2 === 0 ? 'Pecho' : 'Piernas',
            notes: 'Sensaciones excelentes, buena sobrecarga progresiva',
            sets: [
              { setNum: 1, weight: i % 2 === 0 ? 75 : 90, reps: 10, completed: true },
              { setNum: 2, weight: i % 2 === 0 ? 80 : 95, reps: 8, completed: true },
              { setNum: 3, weight: i % 2 === 0 ? 82.5 : 100, reps: 6, completed: true },
              { setNum: 4, weight: i % 2 === 0 ? 82.5 : 100, reps: 6, completed: true }
            ]
          },
          {
            id: 'g2_' + i,
            name: i % 2 === 0 ? 'Cruces en Polea (Aperturas)' : 'Prensa Inclinada 45°',
            category: i % 2 === 0 ? 'Pecho' : 'Piernas',
            notes: 'Congestión máxima en la última serie',
            sets: [
              { setNum: 1, weight: i % 2 === 0 ? 15 : 160, reps: 12, completed: true },
              { setNum: 2, weight: i % 2 === 0 ? 17.5 : 180, reps: 10, completed: true },
              { setNum: 3, weight: i % 2 === 0 ? 20 : 200, reps: 8, completed: true }
            ]
          }
        ],
        cardio: [
          {
            id: 'c1_' + i,
            type: 'elliptical',
            title: 'Elíptica HIIT & Resistencia',
            duration: 25,
            resistance: 12,
            distance: 3.8,
            speed: 0,
            incline: 0,
            kcal: 260,
            notes: 'Resistencia moderada-alta, cadencia constante 65-70 rpm'
          },
          {
            id: 'c2_' + i,
            type: 'treadmill',
            title: 'Cinta Inclinada (Fat Burn Walk)',
            duration: 20,
            resistance: 0,
            distance: 1.8,
            speed: 5.5,
            incline: 8.5,
            kcal: 195,
            notes: 'Caminata a 5.5 km/h con inclinación del 8.5%'
          }
        ]
      };
    }

    this.saveAllDailyData(allData);
  },

  // --- AMIGOS & COMUNIDAD FIT360 ---
  getMyFitId() {
    let fitId = localStorage.getItem(this.KEYS.MY_FIT_ID);
    if (!fitId) {
      const name = (this.getSettings()?.profile?.name || 'MATEO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      const randNum = Math.floor(1000 + Math.random() * 9000);
      fitId = `FIT-${name || 'USER'}-${randNum}`;
      localStorage.setItem(this.KEYS.MY_FIT_ID, fitId);
    }
    return fitId;
  },

  DEFAULT_FRIENDS: [
    {
      id: 'friend_carlos_pro',
      name: 'Carlos Pro Trainer',
      avatar: '🏋️‍♂️',
      fitId: 'FIT-CARLOS-7742',
      tag: 'Entrenador Fuerza',
      bio: 'Especialista en fuerza, técnica limpia y recomposición corporal. 8 años entrenando atletas.',
      stats: { streak: 42, workouts: 320, followers: 1240 },
      routines: [
        {
          id: 'rt_carlos_torso_pesado',
          name: 'Torso Pesado Pro (Empuje + Tirón)',
          icon: '🔥',
          category: 'Fuerza',
          description: 'Rutina estrella de 5x5 y accesorios pesados para densidad en pecho y espalda.',
          exercises: [
            { name: 'Press de Banca Plano con Barra', category: 'Pecho', sets: [{ weight: 85, reps: 5, completed: false }, { weight: 90, reps: 5, completed: false }, { weight: 90, reps: 5, completed: false }, { weight: 95, reps: 4, completed: false }] },
            { name: 'Remo con Barra 90° / 45°', category: 'Espalda', sets: [{ weight: 75, reps: 6, completed: false }, { weight: 80, reps: 6, completed: false }, { weight: 85, reps: 5, completed: false }] },
            { name: 'Press Militar con Barra', category: 'Hombros', sets: [{ weight: 50, reps: 6, completed: false }, { weight: 55, reps: 6, completed: false }, { weight: 55, reps: 5, completed: false }] },
            { name: 'Dominadas Pronas / Neutras', category: 'Espalda', sets: [{ weight: 10, reps: 6, completed: false }, { weight: 10, reps: 6, completed: false }, { weight: 10, reps: 5, completed: false }] },
            { name: 'Cruces en Polea (Aperturas)', category: 'Pecho', sets: [{ weight: 17.5, reps: 12, completed: false }, { weight: 17.5, reps: 10, completed: false }] }
          ]
        },
        {
          id: 'rt_carlos_pierna_fuerza',
          name: 'Pierna & Glúteo Enfoque Fuerza',
          icon: '🦵',
          category: 'Hipertrofia',
          description: 'Sobrecarga en sentadilla y trabajo femoral profundo sin dolor lumbar.',
          exercises: [
            { name: 'Sentadilla Trasera con Barra', category: 'Piernas', sets: [{ weight: 100, reps: 6, completed: false }, { weight: 110, reps: 6, completed: false }, { weight: 115, reps: 5, completed: false }] },
            { name: 'Prensa Inclinada 45°', category: 'Piernas', sets: [{ weight: 180, reps: 10, completed: false }, { weight: 200, reps: 10, completed: false }, { weight: 220, reps: 8, completed: false }] },
            { name: 'Peso Muerto Rumano (Isquios)', category: 'Piernas', sets: [{ weight: 80, reps: 8, completed: false }, { weight: 85, reps: 8, completed: false }] },
            { name: 'Sentadilla Búlgara con Mancuernas', category: 'Piernas', sets: [{ weight: 20, reps: 10, completed: false }, { weight: 20, reps: 10, completed: false }] }
          ]
        }
      ],
      recipes: [
        {
          id: 'rc_carlos_batido_anabolico',
          name: 'Batido Hiperproteico Anabólico',
          icon: '🥤',
          servings: 1,
          time: '3 min',
          kcal: 465,
          protein: 48,
          carbs: 45,
          fat: 8,
          ingredients: [
            'Proteína Whey Isolate (40g)',
            'Copos de Avena (50g)',
            'Plátano maduro (1 unidad)',
            'Leche desnatada o vegetal (300ml)',
            'Canela de Ceilán (1 pizca)'
          ],
          instructions: 'Triturar todo a máxima potencia durante 45 segundos. Ideal 60 minutos antes o inmediatamente después de entrenar.'
        },
        {
          id: 'rc_carlos_arroz_ternera',
          name: 'Arroz Salteado con Ternera Magra y Huevo',
          icon: '🥩',
          servings: 1,
          time: '15 min',
          kcal: 590,
          protein: 52,
          carbs: 65,
          fat: 12,
          ingredients: [
            'Carne picada de ternera 95/5 (200g)',
            'Arroz blanco jazmín cocido (220g)',
            'Huevo entero a la plancha (1 unidad)',
            'Salsa de soja baja en sal (1 cda)',
            'AOVE (5g)'
          ],
          instructions: 'Dorar la carne en sartén antiadherente con ajo, añadir el arroz cocido y saltear con salsa de soja. Coronar con el huevo a la plancha.'
        }
      ]
    },
    {
      id: 'friend_elena_chef',
      name: 'Elena FitChef',
      avatar: '🥑',
      fitId: 'FIT-ELENA-3915',
      tag: 'Nutrición Deportiva',
      bio: 'Nutricionista y creadora de recetas saludables sin pasar hambre. Comida real que sabe a gloria.',
      stats: { streak: 75, workouts: 240, followers: 2890 },
      routines: [
        {
          id: 'rt_elena_gluteo_core',
          name: 'Glúteo & Core Esculpido',
          icon: '✨',
          category: 'Tono & Fuerza',
          description: 'Circuito de alta activación muscular sin impacto articular agresivo.',
          exercises: [
            { name: 'Hip Thrust con Barra', category: 'Piernas', sets: [{ weight: 80, reps: 12, completed: false }, { weight: 90, reps: 10, completed: false }, { weight: 95, reps: 10, completed: false }, { weight: 100, reps: 8, completed: false }] },
            { name: 'Sentadilla Búlgara con Mancuernas', category: 'Piernas', sets: [{ weight: 14, reps: 12, completed: false }, { weight: 16, reps: 10, completed: false }] },
            { name: 'Elevación de Piernas Colgado', category: 'Core', sets: [{ weight: 0, reps: 15, completed: false }, { weight: 0, reps: 15, completed: false }] },
            { name: 'Plancha Abdominal Isometrica', category: 'Core', sets: [{ weight: 0, reps: 60, completed: false }, { weight: 0, reps: 60, completed: false }] }
          ]
        },
        {
          id: 'rt_elena_fullbody_tono',
          name: 'Full Body Metabólico Express',
          icon: '⚡',
          category: 'Acondicionamiento',
          description: 'Diseñada para quemar calorías y tonificar en días de poco tiempo (30 min).',
          exercises: [
            { name: 'Sentadilla Trasera con Barra', category: 'Piernas', sets: [{ weight: 60, reps: 12, completed: false }, { weight: 65, reps: 10, completed: false }] },
            { name: 'Press Militar con Barra', category: 'Hombros', sets: [{ weight: 30, reps: 10, completed: false }, { weight: 35, reps: 8, completed: false }] },
            { name: 'Jalón al Pecho en Polea', category: 'Espalda', sets: [{ weight: 45, reps: 12, completed: false }, { weight: 50, reps: 10, completed: false }] },
            { name: 'Elevaciones Laterales', category: 'Hombros', sets: [{ weight: 8, reps: 15, completed: false }, { weight: 8, reps: 15, completed: false }] }
          ]
        }
      ],
      recipes: [
        {
          id: 'rc_elena_tortitas_avena',
          name: 'Tortitas Proteicas de Avena y Claras',
          icon: '🥞',
          servings: 1,
          time: '8 min',
          kcal: 345,
          protein: 36,
          carbs: 38,
          fat: 4,
          ingredients: [
            'Claras de huevo (180g)',
            'Harina o copos de avena triturada (50g)',
            'Yogur griego 0% (50g)',
            'Esencia de vainilla y canela',
            'Frutos rojos frescos para decorar (40g)'
          ],
          instructions: 'Mezclar en batidora, verter en sartén a fuego medio hasta que salgan burbujas y dar la vuelta 1 minuto.'
        },
        {
          id: 'rc_elena_bowl_salmon_quinoa',
          name: 'Power Bowl Salmón, Quinoa & Aguacate',
          icon: '🥗',
          servings: 1,
          time: '12 min',
          kcal: 540,
          protein: 44,
          carbs: 42,
          fat: 21,
          ingredients: [
            'Salmón fresco a la plancha (160g)',
            'Quinoa cocida (150g)',
            'Aguacate maduro en láminas (60g)',
            'Espinacas frescas (50g)',
            'Semillas de sésamo y limón'
          ],
          instructions: 'Base de espinacas y quinoa tibia, colocar el salmón a la plancha desmenuzado, añadir aguacate y sazonar con limón y sésamo.'
        },
        {
          id: 'rc_elena_pudding_chia',
          name: 'Pudding de Chía & Yogur Frutos Rojos',
          icon: '🍓',
          servings: 1,
          time: '5 min prep',
          kcal: 265,
          protein: 24,
          carbs: 26,
          fat: 6,
          ingredients: [
            'Yogur griego 0% natural (180g)',
            'Semillas de chía (15g)',
            'Arándanos y fresas frescas (80g)',
            'Proteína Whey opcional (15g)'
          ],
          instructions: 'Mezclar el yogur con las semillas de chía y dejar reposar 20 min en la nevera. Añadir fruta fresca al servir.'
        }
      ]
    },
    {
      id: 'friend_david_lift',
      name: 'David Powerlifting',
      avatar: '⚡',
      fitId: 'FIT-DAVID-9081',
      tag: 'Powerlifter Jr',
      bio: 'Enfocado en las 3 disciplinas: Sentadilla, Banca y Peso Muerto. Sobrecarga progresiva pura.',
      stats: { streak: 30, workouts: 190, followers: 850 },
      routines: [
        {
          id: 'rt_david_banca_pesada',
          name: 'Press de Banca Pesado + Tríceps Bloqueo',
          icon: '🎯',
          category: 'Powerlifting',
          description: 'Esquema de fuerza para romper estancamientos en empuje horizontal.',
          exercises: [
            { name: 'Press de Banca Plano con Barra', category: 'Pecho', sets: [{ weight: 85, reps: 5, completed: false }, { weight: 92.5, reps: 3, completed: false }, { weight: 97.5, reps: 2, completed: false }, { weight: 102.5, reps: 1, completed: false }] },
            { name: 'Fondos en Paralelas (Pecho)', category: 'Pecho', sets: [{ weight: 15, reps: 8, completed: false }, { weight: 20, reps: 6, completed: false }] },
            { name: 'Press Francés / Rompecráneos', category: 'Brazos', sets: [{ weight: 32, reps: 8, completed: false }, { weight: 35, reps: 6, completed: false }] },
            { name: 'Extensiones de Tríceps en Polea', category: 'Brazos', sets: [{ weight: 35, reps: 12, completed: false }, { weight: 40, reps: 10, completed: false }] }
          ]
        },
        {
          id: 'rt_david_espalda_densidad',
          name: 'Espalda Densidad & Tracción Pesada',
          icon: '🚣‍♂️',
          category: 'Fuerza & Densidad',
          description: 'Construcción de base rocosa para sostener cargas máximas en peso muerto.',
          exercises: [
            { name: 'Peso Muerto Convencional', category: 'Espalda', sets: [{ weight: 120, reps: 5, completed: false }, { weight: 135, reps: 3, completed: false }, { weight: 145, reps: 2, completed: false }] },
            { name: 'Remo Gironda en Polea Baja', category: 'Espalda', sets: [{ weight: 60, reps: 10, completed: false }, { weight: 65, reps: 8, completed: false }, { weight: 70, reps: 8, completed: false }] },
            { name: 'Face Pull en Polea Alta', category: 'Espalda', sets: [{ weight: 25, reps: 15, completed: false }, { weight: 25, reps: 15, completed: false }] },
            { name: 'Curl de Bíceps con Barra Z', category: 'Brazos', sets: [{ weight: 34, reps: 8, completed: false }, { weight: 38, reps: 6, completed: false }] }
          ]
        }
      ],
      recipes: [
        {
          id: 'rc_david_pasta_pollo',
          name: 'Pasta Bolognesa Fit de Pollo Picado',
          icon: '🍝',
          servings: 1,
          time: '18 min',
          kcal: 670,
          protein: 58,
          carbs: 76,
          fat: 11,
          ingredients: [
            'Pasta integral o blanca (100g crudo)',
            'Pechuga de pollo limpia picada (220g)',
            'Tomate triturado natural (150g)',
            'Queso parmesano rallado (10g)',
            'Orégano, ajo y AOVE (5g)'
          ],
          instructions: 'Hervir pasta al dente. Saltear el pollo picado con especias, añadir tomate y reducir 8 minutos. Mezclar con la pasta y añadir parmesano.'
        }
      ]
    }
  ],

  // Métodos de Amigos
  getFriends() {
    try {
      const data = localStorage.getItem(this.KEYS.FRIENDS);
      if (!data) {
        localStorage.setItem(this.KEYS.FRIENDS, JSON.stringify(this.DEFAULT_FRIENDS));
        return this.DEFAULT_FRIENDS;
      }
      return JSON.parse(data);
    } catch (e) {
      return this.DEFAULT_FRIENDS;
    }
  },

  saveFriends(friendsList) {
    localStorage.setItem(this.KEYS.FRIENDS, JSON.stringify(friendsList));
  },

  addFriend(friendObj) {
    const friends = this.getFriends();
    friendObj.id = friendObj.id || ('friend_' + Date.now());
    friendObj.fitId = friendObj.fitId || (`FIT-${friendObj.name.toUpperCase().slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`);
    friendObj.avatar = friendObj.avatar || '👤';
    friendObj.routines = friendObj.routines || [];
    friendObj.recipes = friendObj.recipes || [];
    friendObj.addedAt = new Date().toISOString();

    const existingIdx = friends.findIndex(f => f.fitId === friendObj.fitId || f.id === friendObj.id);
    if (existingIdx >= 0) {
      friends[existingIdx] = { ...friends[existingIdx], ...friendObj };
    } else {
      friends.unshift(friendObj);
    }
    this.saveFriends(friends);
    return friendObj;
  },

  removeFriend(friendId) {
    const friends = this.getFriends().filter(f => f.id !== friendId && f.fitId !== friendId);
    this.saveFriends(friends);
  },

  getFriendById(idOrFitId) {
    const friends = this.getFriends();
    return friends.find(f => f.id === idOrFitId || f.fitId === idOrFitId) || null;
  },

  // --- MÉTODOS DE RECETAS PERSONALIZADAS ---
  DEFAULT_RECIPES: [
    {
      id: 'rc_default_bowl_avena',
      name: 'Bowl de Avena & Proteína Chocolate',
      icon: '🥣',
      mealType: 'desayuno',
      servings: 1,
      time: '5 min',
      ingredients: [
        { foodId: 'ref_18', name: 'Copos de Avena Integral', grams: 60, kcal: 225, protein: 8.1, carbs: 37.2, fat: 4.2 },
        { foodId: 'ref_42', name: 'Proteína Whey Isolate', grams: 30, kcal: 113, protein: 25.8, carbs: 0.8, fat: 0.5 },
        { foodId: 'ref_108', name: 'Leche de Almendras', grams: 200, kcal: 30, protein: 1.0, carbs: 0.6, fat: 2.2 },
        { foodId: 'ref_32', name: 'Plátano Maduro', grams: 60, kcal: 53, protein: 0.7, carbs: 13.7, fat: 0.2 }
      ],
      totals: { kcal: 421, protein: 35.6, carbs: 52.3, fat: 7.1 },
      perServing: { kcal: 421, protein: 35.6, carbs: 52.3, fat: 7.1 },
      instructions: 'Cocinar la avena con la bebida caliente 2 minutos. Retirar del fuego, mezclar con la proteína y añadir plátano en rodajas por encima.'
    },
    {
      id: 'rc_default_tortilla_claras',
      name: 'Tortilla Fitness de Claras',
      icon: '🍳',
      mealType: 'desayuno',
      servings: 1,
      time: '8 min',
      ingredients: [
        { foodId: 'ref_13', name: 'Claras de Huevo Pasteurizadas', grams: 200, kcal: 100, protein: 22.0, carbs: 1.4, fat: 0.4 },
        { foodId: 'ref_12', name: 'Huevo Entero', grams: 55, kcal: 80, protein: 7.2, carbs: 0.6, fat: 5.8 },
        { foodId: 'ref_27', name: 'Espinacas Frescas', grams: 50, kcal: 12, protein: 1.5, carbs: 0.7, fat: 0.2 },
        { foodId: 'ref_15', name: 'Queso Fresco Batido 0%', grams: 30, kcal: 14, protein: 2.6, carbs: 1.1, fat: 0 }
      ],
      totals: { kcal: 206, protein: 33.3, carbs: 3.8, fat: 6.4 },
      perServing: { kcal: 206, protein: 33.3, carbs: 3.8, fat: 6.4 },
      instructions: 'Batir las claras con el huevo entero. Saltear espinacas en sartén antiadherente, verter la mezcla y cocinar a fuego medio. Añadir queso fresco antes de doblar.'
    },
    {
      id: 'rc_default_tostadas_aguacate',
      name: 'Tostadas de Aguacate & Pavo',
      icon: '🥑',
      mealType: 'desayuno',
      servings: 1,
      time: '5 min',
      ingredients: [
        { foodId: 'ref_64', name: 'Pan de Molde Integral', grams: 70, kcal: 175, protein: 6.3, carbs: 30.1, fat: 2.5 },
        { foodId: 'ref_38', name: 'Aguacate Hass', grams: 60, kcal: 96, protein: 1.2, carbs: 5.1, fat: 8.8 },
        { foodId: 'ref_47', name: 'Pavo Fileteado', grams: 60, kcal: 63, protein: 11.1, carbs: 0.9, fat: 1.7 },
        { foodId: 'ref_69', name: 'Tomate Natural', grams: 80, kcal: 14, protein: 0.7, carbs: 2.8, fat: 0.2 }
      ],
      totals: { kcal: 348, protein: 19.3, carbs: 38.9, fat: 13.2 },
      perServing: { kcal: 348, protein: 19.3, carbs: 38.9, fat: 13.2 },
      instructions: 'Tostar el pan, aplastar el aguacate con un tenedor y extender. Añadir lonchas de pavo y tomate en rodajas. Sazonar con sal y pimienta.'
    },
    {
      id: 'rc_default_pollo_arroz_curry',
      name: 'Pollo al Curry con Arroz Basmati',
      icon: '🍛',
      mealType: 'almuerzo',
      servings: 1,
      time: '15 min',
      ingredients: [
        { foodId: 'ref_1', name: 'Pechuga de Pollo', grams: 200, kcal: 240, protein: 49.0, carbs: 0, fat: 4.2 },
        { foodId: 'ref_19', name: 'Arroz Blanco Cocido', grams: 200, kcal: 260, protein: 5.4, carbs: 57.0, fat: 0.6 },
        { foodId: 'ref_37', name: 'Aceite de Oliva Virgen Extra', grams: 5, kcal: 44, protein: 0, carbs: 0, fat: 5.0 },
        { foodId: 'ref_70', name: 'Cebolla', grams: 50, kcal: 20, protein: 0.6, carbs: 4.7, fat: 0.1 }
      ],
      totals: { kcal: 564, protein: 55.0, carbs: 61.7, fat: 9.9 },
      perServing: { kcal: 564, protein: 55.0, carbs: 61.7, fat: 9.9 },
      instructions: 'Dorar el pollo troceado con el aceite y cebolla picada. Añadir curry en polvo y cúrcuma. Servir junto con el arroz caliente.'
    },
    {
      id: 'rc_default_pasta_bolognesa',
      name: 'Pasta Boloñesa Fitness',
      icon: '🍝',
      mealType: 'almuerzo',
      servings: 2,
      time: '20 min',
      ingredients: [
        { foodId: 'ref_21', name: 'Pasta Integral Cocida', grams: 400, kcal: 560, protein: 22.0, carbs: 108.0, fat: 4.4 },
        { foodId: 'ref_3', name: 'Ternera Magra', grams: 250, kcal: 338, protein: 55.0, carbs: 0, fat: 12.0 },
        { foodId: 'ref_102', name: 'Salsa de Tomate Natural', grams: 150, kcal: 48, protein: 1.8, carbs: 8.3, fat: 0.8 },
        { foodId: 'ref_70', name: 'Cebolla', grams: 80, kcal: 32, protein: 0.9, carbs: 7.4, fat: 0.1 },
        { foodId: 'ref_37', name: 'Aceite de Oliva Virgen Extra', grams: 10, kcal: 88, protein: 0, carbs: 0, fat: 10.0 }
      ],
      totals: { kcal: 1066, protein: 79.7, carbs: 123.7, fat: 27.3 },
      perServing: { kcal: 533, protein: 39.9, carbs: 61.9, fat: 13.7 },
      instructions: 'Sofreír cebolla picada con aceite, añadir la ternera y dorar. Incorporar salsa de tomate y cocinar 10 min. Mezclar con la pasta cocida.'
    },
    {
      id: 'rc_default_ensalada_cesar',
      name: 'Ensalada Proteica César',
      icon: '🥗',
      mealType: 'almuerzo',
      servings: 1,
      time: '10 min',
      ingredients: [
        { foodId: 'ref_1', name: 'Pechuga de Pollo', grams: 150, kcal: 180, protein: 36.8, carbs: 0, fat: 3.2 },
        { foodId: 'ref_74', name: 'Lechuga Romana', grams: 120, kcal: 20, protein: 1.4, carbs: 2.4, fat: 0.4 },
        { foodId: 'ref_12', name: 'Huevo Entero (cocido)', grams: 55, kcal: 80, protein: 7.2, carbs: 0.6, fat: 5.8 },
        { foodId: 'ref_64', name: 'Pan Integral (picatostes)', grams: 25, kcal: 63, protein: 2.3, carbs: 10.8, fat: 0.9 },
        { foodId: 'ref_37', name: 'Aceite de Oliva Virgen Extra', grams: 8, kcal: 71, protein: 0, carbs: 0, fat: 8.0 }
      ],
      totals: { kcal: 414, protein: 47.7, carbs: 13.8, fat: 18.3 },
      perServing: { kcal: 414, protein: 47.7, carbs: 13.8, fat: 18.3 },
      instructions: 'Planchar el pollo y cortar en tiras. Montar la ensalada con lechuga, huevo cocido en cuartos, picatostes de pan integral tostado y aliñar con AOVE y limón.'
    },
    {
      id: 'rc_default_wrap_pavo',
      name: 'Wrap de Pavo & Hummus',
      icon: '🌯',
      mealType: 'merienda',
      servings: 1,
      time: '5 min',
      ingredients: [
        { foodId: 'ref_63', name: 'Tortilla de Trigo (Wrap)', grams: 65, kcal: 203, protein: 5.5, carbs: 33.8, fat: 5.2 },
        { foodId: 'ref_47', name: 'Pavo Fileteado', grams: 60, kcal: 63, protein: 11.1, carbs: 0.9, fat: 1.7 },
        { foodId: 'ref_84', name: 'Hummus Clásico', grams: 40, kcal: 66, protein: 3.2, carbs: 5.7, fat: 3.8 },
        { foodId: 'ref_74', name: 'Lechuga Romana', grams: 30, kcal: 5, protein: 0.4, carbs: 0.6, fat: 0.1 }
      ],
      totals: { kcal: 337, protein: 20.2, carbs: 41.0, fat: 10.8 },
      perServing: { kcal: 337, protein: 20.2, carbs: 41.0, fat: 10.8 },
      instructions: 'Extender el hummus sobre la tortilla, colocar el pavo y la lechuga. Enrollar bien apretado y cortar en diagonal.'
    },
    {
      id: 'rc_default_smoothie_tropical',
      name: 'Smoothie Proteico Tropical',
      icon: '🥤',
      mealType: 'merienda',
      servings: 1,
      time: '3 min',
      ingredients: [
        { foodId: 'ref_42', name: 'Proteína Whey Isolate', grams: 30, kcal: 113, protein: 25.8, carbs: 0.8, fat: 0.5 },
        { foodId: 'ref_32', name: 'Plátano Maduro', grams: 100, kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
        { foodId: 'ref_89', name: 'Mango', grams: 80, kcal: 48, protein: 0.6, carbs: 12.0, fat: 0.3 },
        { foodId: 'ref_107', name: 'Leche de Avena', grams: 250, kcal: 110, protein: 2.5, carbs: 16.3, fat: 3.8 }
      ],
      totals: { kcal: 360, protein: 30.0, carbs: 51.9, fat: 4.9 },
      perServing: { kcal: 360, protein: 30.0, carbs: 51.9, fat: 4.9 },
      instructions: 'Triturar todos los ingredientes en batidora con hielo hasta obtener textura cremosa. Servir inmediatamente.'
    },
    {
      id: 'rc_default_salmon_verduras',
      name: 'Salmón al Horno con Verduras',
      icon: '🐟',
      mealType: 'cena',
      servings: 1,
      time: '25 min',
      ingredients: [
        { foodId: 'ref_7', name: 'Salmón Fresco', grams: 180, kcal: 374, protein: 36.7, carbs: 0, fat: 24.3 },
        { foodId: 'ref_26', name: 'Brócoli', grams: 150, kcal: 51, protein: 4.2, carbs: 6.0, fat: 0.6 },
        { foodId: 'ref_25', name: 'Boniato / Batata', grams: 150, kcal: 132, protein: 2.7, carbs: 30.8, fat: 0.3 },
        { foodId: 'ref_37', name: 'Aceite de Oliva Virgen Extra', grams: 8, kcal: 71, protein: 0, carbs: 0, fat: 8.0 }
      ],
      totals: { kcal: 628, protein: 43.6, carbs: 36.8, fat: 33.2 },
      perServing: { kcal: 628, protein: 43.6, carbs: 36.8, fat: 33.2 },
      instructions: 'Precalentar horno a 200°C. Colocar el salmón con boniato cortado y brócoli en bandeja. Rociar con AOVE, sal, pimienta y limón. Hornear 20 min.'
    },
    {
      id: 'rc_default_revuelto_setas',
      name: 'Revuelto de Setas & Espárragos',
      icon: '🍄',
      mealType: 'cena',
      servings: 1,
      time: '10 min',
      ingredients: [
        { foodId: 'ref_12', name: 'Huevo Entero', grams: 110, kcal: 160, protein: 14.3, carbs: 1.1, fat: 11.6 },
        { foodId: 'ref_13', name: 'Claras de Huevo Pasteurizadas', grams: 100, kcal: 50, protein: 11.0, carbs: 0.7, fat: 0.2 },
        { foodId: 'ref_73', name: 'Champiñones / Setas', grams: 150, kcal: 33, protein: 4.7, carbs: 0.8, fat: 0.5 },
        { foodId: 'ref_28', name: 'Espárragos Verdes', grams: 100, kcal: 20, protein: 2.2, carbs: 2.0, fat: 0.2 },
        { foodId: 'ref_37', name: 'Aceite de Oliva Virgen Extra', grams: 5, kcal: 44, protein: 0, carbs: 0, fat: 5.0 }
      ],
      totals: { kcal: 307, protein: 32.2, carbs: 4.6, fat: 17.5 },
      perServing: { kcal: 307, protein: 32.2, carbs: 4.6, fat: 17.5 },
      instructions: 'Saltear champiñones y espárragos troceados con AOVE. Añadir huevos batidos con claras y revolver a fuego suave hasta cuajar. Sazonar con sal y ajo en polvo.'
    }
  ],

  getCustomRecipes() {
    try {
      const data = localStorage.getItem(this.KEYS.RECIPES);
      if (!data) {
        localStorage.setItem(this.KEYS.RECIPES, JSON.stringify(this.DEFAULT_RECIPES));
        return this.DEFAULT_RECIPES;
      }
      return JSON.parse(data);
    } catch (e) {
      return this.DEFAULT_RECIPES;
    }
  },

  saveCustomRecipe(recipe) {
    const recipes = this.getCustomRecipes();
    recipe.id = recipe.id || ('recipe_' + Date.now());
    recipe.updatedAt = new Date().toISOString();

    const idx = recipes.findIndex(r => r.id === recipe.id);
    if (idx >= 0) {
      recipes[idx] = recipe;
    } else {
      recipes.unshift(recipe);
    }
    localStorage.setItem(this.KEYS.RECIPES, JSON.stringify(recipes));
    return recipe;
  },

  deleteCustomRecipe(recipeId) {
    const recipes = this.getCustomRecipes().filter(r => r.id !== recipeId);
    localStorage.setItem(this.KEYS.RECIPES, JSON.stringify(recipes));
  },

  // --- CODIFICADOR & DECODIFICADOR SEGURO DE CONTENIDO COMPARTIDO ---
  encodeSharePayload(type, data) {
    const myProfile = this.getSettings()?.profile || {};
    const payload = {
      type: type, // 'routine' | 'recipe' | 'profile'
      v: '1.0',
      author: myProfile.name || 'Mateo',
      fitId: this.getMyFitId(),
      t: Date.now(),
      data: data
    };

    try {
      const jsonStr = JSON.stringify(payload);
      // UTF-8 friendly Base64 encoding
      const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
      const prefix = type === 'routine' ? 'FIT-RT-' : (type === 'recipe' ? 'FIT-RC-' : 'FIT-PF-');
      return prefix + encoded;
    } catch (e) {
      console.error('Error encoding share payload:', e);
      return null;
    }
  },

  decodeSharePayload(rawCode) {
    if (!rawCode || typeof rawCode !== 'string') return null;
    let cleanCode = rawCode.trim();

    // Eliminar posibles prefijos de URL o esquemas
    if (cleanCode.includes('#share=')) {
      cleanCode = cleanCode.split('#share=')[1];
    } else if (cleanCode.includes('?share=')) {
      cleanCode = cleanCode.split('?share=')[1].split('&')[0];
    }

    // Extraer base64 quitando prefijo FIT-RT- / FIT-RC- / FIT-PF-
    let b64 = cleanCode;
    if (cleanCode.startsWith('FIT-RT-')) b64 = cleanCode.replace('FIT-RT-', '');
    else if (cleanCode.startsWith('FIT-RC-')) b64 = cleanCode.replace('FIT-RC-', '');
    else if (cleanCode.startsWith('FIT-PF-')) b64 = cleanCode.replace('FIT-PF-', '');

    try {
      const decodedStr = decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const parsed = JSON.parse(decodedStr);
      if (parsed && (parsed.type || parsed.data)) {
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Error decoding share payload:', e);
      return null;
    }
  }
};

window.Storage = Storage;
window.FitStorage = Storage;

