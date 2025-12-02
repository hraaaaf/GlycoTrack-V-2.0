// app.module.js
import { initModals } from './core/modals.js';
import { showToast } from './core/toast.js';
import * as MedUI from './meds/med.ui.js';
import * as MedService from './meds/med.service.js';
import * as EntryUI from './entries/entry.ui.js';
import * as EntryService from './entries/entry.service.js';
import { getLastUser, setLastUser, DB_VERSION, setAppVersion, getAppVersion } from './core/storage.js';
import { loadMedsForUser } from './meds/med.service.js';
import { render7DayChart } from './utils/chart.js';
import { exportEntriesToExcel, exportEntriesToPDF } from './utils/export.js';
import { showToast as toast } from './core/toast.js';
import * as DashboardService from './dashboard/dashboard.service.js';
import * as DashboardUI from './dashboard/dashboard.ui.js';


// Exposed globals used by index.html (some functions kept)
window.currentCat = 'Matin';
window.selectCat = (cat) => selectCat(cat);
window.openNewEntryModal = (cat) => openNewEntryModal(globalUser, cat);

// We'll keep a simple global user for now (per earlier UX)
let globalUser = getLastUser() || 'Brahim';
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('userName').innerText = globalUser;
  init();
});

function init() {
  initModals();
  // migr
  MedService.migrateOldMealMedsIfAny(globalUser);
  // bind add buttons
  ['Matin','Midi','Soir','Divers'].forEach(cat => {
    const addBtn = document.getElementById(`addMedBtn_${cat}`);
    if (addBtn) addBtn.onclick = () => { MedUI.addMedQuick(globalUser, cat, () => renderAllMedPanels(globalUser)); };
  });

  // hook medEditSaveBtn
  const saveBtn = document.getElementById('medEditSaveBtn');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    const cat = document.getElementById('medEditCat').value;
    const id = document.getElementById('medEditId').value;
    const name = document.getElementById('medEditName').value.trim();
    const dose = document.getElementById('medEditDose').value.trim();
    const taken = document.getElementById('medEditTaken').checked;
    if (!name || name.length < 1) { showToast('Nom requis', 'error'); return; }
    if (id) {
      MedService.updateMed(globalUser, cat, id, { name, dose, taken });
      showToast('Médicament modifié', 'success');
    } else {
      MedService.addMed(globalUser, cat, { id: Date.now(), name, dose, taken });
      showToast('Médicament ajouté', 'success');
    }
    renderAllMedPanels(globalUser);
    // hide
    const el = document.getElementById('medEditModal');
    const modal = bootstrap.Modal.getInstance(el);
    if (modal) modal.hide();
  });

  // override saveEntry global to new logic
  window.saveEntry = () => EntryUI.saveEntryFromModal(globalUser);

  // wire selectCat buttons initial state
  selectCat('Matin');

  // initial render
  renderAllMedPanels(globalUser);
  renderAllEntriesAndStats();

  // hook export buttons
  const expX = document.querySelector('[onclick="exportExcel()"]');
  if (expX) expX.onclick = () => {
    const list = EntryService.loadEntries ? EntryService.loadEntries(globalUser) : [];
    exportEntriesToExcel(list, `GlycoTrack_${globalUser}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export Excel lancé', 'success');
  };
  const expP = document.querySelector('[onclick="exportPDF()"]');
  if (expP) expP.onclick = () => {
    const list = EntryService.loadEntries ? EntryService.loadEntries(globalUser) : [];
    exportEntriesToPDF(list, `GlycoTrack_${globalUser}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Export PDF lancé', 'success');
  };

  // hook notification & theme toggles from old UI if present
  const themeSwitch = document.getElementById('darkModeSwitch');
  if (themeSwitch) {
    // try to restore
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeIcon').className = savedTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    themeSwitch.checked = savedTheme === 'dark';
    themeSwitch.onchange = () => toggleTheme();
  }

  // attach openNewEntryModal to FAB already in HTML
  const fab = document.querySelector('.nav-fab');
  if (fab) fab.onclick = () => openNewEntryModal(globalUser, 'Matin');

  // version housekeeping
  const currVersion = getAppVersion();
  if (!currVersion || currVersion < DB_VERSION) {
    setAppVersion(DB_VERSION);
    showToast('Migration DB effectuée', 'success');
  }
}

/* helpers */
function renderAllMedPanels(user) {
  ['Matin','Midi','Soir','Divers'].forEach(cat => {
    const containerId = 'medList_'+cat;
    const container = document.getElementById(containerId);
    if (container) MedUI.renderMedList(user, cat, containerId);
    // entry modal meds
    EntryUI.renderEntryMeds(user, cat);
  });
}

function renderAllEntriesAndStats() {
  // Charger toutes les entrées de l'utilisateur courant
  const entries = EntryService.loadEntries(globalUser) || [];

  // --- 1) Rendu des entrées du jour ---
  if (typeof renderEntries === "function") {
    renderEntries(entries);
  } else if (typeof EntryUI?.renderEntries === "function") {
    EntryUI.renderEntries(entries);
  }

  // --- 2) Rendu de l’historique ---
  if (typeof renderHistory === "function") {
    renderHistory(entries);
  } else if (typeof EntryUI?.renderHistory === "function") {
    EntryUI.renderHistory(entries);
  }

  // --- 3) Graphique des 7 derniers jours ---
  if (typeof render7DayChart === "function") {
    render7DayChart(entries);
  } else if (typeof ChartUI?.render7DayChart === "function") {
    ChartUI.render7DayChart(entries);
  }

  // --- 4) Nouveau tableau de bord avancé ---
  if (DashboardUI && typeof DashboardUI.renderDashboard === "function") {
    DashboardUI.renderDashboard(entries);
  }

  // --- 5) Optionnel : refresh du compteur d’entrées ---
  if (typeof updateEntryCount === "function") {
    updateEntryCount(entries);
  }

  // --- 6) Optionnel : dernière valeur affichée ---
  if (typeof updateLastValueWidget === "function") {
    updateLastValueWidget(entries);
  }

  // --- 7) Système de notifications (si activé) ---
  if (typeof refreshNotificationState === "function") {
    refreshNotificationState();
  }
}


function entryCardHTML(e) {
  const dateStr = new Date(e.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short'});
  const gly = e.gly ? `<div class="badge-custom bg-val-ok">${e.gly.toFixed(2)} g/L</div>` : '';
  const meds = e.meds && e.meds.length ? `<span class="badge bg-secondary text-white">${e.meds.map(m=>m.name).join(', ')}</span>` : '';
  const obs = e.obs ? `<span class="text-muted ms-1 small">"${e.obs.length>40?e.obs.substring(0,40)+'...':e.obs}"</span>` : '';
  return `
  <div class="entry-card border-neutral" onclick="openEditModal(${e.id})">
    <div class="entry-header">
      <div class="entry-date">${dateStr} <span class="fw-normal text-muted ms-1">${e.cat}</span></div>
      <div class="entry-time">${e.time}</div>
    </div>
    <div class="d-flex align-items-center flex-wrap gap-2">
      ${gly}
      <div class="entry-badges d-flex align-items-center flex-wrap">
        ${meds}${obs}
      </div>
    </div>
  </div>
  `;
}

/* expose functions used by legacy index.html */
window.openNewEntryModal = (cat) => EntryUI.openNewEntryModal(globalUser, cat);
window.openEditModal = function(id) {
  // find entry and populate modal for editing
  const entries = EntryService.loadEntries(globalUser) || [];
  const ent = entries.find(x => x.id == id);
  if (!ent) return;
  document.getElementById('modalTitle').innerText = 'Modifier / Corriger';
  document.getElementById('editId').value = ent.id;
  document.getElementById('inDate').value = ent.date;
  document.getElementById('inTime').value = ent.time;
  document.getElementById('inGly').value = ent.gly || '';
  document.getElementById('inNovo').value = ent.novo || '';
  document.getElementById('inLantus').value = ent.lantus || '';
  document.getElementById('inObs').value = ent.obs || '';
  // set category and render meds
  selectCat(ent.cat);
  // pre-check meds that were snapshot (match by id)
  EntryUI.renderEntryMeds(globalUser, ent.cat);
  (ent.meds || []).forEach(m => {
    const el = document.getElementById(`entry_med_${m.id}`);
    if (el) el.checked = true;
  });
  const modal = new bootstrap.Modal(document.getElementById('entryModal'));
  modal.show();
};

window.deleteCurrentEntry = function() {
  const id = document.getElementById('editId').value;
  if (id && confirm('Supprimer définitivement cette entrée ?')) {
    EntryService.deleteEntry(globalUser, parseInt(id));
    renderAllEntriesAndStats();
    const modal = bootstrap.Modal.getInstance(document.getElementById('entryModal'));
    if (modal) modal.hide();
    showToast('Entrée supprimée', 'warning');
  }
};

/* minimal functions from old app integrated here if used in UI */
window.toggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const n = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', n);
  document.getElementById('themeIcon').className = n === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  localStorage.setItem('theme', n);
  showToast('Thème ' + (n==='dark'?'sombre':'clair') + ' activé', 'success');
};

window.backupData = function() {
  try {
    const entries = EntryService.loadEntries(globalUser) || [];
    const meds = loadMedsForUser(globalUser) || {};
    const payload = { version: DB_VERSION, user: globalUser, entries, meds, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup_${globalUser}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Sauvegarde créée', 'success');
  } catch(e){ console.error(e); showToast('Erreur sauvegarde', 'error'); }
};

window.importBackup = function() {
  document.getElementById('importInput').click();
};
document.getElementById('importInput').addEventListener('change', function(ev){
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !data.entries) { showToast('Fichier backup invalide', 'error'); return; }
      if (!confirm(`Importer ${data.entries.length} entrées pour ${data.user || globalUser} ?`)) return;
      // write entries and meds
      localStorage.setItem(DB_PREFIX + (data.user || globalUser) + '_data', JSON.stringify(data.entries));
      if (data.meds) localStorage.setItem(DB_PREFIX + (data.user || globalUser) + '_meds', JSON.stringify(data.meds));
      if (data.user) { globalUser = data.user; setLastUser(globalUser); document.getElementById('userName').innerText = globalUser; }
      renderAllMedPanels(globalUser);
      renderAllEntriesAndStats();
      showToast('Import réussi', 'success');
    } catch(err) { console.error(err); showToast('Erreur lecture fichier', 'error'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
});

window.exportExcel = function() {
  const entries = EntryService.loadEntries(globalUser) || [];
  exportEntriesToExcel(entries, `GlycoTrack_${globalUser}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
window.exportPDF = function() {
  const entries = EntryService.loadEntries(globalUser) || [];
  exportEntriesToPDF(entries, `GlycoTrack_${globalUser}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/* utility showToast wrapper to use module's function */
function showToast(m, t='success'){ toast(m, t); }
