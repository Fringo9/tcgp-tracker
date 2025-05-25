const VERSION = "v7";
const CACHE_NAME = `tcgp-shell-${VERSION}`;
const SHELL = [
  "./",
  "./index.html",
  "./main.js",
  "./manifest.json",
  "./mc-worker.js",
  "./libs/chart.esm.js",
  "./libs/chart.js",
  "./libs/fb-app.js",
  "./libs/fb-auth.js",
  "./libs/fb-store.js",
  "./icon-192.png",
  "./icon-512.png",
];

// 1) Al momento dell’installazione pre-cache dell’app shell
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
});

// 2) Gestione fetch: offline-first SOLO per asset ⇒
//    fallback shell SOLO per richieste di navigazione
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 2A. Se è una richiesta di pagina (reload, link interno, “open-in-new-tab”)
  if (req.mode === "navigate") {
    event.respondWith(
      caches
        .match("./index.html") // usa lo shell precache
        .then((resp) => resp || fetch(req))
        .catch(() => caches.match("./index.html"))
    );
    return; // esci: nav gestita
  }

  // 2B. Per TUTTI gli altri GET dello stesso dominio (js, css, img…)
  if (req.method === "GET" && new URL(req.url).origin === location.origin) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  }
});

// 3) Al activate, pulisci eventuali cache vecchie
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});
