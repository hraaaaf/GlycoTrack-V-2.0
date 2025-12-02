// entry.model.js
export function blankEntry() {
  return {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0,5),
    cat: 'Matin',
    gly: null,
    novo: null,
    lantus: null,
    obs: '',
    meds: [], // snapshot array [{id,name,dose,taken}]
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
