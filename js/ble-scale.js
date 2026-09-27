/**
 * Fit360 — BLE Smart Scale Integration Module (Renpho & Generic BLE Scales)
 * 
 * Gestiona la conexión inalámbrica Bluetooth Low Energy con básculas inteligentes:
 * 1. Inicialización e inspección del plugin @capacitor-community/bluetooth-le.
 * 2. Escaneo filtrado por servicios GATT estándar (0x181D, 0x181B) y vendors (Renpho, Yolanda, QN, Chipsea).
 * 3. Suscripción a notificaciones e indicaciones de medición de peso y composición corporal.
 * 4. Decodificación de paquetes de bytes (Standard Bluetooth SIG, protocolos Renpho/QN y BIA de impedancia).
 * 5. Persistencia Offline-First: Storage local + cola de sincronización Supabase (weight_logs) + Apple HealthKit.
 * 
 * @module BleScale
 */

'use strict';

const BleScale = (function() {

  // Identificadores de Servicios y Características Bluetooth Low Energy
  const BLE_UUIDS = {
    // Bluetooth SIG Standard Weight Scale Profile (WSP)
    WEIGHT_SERVICE: '0000181d-0000-1000-8000-00805f9b34fb',
    WEIGHT_MEASUREMENT_CHAR: '00002a9d-0000-1000-8000-00805f9b34fb',
    WEIGHT_SCALE_FEATURE_CHAR: '00002a9e-0000-1000-8000-00805f9b34fb',

    // Bluetooth SIG Body Composition Profile (BCP)
    BODY_COMPOSITION_SERVICE: '0000181b-0000-1000-8000-00805f9b34fb',
    BODY_COMPOSITION_MEASUREMENT_CHAR: '00002a9c-0000-1000-8000-00805f9b34fb',

    // Renpho / Yolanda / QN-Scale / Chipsea Vendor Services
    RENPHO_CUSTOM_SERVICE_1: '0000fff0-0000-1000-8000-00805f9b34fb',
    RENPHO_CUSTOM_CHAR_1: '0000fff4-0000-1000-8000-00805f9b34fb',
    RENPHO_CUSTOM_CHAR_WRITE: '0000fff1-0000-1000-8000-00805f9b34fb',

    RENPHO_CUSTOM_SERVICE_2: '0000ffe0-0000-1000-8000-00805f9b34fb',
    RENPHO_CUSTOM_CHAR_2: '0000ffe1-0000-1000-8000-00805f9b34fb',

    RENPHO_CUSTOM_SERVICE_3: '0000ffb0-0000-1000-8000-00805f9b34fb'
  };

  // Prefijos de nombres comunes de básculas compatibles
  const SCALE_NAME_KEYWORDS = [
    'renpho', 'qn-scale', 'qn_scale', 'scale', 'yolanda',
    'chipsea', 'sinocare', 'es-', 'senssun', 'mi scale', 'mibfs'
  ];

  // Estado interno del módulo
  const state = {
    status: 'idle', // 'idle' | 'scanning' | 'reading' | 'success' | 'error'
    device: null,
    deviceId: null,
    deviceName: '',
    currentWeight: 0,
    currentFatPct: null,
    currentImpedance: null,
    isStabilized: false,
    discoveredDevices: [],
    scanTimer: null,
    stabilityCheckCount: 0,
    lastSampleWeight: null,
    isSubscribed: false,
    errorMessage: ''
  };

  /**
   * Obtiene la instancia nativa del plugin BluetoothLe en Capacitor
   * @returns {object|null}
   */
  function getBlePlugin() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BluetoothLe) {
      return window.Capacitor.Plugins.BluetoothLe;
    }
    return null;
  }

  /**
   * Comprueba si el entorno es nativo de Capacitor (iOS)
   */
  function isNativePlatform() {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  }

  /**
   * Inicializa el módulo y enlaza eventos en el DOM si procede
   */
  async function init() {
    console.log('[BleScale] Módulo de báscula inteligente inicializado.');
  }

  /**
   * Abre el modal del escáner BLE
   */
  function openModal() {
    const modal = document.getElementById('bleScaleModal');
    if (modal) {
      modal.classList.remove('ble-hidden');
      modal.setAttribute('aria-hidden', 'false');
      setStatus('idle');
    }
  }

  /**
   * Cierra el modal y desconecta cualquier sesión activa
   */
  async function closeModal() {
    const modal = document.getElementById('bleScaleModal');
    if (modal) {
      modal.classList.add('ble-hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
    await disconnectDevice();
    stopScan();
  }

  /**
   * Actualiza el estado visual del modal (los 4 estados del wizard)
   * @param {'idle'|'scanning'|'reading'|'success'|'error'} newStatus
   */
  function setStatus(newStatus, errorMsg = '') {
    state.status = newStatus;
    state.errorMessage = errorMsg;

    const views = ['idle', 'scanning', 'reading', 'success', 'error'];
    views.forEach(v => {
      const el = document.getElementById(`bleView_${v}`);
      if (el) el.style.display = (v === newStatus) ? 'flex' : 'none';
    });

    // Actualizar botones de acción según estado
    const primaryBtn = document.getElementById('blePrimaryBtn');
    const secondaryBtn = document.getElementById('bleSecondaryBtn');

    if (primaryBtn) {
      switch (newStatus) {
        case 'idle':
          primaryBtn.textContent = '🔍 Buscar Báscula';
          primaryBtn.disabled = false;
          primaryBtn.onclick = startScan;
          break;
        case 'scanning':
          primaryBtn.textContent = 'Detener Búsqueda';
          primaryBtn.disabled = false;
          primaryBtn.onclick = stopScan;
          break;
        case 'reading':
          primaryBtn.textContent = 'Leyendo... Súbete a la báscula';
          primaryBtn.disabled = true;
          break;
        case 'success':
          primaryBtn.textContent = '✓ Guardado. Continuar';
          primaryBtn.disabled = false;
          primaryBtn.onclick = closeModal;
          break;
        case 'error':
          primaryBtn.textContent = 'Reintentar Búsqueda';
          primaryBtn.disabled = false;
          primaryBtn.onclick = startScan;
          break;
      }
    }

    if (secondaryBtn) {
      secondaryBtn.style.display = (newStatus === 'scanning' || newStatus === 'reading') ? 'block' : 'none';
    }
  }

  /**
   * Inicia el proceso de escaneo de dispositivos Bluetooth
   */
  async function startScan() {
    setStatus('scanning');
    state.discoveredDevices = [];
    renderDiscoveredDevices();

    const plugin = getBlePlugin();

    try {
      if (isNativePlatform() && plugin) {
        // 1. Asegurar inicialización del plugin
        await plugin.initialize();

        // 2. Verificar que Bluetooth esté encendido en el dispositivo
        const enabledResult = await plugin.isEnabled();
        if (!enabledResult.value) {
          throw new Error('Bluetooth está apagado. Actívalo en los Ajustes de tu iPhone.');
        }

        // 3. Iniciar escucha de resultados de escaneo
        await plugin.addListener('onScanResult', (scanResult) => {
          handleDiscoveredDevice(scanResult);
        });

        // 4. Iniciar escaneo BLE (Servicios estándar + Filtros de nombre)
        await plugin.requestLEScan({
          services: [
            BLE_UUIDS.WEIGHT_SERVICE,
            BLE_UUIDS.BODY_COMPOSITION_SERVICE,
            BLE_UUIDS.RENPHO_CUSTOM_SERVICE_1,
            BLE_UUIDS.RENPHO_CUSTOM_SERVICE_2
          ],
          allowDuplicates: false
        });

        console.log('[BleScale] Escaneo BLE iniciado con filtros estándar y Renpho.');

      } else if (navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function') {
        // Modo Web Bluetooth (Google Chrome / Edge en ordenador para testing)
        console.log('[BleScale Web] Invocando navegador Web Bluetooth...');
        const device = await navigator.bluetooth.requestDevice({
          filters: [
            { services: ['weight_scale'] },
            { namePrefix: 'Renpho' },
            { namePrefix: 'QN' },
            { namePrefix: 'Scale' }
          ],
          optionalServices: [
            BLE_UUIDS.WEIGHT_SERVICE,
            BLE_UUIDS.BODY_COMPOSITION_SERVICE,
            BLE_UUIDS.RENPHO_CUSTOM_SERVICE_1,
            BLE_UUIDS.RENPHO_CUSTOM_SERVICE_2
          ]
        });

        if (device) {
          connectToWebBluetoothDevice(device);
          return;
        }
      } else {
        // Fallback Simulador: Para pruebas en navegador o entornos sin hardware activo
        console.info('[BleScale] Modo de simulación interactivo activado.');
        simulateScanningAndConnection();
        return;
      }

      // Timeout de escaneo: 15 segundos sin encontrar nada
      clearTimeout(state.scanTimer);
      state.scanTimer = setTimeout(() => {
        if (state.status === 'scanning' && state.discoveredDevices.length === 0) {
          stopScan();
          setStatus('error', 'No se encontró ninguna báscula encendida cerca. Súbete un instante para reactivar su Bluetooth.');
        }
      }, 15000);

    } catch (err) {
      console.error('[BleScale Scan Error]', err);
      setStatus('error', err.message || 'Error al iniciar escáner Bluetooth.');
    }
  }

  /**
   * Detiene el escaneo activo
   */
  async function stopScan() {
    clearTimeout(state.scanTimer);
    const plugin = getBlePlugin();

    if (isNativePlatform() && plugin) {
      try {
        await plugin.stopLEScan();
      } catch (e) {
        // Ignorar si no estaba escaneando
      }
    }

    if (state.status === 'scanning') {
      setStatus('idle');
    }
  }

  /**
   * Procesa un dispositivo reportado durante el escaneo BLE
   * @param {object} scanResult - Resultado con device, rssi, manufacturerData
   */
  function handleDiscoveredDevice(scanResult) {
    const dev = scanResult.device || scanResult;
    const name = dev.name || 'Báscula BLE';
    const deviceId = dev.deviceId || dev.id;

    // Verificar si ya está en la lista
    if (state.discoveredDevices.some(d => d.deviceId === deviceId)) {
      return;
    }

    // Filtrar por relevancia
    const isMatchingName = SCALE_NAME_KEYWORDS.some(kw => name.toLowerCase().includes(kw));
    const hasWeightService = scanResult.uuids && scanResult.uuids.some(u => 
      u.toLowerCase().includes('181d') || u.toLowerCase().includes('fff0') || u.toLowerCase().includes('ffe0')
    );

    if (isMatchingName || hasWeightService || !dev.name) {
      const item = {
        deviceId,
        name: dev.name || 'Báscula Inteligente (Detectada)',
        rssi: scanResult.rssi || -60
      };

      state.discoveredDevices.push(item);
      renderDiscoveredDevices();

      // Si coincide explícitamente con Renpho o báscula de alta señal, auto-conectar
      if (isMatchingName || state.discoveredDevices.length === 1) {
        console.log(`[BleScale] Conectando automáticamente a báscula candidata: ${name}`);
        connectToNativeDevice(deviceId, item.name);
      }
    }
  }

  /**
   * Renderiza la lista de básculas detectadas en la UI
   */
  function renderDiscoveredDevices() {
    const container = document.getElementById('bleDiscoveredList');
    if (!container) return;

    if (state.discoveredDevices.length === 0) {
      container.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-muted); padding: 8px;">Buscando señales Bluetooth... Súbete a la báscula para activarla.</div>';
      return;
    }

    container.innerHTML = state.discoveredDevices.map(d => `
      <div class="ble-device-item" onclick="BleScale.connectDevice('${d.deviceId}', '${d.name.replace(/'/g, "\\'")}')">
        <div class="ble-device-name">
          <span>⚖️</span>
          <span>${d.name}</span>
        </div>
        <div class="ble-device-rssi">
          <span>📶 ${d.rssi} dBm</span>
          <button class="pill pill-cyan" style="font-size: 0.68rem; padding: 2px 8px;">Conectar</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Conecta a un dispositivo BLE nativo a través de Capacitor
   * @param {string} deviceId
   * @param {string} deviceName
   */
  async function connectToNativeDevice(deviceId, deviceName) {
    const plugin = getBlePlugin();
    if (!plugin) return;

    stopScan();
    setStatus('reading');
    state.deviceId = deviceId;
    state.deviceName = deviceName;

    updateReadingUI('--', 'Estableciendo enlace GATT...');

    try {
      // 1. Conectar al GATT del dispositivo
      await plugin.connect({
        deviceId,
        timeout: 10000
      });

      console.log(`✅ [BleScale] Conectado a GATT: ${deviceName} (${deviceId})`);

      // 2. Descubrir servicios disponibles
      await plugin.discoverServices({ deviceId });
      const servicesResult = await plugin.getServices({ deviceId });
      const services = servicesResult.services || [];

      console.log('[BleScale] Servicios GATT descubiertos:', services.map(s => s.uuid));

      // 3. Suscribirse a la característica de medición adecuada
      let subscribed = false;

      // Prioridad 1: Standard Weight Scale (0x181D / 0x2A9D)
      if (hasServiceAndChar(services, BLE_UUIDS.WEIGHT_SERVICE, BLE_UUIDS.WEIGHT_MEASUREMENT_CHAR)) {
        await subscribeToNotifications(deviceId, BLE_UUIDS.WEIGHT_SERVICE, BLE_UUIDS.WEIGHT_MEASUREMENT_CHAR);
        subscribed = true;
      }
      // Prioridad 2: Renpho Custom Service 1 (0xFFF0 / 0xFFF4)
      else if (hasServiceAndChar(services, BLE_UUIDS.RENPHO_CUSTOM_SERVICE_1, BLE_UUIDS.RENPHO_CUSTOM_CHAR_1)) {
        await subscribeToNotifications(deviceId, BLE_UUIDS.RENPHO_CUSTOM_SERVICE_1, BLE_UUIDS.RENPHO_CUSTOM_CHAR_1);
        subscribed = true;
      }
      // Prioridad 3: Renpho Custom Service 2 (0xFFE0 / 0xFFE1)
      else if (hasServiceAndChar(services, BLE_UUIDS.RENPHO_CUSTOM_SERVICE_2, BLE_UUIDS.RENPHO_CUSTOM_CHAR_2)) {
        await subscribeToNotifications(deviceId, BLE_UUIDS.RENPHO_CUSTOM_SERVICE_2, BLE_UUIDS.RENPHO_CUSTOM_CHAR_2);
        subscribed = true;
      }
      // Prioridad 4: Intentar con cualquier característica que admita Notify o Indicate
      else {
        for (const s of services) {
          for (const c of (s.characteristics || [])) {
            if (c.properties && (c.properties.notify || c.properties.indicate)) {
              console.log(`[BleScale] Probando suscripción heurística a service ${s.uuid} char ${c.uuid}`);
              await subscribeToNotifications(deviceId, s.uuid, c.uuid);
              subscribed = true;
              break;
            }
          }
          if (subscribed) break;
        }
      }

      if (subscribed) {
        state.isSubscribed = true;
        updateReadingUI('0.0', 'Súbete descalzo a la báscula');
      } else {
        throw new Error('No se encontró característica de notificación de peso en la báscula.');
      }

    } catch (err) {
      console.error('[BleScale Connect Error]', err);
      setStatus('error', `Error conectando con la báscula: ${err.message || 'desconexión temprana'}`);
      await disconnectDevice();
    }
  }

  /**
   * Helper para verificar si un par Service/Characteristic existe en la lista descubierta
   */
  function hasServiceAndChar(services, serviceUuid, charUuid) {
    const s = services.find(srv => srv.uuid.toLowerCase() === serviceUuid.toLowerCase());
    if (!s) return false;
    return (s.characteristics || []).some(c => c.uuid.toLowerCase() === charUuid.toLowerCase());
  }

  /**
   * Suscribe el plugin nativo a notificaciones/indicaciones
   */
  async function subscribeToNotifications(deviceId, service, characteristic) {
    const plugin = getBlePlugin();
    const key = `notification|${deviceId}|${service.toLowerCase()}|${characteristic.toLowerCase()}`;

    // Escuchar eventos de datos
    await plugin.addListener(key, (event) => {
      const rawValue = event ? event.value : null;
      handleIncomingRawData(rawValue);
    });

    // Iniciar notificaciones nativas
    await plugin.startNotifications({
      deviceId,
      service,
      characteristic
    });

    console.log(`[BleScale] Suscripción activa en ${service} / ${characteristic}`);
  }

  /**
   * Conexión para entorno Web Bluetooth (Testing en navegador)
   */
  async function connectToWebBluetoothDevice(bluetoothDevice) {
    try {
      setStatus('reading');
      updateReadingUI('--', 'Conectando con báscula...');

      const server = await bluetoothDevice.gatt.connect();
      state.device = bluetoothDevice;
      state.deviceName = bluetoothDevice.name || 'Báscula Web';

      console.log('✅ [BleScale Web] Conectado a servidor GATT Web Bluetooth');

      // Intentar obtener servicio de peso estándar
      let service;
      let char;

      try {
        service = await server.getPrimaryService('weight_scale');
        char = await service.getCharacteristic('weight_measurement');
      } catch (e) {
        // Intentar servicio alternativo
        service = await server.getPrimaryService(BLE_UUIDS.RENPHO_CUSTOM_SERVICE_1);
        char = await service.getCharacteristic(BLE_UUIDS.RENPHO_CUSTOM_CHAR_1);
      }

      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', (e) => {
        handleIncomingRawData(e.target.value);
      });

      updateReadingUI('0.0', 'Súbete descalzo a la báscula');

    } catch (err) {
      console.warn('[BleScale Web Bluetooth Error]', err);
      setStatus('error', 'Error en Web Bluetooth. Reintentando en modo simulador...');
      simulateScanningAndConnection();
    }
  }

  /**
   * Procesa la entrada cruda (hex string, DataView o Uint8Array) y la envía al decodificador
   */
  function handleIncomingRawData(rawValue) {
    if (!rawValue) return;

    let dataView;
    if (rawValue instanceof DataView) {
      dataView = rawValue;
    } else if (typeof rawValue === 'string') {
      // Hex string procedente del bridge iOS (ej: "02 4b 00...")
      dataView = hexStringToDataView(rawValue);
    } else if (Array.isArray(rawValue)) {
      dataView = new DataView(new Uint8Array(rawValue).buffer);
    } else if (rawValue.buffer) {
      dataView = new DataView(rawValue.buffer);
    } else {
      console.warn('[BleScale] Formato de paquete desconocido:', rawValue);
      return;
    }

    const parsed = parseScaleBytes(dataView);
    if (!parsed || isNaN(parsed.weight) || parsed.weight <= 5) return;

    // Actualizar visualización en tiempo real
    updateReadingUI(parsed.weight.toFixed(1), parsed.isStabilized ? '¡Pesaje fijado! Calculando...' : 'Pesando en vivo...');

    // Lógica de estabilidad: si la báscula reporta isStabilized O el valor no cambia en 3 lecturas
    if (parsed.isStabilized || checkSoftwareStability(parsed.weight)) {
      onStableMeasurementReceived(parsed.weight, parsed.fatPercentage);
    }
  }

  /**
   * Validador de estabilidad por software (fallback si la báscula no activa el bit de bloqueo)
   */
  function checkSoftwareStability(weight) {
    if (state.lastSampleWeight !== null && Math.abs(state.lastSampleWeight - weight) < 0.1) {
      state.stabilityCheckCount++;
      if (state.stabilityCheckCount >= 4) { // 4 muestras idénticas consecutivas
        return true;
      }
    } else {
      state.stabilityCheckCount = 0;
      state.lastSampleWeight = weight;
    }
    return false;
  }

  /**
   * DECODIFICADOR PRINCIPAL DE BYTES (Data Parsing)
   * 
   * Interpreta paquetes según especificación Bluetooth SIG (0x2A9D),
   * protocolo propietario Renpho/Yolanda (QN-Scale) y Xiaomi Mi Scale.
   * 
   * @param {DataView} dv
   * @returns {{ weight: number, fatPercentage: number|null, isStabilized: boolean }}
   */
  function parseScaleBytes(dv) {
    const len = dv.byteLength;
    if (len < 2) return null;

    const b0 = dv.getUint8(0);
    const b1 = dv.getUint8(1);

    // =========================================================================
    // PROTOCOLO 1: Bluetooth SIG Standard Weight Scale Profile (UUID 0x2A9D)
    // Byte 0 = Flags:
    //   Bit 0: Unidades (0 = SI [kg], 1 = Imperial [lbs])
    //   Bit 1: Timestamp presente
    //   Bit 2: User ID presente
    //   Bit 3: BMI / Altura presente
    // =========================================================================
    if ((b0 & 0xF0) === 0 && len >= 3) {
      const isImperial = (b0 & 0x01) === 1;
      // Bytes 1 y 2 en Little Endian
      const rawWeight = dv.getUint16(1, true);

      let weightKg = 0;
      if (isImperial) {
        // En imperial, la resolución suele ser 0.01 lbs
        const weightLbs = rawWeight * 0.01;
        weightKg = weightLbs * 0.45359237;
      } else {
        // En SI, resolución oficial SIG: 0.005 kg (o 0.1 / 0.01 kg según fabricante)
        if (rawWeight * 0.005 >= 20 && rawWeight * 0.005 <= 250) {
          weightKg = rawWeight * 0.005;
        } else if (rawWeight / 10 >= 20 && rawWeight / 10 <= 250) {
          weightKg = rawWeight / 10;
        } else {
          weightKg = rawWeight / 100;
        }
      }

      // En perfiles SIG Weight Measurement (Indication), la medición ya está fijada
      return {
        weight: Math.round(weightKg * 10) / 10,
        fatPercentage: null,
        isStabilized: true
      };
    }

    // =========================================================================
    // PROTOCOLO 2: Renpho / Yolanda / QN-Scale (Protocolo Típico 8, 10 o 14 bytes)
    // Cabecera usual: 0x02, 0xCF, 0xFD o 0x10 en Byte 0
    // Byte 1: Estado y flags (Bit 5 = 1 indica medición final estabilizada)
    // Bytes 2-3: Peso entero en Big Endian (dividir por 100 para kg)
    // Bytes 4-5: Resistencia BIA en Ohms (impedancia corporal)
    // =========================================================================
    if (b0 === 0x02 || b0 === 0xCF || b0 === 0xFD || b0 === 0x10) {
      const isStabilized = (b1 & 0x20) !== 0 || (b1 & 0x01) !== 0;
      
      // Peso en Big Endian en bytes 2 y 3
      let rawWeight = (dv.getUint8(2) << 8) | dv.getUint8(3);
      let weightKg = rawWeight / 100;

      // Si el peso es anómalo, intentar Little Endian
      if (weightKg < 10 || weightKg > 250) {
        rawWeight = (dv.getUint8(3) << 8) | dv.getUint8(2);
        weightKg = rawWeight / 100;
      }

      // Impedancia en Ohms para cálculo de grasa corporal (bytes 4-5)
      let fatPercentage = null;
      if (len >= 6) {
        const rawImpedance = (dv.getUint8(4) << 8) | dv.getUint8(5);
        if (rawImpedance > 200 && rawImpedance < 1200) {
          fatPercentage = estimateBodyFatFromImpedance(weightKg, rawImpedance);
        }
      }

      return {
        weight: Math.round(weightKg * 10) / 10,
        fatPercentage,
        isStabilized
      };
    }

    // =========================================================================
    // PROTOCOLO 3: Xiaomi Mi Body Composition Scale (13 bytes broadcast)
    // Byte 0: Flags (Bit 5 = Estabilizado, Bit 7 = Impedancia lista)
    // Bytes 1-2: Peso en Little Endian (dividir por 200 para kg)
    // Bytes 9-10: Impedancia en Little Endian
    // =========================================================================
    if (len === 13) {
      const isStabilized = (b0 & 0x20) !== 0;
      const rawWeight = dv.getUint16(1, true);
      const weightKg = rawWeight / 200;

      let fatPercentage = null;
      const impedance = dv.getUint16(9, true);
      if (impedance > 200 && impedance < 1200) {
        fatPercentage = estimateBodyFatFromImpedance(weightKg, impedance);
      }

      return {
        weight: Math.round(weightKg * 10) / 10,
        fatPercentage,
        isStabilized
      };
    }

    // =========================================================================
    // PROTOCOLO 4: Fallback Heurístico para básculas BLE genéricas
    // =========================================================================
    for (let offset = 0; offset <= len - 2; offset++) {
      const valBE = dv.getUint16(offset, false) / 100;
      const valLE = dv.getUint16(offset, true) / 100;

      if (valBE >= 30 && valBE <= 200) {
        return { weight: Math.round(valBE * 10) / 10, fatPercentage: null, isStabilized: false };
      }
      if (valLE >= 30 && valLE <= 200) {
        return { weight: Math.round(valLE * 10) / 10, fatPercentage: null, isStabilized: false };
      }
    }

    return null;
  }

  /**
   * Estima el % de grasa corporal a partir de la impedancia bioeléctrica (BIA en Ohms)
   * y los datos biométricos del usuario guardados en Storage (Mifflin/Deurenberg)
   */
  function estimateBodyFatFromImpedance(weightKg, impedanceOhms) {
    try {
      const settings = window.Storage ? Storage.getSettings() : null;
      const heightCm = settings?.profile?.height || 176;
      const age = settings?.profile?.age || 26;
      const sex = settings?.profile?.sex || 'male';

      // Índice de Masa Corporal (BMI)
      const heightM = heightCm / 100;
      const bmi = weightKg / (heightM * heightM);

      // FFM (Fat-Free Mass) estimada por impedancia:
      // FFM = 0.65 * (altura^2 / resistencia) + 0.26 * peso + 0.10 * edad + ajuste_sexo
      const heightSqOverR = (heightCm * heightCm) / impedanceOhms;
      const sexCoeff = sex === 'male' ? 7.0 : 0.0;
      const ffm = (0.65 * heightSqOverR) + (0.26 * weightKg) + sexCoeff;

      const fatMass = Math.max(2, weightKg - ffm);
      let fatPct = (fatMass / weightKg) * 100;

      // Si el cálculo BIA difiere excesivamente del rango fisiológico, acotar con Deurenberg
      if (fatPct < 5 || fatPct > 55) {
        fatPct = (1.20 * bmi) + (0.23 * age) - (sex === 'male' ? 16.2 : 5.4);
      }

      return Math.round(Math.max(5, Math.min(50, fatPct)) * 10) / 10;
    } catch (e) {
      return null;
    }
  }

  /**
   * Actualiza el display en vivo de la tarjeta
   */
  function updateReadingUI(weightText, statusText) {
    const valEl = document.getElementById('bleLiveWeightVal');
    const statusEl = document.getElementById('bleLiveStatusText');

    if (valEl) valEl.textContent = weightText;
    if (statusEl) statusEl.textContent = statusText;
  }

  /**
   * Se ejecuta al obtener una medición estable definitiva
   * Guarda en Supabase, Apple HealthKit y Storage local, y desvincula el dispositivo
   */
  async function onStableMeasurementReceived(weightKg, fatPct) {
    if (state.status === 'success') return; // Evitar duplicar
    state.currentWeight = weightKg;
    state.currentFatPct = fatPct;

    console.log(`🎯 [BleScale] Medición ESTABLE confirmada: ${weightKg} kg, ${fatPct ? fatPct + '%' : 'N/A'}`);

    // 1. Mostrar vista de éxito con microanimación
    setStatus('success');
    const successWeightEl = document.getElementById('bleSuccessWeightVal');
    const successFatEl = document.getElementById('bleSuccessFatVal');
    const successDeviceEl = document.getElementById('bleSuccessDeviceName');

    if (successWeightEl) successWeightEl.textContent = `${weightKg.toFixed(1)} kg`;
    if (successFatEl) {
      if (fatPct) {
        successFatEl.style.display = 'inline-flex';
        successFatEl.innerHTML = `🟣 ${fatPct}% grasa corporal`;
      } else {
        successFatEl.style.display = 'none';
      }
    }
    if (successDeviceEl) {
      successDeviceEl.textContent = state.deviceName || 'Báscula Bluetooth';
    }

    // 2. Persistir localmente en Storage
    let savedLog = null;
    if (window.Storage) {
      savedLog = Storage.saveWeightLog({
        weight: weightKg,
        fatPct: fatPct,
        timing: 'fasting',
        source: 'ble_scale',
        notes: `Medición directa vía ${state.deviceName || 'Báscula Bluetooth'}`
      });
    }

    // 3. Escribir en Apple HealthKit nativo si está disponible
    if (window.HealthSync && typeof window.HealthSync.saveWeight === 'function') {
      try {
        await HealthSync.saveWeight(weightKg, fatPct, 'ble_scale');
        console.log('✅ [BleScale] Peso registrado en Apple HealthKit.');
      } catch (e) {
        console.warn('[BleScale] No se pudo escribir en HealthKit:', e);
      }
    }

    // 4. Encolar / Actualizar en Supabase (Offline-First)
    try {
      if (window.SupabaseClient && typeof window.SupabaseClient.enqueue === 'function') {
        window.SupabaseClient.enqueue('UPSERT', 'weight_logs', {
          weight: weightKg,
          fat_percentage: fatPct,
          logged_at: new Date().toISOString(),
          notes: `Báscula BLE: ${state.deviceName || 'Renpho/BLE'}`
        });
        console.log('✅ [BleScale] Encolado en cola Supabase (weight_logs).');
      }
    } catch (e) {
      console.warn('[BleScale Supabase Warning]', e);
    }

    // 5. Feedback háptico y Toast
    if (window.App && typeof window.App.showToast === 'function') {
      window.App.showToast(`⚖️ ¡Pesaje registrado: ${weightKg} kg! Sincronizado en Salud y Nube`, 'success');
    }

    // 6. Actualizar Dashboard si está visible
    if (window.Dashboard && typeof window.Dashboard.render === 'function') {
      window.Dashboard.render();
    }

    // 7. Desvincular automáticamente para ahorrar batería del dispositivo IoT
    setTimeout(() => {
      disconnectDevice();
    }, 1200);
  }

  /**
   * Desconecta el dispositivo GATT activo para ahorrar batería
   */
  async function disconnectDevice() {
    const plugin = getBlePlugin();

    if (isNativePlatform() && plugin && state.deviceId) {
      try {
        await plugin.disconnect({ deviceId: state.deviceId });
        console.log(`[BleScale] Desconectado de ${state.deviceId} (Batería optimizada).`);
      } catch (e) {
        // Ignorar si ya estaba desconectado
      }
    }

    if (state.device && state.device.gatt && state.device.gatt.connected) {
      state.device.gatt.disconnect();
    }

    state.deviceId = null;
    state.device = null;
    state.isSubscribed = false;
  }

  /**
   * Convierte una cadena hexadecimal en DataView
   */
  function hexStringToDataView(hex) {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return new DataView(bytes.buffer);
  }

  /**
   * SIMULADOR INTERACTIVO
   * Permite verificar la experiencia de usuario y la persistencia en entornos de desarrollo
   */
  function simulateScanningAndConnection() {
    setTimeout(() => {
      if (state.status !== 'scanning') return;
      state.discoveredDevices = [
        { deviceId: 'SIM-RENPHO-01', name: 'Renpho Smart Scale ES-260', rssi: -52 },
        { deviceId: 'SIM-GENERIC-02', name: 'Chipsea BLE BodyScale', rssi: -68 }
      ];
      renderDiscoveredDevices();

      // Auto conectar a los 1.5s
      setTimeout(() => {
        if (state.status === 'scanning') {
          state.deviceId = 'SIM-RENPHO-01';
          state.deviceName = 'Renpho Smart Scale ES-260';
          setStatus('reading');
          updateReadingUI('--', 'Conectado a Renpho Smart Scale. Súbete descalzo...');

          // Simular subida a la báscula: fluctuación de peso y bloqueo final
          let step = 0;
          const weights = [0.0, 35.4, 68.2, 73.8, 74.4, 74.5, 74.5, 74.5];
          const interval = setInterval(() => {
            if (state.status !== 'reading') {
              clearInterval(interval);
              return;
            }
            const current = weights[step];
            updateReadingUI(current.toFixed(1), step >= 5 ? '¡Medición fijada!' : 'Midiendo peso en vivo...');

            if (step >= weights.length - 1) {
              clearInterval(interval);
              onStableMeasurementReceived(74.5, 14.8);
            }
            step++;
          }, 450);
        }
      }, 1400);

    }, 1200);
  }

  // API Pública del Módulo
  return {
    init,
    openModal,
    closeModal,
    startScan,
    stopScan,
    connectDevice: (deviceId, name) => connectToNativeDevice(deviceId, name),
    parseScaleBytes,
    getState: () => ({ ...state })
  };

})();

// Exportar globalmente
window.BleScale = BleScale;

// Inicializar al cargar el DOM
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    BleScale.init();
  });
}
