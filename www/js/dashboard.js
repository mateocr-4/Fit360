/**
 * Fit360 - Dashboard Module
 */
const Dashboard = {
  chartInstance: null,

  init() {
    this.render();
  },

  render() {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    const settings = Storage.getSettings();
    const goals = settings.goals;

    const nutritionTotals = Storage.calculateNutritionTotals(dayData);
    const cardioTotals = Storage.calculateCardioTotals(dayData);
    const appleFitness = dayData.appleFitness || { activeKcal: 0, steps: 0, exerciseTime: 0 };

    // 1. Balance Calórico
    const totalBurnedActive = appleFitness.activeKcal || cardioTotals.kcal;
    const remainingKcal = Math.max(0, goals.kcal - nutritionTotals.kcal);
    const calPercentage = Math.min(100, Math.round((nutritionTotals.kcal / goals.kcal) * 100));

    // SVG Circle Stroke Dashoffset (Circunferencia = 2 * PI * r = 2 * PI * 68 = 427.25)
    const circumference = 427.25;
    const offset = circumference - (calPercentage / 100) * circumference;

    const circleSvg = document.getElementById('dashCalorieProgress');
    if (circleSvg) {
      circleSvg.style.strokeDashoffset = offset;
    }

    const calConsumedEl = document.getElementById('dashCalConsumed');
    if (calConsumedEl) calConsumedEl.innerText = nutritionTotals.kcal.toLocaleString();

    const calGoalEl = document.getElementById('dashCalGoal');
    if (calGoalEl) calGoalEl.innerText = goals.kcal.toLocaleString();

    const calRemainingEl = document.getElementById('dashCalRemaining');
    if (calRemainingEl) calRemainingEl.innerText = remainingKcal.toLocaleString();

    // 2. Macronutrientes
    this.renderMacroBar('dashProtein', nutritionTotals.protein, goals.protein, 'g');
    this.renderMacroBar('dashCarbs', nutritionTotals.carbs, goals.carbs, 'g');
    this.renderMacroBar('dashFat', nutritionTotals.fat, goals.fat, 'g');

    // 3. Apple Fitness 3-Rings Widget
    const appleKcalEl = document.getElementById('dashAppleKcal');
    if (appleKcalEl) appleKcalEl.innerText = (appleFitness.activeKcal || 0) + ' kcal';
    
    const appleStepsEl = document.getElementById('dashAppleSteps');
    if (appleStepsEl) appleStepsEl.innerText = (appleFitness.steps || 0).toLocaleString() + ' pasos';

    const appleTimeEl = document.getElementById('dashAppleTime');
    if (appleTimeEl) appleTimeEl.innerText = (appleFitness.exerciseTime || 0) + ' min';

    const appleStandEl = document.getElementById('dashAppleStand');
    if (appleStandEl) appleStandEl.innerText = (appleFitness.standHours || 10) + ' hrs';

    // Cálculo de los 3 anillos de Apple Fitness
    const moveGoal = goals.appleMoveKcal || 650;
    const movePct = Math.min(1.5, (appleFitness.activeKcal || 0) / moveGoal);
    const moveCirc = 276.46; // 2 * PI * 44
    const moveOffset = Math.max(0, moveCirc - movePct * moveCirc);
    const ringMove = document.getElementById('appleRingMove');
    if (ringMove) ringMove.style.strokeDashoffset = moveOffset;

    const exerciseGoal = goals.appleExerciseMin || 30;
    const exercisePct = Math.min(1.5, (appleFitness.exerciseTime || 0) / exerciseGoal);
    const exerciseCirc = 201.06; // 2 * PI * 32
    const exerciseOffset = Math.max(0, exerciseCirc - exercisePct * exerciseCirc);
    const ringExercise = document.getElementById('appleRingExercise');
    if (ringExercise) ringExercise.style.strokeDashoffset = exerciseOffset;

    const standGoal = goals.appleStandHours || 12;
    const standPct = Math.min(1.5, (appleFitness.standHours || 10) / standGoal);
    const standCirc = 125.66; // 2 * PI * 20
    const standOffset = Math.max(0, standCirc - standPct * standCirc);
    const ringStand = document.getElementById('appleRingStand');
    if (ringStand) ringStand.style.strokeDashoffset = standOffset;

    // 4. Báscula Digital & Peso (Renpho / Apple Salud)
    this.renderWeightWidget();

    // 5. Resumen de Entrenamientos de Hoy
    this.renderTodayWorkouts(dayData);

    // 6. Gráfico semanal
    this.renderWeeklyChart();
  },

  renderWeightWidget() {
    const latest = Storage.getLatestWeightLog();
    const diffInfo = Storage.getWeightDifference();

    const weightValEl = document.getElementById('dashRenphoWeight');
    const fatValEl = document.getElementById('dashRenphoFat');
    const diffBadgeEl = document.getElementById('dashRenphoDiff');
    const dateEl = document.getElementById('dashRenphoDate');

    if (latest.weight === '--' || !latest.weight) {
      if (weightValEl) weightValEl.innerText = '-- kg';
      if (fatValEl) fatValEl.innerText = 'Grasa: --';
      if (dateEl) dateEl.innerText = 'Sin registros aún (Toca para sincronizar)';
      if (diffBadgeEl) {
        diffBadgeEl.className = 'chip chip-cyan';
        diffBadgeEl.innerText = '⚖️ Sin datos';
      }
      return;
    }

    if (weightValEl) {
      weightValEl.innerText = `${latest.weight} kg`;
    }

    if (fatValEl) {
      fatValEl.innerText = latest.fatPct ? `${latest.fatPct}% grasa` : 'Grasa: --';
    }

    if (dateEl) {
      dateEl.innerText = `Medido: ${latest.date} ${latest.time || ''}`;
    }

    if (diffBadgeEl) {
      if (diffInfo.diff === 0 || diffInfo.prevWeight === null) {
        diffBadgeEl.className = 'chip chip-cyan';
        diffBadgeEl.innerText = '⚖️ Estable';
      } else if (diffInfo.diff < 0) {
        diffBadgeEl.className = 'chip chip-lime';
        diffBadgeEl.innerText = `📉 ${diffInfo.diff} kg`;
      } else {
        diffBadgeEl.className = 'chip chip-orange';
        diffBadgeEl.innerText = `📈 +${diffInfo.diff} kg`;
      }
    }
  },

  renderMacroBar(idPrefix, current, goal, unit) {
    const valEl = document.getElementById(idPrefix + 'Val');
    const targetEl = document.getElementById(idPrefix + 'Target');
    const barEl = document.getElementById(idPrefix + 'Bar');

    if (valEl) valEl.innerText = `${current}${unit}`;
    if (targetEl) targetEl.innerText = `Meta: ${goal}${unit}`;

    const percent = Math.min(100, Math.round((current / goal) * 100));
    if (barEl) barEl.style.width = `${percent}%`;
  },

  renderTodayWorkouts(dayData) {
    const container = document.getElementById('dashWorkoutsSummary');
    if (!container) return;

    const gymCount = (dayData.gym || []).length;
    const cardioCount = (dayData.cardio || []).length;

    if (gymCount === 0 && cardioCount === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🛋️</div>
          <p style="font-size: 0.9rem; font-weight: 600;">Sin entrenamientos registrados hoy</p>
          <p style="font-size: 0.78rem; margin-top: 4px;">Usa los botones inferiores para registrar tu sesión de gym o cardio.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Gym summary
    if (gymCount > 0) {
      let totalSets = 0;
      dayData.gym.forEach(e => { totalSets += (e.sets ? e.sets.length : 0); });
      html += `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 12px; margin-bottom: 8px;">
          <div class="flex-between">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">🏋️‍♂️</span>
              <div>
                <h4 style="font-size: 0.9rem;">Fuerza & Gimnasio</h4>
                <p style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 600;">${gymCount} ejercicios · ${totalSets} series completadas</p>
              </div>
            </div>
            <button class="pill pill-cyan" onclick="App.navigateTo('gym')">Ver Sesión</button>
          </div>
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
            ${dayData.gym.map(e => {
              let kpiText = '';
              if (e.sets && e.sets.length > 0) {
                const s = e.sets[0];
                if (s.time) kpiText = ` (${s.time}s)`;
                else if (s.weight !== undefined && s.reps !== undefined) kpiText = ` (${s.weight}kg × ${s.reps})`;
                else if (s.reps !== undefined) kpiText = ` (${s.reps} reps)`;
                else if (s.distance !== undefined) kpiText = ` (${s.distance}m)`;
              }
              return `<span style="font-size: 0.75rem; background: rgba(0,242,254,0.08); border: 1px solid rgba(0,242,254,0.15); padding: 3px 8px; border-radius: var(--radius-xs); color: #e2e8f0;">${e.name} <strong style="color: var(--accent-cyan);">${kpiText}</strong></span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Cardio summary
    if (cardioCount > 0) {
      const cardioTotals = Storage.calculateCardioTotals(dayData);
      html += `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 12px;">
          <div class="flex-between">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">🏃‍♂️</span>
              <div>
                <h4 style="font-size: 0.9rem;">Cardio & Resistencia</h4>
                <p style="font-size: 0.75rem; color: var(--accent-lime); font-weight: 600;">${cardioTotals.minutes} min · ${cardioTotals.kcal} kcal quemadas</p>
              </div>
            </div>
            <button class="pill pill-lime" onclick="App.navigateTo('cardio')">Ver Detalles</button>
          </div>
          <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
            ${dayData.cardio.map(c => {
              let icon = c.type === 'elliptical' ? '⚡ Elíptica' : (c.type === 'treadmill' ? '🏃 Cinta' : '🚴 Bici');
              let extra = '';
              if (c.type === 'elliptical') extra = `· Resistencia ${c.resistance}/25`;
              if (c.type === 'treadmill') extra = `· Inclinación ${c.incline}% · ${c.speed} km/h`;
              return `<div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
                <span><strong>${icon}:</strong> ${c.duration} min ${extra}</span>
                <span style="color: var(--accent-lime); font-weight: 700;">+${c.kcal} kcal</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  renderWeeklyChart() {
    const canvas = document.getElementById('weeklyTrendChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Obtener los últimos 7 días
    const dates = [];
    const calData = [];
    const burnedData = [];
    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const displayLabels = [];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = Storage.formatDate(d);
      dates.push(dateKey);

      displayLabels.push(i === 0 ? 'Hoy' : labels[d.getDay()]);

      const data = Storage.getDayData(dateKey);
      const nut = Storage.calculateNutritionTotals(data);
      const cardio = Storage.calculateCardioTotals(data);
      const apple = data.appleFitness ? Number(data.appleFitness.activeKcal) || 0 : 0;

      calData.push(nut.kcal);
      burnedData.push(Math.max(apple, cardio.kcal));
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Gradientes
    const gradCyan = ctx.createLinearGradient(0, 0, 0, 180);
    gradCyan.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
    gradCyan.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

    const gradRed = ctx.createLinearGradient(0, 0, 0, 180);
    gradRed.addColorStop(0, 'rgba(250, 17, 79, 0.35)');
    gradRed.addColorStop(1, 'rgba(250, 17, 79, 0.0)');

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [
          {
            label: 'Consumidas (kcal)',
            data: calData,
            borderColor: '#00f2fe',
            backgroundColor: gradCyan,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#00f2fe',
            pointBorderColor: '#0a0c14',
            pointBorderWidth: 2
          },
          {
            label: 'Activas / Quemadas (kcal)',
            data: burnedData,
            borderColor: '#fa114f',
            backgroundColor: gradRed,
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 3,
            pointBackgroundColor: '#fa114f'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' },
              boxWidth: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(16, 20, 34, 0.95)',
            titleColor: '#fff',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(0, 242, 254, 0.3)',
            borderWidth: 1,
            padding: 10,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } }
          }
        }
      }
    });
  }
};

window.Dashboard = Dashboard;
