/**
 * jyotish-jathakam.js
 * Vimshottari Dasha stack, Ashtakavarga bindu tables, planetary dignity/Avastha,
 * classical Dosha checks, and computeFullJathakam.
 * Version: 3.0.0-kerala
 */
(function(global) {
  "use strict";

  var KJ = global.__KJ = global.__KJ || {};

  var DISTRICTS = KJ.DISTRICTS;
  var NAKSHATRAS = KJ.NAKSHATRAS;
  var RASHIS = KJ.RASHIS;
  var VARAS = KJ.VARAS;
  var NATURAL_RELATIONS = KJ.NATURAL_RELATIONS;
  var PLANETS = KJ.PLANETS;
  var TITHI_NAMES = KJ.TITHI_NAMES;
  var YOGA_NAMES = KJ.YOGA_NAMES;
  var getKaranaMeta = KJ.getKaranaMeta;
  var DASHA_ORDER = KJ.DASHA_ORDER;
  var ASHTAKAVARGA_RULES = KJ.ASHTAKAVARGA_RULES;
  var SIDDHA_YOGA_BY_DOW = KJ.SIDDHA_YOGA_BY_DOW;
  var VISHA_YOGA_TUPLES = KJ.VISHA_YOGA_TUPLES;
  var VARA_TITHI_DUSHTAM = KJ.VARA_TITHI_DUSHTAM;
  var VARA_NAK_DUSHTAM = KJ.VARA_NAK_DUSHTAM;
  var RIKSHALUNCHI_PAIRS = KJ.RIKSHALUNCHI_PAIRS;
  var DINAGADA_PAIRS = KJ.DINAGADA_PAIRS;
  var DINAMRITYU_PAIRS = KJ.DINAMRITYU_PAIRS;

  var norm360 = KJ.norm360;
  var angDiff = KJ.angDiff;
  var houseOffset = KJ.houseOffset;
  var formatDegMin = KJ.formatDegMin;
  var toJulianDay = KJ.toJulianDay;
  var jdToISTString = KJ.jdToISTString;
  var fmtTime = KJ.fmtTime;
  var getLahiriAyanamsa = KJ.getLahiriAyanamsa;
  var getSiderealPlanets = KJ.getSiderealPlanets;
  var getSiderealLagna = KJ.getSiderealLagna;
  var getDrekkanaSign = KJ.getDrekkanaSign;
  var getNavamsaSign = KJ.getNavamsaSign;
  var getDasamsaSign = KJ.getDasamsaSign;
  var getSunTimesIST = KJ.getSunTimesIST;
  var getUpagrahaLongitudes = KJ.getUpagrahaLongitudes;
  var computePanchaSphutas = KJ.computePanchaSphutas;
  var computeYogiPoints = KJ.computeYogiPoints;
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

  // Classical Kerala Doshas Evaluation
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

  // Expose to internal namespace
  KJ.getVimshottariFull = getVimshottariFull;
  KJ.computeAshtakavarga = computeAshtakavarga;
  KJ.getBaladiAvastha = getBaladiAvastha;
  KJ.evaluateDignityAndMaitri = evaluateDignityAndMaitri;
  KJ.evaluateClassicalDoshas = evaluateClassicalDoshas;
  KJ.computeFullJathakam = computeFullJathakam;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = KJ;
  }
})(typeof window !== "undefined" ? window : globalThis);
