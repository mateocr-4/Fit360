/**
 * Fit360 — Weather & Ambient Status Module
 * 
 * Gestiona el reloj en tiempo real y el widget meteorológico en la barra superior.
 * Utiliza Open-Meteo API (100% gratuita, sin claves, sin límites, compatible con privacidad)
 * y geolocalización del dispositivo con fallback inteligente y persistencia en caché local.
 */

var Weather = {
  CACHE_KEY: 'fit360_weather_cache',
  COORDS_KEY: 'fit360_weather_coords',
  CITY_KEY: 'fit360_weather_city',
  CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutos

  currentData: null,
  clockTimer: null,
  isRefreshing: false,

  // Códigos meteorológicos estándar WMO
  WMO_MAP: {
    0: { dayIcon: '☀️', nightIcon: '🌙', desc: 'Despejado', condition: 'clear' },
    1: { dayIcon: '🌤️', nightIcon: '☁️', desc: 'Mayormente despejado', condition: 'partly_cloudy' },
    2: { dayIcon: '⛅', nightIcon: '☁️', desc: 'Parcialmente nublado', condition: 'partly_cloudy' },
    3: { dayIcon: '☁️', nightIcon: '☁️', desc: 'Nublado', condition: 'cloudy' },
    45: { dayIcon: '🌫️', nightIcon: '🌫️', desc: 'Niebla', condition: 'fog' },
    48: { dayIcon: '🌫️', nightIcon: '🌫️', desc: 'Niebla con escarcha', condition: 'fog' },
    51: { dayIcon: '🌦️', nightIcon: '🌧️', desc: 'Llovizna ligera', condition: 'drizzle' },
    53: { dayIcon: '🌦️', nightIcon: '🌧️', desc: 'Llovizna moderada', condition: 'drizzle' },
    55: { dayIcon: '🌧️', nightIcon: '🌧️', desc: 'Llovizna densa', condition: 'drizzle' },
    61: { dayIcon: '🌧️', nightIcon: '🌧️', desc: 'Lluvia ligera', condition: 'rain' },
    63: { dayIcon: '🌧️', nightIcon: '🌧️', desc: 'Lluvia moderada', condition: 'rain' },
    65: { dayIcon: '🌧️', nightIcon: '🌧️', desc: 'Lluvia intensa', condition: 'rain' },
    71: { dayIcon: '❄️', nightIcon: '❄️', desc: 'Nevada ligera', condition: 'snow' },
    73: { dayIcon: '❄️', nightIcon: '❄️', desc: 'Nevada moderada', condition: 'snow' },
    75: { dayIcon: '❄️', nightIcon: '❄️', desc: 'Nevada fuerte', condition: 'snow' },
    77: { dayIcon: '🌨️', nightIcon: '🌨️', desc: 'Granizo', condition: 'snow' },
    80: { dayIcon: '🌦️', nightIcon: '🌧️', desc: 'Chubascos ligeros', condition: 'rain' },
    81: { dayIcon: '🌧️', nightIcon: '🌧️', desc: 'Chubascos moderados', condition: 'rain' },
    82: { dayIcon: '⛈️', nightIcon: '⛈️', desc: 'Chubascos violentos', condition: 'rain' },
    85: { dayIcon: '🌨️', nightIcon: '🌨️', desc: 'Chubascos de nieve', condition: 'snow' },
    86: { dayIcon: '🌨️', nightIcon: '🌨️', desc: 'Chubascos de nieve intensos', condition: 'snow' },
    95: { dayIcon: '⛈️', nightIcon: '⛈️', desc: 'Tormenta eléctrica', condition: 'thunderstorm' },
    96: { dayIcon: '⛈️', nightIcon: '⛈️', desc: 'Tormenta con granizo leve', condition: 'thunderstorm' },
    99: { dayIcon: '⛈️', nightIcon: '⛈️', desc: 'Tormenta con granizo fuerte', condition: 'thunderstorm' }
  },

  // Helper seguro para localStorage
  getStorage(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },

  setStorage(key, val) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
      }
    } catch (e) {}
  },

  // Inicialización
  init() {
    this.startClock();
    this.loadCachedWeather();
    this.refreshWeather(false);

    // Actualizar si vuelve la conexión
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('online', () => {
        this.refreshWeather(false);
      });
    }

    // Actualizar periódicamente
    setInterval(() => {
      this.refreshWeather(false);
    }, this.CACHE_TTL_MS);
  },

  // Reloj en tiempo real
  startClock() {
    this.updateClock();
    if (this.clockTimer) clearInterval(this.clockTimer);
    this.clockTimer = setInterval(() => {
      this.updateClock();
    }, 10000); // Cada 10s para precisión de minuto
  },

  updateClock() {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('ambientClock');
    if (!el) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    el.innerText = `${hours}:${minutes}`;
  },

  // Carga inmediata de caché local
  loadCachedWeather() {
    try {
      const cached = this.getStorage(this.CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.currentData = parsed;
        this.render();
      }
    } catch (e) {
      console.warn('[Weather] Error cargando caché:', e);
    }
  },

  // Obtener tiempo meteorológico
  async refreshWeather(force = false) {
    if (this.isRefreshing) return;

    // Verificar frescura de caché si no es forzado
    if (!force && this.currentData && this.currentData.timestamp) {
      const age = Date.now() - this.currentData.timestamp;
      if (age < this.CACHE_TTL_MS) {
        return;
      }
    }

    this.isRefreshing = true;

    try {
      const coords = await this.resolveCoordinates();
      const weather = await this.fetchOpenMeteo(coords.lat, coords.lon);
      const city = await this.resolveCityName(coords.lat, coords.lon);

      const payload = {
        temp: Math.round(weather.temperature_2m),
        apparentTemp: Math.round(weather.apparent_temperature || weather.temperature_2m),
        humidity: weather.relative_humidity_2m || 50,
        windSpeed: Math.round(weather.wind_speed_10m || 0),
        code: weather.weather_code,
        isDay: weather.is_day === 1,
        city: city || 'Local',
        lat: coords.lat,
        lon: coords.lon,
        timestamp: Date.now()
      };

      this.currentData = payload;
      this.setStorage(this.CACHE_KEY, JSON.stringify(payload));
      this.setStorage(this.COORDS_KEY, JSON.stringify(coords));
      if (city) this.setStorage(this.CITY_KEY, city);

      this.render();
    } catch (err) {
      console.info('[Weather] Actualización pospuesta o sin red:', err.message);
      if (!this.currentData) {
        // Fallback básico si nunca hubo caché
        this.currentData = {
          temp: 20,
          apparentTemp: 20,
          humidity: 50,
          windSpeed: 10,
          code: 0,
          isDay: true,
          city: 'Madrid',
          timestamp: Date.now()
        };
        this.render();
      }
    } finally {
      this.isRefreshing = false;
    }
  },

  // Resolver coordenadas: GPS o caché previa o Madrid (fallback seguro)
  resolveCoordinates() {
    return new Promise((resolve) => {
      // 1. Intentar GPS con timeout de 5s
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              source: 'gps'
            });
          },
          () => {
            // Error o permiso denegado: usar caché o fallback
            this.fallbackCoordinates(resolve);
          },
          { timeout: 5000, maximumAge: 600000, enableHighAccuracy: false }
        );
      } else {
        this.fallbackCoordinates(resolve);
      }
    });
  },

  fallbackCoordinates(resolve) {
    try {
      const saved = this.getStorage(this.COORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lon) {
          resolve(parsed);
          return;
        }
      }
    } catch (e) {}

    // Fallback por defecto: Madrid (o detectar por zona horaria de España/América)
    const tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat) 
      ? Intl.DateTimeFormat().resolvedOptions().timeZone 
      : 'Europe/Madrid';

    if (tz.includes('Canary')) {
      resolve({ lat: 28.2916, lon: -16.6291, source: 'fallback' }); // Tenerife
    } else if (tz.includes('America/Mexico')) {
      resolve({ lat: 19.4326, lon: -99.1332, source: 'fallback' }); // CDMX
    } else if (tz.includes('America/Argentina') || tz.includes('Buenos_Aires')) {
      resolve({ lat: -34.6037, lon: -58.3816, source: 'fallback' }); // Buenos Aires
    } else if (tz.includes('America/Bogota')) {
      resolve({ lat: 4.7110, lon: -74.0721, source: 'fallback' }); // Bogotá
    } else {
      resolve({ lat: 40.4168, lon: -3.7038, source: 'fallback' }); // Madrid
    }
  },

  // Llamada a Open-Meteo
  async fetchOpenMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    return data.current;
  },

  // Resolver nombre de ciudad (reverse geocoding ligero y gratuito)
  async resolveCityName(lat, lon) {
    try {
      const savedCity = this.getStorage(this.CITY_KEY);
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        if (city) return city;
      }
      return savedCity || 'Local';
    } catch (e) {
      return this.getStorage(this.CITY_KEY) || 'Local';
    }
  },

  // Mapear código WMO a icono y descripción
  getWeatherDetails(code, isDay = true) {
    const entry = this.WMO_MAP[code] || this.WMO_MAP[0];
    const icon = isDay ? entry.dayIcon : entry.nightIcon;
    return {
      icon: icon,
      desc: entry.desc,
      condition: entry.condition
    };
  },

  // Renderizar en la barra superior
  render() {
    if (!this.currentData) return;

    const details = this.getWeatherDetails(this.currentData.code, this.currentData.isDay);

    const iconEl = document.getElementById('ambientWeatherIcon');
    const descEl = document.getElementById('ambientWeatherDesc');
    const tempEl = document.getElementById('ambientWeatherTemp');
    const locEl = document.getElementById('ambientWeatherLoc');

    if (iconEl) iconEl.innerText = details.icon;
    if (descEl) descEl.innerText = details.desc;
    if (tempEl) tempEl.innerText = `${this.currentData.temp}°C`;
    if (locEl) locEl.innerText = this.currentData.city ? `· ${this.currentData.city}` : '';
  },

  // Consejo físico basado en el tiempo actual
  getWorkoutAdvice() {
    if (!this.currentData) return '¡Mantén la constancia y entrena con intensidad!';
    const { temp, code } = this.currentData;
    const details = this.getWeatherDetails(code, this.currentData.isDay);

    if (details.condition === 'rain' || details.condition === 'drizzle' || details.condition === 'thunderstorm') {
      return '🌧️ Lluvia detectada en tu zona: Día ideal para darlo todo en el gimnasio o sesión indoor.';
    }
    if (details.condition === 'snow') {
      return '❄️ Nieve en el exterior: Enfócate en tu rutina de pesas en sala climatizada.';
    }
    if (temp >= 30) {
      return '☀️ Temperatura elevada: Aumenta tu hidratación en 500-750ml durante el entrenamiento.';
    }
    if (temp <= 7) {
      return '🧣 Clima frío: Dedica 5 minutos extra a la movilidad articular y calentamiento previo.';
    }
    return '🏃‍♂️ Clima agradable: Excelente oportunidad para completar tus pasos o correr al aire libre.';
  },

  // Abrir modal con detalles del tiempo
  openModal() {
    if (!this.currentData) {
      this.refreshWeather(true);
      return;
    }

    const details = this.getWeatherDetails(this.currentData.code, this.currentData.isDay);

    const modalIcon = document.getElementById('weatherModalIcon');
    const modalTemp = document.getElementById('weatherModalTemp');
    const modalDesc = document.getElementById('weatherModalDesc');
    const modalCity = document.getElementById('weatherModalCity');
    const modalApparent = document.getElementById('weatherModalApparent');
    const modalHumidity = document.getElementById('weatherModalHumidity');
    const modalWind = document.getElementById('weatherModalWind');
    const modalAdvice = document.getElementById('weatherModalAdvice');

    if (modalIcon) modalIcon.innerText = details.icon;
    if (modalTemp) modalTemp.innerText = `${this.currentData.temp}°C`;
    if (modalDesc) modalDesc.innerText = details.desc;
    if (modalCity) modalCity.innerText = this.currentData.city || 'Ubicación actual';
    if (modalApparent) modalApparent.innerText = `${this.currentData.apparentTemp}°C`;
    if (modalHumidity) modalHumidity.innerText = `${this.currentData.humidity}%`;
    if (modalWind) modalWind.innerText = `${this.currentData.windSpeed} km/h`;
    if (modalAdvice) modalAdvice.innerText = this.getWorkoutAdvice();

    if (window.App && typeof window.App.openModal === 'function') {
      App.openModal('weatherModal');
    }
  },

  // Acción manual de refresco
  async forceRefresh() {
    if (window.App && typeof window.App.showToast === 'function') {
      App.showToast('Actualizando datos meteorológicos...', 'info');
    }
    await this.refreshWeather(true);
    if (window.App && typeof window.App.showToast === 'function') {
      App.showToast(`Tiempo actualizado: ${this.currentData.temp}°C en ${this.currentData.city}`, 'success');
    }
    this.openModal();
  }
};

window.Weather = Weather;

// Auto-inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Weather.init());
  } else {
    Weather.init();
  }
}
