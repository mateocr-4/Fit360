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
    { name: 'Pavo fileteado (fiambre)', category: 'Carnes', per100g: { kcal: 105, protein: 18.5, carbs: 1.5, fat: 2.8 }, defaultGrams: 80 },
    { name: 'Jamón serrano', category: 'Carnes', per100g: { kcal: 241, protein: 31, carbs: 0, fat: 13 }, defaultGrams: 40 },
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
    { name: 'Arroz integral cocido', category: 'Cereales', per100g: { kcal: 123, protein: 2.7, carbs: 26, fat: 1 }, defaultGrams: 200 },
    { name: 'Pasta cocida (espaguetis/macarrones)', category: 'Cereales', per100g: { kcal: 150, protein: 5, carbs: 30, fat: 1 }, defaultGrams: 200 },
    { name: 'Patata cocida / asada', category: 'Tubérculos', per100g: { kcal: 85, protein: 2, carbs: 19, fat: 0.1 }, defaultGrams: 250 },
    { name: 'Boniato / Batata', category: 'Tubérculos', per100g: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 }, defaultGrams: 200 },
    { name: 'Pan 100% integral', category: 'Pan', per100g: { kcal: 245, protein: 9, carbs: 45, fat: 2.5 }, defaultGrams: 70 },
    { name: 'Tortilla de trigo (wrap)', category: 'Pan', per100g: { kcal: 312, protein: 8.5, carbs: 52, fat: 8 }, defaultGrams: 65 },

    // Verduras & Frutas
    { name: 'Plátano maduro', category: 'Frutas', per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 }, defaultGrams: 120 },
    { name: 'Manzana con piel', category: 'Frutas', per100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, defaultGrams: 180 },
    { name: 'Fresas / Frutos rojos', category: 'Frutas', per100g: { kcal: 33, protein: 0.7, carbs: 8, fat: 0.3 }, defaultGrams: 150 },
    { name: 'Tomate natural', category: 'Verduras', per100g: { kcal: 18, protein: 0.9, carbs: 3.5, fat: 0.2 }, defaultGrams: 150 },
    { name: 'Brócoli', category: 'Verduras', per100g: { kcal: 34, protein: 2.8, carbs: 4, fat: 0.4 }, defaultGrams: 150 },
    { name: 'Espinacas frescas', category: 'Verduras', per100g: { kcal: 23, protein: 2.9, carbs: 1.4, fat: 0.4 }, defaultGrams: 100 },
    { name: 'Champiñones / Setas', category: 'Verduras', per100g: { kcal: 22, protein: 3.1, carbs: 0.5, fat: 0.3 }, defaultGrams: 100 },
    { name: 'Lechuga romana', category: 'Verduras', per100g: { kcal: 17, protein: 1.2, carbs: 2, fat: 0.3 }, defaultGrams: 80 },

    // Grasas Saludables
    { name: 'Aceite de oliva virgen extra', category: 'Grasas', per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, defaultGrams: 10 },
    { name: 'Aguacate', category: 'Grasas', per100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 }, defaultGrams: 80 },
    { name: 'Nueces naturales', category: 'Grasas', per100g: { kcal: 654, protein: 15, carbs: 14, fat: 65 }, defaultGrams: 30 },
    { name: 'Crema de cacahuete 100%', category: 'Grasas', per100g: { kcal: 588, protein: 25, carbs: 20, fat: 50 }, defaultGrams: 25 },
    { name: 'Semillas de chía', category: 'Grasas', per100g: { kcal: 486, protein: 16.5, carbs: 42, fat: 31 }, defaultGrams: 15 },

    // Extras
    { name: 'Leche de avena (sin azúcar)', category: 'Bebidas', per100g: { kcal: 44, protein: 1, carbs: 6.5, fat: 1.5 }, defaultGrams: 200 },
    { name: 'Hummus clásico', category: 'Legumbres', per100g: { kcal: 166, protein: 7.9, carbs: 14.3, fat: 9.6 }, defaultGrams: 50 },
    { name: 'Chocolate negro 85%', category: 'Snacks', per100g: { kcal: 580, protein: 10, carbs: 30, fat: 46 }, defaultGrams: 20 },
    { name: 'Tortita de arroz', category: 'Snacks', per100g: { kcal: 380, protein: 8, carbs: 80, fat: 2 }, defaultGrams: 30 }
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
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan);">${item.kcal} kcal</span>
            <button onclick="Nutrition.shareMealItem('${mealType}', '${item.id}')" style="color: var(--accent-lime); padding: 4px;" title="Compartir plato con amigos">
              📤
            </button>
            <button onclick="Nutrition.deleteFood('${mealType}', '${item.id}')" style="color: var(--text-dim); padding: 4px;" title="Eliminar">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  foodModalMode: 'alimento',
  foodModalRecipeMatchOnly: true,

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

    // Switch to food mode by default
    this.switchFoodModalMode('alimento');

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

  switchFoodModalMode(mode) {
    this.foodModalMode = mode;
    const tabAlimento = document.getElementById('foodModalTabAlimento');
    const tabReceta = document.getElementById('foodModalTabReceta');
    const contentAlimento = document.getElementById('foodModalContentAlimento');
    const contentReceta = document.getElementById('foodModalContentReceta');

    if (tabAlimento && tabReceta && contentAlimento && contentReceta) {
      if (mode === 'alimento') {
        tabAlimento.classList.add('active');
        tabAlimento.style.opacity = '1';
        tabReceta.classList.remove('active');
        tabReceta.style.opacity = '0.7';
        contentAlimento.style.display = 'block';
        contentReceta.style.display = 'none';
      } else {
        tabReceta.classList.add('active');
        tabReceta.style.opacity = '1';
        tabAlimento.classList.remove('active');
        tabAlimento.style.opacity = '0.7';
        contentAlimento.style.display = 'none';
        contentReceta.style.display = 'block';
        this.renderFoodModalRecipes();
      }
    }
  },

  filterFoodModalRecipes(matchOnly) {
    this.foodModalRecipeMatchOnly = matchOnly;
    const btnMatch = document.getElementById('foodModalRecFilterMatch');
    const btnAll = document.getElementById('foodModalRecFilterAll');
    if (btnMatch) btnMatch.classList.toggle('active', matchOnly);
    if (btnAll) btnAll.classList.toggle('active', !matchOnly);
    const searchVal = document.getElementById('foodModalRecipeSearch')?.value || '';
    this.renderFoodModalRecipes(searchVal);
  },

  renderFoodModalRecipes(searchTerm = '') {
    const container = document.getElementById('foodModalRecipeList');
    if (!container) return;

    let recipes = Storage.getCustomRecipes();
    const currentMeal = this.currentMealType || 'almuerzo';

    if (this.foodModalRecipeMatchOnly) {
      recipes = recipes.filter(r => r.mealType === currentMeal);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      recipes = recipes.filter(r => r.name.toLowerCase().includes(q) || (r.instructions && r.instructions.toLowerCase().includes(q)));
    }

    if (recipes.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 0.8rem;">
          No hay recetas ${this.foodModalRecipeMatchOnly ? `sugeridas para este horario` : 'con ese nombre'}.
          <div style="margin-top: 8px;">
            <button class="pill pill-lime" onclick="Nutrition.filterFoodModalRecipes(false)">Ver todas las recetas</button>
          </div>
        </div>
      `;
      return;
    }

    const mealLabels = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena', snacks: 'Snacks' };

    container.innerHTML = recipes.map(r => {
      const totals = r.totals || { kcal: r.kcal || 0, protein: r.protein || 0, carbs: r.carbs || 0, fat: r.fat || 0 };
      const perServing = r.perServing || totals;

      return `
        <div class="card" style="padding: 10px; margin-bottom: 6px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px;"
          onclick="App.closeModal('foodModal'); Nutrition.openRecipeDetail('${r.id}', '${currentMeal}')">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
            <span style="font-size: 1.5rem;">${r.icon || '🍽️'}</span>
            <div style="min-width: 0;">
              <div style="font-weight: 700; font-size: 0.86rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.name}</div>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">
                <span class="pill pill-cyan" style="font-size: 0.58rem; padding: 1px 5px;">${mealLabels[r.mealType] || r.mealType}</span>
                <span style="color: var(--color-protein);">P:${perServing.protein}g</span> · 
                <span style="color: var(--color-carbs);">C:${perServing.carbs}g</span> · 
                <span style="color: var(--color-fat);">G:${perServing.fat}g</span>
              </div>
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <span style="font-weight: 700; color: var(--accent-cyan); font-size: 0.9rem; display: block;">${perServing.kcal} kcal</span>
            <span class="card-action-btn" style="font-size: 0.65rem; padding: 2px 6px; display: inline-flex;">+ Elegir</span>
          </div>
        </div>
      `;
    }).join('');
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
  },

  shareMealItem(mealType, foodId) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const item = (dayData.nutrition[mealType] || []).find(f => f.id === foodId);
    if (!item) return;

    const recipeObj = {
      name: item.name,
      icon: '🍲',
      servings: 1,
      kcal: item.kcal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      ingredients: [item.name],
      instructions: `Registrado originalmente en ${mealType}.`
    };

    if (window.Social) {
      Social.openShareModal(`Compartir "${item.name}"`, 'recipe', recipeObj);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // RECIPE BUILDER — Constructor de Recetas Personalizadas
  // ═══════════════════════════════════════════════════════════
  builderIngredients: [],
  builderEditingId: null,
  recipeFilterMealType: 'all',

  // --- MIS RECETAS (Listado) ---
  targetMealForRecipe: null,

  openMyRecipes(targetMeal = null) {
    this.targetMealForRecipe = targetMeal || null;
    this.recipeFilterMealType = targetMeal || 'all';

    // Banner / indicator in modal
    const noticeEl = document.getElementById('recipeTargetMealNotice');
    if (noticeEl) {
      if (targetMeal) {
        const labels = { desayuno: 'Desayuno ☕', almuerzo: 'Almuerzo 🍽️', merienda: 'Merienda 🍎', cena: 'Cena 🌙', snacks: 'Snacks 🥜' };
        noticeEl.innerHTML = `
          <div style="background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 8px; padding: 7px 10px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.78rem; color: #fff;">Añadiendo a: <strong style="color: var(--accent-cyan);">${labels[targetMeal] || targetMeal}</strong></span>
            <button type="button" onclick="Nutrition.targetMealForRecipe = null; Nutrition.filterRecipesByMeal('all');" style="background: none; border: none; color: var(--accent-lime); font-size: 0.72rem; cursor: pointer; text-decoration: underline;">Ver todas</button>
          </div>
        `;
        noticeEl.style.display = 'block';
      } else {
        noticeEl.style.display = 'none';
      }
    }

    document.querySelectorAll('.recipe-meal-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.meal === (targetMeal || 'all'));
    });

    this.renderRecipeList();
    App.openModal('recipeListModal');
  },

  filterRecipesByMeal(mealType) {
    this.recipeFilterMealType = mealType;
    document.querySelectorAll('.recipe-meal-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.meal === mealType);
    });
    const noticeEl = document.getElementById('recipeTargetMealNotice');
    if (noticeEl && mealType === 'all') {
      noticeEl.style.display = 'none';
    }
    this.renderRecipeList();
  },

  renderRecipeList() {
    const container = document.getElementById('recipeListContainer');
    if (!container) return;

    const searchTerm = (document.getElementById('recipeSearchInput')?.value || '').toLowerCase();
    let recipes = Storage.getCustomRecipes();

    if (this.recipeFilterMealType !== 'all') {
      recipes = recipes.filter(r => r.mealType === this.recipeFilterMealType);
    }
    if (searchTerm) {
      recipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm) ||
        (r.instructions && r.instructions.toLowerCase().includes(searchTerm))
      );
    }

    if (recipes.length === 0) {
      container.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">🍳</div>
          <p>No se encontraron recetas para este filtro.</p>
          <div style="display: flex; gap: 8px; justify-content: center; margin-top: 8px;">
            <button class="pill pill-lime" onclick="Nutrition.filterRecipesByMeal('all')">Ver todas</button>
            <button class="btn btn-primary btn-sm" onclick="Nutrition.openRecipeBuilder()">+ Crear receta</button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = recipes.map(rc => {
      const totals = rc.totals || { kcal: rc.kcal || 0, protein: rc.protein || 0, carbs: rc.carbs || 0, fat: rc.fat || 0 };
      const perServing = rc.perServing || totals;
      const hasIngredients = rc.ingredients && rc.ingredients.length > 0 && typeof rc.ingredients[0] === 'object';
      const ingredientCount = hasIngredients ? rc.ingredients.length : 0;
      const mealLabels = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena', snacks: 'Snacks' };

      return `
        <div class="card" style="margin-bottom: 8px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); cursor: pointer;" onclick="Nutrition.openRecipeDetail('${rc.id}', Nutrition.targetMealForRecipe)">
          <div class="flex-between" style="margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
              <span style="font-size: 1.6rem;">${rc.icon || '🍽️'}</span>
              <div>
                <div style="font-weight: 700; font-size: 0.92rem; color: #fff;">${rc.name}</div>
                <div style="display: flex; gap: 6px; margin-top: 3px; flex-wrap: wrap;">
                  ${rc.mealType ? `<span class="pill pill-cyan" style="font-size: 0.6rem; padding: 1px 6px;">${mealLabels[rc.mealType] || rc.mealType}</span>` : ''}
                  ${rc.time ? `<span style="font-size: 0.68rem; color: var(--text-dim);">⏱️ ${rc.time}</span>` : ''}
                  ${ingredientCount ? `<span style="font-size: 0.68rem; color: var(--text-dim);">${ingredientCount} ingredientes</span>` : ''}
                  ${rc.servings > 1 ? `<span style="font-size: 0.68rem; color: var(--text-dim);">${rc.servings} porciones</span>` : ''}
                </div>
              </div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; text-align: center; font-size: 0.72rem; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.05);">
            <div><span style="color: var(--text-muted); display: block; font-size: 0.6rem;">${rc.servings > 1 ? 'POR PORCIÓN' : 'TOTAL'}</span><strong style="color: #fff;">${perServing.kcal} kcal</strong></div>
            <div><span style="color: var(--color-protein); display: block; font-size: 0.6rem;">PROT</span><strong style="color: var(--color-protein);">${perServing.protein}g</strong></div>
            <div><span style="color: var(--color-carbs); display: block; font-size: 0.6rem;">CARB</span><strong style="color: var(--color-carbs);">${perServing.carbs}g</strong></div>
            <div><span style="color: var(--color-fat); display: block; font-size: 0.6rem;">GRASA</span><strong style="color: var(--color-fat);">${perServing.fat}g</strong></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // --- CONSTRUCTOR DE RECETAS ---
  openRecipeBuilder(editId) {
    this.builderIngredients = [];
    this.builderEditingId = editId || null;

    // Reset form
    const nameInput = document.getElementById('builderRecipeName');
    const iconInput = document.getElementById('builderRecipeIcon');
    const mealSelect = document.getElementById('builderMealType');
    const servingsInput = document.getElementById('builderServings');
    const instructionsInput = document.getElementById('builderInstructions');
    const searchInput = document.getElementById('builderIngredientSearch');

    if (editId) {
      const recipe = Storage.getCustomRecipes().find(r => r.id === editId);
      if (recipe) {
        if (nameInput) nameInput.value = recipe.name;
        if (iconInput) iconInput.value = recipe.icon || '🍽️';
        if (mealSelect) mealSelect.value = recipe.mealType || 'almuerzo';
        if (servingsInput) servingsInput.value = recipe.servings || 1;
        if (instructionsInput) instructionsInput.value = recipe.instructions || '';
        if (recipe.ingredients && typeof recipe.ingredients[0] === 'object') {
          this.builderIngredients = JSON.parse(JSON.stringify(recipe.ingredients));
        }
      }
    } else {
      if (nameInput) nameInput.value = '';
      if (iconInput) iconInput.value = '🍽️';
      if (mealSelect) mealSelect.value = 'almuerzo';
      if (servingsInput) servingsInput.value = 1;
      if (instructionsInput) instructionsInput.value = '';
    }
    if (searchInput) searchInput.value = '';

    this.renderBuilderIngredientSearch();
    this.renderBuilderIngredients();
    this.updateBuilderTotals();
    App.openModal('recipeBuilderModal');
  },

  renderBuilderIngredientSearch(searchTerm) {
    const container = document.getElementById('builderFoodResults');
    if (!container) return;

    const term = (searchTerm || '').toLowerCase();
    const db = window.NUTRITION_REFERENCE_DB || [];
    let results = term ? db.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.category.toLowerCase().includes(term)
    ) : db.slice(0, 15);

    container.innerHTML = results.slice(0, 20).map(f => `
      <button type="button" onclick="Nutrition.addBuilderIngredient('${f.id}')" style="background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 6px 8px; font-size: 0.75rem; color: var(--text-secondary); text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; width: 100%; transition: border-color 0.2s;">
        <div>
          <span style="margin-right: 4px;">${f.icon || '🥗'}</span>
          <span style="color: #fff; font-weight: 600;">${f.name}</span>
          <span style="display: block; font-size: 0.65rem; color: var(--text-muted); margin-left: 22px;">${f.kcal} kcal · P:${f.protein}g · C:${f.carbs}g · G:${f.fat}g /100g</span>
        </div>
        <span class="pill pill-lime" style="font-size: 0.65rem; flex-shrink: 0;">+ Añadir</span>
      </button>
    `).join('');
  },

  addBuilderIngredient(foodId) {
    const food = (window.NUTRITION_REFERENCE_DB || []).find(f => f.id === foodId);
    if (!food) return;

    const defaultGrams = 100;
    const factor = defaultGrams / 100;

    this.builderIngredients.push({
      foodId: food.id,
      name: food.name,
      grams: defaultGrams,
      kcal: Math.round(food.kcal * factor),
      protein: Math.round(food.protein * factor * 10) / 10,
      carbs: Math.round(food.carbs * factor * 10) / 10,
      fat: Math.round(food.fat * factor * 10) / 10
    });

    this.renderBuilderIngredients();
    this.updateBuilderTotals();
    App.showToast(`${food.name} añadido`, 'success');
  },

  removeBuilderIngredient(index) {
    this.builderIngredients.splice(index, 1);
    this.renderBuilderIngredients();
    this.updateBuilderTotals();
  },

  updateBuilderIngredientGrams(index, grams) {
    const g = Number(grams) || 0;
    const ing = this.builderIngredients[index];
    if (!ing) return;

    const food = (window.NUTRITION_REFERENCE_DB || []).find(f => f.id === ing.foodId);
    if (!food) return;

    const factor = g / 100;
    ing.grams = g;
    ing.kcal = Math.round(food.kcal * factor);
    ing.protein = Math.round(food.protein * factor * 10) / 10;
    ing.carbs = Math.round(food.carbs * factor * 10) / 10;
    ing.fat = Math.round(food.fat * factor * 10) / 10;

    // Update inline macro display
    const row = document.getElementById(`builderIng_${index}`);
    if (row) {
      row.querySelector('.ing-kcal').innerText = `${ing.kcal} kcal`;
      row.querySelector('.ing-macros').innerText = `P:${ing.protein}g · C:${ing.carbs}g · G:${ing.fat}g`;
    }
    this.updateBuilderTotals();
  },

  renderBuilderIngredients() {
    const container = document.getElementById('builderIngredientsList');
    if (!container) return;

    if (this.builderIngredients.length === 0) {
      container.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-dim); font-size: 0.8rem;">Busca y añade ingredientes de la base de datos</div>`;
      return;
    }

    container.innerHTML = this.builderIngredients.map((ing, i) => `
      <div id="builderIng_${i}" style="display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.82rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ing.name}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
            <input type="number" value="${ing.grams}" min="1" max="2000" step="5"
              style="width: 60px; padding: 3px 5px; font-size: 0.75rem; background: rgba(255,255,255,0.08); border: 1px solid var(--glass-border); border-radius: 4px; color: var(--accent-cyan); text-align: center;"
              oninput="Nutrition.updateBuilderIngredientGrams(${i}, this.value)">
            <span style="font-size: 0.7rem; color: var(--text-dim);">g</span>
            <span class="ing-kcal" style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan);">${ing.kcal} kcal</span>
          </div>
          <div class="ing-macros" style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">P:${ing.protein}g · C:${ing.carbs}g · G:${ing.fat}g</div>
        </div>
        <button onclick="Nutrition.removeBuilderIngredient(${i})" style="color: var(--text-dim); padding: 4px; background: none; border: none; cursor: pointer;" title="Eliminar">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `).join('');
  },

  updateBuilderTotals() {
    const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    this.builderIngredients.forEach(ing => {
      totals.kcal += ing.kcal;
      totals.protein += ing.protein;
      totals.carbs += ing.carbs;
      totals.fat += ing.fat;
    });

    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;

    const servings = Number(document.getElementById('builderServings')?.value) || 1;
    const perServing = {
      kcal: Math.round(totals.kcal / servings),
      protein: Math.round(totals.protein / servings * 10) / 10,
      carbs: Math.round(totals.carbs / servings * 10) / 10,
      fat: Math.round(totals.fat / servings * 10) / 10
    };

    const el = id => document.getElementById(id);
    if (el('builderTotalKcal')) el('builderTotalKcal').innerText = `${totals.kcal} kcal`;
    if (el('builderTotalProtein')) el('builderTotalProtein').innerText = `${totals.protein}g`;
    if (el('builderTotalCarbs')) el('builderTotalCarbs').innerText = `${totals.carbs}g`;
    if (el('builderTotalFat')) el('builderTotalFat').innerText = `${totals.fat}g`;

    if (el('builderPerServingKcal')) el('builderPerServingKcal').innerText = `${perServing.kcal} kcal`;
    if (el('builderPerServingProtein')) el('builderPerServingProtein').innerText = `${perServing.protein}g`;
    if (el('builderPerServingCarbs')) el('builderPerServingCarbs').innerText = `${perServing.carbs}g`;
    if (el('builderPerServingFat')) el('builderPerServingFat').innerText = `${perServing.fat}g`;

    const countEl = el('builderIngCount');
    if (countEl) countEl.innerText = `${this.builderIngredients.length} ingrediente${this.builderIngredients.length !== 1 ? 's' : ''}`;
  },

  saveBuilderRecipe() {
    const name = document.getElementById('builderRecipeName')?.value.trim();
    if (!name) { App.showToast('Escribe un nombre para la receta', 'error'); return; }
    if (this.builderIngredients.length === 0) { App.showToast('Añade al menos un ingrediente', 'error'); return; }

    const servings = Number(document.getElementById('builderServings')?.value) || 1;
    const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    this.builderIngredients.forEach(ing => {
      totals.kcal += ing.kcal;
      totals.protein += ing.protein;
      totals.carbs += ing.carbs;
      totals.fat += ing.fat;
    });
    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;

    const perServing = {
      kcal: Math.round(totals.kcal / servings),
      protein: Math.round(totals.protein / servings * 10) / 10,
      carbs: Math.round(totals.carbs / servings * 10) / 10,
      fat: Math.round(totals.fat / servings * 10) / 10
    };

    const recipe = {
      id: this.builderEditingId || ('recipe_' + Date.now()),
      name,
      icon: document.getElementById('builderRecipeIcon')?.value || '🍽️',
      mealType: document.getElementById('builderMealType')?.value || 'almuerzo',
      servings,
      ingredients: JSON.parse(JSON.stringify(this.builderIngredients)),
      totals,
      perServing,
      instructions: document.getElementById('builderInstructions')?.value.trim() || ''
    };

    Storage.saveCustomRecipe(recipe);
    App.closeModal('recipeBuilderModal');
    App.showToast(`Receta "${name}" guardada ✅`, 'success');

    // Refresh list if open
    this.renderRecipeList();
  },

  // --- DETALLE DE RECETA ---
  activeRecipeDetail: null,
  recipeLogServings: 1,

  openRecipeDetail(recipeId, targetMeal = null) {
    const recipe = Storage.getCustomRecipes().find(r => r.id === recipeId);
    if (!recipe) return;

    this.activeRecipeDetail = recipe;
    this.targetMealForRecipe = targetMeal || this.targetMealForRecipe || recipe.mealType || 'almuerzo';
    this.recipeLogServings = 1;

    const container = document.getElementById('recipeDetailContent');
    if (!container) return;

    const totals = recipe.totals || { kcal: recipe.kcal || 0, protein: recipe.protein || 0, carbs: recipe.carbs || 0, fat: recipe.fat || 0 };
    const perServing = recipe.perServing || totals;
    const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0 && typeof recipe.ingredients[0] === 'object';
    const mealLabels = { desayuno: 'Desayuno ☕', almuerzo: 'Almuerzo 🍽️', merienda: 'Merienda 🍎', cena: 'Cena 🌙', snacks: 'Snacks 🥜' };

    let html = `
      <div style="text-align: center; margin-bottom: 12px;">
        <span style="font-size: 2.5rem;">${recipe.icon || '🍽️'}</span>
        <h3 style="font-size: 1.15rem; margin-top: 4px;">${recipe.name}</h3>
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
          ${recipe.mealType ? `<span class="pill pill-cyan" style="font-size: 0.68rem;">${mealLabels[recipe.mealType] || recipe.mealType}</span>` : ''}
          ${recipe.time ? `<span class="pill pill-cyan" style="font-size: 0.68rem;">⏱️ ${recipe.time}</span>` : ''}
          ${recipe.servings > 1 ? `<span class="pill pill-cyan" style="font-size: 0.68rem;">${recipe.servings} porciones</span>` : ''}
        </div>
      </div>

      <!-- Macros -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 14px; text-align: center;">
        <div class="card" style="margin-bottom: 0; padding: 8px 4px;">
          <span style="font-size: 0.6rem; color: var(--text-muted); display: block;">${recipe.servings > 1 ? 'POR PORCIÓN' : 'TOTAL'}</span>
          <strong style="font-size: 1rem; color: #fff;">${perServing.kcal}</strong>
          <span style="font-size: 0.65rem; color: var(--text-muted);"> kcal</span>
        </div>
        <div class="card" style="margin-bottom: 0; padding: 8px 4px;">
          <span style="font-size: 0.6rem; color: var(--color-protein); display: block;">PROTEÍNA</span>
          <strong style="font-size: 1rem; color: var(--color-protein);">${perServing.protein}g</strong>
        </div>
        <div class="card" style="margin-bottom: 0; padding: 8px 4px;">
          <span style="font-size: 0.6rem; color: var(--color-carbs); display: block;">CARBOS</span>
          <strong style="font-size: 1rem; color: var(--color-carbs);">${perServing.carbs}g</strong>
        </div>
        <div class="card" style="margin-bottom: 0; padding: 8px 4px;">
          <span style="font-size: 0.6rem; color: var(--color-fat); display: block;">GRASA</span>
          <strong style="font-size: 1rem; color: var(--color-fat);">${perServing.fat}g</strong>
        </div>
      </div>
    `;

    // Ingredients list
    if (hasIngredients) {
      html += `<div style="margin-bottom: 12px;">
        <span class="form-label" style="font-size: 0.78rem;">📋 Ingredientes</span>`;
      recipe.ingredients.forEach(ing => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem;">
            <span style="color: #fff;">${ing.name} <span style="color: var(--accent-cyan);">(${ing.grams}g)</span></span>
            <span style="color: var(--text-muted); font-size: 0.72rem; white-space: nowrap;">${ing.kcal} kcal</span>
          </div>
        `;
      });

      if (recipe.servings > 1) {
        html += `<div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 6px; text-align: right;">Total receta: ${totals.kcal} kcal (${recipe.servings} porciones)</div>`;
      }
      html += `</div>`;
    } else if (Array.isArray(recipe.ingredients)) {
      html += `<div style="margin-bottom: 12px;">
        <span class="form-label" style="font-size: 0.78rem;">📋 Ingredientes</span>`;
      recipe.ingredients.forEach(ing => {
        html += `<div style="padding: 4px 0; font-size: 0.8rem; color: var(--text-secondary); border-bottom: 1px solid rgba(255,255,255,0.05);">• ${ing}</div>`;
      });
      html += `</div>`;
    }

    // Instructions
    if (recipe.instructions) {
      html += `
        <div style="margin-bottom: 14px;">
          <span class="form-label" style="font-size: 0.78rem;">👨‍🍳 Preparación</span>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">${recipe.instructions}</p>
        </div>
      `;
    }

    // Selector de comida interactivo y porciones
    const mealShortLabels = { desayuno: '☕ Desayuno', almuerzo: '🍽️ Almuerzo', merienda: '🍎 Merienda', cena: '🌙 Cena', snacks: '🥜 Snacks' };
    const curMeal = this.targetMealForRecipe || 'almuerzo';

    html += `
      <!-- SELECTOR DE COMIDA DESTINO Y PORCIONES -->
      <div style="margin-bottom: 12px; background: rgba(0, 242, 254, 0.05); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: var(--radius-md); padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="form-label" style="margin-bottom: 0; font-size: 0.78rem; color: var(--accent-cyan); font-weight: 700;">
            🍽️ Añadir a esta comida:
          </span>
          <span style="font-size: 0.7rem; color: var(--text-dim);">Elige la comida</span>
        </div>
        <div id="recipeDetailMealButtons" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 10px;">
          ${['desayuno', 'almuerzo', 'merienda', 'cena', 'snacks'].map(m => {
            const isSel = m === curMeal;
            return `
              <button type="button" class="meal-choice-chip" onclick="Nutrition.setRecipeLogMeal('${m}')"
                style="padding: 7px 2px; font-size: 0.68rem; font-weight: ${isSel ? '800' : '600'}; border-radius: 6px; border: 1px solid ${isSel ? 'var(--accent-cyan)' : 'var(--glass-border)'}; background: ${isSel ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)'}; color: ${isSel ? '#000' : 'var(--text-secondary)'}; cursor: pointer; text-align: center; transition: all 0.15s;">
                ${mealShortLabels[m]}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Servings Stepper -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08);">
          <div>
            <span style="font-size: 0.76rem; color: #fff; font-weight: 600; display: block;">Raciones / Porciones:</span>
            <span id="recipeLogServingsKcalSub" style="font-size: 0.68rem; color: var(--accent-cyan);">${perServing.kcal} kcal</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="pill pill-cyan" onclick="Nutrition.adjustRecipeLogServings(-0.5)" style="cursor: pointer; padding: 3px 10px; font-weight: 800; font-size: 0.9rem;">-</button>
            <span id="recipeLogServingsDisplay" style="font-weight: 700; font-size: 0.85rem; color: #fff; min-width: 60px; text-align: center;">1 porción</span>
            <button type="button" class="pill pill-cyan" onclick="Nutrition.adjustRecipeLogServings(0.5)" style="cursor: pointer; padding: 3px 10px; font-weight: 800; font-size: 0.9rem;">+</button>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <button id="btnLogRecipeAction" class="btn btn-primary btn-block" onclick="Nutrition.executeLogRecipe()">
          ➕ Añadir a ${mealLabels[curMeal]} (${perServing.kcal} kcal)
        </button>
        <div style="display: flex; gap: 6px;">
          ${hasIngredients ? `<button class="btn btn-secondary" style="flex: 1;" onclick="App.closeModal('recipeDetailModal'); Nutrition.openRecipeBuilder('${recipe.id}')">✏️ Editar</button>` : ''}
          <button class="btn btn-secondary" style="flex: 1;" onclick="Social.shareCustomRecipeById('${recipe.id}')">📤 Compartir</button>
          <button class="btn btn-secondary" style="flex: 1; color: #ff5277;" onclick="Nutrition.deleteRecipeConfirm('${recipe.id}')">🗑️ Eliminar</button>
        </div>
      </div>
    `;

    container.innerHTML = html;
    App.openModal('recipeDetailModal');
  },

  setRecipeLogMeal(mealType) {
    this.targetMealForRecipe = mealType;
    this.updateRecipeDetailActionUI();
  },

  adjustRecipeLogServings(delta) {
    let s = (this.recipeLogServings || 1) + delta;
    if (s < 0.25) s = 0.25;
    if (s > 10) s = 10;
    this.recipeLogServings = Math.round(s * 100) / 100;
    this.updateRecipeDetailActionUI();
  },

  updateRecipeDetailActionUI() {
    const recipe = this.activeRecipeDetail;
    if (!recipe) return;

    const totals = recipe.totals || { kcal: recipe.kcal || 0, protein: recipe.protein || 0, carbs: recipe.carbs || 0, fat: recipe.fat || 0 };
    const perServing = recipe.perServing || totals;
    const s = this.recipeLogServings || 1;
    const scaledKcal = Math.round(perServing.kcal * s);
    const scaledP = Math.round(perServing.protein * s * 10) / 10;
    const scaledC = Math.round(perServing.carbs * s * 10) / 10;
    const scaledG = Math.round(perServing.fat * s * 10) / 10;

    const mealLabels = { desayuno: 'Desayuno ☕', almuerzo: 'Almuerzo 🍽️', merienda: 'Merienda 🍎', cena: 'Cena 🌙', snacks: 'Snacks 🥜' };
    const curMeal = this.targetMealForRecipe || 'almuerzo';

    const servDisplay = document.getElementById('recipeLogServingsDisplay');
    if (servDisplay) {
      servDisplay.innerText = `${s} ${s === 1 ? 'porción' : 'porciones'}`;
    }

    const kcalSub = document.getElementById('recipeLogServingsKcalSub');
    if (kcalSub) {
      kcalSub.innerText = `${scaledKcal} kcal (P:${scaledP}g · C:${scaledC}g · G:${scaledG}g)`;
    }

    // Update buttons
    const container = document.getElementById('recipeDetailMealButtons');
    if (container) {
      const meals = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snacks'];
      container.querySelectorAll('.meal-choice-chip').forEach((btn, idx) => {
        const isSel = meals[idx] === curMeal;
        btn.style.background = isSel ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)';
        btn.style.borderColor = isSel ? 'var(--accent-cyan)' : 'var(--glass-border)';
        btn.style.color = isSel ? '#000' : 'var(--text-secondary)';
        btn.style.fontWeight = isSel ? '800' : '600';
      });
    }

    const logBtn = document.getElementById('btnLogRecipeAction');
    if (logBtn) {
      logBtn.innerHTML = `➕ Añadir ${s !== 1 ? `${s} porc. ` : ''}a ${mealLabels[curMeal]} (${scaledKcal} kcal)`;
    }
  },

  executeLogRecipe() {
    const recipe = this.activeRecipeDetail;
    if (!recipe) return;

    const totals = recipe.totals || { kcal: recipe.kcal || 0, protein: recipe.protein || 0, carbs: recipe.carbs || 0, fat: recipe.fat || 0 };
    const perServing = recipe.perServing || totals;
    const s = this.recipeLogServings || 1;
    const mealType = this.targetMealForRecipe || recipe.mealType || 'almuerzo';

    const scaledKcal = Math.round(perServing.kcal * s);
    const scaledProtein = Math.round(perServing.protein * s * 10) / 10;
    const scaledCarbs = Math.round(perServing.carbs * s * 10) / 10;
    const scaledFat = Math.round(perServing.fat * s * 10) / 10;

    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const servingSuffix = s === 1 ? (recipe.servings > 1 ? ' (1 porción)' : '') : ` (${s} porc.)`;

    Storage.addFoodItem(activeDate, mealType, {
      name: `${recipe.icon || '🍽️'} ${recipe.name}${servingSuffix}`,
      kcal: scaledKcal,
      protein: scaledProtein,
      carbs: scaledCarbs,
      fat: scaledFat
    });

    App.closeModal('recipeDetailModal');
    App.closeModal('recipeListModal');
    App.closeModal('foodModal');

    const mealLabels = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena', snacks: 'Snacks' };
    App.showToast(`"${recipe.name}" añadido a ${mealLabels[mealType] || mealType} (+${scaledKcal} kcal) ✅`, 'success');
    this.render();
    if (window.Dashboard) Dashboard.render();
  },

  // Alias para retrocompatibilidad
  promptLogRecipe(recipeId) {
    this.openRecipeDetail(recipeId, this.targetMealForRecipe || this.currentMealType);
  },

  deleteRecipeConfirm(recipeId) {
    if (confirm('¿Eliminar esta receta? Esta acción no se puede deshacer.')) {
      Storage.deleteCustomRecipe(recipeId);
      App.closeModal('recipeDetailModal');
      App.showToast('Receta eliminada', 'info');
      this.renderRecipeList();
    }
  }
};

window.Nutrition = Nutrition;

