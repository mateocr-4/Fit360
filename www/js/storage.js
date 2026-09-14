/**
 * Fit360 - Storage Manager (Persistencia en LocalStorage)
 */
const Storage = {
  KEYS: {
    SETTINGS: 'fit360_settings',
    DATA: 'fit360_daily_data',
    FAVORITES: 'fit360_favorites',
    MUSCLE_GROUPS: 'fit360_muscle_groups',
    CUSTOM_EXERCISES: 'fit360_custom_exercises',
    WEIGHT_LOGS: 'fit360_weight_logs'
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
      }
    };
  },

  // Inicializar almacenamiento
  init() {
    if (!localStorage.getItem(this.KEYS.SETTINGS)) {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(this.getDefaultSettings()));
    }

    if (!localStorage.getItem(this.KEYS.DATA)) {
      this.seedInitialData();
    }

    if (!localStorage.getItem(this.KEYS.WEIGHT_LOGS)) {
      this.seedInitialWeightLogs();
    }
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
      const settings = this.getSettings();
      return {
        weight: settings.profile?.weight || 76,
        fatPct: 14.5,
        date: this.formatDate(),
        time: '08:00',
        source: 'manual',
        timing: 'fasting'
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
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.data) this.saveAllDailyData(parsed.data);
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
  }
};

window.Storage = Storage;
