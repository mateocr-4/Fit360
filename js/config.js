/**
 * Fit360 — Configuración Central del Cliente
 * 
 * Contiene los parámetros públicos para la conexión a Supabase y Google AdMob.
 * NOTA DE SEGURIDAD: Solo se deben colocar claves públicas/anónimas en este archivo.
 * NUNCA incluir 'service_role_key' ni contraseñas maestras aquí.
 */

window.FIT360_CONFIG = {
  // Configuración de Supabase (Backend & Database)
  supabase: {
    // Reemplaza con la URL de tu proyecto Supabase (ej: 'https://xyzcompany.supabase.co')
    url: 'https://TU_PROYECTO_ID.supabase.co',
    // Reemplaza con tu clave pública anónima (anon public key)
    anonKey: 'TU_SUPABASE_ANON_KEY',
    // Habilitar o deshabilitar sincronización en la nube
    syncEnabled: true,
    // Intervalo de reintento de sincronización en ms (30 segundos)
    syncIntervalMs: 30000
  },

  // Configuración de Monetización (Google AdMob)
  ads: {
    // App ID oficial de AdMob para iOS (debe coincidir con GADApplicationIdentifier en Info.plist)
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    
    // IDs de bloques de anuncios (Ad Units)
    // Para desarrollo/pruebas, utiliza los IDs de test oficiales de Google:
    units: {
      // Banner adaptable inferior
      // ID de test Google: 'ca-app-pub-3940256099942544/2934735716'
      banner: 'ca-app-pub-3940256099942544/2934735716',
      
      // Intersticial entre pantallas (post-entrenamiento / guardado)
      // ID de test Google: 'ca-app-pub-3940256099942544/4411468910'
      interstitial: 'ca-app-pub-3940256099942544/4411468910'
    },

    // Activar modo pruebas (isTesting = true fuerza anuncios de muestra sin penalización)
    isTesting: true,

    // Frecuencia mínima entre anuncios intersticiales (en minutos)
    interstitialCooldownMin: 5
  },

  // Versión de la aplicación
  version: '1.1.0'
};
