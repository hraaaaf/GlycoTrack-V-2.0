// entry.ui.js
import { blankEntry } from './entry.model.js';
import { addEntry, loadEntries, saveEntries, updateEntry } from './entry.service.js';
import { loadMedsForUser } from '../meds/med.service.js';
import { showToast } from '../core/toast.js';

export function openNewEntryModal(user, cat) {
  const now = new Date();
  document.getElementById('modalTitle').innerText = 'Nouvelle Entrée';
  document.getElementById('editId').value = '';
  document.getElementById('inDate').value = now.toISOString().split('T')[0];
  document.getElementById('inTime').value = now.toTimeString().slice(0,5);
  document.getElementById('inGly').value = '';
  document.getElementById('inNovo').value = '';
  document.getElementById('inLantus').value = '';
  document.getElementById('inObs').value = '';
  window.selectCat(cat);
  renderEntryMeds(user, cat);
  const modal = new bootstrap.Modal(document.getElementById('entryModal'));
  modal.show();
}

export function renderEntryMeds(user, cat) {
  const meds = loadMedsForUser(user)[cat] || [];
  const target = document.getElementById('medication-fields-'+cat);
  if (!target) return;
  target.innerHTML = meds.map(m => `
    <div class="d-flex align-items-center justify-content-between mb-2">
      <div class="d-flex align-items-center">
        <input class="form-check-input me-2" type="checkbox" id="entry_med_${m.id}">
        <div><b>${escape(m.name)}</b> <small class="text-muted ms-2">${escape(m.dose || '')}</small></div>
      </div>
    </div>
  `).join('');
  meds.forEach(m => {
    const el = document.getElementById(`entry_med_${m.id}`);
    if (el) el.checked = !!m.taken;
  });
}

function escape(s){ return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

export function collectSelectedMedsSnapshot(user, cat) {
  const meds = loadMedsForUser(user)[cat] || [];
  const takenList = [];
  meds.forEach(m => {
    const checkbox = document.getElementById(`entry_med_${m.id}`);
    if (checkbox && checkbox.checked) {
      takenList.push({ id: m.id, name: m.name, dose: m.dose, taken: true });
    }
  });
  return takenList;
}

export function saveEntryFromModal(user) {
  const date = document.getElementById('inDate').value;
  const time = document.getElementById('inTime').value;
  const glyRaw = document.getElementById('inGly').value;
  const gly = glyRaw ? parseFloat(glyRaw) : null;
  const novo = document.getElementById('inNovo').value ? parseFloat(document.getElementById('inNovo').value) : null;
  const lantus = document.getElementById('inLantus').value ? parseFloat(document.getElementById('inLantus').value) : null;
  const obs = document.getElementById('inObs').value.trim();
  const cat = window.currentCat || 'Matin';
  const editId = document.getElementById('editId').value;
  const medsSnapshot = collectSelectedMedsSnapshot(user, cat);

  if (!date) { showToast('Date requise', 'error'); return; }
  const entry = {
    id: editId ? parseInt(editId) : Date.now(),
    date, time, cat, gly, novo, lantus, obs,
    meds: medsSnapshot,
    createdAt: editId ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (editId) {
    updateEntry(user, entry.id, entry);
    showToast('Entrée mise à jour', 'success');
  } else {
    addEntry(user, entry);
    showToast('Entrée ajoutée', 'success');
  }
  // hide modal
  const me = document.getElementById('entryModal');
  const modal = bootstrap.Modal.getInstance(me);
  if (modal) modal.hide();
}
