/**
 * jyotish-guidance.js
 * Non-repeating daily & 7-day weekly narrative synthesizer, Pariharam temple remedies,
 * evaluateDay, and evaluateWeek.
 * Version: 3.0.0-kerala
 */
(function(global) {
  "use strict";

  var KJ = global.__KJ = global.__KJ || {};

  var DISTRICTS = KJ.DISTRICTS;
  var NAKSHATRAS = KJ.NAKSHATRAS;
  var RASHIS = KJ.RASHIS;
  var KOLLAM_MONTHS = KJ.KOLLAM_MONTHS;
  var VARAS = KJ.VARAS;
  var PLANETS = KJ.PLANETS;
  var TARA_NAMES = KJ.TARA_NAMES;
  var TITHI_NAMES = KJ.TITHI_NAMES;
  var KARANA_LIST = KJ.KARANA_LIST;
  var getKaranaMeta = KJ.getKaranaMeta;
  var YOGA_NAMES = KJ.YOGA_NAMES;
  var MOON_GOOD_HOUSES = KJ.MOON_GOOD_HOUSES;
  var MOON_BAD_HOUSES = KJ.MOON_BAD_HOUSES;
  var KERALA_PARIHARAM_DB = KJ.KERALA_PARIHARAM_DB;

  var toJulianDay = KJ.toJulianDay;
  var getSunTimesIST = KJ.getSunTimesIST;
  var getKollavarsham = KJ.getKollavarsham;
  var getSiderealPlanets = KJ.getSiderealPlanets;
  var findNakshatraSpanIST = KJ.findNakshatraSpanIST;
  var findTransitionTimeIST = KJ.findTransitionTimeIST;
  var fmtTime = KJ.fmtTime;
  var norm360 = KJ.norm360;
  var houseOffset = KJ.houseOffset;
  var getVimshottariFull = KJ.getVimshottariFull;
  var computeFullJathakam = KJ.computeFullJathakam;
  var evaluateClassicalDoshas = KJ.evaluateClassicalDoshas;
  var computePanchabhutaAtTime = KJ.computePanchabhutaAtTime;
  var computeYogiPoints = KJ.computeYogiPoints;
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

  // Expose to internal namespace
  KJ.evaluateDay = evaluateDay;
  KJ.getRemediesForState = getRemediesForState;
  KJ.buildDynamicGuidance = buildDynamicGuidance;
  KJ.evaluateWeek = evaluateWeek;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = KJ;
  }
})(typeof window !== "undefined" ? window : globalThis);
