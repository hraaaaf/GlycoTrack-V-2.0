// dashboard.ui.js
import { averageLastNDays, averageByTimeWindow, averageByCategory, minMaxLastNDays, stdDevLastNDays, distribution, trendFromLastN, glycoScore, estimateA1cFromAvgGL } from './dashboard.service.js';
import { render7DayChart } from '../utils/chart.js';
import { showToast } from '../core/toast.js';

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = text === null || text === undefined ? '—' : text;
}

/**
 * Render full dashboard into DOM (expects elements with specific IDs present in HTML)
 * @param {Array} entries
 */
export function renderDashboard(entries) {
  // averages
  const avg7 = averageLastNDays(entries, 7);
  const avg14 = averageLastNDays(entries, 14);
  const avg30 = averageLastNDays(entries, 30);

  safeSetText('avg7', avg7 !== null ? avg7.toFixed(2) : '—');
  safeSetText('avg14', avg14 !== null ? avg14.toFixed(2) : '—');
  safeSetText('avg30', avg30 !== null ? avg30.toFixed(2) : '—');

  // average by time window
  const byTime = averageByTimeWindow(entries);
  safeSetText('avgTimeMatin', byTime.Matin || '—');
  safeSetText('avgTimeMidi', byTime.Midi || '—');
  safeSetText('avgTimeSoir', byTime.Soir || '—');
  safeSetText('avgTimeNuit', byTime.Nuit || '—');

  // average by category
  const byCat = averageByCategory(entries);
  safeSetText('avgCatMatin', byCat.Matin !== null ? byCat.Matin.toFixed(2) : '—');
  safeSetText('avgCatMidi', byCat.Midi !== null ? byCat.Midi.toFixed(2) : '—');
  safeSetText('avgCatSoir', byCat.Soir !== null ? byCat.Soir.toFixed(2) : '—');
  safeSetText('avgCatDivers', byCat.Divers !== null ? byCat.Divers.toFixed(2) : '—');

  // min/max
  const mm7 = minMaxLastNDays(entries, 7);
  const mm30 = minMaxLastNDays(entries, 30);
  safeSetText('min7', mm7.min !== null ? mm7.min.toFixed(2) : '—');
  safeSetText('max7', mm7.max !== null ? mm7.max.toFixed(2) : '—');
  safeSetText('min30', mm30.min !== null ? mm30.min.toFixed(2) : '—');
  safeSetText('max30', mm30.max !== null ? mm30.max.toFixed(2) : '—');

  // stddev
  const sd7 = stdDevLastNDays(entries, 7);
  const sd30 = stdDevLastNDays(entries, 30);
  safeSetText('sd7', sd7 !== null ? sd7.toFixed(2) : '—');
  safeSetText('sd30', sd30 !== null ? sd30.toFixed(2) : '—');

  // distribution (30 days)
  const dist = distribution(entries, 30);
  safeSetText('hypoPct', dist.hypo + '%');
  safeSetText('targetPct', dist.target + '%');
  safeSetText('hyperPct', dist.hyper + '%');

  // trend
  const t = trendFromLastN(entries, 10);
  safeSetText('trendSymbol', t.symbol);
  safeSetText('trendSlope', t.slope);

  // glyco score
  const score = glycoScore(entries);
  safeSetText('glyScore', score + '/100');

  // estimated A1c
  const avg30Val = averageLastNDays(entries, 30);
  const a1c = estimateA1cFromAvgGL(avg30Val);
  safeSetText('estA1c', a1c !== null ? a1c + '%' : '—');

  // render charts
  render7DayChart(entries, 'chartHome'); // keep previous canvas usage
  // optional: detailed scatter chart for stats view (if canvas exists)
  const advCanvas = document.getElementById('chartAdvanced');
  if (advCanvas) {
    // build scatter dataset colored by zone
    const points = (entries || []).filter(e=>e.gly!=null).slice().reverse().map(e => ({
      x: e.date + ' ' + (e.time || ''),
      y: e.gly,
      cat: e.cat
    }));
    // simple bar of distribution if needed - for now reuse render7DayChart
  }
}
