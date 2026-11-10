/* PunctuAction — offline storage (IndexedDB for data & recordings, localStorage for settings).
   Nothing ever leaves the device unless the teacher exports it. */
(function () {
  const PA = (window.PA = window.PA || {});
  const DB_NAME = "punctuaction";
  const DB_VER = 1;
  const STORES = {
    pupils: "id",
    attempts: "id",
    recordings: "id",
    feedback: "id",
    models: "key",
    dialogues: "id",
    assignments: "id",
    lessons: "id",
    kv: "key"
  };
  let dbp = null;
  let memFallback = null; // used if IndexedDB is blocked (some private modes)

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VER); } catch (e) { memFallback = {}; return resolve(null); }
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const [name, key] of Object.entries(STORES)) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: key });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { console.warn("IndexedDB unavailable, using memory"); memFallback = {}; resolve(null); };
    });
    return dbp;
  }
  function mem(store) { memFallback[store] = memFallback[store] || new Map(); return memFallback[store]; }

  async function tx(store, mode, fn) {
    const db = await open();
    if (!db) return fn(null);
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      Promise.resolve(fn(s)).then((r) => (out = r));
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
    });
  }
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  const DB = {
    async get(store, key) {
      const db = await open();
      if (!db) return mem(store).get(key);
      return reqP(db.transaction(store).objectStore(store).get(key));
    },
    async all(store) {
      const db = await open();
      if (!db) return Array.from(mem(store).values());
      return reqP(db.transaction(store).objectStore(store).getAll());
    },
    async put(store, obj) {
      const db = await open();
      if (!db) { mem(store).set(obj[STORES[store]], obj); return obj; }
      await tx(store, "readwrite", (s) => s.put(obj));
      DB.emit(store);
      return obj;
    },
    async putMany(store, list) {
      const db = await open();
      if (!db) { list.forEach((o) => mem(store).set(o[STORES[store]], o)); return; }
      await tx(store, "readwrite", (s) => list.forEach((o) => s.put(o)));
      DB.emit(store);
    },
    async del(store, key) {
      const db = await open();
      if (!db) return mem(store).delete(key);
      await tx(store, "readwrite", (s) => s.delete(key));
      DB.emit(store);
    },
    async clear(store) {
      const db = await open();
      if (!db) return mem(store).clear();
      await tx(store, "readwrite", (s) => s.clear());
      DB.emit(store);
    },
    async where(store, fn) { return (await DB.all(store)).filter(fn); },
    stores: Object.keys(STORES),
    keyOf: (store) => STORES[store],
    _subs: {},
    on(store, fn) { (DB._subs[store] = DB._subs[store] || []).push(fn); },
    emit(store) { (DB._subs[store] || []).forEach((f) => { try { f(); } catch (e) {} }); }
  };

  /* Settings in localStorage (namespaced) */
  const NS = "pa:";
  const settings = {
    get(k, d) { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(NS + k); } catch (e) {} }
  };

  /* SHA-256 (pure JS so it also works on file:// and old tablets) */
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    const mp = Math.pow, maxWord = mp(2, 32);
    let result = "", words = [], asciiBitLength = ascii.length * 8;
    let hash = [], k = [], primeCounter = 0; const isComposite = {};
    for (let c = 2; primeCounter < 64; c++) {
      if (!isComposite[c]) {
        for (let i = 0; i < 313; i += c) isComposite[i] = c;
        hash[primeCounter] = (mp(c, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mp(c, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    ascii = unescape(encodeURIComponent(ascii)); asciiBitLength = ascii.length * 8;
    ascii += "\x80";
    while ((ascii.length % 64) - 56) ascii += "\x00";
    for (let i = 0; i < ascii.length; i++) { const j = ascii.charCodeAt(i); words[i >> 2] |= j << (((3 - i) % 4) * 8); }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (let j = 0; j < words.length;) {
      const w = words.slice(j, (j += 16)); const oldHash = hash; hash = hash.slice(0, 8);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2]; const a = hash[0], e = hash[4];
        const temp1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash); hash[4] = (hash[4] + temp1) | 0;
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? 0 : "") + b.toString(16); }
    return result;
  }

  PA.DB = DB;
  PA.settings = settings;
  PA.sha256 = sha256;
})();
