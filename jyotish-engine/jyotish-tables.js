/**
 * jyotish-tables.js
 * Kerala districts, bilingual Nakshatra/Rashi/Vara/Tithi/Karana/Yoga tables,
 * Ashtakavarga rules, and classical Dosha lookup matrices.
 * Version: 3.0.0-kerala
 */
(function(global) {
  "use strict";

  var KJ = global.__KJ = global.__KJ || {};
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


  // Classical Dosha & Muhurtha Lookup Matrices
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


  // Transit Evaluation House Matrices
  var MOON_GOOD_HOUSES = { 1: 5, 3: 12, 6: 9, 7: 2, 10: 4, 11: 8 };
  var MOON_BAD_HOUSES  = [4, 8, 12];


  // Kerala Pariharam (Temple Remedies) Database
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


  // Expose to internal namespace
  KJ.DISTRICTS = DISTRICTS;
  KJ.NAKSHATRAS = NAKSHATRAS;
  KJ.RASHIS = RASHIS;
  KJ.KOLLAM_MONTHS = KOLLAM_MONTHS;
  KJ.VARAS = VARAS;
  KJ.NATURAL_RELATIONS = NATURAL_RELATIONS;
  KJ.PLANETS = PLANETS;
  KJ.TARA_NAMES = TARA_NAMES;
  KJ.TITHI_NAMES = TITHI_NAMES;
  KJ.KARANA_LIST = KARANA_LIST;
  KJ.getKaranaMeta = getKaranaMeta;
  KJ.YOGA_NAMES = YOGA_NAMES;
  KJ.DASHA_ORDER = DASHA_ORDER;
  KJ.ASHTAKAVARGA_RULES = ASHTAKAVARGA_RULES;
  KJ.SIDDHA_YOGA_BY_DOW = SIDDHA_YOGA_BY_DOW;
  KJ.VISHA_YOGA_TUPLES = VISHA_YOGA_TUPLES;
  KJ.VARA_TITHI_DUSHTAM = VARA_TITHI_DUSHTAM;
  KJ.VARA_NAK_DUSHTAM = VARA_NAK_DUSHTAM;
  KJ.RIKSHALUNCHI_PAIRS = RIKSHALUNCHI_PAIRS;
  KJ.DINAGADA_PAIRS = DINAGADA_PAIRS;
  KJ.DINAMRITYU_PAIRS = DINAMRITYU_PAIRS;
  KJ.BHUTA_NAMES = BHUTA_NAMES;
  KJ.MOON_GOOD_HOUSES = MOON_GOOD_HOUSES;
  KJ.MOON_BAD_HOUSES = MOON_BAD_HOUSES;
  KJ.KERALA_PARIHARAM_DB = KERALA_PARIHARAM_DB;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = KJ;
  }
})(typeof window !== "undefined" ? window : globalThis);
