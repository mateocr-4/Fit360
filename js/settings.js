/**
 * Fit360 - Settings & Goals Module
 */
const Settings = {
  init() {
    this.render();
  },

  render() {
    const settings = Storage.getSettings();
    const goals = settings.goals || {};
    const profile = settings.profile || {};

    // Rellenar campos de metas
    document.getElementById('goalKcalInput').value = goals.kcal || 2300;
    document.getElementById('goalProteinInput').value = goals.protein || 160;
    document.getElementById('goalCarbsInput').value = goals.carbs || 260;
    document.getElementById('goalFatInput').value = goals.fat || 65;
    document.getElementById('goalAppleMoveInput').value = goals.appleMoveKcal || 650;

    // Rellenar perfil
    document.getElementById('profileNameInput').value = profile.name || 'Mateo';
    document.getElementById('profileWeightInput').value = profile.weight || 76;
    document.getElementById('profileHeightInput').value = profile.height || 178;

    // Actualizar sidebar profile
    const sidebarName = document.getElementById('sidebarProfileName');
    if (sidebarName) sidebarName.innerText = profile.name || 'Mateo';
  },

  saveGoals() {
    const settings = Storage.getSettings();
    settings.goals = {
      kcal: Number(document.getElementById('goalKcalInput').value) || 2300,
      protein: Number(document.getElementById('goalProteinInput').value) || 160,
      carbs: Number(document.getElementById('goalCarbsInput').value) || 260,
      fat: Number(document.getElementById('goalFatInput').value) || 65,
      appleMoveKcal: Number(document.getElementById('goalAppleMoveInput').value) || 650
    };

    settings.profile = {
      name: document.getElementById('profileNameInput').value.trim() || 'Mateo',
      weight: Number(document.getElementById('profileWeightInput').value) || 76,
      height: Number(document.getElementById('profileHeightInput').value) || 178
    };

    Storage.saveSettings(settings);
    App.showToast('Metas y perfil actualizados', 'success');
    this.render();

    // Actualizar vistas activas
    if (window.Dashboard) Dashboard.render();
    if (window.Nutrition) Nutrition.render();
  },

  calculateMacros() {
    const weight = Number(document.getElementById('profileWeightInput').value) || 76;
    const height = Number(document.getElementById('profileHeightInput').value) || 178;
    const age = Number(document.getElementById('calcAgeInput')?.value) || 25;
    const activity = Number(document.getElementById('calcActivitySelect')?.value) || 1.55;
    const objective = document.getElementById('calcObjectiveSelect')?.value || 'maintenance';

    // Fórmula Mifflin-St Jeor para TDEE
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    let tdee = Math.round(bmr * activity);

    let targetKcal = tdee;
    if (objective === 'deficit') targetKcal = Math.round(tdee * 0.80); // -20%
    if (objective === 'surplus') targetKcal = Math.round(tdee * 1.15); // +15%

    // Distribución óptima de macros (Fitness / Fuerza)
    const proteinG = Math.round(weight * 2.2); // 2.2g por kg
    const fatG = Math.round(weight * 0.9); // 0.9g por kg
    const proteinKcal = proteinG * 4;
    const fatKcal = fatG * 9;
    const remainingKcal = Math.max(0, targetKcal - (proteinKcal + fatKcal));
    const carbsG = Math.round(remainingKcal / 4);

    // Aplicar a los inputs
    document.getElementById('goalKcalInput').value = targetKcal;
    document.getElementById('goalProteinInput').value = proteinG;
    document.getElementById('goalCarbsInput').value = carbsG;
    document.getElementById('goalFatInput').value = fatG;

    this.saveGoals();
    App.showToast(`Metas calculadas: ${targetKcal} kcal (P: ${proteinG}g, C: ${carbsG}g, G: ${fatG}g)`, 'success');
  },

  exportBackup() {
    Storage.exportData();
    App.showToast('Copia de seguridad descargada', 'success');
  },

  triggerImportFile() {
    document.getElementById('importFileInput').click();
  },

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const success = Storage.importData(content);
      if (success) {
        App.showToast('Datos importados con éxito', 'success');
        this.render();
        if (window.Dashboard) Dashboard.render();
        if (window.Nutrition) Nutrition.render();
        if (window.Gym) Gym.render();
        if (window.Cardio) Cardio.render();
      } else {
        App.showToast('Error al importar el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
  },

  resetAllData() {
    if (confirm('¿Estás seguro de que quieres restablecer los datos de demostración?')) {
      localStorage.removeItem(Storage.KEYS.DATA);
      Storage.seedInitialData();
      App.showToast('Datos restablecidos a los valores por defecto', 'info');
      this.render();
      if (window.Dashboard) Dashboard.render();
      if (window.Nutrition) Nutrition.render();
      if (window.Gym) Gym.render();
      if (window.Cardio) Cardio.render();
    }
  }
};

window.Settings = Settings;
