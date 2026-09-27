/**
 * Fit360 — Supabase Client & Synchronization Engine (Offline-First)
 * 
 * Gestiona la autenticación de usuarios (Sign in with Apple / Email),
 * la conexión a la base de datos PostgreSQL en la nube, y una cola
 * de sincronización resiliente que permite operar 100% offline y
 * sincronizar cambios automáticamente al recuperar conexión.
 */

var SupabaseClient = {
  client: null,
  currentUser: null,
  isSyncing: false,
  lastSyncedAt: null,
  syncQueueKey: 'fit360_cloud_sync_queue',

  // Inicializar cliente
  init() {
    try {
      if (!window.FIT360_CONFIG || !window.FIT360_CONFIG.supabase) {
        console.warn('[Supabase] FIT360_CONFIG no definido.');
        return;
      }

      const { url, anonKey } = window.FIT360_CONFIG.supabase;
      if (!url || !anonKey || url.includes('TU_PROYECTO_ID')) {
        console.info('[Supabase] Claves de proyecto no configuradas todavía. Operando en modo local.');
        return;
      }

      if (window.supabase && typeof window.supabase.createClient === 'function') {
        this.client = window.supabase.createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          }
        });

        // Escuchar cambios de sesión
        this.client.auth.onAuthStateChange((event, session) => {
          this.currentUser = session ? session.user : null;
          this.broadcastStatus();

          if (event === 'SIGNED_IN' && session) {
            console.log('[Supabase] Sesión iniciada:', session.user.id);
            this.processQueue();
          } else if (event === 'SIGNED_OUT') {
            console.log('[Supabase] Sesión cerrada.');
            this.currentUser = null;
          }
        });

        // Obtener sesión activa al arrancar
        this.client.auth.getSession().then(({ data }) => {
          if (data && data.session) {
            this.currentUser = data.session.user;
            this.broadcastStatus();
            this.processQueue();
          }
        }).catch(err => {
          console.warn('[Supabase] Error recuperando sesión inicial:', err);
        });

        // Eventos de conectividad
        window.addEventListener('online', () => {
          console.log('[Supabase] Conexión recuperada. Procesando cola de sincronización...');
          this.processQueue();
        });

        console.log('✅ [Supabase] Cliente inicializado correctamente.');
      } else {
        console.warn('[Supabase] SDK no disponible en window.supabase.');
      }
    } catch (e) {
      console.error('[Supabase] Error al inicializar:', e);
    }
  },

  // Estado del servicio
  isReady() {
    return this.client !== null && this.currentUser !== null;
  },

  broadcastStatus() {
    const detail = {
      isConfigured: this.client !== null,
      isAuthenticated: this.currentUser !== null,
      user: this.currentUser,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt
    };
    window.dispatchEvent(new CustomEvent('fit360:sync_status', { detail }));
  },

  // -------------------------------------------------------------
  // AUTENTICACIÓN
  // -------------------------------------------------------------

  // Registro con Email
  async signUpWithEmail(email, password, fullName = '') {
    if (!this.client) throw new Error('Supabase no configurado.');
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  },

  // Inicio de sesión con Email
  async signInWithEmail(email, password) {
    if (!this.client) throw new Error('Supabase no configurado.');
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    this.currentUser = data.user;
    this.broadcastStatus();
    return data;
  },

  // Inicio de sesión con Apple (Sign in with Apple nativo)
  async signInWithApple(idToken, nonce) {
    if (!this.client) throw new Error('Supabase no configurado.');
    const { data, error } = await this.client.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
      nonce: nonce
    });
    if (error) throw error;
    this.currentUser = data.user;
    this.broadcastStatus();
    return data;
  },

  // Cerrar sesión
  async signOut() {
    if (!this.client) return;
    const { error } = await this.client.auth.signOut();
    this.currentUser = null;
    this.broadcastStatus();
    if (error) throw error;
  },

  // Eliminación completa de cuenta y datos (GDPR / Apple Guideline 5.1.1)
  async deleteAccount() {
    if (!this.client || !this.currentUser) throw new Error('No hay usuario autenticado.');
    const { error } = await this.client.rpc('delete_user_account');
    if (error) throw error;
    await this.signOut();
  },

  // -------------------------------------------------------------
  // COLA Y MOTOR DE SINCRONIZACIÓN (OFFLINE-FIRST)
  // -------------------------------------------------------------

  // Encolar una operación de sincronización
  enqueue(action, table, payload) {
    const queue = this.getQueue();
    queue.push({
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toISOString(),
      action, // 'UPSERT' | 'DELETE'
      table,
      payload
    });
    this.saveQueue(queue);

    // Intentar sincronizar si hay conexión
    if (navigator.onLine && this.isReady()) {
      this.processQueue();
    }
  },

  getQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.syncQueueKey) || '[]');
    } catch {
      return [];
    }
  },

  saveQueue(queue) {
    try {
      localStorage.setItem(this.syncQueueKey, JSON.stringify(queue));
    } catch (e) {
      console.warn('[Supabase] Error guardando cola local:', e);
    }
  },

  // Procesar cola de operaciones pendientes
  async processQueue() {
    if (this.isSyncing || !this.isReady() || !navigator.onLine) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    this.broadcastStatus();

    const remaining = [];
    const userId = this.currentUser.id;

    for (const item of queue) {
      try {
        if (item.action === 'UPSERT') {
          // Inyectar user_id
          const rowData = { ...item.payload };
          if (item.table !== 'user_profiles') {
            rowData.user_id = userId;
          } else {
            rowData.id = userId;
          }

          const { error } = await this.client
            .from(item.table)
            .upsert(rowData);

          if (error) {
            console.error('[Supabase Sync Error]', item.table, error.message);
            remaining.push(item);
          }
        } else if (item.action === 'DELETE') {
          const { error } = await this.client
            .from(item.table)
            .delete()
            .match(item.payload);

          if (error) {
            console.error('[Supabase Sync Delete Error]', item.table, error.message);
            remaining.push(item);
          }
        }
      } catch (err) {
        console.warn('[Supabase Sync Exception]', err);
        remaining.push(item);
      }
    }

    this.saveQueue(remaining);
    this.isSyncing = false;
    this.lastSyncedAt = new Date().toISOString();
    this.broadcastStatus();
  },

  // -------------------------------------------------------------
  // DESCARGA Y RESTAURACIÓN DESDE LA NUBE
  // -------------------------------------------------------------

  // Descargar todos los datos del usuario para restaurar en este dispositivo
  async pullAllRemoteData() {
    if (!this.isReady()) return null;
    const userId = this.currentUser.id;

    try {
      // 1. Perfil
      const { data: profile } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. Registros diarios (últimos 90 días)
      const { data: dailyLogs } = await this.client
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(90);

      // 3. Pesajes
      const { data: weightLogs } = await this.client
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });

      // 4. Rutinas
      const { data: routines } = await this.client
        .from('custom_routines')
        .select('*')
        .eq('user_id', userId);

      // 5. Recetas
      const { data: recipes } = await this.client
        .from('custom_recipes')
        .select('*')
        .eq('user_id', userId);

      // 6. Alimentos Favoritos
      const { data: favorites } = await this.client
        .from('favorite_foods')
        .select('*')
        .eq('user_id', userId);

      return {
        profile,
        dailyLogs,
        weightLogs,
        routines,
        recipes,
        favorites
      };
    } catch (err) {
      console.error('[Supabase] Error descargando datos remotos:', err);
      return null;
    }
  }
};

// Auto-inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    SupabaseClient.init();
  });
}
