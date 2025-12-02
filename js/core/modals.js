// modals.js
let medEditModalInstance = null;

export function initModals() {
  const el = document.getElementById('medEditModal');
  if (el && window.bootstrap) medEditModalInstance = new bootstrap.Modal(el);
}

export function openMedEditModal({cat, med=null}) {
  document.getElementById('medEditCat').value = cat;
  document.getElementById('medEditId').value = med ? med.id : '';
  document.getElementById('medEditName').value = med ? med.name : '';
  document.getElementById('medEditDose').value = med ? med.dose : '';
  document.getElementById('medEditTaken').checked = med ? !!med.taken : false;
  document.getElementById('medEditModalTitle').innerText = med ? `Modifier (${cat})` : `Ajouter (${cat})`;
  if (medEditModalInstance) medEditModalInstance.show();
}

export function closeMedEditModal() {
  if (medEditModalInstance) medEditModalInstance.hide();
}
