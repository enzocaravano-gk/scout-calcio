/* ============================================================================
   FOLDER SYNC — i report scouting salvati in una cartella del PROPRIO dispositivo.

   L'utente sceglie una cartella una volta sola (es. "Documenti/Scout dati").
   Da lì in poi ogni report viene scritto come file .json leggibile, uno per
   valutazione, e all'apertura dell'app (e ogni volta che si torna sulla scheda
   del browser) la cartella viene riletta: un report copiato lì dentro, anche
   ricevuto da un collega, compare da solo. Nulla viene caricato online.

   Usa la File System Access API: disponibile su Chrome, Edge, Opera, Brave
   (computer). Safari e Firefox non la offrono: lì restano Esporta/Importa backup.

   Sincronizzazione (localStorage = copia di lavoro, cartella = archivio):
   - report presente solo nella cartella            → viene aggiunto all'app
   - report solo nell'app, mai stato nella cartella  → viene scritto nella cartella
   - report solo nell'app ma già sincronizzato prima → è stato cancellato dalla
     cartella a mano: viene tolto anche dall'app
   - stesso report in entrambi → vince la versione modificata più di recente
   - eliminato nell'app mentre la cartella non era collegata → cancellato al
     prossimo collegamento (lista 'scout_folder_deleted')

   Espone: window.FolderSync = { supported, state(), connect(), reconnect(),
           disconnect(), sync(), exportBackup(), importBackup(file) }
   Evento: 'folderStateChanged' quando cambia lo stato.
   ==========================================================================*/
(function () {
  'use strict';

  const supported = typeof window.showDirectoryPicker === 'function';
  const K_SYNCED = 'scout_folder_synced', K_DELETED = 'scout_folder_deleted';
  const DB = 'scout-folder', STORE = 'handles', HKEY = 'dir';

  let dir = null;                 // FileSystemDirectoryHandle
  let status = 'none';            // none | need-permission | connected | error
  let count = 0, lastSync = null, lastError = '';
  let fileById = new Map();       // id report → nome file nella cartella
  let syncing = null;

  // ---- piccoli helper ------------------------------------------------------
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const emit = () => { try { window.dispatchEvent(new CustomEvent('folderStateChanged')); } catch (e) {} };
  const store = () => window.ScoutReport && window.ScoutReport._store;
  const stamp = r => r.updated_at || r.created_at || '';
  const isReport = r => r && typeof r === 'object' && !Array.isArray(r) && typeof r.id === 'string' && (r.nome || r.cognome);
  const slug = s => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  // nome file leggibile: Cognome-Nome_2026-10-01_<id>.json
  const fileName = r => [slug(r.cognome) || 'report', slug(r.nome)].filter(Boolean).join('-') +
    (r.data_osservazione ? '_' + slug(r.data_osservazione) : '') + '_' + r.id + '.json';

  // ---- IndexedDB: il "collegamento" alla cartella sopravvive alla chiusura del browser ----
  function idb(mode, fn) {
    return new Promise((resolve, reject) => {
      const rq = indexedDB.open(DB, 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
      rq.onerror = () => reject(rq.error);
      rq.onsuccess = () => {
        const tx = rq.result.transaction(STORE, mode), st = tx.objectStore(STORE);
        const r = fn(st);
        tx.oncomplete = () => { resolve(r && r.result); rq.result.close(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }
  const saveHandle = h => idb('readwrite', st => st.put(h, HKEY));
  const loadHandle = () => idb('readonly', st => st.get(HKEY)).catch(() => null);
  const dropHandle = () => idb('readwrite', st => st.delete(HKEY)).catch(() => {});

  function setStatus(s, err) { status = s; lastError = err || ''; emit(); }

  // ---- lettura / scrittura file ---------------------------------------------
  async function readFolder() {
    const found = new Map();
    for await (const [name, h] of dir.entries()) {
      if (h.kind !== 'file' || !/\.json$/i.test(name)) continue;
      try {
        const r = JSON.parse(await (await h.getFile()).text());
        if (!isReport(r)) continue;
        const prev = found.get(r.id);
        if (!prev || stamp(r) > stamp(prev.rep)) found.set(r.id, { rep: r, file: name });
      } catch (e) { /* file non valido: ignorato, non si tocca */ }
    }
    return found;
  }
  async function writeReport(r) {
    const name = fileName(r), old = fileById.get(r.id);
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(r, null, 2));
    await w.close();
    if (old && old !== name) { try { await dir.removeEntry(old); } catch (e) {} }   // nome cambiato (es. cognome corretto)
    fileById.set(r.id, name);
  }
  async function deleteReport(id) {
    const name = fileById.get(id);
    if (name) { try { await dir.removeEntry(name); } catch (e) {} }
    fileById.delete(id);
  }

  // ---- sincronizzazione ------------------------------------------------------
  function sync() {
    if (status !== 'connected' || !dir || !store()) return Promise.resolve();
    if (syncing) return syncing;
    syncing = (async () => {
      try {
        const folder = await readFolder();
        fileById = new Map([...folder].map(([id, f]) => [id, f.file]));
        const local = store().all();
        const synced = new Set(lsGet(K_SYNCED, []));
        const deleted = new Set(lsGet(K_DELETED, []));
        const result = new Map();

        for (const [id, f] of folder) {
          if (deleted.has(id)) { await deleteReport(id); continue; }
          result.set(id, f.rep);
        }
        for (const r of local) {
          if (!isReport(r) || deleted.has(r.id)) continue;
          const f = folder.get(r.id);
          if (f) { if (stamp(r) > stamp(f.rep)) { await writeReport(r); result.set(r.id, r); } }
          else if (synced.has(r.id)) { /* tolto dalla cartella a mano → tolto anche qui */ }
          else { await writeReport(r); result.set(r.id, r); }
        }

        const list = [...result.values()];
        const changed = JSON.stringify(list.map(r => r.id + stamp(r)).sort()) !==
                        JSON.stringify(local.map(r => r.id + stamp(r)).sort());
        if (changed) store().replaceAll(list);
        lsSet(K_SYNCED, list.map(r => r.id));
        lsSet(K_DELETED, []);
        count = list.length; lastSync = new Date();
        setStatus('connected');
      } catch (e) {
        // permesso revocato o cartella spostata/eliminata
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) setStatus('need-permission');
        else if (e && e.name === 'NotFoundError') setStatus('error', 'not-found');
        else setStatus('error', (e && e.message) || 'error');
      } finally { syncing = null; }
    })();
    return syncing;
  }

  // salvataggi ed eliminazioni fatti nell'app → subito anche nella cartella
  function hookStore() {
    const s = store(); if (!s || !s.onSave) return;
    s.onSave(r => {
      if (status !== 'connected') return;
      writeReport(r).then(() => {
        const ids = new Set(lsGet(K_SYNCED, [])); ids.add(r.id); lsSet(K_SYNCED, [...ids]);
        count = s.all().length; lastSync = new Date(); emit();
      }).catch(() => setStatus('need-permission'));
    });
    s.onRemove(id => {
      if (status === 'connected') {
        deleteReport(id).then(() => {
          lsSet(K_SYNCED, lsGet(K_SYNCED, []).filter(x => x !== id));
          count = s.all().length; emit();
        });
      } else if (dir) {
        const del = new Set(lsGet(K_DELETED, [])); del.add(id); lsSet(K_DELETED, [...del]);
      }
    });
  }

  // ---- collegamento ----------------------------------------------------------
  async function connect() {
    if (!supported) return;
    let h;
    try { h = await window.showDirectoryPicker({ id: 'scout-dati', mode: 'readwrite', startIn: 'documents' }); }
    catch (e) { return; }   // finestra chiusa senza scegliere
    dir = h;
    // cartella nuova: si parte "da zero" (i report dell'app vengono copiati dentro, nessuno viene tolto)
    lsSet(K_SYNCED, []); lsSet(K_DELETED, []);
    await saveHandle(h).catch(() => {});
    setStatus('connected');
    await sync();
  }
  // il browser chiede di nuovo il permesso a ogni avvio (Chrome offre "Consenti a ogni visita"):
  // richiede un click dell'utente, per questo serve il pulsante "Ricollega cartella"
  async function reconnect() {
    if (!dir) return connect();
    try {
      const p = await dir.requestPermission({ mode: 'readwrite' });
      if (p === 'granted') { setStatus('connected'); await sync(); }
      else setStatus('need-permission');
    } catch (e) { setStatus('error', 'not-found'); }
  }
  async function disconnect() {
    dir = null; fileById = new Map(); count = 0; lastSync = null;
    lsSet(K_SYNCED, []); lsSet(K_DELETED, []);
    await dropHandle();
    setStatus('none');
  }

  // ---- backup (funziona in tutti i browser) ------------------------------------
  function exportBackup() {
    const list = store() ? store().all() : [];
    const blob = new Blob([JSON.stringify({ app: 'scout-calcio', tipo: 'backup-report', creato: new Date().toISOString(), report: list }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scout_report_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return list.length;
  }
  // accetta un backup ({report:[...]}), un elenco [...] o un singolo report;
  // unisce senza cancellare nulla: a parità di report tiene la versione più recente
  async function importBackup(file) {
    const data = JSON.parse(await file.text());
    const incoming = (Array.isArray(data) ? data : Array.isArray(data && data.report) ? data.report : [data]).filter(isReport);
    if (!incoming.length) throw new Error('empty');
    const s = store(), byId = new Map(s.all().map(r => [r.id, r]));
    let added = 0, updated = 0;
    incoming.forEach(r => {
      const cur = byId.get(r.id);
      if (!cur) { byId.set(r.id, r); added++; }
      else if (stamp(r) > stamp(cur)) { byId.set(r.id, r); updated++; }
    });
    s.replaceAll([...byId.values()]);
    if (status === 'connected') await sync();   // e li scrive anche nella cartella
    return { added, updated };
  }

  function state() {
    return { supported, status, name: dir ? dir.name : '', count, lastSync, lastError };
  }

  // ---- avvio -------------------------------------------------------------------
  async function init() {
    hookStore();
    if (!supported) { emit(); return; }
    const h = await loadHandle();
    if (!h) { emit(); return; }
    dir = h;
    let p = 'prompt';
    try { p = await h.queryPermission({ mode: 'readwrite' }); } catch (e) {}
    if (p === 'granted') { setStatus('connected'); await sync(); }
    else setStatus('need-permission');
  }
  // tornando sulla scheda dell'app la cartella viene riletta (es. file aggiunti da Finder)
  let lastFocusSync = 0;
  function onReturn() {
    if (document.visibilityState !== 'visible' || status !== 'connected') return;
    if (Date.now() - lastFocusSync < 2000) return;
    lastFocusSync = Date.now(); sync();
  }
  document.addEventListener('visibilitychange', onReturn);
  window.addEventListener('focus', onReturn);

  window.FolderSync = { supported, state, connect, reconnect, disconnect, sync, exportBackup, importBackup, ready: null };
  window.FolderSync.ready = init();
})();
