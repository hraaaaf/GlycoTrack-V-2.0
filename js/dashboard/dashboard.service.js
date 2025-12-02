// dashboard.service.js
// Fonctions pures pour calculs statistiques

/**
 * Filtre les entrées récentes (dernier n jours)
 * @param {Array} entries
 * @param {Number} days
 * @returns {Array}
 */
export function entriesLastNDays(entries, days) {
  if (!Array.isArray(entries)) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days-1));
  cutoff.setHours(0,0,0,0);
  return entries.filter(e => {
    if (!e || !e.date) return false;
    const d = new Date(e.date);
    return d >= cutoff && e.gly !== null && e.gly !== undefined;
  });
}

/**
 * Moyenne (ignore les valeurs null/undefined)
 */
export function mean(values) {
  const nums = (values || []).filter(v => v !== null && v !== undefined && !isNaN(v));
  if (nums.length === 0) return null;
  const s = nums.reduce((a,b)=>a+b,0);
  return s / nums.length;
}

/**
 * Moyenne glissante sur n derniers jours
 */
export function averageLastNDays(entries, n) {
  const subset = entriesLastNDays(entries, n).map(e => parseFloat(e.gly)).filter(v => !isNaN(v));
  return subset.length ? +(mean(subset).toFixed(2)) : null;
}

/**
 * Moyenne par période horaire (Matin/Midi/Soir/Nuit) - windows configurables
 */
export function averageByTimeWindow(entries) {
  // Matin 00:00-10:59, Midi 11:00-14:59, Soir 15:00-20:59, Nuit 21:00-23:59
  const groups = { Matin:[], Midi:[], Soir:[], Nuit:[] };
  (entries || []).forEach(e => {
    if (!e || e.gly == null) return;
    const t = e.time || '00:00';
    const hh = parseInt(t.split(':')[0] || '0', 10);
    if (hh <= 10) groups.Matin.push(e.gly);
    else if (hh >= 11 && hh <= 14) groups.Midi.push(e.gly);
    else if (hh >= 15 && hh <= 20) groups.Soir.push(e.gly);
    else groups.Nuit.push(e.gly);
  });
  return {
    Matin: groups.Matin.length ? +(mean(groups.Matin).toFixed(2)) : null,
    Midi: groups.Midi.length ? +(mean(groups.Midi).toFixed(2)) : null,
    Soir: groups.Soir.length ? +(mean(groups.Soir).toFixed(2)) : null,
    Nuit: groups.Nuit.length ? +(mean(groups.Nuit).toFixed(2)) : null
  };
}

/**
 * Moyenne par catégorie (Matin/Midi/Soir/Divers)
 */
export function averageByCategory(entries) {
  const cats = { Matin:[], Midi:[], Soir:[], Divers:[] };
  (entries || []).forEach(e => {
    if (!e || e.gly == null) return;
    const c = e.cat || 'Divers';
    if (!cats[c]) cats[c] = [];
    cats[c].push(e.gly);
  });
  return {
    Matin: cats.Matin.length ? +(mean(cats.Matin).toFixed(2)) : null,
    Midi: cats.Midi.length ? +(mean(cats.Midi).toFixed(2)) : null,
    Soir: cats.Soir.length ? +(mean(cats.Soir).toFixed(2)) : null,
    Divers: cats.Divers.length ? +(mean(cats.Divers).toFixed(2)) : null
  };
}

/**
 * Min & Max over last N days
 */
export function minMaxLastNDays(entries, n) {
  const arr = entriesLastNDays(entries, n).map(e => parseFloat(e.gly)).filter(v => !isNaN(v));
  if (arr.length === 0) return { min: null, max: null };
  return { min: Math.min(...arr), max: Math.max(...arr) };
}

/**
 * Écart-type
 */
export function stdDev(values) {
  const nums = (values || []).filter(v => v !== null && v !== undefined && !isNaN(v));
  if (nums.length < 2) return null;
  const m = mean(nums);
  const variance = nums.reduce((a,b)=>a + Math.pow(b - m, 2), 0) / nums.length;
  return Math.sqrt(variance);
}

/**
 * Écart-type pour last N days
 */
export function stdDevLastNDays(entries, n) {
  const arr = entriesLastNDays(entries, n).map(e => e.gly).filter(v => v !== null && v !== undefined && !isNaN(v));
  const s = stdDev(arr);
  return s === null ? null : +s.toFixed(2);
}

/**
 * Distribution into zones
 */
export function distribution(entries, days = null) {
  const set = days ? entriesLastNDays(entries, days) : (entries || []);
  const stats = { hypo:0, target:0, hyper:0, total:0 };
  set.forEach(e => {
    if (e.gly == null) return;
    stats.total++;
    if (e.gly < 0.70) stats.hypo++;
    else if (e.gly > 1.80) stats.hyper++;
    else stats.target++;
  });
  if (stats.total === 0) return { hypo:0, target:0, hyper:0 };
  return {
    hypo: Math.round(stats.hypo / stats.total * 100),
    target: Math.round(stats.target / stats.total * 100),
    hyper: Math.round(stats.hyper / stats.total * 100)
  };
}

/**
 * Trend (linear regression) over last N measurements (not days)
 * returns slope (per measurement) and trend symbol
 */
export function trendFromLastN(entries, n = 10) {
  if (!entries || entries.length === 0) return { slope: 0, symbol: '→' };
  const vals = entries.filter(e => e.gly != null).slice(0).map(e => ({ x: new Date(e.date + 'T' + (e.time || '00:00')), y: e.gly }));
  if (vals.length < 3) return { slope: 0, symbol: '→' };
  // take last n by date
  vals.sort((a,b)=>a.x - b.x);
  const subset = vals.slice(-n);
  const X = subset.map((v,i)=>i+1); // index as x
  const Y = subset.map(v => v.y);
  const xMean = mean(X);
  const yMean = mean(Y);
  let num = 0, den = 0;
  for (let i=0;i<X.length;i++){
    num += (X[i] - xMean) * (Y[i] - yMean);
    den += Math.pow(X[i] - xMean, 2);
  }
  const slope = den === 0 ? 0 : num / den;
  // define threshold: slope per measurement -> we scale by number of points to make human-friendly
  // use thresholds empiric: slope > 0.05 => up, < -0.05 => down
  let symbol = '→';
  if (slope > 0.05) symbol = '↗';
  if (slope < -0.05) symbol = '↘';
  return { slope: +slope.toFixed(4), symbol };
}

/**
 * Glycemic score (0-100) simple
 * score = clamp( (80 * timeInTarget%) - (stdDevLast30 * 10) + base(20), 0, 100 )
 */
export function glycoScore(entries) {
  const dist = distribution(entries, 30);
  const timeInTarget = dist.target || 0;
  const sd = stdDevLastNDays(entries, 30) || 0;
  let score = (0.8 * timeInTarget) - (sd * 10) + 20;
  if (score > 100) score = 100;
  if (score < 0) score = 0;
  return Math.round(score);
}

/**
 * Estimate A1c (HbA1c) from average gly (g/L)
 * Convert g/L -> mg/dL: 1 g/L = 100 mg/dL
 * ADA formula: A1c (%) = (Avg mg/dL + 46.7) / 28.7
 */
export function estimateA1cFromAvgGL(avg_g_per_L) {
  if (!avg_g_per_L) return null;
  const mgdl = avg_g_per_L * 100;
  const a1c = (mgdl + 46.7) / 28.7;
  return +a1c.toFixed(2);
}
