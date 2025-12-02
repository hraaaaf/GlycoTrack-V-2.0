// toast.js
export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) { console.warn('toastContainer manquant'); alert(message); return; }
  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;
  let icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠';
  toast.innerHTML = `<div style="font-size:1.5rem">${icon}</div><div style="flex:1; color: var(--text-dark)">${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
