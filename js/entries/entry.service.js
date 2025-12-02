// entry.service.js
import { DB_PREFIX } from '../core/storage.js';

const KEY = (user) => `${DB_PREFIX}${user}_data`;

export function loadEntries(user) {
  const raw = localStorage.getItem(KEY(user));
  try { return raw ? JSON.parse(raw) : []; } catch(e){ console.error(e); return []; }
}
export function saveEntries(user, entries) {
  try { localStorage.setItem(KEY(user), JSON.stringify(entries)); return true; } catch(e){ console.error(e); return false; }
}
export function addEntry(user, entry) {
  const list = loadEntries(user);
  list.unshift(entry); // put latest first
  saveEntries(user, list);
}
export function updateEntry(user, entryId, newData) {
  const list = loadEntries(user);
  const idx = list.findIndex(e => e.id == entryId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...newData, updatedAt: new Date().toISOString() };
  saveEntries(user, list);
  return true;
}
export function deleteEntry(user, entryId) {
  let list = loadEntries(user);
  list = list.filter(e => e.id != entryId);
  saveEntries(user, list);
}
