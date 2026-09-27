/**
 * Fit360 - BarcodeScanner Module
 * Escanea codigos EAN/UPC con la camara y busca info nutricional
 * en Open Food Facts (gratuito, sin limites, con productos espanoles)
 */
const BarcodeScanner = {
  _scanner: null,
  _scanning: false,
  _lastScannedProduct: null,

  openScanModal() {
    this._setMealByTime();
    App.openModal('barcodeScanModal');
    this._resetUI();
    setTimeout(() => this._startCamera(), 300);
  },

  closeModal() {
    this._stopCamera();
    App.closeModal('barcodeScanModal');
  },

  restartScan() {
    this._lastScannedProduct = null;
    this._resetUI();
    this._startCamera();
  },

  _startCamera() {
    if (!window.Html5Qrcode) {
      this._setStatus('Error: libreria de escaneo no disponible', 'error');
      return;
    }
    if (this._scanner) {
      this._scanner.clear().catch(() => {});
      this._scanner = null;
    }

    this._scanner = new Html5Qrcode('barcodeCameraView');
    this._scanning = false;

    const config = {
      fps: 12,
      qrbox: { width: 240, height: 100 },
      aspectRatio: 1.6,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ]
    };

    this._setStatus('Abriendo camara trasera...');

    this._scanner.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => this._onBarcodeDetected(decodedText),
      () => {}
    ).then(() => {
      this._scanning = true;
      const frame = document.getElementById('barcodeFrame');
      if (frame) frame.style.display = 'block';
      this._setStatus('Listo. Apunta al codigo de barras...');
    }).catch((err) => {
      console.error('BarcodeScanner: error camara', err);
      this._setStatus('No se pudo acceder a la camara. Comprueba los permisos.', 'error');
    });
  },

  _stopCamera() {
    if (this._scanner && this._scanning) {
      this._scanner.stop().then(() => {
        this._scanner.clear();
        this._scanner = null;
        this._scanning = false;
      }).catch(() => {
        this._scanner = null;
        this._scanning = false;
      });
    }
  },

  async _onBarcodeDetected(barcode) {
    if (!this._scanning) return;
    this._scanning = false;
    this._stopCamera();

    const frame = document.getElementById('barcodeFrame');
    if (frame) frame.style.display = 'none';
    this._setStatus('Buscando "' + barcode + '" en la base de datos...');

    try {
      const product = await this._fetchProduct(barcode);
      if (product) {
        this._lastScannedProduct = product;
        this._showResult(product);
      } else {
        this._setStatus('Producto no encontrado para el codigo ' + barcode + '. Intentalo de nuevo.', 'error');
        setTimeout(() => this.restartScan(), 3000);
      }
    } catch (err) {
      console.error('BarcodeScanner: error API', err);
      this._setStatus('Error al consultar la base de datos. Revisa tu conexion.', 'error');
      setTimeout(() => this.restartScan(), 3000);
    }
  },

  async _fetchProduct(barcode) {
    // Sanitize barcode input: only allow alphanumeric characters
    const safeBarcode = String(barcode).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    if (!safeBarcode) return null;

    // Rate limit: max 20 API lookups per 15 minutes to prevent abuse
    if (window.Security && !Security.checkRateLimit('barcode_api', 20, 15 * 60 * 1000)) {
      this._setStatus('Demasiadas consultas. Espera unos minutos antes de escanear de nuevo.', 'error');
      return null;
    }

    const url = 'https://world.openfoodfacts.org/api/v0/product/' + encodeURIComponent(safeBarcode) + '.json';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 1 || !data.product) return null;

      const p = data.product;
      const n = p.nutriments || {};
      // Sanitize external API strings to prevent stored XSS
      const sanitize = window.Security ? Security.stripHTML : (s) => String(s).replace(/<[^>]*>/g, '');
      const name = sanitize((p.product_name_es || p.product_name || p.generic_name || 'Producto desconocido').trim());
      const brand = sanitize(p.brands || '');

      // Validate image URL — only allow https
      let imageUrl = '';
      const rawImage = p.image_front_url || p.image_url || '';
      if (rawImage && window.Security ? Security.isValidUrl(rawImage) : /^https?:\/\//.test(rawImage)) {
        imageUrl = rawImage;
      }

      return {
        barcode: safeBarcode,
        name,
        brand,
        image: imageUrl,
        per100g: {
          kcal:    this._round(n['energy-kcal_100g'] !== undefined ? n['energy-kcal_100g'] : (n['energy_100g'] || 0)),
          protein: this._round(n['proteins_100g'] || 0),
          carbs:   this._round(n['carbohydrates_100g'] || 0),
          fat:     this._round(n['fat_100g'] || 0),
        }
      };
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  },

  _showResult(product) {
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('barcodeProductName', product.name);
    setText('barcodeProductBrand', product.brand ? '\uD83C\uDFF7\uFE0F ' + product.brand : '');
    setText('barcodeProductBarcode', '# ' + product.barcode);
    setText('barcodeKcal',    product.per100g.kcal);
    setText('barcodeProtein', product.per100g.protein);
    setText('barcodeCarbs',   product.per100g.carbs);
    setText('barcodeFat',     product.per100g.fat);

    const img = document.getElementById('barcodeProductImg');
    if (img) {
      if (product.image) {
        img.src = product.image;
        img.style.display = 'block';
        img.onerror = () => { img.style.display = 'none'; };
      } else {
        img.style.display = 'none';
      }
    }

    const statusEl = document.getElementById('barcodeScanStatusMsg');
    if (statusEl) statusEl.style.display = 'none';
    const resultEl = document.getElementById('barcodeScanResult');
    if (resultEl) resultEl.style.display = 'block';
  },

  addScannedFood() {
    const product = this._lastScannedProduct;
    if (!product) return;

    const mealSel = document.getElementById('barcodeMealSelect');
    const meal = mealSel ? mealSel.value : 'desayuno';
    const per = product.per100g;

    const activeDate = (window.App && window.App.currentDate) ? window.App.currentDate : Storage.formatDate();
    const dayData = Storage.getDayData(activeDate);
    if (!dayData.meals) dayData.meals = {};
    if (!dayData.meals[meal]) dayData.meals[meal] = [];

    dayData.meals[meal].push({
      id:      Date.now(),
      name:    product.name,
      grams:   100,
      kcal:    per.kcal,
      protein: per.protein,
      carbs:   per.carbs,
      fat:     per.fat,
      source:  'barcode',
      barcode: product.barcode
    });

    Storage.saveDayData(activeDate, dayData);
    this._setStatus('Anadido a ' + this._mealLabel(meal) + '!', 'success');

    if (typeof Nutrition !== 'undefined') Nutrition.render();
    setTimeout(() => this.closeModal(), 1500);
  },

  _resetUI() {
    const statusEl = document.getElementById('barcodeScanStatusMsg');
    if (statusEl) { statusEl.style.display = 'block'; statusEl.style.color = 'var(--text-muted)'; statusEl.textContent = 'Iniciando camara...'; }
    const resultEl = document.getElementById('barcodeScanResult');
    if (resultEl) resultEl.style.display = 'none';
    const frame = document.getElementById('barcodeFrame');
    if (frame) frame.style.display = 'none';
    const view = document.getElementById('barcodeCameraView');
    if (view) view.innerHTML = '';
  },

  _setStatus(msg, type) {
    const el = document.getElementById('barcodeScanStatusMsg');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
    el.style.color = type === 'error'   ? '#ff5277' :
                     type === 'success' ? 'var(--accent-lime)' :
                                          'var(--text-muted)';
  },

  _round(val) {
    return Math.round((parseFloat(val) || 0) * 10) / 10;
  },

  _mealLabel(meal) {
    var labels = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena', snacks: 'Snacks' };
    return labels[meal] || meal;
  },

  _setMealByTime() {
    var h = new Date().getHours();
    var meal = 'snacks';
    if      (h >= 6  && h < 11) meal = 'desayuno';
    else if (h >= 11 && h < 16) meal = 'almuerzo';
    else if (h >= 16 && h < 19) meal = 'merienda';
    else if (h >= 19 && h < 23) meal = 'cena';
    var sel = document.getElementById('barcodeMealSelect');
    if (sel) sel.value = meal;
  }
};
