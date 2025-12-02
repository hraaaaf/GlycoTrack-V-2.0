// med.ui.js
import { loadMedsForUser, addMed, updateMed, deleteMed, toggleTaken } from './med.service.js';
import { openMedEditModal } from '../core/modals.js';
import { showToast } from '../core/toast.js';

export function renderMedList(user, cat, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const meds = loadMedsForUser(user)[cat] || [];
  if (meds.length === 0) {
    container.innerHTML = `<div class="text-muted fst-italic">Aucun médicament pour ${cat}</div>`;
    return;
  }
  container.innerHTML = meds.map(m => medRowHTML(m)).join('');
  meds.forEach(m => {
    const chk = document.getElementById(`med_chk_${m.id}`);
    if (chk) chk.onchange = () => {
      toggleTaken(user, cat, m.id, chk.checked);
      showToast(`${m.name || 'Médicament'} (${cat}) marqué ${chk.checked ? 'pris' : 'non pris'}`, 'success');
      renderMedList(user, cat, containerId);
    };
    const editBtn = document.getElementById(`med_edit_${m.id}`);
    if (editBtn) editBtn.onclick = () => openMedEditModal({cat, med: m});
    const delBtn = document.getElementById(`med_del_${m.id}`);
    if (delBtn) delBtn.onclick = () => {
      if (confirm(`Supprimer ${m.name || 'ce médicament'} ?`)) {
        deleteMed(user, cat, m.id);
        renderMedList(user, cat, containerId);
        showToast('Médicament supprimé', 'warning');
      }
    };
  });
}

function medRowHTML(m) {
  const checked = m.taken ? 'checked' : '';
  const name = escapeHtml(m.name || '—');
  const dose = m.dose ? `<small class="text-muted ms-2">${escapeHtml(m.dose)}</small>` : '';
  return `
  <div class="d-flex align-items-center justify-content-between py-2 border-bottom">
    <div class="d-flex align-items-center">
      <input class="form-check-input me-2" type="checkbox" id="med_chk_${m.id}" ${checked}>
      <div>
        <div><b>${name}</b> ${dose}</div>
      </div>
    </div>
    <div class="btn-group btn-group-sm">
      <button class="btn btn-outline-secondary" id="med_edit_${m.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-outline-danger" id="med_del_${m.id}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
    </div>
  </div>
  `;
}

function escapeHtml(s){ return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

export function addMedQuick(user, cat, onComplete=null) {
  const med = addMed(user, cat, null);
  showToast('Médicament ajouté (éditer maintenant)', 'success');
  openMedEditModal({cat, med});
  if (onComplete) onComplete();
}
