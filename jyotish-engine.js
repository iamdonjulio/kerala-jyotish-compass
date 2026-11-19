/**
 * ============================================================================
 * KERALA JYOTHISHAM (MALAYALAM ASTROLOGY) FULL CALCULATION ENGINE (v2.0)
 * ============================================================================
 * Pure client-side, zero-dependency astronomical & Kerala Jyothisham engine.
 * Computes the complete astrologer-grade Birth Dossier (Janma Jathakam) and
 * Daily Transit & Panchangam Snapshot (Gocharam), while exposing a clean
 * distilled summary contract so the Calm UI only displays what is needed.
 *
 * Conventions enforced:
 *  - Chitra Paksha (Lahiri) Ayanamsa
 *  - Pre-sunrise birth Vara rollback (Sunrise-to-Sunrise Kerala weekday rule)
 *  - Exact 4-quadrant Sidereal Udaya Lagnam + D-1 (Rashi), D-3 (Drekkana),
 *    D-9 (Navamsa), D-10 (Dasamsa), and Vargottama detection
 *  - Retrograde (Vakram), Combustion (Moudhyam), Baladi Avastha, and
 *    5-fold Compound Planetary Friendship (Panchadha Graha Maitri)
 *  - Kerala Upagrahas: Gulikan (Mandi) & Yamakantakan
 *  - Vimshottari Mahadasha -> Apaharam -> Pratyantardasha with exact dates
 *  - Ashtakavarga (Bhinna & Sarva) bindu tables
 *  - Kuja Dosham & Sade Sati / Ashtamashani / Kandakashani detection
 *  - All 5 Panchangam Angas + exact IST transition timestamps for Nakshatra,
 *    Tithi, Karana, and Nithya Yoga
 *  - Kerala Nakshatra Tyajyam (Varjyam) & Amritakalam windows in IST
 *  - Kollavarsham solar date via Kerala 3/5ths daytime (Aparahna) Sankramam
 */
(function(global) {
  "use strict";

  var DEG = Math.PI / 180;
  var RAD = 180 / Math.PI;

  /* --------------------------------------------------------------------------
     1. KERALA DISTRICTS & BILINGUAL MASTER TABLES
     -------------------------------------------------------------------------- */
  var DISTRICTS = [
    { id: "tvm", ml: "തിരുവനന്തപുരം", en: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
    { id: "klm", ml: "കൊല്ലം", en: "Kollam", lat: 8.8932, lon: 76.6141 },
    { id: "pta", ml: "പത്തനംതിട്ട", en: "Pathanamthitta", lat: 9.2648, lon: 76.7870 },
    { id: "alp", ml: "ആലപ്പുഴ", en: "Alappuzha", lat: 9.4981, lon: 76.3388 },
    { id: "ktm", ml: "കോട്ടയം", en: "Kottayam", lat: 9.5916, lon: 76.5222 },
    { id: "idk", ml: "ഇടുക്കി", en: "Idukki", lat: 9.9189, lon: 77.1025 },
    { id: "ekm", ml: "എറണാകുളം (കൊച്ചി)", en: "Ernakulam (Kochi)", lat: 9.9312, lon: 76.2673 },
    { id: "tsr", ml: "തൃശ്ശൂർ", en: "Thrissur", lat: 10.5276, lon: 76.2144 },
    { id: "pkd", ml: "പാലക്കാട്", en: "Palakkad", lat: 10.7867, lon: 76.6548 },
    { id: "mlp", ml: "മലപ്പുറം", en: "Malappuram", lat: 11.0510, lon: 76.0711 },
    { id: "kkd", ml: "കോഴിക്കോട്", en: "Kozhikode", lat: 11.2588, lon: 75.7804 },
    { id: "wyd", ml: "വയനാട്", en: "Wayanad", lat: 11.6854, lon: 76.1320 },
    { id: "knr", ml: "കണ്ണൂർ", en: "Kannur", lat: 11.8745, lon: 75.3704 },
    { id: "ksd", ml: "കാസർഗോഡ്", en: "Kasaragod", lat: 12.4996, lon: 74.9869 }
  ];

  // Standard Kerala Tyajyam (start in ghatikas out of 60) & Amritakalam (start in ghatikas out of 60)
  // Duration of each window is 4 ghatikas (1 hr 36 min) per 60-ghatika Nakshatra span
  var NAKSHATRAS = [
    { idx: 0,  ml: "അശ്വതി", en: "Ashwini", lord: "Ketu", gana: "Deva", yoni: "Horse", tyajyaGh: 50, amritaGh: 42 },
    { idx: 1,  ml: "ഭരണി", en: "Bharani", lord: "Venus", gana: "Manushya", yoni: "Elephant", tyajyaGh: 24, amritaGh: 48 },
    { idx: 2,  ml: "കാർത്തിക", en: "Krittika", lord: "Sun", gana: "Asura", yoni: "Sheep", tyajyaGh: 30, amritaGh: 54 },
    { idx: 3,  ml: "രോഹിണി", en: "Rohini", lord: "Moon", gana: "Manushya", yoni: "Serpent", tyajyaGh: 40, amritaGh: 52 },
    { idx: 4,  ml: "മകയിരം", en: "Mrigashira", lord: "Mars", gana: "Deva", yoni: "Serpent", tyajyaGh: 14, amritaGh: 38 },
    { idx: 5,  ml: "തിരുവാതിര", en: "Ardra", lord: "Rahu", gana: "Manushya", yoni: "Dog", tyajyaGh: 21, amritaGh: 35 },
    { idx: 6,  ml: "പുണർതം", en: "Punarvasu", lord: "Jupiter", gana: "Deva", yoni: "Cat", tyajyaGh: 30, amritaGh: 54 },
    { idx: 7,  ml: "പൂയം", en: "Pushya", lord: "Saturn", gana: "Deva", yoni: "Sheep", tyajyaGh: 20, amritaGh: 44 },
    { idx: 8,  ml: "ആയില്യം", en: "Ashlesha", lord: "Mercury", gana: "Asura", yoni: "Cat", tyajyaGh: 32, amritaGh: 56 },
    { idx: 9,  ml: "മകം", en: "Magha", lord: "Ketu", gana: "Asura", yoni: "Rat", tyajyaGh: 30, amritaGh: 54 },
    { idx: 10, ml: "പൂരം", en: "Purva Phalguni", lord: "Venus", gana: "Manushya", yoni: "Rat", tyajyaGh: 20, amritaGh: 44 },
    { idx: 11, ml: "ഉത്രം", en: "Uttara Phalguni", lord: "Sun", gana: "Manushya", yoni: "Cow", tyajyaGh: 18, amritaGh: 42 },
    { idx: 12, ml: "അത്തം", en: "Hasta", lord: "Moon", gana: "Deva", yoni: "Buffalo", tyajyaGh: 21, amritaGh: 45 },
    { idx: 13, ml: "ചിത്തിര", en: "Chitra", lord: "Mars", gana: "Asura", yoni: "Tiger", tyajyaGh: 20, amritaGh: 44 },
    { idx: 14, ml: "ചോതി", en: "Swati", lord: "Rahu", gana: "Deva", yoni: "Buffalo", tyajyaGh: 14, amritaGh: 38 },
    { idx: 15, ml: "വിശാഖം", en: "Vishakha", lord: "Jupiter", gana: "Asura", yoni: "Tiger", tyajyaGh: 14, amritaGh: 38 },
    { idx: 16, ml: "അനിഴം", en: "Anuradha", lord: "Saturn", gana: "Deva", yoni: "Deer", tyajyaGh: 10, amritaGh: 34 },
    { idx: 17, ml: "തൃക്കേട്ട", en: "Jyeshtha", lord: "Mercury", gana: "Asura", yoni: "Deer", tyajyaGh: 14, amritaGh: 38 },
    { idx: 18, ml: "മൂലം", en: "Mula", lord: "Ketu", gana: "Asura", yoni: "Dog", tyajyaGh: 20, amritaGh: 44 },
    { idx: 19, ml: "പൂരാടം", en: "Purva Ashadha", lord: "Venus", gana: "Manushya", yoni: "Monkey", tyajyaGh: 24, amritaGh: 48 },
    { idx: 20, ml: "ഉത്രാടം", en: "Uttara Ashadha", lord: "Sun", gana: "Manushya", yoni: "Mongoose", tyajyaGh: 20, amritaGh: 44 },
    { idx: 21, ml: "തിരുവോണം", en: "Shravana", lord: "Moon", gana: "Deva", yoni: "Monkey", tyajyaGh: 10, amritaGh: 34 },
    { idx: 22, ml: "അവിട്ടം", en: "Dhanishta", lord: "Mars", gana: "Asura", yoni: "Lion", tyajyaGh: 10, amritaGh: 34 },
    { idx: 23, ml: "ചതയം", en: "Shatabhisha", lord: "Rahu", gana: "Asura", yoni: "Horse", tyajyaGh: 18, amritaGh: 42 },
    { idx: 24, ml: "പൂരുരുട്ടാതി", en: "Purva Bhadrapada", lord: "Jupiter", gana: "Manushya", yoni: "Lion", tyajyaGh: 16, amritaGh: 40 },
    { idx: 25, ml: "ഉത്രട്ടാതി", en: "Uttara Bhadrapada", lord: "Saturn", gana: "Manushya", yoni: "Cow", tyajyaGh: 24, amritaGh: 48 },
    { idx: 26, ml: "രേവതി", en: "Revati", lord: "Mercury", gana: "Deva", yoni: "Elephant", tyajyaGh: 30, amritaGh: 54 }
  ];

  var RASHIS = [
    { idx: 0,  ml: "മേടം", shortMl: "മേടം", en: "Mesha (Aries)", shortEn: "Mesha", lord: "Mars", benefics: ["Sun", "Mars", "Jupiter"], malefics: ["Mercury", "Venus", "Saturn"] },
    { idx: 1,  ml: "ഇടവം", shortMl: "ഇടവം", en: "Idavam (Taurus)", shortEn: "Idavam", lord: "Venus", benefics: ["Saturn", "Mercury", "Venus"], malefics: ["Jupiter", "Moon"] },
    { idx: 2,  ml: "മിഥുനം", shortMl: "മിഥുനം", en: "Mithunam (Gemini)", shortEn: "Mithunam", lord: "Mercury", benefics: ["Venus", "Mercury", "Saturn"], malefics: ["Mars", "Jupiter", "Sun"] },
    { idx: 3,  ml: "കർക്കടകം", shortMl: "കർക്ക.", en: "Karkidakam (Cancer)", shortEn: "Karkidakam", lord: "Moon", benefics: ["Mars", "Jupiter", "Moon"], malefics: ["Mercury", "Venus", "Saturn"] },
    { idx: 4,  ml: "ചിങ്ങം", shortMl: "ചിങ്ങം", en: "Chingam (Leo)", shortEn: "Chingam", lord: "Sun", benefics: ["Mars", "Jupiter", "Sun"], malefics: ["Mercury", "Venus", "Saturn"] },
    { idx: 5,  ml: "കന്നി", shortMl: "കന്നി", en: "Kanni (Virgo)", shortEn: "Kanni", lord: "Mercury", benefics: ["Venus", "Mercury"], malefics: ["Mars", "Moon", "Jupiter"] },
    { idx: 6,  ml: "തുലാം", shortMl: "തുലാം", en: "Thulam (Libra)", shortEn: "Thulam", lord: "Venus", benefics: ["Saturn", "Mercury", "Venus"], malefics: ["Jupiter", "Sun", "Mars"] },
    { idx: 7,  ml: "വൃശ്ചികം", shortMl: "വൃശ്ചി.", en: "Vrishchikam (Scorpio)", shortEn: "Vrishchikam", lord: "Mars", benefics: ["Jupiter", "Moon", "Sun"], malefics: ["Mercury", "Venus", "Saturn"] },
    { idx: 8,  ml: "ധനു", shortMl: "ധനു", en: "Dhanu (Sagittarius)", shortEn: "Dhanu", lord: "Jupiter", benefics: ["Mars", "Sun", "Jupiter"], malefics: ["Venus", "Saturn", "Mercury"] },
    { idx: 9,  ml: "മകരം", shortMl: "മകരം", en: "Makaram (Capricorn)", shortEn: "Makaram", lord: "Saturn", benefics: ["Venus", "Mercury", "Saturn"], malefics: ["Mars", "Jupiter", "Moon"] },
    { idx: 10, ml: "കുംഭം", shortMl: "കുംഭം", en: "Kumbham (Aquarius)", shortEn: "Kumbham", lord: "Saturn", benefics: ["Venus", "Saturn", "Mars"], malefics: ["Jupiter", "Moon", "Sun"] },
    { idx: 11, ml: "മീനം", shortMl: "മീനം", en: "Meenam (Pisces)", shortEn: "Meenam", lord: "Jupiter", benefics: ["Moon", "Mars", "Jupiter"], malefics: ["Sun", "Venus", "Saturn", "Mercury"] }
  ];

  var KOLLAM_MONTHS = [
    { ml: "മേടം", en: "Medam" }, { ml: "ഇടവം", en: "Idavam" }, { ml: "മിഥുനം", en: "Mithunam" },
    { ml: "കർക്കടകം", en: "Karkidakam" }, { ml: "ചിങ്ങം", en: "Chingam" }, { ml: "കന്നി", en: "Kanni" },
    { ml: "തുലാം", en: "Thulam" }, { ml: "വൃശ്ചികം", en: "Vrishchikam" }, { ml: "ധനു", en: "Dhanu" },
    { ml: "മകരം", en: "Makaram" }, { ml: "കുംഭം", en: "Kumbham" }, { ml: "മീനം", en: "Meenam" }
  ];

  var VARAS = [
    { idx: 0, ml: "ഞായർ", en: "Sunday", lord: "Sun" },
    { idx: 1, ml: "തിങ്കൾ", en: "Monday", lord: "Moon" },
    { idx: 2, ml: "ചൊവ്വ", en: "Tuesday", lord: "Mars" },
    { idx: 3, ml: "ബുധൻ", en: "Wednesday", lord: "Mercury" },
    { idx: 4, ml: "വ്യാഴം", en: "Thursday", lord: "Jupiter" },
    { idx: 5, ml: "വെള്ളി", en: "Friday", lord: "Venus" },
    { idx: 6, ml: "ശനി", en: "Saturday", lord: "Saturn" }
  ];

  // Natural planetary friendships (Naisargika Maitri) per Brihat Parashara Hora Shastra
  var NATURAL_RELATIONS = {
    Sun:     { friends: ["Moon", "Mars", "Jupiter"], neutral: ["Mercury"], enemies: ["Venus", "Saturn"] },
    Moon:    { friends: ["Sun", "Mercury"], neutral: ["Mars", "Jupiter", "Venus", "Saturn"], enemies: [] },
    Mars:    { friends: ["Sun", "Moon", "Jupiter"], neutral: ["Venus", "Saturn"], enemies: ["Mercury"] },
    Mercury: { friends: ["Sun", "Venus"], neutral: ["Mars", "Jupiter", "Saturn"], enemies: ["Moon"] },
    Jupiter: { friends: ["Sun", "Moon", "Mars"], neutral: ["Saturn"], enemies: ["Mercury", "Venus"] },
    Venus:   { friends: ["Mercury", "Saturn"], neutral: ["Mars", "Jupiter"], enemies: ["Sun", "Moon"] },
    Saturn:  { friends: ["Mercury", "Venus"], neutral: ["Jupiter"], enemies: ["Sun", "Moon", "Mars"] }
  };

  var PLANETS = {
    Sun:          { ml: "സൂര്യൻ", abbrMl: "ര", en: "Sun", abbrEn: "Su", exalt: 0,  debil: 6,  own: [4],    combustOrb: 0 },
    Moon:         { ml: "ചന്ദ്രൻ", abbrMl: "ച", en: "Moon", abbrEn: "Mo", exalt: 1,  debil: 7,  own: [3],    combustOrb: 12 },
    Mars:         { ml: "ചൊവ്വ", abbrMl: "കു", en: "Mars", abbrEn: "Ma", exalt: 9,  debil: 3,  own: [0, 7], combustOrb: 17 },
    Mercury:      { ml: "ബുധൻ", abbrMl: "ബു", en: "Mercury", abbrEn: "Me", exalt: 5,  debil: 11, own: [2, 5], combustOrb: 14 },
    Jupiter:      { ml: "വ്യാഴം", abbrMl: "ഗു", en: "Jupiter", abbrEn: "Ju", exalt: 3,  debil: 9,  own: [8, 11],combustOrb: 11 },
    Venus:        { ml: "ശുക്രൻ", abbrMl: "ശു", en: "Venus", abbrEn: "Ve", exalt: 11, debil: 5,  own: [1, 6], combustOrb: 10 },
    Saturn:       { ml: "ശനി", abbrMl: "മ", en: "Saturn", abbrEn: "Sa", exalt: 6,  debil: 0,  own: [9, 10],combustOrb: 15 },
    Rahu:         { ml: "രാഹു", abbrMl: "രാ", en: "Rahu", abbrEn: "Ra", exalt: 1,  debil: 7,  own: [10],   combustOrb: 0 },
    Ketu:         { ml: "കേതു", abbrMl: "കേ", en: "Ketu", abbrEn: "Ke", exalt: 7,  debil: 1,  own: [7],    combustOrb: 0 },
    Gulikan:      { ml: "ഗുളികൻ", abbrMl: "മാ", en: "Gulikan", abbrEn: "Gk", exalt: -1, debil: -1, own: [],     combustOrb: 0 },
    Yamakantakan: { ml: "യമകണ്ടകൻ", abbrMl: "യ", en: "Yamakantakan", abbrEn: "Yk", exalt: -1, debil: -1, own: [], combustOrb: 0 }
  };

  var TARA_NAMES = [
    { idx: 1, ml: "ജന്മ താര (ശ്രദ്ധിക്കുക)", en: "Janma Tara (Alert)", val: 0 },
    { idx: 2, ml: "സമ്പത്ത് താര (അനുകൂലം)", en: "Sampath Tara (Favorable)", val: 1 },
    { idx: 3, ml: "വിപത്ത് താര (തടസ്സം)", en: "Vipath Tara (Friction)", val: -1 },
    { idx: 4, ml: "ക്ഷേമ താര (സുഖകരം)", en: "Kshema Tara (Supportive)", val: 1 },
    { idx: 5, ml: "പ്രത്യക് താര (ജാഗ്രത)", en: "Pratyak Tara (Obstacle)", val: -1 },
    { idx: 6, ml: "സാധക താര (വിജയം)", en: "Sadhaka Tara (Achievement)", val: 1 },
    { idx: 7, ml: "വധ താര (ഒഴിവാക്കുക)", en: "Vadha Tara (High Caution)", val: -1 },
    { idx: 8, ml: "മിത്ര താര (സഹായം)", en: "Mitra Tara (Friendly)", val: 1 },
    { idx: 9, ml: "അതിമിത്ര താര (അത്യുത്തമം)", en: "Atimitra Tara (Excellent)", val: 1 }
  ];

  var TITHI_NAMES = [
    { ml: "പ്രഥമ", en: "Prathama", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ദ്വിതീയ", en: "Dwitiya", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "തൃതീയ", en: "Tritiya", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ചതുർത്ഥി", en: "Chaturthi", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "പഞ്ചമി", en: "Panchami", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ഷഷ്ഠി", en: "Shashthi", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "സപ്തമി", en: "Saptami", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "അഷ്ടമി", en: "Ashtami", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "നവമി", en: "Navami", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ദശമി", en: "Dashami", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ഏകാദശി", en: "Ekadashi", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ദ്വാദശി", en: "Dwadashi", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ത്രയോദശി", en: "Trayodashi", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "ചതുർദ്ദശി", en: "Chaturdashi", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "പൗർണ്ണമി", en: "Pournami", pakshaMl: "ശുക്ലപക്ഷം", pakshaEn: "Shukla Paksha" },
    { ml: "പ്രഥമ", en: "Prathama", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ദ്വിതീയ", en: "Dwitiya", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "തൃതീയ", en: "Tritiya", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ചതുർത്ഥി", en: "Chaturthi", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "പഞ്ചമി", en: "Panchami", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ഷഷ്ഠി", en: "Shashthi", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "സപ്തമി", en: "Saptami", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "അഷ്ടമി", en: "Ashtami", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "നവമി", en: "Navami", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ദശമി", en: "Dashami", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ഏകാദശി", en: "Ekadashi", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ദ്വാദശി", en: "Dwadashi", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ത്രയോദശി", en: "Trayodashi", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "ചതുർദ്ദശി", en: "Chaturdashi", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" },
    { ml: "അമാവാസി", en: "Amavasi", pakshaMl: "കൃഷ്ണപക്ഷം", pakshaEn: "Krishna Paksha" }
  ];

  // 11 Karanas mapped across 60 half-tithis (0..59)
  var KARANA_LIST = [
    { ml: "കിംസ്തുഘ്നം", en: "Kimstughna", auspicious: false },
    { ml: "ബവം", en: "Bava", auspicious: true },
    { ml: "ബാലവം", en: "Balava", auspicious: true },
    { ml: "കൗലവം", en: "Kaulava", auspicious: true },
    { ml: "തൈതിലം", en: "Taitila", auspicious: true },
    { ml: "ഗരം", en: "Gara", auspicious: true },
    { ml: "വണിജം", en: "Vanija", auspicious: true },
    { ml: "വിഷ്ടി (ഭദ്ര)", en: "Vishti (Bhadra)", auspicious: false },
    { ml: "ശകുനി", en: "Shakuni", auspicious: false },
    { ml: "ചതുഷ്പാദം", en: "Chatushpada", auspicious: false },
    { ml: "നാഗം", en: "Naga", auspicious: false }
  ];

  function getKaranaMeta(halfTithiIdx) {
    if (halfTithiIdx === 0) return KARANA_LIST[0];
    if (halfTithiIdx === 57) return KARANA_LIST[8];
    if (halfTithiIdx === 58) return KARANA_LIST[9];
    if (halfTithiIdx === 59) return KARANA_LIST[10];
    var movableIdx = ((halfTithiIdx - 1) % 7) + 1;
    return KARANA_LIST[movableIdx];
  }

  var YOGA_NAMES = [
    { ml: "വിഷ്കംഭം", en: "Vishkambha" }, { ml: "പ്രീതി", en: "Priti" }, { ml: "ആയുഷ്മാൻ", en: "Ayushman" },
    { ml: "സൗഭാഗ്യം", en: "Saubhagya" }, { ml: "ശോഭനം", en: "Shobhana" }, { ml: "അതിഗണ്ഡം", en: "Atiganda" },
    { ml: "സുകർമ്മം", en: "Sukarma" }, { ml: "ധൃതി", en: "Dhriti" }, { ml: "ശൂലം", en: "Shula" },
    { ml: "ഗണ്ഡം", en: "Ganda" }, { ml: "വൃദ്ധി", en: "Vriddhi" }, { ml: "ധ്രുവം", en: "Dhruva" },
    { ml: "വ്യാഘാതം", en: "Vyaghata" }, { ml: "ഹർഷണം", en: "Harshana" }, { ml: "വജ്രം", en: "Vajra" },
    { ml: "സിദ്ധി", en: "Siddhi" }, { ml: "വ്യതീപാതം", en: "Vyatipata" }, { ml: "വരീയാൻ", en: "Variyan" },
    { ml: "പരിഘം", en: "Parigha" }, { ml: "ശിവം", en: "Shiva" }, { ml: "സിദ്ധം", en: "Siddha" },
    { ml: "സാദ്ധ്യം", en: "Sadhya" }, { ml: "ശുഭം", en: "Shubha" }, { ml: "ശുക്ലം", en: "Shukla" },
    { ml: "ബ്രഹ്മം", en: "Brahma" }, { ml: "ഇന്ദ്രം", en: "Indra" }, { ml: "വൈധൃതി", en: "Vaidhriti" }
  ];

  var DASHA_ORDER = [
    { lord: "Ketu", yrs: 7 }, { lord: "Venus", yrs: 20 }, { lord: "Sun", yrs: 6 },
    { lord: "Moon", yrs: 10 }, { lord: "Mars", yrs: 7 }, { lord: "Rahu", yrs: 18 },
    { lord: "Jupiter", yrs: 16 }, { lord: "Saturn", yrs: 19 }, { lord: "Mercury", yrs: 17 }
  ];

  var ASHTAKAVARGA_RULES = {
    Sun:     { Sun:[1,2,4,7,8,9,10,11], Moon:[3,6,10,11], Mars:[1,2,4,7,8,9,10,11], Mercury:[3,5,6,9,10,11,12], Jupiter:[5,6,9,11], Venus:[6,7,12], Saturn:[1,2,4,7,8,9,10,11], Lagna:[3,4,6,10,11,12] },
    Moon:    { Sun:[3,6,7,8,10,11], Moon:[1,3,6,7,10,11], Mars:[2,3,5,6,9,10,11], Mercury:[1,3,4,5,7,8,10,11], Jupiter:[1,4,7,8,10,11,12], Venus:[3,4,5,7,9,10,11], Saturn:[3,5,6,11], Lagna:[3,6,10,11] },
    Mars:    { Sun:[3,5,6,10,11], Moon:[3,6,11], Mars:[1,2,4,7,8,10,11], Mercury:[3,5,6,11], Jupiter:[6,10,11,12], Venus:[6,8,11,12], Saturn:[1,4,7,8,9,10,11], Lagna:[1,3,6,10,11] },
    Mercury: { Sun:[5,6,9,11,12], Moon:[2,4,6,8,10,11], Mars:[1,2,4,7,8,9,10,11], Mercury:[1,3,5,6,9,10,11,12], Jupiter:[6,8,11,12], Venus:[1,2,3,4,5,8,9,11], Saturn:[1,2,4,7,8,9,10,11], Lagna:[1,2,4,6,8,10,11] },
    Jupiter: { Sun:[1,2,3,4,7,8,9,10,11], Moon:[2,5,7,9,11], Mars:[1,2,4,7,8,10,11], Mercury:[1,2,4,5,6,9,10,11], Jupiter:[1,2,3,4,7,8,10,11], Venus:[2,5,6,9,10,11], Saturn:[3,5,6,12], Lagna:[1,2,4,5,6,7,9,10,11] },
    Venus:   { Sun:[8,11,12], Moon:[1,2,3,4,5,8,9,11,12], Mars:[3,5,6,9,11,12], Mercury:[3,5,6,9,11], Jupiter:[5,8,9,10,11], Venus:[1,2,3,4,5,8,9,10,11], Saturn:[3,4,5,8,9,10,11], Lagna:[1,2,3,4,5,8,9,11] },
    Saturn:  { Sun:[1,2,4,7,8,10,11], Moon:[3,6,11], Mars:[3,5,6,10,11,12], Mercury:[6,8,9,10,11,12], Jupiter:[5,6,11,12], Venus:[6,11,12], Saturn:[3,5,6,11], Lagna:[1,3,4,6,10,11] }
  };

  /* --------------------------------------------------------------------------
     2. CORE ASTRONOMY, AYANAMSA & DIVISIONAL CHARTS (D-1, D-3, D-9, D-10)
     -------------------------------------------------------------------------- */
  function norm360(x) {
    x = x % 360;
    return x < 0 ? x + 360 : x;
  }

  function angDiff(a, b) {
    var d = Math.abs(norm360(a) - norm360(b));
    return d > 180 ? 360 - d : d;
  }

  function houseOffset(fromSign, toSign) {
    return ((toSign - fromSign + 12) % 12) + 1;
  }

  function formatDegMin(lon) {
    var degInSign = norm360(lon) % 30;
    var d = Math.floor(degInSign);
    var m = Math.floor((degInSign - d) * 60);
    return (d < 10 ? "0" : "") + d + "°" + (m < 10 ? "0" : "") + m + "'";
  }

  function toJulianDay(year, month, day, hourUT) {
    if (month <= 2) { year -= 1; month += 12; }
    var A = Math.floor(year / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hourUT / 24.0 + B - 1524.5;
  }

  function jdToISTString(jd) {
    var istMs = (jd - 2440587.5) * 86400000 + (5.5 * 3600000);
    var dt = new Date(istMs);
    var h = dt.getUTCHours();
    var m = dt.getUTCMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return (h12 < 10 ? "0" : "") + h12 + ":" + (m < 10 ? "0" : "") + m + " " + ampm;
  }

  function fmtTime(decHours) {
    var h = Math.floor(decHours) % 24;
    var m = Math.round((decHours - Math.floor(decHours)) * 60);
    if (m === 60) { h = (h + 1) % 24; m = 0; }
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return (h12 < 10 ? "0" : "") + h12 + ":" + (m < 10 ? "0" : "") + m + " " + ampm;
  }

  function getLahiriAyanamsa(jd) {
    var t = (jd - 2451545.0) / 36525.0;
    return 23.853056 + 1.396971 * t + 0.000308 * t * t;
  }

  function getSiderealPlanets(jd) {
    var d = jd - 2451545.0;
    var T = d / 36525.0;
    var ayan = getLahiriAyanamsa(jd);

    var gSun = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    var lSun0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    var eqSun = (1.914602 - 0.004817 * T) * Math.sin(gSun * DEG) + 0.019993 * Math.sin(2 * gSun * DEG);
    var sunTrop = norm360(lSun0 + eqSun);

    var Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
    var D  = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
    var M  = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
    var Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
    var F  = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T);

    var moonLon = Lp
      + 6.288774 * Math.sin(Mp * DEG)
      + 1.274027 * Math.sin((2 * D - Mp) * DEG)
      + 0.658314 * Math.sin(2 * D * DEG)
      + 0.213618 * Math.sin(2 * Mp * DEG)
      - 0.185116 * Math.sin(M * DEG)
      - 0.114332 * Math.sin(2 * F * DEG)
      + 0.058793 * Math.sin((2 * D - 2 * Mp) * DEG)
      + 0.057066 * Math.sin((2 * D - M - Mp) * DEG)
      + 0.053322 * Math.sin((2 * D + Mp) * DEG)
      + 0.045758 * Math.sin((2 * D - M) * DEG)
      - 0.040923 * Math.sin((M - Mp) * DEG)
      - 0.034720 * Math.sin(D * DEG)
      - 0.030383 * Math.sin((M + Mp) * DEG);
    var moonTrop = norm360(moonLon);

    var rahuTrop = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
    var ketuTrop = norm360(rahuTrop + 180);

    function helioToGeo(a, e, I, L0, n, wBar, Om) {
      var L = norm360(L0 + n * d);
      var M_p = norm360(L - wBar);
      var E = M_p + e * RAD * Math.sin(M_p * DEG) * (1.0 + e * Math.cos(M_p * DEG));
      var xv = a * (Math.cos(E * DEG) - e);
      var yv = a * Math.sqrt(1.0 - e * e) * Math.sin(E * DEG);
      var v = Math.atan2(yv, xv) * RAD;
      var r = Math.sqrt(xv * xv + yv * yv);
      var u = (v + wBar - Om) * DEG;
      var xh = r * (Math.cos(Om * DEG) * Math.cos(u) - Math.sin(Om * DEG) * Math.sin(u) * Math.cos(I * DEG));
      var yh = r * (Math.sin(Om * DEG) * Math.cos(u) + Math.cos(Om * DEG) * Math.sin(u) * Math.cos(I * DEG));

      var rE = 1.00014 - 0.01671 * Math.cos(gSun * DEG) - 0.00014 * Math.cos(2 * gSun * DEG);
      var lE = norm360(sunTrop + 180);
      var xe = rE * Math.cos(lE * DEG);
      var ye = rE * Math.sin(lE * DEG);
      return norm360(Math.atan2(yh - ye, xh - xe) * RAD);
    }

    var mercTrop = helioToGeo(0.387098, 0.205630, 7.0047, 252.25032, 4.0923344368, 77.45779, 48.33076);
    var venTrop  = helioToGeo(0.723332, 0.006773, 3.3946, 181.97973, 1.6021302244, 131.60246, 76.67984);
    var marsTrop = helioToGeo(1.523688, 0.093405, 1.8497, 355.43300, 0.5240207766, 336.06023, 49.55740);
    var jupTrop  = helioToGeo(5.202561, 0.048498, 1.3030, 34.35151, 0.08309121, 14.33120, 100.46440);
    var satTrop  = helioToGeo(9.554747, 0.055546, 2.4886, 50.07744, 0.03345965, 93.05723, 113.66340);

    return {
      ayanamsa: ayan,
      Sun:     norm360(sunTrop - ayan),
      Moon:    norm360(moonTrop - ayan),
      Mars:    norm360(marsTrop - ayan),
      Mercury: norm360(mercTrop - ayan),
      Jupiter: norm360(jupTrop - ayan),
      Venus:   norm360(venTrop - ayan),
      Saturn:  norm360(satTrop - ayan),
      Rahu:    norm360(rahuTrop - ayan),
      Ketu:    norm360(ketuTrop - ayan)
    };
  }

  function getSiderealLagna(jd, lat, lon) {
    var T = (jd - 2451545.0) / 36525.0;
    var gmst = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T);
    var lst = norm360(gmst + lon) * DEG;
    var eps = (23.439291 - 0.0130042 * T) * DEG;
    var phi = lat * DEG;
    var y = Math.cos(lst);
    var x = -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
    var ascTrop = norm360(Math.atan2(y, x) * RAD);
    return norm360(ascTrop - getLahiriAyanamsa(jd));
  }

  // Divisional Chart Helpers (D-3 Drekkana, D-9 Navamsa, D-10 Dasamsa)
  function getDrekkanaSign(lon) {
    var s = Math.floor(norm360(lon) / 30.0);
    var part = Math.floor((norm360(lon) % 30.0) / 10.0); // 0, 1, 2 -> +0, +4, +8 signs
    return (s + part * 4) % 12;
  }

  function getNavamsaSign(lon) {
    var padaTotal = Math.floor(norm360(lon) / (30.0 / 9.0)); // 0..107
    return padaTotal % 12;
  }

  function getDasamsaSign(lon) {
    var s = Math.floor(norm360(lon) / 30.0);
    var part = Math.floor((norm360(lon) % 30.0) / 3.0); // 0..9
    // Odd signs start from same sign; Even signs start from 9th sign
    var start = (s % 2 === 0) ? s : (s + 8) % 12;
    return (start + part) % 12;
  }

  function getSunTimesIST(year, month, day, lat, lon) {
    var jd0 = toJulianDay(year, month, day, 0);
    var n = jd0 - 2451545.0 + 0.0008;
    var jStar = n - lon / 360.0;
    var M = norm360(357.5291 + 0.98560028 * jStar);
    var C = 1.9148 * Math.sin(M * DEG) + 0.0200 * Math.sin(2 * M * DEG);
    var lam = norm360(M + C + 180 + 102.9372);
    var jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M * DEG) - 0.0069 * Math.sin(2 * lam * DEG);
    var sinDec = Math.sin(lam * DEG) * Math.sin(23.44 * DEG);
    var cosDec = Math.cos(Math.asin(sinDec));
    var cosOmega = (Math.sin(-0.83 * DEG) - Math.sin(lat * DEG) * sinDec) / (Math.cos(lat * DEG) * cosDec);
    cosOmega = Math.max(-1, Math.min(1, cosOmega));
    var omega = Math.acos(cosOmega) * RAD;
    var jRise = jTransit - omega / 360.0;
    var jSet  = jTransit + omega / 360.0;

    function jdToIST(j) {
      var frac = (j + 0.5) - Math.floor(j + 0.5);
      return (frac * 24.0 + 5.5) % 24.0;
    }
    return { sunrise: jdToIST(jRise), sunset: jdToIST(jSet) };
  }

  // Kerala Upagrahas: Gulikan (Mandi) & Yamakantakan rising longitudes
  function getUpagrahaLongitudes(year, month, day, hourIST, lat, lon) {
    var sunT = getSunTimesIST(year, month, day, lat, lon);
    var isDay = (hourIST >= sunT.sunrise && hourIST < sunT.sunset);
    var civilVara = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    var effectiveVara = (hourIST < sunT.sunrise) ? (civilVara + 6) % 7 : civilVara;

    var gulikaPartDay    = [6, 5, 4, 3, 2, 1, 0][effectiveVara];
    var gulikaPartNight  = [2, 1, 0, 6, 5, 4, 3][effectiveVara];
    var yamaPartDay      = [4, 3, 2, 1, 0, 6, 5][effectiveVara];
    var yamaPartNight    = [0, 6, 5, 4, 3, 2, 1][effectiveVara];

    function partToLon(partIdx) {
      var targetIST;
      if (isDay) {
        var dayDur = sunT.sunset - sunT.sunrise;
        targetIST = sunT.sunrise + (partIdx * (dayDur / 8.0));
      } else {
        var nightDur = 24.0 - (sunT.sunset - sunT.sunrise);
        var nightStart = (hourIST >= sunT.sunset) ? sunT.sunset : (sunT.sunset - 24.0);
        targetIST = nightStart + (partIdx * (nightDur / 8.0));
      }
      var uJd = toJulianDay(year, month, day, targetIST - 5.5);
      return getSiderealLagna(uJd, lat, lon);
    }

    return {
      Gulikan: partToLon(isDay ? gulikaPartDay : gulikaPartNight),
      Yamakantakan: partToLon(isDay ? yamaPartDay : yamaPartNight)
    };
  }

  // Binary-search exact IST transition timestamp (both past start & upcoming end)
  function findNakshatraSpanIST(jdRef) {
    var curNak = Math.floor(getSiderealPlanets(jdRef).Moon / (360.0 / 27.0));
    var step = 1.0 / 24.0;

    // Backward search for Nakshatra start
    var loStart = jdRef - 1.5, hiStart = jdRef;
    for (var k = 1; k <= 32; k++) {
      var t = jdRef - k * step;
      if (Math.floor(getSiderealPlanets(t).Moon / (360.0 / 27.0)) !== curNak) {
        loStart = t; hiStart = t + step; break;
      }
    }
    for (var b1 = 0; b1 < 14; b1++) {
      var m1 = (loStart + hiStart) / 2.0;
      if (Math.floor(getSiderealPlanets(m1).Moon / (360.0 / 27.0)) === curNak) hiStart = m1;
      else loStart = m1;
    }

    // Forward search for Nakshatra end
    var loEnd = jdRef, hiEnd = jdRef + 1.5;
    for (var j = 1; j <= 32; j++) {
      var tf = jdRef + j * step;
      if (Math.floor(getSiderealPlanets(tf).Moon / (360.0 / 27.0)) !== curNak) {
        loEnd = tf - step; hiEnd = tf; break;
      }
    }
    for (var b2 = 0; b2 < 14; b2++) {
      var m2 = (loEnd + hiEnd) / 2.0;
      if (Math.floor(getSiderealPlanets(m2).Moon / (360.0 / 27.0)) === curNak) loEnd = m2;
      else hiEnd = m2;
    }

    var meta = NAKSHATRAS[curNak];
    var spanJd = hiEnd - hiStart;
    // Tyajyam & Amritakalam (4 ghatikas = 4/60 = 1/15th of the Nakshatra span)
    var tyajyaStart = hiStart + (meta.tyajyaGh / 60.0) * spanJd;
    var tyajyaEnd   = tyajyaStart + (4.0 / 60.0) * spanJd;
    var amritaStart = hiStart + (meta.amritaGh / 60.0) * spanJd;
    var amritaEnd   = amritaStart + (4.0 / 60.0) * spanJd;

    return {
      nakIdx: curNak,
      nextNakIdx: (curNak + 1) % 27,
      startJd: hiStart,
      endJd: hiEnd,
      endTimeStr: jdToISTString(hiEnd),
      tyajyam: jdToISTString(tyajyaStart) + " – " + jdToISTString(tyajyaEnd),
      amritakalam: jdToISTString(amritaStart) + " – " + jdToISTString(amritaEnd)
    };
  }

  function findTransitionTimeIST(jdStart, evalFn) {
    var startVal = evalFn(jdStart);
    var step = 1.0 / 24.0;
    var prevJd = jdStart;
    for (var i = 1; i <= 30; i++) {
      var curJd = jdStart + i * step;
      if (evalFn(curJd) !== startVal) {
        var lo = prevJd, hi = curJd;
        for (var b = 0; b < 14; b++) {
          var mid = (lo + hi) / 2.0;
          if (evalFn(mid) === startVal) lo = mid;
          else hi = mid;
        }
        return { changed: true, jd: hi, timeStr: jdToISTString(hi), nextVal: evalFn(hi) };
      }
      prevJd = curJd;
    }
    return { changed: false, jd: null, timeStr: null, nextVal: startVal };
  }

  /* --------------------------------------------------------------------------
     3. VIMSHOTTARI DASHA -> APAHARAM -> PRATYANTARDASHA
     -------------------------------------------------------------------------- */
  function getVimshottariFull(birthMoonLon, birthJd, targetJd) {
    var nakSpan = 360.0 / 27.0;
    var nakIdx = Math.floor(birthMoonLon / nakSpan);
    var remFrac = 1.0 - ((birthMoonLon % nakSpan) / nakSpan);
    var startSeq = nakIdx % 9;

    var elapsedDays = Math.max(0, targetJd - birthJd);
    var elapsedYears = elapsedDays / 365.2425;

    var firstYears = DASHA_ORDER[startSeq].yrs * remFrac;
    var mahaIdx = startSeq;
    var yearIntoMaha = 0;
    var mahaStartAge = 0;

    if (elapsedYears < firstYears) {
      yearIntoMaha = (DASHA_ORDER[startSeq].yrs - firstYears) + elapsedYears;
      mahaStartAge = -(DASHA_ORDER[startSeq].yrs - firstYears);
    } else {
      var rem = elapsedYears - firstYears;
      mahaStartAge = firstYears;
      mahaIdx = (startSeq + 1) % 9;
      while (rem >= DASHA_ORDER[mahaIdx].yrs) {
        rem -= DASHA_ORDER[mahaIdx].yrs;
        mahaStartAge += DASHA_ORDER[mahaIdx].yrs;
        mahaIdx = (mahaIdx + 1) % 9;
      }
      yearIntoMaha = rem;
    }

    var mahaLord = DASHA_ORDER[mahaIdx].lord;
    var mahaTotal = DASHA_ORDER[mahaIdx].yrs;

    var apaIdx = mahaIdx;
    var accApa = 0;
    var apaDur = 0;
    for (var i = 0; i < 9; i++) {
      apaDur = (mahaTotal * DASHA_ORDER[apaIdx].yrs) / 120.0;
      if (yearIntoMaha < accApa + apaDur) break;
      accApa += apaDur;
      apaIdx = (apaIdx + 1) % 9;
    }
    var apaLord = DASHA_ORDER[apaIdx].lord;
    var yearIntoApa = yearIntoMaha - accApa;

    var pratIdx = apaIdx;
    var accPrat = 0;
    var pratDur = 0;
    for (var j = 0; j < 9; j++) {
      pratDur = (apaDur * DASHA_ORDER[pratIdx].yrs) / 120.0;
      if (yearIntoApa < accPrat + pratDur) break;
      accPrat += pratDur;
      pratIdx = (pratIdx + 1) % 9;
    }
    var pratLord = DASHA_ORDER[pratIdx].lord;

    function ageToDateStr(ageYrs) {
      var dJd = birthJd + ageYrs * 365.2425;
      var ms = (dJd - 2440587.5) * 86400000 + (5.5 * 3600000);
      return new Date(ms).toISOString().slice(0, 10);
    }

    return {
      maha: mahaLord,
      apaharam: apaLord,
      pratyantardasha: pratLord,
      mahaEnd: ageToDateStr(mahaStartAge + mahaTotal),
      apaEnd: ageToDateStr(mahaStartAge + accApa + apaDur),
      pratEnd: ageToDateStr(mahaStartAge + accPrat + pratDur)
    };
  }

  /* --------------------------------------------------------------------------
     4. ASHTAKAVARGA, BALADI AVASTHA & PANCHADHA GRAHA MAITRI
     -------------------------------------------------------------------------- */
  function computeAshtakavarga(planetSigns, lagnaSign) {
    var bhinna = {};
    var sarva = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var contributors = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"];
    var targetPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

    targetPlanets.forEach(function(tp) {
      var scores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      contributors.forEach(function(c) {
        var refSign = (c === "Lagna") ? lagnaSign : planetSigns[c];
        var goodHouses = ASHTAKAVARGA_RULES[tp][c];
        goodHouses.forEach(function(h) {
          var targetSign = (refSign + h - 1) % 12;
          scores[targetSign] += 1;
          sarva[targetSign] += 1;
        });
      });
      bhinna[tp] = scores;
    });

    return { bhinna: bhinna, sarva: sarva };
  }

  function getBaladiAvastha(signIdx, lon) {
    var deg = norm360(lon) % 30.0;
    var fifth = Math.floor(deg / 6.0); // 0..4
    var isOddSign = (signIdx % 2 === 0); // Mesha=0 (odd in 1-based), Idavam=1 (even)
    var oddSeq  = ["Bala (Infant)", "Kumara (Youth)", "Yuva (Adult)", "Vriddha (Aged)", "Mrita (Dormant)"];
    var evenSeq = ["Mrita (Dormant)", "Vriddha (Aged)", "Yuva (Adult)", "Kumara (Youth)", "Bala (Infant)"];
    return isOddSign ? oddSeq[fifth] : evenSeq[fifth];
  }

  function evaluateDignityAndMaitri(planetName, signIdx, sunLon, planetLon, planetSigns) {
    var meta = PLANETS[planetName];
    if (!meta || !NATURAL_RELATIONS[planetName]) {
      return { dignity: "neutral", combust: false, compoundRelation: "neutral" };
    }
    var signLord = RASHIS[signIdx].lord;
    var nat = NATURAL_RELATIONS[planetName];
    var natScore = (signLord === planetName || nat.friends.indexOf(signLord) !== -1) ? 1
                 : (nat.enemies.indexOf(signLord) !== -1 ? -1 : 0);

    // Tatkalika (temporary) friendship: planets in 2, 3, 4, 10, 11, 12 from each other are temp friends
    var dist = houseOffset(signIdx, planetSigns[signLord]);
    var tempScore = ([2, 3, 4, 10, 11, 12].indexOf(dist) !== -1) ? 1 : -1;
    var totalMaitri = natScore + tempScore;
    var compound = totalMaitri >= 2 ? "Adhi Mitra"
                 : totalMaitri === 1 ? "Mitra"
                 : totalMaitri === 0 ? "Sama"
                 : totalMaitri === -1 ? "Shatru"
                 : "Adhi Shatru";

    var status = "neutral";
    if (meta.exalt === signIdx) status = "exalted";
    else if (meta.debil === signIdx) status = "debilitated";
    else if (meta.own.indexOf(signIdx) !== -1) status = "own";
    else if (totalMaitri >= 1) status = "friendly";
    else if (totalMaitri <= -1) status = "enemy";

    var isCombust = false;
    if (meta.combustOrb > 0 && angDiff(sunLon, planetLon) <= meta.combustOrb) {
      isCombust = true;
    }
    return { dignity: status, combust: isCombust, compoundRelation: compound };
  }

  /* --------------------------------------------------------------------------
     5. FULL ASTROLOGER BIRTH DOSSIER (JANMA JATHAKAM)
     -------------------------------------------------------------------------- */
  function computeFullJathakam(profile) {
    var bParts = profile.dob.split("-");
    var bY = parseInt(bParts[0], 10), bM = parseInt(bParts[1], 10), bD = parseInt(bParts[2], 10);
    var tParts = (profile.tob || "06:30").split(":");
    var bH = parseInt(tParts[0], 10) + parseInt(tParts[1], 10) / 60.0;

    var dist = DISTRICTS.find(function(x) { return x.id === profile.district; }) || DISTRICTS[0];
    var birthJd = toJulianDay(bY, bM, bD, bH - 5.5);
    var sunTimes = getSunTimesIST(bY, bM, bD, dist.lat, dist.lon);

    // Pre-sunrise birth Vara rollback (Kerala Jyothisham rule)
    var civilVara = new Date(Date.UTC(bY, bM - 1, bD)).getUTCDay();
    var isPreSunrise = bH < sunTimes.sunrise;
    var birthVaraIdx = isPreSunrise ? (civilVara + 6) % 7 : civilVara;

    var pl = getSiderealPlanets(birthJd);
    var plPrev = getSiderealPlanets(birthJd - (1.0 / 24.0));
    var lagnaLon = getSiderealLagna(birthJd, dist.lat, dist.lon);
    var upagrahas = getUpagrahaLongitudes(bY, bM, bD, bH, dist.lat, dist.lon);

    var lagnaSign = Math.floor(lagnaLon / 30);
    var lagnaDrekkana = getDrekkanaSign(lagnaLon);
    var lagnaNavamsa = getNavamsaSign(lagnaLon);
    var lagnaDasamsa = getDasamsaSign(lagnaLon);

    var allBodyNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu", "Gulikan", "Yamakantakan"];
    var rawLons = {};
    var planetSigns = {};

    allBodyNames.forEach(function(name) {
      var lon = upagrahas[name] !== undefined ? upagrahas[name] : pl[name];
      rawLons[name] = lon;
      planetSigns[name] = Math.floor(lon / 30);
    });

    var grahas = {};
    allBodyNames.forEach(function(name) {
      var lon = rawLons[name];
      var signIdx = planetSigns[name];
      var d3Sign  = getDrekkanaSign(lon);
      var navSign = getNavamsaSign(lon);
      var d10Sign = getDasamsaSign(lon);
      var nakIdx = Math.floor(lon / (360.0 / 27.0));
      var pada = Math.floor((lon % (360.0 / 27.0)) / (360.0 / 108.0)) + 1;
      var house = houseOffset(lagnaSign, signIdx);

      var isRetro = false;
      if (name === "Rahu" || name === "Ketu") {
        isRetro = true;
      } else if (["Mars", "Mercury", "Jupiter", "Venus", "Saturn"].indexOf(name) !== -1) {
        if (norm360(lon - plPrev[name]) > 180) isRetro = true;
      }

      var dig = evaluateDignityAndMaitri(name, signIdx, pl.Sun, lon, planetSigns);
      grahas[name] = {
        name: name,
        lon: lon,
        degStr: formatDegMin(lon),
        signIdx: signIdx,
        rashi: RASHIS[signIdx],
        drekkanaSignIdx: d3Sign,
        drekkanaRashi: RASHIS[d3Sign],
        navamsaSignIdx: navSign,
        navamsaRashi: RASHIS[navSign],
        dasamsaSignIdx: d10Sign,
        dasamsaRashi: RASHIS[d10Sign],
        vargottama: (signIdx === navSign && name !== "Gulikan" && name !== "Yamakantakan"),
        nakshatra: NAKSHATRAS[nakIdx],
        pada: pada,
        house: house,
        retrograde: isRetro,
        dignity: dig.dignity,
        compoundRelation: dig.compoundRelation,
        combust: dig.combust,
        avastha: getBaladiAvastha(signIdx, lon)
      };
    });

    function buildChartGrid(signKey, lagnaTargetSign) {
      var grid = Array.from({ length: 12 }, function(_, idx) {
        return { signIdx: idx, rashi: RASHIS[idx], isLagna: idx === lagnaTargetSign, bodies: [] };
      });
      allBodyNames.forEach(function(name) {
        var g = grahas[name];
        grid[g[signKey]].bodies.push(g);
      });
      return grid;
    }

    var diff = norm360(pl.Moon - pl.Sun);
    var birthTithiIdx = Math.floor(diff / 12.0);
    var birthKaranaIdx = Math.floor(diff / 6.0);
    var birthYogaIdx = Math.floor(norm360(pl.Moon + pl.Sun) / (360.0 / 27.0));

    var kujaHouses = [1, 2, 4, 7, 8, 12];
    var marsFromLagna = houseOffset(lagnaSign, grahas.Mars.signIdx);
    var marsFromMoon  = houseOffset(grahas.Moon.signIdx, grahas.Mars.signIdx);
    var marsFromVenus = houseOffset(grahas.Venus.signIdx, grahas.Mars.signIdx);
    var hasKujaDosha = (kujaHouses.indexOf(marsFromLagna) !== -1 || kujaHouses.indexOf(marsFromMoon) !== -1);

    var ashtakavarga = computeAshtakavarga(planetSigns, lagnaSign);

    return {
      profile: profile,
      district: dist,
      birthJd: birthJd,
      ayanamsa: pl.ayanamsa,
      birthSunrise: sunTimes.sunrise,
      birthSunset: sunTimes.sunset,
      isPreSunriseBirth: isPreSunrise,
      birthVara: VARAS[birthVaraIdx],
      lagna: {
        lon: lagnaLon,
        degStr: formatDegMin(lagnaLon),
        signIdx: lagnaSign,
        rashi: RASHIS[lagnaSign],
        drekkanaSignIdx: lagnaDrekkana,
        navamsaSignIdx: lagnaNavamsa,
        navamsaRashi: RASHIS[lagnaNavamsa],
        dasamsaSignIdx: lagnaDasamsa,
        dasamsaRashi: RASHIS[lagnaDasamsa],
        vargottama: (lagnaSign === lagnaNavamsa),
        nakshatra: NAKSHATRAS[Math.floor(lagnaLon / (360.0 / 27.0))],
        pada: Math.floor((lagnaLon % (360.0 / 27.0)) / (360.0 / 108.0)) + 1
      },
      janmaNak: grahas.Moon.nakshatra,
      janmaPada: grahas.Moon.pada,
      janmaRashi: grahas.Moon.rashi,
      janmaTithi: TITHI_NAMES[birthTithiIdx],
      janmaKarana: getKaranaMeta(birthKaranaIdx),
      janmaYoga: YOGA_NAMES[birthYogaIdx],
      grahas: grahas,
      rashiChart: buildChartGrid("signIdx", lagnaSign),
      drekkanaChart: buildChartGrid("drekkanaSignIdx", lagnaDrekkana),
      navamsaChart: buildChartGrid("navamsaSignIdx", lagnaNavamsa),
      dasamsaChart: buildChartGrid("dasamsaSignIdx", lagnaDasamsa),
      ashtakavarga: ashtakavarga,
      panchaSphutas: computePanchaSphutas(pl.Sun),
      yogiPoints: computeYogiPoints(pl.Moon, pl.Sun),
      doshas: {
        kujaDosha: hasKujaDosha,
        marsFromLagna: marsFromLagna,
        marsFromMoon: marsFromMoon,
        marsFromVenus: marsFromVenus
      }
    };
  }

  /* --------------------------------------------------------------------------
     6. KOLLAVARSHAM & DAILY TRANSIT + DISTILLED PRESENTATION CONTRACT
     -------------------------------------------------------------------------- */
  function getKollavarsham(year, month, day, sunTimes) {
    var cutoffIST = sunTimes.sunrise + 0.60 * (sunTimes.sunset - sunTimes.sunrise);
    var jdCutoffUT = toJulianDay(year, month, day, cutoffIST - 5.5);
    var sunLonToday = getSiderealPlanets(jdCutoffUT).Sun;
    var mIdx = Math.floor(sunLonToday / 30.0);

    var solarDay = 1;
    for (var back = 1; back <= 33; back++) {
      var prevSun = getSiderealPlanets(jdCutoffUT - back).Sun;
      if (Math.floor(prevSun / 30.0) === mIdx) solarDay++;
      else break;
    }

    var kYear = year - 825;
    if (month > 8 || (month === 8 && mIdx >= 4)) kYear = year - 824;
    return { year: kYear, monthIdx: mIdx, day: solarDay };
  }

  var MOON_GOOD_HOUSES = { 1: 5, 3: 12, 6: 9, 7: 2, 10: 4, 11: 8 };
  var MOON_BAD_HOUSES  = [4, 8, 12];

  function evaluateDay(profile, dateStr, lang, cachedJathakam) {
    var jathakam = cachedJathakam || computeFullJathakam(profile);
    var parts = dateStr.split("-");
    var tY = parseInt(parts[0], 10), tM = parseInt(parts[1], 10), tD = parseInt(parts[2], 10);

    var dist = jathakam.district;
    var sunTimes = getSunTimesIST(tY, tM, tD, dist.lat, dist.lon);
    var sunriseJd = toJulianDay(tY, tM, tD, sunTimes.sunrise - 5.5);
    var noonJd    = toJulianDay(tY, tM, tD, 12.0 - 5.5);

    var ageYears = Math.max(1, Math.floor((noonJd - jathakam.birthJd) / 365.2425));
    var dasha = getVimshottariFull(jathakam.grahas.Moon.lon, jathakam.birthJd, noonJd);

    var civilDate = new Date(Date.UTC(tY, tM - 1, tD));
    var varaIdx = civilDate.getUTCDay();
    var kollam = getKollavarsham(tY, tM, tD, sunTimes);

    var birthNakIdx = jathakam.janmaNak.idx;
    var birthRashiIdx = jathakam.janmaRashi.idx;
    var birthLagnaIdx = jathakam.lagna.signIdx;

    // All 5 Panchangam Angas + Exact IST Transition Timestamps
    var nakSpanToday = findNakshatraSpanIST(noonJd);
    var nakTrans = findTransitionTimeIST(sunriseJd, function(j) {
      return Math.floor(getSiderealPlanets(j).Moon / (360.0 / 27.0));
    });
    var tithiTrans = findTransitionTimeIST(sunriseJd, function(j) {
      var p = getSiderealPlanets(j);
      return Math.floor(norm360(p.Moon - p.Sun) / 12.0);
    });
    var karanaTrans = findTransitionTimeIST(sunriseJd, function(j) {
      var p = getSiderealPlanets(j);
      return Math.floor(norm360(p.Moon - p.Sun) / 6.0);
    });
    var yogaTrans = findTransitionTimeIST(sunriseJd, function(j) {
      var p = getSiderealPlanets(j);
      return Math.floor(norm360(p.Moon + p.Sun) / (360.0 / 27.0));
    });

    // Waking-Day 3-Point Sampling (8 AM, 2 PM, 8 PM IST)
    var sampleHours = [8.0, 14.0, 20.0];
    var sampleWeights = [0.35, 0.40, 0.25];
    var taraSignal = 0;
    var gocharSignal = 0;
    var panchangSignal = 0;
    var vedhaBlocked = false;
    var isChandrashtama = false;

    sampleHours.forEach(function(hIST, idx) {
      var w = sampleWeights[idx];
      var sJd = toJulianDay(tY, tM, tD, hIST - 5.5);
      var pl = getSiderealPlanets(sJd);
      var tNak = Math.floor(pl.Moon / (360.0 / 27.0));
      var tRashi = Math.floor(pl.Moon / 30.0);

      var starDist = ((tNak - birthNakIdx + 27) % 27) + 1;
      var taraNum = ((starDist - 1) % 9) + 1;
      taraSignal += TARA_NAMES[taraNum - 1].val * w;

      var mHouse = houseOffset(birthRashiIdx, tRashi);
      if (mHouse === 8) isChandrashtama = true;
      if (MOON_GOOD_HOUSES[mHouse]) {
        var vedhaHouse = MOON_GOOD_HOUSES[mHouse];
        var allSigns = [pl.Sun, pl.Mars, pl.Mercury, pl.Jupiter, pl.Venus, pl.Saturn].map(function(lon) {
          return houseOffset(birthRashiIdx, Math.floor(lon / 30.0));
        });
        if (allSigns.indexOf(vedhaHouse) !== -1) vedhaBlocked = true;
        else gocharSignal += 1.0 * w;
      } else if (MOON_BAD_HOUSES.indexOf(mHouse) !== -1) {
        gocharSignal -= (mHouse === 8 ? 1.5 : 0.9) * w;
      }

      var diff = norm360(pl.Moon - pl.Sun);
      var tithiNum = Math.floor(diff / 12.0) + 1;
      var halfTithi = Math.floor(diff / 6.0);
      var yogaNum = Math.floor(norm360(pl.Moon + pl.Sun) / (360.0 / 27.0)) + 1;

      var isVishti = !getKaranaMeta(halfTithi).auspicious && (halfTithi > 0 && halfTithi < 57);
      var isRiktha = (tithiNum % 15 === 4 || tithiNum % 15 === 9 || tithiNum % 15 === 14 || tithiNum === 30);
      var badYoga = (yogaNum === 6 || yogaNum === 9 || yogaNum === 10 || yogaNum === 13 || yogaNum === 17 || yogaNum === 27);

      if (isVishti || isRiktha || badYoga) panchangSignal -= 0.8 * w;
      else if (tithiNum % 15 === 5 || tithiNum % 15 === 11 || tithiNum === 15 || yogaNum === 16 || yogaNum === 21) panchangSignal += 0.7 * w;
    });

    var midPl = getSiderealPlanets(noonJd);
    var midMoonNakIdx = Math.floor(midPl.Moon / (360.0 / 27.0));
    var midMoonRashiIdx = Math.floor(midPl.Moon / 30.0);
    var midDiff = norm360(midPl.Moon - midPl.Sun);
    var midTithiIdx = Math.floor(midDiff / 12.0);
    var midKaranaIdx = Math.floor(midDiff / 6.0);
    var midYogaIdx = Math.floor(norm360(midPl.Moon + midPl.Sun) / (360.0 / 27.0));

    var sarvaBindusToday = jathakam.ashtakavarga.sarva[midMoonRashiIdx];
    var moonBindusToday  = jathakam.ashtakavarga.bhinna.Moon[midMoonRashiIdx];
    var avBonus = (sarvaBindusToday >= 30 && moonBindusToday >= 5) ? 0.35 : (sarvaBindusToday <= 24 ? -0.35 : 0);

    var classicalDoshas = evaluateClassicalDoshas(midPl, birthNakIdx, birthLagnaIdx, varaIdx);
    var panchabhutaToday = computePanchabhutaAtTime(12.0, sunTimes);
    var yogiToday = computeYogiPoints(midPl.Moon, midPl.Sun);
    var classicalPenalty = (classicalDoshas.vishaYoga ? 0.45 : 0)
      + (classicalDoshas.dinamrityu ? 0.45 : 0)
      + (classicalDoshas.varaTithiDushtam ? 0.25 : 0)
      + (classicalDoshas.varaNakDushtam ? 0.25 : 0)
      + (classicalDoshas.mrityu.vasuPanchakam || classicalDoshas.mrityu.karinaal ? 0.30 : 0);
    var classicalBonus = classicalDoshas.siddhaYoga ? 0.30 : 0;

    var satSignToday = Math.floor(midPl.Saturn / 30.0);
    var satFromMoon = houseOffset(birthRashiIdx, satSignToday);
    var saturnPhase = "clear";
    if ([12, 1, 2].indexOf(satFromMoon) !== -1) saturnPhase = "sade_sati";
    else if (satFromMoon === 8) saturnPhase = "ashtamashani";
    else if ([4, 7, 10].indexOf(satFromMoon) !== -1) saturnPhase = "kandakashani";

    var starDistMid = ((midMoonNakIdx - birthNakIdx + 27) % 27) + 1;
    var taraMid = TARA_NAMES[((starDistMid - 1) % 9)];

    var nakLord = NAKSHATRAS[midMoonNakIdx].lord;
    var nakLordSign = Math.floor(midPl[nakLord] / 30.0);
    var nakLordHouseFromLagna = houseOffset(birthLagnaIdx, nakLordSign);
    var lagnaMeta = RASHIS[birthLagnaIdx];
    var isFuncBenefic = lagnaMeta.benefics.indexOf(nakLord) !== -1;
    var isFuncMalefic = lagnaMeta.malefics.indexOf(nakLord) !== -1;

    var chainSignal = 0;
    if ([1, 2, 4, 5, 9, 10, 11].indexOf(nakLordHouseFromLagna) !== -1) {
      chainSignal = isFuncBenefic ? 1.0 : 0.6;
    } else if ([6, 8, 12].indexOf(nakLordHouseFromLagna) !== -1) {
      chainSignal = isFuncMalefic ? -1.0 : -0.6;
    }

    var mercHouse = houseOffset(birthLagnaIdx, Math.floor(midPl.Mercury / 30.0));
    var venHouse  = houseOffset(birthLagnaIdx, Math.floor(midPl.Venus / 30.0));
    var marsHouse = houseOffset(birthLagnaIdx, Math.floor(midPl.Mars / 30.0));
    var moonLagnaHouse = houseOffset(birthLagnaIdx, midMoonRashiIdx);

    var layer1 = taraSignal + gocharSignal + avBonus;
    var layer2 = chainSignal + (nakLord === dasha.apaharam ? 0.7 : 0) + (nakLord === dasha.pratyantardasha ? 0.35 : 0);
    var layer3 = panchangSignal + classicalBonus - classicalPenalty;

    var posVotes = (layer1 > 0.35 ? 1 : 0) + (layer2 > 0.35 ? 1 : 0) + (layer3 > 0.25 ? 1 : 0);
    var negVotes = (layer1 < -0.35 ? 1 : 0) + (layer2 < -0.35 ? 1 : 0) + (layer3 < -0.25 ? 1 : 0);

    var verdictKey = "okay";
    if (isChandrashtama && negVotes >= 1) verdictKey = "slow";
    else if (negVotes >= 2) verdictKey = "slow";
    else if (posVotes >= 2 && !isChandrashtama) verdictKey = "great";
    else if (posVotes === 1 && negVotes === 0 && !isChandrashtama) verdictKey = "good";

    // Daytime Muhurtham & Hora Windows
    var dayDur = sunTimes.sunset - sunTimes.sunrise;
    var oct = dayDur / 8.0;
    var rahuOct = [7, 1, 6, 4, 5, 3, 2][varaIdx];
    var gulikaOct = [6, 5, 4, 3, 2, 1, 0][varaIdx];

    var rahuStart = sunTimes.sunrise + rahuOct * oct;
    var gulikaStart = sunTimes.sunrise + gulikaOct * oct;
    var solarNoon = (sunTimes.sunrise + sunTimes.sunset) / 2.0;
    var abhijitStart = solarNoon - (dayDur / 30.0);
    var abhijitEnd   = solarNoon + (dayDur / 30.0);

    var horaSeq = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"];
    var targetHoraLord = dasha.apaharam;
    if (horaSeq.indexOf(targetHoraLord) === -1) targetHoraLord = lagnaMeta.lord;
    var startHoraIdx = horaSeq.indexOf(VARAS[varaIdx].lord);
    var horaDur = dayDur / 12.0;
    var powerHoraIdx = 0;
    for (var h = 0; h < 12; h++) {
      if (horaSeq[(startHoraIdx + h) % 7] === targetHoraLord) { powerHoraIdx = h; break; }
    }
    var pHoraStart = sunTimes.sunrise + powerHoraIdx * horaDur;

    var windows = {
      abhijit: fmtTime(abhijitStart) + " – " + fmtTime(abhijitEnd),
      powerHora: fmtTime(pHoraStart) + " – " + fmtTime(pHoraStart + horaDur) + " (" + PLANETS[targetHoraLord][lang] + ")",
      rahu: fmtTime(rahuStart) + " – " + fmtTime(rahuStart + oct),
      gulikan: fmtTime(gulikaStart) + " – " + fmtTime(gulikaStart + oct),
      tyajyam: nakSpanToday.tyajyam,
      amritakalam: nakSpanToday.amritakalam
    };

    var result = {
      jathakam: jathakam,
      ageYears: ageYears,
      birthNak: jathakam.janmaNak,
      birthPada: jathakam.janmaPada,
      birthRashi: jathakam.janmaRashi,
      birthLagna: jathakam.lagna.rashi,
      dasha: dasha,
      vara: VARAS[varaIdx],
      kollam: kollam,
      sunTimes: sunTimes,
      verdictKey: verdictKey,
      taraMid: taraMid,
      midMoonNak: NAKSHATRAS[midMoonNakIdx],
      midMoonRashi: RASHIS[midMoonRashiIdx],
      midTithi: TITHI_NAMES[midTithiIdx],
      midKarana: getKaranaMeta(midKaranaIdx),
      midYoga: YOGA_NAMES[midYogaIdx],
      transitions: {
        nakshatra: nakTrans.changed ? { timeStr: nakTrans.timeStr, nextNak: NAKSHATRAS[nakTrans.nextVal] } : null,
        tithi: tithiTrans.changed ? { timeStr: tithiTrans.timeStr, nextTithi: TITHI_NAMES[tithiTrans.nextVal] } : null,
        karana: karanaTrans.changed ? { timeStr: karanaTrans.timeStr, nextKarana: getKaranaMeta(karanaTrans.nextVal) } : null,
        yoga: yogaTrans.changed ? { timeStr: yogaTrans.timeStr, nextYoga: YOGA_NAMES[yogaTrans.nextVal] } : null
      },
      ashtakavargaToday: {
        sarva: sarvaBindusToday,
        moonBhinna: moonBindusToday
      },
      saturnPhase: saturnPhase,
      nakLord: nakLord,
      nakLordHouseFromLagna: nakLordHouseFromLagna,
      vedhaBlocked: vedhaBlocked,
      isChandrashtama: isChandrashtama,
      mercHouse: mercHouse,
      venHouse: venHouse,
      marsHouse: marsHouse,
      moonLagnaHouse: moonLagnaHouse,
      posVotes: posVotes,
      negVotes: negVotes,
      windows: windows,
      classicalDoshas: classicalDoshas,
      panchabhuta: panchabhutaToday,
      yogiToday: yogiToday
    };

    result.remedies = getRemediesForState(result, jathakam, lang);
    result.narrative = buildDynamicGuidance(result, jathakam, lang);

    // Distilled Calm UI Contract: exposes ONLY what a daily user needs
    result.distilled = {
      name: profile.name,
      ageYears: ageYears,
      verdictKey: verdictKey,
      kollamLabel: (lang === "ml" ? "കൊല്ലവർഷം " : "Kollavarsham ") + kollam.year + " " + KOLLAM_MONTHS[kollam.monthIdx][lang] + " " + kollam.day + " • " + VARAS[varaIdx][lang],
      identityTags: {
        nakshatra: jathakam.janmaNak[lang] + " (" + jathakam.janmaPada + ")",
        rashi: jathakam.janmaRashi[lang],
        lagna: jathakam.lagna.rashi[lang],
        dasha: PLANETS[dasha.maha][lang] + " – " + PLANETS[dasha.apaharam][lang],
        place: dist[lang]
      },
      windows: {
        abhijit: windows.abhijit,
        powerHora: windows.powerHora,
        rahu: windows.rahu,
        gulikan: windows.gulikan
      },
      narrative: result.narrative,
      remedies: result.remedies
    };

    return result;
  }


  /* --------------------------------------------------------------------------
     7. AUTHENTIC KERALA JYOTHISHAM PARIHARAM (REMEDY) & NON-REPEATING NARRATIVE ENGINE
     -------------------------------------------------------------------------- */
  var KERALA_PARIHARAM_DB = {
    Sun: {
      deityMl: "ശിവൻ / സൂര്യനാരായണൻ", deityEn: "Lord Shiva / Suryanarayana",
      dayMl: "ഞായറാഴ്ച (രാവിലെ സൂര്യോദയത്തിന് ശേഷം)", dayEn: "Sunday (morning after sunrise)",
      offeringMl: "ശിവക്ഷേത്രത്തിൽ ജലധാര / കൂവളമാല സമർപ്പണം, ആദിത്യഹൃദയ ജപം",
      offeringEn: "Jaladhara or Koovala (Bilva) garland at a Shiva temple; recite Aditya Hridayam"
    },
    Moon: {
      deityMl: "ഭഗവതി / പാർവ്വതി ദേവി", deityEn: "Devi Bhagavathy / Goddess Parvati",
      dayMl: "തിങ്കളാഴ്ച അല്ലെങ്കിൽ പൗർണ്ണമി", dayEn: "Monday or Pournami",
      offeringMl: "ദേവീക്ഷേത്രത്തിൽ പാൽപ്പായസം / നെയ്യ് വിളക്ക് സമർപ്പണം",
      offeringEn: "Palpayasam (milk payasam) or Neyvilakku (ghee lamp) at a Bhagavathy temple"
    },
    Mars: {
      deityMl: "സുബ്രഹ്മണ്യ സ്വാമി / ഭദ്രകാളി", deityEn: "Lord Subrahmanya / Bhadrakali",
      dayMl: "ചൊവ്വാഴ്ച", dayEn: "Tuesday",
      offeringMl: "സുബ്രഹ്മണ്യ ക്ഷേത്രത്തിൽ പഞ്ചാമൃതം / ചെത്തിപ്പൂവ് മാല സമർപ്പണം",
      offeringEn: "Panchamrutham or red Chethi flower garland at a Subrahmanya temple"
    },
    Mercury: {
      deityMl: "ശ്രീകൃഷ്ണൻ / മഹാവിഷ്ണു", deityEn: "Lord Sri Krishna / Maha Vishnu",
      dayMl: "ബുധനാഴ്ച", dayEn: "Wednesday",
      offeringMl: "കൃഷ്ണക്ഷേത്രത്തിൽ തുളസിമാല / വെണ്ണ സമർപ്പണം, വിഷ്ണുസഹസ്രനാമ ജപം",
      offeringEn: "Tulasi garland or butter offering at a Krishna temple; recite Vishnu Sahasranamam"
    },
    Jupiter: {
      deityMl: "മഹാവിഷ്ണു / ദക്ഷിണാമൂർത്തി", deityEn: "Lord Maha Vishnu / Dakshinamurthy",
      dayMl: "വ്യാഴാഴ്ച", dayEn: "Thursday",
      offeringMl: "വിഷ്ണുക്ഷേത്രത്തിൽ പാൽപ്പായസം / മഞ്ഞപ്പൂക്കൾ സമർപ്പണം",
      offeringEn: "Palpayasam or yellow flower offering at a Vishnu temple"
    },
    Venus: {
      deityMl: "മഹാലക്ഷ്മി / അന്നപൂർണ്ണേശ്വരി", deityEn: "Goddess Mahalakshmi / Devi",
      dayMl: "വെള്ളിയാഴ്ച", dayEn: "Friday",
      offeringMl: "ദേവീക്ഷേത്രത്തിൽ നെയ്യ് വിളക്ക് / താമരപ്പൂവ് സമർപ്പണം",
      offeringEn: "Ghee lamp (Neyvilakku) or lotus offering to Devi on Friday"
    },
    Saturn: {
      deityMl: "ശാസ്താവ് (അയ്യപ്പൻ) / ഹനുമാൻ", deityEn: "Lord Ayyappa (Sastha) / Hanuman",
      dayMl: "ശനിയാഴ്ച", dayEn: "Saturday",
      offeringMl: "ശാസ്താ ക്ഷേത്രത്തിൽ നീരാജനം (എള്ളുതിരി) സമർപ്പണം",
      offeringEn: "Neeranjanam (sesame oil lamp in coconut half) at an Ayyappa / Sastha temple"
    },
    Rahu: {
      deityMl: "നാഗരാജാവ് / ദുർഗ്ഗാ ദേവി", deityEn: "Nagaraja / Goddess Durga",
      dayMl: "ഞായർ / വെള്ളി (ആയില്യം നക്ഷത്രം)", dayEn: "Sunday or Friday (Ashlesha star)",
      offeringMl: "നാഗക്ഷേത്രത്തിൽ നൂറും പാലും / മഞ്ഞൾപ്പൊടി സമർപ്പണം",
      offeringEn: "Noorum Palum or turmeric offering at a Nagaraja shrine"
    },
    Ketu: {
      deityMl: "മഹാഗണപതി", deityEn: "Lord Maha Ganapathi",
      dayMl: "വെള്ളി / ചൊവ്വ (അശ്വതി/മകം/മൂലം)", dayEn: "Friday or Tuesday",
      offeringMl: "ഗണപതി ക്ഷേത്രത്തിൽ ഗണപതിഹോമം / കറുകമാല സമർപ്പണം",
      offeringEn: "Ganapathi Homam or Karuka grass garland at a Ganapathi temple"
    }
  };

  function getRemediesForState(ev, jathakam, lang) {
    var isMl = (lang === "ml");
    var remedies = [];
    var addedPlanets = {};

    function pushRemedy(planet, reasonMl, reasonEn, priority) {
      if (addedPlanets[planet]) return;
      addedPlanets[planet] = true;
      var p = KERALA_PARIHARAM_DB[planet];
      if (!p) return;
      remedies.push({
        planet: planet,
        planetLabel: PLANETS[planet][lang],
        priority: priority,
        reason: isMl ? reasonMl : reasonEn,
        deity: isMl ? p.deityMl : p.deityEn,
        dayOfWeek: isMl ? p.dayMl : p.dayEn,
        offering: isMl ? p.offeringMl : p.offeringEn
      });
    }

    // 1. Chandrashtama (Moon in 8th from Janma Rashi) -> Devi / Moon Pariharam
    if (ev.isChandrashtama) {
      pushRemedy(
        "Moon",
        "ചന്ദ്രാഷ്ടമ ദിനമായതിനാൽ മനഃശാന്തിക്കും തടസ്സങ്ങൾ മാറാനും",
        "Chandrashtama (8th-house Moon transit) — to steady the mind and prevent friction",
        "high"
      );
    }

    // 2. Macro Saturn Phase (Sade Sati / Ashtamashani / Kandakashani) -> Sastha Neeranjanam
    if (ev.saturnPhase === "sade_sati" || ev.saturnPhase === "ashtamashani" || ev.saturnPhase === "kandakashani") {
      var satReasonMl = ev.saturnPhase === "ashtamashani"
        ? "അഷ്ടമശനി ഗോചാര ദോഷശാന്തിക്കായി"
        : (ev.saturnPhase === "sade_sati" ? "ഏഴരശനി കാലയളവിലെ തടസ്സങ്ങൾ കുറയ്ക്കാൻ" : "കണ്ടകശനി ദോഷശാന്തിക്കായി");
      var satReasonEn = ev.saturnPhase === "ashtamashani"
        ? "Ashtamashani (8th Saturn transit) — for patience and protection from delays"
        : (ev.saturnPhase === "sade_sati" ? "Sade Sati (Ezharashani) phase — to ease workload and delays" : "Kandakashani transit — for steady progress");
      pushRemedy("Saturn", satReasonMl, satReasonEn, "high");
    }

    // 3. Difficult Tara Balam (Vipath=3, Pratyak=5, Vadha=7) -> Nakshatra Lord Pariharam
    if (ev.taraMid.val < 0) {
      var starLord = ev.midMoonNak.lord;
      pushRemedy(
        starLord,
        "ഇന്നത്തെ " + ev.taraMid.ml + " ദോഷപരിഹാരത്തിനായി (നക്ഷത്രനാഥൻ: " + PLANETS[starLord].ml + ")",
        "Today's " + ev.taraMid.en + " (ruled by " + PLANETS[starLord].en + ") — to neutralize sudden obstacles",
        "medium"
      );
    }

    // 4. Challenging Apaharam (Sub-period) or Nakshatra-Lord in 6/8/12 from Lagna
    if ([6, 8, 12].indexOf(ev.nakLordHouseFromLagna) !== -1) {
      pushRemedy(
        ev.nakLord,
        "നക്ഷത്രനാഥനായ " + PLANETS[ev.nakLord].ml + " ലഗ്നത്തിൽ നിന്ന് " + ev.nakLordHouseFromLagna + "-ാം ഭാവത്തിൽ സഞ്ചരിക്കുന്നതിനാൽ",
        "Transit star-lord " + PLANETS[ev.nakLord].en + " is in the " + ev.nakLordHouseFromLagna + "th house from your Lagna",
        "medium"
      );
    }

    // 5. If overall day is 'slow' or 'okay' with caution votes and fewer than 2 remedies, add active Apaharam lord support
    if ((ev.verdictKey === "slow" || ev.negVotes > 0) && remedies.length < 2) {
      var apa = ev.dasha.apaharam;
      pushRemedy(
        apa,
        "നിലവിലെ " + PLANETS[apa].ml + " അപഹാര കാലയളവ് അനുകൂലമാകാൻ",
        "To strengthen your active " + PLANETS[apa].en + " Apaharam sub-period",
        "supportive"
      );
    }

    if (ev.classicalDoshas && (ev.classicalDoshas.vishaYoga || ev.classicalDoshas.dinamrityu || ev.classicalDoshas.mrityu.karinaal || ev.classicalDoshas.mrityu.vasuPanchakam)) {
      pushRemedy(
        "Saturn",
        "ഇന്നത്തെ " + ev.classicalDoshas.activeDoshaFlags.join(", ") + " ദോഷശാന്തിക്കായി",
        "Today's classical Panchangam markers (" + ev.classicalDoshas.activeDoshaFlags.join(", ") + ")",
        "high"
      );
    }

    return remedies;
  }

  /* --------------------------------------------------------------------------
     8. DYNAMIC NON-REPEATING ASTROLOGICAL NARRATIVE GENERATOR
     --------------------------------------------------------------------------
     Synthesizes guidance directly from the exact astronomical state (Transiting
     Moon Nakshatra, Tara Balam, House from Janma Rashi & Lagna, Mercury/Venus/Mars
     house placements, active Dasha-Apaharam, and Life Stage) so consecutive days
     with different sky geometry never repeat canned boilerplate.
  -------------------------------------------------------------------------- */
  function buildDynamicGuidance(ev, jathakam, lang) {
    var isMl = (lang === "ml");
    var stage = ev.ageYears < 23 ? "student" : (ev.ageYears <= 45 ? "career" : (ev.ageYears <= 60 ? "midlife" : "senior"));

    var tStar = ev.midMoonNak[lang];
    var tRashi = ev.midMoonRashi[lang];
    var mHouse = houseOffset(jathakam.janmaRashi.idx, ev.midMoonRashi.idx);
    var apaLordName = PLANETS[ev.dasha.apaharam][lang];
    var nakLordName = PLANETS[ev.nakLord][lang];

    // Summary Paragraph anchored in today's exact Moon sign, house from Janma Rashi, and Tara Balam
    var summary = "";
    if (isMl) {
      var houseNoteMl = ev.isChandrashtama
        ? "ചന്ദ്രൻ നിങ്ങളുടെ കൂറിന്റെ അഷ്ടമരാശിയായ " + tRashi + " രാശിയിലൂടെ (ചന്ദ്രാഷ്ടമം) സഞ്ചരിക്കുന്നതിനാൽ"
        : (ev.vedhaBlocked
          ? "ചന്ദ്രൻ " + mHouse + "-ാം ഭാവത്തിലാണെങ്കിലും വേധം ഉള്ളതിനാൽ"
          : "ചന്ദ്രൻ നിങ്ങളുടെ കൂറിൽ നിന്ന് " + mHouse + "-ാം ഭാവമായ " + tRashi + " രാശിയിലും " + tStar + " നക്ഷത്രത്തിലും സഞ്ചരിക്കുന്നതിനാൽ");

      if (ev.verdictKey === "great") {
        summary = houseNoteMl + " താരാബലവും (" + ev.taraMid.ml.split(" ")[0] + ") നക്ഷത്രനാഥൻ " + nakLordName + "-ന്റെ സ്ഥിതിയും ഒരുപോലെ അനുകൂലമാണ്. " + apaLordName + " അപഹാരത്തിന്റെ പിന്തുണയോടെ പ്രധാന കാര്യങ്ങൾ ഇന്ന് ആത്മവിശ്വാസത്തോടെ പൂർത്തിയാക്കാം.";
      } else if (ev.verdictKey === "good") {
        summary = houseNoteMl + " ദൈനംദിന കാര്യങ്ങളിൽ സുഗമമായ ഒഴുക്ക് പ്രതീക്ഷിക്കാം. നക്ഷത്രനാഥൻ " + nakLordName + " അനുകൂല ഭാവത്തിലായതിനാൽ ആസൂത്രണം ചെയ്ത ജോലികൾ കൃത്യമായി നടക്കും.";
      } else if (ev.verdictKey === "slow") {
        summary = houseNoteMl + " മനസ്സിന് അല്പം അലച്ചിലോ തീരുമാനങ്ങളിൽ ആശയക്കുഴപ്പമോ തോന്നാം. പുതിയ സാഹസങ്ങൾക്ക് മുതിരാതെ താഴെ നൽകിയിരിക്കുന്ന പരിഹാരവും ശുഭസമയങ്ങളും പാലിക്കുക.";
      } else {
        summary = houseNoteMl + " സമ്മിശ്ര ഫലങ്ങളാണ് ഇന്ന് കാണുന്നത്. " + apaLordName + " അപഹാര കാലയളവ് ആയതിനാൽ തിടുക്കം ഒഴിവാക്കി പതിവ് ഉത്തരവാദിത്തങ്ങളിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.";
      }
    } else {
      var houseNoteEn = ev.isChandrashtama
        ? "With the Moon transiting " + tRashi + " — your 8th Rashi (Chandrashtama) — in " + tStar + ","
        : (ev.vedhaBlocked
          ? "Although the Moon is in your " + mHouse + "th Rashi (" + tRashi + "), a planetary Vedha softens its momentum, so"
          : "With the Moon moving through " + tRashi + " (your " + mHouse + "th house from Janma Rashi) in " + tStar + ",");

      if (ev.verdictKey === "great") {
        summary = houseNoteEn + " your " + ev.taraMid.en + " aligns cleanly with star-lord " + nakLordName + " and your " + apaLordName + " Apaharam — an ideal window for decisive progress.";
      } else if (ev.verdictKey === "good") {
        summary = houseNoteEn + " daily momentum stays supportive under star-lord " + nakLordName + ", favoring steady execution and constructive conversations.";
      } else if (ev.verdictKey === "slow") {
        summary = houseNoteEn + " mental energy can scatter or hit sudden friction. Keep commitments conservative, use the Abhijit window, and follow the recommended Pariharam below.";
      } else {
        summary = houseNoteEn + " today carries a mixed rhythm under your " + apaLordName + " Apaharam — best used for clearing pending routine tasks rather than forcing big leaps.";
      }
    }

    // Domain 1: Work & Focus (driven by Mercury house + Moon house + Nakshatra lord)
    var workGood = ([1, 3, 6, 10, 11].indexOf(ev.mercHouse) !== -1 || ev.taraMid.val > 0) && !ev.isChandrashtama;
    var workCaution = ev.isChandrashtama || ev.taraMid.val < 0;
    var workStatus = workCaution ? "careful" : (workGood ? "strong" : "steady");
    var workText = "";
    if (isMl) {
      var mercClauseMl = "ബുധൻ ലഗ്നത്തിൽ നിന്ന് " + ev.mercHouse + "-ാം ഭാവത്തിൽ നിൽക്കുന്നതിനാൽ ";
      if (stage === "student") {
        workText = mercClauseMl + (workCaution ? "പഠനത്തിൽ ശ്രദ്ധ വ്യതിചലിക്കാൻ സാധ്യതയുണ്ട്; ചെറിയ സമയക്രമം നിശ്ചയിച്ച് പഠിക്കുക." : (workGood ? "പുതിയ വിഷയങ്ങൾ വേഗത്തിൽ മനസ്സിലാക്കാനും പരീക്ഷാ തയ്യാറെടുപ്പുകൾക്കും മികച്ച ദിവസമാണ്." : "പഴയ പാഠഭാഗങ്ങൾ ആവർത്തിച്ച് പഠിക്കുന്നതാണ് ഇന്ന് കൂടുതൽ ഗുണകരം."));
      } else if (stage === "career") {
        workText = mercClauseMl + (workCaution ? "ഔദ്യോഗിക ആശയവിനിമയങ്ങളിലും രേഖകളിലും പിഴവുകൾ വരാതെ സൂക്ഷിക്കുക; തിടുക്കത്തിൽ മറുപടി നൽകരുത്." : (workGood ? "പ്രധാന മീറ്റിംഗുകൾക്കും പുതിയ ആശയങ്ങൾ അവതരിപ്പിക്കാനും " + tStar + " നക്ഷത്രബലം ഗുണം ചെയ്യും." : "പതിവ് ഓഫീസ് ജോലികൾ കൃത്യസമയത്ത് തീർക്കാൻ ശ്രദ്ധിക്കുക; അനാവശ്യ തർക്കങ്ങൾ ഒഴിവാക്കുക."));
      } else if (stage === "midlife") {
        workText = mercClauseMl + (workCaution ? "ഒരേസമയം പല ഉത്തരവാദിത്തങ്ങൾ ഏറ്റെടുക്കാതെ പ്രധാന കാര്യങ്ങൾക്ക് മാത്രം മുൻഗണന നൽകുക." : (workGood ? "ദീർഘകാല പദ്ധതികൾ ആസൂത്രണം ചെയ്യാനും സഹപ്രവർത്തകർക്ക് നിർദ്ദേശങ്ങൾ നൽകാനും അനുകൂല ദിവസമാണ്." : "നിലവിലുള്ള ഉത്തരവാദിത്തങ്ങൾ ശാന്തമായി മുന്നോട്ട് കൊണ്ടുപോകുക."));
      } else {
        workText = mercClauseMl + (workCaution ? "ശരീരത്തിന് അമിത ആയാസം നൽകുന്ന ജോലികൾ ഒഴിവാക്കി വിശ്രമത്തിന് പ്രാധാന്യം നൽകുക." : (workGood ? "വായന, എഴുത്ത്, സാമൂഹിക കാര്യങ്ങൾ എന്നിവയിൽ സജീവമായി ഇടപെടാൻ ഉന്മേഷമുള്ള ദിവസമാണ്." : "പതിവ് ദിനചര്യകളും പ്രാർത്ഥനയും കൃത്യമായി പാലിക്കുന്നത് മനസ്സിന് സന്തോഷം നൽകും."));
      }
    } else {
      var mercClauseEn = "With Mercury in your " + ev.mercHouse + "th house from Lagna and Moon in " + tStar + ", ";
      if (stage === "student") {
        workText = mercClauseEn + (workCaution ? "focus can drift easily — break study sessions into short 30-minute blocks." : (workGood ? "analytical clarity is high for tackling complex chapters, problem sets, or presentations." : "stick to structured revision and core coursework rather than starting too many new topics."));
      } else if (stage === "career") {
        workText = mercClauseEn + (workCaution ? "double-check emails, numbers, and deliverables before sending to avoid miscommunication." : (workGood ? "strong communication and execution energy make this ideal for key meetings and deadlines." : "focus on clearing pending tasks steadily and keep team coordination concise."));
      } else if (stage === "midlife") {
        workText = mercClauseEn + (workCaution ? "avoid overloading your calendar; delegate routine follow-ups where possible." : (workGood ? "strategic planning, mentoring, and reviewing long-term goals flow smoothly today." : "maintain a steady pace on ongoing commitments and save major reviews for the afternoon."));
      } else {
        workText = mercClauseEn + (workCaution ? "keep your schedule unhurried and prioritize physical comfort over chores." : (workGood ? "great mental freshness for reading, writing, organizing home matters, or community roles." : "a calm, predictable routine works best today."));
      }
    }

    // Domain 2: People & Mood (driven by Venus + Mars + Moon Lagna house)
    var moodGood = ([1, 4, 5, 7, 11].indexOf(ev.venHouse) !== -1 || [1, 4, 5, 9, 11].indexOf(ev.moonLagnaHouse) !== -1) && !ev.isChandrashtama;
    var moodCaution = ev.isChandrashtama || [6, 8, 12].indexOf(ev.moonLagnaHouse) !== -1 || [1, 7, 8].indexOf(ev.marsHouse) !== -1;
    var moodStatus = moodCaution ? "careful" : (moodGood ? "strong" : "steady");
    var moodText = "";
    if (isMl) {
      var venClauseMl = "ശുക്രൻ " + ev.venHouse + "-ാം ഭാവത്തിലും ചൊവ്വ " + ev.marsHouse + "-ാം ഭാവത്തിലും നിൽക്കുന്നതിനാൽ ";
      moodText = venClauseMl + (moodCaution
        ? "സംസാരത്തിൽ ക്ഷമ പാലിക്കുക; ചെറിയ അഭിപ്രായവ്യത്യാസങ്ങൾ വലുതാക്കാതെ ശാന്തമായി കേൾക്കുക."
        : (moodGood
          ? "കുടുംബാംഗങ്ങളുമായും സുഹൃത്തുക്കളുമായും ഊഷ്മളമായ ബന്ധം പുലർത്താനും സന്തോഷകരമായ സമയം ചെലവഴിക്കാനും സാധിക്കും."
          : "വീട്ടിലും സൗഹൃദങ്ങളിലും സമാധാനപരമായ സമീപനം തുടരുക; വൈകുന്നേരം വിശ്രമിക്കുക."));
    } else {
      var venClauseEn = "With Venus in your " + ev.venHouse + "th house and Mars in your " + ev.marsHouse + "th, ";
      moodText = venClauseEn + (moodCaution
        ? "emotional sensitivity or impatience can flare quickly — pause before reacting in personal conversations."
        : (moodGood
          ? "warmth and harmony come naturally in family discussions, partner time, and close friendships."
          : "emotional balance stays steady; a quiet evening walk or call with family will feel grounding."));
    }

    // Domain 3: Money & Decisions (driven by Ashtakavarga bindus + Vedha + Venus/Mercury houses)
    var moneyGood = ([2, 5, 9, 11].indexOf(ev.venHouse) !== -1 || [2, 11].indexOf(ev.mercHouse) !== -1) && !ev.isChandrashtama && ev.negVotes === 0;
    var moneyCaution = ev.isChandrashtama || ev.vedhaBlocked || ev.negVotes >= 1 || [8, 12].indexOf(ev.moonLagnaHouse) !== -1;
    var moneyStatus = moneyCaution ? "careful" : (moneyGood ? "strong" : "steady");
    var moneyText = "";
    if (isMl) {
      var avClauseMl = tRashi + " രാശിയിൽ നിങ്ങളുടെ സർവ്വാഷ്ടകവർഗ്ഗ ബലം " + ev.ashtakavargaToday.sarva + " ബിന്ദുക്കൾ ആയതിനാൽ ";
      moneyText = avClauseMl + (moneyCaution
        ? "വലിയ സാമ്പത്തിക ഇടപാടുകളും പുതിയ കരാറുകളിൽ ഒപ്പിടുന്നതും ഇന്ന് മാറ്റിവെക്കുന്നതാണ് ഉചിതം."
        : (moneyGood
          ? "സാമ്പത്തിക ആസൂത്രണത്തിനും നിക്ഷേപ കാര്യങ്ങൾ വിലയിരുത്താനും അനുകൂലമായ ദിവസമാണ്."
          : "പതിവ് ചെലവുകൾ മാത്രം നടത്തുക; രേഖകൾ കൃത്യമായി പരിശോധിച്ച ശേഷം മാത്രം തീരുമാനമെടുക്കുക."));
    } else {
      var avClauseEn = "With " + ev.ashtakavargaToday.sarva + " Sarva Ashtakavarga bindus in " + tRashi + ", ";
      moneyText = avClauseEn + (moneyCaution
        ? "defer big-ticket purchases, speculative moves, or binding signatures to a stronger day."
        : (moneyGood
          ? "financial judgment is well-supported for budgeting, negotiations, and reviewing savings."
          : "stick to planned expenses and read all fine print before committing funds."));
    }

    return {
      summary: summary,
      domains: [
        { key: "work",  status: workStatus,  text: workText },
        { key: "mood",  status: moodStatus,  text: moodText },
        { key: "money", status: moneyStatus, text: moneyText }
      ]
    };
  }

  /* --------------------------------------------------------------------------
     9. 7-DAY WEEKLY FORECAST & PARIHARAM PLANNER (evaluateWeek)
     -------------------------------------------------------------------------- */
  function evaluateWeek(profile, startDateStr, lang, cachedJathakam) {
    var jathakam = cachedJathakam || computeFullJathakam(profile);
    var p = startDateStr.split("-");
    var baseDate = new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));

    var days = [];
    var greatDays = [];
    var cautionDays = [];
    var weeklyRemediesMap = {};

    for (var i = 0; i < 7; i++) {
      var d = new Date(baseDate.getTime() + i * 86400000);
      var dStr = d.toISOString().slice(0, 10);
      var ev = evaluateDay(profile, dStr, lang, jathakam);
      days.push({
        dateStr: dStr,
        vara: ev.vara,
        kollam: ev.kollam,
        moonNak: ev.midMoonNak,
        moonRashi: ev.midMoonRashi,
        tara: ev.taraMid,
        verdictKey: ev.verdictKey,
        isChandrashtama: ev.isChandrashtama,
        summary: ev.narrative.summary,
        windows: ev.distilled.windows,
        remedies: ev.remedies
      });

      if (ev.verdictKey === "great" || ev.verdictKey === "good") {
        greatDays.push(ev.vara[lang] + " (" + dStr.slice(5) + ")");
      } else if (ev.verdictKey === "slow") {
        cautionDays.push(ev.vara[lang] + " (" + dStr.slice(5) + ")");
      }

      ev.remedies.forEach(function(rem) {
        if (!weeklyRemediesMap[rem.planet]) {
          weeklyRemediesMap[rem.planet] = rem;
        }
      });
    }

    var weeklyRemedies = Object.keys(weeklyRemediesMap).map(function(k) { return weeklyRemediesMap[k]; });
    var isMl = (lang === "ml");
    var weeklyOverview = "";
    if (isMl) {
      weeklyOverview = "ഈ ആഴ്ചയിൽ " + (greatDays.length ? greatDays.join(", ") + " എന്നീ ദിവസങ്ങൾ പ്രധാന തീരുമാനങ്ങൾക്ക് അനുകൂലമാണ്. " : "സ്ഥിരതയോടെ മുന്നോട്ട് പോകേണ്ട ആഴ്ചയാണിത്. ")
        + (cautionDays.length ? cautionDays.join(", ") + " ദിവസങ്ങളിൽ പ്രത്യേക കരുതലും പരിഹാരങ്ങളും പാലിക്കുക." : "വലിയ ദോഷങ്ങളില്ലാത്ത ശാന്തമായ ആഴ്ചയാണിത്.");
    } else {
      weeklyOverview = (greatDays.length ? "Best days this week for key initiatives: " + greatDays.join(", ") + ". " : "A steady, methodical week overall. ")
        + (cautionDays.length ? "Pace yourself and observe the recommended Pariharam on: " + cautionDays.join(", ") + "." : "No major transit friction appears across these seven days.");
    }

    return {
      startDate: startDateStr,
      endDate: days[6].dateStr,
      weeklyOverview: weeklyOverview,
      bestDays: greatDays,
      cautionDays: cautionDays,
      weeklyRemedies: weeklyRemedies,
      days: days
    };
  }


  /* --------------------------------------------------------------------------
     10. CLASSICAL KERALA SPHUTAS, YOGI/AVAYOGI, PANCHABHUTA & MRITYU/GUNA DOSHAM (v3.0)
     -------------------------------------------------------------------------- */
  var SIDDHA_YOGA_BY_DOW = [
    [7, 15, 23, 24],      // Sun (idx 0 -> weekday 1)
    [17, 2, 27],          // Mon (weekday 2)
    [5, 17, 12, 21, 4],   // Tue (weekday 3)
    [17, 1, 15, 7, 8],    // Wed (weekday 4)
    [12, 13, 14, 19, 27, 1], // Thu (weekday 5)
    [4, 3, 15, 16, 17, 24],  // Fri (weekday 6)
    [12, 21, 26, 20, 27]     // Sat (weekday 7)
  ];

  // [weekday 1..7, tithi 1..30, nakshatra 1..27]
  var VISHA_YOGA_TUPLES = [
    [1, 5, 3], [2, 2, 14], [3, 15, 4], [4, 7, 2], [5, 13, 17], [6, 6, 22], [7, 8, 27],
    [1, 20, 3], [2, 17, 14], [4, 22, 2], [5, 28, 17], [6, 21, 22], [7, 23, 27]
  ];

  // Vara-Tithi Dushtam by tithiInPaksha (1..15) -> array of 1-based weekdays (1..7)
  var VARA_TITHI_DUSHTAM = [
    [4], [4, 6], [6], [], [3], [1, 2], [1, 2, 3], [3, 4, 5, 6], [4, 6, 7], [3, 6], [2, 6, 7], [1, 5], [6], [], []
  ];

  // Vara-Nakshatra Dushtam by nakshatra1 (1..27) -> array of 1-based weekdays (1..7)
  var VARA_NAK_DUSHTAM = [
    [1, 4], [1, 4, 6], [1, 5], [5, 6], [1, 5], [3, 5], [7], [2, 6, 7], [6],
    [1, 2, 6], [], [2, 5, 7], [6, 7], [2, 5, 7], [6], [1, 2, 3, 4, 6], [1, 2], [1, 3],
    [4], [2, 3, 7], [2, 3, 7], [3, 7], [1, 3, 4], [3, 5], [3, 4], [2], [3, 4, 6]
  ];

  var RIKSHALUNCHI_PAIRS = [
    [1, 20], [16, 20], [5, 3], [20, 3], [8, 25], [23, 25],
    [10, 4], [25, 4], [12, 9], [27, 9], [13, 12], [28, 12]
  ];

  var DINAGADA_PAIRS = [[2, 2], [5, 4], [9, 1], [12, 3], [15, 4], [19, 2], [22, 3], [26, 1]];
  var DINAMRITYU_PAIRS = [[2, 4], [6, 2], [9, 4], [13, 1], [16, 2], [19, 4], [23, 1], [26, 3]];

  var BHUTA_NAMES = [
    { ml: "ഭൂമി (Bhumi)", en: "Bhumi (Earth)" },
    { ml: "ജലം (Jala)", en: "Jala (Water)" },
    { ml: "അഗ്നി (Agni)", en: "Agni (Fire)" },
    { ml: "വായു (Vayu)", en: "Vayu (Air)" },
    { ml: "ആകാശം (Akasha)", en: "Akasha (Ether)" }
  ];

  function computePanchaSphutas(sunLon) {
    var s = Math.trunc(sunLon) + Math.trunc((sunLon - Math.trunc(sunLon)) * 60) / 60;
    var dhuma = norm360(s + 133);
    var vyatipata = norm360(360 - dhuma);
    var tt = vyatipata < 180 ? vyatipata + 360 : vyatipata;
    var parivesha = norm360(tt - 180);
    var indrachapa = norm360(360 - parivesha);
    var upaketu = norm360(indrachapa + 17);
    if (upaketu >= 360) upaketu -= 360;
    return {
      dhuma: dhuma,
      vyatipata: vyatipata,
      parivesha: parivesha,
      indrachapa: indrachapa,
      upaketu: upaketu
    };
  }

  function computeYogiPoints(moonLon, sunLon) {
    var yogaSum = norm360(moonLon + sunLon);
    var yogiLon = norm360(yogaSum + 93.33333333333333);
    var avayogiLon = norm360(yogiLon + 186.66666666666666);
    var yogiNakIdx = Math.floor((yogiLon * 6) / 80) % 27;
    var avayogiNakIdx = Math.floor((avayogiLon * 6) / 80) % 27;
    return {
      yogiLon: yogiLon,
      avayogiLon: avayogiLon,
      yogiNak: NAKSHATRAS[yogiNakIdx],
      avayogiNak: NAKSHATRAS[avayogiNakIdx],
      yogiLord: NAKSHATRAS[yogiNakIdx].lord,
      avayogiLord: NAKSHATRAS[avayogiNakIdx].lord,
      sahayogiSign: RASHIS[Math.floor(yogiLon / 30) % 12]
    };
  }

  function computePanchabhutaAtTime(hourIST, sunTimes) {
    var R = sunTimes.sunrise, S = sunTimes.sunset;
    var t = hourIST, span, el;
    if (t >= S || t <= R) {
      span = 24 - S + R;
      if (t <= R) t += 24;
      el = t - S;
    } else {
      span = S - R;
      el = t - R;
    }
    var yamaLen = span / 8.0;
    var q = el / yamaLen;
    var yama = Math.min(8, Math.max(1, Math.trunc(q) + 1));
    var yamaMin = yamaLen * 60.0;
    var m = (q - Math.trunc(q)) * yamaMin;
    var even = (yama % 2 === 0);
    var rawB = even ? [0, 6, 18, 36, 60, 90] : [0, 30, 54, 72, 84, 90];
    var B = rawB.map(function(v, k) { return k ? (v * yamaMin) / 90.0 : 0; });
    var seq = even ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
    var cur = 0;
    for (var k = 1; k <= 5; k++) {
      if (B[k - 1] <= m && m <= B[k]) { cur = k - 1; break; }
    }
    return {
      yama: yama,
      bhuta: BHUTA_NAMES[seq[cur]]
    };
  }

  function evaluateClassicalDoshas(midPl, birthNakIdx, birthLagnaIdx, varaIdx) {
    var moon = midPl.Moon, sun = midPl.Sun;
    var nak1 = Math.floor((moon * 6) / 80) + 1; // 1..27
    var pada = Math.floor((((moon * 6) / 80) - Math.floor((moon * 6) / 80)) * 4) + 1;
    var tithiAng = norm360(moon - sun);
    var tithi1 = Math.floor(tithiAng / 12) + 1; // 1..30
    var t15 = tithi1 > 15 ? tithi1 - 15 : tithi1;
    var wd1 = varaIdx + 1; // 1..7 (Sun=1 .. Sat=7)
    var lagR1 = birthLagnaIdx + 1;

    var siddhaYoga = SIDDHA_YOGA_BY_DOW[varaIdx].indexOf(nak1) !== -1;
    var vishaYoga = VISHA_YOGA_TUPLES.some(function(item) {
      return item[0] === wd1 && item[1] === tithi1 && item[2] === nak1;
    });
    var varaTithiDushtam = VARA_TITHI_DUSHTAM[t15 - 1].indexOf(wd1) !== -1;
    var varaNakDushtam = VARA_NAK_DUSHTAM[nak1 - 1].indexOf(wd1) !== -1;
    var rikshalunchi = RIKSHALUNCHI_PAIRS.some(function(pair) {
      return pair[0] === tithi1 && pair[1] === nak1;
    });
    var dinagadam = DINAGADA_PAIRS.some(function(pair) {
      return pair[0] === nak1 && pair[1] === pada;
    });
    var dinamrityu = DINAMRITYU_PAIRS.some(function(pair) {
      return pair[0] === nak1 && pair[1] === pada;
    });

    // Mrityudosham checks: Vasu Panchakam, Karinaal, Pindanool, Akannaal
    var vasuPanchakam = [[23, 3], [24, 4], [25, 5], [26, 6], [27, 7]].some(function(pair) {
      return pair[0] === nak1 && pair[1] === wd1;
    });
    var karinaal = ([2, 5, 8, 11].indexOf(lagR1) !== -1) &&
                   ([3, 4, 6, 7, 13, 14, 16, 18, 23, 27].indexOf(nak1) !== -1);
    var pindanool = [2, 3, 6, 9, 11, 15, 18, 20, 25].indexOf(nak1) !== -1;

    var sn = Math.floor((sun * 60) / 800) + 1;
    var s2 = sn >= 22 ? sn + 1 : sn;
    var d2 = nak1 >= 22 ? nak1 + 1 : nak1;
    var an = d2 - s2 + 1;
    if (an < 0) an += 28;
    var akannaal = [1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18, 22, 23, 24, 25].indexOf(an) !== -1;

    var flags = [];
    if (vishaYoga) flags.push("Visha Yoga");
    if (varaTithiDushtam) flags.push("Vara-Tithi Dushtam");
    if (varaNakDushtam) flags.push("Vara-Nakshatra Dushtam");
    if (rikshalunchi) flags.push("Rikshalunchi");
    if (dinagadam) flags.push("Dinagadam");
    if (dinamrityu) flags.push("Dinamrityu");
    if (vasuPanchakam) flags.push("Vasu Panchakam");
    if (karinaal) flags.push("Karinaal");
    if (pindanool) flags.push("Pindanool");
    if (akannaal) flags.push("Akannaal");

    return {
      siddhaYoga: siddhaYoga,
      vishaYoga: vishaYoga,
      varaTithiDushtam: varaTithiDushtam,
      varaNakDushtam: varaNakDushtam,
      rikshalunchi: rikshalunchi,
      dinagadam: dinagadam,
      dinamrityu: dinamrityu,
      mrityu: {
        vasuPanchakam: vasuPanchakam,
        karinaal: karinaal,
        pindanool: pindanool,
        akannaal: akannaal
      },
      activeDoshaFlags: flags
    };
  }

  var api = {
    VERSION: "3.0.0-kerala",
    DISTRICTS: DISTRICTS,
    NAKSHATRAS: NAKSHATRAS,
    RASHIS: RASHIS,
    KOLLAM_MONTHS: KOLLAM_MONTHS,
    VARAS: VARAS,
    PLANETS: PLANETS,
    fmtTime: fmtTime,
    getSunTimesIST: getSunTimesIST,
    getKollavarsham: getKollavarsham,
    computeFullJathakam: computeFullJathakam,
    evaluateDay: evaluateDay,
    evaluateWeek: evaluateWeek
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.KeralaJyotishEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
