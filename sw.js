/* Service worker: rende l'app installabile da Chrome e utilizzabile anche senza internet.
   Strategia "prima la rete": se c'è connessione si scarica sempre l'ultima versione
   (così gli aggiornamenti pubblicati arrivano subito); se manca, si usa la copia salvata.
   Non tocca mai i report: quelli stanno nella cartella del dispositivo / nel browser. */
const CACHE = 'scout-v20261022a';
const CORE = ['./', 'index.html', 'i18n.js', 'giocatori.js', 'charts.js', 'scouting_report.js',
  'branding.js', 'folder_sync.js', 'fonts/fonts.css', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
