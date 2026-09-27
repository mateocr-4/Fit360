/**
 * Fit360 - Social & Community Module
 * Gestiona amigos, perfiles comunitarios, intercambio de rutinas y recetas mediante QR, códigos y Web Share.
 */
var Storage = window.FitStorage || window.Storage;

const Social = {
  currentTab: 'friends', // 'friends' | 'add' | 'import'
  activeFriend: null,

  init() {
    this.render();
    this.checkDeepLinkShare();
  },

  setTab(tab) {
    this.currentTab = tab;
    const tabs = ['friends', 'add', 'import'];
    tabs.forEach(t => {
      const btn = document.getElementById(`socialTabBtn_${t}`);
      const content = document.getElementById(`socialTabContent_${t}`);
      if (btn) btn.classList.toggle('active', t === tab);
      if (content) content.style.display = (t === tab) ? 'block' : 'none';
    });

    if (tab === 'friends') this.renderFriendsList();
    if (tab === 'add') this.renderAddTab();
  },

  render() {
    this.setTab(this.currentTab);
  },

  // --- RENDERIZADO DE LA LISTA DE AMIGOS ---
  renderFriendsList() {
    const container = document.getElementById('socialFriendsList');
    if (!container) return;

    const friends = Storage.getFriends();
    const countBadge = document.getElementById('socialFriendsCount');
    if (countBadge) countBadge.innerText = friends.length;

    if (friends.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">👥</div>
          <h4 style="color: #fff; margin-bottom: 6px;">Aún no tienes amigos añadidos</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
            Comparte tu FitID o añade el de tus amigos para intercambiar rutinas y recetas fitness.
          </p>
          <button class="btn btn-primary" onclick="Social.setTab('add')" style="font-size: 0.85rem; padding: 8px 18px;">
            + Añadir mi Primer Amigo
          </button>
        </div>
      `;
      return;
    }

    const esc = window.Security ? Security.escapeHTML : (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    container.innerHTML = friends.map(friend => {
      const routineCount = friend.routines ? friend.routines.length : 0;
      const recipeCount = friend.recipes ? friend.recipes.length : 0;
      const streak = friend.stats?.streak || 0;
      const safeName = esc(friend.name);
      const safeTag = esc(friend.tag || 'Amigo Fit360');
      const safeFitId = esc(friend.fitId);
      const safeAvatar = esc(friend.avatar || '👤');
      const safeId = esc(friend.id);

      return `
        <div class="card social-friend-card" onclick="Social.openFriendProfile('${safeId}')">
          <div class="flex-between" style="align-items: center; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="friend-avatar-circle">
                <span>${safeAvatar}</span>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="color: #fff; font-size: 0.95rem;">${safeName}</strong>
                  ${streak > 0 ? `<span class="pill pill-lime" style="font-size: 0.62rem;">🔥 ${streak}d racha</span>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <span style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 500;">${safeTag}</span>
                  <span style="font-size: 0.68rem; color: var(--text-muted);">•</span>
                  <span style="font-size: 0.68rem; color: var(--text-muted); font-family: monospace;">${safeFitId}</span>
                </div>
              </div>
            </div>

            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span class="btn-icon-soft" style="width: 28px; height: 28px; font-size: 0.8rem; color: var(--accent-cyan);">
                ›
              </span>
              <div style="display: flex; gap: 6px; font-size: 0.7rem; color: var(--text-secondary);">
                <span>🏋️‍♂️ ${routineCount}</span>
                <span>🍲 ${recipeCount}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // --- RENDERIZADO DE LA PESTAÑA AÑADIR ---
  renderAddTab() {
    const myId = Storage.getMyFitId();
    const myFitIdEl = document.getElementById('myFitIdDisplay');
    if (myFitIdEl) myFitIdEl.innerText = myId;
  },

  copyMyFitId() {
    const myId = Storage.getMyFitId();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(myId).then(() => {
        if (window.App && App.showToast) App.showToast('¡Tu FitID ha sido copiado! 📋');
      }).catch(() => {
        this.fallbackCopyText(myId);
      });
    } else {
      this.fallbackCopyText(myId);
    }
  },

  shareMyProfile() {
    const myId = Storage.getMyFitId();
    const myName = Storage.getSettings()?.profile?.name || 'Mateo';
    const text = `¡Hola! Entrena conmigo en Fit360. Mi FitID es: ${myId}. Agrégame para compartir nuestras rutinas de gym y recetas fitness.`;

    if (navigator.share) {
      navigator.share({
        title: `Perfil Fit360 de ${myName}`,
        text: text
      }).catch(() => {});
    } else {
      this.copyMyFitId();
    }
  },

  handleAddFriendSubmit() {
    const input = document.getElementById('inputAddFriendId');
    if (!input) return;
    const query = input.value.trim();

    if (!query) {
      if (window.App && App.showToast) App.showToast('Introduce un FitID o nombre');
      return;
    }

    // Buscar si existe en presets o crear amigo nuevo
    const allPresets = Storage.DEFAULT_FRIENDS;
    const found = allPresets.find(p => p.fitId.toLowerCase() === query.toLowerCase() || p.name.toLowerCase().includes(query.toLowerCase()));

    if (found) {
      Storage.addFriend(found);
      input.value = '';
      if (window.App && App.showToast) App.showToast(`¡${found.name} añadido a tus amigos! 🎉`);
      this.setTab('friends');
      return;
    }

    // Si es un ID personalizado nuevo:
    const newFriend = {
      name: query.replace(/^FIT-/i, '').replace(/-\d+$/, '') || 'Nuevo Amigo',
      fitId: query.startsWith('FIT-') ? query.toUpperCase() : `FIT-${query.toUpperCase().slice(0,6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: '🏋️',
      tag: 'Comunidad Fit360',
      bio: 'Amigo añadido mediante FitID.',
      stats: { streak: 1, workouts: 12, followers: 1 },
      routines: [],
      recipes: []
    };

    Storage.addFriend(newFriend);
    input.value = '';
    if (window.App && App.showToast) App.showToast(`¡Amigo ${newFriend.name} añadido con éxito!`);
    this.setTab('friends');
  },

  // --- PERFIL DE AMIGO MODAL ---
  openFriendProfile(friendId) {
    const friend = Storage.getFriendById(friendId);
    if (!friend) return;
    this.activeFriend = friend;

    // Poblar modal
    const avatarEl = document.getElementById('friendModalAvatar');
    const nameEl = document.getElementById('friendModalName');
    const tagEl = document.getElementById('friendModalTag');
    const fitIdEl = document.getElementById('friendModalFitId');
    const bioEl = document.getElementById('friendModalBio');
    const streakEl = document.getElementById('friendModalStreak');
    const workoutsEl = document.getElementById('friendModalWorkouts');

    if (avatarEl) avatarEl.innerText = friend.avatar || '👤';
    if (nameEl) nameEl.innerText = friend.name;
    if (tagEl) tagEl.innerText = friend.tag || 'Comunidad Fit360';
    if (fitIdEl) fitIdEl.innerText = friend.fitId;
    if (bioEl) bioEl.innerText = friend.bio || 'Sin biografía disponible.';
    if (streakEl) streakEl.innerText = (friend.stats?.streak || 0) + 'd';
    if (workoutsEl) workoutsEl.innerText = friend.stats?.workouts || 0;

    // Renderizar rutinas del amigo
    this.renderFriendRoutines(friend);
    // Renderizar recetas del amigo
    this.renderFriendRecipes(friend);

    // Activar tab de rutinas por defecto
    this.setFriendSubTab('routines');

    if (window.App && App.openModal) App.openModal('modalFriendProfile');
  },

  setFriendSubTab(subTab) {
    const btnRoutines = document.getElementById('friendSubTabBtn_routines');
    const btnRecipes = document.getElementById('friendSubTabBtn_recipes');
    const contentRoutines = document.getElementById('friendSubContent_routines');
    const contentRecipes = document.getElementById('friendSubContent_recipes');

    if (btnRoutines) btnRoutines.classList.toggle('active', subTab === 'routines');
    if (btnRecipes) btnRecipes.classList.toggle('active', subTab === 'recipes');
    if (contentRoutines) contentRoutines.style.display = (subTab === 'routines') ? 'block' : 'none';
    if (contentRecipes) contentRecipes.style.display = (subTab === 'recipes') ? 'block' : 'none';
  },

  renderFriendRoutines(friend) {
    const container = document.getElementById('friendRoutinesList');
    if (!container) return;

    const routines = friend.routines || [];
    if (routines.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 25px 15px; color: var(--text-muted); font-size: 0.85rem;">
          Este amigo aún no ha compartido rutinas.
        </div>
      `;
      return;
    }

    container.innerHTML = routines.map((r, idx) => {
      const exList = r.exercises || [];
      return `
        <div class="card routine-card-item" style="margin-bottom: 10px; padding: 12px 14px;">
          <div class="flex-between" style="align-items: flex-start; gap: 8px;">
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="font-size: 1.6rem;">${r.icon || '🏋️‍♂️'}</span>
              <div>
                <strong style="color: #fff; font-size: 0.92rem;">${r.name}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                  ${exList.length} ejercicios • ${r.category || 'Fuerza'}
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="Social.shareRoutineObj('${friend.id}', ${idx})" title="Compartir con otros">
                📤
              </button>
              <button class="btn btn-primary btn-sm" onclick="Social.importRoutineFromFriend('${friend.id}', ${idx})">
                📥 Importar
              </button>
            </div>
          </div>

          ${r.description ? `
            <p style="font-size: 0.76rem; color: var(--text-secondary); margin: 8px 0 6px 0; font-style: italic;">
              "${r.description}"
            </p>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
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

  renderFriendRecipes(friend) {
    const container = document.getElementById('friendRecipesList');
    if (!container) return;

    const recipes = friend.recipes || [];
    if (recipes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 25px 15px; color: var(--text-muted); font-size: 0.85rem;">
          Este amigo aún no ha compartido recetas.
        </div>
      `;
      return;
    }

    container.innerHTML = recipes.map((rc, idx) => {
      return `
        <div class="card" style="margin-bottom: 10px; padding: 12px 14px;">
          <div class="flex-between" style="align-items: flex-start; gap: 8px;">
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="font-size: 1.6rem;">${rc.icon || '🍲'}</span>
              <div>
                <strong style="color: #fff; font-size: 0.92rem;">${rc.name}</strong>
                <div style="font-size: 0.72rem; color: var(--accent-lime); font-weight: 600; margin-top: 2px;">
                  ⚡ ${rc.kcal} kcal • P: ${rc.protein}g • C: ${rc.carbs}g • G: ${rc.fat}g
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="Social.shareRecipeObj('${friend.id}', ${idx})" title="Compartir con otros">
                📤
              </button>
              <button class="btn btn-primary btn-sm" onclick="Social.importRecipeFromFriend('${friend.id}', ${idx})">
                📥 Importar
              </button>
            </div>
          </div>

          <!-- Ingredientes chips -->
          <div style="margin-top: 8px; font-size: 0.74rem; color: var(--text-secondary);">
            <strong>Ingredientes:</strong> ${(rc.ingredients || []).join(', ')}
          </div>

          ${rc.instructions ? `
            <div style="margin-top: 6px; font-size: 0.72rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: var(--radius-sm);">
              💡 <em>${rc.instructions}</em>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  // --- IMPORTAR DESDE AMIGO ---
  importRoutineFromFriend(friendId, routineIndex) {
    const friend = Storage.getFriendById(friendId);
    if (!friend || !friend.routines[routineIndex]) return;

    const sourceRoutine = friend.routines[routineIndex];
    const newRoutine = {
      ...JSON.parse(JSON.stringify(sourceRoutine)),
      id: 'routine_' + Date.now(),
      name: `${sourceRoutine.name} (de ${friend.name})`,
      isCustom: true,
      importedFrom: friend.name,
      updatedAt: new Date().toISOString()
    };

    Storage.saveCustomRoutine(newRoutine);
    if (window.Gym && Gym.renderOrganizerRoutinesList) {
      Gym.renderOrganizerRoutinesList();
    }

    if (window.App && App.showToast) {
      App.showToast(`¡Rutina guardada en tu Gym! 🏋️‍♂️`);
    }
  },

  importRecipeFromFriend(friendId, recipeIndex) {
    const friend = Storage.getFriendById(friendId);
    if (!friend || !friend.recipes[recipeIndex]) return;

    const sourceRecipe = friend.recipes[recipeIndex];
    const newRecipe = {
      ...JSON.parse(JSON.stringify(sourceRecipe)),
      id: 'recipe_' + Date.now(),
      name: `${sourceRecipe.name} (de ${friend.name})`,
      importedFrom: friend.name,
      updatedAt: new Date().toISOString()
    };

    Storage.saveCustomRecipe(newRecipe);

    // Opcional: preguntar si quiere añadirla a su día actual
    this.promptAddRecipeToDailyNutrition(newRecipe);
  },

  promptAddRecipeToDailyNutrition(recipe) {
    const activeDate = window.App ? window.App.currentDate : Storage.formatDate();
    const foodItem = {
      id: 'food_' + Date.now(),
      name: recipe.name,
      kcal: recipe.kcal,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      note: `Receta de ${recipe.importedFrom || 'amigo'}`
    };

    // Añadir al almuerzo o comida elegida
    Storage.addFoodItem(activeDate, 'almuerzo', foodItem);
    if (window.Nutrition && Nutrition.render) Nutrition.render();
    if (window.Dashboard && Dashboard.updateCaloriesSummary) Dashboard.updateCaloriesSummary();

    if (window.App && App.showToast) {
      App.showToast(`¡Receta guardada y añadida al Almuerzo de hoy! 🥗`);
    }
  },

  // --- MODAL DE COMPARTIR UNIVERSAL (QR + CÓDIGO + NATIVE SHARE) ---
  openShareModal(title, type, data) {
    const code = Storage.encodeSharePayload(type, data);
    if (!code) {
      if (window.App && App.showToast) App.showToast('Error generando código de compartición');
      return;
    }

    const modalTitle = document.getElementById('shareModalTitle');
    const modalSubtitle = document.getElementById('shareModalSubtitle');
    const codeBox = document.getElementById('shareModalCodeDisplay');
    const canvas = document.getElementById('shareQrCanvas');

    if (modalTitle) modalTitle.innerText = title || 'Compartir con Amigos';
    if (modalSubtitle) {
      modalSubtitle.innerText = type === 'routine' ? 'Tu amigo podrá importar esta rutina en su Fit360 al instante.' : 'Tu amigo podrá importar esta receta con sus macros calculados.';
    }
    if (codeBox) codeBox.innerText = code;

    // Dibujar Código QR en el Canvas
    if (canvas && window.FitQR) {
      try {
        FitQR.drawToCanvas(canvas, code, { size: 190, dark: '#0a0c14', light: '#ffffff' });
      } catch (e) {
        console.error('Error drawing QR:', e);
      }
    }

    // Guardar referencia actual para botones
    this.currentShareData = { title, type, code, data };

    if (window.App && App.openModal) App.openModal('modalShareItem');
  },

  copyShareCode() {
    if (!this.currentShareData?.code) return;
    const code = this.currentShareData.code;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        if (window.App && App.showToast) App.showToast('¡Código copiado al portapapeles! 📋');
      }).catch(() => {
        this.fallbackCopyText(code);
      });
    } else {
      this.fallbackCopyText(code);
    }
  },

  shareViaNative() {
    if (!this.currentShareData) return;
    const { title, type, code, data } = this.currentShareData;
    const itemName = data?.name || 'Rutina/Receta';
    const typeLabel = type === 'routine' ? 'rutina de gym' : 'receta fitness';

    const text = `Te comparto mi ${typeLabel} "${itemName}" en Fit360.\n\nCódigo para importar en tu app:\n${code}`;

    if (navigator.share) {
      navigator.share({
        title: `Fit360 - ${title}`,
        text: text
      }).catch(() => {});
    } else {
      this.copyShareCode();
    }
  },

  fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (window.App && App.showToast) App.showToast('¡Copiado con éxito! 📋');
  },

  // Accesos directos de compartición
  shareRoutineObj(friendId, routineIdx) {
    const friend = Storage.getFriendById(friendId);
    if (!friend || !friend.routines[routineIdx]) return;
    const routine = friend.routines[routineIdx];
    this.openShareModal(`Compartir "${routine.name}"`, 'routine', routine);
  },

  shareRecipeObj(friendId, recipeIdx) {
    const friend = Storage.getFriendById(friendId);
    if (!friend || !friend.recipes[recipeIdx]) return;
    const recipe = friend.recipes[recipeIdx];
    this.openShareModal(`Compartir "${recipe.name}"`, 'recipe', recipe);
  },

  shareCustomRoutineById(routineId) {
    const routines = Storage.getAllRoutines();
    const r = routines.find(item => item.id === routineId);
    if (!r) return;
    this.openShareModal(`Compartir Rutina: ${r.name}`, 'routine', r);
  },

  shareCustomRecipeById(recipeId) {
    const recipes = Storage.getCustomRecipes();
    const rc = recipes.find(item => item.id === recipeId);
    if (!rc) return;
    this.openShareModal(`Compartir Receta: ${rc.name}`, 'recipe', rc);
  },

  // --- IMPORTADOR DE CÓDIGOS MANUAL & DEEP LINK ---
  handleManualImport() {
    const input = document.getElementById('inputImportCode');
    if (!input) return;
    const rawCode = input.value.trim();

    if (!rawCode) {
      if (window.App && App.showToast) App.showToast('Pega un código de rutina o receta');
      return;
    }

    const payload = Storage.decodeSharePayload(rawCode);
    if (!payload || !payload.data) {
      if (window.App && App.showToast) App.showToast('Código no válido o corrupto ⚠️');
      return;
    }

    this.openImportPreview(payload);
    input.value = '';
  },

  openImportPreview(payload) {
    this.pendingImportPayload = payload;
    const isRoutine = payload.type === 'routine';
    const data = payload.data || {};

    const typeBadge = document.getElementById('importPreviewTypeBadge');
    const authorEl = document.getElementById('importPreviewAuthor');
    const titleEl = document.getElementById('importPreviewTitle');
    const detailsContainer = document.getElementById('importPreviewDetails');
    const btnConfirm = document.getElementById('btnConfirmImport');

    if (typeBadge) {
      typeBadge.className = isRoutine ? 'pill pill-cyan' : 'pill pill-lime';
      typeBadge.innerText = isRoutine ? 'Rutina de Gym' : 'Receta de Nutrición';
    }

    if (authorEl) {
      authorEl.innerText = `Creado por ${payload.author || 'Usuario'} (${payload.fitId || 'Fit360'})`;
    }

    if (titleEl) {
      titleEl.innerText = `${data.icon || (isRoutine ? '🏋️‍♂️' : '🍲')} ${data.name || 'Sin título'}`;
    }

    if (detailsContainer) {
      if (isRoutine) {
        const exercises = data.exercises || [];
        detailsContainer.innerHTML = `
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">
            Categoría: <strong>${data.category || 'Fuerza'}</strong> • ${exercises.length} ejercicios
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${exercises.map(e => `
              <div style="background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #fff; font-size: 0.82rem; font-weight: 500;">${e.name}</span>
                <span style="color: var(--accent-cyan); font-size: 0.74rem;">${(e.sets || []).length} series</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        detailsContainer.innerHTML = `
          <div style="background: rgba(0, 245, 155, 0.08); border: 1px solid rgba(0, 245, 155, 0.2); padding: 10px; border-radius: var(--radius-sm); margin-bottom: 10px;">
            <div style="font-size: 0.95rem; font-weight: bold; color: var(--accent-lime); margin-bottom: 4px;">
              ⚡ ${data.kcal || 0} kcal
            </div>
            <div style="display: flex; gap: 12px; font-size: 0.75rem; color: #fff;">
              <span>Proteínas: <strong>${data.protein || 0}g</strong></span>
              <span>Carbos: <strong>${data.carbs || 0}g</strong></span>
              <span>Grasas: <strong>${data.fat || 0}g</strong></span>
            </div>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">
            <strong>Ingredientes:</strong> ${(data.ingredients || []).join(', ') || 'No especificados'}
          </div>
        `;
      }
    }

    if (btnConfirm) {
      btnConfirm.innerText = isRoutine ? '📥 Guardar en mis Rutinas' : '📥 Guardar en mis Recetas';
    }

    if (window.App && App.openModal) App.openModal('modalImportPreview');
  },

  confirmPendingImport() {
    if (!this.pendingImportPayload) return;
    const { type, author, data } = this.pendingImportPayload;

    if (type === 'routine') {
      const newRoutine = {
        ...JSON.parse(JSON.stringify(data)),
        id: 'routine_' + Date.now(),
        name: `${data.name} (de ${author || 'Amigo'})`,
        isCustom: true,
        importedFrom: author,
        updatedAt: new Date().toISOString()
      };
      Storage.saveCustomRoutine(newRoutine);
      if (window.Gym && Gym.renderOrganizerRoutinesList) Gym.renderOrganizerRoutinesList();
      if (window.App && App.showToast) App.showToast(`¡Rutina "${newRoutine.name}" guardada con éxito!`);
    } else {
      const newRecipe = {
        ...JSON.parse(JSON.stringify(data)),
        id: 'recipe_' + Date.now(),
        name: `${data.name} (de ${author || 'Amigo'})`,
        importedFrom: author,
        updatedAt: new Date().toISOString()
      };
      Storage.saveCustomRecipe(newRecipe);
      if (window.App && App.showToast) App.showToast(`¡Receta "${newRecipe.name}" guardada con éxito!`);
    }

    if (window.App && App.closeModal) App.closeModal('modalImportPreview');
    this.pendingImportPayload = null;
  },

  checkDeepLinkShare() {
    const hash = window.location.hash;
    if (hash && hash.includes('#share=')) {
      const code = hash.split('#share=')[1];
      if (code) {
        setTimeout(() => {
          const payload = Storage.decodeSharePayload(code);
          if (payload) this.openImportPreview(payload);
        }, 600);
      }
    }
  }
};

window.Social = Social;
