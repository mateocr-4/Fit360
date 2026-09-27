/**
 * Fit360 - Security Module
 * Provides XSS sanitization, input validation, rate limiting, and data integrity checks.
 * 
 * SECURITY HARDENING:
 * - Sanitizes all user-generated text before DOM insertion to prevent XSS
 * - Rate limits external API calls (Open Food Facts) to prevent abuse
 * - Validates imported JSON data schemas to prevent data corruption
 * - Provides safe DOM manipulation helpers as alternatives to raw innerHTML
 */
const Security = {

  // =====================================================================
  // 1. XSS SANITIZATION — Escapes HTML entities in user-supplied strings
  // =====================================================================

  /**
   * Escapes HTML special characters to prevent XSS injection.
   * Use this BEFORE inserting any user-supplied text into innerHTML templates.
   * @param {string} str - Untrusted user input
   * @returns {string} - HTML-safe escaped string
   */
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  /**
   * Sanitizes a string for safe use inside an HTML attribute value.
   * Strips newlines and additional dangerous characters beyond escapeHTML.
   * @param {string} str - Untrusted user input for an attribute
   * @returns {string} - Attribute-safe string
   */
  escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return Security.escapeHTML(String(str).replace(/[\n\r]/g, ' '));
  },

  /**
   * Strips all HTML tags from a string, leaving only text content.
   * Useful for cleaning imported data or clipboard pastes.
   * @param {string} str - Potentially HTML-contaminated string
   * @returns {string} - Plain text only
   */
  stripHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/<[^>]*>/g, '');
  },

  /**
   * Sanitizes user input for safe storage — strips HTML and trims.
   * Use when saving form input values to LocalStorage.
   * @param {string} input - Raw form input value
   * @param {number} maxLength - Maximum allowed length (default 500)
   * @returns {string} - Clean, safe string
   */
  sanitizeInput(input, maxLength = 500) {
    if (input === null || input === undefined) return '';
    let clean = Security.stripHTML(String(input)).trim();
    if (clean.length > maxLength) {
      clean = clean.substring(0, maxLength);
    }
    return clean;
  },

  /**
   * Sanitizes a numeric input, returning a clamped number or a default.
   * Prevents NaN injection and extremely large/small values.
   * @param {*} value - Raw input value
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @param {number} fallback - Default value if input is invalid
   * @returns {number}
   */
  sanitizeNumber(value, min = 0, max = 99999, fallback = 0) {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
  },


  // =====================================================================
  // 2. RATE LIMITING — Throttles API calls to prevent abuse
  // =====================================================================

  /** @type {Map<string, {count: number, resetTime: number}>} */
  _rateLimitBuckets: new Map(),

  /**
   * Checks if an action is rate-limited. Returns true if the action is ALLOWED.
   * @param {string} action - Identifier for the action (e.g., 'barcode_scan', 'api_fetch')
   * @param {number} maxRequests - Max allowed requests within the window
   * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
   * @returns {boolean} - true if allowed, false if rate-limited
   */
  checkRateLimit(action, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    let bucket = Security._rateLimitBuckets.get(action);

    if (!bucket || now > bucket.resetTime) {
      // Create or reset the bucket
      bucket = { count: 0, resetTime: now + windowMs };
      Security._rateLimitBuckets.set(action, bucket);
    }

    bucket.count++;

    if (bucket.count > maxRequests) {
      console.warn(`[Security] Rate limit exceeded for action: ${action} (${bucket.count}/${maxRequests})`);
      return false; // BLOCKED
    }

    return true; // ALLOWED
  },

  /**
   * Returns the remaining requests for an action's current window.
   * @param {string} action
   * @param {number} maxRequests
   * @returns {number}
   */
  getRateLimitRemaining(action, maxRequests = 100) {
    const bucket = Security._rateLimitBuckets.get(action);
    if (!bucket || Date.now() > bucket.resetTime) return maxRequests;
    return Math.max(0, maxRequests - bucket.count);
  },


  // =====================================================================
  // 3. IMPORT DATA VALIDATION — Prevents data corruption attacks
  // =====================================================================

  /**
   * Validates the schema of an imported Fit360 backup JSON.
   * Checks for expected structure to prevent malicious payloads.
   * @param {object} data - Parsed JSON object from import
   * @returns {{valid: boolean, error: string|null}}
   */
  validateImportData(data) {
    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'El archivo no contiene datos JSON válidos.' };
    }

    // Must have a version field
    if (data.version && typeof data.version !== 'string') {
      return { valid: false, error: 'Campo "version" inválido.' };
    }

    // Settings validation
    if (data.settings) {
      if (typeof data.settings !== 'object') {
        return { valid: false, error: 'El campo "settings" debe ser un objeto.' };
      }
      // Validate numeric goals if present
      if (data.settings.goals) {
        const goals = data.settings.goals;
        const numericFields = ['kcal', 'protein', 'carbs', 'fat'];
        for (const field of numericFields) {
          if (goals[field] !== undefined && (typeof goals[field] !== 'number' || goals[field] < 0 || goals[field] > 50000)) {
            return { valid: false, error: `Valor inválido en goals.${field}.` };
          }
        }
      }
    }

    // Daily data validation
    if (data.data) {
      if (typeof data.data !== 'object') {
        return { valid: false, error: 'El campo "data" debe ser un objeto.' };
      }
      // Validate date keys format
      const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const key of Object.keys(data.data)) {
        if (!dateKeyRegex.test(key)) {
          return { valid: false, error: `Clave de fecha inválida: "${Security.escapeHTML(key)}".` };
        }
      }
    }

    // Size check — prevent extremely large payloads (max 50 MB)
    const jsonSize = JSON.stringify(data).length;
    if (jsonSize > 50 * 1024 * 1024) {
      return { valid: false, error: 'El archivo es demasiado grande (máximo 50 MB).' };
    }

    return { valid: true, error: null };
  },

  /**
   * Deep-sanitizes all string values in an object before storage.
   * Recursively walks the object and strips HTML from all string values.
   * @param {*} obj - Object to sanitize
   * @param {number} depth - Current recursion depth (to prevent stack overflow)
   * @returns {*} - Sanitized copy
   */
  deepSanitizeStrings(obj, depth = 0) {
    if (depth > 20) return obj; // Prevent infinite recursion

    if (typeof obj === 'string') {
      return Security.stripHTML(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => Security.deepSanitizeStrings(item, depth + 1));
    }

    if (typeof obj === 'object' && obj !== null) {
      const clean = {};
      for (const [key, value] of Object.entries(obj)) {
        const safeKey = Security.stripHTML(key);
        clean[safeKey] = Security.deepSanitizeStrings(value, depth + 1);
      }
      return clean;
    }

    return obj; // numbers, booleans, null — pass through
  },


  // =====================================================================
  // 4. SAFE DOM HELPERS — Alternatives to raw innerHTML
  // =====================================================================

  /**
   * Sets text content safely (no HTML parsing).
   * @param {string} elementId - Target element ID
   * @param {string} text - Text to set
   */
  setText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = String(text);
  },

  /**
   * Creates a text node safely.
   * @param {string} text
   * @returns {Text}
   */
  createTextNode(text) {
    return document.createTextNode(String(text));
  },


  // =====================================================================
  // 5. URL VALIDATION
  // =====================================================================

  /**
   * Validates that a URL is safe (http/https only, no javascript: protocol).
   * @param {string} url
   * @returns {boolean}
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
};

window.Security = Security;
