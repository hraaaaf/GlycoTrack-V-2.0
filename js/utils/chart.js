// chart.js
export function render7DayChart(entries, canvasId='chartHome') {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return null;
  // prepare points (last 7 days)
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 6);
  const days = [];
  for (let i=0;i<7;i++) {
    const d = new Date(); d.setDate(cutoff.getDate() + i); days.push(d);
  }
  // aggregate by date (use average per day)
  const groups = {};
  entries.forEach(e => {
    if (!e.gly) return;
    groups[e.date] = groups[e.date] || [];
    groups[e.date].push(e.gly);
  });
  const labels = days.map(d => d.toLocaleDateString('fr-FR', {weekday:'short', day:'numeric'}));
  const data = days.map(d => {
    const key = d.toISOString().split('T')[0];
    const arr = groups[key] || [];
    if (arr.length === 0) return null;
    const avg = arr.reduce((a,b)=>a+b,0)/arr.length;
    return +avg.toFixed(2);
  });
  // destroy old chart if exists on canvas element
  if (ctx._glycoChart) { try { ctx._glycoChart.destroy(); } catch(e){} }
  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label:'Glycémie (g/L)', data, borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,0.08)', tension:0.4, fill:true, pointRadius:4 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} , scales:{ y:{ suggestedMin:0.5, suggestedMax:2.5 } } }
  });
  ctx._glycoChart = chart;
  return chart;
}
