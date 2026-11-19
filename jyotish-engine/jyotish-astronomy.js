/**
 * jyotish-astronomy.js
 * Chitra Paksha ayanamsa, sidereal planetary & Lagna math, sunrise/sunset,
 * Upagraha longitudes, Kollavarsham solar date, Pancha Sphutas, Yogi points, and Panchabhuta states.
 * Version: 3.0.0-kerala
 */
(function(global) {
  "use strict";

  var KJ = global.__KJ = global.__KJ || {};

  var DEG = Math.PI / 180;
  var RAD = 180 / Math.PI;

  var NAKSHATRAS = KJ.NAKSHATRAS;
  var RASHIS = KJ.RASHIS;
  var BHUTA_NAMES = KJ.BHUTA_NAMES;
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


  // Kollavarsham Solar Calendar Engine
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

  // Classical Kerala Sphutas, Yogi/Avayogi & Panchabhuta
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

  // Expose to internal namespace
  KJ.DEG = DEG;
  KJ.RAD = RAD;
  KJ.norm360 = norm360;
  KJ.angDiff = angDiff;
  KJ.houseOffset = houseOffset;
  KJ.formatDegMin = formatDegMin;
  KJ.toJulianDay = toJulianDay;
  KJ.jdToISTString = jdToISTString;
  KJ.fmtTime = fmtTime;
  KJ.getLahiriAyanamsa = getLahiriAyanamsa;
  KJ.getSiderealPlanets = getSiderealPlanets;
  KJ.getSiderealLagna = getSiderealLagna;
  KJ.getDrekkanaSign = getDrekkanaSign;
  KJ.getNavamsaSign = getNavamsaSign;
  KJ.getDasamsaSign = getDasamsaSign;
  KJ.getSunTimesIST = getSunTimesIST;
  KJ.getUpagrahaLongitudes = getUpagrahaLongitudes;
  KJ.findNakshatraSpanIST = findNakshatraSpanIST;
  KJ.findTransitionTimeIST = findTransitionTimeIST;
  KJ.getKollavarsham = getKollavarsham;
  KJ.computePanchaSphutas = computePanchaSphutas;
  KJ.computeYogiPoints = computeYogiPoints;
  KJ.computePanchabhutaAtTime = computePanchabhutaAtTime;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = KJ;
  }
})(typeof window !== "undefined" ? window : globalThis);
