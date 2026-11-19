/**
 * ============================================================================
 * KERALA JYOTHISHAM (MALAYALAM ASTROLOGY) CALCULATION ENGINE
 * ============================================================================
 * Public facade assembling window.KeralaJyotishEngine (v3.0.0-kerala) from:
 *   1. jyotish-tables.js
 *   2. jyotish-astronomy.js
 *   3. jyotish-jathakam.js
 *   4. jyotish-guidance.js
 * Loaded in order inside index.html.
 */
(function(global) {
  "use strict";

  var KJ = global.__KJ = global.__KJ || {};

  var api = {
    VERSION: "3.0.0-kerala",
    DISTRICTS: KJ.DISTRICTS,
    NAKSHATRAS: KJ.NAKSHATRAS,
    RASHIS: KJ.RASHIS,
    KOLLAM_MONTHS: KJ.KOLLAM_MONTHS,
    VARAS: KJ.VARAS,
    PLANETS: KJ.PLANETS,
    TARA_NAMES: KJ.TARA_NAMES,
    TITHI_NAMES: KJ.TITHI_NAMES,
    KARANA_LIST: KJ.KARANA_LIST,
    YOGA_NAMES: KJ.YOGA_NAMES,
    fmtTime: KJ.fmtTime,
    getSunTimesIST: KJ.getSunTimesIST,
    getKollavarsham: KJ.getKollavarsham,
    computeFullJathakam: KJ.computeFullJathakam,
    evaluateDay: KJ.evaluateDay,
    evaluateWeek: KJ.evaluateWeek,

    // Classical math, Sphutas & Dosha methods (v3.0)
    computePanchaSphutas: KJ.computePanchaSphutas,
    computeYogiPoints: KJ.computeYogiPoints,
    computePanchabhutaAtTime: KJ.computePanchabhutaAtTime,
    evaluateClassicalDoshas: KJ.evaluateClassicalDoshas,

    // Core Astronomy & Jathakam utilities
    getSiderealPlanets: KJ.getSiderealPlanets,
    getSiderealLagna: KJ.getSiderealLagna,
    computeAshtakavarga: KJ.computeAshtakavarga
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.KeralaJyotishEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
