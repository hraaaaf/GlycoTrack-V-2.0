// storage.js
export const DB_PREFIX = 'glycotrack_v9_';
export const DB_VERSION = 9;

export function safeLocalGet(key) {
  try { return localStorage.getItem(key); } catch(e) { console.error(e); return null; }
}
export function safeLocalSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch(e){ console.error(e); return false; }
}
export function safeLocalRemove(key) {
  try { localStorage.removeItem(key); } catch(e){ console.error(e); }
}

export function getLastUser() {
  return safeLocalGet('glyco_last_user') || null;
}
export function setLastUser(name) {
  safeLocalSet('glyco_last_user', name);
}

/* simple migration helper */
export function setAppVersion(v) {
  safeLocalSet(DB_PREFIX + 'version', String(v));
}
export function getAppVersion() {
  return parseInt(safeLocalGet(DB_PREFIX + 'version') || '0', 10);
}
