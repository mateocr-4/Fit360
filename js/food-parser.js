/**
 * Fit360 — FoodParser (Motor Determinista Offline de Texto Libre)
 * 
 * Parsea descripciones en lenguaje natural en español (ej: "2 huevos y tostada con aguacate",
 * "200g de pollo y 150g de arroz", "yogur griego con avena") sin requerir conexión ni APIs externas.
 */

(function (global) {
  'use strict';

  // Base fallback de alimentos por 100g si el catálogo externo no está disponible
  const BUILTIN_FOODS = [
    { name: 'Pechuga de pollo limpia', category: 'Carnes', per100g: { kcal: 120, protein: 24, carbs: 0, fat: 2 }, defaultGrams: 200 },
    { name: 'Pechuga de pavo', category: 'Carnes', per100g: { kcal: 105, protein: 23, carbs: 0, fat: 1 }, defaultGrams: 150 },
    { name: 'Ternera magra / Lomo', category: 'Carnes', per100g: { kcal: 140, protein: 22, carbs: 0, fat: 5 }, defaultGrams: 180 },
    { name: 'Pavo fileteado (fiambre)', category: 'Carnes', per100g: { kcal: 105, protein: 18.5, carbs: 1.5, fat: 2.8 }, defaultGrams: 80 },
    { name: 'Jamón serrano', category: 'Carnes', per100g: { kcal: 241, protein: 31, carbs: 0, fat: 13 }, defaultGrams: 40 },
    { name: 'Salmón fresco', category: 'Pescados', per100g: { kcal: 206, protein: 20, carbs: 0, fat: 13 }, defaultGrams: 180 },
    { name: 'Atún al natural (en lata)', category: 'Pescados', per100g: { kcal: 100, protein: 24, carbs: 0, fat: 1 }, defaultGrams: 80, naturalUnitGrams: { 'lata': 80, 'latas': 80 } },
    { name: 'Huevos enteros (unidad ~55g)', category: 'Huevos', per100g: { kcal: 143, protein: 13, carbs: 1, fat: 10 }, defaultGrams: 110, naturalUnitGrams: { 'unidad': 55, 'unidades': 55, 'huevo': 55, 'huevos': 55 } },
    { name: 'Claras de huevo pasteurizadas', category: 'Huevos', per100g: { kcal: 50, protein: 11, carbs: 1, fat: 0 }, defaultGrams: 200 },
    { name: 'Yogur griego 0% natural', category: 'Lácteos', per100g: { kcal: 57, protein: 10, carbs: 4, fat: 0 }, defaultGrams: 150 },
    { name: 'Queso fresco batido 0%', category: 'Lácteos', per100g: { kcal: 46, protein: 8.5, carbs: 3.5, fat: 0.1 }, defaultGrams: 200 },
    { name: 'Proteína Whey Isolate', category: 'Suplementos', per100g: { kcal: 375, protein: 85, carbs: 3, fat: 2 }, defaultGrams: 30, naturalUnitGrams: { 'scoop': 30, 'scoops': 30, 'cacito': 30, 'cacitos': 30 } },
    { name: 'Copos de avena integral', category: 'Cereales', per100g: { kcal: 370, protein: 13, carbs: 60, fat: 7 }, defaultGrams: 60 },
    { name: 'Arroz blanco cocido', category: 'Cereales', per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 }, defaultGrams: 200 },
    { name: 'Arroz integral cocido', category: 'Cereales', per100g: { kcal: 123, protein: 2.7, carbs: 26, fat: 1 }, defaultGrams: 200 },
    { name: 'Pasta cocida (espaguetis/macarrones)', category: 'Cereales', per100g: { kcal: 150, protein: 5, carbs: 30, fat: 1 }, defaultGrams: 200 },
    { name: 'Patata cocida / asada', category: 'Tubérculos', per100g: { kcal: 85, protein: 2, carbs: 19, fat: 0.1 }, defaultGrams: 250 },
    { name: 'Boniato / Batata', category: 'Tubérculos', per100g: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 }, defaultGrams: 200 },
    { name: 'Pan 100% integral', category: 'Pan', per100g: { kcal: 245, protein: 9, carbs: 45, fat: 2.5 }, defaultGrams: 70, naturalUnitGrams: { 'rebanada': 35, 'rebanadas': 35, 'tostada': 35, 'tostadas': 35 } },
    { name: 'Tortilla de trigo (wrap)', category: 'Pan', per100g: { kcal: 312, protein: 8.5, carbs: 52, fat: 8 }, defaultGrams: 65, naturalUnitGrams: { 'unidad': 65, 'unidades': 65, 'wrap': 65, 'wraps': 65 } },
    { name: 'Plátano maduro', category: 'Frutas', per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 }, defaultGrams: 120, naturalUnitGrams: { 'unidad': 120, 'unidades': 120, 'platano': 120, 'platanos': 120, 'banana': 120 } },
    { name: 'Manzana con piel', category: 'Frutas', per100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, defaultGrams: 180, naturalUnitGrams: { 'unidad': 180, 'unidades': 180, 'manzana': 180, 'manzanas': 180 } },
    { name: 'Fresas / Frutos rojos', category: 'Frutas', per100g: { kcal: 33, protein: 0.7, carbs: 8, fat: 0.3 }, defaultGrams: 150 },
    { name: 'Tomate natural', category: 'Verduras', per100g: { kcal: 18, protein: 0.9, carbs: 3.5, fat: 0.2 }, defaultGrams: 150 },
    { name: 'Brócoli', category: 'Verduras', per100g: { kcal: 34, protein: 2.8, carbs: 4, fat: 0.4 }, defaultGrams: 150 },
    { name: 'Espinacas frescas', category: 'Verduras', per100g: { kcal: 23, protein: 2.9, carbs: 1.4, fat: 0.4 }, defaultGrams: 100 },
    { name: 'Champiñones / Setas', category: 'Verduras', per100g: { kcal: 22, protein: 3.1, carbs: 0.5, fat: 0.3 }, defaultGrams: 100 },
    { name: 'Lechuga romana', category: 'Verduras', per100g: { kcal: 17, protein: 1.2, carbs: 2, fat: 0.3 }, defaultGrams: 80 },
    { name: 'Aceite de oliva virgen extra', category: 'Grasas', per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, defaultGrams: 10, naturalUnitGrams: { 'cucharada': 10, 'cucharadas': 10, 'cda': 10, 'cdas': 10, 'cucharadita': 5, 'cdita': 5 } },
    { name: 'Aguacate', category: 'Grasas', per100g: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 }, defaultGrams: 80, naturalUnitGrams: { 'medio': 40, 'media': 40, 'unidad': 80, 'unidades': 80 } },
    { name: 'Nueces naturales', category: 'Grasas', per100g: { kcal: 654, protein: 15, carbs: 14, fat: 65 }, defaultGrams: 30 },
    { name: 'Crema de cacahuete 100%', category: 'Grasas', per100g: { kcal: 588, protein: 25, carbs: 20, fat: 50 }, defaultGrams: 25, naturalUnitGrams: { 'cucharada': 20, 'cucharadas': 20, 'cda': 20 } },
    { name: 'Semillas de chía', category: 'Grasas', per100g: { kcal: 486, protein: 16.5, carbs: 42, fat: 31 }, defaultGrams: 15 },
    { name: 'Leche de avena (sin azúcar)', category: 'Bebidas', per100g: { kcal: 44, protein: 1, carbs: 6.5, fat: 1.5 }, defaultGrams: 200, naturalUnitGrams: { 'vaso': 200, 'vasos': 200, 'taza': 200 } },
    { name: 'Hummus clásico', category: 'Legumbres', per100g: { kcal: 166, protein: 7.9, carbs: 14.3, fat: 9.6 }, defaultGrams: 50 },
    { name: 'Chocolate negro 85%', category: 'Snacks', per100g: { kcal: 580, protein: 10, carbs: 30, fat: 46 }, defaultGrams: 20 },
    { name: 'Tortita de arroz', category: 'Snacks', per100g: { kcal: 380, protein: 8, carbs: 80, fat: 2 }, defaultGrams: 30, naturalUnitGrams: { 'unidad': 10, 'unidades': 10, 'tortita': 10, 'tortitas': 10 } }
  ];

  // Sinónimos directos para mapeo ultra-rápido y exacto
  const SYNONYMS = {
    'huevo': 'Huevos enteros (unidad ~55g)',
    'huevos': 'Huevos enteros (unidad ~55g)',
    'huevo entero': 'Huevos enteros (unidad ~55g)',
    'huevos enteros': 'Huevos enteros (unidad ~55g)',
    'huevo cocido': 'Huevos enteros (unidad ~55g)',
    'huevos fritos': 'Huevos enteros (unidad ~55g)',
    'huevos revueltos': 'Huevos enteros (unidad ~55g)',
    'huevo revuelto': 'Huevos enteros (unidad ~55g)',
    'clara': 'Claras de huevo pasteurizadas',
    'claras': 'Claras de huevo pasteurizadas',
    'claras de huevo': 'Claras de huevo pasteurizadas',
    'pollo': 'Pechuga de pollo limpia',
    'pechuga': 'Pechuga de pollo limpia',
    'pechuga de pollo': 'Pechuga de pollo limpia',
    'pechuga pollo': 'Pechuga de pollo limpia',
    'filete de pollo': 'Pechuga de pollo limpia',
    'pavo': 'Pechuga de pavo',
    'pechuga de pavo': 'Pechuga de pavo',
    'fiambre de pavo': 'Pavo fileteado (fiambre)',
    'pavo fileteado': 'Pavo fileteado (fiambre)',
    'jamon': 'Jamón serrano',
    'jamón': 'Jamón serrano',
    'jamon serrano': 'Jamón serrano',
    'arroz': 'Arroz blanco cocido',
    'arroz blanco': 'Arroz blanco cocido',
    'arroz integral': 'Arroz integral cocido',
    'avena': 'Copos de avena integral',
    'copos de avena': 'Copos de avena integral',
    'harina de avena': 'Copos de avena integral',
    'platano': 'Plátano maduro',
    'plátano': 'Plátano maduro',
    'platanos': 'Plátano maduro',
    'plátanos': 'Plátano maduro',
    'banana': 'Plátano maduro',
    'bananas': 'Plátano maduro',
    'manzana': 'Manzana con piel',
    'manzanas': 'Manzana con piel',
    'pan': 'Pan 100% integral',
    'tostada': 'Pan 100% integral',
    'tostadas': 'Pan 100% integral',
    'pan integral': 'Pan 100% integral',
    'pan blanco': 'Pan 100% integral',
    'pan de centeno': 'Pan 100% integral',
    'rebanada de pan': 'Pan 100% integral',
    'rebanadas de pan': 'Pan 100% integral',
    'wrap': 'Tortilla de trigo (wrap)',
    'wraps': 'Tortilla de trigo (wrap)',
    'tortilla de trigo': 'Tortilla de trigo (wrap)',
    'aguacate': 'Aguacate',
    'aguacates': 'Aguacate',
    'palta': 'Aguacate',
    'yogur': 'Yogur griego 0% natural',
    'yogurt': 'Yogur griego 0% natural',
    'yogur griego': 'Yogur griego 0% natural',
    'yogurt griego': 'Yogur griego 0% natural',
    'queso fresco batido': 'Queso fresco batido 0%',
    'queso batido': 'Queso fresco batido 0%',
    'proteina': 'Proteína Whey Isolate',
    'proteína': 'Proteína Whey Isolate',
    'whey': 'Proteína Whey Isolate',
    'batido de proteina': 'Proteína Whey Isolate',
    'batido de proteína': 'Proteína Whey Isolate',
    'batido': 'Proteína Whey Isolate',
    'atun': 'Atún al natural (en lata)',
    'atún': 'Atún al natural (en lata)',
    'lata de atun': 'Atún al natural (en lata)',
    'salmon': 'Salmón fresco',
    'salmón': 'Salmón fresco',
    'ternera': 'Ternera magra / Lomo',
    'carne picada': 'Ternera magra / Lomo',
    'pasta': 'Pasta cocida (espaguetis/macarrones)',
    'espaguetis': 'Pasta cocida (espaguetis/macarrones)',
    'macarrones': 'Pasta cocida (espaguetis/macarrones)',
    'patata': 'Patata cocida / asada',
    'patatas': 'Patata cocida / asada',
    'papa': 'Patata cocida / asada',
    'papas': 'Patata cocida / asada',
    'boniato': 'Boniato / Batata',
    'batata': 'Boniato / Batata',
    'aceite': 'Aceite de oliva virgen extra',
    'aove': 'Aceite de oliva virgen extra',
    'aceite de oliva': 'Aceite de oliva virgen extra',
    'nueces': 'Nueces naturales',
    'nuez': 'Nueces naturales',
    'crema de cacahuete': 'Crema de cacahuete 100%',
    'mantequilla de cacahuete': 'Crema de cacahuete 100%',
    'mantequilla de mani': 'Crema de cacahuete 100%',
    'leche': 'Leche de avena (sin azúcar)',
    'leche de avena': 'Leche de avena (sin azúcar)',
    'hummus': 'Hummus clásico',
    'brocoli': 'Brócoli',
    'brócoli': 'Brócoli',
    'espinaca': 'Espinacas frescas',
    'espinacas': 'Espinacas frescas',
    'tomate': 'Tomate natural',
    'tomates': 'Tomate natural',
    'lechuga': 'Lechuga romana',
    'fresas': 'Fresas / Frutos rojos',
    'frutos rojos': 'Fresas / Frutos rojos',
    'arandanos': 'Fresas / Frutos rojos',
    'arándanos': 'Fresas / Frutos rojos',
    'chocolate': 'Chocolate negro 85%',
    'chocolate negro': 'Chocolate negro 85%',
    'tortita de arroz': 'Tortita de arroz',
    'tortitas de arroz': 'Tortita de arroz'
  };

  // Números en texto español
  const NUMBER_WORDS = {
    'un': 1, 'una': 1, 'uno': 1,
    'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
    'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
    'medio': 0.5, 'media': 0.5,
    '1/2': 0.5, '1/4': 0.25, '3/4': 0.75
  };

  // Normalización de texto (eliminar tildes y caracteres extra)
  function normalizeStr(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s\/\.,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Medida de similitud de cadenas (Dice coefficient con bigramas)
  function stringSimilarity(s1, s2) {
    const a = normalizeStr(s1);
    const b = normalizeStr(s2);
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) return 0.85;

    // Tokens matching
    const wordsA = a.split(' ').filter(w => w.length > 2);
    const wordsB = b.split(' ').filter(w => w.length > 2);
    if (wordsA.length === 0 || wordsB.length === 0) return 0;

    const intersection = wordsA.filter(w => wordsB.includes(w));
    if (intersection.length > 0) {
      return intersection.length / Math.max(wordsA.length, wordsB.length);
    }

    if (a.length < 2 || b.length < 2) return 0;
    const bigramsA = new Set();
    for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substr(i, 2));
    let hits = 0;
    for (let i = 0; i < b.length - 1; i++) {
      if (bigramsA.has(b.substr(i, 2))) hits++;
    }
    return (2.0 * hits) / (a.length + b.length - 2);
  }

  const FoodParser = {
    /**
     * Obtiene el catálogo consolidado de alimentos disponibles
     */
    getCatalog(customDb) {
      if (customDb && Array.isArray(customDb)) return customDb;

      const catalog = [];
      const seenNames = new Set();

      function addFood(f) {
        if (!f || !f.name) return;
        const norm = normalizeStr(f.name);
        if (seenNames.has(norm)) return;
        seenNames.add(norm);

        const per100g = f.per100g || {
          kcal: Number(f.kcal) || 0,
          protein: Number(f.protein) || 0,
          carbs: Number(f.carbs) || 0,
          fat: Number(f.fat) || 0
        };

        catalog.push({
          name: f.name,
          category: f.category || 'Varios',
          per100g: per100g,
          defaultGrams: Number(f.defaultGrams) || (f.naturalUnitGrams ? 100 : 100),
          naturalUnitGrams: f.naturalUnitGrams || null
        });
      }

      // 1. Favoritos de Storage si existen
      if (global.Storage && typeof global.Storage.getFavoriteFoods === 'function') {
        try {
          global.Storage.getFavoriteFoods().forEach(addFood);
        } catch (e) {}
      }

      // 2. Recientes de Storage si existen
      if (global.Storage && typeof global.Storage.getRecentFoods === 'function') {
        try {
          global.Storage.getRecentFoods().forEach(addFood);
        } catch (e) {}
      }

      // 3. Preset foods de Nutrition
      if (global.Nutrition && Array.isArray(global.Nutrition.PRESET_FOODS)) {
        global.Nutrition.PRESET_FOODS.forEach(addFood);
      }

      // 4. Base de referencia NUTRITION_REFERENCE_DB
      if (global.NUTRITION_REFERENCE_DB && Array.isArray(global.NUTRITION_REFERENCE_DB)) {
        global.NUTRITION_REFERENCE_DB.forEach(addFood);
      }

      // 5. Fallback con BUILTIN_FOODS
      BUILTIN_FOODS.forEach(addFood);

      return catalog;
    },

    /**
     * Divide una cadena libre en segmentos de comida individuales
     */
    splitIntoSegments(text) {
      if (!text || typeof text !== 'string') return [];
      let clean = text.trim();
      if (!clean) return [];

      // Reemplazar saltos de línea y viñetas por coma
      clean = clean.replace(/[\n\r]+/g, ', ').replace(/^[-•*]\s+/gm, ', ');

      // Separadores conjuntivos seguros en español: " y ", " e ", " + ", ", ", "; "
      // Tratamiento especial de " con ":
      // Si dice "tostada con aguacate" -> dividir en ["tostada", "aguacate"]
      // Si dice "yogur griego con avena" -> ["yogur griego", "avena"]
      // Pero no romper si es parte de un ingrediente indivisible como "café con leche"
      const compositePhrases = ['cafe con leche', 'café con leche'];
      compositePhrases.forEach((comp, idx) => {
        const regex = new RegExp(comp, 'gi');
        clean = clean.replace(regex, `__COMP_${idx}__`);
      });

      // Reemplazar conjuntivos por delimitador "|"
      clean = clean
        .replace(/\s+(?:y|e|\+)\s+/gi, ' | ')
        .replace(/\s+con\s+/gi, ' | ')
        .replace(/[,;]+/g, ' | ');

      compositePhrases.forEach((comp, idx) => {
        clean = clean.replace(new RegExp(`__COMP_${idx}__`, 'g'), comp);
      });

      return clean
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    },

    /**
     * Extrae cantidad, unidad y nombre del alimento de un segmento
     */
    extractQuantityAndName(segment) {
      let raw = segment.trim();
      // Eliminar conectores iniciales como "de", "del", "un poco de"
      raw = raw.replace(/^(?:un poco de|algo de|unos|unas)\s+/i, '');

      let quantity = 1;
      let unit = 'unidad';
      let gramsExplicit = null;
      let foodPart = raw;

      // 1. Caso explícito de gramos: ej "200g de pollo", "200 gr pechuga", "pollo 200g"
      const gramsMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grs|gramos?)\b/i);
      if (gramsMatch) {
        gramsExplicit = parseFloat(gramsMatch[1].replace(',', '.'));
        foodPart = raw.replace(gramsMatch[0], '').replace(/^\s*de\s+/i, '').trim();
        return {
          quantity: gramsExplicit,
          unit: 'g',
          grams: gramsExplicit,
          foodName: foodPart.replace(/^\s*de\s+/i, '').trim(),
          rawText: raw
        };
      }

      // 2. Caso mililitros: ej "250ml de leche"
      const mlMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|mls|mililitros?|cc)\b/i);
      if (mlMatch) {
        const ml = parseFloat(mlMatch[1].replace(',', '.'));
        foodPart = raw.replace(mlMatch[0], '').replace(/^\s*de\s+/i, '').trim();
        return {
          quantity: ml,
          unit: 'ml',
          grams: ml, // 1 ml ~ 1 g en líquidos nutricionales estándar
          foodName: foodPart.replace(/^\s*de\s+/i, '').trim(),
          rawText: raw
        };
      }

      // 3. Caso unidades / porciones / cantidades (ej: "2 huevos", "1.5 platanos", "3 rebanadas de pan", "1 cucharada de aceite")
      const qtyUnitRegex = /^(\d+(?:[.,]\d+)?|\d+\/\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|medio|media)\s*(rebanadas?|rodajas?|lonchas?|filetes?|cucharadas?|cdas?|cucharaditas?|cditas?|tazas?|vasos?|latas?|scoops?|cacitos?|piezas?|unidades?|uds?)?\s*(?:de\s+)?(.*)$/i;
      const match = raw.match(qtyUnitRegex);

      if (match) {
        const numToken = match[1].toLowerCase();
        if (NUMBER_WORDS[numToken] !== undefined) {
          quantity = NUMBER_WORDS[numToken];
        } else if (numToken.includes('/')) {
          const parts = numToken.split('/');
          quantity = parseFloat(parts[0]) / parseFloat(parts[1]);
        } else {
          quantity = parseFloat(numToken.replace(',', '.'));
        }

        if (match[2]) {
          unit = match[2].toLowerCase();
        } else {
          unit = 'unidad';
        }

        foodPart = (match[3] || '').trim();
        // Si no quedó alimento (ej: "2 huevos" donde "huevos" fue tomado como alimento directo)
        if (!foodPart && (unit === 'unidad' || !match[2])) {
          foodPart = raw.replace(/^(\d+(?:[.,]\d+)?|\d+\/\d+|un[ao]?|dos|tres|cuatro|cinco|medio|media)\s*/i, '').trim();
        }
      }

      foodPart = foodPart.replace(/^\s*de\s+/i, '').trim();
      if (!foodPart) {
        foodPart = raw;
      }

      return {
        quantity: isNaN(quantity) ? 1 : quantity,
        unit: unit,
        grams: null,
        foodName: foodPart,
        rawText: raw
      };
    },

    /**
     * Busca la mejor coincidencia en el catálogo para un nombre dado
     */
    matchFood(foodName, catalog) {
      if (!foodName) return null;
      const norm = normalizeStr(foodName);

      // 1. Diccionario de sinónimos exacto
      if (SYNONYMS[norm]) {
        const target = SYNONYMS[norm];
        const found = catalog.find(f => f.name.toLowerCase() === target.toLowerCase());
        if (found) {
          return { food: found, confidence: 1.0, method: 'synonym' };
        }
      }

      // 2. Coincidencia exacta de nombre en catálogo
      for (const item of catalog) {
        if (normalizeStr(item.name) === norm) {
          return { food: item, confidence: 1.0, method: 'exact' };
        }
      }

      // 3. Contención directa o prefijo
      for (const item of catalog) {
        const itemNorm = normalizeStr(item.name);
        if (itemNorm.startsWith(norm) || norm.startsWith(itemNorm)) {
          return { food: item, confidence: 0.9, method: 'prefix' };
        }
      }

      // 4. Búsqueda por palabras clave relevantes
      const inputWords = norm.split(' ').filter(w => w.length > 2);
      let bestItem = null;
      let highestScore = 0;

      for (const item of catalog) {
        const itemNorm = normalizeStr(item.name);
        let score = stringSimilarity(norm, itemNorm);

        // Bonificación si todas las palabras de entrada están en el nombre del catálogo
        const allWordsPresent = inputWords.every(w => itemNorm.includes(w));
        if (allWordsPresent && inputWords.length > 0) {
          score = Math.max(score, 0.85);
        }

        if (score > highestScore) {
          highestScore = score;
          bestItem = item;
        }
      }

      if (bestItem && highestScore >= 0.5) {
        return { food: bestItem, confidence: highestScore, method: 'fuzzy' };
      }

      return null;
    },

    /**
     * Calcula los gramos exactos en función de la unidad y alimento
     */
    calculateGrams(parsedQty, matchedFood) {
      if (parsedQty.grams !== null && !isNaN(parsedQty.grams)) {
        return parsedQty.grams;
      }

      const qty = parsedQty.quantity || 1;
      const unit = parsedQty.unit || 'unidad';

      if (!matchedFood) {
        return Math.round(qty * 100);
      }

      // Unidades naturales específicas del alimento (ej: huevo -> 55g, lata atún -> 80g)
      if (matchedFood.naturalUnitGrams && matchedFood.naturalUnitGrams[unit]) {
        return Math.round(qty * matchedFood.naturalUnitGrams[unit]);
      }

      // Unidades estándar comunes
      const standardUnits = {
        'rebanada': 35,
        'rebanadas': 35,
        'tostada': 35,
        'tostadas': 35,
        'loncha': 25,
        'lonchas': 25,
        'cucharada': 15,
        'cucharadas': 15,
        'cda': 15,
        'cdas': 15,
        'cucharadita': 5,
        'cucharaditas': 5,
        'cdita': 5,
        'cditas': 5,
        'taza': 200,
        'tazas': 200,
        'vaso': 200,
        'vasos': 200,
        'scoop': 30,
        'scoops': 30,
        'cacito': 30,
        'cacitos': 30,
        'lata': 80,
        'latas': 80
      };

      if (standardUnits[unit]) {
        // Excepción: aceite en cucharada = 10g
        if (matchedFood.name.toLowerCase().includes('aceite') && (unit.startsWith('cucharada') || unit.startsWith('cda'))) {
          return Math.round(qty * 10);
        }
        return Math.round(qty * standardUnits[unit]);
      }

      // Si es "unidad" o cantidad directa sin unidad (ej: 2 huevos, 1 plátano)
      if (unit === 'unidad' || unit === 'unidades' || unit === 'pieza' || unit === 'piezas') {
        // Comprobar si el nombre tiene unidades naturales
        const norm = normalizeStr(matchedFood.name);
        if (norm.includes('huevo') && !norm.includes('clara')) {
          return Math.round(qty * 55);
        }
        if (norm.includes('platano') || norm.includes('banana')) {
          return Math.round(qty * 120);
        }
        if (norm.includes('manzana')) {
          return Math.round(qty * 180);
        }
        if (norm.includes('aguacate')) {
          return Math.round(qty * 80);
        }
        if (norm.includes('pan') || norm.includes('tostada')) {
          return Math.round(qty * 35);
        }
        if (norm.includes('tortita de arroz')) {
          return Math.round(qty * 10);
        }

        // Si el alimento tiene defaultGrams especificado
        if (matchedFood.defaultGrams) {
          return Math.round(qty * matchedFood.defaultGrams);
        }
      }

      // Fallback
      return Math.round(qty * (matchedFood.defaultGrams || 100));
    },

    /**
     * Parsea un texto libre y retorna lista de alimentos calculados
     * 
     * @param {string} text - Texto libre en español
     * @param {Array} [customCatalog] - Catálogo opcional para tests
     * @returns {Object} { items: [...], totalKcal, totalProtein, totalCarbs, totalFat }
     */
    parse(text, customCatalog = null) {
      if (!text || typeof text !== 'string') {
        return { items: [], totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
      }

      const catalog = this.getCatalog(customCatalog);
      const segments = this.splitIntoSegments(text);
      const items = [];

      let totalKcal = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      for (const segment of segments) {
        const parsedQty = this.extractQuantityAndName(segment);
        const matchResult = this.matchFood(parsedQty.foodName, catalog);

        if (matchResult && matchResult.food) {
          const food = matchResult.food;
          const grams = this.calculateGrams(parsedQty, food);
          const factor = grams / 100;

          const base = food.per100g || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
          const kcal = Math.round((Number(base.kcal) || 0) * factor);
          const protein = Math.round((Number(base.protein) || 0) * factor * 10) / 10;
          const carbs = Math.round((Number(base.carbs) || 0) * factor * 10) / 10;
          const fat = Math.round((Number(base.fat) || 0) * factor * 10) / 10;

          const item = {
            id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: `${food.name} (${grams}g)`,
            baseName: food.name,
            rawText: segment,
            grams: grams,
            quantity: parsedQty.quantity,
            unit: parsedQty.unit,
            kcal: kcal,
            protein: protein,
            carbs: carbs,
            fat: fat,
            confidence: matchResult.confidence,
            unmatched: false
          };

          items.push(item);
          totalKcal += kcal;
          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;
        } else {
          // Elemento sin coincidencia en catálogo (editable por el usuario)
          const fallbackGrams = parsedQty.grams || Math.round(parsedQty.quantity * 100) || 100;
          const item = {
            id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: parsedQty.foodName ? `${parsedQty.foodName} (${fallbackGrams}g)` : segment,
            baseName: parsedQty.foodName || segment,
            rawText: segment,
            grams: fallbackGrams,
            quantity: parsedQty.quantity,
            unit: parsedQty.unit,
            kcal: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            confidence: 0,
            unmatched: true
          };
          items.push(item);
        }
      }

      return {
        items: items,
        totalKcal: totalKcal,
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10
      };
    }
  };

  // Exposición en entorno navegador y Node.js (para tests)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodParser;
  }
  global.FoodParser = FoodParser;

})(typeof window !== 'undefined' ? window : global);
