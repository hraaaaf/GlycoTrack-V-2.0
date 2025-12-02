// export.js
export function exportEntriesToExcel(entries, filename='GlycoTrack_export.xlsx') {
  try {
    const exportData = entries.map(e => ({
      Date: e.date, Heure: e.time, Catégorie: e.cat, 'Glycémie (g/L)': e.gly || '',
      'Novorapid (U)': e.novo || '', 'Lantus (U)': e.lantus || '',
      Médicaments: e.meds && e.meds.length ? e.meds.map(m => `${m.name} (${m.dose || '-'})`).join('; ') : '',
      Notes: e.obs || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journal");
    XLSX.writeFile(wb, filename);
  } catch(e) { console.error(e); alert('Erreur export Excel: ' + e.message); }
}

export function exportEntriesToPDF(entries, filename='GlycoTrack_export.pdf') {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text('GlycoTrack - Rapport', 14, 20);
    doc.setFontSize(10);
    let y = 30;
    entries.slice(0,50).forEach(e => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${e.date} ${e.time} | ${e.cat} | ${e.gly ? e.gly.toFixed(2) + ' g/L' : '-'}`, 14, y);
      y += 6;
      if (e.meds && e.meds.length) {
        doc.text(`  Médicaments: ${e.meds.map(m=>m.name + (m.dose ? ' ('+m.dose+')' : '')).join(', ')}`, 14, y);
        y += 6;
      }
      if (e.obs) { doc.text(`  Notes: ${e.obs}`, 14, y); y += 6; }
    });
    doc.save(filename);
  } catch(e) { console.error(e); alert('Erreur export PDF: ' + e.message); }
}
