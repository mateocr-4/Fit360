/**
 * Fit360 - Nutrition & Apple Fitness Module
 */
const Nutrition = {
  currentMealType: 'desayuno',
  selectedFoodBase: null,

  // Alimentos base por 100g para escalado dinámico
  PRESET_FOODS: [
    // Proteínas
    { name: 'Pechuga de pollo limpia', category: 'Carnes', per100g: { kcal: 120, protein: 24, carbs: 0, fat: 2 }, defaultGrams: 200 },
    { name: 'Pechuga de pavo', category: 'Carnes', per100g: { kcal: 105, protein: 23, carbs: 0, fat: 1 }, defaultGrams: 150 },
    { name: 'Ternera magra / Lomo', category: 'Carnes', per100g: { kcal: 140, protein: 22, carbs: 0, fat: 5 }, defaultGrams: 180 },
    { name: 'Salmón fresco', category: 'Pescados', per100g: { kcal: 206, protein: 20, carbs: 0, fat: 13 }, defaultGrams: 180 },
    { name: 'Atún al natural (en lata)', category: 'Pescados', per100g: { kcal: 100, protein: 24, carbs: 0, fat: 1 }, defaultGrams: 120 },
    { name: 'Huevos enteros (unidad ~55g)', category: 'Huevos', per100g: { kcal: 143, protein: 13, carbs: 1, fat: 10 }, defaultGrams: 165 },
    { name: 'Claras de huevo pasteurizadas', category: 'Huevos', per100g: { kcal: 50, protein: 11, carbs: 1, fat: 0 }, defaultGrams: 200 },
    { name: 'Yogur griego 0% natural', category: 'Lácteos', per100g: { kcal: 57, protein: 10, carbs: 4, fat: 0 }, defaultGrams: 150 },
    { name: 'Queso fresco batido 0%', category: 'Lácteos', per100g: { kcal: 46, protein: 8.5, carbs: 3.5, fat: 0.1 }, defaultGrams: 200 },
    { name: 'Proteína Whey Isolate', category: 'Suplementos', per100g: { kcal: 375, protein: 85, carbs: 3, fat: 2 }, defaultGrams: 30 },

    // Carbohidratos
    { name: 'Copos de avena integral', category: 'Cereales', per100g: { kcal: 370, protein: 13, carbs: 60, fat: 7 }, defaultGrams: 60 },
    { name: 'Arroz blanco cocido', category: 'Cereales', per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 }, defaultGrams: 200 },
    { name: 'Arroz jazmín / basmati crudo', category: 'Cereales', per100g: { kcal: 350, protein: 7, carbs: 78, fat: 1 }, defaultGrams: 80 },
    { name: 'Pasta cocida (espaguetis/macarrones)', category: 'Cereales', per100g: { kcal: 150, protein: 5, carbs: 30, fat: 1 }, defaultGrams: 200 },
    { name: 'Patata cocida / asada', category: 'Tubérculos', per100g: { kcal: 85, protein: 2, carbs: 19, fat: 0.1 }, defaultGrams: 250 },
    { name: 'Boniato / Batata', category: 'Tubérculos', per100g: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 }, defaultGrams: 200 },
    { name: 'Pan 100% integral', category: 'Pan', per100g: { kcal: 245, protein: 9, carbs: 45, fat: 2.5 }, defaultGrams: 70 },
    { name: 'Tortita de arroz o maíz', category: 'Snacks', per100g: { kcal: 380, protein: 8, carbs: 80, fat: 2 }, defaultGrams: 30 },

    // Frutas
    { name: 'Plátano maduro', category: 'Frutas', per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 }, defaultGrams: 120 },
    { name: 'Manzana con piel', category: 'Frutas', per100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, defaultGrams: 180 },
    { name: 'Fresas / Frutos rojos', category: 'Frutas', per100g: { kcal: 33, protein: 0.7, carbs: 8, fat: 0.3 }, defaultGrams: 150 },

    // Grasas Saludables
    { name: 'Aceite de oliva virgen extra', category: 'Grasas', per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, defaultGrams: 10 },
    { name: 'Aguacate', category: 'Grasas', per100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 }, defaultGrams: 80 },
    { name: 'Nueces naturales', category: 'Grasas', per100g: { kcal: 654, protein: 15, carbs: 14, fat: 65 }, defaultGrams: 30 },
    { name: 'Crema de cacahuete 100%', category: 'Grasas', per100g: { kcal: 588, protein: 25, carbs: 20, fat: 50 }, defaultGrams: 25 }
  ],

  init() {
    this.render();
  },

  render() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const settings = Storage.getSettings();
    const goals = settings.goals;
    const totals = Storage.calculateNutritionTotals(dayData);

    // Resumen superior
    const nutTotalKcal = document.getElementById('nutTotalKcal');
    if (nutTotalKcal) nutTotalKcal.innerText = totals.kcal;

    const nutGoalKcal = document.getElementById('nutGoalKcal');
    if (nutGoalKcal) nutGoalKcal.innerText = goals.kcal;

    const nutProtein = document.getElementById('nutProteinVal');
    if (nutProtein) nutProtein.innerText = `${totals.protein} / ${goals.protein}g`;

    const nutCarbs = document.getElementById('nutCarbsVal');
    if (nutCarbs) nutCarbs.innerText = `${totals.carbs} / ${goals.carbs}g`;

    const nutFat = document.getElementById('nutFatVal');
    if (nutFat) nutFat.innerText = `${totals.fat} / ${goals.fat}g`;

    // Barras de progreso
    this.updateBar('nutProteinBar', totals.protein, goals.protein);
    this.updateBar('nutCarbsBar', totals.carbs, goals.carbs);
    this.updateBar('nutFatBar', totals.fat, goals.fat);

    // Apple Fitness Card Status
    const appleData = dayData.appleFitness || {};
    const nutAppleKcal = document.getElementById('nutAppleKcal');
    if (nutAppleKcal) nutAppleKcal.innerText = (appleData.activeKcal || 0) + ' kcal';

    const nutAppleSteps = document.getElementById('nutAppleSteps');
    if (nutAppleSteps) nutAppleSteps.innerText = (appleData.steps || 0).toLocaleString() + ' pasos';

    // Renderizar cada tipo de comida
    const mealTypes = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snacks'];
    mealTypes.forEach(meal => {
      this.renderMealSection(meal, dayData.nutrition ? (dayData.nutrition[meal] || []) : []);
    });
  },

  updateBar(id, current, goal) {
    const el = document.getElementById(id);
    if (el) {
      const pct = Math.min(100, Math.round((current / goal) * 100));
      el.style.width = pct + '%';
    }
  },

  renderMealSection(mealType, items) {
    const container = document.getElementById(`mealList_${mealType}`);
    const subtotalKcal = document.getElementById(`mealKcal_${mealType}`);
    if (!container) return;

    let totalKcal = 0;
    let totalP = 0;
    let totalC = 0;
    let totalG = 0;

    items.forEach(item => {
      totalKcal += Number(item.kcal) || 0;
      totalP += Number(item.protein) || 0;
      totalC += Number(item.carbs) || 0;
      totalG += Number(item.fat) || 0;
    });

    if (subtotalKcal) {
      subtotalKcal.innerText = `${totalKcal} kcal`;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="padding: 12px; text-align: center; color: var(--text-dim); font-size: 0.8rem;">
          No has registrado alimentos en esta comida
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div style="flex: 1; padding-right: 8px;">
            <div style="font-size: 0.9rem; font-weight: 600; color: #fff;">${item.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 8px; margin-top: 3px;">
              <span style="color: var(--color-protein);">P: ${item.protein}g</span>
              <span style="color: var(--color-carbs);">C: ${item.carbs}g</span>
              <span style="color: var(--color-fat);">G: ${item.fat}g</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan);">${item.kcal} kcal</span>
            <button onclick="Nutrition.deleteFood('${mealType}', '${item.id}')" style="color: var(--text-dim); padding: 4px;" title="Eliminar">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  openAddModal(mealType = 'desayuno') {
    this.currentMealType = mealType;
    this.selectedFoodBase = null;
    const modal = document.getElementById('foodModal');
    const mealTitle = document.getElementById('foodModalMealName');
    if (mealTitle) {
      const titles = {
        desayuno: 'Desayuno ☕',
        almuerzo: 'Almuerzo / Comida 🍽️',
        merienda: 'Merienda 🍎',
        cena: 'Cena 🌙',
        snacks: 'Snacks / Otros 🥜'
      };
      mealTitle.innerText = titles[mealType] || 'Comida';
    }

    // Render preset chips
    this.renderPresetsList();

    // Reset inputs
    document.getElementById('foodNameInput').value = '';
    document.getElementById('foodKcalInput').value = '';
    document.getElementById('foodProteinInput').value = '';
    document.getElementById('foodCarbsInput').value = '';
    document.getElementById('foodFatInput').value = '';
    const gramsInput = document.getElementById('foodGramsInput');
    if (gramsInput) gramsInput.value = '100';

    App.openModal('foodModal');
  },

  renderPresetsList(searchTerm = '') {
    const presetsContainer = document.getElementById('foodPresetsContainer');
    if (!presetsContainer) return;

    let list = this.PRESET_FOODS;
    if (searchTerm) {
      list = list.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.category.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    presetsContainer.innerHTML = list.map(f => `
      <button type="button" class="food-preset-chip" onclick="Nutrition.selectFoodBase('${f.name}')" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.78rem; color: var(--text-secondary); text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; width: 100%; transition: border-color 0.2s;">
        <div>
          <span style="color: #fff; font-weight: 600;">${f.name}</span>
          <span style="display: block; font-size: 0.68rem; color: var(--text-muted);">${f.category} · Por 100g: ${f.per100g.kcal} kcal (P: ${f.per100g.protein}g)</span>
        </div>
        <span class="pill pill-cyan" style="font-size: 0.7rem;">+ Elegir</span>
      </button>
    `).join('');
  },

  selectFoodBase(foodName) {
    const food = this.PRESET_FOODS.find(f => f.name === foodName);
    if (!food) return;

    this.selectedFoodBase = food;
    const grams = food.defaultGrams || 100;
    const gramsInput = document.getElementById('foodGramsInput');
    if (gramsInput) gramsInput.value = grams;

    document.getElementById('foodNameInput').value = `${food.name} (${grams}g)`;
    this.scalePortion(grams);
  },

  scalePortion(grams) {
    const g = Number(grams) || 100;
    if (this.selectedFoodBase) {
      const base = this.selectedFoodBase.per100g;
      const factor = g / 100;

      const kcal = Math.round(base.kcal * factor);
      const p = Math.round(base.protein * factor * 10) / 10;
      const c = Math.round(base.carbs * factor * 10) / 10;
      const f = Math.round(base.fat * factor * 10) / 10;

      document.getElementById('foodNameInput').value = `${this.selectedFoodBase.name} (${g}g)`;
      document.getElementById('foodKcalInput').value = kcal;
      document.getElementById('foodProteinInput').value = p;
      document.getElementById('foodCarbsInput').value = c;
      document.getElementById('foodFatInput').value = f;
    }
  },

  fillPreset(name, kcal, protein, carbs, fat) {
    document.getElementById('foodNameInput').value = name;
    document.getElementById('foodKcalInput').value = kcal;
    document.getElementById('foodProteinInput').value = protein;
    document.getElementById('foodCarbsInput').value = carbs;
    document.getElementById('foodFatInput').value = fat;
  },

  saveFood() {
    const name = document.getElementById('foodNameInput').value.trim();
    const kcal = Number(document.getElementById('foodKcalInput').value) || 0;
    const protein = Number(document.getElementById('foodProteinInput').value) || 0;
    const carbs = Number(document.getElementById('foodCarbsInput').value) || 0;
    const fat = Number(document.getElementById('foodFatInput').value) || 0;

    if (!name) {
      App.showToast('Ingresa el nombre del alimento', 'error');
      return;
    }

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.addFoodItem(activeDate, this.currentMealType, {
      name,
      kcal,
      protein,
      carbs,
      fat
    });

    App.closeModal('foodModal');
    App.showToast(`Añadido: ${name} (+${kcal} kcal)`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  deleteFood(mealType, foodId) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.removeFoodItem(activeDate, mealType, foodId);
    this.render();
    if (window.Dashboard) Dashboard.render();
    App.showToast('Alimento eliminado', 'info');
  },

  // Apple Fitness Sync Modal
  openAppleFitnessModal() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const appleData = dayData.appleFitness || {};

    document.getElementById('appleKcalInput').value = appleData.activeKcal || '';
    document.getElementById('appleStepsInput').value = appleData.steps || '';
    document.getElementById('appleMinutesInput').value = appleData.exerciseTime || '';
    const standInput = document.getElementById('appleStandInput');
    if (standInput) standInput.value = appleData.standHours || 10;

    App.openModal('appleFitnessModal');
  },

  saveAppleFitness() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const activeKcal = Number(document.getElementById('appleKcalInput').value) || 0;
    const steps = Number(document.getElementById('appleStepsInput').value) || 0;
    const exerciseTime = Number(document.getElementById('appleMinutesInput').value) || 0;
    const standHours = Number(document.getElementById('appleStandInput')?.value) || 10;

    Storage.updateAppleFitness(activeDate, {
      activeKcal,
      steps,
      exerciseTime,
      standHours
    });

    App.closeModal('appleFitnessModal');
    App.showToast('Sincronización Apple Fitness guardada', 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  // --- BIBLIOTECA DE REFERENCIA NUTRICIONAL (70+ ALIMENTOS) ---
  referenceCategoryFilter: 'all',
  selectedRefFood: null,

  openNutritionLibrary() {
    this.referenceCategoryFilter = 'all';
    this.renderNutritionLibrary();
    App.openModal('nutritionLibraryModal');
  },

  filterRefCategory(category) {
    this.referenceCategoryFilter = category;
    document.querySelectorAll('.ref-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    this.renderNutritionLibrary();
  },

  renderNutritionLibrary() {
    const container = document.getElementById('nutritionLibraryList');
    if (!container) return;

    const searchTerm = (document.getElementById('searchRefFoodInput')?.value || '').toLowerCase();
    let list = window.NUTRITION_REFERENCE_DB || [];

    if (this.referenceCategoryFilter !== 'all') {
      list = list.filter(f => f.category.toLowerCase() === this.referenceCategoryFilter.toLowerCase());
    }

    if (searchTerm) {
      list = list.filter(f => 
        f.name.toLowerCase().includes(searchTerm) || 
        f.category.toLowerCase().includes(searchTerm) ||
        (f.note && f.note.toLowerCase().includes(searchTerm))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">🔍</div>
          <p>No se encontraron alimentos con ese criterio.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="card" style="margin-bottom: 8px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);">
        <div class="flex-between">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <span style="font-size: 1.6rem;">${item.icon || '🥗'}</span>
            <div>
              <div style="font-weight: 700; font-size: 0.92rem; color: #fff;">${item.name}</div>
              <span class="pill pill-cyan" style="font-size: 0.65rem; padding: 2px 6px; margin-top: 2px;">${item.category}</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Nutrition.openRefWeightModal('${item.id}')" style="padding: 6px 12px; font-size: 0.78rem;">
            + Por Peso
          </button>
        </div>

        <!-- Macro breakdown per 100g -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; font-size: 0.75rem;">
          <div>
            <span style="color: var(--text-muted); font-size: 0.65rem; display: block;">POR 100g</span>
            <strong style="color: #fff;">${item.kcal} kcal</strong>
          </div>
          <div>
            <span style="color: var(--color-protein); font-size: 0.65rem; display: block;">PROTEÍNA</span>
            <strong style="color: var(--color-protein);">${item.protein}g</strong>
          </div>
          <div>
            <span style="color: var(--color-carbs); font-size: 0.65rem; display: block;">CARBOS</span>
            <strong style="color: var(--color-carbs);">${item.carbs}g</strong>
          </div>
          <div>
            <span style="color: var(--color-fat); font-size: 0.65rem; display: block;">GRASA</span>
            <strong style="color: var(--color-fat);">${item.fat}g</strong>
          </div>
        </div>

        ${item.note ? `
          <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 6px; font-style: italic;">
            💡 ${item.note}
          </div>
        ` : ''}
      </div>
    `).join('');
  },

  // --- SELECCIONAR ALIMENTO Y AJUSTAR PESO ---
  openRefWeightModal(foodId) {
    const item = (window.NUTRITION_REFERENCE_DB || []).find(f => f.id === foodId);
    if (!item) return;

    this.selectedRefFood = item;
    document.getElementById('refDoseFoodName').innerText = `${item.icon || '🥗'} ${item.name}`;
    document.getElementById('refDosePer100g').innerText = `Base 100g: ${item.kcal} kcal · P: ${item.protein}g · C: ${item.carbs}g · G: ${item.fat}g`;
    
    // Set default grams
    const defaultGrams = 150;
    document.getElementById('refWeightInput').value = defaultGrams;
    document.getElementById('refWeightSlider').value = defaultGrams;
    this.calcRefWeightDose(defaultGrams);

    App.openModal('refWeightDoseModal');
  },

  calcRefWeightDose(grams) {
    const g = Number(grams) || 100;
    document.getElementById('refWeightDisplay').innerText = `${g}g`;

    if (this.selectedRefFood) {
      const f = this.selectedRefFood;
      const factor = g / 100;

      const kcal = Math.round(f.kcal * factor);
      const p = Math.round(f.protein * factor * 10) / 10;
      const c = Math.round(f.carbs * factor * 10) / 10;
      const fat = Math.round(f.fat * factor * 10) / 10;

      document.getElementById('refCalcKcal').innerText = `${kcal} kcal`;
      document.getElementById('refCalcProtein').innerText = `${p}g`;
      document.getElementById('refCalcCarbs').innerText = `${c}g`;
      document.getElementById('refCalcFat').innerText = `${fat}g`;
    }
  },

  setRefWeightChip(grams) {
    document.getElementById('refWeightInput').value = grams;
    document.getElementById('refWeightSlider').value = grams;
    this.calcRefWeightDose(grams);
  },

  saveRefFoodToMeal() {
    if (!this.selectedRefFood) return;

    const grams = Number(document.getElementById('refWeightInput').value) || 100;
    const mealType = document.getElementById('refMealSelect').value || 'almuerzo';
    const factor = grams / 100;

    const f = this.selectedRefFood;
    const kcal = Math.round(f.kcal * factor);
    const protein = Math.round(f.protein * factor * 10) / 10;
    const carbs = Math.round(f.carbs * factor * 10) / 10;
    const fat = Math.round(f.fat * factor * 10) / 10;

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    Storage.addFoodItem(activeDate, mealType, {
      name: `${f.name} (${grams}g)`,
      kcal,
      protein,
      carbs,
      fat
    });

    App.closeModal('refWeightDoseModal');
    App.showToast(`Añadido a ${mealType.toUpperCase()}: ${f.name} (${grams}g, +${kcal} kcal)`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  }
};

window.Nutrition = Nutrition;
