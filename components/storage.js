export const S = {
  get: async (k) => {
    try {
      if (window.storage) { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; }
    } catch {}
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  set: async (k, v) => {
    try {
      if (window.storage) { await window.storage.set(k, JSON.stringify(v)); return; }
    } catch {}
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
};
