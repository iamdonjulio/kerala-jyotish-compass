/**
 * jyotish-engine.js (Root Facade & Loader)
 * Backward compatibility wrapper that loads the modular Jyotish Engine.
 * For modern usage, import or include the modules from ./jyotish-engine/ directly.
 */
(function(global) {
  "use strict";

  if (typeof module !== "undefined" && module.exports) {
    require("./jyotish-engine/jyotish-tables.js");
    require("./jyotish-engine/jyotish-astronomy.js");
    require("./jyotish-engine/jyotish-jathakam.js");
    require("./jyotish-engine/jyotish-guidance.js");
    module.exports = require("./jyotish-engine/jyotish-engine.js");
  } else if (typeof document !== "undefined") {
    if (!global.KeralaJyotishEngine) {
      var scripts = [
        "jyotish-engine/jyotish-tables.js",
        "jyotish-engine/jyotish-astronomy.js",
        "jyotish-engine/jyotish-jathakam.js",
        "jyotish-engine/jyotish-guidance.js",
        "jyotish-engine/jyotish-engine.js"
      ];
      scripts.forEach(function(src) {
        var s = document.createElement("script");
        s.src = src;
        s.async = false;
        document.head.appendChild(s);
      });
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
