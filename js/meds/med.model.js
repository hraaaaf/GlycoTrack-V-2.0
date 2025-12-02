// med.model.js
export function emptyMed() {
  return { id: Date.now() + Math.floor(Math.random()*1000), name: '', dose: '', taken: false };
}
export function defaultMedStructure() {
  return { Matin: [], Midi: [], Soir: [], Divers: [] };
}
