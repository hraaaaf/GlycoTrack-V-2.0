// med.service.js
import { DB_PREFIX } from '../core/storage.js';
import { defaultMedStructure, emptyMed } from './med.model.js';

const KEY = (user) => `${DB_PREFIX}${user}_meds`;

export function loadMedsForUser(user) {
  const raw = localStorage.getItem(KEY(user));
  try {
    return raw ? JSON.parse(raw) : defaultMedStructure();
  } catch(e) {
    console.error('loadMeds error', e);
    return defaultMedStructure();
  }
}

export function saveMedsForUser(user, meds) {
  try { localStorage.setItem(KEY(user), JSON.stringify(meds)); return true; } catch(e) { console.error(e); return false; }
}

export function addMed(user, cat, medObj=null) {
  const meds = loadMedsForUser(user);
  meds[cat] = meds[cat] || [];
  const med = medObj || emptyMed();
  meds[cat].push(med);
  saveMedsForUser(user, meds);
  return med;
}

export function updateMed(user, cat, medId, data) {
  const meds = loadMedsForUser(user);
  meds[cat] = meds[cat] || [];
  const idx = meds[cat].findIndex(m => m.id == medId);
  if (idx === -1) return null;
  meds[cat][idx] = { ...meds[cat][idx], ...data };
  saveMedsForUser(user, meds);
  return meds[cat][idx];
}

export function deleteMed(user, cat, medId) {
  const meds = loadMedsForUser(user);
  meds[cat] = (meds[cat] || []).filter(m => m.id != medId);
  saveMedsForUser(user, meds);
}

export function toggleTaken(user, cat, medId, val=null) {
  const meds = loadMedsForUser(user);
  meds[cat] = meds[cat] || [];
  const m = meds[cat].find(x => x.id == medId);
  if (!m) return null;
  m.taken = (val === null ? !m.taken : !!val);
  saveMedsForUser(user, meds);
  return m;
}

/* helper to migrate older single-name meds (if present) */
export function migrateOldMealMedsIfAny(user) {
  try {
    const oldRaw = localStorage.getItem(DB_PREFIX + user + '_mealmeds');
    if (!oldRaw) return false;
    const old = JSON.parse(oldRaw);
    const meds = loadMedsForUser(user);
    let changed = false;
    ['Matin','Midi','Soir','Divers'].forEach(cat => {
      if (old[cat] && old[cat].trim()) {
        meds[cat] = meds[cat] || [];
        // if no meds exist for this cat, create one
        if (meds[cat].length === 0) {
          meds[cat].push({ id: Date.now() + Math.floor(Math.random()*1000), name: old[cat], dose: '', taken: false });
          changed = true;
        }
      }
    });
    if (changed) saveMedsForUser(user, meds);
    // remove old key (optional)
    // localStorage.removeItem(DB_PREFIX + user + '_mealmeds');
    return changed;
  } catch(e) { console.error('migration error', e); return false; }
}
