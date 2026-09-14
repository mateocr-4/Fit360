/**
 * Fit360 - Analytics & Progress Module
 */
const Analytics = {
  muscleChart: null,
  strengthChart: null,
  weightChart: null,

  init() {
    this.render();
  },

  render() {
    const allData = Storage.getAllDailyData();
    const dates = Object.keys(allData).sort();

    // 1. Calcular totales globales
    let totalKcalBurned = 0;
    let totalWorkouts = 0;
    let totalCardioMinutes = 0;
    let totalVolumeKg = 0;

    const muscleSets = {
      'Pecho': 0,
      'Espalda': 0,
      'Piernas': 0,
      'Hombros': 0,
      'Brazos': 0,
      'Core': 0
    };

    const strengthProgression = {
      bench: [], // { date, maxWeight, est1RM }
      squat: []
    };

    dates.forEach(dateKey => {
      const day = allData[dateKey];
      
      // Gym
      if (day.gym && day.gym.length > 0) {
        totalWorkouts++;
        day.gym.forEach(ex => {
          const cat = ex.category || 'General';
          if (muscleSets[cat] !== undefined) {
            muscleSets[cat] += (ex.sets || []).length;
          }

          (ex.sets || []).forEach(s => {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            if (s.completed) {
              totalVolumeKg += w * r;

              // Check for bench press & squat progression
              if (ex.name.toLowerCase().includes('banca')) {
                const est1RM = Math.round(w * (36 / (37 - Math.min(r, 10))));
                strengthProgression.bench.push({ date: dateKey, weight: w, est1RM });
              }
              if (ex.name.toLowerCase().includes('sentadilla')) {
                const est1RM = Math.round(w * (36 / (37 - Math.min(r, 10))));
                strengthProgression.squat.push({ date: dateKey, weight: w, est1RM });
              }
            }
          });
        });
      }

      // Cardio
      if (day.cardio && day.cardio.length > 0) {
        day.cardio.forEach(c => {
          totalCardioMinutes += Number(c.duration) || 0;
          totalKcalBurned += Number(c.kcal) || 0;
        });
      }

      // Apple fitness
      if (day.appleFitness && day.appleFitness.activeKcal) {
        totalKcalBurned += Number(day.appleFitness.activeKcal) || 0;
      }
    });

    // Update stat cards
    const statKcalEl = document.getElementById('analyticsTotalKcal');
    if (statKcalEl) statKcalEl.innerText = totalKcalBurned.toLocaleString() + ' kcal';

    const statWorkoutsEl = document.getElementById('analyticsTotalWorkouts');
    if (statWorkoutsEl) statWorkoutsEl.innerText = `${totalWorkouts} sesiones`;

    const statVolumeEl = document.getElementById('analyticsTotalVolume');
    if (statVolumeEl) statVolumeEl.innerText = `${Math.round(totalVolumeKg / 1000)} Toneladas`;

    const statCardioEl = document.getElementById('analyticsTotalCardio');
    if (statCardioEl) statCardioEl.innerText = `${Math.round(totalCardioMinutes / 60)}h ${totalCardioMinutes % 60}m`;

    // Render charts
    this.renderMuscleChart(muscleSets);
    this.renderStrengthChart(strengthProgression);
    this.renderWeightChart();
  },

  renderMuscleChart(muscleSets) {
    const canvas = document.getElementById('analyticsMuscleChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.muscleChart) this.muscleChart.destroy();

    const ctx = canvas.getContext('2d');
    this.muscleChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(muscleSets),
        datasets: [{
          data: Object.values(muscleSets),
          backgroundColor: [
            '#00f2fe',
            '#4facfe',
            '#00f59b',
            '#a855f7',
            '#fbbf24',
            '#f43f5e'
          ],
          borderColor: '#0a0c14',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#cbd5e1',
              font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' },
              boxWidth: 10
            }
          }
        },
        cutout: '70%'
      }
    });
  },

  renderStrengthChart(progression) {
    const canvas = document.getElementById('analyticsStrengthChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.strengthChart) this.strengthChart.destroy();

    const benchPoints = progression.bench.slice(-7);
    const labels = benchPoints.map(p => {
      const d = new Date(p.date + 'T00:00:00');
      return `${d.getDate()}/${d.getMonth()+1}`;
    });
    const weights = benchPoints.map(p => p.weight);
    const est1RMs = benchPoints.map(p => p.est1RM);

    const ctx = canvas.getContext('2d');
    this.strengthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
          {
            label: '1RM Estimado (kg)',
            data: est1RMs.length > 0 ? est1RMs : [85, 87.5, 90, 92.5],
            borderColor: '#00f59b',
            backgroundColor: 'rgba(0, 245, 155, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#00f59b'
          },
          {
            label: 'Peso de Serie (kg)',
            data: weights.length > 0 ? weights : [75, 77.5, 80, 82.5],
            borderColor: '#00f2fe',
            borderDash: [5, 5],
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#00f2fe'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 11 } }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
        }
      }
    });
  },

  renderWeightChart() {
    const canvas = document.getElementById('analyticsWeightChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.weightChart) this.weightChart.destroy();

    const logs = Storage.getWeightLogs();
    const settings = Storage.getSettings();
    const targetWeight = settings.profile ? settings.profile.weight : 75;

    // Tomar los últimos 15 pesajes
    const recentLogs = logs.slice(-15);

    const labels = recentLogs.map(l => {
      const parts = l.date.split('-');
      return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : l.date;
    });

    const weights = recentLogs.map(l => l.weight);
    const fatPcts = recentLogs.map(l => l.fatPct !== null ? l.fatPct : null);

    // Actualizar métricas textuales en la vista de analíticas
    const currentWeightEl = document.getElementById('analyticsCurrentWeight');
    const startWeightEl = document.getElementById('analyticsStartWeight');
    const weightDiffEl = document.getElementById('analyticsWeightDiff');
    const avgWeightEl = document.getElementById('analyticsAvgWeight');

    if (recentLogs.length > 0) {
      const first = recentLogs[0].weight;
      const latest = recentLogs[recentLogs.length - 1].weight;
      const diff = Number((latest - first).toFixed(1));
      const avg = Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1));

      if (currentWeightEl) currentWeightEl.innerText = `${latest} kg`;
      if (startWeightEl) startWeightEl.innerText = `${first} kg`;
      if (avgWeightEl) avgWeightEl.innerText = `${avg} kg`;
      if (weightDiffEl) {
        if (diff < 0) {
          weightDiffEl.innerText = `${diff} kg (Bajando)`;
          weightDiffEl.style.color = 'var(--accent-lime)';
        } else if (diff > 0) {
          weightDiffEl.innerText = `+${diff} kg (Subiendo)`;
          weightDiffEl.style.color = '#fb923c';
        } else {
          weightDiffEl.innerText = '0.0 kg (Estable)';
          weightDiffEl.style.color = 'var(--accent-cyan)';
        }
      }
    }

    const ctx = canvas.getContext('2d');
    this.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [
          {
            label: 'Peso Corporal (kg)',
            data: weights.length > 0 ? weights : [75],
            borderColor: '#00f2fe',
            backgroundColor: 'rgba(0, 242, 254, 0.12)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#00f2fe',
            yAxisID: 'y'
          },
          {
            label: '% Grasa Corporal',
            data: fatPcts.some(f => f !== null) ? fatPcts : [],
            borderColor: '#a855f7',
            borderDash: [4, 4],
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#a855f7',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' } }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 0) {
                  return `Peso: ${context.parsed.y} kg`;
                } else {
                  return `Grasa: ${context.parsed.y}%`;
                }
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b' } },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#00f2fe',
              callback: val => `${val} kg`
            }
          },
          y1: {
            type: 'linear',
            display: fatPcts.some(f => f !== null),
            position: 'right',
            grid: { display: false },
            ticks: {
              color: '#a855f7',
              callback: val => `${val}%`
            }
          }
        }
      }
    });
  }
};

window.Analytics = Analytics;
